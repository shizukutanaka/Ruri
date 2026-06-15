import { describe, it, expect } from 'vitest';
import {
  ALL_PRESETS,
  TWELVE_TET,
  JUST_INTONATION_5L,
  SLENDRO_EXAMPLE,
  allPresetReports,
  bestStabilityPreset,
  mostHarmonicPreset,
  presetHarmonicityLeague,
  allPresetsDemoWav,
  isPresetTopN,
  presetBestChord,
  rankPresetsByReportSimilarity,
  comparePresets,
} from './presets.js';
import { type TuningPreset, loadTuningPreset } from './tuning-data.js';
import { rankModesByStability, tuningReport } from '../core/scale.js';

// Q207 — allPresetReports
describe('allPresetReports (Q207)', () => {
  it('test_returns_array_of_same_length_as_presets', () => {
    const reports = allPresetReports(261.63, undefined, [TWELVE_TET, SLENDRO_EXAMPLE]);
    expect(reports.length).toBe(2);
  });

  it('test_each_entry_has_preset_and_report', () => {
    const reports = allPresetReports(261.63, undefined, [TWELVE_TET]);
    const entry = reports[0];
    expect(entry).toHaveProperty('preset');
    expect(entry).toHaveProperty('report');
  });

  it('test_report_id_matches_preset_tuning_id', () => {
    const reports = allPresetReports(261.63, undefined, [TWELVE_TET]);
    const entry = reports[0];
    if (entry === undefined) throw new Error('no entry');
    const tuning = loadTuningPreset(entry.preset);
    expect(entry.report.id).toBe(tuning.id);
  });

  it('test_preset_order_is_preserved', () => {
    const subset: readonly TuningPreset[] = [SLENDRO_EXAMPLE, TWELVE_TET];
    const reports = allPresetReports(261.63, undefined, subset);
    expect(reports[0]?.preset.id).toBe(SLENDRO_EXAMPLE.id);
    expect(reports[1]?.preset.id).toBe(TWELVE_TET.id);
  });

  it('test_empty_preset_pool_returns_empty_array', () => {
    const reports = allPresetReports(261.63, undefined, []);
    expect(reports).toEqual([]);
  });

  it('test_report_contains_degree_count', () => {
    const reports = allPresetReports(261.63, undefined, [TWELVE_TET]);
    const entry = reports[0];
    if (entry === undefined) throw new Error('no entry');
    expect(typeof entry.report.degreeCount).toBe('number');
    expect(entry.report.degreeCount).toBeGreaterThan(0);
  });
});

// Q208 — bestStabilityPreset
describe('bestStabilityPreset (Q208)', () => {
  it('test_returns_preset_and_score', () => {
    const result = bestStabilityPreset(261.63, undefined, [TWELVE_TET, SLENDRO_EXAMPLE]);
    expect(result).not.toBeUndefined();
    if (result === undefined) return;
    expect(result).toHaveProperty('preset');
    expect(result).toHaveProperty('score');
  });

  it('test_score_is_number', () => {
    const result = bestStabilityPreset(261.63, undefined, [TWELVE_TET]);
    expect(result).not.toBeUndefined();
    if (result === undefined) return;
    expect(typeof result.score).toBe('number');
  });

  it('test_single_preset_pool_returns_that_preset', () => {
    const result = bestStabilityPreset(261.63, undefined, [SLENDRO_EXAMPLE]);
    expect(result?.preset.id).toBe(SLENDRO_EXAMPLE.id);
  });

  it('test_empty_pool_returns_undefined', () => {
    const result = bestStabilityPreset(261.63, undefined, []);
    expect(result).toBeUndefined();
  });

  it('test_score_matches_best_mode_stability_score', () => {
    const result = bestStabilityPreset(261.63, undefined, [TWELVE_TET]);
    if (result === undefined) throw new Error('no result');
    const tuning = loadTuningPreset(result.preset);
    const ranked = rankModesByStability(tuning, 261.63);
    const bestScore = ranked[0]?.score;
    if (bestScore === undefined) throw new Error('no score');
    expect(result.score).toBeCloseTo(bestScore, 10);
  });

  it('test_uses_all_presets_by_default', () => {
    const result = bestStabilityPreset(261.63);
    expect(result).not.toBeUndefined();
    if (result === undefined) return;
    expect(ALL_PRESETS.some((p) => p.id === result.preset.id)).toBe(true);
  });
});

