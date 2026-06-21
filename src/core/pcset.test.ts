import { describe, it, expect } from 'vitest';
import { normalForm, primeForm, intervalVector, forteNumber } from './pcset.js';

describe('normalForm', () => {
  it('test_major_triad_unsorted', () => {
    expect(normalForm([4, 0, 7])).toEqual([0, 4, 7]);
  });

  it('test_major_triad_reversed', () => {
    expect(normalForm([7, 4, 0])).toEqual([0, 4, 7]);
  });

  it('test_single_element', () => {
    expect(normalForm([0])).toEqual([0]);
  });

  it('test_single_nonzero_element_normalizes_to_zero', () => {
    expect(normalForm([5])).toEqual([0]);
  });

  it('test_empty_set', () => {
    expect(normalForm([])).toEqual([]);
  });

  it('test_deduplication', () => {
    // [0, 4, 7, 7] should deduplicate to [0, 4, 7]
    expect(normalForm([0, 4, 7, 7])).toEqual([0, 4, 7]);
  });

  it('test_non_12_modulus', () => {
    // With modulus 19, [0, 6, 12] should give the most compact rotation
    const result = normalForm([0, 6, 12], 19);
    expect(result[0]).toBe(0);
    expect(result).toHaveLength(3);
    // All elements should be within [0, 18]
    expect(result.every((x) => x >= 0 && x < 19)).toBe(true);
  });
});

describe('primeForm', () => {
  it('test_major_triad_prime_form_is_minor', () => {
    // Prime form of major triad [0,4,7] is [0,3,7] (minor triad)
    expect(primeForm([0, 4, 7])).toEqual([0, 3, 7]);
  });

  it('test_minor_triad_prime_form', () => {
    expect(primeForm([0, 3, 7])).toEqual([0, 3, 7]);
  });

  it('test_augmented_triad_prime_form', () => {
    // Augmented triad [0,4,8] is its own prime form (symmetric)
    expect(primeForm([0, 4, 8])).toEqual([0, 4, 8]);
  });
});

describe('intervalVector', () => {
  it('test_major_triad_interval_vector', () => {
    // [0,4,7]: intervals are 4,7,3 → classes 4,5,3 → vector [0,0,1,1,1,0]
    expect(intervalVector([0, 4, 7])).toEqual([0, 0, 1, 1, 1, 0]);
  });

  it('test_chromatic_cluster_interval_vector', () => {
    // [0,1,2]: intervals are 1,2,1 → classes 1,2,1 → vector [2,1,0,0,0,0]
    expect(intervalVector([0, 1, 2])).toEqual([2, 1, 0, 0, 0, 0]);
  });

  it('test_length_is_half_modulus', () => {
    expect(intervalVector([0, 4, 7], 12)).toHaveLength(6);
    expect(intervalVector([0, 4, 7], 19)).toHaveLength(9);
  });
});

describe('forteNumber', () => {
  it('test_major_triad', () => {
    // Major triad [0,4,7]: prime form is [0,3,7] → '3-11A'
    const result = forteNumber([0, 4, 7]);
    expect(result).toMatch(/^3-11/);
  });

  it('test_minor_triad', () => {
    const result = forteNumber([0, 3, 7]);
    expect(result).toMatch(/^3-11/);
  });

  it('test_diminished_triad', () => {
    expect(forteNumber([0, 3, 6])).toBe('3-10');
  });

  it('test_augmented_triad', () => {
    expect(forteNumber([0, 4, 8])).toBe('3-12');
  });

  it('test_out_of_range_element_returns_null', () => {
    expect(forteNumber([1, 2, 13])).toBeNull();
  });

  it('test_negative_element_returns_null', () => {
    expect(forteNumber([-1, 0, 4])).toBeNull();
  });

  it('test_major_diatonic', () => {
    expect(forteNumber([0, 2, 4, 5, 7, 9, 11])).toBe('7-35');
  });

  it('test_unknown_set_returns_null', () => {
    // [0,1,6] = tritone + half step, not in our table
    const result = forteNumber([0, 1, 6]);
    expect(result).toBeNull();
  });
});
