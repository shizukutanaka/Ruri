import { describe, it, expect } from 'vitest';
import { pluck, mix, normalize, DEFAULT_KS, pluckChord } from './ks-synth.js';
import { strike, DEFAULT_MODAL, strikeChord } from './modal-synth.js';
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

describe('pluck – validation', () => {
  it('test_frequency_too_high_for_sample_rate_throws', () => {
    // N = floor(sampleRate / freqHz) < 2 when freqHz > sampleRate/2.
    expect(() => pluck(25000, { ...DEFAULT_KS, sampleRate: 44100 })).toThrow(RangeError);
  });
});

describe('pluck – additional validation', () => {
  it('test_zero_freq_throws', () => {
    expect(() => pluck(0, DEFAULT_KS)).toThrow(RangeError);
  });
});

describe('strike – Nyquist skip', () => {
  it('test_partials_above_nyquist_are_skipped', () => {
    // Fundamental 12000 Hz: 3rd partial (36 kHz) exceeds Nyquist (22050 Hz) → skip branch.
    const wave = strike(12000, harmonicSpectrum(6), { ...DEFAULT_MODAL, sampleRate: 44100 });
    expect(wave.length).toBeGreaterThan(0);
    expect(Array.from(wave).every(Number.isFinite)).toBe(true);
  });
});

// Q47: 和音合成は1コールか？ — pluckChord / strikeChord が閉じるパイプライン
describe('pluckChord — chord synthesis in one call (Q47)', () => {
  const SHORT = { ...DEFAULT_KS, seconds: 0.2 };

  it('test_pluck_chord_output_within_unit_range', () => {
    const wave = pluckChord([220, 277, 330], SHORT);
    expect(wave.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });

  it('test_pluck_chord_length_matches_opts_seconds', () => {
    const wave = pluckChord([220, 330], SHORT);
    expect(wave.length).toBe(Math.floor(SHORT.sampleRate * SHORT.seconds));
  });

  it('test_pluck_chord_single_note_is_normalized', () => {
    const chord = pluckChord([220], SHORT);
    const single = normalize(pluck(220, SHORT));
    // Both should be peak-normalized (peak ≈ 1); waveform content is the same.
    let peakChord = 0;
    for (const s of chord) peakChord = Math.max(peakChord, Math.abs(s));
    expect(peakChord).toBeCloseTo(1, 2);
    expect(single.length).toBe(chord.length);
  });

  it('test_pluck_chord_empty_freqs_throws', () => {
    expect(() => pluckChord([], SHORT)).toThrow(RangeError);
  });

  it('test_pluck_chord_microtonal_pitch_accepted', () => {
    // 220 * 2^(50/1200) ≈ 226.4 Hz (quarter-tone-ish microtonal interval)
    const f1 = 220;
    const f2 = 220 * 2 ** (50 / 1200);
    expect(() => pluckChord([f1, f2], SHORT)).not.toThrow();
    const wave = pluckChord([f1, f2], SHORT);
    expect(wave.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });
});

describe('strikeChord — modal chord synthesis in one call (Q47)', () => {
  const SHORT_M = { ...DEFAULT_MODAL, seconds: 0.2 };

  it('test_strike_chord_output_within_unit_range', () => {
    const wave = strikeChord([220, 330, 440], harmonicSpectrum(4), SHORT_M);
    expect(wave.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });

  it('test_strike_chord_length_matches_opts_seconds', () => {
    const wave = strikeChord([220, 330], harmonicSpectrum(), SHORT_M);
    expect(wave.length).toBe(Math.floor(SHORT_M.sampleRate * SHORT_M.seconds));
  });

  it('test_strike_chord_empty_freqs_throws', () => {
    expect(() => strikeChord([], harmonicSpectrum(), SHORT_M)).toThrow(RangeError);
  });

  it('test_strike_chord_bell_timbre_works', () => {
    const wave = strikeChord([220, 330], bellSpectrum(), SHORT_M);
    expect(wave.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
    expect(Array.from(wave).every(Number.isFinite)).toBe(true);
  });

  it('test_strike_chord_single_note_is_finite_and_normalized', () => {
    const wave = strikeChord([440], harmonicSpectrum(3), SHORT_M);
    let peak = 0;
    for (const s of wave) peak = Math.max(peak, Math.abs(s));
    expect(peak).toBeCloseTo(1, 2);
  });
});
