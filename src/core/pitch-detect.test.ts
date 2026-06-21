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
