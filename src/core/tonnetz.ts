// ---------------------------------------------------------------------------
// L3 — Tonnetz coordinate system and neo-Riemannian transformations
// ---------------------------------------------------------------------------

/**
 * Tonnetz coordinate system and neo-Riemannian transformations.
 * Pitch class 0=C, 1=C#, ..., 11=B in 12-EDO.
 */

export interface TonnetzCoord {
  x: number;
  y: number;
}

/** Map a pitch class (0-11) to Tonnetz (x, y) coordinates (Cohn 1998). */
export function tonnetzCoords(pc: number): TonnetzCoord {
  const p = ((pc % 12) + 12) % 12;
  return { x: (p * 7) % 12, y: (p * 3) % 12 };
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function sortedTriad(a: number, b: number, c: number): [number, number, number] {
  const arr = [mod12(a), mod12(b), mod12(c)].sort((x, y) => x - y) as [number, number, number];
  return arr;
}

/**
 * Detect triad quality from a sorted [min, mid, max] triad.
 * Returns 'major' if intervals from min are (4, 7), 'minor' if (3, 7), else 'unknown'.
 * Handles all rotations of the triad to find the root position.
 */
function detectQuality(triad: readonly [number, number, number]): {
  root: number;
  quality: 'major' | 'minor' | 'unknown';
} {
  for (let i = 0; i < 3; i++) {
    const r = triad[i]!;
    const t = triad[(i + 1) % 3]!;
    const f = triad[(i + 2) % 3]!;
    const intRT = mod12(t - r);
    const intRF = mod12(f - r);
    if (intRT === 4 && intRF === 7) return { root: r, quality: 'major' };
    if (intRT === 3 && intRF === 7) return { root: r, quality: 'minor' };
  }
  return { root: triad[0]!, quality: 'unknown' };
}

/**
 * P (Parallel): swap major/minor by moving the third a semitone.
 * Input: [root, third, fifth] pitch classes. Returns sorted transformed triad.
 */
export function neoRiemannianP(triad: readonly [number, number, number]): [number, number, number] {
  const sorted = sortedTriad(triad[0], triad[1], triad[2]);
  const { root, quality } = detectQuality(sorted);
  if (quality === 'major') {
    const third = mod12(root + 4);
    const newThird = mod12(third - 1);
    const fifth = mod12(root + 7);
    return sortedTriad(root, newThird, fifth);
  } else {
    const third = mod12(root + 3);
    const newThird = mod12(third + 1);
    const fifth = mod12(root + 7);
    return sortedTriad(root, newThird, fifth);
  }
}

/**
 * L (Leading-tone exchange): major → move root down by semitone;
 * minor → move fifth up by semitone.
 */
export function neoRiemannianL(triad: readonly [number, number, number]): [number, number, number] {
  const sorted = sortedTriad(triad[0], triad[1], triad[2]);
  const { root, quality } = detectQuality(sorted);
  if (quality === 'major') {
    const third = mod12(root + 4);
    const fifth = mod12(root + 7);
    return sortedTriad(mod12(root - 1), third, fifth);
  } else {
    const third = mod12(root + 3);
    const fifth = mod12(root + 7);
    return sortedTriad(root, third, mod12(fifth + 1));
  }
}

/**
 * R (Relative): major → relative minor (keep root+third, replace fifth with fifth+2);
 * minor → relative major (keep third+fifth, replace root with root-2).
 */
export function neoRiemannianR(triad: readonly [number, number, number]): [number, number, number] {
  const sorted = sortedTriad(triad[0], triad[1], triad[2]);
  const { root, quality } = detectQuality(sorted);
  if (quality === 'major') {
    const third = mod12(root + 4);
    const fifth = mod12(root + 7);
    return sortedTriad(root, third, mod12(fifth + 2));
  } else {
    const third = mod12(root + 3);
    const fifth = mod12(root + 7);
    return sortedTriad(mod12(root - 2), third, fifth);
  }
}
