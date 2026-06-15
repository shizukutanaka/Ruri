import { type TuningSystem, degreeToFreq } from './tuning.js';
import { centsToFreqFactor } from './cents.js';
import { chordDissonance } from './dissonance.js';
import { chordPeriodicity } from './harmonicity.js';
import { type Spectrum, harmonicSpectrum } from './spectrum.js';
import { degreeToCents } from './tuning.js';
import { voiceLeadingCost } from './voice-leading.js';
import { type Chord, realizeChordFreqs } from './chord.js';
import { strikeChord, type ModalOptions, DEFAULT_MODAL } from './modal-synth.js';
import { pluckChord, type KsOptions, DEFAULT_KS } from './ks-synth.js';

export interface RankedChord {
  /** Degree indices within one period, ascending, starting at the chord's root degree offset 0..n-1 — store absolute degree indices. */
  readonly degrees: readonly number[];
  readonly cents: readonly number[];
  /**
   * Sethares roughness of the realized chord (lower = smoother).
   * TIMBRE-DEPENDENT: computed from the supplied `spectrum`. A bell spectrum
   * yields different roughness — and therefore a different ranking — than a
   * harmonic one. This is the library's "consonance is timbre-dependent" axis.
   */
  readonly roughness: number;
  /**
   * Stolzenburg relative periodicity (lower = more harmonic).
   * TIMBRE-INDEPENDENT: `chordPeriodicity` reads frequencies only and snaps their
   * ratios to nearby just intervals — it implicitly assumes a harmonic series and
   * ignores `spectrum`. Blending it into `score` (via `periodicityWeight`) mixes a
   * timbre-independent axis with the timbre-dependent roughness; set
   * `periodicityWeight: 0` for a purely timbre-dependent ranking.
   */
  readonly periodicity: number;
  /** Combined rank score, lower is better. See `periodicityWeight` for the timbre caveat. */
  readonly score: number;
}

export interface ChordSearchOptions {
  /** Chord cardinality (number of notes), default 3. */
  readonly size?: number;
  /** Root frequency for realization, default tuning reference (degree 0). */
  readonly rootHz?: number;
  /**
   * Instrument spectrum used for the roughness axis. Default `harmonicSpectrum()`.
   * NOTE: passing a different spectrum (e.g. `bellSpectrum()`) changes only the
   * roughness term, not the periodicity term — periodicity is timbre-independent.
   */
  readonly spectrum?: Spectrum;
  /**
   * Weight of normalized periodicity vs normalized roughness in score, 0..1, default 0.5.
   * `0` = purely timbre-dependent (roughness only, honours `spectrum`);
   * `1` = purely timbre-independent (periodicity only, ignores `spectrum`).
   * The 0.5 default deliberately blends the two; document this when reporting rankings.
   */
  readonly periodicityWeight?: number;
  /** Max results, default 10. */
  readonly limit?: number;
}

/**
 * Compute binomial coefficient C(n, k) without overflow for moderate values.
 * Returns Infinity if the result exceeds Number.MAX_SAFE_INTEGER.
 */
function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  // Use the smaller of k and n-k for efficiency
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < kk; i++) {
    result = (result * (n - i)) / (i + 1);
    if (result > 20001) return result; // early exit if we know it's too large
  }
  return Math.round(result);
}

/**
 * Generate all combinations of `k` elements from `pool`, each combination
 * sorted ascending. Yields arrays.
 */
function* combinations(pool: readonly number[], k: number): Generator<number[]> {
  const n = pool.length;
  if (k === 0) {
    yield [];
    return;
  }
  if (k > n) return;
  const indices = Array.from({ length: k }, (_, i) => i);
  yield indices.map((i) => pool[i] as number);
  while (true) {
    let i = k - 1;
    while (i >= 0 && indices[i] === n - k + i) {
      i--;
    }
    if (i < 0) return;
    (indices[i] as number)++;
    const base = (indices[i] as number) + 1;
    for (let j = i + 1; j < k; j++) {
      indices[j] = base + (j - i - 1);
    }
    yield indices.map((idx) => pool[idx] as number);
  }
}

