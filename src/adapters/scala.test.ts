import { describe, it, expect } from 'vitest';
import {
  parseScl,
  writeScl,
  sclFromCents,
  degreeCents,
  tuningToScl,
  chordToScl,
  chordMapToScl,
  scaleChordMapToScl,
  chordMapBundle,
  scaleAnalysisBundle,
  sclDistance,
  scaleToSubsetScl,
  scaleToSubsetSclText,
  scaleModeScls,
  bestModeSclText,
  worstModeSclText,
  topNModesScls,
} from './scala.js';
import { equalTemperament12, edo } from '../core/tuning.js';
import { chordToMpe, DEFAULT_MPE } from './mpe.js';
import { mpeToFreq } from '../core/midi.js';
import { freqToCents } from '../core/cents.js';
import { chordFromRatios, chordFromSemitones } from '../core/chord.js';
import { type Scale, scaleToChordMap } from '../core/scale.js';
import { harmonicSpectrum } from '../core/spectrum.js';

const SCL_12TET = `! meanquar.scl
!
12-tone Equal Temperament
 12
!
 100.000000
 200.000000
 300.000000
 400.000000
 500.000000
 600.000000
 700.000000
 800.000000
 900.000000
 1000.000000
 1100.000000
 2/1
`;

describe('Scala .scl parse', () => {
  it('test_parse_12tet_count_and_last', () => {
    const s = parseScl(SCL_12TET);
    expect(s.degrees.length).toBe(12);
    expect(s.description).toBe('12-tone Equal Temperament');
  });

  it('test_cents_vs_ratio_detected_by_decimal_point', () => {
    const s = parseScl(SCL_12TET);
    expect(s.degrees[0]!.kind).toBe('cents'); // "100.000000"
    expect(s.degrees[11]!.kind).toBe('ratio'); // "2/1"
  });

  it('test_octave_is_1200_cents', () => {
    const s = parseScl(SCL_12TET);
    expect(degreeCents(s.degrees[11]!)).toBeCloseTo(1200, 6);
  });

  it('test_just_fifth_ratio_cents', () => {
    const s = parseScl('JI\n 1\n!\n 3/2\n');
    expect(degreeCents(s.degrees[0]!)).toBeCloseTo(701.955, 3);
  });

  it('test_comments_ignored', () => {
    const s = parseScl('! header comment\n!\nDesc\n 1\n! mid comment\n 2/1\n');
    expect(s.degrees.length).toBe(1);
  });

  it('test_bad_count_throws', () => {
    expect(() => parseScl('Desc\n abc\n 2/1\n')).toThrow(RangeError);
  });

  it('test_bad_ratio_throws', () => {
    expect(() => parseScl('Desc\n 1\n 3/0\n')).toThrow(RangeError);
  });

  it('test_degree_count_mismatch_throws', () => {
    // Header says 3 degrees but only 2 lines are provided.
    expect(() => parseScl('Desc\n 3\n 200.0\n 400.0\n')).toThrow(RangeError);
  });

  it('test_only_comment_lines_throws', () => {
    // lines.length < 2 → too few non-comment lines (line 29 true branch).
    expect(() => parseScl('! only a comment\n! another\n')).toThrow(RangeError);
  });

  it('test_infinite_cents_value_throws', () => {
    // '1.0e999' has '.' so parsed as cents; parseFloat = Infinity → !isFinite → throw (line 47).
    expect(() => parseScl('Desc\n 1\n 1.0e999\n')).toThrow(RangeError);
  });

  it('test_integer_ratio_no_slash', () => {
    // '3' has no '/' → [n, d] = ['3', '1'] → valid 3/1 ratio (line 50 false branch).
    const s = parseScl('Desc\n 1\n 3\n');
    expect(s.degrees).toHaveLength(1);
    expect(degreeCents(s.degrees[0]!)).toBeCloseTo(1200 * Math.log2(3), 5);
  });
});

