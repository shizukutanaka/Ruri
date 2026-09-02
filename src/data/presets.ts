/** Curated tuning presets. Each is ONE documented example with provenance — never "the" tuning. */

import { type TuningSystem, tuningDistance } from '../core/tuning.js';
import { rankChords, type RankedChord, type ChordSearchOptions } from '../core/chord-search.js';
import { type TuningPreset, loadTuningPreset } from './tuning-data.js';
import { tuningToScl, writeScl } from '../adapters/scala.js';
import { tuningToMts, type TuningToMtsOptions } from '../adapters/mts.js';
import { progressionToSmf, type ProgressionToSmfOptions } from '../adapters/smf.js';
import {
  tuningToScale,
  progressionFromPattern,
  tuningReport,
  compareTuningReports,
  type TuningReportType,
} from '../core/scale.js';
import { type Chord } from '../core/chord.js';
import { type Spectrum } from '../core/spectrum.js';
const SEMI = 100;

export const TWELVE_TET: TuningPreset = {
  id: '12-tet',
  name: '12-tone equal temperament',
  referenceHz: 440,
  periodCents: 1200,
  degrees: Array.from({ length: 12 }, (_, i) => i * SEMI),
  source: 'theoretical',
  note: 'Standard Western equal temperament. One of many tuning systems, not a default truth.',
  provenance: { citation: 'Standard 12-EDO (A=440 ISO 16)', license: 'public-domain' },
};

export const JUST_INTONATION_5L: TuningPreset = {
  id: 'just-5-limit',
  name: 'Just intonation (5-limit major)',
  referenceHz: 440,
  periodCents: 1200,
  degrees: ['1/1', '9/8', '5/4', '4/3', '3/2', '5/3', '15/8', '2/1'],
  source: 'theoretical',
  note: '5-limit just major scale, ratios preserved exactly. One construction among many JI systems.',
  provenance: { citation: 'Classic 5-limit just intonation', license: 'public-domain' },
};

/** Turkish makam Uşşak — one measured example. Theoretical models (AEU 24-TET) diverge from practice. */

export const MAKAM_USSAK: TuningPreset = {
  id: 'makam-ussak-example',
  name: 'Makam Uşşak (one measured example)',
  localName: 'Uşşak',
  referenceHz: 440,
  periodCents: 1200,
  degrees: [0, 181, 294, 498, 702, 792, 996, 1200],
  source: 'measured',
  culturalContext: 'Turkish makam music; the neutral 2nd (~181c) is not captured by 12/24-TET.',
  region: 'Turkey',
  note: 'ONE measured realization relative to dügâh. Makam intonation varies by performer, region, and school; this is not a canonical scale.',
  provenance: {
    citation:
      'Bozkurt et al., pitch-histogram analysis of makam performance (SymbTr corpus), https://github.com/MTG/SymbTr',
    url: 'https://github.com/MTG/SymbTr',
    license: 'cite-only',
  },
};

/** Javanese sléndro — one measured example. Tuning varies per ensemble; octaves are stretched. */

export const SLENDRO_EXAMPLE: TuningPreset = {
  id: 'slendro-example',
  name: 'Sléndro (one measured gamelan)',
  localName: 'sléndro',
  referenceHz: 440,
  periodCents: 1208, // stretched pseudo-octave (measured > 1200)
  degrees: [0, 231, 474, 717, 955],
  source: 'measured',
  culturalContext:
    'Javanese gamelan; ~5 near-equal steps but each ensemble differs. No octave-equivalence concept; pseudo-octave stretched. Instruments have inharmonic spectra.',
  region: 'Central Java, Indonesia',
  note: 'ONE measured ensemble. Sléndro tuning differs island-to-island and gamelan-to-gamelan; treat as an example, not a standard.',
  provenance: {
    citation: 'Kunst / Polansky, "Interval Sizes in Javanese Sléndro"',
    license: 'cite-only',
  },
};

/** Javanese pélog — one measured example, ~subset of 9-EDO per Surjodiningrat. */

