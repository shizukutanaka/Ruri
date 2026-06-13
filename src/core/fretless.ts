/**
 * Continuous (fretless) string-instrument position model.
 *
 * Covers instruments like oud, violin, and fretless bass where pitch is not
 * quantised to discrete frets; position is expressed in cents above the open string.
 */

import { midiToFreq } from './midi.js';

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface FretlessInstrument {
  readonly id: string;
  /** Open-string frequencies in Hz, low to high. */
  readonly openStringsHz: readonly number[];
  /**
   * Maximum reachable cents above the open string (fingerboard length).
   * E.g. 2400 = two octaves.
   */
  readonly maxCents: number;
}

export interface FretlessPosition {
  /** String index into openStringsHz. */
  readonly string: number;
  /** Continuous position in cents above the open string (0 = open). */
  readonly cents: number;
  readonly freqHz: number;
}

// ---------------------------------------------------------------------------
// Core: positions for a target frequency
// ---------------------------------------------------------------------------

/**
 * All strings on which `targetHz` is reachable; exact positions, no quantisation.
 *
 * For each string s, the required position is:
 *   centsRequired = 1200 * log2(targetHz / openStringsHz[s])
 *
 * A position is included when:
 *   -toleranceCents <= centsRequired <= maxCents + toleranceCents
 *
 * When `toleranceCents > 0` and the required cents fall within `toleranceCents`
 * of a boundary (0 or maxCents), the reported cents are clamped to that
 * boundary and `freqHz` is recomputed from the clamped value.  With the
 * default `toleranceCents = 0` the function is strict (no clamping).
 *
 * @throws {RangeError} if targetHz is not finite and > 0, or toleranceCents < 0.
 */