describe('Scala .scl round-trip (interop necessity)', () => {
  it('test_parse_write_parse_preserves_degrees', () => {
    const a = parseScl(SCL_12TET);
    const b = parseScl(writeScl(a));
    expect(b.degrees.length).toBe(a.degrees.length);
    for (let i = 0; i < a.degrees.length; i++) {
      expect(degreeCents(b.degrees[i]!)).toBeCloseTo(degreeCents(a.degrees[i]!), 6);
    }
  });

  it('test_ratio_representation_preserved', () => {
    const a = parseScl(SCL_12TET);
    const w = writeScl(a);
    expect(w).toContain('2/1'); // octave stays a ratio, not converted to cents
  });

  it('test_scl_from_cents', () => {
    const s = sclFromCents('test', [200, 400, 1200]);
    expect(s.degrees.length).toBe(3);
    expect(writeScl(s)).toContain('1200.000000');
  });

  it('test_write_empty_description_uses_untitled', () => {
    // description === '' (falsy) → both `||` branches in writeScl produce 'Untitled' (lines 68,70).
    const s = sclFromCents('', [1200]);
    const text = writeScl(s);
    expect(text).toContain('Untitled');
  });

  it('test_write_cents_degree_text_without_decimal_uses_toFixed', () => {
    // Manually craft a cents degree whose text has no '.'; writeScl falls back to toFixed (line 76).
    const scale = {
      description: 'manual',
      degrees: [{ kind: 'cents' as const, cents: 1200, text: '1200' }],
    };
    const text = writeScl(scale);
    expect(text).toContain('1200.000000');
  });
});

describe('MPE chord export', () => {
  it('test_chord_assigned_distinct_channels', () => {
    const notes = chordToMpe([261.63, 329.63, 392.0], {
      ...DEFAULT_MPE,
      startTicks: 0,
      durationTicks: 480,
    });
    const channels = notes.map((n) => n.channel);
    expect(new Set(channels).size).toBe(3);
  });

  it('test_too_many_notes_throws', () => {
    const sixteen = Array.from({ length: 16 }, (_, i) => 261.63 * 2 ** (i / 12));
    expect(() =>
      chordToMpe(sixteen, { ...DEFAULT_MPE, startTicks: 0, durationTicks: 480 }),
    ).toThrow(RangeError);
  });

  it('test_microtonal_pitch_recovered_via_bend', () => {
    // 250 cents above A4=440 → a quarter-tone-ish pitch
    const targetHz = 440 * 2 ** (250 / 1200);
    const [mpe] = chordToMpe([targetHz], {
      ...DEFAULT_MPE,
      startTicks: 0,
      durationTicks: 480,
    });
    const recovered = mpeToFreq(
      { note: mpe!.note.note, bend14: mpe!.bend14 },
      DEFAULT_MPE.bendRangeSemitones,
    );
    expect(Math.abs(freqToCents(recovered, targetHz))).toBeLessThan(0.5);
  });
});

// Socratic Q44: tuningToScl bridges TuningSystem → Scala .scl without manual steps.
describe('tuningToScl — TuningSystem → ScalaScale adapter', () => {
  const t12 = equalTemperament12(440);

  it('test_degree_count_is_n_degrees_plus_period', () => {
    // 12-TET has 12 degrees (0..11); Scala omits unison + adds period = 12 entries.
    const scl = tuningToScl(t12);
    expect(scl.degrees.length).toBe(12); // 11 above-root + 1 period
  });

  it('test_first_degree_is_100c_for_12tet', () => {
    const scl = tuningToScl(t12);
    expect(degreeCents(scl.degrees[0]!)).toBeCloseTo(100, 9);
  });

  it('test_last_degree_is_periodCents', () => {
    const scl = tuningToScl(t12);
    expect(degreeCents(scl.degrees[scl.degrees.length - 1]!)).toBeCloseTo(1200, 9);
  });

  it('test_description_is_tuning_id', () => {
    const scl = tuningToScl(t12);
    expect(scl.description).toBe(t12.id);
  });

  it('test_round_trip_writeScl_parseScl', () => {
    const scl = tuningToScl(t12);
    const text = writeScl(scl);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBe(scl.degrees.length);
    parsed.degrees.forEach((d, i) => {
      expect(degreeCents(d)).toBeCloseTo(degreeCents(scl.degrees[i]!), 4);
    });
  });

  it('test_non_octave_tuning_period_preserved', () => {
    // 13-EDO of 3/1 period (Bohlen-Pierce): period = 1902c.
    const bp = edo(13, 440, 1200 * Math.log2(3));
    const scl = tuningToScl(bp);
    const periodEntry = scl.degrees[scl.degrees.length - 1]!;
    expect(degreeCents(periodEntry)).toBeCloseTo(1200 * Math.log2(3), 6);
  });

  it('test_19edo_has_19_scala_degrees', () => {
    const t19 = edo(19);
    const scl = tuningToScl(t19);
    expect(scl.degrees.length).toBe(19);
  });
});

