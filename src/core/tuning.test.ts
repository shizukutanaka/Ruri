import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { equalTemperament12, degreeToCents, degreeToFreq, type TuningSystem } from './tuning.js';
import { cents, fromRatio } from './cents.js';
import { ratio } from './ratio.js';
import { scaleToCents, type Scale } from './scale.js';
import { chordFromSemitones, chordToCents, realizeChordFreqs } from './chord.js';

describe('tuning period wrap', () => {
  const t = equalTemperament12(440);

  it('test_degree_zero_is_reference', () => {
    expect(degreeToFreq(t, 0)).toBeCloseTo(440, 9);
  });

  it('test_degree_12_is_one_octave_up', () => {
    expect(degreeToFreq(t, 12)).toBeCloseTo(880, 9);
  });

  it('property_degree_plus_count_adds_one_period', () => {
    fc.assert(
      fc.property(fc.integer({ min: -36, max: 36 }), (d) => {
        const step = degreeToCents(t, d + t.degrees.length) - degreeToCents(t, d);
        expect(step).toBeCloseTo(t.periodCents, 6);
      }),
    );
  });
});

describe('non-octave / stretched tuning (improvement #2)', () => {
  it('test_stretched_octave_period_respected', () => {
    const stretched: TuningSystem = {
      id: 'stretch',
      name: 'stretched-octave demo',
      referenceHz: 400,
      periodCents: 1210, // wider than 1200, like measured gamelan
      degrees: [cents(0), cents(240), cents(480), cents(720), cents(960)],
      source: 'measured',
      region: 'demo',
    };
    expect(degreeToCents(stretched, 5)).toBeCloseTo(1210, 9);
  });
});

describe('scale over tuning', () => {
  it('test_scale_major_steps_match_12tet', () => {
    const t = equalTemperament12(440);
    const major: Scale = {
      id: 'maj',
      name: 'major',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 5, 7, 9, 11],
    };
    expect(scaleToCents(major, t)).toEqual([0, 200, 400, 500, 700, 900, 1100]);
  });

  it('test_scale_tuning_mismatch_throws', () => {
    const wrong = equalTemperament12(440);
    const s: Scale = { id: 'x', name: 'x', tuningId: 'other', degreeIndices: [0] };
    expect(() => scaleToCents(s, wrong)).toThrow(RangeError);
  });
});

describe('chord', () => {
  it('test_12tet_major_triad_cents', () => {
    expect(chordToCents(chordFromSemitones('maj', [0, 4, 7]))).toEqual([0, 400, 700]);
  });

  it('test_just_major_third_is_386_cents', () => {
    const justThird = chordToCents({ name: 'm3', intervals: [cents(0), fromRatio(ratio(5, 4))] });
    const third = justThird[1] as number;
    expect(third).toBeCloseTo(386.31, 2);
  });

  it('test_realize_root_is_first_frequency', () => {
    const freqs = realizeChordFreqs(chordFromSemitones('maj', [0, 4, 7]), 261.63);
    const [root, , fifth] = freqs as [number, number, number];
    expect(root).toBeCloseTo(261.63, 6);
    expect(fifth / root).toBeCloseTo(2 ** (7 / 12), 6);
  });
});
