import {
  type TuningSystem,
  defineTuning,
  degreeToCents,
  degreeToFreq,
  tuningToIntervalVector,
} from './tuning.js';
import { type Spectrum, harmonicSpectrum } from './spectrum.js';
import { type Pitch, pitchToCents, centsToFreq } from './cents.js';
import { chordDissonance, chordObjectDissonance } from './dissonance.js';
import {
  rankChords,
  type RankedChord,
  type ChordSearchOptions,
  rankedChordToChord,
  optimalChordOrder,
} from './chord-search.js';
import { synthScale, type SynthScaleOptions, DEFAULT_SYNTH_SCALE } from './ks-synth.js';
import { type Chord, chordFromDegrees, realizeChordFreqs } from './chord.js';
import { chordPeriodicity, harmonicityForChord } from './harmonicity.js';
import { voiceLeadingCost } from './voice-leading.js';
/**
 * A scale / mode / jins / raga: an ordered selection of degrees over a tuning.
 * Microtonal cultures are primarily melodic/modal (improvement #3), so this is
 * a first-class layer. Transition grammar (e.g. raga aroha/avaroha) is optional
 * and deferred to a later phase.
 */

export interface Scale {
  readonly id: string;
  readonly name: string;
  readonly tuningId: string;
  /** Indices into the tuning's degrees, ascending. */
  readonly degreeIndices: readonly number[];
}

/**
 * Return whether a `Scale` is compatible with a `TuningSystem` — i.e. the tuning
 * id matches and the scale's degree indices fall within the tuning's degree count.
 *
 * This is the public, non-throwing predicate form of the internal `assertTuningMatch`
 * guard. Use it to validate dynamically constructed `Scale` objects before passing
 * them to functions that will throw on mismatch.
 *
 * @example
 * if (!isScaleCompatible(scale, tuning)) {
 *   console.warn('Scale does not belong to this tuning');
 * }
 */
export function isScaleCompatible(scale: Scale, tuning: TuningSystem): boolean {
  if (scale.tuningId !== tuning.id) return false;
  const n = tuning.degrees.length;
  return scale.degreeIndices.every((d) => Number.isInteger(d) && d >= 0 && d < n);
}

/**
 * Guard: a Scale is only meaningful against the tuning it was authored for.
 * `Scale.tuningId` must equal `tuning.id` (note `edo(12)` is `'12-edo'`, NOT
 * `'12-tet'` — see `edo`'s caveat).
 */
function assertTuningMatch(scale: Scale, tuning: TuningSystem): void {
  if (tuning.id !== scale.tuningId) {
    throw new RangeError(
      `scale '${scale.id}' expects tuning '${scale.tuningId}', got '${tuning.id}'`,
    );
  }
}

/** Cents of each scale step relative to the tuning reference. */

export function scaleToCents(scale: Scale, tuning: TuningSystem): number[] {
  assertTuningMatch(scale, tuning);
  return scale.degreeIndices.map((d) => degreeToCents(tuning, d));
}

/**
 * Absolute frequency (Hz) of each scale step.
 *
 * This is the bridge from the melodic/modal layer into the frequency world the
 * rest of the library speaks: feed the result to `chordDissonance`, `pluck`,
 * `strike`, or MTS/`.tun` export. Degree indices wrap and advance periods
 * exactly as `degreeToFreq` defines, so octave-spanning scales work.
 */
export function scaleToFreqs(scale: Scale, tuning: TuningSystem): number[] {
  assertTuningMatch(scale, tuning);
  return scale.degreeIndices.map((d) => degreeToFreq(tuning, d));
}

/**
 * Create a `Scale` that spans all degrees of a `TuningSystem`.
 *
 * This is the bridge from the generation layer to the modal layer:
 * `tuningToScale(generatedTuning(700, 1200, 7))` returns a Scale that can
 * be passed to `scaleMode`, `scaleToTuning`, or `scaleToCents` directly,
 * without manually constructing `degreeIndices: [0, 1, 2, …, n-1]`.
 */
export function tuningToScale(tuning: TuningSystem, name?: string): Scale {
  return {
    id: `${tuning.id}-scale`,
    name: name ?? tuning.name,
    tuningId: tuning.id,
    degreeIndices: tuning.degrees.map((_, i) => i),
  };
}

/**
 * Extract the `Scale`'s selected degrees as a new `TuningSystem`.
 *
 * This is the bridge from the modal/Scale layer to the full pipeline:
 * `rankChords(scaleToTuning(scale, tuning), opts)` discovers chords built
 * exclusively from the scale's degrees (diatonic chords), rather than
 * searching the entire parent tuning.
 *
 * The resulting sub-tuning inherits `referenceHz`, `periodCents`, `source`,
 * and `region` from the parent; its id is `<scale.id>-tuning`.
 */
export function scaleToTuning(scale: Scale, tuning: TuningSystem): TuningSystem {
  assertTuningMatch(scale, tuning);
  return defineTuning({
    id: `${scale.id}-tuning`,
    name: `${scale.name} (tuning)`,
    referenceHz: tuning.referenceHz,
    periodCents: tuning.periodCents,
    degrees: scale.degreeIndices.map((d) => ({
      kind: 'cents' as const,
      cents: degreeToCents(tuning, d),
    })),
    source: tuning.source,
    ...(tuning.region !== undefined ? { region: tuning.region } : {}),
  });
}

/**
 * Modal rotation: return the scale starting from `modeIndex` (0-based).
 *
 * Fundamental in maqam / raga traditions — e.g. Dorian is Ionian mode 2.
 * The rotated indices are re-zeroed so that the new root's position in the
 * tuning is `degreeIndices[modeIndex]`; higher-octave predecessors are
 * shifted up by one period (`tuning.degrees.length` steps).
 *
 * Invariant: `scaleMode(scale, 0, tuning)` returns an equivalent scale.
 */
export function scaleMode(scale: Scale, modeIndex: number, tuning: TuningSystem): Scale {
  assertTuningMatch(scale, tuning);
  const n = scale.degreeIndices.length;
  if (!Number.isInteger(modeIndex) || modeIndex < 0 || modeIndex >= n) {
    throw new RangeError(`modeIndex must be in [0, ${n - 1}], got ${modeIndex}`);
  }
  const periodDegrees = tuning.degrees.length;
  const rootDegree = scale.degreeIndices[modeIndex] as number;
  const newIndices = [
    ...scale.degreeIndices.slice(modeIndex).map((d) => d - rootDegree),
    ...scale.degreeIndices.slice(0, modeIndex).map((d) => d - rootDegree + periodDegrees),
  ];
  return {
    id: `${scale.id}-mode-${modeIndex + 1}`,
    name: `${scale.name} mode ${modeIndex + 1}`,
    tuningId: scale.tuningId,
    degreeIndices: newIndices,
  };
}

/**
 * Sensory dissonance of all scale degrees sounding simultaneously.
 *
 * Treats the scale as a chord and applies Sethares roughness via the
 * supplied spectrum. Timbre-dependent: a harmonic spectrum yields
 * different rankings than a bell spectrum.
 *
 * Bridge from the modal layer to the acoustic evaluation layer —
 * use with `scaleMode` to compare modal consonance:
 * `scale.degreeIndices.map((_, i) => scaleDissonance(scaleMode(s,i,t), t, sp))`
 */
export function scaleDissonance(scale: Scale, tuning: TuningSystem, spectrum: Spectrum): number {
  assertTuningMatch(scale, tuning);
  return chordDissonance(scaleToFreqs(scale, tuning), spectrum);
}

/** Result entry from `rankModes`. */

export interface RankedMode {
  readonly modeIndex: number;
  readonly scale: Scale;
  readonly dissonance: number;
}

/**
 * Rank all modes of a scale by their sensory dissonance (ascending).
 *
 * Answers: "which mode of this maqam / MOS is most consonant for this spectrum?"
 * Each mode is obtained by `scaleMode(scale, i, tuning)` and scored by
 * `scaleDissonance`. Timbre-dependent: swap `spectrum` to change the ranking.
 */
export function rankModes(scale: Scale, tuning: TuningSystem, spectrum: Spectrum): RankedMode[] {
  assertTuningMatch(scale, tuning);
  return scale.degreeIndices
    .map((_, i) => {
      const mode = scaleMode(scale, i, tuning);
      return { modeIndex: i, scale: mode, dissonance: scaleDissonance(mode, tuning, spectrum) };
    })
    .sort((a, b) => a.dissonance - b.dissonance);
}

/**
 * Return all modal rotations of a scale as a `Scale[]` in one call.
 *
 * Socratic Q106: `scaleMode(scale, i, tuning)` returns one modal rotation at index `i`.
 * Getting all modes requires the caller to write `Array.from({ length: n }, (_, i) => scaleMode(s, i, t))`.
 * If modes are truly first-class — and `rankModes` already computes all of them internally
 * anyway — then "all modal rotations of this scale" should be one call, not a manual
 * comprehension. `scaleModeSeries` closes this gap: call it when you need the full mode
 * series for iteration, display, or bulk comparison without the `RankedMode` wrapper.
 *
 * The returned array is in rotation order (index 0 = original scale, 1 = starting from
 * the second degree, … n−1 = starting from the last degree), matching the indexing of
 * `scaleMode`. Use `rankModes` when you want the modes sorted by dissonance.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const modes = scaleModeSeries(major, equalTemperament12(440));
 * // modes[0] = Ionian, modes[1] = Dorian, modes[2] = Phrygian, ...
 * console.log(modes.map(m => m.name));
 */
export function scaleModeSeries(scale: Scale, tuning: TuningSystem): Scale[] {
  assertTuningMatch(scale, tuning);
  return Array.from({ length: scale.degreeIndices.length }, (_, i) => scaleMode(scale, i, tuning));
}

/**
 * Rank all chord sub-subsets of a `Scale` by timbre-weighted dissonance/periodicity score.
 *
 * Socratic Q57: `rankChords(tuning, opts)` discovers chords from the full tuning's degree
 * pool. But if we already have a `Scale` (a curated subset of degrees, e.g. the diatonic
 * major scale in 12-TET), finding the best triads *within that scale* requires two manual
 * steps: `scaleToTuning(scale, tuning) → rankChords(subTuning, opts)`. A single
 * `rankScaleChords(scale, tuning, opts)` closes this gap:
 * if `Scale` is truly first-class, discovering chords within it should be one call.
 *
 * The `Scale` is projected into a sub-`TuningSystem` (via `scaleToTuning`) so that
 * degree indices in the returned `RankedChord[]` are relative to the scale, not the
 * parent tuning.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`, or if `rankChords` blows up.
 *
 * @example
 * // Best triads within the diatonic major scale (12-TET):
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const triads = rankScaleChords(major, equalTemperament12(440), { size: 3, spectrum: harmonicSpectrum() });
 * // triads[0] is the most consonant 3-note chord drawable from the 7-note major scale.
 */
export function rankScaleChords(
  scale: Scale,
  tuning: TuningSystem,
  opts?: ChordSearchOptions,
): RankedChord[] {
  assertTuningMatch(scale, tuning);
  const subTuning = scaleToTuning(scale, tuning);
  return rankChords(subTuning, opts);
}

/**
 * Synthesize a `Scale` as a melodic sequence (one note at a time) in one call.
 *
 * Socratic Q59: `scaleToFreqs(scale, tuning)` gives Hz per degree, and `synthScale`
 * turns a frequency array into a sequential audio stream — but going from a `Scale`
 * object directly to a melodic audio buffer still requires two explicit steps.
 * If `Scale` is truly first-class, playing it as a melody should be one call:
 * `synthScaleFromScale(scale, tuning) → Float32Array → encodeWav`.
 *
 * Each scale degree is plucked in ascending order via Karplus-Strong; notes are
 * concatenated without overlap. The output is suitable for direct encoding with
 * `encodeWav`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`, or if the scale
 *   has no degrees (empty `degreeIndices`).
 *
 * @example
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const audio = synthScaleFromScale(major, equalTemperament12(440));
 * const wav = encodeWav(audio); // 7-note major scale in one pipeline call
 */
export function synthScaleFromScale(
  scale: Scale,
  tuning: TuningSystem,
  opts: SynthScaleOptions = DEFAULT_SYNTH_SCALE,
): Float32Array {
  assertTuningMatch(scale, tuning);
  const freqs = scaleToFreqs(scale, tuning);
  return synthScale(freqs, opts);
}

/** Result entry from `rankModeChords`. */

export interface RankedModeChords {
  readonly modeIndex: number;
  readonly scale: Scale;
  readonly chords: RankedChord[];
}

/**
 * For each mode of a scale, rank its diatonic chords and return a leaderboard
 * sorted by the best chord's score (most consonant mode first).
 *
 * Socratic Q66: `rankModes(scale, tuning, spectrum)` ranks modal rotations by
 * their aggregate dissonance, and `rankScaleChords(scale, tuning, opts)` ranks
 * chords within a fixed scale — but "which mode gives the best chord options?"
 * requires calling both functions per mode and wiring them together manually.
 * `rankModeChords` closes this gap: for every modal rotation, it discovers the
 * diatonic chord pool and returns a leaderboard ordered by each mode's
 * top-ranked chord's score.
 *
 * @returns One entry per mode, sorted ascending by `chords[0].score`
 *   (lowest score = most consonant best chord = best mode for chords).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-tet',
 *                 degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const leaderboard = rankModeChords(major, equalTemperament12(440));
 * // leaderboard[0] is the mode whose best triad is most consonant.
 * const { modeIndex, scale: bestMode, chords } = leaderboard[0]!;
 */
export function rankModeChords(
  scale: Scale,
  tuning: TuningSystem,
  opts?: ChordSearchOptions,
): RankedModeChords[] {
  assertTuningMatch(scale, tuning);
  const entries: RankedModeChords[] = scale.degreeIndices.map((_, i) => {
    const mode = scaleMode(scale, i, tuning);
    const chords = rankScaleChords(mode, tuning, opts);
    return { modeIndex: i, scale: mode, chords };
  });
  // Sort by the top chord's score (ascending); modes with no chords go last
  entries.sort((a, b) => {
    const aScore = a.chords[0]?.score ?? Infinity;
    const bScore = b.chords[0]?.score ?? Infinity;
    return aScore - bScore;
  });
  return entries;
}

/**
 * Return the most-consonant chord from the most-consonant modal rotation of a scale.
 *
 * Socratic Q68: The full pipeline `rankModes → best mode → rankScaleChords →
 * rankedChordToChord` closes the gap between the modal layer and the chord layer —
 * but it still requires four explicit calls. `chordFromBestMode` collapses that
 * pipeline into a single call: "give me the best triad from the most consonant
 * modal rotation of this scale."
 *
 * The "best mode" is the rotation whose top-ranked diatonic chord has the
 * lowest combined score (via `rankModeChords`). The returned `Chord` is the
 * `rankedChordToChord` lift of that top chord, suitable for use anywhere a
 * `Chord` is accepted.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`, or if no
 *   chords can be found (scale too small for the requested `size`).
 *
 * @example
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-tet',
 *                 degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const { mode, modeIndex, chord } = chordFromBestMode(major, equalTemperament12(440));
 * // chord is the best triad from the most consonant modal rotation
 */
export function chordFromBestMode(
  scale: Scale,
  tuning: TuningSystem,
  size?: number,
  spectrum?: Spectrum,
): { mode: Scale; modeIndex: number; chord: Chord } {
  assertTuningMatch(scale, tuning);
  const opts: ChordSearchOptions = {
    ...(size !== undefined ? { size } : {}),
    ...(spectrum !== undefined ? { spectrum } : {}),
  };
  const leaderboard = rankModeChords(scale, tuning, opts);
  const best = leaderboard[0];
  if (best === undefined || best.chords[0] === undefined) {
    throw new RangeError(
      `no chords found for any mode of scale '${scale.id}' — scale may be too small for the requested size`,
    );
  }
  return {
    mode: best.scale,
    modeIndex: best.modeIndex,
    chord: rankedChordToChord(best.chords[0]),
  };
}

/**
 * Build a `Chord` from scale-local degree offsets within a `Scale`.
 *
 * Socratic Q64: `chordFromDegrees(tuning, indices)` works for any tuning, but
 * it requires the caller to know the raw tuning indices. When working with a
 * `Scale` (a curated melodic subset), thinking in scale-local degree offsets
 * (0 = root, 1 = second scale degree, 2 = third scale degree, …) is more
 * natural. This bridges that gap: `chordFromScale(scale, tuning, [0, 2, 4])`
 * builds a triad from the 1st, 3rd, and 5th scale degrees without requiring
 * the caller to look up `scale.degreeIndices` manually.
 *
 * Scale-local offset `i` maps to tuning degree `scale.degreeIndices[i]`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if any offset is outside `[0, scale.degreeIndices.length)`.
 * @throws {RangeError} if `offsets` is empty.
 *
 * @example
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-edo',
 *                 degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * // Triad on scale degrees 1, 3, 5 (0-indexed offsets 0, 2, 4)
 * const triad = chordFromScale(major, edo(12), [0, 2, 4], 'major-triad');
 */
export function chordFromScale(
  scale: Scale,
  tuning: TuningSystem,
  offsets: readonly number[],
  name?: string,
): Chord {
  assertTuningMatch(scale, tuning);
  if (offsets.length === 0) throw new RangeError('offsets must be non-empty');
  const n = scale.degreeIndices.length;
  for (const o of offsets) {
    if (!Number.isInteger(o) || o < 0 || o >= n) {
      throw new RangeError(`offset ${o} is out of range [0, ${n - 1}] for scale '${scale.id}'`);
    }
  }
  const mappedIndices = offsets.map((o) => scale.degreeIndices[o] as number);
  return chordFromDegrees(tuning, mappedIndices, name);
}

/** Result entry from {@link rankScalesForTimbre}. */

export interface RankedScale {
  readonly scale: Scale;
  readonly dissonance: number;
}

/**
 * Rank an array of pre-built `Scale` objects by their sensory dissonance for a
 * given timbre (ascending — most consonant first).
 *
 * Socratic Q70: `rankModes` ranks *rotations of one scale* by dissonance, but
 * if you already have multiple *different* Scale objects (e.g. [ionian, dorian,
 * phrygian, lydian] as pre-built Scale objects with the same tuningId), picking
 * the most consonant one requires a manual `map → sort` loop. A single
 * `rankScalesForTimbre` call closes that gap: if `Scale[]` is truly first-class,
 * sorting them by consonance should be one call.
 *
 * Each scale is scored via `scaleDissonance(scale, tuning, spectrum)`. Scales
 * from different tunings are not comparable and will throw via the internal
 * `assertTuningMatch` guard.
 *
 * @returns A new array sorted by dissonance ascending (most consonant first).
 *
 * @throws {RangeError} if any `Scale` is incompatible with `tuning`.
 * @throws {RangeError} if `scales` is empty.
 *
 * @example
 * // Which diatonic mode of 12-TET is most consonant for a harmonic spectrum?
 * const modes = [0,1,2,3,4,5,6].map((i) => scaleMode(major, i, t12));
 * const ranked = rankScalesForTimbre(modes, t12, harmonicSpectrum());
 * // ranked[0].scale is the most consonant mode
 */
export function rankScalesForTimbre(
  scales: readonly Scale[],
  tuning: TuningSystem,
  spectrum: Spectrum,
): RankedScale[] {
  if (scales.length === 0) throw new RangeError('rankScalesForTimbre: scales must be non-empty');
  return scales
    .map((scale) => ({ scale, dissonance: scaleDissonance(scale, tuning, spectrum) }))
    .sort((a, b) => a.dissonance - b.dissonance);
}

