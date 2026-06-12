/**
 * vault-core.mjs — shared crypto + vault + operations for KeyVault Sidekick's
 * local tools. Imported by BOTH the MCP server (index.mjs) and the CLI (cli.mjs)
 * so there is exactly ONE crypto implementation to audit.
 *
 * Crypto is byte-identical to the browser app (public/app.html VaultCrypto):
 * PBKDF2-SHA256 310k -> AES-256-GCM, standard base64, NFC password, blob
 * { version, kdf:{algorithm,hash,iterations,salt}, cipher:{algorithm,iv,ciphertext} }.
 *
 * Zero dependencies — Node 18+ built-ins only.
 */

import { webcrypto as wc } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const subtle = wc.subtle;

// ── Constants (must match public/app.html VaultCrypto exactly) ───────────────
export const PBKDF2_ITERATIONS = 310000;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;
export const KEY_LENGTH = 256;
export const ALGORITHM = 'AES-GCM';
export const KDF_ALGORITHM = 'PBKDF2';
export const HASH = 'SHA-256';
export const VALID_TYPES = new Set(['api_key', 'secret', 'token', 'oauth', 'webhook', 'other']);

export const VAULT_PATH = process.env.KEYVAULT_VAULT_PATH ||
  join(homedir(), '.keyvault-sidekick', 'vault.json');

// ── Encoding (standard base64, matching btoa/atob) ───────────────────────────
const enc = new TextEncoder();
const dec = new TextDecoder();
function randBytes(n) { const a = new Uint8Array(n); wc.getRandomValues(a); return a; }
function toBase64(bytes) { return Buffer.from(bytes).toString('base64'); }
function fromBase64(b64) { return new Uint8Array(Buffer.from(String(b64), 'base64')); }
function toHex(bytes) { return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''); }
function toBase64Url(bytes) { return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function nowISO() { return new Date().toISOString(); }
function normalizePassword(pw) {
  if (typeof pw !== 'string') throw new Error('Password must be text.');
  const n = pw.normalize('NFC');
  if (n.trim().length === 0) throw new Error('KEYVAULT_PASSWORD cannot be empty or whitespace only.');
  return n;
}

// ── Crypto ───────────────────────────────────────────────────────────────────
async function deriveKey(password, salt, iterations, hash) {
  const material = await subtle.importKey('raw', enc.encode(password), { name: KDF_ALGORITHM }, false, ['deriveKey']);
  return subtle.deriveKey(
    { name: KDF_ALGORITHM, salt, iterations: iterations || PBKDF2_ITERATIONS, hash: hash || HASH },
    material, { name: ALGORITHM, length: KEY_LENGTH }, false, ['encrypt', 'decrypt']
  );
}
async function encrypt(plaintext, key) {
  const iv = randBytes(IV_LENGTH);
  const cipher = await subtle.encrypt({ name: ALGORITHM, iv }, key, enc.encode(plaintext));
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(cipher)) };
}
async function decrypt(payload, key) {
  const iv = fromBase64(payload.iv);
  const cipher = fromBase64(payload.ciphertext);
  return dec.decode(await subtle.decrypt({ name: ALGORITHM, iv }, key, cipher));
}

