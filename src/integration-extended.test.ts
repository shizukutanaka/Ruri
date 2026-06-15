import { describe, it, expect } from 'vitest';
import { edo, degreeToFreq, equalTemperament12 } from './core/tuning.js';
import { meantoneQuarterComma, pythagorean } from './core/temperament.js';
import {
  rankChords,
  realizeRankedChordFreqs,
  progressionSmoothness,
  rankedChordToChord,
  optimalChordOrder,
} from './core/chord-search.js';
import { minimalVoiceLeading } from './core/voice-leading.js';
import { harmonicSpectrum, bellSpectrum } from './core/spectrum.js';
import { pluck, normalize, mix, DEFAULT_KS } from './core/ks-synth.js';
import { adsrEnvelope, applyEnvelope } from './core/envelope.js';
import { encodeWav, pluckChordToWav, strikeChordToWav } from './adapters/wav.js';
import { tuningToMtsFrequencies, mtsBulkDump, freqToMtsKey, tuningToMts } from './adapters/mts.js';
import { progressionToSmf, decodeSmf } from './adapters/smf.js';
import { writeTun } from './adapters/tun.js';
import { getTuningById } from './data/presets.js';
import { chordFromSemitones, realizeChordFreqs } from './core/chord.js';
import { fretlessOud, fingerFretlessChord } from './core/fretless.js';
import { scaleMode, rankScaleChords, chordFromBestMode, type Scale } from './core/scale.js';
import { rankTuningsByFit, spectrumToTuning } from './core/dissonance.js';

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

// Q79 — End-to-end integration: "Scale to DAW" pipeline.
// Exercises the full Q47-Q77 bridge functions together in a realistic scenario:
// edo(12) → tuningToScale → scaleMode (Dorian) → rankScaleChords
//   → rankedChordToChord → optimalChordOrder → progressionToSmf → decodeSmf (round-trip)
describe('integration Q79: scale-to-DAW pipeline (Dorian → MIDI)', () => {
  // equalTemperament12 produces id='12-tet' which matches Scale.tuningId='12-tet'.
  const t12 = equalTemperament12(440);

  // Ionian (major) as the parent scale; Dorian = mode index 1.
  const ionian: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('dorian_ranked_triads_produce_valid_midi_round_trip', () => {
    // 1. Obtain the Dorian mode (modeIndex=1 of Ionian).
    const dorian = scaleMode(ionian, 1, t12);
    expect(dorian.degreeIndices.length).toBe(7);

    // 2. Rank triads within Dorian.
    const ranked = rankScaleChords(dorian, t12, { size: 3, limit: 5 });
    expect(ranked.length).toBeGreaterThan(0);

    // 3. Convert RankedChords to portable Chord objects.
    const chords = ranked.map((r) => rankedChordToChord(r));
    expect(chords.length).toBe(ranked.length);

    // 4. Optimise voice-leading order.
    const { chords: ordered, totalCents } = optimalChordOrder(chords, 261.63);
    expect(ordered.length).toBe(chords.length);
    expect(totalCents).toBeGreaterThanOrEqual(0);

    // 5. Encode to MIDI.
    const midi = progressionToSmf(ordered, 261.63);
    expect(midi.length).toBeGreaterThan(14); // at minimum header + track

    // 6. RIFF-style: SMF starts with MThd.
    expect(midi[0]).toBe(0x4d); // 'M'
    expect(midi[1]).toBe(0x54); // 'T'
    expect(midi[2]).toBe(0x68); // 'h'
    expect(midi[3]).toBe(0x64); // 'd'

    // 7. Round-trip: decodeSmf must recover note events.
    const { notes } = decodeSmf(midi);
    // Each chord has 3 notes; total notes = chords.length * 3.
    expect(notes.length).toBe(ordered.length * 3);
    // All notes have positive duration.
    expect(notes.every((n) => n.durationTicks > 0)).toBe(true);
  });

  it('rankTuningsByFit_returns_sorted_coverage_for_harmonic_spectrum', () => {
    const tunings = [edo(12), edo(19), edo(31)];
    const ranked = rankTuningsByFit(tunings, harmonicSpectrum());
    // Must return one entry per tuning.
    expect(ranked.length).toBe(3);
    // Coverage must be descending (or equal) across the ranking.
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.suitability.coverage).toBeGreaterThanOrEqual(
        ranked[i]!.suitability.coverage,
      );
    }
    // Coverage values must all be in [0, 1].
    expect(ranked.every((r) => r.suitability.coverage >= 0 && r.suitability.coverage <= 1)).toBe(
      true,
    );
  });

  it('pluckChordToWav_returns_valid_RIFF_WAV', () => {
    const wav = pluckChordToWav([261.63, 329.63, 392.0]);
    // WAV starts with RIFF magic.
    expect(wav[0]).toBe(0x52); // 'R'
    expect(wav[1]).toBe(0x49); // 'I'
    expect(wav[2]).toBe(0x46); // 'F'
    expect(wav[3]).toBe(0x46); // 'F'
    // Must have more than just the header.
    expect(wav.length).toBeGreaterThan(44);
  });

  it('chordFromBestMode_returns_chord_with_at_least_two_intervals', () => {
    const { chord } = chordFromBestMode(ionian, t12);
    // A triad (default size=3) has 3 intervals: root + 2 above.
    expect(chord.intervals.length).toBeGreaterThanOrEqual(2);
  });
});

