import { describe, it, expect } from 'vitest';
import { runCli, type CliIo } from './cli.js';
import { tuningToScl, writeScl } from './adapters/scala.js';
import { decodeUmp, UMP_ATTR_PITCH_7_9 } from './adapters/ump.js';
import { edo } from './core/tuning.js';
import { maximallyEvenTuning } from './core/generate.js';

/** Read a 4-byte ASCII tag from a byte buffer at `offset`. */
const tag = (b: Uint8Array, offset: number): string =>
  String.fromCharCode(...b.slice(offset, offset + 4));

/** In-memory {@link CliIo} for driving the CLI without touching the filesystem. */
function makeIo(files: Record<string, string> = {}): {
  io: CliIo;
  texts: Record<string, string>;
  bytes: Record<string, Uint8Array>;
  stdout: string[];
  stderr: string[];
} {
  const texts: Record<string, string> = {};
  const bytes: Record<string, Uint8Array> = {};
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: CliIo = {
    readText(path) {
      if (!(path in files)) throw new RangeError(`no such file: ${path}`);
      return files[path] as string;
    },
    writeText(path, data) {
      texts[path] = data;
    },
    writeBytes(path, data) {
      bytes[path] = data;
    },
    out(line) {
      stdout.push(line);
    },
    err(line) {
      stderr.push(line);
    },
  };
  return { io, texts, bytes, stdout, stderr };
}

// A small 12-TET .scl to feed the CLI.
const scl12 = writeScl(tuningToScl(edo(12)));
// Diatonic (7-of-12 maximally even) → MOS 5L2s.
const sclDiatonic = writeScl(tuningToScl(maximallyEvenTuning(12, 7)));

describe('runCli — dispatch and usage', () => {
  it('test_no_command_prints_usage_and_returns_2', () => {
    const { io, stdout } = makeIo();
    expect(runCli([], io)).toBe(2);
    expect(stdout.join('\n')).toContain('Usage:');
  });

  it('test_help_returns_0', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['help'], io)).toBe(0);
    expect(stdout.join('\n')).toContain('ruri');
  });

  it('test_unknown_command_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['frobnicate'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('unknown command');
  });
});

describe('runCli info', () => {
  it('test_info_prints_degree_count_and_well_formed', () => {
    const { io, stdout } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['info', 'in.scl'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('degrees     : 12');
    expect(text).toContain('period      : 1200');
  });

  it('test_info_shows_mos_pattern_for_diatonic', () => {
    const { io, stdout } = makeIo({ 'in.scl': sclDiatonic });
    expect(runCli(['info', 'in.scl'], io)).toBe(0);
    // 5 large + 2 small steps; the exact rotation depends on the mode the
    // maximally-even set lands on (here sLLsLLL), but the 5L2s name is invariant.
    expect(stdout.join('\n')).toContain('mos-pattern : 5L2s');
  });

  it('test_info_missing_input_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['info'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('missing');
  });

  it('test_info_bad_file_returns_1', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['info', 'nope.scl'], io)).toBe(1);
    expect(stderr.join('\n')).toContain('error:');
  });
});

