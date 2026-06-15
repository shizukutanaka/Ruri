/**
 * MIDI Tuning Standard (MTS) bulk tuning dump encoder.
 *
 * Message layout — 408 bytes total:
 *
 * | offset | bytes | content                                                   |
 * |--------|-------|-----------------------------------------------------------|
 * |   0    |   1   | 0xF0  SysEx start                                         |
 * |   1    |   1   | 0x7E  non-real-time universal SysEx                       |
 * |   2    |   1   | device ID (default 0x00)                                  |
 * |   3    |   1   | 0x08  sub-ID#1: MIDI Tuning                               |
 * |   4    |   1   | 0x01  sub-ID#2: bulk dump reply                           |
 * |   5    |   1   | tuning program number 0–127 (default 0)                   |
 * |   6    |  16   | name: ASCII, truncated/space(0x20)-padded, each byte &0x7F|
 * |  22    | 384   | 128 keys × 3 bytes: xx yy zz (see below)                  |
 * | 406    |   1   | checksum: XOR of bytes [1..405] inclusive, &0x7F          |
 * | 407    |   1   | 0xF7  SysEx end                                           |
 *
 * Per-key encoding (3 bytes: xx yy zz):
 *   xx = equal-tempered MIDI semitone 0–127 at or below the target frequency
 *   yy zz = 14-bit fraction of a semitone above xx, in units of 1/16384 semitone
 *            yy = bits 13–7 (upper 7 bits), zz = bits 6–0 (lower 7 bits)
 *
 * Checksum = XOR of bytes at offsets 1 through 405 inclusive, then &0x7F.
 * Expanded: 0x7E ^ deviceId ^ 0x08 ^ 0x01 ^ program ^ (16 name bytes) ^ (384 key bytes).
 */

import { freqToMidiFloat, midiToFreq, A4_HZ_DEFAULT } from '../core/midi.js';
import { degreeToFreq, type TuningSystem } from '../core/tuning.js';
import { type Chord, realizeChordFreqs } from '../core/chord.js';

/** A single MTS key entry: semitone + 14-bit fractional offset above it. */
export interface MtsKey {
  readonly semitone: number;
  readonly fraction14: number;
}

/**
 * Convert a frequency in Hz to an MTS key (semitone + 14-bit fraction).
 *
 * The result satisfies: semitone + fraction14/16384 = freqToMidiFloat(hz, a4Hz).
 * 440 Hz → { semitone: 69, fraction14: 0 }.
 * Clamps to [0, 127+16383/16384] (i.e. { semitone: 0, fraction14: 0 } at the bottom,
 * { semitone: 127, fraction14: 16383 } at the top).
 *
 * CAVEAT: the top clamp { 127, 16383 } encodes to bytes 7F 7F 7F, which the MTS
 * spec reserves elsewhere as the "no change" sentinel; some synths may ignore a
 * key set to the extreme top. Keep frequencies within the MIDI 0..127 range
 * (≈ 8.18 Hz .. 12543.85 Hz) to avoid relying on the clamp.
 *
 * @throws {RangeError} if hz is not finite or not > 0.
 */
export function freqToMtsKey(hz: number, a4Hz = A4_HZ_DEFAULT): MtsKey {
  if (!Number.isFinite(hz) || hz <= 0) {
    throw new RangeError(`freqToMtsKey: hz must be finite and > 0, got ${hz}`);
  }
  const m = freqToMidiFloat(hz, a4Hz);

  // Clamp below MIDI 0
  if (m < 0) {
    return { semitone: 0, fraction14: 0 };
  }
  // Clamp above MIDI 127+16383/16384
  if (m >= 128) {
    return { semitone: 127, fraction14: 16383 };
  }

  let semitone = Math.floor(m);
  let fraction14 = Math.round((m - semitone) * 16384);

  // Carry: rounding can push fraction14 to 16384
  if (fraction14 === 16384) {
    semitone += 1;
    fraction14 = 0;
  }

  // Re-clamp after carry (edge: Math.floor(127.9999...) = 127, round could give 16384)
  if (semitone > 127) {
    return { semitone: 127, fraction14: 16383 };
  }

  return { semitone, fraction14 };
}

/** Options for {@link mtsBulkDump}. */
export interface MtsBulkDumpOptions {
  /** SysEx device ID, 0–127. Default 0x00. */
  readonly deviceId?: number;
  /** Tuning program number, 0–127. Default 0. */
  readonly program?: number;
}

/**
 * Encode 128 frequencies into a 408-byte MTS bulk tuning dump SysEx message.
 *
 * @param frequenciesHz - Frequencies for MIDI keys 0..127 (must have length 128).
 * @param name - Tuning name; truncated or space-padded to 16 ASCII bytes.
 * @param opts - Optional device ID and program number.
 * @throws {RangeError} if frequenciesHz.length !== 128, deviceId/program out of [0,127],
 *   or any frequency is invalid (not finite or ≤ 0).
 */
