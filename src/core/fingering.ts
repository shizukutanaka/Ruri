/** Chord fingering for fretted instruments: assign one position per target, minimize cost. */

import { type StringInstrument, type StringPosition, positionsFor } from './instrument.js';
import { type Scale, chordFromScale } from './scale.js';
import { type TuningSystem } from './tuning.js';
import { chordToCentOffsets } from './chord.js';

/** Player-specific biomechanics (no single correct fingering; weights are per-player). */
export interface HandProfile {
  /** Max fret span the hand can stretch across simultaneously. */
  readonly maxFretSpan: number;
  /** Penalty per fret of stretch within a chord. */
  readonly stretchWeight: number;
  /** Penalty per fret above the open position (higher = harder to reach). */
  readonly highPositionWeight: number;
}

export const DEFAULT_HAND: HandProfile = {
  maxFretSpan: 4,
  stretchWeight: 1,
  highPositionWeight: 0.2,
};

export interface ChordFingering {
  readonly positions: readonly StringPosition[];
  readonly cost: number;
}

/** Fretted positions (fret > 0) span; open strings (fret 0) ignore the hand. */
function frettedSpan(positions: readonly StringPosition[]): number {
  const frets = positions.filter((p) => p.fret > 0).map((p) => p.fret);
  return frets.length === 0 ? 0 : Math.max(...frets) - Math.min(...frets);
}

function chordCost(positions: readonly StringPosition[], hand: HandProfile): number {
  const span = frettedSpan(positions);
  const highest = positions.reduce((m, p) => Math.max(m, p.fret), 0);
  return span * hand.stretchWeight + highest * hand.highPositionWeight;
}

/** Cartesian product of per-target candidate positions, pruning string collisions early. */
function* assignments(
  candidates: StringPosition[][],
  chosen: StringPosition[],
  usedStrings: Set<number>,
): Generator<StringPosition[]> {
  if (chosen.length === candidates.length) {
    yield [...chosen];
    return;
  }
  for (const pos of candidates[chosen.length] as StringPosition[]) {
    if (usedStrings.has(pos.string)) continue; // one note per string
    usedStrings.add(pos.string);
    chosen.push(pos);
    yield* assignments(candidates, chosen, usedStrings);
    chosen.pop();
    usedStrings.delete(pos.string);
  }
}

/**
 * Up to `k` lowest-cost playable fingerings of a chord (member pitches in cents).
 * Returns [] if any target is unreachable or no assignment satisfies the hand span.
 * Deterministic: same input → same ordered output.
 */
export function fingerChord(
  inst: StringInstrument,
  chordCentsAbs: readonly number[],
  hand: HandProfile = DEFAULT_HAND,
  k = 3,
  toleranceCents = 1,
): ChordFingering[] {
  const candidates = chordCentsAbs.map((c) => positionsFor(inst, c, toleranceCents));
  if (candidates.some((cand) => cand.length === 0)) return []; // a note is unreachable

  const solutions: ChordFingering[] = [];
  for (const a of assignments(candidates, [], new Set())) {
    if (frettedSpan(a) > hand.maxFretSpan) continue;
    solutions.push({ positions: a, cost: chordCost(a, hand) });
  }
  solutions.sort(
    (x, y) =>
      x.cost - y.cost ||
      Math.max(...x.positions.map((p) => p.fret)) - Math.max(...y.positions.map((p) => p.fret)),
  );
  return solutions.slice(0, k);
}

/**
 * Collapse the scale-degree → chord → cent-offsets → fingering pipeline into one call.
 *
 * Socratic Q72: `chordFromScale(scale, tuning, offsets)` builds a `Chord` from
 * scale-local degree indices; `chordToCentOffsets(chord, rootCents)` converts that
 * chord to absolute cent positions on the instrument; `fingerChord(inst, offsets)`
 * returns the physical fingerings.  These three steps — all deterministic given the
 * same inputs — require the caller to thread intermediate values manually.
 * `fingerChordFromScale` closes the pipeline: "given a scale, a tuning, which degrees
 * to voice, an instrument, and where the root sits on that instrument, give me the
 * fingerings in one call."
 *
 * `rootCentsOnInstrument` is the position of the chord root in the instrument's
 * internal cents coordinate system (e.g. 0c = low-E open on a standard guitar;
 * 500c = A string open).  Defaults to 0 (root at the lowest open string).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if any offset is outside `[0, scale.degreeIndices.length)`.
 * @throws {RangeError} if `offsets` is empty.
 *
 * @example
 * const guitar = guitarStandard();
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-edo',
 *                         degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * // Triad on scale degrees 1, 3, 5 with the root at A string (500c)
 * const fingerings = fingerChordFromScale(major, edo(12), [0, 2, 4], guitar, 500);
 */
export function fingerChordFromScale(
  scale: Scale,
  tuning: TuningSystem,
  offsets: readonly number[],
  inst: StringInstrument,
  rootCentsOnInstrument = 0,
  hand: HandProfile = DEFAULT_HAND,
  k = 3,
  toleranceCents = 1,
  name?: string,
): ChordFingering[] {
  const chord = chordFromScale(scale, tuning, offsets, name);
  const centOffsets = chordToCentOffsets(chord, rootCentsOnInstrument);
  return fingerChord(inst, centOffsets, hand, k, toleranceCents);
}
