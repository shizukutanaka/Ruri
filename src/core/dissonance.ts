import { type Spectrum, type RealizedPartial, realizeSpectrum } from './spectrum.js';
import { freqToCents, pitchToCents } from './cents.js';
import { type TuningSystem, defineTuning } from './tuning.js';
import { type Chord, realizeChordFreqs } from './chord.js';

/** A chord with its computed dissonance score, as returned by `rankChordsByDissonance`. */
export interface RankedChordByDissonance {
  /** The original chord. */
  readonly chord: Chord;
  /** Sensory dissonance score (lower = more consonant). */
  readonly dissonance: number;
}

// Sethares sensory-dissonance model constants (Plomp-Levelt based).
const DSTAR = 0.24;
const S1 = 0.0207;
const S2 = 18.96;
const A1 = 3.5;
const A2 = 5.75;

/**
 * Sensory dissonance between two partials (Sethares / Plomp-Levelt).
 * Non-negative (A1 < A2), symmetric, zero when frequencies coincide.
 * High-risk numeric (I7): validated by property + known-minima tests.
 */
export function dissonancePair(a: RealizedPartial, b: RealizedPartial): number {
  const fmin = Math.min(a.freq, b.freq);
  const df = Math.abs(a.freq - b.freq);
  const s = DSTAR / (S1 * fmin + S2);
  const lmin = Math.min(a.amp, b.amp);
  return lmin * (Math.exp(-A1 * s * df) - Math.exp(-A2 * s * df));
}

/** Total dissonance of a set of partials = sum over all unordered pairs. */
export function totalDissonance(partials: readonly RealizedPartial[]): number {
  let d = 0;
  for (let i = 0; i < partials.length; i++) {
    for (let j = i + 1; j < partials.length; j++) {
      d += dissonancePair(partials[i] as RealizedPartial, partials[j] as RealizedPartial);
    }
  }
  return d;
}

/** Dissonance of a chord (member fundamentals) rendered with a given timbre. */
export function chordDissonance(freqs: readonly number[], spectrum: Spectrum): number {
  const all = freqs.flatMap((f) => realizeSpectrum(spectrum, f));
  return totalDissonance(all);
}

/**
 * Dissonance of a `Chord` object realized at a given root frequency.
 *
 * Socratic Q85: `chordDissonance(freqs, spectrum)` already computes sensory
 * dissonance for a list of Hz values, and `realizeChordFreqs(chord, rootHz)`
 * turns a `Chord` into Hz — but going from a `Chord` object directly to its
 * dissonance score without manually calling `realizeChordFreqs` first still
 * requires two explicit steps. If `Chord` is truly first-class, evaluating its
 * acoustic consonance should be one call.
 *
 * @example
 * const justMajor = chordFromRatios('just-major', [[1,1],[5,4],[3,2]]);
 * const d = chordObjectDissonance(justMajor, 261.63, harmonicSpectrum());
 * // d is the sensory dissonance of the realized just major triad
 */
export function chordObjectDissonance(chord: Chord, rootHz: number, spectrum: Spectrum): number {
  return chordDissonance(realizeChordFreqs(chord, rootHz), spectrum);
}

/** Sensory-dissonance curve: dyad of `fundamentalHz` against fundamentalHz * ratio. */
export function dissonanceCurve(
  spectrum: Spectrum,
  fundamentalHz: number,
  ratios: readonly number[],
): number[] {
  return ratios.map((r) => chordDissonance([fundamentalHz, fundamentalHz * r], spectrum));
}

/**
 * Indices of strict local minima in a sampled curve (interior points).
 * Index i is a local minimum iff curve[i] is strictly below the nearest differing
 * neighbour on both sides. A flat plateau is reported once at its first index;
 * plateaus touching either end of the array are not reported.
 */
export function localMinima(curve: readonly number[]): number[] {
  const out: number[] = [];
  let i = 1;
  while (i < curve.length - 1) {
    const prev = curve[i - 1] as number;
    const cur = curve[i] as number;
    if (cur < prev) {
      let j = i;
      while (j + 1 < curve.length && (curve[j + 1] as number) === cur) j++;
      if (j + 1 < curve.length && (curve[j + 1] as number) > cur) out.push(i);
      i = j + 1;
    } else {
      i++;
    }
  }
  return out;
}

