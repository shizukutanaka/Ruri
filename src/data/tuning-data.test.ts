import { describe, it, expect } from 'vitest';
import { loadTuningPreset, loadAll, type TuningPreset } from './tuning-data.js';
import {
  ALL_PRESETS,
  MAKAM_USSAK,
  SLENDRO_EXAMPLE,
  JUST_INTONATION_5L,
  TWELVE_TET,
  PYTHAGOREAN_12,
  MEANTONE_QUARTER_COMMA,
  WERCKMEISTER_III,
  KIRNBERGER_III,
  BOHLEN_PIERCE_13,
  VALLOTTI,
  YOUNG_II,
  getTuningById,
  rankChordsFromPreset,
  presetToScl,
  presetToMts,
  presetChordProgression,
  presetToMtsAndSmf,
  rankPresetsByDistance,
  closestPreset,
  closestPresetTuning,
  allPresetReports,
  comparePresets,
} from './presets.js';
import { degreeToCents, equalTemperament12, edo } from '../core/tuning.js';
import { pitchToCents } from '../core/cents.js';
import { meantoneQuarterComma } from '../core/temperament.js';
import { harmonicSpectrum } from '../core/spectrum.js';

describe('all presets load and validate', () => {
  it('test_every_preset_builds_a_valid_tuning', () => {
    for (const p of ALL_PRESETS) {
      const t = loadTuningPreset(p);
      // trailing period degree (e.g. 2/1) is normalized out; root 1/1 is implied/kept
      expect(t.degrees.length).toBeGreaterThan(0);
      expect(t.degrees.length).toBeLessThanOrEqual(p.degrees.length + 1);
    }
  });

  it('test_measured_presets_carry_cultural_context', () => {
    for (const p of ALL_PRESETS.filter((x) => x.source === 'measured')) {
      expect(p.culturalContext || p.region).toBeTruthy();
    }
  });

  it('test_every_preset_has_one_example_disclaimer', () => {
    for (const p of ALL_PRESETS) {
      expect(p.note.length).toBeGreaterThan(0);
    }
  });
});

describe('provenance enforcement (CARE/OCAP)', () => {
  const base: TuningPreset = {
    id: 'x',
    name: 'x',
    referenceHz: 440,
    periodCents: 1200,
    degrees: [0, 700],
    source: 'theoretical',
    note: 'example',
    provenance: { citation: 'src', license: 'public-domain' },
  };

  it('test_missing_citation_throws', () => {
    expect(() => loadTuningPreset({ ...base, provenance: { citation: '', license: 'x' } })).toThrow(
      RangeError,
    );
  });

  it('test_missing_license_throws', () => {
    expect(() => loadTuningPreset({ ...base, provenance: { citation: 'c', license: '' } })).toThrow(
      RangeError,
    );
  });

  it('test_missing_note_throws', () => {
    expect(() => loadTuningPreset({ ...base, note: '' })).toThrow(RangeError);
  });

  it('test_measured_without_context_throws', () => {
    const { culturalContext, region, ...rest } = base;
    void culturalContext;
    void region;
    expect(() => loadTuningPreset({ ...rest, source: 'measured' })).toThrow(RangeError);
  });
});

describe('representation preserved + values correct', () => {
  it('test_just_intonation_keeps_ratios', () => {
    const t = loadTuningPreset(JUST_INTONATION_5L);
    // 3/2 just fifth = 701.955c, distinct from 12-TET 700c
    const fifthIdx = JUST_INTONATION_5L.degrees.indexOf('3/2');
    expect(degreeToCents(t, fifthIdx)).toBeCloseTo(701.955, 2);
  });

  it('test_makam_neutral_second_present', () => {
    const t = loadTuningPreset(MAKAM_USSAK);
    expect(degreeToCents(t, 1)).toBeCloseTo(181, 0); // neutral 2nd, between minor(100) and major(200)
  });

  it('test_slendro_octave_stretched_beyond_1200', () => {
    expect(SLENDRO_EXAMPLE.periodCents).toBeGreaterThan(1200);
    const t = loadTuningPreset(SLENDRO_EXAMPLE);
    expect(degreeToCents(t, 5)).toBeGreaterThan(1200); // wrap into stretched octave
  });
});

