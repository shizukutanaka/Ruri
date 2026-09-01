/**
 * Choosing the generator — how wide should the fifth actually be?
 *
 * The library can already say which commas a temperament makes vanish
 * (`val.ts`) and which scale sizes its generator supports (`mos-spectrum.ts`).
 * What was missing is the number in between: given that you want meantone, what
 * exact generator should you use? Until now a caller had to hand
 * `generatedTuning` a literal like 700 or 696.578 chosen by hand.
 *
 * A rank-2 temperament maps every just ratio onto `a` periods plus `b`
 * generators, for integers fixed by the temperament. Meantone in the 5-limit
 * maps 3/2 to one generator and 5/4 to four generators less two periods — which
 * is exactly the statement that four fifths, octave-reduced, are a major third.
 * With the period pinned to a pure octave, only the generator is free, so
 * choosing it is a one-dimensional least-squares problem with a closed-form
 * answer:
 *
 *     g* = Σ wᵢ² bᵢ (tᵢ − aᵢ P) / Σ wᵢ² bᵢ²
 *
 * No search, no matrix inversion, no dependency. Weights default to Tenney's
 * `1 / log₂(n·d)`, the standard choice: simpler ratios matter more, because
 * mistuning 3/2 is more audible than mistuning 15/8.
 *
 * The construction is self-checking against known tunings. Optimising for 3/2
 * alone returns the pure fifth, 701.955c. Optimising for 5/4 alone returns
 * 696.578c — quarter-comma meantone, the historical tuning built to make the
 * major third pure — which this module derives by least squares while
 * `temperament.ts` derives it as `3/2 − syntonic/4`. Two unrelated routes,
 * the same number.
 *
 * References: Paul Erlich, "A Middle Path" (regular temperament theory);
 * Xenharmonic Wiki, "Target tunings" and "Tenney-Euclidean temperament
 * measures" (TE/TOP/POTE — this module implements the pure-octave
 * least-squares case those methods generalise).
 */
import { CENTS_PER_OCTAVE } from './ratio.js';

/**
 * One just ratio a temperament aims to approximate, together with how that
 * temperament's mapping reaches it: `periods` periods plus `generators`
 * generators.
 */
export interface TemperamentTarget {
  readonly num: number;
  readonly den: number;
  /** Periods in the temperament's mapping of this ratio (may be negative). */
  readonly periods: number;
  /** Generators in the temperament's mapping of this ratio (may be negative). */
  readonly generators: number;
}

/** How one target fares under a chosen generator. */
export interface TargetError {
  readonly num: number;
  readonly den: number;
  /** The ratio's true size in cents. */
  readonly justCents: number;
  /** Where the temperament actually puts it. */
  readonly temperedCents: number;
  /** Signed error: tempered minus just. Positive means sharp. */
  readonly errorCents: number;
  /** Weight this target carried in the optimisation. */
  readonly weight: number;
}

/** Result of optimising a generator. */
export interface GeneratorTuning {
  readonly generatorCents: number;
  /** Weighted RMS of the target errors, in cents. */
  readonly rmsErrorCents: number;
  /** Largest absolute target error, in cents. */
  readonly maxErrorCents: number;
  readonly targets: readonly TargetError[];
}

/** How much each target counts in the fit. */
export type TargetWeighting = 'tenney' | 'equal';

/** Options for {@link optimalGenerator}. */
export interface OptimalGeneratorOptions {
  /** Period, in cents. Default 1200 (a pure octave). */
  readonly periodCents?: number;
  /**
   * `'tenney'` (default) weights each target by `1 / log₂(n·d)`, so simpler
   * ratios dominate the fit; `'equal'` weights them alike.
   */
  readonly weighting?: TargetWeighting;
}

/**
 * Meantone in the 5-limit: 3/2 is one generator, 5/4 is four generators less
 * two periods. Every meantone tuning shares this mapping and differs only in
 * how wide the generator is.
 */
export const MEANTONE_5_LIMIT: readonly TemperamentTarget[] = [
  { num: 3, den: 2, periods: 0, generators: 1 },
  { num: 5, den: 4, periods: -2, generators: 4 },
];

const centsOf = (num: number, den: number): number => CENTS_PER_OCTAVE * Math.log2(num / den);

function checkTarget(t: TemperamentTarget, i: number): void {
  if (!Number.isInteger(t.num) || t.num < 1 || !Number.isInteger(t.den) || t.den < 1) {
    throw new RangeError(`targets[${i}] must have positive integer num/den, got ${t.num}/${t.den}`);
  }
  if (!Number.isInteger(t.periods) || !Number.isInteger(t.generators)) {
    throw new RangeError(`targets[${i}] mapping must be integers`);
  }
  // Tenney weight is 1/log2(num*den), and the unison's Tenney height is 0, so
  // weighting it divides by zero and every result downstream becomes NaN. A
  // unison is also not a tuning target: there is nothing about 1/1 to approximate.
  if (t.num === t.den) {
    throw new RangeError(`targets[${i}] is the unison ${t.num}/${t.den}, which is not a target`);
  }
}

