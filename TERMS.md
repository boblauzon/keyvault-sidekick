# Terms of Use

**KeyVault Sidekick** — by VibeProSoft (Rob Lauzon)
**Effective date:** 2026-06-11
**Last updated:** 2026-06-11

These Terms govern your use of the **KeyVault Sidekick** web application hosted at
<https://keyvault-sidekick.pages.dev> (the "Service") and any source code or
artifacts distributed under the [KeyVault Sidekick GitHub repository](https://github.com/boblauzon/keyvault-sidekick)
(the "Software"). By using the Service or the Software, you agree to these Terms.

If you do not agree, do not use the Service or the Software.

---

## 1. What the Service is

KeyVault Sidekick is a **browser-only, client-side encrypted secrets vault**.
Everything happens inside your browser:

- Your secrets are encrypted with **AES-256-GCM** using a key derived from your
  master password (PBKDF2-SHA256, 310 000 iterations).
- The encrypted blob is stored in your browser's `localStorage`.
- **No vault content is ever transmitted to any server**, including ours.
- The Service has no backend, no user accounts, and no telemetry.

The Service is provided **free of charge**.

## 2. License (Software)

The Software is licensed under the **MIT License**. See [`LICENSE`](LICENSE)
for full terms. In short: you may use, copy, modify, and distribute it freely,
subject only to including the copyright notice.

The MIT License explicitly disclaims warranties and limits liability. Those
disclaimers also apply to your use of the hosted Service.

## 3. Your responsibilities

By using the Service, you accept that **you alone are responsible for**:

- **Your master password.** We do not know it, store it, transmit it, or have
  any ability to reset it. **If you forget it, your vault is unrecoverable.**
- **Your backups.** Use the in-app **Export `.vault`** feature regularly and
  keep the backup somewhere safe. If your browser storage is wiped, cleared,
  or corrupted and you have no backup, the data is lost.
- **The security of your device.** A malicious browser extension, keylogger,
  or compromised device can defeat client-side encryption. The Service cannot
  protect you from threats on your own machine.
- **The legality of what you store.** Do not use the Service to store secrets
  that you are not authorized to possess, or to facilitate illegal activity.

## 4. Acceptable use

You agree not to:

- Use the Service to violate any law or third-party rights.
- Attempt to disrupt or overload the Service (e.g. flooding the CDN with
  requests, attempting to inject or distribute malicious code via forks).
- Misrepresent yourself as the author or operator of the Service.

We may refuse service to anyone violating these terms.

## 5. No warranty — "as is"

THE SERVICE AND SOFTWARE ARE PROVIDED **"AS IS"**, WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND THAT THE SERVICE
WILL BE AVAILABLE, UNINTERRUPTED, OR SECURE.

You use the Service and Software **at your own risk**.

## 6. Limitation of liability

To the maximum extent permitted by law, in no event shall the author
(Rob Lauzon / VibeProSoft), nor any contributor, be liable for any direct,
indirect, incidental, special, consequential, or punitive damages — including
but not limited to loss of data, loss of secrets, loss of profits, business
interruption, or any other commercial damages — arising out of or in
connection with the Service or the Software, even if advised of the
possibility of such damages.

The Service is free; your maximum recoverable damages are limited to what
you paid for the Service, which is **CAD $0**.

## 7. Voluntary donations (Ko-fi)

The Service is and will remain free. You may optionally support its
development through **Ko-fi** (<https://ko-fi.com/roblauzon>). Donations are:

- **Voluntary** — never required to use the Service.
- **Non-refundable** — donations are gifts, not purchases. They do not entitle
  you to support, features, SLAs, or any other consideration.
- **Subject to Ko-fi's terms** — Ko-fi processes payments under its own
  policies (<https://ko-fi.com/manage/policies>). We do not see, store, or
  process your payment details.

## 8. Third-party services we rely on

- **Cloudflare Pages** hosts the Service's static files. Standard CDN access
  logs (your IP address, timestamp, requested file) may be collected by
  Cloudflare under [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/).
- **GitHub** hosts the source code. Visits to the repository are governed by
  [GitHub's privacy policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
- **Ko-fi** processes any donations under its own privacy policy.

We do not control these services. See [`PRIVACY.md`](PRIVACY.md) for what
*we* do (and do not) collect — which is nothing.

## 9. Changes to the Service or these Terms

We may change, suspend, or discontinue the Service at any time, with or
without notice. We may revise these Terms at any time. The most current
version is always in the
[GitHub repository](https://github.com/boblauzon/keyvault-sidekick/blob/master/TERMS.md).
Material changes will be noted in the GitHub release notes. Continued use
after a change constitutes acceptance.

If the Service is ever discontinued, the Software remains available under
the MIT License — you can run it locally from `file://` indefinitely.

## 10. Governing law and disputes

These Terms are governed by the laws of the **Province of Ontario, Canada**,
without regard to conflict-of-laws principles. Any dispute arising out of or
relating to these Terms or the Service shall be brought exclusively in the
courts located in Ontario, Canada.

If any provision of these Terms is found unenforceable, the remaining
provisions remain in effect.

## 11. Contact

Questions about these Terms: **rob.lauzon@vibeprosoft.com**

Security reports: see [`SECURITY.md`](SECURITY.md).
Privacy questions: see [`PRIVACY.md`](PRIVACY.md).
