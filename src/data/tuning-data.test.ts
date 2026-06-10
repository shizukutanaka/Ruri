import { describe, it, expect } from 'vitest';
import { loadTuningPreset, loadAll, type TuningPreset } from './tuning-data.js';
import { ALL_PRESETS, MAKAM_USSAK, SLENDRO_EXAMPLE, JUST_INTONATION_5L } from './presets.js';
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
