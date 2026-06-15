import {
  type TuningSystem,
  defineTuning,
  degreeToCents,
  degreeToFreq,
  tuningToIntervalVector,
} from './tuning.js';
import { type Spectrum } from './spectrum.js';
import { chordDissonance, chordObjectDissonance } from './dissonance.js';
import {
  rankChords,
  type RankedChord,
  type ChordSearchOptions,
  rankedChordToChord,
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
