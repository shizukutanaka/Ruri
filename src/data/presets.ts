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
  tuningParetoFrontBestMode,
  tuningModeTopCorrelation,
  tuningModeAntiCorrelation,
  tuningParetoFrontSummary,
  tuningParetoFrontVsRanking,
  tuningBestParetoRankedMode,
  tuningParetoFrontGap,
  tuningParetoFrontCoverage,
  tuningCorrelationMatrixNarrative,
  tuningParetoFrontNarrative,
  tuningFullParetoCorrelationReport,
  tuningModeMetricOutliers,
  tuningModeMetricOutlierSummary,
  tuningModeMetricProfile,
  tuningModeMetricRadarData,
  tuningModeMetricCluster,
  tuningClusterSummary,
  tuningModeRadarRanking,
  tuningRadarRankingVsScoreRanking,
  tuningBestRadarScoreAgreement,
  tuningModeConsensusRanking,
  tuningBestConsensusMode,
  tuningUltimateBestMode,
  tuningConsensusNarrative,
  tuningMasterReport,
  tuningModeComprehensiveMetricBundle,
  tuningModeConsensusClusterBundle,
  tuningTopClusterConsensusMode,
  tuningModeConsensusOutlierBundle,
  tuningModeInsightSummary,
  tuningFinalRecommendation,
  tuningModeEntropyDiversityMap,
  tuningModeConsistencyVolatilityMap,
  tuningModeFiveDimMap,
  tuningModeFiveDimNarrative,
  tuningModeSmoothnessEntropyMap,
  tuningModeDiversityVolatilityMap,
  tuningModeAllQuadrantsBundle,
  tuningModeAllQuadrantsNarrative,
  tuningModeQuadrantConsensus,
  tuningBestQuadrantConsensusMode,
  tuningModeConsensusNarrative,
  tuningModeQuadrantProfile,
  tuningQuadrantCoverage,
  tuningModeGroupByProfile,
  tuningQuadrantCoverageNarrative,
  tuningDominantQuadrantProfile,
  tuningQuadrantProfileDiversity,
  tuningQuadrantProfileDiversityNarrative,
  tuningModeProfileTransitions,
  tuningProfileTransitionScore,
  tuningProfileTransitionScoreNarrative,
  tuningProfileRunSummary,
  tuningProfileRunSummaryNarrative,
  tuningProfileRunDensity,
  tuningProfileRunDensityNarrative,
  tuningProfileTextureReport,
  tuningProfileTextureReportNarrative,
  tuningModeRarestProfileGroup,
  tuningModeSoloProfileModes,
  tuningModeSoloProfileNarrative,
  tuningModeQuadrantIdentityBundle,
  tuningModeQuadrantIdentityNarrative,
  tuningModeAmbassador,
  tuningModeAmbassadorNarrative,
  tuningFamilyAmbassadorRanking,
  tuningFamilyBestAmbassador,
  tuningFamilyWeakestAmbassador,
  tuningFamilyAmbassadorScoreStats,
  tuningFamilyAmbassadorGap,
  tuningFamilyAmbassadorConsensusDistribution,
  tuningFamilyAmbassadorProfileFrequency,
  tuningFamilyLeastCommonAmbassadorProfile,
  tuningFamilyAmbassadorConsensusScore,
  tuningFamilyAmbassadorReport,
  tuningFamilyAmbassadorReportNarrative,
  tuningFamilyAmbassadorOverlapScore,
  tuningFamilyAmbassadorOverlapScoreNarrative,
  tuningFamilyAmbassadorConvergenceScore,
  tuningFamilyAmbassadorConvergenceScoreNarrative,
  tuningFamilyAmbassadorConsensusConvergenceScore,
  tuningFamilyAmbassadorConsensusConvergenceScoreNarrative,
  tuningFamilyAmbassadorConvergenceBundle,
  tuningFamilyAmbassadorConvergenceBundleNarrative,
  tuningFamilyAmbassadorMeanProfileDistance,
  tuningFamilyAmbassadorMeanProfileDistanceNarrative,
  tuningFamilyAmbassadorProfileDistanceStats,
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
  tuningFamilySocraticArchetypeComparison,
  tuningFamilySocraticMaturityScore,
  tuningFamilySocraticMaturityScoreNarrative,
  tuningFamilySocraticMaturityComparison,
  tuningFamilySocraticMaturityComparisonNarrative,
  tuningFamilySocraticFullReport,
  tuningFamilySocraticFullReportNarrative,
  tuningFamilySocraticRadarProfile,
  tuningFamilySocraticRadarProfileNarrative,
  tuningFamilySocraticRadarComparison,
  tuningFamilySocraticRadarComparisonNarrative,
  tuningFamilySocraticRadarDominantAxis,
  tuningFamilySocraticRadarWeakestAxis,
  tuningFamilySocraticRadarStrengthWeaknessReport,
  tuningFamilySocraticConvergencePortrait,
  tuningFamilySocraticRadarBalance,
  tuningFamilySocraticRadarBalanceNarrative,
  tuningFamilySocraticRadarGap,
  tuningFamilySocraticRadarGapNarrative,
  tuningFamilySocraticRadarBalanceGapSummary,
  tuningFamilySocraticRadarCentroid,
  tuningFamilySocraticRadarCentroidNarrative,
  tuningFamilySocraticRadarCentroidComparison,
  tuningFamilySocraticRadarAxisScoreRank,
  tuningFamilySocraticRadarAxisScoreRankNarrative,
  tuningFamilySocraticRadarProfileSnapshot,
  tuningFamilySocraticRadarProfileHealth,
  tuningFamilySocraticRadarProfileHealthNarrative,
  tuningFamilySocraticRadarProfileHealthComparison,
  tuningFamilySocraticRadarAxisDiversity,
  tuningFamilySocraticRadarAxisDiversityNarrative,
  tuningFamilySocraticRadarAxisDiversityComparison,
  tuningFamilySocraticRadarOverallScore,
  tuningFamilySocraticRadarOverallScoreNarrative,
  tuningFamilySocraticRadarOverallScoreComparison,
  tuningFamilySocraticRadarFullAnalysis,
  tuningFamilySocraticRadarFullAnalysisNarrative,
  tuningFamilySocraticRadarProfileTier,
  tuningFamilySocraticRadarProfileTierNarrative,
  tuningFamilySocraticRadarTierComparison,
  tuningFamilySocraticRadarMomentum,
  tuningFamilySocraticRadarMomentumNarrative,
  tuningFamilySocraticRadarMomentumComparison,
  tuningFamilySocraticRadarResilienceScore,
  tuningFamilySocraticRadarResilienceScoreNarrative,
  tuningFamilySocraticRadarOpportunityScore,
  tuningFamilySocraticRadarStrengthsWeaknesses,
  tuningFamilySocraticRadarBalanceScore,
  tuningFamilySocraticRadarOpportunityNarrative,
  tuningFamilySocraticRadarFullDiagnostic,
  tuningFamilySocraticRadarCrossProfile,
  tuningFamilySocraticRadarDimensionalRanking,
  tuningFamilySocraticRadarGrowthVector,
  tuningFamilySocraticRadarConsistencyScore,
  tuningFamilySocraticRadarProfileEntropy,
  tuningFamilySocraticRadarAxisInteractions,
  tuningFamilySocraticRadarPolarizationIndex,
  tuningFamilySocraticRadarSignatureDistance,
  tuningFamilySocraticRadarClusterability,
  tuningFamilySocraticRadarDominanceMap,
  tuningFamilySocraticRadarRegimeProbability,
  tuningFamilySocraticRadarContribution,
  tuningFamilySocraticRadarOutlierDetection,
  tuningFamilySocraticRadarTrend,
  tuningFamilySocraticRadarRobustnessScore,
  tuningFamilySocraticRadarCentroidProfile,
  tuningFamilySocraticRadarEvolutionScore,
  tuningFamilySocraticRadarSymmetryScore,
  tuningFamilySocraticRadarSaturationIndex,
  tuningFamilySocraticRadarVolatilityIndex,
  tuningFamilySocraticRadarCoherenceScore,
  tuningFamilySocraticRadarMomentumScore,
  tuningFamilySocraticRadarDiversityGap,
  tuningFamilySocraticRadarQuartileProfile,
  tuningFamilySocraticRadarIQRScore,
  tuningFamilySocraticRadarBimodalityScore,
  tuningFamilySocraticRadarDependenceMatrix,
  tuningFamilySocraticRadarHealthIndex,
  tuningFamilySocraticRadarAdaptabilityScore,
  tuningFamilySocraticRadarPurityScore,
  tuningFamilySocraticRadarExtremeProfile,
  tuningFamilySocraticRadarIntersectionProfile,
  tuningFamilySocraticRadarUnionProfile,
  tuningFamilySocraticRadarSpreadProfile,
  tuningFamilySocraticRadarOptimalityGap,
  tuningFamilySocraticRadarNeutralityScore,
  tuningFamilySocraticRadarTopPerformers,
  tuningFamilySocraticRadarWeakMembers,
  tuningFamilySocraticRadarStrengthMap,
  tuningFamilySocraticRadarSummaryReport,
  tuningFamilySocraticRadarMilestoneScore,
  tuningFamilySocraticRadarFocusIndex,
  tuningFamilySocraticRadarLeaderboardRank,
  tuningFamilySocraticRadarCapacityScore,
  tuningFamilySocraticRadarAnchorAxis,
  tuningFamilySocraticRadarConvexHullVolume,
  tuningFamilySocraticRadarAxialSymmetry,
  tuningFamilySocraticRadarPeakAxis,
  tuningFamilySocraticRadarValleyAxis,
  tuningFamilySocraticRadarResonanceScore,
  tuningFamilySocraticRadarFlexibilityScore,
  tuningFamilySocraticRadarSignificanceTest,
  tuningFamilySocraticRadarMaturityGap,
  tuningFamilySocraticRadarConvergenceScore,
  tuningFamilySocraticRadarBenchmarkGap,
  tuningFamilySocraticRadarDiversityLeadership,
  tuningFamilySocraticRadarVersatilityQuotient,
  tuningFamilySocraticRadarWeightedScore,
  tuningFamilySocraticRadarNormalizedProfile,
  tuningFamilySocraticRadarGeometricMean,
  tuningFamilySocraticRadarHarmonicMean,
  tuningFamilySocraticRadarTrimmedMean,
  tuningFamilySocraticRadarRobustMedian,
  tuningFamilySocraticRadarPercentileRank,
  tuningFamilySocraticRadarCumulativeScore,
  tuningFamilySocraticRadarRankingVector,
  tuningFamilySocraticRadarMinMaxNormalized,
  tuningFamilySocraticRadarAboveThresholdCount,
  tuningFamilySocraticRadarL1Norm,
  tuningFamilySocraticRadarL2Norm,
  tuningFamilySocraticRadarZScore,
  tuningFamilySocraticRadarRelativeStrength,
  tuningFamilySocraticRadarImbalanceIndex,
  tuningFamilySocraticRadarGradientVector,
  tuningFamilySocraticRadarCrossAxisCorrelation,
  tuningFamilySocraticRadarCompositeRank,
  tuningFamilySocraticRadarAxisMoment,
  tuningFamilySocraticRadarAxisPercentile,
  tuningFamilySocraticRadarPareto,
  tuningFamilySocraticRadarAxisCorrelationWith,
  tuningFamilySocraticRadarSignalToNoise,
  tuningFamilySocraticRadarExponentialMovingAverage,
  tuningFamilySocraticRadarKullbackLeiblerDivergence,
  tuningFamilySocraticRadarCentroidMean,
  tuningFamilySocraticRadarShannonEntropy,
  tuningFamilySocraticRadarHarmonicMeanPerAxis,
  tuningFamilySocraticRadarGiniCoefficient,
  tuningFamilySocraticRadarNormalizedL1Distance,
  tuningFamilySocraticRadarTopK,
  tuningFamilySocraticRadarBottomK,
  tuningFamilySocraticRadarDominantAxisPerTuning,
  tuningFamilySocraticRadarAxisQuartiles,
  tuningFamilySocraticRadarAnomalyScore,
  tuningFamilySocraticRadarRadialBalance,
  tuningFamilySocraticRadarWeightedAverage,
  tuningFamilySocraticRadarAxisRegression,
  tuningFamilySocraticRadarCovarianceMatrix,
  tuningFamilySocraticRadarKMeansCluster,
  tuningFamilySocraticRadarPrincipalAxis,
  tuningFamilySocraticRadarBootstrapCI,
  tuningFamilySocraticRadarNormalizeProfiles,
  tuningFamilySocraticRadarFuzzyMembership,
  tuningFamilySocraticRadarMultiObjectiveRank,
  tuningFamilySocraticRadarAdaptiveThreshold,
  tuningFamilySocraticRadarSensitivityAnalysis,
  tuningFamilySocraticRadarParallelCoordinates,
  tuningFamilySocraticRadarTimeDecayAverage,
  tuningFamilySocraticRadarRollingWindowStats,
  tuningFamilySocraticRadarEnsembleScore,
  tuningFamilySocraticRadarMonteCarloVariance,
  tuningFamilySocraticRadarDiversityIndex,
  tuningFamilySocraticRadarOptimalSubset,
  tuningFamilySocraticRadarSpearmanRank,
  tuningFamilySocraticRadarCumulativeDistribution,
  tuningFamilySocraticRadarRunningMean,
  tuningFamilySocraticRadarExponentialSmoothing,
  tuningFamilySocraticRadarOutlierReport,
  tuningFamilySocraticRadarDendrogramOrder,
  tuningFamilySocraticRadarStabilityScore,
  tuningFamilySocraticRadarTrendSlope,
  tuningFamilySocraticRadarVolatilityScore,
  tuningFamilySocraticRadarMomentumProfile,
  tuningFamilySocraticRadarFamilyConvergence,
  tuningFamilySocraticRadarRegimeDetection,
  tuningFamilySocraticRadarAutoCorrelation,
  tuningFamilySocraticRadarCrossCorrelation,
  tuningFamilySocraticRadarPhaseSpaceEmbedding,
  tuningFamilySocraticRadarWaveletEnergy,
  tuningFamilySocraticRadarFourierAmplitude,
  tuningFamilySocraticRadarRecurrenceRate,
  tuningFamilySocraticRadarMutualInformation,
  tuningFamilySocraticRadarApproximateEntropy,
  tuningFamilySocraticRadarFractalDimension,
  tuningFamilySocraticRadarSampleEntropy,
  tuningFamilySocraticRadarTransferEntropy,
  tuningFamilySocraticRadarLyapunovExponent,
  tuningFamilySocraticRadarHurstExponent,
  tuningFamilySocraticRadarPermutationEntropy,
  tuningFamilySocraticRadarLempelZivComplexity,
  tuningFamilySocraticRadarDetrendedFluctuation,
  tuningFamilySocraticRadarKolmogorovComplexity,
  tuningFamilySocraticRadarMultiScaleEntropy,
  tuningFamilySocraticRadarPairwiseDifference,
  tuningFamilySocraticRadarDecileProfile,
  tuningFamilySocraticRadarIQR,
  tuningFamilySocraticRadarModeProfile,
  tuningFamilySocraticRadarGeometricMeanV2,
  tuningFamilySocraticRadarTrimmedMeanV2,
  tuningFamilySocraticRadarHarmonicMeanV2,
  tuningFamilySocraticRadarWeightedMedian,
  tuningFamilySocraticRadarCoefficientOfVariation,
  tuningFamilySocraticRadarSkewness,
  tuningFamilySocraticRadarKurtosis,
  tuningFamilySocraticRadarZScoreMatrix,
  tuningFamilySocraticRadarRobustScale,
  tuningFamilySocraticRadarMinMaxNormalize,
  tuningFamilySocraticRadarEntropyWeightedComposite,
  tuningFamilySocraticRadarTOPSIS,
  tuningFamilySocraticRadarSAW,
  tuningFamilySocraticRadarVIKOR,
  tuningFamilySocraticRadarEWMA,
  tuningFamilySocraticRadarGiniCoefficientV2,
  tuningFamilySocraticRadarTheilIndex,
  tuningFamilySocraticRadarAtkinsonIndex,
  tuningFamilySocraticRadarHooverIndex,
  tuningFamilySocraticRadarParetoScore,
  tuningFamilySocraticRadarAdjacencyStrength,
  tuningFamilySocraticRadarClusteringCoefficient,
  tuningFamilySocraticRadarPageRankScore,
  tuningFamilySocraticRadarBetweennessProxy,
  tuningFamilySocraticRadarModularityScore,
  tuningFamilySocraticRadarNetworkDensity,
  tuningFamilySocraticRadarJensenShannonDivergence,
  tuningFamilySocraticRadarEarthMoverDistance,
  tuningFamilySocraticRadarTotalVariationDistance,
  tuningFamilySocraticRadarHellingerDistance,
  tuningFamilySocraticRadarBhattacharyyaCoefficient,
  tuningFamilySocraticRadarKLDivergenceAsymmetric,
  tuningFamilySocraticRadarSpectralRolloff,
  tuningFamilySocraticRadarDissonanceGradient,
  tuningFamilySocraticRadarCrossAxisCorrelationMatrix,
  tuningFamilySocraticRadarVarianceExplained,
  tuningFamilySocraticRadarSpectralBandwidth,
  tuningFamilySocraticRadarAutoCorrelationLag1,
  tuningFamilySocraticRadarKendallTau,
  tuningFamilySocraticRadarConcordancePairs,
  tuningFamilySocraticRadarMannWhitneyU,
  tuningFamilySocraticRadarBootstrapMeanCI,
  tuningFamilySocraticRadarJackknifeVariance,
  tuningFamilySocraticRadarWilcoxonSignedRank,
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