export const PELOG_EXAMPLE: TuningPreset = {
  id: 'pelog-example',
  name: 'Pélog (one measured gamelan)',
  localName: 'pélog',
  referenceHz: 440,
  periodCents: 1206,
  degrees: [0, 120, 258, 539, 675, 785, 943],
  source: 'measured',
  culturalContext:
    'Javanese gamelan; 7 uneven steps, often a coarse subset of 9-EDO. Per-ensemble variation; inharmonic spectra.',
  region: 'Central Java, Indonesia',
  note: 'ONE measured ensemble. Pélog varies widely; Surjodiningrat (1972) showed statistical preferences across 27 gamelans. Not canonical.',
  provenance: {
    citation: 'Surjodiningrat et al. (1972), "Tone Measurements of Outstanding Javanese Gamelans"',
    license: 'cite-only',
  },
};

/**
 * Pythagorean 12-tone (3-limit), the common Eb–G# layout.
 *
 * Every degree is an exact power of 3/2 reduced into the octave, so the degrees
 * are stored as ratios (not cents) — the ratio-primary representation survives
 * export to `.scl` without precision loss.
 */
export const PYTHAGOREAN_12: TuningPreset = {
  id: 'pythagorean-12',
  name: 'Pythagorean (12-tone, 3-limit)',
  referenceHz: 440,
  periodCents: 1200,
  degrees: [
    '1/1',
    '256/243',
    '9/8',
    '32/27',
    '81/64',
    '4/3',
    '729/512',
    '3/2',
    '128/81',
    '27/16',
    '16/9',
    '243/128',
    '2/1',
  ],
  source: 'theoretical',
  note: 'One of several Pythagorean 12-note layouts (here Eb–G#); the choice of where to place the wolf fifth varies by source and repertoire.',
  provenance: {
    citation: 'Pythagorean tuning; chain of pure 3/2 fifths (classical/medieval theory)',
    license: 'public-domain',
  },
};

/**
 * Quarter-comma meantone (Aron 1523): each fifth narrowed by 1/4 syntonic comma
 * so that the major third is a pure 5/4 (386.314c). Values agree exactly with
 * the library's own `meantoneQuarterComma()` construction.
 */
export const MEANTONE_QUARTER_COMMA: TuningPreset = {
  id: 'meantone-quarter-comma',
  name: 'Quarter-comma meantone',
  referenceHz: 440,
  periodCents: 1200,
  degrees: [
    0, 76.049, 193.157, 269.206, 386.314, 503.422, 579.471, 696.578, 772.627, 889.735, 965.784,
    1082.892,
  ],
  source: 'theoretical',
  note: 'One documented layout (Eb–G#) of quarter-comma meantone; the wolf fifth falls at G#–Eb. Pure 5/4 thirds are the defining property.',
  provenance: {
    citation: 'Pietro Aron, "Toscanello in Musica" (1523); quarter-comma meantone',
    license: 'public-domain',
  },
};

/** Werckmeister III (1691) — an early well-temperament; all keys usable, each with its own colour. */

export const WERCKMEISTER_III: TuningPreset = {
  id: 'werckmeister-iii',
  name: 'Werckmeister III (well-temperament)',
  referenceHz: 440,
  periodCents: 1200,
  degrees: [
    0, 90.225, 192.18, 294.135, 390.225, 498.045, 588.27, 696.09, 792.18, 888.27, 996.09, 1092.18,
  ],
  source: 'theoretical',
  note: 'Werckmeister\'s "correct temperament no. 1"; the Pythagorean comma is distributed over four fifths (C–G, G–D, D–A, B–F#). One of several Werckmeister temperaments.',
  provenance: {
    citation: 'Andreas Werckmeister, "Musicalische Temperatur" (1691)',
    license: 'public-domain',
  },
};

/** Kirnberger III (1779) — splits the syntonic comma over four fifths, keeping C–E pure (5/4). */

export const KIRNBERGER_III: TuningPreset = {
  id: 'kirnberger-iii',
  name: 'Kirnberger III (well-temperament)',
  referenceHz: 440,
  periodCents: 1200,
  degrees: [
    0, 90.225, 193.157, 294.135, 386.314, 498.045, 590.224, 696.578, 792.18, 889.735, 996.09,
    1088.269,
  ],
  source: 'theoretical',
  note: 'One of Kirnberger\'s temperaments (III); C–E is a pure 5/4 major third, the defining feature. Not "the" Baroque tuning — many well-temperaments coexisted.',
  provenance: {
    citation: 'Johann Philipp Kirnberger, "Die Kunst des reinen Satzes in der Musik" (1779)',
    license: 'public-domain',
  },
};

