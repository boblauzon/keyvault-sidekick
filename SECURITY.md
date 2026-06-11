# Security Policy

Thank you for taking the time to investigate the security of KeyVault
Sidekick. Because the entire product is "trust me, your secrets won't
leak," real bug reports are deeply welcome.

## Reporting a vulnerability

**Please report security issues privately**, before disclosing publicly,
so they can be fixed before they're abused.

- **Email:** **rob.lauzon@vibeprosoft.com** (subject prefix `[KEYVAULT-SECURITY]`)
- **GitHub:** open a [private security advisory](https://github.com/boblauzon/keyvault-sidekick/security/advisories/new)

Please include:

- A clear description of the issue
- Steps to reproduce (a minimal proof-of-concept is ideal)
- Affected files and lines, if you have them
- Your assessment of impact and severity
- Whether you would like public credit in the release notes

## Expected response

This is a solo-developer project, not a 24/7 ops team. Best-effort:

- **Acknowledgment:** within 3 business days
- **Triage + initial assessment:** within 1 week
- **Fix + release:** depending on severity (Critical: days; High: 1–2 weeks;
  Medium/Low: next planned release)
- **Public disclosure:** coordinated with you, typically once a fix is
  shipped

I'll keep you in the loop throughout.

## In scope

- Cryptographic weaknesses (key derivation, encryption mode, RNG, padding,
  side channels)
- XSS / DOM injection / prompt-injection vectors in the vault, landing, or
  Connect pages
- CSP bypasses on any page
- Integrity-verification bypasses
- Logic bugs that could let a third party read or modify a vault
- Supply-chain risks introduced by the build / deploy / snippet pipeline
- Any flaw that breaks one of the explicit security promises in
  [`PRIVACY.md`](PRIVACY.md) or the in-app Security Guide

## Out of scope

- Loss of data caused by a forgotten master password (by design — there is
  no recovery)
- Loss of data caused by your browser wiping `localStorage`
- "Browser extension X can read the DOM after I unlock" — true and
  documented; use a dedicated browser profile for high-sensitivity vaults
- Attacks requiring physical access to an unlocked, in-use device
- Third-party vulnerabilities in Cloudflare, GitHub, Ko-fi (report those to
  the respective vendor)
- Reports from automated scanners with no proof of exploitability
- Social-engineering of the maintainer

## Bug bounty

KeyVault Sidekick is free and donation-supported. **There is no monetary
bounty.** Good-faith researchers will receive:

- Public credit in the release notes (if you want it)
- A heartfelt thank-you and, if you're into it, a coffee on Ko-fi from me

## Safe harbor

I will not pursue legal action against researchers who:

- Make a good-faith effort to follow this policy
- Avoid privacy violations, destruction of data, and disruption of the
  Service
- Do not exploit a vulnerability beyond what's necessary to demonstrate it
- Give reasonable time to fix before public disclosure (typically 90 days,
  shorter for issues already being exploited)

## Disclosure history

See [GitHub Releases](https://github.com/boblauzon/keyvault-sidekick/releases)
for past security fixes. The [PRD](docs/PRD-KeyVault-Sidekick.md) build plan
also records audit remediation phases (e.g. Phase 6.1).

Thank you for helping keep KeyVault Sidekick trustworthy.

— Rob Lauzon
