# Changelog

All notable changes to Ruri are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Core tuning engine: cents/ratio pitch model, tuning systems with non-octave periods, fail-fast invariants.
- Idiom-independent scale/chord generation (MOS, well-formed test, maximally even sets).
- Consonance evaluation: Plomp-Levelt/Sethares roughness + Stolzenburg harmonicity (acoustic-only, timbre-dependent).
- Instrument spectra (harmonic / stretched / bell) as single source of truth for scoring and synthesis.
- Fingering for fretted instruments (guitar, bass) with biomechanical cost, per-player HandProfile, K-best; piano finger assignment.
- Synthesis: Karplus-Strong plucked string, modal additive synthesis (inharmonic timbres). Microtonal via fractional delay / detune.
- Output adapters: Standard MIDI File (SMF Type-0), Scala `.scl` (bidirectional), MPE, WAV.
- Curated tuning presets with provenance and cultural context (12-TET, 5-limit JI, Makam Uşşak, Sléndro, Pélog) under CARE/OCAP principles.
- Single-file web demo UI (tuning → chord → consonance → fingering → audition → export).
- `edo(divisions, referenceHz?, periodCents?)`: n-tone equal division of the octave (or any period) as a first-class `TuningSystem`.
- MTS adapter (`src/adapters/mts.ts`): `freqToMtsKey`, `mtsBulkDump` (MIDI Tuning Standard non-real-time bulk dump SysEx, 408 bytes), `tuningToMtsFrequencies` — maps a `TuningSystem` onto all 128 MIDI keys for DAW/synth retuning.
- `.kbm` adapter (`src/adapters/kbm.ts`): `parseKbm`, `writeKbm`, `kbmNoteToFreq` — Scala keyboard mapping; unmapped keys (`x`) return `null`.
- npm packaging: `npm run build` emits ESM + `.d.ts` to `dist/` via `tsconfig.build.json` (NodeNext modules); `package.json` exports map (`"."` / `"./core"` / `"./adapters"` / `"./data"`), `types`, `files`, `prepublishOnly` hook; top-level barrel `src/index.ts`.
- Regular temperaments (`src/core/temperament.ts`): `regularTemperament` (generator-stacked tunings, non-octave periods supported), `meantoneQuarterComma` (pure 5/4 major third), `pythagorean` (pure 3/2 fifths).
- Chord discovery (`src/core/chord-search.ts`): `rankChords` enumerates degree subsets of a tuning and ranks them by Sethares roughness + Stolzenburg periodicity (acoustic-only, timbre-dependent).
- `.tun` adapter (`src/adapters/tun.ts`): `writeTun` — AnaMark TUN text export (`[Tuning]` + `[Exact Tuning]` sections); composes with `tuningToMtsFrequencies`.
- `consonantIntervals(spectrum, opts?)` (`src/core/dissonance.ts`): the library's timbre-dependent-consonance thesis as one call — scans the sensory-dissonance curve and returns its local minima as `{ ratio, cents, dissonance }`. A harmonic spectrum yields the just intervals (4/3, 3/2, 5/4…); `bellSpectrum()` yields a different set from the very same scan.
- `generatedTuning(generatorCents, periodCents, count, referenceHz?, id?)` and `maximallyEvenTuning(c, d, periodCents?, referenceHz?)` (`src/core/generate.ts`): bridge `generatedScale`/`maximallyEven` to a first-class `TuningSystem`, closing the abstraction gap between the MOS/ME generators and the rest of the pipeline (`rankChords`, `mtsBulkDump`, `fingerChord`, etc.).
- `scaleToFreqs(scale, tuning)` (`src/core/scale.ts`): absolute Hz for each scale step — the bridge from the melodic/modal `Scale` layer into the frequency world (`chordDissonance`, `pluck`, `strike`, MTS/`.tun` export). The `Scale` module also gains a dedicated test suite (`scale.test.ts`).
- `realizeRankedChordFreqs(chord, rootHz)` (`src/core/chord-search.ts`): realize a `RankedChord` as absolute Hz — the bridge from the ranking layer into the frequency world (`voiceLeadingCost`, `chordDissonance`, synthesis). Closes the pipeline: `generatedTuning → rankChords → realizeRankedChordFreqs → voiceLeadingCost`.
- `chordToCentOffsets(chord, rootCentsOnInstrument)` (`src/core/chord.ts`): bridge from `Chord` (root-relative intervals) into the instrument coordinate system that `fingerChord` speaks. `StringInstrument` has no Hz anchor by design (instruments are transposable); this helper supplies the root position in instrument-local cents. New dedicated `chord.test.ts`.
- `progressionSmoothness(chords, rootHz)` (`src/core/chord-search.ts`): total minimal voice-leading cost across a chord progression (3+ chords) as a single call. Aggregates pairwise `voiceLeadingCost` over consecutive pairs, enabling the full DTM workflow: `generatedTuning → rankChords → progressionSmoothness`.
- `getTuningById(id, presets?)` (`src/data/presets.ts`): look up a curated preset by id string and return a validated `TuningSystem` (or `undefined`). Replaces the two-step `import MAKAM_USSAK; loadTuningPreset(MAKAM_USSAK)` pattern with a single discoverable call. Default pool is `ALL_PRESETS`; a custom pool can be supplied.
- Integration tests (`src/integration-extended.test.ts`): end-to-end pipeline tests for Q31-Q36 bridging functions used together — Makam preset through full pipeline, Chord → fretless oud fingering, EDO progression smoothness across 7/12/19-EDO.
- `chordFromRatios(name, ratios)` (`src/core/chord.ts`): build a just-intonation chord from integer ratio pairs, storing intervals as `{kind:'ratio'}` (primary representation, no cents conversion). Closes the gap between the "ratio is primary" design principle and the `Chord` factory API. `chordFromSemitones` only created cents-based intervals; `chordFromRatios` preserves exact JI precision through `realizeChordFreqs`.
- `scaleMode(scale, modeIndex, tuning)` (`src/core/scale.ts`): modal rotation as a first-class `Scale` operation. Rotated pre-pivot degrees are shifted up by one period (`tuning.degrees.length`), so non-octave tunings work. Invariant: step-size multiset preserved across all rotations.
- `rankedChordToChord(ranked, name?)` (`src/core/chord-search.ts`): lift a `RankedChord` (tuning-discovery output) to a portable `Chord` (root-relative intervals). `RankedChord.cents` are already root-relative so this is a direct lift — no arithmetic. Closes the round-trip `rankChords → rankedChordToChord → Chord → fingerChord / writeScl / realizeChordFreqs`.
- `scaleMode(scale, modeIndex, tuning)` (`src/core/scale.ts`): modal rotation as a first-class `Scale` operation — returns the scale starting from degree `modeIndex`, re-zeroed to 0-based indices. Rotated degrees prior to the pivot are shifted up by one period (`tuning.degrees.length`), so non-octave tunings (Bohlen-Pierce, stretched gamelan) work correctly. Invariant: the multiset of step sizes is preserved under all rotations. Closes the gap between "Scale is first-class for maqam/raga" and the absence of modal rotation.

### Fixed
- `localMinima`: descending-plateau false positive — plateaus now report once at their first index only when strictly below both differing neighbours; ascending-plateau and end-touching cases are no longer reported.
- Piano `fingerPianoChord`: single-note guard hardened (behaviour unchanged for callers).

### Notes
- Pre-1.0: APIs may change. 246 tests, ~96% statement coverage, zero runtime dependencies.

[Unreleased]: https://github.com/shizukutanaka/ruri/commits/main
