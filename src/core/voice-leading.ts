import { freqToCents } from './cents.js';
import { type Chord, realizeChordFreqs } from './chord.js';

/** A single voice assignment from one chord to another. */
export interface VoiceAssignment {
  /** Index into fromFreqs. */
  readonly from: number;
  /** Index into toFreqs. */
  readonly to: number;
  /** Signed motion in cents (positive = upward). */
  readonly motionCents: number;
}

/** Result of minimal voice-leading between two equal-size chords. */
export interface VoiceLeading {
  readonly assignments: readonly VoiceAssignment[];
  /** Sum of |motionCents| over all assignments. */
  readonly totalCents: number;
  /** Largest single |motionCents|. */
  readonly maxCents: number;
}

/**
 * Validate that a frequency array is non-empty, has length <= 12, and that all
 * values are finite and strictly positive.
 */
function validateFreqs(freqs: readonly number[], label: string): void {
  if (freqs.length === 0) {
    throw new RangeError(`${label} must be non-empty`);
  }
  if (freqs.length > 12) {
    throw new RangeError(
      `${label} length ${freqs.length} exceeds maximum 12 (practical musical limit; ` +
        `voice-leading uses O(n log n) sorting, but 12+ simultaneous voices is uncommon in practice)`,
    );
  }
  for (let i = 0; i < freqs.length; i++) {
    const f = freqs[i] as number;
    if (!Number.isFinite(f) || f <= 0) {
      throw new RangeError(`${label}[${i}] must be a finite positive number, got ${f}`);
    }
  }
}

/**
 * Optimal one-to-one voice-leading minimising total absolute cents motion.
 * Requires equal voice counts (throws RangeError otherwise).
 *
 * KEY FACT (exchange argument): for one-to-one matching between two sets of
 * points on a (log-frequency) line where cost = Σ |x_i − y_σ(i)|, the optimal
 * assignment pairs the i-th smallest source with the i-th smallest target.
 * Proof sketch: if two pairs "cross" (from_a < from_b but to_σ(a) > to_σ(b)),
 * swapping the targets cannot increase total cost (|a−p|+|b−q| ≥ |a−q|+|b−p|
 * when a ≤ b and q ≤ p). Repeating eliminates all crossings → sorted order is
 * optimal. No Hungarian algorithm needed.
 *
 * Deterministic tie-breaking: stable sort by (freq, originalIndex) ascending.
 */
export function minimalVoiceLeading(
  fromFreqs: readonly number[],
  toFreqs: readonly number[],
): VoiceLeading {
  validateFreqs(fromFreqs, 'fromFreqs');
  validateFreqs(toFreqs, 'toFreqs');
  if (fromFreqs.length !== toFreqs.length) {
    throw new RangeError(
      `fromFreqs length (${fromFreqs.length}) must equal toFreqs length (${toFreqs.length})`,
    );
  }

  const n = fromFreqs.length;

  // Build index arrays, sort each by (freq ascending, original index ascending)
  // for deterministic tie-breaking.
  const fromOrder = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    const fa = fromFreqs[a] as number;
    const fb = fromFreqs[b] as number;
    return fa !== fb ? fa - fb : a - b;
  });

  const toOrder = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    const fa = toFreqs[a] as number;
    const fb = toFreqs[b] as number;
    return fa !== fb ? fa - fb : a - b;
  });

  // Pair i-th sorted-from with i-th sorted-to (optimal by exchange argument).
  // Collect results indexed by original `from` index for deterministic output.
  const rawAssignments: VoiceAssignment[] = Array.from({ length: n }, (_, rank) => {
    const fromIdx = fromOrder[rank] as number;
    const toIdx = toOrder[rank] as number;
    const fromHz = fromFreqs[fromIdx] as number;
    const toHz = toFreqs[toIdx] as number;
    // freqToCents(hz, referenceHz) = 1200 * log2(hz / referenceHz)
    const motionCents = freqToCents(toHz, fromHz);
    return { from: fromIdx, to: toIdx, motionCents };
  });

  // Sort by `from` index ascending for deterministic output.
  rawAssignments.sort((a, b) => a.from - b.from);

  let totalCents = 0;
  let maxCents = 0;
  for (const a of rawAssignments) {
    const abs = Math.abs(a.motionCents);
    totalCents += abs;
    if (abs > maxCents) maxCents = abs;
  }

  return { assignments: rawAssignments, totalCents, maxCents };
}

/**
 * Convenience function: total minimal motion cost in cents (lower = smoother).
 * Equivalent to `minimalVoiceLeading(fromFreqs, toFreqs).totalCents`.
 */
export function voiceLeadingCost(fromFreqs: readonly number[], toFreqs: readonly number[]): number {
  return minimalVoiceLeading(fromFreqs, toFreqs).totalCents;
}

/**
 * Pairwise voice-leading cost matrix for a list of chords.
 *
 * Socratic Q92: `voiceLeadingCost(realizeChordFreqs(a, rootHz), realizeChordFreqs(b, rootHz))`
 * gives the motion cost between two chords, but analysing all pairs in a
 * collection — e.g. to find the globally smoothest ordering — still requires a
 * nested loop over `realizeChordFreqs` calls. If `Chord` is first-class, the
 * full pairwise cost matrix should be one call.
 *
 * Returns a symmetric `n × n` matrix where `matrix[i][j]` is the minimal
 * voice-leading cost (in cents) from `chords[i]` to `chords[j]`. Diagonal
 * entries are 0 (a chord costs nothing to "move" to itself). Only chords with
 * equal voice counts can be compared; pairs with different voice counts are set
 * to `Infinity`.
 *
 * Useful for: finding cheapest transitions, building weighted graphs for chord
 * scheduling, visualizing voice-leading distances between all chord pairs.
 *
 * @example
 * const chords = [tonic, subdominant, dominant];
 * const mat = voiceLeadingMatrix(chords, 261.63);
 * // mat[0][2] — cost of moving from tonic directly to dominant
 * // mat[2][0] — same (matrix is symmetric)
 */
export function voiceLeadingMatrix(chords: readonly Chord[], rootHz: number): number[][] {
  const n = chords.length;
  const realized = chords.map((c) => realizeChordFreqs(c, rootHz));

  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      const from = realized[i] as number[];
      const to = realized[j] as number[];
      if (from.length !== to.length) return Infinity;
      return voiceLeadingCost(from, to);
    }),
  );
}
