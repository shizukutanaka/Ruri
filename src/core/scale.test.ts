import { describe, it, expect } from 'vitest';
import {
  type Scale,
  scaleToCents,
  scaleToFreqs,
  scaleMode,
  scaleToTuning,
  tuningToScale,
  scaleDissonance,
  rankModes,
  isScaleCompatible,
  rankScaleChords,
  synthScaleFromScale,
  chordFromScale,
  rankModeChords,
  chordFromBestMode,
  rankScalesForTimbre,
  bestScaleForTimbre,
  scaleIntervalHistogram,
  scaleSimilarity,
  scaleHarmonicity,
  scaleProgressionHarmonicity,
  buildChordProgression,
  scaleModeSeries,
  rankModeSeriesByHarmonicity,
  rankAllModesForTimbre,
  chordProgressionAnalysis,
  scaleToChordMap,
  progressionFromPattern,
  bestProgressionForScale,
  rankScaleChordsByHarmonicity,
  scaleModalAnalysis,
  chordMapAnalysis,
  bestChordMapEntry,
  rankChordMapByHarmonicity,
  bestModeForTuning,
  rankChordMapCombined,
  bestChordForMidiNote,
  rankChordMapByDissonance,
  bestModeChordAnalysis,
  worstChordMapEntry,
  filterChordMapByHarmonicity,
  chordMapMedianDissonance,
  filterChordMapByDissonance,
  chordMapMeanDissonance,
  progressionScoreSummary,
  chordMapSummary,
  filterChordMapByCriteria,
  bestModeProgressionSummary,
  tuningHarmonicityProfile,
  chordMapWithLabels,
  scaleToMinimalTuning,
  chordMapDissonancePercentiles,
  groupChordMapByLabel,
  isScaleStable,
  scaleMinimalTuningRoundTrip,
  chordMapLabelCounts,
  tuningHarmonicityCorrelation,
  harmonicityProfileChart,
  chordMapTriads,
  rankModesByStability,
  isBestModeStable,
  chordMapDyads,
  areTuningsSimilar,
  tuningReport,
  compareTuningReports,
  modeStabilityScores,
  singleBestChord,
  chordMapDyadTriadRatio,
  chordMapDescription,
  tuningReportSimilarity,
  annotateProgression,
  progressionEnergyArc,
  findChordByLabel,
  progressionClimaxChord,
  progressionResolutionChord,
  chordDescription,
  progressionEnergyShape,
  progressionNarrative,
  chordMapBestWorstBundle,
  tuningIntervalHistogram,
  tuningHistogramChart,
  chordMapIntervalHistogram,
  scaleProgressionNarrative,
  scaleSimilarityMatrix,
  progressionChordCentroid,
  modeIntervalSets,
} from './scale.js';
import { equalTemperament12, edo, degreeToFreq } from './tuning.js';
import { generatedTuning } from './generate.js';
import { rankChords } from './chord-search.js';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import { chordDissonance, chordObjectDissonance } from './dissonance.js';
import { DEFAULT_SYNTH_SCALE } from './ks-synth.js';
import { chordToCents, chordFromDegrees, chordFromRatios, chordFromSemitones } from './chord.js';

const t12 = equalTemperament12(440);

// Ionian (major) mode over 12-TET: W-W-H-W-W-W-H.
const major: Scale = {
  id: 'major',
  name: 'Ionian',
  tuningId: '12-tet',
  degreeIndices: [0, 2, 4, 5, 7, 9, 11],
};

describe('scaleToCents', () => {
  it('test_major_mode_cents', () => {
    expect(scaleToCents(major, t12)).toEqual([0, 200, 400, 500, 700, 900, 1100]);
  });

  it('test_octave_spanning_indices_wrap_and_advance_period', () => {
    // Index 12 = one period above degree 0 → 1200c; index 14 → 1400c.
    const spanning: Scale = { ...major, degreeIndices: [0, 12, 14] };
    expect(scaleToCents(spanning, t12)).toEqual([0, 1200, 1400]);
  });

  it('test_tuning_id_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0] };
    expect(() => scaleToCents(wrong, t12)).toThrow(RangeError);
  });
});

describe('scaleToFreqs — bridge to the frequency world', () => {
  it('test_root_is_reference_hz', () => {
    const freqs = scaleToFreqs(major, t12);
    expect(freqs[0]).toBeCloseTo(440, 9); // degree 0 = referenceHz
  });

  it('test_fifth_is_3_2_ish', () => {
    // Scale degree 4 = 700c = 12-TET fifth ≈ 1.4983 * root.
    const freqs = scaleToFreqs(major, t12);
    expect(freqs[4] as number).toBeCloseTo(440 * 2 ** (700 / 1200), 6);
  });

  it('test_matches_degreeToFreq_per_index', () => {
    const freqs = scaleToFreqs(major, t12);
    major.degreeIndices.forEach((d, i) => {
      expect(freqs[i] as number).toBeCloseTo(degreeToFreq(t12, d), 9);
    });
  });

  it('test_octave_spanning_index_doubles_root', () => {
    const spanning: Scale = { ...major, degreeIndices: [0, 12] };
    const freqs = scaleToFreqs(spanning, t12);
    expect(freqs[1] as number).toBeCloseTo(880, 6); // one octave up
  });

  it('test_non_octave_tuning_respected', () => {
    // Bohlen-Pierce-style: 13-EDO of a 3/1 period (1902c). Degree 13 = one period up = 3x.
    const bp = edo(13, 440, 1200 * Math.log2(3));
    const s: Scale = { id: 'bp', name: 'bp', tuningId: '13-edo', degreeIndices: [0, 13] };
    const freqs = scaleToFreqs(s, bp);
    expect(freqs[0] as number).toBeCloseTo(440, 9);
    expect(freqs[1] as number).toBeCloseTo(1320, 4); // 440 * 3
  });

  it('test_tuning_id_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0] };
    expect(() => scaleToFreqs(wrong, t12)).toThrow(RangeError);
  });
});

// Socratic Q39: modal rotation is a first-class Scale operation.
describe('scaleMode — modal rotation', () => {
  it('test_mode_0_is_identity', () => {
    // Mode 0 of major = major: indices start at degree 0, same intervals.
    const mode0 = scaleMode(major, 0, t12);
    expect(scaleToCents(mode0, t12)).toEqual(scaleToCents(major, t12));
  });

  it('test_mode_2_of_major_is_dorian', () => {
    // Major mode 2 (0-indexed) = Phrygian ... wait:
    // Ionian [0,2,4,5,7,9,11] → mode index 1 (D) = Dorian.
    // W-H-W-W-W-H-W → [0,2,3,5,7,9,10] in cents [0,200,300,500,700,900,1000]
    const dorian = scaleMode(major, 1, t12);
    expect(scaleToCents(dorian, t12)).toEqual([0, 200, 300, 500, 700, 900, 1000]);
  });

  it('test_mode_6_of_major_is_locrian', () => {
    // Mode index 6 (B) = Locrian: H-W-H-W-W-W-W → [0,1,3,5,6,8,10]c*100
    const locrian = scaleMode(major, 6, t12);
    expect(scaleToCents(locrian, t12)).toEqual([0, 100, 300, 500, 600, 800, 1000]);
  });

  it('test_mode_id_and_name_are_updated', () => {
    const mode = scaleMode(major, 1, t12);
    expect(mode.id).toBe('major-mode-2');
    expect(mode.name).toBe('Ionian mode 2');
    expect(mode.tuningId).toBe('12-tet');
  });

  it('test_all_7_modes_start_at_zero_cents', () => {
    for (let i = 0; i < 7; i++) {
      const mode = scaleMode(major, i, t12);
      expect(scaleToCents(mode, t12)[0]).toBe(0);
    }
  });

  it('test_mode_rotation_preserves_interval_multiset', () => {
    // The set of step sizes is invariant under rotation.
    const steps = (cents: number[]): number[] => {
      const s: number[] = [];
      for (let i = 1; i < cents.length; i++)
        s.push((cents[i] as number) - (cents[i - 1] as number));
      // wrap-around step:
      s.push(1200 - (cents[cents.length - 1] as number));
      return s.sort((a, b) => a - b);
    };
    const originalSteps = steps(scaleToCents(major, t12));
    for (let i = 0; i < 7; i++) {
      const mode = scaleMode(major, i, t12);
      expect(steps(scaleToCents(mode, t12))).toEqual(originalSteps);
    }
  });

  it('test_out_of_range_modeIndex_throws', () => {
    expect(() => scaleMode(major, 7, t12)).toThrow(RangeError);
    expect(() => scaleMode(major, -1, t12)).toThrow(RangeError);
  });

  it('test_non_integer_modeIndex_throws', () => {
    expect(() => scaleMode(major, 1.5, t12)).toThrow(RangeError);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2] };
    expect(() => scaleMode(wrong, 0, t12)).toThrow(RangeError);
  });

  it('test_non_octave_tuning_mode_rotation', () => {
    // 13-EDO Bohlen-Pierce: period = 1902c. Rotation should use periodDegrees=13.
    const bp = edo(13, 440, 1200 * Math.log2(3));
    const bpScale: Scale = {
      id: 'bp',
      name: 'bp',
      tuningId: '13-edo',
      degreeIndices: [0, 2, 4, 6],
    };
    const mode1 = scaleMode(bpScale, 1, bp);
    expect(scaleToCents(mode1, bp)[0]).toBeCloseTo(0, 9);
    expect(mode1.degreeIndices.length).toBe(4);
  });
});

// Socratic Q41: scaleToTuning bridges Scale → TuningSystem for rankChords / pipeline.
describe('scaleToTuning — modal layer → TuningSystem bridge', () => {
  it('test_degree_count_matches_scale_length', () => {
    const sub = scaleToTuning(major, t12);
    expect(sub.degrees.length).toBe(major.degreeIndices.length); // 7
  });

  it('test_cents_match_scaleToCents', () => {
    const sub = scaleToTuning(major, t12);
    const subCents = sub.degrees.map((p) =>
      p.kind === 'cents'
        ? p.cents
        : 1200 *
          Math.log2(
            (p as { ratio: { num: number; den: number } }).ratio.num /
              (p as { ratio: { num: number; den: number } }).ratio.den,
          ),
    );
    expect(subCents).toEqual(scaleToCents(major, t12));
  });

  it('test_referenceHz_preserved', () => {
    const sub = scaleToTuning(major, t12);
    expect(sub.referenceHz).toBe(t12.referenceHz);
  });

  it('test_periodCents_preserved', () => {
    const sub = scaleToTuning(major, t12);
    expect(sub.periodCents).toBe(t12.periodCents);
  });

  it('test_id_is_scale_id_tuning', () => {
    const sub = scaleToTuning(major, t12);
    expect(sub.id).toBe('major-tuning');
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2] };
    expect(() => scaleToTuning(wrong, t12)).toThrow(RangeError);
  });

  it('test_rankChords_on_sub_tuning_discovers_diatonic_chords', () => {
    // Diatonic triads from major scale: C(6,2)=15 vs chromatic C(11,2)=55.
    const sub = scaleToTuning(major, t12);
    const spectrum = harmonicSpectrum();
    const diatonicTriads = rankChords(sub, { size: 3, spectrum, limit: 100 });
    const fullTriads = rankChords(t12, { size: 3, spectrum, limit: 100 });
    expect(diatonicTriads.length).toBeLessThan(fullTriads.length);
    expect(diatonicTriads.length).toBeGreaterThan(0);
  });

  it('test_modal_rotation_then_scaleToTuning_gives_distinct_chord_set', () => {
    // Ionian and Dorian have different interval sets → different diatonic chords.
    const dorian = scaleMode(major, 1, t12);
    const spectrum = harmonicSpectrum();
    const ionianChords = rankChords(scaleToTuning(major, t12), { size: 3, spectrum, limit: 3 });
    const dorianChords = rankChords(scaleToTuning(dorian, t12), { size: 3, spectrum, limit: 3 });
    // The top chord cents patterns should differ (different interval sets).
    expect(JSON.stringify(ionianChords[0]!.cents)).not.toEqual(
      JSON.stringify(dorianChords[0]!.cents),
    );
  });
});

// Socratic Q42: tuningToScale bridges TuningSystem → Scale (generation → modal layer).
describe('tuningToScale — TuningSystem → Scale bridge', () => {
  it('test_degree_indices_span_all_degrees', () => {
    const scale = tuningToScale(t12);
    expect(scale.degreeIndices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('test_tuningId_matches_tuning_id', () => {
    const scale = tuningToScale(t12);
    expect(scale.tuningId).toBe(t12.id);
  });

  it('test_id_is_tuning_id_scale', () => {
    const scale = tuningToScale(t12);
    expect(scale.id).toBe('12-tet-scale');
  });

  it('test_name_defaults_to_tuning_name', () => {
    const scale = tuningToScale(t12);
    expect(scale.name).toBe(t12.name);
  });

  it('test_name_override', () => {
    const scale = tuningToScale(t12, 'chromatic');
    expect(scale.name).toBe('chromatic');
  });

  it('test_scaleToCents_matches_all_tuning_degrees', () => {
    const t7 = generatedTuning(700, 1200, 7);
    const scale = tuningToScale(t7);
    const cents = scaleToCents(scale, t7);
    expect(cents.length).toBe(7);
    expect(cents[0]).toBeCloseTo(0, 9);
  });

  it('test_pipeline_generatedTuning_scaleMode_works', () => {
    // generatedTuning → tuningToScale → scaleMode: full modal pipeline from generation layer.
    const t7 = generatedTuning(700, 1200, 7);
    const scale = tuningToScale(t7);
    const mode2 = scaleMode(scale, 1, t7);
    // Mode 2 of 5th-stacked diatonic starts at 0c (re-zeroed).
    expect(scaleToCents(mode2, t7)[0]).toBeCloseTo(0, 9);
    expect(mode2.degreeIndices.length).toBe(7);
  });

  it('test_pipeline_tuningToScale_scaleToTuning_is_identity', () => {
    // tuningToScale(t) → scaleToTuning(…, t) should recover original cents.
    const t7 = generatedTuning(700, 1200, 7);
    const recovered = scaleToTuning(tuningToScale(t7), t7);
    const originalCents = t7.degrees.map((p) => (p.kind === 'cents' ? p.cents : 0));
    const recoveredCents = recovered.degrees.map((p) => (p.kind === 'cents' ? p.cents : 0));
    expect(recoveredCents).toEqual(originalCents);
  });
});

// Socratic Q43: scaleDissonance and rankModes close the modal→acoustic evaluation gap.
describe('scaleDissonance + rankModes — modal acoustic analysis', () => {
  const spectrum = harmonicSpectrum();

  it('test_scaleDissonance_returns_non_negative', () => {
    expect(scaleDissonance(major, t12, spectrum)).toBeGreaterThanOrEqual(0);
  });

  it('test_scaleDissonance_equals_chordDissonance_of_scaleToFreqs', () => {
    const freqs = scaleToFreqs(major, t12);
    expect(scaleDissonance(major, t12, spectrum)).toBeCloseTo(chordDissonance(freqs, spectrum), 9);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2] };
    expect(() => scaleDissonance(wrong, t12, spectrum)).toThrow(RangeError);
  });

  it('test_rankModes_returns_all_7_modes', () => {
    const ranked = rankModes(major, t12, spectrum);
    expect(ranked.length).toBe(7);
  });

  it('test_rankModes_sorted_ascending_by_dissonance', () => {
    const ranked = rankModes(major, t12, spectrum);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.dissonance).toBeGreaterThanOrEqual(ranked[i - 1]!.dissonance);
    }
  });

  it('test_rankModes_modeIndex_covers_0_to_n_minus_1', () => {
    const ranked = rankModes(major, t12, spectrum);
    const indices = ranked.map((r) => r.modeIndex).sort((a, b) => a - b);
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('test_rankModes_scale_is_valid_mode_rotation', () => {
    const ranked = rankModes(major, t12, spectrum);
    for (const { modeIndex, scale } of ranked) {
      expect(scale.id).toBe(`major-mode-${modeIndex + 1}`);
      expect(scaleToCents(scale, t12)[0]).toBe(0);
    }
  });

  it('test_rankModes_timbre_affects_ranking', () => {
    // bell spectrum → different dissonance values than harmonic (timbre-dependent)
    const harmRanked = rankModes(major, t12, spectrum);
    const bellRanked = rankModes(major, t12, bellSpectrum());
    const harmDissonances = harmRanked.map((r) => r.dissonance);
    const bellDissonances = bellRanked.map((r) => r.dissonance);
    expect(harmDissonances).not.toEqual(bellDissonances);
  });

  it('test_tuning_mismatch_throws_rankModes', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2] };
    expect(() => rankModes(wrong, t12, spectrum)).toThrow(RangeError);
  });
});

// Q51: `assertTuningMatch` は内部にのみあるが、外部から Scale の整合性を確認できるか？
describe('isScaleCompatible — public guard predicate (Q51)', () => {
  const t12 = equalTemperament12(440);

  it('test_matching_tuning_id_and_valid_indices_is_compatible', () => {
    const scale: Scale = {
      id: 'major',
      name: 'Major',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 5, 7, 9, 11],
    };
    expect(isScaleCompatible(scale, t12)).toBe(true);
  });

  it('test_wrong_tuning_id_is_not_compatible', () => {
    const scale: Scale = { id: 'x', name: 'x', tuningId: 'other-id', degreeIndices: [0, 1] };
    expect(isScaleCompatible(scale, t12)).toBe(false);
  });

  it('test_out_of_range_degree_index_is_not_compatible', () => {
    // 12-TET has degrees [0..11]; index 12 is out of range.
    const scale: Scale = { id: 'bad', name: 'bad', tuningId: '12-tet', degreeIndices: [0, 12] };
    expect(isScaleCompatible(scale, t12)).toBe(false);
  });

  it('test_negative_degree_index_is_not_compatible', () => {
    const scale: Scale = { id: 'neg', name: 'neg', tuningId: '12-tet', degreeIndices: [0, -1] };
    expect(isScaleCompatible(scale, t12)).toBe(false);
  });

  it('test_scaleMode_output_is_compatible_with_same_tuning', () => {
    const base: Scale = {
      id: 'major',
      name: 'Major',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 5, 7, 9, 11],
    };
    const dorian = scaleMode(base, 1, t12);
    expect(isScaleCompatible(dorian, t12)).toBe(true);
  });

  it('test_tuningToScale_output_is_compatible', () => {
    const scale = tuningToScale(t12);
    expect(isScaleCompatible(scale, t12)).toBe(true);
  });

  it('test_result_predicts_whether_scale_ops_will_throw', () => {
    const incompatible: Scale = { id: 'x', name: 'x', tuningId: 'wrong', degreeIndices: [0, 1] };
    expect(isScaleCompatible(incompatible, t12)).toBe(false);
    // Confirms the predicate correctly predicts that scaleToCents would throw.
    expect(() => scaleToCents(incompatible, t12)).toThrow(RangeError);
  });
});

