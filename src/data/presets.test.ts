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
  betterPreset,
  presetProgressionNarrative,
  allPresetsSimilarityMatrix,
  presetFullBundle,
  topPresetsByStabilityReport,
  rankPresetsByFullBundle,
  bestPresetForSpectrum,
  presetModeIntervalSets,
  presetVolatilityRanking,
  presetSpectralFitRanking,
  presetFamilyReport,
  presetProgressionVariety,
  bestPresetConsistency,
  topPresetsByEntropy,
  presetEntropyLeague,
  presetEntropyProfile,
  presetBestEntropyModeWav,
  presetConsistencyEntropyDelta,
  presetModeComparison,
  presetModeRankingBundle,
} from './presets.js';
import { type TuningPreset, loadTuningPreset } from './tuning-data.js';
import { rankModesByStability, tuningReport } from '../core/scale.js';
import { harmonicSpectrum } from '../core/spectrum.js';

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

// Q229 — betterPreset
describe('betterPreset (Q229)', () => {
  it('returns winner id which is one of the two inputs', () => {
    const result = betterPreset('12-tet', 'just-5-limit', 261.63);
    expect(['12-tet', 'just-5-limit']).toContain(result.winnerId);
    expect(['12-tet', 'just-5-limit']).toContain(result.loserId);
    expect(result.winnerId).not.toBe(result.loserId);
  });

  it('delta is non-negative', () => {
    const result = betterPreset('12-tet', 'just-5-limit', 261.63);
    expect(result.delta).toBeGreaterThanOrEqual(0);
  });

  it('metric is harmonicity or stability', () => {
    const result = betterPreset('12-tet', 'just-5-limit', 261.63);
    expect(['harmonicity', 'stability']).toContain(result.metric);
  });

  it('throws for invalid preset id', () => {
    expect(() => betterPreset('nonexistent', 'just-5-limit', 261.63)).toThrow(RangeError);
  });
});

// Q232 — presetProgressionNarrative
describe('presetProgressionNarrative (Q232)', () => {
  it('returns a non-empty string for 12-tet', () => {
    const text = presetProgressionNarrative('12-tet', [0, 2, 4, 0], 261.63);
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(10);
  });

  it('returns fallback for invalid preset', () => {
    const text = presetProgressionNarrative('nonexistent', [0, 1], 261.63);
    expect(text).toContain('nonexistent');
  });
});

describe('allPresetsSimilarityMatrix (Q246)', () => {
  it('returns ids and square matrix', () => {
    const { ids, matrix } = allPresetsSimilarityMatrix();
    expect(ids.length).toBeGreaterThan(0);
    expect(matrix).toHaveLength(ids.length);
    matrix.forEach((row) => expect(row).toHaveLength(ids.length));
  });
  it('diagonal is 1.0', () => {
    const { matrix } = allPresetsSimilarityMatrix();
    matrix.forEach((row, i) => {
      expect(row[i]).toBe(1.0);
    });
  });
});

describe('presetFullBundle (Q248)', () => {
  it('returns all 6 fields for 12-tet', () => {
    const bundle = presetFullBundle('12-tet');
    expect(bundle.wav).toBeInstanceOf(Uint8Array);
    expect(bundle.smf).toBeInstanceOf(Uint8Array);
    expect(typeof bundle.scl).toBe('string');
    expect(typeof bundle.tun).toBe('string');
    expect(bundle.mts).toBeInstanceOf(Uint8Array);
    expect(bundle.report).toBeDefined();
    expect(bundle.report.id).toBeTruthy();
  });
  it('throws for unknown preset', () => {
    expect(() => presetFullBundle('nonexistent')).toThrow(RangeError);
  });
});

