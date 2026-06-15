import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  encodeVlq,
  decodeVlq,
  encodeSmf,
  decodeSmf,
  type NoteEvent,
  chordToSmf,
  progressionToSmf,
  optimalProgressionSmf,
  scaleChordProgressionSmf,
  scaleToSmf,
  progressionAnalysisToSmf,
  chordMapToSmf,
  presetProgressionSmf,
  bestChordMapSmf,
  bestTuningChordSmf,
} from './smf.js';
import { chordFromSemitones, chordFromRatios } from '../core/chord.js';
import { edo, equalTemperament12 } from '../core/tuning.js';
import { type Scale, chordProgressionAnalysis, scaleToChordMap } from '../core/scale.js';
import { harmonicSpectrum } from '../core/spectrum.js';

describe('VLQ (I7 high-risk)', () => {
  it('test_known_vlq_values', () => {
    expect(encodeVlq(0)).toEqual([0x00]);
    expect(encodeVlq(127)).toEqual([0x7f]);
    expect(encodeVlq(128)).toEqual([0x81, 0x00]);
    expect(encodeVlq(0x3fff)).toEqual([0xff, 0x7f]);
    expect(encodeVlq(0x4000)).toEqual([0x81, 0x80, 0x00]);
  });

  it('test_vlq_rejects_negative', () => {
    expect(() => encodeVlq(-1)).toThrow(RangeError);
  });

  it('property_vlq_round_trips', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0x0fffffff }), (n) => {
        const bytes = new Uint8Array(encodeVlq(n));
        const { value, length } = decodeVlq(bytes, 0);
        expect(value).toBe(n);
        expect(length).toBe(bytes.length);
      }),
    );
  });
});

describe('SMF header bytes', () => {
  it('test_header_is_well_formed', () => {
    const smf = encodeSmf([
      { note: 60, velocity: 100, startTicks: 0, durationTicks: 480, channel: 0 },
    ]);
    expect(String.fromCharCode(...smf.slice(0, 4))).toBe('MThd');
    expect([...smf.slice(4, 8)]).toEqual([0, 0, 0, 6]); // header length 6
    expect([...smf.slice(8, 10)]).toEqual([0, 0]); // format 0
    expect([...smf.slice(10, 12)]).toEqual([0, 1]); // 1 track
    expect([...smf.slice(12, 14)]).toEqual([1, 224]); // ppq 480
    expect(String.fromCharCode(...smf.slice(14, 18))).toBe('MTrk');
  });

  it('test_ends_with_end_of_track', () => {
    const smf = encodeSmf([
      { note: 60, velocity: 100, startTicks: 0, durationTicks: 480, channel: 0 },
    ]);
    expect([...smf.slice(-4)]).toEqual([0x00, 0xff, 0x2f, 0x00]);
  });
});

describe('SMF golden round-trip', () => {
  const noteArb = fc.record({
    note: fc.integer({ min: 0, max: 127 }),
    velocity: fc.integer({ min: 1, max: 127 }),
    startTicks: fc.integer({ min: 0, max: 100000 }),
    durationTicks: fc.integer({ min: 1, max: 5000 }),
    channel: fc.integer({ min: 0, max: 15 }),
  });

  it('property_encode_decode_preserves_notes', () => {
    fc.assert(
      fc.property(fc.array(noteArb, { minLength: 1, maxLength: 20 }), (notes) => {
        // MIDI cannot distinguish overlapping same-(channel,note) events. Keep only a
        // representable subset: at most one active note per (channel,note) at a time.
        const sorted = [...notes].sort((a, b) => a.startTicks - b.startTicks);
        const lastEnd = new Map<string, number>();
        const representable: NoteEvent[] = [];
        for (const n of sorted) {
          const k = `${n.channel}:${n.note}`;
          const end = lastEnd.get(k) ?? -1;
          if (n.startTicks > end) {
            representable.push(n);
            lastEnd.set(k, n.startTicks + n.durationTicks);
          }
        }
        const decoded = decodeSmf(encodeSmf(representable));
        const norm = (ns: NoteEvent[]): string =>
          JSON.stringify(
            [...ns].sort(
              (a, b) => a.startTicks - b.startTicks || a.note - b.note || a.channel - b.channel,
            ),
          );
        expect(decoded.notes.length).toBe(representable.length);
        expect(norm(decoded.notes)).toBe(norm(representable));
      }),
    );
  });

  it('test_chord_round_trips', () => {
    const cMaj: NoteEvent[] = [60, 64, 67].map((note) => ({
      note,
      velocity: 90,
      startTicks: 0,
      durationTicks: 960,
      channel: 0,
    }));
    const decoded = decodeSmf(encodeSmf(cMaj));
    expect(decoded.notes.map((n) => n.note)).toEqual([60, 64, 67]);
    expect(decoded.notes.every((n) => n.durationTicks === 960)).toBe(true);
  });
});

