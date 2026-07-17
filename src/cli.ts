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
import { DEFAULT_SYNTH_SCALE } from './core/ks-synth.js';
import { isTuningWellFormed, tuningMosPattern } from './core/generate.js';

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
  ruri convert <input.scl> -o <output.{scl|tun|syx|ump}>
  ruri render  <input.scl> -o <output.wav> [--seconds <n>]
  ruri help

Commands:
  info      Print a scale's degrees, cents, ratios, well-formedness, and
            its MOS L/s step pattern (e.g. 5L2s) when it is a MOS.
  convert   Convert a Scala .scl file to another tuning format, inferred
            from the output extension:
              .scl        Scala scale     (round-trip / normalization)
              .tun        AnaMark .tun    (128-key frequency table)
              .syx | .mid MTS bulk dump   (MIDI Tuning Standard SysEx)
              .ump        MIDI 2.0 UMP    (per-degree Note On, Pitch 7.9)
  render    Render each scale degree as a plucked (Karplus-Strong) tone
            to a 16-bit PCM WAV file.

Options:
  -o, --output <path>   Output file path (required for convert/render).
  --seconds <n>         Per-note duration for render (default 0.5).
  --ref <hz>            Root reference frequency in Hz (default 440).
`;

/** A parsed flag set: positional args plus recognized options. */
interface Args {
  readonly positionals: readonly string[];
  readonly output?: string;
  readonly seconds?: number;
  readonly ref?: number;
}

function parseArgs(rest: readonly string[]): Args {
  const positionals: string[] = [];
  let output: string | undefined;
  let seconds: number | undefined;
  let ref: number | undefined;

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i] as string;
    if (a === '-o' || a === '--output') {
      output = rest[++i];
    } else if (a === '--seconds') {
      seconds = Number.parseFloat(rest[++i] ?? '');
    } else if (a === '--ref') {
      ref = Number.parseFloat(rest[++i] ?? '');
    } else {
      positionals.push(a);
    }
  }
  const args: { -readonly [K in keyof Args]: Args[K] } = { positionals };
  if (output !== undefined) args.output = output;
  if (seconds !== undefined) args.seconds = seconds;
  if (ref !== undefined) args.ref = ref;
  return args;
}

const extensionOf = (path: string): string => {
  const dot = path.lastIndexOf('.');
  return dot < 0 ? '' : path.slice(dot + 1).toLowerCase();
};

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
    io.out(`  ${String(i + 1).padStart(3)}  ${degreeCents(d).toFixed(4).padStart(11)}c  ${label}`);
  });
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
  const scl = parseScl(io.readText(input));
  const tuning = sclToTuning(scl, args.ref ?? 440);
  const ext = extensionOf(args.output);
  switch (ext) {
    case 'scl':
      io.writeText(args.output, writeScl(tuningToScl(tuning)));
      break;
    case 'tun':
      io.writeText(args.output, writeTun(tuningToMtsFrequencies(tuning), tuning.name));
      break;
    case 'syx':
    case 'mid':
      io.writeBytes(args.output, tuningToMts(tuning, tuning.name));
      break;
    case 'ump': {
      // One MIDI 2.0 Note On (Pitch 7.9) per degree, concatenated as UMP words.
      const words: number[] = [];
      for (let i = 0; i < tuning.degrees.length; i++) {
        words.push(...tuningDegreeToUmp(tuning, i));
      }
      io.writeBytes(args.output, umpToBytes(words));
      break;
    }
    default:
      io.err(`convert: unsupported output extension '.${ext}' (use .scl, .tun, .syx, or .ump)`);
      return 2;
  }
  io.out(`wrote ${args.output}`);
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
