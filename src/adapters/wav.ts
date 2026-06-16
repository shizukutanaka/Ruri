/** 16-bit PCM mono WAV encoder. Zero-dep, byte-exact. */

import { strike, strikeChord, type ModalOptions, DEFAULT_MODAL } from '../core/modal-synth.js';
import { type Spectrum, harmonicSpectrum } from '../core/spectrum.js';
import { type TuningSystem, degreeToFreq } from '../core/tuning.js';
import {
  DEFAULT_KS,
  type KsOptions,
  mix,
  pluckChord,
  type SynthScaleOptions,
  synthScale,
} from '../core/ks-synth.js';
import {
  type Scale,
  type ScaleChordMapEntry,
  type ChordMapAnalysisEntry,
  scaleToFreqs,
  synthScaleFromScale,
  buildChordProgression,
  scaleModeSeries,
  bestProgressionForScale,
  rankScaleChords,
  bestModeForTuning,
  bestChordForMidiNote,
  rankChordMapByHarmonicity,
  progressionFromPattern,
  rankChordMapByDissonance,
  scaleToChordMap,
  rankAllModesForTimbre,
  tuningToScale,
  rankModeSeriesByHarmonicity,
  chordMapAnalysis,
  rankModesByStability,
  progressionNarrative,
  chordProgressionSmooth,
  modeVolatilityProfile,
  chordMapProgressionBridge,
  tuningReportCard,
  bestModeByEntropy,
  chordMapEntropyScore,
} from '../core/scale.js';
import { ALL_PRESETS, getTuningById } from '../data/presets.js';
import { type TuningPreset } from '../data/tuning-data.js';
import {
  type RankedChord,
  strikeRankedChord,
  pluckRankedChord,
  optimalChordOrder,
} from '../core/chord-search.js';
import { type Chord, realizeChordFreqs } from '../core/chord.js';
import {
  chordToSmf,
  type ChordToSmfOptions,
  progressionToSmf,
  smoothProgressionSmf,
  type SmfOptions,
} from './smf.js';
import { chordProgressionToMts } from './mts.js';

const writeStr = (view: DataView, offset: number, s: string): void => {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
};

/** Encode mono Float32 samples ([-1,1]) to a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate = 44100): Uint8Array {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);

  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + n * 2, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(view, 36, 'data');
  view.setUint32(40, n * 2, true);

  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] as number));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return new Uint8Array(buffer);
}

/**
 * Synthesize a chord and encode it to a 16-bit PCM WAV in one call.
 *
 * Socratic Q54: `strikeChord` produces a `Float32Array`; `encodeWav` accepts one.
 * If "chord synthesis" is truly one call (`strikeChord`) and "WAV encoding" is
 * truly one call (`encodeWav`), then "chord → ready-to-write WAV bytes" should
 * also be one call — yet today it requires two. This bridges that gap.
 *
 * The `sampleRate` for `encodeWav` is taken from `modalOpts.sampleRate` (or the
 * `DEFAULT_MODAL` default) so the header and the audio agree on the same rate
 * without the caller needing to thread it through manually.
 *
 * @example
 * const wav = strikeChordToWav([261.63, 329.63, 392.0], harmonicSpectrum());
 * await fs.writeFile('chord.wav', wav); // ready to play
 */
export function strikeChordToWav(
  freqs: readonly number[],
  spectrum: Spectrum,
  modalOpts?: ModalOptions,
): Uint8Array {
  const opts = modalOpts ?? DEFAULT_MODAL;
  const samples = strikeChord(freqs, spectrum, opts);
  return encodeWav(samples, opts.sampleRate);
}

/**
 * Synthesize a chord via Karplus-Strong plucking and encode it to a 16-bit PCM WAV in one call.
 *
 * Socratic Q69: `strikeChordToWav` closes the modal-synthesis → WAV gap. The
 * Karplus-Strong analog — `pluckChord(freqs, opts)` followed by `encodeWav` —
 * is a separate pipeline step today. If plucked chord synthesis is truly
 * first-class, "plucked chord → ready-to-write WAV bytes" should also be one
 * call. This bridges that gap.
 *
 * The `sampleRate` for `encodeWav` is taken from `ksOpts.sampleRate` (or the
 * `DEFAULT_KS` default), ensuring the WAV header and the audio agree on the
 * same rate without the caller threading it through manually.
 *
 * @throws {RangeError} if `freqs` is empty.
 *
 * @example
 * const wav = pluckChordToWav([261.63, 329.63, 392.0]);
 * await fs.writeFile('chord.wav', wav); // ready to play
 */
export function pluckChordToWav(freqs: readonly number[], ksOpts?: KsOptions): Uint8Array {
  const opts = ksOpts ?? DEFAULT_KS;
  const samples = pluckChord(freqs, opts);
  return encodeWav(samples, opts.sampleRate);
}

export type TuningScaleWavOptions = SynthScaleOptions;

/**
 * Sonify a `TuningSystem` as an ascending scale WAV in one call.
 *
 * Socratic Q59: `edo(12)` (or any `TuningSystem`) expresses a full pitch
 * vocabulary — but turning it into an audio demonstration requires four manual
 * steps: iterate degrees → `degreeToFreq` for each → `pluck` each note →
 * concatenate → `encodeWav`. This is an obvious gap: if a tuning system is
 * truly first-class, it should be auditionable in one call.
 *
 * Each degree of the tuning is played in ascending order using Karplus-Strong
 * synthesis. All degrees within one period (0 to `tuning.degrees.length - 1`)
 * are included. The result is a 16-bit PCM mono WAV byte sequence ready to
 * write to a `.wav` file.
 *
 * @example
 * const wav = tuningToScaleWav(edo(19));
 * await fs.writeFile('19edo.wav', wav);
 *
 * @example
 * // Custom duration and sample rate
 * const wav = tuningToScaleWav(spectrumToTuning(bellSpectrum()), {
 *   ...DEFAULT_SYNTH_SCALE,
 *   noteSeconds: 0.3,
 *   sampleRate: 22050,
 * });
 */
export function tuningToScaleWav(
  tuning: TuningSystem,
  opts: TuningScaleWavOptions = { ...DEFAULT_KS, noteSeconds: 0.5 },
): Uint8Array {
  const freqs = Array.from({ length: tuning.degrees.length }, (_, i) => degreeToFreq(tuning, i));
  const samples = synthScale(freqs, opts);
  return encodeWav(samples, opts.sampleRate);
}

export type PluckScaleWavOptions = SynthScaleOptions;

/**
 * Synthesize a `Scale` as a melodic WAV file in one call.
 *
 * Socratic Q63: `synthScaleFromScale(scale, tuning)` converts a `Scale` to a
 * melodic `Float32Array`; `encodeWav(samples)` turns that into ready-to-write
 * WAV bytes. If `Scale` → audio is one call, then `Scale` → WAV file bytes
 * should also be one call — yet today it requires two. This is the
 * Karplus-Strong analog of `tuningToScaleWav` but for a curated `Scale` subset
 * rather than all degrees of a `TuningSystem`.
 *
 * Each scale degree is plucked in ascending order via Karplus-Strong; notes are
 * concatenated without overlap. The result is a 16-bit PCM mono WAV byte
 * sequence ready to write to a `.wav` file.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` (tuningId mismatch
 *   or degree indices out of range), or if the scale has no degrees.
 *
 * @example
 * const major = { id: 'major', name: 'Ionian', tuningId: '12-edo',
 *                 degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const wav = pluckScaleWav(major, edo(12));
 * await fs.writeFile('major-scale.wav', wav);
 */
export function pluckScaleWav(
  scale: Scale,
  tuning: TuningSystem,
  opts: PluckScaleWavOptions = { ...DEFAULT_KS, noteSeconds: 0.5 },
): Uint8Array {
  const samples = synthScaleFromScale(scale, tuning, opts);
  return encodeWav(samples, opts.sampleRate);
}

/** Options for {@link strikeScaleWav}: modal synthesis settings plus a per-note duration. */
export interface StrikeScaleWavOptions extends ModalOptions {
  /**
   * How many seconds of each struck tone to include in the melodic sequence.
   * Must be ≤ `seconds` (the full decay envelope length); values larger than
   * `seconds` are clamped to `seconds`. Default: 0.5.
   */
  readonly noteSeconds: number;
}

export const DEFAULT_STRIKE_SCALE: StrikeScaleWavOptions = {
  ...DEFAULT_MODAL,
  noteSeconds: 0.5,
};

/**
 * Synthesize a `Scale` as a melodic WAV using modal (additive) synthesis in one call.
 *
 * Socratic Q74: `pluckScaleWav` uses Karplus-Strong to play a `Scale` as a melody —
 * but the modal synthesis analog (struck tones rather than plucked strings, faithful
 * to inharmonic spectra like bells and gamelan) has no equivalent one-liner.
 * Going from `Scale` → modal audio → WAV requires: `scaleToFreqs` → loop over
 * `strike(freq, spectrum, opts)` per degree → concatenate slices → `encodeWav`.
 * `strikeScaleWav` closes this gap: if `pluckScaleWav` is one call, so should its
 * modal-synthesis counterpart be.
 *
 * Each degree is synthesized via `strike(freq, spectrum, opts)` and the first
 * `noteSeconds` of the resulting decay is included in the output, producing a
 * sequential melodic stream. The same `spectrum` used for dissonance scoring
 * drives the synthesis (single source of truth).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if the scale has no degrees.
 *
 * @example
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-edo',
 *                         degreeIndices: [0, 2, 4, 5, 7, 9, 11] };
 * const wav = strikeScaleWav(major, edo(12), bellSpectrum());
 * await fs.writeFile('major-bells.wav', wav);
 */
