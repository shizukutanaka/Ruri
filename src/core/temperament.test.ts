import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { regularTemperament, meantoneQuarterComma, pythagorean } from './temperament.js';
import { type TuningSystem } from './tuning.js';

// Helper: extract cents values from a TuningSystem
function toCentsList(t: TuningSystem): number[] {
  return t.degrees.map((p) => (p.kind === 'cents' ? p.cents : NaN));
}

describe('pythagorean tuning', () => {
  it('test_pythagorean_12_has_12_degrees', () => {
    const t = pythagorean(440, 12);
    expect(t.degrees.length).toBe(12);
  });

  it('test_pythagorean_has_fifth_near_701_955', () => {
    const t = pythagorean(440, 12);
    const cents = toCentsList(t);
    // The pure fifth ~701.955 c should appear as one of the degrees
    const hasFifth = cents.some((c) => Math.abs(c - 701.9550008653874) < 0.001);
    expect(hasFifth).toBe(true);
  });

  it('test_pythagorean_apotome_present', () => {
    // Apotome (Pythagorean chromatic semitone) ≈ 113.685 c = 7 pure fifths − 4 octaves
    const t = pythagorean(440, 12);
    const cents = toCentsList(t);
    const hasApotome = cents.some((c) => Math.abs(c - 113.685) < 0.01);
    expect(hasApotome).toBe(true);
  });

  it('test_pythagorean_all_degrees_in_period', () => {
    const t = pythagorean(440, 12);
    const cents = toCentsList(t);
    for (const c of cents) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(1200);
    }
  });

  it('test_pythagorean_differs_from_12tet', () => {
    const t = pythagorean(440, 12);
    const cents = toCentsList(t);
    // Pythagorean comma: the sharpest degree differs from 12-TET
    // e.g. 11th degree should not be exactly 1100 c
    const hasNonEqual = cents.some((c, i) => Math.abs(c - i * 100) > 0.5);
    expect(hasNonEqual).toBe(true);
  });
});

describe('quarter-comma meantone', () => {
  it('test_meantone_qc_12_has_12_degrees', () => {
    const t = meantoneQuarterComma(440, 12);
    expect(t.degrees.length).toBe(12);
  });

  it('test_meantone_qc_fifth_near_696_578', () => {
    const t = meantoneQuarterComma(440, 12);
    const cents = toCentsList(t);
    // The meantone fifth ≈ 696.578 c should appear
    const hasFifth = cents.some((c) => Math.abs(c - 696.578) < 0.01);
    expect(hasFifth).toBe(true);
  });

  it('test_meantone_qc_major_third_is_pure_near_386_314', () => {
    // Defining property of quarter-comma meantone: major third = 4 generator steps
    // 4 * 696.578 = 2786.312, reduced: 2786.312 - 2*1200 = 386.312 ≈ 386.3137
    const t = meantoneQuarterComma(440, 12);
    const cents = toCentsList(t);
    const hasMajorThird = cents.some((c) => Math.abs(c - 386.3137) < 0.001);
    expect(hasMajorThird).toBe(true);
  });

  it('test_meantone_qc_major_third_close_to_3', () => {
    const t = meantoneQuarterComma(440, 12);
    const cents = toCentsList(t);
    const majorThird = cents.find((c) => Math.abs(c - 386.3137) < 0.01);
    expect(majorThird).toBeDefined();
    expect(majorThird as number).toBeCloseTo(386.3137, 3);
  });

  it('test_meantone_qc_all_degrees_in_period', () => {
    const t = meantoneQuarterComma(440, 12);
    const cents = toCentsList(t);
    for (const c of cents) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(1200);
    }
  });
});

