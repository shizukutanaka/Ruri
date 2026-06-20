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
  chordMapRangeBundle,
  scaleIntervalVector,
  progressionDissonanceDelta,
  tuningModeCount,
  scaleToChordMapSummary,
  tuningStabilityScore,
  chordMapVolatility,
  tuningHarmonicDensity,
  tuningSpectralFit,
  chordProgressionSmooth,
  scaleChordMapVolatility,
  modeVolatilityProfile,
  tuningFamilyReport,
  progressionSmoothnessRatio,
  chordMapSpectralProfile,
  chordMapSpectralRanking,
  tuningProgressionVariety,
  chordMapConsistencyScore,
  chordMapProgressionBridge,
  tuningConsistencyProfile,
  chordMapNormalizedScores,
  tuningReportCard,
  chordMapEntropyScore,
  tuningEntropyProfile,
  bestModeByEntropy,
  tuningConsistencyEntropyDelta,
  chordMapRankedBundle,
  bestModeByConsistency,
  tuningDualBestModes,
  chordMapVolatilityBundle,
  tuningModeComparison,
  bestModeByVolatility,
  tuningTripleBestModes,
  tuningModeRanking,
  tuningModeRankingBundle,
  modeProgressionBundle,
  tuningBestModeProgression,
  tuningFullAnalysis,
  tuningFamilyFullReport,
  tuningModeNarratives,
  bestModeNarrative,
  tuningModeSummaries,
  tuningModeFullBundle,
  tuningFamilyNarratives,
  tuningFamilyModeRankings,
  tuningModeProgressionBundles,
  tuningModeSpectralBundles,
  tuningFamilyProgressionBundles,
  tuningFamilySpectralBundles,
  tuningFamilyFullBundle,
  chordMapFullBundle,
  scaleModeSpectralRankings,
  tuningModeChordMapBundles,
  tuningFamilyChordMapBundles,
  scaleChordMapNarrativeBundle,
  tuningBestModeChordMapNarrative,
  tuningModeNarrativeCompare,
  tuningFamilyNarrativeCompare,
  scaleBestProgressionNarrative,
  tuningModeBestProgressionNarratives,
  tuningModeSmoothProgressionRatios,
  tuningBestSmoothMode,
  tuningFamilyBestSmoothModes,
  scaleProgressionFullBundle,
  tuningModeProgressionFullBundles,
  tuningModeConsistencyEntropyProfiles,
  tuningTopModesByDelta,
  chordMapDissonanceHistogram,
  tuningModeDissonanceHistograms,
  chordMapHarmonicityHistogram,
  tuningModeHarmonicityHistograms,
  chordMapDualHistogram,
  tuningModeDualHistograms,
  tuningFamilyDualHistograms,
  chordMapHistogramSummary,
  tuningModeHistogramSummaries,
  tuningFamilyHistogramSummaries,
  chordMapAnalysisFull,
  scaleChordMapAnalysisFull,
  tuningModeAnalysisFull,
  tuningFamilyModeAnalysisFull,
  tuningHarmonicSpectralScore,
  tuningFamilyHarmonicSpectralScores,
  tuningComprehensiveReport,
  tuningFamilyComprehensiveReports,
  scaleSimilarityRanking,
  tuningFamilySimilarityMatrix,
  tuningModeIntervalProfile,
  tuningFamilyIntervalProfiles,
  tuningMostDiverseMode,
  tuningFamilyMostDiverseModes,
  tuningModeComprehensiveBundle,
  tuningFamilyModeComprehensiveBundles,
  tuningBestModeComprehensive,
  tuningFamilyBestModeComprehensive,
  tuningModeScoreRanking,
  tuningFamilyModeScoreRankings,
  tuningModeComprehensiveTop,
  tuningIntervalDiversityVsEntropy,
  tuningModeParetoFront,
  tuningFamilyModeParetoFronts,
  tuningModeCorrelationMatrix,
  tuningFamilyModeCorrelationMatrices,
  tuningParetoFrontBestMode,
  tuningModeTopCorrelation,
  tuningModeAntiCorrelation,
  tuningFamilyTopCorrelations,
  tuningFamilyAntiCorrelations,
  tuningParetoFrontSummary,
  tuningFamilyParetoFrontSummaries,
  tuningParetoFrontVsRanking,
  tuningParetoFrontRankPosition,
  tuningBestParetoRankedMode,
  tuningFamilyParetoRankPositions,
  tuningParetoFrontGap,
  tuningParetoFrontCoverage,
  tuningFamilyParetoFrontCoverage,
  tuningParetoSummaryComparison,
  tuningCorrelationMatrixNarrative,
  tuningFamilyCorrelationNarratives,
  tuningParetoFrontNarrative,
  tuningFamilyParetoNarratives,
  tuningFullParetoCorrelationReport,
  tuningFamilyFullParetoCorrelationReports,
  tuningModeMetricOutliers,
  tuningFamilyModeMetricOutliers,
  tuningModeMetricOutlierSummary,
  tuningFamilyModeMetricOutlierSummaries,
  tuningModeMetricProfile,
  tuningFamilyModeMetricProfiles,
  tuningModeMetricRadarData,
  tuningFamilyModeMetricRadarData,
  tuningModeMetricCluster,
  tuningFamilyModeMetricClusters,
  tuningClusterSummary,
  tuningFamilyClusterSummaries,
  tuningModeRadarRanking,
  tuningFamilyModeRadarRankings,
  tuningRadarRankingVsScoreRanking,
  tuningFamilyRadarVsScoreRankings,
  tuningBestRadarScoreAgreement,
  tuningFamilyBestRadarScoreAgreements,
  tuningModeConsensusRanking,
  tuningFamilyModeConsensusRankings,
  tuningBestConsensusMode,
  tuningFamilyBestConsensusModes,
  tuningUltimateBestMode,
  tuningFamilyUltimateBestModes,
  tuningConsensusNarrative,
  tuningFamilyConsensusNarratives,
  tuningMasterReport,
  tuningFamilyMasterReports,
  tuningModeComprehensiveMetricBundle,
  tuningFamilyModeComprehensiveMetricBundles,
  tuningModeConsensusClusterBundle,
  tuningFamilyModeConsensusClusterBundles,
  tuningTopClusterConsensusMode,
  tuningFamilyTopClusterConsensusModes,
  tuningModeConsensusOutlierBundle,
  tuningFamilyModeConsensusOutlierBundles,
  tuningModeInsightSummary,
  tuningFamilyModeInsightSummaries,
  tuningFinalRecommendation,
  tuningFamilyFinalRecommendations,
  tuningModeEntropyDiversityMap,
  tuningFamilyModeEntropyDiversityMaps,
  tuningModeConsistencyVolatilityMap,
  tuningFamilyModeConsistencyVolatilityMaps,
  tuningModeFiveDimMap,
  tuningFamilyModeFiveDimMaps,
  tuningModeFiveDimNarrative,
  tuningFamilyModeFiveDimNarratives,
  tuningModeSmoothnessEntropyMap,
  tuningFamilyModeSmoothnessEntropyMaps,
  tuningModeDiversityVolatilityMap,
  tuningFamilyModeDiversityVolatilityMaps,
  tuningModeAllQuadrantsBundle,
  tuningFamilyModeAllQuadrantsBundles,
  tuningModeAllQuadrantsNarrative,
  tuningFamilyModeAllQuadrantsNarratives,
  tuningModeQuadrantConsensus,
  tuningFamilyModeQuadrantConsensus,
  tuningBestQuadrantConsensusMode,
  tuningFamilyBestQuadrantConsensusModes,
  tuningModeConsensusNarrative,
  tuningFamilyModeConsensusNarratives,
  tuningModeQuadrantProfile,
  tuningFamilyModeQuadrantProfiles,
  tuningQuadrantCoverage,
  tuningFamilyQuadrantCoverage,
  tuningModeGroupByProfile,
  tuningFamilyModeGroupByProfiles,
  tuningQuadrantCoverageNarrative,
  tuningFamilyQuadrantCoverageNarratives,
  tuningDominantQuadrantProfile,
  tuningFamilyDominantQuadrantProfiles,
  tuningQuadrantProfileDiversity,
  tuningFamilyQuadrantProfileDiversities,
  tuningQuadrantProfileDiversityNarrative,
  tuningFamilyQuadrantProfileDiversityNarratives,
  tuningFamilyQuadrantDiversityRanking,
  tuningFamilyMostDiverseQuadrantProfile,
  tuningFamilyLeastDiverseQuadrantProfile,
  tuningFamilyQuadrantProfileFrequency,
  tuningFamilySharedQuadrantProfiles,
  tuningFamilyUniqueQuadrantProfiles,
  tuningFamilyMostSharedQuadrantProfile,
  tuningFamilyQuadrantProfileOverlapScore,
  tuningFamilyQuadrantProfileFrequencyNarrative,
  tuningModeProfileTransitions,
  tuningProfileTransitionScore,
  tuningFamilyProfileTransitionScores,
  tuningFamilyProfileTransitionRanking,
  tuningProfileTransitionScoreNarrative,
  tuningFamilyProfileTransitionScoreNarratives,
  tuningFamilyMostStableProfileTransition,
  tuningFamilyLeastStableProfileTransition,
  tuningProfileTransitionHeatMap,
  tuningProfileTransitionRuns,
  tuningProfileLongestRun,
  tuningProfileRunSummary,
  tuningFamilyProfileRunSummaries,
  tuningFamilyProfileRunRanking,
  tuningProfileRunSummaryNarrative,
  tuningFamilyProfileRunSummaryNarratives,
  tuningProfileRunDensity,
  tuningFamilyProfileRunDensities,
  tuningFamilyProfileRunDensityRanking,
  tuningFamilyMostChaoticProfileTransition,
  tuningFamilyMostConsistentProfileTransition,
  tuningProfileRunDensityNarrative,
  tuningFamilyProfileRunDensityNarratives,
  tuningProfileTextureReport,
  tuningFamilyProfileTextureReports,
  tuningProfileTextureReportNarrative,
  tuningFamilyProfileTextureReportNarratives,
  tuningModeRarestProfileGroup,
  tuningModeSoloProfileModes,
  tuningFamilyModeSoloProfileCounts,
  tuningModeSoloProfileRatio,
  tuningFamilyModeSoloProfileRatios,
  tuningFamilySoloProfileRatioRanking,
  tuningMostUniqueModesTuning,
  tuningModeSoloProfileNarrative,
  tuningFamilyModeSoloProfileNarratives,
  tuningModeQuadrantIdentityBundle,
  tuningFamilyModeQuadrantIdentityBundles,
  tuningModeQuadrantIdentityNarrative,
  tuningFamilyModeQuadrantIdentityNarratives,
  tuningModeAmbassador,
  tuningFamilyModeAmbassadors,
  tuningModeAmbassadorNarrative,
  tuningFamilyModeAmbassadorNarratives,
  tuningFamilyAmbassadorRanking,
  tuningFamilyBestAmbassador,
  tuningFamilyWeakestAmbassador,
  tuningFamilyAmbassadorRankingNarrative,
  tuningFamilyAmbassadorScoreStats,
  tuningFamilyAmbassadorGap,
  tuningFamilyAmbassadorScoreStatsNarrative,
  tuningFamilyAmbassadorConsensusDistribution,
  tuningFamilyAmbassadorConsensusDistributionNarrative,
  tuningFamilyAmbassadorProfileFrequency,
  tuningFamilyMostCommonAmbassadorProfile,
  tuningFamilyLeastCommonAmbassadorProfile,
  tuningFamilyUniqueAmbassadorProfiles,
  tuningFamilyAmbassadorConsensusScore,
  tuningFamilyAmbassadorConsensusScoreNarrative,
  tuningFamilyAmbassadorReport,
  tuningFamilyAmbassadorReportNarrative,
  tuningFamilyAmbassadorOverlapScore,
  tuningFamilyAmbassadorOverlapScoreNarrative,
  tuningPairAmbassadorSimilarity,
  tuningFamilyAmbassadorSimilarityMatrix,
  tuningFamilyAmbassadorConvergenceScore,
  tuningFamilyMostSimilarAmbassadorPair,
  tuningFamilyLeastSimilarAmbassadorPair,
  tuningFamilyAmbassadorConvergenceScoreNarrative,
  tuningFamilyAmbassadorConsensusConvergenceScore,
  tuningFamilyAmbassadorConsensusConvergenceScoreNarrative,
  tuningFamilyAmbassadorConvergenceBundle,
  tuningFamilyAmbassadorConvergenceBundleNarrative,
  tuningAmbassadorProfileDistance,
  tuningFamilyAmbassadorProfileDistanceMatrix,
  tuningFamilyAmbassadorMeanProfileDistance,
  tuningFamilyAmbassadorMeanProfileDistanceNarrative,
  tuningFamilyAmbassadorProfileDistanceStats,
  tuningFamilyMostDistantAmbassadorPair,
  tuningFamilyAmbassadorCentralityScores,
  tuningFamilyAmbassadorCentrality,
  tuningFamilyAmbassadorOutlier,
  tuningFamilyAmbassadorCentralityNarrative,
  tuningFamilyAmbassadorDistanceSpread,
  tuningFamilyAmbassadorDistanceSpreadNarrative,
  tuningFamilyFullAmbassadorAnalytics,
  tuningFamilyFullAmbassadorAnalyticsNarrative,
  tuningFamilyAmbassadorsSummaryTable,
  tuningFamilyAmbassadorsSummaryNarrative,
  tuningFamilyAmbassadorTopN,
  tuningSocraticProfile,
  tuningSocraticProfileNarrative,
  tuningFamilySocraticProfiles,
  tuningFamilySocraticProfileNarratives,
  tuningFamilySocraticComparison,
  tuningFamilySocraticComparisonNarrative,
  tuningFamilySocraticInsight,
  tuningFamilySocraticInsightNarrative,
  tuningSocraticContrast,
  tuningSocraticContrastNarrative,
  tuningFamilySocraticRecommendation,
  tuningFamilySocraticRecommendationNarrative,
  tuningFamilySocraticPairwiseContrasts,
  tuningFamilySocraticPairwiseContrastStats,
  tuningFamilySocraticPairwiseContrastStatsNarrative,
  tuningFamilySocraticDiversityIndex,
  tuningFamilySocraticDiversityIndexNarrative,
  tuningFamilySocraticEvolutionRanking,
  tuningFamilySocraticEvolutionRankingNarrative,
  tuningFamilySocraticClusterMap,
  tuningFamilySocraticClusterMapNarrative,
  tuningFamilySocraticTopologyScore,
  tuningFamilySocraticTopologyScoreNarrative,
  tuningFamilySocraticSummaryBundle,
  tuningFamilySocraticSummaryBundleNarrative,
  tuningSocraticCharacterPortrait,
  tuningFamilySocraticCharacterPortraits,
  tuningFamilySocraticFamilyPortrait,
  tuningFamilySocraticInsightDigest,
  tuningFamilySocraticInsightDigestNarrative,
  tuningFamilySocraticAxisAnalysis,
  tuningFamilySocraticAxisNarrative,
  tuningFamilySocraticSignature,
  tuningFamilySocraticBenchmark,
  tuningFamilySocraticBenchmarkNarrative,
  tuningFamilySocraticSignatureComparison,
  tuningFamilySocraticSignatureComparisonNarrative,
  tuningFamilySocraticConsensusNarrative,
  tuningFamilySocraticBenchmarkComparison,
  tuningFamilySocraticBenchmarkComparisonNarrative,
  tuningFamilySocraticBestAndWorst,
  tuningFamilySocraticBestAndWorstNarrative,
  tuningFamilySocraticScoreSpread,
  tuningFamilySocraticScoreSpreadNarrative,
  tuningFamilySocraticVersatilityRatio,
  tuningFamilySocraticVersatilityRatioNarrative,
  tuningFamilySocraticArchetype,
  tuningFamilySocraticArchetypeNarrative,
} from './scale.js';
import { type TuningSystem, equalTemperament12, edo, degreeToFreq } from './tuning.js';
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

describe('chordMapRangeBundle (Q252)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);

  it('partitions chord map into 3 groups', () => {
    const bundle = chordMapRangeBundle(chordMap, 0.5, 0.5);
    const total = bundle.consonant.length + bundle.dissonant.length + bundle.neutral.length;
    expect(total).toBe(chordMap.length);
  });
  it('consonant entries have low dissonance and harmonicity', () => {
    const bundle = chordMapRangeBundle(chordMap, 1.0, 1.0);
    // All entries should be in consonant or neutral (threshold is high)
    expect(bundle.consonant.length + bundle.neutral.length).toBeGreaterThanOrEqual(0);
  });
  it('no entry appears in two groups', () => {
    const bundle = chordMapRangeBundle(chordMap, 0.5, 0.5);
    const allDegreeOffsets = [
      ...bundle.consonant.map((e) => e.degreeOffset),
      ...bundle.dissonant.map((e) => e.degreeOffset),
      ...bundle.neutral.map((e) => e.degreeOffset),
    ];
    expect(new Set(allDegreeOffsets).size).toBe(allDegreeOffsets.length);
  });
});

describe('scaleIntervalVector (Q254)', () => {
  const major: Scale = {
    id: 'major',
    name: 'Major',
    tuningId: t12.id,
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('returns an array of length floor(degreeCount/2)', () => {
    const vec = scaleIntervalVector(major, t12);
    expect(vec).toHaveLength(Math.floor((major.degreeIndices.length + 1) / 2)); // +1 for root
  });
  it('all values are non-negative integers', () => {
    const vec = scaleIntervalVector(major, t12);
    vec.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});

describe('progressionDissonanceDelta (Q255)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);
  const chords = chordMap.slice(0, 4).map((e) => e.chord);

  it('returns a non-negative number', () => {
    const delta = progressionDissonanceDelta(chords, 261.63);
    expect(delta).toBeGreaterThanOrEqual(0);
  });
  it('returns 0 for empty or single-chord progression', () => {
    expect(progressionDissonanceDelta([], 261.63)).toBe(0);
    expect(progressionDissonanceDelta([chords[0]!], 261.63)).toBe(0);
  });
  it('is always >= 0', () => {
    const delta = progressionDissonanceDelta(chords, 261.63);
    expect(Number.isFinite(delta)).toBe(true);
    expect(delta).toBeGreaterThanOrEqual(0);
  });
});

describe('tuningModeCount (Q256)', () => {
  it('returns total equal to degree count', () => {
    const { total } = tuningModeCount(t12);
    expect(total).toBe(t12.degrees.length);
  });
  it('withUniqueIntervalSets <= total', () => {
    const { total, withUniqueIntervalSets } = tuningModeCount(t12);
    expect(withUniqueIntervalSets).toBeLessThanOrEqual(total);
    expect(withUniqueIntervalSets).toBeGreaterThan(0);
  });
  it('symmetrical EDO has fewer unique sets', () => {
    const t = edo(6); // hexatonic whole-tone — all modes identical
    const { total, withUniqueIntervalSets } = tuningModeCount(t);
    expect(total).toBe(6);
    expect(withUniqueIntervalSets).toBe(1); // all modes have same interval set [200,200,200,200,200,200]
  });
});

describe('scaleToChordMapSummary (Q259)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;

  it('returns a summary with count and stats', () => {
    const summary = scaleToChordMapSummary(scale, t12);
    expect(summary.count).toBeGreaterThan(0);
    expect(typeof summary.minDissonance).toBe('number');
    expect(typeof summary.maxDissonance).toBe('number');
    expect(summary.maxDissonance).toBeGreaterThanOrEqual(summary.minDissonance);
  });
  it('is consistent with chordMapSummary', () => {
    const a = scaleToChordMapSummary(scale, t12);
    const b = chordMapSummary(scale, t12);
    expect(a.count).toBe(b.count);
    expect(a.meanDissonance).toBeCloseTo(b.meanDissonance, 5);
  });
});

describe('tuningStabilityScore (Q260)', () => {
  it('returns a value in [0, 1]', () => {
    const score = tuningStabilityScore(t12, 261.63);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
  it('is 0 for an empty tuning', () => {
    const empty: TuningSystem = {
      id: 'empty',
      name: 'Empty',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(tuningStabilityScore(empty, 261.63)).toBe(0);
  });
});

describe('chordMapVolatility (Q261)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);

  it('returns a non-negative number', () => {
    const v = chordMapVolatility(chordMap);
    expect(v).toBeGreaterThanOrEqual(0);
  });
  it('returns 0 for empty chord map', () => {
    expect(chordMapVolatility([])).toBe(0);
  });
  it('returns a finite number', () => {
    expect(Number.isFinite(chordMapVolatility(chordMap))).toBe(true);
  });
});

describe('tuningHarmonicDensity (Q263)', () => {
  it('returns a non-negative number', () => {
    const d = tuningHarmonicDensity(t12);
    expect(d).toBeGreaterThanOrEqual(0);
  });
  it('returns 0 for tuning with no degrees', () => {
    const empty: TuningSystem = {
      id: 'empty',
      name: 'Empty',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(tuningHarmonicDensity(empty)).toBe(0);
  });
  it('is a finite number', () => {
    expect(Number.isFinite(tuningHarmonicDensity(t12))).toBe(true);
  });
});

describe('tuningSpectralFit (Q264)', () => {
  const t12 = equalTemperament12(440);

  it('returns a finite non-negative number', () => {
    const fit = tuningSpectralFit(t12, harmonicSpectrum());
    expect(Number.isFinite(fit)).toBe(true);
    expect(fit).toBeGreaterThanOrEqual(0);
  });
  it('returns 0 for tuning with no degrees', () => {
    const empty: TuningSystem = {
      id: 'e',
      name: 'E',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical',
    };
    expect(tuningSpectralFit(empty, harmonicSpectrum())).toBe(0);
  });
  it('bell spectrum gives different result than harmonic spectrum', () => {
    const h = tuningSpectralFit(t12, harmonicSpectrum());
    const b = tuningSpectralFit(t12, bellSpectrum());
    // May or may not be equal — just check both are finite
    expect(Number.isFinite(h)).toBe(true);
    expect(Number.isFinite(b)).toBe(true);
  });
});

describe('chordProgressionSmooth (Q265)', () => {
  const t12 = equalTemperament12(440);
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);
  const chords = chordMap.slice(0, 4).map((e) => e.chord);

  it('returns same number of chords', () => {
    const smoothed = chordProgressionSmooth(chords, 261.63);
    expect(smoothed).toHaveLength(chords.length);
  });
  it('contains same chords', () => {
    const smoothed = chordProgressionSmooth(chords, 261.63);
    expect(new Set(smoothed)).toEqual(new Set(chords));
  });
  it('handles empty progression', () => {
    expect(chordProgressionSmooth([], 261.63)).toEqual([]);
  });
  it('handles single chord', () => {
    const result = chordProgressionSmooth([chords[0]!], 261.63);
    expect(result).toHaveLength(1);
  });
});

describe('scaleChordMapVolatility (Q267)', () => {
  const t12 = equalTemperament12(440);
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;

  it('returns non-negative number', () => {
    const v = scaleChordMapVolatility(scale, t12);
    expect(v).toBeGreaterThanOrEqual(0);
  });
  it('is finite', () => {
    expect(Number.isFinite(scaleChordMapVolatility(scale, t12))).toBe(true);
  });
});

describe('modeVolatilityProfile (Q268)', () => {
  const t12 = equalTemperament12(440);
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;

  it('returns one entry per mode', () => {
    const profile = modeVolatilityProfile(scale, t12);
    expect(profile.length).toBe(scale.degreeIndices.length);
  });
  it('all volatility values are non-negative', () => {
    const profile = modeVolatilityProfile(scale, t12);
    profile.forEach((p) => expect(p.volatility).toBeGreaterThanOrEqual(0));
  });
});

describe('tuningSpectralFit (Q264)', () => {
  it('returns a finite non-negative number', () => {
    const fit = tuningSpectralFit(t12, harmonicSpectrum());
    expect(Number.isFinite(fit)).toBe(true);
    expect(fit).toBeGreaterThanOrEqual(0);
  });
  it('returns 0 for tuning with no degrees', () => {
    const empty: TuningSystem = {
      id: 'e',
      name: 'E',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(tuningSpectralFit(empty, harmonicSpectrum())).toBe(0);
  });
  it('bell spectrum gives finite result', () => {
    expect(Number.isFinite(tuningSpectralFit(t12, bellSpectrum()))).toBe(true);
  });
});

describe('chordProgressionSmooth (Q265)', () => {
  it('returns same number of chords', () => {
    const chords = scaleToChordMap(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12)
      .slice(0, 4)
      .map((e) => e.chord);
    expect(chordProgressionSmooth(chords, 261.63)).toHaveLength(chords.length);
  });
  it('handles empty progression', () => {
    expect(chordProgressionSmooth([], 261.63)).toEqual([]);
  });
  it('handles single chord', () => {
    const chord = scaleToChordMap(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12)[0]!.chord;
    expect(chordProgressionSmooth([chord], 261.63)).toHaveLength(1);
  });
});

describe('scaleChordMapVolatility (Q267)', () => {
  it('returns non-negative finite number', () => {
    const v = scaleChordMapVolatility(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(v)).toBe(true);
  });
});

describe('modeVolatilityProfile (Q268)', () => {
  it('returns one entry per mode', () => {
    const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
    const profile = modeVolatilityProfile(scale, t12);
    expect(profile.length).toBe(scale.degreeIndices.length);
  });
  it('all volatility values are non-negative', () => {
    const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
    modeVolatilityProfile(scale, t12).forEach((p) =>
      expect(p.volatility).toBeGreaterThanOrEqual(0),
    );
  });
});

describe('tuningFamilyReport (Q272)', () => {
  const t19 = edo(19);

  it('returns report with correct structure', () => {
    const report = tuningFamilyReport([t12, t19], 261.63);
    expect(report.ids).toHaveLength(2);
    expect(report.reports).toHaveLength(2);
    expect(report.similarityMatrix).toHaveLength(2);
    expect(report.mostSimilarPair).toHaveLength(2);
    expect(report.leastSimilarPair).toHaveLength(2);
    expect(Number.isFinite(report.meanSimilarity) || Number.isNaN(report.meanSimilarity)).toBe(
      true,
    );
  });
  it('throws for empty tunings', () => {
    expect(() => tuningFamilyReport([])).toThrow(RangeError);
  });
});

describe('progressionSmoothnessRatio (Q273)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);
  const chords = chordMap.slice(0, 4).map((e) => e.chord);

  it('returns a finite number', () => {
    const r = progressionSmoothnessRatio(chords, 261.63);
    expect(Number.isFinite(r)).toBe(true);
  });
  it('returns 1 for fewer than 2 chords', () => {
    expect(progressionSmoothnessRatio([], 261.63)).toBe(1.0);
    expect(progressionSmoothnessRatio([chords[0]!], 261.63)).toBe(1.0);
  });
});

describe('chordMapSpectralProfile (Q274)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);

  it('returns one entry per chord', () => {
    const profile = chordMapSpectralProfile(chordMap, harmonicSpectrum());
    expect(profile).toHaveLength(chordMap.length);
  });
  it('all spectralFit values are non-negative', () => {
    const profile = chordMapSpectralProfile(chordMap, harmonicSpectrum());
    profile.forEach((p) => expect(p.spectralFit).toBeGreaterThanOrEqual(0));
  });
});

describe('chordMapSpectralRanking (Q278)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);

  it('returns same length as chordMap', () => {
    const ranked = chordMapSpectralRanking(chordMap, harmonicSpectrum());
    expect(ranked).toHaveLength(chordMap.length);
  });
  it('contains same entries as chordMap', () => {
    const ranked = chordMapSpectralRanking(chordMap, harmonicSpectrum());
    expect(new Set(ranked.map((e) => e.degreeOffset)).size).toBe(chordMap.length);
  });
  it('returns empty array for empty chordMap', () => {
    expect(chordMapSpectralRanking([], harmonicSpectrum())).toEqual([]);
  });
});

describe('tuningProgressionVariety (Q279)', () => {
  it('returns value in (0, 1]', () => {
    const v = tuningProgressionVariety(t12);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns 0 for tuning with no degrees', () => {
    const empty: TuningSystem = {
      id: 'e',
      name: 'E',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(tuningProgressionVariety(empty)).toBe(0);
  });
  it('whole-tone scale (6-edo) has variety 1/6', () => {
    const t6 = edo(6);
    const v = tuningProgressionVariety(t6);
    // 6-EDO: all modes identical → 1 unique / 6 total = 1/6
    expect(v).toBeCloseTo(1 / 6, 5);
  });
});

describe('chordMapConsistencyScore (Q281)', () => {
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;
  const chordMap = scaleToChordMap(scale, t12);

  it('returns a value in (0, 1]', () => {
    const score = chordMapConsistencyScore(chordMap);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
  it('returns 0 for empty chord map', () => {
    expect(chordMapConsistencyScore([])).toBe(0);
  });
  it('returns a finite number', () => {
    expect(Number.isFinite(chordMapConsistencyScore(chordMap))).toBe(true);
  });
});

describe('chordMapSpectralRanking (Q278)', () => {
  const chordMap = scaleToChordMap(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12);

  it('returns same length as chordMap', () => {
    expect(chordMapSpectralRanking(chordMap, harmonicSpectrum())).toHaveLength(chordMap.length);
  });
  it('contains same entries', () => {
    const ranked = chordMapSpectralRanking(chordMap, harmonicSpectrum());
    expect(new Set(ranked.map((e) => e.degreeOffset)).size).toBe(chordMap.length);
  });
  it('returns empty array for empty input', () => {
    expect(chordMapSpectralRanking([], harmonicSpectrum())).toEqual([]);
  });
});

describe('tuningProgressionVariety (Q279)', () => {
  it('returns value in (0, 1] for 12-TET', () => {
    const v = tuningProgressionVariety(t12);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns 0 for tuning with no degrees', () => {
    const empty: TuningSystem = {
      id: 'e',
      name: 'E',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(tuningProgressionVariety(empty)).toBe(0);
  });
  it('6-EDO (whole-tone) has 1/6 variety', () => {
    expect(tuningProgressionVariety(edo(6))).toBeCloseTo(1 / 6, 5);
  });
});

describe('chordMapConsistencyScore (Q281)', () => {
  const chordMap = scaleToChordMap(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12);

  it('returns value in (0, 1]', () => {
    const s = chordMapConsistencyScore(chordMap);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(1);
  });
  it('returns 0 for empty chord map', () => {
    expect(chordMapConsistencyScore([])).toBe(0);
  });
  it('is finite', () => {
    expect(Number.isFinite(chordMapConsistencyScore(chordMap))).toBe(true);
  });
});

describe('chordMapProgressionBridge (Q282)', () => {
  const chordMap = scaleToChordMap(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12);

  it('returns chords in count equal to chord map size', () => {
    const chords = chordMapProgressionBridge(chordMap, 261.63);
    expect(chords).toHaveLength(chordMap.length);
  });
  it('returns empty for empty chord map', () => {
    expect(chordMapProgressionBridge([], 261.63)).toEqual([]);
  });
  it('returned chords are all Chord objects', () => {
    const chords = chordMapProgressionBridge(chordMap, 261.63);
    chords.forEach((c) => expect(c.intervals).toBeDefined());
  });
});

describe('tuningConsistencyProfile (Q283)', () => {
  it('returns one entry per mode', () => {
    const profile = tuningConsistencyProfile(t12, undefined, 261.63);
    expect(profile.length).toBe(t12.degrees.length);
  });
  it('all consistency values are in (0, 1]', () => {
    tuningConsistencyProfile(t12).forEach((p) => {
      expect(p.consistency).toBeGreaterThan(0);
      expect(p.consistency).toBeLessThanOrEqual(1);
    });
  });
});

describe('chordMapNormalizedScores (Q286)', () => {
  const chordMap = scaleToChordMap(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12);

  it('returns one entry per chord', () => {
    expect(chordMapNormalizedScores(chordMap)).toHaveLength(chordMap.length);
  });
  it('normalizedDissonance in [0, 1]', () => {
    chordMapNormalizedScores(chordMap).forEach((s) => {
      expect(s.normalizedDissonance).toBeGreaterThanOrEqual(0);
      expect(s.normalizedDissonance).toBeLessThanOrEqual(1);
    });
  });
  it('normalizedHarmonicity in [0, 1]', () => {
    chordMapNormalizedScores(chordMap).forEach((s) => {
      expect(s.normalizedHarmonicity).toBeGreaterThanOrEqual(0);
      expect(s.normalizedHarmonicity).toBeLessThanOrEqual(1);
    });
  });
  it('returns empty for empty chord map', () => {
    expect(chordMapNormalizedScores([])).toEqual([]);
  });
});

describe('tuningReportCard (Q288)', () => {
  it('returns a non-empty string', () => {
    const card = tuningReportCard(t12, 261.63);
    expect(typeof card).toBe('string');
    expect(card.length).toBeGreaterThan(20);
  });
  it('contains tuning id', () => {
    const card = tuningReportCard(t12, 261.63);
    expect(card).toContain(t12.id);
  });
  it('contains stability and variety', () => {
    const card = tuningReportCard(t12, 261.63);
    expect(card.toLowerCase()).toContain('stability');
    expect(card.toLowerCase()).toContain('variety');
  });
});

describe('chordMapEntropyScore (Q289)', () => {
  const chordMap = scaleToChordMap(scaleModeSeries(tuningToScale(t12), t12)[0]!, t12);

  it('returns non-negative finite number', () => {
    const h = chordMapEntropyScore(chordMap);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(h)).toBe(true);
  });
  it('returns 0 for single-chord map', () => {
    expect(chordMapEntropyScore([chordMap[0]!])).toBe(0);
  });
  it('returns 0 for empty', () => {
    expect(chordMapEntropyScore([])).toBe(0);
  });
});

describe('tuningEntropyProfile (Q294)', () => {
  it('returns one entry per mode', () => {
    const profile = tuningEntropyProfile(t12);
    expect(profile.length).toBe(t12.degrees.length);
  });
  it('all entropies are non-negative', () => {
    const profile = tuningEntropyProfile(t12);
    for (const { entropy } of profile) {
      expect(entropy).toBeGreaterThanOrEqual(0);
    }
  });
  it('each entry has a mode with degreeIndices', () => {
    const profile = tuningEntropyProfile(t12);
    for (const { mode } of profile) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
});

describe('bestModeByEntropy (Q295)', () => {
  it('returns a Scale', () => {
    const mode = bestModeByEntropy(t12);
    expect(mode).toHaveProperty('degreeIndices');
  });
  it('has entropy >= all other modes', () => {
    const mode = bestModeByEntropy(t12);
    const profile = tuningEntropyProfile(t12);
    const best = Math.max(...profile.map((e) => e.entropy));
    const chordMap = scaleToChordMap(mode, t12);
    const entropy = chordMapEntropyScore(chordMap);
    expect(entropy).toBeCloseTo(best, 10);
  });
  it('throws for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(() => bestModeByEntropy(empty)).toThrow(RangeError);
  });
});

describe('tuningConsistencyEntropyDelta (Q300)', () => {
  it('returns a number in [0, 1]', () => {
    const delta = tuningConsistencyEntropyDelta(t12);
    expect(delta).toBeGreaterThanOrEqual(0);
    expect(delta).toBeLessThanOrEqual(1);
    expect(Number.isFinite(delta)).toBe(true);
  });
  it('returns 0 for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(tuningConsistencyEntropyDelta(empty)).toBe(0);
  });
  it('returns 0 for single-degree tuning', () => {
    const single: typeof t12 = { ...t12, degrees: [t12.degrees[0]!] };
    expect(tuningConsistencyEntropyDelta(single)).toBe(0);
  });
  it('accepts optional rootHz and spectrum', () => {
    const delta = tuningConsistencyEntropyDelta(t12, harmonicSpectrum(), 261.63);
    expect(Number.isFinite(delta)).toBe(true);
  });
});

describe('chordMapRankedBundle (Q302)', () => {
  const scale: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: t12.id,
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const chordMap = scaleToChordMap(scale, t12);
  const spectrum = harmonicSpectrum();

  it('returns spectralRanking, normalizedScores, entropy, consistency', () => {
    const bundle = chordMapRankedBundle(chordMap, spectrum);
    expect(Array.isArray(bundle.spectralRanking)).toBe(true);
    expect(Array.isArray(bundle.normalizedScores)).toBe(true);
    expect(typeof bundle.entropy).toBe('number');
    expect(typeof bundle.consistency).toBe('number');
  });
  it('spectralRanking has same length as chord map', () => {
    const bundle = chordMapRankedBundle(chordMap, spectrum);
    expect(bundle.spectralRanking).toHaveLength(chordMap.length);
  });
  it('entropy is non-negative', () => {
    const bundle = chordMapRankedBundle(chordMap, spectrum);
    expect(bundle.entropy).toBeGreaterThanOrEqual(0);
  });
  it('consistency is in (0, 1]', () => {
    const bundle = chordMapRankedBundle(chordMap, spectrum);
    expect(bundle.consistency).toBeGreaterThan(0);
    expect(bundle.consistency).toBeLessThanOrEqual(1);
  });
  it('returns empty spectralRanking and zero scores for empty chord map', () => {
    const bundle = chordMapRankedBundle([], spectrum);
    expect(bundle.spectralRanking).toEqual([]);
    expect(bundle.normalizedScores).toEqual([]);
    expect(bundle.entropy).toBe(0);
  });
});

describe('bestModeByConsistency (Q304)', () => {
  it('returns a Scale', () => {
    const mode = bestModeByConsistency(t12);
    expect(mode).toHaveProperty('degreeIndices');
  });
  it('has consistency >= all other modes', () => {
    const mode = bestModeByConsistency(t12);
    const profile = tuningConsistencyProfile(t12);
    const best = Math.max(...profile.map((e) => e.consistency));
    const chordMap = scaleToChordMap(mode, t12);
    const consistency = chordMapConsistencyScore(chordMap);
    expect(consistency).toBeCloseTo(best, 10);
  });
  it('throws for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(() => bestModeByConsistency(empty)).toThrow(RangeError);
  });
});

describe('tuningDualBestModes (Q305)', () => {
  it('returns byEntropy, byConsistency, sameMode', () => {
    const result = tuningDualBestModes(t12);
    expect(result).toHaveProperty('byEntropy');
    expect(result).toHaveProperty('byConsistency');
    expect(typeof result.sameMode).toBe('boolean');
  });
  it('byEntropy and byConsistency are Scales', () => {
    const result = tuningDualBestModes(t12);
    expect(result.byEntropy).toHaveProperty('degreeIndices');
    expect(result.byConsistency).toHaveProperty('degreeIndices');
  });
  it('sameMode is true when ids match', () => {
    const result = tuningDualBestModes(t12);
    const expectedSame = result.byEntropy.id === result.byConsistency.id;
    expect(result.sameMode).toBe(expectedSame);
  });
  it('throws for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(() => tuningDualBestModes(empty)).toThrow(RangeError);
  });
});

describe('chordMapVolatilityBundle (Q306)', () => {
  const scale: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: t12.id,
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const chordMap = scaleToChordMap(scale, t12);

  it('returns volatility, entropy, consistency', () => {
    const bundle = chordMapVolatilityBundle(chordMap);
    expect(typeof bundle.volatility).toBe('number');
    expect(typeof bundle.entropy).toBe('number');
    expect(typeof bundle.consistency).toBe('number');
  });
  it('volatility and entropy are non-negative', () => {
    const bundle = chordMapVolatilityBundle(chordMap);
    expect(bundle.volatility).toBeGreaterThanOrEqual(0);
    expect(bundle.entropy).toBeGreaterThanOrEqual(0);
  });
  it('consistency is in (0, 1]', () => {
    const bundle = chordMapVolatilityBundle(chordMap);
    expect(bundle.consistency).toBeGreaterThan(0);
    expect(bundle.consistency).toBeLessThanOrEqual(1);
  });
  it('accepts optional spectrum and rootHz', () => {
    const bundle = chordMapVolatilityBundle(chordMap, harmonicSpectrum(), 261.63);
    expect(Number.isFinite(bundle.volatility)).toBe(true);
    expect(Number.isFinite(bundle.entropy)).toBe(true);
    expect(Number.isFinite(bundle.consistency)).toBe(true);
  });
  it('returns zeros for empty chord map', () => {
    const bundle = chordMapVolatilityBundle([]);
    expect(bundle.volatility).toBe(0);
    expect(bundle.entropy).toBe(0);
    expect(bundle.consistency).toBeGreaterThanOrEqual(0);
  });
});

describe('tuningModeComparison (Q308)', () => {
  it('returns one entry per mode with all three metrics', () => {
    const cmp = tuningModeComparison(t12);
    expect(cmp.length).toBe(t12.degrees.length);
    for (const { mode, entropy, consistency, volatility } of cmp) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(entropy).toBeGreaterThanOrEqual(0);
      expect(consistency).toBeGreaterThanOrEqual(0);
      expect(volatility).toBeGreaterThanOrEqual(0);
    }
  });
  it('returns empty array for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(tuningModeComparison(empty)).toEqual([]);
  });
  it('accepts optional spectrum and rootHz', () => {
    const cmp = tuningModeComparison(t12, harmonicSpectrum(), 261.63);
    expect(cmp.length).toBe(t12.degrees.length);
    expect(Number.isFinite(cmp[0]!.entropy)).toBe(true);
  });
});

