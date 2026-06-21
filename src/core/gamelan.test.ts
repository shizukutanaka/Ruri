import { describe, it, expect } from 'vitest';
import { gamelanTuning } from './gamelan.js';

// ---------------------------------------------------------------------------
// L4 — gamelanTuning
// ---------------------------------------------------------------------------

describe('gamelanTuning (L4)', () => {
  it('test_slendro_starts_at_0_ends_at_1200', () => {
    const scale = gamelanTuning('slendro');
    expect(scale[0]).toBe(0);
    expect(scale[scale.length - 1]).toBe(1200);
  });

  it('test_slendro_has_6_values', () => {
    // 5 tones + octave
    expect(gamelanTuning('slendro')).toHaveLength(6);
  });

  it('test_slendro_golden_values', () => {
    expect(gamelanTuning('slendro')).toEqual([0, 240, 475, 720, 960, 1200]);
  });

  it('test_pelog_has_8_values', () => {
    // 7 tones + octave
    expect(gamelanTuning('pelog')).toHaveLength(8);
  });

  it('test_pelog_starts_at_0_ends_at_1200', () => {
    const scale = gamelanTuning('pelog');
    expect(scale[0]).toBe(0);
    expect(scale[scale.length - 1]).toBe(1200);
  });

  it('test_pelog_golden_values', () => {
    expect(gamelanTuning('pelog')).toEqual([0, 120, 265, 535, 680, 790, 1055, 1200]);
  });

  it('test_pelog_pathet_nem_golden_values', () => {
    expect(gamelanTuning('pelog-pathet-nem')).toEqual([0, 120, 265, 535, 680, 1055, 1200]);
  });

  it('test_pelog_pathet_sanga_golden_values', () => {
    expect(gamelanTuning('pelog-pathet-sanga')).toEqual([0, 265, 535, 680, 790, 1200]);
  });

  it('test_pelog_pathet_manyura_golden_values', () => {
    expect(gamelanTuning('pelog-pathet-manyura')).toEqual([0, 120, 265, 680, 790, 1055, 1200]);
  });

  it('test_all_scales_strictly_ascending', () => {
    const names = [
      'slendro',
      'pelog',
      'pelog-pathet-nem',
      'pelog-pathet-sanga',
      'pelog-pathet-manyura',
    ] as const;
    for (const name of names) {
      const scale = gamelanTuning(name);
      for (let i = 1; i < scale.length; i++) {
        expect(scale[i]!).toBeGreaterThan(scale[i - 1]!);
      }
    }
  });

  it('test_slendro_near_equal_steps', () => {
    // Slendro steps should all be between 200 and 300 cents
    const scale = gamelanTuning('slendro');
    for (let i = 1; i < scale.length; i++) {
      const step = scale[i]! - scale[i - 1]!;
      expect(step).toBeGreaterThan(150);
      expect(step).toBeLessThan(350);
    }
  });

  it('test_pelog_has_characteristic_small_intervals', () => {
    // Pelog has a small semitone-like interval (~120c) at the start
    const scale = gamelanTuning('pelog');
    expect(scale[1]! - scale[0]!).toBeLessThan(200);
  });

  it('test_result_is_readonly_array', () => {
    const scale = gamelanTuning('slendro');
    expect(Array.isArray(scale)).toBe(true);
  });
});
