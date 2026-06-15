import { CENTS_PER_OCTAVE } from './ratio.js';
import { type Pitch, centsToFreq, pitchToCents } from './cents.js';

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
