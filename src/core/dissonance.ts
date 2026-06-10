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

/** Indices of strict local minima in a sampled curve (interior points). */
export function localMinima(curve: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < curve.length - 1; i++) {
    const prev = curve[i - 1] as number;
    const cur = curve[i] as number;
    const next = curve[i + 1] as number;
    if (cur < prev && cur <= next) out.push(i);
  }
  return out;
}
