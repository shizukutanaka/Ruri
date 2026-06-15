import { type TuningSystem, defineTuning, degreeToCents, degreeToFreq } from './tuning.js';
import { type Spectrum } from './spectrum.js';
import { chordDissonance } from './dissonance.js';
import { rankChords, type RankedChord, type ChordSearchOptions } from './chord-search.js';
import { synthScale, type SynthScaleOptions, DEFAULT_SYNTH_SCALE } from './ks-synth.js';

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