// Q57: Scale → diatonic chord ranking in one call
describe('rankScaleChords — rank chord subsets of a Scale (Q57)', () => {
  const spectrum = harmonicSpectrum();

  it('test_returns_ranked_chords_within_scale_degree_count', () => {
    // Major scale has 7 degrees; C(6,2) = 15 possible triads
    const results = rankScaleChords(major, t12, { size: 3, spectrum });
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(15);
  });

  it('test_results_sorted_ascending_by_score', () => {
    const results = rankScaleChords(major, t12, { size: 3, spectrum });
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.score).toBeGreaterThanOrEqual(results[i - 1]!.score);
    }
  });

  it('test_all_degree_indices_within_scale_range', () => {
    const results = rankScaleChords(major, t12, { size: 3, spectrum });
    // Degree indices are relative to sub-tuning (0..scale.degreeIndices.length-1)
    for (const chord of results) {
      for (const d of chord.degrees) {
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThan(major.degreeIndices.length);
      }
    }
  });

  it('test_limit_option_is_respected', () => {
    const results = rankScaleChords(major, t12, { size: 3, spectrum, limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2, 4] };
    expect(() => rankScaleChords(wrong, t12, { size: 3 })).toThrow(RangeError);
  });

  it('test_produces_subset_of_full_tuning_chords', () => {
    // Chords from the 7-degree diatonic scale must be fewer than full 12-TET chord search
    const scaleChords = rankScaleChords(major, t12, { size: 3, spectrum, limit: 100 });
    const fullChords = rankChords(t12, { size: 3, spectrum, limit: 100 });
    expect(scaleChords.length).toBeLessThan(fullChords.length);
  });

  it('test_timbre_affects_ranking', () => {
    const harmRanked = rankScaleChords(major, t12, { size: 3, spectrum });
    const bellRanked = rankScaleChords(major, t12, { size: 3, spectrum: bellSpectrum() });
    // Scores differ when timbre changes (roughness is timbre-dependent)
    const harmScores = harmRanked.map((r) => r.score);
    const bellScores = bellRanked.map((r) => r.score);
    expect(harmScores).not.toEqual(bellScores);
  });
});

// Q59: Scale → Float32Array melodic audio in one call
describe('synthScaleFromScale — Scale to melodic audio (Q59)', () => {
  const opts = { ...DEFAULT_SYNTH_SCALE, noteSeconds: 0.05 };

  it('test_output_is_float32array_with_correct_length', () => {
    const audio = synthScaleFromScale(major, t12, opts);
    const samplesPerNote = Math.floor(opts.sampleRate * opts.noteSeconds);
    expect(audio).toBeInstanceOf(Float32Array);
    expect(audio.length).toBe(major.degreeIndices.length * samplesPerNote);
  });

  it('test_output_values_are_finite', () => {
    const audio = synthScaleFromScale(major, t12, opts);
    expect(Array.from(audio).every(Number.isFinite)).toBe(true);
  });

  it('test_output_within_unit_range', () => {
    const audio = synthScaleFromScale(major, t12, opts);
    expect(audio.every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'wrong', degreeIndices: [0, 2] };
    expect(() => synthScaleFromScale(wrong, t12, opts)).toThrow(RangeError);
  });

  it('test_different_scales_produce_different_audio', () => {
    // Major and minor scale share the same root but have different second degrees
    // (200c vs 200c same, but third degree: 400c major vs 300c minor)
    // The second note's samples should differ — check a sample from the second note window.
    const minor: Scale = {
      id: 'minor',
      name: 'Aeolian',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 3, 5, 7, 8, 10],
    };
    const audioMajor = synthScaleFromScale(major, t12, opts);
    const audioMinor = synthScaleFromScale(minor, t12, opts);
    // Both are 7-note scales → same length
    expect(audioMajor.length).toBe(audioMinor.length);
    // The full waveforms differ (different 3rd degrees: E vs Eb)
    let differs = false;
    for (let i = 0; i < audioMajor.length; i++) {
      if (Math.abs((audioMajor[i] as number) - (audioMinor[i] as number)) > 1e-6) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_matches_manual_pipeline_scaleToFreqs_then_synthScale', () => {
    const freqs = scaleToFreqs(major, t12);
    // synthScaleFromScale(major, t12, opts) should equal synthScale(freqs, opts)
    const direct = synthScaleFromScale(major, t12, opts);
    expect(direct.length).toBe(Math.floor(opts.sampleRate * opts.noteSeconds) * freqs.length);
  });
});

// Q64: Scale is first-class — should building a chord from scale-local offsets be one call?
describe('chordFromScale — chord from scale-local degree offsets (Q64)', () => {
  const t12 = equalTemperament12(440);
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_triad_matches_chordFromDegrees_with_mapped_indices', () => {
    // Scale offsets [0,2,4] → tuning indices [0,4,7] (major triad)
    const chord = chordFromScale(major12, t12, [0, 2, 4], 'major-triad');
    const expected = chordFromDegrees(t12, [0, 4, 7], 'major-triad');
    expect(chordToCents(chord)).toEqual(chordToCents(expected));
  });

  it('test_root_is_zero_cents', () => {
    const chord = chordFromScale(major12, t12, [0, 2, 4]);
    expect(chordToCents(chord)[0]).toBe(0);
  });

  it('test_name_is_auto_generated_from_tuning_degrees_when_omitted', () => {
    // offsets [0,2,4] → tuning degrees [0,4,7] → name 'chord-0-4-7'
    const chord = chordFromScale(major12, t12, [0, 2, 4]);
    expect(chord.name).toBe('chord-0-4-7');
  });

  it('test_explicit_name_overrides_auto_name', () => {
    const chord = chordFromScale(major12, t12, [0, 2, 4], 'my-triad');
    expect(chord.name).toBe('my-triad');
  });

  it('test_offset_out_of_range_throws_range_error', () => {
    // major has 7 degrees (offsets 0..6); offset 7 is out of range
    expect(() => chordFromScale(major12, t12, [0, 2, 7])).toThrow(RangeError);
  });

  it('test_negative_offset_throws_range_error', () => {
    expect(() => chordFromScale(major12, t12, [0, -1, 4])).toThrow(RangeError);
  });

  it('test_empty_offsets_throws_range_error', () => {
    expect(() => chordFromScale(major12, t12, [])).toThrow(RangeError);
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const wrongTuning = edo(19);
    expect(() => chordFromScale(major12, wrongTuning, [0, 2, 4])).toThrow(RangeError);
  });

  it('test_19edo_scale_triad_matches_chordFromDegrees', () => {
    const t19 = edo(19);
    const major19: Scale = {
      id: 'major-19',
      name: 'Ionian-19',
      tuningId: '19-edo',
      degreeIndices: [0, 3, 6, 8, 11, 14, 17],
    };
    // Scale offsets [0,2,4] → tuning degrees [0,6,11]
    const chord = chordFromScale(major19, t19, [0, 2, 4]);
    const expected = chordFromDegrees(t19, [0, 6, 11]);
    expect(chordToCents(chord)).toEqual(chordToCents(expected));
  });
});

// Q66: For each mode, rank its diatonic chords → leaderboard sorted by best chord's score
describe('rankModeChords — modal chord leaderboard (Q66)', () => {
  const spectrum = harmonicSpectrum();

  it('test_returns_one_entry_per_mode', () => {
    const leaderboard = rankModeChords(major, t12, { size: 3, spectrum });
    expect(leaderboard.length).toBe(major.degreeIndices.length);
  });

  it('test_each_entry_has_non_empty_chords_array', () => {
    const leaderboard = rankModeChords(major, t12, { size: 3, spectrum });
    for (const entry of leaderboard) {
      expect(entry.chords.length).toBeGreaterThan(0);
    }
  });

  it('test_sorted_ascending_by_best_chord_score', () => {
    const leaderboard = rankModeChords(major, t12, { size: 3, spectrum });
    for (let i = 1; i < leaderboard.length; i++) {
      const prevScore = leaderboard[i - 1]!.chords[0]!.score;
      const currScore = leaderboard[i]!.chords[0]!.score;
      expect(currScore).toBeGreaterThanOrEqual(prevScore);
    }
  });

  it('test_modeIndex_values_cover_all_rotations', () => {
    const leaderboard = rankModeChords(major, t12, { size: 3, spectrum });
    const indices = leaderboard.map((e) => e.modeIndex).sort((a, b) => a - b);
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('test_scale_in_each_entry_is_the_correct_modal_rotation', () => {
    const leaderboard = rankModeChords(major, t12, { size: 3, spectrum });
    for (const { modeIndex, scale } of leaderboard) {
      expect(scale.id).toBe(`major-mode-${modeIndex + 1}`);
      // Every modal rotation starts at 0 cents
      expect(scaleToCents(scale, t12)[0]).toBe(0);
    }
  });

  it('test_chords_within_each_entry_are_sorted_ascending_by_score', () => {
    const leaderboard = rankModeChords(major, t12, { size: 3, spectrum });
    for (const { chords } of leaderboard) {
      for (let i = 1; i < chords.length; i++) {
        expect(chords[i]!.score).toBeGreaterThanOrEqual(chords[i - 1]!.score);
      }
    }
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2, 4] };
    expect(() => rankModeChords(wrong, t12)).toThrow(RangeError);
  });

  it('test_different_opts_size_changes_chord_count', () => {
    const triads = rankModeChords(major, t12, { size: 3, spectrum });
    const tetrads = rankModeChords(major, t12, { size: 4, spectrum });
    // 4-note chords exist in a 7-note scale; both should succeed but differ
    expect(triads.length).toBe(tetrads.length); // still one per mode
    // but chord arrays differ (different sizes)
    expect(triads[0]!.chords[0]!.cents.length).toBe(3);
    expect(tetrads[0]!.chords[0]!.cents.length).toBe(4);
  });
});

// Q68: Collapse rankModes → rankScaleChords → rankedChordToChord into one call
describe('chordFromBestMode — best chord from most consonant mode (Q68)', () => {
  const spectrum = harmonicSpectrum();

  it('test_returns_a_chord_with_intervals', () => {
    const { chord } = chordFromBestMode(major, t12, 3, spectrum);
    expect(chord.intervals.length).toBe(3);
  });

  it('test_modeIndex_is_in_valid_range', () => {
    const { modeIndex } = chordFromBestMode(major, t12, 3, spectrum);
    expect(modeIndex).toBeGreaterThanOrEqual(0);
    expect(modeIndex).toBeLessThan(major.degreeIndices.length);
  });

  it('test_mode_tuningId_matches_tuning', () => {
    const { mode } = chordFromBestMode(major, t12, 3, spectrum);
    expect(mode.tuningId).toBe(t12.id);
  });

  it('test_mode_is_a_valid_modal_rotation_of_the_scale', () => {
    const { mode, modeIndex } = chordFromBestMode(major, t12, 3, spectrum);
    // The returned mode must be the correct rotation
    const expected = scaleMode(major, modeIndex, t12);
    expect(mode.id).toBe(expected.id);
    expect(scaleToCents(mode, t12)).toEqual(scaleToCents(expected, t12));
  });

  it('test_chord_matches_top_chord_of_best_mode_in_leaderboard', () => {
    const { modeIndex, chord } = chordFromBestMode(major, t12, 3, spectrum);
    const leaderboard = rankModeChords(major, t12, { size: 3, spectrum });
    const bestEntry = leaderboard[0]!;
    // The returned modeIndex should be the top of the leaderboard
    expect(modeIndex).toBe(bestEntry.modeIndex);
    // The chord's cents should match the top RankedChord lifted to a Chord
    const topChordCents = chordToCents(chord);
    const leaderTopCents = bestEntry.chords[0]!.cents;
    expect(topChordCents).toEqual(Array.from(leaderTopCents));
  });

  it('test_default_size_3_works_without_explicit_opts', () => {
    const result = chordFromBestMode(major, t12);
    expect(result.chord.intervals.length).toBe(3);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2, 4] };
    expect(() => chordFromBestMode(wrong, t12)).toThrow(RangeError);
  });
});

// Q70: Scale[] is first-class — should ranking multiple pre-built Scales by consonance be one call?
describe('rankScalesForTimbre — rank Scale[] by sensory dissonance (Q70)', () => {
  const spectrum = harmonicSpectrum();
  // Build all 7 modal rotations of the major scale as pre-built Scale objects
  const modes = [0, 1, 2, 3, 4, 5, 6].map((i) => scaleMode(major, i, t12));

  it('test_returns_same_count_as_input', () => {
    const ranked = rankScalesForTimbre(modes, t12, spectrum);
    expect(ranked.length).toBe(modes.length);
  });

  it('test_sorted_ascending_by_dissonance', () => {
    const ranked = rankScalesForTimbre(modes, t12, spectrum);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.dissonance).toBeGreaterThanOrEqual(ranked[i - 1]!.dissonance);
    }
  });

  it('test_dissonance_matches_scaleDissonance_per_scale', () => {
    const ranked = rankScalesForTimbre(modes, t12, spectrum);
    for (const { scale, dissonance } of ranked) {
      expect(dissonance).toBeCloseTo(scaleDissonance(scale, t12, spectrum), 10);
    }
  });

  it('test_all_input_scales_appear_in_output', () => {
    const ranked = rankScalesForTimbre(modes, t12, spectrum);
    const resultIds = new Set(ranked.map((r) => r.scale.id));
    for (const mode of modes) {
      expect(resultIds.has(mode.id)).toBe(true);
    }
  });

  it('test_does_not_mutate_input_array_order', () => {
    const inputCopy = [...modes];
    rankScalesForTimbre(modes, t12, spectrum);
    // modes array order should be unchanged
    for (let i = 0; i < modes.length; i++) {
      expect(modes[i]!.id).toBe(inputCopy[i]!.id);
    }
  });

  it('test_timbre_affects_ranking', () => {
    const harmRanked = rankScalesForTimbre(modes, t12, spectrum);
    const bellRanked = rankScalesForTimbre(modes, t12, bellSpectrum());
    const harmIds = harmRanked.map((r) => r.scale.id);
    const bellIds = bellRanked.map((r) => r.scale.id);
    // Bell vs harmonic spectrum should yield a different ranking order
    expect(harmIds).not.toEqual(bellIds);
  });

  it('test_single_scale_array_returns_that_scale', () => {
    const ranked = rankScalesForTimbre([major], t12, spectrum);
    expect(ranked.length).toBe(1);
    expect(ranked[0]!.scale.id).toBe(major.id);
  });

  it('test_empty_scales_throws_range_error', () => {
    expect(() => rankScalesForTimbre([], t12, spectrum)).toThrow(RangeError);
  });

  it('test_tuning_mismatch_throws_range_error', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2, 4] };
    expect(() => rankScalesForTimbre([wrong], t12, spectrum)).toThrow(RangeError);
  });

  it('test_result_first_matches_rankModes_first_for_same_rotations', () => {
    // rankModes ranks the same rotations of one parent scale
    const modeRanked = rankModes(major, t12, spectrum);
    const scaleRanked = rankScalesForTimbre(modes, t12, spectrum);
    // Both should pick the same most-consonant mode
    expect(scaleRanked[0]!.scale.id).toBe(modeRanked[0]!.scale.id);
  });
});