export function mtsBulkDump(
  frequenciesHz: readonly number[],
  name: string,
  opts: MtsBulkDumpOptions = {},
): Uint8Array {
  if (frequenciesHz.length !== 128) {
    throw new RangeError(
      `mtsBulkDump: frequenciesHz must have length 128, got ${frequenciesHz.length}`,
    );
  }

  const deviceId = opts.deviceId ?? 0x00;
  const program = opts.program ?? 0;

  if (!Number.isInteger(deviceId) || deviceId < 0 || deviceId > 127) {
    throw new RangeError(`mtsBulkDump: deviceId must be an integer in [0,127], got ${deviceId}`);
  }
  if (!Number.isInteger(program) || program < 0 || program > 127) {
    throw new RangeError(`mtsBulkDump: program must be an integer in [0,127], got ${program}`);
  }

  // Validate all frequencies upfront (fail fast)
  for (let i = 0; i < 128; i++) {
    const hz = frequenciesHz[i] as number;
    if (!Number.isFinite(hz) || hz <= 0) {
      throw new RangeError(`mtsBulkDump: frequenciesHz[${i}] must be finite and > 0, got ${hz}`);
    }
  }

  const buf = new Uint8Array(408);

  // Header
  buf[0] = 0xf0; // SysEx start
  buf[1] = 0x7e; // non-real-time
  buf[2] = deviceId;
  buf[3] = 0x08; // MIDI Tuning sub-ID#1
  buf[4] = 0x01; // bulk dump reply sub-ID#2
  buf[5] = program;

  // Name: 16 bytes, ASCII, each &0x7F, space-padded
  for (let i = 0; i < 16; i++) {
    const ch = i < name.length ? name.charCodeAt(i) : 0x20;
    buf[6 + i] = ch & 0x7f;
  }

  // Key data: 128 keys × 3 bytes at offset 22
  for (let k = 0; k < 128; k++) {
    const hz = frequenciesHz[k] as number;
    const { semitone, fraction14 } = freqToMtsKey(hz);
    const offset = 22 + k * 3;
    buf[offset] = semitone; // xx
    buf[offset + 1] = (fraction14 >> 7) & 0x7f; // yy: bits 13–7
    buf[offset + 2] = fraction14 & 0x7f; // zz: bits 6–0
  }

  // Checksum: XOR bytes [1..405] inclusive, &0x7F
  let checksum = 0;
  for (let i = 1; i <= 405; i++) {
    checksum ^= buf[i] as number;
  }
  buf[406] = checksum & 0x7f;

  // SysEx end
  buf[407] = 0xf7;

  return buf;
}

/**
 * Map MIDI keys 0..127 onto a TuningSystem, returning 128 frequencies.
 *
 * Key k maps to degree (k - anchorMidiNote) in the tuning, so that
 * key anchorMidiNote produces t.referenceHz.
 *
 * @param t - The tuning system.
 * @param anchorMidiNote - MIDI key number that plays t.referenceHz. Default 69 (A4).
 */
export function tuningToMtsFrequencies(t: TuningSystem, anchorMidiNote = 69): number[] {
  return Array.from({ length: 128 }, (_, k) => degreeToFreq(t, k - anchorMidiNote));
}

/** Options for {@link chordToMts}. */
export interface ChordToMtsOptions extends MtsBulkDumpOptions {
  /**
   * A4 reference frequency in Hz. Default 440.
   * Used to map chord frequencies to fractional MIDI note numbers.
   */
  readonly a4Hz?: number;
}

/** Options for {@link tuningToMts}. */
export type TuningToMtsOptions = MtsBulkDumpOptions & {
  /** MIDI key number that maps to `tuning.referenceHz`. Default 69 (A4). */
  readonly anchorMidiNote?: number;
};

/**
 * Export a `TuningSystem` directly as a 408-byte MTS bulk tuning dump SysEx message.
 *
 * Socratic Q73: `tuningToMtsFrequencies(tuning)` maps all 128 MIDI keys onto the
 * tuning's Hz values; `mtsBulkDump(freqs, name, opts)` encodes those into a SysEx
 * message. The full pipeline — "tuning → ready-to-send MTS SysEx" — requires two
 * explicit calls with an intermediate 128-element array that has no use elsewhere.
 * `tuningToMts` closes this gap: if a `TuningSystem` is truly first-class, retuning
 * a synth to it should be one call.
 *
 * The `name` is taken from `tuning.id` unless overridden. Key 69 (A4) maps to
 * `tuning.referenceHz` by default; adjust via `opts.anchorMidiNote`.
 *
 * @param tuning - The tuning system to export.
 * @param name - Optional SysEx name override; defaults to `tuning.id` (truncated to 16 chars).
 * @param opts - Optional device ID, program number, and anchor MIDI note.
 *
 * @example
 * const mts = tuningToMts(edo(19));
 * // Write mts (Uint8Array, 408 bytes) to a .syx file or send via Web MIDI
 * port.send(mts);
 */
