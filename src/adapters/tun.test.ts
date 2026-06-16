import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { midiToFreq } from '../core/midi.js';
import {
  writeTun,
  TUN_DEFAULT_BASEFREQ_HZ,
  chordToTun,
  scaleToTunText,
  tuningToTun,
  presetProgressionTun,
  scaleProgressionBundle,
  tuningBundle,
  scaleFullBundle,
} from './tun.js';
import { writeScl } from './scala.js';
import { chordFromRatios, chordFromSemitones } from '../core/chord.js';
import { equalTemperament12, edo } from '../core/tuning.js';
import { type Scale, scaleModeSeries, tuningToScale } from '../core/scale.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build 128 12-TET frequencies (key k → 440 × 2^((k−69)/12)). */
function makeTetFreqs(a4Hz = 440): readonly number[] {
  return Array.from({ length: 128 }, (_, k) => midiToFreq(k, a4Hz));
}

/** Count occurrences of `prefix` at the start of lines in `text`. */
function countLines(text: string, prefix: string): number {
  return text.split('\n').filter((l) => l.startsWith(prefix)).length;
}

/** Return the index of `needle` in the lines array, or -1. */
function lineIndex(text: string, needle: string): number {
  return text.split('\n').indexOf(needle);
}

// ---------------------------------------------------------------------------
// Golden / structural tests
// ---------------------------------------------------------------------------

