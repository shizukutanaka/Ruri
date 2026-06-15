import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import {
  dissonancePair,
  chordDissonance,
  chordObjectDissonance,
  dissonanceCurve,
  localMinima,
  consonantIntervals,
  spectrumToTuning,
  tuningSuitability,
  rankTuningsByFit,
} from './dissonance.js';
import { edo } from './tuning.js';
import { chordFromSemitones, chordFromRatios, realizeChordFreqs } from './chord.js';

const partial = fc.record({
  freq: fc.double({ min: 50, max: 8000, noNaN: true, noDefaultInfinity: true }),
  amp: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
});

describe('dissonance pair (I7 high-risk)', () => {
  it('property_dissonance_non_negative', () => {
    fc.assert(
      fc.property(partial, partial, (a, b) => {
        expect(dissonancePair(a, b)).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it('property_dissonance_symmetric', () => {
    fc.assert(
      fc.property(partial, partial, (a, b) => {
        expect(dissonancePair(a, b)).toBeCloseTo(dissonancePair(b, a), 9);
      }),
    );
  });

  it('test_identical_partials_zero', () => {
    expect(dissonancePair({ freq: 440, amp: 1 }, { freq: 440, amp: 1 })).toBeCloseTo(0, 9);
  });
});

describe('chord dissonance', () => {
  it('property_chord_dissonance_non_negative', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 100, max: 2000, noNaN: true, noDefaultInfinity: true }), {
          minLength: 1,
          maxLength: 5,
        }),
        (freqs) => {
          expect(chordDissonance(freqs, harmonicSpectrum())).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });
});

describe('known minima — harmonic timbre (Sethares oracle)', () => {
  const N = 1001;
  const ratios = Array.from({ length: N }, (_, i) => 1 + i / (N - 1)); // 1.0 .. 2.0
  const curve = dissonanceCurve(harmonicSpectrum(6), 261.63, ratios);
  const minimaRatios = localMinima(curve).map((i) => ratios[i] as number);
  const hasNear = (target: number, tol = 0.02): boolean =>
    minimaRatios.some((r) => Math.abs(r - target) < tol);

  it('test_minimum_near_perfect_fifth_3_2', () => {
    expect(hasNear(1.5)).toBe(true);
  });

  it('test_minimum_near_perfect_fourth_4_3', () => {
    expect(hasNear(4 / 3)).toBe(true);
  });

  it('test_fifth_less_dissonant_than_tritone', () => {
    const spec = harmonicSpectrum(6);
    const fifth = chordDissonance([261.63, 261.63 * 1.5], spec);
    const tritone = chordDissonance([261.63, 261.63 * Math.SQRT2], spec);
    expect(fifth).toBeLessThan(tritone);
  });
});

describe('timbre-dependent consonance (Sethares)', () => {
  it('test_bell_minima_differ_from_harmonic', () => {
    const N = 501;
    const ratios = Array.from({ length: N }, (_, i) => 1 + i / (N - 1));
    const harm = localMinima(dissonanceCurve(harmonicSpectrum(6), 440, ratios));
    const bell = localMinima(dissonanceCurve(bellSpectrum(), 440, ratios));
    expect(bell).not.toEqual(harm);
  });
});

// The library's central thesis as a one-liner: consonance is a property of the
// TIMBRE's spectrum, not of Western interval names.
describe('consonantIntervals — timbre-dependent consonance helper', () => {
  it('test_harmonic_spectrum_finds_just_fifth_and_fourth', () => {
    const cons = consonantIntervals(harmonicSpectrum(6));
    const hasNear = (target: number, tol = 0.01): boolean =>
      cons.some((c) => Math.abs(c.ratio - target) < tol);
    expect(hasNear(1.5)).toBe(true); // perfect fifth 3/2
    expect(hasNear(4 / 3)).toBe(true); // perfect fourth 4/3
  });

  it('test_cents_field_matches_ratio', () => {
    const cons = consonantIntervals(harmonicSpectrum(6));
    expect(cons.length).toBeGreaterThan(0);
    for (const c of cons) {
      expect(c.cents).toBeCloseTo(1200 * Math.log2(c.ratio), 9);
    }
  });

  it('test_results_ascending_by_ratio', () => {
    const cons = consonantIntervals(harmonicSpectrum(6));
    for (let i = 1; i < cons.length; i++) {
      expect(cons[i]!.ratio).toBeGreaterThan(cons[i - 1]!.ratio);
    }
  });

  it('test_bell_consonances_differ_from_harmonic', () => {
    // Same scan window, different timbre → different consonant set (the thesis).
    const harm = consonantIntervals(harmonicSpectrum(6), { steps: 501 });
    const bell = consonantIntervals(bellSpectrum(), { steps: 501 });
    expect(bell.map((c) => c.ratio)).not.toEqual(harm.map((c) => c.ratio));
  });

  it('test_dissonance_values_are_non_negative', () => {
    const cons = consonantIntervals(harmonicSpectrum(6));
    expect(cons.every((c) => c.dissonance >= 0)).toBe(true);
  });

  it('test_custom_scan_window_respected', () => {
    // Narrow window around the fifth; every returned ratio is inside the window.
    const cons = consonantIntervals(harmonicSpectrum(6), {
      minRatio: 1.4,
      maxRatio: 1.6,
      steps: 401,
    });
    expect(cons.every((c) => c.ratio >= 1.4 && c.ratio <= 1.6)).toBe(true);
    expect(cons.some((c) => Math.abs(c.ratio - 1.5) < 0.01)).toBe(true);
  });

  it('test_invalid_min_ratio_throws', () => {
    expect(() => consonantIntervals(harmonicSpectrum(6), { minRatio: 0 })).toThrow(RangeError);
  });

  it('test_max_ratio_not_above_min_throws', () => {
    expect(() => consonantIntervals(harmonicSpectrum(6), { minRatio: 2, maxRatio: 1.5 })).toThrow(
      RangeError,
    );
  });

  it('test_too_few_steps_throws', () => {
    expect(() => consonantIntervals(harmonicSpectrum(6), { steps: 2 })).toThrow(RangeError);
  });

  it('test_non_positive_fundamental_throws', () => {
    expect(() => consonantIntervals(harmonicSpectrum(6), { fundamentalHz: 0 })).toThrow(RangeError);
  });
});

describe('localMinima regression', () => {
  it('test_simple_minimum', () => {
    expect(localMinima([3, 1, 2])).toEqual([1]);
  });

  it('test_flat_plateau_minimum_reported_at_first_index', () => {
    expect(localMinima([3, 1, 1, 2])).toEqual([1]);
  });

  it('test_descending_plateau_to_end_is_not_minimum', () => {
    expect(localMinima([3, 1, 1, 0])).toEqual([]);
  });

  it('test_plateau_then_rise_in_middle', () => {
    expect(localMinima([3, 2, 2, 1, 0, 1])).toEqual([4]);
  });

  it('test_plateau_touching_end_is_not_minimum', () => {
    expect(localMinima([3, 1, 1])).toEqual([]);
  });

  it('property_reported_indices_strictly_below_nearest_differing_neighbours', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ noNaN: true, noDefaultInfinity: true }), {
          minLength: 0,
          maxLength: 30,
        }),
        (curve) => {
          const minima = localMinima(curve);
          for (const idx of minima) {
            const cur = curve[idx] as number;
            // find nearest differing neighbour on left
            let leftVal: number | undefined;
            for (let k = idx - 1; k >= 0; k--) {
              if ((curve[k] as number) !== cur) {
                leftVal = curve[k] as number;
                break;
              }
            }
            // find nearest differing neighbour on right
            let rightVal: number | undefined;
            for (let k = idx + 1; k < curve.length; k++) {
              if ((curve[k] as number) !== cur) {
                rightVal = curve[k] as number;
                break;
              }
            }
            expect(leftVal).toBeDefined();
            expect(rightVal).toBeDefined();
            expect(cur).toBeLessThan(leftVal as number);
            expect(cur).toBeLessThan(rightVal as number);
          }
          // result is strictly increasing
          for (let k = 1; k < minima.length; k++) {
            expect(minima[k] as number).toBeGreaterThan(minima[k - 1] as number);
          }
        },
      ),
    );
  });
});

