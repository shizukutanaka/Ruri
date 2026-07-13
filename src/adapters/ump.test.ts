import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  freqToPitch79,
  pitch79ToFreq,
  umpNoteOnPitch79,
  umpNoteOff,
  umpPerNotePitchBend,
  chordToUmp,
  tuningDegreeToUmp,
  decodeUmp,
  umpToBytes,
  UMP_ATTR_PITCH_7_9,
  UMP_BEND_CENTER,
} from './ump.js';
import { chordFromRatios } from '../core/chord.js';
import { edo } from '../core/tuning.js';
import { freqToCents } from '../core/cents.js';

describe('freqToPitch79 / pitch79ToFreq', () => {
  it('test_a4_440_is_note_69_fraction_0', () => {
    expect(freqToPitch79(440)).toEqual({ note: 69, fraction512: 0 });
  });

  it('test_quarter_tone_above_a4_is_fraction_256', () => {
    // +50 cents = half a semitone = 256/512.
    const hz = 440 * 2 ** (50 / 1200);
    expect(freqToPitch79(hz)).toEqual({ note: 69, fraction512: 256 });
  });

  it('test_fraction_carry_rounds_up_to_next_note', () => {
    // +99.95 cents rounds to 512/512 → carries to note 70 fraction 0.
    const hz = 440 * 2 ** (99.95 / 1200);
    expect(freqToPitch79(hz)).toEqual({ note: 70, fraction512: 0 });
  });

  it('test_out_of_range_clamps_to_boundaries', () => {
    expect(freqToPitch79(1)).toEqual({ note: 0, fraction512: 0 });
    expect(freqToPitch79(30000)).toEqual({ note: 127, fraction512: 511 });
  });

  it('test_invalid_inputs_throw', () => {
    expect(() => freqToPitch79(0)).toThrow(RangeError);
    expect(() => freqToPitch79(-5)).toThrow(RangeError);
    expect(() => pitch79ToFreq({ note: 128, fraction512: 0 })).toThrow(RangeError);
    expect(() => pitch79ToFreq({ note: 60, fraction512: 512 })).toThrow(RangeError);
  });

  it('property_freq_pitch79_round_trip_within_half_step_unit', () => {
    // 1/512 semitone ≈ 0.1953c; nearest rounding → error ≤ half that (~0.0977c).
    fc.assert(
      fc.property(fc.double({ min: 20, max: 12000, noNaN: true }), (hz) => {
        const back = pitch79ToFreq(freqToPitch79(hz));
        expect(Math.abs(freqToCents(back, hz))).toBeLessThanOrEqual(0.1);
      }),
    );
  });
});

describe('UMP note on — golden bytes (hand-computed)', () => {
  it('test_a4_note_on_words_match_hand_computed', () => {
    // word0: MT=4 | group=0 | op=9 | ch=0 | note=69 (0x45) | attrType=3
    //   (0x4<<28)|(0x9<<20)|(0x45<<8)|0x03 = 0x40904503
    // word1: velocity 0x8000 << 16 | attrData (69<<9 = 0x8A00) = 0x80008A00
    const words = umpNoteOnPitch79(69, { note: 69, fraction512: 0 }, { velocity16: 0x8000 });
    expect(Array.from(words, (w) => w >>> 0)).toEqual([0x40904503, 0x80008a00]);
  });

  it('test_group_channel_fields_placed_correctly', () => {
    const words = umpNoteOnPitch79(60, { note: 60, fraction512: 0 }, { group: 2, channel: 5 });
    expect((words[0]! >>> 24) & 0xf).toBe(2);
    expect((words[0]! >>> 16) & 0xf).toBe(5);
  });

  it('test_umpToBytes_is_big_endian', () => {
    const bytes = umpToBytes([0x40904503, 0x80008a00]);
    expect(Array.from(bytes)).toEqual([0x40, 0x90, 0x45, 0x03, 0x80, 0x00, 0x8a, 0x00]);
  });

  it('test_field_range_validation_throws', () => {
    const p = { note: 60, fraction512: 0 };
    expect(() => umpNoteOnPitch79(128, p)).toThrow(RangeError);
    expect(() => umpNoteOnPitch79(60, p, { group: 16 })).toThrow(RangeError);
    expect(() => umpNoteOnPitch79(60, p, { channel: -1 })).toThrow(RangeError);
    expect(() => umpNoteOnPitch79(60, p, { velocity16: 0x10000 })).toThrow(RangeError);
  });
});

