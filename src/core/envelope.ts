/**
 * ADSR amplitude envelope generation and application.
 *
 * Segment semantics (all transitions are linear):
 *   - Attack:  0 → 1 over attackS seconds.  The linear formula `n / (attackS * sampleRate)`
 *              gives `(N-1)/N` at the last attack sample (not exactly 1); the peak of 1.0
 *              first appears at sample N — the first decay sample.  This 1-sample difference
 *              is a standard discrete approximation; see Socratic Q20.
 *   - Decay:   1 → sustainLevel over decayS seconds.
 *   - Sustain: hold sustainLevel until the gate closes at gateS.
 *   - Release: current value → 0 over releaseS seconds; everything after is 0.
 *
 * If the gate closes mid-attack or mid-decay the release starts from whatever
 * value the envelope had at that sample (no upward jump, no discontinuity).
 *
 * Edge cases:
 *   - attackS  = 0 → jump to 1 at sample 0.
 *   - releaseS = 0 → instant cut at gateS (no release samples are allocated; the
 *                    `totalSamples` formula ensures no loop iteration reaches the release
 *                    phase — this is a mathematical invariant, not a runtime check).
 *   - gateS    = 0 → release starts from 0 → all zeros.
 */

export interface AdsrOptions {
  /** Attack time in seconds (>= 0). */
  readonly attackS: number;
  /** Decay time in seconds (>= 0). */
  readonly decayS: number;
  /** Sustain level 0..1. */
  readonly sustainLevel: number;
  /** Release time in seconds (>= 0). */
  readonly releaseS: number;
}

function validateFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and >= 0, got ${value}`);
  }
}

/**
 * Render an ADSR envelope: gate open for gateS seconds, then release.
 * Total length = ceil((gateS + releaseS) * sampleRate) samples.
 */
export function adsrEnvelope(opts: AdsrOptions, gateS: number, sampleRate: number): Float32Array {
  const { attackS, decayS, sustainLevel, releaseS } = opts;

  validateFiniteNonNegative(attackS, 'attackS');
  validateFiniteNonNegative(decayS, 'decayS');
  validateFiniteNonNegative(releaseS, 'releaseS');
  validateFiniteNonNegative(gateS, 'gateS');

  if (!Number.isFinite(sustainLevel) || sustainLevel < 0 || sustainLevel > 1) {
    throw new RangeError(`sustainLevel must be in [0,1], got ${sustainLevel}`);
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new RangeError(`sampleRate must be finite and > 0, got ${sampleRate}`);
  }

  const totalSamples = Math.ceil((gateS + releaseS) * sampleRate);
  const out = new Float32Array(totalSamples);

  // Sample boundaries for each phase.
  const attackEnd = attackS * sampleRate; // exclusive (samples 0..attackEnd are in attack)
  const decayEnd = attackEnd + decayS * sampleRate;
  const gateEnd = gateS * sampleRate; // gate closes here

  for (let n = 0; n < totalSamples; n++) {
    let env: number;

    if (n < gateEnd) {
      // Gate is open — evaluate A/D/S segments.
      if (attackS === 0) {
        // Instant attack.
        if (decayS === 0 || n >= decayEnd) {
          env = sustainLevel;
        } else {
          // Decay from 1 to sustainLevel.
          const decayPos = n / (decayS * sampleRate);
          env = 1 - (1 - sustainLevel) * decayPos;
        }
      } else if (n < attackEnd) {
        // Attack: 0 → 1.
        env = n / (attackS * sampleRate);
      } else if (decayS === 0 || n >= decayEnd) {
        // Sustain (or zero-length decay).
        env = sustainLevel;
      } else {
        // Decay: 1 → sustainLevel.
        const decayPos = (n - attackEnd) / (decayS * sampleRate);
        env = 1 - (1 - sustainLevel) * decayPos;
      }
    } else {
      // Gate closed — release phase. releaseS > 0 is guaranteed here: when releaseS = 0,
      // totalSamples = ceil(gateS * SR) = ceil(gateEnd) and all n < totalSamples
      // satisfy n < gateEnd, so this branch is never reached.
      // Determine the value at gate-close (may be in the middle of A or D).
      let valueAtGate: number;
      if (gateS === 0) {
        // Gate never opens: release starts from silence.
        valueAtGate = 0;
      } else if (attackS === 0) {
        if (decayS === 0 || gateEnd >= decayEnd) {
          valueAtGate = sustainLevel;
        } else {
          const decayPos = gateEnd / (decayS * sampleRate);
          valueAtGate = 1 - (1 - sustainLevel) * decayPos;
        }
      } else if (gateEnd < attackEnd) {
        // Gate closes during attack.
        valueAtGate = gateEnd / (attackS * sampleRate);
      } else if (decayS === 0 || gateEnd >= decayEnd) {
        valueAtGate = sustainLevel;
      } else {
        // Gate closes during decay.
        const decayPos = (gateEnd - attackEnd) / (decayS * sampleRate);
        valueAtGate = 1 - (1 - sustainLevel) * decayPos;
      }

      // Linear release from valueAtGate → 0 over releaseS.
      const releasePos = (n - gateEnd) / (releaseS * sampleRate);
      if (releasePos >= 1) {
        env = 0;
      } else {
        env = valueAtGate * (1 - releasePos);
      }
    }

    out[n] = Math.max(0, Math.min(1, env));
  }

  return out;
}

/**
 * Multiply a signal by an envelope sample-wise (shorter length wins).
 * Returns a new Float32Array; inputs are not mutated.
 */
export function applyEnvelope(
  signal: ArrayLike<number>,
  envelope: ArrayLike<number>,
): Float32Array {
  const len = Math.min(signal.length, envelope.length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (signal[i] as number) * (envelope[i] as number);
  }
  return out;
}
