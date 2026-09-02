/**
 * Scala .kbm (keyboard mapping) import/export.
 *
 * A .kbm file maps MIDI note numbers to scale degrees and fixes an absolute
 * reference frequency so a .scl scale can be played from a standard keyboard.
 */

import { centsToFreq } from '../core/cents.js';
import { degreeCents, type ScalaScale } from './scala.js';

/** Parsed representation of a .kbm keyboard-mapping file. */
export interface KbmMapping {
  readonly size: number;
  readonly firstNote: number;
  readonly lastNote: number;
  readonly middleNote: number;
  readonly referenceNote: number;
  readonly referenceHz: number;
  readonly octaveDegree: number;
  /** length === size; null means 'x' (unmapped). Empty when size === 0. */
  readonly mapping: readonly (number | null)[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strip '!' comments and return non-comment lines.
 * Blank lines that appear WITHIN the mapping section are NOT discarded
 * (the .kbm spec does not tolerate blank lines there), but we follow the
 * same "trim and skip blank" policy scala.ts uses for robustness.
 */
function nonCommentLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .filter((l) => !l.startsWith('!'))
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function requireInt(raw: string, field: string): number {
  const v = Number.parseInt(raw, 10);
  if (!Number.isInteger(v) || String(v) !== raw.trim()) {
    throw new RangeError(`invalid .kbm ${field}: ${raw}`);
  }
  return v;
}

function requireMidiNote(raw: string, field: string): number {
  const v = requireInt(raw, field);
  if (v < 0 || v > 127) {
    throw new RangeError(`invalid .kbm ${field} (must be 0–127): ${raw}`);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

/** Parse a .kbm file. Throws RangeError on malformed input (fail fast). */
export function parseKbm(text: string): KbmMapping {
  const lines = nonCommentLines(text);

  if (lines.length < 7) {
    throw new RangeError(`invalid .kbm: expected at least 7 header values, got ${lines.length}`);
  }

  const size = requireInt(lines[0] as string, 'map size');
  if (size < 0) throw new RangeError(`invalid .kbm map size (must be >= 0): ${lines[0]}`);

  const firstNote = requireMidiNote(lines[1] as string, 'first MIDI note');
  const lastNote = requireMidiNote(lines[2] as string, 'last MIDI note');
  if (firstNote > lastNote) {
    throw new RangeError(
      `invalid .kbm: firstNote (${firstNote}) must be <= lastNote (${lastNote})`,
    );
  }
  const middleNote = requireMidiNote(lines[3] as string, 'middle note');
  const referenceNote = requireMidiNote(lines[4] as string, 'reference note');

  const referenceHz = Number.parseFloat((lines[5] as string).trim());
  if (!Number.isFinite(referenceHz) || referenceHz <= 0) {
    throw new RangeError(`invalid .kbm reference frequency (must be > 0): ${lines[5]}`);
  }

  const octaveDegree = requireInt(lines[6] as string, 'octave degree');
  if (octaveDegree < 0) {
    throw new RangeError(`invalid .kbm octave degree (must be >= 0): ${lines[6]}`);
  }

  if (lines.length < 7 + size) {
    throw new RangeError(`invalid .kbm: expected ${size} mapping entries, got ${lines.length - 7}`);
  }

  const mapping: (number | null)[] = [];
  for (let i = 0; i < size; i++) {
    const token = (lines[7 + i] as string).trim();
    if (token === 'x') {
      mapping.push(null);
    } else {
      const deg = Number.parseInt(token, 10);
      if (!Number.isInteger(deg) || deg < 0 || String(deg) !== token) {
        throw new RangeError(`invalid .kbm mapping entry (must be integer >= 0 or 'x'): ${token}`);
      }
      mapping.push(deg);
    }
  }

  return {
    size,
    firstNote,
    lastNote,
    middleNote,
    referenceNote,
    referenceHz,
    octaveDegree,
    mapping,
  };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/** Serialize a KbmMapping to .kbm text with a brief comment header. */
export function writeKbm(m: KbmMapping): string {
  const out: string[] = [];
  out.push('! Keyboard mapping file (.kbm)');
  out.push('!');
  out.push(String(m.size));
  out.push(String(m.firstNote));
  out.push(String(m.lastNote));
  out.push(String(m.middleNote));
  out.push(String(m.referenceNote));
  // Reference frequency: emit enough decimal places to survive a round-trip.
  out.push(Number.isInteger(m.referenceHz) ? `${m.referenceHz}.0` : String(m.referenceHz));
  out.push(String(m.octaveDegree));
  for (const entry of m.mapping) {
    out.push(entry === null ? 'x' : String(entry));
  }
  return out.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// kbmNoteToFreq
// ---------------------------------------------------------------------------

/**
 * Convert a MIDI note number to an absolute frequency (Hz) using a .scl scale
 * and a .kbm keyboard mapping.
 *
 * Algorithm:
 *  1. If midiNote < firstNote or > lastNote → return null (out of range).
 *  2. span = size === 0 ? scale.degrees.length : size
 *     (size 0 means linear/default mapping: every degree is used in order).
 *  3. For any note n:
 *       off = n - middleNote
 *       oct = Math.floor(off / span)   — number of formal octaves from middleNote
 *       pos = ((off % span) + span) % span  — position within one span (always >= 0)
 *  4. Resolve scale degree:
 *       size === 0  →  deg = pos  (linear; pos is already the 0-based degree index)
 *       size !== 0  →  deg = mapping[pos]; null → return null (unmapped key).
 *  5. Cents for one degree above 1/1:
 *       deg === 0  →  0 cents  (the 1/1 itself; implicit in .scl)
 *       else       →  degreeCents(scale.degrees[deg - 1])
 *                     (scale.degrees[0] is the first degree above 1/1)
 *       deg > scale.degrees.length → throw (degree out of range).
 *  6. Formal octave cents:
 *       octDeg = octaveDegree === 0 ? scale.degrees.length : octaveDegree
 *       formalOctaveCents = degreeCents(scale.degrees[octDeg - 1])
 *       octDeg > scale.degrees.length → throw.
 *  7. relCents(n) = oct(n) * formalOctaveCents + degreeCentsFor(n)
 *  8. The same calculation is applied to referenceNote WITHOUT the
 *     firstNote/lastNote range check; if referenceNote maps to null (unmapped),
 *     throw (the reference note must be a valid pitch).
 *  9. freq = centsToFreq(relCents(note) - relCents(ref), referenceHz)
 */
export function kbmNoteToFreq(scale: ScalaScale, m: KbmMapping, midiNote: number): number | null {
  // Step 1 – range check.
  if (midiNote < m.firstNote || midiNote > m.lastNote) return null;

  const span = m.size === 0 ? scale.degrees.length : m.size;

  // Formal octave degree (1-based → 0-based index into scale.degrees).
  const octDeg = m.octaveDegree === 0 ? scale.degrees.length : m.octaveDegree;
  if (octDeg > scale.degrees.length || octDeg < 1) {
    throw new RangeError(
      `kbm octaveDegree ${m.octaveDegree} out of range for scale with ${scale.degrees.length} degrees`,
    );
  }
  const octaveDegreeEntry = scale.degrees[octDeg - 1];
  if (octaveDegreeEntry === undefined) {
    throw new RangeError(
      `kbm octaveDegree ${m.octaveDegree} out of range for scale with ${scale.degrees.length} degrees`,
    );
  }
  const formalOctaveCents = degreeCents(octaveDegreeEntry);

  /** Return cents-relative-to-middle for a note, or null if unmapped. */
  function relCentsForNote(note: number): number | null {
    const off = note - m.middleNote;
    const oct = Math.floor(off / span);
    const pos = ((off % span) + span) % span;

    let deg: number | null;
    if (m.size === 0) {
      deg = pos;
    } else {
      deg = m.mapping[pos] ?? null;
    }

    if (deg === null) return null;

    let degCents: number;
    if (deg === 0) {
      degCents = 0;
    } else {
      if (deg > scale.degrees.length) {
        throw new RangeError(
          `kbm mapping degree ${deg} exceeds scale length ${scale.degrees.length}`,
        );
      }
      const entry = scale.degrees[deg - 1];
      if (entry === undefined) {
        throw new RangeError(
          `kbm mapping degree ${deg} exceeds scale length ${scale.degrees.length}`,
        );
      }
      degCents = degreeCents(entry);
    }

    return oct * formalOctaveCents + degCents;
  }

  const noteRel = relCentsForNote(midiNote);
  if (noteRel === null) return null;

  // Step 8 – reference note (no range check, but must not be null).
  const refRel = relCentsForNote(m.referenceNote);
  if (refRel === null) {
    throw new RangeError(
      `kbm referenceNote ${m.referenceNote} maps to an unmapped key ('x'); reference note must be a valid pitch`,
    );
  }

  // Step 9 – absolute frequency.
  return centsToFreq(noteRel - refRel, m.referenceHz);
}