// ── Blob + vault validation (mirror of the browser) ──────────────────────────
function validateBlob(blob) {
  const fail = (r) => { throw new Error('Vault file is corrupt: ' + r + '.'); };
  if (!blob || typeof blob !== 'object') fail('not an object');
  if (blob.version !== 1) throw new Error('Unsupported vault version: ' + blob.version + '.');
  if (!blob.kdf || typeof blob.kdf !== 'object') fail('missing kdf section');
  if (blob.kdf.algorithm !== KDF_ALGORITHM) fail('unsupported kdf algorithm ' + blob.kdf.algorithm);
  if (typeof blob.kdf.iterations !== 'number' || blob.kdf.iterations < 1000) fail('invalid kdf iterations');
  if (typeof blob.kdf.hash !== 'string') fail('missing kdf hash');
  if (typeof blob.kdf.salt !== 'string') fail('missing kdf salt');
  if (!blob.cipher || typeof blob.cipher !== 'object') fail('missing cipher section');
  if (blob.cipher.algorithm !== ALGORITHM) fail('unsupported cipher algorithm ' + blob.cipher.algorithm);
  if (typeof blob.cipher.iv !== 'string') fail('missing cipher iv');
  if (typeof blob.cipher.ciphertext !== 'string') fail('missing ciphertext');
}
function normalizeVault(vault) {
  if (!vault || typeof vault !== 'object') throw new Error('Decrypted vault is not an object.');
  if (vault.version !== 1) throw new Error('Unsupported decrypted vault version: ' + vault.version + '.');
  if (!Array.isArray(vault.projects)) vault.projects = [];
  vault.projects = vault.projects.filter(p => p && typeof p === 'object' && typeof p.id === 'string' && p.id);
  for (const p of vault.projects) {
    if (typeof p.name !== 'string') p.name = 'Untitled';
    if (typeof p.color !== 'string') p.color = 'teal';
    if (typeof p.description !== 'string') p.description = '';
    if (typeof p.archived !== 'boolean') p.archived = false;
    if (typeof p.createdAt !== 'string') p.createdAt = nowISO();
    if (typeof p.updatedAt !== 'string') p.updatedAt = nowISO();
    if (!Array.isArray(p.keys)) p.keys = [];
    p.keys = p.keys.filter(k => k && typeof k === 'object' && typeof k.id === 'string' && k.id && typeof k.name === 'string' && k.name && typeof k.value === 'string');
    for (const k of p.keys) {
      if (!VALID_TYPES.has(k.type)) k.type = 'other';
      if (typeof k.notes !== 'string') k.notes = '';
      if (typeof k.createdAt !== 'string') k.createdAt = nowISO();
      if (typeof k.updatedAt !== 'string') k.updatedAt = nowISO();
    }
  }
  return vault;
}

// ── Generators (port of the browser Generators module) ───────────────────────
function randomFromCharset(charset, length) {
  const L = charset.length;
  if (L === 0) throw new Error('Empty charset.');
  const cutoff = Math.floor(256 / L) * L; // reject bytes >= cutoff to kill modulo bias
  const out = [];
  while (out.length < length) {
    const buf = randBytes(Math.max(16, (length - out.length) * 2));
    for (let i = 0; i < buf.length && out.length < length; i++) {
      if (buf[i] < cutoff) out.push(charset[buf[i] % L]);
    }
  }
  return out.join('');
}
export const Generators = {
  jwt(bits = 256) { return toHex(randBytes(Math.max(1, Math.floor(bits / 8)))); },
  uuid() { return wc.randomUUID(); },
  hex(bytes = 32) { return toHex(randBytes(bytes)); },
  base64(bytes = 32) { return toBase64Url(randBytes(bytes)); },
  apiKey(prefix = 'sk-', length = 40) {
    return String(prefix) + randomFromCharset('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', length);
  },
  password(length = 24, opts = {}) {
    let cs = '';
    if (opts.lowercase !== false) cs += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.uppercase !== false) cs += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.digits !== false) cs += '0123456789';
    if (opts.symbols !== false) cs += '!@#$%^&*()-_=+[]{}<>?,.;:';
    if (!cs) throw new Error('Pick at least one character class.');
    return randomFromCharset(cs, length);
  },
};
const GEN_DEFAULT_TYPE = { jwt: 'secret', uuid: 'token', hex: 'secret', base64: 'token', apiKey: 'api_key', api_key: 'api_key', password: 'secret' };

// ── Vault store (lazy load + in-memory cache; one decrypt per process) ───────
let CACHE = null; // { vault, key, salt:Uint8Array, iterations }

