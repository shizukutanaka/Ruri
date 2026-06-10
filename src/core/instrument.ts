/** Fretted string instruments (guitar, bass, ...) parameterised by tuning, frets, capo. */

export interface StringInstrument {
  readonly id: string;
  readonly name: string;
  /** Open-string pitches in cents (absolute, low to high). Length = string count. */
  readonly openStringsCents: readonly number[];
  readonly fretCount: number;
  /** Cents per fret. 100 = 12-TET; set otherwise for microtonal frets. */
  readonly fretStepCents: number;
  /** Capo position in frets (0 = none). */
  readonly capo: number;
}

const C = 100;

/** Standard 6-string guitar EADGBE, 12-TET, 22 frets. Cents relative to E2 = 0. */
export function guitarStandard(): StringInstrument {
  return {
    id: 'guitar-standard',
    name: 'Guitar (standard EADGBE)',
    openStringsCents: [0, 500, 1000, 1500, 1900, 2400],
    fretCount: 22,
    fretStepCents: C,
    capo: 0,
  };
}

/** Standard 4-string bass EADG, 12-TET, 20 frets. Cents relative to E1 = 0. */
export function bassStandard(): StringInstrument {
  return {
    id: 'bass-standard',
    name: 'Bass (standard EADG)',
    openStringsCents: [0, 500, 1000, 1500],
    fretCount: 20,
    fretStepCents: C,
    capo: 0,
  };
}

/** A single playable position: which string, which fret. */
export interface StringPosition {
  readonly string: number;
  readonly fret: number;
  readonly cents: number;
}

const NEARLY = 1e-6;

/**
 * All (string, fret) positions producing `targetCents` (within tolerance), respecting capo.
 * Microtonal-aware: uses fretStepCents, never assumes 12-TET.
 */
export function positionsFor(
  inst: StringInstrument,
  targetCents: number,
  toleranceCents = 1,
): StringPosition[] {
  const out: StringPosition[] = [];
  for (let s = 0; s < inst.openStringsCents.length; s++) {
    const open = inst.openStringsCents[s] as number;
    const minFret = inst.capo;
    for (let f = minFret; f <= inst.fretCount; f++) {
      const c = open + f * inst.fretStepCents;
      if (Math.abs(c - targetCents) <= toleranceCents + NEARLY) {
        out.push({ string: s, fret: f, cents: c });
      }
    }
  }
  return out;
}
