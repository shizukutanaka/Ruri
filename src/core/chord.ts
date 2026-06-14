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

/**
 * Chord member pitches as absolute cents on an instrument, given the root's
 * instrument-cent position.
 *
 * This is the bridge from the `Chord` type (root-relative intervals) into the
 * instrument coordinate system that `fingerChord` speaks. `StringInstrument`
 * deliberately has no Hz anchor (instruments are transposable), so the caller
 * supplies `rootCentsOnInstrument` — the position of the chord root in the
 * instrument's local cents space (e.g. 800c for the 5th string of a guitar
 * tuned EADGBE, where string 0 open = 0c).
 *
 * @example
 * const guitar = guitarStandard();
 * const major = chordFromSemitones('major', [0, 4, 7]);
 * // A2 string on guitar: string 1, fret 0 → openStringsCents[1] = 500c
 * const fingerings = fingerChord(guitar, chordToCentOffsets(major, 500));
 */
export function chordToCentOffsets(chord: Chord, rootCentsOnInstrument: number): number[] {
  return chordToCents(chord).map((c) => c + rootCentsOnInstrument);
}

const SEMITONE = CENTS_PER_OCTAVE / 12;

/** Build a 12-TET chord from semitone offsets, e.g. major triad = [0, 4, 7]. */
export function chordFromSemitones(name: string, semitones: readonly number[]): Chord {
  return {
    name,
    intervals: semitones.map((s) => ({ kind: 'cents' as const, cents: s * SEMITONE })),
  };
}
