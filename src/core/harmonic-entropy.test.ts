import { describe, it, expect } from 'vitest';
import { entropyBasis, harmonicEntropy, harmonicEntropyCurve } from './harmonic-entropy.js';
import { localMinima } from './dissonance.js';

const cents = (n: number, d: number): number => 1200 * Math.log2(n / d);

describe('entropyBasis', () => {
  it('test_contains_only_reduced_ratios_within_range', () => {
    const basis = entropyBasis(200, 1200);
    for (const r of basis) {
      expect(r.num / r.den).toBeGreaterThanOrEqual(1);
      expect(r.num / r.den).toBeLessThanOrEqual(2 + 1e-12);
      expect(r.num * r.den).toBeLessThanOrEqual(200);
      // reduced: no common factor
      const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b));
      expect(g(r.num, r.den)).toBe(1);
    }
  });

  it('test_simpler_ratios_carry_more_weight', () => {
    const basis = entropyBasis(1000);
    const find = (n: number, d: number) => basis.find((r) => r.num === n && r.den === d)!;
    expect(find(3, 2).weight).toBeGreaterThan(find(7, 5).weight);
    expect(find(1, 1).weight).toBeGreaterThan(find(3, 2).weight);
  });

  it('test_rejects_invalid_parameters', () => {
    expect(() => entropyBasis(0)).toThrow(RangeError);
    expect(() => entropyBasis(1000, 0)).toThrow(RangeError);
  });
});

describe('harmonicEntropy — consonance ordering', () => {
  const basis = entropyBasis();

  it('test_simple_ratios_score_lower_than_complex_ones', () => {
    // The defining behaviour: simpler ratio = less ambiguity = lower entropy.
    const fifth = harmonicEntropy(cents(3, 2), {}, basis);
    const septimalTritone = harmonicEntropy(cents(7, 5), {}, basis);
    expect(fifth).toBeLessThan(septimalTritone);
  });

  it('test_just_intervals_score_lower_than_nearby_non_ratios', () => {
    // 550c matches no simple ratio; the just fourth and fifth flank it.
    const ambiguous = harmonicEntropy(550, {}, basis);
    expect(harmonicEntropy(cents(3, 2), {}, basis)).toBeLessThan(ambiguous);
    expect(harmonicEntropy(cents(4, 3), {}, basis)).toBeLessThan(ambiguous);
  });

  it('test_unison_and_octave_are_the_most_certain_intervals', () => {
    const unison = harmonicEntropy(0, {}, basis);
    const octave = harmonicEntropy(1200, {}, basis);
    for (const c of [cents(5, 4), cents(4, 3), cents(3, 2), 550, 250]) {
      expect(unison).toBeLessThan(harmonicEntropy(c, {}, basis));
      expect(octave).toBeLessThan(harmonicEntropy(c, {}, basis));
    }
  });

  it('test_tolerates_slight_mistuning', () => {
    // Unlike exact-ratio periodicity measures, HE degrades smoothly: a fifth
    // mistuned by 2 cents is still heard as a fifth.
    const exact = harmonicEntropy(cents(3, 2), {}, basis);
    const mistuned = harmonicEntropy(cents(3, 2) - 2, {}, basis);
    expect(Math.abs(mistuned - exact)).toBeLessThan(0.2);
    expect(mistuned).toBeLessThan(harmonicEntropy(550, {}, basis));
  });

  it('test_entropy_is_non_negative', () => {
    for (let c = 0; c <= 1200; c += 50) {
      expect(harmonicEntropy(c, {}, basis)).toBeGreaterThanOrEqual(0);
    }
  });

  it('test_rejects_invalid_input', () => {
    expect(() => harmonicEntropy(Number.NaN)).toThrow(RangeError);
    expect(() => harmonicEntropy(700, { spreadCents: 0 })).toThrow(RangeError);
  });
});

describe('harmonicEntropyCurve — minima land on just intervals', () => {
  it('test_curve_minima_include_the_classic_just_intervals', () => {
    // Scanning the curve recovers 6/5, 5/4, 4/3, 3/2, 5/3 and 7/4 — with no
    // spectrum supplied, unlike the roughness-based dissonance curve.
    const step = 1;
    const list = Array.from({ length: 1201 / step }, (_, i) => i * step);
    const curve = harmonicEntropyCurve(list, { spreadCents: 17 });
    const minimaCents = localMinima(curve).map((i) => list[i]!);

    const near = (target: number): boolean => minimaCents.some((m) => Math.abs(m - target) <= 6);
    expect(near(cents(6, 5))).toBe(true); // 315.6c
    expect(near(cents(5, 4))).toBe(true); // 386.3c
    expect(near(cents(4, 3))).toBe(true); // 498.0c
    expect(near(cents(3, 2))).toBe(true); // 702.0c
    expect(near(cents(5, 3))).toBe(true); // 884.4c
    expect(near(cents(7, 4))).toBe(true); // 968.8c
  });

  it('test_curve_length_matches_input', () => {
    const list = [0, 100, 200, 300];
    expect(harmonicEntropyCurve(list)).toHaveLength(4);
  });

  it('test_is_timbre_independent_by_construction', () => {
    // There is no spectrum parameter: the same interval yields the same entropy
    // regardless of instrument, which is what distinguishes this from roughness.
    const a = harmonicEntropyCurve([cents(3, 2)]);
    const b = harmonicEntropyCurve([cents(3, 2)]);
    expect(a[0]).toBe(b[0]);
  });
});

describe('harmonicEntropy — degenerate inputs', () => {
  it('test_an_interval_far_outside_the_basis_returns_zero', () => {
    // Every Gaussian underflows, so the weights sum to zero: there is no
    // distribution to take the entropy of, and 0 means "no information".
    const b = entropyBasis();
    expect(harmonicEntropy(1e6, {}, b)).toBe(0);
    expect(harmonicEntropy(-5000, {}, b)).toBe(0);
  });

  it('test_a_vanishingly_narrow_spread_also_collapses_to_zero', () => {
    const b = entropyBasis();
    expect(harmonicEntropy(550, { spreadCents: 1e-6 }, b)).toBe(0);
  });

  it('test_a_non_positive_spread_throws', () => {
    expect(() => harmonicEntropy(700, { spreadCents: 0 })).toThrow(RangeError);
    expect(() => harmonicEntropy(700, { spreadCents: -1 })).toThrow(RangeError);
  });

  it('test_non_finite_cents_throws', () => {
    expect(() => harmonicEntropy(NaN)).toThrow(RangeError);
    expect(() => harmonicEntropy(Infinity)).toThrow(RangeError);
  });

  it('test_omitting_the_basis_builds_the_default_one', () => {
    // Verified equal: the default basis is entropyBasis() with its own defaults.
    expect(harmonicEntropy(701.955)).toBeCloseTo(harmonicEntropy(701.955, {}, entropyBasis()), 12);
  });

  it('test_basis_options_are_honoured_when_no_basis_is_passed', () => {
    // A smaller Tenney ceiling admits fewer ratios, so there is less to be
    // uncertain about and the entropy drops.
    const narrow = harmonicEntropy(701.955, { maxCents: 1200, maxTenneyHeight: 1000 });
    expect(narrow).toBeLessThan(harmonicEntropy(701.955));
  });
});