/**
 * The generator that best approximates `targets`, with the period held pure.
 *
 * Solves the weighted least-squares problem in closed form, so the answer is
 * exact rather than searched. A target reached by zero generators contributes
 * nothing to the choice (nothing about it can be improved by moving the
 * generator) and is reported with its fixed error.
 *
 * @throws {RangeError} if `targets` is empty, any mapping is non-integer, any
 *   ratio is not a positive integer pair, the period is not positive, or no
 *   target constrains the generator at all.
 *
 * @example
 * optimalGenerator([{ num: 5, den: 4, periods: -2, generators: 4 }]).generatorCents;
 * // 696.578… — quarter-comma meantone, the fifth that makes 5/4 pure
 *
 * optimalGenerator(MEANTONE_5_LIMIT).generatorCents;
 * // a compromise fifth: neither 3/2 nor 5/4 pure, both close
 */
export function optimalGenerator(
  targets: readonly TemperamentTarget[],
  opts: OptimalGeneratorOptions = {},
): GeneratorTuning {
  if (targets.length === 0) throw new RangeError('targets must not be empty');
  const period = opts.periodCents ?? CENTS_PER_OCTAVE;
  if (!Number.isFinite(period) || period <= 0) {
    throw new RangeError(`periodCents must be > 0, got ${period}`);
  }
  targets.forEach(checkTarget);

  const weighting = opts.weighting ?? 'tenney';
  const weights = targets.map((t) => (weighting === 'equal' ? 1 : 1 / Math.log2(t.num * t.den)));

  // Closed-form weighted least squares: minimise Σ wᵢ²(aᵢP + bᵢg − tᵢ)² over g.
  let numerator = 0;
  let denominator = 0;
  targets.forEach((t, i) => {
    const w = weights[i] as number;
    const residual = centsOf(t.num, t.den) - t.periods * period;
    numerator += w * w * t.generators * residual;
    denominator += w * w * t.generators * t.generators;
  });
  if (denominator === 0) {
    throw new RangeError('no target uses the generator, so it is unconstrained');
  }
  const generatorCents = numerator / denominator;

  const detail: TargetError[] = targets.map((t, i) => {
    const justCents = centsOf(t.num, t.den);
    const temperedCents = t.periods * period + t.generators * generatorCents;
    return {
      num: t.num,
      den: t.den,
      justCents,
      temperedCents,
      errorCents: temperedCents - justCents,
      weight: weights[i] as number,
    };
  });

  let sumSq = 0;
  let sumW = 0;
  let maxErrorCents = 0;
  detail.forEach((d) => {
    sumSq += d.weight * d.weight * d.errorCents * d.errorCents;
    sumW += d.weight * d.weight;
    maxErrorCents = Math.max(maxErrorCents, Math.abs(d.errorCents));
  });

  return {
    generatorCents,
    rmsErrorCents: Math.sqrt(sumSq / sumW),
    maxErrorCents,
    targets: detail,
  };
}

/**
 * Weighted RMS error of an arbitrary generator against `targets` — for
 * comparing a chosen generator (12-EDO's 700c, say) with the optimum.
 *
 * @throws {RangeError} on the same conditions as {@link optimalGenerator},
 *   except that the generator need not be constrained.
 */
export function generatorError(
  generatorCents: number,
  targets: readonly TemperamentTarget[],
  opts: OptimalGeneratorOptions = {},
): number {
  if (!Number.isFinite(generatorCents)) {
    throw new RangeError(`generatorCents must be finite, got ${generatorCents}`);
  }
  if (targets.length === 0) throw new RangeError('targets must not be empty');
  const period = opts.periodCents ?? CENTS_PER_OCTAVE;
  if (!Number.isFinite(period) || period <= 0) {
    throw new RangeError(`periodCents must be > 0, got ${period}`);
  }
  targets.forEach(checkTarget);

  const weighting = opts.weighting ?? 'tenney';
  let sumSq = 0;
  let sumW = 0;
  targets.forEach((t) => {
    const w = weighting === 'equal' ? 1 : 1 / Math.log2(t.num * t.den);
    const err = t.periods * period + t.generators * generatorCents - centsOf(t.num, t.den);
    sumSq += w * w * err * err;
    sumW += w * w;
  });
  return Math.sqrt(sumSq / sumW);
}