describe('regularTemperament general', () => {
  it('test_700c_generator_12_notes_matches_12tet', () => {
    // With generator=700 and period=1200, 12 notes should closely approximate 12-TET
    const t = regularTemperament({
      generatorCents: 700,
      periodCents: 1200,
      count: 12,
      down: 0,
    });
    expect(t.degrees.length).toBe(12);
    const cents = toCentsList(t);
    // All values should be multiples of 100 (within floating-point tolerance)
    for (const c of cents) {
      const nearest = Math.round(c / 100) * 100;
      expect(c).toBeCloseTo(nearest, 6);
    }
  });

  it('test_non_octave_period_works', () => {
    // generator=700, period=1208 (sléndro-like stretch), count=5
    const t = regularTemperament({
      generatorCents: 700,
      periodCents: 1208,
      count: 5,
      down: 0,
    });
    expect(t.degrees.length).toBe(5);
    const cents = toCentsList(t);
    for (const c of cents) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(1208);
    }
    // Verify strictly ascending
    for (let i = 1; i < cents.length; i++) {
      expect(cents[i] as number).toBeGreaterThan(cents[i - 1] as number);
    }
  });

  it('test_single_degree_always_zero', () => {
    const t = regularTemperament({ generatorCents: 350, count: 1, down: 0 });
    expect(t.degrees.length).toBe(1);
    const c = toCentsList(t)[0];
    expect(c).toBeCloseTo(0, 9);
  });

  it('test_degree_0_is_always_zero', () => {
    // k=0 gives raw=0, reduced=0, always degree 0 after sort
    const t = regularTemperament({ generatorCents: 317.4, count: 7, down: 3 });
    const cents = toCentsList(t);
    expect(cents[0]).toBeCloseTo(0, 9);
  });
});

describe('regularTemperament error cases', () => {
  it('test_degenerate_600c_count_3_throws', () => {
    // 600c generator with 1200c period: -600 → 600, 0 → 0, 600 → 600 (duplicate)
    expect(() =>
      regularTemperament({ generatorCents: 600, periodCents: 1200, count: 3, down: 1 }),
    ).toThrow(RangeError);
  });

  it('test_degenerate_600c_count_2_is_ok', () => {
    // 600c with count=2: two distinct degrees (0, 600) — no duplicates
    expect(() =>
      regularTemperament({ generatorCents: 600, periodCents: 1200, count: 2, down: 0 }),
    ).not.toThrow();
  });

  it('test_count_0_throws', () => {
    expect(() => regularTemperament({ generatorCents: 700, count: 0 })).toThrow(RangeError);
  });

  it('test_count_negative_throws', () => {
    expect(() => regularTemperament({ generatorCents: 700, count: -1 })).toThrow(RangeError);
  });

  it('test_count_non_integer_throws', () => {
    expect(() => regularTemperament({ generatorCents: 700, count: 5.5 })).toThrow(RangeError);
  });

  it('test_period_zero_throws', () => {
    expect(() => regularTemperament({ generatorCents: 700, periodCents: 0, count: 5 })).toThrow(
      RangeError,
    );
  });

  it('test_period_negative_throws', () => {
    expect(() => regularTemperament({ generatorCents: 700, periodCents: -1200, count: 5 })).toThrow(
      RangeError,
    );
  });

  it('test_down_exceeds_count_minus_1_throws', () => {
    expect(() => regularTemperament({ generatorCents: 700, count: 5, down: 5 })).toThrow(
      RangeError,
    );
  });

  it('test_down_negative_throws', () => {
    expect(() => regularTemperament({ generatorCents: 700, count: 5, down: -1 })).toThrow(
      RangeError,
    );
  });

  it('test_generator_infinite_throws', () => {
    expect(() => regularTemperament({ generatorCents: Infinity, count: 5 })).toThrow(RangeError);
  });
});

describe('regularTemperament property tests', () => {
  it('property_degrees_strictly_ascending_in_period_degree0_is_zero', () => {
    fc.assert(
      fc.property(
        // Generator: pick from range that avoids common degenerate cases at integer fractions
        fc.float({ min: Math.fround(1.3), max: Math.fround(598.7), noNaN: true }),
        fc.integer({ min: 1, max: 24 }),
        (generatorCents, count) => {
          // Skip if likely degenerate: check if generator*k mod 1200 ≈ generator*j mod 1200 for k≠j
          // We just let the function throw and skip those cases
          let t: TuningSystem;
          try {
            t = regularTemperament({
              generatorCents,
              periodCents: 1200,
              count,
              down: 0,
            });
          } catch {
            // Degenerate case — skip
            return;
          }

          const cents = toCentsList(t);

          // Must have exactly count degrees
          expect(cents.length).toBe(count);

          // Degree 0 must be 0
          expect(cents[0]).toBeCloseTo(0, 6);

          // Strictly ascending
          for (let i = 1; i < cents.length; i++) {
            expect(cents[i] as number).toBeGreaterThan(cents[i - 1] as number);
          }

          // All in [0, 1200)
          for (const c of cents) {
            expect(c).toBeGreaterThanOrEqual(0);
            expect(c).toBeLessThan(1200);
          }
        },
      ),
    );
  });
});
