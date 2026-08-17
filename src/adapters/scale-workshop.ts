/**
 * Scale Workshop scale-data import.
 *
 * Scale Workshop is the browser tool most xenharmonic composers actually reach
 * for, and its "scale data" box — one interval per line — is the informal
 * lingua franca in which scales get pasted into forums, chats and issue
 * threads. This module reads that text so such a scale can enter the library
 * without a detour through a `.scl` file.
 *
 * Four line forms, distinguished by which character appears:
 *
 * | Form            | Marker | Example  | Meaning                       |
 * |-----------------|--------|----------|-------------------------------|
 * | ratio           | `/`or none | `3/2`, `2` | exact just interval       |
 * | cents           | `.`    | `701.9`, `1200.` | interval in cents     |
 * | EDO steps       | `\`    | `7\12`   | 7 steps of 12-EDO             |
 * | decimal ratio   | `e`    | `1.5e`, `14e-1` | ratio written decimally|
 *
 * The decisive detail is that **a dot is what makes a line cents**. `2` is the
 * ratio 2/1 — an octave — while `2.` is two cents. Getting that backwards
 * silently transposes a scale by a factor of 600, so the discriminator is
 * applied in a fixed order (`\`, then `e`, then `.`, then ratio) and pinned by
 * tests.
 *
 * Ratios are kept as ratios, never flattened into cents, so a scale imported
 * from Scale Workshop and exported to `.scl` survives with its just intervals
 * exact — the same ratio-primary guarantee the rest of the library makes.
 *
 * Reference: Scale Workshop user guide (scale data syntax);
 * github.com/xenharmonic-devs/scale-workshop.
 */
import { type TuningSystem, defineTuning } from '../core/tuning.js';
import { type Pitch } from '../core/cents.js';
import { ratio, CENTS_PER_OCTAVE } from '../core/ratio.js';

/** One parsed line of Scale Workshop scale data. */
export interface ScaleWorkshopLine {
  /** Which of the four notations the line used. */
  readonly form: 'ratio' | 'cents' | 'edostep' | 'decimal';
  /** The interval, as a ratio when the notation was exact, else as cents. */
  readonly pitch: Pitch;
}

const EDO_STEP = /^(-?\d+)\\(\d+)$/;
const RATIO = /^(\d+)(?:\/(\d+))?$/;

/**
 * Parse a single scale-data line.
 *
 * @throws {RangeError} if the line matches none of the four notations, or uses
 *   a zero denominator / non-positive EDO.
 *
 * @example
 * parseScaleWorkshopLine('3/2').form;   // 'ratio'   — exact
 * parseScaleWorkshopLine('700.').form;  // 'cents'
 * parseScaleWorkshopLine('7\\12').form; // 'edostep' — 700 cents
 */
export function parseScaleWorkshopLine(line: string): ScaleWorkshopLine {
  const text = line.trim();
  if (text === '') throw new RangeError('empty line is not an interval');

  // Order matters: `1.5e` carries both a dot and an e, and is a decimal ratio.
  if (text.includes('\\')) {
    const m = EDO_STEP.exec(text);
    if (m === null) throw new RangeError(`malformed EDO step: '${line}'`);
    const steps = Number.parseInt(m[1] as string, 10);
    const divisions = Number.parseInt(m[2] as string, 10);
    if (divisions < 1) throw new RangeError(`EDO divisions must be >= 1: '${line}'`);
    return {
      form: 'edostep',
      pitch: { kind: 'cents', cents: (CENTS_PER_OCTAVE * steps) / divisions },
    };
  }

  if (text.includes('e') || text.includes('E')) {
    const value = Number(text.replace(/[eE]$/, ''));
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`malformed decimal ratio: '${line}'`);
    }
    return {
      form: 'decimal',
      pitch: { kind: 'cents', cents: CENTS_PER_OCTAVE * Math.log2(value) },
    };
  }

  if (text.includes('.')) {
    const value = Number(text);
    if (!Number.isFinite(value)) throw new RangeError(`malformed cents value: '${line}'`);
    return { form: 'cents', pitch: { kind: 'cents', cents: value } };
  }

  const m = RATIO.exec(text);
  if (m === null) throw new RangeError(`unrecognised scale line: '${line}'`);
  const num = Number.parseInt(m[1] as string, 10);
  const den = m[2] === undefined ? 1 : Number.parseInt(m[2], 10);
  if (num < 1 || den < 1) throw new RangeError(`ratio must be positive: '${line}'`);
  // Kept as a ratio, not converted — exactness is the point.
  return { form: 'ratio', pitch: { kind: 'ratio', ratio: ratio(num, den) } };
}

/** Options for {@link parseScaleWorkshop}. */
export interface ScaleWorkshopOptions {
  readonly referenceHz?: number;
  readonly id?: string;
  readonly name?: string;
}

/** Size of a pitch in cents. */
const pitchCents = (p: Pitch): number =>
  p.kind === 'cents' ? p.cents : CENTS_PER_OCTAVE * Math.log2(p.ratio.num / p.ratio.den);

/**
 * Parse a whole Scale Workshop scale-data block into a `TuningSystem`.
 *
 * Blank lines and `!`-comments are skipped. Following the Scale Workshop
 * convention, the implied `1/1` root is not written and the **last** line is
 * the period (usually `2/1`), so it becomes `periodCents` rather than a degree.
 *
 * @throws {RangeError} if the text contains no intervals, any line is
 *   unparseable, or the final period is not positive.
 *
 * @example
 * parseScaleWorkshop('9/8\n5/4\n4/3\n3/2\n5/3\n15/8\n2/1');
 * // a 5-limit just major scale, ratios preserved exactly
 */
export function parseScaleWorkshop(text: string, opts: ScaleWorkshopOptions = {}): TuningSystem {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('!'));
  if (lines.length === 0) throw new RangeError('scale data contains no intervals');

  const parsed = lines.map(parseScaleWorkshopLine);
  const period = parsed[parsed.length - 1] as ScaleWorkshopLine;
  const periodCents = pitchCents(period.pitch);
  if (!(periodCents > 0)) {
    throw new RangeError(`period must be greater than 0 cents, got ${periodCents}`);
  }

  // The root is implied; every line before the period is a degree above it.
  const degrees: Pitch[] = [
    { kind: 'cents', cents: 0 },
    ...parsed.slice(0, -1).map((p) => p.pitch),
  ];
  const id = opts.id ?? 'scale-workshop';
  return defineTuning({
    id,
    name: opts.name ?? id,
    referenceHz: opts.referenceHz ?? 440,
    periodCents,
    degrees,
    source: 'theoretical',
  });
}
