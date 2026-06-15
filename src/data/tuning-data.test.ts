import { describe, it, expect } from 'vitest';
import { loadTuningPreset, loadAll, type TuningPreset } from './tuning-data.js';
import {
  ALL_PRESETS,
  MAKAM_USSAK,
  SLENDRO_EXAMPLE,
  JUST_INTONATION_5L,
  getTuningById,
  rankChordsFromPreset,
  presetToScl,
  presetToMts,
} from './presets.js';
import { degreeToCents } from '../core/tuning.js';

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