/**
 * Return the `Scale` with the lowest sensory dissonance for the given timbre.
 *
 * Socratic Q70 (convenience form): `rankScalesForTimbre(scales, tuning, spectrum)[0].scale`
 * in one call. If you have multiple pre-built Scale objects and want the single
 * most consonant one without building the full ranked list, this is the entry point.
 *
 * @throws {RangeError} if `scales` is empty, or if any scale is incompatible with `tuning`.
 *
 * @example
 * const modes = [0,1,2,3,4,5,6].map((i) => scaleMode(major, i, t12));
 * const best = bestScaleForTimbre(modes, t12, harmonicSpectrum());
 * // best is the most consonant modal rotation
 */
export function bestScaleForTimbre(
  scales: readonly Scale[],
  tuning: TuningSystem,
  spectrum: Spectrum,
): Scale {
  return (rankScalesForTimbre(scales, tuning, spectrum)[0] as RankedScale).scale;
}

/**
 * Interval histogram of a `Scale`: counts how often each interval class appears
 * among all scale-degree pairs.
 *
 * Socratic Q89: `tuningToIntervalVector(tuning)` computes the interval histogram
 * for a *full tuning* (all n×(n-1)/2 degree pairs). But most music uses a *scale*
 * — a curated subset of those degrees (e.g. the 7-note diatonic major from 12-TET).
 * The characteristic interval content of the scale (e.g. "how many perfect fifths
 * does the major scale contain?") is a different histogram over just the 7 selected
 * degrees. If `Scale` is truly first-class, computing its interval fingerprint
 * should be one call.
 *
 * Delegates to `tuningToIntervalVector` over the scale's projected sub-tuning
 * (via `scaleToTuning`), so the binning semantics are identical.
 *
 * Counts only **upper-triangle** pairs (i < j), ascending intervals only. Each
 * pair contributes one count to the bin nearest to `stepCents` resolution.
 *
 * @param scale - The scale to fingerprint (degree subset of the tuning).
 * @param tuning - Parent tuning system the scale belongs to.
 * @param stepCents - Bin width in cents (default 50). Must be > 0.
 * @returns `Map<number, number>` mapping interval bin (cents) → count.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `stepCents` ≤ 0.
 *
 * @example
 * // Diatonic major scale in 12-TET: how many perfect fifths?
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-tet',
 *                 degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const hist = scaleIntervalHistogram(major, equalTemperament12(440));
 * hist.get(700); // → 6 (each of the 6 available fifths in the diatonic scale)
 */
export function scaleIntervalHistogram(
  scale: Scale,
  tuning: TuningSystem,
  stepCents = 50,
): Map<number, number> {
  assertTuningMatch(scale, tuning);
  const subTuning = scaleToTuning(scale, tuning);
  return tuningToIntervalVector(subTuning, stepCents);
}

/**
 * Similarity between two scales based on their interval histograms.
 *
 * Socratic Q95: `scaleIntervalHistogram(scale, tuning)` fingerprints a scale as a
 * count of interval classes — but comparing two scales to see "how similar they
 * sound" still requires computing both histograms and writing a bespoke overlap
 * formula. If `Scale` is truly first-class, comparing two scales structurally
 * should be one call.
 *
 * Algorithm: compute `scaleIntervalHistogram` for both scales (using the same
 * `stepCents` bin width), then measure the **histogram intersection** normalized
 * by the larger total count:
 *
 *   `similarity = Σ min(histA[k], histB[k]) / max(totalA, totalB)`
 *
 * Properties:
 * - Returns 1.0 when both scales have identical interval content (same histogram).
 * - Returns 0.0 when no bin is shared (completely different interval classes).
 * - Invariant to the ordering of degrees (histograms are unordered).
 * - `scaleSimilarity(a, b, t)` = `scaleSimilarity(b, a, t)` (symmetric).
 * - The two scales do **not** need to belong to the same tuning; each is matched
 *   to its own tuning. Comparing scales from different tunings (e.g. 12-TET major
 *   vs 19-EDO major) is the primary use case.
 *
 * @param a - First scale.
 * @param b - Second scale.
 * @param tuningA - Tuning that `a` belongs to (must match `a.tuningId`).
 * @param tuningB - Tuning that `b` belongs to (must match `b.tuningId`).
 *   If omitted, `tuningA` is used for both scales (convenience when comparing
 *   two scales in the same tuning).
 * @param stepCents - Histogram bin width in cents (default 50).
 * @returns Similarity in [0, 1]: 1 = identical interval content, 0 = no overlap.
 *
 * @throws {RangeError} if either scale is incompatible with its tuning.
 *
 * @example
 * // Ionian (major) vs Lydian in 12-TET — differ only by one half-step (F vs F#)
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const lydian = { id: 'lydian', name: 'Lydian', tuningId: '12-tet', degreeIndices: [0,2,4,6,7,9,11] };
 * const t12 = equalTemperament12(440);
 * scaleSimilarity(major, lydian, t12); // high similarity (~0.9+)
 *
 * @example
 * // Major scale in 12-TET vs 19-EDO — similar modal character, different tunings
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const major12 = { id: 'm12', name: 'major', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const major19 = { id: 'm19', name: 'major', tuningId: '19-edo', degreeIndices: [0,3,6,8,11,14,17] };
 * scaleSimilarity(major12, major19, t12, t19);
 */
export function scaleSimilarity(
  a: Scale,
  b: Scale,
  tuningA: TuningSystem,
  tuningB: TuningSystem = tuningA,
  stepCents = 50,
): number {
  const histA = scaleIntervalHistogram(a, tuningA, stepCents);
  const histB = scaleIntervalHistogram(b, tuningB, stepCents);

  // Compute totals and intersection
  let totalA = 0;
  for (const v of histA.values()) totalA += v;
  let totalB = 0;
  for (const v of histB.values()) totalB += v;

  if (totalA === 0 && totalB === 0) return 1; // both empty → trivially identical
  if (totalA === 0 || totalB === 0) return 0; // one empty → no overlap

  let intersection = 0;
  for (const [k, vA] of histA) {
    const vB = histB.get(k) ?? 0;
    intersection += Math.min(vA, vB);
  }

  return intersection / Math.max(totalA, totalB);
}

/**
 * Stolzenburg periodicity of a scale sounded simultaneously as a chord.
 *
 * Socratic Q97: `harmonicityForChord(chord, rootHz)` scores a `Chord` object,
 * and `scaleToFreqs(scale, tuning)` returns Hz[]. But going from a `Scale` to
 * a single harmonicity score still requires converting to frequencies and then
 * calling `chordPeriodicity` manually. If `Scale` is first-class, measuring its
 * harmonicity should be one call.
 *
 * Bridges `scaleToFreqs → chordPeriodicity`. Lower return value = more harmonic.
 * A pentatonic scale built from simple ratios returns a small value; a chromatic
 * cluster returns a large one.
 *
 * @param scale - The scale whose degrees are treated as simultaneous pitches.
 * @param tuning - The parent tuning the scale belongs to.
 * @param tol - Continued-fraction tolerance (default 0.0136).
 * @returns Relative periodicity ≥ 1, or `Infinity` for maximally inharmonic scales.
 *
 * @throws {RangeError} if the scale and tuning are incompatible, or the scale is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'm', name: 'major', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * scaleHarmonicity(major, t12); // periodicity of all 7 major-scale tones sounded together
 */
export function scaleHarmonicity(scale: Scale, tuning: TuningSystem, tol = 0.0136): number {
  if (scale.degreeIndices.length === 0) {
    throw new RangeError('scaleHarmonicity: scale must have at least one degree');
  }
  const freqs = scaleToFreqs(scale, tuning);
  return chordPeriodicity(freqs, tol);
}

/**
 * Stolzenburg periodicity at each step of a modal progression (sequence of `Scale` objects).
 *
 * Socratic Q104: `scaleHarmonicity(scale, tuning)` scores a single scale's total sonority
 * as a periodicity value, but mapping it across a sequence of scales (a modal progression)
 * still requires a manual `.map(…)`.  If `Scale` is truly first-class, measuring
 * harmonicity across a progression should be one call — parallel to
 * `chordProgressionHarmonicity` for chord progressions.
 *
 * Returns `number[]` where each entry is the Stolzenburg relative periodicity of the
 * corresponding scale's degrees sounded simultaneously: lower = more harmonic (simpler
 * integer ratios).  `Infinity` signals that a scale is too inharmonic to quantify within
 * the continued-fraction tolerance.
 *
 * @param scales - Ordered sequence of `Scale` objects (must all be compatible with `tuning`).
 * @param tuning - The parent `TuningSystem` all scales belong to.
 * @param tol - Continued-fraction tolerance (default 0.0136, snaps 12-TET to JI).
 * @returns Array of periodicity values, one per scale step.
 *
 * @throws {RangeError} if `scales` is empty.
 * @throws {RangeError} if any scale is incompatible with `tuning` or has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const modes = [0, 1, 2].map((i) => scaleMode(major, i, t12));
 * const curve = scaleProgressionHarmonicity(modes, t12);
 * // curve[i] is the periodicity of mode i sounded as a simultaneous chord
 */
export function scaleProgressionHarmonicity(
  scales: readonly Scale[],
  tuning: TuningSystem,
  tol = 0.0136,
): number[] {
  if (scales.length === 0)
    throw new RangeError('scaleProgressionHarmonicity: scales must be non-empty');
  return scales.map((s) => scaleHarmonicity(s, tuning, tol));
}

/**
 * Build a diatonic chord progression from a `Scale`, `TuningSystem`, and a degree-offset pattern.
 *
 * Socratic Q103: `chordFromScale(scale, tuning, offsets)` builds one chord, but constructing
 * a full diatonic progression (e.g. I–IV–V triads) still requires a `pattern.map(…)` loop
 * and assembling the array manually.  If chord building from scale degrees is first-class,
 * producing a whole progression should be one call.
 *
 * Each entry in `pattern` is an array of scale-local offsets (0-indexed positions within
 * `scale.degreeIndices`).  The function maps every pattern step through `chordFromScale`
 * and returns the resulting `Chord[]`.
 *
 * @param scale   - The parent scale (mode) to draw degrees from.
 * @param tuning  - The tuning the scale belongs to.
 * @param pattern - Array of scale-degree-offset arrays, e.g. `[[0,2,4],[2,4,6],[4,6,1]]`
 *                  for a I–III–V progression. Offsets are 0-indexed into
 *                  `scale.degreeIndices`; out-of-range offsets throw.
 * @param name    - Optional base name; each chord is named `${name}-${stepIndex+1}`.
 *                  Defaults to `'chord'`.
 * @returns `Chord[]` with one entry per pattern step.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `pattern` is empty.
 * @throws {RangeError} if any offset array is empty.
 * @throws {RangeError} if any offset is outside `[0, scale.degreeIndices.length)`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * // Classic I–IV–V triad progression (0-indexed diatonic offsets)
 * const progression = buildChordProgression(major, t12, [[0,2,4],[3,5,0],[4,6,1]], 'diatonic');
 * // progression[0] = tonic triad, progression[1] = subdominant, progression[2] = dominant
 */
export function buildChordProgression(
  scale: Scale,
  tuning: TuningSystem,
  pattern: ReadonlyArray<readonly number[]>,
  name = 'chord',
): Chord[] {
  assertTuningMatch(scale, tuning);
  if (pattern.length === 0)
    throw new RangeError('buildChordProgression: pattern must be non-empty');
  return pattern.map((offsets, i) => chordFromScale(scale, tuning, offsets, `${name}-${i + 1}`));
}

/** One entry in the ranked-modes-by-harmonicity leaderboard returned by `rankModeSeriesByHarmonicity`. */

export interface RankedModeByHarmonicity {
  /** The modal rotation (result of `scaleMode`). */
  readonly scale: Scale;
  /** The rotation index (0 = original, 1 = starting from second degree, …). */
  readonly modeIndex: number;
  /** Stolzenburg relative periodicity — lower = simpler integer ratios = more harmonic. */
  readonly harmonicity: number;
}

/**
 * Rank all modal rotations of a scale by Stolzenburg harmonicity, most harmonic first.
 *
 * Socratic Q110: `rankModes(scale, tuning, spectrum)` ranks modes by Sethares sensory
 * dissonance — timbre-dependent. But there is no one-call equivalent that sorts modes by
 * *harmonicity* (Stolzenburg periodicity): the caller must call `scaleModeSeries`, then
 * map each mode through `scaleHarmonicity`, then sort — three steps. If modes are first-class,
 * "which rotation is most just-intonation-friendly?" should be one call.
 *
 * Parallels `rankModes` but uses periodicity (Stolzenburg) rather than sensory dissonance
 * (Sethares/Plomp-Levelt). Lower `harmonicity` = simpler integer ratios = more harmonic.
 *
 * @param scale  - The parent scale to rotate.
 * @param tuning - The parent `TuningSystem` the scale belongs to.
 * @param tol    - Continued-fraction tolerance (default 0.0136).
 * @returns Array sorted by `harmonicity` ascending (most harmonic first).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if the scale has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const ranked = rankModeSeriesByHarmonicity(major, t12);
 * // ranked[0].scale is the modal rotation with the simplest collective integer ratios
 */
export function rankModeSeriesByHarmonicity(
  scale: Scale,
  tuning: TuningSystem,
  tol = 0.0136,
): RankedModeByHarmonicity[] {
  assertTuningMatch(scale, tuning);
  return scaleModeSeries(scale, tuning)
    .map((mode, modeIndex) => ({
      scale: mode,
      modeIndex,
      harmonicity: scaleHarmonicity(mode, tuning, tol),
    }))
    .sort((a, b) => a.harmonicity - b.harmonicity);
}

/** One entry in the combined timbre-ranking leaderboard returned by `rankAllModesForTimbre`. */

export interface RankedModeForTimbre {
  /** The modal rotation (result of `scaleMode`). */
  readonly scale: Scale;
  /** The rotation index (0 = original, 1 = starting from second degree, …). */
  readonly modeIndex: number;
  /** Sethares sensory dissonance (lower = smoother/more consonant, timbre-dependent). */
  readonly roughness: number;
  /** Stolzenburg relative periodicity (lower = simpler ratios = more harmonic, timbre-independent). */
  readonly harmonicity: number;
  /**
   * Combined score: arithmetic mean of roughness and harmonicity, each normalised to
   * [0, 1] over this call's results. Lower = better across both dimensions.
   *
   * Normalisation is min–max: `(x − min) / max(max − min, ε)` where ε = 1e-12.
   * When all values in a dimension are equal, the normalised score is 0 for all entries.
   */
  readonly combinedScore: number;
}

/**
 * Rank all modal rotations of a scale by a combined timbre score (roughness + harmonicity).
 *
 * Socratic Q115: `rankModes(scale, tuning, spectrum)` ranks modes by Sethares sensory
 * roughness — timbre-dependent. `rankModeSeriesByHarmonicity` ranks by Stolzenburg
 * periodicity — timbre-independent. To get the "best mode for this timbre on both
 * axes simultaneously," the caller must run both functions, correlate by `modeIndex`,
 * and compute a combined score manually. If modes are truly first-class, a single
 * call should surface both scores together and sort by the combination.
 *
 * Returns one entry per mode sorted by `combinedScore` ascending (best mode first).
 * `combinedScore` is the arithmetic mean of min-max normalised roughness and harmonicity
 * over this call's result set, so the two axes are weighted equally regardless of their
 * absolute magnitudes.
 *
 * @param scale    - The parent scale to rotate.
 * @param tuning   - The parent `TuningSystem` the scale belongs to.
 * @param spectrum - Instrument spectrum for the roughness axis (timbre-dependent).
 * @param tol      - Continued-fraction tolerance for harmonicity (default 0.0136).
 * @returns Array sorted by `combinedScore` ascending (most consonant + most harmonic first).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if the scale has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const ranked = rankAllModesForTimbre(major, t12, harmonicSpectrum());
 * // ranked[0] is the mode that is simultaneously most consonant (roughness) and most harmonic (harmonicity)
 */
export function rankAllModesForTimbre(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  tol = 0.0136,
): RankedModeForTimbre[] {
  assertTuningMatch(scale, tuning);
  const modes = scaleModeSeries(scale, tuning);

  const raw = modes.map((mode, modeIndex) => ({
    scale: mode,
    modeIndex,
    roughness: scaleDissonance(mode, tuning, spectrum),
    harmonicity: scaleHarmonicity(mode, tuning, tol),
  }));

  // Min-max normalise each axis independently.
  const minR = Math.min(...raw.map((e) => e.roughness));
  const maxR = Math.max(...raw.map((e) => e.roughness));
  const minH = Math.min(...raw.map((e) => e.harmonicity));
  const maxH = Math.max(...raw.map((e) => e.harmonicity));
  const eps = 1e-12;

  const entries: RankedModeForTimbre[] = raw.map((e) => {
    const normR = (e.roughness - minR) / Math.max(maxR - minR, eps);
    const normH = (e.harmonicity - minH) / Math.max(maxH - minH, eps);
    return { ...e, combinedScore: (normR + normH) / 2 };
  });

  return entries.sort((a, b) => a.combinedScore - b.combinedScore);
}

/** Per-step analysis entry returned by `chordProgressionAnalysis`. */

export interface ChordProgressionStep {
  /** The chord at this progression step. */
  readonly chord: Chord;
  /** Realized frequencies in Hz for this chord at `rootHz`. */
  readonly freqs: readonly number[];
  /** Sethares sensory dissonance of this chord for the given spectrum. */
  readonly dissonance: number;
  /** Stolzenburg relative periodicity of this chord (lower = more harmonic). */
  readonly harmonicity: number;
  /**
   * Minimal voice-leading cost in cents to the *next* chord in the progression.
   * `null` for the last step (no successor).
   */
  readonly voiceLeadingCostToNext: number | null;
}

/**
 * Comprehensive per-step analysis of a chord progression.
 *
 * Socratic Q116: `chordObjectDissonance(chord, rootHz, spectrum)` scores one chord's
 * roughness; `harmonicityForChord(chord, rootHz)` scores its periodicity;
 * `voiceLeadingCost(freqsA, freqsB)` gives the transition cost. Getting the full
 * picture for a progression — roughness, harmonicity, and voice-leading cost at
 * every step — still requires three separate mapping passes. If `Chord` progressions
 * are truly first-class, one call should return the complete per-step picture.
 *
 * Returns one `ChordProgressionStep` per chord with:
 * - `chord`: the original `Chord` object
 * - `freqs`: realized frequencies at `rootHz`
 * - `dissonance`: Sethares roughness (timbre-dependent)
 * - `harmonicity`: Stolzenburg periodicity (timbre-independent)
 * - `voiceLeadingCostToNext`: minimal voice-leading cost in cents to the next chord
 *   (`null` on the last step). Only computed when adjacent chords have equal voice counts.
 *   If voice counts differ, the field is `Infinity`.
 *
 * @param chords   - Ordered list of chords (at least one).
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Instrument spectrum for the dissonance computation.
 * @param tol      - Continued-fraction tolerance for harmonicity (default 0.0136).
 * @returns Array of `ChordProgressionStep`, one per input chord.
 *
 * @throws {RangeError} if `chords` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 * @throws {RangeError} if any chord has no intervals.
 *
 * @example
 * const I  = chordFromRatios('I',  [[1,1],[5,4],[3,2]]);
 * const IV = chordFromRatios('IV', [[1,1],[4,3],[5,3]]);
 * const V  = chordFromRatios('V',  [[1,1],[3,2],[15,8]]);
 * const analysis = chordProgressionAnalysis([I, IV, V], 261.63, harmonicSpectrum());
 * // analysis[0].dissonance — roughness of I
 * // analysis[0].voiceLeadingCostToNext — cost of I→IV
 * // analysis[2].voiceLeadingCostToNext === null — no successor after V
 */