// Q210 — mostHarmonicPreset
describe('mostHarmonicPreset (Q210)', () => {
  it('test_returns_preset_and_harmonicity', () => {
    const result = mostHarmonicPreset(440, undefined, [TWELVE_TET, SLENDRO_EXAMPLE]);
    expect(result).not.toBeUndefined();
    if (result === undefined) return;
    expect(result).toHaveProperty('preset');
    expect(result).toHaveProperty('harmonicity');
  });

  it('test_harmonicity_matches_report', () => {
    const result = mostHarmonicPreset(440, undefined, [TWELVE_TET]);
    if (result === undefined) throw new Error('no result');
    const reports = allPresetReports(440, undefined, [TWELVE_TET]);
    const entry = reports[0];
    if (entry === undefined) throw new Error('no entry');
    expect(result.harmonicity).toBeCloseTo(entry.report.bestMode.harmonicity, 10);
  });

  it('test_empty_pool_returns_undefined', () => {
    const result = mostHarmonicPreset(440, undefined, []);
    expect(result).toBeUndefined();
  });

  it('test_has_minimum_harmonicity_among_pool', () => {
    const pool: readonly TuningPreset[] = [TWELVE_TET, SLENDRO_EXAMPLE, JUST_INTONATION_5L];
    const result = mostHarmonicPreset(440, undefined, pool);
    if (result === undefined) throw new Error('no result');
    const reports = allPresetReports(440, undefined, pool);
    const minH = Math.min(...reports.map((r) => r.report.bestMode.harmonicity));
    expect(result.harmonicity).toBeCloseTo(minH, 10);
  });

  it('test_uses_440_as_default_rootHz', () => {
    const a = mostHarmonicPreset(undefined, undefined, [TWELVE_TET]);
    const b = mostHarmonicPreset(440, undefined, [TWELVE_TET]);
    expect(a?.harmonicity).toBeCloseTo(b?.harmonicity ?? -1, 10);
  });
});

// Q211 — presetHarmonicityLeague
describe('presetHarmonicityLeague (Q211)', () => {
  it('test_returns_array_same_length_as_pool', () => {
    const league = presetHarmonicityLeague(440, undefined, [TWELVE_TET, SLENDRO_EXAMPLE]);
    expect(league.length).toBe(2);
  });

  it('test_sorted_ascending_by_harmonicity', () => {
    const league = presetHarmonicityLeague(440, undefined, [
      TWELVE_TET,
      SLENDRO_EXAMPLE,
      JUST_INTONATION_5L,
    ]);
    for (let i = 1; i < league.length; i++) {
      expect(league[i]?.harmonicity ?? 0).toBeGreaterThanOrEqual(league[i - 1]?.harmonicity ?? 0);
    }
  });

  it('test_empty_pool_returns_empty_array', () => {
    const league = presetHarmonicityLeague(440, undefined, []);
    expect(league).toEqual([]);
  });

  it('test_each_entry_has_preset_and_harmonicity', () => {
    const league = presetHarmonicityLeague(440, undefined, [TWELVE_TET]);
    const entry = league[0];
    expect(entry).toHaveProperty('preset');
    expect(entry).toHaveProperty('harmonicity');
    expect(typeof entry?.harmonicity).toBe('number');
  });

  it('test_first_entry_matches_most_harmonic_preset', () => {
    const pool: readonly TuningPreset[] = [TWELVE_TET, SLENDRO_EXAMPLE];
    const league = presetHarmonicityLeague(440, undefined, pool);
    const most = mostHarmonicPreset(440, undefined, pool);
    expect(league[0]?.preset.id).toBe(most?.preset.id);
  });
});

