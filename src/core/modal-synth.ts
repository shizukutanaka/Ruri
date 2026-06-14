/** Modal (additive) synthesis from a Spectrum: inharmonic timbres (gamelan, bells). Pure samples. */

import { type Spectrum } from './spectrum.js';
import { mix } from './ks-synth.js';

export interface ModalOptions {
  readonly sampleRate: number;
  readonly seconds: number;
  /** Per-partial decay rate; higher partials decay faster (×ratio). */
  readonly decay: number;
}

export const DEFAULT_MODAL: ModalOptions = {
  sampleRate: 44100,
  seconds: 2,
  decay: 3,
};

/**
 * Synthesize a struck/resonant tone by summing exponentially-decaying sinusoids,
 * one per spectral partial. Because partial ratios come from the Spectrum, inharmonic
 * timbres (bell, gamelan metallophone) are reproduced faithfully — the same spectrum
 * the dissonance scorer uses (single source of truth).
 */
export function strike(
  fundamentalHz: number,
  spectrum: Spectrum,
  opts: ModalOptions = DEFAULT_MODAL,
): Float32Array {
  if (fundamentalHz <= 0) throw new RangeError(`fundamentalHz must be > 0, got ${fundamentalHz}`);
  const { sampleRate, seconds, decay } = opts;
  const total = Math.floor(sampleRate * seconds);
  const out = new Float32Array(total);
  const twoPi = 2 * Math.PI;

  for (const p of spectrum) {
    const freq = fundamentalHz * p.ratio;
    if (freq >= sampleRate / 2) continue; // skip partials above Nyquist (no aliasing)
    const omega = (twoPi * freq) / sampleRate;
    const tau = decay * p.ratio; // higher partials decay faster
    for (let n = 0; n < total; n++) {
      const t = n / sampleRate;
      out[n] = (out[n] as number) + p.amplitude * Math.exp(-tau * t) * Math.sin(omega * n);
    }
  }
  // Peak-normalize.
  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  if (peak > 0) for (let i = 0; i < total; i++) out[i] = (out[i] as number) / peak;
  return out;
}

/**
 * Synthesize a chord: strike each frequency with the same spectrum and options, then mix.
 * Closes the pipeline: `realizeRankedChordFreqs → strikeChord → encodeWav`.
 */
export function strikeChord(
  freqs: readonly number[],
  spectrum: Spectrum,
  opts: ModalOptions = DEFAULT_MODAL,
): Float32Array {
  if (freqs.length === 0) throw new RangeError('freqs must be non-empty');
  return mix(freqs.map((f) => strike(f, spectrum, opts)));
}
