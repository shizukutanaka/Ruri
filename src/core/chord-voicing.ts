import { type Chord, realizeChordFreqs } from './chord.js';
import { type Spectrum } from './spectrum.js';
import { chordDissonance } from './dissonance.js';

/** A candidate voicing of a chord: each member note shifted to some octave. */
export interface ChordVoicing {
  /** Realized frequencies (Hz), one per chord member, in original order. */
  readonly freqsHz: readonly number[];
  /** Octave shift applied to each member (0 = as-written, +1 = up an octave, ...). */
  readonly octaveOffsets: readonly number[];
  /** Sensory dissonance of this voicing under the given spectrum. */
  readonly dissonance: number;
}

/**
 * Find the least-dissonant voicing of `chord`: for each member note, try every
 * octave shift within `opts.registerRange` (default [-1, 1]) and return the
 * combination that minimizes `chordDissonance` under `spectrum`.
 *
 * Dissonance is timbre-dependent (see src/core/CLAUDE.md) — `spectrum` must
 * match the instrument the chord will actually be rendered with.
 *
 * Search space is `(registerRange width)^(chord.intervals.length)`; fine for
 * ordinary 3-6 note chords, impractical for very large chords.
 */
export function optimalChordVoicing(
  chord: Chord,
  rootHz: number,
  spectrum: Spectrum,
  opts?: { registerRange?: readonly [number, number] },
): ChordVoicing {
  const baseFreqs = realizeChordFreqs(chord, rootHz);
  if (baseFreqs.length === 0) {
    throw new RangeError('optimalChordVoicing: chord has no intervals');
  }

  const [lo, hi] = opts?.registerRange ?? [-1, 1];
  const offsetChoices: number[] = [];
  for (let o = lo; o <= hi; o++) offsetChoices.push(o);

  const n = baseFreqs.length;
  const total = offsetChoices.length ** n;

  let best: ChordVoicing | undefined;
  for (let combo = 0; combo < total; combo++) {
    const offsets: number[] = [];
    let rem = combo;
    for (let i = 0; i < n; i++) {
      offsets.push(offsetChoices[rem % offsetChoices.length]!);
      rem = Math.floor(rem / offsetChoices.length);
    }
    const freqs = baseFreqs.map((f, i) => f * 2 ** offsets[i]!);
    const dissonance = chordDissonance(freqs, spectrum);
    if (!best || dissonance < best.dissonance) {
      best = { freqsHz: freqs, octaveOffsets: offsets, dissonance };
    }
  }
  return best!;
}
