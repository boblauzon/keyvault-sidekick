# Privacy Policy

**KeyVault Sidekick** — by VibeProSoft (Rob Lauzon)
**Effective date:** 2026-06-11
**Last updated:** 2026-06-11

This policy describes what data KeyVault Sidekick (the "Service") collects
when you use the web application at <https://keyvault-sidekick.pages.dev>.

## TL;DR

**We collect nothing. We store nothing about you. We have no analytics, no
tracking, no cookies, no telemetry, no IP logs of our own.** Your secrets are
encrypted in your browser and never leave your device.

You can verify this. Open your browser's developer tools, switch to the
Network tab, and load the vault. The only requests you will see are the
initial static-asset loads (HTML, CSS, snippet text files). No background
requests, no analytics beacons, nothing.

---

## 1. What we collect about you

**Nothing.** The Service is a static web page plus client-side JavaScript.
There is no backend, no database, no user account system. We have not built
anything that *could* collect your data even if we wanted to.

Specifically, we do **not** collect:

- Your email address
- Your name
- Your IP address (we do not run servers that see it)
- Browser fingerprints
- Device identifiers
- Usage analytics or telemetry of any kind
- Cookies (we set none)
- Your vault content, master password, key names, or key values — under any
  circumstances

## 2. What your browser stores (locally, on your device)

The Service stores the following in your browser's `localStorage`, which
**never leaves your device**:

- **`keyvault_sidekick_v1`** — your encrypted vault blob (AES-256-GCM
  ciphertext). Only your master password can decrypt it. Even we cannot.
- **`keyvault_sidekick_settings`** — your preferences (auto-lock timeout,
  clipboard-clear delay). No secrets.

Your browser also uses `sessionStorage` briefly during the Claude Code /
ChatGPT Codex "prefill" flow to carry a key value from the URL fragment to
the modal. That value is removed from `sessionStorage` the moment you Save
or Skip in the modal, and `sessionStorage` is wiped automatically when you
close the tab.

You can wipe everything we store at any time via the in-app
**Settings → Danger zone → Wipe vault** button, or by clearing site data
in your browser settings.

## 3. Third parties that may see your IP

We host the Service's static files on **Cloudflare Pages** and the source
code on **GitHub**. Donations go through **Ko-fi**. We do not control these
providers; they have their own privacy policies:

| Provider | What they may see | Their policy |
|---|---|---|
| Cloudflare (Pages CDN) | IP address, timestamp, requested file, user agent — standard CDN access logs | <https://www.cloudflare.com/privacypolicy/> |
| GitHub | IP address, visits to the source repository | <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement> |
| Ko-fi (only if you donate) | Whatever Ko-fi requires to process payment | <https://ko-fi.com/manage/policies> |

We have no contractual access to those logs. We never see them, never
request them, and never combine them with any other data.

## 4. No cookies, no tracking, no third-party scripts

The Service loads no third-party JavaScript, no analytics SDKs, no
advertising tags, no social-media widgets, no fonts from CDNs, no remote
images. The Content Security Policy on the vault page
(`connect-src 'none'`) **enforces** this in the browser — even a future
mistake on our part could not load an external script without you reading
the source first.

There are no cookies. There is no localStorage entry that identifies you to
anyone else, ever.

## 5. Children's privacy (COPPA)

The Service is not directed at children under 13. We do not knowingly
collect personal information from children under 13 — and as noted above,
we do not knowingly collect personal information from anyone.

## 6. Your rights (GDPR / CCPA / PIPEDA / others)

Under GDPR (EU), CCPA (California), PIPEDA (Canada), and similar regimes,
you typically have rights to access, correct, port, and delete data
collected about you.

**Because we collect and store no personal data about you, there is nothing
for us to access, correct, port, or delete on your behalf.** Your vault
data is yours, on your device, under your sole control. Use the in-app
Wipe button to delete it.

If you donated via Ko-fi, exercise data rights about that donation with
Ko-fi directly under their policy.

## 7. Data we would collect (if any)

We may collect data only in the following narrow case:

- **If you email us** at security@vibeprosoft.com or
  rob.lauzon@vibeprosoft.com, your email content is processed by Google
  (which hosts the mailbox) under [Google's privacy policy](https://policies.google.com/privacy).
  We keep emails as long as needed to respond and then archive or delete.

We do **not** sell, rent, or share personal information with third parties.
We don't have any to sell.

## 8. Changes to this policy

We may revise this policy as the Service evolves (for example, if we ever
added an optional sync feature). Material changes will be noted in the
GitHub release notes and the "Last updated" date at the top of this file
will change. Continued use after a change constitutes acceptance.

The current policy is always in the
[GitHub repository](https://github.com/boblauzon/keyvault-sidekick/blob/master/PRIVACY.md).

## 9. Contact

Privacy questions: **rob.lauzon@vibeprosoft.com**