describe('runCli convert', () => {
  it('test_convert_to_scl_round_trips', () => {
    const { io, texts } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl', '-o', 'out.scl'], io)).toBe(0);
    expect(texts['out.scl']).toBeDefined();
    expect(texts['out.scl']).toContain('12');
  });

  it('test_convert_to_tun_writes_128_key_table', () => {
    const { io, texts } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl', '-o', 'out.tun'], io)).toBe(0);
    const tun = texts['out.tun'] as string;
    expect(tun).toContain('[Tuning]');
    expect(tun).toContain('note 127=');
  });

  it('test_convert_to_syx_writes_mts_sysex_bytes', () => {
    const { io, bytes } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl', '-o', 'out.syx'], io)).toBe(0);
    const syx = bytes['out.syx'] as Uint8Array;
    expect(syx[0]).toBe(0xf0); // SysEx start
    expect(syx[syx.length - 1]).toBe(0xf7); // SysEx end
  });

  it('test_convert_to_ump_writes_note_on_per_degree', () => {
    const { io, bytes } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl', '-o', 'out.ump'], io)).toBe(0);
    const ump = bytes['out.ump'] as Uint8Array;
    // 12 degrees × one 64-bit Note On (2 words = 8 bytes) each.
    expect(ump.length).toBe(12 * 8);
    expect(ump[0]).toBe(0x40); // message type 0x4 (MIDI 2.0 CV) | group 0
    // Reconstruct words (big-endian) and decode: all must be Pitch 7.9 Note Ons.
    const words = Array.from(
      { length: ump.length / 4 },
      (_, i) =>
        ((ump[i * 4]! << 24) |
          (ump[i * 4 + 1]! << 16) |
          (ump[i * 4 + 2]! << 8) |
          ump[i * 4 + 3]!) >>>
        0,
    );
    const msgs = decodeUmp(words);
    expect(msgs).toHaveLength(12);
    expect(msgs.every((m) => m.kind === 'noteOn' && m.attributeType === UMP_ATTR_PITCH_7_9)).toBe(
      true,
    );
  });

  it('test_convert_to_mid_writes_valid_standard_midi_file', () => {
    const { io, bytes, stderr } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl', '-o', 'out.mid'], io)).toBe(0);
    const mid = bytes['out.mid'] as Uint8Array;
    // A real SMF starts with the "MThd" header chunk (not raw SysEx 0xF0).
    expect(tag(mid, 0)).toBe('MThd');
    // 12-TET input rounds cleanly, so no microtonality warning.
    expect(stderr.join('\n')).not.toContain('warning');
  });

  it('test_convert_to_mid_warns_on_microtonal_scale', () => {
    // Just pentatonic: 5/4 = 386c is 14c off 12-TET → should warn.
    const justScl = 'just5\n5\n9/8\n5/4\n3/2\n5/3\n2/1\n';
    const { io, bytes, stderr } = makeIo({ 'in.scl': justScl });
    expect(runCli(['convert', 'in.scl', '-o', 'out.mid'], io)).toBe(0);
    expect(tag(bytes['out.mid'] as Uint8Array, 0)).toBe('MThd'); // still a valid SMF
    expect(stderr.join('\n')).toContain('warning: .mid rounds pitches to 12-TET');
  });

  it('test_convert_unsupported_extension_returns_2', () => {
    const { io, stderr } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl', '-o', 'out.xyz'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('unsupported');
  });

  it('test_convert_missing_output_returns_2', () => {
    const { io, stderr } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('missing -o');
  });
});

describe('runCli gen', () => {
  it('test_gen_edo_writes_n_degree_scl', () => {
    const { io, texts, stdout } = makeIo();
    expect(runCli(['gen', 'edo', '19', '-o', 'out.scl'], io)).toBe(0);
    // A 19-EDO .scl lists 19 degrees (18 above root + the 2/1 period line).
    expect((texts['out.scl'] as string).split('\n').filter((l) => l.trim() === '19').length).toBe(
      1,
    );
    expect(stdout.join('\n')).toContain('wrote out.scl');
  });

  it('test_gen_mos_diatonic_is_5L2s_via_info_roundtrip', () => {
    // gen a 700c/1200c/7 MOS to .scl, read it back with info → 5L2s.
    const { io, texts } = makeIo();
    expect(runCli(['gen', 'mos', '700', '1200', '7', '-o', 'd.scl'], io)).toBe(0);
    const back = makeIo({ 'd.scl': texts['d.scl'] as string });
    expect(runCli(['info', 'd.scl'], back.io)).toBe(0);
    expect(back.stdout.join('\n')).toContain('mos-pattern : 5L2s');
  });

  it('test_gen_me_writes_ump', () => {
    const { io, bytes } = makeIo();
    expect(runCli(['gen', 'me', '12', '7', '-o', 'out.ump'], io)).toBe(0);
    expect((bytes['out.ump'] as Uint8Array).length).toBe(7 * 8); // 7 notes × 8 bytes
  });

  it('test_gen_edo_bad_arg_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['gen', 'edo', 'nope', '-o', 'out.scl'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('usage: gen edo');
  });

  it('test_gen_unknown_generator_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['gen', 'bogus', '-o', 'out.scl'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('unknown generator');
  });

  it('test_gen_missing_output_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['gen', 'edo', '12'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('missing -o');
  });
});

describe('runCli render', () => {
  it('test_render_writes_valid_wav', () => {
    const { io, bytes } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['render', 'in.scl', '-o', 'out.wav', '--seconds', '0.05'], io)).toBe(0);
    const wav = bytes['out.wav'] as Uint8Array;
    expect(wav).toBeDefined();
    expect(tag(wav, 0)).toBe('RIFF');
    expect(tag(wav, 8)).toBe('WAVE');
  });

  it('test_render_non_wav_output_returns_2', () => {
    const { io, stderr } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['render', 'in.scl', '-o', 'out.mp3'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('.wav');
  });

  it('test_render_bad_seconds_returns_2', () => {
    const { io, stderr } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['render', 'in.scl', '-o', 'out.wav', '--seconds', '-1'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('seconds');
  });
});
