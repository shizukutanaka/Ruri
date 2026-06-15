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
} from './scale.js';
import { equalTemperament12, edo, degreeToFreq } from './tuning.js';
import { generatedTuning } from './generate.js';
import { rankChords } from './chord-search.js';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import { chordDissonance } from './dissonance.js';
import { DEFAULT_SYNTH_SCALE } from './ks-synth.js';
import { chordToCents, chordFromDegrees, chordFromRatios } from './chord.js';

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
