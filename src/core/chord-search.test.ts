import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { equalTemperament12, edo } from './tuning.js';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import { rankChords } from './chord-search.js';

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
