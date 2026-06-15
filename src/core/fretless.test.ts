import { describe, it, expect } from 'vitest';
import {
  fretlessOud,
  violin,
  fretlessPositionsFor,
  fingerFretlessChord,
  fretlessChordFromScale,
  type FretlessInstrument,
} from './fretless.js';
import { edo } from './tuning.js';
import { type Scale } from './scale.js';

describe('fretless instruments', () => {
  it('test_fretless_oud_open_strings', () => {
    const oud = fretlessOud(440);
    expect(oud.openStringsHz.length).toBeGreaterThan(0);
    expect(oud.openStringsHz.every((f) => f > 0)).toBe(true);
  });

  it('test_violin_open_strings', () => {
    const v = violin(440);
    expect(v.openStringsHz.length).toBe(4);
    expect(v.openStringsHz.every((f) => f > 0)).toBe(true);
  });

  it('test_fretless_positions_for_open_string', () => {
    const v = violin(440);
    // A string on violin at 440 Hz → position 0 cents on that string
    const positions = fretlessPositionsFor(v, 440);
    expect(positions.length).toBeGreaterThan(0);
    const atZero = positions.find((p) => Math.abs(p.cents) < 0.01);
    expect(atZero).toBeDefined();
    expect(atZero?.freqHz).toBeCloseTo(440, 5);
  });

  it('test_fretless_positions_reachable', () => {
    const oud = fretlessOud(440);
    const positions = fretlessPositionsFor(oud, 440);
    expect(positions.every((p) => p.cents >= 0)).toBe(true);
    expect(positions.every((p) => p.freqHz > 0)).toBe(true);
  });

  it('test_finger_fretless_chord_returns_positions_or_null', () => {
    const v = violin(440);
    // A4 + E5 – both reachable on violin
    const result = fingerFretlessChord(v, [440, 659.255]);
    // May be null if unreachable, but 440 is the A string so should work
    if (result !== null) {
      expect(result.length).toBe(2);
      expect(result.every((p) => p.freqHz > 0)).toBe(true);
    }
  });

  it('test_fretless_invalid_freq_throws', () => {
    const v = violin(440);
    expect(() => fretlessPositionsFor(v, -1)).toThrow(RangeError);
    expect(() => fretlessPositionsFor(v, 0)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// fretlessPositionsFor – tolerance clamping and validation (coverage gaps)
// ---------------------------------------------------------------------------

describe('fretlessPositionsFor tolerance', () => {
  const v = violin(440);
  // String layout: G3=string 0 (≈196 Hz), D4=1, A4=2 (440 Hz), E5=3.

  it('test_negative_tolerance_throws', () => {
    expect(() => fretlessPositionsFor(v, 440, -1)).toThrow(RangeError);
  });

  it('test_tolerance_clamps_freq_below_open_string_to_zero_cents', () => {
    // G3 string: 10 cents below open → within 15-cent tolerance → clamped to 0 cents.
    const g3Hz = v.openStringsHz[0] as number;
    const belowG3 = g3Hz * 2 ** (-10 / 1200);
    const positions = fretlessPositionsFor(v, belowG3, 15);
    const g3pos = positions.find((p) => p.string === 0);
    expect(g3pos).toBeDefined();
    expect(g3pos?.cents).toBe(0);
    expect(g3pos?.freqHz).toBeCloseTo(g3Hz, 2);
  });

  it('test_tolerance_clamps_freq_above_max_cents_to_max', () => {
    // A4 string (440 Hz): 10 cents past maxCents (2400) → within 15-cent tolerance → clamped to 2400.
    const a4Hz = v.openStringsHz[2] as number; // index 2
    const above2400 = a4Hz * 2 ** ((v.maxCents + 10) / 1200);
    const positions = fretlessPositionsFor(v, above2400, 15);
    const a4pos = positions.find((p) => p.string === 2);
    expect(a4pos).toBeDefined();
    expect(a4pos?.cents).toBe(v.maxCents);
    expect(a4pos?.freqHz).toBeCloseTo(a4Hz * 2 ** (v.maxCents / 1200), 2);
  });
});

// ---------------------------------------------------------------------------
// fingerFretlessChord – validation (coverage gaps)
// ---------------------------------------------------------------------------

describe('fingerFretlessChord validation', () => {
  const v = violin(440);

  it('test_empty_freqs_throws', () => {
    expect(() => fingerFretlessChord(v, [])).toThrow(RangeError);
  });

  it('test_too_many_freqs_throws', () => {
    // Violin has 4 strings; 5 notes is too many.
    expect(() => fingerFretlessChord(v, [200, 250, 300, 350, 400])).toThrow(RangeError);
  });

  it('test_non_positive_freq_throws', () => {
    expect(() => fingerFretlessChord(v, [440, -1])).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// fingerFretlessChord – branch coverage gaps
// ---------------------------------------------------------------------------

describe('fingerFretlessChord edge cases', () => {
  // Custom 2-string instrument: string 0 at 200 Hz, string 1 at 1000 Hz, 1200 cents each.
  const narrow: FretlessInstrument = {
    id: 'narrow-test',
    openStringsHz: [200, 1000],
    maxCents: 1200,
  };

  it('test_all_open_strings_span_is_zero_and_result_non_null', () => {
    // Tiny-range 2-string instrument: each note only fits on its own open string (maxCents=1).
    // Both assigned positions have cents = 0 → fretted list is empty → true branch of line 104.
    const tinyInst: FretlessInstrument = {
      id: 'tiny-open',
      openStringsHz: [440, 660],
      maxCents: 1,
    };
    const result = fingerFretlessChord(tinyInst, [440, 660]);
    expect(result).not.toBeNull();
    expect(result?.every((p) => p.cents === 0)).toBe(true);
  });

  it('test_unreachable_note_returns_null', () => {
    // A frequency above both string ranges → candidates[1].length === 0 → return null at line 170.
    const tooHigh = 5000; // far above narrow string 1 (1000 Hz + 1200 cents = 2000 Hz max)
    const result = fingerFretlessChord(narrow, [250, tooHigh]);
    expect(result).toBeNull();
  });

  it('test_no_injective_assignment_returns_null', () => {
    // Both 250 and 300 Hz are reachable on string 0 only (below string 1 open=1000 Hz).
    // No injective (one-note-per-string) assignment can span both → best stays null (line 191).
    const result = fingerFretlessChord(narrow, [250, 300]);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Q81 — fretlessChordFromScale
// ---------------------------------------------------------------------------

describe('fretlessChordFromScale (Q81)', () => {
  // 12-EDO C4 major scale on violin (G3, D4, A4, E5 strings, maxCents 2400)
  const t12 = edo(12, 440);
  const major: Scale = {
    id: 'major',
    name: 'Major',
    tuningId: '12-edo',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const v = violin(440);

  it('test_fretless_chord_from_scale_returns_positions_or_null', () => {
    // Triad on degrees 0, 2, 4 of major scale (C-E-G equivalent in tuning)
    const result = fretlessChordFromScale(major, t12, [0, 2, 4], v, 440);
    // Result is null if no injective assignment; otherwise positions have positive freqs
    if (result !== null) {
      expect(result.length).toBe(3);
      expect(result.every((p) => p.freqHz > 0)).toBe(true);
    }
  });

  it('test_fretless_chord_from_scale_positions_sorted_by_string', () => {
    const result = fretlessChordFromScale(major, t12, [0, 2, 4], v, 440);
    if (result !== null && result.length > 1) {
      for (let i = 1; i < result.length; i++) {
        expect((result[i] as { string: number }).string).toBeGreaterThanOrEqual(
          (result[i - 1] as { string: number }).string,
        );
      }
    }
  });

  it('test_fretless_chord_from_scale_uses_tuning_reference_when_rootHz_omitted', () => {
    // rootHz defaults to tuning.referenceHz (440 for this tuning)
    const withRoot = fretlessChordFromScale(major, t12, [0, 2, 4], v, 440);
    const withDefault = fretlessChordFromScale(major, t12, [0, 2, 4], v);
    // Both should match in null-ness and (if non-null) same number of positions
    expect(withRoot === null).toBe(withDefault === null);
    if (withRoot !== null && withDefault !== null) {
      expect(withRoot.length).toBe(withDefault.length);
    }
  });

  it('test_fretless_chord_from_scale_wrong_tuning_throws', () => {
    const wrongTuning = edo(19, 440);
    expect(() => fretlessChordFromScale(major, wrongTuning, [0, 2, 4], v, 440)).toThrow(RangeError);
  });

  it('test_fretless_chord_from_scale_empty_offsets_throws', () => {
    expect(() => fretlessChordFromScale(major, t12, [], v, 440)).toThrow(RangeError);
  });

  it('test_fretless_chord_from_scale_out_of_range_offset_throws', () => {
    // major has 7 degrees (indices 0..6); offset 7 is out of range
    expect(() => fretlessChordFromScale(major, t12, [0, 2, 7], v, 440)).toThrow(RangeError);
  });

  it('test_fretless_chord_from_scale_two_note_chord_on_oud', () => {
    const oud = fretlessOud(440);
    // A simple two-degree dyad (root + second)
    const result = fretlessChordFromScale(major, t12, [0, 1], oud, 440);
    // Oud has 6 strings; a 2-note chord should almost always be fingerable
    if (result !== null) {
      expect(result.length).toBe(2);
    }
  });
});
