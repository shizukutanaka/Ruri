/**
 * The MOS spectrum — which scale sizes are worth building from a generator.
 *
 * `generatedTuning(g, p, count)` will build a generated scale of any size, and
 * `tuningMosPattern` reports afterwards whether the result came out MOS. This
 * module answers the question that comes *first* for a scale designer: given
 * this generator, which values of `count` are worth choosing at all?
 *
 * Erv Wilson's "moments of symmetry": as pitches are stacked by a generator,
 * most counts leave an uneven heap of three or more step sizes. At special
 * counts the scale closes into exactly two step sizes, with every generic
 * interval class coming in at most two sizes (Myhill's property). Those counts
 * are the MOS sizes, and they are why the chain of fifths gives scales of 5, 7
 * and 12 notes rather than 6 or 8: the pure fifth's ladder runs
 * 2, 3, 5, 7, 12, 17, 29, 41, 53.
 *
 * Theory says those sizes are the denominators of the (semi)convergents of
 * `g/P`. Rather than reimplement continued fractions, this module **applies the
 * definition**: it generates each candidate size and keeps the ones that are
 * well-formed, reusing the same `isWellFormed` the rest of the library relies
 * on. Prediction and verdict therefore cannot disagree.
 *
 * That choice is load-bearing, not merely tidy. Testing "does the scale have two
 * step sizes?" instead reports *every* size from 2 to 60 as MOS for an exact
 * 700c fifth, because the generator is rational and the scale keeps closing
 * early; Myhill's property rejects those degenerate cases and stops the ladder
 * at 11, where a 12-note stack collapses into 12-EDO exactly.
 *
 * References: Erv Wilson, "Introduction to the Moments of Symmetry" (1975);
 * Xenharmonic Wiki, "Mathematics of MOS" and "Generator ranges of MOS".
 */
import { CENTS_PER_OCTAVE } from './ratio.js';
import { generatedScale, isWellFormed, mosPattern, type MosPattern } from './generate.js';

/** A scale size that yields a MOS, together with its L/s analysis. */
export interface MosSpectrumEntry {
  /** Number of notes per period. */
  readonly size: number;
  /** L/s step pattern of that scale (e.g. `5L2s`, `LLsLLLs`). */
  readonly pattern: MosPattern;
}

function checkArgs(generatorCents: number, periodCents: number, maxSize: number): void {
  if (!Number.isFinite(generatorCents)) {
    throw new RangeError(`generatorCents must be finite, got ${generatorCents}`);
  }
  if (!Number.isFinite(periodCents) || periodCents <= 0) {
    throw new RangeError(`periodCents must be > 0, got ${periodCents}`);
  }
  if (!Number.isInteger(maxSize) || maxSize < 2) {
    throw new RangeError(`maxSize must be an integer >= 2, got ${maxSize}`);
  }
}

/**
 * Every scale size up to `maxSize` at which stacking `generatorCents` produces
 * a MOS (well-formed, Myhill) scale.
 *
 * A pure fifth gives the classic `[2, 3, 5, 7, 12, 17, 29, 41, 53]`; a
 * golden-ratio generator gives the Fibonacci numbers. Sizes where the stack
 * degenerates — duplicate pitches, or a collapse into an equal division — are
 * excluded.
 *
 * @throws {RangeError} on non-finite generator, non-positive period, or `maxSize` < 2.
 *
 * @example
 * mosSizes(701.955); // [2, 3, 5, 7, 12, 17, 29, 41, 53]
 */
export function mosSizes(
  generatorCents: number,
  periodCents: number = CENTS_PER_OCTAVE,
  maxSize = 60,
): number[] {
  checkArgs(generatorCents, periodCents, maxSize);
  const out: number[] = [];
  for (let n = 2; n <= maxSize; n++) {
    let scale: readonly number[];
    try {
      scale = generatedScale(generatorCents, periodCents, n);
    } catch {
      continue; // degenerate at this size — the generator closes on itself
    }
    // Guard against pitches that coincide after period reduction: such a "scale"
    // has fewer distinct degrees than requested and is not a MOS of size n.
    if (new Set(scale.map((c) => Math.round(c * 1000))).size !== n) continue;
    if (isWellFormed([...scale], periodCents)) out.push(n);
  }
  return out;
}

/**
 * The MOS spectrum: every viable size paired with its L/s pattern, so the
 * ladder for a fifth reads 5 → `2L3s`, 7 → `5L2s`, 12 → `7L5s`, and so on.
 *
 * Sizes come from {@link mosSizes}, so each entry's scale is well-formed and
 * therefore has exactly two step sizes — `pattern` is never null.
 *
 * @throws {RangeError} on the same conditions as {@link mosSizes}.
 */
export function mosSpectrum(
  generatorCents: number,
  periodCents: number = CENTS_PER_OCTAVE,
  maxSize = 60,
): MosSpectrumEntry[] {
  return mosSizes(generatorCents, periodCents, maxSize).map((size) => {
    const scale = generatedScale(generatorCents, periodCents, size);
    const pattern = mosPattern([...scale], periodCents);
    if (pattern === null) {
      // Unreachable: well-formedness implies exactly two step sizes. Fail loudly
      // rather than silently if that invariant is ever broken.
      throw new Error(`well-formed scale of size ${size} has no L/s pattern`);
    }
    return { size, pattern };
  });
}