export function fretlessPositionsFor(
  inst: FretlessInstrument,
  targetHz: number,
  toleranceCents = 0,
): FretlessPosition[] {
  if (!Number.isFinite(targetHz) || targetHz <= 0) {
    throw new RangeError(`targetHz must be finite and > 0, got ${targetHz}`);
  }
  if (!Number.isFinite(toleranceCents) || toleranceCents < 0) {
    throw new RangeError(`toleranceCents must be >= 0, got ${toleranceCents}`);
  }

  const out: FretlessPosition[] = [];
  for (let s = 0; s < inst.openStringsHz.length; s++) {
    const open = inst.openStringsHz[s] as number;
    const centsRequired = 1200 * Math.log2(targetHz / open);

    // Out of range?
    if (centsRequired < -toleranceCents || centsRequired > inst.maxCents + toleranceCents) {
      continue;
    }

    // Clamp to boundary when within tolerance
    let reportedCents = centsRequired;
    if (toleranceCents > 0) {
      if (centsRequired < 0) {
        reportedCents = 0;
      } else if (centsRequired > inst.maxCents) {
        reportedCents = inst.maxCents;
      }
    }

    const freqHz = open * 2 ** (reportedCents / 1200);
    out.push({ string: s, cents: reportedCents, freqHz });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chord fingering
// ---------------------------------------------------------------------------

/**
 * Span of "fretted" (non-open) positions in cents.
 *
 * Mirrors fingering.ts's `frettedSpan` convention: open-string positions
 * (cents === 0) are excluded from the span calculation so they don't
 * artificially inflate the hand stretch.
 */
function frettedCentsSpan(positions: readonly FretlessPosition[]): number {
  const fretted = positions.filter((p) => p.cents > 0).map((p) => p.cents);
  return fretted.length === 0 ? 0 : Math.max(...fretted) - Math.min(...fretted);
}

/**
 * Generator that yields all injective (one-note-per-string) assignments.
 * Pruning happens eagerly on string collisions.
 */
function* assignments(
  candidates: FretlessPosition[][],
  chosen: FretlessPosition[],
  usedStrings: Set<number>,
): Generator<FretlessPosition[]> {
  if (chosen.length === candidates.length) {
    yield [...chosen];
    return;
  }
  // noUncheckedIndexedAccess: explicit guard
  const current = candidates[chosen.length];
  if (current === undefined) return;
  for (const pos of current) {
    if (usedStrings.has(pos.string)) continue;
    usedStrings.add(pos.string);
    chosen.push(pos);
    yield* assignments(candidates, chosen, usedStrings);
    chosen.pop();
    usedStrings.delete(pos.string);
  }
}

/**
 * Greedy/best-first assignment of chord frequencies to strings (one note per string),
 * minimising hand span in cents.
 *
 * Cost = max(fretted cents) − min(fretted cents) where "fretted" means cents > 0
 * (open strings are free and excluded from the span).  This mirrors the convention
 * in `fingering.ts` where `fret > 0` positions define the span.
 *
 * Returns the minimum-cost assignment sorted by string index, or `null` if no
 * complete injective assignment exists.  Tie-breaking is lexicographic by the
 * string indices of the chosen positions.
 *
 * @throws {RangeError} if freqsHz is empty, longer than the string count,
 *   or contains non-finite / non-positive values.
 */
export function fingerFretlessChord(
  inst: FretlessInstrument,
  freqsHz: readonly number[],
): FretlessPosition[] | null {
  if (freqsHz.length === 0) {
    throw new RangeError('freqsHz must not be empty');
  }
  if (freqsHz.length > inst.openStringsHz.length) {
    throw new RangeError(
      `freqsHz.length (${freqsHz.length}) exceeds string count (${inst.openStringsHz.length})`,
    );
  }
  for (const f of freqsHz) {
    if (!Number.isFinite(f) || f <= 0) {
      throw new RangeError(`all freqsHz must be finite and > 0, got ${f}`);
    }
  }

  // Build per-note candidate lists
  const candidates = freqsHz.map((f) => fretlessPositionsFor(inst, f, 0));

  // If any note is unreachable on every string, no solution exists
  if (candidates.some((cand) => cand.length === 0)) return null;

  let best: FretlessPosition[] | null = null;
  let bestCost = Infinity;
  let bestStrings: number[] = [];

  for (const assignment of assignments(candidates, [], new Set())) {
    const cost = frettedCentsSpan(assignment);
    const strings = assignment.map((p) => p.string);

    // Lexicographic tie-break: compare string arrays element by element
    const isBetter =
      cost < bestCost || (cost === bestCost && strings.join(',') < bestStrings.join(','));

    if (isBetter) {
      best = assignment;
      bestCost = cost;
      bestStrings = strings;
    }
  }

  if (best === null) return null;

  // Sort result by string index (ascending)
  return [...best].sort((a, b) => a.string - b.string);
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Arabic oud in common Arabic tuning (low to high): D2 G2 A2 D3 G3 C4.
 *
 * Common Arabic tuning — regional variants exist (Turkish, Persian tunings differ).
 *
 * MIDI numbers used: D2=38, G2=43, A2=45, D3=50, G3=55, C4=60.
 * Frequencies are derived from `midiToFreq` so they scale with `referenceHz` (A4).
 *
 * maxCents: 1200 (~one practical octave on the oud fingerboard).
 */
export function fretlessOud(referenceHz = 440): FretlessInstrument {
  // D2=38, G2=43, A2=45, D3=50, G3=55, C4=60
  const midiNumbers = [38, 43, 45, 50, 55, 60] as const;
  return {
    id: 'oud-arabic',
    openStringsHz: midiNumbers.map((n) => midiToFreq(n, referenceHz)),
    maxCents: 1200,
  };
}

/**
 * Violin: G3 D4 A4 E5 in standard tuning.
 *
 * MIDI numbers: G3=55, D4=62, A4=69, E5=76.
 * maxCents: 2400 (two octaves — violin has a long fingerboard).
 */
export function violin(referenceHz = 440): FretlessInstrument {
  // G3=55, D4=62, A4=69, E5=76
  const midiNumbers = [55, 62, 69, 76] as const;
  return {
    id: 'violin',
    openStringsHz: midiNumbers.map((n) => midiToFreq(n, referenceHz)),
    maxCents: 2400,
  };
}