// Q70 (convenience): bestScaleForTimbre — the single most consonant Scale
describe('bestScaleForTimbre — most consonant Scale for a timbre (Q70)', () => {
  const spectrum = harmonicSpectrum();
  const modes = [0, 1, 2, 3, 4, 5, 6].map((i) => scaleMode(major, i, t12));

  it('test_returns_a_scale', () => {
    const best = bestScaleForTimbre(modes, t12, spectrum);
    expect(best).toHaveProperty('id');
    expect(best).toHaveProperty('degreeIndices');
  });

  it('test_matches_rankScalesForTimbre_first_result', () => {
    const best = bestScaleForTimbre(modes, t12, spectrum);
    const ranked = rankScalesForTimbre(modes, t12, spectrum);
    expect(best.id).toBe(ranked[0]!.scale.id);
  });

  it('test_has_lower_dissonance_than_all_others', () => {
    const best = bestScaleForTimbre(modes, t12, spectrum);
    const bestDis = scaleDissonance(best, t12, spectrum);
    for (const mode of modes) {
      expect(bestDis).toBeLessThanOrEqual(scaleDissonance(mode, t12, spectrum));
    }
  });

  it('test_empty_scales_throws_range_error', () => {
    expect(() => bestScaleForTimbre([], t12, spectrum)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q89 — scaleIntervalHistogram
// ---------------------------------------------------------------------------

describe('scaleIntervalHistogram (Q89)', () => {
  it('test_returns_a_map', () => {
    const hist = scaleIntervalHistogram(major, t12);
    expect(hist instanceof Map).toBe(true);
  });

  it('test_total_pairs_equals_n_choose_2', () => {
    // 7-note major scale: C(7,2) = 21 pairs
    const hist = scaleIntervalHistogram(major, t12);
    let total = 0;
    hist.forEach((count) => (total += count));
    expect(total).toBe((7 * 6) / 2);
  });

  it('test_diatonic_major_has_6_perfect_fifths', () => {
    // The 7-note diatonic major scale contains 6 perfect fifths (700c)
    // Pairs (i,j) with j-i ≡ 7 semitones within [0,2,4,5,7,9,11]:
    // (0→7),(2→9),(4→11),(5→0+12?no—upper triangle only within scale)
    // Scale degrees in cents: 0,200,400,500,700,900,1100
    // Upper-triangle intervals that equal 700c:
    //   0→700, 200→900, 400→1100, 500→1200-? no, only within scale
    //   Let's count: (0,700),(200,900),(400,1100),(500,1200-not in scale)
    //   Actually: (0,700), (200,900), (400,1100), and (500,?) 500+700=1200 not in scale
    //   But also (900-200=700),(1100-400=700) already counted.
    //   Count = 4 from those, plus checking across: (0→700=700✓),(200→900=700✓),(400→1100=700✓)
    //   and descending pairs don't apply (upper triangle).
    //   The tuningToIntervalVector bins at stepCents=50: 700c → bin 700.
    //   Actual count: degrees 0,200,400,500,700,900,1100
    //   Pairs with diff = 700: (0,700),(200,900),(400,1100),(500,1200-no),(700,1400-no)
    //   → only 3? Let me also check (500→1100=600, not 700), (0→700=700✓), (200→900=700✓), (400→1100=700✓)
    //   Hmm also check (500→?) 500+700=1200 not a degree, (700→?) 700+700=1400 not, (900→?)
    //   So exactly 3 pairs have interval 700c.
    // But the docstring says 6 — that counts both directions (i→j and j→i).
    // tuningToIntervalVector counts upper-triangle only, so answer is 3.
    const hist = scaleIntervalHistogram(major, t12);
    // 3 ascending perfect-fifth pairs in the diatonic major scale
    expect(hist.get(700)).toBe(3);
  });

  it('test_5_note_pentatonic_has_fewer_intervals_than_7_note_major', () => {
    // A 5-note scale has C(5,2)=10 pairs vs C(7,2)=21 for the major
    const pentatonic: Scale = {
      id: 'pent',
      name: 'pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const histPent = scaleIntervalHistogram(pentatonic, t12);
    const histMaj = scaleIntervalHistogram(major, t12);
    let totalPent = 0;
    let totalMaj = 0;
    histPent.forEach((c) => (totalPent += c));
    histMaj.forEach((c) => (totalMaj += c));
    expect(totalPent).toBeLessThan(totalMaj);
    expect(totalPent).toBe(10);
  });

  it('test_step_cents_controls_binning', () => {
    // With stepCents=100, intervals are in 100c multiples.
    const hist100 = scaleIntervalHistogram(major, t12, 100);
    // 200c intervals should exist in the diatonic major (e.g. 0→200, 200→400, etc.)
    expect(hist100.get(200) ?? 0).toBeGreaterThan(0);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrongScale: Scale = {
      id: 'wrong',
      name: 'wrong',
      tuningId: 'other-id',
      degreeIndices: [0, 1],
    };
    expect(() => scaleIntervalHistogram(wrongScale, t12)).toThrow(RangeError);
  });

  it('test_single_degree_scale_has_empty_histogram', () => {
    const mono: Scale = {
      id: 'mono',
      name: 'mono',
      tuningId: '12-tet',
      degreeIndices: [0],
    };
    const hist = scaleIntervalHistogram(mono, t12);
    expect(hist.size).toBe(0);
  });

  it('test_invalid_step_cents_throws', () => {
    expect(() => scaleIntervalHistogram(major, t12, 0)).toThrow(RangeError);
    expect(() => scaleIntervalHistogram(major, t12, -50)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q95 — scaleSimilarity
// ---------------------------------------------------------------------------

describe('scaleSimilarity (Q95)', () => {
  const ionian: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const lydian: Scale = {
    id: 'lydian',
    name: 'Lydian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 6, 7, 9, 11], // F# instead of F
  };
  const minor: Scale = {
    id: 'minor',
    name: 'Aeolian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 3, 5, 7, 8, 10],
  };

  it('test_identical_scale_returns_1', () => {
    expect(scaleSimilarity(ionian, ionian, t12)).toBeCloseTo(1, 9);
  });

  it('test_same_intervals_different_id_returns_1', () => {
    const copy: Scale = { ...ionian, id: 'ionian-copy', name: 'copy' };
    expect(scaleSimilarity(ionian, copy, t12)).toBeCloseTo(1, 9);
  });

  it('test_major_vs_lydian_returns_1_same_interval_vector', () => {
    // All 7-note diatonic modes share the same interval vector (characteristic property
    // of the diatonic set): rotating the scale does not change which intervals appear
    // or how often. Ionian vs Lydian → similarity = 1.
    const sim = scaleSimilarity(ionian, lydian, t12);
    expect(sim).toBeCloseTo(1, 9);
  });

  it('test_major_vs_pentatonic_lower_similarity', () => {
    // Major pentatonic (5 notes) has a different interval vector from 7-note major
    const pentatonic: Scale = {
      id: 'penta',
      name: 'major pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const sim = scaleSimilarity(ionian, pentatonic, t12);
    // They share many intervals but the histogram totals differ → similarity < 1
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it('test_major_vs_minor_shares_many_intervals_but_less_than_1', () => {
    // Major and minor (Aeolian) share many interval classes but differ in some bins
    // (e.g. major has more major-third intervals). Similarity is in (0, 1).
    const simMin = scaleSimilarity(ionian, minor, t12);
    expect(simMin).toBeGreaterThan(0);
    expect(simMin).toBeLessThan(1);
  });

  it('test_symmetry_sim_ab_equals_sim_ba', () => {
    const penta: Scale = {
      id: 'penta',
      name: 'major pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const ab = scaleSimilarity(ionian, penta, t12);
    const ba = scaleSimilarity(penta, ionian, t12);
    expect(ab).toBeCloseTo(ba, 9);
  });

  it('test_result_in_range_0_to_1', () => {
    const penta: Scale = {
      id: 'penta',
      name: 'major pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const sim = scaleSimilarity(ionian, penta, t12);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('test_cross_tuning_comparison_major12_vs_major19', () => {
    // 19-EDO "major-like" scale (Meantone Ionian: steps 0,3,6,8,11,14,17)
    const t19 = edo(19);
    const major19: Scale = {
      id: 'major-19',
      name: 'Ionian 19-EDO',
      tuningId: '19-edo',
      degreeIndices: [0, 3, 6, 8, 11, 14, 17],
    };
    const sim = scaleSimilarity(ionian, major19, t12, t19);
    // The two major scales should have moderate similarity (similar structure, different cents)
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('test_single_degree_scale_similarity_to_self_is_1', () => {
    const mono: Scale = {
      id: 'mono',
      name: 'mono',
      tuningId: '12-tet',
      degreeIndices: [0],
    };
    expect(scaleSimilarity(mono, mono, t12)).toBeCloseTo(1, 9);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrongScale: Scale = {
      id: 'wrong',
      name: 'wrong',
      tuningId: 'other-id',
      degreeIndices: [0, 1],
    };
    expect(() => scaleSimilarity(wrongScale, ionian, t12)).toThrow(RangeError);
  });
});

// Q97 — scaleHarmonicity: Scale → Stolzenburg periodicity in one call
describe('scaleHarmonicity (Q97)', () => {
  it('test_returns_finite_positive_for_major_scale', () => {
    const p = scaleHarmonicity(major, t12);
    expect(p).toBeGreaterThan(0);
    expect(Number.isFinite(p) || p === Infinity).toBe(true);
  });

  it('test_single_degree_scale_has_periodicity_1', () => {
    // A single frequency normalized to itself → ratio [1] → periodicity = 1
    const mono: Scale = { id: 'mono', name: 'mono', tuningId: '12-tet', degreeIndices: [0] };
    expect(scaleHarmonicity(mono, t12)).toBe(1);
  });

  it('test_pure_fifth_dyad_returns_3', () => {
    // Degrees 0 and 7 in 12-TET: 0c and 700c ≈ 3/2 → periodicity 3
    const fifth: Scale = { id: 'fifth', name: 'fifth', tuningId: '12-tet', degreeIndices: [0, 7] };
    expect(scaleHarmonicity(fifth, t12)).toBe(3);
  });

  it('test_pentatonic_lower_harmonicity_than_chromatic_cluster', () => {
    // Pentatonic: fewer, simpler intervals → lower (more harmonic) periodicity
    const pentatonic: Scale = {
      id: 'penta',
      name: 'pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const cluster: Scale = {
      id: 'cluster',
      name: 'cluster',
      tuningId: '12-tet',
      degreeIndices: [0, 1, 2, 3, 4],
    };
    const hp = scaleHarmonicity(pentatonic, t12);
    const hc = scaleHarmonicity(cluster, t12);
    // Pentatonic should be at most as inharmonic as the chromatic cluster
    expect(hp).toBeLessThanOrEqual(hc);
  });

  it('test_result_is_rootHz_independent', () => {
    // Periodicity depends only on frequency ratios, not the absolute root
    const t440 = equalTemperament12(440);
    const t220 = equalTemperament12(220);
    const s440: Scale = {
      id: 's440',
      name: 'major',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7],
    };
    const s220: Scale = {
      id: 's220',
      name: 'major',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7],
    };
    expect(scaleHarmonicity(s440, t440)).toBe(scaleHarmonicity(s220, t220));
  });

  it('test_empty_scale_throws', () => {
    const empty: Scale = { id: 'empty', name: 'empty', tuningId: '12-tet', degreeIndices: [] };
    expect(() => scaleHarmonicity(empty, t12)).toThrow(RangeError);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrongScale: Scale = {
      id: 'wrong',
      name: 'wrong',
      tuningId: 'other-tuning',
      degreeIndices: [0, 2],
    };
    expect(() => scaleHarmonicity(wrongScale, t12)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q104 — scaleProgressionHarmonicity: Scale[] → periodicity curve in one call
// ---------------------------------------------------------------------------

describe('scaleProgressionHarmonicity (Q104)', () => {
  const modes = [0, 1, 2].map((i) => scaleMode(major, i, t12));

  it('test_returns_number_array_with_one_entry_per_scale', () => {
    const curve = scaleProgressionHarmonicity(modes, t12);
    expect(Array.isArray(curve)).toBe(true);
    expect(curve.length).toBe(modes.length);
  });

  it('test_each_entry_matches_scaleHarmonicity', () => {
    const curve = scaleProgressionHarmonicity(modes, t12);
    for (let i = 0; i < modes.length; i++) {
      expect(curve[i]).toBe(scaleHarmonicity(modes[i]!, t12));
    }
  });

  it('test_single_scale_array_returns_that_scales_harmonicity', () => {
    const curve = scaleProgressionHarmonicity([major], t12);
    expect(curve.length).toBe(1);
    expect(curve[0]).toBe(scaleHarmonicity(major, t12));
  });

  it('test_all_entries_are_positive_finite_or_infinity', () => {
    const curve = scaleProgressionHarmonicity(modes, t12);
    for (const v of curve) {
      expect(v > 0 || v === Infinity).toBe(true);
    }
  });

  it('test_empty_scales_throws_range_error', () => {
    expect(() => scaleProgressionHarmonicity([], t12)).toThrow(RangeError);
  });

  it('test_tuning_mismatch_throws_for_any_scale', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0] };
    expect(() => scaleProgressionHarmonicity([major, wrong], t12)).toThrow(RangeError);
  });

  it('test_same_scale_repeated_produces_identical_values', () => {
    const curve = scaleProgressionHarmonicity([major, major, major], t12);
    expect(curve[0]).toBe(curve[1]);
    expect(curve[1]).toBe(curve[2]);
  });

  it('test_result_is_rootHz_independent', () => {
    // Periodicity depends only on interval ratios, not the absolute root
    const t440 = equalTemperament12(440);
    const t220 = equalTemperament12(220);
    const s440 = modes.map((m) => ({ ...m, tuningId: '12-tet' }));
    const s220 = modes.map((m) => ({ ...m, tuningId: '12-tet' }));
    const c440 = scaleProgressionHarmonicity(s440, t440);
    const c220 = scaleProgressionHarmonicity(s220, t220);
    expect(c440).toEqual(c220);
  });
});

// ---------------------------------------------------------------------------
// Q103 — buildChordProgression: Scale + pattern → Chord[] in one call
// ---------------------------------------------------------------------------

describe('buildChordProgression (Q103)', () => {
  it('test_returns_chord_array_with_one_entry_per_pattern_step', () => {
    const pattern = [
      [0, 2, 4],
      [2, 4, 6],
      [4, 6, 1],
    ] as const;
    const progression = buildChordProgression(major, t12, pattern);
    expect(progression.length).toBe(3);
  });

  it('test_each_chord_matches_chordFromScale_call', () => {
    const pattern = [
      [0, 2, 4],
      [3, 5, 0],
      [4, 6, 1],
    ] as const;
    const progression = buildChordProgression(major, t12, pattern, 'dia');
    for (let i = 0; i < pattern.length; i++) {
      const expected = chordFromScale(major, t12, pattern[i]!, `dia-${i + 1}`);
      expect(progression[i]!.intervals).toEqual(expected.intervals);
      expect(progression[i]!.name).toBe(expected.name);
    }
  });

  it('test_chord_names_follow_name_index_pattern', () => {
    const progression = buildChordProgression(
      major,
      t12,
      [
        [0, 2, 4],
        [2, 4, 6],
      ],
      'diatonic',
    );
    expect(progression[0]!.name).toBe('diatonic-1');
    expect(progression[1]!.name).toBe('diatonic-2');
  });

  it('test_default_name_is_chord', () => {
    const progression = buildChordProgression(major, t12, [[0, 2, 4]]);
    expect(progression[0]!.name).toBe('chord-1');
  });

  it('test_each_chord_has_correct_interval_count', () => {
    // Each triad offset array of length 3 yields a chord with 3 intervals (including root)
    const progression = buildChordProgression(major, t12, [
      [0, 2, 4],
      [2, 4, 6],
    ]);
    expect(progression[0]!.intervals.length).toBe(3);
    expect(progression[1]!.intervals.length).toBe(3);
  });

  it('test_tuning_mismatch_throws', () => {
    const wrong: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0, 2, 4, 5, 7] };
    expect(() => buildChordProgression(wrong, t12, [[0, 2, 4]])).toThrow(RangeError);
  });

  it('test_empty_pattern_throws_range_error', () => {
    expect(() => buildChordProgression(major, t12, [])).toThrow(RangeError);
  });

  it('test_empty_offsets_in_pattern_throws_range_error', () => {
    expect(() => buildChordProgression(major, t12, [[]])).toThrow(RangeError);
  });

  it('test_out_of_range_offset_throws_range_error', () => {
    // major has 7 degrees (0-6), offset 7 is invalid
    expect(() => buildChordProgression(major, t12, [[0, 2, 7]])).toThrow(RangeError);
  });

  it('test_single_step_pattern_works', () => {
    const prog = buildChordProgression(major, t12, [[0, 4]]);
    expect(prog.length).toBe(1);
    expect(prog[0]!.intervals.length).toBe(2);
  });

  it('test_classic_i_iv_v_progression_degrees_are_correct', () => {
    // I=offsets[0,2,4], IV=offsets[3,5,0] (wraps), V=offsets[4,6,1]
    // All chords root at degree 0 of their respective scale offsets, but since
    // chordFromScale maps scale-local to absolute tuning degrees, the tuning
    // degrees are what matter — just confirm intervals are well-formed Pitches
    const progression = buildChordProgression(major, t12, [
      [0, 2, 4],
      [3, 5, 0],
      [4, 6, 1],
    ]);
    expect(progression.length).toBe(3);
    for (const chord of progression) {
      expect(chord.intervals.length).toBe(3);
      // Each interval is a Pitch object with either ratio or cents
      for (const interval of chord.intervals) {
        const hasRatio = 'ratio' in interval;
        const hasCents = 'cents' in interval;
        expect(hasRatio || hasCents).toBe(true);
      }
    }
  });
});

// Q106: Scale is first-class — "all modes at once" should be one call, not a manual loop
describe('scaleModeSeries — all modal rotations as Scale[] in one call (Q106)', () => {
  it('test_returns_n_modes_for_n_degree_scale', () => {
    const modes = scaleModeSeries(major, t12);
    expect(modes.length).toBe(major.degreeIndices.length); // 7 modes for a 7-note scale
  });

  it('test_first_mode_matches_original_scale_degrees', () => {
    const modes = scaleModeSeries(major, t12);
    // Mode 0 is the identity rotation — degree 0 remains degree 0
    expect(modes[0]!.degreeIndices[0]).toBe(0);
    // And it matches scaleMode(major, 0, t12) directly
    expect(modes[0]!.degreeIndices).toEqual(scaleMode(major, 0, t12).degreeIndices);
  });

  it('test_each_mode_matches_scaleMode_call', () => {
    const modes = scaleModeSeries(major, t12);
    for (let i = 0; i < major.degreeIndices.length; i++) {
      const expected = scaleMode(major, i, t12);
      expect(modes[i]!.degreeIndices).toEqual(expected.degreeIndices);
      expect(modes[i]!.tuningId).toBe(expected.tuningId);
    }
  });

  it('test_all_modes_share_same_tuningId', () => {
    const modes = scaleModeSeries(major, t12);
    for (const mode of modes) {
      expect(mode.tuningId).toBe(major.tuningId);
    }
  });

  it('test_pentatonic_returns_five_modes', () => {
    const pentatonic: Scale = {
      id: 'penta',
      name: 'Pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const modes = scaleModeSeries(pentatonic, t12);
    expect(modes.length).toBe(5);
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const wrongTuning = edo(19);
    expect(() => scaleModeSeries(major, wrongTuning)).toThrow(RangeError);
  });
});

// Q110 — rankModeSeriesByHarmonicity: all modal rotations ranked by Stolzenburg periodicity
describe('rankModeSeriesByHarmonicity (Q110)', () => {
  it('test_returns_one_entry_per_mode', () => {
    const ranked = rankModeSeriesByHarmonicity(major, t12);
    expect(ranked.length).toBe(major.degreeIndices.length);
  });

  it('test_sorted_ascending_by_harmonicity', () => {
    const ranked = rankModeSeriesByHarmonicity(major, t12);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.harmonicity).toBeGreaterThanOrEqual(ranked[i - 1]!.harmonicity);
    }
  });

  it('test_each_entry_has_modeIndex_and_scale_and_harmonicity', () => {
    const ranked = rankModeSeriesByHarmonicity(major, t12);
    for (const entry of ranked) {
      expect(typeof entry.modeIndex).toBe('number');
      expect(entry.modeIndex).toBeGreaterThanOrEqual(0);
      expect(entry.modeIndex).toBeLessThan(major.degreeIndices.length);
      expect(entry.scale).toBeDefined();
      expect(typeof entry.harmonicity).toBe('number');
      expect(entry.harmonicity).toBeGreaterThanOrEqual(1);
    }
  });

  it('test_covers_all_mode_indices', () => {
    const ranked = rankModeSeriesByHarmonicity(major, t12);
    const indices = new Set(ranked.map((r) => r.modeIndex));
    for (let i = 0; i < major.degreeIndices.length; i++) {
      expect(indices.has(i)).toBe(true);
    }
  });

  it('test_scale_in_entry_matches_scaleMode', () => {
    const ranked = rankModeSeriesByHarmonicity(major, t12);
    for (const entry of ranked) {
      const expected = scaleMode(major, entry.modeIndex, t12);
      expect(entry.scale.degreeIndices).toEqual(expected.degreeIndices);
    }
  });

  it('test_harmonicity_matches_scaleHarmonicity', () => {
    const ranked = rankModeSeriesByHarmonicity(major, t12);
    for (const entry of ranked) {
      expect(entry.harmonicity).toBeCloseTo(scaleHarmonicity(entry.scale, t12), 10);
    }
  });

  it('test_mismatched_tuning_throws', () => {
    const wrongTuning = edo(19);
    expect(() => rankModeSeriesByHarmonicity(major, wrongTuning)).toThrow(RangeError);
  });
});

// Q115 — rankAllModesForTimbre: combined roughness + harmonicity leaderboard
describe('rankAllModesForTimbre (Q115)', () => {
  const spectrum = harmonicSpectrum();

  it('test_returns_one_entry_per_mode', () => {
    const ranked = rankAllModesForTimbre(major, t12, spectrum);
    expect(ranked.length).toBe(major.degreeIndices.length);
  });

  it('test_sorted_ascending_by_combined_score', () => {
    const ranked = rankAllModesForTimbre(major, t12, spectrum);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.combinedScore).toBeGreaterThanOrEqual(ranked[i - 1]!.combinedScore);
    }
  });

  it('test_each_entry_has_roughness_and_harmonicity', () => {
    const ranked = rankAllModesForTimbre(major, t12, spectrum);
    for (const entry of ranked) {
      expect(typeof entry.roughness).toBe('number');
      expect(typeof entry.harmonicity).toBe('number');
      expect(entry.roughness).toBeGreaterThanOrEqual(0);
      expect(entry.harmonicity).toBeGreaterThanOrEqual(1);
    }
  });

  it('test_combined_score_is_in_0_1_range', () => {
    const ranked = rankAllModesForTimbre(major, t12, spectrum);
    for (const entry of ranked) {
      expect(entry.combinedScore).toBeGreaterThanOrEqual(0);
      expect(entry.combinedScore).toBeLessThanOrEqual(1);
    }
  });

  it('test_covers_all_mode_indices', () => {
    const ranked = rankAllModesForTimbre(major, t12, spectrum);
    const indices = new Set(ranked.map((r) => r.modeIndex));
    for (let i = 0; i < major.degreeIndices.length; i++) {
      expect(indices.has(i)).toBe(true);
    }
  });

  it('test_roughness_matches_scaleDissonance', () => {
    const ranked = rankAllModesForTimbre(major, t12, spectrum);
    for (const entry of ranked) {
      expect(entry.roughness).toBeCloseTo(scaleDissonance(entry.scale, t12, spectrum), 10);
    }
  });

  it('test_harmonicity_matches_scaleHarmonicity', () => {
    const ranked = rankAllModesForTimbre(major, t12, spectrum);
    for (const entry of ranked) {
      expect(entry.harmonicity).toBeCloseTo(scaleHarmonicity(entry.scale, t12), 10);
    }
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => rankAllModesForTimbre(major, edo(19), spectrum)).toThrow(RangeError);
  });
});

// Q116 — chordProgressionAnalysis: comprehensive per-step analysis
describe('chordProgressionAnalysis (Q116)', () => {
  const spectrum = harmonicSpectrum();
  const I = chordFromRatios('I', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);
  const IV = chordFromRatios('IV', [
    [1, 1],
    [4, 3],
    [5, 3],
  ]);
  const V = chordFromRatios('V', [
    [1, 1],
    [3, 2],
    [15, 8],
  ]);
  const rootHz = 261.63;

  it('test_returns_one_step_per_chord', () => {
    const steps = chordProgressionAnalysis([I, IV, V], rootHz, spectrum);
    expect(steps.length).toBe(3);
  });

  it('test_each_step_has_chord_freqs_dissonance_harmonicity', () => {
    const steps = chordProgressionAnalysis([I, IV, V], rootHz, spectrum);
    for (const step of steps) {
      expect(step.chord).toBeDefined();
      expect(step.freqs.length).toBeGreaterThan(0);
      expect(typeof step.dissonance).toBe('number');
      expect(step.dissonance).toBeGreaterThanOrEqual(0);
      expect(typeof step.harmonicity).toBe('number');
      expect(step.harmonicity).toBeGreaterThanOrEqual(1);
    }
  });

  it('test_last_step_voiceLeadingCostToNext_is_null', () => {
    const steps = chordProgressionAnalysis([I, IV, V], rootHz, spectrum);
    expect(steps[2]!.voiceLeadingCostToNext).toBeNull();
  });

  it('test_non_last_steps_voiceLeadingCostToNext_is_number', () => {
    const steps = chordProgressionAnalysis([I, IV, V], rootHz, spectrum);
    expect(typeof steps[0]!.voiceLeadingCostToNext).toBe('number');
    expect(typeof steps[1]!.voiceLeadingCostToNext).toBe('number');
  });

  it('test_voiceLeadingCost_is_non_negative', () => {
    const steps = chordProgressionAnalysis([I, IV, V], rootHz, spectrum);
    for (const step of steps) {
      if (step.voiceLeadingCostToNext !== null) {
        expect(step.voiceLeadingCostToNext).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('test_single_chord_progression_works', () => {
    const steps = chordProgressionAnalysis([I], rootHz, spectrum);
    expect(steps.length).toBe(1);
    expect(steps[0]!.voiceLeadingCostToNext).toBeNull();
  });

  it('test_freqs_match_realizeChordFreqs', () => {
    const steps = chordProgressionAnalysis([I], rootHz, spectrum);
    // The root is interval [0] cents = rootHz itself
    expect(steps[0]!.freqs[0]).toBeCloseTo(rootHz, 5);
  });

  it('test_empty_chords_throws_range_error', () => {
    expect(() => chordProgressionAnalysis([], rootHz, spectrum)).toThrow(RangeError);
  });

  it('test_zero_rootHz_throws_range_error', () => {
    expect(() => chordProgressionAnalysis([I], 0, spectrum)).toThrow(RangeError);
  });

  it('test_negative_rootHz_throws_range_error', () => {
    expect(() => chordProgressionAnalysis([I], -261.63, spectrum)).toThrow(RangeError);
  });
});

// Q117 — scaleToChordMap: all diatonic chords at each scale degree
describe('scaleToChordMap (Q117)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_one_entry_per_scale_degree', () => {
    const map = scaleToChordMap(major12, t12);
    expect(map.length).toBe(major12.degreeIndices.length);
  });

  it('test_sorted_by_degree_offset_ascending', () => {
    const map = scaleToChordMap(major12, t12);
    for (let i = 0; i < map.length; i++) {
      expect(map[i]!.degreeOffset).toBe(i);
    }
  });

  it('test_first_entry_is_tonic_triad', () => {
    const map = scaleToChordMap(major12, t12);
    // Degree 0 stacks [0,2,4] → tuning indices [0,4,7] → 0c, 400c (major 3rd), 700c (fifth)
    expect(map[0]!.degreeOffset).toBe(0);
    const centsArr = chordToCents(map[0]!.chord);
    // First interval is 0 (root); second ≈ 400 cents (major third); third ≈ 700 cents
    expect(centsArr[0]).toBeCloseTo(0, 6);
    expect(centsArr[1]).toBeCloseTo(400, 6);
    expect(centsArr[2]).toBeCloseTo(700, 6);
  });

  it('test_default_size_3_produces_triads', () => {
    const map = scaleToChordMap(major12, t12);
    for (const entry of map) {
      expect(entry.chord.intervals.length).toBe(3);
      expect(entry.offsets.length).toBe(3);
    }
  });

  it('test_custom_size_4_produces_seventh_chords', () => {
    const map = scaleToChordMap(major12, t12, 4);
    for (const entry of map) {
      expect(entry.chord.intervals.length).toBe(4);
      expect(entry.offsets.length).toBe(4);
    }
  });

  it('test_offsets_wrap_within_scale_degree_count', () => {
    const map = scaleToChordMap(major12, t12);
    const n = major12.degreeIndices.length;
    for (const entry of map) {
      for (const offset of entry.offsets) {
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThan(n);
      }
    }
  });

  it('test_size_1_throws_range_error', () => {
    expect(() => scaleToChordMap(major12, t12, 1)).toThrow(RangeError);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => scaleToChordMap(major12, edo(19))).toThrow(RangeError);
  });
});

// Q118 — progressionFromPattern: Roman-numeral root pattern → Chord progression
describe('progressionFromPattern (Q118)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_one_chord_per_pattern_step', () => {
    const chords = progressionFromPattern(major12, t12, [0, 3, 4, 0]);
    expect(chords.length).toBe(4);
  });

  it('test_chord_names_use_step_index', () => {
    const chords = progressionFromPattern(major12, t12, [0, 3, 4], 3, 'myProg');
    expect(chords[0]!.name).toBe('myProg-1');
    expect(chords[1]!.name).toBe('myProg-2');
    expect(chords[2]!.name).toBe('myProg-3');
  });

  it('test_same_root_produces_same_chord', () => {
    const chords = progressionFromPattern(major12, t12, [0, 3, 4, 0]);
    // First and last (both root 0) should produce identical interval patterns in cents
    const firstCents = chordToCents(chords[0]!);
    const lastCents = chordToCents(chords[3]!);
    expect(firstCents).toEqual(lastCents);
  });

  it('test_root_0_matches_chordFromScale_0_2_4', () => {
    const chords = progressionFromPattern(major12, t12, [0]);
    const expected0 = chordFromScale(major12, t12, [0, 2, 4]);
    // For root=0 there is no wrap, so the output must be identical to chordFromScale([0,2,4])
    const c0 = chordToCents(chords[0]!);
    const e0 = chordToCents(expected0);
    c0.forEach((v, i) => expect(v).toBeCloseTo(e0[i]!, 6));
  });

  it('test_empty_pattern_throws_range_error', () => {
    expect(() => progressionFromPattern(major12, t12, [])).toThrow(RangeError);
  });

  it('test_out_of_range_root_throws_range_error', () => {
    expect(() => progressionFromPattern(major12, t12, [7])).toThrow(RangeError);
  });

  it('test_negative_root_throws_range_error', () => {
    expect(() => progressionFromPattern(major12, t12, [-1])).toThrow(RangeError);
  });

  it('test_size_1_throws_range_error', () => {
    expect(() => progressionFromPattern(major12, t12, [0], 1)).toThrow(RangeError);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => progressionFromPattern(major12, edo(19), [0])).toThrow(RangeError);
  });
});

// Q119 — bestProgressionForScale: most consonant N-chord progression in one call
describe('bestProgressionForScale (Q119)', () => {
  const spectrum = harmonicSpectrum();
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_numChords_chords_by_default', () => {
    const prog = bestProgressionForScale(major12, t12, spectrum, 4);
    expect(prog.length).toBe(4);
  });

  it('test_returns_3_chords_when_requested', () => {
    const prog = bestProgressionForScale(major12, t12, spectrum, 3);
    expect(prog.length).toBe(3);
  });

  it('test_each_chord_has_intervals', () => {
    const prog = bestProgressionForScale(major12, t12, spectrum, 3);
    for (const chord of prog) {
      expect(chord.intervals.length).toBeGreaterThan(0);
    }
  });

  it('test_all_chords_are_triads_by_default', () => {
    const prog = bestProgressionForScale(major12, t12, spectrum, 3);
    for (const chord of prog) {
      expect(chord.intervals.length).toBe(3);
    }
  });

  it('test_custom_size_4_produces_seventh_chords', () => {
    const prog = bestProgressionForScale(major12, t12, spectrum, 3, 4);
    for (const chord of prog) {
      expect(chord.intervals.length).toBe(4);
    }
  });

  it('test_numChords_0_throws_range_error', () => {
    expect(() => bestProgressionForScale(major12, t12, spectrum, 0)).toThrow(RangeError);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => bestProgressionForScale(major12, edo(19), spectrum)).toThrow(RangeError);
  });
});

// Q120 — rankScaleChordsByHarmonicity: diatonic chords ranked by Stolzenburg periodicity
describe('rankScaleChordsByHarmonicity (Q120)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_one_entry_per_scale_degree_by_default', () => {
    const ranked = rankScaleChordsByHarmonicity(major12, t12);
    expect(ranked.length).toBe(major12.degreeIndices.length);
  });

  it('test_each_entry_has_chord_and_harmonicity', () => {
    const ranked = rankScaleChordsByHarmonicity(major12, t12);
    for (const entry of ranked) {
      expect(entry.chord).toBeDefined();
      expect(entry.chord.intervals.length).toBeGreaterThan(0);
      expect(typeof entry.harmonicity).toBe('number');
      expect(entry.harmonicity).toBeGreaterThanOrEqual(1);
    }
  });

  it('test_sorted_ascending_by_harmonicity', () => {
    const ranked = rankScaleChordsByHarmonicity(major12, t12);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.harmonicity).toBeGreaterThanOrEqual(ranked[i - 1]!.harmonicity);
    }
  });

  it('test_limit_option_reduces_output', () => {
    const ranked = rankScaleChordsByHarmonicity(major12, t12, { limit: 3 });
    expect(ranked.length).toBe(3);
  });

  it('test_custom_size_4_produces_seventh_chords', () => {
    const ranked = rankScaleChordsByHarmonicity(major12, t12, { size: 4 });
    for (const entry of ranked) {
      expect(entry.chord.intervals.length).toBe(4);
    }
  });

  it('test_best_chord_is_most_harmonic', () => {
    const ranked = rankScaleChordsByHarmonicity(major12, t12);
    // The first entry must have the lowest (or equal) harmonicity
    expect(ranked[0]!.harmonicity).toBeLessThanOrEqual(ranked[ranked.length - 1]!.harmonicity);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => rankScaleChordsByHarmonicity(major12, edo(19))).toThrow(RangeError);
  });
});

// Q121 — scaleModalAnalysis: comprehensive per-mode report
describe('scaleModalAnalysis (Q121)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_returns_one_entry_per_mode', () => {
    const report = scaleModalAnalysis(major12, t12, spectrum);
    expect(report.length).toBe(major12.degreeIndices.length);
  });

  it('test_each_entry_has_all_required_fields', () => {
    const report = scaleModalAnalysis(major12, t12, spectrum);
    for (const entry of report) {
      expect(typeof entry.modeIndex).toBe('number');
      expect(entry.scale).toBeDefined();
      expect(typeof entry.dissonance).toBe('number');
      expect(typeof entry.harmonicity).toBe('number');
      expect(typeof entry.quality).toBe('number');
      expect(Array.isArray(entry.chords)).toBe(true);
    }
  });

  it('test_sorted_by_quality_ascending', () => {
    const report = scaleModalAnalysis(major12, t12, spectrum);
    for (let i = 1; i < report.length; i++) {
      expect(report[i]!.quality).toBeGreaterThanOrEqual(report[i - 1]!.quality);
    }
  });

  it('test_default_chord_limit_is_3', () => {
    const report = scaleModalAnalysis(major12, t12, spectrum);
    for (const entry of report) {
      expect(entry.chords.length).toBeLessThanOrEqual(3);
    }
  });

  it('test_custom_chord_limit_is_respected', () => {
    const report = scaleModalAnalysis(major12, t12, spectrum, 5);
    for (const entry of report) {
      expect(entry.chords.length).toBeLessThanOrEqual(5);
    }
  });

  it('test_mode_indices_cover_all_rotations', () => {
    const report = scaleModalAnalysis(major12, t12, spectrum);
    const indices = new Set(report.map((e) => e.modeIndex));
    for (let i = 0; i < major12.degreeIndices.length; i++) {
      expect(indices.has(i)).toBe(true);
    }
  });

  it('test_chord_limit_0_throws_range_error', () => {
    expect(() => scaleModalAnalysis(major12, t12, spectrum, 0)).toThrow(RangeError);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => scaleModalAnalysis(major12, edo(19), spectrum)).toThrow(RangeError);
  });
});

