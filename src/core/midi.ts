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
