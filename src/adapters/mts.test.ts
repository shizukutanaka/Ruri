import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { midiToFreq } from '../core/midi.js';
import { equalTemperament12, edo } from '../core/tuning.js';
import { chordFromRatios, chordFromSemitones, realizeChordFreqs } from '../core/chord.js';
import { type Scale, scaleToFreqs, scaleToChordMap } from '../core/scale.js';
import {
  freqToMtsKey,
  mtsBulkDump,
  tuningToMtsFrequencies,
  chordToMts,
  tuningToMts,
  chordProgressionToMts,
  scaleToMts,
  chordMapToMts,
  bestModeMts,
  chordEntryToMts,
} from './mts.js';
import { harmonicSpectrum } from '../core/spectrum.js';

// ---------------------------------------------------------------------------
// freqToMtsKey
// ---------------------------------------------------------------------------

describe('freqToMtsKey', () => {
  it('test_440hz_is_midi69_fraction0', () => {
    expect(freqToMtsKey(440)).toEqual({ semitone: 69, fraction14: 0 });
  });

  it('test_midi_60_5_half_semitone', () => {
    // MIDI 60.5 = C4 + 0.5 semitone; fraction14 should be 8192 (= 16384/2)
    const hz = midiToFreq(60) * 2 ** (0.5 / 12);
    const key = freqToMtsKey(hz);
    expect(key.semitone).toBe(60);
    expect(key.fraction14).toBe(8192);
  });

  it('test_clamp_below_midi0', () => {
    // Sub-audible frequency well below MIDI 0 (~8.18 Hz)
    const key = freqToMtsKey(0.001);
    expect(key).toEqual({ semitone: 0, fraction14: 0 });
  });

  it('test_clamp_above_midi127', () => {
    // Way above MIDI 127 (~12543 Hz)
    const key = freqToMtsKey(999999);
    expect(key).toEqual({ semitone: 127, fraction14: 16383 });
  });

  it('test_invalid_hz_zero_throws', () => {
    expect(() => freqToMtsKey(0)).toThrow(RangeError);
  });

  it('test_invalid_hz_negative_throws', () => {
    expect(() => freqToMtsKey(-1)).toThrow(RangeError);
  });

  it('test_invalid_hz_nan_throws', () => {
    expect(() => freqToMtsKey(NaN)).toThrow(RangeError);
  });

  it('test_invalid_hz_infinity_throws', () => {
    expect(() => freqToMtsKey(Infinity)).toThrow(RangeError);
  });

  it('test_fraction14_carry_increments_semitone', () => {
    // m = 60 + 16383.5/16384: Math.round(fraction * 16384) = Math.round(16383.5) = 16384 → carry.
    // After carry: semitone becomes 61, fraction14 resets to 0.
    const mTarget = 60 + 16383.5 / 16384;
    const hzTarget = 440 * 2 ** ((mTarget - 69) / 12);
    const key = freqToMtsKey(hzTarget);
    expect(key.semitone).toBe(61);
    expect(key.fraction14).toBe(0);
  });

  it('test_fraction14_carry_reclamps_at_semitone_127', () => {
    // m = 127 + 16383.5/16384 → carry pushes semitone to 128 → re-clamped to {127, 16383}.
    const mHigh = 127 + 16383.5 / 16384;
    const hzHigh = 440 * 2 ** ((mHigh - 69) / 12);
    const key = freqToMtsKey(hzHigh);
    expect(key).toEqual({ semitone: 127, fraction14: 16383 });
  });
});

// ---------------------------------------------------------------------------
// mtsBulkDump — structure / golden bytes
// ---------------------------------------------------------------------------