export function chordProgressionAnalysis(
  chords: readonly Chord[],
  rootHz: number,
  spectrum: Spectrum,
  tol = 0.0136,
): ChordProgressionStep[] {
  if (chords.length === 0) {
    throw new RangeError('chordProgressionAnalysis: chords must be non-empty');
  }
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(`chordProgressionAnalysis: rootHz must be finite and > 0, got ${rootHz}`);
  }

  // Realize all chords once.
  const allFreqs = chords.map((chord) => realizeChordFreqs(chord, rootHz));

  return chords.map((chord, i) => {
    const freqs = allFreqs[i] as number[];
    const dissonance = chordObjectDissonance(chord, rootHz, spectrum);
    const harmonicity = harmonicityForChord(chord, rootHz, tol);

    let vlCost: number | null = null;
    if (i < chords.length - 1) {
      const nextFreqs = allFreqs[i + 1] as number[];
      if (freqs.length !== nextFreqs.length) {
        vlCost = Infinity;
      } else {
        vlCost = voiceLeadingCost(freqs, nextFreqs);
      }
    }

    return { chord, freqs, dissonance, harmonicity, voiceLeadingCostToNext: vlCost };
  });
}

/** One entry returned by `scaleToChordMap`. */

export interface ScaleChordMapEntry {
  /**
   * The root degree offset (0-indexed within `scale.degreeIndices`).
   * Scale degree 0 = first degree, 1 = second degree, etc.
   */
  readonly degreeOffset: number;
  /** The diatonic chord built from this root. */
  readonly chord: Chord;
  /**
   * Scale-local offsets used to build this chord.
   * E.g. for a triad rooted at degree 1: `[1, 3, 5]`.
   */
  readonly offsets: readonly number[];
}

/**
 * Build every diatonic chord of a given size rooted at each scale degree.
 *
 * Socratic Q117: `chordFromScale(scale, tuning, [0,2,4])` builds one triad from
 * scale degrees 1–3–5. But "all diatonic triads in the major scale" — the Roman-
 * numeral I–ii–iii–IV–V–vi–vii° map — still requires an outer loop over all root
 * positions plus manual offset arithmetic. If `Scale` is truly first-class, producing
 * the complete diatonic chord map should be one call.
 *
 * Stacking rule: degrees wrap modulo `scale.degreeIndices.length` — degree `k` maps
 * to `scale.degreeIndices[k % n]`, advancing by one octave (one `periodDegrees` step
 * in the parent tuning) for each wrap. This is the standard diatonic stacking used
 * for Roman-numeral analysis, without cultural naming.
 *
 * @param scale  - The parent scale (must be compatible with `tuning`).
 * @param tuning - The parent `TuningSystem`.
 * @param size   - Number of notes per chord (default 3, i.e. triads).
 * @returns One entry per root degree (length = `scale.degreeIndices.length`),
 *   sorted by `degreeOffset` ascending (degree 0 first).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `size` < 2.
 * @throws {RangeError} if the scale has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * // chordMap[0] = I triad (degrees 0,2,4 → tuning notes 0,4,7)
 * // chordMap[3] = IV triad (degrees 3,5,0 → tuning notes 5,9,0+12)
 * // chordMap.length === 7
 */
export function scaleToChordMap(
  scale: Scale,
  tuning: TuningSystem,
  size = 3,
): ScaleChordMapEntry[] {
  assertTuningMatch(scale, tuning);
  if (scale.degreeIndices.length === 0) {
    throw new RangeError('scaleToChordMap: scale must have at least one degree');
  }
  if (!Number.isInteger(size) || size < 2) {
    throw new RangeError(`scaleToChordMap: size must be an integer >= 2, got ${size}`);
  }

  const n = scale.degreeIndices.length;
  const periodDegrees = tuning.degrees.length;

  return Array.from({ length: n }, (_, rootOffset) => {
    // Build `size` stacked scale-step offsets, wrapping modulo n.
    const offsets: number[] = Array.from(
      { length: size },
      (__, step) => (rootOffset + step * 2) % n,
    );

    // Map each scale offset to a tuning degree index, advancing by one period per wrap.
    const tuningIndices = Array.from({ length: size }, (__, step) => {
      const rawOffset = rootOffset + step * 2;
      const wraps = Math.floor(rawOffset / n);
      const scaleIdx = rawOffset % n;
      return (scale.degreeIndices[scaleIdx] as number) + wraps * periodDegrees;
    });

    const chord = chordFromDegrees(tuning, tuningIndices, `chord-deg-${rootOffset}`);
    return { degreeOffset: rootOffset, chord, offsets };
  });
}

/**
 * Generate a chord progression from a Roman-numeral root pattern applied to a scale.
 *
 * Socratic Q118: `buildChordProgression(scale, tuning, [[0,2,4],[3,5,0],[4,6,1]])` builds
 * a diatonic I–IV–V progression — but it requires the caller to pre-compute the full
 * offset arrays for each chord. The common compositional thought is "play I, then IV,
 * then V", i.e. just the root degree indices `[0, 3, 4]`. If the library can generate
 * diatonic stacked chords from a single root offset (via `scaleToChordMap`), mapping a
 * root-index pattern to a progression should also be one call.
 *
 * Distinct from `buildChordProgression`: `buildChordProgression` accepts explicit
 * offset arrays per step; `progressionFromPattern` accepts a flat list of root-degree
 * indices and auto-derives the stacked offsets from `size`, so the caller never
 * constructs offset arrays manually.
 *
 * @param scale        - The parent scale.
 * @param tuning       - The parent `TuningSystem`.
 * @param romanPattern - Sequence of 0-based root degree indices (e.g. `[0, 3, 4, 0]`
 *                       for I–IV–V–I). Out-of-range indices throw.
 * @param size         - Notes per chord (default 3, i.e. triads).
 * @param name         - Optional base name; each chord is named `${name}-${stepIndex+1}`.
 *                       Defaults to `'prog'`.
 * @returns `Chord[]` with one entry per pattern step.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `romanPattern` is empty.
 * @throws {RangeError} if any root index is outside `[0, scale.degreeIndices.length)`.
 * @throws {RangeError} if `size` < 2.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * // I–IV–V–I progression using 0-based degree indices
 * const chords = progressionFromPattern(major, t12, [0, 3, 4, 0]);
 * // chords[0] = I triad, chords[1] = IV triad, chords[2] = V triad, chords[3] = I triad
 */
export function progressionFromPattern(
  scale: Scale,
  tuning: TuningSystem,
  romanPattern: readonly number[],
  size = 3,
  name = 'prog',
): Chord[] {
  assertTuningMatch(scale, tuning);
  if (romanPattern.length === 0) {
    throw new RangeError('progressionFromPattern: romanPattern must be non-empty');
  }
  if (!Number.isInteger(size) || size < 2) {
    throw new RangeError(`progressionFromPattern: size must be an integer >= 2, got ${size}`);
  }

  const n = scale.degreeIndices.length;
  const periodDegrees = tuning.degrees.length;

  return romanPattern.map((rootOffset, stepIdx) => {
    if (!Number.isInteger(rootOffset) || rootOffset < 0 || rootOffset >= n) {
      throw new RangeError(
        `progressionFromPattern: rootOffset ${rootOffset} is out of range [0, ${n - 1}]`,
      );
    }

    const tuningIndices = Array.from({ length: size }, (_, step) => {
      const rawOffset = rootOffset + step * 2;
      const wraps = Math.floor(rawOffset / n);
      const scaleIdx = rawOffset % n;
      return (scale.degreeIndices[scaleIdx] as number) + wraps * periodDegrees;
    });

    return chordFromDegrees(tuning, tuningIndices, `${name}-${stepIdx + 1}`);
  });
}

/**
 * Find the most consonant N-chord progression within a scale in one call.
 *
 * Socratic Q119: Discovering the most consonant chords in a scale is
 * `rankScaleChords(scale, tuning, { size, limit: N })`. Ordering them for
 * smoothest voice-leading is `optimalChordOrder(chords, rootHz)`. But combining
 * these into "the best N-chord progression for this scale and timbre" still
 * requires two explicit calls and lifting `RankedChord[]` to `Chord[]`.
 * If `Scale` is truly first-class, discovering and ordering the best chord
 * progression should be one call.
 *
 * Algorithm:
 * 1. `rankScaleChords(scale, tuning, { size, spectrum, limit: numChords })` — top `numChords` diatonic chords.
 * 2. Lift each to `Chord` via `rankedChordToChord`.
 * 3. `optimalChordOrder(chords, rootHz)` — find the ordering with smoothest voice-leading.
 * 4. Return the ordered `Chord[]`.
 *
 * @param scale     - The parent scale.
 * @param tuning    - The parent `TuningSystem`.
 * @param spectrum  - Instrument spectrum for chord ranking.
 * @param numChords - Number of chords to include (default 4). Must be ≥ 1.
 * @param size      - Notes per chord (default 3).
 * @param rootHz    - Root frequency for voice-leading optimization (default tuning reference).
 * @returns Ordered `Chord[]` (best voice-leading path through the top-ranked chords).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `numChords` < 1.
 * @throws {RangeError} if the scale has fewer chords of the requested size than `numChords`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const prog = bestProgressionForScale(major, t12, harmonicSpectrum());
 * // prog is the 4 most consonant diatonic triads in voice-leading order
 */
export function bestProgressionForScale(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  numChords = 4,
  size = 3,
  rootHz?: number,
): Chord[] {
  assertTuningMatch(scale, tuning);
  if (!Number.isInteger(numChords) || numChords < 1) {
    throw new RangeError(`bestProgressionForScale: numChords must be >= 1, got ${numChords}`);
  }

  const effectiveRootHz = rootHz ?? tuning.referenceHz;

  const ranked = rankScaleChords(scale, tuning, {
    size,
    spectrum,
    limit: numChords,
    rootHz: effectiveRootHz,
  });

  if (ranked.length < numChords) {
    throw new RangeError(
      `bestProgressionForScale: requested ${numChords} chords but only ${ranked.length} available for size ${size} in scale '${scale.id}'`,
    );
  }

  const chords = ranked.slice(0, numChords).map((r) => rankedChordToChord(r));
  return [...optimalChordOrder(chords, effectiveRootHz).chords];
}

/** One entry returned by `rankScaleChordsByHarmonicity`. */

/**
 * One entry returned by `chordMapAnalysis`.
 *
 * Combines a `ScaleChordMapEntry` with its Sethares sensory dissonance and Stolzenburg
 * harmonicity scores, enabling simultaneous ranking by both acoustic dimensions.
 */
export interface ChordMapAnalysisEntry {
  /** The root degree offset (0-indexed within `scale.degreeIndices`). */
  readonly degreeOffset: number;
  /** The diatonic chord built from this root. */
  readonly chord: Chord;
  /** Sethares sensory dissonance (lower = more consonant, timbre-dependent). */
  readonly dissonance: number;
  /** Stolzenburg relative periodicity (lower = more harmonic / simpler ratios). */
  readonly harmonicity: number;
}

/**
 * Score every diatonic chord of a scale with both dissonance and harmonicity.
 *
 * Socratic Q127: `scaleToChordMap(scale, tuning)` gives all diatonic chords but no
 * acoustic scores. Getting dissonance + harmonicity for each requires two separate
 * mapping passes. If a diatonic chord map is first-class, annotating it with both
 * acoustic scores should be one call.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning, size)` — build all diatonic chords.
 * 2. For each entry: `chordObjectDissonance(chord, rootHz, spectrum)` where
 *    `rootHz = tuning.referenceHz`.
 * 3. For each entry: `harmonicityForChord(chord, rootHz, tol)`.
 * 4. Sort result by dissonance ascending (most consonant first).
 *
 * @param scale   - The parent scale (must be compatible with `tuning`).
 * @param tuning  - The parent `TuningSystem`.
 * @param spectrum - Instrument spectrum for the dissonance computation.
 * @param size    - Notes per chord (default 3, i.e. triads).
 * @param tol     - Continued-fraction tolerance for harmonicity (default 0.0136).
 * @returns Array of entries sorted by dissonance ascending.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `size` < 2.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const analysis = chordMapAnalysis(major, t12, harmonicSpectrum());
 * // analysis[0] is the most consonant diatonic triad with its dissonance and harmonicity
 */
export function chordMapAnalysis(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  size?: number,
  tol = 0.0136,
): ChordMapAnalysisEntry[] {
  const chordMap = scaleToChordMap(scale, tuning, size ?? 3);
  const rootHz = tuning.referenceHz;
  const entries: ChordMapAnalysisEntry[] = chordMap.map(({ degreeOffset, chord }) => ({
    degreeOffset,
    chord,
    dissonance: chordObjectDissonance(chord, rootHz, spectrum),
    harmonicity: harmonicityForChord(chord, rootHz, tol),
  }));
  return entries.sort((a, b) => a.dissonance - b.dissonance);
}

/**
 * Return the single most consonant diatonic chord entry for a scale.
 *
 * Socratic Q128: `chordMapAnalysis(scale, tuning, spectrum)[0]` gives the most
 * consonant diatonic chord — but it still requires constructing the full analysis
 * and indexing into it. If discovering the best chord from a diatonic map is the
 * most common use-case, it should be one call with a clear error on failure.
 *
 * @param scale   - The parent scale.
 * @param tuning  - The parent `TuningSystem`.
 * @param spectrum - Instrument spectrum for the dissonance computation.
 * @param size    - Notes per chord (default 3).
 * @param tol     - Continued-fraction tolerance for harmonicity (default 0.0136).
 * @returns The single `ChordMapAnalysisEntry` with the lowest dissonance.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` or the scale is too small.
 * @throws {RangeError} if no chords are found (scale too small for requested size).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const best = bestChordMapEntry(major, t12, harmonicSpectrum());
 * // best.chord is the most consonant diatonic triad; best.degreeOffset is its scale root
 */
export function bestChordMapEntry(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  size?: number,
  tol?: number,
): ChordMapAnalysisEntry {
  const analysis = chordMapAnalysis(scale, tuning, spectrum, size, tol ?? 0.0136);
  const best = analysis[0];
  if (best === undefined) {
    throw new RangeError(
      `bestChordMapEntry: no chords found for scale '${scale.id}' — scale may be too small`,
    );
  }
  return best;
}

/**
 * Find the modal rotation of a tuning's full scale that is most harmonically optimal.
 *
 * Socratic Q133: `rankModeSeriesByHarmonicity(scale, tuning)` ranks all modes by
 * Stolzenburg periodicity, and `rankAllModesForTimbre(scale, tuning, spectrum)` adds
 * Sethares roughness — but neither provides a one-call path from a raw `TuningSystem`
 * to its single best mode. The caller must first call `tuningToScale`, then pick a
 * ranking function. `bestModeForTuning` closes this gap: from a tuning, return the
 * Scale corresponding to the most harmonic (or timbre-optimal) mode in one call.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale spanning all degrees.
 * 2a. If no `spectrum`: `rankModeSeriesByHarmonicity(scale, tuning)` → sort by harmonicity;
 *     return the first entry's Scale.
 * 2b. If `spectrum` provided: `rankAllModesForTimbre(scale, tuning, spectrum)` → sort by
 *     combinedScore (roughness + harmonicity); return the first entry's Scale.
 *
 * There was a third `maxDegrees` parameter, meant to "limit the search space for large
 * tunings". It could not do that: both ranking functions rank `scaleModeSeries`, whose
 * rotations all have exactly as many degrees as the tuning. So `maxDegrees >= n` filtered
 * nothing and `maxDegrees < n` filtered *everything* and threw — the parameter had no
 * setting that narrowed a result. It is gone; no caller ever passed it.
 *
 * @param tuning     - The parent `TuningSystem`.
 * @param spectrum   - Optional instrument spectrum. When provided, combines roughness and
 *                     harmonicity via `rankAllModesForTimbre`. When omitted, uses harmonicity only.
 * @returns The `Scale` of the most harmonically optimal mode.
 *
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const bestMode = bestModeForTuning(t12);
 * // bestMode is the modal rotation of the full 12-TET scale with the simplest ratios
 *
 * @example
 * // With timbre:
 * const bestMode = bestModeForTuning(t12, harmonicSpectrum());
 */
export function bestModeForTuning(tuning: TuningSystem, spectrum?: Spectrum): Scale {
  if (tuning.degrees.length === 0) {
    throw new RangeError('bestModeForTuning: tuning has no degrees');
  }
  const fullScale = tuningToScale(tuning);

  // Both rankings cover every rotation of a non-empty scale, so the head always exists.
  if (spectrum !== undefined) {
    const ranked = rankAllModesForTimbre(fullScale, tuning, spectrum);
    return (ranked[0] as RankedModeForTimbre).scale;
  }
  const ranked = rankModeSeriesByHarmonicity(fullScale, tuning);
  return (ranked[0] as RankedModeByHarmonicity).scale;
}

/**
 * Compute the mean Sethares dissonance of all entries in a chord map.
 *
 * Socratic Q158: "If we can compute chord map median dissonance, computing the mean dissonance
 * should also be one call — can it?" Today: iterate over all entries, sum dissonances, divide —
 * three manual steps. If a chord map is first-class, its mean dissonance should be one call.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Root frequency for dissonance computation (default 440 Hz).
 * @returns Mean Sethares roughness across all entries.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const mean = chordMapMeanDissonance(chordMap, harmonicSpectrum(), 261.63);
 */
export function chordMapMeanDissonance(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): number {
  if (chordMap.length === 0) {
    throw new RangeError('chordMapMeanDissonance: chordMap must be non-empty');
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const total = chordMap.reduce(
    (sum, entry) => sum + chordObjectDissonance(entry.chord, rootHz, effectiveSpectrum),
    0,
  );
  return total / chordMap.length;
}

/** JSON-serializable summary of a chord progression's dissonance profile. */

export interface ProgressionScoreSummary {
  /** Number of chords in the progression. */
  readonly chordCount: number;
  /** Sum of Sethares dissonance across all chords. */
  readonly totalSmoothness: number;
  /** Mean Sethares dissonance across all chords. */
  readonly meanSmoothness: number;
  /** Index of the chord with the lowest dissonance (most consonant). */
  readonly bestChordIndex: number;
  /** Index of the chord with the highest dissonance (most dissonant). */
  readonly worstChordIndex: number;
}

/**
 * Compute a JSON-serializable score summary of a scale's diatonic chord progression.
 *
 * Socratic Q160: "If we have a progression from a scale and can export it as SMF, exporting
 * the chord progression analysis as a score summary (JSON-serializable) should be one call —
 * can it?" Today: `scaleToChordMap` → extract chords → `chordProgressionAnalysis` → iterate
 * and summarize — four explicit steps. If a Scale's chord progression is first-class, its
 * summary should be one call.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → all diatonic chords.
 * 2. `chordProgressionAnalysis(chords, rootHz, spectrum ?? harmonicSpectrum())` → per-step data.
 * 3. Summarize: count, total/mean dissonance, best/worst index by dissonance.
 *
 * @param scale    - The parent scale.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Absolute frequency of the root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns JSON-serializable summary of the progression's dissonance profile.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` or has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const summary = progressionScoreSummary(major, t12, 261.63);
 * console.log(JSON.stringify(summary));
 */
export function progressionScoreSummary(
  scale: Scale,
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
): ProgressionScoreSummary {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const chordMap = scaleToChordMap(scale, tuning);
  const chords = chordMap.map((e) => e.chord);
  const steps = chordProgressionAnalysis(chords, rootHz, effectiveSpectrum);
  const dissonances = steps.map((s) => s.dissonance);
  const total = dissonances.reduce((acc, d) => acc + d, 0);
  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < dissonances.length; i++) {
    if ((dissonances[i] as number) < (dissonances[bestIdx] as number)) bestIdx = i;
    if ((dissonances[i] as number) > (dissonances[worstIdx] as number)) worstIdx = i;
  }
  return {
    chordCount: steps.length,
    totalSmoothness: total,
    meanSmoothness: total / steps.length,
    bestChordIndex: bestIdx,
    worstChordIndex: worstIdx,
  };
}