export function strikeScaleWav(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  opts: StrikeScaleWavOptions = DEFAULT_STRIKE_SCALE,
): Uint8Array {
  const freqs = scaleToFreqs(scale, tuning);
  if (freqs.length === 0) throw new RangeError('strikeScaleWav: scale has no degrees');
  const { sampleRate, noteSeconds, ...modalOpts } = opts;
  const fullModalOpts: ModalOptions = { sampleRate, ...modalOpts };
  const samplesPerNote = Math.floor(sampleRate * Math.min(noteSeconds, opts.seconds));
  const total = samplesPerNote * freqs.length;
  const out = new Float32Array(total);
  for (let i = 0; i < freqs.length; i++) {
    const freq = freqs[i] as number;
    const wave = strike(freq, spectrum, fullModalOpts);
    const offset = i * samplesPerNote;
    for (let j = 0; j < samplesPerNote && j < wave.length; j++) {
      out[offset + j] = wave[j] as number;
    }
  }
  return encodeWav(out, sampleRate);
}

/**
 * Synthesize a `RankedChord` via modal additive synthesis and encode it as a WAV in one call.
 *
 * Socratic Q77: `strikeRankedChord(chord, rootHz, spectrum)` produces a `Float32Array`;
 * `encodeWav(samples)` turns that into ready-to-write WAV bytes. If `RankedChord` is
 * truly first-class (it's the library's primary chord-discovery output), then
 * "ranked chord → ready-to-write WAV bytes" should be one call — yet today it requires
 * two. This bridges the final step of the `rankChords → strikeRankedChord → encodeWav`
 * pipeline, matching the pattern established by `strikeChordToWav`.
 *
 * The `sampleRate` for `encodeWav` is taken from `opts.sampleRate` (or `DEFAULT_MODAL`)
 * so the WAV header and the audio data agree without the caller threading it through.
 *
 * @example
 * const [best] = rankChords(edo(19), { size: 3 });
 * const wav = strikeRankedChordWav(best!, 261.63, harmonicSpectrum());
 * await fs.writeFile('best-chord.wav', wav);
 */
export function strikeRankedChordWav(
  chord: RankedChord,
  rootHz: number,
  spectrum: Spectrum,
  opts: ModalOptions = DEFAULT_MODAL,
): Uint8Array {
  const samples = strikeRankedChord(chord, rootHz, spectrum, opts);
  return encodeWav(samples, opts.sampleRate);
}

/**
 * Synthesize a `RankedChord` via Karplus-Strong plucking and encode it as a WAV in one call.
 *
 * Socratic Q77 (pair): `pluckRankedChord(chord, rootHz)` produces a `Float32Array`;
 * `encodeWav(samples)` turns that into ready-to-write WAV bytes. The KS analog of
 * `strikeRankedChordWav`: both close the same pipeline gap for their respective
 * synthesis engines. If `pluckChordToWav` and `strikeChordToWav` exist, so should
 * their `RankedChord`-native equivalents.
 *
 * The `sampleRate` for `encodeWav` is taken from `opts.sampleRate` (or `DEFAULT_KS`)
 * so the WAV header and the audio data agree without the caller threading it through.
 *
 * @example
 * const [best] = rankChords(edo(19), { size: 3 });
 * const wav = pluckRankedChordWav(best!, 261.63);
 * await fs.writeFile('best-chord.wav', wav);
 */
export function pluckRankedChordWav(
  chord: RankedChord,
  rootHz: number,
  opts: KsOptions = DEFAULT_KS,
): Uint8Array {
  const samples = pluckRankedChord(chord, rootHz, opts);
  return encodeWav(samples, opts.sampleRate);
}

/** Options for {@link chordProgressionToWav}. */
export interface ChordProgressionToWavOptions extends ModalOptions {
  /**
   * How many seconds of each struck chord to include in the output.
   * Must be ≤ `seconds`; values larger than `seconds` are clamped to `seconds`. Default: 0.5.
   */
  readonly chordSeconds: number;
}

export const DEFAULT_CHORD_PROGRESSION_WAV: ChordProgressionToWavOptions = {
  ...DEFAULT_MODAL,
  chordSeconds: 0.5,
};

/**
 * Synthesize an explicit chord progression and encode it as a single WAV file.
 *
 * Socratic Q100: `strikeChordToWav` renders one chord at a time. A chord progression
 * (an explicit `Chord[]`) still requires a manual loop: realize each chord's frequencies,
 * strike it, slice to the desired duration, concatenate, and encode. If chord progressions
 * are first-class (there are `chordProgressionToMts`, `progressionToSmf` etc.), then
 * "progression → ready-to-write WAV bytes" should also be one call.
 *
 * Unlike `scaleToChordsWav` (which operates on Scale → auto-ranked chords), this accepts
 * an explicit `Chord[]` — useful when you have specific harmonies from chord search,
 * composition, or manual selection.
 *
 * Each chord is synthesized via modal additive synthesis (`strikeChord`), truncated to
 * `chordSeconds`, and concatenated sequentially. The result is a 16-bit PCM mono WAV
 * byte sequence ready to write to a `.wav` file.
 *
 * @throws {RangeError} if `chords` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const major = chordFromRatios('major', [[1,1],[5,4],[3,2]]);
 * const dom7  = chordFromSemitones('dom7', [0, 4, 7, 10]);
 * const wav = chordProgressionToWav([major, dom7, major], 261.63, harmonicSpectrum());
 * await fs.writeFile('progression.wav', wav);
 */
export function chordProgressionToWav(
  chords: readonly Chord[],
  rootHz: number,
  spectrum: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  if (chords.length === 0) throw new RangeError('chordProgressionToWav: chords must be non-empty');
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(`chordProgressionToWav: rootHz must be finite and > 0, got ${rootHz}`);
  }
  const { chordSeconds, sampleRate, ...modalOpts } = opts;
  const fullModalOpts: ModalOptions = { sampleRate, ...modalOpts };
  const samplesPerChord = Math.floor(sampleRate * Math.min(chordSeconds, opts.seconds));
  const total = samplesPerChord * chords.length;
  const out = new Float32Array(total);
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i] as Chord;
    const freqs = realizeChordFreqs(chord, rootHz);
    const wave = strikeChord(freqs, spectrum, fullModalOpts);
    const offset = i * samplesPerChord;
    for (let j = 0; j < samplesPerChord && j < wave.length; j++) {
      out[offset + j] = wave[j] as number;
    }
  }
  // Normalize the full concatenated progression
  const outMixed = mix([out]);
  return encodeWav(outMixed, sampleRate);
}

/**
 * Full pipeline: Scale + tuning + degree-offset pattern → WAV bytes of the chord progression.
 *
 * Socratic Q105: `buildChordProgression(scale, tuning, pattern)` produces a `Chord[]`;
 * `chordProgressionToWav(chords, rootHz, spectrum, opts)` synthesizes it to WAV. If a
 * Scale-based progression is truly first-class (the library has `buildChordProgression`,
 * `chordProgressionToWav`, `progressionToSmf`, etc.), then going from musical intent
 * (Scale + pattern) all the way to ready-to-write audio bytes should be one call — yet
 * today it requires two. This bridges that gap.
 *
 * The `pattern` is an array of diatonic-offset arrays (0-indexed within the scale), each
 * defining one chord in the progression. See `buildChordProgression` for details.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `pattern` is empty or any offset is out of range.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * // Classic I–IV–V triad progression
 * const wav = buildChordProgressionWav(major, t12, [[0,2,4],[3,5,0],[4,6,1]], 261.63, harmonicSpectrum());
 * await fs.writeFile('ivi.wav', wav);
 */
export function buildChordProgressionWav(
  scale: Scale,
  tuning: TuningSystem,
  pattern: ReadonlyArray<readonly number[]>,
  rootHz: number,
  spectrum: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  const chords = buildChordProgression(scale, tuning, pattern);
  return chordProgressionToWav(chords, rootHz, spectrum, opts);
}

/**
 * Find the voice-leading–optimal ordering of a `Chord[]`, then synthesize to WAV in one call.
 *
 * Socratic Q107: `optimalChordOrder(chords, rootHz)` finds the ordering that minimises
 * voice-leading cost across a `Chord[]`; `chordProgressionToWav` synthesizes a `Chord[]`
 * to WAV. Going from "I have a bag of chords" to "I have an optimally ordered WAV" still
 * requires two explicit calls. If optimal ordering is first-class (there is already
 * `optimalProgressionSmf` for MIDI), its WAV counterpart should be one call too.
 *
 * The `chords` array is reordered by `optimalChordOrder` (nearest-neighbour / brute-force
 * TSP over voice-leading cost), then synthesized chord-by-chord to a single WAV file.
 *
 * @throws {RangeError} if `chords` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const chords = rankScaleChords(major, t12).map(rankedChordToChord);
 * const wav = optimalProgressionWav(chords, 261.63, harmonicSpectrum());
 * await fs.writeFile('optimal-progression.wav', wav);
 */
