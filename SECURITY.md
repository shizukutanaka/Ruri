# Security Policy

## Reporting

Please report vulnerabilities privately via GitHub Security Advisories (Security tab → Report a vulnerability), not public issues.

## Posture

- **Zero runtime dependencies** — minimal supply-chain attack surface.
- **No data collection** — Ruri runs entirely in the browser/desktop; it sends nothing. See PRIVACY.md.
- No secrets, no backend. Donations (optional) are handled by an external Stripe-hosted link; the app never touches payment data.
- Dev dependencies are scanned (`npm audit`); CRITICAL/HIGH block release.

## Scope

Input parsing (Scala `.scl`, MIDI decode) validates and fails fast on malformed input. Reports of parser crashes or resource exhaustion are welcome.
