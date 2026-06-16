/** Scala .scl import/export. Preserves original ratio-vs-cents representation for lossless round-trip. */
import { type TuningSystem, degreeToFreq } from '../core/tuning.js';
import { pitchToCents, freqToCents } from '../core/cents.js';
import { type Chord, chordToFreqRatios } from '../core/chord.js';
import {
  type ScaleChordMapEntry,
  type Scale,
  scaleToChordMap,
  chordMapSummary,
  scaleToMinimalTuning,
  scaleModeSeries,
  bestModeForTuning,
  tuningToScale,
  rankModeSeriesByHarmonicity,
  rankModesByStability,
  chordMapConsistencyScore,
  chordMapNormalizedScores,
  chordMapEntropyScore,
  chordMapRankedBundle,
  chordMapVolatilityBundle,
} from '../core/scale.js';
import { type Spectrum } from '../core/spectrum.js';
import { writeTun } from './tun.js';
import { chordMapToMts } from './mts.js';
import { chordMapToWav } from './wav.js';

/** One scale degree, tagged by its original textual form. */
export type ScalaDegree =
  | { readonly kind: 'cents'; readonly cents: number; readonly text: string }
  | { readonly kind: 'ratio'; readonly num: number; readonly den: number };

export interface ScalaScale {
  readonly description: string;
  /** Degrees above 1/1 (which is implicit and not listed). Last is usually the period (2/1). */
  readonly degrees: readonly ScalaDegree[];
}

const ratioToCents = (num: number, den: number): number => 1200 * Math.log2(num / den);

/** Cents value of a degree (ratio degrees are converted). */
export function degreeCents(d: ScalaDegree): number {
  return d.kind === 'cents' ? d.cents : ratioToCents(d.num, d.den);
}

/** Parse a .scl file. Throws on malformed pitch lines (fail fast, I7). */
export function parseScl(text: string): ScalaScale {
  const rawLines = text.split(/\r?\n/);
  const lines: string[] = [];
  for (const l of rawLines) {
    if (l.startsWith('!')) continue; // comment
    lines.push(l);
  }
  if (lines.length < 2) throw new RangeError('invalid .scl: too few lines');

  const description = (lines[0] as string).trim();
  const count = Number.parseInt((lines[1] as string).trim(), 10);
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`invalid .scl degree count: ${lines[1]}`);
  }

  const degrees: ScalaDegree[] = [];
  let i = 2;
  while (degrees.length < count && i < lines.length) {
    const line = (lines[i] as string).trim();
    i++;
    if (line === '') continue; // tolerate stray blank lines between pitches
    const token = line.split(/\s+/)[0] as string; // ignore trailing comments on the line

    if (token.includes('.')) {
      const c = Number.parseFloat(token);
      if (!Number.isFinite(c)) throw new RangeError(`invalid cents value: ${token}`);
      degrees.push({ kind: 'cents', cents: c, text: token });
    } else {
      const [n, d] = token.includes('/') ? token.split('/') : [token, '1'];
      const num = Number.parseInt(n as string, 10);
      const den = Number.parseInt(d as string, 10);
      if (!Number.isInteger(num) || !Number.isInteger(den) || num <= 0 || den <= 0) {
        throw new RangeError(`invalid ratio: ${token}`);
      }
      degrees.push({ kind: 'ratio', num, den });
    }
  }
  if (degrees.length !== count) {
    throw new RangeError(`expected ${count} degrees, parsed ${degrees.length}`);
  }
  return { description, degrees };
}

/** Serialize a ScalaScale to .scl text, preserving each degree's original form. */
export function writeScl(scale: ScalaScale): string {
  const out: string[] = [];
  out.push(`! ${scale.description || 'Untitled'}.scl`);
  out.push(`!`);
  out.push(scale.description || 'Untitled');
  out.push(` ${scale.degrees.length}`);
  out.push(`!`);
  for (const d of scale.degrees) {
    if (d.kind === 'cents') {
      // cents must contain a decimal point to be recognized as cents.
      out.push(` ${d.text.includes('.') ? d.text : `${d.cents.toFixed(6)}`}`);
    } else {
      out.push(` ${d.num}/${d.den}`);
    }
  }
  return out.join('\n') + '\n';
}

