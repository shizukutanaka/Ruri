import { CENTS_PER_OCTAVE } from './ratio.js';
import { type Pitch, centsToFreq, pitchToCents } from './cents.js';

// ---------------------------------------------------------------------------
// L2 — commaInfo / nearestComma
// ---------------------------------------------------------------------------

export interface CommaInfo {
  name: string;
  ratio: readonly [number, number];
  cents: number;
}

const NAMED_COMMAS: readonly CommaInfo[] = [
  { name: 'schisma', ratio: [32805, 32768], cents: 1.9537 },
  { name: 'diaschisma', ratio: [2048, 2025], cents: 19.5529 },
  { name: 'syntonic comma', ratio: [81, 80], cents: 21.5063 },
  { name: 'Pythagorean comma', ratio: [531441, 524288], cents: 23.46 },
  { name: 'septimal comma', ratio: [64, 63], cents: 27.2641 },
  { name: 'diesis', ratio: [128, 125], cents: 41.059 },
  { name: 'undecimal comma', ratio: [33, 32], cents: 53.2729 },
] as const;

/**
 * Return info about the nearest named musical comma for the given cents value.
 * Returns null if no comma within 5 cents of the input.
 */
export function nearestComma(cents: number): CommaInfo | null {
  let best: CommaInfo | null = null;
  let bestDist = Infinity;
  for (const comma of NAMED_COMMAS) {
    const dist = Math.abs(cents - comma.cents);
    if (dist < bestDist) {
      bestDist = dist;
      best = comma;
    }
  }
  return bestDist <= 5 ? best : null;
}

/**
 * A tuning system. No single normal form exists across cultures (improvement #2):
 * gamelan varies per ensemble with stretched octaves; maqam varies by region.
 * So provenance and a non-fixed period are first-class.
 */
export interface TuningSystem {
  readonly id: string;
  readonly name: string;
  /** Frequency of degree 0 at period 0. */
  readonly referenceHz: number;
  /** Repetition interval in cents. 1200 = octave; may differ (stretched / non-octave). */
  readonly periodCents: number;
  /** Ascending degrees within [0, periodCents). */
  readonly degrees: readonly Pitch[];
  readonly source: 'measured' | 'theoretical';
  readonly region?: string;
}

const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** Validate invariants and return the tuning (fail fast, I7). */
export function defineTuning(t: TuningSystem): TuningSystem {
  if (t.degrees.length === 0) throw new RangeError(`tuning '${t.id}' has no degrees`);
  if (t.referenceHz <= 0) throw new RangeError(`tuning '${t.id}' referenceHz must be > 0`);
  if (t.periodCents <= 0) throw new RangeError(`tuning '${t.id}' periodCents must be > 0`);
  const cents = t.degrees.map(pitchToCents);
  for (let i = 0; i < cents.length; i++) {
    const c = cents[i] as number;
    if (c < 0 || c >= t.periodCents) {
      throw new RangeError(`tuning '${t.id}' degree ${i} (${c}c) outside [0, ${t.periodCents})`);
    }
    if (i > 0 && c <= (cents[i - 1] as number)) {
      throw new RangeError(`tuning '${t.id}' degrees must be strictly ascending`);
    }
  }
  return t;
}

/**
 * Cents of a degree, with period wrapping. `degree` may exceed the degree count
 * (wraps and advances the period); `period` adds whole periods on top.
 */
export function degreeToCents(t: TuningSystem, degree: number, period = 0): number {
  const n = t.degrees.length;
  if (n === 0) throw new RangeError(`tuning '${t.id}' has no degrees`);
  const wrapped = mod(degree, n);
  const carriedPeriods = Math.floor(degree / n);
  const pitch = t.degrees[wrapped] as Pitch;
  return pitchToCents(pitch) + (period + carriedPeriods) * t.periodCents;
}

/** Absolute frequency of a degree. */
export function degreeToFreq(t: TuningSystem, degree: number, period = 0): number {
  return centsToFreq(degreeToCents(t, degree, period), t.referenceHz);
}