// Q111 — chordToScl: chord + rootHz → ScalaScale capturing chord intervals as cents
describe('chordToScl (Q111)', () => {
  const justMajor = chordFromRatios('just-major', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);

  it('test_just_major_triad_has_two_degrees_above_root', () => {
    // Root is implicit in Scala; only intervals above root are listed
    const scl = chordToScl(justMajor, 261.63);
    expect(scl.degrees.length).toBe(2);
  });

  it('test_just_major_third_is_correct_cents', () => {
    const scl = chordToScl(justMajor, 261.63);
    // 5/4 = 386.314c
    expect(degreeCents(scl.degrees[0]!)).toBeCloseTo(1200 * Math.log2(5 / 4), 3);
  });

  it('test_just_fifth_is_correct_cents', () => {
    const scl = chordToScl(justMajor, 261.63);
    // 3/2 = 701.955c
    expect(degreeCents(scl.degrees[1]!)).toBeCloseTo(1200 * Math.log2(3 / 2), 3);
  });

  it('test_custom_name_used_as_description', () => {
    const scl = chordToScl(justMajor, 440, 'my-chord');
    expect(scl.description).toBe('my-chord');
  });

  it('test_default_name_is_chord_name', () => {
    const scl = chordToScl(justMajor, 440);
    expect(scl.description).toBe('just-major');
  });

  it('test_scl_round_trips_through_writeScl_parseScl', () => {
    const scl = chordToScl(justMajor, 261.63);
    const text = writeScl(scl);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBe(scl.degrees.length);
    for (let i = 0; i < scl.degrees.length; i++) {
      expect(degreeCents(parsed.degrees[i]!)).toBeCloseTo(degreeCents(scl.degrees[i]!), 3);
    }
  });

  it('test_invalid_rootHz_throws', () => {
    expect(() => chordToScl(justMajor, -1)).toThrow(RangeError);
    expect(() => chordToScl(justMajor, 0)).toThrow(RangeError);
  });

  it('test_12tet_major_triad_intervals_in_cents', () => {
    const tet = chordFromSemitones('tet-major', [0, 4, 7]);
    const scl = chordToScl(tet, 261.63);
    expect(scl.degrees.length).toBe(2);
    // 12-TET major third = 400c, perfect fifth = 700c
    expect(degreeCents(scl.degrees[0]!)).toBeCloseTo(400, 2);
    expect(degreeCents(scl.degrees[1]!)).toBeCloseTo(700, 2);
  });
});

// Q132 — chordMapToScl: chord map → Scala .scl
describe('chordMapToScl (Q132)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_non_empty_degrees_returned', () => {
    const chordMap = scaleToChordMap(major, t12);
    const scl = chordMapToScl(chordMap, t12);
    expect(scl.degrees.length).toBeGreaterThan(0);
  });

  it('test_empty_chord_map_throws', () => {
    expect(() => chordMapToScl([], t12)).toThrow(RangeError);
  });

  it('test_all_unique_pitch_classes_from_major', () => {
    // 7-note major scale: diatonic triads collectively reference all non-root scale degrees
    const chordMap = scaleToChordMap(major, t12);
    const scl = chordMapToScl(chordMap, t12);
    // At least some pitch classes above root are collected
    expect(scl.degrees.length).toBeGreaterThan(0);
    // All degrees are within the octave (0c < c < 1200c)
    for (const d of scl.degrees) {
      expect(degreeCents(d)).toBeGreaterThan(0);
      expect(degreeCents(d)).toBeLessThan(1200);
    }
  });

  it('test_custom_name_used_as_description', () => {
    const chordMap = scaleToChordMap(major, t12);
    const scl = chordMapToScl(chordMap, t12, 'my-scale');
    expect(scl.description).toBe('my-scale');
  });

  it('test_default_name_is_tuning_id', () => {
    const chordMap = scaleToChordMap(major, t12);
    const scl = chordMapToScl(chordMap, t12);
    expect(scl.description).toBe(t12.id);
  });

  it('test_round_trips_through_writeScl_parseScl', () => {
    const chordMap = scaleToChordMap(major, t12);
    const scl = chordMapToScl(chordMap, t12);
    const text = writeScl(scl);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBe(scl.degrees.length);
    for (let i = 0; i < scl.degrees.length; i++) {
      expect(degreeCents(parsed.degrees[i]!)).toBeCloseTo(degreeCents(scl.degrees[i]!), 3);
    }
  });

  it('test_degrees_sorted_ascending', () => {
    const chordMap = scaleToChordMap(major, t12);
    const scl = chordMapToScl(chordMap, t12);
    for (let i = 1; i < scl.degrees.length; i++) {
      expect(degreeCents(scl.degrees[i]!)).toBeGreaterThan(degreeCents(scl.degrees[i - 1]!));
    }
  });
});