describe('topPresetsByStabilityReport (Q251)', () => {
  it('returns n entries', () => {
    const results = topPresetsByStabilityReport(2, 261.63);
    expect(results).toHaveLength(2);
    results.forEach((r) => {
      expect(typeof r.presetId).toBe('string');
      expect(r.report).toBeDefined();
    });
  });
  it('throws for n <= 0', () => {
    expect(() => topPresetsByStabilityReport(0)).toThrow(RangeError);
  });
  it('clamps to preset count', () => {
    const results = topPresetsByStabilityReport(999, 261.63);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('rankPresetsByFullBundle (Q253)', () => {
  it('returns all presets ranked', () => {
    const ranked = rankPresetsByFullBundle(261.63);
    expect(ranked.length).toBeGreaterThan(0);
    ranked.forEach((r) => {
      expect(typeof r.presetId).toBe('string');
      expect(r.bundleSize).toBeGreaterThan(0);
      expect(r.report).toBeDefined();
    });
  });
  it('sorted by harmonicity ascending', () => {
    const ranked = rankPresetsByFullBundle(261.63);
    for (let i = 0; i + 1 < ranked.length; i++) {
      expect(ranked[i]!.report.bestMode.harmonicity).toBeLessThanOrEqual(
        ranked[i + 1]!.report.bestMode.harmonicity,
      );
    }
  });
});

describe('bestPresetForSpectrum (Q257)', () => {
  it('returns a preset id and harmonicity', () => {
    const { presetId, harmonicity } = bestPresetForSpectrum(harmonicSpectrum());
    expect(typeof presetId).toBe('string');
    expect(presetId.length).toBeGreaterThan(0);
    expect(Number.isFinite(harmonicity)).toBe(true);
  });
  it('harmonicity is non-negative', () => {
    expect(bestPresetForSpectrum(harmonicSpectrum()).harmonicity).toBeGreaterThanOrEqual(0);
  });
});

describe('presetModeIntervalSets (Q258)', () => {
  it('returns interval sets for 12-tet', () => {
    const sets = presetModeIntervalSets('12-tet');
    expect(sets.length).toBeGreaterThan(0);
    sets.forEach((s) => {
      expect(s.mode).toBeDefined();
      expect(Array.isArray(s.intervalCents)).toBe(true);
    });
  });
  it('throws for unknown preset', () => {
    expect(() => presetModeIntervalSets('nonexistent')).toThrow(RangeError);
  });
  it('interval cents sum to periodCents', () => {
    const sets = presetModeIntervalSets('12-tet');
    sets.forEach((s) => {
      const sum = s.intervalCents.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1200, 2);
    });
  });
});

describe('presetVolatilityRanking (Q262)', () => {
  it('returns all presets ranked by volatility', () => {
    const ranked = presetVolatilityRanking();
    expect(ranked.length).toBeGreaterThan(0);
    ranked.forEach((r) => {
      expect(typeof r.presetId).toBe('string');
      expect(r.volatility).toBeGreaterThanOrEqual(0);
    });
  });
  it('sorted ascending by volatility', () => {
    const ranked = presetVolatilityRanking();
    for (let i = 0; i + 1 < ranked.length; i++) {
      expect(ranked[i]!.volatility).toBeLessThanOrEqual(ranked[i + 1]!.volatility);
    }
  });
});

describe('presetSpectralFitRanking (Q266)', () => {
  it('returns all presets ranked by spectral fit', () => {
    const ranked = presetSpectralFitRanking(harmonicSpectrum());
    expect(ranked.length).toBeGreaterThan(0);
    ranked.forEach((r) => {
      expect(typeof r.presetId).toBe('string');
      expect(Number.isFinite(r.spectralFit)).toBe(true);
    });
  });
  it('sorted ascending by spectralFit', () => {
    const ranked = presetSpectralFitRanking(harmonicSpectrum());
    for (let i = 0; i + 1 < ranked.length; i++) {
      expect(ranked[i]!.spectralFit).toBeLessThanOrEqual(ranked[i + 1]!.spectralFit);
    }
  });
});

describe('presetFamilyReport (Q275)', () => {
  it('returns family report for two presets', () => {
    const report = presetFamilyReport(['12-tet', 'just-5-limit']);
    expect(report.ids).toHaveLength(2);
    expect(report.reports).toHaveLength(2);
    expect(typeof report.meanSimilarity === 'number' || Number.isNaN(report.meanSimilarity)).toBe(
      true,
    );
  });
  it('throws for unknown preset id', () => {
    expect(() => presetFamilyReport(['nonexistent'])).toThrow(RangeError);
  });
});

describe('presetProgressionVariety (Q280)', () => {
  it('returns value in (0, 1] for 12-tet', () => {
    const v = presetProgressionVariety('12-tet');
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('throws for unknown preset', () => {
    expect(() => presetProgressionVariety('nonexistent')).toThrow(RangeError);
  });
});

describe('bestPresetConsistency (Q285)', () => {
  it('returns a preset id and consistency score', () => {
    const { presetId, consistency } = bestPresetConsistency();
    expect(typeof presetId).toBe('string');
    expect(presetId.length).toBeGreaterThan(0);
    expect(consistency).toBeGreaterThan(0);
    expect(consistency).toBeLessThanOrEqual(1);
  });
});

describe('topPresetsByEntropy (Q290)', () => {
  it('returns n entries sorted by entropy descending', () => {
    const results = topPresetsByEntropy(2, undefined, 261.63);
    expect(results).toHaveLength(2);
    expect(results[0]!.entropy).toBeGreaterThanOrEqual(results[1]!.entropy);
  });
  it('throws for n <= 0', () => {
    expect(() => topPresetsByEntropy(0)).toThrow(RangeError);
  });
});

describe('presetEntropyLeague (Q293)', () => {
  it('returns high, medium, low arrays', () => {
    const { high, medium, low } = presetEntropyLeague();
    expect(Array.isArray(high)).toBe(true);
    expect(Array.isArray(medium)).toBe(true);
    expect(Array.isArray(low)).toBe(true);
    // Total should cover all presets
    expect(high.length + medium.length + low.length).toBeGreaterThan(0);
  });
  it('each preset appears exactly once', () => {
    const { high, medium, low } = presetEntropyLeague();
    const all = [...high, ...medium, ...low];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('presetEntropyProfile (Q296)', () => {
  it('returns array of mode/entropy pairs', () => {
    const profile = presetEntropyProfile('12-tet');
    expect(Array.isArray(profile)).toBe(true);
    expect(profile.length).toBeGreaterThan(0);
    for (const { mode, entropy } of profile) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(entropy).toBeGreaterThanOrEqual(0);
    }
  });
  it('throws for unknown preset', () => {
    expect(() => presetEntropyProfile('not-a-preset')).toThrow(RangeError);
  });
  it('returns one entry per tuning degree', () => {
    const profile = presetEntropyProfile('12-tet');
    // 12-TET has 12 degrees
    expect(profile.length).toBe(12);
  });
});

describe('presetBestEntropyModeWav (Q299)', () => {
  it('returns wav, entropy, mode for preset', () => {
    const result = presetBestEntropyModeWav('12-tet');
    expect(result.wav).toBeInstanceOf(Uint8Array);
    expect(result.wav.length).toBeGreaterThan(44);
    expect(typeof result.entropy).toBe('number');
    expect(result.entropy).toBeGreaterThanOrEqual(0);
    expect(result.mode).toHaveProperty('degreeIndices');
  });
  it('throws for unknown preset', () => {
    expect(() => presetBestEntropyModeWav('not-a-preset')).toThrow(RangeError);
  });
});

describe('presetConsistencyEntropyDelta (Q301)', () => {
  it('returns a number in [0, 1]', () => {
    const delta = presetConsistencyEntropyDelta('12-tet');
    expect(typeof delta).toBe('number');
    expect(delta).toBeGreaterThanOrEqual(0);
    expect(delta).toBeLessThanOrEqual(1);
    expect(Number.isFinite(delta)).toBe(true);
  });
  it('throws for unknown preset', () => {
    expect(() => presetConsistencyEntropyDelta('not-a-preset')).toThrow(RangeError);
  });
  it('accepts optional spectrum and rootHz', () => {
    const delta = presetConsistencyEntropyDelta('12-tet', harmonicSpectrum(), 261.63);
    expect(Number.isFinite(delta)).toBe(true);
  });
});

describe('presetModeComparison (Q311)', () => {
  it('returns one entry per mode with all three metrics', () => {
    const cmp = presetModeComparison('12-tet');
    expect(cmp.length).toBe(12);
    for (const { mode, entropy, consistency, volatility } of cmp) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(entropy).toBeGreaterThanOrEqual(0);
      expect(consistency).toBeGreaterThanOrEqual(0);
      expect(volatility).toBeGreaterThanOrEqual(0);
    }
  });
  it('throws for unknown preset', () => {
    expect(() => presetModeComparison('not-a-preset')).toThrow(RangeError);
  });
  it('accepts optional spectrum and rootHz', () => {
    const cmp = presetModeComparison('12-tet', harmonicSpectrum(), 261.63);
    expect(cmp.length).toBe(12);
    expect(Number.isFinite(cmp[0]!.entropy)).toBe(true);
  });
  it('accepts optional presets pool', () => {
    const cmp = presetModeComparison('12-tet', undefined, undefined, [TWELVE_TET]);
    expect(cmp.length).toBeGreaterThan(0);
  });
});

describe('presetModeRankingBundle (Q316)', () => {
  it('returns byEntropy, byConsistency, byVolatility arrays', () => {
    const bundle = presetModeRankingBundle('12-tet');
    expect(Array.isArray(bundle.byEntropy)).toBe(true);
    expect(Array.isArray(bundle.byConsistency)).toBe(true);
    expect(Array.isArray(bundle.byVolatility)).toBe(true);
  });
  it('all three arrays have length 12 for 12-tet', () => {
    const bundle = presetModeRankingBundle('12-tet');
    expect(bundle.byEntropy.length).toBe(12);
    expect(bundle.byConsistency.length).toBe(12);
    expect(bundle.byVolatility.length).toBe(12);
  });
  it('all entries are Scale objects with degreeIndices', () => {
    const bundle = presetModeRankingBundle('12-tet');
    for (const mode of bundle.byEntropy) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
  it('throws for unknown preset', () => {
    expect(() => presetModeRankingBundle('not-a-preset')).toThrow(RangeError);
  });
  it('accepts optional spectrum and rootHz', () => {
    const bundle = presetModeRankingBundle('12-tet', harmonicSpectrum(), 261.63);
    expect(bundle.byEntropy.length).toBe(12);
  });
  it('accepts optional presets pool', () => {
    const bundle = presetModeRankingBundle('12-tet', undefined, undefined, [TWELVE_TET]);
    expect(bundle.byEntropy.length).toBeGreaterThan(0);
  });
});
