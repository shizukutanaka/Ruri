# Contributing to Ruri

Thanks for your interest. Ruri values correctness, cultural respect, and minimalism.

## Setup

```
npm install
npm run check   # typecheck + lint + format:check + test
```

All PRs must pass `npm run check` and keep coverage from regressing.

## Code

- TypeScript, strict, **zero runtime dependencies** (dev-only deps allowed).
- Functions: ≤3 args, ≤40 lines, ≤3 nesting where practical. DRY after 3 repeats.
- High-risk numeric/binary code (conversions, file formats) needs property tests and, where output is audio/MIDI, golden round-trip. See `src/core/CLAUDE.md` and `src/adapters/CLAUDE.md`.
- Naming: `test_[subject]_[condition]_[expected]`.

## Contributing tuning data (read carefully)

Tuning data carries ethical weight. We follow **CARE** (Collective benefit, Authority to control, Responsibility, Ethics) and **OCAP** (Ownership, Control, Access, Possession).

A tuning contribution MUST include:
- `provenance`: citation (author/work/year), URL if available, and the source's reuse `license`.
- `source`: `measured` or `theoretical`.
- For non-Western/traditional tunings: `culturalContext` and/or `region` (never strip numbers from their context).
- `note`: a one-example disclaimer — this is **one documented realization, not the canonical tuning**.

We do **not** bulk-import archives. We do not claim ownership or canonical authority over any tradition's tuning. If you are from a source community and want a correction or removal, open an issue.

## Out of scope

Score transcription, music generation, and full DAW features are intentionally out of scope. Ruri builds instrument sound and exports to DTM; it is not a sequencer.

## Commits

Conventional Commits (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`). Breaking: `feat!:`.
