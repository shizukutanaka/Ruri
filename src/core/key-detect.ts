/**
 * Krumhansl–Schmuckler key detection: correlate a 12-element pitch-class weight vector
 * against the 24 rotated major/minor probe-tone profiles.
 *
 * Reference: Krumhansl & Kessler (1982). Tracing the dynamic changes in perceived
 * tonal organization in a spatial representation of musical keys.
 * Psychological Review, 89(4), 334–368.
 */

/** Krumhansl & Kessler (1982) probe-tone profiles */
const MAJOR_PROFILE: readonly number[] = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const MINOR_PROFILE: readonly number[] = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

export interface KeyScore {
  tonic: number; // 0..11 (0=C)
  mode: 'major' | 'minor';
  score: number; // Pearson r in [-1, 1]
}

export interface KeyDetectResult {
  tonic: number;
  mode: 'major' | 'minor';
  score: number;
  ranked: readonly KeyScore[]; // sorted descending by score, length = 24
}

function pearson(x: readonly number[], y: readonly number[]): number {
  const mx = x.reduce((a, b) => a + b, 0) / x.length;
  const my = y.reduce((a, b) => a + b, 0) / y.length;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < x.length; i++) {
    const a = x[i]! - mx,
      b = y[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

/**
 * Krumhansl–Schmuckler key-finding: correlate a 12-element pitch-class weight vector
 * against the 24 rotated major/minor probe-tone profiles.
 * Returns the best-fit key plus all 24 ranked candidates.
 * Throws RangeError if pcWeights.length !== 12 or all weights are zero.
 */
export function detectKey(pcWeights: readonly number[]): KeyDetectResult {
  if (pcWeights.length !== 12) {
    throw new RangeError(`detectKey: pcWeights must have length 12, got ${pcWeights.length}`);
  }
  const sum = pcWeights.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    throw new RangeError('detectKey: pcWeights must not all be zero');
  }

  const ranked: KeyScore[] = [];

  for (let tonic = 0; tonic < 12; tonic++) {
    // Build rotated profiles: profile[i] = PROFILE[(i - tonic + 12) % 12]
    const majorRotated = Array.from(
      { length: 12 },
      (_, i) => MAJOR_PROFILE[(i - tonic + 12) % 12]!,
    );
    const minorRotated = Array.from(
      { length: 12 },
      (_, i) => MINOR_PROFILE[(i - tonic + 12) % 12]!,
    );

    ranked.push({ tonic, mode: 'major', score: pearson(pcWeights, majorRotated) });
    ranked.push({ tonic, mode: 'minor', score: pearson(pcWeights, minorRotated) });
  }

  ranked.sort((a, b) => b.score - a.score);

  const best = ranked[0]!;
  return {
    tonic: best.tonic,
    mode: best.mode,
    score: best.score,
    ranked,
  };
}
