/** Tuning preset schema with mandatory provenance (CARE/OCAP). Data is curated, not bulk-imported. */

import { type Pitch, cents, fromRatio } from '../core/cents.js';
import { ratio } from '../core/ratio.js';
import { type TuningSystem, defineTuning } from '../core/tuning.js';

/** Where a tuning value comes from. Required — never strip numbers from their context (B1). */
export interface Provenance {
  /** Citation: author/work/year. */
  readonly citation: string;
  readonly url?: string;
  /** Reuse license of the source data (e.g. 'CC-BY-4.0', 'public-domain', 'cite-only'). */
  readonly license: string;
}

/** A degree expressed in source form: cents string or ratio "n/d". Preserves representation. */
export type DegreeSpec = number | string;

export interface TuningPreset {
  readonly id: string;
  readonly name: string;
  /** Original-language / emic name where applicable. */
  readonly localName?: string;
  readonly referenceHz: number;
  readonly periodCents: number;
  readonly degrees: readonly DegreeSpec[];
  readonly source: 'measured' | 'theoretical';
  /** Cultural origin — required for non-Western/traditional tunings (CARE: don't decontextualize). */
  readonly culturalContext?: string;
  readonly region?: string;
  readonly community?: string;
  /** This is one documented example, never "the" tuning. */
  readonly note: string;
  readonly provenance: Provenance;
}

const RATIO_RE = /^\d+(\/\d+)?$/;

/** Parse a single degree spec into a Pitch (number=cents, "n/d" or "n"=ratio). */
function parseDegree(spec: DegreeSpec): Pitch {
  if (typeof spec === 'number') return cents(spec);
  if (!RATIO_RE.test(spec)) throw new RangeError(`invalid degree spec: ${spec}`);
  const [n, d] = spec.includes('/') ? spec.split('/') : [spec, '1'];
  return fromRatio(ratio(Number.parseInt(n as string, 10), Number.parseInt(d as string, 10)));
}

/**
 * Validate a preset's provenance/ethics metadata, then build a validated TuningSystem.
 * Enforces CARE: measured non-Western data must carry citation + cultural context.
 */
export function loadTuningPreset(p: TuningPreset): TuningSystem {
  if (!p.provenance?.citation) throw new RangeError(`preset '${p.id}' missing provenance.citation`);
  if (!p.provenance.license) throw new RangeError(`preset '${p.id}' missing provenance.license`);
  if (!p.note) throw new RangeError(`preset '${p.id}' missing note (one-example disclaimer)`);
  if (p.source === 'measured' && !p.culturalContext && !p.region) {
    throw new RangeError(`measured preset '${p.id}' must record cultural context or region (CARE)`);
  }
  const degrees = p.degrees.map(parseDegree);
  // Scala convention lists the period (e.g. 2/1) as the final degree; our tuning
  // normalizes degrees into [0, period), so drop a trailing degree that equals the period.
  const centsVals = degrees.map((d) =>
    d.kind === 'cents' ? d.cents : 1200 * Math.log2(d.ratio.num / d.ratio.den),
  );
  const trimmed =
    centsVals.length > 0 && Math.abs((centsVals.at(-1) as number) - p.periodCents) < 1e-6
      ? degrees.slice(0, -1)
      : degrees;
  // Ensure degree 0 (1/1) is present at the front.
  const withRoot =
    trimmed.length > 0 && Math.abs(centsVals[0] as number) < 1e-6
      ? trimmed
      : [cents(0), ...trimmed];
  return defineTuning({
    id: p.id,
    name: p.name,
    referenceHz: p.referenceHz,
    periodCents: p.periodCents,
    degrees: withRoot,
    source: p.source,
    ...(p.region !== undefined ? { region: p.region } : {}),
  });
}

/** Load many presets; collects attribution lines for a NOTICE file. */
export function loadAll(presets: readonly TuningPreset[]): {
  tunings: TuningSystem[];
  attributions: string[];
} {
  const tunings = presets.map(loadTuningPreset);
  const attributions = presets.map(
    (p) => `${p.name} — ${p.provenance.citation} (${p.provenance.license})`,
  );
  return { tunings, attributions };
}
