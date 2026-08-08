/**
 * Harmonic entropy — consonance as certainty of ratio interpretation.
 *
 * This is a third, independent axis of consonance alongside the two the library
 * already has, and it measures something neither of them does:
 *
 *  - **Roughness** (`dissonance.ts`, Plomp-Levelt/Sethares) — beating between
 *    partials. Depends on the *timbre*.
 *  - **Periodicity** (`harmonicity.ts`, Stolzenburg) — how quickly the combined
 *    waveform repeats. Depends on the *exact* ratio, and is brittle: 3/2 is
 *    maximally periodic but 300/201 is not, though no ear could tell them apart.
 *  - **Harmonic entropy** (this module, Erlich) — how *confidently* the ear can
 *    interpret an interval as one simple ratio rather than several competing
 *    ones. Tolerant of mistuning by construction, and **timbre-independent**:
 *    it takes no spectrum, because it models pitch interpretation rather than
 *    the interaction of partials.
 *
 * The construction: place a Gaussian around the heard interval, use it to weight
 * every candidate simple ratio nearby, normalise those weights into a
 * probability distribution, and take its Shannon entropy. An interval sitting on
 * an isolated simple ratio yields a peaked distribution and low entropy — it is
 * heard unambiguously. An interval in a crowded region matches many complex
 * ratios weakly, giving a flat distribution and high entropy.
 *
 * Because consonance is multi-factorial (see McBride 2025's review of the
 * roughness/harmonicity/familiarity decomposition), having these axes separate
 * and individually inspectable is deliberate: the library scores them, and does
 * not collapse them into a single aesthetic verdict.
 *
 * Reference: Paul Erlich, harmonic entropy (Xenharmonic Wiki, "Harmonic
 * Entropy"; Tonalsoft encyclopedia).
 */
import { CENTS_PER_OCTAVE } from './ratio.js';

/** One candidate ratio in the basis set, with its precomputed size and weight. */
export interface EntropyBasisRatio {
  readonly num: number;
  readonly den: number;
  readonly cents: number;
  /** Prior weight — larger for simpler ratios (they occupy more interval space). */
  readonly weight: number;
}

/** Options for {@link harmonicEntropy}. */
export interface HarmonicEntropyOptions {
  /**
   * Spread of the Gaussian point-spread function, in cents: how precisely the
   * ear is assumed to resolve pitch. Default 17 (≈1%), the usual choice.
   */
  readonly spreadCents?: number;
  /**
   * Largest Tenney height (numerator × denominator) admitted into the basis
   * set. Default 10000, matching standard implementations. Higher values add
   * ever more complex ratios and cost time without changing the minima.
   */
  readonly maxTenneyHeight?: number;
  /** Widest interval the basis must cover, in cents. Default 1200 (one octave). */
  readonly maxCents?: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Candidate ratios for the entropy calculation: every reduced fraction within
 * `maxCents` whose Tenney height does not exceed `maxTenneyHeight`.
 *
 * Weights are `1/sqrt(num·den)`, the standard Tenney-height weighting. It stands
 * in for the width of each ratio's "slice" of interval space in Erlich's
 * mediant formulation — simple ratios own wide slices, complex ones are crowded.
 *
 * @throws {RangeError} if `maxTenneyHeight` < 1 or `maxCents` <= 0.
 */
export function entropyBasis(
  maxTenneyHeight = 10000,
  maxCents = CENTS_PER_OCTAVE,
): EntropyBasisRatio[] {
  if (!Number.isFinite(maxTenneyHeight) || maxTenneyHeight < 1) {
    throw new RangeError(`maxTenneyHeight must be >= 1, got ${maxTenneyHeight}`);
  }
  if (!Number.isFinite(maxCents) || maxCents <= 0) {
    throw new RangeError(`maxCents must be > 0, got ${maxCents}`);
  }
  const maxRatio = 2 ** (maxCents / CENTS_PER_OCTAVE);
  const out: EntropyBasisRatio[] = [];
  for (let den = 1; den * den <= maxTenneyHeight; den++) {
    for (let num = den; num * den <= maxTenneyHeight; num++) {
      if (num / den > maxRatio) break;
      if (gcd(num, den) !== 1) continue;
      out.push({
        num,
        den,
        cents: CENTS_PER_OCTAVE * Math.log2(num / den),
        weight: 1 / Math.sqrt(num * den),
      });
    }
  }
  return out;
}

/**
 * Harmonic entropy of an interval, in bits. Lower means the interval is heard
 * more unambiguously as a single simple ratio, i.e. more consonant.
 *
 * Pass a precomputed `basis` when evaluating many intervals — building it is the
 * expensive part.
 *
 * @param cents - Interval size in cents (must lie within the basis's range).
 * @throws {RangeError} if `cents` is not finite or `spreadCents` <= 0.
 *
 * @example
 * const b = entropyBasis();
 * harmonicEntropy(701.955, {}, b); // the just fifth — a deep minimum
 * harmonicEntropy(550, {}, b);     // no simple ratio nearby — much higher
 */
export function harmonicEntropy(
  cents: number,
  opts: HarmonicEntropyOptions = {},
  basis?: readonly EntropyBasisRatio[],
): number {
  if (!Number.isFinite(cents)) throw new RangeError(`cents must be finite, got ${cents}`);
  const spread = opts.spreadCents ?? 17;
  if (!Number.isFinite(spread) || spread <= 0) {
    throw new RangeError(`spreadCents must be > 0, got ${spread}`);
  }
  const set =
    basis ?? entropyBasis(opts.maxTenneyHeight ?? 10000, opts.maxCents ?? CENTS_PER_OCTAVE);
  // Weight every candidate ratio by the Gaussian, then normalise to probabilities.
  const weights: number[] = [];
  let total = 0;
  for (const r of set) {
    const z = (cents - r.cents) / spread;
    const w = r.weight * Math.exp(-0.5 * z * z);
    weights.push(w);
    total += w;
  }
  if (total <= 0) return 0; // nothing nearby: degenerate, treat as no information
  let entropy = 0;
  for (const w of weights) {
    const p = w / total;
    if (p > 1e-12) entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Harmonic entropy sampled across a list of interval sizes, reusing one basis.
 *
 * Pair with `localMinima` (`dissonance.ts`) to locate the consonant intervals a
 * listener would hear most definitely — they land on 5/4, 4/3, 3/2, 5/3 and so
 * on, without any spectrum being supplied.
 *
 * @throws {RangeError} on invalid options or a non-finite entry in `centsList`.
 */
export function harmonicEntropyCurve(
  centsList: readonly number[],
  opts: HarmonicEntropyOptions = {},
): number[] {
  const basis = entropyBasis(opts.maxTenneyHeight ?? 10000, opts.maxCents ?? CENTS_PER_OCTAVE);
  return centsList.map((c) => harmonicEntropy(c, opts, basis));
}