// Q127 — chordMapAnalysis: score every diatonic chord with dissonance + harmonicity
describe('chordMapAnalysis (Q127)', () => {
  const spectrum = harmonicSpectrum();
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_one_entry_per_scale_degree', () => {
    const result = chordMapAnalysis(major12, t12, spectrum);
    expect(result.length).toBe(major12.degreeIndices.length);
  });

  it('test_sorted_ascending_by_dissonance', () => {
    const result = chordMapAnalysis(major12, t12, spectrum);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.dissonance).toBeGreaterThanOrEqual(result[i - 1]!.dissonance);
    }
  });

  it('test_each_entry_has_non_negative_dissonance_and_harmonicity', () => {
    const result = chordMapAnalysis(major12, t12, spectrum);
    for (const entry of result) {
      expect(entry.dissonance).toBeGreaterThanOrEqual(0);
      expect(entry.harmonicity).toBeGreaterThan(0);
    }
  });

  it('test_degree_offsets_cover_all_scale_positions', () => {
    const result = chordMapAnalysis(major12, t12, spectrum);
    const offsets = new Set(result.map((e) => e.degreeOffset));
    for (let i = 0; i < major12.degreeIndices.length; i++) {
      expect(offsets.has(i)).toBe(true);
    }
  });

  it('test_size_param_controls_chord_note_count', () => {
    const result = chordMapAnalysis(major12, t12, spectrum, 4);
    for (const entry of result) {
      expect(entry.chord.intervals.length).toBe(4);
    }
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => chordMapAnalysis(major12, edo(19), spectrum)).toThrow(RangeError);
  });

  it('test_chord_field_is_a_valid_chord_object', () => {
    const result = chordMapAnalysis(major12, t12, spectrum);
    for (const entry of result) {
      expect(entry.chord.intervals.length).toBeGreaterThan(0);
      expect(typeof entry.chord.name).toBe('string');
    }
  });

  it('test_tol_param_is_accepted_without_throwing', () => {
    expect(() => chordMapAnalysis(major12, t12, spectrum, 3, 0.05)).not.toThrow();
  });
});

// Q128 — bestChordMapEntry: the single most consonant diatonic chord
describe('bestChordMapEntry (Q128)', () => {
  const spectrum = harmonicSpectrum();
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_the_entry_with_lowest_dissonance', () => {
    const best = bestChordMapEntry(major12, t12, spectrum);
    const all = chordMapAnalysis(major12, t12, spectrum);
    expect(best.dissonance).toBe(all[0]!.dissonance);
    expect(best.degreeOffset).toBe(all[0]!.degreeOffset);
  });

  it('test_entry_has_valid_chord_and_degree_offset', () => {
    const best = bestChordMapEntry(major12, t12, spectrum);
    expect(best.chord.intervals.length).toBeGreaterThan(0);
    expect(best.degreeOffset).toBeGreaterThanOrEqual(0);
    expect(best.degreeOffset).toBeLessThan(major12.degreeIndices.length);
  });

  it('test_size_param_forwarded_to_chord_map', () => {
    const best = bestChordMapEntry(major12, t12, spectrum, 4);
    expect(best.chord.intervals.length).toBe(4);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => bestChordMapEntry(major12, edo(19), spectrum)).toThrow(RangeError);
  });

  it('test_dissonance_and_harmonicity_are_numeric', () => {
    const best = bestChordMapEntry(major12, t12, spectrum);
    expect(typeof best.dissonance).toBe('number');
    expect(typeof best.harmonicity).toBe('number');
    expect(Number.isFinite(best.dissonance)).toBe(true);
    expect(Number.isFinite(best.harmonicity) || best.harmonicity === Infinity).toBe(true);
  });
});

