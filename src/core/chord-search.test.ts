import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { equalTemperament12, edo } from './tuning.js';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import { chordDissonance } from './dissonance.js';
import { voiceLeadingCost } from './voice-leading.js';
import {
  rankChords,
  realizeRankedChordFreqs,
  progressionSmoothness,
  rankedChordToChord,
  chordProgressionSmoothness,
} from './chord-search.js';
import { chordToCents, realizeChordFreqs } from './chord.js';

describe('rankChords — 12-TET size-3 harmonic spectrum', () => {
  const tuning = equalTemperament12(440);
  const spectrum = harmonicSpectrum();

  it('major_triad_0_4_7_ranks_better_than_chromatic_cluster_0_1_2', () => {
    // Full candidate count for 12-TET size-3: C(11, 2) = 55
    const results = rankChords(tuning, { size: 3, spectrum, limit: 55 });
    expect(results.length).toBe(55);

    const majorIdx = results.findIndex(
      (r) => r.degrees[0] === 0 && r.degrees[1] === 4 && r.degrees[2] === 7,
    );
    const clusterIdx = results.findIndex(
      (r) => r.degrees[0] === 0 && r.degrees[1] === 1 && r.degrees[2] === 2,
    );

    expect(majorIdx).toBeGreaterThanOrEqual(0); // must appear
    expect(clusterIdx).toBeGreaterThanOrEqual(0);

    // Major triad should be strictly better (lower score = lower index in sorted results)
    expect(majorIdx).toBeLessThan(clusterIdx);

    // [0,4,7] should be in the top 20% (top 11 of 55)
    expect(majorIdx).toBeLessThan(Math.ceil(55 * 0.2));

    // [0,1,2] should be in the bottom 10% (bottom 6 of 55, i.e. index >= 49)
    expect(clusterIdx).toBeGreaterThanOrEqual(Math.floor(55 * 0.9));
  });

  it('results_sorted_ascending_by_score', () => {
    const results = rankChords(tuning, { size: 3, spectrum, limit: 55 });
    for (let i = 1; i < results.length; i++) {
      expect((results[i] as (typeof results)[0]).score).toBeGreaterThanOrEqual(
        (results[i - 1] as (typeof results)[0]).score,
      );
    }
  });

  it('all_degrees_start_with_0', () => {
    const results = rankChords(tuning, { size: 3, spectrum, limit: 55 });
    for (const r of results) {
      expect(r.degrees[0]).toBe(0);
    }
  });

  it('cents_are_ascending', () => {
    const results = rankChords(tuning, { size: 3, spectrum, limit: 55 });
    for (const r of results) {
      for (let i = 1; i < r.cents.length; i++) {
        expect(r.cents[i] as number).toBeGreaterThan(r.cents[i - 1] as number);
      }
    }
  });

  it('limit_respected', () => {
    const results = rankChords(tuning, { size: 3, spectrum, limit: 5 });
    expect(results.length).toBe(5);
  });

  it('default_limit_is_10', () => {
    const results = rankChords(tuning, { size: 3, spectrum });
    expect(results.length).toBe(10);
  });
});

describe('rankChords — 5-edo size-2', () => {
  it('returns_C_4_1_equals_4_candidates_all_containing_degree_0', () => {
    const tuning = edo(5);
    const results = rankChords(tuning, { size: 2, limit: 100 });
    // C(4,1) = 4
    expect(results.length).toBe(4);
    for (const r of results) {
      expect(r.degrees[0]).toBe(0);
      expect(r.degrees.length).toBe(2);
    }
    // All 4 non-root degrees present
    const secondDegrees = results.map((r) => r.degrees[1] as number).sort((a, b) => a - b);
    expect(secondDegrees).toEqual([1, 2, 3, 4]);
  });
});

