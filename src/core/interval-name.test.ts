import { describe, it, expect } from 'vitest';
import { edoFifthSteps, edoSharpness, edoIntervalName, edoIntervalNames } from './interval-name.js';

describe('edoFifthSteps / edoSharpness', () => {
  it('test_fifth_step_counts', () => {
    expect(edoFifthSteps(12)).toBe(7);
    expect(edoFifthSteps(19)).toBe(11);
    expect(edoFifthSteps(31)).toBe(18);
    expect(edoFifthSteps(22)).toBe(13);
  });

  it('test_perfect_edos_have_sharpness_zero', () => {
    // Published set: 7, 14, 21, 28 and 35 are the "sharp-0" EDOs, where every
    // interval is perfect because major and minor coincide.
    for (const n of [7, 14, 21, 28, 35]) {
      expect(edoSharpness(n)).toBe(0);
    }
  });

  it('test_superflat_edos_have_negative_sharpness', () => {
    // In these, major is narrower than minor — classical intuition inverts.
    for (const n of [9, 11, 16, 23]) {
      expect(edoSharpness(n)).toBeLessThan(0);
    }
  });

  it('test_twelve_and_nineteen_have_sharpness_one', () => {
    expect(edoSharpness(12)).toBe(1);
    expect(edoSharpness(19)).toBe(1);
  });

  it('test_rejects_invalid_edo', () => {
    expect(() => edoFifthSteps(0)).toThrow(RangeError);
    expect(() => edoSharpness(12.5)).toThrow(RangeError);
  });
});

describe('edoIntervalName — 12-EDO reproduces the classical names', () => {
  it('test_full_twelve_edo_name_list', () => {
    expect(edoIntervalNames(12).map((i) => i.name)).toEqual([
      'P1',
      'm2',
      'M2',
      'm3',
      'M3',
      'P4',
      'A4',
      'P5',
      'm6',
      'M6',
      'm7',
      'M7',
      'P8',
    ]);
  });

  it('test_no_ups_or_downs_needed_in_twelve_edo', () => {
    for (const i of edoIntervalNames(12)) expect(i.ups).toBe(0);
  });

  it('test_degrees_and_qualities_are_reported_separately', () => {
    const fifth = edoIntervalName(12, 7);
    expect(fifth).toMatchObject({ steps: 7, degree: 5, quality: 'P', ups: 0 });
    const minorThird = edoIntervalName(12, 3);
    expect(minorThird).toMatchObject({ degree: 3, quality: 'm' });
  });
});

describe('edoIntervalName — ups and downs appear exactly where needed', () => {
  it('test_nineteen_edo_needs_no_ups_or_downs', () => {
    // Documented property: 19-EDO's sharpness is 1, so classical names suffice.
    for (const i of edoIntervalNames(19)) expect(i.ups).toBe(0);
  });

  it('test_twentytwo_edo_requires_ups_and_downs', () => {
    // Sharpness 3: a sharp is coarser than a step, so some pitches have no
    // classical name and must be reached with arrows.
    const names = edoIntervalNames(22);
    expect(names.some((i) => i.ups !== 0)).toBe(true);
    expect(edoIntervalName(22, 6).name).toBe('^m3'); // upminor third
    expect(edoIntervalName(22, 7).name).toBe('vM3'); // downmajor third
  });

  it('test_perfect_edo_has_no_minor_intervals', () => {
    // 7-EDO: major and minor coincide, so nothing is spelled minor.
    const qualities = edoIntervalNames(7).map((i) => i.quality);
    expect(qualities).not.toContain('m');
    expect(edoIntervalNames(7).map((i) => i.name)).toEqual([
      'P1',
      'M2',
      'M3',
      'P4',
      'P5',
      'M6',
      'M7',
      'P8',
    ]);
  });

  it('test_augmented_and_diminished_only_when_a_sharp_is_one_step', () => {
    // Present in 12/19-EDO (sharpness 1); absent in 22-EDO, where arrows take over.
    expect(edoIntervalNames(12).some((i) => i.quality === 'A')).toBe(true);
    expect(edoIntervalNames(19).some((i) => i.quality === 'A')).toBe(true);
    for (const i of edoIntervalNames(22)) {
      expect(i.quality === 'A' || i.quality === 'd').toBe(false);
    }
  });
});

describe('edoIntervalName — structure', () => {
  it('test_unison_and_octave_are_always_perfect', () => {
    for (const n of [5, 7, 12, 13, 19, 22, 31, 41]) {
      expect(edoIntervalName(n, 0).name).toBe('P1');
      expect(edoIntervalName(n, n).name).toBe('P8');
    }
  });

  it('test_every_step_of_many_edos_gets_a_well_formed_name', () => {
    for (const n of [5, 7, 9, 11, 12, 13, 16, 17, 19, 22, 24, 31, 41, 53]) {
      const names = edoIntervalNames(n);
      expect(names).toHaveLength(n + 1);
      names.forEach((i, s) => {
        expect(i.steps).toBe(s);
        expect(i.degree).toBeGreaterThanOrEqual(1);
        expect(i.degree).toBeLessThanOrEqual(8);
        expect(i.name).toMatch(/^[\^v]*[PMmAd][1-8]$/);
      });
    }
  });

  it('test_rejects_out_of_range_steps', () => {
    expect(() => edoIntervalName(12, -1)).toThrow(RangeError);
    expect(() => edoIntervalName(12, 13)).toThrow(RangeError);
    expect(() => edoIntervalName(12, 1.5)).toThrow(RangeError);
  });
});