export function optimalProgressionWav(
  chords: readonly Chord[],
  rootHz: number,
  spectrum: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  const { chords: ordered } = optimalChordOrder(chords, rootHz);
  return chordProgressionToWav(ordered, rootHz, spectrum, opts);
}

/**
 * Synthesize every modal rotation of a scale as a melodic WAV in one call.
 *
 * Socratic Q112: `scaleModeSeries(scale, tuning)` returns all modal rotations as
 * `Scale[]`, and `pluckScaleWav(mode, tuning, opts)` encodes one mode to WAV bytes.
 * Producing audio for every modal flavor — e.g. to audition all 7 diatonic modes
 * before composing — still requires a `.map(…)` the caller writes every time.
 * If modal series are first-class, "all modes as audio" should be one call.
 *
 * Returns one `Uint8Array` WAV per modal rotation, in rotation order (index 0 =
 * original scale, 1 = starting from second degree, … n−1 = starting from last
 * degree). Encoding uses Karplus-Strong pluck synthesis via `pluckScaleWav`.
 *
 * @param scale  - The parent scale to rotate.
 * @param tuning - The parent `TuningSystem` the scale belongs to.
 * @param opts   - Optional Karplus-Strong + per-note duration options (forwarded to
 *   `pluckScaleWav`).
 * @returns `Uint8Array[]` — one WAV buffer per mode in rotation order.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if the scale has no degrees.
 *
 * @example
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const wavs = scaleModeSeriesWav(major, equalTemperament12(440));
 * // wavs[0] = Ionian, wavs[1] = Dorian, wavs[2] = Phrygian, ...
 * wavs.forEach((w, i) => fs.writeFileSync(`mode-${i}.wav`, w));
 */
export function scaleModeSeriesWav(
  scale: Scale,
  tuning: TuningSystem,
  opts: PluckScaleWavOptions = { ...DEFAULT_KS, noteSeconds: 0.5 },
): Uint8Array[] {
  return scaleModeSeries(scale, tuning).map((mode) => pluckScaleWav(mode, tuning, opts));
}

/**
 * Best acoustic chord progression for a scale, synthesized to WAV in one call.
 *
 * Socratic Q124: `bestProgressionForScale(scale, tuning, spectrum)` discovers the
 * most consonant N diatonic chords in voice-leading order. `chordProgressionToWav`
 * synthesizes a `Chord[]` to WAV. Going from "I have a scale and want to hear its
 * best progression" still requires two explicit calls. If the scale → best progression
 * pipeline is truly first-class, the entire chain — scale → acoustic WAV — should be
 * one call.
 *
 * @param scale      - The parent scale.
 * @param tuning     - The parent `TuningSystem`.
 * @param spectrum   - Instrument spectrum (for chord ranking and synthesis).
 * @param rootHz     - Absolute frequency of the chord root (Hz). Defaults to `tuning.referenceHz`.
 * @param numChords  - Number of chords to include in the progression (default 4).
 * @param size       - Notes per chord (default 3).
 * @param opts       - Optional chord progression WAV options.
 * @returns WAV bytes of the best chord progression for the scale.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if `numChords` < 1 or the scale has fewer available chords.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0 (when provided).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const wav = bestProgressionWav(major, t12, harmonicSpectrum(), 261.63);
 * await fs.writeFile('best-prog.wav', wav);
 */
export function bestProgressionWav(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz?: number,
  numChords = 4,
  size = 3,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  const effectiveRootHz = rootHz ?? tuning.referenceHz;
  if (rootHz !== undefined && (!Number.isFinite(rootHz) || rootHz <= 0)) {
    throw new RangeError(`bestProgressionWav: rootHz must be finite and > 0, got ${rootHz}`);
  }
  const chords = bestProgressionForScale(scale, tuning, spectrum, numChords, size, effectiveRootHz);
  return chordProgressionToWav(chords, effectiveRootHz, spectrum, opts);
}

/**
 * Find the single best diatonic chord of a scale and synthesize it to WAV in one call.
 *
 * Socratic Q125: `rankScaleChords(scale, tuning, {limit:1})[0]` finds the most
 * consonant diatonic chord; `rankedChordToChord` lifts it to a portable `Chord`;
 * `pluckRankedChordWav` synthesizes it to WAV. Going from "I have a scale and want
 * to hear its best chord" requires three explicit steps. If scale-based chord
 * discovery is first-class, getting that chord as audio should be one call.
 *
 * @param scale    - The parent scale.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Absolute frequency of the chord root (Hz).
 * @param spectrum - Optional instrument spectrum for chord ranking. When omitted,
 *                   ranking uses the default Sethares scorer with a harmonic spectrum.
 * @param opts     - Optional Karplus-Strong synthesis options.
 * @returns WAV bytes of the best diatonic chord for this scale.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if no chords of the requested size can be drawn from the scale.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const wav = bestScaleChordWav(major, t12, 261.63);
 * await fs.writeFile('best-chord.wav', wav);
 */
export function bestScaleChordWav(
  scale: Scale,
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
  opts: KsOptions = DEFAULT_KS,
): Uint8Array {
  const ranked = rankScaleChords(scale, tuning, spectrum !== undefined ? { spectrum } : undefined);
  const best = ranked[0];
  if (best === undefined) {
    throw new RangeError(
      `bestScaleChordWav: no chords found for scale '${scale.id}' — scale may be too small`,
    );
  }
  return pluckRankedChordWav(best, rootHz, opts);
}

/**
 * Synthesize every chord in a diatonic chord map and encode it as a single WAV in one call.
 *
 * Socratic Q130: `chordMapToSmf` exports a `ScaleChordMapEntry[]` as MIDI — but there
 * is no WAV equivalent. Hearing every diatonic chord of a scale in sequence still
 * requires extracting `.chord` fields, calling `chordProgressionToWav`, and wiring
 * a spectrum. If a chord map is first-class (with `scaleToChordMap`, `rankChordMapByHarmonicity`,
 * etc.), synthesizing it to audio should also be one call — paralleling `chordMapToSmf`.
 *
 * Delegates to `chordProgressionToWav(chordMap.map(e => e.chord), rootHz, spectrum, opts)`.
 * Uses `harmonicSpectrum()` as the default when no spectrum is provided.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Optional instrument spectrum for synthesis. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns WAV bytes of every chord in the map, concatenated sequentially.
 *
 * @throws {RangeError} if `chordMap` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const wav = chordMapToWav(chordMap, t12.referenceHz);
 * await fs.writeFile('diatonic-chords.wav', wav);
 */
export function chordMapToWav(
  chordMap: readonly ScaleChordMapEntry[],
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  return chordProgressionToWav(
    chordMap.map((e) => e.chord),
    rootHz,
    spectrum ?? harmonicSpectrum(),
    opts,
  );
}

/**
 * Synthesize the most harmonically optimal mode of a tuning system as a WAV scale run.
 *
 * Socratic Q134: `bestModeForTuning(tuning)` returns the best modal Scale in one call,
 * and `pluckScaleWav(mode, tuning, opts)` encodes it to WAV bytes — but there is no
 * single-call path from a TuningSystem directly to WAV audio of its best mode.
 * If a tuning's best mode is a first-class concept, hearing it should require one call.
 *
 * Algorithm:
 * 1. `bestModeForTuning(tuning, spectrum)` → get the most harmonically optimal Scale.
 * 2. `pluckScaleWav(bestMode, tuning, opts)` → WAV bytes via Karplus-Strong synthesis.
 *
 * Note: `rootHz` is accepted for API forward-compatibility but is not currently used;
 * the tuning's own `referenceHz` anchors frequencies.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz (accepted for API consistency; currently unused).
 * @param spectrum - Optional instrument spectrum. When provided, uses timbre-aware mode
 *                   ranking via `rankAllModesForTimbre`. When omitted, uses harmonicity only.
 * @param opts     - Optional Karplus-Strong + per-note duration options.
 * @returns WAV bytes of the best mode played as a melodic ascending sequence.
 *
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const wav = bestModeWav(t12, 440);
 * await fs.writeFile('best-mode.wav', wav);
 *
 * @example
 * // With timbre-aware mode selection:
 * const wav = bestModeWav(t12, 440, harmonicSpectrum(), { ...DEFAULT_KS, noteSeconds: 0.3 });
 */
export function bestModeWav(
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
  opts: PluckScaleWavOptions = { ...DEFAULT_KS, noteSeconds: 0.5 },
): Uint8Array {
  void rootHz; // accepted for API forward-compat; tuning.referenceHz anchors frequencies
  const bestMode = bestModeForTuning(tuning, spectrum);
  return pluckScaleWav(bestMode, tuning, opts);
}

