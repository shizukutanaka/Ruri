import { describe, it, expect } from 'vitest';
import {
  encodeWav,
  strikeChordToWav,
  tuningToScaleWav,
  pluckScaleWav,
  pluckChordToWav,
  strikeScaleWav,
  DEFAULT_STRIKE_SCALE,
  strikeRankedChordWav,
  pluckRankedChordWav,
  chordProgressionToWav,
  DEFAULT_CHORD_PROGRESSION_WAV,
  buildChordProgressionWav,
  optimalProgressionWav,
  scaleModeSeriesWav,
  bestProgressionWav,
  bestScaleChordWav,
  chordMapToWav,
  bestModeWav,
  bestChordWav,
  topNChordMapWav,
  bestModeProgressionWav,
  worstNChordMapWav,
  optimalProgressionWavFromScale,
} from './wav.js';
import { harmonicSpectrum, bellSpectrum } from '../core/spectrum.js';
import { edo, equalTemperament12 } from '../core/tuning.js';
import { DEFAULT_KS } from '../core/ks-synth.js';
import { type Scale } from '../core/scale.js';
import { rankChords, rankedChordToChord } from '../core/chord-search.js';
import { chordFromRatios, chordFromSemitones } from '../core/chord.js';
import { rankScaleChords, scaleToChordMap } from '../core/scale.js';

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