describe('writeTun golden tests', () => {
  const tet = makeTetFreqs();
  const output = writeTun(tet, 'Test Scale');

  it('test_first_line_is_name_comment', () => {
    expect(output.split('\n')[0]).toBe('; Test Scale');
  });

  it('test_note_0_is_zero_cents_in_tuning_section', () => {
    // With default basefreq, MIDI 0 in 12-TET is exactly 0 cents.
    expect(output).toContain('note 0=0\n');
  });

  it('test_note_69_is_6900_in_tuning_section', () => {
    // A4 = 440 Hz → 69 × 100 = 6900 cents above basefreq.
    expect(output).toContain('note 69=6900\n');
  });

  it('test_note_69_is_6900_in_exact_tuning_section', () => {
    expect(output).toContain('note 69=6900.00000\n');
  });

  it('test_tuning_section_appears_before_exact_tuning_section', () => {
    const tunIdx = lineIndex(output, '[Tuning]');
    const exactIdx = lineIndex(output, '[Exact Tuning]');
    expect(tunIdx).toBeGreaterThanOrEqual(0);
    expect(exactIdx).toBeGreaterThan(tunIdx);
  });

  it('test_tuning_section_has_exactly_128_note_lines', () => {
    // Collect lines between [Tuning] and [Exact Tuning].
    const lines = output.split('\n');
    const tunStart = lines.indexOf('[Tuning]');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const noteLines = lines.slice(tunStart + 1, exactStart).filter((l) => l.startsWith('note '));
    expect(noteLines).toHaveLength(128);
  });

  it('test_exact_tuning_section_has_exactly_128_note_lines', () => {
    // Collect lines after [Exact Tuning] that start with 'note '.
    const lines = output.split('\n');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const noteLines = lines.slice(exactStart + 1).filter((l) => l.startsWith('note '));
    expect(noteLines).toHaveLength(128);
  });

  it('test_total_note_line_count_is_256', () => {
    expect(countLines(output, 'note ')).toBe(256);
  });

  it('test_basefreq_line_matches_default_constant', () => {
    expect(output).toContain(`basefreq=${TUN_DEFAULT_BASEFREQ_HZ.toPrecision(20)}`);
  });

  it('test_file_ends_with_newline', () => {
    expect(output.endsWith('\n')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Custom basefreq
// ---------------------------------------------------------------------------

describe('writeTun custom basefreq', () => {
  it('test_custom_basefreq_440_note69_is_near_0_cents', () => {
    const tet = makeTetFreqs();
    const out = writeTun(tet, 'x', { basefreqHz: 440 });
    // A4 = 440 Hz with basefreq = 440 Hz → 0 cents; [Exact Tuning] note 69=0.00000
    expect(out).toContain('note 69=0.00000');
  });

  it('test_custom_basefreq_is_written_to_file_header', () => {
    // Regression (Socratic): the emitted basefreq line must reflect the ACTUAL
    // basefreq, otherwise a parser reads every pitch shifted by ~6 octaves.
    const tet = makeTetFreqs();
    const out = writeTun(tet, 'x', { basefreqHz: 440 });
    expect(out).toContain(`basefreq=${(440).toPrecision(20)}`);
    expect(out).not.toContain('basefreq=8.1757989156437073336');
  });

  it('test_custom_basefreq_round_trips_to_input_frequencies', () => {
    // Parse the [Exact Tuning] basefreq + note cents back to Hz and compare.
    const tet = makeTetFreqs();
    const custom = 256;
    const out = writeTun(tet, 'x', { basefreqHz: custom });
    const lines = out.split('\n');
    const baseLine = lines.find((l) => l.startsWith('basefreq='));
    expect(baseLine).toBeDefined();
    const base = Number.parseFloat((baseLine as string).slice('basefreq='.length));
    const exactStart = lines.indexOf('[Exact Tuning]');
    for (let k = 0; k < 128; k++) {
      const noteLine = lines[exactStart + 2 + k] as string; // +1 basefreq, +1 to first note
      const cents = Number.parseFloat(noteLine.slice(`note ${k}=`.length));
      const recovered = base * 2 ** (cents / 1200);
      expect(recovered).toBeCloseTo(tet[k] as number, 2);
    }
  });
});

// ---------------------------------------------------------------------------
// Name sanitisation
// ---------------------------------------------------------------------------

describe('writeTun name sanitisation', () => {
  it('test_newline_in_name_is_replaced_with_space', () => {
    const tet = makeTetFreqs();
    const out = writeTun(tet, 'Line\nBreak');
    // The first line must still be a single comment line (no extra lines injected).
    expect(out.split('\n')[0]).toBe('; Line Break');
  });

  it('test_control_chars_in_name_do_not_change_line_count', () => {
    const tet = makeTetFreqs();
    const clean = writeTun(tet, 'Normal Name');
    const dirty = writeTun(tet, 'Bad\x00\x1fName');
    expect(dirty.split('\n').length).toBe(clean.split('\n').length);
  });
});

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------

describe('writeTun validation errors', () => {
  it('test_wrong_length_throws_range_error', () => {
    expect(() => writeTun([440, 550], 'bad')).toThrow(RangeError);
  });

  it('test_empty_array_throws_range_error', () => {
    expect(() => writeTun([], 'bad')).toThrow(RangeError);
  });

  it('test_zero_frequency_throws_range_error', () => {
    const freqs = makeTetFreqs() as number[];
    freqs[60] = 0;
    expect(() => writeTun(freqs, 'bad')).toThrow(RangeError);
  });

  it('test_negative_frequency_throws_range_error', () => {
    const freqs = makeTetFreqs() as number[];
    freqs[60] = -440;
    expect(() => writeTun(freqs, 'bad')).toThrow(RangeError);
  });

  it('test_nan_frequency_throws_range_error', () => {
    const freqs = makeTetFreqs() as number[];
    freqs[60] = NaN;
    expect(() => writeTun(freqs, 'bad')).toThrow(RangeError);
  });

  it('test_infinite_frequency_throws_range_error', () => {
    const freqs = makeTetFreqs() as number[];
    freqs[60] = Infinity;
    expect(() => writeTun(freqs, 'bad')).toThrow(RangeError);
  });

  it('test_zero_basefreq_throws_range_error', () => {
    expect(() => writeTun(makeTetFreqs(), 'bad', { basefreqHz: 0 })).toThrow(RangeError);
  });

  it('test_negative_basefreq_throws_range_error', () => {
    expect(() => writeTun(makeTetFreqs(), 'bad', { basefreqHz: -1 })).toThrow(RangeError);
  });

  it('test_nan_basefreq_throws_range_error', () => {
    expect(() => writeTun(makeTetFreqs(), 'bad', { basefreqHz: NaN })).toThrow(RangeError);
  });

  it('test_infinite_basefreq_throws_range_error', () => {
    expect(() => writeTun(makeTetFreqs(), 'bad', { basefreqHz: Infinity })).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// fast-check property: round-trip via [Exact Tuning] section
// ---------------------------------------------------------------------------

describe('writeTun fast-check properties', () => {
  /**
   * Safe frequency range: 8.2..12000 Hz (well within audible + MIDI range,
   * avoids extreme values that would push cents out of js number precision).
   */
  const safeFreqArb = fc.double({ min: 8.2, max: 12000, noNaN: true, noDefaultInfinity: true });

  it('property_exact_tuning_round_trip_within_0001_cents', () => {
    fc.assert(
      fc.property(fc.array(safeFreqArb, { minLength: 128, maxLength: 128 }), (freqs) => {
        const out = writeTun(freqs, 'prop');
        const lines = out.split('\n');
        const exactStart = lines.indexOf('[Exact Tuning]');
        if (exactStart < 0) return false;

        // Skip the 'basefreq=...' line right after [Exact Tuning].
        const noteLines = lines
          .slice(exactStart + 1)
          .filter((l) => l.startsWith('note '))
          .slice(0, 128);

        if (noteLines.length !== 128) return false;

        for (let k = 0; k < 128; k++) {
          const line = noteLines[k] as string;
          // Parse "note <k>=<cents>"
          const eqIdx = line.indexOf('=');
          const parsedCents = Number.parseFloat(line.slice(eqIdx + 1));
          // Recover frequency: basefreq × 2^(cents / 1200)
          const recovered = TUN_DEFAULT_BASEFREQ_HZ * 2 ** (parsedCents / 1200);
          const inputHz = freqs[k] as number;
          // Verify within 0.001 cents (toFixed(5) gives 1e-5 cent resolution)
          const centsDiff = Math.abs(1200 * Math.log2(recovered / inputHz));
          if (centsDiff >= 0.001) return false;
        }
        return true;
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Q114 — chordToTun
// ---------------------------------------------------------------------------

describe('chordToTun', () => {
  const justMajor = chordFromRatios('just-major', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);
  const rootHz = 261.63; // middle C

  it('test_returns_valid_tun_string_for_just_major_chord', () => {
    const out = chordToTun(justMajor, rootHz);
    expect(out).toContain('[Tuning]');
    expect(out).toContain('[Exact Tuning]');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('test_chord_name_used_in_comment_header', () => {
    const out = chordToTun(justMajor, rootHz);
    expect(out.split('\n')[0]).toBe('; just-major');
  });

  it('test_explicit_name_overrides_chord_name', () => {
    const out = chordToTun(justMajor, rootHz, 'My Chord');
    expect(out.split('\n')[0]).toBe('; My Chord');
  });

  it('test_has_exactly_128_note_lines_in_tuning_section', () => {
    const out = chordToTun(justMajor, rootHz);
    const lines = out.split('\n');
    const tunStart = lines.indexOf('[Tuning]');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const noteLines = lines.slice(tunStart + 1, exactStart).filter((l) => l.startsWith('note '));
    expect(noteLines).toHaveLength(128);
  });

  it('test_chord_frequency_overwrites_nearest_midi_key', () => {
    // root at 261.63 Hz is MIDI 60 (middle C). Check that key 60 is NOT standard 12-TET.
    const out = chordToTun(justMajor, rootHz);
    const lines = out.split('\n');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const key60Line = lines.slice(exactStart + 1).find((l) => l.startsWith('note 60='));
    expect(key60Line).toBeDefined();
    // 261.63 Hz relative to default basefreq
    const parsedCents = Number.parseFloat((key60Line as string).slice('note 60='.length));
    const recoveredHz = TUN_DEFAULT_BASEFREQ_HZ * 2 ** (parsedCents / 1200);
    expect(recoveredHz).toBeCloseTo(rootHz, 1);
  });

  it('test_empty_chord_throws_range_error', () => {
    const empty = { name: 'empty', intervals: [] };
    expect(() => chordToTun(empty, rootHz)).toThrow(RangeError);
  });

  it('test_zero_root_throws_range_error', () => {
    expect(() => chordToTun(justMajor, 0)).toThrow(RangeError);
  });

  it('test_negative_root_throws_range_error', () => {
    expect(() => chordToTun(justMajor, -440)).toThrow(RangeError);
  });

  it('test_non_finite_root_throws_range_error', () => {
    expect(() => chordToTun(justMajor, NaN)).toThrow(RangeError);
  });

  it('test_semitone_chord_exported_correctly', () => {
    const semChord = chordFromSemitones('major', [0, 4, 7]);
    const out = chordToTun(semChord, 440);
    expect(out).toContain('[Tuning]');
    // key 69 = A4 = 440 Hz = root, should appear in exact tuning as ~6900 cents
    const lines = out.split('\n');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const key69Line = lines.slice(exactStart + 1).find((l) => l.startsWith('note 69='));
    expect(key69Line).toBeDefined();
    const cents = Number.parseFloat((key69Line as string).slice('note 69='.length));
    expect(cents).toBeCloseTo(6900, 1);
  });
});

// Q129 — scaleToTunText: Scale + TuningSystem → .tun string in one call
describe('scaleToTunText (Q129)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_valid_tun_string_structure', () => {
    const out = scaleToTunText(major, t12);
    expect(out).toContain('[Tuning]');
    expect(out).toContain('[Exact Tuning]');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('test_has_exactly_128_note_lines', () => {
    const out = scaleToTunText(major, t12);
    const lines = out.split('\n');
    const noteLines = lines.filter((l) => l.startsWith('note '));
    expect(noteLines).toHaveLength(256); // 128 in [Tuning] + 128 in [Exact Tuning]
  });

  it('test_default_name_is_scale_id', () => {
    const out = scaleToTunText(major, t12);
    expect(out.split('\n')[0]).toBe('; major');
  });

  it('test_explicit_name_used_in_comment_header', () => {
    const out = scaleToTunText(major, t12, 'My Scale');
    expect(out.split('\n')[0]).toBe('; My Scale');
  });

  it('test_scale_frequencies_written_to_middle_note_slots', () => {
    // Default middleNote=60; scale degree 0 (440 Hz) should appear at key 60
    const out = scaleToTunText(major, t12);
    const lines = out.split('\n');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const key60Line = lines.slice(exactStart + 1).find((l) => l.startsWith('note 60='));
    expect(key60Line).toBeDefined();
    const cents = Number.parseFloat((key60Line as string).slice('note 60='.length));
    // 440 Hz above basefreq ≈ 6900 cents
    const recovered = TUN_DEFAULT_BASEFREQ_HZ * 2 ** (cents / 1200);
    expect(recovered).toBeCloseTo(440, 1);
  });

  it('test_custom_middle_note_shifts_scale_slot', () => {
    const out = scaleToTunText(major, t12, undefined, { middleNote: 48 });
    const lines = out.split('\n');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const key48Line = lines.slice(exactStart + 1).find((l) => l.startsWith('note 48='));
    expect(key48Line).toBeDefined();
    const cents = Number.parseFloat((key48Line as string).slice('note 48='.length));
    const recovered = TUN_DEFAULT_BASEFREQ_HZ * 2 ** (cents / 1200);
    expect(recovered).toBeCloseTo(440, 1);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => scaleToTunText(major, edo(19))).toThrow(RangeError);
  });
});

// Q151 (prerequisite) — tuningToTun: TuningSystem → .tun string in one call
describe('tuningToTun', () => {
  const t12 = equalTemperament12(440);

  it('test_returns_valid_tun_structure', () => {
    const out = tuningToTun(t12);
    expect(out).toContain('[Tuning]');
    expect(out).toContain('[Exact Tuning]');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('test_default_name_is_tuning_id', () => {
    const out = tuningToTun(t12);
    expect(out.split('\n')[0]).toBe(`; ${t12.id}`);
  });

  it('test_explicit_name_overrides_tuning_id', () => {
    const out = tuningToTun(t12, 'My Tuning');
    expect(out.split('\n')[0]).toBe('; My Tuning');
  });

  it('test_has_128_note_lines_in_tuning_section', () => {
    const out = tuningToTun(t12);
    const lines = out.split('\n');
    const tunStart = lines.indexOf('[Tuning]');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const noteLines = lines.slice(tunStart + 1, exactStart).filter((l) => l.startsWith('note '));
    expect(noteLines).toHaveLength(128);
  });

  it('test_anchor_midi_note_maps_to_reference_hz', () => {
    const out = tuningToTun(t12);
    const lines = out.split('\n');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const key69Line = lines.slice(exactStart + 1).find((l) => l.startsWith('note 69='));
    expect(key69Line).toBeDefined();
    const cents = Number.parseFloat((key69Line as string).slice('note 69='.length));
    const recovered = TUN_DEFAULT_BASEFREQ_HZ * 2 ** (cents / 1200);
    expect(recovered).toBeCloseTo(440, 1);
  });

  it('test_custom_anchor_midi_note_option', () => {
    const out = tuningToTun(t12, undefined, { anchorMidiNote: 60 });
    const lines = out.split('\n');
    const exactStart = lines.indexOf('[Exact Tuning]');
    const key60Line = lines.slice(exactStart + 1).find((l) => l.startsWith('note 60='));
    expect(key60Line).toBeDefined();
    const cents = Number.parseFloat((key60Line as string).slice('note 60='.length));
    const recovered = TUN_DEFAULT_BASEFREQ_HZ * 2 ** (cents / 1200);
    expect(recovered).toBeCloseTo(440, 1);
  });
});

// Q151 — presetProgressionTun: preset id → .tun string in one call
describe('presetProgressionTun (Q151)', () => {
  it('test_returns_tun_string_for_known_preset', () => {
    const result = presetProgressionTun('12-tet', [0, 3, 4], 261.63);
    expect(result).toBeDefined();
    expect(result).toContain('[Tuning]');
    expect(result).toContain('[Exact Tuning]');
  });

  it('test_returns_undefined_for_unknown_preset', () => {
    const result = presetProgressionTun('no-such-preset', [0, 3, 4], 261.63);
    expect(result).toBeUndefined();
  });

  it('test_returns_string_for_just_intonation_preset', () => {
    const result = presetProgressionTun('just-5-limit', [0, 2, 4], 440);
    expect(typeof result).toBe('string');
    expect(result).toContain('[Exact Tuning]');
  });

  it('test_result_ends_with_newline', () => {
    const result = presetProgressionTun('makam-ussak-example', [0, 1, 2], 261.63);
    expect(result?.endsWith('\n')).toBe(true);
  });
});

// Q154 — scaleProgressionBundle: scale + tuning → { smf, tun } in one call
describe('scaleProgressionBundle (Q154)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_returns_smf_uint8array_and_tun_string', () => {
    const { smf, tun } = scaleProgressionBundle(major, t12, 261.63);
    expect(smf).toBeInstanceOf(Uint8Array);
    expect(typeof tun).toBe('string');
  });

  it('test_smf_starts_with_midi_header', () => {
    const { smf } = scaleProgressionBundle(major, t12, 261.63);
    // MThd header bytes: 0x4D, 0x54, 0x68, 0x64
    expect(smf[0]).toBe(0x4d);
    expect(smf[1]).toBe(0x54);
    expect(smf[2]).toBe(0x68);
    expect(smf[3]).toBe(0x64);
  });

  it('test_tun_contains_valid_structure', () => {
    const { tun } = scaleProgressionBundle(major, t12, 261.63);
    expect(tun).toContain('[Tuning]');
    expect(tun).toContain('[Exact Tuning]');
    expect(tun.endsWith('\n')).toBe(true);
  });

  it('test_custom_name_appears_in_tun_header', () => {
    const { tun } = scaleProgressionBundle(major, t12, 261.63, 'My Major');
    expect(tun.split('\n')[0]).toBe('; My Major');
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => scaleProgressionBundle(major, edo(19), 261.63)).toThrow(RangeError);
  });
});

// Q174 — tuningBundle: TuningSystem → { smf, tun, scl } in one call
describe('tuningBundle (Q174)', () => {
  const t12 = equalTemperament12(440);

  it('test_returns_all_three_outputs', () => {
    const { smf, tun, scl } = tuningBundle(t12);
    expect(smf).toBeInstanceOf(Uint8Array);
    expect(typeof tun).toBe('string');
    expect(scl).toBeDefined();
    expect(Array.isArray(scl.degrees)).toBe(true);
  });

  it('test_smf_starts_with_midi_header', () => {
    const { smf } = tuningBundle(t12);
    expect(String.fromCharCode(smf[0]!, smf[1]!, smf[2]!, smf[3]!)).toBe('MThd');
  });

  it('test_tun_has_tuning_sections', () => {
    const { tun } = tuningBundle(t12);
    expect(tun).toContain('[Tuning]');
    expect(tun).toContain('[Exact Tuning]');
    expect(tun.endsWith('\n')).toBe(true);
  });

  it('test_scl_is_serializable', () => {
    const { scl } = tuningBundle(t12);
    const text = writeScl(scl);
    expect(text).toContain(t12.id);
  });

  it('test_smf_length_reflects_degree_count', () => {
    const { smf } = tuningBundle(t12);
    expect(smf.length).toBeGreaterThan(14);
  });

  it('test_19edo_produces_valid_bundle', () => {
    const t19 = edo(19);
    const { smf, tun, scl } = tuningBundle(t19);
    expect(smf).toBeInstanceOf(Uint8Array);
    expect(tun).toContain('[Tuning]');
    expect(scl.degrees.length).toBeGreaterThan(0);
  });
});

describe('scaleFullBundle (Q247)', () => {
  const t12 = equalTemperament12(440);
  const scale = scaleModeSeries(tuningToScale(t12), t12)[0]!;

  it('returns wav, smf, scl, tun, mts', () => {
    const bundle = scaleFullBundle(scale, t12);
    expect(bundle.wav).toBeInstanceOf(Uint8Array);
    expect(bundle.smf).toBeInstanceOf(Uint8Array);
    expect(typeof bundle.scl).toBe('string');
    expect(typeof bundle.tun).toBe('string');
    expect(bundle.mts).toBeInstanceOf(Uint8Array);
  });
  it('wav length > 44', () => {
    expect(scaleFullBundle(scale, t12).wav.length).toBeGreaterThan(44);
  });
  it('scl contains !', () => {
    expect(scaleFullBundle(scale, t12).scl).toContain('!');
  });
});