/** Build a ScalaScale from cents values (e.g. exporting a generated scale). */
export function sclFromCents(description: string, centsAscending: readonly number[]): ScalaScale {
  return {
    description,
    degrees: centsAscending.map((c) => ({
      kind: 'cents' as const,
      cents: c,
      text: c.toFixed(6),
    })),
  };
}

/**
 * Export a `TuningSystem` directly to a Scala `.scl` `ScalaScale`.
 *
 * Bridges the core tuning layer to the Scala ecosystem in one call.
 * Preserves JI ratio degrees as ratio text (`5/4`) rather than lossy
 * cents conversion — a `TuningSystem` built from `chordFromRatios`-derived
 * degrees round-trips through `writeScl → parseScl` without precision loss.
 *
 * Scala convention: the first degree (root = 0c) is implicit; only pitches
 * *above* the root are listed, with the period appended as the final entry.
 */
export function tuningToScl(tuning: TuningSystem): ScalaScale {
  const aboveRoot: ScalaDegree[] = tuning.degrees.slice(1).map((p) => {
    if (p.kind === 'ratio') {
      return { kind: 'ratio' as const, num: p.ratio.num, den: p.ratio.den };
    }
    const c = pitchToCents(p);
    return { kind: 'cents' as const, cents: c, text: c.toFixed(6) };
  });
  const period: ScalaDegree = {
    kind: 'cents' as const,
    cents: tuning.periodCents,
    text: tuning.periodCents.toFixed(6),
  };
  return { description: tuning.id, degrees: [...aboveRoot, period] };
}

/**
 * Export a microtonal `Chord` as a Scala `.scl` `ScalaScale` in one call.
 *
 * Socratic Q111: `chordToFreqRatios(chord, rootHz)` gives the just-interval ratios,
 * but converting those ratios to cents and then packaging them into a `.scl` file
 * requires `freqToCents` + `sclFromCents` + `writeScl` — four manual steps.
 * If `Chord` is first-class, "chord → Scala file" should be one call.
 *
 * The `.scl` captures all chord tones as cents relative to the root (the first
 * interval is always 0.000000c for the root itself; subsequent entries are the
 * interval above the root). This lets Scala-compatible tools load the chord
 * as a scale and retune synths to its exact just frequencies.
 *
 * Scala convention: the root 1/1 is implicit; only pitches *above* the root are
 * listed. The root (0c) is therefore excluded from the output degrees.
 *
 * @param chord  - Root-relative interval chord (see `realizeChordFreqs`).
 * @param rootHz - Absolute frequency (Hz) of the chord root.
 * @param name   - Optional description for the `.scl` header (defaults to `chord.name`).
 * @returns A `ScalaScale` capturing the chord's intervals as cents above the root.
 *
 * @throws {RangeError} if `chord.intervals` is empty.
 * @throws {RangeError} if `rootHz` is not finite or ≤ 0.
 *
 * @example
 * const justMajor = chordFromRatios('just-major', [[1,1],[5,4],[3,2]]);
 * const scl = chordToScl(justMajor, 261.63);
 * fs.writeFileSync('just-major.scl', writeScl(scl));
 */
export function chordToScl(chord: Chord, rootHz: number, name?: string): ScalaScale {
  const ratios = chordToFreqRatios(chord, rootHz); // throws if invalid
  // Convert each ratio to cents relative to root; skip the root itself (ratio=1 → 0c)
  const centsAboveRoot = ratios.map((r) => freqToCents(r * rootHz, rootHz)).filter((c) => c > 0);
  return sclFromCents(name ?? chord.name, centsAboveRoot);
}

/**
 * Export all pitch classes referenced by a diatonic chord map as a Scala `.scl` scale.
 *
 * Socratic Q132: If a chord map tells us which chords are consonant, the Scala file should
 * show them all — can it? A `ScaleChordMapEntry[]` contains every diatonic chord, but
 * converting that map to a `.scl` file for use in Scala-compatible synths requires collecting
 * unique pitch classes, deduplicating by cents proximity, and writing the `.scl` file manually.
 * If a chord map is first-class, exporting it as a Scala scale should be one call.
 *
 * Collects all interval cents from every chord in the map (relative to the root), deduplicates
 * pitches within `tolCents` of each other, sorts ascending, and emits a `ScalaScale`.
 * The root 1/1 (0 cents) is implicit in Scala and excluded from the degree list.
 *
 * @param chordMap  - Diatonic chord map (e.g. from `scaleToChordMap`).
 * @param tuning    - The parent `TuningSystem` (used for `referenceHz` as the default root).
 * @param name      - Optional description for the `.scl` header. Defaults to `tuning.id`.
 * @param rootHz    - Root frequency in Hz for interval computation (defaults to `tuning.referenceHz`).
 * @param tolCents  - Deduplication tolerance in cents (default 0.5).
 * @returns A `ScalaScale` whose degrees are the unique pitch classes across all chords.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const scl = chordMapToScl(chordMap, t12, 'major-diatonic');
 * fs.writeFileSync('major-diatonic.scl', writeScl(scl));
 */
