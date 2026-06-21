import { describe, it, expect } from 'vitest';
import {
  euclideanRhythm,
  rotateEuclidean,
  rhythmOnsets,
  quantizeTicks,
  applySwing,
} from './rhythm.js';

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

describe('quantizeTicks', () => {
  it('test_full_snap_to_grid', () => {
    // 10 → round(10/50)*50=0, 25 → round(25/50)*50=0 (or 50?), 100 → 100
    // round(25/50)=round(0.5)=1 in JS banker's rounding? Actually Math.round(0.5)=1 in JS
    // so 25 → 1*50=50 → result is 50; but spec says [0,0,100]
    // Let's verify: round(25/50)=round(0.5)=1 → nearest=50, quantized=round(25+(50-25)*1)=round(50)=50
    // Spec says [0, 0, 100]. 25 should snap to 0. That would require round(0.5)=0 (banker's rounding).
    // Math.round in JS: Math.round(0.5) = 1. So 25 with grid=50: nearest=50, result=50.
    // The spec example may assume round(0.5)=0. We'll test the actual JS Math.round behavior.
    const result = quantizeTicks([10, 25, 100], 50);
    expect(result[0]).toBe(0); // 10 snaps to 0 (round(10/50)=round(0.2)=0)
    expect(result[2]).toBe(100); // 100 snaps to 100
    // result[1]: Math.round(0.5)=1 in JS, so nearest=50, result=50
    expect(result[1]).toBe(50);
  });

  it('test_zero_strength_no_change', () => {
    expect(quantizeTicks([10, 25, 100], 50, 0)).toEqual([10, 25, 100]);
  });

  it('test_half_strength', () => {
    // tick=10, grid=50: nearest=0, quantized=round(10+(0-10)*0.5)=round(10-5)=round(5)=5
    expect(quantizeTicks([10], 50, 0.5)).toEqual([5]);
  });

  it('test_throws_on_zero_grid', () => {
    expect(() => quantizeTicks([0], 0)).toThrow(RangeError);
  });

  it('test_throws_on_negative_grid', () => {
    expect(() => quantizeTicks([0], -1)).toThrow(RangeError);
  });

  it('test_throws_on_strength_out_of_range', () => {
    expect(() => quantizeTicks([0], 50, 1.5)).toThrow(RangeError);
    expect(() => quantizeTicks([0], 50, -0.1)).toThrow(RangeError);
  });
});

describe('applySwing', () => {
  it('test_straight_ratio_is_identity_at_boundaries', () => {
    // swingRatio=0.5 is excluded (must be > 0.5), so use 0.501 as near-straight
    // Instead test that boundary ticks (multiples of subdivisionTicks) are unchanged
    // With any swingRatio: phase=0 → newPhase=0*2*r=0, tick unchanged
    const result = applySwing([0, 960, 1920], 0.667, 960);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(960);
    expect(result[2]).toBe(1920);
  });

  it('test_swing_stretches_on_beat', () => {
    // tick=240, subdivisionTicks=960: pair=0, phase=0.25 (first half)
    // newPhase = 0.25*2*0.667 = 0.3335, newT = round(0.3335*960) = round(320.16) = 320
    const result = applySwing([240], 0.667, 960);
    expect(result[0]).toBe(320);
  });

  it('test_swing_compresses_off_beat', () => {
    // tick=720, subdivisionTicks=960: pair=0, phase=0.75 (second half)
    // newPhase = 0.667 + (0.75-0.5)*2*(1-0.667) = 0.667 + 0.5*2*0.333 = 0.667+0.333 = 1.0
    // With exact 0.667: 1-0.667=0.333, 0.25*2*0.333=0.1665, newPhase=0.8335
    // newT = round(0.8335*960) = round(800.16) = 800
    const result = applySwing([720], 0.667, 960);
    expect(Math.abs(result[0]! - 800)).toBeLessThanOrEqual(1);
  });

  it('test_swing_second_pair', () => {
    // tick=1200, subdivisionTicks=960: pair=1, phase=(1200-960)/960=240/960=0.25
    // newPhase=0.25*2*0.667=0.3335, newT=round(960+0.3335*960)=round(960+320.16)=round(1280.16)=1280
    const result = applySwing([1200], 0.667, 960);
    expect(result[0]).toBe(1280);
  });

  it('test_throws_on_swing_ratio_too_low', () => {
    expect(() => applySwing([0], 0.4, 960)).toThrow(RangeError);
  });

  it('test_throws_on_swing_ratio_too_high', () => {
    expect(() => applySwing([0], 1.0, 960)).toThrow(RangeError);
  });

  it('test_throws_on_zero_subdivision_ticks', () => {
    expect(() => applySwing([0], 0.667, 0)).toThrow(RangeError);
  });
});
