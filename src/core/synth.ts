/** Synthesis parameters for audition. Pure (no Web Audio dependency) so it is unit-testable. */

import { type Spectrum } from './spectrum.js';
import { type Chord, realizeChordFreqs } from './chord.js';

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