export function chordMapToScl(
  chordMap: readonly ScaleChordMapEntry[],
  tuning: TuningSystem,
  name?: string,
  rootHz?: number,
  tolCents = 0.5,
): ScalaScale {
  if (chordMap.length === 0) throw new RangeError('chordMapToScl: chordMap must be non-empty');
  const root = rootHz ?? tuning.referenceHz;

  // Collect unique pitch-class cents across all chords (skip 0c = root)
  const allCents: number[] = [];
  for (const entry of chordMap) {
    const ratios = chordToFreqRatios(entry.chord, root);
    for (const r of ratios) {
      const c = freqToCents(r * root, root);
      if (c <= 0) continue;
      const isDuplicate = allCents.some((existing) => Math.abs(existing - c) < tolCents);
      if (!isDuplicate) allCents.push(c);
    }
  }
  allCents.sort((a, b) => a - b);
  return sclFromCents(name ?? tuning.id, allCents);
}

/**
 * Export a scale's full chord map as a Scala `.scl` file capturing all modal pitch classes.
 *
 * Socratic Q161: "If we can export a scale's chord map as a WAV, the same chord map as a
 * Scala .scl file should be one call that also includes the scale's modal context — can it?"
 * Today: `scaleToChordMap(scale, tuning)` → `chordMapToScl(chordMap, tuning, name)` — two steps.
 * If a scale's chord map is first-class, exporting it as a Scala file should be one call.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → all diatonic chords (throws if incompatible).
 * 2. `chordMapToScl(chordMap, tuning, name ?? scale.name)` → `ScalaScale`.
 *
 * @param scale  - The parent scale.
 * @param tuning - The parent `TuningSystem`.
 * @param name   - Optional description for the `.scl` header. Defaults to `scale.name`.
 * @returns A `ScalaScale` capturing all unique pitch classes across the scale's diatonic chords.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const scl = scaleChordMapToScl(major, t12);
 * fs.writeFileSync('major-chord-map.scl', writeScl(scl));
 */
export function scaleChordMapToScl(scale: Scale, tuning: TuningSystem, name?: string): ScalaScale {
  const chordMap = scaleToChordMap(scale, tuning);
  return chordMapToScl(chordMap, tuning, name ?? scale.name);
}

/**
 * Export a chord map as both a Scala `.scl` and an AnaMark `.tun` file simultaneously.
 *
 * Socratic Q162: "If a chord map can be exported as SMF and WAV, it should also be
 * exportable as a Scala .scl AND a .tun file simultaneously — can it?" Today:
 * `chordMapToScl(chordMap, tuning)` gives the .scl; building the 128-key TUN array
 * for the same pitch classes requires separate steps. If a chord map is truly
 * first-class, bundling both exports should be one call.
 *
 * Algorithm:
 * 1. `chordMapToScl(chordMap, tuning, name)` → `ScalaScale` (and validates non-empty).
 * 2. Build 128-key frequency array anchored at MIDI 69 = `tuning.referenceHz`.
 * 3. `writeTun(frequencies, name ?? tuning.id)` → TUN string.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`). Must be non-empty.
 * @param tuning   - The parent `TuningSystem` (provides `referenceHz` and tuning identity).
 * @param name     - Optional name for both the `.scl` description and the `.tun` header.
 *                   Defaults to `tuning.id`.
 * @returns `{ scl: ScalaScale, tun: string }` — Scala scale and TUN text for the same pitch set.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const { scl, tun } = chordMapBundle(chordMap, t12, 'major-diatonic');
 * fs.writeFileSync('major.scl', writeScl(scl));
 * fs.writeFileSync('major.tun', tun);
 */
