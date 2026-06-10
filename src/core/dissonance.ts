import { type Spectrum, type RealizedPartial, realizeSpectrum } from './spectrum.js';

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
