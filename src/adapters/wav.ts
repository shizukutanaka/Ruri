/** 16-bit PCM mono WAV encoder. Zero-dep, byte-exact. */

import { strike, strikeChord, type ModalOptions, DEFAULT_MODAL } from '../core/modal-synth.js';
import { type Spectrum } from '../core/spectrum.js';
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
  scaleToFreqs,
  synthScaleFromScale,
  buildChordProgression,
  scaleModeSeries,
} from '../core/scale.js';
import {
  type RankedChord,
  strikeRankedChord,
  pluckRankedChord,
  optimalChordOrder,
} from '../core/chord-search.js';
import { type Chord, realizeChordFreqs } from '../core/chord.js';

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
