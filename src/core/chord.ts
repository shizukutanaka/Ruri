import { CENTS_PER_OCTAVE } from './ratio.js';
import { type Pitch, centsToFreqFactor, pitchToCents } from './cents.js';

/** A chord as root-relative intervals (instrument-independent). */
export interface Chord {
  readonly name: string;
  /** Intervals from the root, ascending. Include the unison (0c) as the root. */
  readonly intervals: readonly Pitch[];
}

/** Realize a chord at an absolute root frequency → member frequencies (Hz). */
export function realizeChordFreqs(chord: Chord, rootHz: number): number[] {
  return chord.intervals.map((iv) => rootHz * centsToFreqFactor(pitchToCents(iv)));
}

/** Chord intervals in cents from the root. */
export function chordToCents(chord: Chord): number[] {
  return chord.intervals.map(pitchToCents);
}

const SEMITONE = CENTS_PER_OCTAVE / 12;

/** Build a 12-TET chord from semitone offsets, e.g. major triad = [0, 4, 7]. */
export function chordFromSemitones(name: string, semitones: readonly number[]): Chord {
  return {
    name,
    intervals: semitones.map((s) => ({ kind: 'cents' as const, cents: s * SEMITONE })),
  };
}
