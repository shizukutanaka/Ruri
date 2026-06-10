/** MPE chord export: one note per channel + per-note pitch bend for microtonal pitches. */

import { freqToMpe } from '../core/midi.js';
import { type NoteEvent } from './smf.js';

/** A pitch-bend event paired with the note it precedes. */
export interface MpeChannelNote {
  readonly channel: number;
  readonly note: NoteEvent;
  readonly bend14: number;
}

export interface MpeOptions {
  /** Member channels to spread notes across (MPE lower zone = 1..15). */
  readonly channels: readonly number[];
  /** Pitch-bend range in semitones the receiver is configured for. */
  readonly bendRangeSemitones: number;
  readonly velocity: number;
  readonly startTicks: number;
  readonly durationTicks: number;
}

export const DEFAULT_MPE: Omit<MpeOptions, 'startTicks' | 'durationTicks'> = {
  channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  bendRangeSemitones: 48,
  velocity: 90,
};

/**
 * Map chord member frequencies to per-channel notes + bends.
 * Throws if the chord has more notes than available channels (MPE limit).
 */
export function chordToMpe(freqsHz: readonly number[], opts: MpeOptions): MpeChannelNote[] {
  if (freqsHz.length > opts.channels.length) {
    throw new RangeError(
      `chord has ${freqsHz.length} notes but only ${opts.channels.length} MPE channels available`,
    );
  }
  return freqsHz.map((hz, i) => {
    const { note, bend14 } = freqToMpe(hz, opts.bendRangeSemitones);
    return {
      channel: opts.channels[i] as number,
      bend14,
      note: {
        note,
        velocity: opts.velocity,
        startTicks: opts.startTicks,
        durationTicks: opts.durationTicks,
        channel: opts.channels[i] as number,
      },
    };
  });
}