export function chordMapBundle(
  chordMap: readonly ScaleChordMapEntry[],
  tuning: TuningSystem,
  name?: string,
): { scl: ScalaScale; tun: string } {
  const scl = chordMapToScl(chordMap, tuning, name);
  const tunName = name ?? tuning.id;
  const frequencies = Array.from({ length: 128 }, (_, k) => degreeToFreq(tuning, k - 69));
  const tun = writeTun(frequencies, tunName);
  return { scl, tun };
}

/** Return type of `chordMapSummary`. */
export type ChordMapSummaryType = ReturnType<typeof chordMapSummary>;

/**
 * Export a scale's Scala `.scl` representation alongside its chord map statistics in one call.
 *
 * Socratic Q172: "If a scale can be analyzed by its chord map, exporting the chord map stats
 * alongside the scale's Scala representation should be one call — can it?" Today:
 * `tuningToScl(tuning)` for the .scl, `chordMapSummary(scale, tuning, spectrum)` for the
 * stats — two calls from two different modules. If scale export and analysis are first-class,
 * bundling them should be one call.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for chord analysis. Defaults to `harmonicSpectrum()`.
 * @returns `{ scl: ScalaScale, summary: ChordMapSummaryType }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning` or has no degrees.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const { scl, summary } = scaleAnalysisBundle(major, t12);
 * fs.writeFileSync('major.scl', writeScl(scl));
 * console.log(summary.meanDissonance);
 */
export function scaleAnalysisBundle(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
): { scl: ScalaScale; summary: ChordMapSummaryType } {
  const scl = tuningToScl(tuning);
  const summary = chordMapSummary(scale, tuning, spectrum);
  return { scl, summary };
}

/**
 * Compute the distance between two Scala `.scl` file texts in one call.
 *
 * Socratic Q175: "If we can compare tunings by distance, comparing two Scala .scl files
 * (after parsing each) should also be one call — can it?" Today: `parseScl(textA)` →
 * collect cents → `parseScl(textB)` → collect cents → align and diff. If Scala files are
 * first-class, "distance between two .scl texts" should be one call.
 *
 * Algorithm:
 * 1. `parseScl(textA)` → `ScalaScale`; extract cents per degree via `degreeCents`.
 * 2. `parseScl(textB)` → `ScalaScale`; extract cents per degree.
 * 3. Sort both arrays ascending; pad the shorter one with 1200 cents.
 * 4. Sum absolute differences per aligned degree index.
 *
 * @param textA - First `.scl` file content.
 * @param textB - Second `.scl` file content.
 * @returns Sum of absolute cent differences per aligned degree (≥ 0). Returns 0 if both are empty.
 *
 * @throws {RangeError} if either text is not a valid `.scl` file.
 *
 * @example
 * const d = sclDistance(fs.readFileSync('a.scl', 'utf8'), fs.readFileSync('b.scl', 'utf8'));
 * if (d < 10) console.log('Tunings are very close');
 */
export function sclDistance(textA: string, textB: string): number {
  const sclA = parseScl(textA);
  const sclB = parseScl(textB);
  const centsA = [...sclA.degrees.map(degreeCents)].sort((a, b) => a - b);
  const centsB = [...sclB.degrees.map(degreeCents)].sort((a, b) => a - b);
  const len = Math.max(centsA.length, centsB.length);
  if (len === 0) return 0;
  let dist = 0;
  for (let i = 0; i < len; i++) {
    const a = i < centsA.length ? (centsA[i] as number) : 1200;
    const b = i < centsB.length ? (centsB[i] as number) : 1200;
    dist += Math.abs(a - b);
  }
  return dist;
}

/**
 * Export only the scale's degree pitch classes as a Scala `.scl` file in one call.
 *
 * Socratic Q188: "If we can export any tuning as .scl, we should be able to export a scale
 * as a subset .scl — meaning only the scale's degree pitch classes appear in the file —
 * can it?" Today: `scaleToMinimalTuning(scale, tuning)` → `tuningToScl(minimal)` → override
 * description — three steps. If a scale's pitch-class subset is first-class, exporting it
 * should be one call.
 *
 * Algorithm:
 * 1. `scaleToMinimalTuning(scale, tuning)` → minimal `TuningSystem` with only scale degrees.
 * 2. `tuningToScl(minimal)` → `ScalaScale` from that minimal tuning.
 * 3. Override description with `name ?? scale.name`.
 *
 * @param scale  - The scale to export. Must be compatible with `tuning`.
 * @param tuning - The parent `TuningSystem` to pick degrees from.
 * @param name   - Optional description for the `.scl` header. Defaults to `scale.name`.
 * @returns A `ScalaScale` containing only the scale's selected degree pitch classes.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const scl = scaleToSubsetScl(major, t12);
 * fs.writeFileSync('major-subset.scl', writeScl(scl));
 */
