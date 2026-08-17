/**
 * Naming just intervals — the Functional Just System (FJS).
 *
 * `interval-name.ts` names the steps of an equal division. This names exact
 * just ratios, which is the other half of being able to write a tuning down.
 *
 * Conventional interval names come from the chain of fifths, so they can only
 * reach 3-limit intervals: 81/64 is a major third, and so is 5/4, but they are
 * different pitches 21.5 cents apart. FJS keeps the familiar name for the
 * Pythagorean interval and marks the difference with an accidental naming the
 * prime responsible — `81/64` stays `M3`, while `5/4` becomes `M3^5`. Primes in
 * the numerator take a raised accidental, primes in the denominator a lowered
 * one, so `6/5` is `m3_5` and `7/4` is `m7^7`.
 *
 * The accidentals are not a lookup table. Each prime's **formal comma** is
 * derived by the FJS master algorithm: take the prime octave-reduced, walk the
 * chain of fifths outward from the unison, and stop at the first Pythagorean
 * interval lying within the *radius of tolerance* of it. The comma is whatever
 * is left over. The standard radius is 65/63, the mediant of 33/32 and 32/31 —
 * chosen so that 33/32 is admitted as prime 11's comma while 32/31 is not, and
 * this implementation reproduces exactly that boundary.
 *
 * Running the algorithm yields the commas the system is known by: 80/81 for
 * prime 5 (the syntonic comma), 63/64 for 7, 33/32 for 11, 1053/1024 for 13.
 *
 * Reference: "The Functional Just System" (misotanni.github.io/fjs), including
 * the master algorithm and the radius of tolerance; Xenharmonic Wiki,
 * "Functional Just System".
 */
import { CENTS_PER_OCTAVE } from './ratio.js';
import { PRIMES } from './val.js';

/** Standard radius of tolerance: 65/63, the mediant of 33/32 and 32/31. */
export const FJS_RADIUS_OF_TOLERANCE = 65 / 63;

/** Octave-reduce a positive ratio into [1, 2). */
function octaveReduce(x: number): number {
  let r = x;
  while (r >= 2) r /= 2;
  while (r < 1) r *= 2;
  return r;
}

/**
 * Fifth-chain position of the Pythagorean interval that FJS assigns to `prime`,
 * i.e. how many fifths up (or down, if negative) approximate it.
 *
 * Returns `null` if no Pythagorean interval comes within the radius — which
 * cannot happen for the primes this library handles, but is reported rather
 * than guessed at.
 */
function formalCommaFifths(prime: number, radius: number): number | null {
  const target = octaveReduce(prime);
  // Walk outward from the unison so the *simplest* qualifying interval wins.
  for (let magnitude = 0; magnitude <= 64; magnitude++) {
    const candidates = magnitude === 0 ? [0] : [magnitude, -magnitude];
    for (const k of candidates) {
      const comma = target / octaveReduce(3 ** k);
      if (comma < radius && comma > 1 / radius) return k;
    }
  }
  return null;
}

/** A prime's formal comma: the gap between it and its Pythagorean stand-in. */
export interface FormalComma {
  readonly prime: number;
  /** Fifth-chain position of the Pythagorean interval standing in for the prime. */
  readonly fifths: number;
  /** The comma as a plain ratio. Below 1 when the comma lowers. */
  readonly ratio: number;
  readonly cents: number;
}

/**
 * The formal comma FJS assigns to `prime`, derived by the master algorithm.
 *
 * @throws {RangeError} if `prime` is not a prime greater than 3 that this
 *   library handles, or if `radius` is not greater than 1.
 *
 * @example
 * fjsFormalComma(5).cents;  // -21.5063 — the syntonic comma
 * fjsFormalComma(11).ratio; // 1.03125 = 33/32
 */
export function fjsFormalComma(prime: number, radius = FJS_RADIUS_OF_TOLERANCE): FormalComma {
  if (!PRIMES.includes(prime) || prime <= 3) {
    throw new RangeError(`prime must be one of ${PRIMES.filter((p) => p > 3).join(', ')}`);
  }
  if (!Number.isFinite(radius) || radius <= 1) {
    throw new RangeError(`radius must be > 1, got ${radius}`);
  }
  const fifths = formalCommaFifths(prime, radius);
  if (fifths === null) {
    throw new RangeError(`no Pythagorean interval within the radius for prime ${prime}`);
  }
  const ratio = octaveReduce(prime) / octaveReduce(3 ** fifths);
  return { prime, fifths, ratio, cents: CENTS_PER_OCTAVE * Math.log2(ratio) };
}