/**
 * Bohlen-Pierce: 13 equal divisions of the *tritave* (3/1), not the octave.
 * Included because non-octave periods are a first-class concept in this library —
 * this preset exercises that directly.
 */
export const BOHLEN_PIERCE_13: TuningPreset = {
  id: 'bohlen-pierce-13',
  name: 'Bohlen-Pierce (13 equal divisions of 3/1)',
  referenceHz: 440,
  periodCents: 1901.955,
  degrees: Array.from({ length: 13 }, (_, i) => (i * 1200 * Math.log2(3)) / 13),
  source: 'theoretical',
  note: 'The equal-tempered form of Bohlen-Pierce. A just (ratio-based) variant also exists; this is one construction, not the only one. Repeats at the tritave (3/1), not the octave.',
  provenance: {
    citation: 'Heinz Bohlen (1978); Mathews & Pierce, "The Bohlen-Pierce Scale" (1988)',
    license: 'public-domain',
  },
};

/**
 * Build a circulating (well-)temperament from the widths of the eleven fifths
 * in the chain C-G-D-A-E-B-F#-C#-G#-D#-A#-F, returning the twelve pitch classes
 * in cents from C.
 *
 * Deriving these from the construction rather than transcribing a table means
 * the defining property is checkable: twelve fifths must close into seven
 * octaves exactly.
 */
function circulatingFromFifths(fifthWidths: readonly number[], fBelowC?: number): number[] {
  const chain = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
  const order = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const pitch: Record<string, number> = { C: 0 };
  let acc = 0;
  for (let i = 0; i < 11; i++) {
    acc += fifthWidths[i] as number;
    pitch[chain[i + 1] as string] = acc;
  }
  // Vallotti reaches F by a narrowed fifth *below* C rather than round the top.
  if (fBelowC !== undefined) pitch['F'] = -fBelowC;
  return order.map((n) => (((pitch[n] as number) % 1200) + 1200) % 1200);
}

/** Pythagorean comma in cents — the gap twelve pure fifths leave over seven octaves. */

const PYTHAGOREAN_COMMA_CENTS = 1200 * Math.log2(531441 / 524288);
/** A fifth narrowed by one sixth of that comma: the unit both temperaments use. */

const SIXTH_COMMA_FIFTH = 1200 * Math.log2(3 / 2) - PYTHAGOREAN_COMMA_CENTS / 6;

const PURE_FIFTH_CENTS = 1200 * Math.log2(3 / 2);

const T6 = SIXTH_COMMA_FIFTH;

const P5 = PURE_FIFTH_CENTS;

/**
 * Vallotti (1754): the six fifths F-C-G-D-A-E-B — every white key — narrowed by
 * a sixth of the Pythagorean comma, the remaining six pure. C major and A minor
 * come out best.
 */
export const VALLOTTI: TuningPreset = {
  id: 'vallotti',
  name: 'Vallotti (1/6-comma well-temperament)',
  referenceHz: 440,
  periodCents: 1200,
  degrees: circulatingFromFifths([T6, T6, T6, T6, T6, P5, P5, P5, P5, P5, P5], T6),
  source: 'theoretical',
  note: 'Derived from the construction (six white-key fifths narrowed by 1/6 Pythagorean comma), not transcribed. Sources disagree about whether this layout or its sharpward shift deserves the name Vallotti — see Duffin, "Why I hate Vallotti (or is it Young?)"; the companion preset `young-ii` is the shifted form.',
  provenance: {
    citation: 'Francescantonio Vallotti (c. 1754); 1/6-comma circulating temperament',
    license: 'public-domain',
  },
};

/**
 * Young's second temperament (1800): the same six narrowed fifths shifted one
 * step sharpward, to C-G-D-A-E-B-F#. G major and E minor come out best.
 */
