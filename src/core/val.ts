/**
 * Vals and tempered-out commas — how an equal division maps just intonation.
 *
 * A **val** is the list of step-counts an EDO assigns to each prime harmonic.
 * The *patent val* takes the nearest step-count for every prime: 17-EDO maps
 * 2/1 to 17 steps, 3/1 to 27 and 5/1 to 39, written `<17 27 39]`. Because every
 * just interval factors into primes, the val determines how *any* ratio is
 * approximated — map the primes and the rest follows by addition.
 *
 * That gives an exact test for the defining question of regular temperament
 * theory: **which commas does this EDO temper out?** A comma vanishes when the
 * val maps it to zero steps, meaning the two intervals it separates become the
 * same pitch. This is what identifies a temperament — an EDO that tempers out
 * the syntonic comma (81/80) is a meantone system, so its four stacked fifths
 * land on a usable major third; one that tempers out 250/243 is porcupine.
 *
 * Unlike {@link nearestComma}, which matches a cents value against a table by
 * proximity, this module answers the structural question exactly: it is integer
 * arithmetic on prime exponents, with no tolerance parameter.
 *
 * Reference: Xenharmonic Wiki, "Val" / "Patent val"; Erlich, "A Middle Path".
 */
import { CENTS_PER_OCTAVE } from './ratio.js';

/** Primes addressable by this module, in order (2-limit through 31-limit). */
export const PRIMES: readonly number[] = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

const checkEdo = (n: number): void => {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`edo divisions must be a positive integer, got ${n}`);
  }
};

/** Index of `primeLimit` in {@link PRIMES}; throws if it is not a supported prime. */
function primeLimitIndex(primeLimit: number): number {
  const idx = PRIMES.indexOf(primeLimit);
  if (idx < 0) {
    throw new RangeError(`primeLimit must be one of ${PRIMES.join(', ')}, got ${primeLimit}`);
  }
  return idx;
}

/**
 * The patent val of an `n`-EDO up to `primeLimit`: the nearest step-count for
 * each prime harmonic, e.g. `patentVal(17, 5)` → `[17, 27, 39]` (`<17 27 39]`).
 *
 * @throws {RangeError} if `n` is not a positive integer or `primeLimit` is not a supported prime.
 */
export function patentVal(n: number, primeLimit = 5): number[] {
  checkEdo(n);
  const last = primeLimitIndex(primeLimit);
  return PRIMES.slice(0, last + 1).map((p) => Math.round(n * Math.log2(p)));
}

/** Format a val in the conventional bra notation, e.g. `<12 19 28]`. */
export function formatVal(val: readonly number[]): string {
  return `<${val.join(' ')}]`;
}

/**
 * Prime factorization of a positive integer as [primeIndex, exponent] pairs.
 * Returns `null` if `n` has a prime factor outside {@link PRIMES}.
 */
function factorize(n: number): Array<[number, number]> | null {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`factorize expects a positive integer, got ${n}`);
  }
  let rest = n;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < PRIMES.length && rest > 1; i++) {
    const p = PRIMES[i] as number;
    let exp = 0;
    while (rest % p === 0) {
      rest /= p;
      exp++;
    }
    if (exp > 0) out.push([i, exp]);
  }
  return rest === 1 ? out : null;
}

/**
 * How many EDO steps `val` assigns to the ratio `num/den`.
 *
 * Returns `null` when the ratio involves a prime the val does not cover (either
 * beyond {@link PRIMES} or beyond the val's length) — the mapping is undefined
 * rather than zero, and conflating the two would silently report unrelated
 * commas as tempered out.
 *
 * @throws {RangeError} if `num` or `den` is not a positive integer.
 */
export function mapRatioByVal(num: number, den: number, val: readonly number[]): number | null {
  const fn = factorize(num);
  const fd = factorize(den);
  if (fn === null || fd === null) return null;
  let steps = 0;
  for (const [idx, exp] of fn) {
    const v = val[idx];
    if (v === undefined) return null;
    steps += exp * v;
  }
  for (const [idx, exp] of fd) {
    const v = val[idx];
    if (v === undefined) return null;
    steps -= exp * v;
  }
  return steps;
}

/**
 * Whether an `n`-EDO tempers out the comma `num/den` — i.e. its patent val maps
 * the comma to zero steps, collapsing the two intervals it separates.
 *
 * Returns `false` (not an error) when the comma lies outside the val's prime
 * limit: an EDO cannot temper out an interval it does not map.
 *
 * @throws {RangeError} on invalid `n`, `num`, `den`, or `primeLimit`.
 *
 * @example
 * tempersOut(12, 81, 80); // true — 12-EDO is a meantone system
 * tempersOut(22, 81, 80); // false — 22-EDO is not meantone
 * tempersOut(22, 250, 243); // true — 22-EDO is porcupine
 */
export function tempersOut(n: number, num: number, den: number, primeLimit = 31): boolean {
  const val = patentVal(n, primeLimit);
  return mapRatioByVal(num, den, val) === 0;
}

/** A comma an EDO tempers out, with its size and (where known) its name. */
export interface TemperedComma {
  readonly name: string;
  readonly ratio: readonly [number, number];
  readonly cents: number;
}

/**
 * Commas of musical interest that an EDO tempers out, drawn from a table of
 * named commas that each identify a well-known temperament family.
 *
 * @throws {RangeError} if `n` is not a positive integer.
 */
export function temperedCommas(n: number): TemperedComma[] {
  checkEdo(n);
  return COMMA_TABLE.filter((c) => tempersOut(n, c.ratio[0], c.ratio[1]));
}

/**
 * Named commas, each the defining comma of a temperament family. Cents are
 * derived from the ratio rather than stored, so they cannot drift out of sync.
 */
const RAW_COMMAS: ReadonlyArray<{ name: string; ratio: readonly [number, number] }> = [
  { name: 'syntonic comma (meantone)', ratio: [81, 80] },
  { name: 'Pythagorean comma', ratio: [531441, 524288] },
  { name: 'schisma', ratio: [32805, 32768] },
  { name: 'diaschisma', ratio: [2048, 2025] },
  { name: 'diesis (augmented)', ratio: [128, 125] },
  { name: 'porcupine comma', ratio: [250, 243] },
  { name: 'septimal comma (archytas)', ratio: [64, 63] },
  { name: 'starling comma', ratio: [126, 125] },
  { name: 'marvel comma', ratio: [225, 224] },
  { name: 'undecimal comma (rastma-adjacent)', ratio: [33, 32] },
  { name: 'keenanisma', ratio: [385, 384] },
  { name: 'magic comma', ratio: [3125, 3072] },
];

const COMMA_TABLE: readonly TemperedComma[] = RAW_COMMAS.map((c) => ({
  name: c.name,
  ratio: c.ratio,
  cents: CENTS_PER_OCTAVE * Math.log2(c.ratio[0] / c.ratio[1]),
}));

/** The named-comma table this module tests against (cents derived from ratios). */
export const NAMED_COMMA_TABLE = COMMA_TABLE;
