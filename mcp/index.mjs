#!/usr/bin/env node
/**
 * keyvault-sidekick-mcp — local MCP server for KeyVault Sidekick.
 *
 * Lets a LOCAL AI agent (Claude Code, Claude Desktop, Cursor, Codex CLI)
 * generate, store, retrieve, and export API keys in a local AES-256-GCM
 * encrypted vault file — the SAME format the browser app uses.
 *
 * Zero dependencies. Node 18+ (built-in WebCrypto + readline only).
 *
 * ── SECURITY MODEL ──────────────────────────────────────────────────────────
 *   - The vault file lives on YOUR machine
 *     (default ~/.keyvault-sidekick/vault.json; override KEYVAULT_VAULT_PATH).
 *     Secrets never touch a network: local file -> this process -> your local
 *     agent. No server, no telemetry, no outbound request.
 *   - The master password comes from the KEYVAULT_PASSWORD env var. It is used
 *     only to derive the AES key (PBKDF2-SHA256, 310k iterations) and is never
 *     written anywhere.
 *   - Crypto is byte-identical to the browser app, so a vault.json written here
 *     imports into https://keyvault-sidekick.pages.dev (Settings -> Import
 *     .vault) and a .vault exported there decrypts here.
 *
 * ── STDIO TRANSPORT ─────────────────────────────────────────────────────────
 *   Newline-delimited JSON-RPC 2.0 on stdin/stdout (the MCP stdio transport).
 *   Diagnostics go to STDERR only — stdout is the protocol channel.
 */

import { webcrypto as wc } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';

const subtle = wc.subtle;

// ── Constants (must match public/app.html VaultCrypto exactly) ───────────────
const PBKDF2_ITERATIONS = 310000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const ALGORITHM = 'AES-GCM';
const KDF_ALGORITHM = 'PBKDF2';
const HASH = 'SHA-256';

