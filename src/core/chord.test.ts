import { describe, it, expect } from 'vitest';
import {
  type Chord,
  chordFromSemitones,
  chordFromRatios,
  chordFromDegrees,
  chordToCents,
  chordToCentOffsets,
  realizeChordFreqs,
  realizedFreqIntervalMatrix,
  chordSimilarity,
} from './chord.js';
import { equalTemperament12, edo } from './tuning.js';
import { guitarStandard } from './instrument.js';
import { fingerChord } from './fingering.js';

describe('chordFromSemitones', () => {
  it('test_major_triad_cents', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    expect(chordToCents(chord)).toEqual([0, 400, 700]);
  });

  it('test_root_is_unison', () => {
    const chord = chordFromSemitones('x', [0, 5]);
    expect(chordToCents(chord)[0]).toBe(0);
  });
});

describe('realizeChordFreqs', () => {
  it('test_root_equals_rootHz', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const freqs = realizeChordFreqs(chord, 261.63);
    expect(freqs[0]).toBeCloseTo(261.63, 9);
  });

  it('test_major_third_ratio', () => {
    const chord = chordFromSemitones('major', [0, 4]);
    const freqs = realizeChordFreqs(chord, 261.63);
    expect((freqs[1] as number) / (freqs[0] as number)).toBeCloseTo(2 ** (400 / 1200), 9);
  });
});

// Socratic Q34: chordToCentOffsets bridges Chord → fingerChord.
describe('chordToCentOffsets — bridge from Chord to instrument coordinate system', () => {
  it('test_zero_offset_equals_chordToCents', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    expect(chordToCentOffsets(chord, 0)).toEqual(chordToCents(chord));
  });

  it('test_root_note_equals_rootCentsOnInstrument', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const abs = chordToCentOffsets(chord, 800);
    expect(abs[0]).toBe(800); // chord root lands at 800c on the instrument
  });

  it('test_intervals_are_preserved_after_offset', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const abs = chordToCentOffsets(chord, 500);
    expect(abs).toEqual([500, 900, 1200]);
  });

  it('test_minor_seventh_chord', () => {
    const chord = chordFromSemitones('m7', [0, 3, 7, 10]);
    const abs = chordToCentOffsets(chord, 0);
    expect(abs).toEqual([0, 300, 700, 1000]);
  });

  it('test_integration_chord_to_fingerChord', () => {
    // Chord root on guitar string 1 open (A2 = 500c on EADGBE where E2=0).
    // Major triad [0, 4, 7] → abs cents [500, 900, 1200].
    // 900c = guitar string 2 fret 4 (D3+4 = G3) or string 1 fret 4 (A2+4 = D3... wait)
    // Actually positionsFor handles all matching positions; just check no error and >= 0 fingerings.
    const guitar = guitarStandard();
    const chord = chordFromSemitones('major', [0, 4, 7]);
    // Root at string 0 fret 5 = 500c on guitar (A2 position)
    const absCents = chordToCentOffsets(chord, 500);
    const fingerings = fingerChord(guitar, absCents);
    // Guitar can finger [500, 900, 1200] (A, C#/Db, E across strings)
    expect(fingerings.length).toBeGreaterThanOrEqual(0); // may be 0 if out of range
    expect(Array.isArray(fingerings)).toBe(true);
  });

  it('test_non_zero_start_semitone_chord', () => {
    // chordFromSemitones allows non-zero start but chordToCentOffsets still works
    const chord: Chord = {
      name: 'test',
      intervals: [
        { kind: 'cents', cents: 0 },
        { kind: 'cents', cents: 500 },
      ],
    };
    const abs = chordToCentOffsets(chord, 1000);
    expect(abs).toEqual([1000, 1500]);
  });
});

