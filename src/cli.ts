/**
 * Ruri command-line interface — batch tuning conversion and audio rendering.
 *
 * This module is deliberately **portable**: it performs no filesystem or process
 * I/O itself. All side effects go through an injected {@link CliIo}, so the whole
 * command surface is unit-testable in-process without spawning a subprocess. The
 * thin `bin/ruri.mjs` bootstrap wires {@link runCli} to real Node `fs`/`process`.
 *
 * Every command is a thin shell over the existing library adapters
 * (`parseScl`, `sclToTuning`, `writeTun`, `tuningToMts`, `tuningToScaleWav`, …);
 * the CLI adds no music-theory logic of its own.
 */

import { parseScl, writeScl, tuningToScl, sclToTuning, degreeCents } from './adapters/scala.js';
import { writeTun } from './adapters/tun.js';
import { tuningToMts, tuningToMtsFrequencies } from './adapters/mts.js';
import { tuningToScaleWav } from './adapters/wav.js';
import { tuningDegreeToUmp, umpToBytes } from './adapters/ump.js';
import { scaleToSmf } from './adapters/smf.js';
import { tuningToScale } from './core/scale.js';
import { degreeToFreq, edo, type TuningSystem } from './core/tuning.js';
import { freqToMidiFloat } from './core/midi.js';
import { DEFAULT_SYNTH_SCALE } from './core/ks-synth.js';
import {
  isTuningWellFormed,
  tuningMosPattern,
  generatedTuning,
  maximallyEvenTuning,
} from './core/generate.js';
import { approxRatio } from './core/harmonicity.js';
import { ALL_PRESETS, getTuningById } from './data/presets.js';
import { edoHarmonicErrors, edoConsistencyLimit } from './core/edo-error.js';

/** Injectable I/O boundary. The bootstrap provides real fs/process implementations. */
export interface CliIo {
  /** Read a UTF-8 text file (used for `.scl` input). */
  readText(path: string): string;
  /** Write a UTF-8 text file (`.scl`, `.tun` output). */
  writeText(path: string, data: string): void;
  /** Write a binary file (`.wav`, `.syx`/`.mid` MTS SysEx output). */
  writeBytes(path: string, data: Uint8Array): void;
  /** Print a line to standard output. */
  out(line: string): void;
  /** Print a line to standard error. */
  err(line: string): void;
}

const USAGE = `ruri — world tuning / scale / chord toolkit

Usage:
  ruri info    <input.scl>
  ruri convert <input.scl> -o <output.{scl|tun|syx|ump|mid|wav}>
  ruri gen     <edo N | mos g p c | me c d> -o <output.{scl|tun|syx|ump|mid|wav}>
  ruri presets [<id> -o <output.{scl|tun|syx|ump|mid|wav}>]
  ruri edo     <divisions> [--limit <oddLimit>]
  ruri render  <input.scl> -o <output.wav> [--seconds <n>]
  ruri help

Commands:
  info      Print a scale's degrees, cents, ratios, well-formedness, and
            its MOS L/s step pattern (e.g. 5L2s) when it is a MOS.
  convert   Convert a Scala .scl file to another tuning format, inferred
            from the output extension:
              .scl        Scala scale     (round-trip / normalization)
              .tun        AnaMark .tun    (128-key frequency table)
              .syx        MTS bulk dump   (MIDI Tuning Standard SysEx)
              .ump        MIDI 2.0 UMP    (per-degree Note On, Pitch 7.9)
              .mid        Standard MIDI   (playable melody; 12-TET-rounded,
                                           warns when microtonality is lost)
              .wav        16-bit PCM audio (plucked Karplus-Strong scale)
  gen       Generate a tuning from theory (no input file) and write it in
            any convert format (including .wav to audition it directly):
              edo <divisions>              n-tone equal division (e.g. 19)
              mos <genCents> <perCents> <count>   generated / MOS scale
              me  <chromaticSteps> <notes> maximally even (Clough-Douthett)
  presets   List the curated tunings (with their citations), or export one
            by id in any convert format.
  edo       Report how well an equal division approximates just intonation:
            per-harmonic error in cents and percent of a step, plus the
            EDO's consistency limit (the standard 25%-of-a-step criterion).
  render    Render each scale degree as a plucked (Karplus-Strong) tone
            to a 16-bit PCM WAV file.

Options:
  -o, --output <path>   Output file path (required for convert/gen/render).
  --seconds <n>         Per-note duration for .wav output (default 0.5).
  --ref <hz>            Root reference frequency in Hz (default 440).
  --name <text>         Name/id written into the output tuning (convert/gen).
  --limit <oddLimit>    Highest odd harmonic for the edo report (default 15).
`;