/** A consonant interval discovered from a timbre's dissonance curve. */
export interface ConsonantInterval {
  /** Frequency ratio relative to the fundamental (e.g. 1.5 ≈ a perfect fifth). */
  readonly ratio: number;
  /** The same interval in cents: 1200·log2(ratio). */
  readonly cents: number;
  /** Sensory dissonance at this interval (lower = more consonant). */
  readonly dissonance: number;
}

export interface ConsonantIntervalsOptions {
  /** Lowest ratio to scan, exclusive of unison artifacts (default 1.0 = unison). */
  readonly minRatio?: number;
  /** Highest ratio to scan (default 2.0 = octave). */
  readonly maxRatio?: number;
  /** Number of samples across [minRatio, maxRatio] (default 1001; >= 3). */
  readonly steps?: number;
  /** Fundamental frequency used to realize the spectrum (default 261.63 Hz ≈ C4). */
  readonly fundamentalHz?: number;
}

/**
 * Consonant intervals FOR A GIVEN TIMBRE — the library's central thesis as one call.
 *
 * Consonance is not a fixed list of Western interval names; it is a property of the
 * instrument's SPECTRUM. This scans the sensory-dissonance curve over
 * [minRatio, maxRatio] and returns its local minima as (ratio, cents, dissonance),
 * ascending by ratio. A harmonic spectrum yields the just intervals (4/3, 3/2, 5/4…);
 * a `bellSpectrum()` yields a DIFFERENT set from the very same scan. Same algorithm,
 * different timbre, different consonances.
 *
 * Reuses `dissonanceCurve` + `localMinima`; the result is a thin, documented mapping
 * back to musical units. For finer resolution near a target interval, raise `steps`
 * or narrow [minRatio, maxRatio].
 */
export function consonantIntervals(
  spectrum: Spectrum,
  opts?: ConsonantIntervalsOptions,
): ConsonantInterval[] {
  const minRatio = opts?.minRatio ?? 1.0;
  const maxRatio = opts?.maxRatio ?? 2.0;
  const steps = opts?.steps ?? 1001;
  const fundamentalHz = opts?.fundamentalHz ?? 261.63;

  // Fail fast (I7): a malformed scan window silently yields empty/garbage minima.
  if (!Number.isFinite(minRatio) || minRatio <= 0) {
    throw new RangeError(`minRatio must be a finite number > 0, got ${minRatio}`);
  }
  if (!Number.isFinite(maxRatio) || maxRatio <= minRatio) {
    throw new RangeError(`maxRatio (${maxRatio}) must be a finite number > minRatio (${minRatio})`);
  }
  if (!Number.isInteger(steps) || steps < 3) {
    throw new RangeError(`steps must be an integer >= 3, got ${steps}`);
  }
  if (!Number.isFinite(fundamentalHz) || fundamentalHz <= 0) {
    throw new RangeError(`fundamentalHz must be a finite number > 0, got ${fundamentalHz}`);
  }

  const ratios = Array.from(
    { length: steps },
    (_, i) => minRatio + ((maxRatio - minRatio) * i) / (steps - 1),
  );
  const curve = dissonanceCurve(spectrum, fundamentalHz, ratios);
  return localMinima(curve).map((i) => {
    const ratio = ratios[i] as number;
    return { ratio, cents: freqToCents(ratio, 1), dissonance: curve[i] as number };
  });
}

/**
 * Options for `spectrumToTuning`. Extends `ConsonantIntervalsOptions` with
 * tuning identity fields.
 */
export interface SpectrumToTuningOptions extends ConsonantIntervalsOptions {
  /** `TuningSystem.id` for the derived tuning (default `'spectrum-derived'`). */
  readonly id?: string;
  /** Reference frequency in Hz (default 440). */
  readonly referenceHz?: number;
  /** Period in cents (default 1200 — octave). */
  readonly periodCents?: number;
}

