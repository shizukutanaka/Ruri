/** Exact rational pitch ratio (just intonation primary, cents derived). */
export interface Ratio {
  readonly num: number;
  readonly den: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const isPositiveInt = (n: number): boolean => Number.isInteger(n) && n > 0;

/** Construct a reduced positive ratio. Throws on non-positive-integer input (fail fast, I7). */
export function ratio(num: number, den: number): Ratio {
  if (!isPositiveInt(num) || !isPositiveInt(den)) {
    throw new RangeError(`ratio requires positive integers, got ${num}/${den}`);
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

/** Multiply two ratios (interval stacking = ratio product). */
export function multiplyRatio(a: Ratio, b: Ratio): Ratio {
  return ratio(a.num * b.num, a.den * b.den);
}

export const CENTS_PER_OCTAVE = 1200;

/** Ratio → cents. log2-based; exact for octaves (2/1 = 1200). */
export function ratioToCents(r: Ratio): number {
  return CENTS_PER_OCTAVE * Math.log2(r.num / r.den);
}
