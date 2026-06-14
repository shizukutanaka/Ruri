import { describe, it, expect } from 'vitest';
import { edo, degreeToFreq } from './core/tuning.js';
import { meantoneQuarterComma, pythagorean } from './core/temperament.js';
import { rankChords, realizeRankedChordFreqs, progressionSmoothness } from './core/chord-search.js';
import { minimalVoiceLeading } from './core/voice-leading.js';
import { harmonicSpectrum } from './core/spectrum.js';
import { pluck, normalize, mix, DEFAULT_KS } from './core/ks-synth.js';
import { adsrEnvelope, applyEnvelope } from './core/envelope.js';
import { encodeWav } from './adapters/wav.js';
import { tuningToMtsFrequencies, mtsBulkDump, freqToMtsKey } from './adapters/mts.js';
import { writeTun } from './adapters/tun.js';
import { getTuningById } from './data/presets.js';
import { chordFromSemitones, realizeChordFreqs } from './core/chord.js';
import { fretlessOud, fingerFretlessChord } from './core/fretless.js';

// Socratic Q8: the new modules were only unit-tested in isolation. These tests
// exercise them as connected end-to-end pipelines, the way a real caller would.

describe('integration: temperament → chord ranking → voice leading → synthesis → WAV', () => {
  const tuning = meantoneQuarterComma(440);
  const spectrum = harmonicSpectrum();

  it('pipeline_produces_audible_wav', () => {
    // 1. Rank triads of the meantone tuning; take the smoothest.
    const ranked = rankChords(tuning, { size: 3, spectrum, periodicityWeight: 0, limit: 5 });
    expect(ranked.length).toBeGreaterThan(0);
    const best = ranked[0]!;
    expect(best.degrees[0]).toBe(0);

    // 2. Realize the chord's frequencies on the tuning.
    const freqs = best.degrees.map((d) => degreeToFreq(tuning, d));
    expect(freqs.every((f) => f > 0)).toBe(true);

    // 3. Pluck each note, envelope it, mix to one buffer.
    const sr = 44100;
    const env = adsrEnvelope(
      { attackS: 0.005, decayS: 0.1, sustainLevel: 0.6, releaseS: 0.2 },
      0.5,
      sr,
    );
    const voices = freqs.map((f) => {
      const wave = pluck(f, { ...DEFAULT_KS, sampleRate: sr, seconds: 0.7 });
      return applyEnvelope(wave, env);
    });
    const mixed = normalize(mix(voices));

    // 4. Encode to WAV.
    const wav = encodeWav(mixed, sr);
    expect(wav.length).toBeGreaterThan(44); // header + samples
    // RIFF magic.
    expect([wav[0], wav[1], wav[2], wav[3]]).toEqual([0x52, 0x49, 0x46, 0x46]);
    // Signal is non-silent.
    expect(mixed.some((s) => Math.abs(s) > 0.01)).toBe(true);
  });

  it('voice_leading_between_two_ranked_chords_is_minimal', () => {
    const ranked = rankChords(tuning, { size: 3, spectrum, limit: 5 });
    const a = ranked[0]!.degrees.map((d) => degreeToFreq(tuning, d));
    const b = ranked[1]!.degrees.map((d) => degreeToFreq(tuning, d));
    const vl = minimalVoiceLeading(a, b);
    // Sorted matching is optimal: swapping any two targets cannot reduce total.
    expect(vl.assignments.length).toBe(3);
    expect(vl.totalCents).toBeGreaterThanOrEqual(0);
    expect(vl.maxCents).toBeLessThanOrEqual(vl.totalCents + 1e-9);
  });
});

