import { CENTS_PER_OCTAVE, ratio } from './ratio.js';
import { type Pitch, centsToFreqFactor, pitchToCents, fromRatio, freqToCents } from './cents.js';
import { type TuningSystem, degreeToCents } from './tuning.js';

/** A chord as root-relative intervals (instrument-independent). */
export interface Chord {
  readonly name: string;
  /** Intervals from the root, ascending. Include the unison (0c) as the root. */
  readonly intervals: readonly Pitch[];
}

/** Realize a chord at an absolute root frequency → member frequencies (Hz). */
export function realizeChordFreqs(chord: Chord, rootHz: number): number[] {
  return chord.intervals.map((iv) => rootHz * centsToFreqFactor(pitchToCents(iv)));
}

/** Chord intervals in cents from the root. */
export function chordToCents(chord: Chord): number[] {
  return chord.intervals.map(pitchToCents);
}

/**
 * Chord member pitches as absolute cents on an instrument, given the root's
 * instrument-cent position.
 *
 * This is the bridge from the `Chord` type (root-relative intervals) into the
 * instrument coordinate system that `fingerChord` speaks. `StringInstrument`
 * deliberately has no Hz anchor (instruments are transposable), so the caller
 * supplies `rootCentsOnInstrument` — the position of the chord root in the
 * instrument's local cents space (e.g. 800c for the 5th string of a guitar
 * tuned EADGBE, where string 0 open = 0c).
 *
 * @example
 * const guitar = guitarStandard();
 * const major = chordFromSemitones('major', [0, 4, 7]);
 * // A2 string on guitar: string 1, fret 0 → openStringsCents[1] = 500c
 * const fingerings = fingerChord(guitar, chordToCentOffsets(major, 500));
 */
export function chordToCentOffsets(chord: Chord, rootCentsOnInstrument: number): number[] {
  return chordToCents(chord).map((c) => c + rootCentsOnInstrument);
}

const SEMITONE = CENTS_PER_OCTAVE / 12;

/** Build a 12-TET chord from semitone offsets, e.g. major triad = [0, 4, 7]. */
export function chordFromSemitones(name: string, semitones: readonly number[]): Chord {
  return {
    name,
    intervals: semitones.map((s) => ({ kind: 'cents' as const, cents: s * SEMITONE })),
  };
}

/**
 * Build a just-intonation chord from exact integer ratios.
 *
 * Ratios are stored as primary representation (not converted to cents), preserving
 * the precision guarantee stated in the design principles: "比が一次、centsは導出".
 *
 * The first ratio should be `[1, 1]` (the unison root). `realizeChordFreqs` and
 * `chordToCents` both work from ratios without loss of precision.
 *
 * @example
 * // Pure 5-limit major triad: 1/1, 5/4, 3/2
 * const justMajor = chordFromRatios('just-major', [[1,1],[5,4],[3,2]]);
 * // chordToCents(justMajor)[1] ≈ 386.31c  (vs. 400c in 12-TET)
 */
export function chordFromRatios(
  name: string,
  ratios: ReadonlyArray<readonly [number, number]>,
): Chord {
  return {
    name,
    intervals: ratios.map(([n, d]) => fromRatio(ratio(n as number, d as number))),
  };
}

/**
 * Pairwise interval matrix in cents for a set of realized frequencies.
 *
 * Socratic Q84: `realizeChordFreqs(chord, rootHz)` gives the member Hz values,
 * and `freqToCents(fHi, fLo)` converts a pair to an interval — but computing the
 * full matrix of pairwise intervals for a realized chord still requires a manual
 * double-loop. If a realized chord is truly first-class, every pairwise interval
 * should be retrievable in one call.
 *
 * `matrix[i][j]` = cents from `freqs[i]` to `freqs[j]` =
 * `freqToCents(freqs[j], freqs[i])`. Positive when `j` is higher in pitch.
 *
 * Properties:
 * - Diagonal is always 0 (a frequency is 0 cents from itself).
 * - Antisymmetric: `matrix[i][j] === -matrix[j][i]`.
 *
 * @example
 * // Octave dyad: [261.63, 523.26] Hz → 1200c apart
 * const m = realizedFreqIntervalMatrix([261.63, 523.26]);
 * // m[0][1] ≈ 1200, m[1][0] ≈ -1200, m[0][0] === 0, m[1][1] === 0
 *
 * @throws {RangeError} if `freqs` is empty or any frequency is ≤ 0.
 */
export function realizedFreqIntervalMatrix(freqs: readonly number[]): number[][] {
  if (freqs.length === 0)
    throw new RangeError('realizedFreqIntervalMatrix: freqs must be non-empty');
  for (let i = 0; i < freqs.length; i++) {
    if (!Number.isFinite(freqs[i] as number) || (freqs[i] as number) <= 0) {
      throw new RangeError(
        `realizedFreqIntervalMatrix: freqs[${i}] must be a positive finite number, got ${freqs[i]}`,
      );
    }
  }
  const n = freqs.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => freqToCents(freqs[j] as number, freqs[i] as number)),
  );
}

