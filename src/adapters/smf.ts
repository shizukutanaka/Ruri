/** Standard MIDI File (SMF Type 0) encoder + minimal decoder. Zero-dep, byte-exact. */

import { type Chord, realizeChordFreqs } from '../core/chord.js';
import { freqToMidiFloat } from '../core/midi.js';
import { optimalChordOrder, rankedChordToChord } from '../core/chord-search.js';
import { type Scale, rankScaleChords, scaleToFreqs } from '../core/scale.js';
import { type TuningSystem } from '../core/tuning.js';
import { type ChordSearchOptions } from '../core/chord-search.js';

export interface NoteEvent {
  readonly note: number; // 0..127
  readonly velocity: number; // 1..127
  readonly startTicks: number;
  readonly durationTicks: number;
  readonly channel: number; // 0..15
}

export interface SmfOptions {
  /** Ticks per quarter note (division). */
  readonly ppq: number;
}

const DEFAULT_PPQ = 480;

/** Variable-length quantity (MIDI VLQ): 7 bits per byte, MSB = continuation. */
export function encodeVlq(value: number): number[] {
  if (value < 0 || !Number.isInteger(value)) {
    throw new RangeError(`VLQ requires a non-negative integer, got ${value}`);
  }
  const bytes = [value & 0x7f];
  let v = value >> 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

/** Decode a VLQ at `offset`; returns the value and the number of bytes consumed. */
export function decodeVlq(bytes: Uint8Array, offset: number): { value: number; length: number } {
  let value = 0;
  let length = 0;
  for (;;) {
    const b = bytes[offset + length];
    if (b === undefined) throw new RangeError('VLQ truncated');
    value = (value << 7) | (b & 0x7f);
    length++;
    if ((b & 0x80) === 0) break;
  }
  return { value, length };
}

const str = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const u32 = (n: number): number[] => [
  (n >>> 24) & 0xff,
  (n >>> 16) & 0xff,
  (n >>> 8) & 0xff,
  n & 0xff,
];
const u16 = (n: number): number[] => [(n >>> 8) & 0xff, n & 0xff];

interface AbsEvent {
  readonly tick: number;
  readonly data: number[];
  readonly order: number; // tie-break: note-off (0) before note-on (1) at same tick
}

/** Build the Type-0 track body (events + end-of-track) from notes. */
function trackBytes(notes: readonly NoteEvent[]): number[] {
  const events: AbsEvent[] = [];
  for (const n of notes) {
    if (n.note < 0 || n.note > 127) throw new RangeError(`note out of range: ${n.note}`);
    if (n.channel < 0 || n.channel > 15) throw new RangeError(`channel out of range: ${n.channel}`);
    events.push({
      tick: n.startTicks,
      data: [0x90 | n.channel, n.note, n.velocity],
      order: 1,
    });
    events.push({
      tick: n.startTicks + n.durationTicks,
      data: [0x80 | n.channel, n.note, 0],
      order: 0,
    });
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const body: number[] = [];
  let prevTick = 0;
  for (const e of events) {
    body.push(...encodeVlq(e.tick - prevTick), ...e.data);
    prevTick = e.tick;
  }
  body.push(...encodeVlq(0), 0xff, 0x2f, 0x00); // end of track
  return body;
}

/** Encode notes to a complete SMF Type-0 file. */
export function encodeSmf(
  notes: readonly NoteEvent[],
  opts: SmfOptions = { ppq: DEFAULT_PPQ },
): Uint8Array {
  const track = trackBytes(notes);
  const header = [...str('MThd'), ...u32(6), ...u16(0), ...u16(1), ...u16(opts.ppq)];
  const trackChunk = [...str('MTrk'), ...u32(track.length), ...track];
  return new Uint8Array([...header, ...trackChunk]);
}

/**
 * Minimal decoder: extract note-on/off pairs back into NoteEvents.
 *
 * **Scope**: designed exclusively to round-trip output produced by `encodeSmf` from
 * this library.  `encodeSmf` always emits explicit status bytes and never emits
 * Program Change, SysEx, or System Real-Time messages, so this decoder does not need
 * to handle them.  If fed arbitrary external MIDI files:
 * - Running status after meta events (`0xFF`) will be misinterpreted (the decoder
 *   sets `running = 0xFF` after meta events; a subsequent running-status note event
 *   would be parsed as another meta event, corrupting the stream).
 * - Program Change / Channel Pressure (1-byte data) and SysEx (variable-length) in
 *   the else-branch would mis-advance `p` by exactly 2 bytes, misaligning all reads.
 *
 * Do **not** use this as a general-purpose SMF parser.
 */
export function decodeSmf(bytes: Uint8Array): { ppq: number; notes: NoteEvent[] } {
  const ascii = (o: number, n: number): string =>
    String.fromCharCode(...Array.from(bytes.slice(o, o + n)));
  if (ascii(0, 4) !== 'MThd') throw new RangeError('not an SMF (missing MThd)');
  const ppq = (bytes[12]! << 8) | bytes[13]!;
  if (ascii(14, 4) !== 'MTrk') throw new RangeError('missing MTrk');

  let p = 22; // after MTrk + length
  let tick = 0;
  let running = 0;
  const open = new Map<number, { note: NoteEvent; start: number }>();
  const notes: NoteEvent[] = [];

  while (p < bytes.length) {
    const dt = decodeVlq(bytes, p);
    tick += dt.value;
    p += dt.length;
    let status = bytes[p]!;
    if (status & 0x80) p++;
    else status = running; // running status
    running = status;

    const type = status & 0xf0;
    const channel = status & 0x0f;
    if (type === 0x90 || type === 0x80) {
      const note = bytes[p++]!;
      const vel = bytes[p++]!;
      const key = (channel << 8) | note;
      if (type === 0x90 && vel > 0) {
        open.set(key, {
          note: { note, velocity: vel, startTicks: tick, durationTicks: 0, channel },
          start: tick,
        });
      } else {
        const o = open.get(key);
        if (o) {
          notes.push({ ...o.note, durationTicks: tick - o.start });
          open.delete(key);
        }
      }
    } else if (status === 0xff) {
      const metaType = bytes[p++]!;
      const len = decodeVlq(bytes, p);
      p += len.length + len.value;
      if (metaType === 0x2f) break; // end of track
    } else {
      p += 2; // skip other channel messages (2 data bytes)
    }
  }
  notes.sort((a, b) => a.startTicks - b.startTicks || a.note - b.note);
  return { ppq, notes };
}

export interface ChordToSmfOptions {
  /** Ticks per quarter note. Default 480. */
  readonly ppq?: number;
  /** Duration of the chord in ticks. Default 480 (one quarter note). */
  readonly durationTicks?: number;
  /** MIDI velocity (1..127). Default 90. */
  readonly velocity?: number;
  /** MIDI channel (0..15). Default 0. */
  readonly channel?: number;
  /** Reference frequency for A4 (Hz). Default 440. */
  readonly a4Hz?: number;
}

/**
 * Convert a `Chord` directly to a SMF Type-0 MIDI file byte sequence.
 *
 * Socratic Q58: `chordFromSemitones` creates a `Chord`; `realizeChordFreqs`
 * gives Hz; `encodeSmf` turns note events into a MIDI file — but the bridge
 * from a `Chord` object to a `.mid` file requires three manual steps: realize
 * freqs → convert Hz to MIDI pitch → build NoteEvent list → encodeSmf.
 * A single `chordToSmf(chord, rootHz)` closes this pipeline.
 *
 * Hz → MIDI pitch conversion rounds to the nearest integer note number, so
 * microtonal frequencies are mapped to the closest 12-TET semitone (information
 * loss is expected — MIDI pitch is inherently 12-TET). For microtonal precision,
 * use MPE (pitch bend per channel) via `freqToMpe` instead.
 *
 * @throws {RangeError} if any realized frequency maps to a MIDI note outside [0, 127].
 *
 * @example
 * const chord = chordFromSemitones('major', [0, 4, 7]);
 * const midi = chordToSmf(chord, 261.63);
 * await fs.writeFile('major.mid', midi);
 */
export function chordToSmf(chord: Chord, rootHz: number, opts?: ChordToSmfOptions): Uint8Array {
  const ppq = opts?.ppq ?? DEFAULT_PPQ;
  const durationTicks = opts?.durationTicks ?? ppq;
  const velocity = opts?.velocity ?? 90;
  const channel = opts?.channel ?? 0;
  const a4Hz = opts?.a4Hz ?? 440;

  const freqs = realizeChordFreqs(chord, rootHz);
  const notes: NoteEvent[] = freqs.map((hz) => {
    const midiFloat = freqToMidiFloat(hz, a4Hz);
    const note = Math.round(midiFloat);
    if (note < 0 || note > 127) {
      throw new RangeError(
        `chord frequency ${hz.toFixed(2)} Hz maps to MIDI note ${note}, which is outside [0, 127]`,
      );
    }
    return { note, velocity, startTicks: 0, durationTicks, channel };
  });

  return encodeSmf(notes, { ppq });
}

export type ProgressionToSmfOptions = ChordToSmfOptions;

/**
 * Convert a `Chord[]` progression directly to a SMF Type-0 MIDI file byte sequence.
 *
 * Socratic Q58 (extended): `chordToSmf` turns a single `Chord` into a `.mid` file —
 * but a chord *progression* (e.g. ii–V–I) requires manually mapping each chord to a
 * tick offset and concatenating `NoteEvent` lists. If `Chord[]` is the creative output
 * of `rankChords → rankedChordToChord → optimalChordOrder`, writing it to MIDI should
 * be one call. This closes the full pipeline:
 * `rankChords → rankedChordToChord → optimalChordOrder → progressionToSmf → write .mid`.
 *
 * Each chord occupies `durationTicks` ticks in sequence (back-to-back, no gap).
 * All notes in a given chord share the same start tick and duration.
 *
 * Hz → MIDI pitch conversion rounds to the nearest semitone (same caveat as `chordToSmf`).
 *
 * @throws {RangeError} if any realized frequency maps to a MIDI note outside [0, 127].
 * @throws {RangeError} if `chords` is empty.
 *
 * @example
 * const ranked = rankChords(edo(12), { size: 3, limit: 4 });
 * const portable = ranked.map(r => rankedChordToChord(r));
 * const { chords } = optimalChordOrder(portable, 261.63);
 * const midi = progressionToSmf(chords, 261.63);
 * await fs.writeFile('progression.mid', midi);
 */
export function progressionToSmf(
  chords: readonly Chord[],
  rootHz: number,
  opts?: ProgressionToSmfOptions,
): Uint8Array {
  if (chords.length === 0) throw new RangeError('chords must be non-empty');

  const ppq = opts?.ppq ?? DEFAULT_PPQ;
  const durationTicks = opts?.durationTicks ?? ppq;
  const velocity = opts?.velocity ?? 90;
  const channel = opts?.channel ?? 0;
  const a4Hz = opts?.a4Hz ?? 440;

  const notes: NoteEvent[] = [];
  for (let ci = 0; ci < chords.length; ci++) {
    const chord = chords[ci] as Chord;
    const startTicks = ci * durationTicks;
    const freqs = realizeChordFreqs(chord, rootHz);
    for (const hz of freqs) {
      const midiFloat = freqToMidiFloat(hz, a4Hz);
      const note = Math.round(midiFloat);
      if (note < 0 || note > 127) {
        throw new RangeError(
          `chord[${ci}] frequency ${hz.toFixed(2)} Hz maps to MIDI note ${note}, which is outside [0, 127]`,
        );
      }
      notes.push({ note, velocity, startTicks, durationTicks, channel });
    }
  }

  return encodeSmf(notes, { ppq });
}

export type OptimalProgressionSmfOptions = ProgressionToSmfOptions;

/**
 * Optimize a chord progression's order and encode it as a SMF Type-0 MIDI file
 * in one call.
 *
 * Socratic Q65: `optimalChordOrder(chords, rootHz)` finds the voice-leading-minimal
 * permutation of a `Chord[]`; `progressionToSmf(chords, rootHz)` converts a `Chord[]`
 * to MIDI. But going from "Chord[] → optimal order → MIDI" still requires two calls.
 * An `optimalProgressionSmf(chords, rootHz, opts?)` closes this pipeline: internally
 * calls `optimalChordOrder` to reorder, then `progressionToSmf` on the result.
 *
 * The reordering minimises total voice-leading cost across the progression (brute-force
 * for n ≤ 8 chords; nearest-neighbour heuristic for n > 8).
 *
 * @throws {RangeError} if `chords` is empty.
 * @throws {RangeError} if any realized frequency maps to a MIDI note outside [0, 127].
 *
 * @example
 * const ranked = rankChords(edo(12), { size: 3, limit: 5 });
 * const portable = ranked.map(r => rankedChordToChord(r));
 * // One call: optimise order AND write MIDI
 * const midi = optimalProgressionSmf(portable, 261.63);
 * await fs.writeFile('progression.mid', midi);
 */
export function optimalProgressionSmf(
  chords: readonly Chord[],
  rootHz: number,
  opts?: OptimalProgressionSmfOptions,
): Uint8Array {
  if (chords.length === 0) throw new RangeError('chords must be non-empty');
  const { chords: ordered } = optimalChordOrder(chords, rootHz);
  return progressionToSmf(ordered, rootHz, opts);
}

export interface ScaleChordProgressionSmfOptions extends OptimalProgressionSmfOptions {
  /** Chord search options (size, limit, spectrum). */
  readonly searchOpts?: ChordSearchOptions;
}

/**
 * Discover the best diatonic chords from a scale and write them to a MIDI file in one call.
 *
 * Socratic Q75: `rankScaleChords(scale, tuning, opts)` finds consonant chords within
 * a scale; `rankedChordToChord` lifts each to a portable `Chord`; `optimalChordOrder`
 * minimises voice-leading cost across the progression; `progressionToSmf` encodes to
 * MIDI bytes. Going from "I have a scale" to "I have a playable MIDI chord progression"
 * requires four explicit calls and two intermediate arrays. If scale-based chord
 * discovery is truly first-class, the entire pipeline — scale → optimal MIDI
 * progression — should be one call.
 *
 * @param scale   - The melodic scale whose diatonic chords to explore.
 * @param tuning  - The tuning system the scale belongs to.
 * @param rootHz  - Absolute frequency (Hz) of the chord root (used for voice-leading
 *                  optimisation and MIDI pitch mapping).
 * @param opts    - Optional chord search parameters (size, limit, spectrum) and SMF
 *                  encoding parameters (ppq, durationTicks, velocity, channel, a4Hz).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if no chords are found (scale too small for the requested size).
 * @throws {RangeError} if any realized frequency maps to a MIDI note outside [0, 127].
 *
 * @example
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-edo',
 *                         degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const midi = scaleChordProgressionSmf(major, edo(12), 261.63);
 * await fs.writeFile('progression.mid', midi);
 */
export function scaleChordProgressionSmf(
  scale: Scale,
  tuning: TuningSystem,
  rootHz: number,
  opts?: ScaleChordProgressionSmfOptions,
): Uint8Array {
  const ranked = rankScaleChords(scale, tuning, opts?.searchOpts);
  if (ranked.length === 0) {
    throw new RangeError(
      `scaleChordProgressionSmf: no chords found for scale '${scale.id}' — scale may be too small for the requested size`,
    );
  }
  const chords = ranked.map((r) => rankedChordToChord(r));
  const { chords: ordered } = optimalChordOrder(chords, rootHz);
  return progressionToSmf(ordered, rootHz, opts);
}

export interface ScaleToSmfOptions extends ChordToSmfOptions {
  /** Gap between successive notes in ticks. Default 0 (legato). */
  readonly gapTicks?: number;
}

/**
 * Export a `Scale` as a sequential melodic MIDI file (one note per degree).
 *
 * Socratic Q83: `scaleToFreqs(scale, tuning)` → Hz[]; `freqToMidiFloat` → MIDI
 * note numbers; `encodeSmf` → bytes — but going from a `Scale` to a playable
 * melodic MIDI file requires three manual steps and two intermediate arrays.
 * If `Scale` is truly first-class, writing it to MIDI should be one call.
 *
 * Each degree is placed sequentially: degree 0 starts at tick 0, degree 1 at
 * tick `durationTicks`, etc. The root octave transposition is handled by
 * `rootHz`: pass `261.63` to start on C4, `523.25` for C5, etc.
 *
 * Hz → MIDI pitch rounds to the nearest integer semitone (same caveat as
 * `chordToSmf` — use MPE for microtonal precision).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if any scale degree maps to a MIDI note outside [0, 127].
 *
 * @example
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-edo',
 *                         degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const midi = scaleToSmf(major, edo(12), 261.63);
 * await fs.writeFile('major-scale.mid', midi);
 */
export function scaleToSmf(
  scale: Scale,
  tuning: TuningSystem,
  rootHz: number,
  opts?: ScaleToSmfOptions,
): Uint8Array {
  const ppq = opts?.ppq ?? DEFAULT_PPQ;
  const durationTicks = opts?.durationTicks ?? ppq;
  const gapTicks = opts?.gapTicks ?? 0;
  const velocity = opts?.velocity ?? 90;
  const channel = opts?.channel ?? 0;
  const a4Hz = opts?.a4Hz ?? 440;

  // scaleToFreqs returns Hz values anchored to tuning.referenceHz.
  // Transpose so that the first scale degree lands on rootHz.
  const rawFreqs = scaleToFreqs(scale, tuning);
  const firstFreq = rawFreqs[0] ?? tuning.referenceHz;
  const transpose = rootHz / firstFreq;
  const stepTicks = durationTicks + gapTicks;

  const notes: NoteEvent[] = rawFreqs.map((hz, i) => {
    const transposedHz = hz * transpose;
    const midiFloat = freqToMidiFloat(transposedHz, a4Hz);
    const note = Math.round(midiFloat);
    if (note < 0 || note > 127) {
      throw new RangeError(
        `scale degree ${i} frequency ${transposedHz.toFixed(2)} Hz maps to MIDI note ${note}, which is outside [0, 127]`,
      );
    }
    return { note, velocity, startTicks: i * stepTicks, durationTicks, channel };
  });

  return encodeSmf(notes, { ppq });
}
