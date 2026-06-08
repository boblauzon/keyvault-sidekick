// Shared helpers for KeyVault Sidekick Pages Functions.
// Web-Crypto-only, runs on Cloudflare Workers runtime.

// ── Constants ────────────────────────────────────────────────────────────────
// NB: Cloudflare Workers runtime caps PBKDF2 iterations at 100,000.
// The vault's *browser-side* crypto (in app.html) is unaffected — it can use
// 310k. This 100k is for the AUTH password (login + admin-created users), not
// for vault encryption.
export const PBKDF2_ITERATIONS = 100000;
export const SALT_BYTES = 16;
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const INVITE_TTL_SECONDS = 60 * 60 * 24 * 7;   // 7 days
export const SESSION_COOKIE = 'kvs_session';

// ── Encoding ────────────────────────────────────────────────────────────────
const enc = new TextEncoder();
const dec = new TextDecoder();

export function bytesToBase64Url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function bytesToHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

export function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

// ── Password hashing (PBKDF2 + SHA-256) ──────────────────────────────────────
export async function hashPassword(password, salt, iterations) {
  const iter = iterations || PBKDF2_ITERATIONS;
  const material = await crypto.subtle.importKey(
    'raw', enc.encode(password.normalize('NFC')),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
    material, 256
  );
  return new Uint8Array(bits);
}

// Constant-time byte comparison.
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(password, salt, iterations, expectedHashB64) {
  const computed = await hashPassword(password, salt, iterations);
  const expected = base64UrlToBytes(expectedHashB64);
  return timingSafeEqual(computed, expected);
}

// ── Session cookie (HMAC-signed) ─────────────────────────────────────────────
// Format: base64url(payload).base64url(hmac)
// Payload: { uid, role, exp }  (exp = unix seconds)

async function hmacSha256(secret, msg) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return new Uint8Array(sig);
}

export async function signSession(payload, secret) {
  const body = bytesToBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = await hmacSha256(secret, body);
  return body + '.' + bytesToBase64Url(sig);
}

export async function verifySession(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sigStr = token.slice(dot + 1);
  const expectedSig = await hmacSha256(secret, body);
  const providedSig = base64UrlToBytes(sigStr);
  if (!timingSafeEqual(expectedSig, providedSig)) return null;
  let payload;
  try { payload = JSON.parse(dec.decode(base64UrlToBytes(body))); }
  catch { return null; }
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (typeof payload.uid !== 'string' || typeof payload.role !== 'string') return null;
  return payload;
}

export function sessionCookie(token, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    `Path=/`,
    `Max-Age=${maxAgeSeconds}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`
  ];
  return parts.join('; ');
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function parseSessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq < 0) continue;
    if (p.slice(0, eq) === SESSION_COOKIE) return p.slice(eq + 1);
  }
  return null;
}

// ── Invitation tokens ────────────────────────────────────────────────────────
// We send the user a random opaque token; we store SHA-256(token) in D1.
// That way a DB leak doesn't expose live tokens.

export function generateInviteToken() {
  return bytesToBase64Url(randomBytes(32));
}

export async function hashInviteToken(token) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return bytesToHex(new Uint8Array(buf));
}

// ── Response helpers ─────────────────────────────────────────────────────────
export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(init.headers || {}) }
  });
}

export function errorResponse(status, message) {
  return json({ error: message }, { status });
}

// ── Email validation ────────────────────────────────────────────────────────
// Permissive: at least one @, no whitespace, length under 320.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(s) {
  return typeof s === 'string' && s.length > 0 && s.length <= 320 && EMAIL_RE.test(s);
}

export function normalizeEmail(s) {
  return String(s).trim().toLowerCase();
}

// ── UUID (v4) ────────────────────────────────────────────────────────────────
export function uuid() {
  return crypto.randomUUID();
}

// ── Misc ─────────────────────────────────────────────────────────────────────
export function nowISO() {
  return new Date().toISOString();
}

export function unixSeconds() {
  return Math.floor(Date.now() / 1000);
}

// ── Phase 7.5: abuse protection ──────────────────────────────────────────────

export const LOCKOUT_THRESHOLD = 5;             // failed attempts before lockout
export const LOCKOUT_WINDOW_HOURS = 1;          // rolling window for failures
export const LOCKOUT_DURATION_HOURS = 1;        // how long the account stays locked
export const FAILED_LOGIN_RETENTION_HOURS = 24; // cleanup horizon for failed_logins rows

export function getClientIP(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// Origin-based CSRF check for state-changing requests.
// Reject if Origin is present but doesn't match request URL's origin.
// Missing Origin is allowed (e.g. native fetch from same-origin scripts may
// omit it depending on browser); SameSite=Lax + HttpOnly cookies still protect.
export function checkOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    const reqOrigin = new URL(request.url).origin;
    return origin === reqOrigin;
  } catch { return false; }
}

