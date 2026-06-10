import { describe, it, expect } from 'vitest';
import { guitarStandard, bassStandard, positionsFor } from './instrument.js';
import { fingerChord, DEFAULT_HAND } from './fingering.js';
import { fingerPianoChord } from './piano.js';
import { chordFromSemitones, realizeChordFreqs } from './chord.js';
import { freqToCents } from './cents.js';

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

// Sanity: chord realization still consistent (cross-module)
describe('cross-module sanity', () => {
  it('test_major_triad_freqs_then_cents', () => {
    const freqs = realizeChordFreqs(chordFromSemitones('maj', [0, 4, 7]), A2_REF);
    const c = freqs.map((f) => freqToCents(f, A2_REF));
    expect(c[0]).toBeCloseTo(0, 6);
    expect(c[2]).toBeCloseTo(700, 6);
  });
});