describe('rankChords — validation errors', () => {
  const tuning = equalTemperament12(440);

  it('throws_RangeError_for_size_1', () => {
    expect(() => rankChords(tuning, { size: 1 })).toThrow(RangeError);
  });

  it('throws_RangeError_for_size_exceeding_degree_count', () => {
    expect(() => rankChords(tuning, { size: 13 })).toThrow(RangeError);
  });

  it('throws_RangeError_for_periodicityWeight_below_0', () => {
    expect(() => rankChords(tuning, { periodicityWeight: -0.1 })).toThrow(RangeError);
  });

  it('throws_RangeError_for_periodicityWeight_above_1', () => {
    expect(() => rankChords(tuning, { periodicityWeight: 1.1 })).toThrow(RangeError);
  });

  it('throws_RangeError_combinatorial_blowup_53_edo_size_5', () => {
    // C(52, 4) = 270725 > 20000
    const largeTuning = edo(53);
    expect(() => rankChords(largeTuning, { size: 5 })).toThrow(RangeError);
  });

  it('throws_RangeError_for_limit_less_than_1', () => {
    expect(() => rankChords(tuning, { limit: 0 })).toThrow(RangeError);
  });
});

describe('rankChords — fast-check property: roughness >= 0 and scores non-decreasing', () => {
  it('property_for_edo_n_and_varying_sizes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 12 }), fc.context(), (n, ctx) => {
        const tuning = edo(n);
        const maxSize = Math.min(4, n);
        // pick a valid size in [2, maxSize]
        const size = 2 + ((n - 2) % (maxSize - 2 + 1));
        const validSize = Math.max(2, Math.min(size, n));

        ctx.log(`n=${n}, size=${validSize}`);

        const results = rankChords(tuning, { size: validSize, limit: 100 });

        for (const r of results) {
          expect(r.roughness).toBeGreaterThanOrEqual(0);
        }

        for (let i = 1; i < results.length; i++) {
          expect((results[i] as (typeof results)[0]).score).toBeGreaterThanOrEqual(
            (results[i - 1] as (typeof results)[0]).score,
          );
        }
      }),
    );
  });
});

describe('rankChords — determinism', () => {
  it('two_calls_produce_deeply_equal_results', () => {
    const tuning = equalTemperament12(440);
    const spectrum = harmonicSpectrum();
    const opts = { size: 3, spectrum, limit: 10 };
    const r1 = rankChords(tuning, opts);
    const r2 = rankChords(tuning, opts);
    expect(r1).toEqual(r2);
  });
});

// Socratic Q15 (round 3 regression): when relativePeriodicity overflows MAX_SAFE_INTEGER and
// returns Infinity, rankChords must still produce finite, non-NaN scores.
describe('rankChords — finite scores (Socratic Q15 regression)', () => {
  it('all_scores_finite_for_12_tet_size_3', () => {
    const results = rankChords(equalTemperament12(440), { size: 3, limit: 55 });
    for (const r of results) {
      expect(Number.isFinite(r.score)).toBe(true);
      expect(Number.isNaN(r.score)).toBe(false);
    }
  });

  it('property_all_scores_finite_for_edo_n_3_to_12', () => {
    for (let n = 3; n <= 12; n++) {
      const maxSize = Math.min(4, n);
      for (let size = 2; size <= maxSize; size++) {
        const results = rankChords(edo(n), { size, limit: 100 });
        for (const r of results) {
          expect(Number.isFinite(r.score)).toBe(true);
        }
      }
    }
  });
});

