/**
 * MIDI 2.0 Universal MIDI Packet (UMP) export — per-note microtonal pitch.
 *
 * Encodes MIDI 2.0 Channel Voice messages (Message Type 0x4, 64-bit) with the
 * **Pitch 7.9** note attribute (attribute type 0x03): a 7-bit note number plus a
 * 9-bit semitone fraction, i.e. absolute pitch in 1/512-semitone units
 * (≈ 0.195 cents — finer than MPE's 14-bit channel bend at ±2 semitones).
 * Unlike MPE, the sounding pitch rides *in the Note On itself*: no channel
 * rotation, no bend-range agreement with the receiver.
 *
 * Also encodes MIDI 2.0 Per-Note Pitch Bend (status 0x6, 32-bit unsigned
 * bipolar data centered at 0x80000000). The spec sets per-note bend
 * sensitivity via a registered per-note controller with **no universal
 * default**, so `bendRangeSemitones` is a required, explicit parameter here —
 * baking in a guessed default would silently detune on receivers configured
 * differently.
 *
 * Output is `Uint32Array` (UMP is a 32-bit-word stream); `umpToBytes` provides
 * big-endian byte serialization for transports that carry byte streams.
 *
 * Spec: MIDI 2.0 / UMP (M2-104-UM v1.0), MIDI 2.0 Note On with Attribute
 * Type 3 (Pitch 7.9) and Per-Note Pitch Bend.
 */
import { freqToMidiFloat, midiToFreq, A4_HZ_DEFAULT } from '../core/midi.js';
import { type Chord, realizeChordFreqs } from '../core/chord.js';
import { type TuningSystem, degreeToFreq } from '../core/tuning.js';

/** Message Type nibble for MIDI 2.0 Channel Voice messages (64-bit). */
const MT_MIDI2_CHANNEL_VOICE = 0x4;
/** Status opcodes (high nibble of the status byte). */
const OP_NOTE_OFF = 0x8;
const OP_NOTE_ON = 0x9;
const OP_PER_NOTE_PITCH_BEND = 0x6;
/** Note attribute type: Pitch 7.9 (7-bit note + 9-bit fraction). */
export const UMP_ATTR_PITCH_7_9 = 0x03;
/** Per-note pitch bend center (no bend): unsigned bipolar midpoint. */
export const UMP_BEND_CENTER = 0x80000000;

/** Pitch 7.9: absolute pitch as 7-bit note number + 9-bit fraction (1/512 semitone). */
export interface Pitch79 {
  /** Integer semitone (MIDI note number), 0..127. */
  readonly note: number;
  /** Fraction of a semitone above `note` in 1/512 units, 0..511. */
  readonly fraction512: number;
}

/** Common fields for all UMP channel voice messages. */
export interface UmpOptions {
  /** UMP group, 0..15. Default 0. */
  readonly group?: number;
  /** MIDI channel within the group, 0..15. Default 0. */
  readonly channel?: number;
}

/** Options for note-on encoding. */
export interface UmpNoteOnOptions extends UmpOptions {
  /** 16-bit velocity, 0x0000..0xFFFF. Default 0x8000 (center). Note: unlike
   *  MIDI 1.0, velocity 0 does NOT mean note-off in MIDI 2.0. */
  readonly velocity16?: number;
  /** A4 reference frequency for frequency→pitch mapping. Default 440. */
  readonly a4Hz?: number;
}

const checkRange = (name: string, v: number, lo: number, hi: number): number => {
  if (!Number.isInteger(v) || v < lo || v > hi) {
    throw new RangeError(`${name} must be an integer in [${lo}, ${hi}], got ${v}`);
  }
  return v;
};

/**
 * Convert an absolute frequency to Pitch 7.9 (nearest 1/512 semitone).
 *
 * Rounds to the nearest fraction unit with carry (a fraction that rounds to
 * 512 increments the note). Pitches beyond the representable range
 * [note 0 fraction 0, note 127 fraction 511] are clamped to the boundary.
 *
 * @throws {RangeError} if `hz` or `a4Hz` is not finite and > 0.
 */
export function freqToPitch79(hz: number, a4Hz = A4_HZ_DEFAULT): Pitch79 {
  if (!Number.isFinite(hz) || hz <= 0) throw new RangeError(`hz must be > 0, got ${hz}`);
  if (!Number.isFinite(a4Hz) || a4Hz <= 0) throw new RangeError(`a4Hz must be > 0, got ${a4Hz}`);
  const semis = freqToMidiFloat(hz, a4Hz);
  if (semis <= 0) return { note: 0, fraction512: 0 };
  let note = Math.floor(semis);
  let fraction512 = Math.round((semis - note) * 512);
  if (fraction512 === 512) {
    note += 1;
    fraction512 = 0;
  }
  if (note >= 128) return { note: 127, fraction512: 511 };
  return { note, fraction512 };
}

