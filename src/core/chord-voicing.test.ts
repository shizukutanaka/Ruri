import { describe, it, expect } from 'vitest';
import { optimalChordVoicing } from './chord-voicing.js';
import { chordFromSemitones } from './chord.js';
import { chordObjectDissonance } from './dissonance.js';
import { harmonicSpectrum } from './spectrum.js';

describe('optimalChordVoicing', () => {
  const spectrum = harmonicSpectrum(6);
  const majorTriad = chordFromSemitones('major', [0, 4, 7]);

  it('returns one frequency per chord member', () => {
    const v = optimalChordVoicing(majorTriad, 220, spectrum);
    expect(v.freqsHz.length).toBe(3);
    expect(v.octaveOffsets.length).toBe(3);
  });

  it('returns non-negative dissonance', () => {
    const v = optimalChordVoicing(majorTriad, 220, spectrum);
    expect(v.dissonance).toBeGreaterThanOrEqual(0);
  });

  it('throws RangeError for a chord with no intervals', () => {
    expect(() => optimalChordVoicing({ name: 'empty', intervals: [] }, 220, spectrum)).toThrow(
      RangeError,
    );
  });

  it('with registerRange [0,0] matches chordObjectDissonance exactly (no octave shift)', () => {
    const v = optimalChordVoicing(majorTriad, 220, spectrum, { registerRange: [0, 0] });
    const expected = chordObjectDissonance(majorTriad, 220, spectrum);
    expect(v.octaveOffsets).toEqual([0, 0, 0]);
    expect(v.dissonance).toBeCloseTo(expected, 10);
  });

  it('never returns a higher dissonance than the unshifted voicing', () => {
    const unshifted = chordObjectDissonance(majorTriad, 220, spectrum);
    const optimized = optimalChordVoicing(majorTriad, 220, spectrum);
    expect(optimized.dissonance).toBeLessThanOrEqual(unshifted + 1e-9);
  });

  it('searches a wider register range without error', () => {
    const v = optimalChordVoicing(majorTriad, 220, spectrum, { registerRange: [-2, 2] });
    expect(v.freqsHz.length).toBe(3);
    expect(v.dissonance).toBeGreaterThanOrEqual(0);
  });
});
