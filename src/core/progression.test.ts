import { describe, it, expect } from 'vitest';
import { iiVI, tritoneSub, secondaryDominantOf } from './progression.js';

describe('iiVI', () => {
  it('test_c_major_returns_dm7_g7_cmaj7', () => {
    const chords = iiVI(0, 'major');
    expect(chords).toHaveLength(3);
    expect(chords[0]!.root).toBe(2);
    expect(chords[0]!.quality).toBe('min7');
    expect(chords[1]!.root).toBe(7);
    expect(chords[1]!.quality).toBe('dom7');
    expect(chords[2]!.root).toBe(0);
    expect(chords[2]!.quality).toBe('maj7');
  });

  it('test_c_major_chord_names', () => {
    const chords = iiVI(0, 'major');
    expect(chords[0]!.name).toBe('Dm7');
    expect(chords[1]!.name).toBe('G7');
    expect(chords[2]!.name).toBe('Cmaj7');
  });

  it('test_a_minor_returns_bm7b5_e7b9_am7', () => {
    const chords = iiVI(9, 'minor');
    expect(chords).toHaveLength(3);
    // ii: Bm7b5 — root = (9 + 2) % 12 = 11 (B)
    expect(chords[0]!.root).toBe(11);
    expect(chords[0]!.quality).toBe('min7b5');
    expect(chords[0]!.name).toBe('Bm7b5');
    // V: E7b9 — root = (9 + 7) % 12 = 4 (E)
    expect(chords[1]!.root).toBe(4);
    expect(chords[1]!.quality).toBe('dom7b9');
    expect(chords[1]!.name).toBe('E7b9');
    // i: Am7 — root = 9 (A)
    expect(chords[2]!.root).toBe(9);
    expect(chords[2]!.quality).toBe('min7');
    expect(chords[2]!.name).toBe('Am7');
  });

  it('test_default_mode_is_major', () => {
    const chords = iiVI(0);
    expect(chords[2]!.quality).toBe('maj7');
    expect(chords[0]!.name).toBe('Dm7');
  });
});

describe('tritoneSub', () => {
  it('test_g7_tritone_sub_returns_cs7', () => {
    const g7 = { root: 7, quality: 'dom7' as const, name: 'G7' };
    const sub = tritoneSub(g7);
    expect(sub.root).toBe(1);
    expect(sub.quality).toBe('dom7');
    expect(sub.name).toBe('C#7');
  });

  it('test_tritone_sub_throws_on_non_dom7', () => {
    const dm7 = { root: 2, quality: 'min7' as const, name: 'Dm7' };
    expect(() => tritoneSub(dm7)).toThrow(RangeError);
  });
});

describe('secondaryDominantOf', () => {
  it('test_secondary_dominant_of_am7_is_e7', () => {
    const am7 = { root: 9, quality: 'min7' as const, name: 'Am7' };
    const secDom = secondaryDominantOf(am7);
    expect(secDom.root).toBe(4);
    expect(secDom.quality).toBe('dom7');
    expect(secDom.name).toBe('E7');
  });

  it('test_secondary_dominant_wraps_correctly', () => {
    // G (7) + 7 = 14 % 12 = 2 (D7)
    const g7 = { root: 7, quality: 'dom7' as const, name: 'G7' };
    const secDom = secondaryDominantOf(g7);
    expect(secDom.root).toBe(2);
    expect(secDom.name).toBe('D7');
  });
});