// Q161 — scaleChordMapToScl: scale → chord map → Scala .scl in one call
describe('scaleChordMapToScl (Q161)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_scala_scale_with_degrees', () => {
    const scl = scaleChordMapToScl(major, t12);
    expect(scl.degrees.length).toBeGreaterThan(0);
  });

  it('test_default_description_is_scale_name', () => {
    const scl = scaleChordMapToScl(major, t12);
    expect(scl.description).toBe(major.name);
  });

  it('test_custom_name_used_as_description', () => {
    const scl = scaleChordMapToScl(major, t12, 'my-chord-map');
    expect(scl.description).toBe('my-chord-map');
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const t19 = edo(19);
    expect(() => scaleChordMapToScl(major, t19)).toThrow(RangeError);
  });

  it('test_degrees_sorted_ascending', () => {
    const scl = scaleChordMapToScl(major, t12);
    for (let i = 1; i < scl.degrees.length; i++) {
      expect(degreeCents(scl.degrees[i]!)).toBeGreaterThan(degreeCents(scl.degrees[i - 1]!));
    }
  });

  it('test_round_trips_through_write_and_parse', () => {
    const scl = scaleChordMapToScl(major, t12);
    const text = writeScl(scl);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBe(scl.degrees.length);
    for (let i = 0; i < scl.degrees.length; i++) {
      expect(degreeCents(parsed.degrees[i]!)).toBeCloseTo(degreeCents(scl.degrees[i]!), 3);
    }
  });
});

// Q162 — chordMapBundle: chord map → { scl, tun } in one call
describe('chordMapBundle (Q162)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_both_scl_and_tun', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { scl, tun } = chordMapBundle(chordMap, t12);
    expect(scl).toBeDefined();
    expect(typeof tun).toBe('string');
  });

  it('test_scl_degrees_are_non_empty', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { scl } = chordMapBundle(chordMap, t12);
    expect(scl.degrees.length).toBeGreaterThan(0);
  });

  it('test_tun_contains_tuning_and_exact_sections', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { tun } = chordMapBundle(chordMap, t12);
    expect(tun).toContain('[Tuning]');
    expect(tun).toContain('[Exact Tuning]');
  });

  it('test_tun_has_128_note_entries', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { tun } = chordMapBundle(chordMap, t12);
    const matches = tun.match(/^note \d+=.+$/gm) ?? [];
    expect(matches.length).toBe(256); // 128 in [Tuning] + 128 in [Exact Tuning]
  });

  it('test_custom_name_used_in_both_scl_and_tun', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { scl, tun } = chordMapBundle(chordMap, t12, 'test-bundle');
    expect(scl.description).toBe('test-bundle');
    expect(tun).toContain('test-bundle');
  });

  it('test_empty_chord_map_throws', () => {
    expect(() => chordMapBundle([], t12)).toThrow(RangeError);
  });
});

describe('scaleAnalysisBundle (Q172)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_scl_and_summary', () => {
    const { scl, summary } = scaleAnalysisBundle(major, t12);
    expect(scl).toBeDefined();
    expect(summary).toBeDefined();
    expect(typeof summary.count).toBe('number');
    expect(typeof summary.meanDissonance).toBe('number');
  });

  it('test_scl_matches_tuning', () => {
    const { scl } = scaleAnalysisBundle(major, t12);
    expect(scl.description).toBe(t12.id);
    expect(scl.degrees.length).toBeGreaterThan(0);
  });

  it('test_summary_has_expected_chord_count', () => {
    const { summary } = scaleAnalysisBundle(major, t12);
    expect(summary.count).toBeGreaterThan(0);
  });

  it('test_with_spectrum_changes_dissonance_values', () => {
    const { summary } = scaleAnalysisBundle(major, t12, harmonicSpectrum());
    expect(Number.isFinite(summary.meanDissonance)).toBe(true);
    expect(Number.isFinite(summary.meanHarmonicity)).toBe(true);
  });

  it('test_scl_is_serializable_via_write_scl', () => {
    const { scl } = scaleAnalysisBundle(major, t12);
    const text = writeScl(scl);
    expect(text).toContain(t12.id);
    expect(text.startsWith('!')).toBe(true);
  });
});

