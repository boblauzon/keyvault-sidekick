# KeyVault MCP — Troubleshooting

Most problems are a **wrong master password** in your agent's config. This guide
walks through the fixes for that and the other common snags.

---

## Start here: `keyvault status`

Before anything else, ask the vault what's wrong. It never prints your secrets —
just whether your password works:

```sh
keyvault status
```

```
vault:     C:\Users\you\.keyvault-sidekick\vault.json
exists:    yes
password:  set
unlocked:  YES        ← the password is correct ✓
projects:  3
keys:      12
```

If you don't have the `keyvault` CLI on your PATH, run it straight from the repo:

```sh
node /path/to/keyvault-sidekick/mcp/cli.mjs status
```

…or, from inside your AI agent, just say **"run keyvault_status"** — the MCP server
exposes the same check as a tool and will report back without revealing any values.

The rest of this guide is organized by what `status` tells you.

---

## 1. `unlocked: NO` — "Incorrect master password"

The vault exists, but the password your agent is using doesn't open it. There are
two very different situations — figure out which one you're in:

### A) The vault is fine; you just typed the wrong password into the config

This is the common one (a typo during `claude mcp add`). Your keys are safe — you
only need to point the agent at the **correct** password. Nothing gets re-encrypted.

**Claude Code:**
```sh
claude mcp remove keyvault
claude mcp add keyvault --env KEYVAULT_PASSWORD=your-correct-password -- node /path/to/keyvault-sidekick/mcp/index.mjs
```
Then **restart Claude Code** and run `keyvault status` again — it should say `unlocked: YES`.