describe('SMF range validation', () => {
  it('test_note_out_of_range_throws', () => {
    expect(() =>
      encodeSmf([{ note: 200, velocity: 1, startTicks: 0, durationTicks: 1, channel: 0 }]),
    ).toThrow(RangeError);
  });

  it('test_channel_out_of_range_throws', () => {
    expect(() =>
      encodeSmf([{ note: 60, velocity: 1, startTicks: 0, durationTicks: 1, channel: 99 }]),
    ).toThrow(RangeError);
  });
});

// Q58: Chord is first-class — should Chord → MIDI file be one call?
describe('chordToSmf — Chord to SMF MIDI in one call (Q58)', () => {
  it('test_output_starts_with_mthd_header', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const midi = chordToSmf(chord, 261.63);
    // 'MThd' = 0x4D 0x54 0x68 0x64
    expect(midi[0]).toBe(0x4d);
    expect(midi[1]).toBe(0x54);
    expect(midi[2]).toBe(0x68);
    expect(midi[3]).toBe(0x64);
  });

  it('test_round_trips_via_decodeSmf', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const midi = chordToSmf(chord, 261.63);
    const { notes } = decodeSmf(midi);
    // Major triad rooted at C4 (261.63 Hz ≈ MIDI 60): degrees 60, 64, 67
    expect(notes.length).toBe(3);
    const pitches = notes.map((n) => n.note).sort((a, b) => a - b);
    expect(pitches).toEqual([60, 64, 67]);
  });

  it('test_all_notes_have_same_startTick_zero', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const { notes } = decodeSmf(chordToSmf(chord, 261.63));
    for (const n of notes) expect(n.startTicks).toBe(0);
  });

  it('test_velocity_option_respected', () => {
    const chord = chordFromSemitones('major', [0, 4, 7]);
    const { notes } = decodeSmf(chordToSmf(chord, 261.63, { velocity: 64 }));
    for (const n of notes) expect(n.velocity).toBe(64);
  });

  it('test_out_of_range_freq_throws', () => {
    // 0.01 Hz maps to a large negative MIDI note — should throw RangeError
    const chord = chordFromSemitones('major', [0, 4, 7]);
    expect(() => chordToSmf(chord, 0.01)).toThrow(RangeError);
  });
});