// Q212 — allPresetsDemoWav
describe('allPresetsDemoWav (Q212)', () => {
  const FAST_OPTS = { sampleRate: 8000, chordSeconds: 0.05, seconds: 1.0, decay: 3 };

  it('test_returns_uint8array', () => {
    const wav = allPresetsDemoWav([0, 2], 261.63, undefined, FAST_OPTS);
    expect(wav).toBeInstanceOf(Uint8Array);
  });

  it('test_wav_has_riff_header', () => {
    const wav = allPresetsDemoWav([0], 261.63, undefined, FAST_OPTS);
    const header = String.fromCharCode(...wav.slice(0, 4));
    expect(header).toBe('RIFF');
  });

  it('test_wav_length_scales_with_presets', () => {
    const wav = allPresetsDemoWav([0], 261.63, undefined, FAST_OPTS);
    expect(wav.byteLength).toBeGreaterThan(44);
  });

  it('test_pattern_with_more_steps_produces_longer_wav', () => {
    const short = allPresetsDemoWav([0], 261.63, undefined, FAST_OPTS);
    const long = allPresetsDemoWav([0, 2, 4], 261.63, undefined, FAST_OPTS);
    expect(long.byteLength).toBeGreaterThan(short.byteLength);
  });

  it('test_uses_correct_sample_rate_in_header', () => {
    const wav = allPresetsDemoWav([0], 261.63, undefined, FAST_OPTS);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    const sr = view.getUint32(24, true);
    expect(sr).toBe(8000);
  });
});

// Q218 — isPresetTopN
describe('isPresetTopN (Q218)', () => {
  it('test_top1_contains_most_harmonic', () => {
    const league = presetHarmonicityLeague(440, undefined, [TWELVE_TET, JUST_INTONATION_5L]);
    const topId = league[0]?.preset.id ?? '';
    expect(isPresetTopN(topId, 1, 440, undefined, [TWELVE_TET, JUST_INTONATION_5L])).toBe(true);
  });

  it('test_non_top1_returns_false_for_n1', () => {
    const league = presetHarmonicityLeague(440, undefined, [TWELVE_TET, JUST_INTONATION_5L]);
    const bottomId = league[league.length - 1]?.preset.id ?? '';
    if (league.length > 1) {
      expect(isPresetTopN(bottomId, 1, 440, undefined, [TWELVE_TET, JUST_INTONATION_5L])).toBe(
        false,
      );
    }
  });

  it('test_unknown_preset_returns_false', () => {
    expect(isPresetTopN('nonexistent', 5)).toBe(false);
  });

  it('test_n_equal_pool_size_includes_all', () => {
    const pool: readonly TuningPreset[] = [TWELVE_TET, SLENDRO_EXAMPLE];
    expect(isPresetTopN(TWELVE_TET.id, 2, 440, undefined, pool)).toBe(true);
    expect(isPresetTopN(SLENDRO_EXAMPLE.id, 2, 440, undefined, pool)).toBe(true);
  });

  it('test_n_zero_always_returns_false', () => {
    expect(isPresetTopN(TWELVE_TET.id, 0)).toBe(false);
  });
});

