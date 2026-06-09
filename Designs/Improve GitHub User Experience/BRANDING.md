# KeyVault Sidekick - Brand Guidelines

## Overview
KeyVault Sidekick is a browser-only encrypted secrets vault for developers. The brand communicates security, trust, simplicity, and developer-first design.

---

## Brand Identity

### Positioning
**"Your API keys, encrypted locally. Zero backend, zero breach surface."**

KeyVault Sidekick is positioned as:
- **Secure**: Military-grade encryption that never leaves the browser
- **Simple**: No sign-up, no backend, just open and use
- **Developer-focused**: Built by developers, for developers
- **Trustworthy**: Open source, audited, verifiable

### Tone of Voice
- **Technical but approachable**: Use precise terminology without being intimidating
- **Confident**: Direct statements about security capabilities
- **Transparent**: Honest about limitations and trade-offs
- **Concise**: Developers value brevity over marketing fluff

---

## Visual Identity

### Logo & Mark
- **Primary Mark**: A 8×8px square with rounded corners (2px radius)
- **Gradient**: Linear gradient from teal-500 (#2dd4bf) to cyan-500 (#06b6d4)
- **Icon**: FolderKey or Lock icon in white, centered

### Color Palette

#### Primary Colors
```
Teal-500:  #2dd4bf  (Primary accent, CTAs, active states)
Cyan-500:  #06b6d4  (Gradient partner, secondary accent)
Teal-400:  #2dd4bf  (Hover states, lighter accent)
```

#### Background Colors
```
Slate-950: #020617  (Primary background)
Slate-900: #0f172a  (Elevated surfaces)
Slate-800: #1e293b  (Cards, inputs)
```

#### Border Colors
```
Slate-800: #1e293b  (Default borders)
Slate-700: #334155  (Stronger borders, focus states)
```

#### Text Colors
```
White:     #ffffff  (Headings, primary text)
Slate-300: #cbd5e1  (Body text)
Slate-400: #94a3b8  (Secondary text)
Slate-500: #64748b  (Tertiary text, placeholders)
```

#### Semantic Colors
```
Success:   #34d399  (Emerald-400)
Warning:   #fbbf24  (Amber-400)
Error:     #f87171  (Rose-400)
Info:      #60a5fa  (Blue-400)
```

#### Type Badge Colors
```
API Key:   #60a5fa (Blue-400)
Secret:    #f87171 (Rose-400)
Token:     #c084fc (Purple-400)
OAuth:     #fbbf24 (Amber-400)
Webhook:   #34d399 (Emerald-400)
Other:     #94a3b8 (Slate-400)
```

### Typography

#### Font Families
```
Sans-serif: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter
Monospace:  ui-monospace, "JetBrains Mono", "Fira Code", Consolas, "Courier New"
```

#### Font Sizes
```
Display:   48px / 3rem     (Hero headlines)
Heading 1: 36px / 2.25rem  (Page titles)
Heading 2: 24px / 1.5rem   (Section headers)
Heading 3: 18px / 1.125rem (Card titles)
Body:      14px / 0.875rem (Default text)
Small:     12px / 0.75rem  (Labels, captions)
Tiny:      10px / 0.625rem (Badges, timestamps)
```

#### Font Weights
```
Bold:      700 (Headlines)
Semibold:  600 (Subheadings, buttons)
Medium:    500 (UI elements)
Regular:   400 (Body text)
```

### Spacing Scale
```
xs:   4px   (Tight spacing)
sm:   8px   (Compact spacing)
md:   12px  (Standard spacing)
lg:   16px  (Comfortable spacing)
xl:   24px  (Section spacing)
2xl:  32px  (Large gaps)
3xl:  48px  (Major sections)
```

### Border Radius
```
sm:   4px   (Small elements)
md:   8px   (Cards, buttons)
lg:   12px  (Large cards)
xl:   16px  (Modals, major surfaces)
2xl:  24px  (Hero elements)
full: 9999px (Pills, badges)
```

### Shadows
```
sm:   0 1px 2px rgba(0, 0, 0, 0.05)
md:   0 4px 6px rgba(0, 0, 0, 0.1)
lg:   0 10px 15px rgba(0, 0, 0, 0.15)
xl:   0 20px 25px rgba(0, 0, 0, 0.2)
glow: 0 0 20px rgba(45, 212, 191, 0.25)
```

---

## Component Guidelines

### Buttons

#### Primary Button
- **Purpose**: Main call-to-action
- **Style**: Gradient background (teal-500 → cyan-500), white text, semibold
- **Hover**: Enhanced shadow with teal glow
- **Use**: One per section, for the most important action
```tsx
<button className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all">
  Primary Action
</button>
```

#### Secondary Button
- **Purpose**: Alternative actions
- **Style**: Slate-800 background, white text
- **Hover**: Lighter slate-700 background
- **Use**: Supporting actions
```tsx
<button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
  Secondary Action
</button>
```

#### Ghost Button
- **Purpose**: Tertiary actions
- **Style**: Transparent background, slate-400 text
- **Hover**: Slate-800 background
- **Use**: Less prominent actions
```tsx
<button className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors">
  Tertiary
</button>
```

#### Danger Button
- **Purpose**: Destructive actions
- **Style**: Rose-500/10 background, rose-400 text
- **Hover**: Rose-500/20 background
- **Use**: Delete, wipe, destroy actions
```tsx
<button className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg transition-all">
  Delete
</button>
```

### Cards

#### Standard Card
- **Background**: Slate-900/50 with backdrop blur
- **Border**: 1px solid slate-800
- **Radius**: 16px (xl)
- **Padding**: 24px
- **Hover**: Border changes to slate-700
```tsx
<div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
  Card Content
</div>
```

#### Elevated Card
- **Background**: Slate-900/80
- **Shadow**: Large shadow for prominence
- **Use**: Modals, important containers
```tsx
<div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
  Elevated Content
</div>
```

### Inputs

#### Text Input
- **Background**: Slate-950/50
- **Border**: 1px solid slate-700
- **Focus**: 2px ring teal-500
- **Font**: Monospace for code-like inputs
```tsx
<input 
  type="text" 
  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono"
/>
```

#### Search Input
- **Icon**: Search icon on the left (slate-400)
- **Padding**: Extra left padding for icon
```tsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input 
    type="search" 
    placeholder="Search..."
    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
  />
</div>
```

### Badges & Tags

#### Type Badge
- **Size**: Small (10px font)
- **Padding**: 2px horizontal, 6px vertical
- **Border**: 1px with alpha transparency
- **Colors**: Semantic based on type
```tsx
<span className="text-xs px-2 py-0.5 rounded border text-blue-400 border-blue-400/20 bg-blue-400/10">
  api_key
</span>
```

#### Status Badge
- **Font**: Monospace, uppercase
- **Use**: Locked/Unlocked, Active/Inactive states
```tsx
<span className="font-mono text-xs px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
  UNLOCKED
</span>
```

### Icons
- **Library**: Lucide React
- **Size**: 16px (w-4 h-4) for inline, 20px (w-5 h-5) for buttons
- **Color**: Inherit from parent or semantic colors
- **Stroke Width**: 2 (default)

---

## Animation Guidelines

### Transitions
- **Duration**: 150-200ms for micro-interactions
- **Easing**: ease-in-out for smooth transitions
- **Properties**: 
  - Colors: `transition-colors`
  - All: `transition-all` (use sparingly)
  - Specific: `transition-[property]`

### Hover Effects
- **Buttons**: Scale up shadow, lighten background
- **Cards**: Change border color, slight lift with shadow
- **Links**: Underline or color change

### Loading States
- **Spinner**: Border animation with teal-400
- **Skeleton**: Slate-800 with pulse animation
- **Progress**: Gradient animation left to right

---

## Layout Patterns

### Container
- **Max Width**: 1280px (max-w-7xl) for main content
- **Padding**: 24px horizontal (px-6), 32px vertical (py-8)

### Grid Systems
- **Project Cards**: Auto-fill, min 280px columns
- **Settings**: 2 columns on desktop, 1 on mobile
- **Key List**: Single column, full width

### Spacing
- **Section Gaps**: 24px (gap-6)
- **Card Padding**: 24px (p-6)
- **Form Fields**: 16px margin bottom (mb-4)

---

## Accessibility

### Contrast Ratios
- **Primary text on dark**: 16:1 (WCAG AAA)
- **Secondary text on dark**: 7:1 (WCAG AA)
- **Interactive elements**: 4.5:1 minimum

### Focus States
- **Ring**: 2px solid teal-500
- **Offset**: None
- **Visibility**: Always visible on keyboard focus

### ARIA Labels
- **Buttons**: Use aria-label for icon-only buttons
- **Inputs**: Associate labels with inputs
- **Live Regions**: Use aria-live for status updates

---

## Voice & Messaging

### Headlines
- **Hero**: "Your API keys, encrypted locally"
- **Value Props**: Direct benefits, no fluff
- **CTAs**: Action-oriented ("Open Vault", "Generate Key")

### Error Messages
- **Format**: Problem + Solution
- **Example**: "Incorrect master password. Try again or reset your vault."
- **Tone**: Helpful, not judgmental

### Success Messages
- **Format**: Action completed
- **Example**: "Key copied to clipboard"
- **Duration**: 2-3 seconds, then auto-dismiss

### Security Messaging
- **Transparency**: Be clear about what is/isn't encrypted
- **Technical**: Use correct terminology (AES-256-GCM, PBKDF2)
- **Trust**: Emphasize zero backend, local-only storage

---

## Usage Examples

### Landing Page Hero
```tsx
<section className="max-w-7xl mx-auto px-6 pt-20 pb-32">
  <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-medium mb-6">
    <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
    Invitation-only · Audited · v2.0
  </div>
  <h1 className="text-6xl font-bold text-white mb-6">
    Your API keys,
    <br />
    <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
      encrypted locally
    </span>
  </h1>
</section>
```

### Project Card
```tsx
<div className="group bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
    <FolderKey className="w-5 h-5 text-teal-400" />
  </div>
  <h3 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
    Project Name
  </h3>
</div>
```

---

## Attribution

This design system incorporates components and patterns from:
- **shadcn/ui** - Used under MIT License
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first CSS framework
- **Unsplash** - Photography for marketing materials

---

**Last Updated**: June 2026
**Version**: 2.0.2
