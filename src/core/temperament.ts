import { CENTS_PER_OCTAVE, ratioToCents, ratio } from './ratio.js';
import { type Pitch } from './cents.js';
import { defineTuning, type TuningSystem } from './tuning.js';

export interface RegularTemperamentOptions {
  /** Generator interval in cents (e.g. ~696.578 for quarter-comma meantone fifth). */
  readonly generatorCents: number;
  /** Period in cents (default 1200). */
  readonly periodCents?: number;
  /** Number of degrees in the resulting scale (>= 1). */
  readonly count: number;
  /** How many generator steps go downward from the origin (default 0; e.g. 1 puts one flat-side step in). */
  readonly down?: number;
  readonly referenceHz?: number;
  readonly id?: string;
}

/**
 * Stack `count` pitches by the generator (down..count-1-down steps),
 * reduce into one period, sort ascending. Degenerate generators (duplicates
 * after reduction) throw RangeError (fail fast, I7).
 */
export function regularTemperament(opts: RegularTemperamentOptions): TuningSystem {
  const { generatorCents, count, referenceHz = 440, id = 'regular-temperament' } = opts;

  const periodCents = opts.periodCents ?? CENTS_PER_OCTAVE;
  const down = opts.down ?? 0;

  // Validate inputs
  if (!Number.isFinite(periodCents) || periodCents <= 0) {
    throw new RangeError(
      `regularTemperament: periodCents must be a finite positive number, got ${periodCents}`,
    );
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`regularTemperament: count must be a positive integer, got ${count}`);
  }
  if (!Number.isInteger(down) || down < 0) {
    throw new RangeError(`regularTemperament: down must be a non-negative integer, got ${down}`);
  }
  if (down > count - 1) {
    throw new RangeError(`regularTemperament: down (${down}) must be <= count-1 (${count - 1})`);
  }
  if (!Number.isFinite(generatorCents)) {
    throw new RangeError(
      `regularTemperament: generatorCents must be finite, got ${generatorCents}`,
    );
  }

  // Generate pitches: steps from -down to count-1-down
  const raw: number[] = [];
  for (let k = -down; k <= count - 1 - down; k++) {
    const rawCents = k * generatorCents;
    // Reduce into [0, period)
    const reduced = ((rawCents % periodCents) + periodCents) % periodCents;
    raw.push(reduced);
  }

  // Sort ascending
  raw.sort((a, b) => a - b);

  // Deduplicate within 1e-9 cents tolerance
  const deduped: number[] = [raw[0] as number];
  for (let i = 1; i < raw.length; i++) {
    const prev = deduped[deduped.length - 1] as number;
    const curr = raw[i] as number;
    if (curr - prev < 1e-9) {
      throw new RangeError(
        `regularTemperament: degenerate generator — duplicate pitch at ~${curr.toFixed(4)}c ` +
          `(id='${id}', generatorCents=${generatorCents}, count=${count})`,
      );
    }
    deduped.push(curr);
  }

  const degrees: Pitch[] = deduped.map((c) => ({ kind: 'cents' as const, cents: c }));

  return defineTuning({
    id,
    name: id,
    referenceHz,
    periodCents,
    degrees,
    source: 'theoretical',
  });
}

/** Cents of the syntonic comma (81/80). */
const SYNTONIC_COMMA_CENTS: number = ratioToCents(ratio(81, 80));

/** Quarter-comma meantone fifth in cents. */
const MEANTONE_QC_FIFTH: number = ratioToCents(ratio(3, 2)) - SYNTONIC_COMMA_CENTS / 4;

/**
 * Quarter-comma meantone: fifth = pure 3/2 − ¼ syntonic comma ≈ 696.578 c.
 * 12 notes, 1 flat-side step (Eb..G#).
 */
export function meantoneQuarterComma(referenceHz = 440, count = 12): TuningSystem {
  return regularTemperament({
    id: 'meantone-quarter-comma',
    generatorCents: MEANTONE_QC_FIFTH,
    periodCents: CENTS_PER_OCTAVE,
    count,
    down: 1,
    referenceHz,
  });
}

/** Pure 3/2 fifth in cents ≈ 701.955 c. */
const PYTHAGOREAN_FIFTH: number = ratioToCents(ratio(3, 2));

/**
 * Pythagorean tuning: pure 3/2 fifths (≈ 701.955 c). 12 notes, 1 flat-side step.
 */
export function pythagorean(referenceHz = 440, count = 12): TuningSystem {
  return regularTemperament({
    id: 'pythagorean',
    generatorCents: PYTHAGOREAN_FIFTH,
    periodCents: CENTS_PER_OCTAVE,
    count,
    down: 1,
    referenceHz,
  });
}
