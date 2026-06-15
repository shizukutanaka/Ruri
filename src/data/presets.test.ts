import { describe, it, expect } from 'vitest';
import {
  ALL_PRESETS,
  TWELVE_TET,
  SLENDRO_EXAMPLE,
  allPresetReports,
  bestStabilityPreset,
} from './presets.js';
import { type TuningPreset, loadTuningPreset } from './tuning-data.js';
import { rankModesByStability } from '../core/scale.js';

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
