# KeyVault Sidekick

**Browser-only encrypted secrets vault for solo vibe coders.**

No backend. No sign-up. No breach surface. Keys never leave the device.

Built for Claude Code users on the Cloudflare stack — organizing project secrets, generating secure values, and exporting keys to `.env` files without pasting them into chat.

**Live:** https://keyvault-sidekick.pages.dev

**New here? → [Getting Started guide](GETTING-STARTED.md)** — a plain-language, step-by-step walkthrough for any skill level (also built into the app at [keyvault-sidekick.pages.dev/guide.html](https://keyvault-sidekick.pages.dev/guide.html)).

---

## What it does

| Feature | Detail |
|---|---|
| **AES-256-GCM vault** | Master password → PBKDF2 (310k iters, SHA-256) → encrypted blob in `localStorage` |
| **Project-organized** | Group secrets by project (ITIL Sidekick, Stripe keys, etc.) |
| **7 generators** | JWT secret, UUID v4, random hex/base64, API key pattern, bcrypt rounds, password |
| **Export** | `.env`, `.envrc` (direnv), `settings.json` env block — copy or download |
| **Claude Code prefill** | Claude creates a key via MCP, navigates to the vault URL, prefill modal auto-opens |
| **Auto-lock** | Configurable idle timeout (default 15 min) |
| **Vault backup** | Export/import `.vault` file (encrypted blob, needs your master password to restore) |

---

## Run locally

```bash
py -3 -m http.server 8091 --directory "KeyVault Sidekick/public"
# open http://localhost:8091           (landing page)
# open http://localhost:8091/app.html  (the vault)
```

Or via Claude Code launch config:
```
/launch keyvault-sidekick
```

No build step. No npm. No dependencies. Opens in any modern browser.

---

## AI agent integration — prefill bridge

> **Want full autonomy** — the agent reads, writes, and generates keys directly,
> no clicking Save? Install the **[local MCP server](mcp/README.md)** (see
> [Local MCP server](#local-mcp-server) below). The prefill bridge described here
> works with *any* agent including ChatGPT web / Codex Cloud; the MCP server works
> with local agents (Claude Code, Claude Desktop, Cursor, Codex CLI).

### Claude Code — prefill hook

After Claude creates a key via MCP (Stripe, Cloudflare, etc.), it can open a URL that pre-fills the vault's "Add key" modal automatically.

**URL format:**
```
http://localhost:8091/app.html#action=prefill&name=KEY_NAME&value=KEY_VALUE&type=api_key&project=ProjectName&notes=optional+notes
```

**Parameters:**

| Param | Required | Description |
|---|---|---|
| `action` | yes | Must be `prefill` |
| `name` | yes | Key name (e.g. `STRIPE_API_KEY`) |
| `value` | yes | The secret value |
| `type` | no | `api_key` / `secret` / `token` / `oauth` / `webhook` / `other` (default: `api_key`) |
| `project` | no | Project name or ID — fuzzy-matched (exact id → exact name → partial name → first project) |
| `notes` | no | Free-text notes |

**How it works:**
1. Claude navigates to the URL (new tab or existing tab — both work)
2. The fragment is read and stripped from the URL immediately (`history.replaceState`)
3. The value is stored in `sessionStorage` — never sent to the HTTP server (fragments aren't)
4. After the user unlocks the vault, a "Save key from Claude" modal auto-opens with all fields pre-filled
5. User reviews and clicks **Save key** (or **Skip**)
6. `sessionStorage` is cleared after first read

**Example — from a Claude Code session:**
```
Ask Claude: "Create a Stripe restricted API key for ITIL Sidekick and save it to my vault"

Claude creates the key via Stripe MCP, then navigates to:
http://localhost:8091/app.html#action=prefill&name=STRIPE_RESTRICTED_KEY&value=rk_live_xxx&type=api_key&project=ITIL+Sidekick&notes=Restricted+to+Charges+only
```

---

## Local MCP server

For **full autonomy** with local agents — *"Claude, create a Stripe key and save
it to KeyVault project ITIL"* and it does it all — install the local MCP server in
[`mcp/`](mcp/).

- **Local, not remote.** It runs on your machine over a local AES-256-GCM vault
  file. Secrets never touch a network — a *remote* MCP would have to store and
  return your plaintext secrets, which KeyVault never does.
- **Same `.vault` format as the web app** (verified byte-for-byte, both
  directions) — bridge the two via Settings → Import / Export `.vault`.
- **8 tools:** list / get / save / delete keys, list / create projects, generate
  values, export `.env`.
- **Works with** Claude Code, Claude Desktop, Cursor, Codex CLI. ChatGPT web /
  Codex Cloud can't reach a local server — they use the prefill bridge above.

Quick start (Claude Code):

```bash
git clone https://github.com/boblauzon/keyvault-sidekick
claude mcp add keyvault --env KEYVAULT_PASSWORD=your-master-password -- node ./keyvault-sidekick/mcp/index.mjs
```

Full setup (Desktop / Cursor / Codex CLI), the tool list, the browser ↔ MCP
bridge, and the security model: **[mcp/README.md](mcp/README.md)**.

---

## Security model

- **Zero backend.** The server only serves static files (landing, vault, Claude Code onboarding). No API, no database, no accounts, no sessions.
- **Encrypted at rest.** The `localStorage` blob is ciphertext — key names and values are never stored in plaintext.
- **URL fragment security.** The `#fragment` part of a URL is never sent to the HTTP server, so `value=...` in the prefill URL is not logged server-side.
- **Short-lived in memory.** The derived AES key lives in JS memory only. Cleared on lock. Cleared on page close.
- **CSP.** `connect-src 'none'` — no outbound network requests from the page.
- **No telemetry.** Zero analytics, zero tracking.
- **PBKDF2 parameters stored in blob.** Forward-compatible: future iteration increases don't break existing vaults.
- **Integrity verification.** Every release publishes the SHA-256 hash of `index.html`. The app shows a runtime hash in the footer + Guide → Integrity section. Mismatch = possible CDN compromise.

## Threat model

| Threat | Protected? | Mechanism |
|---|---|---|
| Cloudflare Pages stores your vault | ✅ Impossible | There is no backend; CF only serves a static HTML file |
| Another visitor sees your vault | ✅ Impossible | Each browser's `localStorage` is isolated; nothing is synced |
| Network intercept reads your vault | ✅ Protected | TLS to CF + `connect-src 'none'` blocks all outbound JS requests |
| Stolen encrypted blob (e.g. backup `.vault` file) | ✅ Protected | AES-256-GCM + PBKDF2 310k iters — strong master password required to crack |
| Browser extension reading DOM after unlock | ⚠️ Not protected | Outside the app's control; use a dedicated browser profile for high-sensitivity vaults |
| **Compromised CF Pages CDN pushes modified HTML** | ⚠️ Detectable | Compare runtime hash with GitHub release hash; or run locally from `file://` |
| Forgotten master password | ⚠️ No recovery by design | Export `.vault` backup and keep it safe |

## Verifying integrity

To verify Cloudflare Pages is serving the exact code committed here, fetch the raw bytes with `curl` and compare with the file hash in the latest [GitHub release](https://github.com/boblauzon/keyvault-sidekick/releases):

```bash
# 1. Fetch raw HTML (bypassing any browser serialization)
curl -o keyvault.html https://keyvault-sidekick.pages.dev/

# 2. Hash it
certutil -hashfile keyvault.html SHA256     # Windows
shasum -a 256 keyvault.html                 # macOS / Linux

# 3. Compare with the "File hash" in the GitHub release notes
```

If the hashes match → CDN is serving the published code. Mismatch → **don't enter your master password**; clone the repo locally instead.

**Why not use the browser's "Save As"?** The browser saves a re-serialized form of the parsed DOM, which is not byte-identical to the raw source (small differences from UTF-8 BOM, attribute normalization, etc.). The in-app "Save offline copy" has the same caveat — it's for offline use, not hash verification. Use `curl` for byte-level verification.

The runtime hash shown in the app footer is a **self-consistency indicator**, not a verification target: as long as it's stable across reloads, the page hasn't been tampered with mid-session.

## Running locally

For zero CDN trust:

```bash
git clone https://github.com/boblauzon/keyvault-sidekick.git
cd keyvault-sidekick
py -3 -m http.server 8091
# open http://localhost:8091
```

Or save the page offline (Guide → Integrity → **Save offline copy**) and double-click the saved `keyvault-sidekick.html` — it runs from `file://` with identical behavior.

---

## Stack

- Vanilla HTML / CSS / JS — the vault is a single `public/app.html` (~3500 lines), plus a static landing (`index.html`) and Claude Code onboarding (`connect.html`)
- Web Crypto API (PBKDF2 + AES-256-GCM, native browser)
- `localStorage` (encrypted blob)
- Zero build tooling, zero dependencies, zero backend — open and use
- Hosted on Cloudflare Pages (static, free tier)

---

## Build plan

| Phase | Status |
|---|---|
| 1 — Foundation (crypto, storage, unlock/first-run) | ✅ Shipped |
| 1.1 — Hardening (15 /code-review findings) | ✅ Shipped |
| 2 — Core vault (project/key CRUD, search, .env import) | ✅ Shipped |
| 3 — Generators (7 types, save-to-project) | ✅ Shipped |
| 4 — Export, settings, auto-lock, .vault backup, prefill hook | ✅ Shipped |
| 5 — GitHub + CF Pages deploy | ✅ Shipped |
| 6 — Integrity verification + offline-first polish | ✅ Shipped |
| 6.1 — Vibe-code audit remediation (v1.5.2) | ✅ Shipped |

---

## Support

KeyVault Sidekick is **free and open**. If it saves you time, you can support its development:

**☕ [Buy me a coffee on Ko-fi](https://ko-fi.com/roblauzon)**

No accounts, no paywalls, no upsells. Donations are entirely optional and keep the tool free for everyone.

## Legal

KeyVault Sidekick is free, open-source, and provided **as is**. Please read:

| Document | What it covers |
|---|---|
| [LICENSE](LICENSE) | MIT License — use, copy, modify, distribute freely; no warranty, no liability |
| [TERMS.md](TERMS.md) | Terms of Use — "as is", limitation of liability, your responsibility for your master password + backups, governing law (Ontario, Canada) |
| [PRIVACY.md](PRIVACY.md) | Privacy Policy — we collect **nothing**; your secrets never leave your device |
| [SECURITY.md](SECURITY.md) | How to report a vulnerability (private disclosure) |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Expectations for contributors |

**The short version:** your secrets are yours, encrypted on your device, under
your sole control. There's no recovery if you lose your master password — keep
a `.vault` backup. We provide no warranty and accept no liability; you use it
at your own risk.

## Part of VibeProSoft

Built by [VibeProSoft](https://vibeprosoft.com) — tools for solo vibe coders.
