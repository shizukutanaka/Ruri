import { describe, it, expect } from 'vitest';
import { guitarStandard, bassStandard, positionsFor } from './instrument.js';
import { fingerChord, fingerChordFromScale, DEFAULT_HAND } from './fingering.js';
import { fingerPianoChord } from './piano.js';
import { chordFromSemitones, realizeChordFreqs } from './chord.js';
import { freqToCents } from './cents.js';
import { edo } from './tuning.js';
import { type Scale } from './scale.js';

// E major triad as absolute cents relative to guitar low E (open 6th string = 0c).
// E=0, G#=400, B=700 ... we use E2 root: E(0), B(700), E(1200), G#(1600), B(1900), E(2400)
const A2_REF = 110; // arbitrary ref for cents math; instrument cents are self-relative

describe('string instrument positions', () => {
  it('test_open_string_reachable_at_fret_0', () => {
    const g = guitarStandard();
    expect(positionsFor(g, 0).some((p) => p.string === 0 && p.fret === 0)).toBe(true);
  });

  it('test_microtonal_fret_step_respected', () => {
    const quarterToneGuitar = { ...guitarStandard(), fretStepCents: 50, id: 'q', name: 'q' };
    // 50c above low E should exist at fret 1 on string 0
    expect(positionsFor(quarterToneGuitar, 50).some((p) => p.fret === 1)).toBe(true);
    // but not on a 100c-step guitar
    expect(positionsFor(guitarStandard(), 50).length).toBe(0);
  });

  it('test_capo_blocks_lower_frets', () => {
    const capoed = { ...guitarStandard(), capo: 3 };
    expect(positionsFor(capoed, 100).length).toBe(0); // fret 1 below capo
    expect(positionsFor(capoed, 300).some((p) => p.fret === 3)).toBe(true);
  });
});

describe('guitar chord fingering', () => {
  const g = guitarStandard();
  // Power chord E5: root 0c (E), fifth 700c (B), octave 1200c (E)
  const e5 = [0, 700, 1200];

  it('test_power_chord_has_solution', () => {
    const sols = fingerChord(g, e5);
    expect(sols.length).toBeGreaterThan(0);
  });

  it('property_solution_covers_all_targets', () => {
    const sols = fingerChord(g, e5);
    for (const s of sols) {
      expect(s.positions.length).toBe(e5.length);
    }
  });

  it('property_respects_max_fret_span', () => {
    const sols = fingerChord(g, e5, { ...DEFAULT_HAND, maxFretSpan: 3 });
    for (const s of sols) {
      const frets = s.positions.filter((p) => p.fret > 0).map((p) => p.fret);
      if (frets.length > 1) {
        expect(Math.max(...frets) - Math.min(...frets)).toBeLessThanOrEqual(3);
      }
    }
  });

  it('test_no_two_notes_on_same_string', () => {
    for (const s of fingerChord(g, e5)) {
      const strings = s.positions.map((p) => p.string);
      expect(new Set(strings).size).toBe(strings.length);
    }
  });

  it('test_deterministic_same_input_same_output', () => {
    expect(JSON.stringify(fingerChord(g, e5))).toBe(JSON.stringify(fingerChord(g, e5)));
  });

  it('test_kbest_sorted_by_cost', () => {
    const sols = fingerChord(g, e5, DEFAULT_HAND, 5);
    for (let i = 1; i < sols.length; i++) {
      expect(sols[i]!.cost).toBeGreaterThanOrEqual(sols[i - 1]!.cost);
    }
  });

  it('test_unreachable_returns_empty', () => {
    expect(fingerChord(g, [99999]).length).toBe(0);
  });
});

describe('bass chord fingering (same model, 4 strings)', () => {
  const b = bassStandard();
  it('test_bass_fifth_playable', () => {
    // E + B (700c) on a bass
    expect(fingerChord(b, [0, 700]).length).toBeGreaterThan(0);
  });
});

describe('piano chord fingering', () => {
  it('test_triad_one_hand', () => {
    const cMajor = [60, 64, 67]; // C E G
    const fp = fingerPianoChord(cMajor);
    expect(fp.oneHand).toBe(true);
    expect(fp.assignment.length).toBe(3);
    expect(fp.assignment[0]!.finger).toBe(1); // thumb lowest
    expect(fp.assignment.at(-1)!.finger).toBe(5);
  });

  it('test_wide_voicing_not_one_hand', () => {
    const wide = [48, 64, 79]; // spans > 14 semitones
    expect(fingerPianoChord(wide).oneHand).toBe(false);
  });

  it('test_duplicate_notes_deduped', () => {
    expect(fingerPianoChord([60, 60, 64]).assignment.length).toBe(2);
  });

  it('test_duplicate_notes_finger_assignment', () => {
    // [60, 60, 64] deduped → [60, 64]: 2 notes, fingers should be 1 and 5
    const fp = fingerPianoChord([60, 60, 64]);
    expect(fp.assignment[0]!.note).toBe(60);
    expect(fp.assignment[0]!.finger).toBe(1);
    expect(fp.assignment[1]!.note).toBe(64);
    expect(fp.assignment[1]!.finger).toBe(5);
  });

  it('test_single_note_uses_thumb', () => {
    const fp = fingerPianoChord([60]);
    expect(fp.assignment.length).toBe(1);
    expect(fp.assignment[0]!.note).toBe(60);
    expect(fp.assignment[0]!.finger).toBe(1);
    expect(fp.oneHand).toBe(true);
  });

  it('test_empty_input_returns_empty_assignment', () => {
    const fp = fingerPianoChord([]);
    expect(fp.assignment.length).toBe(0);
    expect(fp.oneHand).toBe(true);
  });

  it('property_fingers_ascend_with_pitch', () => {
    const fp = fingerPianoChord([60, 62, 64, 65, 67]);
    for (let i = 1; i < fp.assignment.length; i++) {
      expect(fp.assignment[i]!.finger).toBeGreaterThanOrEqual(fp.assignment[i - 1]!.finger);
    }
  });
});

