// ---------------------------------------------------------------------------
// L4 — Gamelan tuning approximations
// ---------------------------------------------------------------------------

/**
 * Gamelan tuning approximations for slendro (5-tone) and pelog (7-tone).
 * Returns cents array from tonic (0 = tonic, last = octave at ~1200c).
 * These are representative/canonical approximations; actual gamelan instruments
 * vary significantly between ensembles.
 */

export type GamelanScaleName =
  | 'slendro'
  | 'pelog'
  | 'pelog-pathet-nem'
  | 'pelog-pathet-sanga'
  | 'pelog-pathet-manyura';

const GAMELAN_DATA: Readonly<Record<GamelanScaleName, readonly number[]>> = {
  slendro: [0, 240, 475, 720, 960, 1200],
  pelog: [0, 120, 265, 535, 680, 790, 1055, 1200],
  'pelog-pathet-nem': [0, 120, 265, 535, 680, 1055, 1200],
  'pelog-pathet-sanga': [0, 265, 535, 680, 790, 1200],
  'pelog-pathet-manyura': [0, 120, 265, 680, 790, 1055, 1200],
};

/**
 * Returns approximate cents for named gamelan scale.
 * slendro: ~5 near-equal tones (~240c each)
 * pelog: 7 unequal tones with characteristic small and large intervals
 */
export function gamelanTuning(name: GamelanScaleName): readonly number[] {
  const result = GAMELAN_DATA[name];
  if (result === undefined) {
    throw new RangeError(`gamelanTuning: unknown scale name '${name as string}'`);
  }
  return result;
}