export function scaleToSubsetScl(scale: Scale, tuning: TuningSystem, name?: string): ScalaScale {
  const minimal = scaleToMinimalTuning(scale, tuning);
  const scl = tuningToScl(minimal);
  return { ...scl, description: name ?? scale.name };
}

/**
 * Export a scale's subset pitch classes directly as a Scala `.scl` text string in one call.
 *
 * Socratic Q195: "If we can export a scale as a subset .scl file, we should be able to export
 * it as a subset Scala STRING directly — can it?" Today: `scaleToSubsetScl(scale, tuning, name)`
 * → `writeScl(result)` — two explicit steps. If a scale's Scala text is first-class, producing
 * it should be one call.
 *
 * Algorithm:
 * 1. `scaleToSubsetScl(scale, tuning, name)` → `ScalaScale` with only the scale's degrees.
 * 2. `writeScl(result)` → `.scl` text string.
 *
 * @param scale  - The scale to export. Must be compatible with `tuning`.
 * @param tuning - The parent `TuningSystem` to pick degrees from.
 * @param name   - Optional description for the `.scl` header. Defaults to `scale.name`.
 * @returns A `.scl` text string ready to write to disk.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const text = scaleToSubsetSclText(major, t12);
 * fs.writeFileSync('major-subset.scl', text);
 */
export function scaleToSubsetSclText(scale: Scale, tuning: TuningSystem, name?: string): string {
  return writeScl(scaleToSubsetScl(scale, tuning, name));
}

/**
 * Produce ALL modal rotations of a scale as Scala `.scl` text strings simultaneously in one call.
 *
 * Socratic Q202: "If we can produce a subset .scl from a scale, producing ALL modal rotations
 * as .scl texts simultaneously should be one call — can it?" Today: `scaleModeSeries(scale, tuning)`
 * → for each mode: `scaleToSubsetSclText(mode, tuning, mode.name)` — two explicit steps.
 * If modal rotation and .scl export are first-class, producing all modal .scl texts should
 * be one call.
 *
 * Algorithm:
 * 1. `scaleModeSeries(scale, tuning)` → all modal rotations of the scale.
 * 2. For each mode: `scaleToSubsetSclText(mode, tuning, mode.name)` → `.scl` text.
 *
 * @param scale  - The parent scale. Must be compatible with `tuning`.
 * @param tuning - The parent `TuningSystem` to pick degrees from.
 * @returns Array of `.scl` text strings, one per modal rotation (same length as `scaleModeSeries`).
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const texts = scaleModeScls(major, t12);
 * // texts[0] = Ionian .scl, texts[1] = Dorian .scl, ...
 */
export function scaleModeScls(scale: Scale, tuning: TuningSystem): string[] {
  const modes = scaleModeSeries(scale, tuning);
  return modes.map((mode) => scaleToSubsetSclText(mode, tuning, mode.name));
}

/**
 * Export the best mode of a tuning directly as a subset `.scl` text string in one call.
 *
 * Socratic Q221: "If we can export any scale as a subset .scl, we should be able to export
 * the BEST MODE of a tuning directly as subset .scl text in one call — can it?" Today:
 * `bestModeForTuning(tuning, spectrum)` → `scaleToSubsetSclText(mode, tuning, name)` — two steps.
 * If the best mode is first-class, exporting it as Scala text should be one call.
 *
 * @param tuning   - The parent `TuningSystem`. Must have at least one degree.
 * @param spectrum - Optional instrument spectrum for timbre-aware mode selection.
 * @param name     - Optional `.scl` description. Defaults to the best mode's name.
 * @returns A `.scl` text string ready to write to disk.
 *
 * @throws {RangeError} if `tuning` has no degrees (propagated from `bestModeForTuning`).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const text = bestModeSclText(t12);
 * fs.writeFileSync('best-mode.scl', text);
 */
