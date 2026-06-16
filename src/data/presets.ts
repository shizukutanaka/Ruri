/** Curated tuning presets. Each is ONE documented example with provenance — never "the" tuning. */

import { type TuningSystem, tuningDistance } from '../core/tuning.js';
import { rankChords, type RankedChord, type ChordSearchOptions } from '../core/chord-search.js';
import { type TuningPreset, loadTuningPreset } from './tuning-data.js';
import { tuningToScl, writeScl, scaleFullSclBundle } from '../adapters/scala.js';
import { tuningToMts, type TuningToMtsOptions } from '../adapters/mts.js';
import {
  progressionToSmf,
  type ProgressionToSmfOptions,
  type SmfOptions,
} from '../adapters/smf.js';
import {
  tuningToScale,
  progressionFromPattern,
  bestModeForTuning,
  scaleHarmonicity,
  tuningHarmonicityProfile,
  tuningReport,
  rankModesByStability,
  singleBestChord,
  tuningReportSimilarity,
  compareTuningReports,
  progressionNarrative,
  scaleSimilarityMatrix,
  modeIntervalSets,
  scaleToChordMap,
  chordMapVolatility,
  tuningSpectralFit,
  tuningFamilyReport,
  tuningProgressionVariety,
  chordMapConsistencyScore,
  chordMapEntropyScore,
  tuningEntropyProfile,
  tuningConsistencyEntropyDelta,
  tuningModeComparison,
  tuningModeRankingBundle,
  tuningFullAnalysis,
  tuningModeNarratives,
  tuningModeFullBundle,
  tuningModeProgressionBundles,
  tuningFamilyFullBundle,
  scaleModeSpectralRankings,
  tuningModeChordMapBundles,
  tuningBestModeChordMapNarrative,
  tuningModeNarrativeCompare,
  tuningModeBestProgressionNarratives,
  tuningBestSmoothMode,
  tuningModeConsistencyEntropyProfiles,
  tuningModeDissonanceHistograms,
  tuningModeDualHistograms,
  tuningModeHistogramSummaries,
  tuningModeAnalysisFull,
  tuningHarmonicSpectralScore,
  tuningComprehensiveReport,
  scaleSimilarityRanking,
  tuningModeIntervalProfile,
  tuningMostDiverseMode,
  tuningModeComprehensiveBundle,
  tuningBestModeComprehensive,
  tuningModeScoreRanking,
  tuningIntervalDiversityVsEntropy,
  tuningModeParetoFront,
  tuningModeCorrelationMatrix,
  type Scale,
  type ScaleChordMapEntry,
  type TuningReportType,
  type ChordMapAnalysisEntry,
  type TuningFamilyReport,
} from '../core/scale.js';
import { type Chord } from '../core/chord.js';
import { type Spectrum, harmonicSpectrum } from '../core/spectrum.js';
import {
  tuningToScaleWav,
  encodeWav,
  type TuningScaleWavOptions,
  chordProgressionToWav,
  type ChordProgressionToWavOptions,
  tuningEntropyBestModeWav,
  tuningBestModeProgressionBundle,
  tuningFullWavBundle,
  scaleProgressionWavBundle,
  tuningBestSmoothModeWav,
  type PluckScaleWavOptions,
  tuningModeProgressionWavBundles,
} from '../adapters/wav.js';
import { tuningToFullBundle } from '../adapters/tun.js';
import { DEFAULT_KS } from '../core/ks-synth.js';

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
 * Check whether a preset ranks in the top-N by best-mode harmonicity in one call.
 *
 * Socratic Q218: "If we have a preset harmonicity league, checking if a preset is in the
 * TOP-N of that league should be one call — can it?" Today: `presetHarmonicityLeague` →
 * `slice(0, n)` → `some(e => e.preset.id === id)` — three steps. If the league is
 * first-class, a top-N membership check should be one call.
 *
 * @param presetId - Id of the preset to check.
 * @param n        - Number of top entries to consider.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `true` if `presetId` appears in the top-`n` entries of the harmonicity league.
 *
 * @example
 * const inTop2 = isPresetTopN('just-5-limit', 2);
 */
export function isPresetTopN(
  presetId: string,
  n: number,
  rootHz?: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): boolean {
  const league = presetHarmonicityLeague(rootHz, spectrum, presets);
  return league.slice(0, n).some((e) => e.preset.id === presetId);
}

/**
 * Find the best chord for a preset tuning in one call.
 *
 * Socratic Q219: "If we can find the single best chord in a chord map, finding the best
 * chord FROM A PRESET should also be one call — can it?" Today: `getTuningById(presetId)`
 * → `tuningToScale(tuning)` → `singleBestChord(scale, tuning, spectrum)` — three steps.
 * If presets are first-class, the best chord should be one call.
 *
 * Returns `undefined` if the preset is not found.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `ChordMapAnalysisEntry` for the best chord, or `undefined` if not found.
 *
 * @example
 * const best = presetBestChord('just-5-limit');
 * if (best) console.log(best.dissonance);
 */