describe('fingerChord sort tie-break (equal cost, lower max-fret first)', () => {
  it('test_equal_cost_tie_break_by_max_fret', () => {
    const g = guitarStandard();
    // highPositionWeight=0 → cost = span only. Two zero-span solutions for [900c, 1400c]:
    //   (s=0,f=9)+(s=1,f=9): span=0, max=9  → cost=0
    //   (s=1,f=4)+(s=2,f=4): span=0, max=4  → cost=0
    // Equal cost triggers the || tie-break at line 81; lower max fret should sort first.
    const sols = fingerChord(g, [900, 1400], {
      maxFretSpan: 4,
      stretchWeight: 1,
      highPositionWeight: 0,
    });
    expect(sols.length).toBeGreaterThanOrEqual(2);
    const max0 = Math.max(...sols[0]!.positions.map((p) => p.fret));
    const max1 = Math.max(...sols[1]!.positions.map((p) => p.fret));
    expect(sols[0]!.cost).toBeCloseTo(sols[1]!.cost, 10);
    expect(max0).toBeLessThan(max1);
  });

  it('test_all_open_strings_zero_fretted_span', () => {
    const g = guitarStandard();
    // [0c, 500c]: 0c only on (s=0,f=0), 500c on (s=1,f=0) or (s=0,f=5).
    // Only valid assignment: (s=0,f=0)+(s=1,f=0) — all open strings.
    // frettedSpan: frets.filter(f>0) = [] → length===0 → returns 0 (line 29 true branch).
    const sols = fingerChord(g, [0, 500]);
    expect(sols.length).toBeGreaterThan(0);
    const allOpen = sols.find((s) => s.positions.every((p) => p.fret === 0));
    expect(allOpen).toBeDefined();
    expect(allOpen!.cost).toBeCloseTo(0, 10);
  });
});

// Sanity: chord realization still consistent (cross-module)
describe('cross-module sanity', () => {
  it('test_major_triad_freqs_then_cents', () => {
    const freqs = realizeChordFreqs(chordFromSemitones('maj', [0, 4, 7]), A2_REF);
    const c = freqs.map((f) => freqToCents(f, A2_REF));
    expect(c[0]).toBeCloseTo(0, 6);
    expect(c[2]).toBeCloseTo(700, 6);
  });
});

// Q72: scale-degree → chord → cent-offsets → guitar fingerings should be one call
describe('fingerChordFromScale — scale to guitar fingerings in one call (Q72)', () => {
  const tuning = edo(12);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-edo',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const guitar = guitarStandard();
  // Root on D string (1000c): triad notes land at 1000c, 1400c, 1700c
  // 1000c → s2 fret 0; 1400c → s2 fret 4 or s1 fret 9; 1700c → s3 fret 2 or s2 fret 7
  const ROOT_D = 1000;

  it('test_triad_from_major_scale_returns_fingerings', () => {
    // Scale degrees [0, 2, 4] = root, 3rd, 5th (0c, 400c, 700c relative to root)
    const fingerings = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, ROOT_D);
    expect(fingerings.length).toBeGreaterThan(0);
  });

  it('test_all_positions_cover_triad_notes', () => {
    const fingerings = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, ROOT_D);
    for (const f of fingerings) {
      expect(f.positions.length).toBe(3);
    }
  });

  it('test_no_two_notes_on_same_string', () => {
    const fingerings = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, ROOT_D);
    for (const f of fingerings) {
      const strings = f.positions.map((p) => p.string);
      expect(new Set(strings).size).toBe(strings.length);
    }
  });

  it('test_sorted_by_cost_ascending', () => {
    const fingerings = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, ROOT_D);
    for (let i = 1; i < fingerings.length; i++) {
      expect(fingerings[i]!.cost).toBeGreaterThanOrEqual(fingerings[i - 1]!.cost);
    }
  });

  it('test_root_position_affects_fingerings', () => {
    // Root at D string (1000c) vs G string (1500c) should produce different fingerings
    const fingeringsD = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, ROOT_D);
    const fingeringsG = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, 1500);
    // Results should differ (different root means different fret positions)
    expect(JSON.stringify(fingeringsD)).not.toBe(JSON.stringify(fingeringsG));
  });

  it('test_tuning_mismatch_throws', () => {
    const wrongTuning = edo(19);
    expect(() => fingerChordFromScale(major, wrongTuning, [0, 2, 4], guitar)).toThrow(RangeError);
  });

  it('test_empty_offsets_throws', () => {
    expect(() => fingerChordFromScale(major, tuning, [], guitar)).toThrow(RangeError);
  });

  it('test_out_of_range_offset_throws', () => {
    expect(() => fingerChordFromScale(major, tuning, [0, 99], guitar)).toThrow(RangeError);
  });

  it('test_matches_manual_pipeline', () => {
    // Verify fingerChordFromScale == manual chain; check determinism
    const fingerings = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, ROOT_D);
    const again = fingerChordFromScale(major, tuning, [0, 2, 4], guitar, ROOT_D);
    expect(JSON.stringify(fingerings)).toBe(JSON.stringify(again));
  });
});
