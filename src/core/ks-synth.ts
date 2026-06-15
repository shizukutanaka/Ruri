/** Karplus-Strong plucked-string synthesis. Pure sample generation (no Web Audio), testable. */

/** Deterministic PRNG (mulberry32) so generated waveforms are reproducible in tests. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface KsOptions {
  readonly sampleRate: number;
  readonly seconds: number;
  /** Decay/damping in [0,1]; higher = longer sustain. */
  readonly damping: number;
  readonly seed: number;
}

export const DEFAULT_KS: KsOptions = {
  sampleRate: 44100,
  seconds: 1.5,
  damping: 0.996,
  seed: 1,
};

/**
 * Synthesize a plucked string at `freqHz` via Karplus-Strong.
 * Microtonal pitch is achieved with a fractional delay-line length (linear interpolation),
 * so any cents value is reachable, not just sample-rate-quantized pitches.
 */
export function pluck(freqHz: number, opts: KsOptions = DEFAULT_KS): Float32Array {
  if (freqHz <= 0) throw new RangeError(`freqHz must be > 0, got ${freqHz}`);
  const { sampleRate, seconds, damping, seed } = opts;
  const exactLen = sampleRate / freqHz; // fractional delay-line length
  const N = Math.floor(exactLen);
  if (N < 2) throw new RangeError(`frequency too high for sample rate: ${freqHz}`);
  const frac = exactLen - N;

  const rng = mulberry32(seed);
  // Excitation: noise burst of length N.
  const buf = new Float32Array(N + 1);
  for (let i = 0; i < N; i++) buf[i] = rng() * 2 - 1;

  const total = Math.floor(sampleRate * seconds);
  const out = new Float32Array(total);
  let idx = 0;
  for (let n = 0; n < total; n++) {
    const cur = buf[idx] as number;
    const nextIdx = (idx + 1) % (N + 1);
    const nxt = buf[nextIdx] as number;
    out[n] = cur;
    // Fractional-delay all-pass-ish: blend current and next for microtonal tuning,
    // then average with the following sample (the KS low-pass) and damp.
    const interp = cur * (1 - frac) + nxt * frac;
    buf[idx] = damping * 0.5 * (interp + nxt);
    idx = nextIdx;
  }
  return out;
}

/** Peak-normalize a waveform to [-1, 1] (avoids clipping when summing voices). */
export function normalize(wave: Float32Array): Float32Array {
  let peak = 0;
  for (const s of wave) peak = Math.max(peak, Math.abs(s));
  if (peak === 0) return wave;
  const g = 1 / peak;
  const out = new Float32Array(wave.length);
  for (let i = 0; i < wave.length; i++) out[i] = (wave[i] as number) * g;
  return out;
}

/** Mix several waveforms (e.g. chord voices) into one, then normalize. */
export function mix(waves: readonly Float32Array[]): Float32Array {
  const len = waves.reduce((m, w) => Math.max(m, w.length), 0);
  const out = new Float32Array(len);
  for (const w of waves)
    for (let i = 0; i < w.length; i++) out[i] = (out[i] as number) + (w[i] as number);
  return normalize(out);
}

/**
 * Synthesize a chord: pluck each frequency with the same options and mix.
 * Closes the pipeline: `realizeRankedChordFreqs → pluckChord → encodeWav`.
 */
export function pluckChord(freqs: readonly number[], opts: KsOptions = DEFAULT_KS): Float32Array {
  if (freqs.length === 0) throw new RangeError('freqs must be non-empty');
  return mix(freqs.map((f) => pluck(f, opts)));
}

export interface SynthScaleOptions extends KsOptions {
  /** Duration of each individual note in the melodic sequence, in seconds. Default: 0.5 */
  readonly noteSeconds: number;
}

export const DEFAULT_SYNTH_SCALE: SynthScaleOptions = {
  ...DEFAULT_KS,
  noteSeconds: 0.5,
};

/**
 * Synthesize a scale as a melodic sequence: each degree is plucked in order,
 * one note at a time, and concatenated into a single `Float32Array`.
 *
 * Socratic Q57: `scaleToFreqs(scale, tuning)` gives Hz per degree, and `pluck`
 * synthesizes a single note — but playing the scale as a melody (not a chord)
 * requires manual looping, concatenation, and sample-rate alignment. This
 * closes the gap: `scaleToFreqs → synthScale → encodeWav`.
 *
 * Each note is synthesized with Karplus-Strong at `noteSeconds` duration.
 * The `seconds` field in `opts` controls each individual note's synthesis
 * buffer length (via `pluck`); `noteSeconds` controls how much of that buffer
 * is included in the output (if `noteSeconds > opts.seconds`, it is clamped to
 * `opts.seconds`). This lets notes overlap or decay naturally.
 *
 * @throws {RangeError} if `freqs` is empty.
 *
 * @example
 * import { scaleToFreqs } from './scale.js';
 * const freqs = scaleToFreqs(myScale, myTuning);
 * const audio = synthScale(freqs);
 * const wav = encodeWav(audio); // 8-note melodic scale in one pipeline
 */
export function synthScale(
  freqs: readonly number[],
  opts: SynthScaleOptions = DEFAULT_SYNTH_SCALE,
): Float32Array {
  if (freqs.length === 0) throw new RangeError('freqs must be non-empty');
  const { sampleRate, noteSeconds } = opts;
  // Each note contributes exactly noteSeconds (clamped to opts.seconds) of audio.
  const samplesPerNote = Math.floor(sampleRate * Math.min(noteSeconds, opts.seconds));
  const total = samplesPerNote * freqs.length;
  const out = new Float32Array(total);
  for (let i = 0; i < freqs.length; i++) {
    const freq = freqs[i] as number;
    const wave = pluck(freq, opts);
    const offset = i * samplesPerNote;
    for (let j = 0; j < samplesPerNote && j < wave.length; j++) {
      out[offset + j] = wave[j] as number;
    }
  }
  return out;
}
