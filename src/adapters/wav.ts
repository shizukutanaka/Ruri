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
  scaleToFreqs,
  synthScaleFromScale,
  bestModeForTuning,
} from '../core/scale.js';
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

/** A decoded WAV: mono 16-bit PCM samples in [-1, 1] plus the sample rate. */
export interface DecodedWav {
  readonly samples: Float32Array;
  readonly sampleRate: number;
}

/**
 * Decode a 16-bit PCM WAV — the inverse of {@link encodeWav}.
 *
 * Reads the subset this library writes and that recorders commonly produce:
 * RIFF/WAVE framing, an uncompressed PCM `fmt ` chunk at 16 bits per sample,
 * mono or stereo. Chunks are walked by their declared sizes rather than assumed
 * to sit at fixed offsets, because real files carry `LIST`/`fact` chunks before
 * `data`. Stereo is downmixed to mono by averaging, which is what pitch
 * detection wants.
 *
 * Anything outside that subset throws instead of returning plausible-looking
 * samples: a misread header does not fail loudly on its own, it yields noise
 * that a detector will happily report a confident pitch for.
 *
 * @throws {RangeError} if the framing is not RIFF/WAVE, if the format is not
 *   uncompressed 16-bit PCM, if the channel count is not 1 or 2, or if a
 *   required chunk is missing or truncated.
 *
 * @example
 * const { samples, sampleRate } = decodeWav(bytes);
 * const pitch = autocorrelationPitch(samples, sampleRate);
 */
export function decodeWav(bytes: Uint8Array): DecodedWav {
  if (bytes.length < 44) {
    throw new RangeError(`decodeWav: too short to be a WAV (${bytes.length} bytes)`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number): string =>
    String.fromCharCode(bytes[offset]!, bytes[offset + 1]!, bytes[offset + 2]!, bytes[offset + 3]!);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') {
    throw new RangeError('decodeWav: not a RIFF/WAVE file');
  }

  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataStart = -1;
  let dataLength = 0;

  // Walk the chunk list; real files put LIST/fact chunks before `data`.
  for (let p = 12; p + 8 <= bytes.length; ) {
    const id = tag(p);
    const size = view.getUint32(p + 4, true);
    const body = p + 8;
    if (id === 'fmt ') {
      if (size < 16) throw new RangeError(`decodeWav: fmt chunk too small (${size})`);
      const format = view.getUint16(body, true);
      if (format !== 1) {
        throw new RangeError(`decodeWav: only uncompressed PCM is supported, got format ${format}`);
      }
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === 'data') {
      dataStart = body;
      dataLength = size;
    }
    p = body + size + (size % 2); // chunks are word-aligned
  }

  if (sampleRate === 0) throw new RangeError('decodeWav: no fmt chunk');
  if (dataStart < 0) throw new RangeError('decodeWav: no data chunk');
  if (bitsPerSample !== 16) {
    throw new RangeError(`decodeWav: only 16-bit samples are supported, got ${bitsPerSample}`);
  }
  if (channels !== 1 && channels !== 2) {
    throw new RangeError(`decodeWav: only mono or stereo is supported, got ${channels} channels`);
  }
  const available = Math.min(dataLength, bytes.length - dataStart);
  const frames = Math.floor(available / (2 * channels));
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) {
      sum += view.getInt16(dataStart + (i * channels + c) * 2, true) / 32767;
    }
    samples[i] = sum / channels;
  }
  return { samples, sampleRate };
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
