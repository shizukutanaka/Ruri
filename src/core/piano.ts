/** Piano chord fingering: key position is unique, so only assign fingers under hand span. */

/** Finger numbers: 1 = thumb ... 5 = little finger (one hand). */
export type Finger = 1 | 2 | 3 | 4 | 5;

export interface PianoHandProfile {
  /** Max span in semitones one hand can cover (thumb to little finger). */
  readonly maxSpanSemitones: number;
}

export const DEFAULT_PIANO_HAND: PianoHandProfile = { maxSpanSemitones: 14 }; // ~an octave + a step

export interface PianoFingering {
  /** MIDI note → finger, ascending pitch order. */
  readonly assignment: readonly { readonly note: number; readonly finger: Finger }[];
  readonly oneHand: boolean;
}

/**
 * Assign fingers to a chord's MIDI notes for one hand if it fits the span,
 * otherwise report oneHand=false (the caller may split across hands).
 * Fingers are assigned in ascending pitch order across available fingers 1..5.
 */
export function fingerPianoChord(
  midiNotes: readonly number[],
  hand: PianoHandProfile = DEFAULT_PIANO_HAND,
): PianoFingering {
  const notes = [...new Set(midiNotes)].sort((a, b) => a - b);
  const span = notes.length > 0 ? (notes.at(-1) as number) - (notes[0] as number) : 0;
  const oneHand = notes.length <= 5 && span <= hand.maxSpanSemitones;

  // Spread fingers 1..5 across the notes (thumb lowest for right hand).
  const fingers: Finger[] = [1, 2, 3, 4, 5];
  const assignment = notes.map((note, i) => {
    const idx = notes.length <= 1 ? 0 : Math.round((i / (notes.length - 1)) * 4);
    return { note, finger: fingers[idx] as Finger };
  });
  return { assignment, oneHand };
}
