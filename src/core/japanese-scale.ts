/**
 * Japanese koto/in/yo scale presets.
 *
 * Note: scale cent values are simplified educational representations.
 * Real Japanese scale theory and koto tunings vary significantly by
 * school (ryū), region, period, and individual performer.
 */

export type JapaneseScaleName = 'in' | 'ritsu' | 'miyakoBushi' | 'yo' | 'minyo';
export type KotoTuningName = 'hira' | 'kumoi' | 'nakazora' | 'akebono' | 'iwato';

/**
 * Scale definitions as cents from tonic, pentatonic (length 5).
 *
 * - in: Japanese minor pentatonic with semitones (semitone, P4, P5, m6)
 * - ritsu: Japanese major-ish pentatonic (whole, P4, P5, M6)
 * - miyakoBushi: Urban "miyako" variant of in — same intervals, contextual distinction
 * - yo: Folk yo scale (whole, P4, P5, m7)
 * - minyo: Folk minyo pentatonic (m3, P4, P5, m7)
 */
const SCALE_DEFS: Record<JapaneseScaleName, readonly number[]> = {
  in: [0, 100, 500, 700, 800],
  ritsu: [0, 200, 500, 700, 900],
  miyakoBushi: [0, 100, 500, 700, 800], // same as 'in'; distinction is contextual
  yo: [0, 200, 500, 700, 1000],
  minyo: [0, 300, 500, 700, 1000],
};

/**
 * Koto tuning definitions: 13-string cent offsets from the lowest string's tonic.
 *
 * These are simplified educational values for a 13-string koto.
 * Real koto tunings vary by school and performer. Each array is length 13
 * and monotonically ascending.
 */
const KOTO_TUNING_DEFS: Record<KotoTuningName, readonly number[]> = {
  hira: [0, 500, 700, 800, 1200, 1500, 1700, 1900, 2000, 2400, 2700, 2900, 3000],
  kumoi: [0, 200, 700, 900, 1000, 1400, 1500, 1700, 2100, 2200, 2400, 2700, 2900],
  nakazora: [0, 500, 700, 800, 1200, 1400, 1700, 1900, 2000, 2400, 2600, 2900, 3100],
  akebono: [0, 200, 300, 700, 800, 1200, 1400, 1500, 1900, 2000, 2400, 2600, 2700],
  iwato: [0, 100, 500, 600, 1000, 1200, 1300, 1700, 1800, 2200, 2400, 2500, 2900],
};

/**
 * Return cents from tonic for the named Japanese scale (octave-bounded, length 5).
 * Throws RangeError on unknown name.
 */
export function japaneseScale(name: JapaneseScaleName): readonly number[] {
  const def = SCALE_DEFS[name];
  if (def === undefined) {
    throw new RangeError(`japaneseScale: unknown scale name '${name as string}'`);
  }
  // Return a fresh copy so callers cannot mutate underlying data
  return [...def];
}

/**
 * Return 13 string frequencies for a koto tuning, given the tonic Hz.
 * freq[i] = tonicHz * 2 ** (cents[i] / 1200)
 * Throws RangeError on unknown name or tonicHz <= 0.
 */
export function kotoTuning(name: KotoTuningName, tonicHz: number): readonly number[] {
  if (tonicHz <= 0) {
    throw new RangeError(`kotoTuning: tonicHz must be > 0, got ${tonicHz}`);
  }
  const def = KOTO_TUNING_DEFS[name];
  if (def === undefined) {
    throw new RangeError(`kotoTuning: unknown tuning name '${name as string}'`);
  }
  return def.map((cents) => tonicHz * Math.pow(2, cents / 1200));
}