/**
 * Structural similarity between two chords based on their realized pairwise intervals.
 *
 * Socratic Q87: `realizedFreqIntervalMatrix` gives the full interval matrix for a
 * realized chord — but comparing two chords to see "how similar they sound" still
 * requires computing both matrices and writing a bespoke distance formula. If `Chord`
 * is truly first-class, comparing two chords structurally should be one call.
 *
 * Computes the realized interval matrices for `a` and `b` at `rootHz`, then measures
 * their structural closeness as the mean absolute difference (in cents) across all
 * upper-triangle pairs, normalized into a 0–1 similarity score via:
 * `similarity = 1 / (1 + meanAbsCentsDiff / 100)`.
 *
 * Properties:
 * - Returns 1.0 when both chords have identical interval structures.
 * - Decreases toward 0 as the mean interval deviation grows.
 * - Uses only the **upper-triangle** pairs (i < j) to avoid double-counting.
 * - If the chords have different numbers of voices, the comparison is over the
 *   smaller chord's matrix size; extra voices in the larger chord are ignored.
 *
 * @param a - First chord.
 * @param b - Second chord.
 * @param rootHz - Root frequency used to realize both chords. Must be > 0.
 * @returns Similarity in [0, 1]: 1 = identical structure, 0 = maximally distant.
 *
 * @throws {RangeError} if either chord has no intervals or `rootHz` ≤ 0.
 *
 * @example
 * // 12-TET major triad vs JI major triad — very similar interval structure
 * const tetMaj = chordFromSemitones('tet-major', [0, 4, 7]);
 * const jiMaj = chordFromRatios('ji-major', [[1,1],[5,4],[3,2]]);
 * const sim = chordSimilarity(tetMaj, jiMaj, 261.63);
 * // sim ≈ 0.93 (JI third = 386.31c vs TET 400c; JI fifth = 701.96c vs TET 700c)
 */
export function chordSimilarity(a: Chord, b: Chord, rootHz: number): number {
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(`chordSimilarity: rootHz must be a positive finite number, got ${rootHz}`);
  }
  if (a.intervals.length === 0 || b.intervals.length === 0) {
    throw new RangeError('chordSimilarity: chords must have at least one interval');
  }
  const freqsA = realizeChordFreqs(a, rootHz);
  const freqsB = realizeChordFreqs(b, rootHz);
  const matA = realizedFreqIntervalMatrix(freqsA);
  const matB = realizedFreqIntervalMatrix(freqsB);
  const n = Math.min(freqsA.length, freqsB.length);
  if (n < 2) return 1; // single-note "chords" are trivially identical
  let totalDiff = 0;
  let pairCount = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      totalDiff += Math.abs(
        ((matA[i] as number[])[j] as number) - ((matB[i] as number[])[j] as number),
      );
      pairCount++;
    }
  }
  const meanAbsDiff = totalDiff / pairCount;
  return 1 / (1 + meanAbsDiff / 100);
}

/**
 * Frequency ratios of all chord members relative to the root.
 *
 * Socratic Q94: `realizeChordFreqs(chord, rootHz)` produces absolute Hz values —
 * but the root-normalized ratio representation (how far each note is from the root
 * as a dimensionless multiplier) still requires a manual map. If `Chord` is truly
 * first-class, obtaining its ratio vector should be one call.
 *
 * Each element is `realizeChordFreqs(chord, rootHz)[i] / rootHz`, i.e., the
 * frequency ratio of member `i` relative to the root. The first element is always
 * exactly 1.0 (the root unison).
 *
 * This is the inverse of `chordFromRatios`: `chordToFreqRatios` converts a `Chord`
 * (whose intervals may be stored as cents, ratios, or both) to a canonical float
 * ratio vector without loss of the primary representation.
 *
 * @param chord - The chord to convert.
 * @param rootHz - Reference root frequency used to realize the chord (must be > 0).
 *   Because ratios are dimensionless, any positive value produces the same result.
 * @returns `number[]` of length `chord.intervals.length`; element 0 is always 1.0.
 *
 * @throws {RangeError} if `rootHz` ≤ 0.
 *
 * @example
 * // Just major triad: [1, 1.25, 1.5] (i.e. 1/1, 5/4, 3/2)
 * const jiMaj = chordFromRatios('ji-major', [[1,1],[5,4],[3,2]]);
 * chordToFreqRatios(jiMaj, 261.63); // → [1, 1.25, 1.5]
 *
 * @example
 * // 12-TET major triad: [1, 2^(4/12), 2^(7/12)]
 * const tetMaj = chordFromSemitones('major', [0, 4, 7]);
 * const ratios = chordToFreqRatios(tetMaj, 440);
 * ratios[1]; // ≈ 1.2599 (12-TET major third)
 */
export function chordToFreqRatios(chord: Chord, rootHz: number): number[] {
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(
      `chordToFreqRatios: rootHz must be a positive finite number, got ${rootHz}`,
    );
  }
  return realizeChordFreqs(chord, rootHz).map((f) => f / rootHz);
}

/**
 * Build a chord from degree indices into a `TuningSystem`.
 *
 * `chordFromSemitones` only makes sense for 12-TET (1 semitone = 100c).
 * For 19-EDO, Makam, or any other tuning, use this factory: the intervals
 * are computed from the tuning's exact degree positions and made root-relative
 * (the first degree's cents are subtracted from all entries).
 *
 * @example
 * // Major-ish triad in 19-EDO (steps 0, 6, 11)
 * const chord = chordFromDegrees(edo(19), [0, 6, 11], 'major-19edo');
 */
export function chordFromDegrees(
  tuning: TuningSystem,
  degreeIndices: readonly number[],
  name?: string,
): Chord {
  if (degreeIndices.length === 0) throw new RangeError('degreeIndices must be non-empty');
  const rootCents = degreeToCents(tuning, degreeIndices[0] as number);
  return {
    name: name ?? `chord-${degreeIndices.join('-')}`,
    intervals: degreeIndices.map((d) => ({
      kind: 'cents' as const,
      cents: degreeToCents(tuning, d) - rootCents,
    })),
  };
}
