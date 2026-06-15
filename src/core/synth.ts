/** Synthesis parameters for audition. Pure (no Web Audio dependency) so it is unit-testable. */

import { type Spectrum } from './spectrum.js';
import { type Chord, realizeChordFreqs } from './chord.js';
import { type Scale, scaleToFreqs } from './scale.js';
import { type TuningSystem } from './tuning.js';

const A4_HZ = 440;
const A4_MIDI = 69;

/** One oscillator voice: a frequency plus a gain. */
export interface Voice {
  readonly freq: number;
  readonly gain: number;
}

/**
 * Render a fundamental frequency through a spectrum into additive voices.
 * This is what a Web Audio additive synth would schedule; here it is pure data
 * so the timbre (and microtonal detune) can be verified without an audio context.
 */
export function voicesForPitch(freq: number, spectrum: Spectrum, gain = 0.2): Voice[] {
  return spectrum.map((p) => ({ freq: freq * p.ratio, gain: gain * p.amplitude }));
}

/** All voices for a chord (member fundamentals) under one timbre. */
export function voicesForChord(freqs: readonly number[], spectrum: Spectrum, gain = 0.2): Voice[] {
  return freqs.flatMap((f) => voicesForPitch(f, spectrum, gain));
}

/**
 * All Web Audio voices for a `Chord`, realized at the given root frequency.
 *
 * Bridges the portable `Chord` type directly into the Web Audio layer.
 * Equivalent to `voicesForChord(realizeChordFreqs(chord, rootHz), spectrum, gain)`,
 * closing the gap: currently the Web Audio path requires two steps when starting
 * from a `Chord` object rather than a raw Hz array.
 *
 * @example
 * const chord = chordFromSemitones('major', [0, 4, 7]);
 * const voices = voicesForChordObject(chord, 261.63, harmonicSpectrum());
 * // → schedule voices on Web Audio OscillatorNodes
 */
export function voicesForChordObject(
  chord: Chord,
  rootHz: number,
  spectrum: Spectrum,
  gain = 0.2,
): Voice[] {
  return voicesForChord(realizeChordFreqs(chord, rootHz), spectrum, gain);
}

/**
 * Web Audio detune is expressed in cents relative to an oscillator's base frequency.
 * Given a 12-TET base note and a target frequency, return (baseFreq, detuneCents)
 * so a caller can do `osc.frequency=baseFreq; osc.detune.value=detuneCents`.
 */
export function detuneFromBase(
  targetHz: number,
  baseMidi: number,
): { baseFreq: number; detuneCents: number } {
  const baseFreq = A4_HZ * 2 ** ((baseMidi - A4_MIDI) / 12);
  const detuneCents = 1200 * Math.log2(targetHz / baseFreq);
  return { baseFreq, detuneCents };
}

/**
 * All Web Audio voices for a `Scale` sounded simultaneously, as a tone cluster.
 *
 * Socratic Q98: `voicesForChord(freqs, spectrum)` produces additive-synthesis
 * voices from raw Hz[], and `scaleToFreqs(scale, tuning)` returns those Hz[].
 * But going from a `Scale` object to Web Audio voices still requires two calls.
 * If `Scale` is first-class, rendering it into synthesis voices should be one call.
 *
 * Bridges `scaleToFreqs → voicesForChord`. The resulting `Voice[]` is pure data
 * (no Web Audio dependency) so it can be tested and passed to a Web Audio scheduler.
 *
 * @param scale - The scale whose degrees are all rendered into voices.
 * @param tuning - The parent tuning the scale belongs to.
 * @param spectrum - The timbre (partials) applied to each scale degree.
 * @param gain - Per-voice gain multiplier (default 0.2).
 * @returns Flat array of `Voice` objects ready to schedule on OscillatorNodes.
 *
 * @throws {RangeError} if the scale and tuning are incompatible.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'm', name: 'major', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const voices = scaleToVoices(major, t12, harmonicSpectrum());
 * // voices.length === 7 * harmonicSpectrum().length
 */
export function scaleToVoices(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  gain = 0.2,
): Voice[] {
  const freqs = scaleToFreqs(scale, tuning);
  return voicesForChord(freqs, spectrum, gain);
}
