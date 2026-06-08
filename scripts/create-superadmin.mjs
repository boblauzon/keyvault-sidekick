#!/usr/bin/env node
// Bootstrap the first superadmin via direct D1 SQL.
// Usage:
//   node scripts/create-superadmin.mjs <email> <password>
// or set EMAIL + PASSWORD env vars.
//
// Calls `wrangler d1 execute` so it uses your already-authenticated CF account.
// Runs against the REMOTE D1 instance.

import { execSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { webcrypto } from 'node:crypto';
import { randomUUID } from 'node:crypto';

const DB_NAME = 'keyvault-sidekick-db';
// CF Workers PBKDF2 caps at 100,000 — must match server-side _lib.js for the
// password to verify on login.
const PBKDF2_ITERATIONS = 100000;

const args = process.argv.slice(2);
const email = (args[0] || process.env.EMAIL || '').trim().toLowerCase();
const password = args[1] || process.env.PASSWORD || '';

if (!email || !password) {
  console.error('Usage: node scripts/create-superadmin.mjs <email> <password>');
  console.error('   OR  EMAIL=... PASSWORD=... node scripts/create-superadmin.mjs');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const enc = new TextEncoder();

function bytesToBase64Url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return Buffer.from(s, 'binary').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function pbkdf2(password, salt, iterations) {
  const key = await webcrypto.subtle.importKey(
    'raw', enc.encode(password.normalize('NFC')),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key, 256
  );
  return new Uint8Array(bits);
}

const salt = randomBytes(16);
const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
const id = randomUUID();
const ts = new Date().toISOString();

const sql = `INSERT INTO users (id, email, password_hash, salt, iterations, role, status, created_at) VALUES ('${id}', '${email}', '${bytesToBase64Url(hash)}', '${bytesToBase64Url(salt)}', ${PBKDF2_ITERATIONS}, 'superadmin', 'active', '${ts}');`;

console.log(`Creating superadmin: ${email}`);
console.log(`  id: ${id}`);
console.log(`  iterations: ${PBKDF2_ITERATIONS}`);
console.log(`  status: active`);
console.log('Running migration against remote D1...');

// Write the SQL to a tempfile and use --file (avoids shell quoting issues)
const tmpFile = `.tmp-superadmin-${Date.now()}.sql`;
const fs = await import('node:fs');
fs.writeFileSync(tmpFile, sql + '\n');

try {
  const out = execSync(
    `npx wrangler d1 execute ${DB_NAME} --remote --file=${tmpFile}`,
    { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] }
  );
  console.log(out);
  console.log(`✅ Superadmin created. Log in at /login with ${email}.`);
} catch (err) {
  const msg = String(err.stderr || err.message || err);
  if (msg.includes('UNIQUE constraint failed')) {
    console.error(`❌ A user with email "${email}" already exists.`);
    process.exit(2);
  }
  console.error('❌ Failed to create superadmin:');
  console.error(msg);
  process.exit(1);
} finally {
  try { fs.unlinkSync(tmpFile); } catch {}
}