/** Standard 12-tone equal temperament, A=440. */
export function equalTemperament12(referenceHz: number): TuningSystem {
  const degrees: Pitch[] = Array.from({ length: 12 }, (_, i) => ({
    kind: 'cents' as const,
    cents: (CENTS_PER_OCTAVE / 12) * i,
  }));
  return defineTuning({
    id: '12-tet',
    name: '12-tone equal temperament',
    referenceHz,
    periodCents: CENTS_PER_OCTAVE,
    degrees,
    source: 'theoretical',
  });
}

/**
 * n-tone equal division of the period (default: octave). id = `${n}-edo`.
 *
 * CAVEAT: `edo(12)` is pitch-identical to `equalTemperament12()` but its `id` is
 * `'12-edo'`, NOT `'12-tet'`. Because `scaleToCents` requires `Scale.tuningId` to
 * match `tuning.id`, a `Scale` authored for `'12-tet'` will NOT bind to `edo(12)`
 * even though the frequencies are the same. Use `equalTemperament12()` when you
 * need the `'12-tet'` id, or set your `Scale.tuningId` to `'12-edo'`.
 */
export function edo(
  divisions: number,
  referenceHz = 440,
  periodCents = CENTS_PER_OCTAVE,
): TuningSystem {
  if (!Number.isInteger(divisions) || divisions < 1) {
    throw new RangeError(`edo: divisions must be a positive integer, got ${divisions}`);
  }
  if (periodCents <= 0) {
    throw new RangeError(`edo: periodCents must be > 0, got ${periodCents}`);
  }
  const degrees: Pitch[] = Array.from({ length: divisions }, (_, i) => ({
    kind: 'cents' as const,
    cents: (i * periodCents) / divisions,
  }));
  return defineTuning({
    id: `${divisions}-edo`,
    name: `${divisions}-tone equal division of the octave`,
    referenceHz,
    periodCents,
    degrees,
    source: 'theoretical',
  });
}

/**
 * Symmetric distance between two `TuningSystem`s in cents.
 *
 * Socratic Q88: `tuningSuitability(tuning, spectrum)` measures how well a tuning
 * fits a *timbre* — but comparing two tunings directly, independent of any spectrum,
 * still requires a custom loop. If `TuningSystem` is truly first-class, measuring
 * "how different two tunings sound" should be one call.
 *
 * Algorithm (symmetric Hausdorff-style):
 * 1. For each degree in `a`, find the nearest degree in `b` (minimum absolute
 *    difference in cents within the same period), and record that minimum distance.
 * 2. Do the same in the other direction: for each degree in `b`, find the nearest in `a`.
 * 3. Return the average of all these minimum distances across both directions.
 *
 * This is symmetric: `tuningDistance(a, b) === tuningDistance(b, a)`.
 * Returns 0 when both tunings have identical degree positions (after normalizing
 * to cents). The `referenceHz` and `source` fields are ignored — only the cent
 * positions of the degrees matter.
 *
 * @param a - First tuning system.
 * @param b - Second tuning system.
 * @returns Average minimum-distance in cents (≥ 0). Lower = more similar.
 *
 * @example
 * // 12-TET vs Pythagorean: small but non-zero distance
 * const t12 = equalTemperament12(440);
 * const pyth = pythagorean(440); // from temperament.ts
 * const d = tuningDistance(t12, pyth);
 * // d ≈ 5.9 cents (wolf fifth and commas spread small differences across degrees)
 */
export function tuningDistance(a: TuningSystem, b: TuningSystem): number {
  const centsA = a.degrees.map((_, i) => degreeToCents(a, i));
  const centsB = b.degrees.map((_, i) => degreeToCents(b, i));
  let total = 0;
  // a → nearest in b
  for (const ca of centsA) {
    let minDist = Infinity;
    for (const cb of centsB) {
      const d = Math.abs(ca - cb);
      if (d < minDist) minDist = d;
    }
    total += minDist;
  }
  // b → nearest in a
  for (const cb of centsB) {
    let minDist = Infinity;
    for (const ca of centsA) {
      const d = Math.abs(cb - ca);
      if (d < minDist) minDist = d;
    }
    total += minDist;
  }
  return total / (centsA.length + centsB.length);
}

