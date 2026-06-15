import {
  type TuningSystem,
  defineTuning,
  degreeToCents,
  degreeToFreq,
  tuningToIntervalVector,
} from './tuning.js';
import { type Spectrum } from './spectrum.js';
import { chordDissonance } from './dissonance.js';
import {
  rankChords,
  type RankedChord,
  type ChordSearchOptions,
  rankedChordToChord,
} from './chord-search.js';
import { synthScale, type SynthScaleOptions, DEFAULT_SYNTH_SCALE } from './ks-synth.js';
import { type Chord, chordFromDegrees } from './chord.js';

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
