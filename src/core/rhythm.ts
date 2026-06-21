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