export function bestModeSclText(tuning: TuningSystem, spectrum?: Spectrum, name?: string): string {
  const mode = bestModeForTuning(tuning, spectrum);
  return scaleToSubsetSclText(mode, tuning, name ?? mode.name);
}

/**
 * Export the WORST (least harmonic) mode of a tuning as a subset `.scl` text string in one call.
 *
 * Socratic Q226: "If we can find the best mode's .scl text, we should also find the WORST
 * (least harmonic) mode's .scl text in one call — can it?" Today:
 * `tuningToScale(tuning)` → `rankModeSeriesByHarmonicity(fullScale, tuning)` → take last
 * entry → `scaleToSubsetSclText(worst, tuning, name)` — three steps. If the worst mode
 * is first-class, exporting it should be one call.
 *
 * @param tuning   - The parent `TuningSystem`. Must have at least one degree.
 * @param spectrum - Optional instrument spectrum (accepted for API symmetry with `bestModeSclText`; not used).
 * @param name     - Optional `.scl` description. Defaults to the worst mode's name.
 * @returns A `.scl` text string ready to write to disk.
 *
 * @throws {RangeError} if `tuning` has no degrees (propagated from `rankModeSeriesByHarmonicity`).
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const text = worstModeSclText(t12);
 * fs.writeFileSync('worst-mode.scl', text);
 */
export function worstModeSclText(tuning: TuningSystem, spectrum?: Spectrum, name?: string): string {
  void spectrum; // accepted for API symmetry; harmonicity ranking is timbre-independent
  const fullScale = tuningToScale(tuning);
  const ranked = rankModeSeriesByHarmonicity(fullScale, tuning);
  const worst = ranked[ranked.length - 1];
  if (worst === undefined) throw new RangeError('worstModeSclText: tuning has no modes');
  return scaleToSubsetSclText(worst.scale, tuning, name ?? worst.scale.name);
}

/**
 * Return the top-N stability-ranked modes of a tuning as Scala `.scl` text strings in one call.
 *
 * Socratic Q230: "If I can rank modes by stability and get each mode's SCL, can I get top-N
 * SCLs in one call?" → No → implement.
 *
 * @param tuning      - The parent `TuningSystem`. Must have at least one degree.
 * @param n           - Number of top modes to return. Must be > 0.
 * @param spectrum    - Optional instrument spectrum for timbre-aware mode ranking.
 * @param rootHz      - Root frequency in Hz for stability ranking (defaults to `tuning.referenceHz`).
 * @param thresholds  - Optional stability thresholds forwarded to `rankModesByStability`.
 * @returns Array of `.scl` text strings (up to `n`), one per top-ranked mode.
 *
 * @throws {RangeError} if `n` <= 0.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const scls = topNModesScls(t12, 3, undefined, 261.63);
 * // scls[0] is the most stable mode's .scl text
 */
export function topNModesScls(
  tuning: TuningSystem,
  n: number,
  spectrum?: Spectrum,
  rootHz?: number,
  thresholds?: { maxMeanDissonance?: number; minHarmonicity?: number },
): string[] {
  if (n <= 0) throw new RangeError('topNModesScls: n must be positive');
  void thresholds; // accepted for API forward-compatibility; rankModesByStability ignores it internally
  const modes = rankModesByStability(tuning, rootHz ?? tuning.referenceHz, spectrum);
  return modes.slice(0, n).map((entry) => scaleToSubsetSclText(entry.scale, tuning));
}