/**
 * Find the best chord for a MIDI note in a tuning and synthesize it to WAV in one call.
 *
 * Socratic Q138: `bestChordForMidiNote(midiNote, tuning)` returns the most consonant
 * diatonic chord for a MIDI note root — but realizing its frequencies and synthesizing
 * to WAV still requires: extract chord, `realizeChordFreqs`, `strikeChord`, `encodeWav`.
 * If finding the best chord for a MIDI note is first-class, hearing it should be one call.
 *
 * Algorithm:
 * 1. `bestChordForMidiNote(midiNote, tuning, spectrum)` → `{ chord, rootHz }`.
 * 2. `realizeChordFreqs(chord.chord, rootHz)` → Hz array.
 * 3. `strikeChord(freqs, spectrum, opts)` → Float32Array.
 * 4. `encodeWav(samples)` → Uint8Array.
 *
 * @param midiNote - MIDI note number (0..127) used as the chord root.
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional modal synthesis options.
 * @returns WAV bytes of the best chord for this MIDI note.
 *
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const wav = bestChordWav(60, t12); // best chord rooted at C4
 * await fs.writeFile('best-chord-c4.wav', wav);
 */
export function bestChordWav(
  midiNote: number,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  opts: ModalOptions = DEFAULT_MODAL,
): Uint8Array {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const { chord, rootHz } = bestChordForMidiNote(midiNote, tuning, effectiveSpectrum);
  const freqs = realizeChordFreqs(chord.chord, rootHz);
  const samples = strikeChord(freqs, effectiveSpectrum, opts);
  return encodeWav(samples, opts.sampleRate);
}

/**
 * Synthesize the top-N most harmonic chords from a chord map and encode as a single WAV.
 *
 * Socratic Q142: `rankChordMapByHarmonicity(chordMap)` ranks all diatonic chords by
 * Stolzenburg harmonicity, and `chordMapToWav` synthesizes a full chord map to WAV.
 * But hearing only the top-N most harmonic chords — the typical use case — still
 * requires slicing the ranked map and calling `chordMapToWav` manually. If ranking and
 * synthesis are first-class, "top-N most harmonic chords as audio" should be one call.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param n        - Number of top-ranked chords to include (must be ≥ 1).
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Optional instrument spectrum for synthesis. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns WAV bytes of the top-N most harmonic chords, concatenated sequentially.
 *
 * @throws {RangeError} if `n` < 1.
 * @throws {RangeError} if `chordMap` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const wav = topNChordMapWav(chordMap, 3, 261.63);
 * await fs.writeFile('top3-chords.wav', wav);
 */
export function topNChordMapWav(
  chordMap: readonly ScaleChordMapEntry[],
  n: number,
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`topNChordMapWav: n must be an integer >= 1, got ${n}`);
  }
  if (chordMap.length === 0) {
    throw new RangeError('topNChordMapWav: chordMap must be non-empty');
  }
  const ranked = rankChordMapByHarmonicity(chordMap, rootHz);
  const topN = ranked.slice(0, n);
  return chordMapToWav(topN, rootHz, spectrum, opts);
}

/**
 * Full pipeline: tuning → best mode → chord progression from pattern → WAV bytes in one call.
 *
 * Socratic Q144: "If we can rank modes by harmonicity, the best mode's chord progression
 * should be exportable as WAV in one call — can it?" Today it requires: `bestModeForTuning`
 * → `progressionFromPattern` → `chordProgressionToWav` — three explicit steps. This bridges
 * the gap.
 *
 * Algorithm:
 * 1. `bestModeForTuning(tuning, spectrum)` → best modal `Scale`.
 * 2. `progressionFromPattern(mode, tuning, pattern)` → `Chord[]`.
 * 3. `chordProgressionToWav(chords, rootHz, spectrum ?? harmonicSpectrum(), opts)` → WAV.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param pattern  - Array of 0-based root degree indices within the best mode.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns WAV bytes of the best mode's chord progression.
 *
 * @throws {RangeError} if the tuning has no degrees.
 * @throws {RangeError} if `pattern` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const wav = bestModeProgressionWav(t12, [0, 2, 4, 0], 261.63, harmonicSpectrum());
 * await fs.writeFile('best-mode-prog.wav', wav);
 */
export function bestModeProgressionWav(
  tuning: TuningSystem,
  pattern: readonly number[],
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const bestMode = bestModeForTuning(tuning, spectrum);
  const chords = progressionFromPattern(bestMode, tuning, pattern);
  return chordProgressionToWav(chords, rootHz, effectiveSpectrum, opts);
}

/**
 * Rank a chord map by dissonance, take the worst N entries, and synthesize to WAV in one call.
 *
 * Socratic Q145: "If we can analyze a chord map and export it as WAV, we should be able to
 * rank and export the worst-N (most dissonant) chords as a WAV for comparison — can it?"
 * Today it requires: `rankChordMapByDissonance` → reverse → take last N → `chordMapToWav` —
 * four steps. This bridges the gap.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param n        - Number of most dissonant chords to include (must be ≥ 1).
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns WAV bytes of the worst-N most dissonant chords, concatenated sequentially.
 *
 * @throws {RangeError} if `n` < 1.
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const wav = worstNChordMapWav(chordMap, 3, 261.63);
 * await fs.writeFile('worst3-chords.wav', wav);
 */
export function worstNChordMapWav(
  chordMap: readonly ScaleChordMapEntry[],
  n: number,
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`worstNChordMapWav: n must be an integer >= 1, got ${n}`);
  }
  if (chordMap.length === 0) {
    throw new RangeError('worstNChordMapWav: chordMap must be non-empty');
  }
  const ranked = rankChordMapByDissonance(chordMap, spectrum, rootHz);
  const worstN = ranked.slice(-n);
  return chordMapToWav(worstN, rootHz, spectrum, opts);
}

/**
 * Build the optimal chord ordering from a scale and synthesize it to WAV in one call.
 *
 * Socratic Q147: "If we have a chord progression analysis that includes smoothness data,
 * we should be able to export its optimal reordering as WAV in one call — can it?" Today it
 * requires: `buildChordProgression(scale, tuning)` → `optimalChordOrder(chords)` →
 * `chordProgressionToWav` — three explicit steps. This bridges the gap.
 *
 * Algorithm:
 * 1. `buildChordProgression(scale, tuning)` → `Chord[]` of all diatonic chords.
 * 2. `optimalChordOrder(chords)` → voice-leading–optimal ordering.
 * 3. `chordProgressionToWav(ordered, rootHz, spectrum ?? harmonicSpectrum(), opts)` → WAV.
 *
 * @param scale    - The parent scale.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns WAV bytes of the scale's diatonic chords in optimal voice-leading order.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const wav = optimalProgressionWavFromScale(major, t12, 261.63, harmonicSpectrum());
 * await fs.writeFile('optimal-scale-prog.wav', wav);
 */
export function optimalProgressionWavFromScale(
  scale: Scale,
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const chordMap = scaleToChordMap(scale, tuning);
  const chords = chordMap.map((e) => e.chord);
  const { chords: ordered } = optimalChordOrder(chords, rootHz);
  return chordProgressionToWav(ordered, rootHz, effectiveSpectrum, opts);
}

/**
 * Synthesize only the top-K modes of a tuning by combined timbre score as a WAV medley.
 *
 * Socratic Q155: "If we can rank all modes of a tuning for timbre, we should be able to
 * export only the top-K modes as a WAV medley — can it?" Today: `rankAllModesForTimbre`
 * → take first K → map each through `synthScaleFromScale` → concatenate → `encodeWav` —
 * four explicit steps. If ranking and synthesis are first-class, "top-K modes as a single
 * WAV" should be one call.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale spanning all degrees.
 * 2. `rankAllModesForTimbre(fullScale, tuning, spectrum ?? harmonicSpectrum())` → ranked modes.
 * 3. Take first K entries (best combined score).
 * 4. For each mode: `synthScaleFromScale(mode.scale, tuning, pluckOpts ?? DEFAULT_KS)` → samples.
 * 5. Concatenate all sample arrays → `encodeWav`.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param k        - Number of top modes to include (must be ≥ 1).
 * @param spectrum - Optional instrument spectrum for mode ranking. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional Karplus-Strong + per-note duration options.
 * @returns WAV bytes of the top-K modes concatenated as a medley.
 *
 * @throws {RangeError} if `k` < 1.
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const wav = topKModesWav(t12, 3, harmonicSpectrum());
 * await fs.writeFile('top3-modes.wav', wav);
 */
