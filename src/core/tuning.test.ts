import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  equalTemperament12,
  edo,
  degreeToCents,
  degreeToFreq,
  tuningIntervalMatrix,
  tuningToIntervalVector,
  tuningDistance,
  tuningDeviationReport,
  approximateEdoForIntervals,
  nearestComma,
  type TuningSystem,
} from './tuning.js';
import { cents, fromRatio } from './cents.js';
import { ratio } from './ratio.js';
import { scaleToCents, type Scale } from './scale.js';
import { chordFromSemitones, chordToCents, realizeChordFreqs } from './chord.js';

describe('tuning period wrap', () => {
  const t = equalTemperament12(440);

  it('test_degree_zero_is_reference', () => {
    expect(degreeToFreq(t, 0)).toBeCloseTo(440, 9);
  });

  it('test_degree_12_is_one_octave_up', () => {
    expect(degreeToFreq(t, 12)).toBeCloseTo(880, 9);
  });

  it('property_degree_plus_count_adds_one_period', () => {
    fc.assert(
      fc.property(fc.integer({ min: -36, max: 36 }), (d) => {
        const step = degreeToCents(t, d + t.degrees.length) - degreeToCents(t, d);
        expect(step).toBeCloseTo(t.periodCents, 6);
      }),
    );
  });
});

describe('non-octave / stretched tuning (improvement #2)', () => {
  it('test_stretched_octave_period_respected', () => {
    const stretched: TuningSystem = {
      id: 'stretch',
      name: 'stretched-octave demo',
      referenceHz: 400,
      periodCents: 1210, // wider than 1200, like measured gamelan
      degrees: [cents(0), cents(240), cents(480), cents(720), cents(960)],
      source: 'measured',
      region: 'demo',
    };
    expect(degreeToCents(stretched, 5)).toBeCloseTo(1210, 9);
  });
});

describe('scale over tuning', () => {
  it('test_scale_major_steps_match_12tet', () => {
    const t = equalTemperament12(440);
    const major: Scale = {
      id: 'maj',
      name: 'major',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 5, 7, 9, 11],
    };
    expect(scaleToCents(major, t)).toEqual([0, 200, 400, 500, 700, 900, 1100]);
  });

  it('test_scale_tuning_mismatch_throws', () => {
    const wrong = equalTemperament12(440);
    const s: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0] };
    expect(() => scaleToCents(s, wrong)).toThrow(RangeError);
  });
});

describe('chord', () => {
  it('test_12tet_major_triad_cents', () => {
    expect(chordToCents(chordFromSemitones('maj', [0, 4, 7]))).toEqual([0, 400, 700]);
  });

  it('test_just_major_third_is_386_cents', () => {
    const justThird = chordToCents({ name: 'm3', intervals: [cents(0), fromRatio(ratio(5, 4))] });
    const third = justThird[1] as number;
    expect(third).toBeCloseTo(386.31, 2);
  });

  it('test_realize_root_is_first_frequency', () => {
    const freqs = realizeChordFreqs(chordFromSemitones('maj', [0, 4, 7]), 261.63);
    const [root, , fifth] = freqs as [number, number, number];
    expect(root).toBeCloseTo(261.63, 6);
    expect(fifth / root).toBeCloseTo(2 ** (7 / 12), 6);
  });
});

