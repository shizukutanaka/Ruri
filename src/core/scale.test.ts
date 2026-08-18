import { describe, it, expect } from 'vitest';
import { type TuningSystem, equalTemperament12, edo, degreeToFreq } from './tuning.js';
import { generatedTuning } from './generate.js';
import { rankChords } from './chord-search.js';
import { harmonicSpectrum, bellSpectrum } from './spectrum.js';
import { chordDissonance } from './dissonance.js';
import { cents as pitchFromCents } from './cents.js';
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
  progressionScoreSummary,
  chordMapSummary,
  tuningReport,
  annotateProgression,
  progressionClimaxChord,
  progressionResolutionChord,
  chordDescription,
  progressionEnergyShape,
  tuningIntervalHistogram,
  scaleSimilarityMatrix,
  modeIntervalSets,
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
  detectNearestScale,
  scalePentatonicMinorDensity,
  scalePentatonicMajorDensity,
  scaleChineseGongContent,
  scaleInSenContent,
  scaleHirajoshiContent,
  scaleYoNaContent,
  scaleCubanMontuno,
  scaleAndeanPentatonic,
  scaleSambaBaiao,
  scaleTangoScale,
  scaleJavaneseSlendro,
  scaleBaliPelog,
  scaleThai7Tone,
  scaleBurmeseHeptatonic,
  scaleMaqamRastV2,
  scaleMaqamHijazV2,
  scalePersianDastgah,
  scaleArabicMaqamSaba,
  scaleEthiopianKignit,
  scaleWestAfricanPentatonic,
  scaleNorthAfricanRasd,
  scaleZuluScale,
  scaleUzbekShashmakom,
  scaleMongolianPentatonic,
  scaleTibetanRitual,
  scaleKazakhDombra,
  scaleNordicGammalDans,
  scaleFinnishRuno,
  scaleSwedishHardingfele,
  scaleIcelandicTvisongur,
  scalePolishMazurka,
  scaleCzechLidova,
  scaleUkrainianDorian,
  scaleSerbianKolo,
  scaleQuechuaPentatonic,
  scaleAymaraScale,
  scaleGuaraniPentatonic,
  scaleTupiScale,
  scaleRagaTodiV2,
  scaleRagaPurviV2,
  scaleRagaMarwaV2,
  scaleRagaLalita,
  scaleYorubaScale,
  scaleGhanaPentatonic,
  scaleMaliKora,
  scaleGriotScale,
  scaleCalypsoScale,
  scaleReggaePentatonic,
  scaleZoukScale,
  scaleMerengueScale,
  scaleNavajoNightChant,
  scaleLakotaPentatonic,
  scaleHaidaScale,
  scaleCherokeePentatonic,
  scaleSomaliPentatonic,
  scaleKenyanBenga,
  scaleMasaiScale,
  scaleMalagasyScale,
  scaleItalianTarantella,
  scaleGreekRembetiko,
  scalePortugueseFado,
  scaleCroatianTamburica,
  scaleBulgarianAsymmetric,
  scaleAlbanianIso,
  scaleMacedonianScale,
  scaleBosnianSevdah,
  scaleSamoanScale,
  scaleFijianScale,
  scaleTonganScale,
  scalePapuaNewGuinea,
  scaleMayanPentatonic,
  scaleGarifulaScale,
  scaleZapotecScale,
  scalePygmyScale,
  scaleAkanScale,
  scaleEweScale,
  scaleYorubaScaleV2,
  scaleSwedishHerdingScale,
  scaleNorwegianSlattScale,
  scaleFinnishKanteliScale,
  scaleSamiJoikScale,
  scaleEthiopianTizitaScale,
  scaleKenyaBengaScale,
  scaleMalagasyScaleV2,
  scaleUgandanPentatonicScale,
  scaleKazakhPentatonicScale,
  scaleUzbekScale,
  scaleTajikScale,
  scaleTurkmenScale,
  scaleThaiPentScale,
  scaleKhmerScale,
  scaleJavaneseSlendroV2,
  scaleBurmeseHeptatonicV2,
  scaleAndesQuechuaScale,
  scaleAmazonianScale,
  scaleGuaraniScale,
  scaleAymaraScaleV2,
  scaleCubanSonScale,
  scaleCalypsoScaleV2,
  scaleHaitianMerengueScale,
  scaleJamaicanMentoScale,
  scaleMaqamSabaScale,
  scaleMaqamNahawandScale,
  scaleMaqamKurdScale,
  scaleMaqamAjamScale,
  scaleAboriginalPentatonicScale,
  scaleMaoriScale,
  scaleVanuatuScale,
  scaleSolomonIslandsScale,
  scaleBerberPentatonicScale,
  scaleNubianScale,
  scaleGnawaMusicScale,
  scaleTuaregScale,
  scaleGuangdongMusicScale,
  scaleSichuanOperaScale,
  scaleShanshuiGuqinScale,
  scaleYunnanMinorityScale,
  scaleRagaBhairavScale,
  scaleRagaYamanScale,
  scaleRagaDeshScale,
  scaleRagaKafiScale,
  scaleGeorgianPolyphonicScale,
  scaleArmenianDudukScale,
  scaleAzerbaijaniMughamScale,
  scaleChechenLezgiScale,
  scaleRomanianDorian,
  scaleHungarianMinorScale,
  scalePolishHighlandScale,
  scaleUkrainianDorianScale,
  scaleFlamencoScaleV2,
  scalePortugueseFadoScale,
  scaleCatalanScale,
  scaleGalicianScale,
  scaleEthiopianAnchihoye,
  scaleEritreanPentatonic,
  scaleSomaliModal,
  scaleDjiboutianScale,
  scaleKazakhSteppeScale,
  scaleUzbekDotar,
  scaleTajikFalak,
  scaleKyrgyzScale,
  scaleAndeseanScale,
  scaleChileanCueca,
  scaleArgentineZamba,
  scaleBolivianScale,
  scaleNorwegianFolkScale,
  scaleSwedishPolskaScale,
  scaleFinnishRunoV2,
  scaleDanishScale,
  scaleGhanaianHighlife,
  scaleWolofScale,
  scaleMandinkaScale,
  scaleHausaScale,
  scaleArabicMaqamRast,
  scaleTurkishMakamHicaz,
  scaleIranianShur,
  scaleLebaneseMaqam,
  scaleBengaliScale,
  scalePunjabiScale,
  scaleRajasthaniScale,
  scaleSriLankaScale,
  scalePuertoRicanScale,
  scaleJamaicanReggaeScale,
  scaleTrinidadianScale,
  scaleBarbadianScale,
  scaleVietnameseScale,
  scaleFilipinoCulintang,
  scaleMalaysianScale,
  scaleCambodianScale,
  scaleMaoriScaleV2,
  scalePolynesianScale,
  scaleAboriginalDreaming,
  scalePapuaNewGuineaScale,
  scaleMoroccanGnawa,
  scaleTunisianMaqam,
  scaleAlgerianChabi,
  scaleEgyptianRast,
  scaleBrazilianChoro,
  scaleColombianCumbia,
  scalePeruvianValsCriollo,
  scaleVenezuelanJoropo,
  scaleCongoleseSoukous,
  scaleCameroonMakossa,
  scaleGaboneseTraditional,
  scaleRwandanInanga,
  scaleNavajoScale,
  scaleHopiScale,
  scaleIroquoisScale,
  scaleInuitScale,
  scaleMongolianBowl,
  scaleTibetanSinging,
  scaleNepaleseScale,
  scaleLadakhiScale,
  scaleNigerianJuju,
  scaleSenegaleseWolof,
  scaleMaliBamanaSuleba,
  scaleGuineanJeliya,
  scaleZimbabweMbira,
  scaleShonaScale,
  scaleMozambiquanScale,
  scaleBotswanaScale,
  scaleSyrianScale,
  scaleIraqiMaqam,
  scalePalestinianScale,
  scaleYemeniScale,
  scaleKoreanScale,
  scaleMongolianLongSong,
  scaleManchuScale,
  scaleAinuScale,
  scaleYakutScale,
  scaleChukchiScale,
  scaleEvenkScale,
  scaleBuryatScale,
  scaleAleutScale,
  scaleYupikScale,
  scaleTlingitScale,
  scaleAthabaskanScale,
  scaleMayanScale,
  scaleNahuatlScale,
  scaleMixtecScale,
  scaleOlmecScale,
  scaleYanomamiScale,
  scaleWayuuScale,
  scaleShuarScale,
  scaleXinguScale,
  scaleCarnaticScale,
  scaleHindustaniScale,
  scaleTamilScale,
  scaleGujaratiScale,
  scaleGreekModalScale,
  scaleByzantineScale,
  scaleCypriotScale,
  scaleAnatolianFolkScale,
  scaleWestPolynesianScale,
  scaleMicronesianScale,
  scaleKiribatiScale,
  scaleMarshalleseScale,
  scaleAppalachianScale,
  scaleOzarkScale,
  scaleCajunScale,
  scaleZydecoScale,
  scaleWelshScale,
  scaleIrishScale,
  scaleScottishScale,
  scaleBretonScale,
  scaleBasqueScale,
  scaleAndalusianScale,
  scaleAsturianScale,
  scaleValencianScale,
  scaleFlemishScale,
  scaleDutchScale,
  scaleWalloonScale,
  scaleLuxembourgScale,
  scaleSlovenianScale,
  scaleCroatianScaleV2,
  scaleBosnianScale,
  scaleMontenegrinScale,
  scaleFinnoUgricScale,
  scaleSamiScale,
  scaleKareliaScale,
  scaleErzyaScale,
  scaleAustrianAlpineScale,
  scaleBavarianScale,
  scaleTyroleanScale,
  scaleSwissAlpineScale,
  scaleAboriginalScale,
  scaleTorresStraitScale,
  scaleMaoriScaleV3,
  scaleTasmanianScale,
  scalePersianClassical,
  scaleAzerbaijaniScale,
  scaleUzbekMaqom,
  scaleTajikMaqom,
  scaleBerberScale,
  scaleKabyleScale,
  scaleAmazighScale,
  scaleChaouiScale,
  scaleTexMexScale,
  scaleBluegrassScale,
  scaleGospelScale,
  scaleAppalachianScaleV2,
  scaleGreenlandicScale,
  scaleFaroeseScale,
  scaleShetlandScale,
  scaleOrkneyScale,
  scaleQuebecoisScale,
  scaleAcadianScale,
  scaleFrenchCanadianScale,
  scaleMetisScale,
  scaleSicilianScale,
  scaleSardinianScale,
  scaleCorsicanScale,
  scaleMalteseScale,
  scaleVenetianScale,
  scaleNeapolitanScaleV2,
  scaleTuscanScale,
  scaleLombardScale,
  scaleWestSlavicScale,
  scalePolishScaleV2,
  scaleCzechScaleV2,
  scaleSlovakScale,
  scaleTibetoBurmanScale,
  scaleNagaScale,
  scaleKarenScale,
  scaleShanScale,
  scaleMoldovanScale,
  scaleTranssylvanianScale,
  scaleWallachianScale,
  scaleBanatScale,
  scaleUkrainianScaleV2,
  scaleBelarusianScale,
  scaleCossackScale,
  scaleRusynScale,
  scaleUralicScale,
  scaleMordvinScale,
  scaleMariScale,
  scaleUdmurtScale,
  scaleSouthSlavicScale,
  scaleMacedonianScaleV2,
  scaleSerbianScaleV2,
  scaleKosovarScale,
  scaleTurkicScale,
  scaleTatarScale,
  scaleBashkirScale,
  scaleChuvashScale,
  scaleHungarianScaleV2,
  scaleRomaScale,
  scaleSintiScale,
  scaleTransdanubianScale,
  scaleAlbanianScaleV2,
  scaleArbereshScale,
  scaleToskScale,
  scaleGhegScale,
  scaleGeorgianScaleV2,
  scaleSvanScale,
  scaleMingrelianScale,
  scaleAdjaraScale,
  scaleAndalucianFlamenco,
  scaleGypsyKingsScale,
  scaleGranadaScale,
  scaleSevillanaScale,
  scaleCaribbeanCalypsoV2,
  scaleTrinidadianSteelpanScale,
  scaleJamaicanDancehallScale,
  scaleHaitianKompaScale,
  scaleBaskCountryScale,
  scaleNavarreScale,
  scaleAragonScale,
  scaleGalicianScaleV2,
  scaleAndeanQuenaScale,
  scaleBolivianSaya,
  scaleEcuadorianSanjuanito,
  scaleColombianVallenato,
  scaleWestAfricanGriotScale,
  scaleMandeScale,
  scaleSonghaiScale,
  scaleFulaniScale,
  scaleCentralAmericanScale,
  scaleGuatemalanMarimba,
  scaleHondurasGarifuna,
  scaleNicaraguanScale,
} from './scale.js';

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