/**
 * Derive a `TuningSystem` from the consonant intervals of a timbre.
 *
 * This is the capstone of the library's central thesis:
 * **"Consonance is timbre-dependent, therefore the optimal tuning is also
 * timbre-dependent."**
 *
 * `consonantIntervals(harmonic)` → the just intervals (5/4, 4/3, 3/2…) →
 * `spectrumToTuning(harmonic)` yields a tuning built on those just intervals.
 * `spectrumToTuning(bell)` yields an entirely different tuning — not 12-TET,
 * not just intonation, but the tuning that is acoustically optimal for bell
 * resonance.
 *
 * The returned `TuningSystem` is immediately usable with the full pipeline:
 * `rankChords`, `mtsBulkDump`, `tuningToScl`, `fingerChord`, etc.
 */
export function spectrumToTuning(spectrum: Spectrum, opts?: SpectrumToTuningOptions): TuningSystem {
  const periodCents = opts?.periodCents ?? 1200;
  const intervals = consonantIntervals(spectrum, opts);
  const aboveRoot = intervals.filter((iv) => iv.cents > 0 && iv.cents < periodCents);
  const degrees = [
    { kind: 'cents' as const, cents: 0 },
    ...aboveRoot.map((iv) => ({ kind: 'cents' as const, cents: iv.cents })),
  ];
  return defineTuning({
    id: opts?.id ?? 'spectrum-derived',
    name: opts?.id ?? 'Spectrum-derived tuning',
    referenceHz: opts?.referenceHz ?? 440,
    periodCents,
    degrees,
    source: 'theoretical' as const,
  });
}

/** Result of `tuningSuitability`. */
export interface TuningSuitabilityResult {
  /** Fraction of consonant intervals captured within `toleranceCents` (0–1). */
  readonly coverage: number;
  /** Average distance in cents from each consonant interval to its nearest tuning degree. */
  readonly avgErrorCents: number;
  /** Total number of consonant intervals discovered in the spectrum scan. */
  readonly totalConsonantIntervals: number;
  /** Number matched within `toleranceCents` of a tuning degree. */
  readonly matchedCount: number;
}

/**
 * Measure how well an existing `TuningSystem` covers the consonant intervals of a timbre.
 *
 * This is the **inverse** of `spectrumToTuning`: instead of *building* the optimal tuning
 * for a timbre, this *evaluates* how close an existing tuning already is.
 *
 * Core thesis application: `tuningSuitability(edo(12), harmonicSpectrum())` shows that
 * 12-TET approximates the just intervals well; `tuningSuitability(edo(12), bellSpectrum())`
 * shows poorer fit — confirming that 12-TET was optimised for harmonic timbres, not bells.
 * `tuningSuitability(spectrumToTuning(bellSpectrum()), bellSpectrum())` gives coverage = 1
 * by construction, providing a reference ceiling.
 *
 * @param toleranceCents - Max distance (in cents) from a tuning degree to count as a match.
 *   Default 25 (≈ a quarter-tone), matching the coarse resolution of the scan.
 */
export function tuningSuitability(
  tuning: TuningSystem,
  spectrum: Spectrum,
  opts?: ConsonantIntervalsOptions & { readonly toleranceCents?: number },
): TuningSuitabilityResult {
  const toleranceCents = opts?.toleranceCents ?? 25;
  const intervals = consonantIntervals(spectrum, opts);

  if (intervals.length === 0) {
    return { coverage: 1, avgErrorCents: 0, totalConsonantIntervals: 0, matchedCount: 0 };
  }

  const tuningCents = tuning.degrees.map((d) => pitchToCents(d));

  let totalError = 0;
  let matchedCount = 0;

  for (const iv of intervals) {
    let minError = Infinity;
    for (const tc of tuningCents) {
      const err = Math.abs(iv.cents - tc);
      if (err < minError) minError = err;
    }
    totalError += minError;
    if (minError <= toleranceCents) matchedCount++;
  }

  return {
    coverage: matchedCount / intervals.length,
    avgErrorCents: totalError / intervals.length,
    totalConsonantIntervals: intervals.length,
    matchedCount,
  };
}