// Q58: Chord progression → MIDI file in one call
describe('progressionToSmf — Chord[] to SMF MIDI in one call (Q58)', () => {
  const major = chordFromSemitones('major', [0, 4, 7]);
  const minor = chordFromSemitones('minor', [0, 3, 7]);
  const dom7 = chordFromSemitones('dom7', [0, 4, 7, 10]);
  const rootHz = 261.63; // C4

  it('test_output_starts_with_mthd_header', () => {
    const midi = progressionToSmf([major, minor], rootHz);
    expect(midi[0]).toBe(0x4d); // 'M'
    expect(midi[1]).toBe(0x54); // 'T'
    expect(midi[2]).toBe(0x68); // 'h'
    expect(midi[3]).toBe(0x64); // 'd'
  });

  it('test_two_chord_progression_produces_6_notes', () => {
    // major (3 notes) + minor (3 notes) = 6 NoteEvents total
    const { notes } = decodeSmf(progressionToSmf([major, minor], rootHz));
    expect(notes.length).toBe(6);
  });

  it('test_chords_are_sequential_in_time', () => {
    const ppq = 480;
    const { notes } = decodeSmf(progressionToSmf([major, minor], rootHz, { ppq }));
    const chord0 = notes.filter((n) => n.startTicks === 0);
    const chord1 = notes.filter((n) => n.startTicks === ppq); // second chord starts at 1 beat
    expect(chord0.length).toBe(3);
    expect(chord1.length).toBe(3);
  });

  it('test_custom_duration_ticks_is_respected', () => {
    const { notes } = decodeSmf(progressionToSmf([major, minor], rootHz, { durationTicks: 960 }));
    const chord1Start = notes.find((n) => n.startTicks === 960);
    expect(chord1Start).toBeDefined();
  });

  it('test_single_chord_round_trips', () => {
    const { notes } = decodeSmf(progressionToSmf([major], rootHz));
    const pitches = notes.map((n) => n.note).sort((a, b) => a - b);
    expect(pitches).toEqual([60, 64, 67]); // C major triad at C4
  });

  it('test_empty_progression_throws', () => {
    expect(() => progressionToSmf([], rootHz)).toThrow(RangeError);
  });

  it('test_out_of_range_freq_throws', () => {
    expect(() => progressionToSmf([major], 0.001)).toThrow(RangeError);
  });

  it('test_three_chord_progression_note_count', () => {
    // major(3) + minor(3) + dom7(4) = 10 notes
    const { notes } = decodeSmf(progressionToSmf([major, minor, dom7], rootHz));
    expect(notes.length).toBe(10);
  });

  it('test_velocity_option_applied_to_all_notes', () => {
    const { notes } = decodeSmf(progressionToSmf([major, minor], rootHz, { velocity: 50 }));
    for (const n of notes) expect(n.velocity).toBe(50);
  });
});

// Q65: Chord[] → optimize order → MIDI should be one call
describe('optimalProgressionSmf — optimised Chord[] to SMF MIDI in one call (Q65)', () => {
  // optimalChordOrder uses voiceLeadingCost which requires equal voice counts.
  // All chords in a progression must have the same number of voices.
  const major = chordFromSemitones('major', [0, 4, 7]);
  const minor = chordFromSemitones('minor', [0, 3, 7]);
  const aug = chordFromSemitones('aug', [0, 4, 8]);
  const rootHz = 261.63; // C4

  it('test_output_starts_with_mthd_header', () => {
    const midi = optimalProgressionSmf([major, minor], rootHz);
    expect(midi[0]).toBe(0x4d); // 'M'
    expect(midi[1]).toBe(0x54); // 'T'
    expect(midi[2]).toBe(0x68); // 'h'
    expect(midi[3]).toBe(0x64); // 'd'
  });

  it('test_two_chord_note_count_equals_sum_of_chord_sizes', () => {
    // major (3 notes) + minor (3 notes) = 6 NoteEvents total
    const { notes } = decodeSmf(optimalProgressionSmf([major, minor], rootHz));
    expect(notes.length).toBe(6);
  });

  it('test_three_chord_note_count', () => {
    // major(3) + minor(3) + aug(3) = 9 notes total (all same size — required by optimalChordOrder)
    const { notes } = decodeSmf(optimalProgressionSmf([major, minor, aug], rootHz));
    expect(notes.length).toBe(9);
  });

  it('test_single_chord_matches_progressionToSmf', () => {
    const midi1 = optimalProgressionSmf([major], rootHz);
    const midi2 = progressionToSmf([major], rootHz);
    // Same bytes — single chord has trivial ordering
    expect([...midi1]).toEqual([...midi2]);
  });

  it('test_empty_chords_throws_range_error', () => {
    expect(() => optimalProgressionSmf([], rootHz)).toThrow(RangeError);
  });

  it('test_output_is_valid_midi_decodable', () => {
    const midi = optimalProgressionSmf([major, minor, aug], rootHz);
    // Should not throw when decoded
    const { ppq, notes } = decodeSmf(midi);
    expect(ppq).toBe(480);
    expect(notes.length).toBeGreaterThan(0);
  });

  it('test_options_are_forwarded_to_progressionToSmf', () => {
    const { notes } = decodeSmf(optimalProgressionSmf([major, minor], rootHz, { velocity: 42 }));
    for (const n of notes) expect(n.velocity).toBe(42);
  });
});

