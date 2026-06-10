import { CENTS_PER_OCTAVE, type Ratio, ratioToCents } from './ratio.js';

/** A pitch offset expressed either in cents or as an exact ratio. */
export type Pitch =
  | { readonly kind: 'cents'; readonly cents: number }
  | { readonly kind: 'ratio'; readonly ratio: Ratio };

export const cents = (c: number): Pitch => ({ kind: 'cents', cents: c });
export const fromRatio = (r: Ratio): Pitch => ({ kind: 'ratio', ratio: r });

/** Normalize any Pitch to cents. Ratio is primary; cents is derived (improvement #1). */
export function pitchToCents(p: Pitch): number {
  return p.kind === 'cents' ? p.cents : ratioToCents(p.ratio);
}

/** Multiplicative factor a frequency is scaled by over `c` cents. */
export function centsToFreqFactor(c: number): number {
  return 2 ** (c / CENTS_PER_OCTAVE);
}

/** Absolute frequency `c` cents above `referenceHz`. */
export function centsToFreq(c: number, referenceHz: number): number {
  return referenceHz * centsToFreqFactor(c);
}

/** Cents of `hz` relative to `referenceHz`. */
export function freqToCents(hz: number, referenceHz: number): number {
  return CENTS_PER_OCTAVE * Math.log2(hz / referenceHz);
}
