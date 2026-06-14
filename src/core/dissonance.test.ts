import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import {
  dissonancePair,
  chordDissonance,
  dissonanceCurve,
  localMinima,
  consonantIntervals,
} from './dissonance.js';

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