/** A parsed flag set: positional args plus recognized options. */
interface Args {
  readonly positionals: readonly string[];
  readonly output?: string;
  readonly seconds?: number;
  readonly ref?: number;
  readonly name?: string;
  readonly limit?: number;
}

function parseArgs(rest: readonly string[]): Args {
  const positionals: string[] = [];
  let output: string | undefined;
  let seconds: number | undefined;
  let ref: number | undefined;
  let name: string | undefined;
  let limit: number | undefined;

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i] as string;
    if (a === '-o' || a === '--output') {
      output = rest[++i];
    } else if (a === '--seconds') {
      seconds = Number.parseFloat(rest[++i] ?? '');
    } else if (a === '--ref') {
      ref = Number.parseFloat(rest[++i] ?? '');
    } else if (a === '--name') {
      name = rest[++i];
    } else if (a === '--limit') {
      limit = Number.parseInt(rest[++i] ?? '', 10);
    } else {
      positionals.push(a);
    }
  }
  const args: { -readonly [K in keyof Args]: Args[K] } = { positionals };
  if (output !== undefined) args.output = output;
  if (seconds !== undefined) args.seconds = seconds;
  if (ref !== undefined) args.ref = ref;
  if (name !== undefined) args.name = name;
  if (limit !== undefined) args.limit = limit;
  return args;
}

/** Return a copy of `tuning` with its id/name overridden (for `--name`). */
function renamed(tuning: TuningSystem, name: string | undefined): TuningSystem {
  return name === undefined ? tuning : { ...tuning, id: name, name };
}

const extensionOf = (path: string): string => {
  const dot = path.lastIndexOf('.');
  return dot < 0 ? '' : path.slice(dot + 1).toLowerCase();
};

/** Odd part of a positive integer (strip all factors of 2). */
function oddPart(n: number): number {
  let x = n;
  while (x % 2 === 0) x /= 2;
  return x;
}

/**
 * Display-only nearest simple just ratio for a cents value, or `''` when none
 * is close and simple enough. This is an approximation *hint* (marked `≈` with
 * the cents error), NOT a cents→ratio conversion — the core design keeps ratio
 * primary and never treats a tempered cents value as an exact ratio.
 *
 * Two gates, both needed:
 *  - **≤ 1.0c error**: JI written as cents lands ≤ 0.5c from its ratio even at
 *    4-decimal precision, while ordinary tempered steps sit > 1c off.
 *  - **odd-limit ≤ 15**: the standard xenharmonic consonance measure. With only
 *    a cents gate, a denominator-≤-32 search finds *some* fraction within 1c of
 *    almost any pitch (19-EDO steps picked up noise like `≈ 43/24`); real
 *    recognizable intervals (5/4, 6/5, 5/3, 7/4, 15/8) are odd-limit ≤ 15,
 *    whereas that noise is odd-limit 25–45. Together they annotate genuine JI —
 *    and genuinely near-just tempered degrees like 19-EDO's 6/5 minor third —
 *    while leaving tempered/irrational steps unlabeled.
 */
