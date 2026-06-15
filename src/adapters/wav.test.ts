import { describe, it, expect } from 'vitest';
import { encodeWav, strikeChordToWav, tuningToScaleWav, pluckScaleWav } from './wav.js';
import { harmonicSpectrum } from '../core/spectrum.js';
import { edo } from '../core/tuning.js';
import { DEFAULT_KS } from '../core/ks-synth.js';
import { type Scale } from '../core/scale.js';

describe('WAV encoder', () => {
  it('test_header_riff_wave', () => {
    const w = encodeWav(new Float32Array([0, 0.5, -0.5]), 44100);
    expect(String.fromCharCode(w[0]!, w[1]!, w[2]!, w[3]!)).toBe('RIFF');
    expect(String.fromCharCode(w[8]!, w[9]!, w[10]!, w[11]!)).toBe('WAVE');
  });

  it('test_size_is_44_plus_2_per_sample', () => {
    expect(encodeWav(new Float32Array(100)).length).toBe(44 + 200);
  });

  it('test_sample_rate_written', () => {
    const w = encodeWav(new Float32Array([0]), 48000);
    const dv = new DataView(w.buffer);
    expect(dv.getUint32(24, true)).toBe(48000);
  });

  it('test_clipping_clamped', () => {
    const w = encodeWav(new Float32Array([2.0, -2.0]));
    const dv = new DataView(w.buffer);
    expect(dv.getInt16(44, true)).toBe(32767);
    expect(dv.getInt16(46, true)).toBe(-32767);
  });

  it('test_value_round_trips_16bit', () => {
    const w = encodeWav(new Float32Array([0.5]));
    const dv = new DataView(w.buffer);
    expect(dv.getInt16(44, true)).toBe(Math.round(0.5 * 32767));
  });
});

// Q54: strikeChord produces Float32Array; encodeWav accepts one — should chord→WAV be one call?
describe('strikeChordToWav — chord synthesis to WAV in one call (Q54)', () => {
  it('test_output_is_valid_wav_with_riff_header', () => {
    const wav = strikeChordToWav([261.63, 329.63, 392.0], harmonicSpectrum());
    expect(wav[0]).toBe(0x52); // 'R'
    expect(wav[1]).toBe(0x49); // 'I'
    expect(wav[2]).toBe(0x46); // 'F'
    expect(wav[3]).toBe(0x46); // 'F'
  });

  it('test_output_matches_encodeWav_of_strikeChord', () => {
    const spectrum = harmonicSpectrum();
    const freqs = [220, 277, 330];
    const wav1 = strikeChordToWav(freqs, spectrum);
    // Verify same length as manual pipeline
    expect(wav1.length).toBeGreaterThan(44); // at least header
    expect(wav1[8]).toBe(0x57); // 'W' in WAVE
    expect(wav1[9]).toBe(0x41); // 'A'
    expect(wav1[10]).toBe(0x56); // 'V'
    expect(wav1[11]).toBe(0x45); // 'E'
  });

  it('test_sample_rate_matches_modal_opts', () => {
    const wav = strikeChordToWav([440], harmonicSpectrum(), {
      sampleRate: 22050,
      seconds: 0.1,
      decay: 3,
    });
    const dv = new DataView(wav.buffer);
    // bytes 24-27: sample rate (little-endian uint32)
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_empty_freqs_throws', () => {
    expect(() => strikeChordToWav([], harmonicSpectrum())).toThrow(RangeError);
  });
});

// Q59: TuningSystem is first-class — should playing its degrees as audio be one call?
describe('tuningToScaleWav — TuningSystem sonification in one call (Q59)', () => {
  it('test_output_is_valid_wav_riff_header', () => {
    const wav = tuningToScaleWav(edo(7), { ...DEFAULT_KS, noteSeconds: 0.05 });
    expect(wav[0]).toBe(0x52); // 'R'
    expect(wav[1]).toBe(0x49); // 'I'
    expect(wav[2]).toBe(0x46); // 'F'
    expect(wav[3]).toBe(0x46); // 'F'
  });

  it('test_output_length_reflects_degree_count', () => {
    const tuning = edo(12);
    const noteSeconds = 0.1;
    const opts = { ...DEFAULT_KS, noteSeconds };
    const wav = tuningToScaleWav(tuning, opts);
    const samplesPerNote = Math.floor(DEFAULT_KS.sampleRate * noteSeconds);
    const expectedSamples = samplesPerNote * tuning.degrees.length;
    // WAV = 44 byte header + 2 bytes per sample (16-bit PCM)
    expect(wav.length).toBe(44 + expectedSamples * 2);
  });

  it('test_12edo_and_7edo_produce_different_lengths', () => {
    const opts = { ...DEFAULT_KS, noteSeconds: 0.1 };
    const wav12 = tuningToScaleWav(edo(12), opts);
    const wav7 = tuningToScaleWav(edo(7), opts);
    expect(wav12.length).toBeGreaterThan(wav7.length);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = { ...DEFAULT_KS, sampleRate: 22050, noteSeconds: 0.05 };
    const wav = tuningToScaleWav(edo(5), opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });
});

// Q63: Scale is first-class — should Scale → WAV file bytes be one call?
describe('pluckScaleWav — Scale melodic WAV in one call (Q63)', () => {
  const tuning = edo(12);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-edo',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };

  it('test_output_is_valid_wav_riff_header', () => {
    const wav = pluckScaleWav(major, tuning, { ...DEFAULT_KS, noteSeconds: 0.05 });
    expect(wav[0]).toBe(0x52); // 'R'
    expect(wav[1]).toBe(0x49); // 'I'
    expect(wav[2]).toBe(0x46); // 'F'
    expect(wav[3]).toBe(0x46); // 'F'
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_reflects_scale_degree_count', () => {
    const noteSeconds = 0.1;
    const opts = { ...DEFAULT_KS, noteSeconds };
    const wav = pluckScaleWav(major, tuning, opts);
    const samplesPerNote = Math.floor(DEFAULT_KS.sampleRate * noteSeconds);
    const expectedSamples = samplesPerNote * major.degreeIndices.length;
    // WAV = 44 byte header + 2 bytes per sample (16-bit PCM)
    expect(wav.length).toBe(44 + expectedSamples * 2);
  });

  it('test_7_note_scale_longer_than_5_note_scale', () => {
    const pentatonic: Scale = {
      id: 'penta',
      name: 'Pentatonic',
      tuningId: '12-edo',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const opts = { ...DEFAULT_KS, noteSeconds: 0.1 };
    const wavMajor = pluckScaleWav(major, tuning, opts);
    const wavPenta = pluckScaleWav(pentatonic, tuning, opts);
    expect(wavMajor.length).toBeGreaterThan(wavPenta.length);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = { ...DEFAULT_KS, sampleRate: 22050, noteSeconds: 0.05 };
    const wav = pluckScaleWav(major, tuning, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const wrongTuning = edo(19); // id='19-edo', but scale expects '12-edo'
    expect(() => pluckScaleWav(major, wrongTuning, { ...DEFAULT_KS, noteSeconds: 0.05 })).toThrow(
      RangeError,
    );
  });
});
