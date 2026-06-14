import { type Spectrum, type RealizedPartial, realizeSpectrum } from './spectrum.js';
import { freqToCents } from './cents.js';

// Sethares sensory-dissonance model constants (Plomp-Levelt based).
const DSTAR = 0.24;
const S1 = 0.0207;
const S2 = 18.96;
const A1 = 3.5;
const A2 = 5.75;

/**
 * Sensory dissonance between two partials (Sethares / Plomp-Levelt).
 * Non-negative (A1 < A2), symmetric, zero when frequencies coincide.
 * High-risk numeric (I7): validated by property + known-minima tests.
 */
export function dissonancePair(a: RealizedPartial, b: RealizedPartial): number {
  const fmin = Math.min(a.freq, b.freq);
  const df = Math.abs(a.freq - b.freq);
  const s = DSTAR / (S1 * fmin + S2);
  const lmin = Math.min(a.amp, b.amp);
  return lmin * (Math.exp(-A1 * s * df) - Math.exp(-A2 * s * df));
}

/** Total dissonance of a set of partials = sum over all unordered pairs. */
export function totalDissonance(partials: readonly RealizedPartial[]): number {
  let d = 0;
  for (let i = 0; i < partials.length; i++) {
    for (let j = i + 1; j < partials.length; j++) {
      d += dissonancePair(partials[i] as RealizedPartial, partials[j] as RealizedPartial);
    }
  }
  return d;
}

/** Dissonance of a chord (member fundamentals) rendered with a given timbre. */
export function chordDissonance(freqs: readonly number[], spectrum: Spectrum): number {
  const all = freqs.flatMap((f) => realizeSpectrum(spectrum, f));
  return totalDissonance(all);
}

/** Sensory-dissonance curve: dyad of `fundamentalHz` against fundamentalHz * ratio. */
export function dissonanceCurve(
  spectrum: Spectrum,
  fundamentalHz: number,
  ratios: readonly number[],
): number[] {
  return ratios.map((r) => chordDissonance([fundamentalHz, fundamentalHz * r], spectrum));
}

/**
 * Indices of strict local minima in a sampled curve (interior points).
 * Index i is a local minimum iff curve[i] is strictly below the nearest differing
 * neighbour on both sides. A flat plateau is reported once at its first index;
 * plateaus touching either end of the array are not reported.
 */
export function localMinima(curve: readonly number[]): number[] {
  const out: number[] = [];
  let i = 1;
  while (i < curve.length - 1) {
    const prev = curve[i - 1] as number;
    const cur = curve[i] as number;
    if (cur < prev) {
      let j = i;
      while (j + 1 < curve.length && (curve[j + 1] as number) === cur) j++;
      if (j + 1 < curve.length && (curve[j + 1] as number) > cur) out.push(i);
      i = j + 1;
    } else {
      i++;
    }
  }
  return out;
}

/** A consonant interval discovered from a timbre's dissonance curve. */
export interface ConsonantInterval {
  /** Frequency ratio relative to the fundamental (e.g. 1.5 ≈ a perfect fifth). */
  readonly ratio: number;
  /** The same interval in cents: 1200·log2(ratio). */
  readonly cents: number;
  /** Sensory dissonance at this interval (lower = more consonant). */
  readonly dissonance: number;
}

export interface ConsonantIntervalsOptions {
  /** Lowest ratio to scan, exclusive of unison artifacts (default 1.0 = unison). */
  readonly minRatio?: number;
  /** Highest ratio to scan (default 2.0 = octave). */
  readonly maxRatio?: number;
  /** Number of samples across [minRatio, maxRatio] (default 1001; >= 3). */
  readonly steps?: number;
  /** Fundamental frequency used to realize the spectrum (default 261.63 Hz ≈ C4). */
  readonly fundamentalHz?: number;
}

/**
 * Consonant intervals FOR A GIVEN TIMBRE — the library's central thesis as one call.
 *
 * Consonance is not a fixed list of Western interval names; it is a property of the
 * instrument's SPECTRUM. This scans the sensory-dissonance curve over
 * [minRatio, maxRatio] and returns its local minima as (ratio, cents, dissonance),
 * ascending by ratio. A harmonic spectrum yields the just intervals (4/3, 3/2, 5/4…);
 * a `bellSpectrum()` yields a DIFFERENT set from the very same scan. Same algorithm,
 * different timbre, different consonances.
 *
 * Reuses `dissonanceCurve` + `localMinima`; the result is a thin, documented mapping
 * back to musical units. For finer resolution near a target interval, raise `steps`
 * or narrow [minRatio, maxRatio].
 */
export function consonantIntervals(
  spectrum: Spectrum,
  opts?: ConsonantIntervalsOptions,
): ConsonantInterval[] {
  const minRatio = opts?.minRatio ?? 1.0;
  const maxRatio = opts?.maxRatio ?? 2.0;
  const steps = opts?.steps ?? 1001;
  const fundamentalHz = opts?.fundamentalHz ?? 261.63;

  // Fail fast (I7): a malformed scan window silently yields empty/garbage minima.
  if (!Number.isFinite(minRatio) || minRatio <= 0) {
    throw new RangeError(`minRatio must be a finite number > 0, got ${minRatio}`);
  }
  if (!Number.isFinite(maxRatio) || maxRatio <= minRatio) {
    throw new RangeError(`maxRatio (${maxRatio}) must be a finite number > minRatio (${minRatio})`);
  }
  if (!Number.isInteger(steps) || steps < 3) {
    throw new RangeError(`steps must be an integer >= 3, got ${steps}`);
  }
  if (!Number.isFinite(fundamentalHz) || fundamentalHz <= 0) {
    throw new RangeError(`fundamentalHz must be a finite number > 0, got ${fundamentalHz}`);
  }

  const ratios = Array.from(
    { length: steps },
    (_, i) => minRatio + ((maxRatio - minRatio) * i) / (steps - 1),
  );
  const curve = dissonanceCurve(spectrum, fundamentalHz, ratios);
  return localMinima(curve).map((i) => {
    const ratio = ratios[i] as number;
    return { ratio, cents: freqToCents(ratio, 1), dissonance: curve[i] as number };
  });
}