/** Inverse of {@link freqToPitch79}: Pitch 7.9 → absolute frequency (Hz). */
export function pitch79ToFreq(p: Pitch79, a4Hz = A4_HZ_DEFAULT): number {
  checkRange('note', p.note, 0, 127);
  checkRange('fraction512', p.fraction512, 0, 511);
  return midiToFreq(p.note + p.fraction512 / 512, a4Hz);
}

const word0 = (group: number, opcode: number, channel: number, byte2: number, byte3: number) =>
  (((MT_MIDI2_CHANNEL_VOICE << 28) |
    (group << 24) |
    (opcode << 20) |
    (channel << 16) |
    (byte2 << 8) |
    byte3) >>>
    0) as number;

/**
 * MIDI 2.0 Note On with a Pitch 7.9 attribute: the note sounds at exactly
 * `pitch`, regardless of the receiver's tuning table, while `noteIndex` is the
 * identity used to match the later note-off.
 *
 * @param noteIndex - Note number field (identity for note-off pairing), 0..127.
 * @param pitch - Sounding pitch (see {@link freqToPitch79}).
 * @returns Two 32-bit UMP words.
 */
export function umpNoteOnPitch79(
  noteIndex: number,
  pitch: Pitch79,
  opts: UmpNoteOnOptions = {},
): Uint32Array {
  const group = checkRange('group', opts.group ?? 0, 0, 15);
  const channel = checkRange('channel', opts.channel ?? 0, 0, 15);
  const velocity = checkRange('velocity16', opts.velocity16 ?? 0x8000, 0, 0xffff);
  checkRange('noteIndex', noteIndex, 0, 127);
  checkRange('pitch.note', pitch.note, 0, 127);
  checkRange('pitch.fraction512', pitch.fraction512, 0, 511);
  const attrData = ((pitch.note << 9) | pitch.fraction512) & 0xffff;
  return new Uint32Array([
    word0(group, OP_NOTE_ON, channel, noteIndex, UMP_ATTR_PITCH_7_9),
    (((velocity << 16) | attrData) >>> 0) as number,
  ]);
}

/** MIDI 2.0 Note Off (attribute type 0 = none). Pairs with {@link umpNoteOnPitch79}. */
export function umpNoteOff(
  noteIndex: number,
  opts: UmpOptions & { readonly velocity16?: number } = {},
): Uint32Array {
  const group = checkRange('group', opts.group ?? 0, 0, 15);
  const channel = checkRange('channel', opts.channel ?? 0, 0, 15);
  const velocity = checkRange('velocity16', opts.velocity16 ?? 0, 0, 0xffff);
  checkRange('noteIndex', noteIndex, 0, 127);
  return new Uint32Array([
    word0(group, OP_NOTE_OFF, channel, noteIndex, 0x00),
    ((velocity << 16) >>> 0) as number,
  ]);
}

/**
 * MIDI 2.0 Per-Note Pitch Bend: offsets one sounding note by `cents`, given the
 * receiver's per-note bend sensitivity (`bendRangeSemitones` — explicit because
 * the spec defines no universal default; it is negotiated via a registered
 * per-note controller).
 *
 * Data is 32-bit unsigned bipolar, centered at {@link UMP_BEND_CENTER};
 * `cents = ±range·100` maps to the min/max of the field (clamped).
 */
export function umpPerNotePitchBend(
  noteIndex: number,
  cents: number,
  bendRangeSemitones: number,
  opts: UmpOptions = {},
): Uint32Array {
  const group = checkRange('group', opts.group ?? 0, 0, 15);
  const channel = checkRange('channel', opts.channel ?? 0, 0, 15);
  checkRange('noteIndex', noteIndex, 0, 127);
  if (!Number.isFinite(cents)) throw new RangeError(`cents must be finite, got ${cents}`);
  if (!Number.isFinite(bendRangeSemitones) || bendRangeSemitones <= 0) {
    throw new RangeError(`bendRangeSemitones must be > 0, got ${bendRangeSemitones}`);
  }
  const rangeCents = bendRangeSemitones * 100;
  const norm = Math.max(-1, Math.min(1, cents / rangeCents)); // [-1, 1]
  // Map [-1, 1] onto [0, 0xFFFFFFFF] around the center; positive full-scale
  // saturates at 0xFFFFFFFF (center + 0x7FFFFFFF).
  const data = Math.min(0xffffffff, Math.max(0, Math.round(UMP_BEND_CENTER + norm * 0x7fffffff)));
  return new Uint32Array([word0(group, OP_PER_NOTE_PITCH_BEND, channel, noteIndex, 0x00), data]);
}

/**
 * Export a microtonal `Chord` as MIDI 2.0 Note On packets with exact Pitch 7.9
 * frequencies — the MIDI 2.0 successor to `chordToMpe`, without channel
 * rotation or bend-range agreement.
 *
 * Each chord tone becomes one 64-bit Note On whose note index is the nearest
 * integer semitone and whose Pitch 7.9 attribute carries the exact pitch.
 *
 * @returns Concatenated UMP words, 2 per chord tone.
 * @throws {RangeError} if the chord is empty or `rootHz` ≤ 0 (via `realizeChordFreqs`).
 */