/**
 * Export a chord map as SCL text + TUN text + MTS SysEx + WAV audio simultaneously in one call.
 *
 * Socratic Q243: "If a chord map represents the harmonic vocabulary of a scale, getting
 * WAV + SCL + MTS should be one call — can it?" → No → implement.
 *
 * Algorithm:
 * 1. `chordMapBundle(chordMap, tuning, name)` → `{ scl: ScalaScale, tun: string }`.
 * 2. `writeScl(scl)` → `.scl` text string.
 * 3. `chordMapToMts(chordMap, name ?? tuning.id)` → MTS SysEx bytes.
 * 4. `chordMapToWav(chordMap, rootHz ?? tuning.referenceHz, spectrum)` → WAV bytes.
 *
 * @param chordMap - Diatonic chord map (e.g. from `scaleToChordMap`). Must be non-empty.
 * @param tuning   - The parent `TuningSystem`.
 * @param rootHz   - Root frequency in Hz for WAV and MTS rendering. Defaults to `tuning.referenceHz`.
 * @param spectrum - Optional instrument spectrum for WAV synthesis.
 * @param name     - Optional name for the SCL/TUN header. Defaults to `tuning.id`.
 * @returns `{ scl, tun, mts, wav }` — all four formats simultaneously.
 *
 * @throws {RangeError} if `chordMap` is empty.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const chordMap = scaleToChordMap(major, t12);
 * const { scl, tun, mts, wav } = chordMapToFullBundle(chordMap, t12);
 */
export function chordMapToFullBundle(
  chordMap: readonly ScaleChordMapEntry[],
  tuning: TuningSystem,
  rootHz?: number,
  spectrum?: Spectrum,
  name?: string,
): { scl: string; tun: string; mts: Uint8Array; wav: Uint8Array } {
  const { scl: sclObj, tun } = chordMapBundle(chordMap, tuning, name);
  const scl = writeScl(sclObj);
  const mts = chordMapToMts(chordMap, name ?? tuning.id);
  const wav = chordMapToWav(chordMap, rootHz ?? tuning.referenceHz, spectrum);
  return { scl, tun, mts, wav };
}

// ---------------------------------------------------------------------------
// Q291 — scaleConsistencyBundle
// ---------------------------------------------------------------------------

/**
 * Export a scale's subset `.scl` text, consistency score, and normalized chord scores in one call.
 *
 * Socratic Q291: "If I can get consistency normalized scores for a scale's chord map and export
 * it as SCL, can I get both the SCL and the consistency scores in one call?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 2. `scaleToSubsetSclText(scale, tuning, name)` → `.scl` text string.
 * 3. `chordMapConsistencyScore(chordMap, spectrum, rootHz)` → consistency score ∈ (0, 1].
 * 4. `chordMapNormalizedScores(chordMap, spectrum, rootHz)` → per-entry normalized scores.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for dissonance and consistency computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param name     - Optional description for the `.scl` header. Defaults to `scale.name`.
 * @returns `{ scl, consistencyScore, normalizedScores }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const { scl, consistencyScore, normalizedScores } = scaleConsistencyBundle(major, t12);
 */
export function scaleConsistencyBundle(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz = 440,
  name?: string,
): {
  scl: string;
  consistencyScore: number;
  normalizedScores: {
    entry: ScaleChordMapEntry;
    normalizedDissonance: number;
    normalizedHarmonicity: number;
  }[];
} {
  const chordMap = scaleToChordMap(scale, tuning);
  const scl = scaleToSubsetSclText(scale, tuning, name);
  const consistencyScore = chordMapConsistencyScore(chordMap, spectrum, rootHz);
  const normalizedScores = chordMapNormalizedScores(chordMap, spectrum, rootHz);
  return { scl, consistencyScore, normalizedScores };
}

// ---------------------------------------------------------------------------
// Q297 — scaleEntropyBundle
// ---------------------------------------------------------------------------

/**
 * Export a scale as SCL text bundled with its chord-map entropy score and
 * normalized chord scores in one call.
 *
 * Socratic Q297: "If I can export consistency bundle, can I export entropy
 * bundle the same way?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 2. `scaleToSubsetSclText(scale, tuning, name)` → `.scl` text string.
 * 3. `chordMapEntropyScore(chordMap, spectrum, rootHz)` → Shannon entropy ∈ [0, log2(10)].
 * 4. `chordMapNormalizedScores(chordMap, spectrum, rootHz)` → per-entry normalized scores.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param name     - Optional description for the `.scl` header. Defaults to `scale.name`.
 * @returns `{ scl, entropy, normalizedScores }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const { scl, entropy, normalizedScores } = scaleEntropyBundle(major, t12);
 */
export function scaleEntropyBundle(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz = 440,
  name?: string,
): {
  scl: string;
  entropy: number;
  normalizedScores: {
    entry: ScaleChordMapEntry;
    normalizedDissonance: number;
    normalizedHarmonicity: number;
  }[];
} {
  const chordMap = scaleToChordMap(scale, tuning);
  const scl = scaleToSubsetSclText(scale, tuning, name);
  const entropy = chordMapEntropyScore(chordMap, spectrum, rootHz);
  const normalizedScores = chordMapNormalizedScores(chordMap, spectrum, rootHz);
  return { scl, entropy, normalizedScores };
}