function nearestJiHint(cents: number): string {
  if (cents <= 0) return '';
  const ratio = 2 ** (cents / 1200);
  const { num, den } = approxRatio(ratio, 0.001, 64);
  if (Math.max(oddPart(num), oddPart(den)) > 15) return '';
  const errCents = Math.abs(1200 * Math.log2(num / den) - cents);
  if (errCents > 1.0) return '';
  const sign = 1200 * Math.log2(num / den) >= cents ? '+' : '-';
  return `  ≈ ${num}/${den} (${sign}${errCents.toFixed(1)}c)`;
}

/**
 * Largest deviation, in cents, between any tuning degree and the nearest
 * 12-TET semitone — how much a plain Standard MIDI File (which can only carry
 * integer note numbers) would misrepresent this tuning.
 */
function maxTwelveTetErrorCents(tuning: TuningSystem, a4Hz: number): number {
  let worst = 0;
  for (let i = 0; i < tuning.degrees.length; i++) {
    const midiFloat = freqToMidiFloat(degreeToFreq(tuning, i), a4Hz);
    const errCents = Math.abs(midiFloat - Math.round(midiFloat)) * 100;
    if (errCents > worst) worst = errCents;
  }
  return worst;
}

function cmdInfo(args: Args, io: CliIo): number {
  const input = args.positionals[0];
  if (input === undefined) {
    io.err('info: missing <input.scl>');
    return 2;
  }
  const scl = parseScl(io.readText(input));
  const tuning = sclToTuning(scl, args.ref ?? 440);
  io.out(`description : ${scl.description || '(none)'}`);
  io.out(`degrees     : ${tuning.degrees.length} (per period)`);
  io.out(`period      : ${tuning.periodCents.toFixed(4)} cents`);
  io.out(`well-formed : ${isTuningWellFormed(tuning) ? 'yes (Myhill)' : 'no'}`);
  const mos = tuningMosPattern(tuning);
  io.out(`mos-pattern : ${mos ? `${mos.name} (${mos.pattern.join('')})` : 'none (3+ step sizes)'}`);
  io.out('pitches:');
  scl.degrees.forEach((d, i) => {
    const label = d.kind === 'ratio' ? `${d.num}/${d.den}` : d.text;
    // Exact ratios need no hint; cents degrees get a nearest-JI approximation.
    const hint = d.kind === 'cents' ? nearestJiHint(d.cents) : '';
    io.out(
      `  ${String(i + 1).padStart(3)}  ${degreeCents(d).toFixed(4).padStart(11)}c  ${label}${hint}`,
    );
  });
  return 0;
}

/**
 * Write a `TuningSystem` to `output`, choosing the format from its extension.
 * Shared by `convert` (tuning read from a `.scl`) and `gen` (tuning synthesized
 * from theory), so both speak the exact same set of output formats — including
 * `.wav`, so a generated tuning can be auditioned without a separate step.
 * Returns a process exit code (0 ok, 2 on an unsupported extension).
 */
function writeTuningOutput(
  tuning: TuningSystem,
  output: string,
  ref: number,
  noteSeconds: number,
  io: CliIo,
): number {
  const ext = extensionOf(output);
  switch (ext) {
    case 'scl':
      io.writeText(output, writeScl(tuningToScl(tuning)));
      break;
    case 'tun':
      io.writeText(output, writeTun(tuningToMtsFrequencies(tuning), tuning.name));
      break;
    case 'syx':
      io.writeBytes(output, tuningToMts(tuning, tuning.name));
      break;
    case 'mid': {
      // A playable Standard MIDI File melody (one note per degree). A plain SMF
      // carries only integer note numbers, so warn — loudly and honestly — when
      // that rounds away the very microtonality this tool exists to preserve.
      io.writeBytes(output, scaleToSmf(tuningToScale(tuning), tuning, ref, { a4Hz: ref }));
      const err = maxTwelveTetErrorCents(tuning, ref);
      if (err > 1) {
        io.err(
          `warning: .mid rounds pitches to 12-TET (max ${err.toFixed(1)}c off). ` +
            `Use .ump, .syx, or .tun to preserve the exact tuning.`,
        );
      }
      break;
    }
    case 'ump': {
      // One MIDI 2.0 Note On (Pitch 7.9) per degree, concatenated as UMP words.
      const words: number[] = [];
      for (let i = 0; i < tuning.degrees.length; i++) {
        words.push(...tuningDegreeToUmp(tuning, i));
      }
      io.writeBytes(output, umpToBytes(words));
      break;
    }
    case 'wav':
      io.writeBytes(output, tuningToScaleWav(tuning, { ...DEFAULT_SYNTH_SCALE, noteSeconds }));
      break;
    default:
      io.err(`unsupported output extension '.${ext}' (use .scl, .tun, .syx, .ump, .mid, or .wav)`);
      return 2;
  }
  io.out(`wrote ${output}`);
  return 0;
}

