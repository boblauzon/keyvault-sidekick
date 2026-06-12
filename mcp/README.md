# keyvault-sidekick-mcp

A **local** [Model Context Protocol](https://modelcontextprotocol.io) server for
[KeyVault Sidekick](https://keyvault-sidekick.pages.dev). It lets a local AI agent —
**Claude Code, Claude Desktop, Cursor, Codex CLI** — generate, store, retrieve, and
export API keys in a local AES-256-GCM encrypted vault.

So you can just say:

> *"Create a restricted Stripe key for my ITIL Sidekick project and save it to KeyVault."*

…and the agent calls Stripe (via its own MCP), then `keyvault_save_key`, and it's
encrypted on your disk. Or:

> *"Pull my Cloudflare and Stripe keys from KeyVault and write a `.env` for this repo."*

…and the agent calls `keyvault_get_key` / `keyvault_export_env` and writes the file.

---

## Why this is a *local* server (and what that means)

KeyVault Sidekick's whole promise is **your secrets never leave your device**. A
*remote* MCP server (the kind a SaaS ships) would have to store and return your
plaintext secrets over the network — breaking that promise.

So this server runs **on your machine**, over a **local encrypted vault file**.
The data path is `local file → this process → your local agent`. There is no
server, no telemetry, no outbound request. It's the same idea as `1Password CLI`,
`pass`, or `sops`.

**Crypto is byte-identical to the browser app.** A vault written here imports into
the web app (Settings → Import `.vault`), and a `.vault` exported from the web app
decrypts here. Same AES-256-GCM, same PBKDF2-SHA256 (310 000 iterations).

> **Caveat for ChatGPT web / Codex *Cloud*:** those run in a remote sandbox and
> **cannot reach a local server.** Use this MCP with local agents (Claude Code,
> Claude Desktop, Cursor, Codex CLI). For ChatGPT web / Codex Cloud, keep using
> the browser **prefill URL** + **Hand off to AI** bridge (see the main app's
> `/connect` page).

---

## Two interfaces: MCP server + `keyvault` CLI

This package installs **two** local binaries that share one encrypted vault:

| | `keyvault-sidekick-mcp` (MCP server) | `keyvault` (CLI) |
|---|---|---|
| For | Conversational / agentic use | **Secure deploys** |
| How | The agent calls tools; values come back **into the chat** | You pipe values **straight to their destination** |
| Use when | "list my projects", "generate + save a key", browsing | "put this secret on the worker **without showing it to the model**" |

**Why the CLI matters:** when the MCP returns a key value, that plaintext lands in
the agent's conversation/transcript. The CLI writes secret values to **stdout
only**, so they pipe to their destination without ever passing through the chat:

```bash
# Deploy an existing key to a Cloudflare Worker — value never shown:
keyvault get Velocity STRIPE_SECRET | wrangler secret put STRIPE_SECRET

# Write a whole project's keys to a dotfile:
keyvault export-env Velocity > .dev.vars

# Generate, save, AND deploy a new secret in one line:
keyvault generate jwt --save --project Velocity --name AUTH_SECRET | wrangler secret put AUTH_SECRET

# Save a value produced by another tool (read from STDIN, not argv):
openssl rand -hex 16 | keyvault save Velocity WEBHOOK_KEY
```

Secret **values → stdout**; status/errors → stderr, so a piped value is always
exact (no trailing newline). Run `keyvault help` for the full command list.

**Getting `keyvault` on your PATH:** from the repo, `cd mcp && npm link` (or
`npm install -g .`). Without that, invoke it as
`node /path/to/keyvault-sidekick/mcp/cli.mjs <command>`. Either way, set
`KEYVAULT_PASSWORD` in the shell (e.g. `export KEYVAULT_PASSWORD=…`, or pull it
from your OS keychain) before running it.

---

## Requirements

- **Node.js 18 or newer** (uses the built-in WebCrypto API). Node 20+ recommended.
- A KeyVault master password (the one you use in the web app, or a new one if you
  start fresh here).

## Configuration

Two environment variables:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `KEYVAULT_PASSWORD` | **yes** | — | Your master password. Used only to derive the AES key; never written anywhere. |
| `KEYVAULT_VAULT_PATH` | no | `~/.keyvault-sidekick/vault.json` | Where the encrypted vault file lives. Point it at a `.vault` exported from the web app to share one store. |

---

## Install

The package isn't on npm yet, so install from this repo. Clone it, then point your
agent at `mcp/index.mjs`. (Once published, replace `node /path/to/mcp/index.mjs`
with `npx -y keyvault-sidekick-mcp`.)

### Claude Code

```bash
claude mcp add keyvault \
  --env KEYVAULT_PASSWORD=your-master-password \
  -- node /absolute/path/to/keyvault-sidekick/mcp/index.mjs
```

Then in a session: *"List my KeyVault projects."* Claude will call `keyvault_list_projects`.

### Claude Desktop

Edit `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/`,
Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "keyvault": {
      "command": "node",
      "args": ["C:\\path\\to\\keyvault-sidekick\\mcp\\index.mjs"],
      "env": { "KEYVAULT_PASSWORD": "your-master-password" }
    }
  }
}
```

Restart Claude Desktop.

### Cursor

Edit `~/.cursor/mcp.json` (or the project's `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "keyvault": {
      "command": "node",
      "args": ["/absolute/path/to/keyvault-sidekick/mcp/index.mjs"],
      "env": { "KEYVAULT_PASSWORD": "your-master-password" }
    }
  }
}
```

### Codex CLI

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.keyvault]
command = "node"
args = ["/absolute/path/to/keyvault-sidekick/mcp/index.mjs"]
env = { KEYVAULT_PASSWORD = "your-master-password" }
```