describe('edo', () => {
  it('test_edo12_matches_equalTemperament12_degree_for_degree', () => {
    const et = equalTemperament12(440);
    const e = edo(12, 440);
    expect(e.degrees.length).toBe(et.degrees.length);
    expect(e.periodCents).toBeCloseTo(et.periodCents, 9);
    for (let i = 0; i < 12; i++) {
      expect(degreeToCents(e, i)).toBeCloseTo(degreeToCents(et, i), 9);
    }
  });

  it('test_edo19_has_19_degrees_with_correct_step', () => {
    const e = edo(19, 440);
    expect(e.degrees.length).toBe(19);
    const step = 1200 / 19;
    for (let i = 0; i < 19; i++) {
      expect(degreeToCents(e, i)).toBeCloseTo(step * i, 9);
    }
  });

  it('test_edo31_degree18_approx_696_774_cents', () => {
    const e = edo(31, 440);
    expect(degreeToCents(e, 18)).toBeCloseTo(696.774, 3);
  });

  it('test_edo0_throws_RangeError', () => {
    expect(() => edo(0)).toThrow(RangeError);
  });

  it('test_edo_non_integer_throws_RangeError', () => {
    expect(() => edo(2.5)).toThrow(RangeError);
  });

  it('property_edo_n_degrees_up_one_period_equals_880hz', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 72 }), (n) => {
        const e = edo(n, 440);
        expect(degreeToFreq(e, n)).toBeCloseTo(880, 6);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Q82 — tuningIntervalMatrix
// ---------------------------------------------------------------------------

describe('tuningIntervalMatrix (Q82)', () => {
  const t12 = equalTemperament12(440);

  it('test_matrix_is_n_by_n', () => {
    const m = tuningIntervalMatrix(t12);
    expect(m.length).toBe(12);
    expect(m.every((row) => row.length === 12)).toBe(true);
  });

  it('test_diagonal_is_zero', () => {
    const m = tuningIntervalMatrix(t12);
    for (let i = 0; i < 12; i++) {
      expect(m[i]![i]).toBeCloseTo(0, 9);
    }
  });

  it('test_perfect_fifth_degree_0_to_7_is_700_cents', () => {
    const m = tuningIntervalMatrix(t12);
    // degree 7 - degree 0 = 700 cents in 12-TET
    expect(m[0]![7]).toBeCloseTo(700, 9);
  });

  it('test_antisymmetry_mij_equals_neg_mji', () => {
    const m = tuningIntervalMatrix(t12);
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        expect(m[i]![j]).toBeCloseTo(-(m[j]![i] as number), 9);
      }
    }
  });

  it('test_19edo_matrix_step_size_correct', () => {
    const t19 = edo(19, 440);
    const m = tuningIntervalMatrix(t19);
    // Each step in 19-EDO is 1200/19 cents
    const step = 1200 / 19;
    expect(m[0]![1]).toBeCloseTo(step, 9);
  });

  it('test_matrix_rows_are_shifting_offsets', () => {
    // m[i][j] = degreeToCents(t, j) - degreeToCents(t, i)
    const t = equalTemperament12(440);
    const m = tuningIntervalMatrix(t);
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        const expected = degreeToCents(t, j) - degreeToCents(t, i);
        expect(m[i]![j]).toBeCloseTo(expected, 9);
      }
    }
  });

  it('test_non_octave_tuning_matrix_uses_period_correctly', () => {
    // 5-EDO stretched to 1210-cent period
    const t5 = edo(5, 440, 1210);
    const m = tuningIntervalMatrix(t5);
    expect(m.length).toBe(5);
    // Step from degree 0 to degree 1 = 1210/5 = 242 cents
    expect(m[0]![1]).toBeCloseTo(242, 9);
  });
});

// ---------------------------------------------------------------------------
// Q86 — tuningToIntervalVector
// ---------------------------------------------------------------------------

