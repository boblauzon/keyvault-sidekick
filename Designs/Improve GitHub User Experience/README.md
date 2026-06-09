# KeyVault Sidekick

**Browser-only encrypted secrets vault for solo developers.**

No backend. No sign-up. No breach surface. Keys never leave the device.

Built for Claude Code users on the Cloudflare stack — organizing project secrets, generating secure values, and exporting keys to `.env` files without pasting them into chat.

**Live Demo:** [View Application](#)

---

## 🎨 Design System

This project uses a custom design system built on:
- **shadcn/ui components** (MIT License)
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **Radix UI** primitives for accessibility

See [BRANDING.md](./BRANDING.md) for complete brand guidelines.

---

## ✨ Features

### 🔐 Military-Grade Encryption
- **AES-256-GCM** authenticated encryption
- **PBKDF2** key derivation (310,000 iterations, SHA-256)
- Master password never stored or transmitted
- All encryption happens in your browser

### 📁 Project Organization
- Group secrets by project (ITIL Sidekick, Stripe keys, etc.)
- Color-coded project cards
- Search and filter across all projects
- Archive completed projects

### ⚡ 7 Built-in Generators
1. **JWT Secret** - 256-bit or 512-bit random hex
2. **UUID v4** - Standard UUID generation
3. **Random Hex** - Configurable byte length (16/32/64 bytes)
4. **Random Base64** - URL-safe, configurable length
5. **API Key Pattern** - `sk-` prefix + random alphanumeric
6. **Bcrypt Rounds** - Numeric value with strength labels
7. **Password** - Configurable length and character types

### 📤 One-Click Export
- **`.env`** format: `KEY="value"`
- **`.envrc`** format: `export KEY="value"` (direnv)
- **`settings.json`** format: Claude Code environment block
- Copy to clipboard or download as file

### 🔒 Security Features
- **Auto-lock** - Configurable idle timeout (5/10/15/30/60 min)
- **Clipboard auto-clear** - Clear copied secrets after 15/30/60 seconds
- **Vault backup** - Export/import `.vault` file (encrypted)
- **Change master password** - Re-encrypt vault with new password
- **Zero telemetry** - No analytics, no tracking, no external requests

---

## 🚀 Running Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app runs at `http://localhost:5173` (or the next available port).

---

## 🏗️ Project Structure

```
keyvault-sidekick/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main application entry
│   │   └── components/
│   │       ├── LandingPage.tsx  # Marketing landing page
│   │       ├── VaultApp.tsx     # Main vault application
│   │       ├── ProjectGrid.tsx  # Projects list view
│   │       ├── ProjectDetail.tsx # Single project view
│   │       ├── GeneratorPanel.tsx # Secret generators
│   │       ├── ExportPanel.tsx   # Export functionality
│   │       └── SettingsPanel.tsx # Settings & security
│   ├── styles/
│   │   ├── index.css            # Main stylesheet imports
│   │   ├── theme.css            # KeyVault color tokens
│   │   ├── tailwind.css         # Tailwind imports
│   │   └── fonts.css            # Font declarations
│   └── imports/                 # Reference files
├── BRANDING.md                  # Complete brand guidelines
├── ATTRIBUTIONS.md              # Third-party attributions
└── package.json
```

---

## 🎨 Branding

### Color Palette

**Primary Colors**
- Teal-500: `#2dd4bf` (Primary accent, CTAs)
- Cyan-500: `#06b6d4` (Gradient partner)

**Backgrounds**
- Slate-950: `#020617` (Primary background)
- Slate-900: `#0f172a` (Elevated surfaces)
- Slate-800: `#1e293b` (Cards, inputs)

**Text Colors**
- White: `#ffffff` (Headings)
- Slate-300: `#cbd5e1` (Body text)
- Slate-400: `#94a3b8` (Secondary text)

See [BRANDING.md](./BRANDING.md) for complete guidelines.

---

## 🔐 Security Model

### What's Protected
✅ **Encrypted at rest** - All keys stored in AES-256-GCM ciphertext  
✅ **Zero backend** - No server to compromise  
✅ **Local-only** - Keys never leave your browser  
✅ **URL fragment security** - Prefill values not logged server-side  
✅ **PBKDF2 310k iterations** - Strong key derivation  
✅ **CSP headers** - `connect-src 'none'` blocks network requests  

### Threat Model

| Threat | Protected? | Mechanism |
|---|---|---|
| Network intercept | ✅ Protected | Local-only, no transmission |
| Stolen encrypted blob | ✅ Protected | Strong encryption + key derivation |
| Browser extension reading DOM | ⚠️ Not protected | Outside app control |
| Forgotten master password | ⚠️ No recovery | Export `.vault` backup |

---

## 🤝 Contributing

This is a personal project but suggestions are welcome!

1. Open an issue describing the enhancement
2. Wait for discussion/approval
3. Submit a PR with your changes

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Attributions

This project includes:
- **[shadcn/ui](https://ui.shadcn.com/)** components - [MIT License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)
- **[Lucide React](https://lucide.dev)** icons - [ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
- **[Tailwind CSS](https://tailwindcss.com)** - [MIT License](https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE)
- **[Radix UI](https://www.radix-ui.com/)** primitives - [MIT License](https://github.com/radix-ui/primitives/blob/main/LICENSE)

See [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) for complete list.

---

## 🌟 Part of VibeProSoft

Built by [VibeProSoft](https://vibeprosoft.com) — tools for solo vibe coders.

**Other Projects:**
- ITIL Sidekick - AI-powered ITIL documentation assistant
- Velocity - Fast project scaffolding for developers

---

**Version:** 2.0.2  
**Last Updated:** June 2026  
**Status:** Production Ready
