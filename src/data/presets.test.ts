import { describe, it, expect } from 'vitest';
import { type TuningPreset, loadTuningPreset } from './tuning-data.js';
import { rankModesByStability, tuningReport } from '../core/scale.js';
import { harmonicSpectrum } from '../core/spectrum.js';

// Q207 — allPresetReports
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
  presetFullAnalysis,
  presetModeNarratives,
  presetModeFullBundle,
  presetFamilyAnalysis,
  presetModeProgressionBundles,
  presetFamilyModeRankings,
  presetFamilyFullBundle,
  presetScaleModeSpectralRankings,
  presetModeChordMapBundles,
  presetBestModeChordMapNarrative,
  presetModeNarrativeCompare,
  presetModeBestProgressionNarratives,
  presetBestSmoothMode,
  presetBestSmoothModeWav,
  presetFullSclBundle,
  presetModeConsistencyEntropyProfiles,
  presetModeDissonanceHistograms,
  presetModeDualHistograms,
  presetModeHistogramSummaries,
  presetModeAnalysisFull,
  presetHarmonicSpectralScore,
  presetComprehensiveReport,
  presetSimilarityRanking,
  presetModeIntervalProfile,
  presetMostDiverseMode,
  presetModeComprehensiveBundle,
  presetBestModeComprehensive,
  presetModeScoreRanking,
  presetIntervalDiversityVsEntropy,
  presetModeParetoFront,
  presetModeCorrelationMatrix,
  presetParetoFrontBestMode,
  presetModeTopCorrelation,
  presetModeAntiCorrelation,
  presetFamilyTopCorrelations,
  presetParetoFrontSummary,
  presetParetoFrontVsRanking,
  presetBestParetoRankedMode,
  presetParetoFrontGap,
  presetParetoFrontCoverage,
  presetCorrelationMatrixNarrative,
  presetParetoFrontNarrative,
  presetFullParetoCorrelationReport,
  presetModeMetricOutliers,
  presetModeMetricOutlierSummary,
  presetModeMetricProfile,
  presetModeMetricRadarData,
  presetModeMetricCluster,
  presetClusterSummary,
  presetModeRadarRanking,
  presetRadarRankingVsScoreRanking,
  presetBestRadarScoreAgreement,
  presetModeConsensusRanking,
  presetBestConsensusMode,
  presetUltimateBestMode,
  presetConsensusNarrative,
  presetModeComprehensiveMetricBundle,
  presetModeConsensusClusterBundle,
  presetTopClusterConsensusMode,
  presetModeConsensusOutlierBundle,
  presetModeInsightSummary,
  presetModeEntropyDiversityMap,
  presetModeConsistencyVolatilityMap,
  presetModeFiveDimMap,
  presetModeFiveDimNarrative,
  presetModeSmoothnessEntropyMap,
  presetModeDiversityVolatilityMap,
  presetModeAllQuadrantsBundle,
  presetModeAllQuadrantsNarrative,
  presetModeQuadrantConsensus,
  presetBestQuadrantConsensusMode,
  presetModeConsensusNarrative,
  presetModeQuadrantProfile,
  presetQuadrantCoverage,
  presetModeGroupByProfile,
  presetQuadrantCoverageNarrative,
  presetDominantQuadrantProfile,
  presetQuadrantProfileDiversity,
  presetQuadrantProfileDiversityNarrative,
  presetModeProfileTransitions,
  presetProfileTransitionScore,
  presetProfileTransitionScoreNarrative,
  presetProfileRunSummary,
  presetProfileRunSummaryNarrative,
  presetProfileRunDensity,
  presetProfileRunDensityNarrative,
  presetProfileTextureReport,
  presetProfileTextureReportNarrative,
  presetModeRarestProfileGroup,
  presetModeSoloProfileModes,
  presetModeSoloProfileNarrative,
  presetModeQuadrantIdentityBundle,
  presetModeQuadrantIdentityNarrative,
  presetModeAmbassador,
  presetModeAmbassadorNarrative,
  presetFamilyAmbassadorRanking,
  presetFamilyBestAmbassador,
  presetFamilyAmbassadorScoreStats,
  presetFamilyWeakestAmbassador,
  presetFamilyAmbassadorConsensusDistribution,
  presetFamilyAmbassadorProfileFrequency,
  presetFamilyLeastCommonAmbassadorProfile,
  presetFamilyAmbassadorConsensusScore,
  presetFamilyAmbassadorOverlapScore,
  presetFamilyAmbassadorOverlapScoreNarrative,
  presetFamilyAmbassadorConvergenceScore,
  presetFamilyAmbassadorConvergenceScoreNarrative,
  presetFamilyAmbassadorConsensusConvergenceScore,
  presetFamilyAmbassadorConsensusConvergenceScoreNarrative,
  presetFamilyAmbassadorConvergenceBundle,
  presetFamilyAmbassadorConvergenceBundleNarrative,
  presetFamilyAmbassadorMeanProfileDistance,
  presetFamilyAmbassadorMeanProfileDistanceNarrative,
  presetFamilyAmbassadorProfileDistanceStats,
  presetFamilyAmbassadorCentrality,
  presetFamilyAmbassadorOutlier,
  presetFamilyAmbassadorCentralityNarrative,
  presetFamilyAmbassadorDistanceSpread,
  presetFamilyAmbassadorDistanceSpreadNarrative,
  presetFamilyAmbassadorsSummaryTable,
  presetFamilyAmbassadorsSummaryNarrative,
  presetFamilyAmbassadorTopN,
  presetFamilySocraticRadarConsistencyScore,
  presetFamilySocraticRadarOutlierDetection,
  presetFamilySocraticRadarTrend,
  presetFamilySocraticRadarRobustnessScore,
  presetFamilySocraticRadarEvolutionScore,
  presetFamilySocraticRadarVolatilityIndex,
  presetFamilySocraticRadarCoherenceScore,
  presetFamilySocraticRadarMomentumScore,
  presetFamilySocraticRadarIQRScore,
  presetFamilySocraticRadarBimodalityScore,
  presetFamilySocraticRadarDependenceMatrix,
  presetFamilySocraticRadarWeakMembers,
  presetFamilySocraticRadarConvergenceScore,
  presetFamilySocraticRadarCrossAxisCorrelation,
  presetFamilySocraticRadarFamilyConvergence,
  presetFamilySocraticRadarApproximateEntropy,
  presetFamilySocraticRadarFractalDimension,
  presetFamilySocraticRadarSampleEntropy,
  presetFamilySocraticRadarTransferEntropy,
  presetFamilySocraticRadarLyapunovExponent,
  presetFamilySocraticRadarPermutationEntropy,
  presetFamilySocraticRadarDetrendedFluctuation,
  presetFamilySocraticRadarLocalExtremaCount,
  presetFamilySocraticRadarSilhouetteScore,
  presetFamilySocraticRadarDunnIndex,
  presetFamilySocraticRadarDaviesBouldinIndex,
  presetFamilySocraticRadarSpectralCentroidProfile,
  presetFamilySocraticRadarSpectralFlatnessProfile,
  presetFamilySocraticRadarSpectralRolloffProfile,
  presetFamilySocraticRadarSpectralBandwidthMean,
  presetFamilySocraticRadarCriticalBandRatio,
  presetFamilySocraticRadarRoughnessProfile,
  presetFamilySocraticRadarMaskingThresholdMean,
  presetFamilySocraticRadarPitchSalienceMean,
  presetFamilySocraticRadarModalCenterStrength,
  presetFamilySocraticRadarTonicStabilityIndex,
  presetFamilySocraticRadarLeadingToneScore,
  presetFamilySocraticRadarModalAmbiguity,
  presetFamilySocraticRadarKolmogorovProxy,
  presetFamilySocraticRadarLempelZivProxy,
  presetFamilySocraticRadarFractalDimensionProxy,
  presetFamilySocraticRadarSelfSimilarityScore,
  presetFamilySocraticRadarRepetitiveness,
  presetFamilySocraticRadarPredictabilityScore,
  presetFamilySocraticRadarNashEquilibriumProxy,
  presetFamilySocraticRadarGameValueMean,
  presetFamilySocraticRadarParetoDominanceCount,
  presetFamilySocraticRadarELECTREOutranking,
  presetFamilySocraticRadarPROMETHEEFlowMean,
  presetFamilySocraticRadarBetweennessCentralityMean,
  presetFamilySocraticRadarClusteringCoefficientMeanV2,
  presetFamilySocraticRadarGraphDensityMean,
  presetFamilySocraticRadarLaplacianMean,
} from './presets.js';

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


describe('presetFullAnalysis (Q321)', () => {
  it('returns reportCard, tripleMode, consistencyEntropyDelta, harmonicDensity', () => {
    const analysis = presetFullAnalysis('12-tet');
    expect(typeof analysis.reportCard).toBe('string');
    expect(analysis.reportCard.length).toBeGreaterThan(0);
    expect(typeof analysis.consistencyEntropyDelta).toBe('number');
    expect(typeof analysis.harmonicDensity).toBe('number');
    expect(analysis.tripleMode).toHaveProperty('allAgree');
  });
  it('reportCard contains tuning id', () => {
    const { reportCard } = presetFullAnalysis('12-tet');
    expect(reportCard).toContain('12-tet');
  });
  it('tripleMode has all three best modes', () => {
    const { tripleMode } = presetFullAnalysis('12-tet');
    expect(tripleMode.byEntropy).toHaveProperty('degreeIndices');
    expect(tripleMode.byConsistency).toHaveProperty('degreeIndices');
    expect(tripleMode.byVolatility).toHaveProperty('degreeIndices');
  });
  it('consistencyEntropyDelta is in [0, 1]', () => {
    const { consistencyEntropyDelta } = presetFullAnalysis('12-tet');
    expect(consistencyEntropyDelta).toBeGreaterThanOrEqual(0);
    expect(consistencyEntropyDelta).toBeLessThanOrEqual(1);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFullAnalysis('not-a-preset')).toThrow(RangeError);
  });
  it('accepts optional spectrum and rootHz', () => {
    const analysis = presetFullAnalysis('12-tet', 261.63, harmonicSpectrum());
    expect(typeof analysis.reportCard).toBe('string');
  });
  it('accepts optional presets pool', () => {
    const analysis = presetFullAnalysis('12-tet', 440, undefined, [TWELVE_TET]);
    expect(typeof analysis.reportCard).toBe('string');
  });
});