// Socratic Q46: spectrumToTuning — the capstone of "consonance is timbre-dependent."
describe('spectrumToTuning — timbre-derived TuningSystem', () => {
  it('test_harmonic_spectrum_gives_valid_tuning', () => {
    const tuning = spectrumToTuning(harmonicSpectrum());
    expect(tuning.degrees.length).toBeGreaterThan(1);
    expect(tuning.periodCents).toBe(1200);
    expect(tuning.referenceHz).toBe(440);
  });

  it('test_first_degree_is_unison', () => {
    const tuning = spectrumToTuning(harmonicSpectrum());
    const firstCents = tuning.degrees[0]?.kind === 'cents' ? tuning.degrees[0].cents : -1;
    expect(firstCents).toBe(0);
  });

  it('test_all_degrees_within_period', () => {
    const tuning = spectrumToTuning(harmonicSpectrum());
    for (const deg of tuning.degrees) {
      const c = deg.kind === 'cents' ? deg.cents : 0;
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(1200);
    }
  });

  it('test_harmonic_tuning_contains_approx_702c_fifth', () => {
    const tuning = spectrumToTuning(harmonicSpectrum());
    const cents = tuning.degrees.map((d) => (d.kind === 'cents' ? d.cents : 0));
    const hasFifth = cents.some((c) => Math.abs(c - 702) < 20);
    expect(hasFifth).toBe(true);
  });

  it('test_bell_vs_harmonic_give_different_tunings', () => {
    const harmTuning = spectrumToTuning(harmonicSpectrum());
    const bellTuning = spectrumToTuning(bellSpectrum());
    const harmCents = harmTuning.degrees.map((d) => (d.kind === 'cents' ? d.cents : 0));
    const bellCents = bellTuning.degrees.map((d) => (d.kind === 'cents' ? d.cents : 0));
    expect(harmCents).not.toEqual(bellCents);
  });

  it('test_id_and_referenceHz_opts_respected', () => {
    const tuning = spectrumToTuning(harmonicSpectrum(), { id: 'my-tuning', referenceHz: 261.63 });
    expect(tuning.id).toBe('my-tuning');
    expect(tuning.referenceHz).toBeCloseTo(261.63, 9);
  });

  it('test_result_usable_as_TuningSystem', () => {
    const tuning = spectrumToTuning(harmonicSpectrum());
    // A valid TuningSystem must pass defineTuning — it was constructed by defineTuning.
    expect(tuning.source).toBe('theoretical');
    expect(typeof tuning.id).toBe('string');
  });
});