describe('tuningToIntervalVector (Q86)', () => {
  const t12 = equalTemperament12(440);

  it('test_returns_a_map', () => {
    const hist = tuningToIntervalVector(t12);
    expect(hist instanceof Map).toBe(true);
  });

  it('test_total_pairs_equals_n_choose_2', () => {
    // 12-TET: C(12,2) = 66 total pairs
    const hist = tuningToIntervalVector(t12);
    let total = 0;
    hist.forEach((count) => (total += count));
    expect(total).toBe((12 * 11) / 2);
  });

  it('test_12tet_perfect_fifth_700c_count', () => {
    // Upper-triangle only: pairs (i,j) with i<j where (j-i)*100 = 700c → j-i=7
    // i can be 0..4 (so j = i+7 ≤ 11): exactly 5 pairs.
    const hist = tuningToIntervalVector(t12);
    expect(hist.get(700)).toBe(5);
  });

  it('test_12tet_tritone_600c_count', () => {
    // Pairs (i,j) with i<j where (j-i)*100 = 600c → j-i=6
    // i can be 0..5 (so j = i+6 ≤ 11): exactly 6 pairs.
    const hist = tuningToIntervalVector(t12);
    expect(hist.get(600)).toBe(6);
  });

  it('test_single_degree_tuning_has_empty_histogram', () => {
    // A tuning with 1 degree has no pairs: C(1,2) = 0
    const t1: TuningSystem = {
      id: 'mono',
      name: 'mono',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [{ kind: 'cents', cents: 0 }],
      source: 'theoretical',
    };
    const hist = tuningToIntervalVector(t1);
    expect(hist.size).toBe(0);
  });

  it('test_step_cents_controls_bin_width', () => {
    // With stepCents=100, 700c is a distinct bin (5 pairs where j-i=7).
    // With stepCents=200, 700c rounds to 600 or 800 (nearest multiple of 200).
    const hist100 = tuningToIntervalVector(t12, 100);
    const hist200 = tuningToIntervalVector(t12, 200);
    expect(hist100.get(700)).toBe(5);
    // With stepCents=200, 700c → round(700/200)*200 = 800; not a separate 700 bin.
    expect(hist200.get(700)).toBeUndefined();
  });

  it('test_invalid_step_cents_throws', () => {
    expect(() => tuningToIntervalVector(t12, 0)).toThrow(RangeError);
    expect(() => tuningToIntervalVector(t12, -50)).toThrow(RangeError);
  });

  it('test_5edo_has_correct_interval_count', () => {
    // 5-EDO: step = 240c. Intervals: 240c (4 pairs), 480c (3 pairs), 720c (2 pairs), 960c (1 pair)
    // C(5,2) = 10 total pairs; binned at 50c resolution.
    const t5 = edo(5, 440);
    const hist = tuningToIntervalVector(t5);
    let total = 0;
    hist.forEach((count) => (total += count));
    expect(total).toBe((5 * 4) / 2);
    expect(hist.get(250)).toBe(4); // 240c rounds to 250c at stepCents=50
  });
});

// ---------------------------------------------------------------------------
// Q88 — tuningDistance
// ---------------------------------------------------------------------------

describe('tuningDistance (Q88)', () => {
  const t12 = equalTemperament12(440);

  it('test_same_tuning_distance_is_zero', () => {
    expect(tuningDistance(t12, t12)).toBeCloseTo(0, 9);
  });

  it('test_same_structure_different_referenceHz_distance_is_zero', () => {
    // referenceHz is irrelevant — only cent positions matter
    const t12b = equalTemperament12(880);
    expect(tuningDistance(t12, t12b)).toBeCloseTo(0, 9);
  });

  it('test_12tet_vs_24edo_is_nonzero', () => {
    // 24-EDO has 50c steps; halfway between 12-TET degrees
    const t24 = edo(24, 440);
    const d = tuningDistance(t12, t24);
    expect(d).toBeGreaterThan(0);
  });

  it('test_symmetry_distance_ab_equals_distance_ba', () => {
    const t19 = edo(19, 440);
    expect(tuningDistance(t12, t19)).toBeCloseTo(tuningDistance(t19, t12), 9);
  });

  it('test_12tet_vs_19edo_smaller_than_12tet_vs_7edo', () => {
    // 19-EDO approximates 12-TET intervals more closely than 7-EDO
    const t19 = edo(19, 440);
    const t7 = edo(7, 440);
    expect(tuningDistance(t12, t19)).toBeLessThan(tuningDistance(t12, t7));
  });

  it('test_distance_is_non_negative', () => {
    const t31 = edo(31, 440);
    expect(tuningDistance(t12, t31)).toBeGreaterThanOrEqual(0);
  });

  it('test_result_is_in_cents_units', () => {
    // 24-EDO has degrees at 0, 50, 100, ... Each 12-TET degree is 100c-spaced.
    // a→b direction: every 12-TET degree lands exactly on a 24-EDO degree → 12 * 0 = 0.
    // b→a direction: the 12 "extra" 24-EDO degrees (50, 150, ...) are each 50c from
    //   the nearest 12-TET degree → 12 * 50 = 600.
    // Total sum = 600, count = 12 + 24 = 36, average = 600 / 36 ≈ 16.667c.
    const t24 = edo(24, 440);
    expect(tuningDistance(t12, t24)).toBeCloseTo(600 / 36, 6);
  });
});