function cmdConvert(args: Args, io: CliIo): number {
  const input = args.positionals[0];
  if (input === undefined) {
    io.err('convert: missing <input.scl>');
    return 2;
  }
  if (args.output === undefined) {
    io.err('convert: missing -o <output>');
    return 2;
  }
  const tuning = renamed(sclToTuning(parseScl(io.readText(input)), args.ref ?? 440), args.name);
  return writeTuningOutput(tuning, args.output, args.ref ?? 440, args.seconds ?? 0.5, io);
}

/**
 * Synthesize a tuning from theory (no input file) and write it out:
 *   gen edo <divisions>
 *   gen mos <generatorCents> <periodCents> <count>
 *   gen me  <chromaticSteps> <scaleNotes>
 */
function cmdGen(args: Args, io: CliIo): number {
  const [kind, ...rest] = args.positionals;
  if (kind === undefined) {
    io.err('gen: missing generator (edo | mos | me)');
    return 2;
  }
  if (args.output === undefined) {
    io.err('gen: missing -o <output>');
    return 2;
  }
  const ref = args.ref ?? 440;
  const nums = rest.map(Number);
  const bad = (msg: string): number => {
    io.err(`gen ${kind}: ${msg}`);
    return 2;
  };
  let tuning: TuningSystem;
  switch (kind) {
    case 'edo': {
      const [n] = nums;
      if (n === undefined || !Number.isInteger(n) || n < 1) {
        return bad('usage: gen edo <divisions> (positive integer)');
      }
      tuning = edo(n, ref);
      break;
    }
    case 'mos': {
      const [g, p, c] = nums;
      if (g === undefined || p === undefined || c === undefined || !Number.isFinite(g)) {
        return bad('usage: gen mos <generatorCents> <periodCents> <count>');
      }
      tuning = generatedTuning(g, p, c, ref);
      break;
    }
    case 'me': {
      const [c, d] = nums;
      if (c === undefined || d === undefined) {
        return bad('usage: gen me <chromaticSteps> <scaleNotes>');
      }
      tuning = maximallyEvenTuning(c, d, 1200, ref);
      break;
    }
    default:
      return bad('unknown generator (use edo | mos | me)');
  }
  return writeTuningOutput(renamed(tuning, args.name), args.output, ref, args.seconds ?? 0.5, io);
}

/**
 * List the curated tuning presets, or write one out in any convert format:
 *   presets                      list all (id, name, degrees, citation)
 *   presets <id> -o <output.…>   export one preset
 *
 * Curated presets carry mandatory provenance; the listing prints the citation so
 * the source travels with the data rather than being stripped from it.
 */
function cmdPresets(args: Args, io: CliIo): number {
  const id = args.positionals[0];
  if (id === undefined) {
    for (const p of ALL_PRESETS) {
      const kind = p.source === 'measured' ? 'measured' : 'theoretical';
      io.out(
        `${p.id.padEnd(24)} ${String(p.degrees.length).padStart(3)} deg  [${kind}]  ${p.name}`,
      );
      io.out(`${' '.repeat(26)}source: ${p.provenance.citation}`);
    }
    return 0;
  }
  const tuning = getTuningById(id);
  if (tuning === undefined) {
    io.err(`presets: unknown id '${id}'. Run 'ruri presets' to list available ids.`);
    return 2;
  }
  if (args.output === undefined) {
    io.err('presets: missing -o <output>');
    return 2;
  }
  return writeTuningOutput(
    renamed(tuning, args.name),
    args.output,
    args.ref ?? tuning.referenceHz,
    args.seconds ?? 0.5,
    io,
  );
}

