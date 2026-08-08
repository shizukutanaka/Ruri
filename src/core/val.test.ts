import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  PRIMES,
  patentVal,
  formatVal,
  mapRatioByVal,
  tempersOut,
  temperedCommas,
  NAMED_COMMA_TABLE,
} from './val.js';

describe('patentVal', () => {
  it('test_17edo_patent_val_matches_published_value', () => {
    // Xenharmonic Wiki, "Patent val": 17edo is <17 27 39].
    expect(patentVal(17, 5)).toEqual([17, 27, 39]);
    expect(formatVal(patentVal(17, 5))).toBe('<17 27 39]');
  });

  it('test_12edo_and_31edo_patent_vals', () => {
    expect(patentVal(12, 5)).toEqual([12, 19, 28]);
    expect(patentVal(31, 7)).toEqual([31, 49, 72, 87]);
  });

  it('test_first_entry_is_always_the_edo_number', () => {
    // Prime 2 maps to the division count itself by definition.
    for (const n of [5, 12, 19, 31, 41, 53, 72]) {
      expect(patentVal(n, 7)[0]).toBe(n);
    }
  });

  it('test_rejects_invalid_input', () => {
    expect(() => patentVal(0, 5)).toThrow(RangeError);
    expect(() => patentVal(12.5, 5)).toThrow(RangeError);
    expect(() => patentVal(12, 9)).toThrow(RangeError); // 9 is not prime
  });

  it('property_every_entry_is_the_nearest_step_count_for_its_prime', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 300 }), (n) => {
        const val = patentVal(n, 13);
        val.forEach((steps, i) => {
          const exact = n * Math.log2(PRIMES[i] as number);
          expect(Math.abs(steps - exact)).toBeLessThanOrEqual(0.5 + 1e-9);
        });
      }),
    );
  });
});

describe('mapRatioByVal', () => {
  it('test_maps_primes_to_their_val_entries', () => {
    const val = patentVal(12, 5); // <12 19 28]
    expect(mapRatioByVal(3, 2, val)).toBe(7); // fifth = 19 - 12 = 7 steps
    expect(mapRatioByVal(5, 4, val)).toBe(4); // major third = 28 - 24 = 4 steps
    expect(mapRatioByVal(2, 1, val)).toBe(12); // octave
  });

  it('test_returns_null_for_ratios_outside_the_val', () => {
    const val5 = patentVal(12, 5);
    expect(mapRatioByVal(7, 4, val5)).toBeNull(); // 7 is beyond the 5-limit val
    expect(mapRatioByVal(37, 32, patentVal(12, 31))).toBeNull(); // 37 beyond PRIMES
  });

  it('test_mapping_is_additive_over_multiplication', () => {
    // The point of a val: interval arithmetic becomes integer addition.
    const val = patentVal(31, 7);
    const fifth = mapRatioByVal(3, 2, val)!;
    const third = mapRatioByVal(5, 4, val)!;
    expect(mapRatioByVal(15, 8, val)).toBe(fifth + third);
  });
});

describe('tempersOut — temperament identification', () => {
  it('test_meantone_edos_temper_out_the_syntonic_comma', () => {
    // The defining property of meantone: 81/80 vanishes, so four fifths give a
    // usable major third. These are the classic meantone EDOs.
    for (const n of [12, 19, 26, 31, 43, 50]) {
      expect(tempersOut(n, 81, 80)).toBe(true);
    }
  });

  it('test_non_meantone_edos_do_not_temper_out_the_syntonic_comma', () => {
    // 22-EDO is the standard counterexample — famously not a meantone system.
    for (const n of [15, 17, 22, 53]) {
      expect(tempersOut(n, 81, 80)).toBe(false);
    }
  });

  it('test_porcupine_comma_vanishes_in_15_and_22', () => {
    // Porcupine is the 15 & 22 temperament; 250/243 is its defining comma.
    expect(tempersOut(15, 250, 243)).toBe(true);
    expect(tempersOut(22, 250, 243)).toBe(true);
    expect(tempersOut(12, 250, 243)).toBe(false);
    expect(tempersOut(19, 250, 243)).toBe(false);
  });

  it('test_12edo_tempers_out_the_pythagorean_comma', () => {
    // 12 fifths = 7 octaves exactly, which is what closes the circle of fifths.
    expect(tempersOut(12, 531441, 524288)).toBe(true);
    expect(tempersOut(53, 531441, 524288)).toBe(false); // 53 does not close it
  });

  it('test_53edo_tempers_out_the_schisma', () => {
    // 53-EDO is the classic schismatic system.
    expect(tempersOut(53, 32805, 32768)).toBe(true);
  });

  it('test_comma_outside_prime_limit_is_not_tempered_out', () => {
    expect(tempersOut(12, 81, 80, 3)).toBe(false); // 5 not covered by a 3-limit val
  });
});

describe('temperedCommas', () => {
  it('test_12edo_list_includes_syntonic_and_pythagorean', () => {
    const names = temperedCommas(12).map((c) => c.name);
    expect(names.some((s) => s.includes('syntonic'))).toBe(true);
    expect(names.some((s) => s.includes('Pythagorean'))).toBe(true);
  });

  it('test_31edo_is_meantone_but_keeps_the_pythagorean_comma', () => {
    const names = temperedCommas(31).map((c) => c.name);
    expect(names.some((s) => s.includes('syntonic'))).toBe(true);
    expect(names.some((s) => s.includes('Pythagorean'))).toBe(false);
  });

  it('test_every_listed_comma_really_maps_to_zero_steps', () => {
    for (const n of [5, 12, 15, 19, 22, 31, 41, 53]) {
      for (const c of temperedCommas(n)) {
        expect(mapRatioByVal(c.ratio[0], c.ratio[1], patentVal(n, 31))).toBe(0);
      }
    }
  });

  it('test_comma_cents_are_derived_from_their_ratios', () => {
    for (const c of NAMED_COMMA_TABLE) {
      expect(c.cents).toBeCloseTo(1200 * Math.log2(c.ratio[0] / c.ratio[1]), 9);
      expect(c.cents).toBeGreaterThan(0);
      expect(c.cents).toBeLessThan(60); // commas are small by definition
    }
  });
});
