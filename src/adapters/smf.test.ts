import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { encodeVlq, decodeVlq, encodeSmf, decodeSmf, type NoteEvent, chordToSmf } from './smf.js';
import { chordFromSemitones } from '../core/chord.js';

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
