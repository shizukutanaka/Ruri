import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ratio, multiplyRatio, ratioToCents, CENTS_PER_OCTAVE } from './ratio.js';
import { centsToFreq, freqToCents } from './cents.js';
import { freqToMpe, mpeToFreq, midiToFreq, freqToMidiFloat, pitchHzClassify } from './midi.js';

const posInt = fc.integer({ min: 1, max: 4096 });
const hz = fc.double({ min: 20, max: 20000, noNaN: true, noDefaultInfinity: true });

describe('ratio', () => {
  it('test_ratio_octave_returns_1200_cents', () => {
    expect(ratioToCents(ratio(2, 1))).toBeCloseTo(CENTS_PER_OCTAVE, 9);
  });

  it('test_ratio_invalid_input_throws', () => {
    expect(() => ratio(0, 1)).toThrow(RangeError);
    expect(() => ratio(3, 1.5)).toThrow(RangeError);
  });

  it('property_ratio_product_equals_cents_sum', () => {
    fc.assert(
      fc.property(posInt, posInt, posInt, posInt, (a, b, c, d) => {
        const sumCents = ratioToCents(ratio(a, b)) + ratioToCents(ratio(c, d));
        const productCents = ratioToCents(multiplyRatio(ratio(a, b), ratio(c, d)));
        expect(productCents).toBeCloseTo(sumCents, 6);
      }),
    );
  });
});

describe('cents <-> frequency', () => {
  it('property_cents_freq_round_trips', () => {
    fc.assert(
      fc.property(hz, hz, (f, ref) => {
        const back = centsToFreq(freqToCents(f, ref), ref);
        expect(back).toBeCloseTo(f, 6);
      }),
    );
  });

  it('test_freq_one_octave_up_doubles', () => {
    expect(centsToFreq(CENTS_PER_OCTAVE, 440)).toBeCloseTo(880, 9);
  });
});

describe('midi', () => {
  it('test_midi_A4_is_440', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 9);
  });

  it('property_integer_note_round_trips', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 127 }), (note) => {
        expect(freqToMidiFloat(midiToFreq(note))).toBeCloseTo(note, 6);
      }),
    );
  });
});

describe('mpe pitch-bend (I7 high-risk)', () => {
  it('property_freq_mpe_round_trips_within_bend_resolution', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 30, max: 16000, noNaN: true, noDefaultInfinity: true }),
        fc.constantFrom(2, 12, 48),
        (f, range) => {
          const back = mpeToFreq(freqToMpe(f, range), range);
          const centsErr = Math.abs(freqToCents(back, f));
          // 14-bit bend over ±range semitones → half-step rounding bound.
          const halfStepCents = (range * 100) / 16384;
          expect(centsErr).toBeLessThanOrEqual(halfStepCents + 1e-6);
        },
      ),
    );
  });

  it('test_freq_mpe_bend_in_14bit_range', () => {
    fc.assert(
      fc.property(fc.double({ min: 30, max: 16000, noNaN: true, noDefaultInfinity: true }), (f) => {
        const { note, bend14 } = freqToMpe(f);
        expect(note).toBeGreaterThanOrEqual(0);
        expect(bend14).toBeGreaterThanOrEqual(0);
        expect(bend14).toBeLessThanOrEqual(16383);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// I3 — pitchHzClassify
// ---------------------------------------------------------------------------

describe('pitchHzClassify (I3)', () => {
  it('test_440hz_is_A4', () => {
    const result = pitchHzClassify(440);
    expect(result.midiNearest).toBe(69);
    expect(result.noteName).toBe('A');
    expect(result.octave).toBe(4);
    expect(result.centsOff).toBeCloseTo(0, 6);
  });

  it('test_261_63hz_is_C4', () => {
    // Middle C ≈ 261.626 Hz = MIDI 60
    const result = pitchHzClassify(261.626);
    expect(result.midiNearest).toBe(60);
    expect(result.noteName).toBe('C');
    expect(result.octave).toBe(4);
    expect(result.centsOff).toBeCloseTo(0, 1);
  });

  it('test_444hz_is_sharp_of_A4', () => {
    // 444 Hz vs 440 Hz (A4): centsOff = 1200*log2(444/440)*... actually via midiFloat
    // midiFloat = 69 + 12*log2(444/440); centsOff = (midiFloat - 69) * 100
    const midiFloat = 69 + 12 * Math.log2(444 / 440);
    const expected = (midiFloat - 69) * 100;
    const result = pitchHzClassify(444);
    expect(result.midiNearest).toBe(69);
    expect(result.noteName).toBe('A');
    expect(result.centsOff).toBeCloseTo(expected, 4);
    expect(result.centsOff).toBeGreaterThan(0);
  });

  it('test_throws_on_hz_zero', () => {
    expect(() => pitchHzClassify(0)).toThrow(RangeError);
  });

  it('test_throws_on_NaN', () => {
    expect(() => pitchHzClassify(NaN)).toThrow(RangeError);
  });
});