export function chordToUmp(chord: Chord, rootHz: number, opts: UmpNoteOnOptions = {}): Uint32Array {
  const freqs = realizeChordFreqs(chord, rootHz);
  const out = new Uint32Array(freqs.length * 2);
  freqs.forEach((hz, i) => {
    const pitch = freqToPitch79(hz, opts.a4Hz ?? A4_HZ_DEFAULT);
    out.set(umpNoteOnPitch79(pitch.note, pitch, opts), i * 2);
  });
  return out;
}

/**
 * Encode one degree of a `TuningSystem` as a MIDI 2.0 Note On with exact
 * Pitch 7.9 frequency. Degree may exceed the degree count (wraps and advances
 * the period, as in `degreeToFreq`).
 */
export function tuningDegreeToUmp(
  tuning: TuningSystem,
  degree: number,
  opts: UmpNoteOnOptions = {},
): Uint32Array {
  const pitch = freqToPitch79(degreeToFreq(tuning, degree), opts.a4Hz ?? A4_HZ_DEFAULT);
  return umpNoteOnPitch79(pitch.note, pitch, opts);
}

/** A decoded UMP MIDI 2.0 channel voice message (subset emitted by this module). */
export type UmpMessage =
  | {
      readonly kind: 'noteOn';
      readonly group: number;
      readonly channel: number;
      readonly noteIndex: number;
      readonly velocity16: number;
      readonly attributeType: number;
      readonly pitch?: Pitch79;
    }
  | {
      readonly kind: 'noteOff';
      readonly group: number;
      readonly channel: number;
      readonly noteIndex: number;
      readonly velocity16: number;
    }
  | {
      readonly kind: 'perNotePitchBend';
      readonly group: number;
      readonly channel: number;
      readonly noteIndex: number;
      readonly data32: number;
    };

/**
 * Decode a stream of 64-bit MIDI 2.0 channel voice messages produced by this
 * module (golden round-trip verification: `decodeUmp(encode(...))` must match).
 *
 * @throws {RangeError} on an odd word count, a non-0x4 message type, or an
 *   opcode this module does not emit.
 */
export function decodeUmp(words: Uint32Array | readonly number[]): UmpMessage[] {
  if (words.length % 2 !== 0) {
    throw new RangeError(`UMP 64-bit stream must have even word count, got ${words.length}`);
  }
  const out: UmpMessage[] = [];
  for (let i = 0; i < words.length; i += 2) {
    const w0 = (words[i] as number) >>> 0;
    const w1 = (words[i + 1] as number) >>> 0;
    const mt = w0 >>> 28;
    if (mt !== MT_MIDI2_CHANNEL_VOICE) {
      throw new RangeError(`expected message type 0x4, got 0x${mt.toString(16)}`);
    }
    const group = (w0 >>> 24) & 0xf;
    const opcode = (w0 >>> 20) & 0xf;
    const channel = (w0 >>> 16) & 0xf;
    const noteIndex = (w0 >>> 8) & 0xff;
    const byte3 = w0 & 0xff;
    if (opcode === OP_NOTE_ON) {
      const velocity16 = w1 >>> 16;
      const attrData = w1 & 0xffff;
      const msg: UmpMessage =
        byte3 === UMP_ATTR_PITCH_7_9
          ? {
              kind: 'noteOn',
              group,
              channel,
              noteIndex,
              velocity16,
              attributeType: byte3,
              pitch: { note: attrData >>> 9, fraction512: attrData & 0x1ff },
            }
          : { kind: 'noteOn', group, channel, noteIndex, velocity16, attributeType: byte3 };
      out.push(msg);
    } else if (opcode === OP_NOTE_OFF) {
      out.push({ kind: 'noteOff', group, channel, noteIndex, velocity16: w1 >>> 16 });
    } else if (opcode === OP_PER_NOTE_PITCH_BEND) {
      out.push({ kind: 'perNotePitchBend', group, channel, noteIndex, data32: w1 });
    } else {
      throw new RangeError(`unsupported opcode 0x${opcode.toString(16)}`);
    }
  }
  return out;
}

/** Serialize UMP words as big-endian bytes (for byte-stream transports/files). */
export function umpToBytes(words: Uint32Array | readonly number[]): Uint8Array {
  const out = new Uint8Array(words.length * 4);
  for (let i = 0; i < words.length; i++) {
    const w = (words[i] as number) >>> 0;
    out[i * 4] = w >>> 24;
    out[i * 4 + 1] = (w >>> 16) & 0xff;
    out[i * 4 + 2] = (w >>> 8) & 0xff;
    out[i * 4 + 3] = w & 0xff;
  }
  return out;
}