describe('attribution collection (NOTICE)', () => {
  it('test_loadAll_collects_attribution_per_preset', () => {
    const { tunings, attributions } = loadAll(ALL_PRESETS);
    expect(tunings.length).toBe(ALL_PRESETS.length);
    expect(attributions.length).toBe(ALL_PRESETS.length);
    expect(attributions.every((a) => a.includes('—'))).toBe(true);
  });
});

describe('degree normalization – withRoot branch', () => {
  const base: TuningPreset = {
    id: 'x',
    name: 'x',
    referenceHz: 440,
    periodCents: 1200,
    degrees: [0, 700],
    source: 'theoretical',
    note: 'example',
    provenance: { citation: 'src', license: 'public-domain' },
  };

  it('test_non_zero_first_degree_prepends_root', () => {
    // degrees[0]=200c → centsVals[0]≈200 → withRoot branch prepends cents(0) (line 72)
    const t = loadTuningPreset({ ...base, degrees: [200, 700] });
    expect(t.degrees.length).toBe(3); // [0c, 200c, 700c]
    expect(degreeToCents(t, 0)).toBeCloseTo(0, 10);
    expect(degreeToCents(t, 1)).toBeCloseTo(200, 10);
  });

  it('test_invalid_string_degree_throws', () => {
    // parseDegree: RATIO_RE.test('abc') = false → throw (line 42 true branch)
    expect(() => loadTuningPreset({ ...base, degrees: ['abc'] })).toThrow(RangeError);
  });

  it('test_integer_ratio_no_slash_is_valid', () => {
    // parseDegree('2'): spec.includes('/') = false → [n,d]=['2','1'] (line 43 false branch)
    // '2' = 2/1 = 1200c; with periodCents=1500 it stays within range.
    const t = loadTuningPreset({ ...base, periodCents: 1500, degrees: ['2'] });
    expect(t.degrees.length).toBeGreaterThan(0);
    expect(degreeToCents(t, 1)).toBeCloseTo(1200, 5);
  });
});

// Socratic Q36: getTuningById is the user-facing entry point — no named-constant import needed.
describe('getTuningById — discoverable preset lookup', () => {
  it('test_known_id_returns_tuning_system', () => {
    const t = getTuningById('12-tet');
    expect(t).toBeDefined();
    expect(t!.id).toBe('12-tet');
    expect(t!.degrees.length).toBe(12);
  });

  it('test_makam_ussak_accessible_by_id', () => {
    const t = getTuningById('makam-ussak-example');
    expect(t).toBeDefined();
    expect(degreeToCents(t!, 1)).toBeCloseTo(181, 0); // neutral second
  });

  it('test_slendro_accessible_by_id', () => {
    const t = getTuningById('slendro-example');
    expect(t).toBeDefined();
    expect(t!.periodCents).toBeGreaterThan(1200); // stretched pseudo-octave
  });

  it('test_unknown_id_returns_undefined', () => {
    expect(getTuningById('does-not-exist')).toBeUndefined();
  });

  it('test_all_preset_ids_are_discoverable', () => {
    // Every id in ALL_PRESETS resolves via getTuningById
    for (const preset of ALL_PRESETS) {
      const t = getTuningById(preset.id);
      expect(t).toBeDefined();
      expect(t!.id).toBe(preset.id);
    }
  });

  it('test_custom_preset_pool_can_be_supplied', () => {
    const custom = [MAKAM_USSAK];
    const found = getTuningById('makam-ussak-example', custom);
    expect(found).toBeDefined();
    const notFound = getTuningById('12-tet', custom);
    expect(notFound).toBeUndefined();
  });
});