async function ensureLoaded(forWrite) {
  if (CACHE) return CACHE;
  const password = process.env.KEYVAULT_PASSWORD;
  if (!password) throw new Error('KEYVAULT_PASSWORD is not set. Export your KeyVault master password first.');
  const norm = normalizePassword(password);

  if (existsSync(VAULT_PATH)) {
    let blob;
    try { blob = JSON.parse(readFileSync(VAULT_PATH, 'utf8')); }
    catch { throw new Error('Vault file is not valid JSON: ' + VAULT_PATH); }
    validateBlob(blob);
    const salt = fromBase64(blob.kdf.salt);
    const iterations = blob.kdf.iterations;
    const key = await deriveKey(norm, salt, iterations, blob.kdf.hash);
    let vault;
    try { vault = JSON.parse(await decrypt(blob.cipher, key)); }
    catch (e) {
      if (e && e.name === 'OperationError') throw new Error('Incorrect master password — KEYVAULT_PASSWORD does not match this vault.');
      throw new Error('Vault is corrupt or unreadable: ' + (e?.message || e));
    }
    CACHE = { vault: normalizeVault(vault), key, salt, iterations };
    return CACHE;
  }
  if (!forWrite) {
    return { vault: { version: 1, projects: [] }, key: null, salt: null, iterations: PBKDF2_ITERATIONS, ephemeral: true };
  }
  const salt = randBytes(SALT_LENGTH);
  const key = await deriveKey(norm, salt, PBKDF2_ITERATIONS, HASH);
  CACHE = { vault: { version: 1, projects: [] }, key, salt, iterations: PBKDF2_ITERATIONS };
  return CACHE;
}

async function persist() {
  if (!CACHE || !CACHE.key) throw new Error('Cannot persist: vault not loaded for writing.');
  const { iv, ciphertext } = await encrypt(JSON.stringify(CACHE.vault), CACHE.key);
  const blob = {
    version: 1,
    kdf: { algorithm: KDF_ALGORITHM, hash: HASH, iterations: CACHE.iterations, salt: toBase64(CACHE.salt) },
    cipher: { algorithm: ALGORITHM, iv, ciphertext },
    updatedAt: nowISO(),
  };
  mkdirSync(dirname(VAULT_PATH), { recursive: true });
  writeFileSync(VAULT_PATH, JSON.stringify(blob), { mode: 0o600 });
  try { chmodSync(VAULT_PATH, 0o600); } catch { /* non-POSIX */ }
}

