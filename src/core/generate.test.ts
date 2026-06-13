import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generatedScale, isWellFormed, maximallyEven } from './generate.js';
import { approxRatio, relativePeriodicity, chordPeriodicity } from './harmonicity.js';
import { defineTuning, equalTemperament12, edo, degreeToCents } from './tuning.js';
import { cents } from './cents.js';
import { stretchedSpectrum, bellSpectrum } from './spectrum.js';

describe('generatedScale validation', () => {
  it('test_zero_period_throws', () => {
    expect(() => generatedScale(700, 0, 5)).toThrow(RangeError);
  });

  it('test_negative_period_throws', () => {
    expect(() => generatedScale(700, -1200, 5)).toThrow(RangeError);
  });
});

describe('generated (MOS) scales', () => {
  it('test_single_note_scale_not_well_formed', () => {
    // isWellFormed requires n >= 2; a 1-note scale returns false.
    expect(isWellFormed([600], 1200)).toBe(false);
  });

  it('test_pentatonic_by_fifths_is_well_formed', () => {
    const penta = generatedScale(700, 1200, 5);
    expect(penta.length).toBe(5);
    expect(isWellFormed(penta, 1200)).toBe(true);
  });

  it('test_diatonic_by_fifths_is_well_formed', () => {
    expect(isWellFormed(generatedScale(700, 1200, 7), 1200)).toBe(true);
  });

  it('test_whole_tone_is_not_well_formed', () => {
    const wholeTone = [0, 200, 400, 600, 800, 1000];
    expect(isWellFormed(wholeTone, 1200)).toBe(false);
  });

  it('test_non_octave_period_supported', () => {
    // Bohlen-Pierce-like: period = 3/1 ≈ 1902 cents
    const s = generatedScale(443, 1902, 4);
    expect(s.every((c) => c >= 0 && c < 1902)).toBe(true);
  });
});

describe('maximally even sets', () => {
  const stepsCyclic = (idx: readonly number[], c: number): number[] =>
    idx.map((v, i) =>
      i + 1 < idx.length ? (idx[i + 1] as number) - v : c - v + (idx[0] as number),
    );

  it('test_diatonic_is_maximally_even_in_12', () => {
    const set = maximallyEven(12, 7);
    const sizes = new Set(stepsCyclic(set, 12));
    expect([...sizes].sort()).toEqual([1, 2]); // only 1- and 2-step gaps
  });

  it('test_whole_tone_single_step_size', () => {
    expect(new Set(stepsCyclic(maximallyEven(12, 6), 12)).size).toBe(1);
  });

  it('test_invalid_cardinality_throws', () => {
    expect(() => maximallyEven(5, 7)).toThrow(RangeError);
  });
});

describe('harmonicity (Stolzenburg periodicity)', () => {
  it('test_approx_ratio_finds_simple_fractions', () => {
    expect(approxRatio(1.5)).toEqual({ num: 3, den: 2 });
    expect(approxRatio(1.25)).toEqual({ num: 5, den: 4 });
  });

  it('test_just_major_triad_periodicity_15', () => {
    expect(relativePeriodicity([1, 5 / 4, 3 / 2])).toBe(15);
  });

  it('test_12tet_major_triad_snaps_to_just', () => {
    const tet = [1, 2 ** (4 / 12), 2 ** (7 / 12)];
    expect(relativePeriodicity(tet)).toBe(15);
  });

  it('test_cluster_less_harmonic_than_triad', () => {
    const triad = relativePeriodicity([1, 5 / 4, 3 / 2]);
    const cluster = relativePeriodicity([1, 2 ** (1 / 12), 2 ** (2 / 12)]);
    expect(cluster).toBeGreaterThan(triad);
  });

  it('property_periodicity_positive_integer', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 100, max: 1600, noNaN: true, noDefaultInfinity: true }), {
          minLength: 1,
          maxLength: 4,
        }),
        (freqs) => {
          const p = chordPeriodicity(freqs);
          expect(Number.isInteger(p)).toBe(true);
          expect(p).toBeGreaterThanOrEqual(1);
        },
      ),
    );
  });
});

describe('edo validation', () => {
  it('test_non_positive_period_throws', () => {
    expect(() => edo(12, 440, 0)).toThrow(RangeError);
  });

  it('test_negative_period_throws', () => {
    expect(() => edo(12, 440, -1200)).toThrow(RangeError);
  });
});

describe('spectrum helpers', () => {
  it('test_stretched_spectrum_length', () => {
    const s = stretchedSpectrum(6, 0.0004, 0.88);
    expect(s).toHaveLength(6);
  });

  it('test_stretched_spectrum_first_partial_near_one', () => {
    // The first partial (k=1) has ratio ≈ 1 (very slight stretch for k=1).
    const s = stretchedSpectrum(6, 0.0004, 0.88);
    expect((s[0] as { ratio: number }).ratio).toBeCloseTo(1, 3);
  });

  it('test_stretched_spectrum_inharmonic_for_b_nonzero', () => {
    // For k=6, b=0.0004: ratio = 6 * sqrt(1 + 0.0004*36) ≈ 6 * 1.0072 > 6.
    const s = stretchedSpectrum(6, 0.0004, 0.88);
    expect((s[5] as { ratio: number }).ratio).toBeGreaterThan(6);
  });

  it('test_bell_spectrum_length_and_first_partial', () => {
    const b = bellSpectrum();
    expect(b).toHaveLength(6);
    expect((b[0] as { ratio: number }).ratio).toBeCloseTo(1, 5);
  });
});

describe('defineTuning invariants (fail fast)', () => {
  it('test_valid_tuning_passes', () => {
    expect(equalTemperament12(440).degrees.length).toBe(12);
  });

  it('test_empty_degrees_throws', () => {
    expect(() =>
      defineTuning({
        id: 'x',
        name: 'x',
        referenceHz: 440,
        periodCents: 1200,
        degrees: [],
        source: 'theoretical',
      }),
    ).toThrow(RangeError);
  });

  it('test_non_positive_reference_hz_throws', () => {
    expect(() =>
      defineTuning({
        id: 'x',
        name: 'x',
        referenceHz: 0,
        periodCents: 1200,
        degrees: [cents(600)],
        source: 'theoretical',
      }),
    ).toThrow(RangeError);
  });

  it('test_non_positive_period_cents_throws', () => {
    expect(() =>
      defineTuning({
        id: 'x',
        name: 'x',
        referenceHz: 440,
        periodCents: 0,
        degrees: [cents(600)],
        source: 'theoretical',
      }),
    ).toThrow(RangeError);
  });

  it('test_degree_to_cents_empty_tuning_throws', () => {
    // degreeToCents guards against empty degree arrays (line 48).
    // Bypass defineTuning to construct the invalid state directly.
    const emptyTuning = {
      id: 'x',
      name: 'x',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [] as ReturnType<typeof cents>[],
      source: 'theoretical' as const,
    };
    expect(() => degreeToCents(emptyTuning, 0)).toThrow(RangeError);
  });

  it('test_descending_degrees_throw', () => {
    expect(() =>
      defineTuning({
        id: 'bad',
        name: 'bad',
        referenceHz: 440,
        periodCents: 1200,
        degrees: [cents(0), cents(500), cents(300)],
        source: 'theoretical',
      }),
    ).toThrow(RangeError);
  });

  it('test_degree_outside_period_throws', () => {
    expect(() =>
      defineTuning({
        id: 'bad2',
        name: 'bad2',
        referenceHz: 440,
        periodCents: 1200,
        degrees: [cents(0), cents(1300)],
        source: 'theoretical',
      }),
    ).toThrow(RangeError);
  });
});
