/**
 * Jazz ii-V-I progression builders and reharmonization helpers.
 */

export interface ChordSpec {
  readonly root: number; // pitch class 0..11
  readonly quality: 'maj7' | 'min7' | 'dom7' | 'min7b5' | 'dim7' | 'maj' | 'min' | 'dom7b9';
  readonly name: string; // e.g. 'Dm7', 'G7', 'Cmaj7'
}

const NOTE_NAMES: readonly string[] = [
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

function noteName(pc: number): string {
  return NOTE_NAMES[((pc % 12) + 12) % 12]!;
}

/** Quality → name suffix map */
const QUALITY_SUFFIX: Record<ChordSpec['quality'], string> = {
  maj7: 'maj7',
  min7: 'm7',
  dom7: '7',
  min7b5: 'm7b5',
  dim7: 'dim7',
  maj: '',
  min: 'm',
  dom7b9: '7b9',
};

function makeChord(root: number, quality: ChordSpec['quality']): ChordSpec {
  return {
    root,
    quality,
    name: `${noteName(root)}${QUALITY_SUFFIX[quality]}`,
  };
}

/**
 * Build a diatonic ii-V-I progression in the given key.
 * - major: [ii min7, V dom7, I maj7]
 * - minor: [ii min7b5, V dom7b9, i min7]
 * Default mode is 'major'.
 */
export function iiVI(keyPc: number, mode: 'major' | 'minor' = 'major'): readonly ChordSpec[] {
  if (mode === 'major') {
    return [
      makeChord((keyPc + 2) % 12, 'min7'),
      makeChord((keyPc + 7) % 12, 'dom7'),
      makeChord(keyPc, 'maj7'),
    ];
  } else {
    return [
      makeChord((keyPc + 2) % 12, 'min7b5'),
      makeChord((keyPc + 7) % 12, 'dom7b9'),
      makeChord(keyPc, 'min7'),
    ];
  }
}

/**
 * Replace a dominant 7th chord with its tritone substitute (e.g. G7 → Db7).
 * Tritone sub: new root is (chord.root + 6) % 12.
 * Throws RangeError if chord.quality !== 'dom7'.
 */
export function tritoneSub(chord: ChordSpec): ChordSpec {
  if (chord.quality !== 'dom7') {
    throw new RangeError(
      `tritoneSub: tritone substitution requires dominant 7th, got '${chord.quality}'`,
    );
  }
  const newRoot = (chord.root + 6) % 12;
  return makeChord(newRoot, 'dom7');
}

/**
 * Build the secondary dominant V7/X of a given chord.
 * Returns a dom7 chord rooted a perfect 5th above the target chord's root.
 */
export function secondaryDominantOf(chord: ChordSpec): ChordSpec {
  const newRoot = (chord.root + 7) % 12;
  return makeChord(newRoot, 'dom7');
}