function findProject(vault, ref) {
  if (!ref) return null;
  const s = String(ref);
  return vault.projects.find(p => p.id === s)
    || vault.projects.find(p => p.name.toLowerCase() === s.toLowerCase())
    || vault.projects.find(p => p.name.toLowerCase().includes(s.toLowerCase()))
    || null;
}
export function shellQuote(v) { return "'" + String(v).replace(/'/g, "'\\''") + "'"; }

// ── Operations (shared by the MCP tools and the CLI) ─────────────────────────
export async function listProjects() {
  const c = await ensureLoaded(false);
  return {
    vaultPath: VAULT_PATH, exists: !c.ephemeral, count: c.vault.projects.length,
    projects: c.vault.projects.map(p => ({ id: p.id, name: p.name, keys: p.keys.length, archived: p.archived, updatedAt: p.updatedAt })),
  };
}
export async function listKeys(project) {
  const c = await ensureLoaded(false);
  const p = findProject(c.vault, project);
  if (!p) throw new Error(`Project not found: ${project}`);
  return { project: p.name, count: p.keys.length, keys: p.keys.map(k => ({ name: k.name, type: k.type, notes: k.notes || undefined, updatedAt: k.updatedAt })) };
}
export async function getKey(project, name) {
  if (!project || !name) throw new Error('project and name are required.');
  const c = await ensureLoaded(false);
  const p = findProject(c.vault, project);
  if (!p) throw new Error(`Project not found: ${project}`);
  const k = p.keys.find(x => x.name === name) || p.keys.find(x => x.name.toLowerCase() === String(name).toLowerCase());
  if (!k) throw new Error(`Key not found: ${name} in ${p.name}`);
  return { project: p.name, name: k.name, type: k.type, value: k.value, notes: k.notes || undefined };
}
export async function saveKey({ project, name, value, type, notes }) {
  if (!project || !name || value == null) throw new Error('project, name, and value are required.');
  const t = VALID_TYPES.has(type) ? type : 'api_key';
  const n = typeof notes === 'string' ? notes : '';
  const c = await ensureLoaded(true);
  let p = findProject(c.vault, project);
  let createdProject = false;
  if (!p) {
    p = { id: wc.randomUUID(), name: String(project), description: '', color: 'teal', archived: false, keys: [], createdAt: nowISO(), updatedAt: nowISO() };
    c.vault.projects.push(p); createdProject = true;
  }
  const existing = p.keys.find(k => k.name === name);
  let action;
  if (existing) { existing.value = String(value); existing.type = t; if (n) existing.notes = n; existing.updatedAt = nowISO(); action = 'updated'; }
  else { p.keys.push({ id: wc.randomUUID(), name: String(name), value: String(value), type: t, notes: n, createdAt: nowISO(), updatedAt: nowISO() }); action = 'created'; }
  p.updatedAt = nowISO();
  await persist();
  return { ok: true, action, project: p.name, key: String(name), type: t, createdProject, vaultPath: VAULT_PATH };
}
export async function deleteKey(project, name) {
  if (!project || !name) throw new Error('project and name are required.');
  const c = await ensureLoaded(true);
  const p = findProject(c.vault, project);
  if (!p) throw new Error(`Project not found: ${project}`);
  const before = p.keys.length;
  p.keys = p.keys.filter(k => k.name !== name);
  if (p.keys.length === before) throw new Error(`Key not found: ${name} in ${p.name}`);
  p.updatedAt = nowISO();
  await persist();
  return { ok: true, deleted: name, project: p.name };
}
export async function createProject({ name, description, color }) {
  if (!name) throw new Error('name is required.');
  const c = await ensureLoaded(true);
  if (findProject(c.vault, name)) throw new Error(`A project named "${name}" already exists.`);
  const p = { id: wc.randomUUID(), name: String(name), description: String(description || ''), color: String(color || 'teal'), archived: false, keys: [], createdAt: nowISO(), updatedAt: nowISO() };
  c.vault.projects.push(p);
  await persist();
  return { ok: true, project: p.name, id: p.id };
}
export function generateValue(type, opts = {}) {
  switch (type) {
    case 'jwt': return Generators.jwt(opts.bits || 256);
    case 'uuid': return Generators.uuid();
    case 'hex': return Generators.hex(opts.bytes || 32);
    case 'base64': return Generators.base64(opts.bytes || 32);
    case 'apiKey': case 'api_key': return Generators.apiKey(opts.prefix || 'sk-', opts.length || 40);
    case 'password': return Generators.password(opts.length || 24, opts);
    default: throw new Error(`Unknown generator type: ${type} (use jwt|uuid|hex|base64|apiKey|password).`);
  }
}
export async function generate(args) {
  const type = args.type || 'password';
  const value = generateValue(type, args);
  if (args.save) {
    if (!args.project || !args.name) throw new Error('To save a generated value, project and name are required.');
    const saved = await saveKey({ project: args.project, name: args.name, value, type: args.keyType || GEN_DEFAULT_TYPE[type] || 'secret', notes: args.notes });
    return { generated: true, type, value, saved };
  }
  return { generated: true, type, value, saved: false };
}
export async function exportEnv(project, format = 'env') {
  if (!project) throw new Error('project is required.');
  const c = await ensureLoaded(false);
  const p = findProject(c.vault, project);
  if (!p) throw new Error(`Project not found: ${project}`);
  let text;
  if (format === 'envrc') text = p.keys.map(k => `export ${k.name}=${shellQuote(k.value)}`).join('\n');
  else if (format === 'settings') text = JSON.stringify({ env: Object.fromEntries(p.keys.map(k => [k.name, k.value])) }, null, 2);
  else text = p.keys.map(k => `${k.name}=${shellQuote(k.value)}`).join('\n');
  return { project: p.name, format, keys: p.keys.length, content: text };
}