/**
 * Descriptive statistics summary of a scale's full chord map analysis.
 *
 * Socratic Q164: "If we can compute a progression score summary from a scale, summarizing
 * the ENTIRE chord map analysis (not just progression) should be one call — can it?"
 * `chordMapAnalysis(scale, tuning, spectrum)` returns per-chord dissonance and harmonicity
 * for every diatonic chord; extracting min/max/mean/median for both axes still requires
 * three manual passes. If a chord map analysis is first-class, summarising it should be
 * one call.
 *
 * Algorithm:
 * 1. `chordMapAnalysis(scale, tuning, spectrum ?? harmonicSpectrum())` → entries.
 * 2. Extract dissonance and harmonicity arrays.
 * 3. Compute min, max, mean, and median for each axis.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns Summary statistics for both dissonance and harmonicity across all diatonic chords.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` or has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const summary = chordMapSummary(major, t12);
 * console.log(summary.meanDissonance, summary.meanHarmonicity);
 */
export function chordMapSummary(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
): {
  count: number;
  minDissonance: number;
  maxDissonance: number;
  meanDissonance: number;
  medianDissonance: number;
  minHarmonicity: number;
  maxHarmonicity: number;
  meanHarmonicity: number;
} {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const entries = chordMapAnalysis(scale, tuning, effectiveSpectrum);
  if (entries.length === 0) {
    throw new RangeError('chordMapSummary: no chord map entries — scale may be too small');
  }
  const dissonances = entries.map((e) => e.dissonance);
  const harmonicities = entries.map((e) => e.harmonicity);

  const median = (sorted: number[]): number => {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? (sorted[mid] as number)
      : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  };

  const sortedDiss = [...dissonances].sort((a, b) => a - b);
  const meanDiss = dissonances.reduce((a, b) => a + b, 0) / dissonances.length;

  const sortedHarm = [...harmonicities].sort((a, b) => a - b);
  const meanHarm = harmonicities.reduce((a, b) => a + b, 0) / harmonicities.length;

  return {
    count: entries.length,
    minDissonance: sortedDiss[0] as number,
    maxDissonance: sortedDiss[sortedDiss.length - 1] as number,
    meanDissonance: meanDiss,
    medianDissonance: median(sortedDiss),
    minHarmonicity: sortedHarm[0] as number,
    maxHarmonicity: sortedHarm[sortedHarm.length - 1] as number,
    meanHarmonicity: meanHarm,
  };
}

/**
 * Harmonicity profile of every modal rotation of a tuning, in mode-index order.
 *
 * Socratic Q176: "If we can rank modes by harmonicity, we should also be able to compute
 * the harmonicity profile (one value per mode rotation) as an array — can it?" Today:
 * `rankModeSeriesByHarmonicity` returns entries sorted by score; recovering the original
 * rotation-order array requires re-sorting by `modeIndex`. If harmonicity is a first-class
 * property of each mode, getting all values in rotation order should be one call.
 *
 * Rotation happens in **cents space**, not degree-index space. A `Scale` names its notes
 * by index into the parent tuning, so rotating the scale that selects *every* degree is a
 * no-op — `scaleMode(tuningToScale(t), k, t)` returns the same index set for every `k`,
 * which made this profile constant (and `tuningHarmonicityCorrelation` unconditionally
 * `NaN`). Mode `k` is instead built directly as the interval set measured from degree `k`:
 * `c[(k + i) mod n] − c[k]`, wrapped up by `periodCents` when it goes negative.
 *
 * Anchoring is irrelevant to the result: Stolzenburg periodicity depends only on the
 * frequency *ratios*, so each rotation is anchored at `tuning.referenceHz`.
 *
 * @param tuning - The tuning system to analyse.
 * @param tol    - Stolzenburg tolerance forwarded to `chordPeriodicity`. Default 0.0136.
 * @returns `number[]` where `result[i]` is the harmonicity of the i-th rotation (lower = more harmonic).
 *
 * @throws {RangeError} if `tuning` has no degrees.
 *
 * @example
 * const profile = tuningHarmonicityProfile(equalTemperament12(440));
 * const bestIdx = profile.indexOf(Math.min(...profile));
 */
export function tuningHarmonicityProfile(tuning: TuningSystem, tol = 0.0136): number[] {
  const n = tuning.degrees.length;
  if (n === 0) {
    throw new RangeError('tuningHarmonicityProfile: tuning has no degrees');
  }
  const cents = tuning.degrees.map((d) => pitchToCents(d));
  return Array.from({ length: n }, (_, k) => {
    const rootCents = cents[k] as number;
    const freqs = Array.from({ length: n }, (_, i) => {
      const raw = (cents[(k + i) % n] as number) - rootCents;
      return centsToFreq(raw < 0 ? raw + tuning.periodCents : raw, tuning.referenceHz);
    });
    return chordPeriodicity(freqs, tol);
  });
}

/**
 * Project a `Scale`'s selected degrees back into a minimal `TuningSystem`.
 *
 * Socratic Q183: "If we can convert a TuningSystem to a Scale, we should also be able to
 * convert a Scale back to a minimal TuningSystem containing only the scale's degrees —
 * can it?" Today: `scaleToTuning` exists but generates a new id and name. If a scale
 * should round-trip back to a tuning with the same identity (same id and name), that
 * requires a separate call. This bridges the identity-preserving direction.
 *
 * Algorithm: For each index in `scale.degreeIndices`, pick `tuning.degrees[idx]` and
 * build a new `TuningSystem` with `id = scale.id`, `name = scale.name`, inheriting
 * `referenceHz`, `periodCents`, and `source` from `tuning`.
 *
 * @param scale  - The scale to project. Must be compatible with `tuning`.
 * @param tuning - The parent `TuningSystem` to pick degrees from.
 * @returns A new `TuningSystem` containing only the scale's selected degrees.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const minimal = scaleToMinimalTuning(major, t12);
 * // minimal.degrees has 7 pitches; minimal.id === 'major'
 */
export function scaleToMinimalTuning(scale: Scale, tuning: TuningSystem): TuningSystem {
  assertTuningMatch(scale, tuning);
  const pickedDegrees = scale.degreeIndices.map((idx) => {
    const degree = tuning.degrees[idx];
    if (degree === undefined) {
      throw new RangeError(
        `scaleToMinimalTuning: degree index ${idx} out of range for tuning '${tuning.id}'`,
      );
    }
    return degree;
  });
  return defineTuning({
    id: scale.id,
    name: scale.name,
    referenceHz: tuning.referenceHz,
    periodCents: tuning.periodCents,
    degrees: pickedDegrees,
    source: tuning.source,
    ...(tuning.region !== undefined ? { region: tuning.region } : {}),
  });
}

/**
 * Compute the Pearson correlation between the harmonicity profiles of two tunings in one call.
 *
 * Socratic Q191: "If we can compute the harmonicity profile of a tuning, comparing two
 * tunings' profiles (correlation score) should be one call — can it?" Today:
 * `tuningHarmonicityProfile(a)` → `tuningHarmonicityProfile(b)` → pad → pearson — four steps.
 * If comparing tuning profiles is first-class, a correlation score should be one call.
 *
 * Algorithm:
 * 1. Get both profiles via `tuningHarmonicityProfile`.
 * 2. Pad the shorter profile with zeros to match the longer one's length.
 * 3. Compute Pearson correlation = cov(a,b) / (std(a) * std(b)).
 * 4. If either std is 0, return NaN.
 *
 * @param tuningA - First tuning system.
 * @param tuningB - Second tuning system.
 * @param tol     - Stolzenburg tolerance forwarded to `tuningHarmonicityProfile`. Default 0.0136.
 * @returns Pearson correlation in [-1, 1], or NaN if either profile is constant.
 *
 * An **equal** temperament always yields NaN, and that is the correct answer rather than a
 * defect: every rotation of an equal division has the identical interval set, so its
 * harmonicity profile is constant and has no variance to correlate against. The measure is
 * only meaningful for unequal tunings, where the modes genuinely differ.
 *
 * @throws {RangeError} if either tuning has no degrees.
 *
 * @example
 * const r = tuningHarmonicityCorrelation(
 *   loadTuningPreset(JUST_INTONATION_5L),
 *   loadTuningPreset(PYTHAGOREAN_12),
 * ); // ≈ 0.456 — both unequal, so both profiles vary
 */
export function tuningHarmonicityCorrelation(
  tuningA: TuningSystem,
  tuningB: TuningSystem,
  tol = 0.0136,
): number {
  const profileA = tuningHarmonicityProfile(tuningA, tol);
  const profileB = tuningHarmonicityProfile(tuningB, tol);
  const len = Math.max(profileA.length, profileB.length);
  const a: number[] = Array.from({ length: len }, (_, i) =>
    i < profileA.length ? (profileA[i] as number) : 0,
  );
  const b: number[] = Array.from({ length: len }, (_, i) =>
    i < profileB.length ? (profileB[i] as number) : 0,
  );
  const meanA = a.reduce((s, v) => s + v, 0) / len;
  const meanB = b.reduce((s, v) => s + v, 0) / len;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < len; i++) {
    const da = (a[i] as number) - meanA;
    const db = (b[i] as number) - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  const stdA = Math.sqrt(varA);
  const stdB = Math.sqrt(varB);
  if (stdA === 0 || stdB === 0) return NaN;
  return cov / (stdA * stdB);
}

/**
 * Rank all scales (modes of a tuning) by a combined smoothness + dissonance score in one call.
 *
 * Socratic Q197: "If we can check whether a scale is stable, we should be able to rank ALL
 * scales (modes of a tuning) by their stability score in one call — can it?" Today:
 * `tuningToScale` → `scaleModeSeries` → per-mode `progressionScoreSummary` +
 * `chordMapMeanDissonance` → sort — four explicit steps. If mode ranking is first-class,
 * ranking all modes by stability should be one call.
 *
 * Combined score = `meanSmoothness + dissonance * 1000`. Lower score = more stable.
 * Result is sorted ascending by combined score.
 *
 * @param tuning      - The parent `TuningSystem`.
 * @param rootHz      - Absolute frequency of the root in Hz.
 * @param spectrum    - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param thresholds  - Unused; accepted for API forward-compatibility.
 * @returns Array of `{ scale, smoothness, dissonance, score }` sorted ascending by score.
 *
 * @example
 * const ranked = rankModesByStability(edo(5), 261.63);
 * // ranked[0].scale is the most stable mode of 5-EDO
 */
export function rankModesByStability(
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
  thresholds?: { smoothness: number; dissonance: number },
): Array<{ scale: Scale; smoothness: number; dissonance: number; score: number }> {
  void thresholds;
  const fullScale = tuningToScale(tuning);
  const modes = scaleModeSeries(fullScale, tuning);
  const entries = modes.map((mode) => {
    const summary = progressionScoreSummary(mode, tuning, rootHz, spectrum);
    const chordMap = scaleToChordMap(mode, tuning);
    const dissonance = chordMapMeanDissonance(chordMap, spectrum, rootHz);
    const smoothness = summary.meanSmoothness;
    const score = smoothness + dissonance * 1000;
    return { scale: mode, smoothness, dissonance, score };
  });
  return entries.sort((a, b) => a.score - b.score);
}

/**
 * Produce a complete JSON-serializable musical report for a tuning in one call.
 *
 * Socratic Q203: "If we have a progression score summary and stability ranking, producing
 * a complete JSON-serializable musical report for a tuning should be one call — can it?"
 * Today: `bestModeForTuning`, `scaleHarmonicity`, `rankModesByStability`,
 * `chordMapSummary`, `tuningHarmonicityProfile` — five separate calls. If tuning analysis
 * is first-class, producing a unified musical report should be one call.
 *
 * Algorithm:
 * 1. `bestModeForTuning(tuning, spectrum)` → best modal `Scale`.
 * 2. `scaleHarmonicity(bestMode, tuning)` → harmonicity score for the best mode.
 * 3. `rankModesByStability(tuning, rootHz, spectrum)` → stability-ranked mode list.
 * 4. `chordMapSummary(bestMode, tuning, spectrum)` → chord map statistics.
 * 5. `tuningHarmonicityProfile(tuning)` → per-mode harmonicity array.
 *
 * @param tuning   - The parent `TuningSystem`. Must be non-empty.
 * @param rootHz   - Absolute frequency of the root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns A JSON-serializable report object.
 *
 * @throws {RangeError} if tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const report = tuningReport(t12, 261.63);
 * console.log(JSON.stringify(report));
 */
export type TuningReportType = {
  id: string;
  name: string;
  degreeCount: number;
  bestMode: { id: string; harmonicity: number };
  stabilityRanking: Array<{ modeId: string; score: number }>;
  chordMapSummary: ReturnType<typeof chordMapSummary>;
  harmonicityProfile: number[];
};

export function tuningReport(
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
): TuningReportType {
  const bestMode = bestModeForTuning(tuning, spectrum);
  const bestHarmonicity = scaleHarmonicity(bestMode, tuning);
  const stabilityRanked = rankModesByStability(tuning, rootHz, spectrum);
  const summary = chordMapSummary(bestMode, tuning, spectrum);
  const profile = tuningHarmonicityProfile(tuning);
  return {
    id: tuning.id,
    name: tuning.name,
    degreeCount: tuning.degrees.length,
    bestMode: { id: bestMode.id, harmonicity: bestHarmonicity },
    stabilityRanking: stabilityRanked.map((e) => ({ modeId: e.scale.id, score: e.score })),
    chordMapSummary: summary,
    harmonicityProfile: profile,
  };
}

/**
 * Compare two tuning systems side-by-side via their full reports in one call.
 *
 * Socratic Q204: "If a tuning report captures all key metrics, comparing two tuning reports
 * side-by-side should be one call — can it?" Today: `tuningReport(tuning1, rootHz, spectrum)`
 * and `tuningReport(tuning2, rootHz, spectrum)` plus `tuningHarmonicityCorrelation` — three
 * explicit steps. If tuning reports are first-class, comparing them should be one call.
 *
 * Algorithm:
 * 1. `tuningReport(tuning1, rootHz, spectrum)` → `a`.
 * 2. `tuningReport(tuning2, rootHz, spectrum)` → `b`.
 * 3. `tuningHarmonicityCorrelation(tuning1, tuning2)` → `correlation`.
 * 4. Compute absolute harmonicity differences from best modes.
 *
 * @param tuning1  - First tuning system.
 * @param tuning2  - Second tuning system.
 * @param rootHz   - Absolute frequency of the root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns Comparison object with both reports, correlation, and harmonicity diffs.
 *
 * @throws {RangeError} if either tuning has no degrees.
 *
 * @example
 * const t5 = edo(5);
 * const t7 = edo(7);
 * const cmp = compareTuningReports(t5, t7, 261.63);
 * console.log(cmp.correlation, cmp.harmonicityDistanceDiff);
 */
export function compareTuningReports(
  tuning1: TuningSystem,
  tuning2: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
): {
  a: TuningReportType;
  b: TuningReportType;
  correlation: number;
  harmonicityDistanceDiff: number;
  bestModeHarmonicityDiff: number;
} {
  const a = tuningReport(tuning1, rootHz, spectrum);
  const b = tuningReport(tuning2, rootHz, spectrum);
  const correlation = tuningHarmonicityCorrelation(tuning1, tuning2);
  const harmonicityDistanceDiff = Math.abs(a.bestMode.harmonicity - b.bestMode.harmonicity);
  const bestModeHarmonicityDiff = harmonicityDistanceDiff;
  return { a, b, correlation, harmonicityDistanceDiff, bestModeHarmonicityDiff };
}

/**
 * Return the single best chord from a scale's chord map with full acoustic scores in one call.
 *
 * Socratic Q206: "If we can filter a chord map by criteria, filtering to only THE BEST chord
 * (single entry with lowest combined score from chordMapAnalysis) should be one call — can it?"
 * Today: `chordMapAnalysis(scale, tuning, spectrum)` → `analysis[0]` — two steps.
 * If the best chord is a meaningful concept, fetching it with full scores should be one call.
 *
 * Returns a `ChordMapAnalysisEntry` (unlike `bestChordMapEntry` which also uses this under
 * the hood — this function makes the spectrum default explicit).
 *
 * @param scale    - The parent scale.
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns The `ChordMapAnalysisEntry` with the lowest dissonance (most consonant).
 *
 * @throws {RangeError} if no chord entries are found.
 *
 * @example
 * const t5 = edo(5);
 * const scale = tuningToScale(t5);
 * const best = singleBestChord(scale, t5);
 * console.log(best.dissonance, best.harmonicity);
 */
export function singleBestChord(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
): ChordMapAnalysisEntry {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const entries = chordMapAnalysis(scale, tuning, effectiveSpectrum);
  const best = entries[0];
  if (best === undefined) {
    throw new RangeError(
      `singleBestChord: no chord entries found for scale '${scale.id}' — scale may be too small`,
    );
  }
  return best;
}

/**
 * Annotate a chord progression with chord descriptions at each step in one call.
 *
 * Socratic Q215: "If we can get a chord map description, annotating a progression with chord
 * descriptions at each step should be one call — can it?" Today: for each chord, call
 * `chordObjectDissonance` + `harmonicityForChord` + label by size — many manual steps.
 * If chord analysis is first-class, annotating a whole progression should be one call.
 *
 * For each chord in `chords[]`: computes `chordObjectDissonance`, `harmonicityForChord`,
 * and a size-based label ('unison'/'dyad'/'triad'/'tetrad'/'pentad'/etc.).
 * Returns `[]` for empty input (does not throw).
 *
 * @param chords   - Array of `Chord` objects to annotate.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns Array of `{ chord, label, dissonance, harmonicity }` in progression order.
 *
 * @example
 * const annotated = annotateProgression(chords, 261.63, harmonicSpectrum());
 * // annotated[0].label === 'triad' for a 3-note chord
 */
