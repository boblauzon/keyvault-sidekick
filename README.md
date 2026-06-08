# KeyVault Sidekick

**Browser-only encrypted secrets vault for solo vibe coders.**

No backend. No sign-up. No breach surface. Keys never leave the device.

Built for Claude Code users on the Cloudflare stack — organizing project secrets, generating secure values, and exporting keys to `.env` files without pasting them into chat.

**Live:** https://keyvault-sidekick.pages.dev

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
py -3 -m http.server 8091 --directory "KeyVault Sidekick"
# open http://localhost:8091
```

Or via Claude Code launch config:
```
/launch keyvault-sidekick
```

No build step. No npm. No dependencies. Opens in any modern browser.

---

## Claude Code — MCP integration (prefill hook)

After Claude creates a key via MCP (Stripe, Cloudflare, etc.), it can open a URL that pre-fills the vault's "Add key" modal automatically.

**URL format:**
```
http://localhost:8091/#action=prefill&name=KEY_NAME&value=KEY_VALUE&type=api_key&project=ProjectName&notes=optional+notes
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
http://localhost:8091/#action=prefill&name=STRIPE_RESTRICTED_KEY&value=rk_live_xxx&type=api_key&project=ITIL+Sidekick&notes=Restricted+to+Charges+only
```

---

## Security model

- **Zero backend.** The server only serves `index.html`. No API, no database, no accounts.
- **Encrypted at rest.** The `localStorage` blob is ciphertext — key names and values are never stored in plaintext.
- **URL fragment security.** The `#fragment` part of a URL is never sent to the HTTP server, so `value=...` in the prefill URL is not logged server-side.
- **Short-lived in memory.** The derived AES key lives in JS memory only. Cleared on lock. Cleared on page close.
- **CSP.** `connect-src 'none'` — no outbound network requests from the page.
- **No telemetry.** Zero analytics, zero tracking.
- **PBKDF2 parameters stored in blob.** Forward-compatible: future iteration increases don't break existing vaults.

---

## Stack

- Vanilla HTML / CSS / JS — single `index.html` file (~2300 lines)
- Web Crypto API (PBKDF2 + AES-256-GCM, native browser)
- `localStorage` (encrypted blob)
- Zero build tooling for MVP — open and use
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

---

## Part of VibeProSoft

Built by [VibeProSoft](https://vibeprosoft.com) — tools for solo vibe coders.