// Socratic Q1: the score blends a timbre-DEPENDENT axis (roughness) with a
// timbre-INDEPENDENT one (periodicity). These tests make that split observable.
describe('rankChords — timbre dependence of the two score axes', () => {
  const tuning = equalTemperament12(440);

  it('roughness_axis_is_timbre_dependent_changing_spectrum_changes_ranking', () => {
    // periodicityWeight: 0 → score is pure roughness, which honours the spectrum.
    const harmonic = rankChords(tuning, {
      size: 3,
      periodicityWeight: 0,
      spectrum: harmonicSpectrum(),
      limit: 55,
    });
    const bell = rankChords(tuning, {
      size: 3,
      periodicityWeight: 0,
      spectrum: bellSpectrum(),
      limit: 55,
    });
    // Same candidate set, but the smoothest-chord ordering differs by timbre.
    const harmonicTop = harmonic.map((c) => c.degrees.join('-'));
    const bellTop = bell.map((c) => c.degrees.join('-'));
    expect(harmonicTop).not.toEqual(bellTop);
  });

  it('periodicity_axis_is_timbre_independent_spectrum_is_ignored', () => {
    // periodicityWeight: 1 → score is pure periodicity, which ignores the spectrum.
    const harmonic = rankChords(tuning, {
      size: 3,
      periodicityWeight: 1,
      spectrum: harmonicSpectrum(),
      limit: 55,
    });
    const bell = rankChords(tuning, {
      size: 3,
      periodicityWeight: 1,
      spectrum: bellSpectrum(),
      limit: 55,
    });
    // Identical ranking and identical periodicity values regardless of timbre.
    expect(harmonic.map((c) => c.degrees.join('-'))).toEqual(bell.map((c) => c.degrees.join('-')));
    expect(harmonic.map((c) => c.periodicity)).toEqual(bell.map((c) => c.periodicity));
  });
});

// Socratic Q33: realizeRankedChordFreqs bridges the ranking layer to the frequency world.
describe('realizeRankedChordFreqs — bridge from RankedChord to Hz', () => {
  const tuning = equalTemperament12(440);
  const spectrum = harmonicSpectrum();

  it('test_root_note_equals_rootHz', () => {
    const chord = rankChords(tuning, { size: 3, spectrum, limit: 1 })[0]!;
    const freqs = realizeRankedChordFreqs(chord, 261.63);
    // cents[0] is always 0 (root), so rootHz * 2^(0/1200) = rootHz
    expect(freqs[0]).toBeCloseTo(261.63, 9);
  });

  it('test_400c_interval_correct_ratio', () => {
    // Find major triad [0, 4, 7] in 12-TET (cents [0, 400, 700])
    const all = rankChords(tuning, { size: 3, spectrum, limit: 55 });
    const major = all.find((r) => r.degrees[1] === 4 && r.degrees[2] === 7)!;
    const freqs = realizeRankedChordFreqs(major, 261.63);
    expect(freqs[1]).toBeCloseTo(261.63 * 2 ** (400 / 1200), 6);
    expect(freqs[2]).toBeCloseTo(261.63 * 2 ** (700 / 1200), 6);
  });

  it('test_non_unity_rootHz_scales_all_voices', () => {
    const chord = rankChords(tuning, { size: 3, spectrum, limit: 1 })[0]!;
    const freqs261 = realizeRankedChordFreqs(chord, 261.63);
    const freqs440 = realizeRankedChordFreqs(chord, 440);
    // All frequency ratios between voices are preserved regardless of rootHz
    for (let i = 1; i < freqs261.length; i++) {
      expect((freqs440[i] as number) / (freqs440[0] as number)).toBeCloseTo(
        (freqs261[i] as number) / (freqs261[0] as number),
        9,
      );
    }
  });

  it('test_roughness_matches_chordDissonance_at_same_root', () => {
    // realizeRankedChordFreqs should reproduce the internal roughness computation
    const all = rankChords(tuning, { size: 3, spectrum, rootHz: 440, limit: 55 });
    for (const chord of all.slice(0, 5)) {
      const freqs = realizeRankedChordFreqs(chord, 440);
      const roughness = chordDissonance(freqs, spectrum);
      expect(roughness).toBeCloseTo(chord.roughness, 6);
    }
  });

  it('test_integration_rankChords_realizeRankedChordFreqs_voiceLeadingCost', () => {
    // Full pipeline: ranking → realize → voice-leading cost.
    // The smoothest-ranked chord should NOT necessarily have the lowest voice-leading
    // cost to the next chord — but the pipeline must work end-to-end without errors.
    const chords = rankChords(tuning, { size: 3, spectrum, limit: 5 });
    expect(chords.length).toBeGreaterThanOrEqual(2);
    const freqsA = realizeRankedChordFreqs(chords[0]!, 261.63);
    const freqsB = realizeRankedChordFreqs(chords[1]!, 261.63);
    const cost = voiceLeadingCost(freqsA, freqsB);
    expect(Number.isFinite(cost)).toBe(true);
    expect(cost).toBeGreaterThanOrEqual(0);
  });

  it('property_all_freqs_positive_for_any_ranked_chord', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 12 }),
        fc.double({ min: 110, max: 880, noNaN: true, noDefaultInfinity: true }),
        (n, root) => {
          const t = edo(n);
          const chord = rankChords(t, { size: 2, limit: 1 })[0]!;
          const freqs = realizeRankedChordFreqs(chord, root);
          for (const f of freqs) {
            expect(f).toBeGreaterThan(0);
            expect(Number.isFinite(f)).toBe(true);
          }
        },
      ),
    );
  });
});

