import { describe, it, expect } from 'vitest';
import { detectKey } from './key-detect.js';

describe('detectKey', () => {
  it('test_c_major_triad_detects_c_major', () => {
    // C, E, G pitch classes: 0, 4, 7
    const pcWeights = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0];
    const result = detectKey(pcWeights);
    expect(result.tonic).toBe(0);
    expect(result.mode).toBe('major');
  });

  it('test_a_minor_chroma_detects_a_minor', () => {
    // A=1.0, C=0.5, E=0.5 → A minor chord emphasis
    const pcWeights = [0.5, 0, 0, 0, 0.5, 0, 0, 0, 0, 1, 0, 0];
    const result = detectKey(pcWeights);
    expect(result.tonic).toBe(9);
    expect(result.mode).toBe('minor');
  });

  it('test_throws_on_length_not_12', () => {
    expect(() => detectKey([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0])).toThrow(RangeError);
    expect(() => detectKey([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0])).toThrow(RangeError);
  });

  it('test_throws_on_all_zeros', () => {
    expect(() => detectKey([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toThrow(RangeError);
  });

  it('test_ranked_length_is_24', () => {
    const pcWeights = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0];
    const result = detectKey(pcWeights);
    expect(result.ranked).toHaveLength(24);
  });

  it('test_ranked_sorted_descending', () => {
    const pcWeights = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0];
    const result = detectKey(pcWeights);
    for (let i = 0; i < result.ranked.length - 1; i++) {
      expect(result.ranked[i]!.score).toBeGreaterThanOrEqual(result.ranked[i + 1]!.score);
    }
  });

  it('test_best_score_matches_ranked_first', () => {
    const pcWeights = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0];
    const result = detectKey(pcWeights);
    expect(result.score).toBe(result.ranked[0]!.score);
    expect(result.tonic).toBe(result.ranked[0]!.tonic);
    expect(result.mode).toBe(result.ranked[0]!.mode);
  });
});