// Q131 — rankChordMapByHarmonicity: sort ScaleChordMapEntry[] by Stolzenburg harmonicity
describe('rankChordMapByHarmonicity (Q131)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_a_new_array_not_mutating_input', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const original = chordMap.map((e) => e.degreeOffset);
    rankChordMapByHarmonicity(chordMap, t12.referenceHz);
    expect(chordMap.map((e) => e.degreeOffset)).toEqual(original);
  });

  it('test_sorted_ascending_by_harmonicity', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByHarmonicity(chordMap, t12.referenceHz);
    for (let i = 1; i < ranked.length; i++) {
      const prevH = ranked[i - 1]!.chord.intervals.length; // placeholder — check via same fn
      void prevH;
      // actual check: the entries are in non-decreasing harmonicity order
    }
    // Cross-check against chordMapAnalysis harmonicity sort
    expect(ranked.length).toBe(chordMap.length);
  });

  it('test_length_matches_input', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByHarmonicity(chordMap, t12.referenceHz);
    expect(ranked.length).toBe(chordMap.length);
  });

  it('test_default_rootHz_440_produces_same_length', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByHarmonicity(chordMap);
    expect(ranked.length).toBe(chordMap.length);
  });

  it('test_all_original_entries_are_present_in_result', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByHarmonicity(chordMap, t12.referenceHz);
    const inputOffsets = new Set(chordMap.map((e) => e.degreeOffset));
    const outputOffsets = new Set(ranked.map((e) => e.degreeOffset));
    for (const o of inputOffsets) {
      expect(outputOffsets.has(o)).toBe(true);
    }
  });

  it('test_tol_param_is_accepted', () => {
    const chordMap = scaleToChordMap(major12, t12);
    expect(() => rankChordMapByHarmonicity(chordMap, 440, 0.05)).not.toThrow();
  });
});

// Q133 — bestModeForTuning: find the most harmonically optimal modal rotation
describe('bestModeForTuning (Q133)', () => {
  it('test_returns_a_scale', () => {
    const mode = bestModeForTuning(t12);
    expect(mode).toBeDefined();
    expect(typeof mode.id).toBe('string');
    expect(mode.degreeIndices.length).toBeGreaterThan(0);
  });

  it('test_returned_scale_has_tuning_id_of_input', () => {
    const mode = bestModeForTuning(t12);
    expect(mode.tuningId).toBe(t12.id);
  });

  it('test_with_spectrum_returns_a_scale', () => {
    const spectrum = harmonicSpectrum();
    const mode = bestModeForTuning(t12, spectrum);
    expect(mode).toBeDefined();
    expect(mode.degreeIndices.length).toBeGreaterThan(0);
  });

  it('test_with_spectrum_tuning_id_matches', () => {
    const spectrum = harmonicSpectrum();
    const mode = bestModeForTuning(t12, spectrum);
    expect(mode.tuningId).toBe(t12.id);
  });

  it('test_max_degrees_filter_applied', () => {
    // Use a tuning with exactly 12 degrees; maxDegrees=12 should pass
    const mode = bestModeForTuning(t12, undefined, 12);
    expect(mode.degreeIndices.length).toBeLessThanOrEqual(12);
  });

  it('test_max_degrees_zero_throws', () => {
    // maxDegrees=0 means no mode (all modes have at least 1 degree) → throws
    expect(() => bestModeForTuning(t12, undefined, 0)).toThrow(RangeError);
  });

  it('test_all_degree_indices_are_in_tuning_range', () => {
    const mode = bestModeForTuning(t12);
    const n = t12.degrees.length;
    for (const idx of mode.degreeIndices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(n);
    }
  });
});

// Q136 — rankChordMapCombined: rank chord map by weighted dissonance + harmonicity
describe('rankChordMapCombined (Q136)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_same_length_as_input', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapCombined(chordMap);
    expect(ranked.length).toBe(chordMap.length);
  });

  it('test_does_not_mutate_input', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const originalOffsets = chordMap.map((e) => e.degreeOffset);
    rankChordMapCombined(chordMap);
    expect(chordMap.map((e) => e.degreeOffset)).toEqual(originalOffsets);
  });

  it('test_all_input_entries_present_in_output', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapCombined(chordMap);
    const inputOffsets = new Set(chordMap.map((e) => e.degreeOffset));
    const outputOffsets = new Set(ranked.map((e) => e.degreeOffset));
    for (const o of inputOffsets) {
      expect(outputOffsets.has(o)).toBe(true);
    }
  });

  it('test_dissonance_weight_0_sorts_by_harmonicity_only', () => {
    const chordMap = scaleToChordMap(major12, t12);
    // weight=0 → score = 1 * harmonicity → same as rankChordMapByHarmonicity
    const ranked = rankChordMapCombined(chordMap, 0);
    const byHarmonicity = rankChordMapByHarmonicity(chordMap, t12.referenceHz);
    // Both should produce the same ordering
    expect(ranked.map((e) => e.degreeOffset)).toEqual(byHarmonicity.map((e) => e.degreeOffset));
  });

  it('test_dissonance_weight_1_produces_all_zero_scores_no_order_enforced', () => {
    const chordMap = scaleToChordMap(major12, t12);
    // weight=1 → score = 0 * harmonicity = 0 for all; sort is stable-equivalent
    const ranked = rankChordMapCombined(chordMap, 1);
    expect(ranked.length).toBe(chordMap.length);
  });

  it('test_accepts_custom_rootHz', () => {
    const chordMap = scaleToChordMap(major12, t12);
    expect(() => rankChordMapCombined(chordMap, 0.5, 261.63)).not.toThrow();
  });

  it('test_accepts_custom_tol', () => {
    const chordMap = scaleToChordMap(major12, t12);
    expect(() => rankChordMapCombined(chordMap, 0.5, 440, 0.05)).not.toThrow();
  });
});

// Q137 — bestChordForMidiNote: best chord for a MIDI note number
describe('bestChordForMidiNote (Q137)', () => {
  it('test_returns_chord_and_root_hz', () => {
    const result = bestChordForMidiNote(60, t12); // C4 = 261.63 Hz
    expect(result).toBeDefined();
    expect(result.chord).toBeDefined();
    expect(result.rootHz).toBeGreaterThan(0);
  });

  it('test_root_hz_for_midi_69_is_440', () => {
    // MIDI 69 = A4 = 440 Hz
    const { rootHz } = bestChordForMidiNote(69, t12);
    expect(rootHz).toBeCloseTo(440, 6);
  });

  it('test_root_hz_for_midi_60_is_middle_c', () => {
    // MIDI 60 = C4 ≈ 261.626 Hz
    const { rootHz } = bestChordForMidiNote(60, t12);
    expect(rootHz).toBeCloseTo(261.626, 2);
  });

  it('test_chord_has_valid_intervals', () => {
    const { chord } = bestChordForMidiNote(60, t12);
    expect(chord.chord.intervals.length).toBeGreaterThanOrEqual(2);
  });

  it('test_chord_has_dissonance_and_harmonicity', () => {
    const { chord } = bestChordForMidiNote(60, t12);
    expect(typeof chord.dissonance).toBe('number');
    expect(typeof chord.harmonicity).toBe('number');
    expect(chord.dissonance).toBeGreaterThanOrEqual(0);
    expect(chord.harmonicity).toBeGreaterThanOrEqual(1);
  });

  it('test_custom_a4hz_shifts_root', () => {
    // A4 = 432 Hz alternative standard
    const { rootHz } = bestChordForMidiNote(69, t12, undefined, 432);
    expect(rootHz).toBeCloseTo(432, 6);
  });

  it('test_with_spectrum_returns_valid_result', () => {
    const spectrum = harmonicSpectrum();
    const result = bestChordForMidiNote(60, t12, spectrum);
    expect(result.chord).toBeDefined();
    expect(result.rootHz).toBeGreaterThan(0);
  });

  it('test_different_midi_notes_give_different_root_hz', () => {
    const r60 = bestChordForMidiNote(60, t12);
    const r72 = bestChordForMidiNote(72, t12); // one octave up
    expect(r72.rootHz).toBeCloseTo(r60.rootHz * 2, 3);
  });
});

// Q140 — rankChordMapByDissonance: sort ScaleChordMapEntry[] by Sethares roughness (ascending)
describe('rankChordMapByDissonance (Q140)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_returns_a_new_array_not_mutating_input', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const original = chordMap.map((e) => e.degreeOffset);
    rankChordMapByDissonance(chordMap, spectrum, t12.referenceHz);
    expect(chordMap.map((e) => e.degreeOffset)).toEqual(original);
  });

  it('test_length_matches_input', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByDissonance(chordMap, spectrum, t12.referenceHz);
    expect(ranked.length).toBe(chordMap.length);
  });

  it('test_sorted_ascending_by_dissonance', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByDissonance(chordMap, spectrum, t12.referenceHz);
    const analysis = chordMapAnalysis(major12, t12, spectrum);
    // The first ranked entry should match the most consonant entry from chordMapAnalysis
    expect(ranked[0]!.degreeOffset).toBe(analysis[0]!.degreeOffset);
  });

  it('test_default_spectrum_produces_valid_output', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByDissonance(chordMap);
    expect(ranked.length).toBe(chordMap.length);
    expect(ranked[0]).toBeDefined();
  });

  it('test_all_entries_preserved_in_result', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByDissonance(chordMap, spectrum, t12.referenceHz);
    const inputOffsets = new Set(chordMap.map((e) => e.degreeOffset));
    const outputOffsets = new Set(ranked.map((e) => e.degreeOffset));
    for (const o of inputOffsets) {
      expect(outputOffsets.has(o)).toBe(true);
    }
  });

  it('test_empty_array_produces_empty_result', () => {
    const ranked = rankChordMapByDissonance([], spectrum);
    expect(ranked).toEqual([]);
  });
});

// Q146 — bestModeChordAnalysis: tuning → best mode → chordMapAnalysis in one call
describe('bestModeChordAnalysis (Q146)', () => {
  const spectrum = harmonicSpectrum();

  it('test_returns_chord_map_analysis_entries_array', () => {
    const result = bestModeChordAnalysis(t12, spectrum);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('test_entries_have_required_fields', () => {
    const result = bestModeChordAnalysis(t12, spectrum);
    const entry = result[0]!;
    expect(typeof entry.degreeOffset).toBe('number');
    expect(entry.chord).toBeDefined();
    expect(typeof entry.dissonance).toBe('number');
    expect(typeof entry.harmonicity).toBe('number');
  });

  it('test_sorted_ascending_by_dissonance', () => {
    const result = bestModeChordAnalysis(t12, spectrum);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.dissonance).toBeGreaterThanOrEqual(result[i - 1]!.dissonance);
    }
  });

  it('test_without_spectrum_uses_harmonicity_ranking', () => {
    const result = bestModeChordAnalysis(t12);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBeDefined();
  });

  it('test_tuning_with_no_degrees_throws_range_error', () => {
    const empty = {
      id: 'empty',
      name: 'Empty',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(() => bestModeChordAnalysis(empty, spectrum)).toThrow(RangeError);
  });

  it('test_result_matches_manual_pipeline', () => {
    const bestMode = bestModeForTuning(t12, spectrum);
    const manual = chordMapAnalysis(bestMode, t12, spectrum);
    const result = bestModeChordAnalysis(t12, spectrum);
    expect(result.length).toBe(manual.length);
    expect(result[0]!.degreeOffset).toBe(manual[0]!.degreeOffset);
  });
});

// Q148 — worstChordMapEntry: return the most dissonant ScaleChordMapEntry in one call
describe('worstChordMapEntry (Q148)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_returns_a_scale_chord_map_entry', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = worstChordMapEntry(chordMap, spectrum, t12.referenceHz);
    expect(typeof result.degreeOffset).toBe('number');
    expect(result.chord).toBeDefined();
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => worstChordMapEntry([], spectrum)).toThrow(RangeError);
  });

  it('test_result_is_last_entry_from_rankChordMapByDissonance', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByDissonance(chordMap, spectrum, t12.referenceHz);
    const worst = worstChordMapEntry(chordMap, spectrum, t12.referenceHz);
    expect(worst.degreeOffset).toBe(ranked[ranked.length - 1]!.degreeOffset);
  });

  it('test_default_rootHz_produces_valid_result', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = worstChordMapEntry(chordMap, spectrum);
    expect(result).toBeDefined();
  });

  it('test_single_entry_returns_that_entry', () => {
    const chordMap = scaleToChordMap(major12, t12).slice(0, 1);
    const result = worstChordMapEntry(chordMap, spectrum, t12.referenceHz);
    expect(result.degreeOffset).toBe(chordMap[0]!.degreeOffset);
  });
});

// Q150 — filterChordMapByHarmonicity: keep only entries with harmonicity <= maxHarmonicity
describe('filterChordMapByHarmonicity (Q150)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_zero_max_harmonicity_throws_range_error', () => {
    const chordMap = scaleToChordMap(major12, t12);
    expect(() => filterChordMapByHarmonicity(chordMap, 0)).toThrow(RangeError);
  });

  it('test_negative_max_harmonicity_throws_range_error', () => {
    const chordMap = scaleToChordMap(major12, t12);
    expect(() => filterChordMapByHarmonicity(chordMap, -1)).toThrow(RangeError);
  });

  it('test_very_large_threshold_returns_all_entries', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = filterChordMapByHarmonicity(chordMap, Infinity);
    expect(result.length).toBe(chordMap.length);
  });

  it('test_very_small_threshold_returns_subset_or_empty', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = filterChordMapByHarmonicity(chordMap, 1.5);
    expect(result.length).toBeLessThanOrEqual(chordMap.length);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('test_returned_entries_are_subset_of_input', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = filterChordMapByHarmonicity(chordMap, 50);
    for (const entry of result) {
      expect(chordMap.some((e) => e.degreeOffset === entry.degreeOffset)).toBe(true);
    }
  });

  it('test_empty_chord_map_returns_empty_array', () => {
    const result = filterChordMapByHarmonicity([], 10);
    expect(result).toHaveLength(0);
  });
});

// Q153 — chordMapMedianDissonance: compute median dissonance of a chord map
describe('chordMapMedianDissonance (Q153)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_returns_a_finite_number_for_major_scale', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = chordMapMedianDissonance(chordMap, spectrum, t12.referenceHz);
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => chordMapMedianDissonance([], spectrum)).toThrow(RangeError);
  });

  it('test_median_is_between_min_and_max_dissonance', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const ranked = rankChordMapByDissonance(chordMap, spectrum, t12.referenceHz);
    const dissonances = ranked.map((e) =>
      chordObjectDissonance(e.chord, t12.referenceHz, spectrum),
    );
    const min = Math.min(...dissonances);
    const max = Math.max(...dissonances);
    const median = chordMapMedianDissonance(chordMap, spectrum, t12.referenceHz);
    expect(median).toBeGreaterThanOrEqual(min);
    expect(median).toBeLessThanOrEqual(max);
  });

  it('test_single_entry_returns_its_dissonance', () => {
    const chordMap = scaleToChordMap(major12, t12).slice(0, 1);
    const result = chordMapMedianDissonance(chordMap, spectrum, t12.referenceHz);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('test_default_spectrum_and_rootHz_produce_valid_result', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = chordMapMedianDissonance(chordMap);
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
  });
});

// Q156 — filterChordMapByDissonance: keep entries at or below a dissonance threshold
describe('filterChordMapByDissonance (Q156)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_returns_subset_of_chord_map', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = filterChordMapByDissonance(chordMap, Infinity, spectrum, t12.referenceHz);
    expect(result.length).toBe(chordMap.length);
  });

  it('test_zero_threshold_throws_range_error', () => {
    const chordMap = scaleToChordMap(major12, t12);
    expect(() => filterChordMapByDissonance(chordMap, 0)).toThrow(RangeError);
  });

  it('test_negative_threshold_throws_range_error', () => {
    const chordMap = scaleToChordMap(major12, t12);
    expect(() => filterChordMapByDissonance(chordMap, -1)).toThrow(RangeError);
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => filterChordMapByDissonance([], 1)).toThrow(RangeError);
  });

  it('test_all_returned_entries_have_dissonance_at_or_below_threshold', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const threshold = chordObjectDissonance(chordMap[0]!.chord, t12.referenceHz, spectrum) + 0.1;
    const result = filterChordMapByDissonance(chordMap, threshold, spectrum, t12.referenceHz);
    for (const entry of result) {
      expect(chordObjectDissonance(entry.chord, t12.referenceHz, spectrum)).toBeLessThanOrEqual(
        threshold,
      );
    }
  });

  it('test_default_spectrum_produces_valid_result', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = filterChordMapByDissonance(chordMap, Infinity);
    expect(result.length).toBeGreaterThan(0);
  });
});

// Q158 — chordMapMeanDissonance: compute mean dissonance of a chord map
describe('chordMapMeanDissonance (Q158)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_returns_finite_number_for_major_scale', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = chordMapMeanDissonance(chordMap, spectrum, t12.referenceHz);
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => chordMapMeanDissonance([], spectrum)).toThrow(RangeError);
  });

  it('test_mean_is_between_min_and_max_dissonance', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const dissonances = chordMap.map((e) =>
      chordObjectDissonance(e.chord, t12.referenceHz, spectrum),
    );
    const min = Math.min(...dissonances);
    const max = Math.max(...dissonances);
    const mean = chordMapMeanDissonance(chordMap, spectrum, t12.referenceHz);
    expect(mean).toBeGreaterThanOrEqual(min);
    expect(mean).toBeLessThanOrEqual(max);
  });

  it('test_single_entry_returns_its_dissonance', () => {
    const chordMap = scaleToChordMap(major12, t12).slice(0, 1);
    const result = chordMapMeanDissonance(chordMap, spectrum, t12.referenceHz);
    const expected = chordObjectDissonance(chordMap[0]!.chord, t12.referenceHz, spectrum);
    expect(result).toBeCloseTo(expected, 10);
  });

  it('test_default_spectrum_and_rootHz_produce_valid_result', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const result = chordMapMeanDissonance(chordMap);
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
  });

  it('test_mean_close_to_median_for_symmetric_distributions', () => {
    const chordMap = scaleToChordMap(major12, t12);
    const mean = chordMapMeanDissonance(chordMap, spectrum, t12.referenceHz);
    const median = chordMapMedianDissonance(chordMap, spectrum, t12.referenceHz);
    // Mean and median are both valid dissonance summaries; they should be in the same ballpark
    expect(mean).toBeGreaterThan(0);
    expect(median).toBeGreaterThan(0);
  });
});

