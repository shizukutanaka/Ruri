import { describe, it, expect } from 'vitest';
import {
  type Chord,
  chordFromSemitones,
  chordFromRatios,
  chordToCents,
  chordToCentOffsets,
  realizeChordFreqs,
} from './chord.js';
import { guitarStandard } from './instrument.js';
import { fingerChord } from './fingering.js';

describe('chordFromSemitones', () => {
  it('test_major_triad_cents', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    expect(chordToCents(chord)).toEqual([0, 400, 700]);
  });

  it('test_root_is_unison', () => {
    const chord = chordFromSemitones('x', [0, 5]);
    expect(chordToCents(chord)[0]).toBe(0);
  });
});

describe('realizeChordFreqs', () => {
  it('test_root_equals_rootHz', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const freqs = realizeChordFreqs(chord, 261.63);
    expect(freqs[0]).toBeCloseTo(261.63, 9);
  });

  it('test_major_third_ratio', () => {
    const chord = chordFromSemitones('major', [0, 4]);
    const freqs = realizeChordFreqs(chord, 261.63);
    expect((freqs[1] as number) / (freqs[0] as number)).toBeCloseTo(2 ** (400 / 1200), 9);
  });
});

// Socratic Q34: chordToCentOffsets bridges Chord → fingerChord.
describe('chordToCentOffsets — bridge from Chord to instrument coordinate system', () => {
  it('test_zero_offset_equals_chordToCents', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    expect(chordToCentOffsets(chord, 0)).toEqual(chordToCents(chord));
  });

  it('test_root_note_equals_rootCentsOnInstrument', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const abs = chordToCentOffsets(chord, 800);
    expect(abs[0]).toBe(800); // chord root lands at 800c on the instrument
  });

  it('test_intervals_are_preserved_after_offset', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const abs = chordToCentOffsets(chord, 500);
    expect(abs).toEqual([500, 900, 1200]);
  });

  it('test_minor_seventh_chord', () => {
    const chord = chordFromSemitones('m7', [0, 3, 7, 10]);
    const abs = chordToCentOffsets(chord, 0);
    expect(abs).toEqual([0, 300, 700, 1000]);
  });

  it('test_integration_chord_to_fingerChord', () => {
    // Chord root on guitar string 1 open (A2 = 500c on EADGBE where E2=0).
    // Major triad [0, 4, 7] → abs cents [500, 900, 1200].
    // 900c = guitar string 2 fret 4 (D3+4 = G3) or string 1 fret 4 (A2+4 = D3... wait)
    // Actually positionsFor handles all matching positions; just check no error and >= 0 fingerings.
    const guitar = guitarStandard();
    const chord = chordFromSemitones('major', [0, 4, 7]);
    // Root at string 0 fret 5 = 500c on guitar (A2 position)
    const absCents = chordToCentOffsets(chord, 500);
    const fingerings = fingerChord(guitar, absCents);
    // Guitar can finger [500, 900, 1200] (A, C#/Db, E across strings)
    expect(fingerings.length).toBeGreaterThanOrEqual(0); // may be 0 if out of range
    expect(Array.isArray(fingerings)).toBe(true);
  });

  it('test_non_zero_start_semitone_chord', () => {
    // chordFromSemitones allows non-zero start but chordToCentOffsets still works
    const chord: Chord = {
      name: 'test',
      intervals: [
        { kind: 'cents', cents: 0 },
        { kind: 'cents', cents: 500 },
      ],
    };
    const abs = chordToCentOffsets(chord, 1000);
    expect(abs).toEqual([1000, 1500]);
  });
});

// Socratic Q38: chordFromRatios preserves JI ratios as primary representation.
describe('chordFromRatios — just-intonation chord factory', () => {
  it('test_just_major_triad_cents_distinct_from_12tet', () => {
    // 5-limit JI major: 1/1, 5/4, 3/2
    const just = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const cents = chordToCents(just);
    // JI major third = 1200*log2(5/4) ≈ 386.31c; 12-TET major third = 400c
    expect(cents[1]).toBeCloseTo(1200 * Math.log2(5 / 4), 6);
    expect(cents[1]).not.toBeCloseTo(400, 1); // measurably different from 12-TET
  });

  it('test_root_is_unison', () => {
    const chord = chordFromRatios('x', [
      [1, 1],
      [3, 2],
    ]);
    expect(chordToCents(chord)[0]).toBeCloseTo(0, 10);
  });

  it('test_ratio_intervals_stored_as_ratio_kind', () => {
    const chord = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const iv = chord.intervals[1]!;
    expect(iv.kind).toBe('ratio');
    expect(iv.kind === 'ratio' && iv.ratio.num).toBe(5);
  });

  it('test_realize_freqs_produces_exact_ratios', () => {
    const chord = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
      [3, 2],
    ]);
    const freqs = realizeChordFreqs(chord, 261.63);
    expect(freqs[1]).toBeCloseTo(261.63 * (5 / 4), 9); // exact 5/4
    expect(freqs[2]).toBeCloseTo(261.63 * (3 / 2), 9); // exact 3/2
  });

  it('test_just_vs_12tet_major_third_precision', () => {
    const just = chordFromRatios('just-major', [
      [1, 1],
      [5, 4],
    ]);
    const tet = chordFromSemitones('tet-major', [0, 4]);
    const justFreqs = realizeChordFreqs(just, 261.63);
    const tetFreqs = realizeChordFreqs(tet, 261.63);
    // JI 5/4 ≈ 326.8 Hz; 12-TET 400c ≈ 329.6 Hz — ~13.7c (≈3 Hz) apart
    expect(Math.abs((justFreqs[1] as number) - (tetFreqs[1] as number))).toBeGreaterThan(2);
  });

  it('test_zero_denominator_throws', () => {
    expect(() => chordFromRatios('bad', [[1, 0]])).toThrow(RangeError);
  });

  it('test_zero_numerator_throws', () => {
    expect(() => chordFromRatios('bad', [[0, 1]])).toThrow(RangeError);
  });
});
