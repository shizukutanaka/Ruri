import { describe, it, expect } from 'vitest';
import { inducedSpectrum, spectrumBendCents } from './induced-spectrum.js';
import { harmonicSpectrum } from './spectrum.js';
import { chordDissonance } from './dissonance.js';
import { edo } from './tuning.js';

/** Mean dissonance of every step of an n-EDO under a given spectrum. */
const meanStepDissonance = (n: number, spectrum: ReturnType<typeof harmonicSpectrum>): number => {
  let total = 0;
  for (let k = 1; k < n; k++) {
    total += chordDissonance([220, 220 * 2 ** (k / n)], spectrum);
  }
  return total / (n - 1);
};

describe('inducedSpectrum — structure', () => {
  it('test_fundamental_is_always_exactly_1', () => {
    for (const n of [5, 12, 13, 19]) {
      expect(inducedSpectrum(edo(n))[0]!.ratio).toBe(1);
    }
  });

  it('test_every_partial_lands_on_a_pitch_of_the_tuning', () => {
    // The defining property: partials coincide with scale pitches rather than
    // falling between them.
    for (const n of [11, 12, 13, 19]) {
      const tuning = edo(n);
      const step = 1200 / n;
      for (const p of inducedSpectrum(tuning, { partials: 8 })) {
        const cents = 1200 * Math.log2(p.ratio);
        expect(cents / step).toBeCloseTo(Math.round(cents / step), 6);
      }
    }
  });

  it('test_amplitudes_match_the_harmonic_template', () => {
    const induced = inducedSpectrum(edo(13), { partials: 5, rolloff: 0.9 });
    const template = harmonicSpectrum(5, 0.9);
    induced.forEach((p, i) => expect(p.amplitude).toBeCloseTo(template[i]!.amplitude, 12));
  });

  it('test_twelve_edo_partials_stay_close_to_integers', () => {
    // 12-TET approximates the harmonic series well, so barely any bending.
    const induced = inducedSpectrum(edo(12));
    for (const p of induced) {
      expect(Math.abs(p.ratio - Math.round(p.ratio))).toBeLessThan(0.05);
    }
  });

  it('test_works_for_non_octave_periods', () => {
    // Bohlen-Pierce: 13 equal divisions of the 3/1 tritave.
    const tritave = 1200 * Math.log2(3);
    const bp = edo(13, 440, tritave);
    const step = tritave / 13;
    for (const p of inducedSpectrum(bp)) {
      const cents = 1200 * Math.log2(p.ratio);
      expect(cents / step).toBeCloseTo(Math.round(cents / step), 6);
    }
  });

  it('test_rejects_invalid_options', () => {
    expect(() => inducedSpectrum(edo(12), { partials: 0 })).toThrow(RangeError);
    expect(() => inducedSpectrum(edo(12), { rolloff: 0 })).toThrow(RangeError);
    expect(() => inducedSpectrum(edo(12), { rolloff: 1.5 })).toThrow(RangeError);
  });
});

describe('inducedSpectrum — Sethares effect', () => {
  it('test_induced_timbre_is_more_consonant_than_harmonic_in_every_edo_tested', () => {
    // The central claim: a timbre built for a scale makes that scale more
    // consonant than a generic harmonic timbre does.
    for (const n of [11, 12, 13, 19]) {
      const induced = meanStepDissonance(n, inducedSpectrum(edo(n)));
      const harmonic = meanStepDissonance(n, harmonicSpectrum());
      expect(induced).toBeLessThan(harmonic);
    }
  });

  it('test_benefit_is_larger_for_edos_that_fit_the_harmonic_series_poorly', () => {
    // 13-EDO approximates the harmonic series badly and gains much more from a
    // purpose-built timbre than 12-EDO, which already fits it well.
    const gain = (n: number): number =>
      meanStepDissonance(n, harmonicSpectrum()) - meanStepDissonance(n, inducedSpectrum(edo(n)));
    expect(gain(13)).toBeGreaterThan(gain(12));
    expect(spectrumBendCents(edo(13))).toBeGreaterThan(spectrumBendCents(edo(12)));
  });

  it('test_thirteen_edo_under_its_own_timbre_rivals_twelve_edo', () => {
    // Under a harmonic timbre 13-EDO is clearly rougher than 12-EDO; give each
    // its own induced timbre and the gap all but disappears.
    const harmonicGap =
      meanStepDissonance(13, harmonicSpectrum()) - meanStepDissonance(12, harmonicSpectrum());
    const inducedGap =
      meanStepDissonance(13, inducedSpectrum(edo(13))) -
      meanStepDissonance(12, inducedSpectrum(edo(12)));
    expect(harmonicGap).toBeGreaterThan(0);
    expect(inducedGap).toBeLessThan(harmonicGap);
  });
});

describe('spectrumBendCents', () => {
  it('test_is_zero_when_no_bending_is_needed', () => {
    // A 1200-EDO lattice contains every integer harmonic to within half a cent.
    expect(spectrumBendCents(edo(1200))).toBeLessThan(3);
  });

  it('test_is_large_for_tunings_far_from_the_harmonic_series', () => {
    expect(spectrumBendCents(edo(11))).toBeGreaterThan(50);
  });

  it('test_is_non_negative', () => {
    for (const n of [5, 7, 11, 12, 13, 17, 19, 22, 31]) {
      expect(spectrumBendCents(edo(n))).toBeGreaterThanOrEqual(0);
    }
  });
});