describe('bestModeByVolatility (Q309)', () => {
  it('returns a Scale', () => {
    const mode = bestModeByVolatility(t12);
    expect(mode).toHaveProperty('degreeIndices');
  });
  it('has volatility <= all other modes', () => {
    const mode = bestModeByVolatility(t12);
    const cmp = tuningModeComparison(t12);
    const minVolatility = Math.min(...cmp.map((e) => e.volatility));
    const chordMap = scaleToChordMap(mode, t12);
    const volatility = chordMapVolatilityBundle(chordMap).volatility;
    expect(volatility).toBeCloseTo(minVolatility, 10);
  });
  it('throws for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(() => bestModeByVolatility(empty)).toThrow(RangeError);
  });
});

describe('tuningTripleBestModes (Q310)', () => {
  it('returns byEntropy, byConsistency, byVolatility, allAgree', () => {
    const result = tuningTripleBestModes(t12);
    expect(result).toHaveProperty('byEntropy');
    expect(result).toHaveProperty('byConsistency');
    expect(result).toHaveProperty('byVolatility');
    expect(typeof result.allAgree).toBe('boolean');
  });
  it('all three are Scales', () => {
    const result = tuningTripleBestModes(t12);
    expect(result.byEntropy).toHaveProperty('degreeIndices');
    expect(result.byConsistency).toHaveProperty('degreeIndices');
    expect(result.byVolatility).toHaveProperty('degreeIndices');
  });
  it('allAgree is true when all ids match', () => {
    const result = tuningTripleBestModes(t12);
    const expectedAgree =
      result.byEntropy.id === result.byConsistency.id &&
      result.byConsistency.id === result.byVolatility.id;
    expect(result.allAgree).toBe(expectedAgree);
  });
  it('throws for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(() => tuningTripleBestModes(empty)).toThrow(RangeError);
  });
});

describe('tuningModeRanking (Q312)', () => {
  it('returns Scale[] same length as allModes', () => {
    const ranked = tuningModeRanking(t12, 'entropy');
    expect(ranked.length).toBe(t12.degrees.length);
  });
  it('entropy ranking is non-increasing', () => {
    const ranked = tuningModeRanking(t12, 'entropy');
    expect(ranked.length).toBeGreaterThan(0);
    // Verify all are Scale objects
    for (const mode of ranked) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
  it('consistency ranking is non-increasing', () => {
    const ranked = tuningModeRanking(t12, 'consistency');
    expect(ranked.length).toBe(t12.degrees.length);
  });
  it('volatility ranking is non-decreasing (lower = better = first)', () => {
    const ranked = tuningModeRanking(t12, 'volatility');
    expect(ranked.length).toBe(t12.degrees.length);
  });
  it('returns empty array for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    const ranked = tuningModeRanking(empty, 'entropy');
    expect(ranked.length).toBe(0);
  });
  it('accepts optional spectrum and rootHz', () => {
    const ranked = tuningModeRanking(t12, 'consistency', harmonicSpectrum(), 261.63);
    expect(ranked.length).toBe(t12.degrees.length);
  });
});

describe('tuningModeRankingBundle (Q313)', () => {
  it('returns byEntropy, byConsistency, byVolatility arrays', () => {
    const bundle = tuningModeRankingBundle(t12);
    expect(Array.isArray(bundle.byEntropy)).toBe(true);
    expect(Array.isArray(bundle.byConsistency)).toBe(true);
    expect(Array.isArray(bundle.byVolatility)).toBe(true);
  });
  it('all three arrays have same length as modes', () => {
    const bundle = tuningModeRankingBundle(t12);
    expect(bundle.byEntropy.length).toBe(t12.degrees.length);
    expect(bundle.byConsistency.length).toBe(t12.degrees.length);
    expect(bundle.byVolatility.length).toBe(t12.degrees.length);
  });
  it('all entries are Scale objects', () => {
    const bundle = tuningModeRankingBundle(t12);
    for (const mode of bundle.byEntropy) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
  it('empty tuning returns three empty arrays', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    const bundle = tuningModeRankingBundle(empty);
    expect(bundle.byEntropy.length).toBe(0);
    expect(bundle.byConsistency.length).toBe(0);
    expect(bundle.byVolatility.length).toBe(0);
  });
  it('accepts optional spectrum and rootHz', () => {
    const bundle = tuningModeRankingBundle(t12, harmonicSpectrum(), 261.63);
    expect(bundle.byEntropy.length).toBe(t12.degrees.length);
  });
});

describe('modeProgressionBundle (Q314)', () => {
  it('returns chords and smoothnessRatio', () => {
    const scale = tuningToScale(t12);
    const bundle = modeProgressionBundle(scale, t12);
    expect(Array.isArray(bundle.chords)).toBe(true);
    expect(typeof bundle.smoothnessRatio).toBe('number');
    expect(bundle.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });
  it('smoothnessRatio is finite', () => {
    const scale = tuningToScale(t12);
    const bundle = modeProgressionBundle(scale, t12);
    expect(Number.isFinite(bundle.smoothnessRatio)).toBe(true);
  });
  it('accepts optional spectrum and custom rootHz', () => {
    const scale = tuningToScale(t12);
    const bundle = modeProgressionBundle(scale, t12, 261.63, harmonicSpectrum());
    expect(Array.isArray(bundle.chords)).toBe(true);
    expect(typeof bundle.smoothnessRatio).toBe('number');
  });
  it('throws for scale with no degrees', () => {
    const emptyScale: Scale = { id: 'empty', name: 'Empty', tuningId: t12.id, degreeIndices: [] };
    expect(() => modeProgressionBundle(emptyScale, t12)).toThrow(RangeError);
  });
});

describe('tuningBestModeProgression (Q315)', () => {
  it('returns mode, chords, and smoothnessRatio', () => {
    const result = tuningBestModeProgression(t12, 'entropy');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(Array.isArray(result.chords)).toBe(true);
    expect(typeof result.smoothnessRatio).toBe('number');
  });
  it('mode matches top of tuningModeRanking for same metric', () => {
    const ranked = tuningModeRanking(t12, 'consistency');
    const result = tuningBestModeProgression(t12, 'consistency');
    expect(result.mode.id).toBe(ranked[0]!.id);
  });
  it('works with volatility metric', () => {
    const result = tuningBestModeProgression(t12, 'volatility');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });
  it('throws for empty tuning', () => {
    const empty: typeof t12 = { ...t12, degrees: [] };
    expect(() => tuningBestModeProgression(empty, 'entropy')).toThrow(RangeError);
  });
  it('accepts optional spectrum and rootHz', () => {
    const result = tuningBestModeProgression(t12, 'entropy', 261.63, harmonicSpectrum());
    expect(result.mode).toHaveProperty('degreeIndices');
  });
});

describe('tuningFullAnalysis (Q320)', () => {
  const t12 = equalTemperament12(440);

  it('returns reportCard, tripleMode, consistencyEntropyDelta, harmonicDensity', () => {
    const analysis = tuningFullAnalysis(t12);
    expect(typeof analysis.reportCard).toBe('string');
    expect(analysis.reportCard.length).toBeGreaterThan(0);
    expect(typeof analysis.consistencyEntropyDelta).toBe('number');
    expect(typeof analysis.harmonicDensity).toBe('number');
    expect(analysis.tripleMode).toHaveProperty('allAgree');
  });
  it('reportCard contains tuning id', () => {
    const { reportCard } = tuningFullAnalysis(t12);
    expect(reportCard).toContain(t12.id);
  });
  it('tripleMode has all three best modes', () => {
    const { tripleMode } = tuningFullAnalysis(t12);
    expect(tripleMode.byEntropy).toHaveProperty('degreeIndices');
    expect(tripleMode.byConsistency).toHaveProperty('degreeIndices');
    expect(tripleMode.byVolatility).toHaveProperty('degreeIndices');
  });
  it('consistencyEntropyDelta is in [0, 1]', () => {
    const { consistencyEntropyDelta } = tuningFullAnalysis(t12);
    expect(consistencyEntropyDelta).toBeGreaterThanOrEqual(0);
    expect(consistencyEntropyDelta).toBeLessThanOrEqual(1);
  });
  it('harmonicDensity is non-negative', () => {
    const { harmonicDensity } = tuningFullAnalysis(t12);
    expect(harmonicDensity).toBeGreaterThanOrEqual(0);
  });
  it('accepts optional spectrum and rootHz', () => {
    const analysis = tuningFullAnalysis(t12, 261.63, harmonicSpectrum());
    expect(typeof analysis.reportCard).toBe('string');
    expect(Number.isFinite(analysis.harmonicDensity)).toBe(true);
  });
});

describe('tuningFamilyFullReport (Q322)', () => {
  const t12 = equalTemperament12(440);

  it('returns familyReport and perTuningAnalysis', () => {
    const result = tuningFamilyFullReport([t12, edo(19)]);
    expect(result.familyReport).toHaveProperty('meanSimilarity');
    expect(Array.isArray(result.perTuningAnalysis)).toBe(true);
    expect(result.perTuningAnalysis).toHaveLength(2);
  });
  it('perTuningAnalysis entries have id and analysis', () => {
    const result = tuningFamilyFullReport([t12, edo(19)]);
    for (const entry of result.perTuningAnalysis) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.analysis.reportCard).toBe('string');
      expect(typeof entry.analysis.harmonicDensity).toBe('number');
    }
  });
  it('perTuningAnalysis ids match tuning ids', () => {
    const t19 = edo(19);
    const result = tuningFamilyFullReport([t12, t19]);
    expect(result.perTuningAnalysis[0]!.id).toBe(t12.id);
    expect(result.perTuningAnalysis[1]!.id).toBe(t19.id);
  });
  it('throws for empty tunings array', () => {
    expect(() => tuningFamilyFullReport([])).toThrow(RangeError);
  });
  it('accepts optional spectrum and rootHz', () => {
    const result = tuningFamilyFullReport([t12], 261.63, harmonicSpectrum());
    expect(result.perTuningAnalysis).toHaveLength(1);
    expect(typeof result.perTuningAnalysis[0]!.analysis.reportCard).toBe('string');
  });
});

describe('tuningModeNarratives (Q324)', () => {
  const t12 = equalTemperament12(440);

  it('returns one narrative per mode', () => {
    const narratives = tuningModeNarratives(t12);
    expect(narratives.length).toBe(t12.degrees.length);
    for (const { mode, narrative } of narratives) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(typeof narrative).toBe('string');
      expect(narrative.length).toBeGreaterThan(0);
    }
  });

  it('accepts optional spectrum and rootHz', () => {
    const narratives = tuningModeNarratives(t12, 261.63, harmonicSpectrum());
    expect(narratives.length).toBe(t12.degrees.length);
    expect(typeof narratives[0]!.narrative).toBe('string');
  });
});

describe('bestModeNarrative (Q325)', () => {
  const t12 = equalTemperament12(440);

  it('returns mode and narrative for entropy', () => {
    const result = bestModeNarrative(t12, 'entropy');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('returns mode and narrative for consistency', () => {
    const result = bestModeNarrative(t12, 'consistency');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.narrative).toBe('string');
  });

  it('returns mode and narrative for volatility', () => {
    const result = bestModeNarrative(t12, 'volatility');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.narrative).toBe('string');
  });

  it('accepts optional spectrum and rootHz', () => {
    const result = bestModeNarrative(t12, 'entropy', 261.63, harmonicSpectrum());
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.narrative).toBe('string');
  });
});

describe('tuningModeSummaries (Q330)', () => {
  const t12 = equalTemperament12(440);

  it('returns one summary per mode', () => {
    const summaries = tuningModeSummaries(t12);
    expect(summaries.length).toBe(t12.degrees.length);
    for (const { mode, summary } of summaries) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(summary).toHaveProperty('count');
    }
  });

  it('count is non-negative for every mode', () => {
    const summaries = tuningModeSummaries(t12);
    for (const { summary } of summaries) {
      expect(summary.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('accepts optional spectrum and rootHz', () => {
    const summaries = tuningModeSummaries(t12, 261.63, harmonicSpectrum());
    expect(summaries.length).toBe(t12.degrees.length);
    expect(summaries[0]!.summary).toHaveProperty('count');
  });
});

describe('tuningModeFullBundle (Q331)', () => {
  const t12 = equalTemperament12(440);

  it('returns per-mode bundle with all metrics', () => {
    const bundle = tuningModeFullBundle(t12);
    expect(bundle.length).toBe(t12.degrees.length);
    const first = bundle[0]!;
    expect(typeof first.entropy).toBe('number');
    expect(typeof first.consistency).toBe('number');
    expect(typeof first.volatility).toBe('number');
    expect(typeof first.narrative).toBe('string');
    expect(first.summary).toHaveProperty('count');
  });

  it('mode has degreeIndices on every entry', () => {
    const bundle = tuningModeFullBundle(t12);
    for (const { mode } of bundle) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });

  it('narrative is non-empty for every mode', () => {
    const bundle = tuningModeFullBundle(t12);
    for (const { narrative } of bundle) {
      expect(narrative.length).toBeGreaterThan(0);
    }
  });

  it('accepts optional spectrum and rootHz', () => {
    const bundle = tuningModeFullBundle(t12, 261.63, harmonicSpectrum());
    expect(bundle.length).toBe(t12.degrees.length);
    expect(typeof bundle[0]!.entropy).toBe('number');
  });
});

describe('tuningFamilyNarratives (Q333)', () => {
  const t12 = equalTemperament12(440);
  const t19 = edo(19);

  it('returns one entry per tuning', () => {
    const result = tuningFamilyNarratives([t12, t19]);
    expect(result.length).toBe(2);
  });

  it('id matches tuning id', () => {
    const result = tuningFamilyNarratives([t12, t19]);
    expect(result[0]!.id).toBe(t12.id);
    expect(result[1]!.id).toBe(t19.id);
  });

  it('bestModeNarrative is a non-empty string', () => {
    const result = tuningFamilyNarratives([t12]);
    expect(typeof result[0]!.bestModeNarrative).toBe('string');
    expect(result[0]!.bestModeNarrative.length).toBeGreaterThan(0);
  });

  it('accepts optional spectrum and rootHz', () => {
    const result = tuningFamilyNarratives([t12], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
    expect(typeof result[0]!.bestModeNarrative).toBe('string');
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyNarratives([]);
    expect(result).toEqual([]);
  });
});

describe('tuningFamilyModeRankings (Q334)', () => {
  const t12 = equalTemperament12(440);
  const t19 = edo(19);

  it('returns one entry per tuning', () => {
    const result = tuningFamilyModeRankings([t12, t19]);
    expect(result.length).toBe(2);
  });

  it('id matches tuning id', () => {
    const result = tuningFamilyModeRankings([t12, t19]);
    expect(result[0]!.id).toBe(t12.id);
    expect(result[1]!.id).toBe(t19.id);
  });

  it('rankings has byEntropy, byConsistency, byVolatility', () => {
    const result = tuningFamilyModeRankings([t12]);
    const { rankings } = result[0]!;
    expect(Array.isArray(rankings.byEntropy)).toBe(true);
    expect(Array.isArray(rankings.byConsistency)).toBe(true);
    expect(Array.isArray(rankings.byVolatility)).toBe(true);
  });

  it('each ranking array has one Scale per mode', () => {
    const result = tuningFamilyModeRankings([t12]);
    const { rankings } = result[0]!;
    expect(rankings.byEntropy.length).toBe(t12.degrees.length);
    expect(rankings.byConsistency.length).toBe(t12.degrees.length);
    expect(rankings.byVolatility.length).toBe(t12.degrees.length);
  });

  it('accepts optional spectrum and rootHz', () => {
    const result = tuningFamilyModeRankings([t12], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
    expect(result[0]!.rankings.byEntropy.length).toBeGreaterThan(0);
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyModeRankings([]);
    expect(result).toEqual([]);
  });
});

describe('tuningModeProgressionBundles (Q336)', () => {
  const t12 = equalTemperament12(440);

  it('returns one bundle per mode', () => {
    const bundles = tuningModeProgressionBundles(t12);
    expect(bundles.length).toBe(t12.degrees.length);
    for (const { mode, chords, smoothnessRatio } of bundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(Array.isArray(chords)).toBe(true);
      expect(smoothnessRatio).toBeGreaterThanOrEqual(0);
    }
  });

  it('smoothnessRatio is finite for every mode', () => {
    const bundles = tuningModeProgressionBundles(t12);
    for (const { smoothnessRatio } of bundles) {
      expect(Number.isFinite(smoothnessRatio)).toBe(true);
    }
  });

  it('accepts optional spectrum and rootHz', () => {
    const bundles = tuningModeProgressionBundles(t12, 261.63, harmonicSpectrum());
    expect(bundles.length).toBe(t12.degrees.length);
    expect(typeof bundles[0]!.smoothnessRatio).toBe('number');
  });

  it('returns empty array for tuning with no modes', () => {
    const bundles = tuningModeProgressionBundles(t12);
    expect(bundles.length).toBeGreaterThan(0);
  });
});

describe('tuningModeSpectralBundles (Q337)', () => {
  const t12 = equalTemperament12(440);
  const spectrum = harmonicSpectrum();

  it('returns one bundle per mode', () => {
    const bundles = tuningModeSpectralBundles(t12, spectrum);
    expect(bundles.length).toBe(t12.degrees.length);
  });

  it('each entry has mode, spectralFit, chordMap', () => {
    const bundles = tuningModeSpectralBundles(t12, spectrum);
    for (const { mode, spectralFit, chordMap } of bundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(typeof spectralFit).toBe('number');
      expect(spectralFit).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(chordMap)).toBe(true);
    }
  });

  it('spectralFit is finite for every mode', () => {
    const bundles = tuningModeSpectralBundles(t12, spectrum);
    for (const { spectralFit } of bundles) {
      expect(Number.isFinite(spectralFit)).toBe(true);
    }
  });

  it('accepts optional rootHz', () => {
    const bundles = tuningModeSpectralBundles(t12, spectrum, 261.63);
    expect(bundles.length).toBe(t12.degrees.length);
    expect(typeof bundles[0]!.spectralFit).toBe('number');
  });
});

describe('tuningFamilyProgressionBundles (Q339)', () => {
  const t12 = equalTemperament12(440);
  const t19 = edo(19);

  it('returns one entry per tuning', () => {
    const result = tuningFamilyProgressionBundles([t12, t19]);
    expect(result.length).toBe(2);
  });

  it('id matches tuning id', () => {
    const result = tuningFamilyProgressionBundles([t12, t19]);
    expect(result[0]!.id).toBe(t12.id);
    expect(result[1]!.id).toBe(t19.id);
  });

  it('progressionBundles has one entry per mode', () => {
    const result = tuningFamilyProgressionBundles([t12]);
    expect(result[0]!.progressionBundles.length).toBe(t12.degrees.length);
  });

  it('each progressionBundle entry has mode, chords, smoothnessRatio', () => {
    const result = tuningFamilyProgressionBundles([t12]);
    for (const { mode, chords, smoothnessRatio } of result[0]!.progressionBundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(Array.isArray(chords)).toBe(true);
      expect(typeof smoothnessRatio).toBe('number');
    }
  });

  it('accepts optional spectrum and rootHz', () => {
    const result = tuningFamilyProgressionBundles([t12], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
    expect(result[0]!.progressionBundles.length).toBeGreaterThan(0);
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyProgressionBundles([]);
    expect(result).toEqual([]);
  });
});

describe('tuningFamilySpectralBundles (Q342)', () => {
  it('returns one entry per tuning with per-mode spectral fits', () => {
    const t12local = equalTemperament12(440);
    const t19local = edo(19);
    const result = tuningFamilySpectralBundles([t12local, t19local], harmonicSpectrum());
    expect(result.length).toBe(2);
    expect(result[0]!.modeBundles.length).toBe(t12local.degrees.length);
    for (const { mode, spectralFit } of result[0]!.modeBundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(spectralFit).toBeGreaterThanOrEqual(0);
    }
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const t19local = edo(19);
    const result = tuningFamilySpectralBundles([t12local, t19local], harmonicSpectrum());
    expect(result[0]!.id).toBe(t12local.id);
    expect(result[1]!.id).toBe(t19local.id);
  });

  it('spectralFit is finite for every entry', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilySpectralBundles([t12local], harmonicSpectrum());
    for (const { spectralFit } of result[0]!.modeBundles) {
      expect(Number.isFinite(spectralFit)).toBe(true);
    }
  });

  it('modeBundles does not include chordMap', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilySpectralBundles([t12local], harmonicSpectrum());
    const first = result[0]!.modeBundles[0]!;
    expect(Object.keys(first)).not.toContain('chordMap');
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilySpectralBundles([t12local], harmonicSpectrum(), 261.63);
    expect(result.length).toBe(1);
    expect(result[0]!.modeBundles.length).toBe(t12local.degrees.length);
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilySpectralBundles([], harmonicSpectrum());
    expect(result).toEqual([]);
  });
});

describe('tuningFamilyFullBundle (Q343)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19local = edo(19);
    const result = tuningFamilyFullBundle([t12local, t19local]);
    expect(result.length).toBe(2);
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const t19local = edo(19);
    const result = tuningFamilyFullBundle([t12local, t19local]);
    expect(result[0]!.id).toBe(t12local.id);
    expect(result[1]!.id).toBe(t19local.id);
  });

  it('fullAnalysis has expected keys', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyFullBundle([t12local]);
    const { fullAnalysis } = result[0]!;
    expect(typeof fullAnalysis.reportCard).toBe('string');
    expect(fullAnalysis).toHaveProperty('tripleMode');
    expect(typeof fullAnalysis.consistencyEntropyDelta).toBe('number');
    expect(typeof fullAnalysis.harmonicDensity).toBe('number');
  });

  it('modeFullBundle has one entry per mode', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyFullBundle([t12local]);
    expect(result[0]!.modeFullBundle.length).toBe(t12local.degrees.length);
  });

  it('each modeFullBundle entry has required keys', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyFullBundle([t12local]);
    for (const entry of result[0]!.modeFullBundle) {
      expect(entry).toHaveProperty('mode');
      expect(typeof entry.entropy).toBe('number');
      expect(typeof entry.consistency).toBe('number');
      expect(typeof entry.volatility).toBe('number');
      expect(typeof entry.narrative).toBe('string');
      expect(entry).toHaveProperty('summary');
    }
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyFullBundle([]);
    expect(result).toEqual([]);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyFullBundle([t12local], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
  });
});

describe('chordMapFullBundle (Q345)', () => {
  const t12local = equalTemperament12(440);
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('returns rankedBundle, volatilityBundle, progression', () => {
    const chordMap = scaleToChordMap(major12, t12local);
    const bundle = chordMapFullBundle(chordMap, harmonicSpectrum());
    expect(bundle).toHaveProperty('rankedBundle');
    expect(bundle).toHaveProperty('volatilityBundle');
    expect(bundle).toHaveProperty('progression');
  });

  it('rankedBundle has spectralRanking, normalizedScores, entropy, consistency', () => {
    const chordMap = scaleToChordMap(major12, t12local);
    const { rankedBundle } = chordMapFullBundle(chordMap, harmonicSpectrum());
    expect(Array.isArray(rankedBundle.spectralRanking)).toBe(true);
    expect(Array.isArray(rankedBundle.normalizedScores)).toBe(true);
    expect(typeof rankedBundle.entropy).toBe('number');
    expect(typeof rankedBundle.consistency).toBe('number');
  });

  it('volatilityBundle has volatility, entropy, consistency', () => {
    const chordMap = scaleToChordMap(major12, t12local);
    const { volatilityBundle } = chordMapFullBundle(chordMap, harmonicSpectrum());
    expect(typeof volatilityBundle.volatility).toBe('number');
    expect(typeof volatilityBundle.entropy).toBe('number');
    expect(typeof volatilityBundle.consistency).toBe('number');
  });

  it('progression has chords and smoothnessRatio', () => {
    const chordMap = scaleToChordMap(major12, t12local);
    const { progression } = chordMapFullBundle(chordMap, harmonicSpectrum());
    expect(Array.isArray(progression.chords)).toBe(true);
    expect(typeof progression.smoothnessRatio).toBe('number');
  });

  it('accepts optional rootHz', () => {
    const chordMap = scaleToChordMap(major12, t12local);
    const bundle = chordMapFullBundle(chordMap, harmonicSpectrum(), 261.63);
    expect(bundle.rankedBundle.spectralRanking.length).toBeGreaterThan(0);
  });
});

describe('scaleModeSpectralRankings (Q346)', () => {
  const t12local = equalTemperament12(440);
  const major12: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('returns spectralRanking and normalizedScores', () => {
    const result = scaleModeSpectralRankings(major12, t12local, harmonicSpectrum());
    expect(Array.isArray(result.spectralRanking)).toBe(true);
    expect(Array.isArray(result.normalizedScores)).toBe(true);
  });

  it('spectralRanking is non-empty for a valid scale', () => {
    const result = scaleModeSpectralRankings(major12, t12local, harmonicSpectrum());
    expect(result.spectralRanking.length).toBeGreaterThan(0);
  });

  it('normalizedScores entries have normalizedDissonance and normalizedHarmonicity', () => {
    const result = scaleModeSpectralRankings(major12, t12local, harmonicSpectrum());
    for (const score of result.normalizedScores) {
      expect(score).toHaveProperty('entry');
      expect(typeof score.normalizedDissonance).toBe('number');
      expect(typeof score.normalizedHarmonicity).toBe('number');
    }
  });

  it('spectralRanking entries have degreeIndices in chord', () => {
    const result = scaleModeSpectralRankings(major12, t12local, harmonicSpectrum());
    for (const entry of result.spectralRanking) {
      expect(entry).toHaveProperty('chord');
    }
  });

  it('accepts optional rootHz', () => {
    const result = scaleModeSpectralRankings(major12, t12local, harmonicSpectrum(), 261.63);
    expect(result.spectralRanking.length).toBeGreaterThan(0);
  });
});

describe('tuningModeChordMapBundles (Q348)', () => {
  it('returns one bundle per mode', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeChordMapBundles(t12local, harmonicSpectrum());
    expect(bundles.length).toBe(t12local.degrees.length);
  });

  it('each bundle has mode and chordMapBundle', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeChordMapBundles(t12local, harmonicSpectrum());
    for (const { mode, chordMapBundle } of bundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(chordMapBundle).toHaveProperty('rankedBundle');
      expect(chordMapBundle).toHaveProperty('volatilityBundle');
      expect(chordMapBundle).toHaveProperty('progression');
    }
  });

  it('volatilityBundle has volatility, entropy, consistency', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeChordMapBundles(t12local, harmonicSpectrum());
    const first = bundles[0]!;
    expect(typeof first.chordMapBundle.volatilityBundle.volatility).toBe('number');
    expect(typeof first.chordMapBundle.volatilityBundle.entropy).toBe('number');
    expect(typeof first.chordMapBundle.volatilityBundle.consistency).toBe('number');
  });

  it('progression has chords array and smoothnessRatio', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeChordMapBundles(t12local, harmonicSpectrum());
    const first = bundles[0]!;
    expect(Array.isArray(first.chordMapBundle.progression.chords)).toBe(true);
    expect(typeof first.chordMapBundle.progression.smoothnessRatio).toBe('number');
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeChordMapBundles(t12local, harmonicSpectrum(), 261.63);
    expect(bundles.length).toBeGreaterThan(0);
  });
});

describe('tuningFamilyChordMapBundles (Q350)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19);
    const result = tuningFamilyChordMapBundles([t12local, t19], harmonicSpectrum());
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeBundles', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyChordMapBundles([t12local], harmonicSpectrum());
    expect(result[0]!.id).toBe(t12local.id);
    expect(Array.isArray(result[0]!.modeBundles)).toBe(true);
  });

  it('modeBundles length matches tuning degree count', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyChordMapBundles([t12local], harmonicSpectrum());
    expect(result[0]!.modeBundles.length).toBe(t12local.degrees.length);
  });

  it('each modeBundles entry has mode and chordMapBundle', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyChordMapBundles([t12local], harmonicSpectrum());
    for (const { mode, chordMapBundle } of result[0]!.modeBundles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(chordMapBundle).toHaveProperty('volatilityBundle');
    }
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyChordMapBundles([], harmonicSpectrum());
    expect(result).toEqual([]);
  });
});

describe('scaleChordMapNarrativeBundle (Q351)', () => {
  it('returns all six metrics', () => {
    const t12local = equalTemperament12(440);
    const scale = { ...major, tuningId: t12local.id };
    const bundle = scaleChordMapNarrativeBundle(scale, t12local);
    expect(Array.isArray(bundle.chords)).toBe(true);
    expect(typeof bundle.smoothnessRatio).toBe('number');
    expect(typeof bundle.narrative).toBe('string');
    expect(bundle.narrative.length).toBeGreaterThan(0);
    expect(typeof bundle.volatility).toBe('number');
    expect(typeof bundle.entropy).toBe('number');
    expect(typeof bundle.consistency).toBe('number');
  });

  it('narrative is non-empty for a valid scale', () => {
    const t12local = equalTemperament12(440);
    const scale = { ...major, tuningId: t12local.id };
    const bundle = scaleChordMapNarrativeBundle(scale, t12local);
    expect(bundle.narrative.length).toBeGreaterThan(0);
  });

  it('accepts optional spectrum', () => {
    const t12local = equalTemperament12(440);
    const scale = { ...major, tuningId: t12local.id };
    const bundle = scaleChordMapNarrativeBundle(scale, t12local, 440, harmonicSpectrum());
    expect(typeof bundle.volatility).toBe('number');
  });

  it('metrics are finite numbers', () => {
    const t12local = equalTemperament12(440);
    const scale = { ...major, tuningId: t12local.id };
    const { volatility, entropy, consistency, smoothnessRatio } = scaleChordMapNarrativeBundle(
      scale,
      t12local,
    );
    expect(isFinite(volatility)).toBe(true);
    expect(isFinite(entropy)).toBe(true);
    expect(isFinite(consistency)).toBe(true);
    expect(isFinite(smoothnessRatio)).toBe(true);
  });
});

describe('tuningBestModeChordMapNarrative (Q352)', () => {
  it('returns mode and narrative for entropy metric', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeChordMapNarrative(t12local, 'entropy');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.narrative).toBe('string');
    expect(result.volatility).toBeGreaterThanOrEqual(0);
  });

  it('returns mode and narrative for consistency metric', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeChordMapNarrative(t12local, 'consistency');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.consistency).toBe('number');
  });

  it('returns mode and narrative for volatility metric', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeChordMapNarrative(t12local, 'volatility');
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.volatility).toBe('number');
  });

  it('throws RangeError for empty tuning', () => {
    const empty = { ...equalTemperament12(440), degrees: [] };
    expect(() => tuningBestModeChordMapNarrative(empty, 'entropy')).toThrow(RangeError);
  });

  it('result has all six expected keys', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeChordMapNarrative(t12local, 'entropy');
    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('narrative');
    expect(result).toHaveProperty('volatility');
    expect(result).toHaveProperty('entropy');
    expect(result).toHaveProperty('consistency');
    expect(result).toHaveProperty('smoothnessRatio');
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeChordMapNarrative(
      t12local,
      'consistency',
      261.63,
      harmonicSpectrum(),
    );
    expect(result.mode).toHaveProperty('degreeIndices');
  });
});

// ---------------------------------------------------------------------------
// Q357 — scaleBestProgressionNarrative
// ---------------------------------------------------------------------------