/** Prime factorisation as prime → exponent, or `null` if a factor is out of range. */
function factorise(n: number): Map<number, number> | null {
  let rest = n;
  const out = new Map<number, number>();
  for (const p of PRIMES) {
    let exp = 0;
    while (rest % p === 0) {
      rest /= p;
      exp++;
    }
    if (exp > 0) out.set(p, exp);
  }
  return rest === 1 ? out : null;
}

/** Generic degree reached by `fifths` fifths, before octave adjustment. */
const DEGREE_BY_FIFTHS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Name the Pythagorean interval at fifth-chain position `fifths`, spanning `cents`. */
function pythagoreanName(fifths: number, cents: number): string {
  // Each fifth advances the generic degree by four steps, modulo the seven
  // letters; the octave count is recovered from the interval's actual size.
  const degreeIndex = (((fifths * 4) % 7) + 7) % 7;
  const baseDegree = DEGREE_BY_FIFTHS[degreeIndex] as number;
  // Every seven fifths sharpens by a chromatic semitone.
  const level = Math.floor((fifths + 1) / 7);
  const isPerfectClass = baseDegree === 1 || baseDegree === 4 || baseDegree === 5;

  let quality: string;
  if (level === 0) quality = isPerfectClass ? 'P' : 'M';
  else if (level > 0) quality = 'A'.repeat(level);
  else if (level === -1) quality = isPerfectClass ? 'd' : 'm';
  else quality = 'd'.repeat(isPerfectClass ? -level : -level - 1);

  const withinOctave = CENTS_PER_OCTAVE * Math.log2(octaveReduce(3 ** fifths));
  const octaves = Math.round((cents - withinOctave) / CENTS_PER_OCTAVE);
  return `${quality}${baseDegree + 7 * octaves}`;
}

/**
 * The FJS name of the just interval `num/den`, e.g. `P5`, `M3^5`, `m7^7`.
 *
 * The Pythagorean part supplies the familiar name; each prime above 3 in the
 * ratio contributes an accidental — raised (`^`) for the numerator, lowered
 * (`_`) for the denominator — repeated once per power. Intervals differing only
 * by a comma therefore keep the same base name: 81/64 is `M3`, 5/4 is `M3^5`.
 *
 * @throws {RangeError} if `num` or `den` is not a positive integer, or the
 *   ratio involves a prime outside {@link PRIMES}.
 *
 * @example
 * fjsName(3, 2);   // 'P5'
 * fjsName(5, 4);   // 'M3^5'  — just major third
 * fjsName(81, 64); // 'M3'    — Pythagorean major third, 21.5c higher
 * fjsName(6, 5);   // 'm3_5'
 */
export function fjsName(num: number, den: number, radius = FJS_RADIUS_OF_TOLERANCE): string {
  if (!Number.isInteger(num) || num < 1 || !Number.isInteger(den) || den < 1) {
    throw new RangeError(`num and den must be positive integers, got ${num}/${den}`);
  }
  const fNum = factorise(num);
  const fDen = factorise(den);
  if (fNum === null || fDen === null) {
    throw new RangeError(`${num}/${den} involves a prime outside ${PRIMES.join(', ')}`);
  }

  const exponents = new Map<number, number>();
  for (const [p, e] of fNum) exponents.set(p, (exponents.get(p) ?? 0) + e);
  for (const [p, e] of fDen) exponents.set(p, (exponents.get(p) ?? 0) - e);

  // Replacing each higher prime by its Pythagorean stand-in moves the interval
  // along the chain of fifths; the accidentals record what was replaced.
  let fifths = exponents.get(3) ?? 0;
  const accidentals: string[] = [];
  for (const p of PRIMES) {
    if (p <= 3) continue;
    const e = exponents.get(p) ?? 0;
    if (e === 0) continue;
    const comma = fjsFormalComma(p, radius);
    fifths += comma.fifths * e;
    for (let i = 0; i < Math.abs(e); i++) accidentals.push(e > 0 ? `^${p}` : `_${p}`);
  }

  const cents = CENTS_PER_OCTAVE * Math.log2(num / den);
  return pythagoreanName(fifths, cents) + accidentals.join('');
}