// ---------------------------------------------------------------------------
// Q433 — presetParetoFrontBestMode
// ---------------------------------------------------------------------------

/**
 * Pick the single best mode from the Pareto front for a preset in one call.
 *
 * Socratic Q433: "If I can find the best Pareto-front mode for a tuning, can I do it for a
 * preset by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningParetoFrontBestMode(tuning, spectrum, rootHz)` → best mode with score.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns The best Pareto-front mode with all five metrics and composite score.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const best = presetParetoFrontBestMode('12-tet', spec);
 * console.log(best.mode.id, best.score);
 */
export function presetParetoFrontBestMode(
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
    throw new RangeError('presetParetoFrontBestMode: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningParetoFrontBestMode(tuning, spectrum, rootHz)
    : tuningParetoFrontBestMode(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q436 — presetModeTopCorrelation
// ---------------------------------------------------------------------------

/**
 * Find the metric pair with the highest positive Pearson r for a preset in one call.
 *
 * Socratic Q436: "If I can find the top correlation pair for a tuning, can I do it for a preset
 * by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningModeTopCorrelation(tuning, spectrum, rootHz)` → top pair.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{metricA, metricB, correlation}` for the most positively correlated pair.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { metricA, metricB, correlation } = presetModeTopCorrelation('12-tet', spec);
 * console.log(metricA, metricB, correlation);
 */
export function presetModeTopCorrelation(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { metricA: string; metricB: string; correlation: number } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeTopCorrelation: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeTopCorrelation(tuning, spectrum, rootHz)
    : tuningModeTopCorrelation(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q437 — presetModeAntiCorrelation
// ---------------------------------------------------------------------------

/**
 * Find the metric pair with the strongest negative Pearson r for a preset in one call.
 *
 * Socratic Q437: "If I can find the anti-correlation pair for a tuning, can I do it for a preset
 * by id?" → No → implement.
 *
 * Algorithm:
 * 1. Find preset by id; throw `RangeError` if not found.
 * 2. Load tuning via `loadTuningPreset`.
 * 3. `tuningModeAntiCorrelation(tuning, spectrum, rootHz)` → anti-correlation pair.
 *
 * @param presetId - Id of the preset to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to `ALL_PRESETS`).
 * @returns `{metricA, metricB, correlation}` for the most negatively correlated pair.
 *
 * @throws {RangeError} if the preset id is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { metricA, metricB, correlation } = presetModeAntiCorrelation('12-tet', spec);
 * console.log(metricA, metricB, correlation);
 */
export function presetModeAntiCorrelation(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { metricA: string; metricB: string; correlation: number } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeAntiCorrelation: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeAntiCorrelation(tuning, spectrum, rootHz)
    : tuningModeAntiCorrelation(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q439 — presetFamilyTopCorrelations
// ---------------------------------------------------------------------------

/**
 * Find the top metric correlation for each preset in an array of preset ids.
 *
 * Socratic Q439: "If I can find family-level top correlations for tunings, can I do it for an
 * array of preset ids?" → No → implement.
 *
 * Algorithm: For each id, find preset (throw RangeError if missing), loadTuningPreset, call
 * `tuningModeTopCorrelation`.
 *
 * @param presetIds - Array of preset ids to analyse.
 * @param spectrum  - Instrument spectrum for timbre-aware analysis.
 * @param rootHz    - Root frequency in Hz (default 440).
 * @param presets   - Optional preset pool (defaults to ALL_PRESETS).
 * @returns One entry per preset id with its id and top metric correlation.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = presetFamilyTopCorrelations(['12-tet', 'just-5-limit'], spec);
 * results.forEach(({ id, topCorrelation }) => console.log(id, topCorrelation.correlation));
 */
export function presetFamilyTopCorrelations(
  presetIds: readonly string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { id: string; topCorrelation: { metricA: string; metricB: string; correlation: number } }[] {
  const pool = presets ?? ALL_PRESETS;
  return presetIds.map((id) => {
    const preset = pool.find((p) => p.id === id);
    if (preset === undefined) {
      throw new RangeError('presetFamilyTopCorrelations: preset not found: ' + id);
    }
    const tuning = loadTuningPreset(preset);
    return {
      id,
      topCorrelation:
        rootHz !== undefined
          ? tuningModeTopCorrelation(tuning, spectrum, rootHz)
          : tuningModeTopCorrelation(tuning, spectrum),
    };
  });
}

// ---------------------------------------------------------------------------
// Q443 — presetParetoFrontSummary
// ---------------------------------------------------------------------------

/**
 * Compute a statistical summary of the Pareto front for a preset by id.
 *
 * Socratic Q443: "If I can summarize the Pareto front for a tuning, can I do it for a preset by
 * id?" → No → implement.
 *
 * Algorithm: Find preset (throw RangeError if missing), loadTuningPreset, delegate to
 * `tuningParetoFrontSummary`.
 *
 * @param presetId - Preset id to analyse.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to ALL_PRESETS).
 * @returns Summary including `paretoSize` and per-metric `{mean, min, max}` objects.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const summary = presetParetoFrontSummary('12-tet', spec);
 * console.log(summary.paretoSize, summary.entropy.mean);
 */
export function presetParetoFrontSummary(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): {
  paretoSize: number;
  entropy: { mean: number; min: number; max: number };
  consistency: { mean: number; min: number; max: number };
  volatility: { mean: number; min: number; max: number };
  diversity: { mean: number; min: number; max: number };
  smoothnessRatio: { mean: number; min: number; max: number };
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetParetoFrontSummary: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningParetoFrontSummary(tuning, spectrum, rootHz)
    : tuningParetoFrontSummary(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q448 — presetParetoFrontVsRanking
// ---------------------------------------------------------------------------

/**
 * Annotate the score ranking with Pareto-front membership for a named preset.
 *
 * Socratic Q448: Preset wrapper for `tuningParetoFrontVsRanking`.
 *
 * @param presetId - The preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to ALL_PRESETS).
 * @returns The score ranking annotated with `inParetoFront: boolean`, in score-descending order.
 * @throws {RangeError} If the preset is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const results = presetParetoFrontVsRanking('12-tet', spec);
 * results.forEach(({ mode, score, inParetoFront }) => console.log(mode.id, inParetoFront));
 */
export function presetParetoFrontVsRanking(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { mode: Scale; score: number; inParetoFront: boolean }[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetParetoFrontVsRanking: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningParetoFrontVsRanking(tuning, spectrum, rootHz)
    : tuningParetoFrontVsRanking(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q449 — presetBestParetoRankedMode
// ---------------------------------------------------------------------------

/**
 * Pick the Pareto-optimal mode with the best (lowest) rank for a named preset.
 *
 * Socratic Q449: Preset wrapper for `tuningBestParetoRankedMode`.
 *
 * @param presetId - The preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to ALL_PRESETS).
 * @returns The Pareto mode with rank 1 (or lowest available rank).
 * @throws {RangeError} If the preset is not found or no Pareto modes exist.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const best = presetBestParetoRankedMode('12-tet', spec);
 * console.log(best.mode.id, best.rank);
 */
export function presetBestParetoRankedMode(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { mode: Scale; score: number; rank: number } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestParetoRankedMode: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningBestParetoRankedMode(tuning, spectrum, rootHz)
    : tuningBestParetoRankedMode(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q453 — presetParetoFrontGap
// ---------------------------------------------------------------------------

/**
 * Find the largest gap between consecutive Pareto-optimal ranks for a named preset.
 *
 * Socratic Q453: Preset wrapper for `tuningParetoFrontGap`.
 *
 * @param presetId - The preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to ALL_PRESETS).
 * @returns `{maxGap, gaps, paretoRanks}` describing gaps between consecutive Pareto ranks.
 * @throws {RangeError} If the preset is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { maxGap, paretoRanks } = presetParetoFrontGap('12-tet', spec);
 * console.log('largest gap between Pareto modes:', maxGap);
 */
export function presetParetoFrontGap(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { maxGap: number; gaps: number[]; paretoRanks: number[] } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetParetoFrontGap: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningParetoFrontGap(tuning, spectrum, rootHz)
    : tuningParetoFrontGap(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q454 — presetParetoFrontCoverage
// ---------------------------------------------------------------------------

/**
 * Compute what fraction of the top-K modes are Pareto-optimal for a named preset.
 *
 * Socratic Q454: Preset wrapper for `tuningParetoFrontCoverage`.
 *
 * @param presetId - The preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Optional preset pool (defaults to ALL_PRESETS).
 * @returns `{paretoSize, totalModes, topRank, coverageInTopK}`
 * @throws {RangeError} If the preset is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const { paretoSize, coverageInTopK } = presetParetoFrontCoverage('12-tet', spec);
 * console.log('Pareto coverage in top-K:', coverageInTopK);
 */
export function presetParetoFrontCoverage(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): { paretoSize: number; totalModes: number; topRank: number; coverageInTopK: number } {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetParetoFrontCoverage: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningParetoFrontCoverage(tuning, spectrum, rootHz)
    : tuningParetoFrontCoverage(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q457 — presetCorrelationMatrixNarrative
// ---------------------------------------------------------------------------

/**
 * Produce a correlation matrix narrative for a curated tuning preset.
 *
 * Delegates to `tuningCorrelationMatrixNarrative` after resolving the preset.
 *
 * @param presetId - Identifier of the preset (e.g. '12-tet').
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Override preset pool (default ALL_PRESETS).
 * @returns `{narrative, topCorrelation, antiCorrelation, strongPairCount}`.
 * @throws {RangeError} if the preset is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const result = presetCorrelationMatrixNarrative('12-tet', spec);
 * console.log(result.narrative);
 */
export function presetCorrelationMatrixNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): {
  narrative: string;
  topCorrelation: { metricA: string; metricB: string; correlation: number };
  antiCorrelation: { metricA: string; metricB: string; correlation: number };
  strongPairCount: number;
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetCorrelationMatrixNarrative: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningCorrelationMatrixNarrative(tuning, spectrum, rootHz)
    : tuningCorrelationMatrixNarrative(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q460 — presetParetoFrontNarrative
// ---------------------------------------------------------------------------

/**
 * Produce a Pareto front narrative for a curated tuning preset.
 *
 * Delegates to `tuningParetoFrontNarrative` after resolving the preset.
 *
 * @param presetId - Identifier of the preset (e.g. '12-tet').
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Root frequency in Hz (default 440).
 * @param presets  - Override preset pool (default ALL_PRESETS).
 * @returns `{narrative, paretoSize, bestMode, coverage}`.
 * @throws {RangeError} if the preset is not found.
 *
 * @example
 * const spec = harmonicSpectrum(6);
 * const result = presetParetoFrontNarrative('12-tet', spec);
 * console.log(result.narrative);
 */
export function presetParetoFrontNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: readonly TuningPreset[],
): {
  narrative: string;
  paretoSize: number;
  bestMode: { mode: Scale; score: number };
  coverage: {
    paretoSize: number;
    totalModes: number;
    topRank: number;
    coverageInTopK: number;
  };
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetParetoFrontNarrative: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningParetoFrontNarrative(tuning, spectrum, rootHz)
    : tuningParetoFrontNarrative(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q463 — presetFullParetoCorrelationReport
// ---------------------------------------------------------------------------

/**
 * Generate a full Pareto+correlation report for a named preset.
 *
 * Delegates to `tuningFullParetoCorrelationReport` after resolving and loading the preset.
 * Throws `RangeError` if the preset is not found.
 *
 * @param presetId - The preset id to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Full Pareto+correlation report with combinedNarrative.
 */
export function presetFullParetoCorrelationReport(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): {
  paretoNarrative: {
    narrative: string;
    paretoSize: number;
    bestMode: { mode: Scale; score: number };
    coverage: {
      paretoSize: number;
      totalModes: number;
      topRank: number;
      coverageInTopK: number;
    };
  };
  correlationNarrative: {
    narrative: string;
    topCorrelation: { metricA: string; metricB: string; correlation: number };
    antiCorrelation: { metricA: string; metricB: string; correlation: number };
    strongPairCount: number;
  };
  combinedNarrative: string;
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetFullParetoCorrelationReport: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningFullParetoCorrelationReport(tuning, spectrum, rootHz)
    : tuningFullParetoCorrelationReport(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q466 — presetModeMetricOutliers
// ---------------------------------------------------------------------------

/**
 * Find metric outlier modes for a named preset.
 *
 * Delegates to `tuningModeMetricOutliers` after resolving and loading the preset.
 * Throws `RangeError` if the preset is not found.
 *
 * @param presetId - The preset id to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of outlier mode entries sorted by |zScore| descending (may be empty).
 */
export function presetModeMetricOutliers(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): { mode: Scale; metric: string; value: number; mean: number; stdDev: number; zScore: number }[] {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeMetricOutliers: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeMetricOutliers(tuning, spectrum, rootHz)
    : tuningModeMetricOutliers(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q469 — presetModeMetricOutlierSummary
// ---------------------------------------------------------------------------

/**
 * Summarise metric outliers for a named preset.
 *
 * Delegates to `tuningModeMetricOutlierSummary` after resolving and loading the preset.
 * Throws `RangeError` if the preset is not found.
 *
 * @param presetId - The preset id to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Summary object with total, byMetric, byMode, mostOutlierMetric, mostOutlierMode.
 */
export function presetModeMetricOutlierSummary(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): {
  totalOutliers: number;
  byMetric: Record<string, number>;
  byMode: Record<string, number>;
  mostOutlierMetric: string | null;
  mostOutlierMode: string | null;
} {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeMetricOutlierSummary: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeMetricOutlierSummary(tuning, spectrum, rootHz)
    : tuningModeMetricOutlierSummary(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q472 — presetModeMetricProfile
// ---------------------------------------------------------------------------

/**
 * Produce a per-mode metric profile for a named preset.
 *
 * Delegates to `tuningModeMetricProfile` after resolving and loading the preset.
 * Throws `RangeError` if the preset is not found.
 *
 * @param presetId - The preset id to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of per-mode profiles with full metric statistics.
 */
export function presetModeMetricProfile(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeMetricProfile> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeMetricProfile: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeMetricProfile(tuning, spectrum, rootHz)
    : tuningModeMetricProfile(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q475 — presetModeMetricRadarData
// ---------------------------------------------------------------------------

/**
 * Produce normalised radar-chart data for a named preset.
 *
 * Delegates to `tuningModeMetricRadarData` after resolving and loading the preset.
 * Throws `RangeError` if the preset is not found.
 *
 * @param presetId - The preset id to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of per-mode normalised radar values in [0,1].
 */
export function presetModeMetricRadarData(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeMetricRadarData> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeMetricRadarData: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeMetricRadarData(tuning, spectrum, rootHz)
    : tuningModeMetricRadarData(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q478 — presetModeMetricCluster
// ---------------------------------------------------------------------------

/**
 * Cluster modes into High/Mid/Low buckets for a named preset.
 *
 * Delegates to `tuningModeMetricCluster` after resolving and loading the preset.
 * Throws `RangeError` if the preset is not found.
 *
 * @param presetId - The preset id to look up.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of per-mode cluster entries with meanScore and cluster label.
 */
export function presetModeMetricCluster(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeMetricCluster> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeMetricCluster: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeMetricCluster(tuning, spectrum, rootHz)
    : tuningModeMetricCluster(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q481 — presetClusterSummary
// ---------------------------------------------------------------------------

/**
 * Summarise cluster counts and list modes in each bucket for a named preset.
 *
 * @param presetId - The preset identifier.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Cluster summary with highCount, midCount, lowCount, high, mid, low arrays.
 */
export function presetClusterSummary(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningClusterSummary> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetClusterSummary: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningClusterSummary(tuning, spectrum, rootHz)
    : tuningClusterSummary(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q484 — presetModeRadarRanking
// ---------------------------------------------------------------------------

/**
 * Rank modes by mean radar score for a named preset.
 *
 * @param presetId - The preset identifier.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of {mode, meanScore, rank} sorted descending by meanScore.
 */
export function presetModeRadarRanking(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeRadarRanking> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeRadarRanking: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeRadarRanking(tuning, spectrum, rootHz)
    : tuningModeRadarRanking(tuning, spectrum);
}

// ---------------------------------------------------------------------------

/**
 * Compare radar ranking vs composite-score ranking for a preset.
 *
 * @param presetId - The preset identifier.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of {mode, radarRank, scoreRank, rankDelta} ordered by radar rank.
 */
export function presetRadarRankingVsScoreRanking(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningRadarRankingVsScoreRanking> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetRadarRankingVsScoreRanking: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningRadarRankingVsScoreRanking(tuning, spectrum, rootHz)
    : tuningRadarRankingVsScoreRanking(tuning, spectrum);
}

// ---------------------------------------------------------------------------

/**
 * Find the mode where radar rank and score rank agree most for a preset.
 *
 * @param presetId - The preset identifier.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns The entry with the smallest absolute rankDelta (first on tie).
 */
export function presetBestRadarScoreAgreement(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningBestRadarScoreAgreement> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestRadarScoreAgreement: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningBestRadarScoreAgreement(tuning, spectrum, rootHz)
    : tuningBestRadarScoreAgreement(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q493 — presetModeConsensusRanking
// ---------------------------------------------------------------------------

/**
 * Produce a Borda-count consensus ranking for a preset's modes.
 *
 * @param presetId - The preset identifier.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array sorted by bordaScore descending with 1-based consensusRank.
 */
export function presetModeConsensusRanking(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeConsensusRanking> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeConsensusRanking: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeConsensusRanking(tuning, spectrum, rootHz)
    : tuningModeConsensusRanking(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q496 — presetBestConsensusMode
// ---------------------------------------------------------------------------

/**
 * Return the top Borda-consensus mode for a preset.
 *
 * @param presetId - The preset identifier.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns The entry with consensusRank === 1.
 */
export function presetBestConsensusMode(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningBestConsensusMode> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetBestConsensusMode: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningBestConsensusMode(tuning, spectrum, rootHz)
    : tuningBestConsensusMode(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q499 — presetUltimateBestMode
// ---------------------------------------------------------------------------

/**
 * Find the ultimate best mode for a preset by delegating to
 * {@link tuningUltimateBestMode}.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns The ultimate best mode result.
 */
export function presetUltimateBestMode(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningUltimateBestMode> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetUltimateBestMode: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningUltimateBestMode(tuning, spectrum, rootHz)
    : tuningUltimateBestMode(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q502 — presetConsensusNarrative
// ---------------------------------------------------------------------------

/**
 * Produce a consensus narrative for a preset by delegating to
 * {@link tuningConsensusNarrative}.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Narrative string plus the two underlying sub-results.
 */
export function presetConsensusNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningConsensusNarrative> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetConsensusNarrative: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningConsensusNarrative(tuning, spectrum, rootHz)
    : tuningConsensusNarrative(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q505 — presetMasterReport
// ---------------------------------------------------------------------------

/**
 * Produce a master report for a preset by delegating to
 * {@link tuningMasterReport}.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Combined master report with paretoCorrelationReport, consensusNarrative,
 *          and masterNarrative.
 */
export function presetMasterReport(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningMasterReport> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetMasterReport: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningMasterReport(tuning, spectrum, rootHz)
    : tuningMasterReport(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q508 — presetModeComprehensiveMetricBundle
// ---------------------------------------------------------------------------

/**
 * Produce a comprehensive metric bundle for all modes of a preset by
 * delegating to {@link tuningModeComprehensiveMetricBundle}.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of per-mode entries with raw metrics and detailed metric profiles.
 */
export function presetModeComprehensiveMetricBundle(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeComprehensiveMetricBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeComprehensiveMetricBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeComprehensiveMetricBundle(tuning, spectrum, rootHz)
    : tuningModeComprehensiveMetricBundle(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q511 — presetModeConsensusClusterBundle
// ---------------------------------------------------------------------------

/**
 * Join the Borda consensus ranking with the High/Mid/Low cluster label for
 * each mode of a preset, delegating to {@link tuningModeConsensusClusterBundle}.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array sorted by consensusRank (ascending) with cluster and Borda fields.
 */
export function presetModeConsensusClusterBundle(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeConsensusClusterBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeConsensusClusterBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeConsensusClusterBundle(tuning, spectrum, rootHz)
    : tuningModeConsensusClusterBundle(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q514 — presetTopClusterConsensusMode
// ---------------------------------------------------------------------------

/**
 * Find the top-ranked mode in the 'high' cluster for a preset, delegating to
 * {@link tuningTopClusterConsensusMode}.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns The entry with the best consensusRank among 'high' cluster modes,
 *          or the top consensus mode if none qualify.
 */
export function presetTopClusterConsensusMode(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningTopClusterConsensusMode> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetTopClusterConsensusMode: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningTopClusterConsensusMode(tuning, spectrum, rootHz)
    : tuningTopClusterConsensusMode(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q517 — presetModeConsensusOutlierBundle
// ---------------------------------------------------------------------------

/**
 * Join consensus ranking and metric outlier data for a preset's modes.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns Array of per-mode consensus+outlier bundles.
 */
export function presetModeConsensusOutlierBundle(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeConsensusOutlierBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeConsensusOutlierBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeConsensusOutlierBundle(tuning, spectrum, rootHz)
    : tuningModeConsensusOutlierBundle(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q520 — presetModeInsightSummary
// ---------------------------------------------------------------------------

/**
 * Produce a compact per-mode insight string for a preset.
 *
 * @param presetId - Preset identifier string.
 * @param spectrum - Instrument spectrum for timbre-aware analysis.
 * @param rootHz   - Optional root frequency in Hz.
 * @param presets  - Optional override preset pool (defaults to ALL_PRESETS).
 * @returns One entry per mode with mode, consensusRank, cluster,
 *          outlierMetrics, and a human-readable insight string.
 */
export function presetModeInsightSummary(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeInsightSummary> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeInsightSummary: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeInsightSummary(tuning, spectrum, rootHz)
    : tuningModeInsightSummary(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q523 — presetFinalRecommendation
// ---------------------------------------------------------------------------

export function presetFinalRecommendation(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningFinalRecommendation> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetFinalRecommendation: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningFinalRecommendation(tuning, spectrum, rootHz)
    : tuningFinalRecommendation(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q526 — presetModeEntropyDiversityMap
// ---------------------------------------------------------------------------

export function presetModeEntropyDiversityMap(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeEntropyDiversityMap> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeEntropyDiversityMap: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeEntropyDiversityMap(tuning, spectrum, rootHz)
    : tuningModeEntropyDiversityMap(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q529 — presetModeConsistencyVolatilityMap
// ---------------------------------------------------------------------------

export function presetModeConsistencyVolatilityMap(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeConsistencyVolatilityMap> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeConsistencyVolatilityMap: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeConsistencyVolatilityMap(tuning, spectrum, rootHz)
    : tuningModeConsistencyVolatilityMap(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q532 — presetModeFiveDimMap
// ---------------------------------------------------------------------------

export function presetModeFiveDimMap(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeFiveDimMap> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeFiveDimMap: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeFiveDimMap(tuning, spectrum, rootHz)
    : tuningModeFiveDimMap(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q535 — presetModeFiveDimNarrative
// ---------------------------------------------------------------------------

export function presetModeFiveDimNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeFiveDimNarrative> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeFiveDimNarrative: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeFiveDimNarrative(tuning, spectrum, rootHz)
    : tuningModeFiveDimNarrative(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q538 — presetModeSmoothnessEntropyMap
// ---------------------------------------------------------------------------

export function presetModeSmoothnessEntropyMap(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeSmoothnessEntropyMap> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeSmoothnessEntropyMap: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeSmoothnessEntropyMap(tuning, spectrum, rootHz)
    : tuningModeSmoothnessEntropyMap(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q541 — presetModeDiversityVolatilityMap
// ---------------------------------------------------------------------------

export function presetModeDiversityVolatilityMap(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeDiversityVolatilityMap> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeDiversityVolatilityMap: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeDiversityVolatilityMap(tuning, spectrum, rootHz)
    : tuningModeDiversityVolatilityMap(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q544 — presetModeAllQuadrantsBundle
// ---------------------------------------------------------------------------

export function presetModeAllQuadrantsBundle(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets?: TuningPreset[],
): ReturnType<typeof tuningModeAllQuadrantsBundle> {
  const pool = presets ?? ALL_PRESETS;
  const preset = pool.find((p) => p.id === presetId);
  if (preset === undefined) {
    throw new RangeError('presetModeAllQuadrantsBundle: preset not found: ' + presetId);
  }
  const tuning = loadTuningPreset(preset);
  return rootHz !== undefined
    ? tuningModeAllQuadrantsBundle(tuning, spectrum, rootHz)
    : tuningModeAllQuadrantsBundle(tuning, spectrum);
}

// ---------------------------------------------------------------------------
// Q547 — presetModeAllQuadrantsNarrative
// ---------------------------------------------------------------------------

export function presetModeAllQuadrantsNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeAllQuadrantsNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeAllQuadrantsNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q550 — presetModeQuadrantConsensus
// ---------------------------------------------------------------------------

export function presetModeQuadrantConsensus(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeQuadrantConsensus> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeQuadrantConsensus(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q553 — presetBestQuadrantConsensusMode
// ---------------------------------------------------------------------------

export function presetBestQuadrantConsensusMode(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningBestQuadrantConsensusMode> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningBestQuadrantConsensusMode(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q556 — presetModeConsensusNarrative
// ---------------------------------------------------------------------------

export function presetModeConsensusNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeConsensusNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeConsensusNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q559 — presetModeQuadrantProfile
// ---------------------------------------------------------------------------

export function presetModeQuadrantProfile(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeQuadrantProfile> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeQuadrantProfile(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q562 — presetQuadrantCoverage
// ---------------------------------------------------------------------------

export function presetQuadrantCoverage(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningQuadrantCoverage> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningQuadrantCoverage(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q565 — presetModeGroupByProfile
// ---------------------------------------------------------------------------

export function presetModeGroupByProfile(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeGroupByProfile> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeGroupByProfile(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q568 — presetQuadrantCoverageNarrative
// ---------------------------------------------------------------------------

export function presetQuadrantCoverageNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningQuadrantCoverageNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningQuadrantCoverageNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q571 — presetDominantQuadrantProfile
// ---------------------------------------------------------------------------

export function presetDominantQuadrantProfile(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningDominantQuadrantProfile> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningDominantQuadrantProfile(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q574 — presetQuadrantProfileDiversity
// ---------------------------------------------------------------------------

export function presetQuadrantProfileDiversity(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningQuadrantProfileDiversity> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningQuadrantProfileDiversity(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q577 — presetQuadrantProfileDiversityNarrative
// ---------------------------------------------------------------------------

export function presetQuadrantProfileDiversityNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningQuadrantProfileDiversityNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningQuadrantProfileDiversityNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q589 — presetModeProfileTransitions
// ---------------------------------------------------------------------------

export function presetModeProfileTransitions(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeProfileTransitions> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeProfileTransitions(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q591 — presetProfileTransitionScore
// ---------------------------------------------------------------------------

export function presetProfileTransitionScore(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileTransitionScore> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileTransitionScore(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q595 — presetProfileTransitionScoreNarrative
// ---------------------------------------------------------------------------

export function presetProfileTransitionScoreNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileTransitionScoreNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileTransitionScoreNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q603 — presetProfileRunSummary
// ---------------------------------------------------------------------------

export function presetProfileRunSummary(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileRunSummary> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileRunSummary(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q607 — presetProfileRunSummaryNarrative
// ---------------------------------------------------------------------------

export function presetProfileRunSummaryNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileRunSummaryNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileRunSummaryNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q610 — presetProfileRunDensity
// ---------------------------------------------------------------------------

export function presetProfileRunDensity(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileRunDensity> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileRunDensity(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q616 — presetProfileRunDensityNarrative
// ---------------------------------------------------------------------------

export function presetProfileRunDensityNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileRunDensityNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileRunDensityNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q619 — presetProfileTextureReport
// ---------------------------------------------------------------------------

export function presetProfileTextureReport(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileTextureReport> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileTextureReport(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q622 — presetProfileTextureReportNarrative
// ---------------------------------------------------------------------------

export function presetProfileTextureReportNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningProfileTextureReportNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningProfileTextureReportNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q625 — presetModeRarestProfileGroup
// ---------------------------------------------------------------------------

export function presetModeRarestProfileGroup(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeRarestProfileGroup> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeRarestProfileGroup(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q627 — presetModeSoloProfileModes
// ---------------------------------------------------------------------------

export function presetModeSoloProfileModes(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeSoloProfileModes> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeSoloProfileModes(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q634 — presetModeSoloProfileNarrative
// ---------------------------------------------------------------------------

export function presetModeSoloProfileNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeSoloProfileNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeSoloProfileNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q637 — presetModeQuadrantIdentityBundle
// ---------------------------------------------------------------------------

export function presetModeQuadrantIdentityBundle(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeQuadrantIdentityBundle> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeQuadrantIdentityBundle(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q640 — presetModeQuadrantIdentityNarrative
// ---------------------------------------------------------------------------

export function presetModeQuadrantIdentityNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeQuadrantIdentityNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeQuadrantIdentityNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q643 — presetModeAmbassador
// ---------------------------------------------------------------------------

export function presetModeAmbassador(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeAmbassador> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeAmbassador(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q646 — presetModeAmbassadorNarrative
// ---------------------------------------------------------------------------

export function presetModeAmbassadorNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningModeAmbassadorNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningModeAmbassadorNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q649 — presetFamilyAmbassadorRanking
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorRanking(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorRanking> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorRanking(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q653 — presetFamilyBestAmbassador
// ---------------------------------------------------------------------------

export function presetFamilyBestAmbassador(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyBestAmbassador> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyBestAmbassador(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q655 — presetFamilyAmbassadorScoreStats
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorScoreStats(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorScoreStats> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorScoreStats(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q658 — presetFamilyWeakestAmbassador
// ---------------------------------------------------------------------------

export function presetFamilyWeakestAmbassador(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyWeakestAmbassador> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyWeakestAmbassador(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q659 — presetFamilyAmbassadorGap
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorGap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorGap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorGap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q661 — presetFamilyAmbassadorConsensusDistribution
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConsensusDistribution(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConsensusDistribution> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConsensusDistribution(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q664 — presetFamilyAmbassadorProfileFrequency
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorProfileFrequency(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorProfileFrequency> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorProfileFrequency(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q667 — presetFamilyLeastCommonAmbassadorProfile
// ---------------------------------------------------------------------------

export function presetFamilyLeastCommonAmbassadorProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyLeastCommonAmbassadorProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyLeastCommonAmbassadorProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q670 — presetFamilyAmbassadorConsensusScore
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConsensusScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConsensusScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConsensusScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q673 — presetFamilyAmbassadorReport
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorReport(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorReport> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorReport(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q675 — presetFamilyAmbassadorReportNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorReportNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorReportNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorReportNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q677 — presetFamilyAmbassadorOverlapScore
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorOverlapScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorOverlapScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorOverlapScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q679 — presetFamilyAmbassadorOverlapScoreNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorOverlapScoreNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorOverlapScoreNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorOverlapScoreNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q683 — presetFamilyAmbassadorConvergenceScore
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConvergenceScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConvergenceScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConvergenceScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q687 — presetFamilyAmbassadorConvergenceScoreNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConvergenceScoreNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConvergenceScoreNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConvergenceScoreNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q689 — presetFamilyAmbassadorConsensusConvergenceScore
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConsensusConvergenceScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConsensusConvergenceScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConsensusConvergenceScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q691 — presetFamilyAmbassadorConsensusConvergenceScoreNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConsensusConvergenceScoreNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConsensusConvergenceScoreNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConsensusConvergenceScoreNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q693 — presetFamilyAmbassadorConvergenceBundle
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConvergenceBundle(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConvergenceBundle> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConvergenceBundle(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q695 — presetFamilyAmbassadorConvergenceBundleNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorConvergenceBundleNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorConvergenceBundleNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorConvergenceBundleNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q699 — presetFamilyAmbassadorMeanProfileDistance
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorMeanProfileDistance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorMeanProfileDistance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorMeanProfileDistance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q701 — presetFamilyAmbassadorMeanProfileDistanceNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorMeanProfileDistanceNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorMeanProfileDistanceNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorMeanProfileDistanceNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q703 — presetFamilyAmbassadorProfileDistanceStats
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorProfileDistanceStats(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorProfileDistanceStats> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorProfileDistanceStats(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q707 — presetFamilyAmbassadorCentrality
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorCentrality(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorCentrality> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorCentrality(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q709 — presetFamilyAmbassadorOutlier
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorOutlier(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorOutlier> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorOutlier(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q711 — presetFamilyAmbassadorCentralityNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorCentralityNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorCentralityNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorCentralityNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q713 — presetFamilyAmbassadorDistanceSpread
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorDistanceSpread(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorDistanceSpread> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorDistanceSpread(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q715 — presetFamilyAmbassadorDistanceSpreadNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorDistanceSpreadNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorDistanceSpreadNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorDistanceSpreadNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q717 — presetFamilyFullAmbassadorAnalytics
// ---------------------------------------------------------------------------

export function presetFamilyFullAmbassadorAnalytics(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyFullAmbassadorAnalytics> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyFullAmbassadorAnalytics(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q719 — presetFamilyFullAmbassadorAnalyticsNarrative
// ---------------------------------------------------------------------------

export function presetFamilyFullAmbassadorAnalyticsNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyFullAmbassadorAnalyticsNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyFullAmbassadorAnalyticsNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q721 — presetFamilyAmbassadorsSummaryTable
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorsSummaryTable(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorsSummaryTable> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorsSummaryTable(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q723 — presetFamilyAmbassadorsSummaryNarrative
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorsSummaryNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorsSummaryNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorsSummaryNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q725 — presetFamilyAmbassadorTopN
// ---------------------------------------------------------------------------

export function presetFamilyAmbassadorTopN(
  presetIds: string[],
  spectrum: Spectrum,
  n: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilyAmbassadorTopN> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilyAmbassadorTopN(tunings, spectrum, n, rootHz);
}

// ---------------------------------------------------------------------------
// Q727 — presetSocraticProfile
// ---------------------------------------------------------------------------

export function presetSocraticProfile(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningSocraticProfile> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningSocraticProfile(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q729 — presetSocraticProfileNarrative
// ---------------------------------------------------------------------------

export function presetSocraticProfileNarrative(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningSocraticProfileNarrative> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningSocraticProfileNarrative(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q731 — presetFamilySocraticProfiles
// ---------------------------------------------------------------------------

export function presetFamilySocraticProfiles(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticProfiles> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticProfiles(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q733 — presetFamilySocraticProfileNarratives
// ---------------------------------------------------------------------------

export function presetFamilySocraticProfileNarratives(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticProfileNarratives> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticProfileNarratives(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q735 — presetFamilySocraticComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticComparison(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticComparison> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticComparison(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q737 — presetFamilySocraticComparisonNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticComparisonNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticComparisonNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticComparisonNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q739 — presetFamilySocraticInsight
// ---------------------------------------------------------------------------

export function presetFamilySocraticInsight(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticInsight> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticInsight(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q741 — presetFamilySocraticInsightNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticInsightNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticInsightNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticInsightNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q743 — presetSocraticContrast
// ---------------------------------------------------------------------------

export function presetSocraticContrast(
  presetIdA: string,
  presetIdB: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningSocraticContrast> {
  const presetA = presets.find((p) => p.id === presetIdA);
  if (!presetA) throw new RangeError(`Unknown preset: ${presetIdA}`);
  const presetB = presets.find((p) => p.id === presetIdB);
  if (!presetB) throw new RangeError(`Unknown preset: ${presetIdB}`);
  return tuningSocraticContrast(
    loadTuningPreset(presetA),
    loadTuningPreset(presetB),
    spectrum,
    rootHz,
  );
}

// ---------------------------------------------------------------------------
// Q745 — presetSocraticContrastNarrative
// ---------------------------------------------------------------------------

export function presetSocraticContrastNarrative(
  presetIdA: string,
  presetIdB: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningSocraticContrastNarrative> {
  const presetA = presets.find((p) => p.id === presetIdA);
  if (!presetA) throw new RangeError(`Unknown preset: ${presetIdA}`);
  const presetB = presets.find((p) => p.id === presetIdB);
  if (!presetB) throw new RangeError(`Unknown preset: ${presetIdB}`);
  return tuningSocraticContrastNarrative(
    loadTuningPreset(presetA),
    loadTuningPreset(presetB),
    spectrum,
    rootHz,
  );
}

// ---------------------------------------------------------------------------
// Q747 — presetFamilySocraticRecommendation
// ---------------------------------------------------------------------------

export function presetFamilySocraticRecommendation(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRecommendation> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRecommendation(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q749 — presetFamilySocraticRecommendationNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRecommendationNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRecommendationNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRecommendationNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q751 — presetFamilySocraticPairwiseContrasts
// ---------------------------------------------------------------------------

export function presetFamilySocraticPairwiseContrasts(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticPairwiseContrasts> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticPairwiseContrasts(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q753 — presetFamilySocraticPairwiseContrastStats
// ---------------------------------------------------------------------------

export function presetFamilySocraticPairwiseContrastStats(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticPairwiseContrastStats> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticPairwiseContrastStats(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q755 — presetFamilySocraticPairwiseContrastStatsNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticPairwiseContrastStatsNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticPairwiseContrastStatsNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticPairwiseContrastStatsNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q757 — presetFamilySocraticDiversityIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticDiversityIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticDiversityIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticDiversityIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q759 — presetFamilySocraticDiversityIndexNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticDiversityIndexNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticDiversityIndexNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticDiversityIndexNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q761 — presetFamilySocraticEvolutionRanking
// ---------------------------------------------------------------------------

export function presetFamilySocraticEvolutionRanking(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticEvolutionRanking> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticEvolutionRanking(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q763 — presetFamilySocraticEvolutionRankingNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticEvolutionRankingNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticEvolutionRankingNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticEvolutionRankingNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q765 — presetFamilySocraticClusterMap
// ---------------------------------------------------------------------------

export function presetFamilySocraticClusterMap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticClusterMap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticClusterMap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q767 — presetFamilySocraticClusterMapNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticClusterMapNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticClusterMapNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticClusterMapNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q769 — presetFamilySocraticTopologyScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticTopologyScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticTopologyScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticTopologyScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q771 — presetFamilySocraticTopologyScoreNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticTopologyScoreNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticTopologyScoreNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticTopologyScoreNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q773 — presetFamilySocraticSummaryBundle
// ---------------------------------------------------------------------------

export function presetFamilySocraticSummaryBundle(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticSummaryBundle> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticSummaryBundle(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q775 — presetFamilySocraticSummaryBundleNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticSummaryBundleNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticSummaryBundleNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticSummaryBundleNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q777 — presetSocraticCharacterPortrait
// ---------------------------------------------------------------------------

export function presetSocraticCharacterPortrait(
  presetId: string,
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningSocraticCharacterPortrait> {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
  return tuningSocraticCharacterPortrait(loadTuningPreset(preset), spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q779 — presetFamilySocraticCharacterPortraits
// ---------------------------------------------------------------------------

export function presetFamilySocraticCharacterPortraits(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticCharacterPortraits> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticCharacterPortraits(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q781 — presetFamilySocraticFamilyPortrait
// ---------------------------------------------------------------------------

export function presetFamilySocraticFamilyPortrait(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticFamilyPortrait> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticFamilyPortrait(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q783 — presetFamilySocraticInsightDigest
// ---------------------------------------------------------------------------

export function presetFamilySocraticInsightDigest(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticInsightDigest> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticInsightDigest(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q785 — presetFamilySocraticInsightDigestNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticInsightDigestNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticInsightDigestNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticInsightDigestNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q787 — presetFamilySocraticAxisAnalysis
// ---------------------------------------------------------------------------

export function presetFamilySocraticAxisAnalysis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticAxisAnalysis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticAxisAnalysis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q789 — presetFamilySocraticAxisNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticAxisNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticAxisNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticAxisNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q791 — presetFamilySocraticSignature
// ---------------------------------------------------------------------------

export function presetFamilySocraticSignature(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticSignature> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticSignature(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q793 — presetFamilySocraticBenchmark
// ---------------------------------------------------------------------------

export function presetFamilySocraticBenchmark(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticBenchmark> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticBenchmark(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q795 — presetFamilySocraticBenchmarkNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticBenchmarkNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticBenchmarkNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticBenchmarkNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q797 — presetFamilySocraticSignatureComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticSignatureComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticSignatureComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticSignatureComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q799 — presetFamilySocraticSignatureComparisonNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticSignatureComparisonNarrative(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticSignatureComparisonNarrative> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticSignatureComparisonNarrative(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q801 — presetFamilySocraticConsensusNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticConsensusNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticConsensusNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticConsensusNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q803 — presetFamilySocraticBenchmarkComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticBenchmarkComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticBenchmarkComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticBenchmarkComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q805 — presetFamilySocraticBenchmarkComparisonNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticBenchmarkComparisonNarrative(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticBenchmarkComparisonNarrative> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticBenchmarkComparisonNarrative(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q807 — presetFamilySocraticBestAndWorst
// ---------------------------------------------------------------------------

export function presetFamilySocraticBestAndWorst(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticBestAndWorst> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticBestAndWorst(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q809 — presetFamilySocraticBestAndWorstNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticBestAndWorstNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticBestAndWorstNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticBestAndWorstNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q811 — presetFamilySocraticScoreSpread
// ---------------------------------------------------------------------------

export function presetFamilySocraticScoreSpread(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticScoreSpread> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticScoreSpread(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q813 — presetFamilySocraticScoreSpreadNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticScoreSpreadNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticScoreSpreadNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticScoreSpreadNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q815 — presetFamilySocraticVersatilityRatio
// ---------------------------------------------------------------------------

export function presetFamilySocraticVersatilityRatio(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticVersatilityRatio> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticVersatilityRatio(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q817 — presetFamilySocraticVersatilityRatioNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticVersatilityRatioNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticVersatilityRatioNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticVersatilityRatioNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q819 — presetFamilySocraticArchetype
// ---------------------------------------------------------------------------

export function presetFamilySocraticArchetype(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticArchetype> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticArchetype(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q821 — presetFamilySocraticArchetypeNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticArchetypeNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticArchetypeNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticArchetypeNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q823 — presetFamilySocraticArchetypeComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticArchetypeComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticArchetypeComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticArchetypeComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q825 — presetFamilySocraticMaturityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticMaturityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticMaturityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticMaturityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q827 — presetFamilySocraticMaturityScoreNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticMaturityScoreNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticMaturityScoreNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticMaturityScoreNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q829 — presetFamilySocraticMaturityComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticMaturityComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticMaturityComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticMaturityComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q831 — presetFamilySocraticMaturityComparisonNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticMaturityComparisonNarrative(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticMaturityComparisonNarrative> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticMaturityComparisonNarrative(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q833 — presetFamilySocraticFullReport
// ---------------------------------------------------------------------------

export function presetFamilySocraticFullReport(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticFullReport> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticFullReport(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q835 — presetFamilySocraticFullReportNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticFullReportNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticFullReportNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticFullReportNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q837 — presetFamilySocraticRadarProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q839 — presetFamilySocraticRadarProfileNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q841 — presetFamilySocraticRadarComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q843 — presetFamilySocraticRadarComparisonNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarComparisonNarrative(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarComparisonNarrative> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarComparisonNarrative(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q845 — presetFamilySocraticRadarDominantAxis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDominantAxis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDominantAxis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDominantAxis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q847 — presetFamilySocraticRadarWeakestAxis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarWeakestAxis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarWeakestAxis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarWeakestAxis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q849 — presetFamilySocraticRadarStrengthWeaknessReport
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarStrengthWeaknessReport(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarStrengthWeaknessReport> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarStrengthWeaknessReport(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q851 — presetFamilySocraticConvergencePortrait
// ---------------------------------------------------------------------------

export function presetFamilySocraticConvergencePortrait(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticConvergencePortrait> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticConvergencePortrait(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q853 — presetFamilySocraticRadarBalance
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBalance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBalance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBalance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q855 — presetFamilySocraticRadarBalanceNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBalanceNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBalanceNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBalanceNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q857 — presetFamilySocraticRadarGap
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q859 — presetFamilySocraticRadarGapNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGapNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGapNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGapNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q861 — presetFamilySocraticRadarBalanceGapSummary
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBalanceGapSummary(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBalanceGapSummary> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBalanceGapSummary(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q863 — presetFamilySocraticRadarCentroid
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCentroid(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCentroid> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCentroid(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q865 — presetFamilySocraticRadarCentroidNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCentroidNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCentroidNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCentroidNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q867 — presetFamilySocraticRadarCentroidComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCentroidComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCentroidComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCentroidComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q869 — presetFamilySocraticRadarAxisScoreRank
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisScoreRank(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisScoreRank> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisScoreRank(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q871 — presetFamilySocraticRadarAxisScoreRankNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisScoreRankNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisScoreRankNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisScoreRankNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q873 — presetFamilySocraticRadarProfileSnapshot
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileSnapshot(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileSnapshot> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileSnapshot(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q875 — presetFamilySocraticRadarProfileHealth
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileHealth(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileHealth> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileHealth(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q877 — presetFamilySocraticRadarProfileHealthNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileHealthNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileHealthNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileHealthNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q879 — presetFamilySocraticRadarProfileHealthComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileHealthComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileHealthComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileHealthComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q881 — presetFamilySocraticRadarAxisDiversity
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisDiversity(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisDiversity> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisDiversity(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q883 — presetFamilySocraticRadarAxisDiversityNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisDiversityNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisDiversityNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisDiversityNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q885 — presetFamilySocraticRadarAxisDiversityComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisDiversityComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisDiversityComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisDiversityComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q887 — presetFamilySocraticRadarOverallScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOverallScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOverallScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOverallScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q889 — presetFamilySocraticRadarOverallScoreNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOverallScoreNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOverallScoreNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOverallScoreNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q891 — presetFamilySocraticRadarOverallScoreComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOverallScoreComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOverallScoreComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOverallScoreComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q893 — presetFamilySocraticRadarFullAnalysis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFullAnalysis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFullAnalysis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFullAnalysis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q895 — presetFamilySocraticRadarFullAnalysisNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFullAnalysisNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFullAnalysisNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFullAnalysisNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q897 — presetFamilySocraticRadarProfileTier
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileTier(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileTier> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileTier(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q899 — presetFamilySocraticRadarProfileTierNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileTierNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileTierNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileTierNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q901 — presetFamilySocraticRadarTierComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTierComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTierComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTierComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q903 — presetFamilySocraticRadarMomentum
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMomentum(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMomentum> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMomentum(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q905 — presetFamilySocraticRadarMomentumNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMomentumNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMomentumNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMomentumNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q907 — presetFamilySocraticRadarMomentumComparison
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMomentumComparison(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMomentumComparison> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMomentumComparison(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q909 — presetFamilySocraticRadarResilienceScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarResilienceScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarResilienceScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarResilienceScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q911 — presetFamilySocraticRadarResilienceScoreNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarResilienceScoreNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarResilienceScoreNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarResilienceScoreNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q913 — presetFamilySocraticRadarOpportunityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOpportunityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOpportunityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOpportunityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q915 — presetFamilySocraticRadarStrengthsWeaknesses
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarStrengthsWeaknesses(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarStrengthsWeaknesses> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarStrengthsWeaknesses(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q917 — presetFamilySocraticRadarBalanceScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBalanceScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBalanceScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBalanceScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q919 — presetFamilySocraticRadarOpportunityNarrative
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOpportunityNarrative(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOpportunityNarrative> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOpportunityNarrative(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q921 — presetFamilySocraticRadarFullDiagnostic
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFullDiagnostic(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFullDiagnostic> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFullDiagnostic(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q923 — presetFamilySocraticRadarCrossProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCrossProfile(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCrossProfile> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCrossProfile(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q925 — presetFamilySocraticRadarDimensionalRanking
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDimensionalRanking(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDimensionalRanking> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDimensionalRanking(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q927 — presetFamilySocraticRadarGrowthVector
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGrowthVector(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGrowthVector> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGrowthVector(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q929 — presetFamilySocraticRadarConsistencyScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarConsistencyScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarConsistencyScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarConsistencyScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q931 — presetFamilySocraticRadarProfileEntropy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarProfileEntropy(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarProfileEntropy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarProfileEntropy(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q933 — presetFamilySocraticRadarAxisInteractions
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisInteractions(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisInteractions> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisInteractions(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q935 — presetFamilySocraticRadarPolarizationIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPolarizationIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPolarizationIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPolarizationIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q937 — presetFamilySocraticRadarSignatureDistance
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSignatureDistance(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSignatureDistance> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSignatureDistance(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q939 — presetFamilySocraticRadarClusterability
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarClusterability(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarClusterability> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarClusterability(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q941 — presetFamilySocraticRadarDominanceMap
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDominanceMap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDominanceMap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDominanceMap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q943 — presetFamilySocraticRadarRegimeProbability
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRegimeProbability(
  presetIds: string[],
  regime: Parameters<typeof tuningFamilySocraticRadarRegimeProbability>[1],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRegimeProbability> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRegimeProbability(tunings, regime, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q945 — presetFamilySocraticRadarContribution
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarContribution(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarContribution> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarContribution(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q947 — presetFamilySocraticRadarOutlierDetection
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOutlierDetection(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  threshold = 1.5,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOutlierDetection> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOutlierDetection(tunings, spectrum, rootHz, threshold);
}

// ---------------------------------------------------------------------------
// Q949 — presetFamilySocraticRadarTrend
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTrend(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTrend> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTrend(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q951 — presetFamilySocraticRadarRobustnessScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRobustnessScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRobustnessScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRobustnessScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q953 — presetFamilySocraticRadarCentroidProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCentroidProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCentroidProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCentroidProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q955 — presetFamilySocraticRadarEvolutionScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarEvolutionScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarEvolutionScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarEvolutionScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q957 — presetFamilySocraticRadarSymmetryScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSymmetryScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSymmetryScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSymmetryScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q959 — presetFamilySocraticRadarSaturationIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSaturationIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSaturationIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSaturationIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q961 — presetFamilySocraticRadarVolatilityIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarVolatilityIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarVolatilityIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarVolatilityIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q963 — presetFamilySocraticRadarCoherenceScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCoherenceScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCoherenceScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCoherenceScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q965 — presetFamilySocraticRadarMomentumScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMomentumScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMomentumScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMomentumScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q967 — presetFamilySocraticRadarDiversityGap
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDiversityGap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDiversityGap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDiversityGap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q969 — presetFamilySocraticRadarQuartileProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarQuartileProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarQuartileProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarQuartileProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q971 — presetFamilySocraticRadarIQRScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarIQRScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarIQRScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarIQRScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q973 — presetFamilySocraticRadarBimodalityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBimodalityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBimodalityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBimodalityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q975 — presetFamilySocraticRadarDependenceMatrix
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDependenceMatrix(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDependenceMatrix> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDependenceMatrix(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q977 — presetFamilySocraticRadarHealthIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarHealthIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarHealthIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarHealthIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q979 — presetFamilySocraticRadarAdaptabilityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAdaptabilityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAdaptabilityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAdaptabilityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q981 — presetFamilySocraticRadarPurityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPurityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPurityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPurityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q983 — presetFamilySocraticRadarExtremeProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarExtremeProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarExtremeProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarExtremeProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q985 — presetFamilySocraticRadarIntersectionProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarIntersectionProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarIntersectionProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarIntersectionProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q987 — presetFamilySocraticRadarUnionProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarUnionProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarUnionProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarUnionProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q989 — presetFamilySocraticRadarSpreadProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSpreadProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSpreadProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSpreadProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q991 — presetFamilySocraticRadarOptimalityGap
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOptimalityGap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOptimalityGap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOptimalityGap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q993 — presetFamilySocraticRadarNeutralityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarNeutralityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarNeutralityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarNeutralityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q995 — presetFamilySocraticRadarTopPerformers
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTopPerformers(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTopPerformers> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTopPerformers(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q997 — presetFamilySocraticRadarWeakMembers
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarWeakMembers(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarWeakMembers> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarWeakMembers(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q999 — presetFamilySocraticRadarStrengthMap
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarStrengthMap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarStrengthMap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarStrengthMap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1001 — presetFamilySocraticRadarSummaryReport
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSummaryReport(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSummaryReport> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSummaryReport(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1003 — presetFamilySocraticRadarMilestoneScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMilestoneScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMilestoneScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMilestoneScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1005 — presetFamilySocraticRadarFocusIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFocusIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFocusIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFocusIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1007 — presetFamilySocraticRadarLeaderboardRank
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarLeaderboardRank(
  presetIds: string[],
  spectrum: Spectrum,
  benchmark: Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', number>,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarLeaderboardRank> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarLeaderboardRank(tunings, spectrum, benchmark, rootHz);
}

// ---------------------------------------------------------------------------
// Q1009 — presetFamilySocraticRadarCapacityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCapacityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCapacityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCapacityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1011 — presetFamilySocraticRadarAnchorAxis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAnchorAxis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAnchorAxis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAnchorAxis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1013 — presetFamilySocraticRadarConvexHullVolume
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarConvexHullVolume(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarConvexHullVolume> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarConvexHullVolume(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1015 — presetFamilySocraticRadarAxialSymmetry
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxialSymmetry(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxialSymmetry> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxialSymmetry(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1017 — presetFamilySocraticRadarPeakAxis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPeakAxis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPeakAxis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPeakAxis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1019 — presetFamilySocraticRadarValleyAxis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarValleyAxis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarValleyAxis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarValleyAxis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1021 — presetFamilySocraticRadarResonanceScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarResonanceScore(
  presetIds: string[],
  spectrum: Spectrum,
  target: Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', number>,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarResonanceScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarResonanceScore(tunings, spectrum, target, rootHz);
}

// ---------------------------------------------------------------------------
// Q1023 — presetFamilySocraticRadarFlexibilityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFlexibilityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFlexibilityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFlexibilityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1025 — presetFamilySocraticRadarSignificanceTest
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSignificanceTest(
  presetIdsA: string[],
  presetIdsB: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSignificanceTest> {
  const tuningsA = presetIdsA.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  const tuningsB = presetIdsB.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSignificanceTest(tuningsA, tuningsB, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1027 — presetFamilySocraticRadarMaturityGap
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMaturityGap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMaturityGap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMaturityGap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1029 — presetFamilySocraticRadarConvergenceScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarConvergenceScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarConvergenceScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarConvergenceScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1031 — presetFamilySocraticRadarBenchmarkGap
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBenchmarkGap(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBenchmarkGap> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBenchmarkGap(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1033 — presetFamilySocraticRadarDiversityLeadership
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDiversityLeadership(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDiversityLeadership> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDiversityLeadership(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1035 — presetFamilySocraticRadarVersatilityQuotient
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarVersatilityQuotient(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarVersatilityQuotient> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarVersatilityQuotient(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1037 — presetFamilySocraticRadarWeightedScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarWeightedScore(
  presetIds: string[],
  spectrum: Spectrum,
  weights: Partial<Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', number>>,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarWeightedScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarWeightedScore(tunings, spectrum, weights, rootHz);
}

// ---------------------------------------------------------------------------
// Q1039 — presetFamilySocraticRadarNormalizedProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarNormalizedProfile(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarNormalizedProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarNormalizedProfile(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1041 — presetFamilySocraticRadarGeometricMean
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGeometricMean(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGeometricMean> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGeometricMean(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1043 — presetFamilySocraticRadarHarmonicMean
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarHarmonicMean(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarHarmonicMean> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarHarmonicMean(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1045 — presetFamilySocraticRadarTrimmedMean
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTrimmedMean(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTrimmedMean> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTrimmedMean(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1047 — presetFamilySocraticRadarRobustMedian
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRobustMedian(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRobustMedian> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRobustMedian(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1049 — presetFamilySocraticRadarPercentileRank
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPercentileRank(
  presetIds: string[],
  spectrum: Spectrum,
  queryProfile: Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', number>,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPercentileRank> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPercentileRank(tunings, spectrum, queryProfile, rootHz);
}

// ---------------------------------------------------------------------------
// Q1051 — presetFamilySocraticRadarCumulativeScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCumulativeScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCumulativeScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCumulativeScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1053 — presetFamilySocraticRadarRankingVector
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRankingVector(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRankingVector> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRankingVector(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1055 — presetFamilySocraticRadarMinMaxNormalized
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMinMaxNormalized(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMinMaxNormalized> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMinMaxNormalized(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1057 — presetFamilySocraticRadarAboveThresholdCount
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAboveThresholdCount(
  presetIds: string[],
  spectrum: Spectrum,
  threshold: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAboveThresholdCount> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAboveThresholdCount(tunings, spectrum, threshold, rootHz);
}

// ---------------------------------------------------------------------------
// Q1059 — presetFamilySocraticRadarL1Norm
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarL1Norm(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarL1Norm> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarL1Norm(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1061 — presetFamilySocraticRadarL2Norm
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarL2Norm(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarL2Norm> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarL2Norm(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1063 — presetFamilySocraticRadarZScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarZScore(
  presetIds: string[],
  spectrum: Spectrum,
  populationMean: number,
  populationStd: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarZScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarZScore(tunings, spectrum, populationMean, populationStd, rootHz);
}

// ---------------------------------------------------------------------------
// Q1065 — presetFamilySocraticRadarRelativeStrength
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRelativeStrength(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRelativeStrength> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRelativeStrength(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1067 — presetFamilySocraticRadarImbalanceIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarImbalanceIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarImbalanceIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarImbalanceIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1069 — presetFamilySocraticRadarGradientVector
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGradientVector(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGradientVector> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGradientVector(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1071 — presetFamilySocraticRadarCrossAxisCorrelation
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCrossAxisCorrelation(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCrossAxisCorrelation> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCrossAxisCorrelation(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1073 — presetFamilySocraticRadarCompositeRank
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCompositeRank(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCompositeRank> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCompositeRank(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1075 — presetFamilySocraticRadarAxisMoment
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisMoment(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisMoment> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisMoment(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1077 — presetFamilySocraticRadarAxisPercentile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisPercentile(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  queryValue: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisPercentile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisPercentile(tunings, spectrum, axis, queryValue, rootHz);
}

// ---------------------------------------------------------------------------
// Q1079 — presetFamilySocraticRadarPareto
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPareto(
  presetIds: string[],
  spectrum: Spectrum,
  candidates: Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', number>[],
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPareto> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPareto(tunings, spectrum, candidates, rootHz);
}

// ---------------------------------------------------------------------------
// Q1081 — presetFamilySocraticRadarAxisCorrelationWith
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisCorrelationWith(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisCorrelationWith> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisCorrelationWith(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1083 — presetFamilySocraticRadarSignalToNoise
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSignalToNoise(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSignalToNoise> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSignalToNoise(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1085 — presetFamilySocraticRadarExponentialMovingAverage
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarExponentialMovingAverage(
  presetIds: string[],
  spectrum: Spectrum,
  alpha: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarExponentialMovingAverage> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarExponentialMovingAverage(tunings, spectrum, alpha, rootHz);
}


// ---------------------------------------------------------------------------
// Q1087 — presetFamilySocraticRadarKullbackLeiblerDivergence
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarKullbackLeiblerDivergence(
  presetIds: string[],
  spectrum: Spectrum,
  epsilon = 1e-10,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarKullbackLeiblerDivergence> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarKullbackLeiblerDivergence(tunings, spectrum, epsilon, rootHz);
}

// ---------------------------------------------------------------------------
// Q1089 — presetFamilySocraticRadarCentroidMean
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCentroidMean(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCentroidMean> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCentroidMean(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1091 — presetFamilySocraticRadarShannonEntropy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarShannonEntropy(
  presetIds: string[],
  spectrum: Spectrum,
  bins = 5,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarShannonEntropy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarShannonEntropy(tunings, spectrum, bins, rootHz);
}

// ---------------------------------------------------------------------------
// Q1093 — presetFamilySocraticRadarHarmonicMeanPerAxis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarHarmonicMeanPerAxis(
  presetIds: string[],
  spectrum: Spectrum,
  epsilon = 1e-10,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarHarmonicMeanPerAxis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarHarmonicMeanPerAxis(tunings, spectrum, epsilon, rootHz);
}

// ---------------------------------------------------------------------------
// Q1095 — presetFamilySocraticRadarGiniCoefficient
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGiniCoefficient(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGiniCoefficient> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGiniCoefficient(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1097 — presetFamilySocraticRadarNormalizedL1Distance
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarNormalizedL1Distance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarNormalizedL1Distance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarNormalizedL1Distance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1099 — presetFamilySocraticRadarTopK
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTopK(
  presetIds: string[],
  spectrum: Spectrum,
  k: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTopK> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTopK(tunings, spectrum, k, rootHz);
}

// ---------------------------------------------------------------------------
// Q1101 — presetFamilySocraticRadarBottomK
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBottomK(
  presetIds: string[],
  spectrum: Spectrum,
  k: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBottomK> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBottomK(tunings, spectrum, k, rootHz);
}

// ---------------------------------------------------------------------------
// Q1103 — presetFamilySocraticRadarDominantAxisPerTuning
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDominantAxisPerTuning(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDominantAxisPerTuning> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDominantAxisPerTuning(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1105 — presetFamilySocraticRadarAxisQuartiles
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisQuartiles(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisQuartiles> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisQuartiles(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1107 — presetFamilySocraticRadarAnomalyScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAnomalyScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAnomalyScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAnomalyScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1109 — presetFamilySocraticRadarRadialBalance
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRadialBalance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRadialBalance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRadialBalance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1111 — presetFamilySocraticRadarWeightedAverage
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarWeightedAverage(
  presetIds: string[],
  spectrum: Spectrum,
  weights: number[],
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarWeightedAverage> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarWeightedAverage(tunings, spectrum, weights, rootHz);
}

// ---------------------------------------------------------------------------
// Q1113 — presetFamilySocraticRadarAxisRegression
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAxisRegression(
  presetIds: string[],
  spectrum: Spectrum,
  xAxisKey: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  yAxisKey: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAxisRegression> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAxisRegression(tunings, spectrum, xAxisKey, yAxisKey, rootHz);
}

// ---------------------------------------------------------------------------
// Q1115 — presetFamilySocraticRadarCovarianceMatrix
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCovarianceMatrix(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCovarianceMatrix> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCovarianceMatrix(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1117 — presetFamilySocraticRadarKMeansCluster
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarKMeansCluster(
  presetIds: string[],
  spectrum: Spectrum,
  k = 2,
  maxIter = 20,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarKMeansCluster> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarKMeansCluster(tunings, spectrum, k, maxIter, rootHz);
}

// ---------------------------------------------------------------------------
// Q1119 — presetFamilySocraticRadarPrincipalAxis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPrincipalAxis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPrincipalAxis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPrincipalAxis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1121 — presetFamilySocraticRadarBootstrapCI
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBootstrapCI(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  samples = 200,
  confidenceLevel = 0.95,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBootstrapCI> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBootstrapCI(tunings, spectrum, axis, samples, confidenceLevel, rootHz);
}

// ---------------------------------------------------------------------------
// Q1123 — presetFamilySocraticRadarNormalizeProfiles
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarNormalizeProfiles(
  presetIds: string[],
  spectrum: Spectrum,
  method: 'minmax' | 'zscore' = 'minmax',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarNormalizeProfiles> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarNormalizeProfiles(tunings, spectrum, method, rootHz);
}

// ---------------------------------------------------------------------------
// Q1125 — presetFamilySocraticRadarFuzzyMembership
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFuzzyMembership(
  presetIds: string[],
  spectrum: Spectrum,
  threshold: number = 0.5,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFuzzyMembership> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFuzzyMembership(tunings, spectrum, threshold, rootHz);
}

// ---------------------------------------------------------------------------
// Q1127 — presetFamilySocraticRadarMultiObjectiveRank
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMultiObjectiveRank(
  presetIds: string[],
  spectrum: Spectrum,
  objectives: Partial<Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', 'maximize' | 'minimize'>>,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMultiObjectiveRank> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMultiObjectiveRank(tunings, spectrum, objectives, rootHz);
}

// ---------------------------------------------------------------------------
// Q1129 — presetFamilySocraticRadarAdaptiveThreshold
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAdaptiveThreshold(
  presetIds: string[],
  spectrum: Spectrum,
  multiplier: number = 1.0,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAdaptiveThreshold> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAdaptiveThreshold(tunings, spectrum, multiplier, rootHz);
}

// ---------------------------------------------------------------------------
// Q1131 — presetFamilySocraticRadarSensitivityAnalysis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSensitivityAnalysis(
  presetIds: string[],
  spectrum: Spectrum,
  perturbationHz: number = 1.0,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSensitivityAnalysis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSensitivityAnalysis(tunings, spectrum, perturbationHz, rootHz);
}

// ---------------------------------------------------------------------------
// Q1133 — presetFamilySocraticRadarParallelCoordinates
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarParallelCoordinates(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarParallelCoordinates> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarParallelCoordinates(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1135 — presetFamilySocraticRadarTimeDecayAverage
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTimeDecayAverage(
  presetIds: string[],
  spectrum: Spectrum,
  decayFactor: number = 0.9,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTimeDecayAverage> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTimeDecayAverage(tunings, spectrum, decayFactor, rootHz);
}

// ---------------------------------------------------------------------------
// Q1137 — presetFamilySocraticRadarRollingWindowStats
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRollingWindowStats(
  presetIds: string[],
  spectrum: Spectrum,
  windowSize: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRollingWindowStats> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRollingWindowStats(tunings, spectrum, windowSize, rootHz);
}

// ---------------------------------------------------------------------------
// Q1139 — presetFamilySocraticRadarEnsembleScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarEnsembleScore(
  presetIds: string[],
  spectrum: Spectrum,
  weights?: Partial<Record<'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence', number>>,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarEnsembleScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarEnsembleScore(tunings, spectrum, weights, rootHz);
}

// ---------------------------------------------------------------------------
// Q1141 — presetFamilySocraticRadarMonteCarloVariance
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMonteCarloVariance(
  presetIds: string[],
  spectrum: Spectrum,
  trials: number = 100,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMonteCarloVariance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMonteCarloVariance(tunings, spectrum, trials, rootHz);
}

// ---------------------------------------------------------------------------
// Q1143 — presetFamilySocraticRadarDiversityIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDiversityIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDiversityIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDiversityIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1145 — presetFamilySocraticRadarOptimalSubset
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOptimalSubset(
  presetIds: string[],
  spectrum: Spectrum,
  size: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOptimalSubset> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOptimalSubset(tunings, spectrum, size, rootHz);
}

// ---------------------------------------------------------------------------
// Q1147 — presetFamilySocraticRadarSpearmanRank
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSpearmanRank(
  presetIds: string[],
  spectrum: Spectrum,
  axis1: Parameters<typeof tuningFamilySocraticRadarSpearmanRank>[2],
  axis2: Parameters<typeof tuningFamilySocraticRadarSpearmanRank>[3],
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSpearmanRank> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSpearmanRank(tunings, spectrum, axis1, axis2, rootHz);
}

// ---------------------------------------------------------------------------
// Q1149 — presetFamilySocraticRadarCumulativeDistribution
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCumulativeDistribution(
  presetIds: string[],
  spectrum: Spectrum,
  axis: Parameters<typeof tuningFamilySocraticRadarCumulativeDistribution>[2],
  points?: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCumulativeDistribution> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCumulativeDistribution(tunings, spectrum, axis, points, rootHz);
}

// ---------------------------------------------------------------------------
// Q1151 — presetFamilySocraticRadarRunningMean
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRunningMean(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRunningMean> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRunningMean(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1153 — presetFamilySocraticRadarExponentialSmoothing
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarExponentialSmoothing(
  presetIds: string[],
  spectrum: Spectrum,
  alpha?: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarExponentialSmoothing> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarExponentialSmoothing(tunings, spectrum, alpha, rootHz);
}

// ---------------------------------------------------------------------------
// Q1155 — presetFamilySocraticRadarOutlierReport
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarOutlierReport(
  presetIds: string[],
  spectrum: Spectrum,
  threshold?: number,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarOutlierReport> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarOutlierReport(tunings, spectrum, threshold, rootHz);
}

// ---------------------------------------------------------------------------
// Q1157 — presetFamilySocraticRadarDendrogramOrder
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDendrogramOrder(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDendrogramOrder> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDendrogramOrder(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1159 — presetFamilySocraticRadarStabilityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarStabilityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarStabilityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarStabilityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1161 — presetFamilySocraticRadarTrendSlope
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTrendSlope(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTrendSlope> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTrendSlope(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1163 — presetFamilySocraticRadarVolatilityScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarVolatilityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarVolatilityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarVolatilityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1165 — presetFamilySocraticRadarMomentumProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMomentumProfile(
  presetIds: string[],
  spectrum: Spectrum,
  window: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMomentumProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMomentumProfile(tunings, spectrum, window, rootHz);
}

// ---------------------------------------------------------------------------
// Q1167 — presetFamilySocraticRadarFamilyConvergence
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFamilyConvergence(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFamilyConvergence> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFamilyConvergence(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1169 — presetFamilySocraticRadarRegimeDetection
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRegimeDetection(
  presetIds: string[],
  spectrum: Spectrum,
  threshold: number = 0.1,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRegimeDetection> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRegimeDetection(tunings, spectrum, threshold, rootHz);
}

// ---------------------------------------------------------------------------
// Q1171 — presetFamilySocraticRadarAutoCorrelation
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAutoCorrelation(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  lag: number = 1,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAutoCorrelation> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAutoCorrelation(tunings, spectrum, axis, lag, rootHz);
}

// ---------------------------------------------------------------------------
// Q1173 — presetFamilySocraticRadarCrossCorrelation
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCrossCorrelation(
  presetIds: string[],
  spectrum: Spectrum,
  axis1: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  axis2: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  lag: number = 0,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCrossCorrelation> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCrossCorrelation(tunings, spectrum, axis1, axis2, lag, rootHz);
}

// ---------------------------------------------------------------------------
// Q1175 — presetFamilySocraticRadarPhaseSpaceEmbedding
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPhaseSpaceEmbedding(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  embeddingDim: number = 2,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPhaseSpaceEmbedding> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPhaseSpaceEmbedding(tunings, spectrum, axis, embeddingDim, rootHz);
}

// ---------------------------------------------------------------------------
// Q1177 — presetFamilySocraticRadarWaveletEnergy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarWaveletEnergy(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  levels: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarWaveletEnergy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarWaveletEnergy(tunings, spectrum, axis, levels, rootHz);
}

// ---------------------------------------------------------------------------
// Q1179 — presetFamilySocraticRadarFourierAmplitude
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFourierAmplitude(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFourierAmplitude> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFourierAmplitude(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1181 — presetFamilySocraticRadarRecurrenceRate
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRecurrenceRate(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  epsilon: number = 0.05,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRecurrenceRate> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRecurrenceRate(tunings, spectrum, axis, epsilon, rootHz);
}

// ---------------------------------------------------------------------------
// Q1183 — presetFamilySocraticRadarMutualInformation
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMutualInformation(
  presetIds: string[],
  spectrum: Spectrum,
  axis1: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  axis2: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  bins: number = 5,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMutualInformation> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMutualInformation(tunings, spectrum, axis1, axis2, bins, rootHz);
}

// ---------------------------------------------------------------------------
// Q1185 — presetFamilySocraticRadarApproximateEntropy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarApproximateEntropy(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  m: number = 2,
  r: number = 0.2,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarApproximateEntropy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarApproximateEntropy(tunings, spectrum, axis, m, r, rootHz);
}

// ---------------------------------------------------------------------------
// Q1187 — presetFamilySocraticRadarFractalDimension
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarFractalDimension(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarFractalDimension> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarFractalDimension(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1189 — presetFamilySocraticRadarSampleEntropy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSampleEntropy(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  m: number = 2,
  r: number = 0.2,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSampleEntropy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSampleEntropy(tunings, spectrum, axis, m, r, rootHz);
}

// ---------------------------------------------------------------------------
// Q1191 — presetFamilySocraticRadarTransferEntropy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTransferEntropy(
  presetIds: string[],
  spectrum: Spectrum,
  fromAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  toAxis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  lag: number = 1,
  bins: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTransferEntropy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTransferEntropy(tunings, spectrum, fromAxis, toAxis, lag, bins, rootHz);
}

// ---------------------------------------------------------------------------
// Q1193 — presetFamilySocraticRadarLyapunovExponent
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarLyapunovExponent(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarLyapunovExponent> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarLyapunovExponent(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1195 — presetFamilySocraticRadarHurstExponent
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarHurstExponent(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarHurstExponent> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarHurstExponent(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1197 — presetFamilySocraticRadarPermutationEntropy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPermutationEntropy(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  order: number = 3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPermutationEntropy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPermutationEntropy(tunings, spectrum, axis, order, rootHz);
}

// ---------------------------------------------------------------------------
// Q1199 — presetFamilySocraticRadarLempelZivComplexity
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarLempelZivComplexity(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  threshold: number = 0.5,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarLempelZivComplexity> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarLempelZivComplexity(tunings, spectrum, axis, threshold, rootHz);
}

// ---------------------------------------------------------------------------
// Q1201 — presetFamilySocraticRadarDetrendedFluctuation
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDetrendedFluctuation(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDetrendedFluctuation> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDetrendedFluctuation(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1203 — presetFamilySocraticRadarKolmogorovComplexity
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarKolmogorovComplexity(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  precision: number = 2,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarKolmogorovComplexity> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarKolmogorovComplexity(tunings, spectrum, axis, precision, rootHz);
}

// ---------------------------------------------------------------------------
// Q1205 — presetFamilySocraticRadarMultiScaleEntropy
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMultiScaleEntropy(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  maxScale: number = 3,
  m: number = 2,
  r: number = 0.2,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMultiScaleEntropy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMultiScaleEntropy(tunings, spectrum, axis, maxScale, m, r, rootHz);
}

// ---------------------------------------------------------------------------
// Q1207 — presetFamilySocraticRadarPairwiseDifference
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPairwiseDifference(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPairwiseDifference> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPairwiseDifference(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1209 — presetFamilySocraticRadarDecileProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDecileProfile(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDecileProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDecileProfile(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------
// Q1211 — presetFamilySocraticRadarIQR
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarIQR(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarIQR> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarIQR(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1213 — presetFamilySocraticRadarModeProfile
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarModeProfile(
  presetIds: string[],
  spectrum: Spectrum,
  bins: number = 5,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarModeProfile> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarModeProfile(tunings, spectrum, bins, rootHz);
}

// ---------------------------------------------------------------------------
// Q1215 — presetFamilySocraticRadarGeometricMeanV2
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGeometricMeanV2(
  presetIds: string[],
  spectrum: Spectrum,
  epsilon: number = 1e-10,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGeometricMeanV2> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGeometricMeanV2(tunings, spectrum, epsilon, rootHz);
}

// ---------------------------------------------------------------------------
// Q1217 — presetFamilySocraticRadarTrimmedMeanV2
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTrimmedMeanV2(
  presetIds: string[],
  spectrum: Spectrum,
  trimFraction: number = 0.1,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTrimmedMeanV2> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTrimmedMeanV2(tunings, spectrum, trimFraction, rootHz);
}

// ---------------------------------------------------------------------------
// Q1219 — presetFamilySocraticRadarHarmonicMeanV2
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarHarmonicMeanV2(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  epsilon: number = 1e-10,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarHarmonicMeanV2> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarHarmonicMeanV2(tunings, spectrum, rootHz, epsilon);
}

// ---------------------------------------------------------------------------
// Q1221 — presetFamilySocraticRadarWeightedMedian
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarWeightedMedian(
  presetIds: string[],
  spectrum: Spectrum,
  weights: number[],
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarWeightedMedian> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarWeightedMedian(tunings, spectrum, weights, rootHz);
}

// ---------------------------------------------------------------------------
// Q1223 — presetFamilySocraticRadarCoefficientOfVariation
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCoefficientOfVariation(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCoefficientOfVariation> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCoefficientOfVariation(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1225 — presetFamilySocraticRadarSkewness
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSkewness(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSkewness> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSkewness(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1227 — presetFamilySocraticRadarKurtosis
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarKurtosis(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarKurtosis> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarKurtosis(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1229 — presetFamilySocraticRadarZScoreMatrix
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarZScoreMatrix(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarZScoreMatrix> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarZScoreMatrix(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1231 — presetFamilySocraticRadarRobustScale
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarRobustScale(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarRobustScale> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarRobustScale(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1233 — presetFamilySocraticRadarMinMaxNormalize
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMinMaxNormalize(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMinMaxNormalize> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMinMaxNormalize(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1235 — presetFamilySocraticRadarEntropyWeightedComposite
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarEntropyWeightedComposite(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarEntropyWeightedComposite> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarEntropyWeightedComposite(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1237 — presetFamilySocraticRadarTOPSIS
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTOPSIS(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTOPSIS> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTOPSIS(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1239 — presetFamilySocraticRadarSAW
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSAW(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSAW> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSAW(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1241 — presetFamilySocraticRadarVIKOR
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarVIKOR(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarVIKOR> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarVIKOR(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1243 — presetFamilySocraticRadarEWMA
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarEWMA(
  presetIds: string[],
  spectrum: Spectrum,
  alpha: number = 0.3,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarEWMA> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarEWMA(tunings, spectrum, alpha, rootHz);
}

// ---------------------------------------------------------------------------
// Q1245 — presetFamilySocraticRadarGiniCoefficientV2
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarGiniCoefficientV2(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarGiniCoefficientV2> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarGiniCoefficientV2(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1247 — presetFamilySocraticRadarTheilIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTheilIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTheilIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTheilIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1249 — presetFamilySocraticRadarAtkinsonIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAtkinsonIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAtkinsonIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAtkinsonIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1251 — presetFamilySocraticRadarHooverIndex
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarHooverIndex(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarHooverIndex> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarHooverIndex(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------
// Q1253 — presetFamilySocraticRadarParetoScore
// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarParetoScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarParetoScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarParetoScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAdjacencyStrength(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAdjacencyStrength> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAdjacencyStrength(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarClusteringCoefficient(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarClusteringCoefficient> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarClusteringCoefficient(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarPageRankScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarPageRankScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarPageRankScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBetweennessProxy(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBetweennessProxy> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBetweennessProxy(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarModularityScore(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarModularityScore> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarModularityScore(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarNetworkDensity(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarNetworkDensity> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarNetworkDensity(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarJensenShannonDivergence(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarJensenShannonDivergence> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarJensenShannonDivergence(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarEarthMoverDistance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarEarthMoverDistance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarEarthMoverDistance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarTotalVariationDistance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarTotalVariationDistance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarTotalVariationDistance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarHellingerDistance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarHellingerDistance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarHellingerDistance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBhattacharyyaCoefficient(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBhattacharyyaCoefficient> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBhattacharyyaCoefficient(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarKLDivergenceAsymmetric(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarKLDivergenceAsymmetric> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarKLDivergenceAsymmetric(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSpectralRolloff(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSpectralRolloff> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSpectralRolloff(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarDissonanceGradient(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarDissonanceGradient> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarDissonanceGradient(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarCrossAxisCorrelationMatrix(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarCrossAxisCorrelationMatrix> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarCrossAxisCorrelationMatrix(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarVarianceExplained(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarVarianceExplained> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarVarianceExplained(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarSpectralBandwidth(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarSpectralBandwidth> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarSpectralBandwidth(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarAutoCorrelationLag1(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarAutoCorrelationLag1> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarAutoCorrelationLag1(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarKendallTau(
  presetIds: string[],
  spectrum: Spectrum,
  axis1: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  axis2: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarKendallTau> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarKendallTau(tunings, spectrum, axis1, axis2, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarConcordancePairs(
  presetIds: string[],
  spectrum: Spectrum,
  axis1: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  axis2: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarConcordancePairs> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarConcordancePairs(tunings, spectrum, axis1, axis2, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarMannWhitneyU(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  groupA: number[] = [0],
  groupB: number[] = [1],
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarMannWhitneyU> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarMannWhitneyU(tunings, spectrum, axis, groupA, groupB, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarBootstrapMeanCI(
  presetIds: string[],
  spectrum: Spectrum,
  axis: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarBootstrapMeanCI> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarBootstrapMeanCI(tunings, spectrum, axis, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarJackknifeVariance(
  presetIds: string[],
  spectrum: Spectrum,
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarJackknifeVariance> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarJackknifeVariance(tunings, spectrum, rootHz);
}

// ---------------------------------------------------------------------------

export function presetFamilySocraticRadarWilcoxonSignedRank(
  presetIds: string[],
  spectrum: Spectrum,
  axis1: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence' = 'diversity',
  axis2: 'diversity' | 'versatility' | 'maturity' | 'benchmark' | 'convergence' = 'versatility',
  rootHz?: number,
  presets: readonly TuningPreset[] = ALL_PRESETS,
): ReturnType<typeof tuningFamilySocraticRadarWilcoxonSignedRank> {
  const tunings = presetIds.map((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) throw new RangeError(`Unknown preset: ${presetId}`);
    return loadTuningPreset(preset);
  });
  return tuningFamilySocraticRadarWilcoxonSignedRank(tunings, spectrum, axis1, axis2, rootHz);
}