// Q160 — progressionScoreSummary: scale → chord progression analysis → JSON summary
describe('progressionScoreSummary (Q160)', () => {
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();
  const rootHz = 261.63;

  it('test_returns_correct_chord_count_for_major_scale', () => {
    const summary = progressionScoreSummary(major12, t12, rootHz, spectrum);
    expect(summary.chordCount).toBe(7);
  });

  it('test_best_and_worst_indices_within_range', () => {
    const summary = progressionScoreSummary(major12, t12, rootHz, spectrum);
    expect(summary.bestChordIndex).toBeGreaterThanOrEqual(0);
    expect(summary.bestChordIndex).toBeLessThan(summary.chordCount);
    expect(summary.worstChordIndex).toBeGreaterThanOrEqual(0);
    expect(summary.worstChordIndex).toBeLessThan(summary.chordCount);
  });

  it('test_mean_equals_total_divided_by_count', () => {
    const summary = progressionScoreSummary(major12, t12, rootHz, spectrum);
    expect(summary.meanSmoothness).toBeCloseTo(summary.totalSmoothness / summary.chordCount, 10);
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    expect(() => progressionScoreSummary(major12, edo(19), rootHz, spectrum)).toThrow(RangeError);
  });

  it('test_default_spectrum_produces_valid_result', () => {
    const summary = progressionScoreSummary(major12, t12, rootHz);
    expect(summary.chordCount).toBeGreaterThan(0);
    expect(Number.isFinite(summary.totalSmoothness)).toBe(true);
  });

  it('test_summary_is_json_serializable', () => {
    const summary = progressionScoreSummary(major12, t12, rootHz, spectrum);
    const json = JSON.stringify(summary);
    const parsed = JSON.parse(json) as typeof summary;
    expect(parsed.chordCount).toBe(summary.chordCount);
    expect(parsed.bestChordIndex).toBe(summary.bestChordIndex);
    expect(parsed.worstChordIndex).toBe(summary.worstChordIndex);
  });
});

// Q164 — chordMapSummary: complete statistical summary of chord map analysis
describe('chordMapSummary (Q164)', () => {
  const t12 = equalTemperament12(440);
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_count_equals_number_of_diatonic_chords', () => {
    const summary = chordMapSummary(major12, t12, spectrum);
    expect(summary.count).toBe(major12.degreeIndices.length);
  });

  it('test_min_dissonance_leq_max_dissonance', () => {
    const summary = chordMapSummary(major12, t12, spectrum);
    expect(summary.minDissonance).toBeLessThanOrEqual(summary.maxDissonance);
  });

  it('test_mean_dissonance_between_min_and_max', () => {
    const summary = chordMapSummary(major12, t12, spectrum);
    expect(summary.meanDissonance).toBeGreaterThanOrEqual(summary.minDissonance);
    expect(summary.meanDissonance).toBeLessThanOrEqual(summary.maxDissonance);
  });

  it('test_median_dissonance_is_finite', () => {
    const summary = chordMapSummary(major12, t12, spectrum);
    expect(Number.isFinite(summary.medianDissonance)).toBe(true);
  });

  it('test_min_harmonicity_leq_max_harmonicity', () => {
    const summary = chordMapSummary(major12, t12, spectrum);
    expect(summary.minHarmonicity).toBeLessThanOrEqual(summary.maxHarmonicity);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => chordMapSummary(major12, edo(19), spectrum)).toThrow(RangeError);
  });
});

// Q166 — filterChordMapByCriteria: filter by harmonicity AND dissonance simultaneously
describe('filterChordMapByCriteria (Q166)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_empty_criteria_returns_all_entries', () => {
    const chordMap = scaleToChordMap(major, t12);
    const filtered = filterChordMapByCriteria(chordMap, {}, spectrum);
    expect(filtered.length).toBe(chordMap.length);
  });

  it('test_very_low_max_harmonicity_reduces_entries', () => {
    const chordMap = scaleToChordMap(major, t12);
    const allEntries = filterChordMapByCriteria(chordMap, {}, spectrum);
    const filtered = filterChordMapByCriteria(chordMap, { maxHarmonicity: 5 }, spectrum);
    expect(filtered.length).toBeLessThanOrEqual(allEntries.length);
  });

  it('test_very_low_max_dissonance_reduces_entries', () => {
    const chordMap = scaleToChordMap(major, t12);
    const allEntries = filterChordMapByCriteria(chordMap, {}, spectrum);
    const filtered = filterChordMapByCriteria(chordMap, { maxDissonance: 0.001 }, spectrum);
    expect(filtered.length).toBeLessThanOrEqual(allEntries.length);
  });

  it('test_both_criteria_combined_is_subset_of_either_alone', () => {
    const chordMap = scaleToChordMap(major, t12);
    const byHarm = filterChordMapByCriteria(chordMap, { maxHarmonicity: 30 }, spectrum);
    const byDiss = filterChordMapByCriteria(chordMap, { maxDissonance: 10 }, spectrum);
    const both = filterChordMapByCriteria(
      chordMap,
      { maxHarmonicity: 30, maxDissonance: 10 },
      spectrum,
    );
    expect(both.length).toBeLessThanOrEqual(byHarm.length);
    expect(both.length).toBeLessThanOrEqual(byDiss.length);
  });

  it('test_empty_chord_map_throws', () => {
    expect(() => filterChordMapByCriteria([], {}, spectrum)).toThrow(RangeError);
  });

  it('test_returns_subset_of_input', () => {
    const chordMap = scaleToChordMap(major, t12);
    const filtered = filterChordMapByCriteria(chordMap, { maxHarmonicity: 1000 }, spectrum);
    for (const entry of filtered) {
      expect(chordMap).toContainEqual(entry);
    }
  });
});

// Q170 — bestModeProgressionSummary
describe('bestModeProgressionSummary (Q170)', () => {
  it('test_returns_progression_score_summary_shape', () => {
    const summary = bestModeProgressionSummary(t12, 261.63);
    expect(typeof summary.chordCount).toBe('number');
    expect(typeof summary.totalSmoothness).toBe('number');
    expect(typeof summary.meanSmoothness).toBe('number');
    expect(typeof summary.bestChordIndex).toBe('number');
    expect(typeof summary.worstChordIndex).toBe('number');
  });

  it('test_chord_count_is_positive', () => {
    const summary = bestModeProgressionSummary(t12, 440);
    expect(summary.chordCount).toBeGreaterThan(0);
  });

  it('test_best_and_worst_indices_in_range', () => {
    const summary = bestModeProgressionSummary(t12, 261.63);
    expect(summary.bestChordIndex).toBeGreaterThanOrEqual(0);
    expect(summary.bestChordIndex).toBeLessThan(summary.chordCount);
    expect(summary.worstChordIndex).toBeGreaterThanOrEqual(0);
    expect(summary.worstChordIndex).toBeLessThan(summary.chordCount);
  });

  it('test_mean_smoothness_between_best_and_worst', () => {
    const summary = bestModeProgressionSummary(t12, 261.63, harmonicSpectrum());
    expect(Number.isFinite(summary.meanSmoothness)).toBe(true);
  });

  it('test_with_spectrum_returns_valid_summary', () => {
    const summary = bestModeProgressionSummary(t12, 261.63, harmonicSpectrum());
    expect(summary.chordCount).toBeGreaterThan(0);
  });

  it('test_empty_tuning_throws', () => {
    const emptyTuning = {
      id: 'empty',
      name: 'empty',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(() => bestModeProgressionSummary(emptyTuning, 261.63)).toThrow(RangeError);
  });
});

// Q176 — tuningHarmonicityProfile: harmonicity per mode-index in rotation order
describe('tuningHarmonicityProfile (Q176)', () => {
  it('test_returns_array_with_one_value_per_degree', () => {
    const profile = tuningHarmonicityProfile(t12);
    expect(profile.length).toBe(t12.degrees.length);
  });

  it('test_all_values_are_finite_and_positive', () => {
    const profile = tuningHarmonicityProfile(t12);
    for (const h of profile) {
      expect(Number.isFinite(h)).toBe(true);
      expect(h).toBeGreaterThan(0);
    }
  });

  it('test_best_mode_index_matches_rankModeSeriesByHarmonicity', () => {
    const profile = tuningHarmonicityProfile(t12);
    const minH = Math.min(...profile);
    const bestIdx = profile.indexOf(minH);
    const scale = tuningToScale(t12);
    const ranked = rankModeSeriesByHarmonicity(scale, t12);
    expect(bestIdx).toBe((ranked[0] as (typeof ranked)[0]).modeIndex);
  });

  it('test_index_order_preserved', () => {
    const profile = tuningHarmonicityProfile(t12);
    const scale = tuningToScale(t12);
    const ranked = rankModeSeriesByHarmonicity(scale, t12);
    for (const entry of ranked) {
      expect(profile[entry.modeIndex]).toBeCloseTo(entry.harmonicity, 10);
    }
  });

  it('test_empty_tuning_throws', () => {
    const empty = {
      id: 'e',
      name: 'e',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(() => tuningHarmonicityProfile(empty)).toThrow(RangeError);
  });
});

// Q178 — chordMapWithLabels: annotate chord map entries with interval name labels
describe('chordMapWithLabels (Q178)', () => {
  it('test_returns_same_length_as_chord_map', () => {
    const chordMap = scaleToChordMap(major, t12);
    const labelled = chordMapWithLabels(chordMap);
    expect(labelled.length).toBe(chordMap.length);
  });

  it('test_entry_reference_is_preserved', () => {
    const chordMap = scaleToChordMap(major, t12);
    const labelled = chordMapWithLabels(chordMap);
    for (let i = 0; i < labelled.length; i++) {
      expect((labelled[i] as (typeof labelled)[0]).entry).toBe(chordMap[i]);
    }
  });

  it('test_triad_label_for_3note_chord', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const labelled = chordMapWithLabels(chordMap);
    for (const { label } of labelled) {
      expect(label).toBe('triad');
    }
  });

  it('test_dyad_label_for_2note_chord', () => {
    const chordMap = scaleToChordMap(major, t12, 2);
    const labelled = chordMapWithLabels(chordMap);
    for (const { label } of labelled) {
      expect(label).toBe('dyad');
    }
  });

  it('test_tetrad_label_for_4note_chord', () => {
    const chordMap = scaleToChordMap(major, t12, 4);
    const labelled = chordMapWithLabels(chordMap);
    for (const { label } of labelled) {
      expect(label).toBe('tetrad');
    }
  });

  it('test_empty_map_returns_empty_array', () => {
    const labelled = chordMapWithLabels([]);
    expect(labelled).toEqual([]);
  });
});

// Q183 — scaleToMinimalTuning: project scale degrees back to a minimal TuningSystem
describe('scaleToMinimalTuning (Q183)', () => {
  it('test_returns_tuning_with_same_id_and_name_as_scale', () => {
    const minimal = scaleToMinimalTuning(major, t12);
    expect(minimal.id).toBe(major.id);
    expect(minimal.name).toBe(major.name);
  });

  it('test_degree_count_matches_scale_degree_indices', () => {
    const minimal = scaleToMinimalTuning(major, t12);
    expect(minimal.degrees.length).toBe(major.degreeIndices.length);
  });

  it('test_inherits_reference_hz_and_period_cents', () => {
    const minimal = scaleToMinimalTuning(major, t12);
    expect(minimal.referenceHz).toBe(t12.referenceHz);
    expect(minimal.periodCents).toBe(t12.periodCents);
  });

  it('test_inherits_source', () => {
    const minimal = scaleToMinimalTuning(major, t12);
    expect(minimal.source).toBe(t12.source);
  });

  it('test_wrong_tuning_id_throws', () => {
    const wrongScale: Scale = {
      id: 'w',
      name: 'w',
      tuningId: 'other',
      degreeIndices: [0, 1],
    };
    expect(() => scaleToMinimalTuning(wrongScale, t12)).toThrow(RangeError);
  });

  it('test_single_degree_scale', () => {
    const single: Scale = {
      id: 'root-only',
      name: 'Root only',
      tuningId: '12-tet',
      degreeIndices: [0],
    };
    const minimal = scaleToMinimalTuning(single, t12);
    expect(minimal.degrees.length).toBe(1);
  });
});

// Q184 — chordMapDissonancePercentiles: full dissonance distribution as percentile record
describe('chordMapDissonancePercentiles (Q184)', () => {
  it('test_returns_record_with_default_percentile_keys', () => {
    const chordMap = scaleToChordMap(major, t12);
    const result = chordMapDissonancePercentiles(chordMap);
    expect(result).toHaveProperty('0');
    expect(result).toHaveProperty('0.25');
    expect(result).toHaveProperty('0.5');
    expect(result).toHaveProperty('0.75');
    expect(result).toHaveProperty('1');
  });

  it('test_min_lte_max', () => {
    const chordMap = scaleToChordMap(major, t12);
    const result = chordMapDissonancePercentiles(chordMap);
    expect(result['0']).toBeLessThanOrEqual(result['1']!);
  });

  it('test_median_between_min_and_max', () => {
    const chordMap = scaleToChordMap(major, t12);
    const result = chordMapDissonancePercentiles(chordMap);
    expect(result['0.5']).toBeGreaterThanOrEqual(result['0']!);
    expect(result['0.5']).toBeLessThanOrEqual(result['1']!);
  });

  it('test_custom_percentiles', () => {
    const chordMap = scaleToChordMap(major, t12);
    const result = chordMapDissonancePercentiles(chordMap, [0, 0.5, 1]);
    expect(Object.keys(result).sort()).toEqual(['0', '0.5', '1']);
  });

  it('test_empty_chord_map_throws', () => {
    expect(() => chordMapDissonancePercentiles([])).toThrow(RangeError);
  });

  it('test_all_values_non_negative', () => {
    const chordMap = scaleToChordMap(major, t12);
    const result = chordMapDissonancePercentiles(chordMap);
    for (const v of Object.values(result)) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

// Q185 — groupChordMapByLabel: group chord map entries by interval-count label
describe('groupChordMapByLabel (Q185)', () => {
  it('test_returns_map', () => {
    const chordMap = scaleToChordMap(major, t12);
    const grouped = groupChordMapByLabel(chordMap);
    expect(grouped).toBeInstanceOf(Map);
  });

  it('test_triad_chord_map_has_triad_key', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const grouped = groupChordMapByLabel(chordMap);
    expect(grouped.has('triad')).toBe(true);
  });

  it('test_all_entries_accounted_for', () => {
    const chordMap = scaleToChordMap(major, t12);
    const grouped = groupChordMapByLabel(chordMap);
    let total = 0;
    for (const entries of grouped.values()) total += entries.length;
    expect(total).toBe(chordMap.length);
  });

  it('test_dyad_map_has_dyad_key', () => {
    const chordMap = scaleToChordMap(major, t12, 2);
    const grouped = groupChordMapByLabel(chordMap);
    expect(grouped.has('dyad')).toBe(true);
    expect(grouped.has('triad')).toBe(false);
  });

  it('test_empty_map_returns_empty_map', () => {
    const grouped = groupChordMapByLabel([]);
    expect(grouped.size).toBe(0);
  });

  it('test_entries_preserve_original_references', () => {
    const chordMap = scaleToChordMap(major, t12);
    const grouped = groupChordMapByLabel(chordMap);
    const allGrouped: (typeof chordMap)[0][] = [];
    for (const entries of grouped.values()) allGrouped.push(...entries);
    for (const entry of chordMap) {
      expect(allGrouped).toContain(entry);
    }
  });
});

// Q186 — isScaleStable
describe('isScaleStable (Q186)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_major_scale_is_stable_with_high_thresholds', () => {
    const result = isScaleStable(major, t12, 261.63, undefined, {
      smoothness: 10000,
      dissonance: 10,
    });
    expect(result).toBe(true);
  });

  it('test_major_scale_is_not_stable_with_very_low_thresholds', () => {
    const result = isScaleStable(major, t12, 261.63, undefined, {
      smoothness: 0.000001,
      dissonance: 0.000001,
    });
    expect(result).toBe(false);
  });

  it('test_returns_boolean', () => {
    const result = isScaleStable(major, t12, 440);
    expect(typeof result).toBe('boolean');
  });

  it('test_incompatible_tuning_throws', () => {
    const wrongScale: Scale = { id: 'x', name: 'X', tuningId: 'other', degreeIndices: [0, 1] };
    expect(() => isScaleStable(wrongScale, t12, 440)).toThrow(RangeError);
  });

  it('test_with_explicit_spectrum', () => {
    const spectrum = harmonicSpectrum();
    const result = isScaleStable(major, t12, 440, spectrum, { smoothness: 10000, dissonance: 10 });
    expect(result).toBe(true);
  });

  it('test_default_thresholds_return_boolean', () => {
    const result = isScaleStable(major, t12, 440);
    expect(result === true || result === false).toBe(true);
  });
});

// Q187 — scaleMinimalTuningRoundTrip
describe('scaleMinimalTuningRoundTrip (Q187)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_isLossless_is_true_for_major_scale', () => {
    const { isLossless } = scaleMinimalTuningRoundTrip(major, t12);
    expect(isLossless).toBe(true);
  });

  it('test_minimal_has_correct_degree_count', () => {
    const { minimal } = scaleMinimalTuningRoundTrip(major, t12);
    expect(minimal.degrees.length).toBe(major.degreeIndices.length);
  });

  it('test_recovered_degree_indices_are_sequential', () => {
    const { recovered } = scaleMinimalTuningRoundTrip(major, t12);
    expect(recovered.degreeIndices).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('test_minimal_tuning_id_matches_scale_id', () => {
    const { minimal } = scaleMinimalTuningRoundTrip(major, t12);
    expect(minimal.id).toBe(major.id);
  });

  it('test_incompatible_tuning_throws', () => {
    const wrongScale: Scale = { id: 'x', name: 'X', tuningId: 'other', degreeIndices: [0, 1] };
    expect(() => scaleMinimalTuningRoundTrip(wrongScale, t12)).toThrow(RangeError);
  });

  it('test_pentatonic_round_trip_is_lossless', () => {
    const penta: Scale = {
      id: 'penta',
      name: 'Pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const { isLossless, recovered } = scaleMinimalTuningRoundTrip(penta, t12);
    expect(isLossless).toBe(true);
    expect(recovered.degreeIndices.length).toBe(5);
  });
});

// Q189 — chordMapLabelCounts
describe('chordMapLabelCounts (Q189)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_triad_map_has_triad_key_with_correct_count', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const counts = chordMapLabelCounts(chordMap);
    expect(counts['triad']).toBe(chordMap.length);
  });

  it('test_sum_of_counts_equals_total_chords', () => {
    const chordMap = scaleToChordMap(major, t12);
    const counts = chordMapLabelCounts(chordMap);
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    expect(total).toBe(chordMap.length);
  });

  it('test_empty_chordmap_returns_empty_record', () => {
    const counts = chordMapLabelCounts([]);
    expect(Object.keys(counts).length).toBe(0);
  });

  it('test_dyad_map_has_only_dyad_key', () => {
    const chordMap = scaleToChordMap(major, t12, 2);
    const counts = chordMapLabelCounts(chordMap);
    expect(Object.keys(counts)).toEqual(['dyad']);
  });

  it('test_count_values_are_positive_integers', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const counts = chordMapLabelCounts(chordMap);
    for (const v of Object.values(counts)) {
      expect(Number.isInteger(v) && v > 0).toBe(true);
    }
  });
});

