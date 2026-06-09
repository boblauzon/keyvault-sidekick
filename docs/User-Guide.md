# KeyVault Sidekick: User Guide & Security Architecture

Welcome to **KeyVault Sidekick**! This guide explains how to use the vault—specifically tailored for developers using **Claude Code**—and provides a deep dive into the security architecture that keeps your secrets safe.

---

## 1. What is KeyVault Sidekick?

KeyVault Sidekick is a highly secure, client-side encrypted secrets vault. It is built to solve a specific problem for developers: keeping API keys, database credentials, and generated secrets organized without pasting them into chat interfaces or storing them in plaintext on third-party servers.

### The Two Layers of Protection

KeyVault Sidekick uses a dual-layer security model. It is important to understand the difference between your two passwords:

1. **Account Password (The Gatekeeper):** This is used to log in to the application. It verifies your identity with the server and ensures only authorized, invited users can load the vault application.
2. **Master Password (The Vault Key):** This password is **never sent to the server**. It is used locally in your browser to encrypt and decrypt your actual secrets. If you lose this password, your vault data cannot be recovered by anyone—not even the server administrator.

---

## 2. Step-by-Step Workflow: Using KeyVault with Claude Code

The primary integration with Claude Code is the **Prefill Hook**. This allows Claude to generate a key (like a Stripe or Cloudflare API key) and securely pass it to your vault without the secret ever touching the Claude chat history or KeyVault's backend servers.

### The Workflow

**Step 1: Ask Claude to generate a key**
In your terminal using Claude Code, you might say:
> *"Create a Stripe restricted API key for my billing project and save it to my vault."*

**Step 2: Claude executes the request**
Claude uses its tools (MCP) to interact with Stripe and generate the key.

**Step 3: Claude opens KeyVault Sidekick**
Instead of pasting the key back to you in the terminal, Claude automatically opens a specific URL in your browser. It looks like this:
`https://keyvault-sidekick.pages.dev/#action=prefill&name=STRIPE_KEY&value=rk_live_123...&project=Billing`

**Step 4: Authentication & Unlocking**
- If you are not logged in, you will be prompted for your **Account Password**.
- Once logged in (or if you already were), you will be prompted for your **Master Password** to unlock the local vault.

**Step 5: Review and Save**
A "Save key from Claude" modal will automatically appear. The Key Name, Value, and Project will be pre-filled. You simply review the details and click **Save**. 

**Step 6: Export to your workspace**
When you are ready to code, you can use KeyVault Sidekick to export your project's keys as a `.env` file, `.envrc`, or a `settings.json` block, ready to be used in your local development environment.

---

## 3. How the Integration Works (Simplified)

You might wonder: *"If Claude sends the URL to the browser, doesn't the server see the secret?"*

**No, it does not.** 

The integration relies on a clever standard of how web browsers work. Notice the `#` (hash/fragment) in the URL:
`.../#action=prefill&value=rk_live_123...`

1. **Browser Rules:** When your browser requests a webpage, it **never** sends anything after the `#` to the server. The secret is sent only to the browser program itself.
2. **Memory Storage:** As soon as KeyVault Sidekick loads, it immediately reads the fragment, hides it from the address bar, and temporarily stores it in your browser's short-term memory (`sessionStorage`).
3. **Safe Transfer:** Once you unlock the vault, the app retrieves the secret from short-term memory, encrypts it using your Master Password, and saves it.

This means your secret moves from Claude Code directly to your browser's encrypted storage without ever touching a backend server.

---

## 4. Technical Depth: Security Architecture

For those who want to know exactly how their data is protected, here is the technical breakdown of KeyVault Sidekick's security model.

### 4.1. Zero-Knowledge Local Encryption (The Vault)
Your actual secrets (API keys, passwords, notes) are encrypted at rest in your browser's `localStorage`.
- **Encryption Algorithm:** AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode), the industry standard for secure data.
- **Key Derivation:** Your Master Password is run through PBKDF2 (Password-Based Key Derivation Function 2) with 310,000 iterations using SHA-256 and a random 16-byte salt. This makes brute-force attacks extremely slow and computationally expensive.
- **Zero Backend Exposure:** The encryption, decryption, and key derivation happen entirely via the native **Web Crypto API** in your browser. The plaintext secrets and your Master Password never leave your device. 

### 4.2. Server-Side Security (Auth & Abuse Protection)
While the vault data is local, the application delivery and user access are protected by a robust backend (Cloudflare Pages + D1 Database).
- **Session Security:** Authentication uses HMAC-SHA-256 session cookies that are `HttpOnly` (inaccessible to JavaScript), `Secure` (HTTPS only), and `SameSite=Lax`.
- **Cross-Site Request Forgery (CSRF):** Defense-in-depth is achieved by enforcing strict `Origin` header checks on all mutating API requests (POST/PATCH/DELETE).
- **Rate Limiting:** Cloudflare bindings protect against brute force attacks. Login attempts are limited to 5 per minute per IP. Admin actions are strictly rate-limited.
- **Account Lockout:** 5 failed logins within an hour will lock an account for 1 hour, backed by the D1 database.
- **Audit Logging:** Every sensitive action (logins, password changes, admin actions) is immutably logged with IP, User Agent, and timestamp data.

### 4.3. Application Hardening
- **Content Security Policy (CSP):** The application uses strict CSP headers (`connect-src 'self'`) ensuring that the app can only talk to its own authentication API. It physically cannot send your decrypted secrets to a third-party server.
- **Data Integrity:** The GitHub release includes the SHA-256 hash of the exact HTML file. You can verify that the code running on the Cloudflare CDN is the exact code audited in the repository.
- **Secure Memory Handling:** Unlocked keys live only in standard JavaScript memory and are cleared when the vault locks (via idle timeout or tab close). The app also features automatic clipboard clearing 30 seconds after you copy a secret.

### Threat Model Summary
| Threat | Mitigation |
| :--- | :--- |
| **Server Database Compromise** | The server only holds auth data. Your vault is not there. |
| **Network Intercept (Man-in-the-Middle)** | TLS encryption + CSP blocks outbound exfiltration. URL fragments are not transmitted. |
| **Stolen Device/Backup File** | Protected by AES-256-GCM and PBKDF2 (310k iterations). Safe as long as your Master Password is strong. |
| **Malicious Scripts (XSS)** | Blocked by strict Content Security Policy. |
| **Brute Force Login** | Protected by rate limiting and 1-hour account lockouts. |