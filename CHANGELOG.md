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

### Notes
- Pre-1.0: APIs may change. 120 tests, ~95% coverage, zero runtime dependencies.

[Unreleased]: https://github.com/shizukutanaka/ruri/commits/main
