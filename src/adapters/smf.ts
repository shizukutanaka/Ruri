/** Standard MIDI File (SMF Type 0) encoder + minimal decoder. Zero-dep, byte-exact. */

export interface NoteEvent {
  readonly note: number; // 0..127
  readonly velocity: number; // 1..127
  readonly startTicks: number;
  readonly durationTicks: number;
  readonly channel: number; // 0..15
}

export interface SmfOptions {
  /** Ticks per quarter note (division). */
  readonly ppq: number;
}

const DEFAULT_PPQ = 480;

/** Variable-length quantity (MIDI VLQ): 7 bits per byte, MSB = continuation. */
export function encodeVlq(value: number): number[] {
  if (value < 0 || !Number.isInteger(value)) {
    throw new RangeError(`VLQ requires a non-negative integer, got ${value}`);
  }
  const bytes = [value & 0x7f];
  let v = value >> 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

/** Decode a VLQ at `offset`; returns the value and the number of bytes consumed. */
export function decodeVlq(bytes: Uint8Array, offset: number): { value: number; length: number } {
  let value = 0;
  let length = 0;
  for (;;) {
    const b = bytes[offset + length];
    if (b === undefined) throw new RangeError('VLQ truncated');
    value = (value << 7) | (b & 0x7f);
    length++;
    if ((b & 0x80) === 0) break;
  }
  return { value, length };
}

const str = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const u32 = (n: number): number[] => [
  (n >>> 24) & 0xff,
  (n >>> 16) & 0xff,
  (n >>> 8) & 0xff,
  n & 0xff,
];
const u16 = (n: number): number[] => [(n >>> 8) & 0xff, n & 0xff];

interface AbsEvent {
  readonly tick: number;
  readonly data: number[];
  readonly order: number; // tie-break: note-off (0) before note-on (1) at same tick
}

/** Build the Type-0 track body (events + end-of-track) from notes. */
function trackBytes(notes: readonly NoteEvent[]): number[] {
  const events: AbsEvent[] = [];
  for (const n of notes) {
    if (n.note < 0 || n.note > 127) throw new RangeError(`note out of range: ${n.note}`);
    if (n.channel < 0 || n.channel > 15) throw new RangeError(`channel out of range: ${n.channel}`);
    events.push({
      tick: n.startTicks,
      data: [0x90 | n.channel, n.note, n.velocity],
      order: 1,
    });
    events.push({
      tick: n.startTicks + n.durationTicks,
      data: [0x80 | n.channel, n.note, 0],
      order: 0,
    });
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const body: number[] = [];
  let prevTick = 0;
  for (const e of events) {
    body.push(...encodeVlq(e.tick - prevTick), ...e.data);
    prevTick = e.tick;
  }
  body.push(...encodeVlq(0), 0xff, 0x2f, 0x00); // end of track
  return body;
}

/** Encode notes to a complete SMF Type-0 file. */
export function encodeSmf(
  notes: readonly NoteEvent[],
  opts: SmfOptions = { ppq: DEFAULT_PPQ },
): Uint8Array {
  const track = trackBytes(notes);
  const header = [...str('MThd'), ...u32(6), ...u16(0), ...u16(1), ...u16(opts.ppq)];
  const trackChunk = [...str('MTrk'), ...u32(track.length), ...track];
  return new Uint8Array([...header, ...trackChunk]);
}

/** Minimal decoder: extract note-on/off pairs back into NoteEvents (for golden round-trip). */
export function decodeSmf(bytes: Uint8Array): { ppq: number; notes: NoteEvent[] } {
  const ascii = (o: number, n: number): string =>
    String.fromCharCode(...Array.from(bytes.slice(o, o + n)));
  if (ascii(0, 4) !== 'MThd') throw new RangeError('not an SMF (missing MThd)');
  const ppq = (bytes[12]! << 8) | bytes[13]!;
  if (ascii(14, 4) !== 'MTrk') throw new RangeError('missing MTrk');

  let p = 22; // after MTrk + length
  let tick = 0;
  let running = 0;
  const open = new Map<number, { note: NoteEvent; start: number }>();
  const notes: NoteEvent[] = [];

  while (p < bytes.length) {
    const dt = decodeVlq(bytes, p);
    tick += dt.value;
    p += dt.length;
    let status = bytes[p]!;
    if (status & 0x80) p++;
    else status = running; // running status
    running = status;

    const type = status & 0xf0;
    const channel = status & 0x0f;
    if (type === 0x90 || type === 0x80) {
      const note = bytes[p++]!;
      const vel = bytes[p++]!;
      const key = (channel << 8) | note;
      if (type === 0x90 && vel > 0) {
        open.set(key, {
          note: { note, velocity: vel, startTicks: tick, durationTicks: 0, channel },
          start: tick,
        });
      } else {
        const o = open.get(key);
        if (o) {
          notes.push({ ...o.note, durationTicks: tick - o.start });
          open.delete(key);
        }
      }
    } else if (status === 0xff) {
      const metaType = bytes[p++]!;
      const len = decodeVlq(bytes, p);
      p += len.length + len.value;
      if (metaType === 0x2f) break; // end of track
    } else {
      p += 2; // skip other channel messages (2 data bytes)
    }
  }
  notes.sort((a, b) => a.startTicks - b.startTicks || a.note - b.note);
  return { ppq, notes };
}
