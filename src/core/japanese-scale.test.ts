import { describe, it, expect } from 'vitest';
import { japaneseScale, kotoTuning } from './japanese-scale.js';

describe('japaneseScale', () => {
  it('test_in_scale_returns_correct_cents', () => {
    expect(japaneseScale('in')).toEqual([0, 100, 500, 700, 800]);
  });

  it('test_yo_scale_returns_correct_cents', () => {
    expect(japaneseScale('yo')).toEqual([0, 200, 500, 700, 1000]);
  });

  it('test_ritsu_scale_returns_correct_cents', () => {
    expect(japaneseScale('ritsu')).toEqual([0, 200, 500, 700, 900]);
  });

  it('test_miyako_bushi_same_as_in', () => {
    expect(japaneseScale('miyakoBushi')).toEqual(japaneseScale('in'));
  });

  it('test_minyo_scale_returns_correct_cents', () => {
    expect(japaneseScale('minyo')).toEqual([0, 300, 500, 700, 1000]);
  });

  it('test_throws_on_unknown_scale_name', () => {
    // @ts-expect-error testing invalid input
    expect(() => japaneseScale('unknown')).toThrow(RangeError);
  });

  it('test_returns_fresh_copy_each_call', () => {
    const a = japaneseScale('in');
    const b = japaneseScale('in');
    expect(a).not.toBe(b); // different array instances
    expect(a).toEqual(b); // same values
  });
});

describe('kotoTuning', () => {
  it('test_hira_220_returns_length_13', () => {
    const freqs = kotoTuning('hira', 220);
    expect(freqs).toHaveLength(13);
  });

  it('test_first_element_equals_tonic', () => {
    const freqs = kotoTuning('hira', 220);
    expect(freqs[0]).toBe(220);
  });

  it('test_all_tuning_arrays_are_sorted_ascending', () => {
    const tunings: Array<'hira' | 'kumoi' | 'nakazora' | 'akebono' | 'iwato'> = [
      'hira',
      'kumoi',
      'nakazora',
      'akebono',
      'iwato',
    ];
    for (const name of tunings) {
      const freqs = kotoTuning(name, 220);
      for (let i = 0; i < freqs.length - 1; i++) {
        expect(freqs[i]!).toBeLessThan(freqs[i + 1]!);
      }
    }
  });

  it('test_throws_on_tonic_hz_zero', () => {
    expect(() => kotoTuning('hira', 0)).toThrow(RangeError);
  });

  it('test_throws_on_tonic_hz_negative', () => {
    expect(() => kotoTuning('hira', -1)).toThrow(RangeError);
  });

  it('test_throws_on_unknown_tuning_name', () => {
    // @ts-expect-error testing invalid input
    expect(() => kotoTuning('unknown', 220)).toThrow(RangeError);
  });

  it('test_kumoi_220_frequencies_are_correct', () => {
    const freqs = kotoTuning('kumoi', 220);
    // First string: 220 Hz (tonic)
    expect(freqs[0]).toBeCloseTo(220, 5);
    // Second string: 200 cents above tonic = 220 * 2^(200/1200)
    expect(freqs[1]!).toBeCloseTo(220 * Math.pow(2, 200 / 1200), 5);
  });
});
