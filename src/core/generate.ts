/** Idiom-independent scale generation: MOS (generated scales) and maximally even sets. */

import { type Pitch, pitchToCents } from './cents.js';
import { type TuningSystem, defineTuning } from './tuning.js';

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

// Step-size quantization for well-formedness / MOS analysis. 1e3 = round to
// 0.001 cent: far below perception (~1c) yet coarse enough that sub-milli-cent
// noise from a `.scl` round-trip (cents written at 6 decimals) or float error
// in scale generation cannot split one true step size into spurious classes —
// which would otherwise misreport an equal division as an irregular MOS.
// `isWellFormed` and `mosPattern` MUST share this constant to stay consistent.
const ROUND = 1e3;

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
 * MOS step-pattern descriptor: the adjacent-step structure of a scale in the
 * xenharmonic community's `L`/`s` (large/small) notation.
 */
export interface MosPattern {
  /** Per-step labels around one period, ascending from the root. */
  readonly pattern: readonly ('L' | 's')[];
  /** Number of large steps. */
  readonly large: number;
  /** Number of small steps. */
  readonly small: number;
  /** Size of a large step in cents (equals `small` size when the scale is equal). */
  readonly largeCents: number;
  /** Size of a small step in cents. */
  readonly smallCents: number;
  /** Compact xen name, e.g. `5L2s` (diatonic) or `5L0s` for an equal division. */
  readonly name: string;
}

/**
 * Analyse a scale's adjacent-step structure into `L`/`s` (large/small) notation.
 *
 * This is the companion to {@link isWellFormed}: where that predicate tests
 * Myhill's property across *all* generic interval classes, this reports the
 * 1-step layer directly — the `LLsLLLs` pattern and `5L2s` name that the
 * xenharmonic community uses to identify MOS scales.
 *
 * A scale is a valid MOS iff it has exactly **two** distinct step sizes (or one,
 * for an equal division). The larger is labelled `L`, the smaller `s`; sizes are
 * compared with the same 1e-6-cent rounding as {@link isWellFormed} so that
 * floating-point generation noise does not split a size into spurious classes.
 *
 * @param scaleCents - Ascending degree cents within one period (root at 0 assumed;
 *   do not include the period itself).
 * @param periodCents - The repetition interval (1200 = octave; may differ).
 * @returns The `MosPattern`, or `null` if the scale has more than two distinct
 *   step sizes (not a MOS) or fewer than one step.
 *
 * @example
 * // Diatonic in 12-TET → 5 large (200c) + 2 small (100c) steps: "5L2s".
 * mosPattern([0, 200, 400, 500, 700, 900, 1100], 1200);
 * // → { pattern: ['L','L','s','L','L','L','s'], large: 5, small: 2, name: '5L2s', ... }
 */
export function mosPattern(scaleCents: readonly number[], periodCents: number): MosPattern | null {
  const n = scaleCents.length;
  if (n < 1 || periodCents <= 0) return null;
  const s = [...scaleCents].sort((a, b) => a - b);
  const steps: number[] = [];
  for (let i = 0; i < n; i++) {
    const next = i + 1 < n ? (s[i + 1] as number) : periodCents;
    steps.push(Math.round((next - (s[i] as number)) * ROUND) / ROUND);
  }
  const sizes = [...new Set(steps)].sort((a, b) => b - a); // descending: [large, small]
  if (sizes.length > 2) return null; // more than two step sizes → not a MOS
  const largeCents = sizes[0] as number;
  const smallCents = (sizes.length === 2 ? sizes[1] : sizes[0]) as number;
  const pattern = steps.map((v): 'L' | 's' => (v === largeCents ? 'L' : 's'));
  // When there is a single size, treat every step as large (small count = 0).
  const large = pattern.filter((p) => p === 'L').length;
  const small = n - large;
  return { pattern, large, small, largeCents, smallCents, name: `${large}L${small}s` };
}

/**
 * Analyse a `TuningSystem`'s adjacent-step structure into `L`/`s` MOS notation.
 *
 * Bridges {@link mosPattern} to the first-class `TuningSystem` type (the same
 * relationship {@link isTuningWellFormed} has to {@link isWellFormed}).
 */
export function tuningMosPattern(tuning: TuningSystem): MosPattern | null {
  return mosPattern(
    tuning.degrees.map((d) => pitchToCents(d)),
    tuning.periodCents,
  );
}

/**
 * Maximally even set: `d` notes among `c` equal steps (Clough-Douthett floor formula).
 * Returns ascending step indices. Consecutive steps differ by at most one chromatic unit.
 */
export function maximallyEven(c: number, d: number, m = 0): number[] {
  if (d < 1 || c < d) throw new RangeError(`require 1 <= d <= c, got d=${d}, c=${c}`);
  return Array.from({ length: d }, (_, k) => Math.floor((c * k + m) / d));
}

/**
 * Generated (MOS) scale as a first-class TuningSystem, ready for use with
 * `rankChords`, `mtsBulkDump`, `fingerChord`, etc.
 *
 * Bridges `generatedScale` → `defineTuning` so callers do not have to
 * manually convert `number[]` to `Pitch[]` and then call `defineTuning`.
 *
 * @param id - Tuning id string (default: `mos-${count}`). Must be unique if
 *   multiple generated tunings coexist (Scale.tuningId must match).
 */
export function generatedTuning(
  generatorCents: number,
  periodCents: number,
  count: number,
  referenceHz = 440,
  id?: string,
): TuningSystem {
  const scaleCents = generatedScale(generatorCents, periodCents, count);
  const degrees: Pitch[] = scaleCents.map((c) => ({ kind: 'cents' as const, cents: c }));
  const resolvedId = id ?? `mos-${count}`;
  return defineTuning({
    id: resolvedId,
    name: resolvedId,
    referenceHz,
    periodCents,
    degrees,
    source: 'theoretical',
  });
}

/**
 * Test whether a `TuningSystem` is well-formed (has Myhill's property).
 *
 * Bridges `isWellFormed` (which takes a raw `number[]`) to the `TuningSystem` type.
 * A `TuningSystem` produced by `generatedTuning` with a non-degenerate generator is
 * always well-formed; `maximallyEvenTuning` is well-formed only when `gcd(c, d) = 1`.
 *
 * Closes the abstraction gap: if `TuningSystem` is first-class, MOS-ness should be
 * queryable on the type directly, not via a separate cents-extraction step.
 */
export function isTuningWellFormed(tuning: TuningSystem): boolean {
  return isWellFormed(
    tuning.degrees.map((d) => pitchToCents(d)),
    tuning.periodCents,
  );
}

/**
 * Maximally even set as a first-class TuningSystem.
 * `d` notes from a `c`-EDO chromatic universe, placed at cents `i * (periodCents / c)`.
 *
 * Example: `maximallyEvenTuning(12, 7)` → the familiar diatonic (WWHWWWH) in
 * 12-TET, but works for any chromatic universe and period.
 */
export function maximallyEvenTuning(
  c: number,
  d: number,
  periodCents = 1200,
  referenceHz = 440,
): TuningSystem {
  if (periodCents <= 0) {
    throw new RangeError(`periodCents must be > 0, got ${periodCents}`);
  }
  const indices = maximallyEven(c, d);
  const stepCents = periodCents / c;
  const degrees: Pitch[] = indices.map((i) => ({ kind: 'cents' as const, cents: i * stepCents }));
  const id = `me-${d}-of-${c}`;
  return defineTuning({
    id,
    name: `maximally even ${d}-of-${c}`,
    referenceHz,
    periodCents,
    degrees,
    source: 'theoretical',
  });
}
