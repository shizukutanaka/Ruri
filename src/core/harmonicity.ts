/** Harmonicity via periodicity detection (Stolzenburg-style). Lower periodicity = more harmonic. */

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

export interface Fraction {
  readonly num: number;
  readonly den: number;
}

/**
 * Simplest rational approximation of `x > 0` within relative tolerance `tol`
 * (continued-fraction convergents). The tolerance is the tempering allowance:
 * `tol≈0.0136` snaps 12-TET intervals to nearby just ratios (Stolzenburg).
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
 */
export function relativePeriodicity(ratios: readonly number[], tol = 0.0136): number {
  if (ratios.length === 0) throw new RangeError('ratios must be non-empty');
  const fr = ratios.map((r) => approxRatio(r, tol));
  const commonDen = fr.reduce((l, f) => lcm(l, f.den), 1);
  const nums = fr.map((f) => f.num * (commonDen / f.den));
  return nums.reduce((l, n) => lcm(l, n), 1) / commonDen;
}

/** Periodicity of a chord given member frequencies (normalized to the lowest). */
export function chordPeriodicity(freqs: readonly number[], tol = 0.0136): number {
  const fmin = Math.min(...freqs);
  return relativePeriodicity(
    freqs.map((f) => f / fmin),
    tol,
  );
}
