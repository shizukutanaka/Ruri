import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { adsrEnvelope, applyEnvelope } from './envelope.js';
import { pluck, DEFAULT_KS } from './ks-synth.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OPTS_BASE = {
  attackS: 0.1,
  decayS: 0.1,
  sustainLevel: 0.5,
  releaseS: 0.2,
};

// ---------------------------------------------------------------------------
// Shape tests at 1000 Hz
// ---------------------------------------------------------------------------

describe('adsrEnvelope shape', () => {
  const SR = 1000;
  const env = adsrEnvelope(OPTS_BASE, 0.5, SR);

  it('test_length_is_700', () => {
    // ceil((0.5 + 0.2) * 1000) = 700
    expect(env.length).toBe(700);
  });

  it('test_sample_0_near_zero', () => {
    // First sample of attack is very close to 0.
    expect(env[0]).toBeCloseTo(0, 2);
  });

  it('test_sample_100_near_one', () => {
    // End of attack (100 ms = 100 samples at 1 kHz).
    expect(env[100]).toBeCloseTo(1, 2);
  });

  it('test_sample_200_near_sustain', () => {
    // End of decay (100 + 100 = 200 samples).
    expect(env[200]).toBeCloseTo(0.5, 2);
  });

  it('test_sample_450_near_sustain', () => {
    // Mid-sustain (gate closes at 500, well within sustain plateau).
    expect(env[450]).toBeCloseTo(0.5, 2);
  });

  it('test_sample_699_near_zero', () => {
    // End of release (700th sample, index 699).
    const val = env[699] as number;
    expect(val).toBeCloseTo(0, 2);
  });

  it('test_all_samples_in_0_1', () => {
    expect(Array.from(env).every((s) => s >= 0 && s <= 1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Monotonicity
// ---------------------------------------------------------------------------

describe('adsrEnvelope monotonicity', () => {
  const SR = 1000;
  const env = adsrEnvelope(OPTS_BASE, 0.5, SR);

  it('test_attack_non_decreasing', () => {
    // Samples 0..99 are in the attack phase.
    for (let i = 1; i < 100; i++) {
      expect((env[i] as number) + 1e-9).toBeGreaterThanOrEqual(env[i - 1] as number);
    }
  });

  it('test_decay_non_increasing', () => {
    // Samples 100..199 are in the decay phase.
    for (let i = 101; i < 200; i++) {
      expect((env[i] as number) - 1e-9).toBeLessThanOrEqual(env[i - 1] as number);
    }
  });

  it('test_release_non_increasing', () => {
    // Samples 500..699 are in the release phase.
    for (let i = 501; i < 700; i++) {
      expect((env[i] as number) - 1e-9).toBeLessThanOrEqual(env[i - 1] as number);
    }
  });
});

// ---------------------------------------------------------------------------
// Early gate: gate closes mid-attack → no upward jump during release
// ---------------------------------------------------------------------------

describe('adsrEnvelope early gate', () => {
  const SR = 1000;
  // Attack 0.1 s, gate 0.05 s → gate closes halfway through attack (≈ 0.5 peak).
  const env = adsrEnvelope({ ...OPTS_BASE, attackS: 0.1, releaseS: 0.2 }, 0.05, SR);

  it('test_peak_value_approx_half', () => {
    // Value at the gate-close sample (index 50) should be ≈ 0.5.
    const valueAtGate = env[50] as number;
    expect(valueAtGate).toBeCloseTo(0.5, 2);
  });

  it('test_release_does_not_rise_above_gate_close_value', () => {
    const valueAtGate = env[50] as number;
    const epsilon = 1e-6;
    // All release samples should be <= valueAtGate + epsilon.
    for (let i = 50; i < env.length; i++) {
      expect(env[i] as number).toBeLessThanOrEqual(valueAtGate + epsilon);
    }
  });

  it('test_release_is_non_increasing', () => {
    for (let i = 51; i < env.length; i++) {
      expect((env[i] as number) - 1e-9).toBeLessThanOrEqual(env[i - 1] as number);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('adsrEnvelope edge cases', () => {
  it('test_zero_attack_jumps_to_one', () => {
    const env = adsrEnvelope({ ...OPTS_BASE, attackS: 0 }, 0.5, 1000);
    // First sample (if decay > 0, we are at the very start of decay so ≈ 1).
    expect(env[0] as number).toBeCloseTo(1, 5);
  });

  it('test_zero_release_cuts_instantly', () => {
    const env = adsrEnvelope({ ...OPTS_BASE, releaseS: 0 }, 0.5, 1000);
    // Length = ceil(0.5 * 1000) = 500.
    expect(env.length).toBe(500);
    // Last sample (index 499, still in sustain) should be > 0.
    expect(env[499] as number).toBeGreaterThan(0);
  });

  it('test_gate_zero_all_zeros', () => {
    const env = adsrEnvelope(OPTS_BASE, 0, 1000);
    // length = ceil(0.2 * 1000) = 200
    expect(Array.from(env).every((s) => s === 0)).toBe(true);
  });

  it('test_zero_attack_and_decay_holds_sustain', () => {
    const env = adsrEnvelope({ attackS: 0, decayS: 0, sustainLevel: 0.7, releaseS: 0.1 }, 0.3, 100);
    // All samples in [0, 30) should be ≈ 0.7.
    for (let i = 0; i < 30; i++) {
      expect(env[i] as number).toBeCloseTo(0.7, 5);
    }
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('adsrEnvelope validation', () => {
  it('test_negative_attack_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, attackS: -0.1 }, 0.5, 1000)).toThrow(RangeError);
  });

  it('test_negative_decay_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, decayS: -0.1 }, 0.5, 1000)).toThrow(RangeError);
  });

  it('test_negative_release_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, releaseS: -0.1 }, 0.5, 1000)).toThrow(RangeError);
  });

  it('test_sustain_above_one_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, sustainLevel: 1.1 }, 0.5, 1000)).toThrow(RangeError);
  });

  it('test_sustain_negative_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, sustainLevel: -0.1 }, 0.5, 1000)).toThrow(RangeError);
  });

  it('test_negative_gate_throws', () => {
    expect(() => adsrEnvelope(OPTS_BASE, -0.1, 1000)).toThrow(RangeError);
  });

  it('test_zero_sample_rate_throws', () => {
    expect(() => adsrEnvelope(OPTS_BASE, 0.5, 0)).toThrow(RangeError);
  });

  it('test_negative_sample_rate_throws', () => {
    expect(() => adsrEnvelope(OPTS_BASE, 0.5, -44100)).toThrow(RangeError);
  });

  it('test_nan_attack_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, attackS: NaN }, 0.5, 1000)).toThrow(RangeError);
  });

  it('test_infinite_decay_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, decayS: Infinity }, 0.5, 1000)).toThrow(RangeError);
  });

  it('test_nan_sustain_throws', () => {
    expect(() => adsrEnvelope({ ...OPTS_BASE, sustainLevel: NaN }, 0.5, 1000)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// fast-check property: all samples in [0,1] for random valid options
// ---------------------------------------------------------------------------

describe('adsrEnvelope property', () => {
  const validTime = fc.double({ min: 0, max: 2, noNaN: true, noDefaultInfinity: true });
  const validSustain = fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true });
  const validSampleRate = fc.integer({ min: 100, max: 48000 });
  const validGate = fc.double({ min: 0, max: 2, noNaN: true, noDefaultInfinity: true });

  it('property_all_samples_in_unit_range', () => {
    fc.assert(
      fc.property(
        validTime,
        validTime,
        validSustain,
        validTime,
        validGate,
        validSampleRate,
        (attackS, decayS, sustainLevel, releaseS, gateS, sr) => {
          const env = adsrEnvelope({ attackS, decayS, sustainLevel, releaseS }, gateS, sr);
          for (const s of env) {
            if (s < 0 || s > 1) return false;
          }
          return true;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// applyEnvelope
// ---------------------------------------------------------------------------

describe('applyEnvelope', () => {
  const sig = new Float32Array([0.8, 0.6, 0.4, 0.2]);
  const envArr = new Float32Array([1.0, 0.5, 0.25, 0.0]);

  it('test_output_length_is_min', () => {
    const shorter = new Float32Array([1, 0.5]);
    const result = applyEnvelope(sig, shorter);
    expect(result.length).toBe(2);
  });

  it('test_output_length_matches_shorter_envelope', () => {
    const result = applyEnvelope(sig, envArr);
    expect(result.length).toBe(4);
  });

  it('test_spot_check_multiplication', () => {
    const result = applyEnvelope(sig, envArr);
    expect(result[0]).toBeCloseTo(0.8 * 1.0, 6);
    expect(result[1]).toBeCloseTo(0.6 * 0.5, 6);
    expect(result[2]).toBeCloseTo(0.4 * 0.25, 6);
    expect(result[3]).toBeCloseTo(0.2 * 0.0, 6);
  });

  it('test_inputs_not_mutated', () => {
    const sigCopy = Float32Array.from(sig);
    const envCopy = Float32Array.from(envArr);
    applyEnvelope(sig, envArr);
    expect(Array.from(sig)).toEqual(Array.from(sigCopy));
    expect(Array.from(envArr)).toEqual(Array.from(envCopy));
  });

  it('test_returns_new_buffer', () => {
    const result = applyEnvelope(sig, envArr);
    expect(result).not.toBe(sig);
    expect(result).not.toBe(envArr);
  });
});

// ---------------------------------------------------------------------------
// Integration: pluck + applyEnvelope
// ---------------------------------------------------------------------------

describe('integration with ks-synth pluck', () => {
  it('test_applied_envelope_length_and_tail_silence', () => {
    // Use a very short render to keep test fast.
    const SR = 44100;
    const gateS = 0.05;
    const releaseS = 0.02;
    const opts = {
      attackS: 0.01,
      decayS: 0.01,
      sustainLevel: 0.8,
      releaseS,
    };

    const wave = pluck(440, { ...DEFAULT_KS, sampleRate: SR, seconds: 0.1 });
    const env = adsrEnvelope(opts, gateS, SR);
    const shaped = applyEnvelope(wave, env);

    // Length equals min of wave and env.
    expect(shaped.length).toBe(Math.min(wave.length, env.length));

    // The expected total envelope length.
    const expectedEnvLen = Math.ceil((gateS + releaseS) * SR);
    expect(env.length).toBe(expectedEnvLen);

    // All samples after the release end (the tail within shaped) should be 0.
    // The envelope itself is fully 0 after releaseS seconds post gate.
    const releaseSamples = Math.ceil(releaseS * SR);
    const gateEndSample = Math.floor(gateS * SR);
    const afterRelease = gateEndSample + releaseSamples;

    // shaped is as long as min(wave, env); check only if there are samples past release.
    if (afterRelease < shaped.length) {
      for (let i = afterRelease; i < shaped.length; i++) {
        expect(shaped[i]).toBeCloseTo(0, 10);
      }
    }
  });

  it('test_shaped_output_within_unit_range', () => {
    const wave = pluck(220, { ...DEFAULT_KS, sampleRate: 44100, seconds: 0.1 });
    const env = adsrEnvelope(OPTS_BASE, 0.05, 44100);
    const shaped = applyEnvelope(wave, env);
    // Signal is normalized to [-1,1] by pluck; env is in [0,1] so product is in [-1,1].
    expect(Array.from(shaped).every((s) => Math.abs(s) <= 1.0001)).toBe(true);
  });
});