export function topKModesWav(
  tuning: TuningSystem,
  k: number,
  spectrum?: Spectrum,
  opts: PluckScaleWavOptions = { ...DEFAULT_KS, noteSeconds: 0.5 },
): Uint8Array {
  if (!Number.isInteger(k) || k < 1) {
    throw new RangeError(`topKModesWav: k must be an integer >= 1, got ${k}`);
  }
  if (tuning.degrees.length === 0) {
    throw new RangeError('topKModesWav: tuning has no degrees');
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const fullScale = tuningToScale(tuning);
  const ranked = rankAllModesForTimbre(fullScale, tuning, effectiveSpectrum);
  const topK = ranked.slice(0, k);

  const allSamples = topK.map((entry) => synthScaleFromScale(entry.scale, tuning, opts));

  const totalLength = allSamples.reduce((sum, s) => sum + s.length, 0);
  const combined = new Float32Array(totalLength);
  let offset = 0;
  for (const samples of allSamples) {
    combined.set(samples, offset);
    offset += samples.length;
  }

  return encodeWav(combined, opts.sampleRate);
}

/**
 * Synthesize a complete timbre-analysis WAV of all modes sorted by combined score.
 *
 * Socratic Q167: "If we can synthesize any WAV from a tuning, the complete timbre-analysis
 * WAV (all modes sorted by combinedScore, played in sequence) should be one call — can it?"
 * Today: `tuningToScale` → `rankAllModesForTimbre` → take first k → map through
 * `synthScaleFromScale` → concatenate → `encodeWav` — five explicit steps. This is similar
 * to `topKModesWav` but (a) defaults k to ALL modes, and (b) uses combined timbre score
 * (roughness + harmonicity) not just harmonicity for ordering.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale spanning all degrees.
 * 2. `rankAllModesForTimbre(fullScale, tuning, spectrum ?? harmonicSpectrum())` → ranked modes.
 * 3. Take first `k` entries (default: all modes).
 * 4. For each mode: `synthScaleFromScale(mode.scale, tuning, opts)` → samples.
 * 5. Concatenate all sample arrays → `encodeWav`.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for mode ranking. Defaults to `harmonicSpectrum()`.
 * @param k        - Number of top modes to include (default: all modes). Must be ≥ 1 if provided.
 * @param opts     - Optional Karplus-Strong + per-note duration options.
 * @returns WAV bytes of modes sorted by combined timbre score, concatenated as a medley.
 *
 * @throws {RangeError} if `tuning` has no degrees.
 * @throws {RangeError} if `k` is provided and < 1.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const wav = tuningTimbreAnalysisWav(t12, harmonicSpectrum());
 * await fs.writeFile('timbre-analysis.wav', wav);
 *
 * @example
 * // Limit to top 3 modes:
 * const wav = tuningTimbreAnalysisWav(t12, harmonicSpectrum(), 3);
 */
export function tuningTimbreAnalysisWav(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  k?: number,
  opts: PluckScaleWavOptions = { ...DEFAULT_KS, noteSeconds: 0.5 },
): Uint8Array {
  if (tuning.degrees.length === 0) {
    throw new RangeError('tuningTimbreAnalysisWav: tuning has no degrees');
  }
  if (k !== undefined && (!Number.isInteger(k) || k < 1)) {
    throw new RangeError(`tuningTimbreAnalysisWav: k must be an integer >= 1, got ${k}`);
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const fullScale = tuningToScale(tuning);
  const ranked = rankAllModesForTimbre(fullScale, tuning, effectiveSpectrum);
  const selected = k !== undefined ? ranked.slice(0, k) : ranked;

  const allSamples = selected.map((entry) => synthScaleFromScale(entry.scale, tuning, opts));

  const totalLength = allSamples.reduce((sum, s) => sum + s.length, 0);
  const combined = new Float32Array(totalLength);
  let writeOffset = 0;
  for (const samples of allSamples) {
    combined.set(samples, writeOffset);
    writeOffset += samples.length;
  }

  return encodeWav(combined, opts.sampleRate);
}

/** Encode stereo Float32 samples ([-1,1]) to a 16-bit PCM stereo WAV file (2 channels, interleaved L/R). */
export function encodeWavStereo(
  samplesL: Float32Array,
  samplesR: Float32Array,
  sampleRate = 44100,
): Uint8Array {
  const n = Math.min(samplesL.length, samplesR.length);
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataBytes = n * blockAlign;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeStr(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, samplesL[i] as number));
    const r = Math.max(-1, Math.min(1, samplesR[i] as number));
    view.setInt16(44 + i * blockAlign, Math.round(l * 32767), true);
    view.setInt16(44 + i * blockAlign + bytesPerSample, Math.round(r * 32767), true);
  }
  return new Uint8Array(buffer);
}

/**
 * Synthesize a chord to both a WAV audio file and an SMF MIDI file in one call.
 *
 * Socratic Q169: "If we can export a chord to SMF and to WAV separately, exporting a chord
 * as a complete audio+MIDI bundle should be one call — can it?" Today: `strikeChordToWav`
 * for audio, `chordToSmf` for MIDI — two calls to two different modules. If a chord is
 * truly first-class, bundling both outputs should be one call.
 *
 * @param chord    - The chord to synthesize.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum for synthesis. Defaults to `harmonicSpectrum()`.
 * @param wavOpts  - Optional modal synthesis options forwarded to `strikeChordToWav`.
 * @param smfOpts  - Optional SMF encoding options forwarded to `chordToSmf`.
 * @returns `{ wav: Uint8Array, smf: Uint8Array }`.
 *
 * @throws {RangeError} if `rootHz` <= 0.
 *
 * @example
 * const chord = chordFromSemitones('major', [0, 4, 7]);
 * const { wav, smf } = chordAudioBundle(chord, 261.63, harmonicSpectrum());
 * await fs.writeFile('major.wav', wav);
 * await fs.writeFile('major.mid', smf);
 */
export function chordAudioBundle(
  chord: Chord,
  rootHz: number,
  spectrum?: Spectrum,
  wavOpts?: ModalOptions,
  smfOpts?: ChordToSmfOptions,
): { wav: Uint8Array; smf: Uint8Array } {
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(`chordAudioBundle: rootHz must be finite and > 0, got ${rootHz}`);
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const freqs = realizeChordFreqs(chord, rootHz);
  const wav = strikeChordToWav(freqs, effectiveSpectrum, wavOpts);
  const smf = chordToSmf(chord, rootHz, smfOpts);
  return { wav, smf };
}

/**
 * Synthesize every chord in a diatonic chord map as a STEREO WAV, alternating pan per chord.
 *
 * Socratic Q171: "If we can synthesize individual chords, synthesizing a chord map in STEREO
 * (alternating left/right pan per chord) should be one call — can it?" Today: iterate the
 * chord map → strike each chord → build two float arrays → interleave → `encodeWavStereo` —
 * several manual steps. If a chord map is first-class, stereo panned rendering should be
 * one call.
 *
 * Odd-indexed chords (1, 3, 5, …) pan left (only left channel); even-indexed chords
 * (0, 2, 4, …) pan right (only right channel). pan=0 means full left, pan=1 means full right.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns Stereo 16-bit PCM WAV bytes with chords alternating L/R.
 *
 * @throws {RangeError} if `chordMap` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const wav = chordMapToStereoWav(chordMap, t12.referenceHz);
 * await fs.writeFile('diatonic-stereo.wav', wav);
 */
export function chordMapToStereoWav(
  chordMap: readonly ScaleChordMapEntry[],
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  if (chordMap.length === 0)
    throw new RangeError('chordMapToStereoWav: chordMap must be non-empty');
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(`chordMapToStereoWav: rootHz must be finite and > 0, got ${rootHz}`);
  }
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const { chordSeconds, sampleRate, ...modalOpts } = opts;
  const fullModalOpts: ModalOptions = { sampleRate, ...modalOpts };
  const samplesPerChord = Math.floor(sampleRate * Math.min(chordSeconds, opts.seconds));
  const total = samplesPerChord * chordMap.length;
  const outL = new Float32Array(total);
  const outR = new Float32Array(total);

  for (let i = 0; i < chordMap.length; i++) {
    const entry = chordMap[i] as ScaleChordMapEntry;
    const freqs = realizeChordFreqs(entry.chord, rootHz);
    const wave = strikeChord(freqs, effectiveSpectrum, fullModalOpts);
    const offset = i * samplesPerChord;
    // Even index → pan right (only right channel), odd index → pan left (only left channel)
    const isLeft = i % 2 !== 0;
    for (let j = 0; j < samplesPerChord && j < wave.length; j++) {
      const sample = wave[j] as number;
      if (isLeft) {
        outL[offset + j] = sample;
      } else {
        outR[offset + j] = sample;
      }
    }
  }

  return encodeWavStereo(outL, outR, sampleRate);
}

/**
 * Synthesize the least harmonic mode of a tuning as a WAV scale run in one call.
 *
 * Socratic Q177: "If we can synthesize the best mode of a tuning, synthesizing the WORST
 * (least harmonic) mode should also be one call — can it?" `bestModeWav` uses
 * `rankModeSeriesByHarmonicity` → first entry. The worst mode is simply the last entry.
 * If best-mode audio is one call, worst-mode audio should be one call too.
 *
 * Algorithm:
 * 1. `tuningToScale(tuning)` → full scale.
 * 2. `rankModeSeriesByHarmonicity(fullScale, tuning)` → sorted ascending (best first).
 * 3. Take the LAST entry (highest harmonicity = least harmonic).
 * 4. `pluckScaleWav(worst, tuning, opts)` → WAV bytes.
 *
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Unused (accepted for API symmetry with `bestModeWav`).
 * @param opts     - Optional Karplus-Strong + per-note duration options.
 * @returns WAV bytes of the worst mode played as a melodic ascending sequence.
 *
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const wav = worstModeWav(t12);
 * await fs.writeFile('worst-mode.wav', wav);
 */