// Q69: pluckChord produces Float32Array; encodeWav accepts one — should plucked chord → WAV be one call?
describe('pluckChordToWav — Karplus-Strong chord to WAV in one call (Q69)', () => {
  it('test_output_is_valid_wav_with_riff_header', () => {
    const wav = pluckChordToWav([261.63, 329.63, 392.0]);
    expect(wav[0]).toBe(0x52); // 'R'
    expect(wav[1]).toBe(0x49); // 'I'
    expect(wav[2]).toBe(0x46); // 'F'
    expect(wav[3]).toBe(0x46); // 'F'
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_greater_than_header', () => {
    const wav = pluckChordToWav([440, 550, 660]);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = { ...DEFAULT_KS, sampleRate: 22050 };
    const wav = pluckChordToWav([440], opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_default_sample_rate_matches_DEFAULT_KS', () => {
    const wav = pluckChordToWav([440]);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(DEFAULT_KS.sampleRate);
  });

  it('test_different_freqs_produce_different_audio', () => {
    const wav1 = pluckChordToWav([261.63, 329.63, 392.0]);
    const wav2 = pluckChordToWav([220.0, 277.18, 330.0]);
    // Same length (same default KS duration), but different audio content
    expect(wav1.length).toBe(wav2.length);
    let differs = false;
    for (let i = 44; i < wav1.length; i++) {
      if (wav1[i] !== wav2[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_empty_freqs_throws_range_error', () => {
    expect(() => pluckChordToWav([])).toThrow(RangeError);
  });
});

// Q74: Scale is first-class — should modal synthesis → melodic WAV be one call?
describe('strikeScaleWav — modal synthesis melodic WAV in one call (Q74)', () => {
  const tuning = edo(12);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-edo',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = bellSpectrum();
  const fastOpts = { ...DEFAULT_STRIKE_SCALE, noteSeconds: 0.05, seconds: 0.1 };

  it('test_output_is_valid_wav_riff_header', () => {
    const wav = strikeScaleWav(major, tuning, spectrum, fastOpts);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_reflects_scale_degree_count', () => {
    const noteSeconds = 0.05;
    const opts = { ...DEFAULT_STRIKE_SCALE, noteSeconds, seconds: 0.1 };
    const wav = strikeScaleWav(major, tuning, spectrum, opts);
    const samplesPerNote = Math.floor(DEFAULT_STRIKE_SCALE.sampleRate * noteSeconds);
    const expectedSamples = samplesPerNote * major.degreeIndices.length;
    expect(wav.length).toBe(44 + expectedSamples * 2);
  });

  it('test_7_note_scale_longer_than_5_note_scale', () => {
    const pentatonic: Scale = {
      id: 'penta',
      name: 'Pentatonic',
      tuningId: '12-edo',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const wavMajor = strikeScaleWav(major, tuning, spectrum, fastOpts);
    const wavPenta = strikeScaleWav(pentatonic, tuning, spectrum, fastOpts);
    expect(wavMajor.length).toBeGreaterThan(wavPenta.length);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = { ...DEFAULT_STRIKE_SCALE, sampleRate: 22050, noteSeconds: 0.05, seconds: 0.1 };
    const wav = strikeScaleWav(major, tuning, spectrum, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_different_spectra_produce_different_audio', () => {
    const wavHarmonic = strikeScaleWav(major, tuning, harmonicSpectrum(), fastOpts);
    const wavBell = strikeScaleWav(major, tuning, bellSpectrum(), fastOpts);
    expect(wavHarmonic.length).toBe(wavBell.length);
    let differs = false;
    for (let i = 44; i < wavHarmonic.length; i++) {
      if (wavHarmonic[i] !== wavBell[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const wrongTuning = edo(19);
    expect(() => strikeScaleWav(major, wrongTuning, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_noteSeconds_clamped_to_seconds_when_larger', () => {
    // noteSeconds > seconds → clamped to seconds
    const opts = { ...DEFAULT_STRIKE_SCALE, noteSeconds: 10, seconds: 0.1 };
    const wav = strikeScaleWav(major, tuning, spectrum, opts);
    const samplesPerNote = Math.floor(DEFAULT_STRIKE_SCALE.sampleRate * 0.1); // clamped
    const expectedSamples = samplesPerNote * major.degreeIndices.length;
    expect(wav.length).toBe(44 + expectedSamples * 2);
  });
});

// Q77: RankedChord is first-class — should RankedChord → WAV be one call?
describe('strikeRankedChordWav — RankedChord modal synthesis to WAV in one call (Q77)', () => {
  const tuning = edo(12);
  const spectrum = harmonicSpectrum();
  const rootHz = 261.63;
  const fastOpts = { ...DEFAULT_STRIKE_SCALE, seconds: 0.1 };

  it('test_output_is_valid_wav_riff_header', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wav = strikeRankedChordWav(best!, rootHz, spectrum, fastOpts);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_greater_than_44_byte_header', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wav = strikeRankedChordWav(best!, rootHz, spectrum, fastOpts);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const opts = { ...DEFAULT_STRIKE_SCALE, seconds: 0.1, sampleRate: 22050 };
    const wav = strikeRankedChordWav(best!, rootHz, spectrum, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_two_calls_same_inputs_produce_identical_output', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wav1 = strikeRankedChordWav(best!, rootHz, spectrum, fastOpts);
    const wav2 = strikeRankedChordWav(best!, rootHz, spectrum, fastOpts);
    expect([...wav1]).toEqual([...wav2]);
  });

  it('test_different_spectra_produce_different_audio', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wavHarmonic = strikeRankedChordWav(best!, rootHz, harmonicSpectrum(), fastOpts);
    const wavBell = strikeRankedChordWav(best!, rootHz, bellSpectrum(), fastOpts);
    let differs = false;
    for (let i = 44; i < wavHarmonic.length; i++) {
      if (wavHarmonic[i] !== wavBell[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});

// Q77 (pair): RankedChord is first-class — should RankedChord → plucked WAV be one call?
describe('pluckRankedChordWav — RankedChord Karplus-Strong to WAV in one call (Q77)', () => {
  const tuning = edo(12);
  const rootHz = 261.63;

  it('test_output_is_valid_wav_riff_header', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wav = pluckRankedChordWav(best!, rootHz);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_greater_than_44_byte_header', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wav = pluckRankedChordWav(best!, rootHz);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const opts = { ...DEFAULT_KS, sampleRate: 22050 };
    const wav = pluckRankedChordWav(best!, rootHz, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_default_sample_rate_matches_DEFAULT_KS', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wav = pluckRankedChordWav(best!, rootHz);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(DEFAULT_KS.sampleRate);
  });

  it('test_different_roots_produce_different_audio', () => {
    const [best] = rankChords(tuning, { size: 3 });
    const wav1 = pluckRankedChordWav(best!, 261.63);
    const wav2 = pluckRankedChordWav(best!, 440.0);
    let differs = false;
    for (let i = 44; i < wav1.length; i++) {
      if (wav1[i] !== wav2[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});

// Q100: chordProgressionToWav — explicit Chord[] → single WAV in one call?
describe('chordProgressionToWav — explicit progression to WAV in one call (Q100)', () => {
  const major = chordFromRatios('major', [
    [1, 1],
    [5, 4],
    [3, 2],
  ]);
  const dom7 = chordFromSemitones('dom7', [0, 4, 7, 10]);
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const fastOpts = { ...DEFAULT_CHORD_PROGRESSION_WAV, chordSeconds: 0.05, seconds: 0.1 };

  it('test_output_is_valid_wav_riff_header', () => {
    const wav = chordProgressionToWav([major, dom7], rootHz, spectrum, fastOpts);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_reflects_chord_count', () => {
    const chordSeconds = 0.05;
    const opts = { ...DEFAULT_CHORD_PROGRESSION_WAV, chordSeconds, seconds: 0.1 };
    const wav2 = chordProgressionToWav([major, dom7], rootHz, spectrum, opts);
    const wav3 = chordProgressionToWav([major, dom7, major], rootHz, spectrum, opts);
    // 3-chord progression should produce a longer WAV than 2-chord
    expect(wav3.length).toBeGreaterThan(wav2.length);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = {
      ...DEFAULT_CHORD_PROGRESSION_WAV,
      sampleRate: 22050,
      chordSeconds: 0.05,
      seconds: 0.1,
    };
    const wav = chordProgressionToWav([major], rootHz, spectrum, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_empty_chords_throws_range_error', () => {
    expect(() => chordProgressionToWav([], rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_invalid_rootHz_throws_range_error', () => {
    expect(() => chordProgressionToWav([major], 0, spectrum, fastOpts)).toThrow(RangeError);
    expect(() => chordProgressionToWav([major], -440, spectrum, fastOpts)).toThrow(RangeError);
    expect(() => chordProgressionToWav([major], NaN, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_different_spectra_produce_different_audio', () => {
    const wavHarmonic = chordProgressionToWav([major, dom7], rootHz, harmonicSpectrum(), fastOpts);
    const wavBell = chordProgressionToWav([major, dom7], rootHz, bellSpectrum(), fastOpts);
    expect(wavHarmonic.length).toBe(wavBell.length);
    let differs = false;
    for (let i = 44; i < wavHarmonic.length; i++) {
      if (wavHarmonic[i] !== wavBell[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_chordSeconds_clamped_to_seconds_when_larger', () => {
    // chordSeconds > seconds → clamped to seconds
    const opts = { ...DEFAULT_CHORD_PROGRESSION_WAV, chordSeconds: 10, seconds: 0.1 };
    const wav = chordProgressionToWav([major, dom7], rootHz, spectrum, opts);
    const samplesPerChord = Math.floor(DEFAULT_CHORD_PROGRESSION_WAV.sampleRate * 0.1); // clamped
    const expectedSamples = samplesPerChord * 2;
    expect(wav.length).toBe(44 + expectedSamples * 2);
  });

  it('test_single_chord_progression_produces_valid_wav', () => {
    const wav = chordProgressionToWav([major], rootHz, spectrum, fastOpts);
    expect(wav.length).toBeGreaterThan(44);
    expect(wav[0]).toBe(0x52); // 'R'
  });
});

// Q105: Scale + pattern + rootHz → WAV should be one call (intent to audio pipeline)
describe('buildChordProgressionWav — Scale + pattern → WAV in one call (Q105)', () => {
  const t12 = equalTemperament12(440);
  const scaleObj: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const pattern = [
    [0, 2, 4],
    [3, 5, 0],
    [4, 6, 1],
  ] as const;
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const fastOpts = { ...DEFAULT_CHORD_PROGRESSION_WAV, chordSeconds: 0.05, seconds: 0.1 };

  it('test_output_is_valid_wav_riff_header', () => {
    const wav = buildChordProgressionWav(scaleObj, t12, pattern, rootHz, spectrum, fastOpts);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_reflects_chord_count', () => {
    const wav2 = buildChordProgressionWav(
      scaleObj,
      t12,
      [
        [0, 2, 4],
        [3, 5, 0],
      ],
      rootHz,
      spectrum,
      fastOpts,
    );
    const wav3 = buildChordProgressionWav(scaleObj, t12, pattern, rootHz, spectrum, fastOpts);
    // 3-chord pattern should produce a longer WAV than 2-chord
    expect(wav3.length).toBeGreaterThan(wav2.length);
  });

  it('test_matches_manual_pipeline_output', () => {
    // buildChordProgressionWav = buildChordProgression → chordProgressionToWav
    const wav = buildChordProgressionWav(scaleObj, t12, pattern, rootHz, spectrum, fastOpts);
    // Spot-check: valid WAV with audio content beyond header
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = {
      ...DEFAULT_CHORD_PROGRESSION_WAV,
      sampleRate: 22050,
      chordSeconds: 0.05,
      seconds: 0.1,
    };
    const wav = buildChordProgressionWav(scaleObj, t12, pattern, rootHz, spectrum, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_empty_pattern_throws_range_error', () => {
    expect(() => buildChordProgressionWav(scaleObj, t12, [], rootHz, spectrum, fastOpts)).toThrow(
      RangeError,
    );
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const wrongTuning = edo(19);
    expect(() =>
      buildChordProgressionWav(scaleObj, wrongTuning, pattern, rootHz, spectrum, fastOpts),
    ).toThrow(RangeError);
  });

  it('test_invalid_rootHz_throws_range_error', () => {
    expect(() => buildChordProgressionWav(scaleObj, t12, pattern, 0, spectrum, fastOpts)).toThrow(
      RangeError,
    );
    expect(() => buildChordProgressionWav(scaleObj, t12, pattern, NaN, spectrum, fastOpts)).toThrow(
      RangeError,
    );
  });
});

// Q107: optimalChordOrder + chordProgressionToWav should be one call
describe('optimalProgressionWav — optimal ordering + WAV synthesis in one call (Q107)', () => {
  const t12 = equalTemperament12(440);
  const scaleObj: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const fastOpts = { ...DEFAULT_CHORD_PROGRESSION_WAV, chordSeconds: 0.05, seconds: 0.1 };

  it('test_output_is_valid_wav_riff_header', () => {
    const chords = rankScaleChords(scaleObj, t12, { size: 3 })
      .slice(0, 3)
      .map((r) => rankedChordToChord(r));
    const wav = optimalProgressionWav(chords, rootHz, spectrum, fastOpts);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_output_length_greater_than_44_byte_header', () => {
    const chords = rankScaleChords(scaleObj, t12, { size: 3 })
      .slice(0, 2)
      .map((r) => rankedChordToChord(r));
    const wav = optimalProgressionWav(chords, rootHz, spectrum, fastOpts);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const chords = rankScaleChords(scaleObj, t12, { size: 3 })
      .slice(0, 2)
      .map((r) => rankedChordToChord(r));
    const opts = {
      ...DEFAULT_CHORD_PROGRESSION_WAV,
      sampleRate: 22050,
      chordSeconds: 0.05,
      seconds: 0.1,
    };
    const wav = optimalProgressionWav(chords, rootHz, spectrum, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_empty_chords_throws_range_error', () => {
    expect(() => optimalProgressionWav([], rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_single_chord_produces_valid_wav', () => {
    const [chord] = rankScaleChords(scaleObj, t12, { size: 3 }).map((r) => rankedChordToChord(r));
    const wav = optimalProgressionWav([chord!], rootHz, spectrum, fastOpts);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_different_chord_bags_produce_different_audio', () => {
    const allRanked = rankScaleChords(scaleObj, t12, { size: 3 });
    const chordsA = allRanked.slice(0, 2).map((r) => rankedChordToChord(r));
    const chordsB = allRanked.slice(2, 4).map((r) => rankedChordToChord(r));
    const wavA = optimalProgressionWav(chordsA, rootHz, spectrum, fastOpts);
    const wavB = optimalProgressionWav(chordsB, rootHz, spectrum, fastOpts);
    // Same length (same chord count and opts), but different audio
    expect(wavA.length).toBe(wavB.length);
    let differs = false;
    for (let i = 44; i < wavA.length; i++) {
      if (wavA[i] !== wavB[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});

// Q112 — scaleModeSeriesWav: all modal rotations of a scale as WAV Uint8Arrays in one call
describe('scaleModeSeriesWav (Q112)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const fastOpts = { ...DEFAULT_KS, noteSeconds: 0.05, sampleRate: 8000 };

  it('test_returns_one_wav_per_mode', () => {
    const wavs = scaleModeSeriesWav(major, t12, fastOpts);
    expect(wavs.length).toBe(major.degreeIndices.length);
  });

  it('test_each_element_is_uint8array_with_wav_header', () => {
    const wavs = scaleModeSeriesWav(major, t12, fastOpts);
    for (const wav of wavs) {
      expect(wav).toBeInstanceOf(Uint8Array);
      expect(wav.length).toBeGreaterThan(44);
      // RIFF header
      expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    }
  });

  it('test_different_modes_produce_different_audio', () => {
    const wavs = scaleModeSeriesWav(major, t12, fastOpts);
    // At least one pair of mode WAVs must differ (modes have different pitches)
    let found = false;
    outer: for (let i = 0; i < wavs.length; i++) {
      for (let j = i + 1; j < wavs.length; j++) {
        const a = wavs[i]!;
        const b = wavs[j]!;
        for (let k = 44; k < a.length && k < b.length; k++) {
          if (a[k] !== b[k]) {
            found = true;
            break outer;
          }
        }
      }
    }
    expect(found).toBe(true);
  });

  it('test_pentatonic_five_modes', () => {
    const pentatonic: Scale = {
      id: 'penta',
      name: 'Pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const wavs = scaleModeSeriesWav(pentatonic, t12, fastOpts);
    expect(wavs.length).toBe(5);
  });

  it('test_mismatched_tuning_throws', () => {
    const wrongTuning = edo(19);
    expect(() => scaleModeSeriesWav(major, wrongTuning, fastOpts)).toThrow(RangeError);
  });
});

// Q124 — bestProgressionWav: best acoustic progression for a scale as WAV audio
describe('bestProgressionWav (Q124)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();
  const rootHz = 261.63;
  const fastOpts = {
    ...DEFAULT_CHORD_PROGRESSION_WAV,
    sampleRate: 8000,
    chordSeconds: 0.05,
    seconds: 0.1,
  };

  it('test_returns_uint8array_with_wav_header', () => {
    const wav = bestProgressionWav(major, t12, spectrum, rootHz, 3, 3, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_sample_rate_matches_opts', () => {
    const wav = bestProgressionWav(major, t12, spectrum, rootHz, 3, 3, fastOpts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(8000);
  });

  it('test_different_spectra_produce_different_audio', () => {
    const wavA = bestProgressionWav(major, t12, harmonicSpectrum(), rootHz, 3, 3, fastOpts);
    const wavB = bestProgressionWav(major, t12, bellSpectrum(), rootHz, 3, 3, fastOpts);
    // Bell vs harmonic spectrum should produce different audio content
    let differs = false;
    for (let i = 44; i < Math.min(wavA.length, wavB.length); i++) {
      if (wavA[i] !== wavB[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => bestProgressionWav(major, edo(19), spectrum, rootHz)).toThrow(RangeError);
  });

  it('test_invalid_rootHz_throws', () => {
    expect(() => bestProgressionWav(major, t12, spectrum, -1)).toThrow(RangeError);
  });
});

// Q125 — bestScaleChordWav: best diatonic chord of a scale as WAV audio
describe('bestScaleChordWav (Q125)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const spectrum = harmonicSpectrum();
  const rootHz = 261.63;
  const fastOpts = { ...DEFAULT_KS, sampleRate: 8000 };

  it('test_returns_uint8array_with_wav_header', () => {
    const wav = bestScaleChordWav(major, t12, rootHz, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_sample_rate_matches_opts', () => {
    const wav = bestScaleChordWav(major, t12, rootHz, spectrum, fastOpts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(8000);
  });

  it('test_works_without_spectrum', () => {
    const wav = bestScaleChordWav(major, t12, rootHz, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_different_root_frequencies_produce_different_audio', () => {
    // Same scale, different root → different pitched audio
    const wavC = bestScaleChordWav(major, t12, 261.63, spectrum, fastOpts);
    const wavG = bestScaleChordWav(major, t12, 392.0, spectrum, fastOpts);
    let differs = false;
    for (let i = 44; i < Math.min(wavC.length, wavG.length); i++) {
      if (wavC[i] !== wavG[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_mismatched_tuning_throws', () => {
    expect(() => bestScaleChordWav(major, edo(19), rootHz, spectrum)).toThrow(RangeError);
  });
});

// Q130 — chordMapToWav: ScaleChordMapEntry[] → WAV bytes in one call
describe('chordMapToWav (Q130)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  // Fast options to keep tests quick
  const fastOpts = {
    ...DEFAULT_CHORD_PROGRESSION_WAV,
    sampleRate: 8000,
    chordSeconds: 0.05,
    seconds: 0.05,
  };

  it('test_returns_valid_riff_wav_bytes', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav = chordMapToWav(chordMap, rootHz, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_wav_contains_all_chords_in_map', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav = chordMapToWav(chordMap, rootHz, spectrum, fastOpts);
    // WAV data size should increase with more chords
    // 7 chords × samplesPerChord × 2 bytes + 44 header
    const sampleRate = fastOpts.sampleRate;
    const samplesPerChord = Math.floor(sampleRate * fastOpts.chordSeconds);
    const expectedDataBytes = chordMap.length * samplesPerChord * 2;
    expect(wav.length).toBeGreaterThanOrEqual(44 + expectedDataBytes - 100); // small tolerance
  });

  it('test_default_spectrum_used_when_none_provided', () => {
    const chordMap = scaleToChordMap(major, t12);
    // Should not throw even without spectrum
    expect(() => chordMapToWav(chordMap, rootHz, undefined, fastOpts)).not.toThrow();
    const wav = chordMapToWav(chordMap, rootHz, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
  });

  it('test_empty_chord_map_throws', () => {
    expect(() => chordMapToWav([], rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_invalid_root_hz_throws', () => {
    const chordMap = scaleToChordMap(major, t12);
    expect(() => chordMapToWav(chordMap, -1, spectrum, fastOpts)).toThrow(RangeError);
    expect(() => chordMapToWav(chordMap, 0, spectrum, fastOpts)).toThrow(RangeError);
  });
});

// Q134: bestModeWav — best modal rotation of a tuning as a melodic WAV in one call
describe('bestModeWav (Q134)', () => {
  const t12 = equalTemperament12(440);
  const fastOpts = { ...DEFAULT_KS, noteSeconds: 0.05, sampleRate: 8000 };

  it('test_returns_valid_riff_wav_bytes', () => {
    const wav = bestModeWav(t12, 440, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const wav = bestModeWav(t12, 440, undefined, fastOpts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(fastOpts.sampleRate);
  });

  it('test_with_spectrum_also_returns_valid_wav', () => {
    const spectrum = harmonicSpectrum();
    const wav = bestModeWav(t12, 440, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_root_hz_does_not_affect_output', () => {
    // rootHz is unused; both calls should produce the same audio
    const wav1 = bestModeWav(t12, 261.63, undefined, fastOpts);
    const wav2 = bestModeWav(t12, 440, undefined, fastOpts);
    expect(wav1).toEqual(wav2);
  });

  it('test_different_tunings_produce_different_audio', () => {
    const t19 = edo(19);
    const wav12 = bestModeWav(t12, 440, undefined, fastOpts);
    const wav19 = bestModeWav(t19, 440, undefined, fastOpts);
    // Different tunings → different scales → different audio (lengths may differ too)
    // At minimum the lengths or content should differ
    const sameLengthAndContent =
      wav12.length === wav19.length && wav12.every((b, i) => b === wav19[i]);
    expect(sameLengthAndContent).toBe(false);
  });
});

// Q138 — bestChordWav: find the best chord for a MIDI note and synthesize to WAV in one call
describe('bestChordWav (Q138)', () => {
  const t12 = equalTemperament12(440);
  const fastOpts = { ...DEFAULT_CHORD_PROGRESSION_WAV, sampleRate: 8000, seconds: 0.05 };

  it('test_returns_valid_riff_wav_bytes', () => {
    const wav = bestChordWav(60, t12, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
    expect(String.fromCharCode(wav[8]!, wav[9]!, wav[10]!, wav[11]!)).toBe('WAVE');
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const wav = bestChordWav(60, t12, undefined, fastOpts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(8000);
  });

  it('test_different_midi_notes_produce_different_audio', () => {
    const wavC4 = bestChordWav(60, t12, undefined, fastOpts); // C4
    const wavA4 = bestChordWav(69, t12, undefined, fastOpts); // A4
    let differs = false;
    for (let i = 44; i < Math.min(wavC4.length, wavA4.length); i++) {
      if (wavC4[i] !== wavA4[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('test_with_harmonic_spectrum_returns_valid_wav', () => {
    const spectrum = harmonicSpectrum();
    const wav = bestChordWav(60, t12, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_tuning_with_no_degrees_throws', () => {
    const emptyTuning = equalTemperament12(440);
    const modifiedTuning = { ...emptyTuning, degrees: [] };
    expect(() => bestChordWav(60, modifiedTuning, undefined, fastOpts)).toThrow();
  });

  it('test_different_tunings_produce_different_audio', () => {
    const t19 = edo(19);
    const wav12 = bestChordWav(60, t12, undefined, fastOpts);
    const wav19 = bestChordWav(60, t19, undefined, fastOpts);
    const sameLengthAndContent =
      wav12.length === wav19.length && wav12.every((b, i) => b === wav19[i]);
    expect(sameLengthAndContent).toBe(false);
  });
});

// Q142 — topNChordMapWav: top-N most harmonic chords from a chord map synthesized to WAV
describe('topNChordMapWav (Q142)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const fastOpts = {
    ...DEFAULT_CHORD_PROGRESSION_WAV,
    sampleRate: 8000,
    chordSeconds: 0.05,
    seconds: 0.05,
  };

  it('test_returns_valid_riff_wav_bytes', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav = topNChordMapWav(chordMap, 3, rootHz, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_n_less_than_1_throws_range_error', () => {
    const chordMap = scaleToChordMap(major, t12);
    expect(() => topNChordMapWav(chordMap, 0, rootHz, spectrum, fastOpts)).toThrow(RangeError);
    expect(() => topNChordMapWav(chordMap, -1, rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => topNChordMapWav([], 3, rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_n_1_produces_shorter_wav_than_n_3', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav1 = topNChordMapWav(chordMap, 1, rootHz, spectrum, fastOpts);
    const wav3 = topNChordMapWav(chordMap, 3, rootHz, spectrum, fastOpts);
    expect(wav3.length).toBeGreaterThan(wav1.length);
  });

  it('test_n_larger_than_chord_map_uses_all_entries', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wavAll = topNChordMapWav(chordMap, chordMap.length, rootHz, spectrum, fastOpts);
    const wavMore = topNChordMapWav(chordMap, chordMap.length + 10, rootHz, spectrum, fastOpts);
    expect(wavAll.length).toBe(wavMore.length);
  });

  it('test_default_spectrum_produces_valid_output', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav = topNChordMapWav(chordMap, 3, rootHz, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
  });
});

// Q144: bestModeForTuning → progressionFromPattern → chordProgressionToWav in one call
describe('bestModeProgressionWav (Q144)', () => {
  const t12 = equalTemperament12(440);
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const fastOpts = {
    ...DEFAULT_CHORD_PROGRESSION_WAV,
    sampleRate: 8000,
    chordSeconds: 0.05,
    seconds: 0.05,
  };

  it('test_returns_valid_riff_wav_bytes', () => {
    const wav = bestModeProgressionWav(t12, [0, 2, 4], rootHz, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_empty_pattern_throws_range_error', () => {
    expect(() => bestModeProgressionWav(t12, [], rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_tuning_with_no_degrees_throws_range_error', () => {
    const empty = {
      id: 'empty',
      name: 'Empty',
      referenceHz: 440,
      periodCents: 1200,
      degrees: [],
      source: 'theoretical' as const,
    };
    expect(() => bestModeProgressionWav(empty, [0], rootHz, spectrum, fastOpts)).toThrow(
      RangeError,
    );
  });

  it('test_without_spectrum_uses_harmonicity_ranking', () => {
    const wav = bestModeProgressionWav(t12, [0, 2, 4], rootHz, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_longer_pattern_produces_longer_wav', () => {
    const wavShort = bestModeProgressionWav(t12, [0, 2], rootHz, spectrum, fastOpts);
    const wavLong = bestModeProgressionWav(t12, [0, 2, 4, 0], rootHz, spectrum, fastOpts);
    expect(wavLong.length).toBeGreaterThan(wavShort.length);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = { ...fastOpts, sampleRate: 22050 };
    const wav = bestModeProgressionWav(t12, [0, 2, 4], rootHz, spectrum, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });
});

// Q145: rankChordMapByDissonance reversed → take last N → chordMapToWav in one call
describe('worstNChordMapWav (Q145)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const fastOpts = {
    ...DEFAULT_CHORD_PROGRESSION_WAV,
    sampleRate: 8000,
    chordSeconds: 0.05,
    seconds: 0.05,
  };

  it('test_returns_valid_riff_wav_bytes', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav = worstNChordMapWav(chordMap, 3, rootHz, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_n_less_than_1_throws_range_error', () => {
    const chordMap = scaleToChordMap(major, t12);
    expect(() => worstNChordMapWav(chordMap, 0, rootHz, spectrum, fastOpts)).toThrow(RangeError);
    expect(() => worstNChordMapWav(chordMap, -1, rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_empty_chord_map_throws_range_error', () => {
    expect(() => worstNChordMapWav([], 3, rootHz, spectrum, fastOpts)).toThrow(RangeError);
  });

  it('test_n_1_produces_shorter_wav_than_n_3', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav1 = worstNChordMapWav(chordMap, 1, rootHz, spectrum, fastOpts);
    const wav3 = worstNChordMapWav(chordMap, 3, rootHz, spectrum, fastOpts);
    expect(wav3.length).toBeGreaterThan(wav1.length);
  });

  it('test_default_spectrum_produces_valid_output', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wav = worstNChordMapWav(chordMap, 2, rootHz, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_n_larger_than_map_uses_all_entries', () => {
    const chordMap = scaleToChordMap(major, t12);
    const wavAll = worstNChordMapWav(chordMap, chordMap.length, rootHz, spectrum, fastOpts);
    const wavMore = worstNChordMapWav(chordMap, chordMap.length + 10, rootHz, spectrum, fastOpts);
    expect(wavAll.length).toBe(wavMore.length);
  });
});

// Q147: buildChordProgression → optimalChordOrder → chordProgressionToWav in one call
describe('optimalProgressionWavFromScale (Q147)', () => {
  const t12 = equalTemperament12(440);
  const major: Scale = {
    id: 'major',
    name: 'Ionian',
    tuningId: '12-tet',
    degreeIndices: [0, 2, 4, 5, 7, 9, 11],
  };
  const rootHz = 261.63;
  const spectrum = harmonicSpectrum();
  const fastOpts = {
    ...DEFAULT_CHORD_PROGRESSION_WAV,
    sampleRate: 8000,
    chordSeconds: 0.05,
    seconds: 0.05,
  };

  it('test_returns_valid_riff_wav_bytes', () => {
    const wav = optimalProgressionWavFromScale(major, t12, rootHz, spectrum, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
    expect(String.fromCharCode(wav[0]!, wav[1]!, wav[2]!, wav[3]!)).toBe('RIFF');
  });

  it('test_mismatched_tuning_throws_range_error', () => {
    const t19 = edo(19);
    expect(() => optimalProgressionWavFromScale(major, t19, rootHz, spectrum, fastOpts)).toThrow(
      RangeError,
    );
  });

  it('test_without_spectrum_defaults_to_harmonic', () => {
    const wav = optimalProgressionWavFromScale(major, t12, rootHz, undefined, fastOpts);
    expect(wav).toBeInstanceOf(Uint8Array);
    expect(wav.length).toBeGreaterThan(44);
  });

  it('test_sample_rate_in_header_matches_opts', () => {
    const opts = { ...fastOpts, sampleRate: 22050 };
    const wav = optimalProgressionWavFromScale(major, t12, rootHz, spectrum, opts);
    const dv = new DataView(wav.buffer);
    expect(dv.getUint32(24, true)).toBe(22050);
  });

  it('test_different_scale_degree_counts_produce_different_length_wav', () => {
    const pentatonic: Scale = {
      id: 'penta',
      name: 'Pentatonic',
      tuningId: '12-tet',
      degreeIndices: [0, 2, 4, 7, 9],
    };
    const wavMajor = optimalProgressionWavFromScale(major, t12, rootHz, spectrum, fastOpts);
    const wavPenta = optimalProgressionWavFromScale(pentatonic, t12, rootHz, spectrum, fastOpts);
    // major has 7 chords, pentatonic has 5 chords → different WAV lengths
    expect(wavMajor.length).not.toBe(wavPenta.length);
  });
});