// Q53: spectrumToTuning が最適な調律を生成するなら、既存調律の音色適合度を測れるか？
describe('tuningSuitability — how well does a tuning fit a timbre? (Q53)', () => {
  it('test_self_derived_tuning_has_full_coverage', () => {
    // By construction: spectrumToTuning(spectrum) should cover all consonant intervals.
    const spectrum = harmonicSpectrum();
    const tuning = spectrumToTuning(spectrum);
    const result = tuningSuitability(tuning, spectrum);
    expect(result.coverage).toBeCloseTo(1, 5);
  });

  it('test_12tet_fits_harmonic_better_than_bell', () => {
    // 12-TET was optimised for harmonic timbres — its coverage should be higher
    // for harmonicSpectrum than for bellSpectrum.
    const tuning12 = edo(12);
    const harmResult = tuningSuitability(tuning12, harmonicSpectrum());
    const bellResult = tuningSuitability(tuning12, bellSpectrum());
    expect(harmResult.coverage).toBeGreaterThan(bellResult.coverage);
  });

  it('test_coverage_is_between_0_and_1', () => {
    const result = tuningSuitability(edo(12), harmonicSpectrum());
    expect(result.coverage).toBeGreaterThanOrEqual(0);
    expect(result.coverage).toBeLessThanOrEqual(1);
  });

  it('test_avg_error_cents_is_non_negative', () => {
    const result = tuningSuitability(edo(12), harmonicSpectrum());
    expect(result.avgErrorCents).toBeGreaterThanOrEqual(0);
  });

  it('test_matched_count_consistent_with_total', () => {
    const result = tuningSuitability(edo(12), harmonicSpectrum());
    expect(result.matchedCount).toBeLessThanOrEqual(result.totalConsonantIntervals);
    expect(result.matchedCount).toBeGreaterThanOrEqual(0);
  });

  it('test_tight_tolerance_lowers_coverage', () => {
    // With a very tight tolerance, fewer intervals match.
    const wide = tuningSuitability(edo(12), harmonicSpectrum(), { toleranceCents: 50 });
    const tight = tuningSuitability(edo(12), harmonicSpectrum(), { toleranceCents: 1 });
    expect(wide.coverage).toBeGreaterThanOrEqual(tight.coverage);
  });

  it('test_bell_self_derived_tuning_has_full_coverage', () => {
    const spectrum = bellSpectrum();
    const tuning = spectrumToTuning(spectrum);
    const result = tuningSuitability(tuning, spectrum);
    expect(result.coverage).toBeCloseTo(1, 5);
  });

  it('test_denser_edo_fits_harmonic_at_least_as_well', () => {
    // 31-EDO approximates just intervals better than 12-EDO for harmonic timbres.
    const h12 = tuningSuitability(edo(12), harmonicSpectrum());
    const h31 = tuningSuitability(edo(31), harmonicSpectrum());
    expect(h31.avgErrorCents).toBeLessThanOrEqual(h12.avgErrorCents);
  });
});

