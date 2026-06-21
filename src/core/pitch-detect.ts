/**
 * Time-domain autocorrelation pitch detection with parabolic interpolation.
 * Finds the first significant ACF peak (fundamental period) to avoid
 * sub-harmonic confusion at higher partials.
 */

export interface PitchDetectOptions {
  minHz?: number; // default 50
  maxHz?: number; // default 1500
  threshold?: number; // default 0.1 (peak ratio threshold vs r(0))
  parabolicInterp?: boolean; // default true
}

/**
 * Time-domain autocorrelation pitch detection.
 * Returns null if no pitch detected (signal too weak or out of range).
 * `clarity` ∈ [0, 1], higher = more confident periodic signal.
 */
export function autocorrelationPitch(
  samples: Float32Array,
  sampleRate: number,
  options?: PitchDetectOptions,
): { hz: number; clarity: number } | null {
  if (sampleRate <= 0) throw new RangeError(`sampleRate must be > 0, got ${sampleRate}`);
  if (samples.length < 64) {
    throw new RangeError(`samples.length must be >= 64, got ${samples.length}`);
  }

  const minHz = options?.minHz ?? 50;
  const maxHz = options?.maxHz ?? 1500;
  const threshold = options?.threshold ?? 0.1;
  const parabolicInterp = options?.parabolicInterp ?? true;

  const N = samples.length;

  // r(0) = sum of squares (energy), used to normalize.
  let r0 = 0;
  for (let i = 0; i < N; i++) {
    const s = samples[i]!;
    r0 += s * s;
  }
  if (r0 === 0) return null;
  const rms = Math.sqrt(r0 / N);
  if (rms < 0.001) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(N - 1, Math.ceil(sampleRate / minHz));
  if (minLag >= maxLag - 1) return null;

  // Precompute ACF for the lag range.
  const acf = new Float64Array(maxLag - minLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const limit = N - lag;
    for (let i = 0; i < limit; i++) {
      sum += samples[i]! * samples[i + lag]!;
    }
    acf[lag - minLag] = sum / limit;
  }

  // Find FIRST local maximum above threshold·r(0)/N (per-sample energy).
  // This gives the fundamental period, not a multiple of it.
  const meanEnergy = r0 / N;
  const minPeak = threshold * meanEnergy;

  let peakIdx = -1;
  let peakVal = -Infinity;

  // Scan for the first positive local max above threshold.
  for (let i = 1; i < acf.length - 1; i++) {
    const v = acf[i]!;
    if (v > minPeak && v > acf[i - 1]! && v >= acf[i + 1]!) {
      peakIdx = i;
      peakVal = v;
      break;
    }
  }

  // Fallback: if no clear local max found, use the global maximum (rare).
  if (peakIdx < 0) {
    for (let i = 0; i < acf.length; i++) {
      if (acf[i]! > peakVal) {
        peakVal = acf[i]!;
        peakIdx = i;
      }
    }
    if (peakIdx < 0 || peakVal <= minPeak) return null;
  }

  const bestLag = peakIdx + minLag;

  // Parabolic interpolation around (a, b, c) = (acf[peakIdx-1], acf[peakIdx], acf[peakIdx+1]).
  let refinedLag = bestLag;
  if (parabolicInterp && peakIdx > 0 && peakIdx < acf.length - 1) {
    const a = acf[peakIdx - 1]!;
    const b = acf[peakIdx]!;
    const c = acf[peakIdx + 1]!;
    const denom = 2 * (a - 2 * b + c);
    if (denom !== 0) {
      const offset = (a - c) / denom;
      // Bound the offset to [-1, 1] to prevent runaway from numerical noise.
      const bounded = Math.max(-1, Math.min(1, offset));
      refinedLag = bestLag + bounded;
    }
  }

  if (refinedLag <= 0) return null;

  const hz = sampleRate / refinedLag;
  const clarity = Math.max(0, Math.min(1, peakVal / meanEnergy));

  return { hz, clarity };
}