export function worstModeWav(
  tuning: TuningSystem,
  spectrum?: Spectrum,
  opts: PluckScaleWavOptions = { ...DEFAULT_KS, noteSeconds: 0.5 },
): Uint8Array {
  void spectrum; // accepted for API symmetry with bestModeWav
  if (tuning.degrees.length === 0) {
    throw new RangeError('worstModeWav: tuning has no degrees');
  }
  const fullScale = tuningToScale(tuning);
  const ranked = rankModeSeriesByHarmonicity(fullScale, tuning);
  const worst = (ranked[ranked.length - 1] as (typeof ranked)[0]).scale;
  return pluckScaleWav(worst, tuning, opts);
}

/**
 * Synthesize ALL chords in a chord map as SEPARATE WAV buffers in one call.
 *
 * Socratic Q180: "If we can export any chord as WAV, exporting ALL chords in a chord map
 * as SEPARATE WAV buffers (not concatenated) should be one call — can it?" Today: iterate
 * the chord map → `strikeChordToWav` per entry → collect into an array — three manual
 * steps. If a chord map is first-class, producing individual WAV files for every entry
 * should be one call.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns `Uint8Array[]` — one WAV per chord entry, in chord map order.
 *
 * @throws {RangeError} if `chordMap` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const wavs = chordMapToWavArray(chordMap, t12.referenceHz);
 * for (const [i, wav] of wavs.entries()) await fs.writeFile(`chord-${i}.wav`, wav);
 */
export function chordMapToWavArray(
  chordMap: readonly ScaleChordMapEntry[],
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array[] {
  if (chordMap.length === 0) throw new RangeError('chordMapToWavArray: chordMap must be non-empty');
  if (!Number.isFinite(rootHz) || rootHz <= 0)
    throw new RangeError(`chordMapToWavArray: rootHz must be finite and > 0, got ${rootHz}`);
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const { chordSeconds, sampleRate, ...modalOpts } = opts;
  const fullModalOpts: ModalOptions = { sampleRate, ...modalOpts };
  const samplesPerChord = Math.floor(sampleRate * Math.min(chordSeconds, opts.seconds));
  return chordMap.map((entry) => {
    const freqs = realizeChordFreqs(entry.chord, rootHz);
    const wave = strikeChord(freqs, effectiveSpectrum, fullModalOpts);
    const slice = new Float32Array(samplesPerChord);
    for (let j = 0; j < samplesPerChord && j < wave.length; j++) {
      slice[j] = wave[j] as number;
    }
    return encodeWav(slice, sampleRate);
  });
}

/**
 * Synthesize a chord map analysis as a stereo WAV where pan encodes harmonicity score.
 *
 * Socratic Q182: "If we can export a chord map as a stereo WAV, we should also be able
 * to export a chord MAP ANALYSIS (with scores) as stereo WAV where panning encodes the
 * harmonicity score — can it?" Today: `chordMapAnalysis` → sort → realize freqs → strike
 * → scale L/R by pan — many manual steps. If a chord map analysis is first-class, encoding
 * it spatially should be one call.
 *
 * Algorithm: `chordMapAnalysis(scale, tuning, spectrum)` sorted by harmonicity ascending
 * (most harmonic first). For each entry: `pan = entry.harmonicity / maxHarmonicity`
 * (0 = full left = most harmonic, 1 = full right = least harmonic). Synthesize mono,
 * then scale: L = cos(pan * π/2), R = sin(pan * π/2). Output via `encodeWavStereo`.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns Stereo 16-bit PCM WAV bytes with harmonicity-encoded panning.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 * @throws {RangeError} if no chord map entries are produced.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const wav = chordMapAnalysisToStereoWav(major, t12);
 * await fs.writeFile('analysis-stereo.wav', wav);
 */
export function chordMapAnalysisToStereoWav(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const entries: ChordMapAnalysisEntry[] = chordMapAnalysis(scale, tuning, effectiveSpectrum).sort(
    (a, b) => a.harmonicity - b.harmonicity,
  );
  if (entries.length === 0)
    throw new RangeError('chordMapAnalysisToStereoWav: no chord map entries produced');
  const maxHarmonicity = (entries[entries.length - 1] as ChordMapAnalysisEntry).harmonicity;
  const { chordSeconds, sampleRate, ...modalOpts } = opts;
  const fullModalOpts: ModalOptions = { sampleRate, ...modalOpts };
  const samplesPerChord = Math.floor(sampleRate * Math.min(chordSeconds, opts.seconds));
  const total = samplesPerChord * entries.length;
  const outL = new Float32Array(total);
  const outR = new Float32Array(total);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] as ChordMapAnalysisEntry;
    const pan = maxHarmonicity > 0 ? entry.harmonicity / maxHarmonicity : 0;
    const gainL = Math.cos((pan * Math.PI) / 2);
    const gainR = Math.sin((pan * Math.PI) / 2);
    const freqs = realizeChordFreqs(entry.chord, tuning.referenceHz);
    const wave = strikeChord(freqs, effectiveSpectrum, fullModalOpts);
    const offset = i * samplesPerChord;
    for (let j = 0; j < samplesPerChord && j < wave.length; j++) {
      const sample = wave[j] as number;
      outL[offset + j] = sample * gainL;
      outR[offset + j] = sample * gainR;
    }
  }
  return encodeWavStereo(outL, outR, sampleRate);
}

/**
 * Synthesize a chord map in a shuffled (randomised) order as a single WAV in one call.
 *
 * Socratic Q190: "If we can synthesize a chord map as a WAV array, shuffling that array and
 * playing them in random order should be one call — can it?" Today: `chordMapToWavArray` →
 * shuffle entries manually → concatenate — three explicit steps. If shuffled playback is
 * first-class, it should be one call.
 *
 * Algorithm:
 * 1. Validate `chordMap` non-empty and `rootHz` > 0.
 * 2. Shallow-copy `chordMap` and shuffle using a seeded LCG PRNG
 *    (state = (state * 1664525 + 1013904223) % 2^32; seed defaults to Date.now() % 2147483647).
 * 3. `chordMapToWav(shuffled, rootHz, spectrum, opts)` → single concatenated WAV.
 *
 * @param chordMap - Diatonic chord map entries to shuffle and synthesize.
 * @param rootHz   - Root frequency in Hz. Must be > 0.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @param seed     - Optional LCG seed. Defaults to `Date.now() % 2147483647`.
 * @returns WAV bytes of the shuffled chord sequence concatenated as a single track.
 *
 * @throws {RangeError} if `chordMap` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const wav = chordMapToShuffledWav(chordMap, 440, undefined, undefined, 42);
 */
export function chordMapToShuffledWav(
  chordMap: readonly ScaleChordMapEntry[],
  rootHz: number,
  spectrum?: Spectrum,
  opts?: ChordProgressionToWavOptions,
  seed?: number,
): Uint8Array {
  if (chordMap.length === 0)
    throw new RangeError('chordMapToShuffledWav: chordMap must be non-empty');
  if (!Number.isFinite(rootHz) || rootHz <= 0)
    throw new RangeError('chordMapToShuffledWav: rootHz must be finite and > 0');
  let state = (seed !== undefined ? seed : Date.now() % 2147483647) | 0;
  // LCG: Numerical Recipes parameters
  const shuffled = [...chordMap];
  for (let i = shuffled.length - 1; i > 0; i--) {
    state = ((state * 1664525 + 1013904223) | 0) >>> 0;
    const j = state % (i + 1);
    const tmp = shuffled[i] as ScaleChordMapEntry;
    shuffled[i] = shuffled[j] as ScaleChordMapEntry;
    shuffled[j] = tmp;
  }
  return chordMapToWav(shuffled, rootHz, spectrum, opts ?? DEFAULT_CHORD_PROGRESSION_WAV);
}

/**
 * Full pipeline: tuning → most stable mode → chord progression → WAV bytes in one call.
 *
 * Socratic Q198: "If we can rank modes by stability, we should be able to export the MOST
 * STABLE mode's chord progression as WAV in one call — can it?" Today:
 * `rankModesByStability` → take first → `bestProgressionForScale` →
 * `chordProgressionToWav` — four explicit steps. If mode stability is first-class,
 * the most stable mode's audio should be one call.
 *
 * Algorithm:
 * 1. `rankModesByStability(tuning, rootHz, spectrum)` → sorted modes (ascending score).
 * 2. Take the first entry's `scale` — the most stable mode.
 * 3. `bestProgressionForScale(mode, tuning, effectiveSpectrum, 4, 3, rootHz)` → `Chord[]`.
 * 4. `chordProgressionToWav(chords, rootHz, effectiveSpectrum, opts)` → WAV bytes.
 *
 * @param tuning   - The parent `TuningSystem`. Must be non-empty.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns WAV bytes of the most stable mode's chord progression.
 *
 * @throws {RangeError} if tuning has no degrees.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const t5 = edo(5);
 * const wav = mostStableModeProgressionWav(t5, 261.63);
 * await fs.writeFile('most-stable.wav', wav);
 */