/** Enumerate all size-element degree subsets containing degree 0 (root-position voicings within one period), score each, return ascending by score. */
export function rankChords(tuning: TuningSystem, opts?: ChordSearchOptions): RankedChord[] {
  const size = opts?.size ?? 3;
  const rootHz = opts?.rootHz ?? tuning.referenceHz;
  const spectrum = opts?.spectrum ?? harmonicSpectrum();
  const periodicityWeight = opts?.periodicityWeight ?? 0.5;
  const limit = opts?.limit ?? 10;

  const n = tuning.degrees.length;

  // Validate inputs
  if (!Number.isInteger(size) || size < 2) {
    throw new RangeError(`size must be an integer >= 2, got ${size}`);
  }
  if (size > n) {
    throw new RangeError(`size (${size}) must be <= tuning degree count (${n})`);
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be an integer >= 1, got ${limit}`);
  }
  if (periodicityWeight < 0 || periodicityWeight > 1) {
    throw new RangeError(`periodicityWeight must be in [0,1], got ${periodicityWeight}`);
  }

  // Combinatorial blowup guard: C(n-1, size-1) subsets (degree 0 fixed)
  const combCount = binomial(n - 1, size - 1);
  if (combCount > 20000) {
    throw new RangeError(
      `C(${n - 1}, ${size - 1}) = ${Math.round(combCount)} > 20000: combinatorial blowup, reduce size or use a smaller tuning`,
    );
  }

  // The scale factor from degree-0 freq to desired rootHz
  const refFreq = degreeToFreq(tuning, 0);
  const scale = rootHz / refFreq;

  // Non-root degrees available to combine
  const nonRootDegrees = Array.from({ length: n - 1 }, (_, i) => i + 1);

  // Collect all candidates
  interface Candidate {
    degrees: number[];
    cents: number[];
    roughness: number;
    periodicity: number;
  }

  const candidates: Candidate[] = [];

  for (const rest of combinations(nonRootDegrees, size - 1)) {
    const degrees = [0, ...rest];
    const freqs = degrees.map((d) => degreeToFreq(tuning, d) * scale);
    const cents = degrees.map((d) => degreeToCents(tuning, d));

    const roughness = chordDissonance(freqs, spectrum);
    const periodicity = chordPeriodicity(freqs);

    candidates.push({ degrees, cents, roughness, periodicity });
  }

  if (candidates.length === 0) {
    return [];
  }

  // Min-max normalize roughness and periodicity to [0,1]
  let minR = Infinity;
  let maxR = -Infinity;
  let minP = Infinity;
  let maxP = -Infinity;

  for (const c of candidates) {
    if (c.roughness < minR) minR = c.roughness;
    if (c.roughness > maxR) maxR = c.roughness;
    if (c.periodicity < minP) minP = c.periodicity;
    if (c.periodicity > maxP) maxP = c.periodicity;
  }

  const rangeR = maxR - minR;
  const rangeP = maxP - minP;

  const w = periodicityWeight;

  // Build RankedChord array with scores.
  // Periodicity can be Infinity when lcm overflows for chords with very inharmonic ratios
  // (all denominators in the approxRatio convergents are large and coprime). In that case
  // assign periodicityNorm = 1 (worst possible) so the chord ranks last on that axis
  // rather than producing a NaN score from Infinity arithmetic.
  const ranked: RankedChord[] = candidates.map((c) => {
    const roughnessNorm = rangeR === 0 ? 0 : (c.roughness - minR) / rangeR;
    const periodicityNorm =
      rangeP === 0 || !Number.isFinite(c.periodicity)
        ? !Number.isFinite(c.periodicity)
          ? 1
          : 0
        : (c.periodicity - minP) / rangeP;
    const score = (1 - w) * roughnessNorm + w * periodicityNorm;
    return {
      degrees: c.degrees,
      cents: c.cents,
      roughness: c.roughness,
      periodicity: c.periodicity,
      score,
    };
  });

  // Sort ascending by score; ties broken by lexicographic degree sequence
  ranked.sort((a, b) => {
    const ds = a.score - b.score;
    if (ds !== 0) return ds;
    for (let i = 0; i < a.degrees.length && i < b.degrees.length; i++) {
      const diff = (a.degrees[i] as number) - (b.degrees[i] as number);
      if (diff !== 0) return diff;
    }
    return a.degrees.length - b.degrees.length;
  });

  return ranked.slice(0, limit);
}

/**
 * Realize a `RankedChord` as absolute frequencies (Hz) at the given root.
 *
 * `RankedChord.cents` are root-relative intervals (cents[0] is always 0).
 * This is the bridge from the ranking layer into the frequency world:
 * feed the result to `voiceLeadingCost`, `chordDissonance`, `pluck`, or any
 * export that speaks Hz — without manual cents→Hz arithmetic.
 *
 * @example
 * const chords = rankChords(tuning, { size: 3 });
 * const freqsA = realizeRankedChordFreqs(chords[0]!, 261.63);
 * const freqsB = realizeRankedChordFreqs(chords[1]!, 261.63);
 * const smoothness = voiceLeadingCost(freqsA, freqsB);
 */
export function realizeRankedChordFreqs(chord: RankedChord, rootHz: number): number[] {
  return chord.cents.map((c) => rootHz * centsToFreqFactor(c));
}

/**
 * Total minimal voice-leading cost (in cents) across a chord progression.
 *
 * Sums pairwise `voiceLeadingCost` for consecutive chord pairs in the sequence.
 * Lower is smoother. Returns 0 for sequences shorter than 2 chords.
 *
 * All chords must have the same voice count (same `cents` length); mismatched
 * sizes throw a `RangeError` via `voiceLeadingCost`.
 *
 * @example
 * const chords = rankChords(tuning, { size: 3, limit: 4 });
 * const cost = progressionSmoothness(chords, 261.63);
 * // chords[0]→[1]→[2]→[3] total voice-leading cost — pick the ordering with lowest cost
 */
export function progressionSmoothness(chords: readonly RankedChord[], rootHz: number): number {
  if (chords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < chords.length; i++) {
    total += voiceLeadingCost(
      realizeRankedChordFreqs(chords[i - 1]!, rootHz),
      realizeRankedChordFreqs(chords[i]!, rootHz),
    );
  }
  return total;
}

/**
 * Total minimal voice-leading cost (in cents) across a progression of portable `Chord` objects.
 *
 * Mirrors `progressionSmoothness` but accepts `Chord[]` (the portable representation
 * returned by `rankedChordToChord`) rather than `RankedChord[]`. This closes the
 * abstraction gap: after lifting `RankedChord → Chord`, the chord sequence should
 * remain usable for progression evaluation without re-converting back.
 *
 * All chords must have the same interval count; mismatched sizes throw via `voiceLeadingCost`.
 *
 * @example
 * const ranked = rankChords(tuning, { size: 3, limit: 4 });
 * const portable = ranked.map(r => rankedChordToChord(r));
 * const cost = chordProgressionSmoothness(portable, 261.63);
 */
export function chordProgressionSmoothness(chords: readonly Chord[], rootHz: number): number {
  if (chords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < chords.length; i++) {
    total += voiceLeadingCost(
      realizeChordFreqs(chords[i - 1]!, rootHz),
      realizeChordFreqs(chords[i]!, rootHz),
    );
  }
  return total;
}

/**
 * Convert a `RankedChord` (tuning-discovery output) to a portable `Chord`
 * (root-relative interval representation).
 *
 * `RankedChord.cents` are already root-relative (cents[0] = 0), so this is
 * a direct lift — no arithmetic required. The result can be used anywhere a
 * `Chord` is accepted: `realizeChordFreqs`, `chordToCentOffsets → fingerChord`,
 * `writeScl`, or storage as a named voicing independent of any specific tuning.
 *
 * Closes the round-trip: `rankChords → rankedChordToChord → Chord → ...`
 */
export function rankedChordToChord(ranked: RankedChord, name?: string): Chord {
  return {
    name: name ?? `chord-${ranked.degrees.join('-')}`,
    intervals: ranked.cents.map((c) => ({ kind: 'cents' as const, cents: c })),
  };
}

/** Result of `optimalChordOrder`. */
export interface OptimalProgressionResult {
  /** The chords in the optimal (minimal voice-leading cost) order. */
  readonly chords: readonly Chord[];
  /** Indices into the original input array that define the optimal order. */
  readonly order: readonly number[];
  /** Total voice-leading cost in cents across the optimized progression. */
  readonly totalCents: number;
}

/**
 * Enumerate all permutations of an index array (used for brute-force n ≤ 8).
 * Heap's algorithm avoids allocating new arrays per recursive call.
 */
function* allPermutations(pool: number[]): Generator<readonly number[]> {
  const n = pool.length;
  const c = new Array<number>(n).fill(0);
  yield pool;
  let i = 0;
  while (i < n) {
    if ((c[i] as number) < i) {
      if (i % 2 === 0) {
        const t = pool[0] as number;
        pool[0] = pool[i] as number;
        pool[i] = t;
      } else {
        const t = pool[c[i] as number] as number;
        pool[c[i] as number] = pool[i] as number;
        pool[i] = t;
      }
      yield pool;
      (c[i] as number)++;
      i = 0;
    } else {
      c[i] = 0;
      i++;
    }
  }
}

/**
 * Nearest-neighbour heuristic for n > 8. Tries every starting chord and keeps
 * the shortest greedy tour. O(n³) but n > 8 chord progressions are unusual.
 */
function nearestNeighborOrder(
  freqsList: ReadonlyArray<readonly number[]>,
  startIdx: number,
): number[] {
  const n = freqsList.length;
  const visited = new Set<number>([startIdx]);
  const order = [startIdx];
  let current = startIdx;
  while (visited.size < n) {
    let bestNext = -1;
    let bestCost = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited.has(j)) {
        const cost = voiceLeadingCost(freqsList[current] as number[], freqsList[j] as number[]);
        if (cost < bestCost) {
          bestCost = cost;
          bestNext = j;
        }
      }
    }
    if (bestNext < 0) break;
    visited.add(bestNext);
    order.push(bestNext);
    current = bestNext;
  }
  return order;
}

const BRUTE_FORCE_LIMIT = 8;

/**
 * Find the permutation of `chords` that minimises total voice-leading cost.
 *
 * Socratic Q50: `progressionSmoothness` can *measure* the smoothness of a given
 * sequence, but the input order is arbitrary (determined by `rankChords` scoring,
 * not by voice-leading between consecutive pairs). The library should be able to
 * *optimise* that order once it can measure it.
 *
 * Algorithm:
 * - n ≤ 8 chords: exhaustive search over all n! orderings (Heap's algorithm).
 *   40320 max iterations, negligible cost.
 * - n > 8 chords: nearest-neighbour greedy from every starting point; keeps
 *   the best tour found. Heuristic, not guaranteed optimal, but O(n³).
 *
 * Voice-leading cost between any pair is symmetric (`|A→B| = |B→A|`), so the
 * result is the globally optimal *path* (open tour), not a cycle.
 */
export function optimalChordOrder(
  chords: readonly Chord[],
  rootHz: number,
): OptimalProgressionResult {
  if (chords.length === 0) return { chords: [], order: [], totalCents: 0 };
  if (chords.length === 1) {
    return { chords: [chords[0]!], order: [0], totalCents: 0 };
  }

  const freqsList = chords.map((c) => realizeChordFreqs(c, rootHz));
  const n = chords.length;

  let bestOrder: readonly number[] = Array.from({ length: n }, (_, i) => i);
  let bestCost = Infinity;

  if (n <= BRUTE_FORCE_LIMIT) {
    const pool = Array.from({ length: n }, (_, i) => i);
    for (const perm of allPermutations(pool)) {
      let cost = 0;
      for (let i = 1; i < perm.length; i++) {
        cost += voiceLeadingCost(
          freqsList[perm[i - 1] as number] as number[],
          freqsList[perm[i] as number] as number[],
        );
        if (cost >= bestCost) break; // prune: already worse than current best
      }
      if (cost < bestCost) {
        bestCost = cost;
        bestOrder = perm.slice();
      }
    }
  } else {
    for (let start = 0; start < n; start++) {
      const order = nearestNeighborOrder(freqsList, start);
      let cost = 0;
      for (let i = 1; i < order.length; i++) {
        cost += voiceLeadingCost(
          freqsList[order[i - 1] as number] as number[],
          freqsList[order[i] as number] as number[],
        );
      }
      if (cost < bestCost) {
        bestCost = cost;
        bestOrder = order;
      }
    }
  }

  return {
    chords: bestOrder.map((i) => chords[i]!),
    order: bestOrder,
    totalCents: bestCost,
  };
}

/**
 * Synthesize a `RankedChord` directly to audio in one call.
 *
 * Socratic Q55: `rankChords` produces `RankedChord[]`, which is the library's
 * first-class chord-discovery output. Going from a `RankedChord` to audio requires
 * two steps today: `realizeRankedChordFreqs(chord, rootHz)` → `strikeChord(freqs, spectrum)`.
 * If `RankedChord` is truly first-class, it should be auditionable in one call.
 *
 * Closes the pipeline: `rankChords → strikeRankedChord → encodeWav` (or direct playback).
 *
 * @example
 * const [best] = rankChords(tuning, { size: 3 });
 * const audio = strikeRankedChord(best!, 261.63, harmonicSpectrum());
 * const wav = encodeWav(audio); // fully ready in 2 lines from discovery to file
 */
export function strikeRankedChord(
  chord: RankedChord,
  rootHz: number,
  spectrum: Spectrum,
  opts: ModalOptions = DEFAULT_MODAL,
): Float32Array {
  return strikeChord(realizeRankedChordFreqs(chord, rootHz), spectrum, opts);
}

/**
 * Synthesize a `RankedChord` via Karplus-Strong (plucked string) in one call.
 *
 * Socratic Q67: `strikeRankedChord` plays a `RankedChord` with modal additive
 * synthesis (bells/metallic timbres), but its Karplus-Strong analog — plucking
 * a `RankedChord` — is missing. Going from a `RankedChord` to a plucked audio
 * buffer currently requires two explicit steps:
 * `realizeRankedChordFreqs(chord, rootHz)` → `pluckChord(freqs, opts)`.
 * `pluckRankedChord` closes that gap: if `RankedChord` is truly first-class,
 * it should be auditionable with *any* synthesis engine in one call.
 *
 * Closes the pipeline: `rankChords → pluckRankedChord → encodeWav`.
 *
 * @example
 * const [best] = rankChords(tuning, { size: 3 });
 * const audio = pluckRankedChord(best!, 261.63);
 * const wav = encodeWav(audio); // plucked chord from discovery to WAV in 2 lines
 */
export function pluckRankedChord(
  chord: RankedChord,
  rootHz: number,
  opts: KsOptions = DEFAULT_KS,
): Float32Array {
  return pluckChord(realizeRankedChordFreqs(chord, rootHz), opts);
}