const VALID_TYPES = new Set(['api_key', 'secret', 'token', 'oauth', 'webhook', 'other']);
const SERVER_INFO = { name: 'keyvault-sidekick', version: '0.1.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

const VAULT_PATH = process.env.KEYVAULT_VAULT_PATH ||
  join(homedir(), '.keyvault-sidekick', 'vault.json');

// ── Encoding helpers (standard base64, matching btoa/atob) ───────────────────
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

// ── Crypto (mirror of the browser VaultCrypto) ───────────────────────────────
async function deriveKey(password, salt, iterations, hash) {
  const material = await subtle.importKey('raw', enc.encode(password), { name: KDF_ALGORITHM }, false, ['deriveKey']);
  return subtle.deriveKey(
    { name: KDF_ALGORITHM, salt, iterations: iterations || PBKDF2_ITERATIONS, hash: hash || HASH },
    material,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
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
  const plain = await subtle.decrypt({ name: ALGORITHM, iv }, key, cipher);
  return dec.decode(plain);
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
const Generators = {
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

// ── Vault store (lazy load + in-memory cache; one decrypt per session) ────────
let CACHE = null; // { vault, key, salt:Uint8Array, iterations:number }

async function ensureLoaded(forWrite) {
  if (CACHE) return CACHE;
  const password = process.env.KEYVAULT_PASSWORD;
  if (!password) throw new Error('KEYVAULT_PASSWORD is not set. Export your KeyVault master password before the agent calls KeyVault tools.');
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
    // No vault yet and this is a read — return an ephemeral empty view (not cached).
    return { vault: { version: 1, projects: [] }, key: null, salt: null, iterations: PBKDF2_ITERATIONS, ephemeral: true };
  }
  // First write — create a fresh vault.
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
function shellQuote(v) { return "'" + String(v).replace(/'/g, "'\\''") + "'"; }

// ── Tool implementations ─────────────────────────────────────────────────────
async function tool_list_projects() {
  const c = await ensureLoaded(false);
  return {
    vaultPath: VAULT_PATH,
    exists: !c.ephemeral,
    count: c.vault.projects.length,
    projects: c.vault.projects.map(p => ({ id: p.id, name: p.name, keys: p.keys.length, archived: p.archived, updatedAt: p.updatedAt })),
  };
}
async function tool_list_keys(args) {
  const c = await ensureLoaded(false);
  const p = findProject(c.vault, args.project);
  if (!p) throw new Error(`Project not found: ${args.project}`);
  // Names + metadata only — NOT values. Use keyvault_get_key to read a value.
  return {
    project: p.name,
    count: p.keys.length,
    keys: p.keys.map(k => ({ name: k.name, type: k.type, notes: k.notes || undefined, updatedAt: k.updatedAt })),
  };
}
async function tool_get_key(args) {
  if (!args.project || !args.name) throw new Error('project and name are required.');
  const c = await ensureLoaded(false);
  const p = findProject(c.vault, args.project);
  if (!p) throw new Error(`Project not found: ${args.project}`);
  const k = p.keys.find(x => x.name === args.name) || p.keys.find(x => x.name.toLowerCase() === String(args.name).toLowerCase());
  if (!k) throw new Error(`Key not found: ${args.name} in ${p.name}`);
  return { project: p.name, name: k.name, type: k.type, value: k.value, notes: k.notes || undefined };
}
async function tool_save_key(args) {
  if (!args.project || !args.name || args.value == null) throw new Error('project, name, and value are required.');
  const type = VALID_TYPES.has(args.type) ? args.type : 'api_key';
  const notes = typeof args.notes === 'string' ? args.notes : '';
  const c = await ensureLoaded(true);
  let p = findProject(c.vault, args.project);
  let createdProject = false;
  if (!p) {
    p = { id: wc.randomUUID(), name: String(args.project), description: '', color: 'teal', archived: false, keys: [], createdAt: nowISO(), updatedAt: nowISO() };
    c.vault.projects.push(p); createdProject = true;
  }
  const existing = p.keys.find(k => k.name === args.name);
  let action;
  if (existing) {
    existing.value = String(args.value); existing.type = type;
    if (notes) existing.notes = notes; existing.updatedAt = nowISO(); action = 'updated';
  } else {
    p.keys.push({ id: wc.randomUUID(), name: String(args.name), value: String(args.value), type, notes, createdAt: nowISO(), updatedAt: nowISO() });
    action = 'created';
  }
  p.updatedAt = nowISO();
  await persist();
  return { ok: true, action, project: p.name, key: String(args.name), type, createdProject, vaultPath: VAULT_PATH };
}
async function tool_delete_key(args) {
  if (!args.project || !args.name) throw new Error('project and name are required.');
  const c = await ensureLoaded(true);
  const p = findProject(c.vault, args.project);
  if (!p) throw new Error(`Project not found: ${args.project}`);
  const before = p.keys.length;
  p.keys = p.keys.filter(k => k.name !== args.name);
  if (p.keys.length === before) throw new Error(`Key not found: ${args.name} in ${p.name}`);
  p.updatedAt = nowISO();
  await persist();
  return { ok: true, deleted: args.name, project: p.name };
}
async function tool_create_project(args) {
  if (!args.name) throw new Error('name is required.');
  const c = await ensureLoaded(true);
  if (findProject(c.vault, args.name)) throw new Error(`A project named "${args.name}" already exists.`);
  const p = { id: wc.randomUUID(), name: String(args.name), description: String(args.description || ''), color: String(args.color || 'teal'), archived: false, keys: [], createdAt: nowISO(), updatedAt: nowISO() };
  c.vault.projects.push(p);
  await persist();
  return { ok: true, project: p.name, id: p.id };
}
async function tool_generate(args) {
  const type = args.type || 'password';
  let value;
  switch (type) {
    case 'jwt': value = Generators.jwt(args.bits || 256); break;
    case 'uuid': value = Generators.uuid(); break;
    case 'hex': value = Generators.hex(args.bytes || 32); break;
    case 'base64': value = Generators.base64(args.bytes || 32); break;
    case 'apiKey': case 'api_key': value = Generators.apiKey(args.prefix || 'sk-', args.length || 40); break;
    case 'password': value = Generators.password(args.length || 24, args); break;
    default: throw new Error(`Unknown generator type: ${type} (use jwt|uuid|hex|base64|apiKey|password).`);
  }
  if (args.save) {
    if (!args.project || !args.name) throw new Error('To save a generated value, project and name are required.');
    const saved = await tool_save_key({ project: args.project, name: args.name, value, type: args.keyType || GEN_DEFAULT_TYPE[type] || 'secret', notes: args.notes });
    return { generated: true, type, value, saved };
  }
  return { generated: true, type, value, saved: false };
}
async function tool_export_env(args) {
  if (!args.project) throw new Error('project is required.');
  const c = await ensureLoaded(false);
  const p = findProject(c.vault, args.project);
  if (!p) throw new Error(`Project not found: ${args.project}`);
  const fmt = args.format || 'env';
  let text;
  if (fmt === 'envrc') text = p.keys.map(k => `export ${k.name}=${shellQuote(k.value)}`).join('\n');
  else if (fmt === 'settings') text = JSON.stringify({ env: Object.fromEntries(p.keys.map(k => [k.name, k.value])) }, null, 2);
  else text = p.keys.map(k => `${k.name}=${shellQuote(k.value)}`).join('\n');
  return { project: p.name, format: fmt, keys: p.keys.length, content: text };
}

// ── Tool definitions ─────────────────────────────────────────────────────────
const TOOL_DEFS = [
  { name: 'keyvault_list_projects', description: 'List every project in the local KeyVault vault with its key count. Use first to see what exists. Returns names + ids only, no secret values.', inputSchema: { type: 'object', properties: {} } },
  { name: 'keyvault_list_keys', description: 'List the key NAMES (and type/notes, NOT values) in a project. Use to discover what is stored before reading a value with keyvault_get_key.', inputSchema: { type: 'object', required: ['project'], properties: { project: { type: 'string', description: 'Project name or id (fuzzy-matched).' } } } },
  { name: 'keyvault_get_key', description: 'Read the plaintext VALUE of one stored key so you can use it (put it in an .env, call an API, etc.). Only call when you actually need to use the secret.', inputSchema: { type: 'object', required: ['project', 'name'], properties: { project: { type: 'string' }, name: { type: 'string', description: 'Exact key name, e.g. STRIPE_API_KEY.' } } } },
  { name: 'keyvault_save_key', description: 'Store (or update) a secret in the vault. Creates the project if it does not exist. Use this after fetching/creating a key from another tool (Stripe, Cloudflare, etc.) so it is saved encrypted on disk. Re-saving an existing name updates its value.', inputSchema: { type: 'object', required: ['project', 'name', 'value'], properties: { project: { type: 'string', description: 'Project name (created if missing).' }, name: { type: 'string', description: 'Key name, e.g. STRIPE_API_KEY.' }, value: { type: 'string', description: 'The secret value.' }, type: { type: 'string', enum: ['api_key', 'secret', 'token', 'oauth', 'webhook', 'other'], description: 'Default api_key.' }, notes: { type: 'string', description: 'Optional note (e.g. scope, env).' } } } },
  { name: 'keyvault_generate', description: 'Generate a cryptographically-strong value (jwt secret, uuid, random hex/base64, api key pattern, password). Optionally save it to a project in one step with save=true + project + name.', inputSchema: { type: 'object', required: ['type'], properties: { type: { type: 'string', enum: ['jwt', 'uuid', 'hex', 'base64', 'apiKey', 'password'], description: 'What to generate.' }, bits: { type: 'number', description: 'jwt: bit length (default 256).' }, bytes: { type: 'number', description: 'hex/base64: byte length (default 32).' }, length: { type: 'number', description: 'apiKey body / password length (default 40 / 24).' }, prefix: { type: 'string', description: 'apiKey prefix (default sk-).' }, save: { type: 'boolean', description: 'Save the generated value to the vault.' }, project: { type: 'string' }, name: { type: 'string' }, notes: { type: 'string' } } } },
  { name: 'keyvault_export_env', description: 'Export all keys in a project as a ready-to-paste block: .env (KEY="value"), .envrc (export KEY=...), or settings (Claude Code env JSON). Values are POSIX shell-quoted.', inputSchema: { type: 'object', required: ['project'], properties: { project: { type: 'string' }, format: { type: 'string', enum: ['env', 'envrc', 'settings'], description: 'Default env.' } } } },
  { name: 'keyvault_create_project', description: 'Create an empty project. Usually unnecessary — keyvault_save_key auto-creates projects — but available for organizing ahead of time.', inputSchema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' }, color: { type: 'string' } } } },
  { name: 'keyvault_delete_key', description: 'Permanently delete a key from a project. Irreversible.', inputSchema: { type: 'object', required: ['project', 'name'], properties: { project: { type: 'string' }, name: { type: 'string' } } } },
];

async function callTool(params) {
  const name = params?.name;
  const args = params?.arguments || {};
  try {
    let data;
    switch (name) {
      case 'keyvault_list_projects': data = await tool_list_projects(args); break;
      case 'keyvault_list_keys':     data = await tool_list_keys(args); break;
      case 'keyvault_get_key':       data = await tool_get_key(args); break;
      case 'keyvault_save_key':      data = await tool_save_key(args); break;
      case 'keyvault_generate':      data = await tool_generate(args); break;
      case 'keyvault_export_env':    data = await tool_export_env(args); break;
      case 'keyvault_create_project':data = await tool_create_project(args); break;
      case 'keyvault_delete_key':    data = await tool_delete_key(args); break;
      default: throw new Error(`Unknown tool: ${name}`);
    }
    return { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
  } catch (e) {
    // Tool-level error → return as MCP tool error so the agent can react.
    return { content: [{ type: 'text', text: 'Error: ' + String(e?.message || e) }], isError: true };
  }
}

// ── JSON-RPC stdio loop ──────────────────────────────────────────────────────
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

async function handle(req) {
  const id = Object.prototype.hasOwnProperty.call(req, 'id') ? req.id : null;
  const isNotification = id === null || id === undefined;
  try {
    switch (req.method) {
      case 'initialize':
        return send({ jsonrpc: '2.0', id, result: {
          protocolVersion: req.params?.protocolVersion || DEFAULT_PROTOCOL,
          serverInfo: SERVER_INFO,
          capabilities: { tools: { listChanged: false } },
        } });
      case 'initialized':
      case 'notifications/initialized':
        return; // notification — no response
      case 'ping':
        return send({ jsonrpc: '2.0', id, result: {} });
      case 'tools/list':
        return send({ jsonrpc: '2.0', id, result: { tools: TOOL_DEFS } });
      case 'tools/call':
        return send({ jsonrpc: '2.0', id, result: await callTool(req.params || {}) });
      case 'resources/list':
        return send({ jsonrpc: '2.0', id, result: { resources: [] } });
      case 'prompts/list':
        return send({ jsonrpc: '2.0', id, result: { prompts: [] } });
      default:
        if (isNotification) return;
        return send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${req.method}` } });
    }
  } catch (e) {
    if (isNotification) return;
    send({ jsonrpc: '2.0', id, error: { code: -32603, message: String(e?.message || e) } });
  }
}

// Serialize all requests through a single promise chain. MCP clients normally
// send one request at a time, but serializing guarantees that mutating ops
// (save/delete) never race each other or interleave their persist() writes,
// and that a read always sees the result of a prior write.
let chain = Promise.resolve();
const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const t = line.trim();
  if (!t) return;
  let req;
  try { req = JSON.parse(t); } catch { return; } // ignore non-JSON noise
  if (req && req.jsonrpc === '2.0' && typeof req.method === 'string') {
    chain = chain.then(() => handle(req)).catch((e) => {
      process.stderr.write('[handler] ' + String(e?.message || e) + '\n');
    });
  }
});
process.stderr.write(`keyvault-sidekick-mcp v${SERVER_INFO.version} ready — vault: ${VAULT_PATH}\n`);