/**
 * Interval histogram (fingerprint) of a tuning: counts how many times each
 * interval class appears among all degree pairs.
 *
 * Socratic Q86: `tuningIntervalMatrix(tuning)` gives all pairwise intervals, but
 * summarising the interval content as a compact fingerprint — "how many perfect
 * fifths does this tuning contain?" — still requires iterating the matrix and
 * binning manually. If `TuningSystem` is truly first-class, its interval content
 * should be expressible as a one-call histogram.
 *
 * Counts only the **upper-triangle** pairs (i < j) in the matrix, converting each
 * positive interval to a rounded bin of `stepCents` width. Ascending intervals only
 * (each dyad contributes one positive count; descending directions are mirror images).
 *
 * @param tuning - The tuning system to fingerprint.
 * @param stepCents - Bin width in cents (default 50). Intervals are rounded to the
 *   nearest multiple of `stepCents`. Must be > 0.
 * @returns `Map<number, number>` mapping `intervalCents → count`, where
 *   `intervalCents` is the rounded bin centre and `count` is how many
 *   degree-pairs produce an interval in that bin.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const hist = tuningToIntervalVector(t12);
 * // In 12-TET the perfect fifth (700c) appears 7 times (i→j and j→i pairs folded).
 * hist.get(700); // → 7
 */
export function tuningToIntervalVector(tuning: TuningSystem, stepCents = 50): Map<number, number> {
  if (!Number.isFinite(stepCents) || stepCents <= 0) {
    throw new RangeError(`tuningToIntervalVector: stepCents must be > 0, got ${stepCents}`);
  }
  const n = tuning.degrees.length;
  const centsArr = tuning.degrees.map((_, i) => degreeToCents(tuning, i));
  const hist = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const interval = (centsArr[j] as number) - (centsArr[i] as number);
      const bin = Math.round(interval / stepCents) * stepCents;
      hist.set(bin, (hist.get(bin) ?? 0) + 1);
    }
  }
  return hist;
}

/**
 * Pairwise interval matrix in cents for all degree pairs in a tuning.
 *
 * Socratic Q82: Given a `TuningSystem`, the pairwise interval in cents between
 * every pair of degrees is fundamental for analysis (identifying consonant
 * intervals, detecting symmetry, comparing tunings) but requires a manual
 * double-loop. If `TuningSystem` is truly first-class, retrieving `matrix[i][j]`
 * — the interval in cents from degree i to degree j — should be one call.
 *
 * `matrix[i][j]` = cents from degree `i` up to degree `j`, computed as
 * `degreeToCents(t, j) - degreeToCents(t, i)`. When `j < i` the value is
 * negative (the interval is a descending step within the period).
 *
 * @throws {RangeError} if `tuning` has no degrees (propagated from `defineTuning`).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const m = tuningIntervalMatrix(t12);
 * // m[0][7] ≈ 700 cents (perfect fifth from degree 0 to degree 7)
 * // m[7][0] ≈ -700 cents
 */
export function tuningIntervalMatrix(tuning: TuningSystem): number[][] {
  const n = tuning.degrees.length;
  const centsArr = tuning.degrees.map((_, i) => degreeToCents(tuning, i));
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (centsArr[j] as number) - (centsArr[i] as number)),
  );
}

// ---------------------------------------------------------------------------
// I2 — tuningDeviationReport
// ---------------------------------------------------------------------------

