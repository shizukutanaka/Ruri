/** Chord fingering for fretted instruments: assign one position per target, minimize cost. */

import { type StringInstrument, type StringPosition, positionsFor } from './instrument.js';

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
