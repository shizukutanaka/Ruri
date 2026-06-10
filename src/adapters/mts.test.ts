import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { midiToFreq } from '../core/midi.js';
import { equalTemperament12 } from '../core/tuning.js';
import { freqToMtsKey, mtsBulkDump, tuningToMtsFrequencies } from './mts.js';

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
