/**
 * Arabic maqam / jins builder using 24-EDO quarter-tone tuning (~150c = 3/4 tone).
 * Provides built-in jins and maqamat definitions and composition utilities.
 */

/** A jins is a tri/tetra/pentachord defined by cumulative cents intervals from the tonic. */
export interface Jins {
  readonly name: string;
  readonly cents: readonly number[]; // includes 0 at start; e.g. [0, 100, 400, 500] for hijaz
}

/** A maqam combines a lower jins and an upper jins joined at a degree. */
export interface Maqam {
  readonly name: string;
  readonly lower: Jins;
  readonly upper: Jins;
  /** Combined ascending cents from tonic, deduped. */
  readonly cents: readonly number[];
}

type JinsName = 'rast' | 'bayati' | 'hijaz' | 'kurd' | 'nahawand' | 'saba';
type MaqamName = 'rast' | 'bayati' | 'hijaz' | 'kurd' | 'nahawand' | 'saba';

const JINS_DEFS: Record<JinsName, readonly number[]> = {
  rast: [0, 200, 350, 500], // whole, 3/4, 3/4
  bayati: [0, 150, 350, 500], // 3/4, whole, ~whole
  hijaz: [0, 100, 400, 500], // half, aug2, half
  kurd: [0, 100, 300, 500], // half, whole, whole
  nahawand: [0, 200, 300, 500], // whole, half, whole
  saba: [0, 150, 300, 400], // 3/4, half, half — tritonic jins
};

const VALID_JINS_NAMES: readonly JinsName[] = [
  'rast',
  'bayati',
  'hijaz',
  'kurd',
  'nahawand',
  'saba',
];
const VALID_MAQAM_NAMES: readonly MaqamName[] = [
  'rast',
  'bayati',
  'hijaz',
  'kurd',
  'nahawand',
  'saba',
];

/** Built-in jins definitions (24-EDO based; ~150c = quarter-tone). */
export function jins(name: JinsName): Jins {
  const cents = JINS_DEFS[name];
  if (cents === undefined) {
    throw new RangeError(`Unknown jins '${name}'. Valid names: ${VALID_JINS_NAMES.join(', ')}`);
  }
  return { name, cents };
}

/** Built-in maqamat. */
export function maqam(name: MaqamName): Maqam {
  switch (name) {
    case 'rast':
      // Rast: lower rast tetrachord + upper rast joined at 700c (perfect 5th)
      // → [0,200,350,500,700,900,1050,1200]
      return composeMaqam('rast', jins('rast'), jins('rast'), 700);
    case 'bayati':
      // Bayati: lower bayati + nahawand upper joined at 700c
      return composeMaqam('bayati', jins('bayati'), jins('nahawand'), 700);
    case 'hijaz':
      // Hijaz: lower hijaz + nahawand upper joined at 700c
      return composeMaqam('hijaz', jins('hijaz'), jins('nahawand'), 700);
    case 'kurd':
      // Kurd: lower kurd + nahawand upper joined at 700c
      return composeMaqam('kurd', jins('kurd'), jins('nahawand'), 700);
    case 'nahawand':
      // Nahawand: lower nahawand + kurd upper joined at 700c
      return composeMaqam('nahawand', jins('nahawand'), jins('kurd'), 700);
    case 'saba':
      // Saba uses its own special lower jins joined to hijaz at 400c (saba's tritonic structure)
      return composeMaqam('saba', jins('saba'), jins('hijaz'), 400);
    default: {
      // TypeScript exhaustiveness guard
      const _: never = name;
      throw new RangeError(
        `Unknown maqam '${String(_)}'. Valid names: ${VALID_MAQAM_NAMES.join(', ')}`,
      );
    }
  }
}

/** Compose any two jins into a maqam with a given join offset (default = 500c, perfect 4th). */
export function composeMaqam(name: string, lower: Jins, upper: Jins, joinCents = 500): Maqam {
  const combined = [...lower.cents, ...upper.cents.map((c) => c + joinCents)];

  // Dedupe (round to 1 decimal place) and sort ascending
  const rounded = combined.map((c) => Math.round(c * 10) / 10);
  const unique = Array.from(new Set(rounded)).sort((a, b) => a - b);

  return { name, lower, upper, cents: unique };
}