---

## Tools

| Tool | What it does | Returns the secret value? |
|---|---|---|
| `keyvault_list_projects` | List projects + key counts | no |
| `keyvault_list_keys` | List key names/types/notes in a project | **no** (names only) |
| `keyvault_get_key` | Read one key's plaintext value | **yes** (that's the point) |
| `keyvault_save_key` | Store/update a secret (auto-creates the project) | no |
| `keyvault_generate` | Generate jwt / uuid / hex / base64 / apiKey / password (optionally save) | yes (the generated value) |
| `keyvault_export_env` | Whole project as `.env` / `.envrc` / `settings` JSON, shell-quoted | yes (the block) |
| `keyvault_create_project` | Create an empty project | no |
| `keyvault_delete_key` | Delete a key (irreversible) | no |

`keyvault_list_keys` deliberately omits values — the agent must call
`keyvault_get_key` for a specific secret, so values aren't dumped wholesale.

---

## The browser ↔ MCP bridge

The web app stores its vault in the **browser's** `localStorage`; this MCP stores
its vault in a **file**. They use the identical encrypted format, so you bridge
them with the existing import/export:

- **Web app → MCP:** in the app, Settings → **Export `.vault`**, then point
  `KEYVAULT_VAULT_PATH` at that file.
- **MCP → web app:** in the app, Settings → **Import `.vault`** and pick the
  MCP's `vault.json`.

(Real-time two-way sync isn't built — they're two stores sharing one format. Pick
the file-based MCP vault as your source of truth if the agent is doing most of the
managing.)

---

## Security notes

- **Secrets never leave your machine.** No network calls, ever.
- **The vault file is written `0600`** (owner read/write only) on POSIX systems.
- **`KEYVAULT_PASSWORD` lives wherever you put it.** If you place it in an agent
  config file, that file becomes sensitive — protect it (`chmod 600`) or, better,
  export the variable from your shell profile / a secrets manager rather than
  hard-coding it. This is the inherent tradeoff of a non-interactive server: it
  needs the password to decrypt without prompting.
- **Forgotten password = unrecoverable vault**, by design. Keep a `.vault` backup.
- **No dependencies.** This server is one auditable file (`index.mjs`) using only
  Node built-ins — the same zero-supply-chain posture as the web app.

## License

MIT — see [../LICENSE](../LICENSE).