describe('UMP golden round-trip (encode → decode = identity)', () => {
  it('test_note_on_round_trip', () => {
    const pitch = { note: 64, fraction512: 300 };
    const [msg] = decodeUmp(umpNoteOnPitch79(64, pitch, { group: 1, channel: 3, velocity16: 42 }));
    expect(msg).toEqual({
      kind: 'noteOn',
      group: 1,
      channel: 3,
      noteIndex: 64,
      velocity16: 42,
      attributeType: UMP_ATTR_PITCH_7_9,
      pitch,
    });
  });

  it('test_note_off_round_trip', () => {
    const [msg] = decodeUmp(umpNoteOff(64, { channel: 3, velocity16: 7 }));
    expect(msg).toEqual({ kind: 'noteOff', group: 0, channel: 3, noteIndex: 64, velocity16: 7 });
  });

  it('test_per_note_bend_center_and_extremes', () => {
    const [center] = decodeUmp(umpPerNotePitchBend(60, 0, 2));
    expect(center).toMatchObject({ kind: 'perNotePitchBend', noteIndex: 60 });
    expect((center as { data32: number }).data32).toBe(UMP_BEND_CENTER);

    const [up] = decodeUmp(umpPerNotePitchBend(60, 200, 2)); // full-scale up at ±2 semis
    expect((up as { data32: number }).data32).toBe(0xffffffff);

    const [beyond] = decodeUmp(umpPerNotePitchBend(60, 9999, 2)); // clamps, no overflow
    expect((beyond as { data32: number }).data32).toBe(0xffffffff);
  });

  it('property_note_on_round_trip_all_fields', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 127 }),
        fc.integer({ min: 0, max: 511 }),
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 0, max: 0xffff }),
        (note, frac, group, channel, vel) => {
          const pitch = { note, fraction512: frac };
          const [msg] = decodeUmp(
            umpNoteOnPitch79(note, pitch, { group, channel, velocity16: vel }),
          );
          expect(msg).toEqual({
            kind: 'noteOn',
            group,
            channel,
            noteIndex: note,
            velocity16: vel,
            attributeType: UMP_ATTR_PITCH_7_9,
            pitch,
          });
        },
      ),
    );
  });

  it('test_decode_rejects_odd_word_count_and_wrong_type', () => {
    expect(() => decodeUmp([0x40904503])).toThrow(RangeError);
    expect(() => decodeUmp([0x20904503, 0])).toThrow(RangeError); // MT=2 (MIDI 1.0 CV)
  });
});

describe('chordToUmp / tuningDegreeToUmp — core-type bridges', () => {
  const justMajor = chordFromRatios('just-major', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);

  it('test_chord_emits_one_note_on_per_tone_with_exact_pitch', () => {
    const rootHz = 261.6256; // C4 at A4=440
    const msgs = decodeUmp(chordToUmp(justMajor, rootHz));
    expect(msgs).toHaveLength(3);
    const freqs = msgs.map((m) =>
      m.kind === 'noteOn' && m.pitch ? pitch79ToFreq(m.pitch) : Number.NaN,
    );
    // Recovered frequencies match the just ratios within Pitch 7.9 resolution.
    expect(Math.abs(freqToCents(freqs[0]!, rootHz))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(freqToCents(freqs[1]!, rootHz * 1.25))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(freqToCents(freqs[2]!, rootHz * 1.5))).toBeLessThanOrEqual(0.1);
  });

  it('test_tuning_degree_exact_pitch_in_19_edo', () => {
    const t19 = edo(19);
    const msg = decodeUmp(tuningDegreeToUmp(t19, 3))[0]!; // 3 steps of 1200/19 above A4
    const expectHz = 440 * 2 ** ((3 * (1200 / 19)) / 1200);
    expect(msg.kind).toBe('noteOn');
    if (msg.kind === 'noteOn' && msg.pitch) {
      expect(Math.abs(freqToCents(pitch79ToFreq(msg.pitch), expectHz))).toBeLessThanOrEqual(0.1);
    } else {
      throw new Error('expected noteOn with pitch attribute');
    }
  });
});