export function presetBestChord(
  presetId: string,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ChordMapAnalysisEntry | undefined {
  const tuning = getTuningById(presetId, presets);
  if (tuning === undefined) return undefined;
  const scale = tuningToScale(tuning);
  return singleBestChord(scale, tuning, spectrum);
}

/**
 * Rank all presets by their tuning-report similarity to a given report, most similar first.
 *
 * Socratic Q220: "If we can compare two tuning reports, comparing a tuning report against ALL
 * presets' reports should produce a ranked similarity list in one call — can it?" Today:
 * `allPresetReports(rootHz, spectrum, presets)` → for each: `tuningReportSimilarity(report, entry.report)`
 * → sort — three manual steps. If report comparison is first-class, ranking should be one call.
 *
 * @param report   - The reference `TuningReportType` to compare against.
 * @param rootHz   - Root frequency in Hz for generating preset reports (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ preset, similarity }` sorted descending (most similar first).
 *
 * @example
 * const report = tuningReport(myTuning, 440);
 * const ranked = rankPresetsByReportSimilarity(report);
 * // ranked[0].preset is the most similar preset
 */
export function rankPresetsByReportSimilarity(
  report: TuningReportType,
  rootHz?: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Array<{ preset: TuningPreset; similarity: number }> {
  return allPresetReports(rootHz ?? 440, spectrum, presets)
    .map((entry) => ({
      preset: entry.preset,
      similarity: tuningReportSimilarity(report, entry.report),
    }))
    .sort((a, b) => b.similarity - a.similarity);
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

/**
 * Find the preset whose best mode has the minimum (most harmonic) harmonicity score in one call.
 *
 * Socratic Q210: "If we can get all preset reports, finding the preset with the most harmonic
 * best mode should be one call — can it?" Today: `allPresetReports` → argmin on
 * `report.bestMode.harmonicity` — two steps. If preset harmonicity is first-class,
 * finding the most harmonic preset should be one call.
 *
 * @param rootHz   - Absolute frequency of the root in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ preset, harmonicity }` for the preset with the lowest best-mode harmonicity,
 *          or `undefined` if the preset pool is empty.
 *
 * @example
 * const result = mostHarmonicPreset();
 * // result.preset is the preset whose best mode has the lowest harmonicity score
 */
export function mostHarmonicPreset(
  rootHz?: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): { preset: TuningPreset; harmonicity: number } | undefined {
  const reports = allPresetReports(rootHz ?? 440, spectrum, presets);
  if (reports.length === 0) return undefined;
  let best = reports[0] as (typeof reports)[0];
  for (let i = 1; i < reports.length; i++) {
    const entry = reports[i] as (typeof reports)[0];
    if (entry.report.bestMode.harmonicity < best.report.bestMode.harmonicity) {
      best = entry;
    }
  }
  return { preset: best.preset, harmonicity: best.report.bestMode.harmonicity };
}

/**
 * Produce a league table (ranking) of ALL presets by best-mode harmonicity in one call.
 *
 * Socratic Q211: "If we can compare tuning reports, producing a league table (ranking) of
 * ALL presets by best-mode harmonicity should be one call — can it?" Today:
 * `allPresetReports` → sort by `report.bestMode.harmonicity` — two steps.
 * If preset rankings are first-class, getting the full ordered table should be one call.
 *
 * @param rootHz   - Absolute frequency of the root in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ preset, harmonicity }` sorted by harmonicity ascending (most harmonic first).
 *
 * @example
 * const league = presetHarmonicityLeague();
 * // league[0].preset is the most harmonic preset
 */
export function presetHarmonicityLeague(
  rootHz?: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): Array<{ preset: TuningPreset; harmonicity: number }> {
  return allPresetReports(rootHz ?? 440, spectrum, presets)
    .map((entry) => ({ preset: entry.preset, harmonicity: entry.report.bestMode.harmonicity }))
    .sort((a, b) => a.harmonicity - b.harmonicity);
}

/**
 * Synthesize ALL presets' best-mode progressions as a single concatenated WAV demo track.
 *
 * Socratic Q212: "If we can synthesize scale progressions as WAV, synthesizing ALL presets'
 * best-mode progressions as a single concatenated WAV 'demo track' should be one call — can it?"
 * Today: iterate ALL_PRESETS → `loadTuningPreset` → `bestModeForTuning` →
 * `progressionFromPattern` → `chordProgressionToWav` → decode PCM → concatenate → `encodeWav`
 * — many manual steps. If preset audio is first-class, a full demo track should be one call.
 *
 * Algorithm:
 * 1. For each preset: `loadTuningPreset` → `bestModeForTuning` → `progressionFromPattern` →
 *    `chordProgressionToWav` → decode WAV PCM to Float32 samples.
 * 2. Concatenate all Float32 sample arrays.
 * 3. `encodeWav(combined, sampleRate)` → final WAV bytes.
 *
 * @param pattern  - Sequence of 0-based root degree indices (e.g. `[0, 2, 4, 0]` for I–III–V–I).
 * @param rootHz   - Absolute frequency of the chord root in Hz.
 * @param spectrum - Optional instrument spectrum. Defaults to `harmonicSpectrum()`.
 * @param opts     - Optional chord progression WAV options.
 * @returns `Uint8Array` WAV bytes of all presets' best-mode progressions concatenated.
 *
 * @throws {RangeError} if `presets` is empty.
 *
 * @example
 * const wav = allPresetsDemoWav([0, 2, 4, 0], 261.63);
 * await fs.writeFile('demo.wav', wav);
 */
export function allPresetsDemoWav(
  pattern: readonly number[],
  rootHz: number,
  spectrum?: Spectrum,
  opts?: ChordProgressionToWavOptions,
): Uint8Array {
  if (ALL_PRESETS.length === 0) throw new RangeError('allPresetsDemoWav: no presets available');
  const sampleRate = opts?.sampleRate ?? DEFAULT_KS.sampleRate;
  const allSamples: Float32Array[] = [];

  for (const preset of ALL_PRESETS) {
    const tuning = loadTuningPreset(preset);
    const mode = bestModeForTuning(tuning, spectrum);
    const chords = progressionFromPattern(mode, tuning, pattern);
    const wav = chordProgressionToWav(chords, rootHz, spectrum ?? harmonicSpectrum(), opts);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    const dataOffset = 44;
    const numSamples = (wav.byteLength - dataOffset) / 2;
    const samples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      samples[i] = view.getInt16(dataOffset + i * 2, true) / 32767;
    }
    allSamples.push(samples);
  }

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

/**
 * Compare two presets and return only the winner's id in one call.
 *
 * Socratic Q229: "If comparePresets tells me which is better, can I get just the winner
 * ID in one call?" → No → implement.
 *
 * Uses harmonicity as the primary metric; falls back to stability (mode count) when tied.
 *
 * @param idA      - Id of the first preset to compare.
 * @param idB      - Id of the second preset to compare.
 * @param rootHz   - Absolute frequency of the root in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ winnerId, loserId, metric, delta }`.
 *
 * @throws {RangeError} if either preset id is not found.
 *
 * @example
 * const result = betterPreset('12-tet', 'just-5-limit', 261.63);
 * // result.winnerId is 'just-5-limit' (better harmonicity)
 */
export function betterPreset(
  idA: string,
  idB: string,
  rootHz?: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): { winnerId: string; loserId: string; metric: 'harmonicity' | 'stability'; delta: number } {
  const result = comparePresets(idA, idB, rootHz, spectrum, presets);
  if (result === undefined) {
    throw new RangeError(`betterPreset: one or both preset ids not found: '${idA}', '${idB}'`);
  }

  // Primary metric: harmonicity (lower = more harmonic / better)
  const harmonicityA = result.comparison.a.bestMode.harmonicity;
  const harmonicityB = result.comparison.b.bestMode.harmonicity;
  const harmonicityDelta = Math.abs(harmonicityA - harmonicityB);
  const harmonicityTol = 1e-9;

  if (harmonicityDelta > harmonicityTol) {
    const winnerId = harmonicityA < harmonicityB ? idA : idB;
    const loserId = winnerId === idA ? idB : idA;
    return { winnerId, loserId, metric: 'harmonicity', delta: harmonicityDelta };
  }

  // Fallback: stability (fewer modes in top rank = more stable; use mode degree count as proxy)
  const stabilityA = result.comparison.a.degreeCount;
  const stabilityB = result.comparison.b.degreeCount;
  const stabilityDelta = Math.abs(stabilityA - stabilityB);

  if (stabilityDelta > 0) {
    // Lower degree count is treated as "more stable" (simpler structure)
    const winnerId = stabilityA < stabilityB ? idA : idB;
    const loserId = winnerId === idA ? idB : idA;
    return { winnerId, loserId, metric: 'stability', delta: stabilityDelta };
  }

  // Still tied: return idA as arbitrary winner
  return { winnerId: idA, loserId: idB, metric: 'harmonicity', delta: 0 };
}

/**
 * Go from a preset id to a human-readable progression narrative in one call.
 *
 * Socratic Q232: "If I can get a preset progression and get a progression narrative,
 * can I go preset→narrative in one call?" → No → implement.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param pattern  - Sequence of 0-based root degree indices (e.g. `[0, 2, 4, 0]`).
 * @param rootHz   - Absolute frequency of the shared root note in Hz.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns A descriptive narrative string for the progression.
 *
 * @example
 * const text = presetProgressionNarrative('12-tet', [0, 2, 4, 0], 261.63);
 * // "Progression of 4 chords; energy shape: ..."
 */
export function presetProgressionNarrative(
  presetId: string,
  pattern: number[],
  rootHz: number,
  spectrum?: Spectrum,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): string {
  const chords = presetChordProgression(presetId, pattern, rootHz, spectrum, undefined, presets);
  if (chords === undefined || chords.length === 0) {
    return `No progression for preset ${presetId}.`;
  }
  return progressionNarrative(chords, rootHz, spectrum);
}

/**
 * Compute the inter-preset similarity matrix for all presets in one call.
 *
 * Socratic Q246: "If I can compute a similarity matrix for arbitrary tunings and have a
 * list of all presets, can I get the inter-preset similarity matrix in one call?" → No → implement.
 *
 * The matrix `M[i][j]` equals `tuningHarmonicityCorrelation(tunings[i], tunings[j])` via
 * `scaleSimilarityMatrix`. The diagonal `M[i][i]` is always 1.0.
 *
 * @param presets - Optional preset pool (defaults to `ALL_PRESETS`).
 * @param tol     - Stolzenburg tolerance forwarded to the underlying correlation. Default 0.0136.
 * @returns `{ ids: string[], matrix: number[][] }` — ids in the same order as presets, square matrix.
 *
 * @example
 * const { ids, matrix } = allPresetsSimilarityMatrix();
 * // matrix[0][1] is the correlation between ids[0] and ids[1]
 */
export function allPresetsSimilarityMatrix(
  presets?: readonly TuningPreset[],
  tol?: number,
): { ids: string[]; matrix: number[][] } {
  const ps = presets ?? ALL_PRESETS;
  const tunings = ps.map((p) => loadTuningPreset(p));
  const matrix = scaleSimilarityMatrix(tunings, undefined, tol);
  return { ids: ps.map((p) => p.id), matrix };
}

/**
 * Export a preset as WAV + SMF + SCL + TUN + MTS + full tuning report in one call.
 *
 * Socratic Q248: "If a preset is first-class, I should be able to get WAV+SMF+SCL+TUN+MTS+report
 * in one call — can it?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningToFullBundle(tuning, rootHz, spectrum)` → `{ wav, smf, scl, tun, mts }`.
 * 4. `tuningReport(tuning, rootHz ?? tuning.referenceHz, spectrum)` → `TuningReportType`.
 * 5. Return all six fields combined.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param rootHz   - Root frequency in Hz for WAV and report generation. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ wav, smf, scl, tun, mts, report }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundle = presetFullBundle('12-tet');
 * fs.writeFileSync('12tet.wav', bundle.wav);
 * console.log(bundle.report.bestMode.harmonicity);
 */
export function presetFullBundle(
  presetId: string,
  rootHz?: number,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): {
  wav: Uint8Array;
  smf: Uint8Array;
  scl: string;
  tun: string;
  mts: Uint8Array;
  report: TuningReportType;
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetFullBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  const { wav, smf, scl, tun, mts } = tuningToFullBundle(tuning, rootHz, spectrum);
  const report = tuningReport(tuning, rootHz ?? tuning.referenceHz, spectrum);
  return { wav, smf, scl, tun, mts, report };
}

/**
 * Return the top-N presets sorted by best-mode harmonicity, each with their full report.
 *
 * Socratic Q251: "If I can get all preset reports and rank them by stability, can I get the
 * top-N presets with their full reports in one call?" → No → implement.
 *
 * Sorts all presets by `report.bestMode.harmonicity` ascending (most harmonic first) and
 * returns the first `n` entries. If `n` exceeds the number of presets, all presets are returned.
 *
 * @param n        - Number of top entries to return (must be > 0).
 * @param rootHz   - Root frequency in Hz for report generation. Defaults to 440.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ presetId, report }` sorted by harmonicity ascending (most harmonic first).
 *
 * @throws {RangeError} if `n` <= 0.
 *
 * @example
 * const top2 = topPresetsByStabilityReport(2, 261.63);
 * // top2[0].report.bestMode.harmonicity is the lowest (most harmonic)
 */
export function topPresetsByStabilityReport(
  n: number,
  rootHz?: number,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): { presetId: string; report: TuningReportType }[] {
  if (n <= 0) throw new RangeError('topPresetsByStabilityReport: n must be positive');
  const reports = allPresetReports(rootHz ?? 440, spectrum, presets ?? ALL_PRESETS);
  const sorted = reports
    .map((entry) => ({ presetId: entry.preset.id, report: entry.report }))
    .sort((a, b) => a.report.bestMode.harmonicity - b.report.bestMode.harmonicity);
  return sorted.slice(0, n);
}

/**
 * Rank all presets by their full bundle sizes and tuning reports in one call.
 *
 * Socratic Q253: "If I can get a full bundle for one preset and rank presets by harmonicity,
 * can I get the ranked list with full bundles in one call?" → No → implement.
 *
 * To keep tests fast, bundle size is estimated as the total byte length of WAV + SMF + MTS
 * byte arrays from `presetFullBundle`. Sorted ascending by `report.bestMode.harmonicity`
 * (most harmonic first).
 *
 * @param rootHz   - Root frequency in Hz for report generation. Defaults to 440.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ presetId, report, bundleSize }` sorted by harmonicity ascending.
 *
 * @example
 * const ranked = rankPresetsByFullBundle(261.63);
 * // ranked[0].presetId is the most harmonic preset with its full bundle info
 */
export function rankPresetsByFullBundle(
  rootHz?: number,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): { presetId: string; report: TuningReportType; bundleSize: number }[] {
  const ps = presets ?? ALL_PRESETS;
  const entries = ps.map((p) => {
    const bundle = presetFullBundle(p.id, rootHz, spectrum, ps);
    const bundleSize = bundle.wav.length + bundle.smf.length + bundle.mts.length;
    return { presetId: p.id, report: bundle.report, bundleSize };
  });
  return entries.sort((a, b) => a.report.bestMode.harmonicity - b.report.bestMode.harmonicity);
}

/**
 * Find which preset tuning best matches a given spectrum's harmonic structure in one call.
 *
 * Socratic Q257: "If timbre determines consonance, and I have a spectrum, can I find which
 * preset tuning best matches that spectrum's harmonic structure in one call?" → No → implement.
 *
 * For each preset, computes `tuningReport` with the given spectrum and returns the preset
 * whose best mode has the minimum harmonicity score (lowest = most harmonic / best match).
 *
 * @param spectrum - Instrument spectrum whose harmonic structure to match.
 * @param rootHz   - Root frequency in Hz for report generation. Defaults to `tuning.referenceHz`.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ presetId, harmonicity }` for the most spectrum-compatible preset.
 *
 * @throws {RangeError} if the preset pool is empty.
 *
 * @example
 * const { presetId } = bestPresetForSpectrum(harmonicSpectrum());
 * // presetId is the tuning whose best mode is most harmonic for a harmonic spectrum
 */
export function bestPresetForSpectrum(
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { presetId: string; harmonicity: number } {
  const ps = presets ?? ALL_PRESETS;
  if (ps.length === 0) throw new RangeError('bestPresetForSpectrum: no presets');
  const entries = ps.map((p) => {
    const tuning = loadTuningPreset(p);
    const report = tuningReport(tuning, rootHz ?? tuning.referenceHz, spectrum);
    return { presetId: p.id, harmonicity: report.bestMode.harmonicity };
  });
  let best = entries[0] as (typeof entries)[0];
  for (let i = 1; i < entries.length; i++) {
    const e = entries[i] as (typeof entries)[0];
    if (e.harmonicity < best.harmonicity) best = e;
  }
  return { presetId: best.presetId, harmonicity: best.harmonicity };
}

/**
 * Return all modal interval sets for a preset tuning in one call.
 *
 * Socratic Q258: "If I can get modeIntervalSets for a Scale and convert a preset to a tuning
 * and scale, can I get all modal interval sets for a preset in one call?" → No → implement.
 *
 * Algorithm:
 * 1. Find the preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningToScale(tuning)` → full `Scale`.
 * 4. `modeIntervalSets(scale, tuning)` → one entry per modal rotation.
 *
 * @param presetId - Id string of a curated tuning preset.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode: Scale; intervalCents: number[] }`, one per modal rotation.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const sets = presetModeIntervalSets('12-tet');
 * // sets.length === 12; sets[0].intervalCents.reduce((a, b) => a + b, 0) ≈ 1200
 */
export function presetModeIntervalSets(
  presetId: string,
  presets?: readonly TuningPreset[],
): { mode: Scale; intervalCents: number[] }[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeIntervalSets: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  const scale = tuningToScale(tuning);
  return modeIntervalSets(scale, tuning);
}

/**
 * Rank all presets by chord map volatility (coefficient of variation of dissonance), ascending.
 *
 * Socratic Q262: "If I can compute a chord map volatility for one scale and have all presets,
 * can I rank all presets by chord map volatility in one call?" → No → implement.
 *
 * Algorithm:
 * 1. For each preset: `loadTuningPreset(preset)` → `TuningSystem`.
 * 2. `tuningToScale(tuning)` → full `Scale`.
 * 3. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 4. `chordMapVolatility(chordMap, spectrum, rootHz)` → volatility score.
 * 5. Sort ascending by volatility.
 *
 * @param spectrum - Optional instrument spectrum for dissonance computation. Defaults to
 *                   `harmonicSpectrum()`.
 * @param rootHz   - Reference frequency for chord realization (default 440 Hz).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ presetId, volatility }` sorted ascending by volatility.
 *
 * @example
 * const ranked = presetVolatilityRanking();
 * // ranked[0].presetId is the preset with the most uniform chord dissonance
 */
export function presetVolatilityRanking(
  spectrum?: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): { presetId: string; volatility: number }[] {
  const ps = presets ?? ALL_PRESETS;
  const entries = ps.map((p) => {
    const tuning = loadTuningPreset(p);
    const scale = tuningToScale(tuning);
    const chordMap = scaleToChordMap(scale, tuning);
    const volatility = chordMapVolatility(chordMap, spectrum, rootHz);
    return { presetId: p.id, volatility };
  });
  return entries.sort((a, b) => a.volatility - b.volatility);
}

/**
 * Rank all presets by spectral fit (amplitude-weighted mean harmonicity), ascending.
 *
 * Socratic Q266: "If I can get a tuning's spectral fit for a given spectrum and have all
 * presets, can I rank presets by spectral fit in one call?" → No → implement.
 *
 * Algorithm:
 * 1. For each preset: `loadTuningPreset(p)` → `TuningSystem`.
 * 2. `tuningSpectralFit(tuning, spectrum, tol)` → scalar fit score.
 * 3. Sort ascending by `spectralFit`.
 *
 * @param spectrum - The instrument spectrum to weight harmonicity against.
 * @param tol      - Continued-fraction tolerance for harmonicity. Default 0.0136.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ presetId, spectralFit }` sorted ascending by spectral fit.
 *
 * @example
 * const ranked = presetSpectralFitRanking(harmonicSpectrum());
 * // ranked[0].presetId is the preset whose harmonic structure best matches the spectrum
 */
export function presetSpectralFitRanking(
  spectrum: Spectrum,
  tol?: number,
  presets?: readonly TuningPreset[],
): { presetId: string; spectralFit: number }[] {
  const ps = presets ?? ALL_PRESETS;
  const entries = ps.map((p) => {
    const tuning = loadTuningPreset(p);
    const spectralFit = tuningSpectralFit(tuning, spectrum, tol);
    return { presetId: p.id, spectralFit };
  });
  return entries.sort((a, b) => a.spectralFit - b.spectralFit);
}

// ---------------------------------------------------------------------------
// Q275 — presetFamilyReport
// ---------------------------------------------------------------------------

/**
 * Comprehensive family report for a set of presets — individual tuning reports,
 * similarity matrix, most/least similar pair, and mean similarity in one call.
 *
 * Socratic Q275: "If I can get a tuning family report for arbitrary tunings and convert
 * presets to tunings, can I get a family report for any set of presets in one call?"
 * → No → implement.
 *
 * Algorithm:
 * 1. Resolve each preset id to a `TuningSystem` via `loadTuningPreset`.
 * 2. `tuningFamilyReport(tunings, rootHz, spectrum)`.
 *
 * @param presetIds - Array of preset id strings to include in the family report.
 * @param rootHz    - Root frequency for individual reports.
 * @param spectrum  - Optional instrument spectrum.
 * @param presets   - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `TuningFamilyReport` for the given preset family.
 *
 * @throws {RangeError} if any preset id is not found in the pool.
 *
 * @example
 * const report = presetFamilyReport(['12-tet', 'just-5']);
 * // report.ids === ['12-tet', 'just-5']; report.meanSimilarity ∈ [-1, 1]
 */
export { type TuningFamilyReport };

export function presetFamilyReport(
  presetIds: readonly string[],
  rootHz?: number,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): TuningFamilyReport {
  const pool = presets ?? ALL_PRESETS;
  const tunings = presetIds.map((id) => {
    const p = pool.find((pr) => pr.id === id);
    if (p === undefined) {
      throw new RangeError('presetFamilyReport: preset not found: ' + id);
    }
    return loadTuningPreset(p);
  });
  return tuningFamilyReport(tunings, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q280 — presetProgressionVariety
// ---------------------------------------------------------------------------

/**
 * Harmonic variety score for a named tuning preset in one call.
 *
 * Socratic Q280: "If I can get progression variety for a tuning and convert a preset to a
 * tuning, can I get progression variety for a preset in one call?" → No → implement.
 *
 * Algorithm:
 * 1. Resolve `presetId` to a `TuningPreset` from the preset pool (throw if not found).
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningProgressionVariety(tuning)` → variety ratio.
 *
 * @param presetId - ID of a named tuning preset (e.g. `'12-tet'`).
 * @param presets  - Optional preset pool override (defaults to `ALL_PRESETS`).
 * @returns Variety ratio ∈ (0, 1] — proportion of distinct modal interval patterns.
 *
 * @throws {RangeError} if no preset with `presetId` is found.
 *
 * @example
 * const v = presetProgressionVariety('12-tet');
 * // v is the fraction of 12-TET's modal rotations that are harmonically distinct
 */
export function presetProgressionVariety(
  presetId: string,
  presets?: readonly TuningPreset[],
): number {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetProgressionVariety: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningProgressionVariety(tuning);
}

// ---------------------------------------------------------------------------
// Q285 — bestPresetConsistency
// ---------------------------------------------------------------------------

/**
 * Find the most consistent preset (highest chord-map consistency score) in one call.
 *
 * Socratic Q285: "If I can rank presets by volatility and compute consistency for a chord map,
 * can I find the most consistent preset in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `ps = presets ?? ALL_PRESETS`; throw `RangeError` if empty.
 * 2. For each preset: `loadTuningPreset(p)` → `TuningSystem`.
 * 3. `tuningToScale(tuning)` + `scaleToChordMap(scale, tuning)` → chord map.
 * 4. `chordMapConsistencyScore(chordMap, spectrum, rootHz)` → consistency score.
 * 5. Return `{ presetId, consistency }` for the maximum score.
 *
 * @param spectrum - Optional instrument spectrum for consistency computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ presetId: string; consistency: number }` for the most consistent preset.
 *
 * @throws {RangeError} if the preset pool is empty.
 *
 * @example
 * const { presetId, consistency } = bestPresetConsistency();
 * // presetId is the preset whose chord map has the most uniform harmonic character
 */
export function bestPresetConsistency(
  spectrum?: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): { presetId: string; consistency: number } {
  const ps = presets ?? ALL_PRESETS;
  if (ps.length === 0) throw new RangeError('bestPresetConsistency: no presets');
  let bestId = (ps[0] as TuningPreset).id;
  let bestScore = -Infinity;
  for (const p of ps) {
    const tuning = loadTuningPreset(p);
    const scale = tuningToScale(tuning);
    const chordMap = scaleToChordMap(scale, tuning);
    const consistency = chordMapConsistencyScore(chordMap, spectrum, rootHz);
    if (consistency > bestScore) {
      bestScore = consistency;
      bestId = p.id;
    }
  }
  return { presetId: bestId, consistency: bestScore };
}

// ---------------------------------------------------------------------------
// Q290 — topPresetsByEntropy
// ---------------------------------------------------------------------------

/**
 * Rank tuning presets by chord map entropy (most harmonically diverse first) in one call.
 *
 * Socratic Q290: "If I can compute chord map entropy for one scale and have all presets,
 * can I rank presets by chord map entropy in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `if (n <= 0) throw new RangeError(...)`.
 * 2. `const ps = presets ?? ALL_PRESETS`.
 * 3. For each preset: `loadTuningPreset` → `tuningToScale` → `scaleToChordMap` → `chordMapEntropyScore`.
 * 4. Sort DESCENDING by entropy (most diverse first).
 * 5. Return first `n`.
 *
 * @param n        - Number of top entries to return (must be > 0).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ presetId, entropy }` sorted descending by entropy.
 *
 * @throws {RangeError} if `n` <= 0.
 *
 * @example
 * const top2 = topPresetsByEntropy(2, undefined, 261.63);
 * // top2[0].presetId is the preset with the most diverse chord dissonance distribution
 */
export function topPresetsByEntropy(
  n: number,
  spectrum?: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): { presetId: string; entropy: number }[] {
  if (n <= 0) throw new RangeError('topPresetsByEntropy: n must be positive');
  const ps = presets ?? ALL_PRESETS;
  const entries = ps.map((p) => {
    const tuning = loadTuningPreset(p);
    const scale = tuningToScale(tuning);
    const chordMap = scaleToChordMap(scale, tuning);
    const entropy = chordMapEntropyScore(chordMap, spectrum, rootHz);
    return { presetId: p.id, entropy };
  });
  entries.sort((a, b) => b.entropy - a.entropy);
  return entries.slice(0, n);
}

// ---------------------------------------------------------------------------
// Q293 — presetEntropyLeague
// ---------------------------------------------------------------------------

/**
 * Categorize all presets as high/medium/low entropy in one call.
 *
 * Socratic Q293: "If I can rank presets by entropy, can I categorize them as
 * high/medium/low entropy in one call?" → No → implement.
 *
 * Algorithm:
 * 1. Compute entropy for every preset (same algorithm as `topPresetsByEntropy`).
 * 2. Sort descending by entropy.
 * 3. `const third = Math.ceil(n / 3)`.
 * 4. Top third → `high`, middle third → `medium`, bottom third → `low`.
 *
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ high, medium, low }` — arrays of preset ids.
 *
 * @example
 * const { high, medium, low } = presetEntropyLeague();
 * // high contains the presets with the most diverse chord dissonance distributions
 */
export function presetEntropyLeague(
  spectrum?: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): { high: string[]; medium: string[]; low: string[] } {
  const ps = presets ?? ALL_PRESETS;
  const entries = ps.map((p) => {
    const tuning = loadTuningPreset(p);
    const scale = tuningToScale(tuning);
    const chordMap = scaleToChordMap(scale, tuning);
    const entropy = chordMapEntropyScore(chordMap, spectrum, rootHz);
    return { presetId: p.id, entropy };
  });
  entries.sort((a, b) => b.entropy - a.entropy);
  const n = ps.length;
  const third = Math.ceil(n / 3);
  const high = entries.slice(0, third).map((r) => r.presetId);
  const medium = entries.slice(third, 2 * third).map((r) => r.presetId);
  const low = entries.slice(2 * third).map((r) => r.presetId);
  return { high, medium, low };
}

// ---------------------------------------------------------------------------
// Q296 — presetEntropyProfile
// ---------------------------------------------------------------------------

/**
 * Compute chord-map entropy for every mode of a preset tuning.
 *
 * Socratic Q296: "If I can get entropy profile for a tuning, can I get it
 * for a preset by id in one call?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningEntropyProfile(tuning, spectrum, rootHz)` → `{mode, entropy}[]`.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{mode, entropy}` — one entry per modal rotation.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const profile = presetEntropyProfile('12-tet');
 * // profile.length === 12; profile[0].entropy >= 0
 */
export function presetEntropyProfile(
  presetId: string,
  spectrum?: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): { mode: Scale; entropy: number }[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetEntropyProfile: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningEntropyProfile(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q299 — presetBestEntropyModeWav
// ---------------------------------------------------------------------------

/**
 * Render the highest-entropy mode of a preset tuning to WAV.
 *
 * Socratic Q299: "If I can get best-entropy WAV for a tuning, can I do it
 * for a preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningEntropyBestModeWav(tuning, rootHz, spectrum, opts)` → `{wav, entropy, mode}`.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param spectrum - Optional instrument spectrum for mode selection.
 * @param opts     - Optional synthesis options.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ wav: Uint8Array, entropy: number, mode: Scale }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const { wav, entropy, mode } = presetBestEntropyModeWav('12-tet');
 * await fs.writeFile('best-entropy-mode.wav', wav);
 * console.log(`Entropy: ${entropy}, Mode: ${mode.id}`);
 */
export function presetBestEntropyModeWav(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  opts?: TuningScaleWavOptions,
  presets?: readonly TuningPreset[],
): { wav: Uint8Array; entropy: number; mode: Scale } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestEntropyModeWav: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningEntropyBestModeWav(tuning, rootHz, spectrum, opts);
}

// ---------------------------------------------------------------------------
// Q301 — presetConsistencyEntropyDelta
// ---------------------------------------------------------------------------

/**
 * Measure how much consistency and entropy rankings disagree for a preset tuning's modes.
 *
 * Socratic Q301: "If I can compare consistency vs entropy for a tuning, can I do it
 * for a preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningConsistencyEntropyDelta(tuning, spectrum, rootHz)` → scalar divergence.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Optional instrument spectrum for computation.
 * @param rootHz   - Root frequency in Hz.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Mean absolute difference in [0, 1] between normalized consistency and entropy rankings.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const delta = presetConsistencyEntropyDelta('12-tet');
 * // delta ∈ [0, 1]; 0 means profiles agree perfectly
 */
export function presetConsistencyEntropyDelta(
  presetId: string,
  spectrum?: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): number {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetConsistencyEntropyDelta: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningConsistencyEntropyDelta(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q311 — presetModeComparison
// ---------------------------------------------------------------------------

/**
 * Compare all mode metrics (entropy, consistency, volatility) for each mode of a preset tuning.
 *
 * Socratic Q311: "If I can compare all mode metrics for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeComparison(tuning, spectrum, rootHz)` → `{mode, entropy, consistency, volatility}[]`.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode, entropy, consistency, volatility }` in allModes order.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const cmp = presetModeComparison('12-tet');
 * // cmp.length === 12; each entry has entropy, consistency, volatility >= 0
 */
export function presetModeComparison(
  presetId: string,
  spectrum?: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { mode: Scale; entropy: number; consistency: number; volatility: number }[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeComparison: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeComparison(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q316 — presetModeRankingBundle
// ---------------------------------------------------------------------------

/**
 * Rank all modal rotations of a preset tuning by entropy, consistency, and volatility in one call.
 *
 * Socratic Q316: "If I can get mode ranking bundle for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeRankingBundle(tuning, spectrum, rootHz)` → `{byEntropy, byConsistency, byVolatility}`.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ byEntropy, byConsistency, byVolatility }` — three sorted `Scale[]` arrays.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const { byEntropy, byConsistency, byVolatility } = presetModeRankingBundle('12-tet');
 * // byEntropy[0] is the highest-entropy mode of 12-TET
 */
export function presetModeRankingBundle(
  presetId: string,
  spectrum?: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { byEntropy: Scale[]; byConsistency: Scale[]; byVolatility: Scale[] } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeRankingBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeRankingBundle(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q321 — presetFullAnalysis
// ---------------------------------------------------------------------------

/**
 * Get all high-level tuning summary metrics for a preset in one call.
 *
 * Socratic Q321: "If I can do full analysis for a tuning, can I do it for a preset by id?"
 * → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningFullAnalysis(tuning, rootHz, spectrum)` → full analysis object.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ reportCard, tripleMode, consistencyEntropyDelta, harmonicDensity }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const analysis = presetFullAnalysis('12-tet');
 * console.log(analysis.reportCard);
 * console.log(analysis.tripleMode.allAgree);
 */
export function presetFullAnalysis(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningFullAnalysis> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetFullAnalysis: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningFullAnalysis(tuning, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q319 — presetBestModeProgressionBundle
// ---------------------------------------------------------------------------

/**
 * Get the best mode's chord progression bundle (WAV + SMF + narrative) for a preset in one call.
 *
 * Socratic Q319: "If I can get best mode progression bundle for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningBestModeProgressionBundle(tuning, metric, rootHz, spectrum)` → full bundle.
 *
 * @param presetId - Id of the preset to look up.
 * @param metric   - Which metric to select the best mode by.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation and synthesis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ mode, chords, smoothnessRatio, wav, smf, narrative }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundle = presetBestModeProgressionBundle('12-tet', 'entropy');
 * await fs.writeFile('best-mode-prog.wav', bundle.wav);
 * console.log(bundle.narrative);
 */
export function presetBestModeProgressionBundle(
  presetId: string,
  metric: 'entropy' | 'consistency' | 'volatility',
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningBestModeProgressionBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestModeProgressionBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningBestModeProgressionBundle(tuning, metric, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q326 — presetModeNarratives
// ---------------------------------------------------------------------------

/**
 * Get a narrative string for every mode of a preset tuning in one call.
 *
 * Socratic Q326: "If I can get mode narratives for a tuning, can I get them for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeNarratives(tuning, rootHz, spectrum)` → `{ mode, narrative }[]`.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode, narrative }` in allModes order.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const narratives = presetModeNarratives('12-tet');
 * for (const { mode, narrative } of narratives) {
 *   console.log(mode.id, narrative);
 * }
 */
export function presetModeNarratives(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeNarratives> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeNarratives: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeNarratives(tuning, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q328 — presetFullWavBundle
// ---------------------------------------------------------------------------

/**
 * Get the full WAV bundle (report card + best mode WAVs by all three metrics) for a preset in one call.
 *
 * Socratic Q328: "If I can get full WAV bundle for a tuning, can I do it for a preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningFullWavBundle(tuning, rootHz, spectrum, opts)` → full bundle.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation and synthesis.
 * @param opts     - Optional Karplus-Strong synthesis options.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ reportCardBundle, bestEntropyBundle, bestConsistencyWav, bestVolatilityWav }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundle = presetFullWavBundle('12-tet');
 * await fs.writeFile('report.wav', bundle.reportCardBundle.wav);
 * await fs.writeFile('entropy.wav', bundle.bestEntropyBundle.wav);
 */
export function presetFullWavBundle(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  opts?: Parameters<typeof tuningFullWavBundle>[3],
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningFullWavBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetFullWavBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningFullWavBundle(tuning, rootHz, spectrum, opts);
}

// ---------------------------------------------------------------------------
// Q332 — presetModeFullBundle
// ---------------------------------------------------------------------------

/**
 * Get entropy, consistency, volatility, narrative, and chord-map summary for every mode of a
 * preset tuning in one call.
 *
 * Socratic Q332: "If I can get the full mode bundle for a tuning, can I do it for a preset by id?"
 * → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeFullBundle(tuning, rootHz, spectrum)` → per-mode bundle array.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation and synthesis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode, entropy, consistency, volatility, narrative, summary }` in allModes order.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundle = presetModeFullBundle('12-tet');
 * console.log(bundle[0]!.narrative, bundle[0]!.summary.count);
 */
export function presetModeFullBundle(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeFullBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeFullBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeFullBundle(tuning, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q335 — presetFamilyAnalysis
// ---------------------------------------------------------------------------

/**
 * Get a full analysis for each preset in a list of preset ids in one call.
 *
 * Socratic Q335: "If I can do full analysis for one preset by id, can I do it for a list of
 * preset ids?" → No → implement.
 *
 * Algorithm:
 * 1. For each id: find preset in pool; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningFullAnalysis(tuning, rootHz, spectrum)` → full analysis object.
 * 4. Return `{id, fullAnalysis}`.
 *
 * @param presetIds - Array of preset ids to analyse.
 * @param rootHz    - Root frequency in Hz (default 440).
 * @param spectrum  - Optional instrument spectrum for timbre-aware analysis.
 * @param presets   - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ id, fullAnalysis }`, one per preset id, in input order.
 *
 * @throws {RangeError} if any preset id is not found.
 *
 * @example
 * const result = presetFamilyAnalysis(['12-tet', '19-edo']);
 * console.log(result[0]!.id, result[0]!.fullAnalysis.reportCard);
 */
export function presetFamilyAnalysis(
  presetIds: string[],
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): { id: string; fullAnalysis: ReturnType<typeof tuningFullAnalysis> }[] {
  const pool = presets ?? ALL_PRESETS;
  return presetIds.map((id) => {
    const preset = pool.find((p) => p.id === id);
    if (preset === undefined) {
      throw new RangeError('presetFamilyAnalysis: preset not found: ' + id);
    }
    const tuning = loadTuningPreset(preset);
    return { id, fullAnalysis: tuningFullAnalysis(tuning, rootHz, spectrum) };
  });
}

// ---------------------------------------------------------------------------
// Q338 — presetModeProgressionBundles
// ---------------------------------------------------------------------------

/**
 * Get the chord progression bundle for every mode of a preset tuning in one call.
 *
 * Socratic Q338: "If I can get all mode progression bundles for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeProgressionBundles(tuning, rootHz, spectrum)` → per-mode bundles.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode, chords, smoothnessRatio }` in allModes order.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundles = presetModeProgressionBundles('12-tet');
 * for (const { mode, chords, smoothnessRatio } of bundles) {
 *   console.log(mode.id, chords.length, smoothnessRatio);
 * }
 */
export function presetModeProgressionBundles(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeProgressionBundles> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeProgressionBundles: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeProgressionBundles(tuning, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q341 — presetFamilyModeRankings
// ---------------------------------------------------------------------------

/**
 * Get mode rankings by all three metrics for each preset in a list of preset ids in one call.
 *
 * Socratic Q341: "If I can get mode rankings for a family of TuningSystems, can I do it for
 * a list of preset ids?" → No → implement.
 *
 * Algorithm:
 * 1. For each id: find preset in pool; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeRankingBundle(tuning, spectrum, rootHz)` → `{byEntropy, byConsistency, byVolatility}`.
 * 4. Return `{id, rankings}`.
 *
 * @param presetIds - Array of preset ids to rank.
 * @param rootHz    - Root frequency in Hz (default 440).
 * @param spectrum  - Optional instrument spectrum for dissonance computation.
 * @param presets   - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ id, rankings }` where `rankings` has `byEntropy`, `byConsistency`, `byVolatility`.
 *
 * @throws {RangeError} if any preset id is not found.
 *
 * @example
 * const result = presetFamilyModeRankings(['12-tet', 'just-5-limit']);
 * console.log(result[0]!.id, result[0]!.rankings.byEntropy[0]!.id);
 */
export function presetFamilyModeRankings(
  presetIds: string[],
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): {
  id: string;
  rankings: { byEntropy: Scale[]; byConsistency: Scale[]; byVolatility: Scale[] };
}[] {
  const pool = presets ?? ALL_PRESETS;
  return presetIds.map((id) => {
    const preset = pool.find((p) => p.id === id);
    if (preset === undefined) {
      throw new RangeError('presetFamilyModeRankings: preset not found: ' + id);
    }
    const tuning = loadTuningPreset(preset);
    return { id, rankings: tuningModeRankingBundle(tuning, spectrum, rootHz) };
  });
}

// ---------------------------------------------------------------------------
// Q344 — presetFamilyFullBundle
// ---------------------------------------------------------------------------

/**
 * Get full analysis and mode full bundle for each preset in a list of preset ids in one call.
 *
 * Socratic Q344: "If I can get family full bundle for TuningSystems, can I do it for preset ids?"
 * → No → implement.
 *
 * Algorithm:
 * 1. For each id: find preset in pool; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningFullAnalysis(tuning, rootHz, spectrum)` → full analysis.
 * 4. `tuningModeFullBundle(tuning, rootHz, spectrum)` → per-mode bundle array.
 * 5. Return `{id, fullAnalysis, modeFullBundle}`.
 *
 * @param presetIds - Array of preset ids to analyse.
 * @param rootHz    - Root frequency in Hz (default 440).
 * @param spectrum  - Optional instrument spectrum for timbre-aware analysis.
 * @param presets   - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ id, fullAnalysis, modeFullBundle }`, one per preset id, in input order.
 *
 * @throws {RangeError} if any preset id is not found.
 *
 * @example
 * const result = presetFamilyFullBundle(['12-tet', '19-edo']);
 * console.log(result[0]!.fullAnalysis.reportCard);
 * console.log(result[0]!.modeFullBundle[0]!.narrative);
 */
export function presetFamilyFullBundle(
  presetIds: string[],
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningFamilyFullBundle> {
  const pool = presets ?? ALL_PRESETS;
  return presetIds.map((id) => {
    const preset = pool.find((p) => p.id === id);
    if (preset === undefined) {
      throw new RangeError('presetFamilyFullBundle: preset not found: ' + id);
    }
    const tuning = loadTuningPreset(preset);
    return {
      id,
      fullAnalysis: tuningFullAnalysis(tuning, rootHz, spectrum),
      modeFullBundle: tuningModeFullBundle(tuning, rootHz, spectrum),
    };
  });
}

// ---------------------------------------------------------------------------
// Q347 — presetScaleModeSpectralRankings
// ---------------------------------------------------------------------------

/**
 * Get spectral ranking and normalized scores for a preset's default scale in one call.
 *
 * Socratic Q347: "If I can get spectral ranking bundle for a scale, can I do it for a preset's
 * default scale?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningToScale(tuning)` → default `Scale`.
 * 4. `scaleModeSpectralRankings(scale, tuning, spectrum, rootHz)` → `{spectralRanking, normalizedScores}`.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ spectralRanking, normalizedScores }` for the preset's default scale.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const { spectralRanking, normalizedScores } = presetScaleModeSpectralRankings('12-tet', harmonicSpectrum());
 * console.log(spectralRanking[0]!.chord.name, normalizedScores[0]!.normalizedDissonance);
 */
export function presetScaleModeSpectralRankings(
  presetId: string,
  spectrum: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): {
  spectralRanking: ScaleChordMapEntry[];
  normalizedScores: {
    entry: ScaleChordMapEntry;
    normalizedDissonance: number;
    normalizedHarmonicity: number;
  }[];
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetScaleModeSpectralRankings: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  const scale = tuningToScale(tuning);
  return scaleModeSpectralRankings(scale, tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q349 — presetModeChordMapBundles
// ---------------------------------------------------------------------------

/**
 * Get a full chord map bundle for every mode of a preset tuning in one call.
 *
 * Socratic Q349: "If I can get chord map bundles for all modes of a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeChordMapBundles(tuning, spectrum, rootHz)` → per-mode bundles.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode, chordMapBundle }` in allModes order.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundles = presetModeChordMapBundles('12-tet', harmonicSpectrum());
 * for (const { mode, chordMapBundle } of bundles) {
 *   console.log(mode.id, chordMapBundle.volatilityBundle.volatility);
 * }
 */
export function presetModeChordMapBundles(
  presetId: string,
  spectrum: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeChordMapBundles> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeChordMapBundles: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeChordMapBundles(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q353 — presetBestModeChordMapNarrative
// ---------------------------------------------------------------------------

/**
 * Get the best mode chord map narrative bundle for a preset by id in one call.
 *
 * Socratic Q353: "If I can get best mode chord map narrative for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningBestModeChordMapNarrative(tuning, metric, rootHz, spectrum)` → bundle.
 *
 * @param presetId - Id of the preset to look up.
 * @param metric   - Ranking metric: `'entropy'` | `'consistency'` | `'volatility'`.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ mode, narrative, volatility, entropy, consistency, smoothnessRatio }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const result = presetBestModeChordMapNarrative('12-tet', 'entropy');
 * console.log(result.mode.id, result.narrative);
 */
export function presetBestModeChordMapNarrative(
  presetId: string,
  metric: 'entropy' | 'consistency' | 'volatility',
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningBestModeChordMapNarrative> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestModeChordMapNarrative: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningBestModeChordMapNarrative(tuning, metric, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q355 — presetModeNarrativeCompare
// ---------------------------------------------------------------------------

/**
 * Compare the best mode chord map narrative for all three metrics for a preset in one call.
 *
 * Socratic Q355: "If I can compare best mode narratives for a tuning, can I do it for a preset
 * by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeNarrativeCompare(tuning, rootHz, spectrum)` → comparison bundle.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ bestEntropy, bestConsistency, bestVolatility, allSameMode }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const cmp = presetModeNarrativeCompare('12-tet');
 * console.log(cmp.allSameMode, cmp.bestEntropy.mode.id);
 */
export function presetModeNarrativeCompare(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeNarrativeCompare> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeNarrativeCompare: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeNarrativeCompare(tuning, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q359 — presetModeBestProgressionNarratives
// ---------------------------------------------------------------------------

/**
 * Get the smoothed best progression narrative for every mode of a preset tuning in one call.
 *
 * Socratic Q359: "If I can get best progression narratives for all modes of a tuning, can I do
 * it for a preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeBestProgressionNarratives(tuning, rootHz, spectrum)` → per-mode results.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode, narrative, smoothnessRatio }` in allModes order.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const results = presetModeBestProgressionNarratives('12-tet');
 * for (const { mode, narrative, smoothnessRatio } of results) {
 *   console.log(mode.id, smoothnessRatio, narrative);
 * }
 */
export function presetModeBestProgressionNarratives(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeBestProgressionNarratives> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeBestProgressionNarratives: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeBestProgressionNarratives(tuning, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q362 — presetBestSmoothMode
// ---------------------------------------------------------------------------

/**
 * Find the mode with the highest progression smoothness ratio for a preset tuning in one call.
 *
 * Socratic Q362: "If I can find the smoothest mode for a tuning, can I do it for a preset by
 * id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningBestSmoothMode(tuning, rootHz, spectrum)` → `{ mode, smoothnessRatio }`.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ mode, smoothnessRatio }` for the smoothest mode.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const result = presetBestSmoothMode('12-tet');
 * console.log(result.mode.id, result.smoothnessRatio);
 */
export function presetBestSmoothMode(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningBestSmoothMode> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestSmoothMode: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningBestSmoothMode(tuning, rootHz, spectrum);
}

// ---------------------------------------------------------------------------
// Q367 — presetProgressionWavBundle
// ---------------------------------------------------------------------------

/**
 * Get a smoothed chord progression WAV, SMF, narrative, smoothness ratio, and chords
 * for a preset's default scale in one call.
 *
 * Socratic Q367: "If I can get progression WAV bundle for a scale, can I do it for a
 * preset's default scale?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningToScale(tuning)` → default scale.
 * 4. `scaleProgressionWavBundle(scale, tuning, rootHz, spectrum, wavOpts, smfOpts)` → bundle.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation and synthesis.
 * @param wavOpts  - Optional chord progression WAV options.
 * @param smfOpts  - Optional SMF encoding options.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ wav, smf, narrative, smoothnessRatio, chords }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundle = presetProgressionWavBundle('12-tet');
 * await fs.writeFile('12tet-prog.wav', bundle.wav);
 * await fs.writeFile('12tet-prog.mid', bundle.smf);
 * console.log(bundle.narrative, bundle.smoothnessRatio);
 */
export function presetProgressionWavBundle(
  presetId: string,
  rootHz?: number,
  spectrum?: Spectrum,
  wavOpts?: ChordProgressionToWavOptions,
  smfOpts?: SmfOptions,
  presets?: readonly TuningPreset[],
): ReturnType<typeof scaleProgressionWavBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetProgressionWavBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  const scale = tuningToScale(tuning);
  return scaleProgressionWavBundle(scale, tuning, rootHz, spectrum, wavOpts, smfOpts);
}

// ---------------------------------------------------------------------------
// Q369 — presetBestSmoothModeWav
// ---------------------------------------------------------------------------

/**
 * Find the smoothest mode for a preset tuning and render it to WAV in one call.
 *
 * Socratic Q369: "If I can get smoothest mode WAV for a tuning, can I do it for a preset
 * by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningBestSmoothModeWav(tuning, rootHz, spectrum, opts)` → `{ wav, mode, smoothnessRatio }`.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for smoothness computation.
 * @param opts     - Optional Karplus-Strong synthesis options.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ wav: Uint8Array, mode: Scale, smoothnessRatio: number }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const result = presetBestSmoothModeWav('12-tet');
 * await fs.writeFile('12tet-smooth.wav', result.wav);
 * console.log(result.mode.id, result.smoothnessRatio);
 */
export function presetBestSmoothModeWav(
  presetId: string,
  rootHz = 440,
  spectrum?: Spectrum,
  opts?: PluckScaleWavOptions,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningBestSmoothModeWav> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestSmoothModeWav: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningBestSmoothModeWav(tuning, rootHz, spectrum, opts);
}

// ---------------------------------------------------------------------------
// Q373 — presetModeProgressionWavBundles
// ---------------------------------------------------------------------------

/**
 * Get progression WAV bundles for every mode of a preset tuning in one call.
 *
 * Socratic Q373: "If I can get WAV bundles for every mode of a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeProgressionWavBundles(tuning, rootHz, spectrum, wavOpts, smfOpts)` → bundles.
 *
 * @param presetId - Id of the preset to look up.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param spectrum - Optional instrument spectrum for dissonance computation and synthesis.
 * @param wavOpts  - Optional chord progression WAV options.
 * @param smfOpts  - Optional SMF encoding options.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{ mode, wav, smf, narrative, smoothnessRatio }`, one per mode.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const bundles = presetModeProgressionWavBundles('12-tet');
 * for (const { mode, wav, smf, narrative, smoothnessRatio } of bundles) {
 *   await fs.writeFile(`${mode.id}-prog.wav`, wav);
 *   console.log(mode.id, smoothnessRatio, narrative);
 * }
 */
export function presetModeProgressionWavBundles(
  presetId: string,
  rootHz?: number,
  spectrum?: Spectrum,
  wavOpts?: ChordProgressionToWavOptions,
  smfOpts?: SmfOptions,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeProgressionWavBundles> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeProgressionWavBundles: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeProgressionWavBundles(tuning, rootHz, spectrum, wavOpts, smfOpts);
}

// ---------------------------------------------------------------------------
// Q376 — presetFullSclBundle
// ---------------------------------------------------------------------------

/**
 * Get all SCL-adjacent scale analysis for a preset's default scale in one call.
 *
 * Socratic Q376: "If I can get full SCL bundle for a scale, can I do it for a preset's
 * default scale?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningToScale(tuning)` → default scale.
 * 4. `scaleFullSclBundle(scale, tuning, spectrum, rootHz, name)` → bundle.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param name     - Optional description for the `.scl` header. Defaults to scale name.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{ scl, rankedBundle, volatilityBundle, progressionSclBundle }`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const { scl, rankedBundle, volatilityBundle, progressionSclBundle } =
 *   presetFullSclBundle('12-tet', harmonicSpectrum());
 * fs.writeFileSync('12tet.scl', scl);
 * console.log(rankedBundle.entropy, volatilityBundle.volatility, progressionSclBundle.smoothnessRatio);
 */
export function presetFullSclBundle(
  presetId: string,
  spectrum: Spectrum,
  rootHz = 440,
  name?: string,
  presets?: readonly TuningPreset[],
): ReturnType<typeof scaleFullSclBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetFullSclBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  const scale = tuningToScale(tuning);
  return scaleFullSclBundle(scale, tuning, spectrum, rootHz, name);
}

// ---------------------------------------------------------------------------
// Q379 — presetModeConsistencyEntropyProfiles
// ---------------------------------------------------------------------------

/**
 * Get per-mode entropy, consistency, and their normalized delta for a preset tuning in one call.
 *
 * Socratic Q379: "If I can get per-mode consistency-entropy profiles for a tuning, can I do it
 * for a preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeConsistencyEntropyProfiles(tuning, spectrum, rootHz)` → profiles.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Optional instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{mode, entropy, consistency, delta}`, one per mode.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const profiles = presetModeConsistencyEntropyProfiles('12-tet');
 * for (const { mode, entropy, consistency, delta } of profiles) {
 *   console.log(mode.id, entropy, consistency, delta);
 * }
 */
export function presetModeConsistencyEntropyProfiles(
  presetId: string,
  spectrum?: Spectrum,
  rootHz = 440,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeConsistencyEntropyProfiles> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeConsistencyEntropyProfiles: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeConsistencyEntropyProfiles(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q383 — presetModeDissonanceHistograms
// ---------------------------------------------------------------------------

/**
 * Get dissonance histograms for all modes of a preset tuning in one call.
 *
 * Socratic Q383: "If I can get dissonance histograms for all modes of a tuning, can I do it
 * for a preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeDissonanceHistograms(tuning, bins)` → per-mode histograms.
 *
 * @param presetId - Id of the preset to look up.
 * @param bins     - Number of histogram bins (default 10).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{mode, histogram}`, one per mode.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const hists = presetModeDissonanceHistograms('12-tet');
 * for (const { mode, histogram } of hists) {
 *   console.log(mode.id, histogram);
 * }
 */
export function presetModeDissonanceHistograms(
  presetId: string,
  bins = 10,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeDissonanceHistograms> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeDissonanceHistograms: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeDissonanceHistograms(tuning, bins);
}

// ---------------------------------------------------------------------------
// Q388 — presetModeDualHistograms
// ---------------------------------------------------------------------------

/**
 * Get dual dissonance+harmonicity histograms for all modes of a preset tuning in one call.
 *
 * Socratic Q388: "If I can get dual histograms for all modes of a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeDualHistograms(tuning, bins)` → per-mode dual histograms.
 *
 * @param presetId - Id of the preset to look up.
 * @param bins     - Number of histogram bins (default 10).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{mode, dissonance, harmonicity}`, one per mode.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const hists = presetModeDualHistograms('12-tet');
 * for (const { mode, dissonance, harmonicity } of hists) {
 *   console.log(mode.id, dissonance, harmonicity);
 * }
 */
export function presetModeDualHistograms(
  presetId: string,
  bins = 10,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeDualHistograms> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeDualHistograms: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeDualHistograms(tuning, bins);
}

// ---------------------------------------------------------------------------
// Q392 — presetModeHistogramSummaries
// ---------------------------------------------------------------------------

/**
 * Get histogram summaries for all modes of a preset tuning in one call.
 *
 * Socratic Q392: "If I can get histogram summaries for all modes of a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeHistogramSummaries(tuning, bins)` → per-mode histogram summaries.
 *
 * @param presetId - Id of the preset to look up.
 * @param bins     - Number of histogram bins (default 10).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{mode, histogramSummary}`, one per mode.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const summaries = presetModeHistogramSummaries('12-tet');
 * for (const { mode, histogramSummary } of summaries) {
 *   console.log(mode.id, histogramSummary.peakDissonanceBin, histogramSummary.dissonanceSpread);
 * }
 */
export function presetModeHistogramSummaries(
  presetId: string,
  bins = 10,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeHistogramSummaries> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeHistogramSummaries: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeHistogramSummaries(tuning, bins);
}

// ---------------------------------------------------------------------------
// Q397 — presetModeAnalysisFull
// ---------------------------------------------------------------------------

/**
 * Get full chord map analysis for all modes of a preset tuning in one call.
 *
 * Socratic Q397: "If I can get full mode analysis for a tuning, can I do it for a preset by
 * id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningModeAnalysisFull(tuning, spectrum, rootHz)` → per-mode full analysis.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{mode, analysisFull}`, one per mode.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum();
 * const result = presetModeAnalysisFull('12-tet', spec);
 * for (const { mode, analysisFull } of result) {
 *   console.log(mode.id, analysisFull.rankedBundle.entropy);
 * }
 */
export function presetModeAnalysisFull(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningModeAnalysisFull> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeAnalysisFull: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeAnalysisFull(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q400 — presetHarmonicSpectralScore
// ---------------------------------------------------------------------------

/**
 * Compute harmonic-spectral score for a preset tuning in one call.
 *
 * Socratic Q400: "If I can compute harmonic spectral score for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningHarmonicSpectralScore(tuning, spectrum, rootHz, tol)` → combined score.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param tol      - Tolerance for harmonicity proximity (optional).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{harmonicDensity, spectralFit, combinedScore}`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const score = presetHarmonicSpectralScore('12-tet', spec);
 * console.log(score.harmonicDensity, score.spectralFit, score.combinedScore);
 */
export function presetHarmonicSpectralScore(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  tol?: number,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningHarmonicSpectralScore> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetHarmonicSpectralScore: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  if (rootHz !== undefined) {
    return tol !== undefined
      ? tuningHarmonicSpectralScore(tuning, spectrum, rootHz, tol)
      : tuningHarmonicSpectralScore(tuning, spectrum, rootHz);
  }
  return tuningHarmonicSpectralScore(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q403 — presetComprehensiveReport
// ---------------------------------------------------------------------------

/**
 * Combine full analysis, harmonic-spectral score, stability score, and progression variety
 * for a preset tuning in a single call.
 *
 * Socratic Q403: "If I can get comprehensive report for a tuning, can I do it for a preset by
 * id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. `loadTuningPreset(preset)` → `TuningSystem`.
 * 3. `tuningComprehensiveReport(tuning, spectrum, rootHz)` → report.
 *
 * @param presetId - Id of the preset to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis (required).
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{fullAnalysis, harmonicSpectralScore, stabilityScore, progressionVariety}`.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const report = presetComprehensiveReport('12-tet', spec);
 * console.log(report.stabilityScore, report.progressionVariety);
 */
export function presetComprehensiveReport(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): ReturnType<typeof tuningComprehensiveReport> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetComprehensiveReport: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningComprehensiveReport(tuning, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q406 — presetSimilarityRanking
// ---------------------------------------------------------------------------

/**
 * Rank all presets by similarity to a target preset in one call.
 *
 * Socratic Q406: "If I can rank tunings by similarity to a target, can I do it for presets by
 * id?" → No → implement.
 *
 * Algorithm:
 * 1. Find target preset by id; throw `RangeError` if not found.
 * 2. Load target tuning and all other tunings.
 * 3. `scaleSimilarityRanking(otherTunings, targetTuning, tol)` → ranked by similarity.
 * 4. Map back to preset ids.
 *
 * @param targetPresetId - Id of the preset to compare against.
 * @param tol            - Tolerance for similarity computation (optional).
 * @param presets        - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Array of `{presetId, similarity}` sorted descending by similarity.
 *
 * @throws {RangeError} if the target preset id is not found.
 *
 * @example
 * const ranking = presetSimilarityRanking('12-tet');
 * console.log(ranking[0]!.presetId, ranking[0]!.similarity);
 */
export function presetSimilarityRanking(
  targetPresetId: string,
  tol?: number,
  presets?: readonly TuningPreset[],
): { presetId: string; similarity: number }[] {
  const pool = presets ?? ALL_PRESETS;
  const targetPreset = pool.find((p) => p.id === targetPresetId);
  if (targetPreset === undefined) {
    throw new RangeError('presetSimilarityRanking: preset not found: ' + targetPresetId);
  }
  const targetTuning = loadTuningPreset(targetPreset);
  const otherPairs = pool
    .filter((p) => p.id !== targetPresetId)
    .map((p) => ({ preset: p, tuning: loadTuningPreset(p) }));
  const ranking = scaleSimilarityRanking(
    otherPairs.map((x) => x.tuning),
    targetTuning,
    ...(tol !== undefined ? ([tol] as [number]) : ([] as [])),
  );
  return ranking.map((r) => ({
    presetId: otherPairs.find((x) => x.tuning.id === r.tuning.id)?.preset.id ?? r.tuning.id,
    similarity: r.similarity,
  }));
}

// ---------------------------------------------------------------------------
// Q409 — presetModeIntervalProfile
// ---------------------------------------------------------------------------

/**
 * Compute interval diversity metrics for every modal rotation of a preset tuning in one call.
 *
 * Socratic Q409: "If I can get interval profile for all modes of a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningModeIntervalProfile(tuning)` → per-mode interval profiles.
 *
 * @param presetId - Id of the preset to profile.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns One entry per modal rotation with interval count, unique intervals, and diversity ratio.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const profiles = presetModeIntervalProfile('12-tet');
 * profiles.forEach(({ mode, diversity }) => console.log(mode.id, diversity));
 */
export function presetModeIntervalProfile(
  presetId: string,
  presets?: readonly TuningPreset[],
): {
  mode: Scale;
  intervals: number[];
  intervalCount: number;
  uniqueIntervals: number[];
  diversity: number;
}[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeIntervalProfile: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningModeIntervalProfile(tuning);
}

// ---------------------------------------------------------------------------
// Q412 — presetMostDiverseMode
// ---------------------------------------------------------------------------

/**
 * Find the modal rotation with the highest interval diversity for a preset tuning in one call.
 *
 * Socratic Q412: "If I can find the most diverse mode for a tuning, can I do it for a preset by
 * id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningMostDiverseMode(tuning)` → most interval-diverse modal rotation.
 *
 * @param presetId - Id of the preset to search.
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{mode, diversity}` for the most interval-diverse modal rotation.
 *
 * @throws {RangeError} if the preset id is not found.
 * @throws {RangeError} if the preset tuning has no modes.
 *
 * @example
 * const { mode, diversity } = presetMostDiverseMode('12-tet');
 * console.log(mode.id, diversity);
 */
export function presetMostDiverseMode(
  presetId: string,
  presets?: readonly TuningPreset[],
): { mode: Scale; diversity: number } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetMostDiverseMode: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return tuningMostDiverseMode(tuning);
}

// ---------------------------------------------------------------------------
// Q415 — presetModeComprehensiveBundle
// ---------------------------------------------------------------------------

/**
 * Combine entropy, consistency, volatility, interval diversity, and smoothness ratio per mode
 * for a preset tuning in a single call.
 *
 * Socratic Q415: "If I can get comprehensive mode bundle for a tuning, can I do it for a preset
 * by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningModeComprehensiveBundle(tuning, spectrum, rootHz)` → per-mode five-metric bundles.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns One entry per modal rotation with all five metrics.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const bundle = presetModeComprehensiveBundle('12-tet', spec);
 * bundle.forEach(({ mode, entropy, diversity }) => console.log(mode.id, entropy, diversity));
 */
export function presetModeComprehensiveBundle(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
}[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeComprehensiveBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeComprehensiveBundle(tuning, spectrum, rootHz)
    : tuningModeComprehensiveBundle(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q418 — presetBestModeComprehensive
// ---------------------------------------------------------------------------

/**
 * Find the single best mode of a preset tuning by a combined score of five metrics in one call.
 *
 * Socratic Q418: "If I can find the best comprehensive mode for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningBestModeComprehensive(tuning, spectrum, rootHz)` → best mode with score.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns The best-mode entry extended with a `score` field.
 *
 * @throws {RangeError} if the preset id is not found.
 * @throws {RangeError} if the preset tuning has no modes.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const result = presetBestModeComprehensive('12-tet', spec);
 * console.log(result.mode.id, result.score);
 */
export function presetBestModeComprehensive(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
  score: number;
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestModeComprehensive: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningBestModeComprehensive(tuning, spectrum, rootHz)
    : tuningBestModeComprehensive(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q421 — presetModeScoreRanking
// ---------------------------------------------------------------------------

/**
 * Rank all modal rotations of a preset tuning by comprehensive five-metric score in one call.
 *
 * Socratic Q421: "If I can rank modes by score for a tuning, can I do it for a preset by id?"
 * → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningModeScoreRanking(tuning, spectrum, rootHz)` → modes ranked by score descending.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns All modal rotations sorted by combined score descending.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const ranking = presetModeScoreRanking('12-tet', spec);
 * ranking.forEach(({ mode, score }) => console.log(mode.id, score));
 */
export function presetModeScoreRanking(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { mode: Scale; score: number }[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeScoreRanking: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeScoreRanking(tuning, spectrum, rootHz)
    : tuningModeScoreRanking(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q425 — presetIntervalDiversityVsEntropy
// ---------------------------------------------------------------------------

/**
 * Compare interval diversity and entropy per mode for a preset tuning in one call.
 *
 * Socratic Q425: "If I can compare diversity vs entropy per mode for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningIntervalDiversityVsEntropy(tuning, spectrum, rootHz)` → per-mode diversity, entropy,
 *    and correlation classification.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Optional instrument spectrum for entropy computation.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns One entry per modal rotation with diversity, entropy, and correlation classification.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const result = presetIntervalDiversityVsEntropy('12-tet');
 * result.forEach(({ mode, diversity, entropy, correlation }) =>
 *   console.log(mode.id, diversity, entropy, correlation));
 */
export function presetIntervalDiversityVsEntropy(
  presetId: string,
  spectrum?: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): {
  mode: Scale;
  diversity: number;
  entropy: number;
  correlation: 'aligned' | 'opposed' | 'neutral';
}[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetIntervalDiversityVsEntropy: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  if (spectrum !== undefined) {
    return rootHz !== undefined
      ? tuningIntervalDiversityVsEntropy(tuning, spectrum, rootHz)
      : tuningIntervalDiversityVsEntropy(tuning, spectrum);
  }
  return rootHz !== undefined
    ? tuningIntervalDiversityVsEntropy(tuning, undefined, rootHz)
    : tuningIntervalDiversityVsEntropy(tuning);
}

// ---------------------------------------------------------------------------
// Q427 — presetModeParetoFront
// ---------------------------------------------------------------------------

/**
 * Find the Pareto-optimal modes of a preset tuning across five metrics in one call.
 *
 * Socratic Q427: "If I can find the Pareto front for a tuning, can I do it for a preset by id?"
 * → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningModeParetoFront(tuning, spectrum, rootHz)` → Pareto-optimal modes.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns Pareto-optimal modal rotations, each with all five metrics.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const front = presetModeParetoFront('12-tet', spec);
 * front.forEach(({ mode }) => console.log(mode.id));
 */
export function presetModeParetoFront(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): {
  mode: Scale;
  entropy: number;
  consistency: number;
  volatility: number;
  diversity: number;
  smoothnessRatio: number;
}[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeParetoFront: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeParetoFront(tuning, spectrum, rootHz)
    : tuningModeParetoFront(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q430 — presetModeCorrelationMatrix
// ---------------------------------------------------------------------------

/**
 * Compute the Pearson correlation matrix between five per-mode metrics for a preset in one call.
 *
 * Socratic Q430: "If I can compute the mode correlation matrix for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningModeCorrelationMatrix(tuning, spectrum, rootHz)` → 5×5 correlation matrix.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{metrics, matrix}` with a 5×5 symmetric correlation matrix.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { metrics, matrix } = presetModeCorrelationMatrix('12-tet', spec);
 * console.log(metrics, matrix[0]);
 */
export function presetModeCorrelationMatrix(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { metrics: string[]; matrix: number[][] } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeCorrelationMatrix: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeCorrelationMatrix(tuning, spectrum, rootHz)
    : tuningModeCorrelationMatrix(tuning, spectrum);
}
