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

  it('test_info_annotates_ji_cents_degrees_with_nearest_ratio', () => {
    // A JI scale written in cents: 386.3137c is exactly 5/4, 701.955c is 3/2.
    const jiCents = 'JI in cents\n3\n386.3137\n701.9550\n1200.0\n';
    const { io, stdout } = makeIo({ 'in.scl': jiCents });
    expect(runCli(['info', 'in.scl'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('≈ 5/4');
    expect(text).toContain('≈ 3/2');
  });

  it('test_info_does_not_mislabel_tempered_edo_intervals', () => {
    // 12-EDO's 400c third and 700c fifth are >1c from 5/4 (386.3c) and 3/2
    // (702.0c), so they must NOT be annotated — only the exact 2/1 octave is.
    const { io, stdout } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['info', 'in.scl'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).not.toContain('≈ 5/4');
    expect(text).not.toContain('≈ 3/2');
    expect(text).toContain('≈ 2/1'); // the octave is a genuine 2/1
  });

  it('test_info_reports_harmonic_entropy_per_degree', () => {
    // Timbre-independent consonance: the octave should be the most certain
    // interval in the scale, i.e. the lowest entropy.
    const jiCents = 'JI in cents\n3\n386.3137\n701.9550\n1200.0\n';
    const { io, stdout } = makeIo({ 'in.scl': jiCents });
    expect(runCli(['info', 'in.scl'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('entropy');
    const values = stdout
      .filter((l) => /^\s+\d+\s+[\d.]+c/.test(l))
      .map((l) => Number(l.trim().split(/\s+/)[2]));
    expect(values).toHaveLength(3);
    expect(values.every((v) => Number.isFinite(v) && v > 0)).toBe(true);
    expect(values[2]).toBeLessThan(values[0]!); // 2/1 more certain than 5/4
  });

  it('test_info_names_exact_ratios_in_fjs', () => {
    // Ratio degrees get their Functional Just System name, which distinguishes
    // the just third from the Pythagorean one that shares the classical name.
    const ji = 'JI\n4\n9/8\n5/4\n3/2\n2/1\n';
    const { io, stdout } = makeIo({ 'in.scl': ji });
    expect(runCli(['info', 'in.scl'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('5/4  M3^5');
    expect(text).toContain('3/2  P5');
    expect(text).toContain('9/8  M2');
  });

  it('test_info_reads_a_scale_workshop_block', () => {
    // Same scale in Scale Workshop notation rather than .scl — the extension
    // picks the reader, and the ratios stay exact.
    const sw = '9/8\n5/4\n4/3\n3/2\n5/3\n15/8\n2/1\n';
    const { io, stdout } = makeIo({ 'in.txt': sw });
    expect(runCli(['info', 'in.txt'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('degrees     : 7');
    expect(text).toContain('5/4  M3^5');
    expect(text).toContain('period      : 1200.0000');
  });

  it('test_convert_reads_a_scale_workshop_block', () => {
    const sw = '7\\12\n2/1\n';
    const { io, texts } = makeIo({ 'in.txt': sw });
    expect(runCli(['convert', 'in.txt', '-o', 'out.scl'], io)).toBe(0);
    expect(texts['out.scl']).toContain('700.000000');
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

  it('test_convert_to_wav_writes_valid_audio', () => {
    const { io, bytes } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['convert', 'in.scl', '-o', 'out.wav', '--seconds', '0.05'], io)).toBe(0);
    expect(tag(bytes['out.wav'] as Uint8Array, 0)).toBe('RIFF');
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

  it('test_gen_edo_writes_audible_wav', () => {
    // gen can audition a tuning directly, no intermediate .scl + render step.
    const { io, bytes } = makeIo();
    expect(runCli(['gen', 'edo', '12', '-o', 'out.wav', '--seconds', '0.05'], io)).toBe(0);
    const wav = bytes['out.wav'] as Uint8Array;
    expect(tag(wav, 0)).toBe('RIFF');
    expect(tag(wav, 8)).toBe('WAVE');
  });

  it('test_gen_name_option_sets_scl_description', () => {
    const { io, texts } = makeIo();
    expect(runCli(['gen', 'edo', '5', '-o', 'out.scl', '--name', 'my slendro-ish'], io)).toBe(0);
    expect(texts['out.scl']).toContain('my slendro-ish');
  });

  it('test_gen_without_name_uses_generated_id', () => {
    const { io, texts } = makeIo();
    expect(runCli(['gen', 'edo', '5', '-o', 'out.scl'], io)).toBe(0);
    expect(texts['out.scl']).toContain('5-edo');
  });

  it('test_gen_fit_timbre_produces_different_audio', () => {
    // --fit-timbre synthesizes with a spectrum built for the tuning, so the
    // rendered audio must actually differ from the default plucked string.
    const plain = makeIo();
    expect(runCli(['gen', 'edo', '13', '-o', 'a.wav', '--seconds', '0.05'], plain.io)).toBe(0);
    const fitted = makeIo();
    expect(
      runCli(['gen', 'edo', '13', '-o', 'a.wav', '--seconds', '0.05', '--fit-timbre'], fitted.io),
    ).toBe(0);
    const a = plain.bytes['a.wav'] as Uint8Array;
    const b = fitted.bytes['a.wav'] as Uint8Array;
    expect(tag(b, 0)).toBe('RIFF'); // still a valid WAV
    // Compare without Node's Buffer: this package keeps Node types out of src/.
    const identical = a.length === b.length && a.every((v, i) => v === b[i]);
    expect(identical).toBe(false);
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

describe('runCli presets', () => {
  it('test_presets_lists_curated_tunings_with_citations', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['presets'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('12-tet');
    expect(text).toContain('kirnberger-iii'); // historical temperament
    expect(text).toContain('makam-ussak-example'); // measured, culturally contextualized
    expect(text).toContain('source:'); // provenance travels with the listing
  });

  it('test_presets_exports_preset_by_id', () => {
    const { io, texts } = makeIo();
    expect(runCli(['presets', 'werckmeister-iii', '-o', 'w3.scl'], io)).toBe(0);
    expect(texts['w3.scl']).toBeDefined();
  });

  it('test_presets_bohlen_pierce_keeps_non_octave_period', () => {
    // Round-trip a tritave-period preset through .scl and read the period back.
    const { io, texts } = makeIo();
    expect(runCli(['presets', 'bohlen-pierce-13', '-o', 'bp.scl'], io)).toBe(0);
    const back = makeIo({ 'bp.scl': texts['bp.scl'] as string });
    expect(runCli(['info', 'bp.scl'], back.io)).toBe(0);
    expect(back.stdout.join('\n')).toContain('period      : 1901.95');
  });

  it('test_presets_unknown_id_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['presets', 'nope', '-o', 'x.scl'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('unknown id');
  });

  it('test_presets_missing_output_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['presets', '12-tet'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('missing -o');
  });
});

describe('runCli edo', () => {
  it('test_edo_reports_step_size_and_consistency_limit', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['edo', '12'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('12-EDO');
    expect(text).toContain('step = 100.0000 cents');
    expect(text).toContain('consistency limit : 5-odd-limit');
  });

  it('test_edo_31_shows_its_near_just_major_third', () => {
    // 31-EDO is prized for its ~0.8c-accurate 5/4 (it is essentially meantone).
    const { io, stdout } = makeIo();
    expect(runCli(['edo', '31'], io)).toBe(0);
    const fifthHarmonicRow = stdout.find((l) => l.trim().startsWith('5 '));
    expect(fifthHarmonicRow).toBeDefined();
    expect(fifthHarmonicRow).toContain('0.78c');
  });

  it('test_edo_limit_option_bounds_the_table', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['edo', '12', '--limit', '7'], io)).toBe(0);
    const rows = stdout.filter((l) => /^\s+\d+\s/.test(l));
    expect(rows).toHaveLength(4); // harmonics 1, 3, 5, 7
  });

  it('test_edo_reports_patent_val_and_identifies_meantone', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['edo', '31'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).toContain('<31 49 72 87]');
    expect(text).toContain('syntonic comma (meantone)'); // 31-EDO is a meantone system
  });

  it('test_edo_22_is_not_reported_as_meantone', () => {
    // 22-EDO is the standard non-meantone counterexample; it is porcupine.
    const { io, stdout } = makeIo();
    expect(runCli(['edo', '22'], io)).toBe(0);
    const text = stdout.join('\n');
    expect(text).not.toContain('syntonic comma (meantone)');
    expect(text).toContain('porcupine comma');
  });

  it('test_edo_names_intervals_and_classifies_sharpness', () => {
    // 12-EDO: classical names, no arrows needed.
    const twelve = makeIo();
    expect(runCli(['edo', '12'], twelve.io)).toBe(0);
    const t12 = twelve.stdout.join('\n');
    expect(t12).toContain('P1 m2 M2 m3 M3 P4 A4 P5 m6 M6 m7 M7 P8');
    expect(t12).toContain('classical');

    // 22-EDO: sharpness 3, so ups and downs appear.
    const twentytwo = makeIo();
    expect(runCli(['edo', '22'], twentytwo.io)).toBe(0);
    const t22 = twentytwo.stdout.join('\n');
    expect(t22).toContain('needs ups/downs');
    expect(t22).toContain('^m3');

    // 7-EDO: a perfect EDO — every interval perfect/major, no minor.
    const seven = makeIo();
    expect(runCli(['edo', '7'], seven.io)).toBe(0);
    expect(seven.stdout.join('\n')).toContain('perfect');
  });

  it('test_edo_reports_timbre_bend', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['edo', '13'], io)).toBe(0);
    expect(stdout.join('\n')).toContain('timbre bend');
  });

  it('test_edo_bad_argument_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['edo', 'nope'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('usage: ruri edo');
  });
});

describe('runCli mos', () => {
  it('test_mos_lists_the_classic_fifth_ladder', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['mos', '701.955'], io)).toBe(0);
    const sizes = stdout
      .filter((l) => /^\s+\d+\s/.test(l))
      .map((l) => Number(l.trim().split(/\s+/)[0]));
    expect(sizes).toEqual([2, 3, 5, 7, 12, 17, 29, 41, 53]);
    expect(stdout.join('\n')).toContain('5L2s'); // the diatonic, at size 7
  });

  it('test_mos_limit_option_bounds_the_ladder', () => {
    const { io, stdout } = makeIo();
    expect(runCli(['mos', '701.955', '--limit', '12'], io)).toBe(0);
    const sizes = stdout
      .filter((l) => /^\s+\d+\s/.test(l))
      .map((l) => Number(l.trim().split(/\s+/)[0]));
    expect(sizes).toEqual([2, 3, 5, 7, 12]);
  });

  it('test_mos_accepts_a_non_octave_period', () => {
    const tritave = String(1200 * Math.log2(3));
    const { io, stdout } = makeIo();
    expect(runCli(['mos', '400', tritave], io)).toBe(0);
    expect(stdout.join('\n')).toContain('period 1901.95');
  });

  it('test_mos_bad_argument_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['mos', 'nope'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('usage: ruri mos');
  });

  it('test_mos_bad_period_returns_2', () => {
    const { io, stderr } = makeIo();
    expect(runCli(['mos', '700', '0'], io)).toBe(2);
    expect(stderr.join('\n')).toContain('periodCents');
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

describe('runCli — non-numeric flag values are refused at the door', () => {
  it('test_ref_that_is_not_a_number_exits_2_before_any_output', () => {
    // parseFloat('abc') is NaN, and NaN slipped past every `<= 0` check: `info`
    // printed a report, `convert -o x.wav` wrote 132 KB of audio from a NaN
    // reference. Now the flag is refused once, by name.
    const { io, stderr, stdout, bytes } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['info', 'in.scl', '--ref', 'abc'], io)).toBe(2);
    expect(stderr.join('\n')).toMatch(/--ref must be a number/);
    expect(stdout).toEqual([]);
    expect(runCli(['convert', 'in.scl', '-o', 'x.wav', '--ref', 'abc'], io)).toBe(2);
    expect(Object.keys(bytes)).toEqual([]);
  });

  it('test_limit_and_seconds_that_are_not_numbers_exit_2', () => {
    const { io, stderr } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['edo', '19', '--limit', 'abc'], io)).toBe(2);
    expect(runCli(['render', 'in.scl', '-o', 'x.wav', '--seconds', 'abc'], io)).toBe(2);
    expect(stderr.join('\n')).toMatch(/--limit must be a number/);
    expect(stderr.join('\n')).toMatch(/--seconds must be a number/);
  });

  it('test_a_missing_flag_value_is_refused_the_same_way', () => {
    const { io } = makeIo({ 'in.scl': scl12 });
    expect(runCli(['info', 'in.scl', '--ref'], io)).toBe(2);
  });
});

describe('runCli info — just-ratio hint sign', () => {
  it('test_a_degree_sharper_than_the_ratio_shows_a_minus_offset', () => {
    // 702.5c sits 0.545c above 3/2, so the hint reads "≈ 3/2 (-0.5c)": the
    // ratio is flat of the degree. The '+' direction was already covered.
    const scl = '! t.scl\n!\nsharp fifth\n 2\n!\n 702.5\n 2/1\n';
    const { io, stdout } = makeIo({ 'in.scl': scl });
    expect(runCli(['info', 'in.scl'], io)).toBe(0);
    expect(stdout.join('\n')).toMatch(/≈ 3\/2 \(-0\.5c\)/);
  });
});