export function annotateProgression(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): Array<{ chord: Chord; label: string; dissonance: number; harmonicity: number }> {
  if (chords.length === 0) return [];
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const LABELS: readonly string[] = [
    'unison',
    'unison',
    'dyad',
    'triad',
    'tetrad',
    'pentad',
    'hexad',
    'heptad',
  ];
  return chords.map((chord) => {
    const dissonance = chordObjectDissonance(chord, rootHz, effectiveSpectrum);
    const harmonicity = harmonicityForChord(chord, rootHz);
    const size = chord.intervals.length;
    const label = size < LABELS.length ? (LABELS[size] as string) : `${size}-note chord`;
    return { chord, label, dissonance, harmonicity };
  });
}

/**
 * Return the dissonance value for each chord in a progression as a plain number array.
 *
 * Socratic Q216: "If we can annotate a progression, summarizing the progression's energy arc
 * (dissonance over time) as an array of values should be one call — can it?" Today:
 * `annotateProgression(chords, rootHz, spectrum)` → `result.map(r => r.dissonance)` — two steps.
 * If annotation is first-class, extracting just the dissonance arc should be one call.
 *
 * Returns `[]` for empty input (does not throw).
 *
 * @param chords   - Array of `Chord` objects in progression order.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `number[]` of dissonance values, one per chord, in progression order.
 *
 * @example
 * const arc = progressionEnergyArc(chords, 261.63);
 * // arc[0] is the dissonance of the first chord
 */
export function progressionEnergyArc(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): number[] {
  return annotateProgression(chords, rootHz, spectrum).map((r) => r.dissonance);
}

/**
 * Find the peak-dissonance chord (climax) in a progression in one call.
 *
 * Socratic Q223: "If we can compute an energy arc from a progression, finding the peak
 * dissonance chord (climax) should be one call — can it?" Today:
 * `annotateProgression(chords, rootHz, spectrum)` → find entry with maximum dissonance —
 * two steps. If annotation is first-class, finding the climax should be one call.
 *
 * Returns `undefined` if `chords` is empty.
 *
 * @param chords   - Array of `Chord` objects in progression order.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `{ chord, index, dissonance }` for the chord with the highest dissonance, or `undefined`.
 *
 * @example
 * const climax = progressionClimaxChord(chords, 261.63);
 * if (climax) console.log(climax.index, climax.dissonance);
 */
export function progressionClimaxChord(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): { chord: Chord; index: number; dissonance: number } | undefined {
  const annotated = annotateProgression(chords, rootHz, spectrum);
  if (annotated.length === 0) return undefined;
  let maxIdx = 0;
  for (let i = 1; i < annotated.length; i++) {
    if (
      (annotated[i] as (typeof annotated)[0]).dissonance >
      (annotated[maxIdx] as (typeof annotated)[0]).dissonance
    ) {
      maxIdx = i;
    }
  }
  const entry = annotated[maxIdx] as (typeof annotated)[0];
  return { chord: entry.chord, index: maxIdx, dissonance: entry.dissonance };
}

/**
 * Find the minimum-dissonance chord (resolution) in a progression in one call.
 *
 * Socratic Q224: "If we can find the climax chord, finding the RESOLUTION chord (minimum
 * dissonance) should also be one call — can it?" Today:
 * `annotateProgression(chords, rootHz, spectrum)` → find entry with minimum dissonance —
 * two steps. If annotation is first-class, finding the resolution should be one call.
 *
 * Returns `undefined` if `chords` is empty.
 *
 * @param chords   - Array of `Chord` objects in progression order.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `{ chord, index, dissonance }` for the chord with the lowest dissonance, or `undefined`.
 *
 * @example
 * const resolution = progressionResolutionChord(chords, 261.63);
 * if (resolution) console.log(resolution.index, resolution.dissonance);
 */
export function progressionResolutionChord(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): { chord: Chord; index: number; dissonance: number } | undefined {
  const annotated = annotateProgression(chords, rootHz, spectrum);
  if (annotated.length === 0) return undefined;
  let minIdx = 0;
  for (let i = 1; i < annotated.length; i++) {
    if (
      (annotated[i] as (typeof annotated)[0]).dissonance <
      (annotated[minIdx] as (typeof annotated)[0]).dissonance
    ) {
      minIdx = i;
    }
  }
  const entry = annotated[minIdx] as (typeof annotated)[0];
  return { chord: entry.chord, index: minIdx, dissonance: entry.dissonance };
}

/**
 * Describe a single chord's acoustic properties in one call.
 *
 * Socratic Q225: "If we can describe a chord map, we should also be able to describe a SINGLE
 * CHORD in one call — can it?" Today: `annotateProgression([chord], rootHz, spectrum)` → take
 * first entry — two steps. If chord annotation is first-class, describing a single chord should
 * be one call.
 *
 * @param chord    - The `Chord` to describe.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `{ label, dissonance, harmonicity }` for the chord.
 *
 * @throws {RangeError} if annotation returns no result (internal guard).
 *
 * @example
 * const desc = chordDescription(chord, 261.63);
 * console.log(desc.label, desc.dissonance);
 */
export function chordDescription(
  chord: Chord,
  rootHz: number,
  spectrum?: Spectrum,
): { label: string; dissonance: number; harmonicity: number } {
  const result = annotateProgression([chord], rootHz, spectrum);
  const entry = result[0];
  if (entry === undefined) throw new RangeError('chordDescription: annotation produced no result');
  return { label: entry.label, dissonance: entry.dissonance, harmonicity: entry.harmonicity };
}

/**
 * Compute the overall shape label of a progression's energy arc in one call.
 *
 * Socratic Q227: "If we can get a progression energy arc, computing its overall shape label
 * (ascending/descending/arch/valley/flat) should be one call — can it?" Today:
 * `progressionEnergyArc(chords, rootHz, spectrum)` → analyze shape — two steps.
 * If the arc is first-class, labelling its shape should be one call.
 *
 * Shape rules (applied in order):
 * - `'flat'`: all values within 10% of mean (or fewer than 2 chords).
 * - `'ascending'`: last > first AND Pearson correlation with index > 0.5.
 * - `'descending'`: first > last AND Pearson correlation with index < -0.5.
 * - `'arch'`: max is in middle third (n/3 ≤ index < 2n/3) AND first ≈ last (within 20%).
 * - `'valley'`: min is in middle third AND first ≈ last (within 20%).
 * - `'irregular'`: none of the above.
 *
 * Returns `'flat'` for empty or single-chord input.
 *
 * @param chords   - Array of `Chord` objects in progression order.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns Shape label string.
 *
 * @example
 * const shape = progressionEnergyShape(chords, 261.63);
 * // 'arch' | 'valley' | 'ascending' | 'descending' | 'flat' | 'irregular'
 */
export function progressionEnergyShape(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): string {
  const arc = progressionEnergyArc(chords, rootHz, spectrum);
  const n = arc.length;
  if (n < 2) return 'flat';

  const mean = arc.reduce((s, v) => s + v, 0) / n;

  if (mean === 0) return 'flat';

  const allFlat = arc.every((v) => Math.abs(v - mean) / mean <= 0.1);
  if (allFlat) return 'flat';

  // Pearson correlation with index
  const meanIdx = (n - 1) / 2;
  let num = 0;
  let denArc = 0;
  let denIdx = 0;
  for (let i = 0; i < n; i++) {
    const da = (arc[i] as number) - mean;
    const di = i - meanIdx;
    num += da * di;
    denArc += da * da;
    denIdx += di * di;
  }
  const correlation = denArc === 0 || denIdx === 0 ? 0 : num / Math.sqrt(denArc * denIdx);

  const first = arc[0] as number;
  const last = arc[n - 1] as number;

  if (last > first && correlation > 0.5) return 'ascending';
  if (first > last && correlation < -0.5) return 'descending';

  // Find max and min indices
  let maxIdx = 0;
  let minIdx = 0;
  for (let i = 1; i < n; i++) {
    if ((arc[i] as number) > (arc[maxIdx] as number)) maxIdx = i;
    if ((arc[i] as number) < (arc[minIdx] as number)) minIdx = i;
  }

  const inMiddleThird = (idx: number) => idx >= n / 3 && idx < (2 * n) / 3;
  const endsClose = Math.abs(first - last) / Math.max(Math.abs(first), Math.abs(last), 1e-9) <= 0.2;

  if (inMiddleThird(maxIdx) && endsClose) return 'arch';
  if (inMiddleThird(minIdx) && endsClose) return 'valley';

  return 'irregular';
}

/**
 * Produce a human-readable narrative of a chord progression in one call.
 *
 * Socratic Q228: "If I can annotate, get energy shape, find climax and resolution chords —
 * producing a human-readable narrative should be one call — can it?" → No → implement.
 *
 * @param chords   - Ordered list of chords.
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns A single descriptive string summarising the progression.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chords = progressionFromPattern(major, t12, [0, 3, 4, 0]);
 * const narrative = progressionNarrative(chords, 261.63);
 * // "Progression of 4 chords; energy shape: descending. ..."
 */
export function progressionNarrative(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): string {
  if (chords.length === 0) return 'Empty progression.';

  const annotations = annotateProgression(chords, rootHz, spectrum);
  const labels = annotations.map((a) => a.label);

  if (chords.length === 1) {
    const entry = annotations[0] as (typeof annotations)[0];
    return `Progression of 1 chord; energy shape: flat. Chord: ${entry.label}.`;
  }

  const shape = progressionEnergyShape(chords, rootHz, spectrum);
  const climax = progressionClimaxChord(chords, rootHz, spectrum);
  const resolution = progressionResolutionChord(chords, rootHz, spectrum);

  // Get descriptions for climax and resolution chords
  const climaxDesc = climax !== undefined ? chordDescription(climax.chord, rootHz, spectrum) : null;
  const resolutionDesc =
    resolution !== undefined ? chordDescription(resolution.chord, rootHz, spectrum) : null;

  const climaxPart =
    climaxDesc !== null
      ? `Climax: ${climaxDesc.label} (dissonance ${climaxDesc.dissonance.toFixed(2)}).`
      : '';
  const resolutionPart =
    resolutionDesc !== null
      ? `Resolution: ${resolutionDesc.label} (harmonicity ${resolutionDesc.harmonicity.toFixed(3)}).`
      : '';
  const chordList = labels.join(', ');

  const parts = [
    `Progression of ${chords.length} chords; energy shape: ${shape}.`,
    climaxPart,
    resolutionPart,
    `Chords: ${chordList}.`,
  ].filter((p) => p.length > 0);

  return parts.join(' ');
}

/**
 * Build a histogram of a tuning's degree intervals across the period in one call.
 *
 * Socratic Q233: "If I have all the degrees in cents, can I get a histogram of their
 * distribution across the period in one call?" → No → implement.
 *
 * @param tuning   - The `TuningSystem` whose degrees to bin.
 * @param binCount - Number of equal-width bins across `tuning.periodCents` (default 12).
 * @returns Array of `{ bin, centsMid, count }` for each bin index.
 *
 * @throws {RangeError} if `binCount` <= 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const hist = tuningIntervalHistogram(t12);
 * // hist[0] covers 0–100c; hist[0].centsMid === 50; hist[0].count === 1
 */
export function tuningIntervalHistogram(
  tuning: TuningSystem,
  binCount = 12,
): { bin: number; centsMid: number; count: number }[] {
  if (binCount <= 0) {
    throw new RangeError('tuningIntervalHistogram: binCount must be positive');
  }
  const binSize = tuning.periodCents / binCount;
  const counts = Array.from({ length: binCount }, () => 0);
  for (const degree of tuning.degrees) {
    const cents = pitchToCents(degree);
    const idx = Math.min(Math.floor(cents / binSize), binCount - 1);
    counts[idx] = (counts[idx] as number) + 1;
  }
  return counts.map((count, i) => ({
    bin: i,
    centsMid: (i + 0.5) * binSize,
    count,
  }));
}

/**
 * Compute the interval class histogram (interval vector) of a scale.
 *
 * Socratic Q254: "If I have a scale's interval set, can I compute its interval vector
 * (interval class histogram) in one call?" → No → implement.
 *
 * The interval vector counts how many times each interval class appears among all
 * scale-degree pairs (including the implicit root at 0 cents). Interval classes are
 * mapped by rounding the interval to the nearest multiple of `periodCents / n`.
 *
 * @param scale  - The scale to analyse (must be compatible with `tuning`).
 * @param tuning - The parent `TuningSystem`.
 * @returns `number[]` of length `Math.floor((scale.degreeIndices.length + 1) / 2)`,
 *          where each entry is the count of pairs falling into that interval class.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const vec = scaleIntervalVector(major, t12);
 * // vec has length 4 (= floor(8/2)), counting interval classes 1–4
 */
export function scaleIntervalVector(scale: Scale, tuning: TuningSystem): number[] {
  // Get cents for each degree; prepend root at 0
  const degreeCents = scale.degreeIndices.map((i) => pitchToCents(tuning.degrees[i]!));
  const allCents = [0, ...degreeCents];
  const n = allCents.length;
  const period = tuning.periodCents;
  const halfClasses = Math.floor(n / 2);
  const vector = new Array<number>(halfClasses).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = Math.abs((allCents[j] as number) - (allCents[i] as number)) % period;
      const normalized = Math.min(diff, period - diff); // fold into [0, period/2]
      const classIdx = Math.round((normalized / period) * n) - 1; // 0-based
      if (classIdx >= 0 && classIdx < halfClasses) {
        vector[classIdx] = (vector[classIdx] as number) + 1;
      }
    }
  }

  return vector;
}

/**
 * Compute the total change in dissonance across a chord progression in one call.
 *
 * Socratic Q255: "If I can get a progression's energy arc, can I get the total change in
 * dissonance (sum of absolute differences between consecutive chords) in one call?" → No → implement.
 *
 * Returns the sum `Σ |arc[i+1] - arc[i]|` for all consecutive chord pairs.
 * Returns `0` for progressions of fewer than 2 chords.
 *
 * @param chords   - Ordered list of chords.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns Total absolute dissonance change across the progression (≥ 0).
 *
 * @example
 * const delta = progressionDissonanceDelta([I, IV, V], 261.63, harmonicSpectrum());
 * // delta is the sum of |dissonance changes| between successive chords
 */
export function progressionDissonanceDelta(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): number {
  if (chords.length < 2) return 0;
  const arc = progressionEnergyArc(chords, rootHz, spectrum);
  let total = 0;
  for (let i = 0; i < arc.length - 1; i++) {
    total += Math.abs((arc[i + 1] as number) - (arc[i] as number));
  }
  return total;
}

/**
 * Coefficient of variation of dissonance across a chord map (chord map volatility).
 *
 * Socratic Q261: "If I have a chord map's dissonance range, can I compute its volatility
 * (coefficient of variation of dissonance) in one call?" → No → implement.
 *
 * Returns `std(dissonances) / mean(dissonances)` — the coefficient of variation of the
 * Sethares roughness values across all entries in the chord map. Returns 0 for empty input
 * or when the mean is 0 (all entries are identically consonant).
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Reference frequency for chord realization (default 440 Hz).
 * @returns Coefficient of variation of dissonance (≥ 0). Returns 0 for empty input.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const v = chordMapVolatility(chordMap, harmonicSpectrum(), 261.63);
 * // v is the CV of dissonance across the 7 diatonic triads
 */
export function chordMapVolatility(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): number {
  if (chordMap.length === 0) return 0;
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const scores = chordMap.map((entry) =>
    chordObjectDissonance(entry.chord, rootHz, effectiveSpectrum),
  );
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  if (mean === 0) return 0;
  const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Greedy nearest-neighbour reordering of a chord progression to minimise dissonance jumps.
 *
 * Socratic Q265: "If I can score a progression's smoothness (progressionScoreSummary), can
 * I get a reordered progression that minimises dissonance jumps in one call?" → No → implement.
 *
 * Algorithm: nearest-neighbour greedy reordering starting from index 0, always picking the
 * next chord that minimises |arc[current] - arc[next]| where `arc` is the progression energy
 * arc (per-chord dissonance trajectory).
 *
 * @param chords   - The chord progression to reorder.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @returns Reordered chord progression (same chords, minimised dissonance jumps).
 *
 * @example
 * const smoothed = chordProgressionSmooth(chords, 261.63, harmonicSpectrum());
 */
export function chordProgressionSmooth(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): Chord[] {
  if (chords.length <= 1) return [...chords];
  const arc = progressionEnergyArc(chords, rootHz, spectrum);
  const remaining = new Set(chords.map((_, i) => i));
  const result: Chord[] = [];
  let current = 0;
  remaining.delete(0);
  result.push(chords[0]!);

  while (remaining.size > 0) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (const idx of remaining) {
      const dist = Math.abs((arc[current] ?? 0) - (arc[idx] ?? 0));
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    }
    if (bestIdx === -1) break;
    result.push(chords[bestIdx]!);
    remaining.delete(bestIdx);
    current = bestIdx;
  }
  return result;
}

/**
 * Smoothness ratio of a chord progression: 1 = perfectly smooth, 0 = maximally jagged.
 *
 * Socratic Q273: "If I can compute `progressionDissonanceDelta` (total motion) and
 * `progressionEnergyArc` (per-chord dissonance), can I get a smoothness ratio
 * (actual motion / maximum possible) in one call?" → No → implement.
 *
 * Algorithm:
 * 1. If `chords.length < 2` return `1.0` (trivially smooth).
 * 2. `arc = progressionEnergyArc(chords, rootHz, spectrum)`.
 * 3. `totalDelta = progressionDissonanceDelta(chords, rootHz, spectrum)`.
 * 4. `maxPossible = (max(arc) - min(arc)) * (arc.length - 1)`.
 * 5. If `maxPossible === 0` return `1.0`.
 * 6. Return `1 - totalDelta / maxPossible`.
 *
 * @param chords   - Ordered list of chords.
 * @param rootHz   - Root frequency in Hz.
 * @param spectrum - Optional instrument spectrum.
 * @returns Smoothness ratio ∈ [0, 1] (higher = smoother motion).
 *
 * @example
 * const ratio = progressionSmoothnessRatio(chords, 261.63);
 * // ratio close to 1 → dissonance changes are small; close to 0 → large jumps
 */
export function progressionSmoothnessRatio(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): number {
  if (chords.length < 2) return 1.0;
  const arc = progressionEnergyArc(chords, rootHz, spectrum);
  const totalDelta = progressionDissonanceDelta(chords, rootHz, spectrum);
  const arcMax = Math.max(...arc);
  const arcMin = Math.min(...arc);
  const maxPossible = (arcMax - arcMin) * (arc.length - 1);
  if (maxPossible === 0) return 1.0;
  return 1 - totalDelta / maxPossible;
}

// ---------------------------------------------------------------------------
// Q274 — chordMapSpectralProfile
// ---------------------------------------------------------------------------

/**
 * Per-chord spectral fit (harmonicity) profile for a chord map in one call.
 *
 * Socratic Q274: "If I can compute spectral fit for a tuning and chord map analysis
 * per-entry, can I get a per-chord spectral fit profile for a chord map in one call?"
 * → No → implement.
 *
 * Algorithm:
 * 1. For each `ScaleChordMapEntry`, compute `harmonicityForChord(entry.chord, rootHz, tol)`.
 * 2. Return `{ entry, spectralFit }` for each.
 *
 * @param chordMap - Array of scale chord map entries (e.g. from `scaleToChordMap`).
 * @param spectrum - Instrument spectrum (accepted for API consistency; harmonicity is spectrum-independent).
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param tol      - Continued-fraction tolerance for harmonicity (default 0.0136).
 * @returns Array of `{ entry, spectralFit }`, one per chord map entry, in original order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const profile = chordMapSpectralProfile(chordMap, harmonicSpectrum());
 * // profile[0].spectralFit is the harmonicity of the first diatonic triad
 */