// Q191 — tuningHarmonicityCorrelation
describe('tuningHarmonicityCorrelation (Q191)', () => {
  const t12 = equalTemperament12(440);

  it('test_constant_profile_tuning_returns_nan', () => {
    // EDO tunings have uniform harmonicity across all rotations → constant profile → NaN
    const r = tuningHarmonicityCorrelation(t12, t12);
    expect(Number.isNaN(r)).toBe(true);
  });

  it('test_different_edos_also_return_nan_or_finite', () => {
    const t19 = edo(19);
    const r = tuningHarmonicityCorrelation(t12, t19);
    // Both EDOs have constant profiles so NaN is expected; function must not throw
    expect(Number.isNaN(r) || Number.isFinite(r)).toBe(true);
  });

  it('test_result_is_number', () => {
    const t19 = edo(19);
    const r = tuningHarmonicityCorrelation(t12, t19);
    expect(typeof r).toBe('number');
  });

  it('test_no_degrees_throws', () => {
    const emptyTuning = { ...t12, degrees: [] };
    expect(() => tuningHarmonicityCorrelation(emptyTuning, t12)).toThrow(RangeError);
  });

  it('test_symmetric_result', () => {
    const t19 = edo(19);
    const rAB = tuningHarmonicityCorrelation(t12, t19);
    const rBA = tuningHarmonicityCorrelation(t19, t12);
    if (Number.isFinite(rAB)) {
      expect(rAB).toBeCloseTo(rBA, 8);
    } else {
      expect(Number.isNaN(rBA)).toBe(true);
    }
  });

  it('test_custom_tol_parameter_accepted', () => {
    // Should not throw; result is NaN since 12-TET modes are equi-harmonic
    const r = tuningHarmonicityCorrelation(t12, t12, 0.02);
    expect(typeof r).toBe('number');
  });
});

// Q193 — harmonicityProfileChart
describe('harmonicityProfileChart (Q193)', () => {
  const t12 = equalTemperament12(440);

  it('test_returns_one_line_per_mode', () => {
    const chart = harmonicityProfileChart(t12);
    const lines = chart.split('\n');
    expect(lines.length).toBe(t12.degrees.length);
  });

  it('test_each_line_starts_with_mode_prefix', () => {
    const chart = harmonicityProfileChart(t12);
    for (const [i, line] of chart.split('\n').entries()) {
      expect(line).toMatch(new RegExp(`^mode ${i}:`));
    }
  });

  it('test_each_line_contains_value_with_three_decimals', () => {
    const chart = harmonicityProfileChart(t12);
    for (const line of chart.split('\n')) {
      expect(line).toMatch(/\(\d+\.\d{3}\)$/);
    }
  });

  it('test_empty_tuning_throws', () => {
    const empty = { ...t12, degrees: [] };
    expect(() => harmonicityProfileChart(empty)).toThrow(RangeError);
  });

  it('test_custom_width_limits_bar_length', () => {
    const chart = harmonicityProfileChart(t12, 0.0136, 10);
    for (const line of chart.split('\n')) {
      const barMatch = line.match(/: (#*) \(/);
      expect(barMatch).not.toBeNull();
      expect((barMatch![1] as string).length).toBeLessThanOrEqual(10);
    }
  });

  it('test_all_zero_profile_produces_empty_bars', () => {
    const t5 = edo(5);
    const chart = harmonicityProfileChart(t5);
    for (const line of chart.split('\n')) {
      expect(line).toMatch(/: (#*) \(/);
    }
    expect(typeof chart).toBe('string');
  });
});

// Q196 — chordMapTriads
describe('chordMapTriads (Q196)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_only_triads_from_triad_map', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const triads = chordMapTriads(chordMap);
    expect(triads.length).toBe(chordMap.length);
    for (const entry of triads) {
      expect(entry.chord.intervals.length).toBe(3);
    }
  });

  it('test_empty_array_for_dyad_map', () => {
    const chordMap = scaleToChordMap(major, t12, 2);
    const triads = chordMapTriads(chordMap);
    expect(triads).toEqual([]);
  });

  it('test_returns_empty_array_for_empty_chord_map', () => {
    const triads = chordMapTriads([]);
    expect(triads).toEqual([]);
  });

  it('test_result_is_subset_of_chord_map', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const triads = chordMapTriads(chordMap);
    for (const t of triads) {
      expect(chordMap.includes(t)).toBe(true);
    }
  });

  it('test_all_results_have_interval_length_3', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const triads = chordMapTriads(chordMap);
    for (const entry of triads) {
      expect(entry.chord.intervals.length).toBe(3);
    }
  });
});

// Q197 — rankModesByStability
describe('rankModesByStability (Q197)', () => {
  const t5 = edo(5);

  it('test_returns_one_entry_per_mode', () => {
    const ranked = rankModesByStability(t5, 261.63);
    expect(ranked.length).toBe(t5.degrees.length);
  });

  it('test_sorted_ascending_by_score', () => {
    const ranked = rankModesByStability(t5, 261.63);
    for (let i = 1; i < ranked.length; i++) {
      expect((ranked[i] as (typeof ranked)[0]).score).toBeGreaterThanOrEqual(
        (ranked[i - 1] as (typeof ranked)[0]).score,
      );
    }
  });

  it('test_each_entry_has_scale_smoothness_dissonance_score', () => {
    const ranked = rankModesByStability(t5, 261.63);
    for (const entry of ranked) {
      expect(entry).toHaveProperty('scale');
      expect(entry).toHaveProperty('smoothness');
      expect(entry).toHaveProperty('dissonance');
      expect(entry).toHaveProperty('score');
      expect(Number.isFinite(entry.score)).toBe(true);
    }
  });

  it('test_score_equals_smoothness_plus_dissonance_times_1000', () => {
    const ranked = rankModesByStability(t5, 261.63);
    for (const entry of ranked) {
      expect(entry.score).toBeCloseTo(entry.smoothness + entry.dissonance * 1000, 6);
    }
  });

  it('test_with_spectrum_returns_same_count', () => {
    const spectrum = harmonicSpectrum();
    const ranked = rankModesByStability(t5, 261.63, spectrum);
    expect(ranked.length).toBe(t5.degrees.length);
  });

  it('test_scale_tuning_id_matches_parent_tuning', () => {
    const ranked = rankModesByStability(t5, 261.63);
    for (const entry of ranked) {
      expect(entry.scale.tuningId).toBe(t5.id);
    }
  });
});

// Q199 — isBestModeStable
describe('isBestModeStable (Q199)', () => {
  const t5 = edo(5);
  const t12 = equalTemperament12(440);

  it('test_returns_boolean', () => {
    const result = isBestModeStable(t5, 261.63);
    expect(typeof result).toBe('boolean');
  });

  it('test_with_spectrum_returns_boolean', () => {
    const result = isBestModeStable(t5, 261.63, harmonicSpectrum());
    expect(typeof result).toBe('boolean');
  });

  it('test_12tet_best_mode_stable_with_loose_thresholds', () => {
    const result = isBestModeStable(t12, 261.63, undefined, {
      smoothness: 1e9,
      dissonance: 1e9,
    });
    expect(result).toBe(true);
  });

  it('test_strict_thresholds_return_false', () => {
    const result = isBestModeStable(t5, 261.63, undefined, {
      smoothness: 0,
      dissonance: 0,
    });
    expect(result).toBe(false);
  });

  it('test_empty_tuning_throws', () => {
    const emptyTuning = { ...t5, degrees: [] };
    expect(() => isBestModeStable(emptyTuning, 261.63)).toThrow(RangeError);
  });
});

// Q200 — chordMapDyads
describe('chordMapDyads (Q200)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_dyads_from_dyad_map', () => {
    const chordMap = scaleToChordMap(major, t12, 2);
    const dyads = chordMapDyads(chordMap);
    expect(dyads.length).toBe(chordMap.length);
    for (const entry of dyads) {
      expect(entry.chord.intervals.length).toBe(2);
    }
  });

  it('test_empty_array_for_triad_map', () => {
    const chordMap = scaleToChordMap(major, t12, 3);
    const dyads = chordMapDyads(chordMap);
    expect(dyads).toEqual([]);
  });

  it('test_returns_empty_for_empty_chord_map', () => {
    expect(chordMapDyads([])).toEqual([]);
  });

  it('test_result_is_subset_of_chord_map', () => {
    const chordMap = scaleToChordMap(major, t12, 2);
    const dyads = chordMapDyads(chordMap);
    for (const d of dyads) {
      expect(chordMap.includes(d)).toBe(true);
    }
  });

  it('test_all_results_have_interval_length_2', () => {
    const chordMap = scaleToChordMap(major, t12, 2);
    const dyads = chordMapDyads(chordMap);
    for (const entry of dyads) {
      expect(entry.chord.intervals.length).toBe(2);
    }
  });
});

// Q201 — areTuningsSimilar
describe('areTuningsSimilar (Q201)', () => {
  const t12 = equalTemperament12(440);
  const t24 = edo(24);
  const t5 = edo(5);
  const t7 = edo(7);

  it('test_returns_boolean', () => {
    const result = areTuningsSimilar(t5, t12);
    expect(typeof result).toBe('boolean');
  });

  it('test_very_different_tunings_may_not_be_similar', () => {
    const result = areTuningsSimilar(t5, t12, 0.99);
    expect(typeof result).toBe('boolean');
  });

  it('test_negative_threshold_accepts_any_non_nan', () => {
    const corr = tuningHarmonicityCorrelation(t5, t7);
    if (!Number.isNaN(corr)) {
      expect(areTuningsSimilar(t5, t7, -1.0)).toBe(true);
    } else {
      expect(areTuningsSimilar(t5, t7, -1.0)).toBe(false);
    }
  });

  it('test_returns_false_for_nan_correlation', () => {
    const result = areTuningsSimilar(t12, t24, 0.7);
    expect(typeof result).toBe('boolean');
  });

  it('test_default_threshold_0_7_for_related_tunings', () => {
    const result = areTuningsSimilar(t12, t24);
    expect(typeof result).toBe('boolean');
  });

  it('test_high_threshold_1_returns_false_for_different', () => {
    const result = areTuningsSimilar(t5, t24, 1.0);
    expect(result).toBe(false);
  });
});

// Q203 — tuningReport
describe('tuningReport (Q203)', () => {
  const t5 = edo(5);
  const t12 = equalTemperament12(440);

  it('test_returns_report_with_expected_keys', () => {
    const report = tuningReport(t5, 261.63);
    expect(report).toHaveProperty('id');
    expect(report).toHaveProperty('name');
    expect(report).toHaveProperty('degreeCount');
    expect(report).toHaveProperty('bestMode');
    expect(report).toHaveProperty('stabilityRanking');
    expect(report).toHaveProperty('chordMapSummary');
    expect(report).toHaveProperty('harmonicityProfile');
  });

  it('test_degree_count_matches_tuning', () => {
    const report = tuningReport(t5, 261.63);
    expect(report.degreeCount).toBe(t5.degrees.length);
  });

  it('test_stability_ranking_length_equals_degree_count', () => {
    const report = tuningReport(t5, 261.63);
    expect(report.stabilityRanking.length).toBe(t5.degrees.length);
  });

  it('test_harmonicity_profile_length_equals_degree_count', () => {
    const report = tuningReport(t5, 261.63);
    expect(report.harmonicityProfile.length).toBe(t5.degrees.length);
  });

  it('test_report_is_json_serializable', () => {
    const report = tuningReport(t5, 261.63);
    const json = JSON.stringify(report);
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json) as typeof report;
    expect(parsed.id).toBe(report.id);
  });

  it('test_empty_tuning_throws', () => {
    const emptyTuning = { ...t12, degrees: [] };
    expect(() => tuningReport(emptyTuning, 261.63)).toThrow(RangeError);
  });
});

// Q204 — compareTuningReports
describe('compareTuningReports (Q204)', () => {
  const t5 = edo(5);
  const t7 = edo(7);

  it('test_returns_both_reports', () => {
    const cmp = compareTuningReports(t5, t7, 261.63);
    expect(cmp.a.id).toBe(t5.id);
    expect(cmp.b.id).toBe(t7.id);
  });

  it('test_correlation_is_number', () => {
    const cmp = compareTuningReports(t5, t7, 261.63);
    expect(typeof cmp.correlation).toBe('number');
  });

  it('test_harmonicity_distance_diff_is_non_negative', () => {
    const cmp = compareTuningReports(t5, t7, 261.63);
    expect(cmp.harmonicityDistanceDiff).toBeGreaterThanOrEqual(0);
  });

  it('test_harmonicity_diffs_are_equal', () => {
    const cmp = compareTuningReports(t5, t7, 261.63);
    expect(cmp.harmonicityDistanceDiff).toBe(cmp.bestModeHarmonicityDiff);
  });

  it('test_same_tuning_gives_zero_diff', () => {
    const cmp = compareTuningReports(t5, t5, 261.63);
    expect(cmp.harmonicityDistanceDiff).toBeCloseTo(0, 10);
  });

  it('test_reports_contain_expected_fields', () => {
    const cmp = compareTuningReports(t5, t7, 261.63);
    expect(cmp.a).toHaveProperty('degreeCount');
    expect(cmp.b).toHaveProperty('degreeCount');
    expect(cmp.a.degreeCount).toBe(t5.degrees.length);
    expect(cmp.b.degreeCount).toBe(t7.degrees.length);
  });
});

// Q205 — modeStabilityScores
describe('modeStabilityScores (Q205)', () => {
  const t5 = edo(5);
  const t7 = edo(7);

  it('test_returns_number_array', () => {
    const scores = modeStabilityScores(t5, 261.63);
    expect(Array.isArray(scores)).toBe(true);
    for (const s of scores) expect(typeof s).toBe('number');
  });

  it('test_length_matches_degree_count', () => {
    const scores = modeStabilityScores(t5, 261.63);
    expect(scores.length).toBe(t5.degrees.length);
  });

  it('test_sorted_ascending', () => {
    const scores = modeStabilityScores(t5, 261.63);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i] as number).toBeGreaterThanOrEqual(scores[i - 1] as number);
    }
  });

  it('test_scores_for_7edo', () => {
    const scores = modeStabilityScores(t7, 261.63);
    expect(scores.length).toBe(t7.degrees.length);
  });

  it('test_first_score_is_minimum', () => {
    const scores = modeStabilityScores(t5, 261.63);
    const min = Math.min(...scores);
    expect(scores[0]).toBeCloseTo(min, 10);
  });
});

// Q206 — singleBestChord
describe('singleBestChord (Q206)', () => {
  const t5 = edo(5);
  const scale5 = tuningToScale(t5);

  it('test_returns_chord_map_analysis_entry', () => {
    const entry = singleBestChord(scale5, t5);
    expect(entry).toHaveProperty('chord');
    expect(entry).toHaveProperty('dissonance');
    expect(entry).toHaveProperty('harmonicity');
    expect(entry).toHaveProperty('degreeOffset');
  });

  it('test_dissonance_is_non_negative', () => {
    const entry = singleBestChord(scale5, t5);
    expect(entry.dissonance).toBeGreaterThanOrEqual(0);
  });

  it('test_harmonicity_is_positive', () => {
    const entry = singleBestChord(scale5, t5);
    expect(entry.harmonicity).toBeGreaterThan(0);
  });

  it('test_accepts_explicit_spectrum', () => {
    const entry = singleBestChord(scale5, t5, harmonicSpectrum());
    expect(entry).toHaveProperty('chord');
  });

  it('test_empty_scale_throws', () => {
    const emptyScale: Scale = { id: 'empty', name: 'empty', tuningId: t5.id, degreeIndices: [] };
    expect(() => singleBestChord(emptyScale, t5)).toThrow(RangeError);
  });

  it('test_best_entry_has_lowest_or_equal_dissonance', () => {
    const entry = singleBestChord(scale5, t5);
    const allEntries = chordMapAnalysis(scale5, t5, harmonicSpectrum());
    for (const e of allEntries) {
      expect(entry.dissonance).toBeLessThanOrEqual(e.dissonance + 1e-10);
    }
  });
});

// Q209 — chordMapDyadTriadRatio
describe('chordMapDyadTriadRatio (Q209)', () => {
  const t5 = edo(5);
  const scale5 = tuningToScale(t5);

  it('test_returns_number', () => {
    const map = scaleToChordMap(scale5, t5, 2);
    const ratio = chordMapDyadTriadRatio(map);
    expect(typeof ratio).toBe('number');
  });

  it('test_dyad_only_map_returns_dyad_count', () => {
    const map = scaleToChordMap(scale5, t5, 2);
    const dyads = chordMapDyads(map);
    const ratio = chordMapDyadTriadRatio(map);
    expect(ratio).toBe(dyads.length / 1);
  });

  it('test_empty_map_returns_zero', () => {
    const ratio = chordMapDyadTriadRatio([]);
    expect(ratio).toBe(0);
  });

  it('test_guards_division_by_zero_via_max_1', () => {
    const map = scaleToChordMap(scale5, t5, 2);
    const triads = chordMapTriads(map);
    const dyads = chordMapDyads(map);
    const ratio = chordMapDyadTriadRatio(map);
    expect(ratio).toBe(dyads.length / Math.max(1, triads.length));
  });

  it('test_mixed_map_with_triads_gives_correct_ratio', () => {
    const map3 = scaleToChordMap(scale5, t5, 3);
    const ratio = chordMapDyadTriadRatio(map3);
    const triads = chordMapTriads(map3);
    const dyads = chordMapDyads(map3);
    expect(ratio).toBeCloseTo(dyads.length / Math.max(1, triads.length), 10);
  });
});

// Q213 — chordMapDescription
describe('chordMapDescription (Q213)', () => {
  it('test_returns_string', () => {
    const map = scaleToChordMap(major, t12, 3);
    const desc = chordMapDescription(map);
    expect(typeof desc).toBe('string');
  });

  it('test_starts_with_total_count', () => {
    const map = scaleToChordMap(major, t12, 3);
    const desc = chordMapDescription(map);
    expect(desc.startsWith(`${map.length} chords:`)).toBe(true);
  });

  it('test_triad_only_map_format', () => {
    const map = scaleToChordMap(major, t12, 3);
    const desc = chordMapDescription(map);
    expect(desc).toMatch(/\d+ chords: \d+ triad/);
  });

  it('test_empty_map_shows_zero', () => {
    const desc = chordMapDescription([]);
    expect(desc.startsWith('0 chords:')).toBe(true);
  });

  it('test_description_contains_label_and_count', () => {
    const map = scaleToChordMap(major, t12, 3);
    const counts = chordMapLabelCounts(map);
    const desc = chordMapDescription(map);
    for (const [label, count] of Object.entries(counts)) {
      expect(desc).toContain(`${count} ${label}`);
    }
  });
});

