import { describe, it, expect } from 'vitest';
import { type Scale, scaleToCents, scaleToFreqs } from './scale.js';
import { equalTemperament12, edo, degreeToFreq } from './tuning.js';

const t12 = equalTemperament12(440);

// Ionian (major) mode over 12-TET: W-W-H-W-W-W-H.
const major: Scale = {
  id: 'major',
  name: 'Ionian',
  tuningId: '12-tet',
  degreeIndices: [0, 2, 4, 5, 7, 9, 11],
};

describe('scaleToCents', () => {
  it('test_major_mode_cents', () => {
    expect(scaleToCents(major, t12)).toEqual([0, 200, 400, 500, 700, 900, 1100]);
  });

  it('test_octave_spanning_indices_wrap_and_advance_period', () => {
    // Index 12 = one period above degree 0 → 1200c; index 14 → 1400c.
    const spanning: Scale = { ...major, degreeIndices: [0, 12, 14] };
    expect(scaleToCents(spanning, t12)).toEqual([0, 1200, 1400]);
  });

  it('test_tuning_id_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0] };
    expect(() => scaleToCents(wrong, t12)).toThrow(RangeError);
  });
});

describe('scaleToFreqs — bridge to the frequency world', () => {
  it('test_root_is_reference_hz', () => {
    const freqs = scaleToFreqs(major, t12);
    expect(freqs[0]).toBeCloseTo(440, 9); // degree 0 = referenceHz
  });

  it('test_fifth_is_3_2_ish', () => {
    // Scale degree 4 = 700c = 12-TET fifth ≈ 1.4983 * root.
    const freqs = scaleToFreqs(major, t12);
    expect(freqs[4] as number).toBeCloseTo(440 * 2 ** (700 / 1200), 6);
  });

  it('test_matches_degreeToFreq_per_index', () => {
    const freqs = scaleToFreqs(major, t12);
    major.degreeIndices.forEach((d, i) => {
      expect(freqs[i] as number).toBeCloseTo(degreeToFreq(t12, d), 9);
    });
  });

  it('test_octave_spanning_index_doubles_root', () => {
    const spanning: Scale = { ...major, degreeIndices: [0, 12] };
    const freqs = scaleToFreqs(spanning, t12);
    expect(freqs[1] as number).toBeCloseTo(880, 6); // one octave up
  });

  it('test_non_octave_tuning_respected', () => {
    // Bohlen-Pierce-style: 13-EDO of a 3/1 period (1902c). Degree 13 = one period up = 3x.
    const bp = edo(13, 440, 1200 * Math.log2(3));
    const s: Scale = { id: 'bp', name: 'bp', tuningId: '13-edo', degreeIndices: [0, 13] };
    const freqs = scaleToFreqs(s, bp);
    expect(freqs[0] as number).toBeCloseTo(440, 9);
    expect(freqs[1] as number).toBeCloseTo(1320, 4); // 440 * 3
  });

  it('test_tuning_id_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0] };
    expect(() => scaleToFreqs(wrong, t12)).toThrow(RangeError);
  });
});