export function chordMapSpectralProfile(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum: Spectrum,
  rootHz = 440,
  tol = 0.0136,
): { entry: ScaleChordMapEntry; spectralFit: number }[] {
  void spectrum; // accepted for API consistency; harmonicity is timbre-independent
  return chordMap.map((entry) => ({
    entry,
    spectralFit: harmonicityForChord(entry.chord, rootHz, tol),
  }));
}

// ---------------------------------------------------------------------------
// Q278 — chordMapSpectralRanking
// ---------------------------------------------------------------------------

/**
 * Sort a chord map by spectral fit (harmonicity) ascending in one call.
 *
 * Socratic Q278: "If I can get a per-chord spectral profile, can I sort the chord map
 * by spectral fit in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapSpectralProfile(chordMap, spectrum, rootHz)` → profile with per-entry spectralFit.
 * 2. Sort ascending by `spectralFit` (most harmonic first).
 * 3. Return `profile.map(p => p.entry)`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Instrument spectrum (accepted for API consistency; harmonicity is spectrum-independent).
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @returns New array of `ScaleChordMapEntry` sorted by spectral fit ascending.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const ranked = chordMapSpectralRanking(chordMap, harmonicSpectrum());
 * // ranked[0] is the most spectrally fit chord
 */
export function chordMapSpectralRanking(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum: Spectrum,
  rootHz?: number,
): ScaleChordMapEntry[] {
  const profile = chordMapSpectralProfile(chordMap, spectrum, rootHz);
  return [...profile].sort((a, b) => a.spectralFit - b.spectralFit).map((p) => p.entry);
}

// ---------------------------------------------------------------------------
// Q279 — tuningProgressionVariety
// ---------------------------------------------------------------------------

/**
 * Consistency score for a chord map: high when harmonicity is low and volatility is low.
 *
 * Socratic Q281: "If volatility measures spread and harmonicity measures center, can I compute
 * a consistency score (high harmonicity, low volatility) in one call?" → No → implement.
 *
 * Algorithm:
 * 1. If `chordMap.length === 0` return `0`.
 * 2. `vol = chordMapVolatility(chordMap, spectrum, rootHz)`.
 * 3. Compute mean harmonicity from per-entry `harmonicityForChord`.
 * 4. If `meanHarmonicity <= 0` return `0`.
 * 5. `return 1 / (1 + vol + meanHarmonicity)` — ranges in (0, 1), high when both are small.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum for volatility computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @returns Consistency score ∈ (0, 1] (or 0 for empty map / zero harmonicity).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const score = chordMapConsistencyScore(chordMap);
 */
export function chordMapConsistencyScore(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): number {
  if (chordMap.length === 0) return 0;
  const vol = chordMapVolatility(chordMap, spectrum, rootHz);
  const meanHarmonicity =
    chordMap.reduce((s, entry) => s + harmonicityForChord(entry.chord, rootHz), 0) /
    chordMap.length;
  if (meanHarmonicity <= 0) return 0;
  return 1 / (1 + vol + meanHarmonicity);
}

// ---------------------------------------------------------------------------
// Q282 — chordMapProgressionBridge
// ---------------------------------------------------------------------------

/**
 * Extract chords from a chord map and return them in dissonance-minimised order in one call.
 *
 * Socratic Q282: "If I have a chord map and can smooth a progression, can I go chord map →
 * optimally-ordered progression in one call?" → No → implement.
 *
 * Algorithm:
 * 1. If `chordMap.length === 0` return `[]`.
 * 2. Extract chords: `chordMap.map(e => e.chord)`.
 * 3. `chordProgressionSmooth(chords, rootHz, spectrum)` → optimally-ordered `Chord[]`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param rootHz   - Root frequency in Hz for dissonance computation.
 * @param spectrum - Optional instrument spectrum.
 * @returns Reordered `Chord[]` with minimised dissonance jumps.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const ordered = chordMapProgressionBridge(chordMap, 261.63);
 * // ordered contains all 7 diatonic triads in smoothest progression order
 */
export function chordMapProgressionBridge(
  chordMap: readonly ScaleChordMapEntry[],
  rootHz: number,
  spectrum?: Spectrum,
): Chord[] {
  if (chordMap.length === 0) return [];
  const chords = chordMap.map((e) => e.chord);
  return chordProgressionSmooth(chords, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q283 — tuningConsistencyProfile
// ---------------------------------------------------------------------------

/**
 * Normalize dissonance and harmonicity scores for all entries in a chord map to [0, 1] in one call.
 *
 * Socratic Q286: "If I have raw dissonance and harmonicity scores per chord, can I normalize
 * them to [0, 1] in one call?" → No → implement.
 *
 * Algorithm:
 * 1. If `chordMap.length === 0` return `[]`.
 * 2. For each entry: compute `dissonance = chordObjectDissonance(chord, rootHz, spectrum ?? harmonicSpectrum())`
 *    and `harmonicity = harmonicityForChord(chord, rootHz)`.
 * 3. Compute min/max for each axis.
 * 4. Normalize each value: `(x - min) / (range || 1)`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @returns Array of `{ entry, normalizedDissonance, normalizedHarmonicity }`, one per chord.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const scores = chordMapNormalizedScores(chordMap);
 * // scores[0].normalizedDissonance ∈ [0, 1]
 */
export function chordMapNormalizedScores(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): { entry: ScaleChordMapEntry; normalizedDissonance: number; normalizedHarmonicity: number }[] {
  if (chordMap.length === 0) return [];
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const raw = chordMap.map((entry) => ({
    entry,
    dissonance: chordObjectDissonance(entry.chord, rootHz, effectiveSpectrum),
    harmonicity: harmonicityForChord(entry.chord, rootHz),
  }));
  const maxDiss = Math.max(...raw.map((a) => a.dissonance));
  const minDiss = Math.min(...raw.map((a) => a.dissonance));
  const maxHarm = Math.max(...raw.map((a) => a.harmonicity));
  const minHarm = Math.min(...raw.map((a) => a.harmonicity));
  const rangeDiss = maxDiss - minDiss || 1;
  const rangeHarm = maxHarm - minHarm || 1;
  return raw.map((a) => ({
    entry: a.entry,
    normalizedDissonance: (a.dissonance - minDiss) / rangeDiss,
    normalizedHarmonicity: (a.harmonicity - minHarm) / rangeHarm,
  }));
}

// ---------------------------------------------------------------------------
// Q288 — tuningReportCard
// ---------------------------------------------------------------------------

/**
 * Compute the Shannon entropy of the dissonance distribution of a chord map in one call.
 *
 * Socratic Q289: "If I have normalized dissonance scores, can I compute the Shannon entropy
 * of the dissonance distribution in one call? High entropy = diverse harmonic vocabulary."
 * → No → implement.
 *
 * Algorithm:
 * 1. If `chordMap.length <= 1` return `0`.
 * 2. `chordMapNormalizedScores(chordMap, spectrum, rootHz)` → normalized dissonance values.
 * 3. Bin into 10 equal bins (0..0.1, 0.1..0.2, etc.).
 * 4. Compute Shannon entropy: `H = -Σ (p * log2(p))` where `p = bin[i] / total`.
 * 5. Return `H` (max is `log2(10) ≈ 3.32` for uniform distribution).
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @returns Shannon entropy in [0, log2(10)] — higher = more diverse harmonic vocabulary.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const h = chordMapEntropyScore(chordMap);
 * // h is the Shannon entropy of the normalized dissonance distribution
 */
export function chordMapEntropyScore(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): number {
  if (chordMap.length <= 1) return 0;
  const normalized = chordMapNormalizedScores(chordMap, spectrum, rootHz);
  const scores = normalized.map((s) => s.normalizedDissonance);
  const bins = new Array(10).fill(0) as number[];
  for (const score of scores) {
    (bins as number[])[Math.min(Math.floor(score * 10), 9)]!++;
  }
  const total = scores.length;
  let H = 0;
  for (const count of bins) {
    if (count > 0) {
      const p = count / total;
      H -= p * Math.log2(p);
    }
  }
  return H;
}

// ---------------------------------------------------------------------------
// Q294 — tuningEntropyProfile
// ---------------------------------------------------------------------------

/**
 * Get spectral ranking, normalized scores, entropy, and consistency for a chord map in one call.
 *
 * Socratic Q302: "If I can get spectral ranking, normalized scores, entropy, and consistency
 * separately, can I get them all at once?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapSpectralRanking(chordMap, spectrum, rootHz)` → ranked entries.
 * 2. `chordMapNormalizedScores(chordMap, spectrum, rootHz)` → normalized scores.
 * 3. `chordMapEntropyScore(chordMap, spectrum, rootHz)` → entropy.
 * 4. `chordMapConsistencyScore(chordMap, spectrum, rootHz)` → consistency.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @returns `{ spectralRanking, normalizedScores, entropy, consistency }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const bundle = chordMapRankedBundle(chordMap, harmonicSpectrum());
 * // bundle.spectralRanking[0] is most spectrally fit chord
 */
export function chordMapRankedBundle(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  spectralRanking: ScaleChordMapEntry[];
  normalizedScores: {
    entry: ScaleChordMapEntry;
    normalizedDissonance: number;
    normalizedHarmonicity: number;
  }[];
  entropy: number;
  consistency: number;
} {
  const spectralRanking = chordMapSpectralRanking(chordMap, spectrum, rootHz);
  const normalizedScores = chordMapNormalizedScores(chordMap, spectrum, rootHz);
  const entropy = chordMapEntropyScore(chordMap, spectrum, rootHz);
  const consistency = chordMapConsistencyScore(chordMap, spectrum, rootHz);
  return { spectralRanking, normalizedScores, entropy, consistency };
}

// ---------------------------------------------------------------------------
// Q304 — bestModeByConsistency
// ---------------------------------------------------------------------------

/**
 * Get volatility, entropy, and consistency for a chord map in one call.
 *
 * Socratic Q306: "If chordMapVolatility, chordMapEntropyScore, and chordMapConsistencyScore
 * all take the same chord map, can I get all three in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapVolatility(chordMap, spectrum, rootHz)` → volatility (CV of dissonance).
 * 2. `chordMapEntropyScore(chordMap, spectrum, rootHz)` → Shannon entropy.
 * 3. `chordMapConsistencyScore(chordMap, spectrum, rootHz)` → consistency ∈ (0, 1].
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @returns `{ volatility, entropy, consistency }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const bundle = chordMapVolatilityBundle(chordMap);
 * // bundle.volatility >= 0; bundle.entropy >= 0; bundle.consistency > 0
 */
export function chordMapVolatilityBundle(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz?: number,
): { volatility: number; entropy: number; consistency: number } {
  const volatility = chordMapVolatility(chordMap, spectrum, rootHz);
  const entropy = chordMapEntropyScore(chordMap, spectrum, rootHz);
  const consistency = chordMapConsistencyScore(chordMap, spectrum, rootHz);
  return { volatility, entropy, consistency };
}

// ---------------------------------------------------------------------------
// Q308 — tuningModeComparison
// ---------------------------------------------------------------------------

/**
 * Build a smooth chord progression for a scale and measure its smoothness in one call.
 *
 * Socratic Q314: "If I can get a smooth progression from a chord map and measure its
 * smoothness, can I do both at once for a scale?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 2. `chordMapProgressionBridge(chordMap, rootHz, spectrum)` → smooth `Chord[]`.
 * 3. `progressionSmoothnessRatio(chords, rootHz, spectrum)` → smoothness ratio.
 *
 * @param scale    - The scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @returns `{ chords, smoothnessRatio }` where `smoothnessRatio ∈ [0, 1]`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const { chords, smoothnessRatio } = modeProgressionBundle(scale, t12);
 * // smoothnessRatio close to 1 means very smooth progression
 */
export function modeProgressionBundle(
  scale: Scale,
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { chords: Chord[]; smoothnessRatio: number } {
  const chordMap = scaleToChordMap(scale, tuning);
  const chords = chordMapProgressionBridge(chordMap, rootHz, spectrum);
  const smoothnessRatio = progressionSmoothnessRatio(chords, rootHz, spectrum);
  return { chords, smoothnessRatio };
}

// ---------------------------------------------------------------------------
// Q315 — tuningBestModeProgression
// ---------------------------------------------------------------------------

/**
 * Get both raw and smoothed chords together with full metrics for a scale in one call.
 *
 * Socratic Q364: "If I can get raw chords and smoothed chords separately, can I return both
 * together with full metrics?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → chordMap.
 * 2. `chordMapProgressionBridge(chordMap, rootHz, spectrum)` → rawChords.
 * 3. `chordProgressionSmooth(rawChords, rootHz, spectrum)` → smoothedChords.
 * 4. `progressionSmoothnessRatio(smoothedChords, rootHz, spectrum)` → smoothnessRatio.
 * 5. `progressionNarrative(smoothedChords, tuning, rootHz, spectrum)` → narrative.
 * 6. `chordMapVolatilityBundle(chordMap, spectrum, rootHz)` → `{ volatility, entropy, consistency }`.
 * Return all eight values.
 *
 * @param scale    - The scale (mode) to analyse.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ chords, smoothedChords, smoothnessRatio, narrative, volatility, entropy, consistency }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const bundle = scaleProgressionFullBundle(scale, t12);
 * console.log(bundle.smoothnessRatio, bundle.narrative, bundle.volatility);
 */
export function scaleProgressionFullBundle(
  scale: Scale,
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): {
  chords: Chord[];
  smoothedChords: Chord[];
  smoothnessRatio: number;
  narrative: string;
  volatility: number;
  entropy: number;
  consistency: number;
} {
  const chordMap = scaleToChordMap(scale, tuning);
  const chords = chordMapProgressionBridge(chordMap, rootHz, spectrum);
  const smoothedChords = chordProgressionSmooth(chords, rootHz, spectrum);
  const smoothnessRatio = progressionSmoothnessRatio(smoothedChords, rootHz, spectrum);
  const narrative = progressionNarrative(smoothedChords, rootHz, spectrum);
  const { volatility, entropy, consistency } = chordMapVolatilityBundle(chordMap, spectrum, rootHz);
  return { chords, smoothedChords, smoothnessRatio, narrative, volatility, entropy, consistency };
}

// ---------------------------------------------------------------------------
// Q378 — tuningModeConsistencyEntropyProfiles
// ---------------------------------------------------------------------------

export function scalePentatonicMinorDensity(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 300, 500, 700, 1000], 30);
}

export function scalePentatonicMajorDensity(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 30);
}

export function scaleChineseGongContent(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 30);
}

export function scaleInSenContent(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 90, 498, 702, 1008], 30);
}

export function scaleHirajoshiContent(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 702, 792], 30);
}

export function scaleYoNaContent(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 30);
}

export function scaleCubanMontuno(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 40);
}

export function scaleAndeanPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 45);
}

export function scaleSambaBaiao(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 40);
}

export function scaleTangoScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 600, 800, 900, 1100], 35);
}

export function scaleJavaneseSlendro(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 231, 474, 717, 960], 50);
}

export function scaleBaliPelog(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 120, 271, 535, 675, 785, 1075], 45);
}

export function scaleThai7Tone(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 171, 343, 514, 686, 857, 1029], 40);
}

export function scaleBurmeseHeptatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 182, 386, 498, 702, 884, 1088], 40);
}

export function scaleMaqamRastV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 342, 498, 702, 906, 1044], 35);
}

export function scaleMaqamHijazV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 94, 342, 498, 702, 792, 1088], 35);
}

export function scalePersianDastgah(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 135, 294, 498, 702, 835, 996], 40);
}

export function scaleArabicMaqamSaba(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 294, 408, 498, 702, 852], 35);
}

export function scaleEthiopianKignit(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 498, 702, 1050], 45);
}

export function scaleWestAfricanPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 906], 45);
}

export function scaleNorthAfricanRasd(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 342, 498, 702, 906, 1044], 40);
}

export function scaleZuluScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 267, 498, 765, 996], 50);
}

export function scaleUzbekShashmakom(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 342, 498, 702, 906, 1044], 40);
}

export function scaleMongolianPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 906], 45);
}

export function scaleTibetanRitual(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 182, 498, 680, 996], 50);
}

export function scaleKazakhDombra(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 231, 498, 729, 996], 45);
}

export function scaleNordicGammalDans(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 612, 702, 906, 1110], 40);
}

export function scaleFinnishRuno(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 45);
}

export function scaleSwedishHardingfele(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 792, 996], 40);
}

export function scaleIcelandicTvisongur(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 45);
}

export function scalePolishMazurka(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 612, 702, 906, 1110], 40);
}

export function scaleCzechLidova(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 906, 996], 40);
}

export function scaleUkrainianDorian(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 906, 996], 40);
}

export function scaleSerbianKolo(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 94, 294, 498, 702, 792, 1088], 40);
}

export function scaleQuechuaPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 50);
}

export function scaleAymaraScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 45);
}

export function scaleGuaraniPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 267, 498, 765, 996], 50);
}

export function scaleTupiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 45);
}

export function scaleRagaTodiV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 90, 294, 612, 702, 792, 1088], 35);
}

export function scaleRagaPurviV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 90, 408, 612, 702, 792, 1088], 35);
}

export function scaleRagaMarwaV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 90, 408, 612, 906, 1110], 35);
}

export function scaleRagaLalita(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 90, 294, 612, 792, 1088], 35);
}

export function scaleYorubaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 45);
}

export function scaleGhanaPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 50);
}

export function scaleMaliKora(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702, 906, 1110], 40);
}

export function scaleGriotScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 180, 408, 612, 792, 996], 45);
}

export function scaleCalypsoScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 40);
}

export function scaleReggaePentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 300, 500, 700, 1000], 45);
}

export function scaleZoukScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 40);
}

export function scaleMerengueScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 40);
}

export function scaleNavajoNightChant(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 50);
}

export function scaleLakotaPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 267, 498, 765, 996], 50);
}

export function scaleHaidaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 498, 702, 1050], 50);
}

export function scaleCherokeePentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 45);
}

export function scaleSomaliPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 45);
}

export function scaleKenyanBenga(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702, 906, 1110], 40);
}

export function scaleMasaiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 50);
}

export function scaleMalagasyScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 45);
}

export function scaleItalianTarantella(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 300, 500, 700, 800, 1000], 40);
}

export function scaleGreekRembetiko(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 350, 500, 700, 800, 1100], 40);
}

export function scalePortugueseFado(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1000], 40);
}

export function scaleCroatianTamburica(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 40);
}

export function scaleBulgarianAsymmetric(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 40);
}

export function scaleAlbanianIso(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 182, 386, 498, 702, 884, 1088], 40);
}

export function scaleMacedonianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 40);
}

export function scaleBosnianSevdah(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 500, 700, 850, 1050], 40);
}

export function scaleSamoanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleFijianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 50);
}

export function scaleTonganScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 45);
}

export function scalePapuaNewGuinea(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 267, 498, 765, 996], 50);
}

export function scaleMayanPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 50);
}

export function scaleGarifulaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 45);
}

export function scaleZapotecScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 45);
}

export function scalePygmyScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 1035], 55);
}

export function scaleAkanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 50);
}

export function scaleEweScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 180, 384, 696, 900], 50);
}

export function scaleYorubaScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 675, 996], 50);
}