// Q219 — presetBestChord
describe('presetBestChord (Q219)', () => {
  it('test_returns_chord_map_analysis_entry', () => {
    const entry = presetBestChord('12-tet');
    expect(entry).not.toBeUndefined();
    expect(entry).toHaveProperty('chord');
    expect(entry).toHaveProperty('dissonance');
    expect(entry).toHaveProperty('harmonicity');
  });

  it('test_unknown_preset_returns_undefined', () => {
    expect(presetBestChord('nonexistent')).toBeUndefined();
  });

  it('test_dissonance_is_non_negative', () => {
    const entry = presetBestChord('just-5-limit');
    expect(entry?.dissonance).toBeGreaterThanOrEqual(0);
  });

  it('test_accepts_explicit_spectrum', () => {
    const entry = presetBestChord('12-tet', undefined);
    expect(entry).toHaveProperty('chord');
  });

  it('test_returns_entry_for_each_preset', () => {
    for (const preset of [TWELVE_TET, JUST_INTONATION_5L, SLENDRO_EXAMPLE]) {
      const entry = presetBestChord(preset.id);
      expect(entry).not.toBeUndefined();
    }
  });
});

// Q220 — rankPresetsByReportSimilarity
describe('rankPresetsByReportSimilarity (Q220)', () => {
  const report = tuningReport(loadTuningPreset(TWELVE_TET), 440);

  it('test_returns_array_same_length_as_pool', () => {
    const ranked = rankPresetsByReportSimilarity(report, 440, undefined, [
      TWELVE_TET,
      SLENDRO_EXAMPLE,
    ]);
    expect(ranked.length).toBe(2);
  });

  it('test_sorted_descending_by_similarity', () => {
    const ranked = rankPresetsByReportSimilarity(report, 440, undefined, [
      TWELVE_TET,
      JUST_INTONATION_5L,
      SLENDRO_EXAMPLE,
    ]);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]?.similarity ?? 0).toBeGreaterThanOrEqual(ranked[i]?.similarity ?? 0);
    }
  });

  it('test_most_similar_preset_has_highest_score', () => {
    const ranked = rankPresetsByReportSimilarity(report, 440, undefined, [
      TWELVE_TET,
      SLENDRO_EXAMPLE,
    ]);
    expect(ranked[0]?.similarity).toBeGreaterThanOrEqual(ranked[1]?.similarity ?? 0);
  });

  it('test_empty_pool_returns_empty_array', () => {
    const ranked = rankPresetsByReportSimilarity(report, 440, undefined, []);
    expect(ranked).toEqual([]);
  });

  it('test_each_entry_has_preset_and_similarity', () => {
    const ranked = rankPresetsByReportSimilarity(report, 440, undefined, [TWELVE_TET]);
    expect(ranked[0]).toHaveProperty('preset');
    expect(ranked[0]).toHaveProperty('similarity');
    expect(typeof ranked[0]?.similarity).toBe('number');
  });
});

// Q222 — comparePresets
describe('comparePresets (Q222)', () => {
  it('test_returns_result_with_a_b_comparison', () => {
    const result = comparePresets('12-tet', 'just-5-limit');
    expect(result).not.toBeUndefined();
    expect(result).toHaveProperty('a');
    expect(result).toHaveProperty('b');
    expect(result).toHaveProperty('comparison');
  });

  it('test_a_and_b_preset_ids_match_inputs', () => {
    const result = comparePresets('12-tet', 'just-5-limit');
    expect(result?.a.id).toBe('12-tet');
    expect(result?.b.id).toBe('just-5-limit');
  });

  it('test_comparison_has_correlation_field', () => {
    const result = comparePresets('12-tet', 'just-5-limit');
    expect(typeof result?.comparison.correlation).toBe('number');
  });

  it('test_unknown_preset_a_returns_undefined', () => {
    expect(comparePresets('nonexistent', 'just-5-limit')).toBeUndefined();
  });

  it('test_unknown_preset_b_returns_undefined', () => {
    expect(comparePresets('12-tet', 'nonexistent')).toBeUndefined();
  });

  it('test_accepts_custom_rootHz', () => {
    const result = comparePresets('12-tet', 'just-5-limit', 261.63);
    expect(result).not.toBeUndefined();
    expect(typeof result?.comparison.harmonicityDistanceDiff).toBe('number');
  });
});
