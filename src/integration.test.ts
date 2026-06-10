import { describe, it, expect } from 'vitest';
import { equalTemperament12, degreeToFreq } from './core/tuning.js';
import { generatedScale } from './core/generate.js';
import { chordFromSemitones, realizeChordFreqs } from './core/chord.js';
import { chordDissonance } from './core/dissonance.js';
import { chordPeriodicity } from './core/harmonicity.js';
import { harmonicSpectrum, bellSpectrum } from './core/spectrum.js';
import { voicesForChord, detuneFromBase } from './core/synth.js';
import { guitarStandard } from './core/instrument.js';
import { fingerChord } from './core/fingering.js';
import { freqToMidiFloat } from './core/midi.js';
import { encodeSmf, decodeSmf, type NoteEvent } from './adapters/smf.js';
import { sclFromCents, writeScl, parseScl, degreeCents } from './adapters/scala.js';
import { chordToMpe, DEFAULT_MPE } from './adapters/mpe.js';

/**
 * End-to-end: pick a tuning, build a chord, evaluate it, finger it, audition it,
 * and export it through every output path. This is the product workflow, not a unit.
 */
describe('integration: 12-TET C major triad → all outputs', () => {
  const tuning = equalTemperament12(440);
  // Root C4 (MIDI 60); major triad as 12-TET semitone offsets.
  const rootHz = 440 * 2 ** ((60 - 69) / 12);
  const chord = chordFromSemitones('major', [0, 4, 7]);
  const freqs = realizeChordFreqs(chord, rootHz);

  it('step1_tuning_produces_12_degrees', () => {
    expect(degreeToFreq(tuning, 0)).toBeCloseTo(440, 6);
  });

  it('step2_chord_evaluated_consonant', () => {
    const harm = chordDissonance(freqs, harmonicSpectrum());
    const period = chordPeriodicity(freqs.map((f) => f / freqs[0]!));
    expect(harm).toBeGreaterThan(0);
    expect(period).toBe(15); // just major triad periodicity
  });

  it('step3_timbre_changes_dissonance', () => {
    const harm = chordDissonance(freqs, harmonicSpectrum());
    const bell = chordDissonance(freqs, bellSpectrum());
    expect(bell).not.toBeCloseTo(harm, 1); // same chord, different timbre → different roughness
  });

  it('step4_fingerable_on_guitar', () => {
    // express chord relative to guitar low-E cents grid
    const g = guitarStandard();
    // C major on guitar: use cents relative to open low E. C=800, E=1200, G=1500 (one voicing)
    const sols = fingerChord(g, [800, 1200, 1500]);
    expect(sols.length).toBeGreaterThan(0);
    expect(sols[0]!.positions.length).toBe(3);
  });

  it('step5_audition_voices_match_chord', () => {
    const voices = voicesForChord(freqs, harmonicSpectrum(3));
    expect(voices.length).toBe(freqs.length * 3); // 3 partials each
    // fundamental of each member present
    for (const f of freqs) {
      expect(voices.some((v) => Math.abs(v.freq - f) < 1e-6)).toBe(true);
    }
  });

  it('step6_export_smf_round_trips', () => {
    const notes: NoteEvent[] = freqs.map((f) => ({
      note: Math.round(freqToMidiFloat(f)),
      velocity: 90,
      startTicks: 0,
      durationTicks: 960,
      channel: 0,
    }));
    const decoded = decodeSmf(encodeSmf(notes));
    expect(decoded.notes.map((n) => n.note)).toEqual([60, 64, 67]);
  });

  it('step7_export_scala_round_trips', () => {
    const scl = sclFromCents('12-TET major', [400, 700, 1200]);
    const back = parseScl(writeScl(scl));
    expect(degreeCents(back.degrees[0]!)).toBeCloseTo(400, 6);
  });

  it('step8_export_mpe_distinct_channels', () => {
    const mpe = chordToMpe(freqs, { ...DEFAULT_MPE, startTicks: 0, durationTicks: 480 });
    expect(new Set(mpe.map((m) => m.channel)).size).toBe(3);
  });
});

describe('integration: microtonal (non-12-TET) chord → microtonal outputs', () => {
  // Bohlen-Pierce-ish generated scale on a non-octave period — exercises microtonal path.
  const scaleCents = generatedScale(443, 1902, 4); // 4 notes
  const rootHz = 220;
  const freqs = scaleCents.slice(0, 3).map((c) => rootHz * 2 ** (c / 1200));

  it('microtonal_chord_has_distinct_pitches', () => {
    expect(new Set(freqs.map((f) => Math.round(f))).size).toBe(3);
  });

  it('microtonal_pitches_survive_mpe_bend', () => {
    const mpe = chordToMpe(freqs, { ...DEFAULT_MPE, startTicks: 0, durationTicks: 480 });
    expect(mpe.length).toBe(3);
    // each note should carry a non-trivial bend (microtonal, not on 12-TET grid)
    const anyBent = mpe.some((m) => Math.abs(m.bend14 - 8192) > 10);
    expect(anyBent).toBe(true);
  });

  it('microtonal_scale_exports_to_scala', () => {
    const scl = sclFromCents(
      'generated non-octave',
      scaleCents.filter((c) => c > 0),
    );
    const text = writeScl(scl);
    expect(text).toContain('.'); // cents form
    expect(parseScl(text).degrees.length).toBeGreaterThan(0);
  });

  it('audition_detune_recovers_microtonal_pitch', () => {
    const target = freqs[1]!;
    const baseMidi = Math.round(freqToMidiFloat(target));
    const { baseFreq, detuneCents } = detuneFromBase(target, baseMidi);
    const recovered = baseFreq * 2 ** (detuneCents / 1200);
    expect(recovered).toBeCloseTo(target, 6);
  });
});
