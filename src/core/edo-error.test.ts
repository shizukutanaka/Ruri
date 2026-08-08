import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  relativeError,
  edoHarmonicErrors,
  isConsistent,
  edoConsistencyLimit,
  CONSISTENCY_THRESHOLD,
} from './edo-error.js';

describe('relativeError', () => {
  it('test_exact_step_has_zero_error', () => {
    // 700c is exactly 7 steps of 12-EDO.
    expect(relativeError(700, 12)).toBeCloseTo(0, 12);
  });

  it('test_half_step_offset_is_maximal', () => {
    // 50c sits exactly between 12-EDO steps → |relative error| = 0.5.
    expect(Math.abs(relativeError(50, 12))).toBeCloseTo(0.5, 12);
  });

  it('test_sign_is_positive_when_edo_is_sharp_of_target', () => {
    // Just major third 386.31c; 12-EDO's nearest step is 400c → sharp → positive.
    expect(relativeError(1200 * Math.log2(5 / 4), 12)).toBeGreaterThan(0);
    // Just fifth 701.955c; 12-EDO's 700c is flat → negative.
    expect(relativeError(1200 * Math.log2(3 / 2), 12)).toBeLessThan(0);
  });

  it('test_rejects_invalid_input', () => {
    expect(() => relativeError(100, 0)).toThrow(RangeError);
    expect(() => relativeError(100, 2.5)).toThrow(RangeError);
    expect(() => relativeError(Number.NaN, 12)).toThrow(RangeError);
  });

  it('property_always_within_plus_minus_half_a_step', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -5000, max: 5000, noNaN: true }),
        fc.integer({ min: 1, max: 300 }),
        (cents, n) => {
          expect(Math.abs(relativeError(cents, n))).toBeLessThanOrEqual(0.5 + 1e-9);
        },
      ),
    );
  });
});

describe('edoHarmonicErrors', () => {
  it('test_twelve_tet_major_third_is_13_7_cents_sharp', () => {
    // The textbook figure for 12-TET's approximation of 5/4.
    const h5 = edoHarmonicErrors(12, 5).find((h) => h.harmonic === 5)!;
    expect(h5.errorCents).toBeCloseTo(13.686, 2);
    expect(h5.relativeError).toBeCloseTo(0.137, 3);
  });

  it('test_twelve_tet_fifth_is_about_2_cents_flat', () => {
    const h3 = edoHarmonicErrors(12, 3).find((h) => h.harmonic === 3)!;
    expect(h3.errorCents).toBeCloseTo(-1.955, 2);
  });

  it('test_harmonic_1_is_exact_and_table_covers_odd_harmonics', () => {
    const table = edoHarmonicErrors(31, 9);
    expect(table.map((h) => h.harmonic)).toEqual([1, 3, 5, 7, 9]);
    expect(table[0]!.errorCents).toBeCloseTo(0, 12);
  });

  it('test_errorCents_and_relativeError_always_agree_in_sign', () => {
    // Guards the two measures against drifting apart (they are the same quantity
    // in different units: cents vs fraction of a step).
    for (const n of [12, 17, 19, 22, 31, 41, 53]) {
      for (const h of edoHarmonicErrors(n, 15)) {
        if (Math.abs(h.errorCents) > 1e-9) {
          expect(Math.sign(h.errorCents)).toBe(Math.sign(h.relativeError));
        }
        expect(h.relativeError * (1200 / n)).toBeCloseTo(h.errorCents, 9);
      }
    }
  });

  it('test_rejects_even_odd_limit', () => {
    expect(() => edoHarmonicErrors(12, 6)).toThrow(RangeError);
    expect(() => edoHarmonicErrors(12, 0)).toThrow(RangeError);
  });
});

describe('consistency (25% criterion)', () => {
  it('test_46_is_the_smallest_edo_consistent_in_the_13_odd_limit', () => {
    // Published result: 46-EDO is the smallest EDO approximating odd harmonics
    // 1–13 with less than 25% relative error (Xenharmonic Wiki, "Consistency").
    for (let n = 1; n < 46; n++) {
      expect(isConsistent(n, 13)).toBe(false);
    }
    expect(isConsistent(46, 13)).toBe(true);
  });

  it('test_known_consistency_limits', () => {
    // 12-EDO handles the 5-odd-limit (its 7th harmonic is badly off);
    // 41 and 46 are the well-known high-accuracy systems.
    expect(edoConsistencyLimit(12)).toBe(5);
    expect(edoConsistencyLimit(41)).toBe(11);
    expect(edoConsistencyLimit(46)).toBe(13);
  });

  it('test_consistency_limit_of_1_edo_is_trivial', () => {
    // 1-EDO has only the octave; the fifth is half a step away → nothing consistent.
    expect(edoConsistencyLimit(1)).toBe(1);
  });

  it('test_consistent_implies_every_harmonic_within_threshold', () => {
    for (const n of [12, 19, 31, 41, 46, 53, 72]) {
      const q = edoConsistencyLimit(n);
      for (const h of edoHarmonicErrors(n, q)) {
        expect(Math.abs(h.relativeError)).toBeLessThan(CONSISTENCY_THRESHOLD);
      }
    }
  });

  it('property_consistency_is_downward_closed', () => {
    // If an EDO is consistent at q, it is consistent at every smaller odd limit.
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 120 }), (n) => {
        const q = edoConsistencyLimit(n, 21);
        for (let smaller = 1; smaller <= q; smaller += 2) {
          expect(isConsistent(n, smaller)).toBe(true);
        }
      }),
    );
  });
});
