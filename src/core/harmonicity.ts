/** Harmonicity via periodicity detection (Stolzenburg-style). Lower periodicity = more harmonic. */
import type { Chord } from './chord.js';
import { realizeChordFreqs } from './chord.js';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
// Guard: (a/gcd)*b can exceed MAX_SAFE_INTEGER for large coprime denominators.
// Return Infinity so relativePeriodicity can detect overflow early and propagate a
// "too inharmonic to quantify" signal instead of silently corrupting integer arithmetic.
const lcm = (a: number, b: number): number => {
  const l = (a / gcd(a, b)) * b;
  return l > Number.MAX_SAFE_INTEGER ? Infinity : l;
};

export interface Fraction {
  readonly num: number;
  readonly den: number;
}

/**
 * Simplest rational approximation of `x > 0` within relative tolerance `tol`
 * (continued-fraction convergents). The tolerance is the tempering allowance:
 * `tol≈0.0136` snaps 12-TET intervals to nearby just ratios (Stolzenburg).
 *
 * NOTE: `maxDen` is a **soft limit**. If no continued-fraction convergent with
 * denominator ≤ maxDen satisfies `tol`, the algorithm returns the first convergent
 * that exceeds maxDen (because it is the closest available approximation). The
 * returned `den` may therefore be slightly above `maxDen`. This is intentional:
 * a very inharmonic ratio that cannot be approximated by any simple fraction
 * propagates a large denominator, which drives `relativePeriodicity` to a high
 * (inharmonic) value — the correct semantic for `rankChords` scoring.
 */
export function approxRatio(x: number, tol = 0.0136, maxDen = 1000): Fraction {
  let a = Math.floor(x);
  let p0 = 1;
  let q0 = 0;
  let p1 = a;
  let q1 = 1;
  let frac = x - a;
  const within = (): boolean => Math.abs(p1 / q1 - x) <= tol * x;
  if (within()) return { num: p1, den: q1 };
  while (frac > 1e-12 && q1 <= maxDen) {
    const r = 1 / frac;
    a = Math.floor(r);
    const p2 = a * p1 + p0;
    const q2 = a * q1 + q0;
    p0 = p1;
    q0 = q1;
    p1 = p2;
    q1 = q2;
    frac = r - a;
    if (within()) return { num: p1, den: q1 };
  }
  return { num: p1, den: q1 };
}

/**
 * Relative periodicity of a set of frequency ratios (smallest = most harmonic).
 * Just major triad 1:5/4:3/2 → 15. 12-TET major triad snaps to the same value.
 *
 * Returns `Infinity` when the LCM of the approximated denominators (or numerators)
 * exceeds `Number.MAX_SAFE_INTEGER` — signalling that the chord is too inharmonic to
 * quantify within the given `maxDen` bound.  Callers such as `rankChords` treat
 * `Infinity` as "worst possible periodicity" and assign a normalised score of 1.
 */
export function relativePeriodicity(ratios: readonly number[], tol = 0.0136): number {
  if (ratios.length === 0) throw new RangeError('ratios must be non-empty');
  const fr = ratios.map((r) => approxRatio(r, tol));

  // Accumulate LCM of denominators step-by-step; bail out on overflow.
  let commonDen = 1;
  for (const f of fr) {
    commonDen = lcm(commonDen, f.den);
    if (commonDen === Infinity) return Infinity;
  }

  const nums = fr.map((f) => f.num * (commonDen / f.den));

  // Accumulate LCM of numerators; bail out on overflow.
  let result = 1;
  for (const n of nums) {
    result = lcm(result, n);
    if (result === Infinity) return Infinity;
  }

  return result / commonDen;
}

/** Periodicity of a chord given member frequencies (normalized to the lowest). */
export function chordPeriodicity(freqs: readonly number[], tol = 0.0136): number {
  const fmin = Math.min(...freqs);
  return relativePeriodicity(
    freqs.map((f) => f / fmin),
    tol,
  );
}

/**
 * Stolzenburg periodicity of a `Chord` object at a given root frequency.
 *
 * Socratic Q93: `chordPeriodicity(freqs, tol)` scores an array of raw frequencies.
 * But going from a `Chord` object to a harmonicity score still requires two steps:
 * `realizeChordFreqs(chord, rootHz)` then `chordPeriodicity(freqs)`. If `Chord` is
 * truly first-class, measuring its harmonicity should be one call.
 *
 * Bridges `Chord → realizeChordFreqs → chordPeriodicity`. Lower return value = more
 * harmonic / simpler integer ratios. Just major triad (1:5/4:3/2) returns 15.
 * Returns `Infinity` for chords too inharmonic to quantify.
 *
 * @param chord - The chord whose harmonicity to measure.
 * @param rootHz - Absolute frequency of the chord root (must be > 0).
 * @param tol - Continued-fraction tolerance (default 0.0136, snaps 12-TET to JI).
 * @returns Relative periodicity ≥ 1, or `Infinity` for maximally inharmonic chords.
 *
 * @throws {RangeError} if `rootHz` ≤ 0 or the chord has no intervals.
 *
 * @example
 * // Just major triad: periodicity = 15 (same as chordPeriodicity([261.63, 327.04, 392.44]))
 * const jiMaj = chordFromRatios('ji-major', [[1,1],[5,4],[3,2]]);
 * harmonicityForChord(jiMaj, 261.63); // → 15
 */
export function harmonicityForChord(chord: Chord, rootHz: number, tol = 0.0136): number {
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(
      `harmonicityForChord: rootHz must be a positive finite number, got ${rootHz}`,
    );
  }
  if (chord.intervals.length === 0) {
    throw new RangeError('harmonicityForChord: chord must have at least one interval');
  }
  const freqs = realizeChordFreqs(chord, rootHz);
  return chordPeriodicity(freqs, tol);
}