// Q56: tuningSuitability measures one tuning — can we rank a list of candidates in one call?
describe('rankTuningsByFit — tuning leaderboard for a given timbre (Q56)', () => {
  it('test_returns_array_same_length_as_input', () => {
    const tunings = [edo(12), edo(19), edo(31)];
    const ranked = rankTuningsByFit(tunings, harmonicSpectrum());
    expect(ranked.length).toBe(3);
  });

  it('test_self_derived_tuning_ranks_first', () => {
    const spectrum = harmonicSpectrum();
    const derived = spectrumToTuning(spectrum);
    const ranked = rankTuningsByFit([edo(12), edo(19), derived], spectrum);
    expect(ranked[0]!.tuning.id).toBe(derived.id);
    expect(ranked[0]!.suitability.coverage).toBeCloseTo(1, 5);
  });

  it('test_coverage_descending_order', () => {
    const ranked = rankTuningsByFit([edo(12), edo(19), edo(31)], harmonicSpectrum());
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.suitability.coverage).toBeLessThanOrEqual(
        ranked[i - 1]!.suitability.coverage,
      );
    }
  });

  it('test_index_field_tracks_original_position', () => {
    const tunings = [edo(31), edo(12), edo(19)];
    const ranked = rankTuningsByFit(tunings, harmonicSpectrum());
    for (const entry of ranked) {
      expect(tunings[entry.index]).toBe(entry.tuning);
    }
  });

  it('test_suitability_matches_individual_call', () => {
    const spectrum = harmonicSpectrum();
    const tunings = [edo(12), edo(19)];
    const ranked = rankTuningsByFit(tunings, spectrum);
    for (const entry of ranked) {
      const individual = tuningSuitability(entry.tuning, spectrum);
      expect(entry.suitability.coverage).toBeCloseTo(individual.coverage, 9);
      expect(entry.suitability.avgErrorCents).toBeCloseTo(individual.avgErrorCents, 9);
    }
  });

  it('test_empty_input_returns_empty_array', () => {
    const ranked = rankTuningsByFit([], harmonicSpectrum());
    expect(ranked).toHaveLength(0);
  });

  it('test_31edo_ranks_above_12edo_for_harmonic_timbre', () => {
    // 31-EDO approximates just intervals more accurately than 12-EDO.
    const ranked = rankTuningsByFit([edo(12), edo(31)], harmonicSpectrum());
    const idx12 = ranked.findIndex((r) => r.tuning.id === '12-edo');
    const idx31 = ranked.findIndex((r) => r.tuning.id === '31-edo');
    expect(idx31).toBeLessThanOrEqual(idx12);
  });
});

// ---------------------------------------------------------------------------
// Q85 — chordObjectDissonance
// ---------------------------------------------------------------------------

describe('chordObjectDissonance (Q85)', () => {
  const spec = harmonicSpectrum();

  it('test_matches_manual_realizeChordFreqs_then_chordDissonance', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const rootHz = 261.63;
    const expected = chordDissonance(realizeChordFreqs(chord, rootHz), spec);
    const result = chordObjectDissonance(chord, rootHz, spec);
    expect(result).toBeCloseTo(expected, 9);
  });

  it('test_result_is_non_negative', () => {
    const chord = chordFromSemitones('dom7', [0, 4, 7, 10]);
    expect(chordObjectDissonance(chord, 261.63, spec)).toBeGreaterThanOrEqual(0);
  });

  it('test_perfect_fifth_dyad_less_dissonant_than_tritone_dyad', () => {
    // A perfect fifth (1/1, 3/2) should be more consonant than a tritone (1/1, sqrt(2))
    // under a harmonic spectrum — same number of notes, different intervals.
    const justFifth = chordFromRatios('fifth', [
      [1, 1],
      [3, 2],
    ]);
    const tritoneDyad = chordFromSemitones('tritone', [0, 6]);
    const dFifth = chordObjectDissonance(justFifth, 261.63, spec);
    const dTritone = chordObjectDissonance(tritoneDyad, 261.63, spec);
    expect(dFifth).toBeLessThan(dTritone);
  });

  it('test_different_root_hz_changes_score', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const d1 = chordObjectDissonance(chord, 261.63, spec);
    const d2 = chordObjectDissonance(chord, 110, spec);
    // Lower register tends to produce higher roughness, but values should differ
    expect(d1).not.toBeCloseTo(d2, 3);
  });

  it('test_bell_spectrum_gives_different_score_than_harmonic', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const dHarm = chordObjectDissonance(chord, 261.63, harmonicSpectrum());
    const dBell = chordObjectDissonance(chord, 261.63, bellSpectrum());
    expect(dHarm).not.toBeCloseTo(dBell, 3);
  });
});