// Socratic Q35: progressionSmoothness aggregates pairwise voice-leading across a chord sequence.
describe('progressionSmoothness — total voice-leading cost across a chord progression', () => {
  const tuning = equalTemperament12(440);
  const spectrum = harmonicSpectrum();

  it('test_empty_sequence_returns_zero', () => {
    expect(progressionSmoothness([], 261.63)).toBe(0);
  });

  it('test_single_chord_returns_zero', () => {
    const chord = rankChords(tuning, { size: 3, spectrum, limit: 1 })[0]!;
    expect(progressionSmoothness([chord], 261.63)).toBe(0);
  });

  it('test_two_chords_equals_pairwise_voiceLeadingCost', () => {
    const chords = rankChords(tuning, { size: 3, spectrum, limit: 2 });
    const expected = voiceLeadingCost(
      realizeRankedChordFreqs(chords[0]!, 261.63),
      realizeRankedChordFreqs(chords[1]!, 261.63),
    );
    expect(progressionSmoothness(chords, 261.63)).toBeCloseTo(expected, 9);
  });

  it('test_three_chords_is_sum_of_two_adjacent_costs', () => {
    const chords = rankChords(tuning, { size: 3, spectrum, limit: 3 });
    const ab = voiceLeadingCost(
      realizeRankedChordFreqs(chords[0]!, 440),
      realizeRankedChordFreqs(chords[1]!, 440),
    );
    const bc = voiceLeadingCost(
      realizeRankedChordFreqs(chords[1]!, 440),
      realizeRankedChordFreqs(chords[2]!, 440),
    );
    expect(progressionSmoothness(chords, 440)).toBeCloseTo(ab + bc, 9);
  });

  it('test_result_is_non_negative', () => {
    const chords = rankChords(tuning, { size: 3, spectrum, limit: 5 });
    expect(progressionSmoothness(chords, 261.63)).toBeGreaterThanOrEqual(0);
  });

  it('test_inserting_distant_chord_increases_cost', () => {
    // Top two consonant chords (close together) vs a progression through a dissonant middle chord.
    const all = rankChords(tuning, { size: 3, spectrum, limit: 55 });
    const smooth = [all[0]!, all[1]!]; // top two: close neighbours
    const rough = [all[0]!, all[54]!, all[1]!]; // worst chord in the middle
    expect(progressionSmoothness(rough, 261.63)).toBeGreaterThan(
      progressionSmoothness(smooth, 261.63),
    );
  });

  it('test_mismatched_chord_sizes_throw', () => {
    const triads = rankChords(tuning, { size: 3, spectrum, limit: 1 });
    const dyads = rankChords(tuning, { size: 2, spectrum, limit: 1 });
    expect(() => progressionSmoothness([triads[0]!, dyads[0]!], 261.63)).toThrow(RangeError);
  });
});