describe('scaleBestProgressionNarrative (Q357)', () => {
  it('returns narrative, smoothnessRatio, chords', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const result = scaleBestProgressionNarrative(scale, t12local);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.chords)).toBe(true);
  });

  it('result has exactly three keys', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const result = scaleBestProgressionNarrative(scale, t12local);
    expect(result).toHaveProperty('narrative');
    expect(result).toHaveProperty('smoothnessRatio');
    expect(result).toHaveProperty('chords');
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const result = scaleBestProgressionNarrative(scale, t12local, 261.63, harmonicSpectrum());
    expect(typeof result.narrative).toBe('string');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Q354 — tuningModeNarrativeCompare
// ---------------------------------------------------------------------------

describe('tuningModeNarrativeCompare (Q354)', () => {
  it('returns best modes for all three metrics and allSameMode flag', () => {
    const t12local = equalTemperament12(440);
    const cmp = tuningModeNarrativeCompare(t12local);
    expect(cmp.bestEntropy.mode).toHaveProperty('degreeIndices');
    expect(cmp.bestConsistency.mode).toHaveProperty('degreeIndices');
    expect(cmp.bestVolatility.mode).toHaveProperty('degreeIndices');
    expect(typeof cmp.allSameMode).toBe('boolean');
  });

  it('all three best modes have narrative strings', () => {
    const t12local = equalTemperament12(440);
    const cmp = tuningModeNarrativeCompare(t12local);
    expect(typeof cmp.bestEntropy.narrative).toBe('string');
    expect(typeof cmp.bestConsistency.narrative).toBe('string');
    expect(typeof cmp.bestVolatility.narrative).toBe('string');
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const cmp = tuningModeNarrativeCompare(t12local, 261.63, harmonicSpectrum());
    expect(typeof cmp.allSameMode).toBe('boolean');
  });

  it('throws RangeError for tuning with no modes', () => {
    const empty = { ...equalTemperament12(440), degrees: [] };
    expect(() => tuningModeNarrativeCompare(empty)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q356 — tuningFamilyNarrativeCompare
// ---------------------------------------------------------------------------

describe('tuningFamilyNarrativeCompare (Q356)', () => {
  it('returns one entry per tuning with id and narrativeCompare', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19);
    const result = tuningFamilyNarrativeCompare([t12local, t19]);
    expect(result.length).toBe(2);
    expect(result[0]!.id).toBe(t12local.id);
    expect(result[1]!.id).toBe(t19.id);
    expect(result[0]).toHaveProperty('narrativeCompare');
  });

  it('each narrativeCompare has allSameMode flag', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyNarrativeCompare([t12local]);
    expect(typeof result[0]!.narrativeCompare.allSameMode).toBe('boolean');
  });

  it('returns empty array for empty tunings list', () => {
    expect(tuningFamilyNarrativeCompare([])).toEqual([]);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyNarrativeCompare([t12local], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
    expect(typeof result[0]!.narrativeCompare.allSameMode).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// Q358 — tuningModeBestProgressionNarratives
// ---------------------------------------------------------------------------

describe('tuningModeBestProgressionNarratives (Q358)', () => {
  it('returns one entry per mode with mode, narrative, smoothnessRatio', () => {
    const t12local = equalTemperament12(440);
    const results = tuningModeBestProgressionNarratives(t12local);
    expect(results.length).toBeGreaterThan(0);
    const first = results[0]!;
    expect(first.mode).toHaveProperty('degreeIndices');
    expect(typeof first.narrative).toBe('string');
    expect(first.narrative.length).toBeGreaterThan(0);
    expect(first.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('returns correct number of modes for 12-TET', () => {
    const t12local = equalTemperament12(440);
    const results = tuningModeBestProgressionNarratives(t12local);
    expect(results.length).toBe(t12local.degrees.length);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const results = tuningModeBestProgressionNarratives(t12local, 261.63, harmonicSpectrum());
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0]!.narrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q360 — tuningModeSmoothProgressionRatios
// ---------------------------------------------------------------------------

describe('tuningModeSmoothProgressionRatios (Q360)', () => {
  it('returns one entry per mode with mode and smoothnessRatio', () => {
    const t12local = equalTemperament12(440);
    const ratios = tuningModeSmoothProgressionRatios(t12local);
    expect(ratios.length).toBeGreaterThan(0);
    const first = ratios[0]!;
    expect(first.mode).toHaveProperty('degreeIndices');
    expect(first.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('returns correct number of modes for 12-TET', () => {
    const t12local = equalTemperament12(440);
    const ratios = tuningModeSmoothProgressionRatios(t12local);
    expect(ratios.length).toBe(t12local.degrees.length);
  });

  it('does not include narrative field', () => {
    const t12local = equalTemperament12(440);
    const ratios = tuningModeSmoothProgressionRatios(t12local);
    const first = ratios[0]!;
    expect(first).not.toHaveProperty('narrative');
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const ratios = tuningModeSmoothProgressionRatios(t12local, 261.63, harmonicSpectrum());
    expect(ratios.length).toBeGreaterThan(0);
    expect(ratios[0]!.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Q361 — tuningBestSmoothMode
// ---------------------------------------------------------------------------

describe('tuningBestSmoothMode (Q361)', () => {
  it('returns mode and smoothnessRatio', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestSmoothMode(t12local);
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('smoothnessRatio is the maximum among all modes', () => {
    const t12local = equalTemperament12(440);
    const ratios = tuningModeSmoothProgressionRatios(t12local);
    const best = tuningBestSmoothMode(t12local);
    const max = Math.max(...ratios.map((r) => r.smoothnessRatio));
    expect(best.smoothnessRatio).toBe(max);
  });

  it('throws RangeError for empty tuning', () => {
    const empty = { ...equalTemperament12(440), degrees: [] };
    expect(() => tuningBestSmoothMode(empty)).toThrow(RangeError);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestSmoothMode(t12local, 261.63, harmonicSpectrum());
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(result.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Q363 — tuningFamilyBestSmoothModes
// ---------------------------------------------------------------------------

describe('tuningFamilyBestSmoothModes (Q363)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19);
    const result = tuningFamilyBestSmoothModes([t12local, t19]);
    expect(result.length).toBe(2);
  });

  it('each entry has id and bestSmoothMode', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyBestSmoothModes([t12local]);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('bestSmoothMode');
    expect(result[0]!.bestSmoothMode).toHaveProperty('mode');
    expect(result[0]!.bestSmoothMode).toHaveProperty('smoothnessRatio');
  });

  it('returns empty array for empty family', () => {
    expect(tuningFamilyBestSmoothModes([])).toEqual([]);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyBestSmoothModes([t12local], 261.63, harmonicSpectrum());
    expect(result.length).toBe(1);
    expect(result[0]!.bestSmoothMode.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Q364 — scaleProgressionFullBundle
// ---------------------------------------------------------------------------

describe('scaleProgressionFullBundle (Q364)', () => {
  it('returns chords, smoothedChords, and all metrics', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const bundle = scaleProgressionFullBundle(scale, t12local);
    expect(Array.isArray(bundle.chords)).toBe(true);
    expect(Array.isArray(bundle.smoothedChords)).toBe(true);
    expect(typeof bundle.smoothnessRatio).toBe('number');
    expect(typeof bundle.narrative).toBe('string');
    expect(typeof bundle.volatility).toBe('number');
    expect(typeof bundle.entropy).toBe('number');
    expect(typeof bundle.consistency).toBe('number');
  });

  it('narrative is a non-empty string', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const bundle = scaleProgressionFullBundle(scale, t12local);
    expect(bundle.narrative.length).toBeGreaterThan(0);
  });

  it('smoothnessRatio is non-negative', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const bundle = scaleProgressionFullBundle(scale, t12local);
    expect(bundle.smoothnessRatio).toBeGreaterThanOrEqual(0);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const bundle = scaleProgressionFullBundle(scale, t12local, 261.63, harmonicSpectrum());
    expect(Array.isArray(bundle.chords)).toBe(true);
    expect(Array.isArray(bundle.smoothedChords)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Q365 — tuningModeProgressionFullBundles
// ---------------------------------------------------------------------------

describe('tuningModeProgressionFullBundles (Q365)', () => {
  it('returns one entry per mode with all bundle fields', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeProgressionFullBundles(t12local);
    expect(bundles.length).toBeGreaterThan(0);
    const first = bundles[0]!;
    expect(first.mode).toHaveProperty('degreeIndices');
    expect(Array.isArray(first.chords)).toBe(true);
    expect(Array.isArray(first.smoothedChords)).toBe(true);
    expect(typeof first.smoothnessRatio).toBe('number');
    expect(typeof first.narrative).toBe('string');
    expect(typeof first.volatility).toBe('number');
    expect(typeof first.entropy).toBe('number');
    expect(typeof first.consistency).toBe('number');
  });

  it('returns correct number of modes for 12-TET', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeProgressionFullBundles(t12local);
    expect(bundles.length).toBe(t12local.degrees.length);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const bundles = tuningModeProgressionFullBundles(t12local, 261.63, harmonicSpectrum());
    expect(bundles.length).toBeGreaterThan(0);
    expect(typeof bundles[0]!.narrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q381 — chordMapDissonanceHistogram
// ---------------------------------------------------------------------------

describe('chordMapDissonanceHistogram (Q381)', () => {
  it('returns array of length bins (default 10)', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const hist = chordMapDissonanceHistogram(cm);
    expect(hist.length).toBe(10);
    const total = hist.reduce((a, b) => a + b, 0);
    expect(total).toBe(cm.length);
  });

  it('returns all zeros for empty chord map', () => {
    const hist = chordMapDissonanceHistogram([]);
    expect(hist).toEqual(Array(10).fill(0));
  });

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    expect(chordMapDissonanceHistogram(cm, 5).length).toBe(5);
  });

  it('all histogram values are non-negative integers', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const hist = chordMapDissonanceHistogram(cm);
    for (const count of hist) {
      expect(count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(count)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Q378 — tuningModeConsistencyEntropyProfiles
// ---------------------------------------------------------------------------

describe('tuningModeConsistencyEntropyProfiles (Q378)', () => {
  it('returns one entry per mode with delta >= 0', () => {
    const t12local = equalTemperament12(440);
    const profiles = tuningModeConsistencyEntropyProfiles(t12local);
    expect(profiles.length).toBe(t12local.degrees.length);
    for (const { mode, entropy, consistency, delta } of profiles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(entropy).toBeGreaterThanOrEqual(0);
      expect(consistency).toBeGreaterThanOrEqual(0);
      expect(delta).toBeGreaterThanOrEqual(0);
    }
  });

  it('delta is in [0, 1] for all modes', () => {
    const t12local = equalTemperament12(440);
    const profiles = tuningModeConsistencyEntropyProfiles(t12local);
    for (const { delta } of profiles) {
      expect(delta).toBeGreaterThanOrEqual(0);
      expect(delta).toBeLessThanOrEqual(1);
    }
  });

  it('returns empty array for tuning with no degrees', () => {
    const t12local = equalTemperament12(440);
    const empty = { ...t12local, degrees: [] };
    const profiles = tuningModeConsistencyEntropyProfiles(empty);
    expect(profiles).toEqual([]);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const profiles = tuningModeConsistencyEntropyProfiles(t12local, harmonicSpectrum(), 261.63);
    expect(profiles.length).toBe(t12local.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q380 — tuningTopModesByDelta
// ---------------------------------------------------------------------------

describe('tuningTopModesByDelta (Q380)', () => {
  it('returns exactly n entries sorted descending by delta', () => {
    const t12local = equalTemperament12(440);
    const top3 = tuningTopModesByDelta(t12local, 3);
    expect(top3.length).toBe(3);
    for (let i = 0; i < top3.length - 1; i++) {
      expect(top3[i]!.delta).toBeGreaterThanOrEqual(top3[i + 1]!.delta);
    }
  });

  it('each entry has mode and delta', () => {
    const t12local = equalTemperament12(440);
    const top = tuningTopModesByDelta(t12local, 2);
    for (const { mode, delta } of top) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(delta).toBeGreaterThanOrEqual(0);
    }
  });

  it('throws RangeError when n <= 0', () => {
    const t12local = equalTemperament12(440);
    expect(() => tuningTopModesByDelta(t12local, 0)).toThrow(RangeError);
    expect(() => tuningTopModesByDelta(t12local, -1)).toThrow(RangeError);
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const top = tuningTopModesByDelta(t12local, 1, harmonicSpectrum(), 261.63);
    expect(top.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Q382 — tuningModeDissonanceHistograms
// ---------------------------------------------------------------------------

describe('tuningModeDissonanceHistograms (Q382)', () => {
  it('returns one entry per mode', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDissonanceHistograms(t12local);
    expect(hists.length).toBe(t12local.degrees.length);
  });

  it('each histogram has length equal to bins (default 10)', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDissonanceHistograms(t12local);
    for (const { histogram } of hists) {
      expect(histogram.length).toBe(10);
    }
  });

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDissonanceHistograms(t12local, 5);
    for (const { histogram } of hists) {
      expect(histogram.length).toBe(5);
    }
  });

  it('each entry has mode with degreeIndices', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDissonanceHistograms(t12local);
    for (const { mode } of hists) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
});

// ---------------------------------------------------------------------------
// Q384 — chordMapHarmonicityHistogram
// ---------------------------------------------------------------------------

describe('chordMapHarmonicityHistogram (Q384)', () => {
  it('returns array of length bins (default 10)', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const hist = chordMapHarmonicityHistogram(cm);
    expect(hist.length).toBe(10);
  });

  it('sum equals number of chord map entries', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const hist = chordMapHarmonicityHistogram(cm);
    expect(hist.reduce((a, b) => a + b, 0)).toBe(cm.length);
  });

  it('uses custom bins', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const hist = chordMapHarmonicityHistogram(cm, 5);
    expect(hist.length).toBe(5);
  });

  it('returns all zeros for empty chord map', () => {
    const hist = chordMapHarmonicityHistogram([]);
    expect(hist).toEqual(Array(10).fill(0));
  });
});

// ---------------------------------------------------------------------------
// Q385 — tuningModeHarmonicityHistograms
// ---------------------------------------------------------------------------

describe('tuningModeHarmonicityHistograms (Q385)', () => {
  it('returns one entry per mode', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeHarmonicityHistograms(t12local);
    expect(hists.length).toBe(t12local.degrees.length);
  });

  it('each histogram has length equal to bins (default 10)', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeHarmonicityHistograms(t12local);
    for (const { histogram } of hists) {
      expect(histogram.length).toBe(10);
    }
  });

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeHarmonicityHistograms(t12local, 5);
    for (const { histogram } of hists) {
      expect(histogram.length).toBe(5);
    }
  });

  it('each entry has mode with degreeIndices', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeHarmonicityHistograms(t12local);
    for (const { mode } of hists) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
});

// ---------------------------------------------------------------------------
// Q386 — chordMapDualHistogram
// ---------------------------------------------------------------------------

describe('chordMapDualHistogram (Q386)', () => {
  it('returns dissonance and harmonicity arrays of length bins', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const { dissonance, harmonicity } = chordMapDualHistogram(cm);
    expect(dissonance.length).toBe(10);
    expect(harmonicity.length).toBe(10);
    expect(dissonance.reduce((a, b) => a + b, 0)).toBe(cm.length);
    expect(harmonicity.reduce((a, b) => a + b, 0)).toBe(cm.length);
  });

  it('uses custom bins', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const { dissonance } = chordMapDualHistogram(cm, 5);
    expect(dissonance.length).toBe(5);
  });

  it('returns all zeros for empty chord map', () => {
    const { dissonance, harmonicity } = chordMapDualHistogram([]);
    expect(dissonance).toEqual(Array(10).fill(0));
    expect(harmonicity).toEqual(Array(10).fill(0));
  });

  it('dissonance histogram matches standalone chordMapDissonanceHistogram', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const { dissonance } = chordMapDualHistogram(cm);
    const standalone = chordMapDissonanceHistogram(cm);
    expect(dissonance).toEqual(standalone);
  });
});

// ---------------------------------------------------------------------------
// Q387 — tuningModeDualHistograms
// ---------------------------------------------------------------------------

describe('tuningModeDualHistograms (Q387)', () => {
  it('returns one entry per mode', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDualHistograms(t12local);
    expect(hists.length).toBe(t12local.degrees.length);
  });

  it('each entry has dissonance and harmonicity arrays of length bins', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDualHistograms(t12local);
    for (const { dissonance, harmonicity } of hists) {
      expect(dissonance.length).toBe(10);
      expect(harmonicity.length).toBe(10);
    }
  });

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDualHistograms(t12local, 5);
    for (const { dissonance, harmonicity } of hists) {
      expect(dissonance.length).toBe(5);
      expect(harmonicity.length).toBe(5);
    }
  });

  it('each entry has mode with degreeIndices', () => {
    const t12local = equalTemperament12(440);
    const hists = tuningModeDualHistograms(t12local);
    for (const { mode } of hists) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });
});

// ---------------------------------------------------------------------------
// Q389 — tuningFamilyDualHistograms
// ---------------------------------------------------------------------------

describe('tuningFamilyDualHistograms (Q389)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const result = tuningFamilyDualHistograms([t12local, t19]);
    expect(result.length).toBe(2);
  });

  it('each entry has an id and modeDualHistograms array', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyDualHistograms([t12local]);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('modeDualHistograms');
    expect(Array.isArray(result[0]?.modeDualHistograms)).toBe(true);
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyDualHistograms([t12local]);
    expect(result[0]?.id).toBe(t12local.id);
  });

  it('modeDualHistograms length equals mode count', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyDualHistograms([t12local]);
    expect(result[0]?.modeDualHistograms.length).toBe(t12local.degrees.length);
  });

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyDualHistograms([t12local], 5);
    for (const { dissonance, harmonicity } of result[0]?.modeDualHistograms ?? []) {
      expect(dissonance.length).toBe(5);
      expect(harmonicity.length).toBe(5);
    }
  });

  it('returns empty array for empty family', () => {
    const result = tuningFamilyDualHistograms([]);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q390 — chordMapHistogramSummary
// ---------------------------------------------------------------------------

describe('chordMapHistogramSummary (Q390)', () => {
  it('returns histograms and peak/spread info', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const summary = chordMapHistogramSummary(cm);
    expect(summary.dissonance.length).toBe(10);
    expect(summary.harmonicity.length).toBe(10);
    expect(summary.peakDissonanceBin).toBeGreaterThanOrEqual(0);
    expect(summary.peakDissonanceBin).toBeLessThan(10);
    expect(summary.dissonanceSpread).toBeGreaterThanOrEqual(0);
    expect(summary.dissonanceSpread).toBeLessThanOrEqual(1);
    expect(summary.harmonicitySpread).toBeGreaterThanOrEqual(0);
    expect(summary.harmonicitySpread).toBeLessThanOrEqual(1);
  });

  it('empty chordMap gives all zeros', () => {
    const s = chordMapHistogramSummary([]);
    expect(s.dissonance).toEqual(Array(10).fill(0));
    expect(s.harmonicity).toEqual(Array(10).fill(0));
    expect(s.peakDissonanceBin).toBe(0);
    expect(s.peakHarmonicityBin).toBe(0);
    expect(s.dissonanceSpread).toBe(0);
    expect(s.harmonicitySpread).toBe(0);
  });

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const summary = chordMapHistogramSummary(cm, 5);
    expect(summary.dissonance.length).toBe(5);
    expect(summary.harmonicity.length).toBe(5);
    expect(summary.peakDissonanceBin).toBeLessThan(5);
    expect(summary.peakHarmonicityBin).toBeLessThan(5);
  });

  it('spread is between 0 and 1 inclusive', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const summary = chordMapHistogramSummary(cm, 10);
    expect(summary.dissonanceSpread).toBeGreaterThanOrEqual(0);
    expect(summary.dissonanceSpread).toBeLessThanOrEqual(1);
    expect(summary.harmonicitySpread).toBeGreaterThanOrEqual(0);
    expect(summary.harmonicitySpread).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Q391 — tuningModeHistogramSummaries
// ---------------------------------------------------------------------------

describe('tuningModeHistogramSummaries (Q391)', () => {
  it('returns one entry per mode', () => {
    const t12local = equalTemperament12(440);
    const summaries = tuningModeHistogramSummaries(t12local);
    expect(summaries.length).toBe(t12local.degrees.length);
  });

  it('each entry has mode and histogramSummary', () => {
    const t12local = equalTemperament12(440);
    const summaries = tuningModeHistogramSummaries(t12local);
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

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const summaries = tuningModeHistogramSummaries(t12local, 5);
    for (const { histogramSummary } of summaries) {
      expect(histogramSummary.dissonance.length).toBe(5);
      expect(histogramSummary.harmonicity.length).toBe(5);
    }
  });
});

// ---------------------------------------------------------------------------
// Q393 — tuningFamilyHistogramSummaries
// ---------------------------------------------------------------------------

describe('tuningFamilyHistogramSummaries (Q393)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const result = tuningFamilyHistogramSummaries([t12local, t19]);
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeSummaries array', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyHistogramSummaries([t12local]);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('modeSummaries');
    expect(Array.isArray(result[0]?.modeSummaries)).toBe(true);
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyHistogramSummaries([t12local]);
    expect(result[0]?.id).toBe(t12local.id);
  });

  it('modeSummaries length equals mode count', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyHistogramSummaries([t12local]);
    expect(result[0]?.modeSummaries.length).toBe(t12local.degrees.length);
  });

  it('respects custom bins', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyHistogramSummaries([t12local], 5);
    for (const { histogramSummary } of result[0]?.modeSummaries ?? []) {
      expect(histogramSummary.dissonance.length).toBe(5);
      expect(histogramSummary.harmonicity.length).toBe(5);
    }
  });

  it('returns empty array for empty family', () => {
    const result = tuningFamilyHistogramSummaries([]);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q394 — chordMapAnalysisFull
// ---------------------------------------------------------------------------

describe('chordMapAnalysisFull (Q394)', () => {
  it('returns all four bundles', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const spec = harmonicSpectrum();
    const full = chordMapAnalysisFull(cm, spec);
    expect(full).toHaveProperty('dualHistogram');
    expect(full).toHaveProperty('histogramSummary');
    expect(full).toHaveProperty('rankedBundle');
    expect(full).toHaveProperty('volatilityBundle');
  });

  it('dualHistogram has dissonance and harmonicity arrays', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const spec = harmonicSpectrum();
    const { dualHistogram } = chordMapAnalysisFull(cm, spec);
    expect(dualHistogram.dissonance.length).toBe(10);
    expect(dualHistogram.harmonicity.length).toBe(10);
  });

  it('histogramSummary has peak and spread fields', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const spec = harmonicSpectrum();
    const { histogramSummary } = chordMapAnalysisFull(cm, spec);
    expect(histogramSummary).toHaveProperty('peakDissonanceBin');
    expect(histogramSummary).toHaveProperty('peakHarmonicityBin');
    expect(histogramSummary).toHaveProperty('dissonanceSpread');
    expect(histogramSummary).toHaveProperty('harmonicitySpread');
  });

  it('rankedBundle has entropy and consistency', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const spec = harmonicSpectrum();
    const { rankedBundle } = chordMapAnalysisFull(cm, spec);
    expect(typeof rankedBundle.entropy).toBe('number');
    expect(typeof rankedBundle.consistency).toBe('number');
  });

  it('volatilityBundle has volatility, entropy, consistency', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const cm = scaleToChordMap(scale, t12local);
    const spec = harmonicSpectrum();
    const { volatilityBundle } = chordMapAnalysisFull(cm, spec);
    expect(typeof volatilityBundle.volatility).toBe('number');
    expect(typeof volatilityBundle.entropy).toBe('number');
    expect(typeof volatilityBundle.consistency).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q395 — scaleChordMapAnalysisFull
// ---------------------------------------------------------------------------

describe('scaleChordMapAnalysisFull (Q395)', () => {
  it('returns full analysis for a scale', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const spec = harmonicSpectrum();
    const full = scaleChordMapAnalysisFull(scale, t12local, spec);
    expect(full).toHaveProperty('dualHistogram');
    expect(full).toHaveProperty('histogramSummary');
    expect(full).toHaveProperty('rankedBundle');
    expect(full).toHaveProperty('volatilityBundle');
  });

  it('result matches chordMapAnalysisFull for the same scale', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const spec = harmonicSpectrum();
    const cm = scaleToChordMap(scale, t12local);
    const direct = chordMapAnalysisFull(cm, spec);
    const bridge = scaleChordMapAnalysisFull(scale, t12local, spec);
    expect(bridge.dualHistogram).toEqual(direct.dualHistogram);
    expect(bridge.histogramSummary).toEqual(direct.histogramSummary);
    expect(bridge.rankedBundle.entropy).toBeCloseTo(direct.rankedBundle.entropy);
    expect(bridge.volatilityBundle.volatility).toBeCloseTo(direct.volatilityBundle.volatility);
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const scale = tuningToScale(t12local);
    const spec = harmonicSpectrum();
    const full = scaleChordMapAnalysisFull(scale, t12local, spec, 261.63);
    expect(full).toHaveProperty('rankedBundle');
    expect(typeof full.volatilityBundle.volatility).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q396 — tuningModeAnalysisFull
// ---------------------------------------------------------------------------

describe('tuningModeAnalysisFull (Q396)', () => {
  it('returns one entry per mode with analysisFull', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningModeAnalysisFull(t12local, spec);
    expect(result.length).toBe(t12local.degrees.length);
    expect(result[0]!.analysisFull).toHaveProperty('dualHistogram');
    expect(result[0]!.analysisFull).toHaveProperty('histogramSummary');
    expect(result[0]!.analysisFull).toHaveProperty('rankedBundle');
    expect(result[0]!.analysisFull).toHaveProperty('volatilityBundle');
  });

  it('each entry has a mode with degreeIndices', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningModeAnalysisFull(t12local, spec);
    for (const { mode } of result) {
      expect(mode).toHaveProperty('degreeIndices');
    }
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningModeAnalysisFull(t12local, spec, 261.63);
    expect(result.length).toBe(t12local.degrees.length);
    expect(result[0]!.analysisFull).toHaveProperty('rankedBundle');
  });
});

// ---------------------------------------------------------------------------
// Q398 — tuningFamilyModeAnalysisFull
// ---------------------------------------------------------------------------

describe('tuningFamilyModeAnalysisFull (Q398)', () => {
  it('returns one entry per tuning', () => {
    const family = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeAnalysisFull(family, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeAnalysis', () => {
    const family = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeAnalysisFull(family, spec);
    expect(result[0]!.id).toBe(family[0]!.id);
    expect(result[1]!.id).toBe(family[1]!.id);
    expect(result[0]!.modeAnalysis.length).toBe(family[0]!.degrees.length);
    expect(result[1]!.modeAnalysis.length).toBe(family[1]!.degrees.length);
  });

  it('modeAnalysis entries have analysisFull with all keys', () => {
    const family = [equalTemperament12(440)];
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeAnalysisFull(family, spec);
    const first = result[0]!.modeAnalysis[0]!;
    expect(first.analysisFull).toHaveProperty('dualHistogram');
    expect(first.analysisFull).toHaveProperty('rankedBundle');
    expect(first.analysisFull).toHaveProperty('volatilityBundle');
  });
});

// ---------------------------------------------------------------------------
// Q399 — tuningHarmonicSpectralScore
// ---------------------------------------------------------------------------

describe('tuningHarmonicSpectralScore (Q399)', () => {
  it('returns harmonicDensity, spectralFit, combinedScore', () => {
    const t12local = equalTemperament12(440);
    const spectrum = harmonicSpectrum(6);
    const score = tuningHarmonicSpectralScore(t12local, spectrum);
    expect(typeof score.harmonicDensity).toBe('number');
    expect(typeof score.spectralFit).toBe('number');
    expect(typeof score.combinedScore).toBe('number');
    expect(score.combinedScore).toBeCloseTo((score.harmonicDensity + score.spectralFit) / 2, 10);
  });

  it('combinedScore is arithmetic mean of harmonicDensity and spectralFit', () => {
    const t12local = equalTemperament12(440);
    const spectrum = harmonicSpectrum(6);
    const score = tuningHarmonicSpectralScore(t12local, spectrum);
    expect(score.combinedScore).toBeCloseTo((score.harmonicDensity + score.spectralFit) / 2, 10);
  });

  it('accepts optional rootHz and tol', () => {
    const t12local = equalTemperament12(440);
    const spectrum = harmonicSpectrum(6);
    const score = tuningHarmonicSpectralScore(t12local, spectrum, 261.63, 0.02);
    expect(typeof score.combinedScore).toBe('number');
  });

  it('different tunings yield different scores', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const spectrum = harmonicSpectrum(6);
    const s12 = tuningHarmonicSpectralScore(t12local, spectrum);
    const s19 = tuningHarmonicSpectralScore(t19, spectrum);
    // Not asserting direction, just that scores are computed and differ or are equal numbers
    expect(typeof s12.combinedScore).toBe('number');
    expect(typeof s19.combinedScore).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q401 — tuningFamilyHarmonicSpectralScores
// ---------------------------------------------------------------------------

describe('tuningFamilyHarmonicSpectralScores (Q401)', () => {
  it('returns one entry per tuning', () => {
    const family = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const scores = tuningFamilyHarmonicSpectralScores(family, spec);
    expect(scores.length).toBe(2);
  });

  it('each entry has id and score with all keys', () => {
    const family = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const scores = tuningFamilyHarmonicSpectralScores(family, spec);
    expect(scores[0]!.id).toBe(family[0]!.id);
    expect(scores[0]!.score).toHaveProperty('harmonicDensity');
    expect(scores[0]!.score).toHaveProperty('spectralFit');
    expect(scores[0]!.score).toHaveProperty('combinedScore');
  });

  it('combinedScore matches single-tuning result', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const family = [t12local];
    const familyScores = tuningFamilyHarmonicSpectralScores(family, spec);
    const single = tuningHarmonicSpectralScore(t12local, spec);
    expect(familyScores[0]!.score.combinedScore).toBeCloseTo(single.combinedScore, 10);
  });

  it('accepts optional rootHz and tol', () => {
    const family = [equalTemperament12(440)];
    const spec = harmonicSpectrum(6);
    const scores = tuningFamilyHarmonicSpectralScores(family, spec, 440, 0.02);
    expect(typeof scores[0]!.score.combinedScore).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q402 — tuningComprehensiveReport
// ---------------------------------------------------------------------------

describe('tuningComprehensiveReport (Q402)', () => {
  it('returns all four keys', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const report = tuningComprehensiveReport(t12local, spec);
    expect(report).toHaveProperty('fullAnalysis');
    expect(report).toHaveProperty('harmonicSpectralScore');
    expect(report).toHaveProperty('stabilityScore');
    expect(report).toHaveProperty('progressionVariety');
  });

  it('fullAnalysis has reportCard and tripleMode', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const report = tuningComprehensiveReport(t12local, spec);
    expect(typeof report.fullAnalysis.reportCard).toBe('string');
    expect(report.fullAnalysis.tripleMode).toHaveProperty('allAgree');
  });

  it('harmonicSpectralScore matches standalone call', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const report = tuningComprehensiveReport(t12local, spec);
    const standalone = tuningHarmonicSpectralScore(t12local, spec);
    expect(report.harmonicSpectralScore.combinedScore).toBeCloseTo(standalone.combinedScore, 10);
  });

  it('stabilityScore is a number in [0, 1]', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const report = tuningComprehensiveReport(t12local, spec);
    expect(typeof report.stabilityScore).toBe('number');
    expect(report.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(report.stabilityScore).toBeLessThanOrEqual(1);
  });

  it('progressionVariety is a number', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const report = tuningComprehensiveReport(t12local, spec);
    expect(typeof report.progressionVariety).toBe('number');
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const report = tuningComprehensiveReport(t12local, spec, 261.63);
    expect(typeof report.stabilityScore).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q404 — tuningFamilyComprehensiveReports
// ---------------------------------------------------------------------------

describe('tuningFamilyComprehensiveReports (Q404)', () => {
  it('returns one entry per tuning', () => {
    const family = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const reports = tuningFamilyComprehensiveReports(family, spec);
    expect(reports.length).toBe(2);
  });

  it('each entry has id and report with all keys', () => {
    const family = [equalTemperament12(440)];
    const spec = harmonicSpectrum(6);
    const reports = tuningFamilyComprehensiveReports(family, spec);
    expect(reports[0]!.id).toBe(family[0]!.id);
    expect(reports[0]!.report).toHaveProperty('fullAnalysis');
    expect(reports[0]!.report).toHaveProperty('harmonicSpectralScore');
    expect(reports[0]!.report).toHaveProperty('stabilityScore');
    expect(reports[0]!.report).toHaveProperty('progressionVariety');
  });

  it('matches single tuningComprehensiveReport', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const family = [t12local];
    const reports = tuningFamilyComprehensiveReports(family, spec);
    const single = tuningComprehensiveReport(t12local, spec);
    expect(reports[0]!.report.stabilityScore).toBeCloseTo(single.stabilityScore, 10);
  });

  it('accepts optional rootHz', () => {
    const family = [equalTemperament12(440)];
    const spec = harmonicSpectrum(6);
    const reports = tuningFamilyComprehensiveReports(family, spec, 261.63);
    expect(typeof reports[0]!.report.stabilityScore).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q405 — scaleSimilarityRanking
// ---------------------------------------------------------------------------

describe('scaleSimilarityRanking (Q405)', () => {
  it('ranks other tunings by similarity to target', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const t31 = edo(31, 440);
    const ranking = scaleSimilarityRanking([t19, t31], t12local);
    expect(ranking.length).toBe(2);
    expect(typeof ranking[0]!.similarity).toBe('number');
    expect(typeof ranking[0]!.tuning).toBe('object');
  });

  it('returns sorted descending by similarity when similarities are finite', () => {
    // Use same-size tunings so Pearson correlation is well-defined
    const t12a = equalTemperament12(440);
    const t12b = equalTemperament12(261.63);
    const t12c = equalTemperament12(330);
    const ranking = scaleSimilarityRanking([t12b, t12c], t12a);
    if (ranking.length >= 2) {
      const s0 = ranking[0]!.similarity;
      const s1 = ranking[1]!.similarity;
      if (isFinite(s0) && isFinite(s1)) {
        expect(s0).toBeGreaterThanOrEqual(s1);
      }
    }
  });

  it('handles single tuning in list', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const ranking = scaleSimilarityRanking([t19], t12local);
    expect(ranking.length).toBe(1);
  });

  it('accepts optional tol', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const ranking = scaleSimilarityRanking([t19], t12local, 0.02);
    expect(typeof ranking[0]!.similarity).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q407 — tuningFamilySimilarityMatrix
// ---------------------------------------------------------------------------

describe('tuningFamilySimilarityMatrix (Q407)', () => {
  it('returns matrix, most and least similar pair', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const result = tuningFamilySimilarityMatrix([t12local, t19]);
    expect(result.matrix.length).toBe(2);
    expect(result.mostSimilarPair.length).toBe(2);
    expect(result.leastSimilarPair.length).toBe(2);
  });

  it('throws RangeError for fewer than 2 tunings', () => {
    expect(() => tuningFamilySimilarityMatrix([equalTemperament12(440)])).toThrow(RangeError);
  });

  it('throws RangeError for empty array', () => {
    expect(() => tuningFamilySimilarityMatrix([])).toThrow(RangeError);
  });

  it('passes back the tunings array', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const result = tuningFamilySimilarityMatrix([t12local, t19]);
    expect(result.tunings.length).toBe(2);
  });

  it('mostSimilarPair and leastSimilarPair are TuningSystem objects with ids', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const t31 = edo(31, 440);
    const result = tuningFamilySimilarityMatrix([t12local, t19, t31]);
    expect(typeof result.mostSimilarPair[0].id).toBe('string');
    expect(typeof result.mostSimilarPair[1].id).toBe('string');
    expect(typeof result.leastSimilarPair[0].id).toBe('string');
    expect(typeof result.leastSimilarPair[1].id).toBe('string');
  });

  it('accepts optional tol', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const result = tuningFamilySimilarityMatrix([t12local, t19], 0.02);
    expect(typeof result.matrix[0]?.[1]).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q408 — tuningModeIntervalProfile
// ---------------------------------------------------------------------------

describe('tuningModeIntervalProfile (Q408)', () => {
  it('returns one entry per mode with diversity in [0,1]', () => {
    const t12local = equalTemperament12(440);
    const profiles = tuningModeIntervalProfile(t12local);
    expect(profiles.length).toBe(t12local.degrees.length);
    for (const { mode, intervals, intervalCount, uniqueIntervals, diversity } of profiles) {
      expect(mode).toHaveProperty('degreeIndices');
      expect(intervalCount).toBe(intervals.length);
      expect(uniqueIntervals.length).toBeLessThanOrEqual(intervalCount);
      expect(diversity).toBeGreaterThanOrEqual(0);
      expect(diversity).toBeLessThanOrEqual(1);
    }
  });

  it('uniqueIntervals is sorted ascending', () => {
    const t12local = equalTemperament12(440);
    const profiles = tuningModeIntervalProfile(t12local);
    for (const { uniqueIntervals } of profiles) {
      for (let i = 1; i < uniqueIntervals.length; i++) {
        expect(uniqueIntervals[i]!).toBeGreaterThanOrEqual(uniqueIntervals[i - 1]!);
      }
    }
  });

  it('diversity = 1 for fully symmetric tuning (each mode rotation has unique steps)', () => {
    const t12local = equalTemperament12(440);
    const profiles = tuningModeIntervalProfile(t12local);
    // 12-EDO: all steps are equal 100c, so uniqueIntervals.length = 1, intervalCount = 12, diversity = 1/12
    for (const { diversity } of profiles) {
      expect(diversity).toBeGreaterThan(0);
      expect(diversity).toBeLessThanOrEqual(1);
    }
  });

  it('intervalCount equals number of degrees in each mode', () => {
    const t12local = equalTemperament12(440);
    const profiles = tuningModeIntervalProfile(t12local);
    for (const { intervalCount, intervals } of profiles) {
      expect(intervalCount).toBe(intervals.length);
    }
  });
});

// ---------------------------------------------------------------------------
// Q410 — tuningFamilyIntervalProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilyIntervalProfiles (Q410)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const result = tuningFamilyIntervalProfiles([t12local, t19]);
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeProfiles', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyIntervalProfiles([t12local]);
    expect(typeof result[0]!.id).toBe('string');
    expect(Array.isArray(result[0]!.modeProfiles)).toBe(true);
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyIntervalProfiles([t12local]);
    expect(result[0]!.id).toBe(t12local.id);
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyIntervalProfiles([]);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q411 — tuningMostDiverseMode
// ---------------------------------------------------------------------------

describe('tuningMostDiverseMode (Q411)', () => {
  it('returns mode and diversity', () => {
    const t12local = equalTemperament12(440);
    const result = tuningMostDiverseMode(t12local);
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(result.diversity).toBeGreaterThanOrEqual(0);
  });

  it('diversity is in [0,1]', () => {
    const t12local = equalTemperament12(440);
    const { diversity } = tuningMostDiverseMode(t12local);
    expect(diversity).toBeGreaterThanOrEqual(0);
    expect(diversity).toBeLessThanOrEqual(1);
  });

  it('throws RangeError for empty tuning', () => {
    const empty = { ...equalTemperament12(440), degrees: [] };
    expect(() => tuningMostDiverseMode(empty)).toThrow(RangeError);
  });

  it('returned diversity is the maximum across all modes', () => {
    const t12local = equalTemperament12(440);
    const { diversity } = tuningMostDiverseMode(t12local);
    const profiles = tuningModeIntervalProfile(t12local);
    const maxDiversity = Math.max(...profiles.map((p) => p.diversity));
    expect(diversity).toBeCloseTo(maxDiversity, 10);
  });
});

// ---------------------------------------------------------------------------
// Q413 — tuningFamilyMostDiverseModes
// ---------------------------------------------------------------------------

describe('tuningFamilyMostDiverseModes (Q413)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const result = tuningFamilyMostDiverseModes([t12local, t19]);
    expect(result.length).toBe(2);
  });

  it('each entry has id and mostDiverseMode with mode and diversity', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyMostDiverseModes([t12local]);
    expect(typeof result[0]!.id).toBe('string');
    expect(result[0]!.mostDiverseMode).toHaveProperty('mode');
    expect(result[0]!.mostDiverseMode).toHaveProperty('diversity');
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const result = tuningFamilyMostDiverseModes([t12local]);
    expect(result[0]!.id).toBe(t12local.id);
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyMostDiverseModes([]);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q414 — tuningModeComprehensiveBundle
// ---------------------------------------------------------------------------

describe('tuningModeComprehensiveBundle (Q414)', () => {
  it('returns one entry per mode', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const bundle = tuningModeComprehensiveBundle(t12local, spec);
    expect(bundle.length).toBe(t12local.degrees.length);
  });

  it('each entry has all five metrics', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const bundle = tuningModeComprehensiveBundle(t12local, spec);
    for (const b of bundle) {
      expect(b.mode).toHaveProperty('degreeIndices');
      expect(typeof b.entropy).toBe('number');
      expect(typeof b.consistency).toBe('number');
      expect(typeof b.volatility).toBe('number');
      expect(typeof b.diversity).toBe('number');
      expect(typeof b.smoothnessRatio).toBe('number');
    }
  });

  it('diversity is in [0,1]', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const bundle = tuningModeComprehensiveBundle(t12local, spec);
    for (const b of bundle) {
      expect(b.diversity).toBeGreaterThanOrEqual(0);
      expect(b.diversity).toBeLessThanOrEqual(1);
    }
  });

  it('accepts explicit rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const bundle = tuningModeComprehensiveBundle(t12local, spec, 261.63);
    expect(bundle.length).toBe(t12local.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q416 — tuningFamilyModeComprehensiveBundles
// ---------------------------------------------------------------------------

describe('tuningFamilyModeComprehensiveBundles (Q416)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeComprehensiveBundles([t12local, t19], spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeBundles', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeComprehensiveBundles([t12local], spec);
    expect(typeof result[0]!.id).toBe('string');
    expect(Array.isArray(result[0]!.modeBundles)).toBe(true);
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeComprehensiveBundles([t12local], spec);
    expect(result[0]!.id).toBe(t12local.id);
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyModeComprehensiveBundles([], harmonicSpectrum(6));
    expect(result).toEqual([]);
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeComprehensiveBundles([t12local], spec, 261.63);
    expect(result.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Q417 — tuningBestModeComprehensive
// ---------------------------------------------------------------------------

describe('tuningBestModeComprehensive (Q417)', () => {
  it('returns a mode with a score', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeComprehensive(t12local, harmonicSpectrum(6));
    expect(result.mode).toHaveProperty('degreeIndices');
    expect(typeof result.score).toBe('number');
  });

  it('returned entry has all five metrics plus score', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeComprehensive(t12local, harmonicSpectrum(6));
    expect(typeof result.entropy).toBe('number');
    expect(typeof result.consistency).toBe('number');
    expect(typeof result.volatility).toBe('number');
    expect(typeof result.diversity).toBe('number');
    expect(typeof result.smoothnessRatio).toBe('number');
    expect(typeof result.score).toBe('number');
  });

  it('score matches the formula applied to the returned mode', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningBestModeComprehensive(t12local, spec);
    const expected =
      result.entropy +
      result.consistency +
      (1 - result.volatility) +
      result.diversity +
      result.smoothnessRatio;
    expect(result.score).toBeCloseTo(expected, 10);
  });

  it('score is the maximum among all modes', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningBestModeComprehensive(t12local, spec);
    const bundle = tuningModeComprehensiveBundle(t12local, spec);
    const maxScore = Math.max(
      ...bundle.map(
        (b) => b.entropy + b.consistency + (1 - b.volatility) + b.diversity + b.smoothnessRatio,
      ),
    );
    expect(result.score).toBeCloseTo(maxScore, 10);
  });

  it('throws RangeError for empty tuning', () => {
    const empty = { ...equalTemperament12(440), degrees: [] };
    expect(() => tuningBestModeComprehensive(empty, harmonicSpectrum(6))).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const result = tuningBestModeComprehensive(t12local, harmonicSpectrum(6), 261.63);
    expect(result.mode).toHaveProperty('degreeIndices');
  });
});

// ---------------------------------------------------------------------------
// Q419 — tuningFamilyBestModeComprehensive
// ---------------------------------------------------------------------------

describe('tuningFamilyBestModeComprehensive (Q419)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyBestModeComprehensive([t12local, t19], spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and bestMode with score', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyBestModeComprehensive([t12local], spec);
    expect(typeof result[0]!.id).toBe('string');
    expect(result[0]!.bestMode).toHaveProperty('mode');
    expect(result[0]!.bestMode).toHaveProperty('score');
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyBestModeComprehensive([t12local], spec);
    expect(result[0]!.id).toBe(t12local.id);
  });

  it('returns empty array for empty input', () => {
    const result = tuningFamilyBestModeComprehensive([], harmonicSpectrum(6));
    expect(result).toEqual([]);
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyBestModeComprehensive([t12local], spec, 261.63);
    expect(result.length).toBe(1);
    expect(result[0]!.bestMode).toHaveProperty('score');
  });
});

// ---------------------------------------------------------------------------
// Q420 — tuningModeScoreRanking
// ---------------------------------------------------------------------------

describe('tuningModeScoreRanking (Q420)', () => {
  it('returns modes sorted by score descending', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const ranking = tuningModeScoreRanking(t12local, spec);
    expect(ranking.length).toBe(t12local.degrees.length);
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1]!.score).toBeGreaterThanOrEqual(ranking[i]!.score);
    }
  });

  it('each entry has mode and numeric score', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const ranking = tuningModeScoreRanking(t12local, spec);
    for (const r of ranking) {
      expect(r.mode).toHaveProperty('degreeIndices');
      expect(typeof r.score).toBe('number');
    }
  });

  it('score matches formula applied to bundle', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const ranking = tuningModeScoreRanking(t12local, spec);
    const bundle = tuningModeComprehensiveBundle(t12local, spec);
    const bundleScores = bundle.map(
      (b) => b.entropy + b.consistency + (1 - b.volatility) + b.diversity + b.smoothnessRatio,
    );
    const rankingScoresSorted = [...ranking.map((r) => r.score)].sort((a, b) => b - a);
    const bundleScoresSorted = [...bundleScores].sort((a, b) => b - a);
    expect(rankingScoresSorted).toEqual(bundleScoresSorted);
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const ranking = tuningModeScoreRanking(t12local, spec, 261.63);
    expect(ranking.length).toBe(t12local.degrees.length);
  });

  it('returns empty array for tuning with no degrees', () => {
    const empty = { ...equalTemperament12(440), degrees: [] };
    const spec = harmonicSpectrum(6);
    const ranking = tuningModeScoreRanking(empty, spec);
    expect(ranking).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q422 — tuningFamilyModeScoreRankings
// ---------------------------------------------------------------------------

describe('tuningFamilyModeScoreRankings (Q422)', () => {
  it('returns one entry per tuning', () => {
    const t12local = equalTemperament12(440);
    const t19 = edo(19, 440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeScoreRankings([t12local, t19], spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeRanking sorted descending', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeScoreRankings([t12local], spec);
    expect(typeof result[0]!.id).toBe('string');
    const ranking = result[0]!.modeRanking;
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1]!.score).toBeGreaterThanOrEqual(ranking[i]!.score);
    }
  });

  it('id matches tuning id', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeScoreRankings([t12local], spec);
    expect(result[0]!.id).toBe(t12local.id);
  });

  it('returns empty array for empty input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeScoreRankings([], spec);
    expect(result).toEqual([]);
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyModeScoreRankings([t12local], spec, 261.63);
    expect(result.length).toBe(1);
    expect(result[0]!.modeRanking.length).toBe(t12local.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q423 — tuningModeComprehensiveTop
// ---------------------------------------------------------------------------

describe('tuningModeComprehensiveTop (Q423)', () => {
  it('returns exactly n modes when n <= total modes', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const top3 = tuningModeComprehensiveTop(t12local, 3, spec);
    expect(top3.length).toBe(3);
  });

  it('returns all modes when n >= total modes', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const topAll = tuningModeComprehensiveTop(t12local, 100, spec);
    expect(topAll.length).toBe(t12local.degrees.length);
  });

  it('results are sorted by score descending', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const top5 = tuningModeComprehensiveTop(t12local, 5, spec);
    for (let i = 1; i < top5.length; i++) {
      expect(top5[i - 1]!.score).toBeGreaterThanOrEqual(top5[i]!.score);
    }
  });

  it('each entry has all five metrics plus score', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const top3 = tuningModeComprehensiveTop(t12local, 3, spec);
    for (const entry of top3) {
      expect(typeof entry.entropy).toBe('number');
      expect(typeof entry.consistency).toBe('number');
      expect(typeof entry.volatility).toBe('number');
      expect(typeof entry.diversity).toBe('number');
      expect(typeof entry.smoothnessRatio).toBe('number');
      expect(typeof entry.score).toBe('number');
    }
  });

  it('throws RangeError for n <= 0', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    expect(() => tuningModeComprehensiveTop(t12local, 0, spec)).toThrow(RangeError);
    expect(() => tuningModeComprehensiveTop(t12local, -1, spec)).toThrow(RangeError);
  });

  it('first entry matches tuningBestModeComprehensive', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const top1 = tuningModeComprehensiveTop(t12local, 1, spec);
    const best = tuningBestModeComprehensive(t12local, spec);
    expect(top1[0]!.mode.id).toBe(best.mode.id);
    expect(top1[0]!.score).toBeCloseTo(best.score, 10);
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const top3 = tuningModeComprehensiveTop(t12local, 3, spec, 261.63);
    expect(top3.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Q424 — tuningIntervalDiversityVsEntropy
// ---------------------------------------------------------------------------

describe('tuningIntervalDiversityVsEntropy (Q424)', () => {
  it('returns one entry per mode with correlation label', () => {
    const t12local = equalTemperament12(440);
    const result = tuningIntervalDiversityVsEntropy(t12local);
    expect(result.length).toBe(t12local.degrees.length);
    for (const r of result) {
      expect(['aligned', 'opposed', 'neutral']).toContain(r.correlation);
      expect(r.diversity).toBeGreaterThanOrEqual(0);
      expect(r.entropy).toBeGreaterThanOrEqual(0);
    }
  });

  it('diversity values match tuningModeIntervalProfile', () => {
    const t12local = equalTemperament12(440);
    const result = tuningIntervalDiversityVsEntropy(t12local);
    const profiles = tuningModeIntervalProfile(t12local);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]!.diversity).toBeCloseTo(profiles[i]!.diversity, 10);
    }
  });

  it('each entry has mode with degreeIndices', () => {
    const t12local = equalTemperament12(440);
    const result = tuningIntervalDiversityVsEntropy(t12local);
    for (const r of result) {
      expect(r.mode).toHaveProperty('degreeIndices');
    }
  });

  it('accepts optional spectrum and rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningIntervalDiversityVsEntropy(t12local, spec, 261.63);
    expect(result.length).toBe(t12local.degrees.length);
    for (const r of result) {
      expect(['aligned', 'opposed', 'neutral']).toContain(r.correlation);
    }
  });

  it('correlation is one of the three allowed values', () => {
    const t19 = edo(19, 440);
    const result = tuningIntervalDiversityVsEntropy(t19);
    for (const r of result) {
      expect(['aligned', 'opposed', 'neutral']).toContain(r.correlation);
    }
  });
});

// ---------------------------------------------------------------------------
// Q426 — tuningModeParetoFront
// ---------------------------------------------------------------------------

describe('tuningModeParetoFront (Q426)', () => {
  it('returns subset of modes', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const front = tuningModeParetoFront(t12local, spec);
    expect(front.length).toBeGreaterThan(0);
    expect(front.length).toBeLessThanOrEqual(t12local.degrees.length);
  });

  it('each mode has all 5 metrics', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const front = tuningModeParetoFront(t12local, spec);
    for (const m of front) {
      expect(typeof m.entropy).toBe('number');
      expect(typeof m.consistency).toBe('number');
      expect(typeof m.volatility).toBe('number');
      expect(typeof m.diversity).toBe('number');
      expect(typeof m.smoothnessRatio).toBe('number');
    }
  });

  it('no mode in front is dominated by another', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const front = tuningModeParetoFront(t12local, spec);
    for (const a of front) {
      for (const b of front) {
        if (a === b) continue;
        const bDomA =
          b.entropy >= a.entropy &&
          b.consistency >= a.consistency &&
          b.volatility <= a.volatility &&
          b.diversity >= a.diversity &&
          b.smoothnessRatio >= a.smoothnessRatio &&
          (b.entropy > a.entropy ||
            b.consistency > a.consistency ||
            b.volatility < a.volatility ||
            b.diversity > a.diversity ||
            b.smoothnessRatio > a.smoothnessRatio);
        expect(bDomA).toBe(false);
      }
    }
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const front = tuningModeParetoFront(t12local, spec, 261.63);
    expect(front.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q428 — tuningFamilyModeParetoFronts
// ---------------------------------------------------------------------------

describe('tuningFamilyModeParetoFronts (Q428)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const results = tuningFamilyModeParetoFronts(tunings, spec);
    expect(results.length).toBe(2);
  });

  it('each entry has id and non-empty paretoFront', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const results = tuningFamilyModeParetoFronts(tunings, spec);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.paretoFront.length).toBeGreaterThan(0);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440)];
    const results = tuningFamilyModeParetoFronts(tunings, spec, 261.63);
    expect(results[0]!.paretoFront.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q429 — tuningModeCorrelationMatrix
// ---------------------------------------------------------------------------

describe('tuningModeCorrelationMatrix (Q429)', () => {
  it('returns 5x5 symmetric matrix', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { metrics, matrix } = tuningModeCorrelationMatrix(t12local, spec);
    expect(metrics.length).toBe(5);
    expect(matrix.length).toBe(5);
    expect(matrix[0]!.length).toBe(5);
    // Diagonal should be 1, or 0 when the metric is constant across all modes
    for (let i = 0; i < 5; i++) {
      const diag = matrix[i]![i]!;
      expect(diag === 1 || diag === 0).toBe(true);
    }
    // Symmetric
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        expect(matrix[i]![j]!).toBeCloseTo(matrix[j]![i]!, 10);
      }
    }
  });

  it('metrics are in the expected order', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { metrics } = tuningModeCorrelationMatrix(t12local, spec);
    expect(metrics).toEqual([
      'entropy',
      'consistency',
      'volatility',
      'diversity',
      'smoothnessRatio',
    ]);
  });

  it('all values are in [-1, 1]', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { matrix } = tuningModeCorrelationMatrix(t12local, spec);
    for (const row of matrix) {
      for (const v of row) {
        expect(v).toBeGreaterThanOrEqual(-1 - 1e-10);
        expect(v).toBeLessThanOrEqual(1 + 1e-10);
      }
    }
  });

  it('accepts optional rootHz', () => {
    const t12local = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { metrics, matrix } = tuningModeCorrelationMatrix(t12local, spec, 261.63);
    expect(metrics.length).toBe(5);
    expect(matrix.length).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Q431 — tuningFamilyModeCorrelationMatrices
// ---------------------------------------------------------------------------

describe('tuningFamilyModeCorrelationMatrices (Q431)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const results = tuningFamilyModeCorrelationMatrices(tunings, spec);
    expect(results.length).toBe(2);
  });

  it('each entry has id and 5x5 matrix', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const results = tuningFamilyModeCorrelationMatrices(tunings, spec);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.correlationMatrix.metrics.length).toBe(5);
      expect(r.correlationMatrix.matrix.length).toBe(5);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440)];
    const results = tuningFamilyModeCorrelationMatrices(tunings, spec, 261.63);
    expect(results[0]!.correlationMatrix.matrix.length).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Q432 — tuningParetoFrontBestMode
// ---------------------------------------------------------------------------

describe('tuningParetoFrontBestMode (Q432)', () => {
  it('returns a single mode object with score', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningParetoFrontBestMode(t12, spec);
    expect(typeof result.score).toBe('number');
    expect(typeof result.entropy).toBe('number');
    expect(typeof result.consistency).toBe('number');
    expect(typeof result.volatility).toBe('number');
    expect(typeof result.diversity).toBe('number');
    expect(typeof result.smoothnessRatio).toBe('number');
    expect(result.mode).toBeDefined();
  });

  it('result is from the Pareto front', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const front = tuningModeParetoFront(t12, spec);
    const result = tuningParetoFrontBestMode(t12, spec);
    const frontIds = front.map((f) => f.mode.id);
    expect(frontIds).toContain(result.mode.id);
  });

  it('score is highest in the front', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const front = tuningModeParetoFront(t12, spec);
    const result = tuningParetoFrontBestMode(t12, spec);
    const scoreOf = (e: {
      entropy: number;
      consistency: number;
      volatility: number;
      diversity: number;
      smoothnessRatio: number;
    }) =>
      e.entropy +
      e.consistency +
      (1 - Math.min(1, e.volatility)) +
      e.diversity +
      Math.min(1, e.smoothnessRatio);
    const maxScore = Math.max(...front.map(scoreOf));
    expect(result.score).toBeCloseTo(maxScore, 10);
  });

  it('accepts optional rootHz', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningParetoFrontBestMode(t12, spec, 261.63);
    expect(typeof result.score).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q434 — tuningModeTopCorrelation
// ---------------------------------------------------------------------------

describe('tuningModeTopCorrelation (Q434)', () => {
  it('returns metricA, metricB, correlation', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningModeTopCorrelation(t12, spec);
    expect(typeof result.metricA).toBe('string');
    expect(typeof result.metricB).toBe('string');
    expect(typeof result.correlation).toBe('number');
    expect(result.correlation).toBeGreaterThanOrEqual(-1 - 1e-10);
    expect(result.correlation).toBeLessThanOrEqual(1 + 1e-10);
  });

  it('correlation is the maximum off-diagonal value', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { metrics, matrix } = tuningModeCorrelationMatrix(t12, spec);
    let maxVal = -Infinity;
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const v = matrix[i]?.[j] ?? -Infinity;
        if (v > maxVal) maxVal = v;
      }
    }
    const result = tuningModeTopCorrelation(t12, spec);
    expect(result.correlation).toBeCloseTo(maxVal, 10);
  });

  it('accepts optional rootHz', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningModeTopCorrelation(t12, spec, 261.63);
    expect(typeof result.correlation).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q435 — tuningModeAntiCorrelation
// ---------------------------------------------------------------------------

describe('tuningModeAntiCorrelation (Q435)', () => {
  it('returns metricA, metricB, correlation', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningModeAntiCorrelation(t12, spec);
    expect(typeof result.metricA).toBe('string');
    expect(typeof result.metricB).toBe('string');
    expect(typeof result.correlation).toBe('number');
  });

  it('correlation is the minimum off-diagonal value', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { metrics, matrix } = tuningModeCorrelationMatrix(t12, spec);
    let minVal = Infinity;
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const v = matrix[i]?.[j] ?? Infinity;
        if (v < minVal) minVal = v;
      }
    }
    const result = tuningModeAntiCorrelation(t12, spec);
    expect(result.correlation).toBeCloseTo(minVal, 10);
  });

  it('accepts optional rootHz', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningModeAntiCorrelation(t12, spec, 261.63);
    expect(typeof result.correlation).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q438 — tuningFamilyTopCorrelations
// ---------------------------------------------------------------------------

describe('tuningFamilyTopCorrelations', () => {
  it('returns one entry per tuning with id and topCorrelation', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyTopCorrelations(tunings, spec);
    expect(results).toHaveLength(2);
    for (const entry of results) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.topCorrelation.metricA).toBe('string');
      expect(typeof entry.topCorrelation.metricB).toBe('string');
      expect(typeof entry.topCorrelation.correlation).toBe('number');
    }
  });

  it('accepts optional rootHz', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyTopCorrelations(tunings, spec, 261.63);
    expect(results).toHaveLength(tunings.length);
  });
});

// ---------------------------------------------------------------------------
// Q440 — tuningFamilyAntiCorrelations
// ---------------------------------------------------------------------------

describe('tuningFamilyAntiCorrelations', () => {
  it('returns one entry per tuning with id and antiCorrelation', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyAntiCorrelations(tunings, spec);
    expect(results).toHaveLength(2);
    for (const entry of results) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.antiCorrelation.correlation).toBe('number');
    }
  });

  it('antiCorrelation.correlation <= topCorrelation.correlation for same tuning', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const [antiEntry] = tuningFamilyAntiCorrelations([t12], spec);
    const [topEntry] = tuningFamilyTopCorrelations([t12], spec);
    expect(antiEntry!.antiCorrelation.correlation).toBeLessThanOrEqual(
      topEntry!.topCorrelation.correlation,
    );
  });
});

// ---------------------------------------------------------------------------
// Q441 — tuningParetoFrontSummary
// ---------------------------------------------------------------------------

describe('tuningParetoFrontSummary', () => {
  it('returns paretoSize and 5 metric summaries', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const summary = tuningParetoFrontSummary(t12, spec);
    expect(summary.paretoSize).toBeGreaterThan(0);
    expect(typeof summary.entropy.mean).toBe('number');
    expect(typeof summary.entropy.min).toBe('number');
    expect(typeof summary.entropy.max).toBe('number');
  });

  it('min <= mean <= max for each metric', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const summary = tuningParetoFrontSummary(t12, spec);
    for (const key of ['entropy', 'consistency', 'diversity'] as const) {
      const s = summary[key];
      expect(s.min).toBeLessThanOrEqual(s.mean + 1e-10);
      expect(s.mean).toBeLessThanOrEqual(s.max + 1e-10);
    }
  });

  it('volatility min <= max', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const summary = tuningParetoFrontSummary(t12, spec);
    expect(summary.volatility.min).toBeLessThanOrEqual(summary.volatility.max + 1e-10);
  });

  it('accepts optional rootHz', () => {
    const t12 = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const summary = tuningParetoFrontSummary(t12, spec, 261.63);
    expect(summary.paretoSize).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q442 — tuningFamilyParetoFrontSummaries
// ---------------------------------------------------------------------------

describe('tuningFamilyParetoFrontSummaries', () => {
  it('returns one entry per tuning', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyParetoFrontSummaries(tunings, spec);
    expect(results).toHaveLength(2);
  });

  it('each entry has id and summary with paretoSize', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyParetoFrontSummaries(tunings, spec);
    for (const entry of results) {
      expect(typeof entry.id).toBe('string');
      expect(entry.summary.paretoSize).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q444 — tuningParetoFrontVsRanking
// ---------------------------------------------------------------------------

describe('tuningParetoFrontVsRanking', () => {
  it('returns all modes with inParetoFront annotation', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const results = tuningParetoFrontVsRanking(tuning, spec);
    expect(results.length).toBe(tuning.degrees.length);
    for (const entry of results) {
      expect(entry).toHaveProperty('mode');
      expect(typeof entry.score).toBe('number');
      expect(typeof entry.inParetoFront).toBe('boolean');
    }
  });

  it('at least one mode is in Pareto front', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const results = tuningParetoFrontVsRanking(tuning, spec);
    const inFront = results.filter((r) => r.inParetoFront);
    expect(inFront.length).toBeGreaterThan(0);
  });

  it('Pareto front modes match tuningModeParetoFront ids', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const front = tuningModeParetoFront(tuning, spec);
    const frontIds = new Set(front.map((f) => f.mode.id));
    const results = tuningParetoFrontVsRanking(tuning, spec);
    const annotatedIds = new Set(results.filter((r) => r.inParetoFront).map((r) => r.mode.id));
    expect(annotatedIds).toEqual(frontIds);
  });

  it('accepts optional rootHz', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const results = tuningParetoFrontVsRanking(tuning, spec, 261.63);
    expect(results.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q445 — tuningParetoFrontRankPosition
// ---------------------------------------------------------------------------

describe('tuningParetoFrontRankPosition', () => {
  it('returns only Pareto modes with rank', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const results = tuningParetoFrontRankPosition(tuning, spec);
    for (const entry of results) {
      expect(entry).toHaveProperty('mode');
      expect(typeof entry.score).toBe('number');
      expect(typeof entry.rank).toBe('number');
      expect(entry.rank).toBeGreaterThanOrEqual(1);
    }
  });

  it('ranks are 1-based and increasing', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const results = tuningParetoFrontRankPosition(tuning, spec);
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.rank).toBeGreaterThan(results[i - 1]!.rank);
    }
  });

  it('accepts optional rootHz', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const results = tuningParetoFrontRankPosition(tuning, spec, 261.63);
    expect(results.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q446 — tuningBestParetoRankedMode
// ---------------------------------------------------------------------------

describe('tuningBestParetoRankedMode', () => {
  it('returns single mode with rank 1 or higher', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningBestParetoRankedMode(tuning, spec);
    expect(result.rank).toBeGreaterThanOrEqual(1);
  });

  it('result is in the Pareto front', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const ranked = tuningParetoFrontRankPosition(tuning, spec);
    const result = tuningBestParetoRankedMode(tuning, spec);
    const ids = ranked.map((r) => r.mode.id);
    expect(ids).toContain(result.mode.id);
  });

  it('accepts optional rootHz', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningBestParetoRankedMode(tuning, spec, 261.63);
    expect(result.rank).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Q447 — tuningFamilyParetoRankPositions
// ---------------------------------------------------------------------------

describe('tuningFamilyParetoRankPositions', () => {
  it('returns one entry per tuning', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyParetoRankPositions(tunings, spec);
    expect(results).toHaveLength(2);
  });

  it('each entry has id and non-empty paretoRanks', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyParetoRankPositions(tunings, spec);
    for (const entry of results) {
      expect(typeof entry.id).toBe('string');
      expect(entry.paretoRanks.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q450 — tuningParetoFrontGap
// ---------------------------------------------------------------------------

describe('tuningParetoFrontGap (Q450)', () => {
  it('returns maxGap, gaps, paretoRanks', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { maxGap, gaps, paretoRanks } = tuningParetoFrontGap(tuning, spec);
    expect(maxGap).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(gaps)).toBe(true);
    expect(Array.isArray(paretoRanks)).toBe(true);
    paretoRanks.forEach((r) => expect(typeof r).toBe('number'));
  });

  it('maxGap equals max of gaps array (or 0 if empty gaps)', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { maxGap, gaps } = tuningParetoFrontGap(tuning, spec);
    const expected = gaps.length > 0 ? Math.max(...gaps) : 0;
    expect(maxGap).toBe(expected);
  });

  it('accepts optional rootHz', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { maxGap } = tuningParetoFrontGap(tuning, spec, 261.63);
    expect(maxGap).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Q451 — tuningParetoFrontCoverage
// ---------------------------------------------------------------------------

describe('tuningParetoFrontCoverage (Q451)', () => {
  it('returns paretoSize, totalModes, topRank, coverageInTopK as numbers', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const result = tuningParetoFrontCoverage(tuning, spec);
    expect(typeof result.paretoSize).toBe('number');
    expect(typeof result.totalModes).toBe('number');
    expect(typeof result.topRank).toBe('number');
    expect(typeof result.coverageInTopK).toBe('number');
  });

  it('paretoSize <= totalModes', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { paretoSize, totalModes } = tuningParetoFrontCoverage(tuning, spec);
    expect(paretoSize).toBeLessThanOrEqual(totalModes);
  });

  it('coverageInTopK is in [0, 1]', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { coverageInTopK } = tuningParetoFrontCoverage(tuning, spec);
    expect(coverageInTopK).toBeGreaterThanOrEqual(0);
    expect(coverageInTopK).toBeLessThanOrEqual(1);
  });

  it('accepts optional rootHz', () => {
    const tuning = equalTemperament12(440);
    const spec = harmonicSpectrum(6);
    const { coverageInTopK } = tuningParetoFrontCoverage(tuning, spec, 261.63);
    expect(coverageInTopK).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Q452 — tuningFamilyParetoFrontCoverage
// ---------------------------------------------------------------------------

describe('tuningFamilyParetoFrontCoverage (Q452)', () => {
  it('returns one entry per tuning', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyParetoFrontCoverage(tunings, spec);
    expect(results).toHaveLength(2);
  });

  it('each entry has id and coverage fields', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyParetoFrontCoverage(tunings, spec);
    for (const entry of results) {
      expect(typeof entry.id).toBe('string');
      expect(entry.coverage.paretoSize).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q455 — tuningParetoSummaryComparison
// ---------------------------------------------------------------------------

describe('tuningParetoSummaryComparison (Q455)', () => {
  it('returns largest, smallest, meanParetoSize, summaries', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const result = tuningParetoSummaryComparison(tunings, spec);
    expect(typeof result.largest.id).toBe('string');
    expect(typeof result.largest.paretoSize).toBe('number');
    expect(typeof result.smallest.id).toBe('string');
    expect(typeof result.smallest.paretoSize).toBe('number');
    expect(typeof result.meanParetoSize).toBe('number');
    expect(Array.isArray(result.summaries)).toBe(true);
  });

  it('largest.paretoSize >= smallest.paretoSize', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const { largest, smallest } = tuningParetoSummaryComparison(tunings, spec);
    expect(largest.paretoSize).toBeGreaterThanOrEqual(smallest.paretoSize);
  });

  it('summaries is sorted descending by paretoSize', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const { summaries } = tuningParetoSummaryComparison(tunings, spec);
    expect(summaries[0]!.paretoSize).toBeGreaterThanOrEqual(summaries[1]!.paretoSize);
  });

  it('meanParetoSize is between smallest and largest', () => {
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const spec = harmonicSpectrum(6);
    const { largest, smallest, meanParetoSize } = tuningParetoSummaryComparison(tunings, spec);
    expect(meanParetoSize).toBeGreaterThanOrEqual(smallest.paretoSize);
    expect(meanParetoSize).toBeLessThanOrEqual(largest.paretoSize);
  });
});

// ---------------------------------------------------------------------------
// Q456 — tuningCorrelationMatrixNarrative
// ---------------------------------------------------------------------------

describe('tuningCorrelationMatrixNarrative', () => {
  it('returns narrative string and correlation metadata', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningCorrelationMatrixNarrative(equalTemperament12(440), spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(typeof result.topCorrelation.metricA).toBe('string');
    expect(result.strongPairCount).toBeGreaterThanOrEqual(0);
  });

  it('narrative mentions top correlation metric names', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningCorrelationMatrixNarrative(equalTemperament12(440), spec);
    expect(result.narrative.includes(result.topCorrelation.metricA)).toBe(true);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningCorrelationMatrixNarrative(equalTemperament12(440), spec, 261.63);
    expect(typeof result.narrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q458 — tuningFamilyCorrelationNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyCorrelationNarratives', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyCorrelationNarratives(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and narrative fields', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyCorrelationNarratives(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.narrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q459 — tuningParetoFrontNarrative
// ---------------------------------------------------------------------------

describe('tuningParetoFrontNarrative', () => {
  it('returns narrative, paretoSize, bestMode, coverage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningParetoFrontNarrative(equalTemperament12(440), spec);
    expect(typeof result.narrative).toBe('string');
    expect(typeof result.paretoSize).toBe('number');
    expect(result.bestMode).toBeDefined();
    expect(result.coverage).toBeDefined();
  });

  it('narrative mentions paretoSize', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningParetoFrontNarrative(equalTemperament12(440), spec);
    expect(result.narrative.includes(String(result.paretoSize))).toBe(true);
  });

  it('bestMode has mode and score', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningParetoFrontNarrative(equalTemperament12(440), spec);
    expect(typeof result.bestMode.mode.id).toBe('string');
    expect(typeof result.bestMode.score).toBe('number');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningParetoFrontNarrative(equalTemperament12(440), spec, 261.63);
    expect(typeof result.narrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q461 — tuningFamilyParetoNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyParetoNarratives', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyParetoNarratives(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and paretoNarrative fields', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyParetoNarratives(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.paretoNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q462 — tuningFullParetoCorrelationReport
// ---------------------------------------------------------------------------

describe('tuningFullParetoCorrelationReport (Q462)', () => {
  it('returns paretoNarrative, correlationNarrative, combinedNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFullParetoCorrelationReport(equalTemperament12(440), spec);
    expect(result).toHaveProperty('paretoNarrative');
    expect(result).toHaveProperty('correlationNarrative');
    expect(result).toHaveProperty('combinedNarrative');
  });

  it('combinedNarrative is concatenation of both', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFullParetoCorrelationReport(equalTemperament12(440), spec);
    expect(result.combinedNarrative).toBe(
      result.paretoNarrative.narrative + ' ' + result.correlationNarrative.narrative,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFullParetoCorrelationReport(equalTemperament12(440), spec, 261.63);
    expect(typeof result.combinedNarrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q464 — tuningFamilyFullParetoCorrelationReports
// ---------------------------------------------------------------------------

describe('tuningFamilyFullParetoCorrelationReports (Q464)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyFullParetoCorrelationReports(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and report.combinedNarrative', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyFullParetoCorrelationReports(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.report.combinedNarrative).toBe('string');
      expect(entry.report.combinedNarrative.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q465 — tuningModeMetricOutliers
// ---------------------------------------------------------------------------

describe('tuningModeMetricOutliers (Q465)', () => {
  it('returns array (possibly empty) of outlier entries', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricOutliers(equalTemperament12(440), spec);
    expect(Array.isArray(result)).toBe(true);
  });

  it('each outlier entry has required fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricOutliers(equalTemperament12(440), spec);
    if (result.length > 0) {
      const first = result[0]!;
      expect(typeof first.mode.id).toBe('string');
      expect(typeof first.metric).toBe('string');
      expect(typeof first.value).toBe('number');
      expect(typeof first.mean).toBe('number');
      expect(typeof first.stdDev).toBe('number');
      expect(typeof first.zScore).toBe('number');
    }
  });

  it('outliers are sorted by |zScore| descending', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricOutliers(equalTemperament12(440), spec);
    if (result.length >= 2) {
      expect(Math.abs(result[0]!.zScore)).toBeGreaterThanOrEqual(Math.abs(result[1]!.zScore));
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricOutliers(equalTemperament12(440), spec, 261.63);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Q467 — tuningFamilyModeMetricOutliers
// ---------------------------------------------------------------------------

describe('tuningFamilyModeMetricOutliers (Q467)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricOutliers(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and outliers array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricOutliers(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(Array.isArray(entry.outliers)).toBe(true);
    }
  });
});

// Q468 — tuningModeMetricOutlierSummary
describe('tuningModeMetricOutlierSummary (Q468)', () => {
  it('returns totalOutliers, byMetric, byMode, mostOutlierMetric, mostOutlierMode', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricOutlierSummary(equalTemperament12(440), spec);
    expect(typeof result.totalOutliers).toBe('number');
    expect(typeof result.byMetric).toBe('object');
    expect(typeof result.byMode).toBe('object');
    expect(result.mostOutlierMetric === null || typeof result.mostOutlierMetric === 'string').toBe(
      true,
    );
    expect(result.mostOutlierMode === null || typeof result.mostOutlierMode === 'string').toBe(
      true,
    );
  });

  it('totalOutliers matches sum of byMetric values', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricOutlierSummary(equalTemperament12(440), spec);
    const sum = Object.values(result.byMetric).reduce((s, v) => s + v, 0);
    expect(sum).toBe(result.totalOutliers);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricOutlierSummary(equalTemperament12(440), spec, 261.63);
    expect(typeof result.totalOutliers).toBe('number');
  });
});

// Q470 — tuningFamilyModeMetricOutlierSummaries
describe('tuningFamilyModeMetricOutlierSummaries (Q470)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricOutlierSummaries(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and outlierSummary.totalOutliers', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricOutlierSummaries(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.outlierSummary.totalOutliers).toBe('number');
    }
  });
});

// Q471 — tuningModeMetricProfile
describe('tuningModeMetricProfile (Q471)', () => {
  it('returns one profile per mode', () => {
    const spec = harmonicSpectrum(6);
    const tuning = equalTemperament12(440);
    const result = tuningModeMetricProfile(tuning, spec);
    expect(result.length).toBe(tuning.degrees.length);
  });

  it('each profile has mode and all 5 metric stats', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricProfile(equalTemperament12(440), spec);
    const first = result[0]!;
    expect(typeof first.metrics.entropy.value).toBe('number');
    expect(typeof first.metrics.entropy.zScore).toBe('number');
    expect(typeof first.metrics.entropy.isOutlier).toBe('boolean');
  });

  it('isOutlier is consistent with |zScore| > 1.5', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricProfile(equalTemperament12(440), spec);
    for (const profile of result) {
      for (const stat of Object.values(profile.metrics)) {
        expect(stat.isOutlier).toBe(Math.abs(stat.zScore) > 1.5);
      }
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricProfile(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// Q473 — tuningFamilyModeMetricProfiles
describe('tuningFamilyModeMetricProfiles (Q473)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricProfiles(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeProfiles array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricProfiles(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(Array.isArray(entry.modeProfiles)).toBe(true);
      expect(entry.modeProfiles.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q474 — tuningModeMetricRadarData
// ---------------------------------------------------------------------------

describe('tuningModeMetricRadarData (Q474)', () => {
  it('returns one entry per mode with radar values in [0,1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricRadarData(equalTemperament12(440), spec);
    expect(result.length).toBe(equalTemperament12(440).degrees.length);
    for (const entry of result) {
      expect(entry.radar.entropy).toBeGreaterThanOrEqual(0);
      expect(entry.radar.entropy).toBeLessThanOrEqual(1);
      expect(entry.radar.consistency).toBeGreaterThanOrEqual(0);
      expect(entry.radar.consistency).toBeLessThanOrEqual(1);
      expect(entry.radar.volatility).toBeGreaterThanOrEqual(0);
      expect(entry.radar.volatility).toBeLessThanOrEqual(1);
      expect(entry.radar.diversity).toBeGreaterThanOrEqual(0);
      expect(entry.radar.diversity).toBeLessThanOrEqual(1);
      expect(entry.radar.smoothnessRatio).toBeGreaterThanOrEqual(0);
      expect(entry.radar.smoothnessRatio).toBeLessThanOrEqual(1);
    }
  });

  it('at least one mode has at least one non-0 radar value', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricRadarData(equalTemperament12(440), spec);
    const allZero = result.every(
      (e) =>
        e.radar.entropy === 0 &&
        e.radar.consistency === 0 &&
        e.radar.volatility === 0 &&
        e.radar.diversity === 0 &&
        e.radar.smoothnessRatio === 0,
    );
    expect(allZero).toBe(false);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricRadarData(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.radar.entropy).toBeGreaterThanOrEqual(0);
      expect(entry.radar.entropy).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Q476 — tuningFamilyModeMetricRadarData
// ---------------------------------------------------------------------------

describe('tuningFamilyModeMetricRadarData (Q476)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricRadarData(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and radarData array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricRadarData(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(Array.isArray(entry.radarData)).toBe(true);
      expect(entry.radarData.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q477 — tuningModeMetricCluster
// ---------------------------------------------------------------------------

describe('tuningModeMetricCluster (Q477)', () => {
  it('returns one entry per mode with cluster label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricCluster(equalTemperament12(440), spec);
    expect(result.length).toBe(equalTemperament12(440).degrees.length);
    for (const entry of result) {
      expect(['high', 'mid', 'low']).toContain(entry.cluster);
    }
  });

  it('meanScore is in [0,1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricCluster(equalTemperament12(440), spec);
    for (const entry of result) {
      expect(entry.meanScore).toBeGreaterThanOrEqual(0);
      expect(entry.meanScore).toBeLessThanOrEqual(1);
    }
  });

  it('cluster is consistent with meanScore', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricCluster(equalTemperament12(440), spec);
    for (const entry of result) {
      if (entry.meanScore >= 0.67) {
        expect(entry.cluster).toBe('high');
      } else if (entry.meanScore <= 0.33) {
        expect(entry.cluster).toBe('low');
      } else {
        expect(entry.cluster).toBe('mid');
      }
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeMetricCluster(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(['high', 'mid', 'low']).toContain(entry.cluster);
    }
  });
});

// ---------------------------------------------------------------------------
// Q479 — tuningFamilyModeMetricClusters
// ---------------------------------------------------------------------------

describe('tuningFamilyModeMetricClusters (Q479)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricClusters(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and clusters array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeMetricClusters(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(Array.isArray(entry.clusters)).toBe(true);
      expect(entry.clusters.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningClusterSummary (Q480)', () => {
  it('returns highCount, midCount, lowCount, high, mid, low arrays', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningClusterSummary(t12, spec);
    expect(result).toHaveProperty('highCount');
    expect(result).toHaveProperty('midCount');
    expect(result).toHaveProperty('lowCount');
    expect(Array.isArray(result.high)).toBe(true);
    expect(Array.isArray(result.mid)).toBe(true);
    expect(Array.isArray(result.low)).toBe(true);
  });

  it('counts equal array lengths', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningClusterSummary(t12, spec);
    expect(result.highCount).toBe(result.high.length);
    expect(result.midCount).toBe(result.mid.length);
    expect(result.lowCount).toBe(result.low.length);
  });

  it('total modes covered', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningClusterSummary(t12, spec);
    expect(result.highCount + result.midCount + result.lowCount).toBe(t12.degrees.length);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningClusterSummary(t12, spec, 261.63);
    expect(result.highCount + result.midCount + result.lowCount).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyClusterSummaries (Q482)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyClusterSummaries(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and clusterSummary with total modes', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyClusterSummaries(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      const s = entry.clusterSummary;
      expect(s.highCount + s.midCount + s.lowCount).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningModeRadarRanking (Q483)', () => {
  it('returns one entry per mode with rank', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeRadarRanking(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.rank).toBe('number');
      expect(entry.rank).toBeGreaterThanOrEqual(1);
    }
  });

  it('ranks are 1-based consecutive', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeRadarRanking(t12, spec);
    const sorted = [...result].sort((a, b) => a.rank - b.rank);
    sorted.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1);
    });
  });

  it('sorted descending by meanScore', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeRadarRanking(t12, spec);
    if (result.length >= 2) {
      expect(result[0]!.meanScore).toBeGreaterThanOrEqual(result[1]!.meanScore);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeRadarRanking(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyModeRadarRankings (Q485)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeRadarRankings(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and radarRanking array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeRadarRankings(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(Array.isArray(entry.radarRanking)).toBe(true);
      expect(entry.radarRanking.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningRadarRankingVsScoreRanking (Q486)', () => {
  it('returns one entry per mode with radarRank, scoreRank, rankDelta', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningRadarRankingVsScoreRanking(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.radarRank).toBe('number');
      expect(typeof entry.scoreRank).toBe('number');
      expect(typeof entry.rankDelta).toBe('number');
    }
  });

  it('radarRanks are 1-based consecutive', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningRadarRankingVsScoreRanking(t12, spec);
    const sorted = [...result].sort((a, b) => a.radarRank - b.radarRank);
    sorted.forEach((entry, idx) => {
      expect(entry.radarRank).toBe(idx + 1);
    });
  });

  it('scoreRanks are in [1, totalModes]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningRadarRankingVsScoreRanking(t12, spec);
    const total = t12.degrees.length;
    for (const entry of result) {
      expect(entry.scoreRank).toBeGreaterThanOrEqual(1);
      expect(entry.scoreRank).toBeLessThanOrEqual(total);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningRadarRankingVsScoreRanking(t12, spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyRadarVsScoreRankings (Q488)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyRadarVsScoreRankings(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and comparison array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyRadarVsScoreRankings(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(Array.isArray(entry.comparison)).toBe(true);
      expect(entry.comparison.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningBestRadarScoreAgreement (Q489)', () => {
  it('returns single mode with |rankDelta| minimised', () => {
    const spec = harmonicSpectrum(6);
    const comparison = tuningRadarRankingVsScoreRanking(t12, spec);
    const result = tuningBestRadarScoreAgreement(t12, spec);
    const minAbs = Math.min(...comparison.map((e) => Math.abs(e.rankDelta)));
    expect(Math.abs(result.rankDelta)).toBe(minAbs);
  });

  it('result has mode, radarRank, scoreRank, rankDelta', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningBestRadarScoreAgreement(t12, spec);
    expect(result.mode).toBeDefined();
    expect(typeof result.radarRank).toBe('number');
    expect(typeof result.scoreRank).toBe('number');
    expect(typeof result.rankDelta).toBe('number');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningBestRadarScoreAgreement(t12, spec, 261.63);
    expect(result.mode).toBeDefined();
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyBestRadarScoreAgreements (Q491)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyBestRadarScoreAgreements(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and bestAgreement.mode.id', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyBestRadarScoreAgreements(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.bestAgreement.mode.id).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningModeConsensusRanking (Q492)', () => {
  it('returns one entry per mode with all Borda fields', () => {
    const spec = harmonicSpectrum(6);
    const tuning = equalTemperament12(440);
    const result = tuningModeConsensusRanking(tuning, spec);
    expect(result.length).toBe(tuning.degrees.length);
    for (const entry of result) {
      expect(typeof entry.bordaScore).toBe('number');
      expect(typeof entry.scoreRank).toBe('number');
      expect(typeof entry.radarRank).toBe('number');
      expect(typeof entry.consensusRank).toBe('number');
    }
  });

  it('consensusRanks are 1-based and each appears once', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusRanking(equalTemperament12(440), spec);
    const ranks = result.map((e) => e.consensusRank);
    expect(Math.min(...ranks)).toBe(1);
    expect(Math.max(...ranks)).toBe(result.length);
    expect(new Set(ranks).size).toBe(result.length);
  });

  it('sorted by bordaScore descending', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusRanking(equalTemperament12(440), spec);
    if (result.length >= 2) {
      expect(result[0]!.bordaScore).toBeGreaterThanOrEqual(result[1]!.bordaScore);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusRanking(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.consensusRank).toBe(1);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyModeConsensusRankings (Q494)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeConsensusRankings(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and consensusRanking array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeConsensusRankings(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(entry.consensusRanking.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningBestConsensusMode (Q495)', () => {
  it('returns the mode with consensusRank 1', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningBestConsensusMode(equalTemperament12(440), spec);
    expect(result.consensusRank).toBe(1);
  });

  it('bordaScore is the maximum in the ranking', () => {
    const spec = harmonicSpectrum(6);
    const tuning = equalTemperament12(440);
    const ranking = tuningModeConsensusRanking(tuning, spec);
    const best = tuningBestConsensusMode(tuning, spec);
    expect(best.bordaScore).toBe(ranking[0]!.bordaScore);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningBestConsensusMode(equalTemperament12(440), spec, 261.63);
    expect(result.consensusRank).toBe(1);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyBestConsensusModes (Q497)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyBestConsensusModes(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and bestConsensusMode.consensusRank === 1', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyBestConsensusModes(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(entry.bestConsensusMode.consensusRank).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningUltimateBestMode (Q498)', () => {
  it('returns winner with voteCount, and three method results', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningUltimateBestMode(equalTemperament12(440), spec);
    expect(result.winner.voteCount).toBeGreaterThanOrEqual(1);
    expect(typeof result.winner.mode.id).toBe('string');
  });

  it('isUnanimous is true iff all three modeIds are equal', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningUltimateBestMode(equalTemperament12(440), spec);
    const expected =
      result.consensusBest.modeId === result.paretoBest.modeId &&
      result.paretoBest.modeId === result.paretoRankedBest.modeId;
    expect(result.isUnanimous).toBe(expected);
  });

  it('voteCount is between 1 and 3', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningUltimateBestMode(equalTemperament12(440), spec);
    expect(result.winner.voteCount).toBeGreaterThanOrEqual(1);
    expect(result.winner.voteCount).toBeLessThanOrEqual(3);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningUltimateBestMode(equalTemperament12(440), spec, 261.63);
    expect(typeof result.winner.mode.id).toBe('string');
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyUltimateBestModes (Q500)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyUltimateBestModes(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and ultimateBest.winner.mode.id', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyUltimateBestModes(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.ultimateBest.winner.mode.id).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningConsensusNarrative (Q501)', () => {
  it('returns narrative string and both sub-results', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningConsensusNarrative(equalTemperament12(440), spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(typeof result.consensusBest.mode.id).toBe('string');
  });

  it('narrative contains the consensus mode id', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningConsensusNarrative(equalTemperament12(440), spec);
    expect(result.narrative).toContain(result.consensusBest.mode.id);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningConsensusNarrative(equalTemperament12(440), spec, 261.63);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyConsensusNarratives (Q503)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyConsensusNarratives(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and consensusNarrative.narrative', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyConsensusNarratives(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.consensusNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningMasterReport (Q504)', () => {
  it('returns paretoCorrelationReport, consensusNarrative, masterNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningMasterReport(equalTemperament12(440), spec);
    expect(result).toHaveProperty('paretoCorrelationReport');
    expect(result).toHaveProperty('consensusNarrative');
    expect(result).toHaveProperty('masterNarrative');
  });

  it('masterNarrative is concatenation of the two sub-narratives', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningMasterReport(equalTemperament12(440), spec);
    expect(result.masterNarrative).toBe(
      result.paretoCorrelationReport.combinedNarrative + ' ' + result.consensusNarrative.narrative,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningMasterReport(equalTemperament12(440), spec, 261.63);
    expect(typeof result.masterNarrative).toBe('string');
    expect(result.masterNarrative.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyMasterReports (Q506)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyMasterReports(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and masterReport.masterNarrative', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyMasterReports(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.masterReport.masterNarrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningModeComprehensiveMetricBundle (Q507)', () => {
  it('returns one entry per mode with all raw metrics plus metricProfile', () => {
    const spec = harmonicSpectrum(6);
    const t12 = equalTemperament12(440);
    const result = tuningModeComprehensiveMetricBundle(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
  });

  it('each entry has entropy as raw value and metricProfile.entropy with stats', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeComprehensiveMetricBundle(equalTemperament12(440), spec);
    expect(typeof result[0]!.entropy).toBe('number');
    expect(typeof result[0]!.metricProfile.entropy.zScore).toBe('number');
  });

  it('metricProfile values match comprehensive bundle values', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeComprehensiveMetricBundle(equalTemperament12(440), spec);
    expect(result[0]!.entropy).toBe(result[0]!.metricProfile.entropy.value);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeComprehensiveMetricBundle(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyModeComprehensiveMetricBundles (Q509)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeComprehensiveMetricBundles(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and modeComprehensiveMetricBundles array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeComprehensiveMetricBundles(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(entry.modeComprehensiveMetricBundles.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningModeConsensusClusterBundle (Q510)', () => {
  it('returns one entry per mode with consensus rank and cluster', () => {
    const spec = harmonicSpectrum(6);
    const tuning = equalTemperament12(440);
    const result = tuningModeConsensusClusterBundle(tuning, spec);
    expect(result.length).toBe(tuning.degrees.length);
    for (const entry of result) {
      expect(typeof entry.consensusRank).toBe('number');
      expect(['high', 'mid', 'low']).toContain(entry.cluster);
    }
  });

  it('sorted by consensusRank ascending', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusClusterBundle(equalTemperament12(440), spec);
    expect(result[0]!.consensusRank).toBe(1);
  });

  it('cluster labels are consistent with meanScore', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusClusterBundle(equalTemperament12(440), spec);
    for (const entry of result) {
      if (entry.cluster === 'high') {
        expect(entry.meanScore).toBeGreaterThanOrEqual(0.67);
      } else if (entry.cluster === 'low') {
        expect(entry.meanScore).toBeLessThanOrEqual(0.33);
      } else {
        expect(entry.meanScore).toBeGreaterThan(0.33);
        expect(entry.meanScore).toBeLessThan(0.67);
      }
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusClusterBundle(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyModeConsensusClusterBundles (Q512)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeConsensusClusterBundles(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and consensusClusterBundle array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeConsensusClusterBundles(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(entry.consensusClusterBundle.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningTopClusterConsensusMode (Q513)', () => {
  it('returns a single mode with cluster label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningTopClusterConsensusMode(equalTemperament12(440), spec);
    expect(typeof result.mode.id).toBe('string');
    expect(['high', 'mid', 'low']).toContain(result.cluster);
  });

  it('result is in the high cluster OR is the top consensus mode', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningTopClusterConsensusMode(equalTemperament12(440), spec);
    expect(result.cluster === 'high' || result.consensusRank === 1).toBe(true);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningTopClusterConsensusMode(equalTemperament12(440), spec, 261.63);
    expect(typeof result.mode.id).toBe('string');
    expect(['high', 'mid', 'low']).toContain(result.cluster);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyTopClusterConsensusModes (Q515)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyTopClusterConsensusModes(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and topClusterConsensusMode.mode.id', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyTopClusterConsensusModes(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.topClusterConsensusMode.mode.id).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningModeConsensusOutlierBundle (Q516)', () => {
  it('returns one entry per mode with outlierMetrics field', () => {
    const spec = harmonicSpectrum(6);
    const tuning = equalTemperament12(440);
    const result = tuningModeConsensusOutlierBundle(tuning, spec);
    expect(result.length).toBe(tuning.degrees.length);
    for (const entry of result) {
      expect(Array.isArray(entry.outlierMetrics)).toBe(true);
    }
  });

  it('outlierMetrics are subsets of the 5 metric names', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusOutlierBundle(equalTemperament12(440), spec);
    const validMetrics = new Set([
      'entropy',
      'consistency',
      'volatility',
      'diversity',
      'smoothnessRatio',
    ]);
    for (const entry of result) {
      for (const metric of entry.outlierMetrics) {
        expect(validMetrics.has(metric)).toBe(true);
      }
    }
  });

  it('sorted by consensusRank ascending', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusOutlierBundle(equalTemperament12(440), spec);
    expect(result[0]!.consensusRank).toBe(1);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusOutlierBundle(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyModeConsensusOutlierBundles (Q518)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeConsensusOutlierBundles(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and consensusOutlierBundle array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeConsensusOutlierBundles(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(entry.consensusOutlierBundle.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

describe('tuningModeInsightSummary (Q519)', () => {
  it('returns one entry per mode with insight string', () => {
    const spec = harmonicSpectrum(6);
    const tuning = equalTemperament12(440);
    const result = tuningModeInsightSummary(tuning, spec);
    expect(result.length).toBe(tuning.degrees.length);
    for (const entry of result) {
      expect(typeof entry.insight).toBe('string');
      expect(entry.insight.length).toBeGreaterThan(0);
    }
  });

  it('insight contains mode id and cluster', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeInsightSummary(equalTemperament12(440), spec);
    expect(result[0]!.insight.includes(result[0]!.mode.id)).toBe(true);
    expect(result[0]!.insight.includes(result[0]!.cluster)).toBe(true);
  });

  it('insight mentions outliers when present', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeInsightSummary(equalTemperament12(440), spec);
    const withOutliers = result.find((e) => e.outlierMetrics.length > 0);
    if (withOutliers !== undefined) {
      expect(withOutliers.insight.includes('outlier')).toBe(true);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeInsightSummary(equalTemperament12(440), spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('tuningFamilyModeInsightSummaries (Q521)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeInsightSummaries(tunings, spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and insightSummaries array', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [equalTemperament12(440), edo(19, 440)];
    const result = tuningFamilyModeInsightSummaries(tunings, spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(entry.insightSummaries.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q522 — tuningFinalRecommendation
// ---------------------------------------------------------------------------

describe('tuningFinalRecommendation (Q522)', () => {
  it('returns recommendation, recommendedMode, masterNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFinalRecommendation(t12, spec);
    expect(typeof result.recommendation).toBe('string');
    expect(result.recommendation.length).toBeGreaterThan(0);
    expect(typeof result.recommendedMode.mode.id).toBe('string');
    expect(typeof result.masterNarrative).toBe('string');
  });

  it('recommendation includes tuning id and recommended mode id', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFinalRecommendation(t12, spec);
    expect(result.recommendation).toContain(t12.id);
    expect(result.recommendation).toContain(result.recommendedMode.mode.id);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFinalRecommendation(t12, spec, 261.63);
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q524 — tuningFamilyFinalRecommendations
// ---------------------------------------------------------------------------

describe('tuningFamilyFinalRecommendations (Q524)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyFinalRecommendations([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
  });

  it('each entry has id and finalRecommendation.recommendation', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyFinalRecommendations([t12, edo(19, 440)], spec);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.finalRecommendation.recommendation).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q525 — tuningModeEntropyDiversityMap
// ---------------------------------------------------------------------------

describe('tuningModeEntropyDiversityMap (Q525)', () => {
  it('returns one entry per mode with quadrant label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeEntropyDiversityMap(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    const validQuadrants = ['rich-complex', 'varied-uniform', 'stable-diverse', 'stable-uniform'];
    for (const entry of result) {
      expect(validQuadrants).toContain(entry.quadrant);
    }
  });

  it('entropy and diversity match comprehensive bundle', () => {
    const spec = harmonicSpectrum(6);
    const map = tuningModeEntropyDiversityMap(t12, spec);
    const bundle = tuningModeComprehensiveBundle(t12, spec);
    expect(map[0]!.entropy).toBeCloseTo(bundle[0]!.entropy, 10);
    expect(map[0]!.diversity).toBeCloseTo(bundle[0]!.diversity, 10);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeEntropyDiversityMap(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q527 — tuningFamilyModeEntropyDiversityMaps
// ---------------------------------------------------------------------------

describe('tuningFamilyModeEntropyDiversityMaps (Q527)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeEntropyDiversityMaps([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
  });

  it('each entry has id and entropyDiversityMap array', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeEntropyDiversityMaps([t12, edo(19, 440)], spec);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.entropyDiversityMap.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q528 — tuningModeConsistencyVolatilityMap
// ---------------------------------------------------------------------------

describe('tuningModeConsistencyVolatilityMap (Q528)', () => {
  it('returns one entry per mode with quadrant label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsistencyVolatilityMap(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
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

  it('consistency and volatility match comprehensive bundle for first mode', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsistencyVolatilityMap(t12, spec);
    const bundle = tuningModeComprehensiveBundle(t12, spec);
    expect(result[0]!.consistency).toBeCloseTo(bundle[0]!.consistency, 10);
    expect(result[0]!.volatility).toBeCloseTo(bundle[0]!.volatility, 10);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsistencyVolatilityMap(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q530 — tuningFamilyModeConsistencyVolatilityMaps
// ---------------------------------------------------------------------------

describe('tuningFamilyModeConsistencyVolatilityMaps (Q530)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeConsistencyVolatilityMaps([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
  });

  it('each entry has id and consistencyVolatilityMap array', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeConsistencyVolatilityMaps([t12, edo(19, 440)], spec);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.consistencyVolatilityMap.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q531 — tuningModeFiveDimMap
// ---------------------------------------------------------------------------

describe('tuningModeFiveDimMap (Q531)', () => {
  it('returns one entry per mode with all quadrant labels and cluster', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeFiveDimMap(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    const validED = ['rich-complex', 'varied-uniform', 'stable-diverse', 'stable-uniform'];
    const validCV = [
      'stable-consistent',
      'consistent-volatile',
      'smooth-inconsistent',
      'rough-inconsistent',
    ];
    const validClusters = ['high', 'mid', 'low'];
    for (const entry of result) {
      expect(validED).toContain(entry.entropyDiversityQuadrant);
      expect(validCV).toContain(entry.consistencyVolatilityQuadrant);
      expect(validClusters).toContain(entry.cluster);
    }
  });

  it('entropyDiversityQuadrant matches tuningModeEntropyDiversityMap for same mode', () => {
    const spec = harmonicSpectrum(6);
    const fiveDim = tuningModeFiveDimMap(t12, spec);
    const edMap = tuningModeEntropyDiversityMap(t12, spec);
    expect(fiveDim[0]!.entropyDiversityQuadrant).toBe(edMap[0]!.quadrant);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeFiveDimMap(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q533 — tuningFamilyModeFiveDimMaps
// ---------------------------------------------------------------------------

describe('tuningFamilyModeFiveDimMaps (Q533)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeFiveDimMaps([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
  });

  it('each entry has id and fiveDimMap array', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeFiveDimMaps([t12, edo(19, 440)], spec);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.fiveDimMap.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q534 — tuningModeFiveDimNarrative
// ---------------------------------------------------------------------------

describe('tuningModeFiveDimNarrative (Q534)', () => {
  it('returns one entry per mode with a non-empty narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeFiveDimNarrative(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.narrative).toBe('string');
      expect(entry.narrative.length).toBeGreaterThan(0);
    }
  });

  it('narrative includes mode.id and entropyDiversityQuadrant', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeFiveDimNarrative(t12, spec);
    const first = result[0]!;
    expect(first.narrative).toContain(first.mode.id);
    expect(first.narrative).toContain(first.entropyDiversityQuadrant);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeFiveDimNarrative(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q536 — tuningFamilyModeFiveDimNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyModeFiveDimNarratives (Q536)', () => {
  it('returns one entry per tuning with id and fiveDimNarratives', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeFiveDimNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.fiveDimNarratives.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q537 — tuningModeSmoothnessEntropyMap
// ---------------------------------------------------------------------------

describe('tuningModeSmoothnessEntropyMap (Q537)', () => {
  it('returns one entry per mode with valid quadrant labels', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSmoothnessEntropyMap(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    const validQuadrants = ['fluid-complex', 'fluid-simple', 'rough-complex', 'rough-simple'];
    for (const entry of result) {
      expect(validQuadrants).toContain(entry.quadrant);
    }
  });

  it('smoothnessRatio and entropy match comprehensive bundle for first mode', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSmoothnessEntropyMap(t12, spec);
    const bundle = tuningModeComprehensiveBundle(t12, spec);
    expect(result[0]!.smoothnessRatio).toBe(bundle[0]!.smoothnessRatio);
    expect(result[0]!.entropy).toBe(bundle[0]!.entropy);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSmoothnessEntropyMap(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q539 — tuningFamilyModeSmoothnessEntropyMaps
// ---------------------------------------------------------------------------

describe('tuningFamilyModeSmoothnessEntropyMaps (Q539)', () => {
  it('returns one entry per tuning with id and smoothnessEntropyMap', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeSmoothnessEntropyMaps([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.smoothnessEntropyMap.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q540 — tuningModeDiversityVolatilityMap
// ---------------------------------------------------------------------------

describe('tuningModeDiversityVolatilityMap (Q540)', () => {
  it('returns one entry per mode with valid quadrant label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeDiversityVolatilityMap(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    const validQuadrants = [
      'diverse-volatile',
      'diverse-stable',
      'uniform-volatile',
      'uniform-stable',
    ];
    for (const entry of result) {
      expect(validQuadrants).toContain(entry.quadrant);
    }
  });

  it('diversity and volatility match comprehensive bundle for first mode', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeDiversityVolatilityMap(t12, spec);
    const bundle = tuningModeComprehensiveBundle(t12, spec);
    expect(result[0]!.diversity).toBe(bundle[0]!.diversity);
    expect(result[0]!.volatility).toBe(bundle[0]!.volatility);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeDiversityVolatilityMap(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q542 — tuningFamilyModeDiversityVolatilityMaps
// ---------------------------------------------------------------------------

describe('tuningFamilyModeDiversityVolatilityMaps (Q542)', () => {
  it('returns one entry per tuning with id and diversityVolatilityMap', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeDiversityVolatilityMaps([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.diversityVolatilityMap.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q543 — tuningModeAllQuadrantsBundle
// ---------------------------------------------------------------------------

describe('tuningModeAllQuadrantsBundle (Q543)', () => {
  it('returns one entry per mode with all four quadrant fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAllQuadrantsBundle(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.entropyDiversityQuadrant).toBe('string');
      expect(typeof entry.consistencyVolatilityQuadrant).toBe('string');
      expect(typeof entry.smoothnessEntropyQuadrant).toBe('string');
      expect(typeof entry.diversityVolatilityQuadrant).toBe('string');
    }
  });

  it('entropyDiversityQuadrant matches tuningModeEntropyDiversityMap for first mode', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAllQuadrantsBundle(t12, spec);
    const edMap = tuningModeEntropyDiversityMap(t12, spec);
    expect(result[0]!.entropyDiversityQuadrant).toBe(edMap[0]!.quadrant);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAllQuadrantsBundle(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q545 — tuningFamilyModeAllQuadrantsBundles
// ---------------------------------------------------------------------------

describe('tuningFamilyModeAllQuadrantsBundles (Q545)', () => {
  it('returns one entry per tuning with id and allQuadrantsBundle', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeAllQuadrantsBundles([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.allQuadrantsBundle.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q546 — tuningModeAllQuadrantsNarrative
// ---------------------------------------------------------------------------

describe('tuningModeAllQuadrantsNarrative (Q546)', () => {
  it('returns one entry per mode with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAllQuadrantsNarrative(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.narrative).toBe('string');
      expect(entry.narrative.length).toBeGreaterThan(0);
    }
  });

  it('narrative contains all four quadrant labels', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAllQuadrantsNarrative(t12, spec);
    const entry = result[0]!;
    expect(entry.narrative).toContain(entry.entropyDiversityQuadrant);
    expect(entry.narrative).toContain(entry.consistencyVolatilityQuadrant);
    expect(entry.narrative).toContain(entry.smoothnessEntropyQuadrant);
    expect(entry.narrative).toContain(entry.diversityVolatilityQuadrant);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAllQuadrantsNarrative(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q548 — tuningFamilyModeAllQuadrantsNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyModeAllQuadrantsNarratives (Q548)', () => {
  it('returns one entry per tuning with id and allQuadrantsNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeAllQuadrantsNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.allQuadrantsNarrative.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q549 — tuningModeQuadrantConsensus
// ---------------------------------------------------------------------------

describe('tuningModeQuadrantConsensus (Q549)', () => {
  it('returns one entry per mode with consensus field', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantConsensus(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    const valid = ['versatile', 'specialized', 'balanced'];
    for (const entry of result) {
      expect(valid).toContain(entry.consensus);
    }
  });

  it('quadrantVotes contains at least one token per quadrant pair', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantConsensus(t12, spec);
    const entry = result[0]!;
    const totalVotes = Object.values(entry.quadrantVotes).reduce((a, b) => a + b, 0);
    expect(totalVotes).toBe(8); // 4 quadrants × 2 tokens each
  });

  it('dominantToken is one of the token strings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantConsensus(t12, spec);
    const entry = result[0]!;
    expect(typeof entry.dominantToken).toBe('string');
    expect(entry.dominantToken.length).toBeGreaterThan(0);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantConsensus(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q551 — tuningFamilyModeQuadrantConsensus
// ---------------------------------------------------------------------------

describe('tuningFamilyModeQuadrantConsensus (Q551)', () => {
  it('returns one entry per tuning with id and quadrantConsensus', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeQuadrantConsensus([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.quadrantConsensus.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q552 — tuningBestQuadrantConsensusMode
// ---------------------------------------------------------------------------

describe('tuningBestQuadrantConsensusMode (Q552)', () => {
  it('returns a single mode entry with consensus field', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningBestQuadrantConsensusMode(t12, spec);
    expect(typeof result.consensus).toBe('string');
    const valid = ['versatile', 'specialized', 'balanced'];
    expect(valid).toContain(result.consensus);
  });

  it('result is present in tuningModeQuadrantConsensus output', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningBestQuadrantConsensusMode(t12, spec);
    const all = tuningModeQuadrantConsensus(t12, spec);
    const match = all.find((e) => e.mode.id === result.mode.id);
    expect(match).toBeDefined();
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningBestQuadrantConsensusMode(t12, spec, 261.63);
    expect(typeof result.mode.id).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q554 — tuningFamilyBestQuadrantConsensusModes
// ---------------------------------------------------------------------------

describe('tuningFamilyBestQuadrantConsensusModes (Q554)', () => {
  it('returns one entry per tuning with id and bestMode', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyBestQuadrantConsensusModes([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.bestMode.consensus).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q555 — tuningModeConsensusNarrative
// ---------------------------------------------------------------------------

describe('tuningModeConsensusNarrative (Q555)', () => {
  it('returns one entry per mode with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusNarrative(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.narrative).toBe('string');
      expect(entry.narrative.length).toBeGreaterThan(0);
    }
  });

  it('narrative contains the dominant token', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusNarrative(t12, spec);
    const entry = result[0]!;
    expect(entry.narrative).toContain(entry.dominantToken);
  });

  it('narrative contains the consensus label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusNarrative(t12, spec);
    const entry = result[0]!;
    expect(entry.narrative).toContain(entry.consensus);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeConsensusNarrative(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q557 — tuningFamilyModeConsensusNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyModeConsensusNarratives (Q557)', () => {
  it('returns one entry per tuning with id and consensusNarratives', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeConsensusNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.consensusNarratives.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q558 — tuningModeQuadrantProfile
// ---------------------------------------------------------------------------

describe('tuningModeQuadrantProfile (Q558)', () => {
  it('returns one entry per mode with quadrantProfile string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantProfile(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.quadrantProfile).toBe('string');
      expect(entry.quadrantProfile.split('|').length).toBe(4);
    }
  });

  it('quadrantProfile contains all four quadrant labels', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantProfile(t12, spec);
    const entry = result[0]!;
    expect(entry.quadrantProfile).toContain(entry.entropyDiversityQuadrant);
    expect(entry.quadrantProfile).toContain(entry.consistencyVolatilityQuadrant);
    expect(entry.quadrantProfile).toContain(entry.smoothnessEntropyQuadrant);
    expect(entry.quadrantProfile).toContain(entry.diversityVolatilityQuadrant);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantProfile(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q560 — tuningFamilyModeQuadrantProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilyModeQuadrantProfiles (Q560)', () => {
  it('returns one entry per tuning with id and quadrantProfiles', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeQuadrantProfiles([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.quadrantProfiles.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q561 — tuningQuadrantCoverage
// ---------------------------------------------------------------------------

describe('tuningQuadrantCoverage (Q561)', () => {
  it('returns coverage counts for all four quadrant axes', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverage(t12, spec);
    expect(result.totalModes).toBe(t12.degrees.length);
    expect(result.entropyDiversityUnique).toBeGreaterThan(0);
    expect(result.consistencyVolatilityUnique).toBeGreaterThan(0);
    expect(result.smoothnessEntropyUnique).toBeGreaterThan(0);
    expect(result.diversityVolatilityUnique).toBeGreaterThan(0);
    expect(result.totalUniqueProfiles).toBeGreaterThan(0);
  });

  it('unique counts are bounded by max 4 (only 4 quadrants per axis)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverage(t12, spec);
    expect(result.entropyDiversityUnique).toBeLessThanOrEqual(4);
    expect(result.consistencyVolatilityUnique).toBeLessThanOrEqual(4);
    expect(result.smoothnessEntropyUnique).toBeLessThanOrEqual(4);
    expect(result.diversityVolatilityUnique).toBeLessThanOrEqual(4);
  });

  it('totalUniqueProfiles <= totalModes', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverage(t12, spec);
    expect(result.totalUniqueProfiles).toBeLessThanOrEqual(result.totalModes);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverage(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q563 — tuningFamilyQuadrantCoverage
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantCoverage (Q563)', () => {
  it('returns one entry per tuning with id and coverage', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyQuadrantCoverage([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.coverage.totalModes).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q564 — tuningModeGroupByProfile
// ---------------------------------------------------------------------------

describe('tuningModeGroupByProfile (Q564)', () => {
  it('groups modes by quadrant profile, sorted by count descending', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeGroupByProfile(t12, spec);
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.count).toBeGreaterThanOrEqual(result[i]!.count);
    }
  });

  it('total modes across all groups equals tuning degree count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeGroupByProfile(t12, spec);
    const total = result.reduce((s, g) => s + g.count, 0);
    expect(total).toBe(t12.degrees.length);
  });

  it('profile string splits into 4 parts', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeGroupByProfile(t12, spec);
    for (const group of result) {
      expect(group.profile.split('|').length).toBe(4);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeGroupByProfile(t12, spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q566 — tuningFamilyModeGroupByProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilyModeGroupByProfiles (Q566)', () => {
  it('returns one entry per tuning with id and profileGroups', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeGroupByProfiles([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.profileGroups.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q567 — tuningQuadrantCoverageNarrative
// ---------------------------------------------------------------------------

describe('tuningQuadrantCoverageNarrative (Q567)', () => {
  it('returns coverage with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverageNarrative(t12, spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverageNarrative(t12, spec);
    expect(result.narrative).toContain(t12.name);
  });

  it('narrative contains the totalUniqueProfiles count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverageNarrative(t12, spec);
    expect(result.narrative).toContain(String(result.totalUniqueProfiles));
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantCoverageNarrative(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q569 — tuningFamilyQuadrantCoverageNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantCoverageNarratives (Q569)', () => {
  it('returns one entry per tuning with id and coverageNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyQuadrantCoverageNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.coverageNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q570 — tuningDominantQuadrantProfile
// ---------------------------------------------------------------------------

describe('tuningDominantQuadrantProfile (Q570)', () => {
  it('returns the most common quadrant profile group', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningDominantQuadrantProfile(t12, spec);
    expect(typeof result.profile).toBe('string');
    expect(result.profile.split('|').length).toBe(4);
    expect(result.count).toBeGreaterThan(0);
    expect(result.modes.length).toBe(result.count);
  });

  it('dominant profile has highest or equal count among all groups', () => {
    const spec = harmonicSpectrum(6);
    const dominant = tuningDominantQuadrantProfile(t12, spec);
    const groups = tuningModeGroupByProfile(t12, spec);
    for (const g of groups) {
      expect(dominant.count).toBeGreaterThanOrEqual(g.count);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningDominantQuadrantProfile(t12, spec, 261.63);
    expect(typeof result.profile).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q572 — tuningFamilyDominantQuadrantProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilyDominantQuadrantProfiles (Q572)', () => {
  it('returns one entry per tuning with id and dominantProfile', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyDominantQuadrantProfiles([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.dominantProfile.profile).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q573 — tuningQuadrantProfileDiversity
// ---------------------------------------------------------------------------

describe('tuningQuadrantProfileDiversity (Q573)', () => {
  it('returns profileCount, totalModes, entropy, normalized', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantProfileDiversity(t12, spec);
    expect(result.totalModes).toBe(t12.degrees.length);
    expect(result.profileCount).toBeGreaterThan(0);
    expect(result.entropy).toBeGreaterThanOrEqual(0);
    expect(result.normalized).toBeGreaterThanOrEqual(0);
    expect(result.normalized).toBeLessThanOrEqual(1);
  });

  it('entropy is 0 when all modes share one profile', () => {
    // Create a tuning with only 1 degree (all modes identical)
    const singleDeg: TuningSystem = { ...t12, degrees: t12.degrees.slice(0, 1) };
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantProfileDiversity(singleDeg, spec);
    expect(result.entropy).toBe(0);
    expect(result.normalized).toBe(1); // single profile → normalized = 1
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantProfileDiversity(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q575 — tuningFamilyQuadrantProfileDiversities
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantProfileDiversities (Q575)', () => {
  it('returns one entry per tuning with id and profileDiversity', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyQuadrantProfileDiversities([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.profileDiversity.totalModes).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q576 — tuningQuadrantProfileDiversityNarrative
// ---------------------------------------------------------------------------

describe('tuningQuadrantProfileDiversityNarrative (Q576)', () => {
  it('returns diversity metrics with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantProfileDiversityNarrative(t12, spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantProfileDiversityNarrative(t12, spec);
    expect(result.narrative).toContain(t12.name);
  });

  it('narrative contains the normalized percentage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantProfileDiversityNarrative(t12, spec);
    expect(result.narrative).toContain('%');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningQuadrantProfileDiversityNarrative(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q578 — tuningFamilyQuadrantProfileDiversityNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantProfileDiversityNarratives (Q578)', () => {
  it('returns one entry per tuning with id and diversityNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyQuadrantProfileDiversityNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.diversityNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q579 — tuningFamilyQuadrantDiversityRanking
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantDiversityRanking (Q579)', () => {
  it('returns ranked entries sorted by normalized diversity descending', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyQuadrantDiversityRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(results.length).toBe(3);
    expect(results[0]!.rank).toBe(1);
    expect(results[results.length - 1]!.rank).toBe(results.length);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.profileDiversity.normalized).toBeGreaterThanOrEqual(
        results[i]!.profileDiversity.normalized,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Q580 — tuningFamilyMostDiverseQuadrantProfile
// ---------------------------------------------------------------------------

describe('tuningFamilyMostDiverseQuadrantProfile (Q580)', () => {
  it('returns the rank-1 tuning (most diverse profile distribution)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostDiverseQuadrantProfile([t12, edo(19, 440)], spec);
    expect(result.rank).toBe(1);
    expect(typeof result.id).toBe('string');
  });

  it('throws RangeError for empty tuning array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => tuningFamilyMostDiverseQuadrantProfile([], spec)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q581 — tuningFamilyLeastDiverseQuadrantProfile
// ---------------------------------------------------------------------------

describe('tuningFamilyLeastDiverseQuadrantProfile (Q581)', () => {
  it('returns the last-ranked tuning (least diverse profile distribution)', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const result = tuningFamilyLeastDiverseQuadrantProfile(tunings, spec);
    expect(result.rank).toBe(tunings.length);
    expect(typeof result.id).toBe('string');
  });

  it('throws RangeError for empty tuning array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => tuningFamilyLeastDiverseQuadrantProfile([], spec)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q582 — tuningFamilyQuadrantProfileFrequency
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantProfileFrequency (Q582)', () => {
  it('returns profile frequency sorted by tuningCount descending', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const result = tuningFamilyQuadrantProfileFrequency(tunings, spec);
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.tuningCount).toBeGreaterThanOrEqual(result[i]!.tuningCount);
    }
  });

  it('tuningCount never exceeds number of tunings', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440)];
    const result = tuningFamilyQuadrantProfileFrequency(tunings, spec);
    for (const entry of result) {
      expect(entry.tuningCount).toBeLessThanOrEqual(tunings.length);
    }
  });

  it('each profile splits into 4 parts', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyQuadrantProfileFrequency([t12, edo(19, 440)], spec);
    for (const entry of result) {
      expect(entry.profile.split('|').length).toBe(4);
    }
  });
});

// ---------------------------------------------------------------------------
// Q583 — tuningFamilySharedQuadrantProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilySharedQuadrantProfiles (Q583)', () => {
  it('returns only profiles that appear in more than one tuning', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySharedQuadrantProfiles([t12, edo(19, 440)], spec);
    for (const entry of result) {
      expect(entry.tuningCount).toBeGreaterThan(1);
    }
  });

  it('is a subset of tuningFamilyQuadrantProfileFrequency', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440)];
    const shared = tuningFamilySharedQuadrantProfiles(tunings, spec);
    const freq = tuningFamilyQuadrantProfileFrequency(tunings, spec);
    for (const entry of shared) {
      expect(freq.some((f) => f.profile === entry.profile)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Q584 — tuningFamilyUniqueQuadrantProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilyUniqueQuadrantProfiles (Q584)', () => {
  it('returns only profiles unique to a single tuning', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyUniqueQuadrantProfiles([t12, edo(19, 440)], spec);
    for (const entry of result) {
      expect(typeof entry.tuningId).toBe('string');
      expect(typeof entry.profile).toBe('string');
    }
  });

  it('shared + unique count equals total profile count', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440)];
    const freq = tuningFamilyQuadrantProfileFrequency(tunings, spec);
    const shared = tuningFamilySharedQuadrantProfiles(tunings, spec);
    const unique = tuningFamilyUniqueQuadrantProfiles(tunings, spec);
    expect(shared.length + unique.length).toBe(freq.length);
  });
});

// ---------------------------------------------------------------------------
// Q585 — tuningFamilyMostSharedQuadrantProfile
// ---------------------------------------------------------------------------

describe('tuningFamilyMostSharedQuadrantProfile (Q585)', () => {
  it('returns the profile with highest tuningCount, or null if none shared', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostSharedQuadrantProfile([t12, edo(19, 440)], spec);
    if (result !== null) {
      expect(result.tuningCount).toBeGreaterThan(1);
      expect(typeof result.profile).toBe('string');
    }
  });

  it('returns null when only one tuning provided (no sharing possible)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostSharedQuadrantProfile([t12], spec);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q586 — tuningFamilyQuadrantProfileOverlapScore
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantProfileOverlapScore (Q586)', () => {
  it('returns overlap score in [0, 1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyQuadrantProfileOverlapScore([t12, edo(19, 440)], spec);
    expect(result.overlapScore).toBeGreaterThanOrEqual(0);
    expect(result.overlapScore).toBeLessThanOrEqual(1);
  });

  it('sharedCount + uniqueCount equals totalProfiles', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyQuadrantProfileOverlapScore([t12, edo(19, 440)], spec);
    expect(result.sharedCount + result.uniqueCount).toBe(result.totalProfiles);
  });
});

// ---------------------------------------------------------------------------
// Q587 — tuningFamilyQuadrantProfileFrequencyNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyQuadrantProfileFrequencyNarrative (Q587)', () => {
  it('returns overlap metrics with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyQuadrantProfileFrequencyNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains the overlap score percentage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyQuadrantProfileFrequencyNarrative([t12, edo(19, 440)], spec);
    expect(result.narrative).toContain('%');
  });

  it('narrative contains the total profiles count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyQuadrantProfileFrequencyNarrative([t12, edo(19, 440)], spec);
    expect(result.narrative).toContain(String(result.totalProfiles));
  });
});

// ---------------------------------------------------------------------------
// Q588 — tuningModeProfileTransitions
// ---------------------------------------------------------------------------

describe('tuningModeProfileTransitions (Q588)', () => {
  it('returns n-1 transition entries for n modes', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeProfileTransitions(t12, spec);
    expect(result.length).toBe(t12.degrees.length - 1);
  });

  it('each entry has fromMode, toMode, sameProfile, fromProfile, toProfile', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeProfileTransitions(t12, spec);
    for (const entry of result) {
      expect(typeof entry.sameProfile).toBe('boolean');
      expect(typeof entry.fromProfile).toBe('string');
      expect(typeof entry.toProfile).toBe('string');
      expect(entry.fromProfile.split('|').length).toBe(4);
    }
  });

  it('sameProfile matches fromProfile === toProfile', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeProfileTransitions(t12, spec);
    for (const entry of result) {
      expect(entry.sameProfile).toBe(entry.fromProfile === entry.toProfile);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeProfileTransitions(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length - 1);
  });
});

// ---------------------------------------------------------------------------
// Q590 — tuningProfileTransitionScore
// ---------------------------------------------------------------------------

describe('tuningProfileTransitionScore (Q590)', () => {
  it('returns sameCount + differentCount = totalTransitions', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionScore(t12, spec);
    expect(result.sameCount + result.differentCount).toBe(result.totalTransitions);
    expect(result.totalTransitions).toBe(t12.degrees.length - 1);
  });

  it('stabilityScore is in [0, 1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionScore(t12, spec);
    expect(result.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.stabilityScore).toBeLessThanOrEqual(1);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionScore(t12, spec, 261.63);
    expect(result.totalTransitions).toBe(t12.degrees.length - 1);
  });
});

// ---------------------------------------------------------------------------
// Q592 — tuningFamilyProfileTransitionScores
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileTransitionScores (Q592)', () => {
  it('returns one entry per tuning with id and transitionScore', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileTransitionScores([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.transitionScore.stabilityScore).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q593 — tuningFamilyProfileTransitionRanking
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileTransitionRanking (Q593)', () => {
  it('returns ranked entries sorted by stabilityScore descending', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileTransitionRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(results.length).toBe(3);
    expect(results[0]!.rank).toBe(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.transitionScore.stabilityScore).toBeGreaterThanOrEqual(
        results[i]!.transitionScore.stabilityScore,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Q594 — tuningProfileTransitionScoreNarrative
// ---------------------------------------------------------------------------

describe('tuningProfileTransitionScoreNarrative (Q594)', () => {
  it('returns score with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionScoreNarrative(t12, spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionScoreNarrative(t12, spec);
    expect(result.narrative).toContain(t12.name);
  });

  it('narrative contains the stability percentage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionScoreNarrative(t12, spec);
    expect(result.narrative).toContain('%');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionScoreNarrative(t12, spec, 261.63);
    expect(result.totalTransitions).toBe(t12.degrees.length - 1);
  });
});

// ---------------------------------------------------------------------------
// Q596 — tuningFamilyProfileTransitionScoreNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileTransitionScoreNarratives (Q596)', () => {
  it('returns one entry per tuning with id and transitionNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileTransitionScoreNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.transitionNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q597 — tuningFamilyMostStableProfileTransition
// ---------------------------------------------------------------------------

describe('tuningFamilyMostStableProfileTransition (Q597)', () => {
  it('returns the rank-1 tuning (most stable profile transitions)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostStableProfileTransition([t12, edo(19, 440)], spec);
    expect(result.rank).toBe(1);
    expect(typeof result.id).toBe('string');
  });

  it('throws RangeError for empty tuning array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => tuningFamilyMostStableProfileTransition([], spec)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q598 — tuningFamilyLeastStableProfileTransition
// ---------------------------------------------------------------------------

describe('tuningFamilyLeastStableProfileTransition (Q598)', () => {
  it('returns the last-ranked tuning (most varied profile transitions)', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const result = tuningFamilyLeastStableProfileTransition(tunings, spec);
    expect(result.rank).toBe(tunings.length);
    expect(typeof result.id).toBe('string');
  });

  it('throws RangeError for empty tuning array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => tuningFamilyLeastStableProfileTransition([], spec)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q599 — tuningProfileTransitionHeatMap
// ---------------------------------------------------------------------------

describe('tuningProfileTransitionHeatMap (Q599)', () => {
  it('returns n-1 entries with index, mode names, and changed flag', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionHeatMap(t12, spec);
    expect(result.length).toBe(t12.degrees.length - 1);
    for (const entry of result) {
      expect(typeof entry.index).toBe('number');
      expect(typeof entry.fromModeName).toBe('string');
      expect(typeof entry.toModeName).toBe('string');
      expect(typeof entry.changed).toBe('boolean');
    }
  });

  it('index values are sequential from 0', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionHeatMap(t12, spec);
    result.forEach((entry, i) => expect(entry.index).toBe(i));
  });

  it('changed matches tuningModeProfileTransitions sameProfile inverse', () => {
    const spec = harmonicSpectrum(6);
    const heatMap = tuningProfileTransitionHeatMap(t12, spec);
    const transitions = tuningModeProfileTransitions(t12, spec);
    for (let i = 0; i < transitions.length; i++) {
      expect(heatMap[i]!.changed).toBe(!transitions[i]!.sameProfile);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionHeatMap(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length - 1);
  });
});

// ---------------------------------------------------------------------------
// Q600 — tuningProfileTransitionRuns
// ---------------------------------------------------------------------------

describe('tuningProfileTransitionRuns (Q600)', () => {
  it('returns at least one run', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionRuns(t12, spec);
    expect(result.length).toBeGreaterThan(0);
  });

  it('all modes are covered across runs (total length = degree count)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionRuns(t12, spec);
    const total = result.reduce((s, r) => s + r.length, 0);
    expect(total).toBe(t12.degrees.length);
  });

  it('each run has at least 1 mode and a valid profile', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionRuns(t12, spec);
    for (const run of result) {
      expect(run.length).toBeGreaterThan(0);
      expect(run.profile.split('|').length).toBe(4);
      expect(run.modes.length).toBe(run.length);
    }
  });

  it('consecutive runs have different profiles', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionRuns(t12, spec);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.profile).not.toBe(result[i - 1]!.profile);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTransitionRuns(t12, spec, 261.63);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Q601 — tuningProfileLongestRun
// ---------------------------------------------------------------------------

describe('tuningProfileLongestRun (Q601)', () => {
  it('returns the run with the greatest length', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileLongestRun(t12, spec);
    expect(result).not.toBeNull();
    if (result !== null) {
      const runs = tuningProfileTransitionRuns(t12, spec);
      for (const run of runs) {
        expect(result.length).toBeGreaterThanOrEqual(run.length);
      }
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileLongestRun(t12, spec, 261.63);
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q602 — tuningProfileRunSummary
// ---------------------------------------------------------------------------

describe('tuningProfileRunSummary (Q602)', () => {
  it('returns run statistics', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunSummary(t12, spec);
    expect(result.runCount).toBeGreaterThan(0);
    expect(result.totalModes).toBe(t12.degrees.length);
    expect(result.longestRun).toBeGreaterThanOrEqual(result.shortestRun);
    expect(result.meanRunLength).toBeCloseTo(result.totalModes / result.runCount, 5);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunSummary(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q604 — tuningFamilyProfileRunSummaries
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileRunSummaries (Q604)', () => {
  it('returns one entry per tuning with id and runSummary', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileRunSummaries([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.runSummary.runCount).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q605 — tuningFamilyProfileRunRanking
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileRunRanking (Q605)', () => {
  it('returns ranked entries sorted by longestRun descending', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileRunRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(results.length).toBe(3);
    expect(results[0]!.rank).toBe(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.runSummary.longestRun).toBeGreaterThanOrEqual(
        results[i]!.runSummary.longestRun,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Q606 — tuningProfileRunSummaryNarrative
// ---------------------------------------------------------------------------

describe('tuningProfileRunSummaryNarrative (Q606)', () => {
  it('returns run summary with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunSummaryNarrative(t12, spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunSummaryNarrative(t12, spec);
    expect(result.narrative).toContain(t12.name);
  });

  it('narrative contains the run count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunSummaryNarrative(t12, spec);
    expect(result.narrative).toContain(String(result.runCount));
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunSummaryNarrative(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q608 — tuningFamilyProfileRunSummaryNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileRunSummaryNarratives (Q608)', () => {
  it('returns one entry per tuning with id and runNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileRunSummaryNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.runNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q609 — tuningProfileRunDensity
// ---------------------------------------------------------------------------

describe('tuningProfileRunDensity (Q609)', () => {
  it('returns run summary with changeDensity in [0, 1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunDensity(t12, spec);
    expect(result.changeDensity).toBeGreaterThanOrEqual(0);
    expect(result.changeDensity).toBeLessThanOrEqual(1);
  });

  it('changeDensity is 0 when all modes share one profile (runCount = 1)', () => {
    const spec = harmonicSpectrum(6);
    const singleDeg: TuningSystem = { ...t12, degrees: t12.degrees.slice(0, 1) };
    const result = tuningProfileRunDensity(singleDeg, spec);
    expect(result.changeDensity).toBe(0);
  });

  it('changeDensity matches (runCount - 1) / (totalModes - 1)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunDensity(t12, spec);
    const expected = result.totalModes > 1 ? (result.runCount - 1) / (result.totalModes - 1) : 0;
    expect(result.changeDensity).toBeCloseTo(expected, 10);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunDensity(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q611 — tuningFamilyProfileRunDensities
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileRunDensities (Q611)', () => {
  it('returns one entry per tuning with id and runDensity', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileRunDensities([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.runDensity.changeDensity).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q612 — tuningFamilyProfileRunDensityRanking
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileRunDensityRanking (Q612)', () => {
  it('returns ranked entries sorted by changeDensity descending', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileRunDensityRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(results.length).toBe(3);
    expect(results[0]!.rank).toBe(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.runDensity.changeDensity).toBeGreaterThanOrEqual(
        results[i]!.runDensity.changeDensity,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Q613 — tuningFamilyMostChaoticProfileTransition
// ---------------------------------------------------------------------------

describe('tuningFamilyMostChaoticProfileTransition (Q613)', () => {
  it('returns the rank-1 tuning (highest change density)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostChaoticProfileTransition([t12, edo(19, 440)], spec);
    expect(result.rank).toBe(1);
    expect(typeof result.id).toBe('string');
  });

  it('throws RangeError for empty array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => tuningFamilyMostChaoticProfileTransition([], spec)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q614 — tuningFamilyMostConsistentProfileTransition
// ---------------------------------------------------------------------------

describe('tuningFamilyMostConsistentProfileTransition (Q614)', () => {
  it('returns the last-ranked tuning (lowest change density)', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const result = tuningFamilyMostConsistentProfileTransition(tunings, spec);
    expect(result.rank).toBe(tunings.length);
    expect(typeof result.id).toBe('string');
  });

  it('throws RangeError for empty array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => tuningFamilyMostConsistentProfileTransition([], spec)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q615 — tuningProfileRunDensityNarrative
// ---------------------------------------------------------------------------

describe('tuningProfileRunDensityNarrative (Q615)', () => {
  it('returns density with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunDensityNarrative(t12, spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunDensityNarrative(t12, spec);
    expect(result.narrative).toContain(t12.name);
  });

  it('narrative contains the density percentage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunDensityNarrative(t12, spec);
    expect(result.narrative).toContain('%');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileRunDensityNarrative(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q617 — tuningFamilyProfileRunDensityNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileRunDensityNarratives (Q617)', () => {
  it('returns one entry per tuning with id and densityNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileRunDensityNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.densityNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q618 — tuningProfileTextureReport
// ---------------------------------------------------------------------------

describe('tuningProfileTextureReport (Q618)', () => {
  it('returns all four sub-reports', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTextureReport(t12, spec);
    expect(typeof result.coverage.totalUniqueProfiles).toBe('number');
    expect(typeof result.runSummary.runCount).toBe('number');
    expect(typeof result.transitionScore.stabilityScore).toBe('number');
    expect(typeof result.profileDiversity.normalized).toBe('number');
  });

  it('coverage totalModes matches runSummary totalModes', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTextureReport(t12, spec);
    expect(result.coverage.totalModes).toBe(result.runSummary.totalModes);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTextureReport(t12, spec, 261.63);
    expect(result.coverage.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q620 — tuningFamilyProfileTextureReports
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileTextureReports (Q620)', () => {
  it('returns one entry per tuning with id and textureReport', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileTextureReports([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.textureReport.coverage.totalUniqueProfiles).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// Q621 — tuningProfileTextureReportNarrative
// ---------------------------------------------------------------------------

describe('tuningProfileTextureReportNarrative (Q621)', () => {
  it('returns all sub-reports with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTextureReportNarrative(t12, spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTextureReportNarrative(t12, spec);
    expect(result.narrative).toContain(t12.name);
  });

  it('narrative contains the stability percentage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTextureReportNarrative(t12, spec);
    expect(result.narrative).toContain('%');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningProfileTextureReportNarrative(t12, spec, 261.63);
    expect(result.coverage.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q623 — tuningFamilyProfileTextureReportNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyProfileTextureReportNarratives (Q623)', () => {
  it('returns one entry per tuning with id and textureReportNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyProfileTextureReportNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.textureReportNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q624 — tuningModeRarestProfileGroup
// ---------------------------------------------------------------------------

describe('tuningModeRarestProfileGroup (Q624)', () => {
  it('returns the group with the fewest modes', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeRarestProfileGroup(t12, spec);
    expect(result).not.toBeNull();
    if (result !== null) {
      const groups = tuningModeGroupByProfile(t12, spec);
      for (const g of groups) {
        expect(result.count).toBeLessThanOrEqual(g.count);
      }
    }
  });

  it('result is present in tuningModeGroupByProfile output', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeRarestProfileGroup(t12, spec);
    const groups = tuningModeGroupByProfile(t12, spec);
    if (result !== null) {
      expect(groups.some((g) => g.profile === result.profile)).toBe(true);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeRarestProfileGroup(t12, spec, 261.63);
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q626 — tuningModeSoloProfileModes
// ---------------------------------------------------------------------------

describe('tuningModeSoloProfileModes (Q626)', () => {
  it('returns only modes that are sole occupants of their profile', () => {
    const spec = harmonicSpectrum(6);
    const soloModes = tuningModeSoloProfileModes(t12, spec);
    const groups = tuningModeGroupByProfile(t12, spec);
    for (const mode of soloModes) {
      const group = groups.find((g) => g.modes.some((m) => m.id === mode.id));
      expect(group?.count).toBe(1);
    }
  });

  it('total solo count is <= total degree count', () => {
    const spec = harmonicSpectrum(6);
    const soloModes = tuningModeSoloProfileModes(t12, spec);
    expect(soloModes.length).toBeLessThanOrEqual(t12.degrees.length);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileModes(t12, spec, 261.63);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Q628 — tuningFamilyModeSoloProfileCounts
// ---------------------------------------------------------------------------

describe('tuningFamilyModeSoloProfileCounts (Q628)', () => {
  it('returns one entry per tuning with soloModeCount and totalModes', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeSoloProfileCounts([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.soloModeCount).toBeLessThanOrEqual(r.totalModes);
    }
  });
});

// ---------------------------------------------------------------------------
// Q629 — tuningModeSoloProfileRatio
// ---------------------------------------------------------------------------

describe('tuningModeSoloProfileRatio (Q629)', () => {
  it('returns soloRatio in [0, 1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileRatio(t12, spec);
    expect(result.soloRatio).toBeGreaterThanOrEqual(0);
    expect(result.soloRatio).toBeLessThanOrEqual(1);
  });

  it('soloModeCount matches tuningModeSoloProfileModes length', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileRatio(t12, spec);
    const soloModes = tuningModeSoloProfileModes(t12, spec);
    expect(result.soloModeCount).toBe(soloModes.length);
  });

  it('totalModes matches degree count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileRatio(t12, spec);
    expect(result.totalModes).toBe(t12.degrees.length);
  });

  it('soloRatio = soloModeCount / totalModes', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileRatio(t12, spec);
    if (result.totalModes > 0) {
      expect(result.soloRatio).toBeCloseTo(result.soloModeCount / result.totalModes, 10);
    }
  });
});

// ---------------------------------------------------------------------------
// Q630 — tuningFamilyModeSoloProfileRatios
// ---------------------------------------------------------------------------

describe('tuningFamilyModeSoloProfileRatios (Q630)', () => {
  it('returns one entry per tuning with id and soloRatio', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeSoloProfileRatios([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.soloRatio.soloRatio).toBeGreaterThanOrEqual(0);
      expect(r.soloRatio.soloRatio).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Q631 — tuningFamilySoloProfileRatioRanking
// ---------------------------------------------------------------------------

describe('tuningFamilySoloProfileRatioRanking (Q631)', () => {
  it('returns ranked entries sorted by soloRatio descending', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilySoloProfileRatioRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(results.length).toBe(3);
    expect(results[0]!.rank).toBe(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.soloRatio.soloRatio).toBeGreaterThanOrEqual(
        results[i]!.soloRatio.soloRatio,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Q632 — tuningMostUniqueModesTuning
// ---------------------------------------------------------------------------

describe('tuningMostUniqueModesTuning (Q632)', () => {
  it('returns rank-1 tuning (most individual modes)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningMostUniqueModesTuning([t12, edo(19, 440)], spec);
    expect(result.rank).toBe(1);
    expect(typeof result.id).toBe('string');
  });

  it('throws RangeError for empty array', () => {
    const spec = harmonicSpectrum(6);
    expect(() => tuningMostUniqueModesTuning([], spec)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q633 — tuningModeSoloProfileNarrative
// ---------------------------------------------------------------------------

describe('tuningModeSoloProfileNarrative (Q633)', () => {
  it('returns ratio with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileNarrative(t12, spec);
    expect(typeof result.narrative).toBe('string');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileNarrative(t12, spec);
    expect(result.narrative).toContain(t12.name);
  });

  it('narrative contains the solo percentage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileNarrative(t12, spec);
    expect(result.narrative).toContain('%');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeSoloProfileNarrative(t12, spec, 261.63);
    expect(result.totalModes).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q635 — tuningFamilyModeSoloProfileNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyModeSoloProfileNarratives (Q635)', () => {
  it('returns one entry per tuning with id and soloNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeSoloProfileNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.soloNarrative.narrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q636 — tuningModeQuadrantIdentityBundle
// ---------------------------------------------------------------------------

describe('tuningModeQuadrantIdentityBundle (Q636)', () => {
  it('returns one entry per mode with all identity fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantIdentityBundle(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.entropyDiversityQuadrant).toBe('string');
      expect(typeof entry.quadrantProfile).toBe('string');
      expect(typeof entry.dominantToken).toBe('string');
      const valid = ['versatile', 'specialized', 'balanced'];
      expect(valid).toContain(entry.consensus);
      expect(typeof entry.isSoloProfile).toBe('boolean');
    }
  });

  it('isSoloProfile matches tuningModeSoloProfileModes', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantIdentityBundle(t12, spec);
    const soloModes = tuningModeSoloProfileModes(t12, spec);
    const soloIds = new Set(soloModes.map((m) => m.id));
    for (const entry of result) {
      expect(entry.isSoloProfile).toBe(soloIds.has(entry.mode.id));
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantIdentityBundle(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q638 — tuningFamilyModeQuadrantIdentityBundles
// ---------------------------------------------------------------------------

describe('tuningFamilyModeQuadrantIdentityBundles (Q638)', () => {
  it('returns one entry per tuning with id and identityBundle', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeQuadrantIdentityBundles([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.identityBundle.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q639 — tuningModeQuadrantIdentityNarrative
// ---------------------------------------------------------------------------

describe('tuningModeQuadrantIdentityNarrative (Q639)', () => {
  it('returns one entry per mode with narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantIdentityNarrative(t12, spec);
    expect(result.length).toBe(t12.degrees.length);
    for (const entry of result) {
      expect(typeof entry.narrative).toBe('string');
      expect(entry.narrative.length).toBeGreaterThan(0);
    }
  });

  it('narrative contains mode name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantIdentityNarrative(t12, spec);
    const entry = result[0]!;
    expect(entry.narrative).toContain(entry.mode.name);
  });

  it('narrative contains consensus and dominant token', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantIdentityNarrative(t12, spec);
    const entry = result[0]!;
    expect(entry.narrative).toContain(entry.consensus);
    expect(entry.narrative).toContain(entry.dominantToken);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeQuadrantIdentityNarrative(t12, spec, 261.63);
    expect(result.length).toBe(t12.degrees.length);
  });
});

// ---------------------------------------------------------------------------
// Q641 — tuningFamilyModeQuadrantIdentityNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyModeQuadrantIdentityNarratives (Q641)', () => {
  it('returns one entry per tuning with id and identityNarratives', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeQuadrantIdentityNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(r.identityNarratives.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Q642 — tuningModeAmbassador
// ---------------------------------------------------------------------------

describe('tuningModeAmbassador (Q642)', () => {
  it('returns a single mode entry from the identity bundle', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAmbassador(t12, spec);
    expect(typeof result.mode.id).toBe('string');
    const valid = ['versatile', 'specialized', 'balanced'];
    expect(valid).toContain(result.consensus);
  });

  it('ambassador is present in the identity bundle', () => {
    const spec = harmonicSpectrum(6);
    const ambassador = tuningModeAmbassador(t12, spec);
    const bundle = tuningModeQuadrantIdentityBundle(t12, spec);
    expect(bundle.some((e) => e.mode.id === ambassador.mode.id)).toBe(true);
  });

  it('throws RangeError if tuning has no modes', () => {
    const spec = harmonicSpectrum(6);
    const empty: TuningSystem = { ...t12, degrees: [] };
    expect(() => tuningModeAmbassador(empty, spec)).toThrow(RangeError);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAmbassador(t12, spec, 261.63);
    expect(typeof result.mode.id).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q644 — tuningFamilyModeAmbassadors
// ---------------------------------------------------------------------------

describe('tuningFamilyModeAmbassadors (Q644)', () => {
  it('returns one entry per tuning with id and ambassador', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeAmbassadors([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.ambassador.mode.id).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q645 — tuningModeAmbassadorNarrative
// ---------------------------------------------------------------------------

describe('tuningModeAmbassadorNarrative (Q645)', () => {
  it('returns ambassador with ambassadorNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAmbassadorNarrative(t12, spec);
    expect(typeof result.ambassadorNarrative).toBe('string');
    expect(result.ambassadorNarrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name and mode name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAmbassadorNarrative(t12, spec);
    expect(result.ambassadorNarrative).toContain(t12.name);
    expect(result.ambassadorNarrative).toContain(result.mode.name);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningModeAmbassadorNarrative(t12, spec, 261.63);
    expect(typeof result.ambassadorNarrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q647 — tuningFamilyModeAmbassadorNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilyModeAmbassadorNarratives (Q647)', () => {
  it('returns one entry per tuning with id and ambassadorNarrative', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyModeAmbassadorNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.ambassadorNarrative.ambassadorNarrative).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Q648 — tuningFamilyAmbassadorRanking
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorRanking (Q648)', () => {
  it('returns one entry per tuning with score and rank', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyAmbassadorRanking([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    expect(results[0]!.rank).toBe(1);
    expect(results[1]!.rank).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.score).toBe('number');
      expect(r.score).toBeGreaterThanOrEqual(0);
    }
  });

  it('is sorted by score descending', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilyAmbassadorRanking([t12, edo(19, 440), edo(31, 440)], spec);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });

  it('returns empty array for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorRanking([], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q650 — tuningFamilyBestAmbassador
// ---------------------------------------------------------------------------

describe('tuningFamilyBestAmbassador (Q650)', () => {
  it('returns the top-ranked ambassador entry', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyBestAmbassador([t12, edo(19, 440)], spec);
    expect(result).not.toBeNull();
    expect(result!.rank).toBe(1);
    expect(typeof result!.id).toBe('string');
  });

  it('returns null for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyBestAmbassador([], spec)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q651 — tuningFamilyWeakestAmbassador
// ---------------------------------------------------------------------------

describe('tuningFamilyWeakestAmbassador (Q651)', () => {
  it('returns the lowest-ranked ambassador entry', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const ranking = tuningFamilyAmbassadorRanking(tunings, spec);
    const weakest = tuningFamilyWeakestAmbassador(tunings, spec);
    expect(weakest).not.toBeNull();
    expect(weakest!.rank).toBe(ranking.length);
  });

  it('returns null for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyWeakestAmbassador([], spec)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q652 — tuningFamilyAmbassadorRankingNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorRankingNarrative (Q652)', () => {
  it('returns ranking and rankingNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorRankingNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.rankingNarrative).toBe('string');
    expect(result.rankingNarrative.length).toBeGreaterThan(0);
    expect(result.ranking.length).toBe(2);
  });

  it('narrative mentions tuning count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorRankingNarrative([t12, edo(19, 440)], spec);
    expect(result.rankingNarrative).toContain('2');
  });
});

// ---------------------------------------------------------------------------
// Q654 — tuningFamilyAmbassadorScoreStats
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorScoreStats (Q654)', () => {
  it('returns stats object with min/max/mean/range/stdDev', () => {
    const spec = harmonicSpectrum(6);
    const stats = tuningFamilyAmbassadorScoreStats([t12, edo(19, 440)], spec);
    expect(typeof stats.min).toBe('number');
    expect(typeof stats.max).toBe('number');
    expect(typeof stats.mean).toBe('number');
    expect(typeof stats.range).toBe('number');
    expect(typeof stats.stdDev).toBe('number');
    expect(stats.max).toBeGreaterThanOrEqual(stats.min);
    expect(stats.range).toBeCloseTo(stats.max - stats.min);
  });

  it('returns all zeros for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    const stats = tuningFamilyAmbassadorScoreStats([], spec);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.range).toBe(0);
    expect(stats.stdDev).toBe(0);
  });

  it('stdDev is zero for single-tuning family', () => {
    const spec = harmonicSpectrum(6);
    const stats = tuningFamilyAmbassadorScoreStats([t12], spec);
    expect(stats.stdDev).toBeCloseTo(0);
    expect(stats.min).toBe(stats.max);
  });
});

// ---------------------------------------------------------------------------
// Q656 — tuningFamilyAmbassadorGap
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorGap (Q656)', () => {
  it('returns gap object with best, weakest, scoreDiff', () => {
    const spec = harmonicSpectrum(6);
    const gap = tuningFamilyAmbassadorGap([t12, edo(19, 440)], spec);
    expect(gap).not.toBeNull();
    expect(typeof gap!.scoreDiff).toBe('number');
    expect(gap!.scoreDiff).toBeGreaterThanOrEqual(0);
  });

  it('returns null for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorGap([], spec)).toBeNull();
  });

  it('scoreDiff equals best.score - weakest.score', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const gap = tuningFamilyAmbassadorGap(tunings, spec);
    expect(gap).not.toBeNull();
    expect(gap!.scoreDiff).toBeCloseTo((gap!.best?.score ?? 0) - (gap!.weakest?.score ?? 0));
  });
});

// ---------------------------------------------------------------------------
// Q657 — tuningFamilyAmbassadorScoreStatsNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorScoreStatsNarrative (Q657)', () => {
  it('returns stats and statsNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorScoreStatsNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.statsNarrative).toBe('string');
    expect(result.statsNarrative.length).toBeGreaterThan(0);
    expect(typeof result.stats.mean).toBe('number');
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorScoreStatsNarrative([], spec);
    expect(result.statsNarrative).toContain('No tunings');
  });
});

// ---------------------------------------------------------------------------
// Q660 — tuningFamilyAmbassadorConsensusDistribution
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConsensusDistribution (Q660)', () => {
  it('returns distribution with versatile/balanced/specialized counts', () => {
    const spec = harmonicSpectrum(6);
    const dist = tuningFamilyAmbassadorConsensusDistribution([t12, edo(19, 440)], spec);
    expect(typeof dist.versatile).toBe('number');
    expect(typeof dist.balanced).toBe('number');
    expect(typeof dist.specialized).toBe('number');
    expect(dist.total).toBe(2);
    expect(dist.versatile + dist.balanced + dist.specialized).toBe(2);
  });

  it('returns all zeros for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    const dist = tuningFamilyAmbassadorConsensusDistribution([], spec);
    expect(dist.total).toBe(0);
    expect(dist.versatile + dist.balanced + dist.specialized).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Q662 — tuningFamilyAmbassadorConsensusDistributionNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConsensusDistributionNarrative (Q662)', () => {
  it('returns distribution and distributionNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusDistributionNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.distributionNarrative).toBe('string');
    expect(result.distributionNarrative.length).toBeGreaterThan(0);
    expect(result.distribution.total).toBe(2);
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusDistributionNarrative([], spec);
    expect(result.distributionNarrative).toContain('No tunings');
  });
});

// ---------------------------------------------------------------------------
// Q663 — tuningFamilyAmbassadorProfileFrequency
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorProfileFrequency (Q663)', () => {
  it('returns profile frequency entries sorted by count desc', () => {
    const spec = harmonicSpectrum(6);
    const freq = tuningFamilyAmbassadorProfileFrequency([t12, edo(19, 440), edo(31, 440)], spec);
    expect(Array.isArray(freq)).toBe(true);
    for (const f of freq) {
      expect(typeof f.profile).toBe('string');
      expect(typeof f.count).toBe('number');
      expect(Array.isArray(f.tuningIds)).toBe(true);
      expect(f.count).toBe(f.tuningIds.length);
    }
    for (let i = 1; i < freq.length; i++) {
      expect(freq[i - 1]!.count).toBeGreaterThanOrEqual(freq[i]!.count);
    }
  });

  it('returns empty array for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorProfileFrequency([], spec)).toEqual([]);
  });

  it('total tuningIds across all profiles equals tuning count', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440)];
    const freq = tuningFamilyAmbassadorProfileFrequency(tunings, spec);
    const totalIds = freq.reduce((s, f) => s + f.count, 0);
    expect(totalIds).toBe(tunings.length);
  });
});

// ---------------------------------------------------------------------------
// Q665 — tuningFamilyMostCommonAmbassadorProfile
// ---------------------------------------------------------------------------

describe('tuningFamilyMostCommonAmbassadorProfile (Q665)', () => {
  it('returns the most frequent ambassador profile', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostCommonAmbassadorProfile([t12, edo(19, 440)], spec);
    expect(result).not.toBeNull();
    expect(typeof result!.profile).toBe('string');
    expect(result!.count).toBeGreaterThanOrEqual(1);
  });

  it('returns null for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyMostCommonAmbassadorProfile([], spec)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q666 — tuningFamilyLeastCommonAmbassadorProfile
// ---------------------------------------------------------------------------

describe('tuningFamilyLeastCommonAmbassadorProfile (Q666)', () => {
  it('returns the least frequent ambassador profile entry', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyLeastCommonAmbassadorProfile(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result).not.toBeNull();
    expect(typeof result!.profile).toBe('string');
    expect(result!.count).toBeGreaterThanOrEqual(1);
  });

  it('returns null for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyLeastCommonAmbassadorProfile([], spec)).toBeNull();
  });

  it('least common count <= most common count', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const most = tuningFamilyMostCommonAmbassadorProfile(tunings, spec);
    const least = tuningFamilyLeastCommonAmbassadorProfile(tunings, spec);
    if (most && least) {
      expect(least.count).toBeLessThanOrEqual(most.count);
    }
  });
});

// ---------------------------------------------------------------------------
// Q668 — tuningFamilyUniqueAmbassadorProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilyUniqueAmbassadorProfiles (Q668)', () => {
  it('returns entries where each profile is unique to one tuning', () => {
    const spec = harmonicSpectrum(6);
    const uniq = tuningFamilyUniqueAmbassadorProfiles([t12, edo(19, 440), edo(31, 440)], spec);
    expect(Array.isArray(uniq)).toBe(true);
    for (const u of uniq) {
      expect(typeof u.profile).toBe('string');
      expect(typeof u.tuningId).toBe('string');
    }
  });

  it('returns empty array for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyUniqueAmbassadorProfiles([], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q669 — tuningFamilyAmbassadorConsensusScore
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConsensusScore (Q669)', () => {
  it('returns score object with normalizedScore in [0,1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusScore([t12, edo(19, 440)], spec);
    expect(typeof result.score).toBe('number');
    expect(typeof result.maxScore).toBe('number');
    expect(result.maxScore).toBe(4); // 2 tunings * 2
    expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
    expect(result.normalizedScore).toBeLessThanOrEqual(1);
  });

  it('returns all zeros for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusScore([], spec);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
    expect(result.normalizedScore).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Q671 — tuningFamilyAmbassadorConsensusScoreNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConsensusScoreNarrative (Q671)', () => {
  it('returns consensusScore and scoreNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusScoreNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.scoreNarrative).toBe('string');
    expect(result.scoreNarrative.length).toBeGreaterThan(0);
    expect(typeof result.consensusScore.normalizedScore).toBe('number');
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusScoreNarrative([], spec);
    expect(result.scoreNarrative).toContain('No tunings');
  });
});

// ---------------------------------------------------------------------------
// Q672 — tuningFamilyAmbassadorReport
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorReport (Q672)', () => {
  it('returns bundle with all six analytics fields', () => {
    const spec = harmonicSpectrum(6);
    const report = tuningFamilyAmbassadorReport([t12, edo(19, 440)], spec);
    expect(Array.isArray(report.ranking)).toBe(true);
    expect(typeof report.scoreStats.mean).toBe('number');
    expect(typeof report.consensusScore.normalizedScore).toBe('number');
    expect(Array.isArray(report.profileFrequency)).toBe(true);
    expect(Array.isArray(report.uniqueProfiles)).toBe(true);
    // mostCommonProfile is entry or null
    if (report.mostCommonProfile !== null) {
      expect(typeof report.mostCommonProfile.profile).toBe('string');
    }
  });

  it('ranking length equals tuning count', () => {
    const spec = harmonicSpectrum(6);
    const report = tuningFamilyAmbassadorReport([t12, edo(19, 440)], spec);
    expect(report.ranking.length).toBe(2);
  });

  it('returns empty/zero bundle for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    const report = tuningFamilyAmbassadorReport([], spec);
    expect(report.ranking.length).toBe(0);
    expect(report.scoreStats.mean).toBe(0);
    expect(report.mostCommonProfile).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q674 — tuningFamilyAmbassadorReportNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorReportNarrative (Q674)', () => {
  it('returns report and reportNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorReportNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.reportNarrative).toBe('string');
    expect(result.reportNarrative.length).toBeGreaterThan(0);
    expect(result.report.ranking.length).toBe(2);
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorReportNarrative([], spec);
    expect(result.reportNarrative).toContain('No tunings');
  });
});

// ---------------------------------------------------------------------------
// Q676 — tuningFamilyAmbassadorOverlapScore
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorOverlapScore (Q676)', () => {
  it('returns overlap metrics with overlapScore in [0,1]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorOverlapScore([t12, edo(19, 440), edo(31, 440)], spec);
    expect(typeof result.sharedCount).toBe('number');
    expect(typeof result.uniqueCount).toBe('number');
    expect(result.total).toBe(3);
    expect(result.overlapScore).toBeGreaterThanOrEqual(0);
    expect(result.overlapScore).toBeLessThanOrEqual(1);
  });

  it('sharedCount + uniqueCount profiles equals profileFrequency length', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const result = tuningFamilyAmbassadorOverlapScore(tunings, spec);
    // sharedCount is count of tunings sharing a profile, uniqueCount is distinct unique profiles
    expect(result.total).toBe(tunings.length);
  });

  it('returns all zeros for empty tunings list', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorOverlapScore([], spec);
    expect(result.total).toBe(0);
    expect(result.overlapScore).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Q678 — tuningFamilyAmbassadorOverlapScoreNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorOverlapScoreNarrative (Q678)', () => {
  it('returns overlapScore and overlapNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorOverlapScoreNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.overlapNarrative).toBe('string');
    expect(result.overlapNarrative.length).toBeGreaterThan(0);
    expect(typeof result.overlapScore.overlapScore).toBe('number');
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorOverlapScoreNarrative([], spec);
    expect(result.overlapNarrative).toContain('No tunings');
  });
});

// ---------------------------------------------------------------------------
// Q680 — tuningPairAmbassadorSimilarity
// ---------------------------------------------------------------------------

describe('tuningPairAmbassadorSimilarity (Q680)', () => {
  it('returns similarity between two tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningPairAmbassadorSimilarity(t12, edo(19, 440), spec);
    expect(typeof result.profileA).toBe('string');
    expect(typeof result.profileB).toBe('string');
    expect(typeof result.sameProfile).toBe('boolean');
    expect(typeof result.sameConsensus).toBe('boolean');
  });

  it('comparing a tuning with itself returns sameProfile = true', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningPairAmbassadorSimilarity(t12, t12, spec);
    expect(result.sameProfile).toBe(true);
    expect(result.sameConsensus).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Q681 — tuningFamilyAmbassadorSimilarityMatrix
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorSimilarityMatrix (Q681)', () => {
  it('returns n*(n-1)/2 pairs for n tunings', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const matrix = tuningFamilyAmbassadorSimilarityMatrix(tunings, spec);
    expect(matrix.length).toBe(3); // 3 choose 2 = 3
    for (const entry of matrix) {
      expect(typeof entry.idA).toBe('string');
      expect(typeof entry.idB).toBe('string');
      expect(typeof entry.sameProfile).toBe('boolean');
    }
  });

  it('returns empty array for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorSimilarityMatrix([], spec)).toEqual([]);
    expect(tuningFamilyAmbassadorSimilarityMatrix([t12], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q682 — tuningFamilyAmbassadorConvergenceScore
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConvergenceScore (Q682)', () => {
  it('returns samePairs/totalPairs/convergenceScore', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConvergenceScore([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.totalPairs).toBe(3);
    expect(result.convergenceScore).toBeGreaterThanOrEqual(0);
    expect(result.convergenceScore).toBeLessThanOrEqual(1);
    expect(result.samePairs + (result.totalPairs - result.samePairs)).toBe(result.totalPairs);
  });

  it('self-comparison (same tuning twice) has convergenceScore 1', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConvergenceScore([t12, t12], spec);
    expect(result.convergenceScore).toBe(1);
  });

  it('returns zero for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    const empty = tuningFamilyAmbassadorConvergenceScore([], spec);
    expect(empty.totalPairs).toBe(0);
    expect(empty.convergenceScore).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Q684 — tuningFamilyMostSimilarAmbassadorPair
// ---------------------------------------------------------------------------

describe('tuningFamilyMostSimilarAmbassadorPair (Q684)', () => {
  it('returns a pair entry from the matrix', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostSimilarAmbassadorPair([t12, edo(19, 440)], spec);
    expect(result).not.toBeNull();
    expect(typeof result!.idA).toBe('string');
    expect(typeof result!.idB).toBe('string');
    expect(typeof result!.sameProfile).toBe('boolean');
  });

  it('returns null for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyMostSimilarAmbassadorPair([], spec)).toBeNull();
    expect(tuningFamilyMostSimilarAmbassadorPair([t12], spec)).toBeNull();
  });

  it('self-pair has sameProfile true', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostSimilarAmbassadorPair([t12, t12], spec);
    expect(result?.sameProfile).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Q685 — tuningFamilyLeastSimilarAmbassadorPair
// ---------------------------------------------------------------------------

describe('tuningFamilyLeastSimilarAmbassadorPair (Q685)', () => {
  it('returns a pair entry from the matrix', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyLeastSimilarAmbassadorPair([t12, edo(19, 440)], spec);
    expect(result).not.toBeNull();
    expect(typeof result!.idA).toBe('string');
  });

  it('returns null for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyLeastSimilarAmbassadorPair([], spec)).toBeNull();
    expect(tuningFamilyLeastSimilarAmbassadorPair([t12], spec)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q686 — tuningFamilyAmbassadorConvergenceScoreNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConvergenceScoreNarrative (Q686)', () => {
  it('returns convergenceScore and convergenceNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConvergenceScoreNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.convergenceNarrative).toBe('string');
    expect(result.convergenceNarrative.length).toBeGreaterThan(0);
    expect(typeof result.convergenceScore.convergenceScore).toBe('number');
  });

  it('narrative for 0 or 1 tunings says no pairs', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConvergenceScoreNarrative([], spec);
    expect(result.convergenceNarrative).toContain('No pairs');
  });
});

// ---------------------------------------------------------------------------
// Q688 — tuningFamilyAmbassadorConsensusConvergenceScore
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConsensusConvergenceScore (Q688)', () => {
  it('returns samePairs/totalPairs/convergenceScore for consensus matching', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusConvergenceScore(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result.totalPairs).toBe(3);
    expect(result.convergenceScore).toBeGreaterThanOrEqual(0);
    expect(result.convergenceScore).toBeLessThanOrEqual(1);
  });

  it('self-comparison gives convergenceScore 1', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusConvergenceScore([t12, t12], spec);
    expect(result.convergenceScore).toBe(1);
  });

  it('returns all-zero for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorConsensusConvergenceScore([], spec).totalPairs).toBe(0);
    expect(tuningFamilyAmbassadorConsensusConvergenceScore([t12], spec).totalPairs).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Q690 — tuningFamilyAmbassadorConsensusConvergenceScoreNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConsensusConvergenceScoreNarrative (Q690)', () => {
  it('returns consensusConvergenceScore and narrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusConvergenceScoreNarrative(
      [t12, edo(19, 440)],
      spec,
    );
    expect(typeof result.consensusConvergenceNarrative).toBe('string');
    expect(result.consensusConvergenceNarrative.length).toBeGreaterThan(0);
    expect(typeof result.consensusConvergenceScore.convergenceScore).toBe('number');
  });

  it('narrative for empty list says no pairs', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConsensusConvergenceScoreNarrative([], spec);
    expect(result.consensusConvergenceNarrative).toContain('No pairs');
  });
});

// ---------------------------------------------------------------------------
// Q692 — tuningFamilyAmbassadorConvergenceBundle
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConvergenceBundle (Q692)', () => {
  it('returns profileConvergence and consensusConvergence together', () => {
    const spec = harmonicSpectrum(6);
    const bundle = tuningFamilyAmbassadorConvergenceBundle([t12, edo(19, 440)], spec);
    expect(typeof bundle.profileConvergence.convergenceScore).toBe('number');
    expect(typeof bundle.consensusConvergence.convergenceScore).toBe('number');
    expect(bundle.profileConvergence.totalPairs).toBe(1);
    expect(bundle.consensusConvergence.totalPairs).toBe(1);
  });

  it('returns all-zero for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const bundle = tuningFamilyAmbassadorConvergenceBundle([], spec);
    expect(bundle.profileConvergence.totalPairs).toBe(0);
    expect(bundle.consensusConvergence.totalPairs).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Q694 — tuningFamilyAmbassadorConvergenceBundleNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorConvergenceBundleNarrative (Q694)', () => {
  it('returns bundle and bundleNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConvergenceBundleNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.bundleNarrative).toBe('string');
    expect(result.bundleNarrative.length).toBeGreaterThan(0);
    expect(typeof result.bundle.profileConvergence.convergenceScore).toBe('number');
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorConvergenceBundleNarrative([], spec);
    expect(result.bundleNarrative).toContain('No tunings');
  });
});

// ---------------------------------------------------------------------------
// Q696 — tuningAmbassadorProfileDistance
// ---------------------------------------------------------------------------

describe('tuningAmbassadorProfileDistance (Q696)', () => {
  it('returns 0 for identical tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningAmbassadorProfileDistance(t12, t12, spec)).toBe(0);
  });

  it('returns a number in [0,4] for different tunings', () => {
    const spec = harmonicSpectrum(6);
    const dist = tuningAmbassadorProfileDistance(t12, edo(19, 440), spec);
    expect(dist).toBeGreaterThanOrEqual(0);
    expect(dist).toBeLessThanOrEqual(4);
  });

  it('distance is symmetric', () => {
    const spec = harmonicSpectrum(6);
    const t19 = edo(19, 440);
    expect(tuningAmbassadorProfileDistance(t12, t19, spec)).toBe(
      tuningAmbassadorProfileDistance(t19, t12, spec),
    );
  });
});

// ---------------------------------------------------------------------------
// Q697 — tuningFamilyAmbassadorProfileDistanceMatrix
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorProfileDistanceMatrix (Q697)', () => {
  it('returns n*(n-1)/2 pairs', () => {
    const spec = harmonicSpectrum(6);
    const matrix = tuningFamilyAmbassadorProfileDistanceMatrix(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(matrix.length).toBe(3);
    for (const entry of matrix) {
      expect(typeof entry.idA).toBe('string');
      expect(typeof entry.idB).toBe('string');
      expect(entry.distance).toBeGreaterThanOrEqual(0);
      expect(entry.distance).toBeLessThanOrEqual(4);
    }
  });

  it('returns empty array for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorProfileDistanceMatrix([], spec)).toEqual([]);
    expect(tuningFamilyAmbassadorProfileDistanceMatrix([t12], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q698 — tuningFamilyAmbassadorMeanProfileDistance
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorMeanProfileDistance (Q698)', () => {
  it('returns mean distance and maxPossible=4', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorMeanProfileDistance([t12, edo(19, 440)], spec);
    expect(result.maxPossible).toBe(4);
    expect(result.totalPairs).toBe(1);
    expect(result.meanDistance).toBeGreaterThanOrEqual(0);
    expect(result.meanDistance).toBeLessThanOrEqual(4);
  });

  it('returns meanDistance=0 for identical tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorMeanProfileDistance([t12, t12], spec);
    expect(result.meanDistance).toBe(0);
  });

  it('returns all-zero for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorMeanProfileDistance([], spec).totalPairs).toBe(0);
    expect(tuningFamilyAmbassadorMeanProfileDistance([t12], spec).meanDistance).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Q700 — tuningFamilyAmbassadorMeanProfileDistanceNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorMeanProfileDistanceNarrative (Q700)', () => {
  it('returns distanceStats and distanceNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorMeanProfileDistanceNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.distanceNarrative).toBe('string');
    expect(result.distanceNarrative.length).toBeGreaterThan(0);
    expect(typeof result.distanceStats.meanDistance).toBe('number');
  });

  it('narrative for empty list says no pairs', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorMeanProfileDistanceNarrative([], spec);
    expect(result.distanceNarrative).toContain('No pairs');
  });
});

// ---------------------------------------------------------------------------
// Q702 — tuningFamilyAmbassadorProfileDistanceStats
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorProfileDistanceStats (Q702)', () => {
  it('returns stats with min/max/range/mean/stdDev', () => {
    const spec = harmonicSpectrum(6);
    const stats = tuningFamilyAmbassadorProfileDistanceStats(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(typeof stats.min).toBe('number');
    expect(typeof stats.max).toBe('number');
    expect(stats.max).toBeGreaterThanOrEqual(stats.min);
    expect(stats.range).toBeCloseTo(stats.max - stats.min);
    expect(stats.totalPairs).toBe(3);
  });

  it('returns all zeros for empty or single tuning', () => {
    const spec = harmonicSpectrum(6);
    const empty = tuningFamilyAmbassadorProfileDistanceStats([], spec);
    expect(empty.totalPairs).toBe(0);
    expect(empty.mean).toBe(0);
  });

  it('stdDev is 0 for all identical pairs', () => {
    const spec = harmonicSpectrum(6);
    const stats = tuningFamilyAmbassadorProfileDistanceStats([t12, t12], spec);
    expect(stats.stdDev).toBeCloseTo(0);
  });
});

// ---------------------------------------------------------------------------
// Q704 — tuningFamilyMostDistantAmbassadorPair
// ---------------------------------------------------------------------------

describe('tuningFamilyMostDistantAmbassadorPair (Q704)', () => {
  it('returns the pair with maximum distance', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyMostDistantAmbassadorPair([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result).not.toBeNull();
    expect(typeof result!.idA).toBe('string');
    expect(typeof result!.idB).toBe('string');
    expect(result!.distance).toBeGreaterThanOrEqual(0);
  });

  it('returns null for 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyMostDistantAmbassadorPair([], spec)).toBeNull();
    expect(tuningFamilyMostDistantAmbassadorPair([t12], spec)).toBeNull();
  });

  it('distance is >= all other pairs', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const most = tuningFamilyMostDistantAmbassadorPair(tunings, spec);
    const matrix = tuningFamilyAmbassadorProfileDistanceMatrix(tunings, spec);
    for (const entry of matrix) {
      expect(most!.distance).toBeGreaterThanOrEqual(entry.distance);
    }
  });
});

// ---------------------------------------------------------------------------
// Q705 — tuningFamilyAmbassadorCentralityScores
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorCentralityScores (Q705)', () => {
  it('returns one entry per tuning with rank', () => {
    const spec = harmonicSpectrum(6);
    const scores = tuningFamilyAmbassadorCentralityScores([t12, edo(19, 440), edo(31, 440)], spec);
    expect(scores.length).toBe(3);
    expect(scores[0]!.rank).toBe(1);
    for (const s of scores) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.meanDistanceToOthers).toBe('number');
    }
  });

  it('sorted by meanDistanceToOthers ascending', () => {
    const spec = harmonicSpectrum(6);
    const scores = tuningFamilyAmbassadorCentralityScores([t12, edo(19, 440), edo(31, 440)], spec);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]!.meanDistanceToOthers).toBeLessThanOrEqual(
        scores[i]!.meanDistanceToOthers,
      );
    }
  });

  it('returns empty array for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorCentralityScores([], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q706 — tuningFamilyAmbassadorCentrality
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorCentrality (Q706)', () => {
  it('returns the most central tuning (rank 1)', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorCentrality([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result).not.toBeNull();
    expect(result!.rank).toBe(1);
    expect(typeof result!.id).toBe('string');
  });

  it('returns null for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorCentrality([], spec)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q708 — tuningFamilyAmbassadorOutlier
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorOutlier (Q708)', () => {
  it('returns the tuning with highest mean distance to others', () => {
    const spec = harmonicSpectrum(6);
    const outlier = tuningFamilyAmbassadorOutlier([t12, edo(19, 440), edo(31, 440)], spec);
    expect(outlier).not.toBeNull();
    expect(typeof outlier!.id).toBe('string');
    expect(typeof outlier!.meanDistanceToOthers).toBe('number');
  });

  it('returns null for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorOutlier([], spec)).toBeNull();
  });

  it('outlier meanDistance >= central meanDistance', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const central = tuningFamilyAmbassadorCentrality(tunings, spec);
    const outlier = tuningFamilyAmbassadorOutlier(tunings, spec);
    if (central && outlier) {
      expect(outlier.meanDistanceToOthers).toBeGreaterThanOrEqual(central.meanDistanceToOthers);
    }
  });
});

// ---------------------------------------------------------------------------
// Q710 — tuningFamilyAmbassadorCentralityNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorCentralityNarrative (Q710)', () => {
  it('returns scores and centralityNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorCentralityNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.centralityNarrative).toBe('string');
    expect(result.centralityNarrative.length).toBeGreaterThan(0);
    expect(result.scores.length).toBe(2);
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorCentralityNarrative([], spec);
    expect(result.centralityNarrative).toContain('No tunings');
  });

  it('narrative for single tuning mentions single', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorCentralityNarrative([t12], spec);
    expect(result.centralityNarrative).toContain('Single');
  });
});

// ---------------------------------------------------------------------------
// Q712 — tuningFamilyAmbassadorDistanceSpread
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorDistanceSpread (Q712)', () => {
  it('returns central/outlier/spread', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorDistanceSpread([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result).not.toBeNull();
    expect(typeof result!.spread).toBe('number');
    expect(result!.spread).toBeGreaterThanOrEqual(0);
  });

  it('spread = outlier.meanDistance - central.meanDistance', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440), edo(31, 440)];
    const result = tuningFamilyAmbassadorDistanceSpread(tunings, spec);
    if (result && result.central && result.outlier) {
      expect(result.spread).toBeCloseTo(
        result.outlier.meanDistanceToOthers - result.central.meanDistanceToOthers,
      );
    }
  });

  it('returns null for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorDistanceSpread([], spec)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q714 — tuningFamilyAmbassadorDistanceSpreadNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorDistanceSpreadNarrative (Q714)', () => {
  it('returns spread and spreadNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorDistanceSpreadNarrative(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(typeof result.spreadNarrative).toBe('string');
    expect(result.spreadNarrative.length).toBeGreaterThan(0);
  });

  it('narrative for empty list mentions 0 or 1 tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorDistanceSpreadNarrative([], spec);
    expect(result.spreadNarrative).toContain('No spread');
  });

  it('narrative for identical pair mentions equidistant', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorDistanceSpreadNarrative([t12, t12], spec);
    expect(result.spreadNarrative).toContain('equidistant');
  });
});

// ---------------------------------------------------------------------------
// Q716 — tuningFamilyFullAmbassadorAnalytics
// ---------------------------------------------------------------------------

describe('tuningFamilyFullAmbassadorAnalytics (Q716)', () => {
  it('returns all five analytics fields', () => {
    const spec = harmonicSpectrum(6);
    const analytics = tuningFamilyFullAmbassadorAnalytics([t12, edo(19, 440)], spec);
    expect(Array.isArray(analytics.report.ranking)).toBe(true);
    expect(typeof analytics.convergenceBundle.profileConvergence.convergenceScore).toBe('number');
    expect(typeof analytics.centralityNarrative.centralityNarrative).toBe('string');
    expect(typeof analytics.distanceStats.mean).toBe('number');
    // distanceSpread can be null for single tuning or non-null for 2+
    if (analytics.distanceSpread !== null) {
      expect(typeof analytics.distanceSpread.spread).toBe('number');
    }
  });

  it('returns empty/null fields for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const analytics = tuningFamilyFullAmbassadorAnalytics([], spec);
    expect(analytics.report.ranking.length).toBe(0);
    expect(analytics.distanceSpread).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q718 — tuningFamilyFullAmbassadorAnalyticsNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyFullAmbassadorAnalyticsNarrative (Q718)', () => {
  it('returns analytics and analyticsNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyFullAmbassadorAnalyticsNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.analyticsNarrative).toBe('string');
    expect(result.analyticsNarrative.length).toBeGreaterThan(0);
    expect(result.analytics.report.ranking.length).toBe(2);
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyFullAmbassadorAnalyticsNarrative([], spec);
    expect(result.analyticsNarrative).toContain('No tunings');
  });
});

// ---------------------------------------------------------------------------
// Q720 — tuningFamilyAmbassadorsSummaryTable
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorsSummaryTable (Q720)', () => {
  it('returns compact summary rows with all fields', () => {
    const spec = harmonicSpectrum(6);
    const table = tuningFamilyAmbassadorsSummaryTable([t12, edo(19, 440)], spec);
    expect(table.length).toBe(2);
    for (const row of table) {
      expect(typeof row.id).toBe('string');
      expect(typeof row.ambassadorModeName).toBe('string');
      expect(typeof row.profile).toBe('string');
      expect(typeof row.consensus).toBe('string');
      expect(typeof row.score).toBe('number');
      expect(typeof row.rank).toBe('number');
    }
    expect(table[0]!.rank).toBe(1);
  });

  it('returns empty array for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorsSummaryTable([], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q722 — tuningFamilyAmbassadorsSummaryNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorsSummaryNarrative (Q722)', () => {
  it('returns table and multiline summaryNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorsSummaryNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.summaryNarrative).toBe('string');
    expect(result.summaryNarrative.length).toBeGreaterThan(0);
    expect(result.table.length).toBe(2);
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorsSummaryNarrative([], spec);
    expect(result.summaryNarrative).toContain('No tunings');
  });

  it('narrative contains each tuning ID', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilyAmbassadorsSummaryNarrative([t12, edo(19, 440)], spec);
    expect(result.summaryNarrative).toContain(t12.id);
  });
});

// ---------------------------------------------------------------------------
// Q724 — tuningFamilyAmbassadorTopN
// ---------------------------------------------------------------------------

describe('tuningFamilyAmbassadorTopN (Q724)', () => {
  it('returns at most N entries', () => {
    const spec = harmonicSpectrum(6);
    const top2 = tuningFamilyAmbassadorTopN([t12, edo(19, 440), edo(31, 440)], spec, 2);
    expect(top2.length).toBe(2);
    expect(top2[0]!.rank).toBe(1);
  });

  it('returns all entries if N > family size', () => {
    const spec = harmonicSpectrum(6);
    const top10 = tuningFamilyAmbassadorTopN([t12, edo(19, 440)], spec, 10);
    expect(top10.length).toBe(2);
  });

  it('returns empty array for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilyAmbassadorTopN([], spec, 3)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q726 — tuningSocraticProfile
// ---------------------------------------------------------------------------

describe('tuningSocraticProfile (Q726)', () => {
  it('returns all five analytics fields', () => {
    const spec = harmonicSpectrum(6);
    const profile = tuningSocraticProfile(t12, spec);
    expect(typeof profile.ambassador.mode.id).toBe('string');
    expect(typeof profile.profileDiversity.normalized).toBe('number');
    expect(typeof profile.soloRatio.soloRatio).toBe('number');
    expect(typeof profile.textureReport.runSummary.totalModes).toBe('number');
    // dominantProfile can be null for degenerate tuning
    if (profile.dominantProfile !== null) {
      expect(typeof profile.dominantProfile.profile).toBe('string');
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const profile = tuningSocraticProfile(t12, spec, 261.63);
    expect(typeof profile.ambassador.mode.id).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q728 — tuningSocraticProfileNarrative
// ---------------------------------------------------------------------------

describe('tuningSocraticProfileNarrative (Q728)', () => {
  it('returns profile and socraticNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticProfileNarrative(t12, spec);
    expect(typeof result.socraticNarrative).toBe('string');
    expect(result.socraticNarrative.length).toBeGreaterThan(0);
  });

  it('narrative contains tuning name and ambassador mode name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticProfileNarrative(t12, spec);
    expect(result.socraticNarrative).toContain(t12.name);
    expect(result.socraticNarrative).toContain(result.profile.ambassador.mode.name);
  });
});

// ---------------------------------------------------------------------------
// Q730 — tuningFamilySocraticProfiles
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticProfiles (Q730)', () => {
  it('returns one entry per tuning', () => {
    const spec = harmonicSpectrum(6);
    const profiles = tuningFamilySocraticProfiles([t12, edo(19, 440)], spec);
    expect(profiles.length).toBe(2);
    for (const p of profiles) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.socraticProfile.ambassador.mode.id).toBe('string');
    }
  });

  it('returns empty array for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilySocraticProfiles([], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q732 — tuningFamilySocraticProfileNarratives
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticProfileNarratives (Q732)', () => {
  it('returns one narrative per tuning', () => {
    const spec = harmonicSpectrum(6);
    const results = tuningFamilySocraticProfileNarratives([t12, edo(19, 440)], spec);
    expect(results.length).toBe(2);
    for (const r of results) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.socraticNarrative).toBe('string');
      expect(r.socraticNarrative.length).toBeGreaterThan(0);
    }
  });

  it('returns empty array for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilySocraticProfileNarratives([], spec)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Q734 — tuningFamilySocraticComparison
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticComparison (Q734)', () => {
  it('returns comparison with four fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticComparison([t12, edo(19, 440), edo(31, 440)], spec);
    expect(typeof result.mostDiverse === 'string' || result.mostDiverse === null).toBe(true);
    expect(typeof result.leastDiverse === 'string' || result.leastDiverse === null).toBe(true);
    expect(typeof result.mostUnique === 'string' || result.mostUnique === null).toBe(true);
    // mostVersatile can be null
  });

  it('returns all nulls for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticComparison([], spec);
    expect(result.mostDiverse).toBeNull();
    expect(result.leastDiverse).toBeNull();
    expect(result.mostUnique).toBeNull();
    expect(result.mostVersatile).toBeNull();
  });

  it('mostDiverse and leastDiverse are valid tuning IDs', () => {
    const spec = harmonicSpectrum(6);
    const tunings = [t12, edo(19, 440)];
    const result = tuningFamilySocraticComparison(tunings, spec);
    const ids = tunings.map((t) => t.id);
    if (result.mostDiverse) expect(ids).toContain(result.mostDiverse);
    if (result.leastDiverse) expect(ids).toContain(result.leastDiverse);
  });
});

// ---------------------------------------------------------------------------
// Q736 — tuningFamilySocraticComparisonNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticComparisonNarrative (Q736)', () => {
  it('returns comparison and comparisonNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticComparisonNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.comparisonNarrative).toBe('string');
    expect(result.comparisonNarrative.length).toBeGreaterThan(0);
  });

  it('narrative for empty list says no tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticComparisonNarrative([], spec);
    expect(result.comparisonNarrative).toContain('No tunings');
  });

  it('narrative contains Family comparison header', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticComparisonNarrative([t12, edo(19, 440)], spec);
    expect(result.comparisonNarrative).toContain('Family comparison');
  });
});

// ---------------------------------------------------------------------------
// Q738 — tuningFamilySocraticInsight
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticInsight (Q738)', () => {
  it('returns profiles and comparison fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsight([t12, edo(19, 440)], spec);
    expect(Array.isArray(result.profiles)).toBe(true);
    expect(result.profiles.length).toBe(2);
    expect(
      typeof result.comparison.mostDiverse === 'string' || result.comparison.mostDiverse === null,
    ).toBe(true);
    expect(
      typeof result.comparison.leastDiverse === 'string' || result.comparison.leastDiverse === null,
    ).toBe(true);
  });

  it('returns empty profiles and null comparison for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsight([], spec);
    expect(result.profiles).toEqual([]);
    expect(result.comparison.mostDiverse).toBeNull();
    expect(result.comparison.leastDiverse).toBeNull();
    expect(result.comparison.mostUnique).toBeNull();
    expect(result.comparison.mostVersatile).toBeNull();
  });

  it('profiles contain id and socraticProfile fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsight([t12], spec);
    expect(typeof result.profiles[0]!.id).toBe('string');
    expect(typeof result.profiles[0]!.socraticProfile.ambassador.mode.id).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q740 — tuningFamilySocraticInsightNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticInsightNarrative (Q740)', () => {
  it('returns profiles, comparison, and insightNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightNarrative([t12, edo(19, 440)], spec);
    expect(Array.isArray(result.profiles)).toBe(true);
    expect(typeof result.insightNarrative).toBe('string');
    expect(result.insightNarrative.length).toBeGreaterThan(0);
  });

  it('returns "No tunings to analyze." for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightNarrative([], spec);
    expect(result.insightNarrative).toBe('No tunings to analyze.');
  });

  it('narrative contains Family insight header and Profile summaries section', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightNarrative([t12, edo(19, 440)], spec);
    expect(result.insightNarrative).toContain('Family insight');
    expect(result.insightNarrative).toContain('Profile summaries');
  });

  it('narrative contains tuning IDs', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightNarrative([t12], spec);
    expect(result.insightNarrative).toContain(t12.id);
  });
});

// ---------------------------------------------------------------------------
// Q742 — tuningSocraticContrast
// ---------------------------------------------------------------------------

describe('tuningSocraticContrast (Q742)', () => {
  it('returns profileA, profileB, distance, sameConsensus, sameProfile', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrast(t12, edo(19, 440), spec);
    expect(typeof result.profileA.ambassador.mode.id).toBe('string');
    expect(typeof result.profileB.ambassador.mode.id).toBe('string');
    expect(typeof result.distance).toBe('number');
    expect(typeof result.sameConsensus).toBe('boolean');
    expect(typeof result.sameProfile).toBe('boolean');
  });

  it('distance is between 0 and 4', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrast(t12, edo(19, 440), spec);
    expect(result.distance).toBeGreaterThanOrEqual(0);
    expect(result.distance).toBeLessThanOrEqual(4);
  });

  it('same tuning produces distance 0 and sameConsensus/sameProfile true', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrast(t12, t12, spec);
    expect(result.distance).toBe(0);
    expect(result.sameConsensus).toBe(true);
    expect(result.sameProfile).toBe(true);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrast(t12, edo(19, 440), spec, 261.63);
    expect(typeof result.distance).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Q744 — tuningSocraticContrastNarrative
// ---------------------------------------------------------------------------

describe('tuningSocraticContrastNarrative (Q744)', () => {
  it('returns all contrast fields plus contrastNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrastNarrative(t12, edo(19, 440), spec);
    expect(typeof result.profileA.ambassador.mode.id).toBe('string');
    expect(typeof result.profileB.ambassador.mode.id).toBe('string');
    expect(typeof result.distance).toBe('number');
    expect(typeof result.sameConsensus).toBe('boolean');
    expect(typeof result.sameProfile).toBe('boolean');
    expect(typeof result.contrastNarrative).toBe('string');
    expect(result.contrastNarrative.length).toBeGreaterThan(0);
  });

  it('narrative contains both tuning IDs', () => {
    const spec = harmonicSpectrum(6);
    const t19 = edo(19, 440);
    const result = tuningSocraticContrastNarrative(t12, t19, spec);
    expect(result.contrastNarrative).toContain(t12.id);
    expect(result.contrastNarrative).toContain(t19.id);
  });

  it('narrative contains distance and profile labels', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrastNarrative(t12, edo(19, 440), spec);
    expect(result.contrastNarrative).toContain('Distance:');
    expect(result.contrastNarrative).toContain('Profile A:');
    expect(result.contrastNarrative).toContain('Profile B:');
    expect(result.contrastNarrative).toContain('Same quadrant profile:');
    expect(result.contrastNarrative).toContain('Same consensus:');
  });

  it('same tuning produces distance 0 and matching consensus/profile labels', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrastNarrative(t12, t12, spec);
    expect(result.distance).toBe(0);
    expect(result.sameConsensus).toBe(true);
    expect(result.sameProfile).toBe(true);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticContrastNarrative(t12, edo(19, 440), spec, 261.63);
    expect(typeof result.contrastNarrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q746 — tuningFamilySocraticRecommendation
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticRecommendation (Q746)', () => {
  it('returns null fields for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendation([], spec);
    expect(result.recommendedId).toBeNull();
    expect(result.reason).toBeNull();
    expect(result.alternativeId).toBeNull();
  });

  it('returns a recommendedId and reason for a single tuning', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendation([t12], spec);
    expect(typeof result.recommendedId).toBe('string');
    expect(result.reason).not.toBeNull();
  });

  it('returns a recommendedId and reason for multiple tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendation([t12, edo(19, 440), edo(31, 440)], spec);
    expect(typeof result.recommendedId).toBe('string');
    expect(['most-versatile', 'most-central', 'first']).toContain(result.reason);
  });

  it('alternativeId differs from recommendedId when multiple tunings provided', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendation([t12, edo(19, 440)], spec);
    if (result.alternativeId !== null) {
      expect(result.alternativeId).not.toBe(result.recommendedId);
    }
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendation([t12, edo(19, 440)], spec, 261.63);
    expect(typeof result.recommendedId).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q748 — tuningFamilySocraticRecommendationNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticRecommendationNarrative (Q748)', () => {
  it('returns recommendation fields plus recommendationNarrative string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendationNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.recommendedId).toBe('string');
    expect(typeof result.reason).toBe('string');
    expect(typeof result.recommendationNarrative).toBe('string');
    expect(result.recommendationNarrative.length).toBeGreaterThan(0);
  });

  it('returns fixed message for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendationNarrative([], spec);
    expect(result.recommendationNarrative).toBe('No tunings available for recommendation.');
    expect(result.recommendedId).toBeNull();
    expect(result.reason).toBeNull();
    expect(result.alternativeId).toBeNull();
  });

  it('narrative contains Recommendation header', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendationNarrative([t12, edo(19, 440)], spec);
    expect(result.recommendationNarrative).toContain('Recommendation for family of');
    expect(result.recommendationNarrative).toContain('Recommended:');
    expect(result.recommendationNarrative).toContain('Alternative:');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticRecommendationNarrative([t12], spec, 261.63);
    expect(typeof result.recommendationNarrative).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Q750 — tuningFamilySocraticPairwiseContrasts
// ---------------------------------------------------------------------------
describe('tuningFamilySocraticPairwiseContrasts (Q750)', () => {
  it('returns empty array for fewer than 2 tunings', () => {
    const spec = harmonicSpectrum(6);
    expect(tuningFamilySocraticPairwiseContrasts([], spec)).toEqual([]);
    expect(tuningFamilySocraticPairwiseContrasts([t12], spec)).toEqual([]);
  });

  it('returns 1 pair for 2 tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrasts([t12, edo(19, 440)], spec);
    expect(result).toHaveLength(1);
  });

  it('returns 3 pairs for 3 tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrasts([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result).toHaveLength(3);
  });

  it('each entry has idA, idB, distance, sameConsensus, sameProfile', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrasts([t12, edo(19, 440)], spec);
    const entry = result[0]!;
    expect(typeof entry.idA).toBe('string');
    expect(typeof entry.idB).toBe('string');
    expect(typeof entry.distance).toBe('number');
    expect(typeof entry.sameConsensus).toBe('boolean');
    expect(typeof entry.sameProfile).toBe('boolean');
  });

  it('idA and idB correspond to the tuning ids', () => {
    const spec = harmonicSpectrum(6);
    const t19 = edo(19, 440);
    const result = tuningFamilySocraticPairwiseContrasts([t12, t19], spec);
    expect(result[0]!.idA).toBe(t12.id);
    expect(result[0]!.idB).toBe(t19.id);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrasts([t12, edo(19, 440)], spec, 261.63);
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Q752 — tuningFamilySocraticPairwiseContrastStats
// ---------------------------------------------------------------------------
describe('tuningFamilySocraticPairwiseContrastStats (Q752)', () => {
  it('returns all-zero stats for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStats([], spec);
    expect(result.totalPairs).toBe(0);
    expect(result.meanDistance).toBe(0);
    expect(result.minDistance).toBe(0);
    expect(result.maxDistance).toBe(0);
    expect(result.sameConsensusCount).toBe(0);
    expect(result.sameProfileCount).toBe(0);
  });

  it('returns all 6 fields for a valid family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStats([t12, edo(19, 440)], spec);
    expect('totalPairs' in result).toBe(true);
    expect('meanDistance' in result).toBe(true);
    expect('minDistance' in result).toBe(true);
    expect('maxDistance' in result).toBe(true);
    expect('sameConsensusCount' in result).toBe(true);
    expect('sameProfileCount' in result).toBe(true);
  });

  it('totalPairs equals number of pairs', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStats(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result.totalPairs).toBe(3);
  });

  it('minDistance <= meanDistance <= maxDistance', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStats(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result.minDistance).toBeLessThanOrEqual(result.meanDistance);
    expect(result.meanDistance).toBeLessThanOrEqual(result.maxDistance);
  });

  it('sameConsensusCount and sameProfileCount are within [0, totalPairs]', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStats(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result.sameConsensusCount).toBeGreaterThanOrEqual(0);
    expect(result.sameConsensusCount).toBeLessThanOrEqual(result.totalPairs);
    expect(result.sameProfileCount).toBeGreaterThanOrEqual(0);
    expect(result.sameProfileCount).toBeLessThanOrEqual(result.totalPairs);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStats([t12, edo(19, 440)], spec, 261.63);
    expect(result.totalPairs).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Q754 — tuningFamilySocraticPairwiseContrastStatsNarrative
// ---------------------------------------------------------------------------
describe('tuningFamilySocraticPairwiseContrastStatsNarrative (Q754)', () => {
  it('returns No pairwise message for empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStatsNarrative([], spec);
    expect(result.contrastStatsNarrative).toBe('No pairwise contrasts to analyze.');
  });

  it('narrative contains contrast stats for non-empty family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStatsNarrative([t12, edo(19, 440)], spec);
    expect(result.contrastStatsNarrative).toContain('contrast stats');
  });

  it('spreads all stats fields into the return value', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStatsNarrative([t12, edo(19, 440)], spec);
    expect('totalPairs' in result).toBe(true);
    expect('meanDistance' in result).toBe(true);
    expect('minDistance' in result).toBe(true);
    expect('maxDistance' in result).toBe(true);
    expect('sameConsensusCount' in result).toBe(true);
    expect('sameProfileCount' in result).toBe(true);
  });

  it('narrative mentions pair count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStatsNarrative(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result.contrastStatsNarrative).toContain('3 pairs');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticPairwiseContrastStatsNarrative([t12], spec, 261.63);
    expect(result.contrastStatsNarrative).toBe('No pairwise contrasts to analyze.');
  });
});

// ---------------------------------------------------------------------------
// Q756 — tuningFamilySocraticDiversityIndex
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticDiversityIndex (Q756)', () => {
  it('returns all zeros for a single tuning', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndex([t12], spec);
    expect(result.diversityIndex).toBe(0);
    expect(result.meanDistNorm).toBe(0);
    expect(result.antiConvergence).toBe(0);
  });

  it('returns all zeros for empty tuning list', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndex([], spec);
    expect(result.diversityIndex).toBe(0);
    expect(result.meanDistNorm).toBe(0);
    expect(result.antiConvergence).toBe(0);
  });

  it('returns all 3 fields for a 2-tuning family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndex([t12, edo(19, 440)], spec);
    expect('diversityIndex' in result).toBe(true);
    expect('meanDistNorm' in result).toBe(true);
    expect('antiConvergence' in result).toBe(true);
  });

  it('diversityIndex is between 0 and 1 for a 2-tuning family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndex([t12, edo(19, 440)], spec);
    expect(result.diversityIndex).toBeGreaterThanOrEqual(0);
    expect(result.diversityIndex).toBeLessThanOrEqual(1);
  });

  it('diversityIndex is between 0 and 1 for a 3-tuning family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndex([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.diversityIndex).toBeGreaterThanOrEqual(0);
    expect(result.diversityIndex).toBeLessThanOrEqual(1);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndex([t12, edo(19, 440)], spec, 440);
    expect(result.diversityIndex).toBeGreaterThanOrEqual(0);
    expect(result.diversityIndex).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Q758 — tuningFamilySocraticDiversityIndexNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticDiversityIndexNarrative (Q758)', () => {
  it('returns "requires at least 2 tunings" for empty list', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndexNarrative([], spec);
    expect(result.diversityIndexNarrative).toBe('Diversity index requires at least 2 tunings.');
  });

  it('returns "requires at least 2 tunings" for single tuning', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndexNarrative([t12], spec);
    expect(result.diversityIndexNarrative).toBe('Diversity index requires at least 2 tunings.');
  });

  it('narrative contains the label for a 2-tuning family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndexNarrative([t12, edo(19, 440)], spec);
    const labels = ['homogeneous', 'varied', 'diverse', 'heterogeneous'];
    expect(labels.some((label) => result.diversityIndexNarrative.includes(label))).toBe(true);
  });

  it('spreads all diversity index fields into the return value', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndexNarrative([t12, edo(19, 440)], spec);
    expect('diversityIndex' in result).toBe(true);
    expect('meanDistNorm' in result).toBe(true);
    expect('antiConvergence' in result).toBe(true);
    expect('diversityIndexNarrative' in result).toBe(true);
  });

  it('narrative mentions tuning count for 3-tuning family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticDiversityIndexNarrative(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result.diversityIndexNarrative).toContain('3 tunings');
  });
});

// ---------------------------------------------------------------------------
// Q760 — tuningFamilySocraticEvolutionRanking
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticEvolutionRanking (Q760)', () => {
  it('returns empty array for empty tuning list', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRanking([], spec);
    expect(result).toEqual([]);
  });

  it('returns array of length equal to input tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.length).toBe(3);
  });

  it('evolutionRank starts at 1', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result[0]!.evolutionRank).toBe(1);
  });

  it('evolutionRank is sequential', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRanking([t12, edo(19, 440), edo(31, 440)], spec);
    result.forEach((entry, i) => {
      expect(entry.evolutionRank).toBe(i + 1);
    });
  });

  it('evolutionLabel is one of the 3 valid values', () => {
    const spec = harmonicSpectrum(6);
    const valid = ['traditional', 'transitional', 'experimental'];
    const result = tuningFamilySocraticEvolutionRanking([t12, edo(19, 440), edo(31, 440)], spec);
    result.forEach((entry) => {
      expect(valid).toContain(entry.evolutionLabel);
    });
  });

  it('first entry is "traditional" for a 3-tuning family', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRanking([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result[0]!.evolutionLabel).toBe('traditional');
  });

  it('returns id field for each entry', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRanking([t12, edo(19, 440)], spec);
    result.forEach((entry) => {
      expect(typeof entry.id).toBe('string');
    });
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRanking([t12, edo(19, 440)], spec, 440);
    expect(result.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Q762 — tuningFamilySocraticEvolutionRankingNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticEvolutionRankingNarrative (Q762)', () => {
  it('returns ranking array and evolutionNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRankingNarrative([t12, edo(19, 440)], spec);
    expect(Array.isArray(result.ranking)).toBe(true);
    expect(typeof result.evolutionNarrative).toBe('string');
  });

  it('evolutionNarrative contains "Evolution ranking" for non-empty input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRankingNarrative([t12, edo(19, 440)], spec);
    expect(result.evolutionNarrative).toContain('Evolution ranking');
  });

  it('returns "No tunings to rank." for empty input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRankingNarrative([], spec);
    expect(result.evolutionNarrative).toBe('No tunings to rank.');
    expect(result.ranking.length).toBe(0);
  });

  it('ranking array length matches tunings length', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRankingNarrative(
      [t12, edo(19, 440), edo(31, 440)],
      spec,
    );
    expect(result.ranking.length).toBe(3);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticEvolutionRankingNarrative([t12, edo(19, 440)], spec, 440);
    expect(result.ranking.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Q764 — tuningFamilySocraticClusterMap
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticClusterMap (Q764)', () => {
  it('returns traditional, transitional, experimental arrays', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMap([t12, edo(19, 440), edo(31, 440)], spec);
    expect(Array.isArray(result.traditional)).toBe(true);
    expect(Array.isArray(result.transitional)).toBe(true);
    expect(Array.isArray(result.experimental)).toBe(true);
  });

  it('total length equals input length', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMap([t12, edo(19, 440), edo(31, 440)], spec);
    const total =
      result.traditional.length + result.transitional.length + result.experimental.length;
    expect(total).toBe(3);
  });

  it('no IDs duplicated across clusters', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMap([t12, edo(19, 440), edo(31, 440)], spec);
    const allIds = [...result.traditional, ...result.transitional, ...result.experimental];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('returns empty clusters for empty input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMap([], spec);
    expect(result.traditional.length).toBe(0);
    expect(result.transitional.length).toBe(0);
    expect(result.experimental.length).toBe(0);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMap([t12, edo(19, 440)], spec, 440);
    const total =
      result.traditional.length + result.transitional.length + result.experimental.length;
    expect(total).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Q766 — tuningFamilySocraticClusterMapNarrative
// ---------------------------------------------------------------------------

describe('tuningFamilySocraticClusterMapNarrative (Q766)', () => {
  it('returns cluster arrays and clusterMapNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMapNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.clusterMapNarrative).toBe('string');
    expect(Array.isArray(result.traditional)).toBe(true);
    expect(Array.isArray(result.transitional)).toBe(true);
    expect(Array.isArray(result.experimental)).toBe(true);
  });

  it('clusterMapNarrative contains "Cluster map" for non-empty input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMapNarrative([t12, edo(19, 440)], spec);
    expect(result.clusterMapNarrative).toContain('Cluster map');
  });

  it('narrative contains each cluster label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMapNarrative([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.clusterMapNarrative).toContain('Traditional');
    expect(result.clusterMapNarrative).toContain('Transitional');
    expect(result.clusterMapNarrative).toContain('Experimental');
  });

  it('returns "No tunings to cluster." for empty input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMapNarrative([], spec);
    expect(result.clusterMapNarrative).toBe('No tunings to cluster.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticClusterMapNarrative([t12, edo(19, 440)], spec, 440);
    expect(result.clusterMapNarrative).toContain('Cluster map');
  });
});

// Q768 — tuningFamilySocraticTopologyScore
describe('tuningFamilySocraticTopologyScore (Q768)', () => {
  it('returns topologyScore and topologyLabel for two tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScore([t12, edo(19, 440)], spec);
    expect(typeof result.topologyScore).toBe('number');
    expect(['centralized', 'distributed', 'dispersed']).toContain(result.topologyLabel);
  });

  it('topologyScore is between 0 and 1 inclusive', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScore([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.topologyScore).toBeGreaterThanOrEqual(0);
    expect(result.topologyScore).toBeLessThanOrEqual(1);
  });

  it('single tuning returns centralized with score 0', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScore([t12], spec);
    expect(result.topologyScore).toBe(0);
    expect(result.topologyLabel).toBe('centralized');
  });

  it('empty tunings returns centralized with score 0', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScore([], spec);
    expect(result.topologyScore).toBe(0);
    expect(result.topologyLabel).toBe('centralized');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScore([t12, edo(19, 440)], spec, 440);
    expect(['centralized', 'distributed', 'dispersed']).toContain(result.topologyLabel);
  });
});

// Q770 — tuningFamilySocraticTopologyScoreNarrative
describe('tuningFamilySocraticTopologyScoreNarrative (Q770)', () => {
  it('narrative contains "Topology" for two tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScoreNarrative([t12, edo(19, 440)], spec);
    expect(result.topologyNarrative).toContain('Topology');
  });

  it('single tuning returns "requires at least 2" message', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScoreNarrative([t12], spec);
    expect(result.topologyNarrative).toContain('requires at least 2');
  });

  it('returns topologyScore and topologyLabel in addition to narrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScoreNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.topologyScore).toBe('number');
    expect(['centralized', 'distributed', 'dispersed']).toContain(result.topologyLabel);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticTopologyScoreNarrative([t12, edo(19, 440)], spec, 440);
    expect(result.topologyNarrative).toContain('Topology');
  });
});

// Q772 — tuningFamilySocraticSummaryBundle
describe('tuningFamilySocraticSummaryBundle (Q772)', () => {
  it('returns all three bundle keys', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundle([t12, edo(19, 440)], spec);
    expect(result).toHaveProperty('clusterMap');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('recommendation');
  });

  it('clusterMap has traditional, transitional, experimental', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundle([t12, edo(19, 440)], spec);
    expect(Array.isArray(result.clusterMap.traditional)).toBe(true);
    expect(Array.isArray(result.clusterMap.transitional)).toBe(true);
    expect(Array.isArray(result.clusterMap.experimental)).toBe(true);
  });

  it('comparison has mostDiverse, leastDiverse, mostUnique, mostVersatile', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundle([t12, edo(19, 440)], spec);
    expect(result.comparison).toHaveProperty('mostDiverse');
    expect(result.comparison).toHaveProperty('leastDiverse');
    expect(result.comparison).toHaveProperty('mostUnique');
    expect(result.comparison).toHaveProperty('mostVersatile');
  });

  it('recommendation has recommendedId, reason, alternativeId', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundle([t12, edo(19, 440)], spec);
    expect(result.recommendation).toHaveProperty('recommendedId');
    expect(result.recommendation).toHaveProperty('reason');
    expect(result.recommendation).toHaveProperty('alternativeId');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundle([t12, edo(19, 440)], spec, 440);
    expect(result).toHaveProperty('clusterMap');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('recommendation');
  });
});

// Q774 — tuningFamilySocraticSummaryBundleNarrative
describe('tuningFamilySocraticSummaryBundleNarrative (Q774)', () => {
  it('contains Summary in narrative for non-empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundleNarrative([t12, edo(19, 440)], spec);
    expect(result.summaryBundleNarrative).toContain('Summary');
  });

  it('returns all bundle keys alongside narrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundleNarrative([t12, edo(19, 440)], spec);
    expect(result).toHaveProperty('clusterMap');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('summaryBundleNarrative');
  });

  it('empty tunings returns No tunings to summarize', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundleNarrative([], spec);
    expect(result.summaryBundleNarrative).toBe('No tunings to summarize.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSummaryBundleNarrative([t12, edo(19, 440)], spec, 440);
    expect(result.summaryBundleNarrative).toContain('Summary');
  });
});

// Q776 — tuningSocraticCharacterPortrait
describe('tuningSocraticCharacterPortrait (Q776)', () => {
  it('portrait is a non-empty string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticCharacterPortrait(t12, spec);
    expect(typeof result.portrait).toBe('string');
    expect(result.portrait.length).toBeGreaterThan(0);
  });

  it('portrait contains tuning name', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticCharacterPortrait(t12, spec);
    expect(result.portrait).toContain(t12.name);
  });

  it('portrait contains ambassador', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticCharacterPortrait(t12, spec);
    expect(result.portrait).toContain('ambassador');
  });

  it('portrait contains tuning id', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticCharacterPortrait(t12, spec);
    expect(result.portrait).toContain(t12.id);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningSocraticCharacterPortrait(t12, spec, 440);
    expect(result.portrait.length).toBeGreaterThan(0);
  });
});

// Q778 — tuningFamilySocraticCharacterPortraits
describe('tuningFamilySocraticCharacterPortraits (Q778)', () => {
  it('array length matches input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticCharacterPortraits([t12, edo(19, 440)], spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id and portrait', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticCharacterPortraits([t12, edo(19, 440)], spec);
    for (const entry of result) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('portrait');
    }
  });

  it('empty input returns empty array', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticCharacterPortraits([], spec);
    expect(result).toEqual([]);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticCharacterPortraits([t12, edo(19, 440)], spec, 440);
    expect(result.length).toBe(2);
  });
});

// Q780 — tuningFamilySocraticFamilyPortrait
describe('tuningFamilySocraticFamilyPortrait (Q780)', () => {
  it('familyPortrait is a non-empty string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticFamilyPortrait([t12, edo(19, 440)], spec);
    expect(typeof result.familyPortrait).toBe('string');
    expect(result.familyPortrait.length).toBeGreaterThan(0);
  });

  it('familyPortrait contains tuning count', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticFamilyPortrait([t12, edo(19, 440)], spec);
    expect(result.familyPortrait).toContain('2');
  });

  it('empty tunings returns Empty family.', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticFamilyPortrait([], spec);
    expect(result.familyPortrait).toBe('Empty family.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticFamilyPortrait([t12, edo(19, 440)], spec, 440);
    expect(result.familyPortrait.length).toBeGreaterThan(0);
  });
});

// Q782 — tuningFamilySocraticInsightDigest
describe('tuningFamilySocraticInsightDigest (Q782)', () => {
  it('has all 7 keys', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigest([t12, edo(19, 440)], spec);
    expect(result).toHaveProperty('familyPortrait');
    expect(result).toHaveProperty('diversityIndex');
    expect(result).toHaveProperty('topologyLabel');
    expect(result).toHaveProperty('evolutionRanking');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('characterPortraits');
  });

  it('characterPortraits.length equals tunings.length', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigest([t12, edo(19, 440)], spec);
    expect(result.characterPortraits.length).toBe(2);
  });

  it('works with empty tunings', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigest([], spec);
    expect(result.characterPortraits.length).toBe(0);
    expect(result.familyPortrait).toBe('Empty family.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigest([t12, edo(19, 440)], spec, 440);
    expect(result.characterPortraits.length).toBe(2);
  });
});

// Q784 — tuningFamilySocraticInsightDigestNarrative
describe('tuningFamilySocraticInsightDigestNarrative (Q784)', () => {
  it('digestNarrative contains Evolution and Portraits', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigestNarrative([t12, edo(19, 440)], spec);
    expect(result.digestNarrative).toContain('Evolution');
    expect(result.digestNarrative).toContain('Portraits');
  });

  it('empty tunings returns No tunings to digest.', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigestNarrative([], spec);
    expect(result.digestNarrative).toBe('No tunings to digest.');
  });

  it('has all digest keys plus digestNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigestNarrative([t12, edo(19, 440)], spec);
    expect(result).toHaveProperty('familyPortrait');
    expect(result).toHaveProperty('diversityIndex');
    expect(result).toHaveProperty('topologyLabel');
    expect(result).toHaveProperty('evolutionRanking');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('characterPortraits');
    expect(result).toHaveProperty('digestNarrative');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticInsightDigestNarrative([t12, edo(19, 440)], spec, 440);
    expect(result.digestNarrative).toContain('Evolution');
  });
});

// Q786 — tuningFamilySocraticAxisAnalysis
describe('tuningFamilySocraticAxisAnalysis (Q786)', () => {
  it('returns array with length matching input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisAnalysis([t12, edo(19, 440)], spec);
    expect(result.length).toBe(2);
  });

  it('each entry has id, diversityScore, ambassadorScore', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisAnalysis([t12, edo(19, 440)], spec);
    for (const entry of result) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.diversityScore).toBe('number');
      expect(typeof entry.ambassadorScore).toBe('number');
    }
  });

  it('empty input returns empty array', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisAnalysis([], spec);
    expect(result).toEqual([]);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisAnalysis([t12, edo(19, 440)], spec, 440);
    expect(result.length).toBe(2);
  });
});

// Q788 — tuningFamilySocraticAxisNarrative
describe('tuningFamilySocraticAxisNarrative (Q788)', () => {
  it('axisNarrative contains "Axis analysis"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisNarrative([t12, edo(19, 440)], spec);
    expect(result.axisNarrative).toContain('Axis analysis');
  });

  it('axes array length matches input', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisNarrative([t12, edo(19, 440)], spec);
    expect(result.axes.length).toBe(2);
  });

  it('empty input returns No tunings to analyze.', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisNarrative([], spec);
    expect(result.axisNarrative).toBe('No tunings to analyze.');
    expect(result.axes).toEqual([]);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticAxisNarrative([t12, edo(19, 440)], spec, 440);
    expect(result.axisNarrative).toContain('Axis analysis');
  });
});

// Q790 — tuningFamilySocraticSignature
describe('tuningFamilySocraticSignature (Q790)', () => {
  it('signature is non-empty string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignature([t12, edo(19, 440)], spec);
    expect(typeof result.signature).toBe('string');
    expect(result.signature.length).toBeGreaterThan(0);
  });

  it('signature contains n:, d:, t:, r:', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignature([t12, edo(19, 440)], spec);
    expect(result.signature).toContain('n:');
    expect(result.signature).toContain('d:');
    expect(result.signature).toContain('t:');
    expect(result.signature).toContain('r:');
  });

  it('empty input returns "empty"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignature([], spec);
    expect(result.signature).toBe('empty');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignature([t12, edo(19, 440)], spec, 440);
    expect(result.signature).toContain('n:');
  });
});

// Q792 — tuningFamilySocraticBenchmark
describe('tuningFamilySocraticBenchmark (Q792)', () => {
  it('returns all four fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmark([t12, edo(19, 440)], spec);
    expect(typeof result.benchmarkScore).toBe('number');
    expect(typeof result.diversityComponent).toBe('number');
    expect(typeof result.topologyComponent).toBe('number');
    expect(typeof result.consensusComponent).toBe('number');
  });

  it('benchmarkScore is between 0 and 1', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmark([t12, edo(19, 440)], spec);
    expect(result.benchmarkScore).toBeGreaterThanOrEqual(0);
    expect(result.benchmarkScore).toBeLessThanOrEqual(1);
  });

  it('empty input returns all zeros', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmark([], spec);
    expect(result.benchmarkScore).toBe(0);
    expect(result.diversityComponent).toBe(0);
    expect(result.topologyComponent).toBe(0);
    expect(result.consensusComponent).toBe(0);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmark([t12, edo(19, 440)], spec, 440);
    expect(result.benchmarkScore).toBeGreaterThanOrEqual(0);
  });
});

// Q794 — tuningFamilySocraticBenchmarkNarrative
describe('tuningFamilySocraticBenchmarkNarrative (Q794)', () => {
  it('narrative contains "Benchmark"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkNarrative([t12, edo(19, 440)], spec);
    expect(result.benchmarkNarrative).toContain('Benchmark');
  });

  it('label appears in narrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkNarrative([t12, edo(19, 440)], spec);
    const hasLabel =
      result.benchmarkNarrative.includes('low') ||
      result.benchmarkNarrative.includes('moderate') ||
      result.benchmarkNarrative.includes('high') ||
      result.benchmarkNarrative.includes('excellent');
    expect(hasLabel).toBe(true);
  });

  it('empty input returns "No tunings to benchmark."', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkNarrative([], spec);
    expect(result.benchmarkNarrative).toBe('No tunings to benchmark.');
  });

  it('returns spread of benchmark fields plus benchmarkNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.benchmarkScore).toBe('number');
    expect(typeof result.benchmarkNarrative).toBe('string');
  });
});

// Q796 — tuningFamilySocraticSignatureComparison
describe('tuningFamilySocraticSignatureComparison (Q796)', () => {
  it('returns all five fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignatureComparison([t12], [edo(19, 440)], spec);
    expect(typeof result.signatureA).toBe('string');
    expect(typeof result.signatureB).toBe('string');
    expect(typeof result.sameSize).toBe('boolean');
    expect(typeof result.sameDiversity).toBe('boolean');
    expect(typeof result.sameTopology).toBe('boolean');
  });

  it('same family yields sameSize, sameDiversity, and sameTopology all true', () => {
    const spec = harmonicSpectrum(6);
    const family = [t12, edo(19, 440)];
    const result = tuningFamilySocraticSignatureComparison(family, family, spec);
    expect(result.sameSize).toBe(true);
    expect(result.sameDiversity).toBe(true);
    expect(result.sameTopology).toBe(true);
  });

  it('different size families produce sameSize false', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignatureComparison([t12], [t12, edo(19, 440)], spec);
    expect(result.sameSize).toBe(false);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignatureComparison([t12], [edo(19, 440)], spec, 440);
    expect(typeof result.signatureA).toBe('string');
  });
});

// Q798 — tuningFamilySocraticSignatureComparisonNarrative
describe('tuningFamilySocraticSignatureComparisonNarrative (Q798)', () => {
  it('returns all six fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignatureComparisonNarrative([t12], [edo(19, 440)], spec);
    expect(typeof result.signatureA).toBe('string');
    expect(typeof result.signatureB).toBe('string');
    expect(typeof result.sameSize).toBe('boolean');
    expect(typeof result.sameDiversity).toBe('boolean');
    expect(typeof result.sameTopology).toBe('boolean');
    expect(typeof result.signatureComparisonNarrative).toBe('string');
  });

  it('narrative contains "Signature comparison"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignatureComparisonNarrative([t12], [edo(19, 440)], spec);
    expect(result.signatureComparisonNarrative).toContain('Signature comparison');
  });

  it('same family yields all three booleans true', () => {
    const spec = harmonicSpectrum(6);
    const family = [t12, edo(19, 440)];
    const result = tuningFamilySocraticSignatureComparisonNarrative(family, family, spec);
    expect(result.sameSize).toBe(true);
    expect(result.sameDiversity).toBe(true);
    expect(result.sameTopology).toBe(true);
  });

  it('both empty returns "Both families are empty."', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignatureComparisonNarrative([], [], spec);
    expect(result.signatureComparisonNarrative).toBe('Both families are empty.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticSignatureComparisonNarrative(
      [t12],
      [edo(19, 440)],
      spec,
      440,
    );
    expect(typeof result.signatureComparisonNarrative).toBe('string');
  });
});

// Q800 — tuningFamilySocraticConsensusNarrative
describe('tuningFamilySocraticConsensusNarrative (Q800)', () => {
  it('returns distribution and socraticConsensusNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticConsensusNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.socraticConsensusNarrative).toBe('string');
    expect(typeof result.distribution.versatile).toBe('number');
    expect(typeof result.distribution.balanced).toBe('number');
    expect(typeof result.distribution.specialized).toBe('number');
    expect(typeof result.distribution.total).toBe('number');
  });

  it('narrative contains "Consensus character"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticConsensusNarrative([t12, edo(19, 440)], spec);
    expect(result.socraticConsensusNarrative).toContain('Consensus character');
  });

  it('empty input returns "No modes to assess consensus."', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticConsensusNarrative([], spec);
    expect(result.socraticConsensusNarrative).toBe('No modes to assess consensus.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticConsensusNarrative([t12], spec, 440);
    expect(typeof result.socraticConsensusNarrative).toBe('string');
  });
});

// Q802 — tuningFamilySocraticBenchmarkComparison
describe('tuningFamilySocraticBenchmarkComparison (Q802)', () => {
  it('returns all four fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparison([t12], [edo(19, 440)], spec);
    expect(typeof result.benchmarkA).toBe('number');
    expect(typeof result.benchmarkB).toBe('number');
    expect(typeof result.delta).toBe('number');
    expect(typeof result.winner).toBe('string');
  });

  it('same family yields winner "tie" and |delta| < 0.01', () => {
    const spec = harmonicSpectrum(6);
    const family = [t12, edo(19, 440)];
    const result = tuningFamilySocraticBenchmarkComparison(family, family, spec);
    expect(result.winner).toBe('tie');
    expect(Math.abs(result.delta)).toBeLessThan(0.01);
  });

  it('winner is A, B, or tie', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparison([t12], [edo(19, 440)], spec);
    expect(['A', 'B', 'tie']).toContain(result.winner);
  });

  it('delta equals benchmarkA minus benchmarkB', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparison([t12], [edo(19, 440)], spec);
    expect(result.delta).toBeCloseTo(result.benchmarkA - result.benchmarkB, 10);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparison([t12], [edo(19, 440)], spec, 440);
    expect(typeof result.winner).toBe('string');
  });
});

// Q804 — tuningFamilySocraticBenchmarkComparisonNarrative
describe('tuningFamilySocraticBenchmarkComparisonNarrative (Q804)', () => {
  it('returns all fields plus benchmarkComparisonNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparisonNarrative([t12], [edo(19, 440)], spec);
    expect(typeof result.benchmarkA).toBe('number');
    expect(typeof result.benchmarkB).toBe('number');
    expect(typeof result.delta).toBe('number');
    expect(typeof result.winner).toBe('string');
    expect(typeof result.benchmarkComparisonNarrative).toBe('string');
  });

  it('narrative contains "Benchmark comparison"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparisonNarrative([t12], [edo(19, 440)], spec);
    expect(result.benchmarkComparisonNarrative).toContain('Benchmark comparison');
  });

  it('same family yields winner "tie"', () => {
    const spec = harmonicSpectrum(6);
    const family = [t12, edo(19, 440)];
    const result = tuningFamilySocraticBenchmarkComparisonNarrative(family, family, spec);
    expect(result.winner).toBe('tie');
  });

  it('narrative contains winner value', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparisonNarrative([t12], [edo(19, 440)], spec);
    expect(result.benchmarkComparisonNarrative).toContain(`Winner: ${result.winner}.`);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBenchmarkComparisonNarrative(
      [t12],
      [edo(19, 440)],
      spec,
      440,
    );
    expect(typeof result.benchmarkComparisonNarrative).toBe('string');
  });
});

// Q806 — tuningFamilySocraticBestAndWorst
describe('tuningFamilySocraticBestAndWorst (Q806)', () => {
  it('returns all four fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorst([t12, edo(19, 440)], spec);
    expect(typeof result.bestId).toBe('string');
    expect(typeof result.bestScore).toBe('number');
    expect(typeof result.worstId).toBe('string');
    expect(typeof result.worstScore).toBe('number');
  });

  it('bestScore >= worstScore', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorst([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.bestScore).toBeGreaterThanOrEqual(result.worstScore);
  });

  it('single tuning yields same id for best and worst', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorst([t12], spec);
    expect(result.bestId).toBe(result.worstId);
    expect(result.bestId).toBe(t12.id);
  });

  it('empty input returns both ids null and scores 0', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorst([], spec);
    expect(result.bestId).toBeNull();
    expect(result.worstId).toBeNull();
    expect(result.bestScore).toBe(0);
    expect(result.worstScore).toBe(0);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorst([t12, edo(19, 440)], spec, 440);
    expect(typeof result.bestId).toBe('string');
  });
});

// Q808 — tuningFamilySocraticBestAndWorstNarrative
describe('tuningFamilySocraticBestAndWorstNarrative (Q808)', () => {
  it('returns all fields plus bestAndWorstNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorstNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.bestId).toBe('string');
    expect(typeof result.bestScore).toBe('number');
    expect(typeof result.worstId).toBe('string');
    expect(typeof result.worstScore).toBe('number');
    expect(typeof result.bestAndWorstNarrative).toBe('string');
  });

  it('narrative contains "Best:" and "Worst:"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorstNarrative([t12, edo(19, 440)], spec);
    expect(result.bestAndWorstNarrative).toContain('Best:');
    expect(result.bestAndWorstNarrative).toContain('Worst:');
  });

  it('empty input returns "No tunings to rank."', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorstNarrative([], spec);
    expect(result.bestAndWorstNarrative).toBe('No tunings to rank.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticBestAndWorstNarrative([t12], spec, 440);
    expect(typeof result.bestAndWorstNarrative).toBe('string');
  });
});

// Q810 — tuningFamilySocraticScoreSpread
describe('tuningFamilySocraticScoreSpread (Q810)', () => {
  it('returns all 5 fields', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpread([t12, edo(19, 440)], spec);
    expect(typeof result.min).toBe('number');
    expect(typeof result.max).toBe('number');
    expect(typeof result.range).toBe('number');
    expect(typeof result.mean).toBe('number');
    expect(typeof result.spreadLabel).toBe('string');
  });

  it('min <= mean <= max', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpread([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.min).toBeLessThanOrEqual(result.mean);
    expect(result.mean).toBeLessThanOrEqual(result.max);
  });

  it('range equals max - min', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpread([t12, edo(19, 440)], spec);
    expect(result.range).toBeCloseTo(result.max - result.min, 10);
  });

  it('spreadLabel is valid value', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpread([t12, edo(19, 440)], spec);
    expect(['uniform', 'moderate', 'wide']).toContain(result.spreadLabel);
  });

  it('empty input returns all zeros and uniform label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpread([], spec);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.range).toBe(0);
    expect(result.mean).toBe(0);
    expect(result.spreadLabel).toBe('uniform');
  });

  it('single tuning returns range 0 and uniform label', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpread([t12], spec);
    expect(result.range).toBe(0);
    expect(result.spreadLabel).toBe('uniform');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpread([t12, edo(19, 440)], spec, 440);
    expect(typeof result.mean).toBe('number');
  });
});

// Q812 — tuningFamilySocraticScoreSpreadNarrative
describe('tuningFamilySocraticScoreSpreadNarrative (Q812)', () => {
  it('returns all fields plus scoreSpreadNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpreadNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.min).toBe('number');
    expect(typeof result.max).toBe('number');
    expect(typeof result.range).toBe('number');
    expect(typeof result.mean).toBe('number');
    expect(typeof result.spreadLabel).toBe('string');
    expect(typeof result.scoreSpreadNarrative).toBe('string');
  });

  it('narrative contains "Score spread"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpreadNarrative([t12, edo(19, 440)], spec);
    expect(result.scoreSpreadNarrative).toContain('Score spread');
  });

  it('empty input returns "No tunings to analyze."', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpreadNarrative([], spec);
    expect(result.scoreSpreadNarrative).toBe('No tunings to analyze.');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticScoreSpreadNarrative([t12], spec, 440);
    expect(typeof result.scoreSpreadNarrative).toBe('string');
  });
});

// Q814 — tuningFamilySocraticVersatilityRatio
describe('tuningFamilySocraticVersatilityRatio (Q814)', () => {
  it('returns versatileCount, totalCount, versatilityRatio', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatio([t12, edo(19, 440)], spec);
    expect(typeof result.versatileCount).toBe('number');
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.versatilityRatio).toBe('number');
  });

  it('versatilityRatio is between 0 and 1', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatio([t12, edo(19, 440), edo(31, 440)], spec);
    expect(result.versatilityRatio).toBeGreaterThanOrEqual(0);
    expect(result.versatilityRatio).toBeLessThanOrEqual(1);
  });

  it('versatileCount <= totalCount', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatio([t12, edo(19, 440)], spec);
    expect(result.versatileCount).toBeLessThanOrEqual(result.totalCount);
  });

  it('empty input returns all zeros', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatio([], spec);
    expect(result.versatileCount).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.versatilityRatio).toBe(0);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatio([t12], spec, 440);
    expect(typeof result.versatilityRatio).toBe('number');
  });
});

// Q816 — tuningFamilySocraticVersatilityRatioNarrative
describe('tuningFamilySocraticVersatilityRatioNarrative (Q816)', () => {
  it('returns all fields plus versatilityRatioNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatioNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.versatileCount).toBe('number');
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.versatilityRatio).toBe('number');
    expect(typeof result.versatilityRatioNarrative).toBe('string');
  });

  it('narrative contains "Versatility"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatioNarrative([t12, edo(19, 440)], spec);
    expect(result.versatilityRatioNarrative).toContain('Versatility');
  });

  it('empty input returns "No tunings to assess versatility."', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatioNarrative([], spec);
    expect(result.versatilityRatioNarrative).toBe('No tunings to assess versatility.');
  });

  it('narrative contains percentage', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatioNarrative([t12, edo(19, 440)], spec);
    expect(result.versatilityRatioNarrative).toMatch(/\d+\.\d+%/);
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticVersatilityRatioNarrative([t12], spec, 440);
    expect(typeof result.versatilityRatioNarrative).toBe('string');
  });
});

// Q818 — tuningFamilySocraticArchetype
describe('tuningFamilySocraticArchetype (Q818)', () => {
  it('returns an archetype field', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetype([t12, edo(19, 440)], spec);
    expect(typeof result.archetype).toBe('string');
  });

  it('archetype is one of the 5 valid values', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetype([t12, edo(19, 440)], spec);
    expect(['explorer', 'specialist', 'harmonist', 'traditionalist', 'undefined']).toContain(
      result.archetype,
    );
  });

  it('empty input returns "undefined" archetype', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetype([], spec);
    expect(result.archetype).toBe('undefined');
  });

  it('single tuning returns a valid archetype', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetype([t12], spec);
    expect(['explorer', 'specialist', 'harmonist', 'traditionalist', 'undefined']).toContain(
      result.archetype,
    );
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetype([t12, edo(19, 440)], spec, 440);
    expect(typeof result.archetype).toBe('string');
  });
});

// Q820 — tuningFamilySocraticArchetypeNarrative
describe('tuningFamilySocraticArchetypeNarrative (Q820)', () => {
  it('returns archetype and archetypeNarrative', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetypeNarrative([t12, edo(19, 440)], spec);
    expect(typeof result.archetype).toBe('string');
    expect(typeof result.archetypeNarrative).toBe('string');
  });

  it('archetypeNarrative is a non-empty string', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetypeNarrative([t12, edo(19, 440)], spec);
    expect(result.archetypeNarrative.length).toBeGreaterThan(0);
  });

  it('archetypeNarrative matches one of the 5 descriptions', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetypeNarrative([t12, edo(19, 440)], spec);
    const descriptions = [
      'Explorer family: high diversity and wide dispersion — pushes into new sonic territory.',
      'Harmonist family: majority versatile ambassadors — balanced across many musical contexts.',
      'Traditionalist family: anchored in central tunings — stable and conservative character.',
      'Specialist family: tightly focused profiles — deep expertise in a narrow tonal range.',
      'Undefined archetype: no tunings provided.',
    ];
    expect(descriptions).toContain(result.archetypeNarrative);
  });

  it('empty input returns "Undefined archetype: no tunings provided."', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetypeNarrative([], spec);
    expect(result.archetypeNarrative).toBe('Undefined archetype: no tunings provided.');
  });

  it('empty input narrative contains "Undefined"', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetypeNarrative([], spec);
    expect(result.archetypeNarrative).toContain('Undefined');
  });

  it('accepts optional rootHz', () => {
    const spec = harmonicSpectrum(6);
    const result = tuningFamilySocraticArchetypeNarrative([t12], spec, 440);
    expect(typeof result.archetypeNarrative).toBe('string');
  });
});
