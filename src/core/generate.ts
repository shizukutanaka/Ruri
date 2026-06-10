/** Idiom-independent scale generation: MOS (generated scales) and maximally even sets. */

const wrap = (x: number, period: number): number => ((x % period) + period) % period;

/**
 * Generated (MOS) scale: stack `generatorCents` `count` times, reduce into one period, sort.
 * Works for any period (octave 1200 or non-octave). Returns cents in [0, periodCents).
 */
export function generatedScale(
  generatorCents: number,
  periodCents: number,
  count: number,
): number[] {
  if (count < 1 || periodCents <= 0) {
    throw new RangeError(`invalid MOS params: count=${count}, period=${periodCents}`);
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(wrap(i * generatorCents, periodCents));
  return out.sort((a, b) => a - b);
}

const ROUND = 1e6;

/**
 * Non-degenerate well-formed (Myhill's property): every generic interval class spans
 * exactly two distinct specific sizes. Diatonic/pentatonic = true; whole-tone = false.
 */
export function isWellFormed(scaleCents: readonly number[], periodCents: number): boolean {
  const n = scaleCents.length;
  if (n < 2) return false;
  const s = [...scaleCents].sort((a, b) => a - b);
  for (let k = 1; k < n; k++) {
    const sizes = new Set<number>();
    for (let i = 0; i < n; i++) {
      const hi = i + k;
      const span = (s[hi % n] as number) + Math.floor(hi / n) * periodCents - (s[i] as number);
      sizes.add(Math.round(span * ROUND) / ROUND);
    }
    if (sizes.size !== 2) return false;
  }
  return true;
}

/**
 * Maximally even set: `d` notes among `c` equal steps (Clough-Douthett floor formula).
 * Returns ascending step indices. Consecutive steps differ by at most one chromatic unit.
 */
export function maximallyEven(c: number, d: number, m = 0): number[] {
  if (d < 1 || c < d) throw new RangeError(`require 1 <= d <= c, got d=${d}, c=${c}`);
  return Array.from({ length: d }, (_, k) => Math.floor((c * k + m) / d));
}
