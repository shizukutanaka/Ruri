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
import {
  type Scale,
  scaleToFreqs,
  type ScaleChordMapEntry,
  bestModeForTuning,
  scaleToChordMap,
  progressionNarrative,
  rankModesByStability,
} from '../core/scale.js';
import { type Spectrum } from '../core/spectrum.js';

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

/** A decoded MTS bulk tuning dump. */
export interface MtsBulkDump {
  readonly deviceId: number;
  readonly program: number;
  /** The 16-byte name field with trailing padding removed. */
  readonly name: string;
  /** Frequency of each MIDI key 0..127, from `semitone + fraction14/16384`. */
  readonly frequenciesHz: readonly number[];
  readonly keys: readonly MtsKey[];
}

/**
 * Decode a 408-byte MTS bulk tuning dump — the inverse of {@link mtsBulkDump}.
 *
 * Verifies the framing, the sub-IDs and the checksum, and throws on any of them
 * rather than returning frequencies from a message it cannot vouch for. The
 * checksum matters: it is the only integrity check the format has, and a
 * dump with one flipped bit would otherwise decode to a plausible tuning.
 *
 * Frequencies are reconstructed against `a4Hz` (default 440), so
 * `decodeMts(mtsBulkDump(f)).frequenciesHz` recovers `f` to within the 14-bit
 * fraction's resolution (1/16384 semitone ≈ 0.006 cents).
 *
 * @throws {RangeError} if the buffer is not 408 bytes, is not framed as an MTS
 *   bulk dump, or fails its checksum.
 */