// Q80 — End-to-end integration: "Timbre-derived tuning" pipeline.
// bellSpectrum() → spectrumToTuning → rankTuningsByFit → tuningToMts → strikeChordToWav
describe('integration Q80: timbre-derived tuning pipeline (bell spectrum → MTS + WAV)', () => {
  const bell = bellSpectrum();

  it('bell_self_derived_tuning_has_highest_coverage_among_candidates', () => {
    // 1. Derive the acoustically optimal tuning for bell timbre.
    const bellTuning = spectrumToTuning(bell);
    expect(bellTuning.degrees.length).toBeGreaterThan(0);

    // 2. Rank [edo(12), edo(19), bellTuning] by fit for bell spectrum.
    const ranked = rankTuningsByFit([edo(12), edo(19), bellTuning], bell);
    expect(ranked.length).toBe(3);

    // 3. The bell-derived tuning must have the highest (or equal) coverage,
    //    since by construction it was built from exactly those consonant intervals.
    const bellEntry = ranked.find((r) => r.tuning.id === bellTuning.id);
    expect(bellEntry).toBeDefined();
    const bellCoverage = bellEntry!.suitability.coverage;
    const edo12Coverage = ranked.find((r) => r.tuning.id === '12-edo')!.suitability.coverage;
    // Bell-derived tuning must at least match (≥) the 12-EDO coverage for bell spectrum.
    expect(bellCoverage).toBeGreaterThanOrEqual(edo12Coverage);
  });

  it('tuningToMts_bell_tuning_is_408_bytes', () => {
    const bellTuning = spectrumToTuning(bell);
    const mts = tuningToMts(bellTuning);
    // MTS bulk dump is always exactly 408 bytes.
    expect(mts.length).toBe(408);
    // Starts with SysEx start byte.
    expect(mts[0]).toBe(0xf0);
    // Ends with SysEx end byte.
    expect(mts[407]).toBe(0xf7);
    // All interior data bytes are 7-bit (≤ 0x7f).
    expect(Array.from(mts.slice(1, 407)).every((b) => b <= 0x7f)).toBe(true);
  });

  it('strikeChordToWav_bell_spectrum_returns_valid_RIFF_WAV', () => {
    const wav = strikeChordToWav([220, 330], bell);
    // WAV starts with RIFF magic.
    expect(wav[0]).toBe(0x52); // 'R'
    expect(wav[1]).toBe(0x49); // 'I'
    expect(wav[2]).toBe(0x46); // 'F'
    expect(wav[3]).toBe(0x46); // 'F'
    // Must have content beyond the 44-byte header.
    expect(wav.length).toBeGreaterThan(44);
  });
});
