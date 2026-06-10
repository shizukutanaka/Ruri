import { describe, it, expect } from 'vitest';
import { parseScl, writeScl, sclFromCents, degreeCents } from './scala.js';
import { chordToMpe, DEFAULT_MPE } from './mpe.js';
import { mpeToFreq } from '../core/midi.js';
import { freqToCents } from '../core/cents.js';

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
