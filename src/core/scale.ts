import {
  type TuningSystem,
  defineTuning,
  degreeToCents,
  degreeToFreq,
  tuningToIntervalVector,
} from './tuning.js';
import { type Spectrum, harmonicSpectrum } from './spectrum.js';
import { midiToFreq } from './midi.js';
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