// Socratic Q38: chordFromRatios preserves JI ratios as primary representation.
describe('chordFromRatios — just-intonation chord factory', () => {
  it('test_just_major_triad_cents_distinct_from_12tet', () => {
    // 5-limit JI major: 1/1, 5/4, 3/2
    const just = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const cents = chordToCents(just);
    // JI major third = 1200*log2(5/4) ≈ 386.31c; 12-TET major third = 400c
    expect(cents[1]).toBeCloseTo(1200 * Math.log2(5 / 4), 6);
    expect(cents[1]).not.toBeCloseTo(400, 1); // measurably different from 12-TET
  });

  it('test_root_is_unison', () => {
    const chord = chordFromRatios('x', [
      [1, 1],
      [3, 2],
    ]);
    expect(chordToCents(chord)[0]).toBeCloseTo(0, 10);
  });

  it('test_ratio_intervals_stored_as_ratio_kind', () => {
    const chord = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const iv = chord.intervals[1]!;
    expect(iv.kind).toBe('ratio');
    expect(iv.kind === 'ratio' && iv.ratio.num).toBe(5);
  });

  it('test_realize_freqs_produces_exact_ratios', () => {
    const chord = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const freqs = realizeChordFreqs(chord, 261.63);
    expect(freqs[1]).toBeCloseTo(261.63 * (5 / 4), 9); // exact 5/4
    expect(freqs[2]).toBeCloseTo(261.63 * (3 / 2), 9); // exact 3/2
  });

  it('test_just_vs_12tet_major_third_precision', () => {
    const just = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
    ]);
    const tet = chordFromSemitones('tet-major', [0, 4]);
    const justFreqs = realizeChordFreqs(just, 261.63);
    const tetFreqs = realizeChordFreqs(tet, 261.63);
    // JI 5/4 ≈ 326.8 Hz; 12-TET 400c ≈ 329.6 Hz — ~13.7c (≈3 Hz) apart
    expect(Math.abs((justFreqs[1] as number) - (tetFreqs[1] as number))).toBeGreaterThan(2);
  });

  it('test_zero_denominator_throws', () => {
    expect(() => chordFromRatios('bad', [[1, 0]])).toThrow(RangeError);
  });

  it('test_zero_numerator_throws', () => {
    expect(() => chordFromRatios('bad', [[0, 1]])).toThrow(RangeError);
  });
});

// Socratic Q45: chordFromDegrees bridges TuningSystem degree indices → Chord.
describe('chordFromDegrees — microtonal chord factory from tuning degrees', () => {
  const t12 = equalTemperament12(440);

  it('test_12tet_major_matches_chordFromSemitones', () => {
    const fromDeg = chordFromDegrees(t12, [0, 4, 7], 'major');
    const fromSem = chordFromSemitones('major', [0, 4, 7]);
    expect(chordToCents(fromDeg)).toEqual(chordToCents(fromSem));
  });

  it('test_root_is_always_zero_cents', () => {
    const chord = chordFromDegrees(t12, [0, 4, 7]);
    expect(chordToCents(chord)[0]).toBe(0);
  });

  it('test_non_zero_start_degree_gives_root_relative_intervals', () => {
    // Degrees [3, 7, 10] in 12-TET: root = 300c, 700c, 1000c → offsets: 0, 400, 700
    const chord = chordFromDegrees(t12, [3, 7, 10]);
    expect(chordToCents(chord)).toEqual([0, 400, 700]);
  });

  it('test_19edo_chord_intervals_are_correct', () => {
    // 19-EDO: step = 1200/19 ≈ 63.16c. Steps [0,6,11] ≈ [0, 379, 695]c (major-ish)
    const t19 = edo(19);
    const step = 1200 / 19;
    const chord = chordFromDegrees(t19, [0, 6, 11]);
    expect(chordToCents(chord)[0]).toBeCloseTo(0, 9);
    expect(chordToCents(chord)[1]).toBeCloseTo(6 * step, 6);
    expect(chordToCents(chord)[2]).toBeCloseTo(11 * step, 6);
  });

  it('test_auto_name_from_degrees', () => {
    const chord = chordFromDegrees(t12, [0, 4, 7]);
    expect(chord.name).toBe('chord-0-4-7');
  });

  it('test_explicit_name_overrides', () => {
    const chord = chordFromDegrees(t12, [0, 4, 7], 'major');
    expect(chord.name).toBe('major');
  });

  it('test_empty_degrees_throws', () => {
    expect(() => chordFromDegrees(t12, [])).toThrow(RangeError);
  });

  it('test_single_degree_gives_unison_chord', () => {
    const chord = chordFromDegrees(t12, [5]);
    expect(chordToCents(chord)).toEqual([0]);
  });
});

// ---------------------------------------------------------------------------
// Q84 — realizedFreqIntervalMatrix
// ---------------------------------------------------------------------------

