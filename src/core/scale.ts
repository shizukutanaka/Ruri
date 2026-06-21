import {
  type TuningSystem,
  defineTuning,
  degreeToCents,
  degreeToFreq,
  tuningToIntervalVector,
} from './tuning.js';
import { type Spectrum, harmonicSpectrum } from './spectrum.js';
import { midiToFreq } from './midi.js';
import { pitchToCents } from './cents.js';
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
export interface RankedChordByHarmonicity {
  /** The diatonic chord drawn from the scale. */
  readonly chord: Chord;
  /** Stolzenburg relative periodicity (lower = more harmonic / simpler integer ratios). */
  readonly harmonicity: number;
}

/**
 * Rank the diatonic chords of a scale by Stolzenburg harmonicity (timbre-independent).
 *
 * Socratic Q120: `rankScaleChords(scale, tuning, opts)` ranks by a blend of Sethares
 * roughness + Stolzenburg periodicity — both timbre-dependent (spectrum required).
 * Ranking purely by harmonicity (Stolzenburg periodicity, timbre-independent) requires
 * no spectrum parameter and sorts differently: it reveals which diatonic chords have
 * the simplest integer-ratio relationships regardless of instrument colour.
 *
 * Returns `{ chord, harmonicity }[]` sorted ascending by `harmonicity` (most harmonic
 * = lowest value = simplest ratios first). All diatonic chords of the given `size` are
 * included unless `limit` is provided.
 *
 * @param scale  - The parent scale (must be compatible with `tuning`).
 * @param tuning - The parent `TuningSystem`.
 * @param opts   - Optional: `size` (notes per chord, default 3), `limit` (max results),
 *                 `rootHz` (frequency anchor for ratio computation, default
 *                 `tuning.referenceHz`), `tol` (continued-fraction tolerance, default 0.0136).
 * @returns Entries sorted ascending by `harmonicity` (most harmonic first).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `size` < 2 (forwarded from `rankScaleChords`).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const ranked = rankScaleChordsByHarmonicity(major, t12);
 * // ranked[0] is the diatonic triad with the simplest integer-ratio structure
 */
export function rankScaleChordsByHarmonicity(
  scale: Scale,
  tuning: TuningSystem,
  opts?: { size?: number; limit?: number; rootHz?: number; tol?: number },
): RankedChordByHarmonicity[] {
  assertTuningMatch(scale, tuning);
  const size = opts?.size ?? 3;
  const limit = opts?.limit;
  const rootHz = opts?.rootHz ?? tuning.referenceHz;
  const tol = opts?.tol ?? 0.0136;

  // Build all diatonic chords via scaleToChordMap (size chords)
  const chordMap = scaleToChordMap(scale, tuning, size);

  const entries: RankedChordByHarmonicity[] = chordMap.map(({ chord }) => ({
    chord,
    harmonicity: harmonicityForChord(chord, rootHz, tol),
  }));

  entries.sort((a, b) => a.harmonicity - b.harmonicity);

  return limit !== undefined ? entries.slice(0, limit) : entries;
}

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
 * Sort a `ScaleChordMapEntry[]` by Stolzenburg harmonicity (timbre-independent).
 *
 * Socratic Q131: `scaleToChordMap(scale, tuning)` returns all diatonic chords but
 * ranks by nothing. Sorting by harmonicity requires a manual `.map → .sort` loop.
 * If a chord map is first-class, reordering it by harmonicity should be one call.
 *
 * Returns a new array (does not mutate the input). Sorted ascending — most harmonic
 * (lowest Stolzenburg periodicity = simplest integer ratios) first.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param rootHz   - Reference frequency for harmonicity computation. If omitted,
 *                   defaults to 440 Hz (no tuning reference available in this call).
 * @param tol      - Continued-fraction tolerance (default 0.0136).
 * @returns New array sorted by harmonicity ascending.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const ranked = rankChordMapByHarmonicity(chordMap, t12.referenceHz);
 * // ranked[0] is the diatonic chord with the simplest integer-ratio structure
 */
export function rankChordMapByHarmonicity(
  chordMap: readonly ScaleChordMapEntry[],
  rootHz = 440,
  tol = 0.0136,
): ScaleChordMapEntry[] {
  return [...chordMap].sort(
    (a, b) => harmonicityForChord(a.chord, rootHz, tol) - harmonicityForChord(b.chord, rootHz, tol),
  );
}

/** One entry in the comprehensive per-mode report returned by `scaleModalAnalysis`. */
export interface ScaleModalAnalysisEntry {
  /** The modal rotation index (0 = original scale). */
  readonly modeIndex: number;
  /** The modal rotation (result of `scaleMode(scale, modeIndex, tuning)`). */
  readonly scale: Scale;
  /** Sethares sensory dissonance of this mode's degree-set (timbre-dependent). */
  readonly dissonance: number;
  /** Stolzenburg relative periodicity of this mode's degree-set (timbre-independent). */
  readonly harmonicity: number;
  /**
   * Combined quality score: arithmetic mean of min-max normalised dissonance and
   * harmonicity over the full result set. Lower = better across both dimensions.
   * (Same normalisation as `rankAllModesForTimbre`.)
   */
  readonly quality: number;
  /**
   * Top-N diatonic chords for this mode, ranked by `rankScaleChords` (roughness +
   * periodicity blend). The number of chords is controlled by `chordLimit` (default 3).
   */
  readonly chords: RankedChord[];
}

/**
 * Comprehensive per-mode analysis report: dissonance, harmonicity, quality score,
 * and the top diatonic chords — all in one call.
 *
 * Socratic Q121: `rankAllModesForTimbre(scale, tuning, spectrum)` returns per-mode
 * roughness + harmonicity + combined score but omits the chord palette for each mode.
 * `rankModeChords(scale, tuning, opts)` returns the chord palette per mode but omits
 * the scalar quality metrics. Getting the complete picture — all three metrics plus
 * the diatonic chord pool for every modal rotation — still requires combining two
 * functions and correlating by `modeIndex`. If modes are truly first-class,
 * "complete modal analysis report" should be one call.
 *
 * Returns one `ScaleModalAnalysisEntry` per modal rotation, sorted by `quality`
 * ascending (best mode first). Each entry includes:
 * - `modeIndex`    — rotation index
 * - `scale`        — the modal rotation
 * - `dissonance`   — Sethares roughness
 * - `harmonicity`  — Stolzenburg periodicity
 * - `quality`      — combined score (equal-weighted mean of normalised roughness + harmonicity)
 * - `chords`       — top `chordLimit` diatonic chords (from `rankScaleChords`)
 *
 * @param scale      - The parent scale to rotate.
 * @param tuning     - The parent `TuningSystem`.
 * @param spectrum   - Instrument spectrum (for roughness + chord ranking).
 * @param chordLimit - Max chords to include per mode (default 3).
 * @param tol        - Continued-fraction tolerance for harmonicity (default 0.0136).
 * @returns Array of `ScaleModalAnalysisEntry`, sorted by `quality` ascending.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `chordLimit` < 1.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const report = scaleModalAnalysis(major, t12, harmonicSpectrum());
 * // report[0] is the best mode with its quality metrics and top 3 chords
 * // report[0].chords[0] is the best diatonic chord in that mode
 */
export function scaleModalAnalysis(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  chordLimit = 3,
  tol = 0.0136,
): ScaleModalAnalysisEntry[] {
  assertTuningMatch(scale, tuning);
  if (!Number.isInteger(chordLimit) || chordLimit < 1) {
    throw new RangeError(`scaleModalAnalysis: chordLimit must be >= 1, got ${chordLimit}`);
  }

  const modes = scaleModeSeries(scale, tuning);

  // Compute raw metrics for each mode
  const raw = modes.map((mode, modeIndex) => ({
    modeIndex,
    scale: mode,
    dissonance: scaleDissonance(mode, tuning, spectrum),
    harmonicity: scaleHarmonicity(mode, tuning, tol),
    chords: rankScaleChords(mode, tuning, { spectrum, limit: chordLimit }),
  }));

  // Min-max normalise dissonance and harmonicity independently
  const minD = Math.min(...raw.map((e) => e.dissonance));
  const maxD = Math.max(...raw.map((e) => e.dissonance));
  const minH = Math.min(...raw.map((e) => e.harmonicity));
  const maxH = Math.max(...raw.map((e) => e.harmonicity));
  const eps = 1e-12;

  const entries: ScaleModalAnalysisEntry[] = raw.map((e) => {
    const normD = (e.dissonance - minD) / Math.max(maxD - minD, eps);
    const normH = (e.harmonicity - minH) / Math.max(maxH - minH, eps);
    return { ...e, quality: (normD + normH) / 2 };
  });

  return entries.sort((a, b) => a.quality - b.quality);
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
 * 3. `maxDegrees`: if provided, only consider modes with `degreeIndices.length <= maxDegrees`.
 *
 * @param tuning     - The parent `TuningSystem`.
 * @param spectrum   - Optional instrument spectrum. When provided, combines roughness and
 *                     harmonicity via `rankAllModesForTimbre`. When omitted, uses harmonicity only.
 * @param maxDegrees - Optional filter: only modes with this many or fewer degrees are
 *                     considered. Useful for large tunings to limit search space.
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
export function bestModeForTuning(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  maxDegrees?: number,
): Scale {
  const fullScale = tuningToScale(tuning);

  if (spectrum !== undefined) {
    let ranked = rankAllModesForTimbre(fullScale, tuning, spectrum);
    if (maxDegrees !== undefined) {
      ranked = ranked.filter((e) => e.scale.degreeIndices.length <= maxDegrees);
    }
    if (ranked.length === 0) {
      throw new RangeError('bestModeForTuning: no modes satisfy the maxDegrees constraint');
    }
    return (ranked[0] as RankedModeForTimbre).scale;
  }

  let ranked = rankModeSeriesByHarmonicity(fullScale, tuning);
  if (maxDegrees !== undefined) {
    ranked = ranked.filter((e) => e.scale.degreeIndices.length <= maxDegrees);
  }
  if (ranked.length === 0) {
    throw new RangeError('bestModeForTuning: no modes satisfy the maxDegrees constraint');
  }
  return (ranked[0] as RankedModeByHarmonicity).scale;
}

/**
 * Rank all entries in a `ScaleChordMapEntry[]` by a weighted combination of dissonance
 * and harmonicity, returning entries sorted by combined score ascending (best first).
 *
 * Socratic Q136: If a chord map has both dissonance and harmonicity scores, we can rank
 * by a combined score — can it? `chordMapAnalysis` provides both scores but sorts only
 * by dissonance. `rankChordMapByHarmonicity` sorts only by harmonicity. A single combined-
 * weight sort requires computing both scores per entry and blending them. If a chord map
 * is first-class, combining both axes should be one call.
 *
 * Score formula: `score = dissonanceWeight * roughness + (1 - dissonanceWeight) * harmonicity`.
 * Since no spectrum is available here (unlike `chordMapAnalysis`), roughness = 0, so:
 * `score = (1 - dissonanceWeight) * harmonicity`. Sorting ascending puts most harmonic
 * (lowest harmonicity) entries first when `dissonanceWeight < 1`.
 *
 * @param chordMap         - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param dissonanceWeight - Weight for the roughness axis (0..1, default 0.5).
 *                           0 = pure harmonicity ranking; 1 = all entries score 0 (unsorted).
 * @param rootHz           - Root frequency for harmonicity computation (default 440 Hz).
 * @param tol              - Continued-fraction tolerance for harmonicity (default 0.0136).
 * @returns New array sorted by combined score ascending (most harmonic first).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const ranked = rankChordMapCombined(chordMap);
 * // ranked[0] is the diatonic chord with the best combined harmonicity score
 */
export function rankChordMapCombined(
  chordMap: readonly ScaleChordMapEntry[],
  dissonanceWeight = 0.5,
  rootHz = 440,
  tol = 0.0136,
): ScaleChordMapEntry[] {
  return [...chordMap].sort((a, b) => {
    const hA = harmonicityForChord(a.chord, rootHz, tol);
    const hB = harmonicityForChord(b.chord, rootHz, tol);
    // roughness = 0 (no spectrum available), so score = (1 - dissonanceWeight) * harmonicity
    const scoreA = (1 - dissonanceWeight) * hA;
    const scoreB = (1 - dissonanceWeight) * hB;
    return scoreA - scoreB;
  });
}

/**
 * Find the best-scoring chord from a chord map analysis for a given MIDI note.
 *
 * Socratic Q137: Converting a MIDI note number to a frequency and then finding the most
 * consonant diatonic chord at that root requires: `midiToFreq` → `tuningToScale` →
 * `chordMapAnalysis` → index into result. If MIDI note numbers are valid musical input,
 * "give me the best chord for this MIDI note in this tuning" should be one call.
 *
 * Algorithm:
 * 1. `midiToFreq(midiNote, a4Hz ?? 440)` → rootHz.
 * 2. `tuningToScale(tuning)` → full scale.
 * 3. `chordMapAnalysis(scale, tuning, spectrum ?? harmonicSpectrum(), 3)` → scored chord map.
 * 4. Return `{ chord: analysis[0]!, rootHz }`.
 *
 * @param midiNote - MIDI note number (0..127) to use as the root.
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for dissonance computation. Defaults to
 *                   `harmonicSpectrum()`.
 * @param a4Hz     - Reference frequency for A4 (default 440 Hz).
 * @returns `{ chord: ChordMapAnalysisEntry; rootHz: number }` — the best chord entry and
 *          the computed root frequency.
 *
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { chord, rootHz } = bestChordForMidiNote(60, t12); // C4
 * // chord.chord is the most consonant diatonic triad rooted at middle C
 */
export function bestChordForMidiNote(
  midiNote: number,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  a4Hz?: number,
): { chord: ChordMapAnalysisEntry; rootHz: number } {
  const rootHz = midiToFreq(midiNote, a4Hz ?? 440);
  const scale = tuningToScale(tuning);
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const analysis = chordMapAnalysis(scale, tuning, effectiveSpectrum, 3);
  return { chord: analysis[0] as ChordMapAnalysisEntry, rootHz };
}

/**
 * Sort a `ScaleChordMapEntry[]` by Sethares roughness (ascending), using the provided spectrum.
 *
 * Socratic Q140: `rankChordMapByHarmonicity` sorts by Stolzenburg harmonicity (timbre-
 * independent). `rankChordMapCombined` blends harmonicity and roughness. But sorting purely
 * by Sethares roughness — the sensory dissonance axis alone — has no dedicated one-call path.
 * If ranking by dissonance is a first-class operation (there is `rankModes` which sorts modes
 * by dissonance), sorting a *chord map* by roughness should also be one call.
 *
 * Returns a new array sorted ascending by Sethares roughness (lowest = most consonant = first).
 * Does not mutate the input array. When no spectrum is provided, uses `harmonicSpectrum()`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum for roughness computation.
 *                   Defaults to `harmonicSpectrum()` (harmonic timbre).
 * @param rootHz   - Reference frequency for chord realization (default 440 Hz).
 * @returns New array sorted by Sethares roughness ascending (most consonant first).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const ranked = rankChordMapByDissonance(chordMap, harmonicSpectrum(), 261.63);
 * // ranked[0] is the smoothest-sounding diatonic chord for this timbre
 */
export function rankChordMapByDissonance(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): ScaleChordMapEntry[] {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  return [...chordMap].sort(
    (a, b) =>
      chordObjectDissonance(a.chord, rootHz, effectiveSpectrum) -
      chordObjectDissonance(b.chord, rootHz, effectiveSpectrum),
  );
}

/**
 * Complete chord-map analysis of the best mode in a tuning, in one call.
 *
 * Socratic Q146: "If a tuning can produce a best mode and the mode can produce a chord map,
 * the complete analysis of the best mode should be one call — can it?" Today it requires:
 * `bestModeForTuning(tuning)` → `chordMapAnalysis(mode, tuning, spectrum)` — two explicit
 * steps. This bridges that gap.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `ChordMapAnalysisEntry[]` sorted by dissonance ascending (most consonant first).
 *
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const analysis = bestModeChordAnalysis(t12);
 * // analysis[0] is the most consonant diatonic chord in t12's best mode
 */
export function bestModeChordAnalysis(
  tuning: TuningSystem,
  spectrum?: Spectrum,
): ChordMapAnalysisEntry[] {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const bestMode = bestModeForTuning(tuning, spectrum);
  return chordMapAnalysis(bestMode, tuning, effectiveSpectrum);
}

/**
 * Return the single most dissonant (worst) entry in a `ScaleChordMapEntry[]`.
 *
 * Socratic Q148: "If we have a ScaleChordMapEntry array and we want the entry with the
 * worst (highest) dissonance for comparison, that should be one call — can it?"
 * `rankChordMapByDissonance(chordMap)[last]` gives it, but requires knowing the length
 * and indexing manually. If the best-entry shortcut (`bestChordMapEntry`) is first-class,
 * so should the worst-entry shortcut be.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Reference frequency for chord realization (default 440 Hz).
 * @returns The `ScaleChordMapEntry` with the highest Sethares roughness.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const worst = worstChordMapEntry(chordMap, harmonicSpectrum(), 261.63);
 * // worst is the most dissonant diatonic triad in the major scale
 */
export function worstChordMapEntry(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): ScaleChordMapEntry {
  if (chordMap.length === 0) {
    throw new RangeError('worstChordMapEntry: chordMap must be non-empty');
  }
  const ranked = rankChordMapByDissonance(chordMap, spectrum, rootHz);
  return ranked[ranked.length - 1] as ScaleChordMapEntry;
}

/**
 * Filter a `ScaleChordMapEntry[]` to only entries whose harmonicity is at or below a threshold.
 *
 * Socratic Q150: "If a chord map can be synthesized as WAV, a chord map filtered to only
 * harmonically valid entries should also be one call — can it?" Today, the caller must
 * iterate the map, call `harmonicityForChord` on each entry, and assemble a filtered array
 * manually. If filtering a chord map by acoustic quality is first-class (there is already
 * `rankChordMapByHarmonicity`, `rankChordMapByDissonance`, etc.), keeping only entries below
 * a harmonicity threshold should also be one call.
 *
 * Returns only entries where `harmonicityForChord(entry.chord, rootHz, tol) <= maxHarmonicity`.
 *
 * @param chordMap       - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param maxHarmonicity - Maximum Stolzenburg relative periodicity to keep (exclusive upper bound).
 *                         Must be > 0.
 * @param rootHz         - Reference frequency for harmonicity computation (default 440 Hz).
 * @param tol            - Continued-fraction tolerance (default 0.0136).
 * @returns New array containing only entries with harmonicity ≤ maxHarmonicity.
 *
 * @throws {RangeError} if `maxHarmonicity` <= 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const harmonic = filterChordMapByHarmonicity(chordMap, 10);
 * // harmonic contains only diatonic triads with Stolzenburg periodicity ≤ 10
 */
export function filterChordMapByHarmonicity(
  chordMap: readonly ScaleChordMapEntry[],
  maxHarmonicity: number,
  rootHz = 440,
  tol = 0.0136,
): ScaleChordMapEntry[] {
  if (maxHarmonicity <= 0) {
    throw new RangeError(
      `filterChordMapByHarmonicity: maxHarmonicity must be > 0, got ${maxHarmonicity}`,
    );
  }
  return chordMap.filter(
    (entry) => harmonicityForChord(entry.chord, rootHz, tol) <= maxHarmonicity,
  );
}

/**
 * Compute the median Sethares dissonance of all entries in a chord map.
 *
 * Socratic Q153: "If we can analyze a chord map, the median dissonance of the chord map
 * should be one call — can it?" Today: `rankChordMapByDissonance(chordMap, spectrum, rootHz)`
 * → extract dissonance values → sort → take median — four steps. If a chord map is
 * first-class, summarising its central dissonance should be one call.
 *
 * Algorithm: `rankChordMapByDissonance(chordMap, spectrum, rootHz)` → dissonance values
 * → sorted → median (average of two middle values for even length).
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Reference frequency for dissonance computation (default 440 Hz).
 * @returns Median Sethares roughness value.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const median = chordMapMedianDissonance(chordMap, harmonicSpectrum(), 261.63);
 */
export function chordMapMedianDissonance(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): number {
  if (chordMap.length === 0) {
    throw new RangeError('chordMapMedianDissonance: chordMap must be non-empty');
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const sorted = rankChordMapByDissonance(chordMap, effectiveSpectrum, rootHz);
  const values = sorted.map((e) => chordObjectDissonance(e.chord, rootHz, effectiveSpectrum));
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    return values[mid] as number;
  }
  return ((values[mid - 1] as number) + (values[mid] as number)) / 2;
}

/**
 * Keep only entries from a chord map whose Sethares dissonance is at or below a threshold.
 *
 * Socratic Q156: "If we can filter a chord map by harmonicity threshold, we should also be
 * able to filter it by dissonance threshold in one call — can it?" Today:
 * `rankChordMapByDissonance(chordMap, spectrum, rootHz)` → filter by index — two steps.
 * If a chord map is first-class, filtering by dissonance should be one call.
 *
 * @param chordMap      - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param maxDissonance - Maximum Sethares roughness to keep (exclusive upper bound, must be > 0).
 * @param spectrum      - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz        - Root frequency for dissonance computation (default 440 Hz).
 * @returns New array containing only entries where dissonance ≤ maxDissonance.
 *
 * @throws {RangeError} if `maxDissonance` <= 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const consonant = filterChordMapByDissonance(chordMap, 0.5);
 */
export function filterChordMapByDissonance(
  chordMap: readonly ScaleChordMapEntry[],
  maxDissonance: number,
  spectrum?: Spectrum,
  rootHz = 440,
): ScaleChordMapEntry[] {
  if (maxDissonance <= 0) {
    throw new RangeError(
      `filterChordMapByDissonance: maxDissonance must be > 0, got ${maxDissonance}`,
    );
  }
  if (chordMap.length === 0) {
    throw new RangeError('filterChordMapByDissonance: chordMap must be non-empty');
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  return chordMap.filter(
    (entry) => chordObjectDissonance(entry.chord, rootHz, effectiveSpectrum) <= maxDissonance,
  );
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
 * Filter a chord map to entries satisfying BOTH a harmonicity and a dissonance threshold.
 *
 * Socratic Q166: "If we can filter a chord map by harmonicity and by dissonance, filtering
 * by BOTH simultaneously (entries that satisfy BOTH thresholds) should be one call — can it?"
 * `filterChordMapByHarmonicity` and `filterChordMapByDissonance` each apply one filter.
 * Combining both requires chaining two calls. If chord map filtering is first-class, applying
 * both thresholds simultaneously should be one call.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`). Must be non-empty.
 * @param criteria - Object with optional `maxHarmonicity` and `maxDissonance` thresholds.
 *                   If neither key is provided, returns all entries unchanged.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 *                   Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Root frequency for chord realization (default 440 Hz).
 * @returns New array containing only entries satisfying all provided criteria.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const filtered = filterChordMapByCriteria(chordMap, { maxHarmonicity: 10, maxDissonance: 0.5 });
 * // filtered contains only chords that are both sufficiently harmonic and consonant
 */
export function filterChordMapByCriteria(
  chordMap: readonly ScaleChordMapEntry[],
  criteria: { maxHarmonicity?: number; maxDissonance?: number },
  spectrum?: Spectrum,
  rootHz = 440,
): ScaleChordMapEntry[] {
  if (chordMap.length === 0) {
    throw new RangeError('filterChordMapByCriteria: chordMap must be non-empty');
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  return chordMap.filter((entry) => {
    if (criteria.maxHarmonicity !== undefined) {
      if (harmonicityForChord(entry.chord, rootHz) > criteria.maxHarmonicity) return false;
    }
    if (criteria.maxDissonance !== undefined) {
      if (chordObjectDissonance(entry.chord, rootHz, effectiveSpectrum) > criteria.maxDissonance)
        return false;
    }
    return true;
  });
}

/**
 * Compute the progression score summary for the best mode of a tuning in one call.
 *
 * Socratic Q170: "If we can find a progression score summary, finding the summary for
 * the BEST mode of a tuning should be one call — can it?" Today: `bestModeForTuning(tuning)`
 * → `progressionScoreSummary(mode, tuning, rootHz)` — two explicit steps. If best-mode
 * selection and progression analysis are first-class, combining them should be one call.
 *
 * Algorithm:
 * 1. `bestModeForTuning(tuning, spectrum)` → most harmonically optimal `Scale`.
 * 2. `progressionScoreSummary(mode, tuning, rootHz, spectrum)` → `ProgressionScoreSummary`.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Absolute frequency of the root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `ProgressionScoreSummary` for the best mode's diatonic chord progression.
 *
 * @throws {RangeError} if `tuning` has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const summary = bestModeProgressionSummary(t12, 261.63);
 * console.log(summary.meanSmoothness);
 */
export function bestModeProgressionSummary(
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
): ProgressionScoreSummary {
  if (tuning.degrees.length === 0) {
    throw new RangeError('bestModeProgressionSummary: tuning has no degrees');
  }
  const mode = bestModeForTuning(tuning, spectrum);
  return progressionScoreSummary(mode, tuning, rootHz, spectrum);
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
 * @param tuning - The tuning system to analyse.
 * @param tol    - Stolzenburg tolerance forwarded to `rankModeSeriesByHarmonicity`. Default 0.0136.
 * @returns `number[]` where `result[i]` is the harmonicity of the i-th rotation (lower = more harmonic).
 *
 * @throws {RangeError} if `tuning` has no degrees.
 *
 * @example
 * const profile = tuningHarmonicityProfile(equalTemperament12(440));
 * const bestIdx = profile.indexOf(Math.min(...profile));
 */
export function tuningHarmonicityProfile(tuning: TuningSystem, tol = 0.0136): number[] {
  if (tuning.degrees.length === 0) {
    throw new RangeError('tuningHarmonicityProfile: tuning has no degrees');
  }
  const fullScale = tuningToScale(tuning);
  const ranked = rankModeSeriesByHarmonicity(fullScale, tuning, tol);
  const profile: number[] = new Array(ranked.length) as number[];
  for (const entry of ranked) {
    (profile as number[])[entry.modeIndex] = entry.harmonicity;
  }
  return profile;
}

/**
 * Annotate every entry in a diatonic chord map with a human-readable interval name.
 *
 * Socratic Q178: "If we have a chord map analysis, producing a sorted list of
 * { chord, intervalName } pairs where intervalName describes the chord should be one call
 * — can it?" Today: inspecting `entry.chord.intervals.length` and mapping it to a label
 * requires a manual `.map(…)`. If a chord map is first-class, labelling it should be one call.
 *
 * Labels by interval count: 1='unison', 2='dyad', 3='triad', 4='tetrad', 5='pentad',
 * else `${n}-chord`.
 *
 * @param chordMap - Diatonic chord map entries (e.g. from `scaleToChordMap`).
 * @returns Array of `{ entry: ScaleChordMapEntry, label: string }` in the original map order.
 *
 * @example
 * const labelled = chordMapWithLabels(scaleToChordMap(major, t12));
 * // labelled[0].label === 'triad' for a 3-note chord
 */
export function chordMapWithLabels(
  chordMap: readonly ScaleChordMapEntry[],
): Array<{ entry: ScaleChordMapEntry; label: string }> {
  const labelFor = (n: number): string => {
    if (n === 1) return 'unison';
    if (n === 2) return 'dyad';
    if (n === 3) return 'triad';
    if (n === 4) return 'tetrad';
    if (n === 5) return 'pentad';
    return `${n}-chord`;
  };
  return chordMap.map((entry) => ({
    entry,
    label: labelFor(entry.chord.intervals.length),
  }));
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
 * Compute the full dissonance distribution of a chord map as percentile values.
 *
 * Socratic Q184: "If we can compute the median dissonance of a chord map, we should be
 * able to compute the full dissonance distribution (percentiles) in one call — can it?"
 * Today: `rankChordMapByDissonance` → extract values → compute each percentile manually
 * — three steps. If a chord map is first-class, getting its full distribution should be
 * one call.
 *
 * Algorithm: `rankChordMapByDissonance` → compute dissonance for each entry →
 * for each percentile `p` in [0,1]: value at `floor(p * (n - 1))`.
 *
 * @param chordMap    - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param percentiles - Percentile values in [0,1]. Default: [0, 0.25, 0.5, 0.75, 1].
 * @param spectrum    - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz      - Root frequency in Hz. Default: 440.
 * @returns `Record<string, number>` mapping each percentile (as string key) to its dissonance value.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const percentiles = chordMapDissonancePercentiles(chordMap);
 * // percentiles['0'] is the minimum dissonance, percentiles['1'] is the maximum
 */
export function chordMapDissonancePercentiles(
  chordMap: readonly ScaleChordMapEntry[],
  percentiles: readonly number[] = [0, 0.25, 0.5, 0.75, 1],
  spectrum?: Spectrum,
  rootHz = 440,
): Record<string, number> {
  if (chordMap.length === 0)
    throw new RangeError('chordMapDissonancePercentiles: chordMap must be non-empty');
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const sorted = rankChordMapByDissonance(chordMap, effectiveSpectrum, rootHz);
  const values = sorted.map((e) => chordObjectDissonance(e.chord, rootHz, effectiveSpectrum));
  const n = values.length;
  const result: Record<string, number> = {};
  for (const p of percentiles) {
    const idx = Math.floor(p * (n - 1));
    result[String(p)] = values[idx] as number;
  }
  return result;
}

/**
 * Determine whether a scale qualifies as 'stable' (smooth progressions, low dissonance) in one call.
 *
 * Socratic Q186: "If we can get a progression score summary, checking whether a scale
 * qualifies as 'stable' should be one call — can it?" Today: `progressionScoreSummary`
 * → check `meanSmoothness` → `chordMapMeanDissonance` → compare both — three steps.
 * If stability is a first-class property, checking it should be one call.
 *
 * Algorithm:
 * 1. `progressionScoreSummary(scale, tuning, rootHz, spectrum)` → `meanSmoothness`.
 * 2. `scaleToChordMap(scale, tuning)` → `chordMapMeanDissonance(chordMap, spectrum, rootHz)`.
 * 3. Return `meanSmoothness < thresholds.smoothness && meanDissonance < thresholds.dissonance`.
 *
 * @param scale      - The parent scale.
 * @param tuning     - The parent `TuningSystem`.
 * @param rootHz     - Absolute frequency of the root in Hz.
 * @param spectrum   - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param thresholds - Optional stability thresholds. Defaults to `{ smoothness: 200, dissonance: 0.5 }`.
 * @returns `true` if the scale meets both stability criteria.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` or has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const stable = isScaleStable(major, t12, 261.63);
 */
export function isScaleStable(
  scale: Scale,
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
  thresholds: { smoothness: number; dissonance: number } = { smoothness: 200, dissonance: 0.5 },
): boolean {
  const summary = progressionScoreSummary(scale, tuning, rootHz, spectrum);
  const chordMap = scaleToChordMap(scale, tuning);
  const meanDissonance = chordMapMeanDissonance(chordMap, spectrum, rootHz);
  return summary.meanSmoothness < thresholds.smoothness && meanDissonance < thresholds.dissonance;
}

/**
 * Check whether a Scale → minimal TuningSystem → Scale round-trip is lossless in one call.
 *
 * Socratic Q187: "If we can convert a Scale to a minimal TuningSystem, converting it back
 * and checking if the round-trip is lossless should be one call — can it?" Today:
 * `scaleToMinimalTuning` → `tuningToScale` → compare degreeIndices — three steps.
 * If round-tripping is first-class, verifying it should be one call.
 *
 * Algorithm:
 * 1. `scaleToMinimalTuning(scale, tuning)` → `minimal` TuningSystem.
 * 2. `tuningToScale(minimal)` → `recovered` Scale (degreeIndices = [0,1,...,n-1]).
 * 3. `isLossless` = recovered degree count equals original and indices are sequential [0..n-1].
 *
 * @param scale  - The scale to project. Must be compatible with `tuning`.
 * @param tuning - The parent `TuningSystem`.
 * @returns `{ minimal, recovered, isLossless }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const { isLossless } = scaleMinimalTuningRoundTrip(major, t12);
 * // isLossless === true — all 7 degrees are recovered as [0,1,2,3,4,5,6]
 */
export function scaleMinimalTuningRoundTrip(
  scale: Scale,
  tuning: TuningSystem,
): { minimal: TuningSystem; recovered: Scale; isLossless: boolean } {
  const minimal = scaleToMinimalTuning(scale, tuning);
  const recovered = tuningToScale(minimal);
  const n = scale.degreeIndices.length;
  const isLossless =
    recovered.degreeIndices.length === n && recovered.degreeIndices.every((idx, i) => idx === i);
  return { minimal, recovered, isLossless };
}

/**
 * Group a chord map by interval-count label in one call.
 *
 * Socratic Q185: "If we can label chords in a map, we should be able to group the chord
 * map by label — can it?" Today: `chordMapWithLabels(chordMap)` → iterate and push into a
 * `Map` — two explicit steps. If labelling is first-class, grouping by label should also
 * be one call.
 *
 * Labels: 'unison' (1 note), 'dyad' (2), 'triad' (3), 'tetrad' (4), 'pentad' (5),
 * '${n}-chord' for larger chords.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @returns `Map<string, ScaleChordMapEntry[]>` keyed by label, values in original map order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const grouped = groupChordMapByLabel(chordMap);
 * // grouped.get('triad') — all triads in the map
 */
export function groupChordMapByLabel(
  chordMap: readonly ScaleChordMapEntry[],
): Map<string, ScaleChordMapEntry[]> {
  const labelled = chordMapWithLabels(chordMap);
  const result = new Map<string, ScaleChordMapEntry[]>();
  for (const { entry, label } of labelled) {
    let group = result.get(label);
    if (group === undefined) {
      group = [];
      result.set(label, group);
    }
    group.push(entry);
  }
  return result;
}

/**
 * Count how many chords of each type are in a chord map in one call.
 *
 * Socratic Q189: "If we can group chords by label, we should be able to count how many
 * chords of each type are in a chord map — can it?" Today: `groupChordMapByLabel(chordMap)`
 * → iterate over values and read `.length` — two explicit steps. If grouping is first-class,
 * counting by label should be one call.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @returns `Record<string, number>` where each key is a chord-type label and each value is the count.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const counts = chordMapLabelCounts(chordMap);
 * // counts['triad'] === 7 for a full diatonic triad map
 */
export function chordMapLabelCounts(
  chordMap: readonly ScaleChordMapEntry[],
): Record<string, number> {
  const grouped = groupChordMapByLabel(chordMap);
  const result: Record<string, number> = {};
  for (const [label, entries] of grouped) {
    result[label] = entries.length;
  }
  return result;
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
 * @throws {RangeError} if either tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const r = tuningHarmonicityCorrelation(t12, t19);
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
 * Produce an ASCII bar-chart of a tuning's harmonicity profile in one call.
 *
 * Socratic Q193: "If we can compare tuning harmonicity profiles, producing a visual ASCII
 * bar-chart of the profile should be one call — can it?" Today: `tuningHarmonicityProfile`
 * → iterate values → build bar strings — two explicit steps. If the profile is first-class,
 * visualising it should also be one call.
 *
 * Each line has the form: `'mode {i}: {bar} ({value.toFixed(3)})'` where `bar` is a
 * string of '#' characters proportional to the value relative to the maximum in the
 * profile (default width 40). If all values are zero, all bars are empty.
 *
 * @param tuning - The tuning system.
 * @param tol    - Stolzenburg tolerance forwarded to `tuningHarmonicityProfile`. Default 0.0136.
 * @param width  - Maximum bar width in '#' characters. Default 40.
 * @returns Multi-line string with one line per mode rotation.
 *
 * @throws {RangeError} if tuning has no degrees.
 *
 * @example
 * console.log(harmonicityProfileChart(edo(12)));
 */
export function harmonicityProfileChart(tuning: TuningSystem, tol = 0.0136, width = 40): string {
  const profile = tuningHarmonicityProfile(tuning, tol);
  const max = Math.max(...profile);
  return profile
    .map((v, i) => {
      const barLen = max === 0 ? 0 : Math.round((v / max) * width);
      const bar = '#'.repeat(barLen);
      return `mode ${i}: ${bar} (${v.toFixed(3)})`;
    })
    .join('\n');
}

/**
 * Extract only the triads from a chord map in one call.
 *
 * Socratic Q196: "If we can group chord map entries by label, we should be able to extract
 * only the triads from a chord map in one call — can it?" Today: `groupChordMapByLabel(chordMap)`
 * → `.get('triad') ?? []` — two explicit steps. If grouping is first-class, extracting triads
 * should be one call.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @returns All `ScaleChordMapEntry` items whose chord has exactly 3 intervals (triads).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12, 3);
 * const triads = chordMapTriads(chordMap);
 */
export function chordMapTriads(chordMap: readonly ScaleChordMapEntry[]): ScaleChordMapEntry[] {
  return groupChordMapByLabel(chordMap).get('triad') ?? [];
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
 * Check whether the best mode of a tuning is stable in one call.
 *
 * Socratic Q199: "If we can check scale stability and rank scales by stability, checking if
 * THE BEST MODE of a tuning is stable should be one call — can it?" Today:
 * `bestModeForTuning(tuning, spectrum)` → `isScaleStable(mode, tuning, rootHz, spectrum, thresholds)` —
 * two explicit steps. If best-mode detection and stability checking are first-class,
 * combining them should be one call.
 *
 * Algorithm:
 * 1. `bestModeForTuning(tuning, spectrum)` → most harmonically optimal `Scale`.
 * 2. `isScaleStable(mode, tuning, rootHz, spectrum, thresholds)` → boolean.
 *
 * @param tuning     - The parent `TuningSystem`. Must be non-empty.
 * @param rootHz     - Absolute frequency of the root in Hz.
 * @param spectrum   - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param thresholds - Optional stability thresholds. Defaults: `{ smoothness: 200, dissonance: 0.5 }`.
 * @returns `true` if the best mode passes both the smoothness and dissonance thresholds.
 *
 * @throws {RangeError} if tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const stable = isBestModeStable(t12, 261.63);
 */
export function isBestModeStable(
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
  thresholds?: { smoothness: number; dissonance: number },
): boolean {
  const bestMode = bestModeForTuning(tuning, spectrum);
  return isScaleStable(bestMode, tuning, rootHz, spectrum, thresholds);
}

/**
 * Extract only the dyads (interval pairs) from a chord map in one call.
 *
 * Socratic Q200: "If we have a chord map, extracting only the DYADS (interval pairs) from
 * it should be one call — can it?" Today: `groupChordMapByLabel(chordMap).get('dyad') ?? []` —
 * two explicit steps. If grouping is first-class, extracting dyads should be one call.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @returns All `ScaleChordMapEntry` items whose chord has exactly 2 intervals (dyads).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12, 2);
 * const dyads = chordMapDyads(chordMap);
 */
export function chordMapDyads(chordMap: readonly ScaleChordMapEntry[]): ScaleChordMapEntry[] {
  return groupChordMapByLabel(chordMap).get('dyad') ?? [];
}

/**
 * Check whether two tunings have similar harmonic character in one call.
 *
 * Socratic Q201: "If we can compute harmonicity profiles and correlations, checking whether
 * two tunings have SIMILAR harmonic character (correlation > threshold) should be one call
 * — can it?" Today: `tuningHarmonicityCorrelation(tuningA, tuningB, tol)` → compare to
 * threshold — two explicit steps. If correlation is first-class, similarity should be one call.
 *
 * Returns `false` if the correlation is NaN (either profile is constant).
 *
 * @param tuningA   - First tuning system.
 * @param tuningB   - Second tuning system.
 * @param threshold - Minimum correlation to qualify as "similar" (default 0.7).
 * @param tol       - Stolzenburg tolerance forwarded to `tuningHarmonicityCorrelation`. Default 0.0136.
 * @returns `true` if Pearson correlation ≥ `threshold` and is not NaN.
 *
 * @throws {RangeError} if either tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t24 = edo(24);
 * const similar = areTuningsSimilar(t12, t24);
 */
export function areTuningsSimilar(
  tuningA: TuningSystem,
  tuningB: TuningSystem,
  threshold = 0.7,
  tol?: number,
): boolean {
  const correlation = tuningHarmonicityCorrelation(tuningA, tuningB, tol);
  if (Number.isNaN(correlation)) return false;
  return correlation >= threshold;
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
 * Extract mode stability scores as a plain number array in one call.
 *
 * Socratic Q205: "If we can rank modes by stability, the stability SCORES should be
 * extractable as a plain number array in one call — can it?" Today:
 * `rankModesByStability(tuning, rootHz, spectrum)` → `result.map(r => r.score)` — two steps.
 * If ranked scores are first-class, extracting them should be one call.
 *
 * @param tuning   - The parent `TuningSystem`. Must be non-empty.
 * @param rootHz   - Absolute frequency of the root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `number[]` of stability scores in ascending order (best / lowest first).
 *
 * @throws {RangeError} if tuning has no degrees.
 *
 * @example
 * const scores = modeStabilityScores(edo(5), 261.63);
 * // scores[0] is the lowest (best) stability score across all modes of 5-EDO
 */
export function modeStabilityScores(
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
): number[] {
  return rankModesByStability(tuning, rootHz, spectrum).map((r) => r.score);
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
 * Compute the ratio of dyads to triads in a chord map in one call.
 *
 * Socratic Q209: "If we have chord map dyads and triads, computing the DIAD-TO-TRIAD ratio
 * (how many interval pairs vs triads are in a chord map) should be one call — can it?" Today:
 * `chordMapDyads(chordMap).length / chordMapTriads(chordMap).length` — multiple steps plus
 * manual guard against division by zero. If both counts are first-class, the ratio should
 * be one call.
 *
 * Guards division by zero with `Math.max(1, triadCount)`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @returns The ratio `dyads.length / max(1, triads.length)`.
 *
 * @example
 * const chordMap = scaleToChordMap(scale, tuning, 2);
 * const ratio = chordMapDyadTriadRatio(chordMap);
 * // 0 dyads + 7 triads → 0;  7 dyads + 0 triads → 7
 */
export function chordMapDyadTriadRatio(chordMap: readonly ScaleChordMapEntry[]): number {
  return chordMapDyads(chordMap).length / Math.max(1, chordMapTriads(chordMap).length);
}

/**
 * Produce a human-readable summary sentence describing a chord map in one call.
 *
 * Socratic Q213: "If we can label chord map entries, producing a SUMMARY SENTENCE describing
 * the chord map should be one call — can it?" Today: `chordMapLabelCounts(chordMap)` → build
 * string manually — two steps. If the label counts are first-class, summarizing them as a
 * sentence should be one call.
 *
 * Format: `'${total} chords: ${label count pairs}'`
 * e.g. `'7 chords: 7 triads'` or `'10 chords: 2 dyads, 7 triads, 1 tetrad'`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @returns A human-readable summary string.
 *
 * @example
 * const desc = chordMapDescription(scaleToChordMap(major, t12));
 * // '7 chords: 7 triads'
 */
export function chordMapDescription(chordMap: readonly ScaleChordMapEntry[]): string {
  const total = chordMap.length;
  const counts = chordMapLabelCounts(chordMap);
  const pairs = Object.entries(counts)
    .map(([label, count]) => `${count} ${label}`)
    .join(', ');
  return `${total} chords: ${pairs}`;
}

/**
 * Compute a similarity score between two tuning reports in one call.
 *
 * Socratic Q214: "If we can rank presets by harmonicity, scoring two tunings' similarity
 * from their reports without computing profiles explicitly should be one call — can it?"
 * Today: extract `bestMode.harmonicity` from both, compute abs difference, invert — three
 * steps. If report-based comparison is first-class, a similarity score should be one call.
 *
 * Returns `1 / (1 + |reportA.bestMode.harmonicity - reportB.bestMode.harmonicity|)`.
 * Range: (0, 1] where 1 = identical best-mode harmonicity. Pure function, no throws.
 *
 * @param reportA - First tuning report.
 * @param reportB - Second tuning report.
 * @returns Similarity score in the range (0, 1].
 *
 * @example
 * const r1 = tuningReport(t12, 261.63);
 * const r2 = tuningReport(t12, 261.63);
 * const sim = tuningReportSimilarity(r1, r2);
 * // sim === 1 (identical reports)
 */
export function tuningReportSimilarity(
  reportA: TuningReportType,
  reportB: TuningReportType,
): number {
  return 1 / (1 + Math.abs(reportA.bestMode.harmonicity - reportB.bestMode.harmonicity));
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
 * Find the first chord in a progression that matches a given label in one call.
 *
 * Socratic Q217: "If we can get a chord description (label), finding the first chord in a
 * progression that matches a given label should be one call — can it?" Today:
 * `annotateProgression(chords, rootHz, spectrum)` → `find(e => e.label === label)` — two steps.
 * If progression annotation is first-class, searching by label should be one call.
 *
 * Returns `undefined` if no chord with the given label is found.
 *
 * @param chords   - Array of `Chord` objects to search.
 * @param label    - Label string to match (e.g. `'triad'`, `'dyad'`).
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @returns `{ chord: Chord, index: number }` for the first match, or `undefined`.
 *
 * @example
 * const result = findChordByLabel(chords, 'triad', 261.63);
 * if (result) console.log(result.index, result.chord.name);
 */
export function findChordByLabel(
  chords: readonly Chord[],
  label: string,
  rootHz: number,
  spectrum?: Spectrum,
): { chord: Chord; index: number } | undefined {
  const annotated = annotateProgression(chords, rootHz, spectrum);
  const idx = annotated.findIndex((e) => e.label === label);
  if (idx === -1) return undefined;
  const entry = annotated[idx] as (typeof annotated)[0];
  return { chord: entry.chord, index: idx };
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
 * Return both the best and worst `ChordMapAnalysisEntry` from a chord map in one call.
 *
 * Socratic Q231: "If I can get best and worst ChordMapAnalysisEntry separately, can I get
 * both bundled in one call?" → No → implement.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`). Must be non-empty.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Reference frequency for chord realization (default 440 Hz).
 * @returns `{ best, worst }` where `best` has the lowest dissonance and `worst` has the highest.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const { best, worst } = chordMapBestWorstBundle(chordMap);
 */
export function chordMapBestWorstBundle(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum?: Spectrum,
  rootHz = 440,
): { best: ChordMapAnalysisEntry; worst: ChordMapAnalysisEntry } {
  if (chordMap.length === 0) {
    throw new RangeError('chordMapBestWorstBundle: chordMap must be non-empty');
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();

  // Score every entry with dissonance + harmonicity
  const scored: ChordMapAnalysisEntry[] = chordMap.map((entry) => ({
    degreeOffset: entry.degreeOffset,
    chord: entry.chord,
    dissonance: chordObjectDissonance(entry.chord, rootHz, effectiveSpectrum),
    harmonicity: harmonicityForChord(entry.chord, rootHz),
  }));

  // Find best (lowest dissonance) and worst (highest dissonance)
  let bestEntry = scored[0] as ChordMapAnalysisEntry;
  let worstEntry = scored[0] as ChordMapAnalysisEntry;
  for (let i = 1; i < scored.length; i++) {
    const e = scored[i] as ChordMapAnalysisEntry;
    if (e.dissonance < bestEntry.dissonance) bestEntry = e;
    if (e.dissonance > worstEntry.dissonance) worstEntry = e;
  }

  return { best: bestEntry, worst: worstEntry };
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
 * Render a tuning's interval histogram as an ASCII bar chart in one call.
 *
 * Socratic Q235: "If I have a tuningIntervalHistogram, can I render it as an ASCII bar
 * chart in one call?" → No → implement.
 *
 * @param tuning   - The `TuningSystem` whose degrees to visualise.
 * @param binCount - Number of equal-width bins across `tuning.periodCents` (default 12).
 * @param width    - Maximum bar width in block characters (default 20).
 * @returns A multi-line string with one row per bin: "bin{i} | {bar} | {count}".
 *
 * @throws {RangeError} if `binCount` <= 0 (propagated from `tuningIntervalHistogram`).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * console.log(tuningHistogramChart(t12));
 * // bin 0 | ████████████████████ | 1
 * // bin 1 | ████████████████████ | 1
 * // ...
 */
export function tuningHistogramChart(
  tuning: TuningSystem,
  binCount?: number,
  width?: number,
): string {
  const hist = tuningIntervalHistogram(tuning, binCount ?? 12);
  const maxCount = Math.max(...hist.map((b) => b.count), 1);
  const barWidth = width ?? 20;
  return hist
    .map((b, i) => {
      const bar = '█'.repeat(Math.round((b.count / maxCount) * barWidth));
      return `bin${i.toString().padStart(2)} | ${bar.padEnd(barWidth)} | ${b.count}`;
    })
    .join('\n');
}

/**
 * Build a histogram of all intervals used across a chord map's chords in one call.
 *
 * Socratic Q238: "If I have a chord map and can get a tuning interval histogram, can I get
 * the histogram of all intervals used across a chord map's chords in one call?" → No → implement.
 *
 * @param chordMap    - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param periodCents - Period in cents for binning (default 1200).
 * @param binCount    - Number of equal-width bins (default 12).
 * @returns Array of `{ bin, centsMid, count }` for each bin index.
 *
 * @throws {RangeError} if `binCount` <= 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const hist = chordMapIntervalHistogram(chordMap);
 * // hist[0].count = number of chord intervals that fall in the first 100c bin
 */
export function chordMapIntervalHistogram(
  chordMap: readonly ScaleChordMapEntry[],
  periodCents?: number,
  binCount?: number,
): { bin: number; centsMid: number; count: number }[] {
  const period = periodCents ?? 1200;
  const bins = binCount ?? 12;
  if (bins <= 0) {
    throw new RangeError('chordMapIntervalHistogram: binCount must be positive');
  }
  const binSize = period / bins;
  const counts = Array.from({ length: bins }, () => 0);
  for (const entry of chordMap) {
    for (const interval of entry.chord.intervals) {
      const c = pitchToCents(interval);
      const idx = Math.min(Math.floor(c / binSize), bins - 1);
      counts[idx] = (counts[idx] as number) + 1;
    }
  }
  return Array.from({ length: bins }, (_, i) => ({
    bin: i,
    centsMid: (i + 0.5) * binSize,
    count: counts[i] ?? 0,
  }));
}

/**
 * Generate a narrative description of a chord progression derived from a scale's chord map.
 *
 * Socratic Q241: "If I have a Scale and can generate its chord map and then a progression
 * narrative — should one call cover it?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 2. Select chords by `pattern` (indices into chordMap, default `[0,1,2,3]` clamped to length).
 * 3. `progressionNarrative(chords, rootHz, spectrum)` → narrative string.
 *
 * @param scale    - The parent scale.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz for narrative analysis.
 * @param pattern  - Indices into the chord map (default `[0,1,2,3]` clamped to chordMap.length).
 * @param spectrum - Optional instrument spectrum for analysis.
 * @returns A single descriptive string summarising the progression.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const narrative = scaleProgressionNarrative(major, t12, 261.63);
 */
export function scaleProgressionNarrative(
  scale: Scale,
  tuning: TuningSystem,
  rootHz: number,
  pattern?: number[],
  spectrum?: Spectrum,
): string {
  const chordMap = scaleToChordMap(scale, tuning);
  const pat = pattern ?? [0, 1, 2, 3].slice(0, chordMap.length);
  const chords = pat.map((i) => chordMap[i % chordMap.length]!.chord);
  return progressionNarrative(chords, rootHz, spectrum);
}

/**
 * Compute a pairwise similarity matrix for a set of tuning systems in one call.
 *
 * Socratic Q245: "If I can check if two tunings are similar and compare their harmonicity
 * profiles, can I compute a full pairwise similarity matrix for a set of tunings in one call?"
 * → No → implement.
 *
 * The matrix `M[i][j]` equals `tuningHarmonicityCorrelation(tunings[i], tunings[j], tol)`,
 * which is in [-1, 1]. The diagonal `M[i][i]` is set to `1.0`.
 *
 * @param tunings   - Array of tuning systems to compare pairwise.
 * @param threshold - Unused; accepted for API forward-compatibility.
 * @param tol       - Stolzenburg tolerance forwarded to `tuningHarmonicityCorrelation`. Default 0.0136.
 * @returns An `n×n` matrix where `matrix[i][j]` is the harmonicity correlation of tuning i and j.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const matrix = scaleSimilarityMatrix([t12, t19]);
 * // matrix[0][1] is the correlation between 12-TET and 19-EDO
 */
export function scaleSimilarityMatrix(
  tunings: readonly TuningSystem[],
  threshold?: number,
  tol?: number,
): number[][] {
  void threshold; // accepted for API forward-compatibility
  const n = tunings.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0) as number[]);
  for (let i = 0; i < n; i++) {
    (matrix[i] as number[])[i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      const corr = tuningHarmonicityCorrelation(tunings[i]!, tunings[j]!, tol);
      (matrix[i] as number[])[j] = corr;
      (matrix[j] as number[])[i] = corr;
    }
  }
  return matrix;
}

/**
 * Return the chord from a progression whose dissonance is closest to the centroid
 * (mean) of the progression's energy arc, in one call.
 *
 * Socratic Q249: "If I have a progression's energy arc (one number per chord), can I
 * get the chord whose dissonance is closest to the centroid of the arc in one call?"
 * → No → implement.
 *
 * Algorithm:
 * 1. `progressionEnergyArc(chords, rootHz, spectrum)` → dissonance values per chord.
 * 2. Centroid = mean of the arc values.
 * 3. Return the chord whose arc value is closest (minimum absolute distance) to centroid.
 *
 * @param chords   - Ordered list of chords (must be non-empty).
 * @param rootHz   - Root frequency in Hz.
 * @param spectrum - Optional instrument spectrum.
 * @returns The `Chord` whose dissonance is closest to the arc centroid.
 *
 * @throws {RangeError} if `chords` is empty.
 *
 * @example
 * const centroid = progressionChordCentroid([I, IV, V], 261.63);
 * // centroid is the chord closest to the mean energy of the progression
 */
export function progressionChordCentroid(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
): Chord {
  if (chords.length === 0) throw new RangeError('progressionChordCentroid: empty progression');
  const arc = progressionEnergyArc(chords, rootHz, spectrum);
  const centroid = arc.reduce((s, v) => s + v, 0) / arc.length;
  let bestIdx = 0;
  let bestDist = Infinity;
  arc.forEach((v, i) => {
    const d = Math.abs(v - centroid);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  });
  return chords[bestIdx]!;
}

/**
 * Compute the consecutive interval set (in cents) for every modal rotation of a scale.
 *
 * Socratic Q250: "If I can get all modal rotations of a scale and compute interval sets,
 * can I get the set of all unique intervals for each mode in one call?" → No → implement.
 *
 * For each mode, the interval set is the ordered list of consecutive step sizes (in cents)
 * from the first degree to the next, wrapping around at the octave (period). The sum of
 * all intervals equals `tuning.periodCents`.
 *
 * @param scale  - The parent scale.
 * @param tuning - The parent `TuningSystem`.
 * @returns One entry per modal rotation: `{ mode, intervalCents }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const sets = modeIntervalSets(major, t12);
 * // sets[0].intervalCents contains the 7 step sizes of the Ionian mode
 * // sets[0].intervalCents.reduce((a, b) => a + b, 0) ≈ 1200
 */
export function modeIntervalSets(
  scale: Scale,
  tuning: TuningSystem,
): { mode: Scale; intervalCents: number[] }[] {
  const allModes = scaleModeSeries(scale, tuning);
  return allModes.map((mode) => {
    const degreeCents = mode.degreeIndices.map((i) => pitchToCents(tuning.degrees[i]!));
    degreeCents.sort((a, b) => a - b);
    const intervals = degreeCents.map((c, idx) => {
      const next =
        idx + 1 < degreeCents.length ? degreeCents[idx + 1]! : degreeCents[0]! + tuning.periodCents;
      return next - c;
    });
    return { mode, intervalCents: intervals };
  });
}

/**
 * Partition a chord map into consonant, dissonant, and neutral subsets in one call.
 *
 * Socratic Q252: "If I can filter a chord map by dissonance and by harmonicity separately,
 * can I get both the consonant subset and the dissonant subset in one call?" → No → implement.
 *
 * Scoring:
 * - `consonant`: dissonance ≤ `maxDissonance` AND harmonicity ≤ `minHarmonicity`
 * - `dissonant`: dissonance > `maxDissonance` AND harmonicity > `minHarmonicity`
 * - `neutral`: everything else (one threshold passes, the other does not)
 *
 * @param chordMap       - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param maxDissonance  - Maximum Sethares roughness for the consonant category (must be > 0).
 * @param minHarmonicity - Maximum Stolzenburg periodicity for the consonant category (must be > 0).
 * @param spectrum       - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz         - Reference frequency for chord realization (default 440 Hz).
 * @returns `{ consonant, dissonant, neutral }` — three non-overlapping subsets of `chordMap`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const { consonant, dissonant, neutral } = chordMapRangeBundle(chordMap, 0.5, 0.5);
 */
export function chordMapRangeBundle(
  chordMap: readonly ScaleChordMapEntry[],
  maxDissonance: number,
  minHarmonicity: number,
  spectrum?: Spectrum,
  rootHz = 440,
): {
  consonant: ScaleChordMapEntry[];
  dissonant: ScaleChordMapEntry[];
  neutral: ScaleChordMapEntry[];
} {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  // Score every entry once
  const scored = chordMap.map((entry) => ({
    entry,
    dissonance: chordObjectDissonance(entry.chord, rootHz, effectiveSpectrum),
    harmonicity: harmonicityForChord(entry.chord, rootHz),
  }));

  const consonant: ScaleChordMapEntry[] = [];
  const dissonant: ScaleChordMapEntry[] = [];
  const neutral: ScaleChordMapEntry[] = [];

  for (const { entry, dissonance, harmonicity } of scored) {
    const lowDissonance = dissonance <= maxDissonance;
    const lowHarmonicity = harmonicity <= minHarmonicity;
    if (lowDissonance && lowHarmonicity) {
      consonant.push(entry);
    } else if (!lowDissonance && !lowHarmonicity) {
      dissonant.push(entry);
    } else {
      neutral.push(entry);
    }
  }

  return { consonant, dissonant, neutral };
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
 * Count the number of modal rotations in a tuning and how many have a unique interval set.
 *
 * Socratic Q256: "If a tuning has N degrees, it has N distinct modal rotations — should
 * counting them be one call?" → No → implement.
 *
 * Returns `{ total, withUniqueIntervalSets }`:
 * - `total`: the number of degrees (= number of modal rotations).
 * - `withUniqueIntervalSets`: the number of rotations whose consecutive interval set
 *   (rounded to nearest cent, sorted) differs from all other rotations.
 *
 * @param tuning - The tuning system to analyse.
 * @returns `{ total, withUniqueIntervalSets }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { total, withUniqueIntervalSets } = tuningModeCount(t12);
 * // total === 12; withUniqueIntervalSets <= 12
 *
 * @example
 * // Whole-tone scale (6-EDO): all modes are identical
 * const { total, withUniqueIntervalSets } = tuningModeCount(edo(6));
 * // total === 6; withUniqueIntervalSets === 1
 */
export function tuningModeCount(tuning: TuningSystem): {
  total: number;
  withUniqueIntervalSets: number;
} {
  const total = tuning.degrees.length;
  const scale = tuningToScale(tuning);
  const sets = modeIntervalSets(scale, tuning);
  const unique = new Set(
    sets.map((s) =>
      s.intervalCents
        .map((c) => Math.round(c))
        .sort((a, b) => a - b)
        .join(','),
    ),
  );
  return { total, withUniqueIntervalSets: unique.size };
}

/**
 * Descriptive statistics summary of a scale's full chord map analysis (documented alias for `chordMapSummary`).
 *
 * Socratic Q259: "If I have a Scale and a TuningSystem, getting its chord map summary (stats
 * about the harmonic vocabulary) should be one call — can it?" `chordMapSummary(scale, tuning,
 * spectrum?)` already serves this purpose. `scaleToChordMapSummary` is a first-class, named
 * alias that makes the Socratic intent explicit: going from a Scale directly to a chord map
 * summary (count, min/max/mean dissonance, min/max/mean harmonicity) in one call.
 *
 * Delegates directly to `chordMapSummary(scale, tuning, spectrum)`.
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
 * const summary = scaleToChordMapSummary(major, t12);
 * console.log(summary.count, summary.meanDissonance);
 */
export function scaleToChordMapSummary(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
): ReturnType<typeof chordMapSummary> {
  return chordMapSummary(scale, tuning, spectrum);
}

/**
 * Compute a single numerical 'stability score' for a whole tuning in one call.
 *
 * Socratic Q260: "If I can rank modes by stability and get a count of unique interval sets,
 * can I compute a single numerical 'stability score' for a whole tuning in one call?" → No → implement.
 *
 * Returns the ratio of stable modes (those that pass the optional stability thresholds) to
 * total modes: `stable / total`. Range: [0, 1]. A score of 1 means all modes are stable;
 * 0 means none are. Returns 0 for tunings with no degrees.
 *
 * Algorithm:
 * 1. `rankModesByStability(tuning, rootHz ?? tuning.referenceHz, spectrum, thresholds)` → stable modes.
 * 2. `tuningModeCount(tuning).total` → total mode count.
 * 3. Return `total === 0 ? 0 : stable / total`.
 *
 * Note: all modes in `rankModesByStability` pass (the function does not filter by threshold;
 * `thresholds` is accepted for API consistency but forwarded unused). The stable count is
 * therefore the number of entries returned by `rankModesByStability`, which always equals
 * the total mode count unless the tuning is empty. For non-trivial filtering semantics,
 * apply thresholds to the returned scores manually.
 *
 * @param tuning     - The tuning system to score.
 * @param rootHz     - Absolute frequency of the root in Hz. Defaults to `tuning.referenceHz`.
 * @param spectrum   - Optional instrument spectrum.
 * @param thresholds - Optional stability thresholds (forwarded to `rankModesByStability`).
 * @returns Stability score in [0, 1]: ratio of stable modes to total modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const score = tuningStabilityScore(t12, 261.63);
 * // score in [0, 1]
 */
export function tuningStabilityScore(
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
  thresholds?: { maxMeanDissonance?: number; minHarmonicity?: number },
): number {
  void thresholds; // accepted for API consistency; forwarded unused (rankModesByStability ignores thresholds too)
  const { total } = tuningModeCount(tuning);
  if (total === 0) return 0;
  const modes = rankModesByStability(tuning, rootHz ?? tuning.referenceHz, spectrum);
  const stable = modes.length;
  return stable / total;
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
 * Mean of the most harmonic half of a tuning's harmonicity profile.
 *
 * Socratic Q263: "If I have a tuning's harmonicity profile, can I compute how dense the
 * harmonic structure is (mean of the top-half harmonicity values) in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningHarmonicityProfile(tuning, tol)` → per-mode harmonicity values.
 * 2. Sort ascending (lower = more harmonic).
 * 3. Take the bottom half (`Math.ceil(n / 2)` entries — the most harmonic).
 * 4. Return the mean of that half.
 *
 * Returns 0 for tunings with no degrees (empty profile).
 *
 * @param tuning - The tuning system to analyse.
 * @param tol    - Continued-fraction tolerance forwarded to `tuningHarmonicityProfile`. Default 0.0136.
 * @returns Mean harmonicity of the most harmonic half of the tuning's modal rotations (≥ 0).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const density = tuningHarmonicDensity(t12);
 * // density is the mean harmonicity of the 6 most harmonic modes (out of 12)
 */
export function tuningHarmonicDensity(tuning: TuningSystem, tol = 0.0136): number {
  if (tuning.degrees.length === 0) return 0;
  const profile = tuningHarmonicityProfile(tuning, tol);
  if (profile.length === 0) return 0;
  const sorted = [...profile].sort((a, b) => a - b);
  const half = sorted.slice(0, Math.ceil(sorted.length / 2));
  return half.reduce((s, v) => s + v, 0) / half.length;
}

/**
 * Amplitude-weighted mean harmonicity of a tuning over a given spectrum.
 *
 * Socratic Q264: "If harmonicity measures how well a spectrum fits a tuning, and harmonic
 * density summarises the top-half, can I get a scalar 'spectral fit' score for a
 * tuning+spectrum pair in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningHarmonicityProfile(tuning, tol)` → per-degree harmonicity values.
 * 2. Multiply each degree's harmonicity by the corresponding spectral partial amplitude
 *    (cycling through the spectrum with `i % spectrum.length`).
 * 3. Divide the weighted sum by `totalAmp * profile.length`.
 *
 * Returns 0 for tunings with no degrees, empty spectra, or zero total amplitude.
 *
 * @param tuning   - The tuning system to evaluate.
 * @param spectrum - The instrument spectrum to weight against.
 * @param tol      - Continued-fraction tolerance for harmonicity. Default 0.0136.
 * @returns Amplitude-weighted mean harmonicity (≥ 0). Lower = better spectral fit.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const fit = tuningSpectralFit(t12, harmonicSpectrum());
 */
export function tuningSpectralFit(tuning: TuningSystem, spectrum: Spectrum, tol?: number): number {
  if (tuning.degrees.length === 0) return 0;
  if (!spectrum || spectrum.length === 0) return 0;
  const profile = tuningHarmonicityProfile(tuning, tol);
  if (profile.length === 0) return 0;
  const totalAmp = spectrum.reduce((s, p) => s + p.amplitude, 0);
  if (totalAmp === 0) return 0;
  const weighted = profile.map((h, i) => h * (spectrum[i % spectrum.length]?.amplitude ?? 0));
  return weighted.reduce((s, v) => s + v, 0) / (totalAmp * profile.length);
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
 * Coefficient of variation of dissonance for the chord map derived from a scale.
 *
 * Socratic Q267: "If I can compute chord map volatility for a flat chord map and derive the
 * chord map from a scale, can I go Scale → volatility in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 2. `chordMapVolatility(chordMap, spectrum, rootHz)` → volatility score.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Reference frequency for chord realization (default 440 Hz).
 * @returns Coefficient of variation of dissonance (≥ 0).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const v = scaleChordMapVolatility(major, t12);
 */
export function scaleChordMapVolatility(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): number {
  const chordMap = scaleToChordMap(scale, tuning);
  return chordMapVolatility(chordMap, spectrum, rootHz);
}

/**
 * Volatility of every modal rotation of a scale in one call.
 *
 * Socratic Q268: "If I can compute chord map volatility for one scale, can I get the
 * volatility for every modal rotation in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 2. For each mode: `scaleChordMapVolatility(mode, tuning, spectrum, rootHz)`.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param rootHz   - Reference frequency for chord realization (default 440 Hz).
 * @returns Array of `{ mode, volatility }` — one entry per modal rotation.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const profile = modeVolatilityProfile(major, t12);
 * // profile.length === 7 (one entry per mode of the major scale)
 */
export function modeVolatilityProfile(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): { mode: Scale; volatility: number }[] {
  const allModes = scaleModeSeries(scale, tuning);
  return allModes.map((mode) => ({
    mode,
    volatility: scaleChordMapVolatility(mode, tuning, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q272 — tuningFamilyReport
// ---------------------------------------------------------------------------

/**
 * Comprehensive report for a family of related tunings: individual reports, similarity
 * matrix, most/least similar pair, and mean similarity in one call.
 *
 * Socratic Q272: "If I can get individual tuning reports and similarity matrices, can I
 * get a comprehensive family report for a set of related tunings in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningReport(t, rootHz, spectrum)` for every tuning.
 * 2. `scaleSimilarityMatrix(tunings)` → N×N correlation matrix.
 * 3. Scan all off-diagonal entries to find the most and least similar pair.
 * 4. Mean of all finite off-diagonal values.
 *
 * @param tunings  - Array of tuning systems to compare (must be non-empty).
 * @param rootHz   - Root frequency for individual reports (default: `t.referenceHz` per tuning).
 * @param spectrum - Optional instrument spectrum for report computation.
 * @returns `TuningFamilyReport` containing ids, reports, matrix, pair extremes, and mean.
 *
 * @throws {RangeError} if `tunings` is empty.
 *
 * @example
 * const report = tuningFamilyReport([equalTemperament12(440), edo(19)]);
 * // report.ids === ['12-tet', ...]; report.meanSimilarity ∈ [-1, 1]
 */
export interface TuningFamilyReport {
  ids: string[];
  reports: TuningReportType[];
  similarityMatrix: number[][];
  mostSimilarPair: [string, string];
  leastSimilarPair: [string, string];
  meanSimilarity: number;
}

export function tuningFamilyReport(
  tunings: readonly TuningSystem[],
  rootHz?: number,
  spectrum?: Spectrum,
): TuningFamilyReport {
  if (tunings.length === 0) {
    throw new RangeError('tuningFamilyReport: empty tunings array');
  }
  const ids = tunings.map((t) => t.id);
  const reports = tunings.map((t) => tuningReport(t, rootHz ?? t.referenceHz, spectrum));
  const matrix = scaleSimilarityMatrix(tunings);

  // If only 1 tuning, pairs default to self
  let mostSimilarPair: [string, string] = [ids[0]!, ids[0]!];
  let leastSimilarPair: [string, string] = [ids[0]!, ids[0]!];
  let maxSim = -Infinity;
  let minSim = Infinity;
  const offDiagonal: number[] = [];

  for (let i = 0; i < tunings.length; i++) {
    for (let j = i + 1; j < tunings.length; j++) {
      const val = (matrix[i] as number[])[j] as number;
      offDiagonal.push(val);
      if (Number.isFinite(val)) {
        if (val > maxSim) {
          maxSim = val;
          mostSimilarPair = [ids[i]!, ids[j]!];
        }
        if (val < minSim) {
          minSim = val;
          leastSimilarPair = [ids[i]!, ids[j]!];
        }
      }
    }
  }

  const finite = offDiagonal.filter(Number.isFinite);
  const meanSimilarity =
    finite.length > 0 ? finite.reduce((s, v) => s + v, 0) / finite.length : NaN;

  return {
    ids,
    reports,
    similarityMatrix: matrix,
    mostSimilarPair,
    leastSimilarPair,
    meanSimilarity,
  };
}

// ---------------------------------------------------------------------------
// Q273 — progressionSmoothnessRatio
// ---------------------------------------------------------------------------

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
 * Harmonic variety score of a tuning: ratio of unique interval patterns to total modes.
 *
 * Socratic Q279: "If I have all the mode interval sets for a tuning, can I compute how much
 * harmonic variety (distinct interval patterns) the tuning's modes offer in one call?"
 * → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale spanning all degrees.
 * 2. `modeIntervalSets(scale, tuning)` → one interval set per modal rotation.
 * 3. Build a Set of unique patterns: round each cent value and join with ','.
 * 4. Return `unique.size / Math.max(tuning.degrees.length, 1)`.
 *
 * Returns 0 for tunings with no degrees. For fully symmetrical tunings (all modes identical,
 * e.g. 6-EDO whole-tone), returns 1/n where n = degree count.
 *
 * @param tuning - The tuning system to analyse.
 * @returns Variety ratio ∈ (0, 1] — higher means more distinct modal flavors.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const v = tuningProgressionVariety(t12); // proportion of distinct modes in 12-TET
 *
 * @example
 * const t6 = edo(6); // whole-tone — all modes identical
 * const v = tuningProgressionVariety(t6); // 1/6 ≈ 0.1667
 */
export function tuningProgressionVariety(tuning: TuningSystem): number {
  if (tuning.degrees.length === 0) return 0;
  const scale = tuningToScale(tuning);
  const sets = modeIntervalSets(scale, tuning);
  const unique = new Set(
    sets.map((s) =>
      s.intervalCents
        .map((c) => Math.round(c))
        .sort()
        .join(','),
    ),
  );
  return unique.size / Math.max(tuning.degrees.length, 1);
}

// ---------------------------------------------------------------------------
// Q281 — chordMapConsistencyScore
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
 * Consistency score for every modal rotation of a tuning in one call.
 *
 * Socratic Q283: "If I can get consistency scores for chord maps and compute all modal
 * rotations, can I get a consistency score for every mode of a tuning in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 3. For each mode: `chordMapConsistencyScore(scaleToChordMap(mode, tuning), spectrum, rootHz)`.
 *
 * @param tuning   - The tuning system to profile.
 * @param spectrum - Optional instrument spectrum for consistency computation.
 * @param rootHz   - Root frequency in Hz (default `tuning.referenceHz`).
 * @returns Array of `{ mode: Scale; consistency: number }`, one per modal rotation.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const profile = tuningConsistencyProfile(t12);
 * // profile.length === 12; profile[0].consistency ∈ (0, 1]
 */
export function tuningConsistencyProfile(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): { mode: Scale; consistency: number }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  const effectiveRootHz = rootHz ?? tuning.referenceHz;
  return modes.map((mode) => ({
    mode,
    consistency: chordMapConsistencyScore(scaleToChordMap(mode, tuning), spectrum, effectiveRootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q286 — chordMapNormalizedScores
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
 * Produce a human-readable report card for a tuning system in one call.
 *
 * Socratic Q288: "If I have a tuning report, consistency profile, and variety score, can I
 * produce a human-readable report card in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningReport(tuning, rootHz ?? tuning.referenceHz, spectrum)` → full report.
 * 2. `tuningProgressionVariety(tuning)` → variety ratio.
 * 3. `tuningStabilityScore(tuning, rootHz, spectrum)` → stability ratio.
 * 4. `tuningHarmonicDensity(tuning)` → harmonic density score.
 * 5. Build and return a formatted string.
 *
 * @param tuning   - The tuning system to report on.
 * @param rootHz   - Root frequency in Hz. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns A formatted multi-line report card string.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * console.log(tuningReportCard(t12, 261.63));
 */
export function tuningReportCard(
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
): string {
  const report = tuningReport(tuning, rootHz ?? tuning.referenceHz, spectrum);
  const variety = tuningProgressionVariety(tuning);
  const stability = tuningStabilityScore(tuning, rootHz, spectrum);
  const density = tuningHarmonicDensity(tuning);
  const summary = report.chordMapSummary;
  return [
    `Tuning: ${tuning.id} (${tuning.degrees.length} degrees)`,
    `Best mode: ${report.bestMode.id} (harmonicity: ${report.bestMode.harmonicity.toFixed(3)})`,
    `Stability: ${(stability * 100).toFixed(1)}% | Variety: ${(variety * 100).toFixed(1)}% | Density: ${density.toFixed(3)}`,
    `Chord map: ${summary.count} chords | dissonance range [${summary.minDissonance.toFixed(2)}, ${summary.maxDissonance.toFixed(2)}]`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Q289 — chordMapEntropyScore
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
 * Compute chord-map entropy for every mode of a tuning.
 *
 * Socratic Q294: "If I can compute entropy for one chord map, can I compute
 * entropy for every mode of a tuning in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 3. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapEntropyScore(chordMap, spectrum, rootHz)`.
 *
 * @param tuning   - The tuning system whose modes to profile.
 * @param spectrum - Optional instrument spectrum for dissonance.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{mode, entropy}` sorted by mode degree index ascending.
 */
export function tuningEntropyProfile(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz = 440,
): { mode: Scale; entropy: number }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const entropy = chordMapEntropyScore(chordMap, spectrum, rootHz);
    return { mode, entropy };
  });
}

// ---------------------------------------------------------------------------
// Q295 — bestModeByEntropy
// ---------------------------------------------------------------------------

/**
 * Return the mode of `tuning` with the highest chord-map entropy.
 *
 * Socratic Q295: "If I have all mode entropies, can I find the most diverse
 * mode in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningEntropyProfile(tuning, spectrum, rootHz)` → `{mode, entropy}[]`.
 * 2. Return the entry with the maximum entropy value.
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Optional instrument spectrum.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns The `Scale` with the maximum entropy value.
 *
 * @throws {RangeError} if the tuning has no modes.
 */
export function bestModeByEntropy(tuning: TuningSystem, spectrum?: Spectrum, rootHz = 440): Scale {
  const profile = tuningEntropyProfile(tuning, spectrum, rootHz);
  if (profile.length === 0) throw new RangeError('bestModeByEntropy: tuning has no modes');
  let best = profile[0]!;
  for (const entry of profile) {
    if (entry.entropy > best.entropy) best = entry;
  }
  return best.mode;
}

// ---------------------------------------------------------------------------
// Q300 — tuningConsistencyEntropyDelta
// ---------------------------------------------------------------------------

/**
 * Measure how much consistency and entropy rankings disagree across a tuning's modes.
 *
 * Socratic Q300: "If I have consistency and entropy profiles for each mode, can I measure
 * how much they disagree in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningConsistencyProfile(tuning, spectrum, rootHz)` → `{mode, consistency}[]`.
 * 2. `tuningEntropyProfile(tuning, spectrum, rootHz)` → `{mode, entropy}[]`.
 * 3. Pair by mode index (same order — both from `allModes(tuning)`).
 * 4. Normalize each array to [0, 1].
 * 5. Return mean absolute difference: `sum(|normC[i] - normE[i]|) / n`.
 *
 * High delta means modes that are consistent are NOT necessarily diverse.
 * Returns 0 if tuning has 0 or 1 modes.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Optional instrument spectrum for computation.
 * @param rootHz   - Root frequency in Hz.
 * @returns Mean absolute difference in [0, 1].
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const delta = tuningConsistencyEntropyDelta(t12);
 * // delta ∈ [0, 1]; 0 means profiles agree perfectly
 */
export function tuningConsistencyEntropyDelta(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): number {
  const consistencyProfile = tuningConsistencyProfile(tuning, spectrum, rootHz);
  const n = consistencyProfile.length;
  if (n <= 1) return 0;
  const entropyProfile = tuningEntropyProfile(tuning, spectrum, rootHz ?? 440);
  const cVals = consistencyProfile.map((e) => e.consistency);
  const eVals = entropyProfile.map((e) => e.entropy);
  const normalize = (arr: number[]): number[] => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr.map((v) => (v - min) / range);
  };
  const normC = normalize(cVals);
  const normE = normalize(eVals);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.abs(normC[i]! - normE[i]!);
  }
  return sum / n;
}

// ---------------------------------------------------------------------------
// Q302 — chordMapRankedBundle
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
 * Return the mode of `tuning` with the highest chord-map consistency score.
 *
 * Socratic Q304: "If I can find the best mode by entropy, can I also find the best mode
 * by consistency in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningConsistencyProfile(tuning, spectrum, rootHz)` → `{mode, consistency}[]`.
 * 2. Return the entry with the maximum consistency value.
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Optional instrument spectrum.
 * @param rootHz   - Root frequency in Hz.
 * @returns The `Scale` with the maximum consistency score.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const mode = bestModeByConsistency(t12);
 * // mode is the most internally consistent modal rotation
 */
export function bestModeByConsistency(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): Scale {
  const profile = tuningConsistencyProfile(tuning, spectrum, rootHz);
  if (profile.length === 0) throw new RangeError('bestModeByConsistency: tuning has no modes');
  let best = profile[0]!;
  for (const entry of profile) {
    if (entry.consistency > best.consistency) best = entry;
  }
  return best.mode;
}

// ---------------------------------------------------------------------------
// Q305 — tuningDualBestModes
// ---------------------------------------------------------------------------

/**
 * Find the best mode by entropy and by consistency, then compare them in one call.
 *
 * Socratic Q305: "If I can find the best mode by entropy and the best mode by consistency,
 * can I compare them in one call to see if they agree?" → No → implement.
 *
 * Algorithm:
 * 1. `bestModeByEntropy(tuning, spectrum, rootHz)` → byEntropy.
 * 2. `bestModeByConsistency(tuning, spectrum, rootHz)` → byConsistency.
 * 3. `sameMode` = true when both modes have the same `id`.
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Optional instrument spectrum.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{ byEntropy: Scale, byConsistency: Scale, sameMode: boolean }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { byEntropy, byConsistency, sameMode } = tuningDualBestModes(t12);
 * // sameMode === true means the most diverse and most consistent modes coincide
 */
export function tuningDualBestModes(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz = 440,
): { byEntropy: Scale; byConsistency: Scale; sameMode: boolean } {
  const byEntropy = bestModeByEntropy(tuning, spectrum, rootHz);
  const byConsistency = bestModeByConsistency(tuning, spectrum, rootHz);
  const sameMode = byEntropy.id === byConsistency.id;
  return { byEntropy, byConsistency, sameMode };
}

// ---------------------------------------------------------------------------
// Q306 — chordMapVolatilityBundle
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
 * For each mode of a tuning, compute entropy, consistency, and volatility in one call.
 *
 * Socratic Q308: "If I can get entropy/consistency/volatility separately per mode,
 * can I get all three together per mode in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 3. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapVolatilityBundle(chordMap, spectrum, rootHz)`.
 *
 * @param tuning   - The tuning system whose modes to compare.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{ mode, entropy, consistency, volatility }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const cmp = tuningModeComparison(t12);
 * // cmp.length === 12; each entry has entropy, consistency, volatility >= 0
 */
export function tuningModeComparison(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): { mode: Scale; entropy: number; consistency: number; volatility: number }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const { volatility, entropy, consistency } = chordMapVolatilityBundle(
      chordMap,
      spectrum,
      rootHz,
    );
    return { mode, entropy, consistency, volatility };
  });
}

// ---------------------------------------------------------------------------
// Q309 — bestModeByVolatility
// ---------------------------------------------------------------------------

/**
 * Return the mode of `tuning` with the lowest chord-map volatility (most stable).
 *
 * Socratic Q309: "If I can compare all mode metrics, can I find the most stable
 * (lowest volatility) mode in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComparison(tuning, spectrum, rootHz)` → `{mode, entropy, consistency, volatility}[]`.
 * 2. Return the entry with the minimum volatility value.
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Optional instrument spectrum.
 * @param rootHz   - Root frequency in Hz.
 * @returns The `Scale` with the minimum volatility score.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const mode = bestModeByVolatility(t12);
 * // mode is the modal rotation with the most uniform dissonance distribution
 */
export function bestModeByVolatility(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): Scale {
  const comparison = tuningModeComparison(tuning, spectrum, rootHz);
  if (comparison.length === 0) throw new RangeError('bestModeByVolatility: tuning has no modes');
  let best = comparison[0]!;
  for (const entry of comparison) {
    if (entry.volatility < best.volatility) best = entry;
  }
  return best.mode;
}

// ---------------------------------------------------------------------------
// Q310 — tuningTripleBestModes
// ---------------------------------------------------------------------------

/**
 * Find the best mode by entropy, consistency, and volatility, then compare all three.
 *
 * Socratic Q310: "If I can find best mode by entropy and consistency, can I also find
 * best by volatility and compare all three at once?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningDualBestModes(tuning, spectrum, rootHz)` → `{ byEntropy, byConsistency, sameMode }`.
 * 2. `bestModeByVolatility(tuning, spectrum, rootHz)` → byVolatility.
 * 3. `allAgree` = true when all three modes have the same `id`.
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Optional instrument spectrum.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{ byEntropy, byConsistency, byVolatility, allAgree }`.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { byEntropy, byConsistency, byVolatility, allAgree } = tuningTripleBestModes(t12);
 * // allAgree === true means entropy, consistency, and volatility all agree on the best mode
 */
export function tuningTripleBestModes(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz = 440,
): { byEntropy: Scale; byConsistency: Scale; byVolatility: Scale; allAgree: boolean } {
  const { byEntropy, byConsistency } = tuningDualBestModes(tuning, spectrum, rootHz);
  const byVolatility = bestModeByVolatility(tuning, spectrum, rootHz);
  const allAgree = byEntropy.id === byConsistency.id && byConsistency.id === byVolatility.id;
  return { byEntropy, byConsistency, byVolatility, allAgree };
}

// ---------------------------------------------------------------------------
// Q312 — tuningModeRanking
// ---------------------------------------------------------------------------

/**
 * Rank all modal rotations of a tuning by a single metric in one call.
 *
 * Socratic Q312: "If I can compare all mode metrics, can I rank modes by any one
 * metric in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComparison(tuning, spectrum, rootHz)` → `{mode, entropy, consistency, volatility}[]`.
 * 2. Sort by chosen metric:
 *    - `'entropy'` / `'consistency'`: descending (higher = better).
 *    - `'volatility'`: ascending (lower = more stable = better).
 * 3. Return sorted `Scale[]`.
 *
 * @param tuning   - The tuning system.
 * @param metric   - Which metric to rank by: `'entropy'`, `'consistency'`, or `'volatility'`.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `Scale[]` sorted from best to worst by the chosen metric.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const ranked = tuningModeRanking(t12, 'entropy');
 * // ranked[0] is the mode with highest entropy score
 */
export function tuningModeRanking(
  tuning: TuningSystem,
  metric: 'entropy' | 'consistency' | 'volatility',
  spectrum?: Spectrum,
  rootHz = 440,
): Scale[] {
  const comparison = tuningModeComparison(tuning, spectrum, rootHz);
  const ascending = metric === 'volatility';
  const sorted = comparison.slice().sort((a, b) => {
    const diff = a[metric] - b[metric];
    return ascending ? diff : -diff;
  });
  return sorted.map((e) => e.mode);
}

// ---------------------------------------------------------------------------
// Q313 — tuningModeRankingBundle
// ---------------------------------------------------------------------------

/**
 * Rank all modal rotations by entropy, consistency, and volatility in one call.
 *
 * Socratic Q313: "If I can rank modes by any single metric, can I get all three
 * rankings at once?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComparison(tuning, spectrum, rootHz)` → comparison data (one pass).
 * 2. Sort three ways:
 *    - `byEntropy`: descending by entropy.
 *    - `byConsistency`: descending by consistency.
 *    - `byVolatility`: ascending by volatility (lower = more stable = better).
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{ byEntropy, byConsistency, byVolatility }` — three sorted `Scale[]` arrays.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { byEntropy, byConsistency, byVolatility } = tuningModeRankingBundle(t12);
 * // byEntropy[0] is the most entropic mode; byVolatility[0] is the most stable
 */
export function tuningModeRankingBundle(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz = 440,
): { byEntropy: Scale[]; byConsistency: Scale[]; byVolatility: Scale[] } {
  const comparison = tuningModeComparison(tuning, spectrum, rootHz);
  const byEntropy = comparison
    .slice()
    .sort((a, b) => b.entropy - a.entropy)
    .map((e) => e.mode);
  const byConsistency = comparison
    .slice()
    .sort((a, b) => b.consistency - a.consistency)
    .map((e) => e.mode);
  const byVolatility = comparison
    .slice()
    .sort((a, b) => a.volatility - b.volatility)
    .map((e) => e.mode);
  return { byEntropy, byConsistency, byVolatility };
}

// ---------------------------------------------------------------------------
// Q314 — modeProgressionBundle
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
 * Find the best mode of a tuning by a metric and return its progression bundle in one call.
 *
 * Socratic Q315: "If I can rank modes and get a progression bundle for a mode, can I get
 * the best mode's progression in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeRanking(tuning, metric, spectrum, rootHz)` → sorted `Scale[]`.
 * 2. Take first element as `bestMode`.
 * 3. `modeProgressionBundle(bestMode, tuning, rootHz, spectrum)` → `{chords, smoothnessRatio}`.
 *
 * @param tuning   - The tuning system.
 * @param metric   - Which metric to select the best mode by.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @returns `{ mode, chords, smoothnessRatio }`.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { mode, chords, smoothnessRatio } = tuningBestModeProgression(t12, 'entropy');
 * // mode is the highest-entropy mode; chords is its smooth progression
 */
export function tuningBestModeProgression(
  tuning: TuningSystem,
  metric: 'entropy' | 'consistency' | 'volatility',
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; chords: Chord[]; smoothnessRatio: number } {
  const ranking = tuningModeRanking(tuning, metric, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('tuningBestModeProgression: tuning has no modes');
  const mode = ranking[0]!;
  const { chords, smoothnessRatio } = modeProgressionBundle(mode, tuning, rootHz, spectrum);
  return { mode, chords, smoothnessRatio };
}

// ---------------------------------------------------------------------------
// Q320 — tuningFullAnalysis
// ---------------------------------------------------------------------------

/**
 * Get all high-level tuning summary metrics in one call.
 *
 * Socratic Q320: "If I have multiple high-level tuning summary functions, can I get them all
 * in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningReportCard(tuning, rootHz, spectrum)` → formatted report card string.
 * 2. `tuningTripleBestModes(tuning, spectrum, rootHz)` → best modes by all three metrics.
 * 3. `tuningConsistencyEntropyDelta(tuning, spectrum, rootHz)` → metric divergence scalar.
 * 4. `tuningHarmonicDensity(tuning)` → harmonic density score.
 *
 * @param tuning   - The tuning system to analyse.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ reportCard, tripleMode, consistencyEntropyDelta, harmonicDensity }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const analysis = tuningFullAnalysis(t12);
 * console.log(analysis.reportCard);
 * console.log(analysis.tripleMode.allAgree);
 */
export function tuningFullAnalysis(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): {
  reportCard: string;
  tripleMode: { byEntropy: Scale; byConsistency: Scale; byVolatility: Scale; allAgree: boolean };
  consistencyEntropyDelta: number;
  harmonicDensity: number;
} {
  const reportCard = tuningReportCard(tuning, rootHz, spectrum);
  const tripleMode = tuningTripleBestModes(tuning, spectrum, rootHz);
  const consistencyEntropyDelta = tuningConsistencyEntropyDelta(tuning, spectrum, rootHz);
  const harmonicDensity = tuningHarmonicDensity(tuning);
  return { reportCard, tripleMode, consistencyEntropyDelta, harmonicDensity };
}

// ---------------------------------------------------------------------------
// Q324 — tuningModeNarratives
// ---------------------------------------------------------------------------

/**
 * Get a narrative string for every mode of a tuning in one call.
 *
 * Socratic Q324: "If I can get progression and narrative for a single mode, can I get
 * narratives for all modes of a tuning at once?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 3. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapProgressionBridge(chordMap, rootHz, spectrum)` → `progressionNarrative(chords, rootHz, spectrum)`.
 *
 * @param tuning   - The tuning system whose modes to narrate.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ mode, narrative }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const narratives = tuningModeNarratives(t12);
 * for (const { mode, narrative } of narratives) {
 *   console.log(mode.id, narrative);
 * }
 */
export function tuningModeNarratives(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; narrative: string }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const chords = chordMapProgressionBridge(chordMap, rootHz, spectrum);
    const narrative = progressionNarrative(chords, rootHz, spectrum);
    return { mode, narrative };
  });
}

// ---------------------------------------------------------------------------
// Q325 — bestModeNarrative
// ---------------------------------------------------------------------------

/**
 * Get the narrative for the best mode of a tuning by a given metric in one call.
 *
 * Socratic Q325: "If I can get narratives for all modes and find the best mode by a metric,
 * can I get the best mode's narrative in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningBestModeProgression(tuning, metric, rootHz, spectrum)` → `{ mode, chords, smoothnessRatio }`.
 * 2. `progressionNarrative(chords, rootHz, spectrum)` → narrative string.
 *
 * @param tuning   - The tuning system.
 * @param metric   - Which metric to select the best mode by.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ mode, narrative }` for the best mode.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { mode, narrative } = bestModeNarrative(t12, 'entropy');
 * console.log(mode.id, narrative);
 */
export function bestModeNarrative(
  tuning: TuningSystem,
  metric: 'entropy' | 'consistency' | 'volatility',
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; narrative: string } {
  const { mode, chords } = tuningBestModeProgression(tuning, metric, rootHz, spectrum);
  const narrative = progressionNarrative(chords, rootHz, spectrum);
  return { mode, narrative };
}

// ---------------------------------------------------------------------------
// Q322 — tuningFamilyFullReport
// ---------------------------------------------------------------------------

/**
 * Get a tuning family report plus a full per-tuning analysis in one call.
 *
 * Socratic Q322: "If I can get a family report and full analysis per tuning, can I combine
 * them?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningFamilyReport(tunings, rootHz, spectrum)` → family-level report.
 * 2. For each tuning: `tuningFullAnalysis(tuning, rootHz, spectrum)` → per-tuning analysis.
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ familyReport, perTuningAnalysis }` where each entry has an `id` and `analysis`.
 *
 * @throws {RangeError} if `tunings` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const { familyReport, perTuningAnalysis } = tuningFamilyFullReport([t12, t19]);
 * console.log(familyReport.meanSimilarity);
 * console.log(perTuningAnalysis[0]!.analysis.harmonicDensity);
 */
export function tuningFamilyFullReport(
  tunings: TuningSystem[],
  rootHz = 440,
  spectrum?: Spectrum,
): {
  familyReport: TuningFamilyReport;
  perTuningAnalysis: { id: string; analysis: ReturnType<typeof tuningFullAnalysis> }[];
} {
  const familyReport = tuningFamilyReport(tunings, rootHz, spectrum);
  const perTuningAnalysis = tunings.map((t) => ({
    id: t.id,
    analysis: tuningFullAnalysis(t, rootHz, spectrum),
  }));
  return { familyReport, perTuningAnalysis };
}

// ---------------------------------------------------------------------------
// Q330 — tuningModeSummaries
// ---------------------------------------------------------------------------

/**
 * Get a chord map summary for every mode of a tuning in one call.
 *
 * Socratic Q330: "If I can get a chord map summary for one scale, can I get it for every
 * mode of a tuning at once?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 3. For each mode: `scaleToChordMapSummary(mode, tuning, spectrum)` → summary.
 *
 * @param tuning   - The tuning system whose modes to summarize.
 * @param rootHz   - Root frequency in Hz (default 440, unused here but kept for API consistency).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @returns Array of `{ mode, summary }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const summaries = tuningModeSummaries(t12);
 * for (const { mode, summary } of summaries) {
 *   console.log(mode.id, summary.count, summary.meanDissonance);
 * }
 */
export function tuningModeSummaries(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; summary: ReturnType<typeof scaleToChordMapSummary> }[] {
  void rootHz; // kept for API symmetry with sibling functions
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => ({
    mode,
    summary: scaleToChordMapSummary(mode, tuning, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q331 — tuningModeFullBundle
// ---------------------------------------------------------------------------

/**
 * Get entropy, consistency, volatility, narrative, and chord-map summary for every mode of a
 * tuning in one call.
 *
 * Socratic Q331: "If I can get mode comparison, narratives, and summaries separately, can I get
 * all of them together per mode?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComparison(tuning, spectrum, rootHz)` → `{mode, entropy, consistency, volatility}[]`.
 * 2. `tuningModeNarratives(tuning, rootHz, spectrum)` → `{mode, narrative}[]`.
 * 3. `tuningModeSummaries(tuning, rootHz, spectrum)` → `{mode, summary}[]`.
 * 4. Zip the three arrays by index (all iterate modes in the same `scaleModeSeries` order).
 *
 * @param tuning   - The tuning system whose modes to bundle.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation and synthesis.
 * @returns Array of `{ mode, entropy, consistency, volatility, narrative, summary }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const bundle = tuningModeFullBundle(t12);
 * const first = bundle[0]!;
 * console.log(first.mode.id, first.entropy, first.narrative);
 */
export function tuningModeFullBundle(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  narrative: string;
  summary: ReturnType<typeof scaleToChordMapSummary>;
}[] {
  const comparison = tuningModeComparison(tuning, spectrum, rootHz);
  const narratives = tuningModeNarratives(tuning, rootHz, spectrum);
  const summaries = tuningModeSummaries(tuning, rootHz, spectrum);
  return comparison.map((c, i) => ({
    mode: c.mode,
    entropy: c.entropy,
    consistency: c.consistency,
    volatility: c.volatility,
    narrative: narratives[i]!.narrative,
    summary: summaries[i]!.summary,
  }));
}

// ---------------------------------------------------------------------------
// Q333 — tuningFamilyNarratives
// ---------------------------------------------------------------------------

/**
 * Get the best-mode narrative for every tuning in a family in one call.
 *
 * Socratic Q333: "If I can get best mode narrative for one tuning and iterate a family, can I get
 * narratives for all tunings in a family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `bestModeNarrative(tuning, 'entropy', rootHz, spectrum)` → `{mode, narrative}`.
 * 2. Return `{id: tuning.id, bestModeNarrative: narrative}`.
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ id, bestModeNarrative }`, one per tuning.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const narratives = tuningFamilyNarratives([t12, t19]);
 * console.log(narratives[0]!.id, narratives[0]!.bestModeNarrative);
 */
export function tuningFamilyNarratives(
  tunings: TuningSystem[],
  rootHz = 440,
  spectrum?: Spectrum,
): { id: string; bestModeNarrative: string }[] {
  return tunings.map((tuning) => {
    const { narrative } = bestModeNarrative(tuning, 'entropy', rootHz, spectrum);
    return { id: tuning.id, bestModeNarrative: narrative };
  });
}

// ---------------------------------------------------------------------------
// Q334 — tuningFamilyModeRankings
// ---------------------------------------------------------------------------

/**
 * Get mode rankings by all three metrics for every tuning in a family in one call.
 *
 * Socratic Q334: "If I can get mode ranking bundle for one tuning and iterate a family, can I get
 * all rankings for a whole family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `tuningModeRankingBundle(tuning, spectrum, rootHz)` → `{byEntropy, byConsistency, byVolatility}`.
 * 2. Return `{id: tuning.id, rankings: ...}`.
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @returns Array of `{ id, rankings }` where `rankings` has `byEntropy`, `byConsistency`, `byVolatility`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilyModeRankings([t12, t19]);
 * console.log(result[0]!.rankings.byEntropy[0]!.id);
 */
export function tuningFamilyModeRankings(
  tunings: TuningSystem[],
  rootHz = 440,
  spectrum?: Spectrum,
): {
  id: string;
  rankings: { byEntropy: Scale[]; byConsistency: Scale[]; byVolatility: Scale[] };
}[] {
  return tunings.map((tuning) => ({
    id: tuning.id,
    rankings: tuningModeRankingBundle(tuning, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q336 — tuningModeProgressionBundles
// ---------------------------------------------------------------------------

/**
 * Get the chord progression bundle for every mode of a tuning in one call.
 *
 * Socratic Q336: "If I can get progression bundle for one mode and iterate all modes,
 * can I get all mode progression bundles at once?" → No → implement.
 *
 * Algorithm:
 * 1. `allModes(tuning)` → all modal rotations.
 * 2. For each mode: `modeProgressionBundle(mode, tuning, rootHz, spectrum)` → `{chords, smoothnessRatio}`.
 *
 * @param tuning   - The tuning system whose modes to process.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @returns Array of `{ mode, chords, smoothnessRatio }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const bundles = tuningModeProgressionBundles(t12);
 * for (const { mode, chords, smoothnessRatio } of bundles) {
 *   console.log(mode.id, chords.length, smoothnessRatio);
 * }
 */
export function tuningModeProgressionBundles(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; chords: Chord[]; smoothnessRatio: number }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const { chords, smoothnessRatio } = modeProgressionBundle(mode, tuning, rootHz, spectrum);
    return { mode, chords, smoothnessRatio };
  });
}

// ---------------------------------------------------------------------------
// Q337 — tuningModeSpectralBundles
// ---------------------------------------------------------------------------

/**
 * Get the mean spectral fit and chord map for every mode of a tuning in one call.
 *
 * Socratic Q337: "If I can get spectral fit per chord map and iterate modes,
 * can I get spectral fit for every mode at once?" → No → implement.
 *
 * Algorithm:
 * 1. `allModes(tuning)` → all modal rotations.
 * 2. For each mode: `scaleToChordMap(mode, tuning)` → chordMap.
 * 3. `chordMapSpectralProfile(chordMap, spectrum, rootHz)` → per-entry spectral fits.
 * 4. Mean of spectralFit values → per-mode spectralFit.
 *
 * @param tuning   - The tuning system whose modes to process.
 * @param spectrum - Instrument spectrum (required for spectral fit computation).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{ mode, spectralFit, chordMap }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const bundles = tuningModeSpectralBundles(t12, harmonicSpectrum());
 * for (const { mode, spectralFit } of bundles) {
 *   console.log(mode.id, spectralFit);
 * }
 */
export function tuningModeSpectralBundles(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz = 440,
): { mode: Scale; spectralFit: number; chordMap: ScaleChordMapEntry[] }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const profile = chordMapSpectralProfile(chordMap, spectrum, rootHz);
    const spectralFit =
      profile.length === 0
        ? 0
        : profile.reduce((sum, e) => sum + e.spectralFit, 0) / profile.length;
    return { mode, spectralFit, chordMap };
  });
}

// ---------------------------------------------------------------------------
// Q339 — tuningFamilyProgressionBundles
// ---------------------------------------------------------------------------

/**
 * Get all mode progression bundles for every tuning in a family in one call.
 *
 * Socratic Q339: "If I can get all mode progression bundles for one tuning and iterate a family,
 * can I get them all at once?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `tuningModeProgressionBundles(tuning, rootHz, spectrum)` → per-mode bundles.
 * 2. Return `{id: tuning.id, progressionBundles: ...}`.
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @returns Array of `{ id, progressionBundles }` where each `progressionBundles` has
 *          `{ mode, chords, smoothnessRatio }[]`, one per tuning.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilyProgressionBundles([t12, t19]);
 * console.log(result[0]!.id, result[0]!.progressionBundles.length);
 */
export function tuningFamilyProgressionBundles(
  tunings: TuningSystem[],
  rootHz = 440,
  spectrum?: Spectrum,
): {
  id: string;
  progressionBundles: { mode: Scale; chords: Chord[]; smoothnessRatio: number }[];
}[] {
  return tunings.map((tuning) => ({
    id: tuning.id,
    progressionBundles: tuningModeProgressionBundles(tuning, rootHz, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q342 — tuningFamilySpectralBundles
// ---------------------------------------------------------------------------

/**
 * Get per-mode spectral fits for every tuning in a family in one call.
 *
 * Socratic Q342: "If I can get spectral bundles for one tuning and iterate a family, can I get
 * per-mode spectral fits for an entire family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `tuningModeSpectralBundles(t, spectrum, rootHz)` → per-mode bundles.
 * 2. Strip `chordMap` (heavy) — keep only `{mode, spectralFit}`.
 * 3. Return `{id: tuning.id, modeBundles: ...}`.
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param spectrum - Instrument spectrum (required for spectral fit computation).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{ id, modeBundles }` where `modeBundles` is `{ mode, spectralFit }[]`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilySpectralBundles([t12, t19], harmonicSpectrum());
 * console.log(result[0]!.id, result[0]!.modeBundles[0]!.spectralFit);
 */
export function tuningFamilySpectralBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz = 440,
): { id: string; modeBundles: { mode: Scale; spectralFit: number }[] }[] {
  return tunings.map((tuning) => ({
    id: tuning.id,
    modeBundles: tuningModeSpectralBundles(tuning, spectrum, rootHz).map(
      ({ mode, spectralFit }) => ({ mode, spectralFit }),
    ),
  }));
}

// ---------------------------------------------------------------------------
// Q343 — tuningFamilyFullBundle
// ---------------------------------------------------------------------------

/**
 * Get full analysis and mode full bundle for every tuning in a family in one call.
 *
 * Socratic Q343: "If I can get full analysis and mode full bundle for each tuning in a family,
 * can I combine them?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `tuningFullAnalysis(t, rootHz, spectrum)` → full analysis.
 * 2. For each tuning: `tuningModeFullBundle(t, rootHz, spectrum)` → per-mode bundle array.
 * 3. Return `{id, fullAnalysis, modeFullBundle}`.
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ id, fullAnalysis, modeFullBundle }`, one per tuning.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilyFullBundle([t12, t19]);
 * console.log(result[0]!.fullAnalysis.reportCard);
 * console.log(result[0]!.modeFullBundle[0]!.narrative);
 */
export function tuningFamilyFullBundle(
  tunings: TuningSystem[],
  rootHz = 440,
  spectrum?: Spectrum,
): {
  id: string;
  fullAnalysis: {
    reportCard: string;
    tripleMode: { byEntropy: Scale; byConsistency: Scale; byVolatility: Scale; allAgree: boolean };
    consistencyEntropyDelta: number;
    harmonicDensity: number;
  };
  modeFullBundle: {
    mode: Scale;
    entropy: number;
    consistency: number;
    volatility: number;
    narrative: string;
    summary: ReturnType<typeof scaleToChordMapSummary>;
  }[];
}[] {
  return tunings.map((tuning) => ({
    id: tuning.id,
    fullAnalysis: tuningFullAnalysis(tuning, rootHz, spectrum),
    modeFullBundle: tuningModeFullBundle(tuning, rootHz, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q345 — chordMapFullBundle
// ---------------------------------------------------------------------------

/**
 * Get ranked bundle, volatility bundle, and progression with smoothness for a chord map in one call.
 *
 * Socratic Q345: "If I can get ranked bundle, volatility bundle, and normalized scores for a
 * chord map, can I also get its progression smoothness and combine all into one call?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapRankedBundle(chordMap, spectrum, rootHz)` → rankedBundle.
 * 2. `chordMapVolatilityBundle(chordMap, spectrum, rootHz)` → volatilityBundle.
 * 3. `chordMapProgressionBridge(chordMap, rootHz, spectrum)` → chords.
 * 4. `progressionSmoothnessRatio(chords, rootHz, spectrum)` → smoothnessRatio.
 *
 * Note: `rankedBundle.normalizedScores` already covers normalized scores.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @returns `{ rankedBundle, volatilityBundle, progression: { chords, smoothnessRatio } }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const bundle = chordMapFullBundle(chordMap, harmonicSpectrum());
 * console.log(bundle.rankedBundle.entropy, bundle.volatilityBundle.volatility);
 * console.log(bundle.progression.smoothnessRatio);
 */
export function chordMapFullBundle(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum: Spectrum,
  rootHz = 440,
): {
  rankedBundle: {
    spectralRanking: ScaleChordMapEntry[];
    normalizedScores: {
      entry: ScaleChordMapEntry;
      normalizedDissonance: number;
      normalizedHarmonicity: number;
    }[];
    entropy: number;
    consistency: number;
  };
  volatilityBundle: { volatility: number; entropy: number; consistency: number };
  progression: { chords: Chord[]; smoothnessRatio: number };
} {
  const rankedBundle = chordMapRankedBundle(chordMap, spectrum, rootHz);
  const volatilityBundle = chordMapVolatilityBundle(chordMap, spectrum, rootHz);
  const chords = chordMapProgressionBridge(chordMap, rootHz, spectrum);
  const smoothnessRatio = progressionSmoothnessRatio(chords, rootHz, spectrum);
  return { rankedBundle, volatilityBundle, progression: { chords, smoothnessRatio } };
}

// ---------------------------------------------------------------------------
// Q346 — scaleModeSpectralRankings
// ---------------------------------------------------------------------------

/**
 * Get spectral ranking and normalized scores for a scale's chord map in one call.
 *
 * Socratic Q346: "If I can get spectral ranking and normalized scores for a chord map, can I
 * get both at once for a scale?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → chordMap.
 * 2. `chordMapSpectralRanking(chordMap, spectrum, rootHz)` → spectralRanking.
 * 3. `chordMapNormalizedScores(chordMap, spectrum, rootHz)` → normalizedScores.
 *
 * @param scale    - The scale (mode) to rank.
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{ spectralRanking, normalizedScores }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const { spectralRanking, normalizedScores } = scaleModeSpectralRankings(major, t12, harmonicSpectrum());
 * console.log(spectralRanking[0]!.chord.name, normalizedScores[0]!.normalizedDissonance);
 */
export function scaleModeSpectralRankings(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz = 440,
): {
  spectralRanking: ScaleChordMapEntry[];
  normalizedScores: {
    entry: ScaleChordMapEntry;
    normalizedDissonance: number;
    normalizedHarmonicity: number;
  }[];
} {
  const chordMap = scaleToChordMap(scale, tuning);
  const spectralRanking = chordMapSpectralRanking(chordMap, spectrum, rootHz);
  const normalizedScores = chordMapNormalizedScores(chordMap, spectrum, rootHz);
  return { spectralRanking, normalizedScores };
}

// ---------------------------------------------------------------------------
// Q348 — tuningModeChordMapBundles
// ---------------------------------------------------------------------------

/**
 * Get a full chord map bundle for every mode of a tuning in one call.
 *
 * Socratic Q348: "If I can get a full chord map bundle for one chord map, can I get it for
 * every mode of a tuning?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 3. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapFullBundle(chordMap, spectrum, rootHz)`.
 * 4. Return `{mode, chordMapBundle}[]`.
 *
 * @param tuning   - The tuning system whose modes to process.
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{ mode, chordMapBundle }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const bundles = tuningModeChordMapBundles(t12, harmonicSpectrum());
 * for (const { mode, chordMapBundle } of bundles) {
 *   console.log(mode.id, chordMapBundle.volatilityBundle.volatility);
 * }
 */
export function tuningModeChordMapBundles(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz = 440,
): {
  mode: Scale;
  chordMapBundle: ReturnType<typeof chordMapFullBundle>;
}[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    return { mode, chordMapBundle: chordMapFullBundle(chordMap, spectrum, rootHz) };
  });
}

// ---------------------------------------------------------------------------
// Q350 — tuningFamilyChordMapBundles
// ---------------------------------------------------------------------------

/**
 * Get chord map bundles for all modes of every tuning in a family in one call.
 *
 * Socratic Q350: "If I can get chord map bundles for all modes of one tuning, can I do it for
 * an entire family?" → No → implement.
 *
 * Algorithm:
 * 1. tunings.map(t → `{id: t.id, modeBundles: tuningModeChordMapBundles(t, spectrum, rootHz)}`).
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{ id, modeBundles }` where `modeBundles` is `{ mode, chordMapBundle }[]`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilyChordMapBundles([t12, t19], harmonicSpectrum());
 * console.log(result[0]!.id, result[0]!.modeBundles[0]!.chordMapBundle.volatilityBundle.volatility);
 */
export function tuningFamilyChordMapBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz = 440,
): {
  id: string;
  modeBundles: { mode: Scale; chordMapBundle: ReturnType<typeof chordMapFullBundle> }[];
}[] {
  return tunings.map((tuning) => ({
    id: tuning.id,
    modeBundles: tuningModeChordMapBundles(tuning, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q351 — scaleChordMapNarrativeBundle
// ---------------------------------------------------------------------------

/**
 * Get volatility bundle, progression, and narrative for a scale's chord map in one call.
 *
 * Socratic Q351: "If I can get volatility bundle + progression + narrative from a scale's
 * chord map, can I get them all at once?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → chordMap.
 * 2. `chordMapVolatilityBundle(chordMap, spectrum, rootHz)` → `{volatility, entropy, consistency}`.
 * 3. `chordMapProgressionBridge(chordMap, rootHz, spectrum)` → chords.
 * 4. `progressionSmoothnessRatio(chords, rootHz, spectrum)` → smoothnessRatio.
 * 5. `progressionNarrative(chords, rootHz, spectrum)` → narrative.
 *
 * @param scale    - The scale (mode) to analyse.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ chords, smoothnessRatio, narrative, volatility, entropy, consistency }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const bundle = scaleChordMapNarrativeBundle(major, t12);
 * console.log(bundle.narrative, bundle.volatility, bundle.smoothnessRatio);
 */
export function scaleChordMapNarrativeBundle(
  scale: Scale,
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): {
  chords: Chord[];
  smoothnessRatio: number;
  narrative: string;
  volatility: number;
  entropy: number;
  consistency: number;
} {
  const chordMap = scaleToChordMap(scale, tuning);
  const { volatility, entropy, consistency } = chordMapVolatilityBundle(chordMap, spectrum, rootHz);
  const chords = chordMapProgressionBridge(chordMap, rootHz, spectrum);
  const smoothnessRatio = progressionSmoothnessRatio(chords, rootHz, spectrum);
  const narrative = progressionNarrative(chords, rootHz, spectrum);
  return { chords, smoothnessRatio, narrative, volatility, entropy, consistency };
}

// ---------------------------------------------------------------------------
// Q352 — tuningBestModeChordMapNarrative
// ---------------------------------------------------------------------------

/**
 * Find the best mode of a tuning by a metric and return its chord map narrative bundle in one call.
 *
 * Socratic Q352: "If I can find the best mode and get its chord map narrative bundle, can I
 * combine them?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeRanking(tuning, metric, spectrum, rootHz)` → sorted modes (best first).
 * 2. Throw `RangeError` if ranking is empty.
 * 3. `scaleChordMapNarrativeBundle(bestMode, tuning, rootHz, spectrum)` → bundle.
 * 4. Return `{mode, ...bundle}`.
 *
 * @param tuning   - The tuning system to analyse.
 * @param metric   - Ranking metric: `'entropy'` | `'consistency'` | `'volatility'`.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ mode, narrative, volatility, entropy, consistency, smoothnessRatio }`.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const result = tuningBestModeChordMapNarrative(t12, 'entropy');
 * console.log(result.mode.id, result.narrative, result.volatility);
 */
export function tuningBestModeChordMapNarrative(
  tuning: TuningSystem,
  metric: 'entropy' | 'consistency' | 'volatility',
  rootHz = 440,
  spectrum?: Spectrum,
): {
  mode: Scale;
  narrative: string;
  volatility: number;
  entropy: number;
  consistency: number;
  smoothnessRatio: number;
} {
  const ranking = tuningModeRanking(tuning, metric, spectrum, rootHz);
  if (ranking.length === 0) {
    throw new RangeError('tuningBestModeChordMapNarrative: tuning has no modes');
  }
  const bestMode = ranking[0]!;
  const bundle = scaleChordMapNarrativeBundle(bestMode, tuning, rootHz, spectrum);
  return { mode: bestMode, ...bundle };
}

// ---------------------------------------------------------------------------
// Q354 — tuningModeNarrativeCompare
// ---------------------------------------------------------------------------

/**
 * Compare the best mode chord map narrative for all three metrics in a single call.
 *
 * Socratic Q354: "If I can get best mode narrative by each metric separately, can I compare all
 * three at once?" → No → implement.
 *
 * Algorithm:
 * 1. Call `tuningBestModeChordMapNarrative(tuning, 'entropy', rootHz, spectrum)` → bestEntropy.
 * 2. Call `tuningBestModeChordMapNarrative(tuning, 'consistency', rootHz, spectrum)` → bestConsistency.
 * 3. Call `tuningBestModeChordMapNarrative(tuning, 'volatility', rootHz, spectrum)` → bestVolatility.
 * 4. `allSameMode` = all three mode ids are equal.
 *
 * @param tuning   - The tuning system to analyse.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ bestEntropy, bestConsistency, bestVolatility, allSameMode }`.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const cmp = tuningModeNarrativeCompare(t12);
 * console.log(cmp.allSameMode, cmp.bestEntropy.mode.id);
 */
export function tuningModeNarrativeCompare(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): {
  bestEntropy: ReturnType<typeof tuningBestModeChordMapNarrative>;
  bestConsistency: ReturnType<typeof tuningBestModeChordMapNarrative>;
  bestVolatility: ReturnType<typeof tuningBestModeChordMapNarrative>;
  allSameMode: boolean;
} {
  const bestEntropy = tuningBestModeChordMapNarrative(tuning, 'entropy', rootHz, spectrum);
  const bestConsistency = tuningBestModeChordMapNarrative(tuning, 'consistency', rootHz, spectrum);
  const bestVolatility = tuningBestModeChordMapNarrative(tuning, 'volatility', rootHz, spectrum);
  const allSameMode =
    bestEntropy.mode.id === bestConsistency.mode.id &&
    bestConsistency.mode.id === bestVolatility.mode.id;
  return { bestEntropy, bestConsistency, bestVolatility, allSameMode };
}

// ---------------------------------------------------------------------------
// Q356 — tuningFamilyNarrativeCompare
// ---------------------------------------------------------------------------

/**
 * Compare the best mode chord map narratives for all three metrics across an entire tuning family.
 *
 * Socratic Q356: "If I can compare best mode narratives for one tuning, can I do it for a whole
 * family?" → No → implement.
 *
 * Algorithm:
 * 1. tunings.map(t → `{id: t.id, narrativeCompare: tuningModeNarrativeCompare(t, rootHz, spectrum)}`).
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ id, narrativeCompare }`, one per tuning, in input order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilyNarrativeCompare([t12, t19]);
 * console.log(result[0]!.narrativeCompare.allSameMode);
 */
export function tuningFamilyNarrativeCompare(
  tunings: TuningSystem[],
  rootHz = 440,
  spectrum?: Spectrum,
): {
  id: string;
  narrativeCompare: ReturnType<typeof tuningModeNarrativeCompare>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    narrativeCompare: tuningModeNarrativeCompare(t, rootHz, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q357 — scaleBestProgressionNarrative
// ---------------------------------------------------------------------------

/**
 * Get the smoothed progression narrative for a scale's chord map in one call.
 *
 * Socratic Q357: "If I can get progression + narrative for a scale's chord map, can I return
 * only the smoothed narrative-related fields?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → chordMap.
 * 2. `chordMapProgressionBridge(chordMap, rootHz, spectrum)` → rawChords.
 * 3. `chordProgressionSmooth(rawChords, rootHz, spectrum)` → smoothChords.
 * 4. `progressionSmoothnessRatio(smoothChords, rootHz, spectrum)` → smoothnessRatio.
 * 5. `progressionNarrative(smoothChords, rootHz, spectrum)` → narrative.
 * Return `{ narrative, smoothnessRatio, chords: smoothChords }`.
 *
 * @param scale    - The scale (mode) to analyse.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ narrative, smoothnessRatio, chords }` with the smoothed chord sequence.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const result = scaleBestProgressionNarrative(major, t12);
 * console.log(result.narrative, result.smoothnessRatio);
 */
export function scaleBestProgressionNarrative(
  scale: Scale,
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { narrative: string; smoothnessRatio: number; chords: Chord[] } {
  const chordMap = scaleToChordMap(scale, tuning);
  const rawChords = chordMapProgressionBridge(chordMap, rootHz, spectrum);
  const smoothChords = chordProgressionSmooth(rawChords, rootHz, spectrum);
  const smoothnessRatio = progressionSmoothnessRatio(smoothChords, rootHz, spectrum);
  const narrative = progressionNarrative(smoothChords, rootHz, spectrum);
  return { narrative, smoothnessRatio, chords: smoothChords };
}

// ---------------------------------------------------------------------------
// Q358 — tuningModeBestProgressionNarratives
// ---------------------------------------------------------------------------

/**
 * Get the smoothed best progression narrative for every mode of a tuning in one call.
 *
 * Socratic Q358: "If I can get the best progression narrative for one scale, can I get it for
 * every mode of a tuning at once?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `scaleModeSeries(scale, tuning)` → all modal rotations.
 * 3. For each mode: `scaleBestProgressionNarrative(mode, tuning, rootHz, spectrum)`.
 *
 * @param tuning   - The tuning system whose modes to process.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ mode, narrative, smoothnessRatio }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const results = tuningModeBestProgressionNarratives(t12);
 * for (const { mode, narrative, smoothnessRatio } of results) {
 *   console.log(mode.id, smoothnessRatio, narrative);
 * }
 */
export function tuningModeBestProgressionNarratives(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; narrative: string; smoothnessRatio: number }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const { narrative, smoothnessRatio } = scaleBestProgressionNarrative(
      mode,
      tuning,
      rootHz,
      spectrum,
    );
    return { mode, narrative, smoothnessRatio };
  });
}

// ---------------------------------------------------------------------------
// Q360 — tuningModeSmoothProgressionRatios
// ---------------------------------------------------------------------------

/**
 * Get the smoothness ratio for every mode's best progression in one call.
 *
 * Socratic Q360: "If I can get smoothness ratio for one mode's best progression, can I get it
 * for every mode at once?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeBestProgressionNarratives(tuning, rootHz, spectrum)` → per-mode results.
 * 2. Map to `{ mode, smoothnessRatio }`.
 *
 * @param tuning   - The tuning system whose modes to process.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ mode, smoothnessRatio }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const ratios = tuningModeSmoothProgressionRatios(t12);
 * for (const { mode, smoothnessRatio } of ratios) {
 *   console.log(mode.id, smoothnessRatio);
 * }
 */
export function tuningModeSmoothProgressionRatios(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; smoothnessRatio: number }[] {
  return tuningModeBestProgressionNarratives(tuning, rootHz, spectrum).map(
    ({ mode, smoothnessRatio }) => ({ mode, smoothnessRatio }),
  );
}

// ---------------------------------------------------------------------------
// Q361 — tuningBestSmoothMode
// ---------------------------------------------------------------------------

/**
 * Find the mode of a tuning with the highest progression smoothness ratio in one call.
 *
 * Socratic Q361: "If I can get smoothness ratios for all modes, can I find the smoothest mode
 * in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeSmoothProgressionRatios(tuning, rootHz, spectrum)` → per-mode ratios.
 * 2. Find the entry with the maximum smoothnessRatio.
 *
 * @param tuning   - The tuning system to analyse.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns `{ mode, smoothnessRatio }` for the mode with the highest ratio.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const best = tuningBestSmoothMode(t12);
 * console.log(best.mode.id, best.smoothnessRatio);
 */
export function tuningBestSmoothMode(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): { mode: Scale; smoothnessRatio: number } {
  const ratios = tuningModeSmoothProgressionRatios(tuning, rootHz, spectrum);
  if (ratios.length === 0) throw new RangeError('tuningBestSmoothMode: tuning has no modes');
  let best = ratios[0]!;
  for (const r of ratios) {
    if (r.smoothnessRatio > best.smoothnessRatio) best = r;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Q363 — tuningFamilyBestSmoothModes
// ---------------------------------------------------------------------------

/**
 * Find the smoothest mode for every tuning in a family in one call.
 *
 * Socratic Q363: "If I can find the smoothest mode for one tuning and iterate a family, can I
 * do it for a whole family?" → No → implement.
 *
 * Algorithm:
 * 1. tunings.map(t → `{ id: t.id, bestSmoothMode: tuningBestSmoothMode(t, rootHz, spectrum) }`).
 *
 * @param tunings  - Array of `TuningSystem`s in the family.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ id, bestSmoothMode }`, one per tuning, in input order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilyBestSmoothModes([t12, t19]);
 * console.log(result[0]!.id, result[0]!.bestSmoothMode.smoothnessRatio);
 */
export function tuningFamilyBestSmoothModes(
  tunings: TuningSystem[],
  rootHz = 440,
  spectrum?: Spectrum,
): { id: string; bestSmoothMode: { mode: Scale; smoothnessRatio: number } }[] {
  return tunings.map((t) => ({
    id: t.id,
    bestSmoothMode: tuningBestSmoothMode(t, rootHz, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q364 — scaleProgressionFullBundle
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

/**
 * Get per-mode entropy, consistency, and their normalized delta in one pass.
 *
 * Socratic Q378: "If I have entropy and consistency profiles per mode, can I also compute
 * per-mode delta (|entropy - consistency| normalized) in one pass?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningEntropyProfile(tuning, spectrum, rootHz)` → `{mode, entropy}[]`.
 * 2. `tuningConsistencyProfile(tuning, spectrum, rootHz)` → `{mode, consistency}[]`.
 * 3. Normalize both to [0,1] separately. Compute `delta = |normEntropy[i] - normConsistency[i]|` per mode.
 * 4. Return `{mode, entropy, consistency, delta}[]` in mode order.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{mode, entropy, consistency, delta}[]` in mode order, or `[]` if no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const profiles = tuningModeConsistencyEntropyProfiles(t12);
 * for (const { mode, entropy, consistency, delta } of profiles) {
 *   console.log(mode.id, entropy, consistency, delta);
 * }
 */
export function tuningModeConsistencyEntropyProfiles(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz = 440,
): { mode: Scale; entropy: number; consistency: number; delta: number }[] {
  const entropyProfile = tuningEntropyProfile(tuning, spectrum, rootHz);
  const consistencyProfile = tuningConsistencyProfile(tuning, spectrum, rootHz);
  if (entropyProfile.length === 0) return [];

  const entropies = entropyProfile.map((e) => e.entropy);
  const consistencies = consistencyProfile.map((e) => e.consistency);

  const eMin = Math.min(...entropies);
  const eMax = Math.max(...entropies);
  const eRange = eMax - eMin;

  const cMin = Math.min(...consistencies);
  const cMax = Math.max(...consistencies);
  const cRange = cMax - cMin;

  return entropyProfile.map((ep, i) => {
    const cp = consistencyProfile[i]!;
    const normEntropy = eRange === 0 ? 0 : (ep.entropy - eMin) / eRange;
    const normConsistency = cRange === 0 ? 0 : (cp.consistency - cMin) / cRange;
    const delta = Math.abs(normEntropy - normConsistency);
    return { mode: ep.mode, entropy: ep.entropy, consistency: cp.consistency, delta };
  });
}

// ---------------------------------------------------------------------------
// Q380 — tuningTopModesByDelta
// ---------------------------------------------------------------------------

/**
 * Get the top N modes with highest consistency-entropy delta in one call.
 *
 * Socratic Q380: "If I have per-mode deltas, can I get the top N modes with highest delta
 * (most disagreement) in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeConsistencyEntropyProfiles(tuning, spectrum, rootHz)` → profiles.
 * 2. Sort descending by delta.
 * 3. Take first n entries as `{mode, delta}`.
 *
 * @param tuning   - The tuning system to analyse.
 * @param n        - Number of top modes to return.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{mode, delta}` sorted descending by delta, length ≤ n.
 *
 * @throws {RangeError} if `n <= 0`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const top3 = tuningTopModesByDelta(t12, 3);
 * for (const { mode, delta } of top3) {
 *   console.log(mode.id, delta);
 * }
 */
export function tuningTopModesByDelta(
  tuning: TuningSystem,
  n: number,
  spectrum?: Spectrum,
  rootHz = 440,
): { mode: Scale; delta: number }[] {
  if (n <= 0) throw new RangeError('tuningTopModesByDelta: n must be positive');
  const profiles = tuningModeConsistencyEntropyProfiles(tuning, spectrum, rootHz);
  return profiles
    .slice()
    .sort((a, b) => b.delta - a.delta)
    .slice(0, n)
    .map(({ mode, delta }) => ({ mode, delta }));
}

// ---------------------------------------------------------------------------
// Q381 — chordMapDissonanceHistogram
// ---------------------------------------------------------------------------

/**
 * Build a histogram of normalized dissonance distribution from a chord map.
 *
 * Socratic Q381: "If I can normalize dissonance scores from a chord map, can I build a histogram
 * of dissonance distribution?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapNormalizedScores(chordMap)` → `.map(e => e.normalizedDissonance)`.
 * 2. `bins` defaults to 10. Histogram is `bins`-length array, all 0.
 * 3. For each value v (0..1): `idx = Math.min(Math.floor(v * bins), bins - 1)`. Increment histogram[idx].
 * 4. Return histogram as `number[]`.
 * If chordMap has no entries, return `Array(bins).fill(0)`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param bins     - Number of histogram bins (default 10).
 * @returns `number[]` of length `bins` where each value is the count of chords in that dissonance bucket.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const cm = scaleToChordMap(scale, t12);
 * const hist = chordMapDissonanceHistogram(cm);
 * console.log(hist); // [count0, count1, ..., count9]
 */
export function chordMapDissonanceHistogram(
  chordMap: readonly ScaleChordMapEntry[],
  bins = 10,
): number[] {
  const histogram = Array.from({ length: bins }, () => 0) as number[];
  if (chordMap.length === 0) return histogram;
  const scores = chordMapNormalizedScores(chordMap);
  for (const { normalizedDissonance } of scores) {
    const idx = Math.min(Math.floor(normalizedDissonance * bins), bins - 1);
    histogram[idx] = (histogram[idx] ?? 0) + 1;
  }
  return histogram;
}

// ---------------------------------------------------------------------------
// Q382 — tuningModeDissonanceHistograms
// ---------------------------------------------------------------------------

/**
 * Get dissonance histograms for every mode of a tuning in one call.
 *
 * Socratic Q382: "If I can get a dissonance histogram for one chord map, can I get histograms
 * for every mode of a tuning?" → No → implement.
 *
 * Algorithm:
 * 1. `allModes(tuning)` → all modal rotations.
 * 2. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapDissonanceHistogram(chordMap, bins)`.
 *
 * @param tuning - The tuning system whose modes to process.
 * @param bins   - Number of histogram bins (default 10).
 * @returns Array of `{mode, histogram}`, one per mode, in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const hists = tuningModeDissonanceHistograms(t12);
 * for (const { mode, histogram } of hists) {
 *   console.log(mode.id, histogram);
 * }
 */
export function tuningModeDissonanceHistograms(
  tuning: TuningSystem,
  bins = 10,
): { mode: Scale; histogram: number[] }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const histogram = chordMapDissonanceHistogram(chordMap, bins);
    return { mode, histogram };
  });
}

// ---------------------------------------------------------------------------
// Q384 — chordMapHarmonicityHistogram
// ---------------------------------------------------------------------------

/**
 * Build a histogram of normalized harmonicity distribution from a chord map.
 *
 * Socratic Q384: "If I can build a dissonance histogram from normalized scores, can I build a
 * harmonicity histogram the same way?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapNormalizedScores(chordMap)` → `.map(e => e.normalizedHarmonicity)`.
 * 2. `bins` defaults to 10. Histogram is `bins`-length array, all 0.
 * 3. For each value v (0..1): `idx = Math.min(Math.floor(v * bins), bins - 1)`. Increment histogram[idx].
 * 4. Return histogram as `number[]`.
 * If chordMap has no entries, return `Array(bins).fill(0)`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param bins     - Number of histogram bins (default 10).
 * @returns `number[]` of length `bins` where each value is the count of chords in that harmonicity bucket.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const cm = scaleToChordMap(scale, t12);
 * const hist = chordMapHarmonicityHistogram(cm);
 * console.log(hist); // [count0, count1, ..., count9]
 */
export function chordMapHarmonicityHistogram(
  chordMap: readonly ScaleChordMapEntry[],
  bins = 10,
): number[] {
  const histogram = Array.from({ length: bins }, () => 0) as number[];
  if (chordMap.length === 0) return histogram;
  const scores = chordMapNormalizedScores(chordMap);
  for (const { normalizedHarmonicity } of scores) {
    const idx = Math.min(Math.floor(normalizedHarmonicity * bins), bins - 1);
    histogram[idx] = (histogram[idx] ?? 0) + 1;
  }
  return histogram;
}

// ---------------------------------------------------------------------------
// Q385 — tuningModeHarmonicityHistograms
// ---------------------------------------------------------------------------

/**
 * Get harmonicity histograms for every mode of a tuning in one call.
 *
 * Socratic Q385: "If I can build a harmonicity histogram for one chord map, can I get histograms
 * for every mode at once?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleModeSeries(tuningToScale(tuning), tuning)` → all modal rotations.
 * 2. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapHarmonicityHistogram(chordMap, bins)`.
 *
 * @param tuning - The tuning system whose modes to process.
 * @param bins   - Number of histogram bins (default 10).
 * @returns Array of `{mode, histogram}`, one per mode, in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const hists = tuningModeHarmonicityHistograms(t12);
 * for (const { mode, histogram } of hists) {
 *   console.log(mode.id, histogram);
 * }
 */
export function tuningModeHarmonicityHistograms(
  tuning: TuningSystem,
  bins = 10,
): { mode: Scale; histogram: number[] }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const histogram = chordMapHarmonicityHistogram(chordMap, bins);
    return { mode, histogram };
  });
}

// ---------------------------------------------------------------------------
// Q386 — chordMapDualHistogram
// ---------------------------------------------------------------------------

/**
 * Build dissonance and harmonicity histograms from a chord map in one pass.
 *
 * Socratic Q386: "If I can build dissonance and harmonicity histograms separately, can I get both
 * at once in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapNormalizedScores(chordMap)` → all normalized scores.
 * 2. Single pass: for each entry, bin `normalizedDissonance` and `normalizedHarmonicity` simultaneously.
 * 3. Return `{ dissonance, harmonicity }` each of length `bins`.
 * If chordMap has no entries, return two zero arrays of length `bins`.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param bins     - Number of histogram bins (default 10).
 * @returns `{ dissonance: number[], harmonicity: number[] }` each of length `bins`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const cm = scaleToChordMap(scale, t12);
 * const { dissonance, harmonicity } = chordMapDualHistogram(cm);
 * console.log(dissonance, harmonicity);
 */
export function chordMapDualHistogram(
  chordMap: readonly ScaleChordMapEntry[],
  bins = 10,
): { dissonance: number[]; harmonicity: number[] } {
  const dissonance = Array.from({ length: bins }, () => 0) as number[];
  const harmonicity = Array.from({ length: bins }, () => 0) as number[];
  if (chordMap.length === 0) return { dissonance, harmonicity };
  const scores = chordMapNormalizedScores(chordMap);
  for (const { normalizedDissonance, normalizedHarmonicity } of scores) {
    const dIdx = Math.min(Math.floor(normalizedDissonance * bins), bins - 1);
    const hIdx = Math.min(Math.floor(normalizedHarmonicity * bins), bins - 1);
    dissonance[dIdx] = (dissonance[dIdx] ?? 0) + 1;
    harmonicity[hIdx] = (harmonicity[hIdx] ?? 0) + 1;
  }
  return { dissonance, harmonicity };
}

// ---------------------------------------------------------------------------
// Q387 — tuningModeDualHistograms
// ---------------------------------------------------------------------------

/**
 * Get dual dissonance+harmonicity histograms for every mode of a tuning in one call.
 *
 * Socratic Q387: "If I can get dual histogram for one chord map, can I get it for every mode at
 * once?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleModeSeries(tuningToScale(tuning), tuning)` → all modal rotations.
 * 2. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapDualHistogram(chordMap, bins)`.
 *
 * @param tuning - The tuning system whose modes to process.
 * @param bins   - Number of histogram bins (default 10).
 * @returns Array of `{mode, dissonance, harmonicity}`, one per mode, in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const hists = tuningModeDualHistograms(t12);
 * for (const { mode, dissonance, harmonicity } of hists) {
 *   console.log(mode.id, dissonance, harmonicity);
 * }
 */
export function tuningModeDualHistograms(
  tuning: TuningSystem,
  bins = 10,
): { mode: Scale; dissonance: number[]; harmonicity: number[] }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const { dissonance, harmonicity } = chordMapDualHistogram(chordMap, bins);
    return { mode, dissonance, harmonicity };
  });
}

// ---------------------------------------------------------------------------
// Q389 — tuningFamilyDualHistograms
// ---------------------------------------------------------------------------

/**
 * Get dual dissonance+harmonicity histograms for all modes of every tuning in a family.
 *
 * Socratic Q389: "If I can get dual histograms for all modes of one tuning, can I do it for an
 * entire family?" → No → implement.
 *
 * Algorithm:
 * tunings.map(t → `{id: t.id, modeDualHistograms: tuningModeDualHistograms(t, bins)}`).
 *
 * @param tunings - Array of tuning systems to analyse.
 * @param bins    - Number of histogram bins (default 10).
 * @returns Array of `{id, modeDualHistograms}`, one per tuning.
 *
 * @example
 * const family = [equalTemperament12(440), edo(19, 440)];
 * const result = tuningFamilyDualHistograms(family);
 * for (const { id, modeDualHistograms } of result) {
 *   console.log(id, modeDualHistograms.length);
 * }
 */
export function tuningFamilyDualHistograms(
  tunings: readonly TuningSystem[],
  bins = 10,
): {
  id: string;
  modeDualHistograms: { mode: Scale; dissonance: number[]; harmonicity: number[] }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    modeDualHistograms: tuningModeDualHistograms(t, bins),
  }));
}

// ---------------------------------------------------------------------------
// Q390 — chordMapHistogramSummary
// ---------------------------------------------------------------------------

/**
 * Build dual histograms and summarize them with peak and spread info in one call.
 *
 * Socratic Q390: "If I can build dual histograms, can I also summarize them with peak and spread
 * info in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapDualHistogram(chordMap, bins)` → `{dissonance, harmonicity}`.
 * 2. For each histogram: compute peak (index of max value, first max if tie) and spread
 *    (normalized range of non-zero bins: `(lastNonZeroIdx - firstNonZeroIdx) / (bins - 1)`).
 *    Returns 0 for empty or single-bin histograms.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param bins     - Number of histogram bins (default 10).
 * @returns `{dissonance, harmonicity, peakDissonanceBin, peakHarmonicityBin, dissonanceSpread, harmonicitySpread}`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const cm = scaleToChordMap(scale, t12);
 * const summary = chordMapHistogramSummary(cm);
 * console.log(summary.peakDissonanceBin, summary.dissonanceSpread);
 */
export function chordMapHistogramSummary(
  chordMap: readonly ScaleChordMapEntry[],
  bins = 10,
): {
  dissonance: number[];
  harmonicity: number[];
  peakDissonanceBin: number;
  peakHarmonicityBin: number;
  dissonanceSpread: number;
  harmonicitySpread: number;
} {
  const { dissonance, harmonicity } = chordMapDualHistogram(chordMap, bins);

  const peakIdx = (arr: number[]): number => {
    let max = -1;
    let idx = 0;
    arr.forEach((v, i) => {
      if (v > max) {
        max = v;
        idx = i;
      }
    });
    return idx;
  };

  const spread = (arr: number[]): number => {
    const first = arr.findIndex((v) => v > 0);
    if (first === -1) return 0;
    let last = 0;
    arr.forEach((v, i) => {
      if (v > 0) last = i;
    });
    return arr.length <= 1 ? 0 : (last - first) / (arr.length - 1);
  };

  return {
    dissonance,
    harmonicity,
    peakDissonanceBin: peakIdx(dissonance),
    peakHarmonicityBin: peakIdx(harmonicity),
    dissonanceSpread: spread(dissonance),
    harmonicitySpread: spread(harmonicity),
  };
}

// ---------------------------------------------------------------------------
// Q391 — tuningModeHistogramSummaries
// ---------------------------------------------------------------------------

/**
 * Get histogram summary for every mode of a tuning in one call.
 *
 * Socratic Q391: "If I can get histogram summary for one chord map, can I get it for every mode
 * at once?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleModeSeries(tuningToScale(tuning), tuning)` → all modal rotations.
 * 2. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapHistogramSummary(chordMap, bins)`.
 *
 * @param tuning - The tuning system whose modes to process.
 * @param bins   - Number of histogram bins (default 10).
 * @returns Array of `{mode, histogramSummary}`, one per mode, in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const summaries = tuningModeHistogramSummaries(t12);
 * for (const { mode, histogramSummary } of summaries) {
 *   console.log(mode.id, histogramSummary.peakDissonanceBin, histogramSummary.dissonanceSpread);
 * }
 */
export function tuningModeHistogramSummaries(
  tuning: TuningSystem,
  bins = 10,
): { mode: Scale; histogramSummary: ReturnType<typeof chordMapHistogramSummary> }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const histogramSummary = chordMapHistogramSummary(chordMap, bins);
    return { mode, histogramSummary };
  });
}

// ---------------------------------------------------------------------------
// Q393 — tuningFamilyHistogramSummaries
// ---------------------------------------------------------------------------

/**
 * Get histogram summaries for all modes of every tuning in a family.
 *
 * Socratic Q393: "If I can get histogram summaries for all modes of one tuning, can I do it for
 * a whole family?" → No → implement.
 *
 * Algorithm:
 * tunings.map(t → `{id: t.id, modeSummaries: tuningModeHistogramSummaries(t, bins)}`).
 *
 * @param tunings - Array of tuning systems to analyse.
 * @param bins    - Number of histogram bins (default 10).
 * @returns Array of `{id, modeSummaries}`, one per tuning.
 *
 * @example
 * const family = [equalTemperament12(440), edo(19, 440)];
 * const result = tuningFamilyHistogramSummaries(family);
 * for (const { id, modeSummaries } of result) {
 *   console.log(id, modeSummaries.length);
 * }
 */
export function tuningFamilyHistogramSummaries(
  tunings: readonly TuningSystem[],
  bins = 10,
): {
  id: string;
  modeSummaries: { mode: Scale; histogramSummary: ReturnType<typeof chordMapHistogramSummary> }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    modeSummaries: tuningModeHistogramSummaries(t, bins),
  }));
}

// ---------------------------------------------------------------------------
// Q394 — chordMapAnalysisFull
// ---------------------------------------------------------------------------

/**
 * Get dual histogram, histogram summary, ranked bundle, and volatility bundle for a chord map
 * in one call.
 *
 * Socratic Q394: "If I can get dual histogram, histogram summary, ranked bundle, and volatility
 * bundle for a chord map, can I get all of them at once?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapDualHistogram(chordMap)` → dualHistogram.
 * 2. `chordMapHistogramSummary(chordMap)` → histogramSummary.
 * 3. `chordMapRankedBundle(chordMap, spectrum, rootHz)` → rankedBundle.
 * 4. `chordMapVolatilityBundle(chordMap, spectrum, rootHz)` → volatilityBundle.
 *
 * @param chordMap  - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param spectrum  - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz    - Root frequency in Hz (default 440).
 * @returns `{dualHistogram, histogramSummary, rankedBundle, volatilityBundle}`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const cm = scaleToChordMap(scale, t12);
 * const spec = harmonicSpectrum();
 * const full = chordMapAnalysisFull(cm, spec);
 * console.log(full.dualHistogram, full.histogramSummary.peakDissonanceBin, full.rankedBundle.entropy);
 */
export function chordMapAnalysisFull(
  chordMap: readonly ScaleChordMapEntry[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  dualHistogram: { dissonance: number[]; harmonicity: number[] };
  histogramSummary: ReturnType<typeof chordMapHistogramSummary>;
  rankedBundle: ReturnType<typeof chordMapRankedBundle>;
  volatilityBundle: ReturnType<typeof chordMapVolatilityBundle>;
} {
  const dualHistogram = chordMapDualHistogram(chordMap);
  const histogramSummary = chordMapHistogramSummary(chordMap);
  const rankedBundle = chordMapRankedBundle(chordMap, spectrum, rootHz);
  const volatilityBundle = chordMapVolatilityBundle(chordMap, spectrum, rootHz);
  return { dualHistogram, histogramSummary, rankedBundle, volatilityBundle };
}

// ---------------------------------------------------------------------------
// Q395 — scaleChordMapAnalysisFull
// ---------------------------------------------------------------------------

/**
 * Get full chord map analysis for a scale in one call.
 *
 * Socratic Q395: "If I can get full chord map analysis, can I get it for a scale in one call?"
 * → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → chordMap.
 * 2. `chordMapAnalysisFull(chordMap, spectrum, rootHz)` → full analysis.
 *
 * @param scale    - The scale to analyse.
 * @param tuning   - The tuning system the scale belongs to.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{dualHistogram, histogramSummary, rankedBundle, volatilityBundle}`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = tuningToScale(t12);
 * const spec = harmonicSpectrum();
 * const full = scaleChordMapAnalysisFull(scale, t12, spec);
 * console.log(full.rankedBundle.entropy, full.volatilityBundle.volatility);
 */
export function scaleChordMapAnalysisFull(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof chordMapAnalysisFull> {
  const chordMap = scaleToChordMap(scale, tuning);
  return chordMapAnalysisFull(chordMap, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q365 — tuningModeProgressionFullBundles
// ---------------------------------------------------------------------------

/**
 * Get the full progression bundle for every mode of a tuning in one call.
 *
 * Socratic Q365: "If I can get full progression bundle for one scale, can I get it for every
 * mode at once?" → No → implement.
 *
 * Algorithm:
 * 1. `allModes(tuning)` → all modal rotations via `scaleModeSeries(tuningToScale(tuning), tuning)`.
 * 2. For each mode: `scaleProgressionFullBundle(mode, tuning, rootHz, spectrum)`.
 *
 * @param tuning   - The tuning system whose modes to process.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @returns Array of `{ mode, chords, smoothedChords, smoothnessRatio, narrative, volatility,
 *   entropy, consistency }` in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const bundles = tuningModeProgressionFullBundles(t12);
 * for (const b of bundles) {
 *   console.log(b.mode.id, b.smoothnessRatio, b.volatility);
 * }
 */
export function tuningModeProgressionFullBundles(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
): {
  mode: Scale;
  chords: Chord[];
  smoothedChords: Chord[];
  smoothnessRatio: number;
  narrative: string;
  volatility: number;
  entropy: number;
  consistency: number;
}[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => ({
    mode,
    ...scaleProgressionFullBundle(mode, tuning, rootHz, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q396 — tuningModeAnalysisFull
// ---------------------------------------------------------------------------

/**
 * Get full chord map analysis for every mode of a tuning in one call.
 *
 * Socratic Q396: "If I can get full chord map analysis for one scale, can I get it for every
 * mode of a tuning at once?" → No → implement.
 *
 * Algorithm:
 * 1. `allModes(tuning)` → all modal rotations.
 * 2. For each mode: `scaleToChordMap(mode, tuning)` → `chordMapAnalysisFull(chordMap, spectrum, rootHz)`.
 *
 * @param tuning   - The tuning system whose modes to process.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{mode, analysisFull}`, one per mode, in allModes order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum();
 * const result = tuningModeAnalysisFull(t12, spec);
 * for (const { mode, analysisFull } of result) {
 *   console.log(mode.id, analysisFull.rankedBundle.entropy, analysisFull.volatilityBundle.volatility);
 * }
 */
export function tuningModeAnalysisFull(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; analysisFull: ReturnType<typeof chordMapAnalysisFull> }[] {
  const scale = tuningToScale(tuning);
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => {
    const chordMap = scaleToChordMap(mode, tuning);
    const analysisFull = chordMapAnalysisFull(chordMap, spectrum, rootHz);
    return { mode, analysisFull };
  });
}

// ---------------------------------------------------------------------------
// Q398 — tuningFamilyModeAnalysisFull
// ---------------------------------------------------------------------------

/**
 * Get full mode analysis for every tuning in a family in one call.
 *
 * Socratic Q398: "If I can get full mode analysis for one tuning, can I do it for a whole
 * family?" → No → implement.
 *
 * Algorithm:
 * tunings.map(t → `{id: t.id, modeAnalysis: tuningModeAnalysisFull(t, spectrum, rootHz)}`).
 *
 * @param tunings  - Array of tuning systems to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{id, modeAnalysis}`, one per tuning.
 *
 * @example
 * const family = [equalTemperament12(440), edo(19, 440)];
 * const spec = harmonicSpectrum();
 * const result = tuningFamilyModeAnalysisFull(family, spec);
 * for (const { id, modeAnalysis } of result) {
 *   console.log(id, modeAnalysis.length);
 * }
 */
export function tuningFamilyModeAnalysisFull(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; modeAnalysis: ReturnType<typeof tuningModeAnalysisFull> }[] {
  return tunings.map((t) => ({
    id: t.id,
    modeAnalysis: tuningModeAnalysisFull(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q399 — tuningHarmonicSpectralScore
// ---------------------------------------------------------------------------

/**
 * Combine harmonic density and spectral fit into a single score for a tuning.
 *
 * Socratic Q399: "If I can compute harmonic density and spectral fit separately, can I combine
 * them into a single score?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningHarmonicDensity(tuning, tol?)` → harmonicDensity.
 * 2. `tuningSpectralFit(tuning, spectrum, tol?)` → spectralFit.
 * 3. `combinedScore = (harmonicDensity + spectralFit) / 2` — arithmetic mean.
 *
 * @param tuning   - The tuning system to score.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440, reserved for future use).
 * @param tol      - Tolerance for harmonicity proximity (optional).
 * @returns `{harmonicDensity, spectralFit, combinedScore}`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum(6);
 * const score = tuningHarmonicSpectralScore(t12, spec);
 * console.log(score.harmonicDensity, score.spectralFit, score.combinedScore);
 */
export function tuningHarmonicSpectralScore(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz = 440,
  tol?: number,
): { harmonicDensity: number; spectralFit: number; combinedScore: number } {
  void rootHz; // reserved for future use; harmonic density and spectral fit are pitch-class invariant
  const harmonicDensity =
    tol !== undefined ? tuningHarmonicDensity(tuning, tol) : tuningHarmonicDensity(tuning);
  const spectralFit =
    tol !== undefined
      ? tuningSpectralFit(tuning, spectrum, tol)
      : tuningSpectralFit(tuning, spectrum);
  return { harmonicDensity, spectralFit, combinedScore: (harmonicDensity + spectralFit) / 2 };
}

// ---------------------------------------------------------------------------
// Q401 — tuningFamilyHarmonicSpectralScores
// ---------------------------------------------------------------------------

/**
 * Get harmonic-spectral score for every tuning in a family in one call.
 *
 * Socratic Q401: "If I can get harmonic-spectral score for one tuning, can I get it for a whole
 * family?" → No → implement.
 *
 * Algorithm:
 * tunings.map(t → `{id: t.id, score: tuningHarmonicSpectralScore(t, spectrum, rootHz, tol)}`).
 *
 * @param tunings  - Array of tuning systems to score.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param tol      - Tolerance for harmonicity proximity (optional).
 * @returns Array of `{id, score}`, one per tuning.
 *
 * @example
 * const family = [equalTemperament12(440), edo(19, 440)];
 * const spec = harmonicSpectrum(6);
 * const scores = tuningFamilyHarmonicSpectralScores(family, spec);
 * for (const { id, score } of scores) {
 *   console.log(id, score.combinedScore);
 * }
 */
export function tuningFamilyHarmonicSpectralScores(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
  tol?: number,
): { id: string; score: ReturnType<typeof tuningHarmonicSpectralScore> }[] {
  return tunings.map((t) => ({
    id: t.id,
    score:
      rootHz !== undefined
        ? tuningHarmonicSpectralScore(t, spectrum, rootHz, tol)
        : tuningHarmonicSpectralScore(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q402 — tuningComprehensiveReport
// ---------------------------------------------------------------------------

/**
 * Combine full analysis, harmonic-spectral score, stability score, and progression variety
 * for a tuning in a single call.
 *
 * Socratic Q402: "If I can get full analysis, harmonic-spectral score, stability score, and
 * progression variety separately, can I combine them all in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningFullAnalysis(tuning, rootHz, spectrum)` → fullAnalysis.
 * 2. `tuningHarmonicSpectralScore(tuning, spectrum, rootHz)` → harmonicSpectralScore.
 * 3. `tuningStabilityScore(tuning, rootHz, spectrum)` → stabilityScore.
 * 4. `tuningProgressionVariety(tuning)` → progressionVariety.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{fullAnalysis, harmonicSpectralScore, stabilityScore, progressionVariety}`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum(6);
 * const report = tuningComprehensiveReport(t12, spec);
 * console.log(report.stabilityScore, report.progressionVariety);
 */
export function tuningComprehensiveReport(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  fullAnalysis: {
    reportCard: string;
    tripleMode: { byEntropy: Scale; byConsistency: Scale; byVolatility: Scale; allAgree: boolean };
    consistencyEntropyDelta: number;
    harmonicDensity: number;
  };
  harmonicSpectralScore: { harmonicDensity: number; spectralFit: number; combinedScore: number };
  stabilityScore: number;
  progressionVariety: number;
} {
  const fullAnalysis = tuningFullAnalysis(tuning, rootHz, spectrum);
  const harmonicSpectralScore =
    rootHz !== undefined
      ? tuningHarmonicSpectralScore(tuning, spectrum, rootHz)
      : tuningHarmonicSpectralScore(tuning, spectrum);
  const stabilityScore =
    rootHz !== undefined
      ? tuningStabilityScore(tuning, rootHz, spectrum)
      : tuningStabilityScore(tuning, undefined, spectrum);
  const progressionVariety = tuningProgressionVariety(tuning);
  return { fullAnalysis, harmonicSpectralScore, stabilityScore, progressionVariety };
}

// ---------------------------------------------------------------------------
// Q404 — tuningFamilyComprehensiveReports
// ---------------------------------------------------------------------------

/**
 * Get comprehensive report for every tuning in a family in one call.
 *
 * Socratic Q404: "If I can get comprehensive report for one tuning, can I get it for a whole
 * family?" → No → implement.
 *
 * Algorithm:
 * tunings.map(t → `{id: t.id, report: tuningComprehensiveReport(t, spectrum, rootHz)}`).
 *
 * @param tunings  - Array of tuning systems to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{id, report}`, one per tuning.
 *
 * @example
 * const family = [equalTemperament12(440), edo(19, 440)];
 * const spec = harmonicSpectrum(6);
 * const reports = tuningFamilyComprehensiveReports(family, spec);
 * for (const { id, report } of reports) {
 *   console.log(id, report.stabilityScore);
 * }
 */
export function tuningFamilyComprehensiveReports(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; report: ReturnType<typeof tuningComprehensiveReport> }[] {
  return tunings.map((t) => ({
    id: t.id,
    report: tuningComprehensiveReport(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q405 — scaleSimilarityRanking
// ---------------------------------------------------------------------------

/**
 * Rank all tunings by similarity to a specific target tuning in one call.
 *
 * Socratic Q405: "If I can compute a similarity matrix for a list of tunings, can I rank all
 * tunings by similarity to a specific target tuning in one call?" → No → implement.
 *
 * Algorithm:
 * 1. Append targetTuning to tunings list (ensures it's always present at last index).
 * 2. `scaleSimilarityMatrix(allTunings, tol)` → matrix.
 * 3. Extract row corresponding to targetTuning (last row).
 * 4. Sort desc by similarity.
 * 5. Return `{tuning, similarity}[]` excluding targetTuning itself.
 *
 * @param tunings      - Array of tuning systems to rank.
 * @param targetTuning - The tuning to compare against.
 * @param tol          - Tolerance for similarity computation (optional).
 * @returns Array of `{tuning, similarity}` sorted descending by similarity.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const t31 = edo(31);
 * const ranking = scaleSimilarityRanking([t19, t31], t12);
 * console.log(ranking[0]!.tuning.id, ranking[0]!.similarity);
 */
export function scaleSimilarityRanking(
  tunings: readonly TuningSystem[],
  targetTuning: TuningSystem,
  tol?: number,
): { tuning: TuningSystem; similarity: number }[] {
  const allTunings = [...tunings, targetTuning];
  const matrix =
    tol !== undefined
      ? scaleSimilarityMatrix(allTunings, undefined, tol)
      : scaleSimilarityMatrix(allTunings);
  const targetIdx = allTunings.length - 1;
  const row = matrix[targetIdx] ?? [];
  return tunings
    .map((t, i) => ({ tuning: t, similarity: row[i] ?? 0 }))
    .sort((a, b) => b.similarity - a.similarity);
}

// ---------------------------------------------------------------------------
// Q407 — tuningFamilySimilarityMatrix
// ---------------------------------------------------------------------------

/**
 * Compute similarity matrix for a family and find most and least similar pairs in one call.
 *
 * Socratic Q407: "If I have the similarity matrix, can I also find the most and least similar
 * pairs in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleSimilarityMatrix(tunings, tol)` → matrix.
 * 2. Find max off-diagonal (i < j) → mostSimilarPair.
 * 3. Find min off-diagonal (i < j) → leastSimilarPair.
 *
 * @param tunings - Array of at least 2 tuning systems.
 * @param tol     - Tolerance for similarity computation (optional).
 * @returns `{tunings, matrix, mostSimilarPair, leastSimilarPair}`.
 *
 * @throws {RangeError} if fewer than 2 tunings are provided.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const result = tuningFamilySimilarityMatrix([t12, t19]);
 * console.log(result.mostSimilarPair[0].id, result.mostSimilarPair[1].id);
 */
export function tuningFamilySimilarityMatrix(
  tunings: TuningSystem[],
  tol?: number,
): {
  tunings: TuningSystem[];
  matrix: number[][];
  mostSimilarPair: [TuningSystem, TuningSystem];
  leastSimilarPair: [TuningSystem, TuningSystem];
} {
  if (tunings.length < 2) {
    throw new RangeError('tuningFamilySimilarityMatrix: need at least 2 tunings');
  }
  const matrix =
    tol !== undefined
      ? scaleSimilarityMatrix(tunings, undefined, tol)
      : scaleSimilarityMatrix(tunings);

  let maxSim = -Infinity,
    maxI = 0,
    maxJ = 1;
  let minSim = Infinity,
    minI = 0,
    minJ = 1;
  for (let i = 0; i < tunings.length; i++) {
    for (let j = i + 1; j < tunings.length; j++) {
      const sim = matrix[i]?.[j] ?? 0;
      if (sim > maxSim) {
        maxSim = sim;
        maxI = i;
        maxJ = j;
      }
      if (sim < minSim) {
        minSim = sim;
        minI = i;
        minJ = j;
      }
    }
  }
  const mostSimilarPair: [TuningSystem, TuningSystem] = [tunings[maxI]!, tunings[maxJ]!];
  const leastSimilarPair: [TuningSystem, TuningSystem] = [tunings[minI]!, tunings[minJ]!];
  return { tunings, matrix, mostSimilarPair, leastSimilarPair };
}

// ---------------------------------------------------------------------------
// Q408 — tuningModeIntervalProfile
// ---------------------------------------------------------------------------

/**
 * Compute interval diversity metrics for every modal rotation of a tuning in one call.
 *
 * Socratic Q408: "If I can get interval sets for all modes, can I also compute diversity metrics
 * per mode in one pass?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale spanning all degrees.
 * 2. `modeIntervalSets(scale, tuning)` → one entry per modal rotation.
 * 3. For each `{mode, intervalCents}`:
 *    - `intervalCount = intervalCents.length`
 *    - `uniqueIntervals = [...new Set(intervalCents)].sort((a,b) => a-b)`
 *    - `diversity = uniqueIntervals.length / Math.max(intervalCount, 1)`
 *
 * @param tuning - The `TuningSystem` to profile.
 * @returns One entry per modal rotation with interval count, unique intervals, and diversity ratio.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const profiles = tuningModeIntervalProfile(t12);
 * profiles.forEach(({ mode, diversity }) => console.log(mode.id, diversity));
 */
export function tuningModeIntervalProfile(tuning: TuningSystem): {
  mode: Scale;
  intervals: number[];
  intervalCount: number;
  uniqueIntervals: number[];
  diversity: number;
}[] {
  const scale = tuningToScale(tuning);
  return modeIntervalSets(scale, tuning).map(({ mode, intervalCents }) => {
    const intervalCount = intervalCents.length;
    const uniqueIntervals = [...new Set(intervalCents)].sort((a, b) => a - b);
    const diversity = uniqueIntervals.length / Math.max(intervalCount, 1);
    return { mode, intervals: intervalCents, intervalCount, uniqueIntervals, diversity };
  });
}

// ---------------------------------------------------------------------------
// Q410 — tuningFamilyIntervalProfiles
// ---------------------------------------------------------------------------

/**
 * Compute interval diversity profiles for every tuning in a family in one call.
 *
 * Socratic Q410: "If I can get interval profile for one tuning, can I get it for a whole family?"
 * → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `{id: t.id, modeProfiles: tuningModeIntervalProfile(t)}`.
 *
 * @param tunings - Array of `TuningSystem` objects to profile.
 * @returns One entry per tuning with its id and per-mode interval profiles.
 *
 * @example
 * const profiles = tuningFamilyIntervalProfiles([equalTemperament12(440), edo(19, 440)]);
 * profiles.forEach(({ id, modeProfiles }) => console.log(id, modeProfiles.length));
 */
export function tuningFamilyIntervalProfiles(tunings: TuningSystem[]): {
  id: string;
  modeProfiles: {
    mode: Scale;
    intervals: number[];
    intervalCount: number;
    uniqueIntervals: number[];
    diversity: number;
  }[];
}[] {
  return tunings.map((t) => ({ id: t.id, modeProfiles: tuningModeIntervalProfile(t) }));
}

// ---------------------------------------------------------------------------
// Q411 — tuningMostDiverseMode
// ---------------------------------------------------------------------------

/**
 * Find the modal rotation with the highest interval diversity for a tuning in one call.
 *
 * Socratic Q411: "If I have diversity scores for all modes, can I find the most interval-diverse
 * mode in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeIntervalProfile(tuning)` → per-mode diversity scores.
 * 2. Find the entry with maximum `diversity`.
 *
 * @param tuning - The `TuningSystem` to search.
 * @returns `{mode, diversity}` for the most interval-diverse modal rotation.
 *
 * @throws {RangeError} if the tuning has no degrees (no modes).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { mode, diversity } = tuningMostDiverseMode(t12);
 * console.log(mode.id, diversity);
 */
export function tuningMostDiverseMode(tuning: TuningSystem): { mode: Scale; diversity: number } {
  const profiles = tuningModeIntervalProfile(tuning);
  if (profiles.length === 0) throw new RangeError('tuningMostDiverseMode: tuning has no modes');
  let best = profiles[0]!;
  for (const p of profiles) {
    if (p.diversity > best.diversity) best = p;
  }
  return { mode: best.mode, diversity: best.diversity };
}

// ---------------------------------------------------------------------------
// Q413 — tuningFamilyMostDiverseModes
// ---------------------------------------------------------------------------

/**
 * Find the most interval-diverse modal rotation for every tuning in a family in one call.
 *
 * Socratic Q413: "If I can find the most diverse mode for one tuning, can I do it for a whole
 * family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `{id: t.id, mostDiverseMode: tuningMostDiverseMode(t)}`.
 *
 * @param tunings - Array of `TuningSystem` objects to search.
 * @returns One entry per tuning with its id and most-diverse mode.
 *
 * @example
 * const results = tuningFamilyMostDiverseModes([equalTemperament12(440), edo(19, 440)]);
 * results.forEach(({ id, mostDiverseMode }) => console.log(id, mostDiverseMode.diversity));
 */
export function tuningFamilyMostDiverseModes(tunings: TuningSystem[]): {
  id: string;
  mostDiverseMode: { mode: Scale; diversity: number };
}[] {
  return tunings.map((t) => ({ id: t.id, mostDiverseMode: tuningMostDiverseMode(t) }));
}

// ---------------------------------------------------------------------------
// Q414 — tuningModeComprehensiveBundle
// ---------------------------------------------------------------------------

/**
 * Combine entropy, consistency, volatility, interval diversity, and smoothness ratio per mode
 * in a single call.
 *
 * Socratic Q414: "If I can get mode comparison (entropy/consistency/volatility), mode interval
 * profile (diversity), and mode smoothness ratios separately, can I combine all five metrics per
 * mode in one pass?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComparison(tuning, spectrum, rootHz)` → `{mode, entropy, consistency, volatility}[]`.
 * 2. `tuningModeIntervalProfile(tuning)` → `{mode, diversity}[]`.
 * 3. `tuningModeSmoothProgressionRatios(tuning, rootHz, spectrum)` → `{mode, smoothnessRatio}[]`.
 * All three return arrays in the same mode order (allModes order). Zip by index.
 *
 * @param tuning   - The `TuningSystem` to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per modal rotation with all five metrics.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum(6);
 * const bundle = tuningModeComprehensiveBundle(t12, spec);
 * bundle.forEach(({ mode, entropy, diversity }) => console.log(mode.id, entropy, diversity));
 */
export function tuningModeComprehensiveBundle(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz = 440,
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
}[] {
  const comparison = tuningModeComparison(tuning, spectrum, rootHz);
  const intervalProfiles = tuningModeIntervalProfile(tuning);
  const smoothRatios = tuningModeSmoothProgressionRatios(tuning, rootHz, spectrum);
  return comparison.map((c, i) => ({
    mode: c.mode,
    entropy: c.entropy,
    consistency: c.consistency,
    volatility: c.volatility,
    diversity: intervalProfiles[i]?.diversity ?? 0,
    smoothnessRatio: smoothRatios[i]?.smoothnessRatio ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Q416 — tuningFamilyModeComprehensiveBundles
// ---------------------------------------------------------------------------

/**
 * Compute comprehensive five-metric mode bundles for every tuning in a family in one call.
 *
 * Socratic Q416: "If I can get comprehensive mode bundle for one tuning, can I do it for a whole
 * family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `{id: t.id, modeBundles: tuningModeComprehensiveBundle(t, spectrum, rootHz)}`.
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and per-mode comprehensive bundles.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyModeComprehensiveBundles([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, modeBundles }) => console.log(id, modeBundles.length));
 */
export function tuningFamilyModeComprehensiveBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  modeBundles: {
    mode: Scale;
    entropy: number;
    consistency: number;
    volatility: number;
    diversity: number;
    smoothnessRatio: number;
  }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    modeBundles:
      rootHz !== undefined
        ? tuningModeComprehensiveBundle(t, spectrum, rootHz)
        : tuningModeComprehensiveBundle(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q417 — tuningBestModeComprehensive
// ---------------------------------------------------------------------------

/**
 * Find the single best mode of a tuning by a combined score of five metrics in one call.
 *
 * Socratic Q417: "If I have five metrics per mode, can I rank them by a combined score and find
 * the single best mode?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz)` → per-mode five-metric bundles.
 * 2. For each entry compute `score = entropy + consistency + (1 - volatility) + diversity + smoothnessRatio`.
 *    Volatility is subtracted (lower is better); other metrics are additive (higher is better).
 * 3. Return the entry with the highest score.
 *
 * @param tuning   - The `TuningSystem` to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns The best-mode entry extended with a `score` field.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const result = tuningBestModeComprehensive(t12, harmonicSpectrum(6));
 * console.log(result.mode.id, result.score);
 */
export function tuningBestModeComprehensive(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
  score: number;
} {
  const bundles =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  if (bundles.length === 0) {
    throw new RangeError('tuningBestModeComprehensive: tuning has no modes');
  }
  let best = bundles[0]!;
  let bestScore =
    best.entropy + best.consistency + (1 - best.volatility) + best.diversity + best.smoothnessRatio;
  for (let i = 1; i < bundles.length; i++) {
    const b = bundles[i]!;
    const score = b.entropy + b.consistency + (1 - b.volatility) + b.diversity + b.smoothnessRatio;
    if (score > bestScore) {
      best = b;
      bestScore = score;
    }
  }
  return { ...best, score: bestScore };
}

// ---------------------------------------------------------------------------
// Q419 — tuningFamilyBestModeComprehensive
// ---------------------------------------------------------------------------

/**
 * Find the best comprehensive mode for every tuning in a family in one call.
 *
 * Socratic Q419: "If I can find the best comprehensive mode for one tuning, can I do it for a
 * whole family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `{id: t.id, bestMode: tuningBestModeComprehensive(t, spectrum, rootHz)}`.
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and the best-mode result.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyBestModeComprehensive([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, bestMode }) => console.log(id, bestMode.score));
 */
export function tuningFamilyBestModeComprehensive(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  bestMode: {
    mode: Scale;
    entropy: number;
    consistency: number;
    volatility: number;
    diversity: number;
    smoothnessRatio: number;
    score: number;
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    bestMode:
      rootHz !== undefined
        ? tuningBestModeComprehensive(t, spectrum, rootHz)
        : tuningBestModeComprehensive(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q420 — tuningModeScoreRanking
// ---------------------------------------------------------------------------

/**
 * Rank all modal rotations of a tuning by comprehensive five-metric score in one call.
 *
 * Socratic Q420: "If I can compute comprehensive mode bundles with scores, can I get modes ranked
 * by score in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz)` → per-mode five-metric bundles.
 * 2. For each entry compute `score = entropy + consistency + (1 - volatility) + diversity + smoothnessRatio`.
 * 3. Sort descending by score.
 * 4. Return `{mode, score}[]`.
 *
 * @param tuning   - The `TuningSystem` to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns All modal rotations sorted by combined score descending.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum(6);
 * const ranking = tuningModeScoreRanking(t12, spec);
 * ranking.forEach(({ mode, score }) => console.log(mode.id, score));
 */
export function tuningModeScoreRanking(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; score: number }[] {
  const bundles =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  return bundles
    .map((b) => ({
      mode: b.mode,
      score: b.entropy + b.consistency + (1 - b.volatility) + b.diversity + b.smoothnessRatio,
    }))
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Q422 — tuningFamilyModeScoreRankings
// ---------------------------------------------------------------------------

/**
 * Rank modal rotations by comprehensive score for every tuning in a family in one call.
 *
 * Socratic Q422: "If I can rank modes for one tuning, can I rank them for all tunings in a
 * family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `{id: t.id, modeRanking: tuningModeScoreRanking(t, spectrum, rootHz)}`.
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and modes sorted by score descending.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyModeScoreRankings([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, modeRanking }) => console.log(id, modeRanking[0]?.score));
 */
export function tuningFamilyModeScoreRankings(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; modeRanking: { mode: Scale; score: number }[] }[] {
  return tunings.map((t) => ({
    id: t.id,
    modeRanking:
      rootHz !== undefined
        ? tuningModeScoreRanking(t, spectrum, rootHz)
        : tuningModeScoreRanking(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q423 — tuningModeComprehensiveTop
// ---------------------------------------------------------------------------

/**
 * Return the top N modes of a tuning ranked by comprehensive five-metric score in one call.
 *
 * Socratic Q423: "If I can rank modes by comprehensive score, can I get the top N in one call?"
 * → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz)` → per-mode five-metric bundles.
 * 2. For each entry compute `score = entropy + consistency + (1 - volatility) + diversity + smoothnessRatio`.
 * 3. Sort descending by score.
 * 4. Take the first `n` entries.
 *
 * @param tuning   - The `TuningSystem` to analyse.
 * @param n        - Number of top modes to return (must be positive).
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Top `n` modal rotations sorted by combined score descending, each with all five metrics
 *          and the combined score.
 *
 * @throws {RangeError} if `n` is not positive.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum(6);
 * const top3 = tuningModeComprehensiveTop(t12, 3, spec);
 * top3.forEach(({ mode, score }) => console.log(mode.id, score));
 */
export function tuningModeComprehensiveTop(
  tuning: TuningSystem,
  n: number,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
  score: number;
}[] {
  if (n <= 0) {
    throw new RangeError('tuningModeComprehensiveTop: n must be positive');
  }
  const bundles =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  return bundles
    .map((b) => ({
      ...b,
      score: b.entropy + b.consistency + (1 - b.volatility) + b.diversity + b.smoothnessRatio,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Q424 — tuningIntervalDiversityVsEntropy
// ---------------------------------------------------------------------------

/**
 * Compare interval diversity and entropy per mode and classify their alignment in one call.
 *
 * Socratic Q424: "If I have both diversity and entropy per mode, can I classify whether they align
 * or oppose each other?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeIntervalProfile(tuning)` → diversity per mode (allModes order).
 * 2. `tuningEntropyProfile(tuning, spectrum, rootHz)` → entropy per mode (allModes order).
 * 3. Zip by index. Normalize both arrays to [0,1] using min-max normalization.
 * 4. For each mode classify: if `Math.abs(normDiv - normEnt) < 0.25` → 'aligned';
 *    if `Math.abs(normDiv - normEnt) > 0.5` → 'opposed'; else → 'neutral'.
 *
 * @param tuning   - The `TuningSystem` to analyse.
 * @param spectrum - Optional instrument spectrum for entropy computation.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per modal rotation with diversity, entropy, and correlation classification.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const result = tuningIntervalDiversityVsEntropy(t12);
 * result.forEach(({ mode, diversity, entropy, correlation }) =>
 *   console.log(mode.id, diversity, entropy, correlation));
 */
export function tuningIntervalDiversityVsEntropy(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  diversity: number;
  entropy: number;
  correlation: 'aligned' | 'opposed' | 'neutral';
}[] {
  const intervalProfiles = tuningModeIntervalProfile(tuning);
  const entropyProfiles =
    spectrum !== undefined
      ? rootHz !== undefined
        ? tuningEntropyProfile(tuning, spectrum, rootHz)
        : tuningEntropyProfile(tuning, spectrum)
      : tuningEntropyProfile(tuning);

  const diversities = intervalProfiles.map((p) => p.diversity);
  const entropies = entropyProfiles.map((p) => p.entropy);

  function normalizeArr(arr: number[]): number[] {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min;
    if (range === 0) return arr.map(() => 0.5);
    return arr.map((v) => (v - min) / range);
  }

  const normDiversities = normalizeArr(diversities);
  const normEntropies = normalizeArr(entropies);

  return intervalProfiles.map((p, i) => {
    const normDiv = normDiversities[i] ?? 0.5;
    const normEnt = normEntropies[i] ?? 0.5;
    const diff = Math.abs(normDiv - normEnt);
    const correlation: 'aligned' | 'opposed' | 'neutral' =
      diff < 0.25 ? 'aligned' : diff > 0.5 ? 'opposed' : 'neutral';
    return {
      mode: p.mode,
      diversity: p.diversity,
      entropy: entropyProfiles[i]?.entropy ?? 0,
      correlation,
    };
  });
}

// ---------------------------------------------------------------------------
// Q426 — tuningModeParetoFront
// ---------------------------------------------------------------------------

/**
 * Find the Pareto-optimal modes of a tuning across five metrics in one call.
 *
 * Socratic Q426: "If I have 5 metrics per mode, can I find the Pareto-optimal modes (no other
 * mode dominates on all metrics) in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz)` → per-mode five-metric bundles.
 * 2. For each mode, check whether any other mode dominates it.
 *    Dominance: mode B dominates mode A if B is at least as good on all metrics and strictly
 *    better on at least one. Higher is better for entropy, consistency, diversity, smoothnessRatio;
 *    lower is better for volatility.
 * 3. Return modes not dominated by any other.
 *
 * @param tuning   - The `TuningSystem` to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Pareto-optimal modal rotations, each with all five metrics.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum(6);
 * const front = tuningModeParetoFront(t12, spec);
 * front.forEach(({ mode }) => console.log(mode.id));
 */
export function tuningModeParetoFront(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
}[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  return bundle.filter(
    (a) =>
      !bundle.some((b) => {
        // b dominates a if b is at least as good on all metrics and strictly better on one
        const bDomA =
          b.entropy >= a.entropy &&
          b.consistency >= a.consistency &&
          b.volatility <= a.volatility &&
          b.diversity >= a.diversity &&
          b.smoothnessRatio >= a.smoothnessRatio &&
          (b.entropy > a.entropy ||
            b.consistency > a.consistency ||
            b.volatility < a.volatility ||
            b.diversity > a.diversity ||
            b.smoothnessRatio > a.smoothnessRatio);
        return bDomA;
      }),
  );
}

// ---------------------------------------------------------------------------
// Q428 — tuningFamilyModeParetoFronts
// ---------------------------------------------------------------------------

/**
 * Find Pareto-optimal modes for every tuning in a family in one call.
 *
 * Socratic Q428: "If I can find the Pareto front for one tuning, can I do it for all tunings in a
 * family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning: `{id: t.id, paretoFront: tuningModeParetoFront(t, spectrum, rootHz)}`.
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and Pareto-optimal modes.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyModeParetoFronts([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, paretoFront }) => console.log(id, paretoFront.length));
 */
export function tuningFamilyModeParetoFronts(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  paretoFront: {
    mode: Scale;
    entropy: number;
    consistency: number;
    volatility: number;
    diversity: number;
    smoothnessRatio: number;
  }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    paretoFront:
      rootHz !== undefined
        ? tuningModeParetoFront(t, spectrum, rootHz)
        : tuningModeParetoFront(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Pearson correlation helper (unexported)
// ---------------------------------------------------------------------------

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = (x[i] ?? 0) - mx;
    const dy = (y[i] ?? 0) - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

// ---------------------------------------------------------------------------
// Q429 — tuningModeCorrelationMatrix
// ---------------------------------------------------------------------------

/**
 * Compute the Pearson correlation matrix between the five per-mode metrics in one call.
 *
 * Socratic Q429: "If I have 5 metrics per mode, can I compute the correlation matrix between
 * them?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz)` → per-mode five-metric bundles.
 * 2. Extract five arrays (one per metric).
 * 3. Compute pairwise Pearson correlations. If either vector has zero standard deviation,
 *    correlation is 0.
 *
 * @param tuning   - The `TuningSystem` to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{metrics, matrix}` where `metrics` is the ordered metric names and `matrix` is a 5×5
 *          symmetric correlation matrix with diagonal ≈ 1.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const spec = harmonicSpectrum(6);
 * const { metrics, matrix } = tuningModeCorrelationMatrix(t12, spec);
 * console.log(metrics, matrix[0]);
 */
export function tuningModeCorrelationMatrix(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { metrics: string[]; matrix: number[][] } {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  const metrics = ['entropy', 'consistency', 'volatility', 'diversity', 'smoothnessRatio'] as const;
  const vecs = metrics.map((m) => bundle.map((b) => b[m]));
  const matrix = metrics.map((_, i) =>
    metrics.map((_, j) => pearsonCorrelation(vecs[i] ?? [], vecs[j] ?? [])),
  );
  return { metrics: [...metrics], matrix };
}

// ---------------------------------------------------------------------------
// Q431 — tuningFamilyModeCorrelationMatrices
// ---------------------------------------------------------------------------

/**
 * Compute the five-metric correlation matrix for every tuning in a family in one call.
 *
 * Socratic Q431: "If I can compute the mode correlation matrix for one tuning, can I do it for
 * all tunings in a family?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning:
 *    `{id: t.id, correlationMatrix: tuningModeCorrelationMatrix(t, spectrum, rootHz)}`.
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and correlation matrix.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyModeCorrelationMatrices([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, correlationMatrix }) => console.log(id, correlationMatrix.metrics));
 */
export function tuningFamilyModeCorrelationMatrices(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; correlationMatrix: { metrics: string[]; matrix: number[][] } }[] {
  return tunings.map((t) => ({
    id: t.id,
    correlationMatrix:
      rootHz !== undefined
        ? tuningModeCorrelationMatrix(t, spectrum, rootHz)
        : tuningModeCorrelationMatrix(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q432 — tuningParetoFrontBestMode
// ---------------------------------------------------------------------------

/**
 * Pick the single best mode from the Pareto front using a composite score.
 *
 * Socratic Q432: "If I can find the Pareto front, can I pick the single best mode from it using
 * the composite score?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeParetoFront(tuning, spectrum, rootHz)` → Pareto front.
 * 2. Compute composite score for each:
 *    `score = entropy + consistency + (1 - Math.min(1, volatility)) + diversity + Math.min(1, smoothnessRatio)`
 * 3. Return the mode with the highest score (ties: first one).
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns The best Pareto-front mode with all five metrics and composite score.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const best = tuningParetoFrontBestMode(equalTemperament12(440), spec);
 * console.log(best.mode.id, best.score);
 */
export function tuningParetoFrontBestMode(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
  score: number;
} {
  const front =
    rootHz !== undefined
      ? tuningModeParetoFront(tuning, spectrum, rootHz)
      : tuningModeParetoFront(tuning, spectrum);
  let best = front[0];
  if (best === undefined) {
    throw new RangeError('tuningParetoFrontBestMode: Pareto front is empty');
  }
  const scoreOf = (e: {
    entropy: number;
    consistency: number;
    volatility: number;
    diversity: number;
    smoothnessRatio: number;
  }) =>
    e.entropy +
    e.consistency +
    (1 - Math.min(1, e.volatility)) +
    e.diversity +
    Math.min(1, e.smoothnessRatio);
  let bestScore = scoreOf(best);
  for (let i = 1; i < front.length; i++) {
    const candidate = front[i]!;
    const s = scoreOf(candidate);
    if (s > bestScore) {
      best = candidate;
      bestScore = s;
    }
  }
  return { ...best, score: bestScore };
}

// ---------------------------------------------------------------------------
// Q434 — tuningModeTopCorrelation
// ---------------------------------------------------------------------------

/**
 * Find the metric pair with the highest positive Pearson r in the 5×5 correlation matrix.
 *
 * Socratic Q434: "If I have the 5×5 correlation matrix, can I find the metric pair with the
 * highest positive Pearson r?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeCorrelationMatrix(tuning, spectrum, rootHz)` → `{metrics, matrix}`.
 * 2. Iterate all off-diagonal pairs `(i, j)` with `i < j`; find the pair with the largest
 *    `matrix[i][j]`.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{metricA, metricB, correlation}` for the most positively correlated pair.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { metricA, metricB, correlation } = tuningModeTopCorrelation(equalTemperament12(440), spec);
 * console.log(metricA, metricB, correlation);
 */
export function tuningModeTopCorrelation(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { metricA: string; metricB: string; correlation: number } {
  const { metrics, matrix } =
    rootHz !== undefined
      ? tuningModeCorrelationMatrix(tuning, spectrum, rootHz)
      : tuningModeCorrelationMatrix(tuning, spectrum);
  let bestI = 0;
  let bestJ = 1;
  let bestVal = -Infinity;
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const val = matrix[i]?.[j] ?? -Infinity;
      if (val > bestVal) {
        bestVal = val;
        bestI = i;
        bestJ = j;
      }
    }
  }
  return {
    metricA: metrics[bestI] ?? '',
    metricB: metrics[bestJ] ?? '',
    correlation: bestVal,
  };
}

// ---------------------------------------------------------------------------
// Q435 — tuningModeAntiCorrelation
// ---------------------------------------------------------------------------

/**
 * Find the metric pair with the strongest negative Pearson r in the 5×5 correlation matrix.
 *
 * Socratic Q435: "If I have the 5×5 correlation matrix, can I find the metric pair with the
 * strongest negative Pearson r?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeCorrelationMatrix(tuning, spectrum, rootHz)` → `{metrics, matrix}`.
 * 2. Iterate all off-diagonal pairs `(i, j)` with `i < j`; find the pair with the smallest
 *    (most negative) `matrix[i][j]`.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{metricA, metricB, correlation}` for the most negatively correlated pair.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { metricA, metricB, correlation } = tuningModeAntiCorrelation(equalTemperament12(440), spec);
 * console.log(metricA, metricB, correlation);
 */
export function tuningModeAntiCorrelation(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { metricA: string; metricB: string; correlation: number } {
  const { metrics, matrix } =
    rootHz !== undefined
      ? tuningModeCorrelationMatrix(tuning, spectrum, rootHz)
      : tuningModeCorrelationMatrix(tuning, spectrum);
  let bestI = 0;
  let bestJ = 1;
  let bestVal = Infinity;
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const val = matrix[i]?.[j] ?? Infinity;
      if (val < bestVal) {
        bestVal = val;
        bestI = i;
        bestJ = j;
      }
    }
  }
  return {
    metricA: metrics[bestI] ?? '',
    metricB: metrics[bestJ] ?? '',
    correlation: bestVal,
  };
}

// ---------------------------------------------------------------------------
// Q438 — tuningFamilyTopCorrelations
// ---------------------------------------------------------------------------

/**
 * Find the top metric correlation for every tuning in a family in one call.
 *
 * Socratic Q438: "If I can find the top metric correlation for one tuning, can I find it for all
 * tunings in a family?" → No → implement.
 *
 * Algorithm:
 * `tunings.map(t => ({id: t.id, topCorrelation: tuningModeTopCorrelation(t, spectrum, rootHz?)}))`
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and top metric correlation.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyTopCorrelations([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, topCorrelation }) => console.log(id, topCorrelation.correlation));
 */
export function tuningFamilyTopCorrelations(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; topCorrelation: { metricA: string; metricB: string; correlation: number } }[] {
  return tunings.map((t) => ({
    id: t.id,
    topCorrelation:
      rootHz !== undefined
        ? tuningModeTopCorrelation(t, spectrum, rootHz)
        : tuningModeTopCorrelation(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q440 — tuningFamilyAntiCorrelations
// ---------------------------------------------------------------------------

/**
 * Find the anti-correlation for every tuning in a family in one call.
 *
 * Socratic Q440: "If I can find the anti-correlation for one tuning, can I find it for all tunings
 * in a family?" → No → implement.
 *
 * Algorithm:
 * `tunings.map(t => ({id: t.id, antiCorrelation: tuningModeAntiCorrelation(t, spectrum, rootHz?)}))`
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and most negatively correlated metric pair.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyAntiCorrelations([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, antiCorrelation }) => console.log(id, antiCorrelation.correlation));
 */
export function tuningFamilyAntiCorrelations(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; antiCorrelation: { metricA: string; metricB: string; correlation: number } }[] {
  return tunings.map((t) => ({
    id: t.id,
    antiCorrelation:
      rootHz !== undefined
        ? tuningModeAntiCorrelation(t, spectrum, rootHz)
        : tuningModeAntiCorrelation(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q441 — tuningParetoFrontSummary
// ---------------------------------------------------------------------------

/**
 * Compute a statistical summary of the Pareto front for a tuning.
 *
 * Socratic Q441: "If I have the Pareto front, can I compute a summary of it — size and
 * mean/min/max of each metric?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeParetoFront(tuning, spectrum, rootHz?)` → front.
 * 2. Compute `{mean, min, max}` for each of the 5 metrics over all Pareto-front entries.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Summary including `paretoSize` and per-metric `{mean, min, max}` objects.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const summary = tuningParetoFrontSummary(equalTemperament12(440), spec);
 * console.log(summary.paretoSize, summary.entropy.mean);
 */
export function tuningParetoFrontSummary(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  paretoSize: number;
  entropy: { mean: number; min: number; max: number };
  consistency: { mean: number; min: number; max: number };
  volatility: { mean: number; min: number; max: number };
  diversity: { mean: number; min: number; max: number };
  smoothnessRatio: { mean: number; min: number; max: number };
} {
  const front =
    rootHz !== undefined
      ? tuningModeParetoFront(tuning, spectrum, rootHz)
      : tuningModeParetoFront(tuning, spectrum);

  function summarise(vals: number[]): { mean: number; min: number; max: number } {
    if (vals.length === 0) return { mean: 0, min: 0, max: 0 };
    let sum = 0;
    let mn = vals[0] ?? 0;
    let mx = vals[0] ?? 0;
    for (const v of vals) {
      sum += v;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    return { mean: sum / vals.length, min: mn, max: mx };
  }

  return {
    paretoSize: front.length,
    entropy: summarise(front.map((e) => e.entropy)),
    consistency: summarise(front.map((e) => e.consistency)),
    volatility: summarise(front.map((e) => e.volatility)),
    diversity: summarise(front.map((e) => e.diversity)),
    smoothnessRatio: summarise(front.map((e) => e.smoothnessRatio)),
  };
}

// ---------------------------------------------------------------------------
// Q442 — tuningFamilyParetoFrontSummaries
// ---------------------------------------------------------------------------

/**
 * Summarise the Pareto front for every tuning in a family in one call.
 *
 * Socratic Q442: "If I can summarize the Pareto front for one tuning, can I do it for a whole
 * family?" → No → implement.
 *
 * Algorithm:
 * `tunings.map(t => ({id: t.id, summary: tuningParetoFrontSummary(t, spectrum, rootHz?)}))`
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and Pareto-front summary.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyParetoFrontSummaries([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, summary }) => console.log(id, summary.paretoSize));
 */
export function tuningFamilyParetoFrontSummaries(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  summary: {
    paretoSize: number;
    entropy: { mean: number; min: number; max: number };
    consistency: { mean: number; min: number; max: number };
    volatility: { mean: number; min: number; max: number };
    diversity: { mean: number; min: number; max: number };
    smoothnessRatio: { mean: number; min: number; max: number };
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    summary:
      rootHz !== undefined
        ? tuningParetoFrontSummary(t, spectrum, rootHz)
        : tuningParetoFrontSummary(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q444 — tuningParetoFrontVsRanking
// ---------------------------------------------------------------------------

/**
 * Annotate the score ranking with Pareto-front membership.
 *
 * Socratic Q444: "If I have the Pareto front AND the score ranking, can I see which ranked modes
 * are in the Pareto front?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeParetoFront(tuning, spectrum, rootHz?)` → front
 * 2. `tuningModeScoreRanking(tuning, spectrum, rootHz?)` → ranking
 * 3. Build a Set of mode ids in the front
 * 4. Return the ranking annotated with `inParetoFront: boolean`
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns The score ranking annotated with `inParetoFront: boolean`, in score-descending order.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningParetoFrontVsRanking(equalTemperament12(440), spec);
 * results.forEach(({ mode, score, inParetoFront }) => console.log(mode.id, score, inParetoFront));
 */
export function tuningParetoFrontVsRanking(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; score: number; inParetoFront: boolean }[] {
  const front =
    rootHz !== undefined
      ? tuningModeParetoFront(tuning, spectrum, rootHz)
      : tuningModeParetoFront(tuning, spectrum);
  const ranking =
    rootHz !== undefined
      ? tuningModeScoreRanking(tuning, spectrum, rootHz)
      : tuningModeScoreRanking(tuning, spectrum);
  const frontIds = new Set(front.map((f) => f.mode.id));
  return ranking.map((r) => ({
    mode: r.mode,
    score: r.score,
    inParetoFront: frontIds.has(r.mode.id),
  }));
}

// ---------------------------------------------------------------------------
// Q445 — tuningParetoFrontRankPosition
// ---------------------------------------------------------------------------

/**
 * Extract the rank positions (1-based) of Pareto-optimal modes from the score ranking.
 *
 * Socratic Q445: "If I know which ranked modes are in the Pareto front, can I extract the rank
 * positions (1-based) of the Pareto modes?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningParetoFrontVsRanking(tuning, spectrum, rootHz?)` → annotated ranking
 * 2. Return only entries where `inParetoFront === true`, each augmented with `rank` (1-based)
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Pareto-front modes with their 1-based rank positions.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const ranked = tuningParetoFrontRankPosition(equalTemperament12(440), spec);
 * ranked.forEach(({ mode, score, rank }) => console.log(rank, mode.id, score));
 */
export function tuningParetoFrontRankPosition(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; score: number; rank: number }[] {
  const annotated =
    rootHz !== undefined
      ? tuningParetoFrontVsRanking(tuning, spectrum, rootHz)
      : tuningParetoFrontVsRanking(tuning, spectrum);
  const result: { mode: Scale; score: number; rank: number }[] = [];
  for (let i = 0; i < annotated.length; i++) {
    const entry = annotated[i];
    if (entry !== undefined && entry.inParetoFront) {
      result.push({ mode: entry.mode, score: entry.score, rank: i + 1 });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Q446 — tuningBestParetoRankedMode
// ---------------------------------------------------------------------------

/**
 * Pick the Pareto-optimal mode with the best (lowest) rank in the score ranking.
 *
 * Socratic Q446: "If I know the rank positions of Pareto modes, can I pick the one with the best
 * (lowest) rank?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningParetoFrontRankPosition(tuning, spectrum, rootHz?)` → ranked Pareto modes
 * 2. Return the entry with the lowest `rank` (i.e., highest score), or throw if list is empty
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns The Pareto mode with rank 1 (or lowest available rank).
 * @throws {RangeError} If no Pareto modes exist.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const best = tuningBestParetoRankedMode(equalTemperament12(440), spec);
 * console.log(best.mode.id, best.rank);
 */
export function tuningBestParetoRankedMode(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; score: number; rank: number } {
  const ranked =
    rootHz !== undefined
      ? tuningParetoFrontRankPosition(tuning, spectrum, rootHz)
      : tuningParetoFrontRankPosition(tuning, spectrum);
  if (ranked.length === 0) {
    throw new RangeError('tuningBestParetoRankedMode: no Pareto modes found');
  }
  let best = ranked[0]!;
  for (let i = 1; i < ranked.length; i++) {
    const entry = ranked[i]!;
    if (entry.rank < best.rank) {
      best = entry;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Q447 — tuningFamilyParetoRankPositions
// ---------------------------------------------------------------------------

/**
 * Get rank positions of Pareto-optimal modes for every tuning in a family.
 *
 * Socratic Q447: "If I can get rank positions for one tuning, can I do it for a whole family?"
 * → No → implement.
 *
 * Algorithm: `tunings.map(t => ({id: t.id, paretoRanks: tuningParetoFrontRankPosition(t, ...)}))`
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and Pareto modes ranked.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyParetoRankPositions([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, paretoRanks }) => console.log(id, paretoRanks[0]?.rank));
 */
export function tuningFamilyParetoRankPositions(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; paretoRanks: { mode: Scale; score: number; rank: number }[] }[] {
  return tunings.map((t) => ({
    id: t.id,
    paretoRanks:
      rootHz !== undefined
        ? tuningParetoFrontRankPosition(t, spectrum, rootHz)
        : tuningParetoFrontRankPosition(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q450 — tuningParetoFrontGap
// ---------------------------------------------------------------------------

/**
 * Find the largest gap between consecutive Pareto-optimal ranks in the score ranking.
 *
 * Socratic Q450: "If I know the rank positions of Pareto modes, can I find the largest gap between
 * consecutive ranks (i.e., how many non-Pareto modes separate consecutive Pareto modes in the ranking)?"
 *
 * Algorithm:
 * 1. `tuningParetoFrontRankPosition(tuning, spectrum, rootHz?)` → sorted by rank (ascending)
 * 2. Compute gaps between consecutive ranks: `gap[i] = ranks[i+1] - ranks[i] - 1`
 * 3. Return `{maxGap, gaps, paretoRanks}`
 *
 * @param tuning   - The tuning system to evaluate.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{maxGap, gaps, paretoRanks}` describing gaps between consecutive Pareto ranks.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { maxGap, gaps, paretoRanks } = tuningParetoFrontGap(equalTemperament12(440), spec);
 * console.log('largest gap:', maxGap);
 */
export function tuningParetoFrontGap(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { maxGap: number; gaps: number[]; paretoRanks: number[] } {
  const entries =
    rootHz !== undefined
      ? tuningParetoFrontRankPosition(tuning, spectrum, rootHz)
      : tuningParetoFrontRankPosition(tuning, spectrum);
  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const paretoRanks = sorted.map((e) => e.rank);
  const gaps: number[] = [];
  for (let i = 0; i + 1 < sorted.length; i++) {
    gaps.push((sorted[i + 1]?.rank ?? 0) - (sorted[i]?.rank ?? 0) - 1);
  }
  const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
  return { maxGap, gaps, paretoRanks };
}

// ---------------------------------------------------------------------------
// Q451 — tuningParetoFrontCoverage
// ---------------------------------------------------------------------------

/**
 * Compute what fraction of the top-K modes are Pareto-optimal.
 *
 * Socratic Q451: "If I know the rank positions of Pareto modes, can I compute what fraction of the
 * top-K modes are Pareto-optimal?"
 *
 * Algorithm:
 * 1. `tuningParetoFrontRankPosition(tuning, spectrum, rootHz?)` → paretoRanks
 * 2. `tuningModeScoreRanking(tuning, spectrum, rootHz?)` → all ranked modes
 * 3. totalModes = ranking.length; paretoSize = paretoRanks.length
 * 4. topRank = max rank in paretoRanks (or 0 if empty)
 * 5. coverageInTopK = (paretoSize / topRank) if topRank > 0, else 1.0
 *
 * @param tuning   - The tuning system to evaluate.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{paretoSize, totalModes, topRank, coverageInTopK}`
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { paretoSize, coverageInTopK } = tuningParetoFrontCoverage(equalTemperament12(440), spec);
 * console.log('coverage in top-K:', coverageInTopK);
 */
export function tuningParetoFrontCoverage(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { paretoSize: number; totalModes: number; topRank: number; coverageInTopK: number } {
  const paretoEntries =
    rootHz !== undefined
      ? tuningParetoFrontRankPosition(tuning, spectrum, rootHz)
      : tuningParetoFrontRankPosition(tuning, spectrum);
  const ranking =
    rootHz !== undefined
      ? tuningModeScoreRanking(tuning, spectrum, rootHz)
      : tuningModeScoreRanking(tuning, spectrum);
  const totalModes = ranking.length;
  const paretoSize = paretoEntries.length;
  const topRank = paretoEntries.length > 0 ? Math.max(...paretoEntries.map((e) => e.rank)) : 0;
  const coverageInTopK = topRank > 0 ? paretoSize / topRank : 1.0;
  return { paretoSize, totalModes, topRank, coverageInTopK };
}

// ---------------------------------------------------------------------------
// Q452 — tuningFamilyParetoFrontCoverage
// ---------------------------------------------------------------------------

/**
 * Compute Pareto-front coverage for every tuning in a family.
 *
 * Socratic Q452: "If I can compute Pareto coverage for one tuning, can I do it for a whole family?"
 *
 * Algorithm: `tunings.map(t => ({id: t.id, coverage: tuningParetoFrontCoverage(t, spectrum, rootHz?)}))`
 *
 * @param tunings  - Array of tuning systems to evaluate.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns One entry per tuning with its id and coverage fields.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyParetoFrontCoverage([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, coverage }) => console.log(id, coverage.coverageInTopK));
 */
export function tuningFamilyParetoFrontCoverage(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  coverage: { paretoSize: number; totalModes: number; topRank: number; coverageInTopK: number };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    coverage:
      rootHz !== undefined
        ? tuningParetoFrontCoverage(t, spectrum, rootHz)
        : tuningParetoFrontCoverage(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q455 — tuningParetoSummaryComparison
// ---------------------------------------------------------------------------

/**
 * Compare Pareto-front summaries across a family to find largest/smallest fronts.
 *
 * Socratic Q455: "If I can get Pareto summaries for a family, can I compare them to find which
 * tuning has the largest Pareto front and which has the smallest?"
 *
 * Algorithm:
 * 1. `tuningFamilyParetoFrontSummaries(tunings, spectrum, rootHz?)` → `{id, summary}[]`
 * 2. Find the entry with the largest `summary.paretoSize` → `largest: {id, paretoSize}`
 * 3. Find the entry with the smallest `summary.paretoSize` → `smallest: {id, paretoSize}`
 * 4. Compute mean paretoSize across all tunings
 * 5. Return `{largest, smallest, meanParetoSize, summaries}` sorted descending by paretoSize
 *
 * @param tunings  - Array of tuning systems to compare.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Comparison object with largest, smallest, meanParetoSize, and sorted summaries.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { largest, smallest } = tuningParetoSummaryComparison([equalTemperament12(440), edo(19, 440)], spec);
 * console.log('largest Pareto front:', largest.id, largest.paretoSize);
 */
export function tuningParetoSummaryComparison(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  largest: { id: string; paretoSize: number };
  smallest: { id: string; paretoSize: number };
  meanParetoSize: number;
  summaries: { id: string; paretoSize: number }[];
} {
  const raw =
    rootHz !== undefined
      ? tuningFamilyParetoFrontSummaries(tunings, spectrum, rootHz)
      : tuningFamilyParetoFrontSummaries(tunings, spectrum);
  const flat = raw.map((e) => ({ id: e.id, paretoSize: e.summary.paretoSize }));
  const sorted = [...flat].sort((a, b) => b.paretoSize - a.paretoSize);
  const largestEntry = sorted[0] ?? { id: '', paretoSize: 0 };
  const smallestEntry = sorted[sorted.length - 1] ?? { id: '', paretoSize: 0 };
  const meanParetoSize =
    flat.length > 0 ? flat.reduce((sum, e) => sum + e.paretoSize, 0) / flat.length : 0;
  return {
    largest: { id: largestEntry.id, paretoSize: largestEntry.paretoSize },
    smallest: { id: smallestEntry.id, paretoSize: smallestEntry.paretoSize },
    meanParetoSize,
    summaries: sorted,
  };
}

// ---------------------------------------------------------------------------
// Q456 — tuningCorrelationMatrixNarrative
// ---------------------------------------------------------------------------

/**
 * Produce a human-readable narrative about metric relationships from the correlation matrix.
 *
 * Socratic Q456: "If I have the 5×5 correlation matrix and the top/anti-correlation pairs,
 * can I produce a human-readable narrative about the metric relationships?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeTopCorrelation` → top (strongest positive).
 * 2. `tuningModeAntiCorrelation` → anti (strongest negative).
 * 3. `tuningModeCorrelationMatrix` → `{metrics, matrix}`.
 * 4. Count off-diagonal pairs with |r| > 0.5.
 * 5. Build narrative string.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{narrative, topCorrelation, antiCorrelation, strongPairCount}`.
 */
export function tuningCorrelationMatrixNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  narrative: string;
  topCorrelation: { metricA: string; metricB: string; correlation: number };
  antiCorrelation: { metricA: string; metricB: string; correlation: number };
  strongPairCount: number;
} {
  const top =
    rootHz !== undefined
      ? tuningModeTopCorrelation(tuning, spectrum, rootHz)
      : tuningModeTopCorrelation(tuning, spectrum);
  const anti =
    rootHz !== undefined
      ? tuningModeAntiCorrelation(tuning, spectrum, rootHz)
      : tuningModeAntiCorrelation(tuning, spectrum);
  const { metrics, matrix } =
    rootHz !== undefined
      ? tuningModeCorrelationMatrix(tuning, spectrum, rootHz)
      : tuningModeCorrelationMatrix(tuning, spectrum);

  let strongPairCount = 0;
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const r = matrix[i]?.[j] ?? 0;
      if (Math.abs(r) > 0.5) strongPairCount++;
    }
  }
  const totalPairs = (metrics.length * (metrics.length - 1)) / 2;

  const narrative =
    `The strongest positive correlation is between ${top.metricA} and ${top.metricB} (r=${top.correlation.toFixed(2)}). ` +
    `The strongest negative correlation is between ${anti.metricA} and ${anti.metricB} (r=${anti.correlation.toFixed(2)}). ` +
    `${strongPairCount} of ${totalPairs} metric pairs show strong correlation (|r| > 0.5).`;

  return { narrative, topCorrelation: top, antiCorrelation: anti, strongPairCount };
}

// ---------------------------------------------------------------------------
// Q458 — tuningFamilyCorrelationNarratives
// ---------------------------------------------------------------------------

/**
 * Produce correlation narratives for a family of tuning systems.
 *
 * Socratic Q458: "If I can produce a correlation narrative for one tuning, can I do it for a
 * whole family?" → No → implement.
 *
 * Algorithm: map each tuning to `{id, narrative: tuningCorrelationMatrixNarrative(...)}`.
 *
 * @param tunings  - Array of tuning systems to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{id, narrative}` objects.
 */
export function tuningFamilyCorrelationNarratives(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  narrative: {
    narrative: string;
    topCorrelation: { metricA: string; metricB: string; correlation: number };
    antiCorrelation: { metricA: string; metricB: string; correlation: number };
    strongPairCount: number;
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    narrative:
      rootHz !== undefined
        ? tuningCorrelationMatrixNarrative(t, spectrum, rootHz)
        : tuningCorrelationMatrixNarrative(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q459 — tuningParetoFrontNarrative
// ---------------------------------------------------------------------------

/**
 * Produce a human-readable narrative about the Pareto front analysis of a tuning.
 *
 * Socratic Q459: "If I have the Pareto front summary and the best Pareto mode, can I produce a
 * human-readable narrative about the Pareto analysis?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningParetoFrontSummary` → summary.
 * 2. `tuningParetoFrontBestMode` → bestMode.
 * 3. `tuningParetoFrontCoverage` → coverage.
 * 4. Build narrative string.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns `{narrative, paretoSize, bestMode, coverage}`.
 */
export function tuningParetoFrontNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  narrative: string;
  paretoSize: number;
  bestMode: { mode: Scale; score: number };
  coverage: {
    paretoSize: number;
    totalModes: number;
    topRank: number;
    coverageInTopK: number;
  };
} {
  const summary =
    rootHz !== undefined
      ? tuningParetoFrontSummary(tuning, spectrum, rootHz)
      : tuningParetoFrontSummary(tuning, spectrum);
  const best =
    rootHz !== undefined
      ? tuningParetoFrontBestMode(tuning, spectrum, rootHz)
      : tuningParetoFrontBestMode(tuning, spectrum);
  const coverage =
    rootHz !== undefined
      ? tuningParetoFrontCoverage(tuning, spectrum, rootHz)
      : tuningParetoFrontCoverage(tuning, spectrum);

  const narrative =
    `${summary.paretoSize} of ${coverage.totalModes} modes are Pareto-optimal ` +
    `(coverage: ${coverage.coverageInTopK.toFixed(2)} in top ${coverage.topRank} modes). ` +
    `The best Pareto mode is '${best.mode.id}' with composite score ${best.score.toFixed(2)}. ` +
    `Pareto front entropy ranges from ${summary.entropy.min.toFixed(2)} to ${summary.entropy.max.toFixed(2)} ` +
    `(mean ${summary.entropy.mean.toFixed(2)}).`;

  return {
    narrative,
    paretoSize: summary.paretoSize,
    bestMode: { mode: best.mode, score: best.score },
    coverage,
  };
}

// ---------------------------------------------------------------------------
// Q461 — tuningFamilyParetoNarratives
// ---------------------------------------------------------------------------

/**
 * Produce Pareto front narratives for a family of tuning systems.
 *
 * Socratic Q461: "If I can produce a Pareto narrative for one tuning, can I do it for a
 * whole family?" → No → implement.
 *
 * Algorithm: map each tuning to `{id, paretoNarrative: tuningParetoFrontNarrative(...)}`.
 *
 * @param tunings  - Array of tuning systems to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @returns Array of `{id, paretoNarrative}` objects.
 */
export function tuningFamilyParetoNarratives(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  paretoNarrative: {
    narrative: string;
    paretoSize: number;
    bestMode: { mode: Scale; score: number };
    coverage: {
      paretoSize: number;
      totalModes: number;
      topRank: number;
      coverageInTopK: number;
    };
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    paretoNarrative:
      rootHz !== undefined
        ? tuningParetoFrontNarrative(t, spectrum, rootHz)
        : tuningParetoFrontNarrative(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q462 — tuningFullParetoCorrelationReport
// ---------------------------------------------------------------------------

/**
 * Combine the Pareto narrative and the correlation narrative into one comprehensive report.
 *
 * Socratic Q462: "If I have the Pareto narrative AND the correlation narrative, can I combine them
 * into one complete report?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningParetoFrontNarrative(tuning, spectrum, rootHz?)` → paretoNarrative
 * 2. `tuningCorrelationMatrixNarrative(tuning, spectrum, rootHz?)` → correlationNarrative
 * 3. Combine into a return object with all fields plus combinedNarrative.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Object with paretoNarrative, correlationNarrative, and combinedNarrative.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const report = tuningFullParetoCorrelationReport(equalTemperament12(440), spec);
 * console.log(report.combinedNarrative);
 */
export function tuningFullParetoCorrelationReport(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  paretoNarrative: {
    narrative: string;
    paretoSize: number;
    bestMode: { mode: Scale; score: number };
    coverage: {
      paretoSize: number;
      totalModes: number;
      topRank: number;
      coverageInTopK: number;
    };
  };
  correlationNarrative: {
    narrative: string;
    topCorrelation: { metricA: string; metricB: string; correlation: number };
    antiCorrelation: { metricA: string; metricB: string; correlation: number };
    strongPairCount: number;
  };
  combinedNarrative: string;
} {
  const paretoNarrative =
    rootHz !== undefined
      ? tuningParetoFrontNarrative(tuning, spectrum, rootHz)
      : tuningParetoFrontNarrative(tuning, spectrum);
  const correlationNarrative =
    rootHz !== undefined
      ? tuningCorrelationMatrixNarrative(tuning, spectrum, rootHz)
      : tuningCorrelationMatrixNarrative(tuning, spectrum);
  const combinedNarrative = paretoNarrative.narrative + ' ' + correlationNarrative.narrative;
  return { paretoNarrative, correlationNarrative, combinedNarrative };
}

// ---------------------------------------------------------------------------
// Q464 — tuningFamilyFullParetoCorrelationReports
// ---------------------------------------------------------------------------

/**
 * Generate full Pareto+correlation reports for a family of tuning systems.
 *
 * Socratic Q464: "If I can generate a full report for one tuning, can I do it for a whole family?"
 * → No → implement.
 *
 * Algorithm: `tunings.map(t => ({id: t.id, report: tuningFullParetoCorrelationReport(t, spectrum, rootHz?)}))`
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and full Pareto+correlation report.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyFullParetoCorrelationReports([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, report }) => console.log(id, report.combinedNarrative));
 */
export function tuningFamilyFullParetoCorrelationReports(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  report: {
    paretoNarrative: {
      narrative: string;
      paretoSize: number;
      bestMode: { mode: Scale; score: number };
      coverage: {
        paretoSize: number;
        totalModes: number;
        topRank: number;
        coverageInTopK: number;
      };
    };
    correlationNarrative: {
      narrative: string;
      topCorrelation: { metricA: string; metricB: string; correlation: number };
      antiCorrelation: { metricA: string; metricB: string; correlation: number };
      strongPairCount: number;
    };
    combinedNarrative: string;
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    report:
      rootHz !== undefined
        ? tuningFullParetoCorrelationReport(t, spectrum, rootHz)
        : tuningFullParetoCorrelationReport(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q465 — tuningModeMetricOutliers
// ---------------------------------------------------------------------------

/**
 * Find modes that are extreme outliers on any single metric from the comprehensive bundle.
 *
 * Socratic Q465: "If I have all five metrics per mode, can I find modes that are extreme outliers
 * on any single metric?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz?)` → bundle
 * 2. For each of the 5 metrics, compute mean and stdDev across modes.
 * 3. A mode is an outlier on metric M if |value - mean| > 1.5 * stdDev.
 * 4. Return array of `{mode, metric, value, mean, stdDev, zScore}` sorted by |zScore| descending.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array of outlier entries sorted by |zScore| descending (may be empty).
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const outliers = tuningModeMetricOutliers(equalTemperament12(440), spec);
 * outliers.forEach(o => console.log(o.mode.id, o.metric, o.zScore));
 */
export function tuningModeMetricOutliers(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; metric: string; value: number; mean: number; stdDev: number; zScore: number }[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);

  const metricNames: (keyof Omit<(typeof bundle)[0], 'mode'>)[] = [
    'entropy',
    'consistency',
    'volatility',
    'diversity',
    'smoothnessRatio',
  ];

  const outliers: {
    mode: Scale;
    metric: string;
    value: number;
    mean: number;
    stdDev: number;
    zScore: number;
  }[] = [];

  for (const metric of metricNames) {
    const values = bundle.map((b) => b[metric] as number);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    if (stdDev === 0) continue;
    for (const b of bundle) {
      const value = b[metric] as number;
      const zScore = (value - mean) / stdDev;
      if (Math.abs(zScore) > 1.5) {
        outliers.push({ mode: b.mode, metric, value, mean, stdDev, zScore });
      }
    }
  }

  outliers.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  return outliers;
}

// ---------------------------------------------------------------------------
// Q467 — tuningFamilyModeMetricOutliers
// ---------------------------------------------------------------------------

/**
 * Find metric outlier modes for a family of tuning systems.
 *
 * Socratic Q467: "If I can find outlier modes for one tuning, can I do it for a whole family?"
 * → No → implement.
 *
 * Algorithm: `tunings.map(t => ({id: t.id, outliers: tuningModeMetricOutliers(t, spectrum, rootHz?)}))`
 *
 * @param tunings  - Array of `TuningSystem` objects to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and outlier entries array.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = tuningFamilyModeMetricOutliers([equalTemperament12(440), edo(19, 440)], spec);
 * results.forEach(({ id, outliers }) => console.log(id, outliers.length));
 */
export function tuningFamilyModeMetricOutliers(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  outliers: {
    mode: Scale;
    metric: string;
    value: number;
    mean: number;
    stdDev: number;
    zScore: number;
  }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    outliers:
      rootHz !== undefined
        ? tuningModeMetricOutliers(t, spectrum, rootHz)
        : tuningModeMetricOutliers(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q468 — tuningModeMetricOutlierSummary
// ---------------------------------------------------------------------------

/**
 * Summarise metric outliers for a tuning: counts by metric and by mode,
 * plus which metric and mode appear most often.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Summary object with total, byMetric, byMode, mostOutlierMetric, mostOutlierMode.
 */
export function tuningModeMetricOutlierSummary(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  totalOutliers: number;
  byMetric: Record<string, number>;
  byMode: Record<string, number>;
  mostOutlierMetric: string | null;
  mostOutlierMode: string | null;
} {
  const outliers =
    rootHz !== undefined
      ? tuningModeMetricOutliers(tuning, spectrum, rootHz)
      : tuningModeMetricOutliers(tuning, spectrum);

  const byMetric: Record<string, number> = {};
  const byMode: Record<string, number> = {};

  for (const entry of outliers) {
    byMetric[entry.metric] = (byMetric[entry.metric] ?? 0) + 1;
    const modeId = entry.mode.id;
    byMode[modeId] = (byMode[modeId] ?? 0) + 1;
  }

  let mostOutlierMetric: string | null = null;
  let maxMetricCount = 0;
  for (const [metric, count] of Object.entries(byMetric)) {
    if (count > maxMetricCount) {
      maxMetricCount = count;
      mostOutlierMetric = metric;
    }
  }

  let mostOutlierMode: string | null = null;
  let maxModeCount = 0;
  for (const [modeId, count] of Object.entries(byMode)) {
    if (count > maxModeCount) {
      maxModeCount = count;
      mostOutlierMode = modeId;
    }
  }

  return {
    totalOutliers: outliers.length,
    byMetric,
    byMode,
    mostOutlierMetric,
    mostOutlierMode,
  };
}

// ---------------------------------------------------------------------------
// Q470 — tuningFamilyModeMetricOutlierSummaries
// ---------------------------------------------------------------------------

/**
 * Produce outlier summaries for a whole family of tunings.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and outlierSummary.
 */
export function tuningFamilyModeMetricOutlierSummaries(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  outlierSummary: {
    totalOutliers: number;
    byMetric: Record<string, number>;
    byMode: Record<string, number>;
    mostOutlierMetric: string | null;
    mostOutlierMode: string | null;
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    outlierSummary:
      rootHz !== undefined
        ? tuningModeMetricOutlierSummary(t, spectrum, rootHz)
        : tuningModeMetricOutlierSummary(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q471 — tuningModeMetricProfile
// ---------------------------------------------------------------------------

/**
 * Produce a compact per-mode profile with all 5 metric stats (value, mean,
 * stdDev, zScore, isOutlier) in one call.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array of per-mode profiles with full metric statistics.
 */
export function tuningModeMetricProfile(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  metrics: {
    entropy: { value: number; mean: number; stdDev: number; zScore: number; isOutlier: boolean };
    consistency: {
      value: number;
      mean: number;
      stdDev: number;
      zScore: number;
      isOutlier: boolean;
    };
    volatility: { value: number; mean: number; stdDev: number; zScore: number; isOutlier: boolean };
    diversity: { value: number; mean: number; stdDev: number; zScore: number; isOutlier: boolean };
    smoothnessRatio: {
      value: number;
      mean: number;
      stdDev: number;
      zScore: number;
      isOutlier: boolean;
    };
  };
}[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);

  type MetricKey = 'entropy' | 'consistency' | 'volatility' | 'diversity' | 'smoothnessRatio';
  const metricKeys: MetricKey[] = [
    'entropy',
    'consistency',
    'volatility',
    'diversity',
    'smoothnessRatio',
  ];

  // Compute mean and stdDev for each metric across all modes
  const stats: Record<MetricKey, { mean: number; stdDev: number }> = {
    entropy: { mean: 0, stdDev: 0 },
    consistency: { mean: 0, stdDev: 0 },
    volatility: { mean: 0, stdDev: 0 },
    diversity: { mean: 0, stdDev: 0 },
    smoothnessRatio: { mean: 0, stdDev: 0 },
  };

  const n = bundle.length;
  if (n === 0) return [];

  for (const key of metricKeys) {
    const values = bundle.map((b) => b[key]);
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    stats[key] = { mean, stdDev: Math.sqrt(variance) };
  }

  return bundle.map((b) => {
    const buildStat = (key: MetricKey) => {
      const value = b[key];
      const { mean, stdDev } = stats[key];
      const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;
      return { value, mean, stdDev, zScore, isOutlier: Math.abs(zScore) > 1.5 };
    };

    return {
      mode: b.mode,
      metrics: {
        entropy: buildStat('entropy'),
        consistency: buildStat('consistency'),
        volatility: buildStat('volatility'),
        diversity: buildStat('diversity'),
        smoothnessRatio: buildStat('smoothnessRatio'),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Q473 — tuningFamilyModeMetricProfiles
// ---------------------------------------------------------------------------

/**
 * Produce mode metric profiles for a whole family of tunings.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and modeProfiles array.
 */
export function tuningFamilyModeMetricProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  modeProfiles: ReturnType<typeof tuningModeMetricProfile>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    modeProfiles:
      rootHz !== undefined
        ? tuningModeMetricProfile(t, spectrum, rootHz)
        : tuningModeMetricProfile(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q474 — tuningModeMetricRadarData
// ---------------------------------------------------------------------------

/**
 * Normalise per-mode metric values to [0,1] for radar-chart display.
 *
 * For each of the 5 metrics (entropy, consistency, volatility, diversity,
 * smoothnessRatio) the raw value is min-max normalised across all modes.
 * When all modes share the same value the normalised result is 0.5.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per mode with normalised radar values in [0,1].
 */
export function tuningModeMetricRadarData(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  radar: {
    entropy: number;
    consistency: number;
    volatility: number;
    diversity: number;
    smoothnessRatio: number;
  };
}[] {
  const profiles =
    rootHz !== undefined
      ? tuningModeMetricProfile(tuning, spectrum, rootHz)
      : tuningModeMetricProfile(tuning, spectrum);

  const metricKeys = [
    'entropy',
    'consistency',
    'volatility',
    'diversity',
    'smoothnessRatio',
  ] as const;

  // Collect min/max per metric across all modes
  const minMax: Record<string, { min: number; max: number }> = {};
  for (const key of metricKeys) {
    let min = Infinity;
    let max = -Infinity;
    for (const p of profiles) {
      const v = p.metrics[key].value;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    minMax[key] = { min, max };
  }

  return profiles.map((p) => {
    const radar: {
      entropy: number;
      consistency: number;
      volatility: number;
      diversity: number;
      smoothnessRatio: number;
    } = {
      entropy: 0,
      consistency: 0,
      volatility: 0,
      diversity: 0,
      smoothnessRatio: 0,
    };
    for (const key of metricKeys) {
      const { min, max } = minMax[key]!;
      const v = p.metrics[key].value;
      radar[key] = max === min ? 0.5 : (v - min) / (max - min);
    }
    return { mode: p.mode, radar };
  });
}

// ---------------------------------------------------------------------------
// Q476 — tuningFamilyModeMetricRadarData
// ---------------------------------------------------------------------------

/**
 * Produce normalised radar data for a whole family of tunings.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and radarData array.
 */
export function tuningFamilyModeMetricRadarData(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  radarData: {
    mode: Scale;
    radar: {
      entropy: number;
      consistency: number;
      volatility: number;
      diversity: number;
      smoothnessRatio: number;
    };
  }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    radarData:
      rootHz !== undefined
        ? tuningModeMetricRadarData(t, spectrum, rootHz)
        : tuningModeMetricRadarData(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q477 — tuningModeMetricCluster
// ---------------------------------------------------------------------------

/**
 * Cluster modes into High/Mid/Low buckets by their mean normalised radar value.
 *
 * Uses `tuningModeMetricRadarData` to obtain normalised values, then computes
 * the mean of the 5 metrics for each mode and assigns a cluster label:
 *   - `meanScore >= 0.67` → 'high'
 *   - `meanScore <= 0.33` → 'low'
 *   - otherwise          → 'mid'
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per mode with meanScore and cluster label.
 */
export function tuningModeMetricCluster(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; meanScore: number; cluster: 'high' | 'mid' | 'low' }[] {
  const radarData =
    rootHz !== undefined
      ? tuningModeMetricRadarData(tuning, spectrum, rootHz)
      : tuningModeMetricRadarData(tuning, spectrum);

  return radarData.map(({ mode, radar }) => {
    const meanScore =
      (radar.entropy +
        radar.consistency +
        radar.volatility +
        radar.diversity +
        radar.smoothnessRatio) /
      5;
    const cluster: 'high' | 'mid' | 'low' =
      meanScore >= 0.67 ? 'high' : meanScore <= 0.33 ? 'low' : 'mid';
    return { mode, meanScore, cluster };
  });
}

// ---------------------------------------------------------------------------
// Q479 — tuningFamilyModeMetricClusters
// ---------------------------------------------------------------------------

/**
 * Cluster modes for a whole family of tunings.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and clusters array.
 */
export function tuningFamilyModeMetricClusters(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  clusters: { mode: Scale; meanScore: number; cluster: 'high' | 'mid' | 'low' }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    clusters:
      rootHz !== undefined
        ? tuningModeMetricCluster(t, spectrum, rootHz)
        : tuningModeMetricCluster(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q480 — tuningClusterSummary
// ---------------------------------------------------------------------------

/**
 * Summarise cluster counts and list the modes in each High/Mid/Low bucket.
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns An object with highCount, midCount, lowCount, high, mid, low arrays.
 */
export function tuningClusterSummary(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  highCount: number;
  midCount: number;
  lowCount: number;
  high: Scale[];
  mid: Scale[];
  low: Scale[];
} {
  const clusters =
    rootHz !== undefined
      ? tuningModeMetricCluster(tuning, spectrum, rootHz)
      : tuningModeMetricCluster(tuning, spectrum);
  const high: Scale[] = [];
  const mid: Scale[] = [];
  const low: Scale[] = [];
  for (const entry of clusters) {
    if (entry.cluster === 'high') {
      high.push(entry.mode);
    } else if (entry.cluster === 'mid') {
      mid.push(entry.mode);
    } else {
      low.push(entry.mode);
    }
  }
  return {
    highCount: high.length,
    midCount: mid.length,
    lowCount: low.length,
    high,
    mid,
    low,
  };
}

// ---------------------------------------------------------------------------
// Q482 — tuningFamilyClusterSummaries
// ---------------------------------------------------------------------------

/**
 * Summarise clusters for each tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and clusterSummary.
 */
export function tuningFamilyClusterSummaries(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  clusterSummary: {
    highCount: number;
    midCount: number;
    lowCount: number;
    high: Scale[];
    mid: Scale[];
    low: Scale[];
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    clusterSummary:
      rootHz !== undefined
        ? tuningClusterSummary(t, spectrum, rootHz)
        : tuningClusterSummary(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q483 — tuningModeRadarRanking
// ---------------------------------------------------------------------------

/**
 * Rank modes by their mean radar score (descending).
 *
 * @param tuning   - The tuning system.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array of {mode, meanScore, rank} sorted descending by meanScore.
 */
export function tuningModeRadarRanking(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; meanScore: number; rank: number }[] {
  const radarData =
    rootHz !== undefined
      ? tuningModeMetricRadarData(tuning, spectrum, rootHz)
      : tuningModeMetricRadarData(tuning, spectrum);
  const withScores = radarData.map((entry) => {
    const r = entry.radar;
    const meanScore =
      (r.entropy + r.consistency + r.volatility + r.diversity + r.smoothnessRatio) / 5;
    return { mode: entry.mode, meanScore };
  });
  withScores.sort((a, b) => b.meanScore - a.meanScore);
  return withScores.map((entry, i) => ({
    mode: entry.mode,
    meanScore: entry.meanScore,
    rank: i + 1,
  }));
}

// ---------------------------------------------------------------------------
// Q485 — tuningFamilyModeRadarRankings
// ---------------------------------------------------------------------------

/**
 * Rank modes by radar score for each tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and radarRanking array.
 */
export function tuningFamilyModeRadarRankings(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; radarRanking: { mode: Scale; meanScore: number; rank: number }[] }[] {
  return tunings.map((t) => ({
    id: t.id,
    radarRanking:
      rootHz !== undefined
        ? tuningModeRadarRanking(t, spectrum, rootHz)
        : tuningModeRadarRanking(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------

/**
 * Compare radar ranking vs composite-score ranking for each mode in a tuning.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array ordered by radar rank with radarRank, scoreRank, and rankDelta.
 */
export function tuningRadarRankingVsScoreRanking(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; radarRank: number; scoreRank: number; rankDelta: number }[] {
  const radarRanking =
    rootHz !== undefined
      ? tuningModeRadarRanking(tuning, spectrum, rootHz)
      : tuningModeRadarRanking(tuning, spectrum);
  const scoreRanking =
    rootHz !== undefined
      ? tuningModeScoreRanking(tuning, spectrum, rootHz)
      : tuningModeScoreRanking(tuning, spectrum);

  const scoreRankMap: Record<string, number> = {};
  for (let i = 0; i < scoreRanking.length; i++) {
    const entry = scoreRanking[i];
    if (entry !== undefined) {
      scoreRankMap[entry.mode.id] = i + 1;
    }
  }

  return radarRanking.map((entry, idx) => {
    const radarRank = idx + 1;
    const scoreRank = scoreRankMap[entry.mode.id] ?? radarRanking.length;
    return {
      mode: entry.mode,
      radarRank,
      scoreRank,
      rankDelta: scoreRank - radarRank,
    };
  });
}

// ---------------------------------------------------------------------------

/**
 * Compare radar vs score rankings for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and comparison array.
 */
export function tuningFamilyRadarVsScoreRankings(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  comparison: { mode: Scale; radarRank: number; scoreRank: number; rankDelta: number }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    comparison:
      rootHz !== undefined
        ? tuningRadarRankingVsScoreRanking(t, spectrum, rootHz)
        : tuningRadarRankingVsScoreRanking(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------

/**
 * Find the mode where radar rank and score rank agree most (smallest |rankDelta|).
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns The entry with the smallest absolute rankDelta (first on tie).
 */
export function tuningBestRadarScoreAgreement(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { mode: Scale; radarRank: number; scoreRank: number; rankDelta: number } {
  const comparison =
    rootHz !== undefined
      ? tuningRadarRankingVsScoreRanking(tuning, spectrum, rootHz)
      : tuningRadarRankingVsScoreRanking(tuning, spectrum);

  let best = comparison[0];
  if (best === undefined) {
    throw new RangeError('tuningBestRadarScoreAgreement: tuning has no modes');
  }
  let bestAbs = Math.abs(best.rankDelta);
  for (let i = 1; i < comparison.length; i++) {
    const entry = comparison[i];
    if (entry !== undefined) {
      const abs = Math.abs(entry.rankDelta);
      if (abs < bestAbs) {
        best = entry;
        bestAbs = abs;
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------

/**
 * Find the best radar-score agreement mode for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and bestAgreement.
 */
export function tuningFamilyBestRadarScoreAgreements(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  bestAgreement: { mode: Scale; radarRank: number; scoreRank: number; rankDelta: number };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    bestAgreement:
      rootHz !== undefined
        ? tuningBestRadarScoreAgreement(t, spectrum, rootHz)
        : tuningBestRadarScoreAgreement(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q492 — tuningModeConsensusRanking
// ---------------------------------------------------------------------------

/**
 * Produce a Borda-count consensus ranking combining the score ranking and radar
 * ranking for all modes in a tuning.
 *
 * Borda score for each mode = (n - scoreRank + 1) + (n - radarRank + 1)
 * (higher is better). Ties are broken alphabetically by mode.id.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array sorted by bordaScore descending with 1-based consensusRank.
 */
export function tuningModeConsensusRanking(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  bordaScore: number;
  scoreRank: number;
  radarRank: number;
  consensusRank: number;
}[] {
  const scoreRanking =
    rootHz !== undefined
      ? tuningModeScoreRanking(tuning, spectrum, rootHz)
      : tuningModeScoreRanking(tuning, spectrum);
  const radarRanking =
    rootHz !== undefined
      ? tuningModeRadarRanking(tuning, spectrum, rootHz)
      : tuningModeRadarRanking(tuning, spectrum);

  const n = scoreRanking.length;

  // Build lookup maps: mode.id → rank (1-based, position in already-sorted arrays)
  const scoreRankMap = new Map<string, number>();
  scoreRanking.forEach((entry, idx) => {
    scoreRankMap.set(entry.mode.id, idx + 1);
  });

  const radarRankMap = new Map<string, number>();
  radarRanking.forEach((entry, idx) => {
    radarRankMap.set(entry.mode.id, idx + 1);
  });

  // Compute Borda scores using the score ranking as the reference mode list
  const entries = scoreRanking.map((entry) => {
    const sRank = scoreRankMap.get(entry.mode.id) ?? n;
    const rRank = radarRankMap.get(entry.mode.id) ?? n;
    const bordaScore = n - sRank + 1 + (n - rRank + 1);
    return { mode: entry.mode, bordaScore, scoreRank: sRank, radarRank: rRank };
  });

  // Sort descending by bordaScore, ties broken alphabetically by mode.id
  entries.sort((a, b) =>
    b.bordaScore !== a.bordaScore
      ? b.bordaScore - a.bordaScore
      : a.mode.id < b.mode.id
        ? -1
        : a.mode.id > b.mode.id
          ? 1
          : 0,
  );

  return entries.map((entry, idx) => ({ ...entry, consensusRank: idx + 1 }));
}

// ---------------------------------------------------------------------------
// Q494 — tuningFamilyModeConsensusRankings
// ---------------------------------------------------------------------------

/**
 * Produce Borda-count consensus rankings for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and consensusRanking.
 */
export function tuningFamilyModeConsensusRankings(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  consensusRanking: {
    mode: Scale;
    bordaScore: number;
    scoreRank: number;
    radarRank: number;
    consensusRank: number;
  }[];
}[] {
  return tunings.map((t) => ({
    id: t.id,
    consensusRanking:
      rootHz !== undefined
        ? tuningModeConsensusRanking(t, spectrum, rootHz)
        : tuningModeConsensusRanking(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q495 — tuningBestConsensusMode
// ---------------------------------------------------------------------------

/**
 * Return the top-ranked mode from the Borda-count consensus ranking.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns The entry with consensusRank === 1.
 */
export function tuningBestConsensusMode(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  bordaScore: number;
  scoreRank: number;
  radarRank: number;
  consensusRank: number;
} {
  const ranking =
    rootHz !== undefined
      ? tuningModeConsensusRanking(tuning, spectrum, rootHz)
      : tuningModeConsensusRanking(tuning, spectrum);
  return ranking[0]!;
}

// ---------------------------------------------------------------------------
// Q497 — tuningFamilyBestConsensusModes
// ---------------------------------------------------------------------------

/**
 * Return the top Borda-consensus mode for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and bestConsensusMode.
 */
export function tuningFamilyBestConsensusModes(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  bestConsensusMode: {
    mode: Scale;
    bordaScore: number;
    scoreRank: number;
    radarRank: number;
    consensusRank: number;
  };
}[] {
  return tunings.map((t) => ({
    id: t.id,
    bestConsensusMode:
      rootHz !== undefined
        ? tuningBestConsensusMode(t, spectrum, rootHz)
        : tuningBestConsensusMode(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q498 — tuningUltimateBestMode
// ---------------------------------------------------------------------------

/**
 * Determine the mode that appears as 'best' across three independent ranking
 * methods: Borda consensus, Pareto-front composite score, and Pareto ranked.
 *
 * @param tuning   - Tuning system to evaluate.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Winner mode with vote count, each method's best modeId, and
 *          whether all three methods agree.
 */
export function tuningUltimateBestMode(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  winner: { mode: Scale; voteCount: number };
  consensusBest: { modeId: string };
  paretoBest: { modeId: string };
  paretoRankedBest: { modeId: string };
  isUnanimous: boolean;
} {
  const consensusResult =
    rootHz !== undefined
      ? tuningBestConsensusMode(tuning, spectrum, rootHz)
      : tuningBestConsensusMode(tuning, spectrum);
  const paretoResult =
    rootHz !== undefined
      ? tuningParetoFrontBestMode(tuning, spectrum, rootHz)
      : tuningParetoFrontBestMode(tuning, spectrum);
  const paretoRankedResult =
    rootHz !== undefined
      ? tuningBestParetoRankedMode(tuning, spectrum, rootHz)
      : tuningBestParetoRankedMode(tuning, spectrum);

  const consensusModeId = consensusResult.mode.id;
  const paretoModeId = paretoResult.mode.id;
  const paretoRankedModeId = paretoRankedResult.mode.id;

  const votes: Record<string, number> = {};
  votes[consensusModeId] = (votes[consensusModeId] ?? 0) + 1;
  votes[paretoModeId] = (votes[paretoModeId] ?? 0) + 1;
  votes[paretoRankedModeId] = (votes[paretoRankedModeId] ?? 0) + 1;

  // Find mode with most votes; tie-break: consensusBest wins
  let winnerModeId = consensusModeId;
  let maxVotes = votes[consensusModeId] ?? 0;
  for (const [modeId, voteCount] of Object.entries(votes)) {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winnerModeId = modeId;
    }
  }

  // Retrieve Scale object from comprehensive bundle
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  const winnerEntry = bundle.find((e) => e.mode.id === winnerModeId);
  const winnerMode: Scale = winnerEntry !== undefined ? winnerEntry.mode : consensusResult.mode;

  return {
    winner: { mode: winnerMode, voteCount: maxVotes },
    consensusBest: { modeId: consensusModeId },
    paretoBest: { modeId: paretoModeId },
    paretoRankedBest: { modeId: paretoRankedModeId },
    isUnanimous: consensusModeId === paretoModeId && paretoModeId === paretoRankedModeId,
  };
}

// ---------------------------------------------------------------------------
// Q500 — tuningFamilyUltimateBestModes
// ---------------------------------------------------------------------------

/**
 * Find the ultimate best mode for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and ultimateBest result.
 */
export function tuningFamilyUltimateBestModes(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; ultimateBest: ReturnType<typeof tuningUltimateBestMode> }[] {
  return tunings.map((t) => ({
    id: t.id,
    ultimateBest:
      rootHz !== undefined
        ? tuningUltimateBestMode(t, spectrum, rootHz)
        : tuningUltimateBestMode(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q501 — tuningConsensusNarrative
// ---------------------------------------------------------------------------

/**
 * Produce a human-readable narrative summarising multi-method agreement on
 * the best mode for a tuning.
 *
 * @param tuning   - Tuning system to evaluate.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Narrative string plus the two underlying sub-results.
 */
export function tuningConsensusNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  narrative: string;
  consensusBest: {
    mode: Scale;
    bordaScore: number;
    scoreRank: number;
    radarRank: number;
    consensusRank: number;
  };
  ultimateBest: ReturnType<typeof tuningUltimateBestMode>;
} {
  const consensusBest =
    rootHz !== undefined
      ? tuningBestConsensusMode(tuning, spectrum, rootHz)
      : tuningBestConsensusMode(tuning, spectrum);
  const ultimateBest =
    rootHz !== undefined
      ? tuningUltimateBestMode(tuning, spectrum, rootHz)
      : tuningUltimateBestMode(tuning, spectrum);

  let narrative = `The Borda consensus top mode is '${consensusBest.mode.id}' (score=${consensusBest.bordaScore}). `;
  if (ultimateBest.isUnanimous) {
    narrative += 'All three ranking methods agree on this mode.';
  } else {
    narrative += `Methods agree on '${ultimateBest.winner.mode.id}' with ${ultimateBest.winner.voteCount}/3 votes.`;
  }

  return { narrative, consensusBest, ultimateBest };
}

// ---------------------------------------------------------------------------
// Q503 — tuningFamilyConsensusNarratives
// ---------------------------------------------------------------------------

/**
 * Produce a consensus narrative for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and consensusNarrative result.
 */
export function tuningFamilyConsensusNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; consensusNarrative: ReturnType<typeof tuningConsensusNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    consensusNarrative:
      rootHz !== undefined
        ? tuningConsensusNarrative(t, spectrum, rootHz)
        : tuningConsensusNarrative(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q504 — tuningMasterReport
// ---------------------------------------------------------------------------

/**
 * Combine the full Pareto+correlation report and consensus narrative into one
 * master report object.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns An object containing paretoCorrelationReport, consensusNarrative,
 *          and a combined masterNarrative string.
 */
export function tuningMasterReport(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  paretoCorrelationReport: ReturnType<typeof tuningFullParetoCorrelationReport>;
  consensusNarrative: ReturnType<typeof tuningConsensusNarrative>;
  masterNarrative: string;
} {
  const paretoCorrelationReport =
    rootHz !== undefined
      ? tuningFullParetoCorrelationReport(tuning, spectrum, rootHz)
      : tuningFullParetoCorrelationReport(tuning, spectrum);
  const consensusNarrative =
    rootHz !== undefined
      ? tuningConsensusNarrative(tuning, spectrum, rootHz)
      : tuningConsensusNarrative(tuning, spectrum);
  return {
    paretoCorrelationReport,
    consensusNarrative,
    masterNarrative: paretoCorrelationReport.combinedNarrative + ' ' + consensusNarrative.narrative,
  };
}

// ---------------------------------------------------------------------------
// Q506 — tuningFamilyMasterReports
// ---------------------------------------------------------------------------

/**
 * Produce a master report for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and masterReport result.
 */
export function tuningFamilyMasterReports(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; masterReport: ReturnType<typeof tuningMasterReport> }[] {
  return tunings.map((t) => ({
    id: t.id,
    masterReport:
      rootHz !== undefined
        ? tuningMasterReport(t, spectrum, rootHz)
        : tuningMasterReport(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q507 — tuningModeComprehensiveMetricBundle
// ---------------------------------------------------------------------------

type ModeMetricStats = {
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  isOutlier: boolean;
};

type ModeComprehensiveMetricBundleEntry = {
  mode: ReturnType<typeof tuningModeComprehensiveBundle>[number]['mode'];
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
  metricProfile: {
    entropy: ModeMetricStats;
    consistency: ModeMetricStats;
    volatility: ModeMetricStats;
    diversity: ModeMetricStats;
    smoothnessRatio: ModeMetricStats;
  };
};

/**
 * Combine the per-mode comprehensive bundle and metric profile into a single
 * array with all available per-mode data.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array of per-mode entries with raw metrics and detailed metric profiles.
 */
export function tuningModeComprehensiveMetricBundle(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): ModeComprehensiveMetricBundleEntry[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  const profiles =
    rootHz !== undefined
      ? tuningModeMetricProfile(tuning, spectrum, rootHz)
      : tuningModeMetricProfile(tuning, spectrum);

  const profileMap = new Map(profiles.map((p) => [p.mode.id, p]));

  return bundle.map((entry) => {
    const profile = profileMap.get(entry.mode.id);
    return {
      mode: entry.mode,
      entropy: entry.entropy,
      consistency: entry.consistency,
      volatility: entry.volatility,
      diversity: entry.diversity,
      smoothnessRatio: entry.smoothnessRatio,
      metricProfile: {
        entropy: {
          value: profile?.metrics.entropy.value ?? entry.entropy,
          mean: profile?.metrics.entropy.mean ?? 0,
          stdDev: profile?.metrics.entropy.stdDev ?? 0,
          zScore: profile?.metrics.entropy.zScore ?? 0,
          isOutlier: profile?.metrics.entropy.isOutlier ?? false,
        },
        consistency: {
          value: profile?.metrics.consistency.value ?? entry.consistency,
          mean: profile?.metrics.consistency.mean ?? 0,
          stdDev: profile?.metrics.consistency.stdDev ?? 0,
          zScore: profile?.metrics.consistency.zScore ?? 0,
          isOutlier: profile?.metrics.consistency.isOutlier ?? false,
        },
        volatility: {
          value: profile?.metrics.volatility.value ?? entry.volatility,
          mean: profile?.metrics.volatility.mean ?? 0,
          stdDev: profile?.metrics.volatility.stdDev ?? 0,
          zScore: profile?.metrics.volatility.zScore ?? 0,
          isOutlier: profile?.metrics.volatility.isOutlier ?? false,
        },
        diversity: {
          value: profile?.metrics.diversity.value ?? entry.diversity,
          mean: profile?.metrics.diversity.mean ?? 0,
          stdDev: profile?.metrics.diversity.stdDev ?? 0,
          zScore: profile?.metrics.diversity.zScore ?? 0,
          isOutlier: profile?.metrics.diversity.isOutlier ?? false,
        },
        smoothnessRatio: {
          value: profile?.metrics.smoothnessRatio.value ?? entry.smoothnessRatio,
          mean: profile?.metrics.smoothnessRatio.mean ?? 0,
          stdDev: profile?.metrics.smoothnessRatio.stdDev ?? 0,
          zScore: profile?.metrics.smoothnessRatio.zScore ?? 0,
          isOutlier: profile?.metrics.smoothnessRatio.isOutlier ?? false,
        },
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Q509 — tuningFamilyModeComprehensiveMetricBundles
// ---------------------------------------------------------------------------

/**
 * Produce a comprehensive metric bundle for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and modeComprehensiveMetricBundles array.
 */
export function tuningFamilyModeComprehensiveMetricBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  modeComprehensiveMetricBundles: ReturnType<typeof tuningModeComprehensiveMetricBundle>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    modeComprehensiveMetricBundles:
      rootHz !== undefined
        ? tuningModeComprehensiveMetricBundle(t, spectrum, rootHz)
        : tuningModeComprehensiveMetricBundle(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q510 — tuningModeConsensusClusterBundle
// ---------------------------------------------------------------------------

/**
 * Join the Borda consensus ranking with the High/Mid/Low cluster label for
 * each mode, producing a single per-mode bundle.
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array sorted by consensusRank (ascending) with cluster and Borda fields.
 */
export function tuningModeConsensusClusterBundle(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  bordaScore: number;
  scoreRank: number;
  radarRank: number;
  consensusRank: number;
  meanScore: number;
  cluster: 'high' | 'mid' | 'low';
}[] {
  const consensusRanking =
    rootHz !== undefined
      ? tuningModeConsensusRanking(tuning, spectrum, rootHz)
      : tuningModeConsensusRanking(tuning, spectrum);
  const clusters =
    rootHz !== undefined
      ? tuningModeMetricCluster(tuning, spectrum, rootHz)
      : tuningModeMetricCluster(tuning, spectrum);

  const clusterMap = new Map<string, { meanScore: number; cluster: 'high' | 'mid' | 'low' }>();
  for (const c of clusters) {
    clusterMap.set(c.mode.id, { meanScore: c.meanScore, cluster: c.cluster });
  }

  return consensusRanking.map((entry) => {
    const clusterEntry = clusterMap.get(entry.mode.id);
    return {
      mode: entry.mode,
      bordaScore: entry.bordaScore,
      scoreRank: entry.scoreRank,
      radarRank: entry.radarRank,
      consensusRank: entry.consensusRank,
      meanScore: clusterEntry?.meanScore ?? 0,
      cluster: clusterEntry?.cluster ?? 'mid',
    };
  });
}

// ---------------------------------------------------------------------------
// Q512 — tuningFamilyModeConsensusClusterBundles
// ---------------------------------------------------------------------------

/**
 * Produce a consensus-cluster bundle for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and consensusClusterBundle array.
 */
export function tuningFamilyModeConsensusClusterBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  consensusClusterBundle: ReturnType<typeof tuningModeConsensusClusterBundle>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    consensusClusterBundle:
      rootHz !== undefined
        ? tuningModeConsensusClusterBundle(t, spectrum, rootHz)
        : tuningModeConsensusClusterBundle(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q513 — tuningTopClusterConsensusMode
// ---------------------------------------------------------------------------

/**
 * Find the top-ranked mode that is also in the 'high' cluster.
 *
 * If no mode is in the 'high' cluster, returns the best overall consensus mode
 * (first entry in the bundle, i.e. consensusRank === 1).
 *
 * @param tuning   - The tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns The entry with the best consensusRank among 'high' cluster modes,
 *          or the top consensus mode if none qualify.
 */
export function tuningTopClusterConsensusMode(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  bordaScore: number;
  scoreRank: number;
  radarRank: number;
  consensusRank: number;
  meanScore: number;
  cluster: 'high' | 'mid' | 'low';
} {
  const bundle =
    rootHz !== undefined
      ? tuningModeConsensusClusterBundle(tuning, spectrum, rootHz)
      : tuningModeConsensusClusterBundle(tuning, spectrum);

  const highEntry = bundle.find((entry) => entry.cluster === 'high');
  return highEntry ?? bundle[0]!;
}

// ---------------------------------------------------------------------------
// Q515 — tuningFamilyTopClusterConsensusModes
// ---------------------------------------------------------------------------

/**
 * Find the top-cluster consensus mode for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and topClusterConsensusMode.
 */
export function tuningFamilyTopClusterConsensusModes(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  topClusterConsensusMode: ReturnType<typeof tuningTopClusterConsensusMode>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    topClusterConsensusMode:
      rootHz !== undefined
        ? tuningTopClusterConsensusMode(t, spectrum, rootHz)
        : tuningTopClusterConsensusMode(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q516 — tuningModeConsensusOutlierBundle
// ---------------------------------------------------------------------------

/**
 * Join consensus ranking data with metric outlier data per mode.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns Array (same length & order as consensusBundle) with an added
 *          `outlierMetrics` field listing every metric on which the mode is
 *          a statistical outlier.
 */
export function tuningModeConsensusOutlierBundle(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): (ReturnType<typeof tuningModeConsensusClusterBundle>[number] & {
  outlierMetrics: string[];
})[] {
  const consensusBundle =
    rootHz !== undefined
      ? tuningModeConsensusClusterBundle(tuning, spectrum, rootHz)
      : tuningModeConsensusClusterBundle(tuning, spectrum);
  const outliers =
    rootHz !== undefined
      ? tuningModeMetricOutliers(tuning, spectrum, rootHz)
      : tuningModeMetricOutliers(tuning, spectrum);

  // Build Map from mode.id → outlier metric names
  const outlierMap = new Map<string, string[]>();
  for (const o of outliers) {
    const existing = outlierMap.get(o.mode.id);
    if (existing !== undefined) {
      existing.push(o.metric);
    } else {
      outlierMap.set(o.mode.id, [o.metric]);
    }
  }

  return consensusBundle.map((entry) => ({
    ...entry,
    outlierMetrics: outlierMap.get(entry.mode.id) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Q518 — tuningFamilyModeConsensusOutlierBundles
// ---------------------------------------------------------------------------

/**
 * Join consensus and outlier data for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and consensusOutlierBundle.
 */
export function tuningFamilyModeConsensusOutlierBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  consensusOutlierBundle: ReturnType<typeof tuningModeConsensusOutlierBundle>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    consensusOutlierBundle:
      rootHz !== undefined
        ? tuningModeConsensusOutlierBundle(t, spectrum, rootHz)
        : tuningModeConsensusOutlierBundle(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q519 — tuningModeInsightSummary
// ---------------------------------------------------------------------------

/**
 * Produce a compact per-mode insight string that mentions rank, cluster, and
 * any outlier metrics.
 *
 * @param tuning   - Tuning system to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per mode with mode, consensusRank, cluster,
 *          outlierMetrics, and a human-readable insight string.
 */
export function tuningModeInsightSummary(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: ReturnType<typeof tuningModeConsensusOutlierBundle>[number]['mode'];
  consensusRank: number;
  cluster: 'high' | 'mid' | 'low';
  outlierMetrics: string[];
  insight: string;
}[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeConsensusOutlierBundle(tuning, spectrum, rootHz)
      : tuningModeConsensusOutlierBundle(tuning, spectrum);
  const total = bundle.length;

  return bundle.map((entry) => {
    let insight = `[${entry.mode.id}]: rank ${entry.consensusRank}/${total}, cluster ${entry.cluster}`;
    if (entry.outlierMetrics.length > 0) {
      insight += `, outlier on [${entry.outlierMetrics.join(', ')}]`;
    }
    return {
      mode: entry.mode,
      consensusRank: entry.consensusRank,
      cluster: entry.cluster,
      outlierMetrics: entry.outlierMetrics,
      insight,
    };
  });
}

// ---------------------------------------------------------------------------
// Q521 — tuningFamilyModeInsightSummaries
// ---------------------------------------------------------------------------

/**
 * Produce insight summaries for every tuning in a family.
 *
 * @param tunings  - Array of tuning systems.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @returns One entry per tuning with its id and insightSummaries array.
 */
export function tuningFamilyModeInsightSummaries(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  insightSummaries: ReturnType<typeof tuningModeInsightSummary>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    insightSummaries:
      rootHz !== undefined
        ? tuningModeInsightSummary(t, spectrum, rootHz)
        : tuningModeInsightSummary(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q522 — tuningFinalRecommendation
// ---------------------------------------------------------------------------

export function tuningFinalRecommendation(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  recommendation: string;
  recommendedMode: ReturnType<typeof tuningTopClusterConsensusMode>;
  masterNarrative: string;
} {
  const topMode =
    rootHz !== undefined
      ? tuningTopClusterConsensusMode(tuning, spectrum, rootHz)
      : tuningTopClusterConsensusMode(tuning, spectrum);
  const report =
    rootHz !== undefined
      ? tuningMasterReport(tuning, spectrum, rootHz)
      : tuningMasterReport(tuning, spectrum);
  const recommendation =
    `For tuning '${tuning.id}', the recommended mode is '${topMode.mode.id}' ` +
    `(consensus rank ${topMode.consensusRank}, cluster: ${topMode.cluster}). ` +
    report.masterNarrative;
  return { recommendation, recommendedMode: topMode, masterNarrative: report.masterNarrative };
}

// ---------------------------------------------------------------------------
// Q524 — tuningFamilyFinalRecommendations
// ---------------------------------------------------------------------------

export function tuningFamilyFinalRecommendations(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; finalRecommendation: ReturnType<typeof tuningFinalRecommendation> }[] {
  return tunings.map((t) => ({
    id: t.id,
    finalRecommendation:
      rootHz !== undefined
        ? tuningFinalRecommendation(t, spectrum, rootHz)
        : tuningFinalRecommendation(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q525 — tuningModeEntropyDiversityMap
// ---------------------------------------------------------------------------

export function tuningModeEntropyDiversityMap(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropy: number;
  diversity: number;
  quadrant: 'rich-complex' | 'varied-uniform' | 'stable-diverse' | 'stable-uniform';
}[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  const n = bundle.length;
  if (n === 0) return [];
  const meanEntropy = bundle.reduce((s, b) => s + b.entropy, 0) / n;
  const meanDiversity = bundle.reduce((s, b) => s + b.diversity, 0) / n;
  return bundle.map((b) => {
    const aboveEntropy = b.entropy > meanEntropy;
    const aboveDiversity = b.diversity > meanDiversity;
    const quadrant: 'rich-complex' | 'varied-uniform' | 'stable-diverse' | 'stable-uniform' =
      aboveEntropy && aboveDiversity
        ? 'rich-complex'
        : aboveEntropy && !aboveDiversity
          ? 'varied-uniform'
          : !aboveEntropy && aboveDiversity
            ? 'stable-diverse'
            : 'stable-uniform';
    return { mode: b.mode, entropy: b.entropy, diversity: b.diversity, quadrant };
  });
}

// ---------------------------------------------------------------------------
// Q527 — tuningFamilyModeEntropyDiversityMaps
// ---------------------------------------------------------------------------

export function tuningFamilyModeEntropyDiversityMaps(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; entropyDiversityMap: ReturnType<typeof tuningModeEntropyDiversityMap> }[] {
  return tunings.map((t) => ({
    id: t.id,
    entropyDiversityMap:
      rootHz !== undefined
        ? tuningModeEntropyDiversityMap(t, spectrum, rootHz)
        : tuningModeEntropyDiversityMap(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q528 — tuningModeConsistencyVolatilityMap
// ---------------------------------------------------------------------------

export function tuningModeConsistencyVolatilityMap(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  consistency: number;
  volatility: number;
  quadrant:
    | 'stable-consistent'
    | 'consistent-volatile'
    | 'smooth-inconsistent'
    | 'rough-inconsistent';
}[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  if (bundle.length === 0) return [];
  const meanConsistency = bundle.reduce((s, b) => s + b.consistency, 0) / bundle.length;
  const meanVolatility = bundle.reduce((s, b) => s + b.volatility, 0) / bundle.length;
  return bundle.map((b) => {
    const aboveConsistency = b.consistency > meanConsistency;
    const belowVolatility = b.volatility < meanVolatility;
    const quadrant:
      | 'stable-consistent'
      | 'consistent-volatile'
      | 'smooth-inconsistent'
      | 'rough-inconsistent' =
      aboveConsistency && belowVolatility
        ? 'stable-consistent'
        : aboveConsistency && !belowVolatility
          ? 'consistent-volatile'
          : !aboveConsistency && belowVolatility
            ? 'smooth-inconsistent'
            : 'rough-inconsistent';
    return { mode: b.mode, consistency: b.consistency, volatility: b.volatility, quadrant };
  });
}

// ---------------------------------------------------------------------------
// Q530 — tuningFamilyModeConsistencyVolatilityMaps
// ---------------------------------------------------------------------------

export function tuningFamilyModeConsistencyVolatilityMaps(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  consistencyVolatilityMap: ReturnType<typeof tuningModeConsistencyVolatilityMap>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    consistencyVolatilityMap:
      rootHz !== undefined
        ? tuningModeConsistencyVolatilityMap(t, spectrum, rootHz)
        : tuningModeConsistencyVolatilityMap(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q531 — tuningModeFiveDimMap
// ---------------------------------------------------------------------------

export function tuningModeFiveDimMap(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropyDiversityQuadrant: 'rich-complex' | 'varied-uniform' | 'stable-diverse' | 'stable-uniform';
  consistencyVolatilityQuadrant:
    | 'stable-consistent'
    | 'consistent-volatile'
    | 'smooth-inconsistent'
    | 'rough-inconsistent';
  cluster: 'high' | 'mid' | 'low';
}[] {
  const edMap =
    rootHz !== undefined
      ? tuningModeEntropyDiversityMap(tuning, spectrum, rootHz)
      : tuningModeEntropyDiversityMap(tuning, spectrum);
  const cvMap =
    rootHz !== undefined
      ? tuningModeConsistencyVolatilityMap(tuning, spectrum, rootHz)
      : tuningModeConsistencyVolatilityMap(tuning, spectrum);
  const clusters =
    rootHz !== undefined
      ? tuningModeMetricCluster(tuning, spectrum, rootHz)
      : tuningModeMetricCluster(tuning, spectrum);

  const cvById = new Map(cvMap.map((e) => [e.mode.id, e]));
  const clusterById = new Map(clusters.map((e) => [e.mode.id, e]));

  return edMap.map((ed) => {
    const cv = cvById.get(ed.mode.id);
    const cl = clusterById.get(ed.mode.id);
    return {
      mode: ed.mode,
      entropyDiversityQuadrant: ed.quadrant,
      consistencyVolatilityQuadrant: cv?.quadrant ?? 'rough-inconsistent',
      cluster: cl?.cluster ?? 'low',
    };
  });
}

// ---------------------------------------------------------------------------
// Q533 — tuningFamilyModeFiveDimMaps
// ---------------------------------------------------------------------------

export function tuningFamilyModeFiveDimMaps(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; fiveDimMap: ReturnType<typeof tuningModeFiveDimMap> }[] {
  return tunings.map((t) => ({
    id: t.id,
    fiveDimMap:
      rootHz !== undefined
        ? tuningModeFiveDimMap(t, spectrum, rootHz)
        : tuningModeFiveDimMap(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q534 — tuningModeFiveDimNarrative
// ---------------------------------------------------------------------------

/**
 * Produce a per-mode narrative string describing all three 5-dim labels.
 *
 * Socratic Q534: "If I have the 5-dim map for every mode, can I produce a
 * per-mode narrative string describing all three labels?"
 *
 * Algorithm:
 * 1. `tuningModeFiveDimMap(tuning, spectrum, rootHz)` → map.
 * 2. For each entry build:
 *    `"[mode.id]: entropy-diversity=[edQuadrant], consistency-volatility=[cvQuadrant], cluster=[cluster]"`.
 * 3. Return `{mode, entropyDiversityQuadrant, consistencyVolatilityQuadrant, cluster, narrative}[]`.
 */
export function tuningModeFiveDimNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropyDiversityQuadrant: 'rich-complex' | 'varied-uniform' | 'stable-diverse' | 'stable-uniform';
  consistencyVolatilityQuadrant:
    | 'stable-consistent'
    | 'consistent-volatile'
    | 'smooth-inconsistent'
    | 'rough-inconsistent';
  cluster: 'high' | 'mid' | 'low';
  narrative: string;
}[] {
  const map =
    rootHz !== undefined
      ? tuningModeFiveDimMap(tuning, spectrum, rootHz)
      : tuningModeFiveDimMap(tuning, spectrum);
  return map.map((entry) => ({
    mode: entry.mode,
    entropyDiversityQuadrant: entry.entropyDiversityQuadrant,
    consistencyVolatilityQuadrant: entry.consistencyVolatilityQuadrant,
    cluster: entry.cluster,
    narrative: `${entry.mode.id}: entropy-diversity=${entry.entropyDiversityQuadrant}, consistency-volatility=${entry.consistencyVolatilityQuadrant}, cluster=${entry.cluster}`,
  }));
}

// ---------------------------------------------------------------------------
// Q536 — tuningFamilyModeFiveDimNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyModeFiveDimNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; fiveDimNarratives: ReturnType<typeof tuningModeFiveDimNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    fiveDimNarratives:
      rootHz !== undefined
        ? tuningModeFiveDimNarrative(t, spectrum, rootHz)
        : tuningModeFiveDimNarrative(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q537 — tuningModeSmoothnessEntropyMap
// ---------------------------------------------------------------------------

/**
 * Map modes on a smoothnessRatio×entropy plane for a fresh angle on which
 * modes feel fluid vs. complex.
 *
 * Socratic Q537: "Can I map modes on a smoothnessRatio×entropy plane for a
 * fresh angle on which modes feel fluid vs. complex?"
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz)` → bundle.
 * 2. meanSmoothness = mean of smoothnessRatio; meanEntropy = mean of entropy.
 * 3. Quadrants:
 *    - smoothnessRatio > mean AND entropy > mean → 'fluid-complex'
 *    - smoothnessRatio > mean AND entropy <= mean → 'fluid-simple'
 *    - smoothnessRatio <= mean AND entropy > mean → 'rough-complex'
 *    - else → 'rough-simple'
 */
export function tuningModeSmoothnessEntropyMap(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  smoothnessRatio: number;
  entropy: number;
  quadrant: 'fluid-complex' | 'fluid-simple' | 'rough-complex' | 'rough-simple';
}[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  const n = bundle.length;
  if (n === 0) return [];
  const meanSmoothness = bundle.reduce((sum, b) => sum + b.smoothnessRatio, 0) / n;
  const meanEntropy = bundle.reduce((sum, b) => sum + b.entropy, 0) / n;
  return bundle.map((b) => {
    let quadrant: 'fluid-complex' | 'fluid-simple' | 'rough-complex' | 'rough-simple';
    if (b.smoothnessRatio > meanSmoothness && b.entropy > meanEntropy) {
      quadrant = 'fluid-complex';
    } else if (b.smoothnessRatio > meanSmoothness && b.entropy <= meanEntropy) {
      quadrant = 'fluid-simple';
    } else if (b.smoothnessRatio <= meanSmoothness && b.entropy > meanEntropy) {
      quadrant = 'rough-complex';
    } else {
      quadrant = 'rough-simple';
    }
    return { mode: b.mode, smoothnessRatio: b.smoothnessRatio, entropy: b.entropy, quadrant };
  });
}

// ---------------------------------------------------------------------------
// Q539 — tuningFamilyModeSmoothnessEntropyMaps
// ---------------------------------------------------------------------------

export function tuningFamilyModeSmoothnessEntropyMaps(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; smoothnessEntropyMap: ReturnType<typeof tuningModeSmoothnessEntropyMap> }[] {
  return tunings.map((t) => ({
    id: t.id,
    smoothnessEntropyMap:
      rootHz !== undefined
        ? tuningModeSmoothnessEntropyMap(t, spectrum, rootHz)
        : tuningModeSmoothnessEntropyMap(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q540 — tuningModeDiversityVolatilityMap
// ---------------------------------------------------------------------------

/**
 * Map each mode on a diversity×volatility plane.
 *
 * Socratic Q540: "Can I map modes on a diversity×volatility plane — are
 * diverse scales necessarily more volatile?"
 *
 * Algorithm:
 * 1. `tuningModeComprehensiveBundle` → bundle
 * 2. Compute meanDiversity and meanVolatility.
 * 3. Assign quadrant per mode:
 *    - diversity > mean AND volatility > mean  → 'diverse-volatile'
 *    - diversity > mean AND volatility <= mean → 'diverse-stable'
 *    - diversity <= mean AND volatility > mean → 'uniform-volatile'
 *    - else                                    → 'uniform-stable'
 */
export function tuningModeDiversityVolatilityMap(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  diversity: number;
  volatility: number;
  quadrant: 'diverse-volatile' | 'diverse-stable' | 'uniform-volatile' | 'uniform-stable';
}[] {
  const bundle =
    rootHz !== undefined
      ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
      : tuningModeComprehensiveBundle(tuning, spectrum);
  const n = bundle.length;
  if (n === 0) return [];
  const meanDiversity = bundle.reduce((s, b) => s + b.diversity, 0) / n;
  const meanVolatility = bundle.reduce((s, b) => s + b.volatility, 0) / n;
  return bundle.map((b) => {
    const aboveDiversity = b.diversity > meanDiversity;
    const aboveVolatility = b.volatility > meanVolatility;
    const quadrant: 'diverse-volatile' | 'diverse-stable' | 'uniform-volatile' | 'uniform-stable' =
      aboveDiversity && aboveVolatility
        ? 'diverse-volatile'
        : aboveDiversity && !aboveVolatility
          ? 'diverse-stable'
          : !aboveDiversity && aboveVolatility
            ? 'uniform-volatile'
            : 'uniform-stable';
    return { mode: b.mode, diversity: b.diversity, volatility: b.volatility, quadrant };
  });
}

// ---------------------------------------------------------------------------
// Q542 — tuningFamilyModeDiversityVolatilityMaps
// ---------------------------------------------------------------------------

export function tuningFamilyModeDiversityVolatilityMaps(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  diversityVolatilityMap: ReturnType<typeof tuningModeDiversityVolatilityMap>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    diversityVolatilityMap:
      rootHz !== undefined
        ? tuningModeDiversityVolatilityMap(t, spectrum, rootHz)
        : tuningModeDiversityVolatilityMap(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q543 — tuningModeAllQuadrantsBundle
// ---------------------------------------------------------------------------

/**
 * Join all four 2-D quadrant maps into a single per-mode bundle.
 *
 * Socratic Q543: "If I have the three 2D quadrant maps (entropy-diversity,
 * consistency-volatility, smoothness-entropy), can I join them with
 * diversity-volatility into one 4-quadrant per-mode bundle?"
 *
 * Algorithm:
 * 1. `tuningModeEntropyDiversityMap`      → edMap
 * 2. `tuningModeConsistencyVolatilityMap` → cvMap
 * 3. `tuningModeSmoothnessEntropyMap`     → seMap
 * 4. `tuningModeDiversityVolatilityMap`   → dvMap
 * 5. Build Maps from mode.id → entry for each.
 * 6. Return per mode (order: edMap order):
 *    { mode, entropyDiversityQuadrant, consistencyVolatilityQuadrant,
 *      smoothnessEntropyQuadrant, diversityVolatilityQuadrant }[]
 */
export function tuningModeAllQuadrantsBundle(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropyDiversityQuadrant: 'rich-complex' | 'varied-uniform' | 'stable-diverse' | 'stable-uniform';
  consistencyVolatilityQuadrant:
    | 'stable-consistent'
    | 'consistent-volatile'
    | 'smooth-inconsistent'
    | 'rough-inconsistent';
  smoothnessEntropyQuadrant: 'fluid-complex' | 'fluid-simple' | 'rough-complex' | 'rough-simple';
  diversityVolatilityQuadrant:
    | 'diverse-volatile'
    | 'diverse-stable'
    | 'uniform-volatile'
    | 'uniform-stable';
}[] {
  const edMap =
    rootHz !== undefined
      ? tuningModeEntropyDiversityMap(tuning, spectrum, rootHz)
      : tuningModeEntropyDiversityMap(tuning, spectrum);
  const cvMap =
    rootHz !== undefined
      ? tuningModeConsistencyVolatilityMap(tuning, spectrum, rootHz)
      : tuningModeConsistencyVolatilityMap(tuning, spectrum);
  const seMap =
    rootHz !== undefined
      ? tuningModeSmoothnessEntropyMap(tuning, spectrum, rootHz)
      : tuningModeSmoothnessEntropyMap(tuning, spectrum);
  const dvMap =
    rootHz !== undefined
      ? tuningModeDiversityVolatilityMap(tuning, spectrum, rootHz)
      : tuningModeDiversityVolatilityMap(tuning, spectrum);

  const cvById = new Map(cvMap.map((e) => [e.mode.id, e]));
  const seById = new Map(seMap.map((e) => [e.mode.id, e]));
  const dvById = new Map(dvMap.map((e) => [e.mode.id, e]));

  return edMap.map((ed) => {
    const cv = cvById.get(ed.mode.id);
    const se = seById.get(ed.mode.id);
    const dv = dvById.get(ed.mode.id);
    return {
      mode: ed.mode,
      entropyDiversityQuadrant: ed.quadrant,
      consistencyVolatilityQuadrant: cv?.quadrant ?? 'rough-inconsistent',
      smoothnessEntropyQuadrant: se?.quadrant ?? 'rough-simple',
      diversityVolatilityQuadrant: dv?.quadrant ?? 'uniform-stable',
    };
  });
}

// ---------------------------------------------------------------------------
// Q545 — tuningFamilyModeAllQuadrantsBundles
// ---------------------------------------------------------------------------

export function tuningFamilyModeAllQuadrantsBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; allQuadrantsBundle: ReturnType<typeof tuningModeAllQuadrantsBundle> }[] {
  return tunings.map((t) => ({
    id: t.id,
    allQuadrantsBundle:
      rootHz !== undefined
        ? tuningModeAllQuadrantsBundle(t, spectrum, rootHz)
        : tuningModeAllQuadrantsBundle(t, spectrum),
  }));
}

// ---------------------------------------------------------------------------
// Q546 — tuningModeAllQuadrantsNarrative
// ---------------------------------------------------------------------------

export function tuningModeAllQuadrantsNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropyDiversityQuadrant: string;
  consistencyVolatilityQuadrant: string;
  smoothnessEntropyQuadrant: string;
  diversityVolatilityQuadrant: string;
  narrative: string;
}[] {
  return tuningModeAllQuadrantsBundle(tuning, spectrum, rootHz).map((entry) => {
    const {
      mode,
      entropyDiversityQuadrant,
      consistencyVolatilityQuadrant,
      smoothnessEntropyQuadrant,
      diversityVolatilityQuadrant,
    } = entry;
    const tokens = [
      ...entropyDiversityQuadrant.split('-'),
      ...consistencyVolatilityQuadrant.split('-'),
      ...smoothnessEntropyQuadrant.split('-'),
      ...diversityVolatilityQuadrant.split('-'),
    ];
    const positiveWords = new Set(['rich', 'complex', 'stable', 'consistent', 'fluid', 'diverse']);
    const positiveCount = tokens.filter((t) => positiveWords.has(t)).length;
    const character =
      positiveCount >= 5
        ? 'versatile and expressive'
        : positiveCount >= 3
          ? 'moderately varied'
          : 'focused and specialized';
    const narrative =
      `"${mode.name}" spans all quadrant maps: entropy-diversity="${entropyDiversityQuadrant}", ` +
      `consistency-volatility="${consistencyVolatilityQuadrant}", ` +
      `smoothness-entropy="${smoothnessEntropyQuadrant}", ` +
      `diversity-volatility="${diversityVolatilityQuadrant}". ` +
      `Overall character: ${character}.`;
    return { ...entry, narrative };
  });
}

// ---------------------------------------------------------------------------
// Q548 — tuningFamilyModeAllQuadrantsNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyModeAllQuadrantsNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; allQuadrantsNarrative: ReturnType<typeof tuningModeAllQuadrantsNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    allQuadrantsNarrative: tuningModeAllQuadrantsNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q549 — tuningModeQuadrantConsensus
// ---------------------------------------------------------------------------

export function tuningModeQuadrantConsensus(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  quadrantVotes: Record<string, number>;
  dominantToken: string;
  consensus: 'versatile' | 'specialized' | 'balanced';
}[] {
  return tuningModeAllQuadrantsBundle(tuning, spectrum, rootHz).map((entry) => {
    const {
      mode,
      entropyDiversityQuadrant,
      consistencyVolatilityQuadrant,
      smoothnessEntropyQuadrant,
      diversityVolatilityQuadrant,
    } = entry;
    const tokens = [
      ...entropyDiversityQuadrant.split('-'),
      ...consistencyVolatilityQuadrant.split('-'),
      ...smoothnessEntropyQuadrant.split('-'),
      ...diversityVolatilityQuadrant.split('-'),
    ];
    const votes: Record<string, number> = {};
    for (const t of tokens) {
      votes[t] = (votes[t] ?? 0) + 1;
    }
    const positiveWords = new Set(['rich', 'complex', 'stable', 'consistent', 'fluid', 'diverse']);
    const negativeWords = new Set([
      'uniform',
      'volatile',
      'rough',
      'simple',
      'varied',
      'inconsistent',
    ]);
    const posCount = tokens.filter((t) => positiveWords.has(t)).length;
    const negCount = tokens.filter((t) => negativeWords.has(t)).length;
    const consensus: 'versatile' | 'specialized' | 'balanced' =
      posCount > negCount + 1 ? 'versatile' : negCount > posCount + 1 ? 'specialized' : 'balanced';
    const dominantToken = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    return { mode, quadrantVotes: votes, dominantToken, consensus };
  });
}

// ---------------------------------------------------------------------------
// Q551 — tuningFamilyModeQuadrantConsensus
// ---------------------------------------------------------------------------

export function tuningFamilyModeQuadrantConsensus(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; quadrantConsensus: ReturnType<typeof tuningModeQuadrantConsensus> }[] {
  return tunings.map((t) => ({
    id: t.id,
    quadrantConsensus: tuningModeQuadrantConsensus(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q552 — tuningBestQuadrantConsensusMode
// ---------------------------------------------------------------------------

export function tuningBestQuadrantConsensusMode(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  quadrantVotes: Record<string, number>;
  dominantToken: string;
  consensus: 'versatile' | 'specialized' | 'balanced';
} {
  const results = tuningModeQuadrantConsensus(tuning, spectrum, rootHz);
  if (results.length === 0) throw new RangeError('No modes in tuning');
  const positiveWords = new Set(['rich', 'complex', 'stable', 'consistent', 'fluid', 'diverse']);
  const posScore = (e: (typeof results)[number]): number =>
    Object.entries(e.quadrantVotes)
      .filter(([t]) => positiveWords.has(t))
      .reduce((s, [, c]) => s + c, 0);
  const best = (arr: typeof results): (typeof results)[number] =>
    arr.reduce((b, e) => (posScore(e) >= posScore(b) ? e : b), arr[0]!);
  const versatile = results.filter((e) => e.consensus === 'versatile');
  if (versatile.length > 0) return best(versatile);
  const balanced = results.filter((e) => e.consensus === 'balanced');
  if (balanced.length > 0) return best(balanced);
  return best(results);
}

// ---------------------------------------------------------------------------
// Q554 — tuningFamilyBestQuadrantConsensusModes
// ---------------------------------------------------------------------------

export function tuningFamilyBestQuadrantConsensusModes(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; bestMode: ReturnType<typeof tuningBestQuadrantConsensusMode> }[] {
  return tunings.map((t) => ({
    id: t.id,
    bestMode: tuningBestQuadrantConsensusMode(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q555 — tuningModeConsensusNarrative
// ---------------------------------------------------------------------------

export function tuningModeConsensusNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  quadrantVotes: Record<string, number>;
  dominantToken: string;
  consensus: 'versatile' | 'specialized' | 'balanced';
  narrative: string;
}[] {
  return tuningModeQuadrantConsensus(tuning, spectrum, rootHz).map((entry) => {
    const { mode, quadrantVotes, dominantToken, consensus } = entry;
    const dominantCount = quadrantVotes[dominantToken] ?? 0;
    const narrative =
      `"${mode.name}" reads as ${consensus}: dominant token "${dominantToken}" appears ` +
      `${dominantCount} time${dominantCount !== 1 ? 's' : ''} across 8 quadrant dimension tokens.`;
    return { ...entry, narrative };
  });
}

// ---------------------------------------------------------------------------
// Q557 — tuningFamilyModeConsensusNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyModeConsensusNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; consensusNarratives: ReturnType<typeof tuningModeConsensusNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    consensusNarratives: tuningModeConsensusNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q558 — tuningModeQuadrantProfile
// ---------------------------------------------------------------------------

export function tuningModeQuadrantProfile(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropyDiversityQuadrant: string;
  consistencyVolatilityQuadrant: string;
  smoothnessEntropyQuadrant: string;
  diversityVolatilityQuadrant: string;
  quadrantProfile: string;
}[] {
  return tuningModeAllQuadrantsBundle(tuning, spectrum, rootHz).map((entry) => ({
    ...entry,
    quadrantProfile: [
      entry.entropyDiversityQuadrant,
      entry.consistencyVolatilityQuadrant,
      entry.smoothnessEntropyQuadrant,
      entry.diversityVolatilityQuadrant,
    ].join('|'),
  }));
}

// ---------------------------------------------------------------------------
// Q560 — tuningFamilyModeQuadrantProfiles
// ---------------------------------------------------------------------------

export function tuningFamilyModeQuadrantProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; quadrantProfiles: ReturnType<typeof tuningModeQuadrantProfile> }[] {
  return tunings.map((t) => ({
    id: t.id,
    quadrantProfiles: tuningModeQuadrantProfile(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q561 — tuningQuadrantCoverage
// ---------------------------------------------------------------------------

export function tuningQuadrantCoverage(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  entropyDiversityUnique: number;
  consistencyVolatilityUnique: number;
  smoothnessEntropyUnique: number;
  diversityVolatilityUnique: number;
  totalUniqueProfiles: number;
  totalModes: number;
} {
  const bundle = tuningModeAllQuadrantsBundle(tuning, spectrum, rootHz);
  const edSet = new Set(bundle.map((e) => e.entropyDiversityQuadrant));
  const cvSet = new Set(bundle.map((e) => e.consistencyVolatilityQuadrant));
  const seSet = new Set(bundle.map((e) => e.smoothnessEntropyQuadrant));
  const dvSet = new Set(bundle.map((e) => e.diversityVolatilityQuadrant));
  const profileSet = new Set(
    bundle.map((e) =>
      [
        e.entropyDiversityQuadrant,
        e.consistencyVolatilityQuadrant,
        e.smoothnessEntropyQuadrant,
        e.diversityVolatilityQuadrant,
      ].join('|'),
    ),
  );
  return {
    entropyDiversityUnique: edSet.size,
    consistencyVolatilityUnique: cvSet.size,
    smoothnessEntropyUnique: seSet.size,
    diversityVolatilityUnique: dvSet.size,
    totalUniqueProfiles: profileSet.size,
    totalModes: bundle.length,
  };
}

// ---------------------------------------------------------------------------
// Q563 — tuningFamilyQuadrantCoverage
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantCoverage(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; coverage: ReturnType<typeof tuningQuadrantCoverage> }[] {
  return tunings.map((t) => ({ id: t.id, coverage: tuningQuadrantCoverage(t, spectrum, rootHz) }));
}

// ---------------------------------------------------------------------------
// Q564 — tuningModeGroupByProfile
// ---------------------------------------------------------------------------

export function tuningModeGroupByProfile(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; modes: Scale[]; count: number }[] {
  const profiles = tuningModeQuadrantProfile(tuning, spectrum, rootHz);
  const map = new Map<string, Scale[]>();
  for (const entry of profiles) {
    const existing = map.get(entry.quadrantProfile);
    if (existing) {
      existing.push(entry.mode);
    } else {
      map.set(entry.quadrantProfile, [entry.mode]);
    }
  }
  return Array.from(map.entries())
    .map(([profile, modes]) => ({ profile, modes, count: modes.length }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Q566 — tuningFamilyModeGroupByProfiles
// ---------------------------------------------------------------------------

export function tuningFamilyModeGroupByProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; profileGroups: ReturnType<typeof tuningModeGroupByProfile> }[] {
  return tunings.map((t) => ({
    id: t.id,
    profileGroups: tuningModeGroupByProfile(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q567 — tuningQuadrantCoverageNarrative
// ---------------------------------------------------------------------------

export function tuningQuadrantCoverageNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  entropyDiversityUnique: number;
  consistencyVolatilityUnique: number;
  smoothnessEntropyUnique: number;
  diversityVolatilityUnique: number;
  totalUniqueProfiles: number;
  totalModes: number;
  narrative: string;
} {
  const coverage = tuningQuadrantCoverage(tuning, spectrum, rootHz);
  const {
    entropyDiversityUnique,
    consistencyVolatilityUnique,
    smoothnessEntropyUnique,
    diversityVolatilityUnique,
    totalUniqueProfiles,
    totalModes,
  } = coverage;
  const narrative =
    `"${tuning.name}" covers ${totalUniqueProfiles} unique quadrant profile${totalUniqueProfiles !== 1 ? 's' : ''} across ${totalModes} modes: ` +
    `entropy-diversity ${entropyDiversityUnique}/4, consistency-volatility ${consistencyVolatilityUnique}/4, ` +
    `smoothness-entropy ${smoothnessEntropyUnique}/4, diversity-volatility ${diversityVolatilityUnique}/4.`;
  return { ...coverage, narrative };
}

// ---------------------------------------------------------------------------
// Q569 — tuningFamilyQuadrantCoverageNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantCoverageNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; coverageNarrative: ReturnType<typeof tuningQuadrantCoverageNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    coverageNarrative: tuningQuadrantCoverageNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q570 — tuningDominantQuadrantProfile
// ---------------------------------------------------------------------------

export function tuningDominantQuadrantProfile(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; modes: Scale[]; count: number } {
  const groups = tuningModeGroupByProfile(tuning, spectrum, rootHz);
  if (groups.length === 0) throw new RangeError('No modes in tuning');
  return groups[0]!;
}

// ---------------------------------------------------------------------------
// Q572 — tuningFamilyDominantQuadrantProfiles
// ---------------------------------------------------------------------------

export function tuningFamilyDominantQuadrantProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; dominantProfile: ReturnType<typeof tuningDominantQuadrantProfile> }[] {
  return tunings.map((t) => ({
    id: t.id,
    dominantProfile: tuningDominantQuadrantProfile(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q573 — tuningQuadrantProfileDiversity
// ---------------------------------------------------------------------------

export function tuningQuadrantProfileDiversity(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  profileCount: number;
  totalModes: number;
  entropy: number;
  normalized: number;
} {
  const groups = tuningModeGroupByProfile(tuning, spectrum, rootHz);
  const totalModes = groups.reduce((s, g) => s + g.count, 0);
  if (totalModes === 0) return { profileCount: 0, totalModes: 0, entropy: 0, normalized: 0 };
  const entropy = groups.reduce((h, g) => {
    const p = g.count / totalModes;
    return h - p * Math.log2(p);
  }, 0);
  const profileCount = groups.length;
  const normalized = profileCount > 1 ? entropy / Math.log2(profileCount) : 1;
  return { profileCount, totalModes, entropy, normalized };
}

// ---------------------------------------------------------------------------
// Q575 — tuningFamilyQuadrantProfileDiversities
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantProfileDiversities(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; profileDiversity: ReturnType<typeof tuningQuadrantProfileDiversity> }[] {
  return tunings.map((t) => ({
    id: t.id,
    profileDiversity: tuningQuadrantProfileDiversity(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q576 — tuningQuadrantProfileDiversityNarrative
// ---------------------------------------------------------------------------

export function tuningQuadrantProfileDiversityNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  profileCount: number;
  totalModes: number;
  entropy: number;
  normalized: number;
  narrative: string;
} {
  const diversity = tuningQuadrantProfileDiversity(tuning, spectrum, rootHz);
  const { profileCount, totalModes, entropy, normalized } = diversity;
  const spread =
    profileCount === 1
      ? 'All modes share the same quadrant profile.'
      : normalized >= 0.8
        ? 'Modes are highly spread across distinct profiles.'
        : normalized >= 0.5
          ? 'Modes show moderate profile diversity.'
          : 'Modes are concentrated in a few profiles.';
  const narrative =
    `"${tuning.name}" spreads its ${totalModes} mode${totalModes !== 1 ? 's' : ''} across ` +
    `${profileCount} distinct quadrant profile${profileCount !== 1 ? 's' : ''}. ` +
    `Profile entropy: ${entropy.toFixed(3)} bits (normalized: ${(normalized * 100).toFixed(1)}%). ${spread}`;
  return { ...diversity, narrative };
}

// ---------------------------------------------------------------------------
// Q578 — tuningFamilyQuadrantProfileDiversityNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantProfileDiversityNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  diversityNarrative: ReturnType<typeof tuningQuadrantProfileDiversityNarrative>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    diversityNarrative: tuningQuadrantProfileDiversityNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q579 — tuningFamilyQuadrantDiversityRanking
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantDiversityRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  profileDiversity: ReturnType<typeof tuningQuadrantProfileDiversity>;
  rank: number;
}[] {
  return tuningFamilyQuadrantProfileDiversities(tunings, spectrum, rootHz)
    .slice()
    .sort((a, b) => b.profileDiversity.normalized - a.profileDiversity.normalized)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Q580 — tuningFamilyMostDiverseQuadrantProfile
// ---------------------------------------------------------------------------

export function tuningFamilyMostDiverseQuadrantProfile(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  profileDiversity: ReturnType<typeof tuningQuadrantProfileDiversity>;
  rank: number;
} {
  const ranking = tuningFamilyQuadrantDiversityRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('No tunings provided');
  return ranking[0]!;
}

// ---------------------------------------------------------------------------
// Q581 — tuningFamilyLeastDiverseQuadrantProfile
// ---------------------------------------------------------------------------

export function tuningFamilyLeastDiverseQuadrantProfile(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  profileDiversity: ReturnType<typeof tuningQuadrantProfileDiversity>;
  rank: number;
} {
  const ranking = tuningFamilyQuadrantDiversityRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('No tunings provided');
  return ranking[ranking.length - 1]!;
}

// ---------------------------------------------------------------------------
// Q582 — tuningFamilyQuadrantProfileFrequency
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantProfileFrequency(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; tuningCount: number; tuningIds: string[] }[] {
  const profileMap = new Map<string, string[]>();
  for (const tuning of tunings) {
    const groups = tuningModeGroupByProfile(tuning, spectrum, rootHz);
    for (const group of groups) {
      const existing = profileMap.get(group.profile);
      if (existing) {
        if (!existing.includes(tuning.id)) existing.push(tuning.id);
      } else {
        profileMap.set(group.profile, [tuning.id]);
      }
    }
  }
  return Array.from(profileMap.entries())
    .map(([profile, tuningIds]) => ({ profile, tuningCount: tuningIds.length, tuningIds }))
    .sort((a, b) => b.tuningCount - a.tuningCount);
}

// ---------------------------------------------------------------------------
// Q583 — tuningFamilySharedQuadrantProfiles
// ---------------------------------------------------------------------------

export function tuningFamilySharedQuadrantProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; tuningCount: number; tuningIds: string[] }[] {
  return tuningFamilyQuadrantProfileFrequency(tunings, spectrum, rootHz).filter(
    (e) => e.tuningCount > 1,
  );
}

// ---------------------------------------------------------------------------
// Q584 — tuningFamilyUniqueQuadrantProfiles
// ---------------------------------------------------------------------------

export function tuningFamilyUniqueQuadrantProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; tuningId: string }[] {
  return tuningFamilyQuadrantProfileFrequency(tunings, spectrum, rootHz)
    .filter((e) => e.tuningCount === 1)
    .map((e) => ({ profile: e.profile, tuningId: e.tuningIds[0] ?? '' }));
}

// ---------------------------------------------------------------------------
// Q585 — tuningFamilyMostSharedQuadrantProfile
// ---------------------------------------------------------------------------

export function tuningFamilyMostSharedQuadrantProfile(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; tuningCount: number; tuningIds: string[] } | null {
  const freq = tuningFamilySharedQuadrantProfiles(tunings, spectrum, rootHz);
  return freq.length > 0 ? freq[0]! : null;
}

// ---------------------------------------------------------------------------
// Q586 — tuningFamilyQuadrantProfileOverlapScore
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantProfileOverlapScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  sharedCount: number;
  uniqueCount: number;
  totalProfiles: number;
  overlapScore: number;
} {
  const freq = tuningFamilyQuadrantProfileFrequency(tunings, spectrum, rootHz);
  const sharedCount = freq.filter((e) => e.tuningCount > 1).length;
  const uniqueCount = freq.filter((e) => e.tuningCount === 1).length;
  const totalProfiles = freq.length;
  const overlapScore = totalProfiles > 0 ? sharedCount / totalProfiles : 0;
  return { sharedCount, uniqueCount, totalProfiles, overlapScore };
}

// ---------------------------------------------------------------------------
// Q587 — tuningFamilyQuadrantProfileFrequencyNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyQuadrantProfileFrequencyNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  sharedCount: number;
  uniqueCount: number;
  totalProfiles: number;
  overlapScore: number;
  narrative: string;
} {
  const overlap = tuningFamilyQuadrantProfileOverlapScore(tunings, spectrum, rootHz);
  const { sharedCount, uniqueCount, totalProfiles, overlapScore } = overlap;
  const level = overlapScore >= 0.5 ? 'high' : overlapScore >= 0.25 ? 'moderate' : 'low';
  const narrative =
    `Across ${tunings.length} tuning${tunings.length !== 1 ? 's' : ''}, ` +
    `${totalProfiles} distinct quadrant profile${totalProfiles !== 1 ? 's' : ''} found: ` +
    `${sharedCount} shared across multiple tunings, ${uniqueCount} unique to a single tuning. ` +
    `Profile overlap is ${level} (overlap score: ${(overlapScore * 100).toFixed(1)}%).`;
  return { ...overlap, narrative };
}

// ---------------------------------------------------------------------------
// Q588 — tuningModeProfileTransitions
// ---------------------------------------------------------------------------

export function tuningModeProfileTransitions(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  fromMode: Scale;
  toMode: Scale;
  sameProfile: boolean;
  fromProfile: string;
  toProfile: string;
}[] {
  const profiles = tuningModeQuadrantProfile(tuning, spectrum, rootHz);
  const result: {
    fromMode: Scale;
    toMode: Scale;
    sameProfile: boolean;
    fromProfile: string;
    toProfile: string;
  }[] = [];
  for (let i = 0; i < profiles.length - 1; i++) {
    const from = profiles[i]!;
    const to = profiles[i + 1]!;
    result.push({
      fromMode: from.mode,
      toMode: to.mode,
      sameProfile: from.quadrantProfile === to.quadrantProfile,
      fromProfile: from.quadrantProfile,
      toProfile: to.quadrantProfile,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Q590 — tuningProfileTransitionScore
// ---------------------------------------------------------------------------

export function tuningProfileTransitionScore(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  sameCount: number;
  differentCount: number;
  totalTransitions: number;
  stabilityScore: number;
} {
  const transitions = tuningModeProfileTransitions(tuning, spectrum, rootHz);
  const sameCount = transitions.filter((t) => t.sameProfile).length;
  const differentCount = transitions.length - sameCount;
  const totalTransitions = transitions.length;
  const stabilityScore = totalTransitions > 0 ? sameCount / totalTransitions : 1;
  return { sameCount, differentCount, totalTransitions, stabilityScore };
}

// ---------------------------------------------------------------------------
// Q592 — tuningFamilyProfileTransitionScores
// ---------------------------------------------------------------------------

export function tuningFamilyProfileTransitionScores(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; transitionScore: ReturnType<typeof tuningProfileTransitionScore> }[] {
  return tunings.map((t) => ({
    id: t.id,
    transitionScore: tuningProfileTransitionScore(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q593 — tuningFamilyProfileTransitionRanking
// ---------------------------------------------------------------------------

export function tuningFamilyProfileTransitionRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  transitionScore: ReturnType<typeof tuningProfileTransitionScore>;
  rank: number;
}[] {
  return tuningFamilyProfileTransitionScores(tunings, spectrum, rootHz)
    .slice()
    .sort((a, b) => b.transitionScore.stabilityScore - a.transitionScore.stabilityScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Q594 — tuningProfileTransitionScoreNarrative
// ---------------------------------------------------------------------------

export function tuningProfileTransitionScoreNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  sameCount: number;
  differentCount: number;
  totalTransitions: number;
  stabilityScore: number;
  narrative: string;
} {
  const score = tuningProfileTransitionScore(tuning, spectrum, rootHz);
  const { sameCount, totalTransitions, stabilityScore } = score;
  const level =
    stabilityScore >= 0.8
      ? 'highly stable'
      : stabilityScore >= 0.5
        ? 'moderately stable'
        : 'highly varied';
  const narrative =
    `"${tuning.name}" has a ${level} profile sequence: ${sameCount} of ${totalTransitions} ` +
    `consecutive mode pairs share the same quadrant profile ` +
    `(stability: ${(stabilityScore * 100).toFixed(1)}%).`;
  return { ...score, narrative };
}

// ---------------------------------------------------------------------------
// Q596 — tuningFamilyProfileTransitionScoreNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyProfileTransitionScoreNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; transitionNarrative: ReturnType<typeof tuningProfileTransitionScoreNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    transitionNarrative: tuningProfileTransitionScoreNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q597 — tuningFamilyMostStableProfileTransition
// ---------------------------------------------------------------------------

export function tuningFamilyMostStableProfileTransition(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; transitionScore: ReturnType<typeof tuningProfileTransitionScore>; rank: number } {
  const ranking = tuningFamilyProfileTransitionRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('No tunings provided');
  return ranking[0]!;
}

// ---------------------------------------------------------------------------
// Q598 — tuningFamilyLeastStableProfileTransition
// ---------------------------------------------------------------------------

export function tuningFamilyLeastStableProfileTransition(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; transitionScore: ReturnType<typeof tuningProfileTransitionScore>; rank: number } {
  const ranking = tuningFamilyProfileTransitionRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('No tunings provided');
  return ranking[ranking.length - 1]!;
}

// ---------------------------------------------------------------------------
// Q599 — tuningProfileTransitionHeatMap
// ---------------------------------------------------------------------------

export function tuningProfileTransitionHeatMap(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { index: number; fromModeName: string; toModeName: string; changed: boolean }[] {
  return tuningModeProfileTransitions(tuning, spectrum, rootHz).map((entry, i) => ({
    index: i,
    fromModeName: entry.fromMode.name,
    toModeName: entry.toMode.name,
    changed: !entry.sameProfile,
  }));
}

// ---------------------------------------------------------------------------
// Q600 — tuningProfileTransitionRuns
// ---------------------------------------------------------------------------

export function tuningProfileTransitionRuns(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { startIndex: number; length: number; profile: string; modes: Scale[] }[] {
  const profiles = tuningModeQuadrantProfile(tuning, spectrum, rootHz);
  if (profiles.length === 0) return [];
  const runs: { startIndex: number; length: number; profile: string; modes: Scale[] }[] = [];
  let runStart = 0;
  let runProfile = profiles[0]!.quadrantProfile;
  let runModes: Scale[] = [profiles[0]!.mode];
  for (let i = 1; i < profiles.length; i++) {
    const current = profiles[i]!;
    if (current.quadrantProfile === runProfile) {
      runModes.push(current.mode);
    } else {
      runs.push({
        startIndex: runStart,
        length: runModes.length,
        profile: runProfile,
        modes: [...runModes],
      });
      runStart = i;
      runProfile = current.quadrantProfile;
      runModes = [current.mode];
    }
  }
  runs.push({
    startIndex: runStart,
    length: runModes.length,
    profile: runProfile,
    modes: [...runModes],
  });
  return runs;
}

// ---------------------------------------------------------------------------
// Q601 — tuningProfileLongestRun
// ---------------------------------------------------------------------------

export function tuningProfileLongestRun(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { startIndex: number; length: number; profile: string; modes: Scale[] } | null {
  const runs = tuningProfileTransitionRuns(tuning, spectrum, rootHz);
  if (runs.length === 0) return null;
  return runs.reduce((best, run) => (run.length > best.length ? run : best), runs[0]!);
}

// ---------------------------------------------------------------------------
// Q602 — tuningProfileRunSummary
// ---------------------------------------------------------------------------

export function tuningProfileRunSummary(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  runCount: number;
  longestRun: number;
  shortestRun: number;
  meanRunLength: number;
  totalModes: number;
} {
  const runs = tuningProfileTransitionRuns(tuning, spectrum, rootHz);
  if (runs.length === 0)
    return { runCount: 0, longestRun: 0, shortestRun: 0, meanRunLength: 0, totalModes: 0 };
  const lengths = runs.map((r) => r.length);
  const longestRun = Math.max(...lengths);
  const shortestRun = Math.min(...lengths);
  const totalModes = lengths.reduce((s, l) => s + l, 0);
  const meanRunLength = totalModes / runs.length;
  return { runCount: runs.length, longestRun, shortestRun, meanRunLength, totalModes };
}

// ---------------------------------------------------------------------------
// Q604 — tuningFamilyProfileRunSummaries
// ---------------------------------------------------------------------------

export function tuningFamilyProfileRunSummaries(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; runSummary: ReturnType<typeof tuningProfileRunSummary> }[] {
  return tunings.map((t) => ({
    id: t.id,
    runSummary: tuningProfileRunSummary(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q605 — tuningFamilyProfileRunRanking
// ---------------------------------------------------------------------------

export function tuningFamilyProfileRunRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; runSummary: ReturnType<typeof tuningProfileRunSummary>; rank: number }[] {
  return tuningFamilyProfileRunSummaries(tunings, spectrum, rootHz)
    .slice()
    .sort((a, b) => b.runSummary.longestRun - a.runSummary.longestRun)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Q606 — tuningProfileRunSummaryNarrative
// ---------------------------------------------------------------------------

export function tuningProfileRunSummaryNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  runCount: number;
  longestRun: number;
  shortestRun: number;
  meanRunLength: number;
  totalModes: number;
  narrative: string;
} {
  const summary = tuningProfileRunSummary(tuning, spectrum, rootHz);
  const { runCount, longestRun, shortestRun, meanRunLength, totalModes } = summary;
  const texture =
    runCount === 1
      ? 'All modes share a single profile — maximum consistency.'
      : longestRun >= totalModes * 0.5
        ? 'One dominant profile region covers over half the modes.'
        : 'Profiles change frequently — high variety.';
  const narrative =
    `"${tuning.name}": ${runCount} profile run${runCount !== 1 ? 's' : ''} across ${totalModes} mode${totalModes !== 1 ? 's' : ''}. ` +
    `Longest: ${longestRun}, shortest: ${shortestRun}, mean: ${meanRunLength.toFixed(1)}. ${texture}`;
  return { ...summary, narrative };
}

// ---------------------------------------------------------------------------
// Q608 — tuningFamilyProfileRunSummaryNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyProfileRunSummaryNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; runNarrative: ReturnType<typeof tuningProfileRunSummaryNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    runNarrative: tuningProfileRunSummaryNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q609 — tuningProfileRunDensity
// ---------------------------------------------------------------------------

export function tuningProfileRunDensity(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  runCount: number;
  longestRun: number;
  shortestRun: number;
  meanRunLength: number;
  totalModes: number;
  changeDensity: number;
} {
  const summary = tuningProfileRunSummary(tuning, spectrum, rootHz);
  const changeDensity =
    summary.totalModes > 1 ? (summary.runCount - 1) / (summary.totalModes - 1) : 0;
  return { ...summary, changeDensity };
}

// ---------------------------------------------------------------------------
// Q611 — tuningFamilyProfileRunDensities
// ---------------------------------------------------------------------------

export function tuningFamilyProfileRunDensities(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; runDensity: ReturnType<typeof tuningProfileRunDensity> }[] {
  return tunings.map((t) => ({
    id: t.id,
    runDensity: tuningProfileRunDensity(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q612 — tuningFamilyProfileRunDensityRanking
// ---------------------------------------------------------------------------

export function tuningFamilyProfileRunDensityRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; runDensity: ReturnType<typeof tuningProfileRunDensity>; rank: number }[] {
  return tuningFamilyProfileRunDensities(tunings, spectrum, rootHz)
    .slice()
    .sort((a, b) => b.runDensity.changeDensity - a.runDensity.changeDensity)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Q613 — tuningFamilyMostChaoticProfileTransition
// ---------------------------------------------------------------------------

export function tuningFamilyMostChaoticProfileTransition(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; runDensity: ReturnType<typeof tuningProfileRunDensity>; rank: number } {
  const ranking = tuningFamilyProfileRunDensityRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('No tunings provided');
  return ranking[0]!;
}

// ---------------------------------------------------------------------------
// Q614 — tuningFamilyMostConsistentProfileTransition
// ---------------------------------------------------------------------------

export function tuningFamilyMostConsistentProfileTransition(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; runDensity: ReturnType<typeof tuningProfileRunDensity>; rank: number } {
  const ranking = tuningFamilyProfileRunDensityRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('No tunings provided');
  return ranking[ranking.length - 1]!;
}

// ---------------------------------------------------------------------------
// Q615 — tuningProfileRunDensityNarrative
// ---------------------------------------------------------------------------

export function tuningProfileRunDensityNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  runCount: number;
  longestRun: number;
  shortestRun: number;
  meanRunLength: number;
  totalModes: number;
  changeDensity: number;
  narrative: string;
} {
  const density = tuningProfileRunDensity(tuning, spectrum, rootHz);
  const { changeDensity, runCount, totalModes } = density;
  const level =
    changeDensity >= 0.7 ? 'chaotic' : changeDensity >= 0.4 ? 'moderately varied' : 'consistent';
  const narrative =
    `"${tuning.name}" profile change density: ${(changeDensity * 100).toFixed(1)}% of transitions — ${level}. ` +
    `${runCount} run${runCount !== 1 ? 's' : ''} across ${totalModes} mode${totalModes !== 1 ? 's' : ''}.`;
  return { ...density, narrative };
}

// ---------------------------------------------------------------------------
// Q617 — tuningFamilyProfileRunDensityNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyProfileRunDensityNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; densityNarrative: ReturnType<typeof tuningProfileRunDensityNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    densityNarrative: tuningProfileRunDensityNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q618 — tuningProfileTextureReport
// ---------------------------------------------------------------------------

export function tuningProfileTextureReport(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  coverage: ReturnType<typeof tuningQuadrantCoverage>;
  runSummary: ReturnType<typeof tuningProfileRunSummary>;
  transitionScore: ReturnType<typeof tuningProfileTransitionScore>;
  profileDiversity: ReturnType<typeof tuningQuadrantProfileDiversity>;
} {
  return {
    coverage: tuningQuadrantCoverage(tuning, spectrum, rootHz),
    runSummary: tuningProfileRunSummary(tuning, spectrum, rootHz),
    transitionScore: tuningProfileTransitionScore(tuning, spectrum, rootHz),
    profileDiversity: tuningQuadrantProfileDiversity(tuning, spectrum, rootHz),
  };
}

// ---------------------------------------------------------------------------
// Q620 — tuningFamilyProfileTextureReports
// ---------------------------------------------------------------------------

export function tuningFamilyProfileTextureReports(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; textureReport: ReturnType<typeof tuningProfileTextureReport> }[] {
  return tunings.map((t) => ({
    id: t.id,
    textureReport: tuningProfileTextureReport(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q621 — tuningProfileTextureReportNarrative
// ---------------------------------------------------------------------------

export function tuningProfileTextureReportNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningProfileTextureReport> & { narrative: string } {
  const report = tuningProfileTextureReport(tuning, spectrum, rootHz);
  const { coverage, runSummary, transitionScore, profileDiversity } = report;
  const narrative =
    `"${tuning.name}" texture: ${coverage.totalUniqueProfiles} unique quadrant profile${coverage.totalUniqueProfiles !== 1 ? 's' : ''} across ${coverage.totalModes} modes ` +
    `(distribution entropy: ${profileDiversity.normalized.toFixed(2)}). ` +
    `${runSummary.runCount} consecutive run${runSummary.runCount !== 1 ? 's' : ''}, longest ${runSummary.longestRun}. ` +
    `Transition stability: ${(transitionScore.stabilityScore * 100).toFixed(1)}%.`;
  return { ...report, narrative };
}

// ---------------------------------------------------------------------------
// Q623 — tuningFamilyProfileTextureReportNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyProfileTextureReportNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  textureReportNarrative: ReturnType<typeof tuningProfileTextureReportNarrative>;
}[] {
  return tunings.map((t) => ({
    id: t.id,
    textureReportNarrative: tuningProfileTextureReportNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q624 — tuningModeRarestProfileGroup
// ---------------------------------------------------------------------------

export function tuningModeRarestProfileGroup(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; modes: Scale[]; count: number } | null {
  const groups = tuningModeGroupByProfile(tuning, spectrum, rootHz);
  if (groups.length === 0) return null;
  return groups[groups.length - 1]!;
}

// ---------------------------------------------------------------------------
// Q626 — tuningModeSoloProfileModes
// ---------------------------------------------------------------------------

export function tuningModeSoloProfileModes(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): Scale[] {
  return tuningModeGroupByProfile(tuning, spectrum, rootHz)
    .filter((g) => g.count === 1)
    .flatMap((g) => g.modes);
}

// ---------------------------------------------------------------------------
// Q628 — tuningFamilyModeSoloProfileCounts
// ---------------------------------------------------------------------------

export function tuningFamilyModeSoloProfileCounts(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; soloModeCount: number; totalModes: number }[] {
  return tunings.map((t) => ({
    id: t.id,
    soloModeCount: tuningModeSoloProfileModes(t, spectrum, rootHz).length,
    totalModes: t.degrees.length,
  }));
}

// ---------------------------------------------------------------------------
// Q629 — tuningModeSoloProfileRatio
// ---------------------------------------------------------------------------

export function tuningModeSoloProfileRatio(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { soloModeCount: number; totalModes: number; soloRatio: number } {
  const soloModes = tuningModeSoloProfileModes(tuning, spectrum, rootHz);
  const totalModes = tuning.degrees.length;
  return {
    soloModeCount: soloModes.length,
    totalModes,
    soloRatio: totalModes > 0 ? soloModes.length / totalModes : 0,
  };
}

// ---------------------------------------------------------------------------
// Q630 — tuningFamilyModeSoloProfileRatios
// ---------------------------------------------------------------------------

export function tuningFamilyModeSoloProfileRatios(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; soloRatio: ReturnType<typeof tuningModeSoloProfileRatio> }[] {
  return tunings.map((t) => ({
    id: t.id,
    soloRatio: tuningModeSoloProfileRatio(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q631 — tuningFamilySoloProfileRatioRanking
// ---------------------------------------------------------------------------

export function tuningFamilySoloProfileRatioRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; soloRatio: ReturnType<typeof tuningModeSoloProfileRatio>; rank: number }[] {
  return tuningFamilyModeSoloProfileRatios(tunings, spectrum, rootHz)
    .slice()
    .sort((a, b) => b.soloRatio.soloRatio - a.soloRatio.soloRatio)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Q632 — tuningMostUniqueModesTuning
// ---------------------------------------------------------------------------

export function tuningMostUniqueModesTuning(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; soloRatio: ReturnType<typeof tuningModeSoloProfileRatio>; rank: number } {
  const ranking = tuningFamilySoloProfileRatioRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) throw new RangeError('No tunings provided');
  return ranking[0]!;
}

// ---------------------------------------------------------------------------
// Q633 — tuningModeSoloProfileNarrative
// ---------------------------------------------------------------------------

export function tuningModeSoloProfileNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { soloModeCount: number; totalModes: number; soloRatio: number; narrative: string } {
  const ratio = tuningModeSoloProfileRatio(tuning, spectrum, rootHz);
  const { soloModeCount, totalModes, soloRatio } = ratio;
  const level = soloRatio >= 0.7 ? 'high' : soloRatio >= 0.3 ? 'moderate' : 'low';
  const pct = (soloRatio * 100).toFixed(1);
  const narrative =
    `${soloModeCount} of ${totalModes} modes (${pct}%) in "${tuning.name}" have a unique quadrant profile — ` +
    `${level} mode individuality.`;
  return { ...ratio, narrative };
}

// ---------------------------------------------------------------------------
// Q635 — tuningFamilyModeSoloProfileNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyModeSoloProfileNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; soloNarrative: ReturnType<typeof tuningModeSoloProfileNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    soloNarrative: tuningModeSoloProfileNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q636 — tuningModeQuadrantIdentityBundle
// ---------------------------------------------------------------------------

export function tuningModeQuadrantIdentityBundle(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  mode: Scale;
  entropyDiversityQuadrant: string;
  consistencyVolatilityQuadrant: string;
  smoothnessEntropyQuadrant: string;
  diversityVolatilityQuadrant: string;
  quadrantProfile: string;
  quadrantVotes: Record<string, number>;
  dominantToken: string;
  consensus: 'versatile' | 'specialized' | 'balanced';
  isSoloProfile: boolean;
}[] {
  const allQuadrants = tuningModeQuadrantProfile(tuning, spectrum, rootHz);
  const consensusData = tuningModeQuadrantConsensus(tuning, spectrum, rootHz);
  const soloModeIds = new Set(
    tuningModeSoloProfileModes(tuning, spectrum, rootHz).map((m) => m.id),
  );
  const consensusMap = new Map(consensusData.map((e) => [e.mode.id, e]));
  return allQuadrants.map((entry) => {
    const con = consensusMap.get(entry.mode.id);
    return {
      ...entry,
      quadrantVotes: con?.quadrantVotes ?? {},
      dominantToken: con?.dominantToken ?? '',
      consensus: con?.consensus ?? 'balanced',
      isSoloProfile: soloModeIds.has(entry.mode.id),
    };
  });
}

// ---------------------------------------------------------------------------
// Q638 — tuningFamilyModeQuadrantIdentityBundles
// ---------------------------------------------------------------------------

export function tuningFamilyModeQuadrantIdentityBundles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; identityBundle: ReturnType<typeof tuningModeQuadrantIdentityBundle> }[] {
  return tunings.map((t) => ({
    id: t.id,
    identityBundle: tuningModeQuadrantIdentityBundle(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q639 — tuningModeQuadrantIdentityNarrative
// ---------------------------------------------------------------------------

export function tuningModeQuadrantIdentityNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): (ReturnType<typeof tuningModeQuadrantIdentityBundle>[number] & { narrative: string })[] {
  return tuningModeQuadrantIdentityBundle(tuning, spectrum, rootHz).map((entry) => {
    const { mode, quadrantProfile, dominantToken, consensus, isSoloProfile } = entry;
    const uniqueness = isSoloProfile ? 'unique fingerprint' : 'shared fingerprint';
    const narrative =
      `"${mode.name}": ${consensus} character, dominant token "${dominantToken}", ${uniqueness}. ` +
      `Profile: ${quadrantProfile}.`;
    return { ...entry, narrative };
  });
}

// ---------------------------------------------------------------------------
// Q641 — tuningFamilyModeQuadrantIdentityNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyModeQuadrantIdentityNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; identityNarratives: ReturnType<typeof tuningModeQuadrantIdentityNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    identityNarratives: tuningModeQuadrantIdentityNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q642 — tuningModeAmbassador
// ---------------------------------------------------------------------------

export function tuningModeAmbassador(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningModeQuadrantIdentityBundle>[number] {
  const bundle = tuningModeQuadrantIdentityBundle(tuning, spectrum, rootHz);
  if (bundle.length === 0) throw new RangeError('No modes in tuning');
  const dominantGroup = tuningDominantQuadrantProfile(tuning, spectrum, rootHz);
  const dominantProfile = dominantGroup?.profile ?? '';
  const dominantMatches = bundle.filter((e) => e.quadrantProfile === dominantProfile);
  const versatileAndDominant = dominantMatches.filter((e) => e.consensus === 'versatile');
  if (versatileAndDominant.length > 0) return versatileAndDominant[0]!;
  if (dominantMatches.length > 0) return dominantMatches[0]!;
  const versatile = bundle.filter((e) => e.consensus === 'versatile');
  if (versatile.length > 0) return versatile[0]!;
  return bundle[0]!;
}

// ---------------------------------------------------------------------------
// Q644 — tuningFamilyModeAmbassadors
// ---------------------------------------------------------------------------

export function tuningFamilyModeAmbassadors(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; ambassador: ReturnType<typeof tuningModeAmbassador> }[] {
  return tunings.map((t) => ({ id: t.id, ambassador: tuningModeAmbassador(t, spectrum, rootHz) }));
}

// ---------------------------------------------------------------------------
// Q645 — tuningModeAmbassadorNarrative
// ---------------------------------------------------------------------------

export function tuningModeAmbassadorNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningModeQuadrantIdentityBundle>[number] & { ambassadorNarrative: string } {
  const ambassador = tuningModeAmbassador(tuning, spectrum, rootHz);
  const { mode, quadrantProfile, consensus, isSoloProfile } = ambassador;
  const uniqueness = isSoloProfile ? 'unique profile' : 'dominant profile';
  const ambassadorNarrative =
    `Ambassador of "${tuning.name}": "${mode.name}" — ${consensus} character, ${uniqueness}. ` +
    `Fingerprint: ${quadrantProfile}.`;
  return { ...ambassador, ambassadorNarrative };
}

// ---------------------------------------------------------------------------
// Q647 — tuningFamilyModeAmbassadorNarratives
// ---------------------------------------------------------------------------

export function tuningFamilyModeAmbassadorNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; ambassadorNarrative: ReturnType<typeof tuningModeAmbassadorNarrative> }[] {
  return tunings.map((t) => ({
    id: t.id,
    ambassadorNarrative: tuningModeAmbassadorNarrative(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q648 — tuningFamilyAmbassadorRanking
// ---------------------------------------------------------------------------

const POSITIVE_TOKENS = new Set(['rich', 'complex', 'stable', 'consistent', 'fluid', 'diverse']);

function ambassadorScore(ambassador: ReturnType<typeof tuningModeAmbassador>): number {
  const { consensus, isSoloProfile, quadrantProfile } = ambassador;
  const consensusScore = consensus === 'versatile' ? 2 : consensus === 'balanced' ? 1 : 0;
  const soloBonus = isSoloProfile ? 0.5 : 0;
  const tokens = quadrantProfile.split(/[^a-z]+/).filter((t) => t.length > 0);
  const positiveTokenCount = tokens.filter((t) => POSITIVE_TOKENS.has(t)).length;
  return consensusScore + soloBonus + positiveTokenCount * 0.01;
}

export function tuningFamilyAmbassadorRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  ambassador: ReturnType<typeof tuningModeAmbassador>;
  score: number;
  rank: number;
}[] {
  const entries = tuningFamilyModeAmbassadors(tunings, spectrum, rootHz).map((e) => ({
    id: e.id,
    ambassador: e.ambassador,
    score: ambassadorScore(e.ambassador),
    rank: 0,
  }));
  entries.sort((a, b) => b.score - a.score);
  for (let i = 0; i < entries.length; i++) {
    entries[i]!.rank = i + 1;
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Q650 — tuningFamilyBestAmbassador
// ---------------------------------------------------------------------------

export function tuningFamilyBestAmbassador(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  ambassador: ReturnType<typeof tuningModeAmbassador>;
  score: number;
  rank: number;
} | null {
  return tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Q651 — tuningFamilyWeakestAmbassador
// ---------------------------------------------------------------------------

export function tuningFamilyWeakestAmbassador(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  ambassador: ReturnType<typeof tuningModeAmbassador>;
  score: number;
  rank: number;
} | null {
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  return ranking[ranking.length - 1] ?? null;
}

// ---------------------------------------------------------------------------
// Q652 — tuningFamilyAmbassadorRankingNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorRankingNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { ranking: ReturnType<typeof tuningFamilyAmbassadorRanking>; rankingNarrative: string } {
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  const entries = ranking
    .map(
      (e) =>
        `${e.rank}. "${e.id}" (${e.ambassador.mode.name}, ${e.ambassador.consensus}, score ${e.score.toFixed(2)})`,
    )
    .join(', ');
  const rankingNarrative = `Ambassador ranking across ${tunings.length} tunings: ${entries}`;
  return { ranking, rankingNarrative };
}

// ---------------------------------------------------------------------------
// Q654 — tuningFamilyAmbassadorScoreStats
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorScoreStats(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { min: number; max: number; mean: number; range: number; stdDev: number } {
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  if (ranking.length === 0) {
    return { min: 0, max: 0, mean: 0, range: 0, stdDev: 0 };
  }
  const scores = ranking.map((r) => r.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const range = max - min;
  const stdDev = Math.sqrt(scores.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n);
  return { min, max, mean, range, stdDev };
}

// ---------------------------------------------------------------------------
// Q656 — tuningFamilyAmbassadorGap
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorGap(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  best: ReturnType<typeof tuningFamilyBestAmbassador>;
  weakest: ReturnType<typeof tuningFamilyWeakestAmbassador>;
  scoreDiff: number;
} | null {
  const best = tuningFamilyBestAmbassador(tunings, spectrum, rootHz);
  const weakest = tuningFamilyWeakestAmbassador(tunings, spectrum, rootHz);
  if (best === null && weakest === null) {
    return null;
  }
  const scoreDiff = (best?.score ?? 0) - (weakest?.score ?? 0);
  return { best, weakest, scoreDiff };
}

// ---------------------------------------------------------------------------
// Q657 — tuningFamilyAmbassadorScoreStatsNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorScoreStatsNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { stats: ReturnType<typeof tuningFamilyAmbassadorScoreStats>; statsNarrative: string } {
  const stats = tuningFamilyAmbassadorScoreStats(tunings, spectrum, rootHz);
  let statsNarrative: string;
  if (tunings.length === 0) {
    statsNarrative = 'No tunings to compare.';
  } else {
    statsNarrative = `Ambassador score stats across ${tunings.length} tunings — mean: ${stats.mean.toFixed(2)}, range: ${stats.range.toFixed(2)}, stdDev: ${stats.stdDev.toFixed(2)}.`;
    if (stats.stdDev < 0.1) {
      statsNarrative += ' Scores are tightly clustered.';
    } else if (stats.stdDev > 0.5) {
      statsNarrative += ' Scores are highly dispersed.';
    }
  }
  return { stats, statsNarrative };
}

// ---------------------------------------------------------------------------
// Q660 — tuningFamilyAmbassadorConsensusDistribution
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConsensusDistribution(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { versatile: number; balanced: number; specialized: number; total: number } {
  const ambassadors = tuningFamilyModeAmbassadors(tunings, spectrum, rootHz);
  let versatile = 0;
  let balanced = 0;
  let specialized = 0;
  for (const { ambassador } of ambassadors) {
    if (ambassador.consensus === 'versatile') versatile++;
    else if (ambassador.consensus === 'balanced') balanced++;
    else if (ambassador.consensus === 'specialized') specialized++;
  }
  return { versatile, balanced, specialized, total: tunings.length };
}

// ---------------------------------------------------------------------------
// Q662 — tuningFamilyAmbassadorConsensusDistributionNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConsensusDistributionNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  distribution: ReturnType<typeof tuningFamilyAmbassadorConsensusDistribution>;
  distributionNarrative: string;
} {
  const distribution = tuningFamilyAmbassadorConsensusDistribution(tunings, spectrum, rootHz);
  const { versatile, balanced, specialized, total } = distribution;
  let distributionNarrative: string;
  if (total === 0) {
    distributionNarrative = 'No tunings to analyze.';
  } else {
    distributionNarrative = `Ambassador consensus across ${total} tunings: ${versatile} versatile, ${balanced} balanced, ${specialized} specialized.`;
    if (versatile === total) {
      distributionNarrative += ' All ambassadors are versatile.';
    } else if (specialized === total) {
      distributionNarrative += ' All ambassadors are specialized.';
    } else if (versatile > balanced && versatile > specialized) {
      distributionNarrative += ' Versatile ambassadors dominate.';
    } else if (specialized > balanced && specialized > versatile) {
      distributionNarrative += ' Specialized ambassadors dominate.';
    }
  }
  return { distribution, distributionNarrative };
}

// ---------------------------------------------------------------------------
// Q663 — tuningFamilyAmbassadorProfileFrequency
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorProfileFrequency(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; count: number; tuningIds: string[] }[] {
  const ambassadors = tuningFamilyModeAmbassadors(tunings, spectrum, rootHz);
  const profileMap = new Map<string, string[]>();
  for (const { id, ambassador } of ambassadors) {
    const profile = ambassador.quadrantProfile;
    const existing = profileMap.get(profile);
    if (existing !== undefined) {
      existing.push(id);
    } else {
      profileMap.set(profile, [id]);
    }
  }
  return Array.from(profileMap.entries())
    .map(([profile, tuningIds]) => ({ profile, count: tuningIds.length, tuningIds }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Q665 — tuningFamilyMostCommonAmbassadorProfile
// ---------------------------------------------------------------------------

export function tuningFamilyMostCommonAmbassadorProfile(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; count: number; tuningIds: string[] } | null {
  return tuningFamilyAmbassadorProfileFrequency(tunings, spectrum, rootHz)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Q666 — tuningFamilyLeastCommonAmbassadorProfile
// ---------------------------------------------------------------------------

export function tuningFamilyLeastCommonAmbassadorProfile(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; count: number; tuningIds: string[] } | null {
  const freq = tuningFamilyAmbassadorProfileFrequency(tunings, spectrum, rootHz);
  return freq[freq.length - 1] ?? null;
}

// ---------------------------------------------------------------------------
// Q668 — tuningFamilyUniqueAmbassadorProfiles
// ---------------------------------------------------------------------------

export function tuningFamilyUniqueAmbassadorProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { profile: string; tuningId: string }[] {
  const freq = tuningFamilyAmbassadorProfileFrequency(tunings, spectrum, rootHz);
  return freq
    .filter((entry) => entry.count === 1)
    .map((entry) => ({ profile: entry.profile, tuningId: entry.tuningIds[0]! }));
}

// ---------------------------------------------------------------------------
// Q669 — tuningFamilyAmbassadorConsensusScore
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConsensusScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { score: number; maxScore: number; normalizedScore: number } {
  const { versatile, balanced, specialized, total } = tuningFamilyAmbassadorConsensusDistribution(
    tunings,
    spectrum,
    rootHz,
  );
  const score = versatile * 2 + balanced * 1 + specialized * 0;
  const maxScore = total * 2;
  const normalizedScore = maxScore > 0 ? score / maxScore : 0;
  return { score, maxScore, normalizedScore };
}

// ---------------------------------------------------------------------------
// Q671 — tuningFamilyAmbassadorConsensusScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConsensusScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  consensusScore: ReturnType<typeof tuningFamilyAmbassadorConsensusScore>;
  scoreNarrative: string;
} {
  const consensusScore = tuningFamilyAmbassadorConsensusScore(tunings, spectrum, rootHz);
  const { score, maxScore, normalizedScore } = consensusScore;
  const total = maxScore / 2;
  let scoreNarrative: string;
  if (total === 0) {
    scoreNarrative = 'No tunings to score.';
  } else {
    scoreNarrative = `Ambassador consensus score: ${score}/${maxScore} (${(normalizedScore * 100).toFixed(0)}%).`;
    if (normalizedScore >= 0.75) {
      scoreNarrative += ' The family is predominantly versatile.';
    } else if (normalizedScore >= 0.4) {
      scoreNarrative += ' The family shows mixed versatility.';
    } else {
      scoreNarrative += ' The family leans specialized.';
    }
  }
  return { consensusScore, scoreNarrative };
}

// ---------------------------------------------------------------------------
// Q672 — tuningFamilyAmbassadorReport
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorReport(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  ranking: ReturnType<typeof tuningFamilyAmbassadorRanking>;
  scoreStats: ReturnType<typeof tuningFamilyAmbassadorScoreStats>;
  consensusScore: ReturnType<typeof tuningFamilyAmbassadorConsensusScore>;
  profileFrequency: ReturnType<typeof tuningFamilyAmbassadorProfileFrequency>;
  mostCommonProfile: ReturnType<typeof tuningFamilyMostCommonAmbassadorProfile>;
  uniqueProfiles: ReturnType<typeof tuningFamilyUniqueAmbassadorProfiles>;
} {
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  const scoreStats = tuningFamilyAmbassadorScoreStats(tunings, spectrum, rootHz);
  const consensusScore = tuningFamilyAmbassadorConsensusScore(tunings, spectrum, rootHz);
  const profileFrequency = tuningFamilyAmbassadorProfileFrequency(tunings, spectrum, rootHz);
  const mostCommonProfile = tuningFamilyMostCommonAmbassadorProfile(tunings, spectrum, rootHz);
  const uniqueProfiles = tuningFamilyUniqueAmbassadorProfiles(tunings, spectrum, rootHz);
  return {
    ranking,
    scoreStats,
    consensusScore,
    profileFrequency,
    mostCommonProfile,
    uniqueProfiles,
  };
}

// ---------------------------------------------------------------------------
// Q674 — tuningFamilyAmbassadorReportNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorReportNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { report: ReturnType<typeof tuningFamilyAmbassadorReport>; reportNarrative: string } {
  const report = tuningFamilyAmbassadorReport(tunings, spectrum, rootHz);
  const { statsNarrative } = tuningFamilyAmbassadorScoreStatsNarrative(tunings, spectrum, rootHz);
  const { scoreNarrative } = tuningFamilyAmbassadorConsensusScoreNarrative(
    tunings,
    spectrum,
    rootHz,
  );
  let reportNarrative: string;
  if (tunings.length === 0) {
    reportNarrative = 'No tunings in family.';
  } else {
    reportNarrative = `Ambassador family report (${tunings.length} tunings): ${scoreNarrative} ${statsNarrative}`;
    if (report.uniqueProfiles.length > 0) {
      reportNarrative += ` ${report.uniqueProfiles.length} tuning(s) have unique ambassador profiles.`;
    }
  }
  return { report, reportNarrative };
}

// ---------------------------------------------------------------------------
// Q676 — tuningFamilyAmbassadorOverlapScore
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorOverlapScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { sharedCount: number; uniqueCount: number; total: number; overlapScore: number } {
  const freq = tuningFamilyAmbassadorProfileFrequency(tunings, spectrum, rootHz);
  let sharedCount = 0;
  let uniqueCount = 0;
  for (const entry of freq) {
    if (entry.count > 1) {
      sharedCount += entry.count;
    } else {
      uniqueCount++;
    }
  }
  const total = tunings.length;
  const overlapScore = total > 0 ? sharedCount / total : 0;
  return { sharedCount, uniqueCount, total, overlapScore };
}

// ---------------------------------------------------------------------------
// Q678 — tuningFamilyAmbassadorOverlapScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorOverlapScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  overlapScore: ReturnType<typeof tuningFamilyAmbassadorOverlapScore>;
  overlapNarrative: string;
} {
  const overlapScore = tuningFamilyAmbassadorOverlapScore(tunings, spectrum, rootHz);
  let overlapNarrative: string;
  if (overlapScore.total === 0) {
    overlapNarrative = 'No tunings to compare.';
  } else {
    const { sharedCount, total } = overlapScore;
    overlapNarrative = `Ambassador profile overlap: ${sharedCount}/${total} tunings share a profile with at least one other (overlap score: ${(overlapScore.overlapScore * 100).toFixed(0)}%).`;
    if (overlapScore.overlapScore >= 0.75) {
      overlapNarrative +=
        ' High convergence — most tunings cluster around common ambassador profiles.';
    } else if (overlapScore.overlapScore >= 0.4) {
      overlapNarrative += ' Moderate overlap across the family.';
    } else {
      overlapNarrative += ' Most tunings have distinctive ambassador profiles.';
    }
  }
  return { overlapScore, overlapNarrative };
}

// ---------------------------------------------------------------------------
// Q680 — tuningPairAmbassadorSimilarity
// ---------------------------------------------------------------------------

export function tuningPairAmbassadorSimilarity(
  tuningA: TuningSystem,
  tuningB: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { profileA: string; profileB: string; sameProfile: boolean; sameConsensus: boolean } {
  const ambassadorA = tuningModeAmbassador(tuningA, spectrum, rootHz);
  const ambassadorB = tuningModeAmbassador(tuningB, spectrum, rootHz);
  const profileA = ambassadorA.quadrantProfile;
  const profileB = ambassadorB.quadrantProfile;
  const sameProfile = profileA === profileB;
  const sameConsensus = ambassadorA.consensus === ambassadorB.consensus;
  return { profileA, profileB, sameProfile, sameConsensus };
}

// ---------------------------------------------------------------------------
// Q681 — tuningFamilyAmbassadorSimilarityMatrix
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorSimilarityMatrix(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  idA: string;
  idB: string;
  profileA: string;
  profileB: string;
  sameProfile: boolean;
  sameConsensus: boolean;
}[] {
  const result: {
    idA: string;
    idB: string;
    profileA: string;
    profileB: string;
    sameProfile: boolean;
    sameConsensus: boolean;
  }[] = [];
  for (let i = 0; i < tunings.length; i++) {
    for (let j = i + 1; j < tunings.length; j++) {
      const tA = tunings[i];
      const tB = tunings[j];
      if (!tA || !tB) continue;
      const similarity = tuningPairAmbassadorSimilarity(tA, tB, spectrum, rootHz);
      result.push({ idA: tA.id, idB: tB.id, ...similarity });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Q682 — tuningFamilyAmbassadorConvergenceScore
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConvergenceScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { samePairs: number; totalPairs: number; convergenceScore: number } {
  const matrix = tuningFamilyAmbassadorSimilarityMatrix(tunings, spectrum, rootHz);
  const totalPairs = matrix.length;
  const samePairs = matrix.filter((p) => p.sameProfile).length;
  const convergenceScore = totalPairs > 0 ? samePairs / totalPairs : 0;
  return { samePairs, totalPairs, convergenceScore };
}

// ---------------------------------------------------------------------------
// Q684 — tuningFamilyMostSimilarAmbassadorPair
// ---------------------------------------------------------------------------

export function tuningFamilyMostSimilarAmbassadorPair(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilyAmbassadorSimilarityMatrix>[number] | null {
  const matrix = tuningFamilyAmbassadorSimilarityMatrix(tunings, spectrum, rootHz);
  if (matrix.length === 0) return null;
  const bothMatch = matrix.find((p) => p.sameProfile && p.sameConsensus);
  if (bothMatch !== undefined) return bothMatch;
  const profileMatch = matrix.find((p) => p.sameProfile);
  if (profileMatch !== undefined) return profileMatch;
  return matrix[0] ?? null;
}

// ---------------------------------------------------------------------------
// Q685 — tuningFamilyLeastSimilarAmbassadorPair
// ---------------------------------------------------------------------------

export function tuningFamilyLeastSimilarAmbassadorPair(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilyAmbassadorSimilarityMatrix>[number] | null {
  const matrix = tuningFamilyAmbassadorSimilarityMatrix(tunings, spectrum, rootHz);
  if (matrix.length === 0) return null;
  const neitherMatch = matrix.find((p) => !p.sameProfile && !p.sameConsensus);
  if (neitherMatch !== undefined) return neitherMatch;
  const noProfileMatch = matrix.find((p) => !p.sameProfile);
  if (noProfileMatch !== undefined) return noProfileMatch;
  return matrix[matrix.length - 1] ?? null;
}

// ---------------------------------------------------------------------------
// Q686 — tuningFamilyAmbassadorConvergenceScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConvergenceScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  convergenceScore: ReturnType<typeof tuningFamilyAmbassadorConvergenceScore>;
  convergenceNarrative: string;
} {
  const convergenceScore = tuningFamilyAmbassadorConvergenceScore(tunings, spectrum, rootHz);
  let convergenceNarrative: string;
  if (convergenceScore.totalPairs === 0) {
    convergenceNarrative = 'No pairs to compare.';
  } else {
    convergenceNarrative = `Ambassador convergence: ${convergenceScore.samePairs}/${convergenceScore.totalPairs} pairs share the same profile (convergence score: ${(convergenceScore.convergenceScore * 100).toFixed(0)}%).`;
    if (convergenceScore.convergenceScore >= 0.75) {
      convergenceNarrative += ' Strong convergence — tunings share ambassador character.';
    } else if (convergenceScore.convergenceScore >= 0.4) {
      convergenceNarrative += ' Moderate convergence.';
    } else {
      convergenceNarrative += ' Low convergence — tunings have distinct ambassador characters.';
    }
  }
  return { convergenceScore, convergenceNarrative };
}

// ---------------------------------------------------------------------------
// Q688 — tuningFamilyAmbassadorConsensusConvergenceScore
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConsensusConvergenceScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { samePairs: number; totalPairs: number; convergenceScore: number } {
  const matrix = tuningFamilyAmbassadorSimilarityMatrix(tunings, spectrum, rootHz);
  const totalPairs = matrix.length;
  const samePairs = matrix.filter((p) => p.sameConsensus).length;
  const convergenceScore = totalPairs > 0 ? samePairs / totalPairs : 0;
  return { samePairs, totalPairs, convergenceScore };
}

// ---------------------------------------------------------------------------
// Q690 — tuningFamilyAmbassadorConsensusConvergenceScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConsensusConvergenceScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  consensusConvergenceScore: ReturnType<typeof tuningFamilyAmbassadorConsensusConvergenceScore>;
  consensusConvergenceNarrative: string;
} {
  const consensusConvergenceScore = tuningFamilyAmbassadorConsensusConvergenceScore(
    tunings,
    spectrum,
    rootHz,
  );
  let consensusConvergenceNarrative: string;
  if (consensusConvergenceScore.totalPairs === 0) {
    consensusConvergenceNarrative = 'No pairs to compare.';
  } else {
    consensusConvergenceNarrative = `Consensus convergence: ${consensusConvergenceScore.samePairs}/${consensusConvergenceScore.totalPairs} pairs share the same ambassador consensus (${(consensusConvergenceScore.convergenceScore * 100).toFixed(0)}%).`;
    if (consensusConvergenceScore.convergenceScore >= 0.75) {
      consensusConvergenceNarrative += ' Tunings strongly agree on ambassador character type.';
    } else if (consensusConvergenceScore.convergenceScore >= 0.4) {
      consensusConvergenceNarrative += ' Moderate consensus alignment.';
    } else {
      consensusConvergenceNarrative += ' Tunings diverge in ambassador character type.';
    }
  }
  return { consensusConvergenceScore, consensusConvergenceNarrative };
}

// ---------------------------------------------------------------------------
// Q692 — tuningFamilyAmbassadorConvergenceBundle
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConvergenceBundle(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  profileConvergence: ReturnType<typeof tuningFamilyAmbassadorConvergenceScore>;
  consensusConvergence: ReturnType<typeof tuningFamilyAmbassadorConsensusConvergenceScore>;
} {
  return {
    profileConvergence: tuningFamilyAmbassadorConvergenceScore(tunings, spectrum, rootHz),
    consensusConvergence: tuningFamilyAmbassadorConsensusConvergenceScore(
      tunings,
      spectrum,
      rootHz,
    ),
  };
}

// ---------------------------------------------------------------------------
// Q694 — tuningFamilyAmbassadorConvergenceBundleNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorConvergenceBundleNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  bundle: ReturnType<typeof tuningFamilyAmbassadorConvergenceBundle>;
  bundleNarrative: string;
} {
  const bundle = tuningFamilyAmbassadorConvergenceBundle(tunings, spectrum, rootHz);
  let bundleNarrative: string;
  if (tunings.length === 0) {
    bundleNarrative = 'No tunings in family.';
  } else {
    const profileNarrative = tuningFamilyAmbassadorConvergenceScoreNarrative(
      tunings,
      spectrum,
      rootHz,
    ).convergenceNarrative;
    const consensusNarrative = tuningFamilyAmbassadorConsensusConvergenceScoreNarrative(
      tunings,
      spectrum,
      rootHz,
    ).consensusConvergenceNarrative;
    bundleNarrative = profileNarrative + ' ' + consensusNarrative;
  }
  return { bundle, bundleNarrative };
}

// ---------------------------------------------------------------------------
// Q696 — tuningAmbassadorProfileDistance
// ---------------------------------------------------------------------------

export function tuningAmbassadorProfileDistance(
  tuningA: TuningSystem,
  tuningB: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): number {
  const profileA = tuningModeAmbassador(tuningA, spectrum, rootHz).quadrantProfile;
  const profileB = tuningModeAmbassador(tuningB, spectrum, rootHz).quadrantProfile;
  const labelsA = profileA.split('|');
  const labelsB = profileB.split('|');
  let distance = 0;
  for (let i = 0; i < 4; i++) {
    if (labelsA[i] !== labelsB[i]) distance++;
  }
  return distance;
}

// ---------------------------------------------------------------------------
// Q697 — tuningFamilyAmbassadorProfileDistanceMatrix
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorProfileDistanceMatrix(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { idA: string; idB: string; distance: number }[] {
  const result: { idA: string; idB: string; distance: number }[] = [];
  for (let i = 0; i < tunings.length; i++) {
    for (let j = i + 1; j < tunings.length; j++) {
      const tA = tunings[i];
      const tB = tunings[j];
      if (!tA || !tB) continue;
      const distance = tuningAmbassadorProfileDistance(tA, tB, spectrum, rootHz);
      result.push({ idA: tA.id, idB: tB.id, distance });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Q698 — tuningFamilyAmbassadorMeanProfileDistance
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorMeanProfileDistance(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { meanDistance: number; totalPairs: number; maxPossible: number } {
  const matrix = tuningFamilyAmbassadorProfileDistanceMatrix(tunings, spectrum, rootHz);
  const totalPairs = matrix.length;
  const meanDistance = totalPairs > 0 ? matrix.reduce((s, p) => s + p.distance, 0) / totalPairs : 0;
  const maxPossible = 4;
  return { meanDistance, totalPairs, maxPossible };
}

// ---------------------------------------------------------------------------
// Q700 — tuningFamilyAmbassadorMeanProfileDistanceNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorMeanProfileDistanceNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  distanceStats: ReturnType<typeof tuningFamilyAmbassadorMeanProfileDistance>;
  distanceNarrative: string;
} {
  const distanceStats = tuningFamilyAmbassadorMeanProfileDistance(tunings, spectrum, rootHz);
  const { meanDistance, totalPairs } = distanceStats;
  let distanceNarrative: string;
  if (totalPairs === 0) {
    distanceNarrative = 'No pairs to compare.';
  } else {
    distanceNarrative = `Mean ambassador profile distance: ${meanDistance.toFixed(2)}/4 across ${totalPairs} pairs.`;
    if (meanDistance < 1) {
      distanceNarrative += ' Tunings share very similar ambassador profiles.';
    } else if (meanDistance < 2.5) {
      distanceNarrative += ' Moderate profile divergence.';
    } else {
      distanceNarrative += ' Tunings have highly diverse ambassador profiles.';
    }
  }
  return { distanceStats, distanceNarrative };
}

// ---------------------------------------------------------------------------
// Q702 — tuningFamilyAmbassadorProfileDistanceStats
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorProfileDistanceStats(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { min: number; max: number; range: number; mean: number; stdDev: number; totalPairs: number } {
  const matrix = tuningFamilyAmbassadorProfileDistanceMatrix(tunings, spectrum, rootHz);
  if (matrix.length === 0) {
    return { min: 0, max: 0, range: 0, mean: 0, stdDev: 0, totalPairs: 0 };
  }
  const distances = matrix.map((p) => p.distance);
  const min = Math.min(...distances);
  const max = Math.max(...distances);
  const range = max - min;
  const n = distances.length;
  const mean = distances.reduce((s, d) => s + d, 0) / n;
  const stdDev = Math.sqrt(distances.reduce((s, d) => s + (d - mean) ** 2, 0) / n);
  return { min, max, range, mean, stdDev, totalPairs: n };
}

// ---------------------------------------------------------------------------
// Q704 — tuningFamilyMostDistantAmbassadorPair
// ---------------------------------------------------------------------------

export function tuningFamilyMostDistantAmbassadorPair(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilyAmbassadorProfileDistanceMatrix>[number] | null {
  const matrix = tuningFamilyAmbassadorProfileDistanceMatrix(tunings, spectrum, rootHz);
  if (matrix.length === 0) return null;
  let best = matrix[0]!;
  for (let i = 1; i < matrix.length; i++) {
    const entry = matrix[i]!;
    if (entry.distance > best.distance) best = entry;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Q705 — tuningFamilyAmbassadorCentralityScores
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorCentralityScores(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; meanDistanceToOthers: number; rank: number }[] {
  const matrix = tuningFamilyAmbassadorProfileDistanceMatrix(tunings, spectrum, rootHz);
  const scores = tunings.map((t) => {
    const relevant = matrix.filter((p) => p.idA === t.id || p.idB === t.id);
    const meanDistanceToOthers =
      relevant.length > 0 ? relevant.reduce((s, p) => s + p.distance, 0) / relevant.length : 0;
    return { id: t.id, meanDistanceToOthers };
  });
  scores.sort((a, b) => a.meanDistanceToOthers - b.meanDistanceToOthers);
  return scores.map((s, i) => ({ ...s, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Q706 — tuningFamilyAmbassadorCentrality
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorCentrality(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; meanDistanceToOthers: number; rank: number } | null {
  return tuningFamilyAmbassadorCentralityScores(tunings, spectrum, rootHz)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Q708 — tuningFamilyAmbassadorOutlier
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorOutlier(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilyAmbassadorCentralityScores>[number] | null {
  const scores = tuningFamilyAmbassadorCentralityScores(tunings, spectrum, rootHz);
  return scores[scores.length - 1] ?? null;
}

// ---------------------------------------------------------------------------
// Q710 — tuningFamilyAmbassadorCentralityNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorCentralityNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  scores: ReturnType<typeof tuningFamilyAmbassadorCentralityScores>;
  centralityNarrative: string;
} {
  const scores = tuningFamilyAmbassadorCentralityScores(tunings, spectrum, rootHz);
  let centralityNarrative: string;
  if (scores.length === 0) {
    centralityNarrative = 'No tunings to analyze.';
  } else if (scores.length === 1) {
    centralityNarrative = `Single tuning "${scores[0]!.id}" — no centrality comparison possible.`;
  } else {
    const central = scores[0]!;
    const outlier = scores[scores.length - 1]!;
    centralityNarrative = `Most central: "${central.id}" (mean distance ${central.meanDistanceToOthers.toFixed(2)}). Most outlying: "${outlier.id}" (mean distance ${outlier.meanDistanceToOthers.toFixed(2)}).`;
  }
  return { scores, centralityNarrative };
}

// ---------------------------------------------------------------------------
// Q712 — tuningFamilyAmbassadorDistanceSpread
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorDistanceSpread(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  central: ReturnType<typeof tuningFamilyAmbassadorCentrality>;
  outlier: ReturnType<typeof tuningFamilyAmbassadorOutlier>;
  spread: number;
} | null {
  const central = tuningFamilyAmbassadorCentrality(tunings, spectrum, rootHz);
  const outlier = tuningFamilyAmbassadorOutlier(tunings, spectrum, rootHz);
  if (central === null && outlier === null) return null;
  const spread = (outlier?.meanDistanceToOthers ?? 0) - (central?.meanDistanceToOthers ?? 0);
  return { central, outlier, spread };
}

// ---------------------------------------------------------------------------
// Q714 — tuningFamilyAmbassadorDistanceSpreadNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorDistanceSpreadNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { spread: ReturnType<typeof tuningFamilyAmbassadorDistanceSpread>; spreadNarrative: string } {
  const spread = tuningFamilyAmbassadorDistanceSpread(tunings, spectrum, rootHz);
  let spreadNarrative: string;
  if (spread === null) {
    spreadNarrative = 'No spread to compute (0 or 1 tunings).';
  } else if (spread.spread === 0) {
    spreadNarrative =
      'All tunings are equidistant in ambassador profile space — no clear center or outlier.';
  } else {
    spreadNarrative = `Ambassador profile spread: ${spread.spread.toFixed(2)} (central: "${spread.central?.id ?? 'none'}", outlier: "${spread.outlier?.id ?? 'none'}").`;
    if (spread.spread < 1) {
      spreadNarrative += ' Tight cluster — tunings are closely related.';
    } else if (spread.spread < 2) {
      spreadNarrative += ' Moderate spread.';
    } else {
      spreadNarrative += ' Wide spread — tunings occupy very different profile regions.';
    }
  }
  return { spread, spreadNarrative };
}

// ---------------------------------------------------------------------------
// Q716 — tuningFamilyFullAmbassadorAnalytics
// ---------------------------------------------------------------------------

export function tuningFamilyFullAmbassadorAnalytics(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  report: ReturnType<typeof tuningFamilyAmbassadorReport>;
  convergenceBundle: ReturnType<typeof tuningFamilyAmbassadorConvergenceBundle>;
  centralityNarrative: ReturnType<typeof tuningFamilyAmbassadorCentralityNarrative>;
  distanceStats: ReturnType<typeof tuningFamilyAmbassadorProfileDistanceStats>;
  distanceSpread: ReturnType<typeof tuningFamilyAmbassadorDistanceSpread>;
} {
  const report = tuningFamilyAmbassadorReport(tunings, spectrum, rootHz);
  const convergenceBundle = tuningFamilyAmbassadorConvergenceBundle(tunings, spectrum, rootHz);
  const centralityNarrative = tuningFamilyAmbassadorCentralityNarrative(tunings, spectrum, rootHz);
  const distanceStats = tuningFamilyAmbassadorProfileDistanceStats(tunings, spectrum, rootHz);
  const distanceSpread = tuningFamilyAmbassadorDistanceSpread(tunings, spectrum, rootHz);
  return { report, convergenceBundle, centralityNarrative, distanceStats, distanceSpread };
}

// ---------------------------------------------------------------------------
// Q718 — tuningFamilyFullAmbassadorAnalyticsNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyFullAmbassadorAnalyticsNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  analytics: ReturnType<typeof tuningFamilyFullAmbassadorAnalytics>;
  analyticsNarrative: string;
} {
  const analytics = tuningFamilyFullAmbassadorAnalytics(tunings, spectrum, rootHz);
  let analyticsNarrative: string;
  if (tunings.length === 0) {
    analyticsNarrative = 'No tunings in family.';
  } else {
    const reportNarrative = tuningFamilyAmbassadorReportNarrative(
      tunings,
      spectrum,
      rootHz,
    ).reportNarrative;
    const bundleNarrative = tuningFamilyAmbassadorConvergenceBundleNarrative(
      tunings,
      spectrum,
      rootHz,
    ).bundleNarrative;
    const spreadNarrative = tuningFamilyAmbassadorDistanceSpreadNarrative(
      tunings,
      spectrum,
      rootHz,
    ).spreadNarrative;
    analyticsNarrative = [reportNarrative, bundleNarrative, spreadNarrative].join(' ');
  }
  return { analytics, analyticsNarrative };
}

// ---------------------------------------------------------------------------
// Q720 — tuningFamilyAmbassadorsSummaryTable
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorsSummaryTable(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  ambassadorModeName: string;
  profile: string;
  consensus: string;
  score: number;
  rank: number;
}[] {
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  return ranking.map((r) => ({
    id: r.id,
    ambassadorModeName: r.ambassador.mode.name,
    profile: r.ambassador.quadrantProfile,
    consensus: r.ambassador.consensus,
    score: r.score,
    rank: r.rank,
  }));
}

// ---------------------------------------------------------------------------
// Q722 — tuningFamilyAmbassadorsSummaryNarrative
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorsSummaryNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { table: ReturnType<typeof tuningFamilyAmbassadorsSummaryTable>; summaryNarrative: string } {
  const table = tuningFamilyAmbassadorsSummaryTable(tunings, spectrum, rootHz);
  let summaryNarrative: string;
  if (table.length === 0) {
    summaryNarrative = 'No tunings to summarize.';
  } else {
    const lines: string[] = [`Ambassador summary (${table.length} tunings):`];
    for (const entry of table) {
      lines.push(
        `  ${entry.rank}. ${entry.id} — ${entry.ambassadorModeName} (${entry.consensus}, score: ${entry.score.toFixed(2)})`,
      );
    }
    summaryNarrative = lines.join('\n');
  }
  return { table, summaryNarrative };
}

// ---------------------------------------------------------------------------
// Q724 — tuningFamilyAmbassadorTopN
// ---------------------------------------------------------------------------

export function tuningFamilyAmbassadorTopN(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  n: number,
  rootHz?: number,
): ReturnType<typeof tuningFamilyAmbassadorRanking> {
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  return ranking.slice(0, n);
}

// ---------------------------------------------------------------------------
// Q726 — tuningSocraticProfile
// ---------------------------------------------------------------------------

export function tuningSocraticProfile(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  ambassador: ReturnType<typeof tuningModeAmbassador>;
  dominantProfile: ReturnType<typeof tuningDominantQuadrantProfile>;
  profileDiversity: ReturnType<typeof tuningQuadrantProfileDiversity>;
  soloRatio: ReturnType<typeof tuningModeSoloProfileRatio>;
  textureReport: ReturnType<typeof tuningProfileTextureReport>;
} {
  return {
    ambassador: tuningModeAmbassador(tuning, spectrum, rootHz),
    dominantProfile: tuningDominantQuadrantProfile(tuning, spectrum, rootHz),
    profileDiversity: tuningQuadrantProfileDiversity(tuning, spectrum, rootHz),
    soloRatio: tuningModeSoloProfileRatio(tuning, spectrum, rootHz),
    textureReport: tuningProfileTextureReport(tuning, spectrum, rootHz),
  };
}

// ---------------------------------------------------------------------------
// Q728 — tuningSocraticProfileNarrative
// ---------------------------------------------------------------------------

export function tuningSocraticProfileNarrative(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { profile: ReturnType<typeof tuningSocraticProfile>; socraticNarrative: string } {
  const profile = tuningSocraticProfile(tuning, spectrum, rootHz);
  const socraticNarrative =
    `Character of "${tuning.name}":` +
    ` Ambassador: ${profile.ambassador.mode.name} (${profile.ambassador.consensus}, ${profile.ambassador.quadrantProfile}).` +
    ` Dominant profile: ${profile.dominantProfile?.profile ?? 'none'}.` +
    ` Profile diversity: ${profile.profileDiversity.normalized.toFixed(2)} (${profile.profileDiversity.profileCount} profiles / ${profile.profileDiversity.totalModes} modes).` +
    ` Solo ratio: ${profile.soloRatio.soloRatio.toFixed(2)}.`;
  return { profile, socraticNarrative };
}

// ---------------------------------------------------------------------------
// Q730 — tuningFamilySocraticProfiles
// ---------------------------------------------------------------------------

export function tuningFamilySocraticProfiles(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; socraticProfile: ReturnType<typeof tuningSocraticProfile> }[] {
  return tunings.map((t) => ({
    id: t.id,
    socraticProfile: tuningSocraticProfile(t, spectrum, rootHz),
  }));
}

// ---------------------------------------------------------------------------
// Q732 — tuningFamilySocraticProfileNarratives
// ---------------------------------------------------------------------------

export function tuningFamilySocraticProfileNarratives(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; socraticNarrative: string }[] {
  return tunings.map((t) => ({
    id: t.id,
    socraticNarrative: tuningSocraticProfileNarrative(t, spectrum, rootHz).socraticNarrative,
  }));
}

// ---------------------------------------------------------------------------
// Q734 — tuningFamilySocraticComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticComparison(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  mostDiverse: string | null;
  leastDiverse: string | null;
  mostUnique: string | null;
  mostVersatile: string | null;
} {
  const profiles = tuningFamilySocraticProfiles(tunings, spectrum, rootHz);
  if (profiles.length === 0) {
    return { mostDiverse: null, leastDiverse: null, mostUnique: null, mostVersatile: null };
  }

  const mostDiverse = profiles.reduce((best, cur) =>
    cur.socraticProfile.profileDiversity.normalized >
    best.socraticProfile.profileDiversity.normalized
      ? cur
      : best,
  ).id;

  const leastDiverse = profiles.reduce((best, cur) =>
    cur.socraticProfile.profileDiversity.normalized <
    best.socraticProfile.profileDiversity.normalized
      ? cur
      : best,
  ).id;

  const mostUnique = profiles.reduce((best, cur) =>
    cur.socraticProfile.soloRatio.soloRatio > best.socraticProfile.soloRatio.soloRatio ? cur : best,
  ).id;

  const versatileEntry = profiles.find(
    (p) => p.socraticProfile.ambassador.consensus === 'versatile',
  );
  const mostVersatile = versatileEntry !== undefined ? versatileEntry.id : null;

  return { mostDiverse, leastDiverse, mostUnique, mostVersatile };
}

// ---------------------------------------------------------------------------
// Q736 — tuningFamilySocraticComparisonNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticComparisonNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  comparison: ReturnType<typeof tuningFamilySocraticComparison>;
  comparisonNarrative: string;
} {
  const comparison = tuningFamilySocraticComparison(tunings, spectrum, rootHz);
  const { mostDiverse, leastDiverse, mostUnique, mostVersatile } = comparison;

  if (
    mostDiverse === null &&
    leastDiverse === null &&
    mostUnique === null &&
    mostVersatile === null
  ) {
    return { comparison, comparisonNarrative: 'No tunings to compare.' };
  }

  const lines: string[] = [`Family comparison (${tunings.length} tunings):`];
  if (mostDiverse !== null) lines.push(`  Most diverse: ${mostDiverse}.`);
  if (leastDiverse !== null) lines.push(`  Least diverse: ${leastDiverse}.`);
  if (mostUnique !== null) lines.push(`  Most unique modes: ${mostUnique}.`);
  if (mostVersatile !== null) {
    lines.push(`  Most versatile ambassador: ${mostVersatile}.`);
  } else {
    lines.push('  No versatile ambassadors found.');
  }

  return { comparison, comparisonNarrative: lines.join('\n') };
}

// ---------------------------------------------------------------------------
// Q738 — tuningFamilySocraticInsight
// ---------------------------------------------------------------------------

export function tuningFamilySocraticInsight(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  profiles: ReturnType<typeof tuningFamilySocraticProfiles>;
  comparison: ReturnType<typeof tuningFamilySocraticComparison>;
} {
  return {
    profiles: tuningFamilySocraticProfiles(tunings, spectrum, rootHz),
    comparison: tuningFamilySocraticComparison(tunings, spectrum, rootHz),
  };
}

// ---------------------------------------------------------------------------
// Q740 — tuningFamilySocraticInsightNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticInsightNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticInsight> & { insightNarrative: string } {
  const insight = tuningFamilySocraticInsight(tunings, spectrum, rootHz);
  if (tunings.length === 0) {
    return { ...insight, insightNarrative: 'No tunings to analyze.' };
  }
  const { comparisonNarrative } = tuningFamilySocraticComparisonNarrative(
    tunings,
    spectrum,
    rootHz,
  );
  const narratives = tuningFamilySocraticProfileNarratives(tunings, spectrum, rootHz);
  const profileLines = narratives.map((n) => `  [${n.id}]: ${n.socraticNarrative}`).join('\n');
  const insightNarrative = `Family insight (${tunings.length} tunings):\n${comparisonNarrative}\n\nProfile summaries:\n${profileLines}`;
  return { ...insight, insightNarrative };
}

// ---------------------------------------------------------------------------
// Q742 — tuningSocraticContrast
// ---------------------------------------------------------------------------

export function tuningSocraticContrast(
  tuningA: TuningSystem,
  tuningB: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): {
  profileA: ReturnType<typeof tuningSocraticProfile>;
  profileB: ReturnType<typeof tuningSocraticProfile>;
  distance: number;
  sameConsensus: boolean;
  sameProfile: boolean;
} {
  const profileA = tuningSocraticProfile(tuningA, spectrum, rootHz);
  const profileB = tuningSocraticProfile(tuningB, spectrum, rootHz);
  const distance = tuningAmbassadorProfileDistance(tuningA, tuningB, spectrum, rootHz);
  const sameConsensus = profileA.ambassador.consensus === profileB.ambassador.consensus;
  const sameProfile = profileA.ambassador.quadrantProfile === profileB.ambassador.quadrantProfile;
  return { profileA, profileB, distance, sameConsensus, sameProfile };
}

// ---------------------------------------------------------------------------
// Q744 — tuningSocraticContrastNarrative
// ---------------------------------------------------------------------------

export function tuningSocraticContrastNarrative(
  tuningA: TuningSystem,
  tuningB: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningSocraticContrast> & { contrastNarrative: string } {
  const contrast = tuningSocraticContrast(tuningA, tuningB, spectrum, rootHz);
  const contrastNarrative =
    `Contrast: ${tuningA.id} vs ${tuningB.id}\n` +
    `  Profile A: ${contrast.profileA.dominantProfile} (${contrast.profileA.ambassador.consensus})\n` +
    `  Profile B: ${contrast.profileB.dominantProfile} (${contrast.profileB.ambassador.consensus})\n` +
    `  Distance: ${contrast.distance}/4\n` +
    `  Same quadrant profile: ${contrast.sameProfile}.\n` +
    `  Same consensus: ${contrast.sameConsensus}.`;
  return { ...contrast, contrastNarrative };
}

// ---------------------------------------------------------------------------
// Q746 — tuningFamilySocraticRecommendation
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRecommendation(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  recommendedId: string | null;
  reason: 'most-versatile' | 'most-central' | 'first' | null;
  alternativeId: string | null;
} {
  if (tunings.length === 0) {
    return { recommendedId: null, reason: null, alternativeId: null };
  }
  const comparison = tuningFamilySocraticComparison(tunings, spectrum, rootHz);
  const centrality = tuningFamilyAmbassadorCentrality(tunings, spectrum, rootHz);

  let recommendedId: string | null;
  let reason: 'most-versatile' | 'most-central' | 'first' | null;
  let alternativeId: string | null;

  if (comparison.mostVersatile !== null) {
    recommendedId = comparison.mostVersatile;
    reason = 'most-versatile';
    alternativeId =
      centrality !== null && centrality.id !== recommendedId
        ? centrality.id
        : (tunings.find((t) => t.id !== recommendedId)?.id ?? null);
  } else if (centrality !== null) {
    recommendedId = centrality.id;
    reason = 'most-central';
    alternativeId = tunings.find((t) => t.id !== recommendedId)?.id ?? null;
  } else {
    recommendedId = tunings[0]!.id;
    reason = 'first';
    alternativeId = tunings[1]?.id ?? null;
  }

  return { recommendedId, reason, alternativeId };
}

// ---------------------------------------------------------------------------
// Q748 — tuningFamilySocraticRecommendationNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRecommendationNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticRecommendation> & { recommendationNarrative: string } {
  const rec = tuningFamilySocraticRecommendation(tunings, spectrum, rootHz);
  const recommendationNarrative =
    tunings.length === 0
      ? 'No tunings available for recommendation.'
      : `Recommendation for family of ${tunings.length} tunings:\n` +
        `  Recommended: ${rec.recommendedId ?? 'none'} (${rec.reason ?? 'n/a'}).\n` +
        `  Alternative: ${rec.alternativeId ?? 'none'}.`;
  return { ...rec, recommendationNarrative };
}

// ---------------------------------------------------------------------------
// Q750 — tuningFamilySocraticPairwiseContrasts
// ---------------------------------------------------------------------------

export function tuningFamilySocraticPairwiseContrasts(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { idA: string; idB: string; distance: number; sameConsensus: boolean; sameProfile: boolean }[] {
  const results: {
    idA: string;
    idB: string;
    distance: number;
    sameConsensus: boolean;
    sameProfile: boolean;
  }[] = [];
  for (let i = 0; i < tunings.length; i++) {
    for (let j = i + 1; j < tunings.length; j++) {
      const { distance, sameConsensus, sameProfile } = tuningSocraticContrast(
        tunings[i]!,
        tunings[j]!,
        spectrum,
        rootHz,
      );
      results.push({
        idA: tunings[i]!.id,
        idB: tunings[j]!.id,
        distance,
        sameConsensus,
        sameProfile,
      });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Q752 — tuningFamilySocraticPairwiseContrastStats
// ---------------------------------------------------------------------------

export function tuningFamilySocraticPairwiseContrastStats(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  totalPairs: number;
  meanDistance: number;
  minDistance: number;
  maxDistance: number;
  sameConsensusCount: number;
  sameProfileCount: number;
} {
  const contrasts = tuningFamilySocraticPairwiseContrasts(tunings, spectrum, rootHz);
  if (contrasts.length === 0) {
    return {
      totalPairs: 0,
      meanDistance: 0,
      minDistance: 0,
      maxDistance: 0,
      sameConsensusCount: 0,
      sameProfileCount: 0,
    };
  }
  const totalPairs = contrasts.length;
  const distances = contrasts.map((c) => c.distance);
  const meanDistance = distances.reduce((s, d) => s + d, 0) / totalPairs;
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const sameConsensusCount = contrasts.filter((c) => c.sameConsensus).length;
  const sameProfileCount = contrasts.filter((c) => c.sameProfile).length;
  return {
    totalPairs,
    meanDistance,
    minDistance,
    maxDistance,
    sameConsensusCount,
    sameProfileCount,
  };
}

// ---------------------------------------------------------------------------
// Q754 — tuningFamilySocraticPairwiseContrastStatsNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticPairwiseContrastStatsNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticPairwiseContrastStats> & {
  contrastStatsNarrative: string;
} {
  const stats = tuningFamilySocraticPairwiseContrastStats(tunings, spectrum, rootHz);
  const contrastStatsNarrative =
    stats.totalPairs === 0
      ? 'No pairwise contrasts to analyze.'
      : `Pairwise contrast stats (${stats.totalPairs} pairs): mean distance ${stats.meanDistance.toFixed(2)}/4, range ${stats.minDistance}–${stats.maxDistance}. ${stats.sameConsensusCount} pairs share consensus; ${stats.sameProfileCount} share the same quadrant profile.`;
  return { ...stats, contrastStatsNarrative };
}

// ---------------------------------------------------------------------------
// Q756 — tuningFamilySocraticDiversityIndex
// ---------------------------------------------------------------------------

export function tuningFamilySocraticDiversityIndex(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  diversityIndex: number;
  meanDistNorm: number;
  antiConvergence: number;
} {
  if (tunings.length < 2) {
    return { diversityIndex: 0, meanDistNorm: 0, antiConvergence: 0 };
  }
  const mpdResult = tuningFamilyAmbassadorMeanProfileDistance(tunings, spectrum, rootHz);
  const convResult = tuningFamilyAmbassadorConvergenceScore(tunings, spectrum, rootHz);
  const meanDistNorm = mpdResult.meanDistance / 4;
  const antiConvergence = 1 - convResult.convergenceScore;
  const diversityIndex = (meanDistNorm + antiConvergence) / 2;
  return { diversityIndex, meanDistNorm, antiConvergence };
}

// ---------------------------------------------------------------------------
// Q758 — tuningFamilySocraticDiversityIndexNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticDiversityIndexNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticDiversityIndex> & { diversityIndexNarrative: string } {
  const idx = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  let label: string;
  if (idx.diversityIndex < 0.25) {
    label = 'homogeneous';
  } else if (idx.diversityIndex < 0.5) {
    label = 'varied';
  } else if (idx.diversityIndex < 0.75) {
    label = 'diverse';
  } else {
    label = 'heterogeneous';
  }
  const diversityIndexNarrative =
    tunings.length < 2
      ? 'Diversity index requires at least 2 tunings.'
      : `Diversity index: ${idx.diversityIndex.toFixed(3)} (${label}) for ${tunings.length} tunings. Mean profile distance: ${(idx.meanDistNorm * 4).toFixed(2)}/4; anti-convergence: ${idx.antiConvergence.toFixed(3)}.`;
  return { ...idx, diversityIndexNarrative };
}

// ---------------------------------------------------------------------------
// Q760 — tuningFamilySocraticEvolutionRanking
// ---------------------------------------------------------------------------

export function tuningFamilySocraticEvolutionRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  id: string;
  evolutionRank: number;
  evolutionLabel: 'traditional' | 'transitional' | 'experimental';
}[] {
  if (tunings.length === 0) return [];
  const scores = tuningFamilyAmbassadorCentralityScores(tunings, spectrum, rootHz);
  const n = scores.length;
  return scores.map((entry, index) => {
    let evolutionLabel: 'traditional' | 'transitional' | 'experimental';
    if (index < Math.floor(n / 3)) {
      evolutionLabel = 'traditional';
    } else if (index < Math.floor((2 * n) / 3)) {
      evolutionLabel = 'transitional';
    } else {
      evolutionLabel = 'experimental';
    }
    return { id: entry.id, evolutionRank: index + 1, evolutionLabel };
  });
}

// ---------------------------------------------------------------------------
// Q762 — tuningFamilySocraticEvolutionRankingNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticEvolutionRankingNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  ranking: {
    id: string;
    evolutionRank: number;
    evolutionLabel: 'traditional' | 'transitional' | 'experimental';
  }[];
  evolutionNarrative: string;
} {
  const ranking = tuningFamilySocraticEvolutionRanking(tunings, spectrum, rootHz);
  let evolutionNarrative: string;
  if (ranking.length === 0) {
    evolutionNarrative = 'No tunings to rank.';
  } else {
    evolutionNarrative =
      `Evolution ranking (${tunings.length} tunings, traditional→experimental):\n` +
      ranking.map((r) => `  ${r.evolutionRank}. [${r.evolutionLabel}] ${r.id}`).join('\n');
  }
  return { ranking, evolutionNarrative };
}

// ---------------------------------------------------------------------------
// Q764 — tuningFamilySocraticClusterMap
// ---------------------------------------------------------------------------

export function tuningFamilySocraticClusterMap(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  traditional: string[];
  transitional: string[];
  experimental: string[];
} {
  const ranking = tuningFamilySocraticEvolutionRanking(tunings, spectrum, rootHz);
  const traditional = ranking.filter((r) => r.evolutionLabel === 'traditional').map((r) => r.id);
  const transitional = ranking.filter((r) => r.evolutionLabel === 'transitional').map((r) => r.id);
  const experimental = ranking.filter((r) => r.evolutionLabel === 'experimental').map((r) => r.id);
  return { traditional, transitional, experimental };
}

// ---------------------------------------------------------------------------
// Q766 — tuningFamilySocraticClusterMapNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticClusterMapNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticClusterMap> & { clusterMapNarrative: string } {
  const map = tuningFamilySocraticClusterMap(tunings, spectrum, rootHz);
  const clusterMapNarrative =
    tunings.length === 0
      ? 'No tunings to cluster.'
      : `Cluster map (${tunings.length} tunings):\n  Traditional (${map.traditional.length}): ${map.traditional.join(', ') || 'none'}\n  Transitional (${map.transitional.length}): ${map.transitional.join(', ') || 'none'}\n  Experimental (${map.experimental.length}): ${map.experimental.join(', ') || 'none'}`;
  return { ...map, clusterMapNarrative };
}

// ---------------------------------------------------------------------------
// Q768 — tuningFamilySocraticTopologyScore
// ---------------------------------------------------------------------------

export function tuningFamilySocraticTopologyScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  topologyScore: number;
  topologyLabel: 'centralized' | 'distributed' | 'dispersed';
} {
  const spread = tuningFamilyAmbassadorDistanceSpread(tunings, spectrum, rootHz);
  if (spread === null) {
    return { topologyScore: 0, topologyLabel: 'centralized' };
  }
  const topologyScore = spread.spread / 4;
  const topologyLabel: 'centralized' | 'distributed' | 'dispersed' =
    topologyScore < 0.25 ? 'centralized' : topologyScore < 0.6 ? 'distributed' : 'dispersed';
  return { topologyScore, topologyLabel };
}

// ---------------------------------------------------------------------------
// Q770 — tuningFamilySocraticTopologyScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticTopologyScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticTopologyScore> & { topologyNarrative: string } {
  const topo = tuningFamilySocraticTopologyScore(tunings, spectrum, rootHz);
  let topologyNarrative: string;
  if (tunings.length < 2) {
    topologyNarrative = 'Topology requires at least 2 tunings.';
  } else {
    topologyNarrative = `Topology: ${topo.topologyLabel} (score ${topo.topologyScore.toFixed(3)}). The tuning family's ambassador profiles are ${topo.topologyLabel === 'centralized' ? 'tightly clustered' : topo.topologyLabel === 'distributed' ? 'moderately spread' : 'widely dispersed'}.`;
  }
  return { ...topo, topologyNarrative };
}

// ---------------------------------------------------------------------------
// Q772 — tuningFamilySocraticSummaryBundle
// ---------------------------------------------------------------------------

export function tuningFamilySocraticSummaryBundle(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  clusterMap: ReturnType<typeof tuningFamilySocraticClusterMap>;
  comparison: ReturnType<typeof tuningFamilySocraticComparison>;
  recommendation: ReturnType<typeof tuningFamilySocraticRecommendation>;
} {
  const clusterMap = tuningFamilySocraticClusterMap(tunings, spectrum, rootHz);
  const comparison = tuningFamilySocraticComparison(tunings, spectrum, rootHz);
  const recommendation = tuningFamilySocraticRecommendation(tunings, spectrum, rootHz);
  return { clusterMap, comparison, recommendation };
}

// ---------------------------------------------------------------------------
// Q774 — tuningFamilySocraticSummaryBundleNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticSummaryBundleNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticSummaryBundle> & { summaryBundleNarrative: string } {
  const bundle = tuningFamilySocraticSummaryBundle(tunings, spectrum, rootHz);
  let summaryBundleNarrative: string;
  if (tunings.length === 0) {
    summaryBundleNarrative = 'No tunings to summarize.';
  } else {
    summaryBundleNarrative = `Summary (${tunings.length} tunings):\n  Recommended: ${bundle.recommendation.recommendedId ?? 'none'} (${bundle.recommendation.reason ?? 'n/a'}).\n  Most diverse: ${bundle.comparison.mostDiverse ?? 'n/a'}; least diverse: ${bundle.comparison.leastDiverse ?? 'n/a'}.\n  Clusters — traditional: ${bundle.clusterMap.traditional.length}, transitional: ${bundle.clusterMap.transitional.length}, experimental: ${bundle.clusterMap.experimental.length}.`;
  }
  return { ...bundle, summaryBundleNarrative };
}

// ---------------------------------------------------------------------------
// Q776 — tuningSocraticCharacterPortrait
// ---------------------------------------------------------------------------

export function tuningSocraticCharacterPortrait(
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
): { portrait: string } {
  const profile = tuningSocraticProfile(tuning, spectrum, rootHz);
  const amb = profile.ambassador;
  const ambScore = ambassadorScore(amb);
  const portrait = `${tuning.name} [${tuning.id}]: ${amb.mode.name} ambassador (${amb.consensus}, score ${ambScore.toFixed(2)}). Profile: ${profile.dominantProfile?.profile ?? 'none'}. Texture: ${amb.quadrantProfile}. Profile diversity: ${profile.profileDiversity.normalized.toFixed(3)}; solo ratio: ${profile.soloRatio.soloRatio.toFixed(3)}.`;
  return { portrait };
}

// ---------------------------------------------------------------------------
// Q778 — tuningFamilySocraticCharacterPortraits
// ---------------------------------------------------------------------------

export function tuningFamilySocraticCharacterPortraits(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; portrait: string }[] {
  return tunings.map((tuning) => ({
    id: tuning.id,
    portrait: tuningSocraticCharacterPortrait(tuning, spectrum, rootHz).portrait,
  }));
}

// ---------------------------------------------------------------------------
// Q780 — tuningFamilySocraticFamilyPortrait
// ---------------------------------------------------------------------------

export function tuningFamilySocraticFamilyPortrait(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { familyPortrait: string } {
  if (tunings.length === 0) {
    return { familyPortrait: 'Empty family.' };
  }
  const diversity = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  const topology = tuningFamilySocraticTopologyScore(tunings, spectrum, rootHz);
  const rec = tuningFamilySocraticRecommendation(tunings, spectrum, rootHz);
  const familyPortrait = `A family of ${tunings.length} tunings. Diversity: ${diversity.diversityIndex.toFixed(3)} (${topology.topologyLabel}). Flagship: ${rec.recommendedId ?? 'none'} (${rec.reason ?? 'n/a'}). Alternative: ${rec.alternativeId ?? 'none'}.`;
  return { familyPortrait };
}

// ---------------------------------------------------------------------------
// Q782 — tuningFamilySocraticInsightDigest
// ---------------------------------------------------------------------------

export function tuningFamilySocraticInsightDigest(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  familyPortrait: string;
  diversityIndex: number;
  topologyLabel: 'centralized' | 'distributed' | 'dispersed';
  evolutionRanking: {
    id: string;
    evolutionRank: number;
    evolutionLabel: 'traditional' | 'transitional' | 'experimental';
  }[];
  comparison: ReturnType<typeof tuningFamilySocraticComparison>;
  recommendation: ReturnType<typeof tuningFamilySocraticRecommendation>;
  characterPortraits: { id: string; portrait: string }[];
} {
  const { familyPortrait } = tuningFamilySocraticFamilyPortrait(tunings, spectrum, rootHz);
  const { diversityIndex } = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  const { topologyLabel } = tuningFamilySocraticTopologyScore(tunings, spectrum, rootHz);
  const evolutionRanking = tuningFamilySocraticEvolutionRanking(tunings, spectrum, rootHz);
  const comparison = tuningFamilySocraticComparison(tunings, spectrum, rootHz);
  const recommendation = tuningFamilySocraticRecommendation(tunings, spectrum, rootHz);
  const characterPortraits = tuningFamilySocraticCharacterPortraits(tunings, spectrum, rootHz);
  return {
    familyPortrait,
    diversityIndex,
    topologyLabel,
    evolutionRanking,
    comparison,
    recommendation,
    characterPortraits,
  };
}

// ---------------------------------------------------------------------------
// Q784 — tuningFamilySocraticInsightDigestNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticInsightDigestNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticInsightDigest> & { digestNarrative: string } {
  const digest = tuningFamilySocraticInsightDigest(tunings, spectrum, rootHz);
  let digestNarrative: string;
  if (tunings.length === 0) {
    digestNarrative = 'No tunings to digest.';
  } else {
    digestNarrative =
      `${digest.familyPortrait}\n\nEvolution:\n` +
      digest.evolutionRanking
        .map((r) => `  ${r.evolutionRank}. [${r.evolutionLabel}] ${r.id}`)
        .join('\n') +
      `\n\nPortraits:\n` +
      digest.characterPortraits.map((p) => `  ${p.portrait}`).join('\n');
  }
  return { ...digest, digestNarrative };
}

// ---------------------------------------------------------------------------
// Q786 — tuningFamilySocraticAxisAnalysis
// ---------------------------------------------------------------------------

export function tuningFamilySocraticAxisAnalysis(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { id: string; diversityScore: number; ambassadorScore: number }[] {
  const profiles = tuningFamilySocraticProfiles(tunings, spectrum, rootHz);
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  const scoreMap = new Map<string, number>(ranking.map((r) => [r.id, r.score]));
  return profiles.map((p) => ({
    id: p.id,
    diversityScore: p.socraticProfile.profileDiversity.normalized,
    ambassadorScore: scoreMap.get(p.id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Q788 — tuningFamilySocraticAxisNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticAxisNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  axes: { id: string; diversityScore: number; ambassadorScore: number }[];
  axisNarrative: string;
} {
  const axes = tuningFamilySocraticAxisAnalysis(tunings, spectrum, rootHz);
  if (axes.length === 0) {
    return { axes: [], axisNarrative: 'No tunings to analyze.' };
  }
  const midX = 0.5;
  const midY = axes.reduce((s, a) => s + a.ambassadorScore, 0) / axes.length;
  const highDiv_highScore = axes.filter(
    (a) => a.diversityScore >= midX && a.ambassadorScore >= midY,
  ).length;
  const highDiv_lowScore = axes.filter(
    (a) => a.diversityScore >= midX && a.ambassadorScore < midY,
  ).length;
  const lowDiv_highScore = axes.filter(
    (a) => a.diversityScore < midX && a.ambassadorScore >= midY,
  ).length;
  const lowDiv_lowScore = axes.filter(
    (a) => a.diversityScore < midX && a.ambassadorScore < midY,
  ).length;
  const axisNarrative = `Axis analysis (${tunings.length} tunings, diversity × ambassador score):\n  High-diversity/high-score: ${highDiv_highScore}\n  High-diversity/low-score: ${highDiv_lowScore}\n  Low-diversity/high-score: ${lowDiv_highScore}\n  Low-diversity/low-score: ${lowDiv_lowScore}`;
  return { axes, axisNarrative };
}

// ---------------------------------------------------------------------------
// Q790 — tuningFamilySocraticSignature
// ---------------------------------------------------------------------------

export function tuningFamilySocraticSignature(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { signature: string } {
  if (tunings.length === 0) {
    return { signature: 'empty' };
  }
  const div = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  const topo = tuningFamilySocraticTopologyScore(tunings, spectrum, rootHz);
  const rec = tuningFamilySocraticRecommendation(tunings, spectrum, rootHz);
  const signature = `n:${tunings.length};d:${div.diversityIndex.toFixed(2)};t:${topo.topologyLabel[0]!.toUpperCase()};r:${rec.recommendedId ?? 'none'}`;
  return { signature };
}

// ---------------------------------------------------------------------------
// Q792 — tuningFamilySocraticBenchmark
// ---------------------------------------------------------------------------

export function tuningFamilySocraticBenchmark(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  benchmarkScore: number;
  diversityComponent: number;
  topologyComponent: number;
  consensusComponent: number;
} {
  if (tunings.length === 0) {
    return {
      benchmarkScore: 0,
      diversityComponent: 0,
      topologyComponent: 0,
      consensusComponent: 0,
    };
  }
  const div = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  const topo = tuningFamilySocraticTopologyScore(tunings, spectrum, rootHz);
  const cons = tuningFamilyAmbassadorConsensusScore(tunings, spectrum, rootHz);
  const diversityComponent = div.diversityIndex;
  const topologyComponent =
    topo.topologyLabel === 'distributed' ? 1.0 : topo.topologyLabel === 'centralized' ? 0.3 : 0.5;
  const consensusComponent = cons.normalizedScore;
  const benchmarkScore = (diversityComponent + topologyComponent + consensusComponent) / 3;
  return { benchmarkScore, diversityComponent, topologyComponent, consensusComponent };
}

// ---------------------------------------------------------------------------
// Q794 — tuningFamilySocraticBenchmarkNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticBenchmarkNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticBenchmark> & { benchmarkNarrative: string } {
  const bench = tuningFamilySocraticBenchmark(tunings, spectrum, rootHz);
  let benchmarkNarrative: string;
  if (tunings.length === 0) {
    benchmarkNarrative = 'No tunings to benchmark.';
  } else {
    const label =
      bench.benchmarkScore < 0.25
        ? 'low'
        : bench.benchmarkScore < 0.5
          ? 'moderate'
          : bench.benchmarkScore < 0.75
            ? 'high'
            : 'excellent';
    benchmarkNarrative = `Benchmark (${tunings.length} tunings): ${bench.benchmarkScore.toFixed(3)} (${label}). Diversity: ${bench.diversityComponent.toFixed(3)}, topology: ${bench.topologyComponent.toFixed(3)}, consensus: ${bench.consensusComponent.toFixed(3)}.`;
  }
  return { ...bench, benchmarkNarrative };
}

// ---------------------------------------------------------------------------
// Q796 — tuningFamilySocraticSignatureComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticSignatureComparison(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  signatureA: string;
  signatureB: string;
  sameSize: boolean;
  sameDiversity: boolean;
  sameTopology: boolean;
} {
  const sigA = tuningFamilySocraticSignature(familyA, spectrum, rootHz);
  const sigB = tuningFamilySocraticSignature(familyB, spectrum, rootHz);
  const sameSize = familyA.length === familyB.length;
  const divA = tuningFamilySocraticDiversityIndex(familyA, spectrum, rootHz);
  const divB = tuningFamilySocraticDiversityIndex(familyB, spectrum, rootHz);
  const sameDiversity = Math.abs(divA.diversityIndex - divB.diversityIndex) < 0.05;
  const topoA = tuningFamilySocraticTopologyScore(familyA, spectrum, rootHz);
  const topoB = tuningFamilySocraticTopologyScore(familyB, spectrum, rootHz);
  const sameTopology = topoA.topologyLabel === topoB.topologyLabel;
  return {
    signatureA: sigA.signature,
    signatureB: sigB.signature,
    sameSize,
    sameDiversity,
    sameTopology,
  };
}

// ---------------------------------------------------------------------------
// Q798 — tuningFamilySocraticSignatureComparisonNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticSignatureComparisonNarrative(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticSignatureComparison> & {
  signatureComparisonNarrative: string;
} {
  const comp = tuningFamilySocraticSignatureComparison(familyA, familyB, spectrum, rootHz);
  let signatureComparisonNarrative: string;
  if (familyA.length === 0 && familyB.length === 0) {
    signatureComparisonNarrative = 'Both families are empty.';
  } else {
    signatureComparisonNarrative = `Signature comparison: [${comp.signatureA}] vs [${comp.signatureB}]. Same size: ${comp.sameSize}. Same diversity: ${comp.sameDiversity}. Same topology: ${comp.sameTopology}.`;
  }
  return { ...comp, signatureComparisonNarrative };
}

// ---------------------------------------------------------------------------
// Q800 — tuningFamilySocraticConsensusNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticConsensusNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  distribution: ReturnType<typeof tuningFamilyAmbassadorConsensusDistribution>;
  socraticConsensusNarrative: string;
} {
  const dist = tuningFamilyAmbassadorConsensusDistribution(tunings, spectrum, rootHz);
  let socraticConsensusNarrative: string;
  if (dist.total === 0) {
    socraticConsensusNarrative = 'No modes to assess consensus.';
  } else {
    const dominantType: 'versatile' | 'balanced' | 'specialized' =
      dist.versatile > dist.balanced && dist.versatile > dist.specialized
        ? 'versatile'
        : dist.balanced > dist.specialized
          ? 'balanced'
          : 'specialized';
    socraticConsensusNarrative = `Consensus character: ${dominantType}-dominant (${dist.versatile} versatile, ${dist.balanced} balanced, ${dist.specialized} specialized across ${dist.total} modes).`;
  }
  return { distribution: dist, socraticConsensusNarrative };
}

// ---------------------------------------------------------------------------
// Q802 — tuningFamilySocraticBenchmarkComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticBenchmarkComparison(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  benchmarkA: number;
  benchmarkB: number;
  delta: number;
  winner: 'A' | 'B' | 'tie';
} {
  const bA = tuningFamilySocraticBenchmark(familyA, spectrum, rootHz);
  const bB = tuningFamilySocraticBenchmark(familyB, spectrum, rootHz);
  const delta = bA.benchmarkScore - bB.benchmarkScore;
  const winner: 'A' | 'B' | 'tie' = Math.abs(delta) < 0.01 ? 'tie' : delta > 0 ? 'A' : 'B';
  return { benchmarkA: bA.benchmarkScore, benchmarkB: bB.benchmarkScore, delta, winner };
}

// ---------------------------------------------------------------------------
// Q804 — tuningFamilySocraticBenchmarkComparisonNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticBenchmarkComparisonNarrative(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticBenchmarkComparison> & {
  benchmarkComparisonNarrative: string;
} {
  const comp = tuningFamilySocraticBenchmarkComparison(familyA, familyB, spectrum, rootHz);
  const benchmarkComparisonNarrative = `Benchmark comparison: A=${comp.benchmarkA.toFixed(3)} vs B=${comp.benchmarkB.toFixed(3)}. Delta: ${comp.delta.toFixed(3)}. Winner: ${comp.winner}.`;
  return { ...comp, benchmarkComparisonNarrative };
}

// ---------------------------------------------------------------------------
// Q806 — tuningFamilySocraticBestAndWorst
// ---------------------------------------------------------------------------

export function tuningFamilySocraticBestAndWorst(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { bestId: string | null; bestScore: number; worstId: string | null; worstScore: number } {
  if (tunings.length === 0) {
    return { bestId: null, bestScore: 0, worstId: null, worstScore: 0 };
  }
  const scores = tunings.map((t) => ({
    id: t.id,
    score: tuningFamilySocraticBenchmark([t], spectrum, rootHz).benchmarkScore,
  }));
  const best = scores.reduce((acc, curr) => (curr.score > acc.score ? curr : acc), scores[0]!);
  const worst = scores.reduce((acc, curr) => (curr.score < acc.score ? curr : acc), scores[0]!);
  return { bestId: best.id, bestScore: best.score, worstId: worst.id, worstScore: worst.score };
}

// ---------------------------------------------------------------------------
// Q808 — tuningFamilySocraticBestAndWorstNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticBestAndWorstNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticBestAndWorst> & { bestAndWorstNarrative: string } {
  const bw = tuningFamilySocraticBestAndWorst(tunings, spectrum, rootHz);
  let bestAndWorstNarrative: string;
  if (tunings.length === 0) {
    bestAndWorstNarrative = 'No tunings to rank.';
  } else {
    bestAndWorstNarrative = `Best: ${bw.bestId ?? 'none'} (score ${bw.bestScore.toFixed(3)}). Worst: ${bw.worstId ?? 'none'} (score ${bw.worstScore.toFixed(3)}).`;
  }
  return { ...bw, bestAndWorstNarrative };
}

// ---------------------------------------------------------------------------
// Q810 — tuningFamilySocraticScoreSpread
// ---------------------------------------------------------------------------

export function tuningFamilySocraticScoreSpread(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  min: number;
  max: number;
  range: number;
  mean: number;
  spreadLabel: 'uniform' | 'moderate' | 'wide';
} {
  if (tunings.length === 0) {
    return { min: 0, max: 0, range: 0, mean: 0, spreadLabel: 'uniform' };
  }
  const scores = tunings.map(
    (t) => tuningFamilySocraticBenchmark([t], spectrum, rootHz).benchmarkScore,
  );
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const spreadLabel: 'uniform' | 'moderate' | 'wide' =
    range < 0.1 ? 'uniform' : range < 0.3 ? 'moderate' : 'wide';
  return { min, max, range, mean, spreadLabel };
}

// ---------------------------------------------------------------------------
// Q812 — tuningFamilySocraticScoreSpreadNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticScoreSpreadNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticScoreSpread> & { scoreSpreadNarrative: string } {
  const spread = tuningFamilySocraticScoreSpread(tunings, spectrum, rootHz);
  let scoreSpreadNarrative: string;
  if (tunings.length === 0) {
    scoreSpreadNarrative = 'No tunings to analyze.';
  } else {
    scoreSpreadNarrative = `Score spread (${tunings.length} tunings): range ${spread.range.toFixed(3)}, mean ${spread.mean.toFixed(3)} — ${spread.spreadLabel}.`;
  }
  return { ...spread, scoreSpreadNarrative };
}

// ---------------------------------------------------------------------------
// Q814 — tuningFamilySocraticVersatilityRatio
// ---------------------------------------------------------------------------

export function tuningFamilySocraticVersatilityRatio(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { versatileCount: number; totalCount: number; versatilityRatio: number } {
  if (tunings.length === 0) {
    return { versatileCount: 0, totalCount: 0, versatilityRatio: 0 };
  }
  const ranking = tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
  const versatileCount = ranking.filter((r) => r.ambassador.consensus === 'versatile').length;
  const totalCount = ranking.length;
  const versatilityRatio = totalCount > 0 ? versatileCount / totalCount : 0;
  return { versatileCount, totalCount, versatilityRatio };
}

// ---------------------------------------------------------------------------
// Q816 — tuningFamilySocraticVersatilityRatioNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticVersatilityRatioNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticVersatilityRatio> & { versatilityRatioNarrative: string } {
  const vr = tuningFamilySocraticVersatilityRatio(tunings, spectrum, rootHz);
  let versatilityRatioNarrative: string;
  if (tunings.length === 0) {
    versatilityRatioNarrative = 'No tunings to assess versatility.';
  } else {
    const label =
      vr.versatilityRatio === 0
        ? 'none'
        : vr.versatilityRatio < 0.33
          ? 'low'
          : vr.versatilityRatio < 0.67
            ? 'moderate'
            : 'high';
    versatilityRatioNarrative = `Versatility: ${vr.versatileCount}/${vr.totalCount} tunings (${(vr.versatilityRatio * 100).toFixed(1)}%) are versatile — ${label}.`;
  }
  return { ...vr, versatilityRatioNarrative };
}

// ---------------------------------------------------------------------------
// Q818 — tuningFamilySocraticArchetype
// ---------------------------------------------------------------------------

export function tuningFamilySocraticArchetype(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { archetype: 'explorer' | 'specialist' | 'harmonist' | 'traditionalist' | 'undefined' } {
  if (tunings.length === 0) {
    return { archetype: 'undefined' };
  }
  const div = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  const topo = tuningFamilySocraticTopologyScore(tunings, spectrum, rootHz);
  const vr = tuningFamilySocraticVersatilityRatio(tunings, spectrum, rootHz);
  const evo = tuningFamilySocraticEvolutionRanking(tunings, spectrum, rootHz);
  const traditionalFraction =
    evo.filter((e) => e.evolutionLabel === 'traditional').length / Math.max(evo.length, 1);
  let archetype: 'explorer' | 'specialist' | 'harmonist' | 'traditionalist' | 'undefined';
  if (div.diversityIndex > 0.6 && topo.topologyLabel === 'dispersed') {
    archetype = 'explorer';
  } else if (vr.versatilityRatio > 0.5) {
    archetype = 'harmonist';
  } else if (traditionalFraction > 0.6) {
    archetype = 'traditionalist';
  } else if (div.diversityIndex < 0.3) {
    archetype = 'specialist';
  } else {
    archetype = 'harmonist';
  }
  return { archetype };
}

// ---------------------------------------------------------------------------
// Q820 — tuningFamilySocraticArchetypeNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticArchetypeNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticArchetype> & { archetypeNarrative: string } {
  const result = tuningFamilySocraticArchetype(tunings, spectrum, rootHz);
  const descriptions: Record<
    'explorer' | 'specialist' | 'harmonist' | 'traditionalist' | 'undefined',
    string
  > = {
    explorer:
      'Explorer family: high diversity and wide dispersion — pushes into new sonic territory.',
    harmonist:
      'Harmonist family: majority versatile ambassadors — balanced across many musical contexts.',
    traditionalist:
      'Traditionalist family: anchored in central tunings — stable and conservative character.',
    specialist:
      'Specialist family: tightly focused profiles — deep expertise in a narrow tonal range.',
    undefined: 'Undefined archetype: no tunings provided.',
  };
  const archetypeNarrative = descriptions[result.archetype];
  return { ...result, archetypeNarrative };
}

// ---------------------------------------------------------------------------
// Q822 — tuningFamilySocraticArchetypeComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticArchetypeComparison(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  archetypeA: 'explorer' | 'harmonist' | 'traditionalist' | 'specialist' | 'undefined';
  archetypeB: 'explorer' | 'harmonist' | 'traditionalist' | 'specialist' | 'undefined';
  sameArchetype: boolean;
} {
  const a = tuningFamilySocraticArchetype(familyA, spectrum, rootHz);
  const b = tuningFamilySocraticArchetype(familyB, spectrum, rootHz);
  return {
    archetypeA: a.archetype,
    archetypeB: b.archetype,
    sameArchetype: a.archetype === b.archetype,
  };
}

// ---------------------------------------------------------------------------
// Q824 — tuningFamilySocraticMaturityScore
// ---------------------------------------------------------------------------

export function tuningFamilySocraticMaturityScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  maturityScore: number;
  maturityLabel: 'nascent' | 'developing' | 'mature' | 'refined';
} {
  if (tunings.length === 0) {
    return { maturityScore: 0, maturityLabel: 'nascent' };
  }
  const bench = tuningFamilySocraticBenchmark(tunings, spectrum, rootHz);
  const vr = tuningFamilySocraticVersatilityRatio(tunings, spectrum, rootHz);
  const div = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  const evo = tuningFamilySocraticEvolutionRanking(tunings, spectrum, rootHz);
  const experimentalFraction =
    evo.filter((e) => e.evolutionLabel === 'experimental').length / Math.max(evo.length, 1);
  const maturityScore =
    bench.benchmarkScore * 0.4 +
    vr.versatilityRatio * 0.3 +
    div.diversityIndex * 0.2 +
    experimentalFraction * 0.1;
  let maturityLabel: 'nascent' | 'developing' | 'mature' | 'refined';
  if (maturityScore < 0.25) {
    maturityLabel = 'nascent';
  } else if (maturityScore < 0.5) {
    maturityLabel = 'developing';
  } else if (maturityScore < 0.75) {
    maturityLabel = 'mature';
  } else {
    maturityLabel = 'refined';
  }
  return { maturityScore, maturityLabel };
}

// ---------------------------------------------------------------------------
// Q826 — tuningFamilySocraticMaturityScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticMaturityScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticMaturityScore> & { maturityNarrative: string } {
  const mat = tuningFamilySocraticMaturityScore(tunings, spectrum, rootHz);
  let maturityNarrative: string;
  if (tunings.length === 0) {
    maturityNarrative = 'No tunings to assess.';
  } else {
    maturityNarrative = `Maturity: ${mat.maturityScore.toFixed(3)} (${mat.maturityLabel}) for ${tunings.length} tunings.`;
  }
  return { ...mat, maturityNarrative };
}

// ---------------------------------------------------------------------------
// Q828 — tuningFamilySocraticMaturityComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticMaturityComparison(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  maturityA: number;
  labelA: 'nascent' | 'developing' | 'mature' | 'refined';
  maturityB: number;
  labelB: 'nascent' | 'developing' | 'mature' | 'refined';
  delta: number;
  winner: 'A' | 'B' | 'tie';
} {
  const a = tuningFamilySocraticMaturityScore(familyA, spectrum, rootHz);
  const b = tuningFamilySocraticMaturityScore(familyB, spectrum, rootHz);
  const delta = a.maturityScore - b.maturityScore;
  const winner: 'A' | 'B' | 'tie' = Math.abs(delta) < 0.01 ? 'tie' : delta > 0 ? 'A' : 'B';
  return {
    maturityA: a.maturityScore,
    labelA: a.maturityLabel,
    maturityB: b.maturityScore,
    labelB: b.maturityLabel,
    delta,
    winner,
  };
}

// ---------------------------------------------------------------------------
// Q830 — tuningFamilySocraticMaturityComparisonNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticMaturityComparisonNarrative(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticMaturityComparison> & {
  maturityComparisonNarrative: string;
} {
  const comp = tuningFamilySocraticMaturityComparison(familyA, familyB, spectrum, rootHz);
  const maturityComparisonNarrative = `Maturity comparison: A=${comp.maturityA.toFixed(3)} (${comp.labelA}) vs B=${comp.maturityB.toFixed(3)} (${comp.labelB}). Winner: ${comp.winner}.`;
  return { ...comp, maturityComparisonNarrative };
}

// ---------------------------------------------------------------------------
// Q832 — tuningFamilySocraticFullReport
// ---------------------------------------------------------------------------

export function tuningFamilySocraticFullReport(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  familyPortrait: string;
  archetype: 'explorer' | 'harmonist' | 'traditionalist' | 'specialist' | 'undefined';
  maturityScore: number;
  maturityLabel: 'nascent' | 'developing' | 'mature' | 'refined';
  benchmarkScore: number;
  diversityIndex: number;
  recommendedId: string | null;
  alternativeId: string | null;
} {
  const portrait = tuningFamilySocraticFamilyPortrait(tunings, spectrum, rootHz);
  const archRes = tuningFamilySocraticArchetype(tunings, spectrum, rootHz);
  const mat = tuningFamilySocraticMaturityScore(tunings, spectrum, rootHz);
  const bench = tuningFamilySocraticBenchmark(tunings, spectrum, rootHz);
  const div = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
  const rec = tuningFamilySocraticRecommendation(tunings, spectrum, rootHz);
  return {
    familyPortrait: portrait.familyPortrait,
    archetype: archRes.archetype,
    maturityScore: mat.maturityScore,
    maturityLabel: mat.maturityLabel,
    benchmarkScore: bench.benchmarkScore,
    diversityIndex: div.diversityIndex,
    recommendedId: rec.recommendedId,
    alternativeId: rec.alternativeId,
  };
}

// ---------------------------------------------------------------------------
// Q834 — tuningFamilySocraticFullReportNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticFullReportNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticFullReport> & { fullReportNarrative: string } {
  const report = tuningFamilySocraticFullReport(tunings, spectrum, rootHz);
  let fullReportNarrative: string;
  if (tunings.length === 0) {
    fullReportNarrative = 'No tunings to report.';
  } else {
    fullReportNarrative = `${report.familyPortrait}\nArchetype: ${report.archetype}. Maturity: ${report.maturityLabel} (${report.maturityScore.toFixed(3)}). Benchmark: ${report.benchmarkScore.toFixed(3)}. Diversity: ${report.diversityIndex.toFixed(3)}.\nRecommended: ${report.recommendedId ?? 'none'}${report.alternativeId ? `, alternative: ${report.alternativeId}` : ''}.`;
  }
  return { ...report, fullReportNarrative };
}

// ---------------------------------------------------------------------------
// Q836 — tuningFamilySocraticRadarProfile
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfile(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  diversity: number;
  versatility: number;
  maturity: number;
  benchmark: number;
  convergence: number;
} {
  if (tunings.length === 0) {
    return { diversity: 0, versatility: 0, maturity: 0, benchmark: 0, convergence: 0 };
  }
  const diversity = tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz).diversityIndex;
  const versatility = tuningFamilySocraticVersatilityRatio(
    tunings,
    spectrum,
    rootHz,
  ).versatilityRatio;
  const maturity = tuningFamilySocraticMaturityScore(tunings, spectrum, rootHz).maturityScore;
  const benchmark = tuningFamilySocraticBenchmark(tunings, spectrum, rootHz).benchmarkScore;
  const convergence = tuningFamilyAmbassadorConvergenceScore(
    tunings,
    spectrum,
    rootHz,
  ).convergenceScore;
  return { diversity, versatility, maturity, benchmark, convergence };
}

// ---------------------------------------------------------------------------
// Q838 — tuningFamilySocraticRadarProfileNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfileNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticRadarProfile> & { radarNarrative: string } {
  const r = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  let radarNarrative: string;
  if (tunings.length === 0) {
    radarNarrative = 'No tunings for radar profile.';
  } else {
    radarNarrative = `Radar profile (${tunings.length} tunings):\n  Diversity:    ${r.diversity.toFixed(3)}\n  Versatility:  ${r.versatility.toFixed(3)}\n  Maturity:     ${r.maturity.toFixed(3)}\n  Benchmark:    ${r.benchmark.toFixed(3)}\n  Convergence:  ${r.convergence.toFixed(3)}`;
  }
  return { ...r, radarNarrative };
}

// ---------------------------------------------------------------------------
// Q840 — tuningFamilySocraticRadarComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarComparison(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  profileA: ReturnType<typeof tuningFamilySocraticRadarProfile>;
  profileB: ReturnType<typeof tuningFamilySocraticRadarProfile>;
  deltas: {
    diversity: number;
    versatility: number;
    maturity: number;
    benchmark: number;
    convergence: number;
  };
  dominantAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
} {
  const profileA = tuningFamilySocraticRadarProfile(familyA, spectrum, rootHz);
  const profileB = tuningFamilySocraticRadarProfile(familyB, spectrum, rootHz);
  const deltas = {
    diversity: profileA.diversity - profileB.diversity,
    versatility: profileA.versatility - profileB.versatility,
    maturity: profileA.maturity - profileB.maturity,
    benchmark: profileA.benchmark - profileB.benchmark,
    convergence: profileA.convergence - profileB.convergence,
  };
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const dominantAxis = axes.reduce(
    (best, axis) => (Math.abs(deltas[axis]) > Math.abs(deltas[best]) ? axis : best),
    axes[0]!,
  );
  return { profileA, profileB, deltas, dominantAxis };
}

// ---------------------------------------------------------------------------
// Q842 — tuningFamilySocraticRadarComparisonNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarComparisonNarrative(
  familyA: TuningSystem[],
  familyB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticRadarComparison> & { radarComparisonNarrative: string } {
  const comp = tuningFamilySocraticRadarComparison(familyA, familyB, spectrum, rootHz);
  const radarComparisonNarrative = `Radar comparison (A vs B, dominant axis: ${comp.dominantAxis}):\n  Diversity: ${comp.deltas.diversity >= 0 ? '+' : ''}${comp.deltas.diversity.toFixed(3)}\n  Versatility: ${comp.deltas.versatility >= 0 ? '+' : ''}${comp.deltas.versatility.toFixed(3)}\n  Maturity: ${comp.deltas.maturity >= 0 ? '+' : ''}${comp.deltas.maturity.toFixed(3)}\n  Benchmark: ${comp.deltas.benchmark >= 0 ? '+' : ''}${comp.deltas.benchmark.toFixed(3)}\n  Convergence: ${comp.deltas.convergence >= 0 ? '+' : ''}${comp.deltas.convergence.toFixed(3)}`;
  return { ...comp, radarComparisonNarrative };
}

// ---------------------------------------------------------------------------
// Q844 — tuningFamilySocraticRadarDominantAxis
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarDominantAxis(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  dominantAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  dominantScore: number;
} {
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const dominantAxis = axes.reduce(
    (best, axis) => (profile[axis] > profile[best] ? axis : best),
    axes[0]!,
  );
  return { dominantAxis, dominantScore: profile[dominantAxis] };
}

// ---------------------------------------------------------------------------
// Q846 — tuningFamilySocraticRadarWeakestAxis
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarWeakestAxis(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  weakestAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  weakestScore: number;
} {
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const weakestAxis = axes.reduce(
    (worst, axis) => (profile[axis] < profile[worst] ? axis : worst),
    axes[0]!,
  );
  return { weakestAxis, weakestScore: profile[weakestAxis] };
}

// ---------------------------------------------------------------------------
// Q848 — tuningFamilySocraticRadarStrengthWeaknessReport
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarStrengthWeaknessReport(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  dominantAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  dominantScore: number;
  weakestAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  weakestScore: number;
  strengthWeaknessNarrative: string;
} {
  const dom = tuningFamilySocraticRadarDominantAxis(tunings, spectrum, rootHz);
  const weak = tuningFamilySocraticRadarWeakestAxis(tunings, spectrum, rootHz);
  let strengthWeaknessNarrative: string;
  if (tunings.length === 0) {
    strengthWeaknessNarrative = 'No tunings to assess.';
  } else {
    strengthWeaknessNarrative = `Strength: ${dom.dominantAxis} (${dom.dominantScore.toFixed(3)}). Weakness: ${weak.weakestAxis} (${weak.weakestScore.toFixed(3)}).`;
  }
  return {
    dominantAxis: dom.dominantAxis,
    dominantScore: dom.dominantScore,
    weakestAxis: weak.weakestAxis,
    weakestScore: weak.weakestScore,
    strengthWeaknessNarrative,
  };
}

// ---------------------------------------------------------------------------
// Q850 — tuningFamilySocraticConvergencePortrait
// ---------------------------------------------------------------------------

export function tuningFamilySocraticConvergencePortrait(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { convergencePortrait: string } {
  if (tunings.length === 0) {
    return { convergencePortrait: 'Empty family.' };
  }
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const arch = tuningFamilySocraticArchetype(tunings, spectrum, rootHz);
  const convergenceLabel =
    profile.convergence < 0.25
      ? 'divergent'
      : profile.convergence < 0.5
        ? 'loosely aligned'
        : profile.convergence < 0.75
          ? 'well-aligned'
          : 'unified';
  const convergencePortrait = `${arch.archetype} family of ${tunings.length}: ${convergenceLabel} (convergence ${profile.convergence.toFixed(3)}), diversity ${profile.diversity.toFixed(3)}.`;
  return { convergencePortrait };
}

// ---------------------------------------------------------------------------
// Q852 — tuningFamilySocraticRadarBalance
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarBalance(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  balanceScore: number;
  balanceLabel: 'unbalanced' | 'moderate' | 'balanced';
} {
  const p = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const balanceScore = (p.diversity + p.versatility + p.maturity + p.benchmark + p.convergence) / 5;
  const balanceLabel: 'unbalanced' | 'moderate' | 'balanced' =
    balanceScore < 0.25 ? 'unbalanced' : balanceScore < 0.5 ? 'moderate' : 'balanced';
  return { balanceScore, balanceLabel };
}

// ---------------------------------------------------------------------------
// Q854 — tuningFamilySocraticRadarBalanceNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarBalanceNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): ReturnType<typeof tuningFamilySocraticRadarBalance> & { balanceNarrative: string } {
  const bal = tuningFamilySocraticRadarBalance(tunings, spectrum, rootHz);
  const balanceNarrative =
    tunings.length === 0
      ? 'No tunings to assess balance.'
      : `Radar balance: ${bal.balanceScore.toFixed(3)} (${bal.balanceLabel}) across ${tunings.length} tunings.`;
  return { ...bal, balanceNarrative };
}

// ---------------------------------------------------------------------------
// Q856 — tuningFamilySocraticRadarGap
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarGap(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  gap: number;
  gapLabel: 'tight' | 'moderate' | 'wide';
  dominantAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  weakestAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
} {
  const dom = tuningFamilySocraticRadarDominantAxis(tunings, spectrum, rootHz);
  const weak = tuningFamilySocraticRadarWeakestAxis(tunings, spectrum, rootHz);
  const gap = dom.dominantScore - weak.weakestScore;
  const gapLabel: 'tight' | 'moderate' | 'wide' =
    gap < 0.2 ? 'tight' : gap < 0.5 ? 'moderate' : 'wide';
  return { gap, gapLabel, dominantAxis: dom.dominantAxis, weakestAxis: weak.weakestAxis };
}

// ---------------------------------------------------------------------------
// Q858 — tuningFamilySocraticRadarGapNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarGapNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  gap: number;
  gapLabel: 'tight' | 'moderate' | 'wide';
  dominantAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  weakestAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  gapNarrative: string;
} {
  const g = tuningFamilySocraticRadarGap(tunings, spectrum, rootHz);
  const { gap, gapLabel, dominantAxis, weakestAxis } = g;
  const gapNarrative = `The radar gap is ${gapLabel} (${gap.toFixed(2)}), spanning from ${dominantAxis} (dominant) to ${weakestAxis} (weakest). This indicates a ${gapLabel === 'tight' ? 'well-balanced profile' : gapLabel === 'moderate' ? 'moderate spread' : 'high specialization'} across dimensions.`;
  return { gap, gapLabel, dominantAxis, weakestAxis, gapNarrative };
}

// ---------------------------------------------------------------------------
// Q860 — tuningFamilySocraticRadarBalanceGapSummary
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarBalanceGapSummary(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  balanceScore: number;
  balanceLabel: 'unbalanced' | 'moderate' | 'balanced';
  gap: number;
  gapLabel: 'tight' | 'moderate' | 'wide';
  dominantAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  weakestAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  summary: string;
} {
  const bal = tuningFamilySocraticRadarBalance(tunings, spectrum, rootHz);
  const g = tuningFamilySocraticRadarGap(tunings, spectrum, rootHz);
  const { balanceScore, balanceLabel } = bal;
  const { gap, gapLabel, dominantAxis, weakestAxis } = g;
  const summary = `Balance: ${balanceLabel} (${balanceScore.toFixed(2)}). Gap: ${gapLabel} (${gap.toFixed(2)}) between ${dominantAxis} and ${weakestAxis}.`;
  return { balanceScore, balanceLabel, gap, gapLabel, dominantAxis, weakestAxis, summary };
}

// ---------------------------------------------------------------------------
// Q862 — tuningFamilySocraticRadarCentroid
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarCentroid(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  centroid: number;
  centroidLabel: 'low' | 'mid' | 'high';
} {
  const p = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const centroid = (p.diversity + p.versatility + p.maturity + p.benchmark + p.convergence) / 5;
  const centroidLabel: 'low' | 'mid' | 'high' =
    centroid < 0.35 ? 'low' : centroid < 0.65 ? 'mid' : 'high';
  return { centroid, centroidLabel };
}

// ---------------------------------------------------------------------------
// Q864 — tuningFamilySocraticRadarCentroidNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarCentroidNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  centroid: number;
  centroidLabel: 'low' | 'mid' | 'high';
  centroidNarrative: string;
} {
  const { centroid, centroidLabel } = tuningFamilySocraticRadarCentroid(tunings, spectrum, rootHz);
  const centroidNarrative = `The radar centroid is ${centroidLabel} at ${centroid.toFixed(2)}, indicating an overall ${centroidLabel === 'high' ? 'strong' : centroidLabel === 'mid' ? 'moderate' : 'developing'} profile across all five dimensions.`;
  return { centroid, centroidLabel, centroidNarrative };
}

// ---------------------------------------------------------------------------
// Q866 — tuningFamilySocraticRadarCentroidComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarCentroidComparison(
  tuningsA: TuningSystem[],
  tuningsB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  centroidA: number;
  centroidB: number;
  centroidLabelA: 'low' | 'mid' | 'high';
  centroidLabelB: 'low' | 'mid' | 'high';
  centroidDiff: number;
  winner: 'A' | 'B' | 'tie';
} {
  const a = tuningFamilySocraticRadarCentroid(tuningsA, spectrum, rootHz);
  const b = tuningFamilySocraticRadarCentroid(tuningsB, spectrum, rootHz);
  const centroidDiff = Math.abs(a.centroid - b.centroid);
  const winner: 'A' | 'B' | 'tie' =
    centroidDiff < 0.02 ? 'tie' : a.centroid > b.centroid ? 'A' : 'B';
  return {
    centroidA: a.centroid,
    centroidB: b.centroid,
    centroidLabelA: a.centroidLabel,
    centroidLabelB: b.centroidLabel,
    centroidDiff,
    winner,
  };
}

// ---------------------------------------------------------------------------
// Q868 — tuningFamilySocraticRadarAxisScoreRank
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarAxisScoreRank(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  ranked: Array<{
    axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
    score: number;
  }>;
  topAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  bottomAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
} {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const p = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const ranked = axes.map((axis) => ({ axis, score: p[axis] })).sort((a, b) => b.score - a.score);
  const topAxis = ranked[0]!.axis;
  const bottomAxis = ranked[ranked.length - 1]!.axis;
  return { ranked, topAxis, bottomAxis };
}

// ---------------------------------------------------------------------------
// Q870 — tuningFamilySocraticRadarAxisScoreRankNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarAxisScoreRankNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  ranked: Array<{
    axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
    score: number;
  }>;
  topAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  bottomAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  rankNarrative: string;
} {
  const { ranked, topAxis, bottomAxis } = tuningFamilySocraticRadarAxisScoreRank(
    tunings,
    spectrum,
    rootHz,
  );
  const rankNarrative = `Axis ranking (highest to lowest): ${ranked.map((r) => `${r.axis} (${r.score.toFixed(2)})`).join(', ')}. Top: ${topAxis}, Bottom: ${bottomAxis}.`;
  return { ranked, topAxis, bottomAxis, rankNarrative };
}

// ---------------------------------------------------------------------------
// Q872 — tuningFamilySocraticRadarProfileSnapshot
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfileSnapshot(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  balanceScore: number;
  balanceLabel: 'unbalanced' | 'moderate' | 'balanced';
  gap: number;
  gapLabel: 'tight' | 'moderate' | 'wide';
  centroid: number;
  centroidLabel: 'low' | 'mid' | 'high';
  topAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  bottomAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
} {
  const bal = tuningFamilySocraticRadarBalance(tunings, spectrum, rootHz);
  const g = tuningFamilySocraticRadarGap(tunings, spectrum, rootHz);
  const cent = tuningFamilySocraticRadarCentroid(tunings, spectrum, rootHz);
  const rank = tuningFamilySocraticRadarAxisScoreRank(tunings, spectrum, rootHz);
  return {
    balanceScore: bal.balanceScore,
    balanceLabel: bal.balanceLabel,
    gap: g.gap,
    gapLabel: g.gapLabel,
    centroid: cent.centroid,
    centroidLabel: cent.centroidLabel,
    topAxis: rank.topAxis,
    bottomAxis: rank.bottomAxis,
  };
}

// ---------------------------------------------------------------------------
// Q874 — tuningFamilySocraticRadarProfileHealth
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfileHealth(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  healthScore: number;
  healthLabel: 'poor' | 'fair' | 'good' | 'excellent';
} {
  const balance = tuningFamilySocraticRadarBalance(tunings, spectrum, rootHz);
  const cent = tuningFamilySocraticRadarCentroid(tunings, spectrum, rootHz);
  const healthScore = balance.balanceScore * 0.5 + cent.centroid * 0.5;
  const healthLabel: 'poor' | 'fair' | 'good' | 'excellent' =
    healthScore < 0.35
      ? 'poor'
      : healthScore < 0.5
        ? 'fair'
        : healthScore < 0.7
          ? 'good'
          : 'excellent';
  return { healthScore, healthLabel };
}

// ---------------------------------------------------------------------------
// Q876 — tuningFamilySocraticRadarProfileHealthNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfileHealthNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  healthScore: number;
  healthLabel: 'poor' | 'fair' | 'good' | 'excellent';
  healthNarrative: string;
} {
  const { healthScore, healthLabel } = tuningFamilySocraticRadarProfileHealth(
    tunings,
    spectrum,
    rootHz,
  );
  const healthNarrative = `Overall radar health is ${healthLabel} (${healthScore.toFixed(2)}). ${healthLabel === 'excellent' ? 'This tuning family excels across all radar dimensions.' : healthLabel === 'good' ? 'Strong performance with room to grow in some areas.' : healthLabel === 'fair' ? 'Moderate profile with clear opportunities for improvement.' : 'Significant development needed across radar dimensions.'}`;
  return { healthScore, healthLabel, healthNarrative };
}

// ---------------------------------------------------------------------------
// Q878 — tuningFamilySocraticRadarProfileHealthComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfileHealthComparison(
  tuningsA: TuningSystem[],
  tuningsB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  healthScoreA: number;
  healthScoreB: number;
  healthLabelA: 'poor' | 'fair' | 'good' | 'excellent';
  healthLabelB: 'poor' | 'fair' | 'good' | 'excellent';
  healthDiff: number;
  healthWinner: 'A' | 'B' | 'tie';
} {
  const a = tuningFamilySocraticRadarProfileHealth(tuningsA, spectrum, rootHz);
  const b = tuningFamilySocraticRadarProfileHealth(tuningsB, spectrum, rootHz);
  const healthDiff = Math.abs(a.healthScore - b.healthScore);
  const healthWinner: 'A' | 'B' | 'tie' =
    healthDiff < 0.02 ? 'tie' : a.healthScore > b.healthScore ? 'A' : 'B';
  return {
    healthScoreA: a.healthScore,
    healthScoreB: b.healthScore,
    healthLabelA: a.healthLabel,
    healthLabelB: b.healthLabel,
    healthDiff,
    healthWinner,
  };
}

// ---------------------------------------------------------------------------
// Q880 — tuningFamilySocraticRadarAxisDiversity
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarAxisDiversity(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  axisDiversity: number;
  axisDiversityLabel: 'uniform' | 'varied' | 'polarized';
} {
  const p = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const scores = [p.diversity, p.versatility, p.maturity, p.benchmark, p.convergence];
  const mean = scores.reduce((a, b) => a + b, 0) / 5;
  const variance = scores.reduce((s, x) => s + (x - mean) ** 2, 0) / 5;
  const axisDiversity = Math.sqrt(variance);
  const axisDiversityLabel: 'uniform' | 'varied' | 'polarized' =
    axisDiversity < 0.1 ? 'uniform' : axisDiversity < 0.2 ? 'varied' : 'polarized';
  return { axisDiversity, axisDiversityLabel };
}

// ---------------------------------------------------------------------------
// Q882 — tuningFamilySocraticRadarAxisDiversityNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarAxisDiversityNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  axisDiversity: number;
  axisDiversityLabel: 'uniform' | 'varied' | 'polarized';
  axisDiversityNarrative: string;
} {
  const { axisDiversity, axisDiversityLabel } = tuningFamilySocraticRadarAxisDiversity(
    tunings,
    spectrum,
    rootHz,
  );
  const axisDiversityNarrative = `Axis diversity is ${axisDiversityLabel} (std dev: ${axisDiversity.toFixed(3)}). ${axisDiversityLabel === 'uniform' ? 'All dimensions are evenly developed.' : axisDiversityLabel === 'varied' ? 'Moderate variation across radar axes.' : 'Strong polarization between dimensions.'}`;
  return { axisDiversity, axisDiversityLabel, axisDiversityNarrative };
}

// ---------------------------------------------------------------------------
// Q884 — tuningFamilySocraticRadarAxisDiversityComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarAxisDiversityComparison(
  tuningsA: TuningSystem[],
  tuningsB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  axisDiversityA: number;
  axisDiversityB: number;
  axisDiversityLabelA: 'uniform' | 'varied' | 'polarized';
  axisDiversityLabelB: 'uniform' | 'varied' | 'polarized';
  diversityDiff: number;
  moreUniform: 'A' | 'B' | 'tie';
} {
  const a = tuningFamilySocraticRadarAxisDiversity(tuningsA, spectrum, rootHz);
  const b = tuningFamilySocraticRadarAxisDiversity(tuningsB, spectrum, rootHz);
  const diversityDiff = Math.abs(a.axisDiversity - b.axisDiversity);
  const moreUniform: 'A' | 'B' | 'tie' =
    diversityDiff < 0.01 ? 'tie' : a.axisDiversity < b.axisDiversity ? 'A' : 'B';
  return {
    axisDiversityA: a.axisDiversity,
    axisDiversityB: b.axisDiversity,
    axisDiversityLabelA: a.axisDiversityLabel,
    axisDiversityLabelB: b.axisDiversityLabel,
    diversityDiff,
    moreUniform,
  };
}

// ---------------------------------------------------------------------------
// Q886 — tuningFamilySocraticRadarOverallScore
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarOverallScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  overallScore: number;
  overallLabel: 'poor' | 'fair' | 'good' | 'excellent';
} {
  const health = tuningFamilySocraticRadarProfileHealth(tunings, spectrum, rootHz);
  const cent = tuningFamilySocraticRadarCentroid(tunings, spectrum, rootHz);
  const bal = tuningFamilySocraticRadarBalance(tunings, spectrum, rootHz);
  const overallScore = health.healthScore * 0.4 + cent.centroid * 0.3 + bal.balanceScore * 0.3;
  const overallLabel: 'poor' | 'fair' | 'good' | 'excellent' =
    overallScore < 0.35
      ? 'poor'
      : overallScore < 0.5
        ? 'fair'
        : overallScore < 0.7
          ? 'good'
          : 'excellent';
  return { overallScore, overallLabel };
}

// ---------------------------------------------------------------------------
// Q888 — tuningFamilySocraticRadarOverallScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarOverallScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  overallScore: number;
  overallLabel: 'poor' | 'fair' | 'good' | 'excellent';
  overallScoreNarrative: string;
} {
  const { overallScore, overallLabel } = tuningFamilySocraticRadarOverallScore(
    tunings,
    spectrum,
    rootHz,
  );
  const overallScoreNarrative = `Overall radar score is ${overallLabel} at ${overallScore.toFixed(2)}, combining health, centroid, and balance metrics. ${overallLabel === 'excellent' ? 'Exceptional multi-dimensional performance.' : overallLabel === 'good' ? 'Solid performance with minor gaps.' : overallLabel === 'fair' ? 'Moderate profile with improvement potential.' : 'Requires significant development across dimensions.'}`;
  return { overallScore, overallLabel, overallScoreNarrative };
}

// ---------------------------------------------------------------------------
// Q890 — tuningFamilySocraticRadarOverallScoreComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarOverallScoreComparison(
  tuningsA: TuningSystem[],
  tuningsB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  overallScoreA: number;
  overallScoreB: number;
  overallLabelA: 'poor' | 'fair' | 'good' | 'excellent';
  overallLabelB: 'poor' | 'fair' | 'good' | 'excellent';
  overallDiff: number;
  overallWinner: 'A' | 'B' | 'tie';
} {
  const a = tuningFamilySocraticRadarOverallScore(tuningsA, spectrum, rootHz);
  const b = tuningFamilySocraticRadarOverallScore(tuningsB, spectrum, rootHz);
  const overallDiff = Math.abs(a.overallScore - b.overallScore);
  const overallWinner: 'A' | 'B' | 'tie' =
    overallDiff < 0.02 ? 'tie' : a.overallScore > b.overallScore ? 'A' : 'B';
  return {
    overallScoreA: a.overallScore,
    overallScoreB: b.overallScore,
    overallLabelA: a.overallLabel,
    overallLabelB: b.overallLabel,
    overallDiff,
    overallWinner,
  };
}

// ---------------------------------------------------------------------------
// Q892 — tuningFamilySocraticRadarFullAnalysis
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarFullAnalysis(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  radarProfile: {
    diversity: number;
    versatility: number;
    maturity: number;
    benchmark: number;
    convergence: number;
  };
  balanceScore: number;
  balanceLabel: 'unbalanced' | 'moderate' | 'balanced';
  centroid: number;
  centroidLabel: 'low' | 'mid' | 'high';
  topAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  bottomAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  healthScore: number;
  healthLabel: 'poor' | 'fair' | 'good' | 'excellent';
  axisDiversity: number;
  axisDiversityLabel: 'uniform' | 'varied' | 'polarized';
  overallScore: number;
  overallLabel: 'poor' | 'fair' | 'good' | 'excellent';
} {
  const radarProfile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const bal = tuningFamilySocraticRadarBalance(tunings, spectrum, rootHz);
  const cent = tuningFamilySocraticRadarCentroid(tunings, spectrum, rootHz);
  const rank = tuningFamilySocraticRadarAxisScoreRank(tunings, spectrum, rootHz);
  const health = tuningFamilySocraticRadarProfileHealth(tunings, spectrum, rootHz);
  const axDiv = tuningFamilySocraticRadarAxisDiversity(tunings, spectrum, rootHz);
  const overall = tuningFamilySocraticRadarOverallScore(tunings, spectrum, rootHz);
  return {
    radarProfile,
    balanceScore: bal.balanceScore,
    balanceLabel: bal.balanceLabel,
    centroid: cent.centroid,
    centroidLabel: cent.centroidLabel,
    topAxis: rank.topAxis,
    bottomAxis: rank.bottomAxis,
    healthScore: health.healthScore,
    healthLabel: health.healthLabel,
    axisDiversity: axDiv.axisDiversity,
    axisDiversityLabel: axDiv.axisDiversityLabel,
    overallScore: overall.overallScore,
    overallLabel: overall.overallLabel,
  };
}

// ---------------------------------------------------------------------------
// Q894 — tuningFamilySocraticRadarFullAnalysisNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarFullAnalysisNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  radarProfile: {
    diversity: number;
    versatility: number;
    maturity: number;
    benchmark: number;
    convergence: number;
  };
  balanceScore: number;
  balanceLabel: 'unbalanced' | 'moderate' | 'balanced';
  centroid: number;
  centroidLabel: 'low' | 'mid' | 'high';
  topAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  bottomAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  healthScore: number;
  healthLabel: 'poor' | 'fair' | 'good' | 'excellent';
  axisDiversity: number;
  axisDiversityLabel: 'uniform' | 'varied' | 'polarized';
  overallScore: number;
  overallLabel: 'poor' | 'fair' | 'good' | 'excellent';
  fullAnalysisNarrative: string;
} {
  const base = tuningFamilySocraticRadarFullAnalysis(tunings, spectrum, rootHz);
  const fullAnalysisNarrative = `Radar full analysis: overall ${base.overallLabel} (${base.overallScore.toFixed(2)}), balance ${base.balanceLabel} (${base.balanceScore.toFixed(2)}), centroid ${base.centroidLabel} (${base.centroid.toFixed(2)}), axis diversity ${base.axisDiversityLabel}. Strongest axis: ${base.topAxis}. Weakest axis: ${base.bottomAxis}.`;
  return { ...base, fullAnalysisNarrative };
}

// ---------------------------------------------------------------------------
// Q896 — tuningFamilySocraticRadarProfileTier
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfileTier(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  tier: 'emerging' | 'developing' | 'established' | 'exemplary';
  tierScore: number;
} {
  const { overallScore } = tuningFamilySocraticRadarOverallScore(tunings, spectrum, rootHz);
  const tier: 'emerging' | 'developing' | 'established' | 'exemplary' =
    overallScore < 0.35
      ? 'emerging'
      : overallScore < 0.5
        ? 'developing'
        : overallScore < 0.7
          ? 'established'
          : 'exemplary';
  return { tier, tierScore: overallScore };
}

// ---------------------------------------------------------------------------
// Q898 — tuningFamilySocraticRadarProfileTierNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarProfileTierNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  tier: 'emerging' | 'developing' | 'established' | 'exemplary';
  tierScore: number;
  tierNarrative: string;
} {
  const { tier, tierScore } = tuningFamilySocraticRadarProfileTier(tunings, spectrum, rootHz);
  const tierNarrative = `Profile tier: ${tier} (score: ${tierScore.toFixed(2)}). ${
    tier === 'exemplary'
      ? 'This tuning family demonstrates exceptional multi-dimensional maturity.'
      : tier === 'established'
        ? 'A well-developed profile with solid performance across dimensions.'
        : tier === 'developing'
          ? 'Solid foundations with growth opportunities in several dimensions.'
          : 'Early-stage profile with significant potential for development.'
  }`;
  return { tier, tierScore, tierNarrative };
}

// ---------------------------------------------------------------------------
// Q900 — tuningFamilySocraticRadarTierComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarTierComparison(
  tuningsA: TuningSystem[],
  tuningsB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  tierA: 'emerging' | 'developing' | 'established' | 'exemplary';
  tierB: 'emerging' | 'developing' | 'established' | 'exemplary';
  tierScoreA: number;
  tierScoreB: number;
  tierDiff: number;
  higherTier: 'A' | 'B' | 'tie';
} {
  const { tier: tierA, tierScore: tierScoreA } = tuningFamilySocraticRadarProfileTier(
    tuningsA,
    spectrum,
    rootHz,
  );
  const { tier: tierB, tierScore: tierScoreB } = tuningFamilySocraticRadarProfileTier(
    tuningsB,
    spectrum,
    rootHz,
  );
  const tierDiff = Math.abs(tierScoreA - tierScoreB);
  const higherTier: 'A' | 'B' | 'tie' =
    tierDiff < 0.02 ? 'tie' : tierScoreA > tierScoreB ? 'A' : 'B';
  return { tierA, tierB, tierScoreA, tierScoreB, tierDiff, higherTier };
}

// ---------------------------------------------------------------------------
// Q902 — tuningFamilySocraticRadarMomentum
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarMomentum(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  momentum: number;
  momentumLabel: 'stagnant' | 'neutral' | 'growing' | 'thriving';
} {
  const { centroid } = tuningFamilySocraticRadarCentroid(tunings, spectrum, rootHz);
  const momentum = centroid - 0.5;
  const momentumLabel: 'stagnant' | 'neutral' | 'growing' | 'thriving' =
    momentum < -0.15
      ? 'stagnant'
      : momentum < 0.05
        ? 'neutral'
        : momentum < 0.2
          ? 'growing'
          : 'thriving';
  return { momentum, momentumLabel };
}

// ---------------------------------------------------------------------------
// Q904 — tuningFamilySocraticRadarMomentumNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarMomentumNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  momentum: number;
  momentumLabel: 'stagnant' | 'neutral' | 'growing' | 'thriving';
  momentumNarrative: string;
} {
  const { momentum, momentumLabel } = tuningFamilySocraticRadarMomentum(tunings, spectrum, rootHz);
  const momentumNarrative = `Radar momentum is ${momentumLabel} (${momentum >= 0 ? '+' : ''}${momentum.toFixed(3)} from midpoint). ${
    momentumLabel === 'thriving'
      ? 'The profile strongly exceeds the midpoint across all dimensions.'
      : momentumLabel === 'growing'
        ? 'Positive momentum — the profile is above average overall.'
        : momentumLabel === 'neutral'
          ? 'The profile sits near the midpoint with balanced potential.'
          : 'The profile trails the midpoint, suggesting areas needing development.'
  }`;
  return { momentum, momentumLabel, momentumNarrative };
}

// ---------------------------------------------------------------------------
// Q906 — tuningFamilySocraticRadarMomentumComparison
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarMomentumComparison(
  tuningsA: TuningSystem[],
  tuningsB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  momentumA: number;
  momentumB: number;
  momentumLabelA: 'stagnant' | 'neutral' | 'growing' | 'thriving';
  momentumLabelB: 'stagnant' | 'neutral' | 'growing' | 'thriving';
  momentumDiff: number;
  higherMomentum: 'A' | 'B' | 'tie';
} {
  const { momentum: momentumA, momentumLabel: momentumLabelA } = tuningFamilySocraticRadarMomentum(
    tuningsA,
    spectrum,
    rootHz,
  );
  const { momentum: momentumB, momentumLabel: momentumLabelB } = tuningFamilySocraticRadarMomentum(
    tuningsB,
    spectrum,
    rootHz,
  );
  const momentumDiff = Math.abs(momentumA - momentumB);
  const higherMomentum: 'A' | 'B' | 'tie' =
    momentumDiff < 0.02 ? 'tie' : momentumA > momentumB ? 'A' : 'B';
  return { momentumA, momentumB, momentumLabelA, momentumLabelB, momentumDiff, higherMomentum };
}

// ---------------------------------------------------------------------------
// Q908 — tuningFamilySocraticRadarResilienceScore
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarResilienceScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  resilienceScore: number;
  resilienceLabel: 'fragile' | 'moderate' | 'resilient';
} {
  const { diversity, versatility, maturity, benchmark, convergence } =
    tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const scores = [diversity, versatility, maturity, benchmark, convergence];
  const count = scores.filter((s) => s > 0.5).length;
  const resilienceScore = count / 5;
  const resilienceLabel: 'fragile' | 'moderate' | 'resilient' =
    resilienceScore < 0.4 ? 'fragile' : resilienceScore < 0.7 ? 'moderate' : 'resilient';
  return { resilienceScore, resilienceLabel };
}

// ---------------------------------------------------------------------------
// Q910 — tuningFamilySocraticRadarResilienceScoreNarrative
// ---------------------------------------------------------------------------

export function tuningFamilySocraticRadarResilienceScoreNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  resilienceScore: number;
  resilienceLabel: 'fragile' | 'moderate' | 'resilient';
  resilienceNarrative: string;
} {
  const { resilienceScore, resilienceLabel } = tuningFamilySocraticRadarResilienceScore(
    tunings,
    spectrum,
    rootHz,
  );
  const resilienceNarrative = `Resilience: ${resilienceLabel} — ${Math.round(resilienceScore * 5)} of 5 axes exceed 0.5 (score: ${resilienceScore.toFixed(2)}). ${
    resilienceLabel === 'resilient'
      ? 'The profile is robust across most dimensions.'
      : resilienceLabel === 'moderate'
        ? 'The profile shows partial resilience with room to improve.'
        : 'Most dimensions fall below the midpoint, indicating fragility.'
  }`;
  return { resilienceScore, resilienceLabel, resilienceNarrative };
}

// ---------------------------------------------------------------------------
// I1 — snapHzToScaleDegree
// ---------------------------------------------------------------------------

/**
 * Snap a frequency in Hz to the nearest degree within a tuning system (or a
 * subset defined by a `Scale`). Returns the matched degree index, the octave
 * (period count relative to `tuning.referenceHz`), and the signed cents error
 * (positive = hz is sharper than the matched degree).
 *
 * @throws {RangeError} if `hz <= 0`, or `tuning.degrees` is empty, or (when
 *   `scale` is provided) `scale.degreeIndices` is empty.
 */
export function snapHzToScaleDegree(
  hz: number,
  tuning: TuningSystem,
  scale?: Scale,
): { degreeIndex: number; octave: number; centsError: number } {
  if (hz <= 0) throw new RangeError(`snapHzToScaleDegree: hz must be > 0, got ${hz}`);
  if (tuning.degrees.length === 0)
    throw new RangeError(`snapHzToScaleDegree: tuning has no degrees`);

  const candidateIndices: readonly number[] =
    scale !== undefined
      ? scale.degreeIndices
      : Array.from({ length: tuning.degrees.length }, (_, i) => i);

  if (candidateIndices.length === 0) {
    throw new RangeError(`snapHzToScaleDegree: scale has no degree indices`);
  }

  // Step 1: cents of hz relative to tuning reference
  const centsFromRef = 1200 * Math.log2(hz / tuning.referenceHz);

  // Step 2: period (octave) and position within period
  const octave = Math.floor(centsFromRef / tuning.periodCents);
  const centsInPeriod = centsFromRef - octave * tuning.periodCents;

  // Step 3-5: find the closest degree, considering period-boundary wraps
  let bestIndex = candidateIndices[0] as number;
  let bestDelta = Infinity;
  let bestOctaveAdjust = 0;

  for (const degIdx of candidateIndices) {
    const pitch = tuning.degrees[degIdx];
    if (pitch === undefined) continue;
    const degreeCents = pitchToCents(pitch);
    const rawDelta = centsInPeriod - degreeCents;

    // Three candidates: no wrap, wrap up (degree is near period end, hz is near start), wrap down
    const candidates: Array<{ delta: number; octaveAdjust: number }> = [
      { delta: rawDelta, octaveAdjust: 0 },
      { delta: rawDelta + tuning.periodCents, octaveAdjust: -1 },
      { delta: rawDelta - tuning.periodCents, octaveAdjust: 1 },
    ];

    for (const { delta, octaveAdjust } of candidates) {
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        bestDelta = delta;
        bestIndex = degIdx;
        bestOctaveAdjust = octaveAdjust;
      }
    }
  }

  return {
    degreeIndex: bestIndex,
    octave: octave + bestOctaveAdjust,
    centsError: bestDelta,
  };
}

// ---------------------------------------------------------------------------
// Q912 — tuningFamilySocraticRadarOpportunityScore
// ---------------------------------------------------------------------------

/**
 * Counts axes below 0.5 as opportunity areas.
 * opportunityScore = count / 5 (0 = all axes strong, 1 = all weak).
 */
export function tuningFamilySocraticRadarOpportunityScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  opportunityScore: number;
  opportunityAxes: ('diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence')[];
} {
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const axes = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'] as const;
  const opportunityAxes = [...axes].filter((k) => profile[k] < 0.5);
  return { opportunityScore: opportunityAxes.length / 5, opportunityAxes };
}

// ---------------------------------------------------------------------------
// Q914 — tuningFamilySocraticRadarStrengthsWeaknesses
// ---------------------------------------------------------------------------

/**
 * Identifies the top-2 strongest and bottom-2 weakest radar axes by score.
 */
export function tuningFamilySocraticRadarStrengthsWeaknesses(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  strengths: ('diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence')[];
  weaknesses: ('diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence')[];
} {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const sorted = [...axes].sort((a, b) => profile[b] - profile[a]);
  return {
    strengths: sorted.slice(0, 2),
    weaknesses: sorted.slice(-2),
  };
}

// ---------------------------------------------------------------------------
// Q916 — tuningFamilySocraticRadarBalanceScore
// ---------------------------------------------------------------------------

/**
 * Measures how evenly balanced the radar profile is across all 5 axes.
 * Uses 1 - (stdDev / 0.5) so a perfectly uniform profile scores 1.
 */
export function tuningFamilySocraticRadarBalanceScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  balanceScore: number;
  balanceLabel: 'unbalanced' | 'moderate' | 'balanced';
} {
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const vals = [
    profile.diversity,
    profile.versatility,
    profile.maturity,
    profile.benchmark,
    profile.convergence,
  ];
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  const balanceScore = Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / 0.5));
  const balanceLabel: 'unbalanced' | 'moderate' | 'balanced' =
    balanceScore < 0.4 ? 'unbalanced' : balanceScore < 0.7 ? 'moderate' : 'balanced';
  return { balanceScore, balanceLabel };
}

// ---------------------------------------------------------------------------
// Q918 — tuningFamilySocraticRadarOpportunityNarrative
// ---------------------------------------------------------------------------

/**
 * Narrative description of which axes fall below 0.5, framed as growth areas.
 */
export function tuningFamilySocraticRadarOpportunityNarrative(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  opportunityScore: number;
  opportunityAxes: ('diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence')[];
  opportunityNarrative: string;
} {
  const { opportunityScore, opportunityAxes } = tuningFamilySocraticRadarOpportunityScore(
    tunings,
    spectrum,
    rootHz,
  );
  const opportunityNarrative =
    opportunityAxes.length === 0
      ? `No axes fall below 0.5 — this tuning family is strong across all dimensions.`
      : `Growth areas (score < 0.5): ${opportunityAxes.join(', ')}. Opportunity score: ${opportunityScore.toFixed(2)} (${opportunityAxes.length}/5 axes).`;
  return { opportunityScore, opportunityAxes, opportunityNarrative };
}

// ---------------------------------------------------------------------------
// Q920 — tuningFamilySocraticRadarFullDiagnostic
// ---------------------------------------------------------------------------

/**
 * One-call combined diagnostic: resilience, balance, and opportunities merged.
 */
export function tuningFamilySocraticRadarFullDiagnostic(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  resilienceScore: number;
  resilienceLabel: 'fragile' | 'moderate' | 'resilient';
  balanceScore: number;
  balanceLabel: 'unbalanced' | 'moderate' | 'balanced';
  opportunityScore: number;
  opportunityAxes: ('diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence')[];
  diagnosticSummary: string;
} {
  const { resilienceScore, resilienceLabel } = tuningFamilySocraticRadarResilienceScore(
    tunings,
    spectrum,
    rootHz,
  );
  const { balanceScore, balanceLabel } = tuningFamilySocraticRadarBalanceScore(
    tunings,
    spectrum,
    rootHz,
  );
  const { opportunityScore, opportunityAxes } = tuningFamilySocraticRadarOpportunityScore(
    tunings,
    spectrum,
    rootHz,
  );
  const diagnosticSummary = `Resilience: ${resilienceLabel} (${resilienceScore.toFixed(2)}). Balance: ${balanceLabel} (${balanceScore.toFixed(2)}). Opportunities: ${opportunityAxes.length > 0 ? opportunityAxes.join(', ') : 'none'}.`;
  return {
    resilienceScore,
    resilienceLabel,
    balanceScore,
    balanceLabel,
    opportunityScore,
    opportunityAxes,
    diagnosticSummary,
  };
}

// ---------------------------------------------------------------------------
// Q922 — tuningFamilySocraticRadarCrossProfile
// ---------------------------------------------------------------------------

/**
 * Side-by-side radar profiles for two tuning families, with per-axis delta.
 */
export function tuningFamilySocraticRadarCrossProfile(
  tuningsA: TuningSystem[],
  tuningsB: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  profileA: ReturnType<typeof tuningFamilySocraticRadarProfile>;
  profileB: ReturnType<typeof tuningFamilySocraticRadarProfile>;
  deltas: Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', number>;
  dominantFamily: 'A' | 'B' | 'tie';
} {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const profileA = tuningFamilySocraticRadarProfile(tuningsA, spectrum, rootHz);
  const profileB = tuningFamilySocraticRadarProfile(tuningsB, spectrum, rootHz);
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const deltas = {} as Record<AxisKey, number>;
  let totalDelta = 0;
  for (const ax of axes) {
    deltas[ax] = profileA[ax] - profileB[ax];
    totalDelta += deltas[ax];
  }
  const dominantFamily: 'A' | 'B' | 'tie' =
    Math.abs(totalDelta) < 1e-9 ? 'tie' : totalDelta > 0 ? 'A' : 'B';
  return { profileA, profileB, deltas, dominantFamily };
}

// ---------------------------------------------------------------------------
// Q924 — tuningFamilySocraticRadarDimensionalRanking
// ---------------------------------------------------------------------------

/**
 * Rank all 5 radar axes from highest to lowest score.
 * Returns axes in descending order of value.
 */
export function tuningFamilySocraticRadarDimensionalRanking(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  ranking: {
    axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
    score: number;
  }[];
} {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const ranking = axes
    .map((axis) => ({ axis, score: profile[axis] }))
    .sort((a, b) => b.score - a.score);
  return { ranking };
}

// ---------------------------------------------------------------------------
// Q926 — tuningFamilySocraticRadarGrowthVector
// ---------------------------------------------------------------------------

/**
 * Computes the "growth vector" — each axis score minus the mean, indicating
 * which axes outperform or underperform the overall average.
 */
export function tuningFamilySocraticRadarGrowthVector(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  mean: number;
  growthVector: Record<
    'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
    number
  >;
} {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const profile = tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const mean = axes.reduce((s, ax) => s + profile[ax], 0) / axes.length;
  const growthVector = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    growthVector[ax] = profile[ax] - mean;
  }
  return { mean, growthVector };
}

// ---------------------------------------------------------------------------
// Q928 — tuningFamilySocraticRadarConsistencyScore
// ---------------------------------------------------------------------------

/**
 * Measures consistency of the family: average pairwise distance between member
 * radar profiles. Low = consistent family, High = diverse/inconsistent family.
 * With a single tuning the score is 0 (trivially consistent).
 */
export function tuningFamilySocraticRadarConsistencyScore(
  tunings: TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  consistencyScore: number;
  consistencyLabel: 'uniform' | 'moderate' | 'diverse';
} {
  if (tunings.length <= 1) {
    return { consistencyScore: 0, consistencyLabel: 'uniform' };
  }
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  let totalDist = 0;
  let count = 0;
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i]!;
      const b = profiles[j]!;
      const dist = Math.sqrt(axes.reduce((s, ax) => s + (a[ax] - b[ax]) ** 2, 0));
      totalDist += dist;
      count++;
    }
  }
  const consistencyScore = count > 0 ? totalDist / count : 0;
  const consistencyLabel: 'uniform' | 'moderate' | 'diverse' =
    consistencyScore < 0.15 ? 'uniform' : consistencyScore < 0.3 ? 'moderate' : 'diverse';
  return { consistencyScore, consistencyLabel };
}

// ---------------------------------------------------------------------------
// Q930 — tuningFamilySocraticRadarProfileEntropy
// ---------------------------------------------------------------------------

/**
 * Shannon entropy of the radar profile across 5 axes.
 * Uses the family's mean profile (average across all member tunings).
 * normalizedEntropy = entropy / log2(5) ∈ [0,1].
 */
export function tuningFamilySocraticRadarProfileEntropy(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { entropy: number; normalizedEntropy: number } {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  // Compute mean profile across all tunings
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const meanProfile = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    meanProfile[ax] = profiles.reduce((s, p) => s + p[ax], 0) / profiles.length;
  }
  const total = axes.reduce((s, ax) => s + meanProfile[ax], 0);
  if (total <= 0) {
    return { entropy: 0, normalizedEntropy: 0 };
  }
  let entropy = 0;
  for (const ax of axes) {
    const p = meanProfile[ax] / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  const normalizedEntropy = entropy / Math.log2(5);
  return { entropy, normalizedEntropy };
}

// ---------------------------------------------------------------------------
// Q932 — tuningFamilySocraticRadarAxisInteractions
// ---------------------------------------------------------------------------

/**
 * For each pair of axes, compute the product (interaction score).
 * Returns all 10 combinations from ['benchmark','convergence','diversity','maturity','versatility'],
 * sorted alphabetically, as keys "axis1_axis2".
 */
export function tuningFamilySocraticRadarAxisInteractions(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { interactions: Record<string, number> } {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['benchmark', 'convergence', 'diversity', 'maturity', 'versatility'];
  // Compute mean profile across all tunings
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const meanProfile = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    meanProfile[ax] = profiles.reduce((s, p) => s + p[ax], 0) / profiles.length;
  }
  const interactions: Record<string, number> = {};
  for (let i = 0; i < axes.length; i++) {
    for (let j = i + 1; j < axes.length; j++) {
      const axI = axes[i]!;
      const axJ = axes[j]!;
      interactions[`${axI}_${axJ}`] = meanProfile[axI] * meanProfile[axJ];
    }
  }
  return { interactions };
}

// ---------------------------------------------------------------------------
// Q934 — tuningFamilySocraticRadarPolarizationIndex
// ---------------------------------------------------------------------------

/**
 * How many axes are "extreme" (< 0.2 or > 0.8) vs moderate.
 * polarizationIndex = extremeCount / 5 ∈ [0,1].
 */
export function tuningFamilySocraticRadarPolarizationIndex(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  polarizationIndex: number;
  polarizationLabel: 'neutral' | 'moderate' | 'polarized';
  extremeAxes: ('diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence')[];
} {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  // Compute mean profile
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const meanProfile = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    meanProfile[ax] = profiles.reduce((s, p) => s + p[ax], 0) / profiles.length;
  }
  const extremeAxes: AxisKey[] = axes.filter((ax) => meanProfile[ax] < 0.2 || meanProfile[ax] > 0.8);
  const polarizationIndex = extremeAxes.length / 5;
  const polarizationLabel: 'neutral' | 'moderate' | 'polarized' =
    polarizationIndex < 0.4 ? 'neutral' : polarizationIndex < 0.7 ? 'moderate' : 'polarized';
  return { polarizationIndex, polarizationLabel, extremeAxes };
}

// ---------------------------------------------------------------------------
// Q936 — tuningFamilySocraticRadarSignatureDistance
// ---------------------------------------------------------------------------

/**
 * Euclidean distance between two family mean profiles.
 * normalizedDistance = distance / sqrt(5).
 */
export function tuningFamilySocraticRadarSignatureDistance(
  tuningsA: readonly TuningSystem[],
  tuningsB: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { distance: number; normalizedDistance: number } {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const profilesA = tuningsA.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const profilesB = tuningsB.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const meanA = {} as Record<AxisKey, number>;
  const meanB = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    meanA[ax] = profilesA.reduce((s, p) => s + p[ax], 0) / profilesA.length;
    meanB[ax] = profilesB.reduce((s, p) => s + p[ax], 0) / profilesB.length;
  }
  const distance = Math.sqrt(axes.reduce((s, ax) => s + (meanA[ax] - meanB[ax]) ** 2, 0));
  const normalizedDistance = distance / Math.sqrt(5);
  return { distance, normalizedDistance };
}

// ---------------------------------------------------------------------------
// Q938 — tuningFamilySocraticRadarClusterability
// ---------------------------------------------------------------------------

/**
 * How "clusterable" a list of tunings is: ratio of within-cluster cohesion.
 * clusterability = 1 - avgDistance / sqrt(5) ∈ [0,1].
 */
export function tuningFamilySocraticRadarClusterability(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { clusterability: number; avgDistance: number } {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  if (profiles.length === 0) {
    return { clusterability: 1, avgDistance: 0 };
  }
  const meanProfile = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    meanProfile[ax] = profiles.reduce((s, p) => s + p[ax], 0) / profiles.length;
  }
  const avgDistance =
    profiles.reduce(
      (s, p) => s + Math.sqrt(axes.reduce((ss, ax) => ss + (p[ax] - meanProfile[ax]) ** 2, 0)),
      0,
    ) / profiles.length;
  const maxPossibleDistance = Math.sqrt(5);
  const clusterability = 1 - avgDistance / maxPossibleDistance;
  return { clusterability, avgDistance };
}

// ---------------------------------------------------------------------------
// Q940 — tuningFamilySocraticRadarDominanceMap
// ---------------------------------------------------------------------------

/**
 * For each axis, which tuning in the family is the "dominant" (highest score)?
 * Returns the 0-based index into the tunings array. Ties resolved by first (lowest index).
 */
export function tuningFamilySocraticRadarDominanceMap(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): {
  dominanceMap: Record<
    'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
    number
  >;
} {
  type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const dominanceMap = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    let bestIdx = 0;
    let bestVal = profiles.length > 0 ? (profiles[0]?.[ax] ?? 0) : 0;
    for (let i = 1; i < profiles.length; i++) {
      const val = profiles[i]?.[ax] ?? 0;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }
    dominanceMap[ax] = bestIdx;
  }
  return { dominanceMap };
}

// ---------------------------------------------------------------------------
// Q942 — tuningFamilySocraticRadarRegimeProbability
// ---------------------------------------------------------------------------

type AxisKey = 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence';
type RegimeSpec = Partial<Record<AxisKey, { min?: number; max?: number }>>;

/**
 * Compute the fraction of family members satisfying ALL axis thresholds in a regime spec.
 * A tuning satisfies an axis spec if score >= min (if set) AND <= max (if set).
 *
 * @param tunings - Array of tunings in the family.
 * @param regime - Partial record of axis thresholds.
 * @param spectrum - Timbre spectrum.
 * @param rootHz - Reference frequency (optional).
 * @returns { probability, passingIndices }
 */
export function tuningFamilySocraticRadarRegimeProbability(
  tunings: readonly TuningSystem[],
  regime: RegimeSpec,
  spectrum: Spectrum,
  rootHz?: number,
): { probability: number; passingIndices: number[] } {
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const regimeAxes = Object.keys(regime) as AxisKey[];
  const passingIndices: number[] = [];
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i]!;
    let passes = true;
    for (const ax of regimeAxes) {
      const spec = regime[ax];
      if (!spec) continue;
      const score = p[ax];
      if (spec.min !== undefined && score < spec.min) { passes = false; break; }
      if (spec.max !== undefined && score > spec.max) { passes = false; break; }
    }
    if (passes) passingIndices.push(i);
  }
  const probability = tunings.length === 0 ? 0 : passingIndices.length / tunings.length;
  return { probability, passingIndices };
}

// ---------------------------------------------------------------------------
// Q944 — tuningFamilySocraticRadarContribution
// ---------------------------------------------------------------------------

/**
 * For each tuning in the family, compute its "contribution" to the family mean profile
 * (L2 distance from mean / sum of all distances). Returns all-zeros if all tunings are identical.
 *
 * @param tunings - Array of tunings in the family.
 * @param spectrum - Timbre spectrum.
 * @param rootHz - Reference frequency (optional).
 * @returns { contributions } — length = tunings.length, sums to 1.0 (or all-zeros if all identical).
 */
export function tuningFamilySocraticRadarContribution(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { contributions: number[] } {
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  if (profiles.length === 0) return { contributions: [] };
  const meanProfile = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    meanProfile[ax] = profiles.reduce((s, p) => s + p[ax], 0) / profiles.length;
  }
  const distances = profiles.map((p) =>
    Math.sqrt(axes.reduce((s, ax) => s + (p[ax] - meanProfile[ax]) ** 2, 0)),
  );
  const totalDistance = distances.reduce((s, d) => s + d, 0);
  const contributions =
    totalDistance === 0 ? distances.map(() => 0) : distances.map((d) => d / totalDistance);
  return { contributions };
}

// ---------------------------------------------------------------------------
// Q946 — tuningFamilySocraticRadarOutlierDetection
// ---------------------------------------------------------------------------

/**
 * Identify tunings that are statistical outliers on any axis (z-score > threshold).
 * If only 1 tuning, returns empty (can't compute z-score). If std=0 on an axis, no outlier on that axis.
 *
 * @param tunings - Array of tunings in the family.
 * @param spectrum - Timbre spectrum.
 * @param rootHz - Reference frequency (optional).
 * @param threshold - Z-score threshold (default 1.5).
 * @returns { outlierIndices, outlierAxes }
 */
export function tuningFamilySocraticRadarOutlierDetection(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
  threshold = 1.5,
): { outlierIndices: number[]; outlierAxes: Record<number, AxisKey[]> } {
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  if (tunings.length <= 1) return { outlierIndices: [], outlierAxes: {} };
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const meanPerAxis = {} as Record<AxisKey, number>;
  const stdPerAxis = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    const vals = profiles.map((p) => p[ax]);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    meanPerAxis[ax] = mean;
    stdPerAxis[ax] = Math.sqrt(variance);
  }
  const outlierAxes: Record<number, AxisKey[]> = {};
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i]!;
    const outlierAxList: AxisKey[] = [];
    for (const ax of axes) {
      const std = stdPerAxis[ax];
      if (std === 0) continue;
      const z = Math.abs((p[ax] - meanPerAxis[ax]) / std);
      if (z > threshold) outlierAxList.push(ax);
    }
    if (outlierAxList.length > 0) {
      outlierAxes[i] = outlierAxList;
    }
  }
  const outlierIndices = Object.keys(outlierAxes).map(Number).sort((a, b) => a - b);
  return { outlierIndices, outlierAxes };
}

// ---------------------------------------------------------------------------
// Q948 — tuningFamilySocraticRadarTrend
// ---------------------------------------------------------------------------

/**
 * Compute per-axis linear regression slope over the ordered tuning sequence.
 * If only 1 tuning, all slopes = 0 and overallTrend = 'stable'.
 *
 * @param tunings - Ordered array of tunings (conceptually temporal/evolutionary).
 * @param spectrum - Timbre spectrum.
 * @param rootHz - Reference frequency (optional).
 * @returns { slopes, overallTrend }
 */
export function tuningFamilySocraticRadarTrend(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { slopes: Record<AxisKey, number>; overallTrend: 'improving' | 'declining' | 'stable' } {
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  if (tunings.length <= 1) {
    const slopes = {} as Record<AxisKey, number>;
    for (const ax of axes) slopes[ax] = 0;
    return { slopes, overallTrend: 'stable' };
  }
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const n = profiles.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const slopes = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    const vals = profiles.map((p) => p[ax]);
    const sumY = vals.reduce((s, v) => s + v, 0);
    const sumXY = vals.reduce((s, v, i) => s + i * v, 0);
    const denom = n * sumX2 - sumX * sumX;
    slopes[ax] = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  }
  const avgSlope = Object.values(slopes).reduce((s, v) => s + v, 0) / 5;
  const overallTrend: 'improving' | 'declining' | 'stable' =
    avgSlope > 0.02 ? 'improving' : avgSlope < -0.02 ? 'declining' : 'stable';
  return { slopes, overallTrend };
}

// ---------------------------------------------------------------------------
// Q950 — tuningFamilySocraticRadarRobustnessScore
// ---------------------------------------------------------------------------

/**
 * Measures how robust a family profile is via leave-one-out analysis.
 * robustnessScore = 1 - (max LOO distance / sqrt(5)).
 * Single tuning: robustnessScore=1, mostInfluentialIndex=0.
 *
 * @param tunings - Array of tunings in the family.
 * @param spectrum - Timbre spectrum.
 * @param rootHz - Reference frequency (optional).
 * @returns { robustnessScore, mostInfluentialIndex }
 */
export function tuningFamilySocraticRadarRobustnessScore(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { robustnessScore: number; mostInfluentialIndex: number } {
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  if (tunings.length <= 1) return { robustnessScore: 1, mostInfluentialIndex: 0 };
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const fullMean = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    fullMean[ax] = profiles.reduce((s, p) => s + p[ax], 0) / profiles.length;
  }
  let maxDist = 0;
  let mostInfluentialIndex = 0;
  for (let i = 0; i < profiles.length; i++) {
    const looProfiles = profiles.filter((_, j) => j !== i);
    const looMean = {} as Record<AxisKey, number>;
    for (const ax of axes) {
      looMean[ax] = looProfiles.reduce((s, p) => s + p[ax], 0) / looProfiles.length;
    }
    const dist = Math.sqrt(axes.reduce((s, ax) => s + (looMean[ax] - fullMean[ax]) ** 2, 0));
    if (dist > maxDist) {
      maxDist = dist;
      mostInfluentialIndex = i;
    }
  }
  const robustnessScore = 1 - maxDist / Math.sqrt(5);
  return { robustnessScore, mostInfluentialIndex };
}

// ---------------------------------------------------------------------------
// Q952 — tuningFamilySocraticRadarCentroidProfile
// ---------------------------------------------------------------------------

/**
 * Compute the centroid (arithmetic mean profile) of the family and find the tuning closest to it.
 *
 * @param tunings - Array of tunings in the family.
 * @param spectrum - Timbre spectrum.
 * @param rootHz - Reference frequency (optional).
 * @returns { centroid, closestIndex, closestDistance }
 */
export function tuningFamilySocraticRadarCentroidProfile(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  rootHz?: number,
): { centroid: Record<AxisKey, number>; closestIndex: number; closestDistance: number } {
  const axes: AxisKey[] = ['diversity', 'versatility', 'maturity', 'benchmark', 'convergence'];
  const profiles = tunings.map((t) => tuningFamilySocraticRadarProfile([t], spectrum, rootHz));
  const centroid = {} as Record<AxisKey, number>;
  for (const ax of axes) {
    centroid[ax] =
      profiles.length === 0 ? 0 : profiles.reduce((s, p) => s + p[ax], 0) / profiles.length;
  }
  let closestIndex = 0;
  let closestDistance = Infinity;
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i]!;
    const dist = Math.sqrt(axes.reduce((s, ax) => s + (p[ax] - centroid[ax]) ** 2, 0));
    if (dist < closestDistance) {
      closestDistance = dist;
      closestIndex = i;
    }
  }
  if (profiles.length === 0) closestDistance = 0;
  return { centroid, closestIndex, closestDistance };
}

// ---------------------------------------------------------------------------
// M1 — melodicContour
// ---------------------------------------------------------------------------

/**
 * Melodic contour analysis (Adams/Marvin 1995 contour theory).
 *
 * Encodes the melodic motion between consecutive pitch classes as a string of:
 *   - 'U' (Up)   — interval ascending (shortest path mod 12, i.e. < 6 semitones up)
 *   - 'D' (Down) — interval descending (shortest path mod 12, i.e. > 6 semitones down)
 *   - 'R' (Repeat) — same pitch class
 *   - Ambiguous tritone (diff == 6) is treated as 'U'
 *
 * @param pitchClasses - Array of pitch class integers (0–11). Values are taken mod 12.
 * @returns String of length `pitchClasses.length - 1`, or "" for empty / single-note input.
 *
 * @example
 * melodicContour([0, 4, 2, 7, 5]); // "UDUD"
 * melodicContour([0, 2, 4, 7]);    // "UUU"
 * melodicContour([]);               // ""
 */
export function melodicContour(pitchClasses: readonly number[]): string {
  if (pitchClasses.length < 2) return '';
  let result = '';
  for (let i = 0; i < pitchClasses.length - 1; i++) {
    const a = ((pitchClasses[i]! % 12) + 12) % 12;
    const b = ((pitchClasses[i + 1]! % 12) + 12) % 12;
    if (a === b) {
      result += 'R';
    } else {
      // Shortest-path interval: ascending direction (mod 12)
      const up = ((b - a) + 12) % 12; // 1..11
      // up < 6 → ascending, up > 6 → descending, up === 6 → tritone → treat as U
      result += up <= 6 ? 'U' : 'D';
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// M2 — harmonicRhythm
// ---------------------------------------------------------------------------

/**
 * Harmonic rhythm analysis — detects where chords change in a progression
 * and computes change density metrics.
 *
 * Two chords are "the same" if they share identical sorted pitch classes mod 12.
 *
 * @param chords - Array of chords (each chord is an array of pitch class integers).
 * @param beatDurations - Duration (in beats) of each chord slot; must have same length as `chords`.
 * @returns
 *   - `changePositions`: 0-based beat-slot indices where the chord differs from the previous slot
 *   - `avgDuration`: totalDuration / changeCount (or totalDuration if no changes)
 *   - `density`: changeCount / totalDuration (changes per beat)
 *
 * @throws RangeError if `chords.length !== beatDurations.length`
 *
 * @example
 * harmonicRhythm([[0,4,7],[0,4,7],[2,5,9]], [1,1,1]);
 * // { changePositions: [2], avgDuration: 3, density: 1/3 }
 */
export function harmonicRhythm(
  chords: readonly (readonly number[])[],
  beatDurations: readonly number[],
): { changePositions: number[]; avgDuration: number; density: number } {
  if (chords.length !== beatDurations.length) {
    throw new RangeError(
      `harmonicRhythm: chords.length (${chords.length}) !== beatDurations.length (${beatDurations.length})`,
    );
  }
  if (chords.length === 0) {
    return { changePositions: [], avgDuration: 0, density: 0 };
  }

  const normalizeChord = (chord: readonly number[]): string =>
    chord
      .map((pc) => ((pc % 12) + 12) % 12)
      .sort((a, b) => a - b)
      .join(',');

  const totalDuration = beatDurations.reduce((s, d) => s + d, 0);
  const changePositions: number[] = [];

  let prevKey = normalizeChord(chords[0]!);
  for (let i = 1; i < chords.length; i++) {
    const key = normalizeChord(chords[i]!);
    if (key !== prevKey) {
      changePositions.push(i);
      prevKey = key;
    }
  }

  const changeCount = changePositions.length;
  const avgDuration = changeCount > 0 ? totalDuration / changeCount : totalDuration;
  const density = totalDuration > 0 ? changeCount / totalDuration : 0;

  return { changePositions, avgDuration, density };
}

// ---------------------------------------------------------------------------
// M3 — scaleRotations
// ---------------------------------------------------------------------------

/**
 * Generate all rotations of a scale (modes), each normalized to start at 0.
 *
 * Given a sorted array of degree values (e.g. pitch classes or semitone offsets),
 * returns `degrees.length` rotations. Each rotation takes `degrees[i]` as the
 * new root, subtracts it from all elements (mod 12), and sorts the result.
 *
 * @param degrees - Sorted array of scale degrees (integers, typically 0–11 pitch classes).
 * @returns Array of `degrees.length` rotations, each sorted and normalized to start at 0.
 *          Returns `[[]]` for empty input.
 *
 * @example
 * scaleRotations([0, 2, 4, 5, 7, 9, 11]);
 * // [
 * //   [0, 2, 4, 5, 7, 9, 11],   // Ionian (original)
 * //   [0, 2, 3, 5, 7, 9, 10],   // Dorian
 * //   ...
 * // ]
 */
export function scaleRotations(degrees: readonly number[]): number[][] {
  if (degrees.length === 0) return [[]];
  const result: number[][] = [];
  for (let i = 0; i < degrees.length; i++) {
    const root = degrees[i]!;
    const rotation = degrees.map((d) => ((d - root) % 12 + 12) % 12).sort((a, b) => a - b);
    result.push(rotation);
  }
  return result;
}

// ---------------------------------------------------------------------------
// M4 — chordProgressionTension
// ---------------------------------------------------------------------------

/**
 * Compute the sensory dissonance score for each chord in a progression.
 *
 * Pitch classes are converted to absolute frequencies as:
 *   freq = rootHz * 2^(pc / 12)
 *
 * Uses the Sethares/Plomp-Levelt model via the existing `chordDissonance` function.
 *
 * @param chords - Array of chords (each chord is an array of pitch class integers).
 * @param spectrum - Timbre spectrum (array of `{ ratio, amplitude }` partials).
 * @param rootHz - Fundamental frequency for pitch class 0 (default: 220 Hz).
 * @returns Array of dissonance scores (one per chord); higher = more tense/dissonant.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * chordProgressionTension([[0, 4, 7], [0, 5, 9], [2, 5, 9]], spec, 220);
 * // [majorDissonance, minorDissonance, ...]
 */
export function chordProgressionTension(
  chords: readonly (readonly number[])[],
  spectrum: Spectrum,
  rootHz = 220,
): number[] {
  return chords.map((chord) => {
    const freqs = chord.map((pc) => rootHz * Math.pow(2, pc / 12));
    return chordDissonance(freqs, spectrum);
  });
}

// ---------------------------------------------------------------------------
// N2 — midiNoteToName
// ---------------------------------------------------------------------------

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/**
 * Convert a MIDI note number to a human-readable note name with octave.
 *
 * MIDI 60 = C4, MIDI 69 = A4, MIDI 0 = C-1, MIDI 127 = G9.
 * Enharmonic accidentals use sharps (default) or flats.
 *
 * @param midi - Integer MIDI note number (0–127).
 * @param preferSharps - If `true` (default), use sharps (C#, D#, …); otherwise use flats (Db, Eb, …).
 * @returns Note name with octave, e.g. `"C4"`, `"A#4"`, `"Bb4"`.
 *
 * @example
 * midiNoteToName(60);          // "C4"
 * midiNoteToName(69);          // "A4"
 * midiNoteToName(61, true);    // "C#4"
 * midiNoteToName(61, false);   // "Db4"
 */
export function midiNoteToName(midi: number, preferSharps = true): string {
  const octave = Math.floor(midi / 12) - 1;
  const pc = ((midi % 12) + 12) % 12;
  const names = preferSharps ? SHARP_NAMES : FLAT_NAMES;
  const name = names[pc]!;
  return `${name}${octave}`;
}

// ---------------------------------------------------------------------------
// N3 — scaleSubsets
// ---------------------------------------------------------------------------

/**
 * Generate all unique subsets of a given size from scale degrees, each normalized to start at 0.
 *
 * Every C(n, size) combination of `degrees` is taken, then normalized by subtracting
 * the minimum value of the subset (mod 12) from all elements. Duplicates that arise
 * from normalization are removed. Results are sorted within each subset and subsets
 * are sorted lexicographically.
 *
 * @param degrees - Array of scale degree integers (typically pitch classes 0–11).
 * @param size - Number of elements in each subset.
 * @returns Array of normalized subsets, sorted lexicographically. Empty if `size <= 0` or `size > degrees.length`.
 *
 * @example
 * scaleSubsets([0, 2, 4, 5, 7, 9, 11], 3);
 * // All 3-note subsets of the major scale, normalized to start at 0
 */
export function scaleSubsets(degrees: readonly number[], size: number): number[][] {
  if (size <= 0 || size > degrees.length) return [];

  const results: number[][] = [];
  const seen = new Set<string>();

  function combine(start: number, current: number[]): void {
    if (current.length === size) {
      const minVal = current[0]!;
      const normalized = current.map((d) => ((d - minVal) % 12 + 12) % 12).sort((a, b) => a - b);
      const key = normalized.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        results.push(normalized);
      }
      return;
    }
    const remaining = degrees.length - start;
    const needed = size - current.length;
    if (remaining < needed) return;
    for (let i = start; i < degrees.length; i++) {
      combine(i + 1, [...current, degrees[i]!]);
    }
  }

  combine(0, []);
  results.sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i]! !== b[i]!) return a[i]! - b[i]!;
    }
    return a.length - b.length;
  });
  return results;
}

// ---------------------------------------------------------------------------
// N4 — fundamentalBassNote
// ---------------------------------------------------------------------------

/**
 * Find the pitch class that, when used as a bass note, produces the lowest
 * sensory dissonance for the given chord.
 *
 * For each unique pitch class in `chord`, compute the dissonance of the full
 * texture [bassFreq, ...chordFreqs] where bassFreq = rootHz * 2^(bass_pc / 12).
 * Returns the pitch class that minimises `chordDissonance(freqs, spectrum)`.
 *
 * @param chord - Array of pitch class integers (0–11).
 * @param spectrum - Timbre spectrum (array of `{ ratio, amplitude }` partials).
 * @param rootHz - Frequency for pitch class 0 (default: 220 Hz).
 * @returns The pitch class (0–11) that minimises dissonance when used as the bass note.
 *          For single-note chords, returns that note's pitch class mod 12.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * fundamentalBassNote([0, 4, 7], spec); // likely returns 0 (C as bass for C major)
 */
export function fundamentalBassNote(
  chord: readonly number[],
  spectrum: Spectrum,
  rootHz = 220,
): number {
  if (chord.length === 0) return 0;
  if (chord.length === 1) return ((chord[0]! % 12) + 12) % 12;

  const uniquePcs = [...new Set(chord.map((pc) => ((pc % 12) + 12) % 12))];
  const chordFreqs = chord.map((pc) => rootHz * Math.pow(2, ((pc % 12 + 12) % 12) / 12));

  let bestPc = uniquePcs[0]!;
  let bestDissonance = Infinity;

  for (const bassPC of uniquePcs) {
    const bassFreq = rootHz * Math.pow(2, bassPC / 12);
    const allFreqs = [bassFreq, ...chordFreqs];
    const dissonance = chordDissonance(allFreqs, spectrum);
    if (dissonance < bestDissonance) {
      bestDissonance = dissonance;
      bestPc = bassPC;
    }
  }

  return bestPc;
}
