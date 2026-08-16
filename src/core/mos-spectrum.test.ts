import { describe, it, expect } from 'vitest';
import { mosSizes, mosSpectrum } from './mos-spectrum.js';

const PURE_FIFTH = 1200 * Math.log2(3 / 2); // 701.955c
const GOLDEN = 1200 / 1.618033988749895; // period / phi ≈ 741.64c
const TRITAVE = 1200 * Math.log2(3);

describe('mosSizes — published ladders', () => {
  it('test_pure_fifth_gives_the_classic_mos_ladder', () => {
    // The reason the chain of fifths yields 5-, 7- and 12-note scales.
    expect(mosSizes(PURE_FIFTH)).toEqual([2, 3, 5, 7, 12, 17, 29, 41, 53]);
  });

  it('test_pure_fifth_excludes_non_mos_sizes', () => {
    // Negative oracle: 6, 8, 9 note stacks of fifths are not MOS.
    const sizes = mosSizes(PURE_FIFTH);
    for (const n of [4, 6, 8, 9, 10, 11, 13]) {
      expect(sizes).not.toContain(n);
    }
  });

  it('test_golden_generator_gives_fibonacci_sizes', () => {
    // A generator at period/phi is the classic "most irrational" case; its MOS
    // sizes are the Fibonacci numbers.
    expect(mosSizes(GOLDEN)).toEqual([2, 3, 5, 8, 13, 21, 34, 55]);
  });

  it('test_porcupine_generator_includes_15_and_22', () => {
    // Porcupine is the 15 & 22 temperament, so its generator's ladder must
    // contain both.
    const sizes = mosSizes(163);
    expect(sizes).toContain(15);
    expect(sizes).toContain(22);
  });

  it('test_rational_generator_stops_where_it_closes', () => {
    // An exact 700c fifth closes into 12-EDO at 12 notes, so 12 is not a MOS
    // size — every step would be the same size. Naive two-step-size counting
    // wrongly reports every size here; Myhill's property does not.
    const sizes = mosSizes(700);
    expect(sizes).toEqual([2, 3, 5, 7, 11]);
    expect(sizes).not.toContain(12);
  });
});

describe('mosSizes — behaviour and validation', () => {
  it('test_respects_max_size', () => {
    expect(mosSizes(PURE_FIFTH, 1200, 12)).toEqual([2, 3, 5, 7, 12]);
    expect(mosSizes(PURE_FIFTH, 1200, 12).every((n) => n <= 12)).toBe(true);
  });

  it('test_sizes_are_ascending_and_unique', () => {
    for (const g of [PURE_FIFTH, GOLDEN, 163, 350, 88]) {
      const sizes = mosSizes(g);
      expect([...new Set(sizes)]).toEqual(sizes);
      expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
    }
  });

  it('test_works_with_a_non_octave_period', () => {
    // Bohlen-Pierce territory: the tritave as period.
    const sizes = mosSizes(TRITAVE * 0.38, TRITAVE);
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes[0]).toBeGreaterThanOrEqual(2);
  });

  it('test_rejects_invalid_arguments', () => {
    expect(() => mosSizes(Number.NaN)).toThrow(RangeError);
    expect(() => mosSizes(700, 0)).toThrow(RangeError);
    expect(() => mosSizes(700, 1200, 1)).toThrow(RangeError);
    expect(() => mosSizes(700, 1200, 5.5)).toThrow(RangeError);
  });
});

describe('mosSpectrum', () => {
  it('test_pairs_each_size_with_its_ls_pattern', () => {
    const spectrum = mosSpectrum(PURE_FIFTH, 1200, 12);
    const byName = Object.fromEntries(spectrum.map((e) => [e.size, e.pattern.name]));
    expect(byName[5]).toBe('2L3s'); // pentatonic
    expect(byName[7]).toBe('5L2s'); // diatonic
    // Chromatic: 5 apotomes (113.7c) and 7 limmas (90.2c) — 5×113.685 +
    // 7×90.225 = 1200c.
    expect(byName[12]).toBe('5L7s');
  });

  it('test_sizes_match_mosSizes_exactly', () => {
    for (const g of [PURE_FIFTH, GOLDEN, 163]) {
      expect(mosSpectrum(g).map((e) => e.size)).toEqual(mosSizes(g));
    }
  });

  it('test_step_counts_always_sum_to_the_size', () => {
    // Structural invariant: L + s steps tile the scale exactly.
    for (const g of [PURE_FIFTH, GOLDEN, 163, 350, 88, 271]) {
      for (const entry of mosSpectrum(g)) {
        expect(entry.pattern.large + entry.pattern.small).toBe(entry.size);
        expect(entry.pattern.pattern).toHaveLength(entry.size);
      }
    }
  });

  it('test_both_step_sizes_are_present_in_every_entry', () => {
    // A genuine MOS has two distinct step sizes, never one.
    for (const entry of mosSpectrum(PURE_FIFTH)) {
      expect(entry.pattern.large).toBeGreaterThan(0);
      expect(entry.pattern.small).toBeGreaterThan(0);
    }
  });

  it('test_rejects_invalid_arguments', () => {
    expect(() => mosSpectrum(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => mosSpectrum(700, -1)).toThrow(RangeError);
  });
});