// ---------------------------------------------------------------------------
// I2 — tuningDeviationReport
// ---------------------------------------------------------------------------

describe('tuningDeviationReport (I2)', () => {
  const t12 = equalTemperament12(440);

  it('test_12tet_vs_12tet_all_delta_zero', () => {
    const report = tuningDeviationReport(t12, equalTemperament12(440));
    expect(report.length).toBe(12);
    for (const entry of report) {
      expect(entry.deltaCents).toBeCloseTo(0, 9);
    }
  });

  it('test_ji_vs_12tet_major_third_delta_approx_minus_13_7', () => {
    // JI major third = 5:4 ≈ 386.31¢; 12-TET major third (degree 4) = 400¢.
    // deltaCents = candCents(12-TET) - refCents(JI) = 400 - 386.31 ≈ +13.69¢
    // BUT: comparing reference=12-TET, candidate=JI → delta = JI - 12-TET ≈ -13.69¢
    const ji: TuningSystem = {
      id: 'ji',
      name: '5-limit JI',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [
        cents(0),
        fromRatio(ratio(16, 15)), // minor second ~111.73¢
        fromRatio(ratio(9, 8)), // major second ~203.91¢
        fromRatio(ratio(6, 5)), // minor third ~315.64¢
        fromRatio(ratio(5, 4)), // major third ~386.31¢
        fromRatio(ratio(4, 3)), // perfect fourth ~498.04¢
        fromRatio(ratio(45, 32)), // tritone ~590.22¢
        fromRatio(ratio(3, 2)), // perfect fifth ~701.96¢
        fromRatio(ratio(8, 5)), // minor sixth ~813.69¢
        fromRatio(ratio(5, 3)), // major sixth ~884.36¢
        fromRatio(ratio(9, 5)), // minor seventh ~1017.60¢
        fromRatio(ratio(15, 8)), // major seventh ~1088.27¢
      ],
      source: 'theoretical',
    };
    // reference = 12-TET, candidate = JI
    const report = tuningDeviationReport(t12, ji);
    // degree 4 (major third): ref=400¢, cand≈386.31¢, delta≈-13.69¢
    const deg4 = report[4]!;
    expect(deg4.deltaCents).toBeCloseTo(-13.69, 0);
  });

  it('test_different_degree_counts_returns_min_length', () => {
    const t7 = edo(7, 440);
    const report = tuningDeviationReport(t12, t7);
    expect(report.length).toBe(7);
  });

  it('test_result_is_in_degreeIndex_order', () => {
    const report = tuningDeviationReport(t12, t12);
    for (let i = 0; i < report.length; i++) {
      expect(report[i]!.degreeIndex).toBe(i);
    }
  });

  it('test_throws_on_empty_reference', () => {
    const empty: TuningSystem = {
      id: 'empty',
      name: 'empty',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical',
    };
    // defineTuning would throw on empty, so build a mock directly
    // Instead test via a known-empty-like scenario: since defineTuning prevents
    // construction, we cast to bypass validation for this error-path test.
    const emptyUnsafe = { ...empty } as TuningSystem;
    expect(() => tuningDeviationReport(emptyUnsafe, t12)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// I4 — approximateEdoForIntervals
// ---------------------------------------------------------------------------

describe('approximateEdoForIntervals (I4)', () => {
  it('test_JI_intervals_best_fit_in_cluster_19_31_53', () => {
    // JI major 3rd, P4, P5: well-approximated by 19, 31, or 53 EDO
    const targets = [386.31, 498.04, 701.96];
    const results = approximateEdoForIntervals(targets, 5, 53);
    // Best fit should be one of the known good EDOs
    const best = results[0]!.n;
    expect([19, 31, 53]).toContain(best);
  });

  it('test_perInterval_length_matches_targetCents_length', () => {
    const targets = [386.31, 498.04, 701.96];
    const results = approximateEdoForIntervals(targets, 5, 20);
    for (const entry of results) {
      expect(entry.perInterval.length).toBe(targets.length);
    }
  });

  it('test_results_sorted_by_rmsCents_ascending', () => {
    const targets = [386.31, 701.96];
    const results = approximateEdoForIntervals(targets, 5, 53);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.rmsCents).toBeLessThanOrEqual(results[i]!.rmsCents);
    }
  });

  it('test_throws_on_empty_targetCents', () => {
    expect(() => approximateEdoForIntervals([])).toThrow(RangeError);
  });

  it('test_throws_on_minN_less_than_2', () => {
    expect(() => approximateEdoForIntervals([700], 1, 53)).toThrow(RangeError);
  });

  it('test_target_zero_gives_rmsCents_zero_for_all_n', () => {
    // 0 cents → nearest step in any EDO is 0 → delta = 0 for all N
    const results = approximateEdoForIntervals([0], 5, 53);
    for (const entry of results) {
      expect(entry.rmsCents).toBeCloseTo(0, 9);
    }
  });
});

// ---------------------------------------------------------------------------
// L2 — nearestComma
// ---------------------------------------------------------------------------

describe('nearestComma (L2)', () => {
  it('test_syntonic_comma_exact', () => {
    const c = nearestComma(21.5063);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('syntonic comma');
    expect(c!.ratio).toEqual([81, 80]);
  });

  it('test_pythagorean_comma_exact', () => {
    const c = nearestComma(23.46);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('Pythagorean comma');
  });

  it('test_schisma_exact', () => {
    const c = nearestComma(1.9537);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('schisma');
    expect(c!.ratio).toEqual([32805, 32768]);
  });

  it('test_diaschisma_exact', () => {
    const c = nearestComma(19.5529);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('diaschisma');
  });

  it('test_septimal_comma_exact', () => {
    const c = nearestComma(27.2641);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('septimal comma');
  });

  it('test_diesis_exact', () => {
    const c = nearestComma(41.059);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('diesis');
    expect(c!.ratio).toEqual([128, 125]);
  });

  it('test_undecimal_comma_exact', () => {
    const c = nearestComma(53.2729);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('undecimal comma');
  });

  it('test_returns_null_when_no_comma_within_5_cents', () => {
    expect(nearestComma(100)).toBeNull();
    expect(nearestComma(600)).toBeNull();
    // 0c is 1.95c from schisma, so it IS within 5c — not null
    expect(nearestComma(200)).toBeNull();
  });

  it('test_within_tolerance_boundary', () => {
    // 21.5063 + 4.9 = 26.4063 — still within 5c of syntonic (21.5063)
    // but closer to septimal comma (27.2641)? dist = 0.858, syntonic dist = 4.9
    // nearest is septimal? No: 26.4063 - 21.5063 = 4.9 (syntonic); 27.2641 - 26.4063 = 0.858 (septimal)
    // So nearestComma(26.4063) → septimal comma
    const c = nearestComma(26.4063);
    expect(c).not.toBeNull();
    expect(c!.name).toBe('septimal comma');
  });

  it('test_outside_5_cents_threshold_returns_null', () => {
    // 60c is 6.7c away from undecimal comma (53.27) — beyond 5c
    expect(nearestComma(60)).toBeNull();
  });

  it('property_result_within_5_cents_of_input_when_non_null', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 60, noNaN: true }), (c) => {
        const result = nearestComma(c);
        if (result !== null) {
          expect(Math.abs(c - result.cents)).toBeLessThanOrEqual(5);
        }
      }),
    );
  });
});