// Q75: Scale is first-class — should scale → diatonic chord progression → MIDI be one call?
describe('scaleChordProgressionSmf — scale to MIDI progression in one call (Q75)', () => {
  const tuning = edo(12);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-edo',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63; // C4

  it('test_output_starts_with_mthd_header', () => {
    const midi = scaleChordProgressionSmf(major, tuning, rootHz);
    expect(midi[0]).toBe(0x4d); // 'M'
    expect(midi[1]).toBe(0x54); // 'T'
    expect(midi[2]).toBe(0x68); // 'h'
    expect(midi[3]).toBe(0x64); // 'd'
  });

  it('test_output_is_decodable_and_has_notes', () => {
    const midi = scaleChordProgressionSmf(major, tuning, rootHz);
    const { ppq, notes } = decodeSmf(midi);
    expect(ppq).toBe(480);
    expect(notes.length).toBeGreaterThan(0);
  });

  it('test_chords_are_sequential_in_time', () => {
    const midi = scaleChordProgressionSmf(major, tuning, rootHz, { searchOpts: { size: 3 } });
    const { notes } = decodeSmf(midi);
    // Notes should span multiple tick offsets (multiple chords in sequence)
    const startTicks = [...new Set(notes.map((n) => n.startTicks))].sort((a, b) => a - b);
    expect(startTicks.length).toBeGreaterThan(1);
  });

  it('test_velocity_option_forwarded', () => {
    const midi = scaleChordProgressionSmf(major, tuning, rootHz, { velocity: 55 });
    const { notes } = decodeSmf(midi);
    for (const n of notes) expect(n.velocity).toBe(55);
  });

  it('test_mismatched_tuning_throws', () => {
    const wrongTuning = edo(19);
    expect(() => scaleChordProgressionSmf(major, wrongTuning, rootHz)).toThrow(RangeError);
  });

  it('test_size_option_controls_chord_voice_count', () => {
    const midi = scaleChordProgressionSmf(major, tuning, rootHz, { searchOpts: { size: 4 } });
    const { notes } = decodeSmf(midi);
    // All notes should belong to 4-voice chords; each startTick group has 4 notes
    const byTick = new Map<number, number>();
    for (const n of notes) {
      byTick.set(n.startTicks, (byTick.get(n.startTicks) ?? 0) + 1);
    }
    for (const count of byTick.values()) expect(count).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Q83 — scaleToSmf
// ---------------------------------------------------------------------------

describe('scaleToSmf (Q83)', () => {
  const tuning = edo(12, 440);
  // 12-edo major scale
  const major: Scale = {
    id: 'major',
    name: 'Major',
    tuningId: '12-edo',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63; // C4

  it('test_scale_to_smf_starts_with_mthd_header', () => {
    const midi = scaleToSmf(major, tuning, rootHz);
    expect(String.fromCharCode(midi[0]!, midi[1]!, midi[2]!, midi[3]!)).toBe('MThd');
  });

  it('test_scale_to_smf_produces_7_notes_for_major_scale', () => {
    const { notes } = decodeSmf(scaleToSmf(major, tuning, rootHz));
    expect(notes.length).toBe(7);
  });

  it('test_scale_to_smf_notes_are_sequential_in_time', () => {
    const { notes } = decodeSmf(scaleToSmf(major, tuning, rootHz));
    const sorted = [...notes].sort((a, b) => a.startTicks - b.startTicks);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.startTicks).toBeGreaterThan(sorted[i - 1]!.startTicks);
    }
  });

  it('test_scale_to_smf_first_note_is_at_tick_zero', () => {
    const { notes } = decodeSmf(scaleToSmf(major, tuning, rootHz));
    const sorted = [...notes].sort((a, b) => a.startTicks - b.startTicks);
    expect(sorted[0]!.startTicks).toBe(0);
  });

  it('test_scale_to_smf_ascending_midi_pitches', () => {
    const { notes } = decodeSmf(scaleToSmf(major, tuning, rootHz));
    const sorted = [...notes].sort((a, b) => a.startTicks - b.startTicks);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.note).toBeGreaterThan(sorted[i - 1]!.note);
    }
  });

  it('test_scale_to_smf_velocity_option_applied', () => {
    const { notes } = decodeSmf(scaleToSmf(major, tuning, rootHz, { velocity: 64 }));
    for (const n of notes) expect(n.velocity).toBe(64);
  });

  it('test_scale_to_smf_gap_ticks_separates_notes', () => {
    const { notes } = decodeSmf(
      scaleToSmf(major, tuning, rootHz, { durationTicks: 480, gapTicks: 120 }),
    );
    const sorted = [...notes].sort((a, b) => a.startTicks - b.startTicks);
    // Step = 480 + 120 = 600; second note starts at 600
    expect(sorted[1]!.startTicks).toBe(600);
  });

  it('test_scale_to_smf_mismatched_tuning_throws', () => {
    const wrongTuning = edo(19);
    expect(() => scaleToSmf(major, wrongTuning, rootHz)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q122 — progressionAnalysisToSmf
// ---------------------------------------------------------------------------

describe('progressionAnalysisToSmf (Q122)', () => {
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const I = chordFromRatios('I', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);
  const IV = chordFromRatios('IV', [
    [1, 1],
    [4, 3],
    [5, 3],
  ]);
  const V = chordFromRatios('V', [
    [1, 1],
    [3, 2],
    [15, 8],
  ]);

  it('test_starts_with_mthd_header', () => {
    const analysis = chordProgressionAnalysis([I, IV, V], rootHz, spectrum);
    const midi = progressionAnalysisToSmf(analysis, rootHz);
    expect(String.fromCharCode(midi[0]!, midi[1]!, midi[2]!, midi[3]!)).toBe('MThd');
  });

  it('test_produces_same_output_as_progressionToSmf', () => {
    const analysis = chordProgressionAnalysis([I, IV, V], rootHz, spectrum);
    const fromAnalysis = progressionAnalysisToSmf(analysis, rootHz);
    const fromDirect = progressionToSmf([I, IV, V], rootHz);
    expect(fromAnalysis).toEqual(fromDirect);
  });

  it('test_note_count_matches_chord_voices_times_chords', () => {
    const analysis = chordProgressionAnalysis([I, IV], rootHz, spectrum);
    const { notes } = decodeSmf(progressionAnalysisToSmf(analysis, rootHz));
    // Each chord has 3 voices, 2 chords → 6 notes
    expect(notes.length).toBe(6);
  });

  it('test_single_step_analysis_produces_valid_midi', () => {
    const analysis = chordProgressionAnalysis([I], rootHz, spectrum);
    const midi = progressionAnalysisToSmf(analysis, rootHz);
    expect(midi.length).toBeGreaterThan(44);
  });

  it('test_velocity_option_applied', () => {
    const analysis = chordProgressionAnalysis([I, IV], rootHz, spectrum);
    const { notes } = decodeSmf(progressionAnalysisToSmf(analysis, rootHz, { velocity: 64 }));
    for (const n of notes) expect(n.velocity).toBe(64);
  });

  it('test_empty_analysis_throws_range_error', () => {
    expect(() => progressionAnalysisToSmf([], rootHz)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Q123 — chordMapToSmf
// ---------------------------------------------------------------------------

describe('chordMapToSmf (Q123)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63;

  it('test_starts_with_mthd_header', () => {
    const chordMap = scaleToChordMap(major, t12);
    const midi = chordMapToSmf(chordMap, rootHz);
    expect(String.fromCharCode(midi[0]!, midi[1]!, midi[2]!, midi[3]!)).toBe('MThd');
  });

  it('test_note_groups_match_chord_count', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { notes } = decodeSmf(chordMapToSmf(chordMap, rootHz));
    const byTick = new Map<number, number>();
    for (const n of notes) byTick.set(n.startTicks, (byTick.get(n.startTicks) ?? 0) + 1);
    // 7 chords in major scale, each with 3 voices → 7 tick groups
    expect(byTick.size).toBe(chordMap.length);
  });

  it('test_each_group_has_triad_voices', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { notes } = decodeSmf(chordMapToSmf(chordMap, rootHz));
    const byTick = new Map<number, number>();
    for (const n of notes) byTick.set(n.startTicks, (byTick.get(n.startTicks) ?? 0) + 1);
    for (const count of byTick.values()) expect(count).toBe(3);
  });

  it('test_velocity_option_applied', () => {
    const chordMap = scaleToChordMap(major, t12);
    const { notes } = decodeSmf(chordMapToSmf(chordMap, rootHz, { velocity: 70 }));
    for (const n of notes) expect(n.velocity).toBe(70);
  });

  it('test_size_4_chords_produce_four_voices_per_group', () => {
    const chordMap = scaleToChordMap(major, t12, 4);
    const { notes } = decodeSmf(chordMapToSmf(chordMap, rootHz));
    const byTick = new Map<number, number>();
    for (const n of notes) byTick.set(n.startTicks, (byTick.get(n.startTicks) ?? 0) + 1);
    for (const count of byTick.values()) expect(count).toBe(4);
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => chordMapToSmf([], rootHz)).toThrow(RangeError);
  });

  it('test_produces_same_output_as_progressionToSmf', () => {
    const chordMap = scaleToChordMap(major, t12);
    const fromMap = chordMapToSmf(chordMap, rootHz);
    const fromDirect = progressionToSmf(
      chordMap.map((e) => e.chord),
      rootHz,
    );
    expect(fromMap).toEqual(fromDirect);
  });
});

// Q135: presetProgressionSmf — named preset + pattern → MIDI SMF in one call
describe('presetProgressionSmf (Q135)', () => {
  const rootHz = 261.63;

  it('test_known_preset_returns_uint8array', () => {
    const midi = presetProgressionSmf('12-tet', [0, 3, 4, 0], rootHz);
    expect(midi).toBeInstanceOf(Uint8Array);
  });

  it('test_output_has_mthd_header', () => {
    const midi = presetProgressionSmf('12-tet', [0, 3, 4, 0], rootHz);
    expect(midi).not.toBeUndefined();
    expect(String.fromCharCode(midi![0]!, midi![1]!, midi![2]!, midi![3]!)).toBe('MThd');
  });

  it('test_unknown_preset_returns_undefined', () => {
    const midi = presetProgressionSmf('nonexistent-preset', [0, 1, 2], rootHz);
    expect(midi).toBeUndefined();
  });

  it('test_decoded_smf_has_correct_chord_count', () => {
    // Pattern [0, 3, 4, 0] → 4 chords (triads by default) → each chord has 3 notes
    const midi = presetProgressionSmf('12-tet', [0, 3, 4, 0], rootHz);
    const { notes } = decodeSmf(midi!);
    const byTick = new Map<number, number>();
    for (const n of notes) byTick.set(n.startTicks, (byTick.get(n.startTicks) ?? 0) + 1);
    // 4 chords in sequence
    expect(byTick.size).toBe(4);
  });

  it('test_just_5_limit_preset_works', () => {
    const midi = presetProgressionSmf('just-5-limit', [0, 2, 4], rootHz);
    expect(midi).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(midi![0]!, midi![1]!, midi![2]!, midi![3]!)).toBe('MThd');
  });

  it('test_custom_velocity_applied', () => {
    const midi = presetProgressionSmf('12-tet', [0, 3], rootHz, undefined, { velocity: 70 });
    const { notes } = decodeSmf(midi!);
    for (const n of notes) expect(n.velocity).toBe(70);
  });
});

// Q141: bestChordMapSmf — chordMapAnalysis → best entry → SMF in one call
describe('bestChordMapSmf (Q141)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();

  it('test_returns_uint8array_with_mthd_header', () => {
    const midi = bestChordMapSmf(major, t12, spectrum);
    expect(midi).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(midi[0]!, midi[1]!, midi[2]!, midi[3]!)).toBe('MThd');
  });

  it('test_decoded_smf_has_exactly_one_chord', () => {
    const midi = bestChordMapSmf(major, t12, spectrum);
    const { notes } = decodeSmf(midi);
    const byTick = new Map<number, number>();
    for (const n of notes) byTick.set(n.startTicks, (byTick.get(n.startTicks) ?? 0) + 1);
    expect(byTick.size).toBe(1); // just one chord (at tick 0)
  });

  it('test_decoded_chord_has_triad_voices', () => {
    const midi = bestChordMapSmf(major, t12, spectrum);
    const { notes } = decodeSmf(midi);
    expect(notes.length).toBe(3); // triad = 3 notes
  });

  it('test_default_spectrum_produces_valid_output', () => {
    const midi = bestChordMapSmf(major, t12);
    expect(midi).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(midi[0]!, midi[1]!, midi[2]!, midi[3]!)).toBe('MThd');
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => bestChordMapSmf(major, edo(19), spectrum)).toThrow(RangeError);
  });

  it('test_custom_velocity_applied', () => {
    const midi = bestChordMapSmf(major, t12, spectrum, { velocity: 75 });
    const { notes } = decodeSmf(midi);
    for (const n of notes) expect(n.velocity).toBe(75);
  });
});

// Q157: bestTuningChordSmf — bestModeForTuning → bestChordMapEntry → chordToSmf in one call
describe('bestTuningChordSmf (Q157)', () => {
  const t12 = equalTemperament12(440);
  const spectrum = harmonicSpectrum();

  it('test_returns_uint8array_with_mthd_header', () => {
    const midi = bestTuningChordSmf(t12, spectrum);
    expect(midi).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(midi[0]!, midi[1]!, midi[2]!, midi[3]!)).toBe('MThd');
  });

  it('test_decoded_smf_contains_exactly_one_chord', () => {
    const midi = bestTuningChordSmf(t12, spectrum);
    const { notes } = decodeSmf(midi);
    const byTick = new Map<number, number>();
    for (const n of notes) byTick.set(n.startTicks, (byTick.get(n.startTicks) ?? 0) + 1);
    expect(byTick.size).toBe(1);
  });

  it('test_decoded_chord_has_triad_voices', () => {
    const midi = bestTuningChordSmf(t12, spectrum);
    const { notes } = decodeSmf(midi);
    expect(notes.length).toBe(3);
  });

  it('test_default_spectrum_produces_valid_output', () => {
    const midi = bestTuningChordSmf(t12);
    expect(midi).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(midi[0]!, midi[1]!, midi[2]!, midi[3]!)).toBe('MThd');
  });

  it('test_custom_velocity_applied', () => {
    const midi = bestTuningChordSmf(t12, spectrum, { velocity: 80 });
    const { notes } = decodeSmf(midi);
    for (const n of notes) expect(n.velocity).toBe(80);
  });

  it('test_different_tunings_produce_different_midi', () => {
    const t19 = edo(19);
    const midi12 = bestTuningChordSmf(t12, spectrum);
    const midi19 = bestTuningChordSmf(t19, spectrum);
    let differs = false;
    const len = Math.min(midi12.length, midi19.length);
    for (let i = 0; i < len; i++) {
      if (midi12[i] !== midi19[i]) {
        differs = true;
        break;
      }
    }
    expect(differs || midi12.length !== midi19.length).toBe(true);
  });
});
