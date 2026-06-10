import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ratio, multiplyRatio, ratioToCents, CENTS_PER_OCTAVE } from './ratio.js';
import { centsToFreq, freqToCents } from './cents.js';
import { freqToMpe, mpeToFreq, midiToFreq, freqToMidiFloat } from './midi.js';

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