export function mostStableModeProgressionWav(
  tuning: TuningSystem,
  rootHz: number,
  spectrum?: Spectrum,
  opts: ChordProgressionToWavOptions = DEFAULT_CHORD_PROGRESSION_WAV,
): Uint8Array {
  if (tuning.degrees.length === 0)
    throw new RangeError('mostStableModeProgressionWav: tuning must have at least one degree');
  const effectiveSpectrum = spectrum ?? harmonicSpectrum();
  const ranked = rankModesByStability(tuning, rootHz, spectrum);
  const mostStableMode = (ranked[0] as (typeof ranked)[0]).scale;
  const chords = bestProgressionForScale(mostStableMode, tuning, effectiveSpectrum, 4, 3, rootHz);
  return chordProgressionToWav(chords, rootHz, effectiveSpectrum, opts);
}

/**
 * Get both a WAV rendering and a narrative description of a chord progression in one call.
 *
 * Socratic Q234: "If I can get a progression narrative (text) and also render a progression
 * as WAV, can I get both in one call?" → No → implement.
 *
 * @param chords   - The chord progression to synthesize and narrate.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns `{ wav: Uint8Array, narrative: string }`.
 *
 * @throws {RangeError} if `chords` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const { wav, narrative } = progressionNarrativeWav(chords, 261.63, harmonicSpectrum());
 * await fs.writeFile('prog.wav', wav);
 * console.log(narrative);
 */
export function progressionNarrativeWav(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
  opts?: ChordProgressionToWavOptions,
): { wav: Uint8Array; narrative: string } {
  const narrative = progressionNarrative(chords, rootHz, spectrum);
  const wav = chordProgressionToWav(
    chords,
    rootHz,
    spectrum ?? harmonicSpectrum(),
    opts ?? DEFAULT_CHORD_PROGRESSION_WAV,
  );
  return { wav, narrative };
}

/**
 * Go from a preset ID to a WAV of its best mode in one call.
 *
 * Socratic Q237: "If I know a preset's best mode and can render a mode's scale as WAV,
 * can I go preset→WAV in one call?" → No → implement.
 *
 * @param presetId - ID of a named tuning preset (e.g. `'12-tet'`).
 * @param spectrum - Optional instrument spectrum for mode selection and synthesis.
 * @param opts     - Optional Karplus-Strong + per-note duration options.
 * @param presets  - Optional preset list override (defaults to built-in presets).
 * @returns WAV bytes of the best mode for the preset, played as a melodic scale.
 *
 * @throws {RangeError} if no preset with `presetId` is found.
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const wav = presetBestModeWav('12-tet');
 * await fs.writeFile('12tet-best-mode.wav', wav);
 */
export function presetBestModeWav(
  presetId: string,
  spectrum?: Spectrum,
  opts?: PluckScaleWavOptions,
  presets?: readonly TuningPreset[],
): Uint8Array {
  const tuning = getTuningById(presetId, presets ?? ALL_PRESETS);
  if (tuning === undefined) {
    throw new RangeError('presetBestModeWav: preset not found: ' + presetId);
  }
  return bestModeWav(tuning, tuning.referenceHz, spectrum, opts);
}

/**
 * Export a chord progression as WAV + SMF + MTS + narrative simultaneously in one call.
 *
 * Socratic Q244: "If a chord progression is first-class, WAV + SMF + MTS + narrative
 * should all come from one call — can it?" → No → implement.
 *
 * Algorithm:
 * 1. `progressionNarrativeWav(chords, rootHz ?? tuning.referenceHz, spectrum)` → `{ wav, narrative }`.
 * 2. `progressionToSmf(chords, rootHz ?? tuning.referenceHz)` → SMF bytes.
 * 3. `chordProgressionToMts(chords, rootHz ?? tuning.referenceHz)` → array of MTS SysEx messages;
 *    concatenate into a single `Uint8Array` (one SysEx per chord).
 *
 * @param chords   - The chord progression to export.
 * @param tuning   - The `TuningSystem` context (used for default root Hz).
 * @param rootHz   - Root frequency in Hz. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum for WAV synthesis and narrative analysis.
 * @returns `{ wav, smf, mts, narrative }` — all four formats simultaneously.
 *
 * @throws {RangeError} if `chords` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const chords = progressionFromPattern(major, t12, [0, 3, 4, 0]);
 * const { wav, smf, mts, narrative } = progressionFullBundle(chords, t12);
 */
export function progressionFullBundle(
  chords: readonly Chord[],
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
): { wav: Uint8Array; smf: Uint8Array; mts: Uint8Array; narrative: string } {
  const effectiveRootHz = rootHz ?? tuning.referenceHz;
  const { wav, narrative } = progressionNarrativeWav(chords, effectiveRootHz, spectrum);
  const smf = progressionToSmf(chords, effectiveRootHz);
  // chordProgressionToMts returns one 408-byte Uint8Array per chord; concatenate them
  const mtsMessages = chordProgressionToMts(chords, effectiveRootHz);
  const totalLen = mtsMessages.reduce((sum, m) => sum + m.length, 0);
  const mts = new Uint8Array(totalLen);
  let offset = 0;
  for (const msg of mtsMessages) {
    mts.set(msg, offset);
    offset += msg.length;
  }
  return { wav, smf, mts, narrative };
}

/**
 * Reorder a chord progression to minimise dissonance jumps, then render as WAV in one call.
 *
 * Socratic Q269: "If I can reorder a progression to minimise dissonance jumps and render any
 * progression as WAV, can I get a smoothed progression WAV in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `chordProgressionSmooth(chords, rootHz, spectrum)` → smoothed ordering.
 * 2. `chordProgressionToWav(smoothed, rootHz, spectrum ?? harmonicSpectrum(), opts)` → WAV bytes.
 *
 * @param chords   - The chord progression to smooth and synthesize.
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns WAV bytes of the smoothed (dissonance-minimised) chord progression.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
 * const chordMap = scaleToChordMap(scale, t12);
 * const chords = chordMap.slice(0, 4).map(e => e.chord);
 * const wav = smoothProgressionWav(chords, 261.63);
 * await fs.writeFile('smooth-progression.wav', wav);
 */
export function smoothProgressionWav(
  chords: readonly Chord[],
  rootHz: number,
  spectrum?: Spectrum,
  opts?: ChordProgressionToWavOptions,
): Uint8Array {
  const smoothed = chordProgressionSmooth(chords, rootHz, spectrum);
  if (smoothed.length === 0) {
    return encodeWav(
      new Float32Array(0),
      opts?.sampleRate ?? DEFAULT_CHORD_PROGRESSION_WAV.sampleRate,
    );
  }
  return chordProgressionToWav(
    smoothed,
    rootHz,
    spectrum ?? harmonicSpectrum(),
    opts ?? DEFAULT_CHORD_PROGRESSION_WAV,
  );
}

// ---------------------------------------------------------------------------
// Q271 — modeVolatilityWav
// ---------------------------------------------------------------------------

/**
 * Render the most volatile and least volatile modal rotations as WAV in one call.
 *
 * Socratic Q271: "If I have volatility scores for every mode, can I render the most
 * volatile and least volatile modes as WAV in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `modeVolatilityProfile(scale, tuning, spectrum)` → `{ mode, volatility }[]`.
 * 2. If empty, throw `RangeError`.
 * 3. Find the mode with the highest volatility (most volatile) and the lowest (least volatile).
 * 4. `pluckScaleWav(mostVolatileMode, tuning, opts)` and `pluckScaleWav(leastVolatileMode, tuning, opts)`.
 * 5. Return `{ mostVolatile, leastVolatile }`.
 *
 * @param scale    - The parent scale.
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for volatility scoring.
 * @param opts     - Optional WAV synthesis options.
 * @returns `{ mostVolatile, leastVolatile }` — WAV bytes for each extreme mode.
 *
 * @throws {RangeError} if no modal rotations are produced from the scale.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
 * const { mostVolatile, leastVolatile } = modeVolatilityWav(scale, t12);
 * await fs.writeFile('most-volatile.wav', mostVolatile);
 * await fs.writeFile('least-volatile.wav', leastVolatile);
 */
export function modeVolatilityWav(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  opts?: PluckScaleWavOptions,
): { mostVolatile: Uint8Array; leastVolatile: Uint8Array } {
  const profile = modeVolatilityProfile(scale, tuning, spectrum);
  if (profile.length === 0) {
    throw new RangeError('modeVolatilityWav: no modes');
  }
  let mostVolatileEntry = profile[0]!;
  let leastVolatileEntry = profile[0]!;
  for (const entry of profile) {
    if (entry.volatility > mostVolatileEntry.volatility) mostVolatileEntry = entry;
    if (entry.volatility < leastVolatileEntry.volatility) leastVolatileEntry = entry;
  }
  return {
    mostVolatile: pluckScaleWav(mostVolatileEntry.mode, tuning, opts),
    leastVolatile: pluckScaleWav(leastVolatileEntry.mode, tuning, opts),
  };
}

