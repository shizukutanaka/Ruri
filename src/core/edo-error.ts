/**
 * How well does an equal division approximate just intonation?
 *
 * Implements the two standard measures used in regular temperament theory to
 * answer "is this EDO any good?" — the question that decides whether 19, 31, 41
 * or 53 is the right system for a piece:
 *
 *  - **Relative error**: the error of an approximated interval expressed as a
 *    fraction of one EDO step, rather than in absolute cents. Absolute cents
 *    cannot be compared across EDOs (2c is negligible in 12-EDO, where a step is
 *    100c, but is a third of a step in 200-EDO); relative error can. It lies in
 *    [-0.5, +0.5] by construction, since a target more than half a step from its
 *    nearest step would have a different nearest step.
 *
 *  - **Consistency** (25% criterion): an EDO represents the q-odd-limit
 *    consistently when every odd harmonic up to q lands within 25% of a step.
 *    This is the practical form of the definition "the best approximation of
 *    each interval in a chord also gives the best approximation of every
 *    interval between its notes": if two harmonics are each within 25% of a
 *    step, their difference is within 50%, so the best approximation of the
 *    difference equals the difference of the best approximations — the property
 *    that makes an EDO usable for chords rather than only isolated intervals.
 *
 * References: Xenharmonic Wiki, "Relative interval error" and "Consistency";
 * Erlich, "A Middle Path" (regular temperament theory).
 */
import { CENTS_PER_OCTAVE } from './ratio.js';

/** Threshold defining consistency: within a quarter of an EDO step. */
export const CONSISTENCY_THRESHOLD = 0.25;

const checkEdo = (n: number): void => {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`edo divisions must be a positive integer, got ${n}`);
  }
};

const checkOddLimit = (q: number): void => {
  if (!Number.isInteger(q) || q < 1 || q % 2 === 0) {
    throw new RangeError(`odd limit must be a positive odd integer, got ${q}`);
  }
};

/**
 * Error of `targetCents` in an `n`-EDO, as a signed fraction of one step.
 *
 * Positive means the EDO's nearest step is sharp of the target. Always within
 * [-0.5, +0.5]. Multiply by 100 for the "relative cent"/percent unit used in
 * the literature.
 *
 * @throws {RangeError} if `n` is not a positive integer or `targetCents` is not finite.
 */
export function relativeError(targetCents: number, n: number): number {
  checkEdo(n);
  if (!Number.isFinite(targetCents)) {
    throw new RangeError(`targetCents must be finite, got ${targetCents}`);
  }
  const step = CENTS_PER_OCTAVE / n;
  const steps = targetCents / step;
  // (nearest step − target), so the sign agrees with `errorCents`: positive = EDO sharp.
  return Math.round(steps) - steps;
}

/** How one odd harmonic is represented by an EDO. */
export interface HarmonicError {
  /** The odd harmonic (1, 3, 5, 7, …), i.e. the ratio `harmonic/1`. */
  readonly harmonic: number;
  /** Its just size, octave-reduced into [0, 1200). */
  readonly justCents: number;
  /** Nearest EDO step (octave-reduced degree index). */
  readonly steps: number;
  /** Signed absolute error in cents (EDO minus just). */
  readonly errorCents: number;
  /** Signed error as a fraction of one step, in [-0.5, +0.5]. */
  readonly relativeError: number;
}

/** Octave-reduce a ratio's cents into [0, 1200). */
const reduceCents = (cents: number): number =>
  ((cents % CENTS_PER_OCTAVE) + CENTS_PER_OCTAVE) % CENTS_PER_OCTAVE;

/**
 * Error of every odd harmonic from 1 up to `oddLimit` in an `n`-EDO.
 *
 * Harmonic 1 (the octave-reduced unison/octave) is always exact and is included
 * so the table reads as a complete odd-limit profile.
 *
 * @throws {RangeError} if `n` is not a positive integer or `oddLimit` is not a positive odd integer.
 */
export function edoHarmonicErrors(n: number, oddLimit: number): HarmonicError[] {
  checkEdo(n);
  checkOddLimit(oddLimit);
  const step = CENTS_PER_OCTAVE / n;
  const out: HarmonicError[] = [];
  for (let h = 1; h <= oddLimit; h += 2) {
    const justCents = reduceCents(CENTS_PER_OCTAVE * Math.log2(h));
    const steps = Math.round(justCents / step);
    const errorCents = steps * step - justCents;
    out.push({
      harmonic: h,
      justCents,
      steps,
      errorCents,
      relativeError: relativeError(justCents, n),
    });
  }
  return out;
}

/**
 * Whether an `n`-EDO represents the `oddLimit`-odd-limit consistently: every
 * odd harmonic up to `oddLimit` within {@link CONSISTENCY_THRESHOLD} of a step.
 *
 * @throws {RangeError} on invalid `n` or `oddLimit`.
 */
export function isConsistent(n: number, oddLimit: number): boolean {
  return edoHarmonicErrors(n, oddLimit).every(
    (h) => Math.abs(h.relativeError) < CONSISTENCY_THRESHOLD,
  );
}

/**
 * The largest odd limit an `n`-EDO represents consistently, searching up to
 * `maxOdd`. Returns 1 when even the 3rd harmonic (the fifth) is misrepresented.
 *
 * This is the single number that summarises an EDO's harmonic usefulness:
 * 12-EDO reaches 9, 31-EDO reaches 11, 46-EDO is the smallest reaching 13.
 *
 * @throws {RangeError} on invalid `n` or `maxOdd`.
 */
export function edoConsistencyLimit(n: number, maxOdd = 21): number {
  checkEdo(n);
  checkOddLimit(maxOdd);
  let best = 1;
  for (let q = 3; q <= maxOdd; q += 2) {
    if (!isConsistent(n, q)) break;
    best = q;
  }
  return best;
}