export const YOUNG_II: TuningPreset = {
  id: 'young-ii',
  name: "Young's second temperament (1/6-comma well-temperament)",
  referenceHz: 440,
  periodCents: 1200,
  degrees: circulatingFromFifths([T6, T6, T6, T6, T6, T6, P5, P5, P5, P5, P5]),
  source: 'theoretical',
  note: 'Derived from the construction (six fifths C-G-D-A-E-B-F# narrowed by 1/6 Pythagorean comma), not transcribed. Identical in method to `vallotti` but shifted one fifth sharpward, which moves the best-sounding keys; the attribution of the two layouts is disputed in the literature.',
  provenance: {
    citation:
      'Thomas Young, "Outlines of Experiments and Inquiries Respecting Sound and Light" (1800), second temperament',
    license: 'public-domain',
  },
};

export const ALL_PRESETS: readonly TuningPreset[] = [
  TWELVE_TET,
  JUST_INTONATION_5L,
  MAKAM_USSAK,
  SLENDRO_EXAMPLE,
  PELOG_EXAMPLE,
  PYTHAGOREAN_12,
  MEANTONE_QUARTER_COMMA,
  WERCKMEISTER_III,
  KIRNBERGER_III,
  BOHLEN_PIERCE_13,
  VALLOTTI,
  YOUNG_II,
];

/**
 * Look up a preset by id and return a validated `TuningSystem`, or `undefined` if not found.
 *
 * This is the user-facing entry point into the curated tuning data — no need to import
 * named preset constants or iterate `ALL_PRESETS` manually.
 *
 * Available ids: `'12-tet'`, `'just-5-limit'`, `'makam-ussak-example'`,
 * `'slendro-example'`, `'pelog-example'`.
 *
 * @example
 * const makam = getTuningById('makam-ussak-example');
 * if (makam) rankChords(makam, { size: 3 });
 */
export function getTuningById(
  id: string,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): TuningSystem | undefined {
  const preset = presets.find((p) => p.id === id);
  return preset !== undefined ? loadTuningPreset(preset) : undefined;
}

/**
 * Look up a preset by id and return its ranked chords in one call.
 *
 * Socratic Q102: `getTuningById(id)` gives you a `TuningSystem`, and
 * `rankChords(tuning, opts)` scores all size-N subsets — but going from a string
 * preset ID all the way to a ranked chord array still requires two explicit steps
 * (look up, then rank). If presets are truly first-class entry points, discovering
 * the best chords for a named tuning should be one call.
 *
 * Bridges `presetId → getTuningById → rankChords`. Returns `undefined` when the
 * preset id is not found (same semantics as `getTuningById`).
 *
 * Available ids: `'12-tet'`, `'just-5-limit'`, `'makam-ussak-example'`,
 * `'slendro-example'`, `'pelog-example'`.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param opts - Optional `ChordSearchOptions` forwarded to `rankChords`
 *   (size, spectrum, rootHz, periodicityWeight, limit).
 * @param presets - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Ranked chord array (ascending score), or `undefined` if not found.
 *
 * @example
 * const chords = rankChordsFromPreset('just-5-limit', { size: 3 });
 * if (chords) console.log(chords[0]?.cents); // best triad in 5-limit JI
 */
export function rankChordsFromPreset(
  presetId: string,
  opts?: ChordSearchOptions,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): RankedChord[] | undefined {
  const tuning = getTuningById(presetId, presets);
  if (tuning === undefined) return undefined;
  return rankChords(tuning, opts);
}

/**
 * Look up a preset by id and export it as a Scala `.scl` text string in one call.
 *
 * Socratic Q108: `getTuningById(id)` → `tuningToScl(tuning)` → `writeScl(scl)` is
 * a three-step pipeline. If presets are truly first-class entry points, getting the
 * Scala representation of a named tuning should be one call — not a manual chain
 * every caller must write.
 *
 * Returns `undefined` if the preset id is not found (same semantics as
 * `getTuningById`).
 *
 * Available ids: `'12-tet'`, `'just-5-limit'`, `'makam-ussak-example'`,
 * `'slendro-example'`, `'pelog-example'`.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns A `.scl` text string ready to write to disk, or `undefined` if not found.
 *
 * @example
 * const scl = presetToScl('just-5-limit');
 * if (scl) fs.writeFileSync('just5.scl', scl);
 */
export function presetToScl(
  presetId: string,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): string | undefined {
  const tuning = getTuningById(presetId, presets);
  if (tuning === undefined) return undefined;
  return writeScl(tuningToScl(tuning));
}