// ---------------------------------------------------------------------------
// Q276 — smoothProgressionBundle
// ---------------------------------------------------------------------------

/**
 * Get a smoothed progression WAV, SMF, and narrative description in one call.
 *
 * Socratic Q276: "If I can get a smoothed progression WAV (`smoothProgressionWav`) and a
 * smoothed progression SMF (`smoothProgressionSmf`), can I get both in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `chordProgressionSmooth(chords, rootHz ?? tuning.referenceHz, spectrum)` → smoothed ordering.
 * 2. `chordProgressionToWav(smoothed, effectiveRootHz, spectrum ?? harmonicSpectrum(), wavOpts)` → WAV.
 * 3. `smoothProgressionSmf(smoothed, tuning, rootHz, spectrum, smfOpts)` → SMF.
 * 4. `progressionNarrative(smoothed, effectiveRootHz, spectrum)` → narrative.
 * 5. Return `{ wav, smf, narrative }`.
 *
 * Note: `chordProgressionSmooth` is called once; the result is passed to both encoders to
 * avoid double-smoothing.
 *
 * @param chords   - The chord progression to smooth and export.
 * @param tuning   - The `TuningSystem` context (used for default root Hz and SMF encoding).
 * @param rootHz   - Root frequency in Hz. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param wavOpts  - Optional chord progression WAV options.
 * @param smfOpts  - Optional SMF encoding options.
 * @returns `{ wav: Uint8Array, smf: Uint8Array, narrative: string }`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { wav, smf, narrative } = smoothProgressionBundle(chords, t12);
 * await fs.writeFile('smooth.wav', wav);
 * await fs.writeFile('smooth.mid', smf);
 * console.log(narrative);
 */
export function smoothProgressionBundle(
  chords: readonly Chord[],
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
  wavOpts?: ChordProgressionToWavOptions,
  smfOpts?: SmfOptions,
): { wav: Uint8Array; smf: Uint8Array; narrative: string } {
  const effectiveRootHz = rootHz ?? tuning.referenceHz;
  const smoothed = chordProgressionSmooth(chords, effectiveRootHz, spectrum);
  const wav =
    smoothed.length === 0
      ? encodeWav(
          new Float32Array(0),
          wavOpts?.sampleRate ?? DEFAULT_CHORD_PROGRESSION_WAV.sampleRate,
        )
      : chordProgressionToWav(
          smoothed,
          effectiveRootHz,
          spectrum ?? harmonicSpectrum(),
          wavOpts ?? DEFAULT_CHORD_PROGRESSION_WAV,
        );
  const smf = smoothProgressionSmf(smoothed, tuning, rootHz, spectrum, smfOpts);
  const narrative = progressionNarrative(smoothed, effectiveRootHz, spectrum);
  return { wav, smf, narrative };
}

// ---------------------------------------------------------------------------
// Q277 — tuningFamilyWav
// ---------------------------------------------------------------------------

/**
 * Render all tunings in a family as individual WAV buffers in one call.
 *
 * Socratic Q277: "If I have a tuning family report and can render any tuning as WAV, can I
 * render all tunings in the family as WAV in one call?" → No → implement.
 *
 * Algorithm:
 * 1. For each tuning in `tunings`, call `bestModeWav(t, t.referenceHz, spectrum, opts)`.
 * 2. Return the resulting array of WAV buffers.
 *
 * @param tunings  - Array of `TuningSystem`s to render (e.g. from a family report).
 * @param spectrum - Optional instrument spectrum for mode selection and synthesis.
 * @param opts     - Optional Karplus-Strong + per-note duration options.
 * @returns `Uint8Array[]` — one WAV buffer per tuning in input order.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const t19 = edo(19);
 * const wavs = tuningFamilyWav([t12, t19]);
 * wavs.forEach((w, i) => fs.writeFileSync(`tuning-${i}.wav`, w));
 */
export function tuningFamilyWav(
  tunings: readonly TuningSystem[],
  spectrum?: Spectrum,
  opts?: PluckScaleWavOptions,
): Uint8Array[] {
  return tunings.map((t) => bestModeWav(t, t.referenceHz, spectrum, opts));
}

// ---------------------------------------------------------------------------
// Q284 — progressionBundleFromScale
// ---------------------------------------------------------------------------

/**
 * Go from a Scale to a full progression bundle (WAV + SMF + narrative) in one call.
 *
 * Socratic Q284: "If I have a Scale and can generate a chord map progression and bundle it as
 * WAV+SMF+narrative, can I go Scale → full progression bundle in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → all diatonic chords.
 * 2. `chordMapProgressionBridge(chordMap, rootHz ?? tuning.referenceHz, spectrum)` → ordered `Chord[]`.
 * 3. `smoothProgressionBundle(chords, tuning, rootHz, spectrum, wavOpts, smfOpts)` → `{ wav, smf, narrative }`.
 *
 * @param scale    - The parent scale.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum.
 * @param wavOpts  - Optional chord progression WAV options.
 * @param smfOpts  - Optional SMF encoding options.
 * @returns `{ wav: Uint8Array, smf: Uint8Array, narrative: string }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` or the scale has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
 * const bundle = progressionBundleFromScale(scale, t12);
 * await fs.writeFile('scale-prog.wav', bundle.wav);
 * console.log(bundle.narrative);
 */
export function progressionBundleFromScale(
  scale: Scale,
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
  wavOpts?: ChordProgressionToWavOptions,
  smfOpts?: SmfOptions,
): { wav: Uint8Array; smf: Uint8Array; narrative: string } {
  const chordMap = scaleToChordMap(scale, tuning);
  const effectiveRootHz = rootHz ?? tuning.referenceHz;
  const chords = chordMapProgressionBridge(chordMap, effectiveRootHz, spectrum);
  return smoothProgressionBundle(chords, tuning, rootHz, spectrum, wavOpts, smfOpts);
}

// ---------------------------------------------------------------------------
// Q292 — tuningReportCardWav
// ---------------------------------------------------------------------------

/**
 * Get a tuning report card text and render its best mode as WAV in one call.
 *
 * Socratic Q292: "If I can get a tuning report card text and render its best mode as WAV,
 * can I get both in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `tuningReportCard(tuning, rootHz, spectrum)` → report card string.
 * 2. `bestModeWav(tuning, rootHz ?? tuning.referenceHz, spectrum, opts)` → WAV bytes.
 * 3. Return `{ wav, reportCard }`.
 *
 * @param tuning   - The tuning system to report on and render.
 * @param rootHz   - Root frequency in Hz. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum for mode selection and synthesis.
 * @param opts     - Optional Karplus-Strong + per-note duration options.
 * @returns `{ wav: Uint8Array, reportCard: string }`.
 *
 * @throws {RangeError} if the tuning has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { wav, reportCard } = tuningReportCardWav(t12, 261.63);
 * await fs.writeFile('t12.wav', wav);
 * console.log(reportCard);
 */
export function tuningReportCardWav(
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
  opts?: PluckScaleWavOptions,
): { wav: Uint8Array; reportCard: string } {
  const reportCard = tuningReportCard(tuning, rootHz, spectrum);
  const wav = bestModeWav(tuning, rootHz ?? tuning.referenceHz, spectrum, opts);
  return { wav, reportCard };
}

// ---------------------------------------------------------------------------
// Q298 — tuningEntropyBestModeWav
// ---------------------------------------------------------------------------

/**
 * Render the highest-entropy mode of a tuning to WAV.
 *
 * Socratic Q298: "If I can find the best mode by entropy, can I render it
 * to WAV in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `bestModeByEntropy(tuning, spectrum, rootHz)` → the mode with maximum chord-map entropy.
 * 2. `scaleToChordMap(mode, tuning)` + `chordMapEntropyScore` → compute entropy for return value.
 * 3. `pluckScaleWav(mode, tuning, opts)` → WAV bytes.
 *
 * @param tuning   - The tuning system.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param spectrum - Optional instrument spectrum for entropy computation.
 * @param opts     - Optional Karplus-Strong synthesis options.
 * @returns `{ wav: Uint8Array, entropy: number, mode: Scale }`.
 *
 * @throws {RangeError} if the tuning has no modes.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const { wav, entropy, mode } = tuningEntropyBestModeWav(t12);
 * await fs.writeFile('best-entropy-mode.wav', wav);
 * console.log(`Best mode by entropy: ${mode.id}, entropy: ${entropy}`);
 */
export function tuningEntropyBestModeWav(
  tuning: TuningSystem,
  rootHz = 440,
  spectrum?: Spectrum,
  opts?: PluckScaleWavOptions,
): { wav: Uint8Array; entropy: number; mode: Scale } {
  const mode = bestModeByEntropy(tuning, spectrum, rootHz);
  const chordMap = scaleToChordMap(mode, tuning);
  const entropy = chordMapEntropyScore(chordMap, spectrum, rootHz);
  const wav = pluckScaleWav(mode, tuning, opts);
  return { wav, entropy, mode };
}
