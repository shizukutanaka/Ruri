import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { encodeVlq, decodeVlq, encodeSmf, decodeSmf, type NoteEvent } from './smf.js';

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