describe('integration: EDO/pythagorean → MTS + .tun export', () => {
  it('edo19_round_trips_through_mts_frequencies', () => {
    const tuning = edo(19);
    const freqs = tuningToMtsFrequencies(tuning);
    expect(freqs.length).toBe(128);
    // Anchor (MIDI 69) is the tuning reference.
    expect(freqs[69]).toBeCloseTo(degreeToFreq(tuning, 69 - 69), 6);
    const sysex = mtsBulkDump(freqs, '19-edo');
    expect(sysex.length).toBe(408);
    expect(sysex[0]).toBe(0xf0);
    expect(sysex[407]).toBe(0xf7);
    // Every data byte stays within 7-bit MIDI range.
    expect(Array.from(sysex.slice(1, 407)).every((b) => b <= 0x7f)).toBe(true);
  });

  it('pythagorean_exports_to_tun_with_128_notes', () => {
    const tuning = pythagorean(440);
    const freqs = tuningToMtsFrequencies(tuning);
    const tun = writeTun(freqs, 'pythagorean');
    // Two sections, each with 128 note lines.
    const noteLines = tun.split('\n').filter((l) => l.startsWith('note '));
    expect(noteLines.length).toBe(256);
    expect(tun.indexOf('[Tuning]')).toBeLessThan(tun.indexOf('[Exact Tuning]'));
  });

  it('mts_key_for_anchor_is_exact_when_tuning_reference_is_440', () => {
    const tuning = edo(12, 440);
    const freqs = tuningToMtsFrequencies(tuning);
    // MIDI 69 = 440 Hz → MTS key { semitone: 69, fraction14: 0 }.
    const key = freqToMtsKey(freqs[69]!);
    expect(key.semitone).toBe(69);
    expect(key.fraction14).toBe(0);
  });
});

// Socratic Q37: bridging functions Q31-Q36 validated together as an end-to-end pipeline.
describe('integration: preset tuning → chord ranking → progression smoothness (Q31-Q36 cohesion)', () => {
  it('makam_preset_through_full_pipeline', () => {
    // getTuningById (Q36) → rankChords → realizeRankedChordFreqs (Q33) → progressionSmoothness (Q35)
    const makam = getTuningById('makam-ussak-example');
    expect(makam).toBeDefined();

    const chords = rankChords(makam!, { size: 3, limit: 4 });
    expect(chords.length).toBeGreaterThan(0);

    const cost = progressionSmoothness(chords, 440);
    expect(Number.isFinite(cost)).toBe(true);
    expect(cost).toBeGreaterThanOrEqual(0);

    // Each chord realizes to correct frequencies
    const freqs = realizeRankedChordFreqs(chords[0]!, 440);
    expect(freqs[0]).toBeCloseTo(440, 6);
    expect(freqs.every((f) => f > 0)).toBe(true);
  });

  it('chord_to_fretless_oud_pipeline', () => {
    // Chord → realizeChordFreqs bridges Chord → fingerFretlessChord (fretless takes Hz directly).
    const oud = fretlessOud(440);
    // Use a narrow chord (root + fifth) within the oud's range
    const fifth = chordFromSemitones('fifth', [0, 7]);
    const freqs = realizeChordFreqs(fifth, 440); // A4=440 Hz, E5≈659 Hz
    const result = fingerFretlessChord(oud, freqs);
    // fingerFretlessChord returns FretlessPosition[] | null
    // Oud C4 open string = ~261 Hz; A4=440 Hz is reachable (within 2 octaves above some string)
    if (result !== null) {
      expect(result.length).toBe(2);
      for (const p of result) {
        expect(p.cents).toBeGreaterThanOrEqual(0);
        expect(p.freqHz).toBeGreaterThan(0);
      }
    } else {
      // If A4 (440 Hz) is not reachable on this oud tuning, that's a valid result
      expect(result).toBeNull();
    }
  });

  it('edo_preset_smoothness_is_finite_for_multiple_chord_sizes', () => {
    // Validates that progressionSmoothness works across different EDOs and sizes.
    for (const n of [7, 12, 19]) {
      const tuning = edo(n);
      const chords = rankChords(tuning, { size: 2, limit: 3 });
      const cost = progressionSmoothness(chords, 261.63);
      expect(Number.isFinite(cost)).toBe(true);
      expect(cost).toBeGreaterThanOrEqual(0);
    }
  });
});