/**
 * Look up a preset by id and return a diatonic chord progression in one call.
 *
 * Socratic Q126: `getTuningById(id)` gives a `TuningSystem`; `tuningToScale(tuning)`
 * wraps it as a `Scale`; `progressionFromPattern(scale, tuning, pattern)` builds the
 * progression. Going from a preset id to a ready-to-play `Chord[]` still requires
 * three explicit steps. If presets are truly first-class entry points, building a chord
 * progression from a named tuning should be one call.
 *
 * Returns `undefined` if the preset id is not found (same semantics as `getTuningById`).
 * The `spectrum` parameter is accepted for API consistency (reserved for future
 * dissonance-based ranking) but is not used in the current implementation.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param pattern  - Sequence of 0-based root degree indices (e.g. `[0, 3, 4, 0]`
 *                   for I–IV–V–I). Forwarded to `progressionFromPattern`.
 * @param rootHz   - Absolute frequency of the shared root note in Hz (accepted for API
 *                   consistency; not used in the current chord-building pipeline).
 * @param spectrum - Optional instrument spectrum (reserved; not used currently).
 * @param opts     - Optional `size` (notes per chord) and `name` (base chord name),
 *                   forwarded to `progressionFromPattern`.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `Chord[]` with one entry per pattern step, or `undefined` if not found.
 *
 * @example
 * const chords = presetChordProgression('just-5-limit', [0, 3, 4, 0], 261.63);
 * if (chords) chordProgressionToWav(chords, 261.63, harmonicSpectrum());
 */
