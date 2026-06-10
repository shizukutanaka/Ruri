import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import { dissonancePair, chordDissonance, dissonanceCurve, localMinima } from './dissonance.js';

const partial = fc.record({
  freq: fc.double({ min: 50, max: 8000, noNaN: true, noDefaultInfinity: true }),
  amp: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
});

describe('dissonance pair (I7 high-risk)', () => {
  it('property_dissonance_non_negative', () => {
    fc.assert(
      fc.property(partial, partial, (a, b) => {
        expect(dissonancePair(a, b)).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it('property_dissonance_symmetric', () => {
    fc.assert(
      fc.property(partial, partial, (a, b) => {
        expect(dissonancePair(a, b)).toBeCloseTo(dissonancePair(b, a), 9);
      }),
    );
  });

  it('test_identical_partials_zero', () => {
    expect(dissonancePair({ freq: 440, amp: 1 }, { freq: 440, amp: 1 })).toBeCloseTo(0, 9);
  });
});

describe('chord dissonance', () => {
  it('property_chord_dissonance_non_negative', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 100, max: 2000, noNaN: true, noDefaultInfinity: true }), {
          minLength: 1,
          maxLength: 5,
        }),
        (freqs) => {
          expect(chordDissonance(freqs, harmonicSpectrum())).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });
});

describe('known minima — harmonic timbre (Sethares oracle)', () => {
  const N = 1001;
  const ratios = Array.from({ length: N }, (_, i) => 1 + i / (N - 1)); // 1.0 .. 2.0
  const curve = dissonanceCurve(harmonicSpectrum(6), 261.63, ratios);
  const minimaRatios = localMinima(curve).map((i) => ratios[i] as number);
  const hasNear = (target: number, tol = 0.02): boolean =>
    minimaRatios.some((r) => Math.abs(r - target) < tol);

  it('test_minimum_near_perfect_fifth_3_2', () => {
    expect(hasNear(1.5)).toBe(true);
  });

  it('test_minimum_near_perfect_fourth_4_3', () => {
    expect(hasNear(4 / 3)).toBe(true);
  });

  it('test_fifth_less_dissonant_than_tritone', () => {
    const spec = harmonicSpectrum(6);
    const fifth = chordDissonance([261.63, 261.63 * 1.5], spec);
    const tritone = chordDissonance([261.63, 261.63 * Math.SQRT2], spec);
    expect(fifth).toBeLessThan(tritone);
  });
});

describe('timbre-dependent consonance (Sethares)', () => {
  it('test_bell_minima_differ_from_harmonic', () => {
    const N = 501;
    const ratios = Array.from({ length: N }, (_, i) => 1 + i / (N - 1));
    const harm = localMinima(dissonanceCurve(harmonicSpectrum(6), 440, ratios));
    const bell = localMinima(dissonanceCurve(bellSpectrum(), 440, ratios));
    expect(bell).not.toEqual(harm);
  });
});