// Try-limit wrapper around a CF Rate Limiter binding.
// Returns null on success, or a Response(429) to return immediately.
export async function tryRateLimit(limiter, key, label) {
  if (!limiter || typeof limiter.limit !== 'function') return null;
  try {
    const r = await limiter.limit({ key });
    if (!r.success) {
      return errorResponse(429, `Too many ${label || 'requests'}. Try again in a moment.`);
    }
  } catch {
    // If the limiter fails, fall open — we'd rather serve the request than 500.
  }
  return null;
}

// ── Audit log ───────────────────────────────────────────────────────────────

export async function recordAuditLog(env, { userId, email, action, details, request }) {
  try {
    const ip = request ? getClientIP(request) : 'unknown';
    const ua = request ? (request.headers.get('User-Agent') || '').slice(0, 256) : null;
    const detailsJson = details ? JSON.stringify(details) : null;
    await env.DB.prepare(`
      INSERT INTO audit_log (id, user_id, email, action, ip, user_agent, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uuid(),
      userId || null,
      email ? normalizeEmail(email) : null,
      action,
      ip,
      ua,
      detailsJson,
      nowISO()
    ).run();
  } catch {
    // Best-effort — audit failures must not block the user-facing request.
  }
}

// ── Failed-login tracking + account lockout ─────────────────────────────────

// Check if an email is currently locked. Returns the unlock_at ISO string if
// locked, or null otherwise. Also cleans up expired locks opportunistically.
export async function getLockoutStatus(env, email) {
  const row = await env.DB.prepare(
    'SELECT email, unlock_at FROM locked_accounts WHERE email = ?'
  ).bind(email).first();
  if (!row) return null;
  if (row.unlock_at < nowISO()) {
    // Expired — clear it.
    await env.DB.prepare('DELETE FROM locked_accounts WHERE email = ?').bind(email).run();
    return null;
  }
  return row.unlock_at;
}

// Record a failed login. If threshold reached in the rolling window, lock the
// account. Returns { locked: true, unlockAt } or { locked: false, attemptsLeft }.
export async function recordFailedLogin(env, email, ip) {
  const ts = nowISO();
  await env.DB.prepare(`
    INSERT INTO failed_logins (id, email, ip, failed_at) VALUES (?, ?, ?, ?)
  `).bind(uuid(), email, ip, ts).run();

  // Count failures in the rolling window
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { count } = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM failed_logins WHERE email = ? AND failed_at >= ?'
  ).bind(email, windowStart).first();

  if (count >= LOCKOUT_THRESHOLD) {
    const unlockAt = new Date(Date.now() + LOCKOUT_DURATION_HOURS * 3600 * 1000).toISOString();
    // Upsert lock row
    await env.DB.prepare(`
      INSERT INTO locked_accounts (email, locked_at, unlock_at, reason)
      VALUES (?, ?, ?, 'too_many_failed_logins')
      ON CONFLICT(email) DO UPDATE SET
        locked_at = excluded.locked_at,
        unlock_at = excluded.unlock_at,
        reason = excluded.reason
    `).bind(email, ts, unlockAt).run();
    return { locked: true, unlockAt };
  }
  return { locked: false, attemptsLeft: LOCKOUT_THRESHOLD - count };
}

// Clear failed-login tracking on success.
export async function clearFailedLogins(env, email) {
  await env.DB.prepare('DELETE FROM failed_logins WHERE email = ?').bind(email).run();
  await env.DB.prepare('DELETE FROM locked_accounts WHERE email = ?').bind(email).run();
}

// ── Password strength ───────────────────────────────────────────────────────
// Require ≥8 chars and at least 3 of 4 character classes.
// Also reject a short list of very-common passwords.

const WEAK_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'qwerty', 'qwerty123',
  '12345678', '123456789', '1234567890', 'iloveyou', 'admin',
  'admin123', 'letmein', 'monkey', 'football', 'baseball',
  'master', 'superman', 'welcome', 'welcome1', 'welcome123',
  'sunshine', 'princess', 'changeme', 'changeme123'
]);

export function checkPasswordStrength(password) {
  if (typeof password !== 'string') return { ok: false, reason: 'Password is required.' };
  if (password.length < 8) return { ok: false, reason: 'Password must be at least 8 characters.' };
  if (password.length > 256) return { ok: false, reason: 'Password is too long.' };
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: 'This password is too common. Choose a different one.' };
  }
  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password)
  ].filter(Boolean).length;
  if (classes < 3) {
    return { ok: false, reason: 'Password must contain at least 3 of: lowercase, uppercase, digits, symbols.' };
  }
  return { ok: true };
}
