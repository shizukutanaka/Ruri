/** 16-bit PCM mono WAV encoder. Zero-dep, byte-exact. */

import { strikeChord, type ModalOptions, DEFAULT_MODAL } from '../core/modal-synth.js';
import { type Spectrum } from '../core/spectrum.js';

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
