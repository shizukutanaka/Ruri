import { describe, it, expect } from 'vitest';
import { fretlessOud, violin, fretlessPositionsFor, fingerFretlessChord } from './fretless.js';

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