// Socratic Q40: rankedChordToChord closes the discovery→portable-Chord round-trip.
describe('rankedChordToChord — RankedChord → portable Chord', () => {
  const t12 = equalTemperament12(440);
  const spectrum = harmonicSpectrum();

  it('test_cents_are_root_relative_starting_at_zero', () => {
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!);
    expect(chordToCents(chord)[0]).toBe(0);
  });

  it('test_chord_cents_match_ranked_cents', () => {
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!);
    expect(chordToCents(chord)).toEqual([...top!.cents]);
  });

  it('test_realize_freqs_matches_realizeRankedChordFreqs', () => {
    const rootHz = 261.63;
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!);
    const fromChord = realizeChordFreqs(chord, rootHz);
    const fromRanked = realizeRankedChordFreqs(top!, rootHz);
    fromChord.forEach((f, i) => expect(f).toBeCloseTo(fromRanked[i] as number, 9));
  });

  it('test_name_auto_generated_from_degrees', () => {
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!);
    expect(chord.name).toBe(`chord-${top!.degrees.join('-')}`);
  });

  it('test_explicit_name_overrides_auto', () => {
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!, 'my-major');
    expect(chord.name).toBe('my-major');
  });

  it('test_interval_count_matches_ranked_size', () => {
    const [top] = rankChords(t12, { size: 4, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!);
    expect(chord.intervals.length).toBe(4);
  });

  it('test_round_trip_dissonance_invariant', () => {
    // Re-scoring the Chord at the same root as rankChords used (referenceHz=440)
    // must reproduce the original roughness exactly.
    const rootHz = 440; // matches t12.referenceHz so rankChords computed at this root
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!);
    const freqs = realizeChordFreqs(chord, rootHz);
    const roughness = chordDissonance(freqs, spectrum);
    expect(roughness).toBeCloseTo(top!.roughness, 6);
  });
});

// Q49: ポータブル Chord[] から進行スムーズネスを直接測れるか？
describe('chordProgressionSmoothness — portable Chord[] progression (Q49)', () => {
  const t12 = equalTemperament12(440);
  const spectrum = harmonicSpectrum();
  const rootHz = 261.63;

  it('test_portable_progression_matches_ranked_progression', () => {
    // rankedChordToChord lifts RankedChord → Chord;
    // chordProgressionSmoothness must match progressionSmoothness on the same data.
    const ranked = rankChords(t12, { size: 3, spectrum, limit: 4 });
    const portable = ranked.map((r) => rankedChordToChord(r));
    const fromRanked = progressionSmoothness(ranked, rootHz);
    const fromPortable = chordProgressionSmoothness(portable, rootHz);
    expect(fromPortable).toBeCloseTo(fromRanked, 6);
  });

  it('test_single_chord_returns_zero', () => {
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    expect(chordProgressionSmoothness([rankedChordToChord(top!)], rootHz)).toBe(0);
  });

  it('test_empty_returns_zero', () => {
    expect(chordProgressionSmoothness([], rootHz)).toBe(0);
  });

  it('test_identical_chord_twice_is_zero_cost', () => {
    const [top] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const chord = rankedChordToChord(top!);
    // Same chord → no voice motion → cost = 0.
    expect(chordProgressionSmoothness([chord, chord], rootHz)).toBeCloseTo(0, 9);
  });

  it('test_result_is_non_negative', () => {
    const ranked = rankChords(t12, { size: 3, spectrum, limit: 4 });
    const portable = ranked.map((r) => rankedChordToChord(r));
    expect(chordProgressionSmoothness(portable, rootHz)).toBeGreaterThanOrEqual(0);
  });

  it('test_mismatched_size_throws', () => {
    const [triad] = rankChords(t12, { size: 3, spectrum, limit: 1 });
    const [tetrad] = rankChords(t12, { size: 4, spectrum, limit: 1 });
    expect(() =>
      chordProgressionSmoothness([rankedChordToChord(triad!), rankedChordToChord(tetrad!)], rootHz),
    ).toThrow(RangeError);
  });
});