export function tuningToMts(
  tuning: TuningSystem,
  name?: string,
  opts: TuningToMtsOptions = {},
): Uint8Array {
  const { anchorMidiNote, ...bulkOpts } = opts;
  const freqs = tuningToMtsFrequencies(tuning, anchorMidiNote);
  return mtsBulkDump(freqs, name ?? tuning.id, bulkOpts);
}

/**
 * Export a microtonal `Chord` as a 408-byte MTS bulk tuning dump SysEx message.
 *
 * Socratic Q71: `chordToSmf` exports a `Chord` as MIDI (12-TET pitch-quantised),
 * losing microtonal precision. For exact microtonal fidelity, each chord note's
 * realized frequency should be mapped to a nearby MIDI key with a fractional
 * tuning offset, and the remaining 128 keys should stay at standard 12-TET so
 * an unrelated synth part is not detuned. `chordToMts` closes this gap in one
 * call: "chord + root Hz → ready-to-send MTS SysEx bytes."
 *
 * Algorithm:
 * 1. Realize chord frequencies: `realizeChordFreqs(chord, rootHz)`.
 * 2. For each realized frequency, find the nearest MIDI key (round to integer).
 * 3. Build a 128-entry frequency array where chord keys hold exact Hz and all
 *    other keys hold their standard 12-TET frequencies (via `midiToFreq`).
 * 4. Call `mtsBulkDump(frequencies, name, opts)` and return the 408-byte result.
 *
 * If two chord notes map to the same MIDI key, the higher-priority note (last
 * in the interval array) overwrites the earlier one — behaviour is deterministic
 * but callers should ensure intervals are distinct enough to occupy different keys.
 *
 * @param chord - Root-relative interval chord (see `realizeChordFreqs`).
 * @param rootHz - Absolute frequency (Hz) of the chord root.
 * @param opts   - Optional device ID, program number, and A4 reference Hz.
 *
 * @throws {RangeError} if `chord.intervals` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * import { chordFromRatios } from '../core/chord.js';
 * const justMajor = chordFromRatios('just-major', [[1,1],[5,4],[3,2]]);
 * const mts = chordToMts(justMajor, 261.63);
 * // mts is 408 bytes — send to a synth via SysEx or write to a .syx file
 */
/**
 * Convert a sequence of chords to an array of MTS bulk tuning dump SysEx messages.
 *
 * Socratic Q76: `chordToMts(chord, rootHz)` encodes a single chord as a 408-byte
 * MTS SysEx message. A DAW that plays chords in sequence needs to retune the synth
 * before each chord change — that means one `chordToMts` call per chord, collected
 * into an array the DAW can send one-by-one as the progression advances. If
 * `chordToMts` is truly first-class, "progression → ready-to-send SysEx array"
 * should be one call rather than a `map` the caller writes by hand every time.
 *
 * Returns one 408-byte `Uint8Array` per chord, in the same order as the input.
 * The DAW should send `result[i]` before playing chord `i`.
 *
 * @param chords  - Sequence of chords to retune to (root-relative interval chords).
 * @param rootHz  - Absolute frequency (Hz) of the chord root (same for all chords).
 * @param opts    - Optional device ID, program number, and A4 reference Hz.
 *
 * @throws {RangeError} if `chords` is empty.
 * @throws {RangeError} if any chord has no intervals, or if `rootHz` is invalid.
 *
 * @example
 * const chords = [justMajor, justMinor, suspended4];
 * const sysexMessages = chordProgressionToMts(chords, 261.63);
 * // Send sysexMessages[i] before playing chord i
 * for (const msg of sysexMessages) port.send(msg);
 */
export function chordProgressionToMts(
  chords: readonly Chord[],
  rootHz: number,
  opts: ChordToMtsOptions = {},
): Uint8Array[] {
  if (chords.length === 0) throw new RangeError('chordProgressionToMts: chords must be non-empty');
  return chords.map((chord) => chordToMts(chord, rootHz, opts));
}

export function chordToMts(chord: Chord, rootHz: number, opts: ChordToMtsOptions = {}): Uint8Array {
  if (chord.intervals.length === 0) {
    throw new RangeError('chordToMts: chord must have at least one interval');
  }
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(`chordToMts: rootHz must be finite and > 0, got ${rootHz}`);
  }

  const a4Hz = opts.a4Hz ?? A4_HZ_DEFAULT;

  // Start with a standard 12-TET tuning for all 128 MIDI keys
  const frequencies: number[] = Array.from({ length: 128 }, (_, k) => midiToFreq(k, a4Hz));

  // Realize exact chord frequencies and assign each to the nearest MIDI key
  const chordFreqs = realizeChordFreqs(chord, rootHz);
  for (const hz of chordFreqs) {
    const midiFloat = freqToMidiFloat(hz, a4Hz);
    // Clamp to valid MIDI range [0, 127]
    const key = Math.max(0, Math.min(127, Math.round(midiFloat)));
    (frequencies as number[])[key] = hz;
  }

  const { a4Hz: _a4Hz, ...bulkOpts } = opts;
  void _a4Hz; // consumed above; exclude from MtsBulkDumpOptions
  return mtsBulkDump(frequencies, chord.name, bulkOpts);
}
