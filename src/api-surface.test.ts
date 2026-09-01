import { describe, it, expect } from 'vitest';
import * as ruri from './index.js';

/**
 * The public API is a product decision, not a side effect of what happens to be
 * written. This file pins it.
 *
 * The package once re-exported 1,445 explicitly named symbols while the README
 * documented 56 — a 26:1 ratio that made the library unsearchable: anyone
 * looking for `edo` had to find it among names like
 * `tuningFamilyAmbassadorConsensusConvergenceScoreNarrative`. The barrels now
 * export a curated surface instead. The implementation is untouched and every
 * module is still importable by path; what changed is what a *user* is offered.
 *
 * These tests exist so that stays true: the documented entry points must all
 * resolve, and the surface must not quietly grow back.
 */

/** Everything the README's examples import from `ruri`. */
const DOCUMENTED = [
  // tuning + pitch
  'edo',
  'equalTemperament12',
  'degreeToFreq',
  'generatedTuning',
  'maximallyEvenTuning',
  'tuningIntervalMatrix',
  // scale layer
  'scaleToFreqs',
  'scaleMode',
  'rankModes',
  'scaleToTuning',
  'tuningToScale',
  'detectNearestScale',
  // chords
  'chordFromSemitones',
  'chordFromRatios',
  'realizeChordFreqs',
  'chordToCentOffsets',
  'rankChords',
  'rankedChordToChord',
  // consonance
  'chordDissonance',
  'consonantIntervals',
  'harmonicSpectrum',
  'bellSpectrum',
  'spectrumToTuning',
  // instruments
  'guitarStandard',
  'fingerChord',
  'fretlessOud',
  'violin',
  'fretlessChordFromScale',
  // data
  'getTuningById',
  'ALL_PRESETS',
] as const;

/** The analysis modules added on top of the original core. */
const ANALYSIS = [
  'relativeError',
  'isConsistent',
  'edoConsistencyLimit',
  'patentVal',
  'tempersOut',
  'temperedCommas',
  'inducedSpectrum',
  'spectrumBendCents',
  'harmonicEntropy',
  'harmonicEntropyCurve',
  'edoSharpness',
  'edoIntervalName',
  'mosSizes',
  'mosSpectrum',
  'optimalGenerator',
  'generatorError',
  'fjsName',
  'fjsFormalComma',
] as const;

describe('public API surface', () => {
  it('test_every_documented_entry_point_resolves', () => {
    const missing = DOCUMENTED.filter((n) => !(n in ruri));
    expect(missing).toEqual([]);
  });

  it('test_every_analysis_module_is_reachable_from_the_package_root', () => {
    const missing = ANALYSIS.filter((n) => !(n in ruri));
    expect(missing).toEqual([]);
  });

  it('test_the_curated_presets_are_all_exported', () => {
    for (const p of [
      'TWELVE_TET',
      'JUST_INTONATION_5L',
      'MAKAM_USSAK',
      'PYTHAGOREAN_12',
      'MEANTONE_QUARTER_COMMA',
      'WERCKMEISTER_III',
      'KIRNBERGER_III',
      'BOHLEN_PIERCE_13',
      'VALLOTTI',
      'YOUNG_II',
    ]) {
      expect(p in ruri).toBe(true);
    }
  });

  it('test_the_surface_stays_small_enough_to_search', () => {
    // A ceiling, not a target. It exists so the generated bulk cannot be
    // re-exported wholesale without someone deciding to raise this number.
    const count = Object.keys(ruri).length;
    expect(count).toBeGreaterThan(200); // the real API is still all here
    expect(count).toBeLessThan(600); // …and it was 1,445 named symbols before
  });

  it('test_the_generated_analytics_bulk_is_not_in_the_public_surface', () => {
    // Representative names from the machine-generated layer. They remain
    // importable from their module by path; they are simply not offered as
    // part of the package's API.
    for (const n of [
      'tuningFamilyAmbassadorConsensusConvergenceScoreNarrative',
      'presetModeQuadrantIdentityNarrative',
      'tuningFamilyFullParetoCorrelationReports',
    ]) {
      expect(n in ruri).toBe(false);
    }
  });

  it('test_the_removed_western_theory_and_ungated_ethnic_layer_stays_removed', () => {
    // Deleted 2026-08 for violating the design invariants: gamelanTuning shipped
    // provenance-free ethnic tables (the gated path is getTuningById('slendro-example')),
    // detectKey was a Krumhansl familiarity layer, and the rest were 12-TET Western
    // theory (Tonnetz PLR, Forte numbers, jazz ii-V-I) or off-scope (euclidean rhythm).
    for (const n of [
      'gamelanTuning',
      'detectKey',
      'forteNumber',
      'primeForm',
      'normalForm',
      'tonnetzCoord',
      'jinsTuning',
      'maqamTuning',
      'japaneseScale',
      'kotoTuning',
      'buildTwoFiveOne',
      'euclideanRhythm',
      'polyrhythmPattern',
    ]) {
      expect(n in ruri).toBe(false);
    }
  });
});
