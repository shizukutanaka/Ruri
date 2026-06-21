import { describe, it, expect } from 'vitest';
import { euclideanRhythm, rotateEuclidean, rhythmOnsets } from './rhythm.js';

describe('euclideanRhythm', () => {
  it('test_zero_pulses_all_false', () => {
    const r = euclideanRhythm(0, 8);
    expect(r).toHaveLength(8);
    expect(r.every((x) => x === false)).toBe(true);
  });

  it('test_full_pulses_all_true', () => {
    const r = euclideanRhythm(8, 8);
    expect(r).toHaveLength(8);
    expect(r.every((x) => x === true)).toBe(true);
  });

  it('test_3_8_has_exactly_3_hits', () => {
    const r = euclideanRhythm(3, 8);
    expect(r).toHaveLength(8);
    expect(r.filter(Boolean)).toHaveLength(3);
  });

  it('test_5_8_has_exactly_5_hits', () => {
    const r = euclideanRhythm(5, 8);
    expect(r).toHaveLength(8);
    expect(r.filter(Boolean)).toHaveLength(5);
  });

  it('test_7_12_has_exactly_7_hits', () => {
    const r = euclideanRhythm(7, 12);
    expect(r).toHaveLength(12);
    expect(r.filter(Boolean)).toHaveLength(7);
  });

  it('test_throws_on_negative_pulses', () => {
    expect(() => euclideanRhythm(-1, 8)).toThrow(RangeError);
  });

  it('test_throws_on_zero_steps', () => {
    expect(() => euclideanRhythm(0, 0)).toThrow(RangeError);
  });

  it('test_throws_on_pulses_greater_than_steps', () => {
    expect(() => euclideanRhythm(9, 8)).toThrow(RangeError);
  });
});

describe('rotateEuclidean', () => {
  it('test_rotate_by_1', () => {
    const pattern = [true, false, false, true, false, false, true, false];
    const rotated = rotateEuclidean(pattern, 1);
    expect(rotated).toEqual([false, true, false, false, true, false, false, true]);
  });

  it('test_does_not_mutate_input', () => {
    const pattern = [true, false, true, false];
    const copy = [...pattern];
    rotateEuclidean(pattern, 2);
    expect(pattern).toEqual(copy);
  });

  it('test_rotate_by_zero_is_identity', () => {
    const pattern = [true, false, true, false];
    expect(rotateEuclidean(pattern, 0)).toEqual(pattern);
  });

  it('test_empty_pattern', () => {
    expect(rotateEuclidean([], 1)).toEqual([]);
  });
});

describe('rhythmOnsets', () => {
  it('test_basic_onsets', () => {
    const pattern = [true, false, true, false];
    expect(rhythmOnsets(pattern, 250)).toEqual([0, 500]);
  });

  it('test_all_false_returns_empty', () => {
    expect(rhythmOnsets([false, false, false], 100)).toEqual([]);
  });

  it('test_throws_on_zero_stepMs', () => {
    expect(() => rhythmOnsets([true, false], 0)).toThrow(RangeError);
  });

  it('test_throws_on_negative_stepMs', () => {
    expect(() => rhythmOnsets([true, false], -10)).toThrow(RangeError);
  });
});