describe('mtsBulkDump structure', () => {
  const flat440 = Array.from({ length: 128 }, () => 440);

  it('test_length_is_408', () => {
    expect(mtsBulkDump(flat440, 'test').length).toBe(408);
  });

  it('test_header_bytes_0_to_5', () => {
    const buf = mtsBulkDump(flat440, 'x', { deviceId: 0x00, program: 0x00 });
    expect([...buf.slice(0, 6)]).toEqual([0xf0, 0x7e, 0x00, 0x08, 0x01, 0x00]);
  });

  it('test_last_byte_is_0xf7', () => {
    expect(mtsBulkDump(flat440, 'test')[407]).toBe(0xf7);
  });

  it('test_name_padded_to_16_spaces', () => {
    const buf = mtsBulkDump(flat440, 'test');
    // 'test' = [0x74,0x65,0x73,0x74] then 12 × 0x20
    const name = [...buf.slice(6, 22)];
    expect(name).toEqual([
      0x74, 0x65, 0x73, 0x74, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
      0x20,
    ]);
  });

  it('test_name_truncated_to_16_bytes', () => {
    const longName = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const buf = mtsBulkDump(flat440, longName);
    const name = [...buf.slice(6, 22)];
    // Only first 16 chars
    expect(name).toEqual([...longName.slice(0, 16)].map((c) => c.charCodeAt(0) & 0x7f));
  });

  it('test_checksum_equals_xor_of_bytes_1_to_405', () => {
    const buf = mtsBulkDump(flat440, 'test');
    let expected = 0;
    for (let i = 1; i <= 405; i++) {
      expected ^= buf[i] as number;
    }
    expected &= 0x7f;
    expect(buf[406]).toBe(expected);
  });

  it('test_deviceId_and_program_reflected_in_header', () => {
    const buf = mtsBulkDump(flat440, '', { deviceId: 42, program: 7 });
    expect(buf[2]).toBe(42);
    expect(buf[5]).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// mtsBulkDump — validation
// ---------------------------------------------------------------------------

describe('mtsBulkDump validation', () => {
  it('test_wrong_length_throws', () => {
    expect(() => mtsBulkDump([440, 550], 'bad')).toThrow(RangeError);
  });

  it('test_bad_deviceId_throws', () => {
    const freqs = Array.from({ length: 128 }, () => 440);
    expect(() => mtsBulkDump(freqs, 'x', { deviceId: 200 })).toThrow(RangeError);
  });

  it('test_bad_program_throws', () => {
    const freqs = Array.from({ length: 128 }, () => 440);
    expect(() => mtsBulkDump(freqs, 'x', { program: -1 })).toThrow(RangeError);
  });

  it('test_invalid_frequency_in_array_throws', () => {
    const freqs = Array.from({ length: 128 }, () => 440);
    (freqs as number[])[60] = -5;
    expect(() => mtsBulkDump(freqs, 'x')).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// fast-check property tests
// ---------------------------------------------------------------------------

describe('mtsBulkDump fast-check properties', () => {
  // Use a frequency range that maps to MIDI ~13..~114 to avoid clamping at edges.
  // MIDI 13 ≈ 17.32 Hz, MIDI 114 ≈ 7458 Hz (comfortable margin).
  const safeFreqArb = fc.double({ min: 20, max: 7000, noNaN: true, noDefaultInfinity: true });

  it('property_all_data_bytes_are_7bit', () => {
    fc.assert(
      fc.property(fc.array(safeFreqArb, { minLength: 128, maxLength: 128 }), (freqs) => {
        const buf = mtsBulkDump(freqs, 'prop-test');
        // Every byte except index 0 (0xF0) and 407 (0xF7) must be ≤ 0x7F
        for (let i = 1; i <= 406; i++) {
          if ((buf[i] as number) > 0x7f) return false;
        }
        return true;
      }),
    );
  });

  it('property_decode_recovers_input_within_007_cents', () => {
    fc.assert(
      fc.property(fc.array(safeFreqArb, { minLength: 128, maxLength: 128 }), (freqs) => {
        const buf = mtsBulkDump(freqs, 'roundtrip');
        for (let k = 0; k < 128; k++) {
          const offset = 22 + k * 3;
          const xx = buf[offset] as number;
          const yy = buf[offset + 1] as number;
          const zz = buf[offset + 2] as number;
          const fraction14 = (yy << 7) | zz;
          const midiFloat = xx + fraction14 / 16384;
          // Recover frequency from MIDI float (12-TET reference)
          const recoveredHz = 440 * 2 ** ((midiFloat - 69) / 12);
          const inputHz = freqs[k] as number;
          // Compare in cents: |1200 * log2(recovered / input)| < 0.007 cents
          const centsDiff = Math.abs(1200 * Math.log2(recoveredHz / inputHz));
          if (centsDiff >= 0.007) return false;
        }
        return true;
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// tuningToMtsFrequencies
// ---------------------------------------------------------------------------

describe('tuningToMtsFrequencies', () => {
  const et12 = equalTemperament12(440);

  it('test_length_is_128', () => {
    expect(tuningToMtsFrequencies(et12)).toHaveLength(128);
  });

  it('test_key_69_is_440hz', () => {
    const freqs = tuningToMtsFrequencies(et12);
    expect(freqs[69]).toBeCloseTo(440, 8);
  });

  it('test_all_keys_have_fraction14_zero_in_12tet', () => {
    const freqs = tuningToMtsFrequencies(et12);
    for (const hz of freqs) {
      const key = freqToMtsKey(hz);
      expect(key.fraction14).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// chordToMts — microtonal chord export to MTS SysEx (Q71)
// ---------------------------------------------------------------------------

describe('chordToMts — microtonal chord to MTS SysEx in one call (Q71)', () => {
  // Just major triad: 1/1, 5/4, 3/2 (C4 root ≈ 261.63 Hz)
  const justMajor = chordFromRatios('just-major', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);
  const rootHz = 261.63;

  it('test_output_length_is_408', () => {
    expect(chordToMts(justMajor, rootHz).length).toBe(408);
  });

  it('test_first_byte_is_sysex_start', () => {
    expect(chordToMts(justMajor, rootHz)[0]).toBe(0xf0);
  });

  it('test_last_byte_is_sysex_end', () => {
    const mts = chordToMts(justMajor, rootHz);
    expect(mts[mts.length - 1]).toBe(0xf7);
  });

  it('test_chord_frequencies_encoded_at_nearest_midi_key', () => {
    // The just-major chord root ≈ C4 (MIDI 60), 5/4 root ≈ E4 (MIDI 64), 3/2 root ≈ G4 (MIDI 67)
    const mts = chordToMts(justMajor, rootHz);
    const chordFreqs = realizeChordFreqs(justMajor, rootHz);
    for (const hz of chordFreqs) {
      // Determine which MIDI key this should map to
      const midiFloat = 69 + 12 * Math.log2(hz / 440);
      const key = Math.max(0, Math.min(127, Math.round(midiFloat)));
      // Read back the encoded frequency from the MTS message
      const offset = 22 + key * 3;
      const xx = mts[offset] as number;
      const yy = mts[offset + 1] as number;
      const zz = mts[offset + 2] as number;
      const fraction14 = (yy << 7) | zz;
      const recoveredMidi = xx + fraction14 / 16384;
      const recoveredHz = 440 * 2 ** ((recoveredMidi - 69) / 12);
      // Recovered frequency should be within 0.007 cents of the input
      const centsDiff = Math.abs(1200 * Math.log2(recoveredHz / hz));
      expect(centsDiff).toBeLessThan(0.007);
    }
  });

  it('test_non_chord_keys_encode_standard_12tet', () => {
    const mts = chordToMts(justMajor, rootHz);
    const chordFreqs = realizeChordFreqs(justMajor, rootHz);
    // Collect keys used by the chord
    const chordKeys = new Set(
      chordFreqs.map((hz) => {
        const m = 69 + 12 * Math.log2(hz / 440);
        return Math.max(0, Math.min(127, Math.round(m)));
      }),
    );
    // Check a non-chord key (MIDI 0 — well below any chord note) stays at standard 12-TET
    const testKey = 0;
    if (!chordKeys.has(testKey)) {
      const offset = 22 + testKey * 3;
      const xx = mts[offset] as number;
      const yy = mts[offset + 1] as number;
      const zz = mts[offset + 2] as number;
      const fraction14 = (yy << 7) | zz;
      const recoveredMidi = xx + fraction14 / 16384;
      const standardHz = midiToFreq(testKey, 440);
      const recoveredHz = 440 * 2 ** ((recoveredMidi - 69) / 12);
      expect(Math.abs(recoveredHz - standardHz) / standardHz).toBeLessThan(0.0001);
    }
  });

  it('test_custom_opts_device_id_and_program_reflected', () => {
    const mts = chordToMts(justMajor, rootHz, { deviceId: 5, program: 3 });
    expect(mts[2]).toBe(5); // deviceId
    expect(mts[5]).toBe(3); // program
  });

  it('test_chord_name_in_mts_name_field', () => {
    const mts = chordToMts(justMajor, rootHz);
    // 'just-major' is 10 chars; bytes 6..15 should spell it out, 16..21 padded with 0x20
    const name = String.fromCharCode(...Array.from(mts.slice(6, 22)));
    expect(name.trimEnd()).toBe('just-major');
  });

  it('test_12tet_triad_encodes_near_standard_pitches', () => {
    // 12-TET major triad: semitones [0,4,7] → MIDI keys near C4, E4, G4
    const triad = chordFromSemitones('major', [0, 4, 7]);
    const mts = chordToMts(triad, 261.626); // C4
    // Chord keys 60, 64, 67 should have essentially zero fractional offset
    for (const key of [60, 64, 67]) {
      const offset = 22 + key * 3;
      const xx = mts[offset] as number;
      const yy = mts[offset + 1] as number;
      const zz = mts[offset + 2] as number;
      const fraction14 = (yy << 7) | zz;
      expect(xx).toBe(key);
      expect(fraction14).toBeLessThan(5); // essentially zero offset (< 0.002 cents)
    }
  });

  it('test_invalid_rootHz_zero_throws', () => {
    expect(() => chordToMts(justMajor, 0)).toThrow(RangeError);
  });

  it('test_invalid_rootHz_negative_throws', () => {
    expect(() => chordToMts(justMajor, -440)).toThrow(RangeError);
  });

  it('test_invalid_rootHz_nan_throws', () => {
    expect(() => chordToMts(justMajor, NaN)).toThrow(RangeError);
  });

  it('test_empty_chord_throws', () => {
    const empty = { name: 'empty', intervals: [] };
    expect(() => chordToMts(empty, 440)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// tuningToMts — TuningSystem → MTS SysEx in one call (Q73)
// ---------------------------------------------------------------------------

describe('tuningToMts — TuningSystem to MTS SysEx in one call (Q73)', () => {
  const et12 = equalTemperament12(440);

  it('test_output_length_is_408', () => {
    expect(tuningToMts(et12).length).toBe(408);
  });

  it('test_first_byte_is_sysex_start', () => {
    expect(tuningToMts(et12)[0]).toBe(0xf0);
  });

  it('test_last_byte_is_sysex_end', () => {
    const mts = tuningToMts(et12);
    expect(mts[mts.length - 1]).toBe(0xf7);
  });

  it('test_matches_manual_pipeline_for_12tet', () => {
    const manual = mtsBulkDump(tuningToMtsFrequencies(et12), et12.id);
    const oneCall = tuningToMts(et12);
    expect(oneCall).toEqual(manual);
  });

  it('test_tuning_id_used_as_name_by_default', () => {
    const mts = tuningToMts(et12);
    // Name field is bytes 6..21; et12.id = '12-tet' (6 chars), rest padded with 0x20
    const name = String.fromCharCode(...Array.from(mts.slice(6, 22)));
    expect(name.trimEnd()).toBe('12-tet');
  });

  it('test_custom_name_overrides_tuning_id', () => {
    const mts = tuningToMts(et12, 'my-tuning');
    const name = String.fromCharCode(...Array.from(mts.slice(6, 22)));
    expect(name.trimEnd()).toBe('my-tuning');
  });

  it('test_anchor_midi_note_option_shifts_mapping', () => {
    // Default: key 69 → 440 Hz. With anchorMidiNote=60, key 60 → referenceHz (440).
    const mts60 = tuningToMts(et12, undefined, { anchorMidiNote: 60 });
    const offset = 22 + 60 * 3;
    const xx = mts60[offset] as number;
    const yy = mts60[offset + 1] as number;
    const zz = mts60[offset + 2] as number;
    const fraction14 = (yy << 7) | zz;
    const recoveredMidi = xx + fraction14 / 16384;
    const recoveredHz = 440 * 2 ** ((recoveredMidi - 69) / 12);
    expect(recoveredHz).toBeCloseTo(440, 2);
  });

  it('test_19edo_produces_non_12tet_tuning', () => {
    const t19 = edo(19);
    const mts12 = tuningToMts(et12);
    const mts19 = tuningToMts(t19);
    // The two messages should differ in key data
    let differs = false;
    for (let i = 22; i < 22 + 384; i++) {
      if (mts12[i] !== mts19[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_custom_device_id_and_program_reflected', () => {
    const mts = tuningToMts(et12, undefined, { deviceId: 7, program: 2 });
    expect(mts[2]).toBe(7);
    expect(mts[5]).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// chordProgressionToMts — Chord[] → array of MTS SysEx buffers (Q76)
// ---------------------------------------------------------------------------

describe('chordProgressionToMts — chord progression to MTS SysEx array in one call (Q76)', () => {
  const justMajor = chordFromRatios('just-major', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);
  const justMinor = chordFromRatios('just-minor', [
    [1, 1],
    [6, 5],
    [3, 2],
  ]);
  const rootHz = 261.63;

  it('test_returns_one_buffer_per_chord', () => {
    const result = chordProgressionToMts([justMajor, justMinor], rootHz);
    expect(result).toHaveLength(2);
  });

  it('test_each_buffer_is_408_bytes', () => {
    const result = chordProgressionToMts([justMajor, justMinor], rootHz);
    for (const buf of result) {
      expect(buf.length).toBe(408);
    }
  });

  it('test_each_buffer_starts_with_sysex_start', () => {
    const result = chordProgressionToMts([justMajor, justMinor], rootHz);
    for (const buf of result) {
      expect(buf[0]).toBe(0xf0);
    }
  });

  it('test_each_buffer_ends_with_sysex_end', () => {
    const result = chordProgressionToMts([justMajor, justMinor], rootHz);
    for (const buf of result) {
      expect(buf[buf.length - 1]).toBe(0xf7);
    }
  });

  it('test_matches_individual_chordToMts_calls', () => {
    const result = chordProgressionToMts([justMajor, justMinor], rootHz);
    const manual0 = chordToMts(justMajor, rootHz);
    const manual1 = chordToMts(justMinor, rootHz);
    expect(result[0]).toEqual(manual0);
    expect(result[1]).toEqual(manual1);
  });

  it('test_major_and_minor_produce_different_buffers', () => {
    const result = chordProgressionToMts([justMajor, justMinor], rootHz);
    let differs = false;
    for (let i = 0; i < 408; i++) {
      if (result[0]![i] !== result[1]![i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_single_chord_returns_array_of_one', () => {
    const result = chordProgressionToMts([justMajor], rootHz);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(chordToMts(justMajor, rootHz));
  });

  it('test_empty_chords_throws_range_error', () => {
    expect(() => chordProgressionToMts([], rootHz)).toThrow(RangeError);
  });

  it('test_opts_forwarded_to_each_chordToMts', () => {
    const result = chordProgressionToMts([justMajor, justMinor], rootHz, {
      deviceId: 3,
      program: 7,
    });
    for (const buf of result) {
      expect(buf[2]).toBe(3); // deviceId
      expect(buf[5]).toBe(7); // program
    }
  });
});

// ---------------------------------------------------------------------------
// scaleToMts — Scale → MTS SysEx in one call (Q101)
// ---------------------------------------------------------------------------

describe('scaleToMts — Scale to MTS SysEx in one call (Q101)', () => {
  const tuning = edo(12);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-edo',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_output_length_is_408', () => {
    expect(scaleToMts(major, tuning).length).toBe(408);
  });

  it('test_first_byte_is_sysex_start', () => {
    expect(scaleToMts(major, tuning)[0]).toBe(0xf0);
  });

  it('test_last_byte_is_sysex_end', () => {
    const mts = scaleToMts(major, tuning);
    expect(mts[mts.length - 1]).toBe(0xf7);
  });

  it('test_scale_id_used_as_name_by_default', () => {
    const mts = scaleToMts(major, tuning);
    const name = String.fromCharCode(...Array.from(mts.slice(6, 22)));
    expect(name.trimEnd()).toBe('major');
  });

  it('test_custom_name_overrides_scale_id', () => {
    const mts = scaleToMts(major, tuning, 'my-scale');
    const name = String.fromCharCode(...Array.from(mts.slice(6, 22)));
    expect(name.trimEnd()).toBe('my-scale');
  });

  it('test_scale_degrees_encoded_at_contiguous_midi_keys_from_middleNote', () => {
    // With default middleNote=60, degree 0 → key 60, degree 1 → key 61, etc.
    // A major scale on 12-EDO at middle C: degrees [0,2,4,5,7,9,11] → Hz values
    const mts = scaleToMts(major, tuning);
    const scaleFreqs = scaleToFreqs(major, tuning);
    for (let i = 0; i < scaleFreqs.length; i++) {
      const key = 60 + i;
      const offset = 22 + key * 3;
      const xx = mts[offset] as number;
      const yy = mts[offset + 1] as number;
      const zz = mts[offset + 2] as number;
      const fraction14 = (yy << 7) | zz;
      const recoveredMidi = xx + fraction14 / 16384;
      const recoveredHz = 440 * 2 ** ((recoveredMidi - 69) / 12);
      const centsDiff = Math.abs(1200 * Math.log2(recoveredHz / (scaleFreqs[i] as number)));
      expect(centsDiff).toBeLessThan(0.007);
    }
  });

  it('test_non_scale_keys_retain_standard_12tet', () => {
    const mts = scaleToMts(major, tuning);
    // Key 0 (MIDI 0) is well below the scale range; should be standard 12-TET
    const testKey = 0;
    const offset = 22 + testKey * 3;
    const xx = mts[offset] as number;
    const yy = mts[offset + 1] as number;
    const zz = mts[offset + 2] as number;
    const fraction14 = (yy << 7) | zz;
    const recoveredMidi = xx + fraction14 / 16384;
    const standardHz = midiToFreq(testKey, 440);
    const recoveredHz = 440 * 2 ** ((recoveredMidi - 69) / 12);
    expect(Math.abs(recoveredHz - standardHz) / standardHz).toBeLessThan(0.0001);
  });

  it('test_custom_middleNote_shifts_mapping', () => {
    // With middleNote=48, first scale degree maps to key 48
    const mts = scaleToMts(major, tuning, undefined, { middleNote: 48 });
    // Key 48 should hold the first scale degree frequency (tuning.referenceHz at degree 0
    // is edo(12).referenceHz = 440 shifted by -9 semitones = 261.63 Hz approx)
    const offset = 22 + 48 * 3;
    const xx = mts[offset] as number;
    const yy = mts[offset + 1] as number;
    const zz = mts[offset + 2] as number;
    const fraction14 = (yy << 7) | zz;
    const recoveredMidi = xx + fraction14 / 16384;
    const recoveredHz = 440 * 2 ** ((recoveredMidi - 69) / 12);
    // Degree 0 of 12-EDO at referenceHz=440 (A4). Key 48 should now hold that Hz.
    expect(recoveredHz).toBeCloseTo(440, 1);
  });

  it('test_custom_device_id_and_program_reflected', () => {
    const mts = scaleToMts(major, tuning, undefined, { deviceId: 5, program: 2 });
    expect(mts[2]).toBe(5);
    expect(mts[5]).toBe(2);
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const wrongTuning = edo(19);
    expect(() => scaleToMts(major, wrongTuning)).toThrow(RangeError);
  });

  it('test_12tet_major_vs_pentatonic_produce_different_mts', () => {
    const pentatonic: Scale = {
      id: 'penta',
      name: 'Pentatonic',
      tuningId: '12-edo',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const mtsMajor = scaleToMts(major, tuning);
    const mtsPenta = scaleToMts(pentatonic, tuning);
    let differs = false;
    for (let i = 22; i < 406; i++) {
      if (mtsMajor[i] !== mtsPenta[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// chordMapToMts — ScaleChordMapEntry[] → MTS bulk dump in one call (Q139)
// ---------------------------------------------------------------------------

describe('chordMapToMts — chord map to MTS bulk dump in one call (Q139)', () => {
  const tuning = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_output_length_is_408', () => {
    const chordMap = scaleToChordMap(major, tuning);
    expect(chordMapToMts(chordMap).length).toBe(408);
  });

  it('test_first_byte_is_sysex_start', () => {
    const chordMap = scaleToChordMap(major, tuning);
    expect(chordMapToMts(chordMap)[0]).toBe(0xf0);
  });

  it('test_last_byte_is_sysex_end', () => {
    const chordMap = scaleToChordMap(major, tuning);
    const mts = chordMapToMts(chordMap);
    expect(mts[mts.length - 1]).toBe(0xf7);
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => chordMapToMts([])).toThrow(RangeError);
  });

  it('test_custom_device_id_and_program_reflected', () => {
    const chordMap = scaleToChordMap(major, tuning);
    const mts = chordMapToMts(chordMap, 'test', { deviceId: 4, program: 2 });
    expect(mts[2]).toBe(4); // deviceId
    expect(mts[5]).toBe(2); // program
  });

  it('test_different_root_hz_produces_different_mts', () => {
    const chordMap = scaleToChordMap(major, tuning);
    const mts261 = chordMapToMts(chordMap, 'test', { rootHz: 261.63 });
    const mts440 = chordMapToMts(chordMap, 'test', { rootHz: 440 });
    let differs = false;
    for (let i = 22; i < 406; i++) {
      if (mts261[i] !== mts440[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// bestModeMts — bestModeForTuning → scaleToMts in one call (Q159)
// ---------------------------------------------------------------------------

describe('bestModeMts — best mode for tuning → MTS bulk dump in one call (Q159)', () => {
  const tuning = equalTemperament12(440);
  const spectrum = harmonicSpectrum();

  it('test_output_length_is_408', () => {
    expect(bestModeMts(tuning).length).toBe(408);
  });

  it('test_first_byte_is_sysex_start', () => {
    expect(bestModeMts(tuning)[0]).toBe(0xf0);
  });

  it('test_last_byte_is_sysex_end', () => {
    const mts = bestModeMts(tuning);
    expect(mts[mts.length - 1]).toBe(0xf7);
  });

  it('test_with_spectrum_produces_valid_408_byte_output', () => {
    const mts = bestModeMts(tuning, spectrum);
    expect(mts.length).toBe(408);
    expect(mts[0]).toBe(0xf0);
  });

  it('test_different_tunings_produce_different_mts', () => {
    const t19 = edo(19);
    const mts12 = bestModeMts(tuning);
    const mts19 = bestModeMts(t19);
    let differs = false;
    for (let i = 22; i < 406; i++) {
      if (mts12[i] !== mts19[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_custom_device_id_reflected_in_output', () => {
    const mts = bestModeMts(tuning, undefined, { deviceId: 7 });
    expect(mts[2]).toBe(7);
  });
});

// Q165 — chordEntryToMts: ScaleChordMapEntry → 408-byte MTS SysEx in one call
describe('chordEntryToMts (Q165)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_408_byte_uint8array', () => {
    const chordMap = scaleToChordMap(major, t12);
    const mts = chordEntryToMts(chordMap[0]!, t12);
    expect(mts).toBeInstanceOf(Uint8Array);
    expect(mts.length).toBe(408);
  });

  it('test_starts_with_sysex_header', () => {
    const chordMap = scaleToChordMap(major, t12);
    const mts = chordEntryToMts(chordMap[0]!, t12);
    expect(mts[0]).toBe(0xf0);
    expect(mts[1]).toBe(0x7e);
    expect(mts[407]).toBe(0xf7);
  });

  it('test_different_entries_produce_different_chord_name_bytes', () => {
    const chordMap = scaleToChordMap(major, t12);
    // Different entries have different chord names → name field differs
    const mts0 = chordEntryToMts(chordMap[0]!, t12);
    const mts3 = chordEntryToMts(chordMap[3]!, t12);
    let differs = false;
    for (let i = 0; i < 408; i++) {
      if (mts0[i] !== mts3[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_matches_chordToMts_with_referenceHz', () => {
    const chordMap = scaleToChordMap(major, t12);
    const entry = chordMap[0]!;
    const viachordEntryToMts = chordEntryToMts(entry, t12);
    const viaChordToMts = chordToMts(entry.chord, t12.referenceHz);
    expect(viachordEntryToMts).toEqual(viaChordToMts);
  });

  it('test_device_id_option_respected', () => {
    const chordMap = scaleToChordMap(major, t12);
    const mts = chordEntryToMts(chordMap[0]!, t12, { deviceId: 5 });
    expect(mts[2]).toBe(5);
  });
});