export function scaleSwedishHerdingScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 996, 1110], 50);
}

export function scaleNorwegianSlattScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 182, 386, 498, 702, 884, 1088], 50);
}

export function scaleFinnishKanteliScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702, 906, 1110], 50);
}

export function scaleSamiJoikScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 702, 996], 55);
}

export function scaleEthiopianTizitaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 702, 906], 50);
}

export function scaleKenyaBengaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleMalagasyScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 702, 1035], 55);
}

export function scaleUgandanPentatonicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 50);
}

export function scaleKazakhPentatonicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleUzbekScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 182, 386, 498, 702, 884, 1088], 50);
}

export function scaleTajikScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 906, 996], 50);
}

export function scaleTurkmenScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 702, 1035], 55);
}

export function scaleThaiPentScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 171, 514, 686, 1029], 55);
}

export function scaleKhmerScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 171, 343, 686, 857], 55);
}

export function scaleJavaneseSlendroV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 60);
}

export function scaleBurmeseHeptatonicV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702, 906, 1110], 50);
}

export function scaleAndesQuechuaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleAmazonianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 386, 702, 884], 55);
}

export function scaleGuaraniScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 50);
}

export function scaleAymaraScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 60);
}

export function scaleCubanSonScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleCalypsoScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 386, 702, 884], 50);
}

export function scaleHaitianMerengueScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702], 50);
}

export function scaleJamaicanMentoScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 1088], 50);
}

export function scaleMaqamSabaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 408, 702, 792, 996], 50);
}

export function scaleMaqamNahawandScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 792, 1088], 50);
}

export function scaleMaqamKurdScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 94, 294, 498, 702, 792, 996], 50);
}

export function scaleMaqamAjamScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702, 906, 1110], 50);
}

export function scaleAboriginalPentatonicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 55);
}

export function scaleMaoriScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 702, 906], 50);
}

export function scaleVanuatuScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 240, 480, 720, 960], 60);
}

export function scaleSolomonIslandsScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 702, 1035], 55);
}

export function scaleBerberPentatonicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 386, 702, 906], 50);
}

export function scaleNubianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleGnawaMusicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 702, 996], 50);
}

export function scaleTuaregScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 702, 1035], 55);
}

export function scaleGuangdongMusicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702, 906, 1110], 50);
}

export function scaleSichuanOperaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 906, 996], 50);
}

export function scaleShanshuiGuqinScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleYunnanMinorityScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 165, 498, 702, 1035], 55);
}

export function scaleRagaBhairavScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 112, 386, 498, 702, 814, 1088], 50);
}

export function scaleRagaYamanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 612, 702, 906, 1110], 50);
}

export function scaleRagaDeshScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 386, 498, 702, 906, 996], 50);
}

export function scaleRagaKafiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 906, 996], 50);
}

export function scaleGeorgianPolyphonicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 498, 702, 906, 1110], 50);
}

export function scaleArmenianDudukScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 498, 702, 792, 996], 50);
}

export function scaleAzerbaijaniMughamScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 386, 498, 702, 906, 1088], 50);
}

export function scaleChechenLezgiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 498, 702, 996], 50);
}

export function scaleRomanianDorian(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 612, 702, 906, 996], 50);
}

export function scaleHungarianMinorScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 612, 702, 792, 1110], 50);
}

export function scalePolishHighlandScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 408, 612, 702, 906, 1110], 50);
}

export function scaleUkrainianDorianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 204, 294, 612, 702, 906, 1088], 50);
}

export function scaleFlamencoScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 900, 1100], 50);
}

export function scalePortugueseFadoScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleCatalanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleGalicianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleEthiopianAnchihoye(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 500, 700, 850], 50);
}

export function scaleEritreanPentatonic(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 500, 700, 1000], 50);
}

export function scaleSomaliModal(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 700, 900], 50);
}

export function scaleDjiboutianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleKazakhSteppeScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleUzbekDotar(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleTajikFalak(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleKyrgyzScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleAndeseanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 500, 700, 900], 50);
}

export function scaleChileanCueca(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleArgentineZamba(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleBolivianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 500, 700, 1000], 50);
}

export function scaleNorwegianFolkScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleSwedishPolskaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1100], 50);
}

export function scaleFinnishRunoV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleDanishScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleGhanaianHighlife(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleWolofScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 500, 700, 1000], 50);
}

export function scaleMandinkaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1100], 50);
}

export function scaleHausaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleArabicMaqamRast(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleTurkishMakamHicaz(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleIranianShur(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 300, 500, 700, 800, 1000], 50);
}

export function scaleLebaneseMaqam(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleBengaliScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scalePunjabiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleRajasthaniScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleSriLankaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1100], 50);
}

export function scalePuertoRicanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleJamaicanReggaeScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleTrinidadianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 600, 700, 900, 1100], 50);
}

export function scaleBarbadianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleVietnameseScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleFilipinoCulintang(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleMalaysianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleCambodianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleMaoriScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scalePolynesianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 500, 700, 1000], 50);
}

export function scaleAboriginalDreaming(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 300, 500, 700, 1000], 50);
}

export function scalePapuaNewGuineaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 600, 900], 50);
}

export function scaleMoroccanGnawa(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 500, 700, 850], 50);
}

export function scaleTunisianMaqam(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleAlgerianChabi(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleEgyptianRast(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleBrazilianChoro(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleColombianCumbia(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scalePeruvianValsCriollo(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 600, 700, 900, 1100], 50);
}

export function scaleVenezuelanJoropo(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleCongoleseSoukous(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleCameroonMakossa(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleGaboneseTraditional(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 500, 700, 850, 1100], 50);
}

export function scaleRwandanInanga(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleNavajoScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900], 50);
}

export function scaleHopiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleIroquoisScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700], 50);
}

export function scaleInuitScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 900], 50);
}

export function scaleMongolianBowl(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleTibetanSinging(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 850, 1050], 50);
}

export function scaleNepaleseScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleLadakhiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 500, 700, 900, 1100], 50);
}

export function scaleNigerianJuju(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleSenegaleseWolof(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleMaliBamanaSuleba(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleGuineanJeliya(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleZimbabweMbira(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleShonaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleMozambiquanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1100], 50);
}

export function scaleBotswanaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleSyrianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleIraqiMaqam(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 850, 1100], 50);
}

export function scalePalestinianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 500, 700, 900, 1050], 50);
}

export function scaleYemeniScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleKoreanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleMongolianLongSong(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleManchuScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleAinuScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 700, 900], 50);
}

export function scaleYakutScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleChukchiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleEvenkScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleBuryatScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleAleutScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleYupikScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleTlingitScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleAthabaskanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleMayanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleNahuatlScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900], 50);
}

export function scaleMixtecScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleOlmecScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleYanomamiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleWayuuScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleShuarScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleXinguScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleCarnaticScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(
    pitches,
    [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
    50,
  );
}

export function scaleHindustaniScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleTamilScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleGujaratiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleGreekModalScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleByzantineScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleCypriotScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleAnatolianFolkScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 800, 1000], 50);
}

export function scaleWestPolynesianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleMicronesianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleKiribatiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleMarshalleseScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleAppalachianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleOzarkScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleCajunScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleZydecoScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleWelshScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleIrishScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleScottishScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleBretonScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleBasqueScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleAndalusianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleAsturianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleValencianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1100], 50);
}

export function scaleFlemishScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleDutchScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleWalloonScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleLuxembourgScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleSlovenianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleCroatianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleBosnianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleMontenegrinScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleFinnoUgricScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleSamiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleKareliaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleErzyaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleAustrianAlpineScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleBavarianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleTyroleanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleSwissAlpineScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleAboriginalScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleTorresStraitScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleMaoriScaleV3(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleTasmanianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scalePersianClassical(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 90, 400, 500, 700, 790, 1100], 50);
}

export function scaleAzerbaijaniScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 500, 700, 850, 1050], 50);
}

export function scaleUzbekMaqom(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 350, 500, 700, 900, 1050], 50);
}

export function scaleTajikMaqom(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 800, 1100], 50);
}

export function scaleBerberScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleKabyleScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleAmazighScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleChaouiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleTexMexScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleBluegrassScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleGospelScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleAppalachianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleGreenlandicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleFaroeseScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleShetlandScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleOrkneyScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleQuebecoisScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleAcadianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleFrenchCanadianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 800, 1000], 50);
}

export function scaleMetisScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleSicilianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleSardinianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleCorsicanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleMalteseScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleVenetianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleNeapolitanScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 300, 500, 700, 800, 1100], 50);
}

export function scaleTuscanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleLombardScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleWestSlavicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scalePolishScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 800, 1100], 50);
}

export function scaleCzechScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleSlovakScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleTibetoBurmanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleNagaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleKarenScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleShanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleMoldovanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleTranssylvanianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 800, 1100], 50);
}

export function scaleWallachianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleBanatScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleUkrainianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleBelarusianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleCossackScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleRusynScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 800, 1000], 50);
}

export function scaleUralicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleMordvinScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleMariScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleUdmurtScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleSouthSlavicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleMacedonianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleSerbianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleKosovarScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleTurkicScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleTatarScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleBashkirScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleChuvashScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900, 1100], 50);
}

export function scaleHungarianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 600, 700, 800, 1100], 50);
}

export function scaleRomaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 600, 700, 800, 1100], 50);
}

export function scaleSintiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleTransdanubianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleAlbanianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleArbereshScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1100], 50);
}

export function scaleToskScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleGhegScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleGeorgianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleSvanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleMingrelianScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleAdjaraScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleAndalucianFlamenco(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1000], 50);
}

export function scaleGypsyKingsScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 400, 500, 700, 800, 1100], 50);
}

export function scaleGranadaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 100, 300, 500, 700, 800, 1000], 50);
}

export function scaleSevillanaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleCaribbeanCalypsoV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleTrinidadianSteelpanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleJamaicanDancehallScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

export function scaleHaitianKompaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleBaskCountryScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleNavarreScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleAragonScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 800, 1000], 50);
}

export function scaleGalicianScaleV2(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleAndeanQuenaScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleBolivianSaya(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleEcuadorianSanjuanito(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900], 50);
}

export function scaleColombianVallenato(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleWestAfricanGriotScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleMandeScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleSonghaiScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900], 50);
}

export function scaleFulaniScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 150, 350, 700, 850], 50);
}

export function scaleCentralAmericanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1100], 50);
}

export function scaleGuatemalanMarimba(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 500, 700, 900, 1000], 50);
}

export function scaleHondurasGarifuna(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 400, 700, 900], 50);
}

export function scaleNicaraguanScale(pitches: readonly Pitch[]): number {
  return matchScaleTemplate(pitches, [0, 200, 300, 500, 700, 900, 1000], 50);
}

// ---------------------------------------------------------------------------
// matchScaleTemplate — generic consolidation primitive for the Round-series
// named-scale matchers below. Each matcher scores what fraction of a target
// cents set is covered (within `tolerance`) by the input pitches.
// ---------------------------------------------------------------------------

function matchScaleTemplate(
  pitches: readonly Pitch[],
  targetCents: readonly number[],
  tolerance: number,
): number {
  if (pitches.length === 0) return 0;
  const cs = pitches.map((p) => ((pitchToCents(p) % 1200) + 1200) % 1200);
  let matched = 0;
  for (const t of targetCents) {
    if (cs.some((c) => Math.abs(c - t) <= tolerance)) matched++;
  }
  return matched / targetCents.length;
}

// ---------------------------------------------------------------------------
// detectNearestScale — reverse lookup over the named Round-series scale
// matchers. Each matcher scores how well a pitch list fits one named scale;
// this ranks all of them for a given input.
// ---------------------------------------------------------------------------