**Other clients** edit a config file directly (see [§5](#5-where-the-config-lives)) —
fix the `KEYVAULT_PASSWORD` value there and restart the app.

### B) The vault was *created* with the wrong password

If you set the wrong password **and then saved a key before noticing**, that first
save created a brand-new vault locked to the wrong password. Now "fixing" the
config to the password you *meant* will keep failing — because the file is genuinely
encrypted with the other one.

- **You remember the password it was actually created with** (e.g. you know the typo):
  re-key it to the password you want, then update your config.
  ```sh
  KEYVAULT_PASSWORD=the-password-it-was-made-with \
  KEYVAULT_NEW_PASSWORD=the-password-you-want \
  keyvault change-password
  ```
  Then update `KEYVAULT_PASSWORD` in your agent config to the new one (step A).

- **You have no idea what it was created with, and the vault has nothing important**
  (it was a fresh mistake): delete it and start clean.
  ```sh
  rm ~/.keyvault-sidekick/vault.json      # Windows: del "%USERPROFILE%\.keyvault-sidekick\vault.json"
  ```
  Then reinstall (step A) with the correct password. Your next save creates a fresh vault.

- **You have a `.vault` backup** from the browser app: see [§4](#4-empty-or-wrong-vault).

> **Why there's no "reset password" button:** KeyVault is zero-knowledge. Nobody —
> not even us — can read your vault without the password, so there's nothing to
> reset. That's the security trade-off. A `.vault` backup is your only recovery.

---

## 2. Change your master password on purpose

Same `change-password` command, used deliberately. It decrypts with your current
password and re-encrypts the whole vault under a new one. All keys are preserved.

```sh
# current password comes from KEYVAULT_PASSWORD; new one from KEYVAULT_NEW_PASSWORD or stdin
KEYVAULT_PASSWORD=old-pass KEYVAULT_NEW_PASSWORD=new-pass keyvault change-password
# or:
printf %s "new-pass" | KEYVAULT_PASSWORD=old-pass keyvault change-password
```

Then **update `KEYVAULT_PASSWORD` everywhere you use it** — your MCP config and any
shell env — or the next unlock will fail. Re-run `keyvault status` to confirm.

> Passwords are passed via env var / stdin (never as a command argument) so they
> don't land in your shell history or process list.

---

## 3. Uninstall / reinstall the MCP server

**Claude Code:**
```sh
claude mcp list                 # see what's registered
claude mcp remove keyvault      # uninstall
claude mcp add keyvault --env KEYVAULT_PASSWORD=your-password -- node /path/to/keyvault-sidekick/mcp/index.mjs
```
Restart Claude Code after either. Reinstalling does **not** touch your vault file —
it only changes how the agent launches the server. Your keys stay put.

To also remove the data, delete the vault file (back it up first if you want it):
`~/.keyvault-sidekick/vault.json`.

---

## 4. Empty or wrong vault

`status` shows `exists: no`, or it unlocks but has 0 projects when you expected your
browser keys.

The MCP server uses its **own local file** (default
`~/.keyvault-sidekick/vault.json`), which is **separate** from the browser app's
vault (that lives in your browser's storage). To work from your existing browser keys:

1. In the web app: **Settings → Export `.vault`**.
2. Point the server at that file by adding `--env KEYVAULT_VAULT_PATH="C:/path/to/that.vault"`
   to your `claude mcp add` command (and use the **same** master password the browser
   vault uses for `KEYVAULT_PASSWORD`).

To go the other way (see MCP-created keys in the browser): in the web app,
**Settings → Import `.vault`** and pick the server's `vault.json`.

---

## 5. Where the config lives

You can always edit `KEYVAULT_PASSWORD` / `KEYVAULT_VAULT_PATH` by hand:

| Client | Config |
|---|---|
| **Claude Code** | `claude mcp add/remove/list` (recommended), or `~/.claude.json` |
| **Claude Desktop** | `claude_desktop_config.json` — macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\` |
| **Cursor** | `~/.cursor/mcp.json` (or project `.cursor/mcp.json`) |
| **Codex CLI** | `~/.codex/config.toml` |

After any manual edit, fully **restart** the app. Full install snippets for each are
in [`README.md`](README.md).

---

## 6. Agent doesn't see the `keyvault_*` tools

- **Restart the agent** — MCP servers are read at startup.
- Confirm it's registered: `claude mcp list` (Claude Code).
- Check Node is available and 18+: `node --version`. The server is started by
  `node …/mcp/index.mjs`, so `node` must be on the PATH the agent uses.
- Use an **absolute path** to `index.mjs` in the config (relative paths break when the
  agent's working directory differs).

---

## 7. "No master password — set KEYVAULT_PASSWORD or KEYVAULT_PASSWORD_FILE"

The server has no password to work with. Provide **one** of:

- `--env KEYVAULT_PASSWORD=…` (inline), or
- `--env KEYVAULT_PASSWORD_FILE=/path/to/0600/file` — keeps the password **out of
  your agent config**; the file is read at startup (one trailing newline stripped).

```sh
umask 177 && printf %s 'your-master-password' > ~/.keyvault-sidekick/password
claude mcp add keyvault --env KEYVAULT_PASSWORD_FILE=$HOME/.keyvault-sidekick/password -- node /path/to/mcp/index.mjs
```

Then restart the agent. (`change-password` takes the same forms for the new
password: `KEYVAULT_NEW_PASSWORD` / `KEYVAULT_NEW_PASSWORD_FILE` / stdin.)

---

## Quick reference

| Problem | Command |
|---|---|
| Is my password right? | `keyvault status` |
| Wrong password typed in config | `claude mcp remove keyvault` → `claude mcp add … --env KEYVAULT_PASSWORD=<correct> …` |
| Change / fix the vault password | `KEYVAULT_PASSWORD=<cur> KEYVAULT_NEW_PASSWORD=<new> keyvault change-password` |
| Start fresh | delete `~/.keyvault-sidekick/vault.json`, reinstall |
| Use my browser keys | Export `.vault` → `--env KEYVAULT_VAULT_PATH=…` |
| List what's registered | `claude mcp list` |

Still stuck? Open an issue: https://github.com/boblauzon/keyvault-sidekick/issues
