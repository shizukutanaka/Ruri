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
  bestModeForTuning,
  scaleHarmonicity,
  tuningHarmonicityProfile,
  tuningReport,
  rankModesByStability,
  type Scale,
  type TuningReportType,
} from '../core/scale.js';
import { type Chord } from '../core/chord.js';
import { type Spectrum } from '../core/spectrum.js';
import { tuningToScaleWav, encodeWav, type TuningScaleWavOptions } from '../adapters/wav.js';

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
    citation: 'Bozkurt et al., pitch-histogram analysis of makam performance (SymbTr corpus)',
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

export const ALL_PRESETS: readonly TuningPreset[] = [
  TWELVE_TET,
  JUST_INTONATION_5L,
  MAKAM_USSAK,
  SLENDRO_EXAMPLE,
  PELOG_EXAMPLE,
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
 * Convert a `TuningSystem` to the `Scale` of its closest matching preset in one call.
 *
 * Socratic Q152: "If we can find the closest preset to a tuning, converting that tuning
 * to the closest preset's scale should also be one call — can it?" Today: `closestPreset`
 * → `loadTuningPreset` → `tuningToScale` — three steps. If the preset layer is first-class,
 * mapping any arbitrary tuning to its nearest preset's full scale should be one call.
 *
 * Algorithm:
 * 1. `closestPreset(tuning, presets)` → closest `TuningPreset`.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningToScale(closestTuning)` → `Scale`.
 *
 * @param tuning  - The target `TuningSystem` to match.
 * @param presets - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `Scale` of the closest preset, or `undefined` if `presets` is empty.
 *
 * @example
 * const myTuning = edo(12);
 * const scale = tuningToClosestPresetScale(myTuning);
 * // scale is the full Scale of TWELVE_TET (the closest preset to 12-EDO)
 */
export function tuningToClosestPresetScale(
  tuning: TuningSystem,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningToScale> | undefined {
  const preset = closestPreset(tuning, presets);
  if (preset === undefined) return undefined;
  const closestTuning = loadTuningPreset(preset);
  return tuningToScale(closestTuning);
}

/**
 * Rank all presets by the harmonicity of their best mode, most harmonic first.
 *
 * Socratic Q163: "If we can find the best mode for a tuning, finding the best mode for
 * EVERY preset should be one call that returns a ranked list — can it?" Today: iterate
 * `ALL_PRESETS` → `loadTuningPreset` → `bestModeForTuning` → `scaleHarmonicity` → sort.
 * If presets are truly first-class, ranking them by best-mode harmonicity should be one call.
 *
 * Algorithm:
 * 1. For each preset: `loadTuningPreset(preset)` → `TuningSystem`.
 * 2. `bestModeForTuning(tuning, spectrum)` → best modal `Scale`.
 * 3. `scaleHarmonicity(mode, tuning)` → harmonicity score (lower = more harmonic).
 * 4. Sort by harmonicity ascending (most harmonic = best first).
 *
 * @param spectrum - Optional instrument spectrum for timbre-aware mode ranking.
 *                   When omitted, uses harmonicity only (timbre-independent).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ preset, mode, harmonicity }` sorted by harmonicity ascending.
 *
 * @example
 * const ranked = rankPresetsByBestMode();
 * // ranked[0].preset is the preset whose best mode has the simplest integer ratios
 * const ranked2 = rankPresetsByBestMode(harmonicSpectrum());
 * // ranked2[0] uses timbre-aware mode selection
 */
export function rankPresetsByBestMode(
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Array<{ preset: TuningPreset; mode: Scale; harmonicity: number }> {
  const entries = presets.map((preset) => {
    const tuning = loadTuningPreset(preset);
    const mode = bestModeForTuning(tuning, spectrum);
    const harmonicity = scaleHarmonicity(mode, tuning);
    return { preset, mode, harmonicity };
  });
  return entries.sort((a, b) => a.harmonicity - b.harmonicity);
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
 * Synthesize multiple preset tunings as a single comparative WAV in one call.
 *
 * Socratic Q179: "If we can export individual WAV files, exporting multiple preset tunings
 * as a comparative WAV (each tuning's scale played sequentially) should be one call — can it?"
 * Today: iterate preset ids → `getTuningById` → `tuningToScaleWav` → concatenate → `encodeWav`
 * — five manual steps. If preset tunings are first-class, comparing them as audio should be
 * one call.
 *
 * Algorithm:
 * 1. For each presetId: `getTuningById(id)` → skip if not found (silently).
 * 2. `tuningToScaleWav(tuning, opts)` → decode WAV bytes back to Float32 samples.
 * 3. Concatenate all sample arrays.
 * 4. `encodeWav(combined, sampleRate)` → final WAV bytes.
 *
 * @param presetIds - Array of preset id strings. Unknown ids are skipped silently.
 * @param spectrum  - Unused (accepted for API forward-compatibility).
 * @param opts      - Optional WAV synthesis options forwarded to `tuningToScaleWav`.
 * @returns `Uint8Array` WAV bytes of all found presets concatenated, or `undefined` if none found.
 *
 * @example
 * const wav = presetsComparisonWav(['12-tet', 'just-5-limit', 'slendro-example']);
 * if (wav) await fs.writeFile('comparison.wav', wav);
 */
export function presetsComparisonWav(
  presetIds: readonly string[],
  spectrum?: Spectrum,
  opts?: TuningScaleWavOptions,
): Uint8Array | undefined {
  void spectrum; // accepted for API forward-compatibility
  const sampleRate = opts?.sampleRate ?? 44100;
  const allSamples: Float32Array[] = [];

  for (const id of presetIds) {
    const tuning = getTuningById(id);
    if (tuning === undefined) continue;
    const wav = tuningToScaleWav(tuning, opts);
    // Decode the WAV PCM bytes back to Float32 samples
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    const dataOffset = 44; // standard WAV header size
    const numSamples = (wav.byteLength - dataOffset) / 2;
    const samples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      samples[i] = view.getInt16(dataOffset + i * 2, true) / 32767;
    }
    allSamples.push(samples);
  }

  if (allSamples.length === 0) return undefined;

  const totalLength = allSamples.reduce((sum, s) => sum + s.length, 0);
  const combined = new Float32Array(totalLength);
  let offset = 0;
  for (const samples of allSamples) {
    combined.set(samples, offset);
    offset += samples.length;
  }

  return encodeWav(combined, sampleRate);
}

/**
 * Rank all tuning presets by harmonicity profile variance, most uniform first.
 *
 * Socratic Q181: "If we can compute a harmonicity profile for a tuning, we should be able
 * to rank ALL tuning presets by their harmonicity profile variance (spread) — tighter spread
 * = more uniformly harmonic — can it?" Today: iterate presets → `loadTuningPreset` →
 * `tuningHarmonicityProfile` → compute variance → sort — five manual steps. If presets
 * are first-class, ranking them by profile uniformity should be one call.
 *
 * Algorithm:
 * 1. For each preset: `loadTuningPreset(preset)` → `TuningSystem`.
 * 2. `tuningHarmonicityProfile(tuning)` → `number[]`.
 * 3. Compute variance (mean of squared deviations from the mean).
 * 4. Sort ascending by variance (lowest variance = most uniform = first).
 *
 * @param presets - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ preset, variance }` sorted by variance ascending.
 *
 * @example
 * const ranked = rankPresetsByHarmonicitySpread();
 * // ranked[0].preset is the most uniformly harmonic preset across all its modal rotations
 */
export function rankPresetsByHarmonicitySpread(
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Array<{ preset: TuningPreset; variance: number }> {
  const entries = presets.map((preset) => {
    const tuning = loadTuningPreset(preset);
    const profile = tuningHarmonicityProfile(tuning);
    const mean = profile.reduce((s, v) => s + v, 0) / profile.length;
    const variance =
      profile.length > 0 ? profile.reduce((s, v) => s + (v - mean) ** 2, 0) / profile.length : 0;
    return { preset, variance };
  });
  return entries.sort((a, b) => a.variance - b.variance);
}

/**
 * Find the single preset with the lowest harmonicity profile variance (most consistent modes).
 *
 * Socratic Q194: "If we can rank presets by best-mode harmonicity, we should also be able to
 * find the single preset with the LOWEST mode variance (most consistent modes) in one call —
 * can it?" Today: `rankPresetsByHarmonicitySpread(presets)` → `result[0].preset` — two steps.
 * If the most consistent preset is a meaningful concept, finding it should be one call.
 *
 * Algorithm:
 * 1. `rankPresetsByHarmonicitySpread(presets)` → ranked array, ascending by variance.
 * 2. Return the first entry's preset, or `undefined` if the pool is empty.
 *
 * @param presets - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns The `TuningPreset` whose modes have the most uniform harmonicity, or `undefined` if empty.
 *
 * @example
 * const preset = mostConsistentPreset();
 * // preset is the preset whose modal harmonicity values vary the least
 */
export function mostConsistentPreset(
  presets: readonly TuningPreset[] = ALL_PRESETS,
): TuningPreset | undefined {
  return rankPresetsByHarmonicitySpread(presets)[0]?.preset;
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
 * Find the preset with the globally best (lowest) stability score in one call.
 *
 * Socratic Q208: "If we can find the most consistent preset and the most stable modes,
 * finding the preset with the globally BEST stability score should be one call — can it?"
 * Today: iterate presets → `loadTuningPreset` → `rankModesByStability` → take best score →
 * argmin — four manual steps. If preset stability is first-class, finding the best-scoring
 * preset should be one call.
 *
 * Algorithm:
 * 1. For each preset: `loadTuningPreset(preset)` → `TuningSystem`.
 * 2. `rankModesByStability(tuning, rootHz)` → ranked modes, best first.
 * 3. Take `result[0].score` as the preset's best stability score.
 * 4. Return the preset with the lowest best-mode score.
 *
 * @param rootHz   - Absolute frequency of the root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ preset, score }` for the preset with the lowest best-mode stability score,
 *          or `undefined` if the preset pool is empty.
 *
 * @example
 * const best = bestStabilityPreset(261.63);
 * if (best) console.log(best.preset.name, best.score);
 */
export function bestStabilityPreset(
  rootHz: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): { preset: TuningPreset; score: number } | undefined {
  if (presets.length === 0) return undefined;
  let bestEntry: { preset: TuningPreset; score: number } | undefined;
  for (const preset of presets) {
    const tuning = loadTuningPreset(preset);
    const ranked = rankModesByStability(tuning, rootHz, spectrum);
    const topScore = ranked[0]?.score;
    if (topScore === undefined) continue;
    if (bestEntry === undefined || topScore < bestEntry.score) {
      bestEntry = { preset, score: topScore };
    }
  }
  return bestEntry;
}
