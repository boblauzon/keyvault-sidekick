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