/**
 * Compare two tuning systems degree-by-degree and report the signed cents
 * deviation of each candidate degree from the reference degree.
 *
 * Only the first `Math.min(reference.degrees.length, candidate.degrees.length)`
 * degrees are compared (shorter tuning wins).  Results are returned in ascending
 * `degreeIndex` order (i.e. natural iteration order — NOT sorted by delta magnitude).
 *
 * `deltaCents > 0` means the candidate degree is sharper (higher in pitch) than
 * the reference degree.
 *
 * @throws {RangeError} if either tuning has zero degrees.
 */
export function tuningDeviationReport(
  reference: TuningSystem,
  candidate: TuningSystem,
): Array<{ degreeIndex: number; refCents: number; candCents: number; deltaCents: number }> {
  if (reference.degrees.length === 0) {
    throw new RangeError(
      `tuningDeviationReport: reference tuning '${reference.id}' has no degrees`,
    );
  }
  if (candidate.degrees.length === 0) {
    throw new RangeError(
      `tuningDeviationReport: candidate tuning '${candidate.id}' has no degrees`,
    );
  }

  const n = Math.min(reference.degrees.length, candidate.degrees.length);
  const result: Array<{
    degreeIndex: number;
    refCents: number;
    candCents: number;
    deltaCents: number;
  }> = [];

  for (let i = 0; i < n; i++) {
    const refPitch = reference.degrees[i]!;
    const candPitch = candidate.degrees[i]!;
    const refCents = pitchToCents(refPitch);
    const candCents = pitchToCents(candPitch);
    result.push({
      degreeIndex: i,
      refCents,
      candCents,
      deltaCents: candCents - refCents,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// I4 — approximateEdoForIntervals
// ---------------------------------------------------------------------------

/**
 * For each EDO n in [minN, maxN], compute how well n-EDO approximates the
 * given target intervals (in cents).  Returns all results sorted ascending by
 * `rmsCents` (best-fit first).
 *
 * `perInterval[i].deltaCents` is signed: positive = EDO's nearest step is
 * sharper than the target.
 *
 * Defaults: `minN = 5`, `maxN = 53`.
 *
 * @throws {RangeError} if `targetCents` is empty, any element is non-finite,
 *   `minN < 2`, or `maxN < minN`.
 */
export function approximateEdoForIntervals(
  targetCents: number[],
  minN = 5,
  maxN = 53,
): Array<{
  n: number;
  rmsCents: number;
  perInterval: Array<{ targetCents: number; nearestCents: number; deltaCents: number }>;
}> {
  if (targetCents.length === 0) {
    throw new RangeError(`approximateEdoForIntervals: targetCents must not be empty`);
  }
  if (minN < 2) {
    throw new RangeError(`approximateEdoForIntervals: minN must be >= 2, got ${minN}`);
  }
  if (maxN < minN) {
    throw new RangeError(`approximateEdoForIntervals: maxN (${maxN}) must be >= minN (${minN})`);
  }
  for (let k = 0; k < targetCents.length; k++) {
    const v = targetCents[k] as number;
    if (!Number.isFinite(v)) {
      throw new RangeError(`approximateEdoForIntervals: targetCents[${k}] is not finite (${v})`);
    }
  }

  const results: Array<{
    n: number;
    rmsCents: number;
    perInterval: Array<{ targetCents: number; nearestCents: number; deltaCents: number }>;
  }> = [];

  for (let n = minN; n <= maxN; n++) {
    const stepCents = CENTS_PER_OCTAVE / n;
    let sumSq = 0;
    const perInterval: Array<{ targetCents: number; nearestCents: number; deltaCents: number }> =
      [];

    for (const target of targetCents) {
      const nearestStep = Math.round(target / stepCents);
      const nearestCents = nearestStep * stepCents;
      const deltaCents = nearestCents - target;
      sumSq += deltaCents * deltaCents;
      perInterval.push({ targetCents: target, nearestCents, deltaCents });
    }

    const rmsCents = Math.sqrt(sumSq / targetCents.length);
    results.push({ n, rmsCents, perInterval });
  }

  results.sort((a, b) => a.rmsCents - b.rmsCents);
  return results;
}
