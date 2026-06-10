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

import { freqToMidiFloat, A4_HZ_DEFAULT } from '../core/midi.js';
import { degreeToFreq, type TuningSystem } from '../core/tuning.js';

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
