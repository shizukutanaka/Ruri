/** Scala .scl import/export. Preserves original ratio-vs-cents representation for lossless round-trip. */
import { type TuningSystem } from '../core/tuning.js';
import { pitchToCents, freqToCents } from '../core/cents.js';
import { type Chord, chordToFreqRatios } from '../core/chord.js';

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