export function presetChordProgression(
  presetId: string,
  pattern: readonly number[],
  rootHz: number,
  spectrum?: Spectrum,
  opts?: { size?: number; name?: string },
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Chord[] | undefined {
  void rootHz; // accepted for API consistency; pipeline uses tuning.referenceHz
  void spectrum; // reserved for future dissonance-based ranking
  const tuning = getTuningById(presetId, presets);
  if (tuning === undefined) return undefined;
  const scale = tuningToScale(tuning);
  return progressionFromPattern(scale, tuning, pattern, opts?.size, opts?.name);
}

/**
 * Look up a preset by id and export it as a 408-byte MTS bulk tuning dump SysEx
 * message in one call.
 *
 * Socratic Q109: `getTuningById(id)` → `tuningToMts(tuning, name, opts)` is a
 * two-step pipeline. If presets are truly first-class entry points, encoding a named
 * tuning as MTS SysEx should be one call — not a manual sequence every caller writes.
 *
 * Returns `undefined` if the preset id is not found (same semantics as
 * `getTuningById`).
 *
 * Available ids: `'12-tet'`, `'just-5-limit'`, `'makam-ussak-example'`,
 * `'slendro-example'`, `'pelog-example'`.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param name     - Optional tuning name for the SysEx header (defaults to preset id).
 * @param opts     - Optional MTS options (device ID, program, anchor MIDI note, A4 Hz).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns A 408-byte `Uint8Array` ready to send via SysEx, or `undefined` if not found.
 *
 * @example
 * const mts = presetToMts('makam-ussak-example');
 * if (mts) port.send(mts);
 */
export function presetToMts(
  presetId: string,
  name?: string,
  opts?: TuningToMtsOptions,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Uint8Array | undefined {
  const tuning = getTuningById(presetId, presets);
  if (tuning === undefined) return undefined;
  return tuningToMts(tuning, name, opts);
}

/** Options for {@link presetToMtsAndSmf}. */

export interface PresetToMtsAndSmfOptions {
  /** Options forwarded to `tuningToMts` for the MTS export. */
  readonly mtsOpts?: TuningToMtsOptions;
  /** Options forwarded to `progressionToSmf` for the SMF export. */
  readonly smfOpts?: ProgressionToSmfOptions;
}

/**
 * Export a tuning preset as both an MTS bulk dump and an SMF chord progression in one call.
 *
 * Socratic Q143: `presetToMts(presetId)` exports a preset's tuning as MTS SysEx;
 * `presetProgressionSmf` (in smf.ts) exports it as a MIDI chord progression. Getting both
 * outputs simultaneously — e.g. to save the tuning file AND the chord demo in one shot —
 * requires two separate function calls from two different modules. If preset exports are
 * first-class, "give me MTS and SMF for this preset in one call" should be possible.
 *
 * Algorithm:
 * 1. `getTuningById(presetId)` → `TuningSystem | undefined`.
 * 2. If not found, return `undefined`.
 * 3. `tuningToMts(tuning, opts?.mtsOpts)` → MTS `Uint8Array` (408 bytes).
 * 4. `tuningToScale(tuning)` + `progressionFromPattern(scale, tuning, pattern)` → `Chord[]`.
 * 5. `progressionToSmf(chords, rootHz, opts?.smfOpts)` → SMF `Uint8Array`.
 * 6. Return `{ mts, smf }`.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param pattern  - Degree-offset pattern for the chord progression (e.g. `[0, 3, 4, 0]`).
 * @param rootHz   - Root frequency in Hz for SMF pitch mapping.
 * @param opts     - Optional MTS and SMF encoding options.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ mts: Uint8Array; smf: Uint8Array }` — or `undefined` if preset not found.
 *
 * @example
 * const result = presetToMtsAndSmf('just-5-limit', [0, 3, 4, 0], 261.63);
 * if (result) {
 *   port.send(result.mts);
 *   fs.writeFileSync('prog.mid', result.smf);
 * }
 */
export function presetToMtsAndSmf(
  presetId: string,
  pattern: readonly number[],
  rootHz: number,
  opts?: PresetToMtsAndSmfOptions,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): { mts: Uint8Array; smf: Uint8Array } | undefined {
  const tuning = getTuningById(presetId, presets);
  if (tuning === undefined) return undefined;
  const mts = tuningToMts(tuning, undefined, opts?.mtsOpts);
  const scale = tuningToScale(tuning);
  const chords = progressionFromPattern(scale, tuning, pattern);
  const smf = progressionToSmf(chords, rootHz, opts?.smfOpts);
  return { mts, smf };
}

/**
 * Find the closest preset (by tuning distance) to a given `TuningSystem` in one call.
 *
 * Socratic Q149: "If two tunings can be compared by distance, the closest preset to any
 * given tuning should be found in one call — can it?" Today it requires: map all presets
 * through `loadTuningPreset` → `tuningDistance(target, candidate)` for each → `argmin`.
 * If presets are truly first-class, finding the most similar preset to an arbitrary tuning
 * should be one call.
 *
 * Algorithm:
 * 1. Map all `presets` through `loadTuningPreset` to get `TuningSystem[]`.
 * 2. Compute `tuningDistance(tuning, candidate)` for each.
 * 3. Return the preset with minimum distance.
 *
 * @param tuning   - The target `TuningSystem` to compare against.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns The `TuningPreset` with the smallest tuning distance, or `undefined` if `presets` is empty.
 *
 * @example
 * const myTuning = edo(12);
 * const closest = closestPreset(myTuning);
 * // closest is TWELVE_TET — the preset nearest to 12-EDO by interval-vector distance
 *
 * @example
 * // Custom preset pool:
 * const closest = closestPreset(myTuning, [MAKAM_USSAK, SLENDRO_EXAMPLE]);
 */
export function closestPreset(
  tuning: TuningSystem,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): TuningPreset | undefined {
  if (presets.length === 0) return undefined;
  let bestPreset = presets[0] as TuningPreset;
  let bestDist = tuningDistance(tuning, loadTuningPreset(bestPreset));
  for (let i = 1; i < presets.length; i++) {
    const preset = presets[i] as TuningPreset;
    const dist = tuningDistance(tuning, loadTuningPreset(preset));
    if (dist < bestDist) {
      bestDist = dist;
      bestPreset = preset;
    }
  }
  return bestPreset;
}

/**
 * Rank all presets by their tuning distance to a given `TuningSystem`, closest first.
 *
 * Socratic Q168: "If two tunings can be compared by distance, comparing a tuning against
 * ALL presets should return a ranked similarity list in one call — can it?" Today it
 * requires: map all presets → `loadTuningPreset` → `tuningDistance(tuning, candidate)` →
 * sort. If presets are first-class, getting a fully ranked list by distance should be one call.
 *
 * @param tuning  - The target `TuningSystem` to compare against.
 * @param presets - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ preset, distance }` sorted by distance ascending (closest first).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const ranked = rankPresetsByDistance(t12);
 * // ranked[0].preset is the most similar preset to 12-EDO
 */
export function rankPresetsByDistance(
  tuning: TuningSystem,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Array<{ preset: TuningPreset; distance: number }> {
  const entries = presets.map((preset) => ({
    preset,
    distance: tuningDistance(tuning, loadTuningPreset(preset)),
  }));
  return entries.sort((a, b) => a.distance - b.distance);
}

/**
 * Return the closest preset's `TuningSystem` (not the preset struct) to a given tuning in one call.
 *
 * Socratic Q173: "If we have a ranked preset list by distance, extracting just the closest
 * preset's tuning (not the preset struct itself) should be one call — can it?" Today it
 * requires: `rankPresetsByDistance(tuning)` → `result[0].preset` → `loadTuningPreset` — three steps.
 * If the closest match is first-class, getting its resolved `TuningSystem` directly should
 * be one call.
 *
 * @param tuning  - The target `TuningSystem` to compare against.
 * @param presets - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns The resolved `TuningSystem` of the closest preset, or `undefined` if `presets` is empty.
 *
 * @example
 * const myTuning = edo(12);
 * const closest = closestPresetTuning(myTuning);
 * // closest is a TuningSystem matching 12-TET
 */
export function closestPresetTuning(
  tuning: TuningSystem,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): TuningSystem | undefined {
  const ranked = rankPresetsByDistance(tuning, presets);
  const top = ranked[0];
  if (top === undefined) return undefined;
  return loadTuningPreset(top.preset);
}

/**
 * Compute tuning reports for all presets in one call.
 *
 * Socratic Q207: "If we can compute a tuning report, computing reports for ALL presets
 * should be one call — can it?" Today: iterate `ALL_PRESETS` → `loadTuningPreset` →
 * `tuningReport` for each — three manual steps. If preset reports are first-class,
 * computing them all at once should be one call.
 *
 * Algorithm:
 * 1. For each preset: `loadTuningPreset(preset)` → `TuningSystem`.
 * 2. `tuningReport(tuning, rootHz, spectrum)` → `TuningReportType`.
 * 3. Return `Array<{ preset, report }>`.
 *
 * @param rootHz   - Absolute frequency of the root in Hz.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ preset, report }` in the same order as the preset pool.
 *
 * @example
 * const reports = allPresetReports(261.63);
 * // reports[0].preset is TWELVE_TET; reports[0].report contains full analysis
 */
export function allPresetReports(
  rootHz: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Array<{ preset: TuningPreset; report: TuningReportType }> {
  return presets.map((preset) => {
    const tuning = loadTuningPreset(preset);
    const report = tuningReport(tuning, rootHz, spectrum);
    return { preset, report };
  });
}

/**
 * Compare two presets by id, producing a full tuning-report comparison in one call.
 *
 * Socratic Q222: "If we can compare tuning reports, producing a text report comparing two
 * presets by ID should be one call — can it?" Today: `getTuningById(idA)` +
 * `getTuningById(idB)` → `compareTuningReports(tuningA, tuningB, rootHz, spectrum)` —
 * three steps. If presets are first-class, comparing them should be one call.
 *
 * Returns `undefined` if either preset id is not found.
 *
 * @param idA      - Id of the first preset to compare.
 * @param idB      - Id of the second preset to compare.
 * @param rootHz   - Absolute frequency of the root in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ a: TuningPreset, b: TuningPreset, comparison }` or `undefined` if either not found.
 *
 * @example
 * const result = comparePresets('12-tet', 'just-5-limit');
 * if (result) console.log(result.comparison.correlation);
 */
export function comparePresets(
  idA: string,
  idB: string,
  rootHz?: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
):
  | {
      a: TuningPreset;
      b: TuningPreset;
      comparison: ReturnType<typeof compareTuningReports>;
    }
  | undefined {
  const presetA = presets.find((p) => p.id === idA);
  const presetB = presets.find((p) => p.id === idB);
  if (presetA === undefined || presetB === undefined) return undefined;
  const tuningA = loadTuningPreset(presetA);
  const tuningB = loadTuningPreset(presetB);
  const comparison = compareTuningReports(tuningA, tuningB, rootHz ?? 440, spectrum);
  return { a: presetA, b: presetB, comparison };
}