export function decodeMts(bytes: Uint8Array, a4Hz = A4_HZ_DEFAULT): MtsBulkDump {
  if (bytes.length !== 408) {
    throw new RangeError(`decodeMts: expected 408 bytes, got ${bytes.length}`);
  }
  if (bytes[0] !== 0xf0 || bytes[407] !== 0xf7) {
    throw new RangeError('decodeMts: not a SysEx message (missing F0/F7 framing)');
  }
  if (bytes[1] !== 0x7e || bytes[3] !== 0x08 || bytes[4] !== 0x01) {
    throw new RangeError('decodeMts: not an MTS bulk tuning dump (sub-IDs 7E xx 08 01)');
  }
  let checksum = 0;
  for (let i = 1; i <= 405; i++) checksum ^= bytes[i] as number;
  if ((checksum & 0x7f) !== bytes[406]) {
    throw new RangeError(
      `decodeMts: checksum mismatch (stored 0x${(bytes[406] as number).toString(16)}, computed 0x${(checksum & 0x7f).toString(16)})`,
    );
  }
  const name = String.fromCharCode(...Array.from(bytes.subarray(6, 22))).replace(/ +$/, '');
  const keys: MtsKey[] = [];
  const frequenciesHz: number[] = [];
  for (let k = 0; k < 128; k++) {
    const offset = 22 + k * 3;
    const semitone = bytes[offset] as number;
    const fraction14 =
      (((bytes[offset + 1] as number) & 0x7f) << 7) | ((bytes[offset + 2] as number) & 0x7f);
    keys.push({ semitone, fraction14 });
    frequenciesHz.push(midiToFreq(semitone + fraction14 / 16384, a4Hz));
  }
  return { deviceId: bytes[2] as number, program: bytes[5] as number, name, frequenciesHz, keys };
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

/** Options for {@link scaleToMts}. */
export interface ScaleToMtsOptions extends MtsBulkDumpOptions {
  /**
   * MIDI note number for the first scale degree (lowest pitch in the scale).
   * Scale degrees are mapped onto contiguous MIDI keys starting here.
   * Default: 60 (middle C).
   */
  readonly middleNote?: number;
  /**
   * A4 reference frequency in Hz used to fill non-scale MIDI keys with standard 12-TET.
   * Default: 440.
   */
  readonly a4Hz?: number;
}

/**
 * Export a microtonal `Scale` directly as a 408-byte MTS bulk tuning dump SysEx message.
 *
 * Socratic Q101: `scaleToFreqs(scale, tuning)` returns the Hz values of a scale's
 * degrees; `chordToMts` maps a chord's frequencies onto nearby MIDI keys with exact
 * fractional tuning — but going from a `Scale` object all the way to a ready-to-send
 * MTS SysEx message still requires the caller to bridge from the scale layer into the
 * MTS layer manually. If `Scale` is truly first-class (with `pluckScaleWav`,
 * `strikeScaleWav`, `scaleToSmf`…), exporting it as MTS should also be one call.
 *
 * Algorithm:
 * 1. Realize scale frequencies: `scaleToFreqs(scale, tuning)`.
 * 2. Fill a 128-entry array with standard 12-TET frequencies (via `midiToFreq`).
 * 3. Map scale degrees onto contiguous MIDI keys starting at `middleNote`, overwriting
 *    those keys with the exact scale Hz values.
 * 4. Encode with `mtsBulkDump` and return the 408-byte SysEx message.
 *
 * Non-scale MIDI keys retain standard 12-TET so that an unrelated synth part is not
 * detuned. If the scale has more degrees than fit from `middleNote` to 127, excess
 * degrees are silently clamped to key 127.
 *
 * @param scale   - The scale to export (must be compatible with `tuning`).
 * @param tuning  - The tuning system that owns this scale.
 * @param name    - Optional SysEx name override; defaults to `scale.id` (truncated to 16 chars).
 * @param opts    - Optional device ID, program, middleNote, and A4 reference Hz.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` (id mismatch or out-of-range degrees).
 * @throws {RangeError} if the scale has no degrees.
 *
 * @example
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-edo',
 *                         degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const mts = scaleToMts(major, edo(12));
 * port.send(mts); // retune synth to play the scale starting at middle C
 */
export function scaleToMts(
  scale: Scale,
  tuning: TuningSystem,
  name?: string,
  opts: ScaleToMtsOptions = {},
): Uint8Array {
  const middleNote = opts.middleNote ?? 60;
  const a4Hz = opts.a4Hz ?? A4_HZ_DEFAULT;

  const scaleFreqs = scaleToFreqs(scale, tuning); // throws if incompatible
  if (scaleFreqs.length === 0) {
    throw new RangeError('scaleToMts: scale has no degrees');
  }

  // Start with a standard 12-TET tuning for all 128 MIDI keys
  const frequencies: number[] = Array.from({ length: 128 }, (_, k) => midiToFreq(k, a4Hz));

  // Map each scale degree onto a contiguous MIDI key starting at middleNote
  for (let i = 0; i < scaleFreqs.length; i++) {
    const key = Math.min(127, middleNote + i);
    (frequencies as number[])[key] = scaleFreqs[i] as number;
  }

  const { middleNote: _mn, a4Hz: _a4, ...bulkOpts } = opts;
  void _mn;
  void _a4;
  return mtsBulkDump(frequencies, name ?? scale.id, bulkOpts);
}

/** Options for {@link chordMapToMts}. */
export interface ChordMapToMtsOptions extends MtsBulkDumpOptions {
  /**
   * Root frequency in Hz for realizing chord intervals.
   * Default: 440 Hz (A4).
   */
  readonly rootHz?: number;
  /**
   * A4 reference frequency in Hz used to fill non-chord MIDI keys with standard 12-TET.
   * Default: 440.
   */
  readonly a4Hz?: number;
}

/**
 * Export all unique pitch classes in a chord map as a 408-byte MTS bulk tuning dump SysEx.
 *
 * Socratic Q139: `chordMapAnalysis` produces a full chord map with dissonance and harmonicity
 * scores — but encoding all its unique pitch frequencies as a single MTS SysEx message (so a
 * synth can play any chord from the map without re-tuning per chord) still requires manual
 * frequency extraction and a `mtsBulkDump` call. If a chord map is first-class, exporting its
 * pitch universe as MTS should be one call.
 *
 * Algorithm:
 * 1. Collect all unique intervals across all chords in the chord map.
 * 2. Realize each unique interval as a frequency at `rootHz`.
 * 3. Assign each frequency to the nearest MIDI key (12-TET baseline for unassigned keys).
 * 4. Encode with `mtsBulkDump` and return the 408-byte SysEx message.
 *
 * If two intervals map to the same MIDI key, the last one (in chord-map order) wins —
 * deterministic but callers should prefer chord maps with well-separated intervals.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`). Must be non-empty.
 * @param name     - Optional SysEx name string (truncated to 16 ASCII bytes).
 * @param opts     - Optional device ID, program number, root Hz, and A4 reference Hz.
 * @returns A 408-byte `Uint8Array` MTS SysEx message.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const mts = chordMapToMts(chordMap, 'major-map');
 * port.send(mts); // retune synth with all diatonic pitches
 */
export function chordMapToMts(
  chordMap: readonly ScaleChordMapEntry[],
  name = 'chord-map',
  opts: ChordMapToMtsOptions = {},
): Uint8Array {
  if (chordMap.length === 0) {
    throw new RangeError('chordMapToMts: chordMap must be non-empty');
  }

  const rootHz = opts.rootHz ?? A4_HZ_DEFAULT;
  const a4Hz = opts.a4Hz ?? A4_HZ_DEFAULT;

  // Start with standard 12-TET for all 128 MIDI keys
  const frequencies: number[] = Array.from({ length: 128 }, (_, k) => midiToFreq(k, a4Hz));

  // Collect all unique pitch frequencies from all chords and assign to nearest MIDI keys
  for (const entry of chordMap) {
    const freqs = realizeChordFreqs(entry.chord, rootHz);
    for (const hz of freqs) {
      const midiFloat = freqToMidiFloat(hz, a4Hz);
      const key = Math.max(0, Math.min(127, Math.round(midiFloat)));
      (frequencies as number[])[key] = hz;
    }
  }

  const { rootHz: _rHz, a4Hz: _a4, ...bulkOpts } = opts;
  void _rHz;
  void _a4;
  return mtsBulkDump(frequencies, name, bulkOpts);
}

/**
 * Find the best mode for a tuning and export it as a 408-byte MTS bulk tuning dump SysEx.
 *
 * Socratic Q159: "If we have a best mode for a tuning, the MTS SysEx dump of that best mode
 * should be one call — can it?" Today: `bestModeForTuning(tuning, spectrum)` → `scaleToMts(mode,
 * tuning, opts)` — two explicit steps. If a tuning's best mode is first-class, retune a synth
 * to that mode in one call.
 *
 * Algorithm:
 * 1. `bestModeForTuning(tuning, spectrum)` → best modal rotation.
 * 2. `scaleToMts(mode, tuning, opts)` → 408-byte MTS SysEx.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for mode ranking. If omitted, ranks by harmonicity.
 * @param opts     - Optional MTS encoding options (device ID, program, middleNote, a4Hz).
 * @returns A 408-byte `Uint8Array` MTS SysEx message for the best mode.
 *
 * @throws {RangeError} if `tuning` has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const mts = bestModeMts(t12);
 * port.send(mts); // retune synth to the most harmonic mode of 12-TET
 */
export function bestModeMts(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  opts?: ScaleToMtsOptions,
): Uint8Array {
  const mode = bestModeForTuning(tuning, spectrum);
  return scaleToMts(mode, tuning, mode.id, opts ?? {});
}

/**
 * Export a single chord map entry's chord as a 408-byte MTS bulk tuning dump SysEx.
 *
 * Socratic Q165: "If we can export a chord map as MTS, exporting a specific SINGLE chord
 * from the chord map as MTS (just that chord's frequencies) should also be one call — can it?"
 * Today: extract `entry.chord` → `chordToMts(chord, rootHz, opts)` — two steps. If a
 * `ScaleChordMapEntry` is first-class, realizing it as MTS should be one call.
 *
 * Delegates directly to `chordToMts(entry.chord, tuning.referenceHz, opts)`, using
 * `tuning.referenceHz` as the root frequency so the chord is anchored at the tuning's
 * reference pitch.
 *
 * @param entry  - A single entry from a diatonic chord map (e.g. from `scaleToChordMap`).
 * @param tuning - The parent `TuningSystem` (provides `referenceHz` as the chord root).
 * @param opts   - Optional MTS encoding options (device ID, program, A4 Hz).
 * @returns A 408-byte `Uint8Array` MTS SysEx message encoding the chord's frequencies.
 *
 * @throws {RangeError} if the chord has no intervals.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const mts = chordEntryToMts(chordMap[0]!, t12);
 * port.send(mts); // retune synth to the first diatonic chord
 */
export function chordEntryToMts(
  entry: ScaleChordMapEntry,
  tuning: TuningSystem,
  opts?: ChordToMtsOptions,
): Uint8Array {
  return chordToMts(entry.chord, tuning.referenceHz, opts ?? {});
}

/**
 * Find the best mode for a tuning and export its CHORD MAP as a 408-byte MTS bulk tuning dump SysEx.
 *
 * Socratic Q192: "If we can find the best mode for a tuning and export it as MTS, we should also
 * be able to find the best mode and export its CHORD MAP as MTS in one call — can it?"
 * Today: `bestModeForTuning(tuning, spectrum)` → `scaleToChordMap(mode, tuning)` →
 * `chordMapToMts(chordMap, tuning, opts)` — three explicit steps with two intermediate objects.
 * If the best-mode chord map is first-class, encoding it as MTS should be one call.
 *
 * Algorithm:
 * 1. `bestModeForTuning(tuning, spectrum)` → best modal rotation.
 * 2. `scaleToChordMap(mode, tuning)` → all diatonic chords for that mode.
 * 3. `chordMapToMts(chordMap, tuning.id, opts)` → 408-byte MTS SysEx.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for mode ranking. If omitted, ranks by harmonicity.
 * @param opts     - Optional MTS encoding options (device ID, program, rootHz, a4Hz).
 * @returns A 408-byte `Uint8Array` MTS SysEx message for the best mode's chord map.
 *
 * @throws {RangeError} if `tuning` has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const mts = bestModeChordMapMts(t12);
 * port.send(mts); // retune synth with all pitch classes from the best mode's chord map
 */
export function bestModeChordMapMts(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  opts?: ChordMapToMtsOptions,
): Uint8Array {
  if (tuning.degrees.length === 0) {
    throw new RangeError('bestModeChordMapMts: tuning has no degrees');
  }
  const mode = bestModeForTuning(tuning, spectrum);
  const chordMap = scaleToChordMap(mode, tuning);
  return chordMapToMts(chordMap, tuning.id, opts ?? {});
}

/**
 * Get both an MTS bulk dump and a narrative description of a chord progression in one call.
 *
 * Socratic Q239: "If I can get a progression's MTS dump and its narrative text, can I get
 * both in one call?" → No → implement.
 *
 * The MTS bulk dump encodes the `tuning` system so a synth can be retuned to the correct
 * intonation before playing the progression. The narrative describes the progression's
 * energy shape, climax, and resolution.
 *
 * @param chords   - The chord progression to narrate.
 * @param tuning   - The `TuningSystem` context (exported as the MTS dump).
 * @param rootHz   - Root frequency in Hz. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum for the narrative analysis.
 * @param opts     - Optional MTS encoding options.
 * @returns `{ mts: Uint8Array, narrative: string }`.
 *
 * @example
 * const { mts, narrative } = progressionNarrativeMts(chords, t12);
 * port.send(mts); // retune synth
 * console.log(narrative); // describe the progression
 */
export function progressionNarrativeMts(
  chords: readonly Chord[],
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
  opts?: TuningToMtsOptions,
): { mts: Uint8Array; narrative: string } {
  const effectiveRootHz = rootHz ?? tuning.referenceHz;
  const narrative = progressionNarrative(chords, effectiveRootHz, spectrum);
  const mts = tuningToMts(tuning, undefined, opts ?? {});
  return { mts, narrative };
}

/**
 * Get the top-N stability-ranked modes of a tuning as MTS bulk dump SysEx messages in one call.
 *
 * Socratic Q242: "If I can get top-N mode SMFs and also get MTS for any tuning, can I get
 * top-N mode MTS dumps in one call?" → No → implement.
 *
 * @param tuning   - The parent `TuningSystem`. Must have at least one degree.
 * @param n        - Number of top modes to return (must be > 0).
 * @param spectrum - Optional instrument spectrum for timbre-aware mode ranking.
 * @param rootHz   - Root frequency in Hz for stability ranking. Defaults to `tuning.referenceHz`.
 * @param opts     - Optional MTS encoding options forwarded to `scaleToMts`.
 * @returns Array of 408-byte MTS SysEx `Uint8Array`s, one per top-ranked mode, in stability order.
 *
 * @throws {RangeError} if `n` <= 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const bufs = topNModesMts(t12, 3);
 * bufs.forEach((mts, i) => port.send(mts)); // retune synth to top-3 modes
 */
export function topNModesMts(
  tuning: TuningSystem,
  n: number,
  spectrum?: Spectrum,
  rootHz?: number,
  opts?: TuningToMtsOptions,
): Uint8Array[] {
  if (n <= 0) throw new RangeError('topNModesMts: n must be positive');
  const modes = rankModesByStability(tuning, rootHz ?? tuning.referenceHz, spectrum);
  return modes
    .slice(0, n)
    .map((entry) => scaleToMts(entry.scale, tuning, entry.scale.id, opts ?? {}));
}

// ---------------------------------------------------------------------------
// Q287 — scaleToMtsBundle
// ---------------------------------------------------------------------------

/**
 * Get both a Scale-level MTS dump and a TuningSystem-level MTS dump in one call.
 *
 * Socratic Q287: "If I can convert a Scale to MTS and a TuningSystem to MTS, can I get both
 * in one call — scale-level tuning AND tuning-level tuning as MTS?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleMts = scaleToMts(scale, tuning, undefined, opts)` → 408-byte MTS for the scale.
 * 2. `tuningMts = tuningToMts(tuning, undefined, opts)` → 408-byte MTS for the full tuning.
 * 3. Return `{ scaleMts, tuningMts }`.
 *
 * @param scale  - The scale to export as MTS (must be compatible with `tuning`).
 * @param tuning - The tuning system to export as MTS.
 * @param opts   - Optional MTS encoding options forwarded to both exports.
 * @returns `{ scaleMts: Uint8Array, tuningMts: Uint8Array }` — both 408 bytes each.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` or has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale: Scale = { id: 'major', name: 'Major', tuningId: t12.id, degreeIndices: [0,2,4,5,7,9,11] };
 * const { scaleMts, tuningMts } = scaleToMtsBundle(scale, t12);
 * // scaleMts encodes the 7-degree major scale; tuningMts encodes all 12 degrees
 */
export function scaleToMtsBundle(
  scale: Scale,
  tuning: TuningSystem,
  opts?: TuningToMtsOptions,
): { scaleMts: Uint8Array; tuningMts: Uint8Array } {
  const { anchorMidiNote: _anchor, ...bulkOpts } = opts ?? {};
  void _anchor; // not applicable for scaleToMts (uses middleNote instead)
  const scaleMts = scaleToMts(scale, tuning, undefined, bulkOpts);
  const tuningMts = tuningToMts(tuning, undefined, opts ?? {});
  return { scaleMts, tuningMts };
}
