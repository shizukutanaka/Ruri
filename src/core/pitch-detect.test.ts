import { describe, it, expect } from 'vitest';
import { autocorrelationPitch } from './pitch-detect.js';

/** Generate a pure sine wave. */
function makeSine(hz: number, sr: number, durationSec = 1): Float32Array {
  const N = Math.floor(sr * durationSec);
  const s = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    s[i] = Math.sin((2 * Math.PI * hz * i) / sr);
  }
  return s;
}

/** Convert cents difference to semitone error in cents. */
function centsDiff(measured: number, reference: number): number {
  return 1200 * Math.log2(measured / reference);
}

describe('autocorrelationPitch', () => {
  it('test_detects_440hz', () => {
    const samples = makeSine(440, 44100);
    const result = autocorrelationPitch(samples, 44100);
    expect(result).not.toBeNull();
    expect(Math.abs(centsDiff(result!.hz, 440))).toBeLessThan(3);
  });

  it('test_detects_220hz', () => {
    const samples = makeSine(220, 44100);
    const result = autocorrelationPitch(samples, 44100);
    expect(result).not.toBeNull();
    expect(Math.abs(centsDiff(result!.hz, 220))).toBeLessThan(3);
  });

  it('test_silence_returns_null', () => {
    const samples = new Float32Array(44100); // all zeros
    const result = autocorrelationPitch(samples, 44100);
    expect(result).toBeNull();
  });

  it('test_random_noise_low_clarity_or_null', () => {
    // Deterministic pseudo-noise
    const N = 44100;
    const samples = new Float32Array(N);
    let seed = 12345;
    for (let i = 0; i < N; i++) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      samples[i] = (seed >>> 0) / 0x80000000 - 1;
    }
    const result = autocorrelationPitch(samples, 44100);
    // Either null or clarity very low
    if (result !== null) {
      expect(result.clarity).toBeLessThan(0.3);
    } else {
      expect(result).toBeNull();
    }
  });

  it('test_throws_on_zero_sampleRate', () => {
    const samples = new Float32Array(1024);
    expect(() => autocorrelationPitch(samples, 0)).toThrow(RangeError);
  });

  it('test_throws_on_too_few_samples', () => {
    const samples = new Float32Array(32);
    expect(() => autocorrelationPitch(samples, 44100)).toThrow(RangeError);
  });
});

/** Cents between two frequencies. */
function centsBetween(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

describe('autocorrelationPitch — options', () => {
  const sr = 44100;

  it('test_parabolic_interpolation_beats_raw_lag_quantization', () => {
    // The ACF is sampled at integer lags, so without interpolation the closest a
    // 44.1 kHz search can get to 440 Hz is lag 100 => exactly 441 Hz, nearly 4
    // cents sharp. Interpolating the peak brings it inside a tenth of a cent.
    const s = makeSine(440, sr);
    const raw = autocorrelationPitch(s, sr, { parabolicInterp: false });
    expect(raw).not.toBeNull();
    expect(raw!.hz).toBeCloseTo(441, 6);
    expect(centsBetween(raw!.hz, 440)).toBeCloseTo(3.93, 2);

    const interpolated = autocorrelationPitch(s, sr, { parabolicInterp: true });
    expect(interpolated).not.toBeNull();
    expect(Math.abs(centsBetween(interpolated!.hz, 440))).toBeLessThan(0.5);
  });

  it('test_interpolation_is_on_by_default', () => {
    const s = makeSine(440, sr);
    expect(autocorrelationPitch(s, sr)!.hz).toBe(
      autocorrelationPitch(s, sr, { parabolicInterp: true })!.hz,
    );
  });

  it('test_interpolation_cannot_rescue_too_short_a_window', () => {
    // 0.1 s holds only ~11 periods of 110 Hz, and the 1/(N-lag) normalisation
    // biases the tail of the ACF, so both paths land ~4.4 cents flat. Accuracy
    // is a function of window length first and interpolation second.
    const short = makeSine(110, sr, 0.1);
    expect(Math.abs(centsBetween(autocorrelationPitch(short, sr)!.hz, 110))).toBeGreaterThan(4);
    const full = makeSine(110, sr);
    expect(Math.abs(centsBetween(autocorrelationPitch(full, sr)!.hz, 110))).toBeLessThan(1);
  });

  it('test_a_search_window_around_the_true_pitch_finds_it', () => {
    const s = makeSine(440, sr);
    const windowed = autocorrelationPitch(s, sr, { minHz: 400, maxHz: 500 });
    expect(windowed).not.toBeNull();
    expect(Math.abs(centsBetween(windowed!.hz, 440))).toBeLessThan(0.5);
  });

  it('test_a_window_narrower_than_one_lag_step_returns_null', () => {
    // minHz 440 / maxHz 441 collapses to minLag >= maxLag - 1: there is no room
    // to look for a peak, so the detector declines rather than guessing.
    const s = makeSine(440, sr);
    expect(autocorrelationPitch(s, sr, { minHz: 440, maxHz: 441 })).toBeNull();
  });

  it('test_a_window_below_the_fundamental_locks_onto_a_sub_harmonic', () => {
    // A documented limitation of autocorrelation, not a defect: 440/8 = 55 Hz is
    // genuinely a period of a 440 Hz sine, so a 50-60 Hz search reports it — and
    // with full confidence. Set the window from what you expect to measure, not
    // from what you hope to exclude.
    const s = makeSine(440, sr);
    const sub = autocorrelationPitch(s, sr, { minHz: 50, maxHz: 60 });
    expect(sub).not.toBeNull();
    expect(sub!.hz).toBeCloseTo(55, 1);
    expect(sub!.clarity).toBeGreaterThan(0.99);
  });

  it('test_threshold_zero_accepts_the_first_peak', () => {
    const s = makeSine(440, sr);
    const permissive = autocorrelationPitch(s, sr, { threshold: 0 });
    expect(permissive).not.toBeNull();
    expect(Math.abs(centsBetween(permissive!.hz, 440))).toBeLessThan(0.5);
  });

  it('test_a_clean_sine_survives_a_threshold_just_under_one', () => {
    const s = makeSine(440, sr);
    const strict = autocorrelationPitch(s, sr, { threshold: 0.99 });
    expect(strict).not.toBeNull();
    expect(strict!.clarity).toBeGreaterThan(0.99);
  });

  it('test_a_threshold_above_one_can_never_be_met_and_returns_null', () => {
    // clarity is peakVal/meanEnergy, bounded at 1, so threshold 2 rejects even a
    // perfect sine: the local-max scan finds nothing and the global-max fallback
    // fails its own threshold check too.
    const s = makeSine(440, sr);
    expect(autocorrelationPitch(s, sr, { threshold: 2 })).toBeNull();
  });

  it('test_a_signal_below_the_rms_floor_returns_null', () => {
    const quiet = new Float32Array(4096);
    for (let i = 0; i < quiet.length; i++) {
      quiet[i] = 0.0001 * Math.sin((2 * Math.PI * 440 * i) / sr);
    }
    expect(autocorrelationPitch(quiet, sr)).toBeNull();
  });
});
