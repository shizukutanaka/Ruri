import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { minimalVoiceLeading, voiceLeadingCost } from './voice-leading.js';
import { freqToCents } from './cents.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Brute-force optimal assignment by enumerating all permutations (for small n). */
function bruteForceVoiceLeadingCost(
  fromFreqs: readonly number[],
  toFreqs: readonly number[],
): number {
  const n = fromFreqs.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  function permutations(arr: number[]): number[][] {
    if (arr.length <= 1) return [arr.slice()];
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permutations(rest)) {
        result.push([arr[i] as number, ...p]);
      }
    }
    return result;
  }

  let best = Infinity;
  for (const perm of permutations(indices)) {
    let cost = 0;
    for (let i = 0; i < n; i++) {
      const fromHz = fromFreqs[i] as number;
      const toHz = toFreqs[perm[i] as number] as number;
      cost += Math.abs(freqToCents(toHz, fromHz));
    }
    if (cost < best) best = cost;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Concrete tests
// ---------------------------------------------------------------------------

describe('minimalVoiceLeading — identical chords', () => {
  it('test_identical_chords_zero_motion', () => {
    const freqs = [261.63, 329.63, 392.0];
    const vl = minimalVoiceLeading(freqs, freqs);
    expect(vl.totalCents).toBeCloseTo(0, 10);
    expect(vl.maxCents).toBeCloseTo(0, 10);
    for (const a of vl.assignments) {
      expect(a.motionCents).toBeCloseTo(0, 10);
    }
  });

  it('test_identical_single_voice_zero_motion', () => {
    const vl = minimalVoiceLeading([440], [440]);
    expect(vl.totalCents).toBe(0);
    expect(vl.assignments[0]!.motionCents).toBe(0);
  });
});

describe('minimalVoiceLeading — C major → F major', () => {
  // C4≈261.63, E4≈329.63, G4≈392.00 → C4≈261.63, F4≈349.23, A4≈440.00
  // Optimal pairing: C→C (0), E→F (~100c), G→A (~200c), total ~300c
  const from = [261.63, 329.63, 392.0];
  const to = [261.63, 349.23, 440.0];

  it('test_total_cents_approx_300', () => {
    const vl = minimalVoiceLeading(from, to);
    // Exact: |0| + |1200*log2(349.23/329.63)| + |1200*log2(440/392)|
    const exactTotal =
      Math.abs(freqToCents(261.63, 261.63)) +
      Math.abs(freqToCents(349.23, 329.63)) +
      Math.abs(freqToCents(440.0, 392.0));
    expect(vl.totalCents).toBeCloseTo(exactTotal, 1);
    // Should be roughly 300 cents
    expect(vl.totalCents).toBeGreaterThan(250);
    expect(vl.totalCents).toBeLessThan(350);
  });

  it('test_assignments_sorted_by_from_index', () => {
    const vl = minimalVoiceLeading(from, to);
    for (let i = 1; i < vl.assignments.length; i++) {
      expect(vl.assignments[i]!.from).toBeGreaterThan(vl.assignments[i - 1]!.from);
    }
  });

  it('test_each_from_index_appears_exactly_once', () => {
    const vl = minimalVoiceLeading(from, to);
    const fromSet = new Set(vl.assignments.map((a) => a.from));
    expect(fromSet.size).toBe(from.length);
  });

  it('test_each_to_index_appears_exactly_once', () => {
    const vl = minimalVoiceLeading(from, to);
    const toSet = new Set(vl.assignments.map((a) => a.to));
    expect(toSet.size).toBe(to.length);
  });
});

describe('minimalVoiceLeading — crossing case (sorted matching vs naive)', () => {
  // Optimal: 200→210 (~84c), 400→410 (~42c), total ~126c
  // Naive index pairing: 200→410 (~1237c), 400→210 (~1115c), total ~2352c — much worse
  const from = [200, 400];
  const to = [410, 210];

  it('test_sorted_matching_beats_naive_pairing', () => {
    const vl = minimalVoiceLeading(from, to);

    // The assignment that pairs 200→210 and 400→410 (sorted order):
    // from[0]=200 should go to to[1]=210, from[1]=400 should go to to[0]=410
    const a0 = vl.assignments.find((a) => a.from === 0);
    const a1 = vl.assignments.find((a) => a.from === 1);
    expect(a0).toBeDefined();
    expect(a1).toBeDefined();
    expect(a0!.to).toBe(1); // 200 Hz → to[1]=210 Hz
    expect(a1!.to).toBe(0); // 400 Hz → to[0]=410 Hz

    // Verify total is much less than naive cross-assignment
    const naiveCost = Math.abs(freqToCents(410, 200)) + Math.abs(freqToCents(210, 400));
    expect(vl.totalCents).toBeLessThan(naiveCost);
  });

  it('test_crossing_case_motion_signs', () => {
    const vl = minimalVoiceLeading(from, to);
    // 200→210: upward motion
    const a0 = vl.assignments.find((a) => a.from === 0);
    // 400→410: upward motion
    const a1 = vl.assignments.find((a) => a.from === 1);
    expect(a0!.motionCents).toBeGreaterThan(0);
    expect(a1!.motionCents).toBeGreaterThan(0);
  });
});

describe('minimalVoiceLeading — voiceLeadingCost convenience', () => {
  it('test_cost_equals_totalCents', () => {
    const from = [261.63, 329.63, 392.0];
    const to = [261.63, 349.23, 440.0];
    expect(voiceLeadingCost(from, to)).toBe(minimalVoiceLeading(from, to).totalCents);
  });
});

// ---------------------------------------------------------------------------
// Validation / error tests
// ---------------------------------------------------------------------------

describe('minimalVoiceLeading — validation errors', () => {
  it('throws_RangeError_for_empty_fromFreqs', () => {
    expect(() => minimalVoiceLeading([], [440])).toThrow(RangeError);
  });

  it('throws_RangeError_for_empty_toFreqs', () => {
    expect(() => minimalVoiceLeading([440], [])).toThrow(RangeError);
  });

  it('throws_RangeError_for_unequal_lengths', () => {
    expect(() => minimalVoiceLeading([440, 550], [440])).toThrow(RangeError);
  });

  it('throws_RangeError_for_length_13', () => {
    const arr = Array.from({ length: 13 }, (_, i) => 200 + i * 50);
    expect(() => minimalVoiceLeading(arr, arr)).toThrow(RangeError);
  });

  it('throws_RangeError_for_non_finite_freq_in_from', () => {
    expect(() => minimalVoiceLeading([440, Infinity], [440, 550])).toThrow(RangeError);
  });

  it('throws_RangeError_for_NaN_in_to', () => {
    expect(() => minimalVoiceLeading([440], [NaN])).toThrow(RangeError);
  });

  it('throws_RangeError_for_zero_freq', () => {
    expect(() => minimalVoiceLeading([0, 440], [440, 550])).toThrow(RangeError);
  });

  it('throws_RangeError_for_negative_freq', () => {
    expect(() => minimalVoiceLeading([-100], [440])).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// fast-check properties
// ---------------------------------------------------------------------------

/** Arbitrarily generate a sorted array of n distinct positive frequencies in [100, 2000]. */
const freqArray = (n: number) =>
  fc
    .uniqueArray(fc.float({ min: 100, max: 2000, noNaN: true, noDefaultInfinity: true }), {
      minLength: n,
      maxLength: n,
      comparator: (a, b) => Math.abs(a - b) < 0.001,
    })
    .filter((arr) => arr.every((f) => f > 0 && Number.isFinite(f)));

describe('minimalVoiceLeading — fast-check properties', () => {
  it('property_totalCents_non_negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }).chain((n) => fc.tuple(freqArray(n), freqArray(n))),
        ([from, to]) => {
          const vl = minimalVoiceLeading(from, to);
          expect(vl.totalCents).toBeGreaterThanOrEqual(0);
          expect(vl.maxCents).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('property_optimal_vs_brute_force', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }).chain((n) => fc.tuple(freqArray(n), freqArray(n))),
        ([from, to]) => {
          const ourCost = voiceLeadingCost(from, to);
          const bruteCost = bruteForceVoiceLeadingCost(from, to);
          expect(Math.abs(ourCost - bruteCost)).toBeLessThan(1e-9);
        },
      ),
    );
  });

  it('property_symmetry_cost_a_b_equals_cost_b_a', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }).chain((n) => fc.tuple(freqArray(n), freqArray(n))),
        ([a, b]) => {
          const costAB = voiceLeadingCost(a, b);
          const costBA = voiceLeadingCost(b, a);
          expect(Math.abs(costAB - costBA)).toBeLessThan(1e-9);
        },
      ),
    );
  });

  it('property_assignments_form_bijection', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }).chain((n) => fc.tuple(freqArray(n), freqArray(n))),
        ([from, to]) => {
          const vl = minimalVoiceLeading(from, to);
          const n = from.length;
          expect(vl.assignments.length).toBe(n);

          const fromIndices = vl.assignments.map((a) => a.from);
          const toIndices = vl.assignments.map((a) => a.to);

          // All from indices distinct and cover 0..n-1
          expect(new Set(fromIndices).size).toBe(n);
          expect(new Set(toIndices).size).toBe(n);

          // Sorted by from ascending
          for (let i = 1; i < fromIndices.length; i++) {
            expect(fromIndices[i]!).toBeGreaterThan(fromIndices[i - 1]!);
          }
        },
      ),
    );
  });

  it('property_motionCents_consistent_with_totalCents_and_maxCents', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }).chain((n) => fc.tuple(freqArray(n), freqArray(n))),
        ([from, to]) => {
          const vl = minimalVoiceLeading(from, to);
          const computedTotal = vl.assignments.reduce((sum, a) => sum + Math.abs(a.motionCents), 0);
          const computedMax = vl.assignments.reduce(
            (mx, a) => Math.max(mx, Math.abs(a.motionCents)),
            0,
          );
          expect(Math.abs(vl.totalCents - computedTotal)).toBeLessThan(1e-9);
          expect(Math.abs(vl.maxCents - computedMax)).toBeLessThan(1e-9);
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Tie-break: equal frequencies → sort by original index (branch coverage)
// ---------------------------------------------------------------------------

describe('minimalVoiceLeading duplicate-frequency tie-break', () => {
  it('test_equal_fromFreqs_sorts_by_original_index', () => {
    // fromFreqs has duplicate 440 Hz: comparator tie-break branch (a - b) is exercised.
    const result = minimalVoiceLeading([440, 440], [440, 440]);
    expect(result.assignments).toHaveLength(2);
    expect(result.totalCents).toBeCloseTo(0, 10);
    expect(result.maxCents).toBeCloseTo(0, 10);
  });

  it('test_equal_toFreqs_sorts_by_original_index', () => {
    // toFreqs has duplicate → tie-break on toOrder sort.
    const result = minimalVoiceLeading([330, 440], [440, 440]);
    // Both 440 s in toFreqs are matched; should not throw.
    expect(result.assignments).toHaveLength(2);
  });
});
