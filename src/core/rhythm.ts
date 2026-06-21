/**
 * Euclidean (Bjorklund) rhythm generation: distribute pulses across steps as evenly as possible.
 * Includes rotation and onset-time helpers.
 */

/**
 * Bjorklund's algorithm: distribute `pulses` hits across `steps` slots as evenly as possible.
 * Returns boolean[] of length `steps`, true = hit, false = rest.
 * Throws RangeError on pulses < 0, steps < 1, or pulses > steps.
 */
export function euclideanRhythm(pulses: number, steps: number, rotation?: number): boolean[] {
  if (pulses < 0) throw new RangeError(`pulses must be >= 0, got ${pulses}`);
  if (steps < 1) throw new RangeError(`steps must be >= 1, got ${steps}`);
  if (pulses > steps) throw new RangeError(`pulses (${pulses}) must be <= steps (${steps})`);

  const out = new Array<boolean>(steps).fill(false);
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += pulses;
    if (bucket >= steps) {
      bucket -= steps;
      out[i] = true;
    }
  }
  return rotation !== undefined ? rotateEuclidean(out, rotation) : out;
}

/** Rotate a rhythm pattern by k positions (positive = right shift). Does not mutate input. */
export function rotateEuclidean(pattern: boolean[], rotation: number): boolean[] {
  const len = pattern.length;
  if (len === 0) return [];
  const out = new Array<boolean>(len);
  for (let i = 0; i < len; i++) {
    out[i] = pattern[(((i - rotation) % len) + len) % len]!;
  }
  return out;
}

/** Convert pattern to onset times in milliseconds, given step duration. Throws if stepMs <= 0. */
export function rhythmOnsets(pattern: boolean[], stepMs: number): number[] {
  if (stepMs <= 0) throw new RangeError(`stepMs must be > 0, got ${stepMs}`);
  const onsets: number[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i]) {
      onsets.push(i * stepMs);
    }
  }
  return onsets;
}

/**
 * Quantize tick positions to a grid. `strength` ∈ [0, 1]: 0 = no change, 1 = full snap.
 * Throws RangeError if grid <= 0 or strength outside [0, 1].
 */
export function quantizeTicks(
  ticks: readonly number[],
  grid: number,
  strength: number = 1.0,
): number[] {
  if (grid <= 0) throw new RangeError(`quantizeTicks: grid must be > 0, got ${grid}`);
  if (strength < 0 || strength > 1) {
    throw new RangeError(`quantizeTicks: strength must be in [0, 1], got ${strength}`);
  }
  return ticks.map((t) => {
    const nearest = Math.round(t / grid) * grid;
    return Math.round(t + (nearest - t) * strength);
  });
}

// ---------------------------------------------------------------------------
// L1 — polyrhythmPattern
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/**
 * Generate polyrhythm patterns for N voices, each with a different pulse count.
 * Each voice is a boolean[] of length = LCM(divisors).
 * Returns one boolean[] per divisor, all the same length.
 */
export function polyrhythmPattern(divisors: number[]): boolean[][] {
  if (divisors.length === 0) throw new RangeError(`polyrhythmPattern: divisors must not be empty`);
  for (let i = 0; i < divisors.length; i++) {
    const d = divisors[i]!;
    if (!Number.isInteger(d) || d < 1) {
      throw new RangeError(
        `polyrhythmPattern: divisors[${i}] must be a positive integer, got ${d}`,
      );
    }
  }
  const total = divisors.reduce(lcm, 1);
  return divisors.map((d) => {
    const spacing = total / d;
    const row = new Array<boolean>(total).fill(false);
    for (let i = 0; i < total; i++) {
      if (i % spacing === 0) row[i] = true;
    }
    return row;
  });
}

/**
 * Apply swing to a list of tick positions.
 * `swingRatio` ∈ (0.5, 1): fraction of beat for the on-beat;
 *   0.5 = straight, 0.667 = triplet swing, 0.75 = hard swing.
 * `subdivisionTicks` = the duration of one swung subdivision pair (e.g., quarter note in ticks).
 * Throws RangeError if swingRatio outside (0.5, 1) or subdivisionTicks <= 0.
 */
export function applySwing(
  ticks: readonly number[],
  swingRatio: number,
  subdivisionTicks: number,
): number[] {
  if (swingRatio <= 0.5 || swingRatio >= 1) {
    throw new RangeError(`applySwing: swingRatio must be in (0.5, 1), got ${swingRatio}`);
  }
  if (subdivisionTicks <= 0) {
    throw new RangeError(`applySwing: subdivisionTicks must be > 0, got ${subdivisionTicks}`);
  }
  return ticks.map((t) => {
    const pair = Math.floor(t / subdivisionTicks);
    const phase = (t - pair * subdivisionTicks) / subdivisionTicks;
    let newPhase: number;
    if (phase < 0.5) {
      newPhase = phase * 2 * swingRatio;
    } else {
      newPhase = swingRatio + (phase - 0.5) * 2 * (1 - swingRatio);
    }
    return Math.round(pair * subdivisionTicks + newPhase * subdivisionTicks);
  });
}