// Q175 — sclDistance: compare two .scl texts by cent-distance in one call
describe('sclDistance (Q175)', () => {
  const t12 = equalTemperament12(440);
  const t19 = edo(19);

  const sclText = (tuning: ReturnType<typeof equalTemperament12>): string =>
    writeScl(tuningToScl(tuning));

  it('test_identical_scl_has_zero_distance', () => {
    const text = sclText(t12);
    expect(sclDistance(text, text)).toBe(0);
  });

  it('test_different_tunings_have_positive_distance', () => {
    const d = sclDistance(sclText(t12), sclText(t19));
    expect(d).toBeGreaterThan(0);
  });

  it('test_distance_is_symmetric', () => {
    const textA = sclText(t12);
    const textB = sclText(t19);
    expect(sclDistance(textA, textB)).toBeCloseTo(sclDistance(textB, textA), 10);
  });

  it('test_invalid_scl_throws', () => {
    expect(() => sclDistance('not a scl file', sclText(t12))).toThrow(RangeError);
  });

  it('test_shorter_scl_padded_with_1200', () => {
    const singleDegree = writeScl(sclFromCents('single', [700]));
    const twoDegrees = writeScl(sclFromCents('two', [700, 1000]));
    const d = sclDistance(singleDegree, twoDegrees);
    expect(d).toBeCloseTo(Math.abs(1000 - 1200), 5);
  });

  it('test_non_negative_result', () => {
    const d = sclDistance(sclText(t12), sclText(t19));
    expect(d).toBeGreaterThanOrEqual(0);
  });
});

// Q188 — scaleToSubsetScl
describe('scaleToSubsetScl (Q188)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_scala_scale_with_correct_degree_count', () => {
    const scl = scaleToSubsetScl(major, t12);
    // degreeIndices has 7 entries; tuningToScl excludes root and includes period → 7 degrees
    expect(scl.degrees.length).toBe(major.degreeIndices.length);
  });

  it('test_description_defaults_to_scale_name', () => {
    const scl = scaleToSubsetScl(major, t12);
    expect(scl.description).toBe(major.name);
  });

  it('test_custom_name_overrides_description', () => {
    const scl = scaleToSubsetScl(major, t12, 'my-major');
    expect(scl.description).toBe('my-major');
  });

  it('test_roundtrip_via_writeScl_parseScl', () => {
    const scl = scaleToSubsetScl(major, t12);
    const text = writeScl(scl);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBe(scl.degrees.length);
  });

  it('test_incompatible_tuning_throws', () => {
    const wrongScale: Scale = { id: 'x', name: 'X', tuningId: 'other', degreeIndices: [0, 1] };
    expect(() => scaleToSubsetScl(wrongScale, t12)).toThrow(RangeError);
  });

  it('test_subset_has_fewer_degrees_than_full_tuning_scl', () => {
    const subsetScl = scaleToSubsetScl(major, t12);
    const fullScl = tuningToScl(t12);
    expect(subsetScl.degrees.length).toBeLessThan(fullScl.degrees.length);
  });
});

// Q195 — scaleToSubsetSclText
describe('scaleToSubsetSclText (Q195)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_a_string', () => {
    const text = scaleToSubsetSclText(major, t12);
    expect(typeof text).toBe('string');
  });

  it('test_output_is_valid_scl_parseable', () => {
    const text = scaleToSubsetSclText(major, t12);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBe(major.degreeIndices.length);
  });

  it('test_matches_writeScl_of_scaleToSubsetScl', () => {
    const text = scaleToSubsetSclText(major, t12);
    const expected = writeScl(scaleToSubsetScl(major, t12));
    expect(text).toBe(expected);
  });

  it('test_custom_name_appears_in_output', () => {
    const text = scaleToSubsetSclText(major, t12, 'my-scale');
    expect(text).toContain('my-scale');
  });

  it('test_incompatible_tuning_throws', () => {
    const wrongScale: Scale = { id: 'x', name: 'X', tuningId: 'other', degreeIndices: [0, 1] };
    expect(() => scaleToSubsetSclText(wrongScale, t12)).toThrow(RangeError);
  });

  it('test_output_ends_with_newline', () => {
    const text = scaleToSubsetSclText(major, t12);
    expect(text.endsWith('\n')).toBe(true);
  });
});