/**
 * Report how well an EDO approximates just intonation — the practical question
 * behind "should I use 19, 31 or 41?". Prints each odd harmonic's error in both
 * cents and percent-of-a-step, plus the EDO's consistency limit.
 */
function cmdEdo(args: Args, io: CliIo): number {
  const n = Number(args.positionals[0]);
  if (!Number.isInteger(n) || n < 1) {
    io.err('edo: usage: ruri edo <divisions> [--limit <oddLimit>]');
    return 2;
  }
  const limit = args.limit ?? 15;
  const table = edoHarmonicErrors(n, limit);
  io.out(`${n}-EDO   step = ${(1200 / n).toFixed(4)} cents`);
  io.out(`consistency limit : ${edoConsistencyLimit(n)}-odd-limit`);
  io.out('harmonic      just      edo   error    rel');
  for (const h of table) {
    const edoCents = h.steps * (1200 / n);
    io.out(
      `${String(h.harmonic).padStart(5)}  ${h.justCents.toFixed(2).padStart(9)}c ` +
        `${edoCents.toFixed(2).padStart(8)}c ${h.errorCents.toFixed(2).padStart(7)}c ` +
        `${(h.relativeError * 100).toFixed(1).padStart(6)}%`,
    );
  }
  return 0;
}

function cmdRender(args: Args, io: CliIo): number {
  const input = args.positionals[0];
  if (input === undefined) {
    io.err('render: missing <input.scl>');
    return 2;
  }
  if (args.output === undefined) {
    io.err('render: missing -o <output.wav>');
    return 2;
  }
  if (extensionOf(args.output) !== 'wav') {
    io.err(`render: output must be a .wav file, got '${args.output}'`);
    return 2;
  }
  const scl = parseScl(io.readText(input));
  const tuning = sclToTuning(scl, args.ref ?? 440);
  const noteSeconds = args.seconds ?? 0.5;
  if (!Number.isFinite(noteSeconds) || noteSeconds <= 0) {
    io.err(`render: --seconds must be > 0, got ${noteSeconds}`);
    return 2;
  }
  const wav = tuningToScaleWav(tuning, { ...DEFAULT_SYNTH_SCALE, noteSeconds });
  io.writeBytes(args.output, wav);
  io.out(`wrote ${args.output} (${tuning.degrees.length} notes)`);
  return 0;
}

/**
 * Dispatch a full argv (command + args, without the `node script` prefix) and
 * return a process exit code (0 = success, 1 = runtime error, 2 = usage error).
 *
 * Never throws for expected failures: malformed input files and adapter
 * `RangeError`s are caught and reported through `io.err`. Programmer errors
 * (a bug in the CLI itself) still propagate.
 */
export function runCli(argv: readonly string[], io: CliIo): number {
  const [command, ...rest] = argv;
  if (command === undefined || command === 'help' || command === '--help' || command === '-h') {
    io.out(USAGE);
    return command === undefined ? 2 : 0;
  }
  const args = parseArgs(rest);
  try {
    switch (command) {
      case 'info':
        return cmdInfo(args, io);
      case 'convert':
        return cmdConvert(args, io);
      case 'gen':
        return cmdGen(args, io);
      case 'presets':
        return cmdPresets(args, io);
      case 'edo':
        return cmdEdo(args, io);
      case 'render':
        return cmdRender(args, io);
      default:
        io.err(`unknown command '${command}'. Run 'ruri help' for usage.`);
        return 2;
    }
  } catch (e) {
    io.err(`error: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}
