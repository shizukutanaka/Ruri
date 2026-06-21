const A4_MIDI = 69;
export const A4_HZ_DEFAULT = 440;
const BEND_CENTER = 8192;
const BEND_MAX = 16383;

/** 12-TET MIDI note number → frequency. */
export function midiToFreq(note: number, a4Hz = A4_HZ_DEFAULT): number {
  return a4Hz * 2 ** ((note - A4_MIDI) / 12);
}

/** Frequency → fractional MIDI note (12-TET). */
export function freqToMidiFloat(hz: number, a4Hz = A4_HZ_DEFAULT): number {
  return A4_MIDI + 12 * Math.log2(hz / a4Hz);
}

/** MPE / pitch-bend note: integer note + 14-bit bend (center 8192). */
export interface MpeNote {
  readonly note: number;
  readonly bend14: number;
}

const clampBend = (b: number): number => Math.max(0, Math.min(BEND_MAX, b));

/**
 * Frequency → nearest MIDI note plus a 14-bit pitch bend.
 * `bendRangeSemitones` must match the receiving instrument's configured range.
 * High-risk conversion (I7): verified by round-trip property test.
 */
export function freqToMpe(hz: number, bendRangeSemitones = 2, a4Hz = A4_HZ_DEFAULT): MpeNote {
  const exact = freqToMidiFloat(hz, a4Hz);
  const note = Math.round(exact);
  const bendSemis = exact - note;
  const bend14 = clampBend(
    Math.round(BEND_CENTER + (bendSemis / bendRangeSemitones) * BEND_CENTER),
  );
  return { note, bend14 };
}

/** Inverse of freqToMpe (for verification / playback). */
export function mpeToFreq(m: MpeNote, bendRangeSemitones = 2, a4Hz = A4_HZ_DEFAULT): number {
  const bendSemis = ((m.bend14 - BEND_CENTER) / BEND_CENTER) * bendRangeSemitones;
  return midiToFreq(m.note + bendSemis, a4Hz);
}

// ---------------------------------------------------------------------------
// I3 — pitchHzClassify
// ---------------------------------------------------------------------------

type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

const NOTE_NAMES: readonly NoteName[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/**
 * Classify a frequency in Hz against 12-TET MIDI pitch space.
 *
 * Returns the fractional MIDI note, nearest integer MIDI note, note name,
 * octave number (MIDI 60 = C4 → octave 4), and the signed cents deviation
 * from equal temperament (positive = sharp of ET).
 *
 * @throws {RangeError} if `hz <= 0` or `hz` is not finite.
 */
export function pitchHzClassify(
  hz: number,
  a4Hz?: number,
): {
  midiFloat: number;
  midiNearest: number;
  noteName: NoteName;
  octave: number;
  centsOff: number;
} {
  if (!Number.isFinite(hz) || hz <= 0) {
    throw new RangeError(`pitchHzClassify: hz must be a finite positive number, got ${hz}`);
  }

  const midiFloat = freqToMidiFloat(hz, a4Hz);
  const midiNearest = Math.round(midiFloat);
  const centsOff = (midiFloat - midiNearest) * 100;
  const noteIndex = ((midiNearest % 12) + 12) % 12;
  const noteName = NOTE_NAMES[noteIndex]!;
  const octave = Math.floor(midiNearest / 12) - 1;

  return { midiFloat, midiNearest, noteName, octave, centsOff };
}