// ---------------------------------------------------------------------------
// Q303 — scaleRankedBundle
// ---------------------------------------------------------------------------

/**
 * Export a scale as SCL text bundled with its full ranked bundle (spectral ranking,
 * normalized scores, entropy, consistency) in one call.
 *
 * Socratic Q303: "If I can get a ranked bundle for a chord map, can I get it plus
 * SCL export for a scale?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 2. `scaleToSubsetSclText(scale, tuning, name)` → `.scl` text string.
 * 3. `chordMapRankedBundle(chordMap, spectrum, rootHz)` → `{ spectralRanking, normalizedScores, entropy, consistency }`.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Instrument spectrum (required for spectral ranking).
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param name     - Optional description for the `.scl` header. Defaults to `scale.name`.
 * @returns `{ scl, spectralRanking, normalizedScores, entropy, consistency }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const bundle = scaleRankedBundle(major, t12, harmonicSpectrum());
 * // bundle.scl contains '!'; bundle.spectralRanking[0] is most spectrally fit chord
 */
export function scaleRankedBundle(
  scale: Scale,
  tuning: TuningSystem,
  spectrum: Spectrum,
  rootHz = 440,
  name?: string,
): {
  scl: string;
  spectralRanking: ScaleChordMapEntry[];
  normalizedScores: {
    entry: ScaleChordMapEntry;
    normalizedDissonance: number;
    normalizedHarmonicity: number;
  }[];
  entropy: number;
  consistency: number;
} {
  const chordMap = scaleToChordMap(scale, tuning);
  const scl = scaleToSubsetSclText(scale, tuning, name);
  const { spectralRanking, normalizedScores, entropy, consistency } = chordMapRankedBundle(
    chordMap,
    spectrum,
    rootHz,
  );
  return { scl, spectralRanking, normalizedScores, entropy, consistency };
}

// ---------------------------------------------------------------------------
// Q307 — scaleVolatilityBundle
// ---------------------------------------------------------------------------

/**
 * Export a scale as SCL text bundled with its volatility, entropy, and consistency
 * scores in one call.
 *
 * Socratic Q307: "If I can get volatility bundle for a chord map and SCL text for a scale,
 * can I get both at once?" → No → implement.
 *
 * Algorithm:
 * 1. `scaleToChordMap(scale, tuning)` → diatonic chord map.
 * 2. `scaleToSubsetSclText(scale, tuning, name)` → `.scl` text string.
 * 3. `chordMapVolatilityBundle(chordMap, spectrum, rootHz)` → `{ volatility, entropy, consistency }`.
 *
 * @param scale    - The parent scale (must be compatible with `tuning`).
 * @param tuning   - The parent `TuningSystem`.
 * @param spectrum - Optional instrument spectrum for dissonance computation.
 * @param rootHz   - Root frequency in Hz (default 440 Hz).
 * @param name     - Optional description for the `.scl` header. Defaults to `scale.name`.
 * @returns `{ scl, volatility, entropy, consistency }`.
 *
 * @throws {RangeError} if `scale` is incompatible with `tuning`.
 *
 * @example
 * const t12 = equalTemperament12(440);
 * const major: Scale = { id: 'major', name: 'Ionian', tuningId: '12-tet', degreeIndices: [0,2,4,5,7,9,11] };
 * const { scl, volatility, entropy, consistency } = scaleVolatilityBundle(major, t12);
 * // scl contains '!'; volatility >= 0; entropy >= 0; consistency > 0
 */
export function scaleVolatilityBundle(
  scale: Scale,
  tuning: TuningSystem,
  spectrum?: Spectrum,
  rootHz?: number,
  name?: string,
): { scl: string; volatility: number; entropy: number; consistency: number } {
  const chordMap = scaleToChordMap(scale, tuning);
  const scl = scaleToSubsetSclText(scale, tuning, name);
  const { volatility, entropy, consistency } = chordMapVolatilityBundle(chordMap, spectrum, rootHz);
  return { scl, volatility, entropy, consistency };
}