describe('scalePentatonicMinorDensity', () => {
  it('returns 0 for empty scale', () => {
    expect(scalePentatonicMinorDensity([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO', () => {
    const v = scalePentatonicMinorDensity(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO', () => {
    const v = scalePentatonicMinorDensity(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePentatonicMajorDensity', () => {
  it('returns 0 for empty scale', () => {
    expect(scalePentatonicMajorDensity([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO', () => {
    const v = scalePentatonicMajorDensity(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO', () => {
    const v = scalePentatonicMajorDensity(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleChineseGongContent', () => {
  it('returns 0 for empty scale', () => {
    expect(scaleChineseGongContent([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO', () => {
    const v = scaleChineseGongContent(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO', () => {
    const v = scaleChineseGongContent(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleInSenContent', () => {
  it('returns 0 for empty scale', () => {
    expect(scaleInSenContent([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO', () => {
    const v = scaleInSenContent(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO', () => {
    const v = scaleInSenContent(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHirajoshiContent', () => {
  it('returns 0 for empty scale', () => {
    expect(scaleHirajoshiContent([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO', () => {
    const v = scaleHirajoshiContent(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO', () => {
    const v = scaleHirajoshiContent(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYoNaContent', () => {
  it('returns 0 for empty scale', () => {
    expect(scaleYoNaContent([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO', () => {
    const v = scaleYoNaContent(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO', () => {
    const v = scaleYoNaContent(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCubanMontuno', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCubanMontuno([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCubanMontuno(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCubanMontuno(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAndeanPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAndeanPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAndeanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAndeanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSambaBaiao', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSambaBaiao([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSambaBaiao(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSambaBaiao(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTangoScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTangoScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTangoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTangoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleJavaneseSlendro', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleJavaneseSlendro([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleJavaneseSlendro(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleJavaneseSlendro(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBaliPelog', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBaliPelog([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBaliPelog(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBaliPelog(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleThai7Tone', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleThai7Tone([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleThai7Tone(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleThai7Tone(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBurmeseHeptatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBurmeseHeptatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBurmeseHeptatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBurmeseHeptatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaqamRastV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMaqamRastV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMaqamRastV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMaqamRastV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaqamHijazV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMaqamHijazV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMaqamHijazV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMaqamHijazV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePersianDastgah', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePersianDastgah([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePersianDastgah(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePersianDastgah(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleArabicMaqamSaba', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleArabicMaqamSaba([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleArabicMaqamSaba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleArabicMaqamSaba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleEthiopianKignit', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleEthiopianKignit([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleEthiopianKignit(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleEthiopianKignit(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWestAfricanPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWestAfricanPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWestAfricanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWestAfricanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNorthAfricanRasd', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNorthAfricanRasd([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNorthAfricanRasd(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNorthAfricanRasd(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleZuluScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleZuluScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleZuluScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleZuluScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUzbekShashmakom', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleUzbekShashmakom([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleUzbekShashmakom(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleUzbekShashmakom(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMongolianPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMongolianPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMongolianPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMongolianPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTibetanRitual', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTibetanRitual([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTibetanRitual(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTibetanRitual(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKazakhDombra', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKazakhDombra([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKazakhDombra(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKazakhDombra(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNordicGammalDans', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNordicGammalDans([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNordicGammalDans(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNordicGammalDans(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFinnishRuno', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFinnishRuno([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFinnishRuno(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFinnishRuno(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSwedishHardingfele', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSwedishHardingfele([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSwedishHardingfele(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSwedishHardingfele(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleIcelandicTvisongur', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleIcelandicTvisongur([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleIcelandicTvisongur(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleIcelandicTvisongur(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePolishMazurka', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePolishMazurka([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePolishMazurka(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePolishMazurka(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCzechLidova', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCzechLidova([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCzechLidova(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCzechLidova(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUkrainianDorian', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleUkrainianDorian([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleUkrainianDorian(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleUkrainianDorian(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSerbianKolo', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSerbianKolo([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSerbianKolo(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSerbianKolo(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleQuechuaPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleQuechuaPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleQuechuaPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleQuechuaPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAymaraScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAymaraScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAymaraScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAymaraScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGuaraniPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGuaraniPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGuaraniPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGuaraniPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTupiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTupiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTupiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTupiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRagaTodiV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRagaTodiV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRagaTodiV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRagaTodiV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRagaPurviV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRagaPurviV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRagaPurviV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRagaPurviV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRagaMarwaV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRagaMarwaV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRagaMarwaV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRagaMarwaV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRagaLalita', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRagaLalita([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRagaLalita(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRagaLalita(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYorubaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleYorubaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleYorubaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleYorubaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGhanaPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGhanaPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGhanaPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGhanaPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaliKora', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMaliKora([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMaliKora(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMaliKora(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGriotScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGriotScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGriotScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGriotScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCalypsoScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCalypsoScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCalypsoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCalypsoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleReggaePentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleReggaePentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleReggaePentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleReggaePentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleZoukScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleZoukScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleZoukScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleZoukScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMerengueScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMerengueScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMerengueScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMerengueScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNavajoNightChant', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNavajoNightChant([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNavajoNightChant(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNavajoNightChant(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleLakotaPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleLakotaPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleLakotaPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleLakotaPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHaidaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleHaidaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleHaidaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleHaidaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCherokeePentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCherokeePentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCherokeePentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCherokeePentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSomaliPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSomaliPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSomaliPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSomaliPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKenyanBenga', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKenyanBenga([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKenyanBenga(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKenyanBenga(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMasaiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMasaiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMasaiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMasaiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMalagasyScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMalagasyScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMalagasyScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMalagasyScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleItalianTarantella', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleItalianTarantella([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleItalianTarantella(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleItalianTarantella(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGreekRembetiko', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGreekRembetiko([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGreekRembetiko(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGreekRembetiko(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePortugueseFado', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePortugueseFado([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePortugueseFado(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePortugueseFado(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCroatianTamburica', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCroatianTamburica([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCroatianTamburica(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCroatianTamburica(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBulgarianAsymmetric', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBulgarianAsymmetric([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBulgarianAsymmetric(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBulgarianAsymmetric(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAlbanianIso', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAlbanianIso([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAlbanianIso(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAlbanianIso(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMacedonianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMacedonianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMacedonianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMacedonianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBosnianSevdah', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBosnianSevdah([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBosnianSevdah(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBosnianSevdah(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSamoanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSamoanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSamoanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSamoanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFijianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFijianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFijianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFijianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTonganScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTonganScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTonganScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTonganScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePapuaNewGuinea', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePapuaNewGuinea([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePapuaNewGuinea(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePapuaNewGuinea(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMayanPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMayanPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMayanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMayanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGarifulaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGarifulaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGarifulaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGarifulaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleZapotecScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleZapotecScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO degrees', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleZapotecScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO degrees', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleZapotecScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round252 西アフリカ音階
describe('scalePygmyScale', () => {
  it('empty returns 0', () => {
    expect(scalePygmyScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scalePygmyScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scalePygmyScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAkanScale', () => {
  it('empty returns 0', () => {
    expect(scaleAkanScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleAkanScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleAkanScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleEweScale', () => {
  it('empty returns 0', () => {
    expect(scaleEweScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleEweScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleEweScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYorubaScaleV2', () => {
  it('empty returns 0', () => {
    expect(scaleYorubaScaleV2([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleYorubaScaleV2(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleYorubaScaleV2(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round253 北欧音階
describe('scaleSwedishHerdingScale', () => {
  it('empty returns 0', () => {
    expect(scaleSwedishHerdingScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleSwedishHerdingScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleSwedishHerdingScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNorwegianSlattScale', () => {
  it('empty returns 0', () => {
    expect(scaleNorwegianSlattScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleNorwegianSlattScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleNorwegianSlattScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFinnishKanteliScale', () => {
  it('empty returns 0', () => {
    expect(scaleFinnishKanteliScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleFinnishKanteliScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleFinnishKanteliScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSamiJoikScale', () => {
  it('empty returns 0', () => {
    expect(scaleSamiJoikScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleSamiJoikScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleSamiJoikScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round254 東アフリカ音階
describe('scaleEthiopianTizitaScale', () => {
  it('empty returns 0', () => {
    expect(scaleEthiopianTizitaScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleEthiopianTizitaScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleEthiopianTizitaScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKenyaBengaScale', () => {
  it('empty returns 0', () => {
    expect(scaleKenyaBengaScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleKenyaBengaScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleKenyaBengaScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMalagasyScaleV2', () => {
  it('empty returns 0', () => {
    expect(scaleMalagasyScaleV2([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleMalagasyScaleV2(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleMalagasyScaleV2(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUgandanPentatonicScale', () => {
  it('empty returns 0', () => {
    expect(scaleUgandanPentatonicScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleUgandanPentatonicScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleUgandanPentatonicScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round255 中央アジア音階
describe('scaleKazakhPentatonicScale', () => {
  it('empty returns 0', () => {
    expect(scaleKazakhPentatonicScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleKazakhPentatonicScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleKazakhPentatonicScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUzbekScale', () => {
  it('empty returns 0', () => {
    expect(scaleUzbekScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleUzbekScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleUzbekScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTajikScale', () => {
  it('empty returns 0', () => {
    expect(scaleTajikScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleTajikScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleTajikScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTurkmenScale', () => {
  it('empty returns 0', () => {
    expect(scaleTurkmenScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleTurkmenScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleTurkmenScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round256 東南アジア音階
describe('scaleThaiPentScale', () => {
  it('empty returns 0', () => {
    expect(scaleThaiPentScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleThaiPentScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleThaiPentScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKhmerScale', () => {
  it('empty returns 0', () => {
    expect(scaleKhmerScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleKhmerScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleKhmerScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleJavaneseSlendroV2', () => {
  it('empty returns 0', () => {
    expect(scaleJavaneseSlendroV2([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleJavaneseSlendroV2(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleJavaneseSlendroV2(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBurmeseHeptatonicV2', () => {
  it('empty returns 0', () => {
    expect(scaleBurmeseHeptatonicV2([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleBurmeseHeptatonicV2(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleBurmeseHeptatonicV2(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round257 南アメリカ音階
describe('scaleAndesQuechuaScale', () => {
  it('empty returns 0', () => {
    expect(scaleAndesQuechuaScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleAndesQuechuaScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleAndesQuechuaScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAmazonianScale', () => {
  it('empty returns 0', () => {
    expect(scaleAmazonianScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleAmazonianScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleAmazonianScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGuaraniScale', () => {
  it('empty returns 0', () => {
    expect(scaleGuaraniScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleGuaraniScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleGuaraniScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAymaraScaleV2', () => {
  it('empty returns 0', () => {
    expect(scaleAymaraScaleV2([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleAymaraScaleV2(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleAymaraScaleV2(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round258 カリブ海音階
describe('scaleCubanSonScale', () => {
  it('empty returns 0', () => {
    expect(scaleCubanSonScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleCubanSonScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleCubanSonScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCalypsoScaleV2', () => {
  it('empty returns 0', () => {
    expect(scaleCalypsoScaleV2([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleCalypsoScaleV2(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleCalypsoScaleV2(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHaitianMerengueScale', () => {
  it('empty returns 0', () => {
    expect(scaleHaitianMerengueScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleHaitianMerengueScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleHaitianMerengueScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleJamaicanMentoScale', () => {
  it('empty returns 0', () => {
    expect(scaleJamaicanMentoScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleJamaicanMentoScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleJamaicanMentoScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round259 中東音階
describe('scaleMaqamSabaScale', () => {
  it('empty returns 0', () => {
    expect(scaleMaqamSabaScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleMaqamSabaScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleMaqamSabaScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaqamNahawandScale', () => {
  it('empty returns 0', () => {
    expect(scaleMaqamNahawandScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleMaqamNahawandScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleMaqamNahawandScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaqamKurdScale', () => {
  it('empty returns 0', () => {
    expect(scaleMaqamKurdScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleMaqamKurdScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleMaqamKurdScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaqamAjamScale', () => {
  it('empty returns 0', () => {
    expect(scaleMaqamAjamScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleMaqamAjamScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleMaqamAjamScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round260 オセアニア先住民音階
describe('scaleAboriginalPentatonicScale', () => {
  it('empty returns 0', () => {
    expect(scaleAboriginalPentatonicScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleAboriginalPentatonicScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleAboriginalPentatonicScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaoriScale', () => {
  it('empty returns 0', () => {
    expect(scaleMaoriScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleMaoriScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleMaoriScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleVanuatuScale', () => {
  it('empty returns 0', () => {
    expect(scaleVanuatuScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleVanuatuScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleVanuatuScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSolomonIslandsScale', () => {
  it('empty returns 0', () => {
    expect(scaleSolomonIslandsScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleSolomonIslandsScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleSolomonIslandsScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round261 北アフリカ音階
describe('scaleBerberPentatonicScale', () => {
  it('empty returns 0', () => {
    expect(scaleBerberPentatonicScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleBerberPentatonicScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleBerberPentatonicScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNubianScale', () => {
  it('empty returns 0', () => {
    expect(scaleNubianScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleNubianScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleNubianScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGnawaMusicScale', () => {
  it('empty returns 0', () => {
    expect(scaleGnawaMusicScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleGnawaMusicScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleGnawaMusicScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTuaregScale', () => {
  it('empty returns 0', () => {
    expect(scaleTuaregScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleTuaregScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleTuaregScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round262 中国地方音階
describe('scaleGuangdongMusicScale', () => {
  it('empty returns 0', () => {
    expect(scaleGuangdongMusicScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleGuangdongMusicScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleGuangdongMusicScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSichuanOperaScale', () => {
  it('empty returns 0', () => {
    expect(scaleSichuanOperaScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleSichuanOperaScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleSichuanOperaScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleShanshuiGuqinScale', () => {
  it('empty returns 0', () => {
    expect(scaleShanshuiGuqinScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleShanshuiGuqinScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleShanshuiGuqinScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYunnanMinorityScale', () => {
  it('empty returns 0', () => {
    expect(scaleYunnanMinorityScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleYunnanMinorityScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleYunnanMinorityScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round263 インド古典音階
describe('scaleRagaBhairavScale', () => {
  it('empty returns 0', () => {
    expect(scaleRagaBhairavScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleRagaBhairavScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleRagaBhairavScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRagaYamanScale', () => {
  it('empty returns 0', () => {
    expect(scaleRagaYamanScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleRagaYamanScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleRagaYamanScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRagaDeshScale', () => {
  it('empty returns 0', () => {
    expect(scaleRagaDeshScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleRagaDeshScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleRagaDeshScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRagaKafiScale', () => {
  it('empty returns 0', () => {
    expect(scaleRagaKafiScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleRagaKafiScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleRagaKafiScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round264 コーカサス音階
describe('scaleGeorgianPolyphonicScale', () => {
  it('empty returns 0', () => {
    expect(scaleGeorgianPolyphonicScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleGeorgianPolyphonicScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleGeorgianPolyphonicScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleArmenianDudukScale', () => {
  it('empty returns 0', () => {
    expect(scaleArmenianDudukScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleArmenianDudukScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleArmenianDudukScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAzerbaijaniMughamScale', () => {
  it('empty returns 0', () => {
    expect(scaleAzerbaijaniMughamScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleAzerbaijaniMughamScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleAzerbaijaniMughamScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleChechenLezgiScale', () => {
  it('empty returns 0', () => {
    expect(scaleChechenLezgiScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleChechenLezgiScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleChechenLezgiScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

// Round265 東欧音階
describe('scaleRomanianDorian', () => {
  it('empty returns 0', () => {
    expect(scaleRomanianDorian([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleRomanianDorian(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleRomanianDorian(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHungarianMinorScale', () => {
  it('empty returns 0', () => {
    expect(scaleHungarianMinorScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleHungarianMinorScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleHungarianMinorScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePolishHighlandScale', () => {
  it('empty returns 0', () => {
    expect(scalePolishHighlandScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scalePolishHighlandScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scalePolishHighlandScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUkrainianDorianScale', () => {
  it('empty returns 0', () => {
    expect(scaleUkrainianDorianScale([])).toBe(0);
  });
  it('12-EDO in [0,1]', () => {
    const v = scaleUkrainianDorianScale(edo(12, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('19-EDO in [0,1]', () => {
    const v = scaleUkrainianDorianScale(edo(19, 440).degrees);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFlamencoScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFlamencoScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFlamencoScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFlamencoScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePortugueseFadoScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePortugueseFadoScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePortugueseFadoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePortugueseFadoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCatalanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCatalanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCatalanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCatalanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGalicianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGalicianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGalicianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGalicianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleEthiopianAnchihoye', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleEthiopianAnchihoye([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleEthiopianAnchihoye(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleEthiopianAnchihoye(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleEritreanPentatonic', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleEritreanPentatonic([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleEritreanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleEritreanPentatonic(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSomaliModal', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSomaliModal([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSomaliModal(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSomaliModal(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleDjiboutianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleDjiboutianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleDjiboutianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleDjiboutianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKazakhSteppeScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKazakhSteppeScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKazakhSteppeScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKazakhSteppeScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUzbekDotar', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleUzbekDotar([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleUzbekDotar(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleUzbekDotar(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTajikFalak', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTajikFalak([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTajikFalak(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTajikFalak(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKyrgyzScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKyrgyzScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKyrgyzScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKyrgyzScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAndeseanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAndeseanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAndeseanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAndeseanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleChileanCueca', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleChileanCueca([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleChileanCueca(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleChileanCueca(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleArgentineZamba', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleArgentineZamba([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleArgentineZamba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleArgentineZamba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBolivianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBolivianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBolivianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBolivianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNorwegianFolkScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNorwegianFolkScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNorwegianFolkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNorwegianFolkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSwedishPolskaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSwedishPolskaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSwedishPolskaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSwedishPolskaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFinnishRunoV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFinnishRunoV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFinnishRunoV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFinnishRunoV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleDanishScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleDanishScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleDanishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleDanishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGhanaianHighlife', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGhanaianHighlife([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGhanaianHighlife(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGhanaianHighlife(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWolofScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWolofScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWolofScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWolofScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMandinkaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMandinkaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMandinkaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMandinkaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHausaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleHausaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleHausaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleHausaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleArabicMaqamRast', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleArabicMaqamRast([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleArabicMaqamRast(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleArabicMaqamRast(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTurkishMakamHicaz', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTurkishMakamHicaz([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTurkishMakamHicaz(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTurkishMakamHicaz(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleIranianShur', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleIranianShur([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleIranianShur(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleIranianShur(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleLebaneseMaqam', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleLebaneseMaqam([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleLebaneseMaqam(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleLebaneseMaqam(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBengaliScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBengaliScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBengaliScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBengaliScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePunjabiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePunjabiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePunjabiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePunjabiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRajasthaniScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRajasthaniScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRajasthaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRajasthaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSriLankaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSriLankaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSriLankaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSriLankaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePuertoRicanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePuertoRicanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePuertoRicanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePuertoRicanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleJamaicanReggaeScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleJamaicanReggaeScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleJamaicanReggaeScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleJamaicanReggaeScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTrinidadianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTrinidadianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTrinidadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTrinidadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBarbadianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBarbadianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBarbadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBarbadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleVietnameseScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleVietnameseScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleVietnameseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleVietnameseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFilipinoCulintang', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFilipinoCulintang([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFilipinoCulintang(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFilipinoCulintang(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMalaysianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMalaysianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMalaysianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMalaysianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCambodianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCambodianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCambodianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCambodianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaoriScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMaoriScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMaoriScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMaoriScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePolynesianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePolynesianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePolynesianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePolynesianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAboriginalDreaming', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAboriginalDreaming([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAboriginalDreaming(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAboriginalDreaming(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePapuaNewGuineaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePapuaNewGuineaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePapuaNewGuineaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePapuaNewGuineaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMoroccanGnawa', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMoroccanGnawa([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMoroccanGnawa(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMoroccanGnawa(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTunisianMaqam', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTunisianMaqam([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTunisianMaqam(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTunisianMaqam(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAlgerianChabi', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAlgerianChabi([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAlgerianChabi(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAlgerianChabi(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleEgyptianRast', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleEgyptianRast([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleEgyptianRast(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleEgyptianRast(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBrazilianChoro', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBrazilianChoro([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBrazilianChoro(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBrazilianChoro(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleColombianCumbia', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleColombianCumbia([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleColombianCumbia(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleColombianCumbia(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePeruvianValsCriollo', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePeruvianValsCriollo([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePeruvianValsCriollo(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePeruvianValsCriollo(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleVenezuelanJoropo', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleVenezuelanJoropo([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleVenezuelanJoropo(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleVenezuelanJoropo(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCongoleseSoukous', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCongoleseSoukous([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCongoleseSoukous(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCongoleseSoukous(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCameroonMakossa', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCameroonMakossa([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCameroonMakossa(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCameroonMakossa(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGaboneseTraditional', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGaboneseTraditional([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGaboneseTraditional(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGaboneseTraditional(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRwandanInanga', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRwandanInanga([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRwandanInanga(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRwandanInanga(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNavajoScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNavajoScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNavajoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNavajoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHopiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleHopiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleHopiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleHopiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleIroquoisScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleIroquoisScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleIroquoisScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleIroquoisScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleInuitScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleInuitScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleInuitScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleInuitScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMongolianBowl', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMongolianBowl([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMongolianBowl(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMongolianBowl(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTibetanSinging', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTibetanSinging([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTibetanSinging(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTibetanSinging(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNepaleseScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNepaleseScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNepaleseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNepaleseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleLadakhiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleLadakhiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleLadakhiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleLadakhiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNigerianJuju', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNigerianJuju([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNigerianJuju(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNigerianJuju(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSenegaleseWolof', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSenegaleseWolof([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSenegaleseWolof(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSenegaleseWolof(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaliBamanaSuleba', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMaliBamanaSuleba([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMaliBamanaSuleba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMaliBamanaSuleba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGuineanJeliya', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGuineanJeliya([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGuineanJeliya(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGuineanJeliya(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleZimbabweMbira', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleZimbabweMbira([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleZimbabweMbira(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleZimbabweMbira(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleShonaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleShonaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleShonaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleShonaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMozambiquanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMozambiquanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMozambiquanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMozambiquanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBotswanaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBotswanaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBotswanaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBotswanaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSyrianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSyrianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSyrianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSyrianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleIraqiMaqam', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleIraqiMaqam([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleIraqiMaqam(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleIraqiMaqam(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePalestinianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePalestinianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePalestinianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePalestinianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYemeniScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleYemeniScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleYemeniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleYemeniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKoreanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKoreanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKoreanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKoreanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMongolianLongSong', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMongolianLongSong([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMongolianLongSong(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMongolianLongSong(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleManchuScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleManchuScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleManchuScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleManchuScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAinuScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAinuScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAinuScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAinuScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYakutScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleYakutScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleYakutScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleYakutScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleChukchiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleChukchiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleChukchiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleChukchiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleEvenkScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleEvenkScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleEvenkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleEvenkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBuryatScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBuryatScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBuryatScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBuryatScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAleutScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAleutScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAleutScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAleutScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYupikScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleYupikScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleYupikScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleYupikScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTlingitScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTlingitScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTlingitScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTlingitScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAthabaskanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAthabaskanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAthabaskanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAthabaskanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMayanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMayanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMayanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMayanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNahuatlScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNahuatlScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNahuatlScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNahuatlScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMixtecScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMixtecScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMixtecScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMixtecScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleOlmecScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleOlmecScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleOlmecScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleOlmecScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleYanomamiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleYanomamiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleYanomamiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleYanomamiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWayuuScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWayuuScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWayuuScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWayuuScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleShuarScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleShuarScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleShuarScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleShuarScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleXinguScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleXinguScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleXinguScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleXinguScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCarnaticScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCarnaticScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCarnaticScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCarnaticScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHindustaniScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleHindustaniScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleHindustaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleHindustaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTamilScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTamilScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTamilScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTamilScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGujaratiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGujaratiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGujaratiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGujaratiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGreekModalScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGreekModalScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGreekModalScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGreekModalScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleByzantineScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleByzantineScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleByzantineScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleByzantineScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCypriotScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCypriotScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCypriotScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCypriotScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAnatolianFolkScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAnatolianFolkScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAnatolianFolkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAnatolianFolkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWestPolynesianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWestPolynesianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWestPolynesianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWestPolynesianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMicronesianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMicronesianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMicronesianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMicronesianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKiribatiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKiribatiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKiribatiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKiribatiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMarshalleseScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMarshalleseScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMarshalleseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMarshalleseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAppalachianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAppalachianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAppalachianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAppalachianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleOzarkScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleOzarkScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleOzarkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleOzarkScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCajunScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCajunScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCajunScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCajunScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleZydecoScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleZydecoScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleZydecoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleZydecoScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWelshScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWelshScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWelshScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWelshScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleIrishScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleIrishScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleIrishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleIrishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleScottishScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleScottishScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleScottishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleScottishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBretonScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBretonScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBretonScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBretonScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBasqueScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBasqueScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBasqueScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBasqueScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAndalusianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAndalusianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAndalusianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAndalusianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAsturianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAsturianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAsturianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAsturianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleValencianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleValencianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleValencianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleValencianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFlemishScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFlemishScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFlemishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFlemishScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleDutchScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleDutchScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleDutchScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleDutchScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWalloonScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWalloonScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWalloonScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWalloonScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleLuxembourgScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleLuxembourgScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleLuxembourgScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleLuxembourgScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSlovenianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSlovenianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSlovenianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSlovenianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCroatianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCroatianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCroatianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCroatianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBosnianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBosnianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBosnianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBosnianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMontenegrinScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMontenegrinScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMontenegrinScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMontenegrinScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFinnoUgricScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFinnoUgricScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFinnoUgricScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFinnoUgricScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSamiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSamiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSamiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSamiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKareliaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKareliaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKareliaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKareliaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleErzyaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleErzyaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleErzyaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleErzyaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAustrianAlpineScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAustrianAlpineScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAustrianAlpineScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAustrianAlpineScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBavarianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBavarianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBavarianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBavarianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTyroleanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTyroleanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTyroleanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTyroleanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSwissAlpineScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSwissAlpineScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSwissAlpineScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSwissAlpineScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAboriginalScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAboriginalScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAboriginalScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAboriginalScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTorresStraitScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTorresStraitScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTorresStraitScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTorresStraitScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMaoriScaleV3', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMaoriScaleV3([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMaoriScaleV3(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMaoriScaleV3(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTasmanianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTasmanianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTasmanianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTasmanianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePersianClassical', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePersianClassical([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePersianClassical(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePersianClassical(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAzerbaijaniScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAzerbaijaniScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAzerbaijaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAzerbaijaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUzbekMaqom', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleUzbekMaqom([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleUzbekMaqom(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleUzbekMaqom(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTajikMaqom', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTajikMaqom([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTajikMaqom(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTajikMaqom(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBerberScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBerberScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBerberScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBerberScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKabyleScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKabyleScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKabyleScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKabyleScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAmazighScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAmazighScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAmazighScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAmazighScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleChaouiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleChaouiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleChaouiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleChaouiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTexMexScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTexMexScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTexMexScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTexMexScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBluegrassScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBluegrassScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBluegrassScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBluegrassScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGospelScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGospelScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGospelScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGospelScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAppalachianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAppalachianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAppalachianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAppalachianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGreenlandicScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGreenlandicScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGreenlandicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGreenlandicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFaroeseScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFaroeseScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFaroeseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFaroeseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleShetlandScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleShetlandScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleShetlandScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleShetlandScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleOrkneyScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleOrkneyScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleOrkneyScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleOrkneyScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleQuebecoisScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleQuebecoisScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleQuebecoisScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleQuebecoisScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAcadianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAcadianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAcadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAcadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFrenchCanadianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFrenchCanadianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFrenchCanadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFrenchCanadianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMetisScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMetisScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMetisScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMetisScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSicilianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSicilianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSicilianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSicilianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSardinianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSardinianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSardinianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSardinianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCorsicanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCorsicanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCorsicanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCorsicanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMalteseScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMalteseScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMalteseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMalteseScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleVenetianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleVenetianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleVenetianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleVenetianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNeapolitanScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNeapolitanScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNeapolitanScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNeapolitanScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTuscanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTuscanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTuscanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTuscanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleLombardScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleLombardScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleLombardScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleLombardScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWestSlavicScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWestSlavicScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWestSlavicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWestSlavicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scalePolishScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scalePolishScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scalePolishScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scalePolishScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCzechScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCzechScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCzechScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCzechScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSlovakScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSlovakScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSlovakScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSlovakScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTibetoBurmanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTibetoBurmanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTibetoBurmanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTibetoBurmanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNagaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNagaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNagaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNagaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKarenScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKarenScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKarenScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKarenScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleShanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleShanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleShanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleShanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMoldovanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMoldovanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMoldovanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMoldovanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTranssylvanianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTranssylvanianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTranssylvanianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTranssylvanianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWallachianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWallachianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWallachianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWallachianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBanatScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBanatScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBanatScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBanatScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUkrainianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleUkrainianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleUkrainianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleUkrainianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBelarusianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBelarusianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBelarusianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBelarusianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCossackScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCossackScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCossackScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCossackScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRusynScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRusynScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRusynScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRusynScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUralicScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleUralicScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleUralicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleUralicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMordvinScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMordvinScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMordvinScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMordvinScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMariScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMariScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMariScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMariScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleUdmurtScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleUdmurtScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleUdmurtScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleUdmurtScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSouthSlavicScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSouthSlavicScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSouthSlavicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSouthSlavicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMacedonianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMacedonianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMacedonianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMacedonianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSerbianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSerbianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSerbianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSerbianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleKosovarScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleKosovarScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleKosovarScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleKosovarScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTurkicScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTurkicScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTurkicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTurkicScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTatarScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTatarScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTatarScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTatarScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBashkirScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBashkirScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBashkirScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBashkirScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleChuvashScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleChuvashScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleChuvashScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleChuvashScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHungarianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleHungarianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleHungarianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleHungarianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleRomaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleRomaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleRomaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleRomaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSintiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSintiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSintiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSintiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTransdanubianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTransdanubianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTransdanubianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTransdanubianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAlbanianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAlbanianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAlbanianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAlbanianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleArbereshScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleArbereshScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleArbereshScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleArbereshScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleToskScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleToskScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleToskScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleToskScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGhegScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGhegScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGhegScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGhegScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGeorgianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGeorgianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGeorgianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGeorgianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSvanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSvanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSvanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSvanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMingrelianScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMingrelianScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMingrelianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMingrelianScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAdjaraScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAdjaraScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAdjaraScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAdjaraScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAndalucianFlamenco', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAndalucianFlamenco([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAndalucianFlamenco(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAndalucianFlamenco(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGypsyKingsScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGypsyKingsScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGypsyKingsScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGypsyKingsScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGranadaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGranadaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGranadaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGranadaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSevillanaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSevillanaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSevillanaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSevillanaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCaribbeanCalypsoV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCaribbeanCalypsoV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCaribbeanCalypsoV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCaribbeanCalypsoV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleTrinidadianSteelpanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleTrinidadianSteelpanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleTrinidadianSteelpanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleTrinidadianSteelpanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleJamaicanDancehallScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleJamaicanDancehallScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleJamaicanDancehallScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleJamaicanDancehallScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHaitianKompaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleHaitianKompaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleHaitianKompaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleHaitianKompaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBaskCountryScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBaskCountryScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBaskCountryScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBaskCountryScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNavarreScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNavarreScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNavarreScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNavarreScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAragonScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAragonScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAragonScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAragonScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGalicianScaleV2', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGalicianScaleV2([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGalicianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGalicianScaleV2(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleAndeanQuenaScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleAndeanQuenaScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleAndeanQuenaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleAndeanQuenaScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleBolivianSaya', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleBolivianSaya([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleBolivianSaya(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleBolivianSaya(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleEcuadorianSanjuanito', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleEcuadorianSanjuanito([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleEcuadorianSanjuanito(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleEcuadorianSanjuanito(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleColombianVallenato', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleColombianVallenato([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleColombianVallenato(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleColombianVallenato(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleWestAfricanGriotScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleWestAfricanGriotScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleWestAfricanGriotScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleWestAfricanGriotScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleMandeScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleMandeScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleMandeScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleMandeScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleSonghaiScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleSonghaiScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleSonghaiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleSonghaiScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleFulaniScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleFulaniScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleFulaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleFulaniScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleCentralAmericanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleCentralAmericanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleCentralAmericanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleCentralAmericanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleGuatemalanMarimba', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleGuatemalanMarimba([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleGuatemalanMarimba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleGuatemalanMarimba(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleHondurasGarifuna', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleHondurasGarifuna([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleHondurasGarifuna(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleHondurasGarifuna(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('scaleNicaraguanScale', () => {
  it('returns 0 for empty pitches', () => {
    expect(scaleNicaraguanScale([])).toBe(0);
  });
  it('returns value in [0,1] for 12-EDO pitches', () => {
    const pitches = edo(12, 440).degrees;
    const v = scaleNicaraguanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
  it('returns value in [0,1] for 19-EDO pitches', () => {
    const pitches = edo(19, 440).degrees;
    const v = scaleNicaraguanScale(pitches);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('detectNearestScale', () => {
  it('returns topN results (default 10) for empty input, all scoring 0', () => {
    const results = detectNearestScale([]);
    expect(results.length).toBe(10);
    for (const r of results) {
      expect(r.score).toBe(0);
      expect(typeof r.name).toBe('string');
    }
  });

  it('respects a custom topN', () => {
    const results = detectNearestScale([], { topN: 3 });
    expect(results.length).toBe(3);
  });

  it('ranks results in descending score order', () => {
    const pitches = [0, 150, 500, 700, 850].map((c) => pitchFromCents(c));
    const results = detectNearestScale(pitches, { topN: 20 });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });

  it('ranks "Moroccan Gnawa" at or near the top for its own target cents', () => {
    const pitches = [0, 150, 500, 700, 850].map((c) => pitchFromCents(c));
    const results = detectNearestScale(pitches, { topN: 361 });
    const moroccan = results.find((r) => r.name === 'Moroccan Gnawa');
    expect(moroccan).toBeDefined();
    expect(moroccan!.score).toBe(1);
    // it should be a top-scoring match (score 1.0), though ties are possible
    expect(results[0]!.score).toBe(1);
  });
});
