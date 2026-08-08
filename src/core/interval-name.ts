/**
 * Naming intervals in an equal division — Kite Giedraitis's ups-and-downs.
 *
 * The rest of the library measures intervals; this names them, which is what
 * lets a composer talk about and notate a tuning rather than only hear it.
 *
 * Conventional names (perfect, major, minor, augmented, diminished) come from
 * the chain of fifths, so they carry over to any EDO by generating that chain in
 * the EDO's own steps. What breaks is that in most EDOs a sharp spans more than
 * one step, leaving pitches with no classical name at all. Ups-and-downs fills
 * exactly those gaps: `^` and `v` raise and lower by a single step, so 22-EDO's
 * six-step interval is an "upminor third" (`^m3`) — a minor third, one step up.
 *
 * The controlling quantity is **sharpness**, the size of the augmented unison in
 * steps (`7·fifth − 4·n`). It predicts the character of the whole system:
 *
 *  - sharpness 1 (12, 19-EDO) — classical names already cover every pitch, and
 *    ups/downs are unnecessary. This module therefore emits augmented and
 *    diminished names here, and only here.
 *  - sharpness 0 (7, 14, 21, 28, 35-EDO) — major equals minor; every interval is
 *    "perfect". These are the *perfect* EDOs.
 *  - sharpness < 0 (9, 11, 16, 23-EDO) — major is *narrower* than minor. These
 *    are the *superflat* EDOs, where classical intuition inverts.
 *  - sharpness ≥ 2 (22-EDO and many others) — a sharp is coarser than a step, so
 *    ups and downs become the finer, intended mechanism.
 *
 * Reference: Xenharmonic Wiki, "Kite's ups and downs notation"; Kite
 * Giedraitis, "Notation Guide for EDOs 5-72".
 */
const checkEdo = (n: number): void => {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`edo divisions must be a positive integer, got ${n}`);
  }
};

/** Steps in the EDO's best fifth — the generator the naming chain is built on. */
export function edoFifthSteps(n: number): number {
  checkEdo(n);
  return Math.round(n * Math.log2(3 / 2));
}

/**
 * Size of the augmented unison (the "sharp") in EDO steps: `7·fifth − 4·n`.
 *
 * 1 for 12- and 19-EDO; 0 for the perfect EDOs (7, 14, 21, 28, 35), where major
 * and minor coincide; negative for the superflat EDOs (9, 11, 16, 23), where
 * major is narrower than minor.
 */
export function edoSharpness(n: number): number {
  return 7 * edoFifthSteps(n) - 4 * n;
}

/** Interval quality, in the conventional set. */
export type IntervalQuality = 'P' | 'M' | 'm' | 'A' | 'd';

/** A named interval of an EDO. */
export interface EdoIntervalName {
  /** How many EDO steps the interval spans. */
  readonly steps: number;
  /** Generic degree: 1 = unison, 3 = third, 5 = fifth, 8 = octave. */
  readonly degree: number;
  readonly quality: IntervalQuality;
  /** Steps of adjustment: positive = ups (`^`), negative = downs (`v`). */
  readonly ups: number;
  /** Rendered name, e.g. `P5`, `^m3`, `vM6`, `A4`. */
  readonly name: string;
}

/** Generic degree and fifth-chain position for each classical interval. */
const CHAIN: ReadonlyArray<readonly [number, number, IntervalQuality]> = [
  [1, 0, 'P'],
  [5, 1, 'P'],
  [2, 2, 'M'],
  [6, 3, 'M'],
  [3, 4, 'M'],
  [7, 5, 'M'],
  [4, -1, 'P'],
];

/** Preference order when several spellings land on the same pitch. */
const QUALITY_PENALTY: Record<IntervalQuality, number> = { P: 0, M: 1, m: 2, A: 5, d: 6 };

interface Candidate {
  degree: number;
  quality: IntervalQuality;
  steps: number;
}

function candidates(n: number): Candidate[] {
  const g = edoFifthSteps(n);
  const sharp = edoSharpness(n);
  const wrap = (v: number): number => ((v % n) + n) % n;
  const out: Candidate[] = [];
  for (const [degree, k, quality] of CHAIN) {
    const steps = wrap(k * g);
    out.push({ degree, quality, steps });
    if (quality === 'M') out.push({ degree, quality: 'm', steps: wrap(steps - sharp) });
    // Augmented/diminished spellings only while a sharp is a single step. Past
    // that they are coarser than an up/down, and stacking them produces names
    // whose generic degree no longer matches the pitch (a 1-step "A7").
    if (Math.abs(sharp) <= 1) {
      const aug = steps + sharp;
      const dim = (quality === 'M' ? steps - sharp : steps) - sharp;
      if (aug >= 0 && aug <= n) out.push({ degree, quality: 'A', steps: aug });
      if (dim >= 0 && dim <= n) out.push({ degree, quality: 'd', steps: dim });
    }
  }
  return out;
}

/**
 * Name the interval spanning `steps` steps of an `n`-EDO.
 *
 * Picks the spelling needing fewest ups/downs, preferring simpler qualities when
 * several tie. `steps` may run from 0 to `n` inclusive, so the octave is named
 * `P8` rather than wrapping to `P1`.
 *
 * @throws {RangeError} if `n` is not a positive integer, or `steps` is not an
 *   integer in `[0, n]`.
 *
 * @example
 * edoIntervalName(12, 7).name; // 'P5'
 * edoIntervalName(12, 6).name; // 'A4' — the tritone
 * edoIntervalName(22, 6).name; // '^m3' — upminor third
 */
export function edoIntervalName(n: number, steps: number): EdoIntervalName {
  checkEdo(n);
  if (!Number.isInteger(steps) || steps < 0 || steps > n) {
    throw new RangeError(`steps must be an integer in [0, ${n}], got ${steps}`);
  }
  if (steps === n) return { steps, degree: 8, quality: 'P', ups: 0, name: 'P8' };

  let best: (Candidate & { ups: number; score: number }) | null = null;
  for (const c of candidates(n)) {
    let ups = steps - c.steps;
    // Take the shorter way round the octave.
    if (ups > n / 2) ups -= n;
    if (ups < -n / 2) ups += n;
    const score = Math.abs(ups) * 10 + QUALITY_PENALTY[c.quality];
    if (best === null || score < best.score) best = { ...c, ups, score };
  }
  const chosen = best as Candidate & { ups: number };
  const arrows = chosen.ups > 0 ? '^'.repeat(chosen.ups) : 'v'.repeat(-chosen.ups);
  return {
    steps,
    degree: chosen.degree,
    quality: chosen.quality,
    ups: chosen.ups,
    name: `${arrows}${chosen.quality}${chosen.degree}`,
  };
}

/**
 * Name every interval of an `n`-EDO, from the unison through the octave
 * (`n + 1` entries).
 *
 * @throws {RangeError} if `n` is not a positive integer.
 */
export function edoIntervalNames(n: number): EdoIntervalName[] {
  checkEdo(n);
  return Array.from({ length: n + 1 }, (_, s) => edoIntervalName(n, s));
}