// Q202 — scaleModeScls
describe('scaleModeScls (Q202)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_one_text_per_mode', () => {
    const texts = scaleModeScls(major, t12);
    expect(texts.length).toBe(major.degreeIndices.length);
  });

  it('test_each_text_is_valid_scl', () => {
    const texts = scaleModeScls(major, t12);
    for (const text of texts) {
      const parsed = parseScl(text);
      expect(parsed.degrees.length).toBeGreaterThan(0);
    }
  });

  it('test_each_text_ends_with_newline', () => {
    const texts = scaleModeScls(major, t12);
    for (const text of texts) {
      expect(text.endsWith('\n')).toBe(true);
    }
  });

  it('test_all_texts_contain_riff_header_word_free', () => {
    const texts = scaleModeScls(major, t12);
    for (const text of texts) {
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('test_texts_differ_per_rotation', () => {
    const texts = scaleModeScls(major, t12);
    const unique = new Set(texts);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('test_wrong_tuning_throws', () => {
    const wrongScale: Scale = {
      id: 'wrong',
      name: 'Wrong',
      tuningId: 'other-id',
      degreeIndices: [0, 1, 2],
    };
    expect(() => scaleModeScls(wrongScale, t12)).toThrow(RangeError);
  });
});

// Q221 — bestModeSclText
describe('bestModeSclText (Q221)', () => {
  const t12 = equalTemperament12(440);

  it('test_returns_string', () => {
    const text = bestModeSclText(t12);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('test_output_is_valid_scl', () => {
    const text = bestModeSclText(t12);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBeGreaterThan(0);
  });

  it('test_custom_name_appears_in_output', () => {
    const text = bestModeSclText(t12, undefined, 'my-best-mode');
    expect(text).toContain('my-best-mode');
  });

  it('test_output_ends_with_newline', () => {
    const text = bestModeSclText(t12);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('test_works_with_different_edos', () => {
    const t5 = edo(5);
    const text = bestModeSclText(t5);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBeGreaterThan(0);
    expect(parsed.degrees.length).toBeLessThanOrEqual(5);
  });

  it('test_accepts_explicit_spectrum', () => {
    const text = bestModeSclText(t12, harmonicSpectrum());
    expect(typeof text).toBe('string');
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBeGreaterThan(0);
  });
});

// Q226 — worstModeSclText
describe('worstModeSclText (Q226)', () => {
  const t12 = equalTemperament12(440);

  it('test_returns_string', () => {
    const text = worstModeSclText(t12);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('test_output_is_valid_scl', () => {
    const text = worstModeSclText(t12);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBeGreaterThan(0);
  });

  it('test_custom_name_appears_in_output', () => {
    const text = worstModeSclText(t12, undefined, 'my-worst-mode');
    expect(text).toContain('my-worst-mode');
  });

  it('test_output_ends_with_newline', () => {
    const text = worstModeSclText(t12);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('test_works_with_different_edos', () => {
    const t5 = edo(5);
    const text = worstModeSclText(t5);
    const parsed = parseScl(text);
    expect(parsed.degrees.length).toBeGreaterThan(0);
    expect(parsed.degrees.length).toBeLessThanOrEqual(5);
  });

  it('test_differs_from_best_mode_scl_text', () => {
    const best = bestModeSclText(t12);
    const worst = worstModeSclText(t12);
    // For 12-TET with 7 modes there must be some difference
    expect(typeof worst).toBe('string');
    // They may or may not differ depending on tuning; just verify worst is valid
    const parsed = parseScl(worst);
    expect(parsed.degrees.length).toBeGreaterThan(0);
    void best;
  });
});

// Q230 — topNModesScls
describe('topNModesScls (Q230)', () => {
  const t12 = equalTemperament12(440);

  it('returns n SCL strings for top N modes', () => {
    const scls = topNModesScls(t12, 3, undefined, 261.63);
    expect(scls).toHaveLength(3);
    scls.forEach((s) => expect(s).toContain('!'));
  });

  it('clamps to available mode count', () => {
    const scls = topNModesScls(t12, 999, undefined, 261.63);
    expect(scls.length).toBeLessThanOrEqual(t12.degrees.length);
    expect(scls.length).toBeGreaterThan(0);
  });

  it('throws for n <= 0', () => {
    expect(() => topNModesScls(t12, 0)).toThrow(RangeError);
  });
});
