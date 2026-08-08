/**
 * Designing a timbre to fit a scale — the inverse of {@link spectrumToTuning}.
 *
 * This library's central claim is that consonance is a property of the *pair*
 * (spectrum, tuning), not of intervals in the abstract. `spectrumToTuning` reads
 * that relation in one direction: given a timbre, find the scale whose steps sit
 * at the minima of its dissonance curve. This module reads it in the other:
 * **given a scale, build a timbre that makes that scale consonant.**
 *
 * The construction follows Sethares: take a harmonic template and move each
 * partial to the nearest pitch the tuning actually contains. A partial then
 * coincides with a scale degree instead of falling between two of them, so the
 * beating that produces sensory dissonance lines up with the scale rather than
 * fighting it. The payoff is largest exactly where 12-TET intuition fails — an
 * EDO like 13, which approximates the harmonic series poorly, is markedly more
 * consonant under a timbre built for it than under a harmonic one.
 *
 * Reference: W. A. Sethares, *Tuning, Timbre, Spectrum, Scale* (2nd ed.) —
 * "methods of adapting sounds for arbitrary scales… one can design tunings for
 * given timbres, and vice versa".
 */
import { CENTS_PER_OCTAVE } from './ratio.js';
import { pitchToCents } from './cents.js';
import { type TuningSystem } from './tuning.js';
import { type Spectrum, harmonicSpectrum } from './spectrum.js';

/** Options for {@link inducedSpectrum}. */
export interface InducedSpectrumOptions {
  /** How many partials to place. Default 6 (matches {@link harmonicSpectrum}). */
  readonly partials?: number;
  /** Per-partial amplitude rolloff, as in {@link harmonicSpectrum}. Default 0.88. */
  readonly rolloff?: number;
}

/**
 * Snap a frequency ratio onto the nearest pitch of `tuning`'s repeating lattice.
 *
 * The lattice extends over every period, so a partial many octaves up still has
 * a nearest scale pitch. Returns the snapped ratio (> 0).
 */
function snapRatioToTuning(ratio: number, degreeCents: readonly number[], period: number): number {
  const cents = CENTS_PER_OCTAVE * Math.log2(ratio);
  // Which period the partial falls in, and where inside it.
  const periodIndex = Math.floor(cents / period);
  const within = cents - periodIndex * period;
  let bestCents = Number.NaN;
  let bestDist = Infinity;
  // Consider this period and the next one up, so a partial just below a period
  // boundary can snap upward to the next period's root.
  for (const offset of [0, period]) {
    for (const d of degreeCents) {
      const candidate = d + offset;
      const dist = Math.abs(candidate - within);
      if (dist < bestDist) {
        bestDist = dist;
        bestCents = candidate;
      }
    }
  }
  return 2 ** ((periodIndex * period + bestCents) / CENTS_PER_OCTAVE);
}

/**
 * Build a timbre whose partials land on the pitches of `tuning`.
 *
 * Each partial of a harmonic template is moved to the nearest pitch in the
 * tuning's lattice; amplitudes are unchanged. The first partial is always the
 * fundamental (ratio 1), since the tuning's root is a lattice pitch.
 *
 * @throws {RangeError} if `partials` < 1, `rolloff` is not in (0, 1], or the
 *   tuning has no degrees.
 *
 * @example
 * // A timbre made for 13-EDO, which the harmonic series fits badly.
 * const spec = inducedSpectrum(edo(13));
 * chordDissonance([220, 220 * 2 ** (4 / 13)], spec); // lower than with harmonicSpectrum()
 */
export function inducedSpectrum(tuning: TuningSystem, opts: InducedSpectrumOptions = {}): Spectrum {
  const partials = opts.partials ?? 6;
  const rolloff = opts.rolloff ?? 0.88;
  if (!Number.isInteger(partials) || partials < 1) {
    throw new RangeError(`partials must be a positive integer, got ${partials}`);
  }
  if (!(rolloff > 0) || rolloff > 1) {
    throw new RangeError(`rolloff must be in (0, 1], got ${rolloff}`);
  }
  if (tuning.degrees.length === 0) {
    throw new RangeError(`tuning '${tuning.id}' has no degrees`);
  }
  const degreeCents = tuning.degrees.map((d) => pitchToCents(d));
  const period = tuning.periodCents;
  return harmonicSpectrum(partials, rolloff).map((p) => ({
    ratio: snapRatioToTuning(p.ratio, degreeCents, period),
    amplitude: p.amplitude,
  }));
}

/**
 * Total absolute deviation, in cents, between a harmonic template and the
 * timbre induced for `tuning` — how far a timbre must be bent to suit the
 * tuning, and therefore how much this technique has to offer it.
 *
 * Near zero for tunings that already approximate the harmonic series (12-EDO);
 * large for those that do not (13-EDO), which are precisely the tunings where
 * a purpose-built timbre helps most.
 *
 * @throws {RangeError} on the same conditions as {@link inducedSpectrum}.
 */
export function spectrumBendCents(tuning: TuningSystem, opts: InducedSpectrumOptions = {}): number {
  const induced = inducedSpectrum(tuning, opts);
  const template = harmonicSpectrum(opts.partials ?? 6, opts.rolloff ?? 0.88);
  let total = 0;
  induced.forEach((p, i) => {
    const ref = template[i]!.ratio;
    total += Math.abs(CENTS_PER_OCTAVE * Math.log2(p.ratio / ref));
  });
  return total;
}
