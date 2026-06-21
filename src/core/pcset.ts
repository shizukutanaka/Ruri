/**
 * Pitch class set theory: normal form, prime form, interval vector, and Forte number lookup.
 * Supports arbitrary modulus (default 12 for standard 12-EDO Forte theory).
 */

/**
 * Reduce a set of integers to its normal form (most compact rotation), modulo M.
 * Default modulus = 12 (standard 12-EDO Forte theory).
 */
export function normalForm(pcs: readonly number[], modulus = 12): number[] {
  if (pcs.length === 0) return [];

  const u = Array.from(new Set(pcs.map((p) => ((p % modulus) + modulus) % modulus))).sort(
    (a, b) => a - b,
  );

  if (u.length === 1) return [0];

  const n = u.length;
  let best: number[] | null = null;

  for (let i = 0; i < n; i++) {
    const rot: number[] = [];
    for (let j = 0; j < n; j++) {
      rot.push((u[(i + j) % n]! - u[i]! + modulus) % modulus);
    }
    if (best === null) {
      best = rot;
    } else {
      // Compare from largest index downward (most compact / left-packed)
      for (let k = n - 1; k >= 1; k--) {
        if (rot[k]! < best[k]!) {
          best = rot;
          break;
        }
        if (rot[k]! > best[k]!) {
          break;
        }
      }
    }
  }

  return best!;
}

/**
 * Prime form: best of normalForm vs inversion's normalForm (lexicographic min).
 */
export function primeForm(pcs: readonly number[], modulus = 12): number[] {
  const nf = normalForm(pcs, modulus);
  const inv = pcs.map((p) => ((-p % modulus) + modulus) % modulus);
  const nfInv = normalForm(inv, modulus);

  // Lexicographic comparison
  const len = Math.min(nf.length, nfInv.length);
  for (let i = 0; i < len; i++) {
    if (nf[i]! < nfInv[i]!) return nf;
    if (nf[i]! > nfInv[i]!) return nfInv;
  }
  return nf.length <= nfInv.length ? nf : nfInv;
}

/**
 * Interval vector: count occurrences of each interval class (1..floor(M/2)).
 * Returns array of length `floor(M/2)`.
 */
export function intervalVector(pcs: readonly number[], modulus = 12): number[] {
  const halfM = Math.floor(modulus / 2);
  const vector = new Array<number>(halfM).fill(0);

  const normalized = pcs.map((p) => ((p % modulus) + modulus) % modulus);

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      let interval = (((normalized[j]! - normalized[i]!) % modulus) + modulus) % modulus;
      if (interval > halfM) interval = modulus - interval;
      if (interval >= 1 && interval <= halfM) {
        vector[interval - 1] = (vector[interval - 1] ?? 0) + 1;
      }
    }
  }

  return vector;
}

// Forte number lookup keyed by prime form (always 12-EDO).
// Major and minor triads share prime form [0,3,7] → both return '3-11'.
const FORTE_TABLE: Record<string, string> = {
  '0,3,7': '3-11', // major/minor triad (same prime form)
  '0,3,6': '3-10', // diminished triad
  '0,4,8': '3-12', // augmented triad
  '0,2,4,7': '4-22', // pentatonic 4-note (major 6th chord type)
  '0,2,5,7': '4-23', // suspended/pentatonic subset
  '0,1,5,6': '4-9', // all-interval tetrachord
  '0,1,3,7': '4-Z29', // all-interval tetrachord Z-partner
  '0,1,3,5,6,8,10': '7-35', // diatonic / major scale
  '0,1,3,4,6,8,10': '7-34', // ascending melodic minor / "Bartók" scale
  '0,1,3,4,6,7,9': '7-31', // alpha chord / octatonic subset
  '0,1,3,5,6,8,9': '7-30', // Neapolitan-related
  '0,1,3,4,6,8,9': '7-29', // Z-related to 7-15
};

/**
 * Forte number lookup for 12-tone sets. Returns null if pcs is not 12-EDO
 * (any element outside [0,11]), set size out of supported range (3..9),
 * or if no entry matches.
 */
export function forteNumber(pcs: readonly number[]): string | null {
  // Validate all elements in [0, 11]
  for (const p of pcs) {
    if (!Number.isInteger(p) || p < 0 || p > 11) return null;
  }

  const pf = primeForm(pcs, 12);
  const key = pf.join(',');
  return FORTE_TABLE[key] ?? null;
}
