# Getting Started with KeyVault Sidekick

A friendly, step-by-step walkthrough — **no technical background needed**. In about
five minutes you'll have a private, encrypted vault for your passwords and API keys,
and (if you want) your AI assistant helping you manage them.

> 🌐 Prefer reading this in your browser? The same guide is built into the app at
> **[keyvault-sidekick.pages.dev/guide.html](https://keyvault-sidekick.pages.dev/guide.html)**.

⏱️ ~5 minutes &nbsp;·&nbsp; 🔓 No sign-up &nbsp;·&nbsp; 💻 Nothing to install (Steps 1–4)

---

## What is KeyVault Sidekick?

It's a free, private place to keep your **secrets** — passwords, API keys, and tokens.
Everything is locked with a single master password and stored **only on your own
device**. There's no sign-up and no company server, so your secrets never travel
anywhere. Close the tab and they stay safely encrypted in your browser until you come
back.

## ⚠️ Before you start — the one rule that matters

- All you need is a **web browser** (Chrome, Edge, Firefox, or Safari).
- Pick a master password you'll remember. A long phrase like `purple-otter-rides-the-train`
  is both strong and easy to recall.
- **There is no "forgot password."** If you lose it, the vault can't be opened — by
  design, because no one (not even us) can see inside it. We'll make a backup in Step 6.

---

## Step 1 · Open the app and create your vault

1. Go to **[keyvault-sidekick.pages.dev](https://keyvault-sidekick.pages.dev)** and click **Open vault**.
2. The first time, you'll see **Create your vault**. Type your master password twice,
   then click **Create vault**.
3. That's it — you're in. Next time you visit, you'll just type the same password to **Unlock**.

## Step 2 · Make a project

Projects are simple folders that group related keys together — for example, one project
per app or website.

1. Click **+ New project**.
2. Give it a name (e.g. *My Website*), pick a color, and click **Create project**.

## Step 3 · Add your keys

You can store a key you already have, *or* let KeyVault generate a strong new one.

- **I already have a key:** click **+ Add key**, fill in the **Name** (e.g. `STRIPE_SECRET`),
  paste the **Value**, choose a **Type**, and click **Save**.
- **Make a new strong one:** click **+ Quick generate ▾** and pick what you need — a
  password, API key, JWT secret, UUID, and more. It's created and saved instantly. (The
  **Generator** tab at the top gives you more options.)

Every key has **Show / Hide** and **Copy** buttons. Values stay hidden until you choose
to reveal them.

## Step 4 · Use your keys in your projects

When you need your keys somewhere else — like a `.env` file for an app:

- **Copy as .env** — copies the whole project as `NAME="value"` lines.
- The small **.env** button on a single key copies just that one.
- The **Export** tab lets you choose specific keys and a format (`.env`, `.envrc`, or
  `settings.json`), then Copy or Download.

## Step 5 · Connect your AI assistant 🆕

Want your AI coding assistant (like Claude Code or ChatGPT) to help with your keys? Open
a project and click **🔌 Connect to AI**. You'll see two choices:

### 💬 Paste a prompt — the easy way

1. Pick your assistant (Claude Code, ChatGPT Codex, or any AI).
2. Click **Copy prompt** and paste it as your first message in that assistant.

Your assistant now knows your project and the *names* of your keys, and can help you save
new ones. **Your secret values are never put into the chat** — when the assistant saves a
key, KeyVault pops open so you can review and click **Save**.

### 🤖 Full automation — hands-free (for more technical users)

This installs a small local helper (an **MCP server**) so your AI can create, save, read,
and manage keys *by itself* — no clicking. The modal gives you a one-line install command
and a ready-to-paste kickoff message. It works with local AI tools (Claude Code, Claude
Desktop, Cursor, Codex CLI).

```sh
# Example install (the modal fills in the exact command for you):
git clone https://github.com/boblauzon/keyvault-sidekick
claude mcp add keyvault --env KEYVAULT_PASSWORD=your-master-password -- node ./keyvault-sidekick/mcp/index.mjs
```

Full step-by-step install (including Claude Desktop / Cursor / Codex) lives on the
**[Connect page](https://keyvault-sidekick.pages.dev/connect.html)**, Option 5, and in
[`mcp/README.md`](mcp/README.md).

> **Set it up with the wrong password, or it won't connect?** Ask your assistant to run
> `keyvault_status` (or run `keyvault status` in a terminal) — it tells you if your password
> opens the vault, with no secrets shown. Fixes (reinstall, re-key, start fresh) are in the
> **[troubleshooting guide](mcp/TROUBLESHOOTING.md)**.

> **Bonus:** the **Hand off to AI ↗** button hands your assistant the actual *values* for
> a specific task — only when it needs them, with a "don't echo these" guardrail.

## Step 6 · Back up your vault & stay safe

Because there's no password recovery, a backup is your safety net:

1. Click the **⚙ Settings** gear → **Export .vault**. This saves an **encrypted** backup
   file. Keep it somewhere safe — it still needs your master password to open.
2. To move your vault to another device, copy that file there and use **Import .vault**.

Other good habits, all in **Settings**: turn on **auto-lock** (locks the vault when idle),
**clipboard auto-clear**, and you can **change your master password** anytime.

---

## 🎉 You're done!

You now have a private, encrypted vault and know how to add, use, back up, and (optionally)
let your AI manage your keys. Everything stays on your device — no accounts, no servers,
no surprises.

---

## Quick answers

**Is it really private?**
Yes. KeyVault Sidekick is open-source and makes **zero network requests** — your keys never
leave your device. You can even save the page and run it offline. There are no accounts,
analytics, or telemetry.

**I forgot my master password — can you reset it?**
No, and that's the point: no one can see inside your vault, including us, so there's no
reset. If you have a `.vault` backup you can restore it (you'll still need the password it
was saved with). Otherwise you can wipe and start fresh in Settings.

**Where exactly are my keys stored?**
Encrypted in **this browser, on this device**. A different browser or device is a separate,
empty vault — move yours by exporting a `.vault` file and importing it on the other device.

**What's the difference between "Connect to AI" and "Hand off to AI"?**
**Connect to AI** introduces your assistant to a project (its key *names* and how to save
more) without sharing any secret values. **Hand off to AI** gives the assistant the actual
*values* for a task, on demand. And **Full automation** (the MCP server) lets a local
assistant do it all itself.

**Does it cost anything?**
No — it's free and open, and always will be. If it saves you time, a ☕
[Ko-fi](https://ko-fi.com/roblauzon) tip is appreciated but never required.

---

<sub>KeyVault Sidekick by VibeProSoft · Free & open · Your keys never leave your device.</sub>