/** One entry in the ranked-tunings leaderboard returned by `rankTuningsByFit`. */
export interface RankedTuning {
  /** The tuning system. */
  readonly tuning: TuningSystem;
  /** Index into the original `tunings` input array. */
  readonly index: number;
  /** Full suitability result for this tuning against the spectrum. */
  readonly suitability: TuningSuitabilityResult;
}

/**
 * Rank a list of tuning systems by how well they fit a given timbre, best first.
 *
 * Socratic Q56: `tuningSuitability(tuning, spectrum)` measures how well one tuning
 * fits a timbre, but comparing multiple candidates (e.g. `[edo(12), edo(19), edo(31),
 * spectrumToTuning(spectrum)]`) still requires a manual loop and sort. If suitability
 * measurement is first-class, so is ranking a leaderboard of candidates.
 *
 * Primary sort: coverage descending (more consonant intervals captured = better).
 * Tie-break: avgErrorCents ascending (smaller tuning error = better).
 *
 * @example
 * const ranked = rankTuningsByFit([edo(12), edo(19), edo(31)], bellSpectrum());
 * // ranked[0] is the EDO that best covers bell-spectrum consonances
 * console.log(ranked.map(r => `${r.tuning.id}: coverage=${r.suitability.coverage}`));
 */
export function rankTuningsByFit(
  tunings: readonly TuningSystem[],
  spectrum: Spectrum,
  opts?: ConsonantIntervalsOptions & { readonly toleranceCents?: number },
): RankedTuning[] {
  return tunings
    .map((tuning, index) => ({
      tuning,
      index,
      suitability: tuningSuitability(tuning, spectrum, opts),
    }))
    .sort((a, b) => {
      const covDiff = b.suitability.coverage - a.suitability.coverage;
      if (covDiff !== 0) return covDiff;
      return a.suitability.avgErrorCents - b.suitability.avgErrorCents;
    });
}

/**
 * Dissonance trace over a chord progression — one number per chord.
 *
 * Socratic Q90: `chordObjectDissonance(chord, rootHz, spectrum)` scores one
 * chord at a time, but tracing how tension moves through a whole progression
 * still requires a manual `map`. If `Chord` progressions are first-class,
 * evaluating the dissonance arc should be a single call.
 *
 * Returns `number[]` where `result[i]` is the sensory dissonance of
 * `chords[i]` realized at `rootHz` with the given `spectrum`. Useful for
 * visualizing tension/resolution arcs (e.g. plotting dissonance over time).
 *
 * @example
 * const chords = [major, dominant7, major]; // I – V7 – I
 * const curve = progressionDissonanceCurve(chords, 261.63, harmonicSpectrum());
 * // curve[1] > curve[0] — the dominant 7th is more dissonant than the tonic
 */
export function progressionDissonanceCurve(
  chords: readonly Chord[],
  rootHz: number,
  spectrum: Spectrum,
): number[] {
  return chords.map((chord) => chordObjectDissonance(chord, rootHz, spectrum));
}

/**
 * Sort a list of `Chord` objects by sensory dissonance, most consonant first.
 *
 * Socratic Q91: `chordObjectDissonance(chord, rootHz, spectrum)` scores one
 * chord — but sorting a list of already-discovered chords by consonance still
 * requires a manual map + sort. If dissonance is first-class, ranking should
 * be a single call.
 *
 * Distinct from `rankChords` (which *enumerates* all degree subsets of a
 * tuning); this operates on an explicit `Chord[]` you supply — useful after
 * chord search, scale analysis, or any ad-hoc collection.
 *
 * Returns a new array sorted by `dissonance` ascending (lowest = most
 * consonant). The original array is not mutated.
 *
 * @example
 * const chords = [dominantSeventh, majorTriad, diminished];
 * const ranked = rankChordsByDissonance(chords, 261.63, harmonicSpectrum());
 * // ranked[0] is the most consonant chord
 */
export function rankChordsByDissonance(
  chords: readonly Chord[],
  rootHz: number,
  spectrum: Spectrum,
): RankedChordByDissonance[] {
  return chords
    .map((chord) => ({ chord, dissonance: chordObjectDissonance(chord, rootHz, spectrum) }))
    .sort((a, b) => a.dissonance - b.dissonance);
}
