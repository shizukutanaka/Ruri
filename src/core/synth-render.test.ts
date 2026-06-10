import { describe, it, expect } from 'vitest';
import { pluck, mix, normalize, DEFAULT_KS } from './ks-synth.js';
import { strike, DEFAULT_MODAL } from './modal-synth.js';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';

/** Naive DFT magnitude at a target frequency (Goertzel-style single bin). */
function magnitudeAt(wave: Float32Array, freq: number, sampleRate: number): number {
  let re = 0;
  let im = 0;
  const w = (2 * Math.PI * freq) / sampleRate;
  for (let n = 0; n < wave.length; n++) {
    re += (wave[n] as number) * Math.cos(w * n);
    im -= (wave[n] as number) * Math.sin(w * n);
  }
  return Math.sqrt(re * re + im * im) / wave.length;
}

/** Find the dominant frequency by scanning a coarse range. */
function dominantFreq(wave: Float32Array, sampleRate: number, lo: number, hi: number): number {
  let best = lo;
  let bestMag = -1;
  for (let f = lo; f <= hi; f += 1) {
    const m = magnitudeAt(wave, f, sampleRate);
    if (m > bestMag) {
      bestMag = m;
      best = f;
    }
  }
  return best;
}

const SHORT = { ...DEFAULT_KS, seconds: 0.2 };

describe('Karplus-Strong pluck', () => {
  it('test_dominant_frequency_matches_pitch', () => {
    const wave = pluck(220, SHORT);
    const f = dominantFreq(wave, SHORT.sampleRate, 200, 240);
    expect(Math.abs(f - 220)).toBeLessThan(3);
  });

  it('test_microtonal_pitch_reachable', () => {
    // 220 * 2^(50/1200) ≈ 226.4 Hz (a quarter-tone-ish, not on a simple grid)
    const target = 220 * 2 ** (50 / 1200);
    const wave = pluck(target, SHORT);
    const f = dominantFreq(wave, SHORT.sampleRate, 218, 234);
    expect(Math.abs(f - target)).toBeLessThan(3);
  });

  it('test_deterministic_same_seed', () => {
    const a = pluck(220, SHORT);
    const b = pluck(220, SHORT);
    expect(a[1000]).toBe(b[1000]);
  });

  it('test_different_seed_differs', () => {
    const a = pluck(220, { ...SHORT, seed: 1 });
    const b = pluck(220, { ...SHORT, seed: 2 });
    expect(a[100]).not.toBe(b[100]);
  });

  it('test_too_high_freq_throws', () => {
    expect(() => pluck(30000, SHORT)).toThrow(RangeError);
  });

  it('test_output_within_unit_range', () => {
    const wave = pluck(440, SHORT);
    expect(wave.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });
});

describe('mix / normalize', () => {
  it('test_normalize_peaks_at_one', () => {
    const w = new Float32Array([0.1, -0.2, 0.05]);
    const n = normalize(w);
    let peak = 0;
    for (const s of n) peak = Math.max(peak, Math.abs(s));
    expect(peak).toBeCloseTo(1, 6);
  });

  it('test_mix_chord_no_clip', () => {
    const chord = [220, 277, 330].map((f) => pluck(f, SHORT));
    const mixed = mix(chord);
    expect(mixed.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });

  it('test_normalize_silence_stays_silent', () => {
    const z = normalize(new Float32Array([0, 0, 0]));
    expect(z.every((s) => s === 0)).toBe(true);
  });
});

describe('modal synthesis (inharmonic timbre)', () => {
  const SHORT_M = { ...DEFAULT_MODAL, seconds: 0.3 };

  it('test_harmonic_partials_present', () => {
    const wave = strike(220, harmonicSpectrum(3), SHORT_M);
    // fundamental and 2nd harmonic should both carry energy
    const f1 = magnitudeAt(wave, 220, SHORT_M.sampleRate);
    const f2 = magnitudeAt(wave, 440, SHORT_M.sampleRate);
    expect(f1).toBeGreaterThan(0);
    expect(f2).toBeGreaterThan(0);
  });

  it('test_bell_inharmonic_partial_present', () => {
    const wave = strike(220, bellSpectrum(), SHORT_M);
    // bell has a partial at 2.76× → ~607 Hz, NOT at the harmonic 440
    const inharm = magnitudeAt(wave, 220 * 2.76, SHORT_M.sampleRate);
    expect(inharm).toBeGreaterThan(0);
  });

  it('test_normalized_output', () => {
    const wave = strike(220, harmonicSpectrum(4), SHORT_M);
    expect(wave.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });

  it('test_zero_freq_throws', () => {
    expect(() => strike(0, harmonicSpectrum(), SHORT_M)).toThrow(RangeError);
  });
});
