import { describe, it, expect } from 'vitest';
import { fjsName, fjsFormalComma, FJS_RADIUS_OF_TOLERANCE } from './fjs.js';

describe('fjsFormalComma — the master algorithm reproduces the known commas', () => {
  it('test_prime_5_gives_the_syntonic_comma', () => {
    const c = fjsFormalComma(5);
    expect(c.ratio).toBeCloseTo(80 / 81, 12);
    expect(c.cents).toBeCloseTo(-21.5062895967, 6);
    expect(c.fifths).toBe(4); // 5/4 stands in as the Pythagorean M3, 81/64
  });

  it('test_prime_7_gives_the_septimal_comma', () => {
    const c = fjsFormalComma(7);
    expect(c.ratio).toBeCloseTo(63 / 64, 12);
    expect(c.fifths).toBe(-2); // 7/4 stands in as m7, 16/9
  });

  it('test_prime_11_gives_33_over_32', () => {
    expect(fjsFormalComma(11).ratio).toBeCloseTo(33 / 32, 12);
  });

  it('test_prime_13_gives_1053_over_1024', () => {
    expect(fjsFormalComma(13).ratio).toBeCloseTo(1053 / 1024, 12);
  });

  it('test_the_radius_admits_33_over_32_and_excludes_32_over_31', () => {
    // The radius is the mediant of these two precisely so the boundary falls
    // between them — which is what fixes prime 11's comma at 33/32.
    expect(33 / 32).toBeLessThan(FJS_RADIUS_OF_TOLERANCE);
    expect(32 / 31).toBeGreaterThan(FJS_RADIUS_OF_TOLERANCE);
  });

  it('test_every_comma_lies_within_the_radius', () => {
    for (const p of [5, 7, 11, 13, 17, 19, 23, 29, 31]) {
      const c = fjsFormalComma(p);
      expect(c.ratio).toBeLessThan(FJS_RADIUS_OF_TOLERANCE);
      expect(c.ratio).toBeGreaterThan(1 / FJS_RADIUS_OF_TOLERANCE);
    }
  });

  it('test_rejects_invalid_input', () => {
    expect(() => fjsFormalComma(3)).toThrow(RangeError); // 3-limit needs no comma
    expect(() => fjsFormalComma(9)).toThrow(RangeError); // not prime
    expect(() => fjsFormalComma(5, 1)).toThrow(RangeError); // radius must exceed 1
  });
});

describe('fjsName — Pythagorean intervals keep their classical names', () => {
  it('test_three_limit_intervals_take_no_accidental', () => {
    expect(fjsName(1, 1)).toBe('P1');
    expect(fjsName(3, 2)).toBe('P5');
    expect(fjsName(4, 3)).toBe('P4');
    expect(fjsName(9, 8)).toBe('M2');
    expect(fjsName(16, 9)).toBe('m7');
    expect(fjsName(81, 64)).toBe('M3');
    expect(fjsName(2, 1)).toBe('P8');
  });
});

describe('fjsName — higher primes take accidentals', () => {
  it('test_just_intervals_of_the_five_limit', () => {
    expect(fjsName(5, 4)).toBe('M3^5');
    expect(fjsName(6, 5)).toBe('m3_5');
    expect(fjsName(5, 3)).toBe('M6^5');
    expect(fjsName(45, 32)).toBe('A4^5');
  });

  it('test_just_intervals_of_the_seven_and_eleven_limits', () => {
    expect(fjsName(7, 4)).toBe('m7^7');
    expect(fjsName(8, 7)).toBe('M2_7');
    expect(fjsName(11, 8)).toBe('P4^11');
  });

  it('test_the_comma_pair_that_motivates_the_system', () => {
    // Both are major thirds; they differ by the syntonic comma and FJS keeps
    // that visible rather than collapsing them.
    expect(fjsName(81, 64)).toBe('M3');
    expect(fjsName(5, 4)).toBe('M3^5');
    const gap = 1200 * Math.log2(81 / 64) - 1200 * Math.log2(5 / 4);
    expect(gap).toBeCloseTo(21.5062895967, 6);
  });

  it('test_repeated_primes_repeat_the_accidental', () => {
    // 25/16 is two 5-limit steps up, so it carries the accidental twice.
    expect(fjsName(25, 16)).toBe('A5^5^5');
  });

  it('test_numerator_and_denominator_primes_differ_in_direction', () => {
    expect(fjsName(5, 4)).toContain('^5');
    expect(fjsName(8, 5)).toContain('_5');
  });
});

describe('fjsName — structure and validation', () => {
  it('test_names_are_well_formed', () => {
    const pairs: Array<[number, number]> = [
      [1, 1],
      [3, 2],
      [5, 4],
      [7, 4],
      [11, 8],
      [13, 8],
      [15, 8],
      [21, 16],
      [35, 32],
      [9, 7],
      [49, 32],
    ];
    for (const [n, d] of pairs) {
      expect(fjsName(n, d)).toMatch(/^(A+|d+|P|M|m)\d+((\^|_)\d+)*$/);
    }
  });

  it('test_octave_equivalents_keep_the_same_quality_and_accidentals', () => {
    // 5/4 and 5/2 are an octave apart: same quality and accidental, degree +7.
    expect(fjsName(5, 4)).toBe('M3^5');
    expect(fjsName(5, 2)).toBe('M10^5');
  });

  it('test_rejects_invalid_input', () => {
    expect(() => fjsName(0, 1)).toThrow(RangeError);
    expect(() => fjsName(1, 0)).toThrow(RangeError);
    expect(() => fjsName(1.5, 1)).toThrow(RangeError);
    expect(() => fjsName(37, 32)).toThrow(RangeError); // 37 is outside PRIMES
  });
});

describe('fjsName — descending ratios are out of domain', () => {
  it('test_a_ratio_below_one_is_rejected_with_the_inverse_suggested', () => {
    // Before this was checked, the degree arithmetic ran off the bottom of the
    // scale and produced names that do not exist: 8/9 came back as 'm0' (there
    // is no degree zero), 1/2 as 'P-6', 64/81 as 'm-1'. Silent nonsense.
    expect(() => fjsName(8, 9)).toThrow(RangeError);
    expect(() => fjsName(1, 2)).toThrow(RangeError);
    expect(() => fjsName(64, 81)).toThrow(RangeError);
    expect(() => fjsName(4, 5)).toThrow(RangeError);
  });

  it('test_the_error_names_the_inverted_ratio_to_use_instead', () => {
    expect(() => fjsName(8, 9)).toThrow(/pass 9\/8/);
  });

  it('test_an_unreduced_descending_ratio_is_rejected_too', () => {
    expect(() => fjsName(2, 4)).toThrow(RangeError);
  });

  it('test_the_inverses_are_valid_names', () => {
    // Every rejected ratio above has a perfectly good ascending counterpart.
    expect(fjsName(9, 8)).toBe('M2');
    expect(fjsName(2, 1)).toBe('P8');
    expect(fjsName(81, 64)).toBe('M3');
    expect(fjsName(5, 4)).toBe('M3^5');
  });

  it('test_the_unison_is_still_allowed', () => {
    expect(fjsName(1, 1)).toBe('P1');
  });

  it('test_compound_ascending_intervals_keep_counting_up', () => {
    expect(fjsName(4, 1)).toBe('P15'); // two octaves
    expect(fjsName(3, 1)).toBe('P12'); // octave + fifth
  });
});