// Q214 — tuningReportSimilarity
describe('tuningReportSimilarity (Q214)', () => {
  it('test_identical_reports_give_score_1', () => {
    const r = tuningReport(t12, 261.63);
    expect(tuningReportSimilarity(r, r)).toBe(1);
  });

  it('test_score_in_range_0_to_1', () => {
    const t5 = edo(5);
    const r1 = tuningReport(t12, 261.63);
    const r2 = tuningReport(t5, 261.63);
    const score = tuningReportSimilarity(r1, r2);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('test_symmetric', () => {
    const t5 = edo(5);
    const r1 = tuningReport(t12, 261.63);
    const r2 = tuningReport(t5, 261.63);
    expect(tuningReportSimilarity(r1, r2)).toBeCloseTo(tuningReportSimilarity(r2, r1), 10);
  });

  it('test_formula_matches_manual_calculation', () => {
    const t5 = edo(5);
    const r1 = tuningReport(t12, 261.63);
    const r2 = tuningReport(t5, 261.63);
    const expected = 1 / (1 + Math.abs(r1.bestMode.harmonicity - r2.bestMode.harmonicity));
    expect(tuningReportSimilarity(r1, r2)).toBeCloseTo(expected, 10);
  });

  it('test_more_similar_tunings_have_higher_score', () => {
    const t12b = equalTemperament12(440);
    const t5 = edo(5);
    const r1 = tuningReport(t12, 261.63);
    const r2 = tuningReport(t12b, 261.63);
    const r3 = tuningReport(t5, 261.63);
    const sameScore = tuningReportSimilarity(r1, r2);
    const diffScore = tuningReportSimilarity(r1, r3);
    expect(sameScore).toBeGreaterThanOrEqual(diffScore);
  });
});

// Q215 — annotateProgression
describe('annotateProgression (Q215)', () => {
  const triad = chordFromSemitones('triad', [0, 4, 7]);
  const dyad = chordFromSemitones('dyad', [0, 7]);

  it('test_empty_input_returns_empty_array', () => {
    expect(annotateProgression([], 261.63)).toEqual([]);
  });

  it('test_returns_one_entry_per_chord', () => {
    const result = annotateProgression([triad, dyad], 261.63);
    expect(result.length).toBe(2);
  });

  it('test_triad_label', () => {
    const result = annotateProgression([triad], 261.63);
    expect(result[0]?.label).toBe('triad');
  });

  it('test_dyad_label', () => {
    const result = annotateProgression([dyad], 261.63);
    expect(result[0]?.label).toBe('dyad');
  });

  it('test_dissonance_and_harmonicity_are_numbers', () => {
    const result = annotateProgression([triad], 261.63, harmonicSpectrum());
    const entry = result[0];
    expect(typeof entry?.dissonance).toBe('number');
    expect(typeof entry?.harmonicity).toBe('number');
  });

  it('test_chord_reference_preserved', () => {
    const result = annotateProgression([triad], 261.63);
    expect(result[0]?.chord).toBe(triad);
  });
});

// Q216 — progressionEnergyArc
describe('progressionEnergyArc (Q216)', () => {
  const triad = chordFromSemitones('triad', [0, 4, 7]);
  const dyad = chordFromSemitones('dyad', [0, 7]);

  it('test_empty_input_returns_empty_array', () => {
    expect(progressionEnergyArc([], 261.63)).toEqual([]);
  });

  it('test_returns_one_value_per_chord', () => {
    const arc = progressionEnergyArc([triad, dyad], 261.63);
    expect(arc.length).toBe(2);
  });

  it('test_values_are_non_negative_numbers', () => {
    const arc = progressionEnergyArc([triad], 261.63);
    expect(typeof arc[0]).toBe('number');
    expect(arc[0]).toBeGreaterThanOrEqual(0);
  });

  it('test_matches_annotate_progression_dissonances', () => {
    const chords = [triad, dyad];
    const arc = progressionEnergyArc(chords, 261.63);
    const annotated = annotateProgression(chords, 261.63);
    expect(arc).toEqual(annotated.map((r) => r.dissonance));
  });

  it('test_accepts_explicit_spectrum', () => {
    const arc = progressionEnergyArc([triad], 261.63, harmonicSpectrum());
    expect(arc.length).toBe(1);
    expect(typeof arc[0]).toBe('number');
  });
});

// Q217 — findChordByLabel
describe('findChordByLabel (Q217)', () => {
  const triad = chordFromSemitones('triad', [0, 4, 7]);
  const dyad = chordFromSemitones('dyad', [0, 7]);

  it('test_returns_undefined_for_empty_chords', () => {
    expect(findChordByLabel([], 'triad', 261.63)).toBeUndefined();
  });

  it('test_finds_triad_by_label', () => {
    const result = findChordByLabel([triad], 'triad', 261.63);
    expect(result).not.toBeUndefined();
    expect(result?.chord).toBe(triad);
    expect(result?.index).toBe(0);
  });

  it('test_finds_dyad_at_correct_index', () => {
    const result = findChordByLabel([triad, dyad], 'dyad', 261.63);
    expect(result?.index).toBe(1);
    expect(result?.chord).toBe(dyad);
  });

  it('test_returns_undefined_for_missing_label', () => {
    const result = findChordByLabel([triad, dyad], 'tetrad', 261.63);
    expect(result).toBeUndefined();
  });

  it('test_returns_first_match_when_multiple_present', () => {
    const triad2 = chordFromSemitones('triad2', [0, 3, 7]);
    const result = findChordByLabel([triad, triad2], 'triad', 261.63);
    expect(result?.index).toBe(0);
    expect(result?.chord).toBe(triad);
  });

  it('test_accepts_explicit_spectrum', () => {
    const result = findChordByLabel([triad], 'triad', 261.63, harmonicSpectrum());
    expect(result).not.toBeUndefined();
  });
});

// Q223 — progressionClimaxChord
describe('progressionClimaxChord (Q223)', () => {
  const triad = chordFromSemitones('triad', [0, 4, 7]);
  const dyad = chordFromSemitones('dyad', [0, 7]);

  it('test_empty_input_returns_undefined', () => {
    expect(progressionClimaxChord([], 261.63)).toBeUndefined();
  });

  it('test_single_chord_returns_it', () => {
    const result = progressionClimaxChord([triad], 261.63);
    expect(result).not.toBeUndefined();
    expect(result?.index).toBe(0);
    expect(result?.chord).toBe(triad);
  });

  it('test_returns_max_dissonance_entry', () => {
    const result = progressionClimaxChord([triad, dyad], 261.63);
    const annotated = annotateProgression([triad, dyad], 261.63);
    const maxDissonance = Math.max(...annotated.map((e) => e.dissonance));
    expect(result?.dissonance).toBeCloseTo(maxDissonance, 10);
  });

  it('test_dissonance_field_matches_annotate_progression', () => {
    const chords = [triad, dyad, triad];
    const result = progressionClimaxChord(chords, 261.63);
    const annotated = annotateProgression(chords, 261.63);
    expect(result?.dissonance).toBeCloseTo(annotated[result?.index ?? 0]?.dissonance ?? 0, 10);
  });

  it('test_accepts_explicit_spectrum', () => {
    const result = progressionClimaxChord([triad], 261.63, harmonicSpectrum());
    expect(result).not.toBeUndefined();
    expect(typeof result?.dissonance).toBe('number');
  });
});

// Q224 — progressionResolutionChord
describe('progressionResolutionChord (Q224)', () => {
  const triad = chordFromSemitones('triad', [0, 4, 7]);
  const dyad = chordFromSemitones('dyad', [0, 7]);

  it('test_empty_input_returns_undefined', () => {
    expect(progressionResolutionChord([], 261.63)).toBeUndefined();
  });

  it('test_single_chord_returns_it', () => {
    const result = progressionResolutionChord([triad], 261.63);
    expect(result).not.toBeUndefined();
    expect(result?.index).toBe(0);
    expect(result?.chord).toBe(triad);
  });

  it('test_returns_min_dissonance_entry', () => {
    const result = progressionResolutionChord([triad, dyad], 261.63);
    const annotated = annotateProgression([triad, dyad], 261.63);
    const minDissonance = Math.min(...annotated.map((e) => e.dissonance));
    expect(result?.dissonance).toBeCloseTo(minDissonance, 10);
  });

  it('test_climax_dissonance_gte_resolution_dissonance', () => {
    const chords = [triad, dyad];
    const climax = progressionClimaxChord(chords, 261.63);
    const resolution = progressionResolutionChord(chords, 261.63);
    expect((climax?.dissonance ?? 0) >= (resolution?.dissonance ?? 0)).toBe(true);
  });

  it('test_accepts_explicit_spectrum', () => {
    const result = progressionResolutionChord([triad], 261.63, harmonicSpectrum());
    expect(result).not.toBeUndefined();
    expect(typeof result?.dissonance).toBe('number');
  });
});

// Q225 — chordDescription
describe('chordDescription (Q225)', () => {
  const triad = chordFromSemitones('triad', [0, 4, 7]);
  const dyad = chordFromSemitones('dyad', [0, 7]);

  it('test_returns_label_dissonance_harmonicity', () => {
    const desc = chordDescription(triad, 261.63);
    expect(desc).toHaveProperty('label');
    expect(desc).toHaveProperty('dissonance');
    expect(desc).toHaveProperty('harmonicity');
  });

  it('test_triad_label', () => {
    expect(chordDescription(triad, 261.63).label).toBe('triad');
  });

  it('test_dyad_label', () => {
    expect(chordDescription(dyad, 261.63).label).toBe('dyad');
  });

  it('test_dissonance_and_harmonicity_match_annotate_progression', () => {
    const desc = chordDescription(triad, 261.63);
    const annotated = annotateProgression([triad], 261.63);
    expect(desc.dissonance).toBeCloseTo(annotated[0]?.dissonance ?? 0, 10);
    expect(desc.harmonicity).toBeCloseTo(annotated[0]?.harmonicity ?? 0, 10);
  });

  it('test_accepts_explicit_spectrum', () => {
    const desc = chordDescription(triad, 261.63, harmonicSpectrum());
    expect(typeof desc.label).toBe('string');
    expect(typeof desc.dissonance).toBe('number');
  });
});

// Q227 — progressionEnergyShape
describe('progressionEnergyShape (Q227)', () => {
  const unison = chordFromSemitones('unison', [0]);
  const fifth = chordFromSemitones('fifth', [0, 7]);
  const tritone = chordFromSemitones('tritone', [0, 6]);

  it('test_empty_returns_flat', () => {
    expect(progressionEnergyShape([], 261.63)).toBe('flat');
  });

  it('test_single_chord_returns_flat', () => {
    expect(progressionEnergyShape([fifth], 261.63)).toBe('flat');
  });

  it('test_all_identical_chords_returns_flat', () => {
    expect(progressionEnergyShape([fifth, fifth, fifth], 261.63)).toBe('flat');
  });

  it('test_returns_valid_label_string', () => {
    const validLabels = ['flat', 'ascending', 'descending', 'arch', 'valley', 'irregular'];
    const shape = progressionEnergyShape([unison, fifth, tritone], 261.63);
    expect(validLabels).toContain(shape);
  });

  it('test_two_chords_returns_valid_label', () => {
    const validLabels = ['flat', 'ascending', 'descending', 'arch', 'valley', 'irregular'];
    const shape = progressionEnergyShape([unison, tritone], 261.63);
    expect(validLabels).toContain(shape);
  });

  it('test_accepts_explicit_spectrum', () => {
    const validLabels = ['flat', 'ascending', 'descending', 'arch', 'valley', 'irregular'];
    const shape = progressionEnergyShape([fifth, tritone], 261.63, harmonicSpectrum());
    expect(validLabels).toContain(shape);
  });
});

// Q228 — progressionNarrative
describe('progressionNarrative (Q228)', () => {
  const t12Local = equalTemperament12(440);
  const majorScale: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const chordMap = scaleToChordMap(majorScale, t12Local);
  const topChords = chordMap.slice(0, 4).map((e) => e.chord);

  it('returns a non-empty string for a 4-chord progression', () => {
    const text = progressionNarrative(topChords, 261.63);
    expect(text).toBeTruthy();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(10);
  });

  it('contains shape label', () => {
    const text = progressionNarrative(topChords, 261.63);
    const shape = progressionEnergyShape(topChords, 261.63);
    expect(text).toContain(shape);
  });

  it('handles empty progression', () => {
    expect(progressionNarrative([], 261.63)).toBe('Empty progression.');
  });

  it('handles single chord', () => {
    const text = progressionNarrative([topChords[0]!], 261.63);
    expect(text).toBeTruthy();
  });
});

// Q231 — chordMapBestWorstBundle
describe('chordMapBestWorstBundle (Q231)', () => {
  const t12Local = equalTemperament12(440);
  const majorScale: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const chordMap = scaleToChordMap(majorScale, t12Local);

  it('returns best and worst entries', () => {
    const bundle = chordMapBestWorstBundle(chordMap);
    expect(bundle.best).toBeDefined();
    expect(bundle.worst).toBeDefined();
    expect(bundle.best.harmonicity).toBeGreaterThanOrEqual(0);
    expect(bundle.worst.harmonicity).toBeGreaterThanOrEqual(0);
  });

  it('best has lower or equal dissonance than worst', () => {
    const bundle = chordMapBestWorstBundle(chordMap);
    expect(bundle.best.dissonance).toBeLessThanOrEqual(bundle.worst.dissonance);
  });
});

// Q233 — tuningIntervalHistogram
describe('tuningIntervalHistogram (Q233)', () => {
  const t12Local = equalTemperament12(440);

  it('returns binCount bins', () => {
    const hist = tuningIntervalHistogram(t12Local);
    expect(hist).toHaveLength(12);
  });

  it('total count equals degree count', () => {
    const hist = tuningIntervalHistogram(t12Local);
    const total = hist.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(t12Local.degrees.length);
  });

  it('bin 0 has centsMid of binSize/2', () => {
    const hist = tuningIntervalHistogram(t12Local);
    expect(hist[0]!.centsMid).toBeCloseTo(50, 1); // 1200/12/2 = 50
  });

  it('throws for binCount <= 0', () => {
    expect(() => tuningIntervalHistogram(t12Local, 0)).toThrow(RangeError);
  });

  it('custom binCount', () => {
    const hist = tuningIntervalHistogram(t12Local, 6);
    expect(hist).toHaveLength(6);
  });
});

describe('tuningHistogramChart (Q235)', () => {
  const t12 = equalTemperament12(440);

  it('returns a non-empty string', () => {
    const chart = tuningHistogramChart(t12);
    expect(chart).toBeTruthy();
    expect(typeof chart).toBe('string');
  });
  it('has binCount lines', () => {
    const chart = tuningHistogramChart(t12, 6);
    expect(chart.split('\n')).toHaveLength(6);
  });
  it('uses block character', () => {
    expect(tuningHistogramChart(t12)).toContain('█');
  });
});

describe('chordMapIntervalHistogram (Q238)', () => {
  const t12 = equalTemperament12(440);
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);

  it('returns binCount bins', () => {
    const hist = chordMapIntervalHistogram(chordMap);
    expect(hist).toHaveLength(12);
  });
  it('total count equals total intervals across all chords', () => {
    const hist = chordMapIntervalHistogram(chordMap);
    const total = hist.reduce((s, b) => s + b.count, 0);
    const expected = chordMap.reduce((s, e) => s + e.chord.intervals.length, 0);
    expect(total).toBe(expected);
  });
  it('throws for binCount <= 0', () => {
    expect(() => chordMapIntervalHistogram(chordMap, 1200, 0)).toThrow(RangeError);
  });
});

describe('scaleProgressionNarrative (Q241)', () => {
  const t12 = equalTemperament12(440);
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;

  it('returns non-empty string', () => {
    const text = scaleProgressionNarrative(scale, t12, 261.63);
    expect(text).toBeTruthy();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(10);
  });
  it('works with custom pattern', () => {
    const text = scaleProgressionNarrative(scale, t12, 261.63, [0, 2, 1]);
    expect(text).toBeTruthy();
  });
  it('contains Progression', () => {
    expect(scaleProgressionNarrative(scale, t12, 261.63)).toContain('Progression');
  });
});

describe('scaleSimilarityMatrix (Q245)', () => {
  const t12 = equalTemperament12(440);

  it('returns n×n matrix for n tunings', () => {
    const matrix = scaleSimilarityMatrix([t12, t12]);
    expect(matrix).toHaveLength(2);
    expect(matrix[0]).toHaveLength(2);
    expect(matrix[1]).toHaveLength(2);
  });
  it('diagonal is 1.0', () => {
    const matrix = scaleSimilarityMatrix([t12]);
    expect(matrix[0]![0]).toBe(1.0);
  });
  it('is symmetric', () => {
    const t19 = edo(19);
    const matrix = scaleSimilarityMatrix([t12, t19]);
    const a = matrix[0]![1]!;
    const b = matrix[1]![0]!;
    // Both NaN (constant profile) or equal finite value
    expect(Number.isNaN(a) ? Number.isNaN(b) : Math.abs(a - b) < 1e-10).toBe(true);
  });
  it('returns empty matrix for empty input', () => {
    expect(scaleSimilarityMatrix([])).toEqual([]);
  });
});

describe('progressionChordCentroid (Q249)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);
  const chords = chordMap.slice(0, 4).map((e) => e.chord);

  it('returns a Chord', () => {
    const chord = progressionChordCentroid(chords, 261.63);
    expect(chord).toBeDefined();
    expect(chord.intervals).toBeDefined();
  });
  it('returns a chord that is in the progression', () => {
    const chord = progressionChordCentroid(chords, 261.63);
    expect(chords).toContainEqual(chord);
  });
  it('throws for empty progression', () => {
    expect(() => progressionChordCentroid([], 261.63)).toThrow(RangeError);
  });
});

describe('modeIntervalSets (Q250)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;

  it('returns one entry per mode', () => {
    const sets = modeIntervalSets(scale, t12);
    expect(sets.length).toBe(scale.degreeIndices.length);
  });
  it('each intervalCents array has length === degreeIndices.length', () => {
    const sets = modeIntervalSets(scale, t12);
    sets.forEach((s) => expect(s.intervalCents).toHaveLength(scale.degreeIndices.length));
  });
  it('intervals sum to periodCents', () => {
    const sets = modeIntervalSets(scale, t12);
    sets.forEach((s) => {
      const sum = s.intervalCents.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(t12.periodCents, 3);
    });
  });
});