const NAMED_SCALE_MATCHERS: readonly {
  readonly label: string;
  readonly fn: (pitches: readonly Pitch[]) => number;
}[] = [
  { label: 'Pentatonic Minor Density', fn: scalePentatonicMinorDensity },
  { label: 'Pentatonic Major Density', fn: scalePentatonicMajorDensity },
  { label: 'Chinese Gong', fn: scaleChineseGongContent },
  { label: 'In Sen', fn: scaleInSenContent },
  { label: 'Hirajoshi', fn: scaleHirajoshiContent },
  { label: 'Yo Na', fn: scaleYoNaContent },
  { label: 'Cuban Montuno', fn: scaleCubanMontuno },
  { label: 'Andean Pentatonic', fn: scaleAndeanPentatonic },
  { label: 'Samba Baiao', fn: scaleSambaBaiao },
  { label: 'Tango', fn: scaleTangoScale },
  { label: 'Javanese Slendro', fn: scaleJavaneseSlendro },
  { label: 'Bali Pelog', fn: scaleBaliPelog },
  { label: 'Thai7 Tone', fn: scaleThai7Tone },
  { label: 'Burmese Heptatonic', fn: scaleBurmeseHeptatonic },
  { label: 'Maqam Rast V2', fn: scaleMaqamRastV2 },
  { label: 'Maqam Hijaz V2', fn: scaleMaqamHijazV2 },
  { label: 'Persian Dastgah', fn: scalePersianDastgah },
  { label: 'Arabic Maqam Saba', fn: scaleArabicMaqamSaba },
  { label: 'Ethiopian Kignit', fn: scaleEthiopianKignit },
  { label: 'West African Pentatonic', fn: scaleWestAfricanPentatonic },
  { label: 'North African Rasd', fn: scaleNorthAfricanRasd },
  { label: 'Zulu', fn: scaleZuluScale },
  { label: 'Uzbek Shashmakom', fn: scaleUzbekShashmakom },
  { label: 'Mongolian Pentatonic', fn: scaleMongolianPentatonic },
  { label: 'Tibetan Ritual', fn: scaleTibetanRitual },
  { label: 'Kazakh Dombra', fn: scaleKazakhDombra },
  { label: 'Nordic Gammal Dans', fn: scaleNordicGammalDans },
  { label: 'Finnish Runo', fn: scaleFinnishRuno },
  { label: 'Swedish Hardingfele', fn: scaleSwedishHardingfele },
  { label: 'Icelandic Tvisongur', fn: scaleIcelandicTvisongur },
  { label: 'Polish Mazurka', fn: scalePolishMazurka },
  { label: 'Czech Lidova', fn: scaleCzechLidova },
  { label: 'Ukrainian Dorian (UkrainianDorian)', fn: scaleUkrainianDorian },
  { label: 'Serbian Kolo', fn: scaleSerbianKolo },
  { label: 'Quechua Pentatonic', fn: scaleQuechuaPentatonic },
  { label: 'Aymara (AymaraScale)', fn: scaleAymaraScale },
  { label: 'Guarani Pentatonic', fn: scaleGuaraniPentatonic },
  { label: 'Tupi', fn: scaleTupiScale },
  { label: 'Raga Todi V2', fn: scaleRagaTodiV2 },
  { label: 'Raga Purvi V2', fn: scaleRagaPurviV2 },
  { label: 'Raga Marwa V2', fn: scaleRagaMarwaV2 },
  { label: 'Raga Lalita', fn: scaleRagaLalita },
  { label: 'Yoruba (YorubaScale)', fn: scaleYorubaScale },
  { label: 'Ghana Pentatonic', fn: scaleGhanaPentatonic },
  { label: 'Mali Kora', fn: scaleMaliKora },
  { label: 'Griot', fn: scaleGriotScale },
  { label: 'Calypso (CalypsoScale)', fn: scaleCalypsoScale },
  { label: 'Reggae Pentatonic', fn: scaleReggaePentatonic },
  { label: 'Zouk', fn: scaleZoukScale },
  { label: 'Merengue', fn: scaleMerengueScale },
  { label: 'Navajo Night Chant', fn: scaleNavajoNightChant },
  { label: 'Lakota Pentatonic', fn: scaleLakotaPentatonic },
  { label: 'Haida', fn: scaleHaidaScale },
  { label: 'Cherokee Pentatonic', fn: scaleCherokeePentatonic },
  { label: 'Somali Pentatonic', fn: scaleSomaliPentatonic },
  { label: 'Kenyan Benga', fn: scaleKenyanBenga },
  { label: 'Masai', fn: scaleMasaiScale },
  { label: 'Malagasy (MalagasyScale)', fn: scaleMalagasyScale },
  { label: 'Italian Tarantella', fn: scaleItalianTarantella },
  { label: 'Greek Rembetiko', fn: scaleGreekRembetiko },
  { label: 'Portuguese Fado (PortugueseFado)', fn: scalePortugueseFado },
  { label: 'Croatian Tamburica', fn: scaleCroatianTamburica },
  { label: 'Bulgarian Asymmetric', fn: scaleBulgarianAsymmetric },
  { label: 'Albanian Iso', fn: scaleAlbanianIso },
  { label: 'Macedonian (MacedonianScale)', fn: scaleMacedonianScale },
  { label: 'Bosnian Sevdah', fn: scaleBosnianSevdah },
  { label: 'Samoan', fn: scaleSamoanScale },
  { label: 'Fijian', fn: scaleFijianScale },
  { label: 'Tongan', fn: scaleTonganScale },
  { label: 'Papua New Guinea (PapuaNewGuinea)', fn: scalePapuaNewGuinea },
  { label: 'Mayan Pentatonic', fn: scaleMayanPentatonic },
  { label: 'Garifula', fn: scaleGarifulaScale },
  { label: 'Zapotec', fn: scaleZapotecScale },
  { label: 'Pygmy', fn: scalePygmyScale },
  { label: 'Akan', fn: scaleAkanScale },
  { label: 'Ewe', fn: scaleEweScale },
  { label: 'Yoruba (YorubaScaleV2)', fn: scaleYorubaScaleV2 },
  { label: 'Swedish Herding', fn: scaleSwedishHerdingScale },
  { label: 'Norwegian Slatt', fn: scaleNorwegianSlattScale },
  { label: 'Finnish Kanteli', fn: scaleFinnishKanteliScale },
  { label: 'Sami Joik', fn: scaleSamiJoikScale },
  { label: 'Ethiopian Tizita', fn: scaleEthiopianTizitaScale },
  { label: 'Kenya Benga', fn: scaleKenyaBengaScale },
  { label: 'Malagasy (MalagasyScaleV2)', fn: scaleMalagasyScaleV2 },
  { label: 'Ugandan Pentatonic', fn: scaleUgandanPentatonicScale },
  { label: 'Kazakh Pentatonic', fn: scaleKazakhPentatonicScale },
  { label: 'Uzbek', fn: scaleUzbekScale },
  { label: 'Tajik', fn: scaleTajikScale },
  { label: 'Turkmen', fn: scaleTurkmenScale },
  { label: 'Thai Pent', fn: scaleThaiPentScale },
  { label: 'Khmer', fn: scaleKhmerScale },
  { label: 'Javanese Slendro V2', fn: scaleJavaneseSlendroV2 },
  { label: 'Burmese Heptatonic V2', fn: scaleBurmeseHeptatonicV2 },
  { label: 'Andes Quechua', fn: scaleAndesQuechuaScale },
  { label: 'Amazonian', fn: scaleAmazonianScale },
  { label: 'Guarani', fn: scaleGuaraniScale },
  { label: 'Aymara (AymaraScaleV2)', fn: scaleAymaraScaleV2 },
  { label: 'Cuban Son', fn: scaleCubanSonScale },
  { label: 'Calypso (CalypsoScaleV2)', fn: scaleCalypsoScaleV2 },
  { label: 'Haitian Merengue', fn: scaleHaitianMerengueScale },
  { label: 'Jamaican Mento', fn: scaleJamaicanMentoScale },
  { label: 'Maqam Saba', fn: scaleMaqamSabaScale },
  { label: 'Maqam Nahawand', fn: scaleMaqamNahawandScale },
  { label: 'Maqam Kurd', fn: scaleMaqamKurdScale },
  { label: 'Maqam Ajam', fn: scaleMaqamAjamScale },
  { label: 'Aboriginal Pentatonic', fn: scaleAboriginalPentatonicScale },
  { label: 'Maori (MaoriScale)', fn: scaleMaoriScale },
  { label: 'Vanuatu', fn: scaleVanuatuScale },
  { label: 'Solomon Islands', fn: scaleSolomonIslandsScale },
  { label: 'Berber Pentatonic', fn: scaleBerberPentatonicScale },
  { label: 'Nubian', fn: scaleNubianScale },
  { label: 'Gnawa Music', fn: scaleGnawaMusicScale },
  { label: 'Tuareg', fn: scaleTuaregScale },
  { label: 'Guangdong Music', fn: scaleGuangdongMusicScale },
  { label: 'Sichuan Opera', fn: scaleSichuanOperaScale },
  { label: 'Shanshui Guqin', fn: scaleShanshuiGuqinScale },
  { label: 'Yunnan Minority', fn: scaleYunnanMinorityScale },
  { label: 'Raga Bhairav', fn: scaleRagaBhairavScale },
  { label: 'Raga Yaman', fn: scaleRagaYamanScale },
  { label: 'Raga Desh', fn: scaleRagaDeshScale },
  { label: 'Raga Kafi', fn: scaleRagaKafiScale },
  { label: 'Georgian Polyphonic', fn: scaleGeorgianPolyphonicScale },
  { label: 'Armenian Duduk', fn: scaleArmenianDudukScale },
  { label: 'Azerbaijani Mugham', fn: scaleAzerbaijaniMughamScale },
  { label: 'Chechen Lezgi', fn: scaleChechenLezgiScale },
  { label: 'Romanian Dorian', fn: scaleRomanianDorian },
  { label: 'Hungarian Minor', fn: scaleHungarianMinorScale },
  { label: 'Polish Highland', fn: scalePolishHighlandScale },
  { label: 'Ukrainian Dorian (UkrainianDorianScale)', fn: scaleUkrainianDorianScale },
  { label: 'Flamenco', fn: scaleFlamencoScaleV2 },
  { label: 'Portuguese Fado (PortugueseFadoScale)', fn: scalePortugueseFadoScale },
  { label: 'Catalan', fn: scaleCatalanScale },
  { label: 'Galician (GalicianScale)', fn: scaleGalicianScale },
  { label: 'Ethiopian Anchihoye', fn: scaleEthiopianAnchihoye },
  { label: 'Eritrean Pentatonic', fn: scaleEritreanPentatonic },
  { label: 'Somali Modal', fn: scaleSomaliModal },
  { label: 'Djiboutian', fn: scaleDjiboutianScale },
  { label: 'Kazakh Steppe', fn: scaleKazakhSteppeScale },
  { label: 'Uzbek Dotar', fn: scaleUzbekDotar },
  { label: 'Tajik Falak', fn: scaleTajikFalak },
  { label: 'Kyrgyz', fn: scaleKyrgyzScale },
  { label: 'Andesean', fn: scaleAndeseanScale },
  { label: 'Chilean Cueca', fn: scaleChileanCueca },
  { label: 'Argentine Zamba', fn: scaleArgentineZamba },
  { label: 'Bolivian', fn: scaleBolivianScale },
  { label: 'Norwegian Folk', fn: scaleNorwegianFolkScale },
  { label: 'Swedish Polska', fn: scaleSwedishPolskaScale },
  { label: 'Finnish Runo V2', fn: scaleFinnishRunoV2 },
  { label: 'Danish', fn: scaleDanishScale },
  { label: 'Ghanaian Highlife', fn: scaleGhanaianHighlife },
  { label: 'Wolof', fn: scaleWolofScale },
  { label: 'Mandinka', fn: scaleMandinkaScale },
  { label: 'Hausa', fn: scaleHausaScale },
  { label: 'Arabic Maqam Rast', fn: scaleArabicMaqamRast },
  { label: 'Turkish Makam Hicaz', fn: scaleTurkishMakamHicaz },
  { label: 'Iranian Shur', fn: scaleIranianShur },
  { label: 'Lebanese Maqam', fn: scaleLebaneseMaqam },
  { label: 'Bengali', fn: scaleBengaliScale },
  { label: 'Punjabi', fn: scalePunjabiScale },
  { label: 'Rajasthani', fn: scaleRajasthaniScale },
  { label: 'Sri Lanka', fn: scaleSriLankaScale },
  { label: 'Puerto Rican', fn: scalePuertoRicanScale },
  { label: 'Jamaican Reggae', fn: scaleJamaicanReggaeScale },
  { label: 'Trinidadian', fn: scaleTrinidadianScale },
  { label: 'Barbadian', fn: scaleBarbadianScale },
  { label: 'Vietnamese', fn: scaleVietnameseScale },
  { label: 'Filipino Culintang', fn: scaleFilipinoCulintang },
  { label: 'Malaysian', fn: scaleMalaysianScale },
  { label: 'Cambodian', fn: scaleCambodianScale },
  { label: 'Maori (MaoriScaleV2)', fn: scaleMaoriScaleV2 },
  { label: 'Polynesian', fn: scalePolynesianScale },
  { label: 'Aboriginal Dreaming', fn: scaleAboriginalDreaming },
  { label: 'Papua New Guinea (PapuaNewGuineaScale)', fn: scalePapuaNewGuineaScale },
  { label: 'Moroccan Gnawa', fn: scaleMoroccanGnawa },
  { label: 'Tunisian Maqam', fn: scaleTunisianMaqam },
  { label: 'Algerian Chabi', fn: scaleAlgerianChabi },
  { label: 'Egyptian Rast', fn: scaleEgyptianRast },
  { label: 'Brazilian Choro', fn: scaleBrazilianChoro },
  { label: 'Colombian Cumbia', fn: scaleColombianCumbia },
  { label: 'Peruvian Vals Criollo', fn: scalePeruvianValsCriollo },
  { label: 'Venezuelan Joropo', fn: scaleVenezuelanJoropo },
  { label: 'Congolese Soukous', fn: scaleCongoleseSoukous },
  { label: 'Cameroon Makossa', fn: scaleCameroonMakossa },
  { label: 'Gabonese Traditional', fn: scaleGaboneseTraditional },
  { label: 'Rwandan Inanga', fn: scaleRwandanInanga },
  { label: 'Navajo', fn: scaleNavajoScale },
  { label: 'Hopi', fn: scaleHopiScale },
  { label: 'Iroquois', fn: scaleIroquoisScale },
  { label: 'Inuit', fn: scaleInuitScale },
  { label: 'Mongolian Bowl', fn: scaleMongolianBowl },
  { label: 'Tibetan Singing', fn: scaleTibetanSinging },
  { label: 'Nepalese', fn: scaleNepaleseScale },
  { label: 'Ladakhi', fn: scaleLadakhiScale },
  { label: 'Nigerian Juju', fn: scaleNigerianJuju },
  { label: 'Senegalese Wolof', fn: scaleSenegaleseWolof },
  { label: 'Mali Bamana Suleba', fn: scaleMaliBamanaSuleba },
  { label: 'Guinean Jeliya', fn: scaleGuineanJeliya },
  { label: 'Zimbabwe Mbira', fn: scaleZimbabweMbira },
  { label: 'Shona', fn: scaleShonaScale },
  { label: 'Mozambiquan', fn: scaleMozambiquanScale },
  { label: 'Botswana', fn: scaleBotswanaScale },
  { label: 'Syrian', fn: scaleSyrianScale },
  { label: 'Iraqi Maqam', fn: scaleIraqiMaqam },
  { label: 'Palestinian', fn: scalePalestinianScale },
  { label: 'Yemeni', fn: scaleYemeniScale },
  { label: 'Korean', fn: scaleKoreanScale },
  { label: 'Mongolian Long Song', fn: scaleMongolianLongSong },
  { label: 'Manchu', fn: scaleManchuScale },
  { label: 'Ainu', fn: scaleAinuScale },
  { label: 'Yakut', fn: scaleYakutScale },
  { label: 'Chukchi', fn: scaleChukchiScale },
  { label: 'Evenk', fn: scaleEvenkScale },
  { label: 'Buryat', fn: scaleBuryatScale },
  { label: 'Aleut', fn: scaleAleutScale },
  { label: 'Yupik', fn: scaleYupikScale },
  { label: 'Tlingit', fn: scaleTlingitScale },
  { label: 'Athabaskan', fn: scaleAthabaskanScale },
  { label: 'Mayan', fn: scaleMayanScale },
  { label: 'Nahuatl', fn: scaleNahuatlScale },
  { label: 'Mixtec', fn: scaleMixtecScale },
  { label: 'Olmec', fn: scaleOlmecScale },
  { label: 'Yanomami', fn: scaleYanomamiScale },
  { label: 'Wayuu', fn: scaleWayuuScale },
  { label: 'Shuar', fn: scaleShuarScale },
  { label: 'Xingu', fn: scaleXinguScale },
  { label: 'Carnatic', fn: scaleCarnaticScale },
  { label: 'Hindustani', fn: scaleHindustaniScale },
  { label: 'Tamil', fn: scaleTamilScale },
  { label: 'Gujarati', fn: scaleGujaratiScale },
  { label: 'Greek Modal', fn: scaleGreekModalScale },
  { label: 'Byzantine', fn: scaleByzantineScale },
  { label: 'Cypriot', fn: scaleCypriotScale },
  { label: 'Anatolian Folk', fn: scaleAnatolianFolkScale },
  { label: 'West Polynesian', fn: scaleWestPolynesianScale },
  { label: 'Micronesian', fn: scaleMicronesianScale },
  { label: 'Kiribati', fn: scaleKiribatiScale },
  { label: 'Marshallese', fn: scaleMarshalleseScale },
  { label: 'Appalachian (AppalachianScale)', fn: scaleAppalachianScale },
  { label: 'Ozark', fn: scaleOzarkScale },
  { label: 'Cajun', fn: scaleCajunScale },
  { label: 'Zydeco', fn: scaleZydecoScale },
  { label: 'Welsh', fn: scaleWelshScale },
  { label: 'Irish', fn: scaleIrishScale },
  { label: 'Scottish', fn: scaleScottishScale },
  { label: 'Breton', fn: scaleBretonScale },
  { label: 'Basque', fn: scaleBasqueScale },
  { label: 'Andalusian', fn: scaleAndalusianScale },
  { label: 'Asturian', fn: scaleAsturianScale },
  { label: 'Valencian', fn: scaleValencianScale },
  { label: 'Flemish', fn: scaleFlemishScale },
  { label: 'Dutch', fn: scaleDutchScale },
  { label: 'Walloon', fn: scaleWalloonScale },
  { label: 'Luxembourg', fn: scaleLuxembourgScale },
  { label: 'Slovenian', fn: scaleSlovenianScale },
  { label: 'Croatian', fn: scaleCroatianScaleV2 },
  { label: 'Bosnian', fn: scaleBosnianScale },
  { label: 'Montenegrin', fn: scaleMontenegrinScale },
  { label: 'Finno Ugric', fn: scaleFinnoUgricScale },
  { label: 'Sami', fn: scaleSamiScale },
  { label: 'Karelia', fn: scaleKareliaScale },
  { label: 'Erzya', fn: scaleErzyaScale },
  { label: 'Austrian Alpine', fn: scaleAustrianAlpineScale },
  { label: 'Bavarian', fn: scaleBavarianScale },
  { label: 'Tyrolean', fn: scaleTyroleanScale },
  { label: 'Swiss Alpine', fn: scaleSwissAlpineScale },
  { label: 'Aboriginal', fn: scaleAboriginalScale },
  { label: 'Torres Strait', fn: scaleTorresStraitScale },
  { label: 'Maori (MaoriScaleV3)', fn: scaleMaoriScaleV3 },
  { label: 'Tasmanian', fn: scaleTasmanianScale },
  { label: 'Persian Classical', fn: scalePersianClassical },
  { label: 'Azerbaijani', fn: scaleAzerbaijaniScale },
  { label: 'Uzbek Maqom', fn: scaleUzbekMaqom },
  { label: 'Tajik Maqom', fn: scaleTajikMaqom },
  { label: 'Berber', fn: scaleBerberScale },
  { label: 'Kabyle', fn: scaleKabyleScale },
  { label: 'Amazigh', fn: scaleAmazighScale },
  { label: 'Chaoui', fn: scaleChaouiScale },
  { label: 'Tex Mex', fn: scaleTexMexScale },
  { label: 'Bluegrass', fn: scaleBluegrassScale },
  { label: 'Gospel', fn: scaleGospelScale },
  { label: 'Appalachian (AppalachianScaleV2)', fn: scaleAppalachianScaleV2 },
  { label: 'Greenlandic', fn: scaleGreenlandicScale },
  { label: 'Faroese', fn: scaleFaroeseScale },
  { label: 'Shetland', fn: scaleShetlandScale },
  { label: 'Orkney', fn: scaleOrkneyScale },
  { label: 'Quebecois', fn: scaleQuebecoisScale },
  { label: 'Acadian', fn: scaleAcadianScale },
  { label: 'French Canadian', fn: scaleFrenchCanadianScale },
  { label: 'Metis', fn: scaleMetisScale },
  { label: 'Sicilian', fn: scaleSicilianScale },
  { label: 'Sardinian', fn: scaleSardinianScale },
  { label: 'Corsican', fn: scaleCorsicanScale },
  { label: 'Maltese', fn: scaleMalteseScale },
  { label: 'Venetian', fn: scaleVenetianScale },
  { label: 'Neapolitan', fn: scaleNeapolitanScaleV2 },
  { label: 'Tuscan', fn: scaleTuscanScale },
  { label: 'Lombard', fn: scaleLombardScale },
  { label: 'West Slavic', fn: scaleWestSlavicScale },
  { label: 'Polish', fn: scalePolishScaleV2 },
  { label: 'Czech', fn: scaleCzechScaleV2 },
  { label: 'Slovak', fn: scaleSlovakScale },
  { label: 'Tibeto Burman', fn: scaleTibetoBurmanScale },
  { label: 'Naga', fn: scaleNagaScale },
  { label: 'Karen', fn: scaleKarenScale },
  { label: 'Shan', fn: scaleShanScale },
  { label: 'Moldovan', fn: scaleMoldovanScale },
  { label: 'Transsylvanian', fn: scaleTranssylvanianScale },
  { label: 'Wallachian', fn: scaleWallachianScale },
  { label: 'Banat', fn: scaleBanatScale },
  { label: 'Ukrainian', fn: scaleUkrainianScaleV2 },
  { label: 'Belarusian', fn: scaleBelarusianScale },
  { label: 'Cossack', fn: scaleCossackScale },
  { label: 'Rusyn', fn: scaleRusynScale },
  { label: 'Uralic', fn: scaleUralicScale },
  { label: 'Mordvin', fn: scaleMordvinScale },
  { label: 'Mari', fn: scaleMariScale },
  { label: 'Udmurt', fn: scaleUdmurtScale },
  { label: 'South Slavic', fn: scaleSouthSlavicScale },
  { label: 'Macedonian (MacedonianScaleV2)', fn: scaleMacedonianScaleV2 },
  { label: 'Serbian', fn: scaleSerbianScaleV2 },
  { label: 'Kosovar', fn: scaleKosovarScale },
  { label: 'Turkic', fn: scaleTurkicScale },
  { label: 'Tatar', fn: scaleTatarScale },
  { label: 'Bashkir', fn: scaleBashkirScale },
  { label: 'Chuvash', fn: scaleChuvashScale },
  { label: 'Hungarian', fn: scaleHungarianScaleV2 },
  { label: 'Roma', fn: scaleRomaScale },
  { label: 'Sinti', fn: scaleSintiScale },
  { label: 'Transdanubian', fn: scaleTransdanubianScale },
  { label: 'Albanian', fn: scaleAlbanianScaleV2 },
  { label: 'Arberesh', fn: scaleArbereshScale },
  { label: 'Tosk', fn: scaleToskScale },
  { label: 'Gheg', fn: scaleGhegScale },
  { label: 'Georgian', fn: scaleGeorgianScaleV2 },
  { label: 'Svan', fn: scaleSvanScale },
  { label: 'Mingrelian', fn: scaleMingrelianScale },
  { label: 'Adjara', fn: scaleAdjaraScale },
  { label: 'Andalucian Flamenco', fn: scaleAndalucianFlamenco },
  { label: 'Gypsy Kings', fn: scaleGypsyKingsScale },
  { label: 'Granada', fn: scaleGranadaScale },
  { label: 'Sevillana', fn: scaleSevillanaScale },
  { label: 'Caribbean Calypso V2', fn: scaleCaribbeanCalypsoV2 },
  { label: 'Trinidadian Steelpan', fn: scaleTrinidadianSteelpanScale },
  { label: 'Jamaican Dancehall', fn: scaleJamaicanDancehallScale },
  { label: 'Haitian Kompa', fn: scaleHaitianKompaScale },
  { label: 'Bask Country', fn: scaleBaskCountryScale },
  { label: 'Navarre', fn: scaleNavarreScale },
  { label: 'Aragon', fn: scaleAragonScale },
  { label: 'Galician (GalicianScaleV2)', fn: scaleGalicianScaleV2 },
  { label: 'Andean Quena', fn: scaleAndeanQuenaScale },
  { label: 'Bolivian Saya', fn: scaleBolivianSaya },
  { label: 'Ecuadorian Sanjuanito', fn: scaleEcuadorianSanjuanito },
  { label: 'Colombian Vallenato', fn: scaleColombianVallenato },
  { label: 'West African Griot', fn: scaleWestAfricanGriotScale },
  { label: 'Mande', fn: scaleMandeScale },
  { label: 'Songhai', fn: scaleSonghaiScale },
  { label: 'Fulani', fn: scaleFulaniScale },
  { label: 'Central American', fn: scaleCentralAmericanScale },
  { label: 'Guatemalan Marimba', fn: scaleGuatemalanMarimba },
  { label: 'Honduras Garifuna', fn: scaleHondurasGarifuna },
  { label: 'Nicaraguan', fn: scaleNicaraguanScale },
];

export interface NearestScaleMatch {
  readonly name: string;
  readonly score: number;
}

/**
 * Reverse-lookup: rank named scales by how well `pitches` matches each
 * one, using the library's built-in named-scale matchers
 * (361 scales spanning world music traditions). Returns the top
 * `opts.topN` matches (default 10), sorted by descending score.
 */
export function detectNearestScale(
  pitches: readonly Pitch[],
  opts?: { topN?: number },
): readonly NearestScaleMatch[] {
  const results = NAMED_SCALE_MATCHERS.map((m) => ({ name: m.label, score: m.fn(pitches) }));
  results.sort((a, b) => b.score - a.score);
  const topN = opts?.topN ?? 10;
  return results.slice(0, topN);
}