// Q102 — rankChordsFromPreset: preset id → ranked chord array in one call
describe('rankChordsFromPreset (Q102)', () => {
  it('test_known_id_returns_ranked_chord_array', () => {
    const chords = rankChordsFromPreset('12-tet');
    expect(chords).toBeDefined();
    expect(Array.isArray(chords)).toBe(true);
    expect((chords as unknown[]).length).toBeGreaterThan(0);
  });

  it('test_unknown_id_returns_undefined', () => {
    expect(rankChordsFromPreset('does-not-exist')).toBeUndefined();
  });

  it('test_chords_sorted_ascending_by_score', () => {
    const chords = rankChordsFromPreset('12-tet');
    expect(chords).toBeDefined();
    for (let i = 1; i < chords!.length; i++) {
      expect(chords![i]!.score).toBeGreaterThanOrEqual(chords![i - 1]!.score);
    }
  });

  it('test_size_option_controls_chord_cardinality', () => {
    const triads = rankChordsFromPreset('12-tet', { size: 3 });
    const tetrads = rankChordsFromPreset('12-tet', { size: 4 });
    expect(triads).toBeDefined();
    expect(tetrads).toBeDefined();
    expect(triads![0]!.cents.length).toBe(3);
    expect(tetrads![0]!.cents.length).toBe(4);
  });

  it('test_limit_option_caps_result_count', () => {
    const chords = rankChordsFromPreset('just-5-limit', { limit: 3 });
    expect(chords).toBeDefined();
    expect((chords as unknown[]).length).toBeLessThanOrEqual(3);
  });

  it('test_just_intonation_best_triad_includes_degree_0', () => {
    const chords = rankChordsFromPreset('just-5-limit', { size: 3 });
    expect(chords).toBeDefined();
    // All ranked chords are rooted at degree 0
    expect(chords![0]!.degrees[0]).toBe(0);
  });

  it('test_each_preset_id_resolves_to_chords', () => {
    for (const preset of ALL_PRESETS) {
      const chords = rankChordsFromPreset(preset.id, { size: 3, limit: 5 });
      expect(chords).toBeDefined();
      expect((chords as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it('test_custom_preset_pool_can_be_supplied', () => {
    const custom = [JUST_INTONATION_5L];
    const found = rankChordsFromPreset('just-5-limit', { size: 3 }, custom);
    expect(found).toBeDefined();
    const notFound = rankChordsFromPreset('12-tet', { size: 3 }, custom);
    expect(notFound).toBeUndefined();
  });

  it('test_slendro_5_note_tuning_returns_chords', () => {
    // Sléndro has 5 degrees; triads (size=3) should still work
    const chords = rankChordsFromPreset('slendro-example', { size: 3 });
    expect(chords).toBeDefined();
    expect((chords as unknown[]).length).toBeGreaterThan(0);
  });
});

// Q108 — presetToScl: preset id → .scl text string in one call
describe('presetToScl (Q108)', () => {
  it('test_known_id_returns_scl_string', () => {
    const scl = presetToScl('12-tet');
    expect(typeof scl).toBe('string');
    expect(scl).toContain('12-tet');
  });

  it('test_unknown_id_returns_undefined', () => {
    expect(presetToScl('does-not-exist')).toBeUndefined();
  });

  it('test_scl_string_is_valid_scala_format', () => {
    const scl = presetToScl('just-5-limit');
    expect(scl).toBeDefined();
    // Scala .scl must start with "!" comment
    expect(scl!).toMatch(/^!/);
    // Must have a degree count line (a number)
    const lines = scl!.split('\n').filter((l) => !l.startsWith('!') && l.trim() !== '');
    const count = Number.parseInt(lines[1] as string, 10);
    expect(Number.isInteger(count)).toBe(true);
    expect(count).toBeGreaterThan(0);
  });

  it('test_makam_scl_contains_neutral_second_cents', () => {
    const scl = presetToScl('makam-ussak-example');
    expect(scl).toBeDefined();
    // ~181c neutral second should appear as cents in the .scl output
    expect(scl!).toContain('181.');
  });

  it('test_all_preset_ids_produce_scl', () => {
    for (const preset of ALL_PRESETS) {
      const scl = presetToScl(preset.id);
      expect(scl).toBeDefined();
      expect(typeof scl).toBe('string');
      expect((scl as string).length).toBeGreaterThan(0);
    }
  });

  it('test_custom_preset_pool_can_be_supplied', () => {
    const custom = [JUST_INTONATION_5L];
    const found = presetToScl('just-5-limit', custom);
    expect(found).toBeDefined();
    const notFound = presetToScl('12-tet', custom);
    expect(notFound).toBeUndefined();
  });
});

// Q109 — presetToMts: preset id → 408-byte MTS SysEx in one call
describe('presetToMts (Q109)', () => {
  it('test_known_id_returns_uint8array', () => {
    const mts = presetToMts('12-tet');
    expect(mts).toBeInstanceOf(Uint8Array);
    expect(mts!.length).toBe(408);
  });

  it('test_unknown_id_returns_undefined', () => {
    expect(presetToMts('does-not-exist')).toBeUndefined();
  });

  it('test_sysex_starts_with_f0_and_ends_with_f7', () => {
    const mts = presetToMts('just-5-limit');
    expect(mts).toBeDefined();
    expect(mts![0]).toBe(0xf0);
    expect(mts![407]).toBe(0xf7);
  });

  it('test_name_parameter_appears_in_sysex_header', () => {
    const mts = presetToMts('12-tet', 'MyTuning');
    expect(mts).toBeDefined();
    // The name occupies bytes 6..21 (16 bytes of ASCII). 'M' = 0x4D.
    expect(mts![6]).toBe('M'.charCodeAt(0));
    expect(mts![7]).toBe('y'.charCodeAt(0));
  });

  it('test_all_preset_ids_produce_mts', () => {
    for (const preset of ALL_PRESETS) {
      const mts = presetToMts(preset.id);
      expect(mts).toBeDefined();
      expect((mts as Uint8Array).length).toBe(408);
    }
  });

  it('test_custom_preset_pool_can_be_supplied', () => {
    const custom = [MAKAM_USSAK];
    const found = presetToMts('makam-ussak-example', undefined, undefined, custom);
    expect(found).toBeDefined();
    const notFound = presetToMts('12-tet', undefined, undefined, custom);
    expect(notFound).toBeUndefined();
  });
});

// Q126 — presetChordProgression: preset id → Chord[] in one call
describe('presetChordProgression (Q126)', () => {
  it('test_known_id_returns_chord_array', () => {
    const chords = presetChordProgression('12-tet', [0, 3, 4, 0], 440);
    expect(chords).toBeDefined();
    expect(Array.isArray(chords)).toBe(true);
    expect(chords!.length).toBe(4);
  });

  it('test_unknown_id_returns_undefined', () => {
    expect(presetChordProgression('does-not-exist', [0, 1, 2], 440)).toBeUndefined();
  });

  it('test_chord_count_matches_pattern_length', () => {
    const pattern = [0, 2, 4, 1, 3];
    const chords = presetChordProgression('just-5-limit', pattern, 261.63);
    expect(chords).toBeDefined();
    expect(chords!.length).toBe(pattern.length);
  });

  it('test_opts_size_controls_notes_per_chord', () => {
    // 12-tet has 12 degrees so size=4 tetrad is valid
    const chords = presetChordProgression('12-tet', [0, 3], 440, undefined, { size: 4 });
    expect(chords).toBeDefined();
    // Each chord has `size` intervals
    for (const chord of chords!) {
      expect(chord.intervals.length).toBe(4);
    }
  });

  it('test_spectrum_param_is_accepted_and_result_is_still_returned', () => {
    // spectrum is reserved; function must not throw and must still return chords
    const spectrum = harmonicSpectrum();
    const chords = presetChordProgression('12-tet', [0, 1, 2], 440, spectrum);
    expect(chords).toBeDefined();
    expect(chords!.length).toBe(3);
  });

  it('test_custom_preset_pool_can_be_supplied', () => {
    const custom = [JUST_INTONATION_5L];
    const found = presetChordProgression(
      'just-5-limit',
      [0, 2, 4],
      440,
      undefined,
      undefined,
      custom,
    );
    expect(found).toBeDefined();
    const notFound = presetChordProgression('12-tet', [0, 2, 4], 440, undefined, undefined, custom);
    expect(notFound).toBeUndefined();
  });
});

// Q143 — presetToMtsAndSmf: export a preset as both MTS SysEx and SMF in one call
describe('presetToMtsAndSmf (Q143)', () => {
  const rootHz = 261.63;
  const pattern = [0, 3, 4, 0];

  it('test_known_preset_returns_mts_and_smf', () => {
    const result = presetToMtsAndSmf('12-tet', pattern, rootHz);
    expect(result).toBeDefined();
    expect(result!.mts).toBeInstanceOf(Uint8Array);
    expect(result!.smf).toBeInstanceOf(Uint8Array);
  });

  it('test_mts_is_408_bytes', () => {
    const result = presetToMtsAndSmf('12-tet', pattern, rootHz);
    expect(result!.mts.length).toBe(408);
  });

  it('test_mts_has_sysex_framing', () => {
    const result = presetToMtsAndSmf('just-5-limit', pattern, rootHz);
    expect(result!.mts[0]).toBe(0xf0);
    expect(result!.mts[407]).toBe(0xf7);
  });

  it('test_smf_has_mthd_header', () => {
    const result = presetToMtsAndSmf('12-tet', pattern, rootHz);
    const smf = result!.smf;
    expect(String.fromCharCode(smf[0]!, smf[1]!, smf[2]!, smf[3]!)).toBe('MThd');
  });

  it('test_unknown_preset_returns_undefined', () => {
    const result = presetToMtsAndSmf('does-not-exist', pattern, rootHz);
    expect(result).toBeUndefined();
  });

  it('test_mts_matches_presetToMts_result', () => {
    const combined = presetToMtsAndSmf('12-tet', pattern, rootHz);
    const mtsOnly = presetToMts('12-tet');
    expect(combined!.mts).toEqual(mtsOnly);
  });
});

// Q149 — closestPreset: find the preset nearest to a given TuningSystem by tuning distance
describe('rankPresetsByDistance (Q168)', () => {
  it('test_returns_all_presets_ranked', () => {
    const t12 = equalTemperament12(440);
    const ranked = rankPresetsByDistance(t12);
    expect(ranked.length).toBe(ALL_PRESETS.length);
  });

  it('test_12tet_closest_to_itself', () => {
    const t12 = equalTemperament12(440);
    const ranked = rankPresetsByDistance(t12, [TWELVE_TET, MAKAM_USSAK]);
    expect(ranked[0]!.preset.id).toBe(TWELVE_TET.id);
  });

  it('test_sorted_ascending_by_distance', () => {
    const t12 = equalTemperament12(440);
    const ranked = rankPresetsByDistance(t12);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.distance).toBeGreaterThanOrEqual(ranked[i - 1]!.distance);
    }
  });

  it('test_distance_values_are_non_negative', () => {
    const t12 = equalTemperament12(440);
    const ranked = rankPresetsByDistance(t12);
    for (const entry of ranked) {
      expect(entry.distance).toBeGreaterThanOrEqual(0);
    }
  });

  it('test_empty_presets_returns_empty', () => {
    const t12 = equalTemperament12(440);
    expect(rankPresetsByDistance(t12, [])).toEqual([]);
  });

  it('test_custom_preset_pool_respected', () => {
    const t12 = equalTemperament12(440);
    const ranked = rankPresetsByDistance(t12, [SLENDRO_EXAMPLE, MAKAM_USSAK]);
    expect(ranked.length).toBe(2);
    expect([SLENDRO_EXAMPLE.id, MAKAM_USSAK.id]).toContain(ranked[0]!.preset.id);
  });
});

// Q173 — closestPresetTuning: return the TuningSystem of the closest preset
describe('historical temperament presets', () => {
  const centsOf = (p: typeof TWELVE_TET): number[] =>
    loadTuningPreset(p).degrees.map((d) => pitchToCents(d));

  it('test_pythagorean_degrees_are_all_3_limit_ratios', () => {
    // Defining property: every degree is a power of 3/2 reduced into the octave,
    // so numerator and denominator factor into 2s and 3s only.
    const only2and3 = (n: number): boolean => {
      let x = n;
      while (x % 2 === 0) x /= 2;
      while (x % 3 === 0) x /= 3;
      return x === 1;
    };
    const degrees = loadTuningPreset(PYTHAGOREAN_12).degrees;
    expect(degrees).toHaveLength(12);
    for (const d of degrees) {
      expect(d.kind).toBe('ratio'); // stored exactly, not as lossy cents
      if (d.kind === 'ratio') {
        expect(only2and3(d.ratio.num)).toBe(true);
        expect(only2and3(d.ratio.den)).toBe(true);
      }
    }
  });

  it('test_pythagorean_fifth_is_exactly_pure', () => {
    const fifth = loadTuningPreset(PYTHAGOREAN_12).degrees[7]!;
    expect(fifth.kind).toBe('ratio');
    if (fifth.kind === 'ratio') {
      expect(fifth.ratio.num).toBe(3);
      expect(fifth.ratio.den).toBe(2);
    }
  });

  it('test_quarter_comma_meantone_matches_library_construction', () => {
    // Oracle: the library builds this temperament from first principles.
    const built = meantoneQuarterComma(440, 12).degrees.map((d) => pitchToCents(d));
    const preset = centsOf(MEANTONE_QUARTER_COMMA);
    expect(preset).toHaveLength(built.length);
    preset.forEach((c, i) => expect(c).toBeCloseTo(built[i]!, 2));
  });

  it('test_meantone_and_kirnberger_iii_have_pure_major_third', () => {
    // Both are defined by a pure 5/4 (386.314c) major third above the tonic.
    const justThird = 1200 * Math.log2(5 / 4);
    expect(centsOf(MEANTONE_QUARTER_COMMA)[4]!).toBeCloseTo(justThird, 2);
    expect(centsOf(KIRNBERGER_III)[4]!).toBeCloseTo(justThird, 2);
  });

  it('test_werckmeister_iii_third_sits_between_just_and_12tet', () => {
    // Its defining compromise: sweeter than 12-TET's 400c, wider than just 386.3c.
    const third = centsOf(WERCKMEISTER_III)[4]!;
    expect(third).toBeCloseTo(390.225, 2);
    expect(third).toBeGreaterThan(1200 * Math.log2(5 / 4));
    expect(third).toBeLessThan(400);
  });

  it('test_bohlen_pierce_matches_13_equal_divisions_of_the_tritave', () => {
    // Oracle: identical to edo(13) over a 3/1 period. Exercises non-octave support.
    const tritave = 1200 * Math.log2(3);
    const built = edo(13, 440, tritave).degrees.map((d) => pitchToCents(d));
    const loaded = loadTuningPreset(BOHLEN_PIERCE_13);
    expect(loaded.periodCents).toBeCloseTo(tritave, 2);
    loaded.degrees.forEach((d, i) => expect(pitchToCents(d)).toBeCloseTo(built[i]!, 2));
  });

  it('test_all_new_presets_load_and_are_registered', () => {
    for (const p of [
      PYTHAGOREAN_12,
      MEANTONE_QUARTER_COMMA,
      WERCKMEISTER_III,
      KIRNBERGER_III,
      BOHLEN_PIERCE_13,
    ]) {
      expect(() => loadTuningPreset(p)).not.toThrow(); // provenance/note gates pass
      expect(p.source).toBe('theoretical'); // not measured → outside the CARE gate
      expect(p.provenance.citation.length).toBeGreaterThan(0);
      expect(ALL_PRESETS.some((x) => x.id === p.id)).toBe(true);
      expect(getTuningById(p.id)).toBeDefined();
    }
  });
});

// The two 1/6-comma well-temperaments. Both are derived from their
// construction, so the tests check the construction's defining properties
// rather than re-stating the cent values the code already computes.
describe('Vallotti and Young II — 1/6-comma circulating temperaments', () => {
  const PURE_FIFTH = 1200 * Math.log2(3 / 2);
  const PYTH_COMMA = 1200 * Math.log2(531441 / 524288);
  const NARROW_FIFTH = PURE_FIFTH - PYTH_COMMA / 6;

  /** The twelve fifths of a circulating temperament, in cents. */
  const fifths = (p: typeof VALLOTTI): number[] => {
    const c = loadTuningPreset(p).degrees.map((d) => pitchToCents(d));
    // Walk the circle of fifths through the twelve pitch classes.
    return Array.from({ length: 12 }, (_, i) => {
      const from = c[(i * 7) % 12]!;
      const to = c[((i + 1) * 7) % 12]!;
      return (((to - from) % 1200) + 1200) % 1200;
    });
  };

  it('test_both_close_the_circle_of_fifths_exactly', () => {
    // The defining property: twelve fifths span exactly seven octaves.
    for (const p of [VALLOTTI, YOUNG_II]) {
      const total = fifths(p).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(7 * 1200, 6);
    }
  });

  it('test_both_use_six_narrowed_and_six_pure_fifths', () => {
    for (const p of [VALLOTTI, YOUNG_II]) {
      const f = fifths(p);
      const narrowed = f.filter((x) => Math.abs(x - NARROW_FIFTH) < 1e-6);
      const pure = f.filter((x) => Math.abs(x - PURE_FIFTH) < 1e-6);
      expect(narrowed).toHaveLength(6);
      expect(pure).toHaveLength(6);
    }
  });

  it('test_the_narrowing_is_one_sixth_of_a_pythagorean_comma', () => {
    expect(NARROW_FIFTH).toBeCloseTo(698.045, 3);
    expect(PURE_FIFTH - NARROW_FIFTH).toBeCloseTo(PYTH_COMMA / 6, 9);
  });

  it('test_c_major_third_sits_between_just_and_equal', () => {
    // A well-temperament's point: better than 12-TET's 400c, not pure either.
    for (const p of [VALLOTTI, YOUNG_II]) {
      const third = pitchToCents(loadTuningPreset(p).degrees[4]!);
      expect(third).toBeCloseTo(392.18, 2);
      expect(third).toBeGreaterThan(1200 * Math.log2(5 / 4));
      expect(third).toBeLessThan(400);
    }
  });

  it('test_young_is_vallotti_shifted_one_fifth_sharpward', () => {
    // Same method, different placement: Vallotti favours the flat side (its
    // F-A third is the better one), Young the sharp side (its B-D#).
    const v = loadTuningPreset(VALLOTTI).degrees.map((d) => pitchToCents(d));
    const y = loadTuningPreset(YOUNG_II).degrees.map((d) => pitchToCents(d));
    const third = (c: number[], lo: number, hi: number): number =>
      (((c[hi]! - c[lo]!) % 1200) + 1200) % 1200;
    expect(third(v, 5, 9)).toBeLessThan(third(y, 5, 9)); // F-A
    expect(third(y, 11, 3)).toBeLessThan(third(v, 11, 3)); // B-D#
  });

  it('test_neither_is_equal_temperament_nor_pythagorean', () => {
    for (const p of [VALLOTTI, YOUNG_II]) {
      const c = loadTuningPreset(p).degrees.map((d) => pitchToCents(d));
      expect(c.some((x, i) => Math.abs(x - i * 100) > 1)).toBe(true);
      expect(fifths(p).every((f) => Math.abs(f - PURE_FIFTH) < 1e-6)).toBe(false);
    }
  });

  it('test_both_load_and_are_registered_with_provenance', () => {
    for (const p of [VALLOTTI, YOUNG_II]) {
      expect(() => loadTuningPreset(p)).not.toThrow();
      expect(p.source).toBe('theoretical');
      expect(p.provenance.citation.length).toBeGreaterThan(0);
      // The attribution dispute is recorded rather than silently resolved.
      expect(p.note.toLowerCase()).toContain('shift');
      expect(ALL_PRESETS.some((x) => x.id === p.id)).toBe(true);
      expect(getTuningById(p.id)).toBeDefined();
    }
  });
});

// Q149 — closestPreset: the preset nearest a given TuningSystem by tuning distance
describe('closestPreset (Q149)', () => {
  const t12 = equalTemperament12(440);

  it('test_12tet_is_its_own_closest_preset', () => {
    expect(closestPreset(t12)!.id).toBe(TWELVE_TET.id);
  });

  it('test_empty_pool_returns_undefined', () => {
    expect(closestPreset(t12, [])).toBeUndefined();
  });

  it('test_single_preset_pool_returns_that_preset', () => {
    expect(closestPreset(t12, [MAKAM_USSAK])!.id).toBe(MAKAM_USSAK.id);
  });

  it('test_agrees_with_the_head_of_rankPresetsByDistance', () => {
    const t19 = edo(19, 440);
    expect(closestPreset(t19)!.id).toBe(rankPresetsByDistance(t19)[0]!.preset.id);
  });

  it('test_custom_pool_is_respected', () => {
    const pool = [SLENDRO_EXAMPLE, MAKAM_USSAK];
    expect(pool.map((p) => p.id)).toContain(closestPreset(t12, pool)!.id);
  });
});

// Q173 — closestPresetTuning: the loaded TuningSystem of the closest preset
describe('closestPresetTuning (Q173)', () => {
  const t12 = equalTemperament12(440);

  it('test_returns_the_tuning_of_the_closest_preset', () => {
    const tuning = closestPresetTuning(t12)!;
    expect(tuning.id).toBe(loadTuningPreset(closestPreset(t12)!).id);
  });

  it('test_12tet_recovers_twelve_equal_steps', () => {
    const tuning = closestPresetTuning(t12, [TWELVE_TET, MAKAM_USSAK])!;
    const cents = tuning.degrees.map((d) => pitchToCents(d));
    expect(cents.length).toBe(12);
    expect(cents[7]!).toBeCloseTo(700, 6);
  });

  it('test_empty_pool_returns_undefined', () => {
    expect(closestPresetTuning(t12, [])).toBeUndefined();
  });
});

// Q207 — allPresetReports: a tuning report for every preset in one call
describe('allPresetReports (Q207)', () => {
  it('test_one_report_per_preset_in_pool_order', () => {
    const pool = [TWELVE_TET, PYTHAGOREAN_12, WERCKMEISTER_III];
    const reports = allPresetReports(261.63, undefined, pool);
    expect(reports.map((r) => r.preset.id)).toEqual(pool.map((p) => p.id));
  });

  it('test_each_report_carries_a_best_mode', () => {
    for (const { report } of allPresetReports(261.63, undefined, [TWELVE_TET, KIRNBERGER_III])) {
      expect(Number.isFinite(report.bestMode.harmonicity)).toBe(true);
    }
  });

  it('test_spectrum_is_threaded_through_to_the_reports', () => {
    const pool = [WERCKMEISTER_III];
    const plain = allPresetReports(261.63, undefined, pool)[0]!.report;
    const timbred = allPresetReports(261.63, harmonicSpectrum(6), pool)[0]!.report;
    // The tuning identity is spectrum-independent; the harmonicity profile is a pure
    // property of the interval set, so both must agree regardless of timbre.
    expect(plain.id).toBe(timbred.id);
    expect(plain.harmonicityProfile).toEqual(timbred.harmonicityProfile);
  });

  it('test_empty_pool_returns_empty', () => {
    expect(allPresetReports(261.63, undefined, [])).toEqual([]);
  });
});

// Q222 — comparePresets: compare two presets by id in one call
describe('comparePresets (Q222)', () => {
  it('test_resolves_both_ids_and_returns_a_comparison', () => {
    const result = comparePresets(TWELVE_TET.id, PYTHAGOREAN_12.id)!;
    expect(result.a.id).toBe(TWELVE_TET.id);
    expect(result.b.id).toBe(PYTHAGOREAN_12.id);
    expect(Number.isFinite(result.comparison.harmonicityDistanceDiff)).toBe(true);
  });

  it('test_a_preset_compared_with_itself_correlates_perfectly', () => {
    // Uses an unequal preset: an equal temperament has a constant harmonicity profile,
    // so its Pearson correlation is undefined (NaN) rather than 1.
    const result = comparePresets(JUST_INTONATION_5L.id, JUST_INTONATION_5L.id)!;
    expect(result.comparison.correlation).toBeCloseTo(1, 6);
    expect(result.comparison.harmonicityDistanceDiff).toBeCloseTo(0, 9);
  });

  it('test_correlation_is_nan_when_either_side_is_an_equal_temperament', () => {
    const result = comparePresets(TWELVE_TET.id, PYTHAGOREAN_12.id)!;
    expect(Number.isNaN(result.comparison.correlation)).toBe(true);
  });

  it('test_unknown_id_returns_undefined', () => {
    expect(comparePresets('no-such-preset', TWELVE_TET.id)).toBeUndefined();
    expect(comparePresets(TWELVE_TET.id, 'no-such-preset')).toBeUndefined();
  });

  it('test_rootHz_defaults_to_440', () => {
    const explicit = comparePresets(JUST_INTONATION_5L.id, PYTHAGOREAN_12.id, 440)!;
    const implicit = comparePresets(JUST_INTONATION_5L.id, PYTHAGOREAN_12.id)!;
    expect(implicit.comparison.correlation).toBeCloseTo(explicit.comparison.correlation, 12);
    expect(implicit.comparison.a.bestMode.harmonicity).toBe(
      explicit.comparison.a.bestMode.harmonicity,
    );
  });

  it('test_ids_outside_the_custom_pool_are_not_found', () => {
    expect(
      comparePresets(TWELVE_TET.id, PYTHAGOREAN_12.id, 440, undefined, [TWELVE_TET]),
    ).toBeUndefined();
  });
});
