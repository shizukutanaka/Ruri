import { describe, it, expect } from 'vitest';
import { parseKbm, writeKbm, kbmNoteToFreq, type KbmMapping } from './kbm.js';
import { parseScl, sclFromCents } from './scala.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Canonical 12-note linear kbm:
 *   size 12, first 0, last 127, middle 60, reference 69 (A4), 440 Hz,
 *   octave at degree 12, mapping 0..11.
 */
const KBM_12_CANONICAL = `! Keyboard mapping file (.kbm)
!
12
0
127
60
69
440.0
12
0
1
2
3
4
5
6
7
8
9
10
11
`;

/** A mapping that contains an 'x' entry (MIDI position 1 is unmapped). */
const KBM_WITH_X = `! Test mapping with unmapped key
!
3
0
127
60
60
261.6256
3
0
x
2
`;

/** 12-TET scale identical to what scala.test.ts uses. */
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const scale12tet = parseScl(SCL_12TET);

// Build a fresh 12-TET scale from sclFromCents for size-0 tests.
const cents12 = Array.from({ length: 12 }, (_, i) => (i + 1) * 100);
const scale12FromCents = sclFromCents('12TET', cents12);

// ---------------------------------------------------------------------------
// parse
// ---------------------------------------------------------------------------

describe('.kbm parse', () => {
  it('test_canonical_12_fields', () => {
    const m = parseKbm(KBM_12_CANONICAL);
    expect(m.size).toBe(12);
    expect(m.firstNote).toBe(0);
    expect(m.lastNote).toBe(127);
    expect(m.middleNote).toBe(60);
    expect(m.referenceNote).toBe(69);
    expect(m.referenceHz).toBeCloseTo(440.0, 6);
    expect(m.octaveDegree).toBe(12);
    expect(m.mapping.length).toBe(12);
    for (let i = 0; i < 12; i++) {
      expect(m.mapping[i]).toBe(i);
    }
  });

  it('test_x_entry_parsed_as_null', () => {
    const m = parseKbm(KBM_WITH_X);
    expect(m.mapping[0]).toBe(0);
    expect(m.mapping[1]).toBeNull();
    expect(m.mapping[2]).toBe(2);
  });

  it('test_comments_interleaved_are_ignored', () => {
    const text = `! comment before header
!
! another comment
12
! comment between fields
0
127
60
69
440.0
12
0
1
2
3
4
5
6
7
8
9
10
11
`;
    const m = parseKbm(text);
    expect(m.size).toBe(12);
    expect(m.referenceHz).toBeCloseTo(440.0, 6);
    expect(m.mapping.length).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// round-trip
// ---------------------------------------------------------------------------

describe('.kbm round-trip', () => {
  it('test_canonical_round_trip', () => {
    const a = parseKbm(KBM_12_CANONICAL);
    const b = parseKbm(writeKbm(a));
    expect(b.size).toBe(a.size);
    expect(b.firstNote).toBe(a.firstNote);
    expect(b.lastNote).toBe(a.lastNote);
    expect(b.middleNote).toBe(a.middleNote);
    expect(b.referenceNote).toBe(a.referenceNote);
    expect(b.referenceHz).toBeCloseTo(a.referenceHz, 6);
    expect(b.octaveDegree).toBe(a.octaveDegree);
    expect(b.mapping).toEqual(a.mapping);
  });

  it('test_with_x_round_trip', () => {
    const a = parseKbm(KBM_WITH_X);
    const b = parseKbm(writeKbm(a));
    expect(b.mapping[1]).toBeNull();
    expect(b.mapping).toEqual(a.mapping);
  });
});

// ---------------------------------------------------------------------------
// kbmNoteToFreq – 12-TET golden values
// ---------------------------------------------------------------------------

describe('kbmNoteToFreq 12-TET', () => {
  const m = parseKbm(KBM_12_CANONICAL);

  it('test_a4_440', () => {
    // MIDI 69 → A4 = 440 Hz exactly (it is the reference note).
    expect(kbmNoteToFreq(scale12tet, m, 69)).toBeCloseTo(440.0, 10);
  });

  it('test_middle_c_261', () => {
    // MIDI 60 → C4 ≈ 261.6256 Hz.
    expect(kbmNoteToFreq(scale12tet, m, 60)).toBeCloseTo(261.6256, 3);
  });

  it('test_c_sharp_277', () => {
    // MIDI 61 → C#4 ≈ 277.1826 Hz.
    expect(kbmNoteToFreq(scale12tet, m, 61)).toBeCloseTo(277.1826, 3);
  });

  it('test_note_below_first_returns_null', () => {
    const narrow: KbmMapping = { ...m, firstNote: 48, lastNote: 72 };
    expect(kbmNoteToFreq(scale12tet, narrow, 47)).toBeNull();
  });

  it('test_note_above_last_returns_null', () => {
    const narrow: KbmMapping = { ...m, firstNote: 48, lastNote: 72 };
    expect(kbmNoteToFreq(scale12tet, narrow, 73)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// kbmNoteToFreq – 'x' unmapped entries
// ---------------------------------------------------------------------------

describe('kbmNoteToFreq unmapped (x)', () => {
  // KBM_WITH_X: size 3, mapping [0, null, 2], middle 60, ref 60, 261.6256 Hz.
  const mX = parseKbm(KBM_WITH_X);

  it('test_unmapped_midi_returns_null', () => {
    // MIDI 61 = middleNote(60) + 1 → pos 1 → mapping[1] = null.
    expect(kbmNoteToFreq(scale12FromCents, mX, 61)).toBeNull();
  });

  it('test_octave_above_unmapped_also_null', () => {
    // MIDI 64 = middleNote(60) + 4 = 60 + 3 + 1 → off 4 → oct=1, pos=1 → null.
    expect(kbmNoteToFreq(scale12FromCents, mX, 64)).toBeNull();
  });

  it('test_mapped_neighbour_is_not_null', () => {
    // MIDI 60 → pos 0 → mapping[0] = 0 → 1/1 above reference → 261.6256 Hz.
    expect(kbmNoteToFreq(scale12FromCents, mX, 60)).toBeCloseTo(261.6256, 2);
  });
});

// ---------------------------------------------------------------------------
// kbmNoteToFreq – degree exceeds scale length throws
// ---------------------------------------------------------------------------

describe('kbmNoteToFreq degree out of range', () => {
  it('test_degree_exceeding_scale_throws', () => {
    // Build a mapping where degree 13 is referenced but scale only has 12.
    const badMapping: KbmMapping = {
      size: 1,
      firstNote: 0,
      lastNote: 127,
      middleNote: 60,
      referenceNote: 60,
      referenceHz: 440.0,
      octaveDegree: 12,
      mapping: [13], // degree 13 > scale.degrees.length (12)
    };
    expect(() => kbmNoteToFreq(scale12tet, badMapping, 60)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// kbmNoteToFreq – size 0 (linear default mapping)
// ---------------------------------------------------------------------------

describe('kbmNoteToFreq size 0 (linear)', () => {
  const mLinear: KbmMapping = {
    size: 0,
    firstNote: 0,
    lastNote: 127,
    middleNote: 60,
    referenceNote: 69,
    referenceHz: 440.0,
    octaveDegree: 0, // 0 → use scale.degrees.length
    mapping: [],
  };

  it('test_size0_a4_440', () => {
    expect(kbmNoteToFreq(scale12tet, mLinear, 69)).toBeCloseTo(440.0, 10);
  });

  it('test_size0_middle_c', () => {
    expect(kbmNoteToFreq(scale12tet, mLinear, 60)).toBeCloseTo(261.6256, 3);
  });
});

// ---------------------------------------------------------------------------
// Malformed input → throws
// ---------------------------------------------------------------------------

describe('.kbm parse errors', () => {
  it('test_fewer_than_7_header_values_throws', () => {
    expect(() => parseKbm('12\n0\n127\n60\n69\n')).toThrow(RangeError);
  });

  it('test_non_integer_note_throws', () => {
    expect(() =>
      parseKbm('12\n0.5\n127\n60\n69\n440.0\n12\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n'),
    ).toThrow(RangeError);
  });

  it('test_negative_frequency_throws', () => {
    expect(() =>
      parseKbm('12\n0\n127\n60\n69\n-440.0\n12\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n'),
    ).toThrow(RangeError);
  });

  it('test_zero_frequency_throws', () => {
    expect(() =>
      parseKbm('12\n0\n127\n60\n69\n0\n12\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n'),
    ).toThrow(RangeError);
  });

  it('test_bad_mapping_token_throws', () => {
    // 'q' is neither an integer nor 'x'.
    expect(() => parseKbm('1\n0\n127\n60\n69\n440.0\n12\nq\n')).toThrow(RangeError);
  });

  it('test_negative_mapping_entry_throws', () => {
    expect(() => parseKbm('1\n0\n127\n60\n69\n440.0\n12\n-1\n')).toThrow(RangeError);
  });

  it('test_not_enough_mapping_lines_throws', () => {
    // size 3 but only 2 mapping lines.
    expect(() => parseKbm('3\n0\n127\n60\n69\n440.0\n12\n0\n1\n')).toThrow(RangeError);
  });

  it('test_firstNote_greater_than_lastNote_throws_range_error', () => {
    // Socratic Q19 regression: firstNote=100 > lastNote=50 is degenerate (no keys in range).
    // Previously parsed silently; kbmNoteToFreq returned null for every note with no
    // diagnostic. Now parseKbm fails fast with a clear message.
    expect(() =>
      parseKbm('12\n100\n50\n60\n69\n440.0\n12\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n'),
    ).toThrow(RangeError);
  });
});