describe('presetModeNarratives (Q326)', () => {
  it('returns one narrative per mode', () => {
    const narratives = presetModeNarratives('12-tet');
    expect(narratives.length).toBeGreaterThan(0);
    for (const { mode, narrative } of narratives) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(typeof narrative).toBe('string');
      expect(narrative.length).toBeGreaterThan(0);
    }
  });

  it('throws for unknown preset', () => {
    expect(() => presetModeNarratives('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional spectrum and rootHz', () => {
    const narratives = presetModeNarratives('12-tet', 261.63, harmonicSpectrum());
    expect(narratives.length).toBeGreaterThan(0);
  });

  it('accepts optional presets pool', () => {
    const narratives = presetModeNarratives('12-tet', 440, undefined, [TWELVE_TET]);
    expect(narratives.length).toBeGreaterThan(0);
  });
});


describe('presetModeFullBundle (Q332)', () => {
  it('returns full bundle for 12-tet', () => {
    const bundle = presetModeFullBundle('12-tet');
    expect(bundle.length).toBeGreaterThan(0);
    expect(bundle[0]!).toHaveProperty('narrative');
    expect(bundle[0]!).toHaveProperty('summary');
  });

  it('all entries have required fields', () => {
    const bundle = presetModeFullBundle('12-tet');
    for (const entry of bundle) {
      expect(entry).toHaveProperty('mode');
      expect(typeof entry.entropy).toBe('number');
      expect(typeof entry.consistency).toBe('number');
      expect(typeof entry.volatility).toBe('number');
      expect(typeof entry.narrative).toBe('string');
      expect(entry.summary).toHaveProperty('count');
    }
  });

  it('throws for unknown preset', () => {
    expect(() => presetModeFullBundle('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional spectrum and rootHz', () => {
    const bundle = presetModeFullBundle('12-tet', 261.63, harmonicSpectrum());
    expect(bundle.length).toBeGreaterThan(0);
    expect(typeof bundle[0]!.entropy).toBe('number');
  });

  it('accepts optional presets pool', () => {
    const bundle = presetModeFullBundle('12-tet', 440, undefined, [TWELVE_TET]);
    expect(bundle.length).toBeGreaterThan(0);
  });
});


describe('presetFamilyAnalysis (Q335)', () => {
  it('returns analysis for each preset id', () => {
    const result = presetFamilyAnalysis(['12-tet', 'just-5-limit']);
    expect(result.length).toBe(2);
    expect(result[0]!.id).toBe('12-tet');
    expect(result[0]!.fullAnalysis).toHaveProperty('reportCard');
  });

  it('fullAnalysis has all expected fields', () => {
    const result = presetFamilyAnalysis(['12-tet']);
    const { fullAnalysis } = result[0]!;
    expect(typeof fullAnalysis.reportCard).toBe('string');
    expect(fullAnalysis.tripleMode).toHaveProperty('byEntropy');
    expect(fullAnalysis.tripleMode).toHaveProperty('byConsistency');
    expect(fullAnalysis.tripleMode).toHaveProperty('byVolatility');
    expect(typeof fullAnalysis.consistencyEntropyDelta).toBe('number');
    expect(typeof fullAnalysis.harmonicDensity).toBe('number');
  });

  it('throws for unknown preset id', () => {
    expect(() => presetFamilyAnalysis(['not-a-preset'])).toThrow(RangeError);
  });

  it('throws for mix of valid and invalid preset ids', () => {
    expect(() => presetFamilyAnalysis(['12-tet', 'not-a-preset'])).toThrow(RangeError);
  });

  it('returns empty array for empty input', () => {
    const result = presetFamilyAnalysis([]);
    expect(result).toEqual([]);
  });

  it('accepts optional spectrum and rootHz', () => {
    const result = presetFamilyAnalysis(['12-tet'], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
    expect(typeof result[0]!.fullAnalysis.reportCard).toBe('string');
  });

  it('accepts optional presets pool', () => {
    const result = presetFamilyAnalysis(['12-tet'], 440, undefined, [TWELVE_TET]);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe('12-tet');
  });
});


describe('presetModeProgressionBundles (Q338)', () => {
  it('returns one bundle per mode for 12-tet', () => {
    const bundles = presetModeProgressionBundles('12-tet');
    expect(bundles.length).toBeGreaterThan(0);
    for (const { mode, chords, smoothnessRatio } of bundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(Array.isArray(chords)).toBe(true);
      expect(typeof smoothnessRatio).toBe('number');
    }
  });

  it('smoothnessRatio is finite for every mode', () => {
    const bundles = presetModeProgressionBundles('12-tet');
    for (const { smoothnessRatio } of bundles) {
      expect(Number.isFinite(smoothnessRatio)).toBe(true);
      expect(smoothnessRatio).toBeGreaterThanOrEqual(0);
    }
  });

  it('throws for unknown preset', () => {
    expect(() => presetModeProgressionBundles('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional spectrum and rootHz', () => {
    const bundles = presetModeProgressionBundles('12-tet', 261.63, harmonicSpectrum());
    expect(bundles.length).toBeGreaterThan(0);
    expect(typeof bundles[0]!.smoothnessRatio).toBe('number');
  });

  it('accepts optional presets pool', () => {
    const bundles = presetModeProgressionBundles('12-tet', 440, undefined, [TWELVE_TET]);
    expect(bundles.length).toBeGreaterThan(0);
  });
});


describe('presetFamilyModeRankings (Q341)', () => {
  it('returns one entry per preset id', () => {
    const result = presetFamilyModeRankings(['12-tet', 'just-5-limit']);
    expect(result.length).toBe(2);
    expect(result[0]!.id).toBe('12-tet');
    expect(result[1]!.id).toBe('just-5-limit');
  });

  it('rankings has byEntropy, byConsistency, byVolatility arrays', () => {
    const result = presetFamilyModeRankings(['12-tet']);
    const { rankings } = result[0]!;
    expect(Array.isArray(rankings.byEntropy)).toBe(true);
    expect(Array.isArray(rankings.byConsistency)).toBe(true);
    expect(Array.isArray(rankings.byVolatility)).toBe(true);
  });

  it('each ranking array is non-empty', () => {
    const result = presetFamilyModeRankings(['12-tet']);
    const { rankings } = result[0]!;
    expect(rankings.byEntropy.length).toBeGreaterThan(0);
    expect(rankings.byConsistency.length).toBeGreaterThan(0);
    expect(rankings.byVolatility.length).toBeGreaterThan(0);
  });

  it('throws for unknown preset id', () => {
    expect(() => presetFamilyModeRankings(['not-a-preset'])).toThrow(RangeError);
  });

  it('throws for mix of valid and invalid preset ids', () => {
    expect(() => presetFamilyModeRankings(['12-tet', 'not-a-preset'])).toThrow(RangeError);
  });

  it('returns empty array for empty input', () => {
    const result = presetFamilyModeRankings([]);
    expect(result).toEqual([]);
  });

  it('accepts optional spectrum and rootHz', () => {
    const result = presetFamilyModeRankings(['12-tet'], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
    expect(result[0]!.rankings.byEntropy.length).toBeGreaterThan(0);
  });

  it('accepts optional presets pool', () => {
    const result = presetFamilyModeRankings(['12-tet'], 440, undefined, [TWELVE_TET]);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe('12-tet');
  });
});


describe('presetFamilyFullBundle (Q344)', () => {
  it('returns one entry per preset id', () => {
    const result = presetFamilyFullBundle(['12-tet', 'just-5-limit']);
    expect(result.length).toBe(2);
    expect(result[0]!.id).toBe('12-tet');
    expect(result[1]!.id).toBe('just-5-limit');
  });

  it('fullAnalysis has expected keys', () => {
    const result = presetFamilyFullBundle(['12-tet']);
    const { fullAnalysis } = result[0]!;
    expect(typeof fullAnalysis.reportCard).toBe('string');
    expect(fullAnalysis).toHaveProperty('tripleMode');
    expect(typeof fullAnalysis.consistencyEntropyDelta).toBe('number');
    expect(typeof fullAnalysis.harmonicDensity).toBe('number');
  });

  it('modeFullBundle is non-empty', () => {
    const result = presetFamilyFullBundle(['12-tet']);
    expect(result[0]!.modeFullBundle.length).toBeGreaterThan(0);
  });

  it('each modeFullBundle entry has required keys', () => {
    const result = presetFamilyFullBundle(['12-tet']);
    for (const entry of result[0]!.modeFullBundle) {
      expect(entry).toHaveProperty('mode');
      expect(typeof entry.entropy).toBe('number');
      expect(typeof entry.consistency).toBe('number');
      expect(typeof entry.volatility).toBe('number');
      expect(typeof entry.narrative).toBe('string');
      expect(entry).toHaveProperty('summary');
    }
  });

  it('throws for unknown preset id', () => {
    expect(() => presetFamilyFullBundle(['not-a-preset'])).toThrow(RangeError);
  });

  it('returns empty array for empty input', () => {
    const result = presetFamilyFullBundle([]);
    expect(result).toEqual([]);
  });

  it('accepts optional spectrum and rootHz', () => {
    const result = presetFamilyFullBundle(['12-tet'], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
  });

  it('accepts optional presets pool', () => {
    const result = presetFamilyFullBundle(['12-tet'], 440, undefined, [TWELVE_TET]);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe('12-tet');
  });
});


describe('presetScaleModeSpectralRankings (Q347)', () => {
  it('returns spectralRanking and normalizedScores', () => {
    const result = presetScaleModeSpectralRankings('12-tet', harmonicSpectrum());
    expect(Array.isArray(result.spectralRanking)).toBe(true);
    expect(Array.isArray(result.normalizedScores)).toBe(true);
  });

  it('spectralRanking is non-empty', () => {
    const result = presetScaleModeSpectralRankings('12-tet', harmonicSpectrum());
    expect(result.spectralRanking.length).toBeGreaterThan(0);
  });

  it('normalizedScores entries have normalizedDissonance and normalizedHarmonicity', () => {
    const result = presetScaleModeSpectralRankings('12-tet', harmonicSpectrum());
    for (const score of result.normalizedScores) {
      expect(score).toHaveProperty('entry');
      expect(typeof score.normalizedDissonance).toBe('number');
      expect(typeof score.normalizedHarmonicity).toBe('number');
    }
  });

  it('throws for unknown preset id', () => {
    expect(() => presetScaleModeSpectralRankings('not-a-preset', harmonicSpectrum())).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const result = presetScaleModeSpectralRankings('12-tet', harmonicSpectrum(), 261.63);
    expect(result.spectralRanking.length).toBeGreaterThan(0);
  });

  it('accepts optional presets pool', () => {
    const result = presetScaleModeSpectralRankings('12-tet', harmonicSpectrum(), 440, [TWELVE_TET]);
    expect(result.spectralRanking.length).toBeGreaterThan(0);
  });
});


describe('presetModeChordMapBundles (Q349)', () => {
  it('returns one bundle per mode', () => {
    const bundles = presetModeChordMapBundles('12-tet', harmonicSpectrum());
    expect(bundles.length).toBeGreaterThan(0);
  });

  it('each bundle has mode and chordMapBundle', () => {
    const bundles = presetModeChordMapBundles('12-tet', harmonicSpectrum());
    for (const { mode, chordMapBundle } of bundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(chordMapBundle).toHaveProperty('rankedBundle');
      expect(chordMapBundle).toHaveProperty('volatilityBundle');
      expect(chordMapBundle).toHaveProperty('progression');
    }
  });

  it('volatilityBundle has volatility, entropy, consistency', () => {
    const bundles = presetModeChordMapBundles('12-tet', harmonicSpectrum());
    const first = bundles[0]!;
    expect(typeof first.chordMapBundle.volatilityBundle.volatility).toBe('number');
    expect(typeof first.chordMapBundle.volatilityBundle.entropy).toBe('number');
    expect(typeof first.chordMapBundle.volatilityBundle.consistency).toBe('number');
  });

  it('throws for unknown preset id', () => {
    expect(() => presetModeChordMapBundles('not-a-preset', harmonicSpectrum())).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const bundles = presetModeChordMapBundles('12-tet', harmonicSpectrum(), 261.63);
    expect(bundles.length).toBeGreaterThan(0);
  });

  it('accepts optional presets pool', () => {
    const bundles = presetModeChordMapBundles('12-tet', harmonicSpectrum(), 440, [TWELVE_TET]);
    expect(bundles.length).toBeGreaterThan(0);
  });
});


describe('presetBestModeChordMapNarrative (Q353)', () => {
  it('returns mode and narrative for entropy metric', () => {
    const result = presetBestModeChordMapNarrative('12-tet', 'entropy');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('returns mode and narrative for consistency metric', () => {
    const result = presetBestModeChordMapNarrative('12-tet', 'consistency');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.consistency).toBe('number');
  });

  it('returns mode and narrative for volatility metric', () => {
    const result = presetBestModeChordMapNarrative('12-tet', 'volatility');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.volatility).toBe('number');
  });

  it('result has all six expected keys', () => {
    const result = presetBestModeChordMapNarrative('12-tet', 'entropy');
    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('narrative');
    expect(result).toHaveProperty('volatility');
    expect(result).toHaveProperty('entropy');
    expect(result).toHaveProperty('consistency');
    expect(result).toHaveProperty('smoothnessRatio');
  });

  it('throws for unknown preset id', () => {
    expect(() => presetBestModeChordMapNarrative('not-a-preset', 'entropy')).toThrow(RangeError);
  });

  it('accepts optional rootHz and spectrum', () => {
    const result = presetBestModeChordMapNarrative('12-tet', 'entropy', 261.63, harmonicSpectrum());
    expect(result.mode).toHaveProperty('degreeIndices');
  });

  it('accepts optional presets pool', () => {
    const result = presetBestModeChordMapNarrative('12-tet', 'entropy', 440, undefined, [
      TWELVE_TET,
    ]);
    expect(result.mode).toHaveProperty('degreeIndices');
  });
});


// ---------------------------------------------------------------------------
// Q355 — presetModeNarrativeCompare
// ---------------------------------------------------------------------------

describe('presetModeNarrativeCompare (Q355)', () => {
  it('returns best modes for all three metrics and allSameMode flag', () => {
    const cmp = presetModeNarrativeCompare('12-tet');
    expect(cmp.bestEntropy.mode).toHaveProperty('degreeIndices');
    expect(cmp.bestConsistency.mode).toHaveProperty('degreeIndices');
    expect(cmp.bestVolatility.mode).toHaveProperty('degreeIndices');
    expect(typeof cmp.allSameMode).toBe('boolean');
  });

  it('all three best modes have narrative strings', () => {
    const cmp = presetModeNarrativeCompare('12-tet');
    expect(typeof cmp.bestEntropy.narrative).toBe('string');
    expect(cmp.bestEntropy.narrative.length).toBeGreaterThan(0);
    expect(typeof cmp.bestConsistency.narrative).toBe('string');
    expect(typeof cmp.bestVolatility.narrative).toBe('string');
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetModeNarrativeCompare('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional rootHz and spectrum', () => {
    const cmp = presetModeNarrativeCompare('12-tet', 261.63, harmonicSpectrum());
    expect(typeof cmp.allSameMode).toBe('boolean');
  });

  it('accepts optional presets pool', () => {
    const cmp = presetModeNarrativeCompare('12-tet', 440, undefined, [TWELVE_TET]);
    expect(cmp.bestEntropy.mode).toHaveProperty('degreeIndices');
  });
});


// ---------------------------------------------------------------------------
// Q359 — presetModeBestProgressionNarratives
// ---------------------------------------------------------------------------

describe('presetModeBestProgressionNarratives (Q359)', () => {
  it('returns one entry per mode with mode, narrative, smoothnessRatio', () => {
    const results = presetModeBestProgressionNarratives('12-tet');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0]!;
    expect(first.mode).toHaveProperty('degreeIndices');
    expect(typeof first.narrative).toBe('string');
    expect(first.narrative.length).toBeGreaterThan(0);
    expect(first.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetModeBestProgressionNarratives('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional rootHz and spectrum', () => {
    const results = presetModeBestProgressionNarratives('12-tet', 261.63, harmonicSpectrum());
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0]!.narrative).toBe('string');
  });

  it('accepts optional presets pool', () => {
    const results = presetModeBestProgressionNarratives('12-tet', 440, undefined, [TWELVE_TET]);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.mode).toHaveProperty('degreeIndices');
  });
});


// ---------------------------------------------------------------------------
// Q362 — presetBestSmoothMode
// ---------------------------------------------------------------------------

describe('presetBestSmoothMode (Q362)', () => {
  it('returns mode and smoothnessRatio for a known preset', () => {
    const result = presetBestSmoothMode('12-tet');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.smoothnessRatio).toBe('number');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetBestSmoothMode('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional rootHz and spectrum', () => {
    const result = presetBestSmoothMode('12-tet', 261.63, harmonicSpectrum());
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('accepts optional presets pool', () => {
    const result = presetBestSmoothMode('12-tet', 440, undefined, [TWELVE_TET]);
    expect(result.mode).toHaveProperty('degreeIndices');
  });
});


// ---------------------------------------------------------------------------
// Q369 — presetBestSmoothModeWav
// ---------------------------------------------------------------------------

describe('presetBestSmoothModeWav (Q369)', () => {
  it('returns wav, mode, smoothnessRatio for a known preset', () => {
    const result = presetBestSmoothModeWav('12-tet');
    expect(result.wav instanceof Uint8Array).toBe(true);
    expect(result.wav.length).toBeGreaterThan(44);
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.smoothnessRatio).toBe('number');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('wav has RIFF header', () => {
    const { wav } = presetBestSmoothModeWav('12-tet');
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetBestSmoothModeWav('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional rootHz and spectrum', () => {
    const result = presetBestSmoothModeWav('12-tet', 261.63, harmonicSpectrum());
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('accepts optional presets pool', () => {
    const result = presetBestSmoothModeWav('12-tet', 440, undefined, undefined, [TWELVE_TET]);
    expect(result.mode).toHaveProperty('degreeIndices');
  });
});


// ---------------------------------------------------------------------------
// Q376 — presetFullSclBundle
// ---------------------------------------------------------------------------

describe('presetFullSclBundle (Q376)', () => {
  it('returns scl, rankedBundle, volatilityBundle, progressionSclBundle for a known preset', () => {
    const bundle = presetFullSclBundle('12-tet', harmonicSpectrum());
    expect(typeof bundle.scl).toBe('string');
    expect(bundle.scl.length).toBeGreaterThan(0);
    expect(bundle.rankedBundle).toHaveProperty('spectralRanking');
    expect(bundle.rankedBundle).toHaveProperty('entropy');
    expect(bundle.volatilityBundle).toHaveProperty('volatility');
    expect(bundle.volatilityBundle).toHaveProperty('consistency');
    expect(bundle.progressionSclBundle).toHaveProperty('chords');
    expect(bundle.progressionSclBundle).toHaveProperty('smoothnessRatio');
    expect(bundle.progressionSclBundle).toHaveProperty('narrative');
  });

  it('scl has valid Scala header', () => {
    const { scl } = presetFullSclBundle('12-tet', harmonicSpectrum());
    expect(scl).toContain('!');
  });

  it('scl matches the scl in rankedBundle', () => {
    const bundle = presetFullSclBundle('12-tet', harmonicSpectrum());
    expect(bundle.scl).toBe(bundle.rankedBundle.scl);
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetFullSclBundle('not-a-preset', harmonicSpectrum())).toThrow(RangeError);
  });

  it('accepts optional rootHz and name', () => {
    const bundle = presetFullSclBundle('12-tet', harmonicSpectrum(), 261.63, 'Custom');
    expect(bundle.scl).toContain('Custom');
  });

  it('accepts optional presets pool', () => {
    const bundle = presetFullSclBundle('12-tet', harmonicSpectrum(), 440, undefined, [TWELVE_TET]);
    expect(typeof bundle.scl).toBe('string');
  });
});


// ---------------------------------------------------------------------------
// Q379 — presetModeConsistencyEntropyProfiles
// ---------------------------------------------------------------------------

describe('presetModeConsistencyEntropyProfiles (Q379)', () => {
  it('returns one entry per mode for 12-tet with delta >= 0', () => {
    const profiles = presetModeConsistencyEntropyProfiles('12-tet');
    expect(profiles.length).toBe(12);
    for (const { mode, entropy, consistency, delta } of profiles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(entropy).toBeGreaterThanOrEqual(0);
      expect(consistency).toBeGreaterThanOrEqual(0);
      expect(delta).toBeGreaterThanOrEqual(0);
      expect(delta).toBeLessThanOrEqual(1);
    }
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetModeConsistencyEntropyProfiles('not-a-preset')).toThrow(RangeError);
  });

  it('accepts optional spectrum and rootHz', () => {
    const profiles = presetModeConsistencyEntropyProfiles('12-tet', harmonicSpectrum(), 261.63);
    expect(profiles.length).toBe(12);
  });

  it('accepts optional presets pool', () => {
    const profiles = presetModeConsistencyEntropyProfiles('12-tet', undefined, 440, [TWELVE_TET]);
    expect(profiles.length).toBe(12);
  });
});


// ---------------------------------------------------------------------------
// Q383 — presetModeDissonanceHistograms
// ---------------------------------------------------------------------------

describe('presetModeDissonanceHistograms (Q383)', () => {
  it('returns one entry per mode for 12-tet', () => {
    const hists = presetModeDissonanceHistograms('12-tet');
    expect(hists.length).toBe(12);
    for (const { mode, histogram } of hists) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(histogram.length).toBe(10);
    }
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetModeDissonanceHistograms('not-a-preset')).toThrow(RangeError);
  });

  it('respects custom bins', () => {
    const hists = presetModeDissonanceHistograms('12-tet', 5);
    for (const { histogram } of hists) {
      expect(histogram.length).toBe(5);
    }
  });

  it('accepts optional presets pool', () => {
    const hists = presetModeDissonanceHistograms('12-tet', 10, [TWELVE_TET]);
    expect(hists.length).toBe(12);
  });
});


// ---------------------------------------------------------------------------
// Q388 — presetModeDualHistograms
// ---------------------------------------------------------------------------

describe('presetModeDualHistograms (Q388)', () => {
  it('returns one entry per mode for 12-tet', () => {
    const hists = presetModeDualHistograms('12-tet');
    expect(hists.length).toBe(12);
  });

  it('each entry has dissonance and harmonicity arrays of length 10', () => {
    const hists = presetModeDualHistograms('12-tet');
    for (const { dissonance, harmonicity } of hists) {
      expect(dissonance.length).toBe(10);
      expect(harmonicity.length).toBe(10);
    }
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetModeDualHistograms('not-a-preset')).toThrow(RangeError);
  });

  it('respects custom bins', () => {
    const hists = presetModeDualHistograms('12-tet', 5);
    for (const { dissonance, harmonicity } of hists) {
      expect(dissonance.length).toBe(5);
      expect(harmonicity.length).toBe(5);
    }
  });

  it('accepts optional presets pool', () => {
    const hists = presetModeDualHistograms('12-tet', 10, [TWELVE_TET]);
    expect(hists.length).toBe(12);
  });

  it('each entry has mode with degreeIndices', () => {
    const hists = presetModeDualHistograms('12-tet');
    for (const { mode } of hists) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
});


// ---------------------------------------------------------------------------
// Q392 — presetModeHistogramSummaries
// ---------------------------------------------------------------------------

describe('presetModeHistogramSummaries (Q392)', () => {
  it('returns one entry per mode for 12-tet', () => {
    const summaries = presetModeHistogramSummaries('12-tet');
    expect(summaries.length).toBe(12);
  });

  it('each entry has mode and histogramSummary', () => {
    const summaries = presetModeHistogramSummaries('12-tet');
    for (const { mode, histogramSummary } of summaries) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(histogramSummary.dissonance.length).toBe(10);
      expect(histogramSummary.harmonicity.length).toBe(10);
      expect(histogramSummary.peakDissonanceBin).toBeGreaterThanOrEqual(0);
      expect(histogramSummary.peakDissonanceBin).toBeLessThan(10);
      expect(histogramSummary.dissonanceSpread).toBeGreaterThanOrEqual(0);
      expect(histogramSummary.dissonanceSpread).toBeLessThanOrEqual(1);
    }
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetModeHistogramSummaries('not-a-preset')).toThrow(RangeError);
  });

  it('respects custom bins', () => {
    const summaries = presetModeHistogramSummaries('12-tet', 5);
    for (const { histogramSummary } of summaries) {
      expect(histogramSummary.dissonance.length).toBe(5);
      expect(histogramSummary.harmonicity.length).toBe(5);
    }
  });

  it('accepts optional presets pool', () => {
    const summaries = presetModeHistogramSummaries('12-tet', 10, [TWELVE_TET]);
    expect(summaries.length).toBe(12);
  });
});


// ---------------------------------------------------------------------------
// Q397 — presetModeAnalysisFull
// ---------------------------------------------------------------------------

describe('presetModeAnalysisFull (Q397)', () => {
  it('returns one entry per mode for 12-tet', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAnalysisFull('12-tet', spec);
    expect(result.length).toBe(12);
  });

  it('each entry has mode and analysisFull with all keys', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAnalysisFull('12-tet', spec);
    for (const { mode, analysisFull } of result) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(analysisFull).toHaveProperty('dualHistogram');
      expect(analysisFull).toHaveProperty('histogramSummary');
      expect(analysisFull).toHaveProperty('rankedBundle');
      expect(analysisFull).toHaveProperty('volatilityBundle');
    }
  });

  it('throws RangeError for unknown preset id', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeAnalysisFull('not-a-preset', spec)).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAnalysisFull('12-tet', spec, 261.63);
    expect(result.length).toBe(12);
    expect(result[0]!.analysisFull).toHaveProperty('rankedBundle');
  });

  it('accepts optional presets pool', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAnalysisFull('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBe(12);
  });
});


// ---------------------------------------------------------------------------
// Q400 — presetHarmonicSpectralScore
// ---------------------------------------------------------------------------

describe('presetHarmonicSpectralScore (Q400)', () => {
  it('returns harmonicDensity, spectralFit, combinedScore for 12-tet', () => {
    const spec = harmonicSpectrum(6);
    const score = presetHarmonicSpectralScore('12-tet', spec);
    expect(typeof score.harmonicDensity).toBe('number');
    expect(typeof score.spectralFit).toBe('number');
    expect(typeof score.combinedScore).toBe('number');
    expect(score.combinedScore).toBeCloseTo((score.harmonicDensity + score.spectralFit) / 2, 10);
  });

  it('throws RangeError for unknown preset id', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetHarmonicSpectralScore('not-a-preset', spec)).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const score = presetHarmonicSpectralScore('12-tet', spec, 261.63);
    expect(typeof score.combinedScore).toBe('number');
  });

  it('accepts optional tol', () => {
    const spec = harmonicSpectrum(6);
    const score = presetHarmonicSpectralScore('12-tet', spec, 440, 0.02);
    expect(typeof score.combinedScore).toBe('number');
  });

  it('accepts optional presets pool', () => {
    const spec = harmonicSpectrum(6);
    const score = presetHarmonicSpectralScore('12-tet', spec, undefined, undefined, [TWELVE_TET]);
    expect(typeof score.combinedScore).toBe('number');
  });
});


// ---------------------------------------------------------------------------
// Q403 — presetComprehensiveReport
// ---------------------------------------------------------------------------

describe('presetComprehensiveReport (Q403)', () => {
  it('returns all four keys for 12-tet', () => {
    const spec = harmonicSpectrum(6);
    const report = presetComprehensiveReport('12-tet', spec);
    expect(report).toHaveProperty('fullAnalysis');
    expect(report).toHaveProperty('harmonicSpectralScore');
    expect(report).toHaveProperty('stabilityScore');
    expect(report).toHaveProperty('progressionVariety');
  });

  it('fullAnalysis has reportCard', () => {
    const spec = harmonicSpectrum(6);
    const report = presetComprehensiveReport('12-tet', spec);
    expect(typeof report.fullAnalysis.reportCard).toBe('string');
  });

  it('stabilityScore is in [0, 1]', () => {
    const spec = harmonicSpectrum(6);
    const report = presetComprehensiveReport('12-tet', spec);
    expect(report.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(report.stabilityScore).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for unknown preset id', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetComprehensiveReport('not-a-preset', spec)).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const report = presetComprehensiveReport('12-tet', spec, 261.63);
    expect(typeof report.stabilityScore).toBe('number');
  });

  it('accepts optional presets pool', () => {
    const spec = harmonicSpectrum(6);
    const report = presetComprehensiveReport('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof report.progressionVariety).toBe('number');
  });
});


// ---------------------------------------------------------------------------
// Q406 — presetSimilarityRanking
// ---------------------------------------------------------------------------

describe('presetSimilarityRanking (Q406)', () => {
  it('returns one entry per other preset', () => {
    const ranking = presetSimilarityRanking('12-tet', undefined, [
      TWELVE_TET,
      JUST_INTONATION_5L,
      SLENDRO_EXAMPLE,
    ]);
    expect(ranking.length).toBe(2); // 3 presets minus target
  });

  it('each entry has presetId and similarity', () => {
    const ranking = presetSimilarityRanking('12-tet', undefined, [TWELVE_TET, JUST_INTONATION_5L]);
    expect(typeof ranking[0]!.presetId).toBe('string');
    expect(typeof ranking[0]!.similarity).toBe('number');
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetSimilarityRanking('not-a-preset', undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('result is sorted descending by similarity when similarities are finite', () => {
    const ranking = presetSimilarityRanking('12-tet', undefined, [
      TWELVE_TET,
      JUST_INTONATION_5L,
      SLENDRO_EXAMPLE,
    ]);
    if (ranking.length >= 2) {
      const s0 = ranking[0]!.similarity;
      const s1 = ranking[1]!.similarity;
      if (isFinite(s0) && isFinite(s1)) {
        expect(s0).toBeGreaterThanOrEqual(s1);
      }
    }
  });

  it('accepts optional tol', () => {
    const ranking = presetSimilarityRanking('12-tet', 0.02, [TWELVE_TET, JUST_INTONATION_5L]);
    expect(typeof ranking[0]!.similarity).toBe('number');
  });
});


// ---------------------------------------------------------------------------
// Q409 — presetModeIntervalProfile
// ---------------------------------------------------------------------------

describe('presetModeIntervalProfile (Q409)', () => {
  it('returns one entry per mode', () => {
    const profiles = presetModeIntervalProfile('12-tet', [TWELVE_TET]);
    expect(profiles.length).toBeGreaterThan(0);
  });

  it('each entry has mode, intervals, intervalCount, uniqueIntervals, diversity', () => {
    const profiles = presetModeIntervalProfile('12-tet', [TWELVE_TET]);
    const first = profiles[0]!;
    expect(first).toHaveProperty('mode');
    expect(first).toHaveProperty('intervals');
    expect(first).toHaveProperty('intervalCount');
    expect(first).toHaveProperty('uniqueIntervals');
    expect(first).toHaveProperty('diversity');
  });

  it('diversity is in [0,1]', () => {
    const profiles = presetModeIntervalProfile('12-tet', [TWELVE_TET]);
    for (const { diversity } of profiles) {
      expect(diversity).toBeGreaterThanOrEqual(0);
      expect(diversity).toBeLessThanOrEqual(1);
    }
  });

  it('intervalCount equals intervals.length', () => {
    const profiles = presetModeIntervalProfile('12-tet', [TWELVE_TET]);
    for (const { intervalCount, intervals } of profiles) {
      expect(intervalCount).toBe(intervals.length);
    }
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetModeIntervalProfile('not-a-preset', [TWELVE_TET])).toThrow(RangeError);
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const profiles = presetModeIntervalProfile('12-tet');
    expect(profiles.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q412 — presetMostDiverseMode
// ---------------------------------------------------------------------------

describe('presetMostDiverseMode (Q412)', () => {
  it('returns mode and diversity', () => {
    const result = presetMostDiverseMode('12-tet', [TWELVE_TET]);
    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('diversity');
  });

  it('diversity is in [0,1]', () => {
    const { diversity } = presetMostDiverseMode('12-tet', [TWELVE_TET]);
    expect(diversity).toBeGreaterThanOrEqual(0);
    expect(diversity).toBeLessThanOrEqual(1);
  });

  it('mode has degreeIndices', () => {
    const { mode } = presetMostDiverseMode('12-tet', [TWELVE_TET]);
    expect(mode).toHaveProperty('degreeIndices');
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() => presetMostDiverseMode('not-a-preset', [TWELVE_TET])).toThrow(RangeError);
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const result = presetMostDiverseMode('12-tet');
    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('diversity');
  });

  it('diversity matches maximum from presetModeIntervalProfile', () => {
    const { diversity } = presetMostDiverseMode('12-tet', [TWELVE_TET]);
    const profiles = presetModeIntervalProfile('12-tet', [TWELVE_TET]);
    const maxDiversity = Math.max(...profiles.map((p) => p.diversity));
    expect(diversity).toBeCloseTo(maxDiversity, 10);
  });
});


// ---------------------------------------------------------------------------
// Q415 — presetModeComprehensiveBundle
// ---------------------------------------------------------------------------

describe('presetModeComprehensiveBundle (Q415)', () => {
  it('returns one entry per mode', () => {
    const spec = harmonicSpectrum(6);
    const bundle = presetModeComprehensiveBundle('12-tet', spec, undefined, [TWELVE_TET]);
    expect(bundle.length).toBeGreaterThan(0);
  });

  it('each entry has all five metrics', () => {
    const spec = harmonicSpectrum(6);
    const bundle = presetModeComprehensiveBundle('12-tet', spec, undefined, [TWELVE_TET]);
    const first = bundle[0]!;
    expect(first).toHaveProperty('mode');
    expect(typeof first.entropy).toBe('number');
    expect(typeof first.consistency).toBe('number');
    expect(typeof first.volatility).toBe('number');
    expect(typeof first.diversity).toBe('number');
    expect(typeof first.smoothnessRatio).toBe('number');
  });

  it('diversity is in [0,1]', () => {
    const spec = harmonicSpectrum(6);
    const bundle = presetModeComprehensiveBundle('12-tet', spec, undefined, [TWELVE_TET]);
    for (const b of bundle) {
      expect(b.diversity).toBeGreaterThanOrEqual(0);
      expect(b.diversity).toBeLessThanOrEqual(1);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const bundle = presetModeComprehensiveBundle('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(bundle.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() =>
      presetModeComprehensiveBundle('not-a-preset', harmonicSpectrum(6), undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const bundle = presetModeComprehensiveBundle('12-tet', harmonicSpectrum(6));
    expect(bundle.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q418 — presetBestModeComprehensive
// ---------------------------------------------------------------------------

describe('presetBestModeComprehensive (Q418)', () => {
  it('returns a mode with a score', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestModeComprehensive('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.score).toBe('number');
  });

  it('returned entry has all five metrics plus score', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestModeComprehensive('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.entropy).toBe('number');
    expect(typeof result.consistency).toBe('number');
    expect(typeof result.volatility).toBe('number');
    expect(typeof result.diversity).toBe('number');
    expect(typeof result.smoothnessRatio).toBe('number');
    expect(typeof result.score).toBe('number');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestModeComprehensive('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.mode).toHaveProperty('degreeIndices');
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() =>
      presetBestModeComprehensive('not-a-preset', harmonicSpectrum(6), undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const result = presetBestModeComprehensive('12-tet', harmonicSpectrum(6));
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.score).toBe('number');
  });

  it('score matches formula applied to the returned mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestModeComprehensive('12-tet', spec, undefined, [TWELVE_TET]);
    const expected =
      result.entropy +
      result.consistency +
      (1 - result.volatility) +
      result.diversity +
      result.smoothnessRatio;
    expect(result.score).toBeCloseTo(expected, 10);
  });
});


// ---------------------------------------------------------------------------
// Q421 — presetModeScoreRanking
// ---------------------------------------------------------------------------

describe('presetModeScoreRanking (Q421)', () => {
  it('returns modes sorted by score descending', () => {
    const spec = harmonicSpectrum(6);
    const ranking = presetModeScoreRanking('12-tet', spec, undefined, [TWELVE_TET]);
    expect(ranking.length).toBeGreaterThan(0);
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1]!.score).toBeGreaterThanOrEqual(ranking[i]!.score);
    }
  });

  it('each entry has mode and numeric score', () => {
    const spec = harmonicSpectrum(6);
    const ranking = presetModeScoreRanking('12-tet', spec, undefined, [TWELVE_TET]);
    for (const r of ranking) {
      expect(r.mode).toHaveProperty('degreeIndices');
      expect(typeof r.score).toBe('number');
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const ranking = presetModeScoreRanking('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(ranking.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset id', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeScoreRanking('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const spec = harmonicSpectrum(6);
    const ranking = presetModeScoreRanking('12-tet', spec);
    expect(ranking.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q425 — presetIntervalDiversityVsEntropy
// ---------------------------------------------------------------------------

describe('presetIntervalDiversityVsEntropy (Q425)', () => {
  it('returns one entry per mode with correlation label', () => {
    const result = presetIntervalDiversityVsEntropy('12-tet', undefined, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(['aligned', 'opposed', 'neutral']).toContain(r.correlation);
      expect(r.diversity).toBeGreaterThanOrEqual(0);
      expect(r.entropy).toBeGreaterThanOrEqual(0);
    }
  });

  it('each entry has mode with degreeIndices', () => {
    const result = presetIntervalDiversityVsEntropy('12-tet', undefined, undefined, [TWELVE_TET]);
    for (const r of result) {
      expect(r.mode).toHaveProperty('degreeIndices');
    }
  });

  it('accepts optional spectrum', () => {
    const spec = harmonicSpectrum(6);
    const result = presetIntervalDiversityVsEntropy('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });

  it('accepts optional spectrum and rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetIntervalDiversityVsEntropy('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(['aligned', 'opposed', 'neutral']).toContain(r.correlation);
    }
  });

  it('throws RangeError for unknown preset id', () => {
    expect(() =>
      presetIntervalDiversityVsEntropy('not-a-preset', undefined, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const result = presetIntervalDiversityVsEntropy('12-tet');
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q427 — presetModeParetoFront
// ---------------------------------------------------------------------------

describe('presetModeParetoFront (Q427)', () => {
  it('returns subset of modes with all 5 metrics', () => {
    const spec = harmonicSpectrum(6);
    const front = presetModeParetoFront('12-tet', spec, undefined, [TWELVE_TET]);
    expect(front.length).toBeGreaterThan(0);
    for (const m of front) {
      expect(typeof m.entropy).toBe('number');
      expect(typeof m.consistency).toBe('number');
      expect(typeof m.volatility).toBe('number');
      expect(typeof m.diversity).toBe('number');
      expect(typeof m.smoothnessRatio).toBe('number');
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const front = presetModeParetoFront('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(front.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset id', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeParetoFront('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const spec = harmonicSpectrum(6);
    const front = presetModeParetoFront('12-tet', spec);
    expect(front.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q430 — presetModeCorrelationMatrix
// ---------------------------------------------------------------------------

describe('presetModeCorrelationMatrix (Q430)', () => {
  it('returns 5x5 symmetric matrix', () => {
    const spec = harmonicSpectrum(6);
    const { metrics, matrix } = presetModeCorrelationMatrix('12-tet', spec, undefined, [
      TWELVE_TET,
    ]);
    expect(metrics.length).toBe(5);
    expect(matrix.length).toBe(5);
    expect(matrix[0]!.length).toBe(5);
    // Diagonal should be 1, or 0 when the metric is constant across all modes
    for (let i = 0; i < 5; i++) {
      const diag = matrix[i]![i]!;
      expect(diag === 1 || diag === 0).toBe(true);
    }
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        expect(matrix[i]![j]!).toBeCloseTo(matrix[j]![i]!, 10);
      }
    }
  });

  it('metrics are in the expected order', () => {
    const spec = harmonicSpectrum(6);
    const { metrics } = presetModeCorrelationMatrix('12-tet', spec, undefined, [TWELVE_TET]);
    expect(metrics).toEqual([
      'entropy',
      'consistency',
      'volatility',
      'diversity',
      'smoothnessRatio',
    ]);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const { matrix } = presetModeCorrelationMatrix('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(matrix.length).toBe(5);
  });

  it('throws RangeError for unknown preset id', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeCorrelationMatrix('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const spec = harmonicSpectrum(6);
    const { metrics } = presetModeCorrelationMatrix('12-tet', spec);
    expect(metrics.length).toBe(5);
  });
});


// ---------------------------------------------------------------------------
// Q433 — presetParetoFrontBestMode
// ---------------------------------------------------------------------------

describe('presetParetoFrontBestMode (Q433)', () => {
  it('returns best Pareto mode with score', () => {
    const spec = harmonicSpectrum(6);
    const result = presetParetoFrontBestMode('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.mode.id).toBe('string');
    expect(typeof result.score).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetParetoFrontBestMode('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('uses ALL_PRESETS when no pool provided', () => {
    const spec = harmonicSpectrum(6);
    const result = presetParetoFrontBestMode('12-tet', spec);
    expect(result.mode).toBeDefined();
  });
});


// ---------------------------------------------------------------------------
// Q436 — presetModeTopCorrelation
// ---------------------------------------------------------------------------

describe('presetModeTopCorrelation (Q436)', () => {
  it('returns top correlation pair', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeTopCorrelation('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.metricA).toBe('string');
    expect(typeof result.metricB).toBe('string');
    expect(typeof result.correlation).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeTopCorrelation('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeTopCorrelation('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.correlation).toBeGreaterThanOrEqual(-1 - 1e-10);
    expect(result.correlation).toBeLessThanOrEqual(1 + 1e-10);
  });
});


// ---------------------------------------------------------------------------
// Q437 — presetModeAntiCorrelation
// ---------------------------------------------------------------------------

describe('presetModeAntiCorrelation (Q437)', () => {
  it('returns anti-correlation pair', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAntiCorrelation('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.metricA).toBe('string');
    expect(typeof result.metricB).toBe('string');
    expect(typeof result.correlation).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeAntiCorrelation('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAntiCorrelation('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.correlation).toBeGreaterThanOrEqual(-1 - 1e-10);
    expect(result.correlation).toBeLessThanOrEqual(1 + 1e-10);
  });
});


// ---------------------------------------------------------------------------
// Q439 — presetFamilyTopCorrelations
// ---------------------------------------------------------------------------

describe('presetFamilyTopCorrelations', () => {
  it('returns entry for each preset id', () => {
    const spec = harmonicSpectrum(6);
    const results = presetFamilyTopCorrelations(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe('12-tet');
    expect(typeof results[0]!.topCorrelation.metricA).toBe('string');
    expect(typeof results[0]!.topCorrelation.metricB).toBe('string');
    expect(typeof results[0]!.topCorrelation.correlation).toBe('number');
  });

  it('throws RangeError for unknown preset in array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetFamilyTopCorrelations(['not-real'], spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q443 — presetParetoFrontSummary
// ---------------------------------------------------------------------------

describe('presetParetoFrontSummary', () => {
  it('returns paretoSize and metric summaries', () => {
    const spec = harmonicSpectrum(6);
    const summary = presetParetoFrontSummary('12-tet', spec, undefined, [TWELVE_TET]);
    expect(summary.paretoSize).toBeGreaterThan(0);
    expect(typeof summary.entropy.mean).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetParetoFrontSummary('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const summary = presetParetoFrontSummary('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(summary.paretoSize).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q448 — presetParetoFrontVsRanking
// ---------------------------------------------------------------------------

describe('presetParetoFrontVsRanking', () => {
  it('returns all modes annotated with inParetoFront', () => {
    const spec = harmonicSpectrum(6);
    const results = presetParetoFrontVsRanking('12-tet', spec, undefined, [TWELVE_TET]);
    expect(results.length).toBeGreaterThan(0);
    for (const entry of results) {
      expect(typeof entry.inParetoFront).toBe('boolean');
    }
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetParetoFrontVsRanking('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('at least one mode is in Pareto front', () => {
    const spec = harmonicSpectrum(6);
    const results = presetParetoFrontVsRanking('12-tet', spec, undefined, [TWELVE_TET]);
    const inFront = results.filter((r) => r.inParetoFront);
    expect(inFront.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q449 — presetBestParetoRankedMode
// ---------------------------------------------------------------------------

describe('presetBestParetoRankedMode', () => {
  it('returns single best Pareto mode with rank', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestParetoRankedMode('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.mode.id).toBe('string');
    expect(result.rank).toBeGreaterThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetBestParetoRankedMode('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestParetoRankedMode('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.rank).toBeGreaterThanOrEqual(1);
  });
});


// ---------------------------------------------------------------------------
// Q453 — presetParetoFrontGap
// ---------------------------------------------------------------------------

describe('presetParetoFrontGap (Q453)', () => {
  it('returns maxGap >= 0 and paretoRanks array', () => {
    const spec = harmonicSpectrum(6);
    const { maxGap, paretoRanks } = presetParetoFrontGap('12-tet', spec, undefined, [TWELVE_TET]);
    expect(maxGap).toBeGreaterThanOrEqual(0);
    expect(paretoRanks.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetParetoFrontGap('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q454 — presetParetoFrontCoverage
// ---------------------------------------------------------------------------

describe('presetParetoFrontCoverage (Q454)', () => {
  it('returns coverage fields', () => {
    const spec = harmonicSpectrum(6);
    const { paretoSize, coverageInTopK } = presetParetoFrontCoverage('12-tet', spec, undefined, [
      TWELVE_TET,
    ]);
    expect(paretoSize).toBeGreaterThan(0);
    expect(coverageInTopK).toBeGreaterThanOrEqual(0);
    expect(coverageInTopK).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetParetoFrontCoverage('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const { coverageInTopK } = presetParetoFrontCoverage('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(coverageInTopK).toBeGreaterThanOrEqual(0);
  });
});


// ---------------------------------------------------------------------------
// Q457 — presetCorrelationMatrixNarrative
// ---------------------------------------------------------------------------

describe('presetCorrelationMatrixNarrative', () => {
  it('returns narrative with metric correlations', () => {
    const spec = harmonicSpectrum(6);
    const result = presetCorrelationMatrixNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.narrative.includes('correlation')).toBe(true);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetCorrelationMatrixNarrative('not-real', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetCorrelationMatrixNarrative('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
  });
});


// ---------------------------------------------------------------------------
// Q460 — presetParetoFrontNarrative
// ---------------------------------------------------------------------------

describe('presetParetoFrontNarrative', () => {
  it('returns narrative with Pareto info', () => {
    const spec = harmonicSpectrum(6);
    const result = presetParetoFrontNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.narrative.includes('Pareto') || result.narrative.includes('optimal')).toBe(true);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetParetoFrontNarrative('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('bestMode has mode id and score', () => {
    const spec = harmonicSpectrum(6);
    const result = presetParetoFrontNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.bestMode.mode.id).toBe('string');
    expect(typeof result.bestMode.score).toBe('number');
  });
});


// ---------------------------------------------------------------------------
// Q463 — presetFullParetoCorrelationReport
// ---------------------------------------------------------------------------

describe('presetFullParetoCorrelationReport (Q463)', () => {
  it('returns combined report with all three narrative fields', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFullParetoCorrelationReport('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.combinedNarrative).toBe('string');
    expect(result.paretoNarrative.paretoSize).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFullParetoCorrelationReport('not-real', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFullParetoCorrelationReport('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(typeof result.combinedNarrative).toBe('string');
  });
});


// ---------------------------------------------------------------------------
// Q466 — presetModeMetricOutliers
// ---------------------------------------------------------------------------

describe('presetModeMetricOutliers (Q466)', () => {
  it('returns array of outliers (may be empty)', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricOutliers('12-tet', spec, undefined, [TWELVE_TET]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeMetricOutliers('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('if outliers exist, they have all fields', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricOutliers('12-tet', spec, undefined, [TWELVE_TET]);
    if (result.length > 0) {
      expect(typeof result[0]!.metric).toBe('string');
    }
  });
});


// Q469 — presetModeMetricOutlierSummary
describe('presetModeMetricOutlierSummary (Q469)', () => {
  it('returns totalOutliers and outlier maps', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricOutlierSummary('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.totalOutliers).toBe('number');
    expect(result.totalOutliers).toBeGreaterThanOrEqual(0);
    expect(typeof result.byMetric).toBe('object');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeMetricOutlierSummary('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// Q472 — presetModeMetricProfile
describe('presetModeMetricProfile (Q472)', () => {
  it('returns mode profiles with metric stats', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricProfile('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.metrics.entropy.value).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeMetricProfile('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricProfile('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q475 — presetModeMetricRadarData
// ---------------------------------------------------------------------------

describe('presetModeMetricRadarData (Q475)', () => {
  it('returns radar data with values in [0,1]', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricRadarData('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const first = result[0]!;
    expect(first.radar.entropy).toBeGreaterThanOrEqual(0);
    expect(first.radar.entropy).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeMetricRadarData('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q478 — presetModeMetricCluster
// ---------------------------------------------------------------------------

describe('presetModeMetricCluster (Q478)', () => {
  it('returns clusters with valid labels', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricCluster('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(['high', 'mid', 'low']).toContain(result[0]!.cluster);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeMetricCluster('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeMetricCluster('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------

describe('presetClusterSummary (Q481)', () => {
  it('returns cluster summary with counts and mode arrays', () => {
    const spec = harmonicSpectrum(6);
    const result = presetClusterSummary('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.highCount + result.midCount + result.lowCount).toBeGreaterThan(0);
    expect(Array.isArray(result.high)).toBe(true);
    expect(Array.isArray(result.mid)).toBe(true);
    expect(Array.isArray(result.low)).toBe(true);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetClusterSummary('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('mode counts equal array lengths', () => {
    const spec = harmonicSpectrum(6);
    const result = presetClusterSummary('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.highCount).toBe(result.high.length);
    expect(result.midCount).toBe(result.mid.length);
    expect(result.lowCount).toBe(result.low.length);
  });
});


// ---------------------------------------------------------------------------

describe('presetModeRadarRanking (Q484)', () => {
  it('returns ranked modes with meanScore', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeRadarRanking('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.rank).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeRadarRanking('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeRadarRanking('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------

describe('presetRadarRankingVsScoreRanking (Q487)', () => {
  it('returns comparison array with rankDelta fields', () => {
    const spec = harmonicSpectrum(6);
    const result = presetRadarRankingVsScoreRanking('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.rankDelta).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetRadarRankingVsScoreRanking('not-real', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------

describe('presetBestRadarScoreAgreement (Q490)', () => {
  it('returns single best agreement mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestRadarScoreAgreement('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.mode.id).toBe('string');
    expect(result.radarRank).toBeGreaterThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetBestRadarScoreAgreement('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestRadarScoreAgreement('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.scoreRank).toBeGreaterThanOrEqual(1);
  });
});


// ---------------------------------------------------------------------------

describe('presetModeConsensusRanking (Q493)', () => {
  it('returns Borda consensus ranking for preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeConsensusRanking('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.consensusRank).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeConsensusRanking('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('sorted by bordaScore descending', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeConsensusRanking('12-tet', spec, undefined, [TWELVE_TET]);
    if (result.length >= 2) {
      expect(result[0]!.bordaScore).toBeGreaterThanOrEqual(result[1]!.bordaScore);
    }
  });
});


// ---------------------------------------------------------------------------

describe('presetBestConsensusMode (Q496)', () => {
  it('returns top consensus mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestConsensusMode('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.mode.id).toBe('string');
    expect(result.consensusRank).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetBestConsensusMode('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestConsensusMode('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.bordaScore).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------

describe('presetUltimateBestMode (Q499)', () => {
  it('returns winner mode and vote count', () => {
    const spec = harmonicSpectrum(6);
    const result = presetUltimateBestMode('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.winner.mode.id).toBe('string');
    expect(result.winner.voteCount).toBeGreaterThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetUltimateBestMode('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('isUnanimous is boolean', () => {
    const spec = harmonicSpectrum(6);
    const result = presetUltimateBestMode('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.isUnanimous).toBe('boolean');
  });
});


// ---------------------------------------------------------------------------

describe('presetConsensusNarrative (Q502)', () => {
  it('returns narrative string mentioning consensus mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetConsensusNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetConsensusNarrative('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetConsensusNarrative('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
  });
});


// ---------------------------------------------------------------------------

describe('presetModeComprehensiveMetricBundle (Q508)', () => {
  it('returns mode bundles with metricProfile', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeComprehensiveMetricBundle('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.metricProfile.entropy.isOutlier).toBe('boolean');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeComprehensiveMetricBundle('not-real', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeComprehensiveMetricBundle('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------

describe('presetModeConsensusClusterBundle (Q511)', () => {
  it('returns bundle with consensus rank and cluster fields', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeConsensusClusterBundle('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.cluster).toBe('string');
    expect(result[0]!.consensusRank).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeConsensusClusterBundle('not-real', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------

describe('presetTopClusterConsensusMode (Q514)', () => {
  it('returns top cluster consensus mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetTopClusterConsensusMode('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.mode.id).toBe('string');
    expect(typeof result.meanScore).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetTopClusterConsensusMode('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetTopClusterConsensusMode('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(typeof result.cluster).toBe('string');
  });
});


// ---------------------------------------------------------------------------

describe('presetModeConsensusOutlierBundle (Q517)', () => {
  it('returns bundle with outlierMetrics field', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeConsensusOutlierBundle('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(Array.isArray(result[0]!.outlierMetrics)).toBe(true);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeConsensusOutlierBundle('not-real', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------

describe('presetModeInsightSummary (Q520)', () => {
  it('returns insight summaries with strings', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeInsightSummary('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.insight).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeInsightSummary('not-real', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeInsightSummary('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q526 — presetModeEntropyDiversityMap
// ---------------------------------------------------------------------------

describe('presetModeEntropyDiversityMap (Q526)', () => {
  it('returns mode map with quadrant labels', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeEntropyDiversityMap('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const validQuadrants = ['rich-complex', 'varied-uniform', 'stable-diverse', 'stable-uniform'];
    expect(validQuadrants).toContain(result[0]!.quadrant);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeEntropyDiversityMap('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeEntropyDiversityMap('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q529 — presetModeConsistencyVolatilityMap
// ---------------------------------------------------------------------------

describe('presetModeConsistencyVolatilityMap (Q529)', () => {
  it('returns quadrant labels for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeConsistencyVolatilityMap('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const validQuadrants = [
      'stable-consistent',
      'consistent-volatile',
      'smooth-inconsistent',
      'rough-inconsistent',
    ];
    for (const entry of result) {
      expect(validQuadrants).toContain(entry.quadrant);
    }
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeConsistencyVolatilityMap('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q532 — presetModeFiveDimMap
// ---------------------------------------------------------------------------

describe('presetModeFiveDimMap (Q532)', () => {
  it('returns merged per-mode data with cluster labels', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeFiveDimMap('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const validClusters = ['high', 'mid', 'low'];
    expect(validClusters).toContain(result[0]!.cluster);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeFiveDimMap('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeFiveDimMap('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q535 — presetModeFiveDimNarrative
// ---------------------------------------------------------------------------

describe('presetModeFiveDimNarrative (Q535)', () => {
  it('returns per-mode narratives with non-empty narrative strings', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeFiveDimNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.narrative).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeFiveDimNarrative('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q538 — presetModeSmoothnessEntropyMap
// ---------------------------------------------------------------------------

describe('presetModeSmoothnessEntropyMap (Q538)', () => {
  it('returns quadrant labels for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeSmoothnessEntropyMap('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const validQuadrants = ['fluid-complex', 'fluid-simple', 'rough-complex', 'rough-simple'];
    expect(validQuadrants).toContain(result[0]!.quadrant);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeSmoothnessEntropyMap('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeSmoothnessEntropyMap('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q541 — presetModeDiversityVolatilityMap
// ---------------------------------------------------------------------------

describe('presetModeDiversityVolatilityMap (Q541)', () => {
  it('returns quadrant labels for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeDiversityVolatilityMap('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const validQuadrants = [
      'diverse-volatile',
      'diverse-stable',
      'uniform-volatile',
      'uniform-stable',
    ];
    expect(validQuadrants).toContain(result[0]!.quadrant);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeDiversityVolatilityMap('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q544 — presetModeAllQuadrantsBundle
// ---------------------------------------------------------------------------

describe('presetModeAllQuadrantsBundle (Q544)', () => {
  it('returns all four quadrant fields for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAllQuadrantsBundle('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.entropyDiversityQuadrant).toBe('string');
    expect(typeof result[0]!.consistencyVolatilityQuadrant).toBe('string');
    expect(typeof result[0]!.smoothnessEntropyQuadrant).toBe('string');
    expect(typeof result[0]!.diversityVolatilityQuadrant).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeAllQuadrantsBundle('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAllQuadrantsBundle('12-tet', spec, 261.63, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Q547 — presetModeAllQuadrantsNarrative
// ---------------------------------------------------------------------------

describe('presetModeAllQuadrantsNarrative (Q547)', () => {
  it('returns narrative strings for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAllQuadrantsNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.narrative).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeAllQuadrantsNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q550 — presetModeQuadrantConsensus
// ---------------------------------------------------------------------------

describe('presetModeQuadrantConsensus (Q550)', () => {
  it('returns consensus for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeQuadrantConsensus('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const valid = ['versatile', 'specialized', 'balanced'];
    expect(valid).toContain(result[0]!.consensus);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeQuadrantConsensus('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q553 — presetBestQuadrantConsensusMode
// ---------------------------------------------------------------------------

describe('presetBestQuadrantConsensusMode (Q553)', () => {
  it('returns a single mode entry with consensus field', () => {
    const spec = harmonicSpectrum(6);
    const result = presetBestQuadrantConsensusMode('12-tet', spec, undefined, [TWELVE_TET]);
    const valid = ['versatile', 'specialized', 'balanced'];
    expect(valid).toContain(result.consensus);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetBestQuadrantConsensusMode('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q556 — presetModeConsensusNarrative
// ---------------------------------------------------------------------------

describe('presetModeConsensusNarrative (Q556)', () => {
  it('returns narrative strings for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeConsensusNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.narrative).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeConsensusNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q559 — presetModeQuadrantProfile
// ---------------------------------------------------------------------------

describe('presetModeQuadrantProfile (Q559)', () => {
  it('returns quadrant profile strings for each mode', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeQuadrantProfile('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.quadrantProfile).toBe('string');
    expect(result[0]!.quadrantProfile.split('|').length).toBe(4);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeQuadrantProfile('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q562 — presetQuadrantCoverage
// ---------------------------------------------------------------------------

describe('presetQuadrantCoverage (Q562)', () => {
  it('returns coverage for 12-tet preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetQuadrantCoverage('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.totalModes).toBeGreaterThan(0);
    expect(result.totalUniqueProfiles).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetQuadrantCoverage('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q565 — presetModeGroupByProfile
// ---------------------------------------------------------------------------

describe('presetModeGroupByProfile (Q565)', () => {
  it('groups modes by quadrant profile for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeGroupByProfile('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const total = result.reduce((s, g) => s + g.count, 0);
    expect(total).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeGroupByProfile('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q568 — presetQuadrantCoverageNarrative
// ---------------------------------------------------------------------------

describe('presetQuadrantCoverageNarrative (Q568)', () => {
  it('returns coverage with narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetQuadrantCoverageNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetQuadrantCoverageNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q571 — presetDominantQuadrantProfile
// ---------------------------------------------------------------------------

describe('presetDominantQuadrantProfile (Q571)', () => {
  it('returns the dominant quadrant profile for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetDominantQuadrantProfile('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.profile).toBe('string');
    expect(result.count).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetDominantQuadrantProfile('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q574 — presetQuadrantProfileDiversity
// ---------------------------------------------------------------------------

describe('presetQuadrantProfileDiversity (Q574)', () => {
  it('returns diversity metrics for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetQuadrantProfileDiversity('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.totalModes).toBeGreaterThan(0);
    expect(result.normalized).toBeGreaterThanOrEqual(0);
    expect(result.normalized).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetQuadrantProfileDiversity('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q577 — presetQuadrantProfileDiversityNarrative
// ---------------------------------------------------------------------------

describe('presetQuadrantProfileDiversityNarrative (Q577)', () => {
  it('returns diversity narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetQuadrantProfileDiversityNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetQuadrantProfileDiversityNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q589 — presetModeProfileTransitions
// ---------------------------------------------------------------------------

describe('presetModeProfileTransitions (Q589)', () => {
  it('returns n-1 transition entries for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeProfileTransitions('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.sameProfile).toBe('boolean');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeProfileTransitions('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q591 — presetProfileTransitionScore
// ---------------------------------------------------------------------------

describe('presetProfileTransitionScore (Q591)', () => {
  it('returns transition score for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileTransitionScore('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.stabilityScore).toBeLessThanOrEqual(1);
    expect(result.sameCount + result.differentCount).toBe(result.totalTransitions);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetProfileTransitionScore('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q595 — presetProfileTransitionScoreNarrative
// ---------------------------------------------------------------------------

describe('presetProfileTransitionScoreNarrative (Q595)', () => {
  it('returns transition score narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileTransitionScoreNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetProfileTransitionScoreNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q603 — presetProfileRunSummary
// ---------------------------------------------------------------------------

describe('presetProfileRunSummary (Q603)', () => {
  it('returns run summary for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileRunSummary('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.runCount).toBeGreaterThan(0);
    expect(result.totalModes).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetProfileRunSummary('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q607 — presetProfileRunSummaryNarrative
// ---------------------------------------------------------------------------

describe('presetProfileRunSummaryNarrative (Q607)', () => {
  it('returns run summary narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileRunSummaryNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetProfileRunSummaryNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q610 — presetProfileRunDensity
// ---------------------------------------------------------------------------

describe('presetProfileRunDensity (Q610)', () => {
  it('returns change density for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileRunDensity('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.changeDensity).toBeGreaterThanOrEqual(0);
    expect(result.changeDensity).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetProfileRunDensity('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q616 — presetProfileRunDensityNarrative
// ---------------------------------------------------------------------------

describe('presetProfileRunDensityNarrative (Q616)', () => {
  it('returns density narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileRunDensityNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetProfileRunDensityNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q619 — presetProfileTextureReport
// ---------------------------------------------------------------------------

describe('presetProfileTextureReport (Q619)', () => {
  it('returns all four sub-reports for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileTextureReport('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.coverage.totalUniqueProfiles).toBe('number');
    expect(typeof result.runSummary.runCount).toBe('number');
    expect(typeof result.transitionScore.stabilityScore).toBe('number');
    expect(typeof result.profileDiversity.normalized).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetProfileTextureReport('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q622 — presetProfileTextureReportNarrative
// ---------------------------------------------------------------------------

describe('presetProfileTextureReportNarrative (Q622)', () => {
  it('returns texture report with narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetProfileTextureReportNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetProfileTextureReportNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q625 — presetModeRarestProfileGroup
// ---------------------------------------------------------------------------

describe('presetModeRarestProfileGroup (Q625)', () => {
  it('returns the rarest profile group for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeRarestProfileGroup('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result).not.toBeNull();
    if (result !== null) {
      expect(typeof result.profile).toBe('string');
      expect(result.count).toBeGreaterThan(0);
    }
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeRarestProfileGroup('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q627 — presetModeSoloProfileModes
// ---------------------------------------------------------------------------

describe('presetModeSoloProfileModes (Q627)', () => {
  it('returns an array of solo-profile modes for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeSoloProfileModes('12-tet', spec, undefined, [TWELVE_TET]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeSoloProfileModes('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q634 — presetModeSoloProfileNarrative
// ---------------------------------------------------------------------------

describe('presetModeSoloProfileNarrative (Q634)', () => {
  it('returns solo profile narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeSoloProfileNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeSoloProfileNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q637 — presetModeQuadrantIdentityBundle
// ---------------------------------------------------------------------------

describe('presetModeQuadrantIdentityBundle (Q637)', () => {
  it('returns identity bundle for each mode of a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeQuadrantIdentityBundle('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    const valid = ['versatile', 'specialized', 'balanced'];
    expect(valid).toContain(result[0]!.consensus);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeQuadrantIdentityBundle('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q640 — presetModeQuadrantIdentityNarrative
// ---------------------------------------------------------------------------

describe('presetModeQuadrantIdentityNarrative (Q640)', () => {
  it('returns identity narrative for each mode of a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeQuadrantIdentityNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]!.narrative).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeQuadrantIdentityNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q643 — presetModeAmbassador
// ---------------------------------------------------------------------------

describe('presetModeAmbassador (Q643)', () => {
  it('returns the ambassador mode for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAmbassador('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.mode.id).toBe('string');
    const valid = ['versatile', 'specialized', 'balanced'];
    expect(valid).toContain(result.consensus);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() => presetModeAmbassador('not-a-preset', spec, undefined, [TWELVE_TET])).toThrow(
      RangeError,
    );
  });
});


// ---------------------------------------------------------------------------
// Q646 — presetModeAmbassadorNarrative
// ---------------------------------------------------------------------------

describe('presetModeAmbassadorNarrative (Q646)', () => {
  it('returns ambassador narrative for a preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetModeAmbassadorNarrative('12-tet', spec, undefined, [TWELVE_TET]);
    expect(typeof result.ambassadorNarrative).toBe('string');
    expect(result.ambassadorNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetModeAmbassadorNarrative('not-a-preset', spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q649 — presetFamilyAmbassadorRanking
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorRanking (Q649)', () => {
  it('returns ranking for a list of presets', () => {
    const spec = harmonicSpectrum(6);
    const results = presetFamilyAmbassadorRanking(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(results.length).toBe(1);
    expect(results[0]!.rank).toBe(1);
    expect(typeof results[0]!.id).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorRanking(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q653 — presetFamilyBestAmbassador
// ---------------------------------------------------------------------------

describe('presetFamilyBestAmbassador (Q653)', () => {
  it('returns the best ambassador for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyBestAmbassador(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(result).not.toBeNull();
    expect(result!.rank).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyBestAmbassador(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('returns null for empty preset list', () => {
    const spec = harmonicSpectrum(6);
    expect(presetFamilyBestAmbassador([], spec)).toBeNull();
  });
});


// ---------------------------------------------------------------------------
// Q655 — presetFamilyAmbassadorScoreStats
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorScoreStats (Q655)', () => {
  it('returns score stats for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const stats = presetFamilyAmbassadorScoreStats(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(typeof stats.mean).toBe('number');
    expect(typeof stats.stdDev).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorScoreStats(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q658 — presetFamilyWeakestAmbassador
// ---------------------------------------------------------------------------

describe('presetFamilyWeakestAmbassador (Q658)', () => {
  it('returns the weakest ambassador for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyWeakestAmbassador(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyWeakestAmbassador(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('returns null for empty preset list', () => {
    const spec = harmonicSpectrum(6);
    expect(presetFamilyWeakestAmbassador([], spec)).toBeNull();
  });
});


// ---------------------------------------------------------------------------
// Q661 — presetFamilyAmbassadorConsensusDistribution
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConsensusDistribution (Q661)', () => {
  it('returns consensus distribution for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const dist = presetFamilyAmbassadorConsensusDistribution(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(dist.total).toBe(1);
    expect(dist.versatile + dist.balanced + dist.specialized).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConsensusDistribution(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q664 — presetFamilyAmbassadorProfileFrequency
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorProfileFrequency (Q664)', () => {
  it('returns profile frequency for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const freq = presetFamilyAmbassadorProfileFrequency(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(Array.isArray(freq)).toBe(true);
    expect(freq.length).toBeGreaterThanOrEqual(1);
    expect(typeof freq[0]!.profile).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorProfileFrequency(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q667 — presetFamilyLeastCommonAmbassadorProfile
// ---------------------------------------------------------------------------

describe('presetFamilyLeastCommonAmbassadorProfile (Q667)', () => {
  it('returns the least common profile for a single preset', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyLeastCommonAmbassadorProfile(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(result).not.toBeNull();
    expect(typeof result!.profile).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyLeastCommonAmbassadorProfile(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('returns null for empty preset list', () => {
    const spec = harmonicSpectrum(6);
    expect(presetFamilyLeastCommonAmbassadorProfile([], spec)).toBeNull();
  });
});


// ---------------------------------------------------------------------------
// Q670 — presetFamilyAmbassadorConsensusScore
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConsensusScore (Q670)', () => {
  it('returns consensus score for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorConsensusScore(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(typeof result.normalizedScore).toBe('number');
    expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
    expect(result.normalizedScore).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConsensusScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q677 — presetFamilyAmbassadorOverlapScore
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorOverlapScore (Q677)', () => {
  it('returns overlap score for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorOverlapScore(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(result.total).toBe(1);
    expect(typeof result.overlapScore).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorOverlapScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q679 — presetFamilyAmbassadorOverlapScoreNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorOverlapScoreNarrative (Q679)', () => {
  it('returns overlap narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorOverlapScoreNarrative(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.overlapNarrative).toBe('string');
    expect(result.overlapNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorOverlapScoreNarrative(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q683 — presetFamilyAmbassadorConvergenceScore
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConvergenceScore (Q683)', () => {
  it('returns convergence score for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorConvergenceScore(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.convergenceScore).toBe('number');
    expect(result.convergenceScore).toBeGreaterThanOrEqual(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConvergenceScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q687 — presetFamilyAmbassadorConvergenceScoreNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConvergenceScoreNarrative (Q687)', () => {
  it('returns convergence narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorConvergenceScoreNarrative(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.convergenceNarrative).toBe('string');
    expect(result.convergenceNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConvergenceScoreNarrative(['not-a-preset'], spec, undefined, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q689 — presetFamilyAmbassadorConsensusConvergenceScore
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConsensusConvergenceScore (Q689)', () => {
  it('returns consensus convergence score for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorConsensusConvergenceScore(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.convergenceScore).toBe('number');
    expect(result.convergenceScore).toBeGreaterThanOrEqual(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConsensusConvergenceScore(['not-a-preset'], spec, undefined, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q691 — presetFamilyAmbassadorConsensusConvergenceScoreNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConsensusConvergenceScoreNarrative (Q691)', () => {
  it('returns consensus convergence narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorConsensusConvergenceScoreNarrative(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(typeof result.consensusConvergenceNarrative).toBe('string');
    expect(result.consensusConvergenceNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConsensusConvergenceScoreNarrative(['not-a-preset'], spec, undefined, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q693 — presetFamilyAmbassadorConvergenceBundle
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConvergenceBundle (Q693)', () => {
  it('returns convergence bundle for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const bundle = presetFamilyAmbassadorConvergenceBundle(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof bundle.profileConvergence.convergenceScore).toBe('number');
    expect(typeof bundle.consensusConvergence.convergenceScore).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConvergenceBundle(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q695 — presetFamilyAmbassadorConvergenceBundleNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorConvergenceBundleNarrative (Q695)', () => {
  it('returns bundle narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorConvergenceBundleNarrative(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.bundleNarrative).toBe('string');
    expect(result.bundleNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorConvergenceBundleNarrative(['not-a-preset'], spec, undefined, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q699 — presetFamilyAmbassadorMeanProfileDistance
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorMeanProfileDistance (Q699)', () => {
  it('returns mean profile distance for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorMeanProfileDistance(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(result.maxPossible).toBe(4);
    expect(typeof result.meanDistance).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorMeanProfileDistance(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q701 — presetFamilyAmbassadorMeanProfileDistanceNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorMeanProfileDistanceNarrative (Q701)', () => {
  it('returns distance narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorMeanProfileDistanceNarrative(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.distanceNarrative).toBe('string');
    expect(result.distanceNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorMeanProfileDistanceNarrative(['not-a-preset'], spec, undefined, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q703 — presetFamilyAmbassadorProfileDistanceStats
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorProfileDistanceStats (Q703)', () => {
  it('returns distance stats for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const stats = presetFamilyAmbassadorProfileDistanceStats(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof stats.mean).toBe('number');
    expect(stats.max).toBeLessThanOrEqual(4);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorProfileDistanceStats(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q707 — presetFamilyAmbassadorCentrality
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorCentrality (Q707)', () => {
  it('returns centrality for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorCentrality(['12-tet'], spec, undefined, [TWELVE_TET]);
    // Single preset → only one tuning, so rank 1
    expect(result).not.toBeNull();
    expect(result!.rank).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorCentrality(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('returns null for empty preset list', () => {
    const spec = harmonicSpectrum(6);
    expect(presetFamilyAmbassadorCentrality([], spec)).toBeNull();
  });
});


// ---------------------------------------------------------------------------
// Q709 — presetFamilyAmbassadorOutlier
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorOutlier (Q709)', () => {
  it('returns the outlier for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorOutlier(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorOutlier(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('returns null for empty preset list', () => {
    const spec = harmonicSpectrum(6);
    expect(presetFamilyAmbassadorOutlier([], spec)).toBeNull();
  });
});


// ---------------------------------------------------------------------------
// Q711 — presetFamilyAmbassadorCentralityNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorCentralityNarrative (Q711)', () => {
  it('returns centrality narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorCentralityNarrative(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.centralityNarrative).toBe('string');
    expect(result.centralityNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorCentralityNarrative(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q713 — presetFamilyAmbassadorDistanceSpread
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorDistanceSpread (Q713)', () => {
  it('returns distance spread for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorDistanceSpread(['12-tet'], spec, undefined, [TWELVE_TET]);
    // Single preset means central === outlier
    expect(result).not.toBeNull();
    expect(typeof result!.spread).toBe('number');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorDistanceSpread(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });

  it('returns null for empty preset list', () => {
    const spec = harmonicSpectrum(6);
    expect(presetFamilyAmbassadorDistanceSpread([], spec)).toBeNull();
  });
});


// ---------------------------------------------------------------------------
// Q715 — presetFamilyAmbassadorDistanceSpreadNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorDistanceSpreadNarrative (Q715)', () => {
  it('returns spread narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorDistanceSpreadNarrative(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.spreadNarrative).toBe('string');
    expect(result.spreadNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorDistanceSpreadNarrative(['not-a-preset'], spec, undefined, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q721 — presetFamilyAmbassadorsSummaryTable
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorsSummaryTable (Q721)', () => {
  it('returns summary table for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const table = presetFamilyAmbassadorsSummaryTable(['12-tet'], spec, undefined, [TWELVE_TET]);
    expect(table.length).toBe(1);
    expect(typeof table[0]!.ambassadorModeName).toBe('string');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorsSummaryTable(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q723 — presetFamilyAmbassadorsSummaryNarrative
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorsSummaryNarrative (Q723)', () => {
  it('returns summary narrative for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const result = presetFamilyAmbassadorsSummaryNarrative(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(typeof result.summaryNarrative).toBe('string');
    expect(result.summaryNarrative.length).toBeGreaterThan(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorsSummaryNarrative(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q725 — presetFamilyAmbassadorTopN
// ---------------------------------------------------------------------------

describe('presetFamilyAmbassadorTopN (Q725)', () => {
  it('returns top N ambassadors for a preset family', () => {
    const spec = harmonicSpectrum(6);
    const top1 = presetFamilyAmbassadorTopN(['12-tet'], spec, 1, undefined, [TWELVE_TET]);
    expect(top1.length).toBe(1);
    expect(top1[0]!.rank).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilyAmbassadorTopN(['not-a-preset'], spec, 3, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q929 — presetFamilySocraticRadarConsistencyScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarConsistencyScore (Q929)', () => {
  it('single preset returns zero consistency score', () => {
    const spec = harmonicSpectrum(6);
    const { consistencyScore, consistencyLabel } = presetFamilySocraticRadarConsistencyScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(consistencyScore).toBe(0);
    expect(consistencyLabel).toBe('uniform');
  });

  it('consistency label is valid', () => {
    const spec = harmonicSpectrum(6);
    const { consistencyLabel } = presetFamilySocraticRadarConsistencyScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(['uniform', 'moderate', 'diverse']).toContain(consistencyLabel);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarConsistencyScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q947 — presetFamilySocraticRadarOutlierDetection
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarOutlierDetection (Q947)', () => {
  it('single preset has no outliers', () => {
    const spec = harmonicSpectrum(6);
    const { outlierIndices } = presetFamilySocraticRadarOutlierDetection(
      ['12-tet'],
      spec,
      undefined,
      1.5,
      [TWELVE_TET],
    );
    expect(outlierIndices).toEqual([]);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarOutlierDetection(['not-a-preset'], spec, undefined, 1.5, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q949 — presetFamilySocraticRadarTrend
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarTrend (Q949)', () => {
  it('single preset has stable trend', () => {
    const spec = harmonicSpectrum(6);
    const { overallTrend } = presetFamilySocraticRadarTrend(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(overallTrend).toBe('stable');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarTrend(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q951 — presetFamilySocraticRadarRobustnessScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarRobustnessScore (Q951)', () => {
  it('single preset robustnessScore is 1', () => {
    const spec = harmonicSpectrum(6);
    const { robustnessScore } = presetFamilySocraticRadarRobustnessScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(robustnessScore).toBe(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarRobustnessScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q955 — presetFamilySocraticRadarEvolutionScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarEvolutionScore (Q955)', () => {
  it('single preset evolutionScore is 0', () => {
    const spec = harmonicSpectrum(6);
    const { evolutionScore } = presetFamilySocraticRadarEvolutionScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(evolutionScore).toBe(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarEvolutionScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q961 — presetFamilySocraticRadarVolatilityIndex
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarVolatilityIndex (Q961)', () => {
  it('single preset volatilityIndex is 0', () => {
    const spec = harmonicSpectrum(6);
    const { volatilityIndex } = presetFamilySocraticRadarVolatilityIndex(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(volatilityIndex).toBe(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarVolatilityIndex(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q963 — presetFamilySocraticRadarCoherenceScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarCoherenceScore (Q963)', () => {
  it('single preset coherenceScore is 0 and label is incoherent', () => {
    const spec = harmonicSpectrum(6);
    const { coherenceScore, coherenceLabel } = presetFamilySocraticRadarCoherenceScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(coherenceScore).toBe(0);
    expect(coherenceLabel).toBe('incoherent');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarCoherenceScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q965 — presetFamilySocraticRadarMomentumScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarMomentumScore (Q965)', () => {
  it('single preset momentumScore is 0 and label is neutral', () => {
    const spec = harmonicSpectrum(6);
    const { momentumScore, momentumLabel } = presetFamilySocraticRadarMomentumScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(momentumScore).toBe(0);
    expect(momentumLabel).toBe('neutral');
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarMomentumScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q971 — presetFamilySocraticRadarIQRScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarIQRScore (Q971)', () => {
  it('single preset all iqr values are 0', () => {
    const spec = harmonicSpectrum(6);
    const { iqrPerAxis, meanIQR } = presetFamilySocraticRadarIQRScore(['12-tet'], spec, undefined, [
      TWELVE_TET,
    ]);
    expect(meanIQR).toBe(0);
    for (const ax of [
      'diversity',
      'versatility',
      'maturity',
      'benchmark',
      'convergence',
    ] as const) {
      expect(iqrPerAxis[ax]).toBe(0);
    }
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarIQRScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q973 — presetFamilySocraticRadarBimodalityScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarBimodalityScore (Q973)', () => {
  it('single preset returns empty bimodalAxes and zero bimodalityScore', () => {
    const spec = harmonicSpectrum(6);
    const { bimodalAxes, bimodalityScore } = presetFamilySocraticRadarBimodalityScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(bimodalAxes).toEqual([]);
    expect(bimodalityScore).toBe(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarBimodalityScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q975 — presetFamilySocraticRadarDependenceMatrix
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarDependenceMatrix (Q975)', () => {
  it('single preset returns 10 pairs all zero', () => {
    const spec = harmonicSpectrum(6);
    const { dependenceMatrix } = presetFamilySocraticRadarDependenceMatrix(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(Object.keys(dependenceMatrix)).toHaveLength(10);
    for (const val of Object.values(dependenceMatrix)) {
      expect(val).toBe(0);
    }
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarDependenceMatrix(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q997 — presetFamilySocraticRadarWeakMembers
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarWeakMembers (Q997)', () => {
  it('single preset weakMemberIndices is empty', () => {
    const spec = harmonicSpectrum(6);
    const { weakMemberIndices } = presetFamilySocraticRadarWeakMembers(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(weakMemberIndices).toEqual([]);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarWeakMembers(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q1029 — presetFamilySocraticRadarConvergenceScore
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarConvergenceScore (Q1029)', () => {
  it('convergenceAgreement is in [0, 1]', () => {
    const spec = harmonicSpectrum(6);
    const { convergenceAgreement } = presetFamilySocraticRadarConvergenceScore(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(convergenceAgreement).toBeGreaterThanOrEqual(0);
    expect(convergenceAgreement).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarConvergenceScore(['not-a-preset'], spec, undefined, [TWELVE_TET]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q1071 — presetFamilySocraticRadarCrossAxisCorrelation
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarCrossAxisCorrelation (Q1071)', () => {
  it('avgCorrelation is 0 for single preset', () => {
    const spec = harmonicSpectrum(6);
    const { avgCorrelation } = presetFamilySocraticRadarCrossAxisCorrelation(
      ['12-tet'],
      spec,
      undefined,
      [TWELVE_TET],
    );
    expect(avgCorrelation).toBe(0);
  });

  it('throws RangeError for unknown preset', () => {
    const spec = harmonicSpectrum(6);
    expect(() =>
      presetFamilySocraticRadarCrossAxisCorrelation(['not-a-preset'], spec, undefined, [
        TWELVE_TET,
      ]),
    ).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Q1167 — presetFamilySocraticRadarFamilyConvergence
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarFamilyConvergence (Q1167)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns converging boolean and finite rate', () => {
    const result = presetFamilySocraticRadarFamilyConvergence(presetIds, spectrum);
    expect(typeof result.converging).toBe('boolean');
    expect(Number.isFinite(result.rate)).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// Q1185 — presetFamilySocraticRadarApproximateEntropy
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarApproximateEntropy (Q1185)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns non-negative value', () => {
    const r = presetFamilySocraticRadarApproximateEntropy(presetIds, spectrum, 'diversity', 2, 0.2);
    expect(r).toBeGreaterThanOrEqual(0);
  });
});


// ---------------------------------------------------------------------------
// Q1187 — presetFamilySocraticRadarFractalDimension
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarFractalDimension (Q1187)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns a finite number', () => {
    const r = presetFamilySocraticRadarFractalDimension(presetIds, spectrum, 'diversity');
    expect(Number.isFinite(r)).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// Q1189 — presetFamilySocraticRadarSampleEntropy
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarSampleEntropy (Q1189)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns non-negative value', () => {
    const r = presetFamilySocraticRadarSampleEntropy(presetIds, spectrum, 'diversity', 2, 0.2);
    expect(r).toBeGreaterThanOrEqual(0);
  });
});


// ---------------------------------------------------------------------------
// Q1191 — presetFamilySocraticRadarTransferEntropy
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarTransferEntropy (Q1191)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns non-negative value', () => {
    const r = presetFamilySocraticRadarTransferEntropy(
      presetIds,
      spectrum,
      'diversity',
      'maturity',
      1,
      3,
    );
    expect(r).toBeGreaterThanOrEqual(0);
  });
});


// ---------------------------------------------------------------------------
// Q1193 — presetFamilySocraticRadarLyapunovExponent
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarLyapunovExponent (Q1193)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns a finite number', () => {
    const r = presetFamilySocraticRadarLyapunovExponent(presetIds, spectrum, 'diversity');
    expect(Number.isFinite(r)).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// Q1197 — presetFamilySocraticRadarPermutationEntropy
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarPermutationEntropy (Q1197)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns defined number in [0,1]', () => {
    const r = presetFamilySocraticRadarPermutationEntropy(presetIds, spectrum, 'diversity', 3);
    expect(r).toBeDefined();
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
});


// ---------------------------------------------------------------------------
// Q1201 — presetFamilySocraticRadarDetrendedFluctuation
// ---------------------------------------------------------------------------

describe('presetFamilySocraticRadarDetrendedFluctuation (Q1201)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns defined finite number', () => {
    const r = presetFamilySocraticRadarDetrendedFluctuation(presetIds, spectrum, 'diversity');
    expect(r).toBeDefined();
    expect(Number.isFinite(r)).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// Q1371 — presetFamilySocraticRadarLocalExtremaCount
describe('presetFamilySocraticRadarLocalExtremaCount (Q1371)', () => {
  const presetIds = ['12-tet', 'just-5-limit'];
  const spectrum = harmonicSpectrum(6);
  it('returns 0 for each axis for empty presetIds', () => {
    const result = presetFamilySocraticRadarLocalExtremaCount([], spectrum);
    expect(result.diversity).toBe(0);
    expect(result.convergence).toBe(0);
  });
  it('returns non-negative counts for two presets', () => {
    const result = presetFamilySocraticRadarLocalExtremaCount(presetIds, spectrum);
    for (const axis of [
      'diversity',
      'versatility',
      'maturity',
      'benchmark',
      'convergence',
    ] as const) {
      expect(result[axis]).toBeGreaterThanOrEqual(0);
    }
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarLocalExtremaCount(['unknown-preset'], spectrum)).toThrow(
      RangeError,
    );
  });
});


// Q1401 — presetFamilySocraticRadarSilhouetteScore
describe('Q1401 presetFamilySocraticRadarSilhouetteScore', () => {
  const s = harmonicSpectrum(6);
  it('returns 0 for n<=2', () => {
    const r = presetFamilySocraticRadarSilhouetteScore(['12-tet', 'just-5-limit'], s);
    expect(r).toBe(0);
  });
  it('returns number in [-1,1] for single preset', () => {
    const r = presetFamilySocraticRadarSilhouetteScore(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(-1);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarSilhouetteScore(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1407 — presetFamilySocraticRadarDunnIndex
describe('Q1407 presetFamilySocraticRadarDunnIndex', () => {
  const s = harmonicSpectrum(6);
  it('returns 0 for n<=2', () => {
    const r = presetFamilySocraticRadarDunnIndex(['12-tet', 'just-5-limit'], s);
    expect(r).toBe(0);
  });
  it('returns 0 for single preset', () => {
    const r = presetFamilySocraticRadarDunnIndex(['12-tet'], s);
    expect(r).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarDunnIndex(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1409 — presetFamilySocraticRadarDaviesBouldinIndex
describe('Q1409 presetFamilySocraticRadarDaviesBouldinIndex', () => {
  const s = harmonicSpectrum(6);
  it('returns 0 for n<=2', () => {
    const r = presetFamilySocraticRadarDaviesBouldinIndex(['12-tet', 'just-5-limit'], s);
    expect(r).toBe(0);
  });
  it('returns 0 for single preset', () => {
    const r = presetFamilySocraticRadarDaviesBouldinIndex(['12-tet'], s);
    expect(r).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarDaviesBouldinIndex(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1423 — presetFamilySocraticRadarSpectralCentroidProfile
describe('Q1423 presetFamilySocraticRadarSpectralCentroidProfile', () => {
  const s = harmonicSpectrum(6);
  it('returns array of length n', () => {
    const r = presetFamilySocraticRadarSpectralCentroidProfile(['12-tet', 'just-5-limit'], s);
    expect(r).toHaveLength(2);
  });
  it('centroid values are positive', () => {
    const r = presetFamilySocraticRadarSpectralCentroidProfile(['12-tet'], s);
    expect(r[0]).toBeGreaterThan(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarSpectralCentroidProfile(['unknown'], s)).toThrow(
      RangeError,
    );
  });
});


// Q1425 — presetFamilySocraticRadarSpectralFlatnessProfile
describe('Q1425 presetFamilySocraticRadarSpectralFlatnessProfile', () => {
  const s = harmonicSpectrum(6);
  it('returns array of length n', () => {
    const r = presetFamilySocraticRadarSpectralFlatnessProfile(['12-tet', 'just-5-limit'], s);
    expect(r).toHaveLength(2);
  });
  it('flatness values are in [0,1]', () => {
    const r = presetFamilySocraticRadarSpectralFlatnessProfile(['12-tet'], s);
    expect(r[0]).toBeGreaterThanOrEqual(0);
    expect(r[0]).toBeLessThanOrEqual(1);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarSpectralFlatnessProfile(['unknown'], s)).toThrow(
      RangeError,
    );
  });
});


// Q1427 — presetFamilySocraticRadarSpectralRolloffProfile
describe('Q1427 presetFamilySocraticRadarSpectralRolloffProfile', () => {
  const s = harmonicSpectrum(6);
  it('returns array of length n', () => {
    const r = presetFamilySocraticRadarSpectralRolloffProfile(['12-tet', 'just-5-limit'], s);
    expect(r).toHaveLength(2);
  });
  it('rolloff frequency is positive', () => {
    const r = presetFamilySocraticRadarSpectralRolloffProfile(['12-tet'], s);
    expect(r[0]).toBeGreaterThan(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarSpectralRolloffProfile(['unknown'], s)).toThrow(
      RangeError,
    );
  });
});


// Q1433 — presetFamilySocraticRadarSpectralBandwidthMean
describe('Q1433 presetFamilySocraticRadarSpectralBandwidthMean', () => {
  const s = harmonicSpectrum(6);
  it('returns non-negative for two presets', () => {
    const r = presetFamilySocraticRadarSpectralBandwidthMean(['12-tet', 'just-5-limit'], s);
    expect(r).toBeGreaterThanOrEqual(0);
  });
  it('returns non-negative for single preset', () => {
    expect(presetFamilySocraticRadarSpectralBandwidthMean(['12-tet'], s)).toBeGreaterThanOrEqual(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarSpectralBandwidthMean(['unknown'], s)).toThrow(
      RangeError,
    );
  });
});


// Q1435 — presetFamilySocraticRadarCriticalBandRatio
describe('Q1435 presetFamilySocraticRadarCriticalBandRatio', () => {
  const s = harmonicSpectrum(6);
  it('returns value in [0,1] for single preset', () => {
    const r = presetFamilySocraticRadarCriticalBandRatio(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for two presets', () => {
    const r = presetFamilySocraticRadarCriticalBandRatio(['12-tet', 'just-5-limit'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarCriticalBandRatio(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1439 — presetFamilySocraticRadarRoughnessProfile
describe('Q1439 presetFamilySocraticRadarRoughnessProfile', () => {
  const s = harmonicSpectrum(6);
  it('returns array of length 1 for single preset', () => {
    const r = presetFamilySocraticRadarRoughnessProfile(['12-tet'], s);
    expect(r).toHaveLength(1);
  });
  it('values are non-negative', () => {
    const r = presetFamilySocraticRadarRoughnessProfile(['12-tet'], s);
    expect(r[0]).toBeGreaterThanOrEqual(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarRoughnessProfile(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1441 — presetFamilySocraticRadarMaskingThresholdMean
describe('Q1441 presetFamilySocraticRadarMaskingThresholdMean', () => {
  const s = harmonicSpectrum(6);
  it('returns non-negative for single preset', () => {
    const r = presetFamilySocraticRadarMaskingThresholdMean(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
  });
  it('returns non-negative for two presets', () => {
    const r = presetFamilySocraticRadarMaskingThresholdMean(['12-tet', 'just-5-limit'], s);
    expect(r).toBeGreaterThanOrEqual(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarMaskingThresholdMean(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1443 — presetFamilySocraticRadarPitchSalienceMean
describe('Q1443 presetFamilySocraticRadarPitchSalienceMean', () => {
  const s = harmonicSpectrum(6);
  it('returns non-negative for single preset', () => {
    const r = presetFamilySocraticRadarPitchSalienceMean(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
  });
  it('returns non-negative for two presets', () => {
    const r = presetFamilySocraticRadarPitchSalienceMean(['12-tet', 'just-5-limit'], s);
    expect(r).toBeGreaterThanOrEqual(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarPitchSalienceMean(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1483 — presetFamilySocraticRadarModalCenterStrength
describe('Q1483 presetFamilySocraticRadarModalCenterStrength', () => {
  const s = harmonicSpectrum(6);
  it('returns non-negative for single preset', () => {
    const r = presetFamilySocraticRadarModalCenterStrength(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarModalCenterStrength([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarModalCenterStrength(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1485 — presetFamilySocraticRadarTonicStabilityIndex
describe('Q1485 presetFamilySocraticRadarTonicStabilityIndex', () => {
  const s = harmonicSpectrum(6);
  it('returns finite number for single preset', () => {
    const r = presetFamilySocraticRadarTonicStabilityIndex(['12-tet'], s);
    expect(Number.isFinite(r)).toBe(true);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarTonicStabilityIndex([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarTonicStabilityIndex(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1487 — presetFamilySocraticRadarLeadingToneScore
describe('Q1487 presetFamilySocraticRadarLeadingToneScore', () => {
  const s = harmonicSpectrum(6);
  it('returns value in [0,1] for single preset', () => {
    const r = presetFamilySocraticRadarLeadingToneScore(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarLeadingToneScore([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarLeadingToneScore(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1489 — presetFamilySocraticRadarModalAmbiguity
describe('Q1489 presetFamilySocraticRadarModalAmbiguity', () => {
  const s = harmonicSpectrum(6);
  it('returns >= 1 for single preset', () => {
    const r = presetFamilySocraticRadarModalAmbiguity(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(1);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarModalAmbiguity([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarModalAmbiguity(['unknown'], s)).toThrow(RangeError);
  });
});


// ---------------------------------------------------------------------------
// Round 51: Q1507–Q1517 — Complexity Theory / Algorithmic Information bridges
// ---------------------------------------------------------------------------

// Q1507 — presetFamilySocraticRadarKolmogorovProxy
describe('Q1507 presetFamilySocraticRadarKolmogorovProxy', () => {
  const s = harmonicSpectrum(6);
  it('returns value in (0,1] for single preset', () => {
    const r = presetFamilySocraticRadarKolmogorovProxy(['12-tet'], s);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarKolmogorovProxy([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarKolmogorovProxy(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1509 — presetFamilySocraticRadarLempelZivProxy
describe('Q1509 presetFamilySocraticRadarLempelZivProxy', () => {
  const s = harmonicSpectrum(6);
  it('returns > 0 for single preset', () => {
    expect(presetFamilySocraticRadarLempelZivProxy(['12-tet'], s)).toBeGreaterThan(0);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarLempelZivProxy([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarLempelZivProxy(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1511 — presetFamilySocraticRadarFractalDimensionProxy
describe('Q1511 presetFamilySocraticRadarFractalDimensionProxy', () => {
  const s = harmonicSpectrum(6);
  it('returns value in [0,2] for single preset', () => {
    const r = presetFamilySocraticRadarFractalDimensionProxy(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(2);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarFractalDimensionProxy([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarFractalDimensionProxy(['unknown'], s)).toThrow(
      RangeError,
    );
  });
});


// Q1513 — presetFamilySocraticRadarSelfSimilarityScore
describe('Q1513 presetFamilySocraticRadarSelfSimilarityScore', () => {
  const s = harmonicSpectrum(6);
  it('returns value in [0,1] for single preset', () => {
    const r = presetFamilySocraticRadarSelfSimilarityScore(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarSelfSimilarityScore([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarSelfSimilarityScore(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1515 — presetFamilySocraticRadarRepetitiveness
describe('Q1515 presetFamilySocraticRadarRepetitiveness', () => {
  const s = harmonicSpectrum(6);
  it('returns value in [0,1] for single preset', () => {
    const r = presetFamilySocraticRadarRepetitiveness(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarRepetitiveness([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarRepetitiveness(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1517 — presetFamilySocraticRadarPredictabilityScore
describe('Q1517 presetFamilySocraticRadarPredictabilityScore', () => {
  const s = harmonicSpectrum(6);
  it('returns value in [0,1] for single preset', () => {
    const r = presetFamilySocraticRadarPredictabilityScore(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarPredictabilityScore([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarPredictabilityScore(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1519 — presetFamilySocraticRadarNashEquilibriumProxy
describe('Q1519 presetFamilySocraticRadarNashEquilibriumProxy', () => {
  const s = harmonicSpectrum(6);
  it('returns value in [0,1] for single preset', () => {
    const r = presetFamilySocraticRadarNashEquilibriumProxy(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarNashEquilibriumProxy([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarNashEquilibriumProxy(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1521 — presetFamilySocraticRadarGameValueMean
describe('Q1521 presetFamilySocraticRadarGameValueMean', () => {
  const s = harmonicSpectrum(6);
  it('returns positive value for single preset', () => {
    const r = presetFamilySocraticRadarGameValueMean(['12-tet'], s);
    expect(r).toBeGreaterThan(0);
  });
  it('empty returns 1', () => {
    expect(presetFamilySocraticRadarGameValueMean([], s)).toBe(1);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarGameValueMean(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1525 — presetFamilySocraticRadarParetoDominanceCount
describe('Q1525 presetFamilySocraticRadarParetoDominanceCount', () => {
  const s = harmonicSpectrum(6);
  it('returns 1 for single preset (non-dominated)', () => {
    const r = presetFamilySocraticRadarParetoDominanceCount(['12-tet'], s);
    expect(r).toBe(1);
  });
  it('empty returns 1', () => {
    expect(presetFamilySocraticRadarParetoDominanceCount([], s)).toBe(1);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarParetoDominanceCount(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1537 — presetFamilySocraticRadarELECTREOutranking
describe('Q1537 presetFamilySocraticRadarELECTREOutranking', () => {
  const s = harmonicSpectrum(6);
  it('returns array of length 1 for single preset', () => {
    const r = presetFamilySocraticRadarELECTREOutranking(['12-tet'], s);
    expect(r).toHaveLength(1);
    expect(r[0]).toBeGreaterThanOrEqual(0);
  });
  it('empty returns []', () => {
    expect(presetFamilySocraticRadarELECTREOutranking([], s)).toEqual([]);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarELECTREOutranking(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1539 — presetFamilySocraticRadarPROMETHEEFlowMean
describe('Q1539 presetFamilySocraticRadarPROMETHEEFlowMean', () => {
  const s = harmonicSpectrum(6);
  it('returns non-negative for single preset', () => {
    const r = presetFamilySocraticRadarPROMETHEEFlowMean(['12-tet'], s);
    expect(r).toBeGreaterThanOrEqual(0);
  });
  it('empty returns 0', () => {
    expect(presetFamilySocraticRadarPROMETHEEFlowMean([], s)).toBe(0);
  });
  it('throws for unknown preset', () => {
    expect(() => presetFamilySocraticRadarPROMETHEEFlowMean(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1619 — presetFamilySocraticRadarBetweennessCentralityMean
describe('Q1619 presetFamilySocraticRadarBetweennessCentralityMean', () => {
  const s = harmonicSpectrum(6);
  it('returns finite for single preset', () => {
    expect(Number.isFinite(presetFamilySocraticRadarBetweennessCentralityMean(['12-tet'], s))).toBe(
      true,
    );
  });
  it('returns finite for two presets', () => {
    expect(
      Number.isFinite(
        presetFamilySocraticRadarBetweennessCentralityMean(['12-tet', 'just-5-limit'], s),
      ),
    ).toBe(true);
  });
  it('throws RangeError for unknown preset', () => {
    expect(() => presetFamilySocraticRadarBetweennessCentralityMean(['unknown'], s)).toThrow(
      RangeError,
    );
  });
});


// Q1621 — presetFamilySocraticRadarClusteringCoefficientMeanV2
describe('Q1621 presetFamilySocraticRadarClusteringCoefficientMeanV2', () => {
  const s = harmonicSpectrum(6);
  it('returns finite for single preset', () => {
    expect(
      Number.isFinite(presetFamilySocraticRadarClusteringCoefficientMeanV2(['12-tet'], s)),
    ).toBe(true);
  });
  it('returns finite for two presets', () => {
    expect(
      Number.isFinite(
        presetFamilySocraticRadarClusteringCoefficientMeanV2(['12-tet', 'just-5-limit'], s),
      ),
    ).toBe(true);
  });
  it('throws RangeError for unknown preset', () => {
    expect(() => presetFamilySocraticRadarClusteringCoefficientMeanV2(['unknown'], s)).toThrow(
      RangeError,
    );
  });
});


// Q1623 — presetFamilySocraticRadarGraphDensityMean
describe('Q1623 presetFamilySocraticRadarGraphDensityMean', () => {
  const s = harmonicSpectrum(6);
  it('returns finite for single preset', () => {
    expect(Number.isFinite(presetFamilySocraticRadarGraphDensityMean(['12-tet'], s))).toBe(true);
  });
  it('returns finite for two presets', () => {
    expect(
      Number.isFinite(presetFamilySocraticRadarGraphDensityMean(['12-tet', 'just-5-limit'], s)),
    ).toBe(true);
  });
  it('throws RangeError for unknown preset', () => {
    expect(() => presetFamilySocraticRadarGraphDensityMean(['unknown'], s)).toThrow(RangeError);
  });
});


// Q1653 — presetFamilySocraticRadarLaplacianMean
describe('Q1653 presetFamilySocraticRadarLaplacianMean', () => {
  const s = harmonicSpectrum(6);
  it('returns finite for single preset', () => {
    expect(Number.isFinite(presetFamilySocraticRadarLaplacianMean(['12-tet'], s))).toBe(true);
  });
  it('returns finite for two presets', () => {
    expect(
      Number.isFinite(presetFamilySocraticRadarLaplacianMean(['12-tet', 'just-5-limit'], s)),
    ).toBe(true);
  });
  it('throws RangeError for unknown preset', () => {
    expect(() => presetFamilySocraticRadarLaplacianMean(['unknown'], s)).toThrow(RangeError);
  });
});