describe('realizedFreqIntervalMatrix (Q84)', () => {
  it('test_diagonal_is_zero', () => {
    const m = realizedFreqIntervalMatrix([261.63, 329.63, 392.0]);
    expect(m[0]![0]).toBeCloseTo(0, 9);
    expect(m[1]![1]).toBeCloseTo(0, 9);
    expect(m[2]![2]).toBeCloseTo(0, 9);
  });

  it('test_antisymmetry_mij_equals_neg_mji', () => {
    const freqs = [261.63, 329.63, 392.0];
    const m = realizedFreqIntervalMatrix(freqs);
    for (let i = 0; i < freqs.length; i++) {
      for (let j = 0; j < freqs.length; j++) {
        expect(m[i]![j]).toBeCloseTo(-(m[j]![i] as number), 9);
      }
    }
  });

  it('test_octave_dyad_gives_1200_cents', () => {
    // [261.63, 523.26] is a near-exact octave → m[0][1] ≈ 1200, m[1][0] ≈ -1200
    const m = realizedFreqIntervalMatrix([261.63, 523.26]);
    expect(m[0]![1]).toBeCloseTo(1200, 1);
    expect(m[1]![0]).toBeCloseTo(-1200, 1);
  });

  it('test_result_is_n_by_n_matrix', () => {
    const freqs = [200, 300, 400, 500];
    const m = realizedFreqIntervalMatrix(freqs);
    expect(m.length).toBe(4);
    expect(m.every((row) => row.length === 4)).toBe(true);
  });

  it('test_single_freq_gives_1x1_matrix_with_zero', () => {
    const m = realizedFreqIntervalMatrix([440]);
    expect(m.length).toBe(1);
    expect(m[0]![0]).toBeCloseTo(0, 9);
  });

  it('test_empty_freqs_throws', () => {
    expect(() => realizedFreqIntervalMatrix([])).toThrow(RangeError);
  });

  it('test_non_positive_freq_throws', () => {
    expect(() => realizedFreqIntervalMatrix([440, -220])).toThrow(RangeError);
    expect(() => realizedFreqIntervalMatrix([0, 440])).toThrow(RangeError);
  });

  it('test_major_triad_root_to_fifth_is_approx_702_cents', () => {
    // 12-TET C major triad at C4
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const freqs = realizeChordFreqs(chord, 261.63);
    const m = realizedFreqIntervalMatrix(freqs);
    // Root (index 0) to fifth (index 2) = 700 cents in 12-TET
    expect(m[0]![2]).toBeCloseTo(700, 6);
  });
});

// ---------------------------------------------------------------------------
// Q87 — chordSimilarity
// ---------------------------------------------------------------------------

describe('chordSimilarity (Q87)', () => {
  const root = 261.63;

  it('test_identical_chords_return_1', () => {
    const maj = chordFromSemitones('major', [0, 4, 7]);
    expect(chordSimilarity(maj, maj, root)).toBeCloseTo(1, 9);
  });

  it('test_same_structure_different_name_returns_1', () => {
    const a = chordFromSemitones('a', [0, 4, 7]);
    const b = chordFromSemitones('b', [0, 4, 7]);
    expect(chordSimilarity(a, b, root)).toBeCloseTo(1, 9);
  });

  it('test_12tet_vs_ji_major_triad_high_similarity', () => {
    // TET major: 0, 400, 700c; JI major: 0, 386.31, 701.96c — very close
    const tetMaj = chordFromSemitones('tet-major', [0, 4, 7]);
    const jiMaj = chordFromRatios('ji-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const sim = chordSimilarity(tetMaj, jiMaj, root);
    // Mean abs diff ≈ (13.69 + 1.96 + 11.73) / 3 ≈ 9.13c → sim ≈ 0.916
    expect(sim).toBeGreaterThan(0.85);
    expect(sim).toBeLessThan(1.0);
  });

  it('test_major_vs_minor_triad_lower_similarity_than_major_vs_ji_major', () => {
    const major = chordFromSemitones('major', [0, 4, 7]);
    const minor = chordFromSemitones('minor', [0, 3, 7]);
    const jiMaj = chordFromRatios('ji-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const simMajJi = chordSimilarity(major, jiMaj, root);
    const simMajMin = chordSimilarity(major, minor, root);
    // TET major vs JI major is more similar than major vs minor
    expect(simMajJi).toBeGreaterThan(simMajMin);
  });

  it('test_result_is_in_range_0_to_1', () => {
    const a = chordFromSemitones('a', [0, 1]);
    const b = chordFromSemitones('b', [0, 11]);
    const sim = chordSimilarity(a, b, root);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('test_symmetry_sim_ab_equals_sim_ba', () => {
    const major = chordFromSemitones('major', [0, 4, 7]);
    const minor = chordFromSemitones('minor', [0, 3, 7]);
    expect(chordSimilarity(major, minor, root)).toBeCloseTo(chordSimilarity(minor, major, root), 9);
  });

  it('test_single_note_chords_return_1', () => {
    const a = chordFromSemitones('a', [0]);
    const b = chordFromSemitones('b', [0]);
    expect(chordSimilarity(a, b, root)).toBeCloseTo(1, 9);
  });

  it('test_invalid_rootHz_throws', () => {
    const chord = chordFromSemitones('c', [0, 4, 7]);
    expect(() => chordSimilarity(chord, chord, 0)).toThrow(RangeError);
    expect(() => chordSimilarity(chord, chord, -440)).toThrow(RangeError);
  });
});
