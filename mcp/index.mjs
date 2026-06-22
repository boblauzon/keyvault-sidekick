#!/usr/bin/env node
/**
 * keyvault-sidekick-mcp — local MCP server for KeyVault Sidekick.
 *
 * Lets a LOCAL AI agent (Claude Code, Claude Desktop, Cursor, Codex CLI)
 * generate, store, retrieve, and export API keys in a local AES-256-GCM
 * encrypted vault file — the SAME format the browser app uses.
 *
 * Crypto + vault logic live in ./vault-core.mjs (shared with the `keyvault`
 * CLI in ./cli.mjs). This file is just the MCP stdio transport + tool schemas.
 *
 * Zero dependencies. Node 18+. Newline-delimited JSON-RPC 2.0 on stdin/stdout;
 * diagnostics to STDERR only (stdout is the protocol channel).
 *
 * SECURITY: the vault file is on YOUR machine (default
 * ~/.keyvault-sidekick/vault.json; override KEYVAULT_VAULT_PATH). The master
 * password comes from KEYVAULT_PASSWORD and is used only to derive the AES key.
 * No network, no telemetry.
 *
 * NOTE ON TRANSCRIPT EXPOSURE: keyvault_get_key / keyvault_generate /
 * keyvault_export_env return secret VALUES to the agent, which puts them in the
 * conversation. To deploy a secret WITHOUT it passing through the chat, use the
 * `keyvault` CLI instead and pipe it, e.g.
 *   keyvault get MyProject STRIPE_KEY | wrangler secret put STRIPE_KEY
 */

import { createInterface } from 'node:readline';
import {
  VALID_TYPES, VAULT_PATH,
  listProjects, listKeys, getKey, saveKey, generate, exportEnv, createProject, deleteKey, status,
} from './vault-core.mjs';

const SERVER_INFO = { name: 'keyvault-sidekick', version: '0.2.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

// ── Tool definitions ─────────────────────────────────────────────────────────
const TOOL_DEFS = [
  { name: 'keyvault_list_projects', description: 'List every project in the local KeyVault vault with its key count. Use first to see what exists. Returns names + ids only, no secret values.', inputSchema: { type: 'object', properties: {} } },
  { name: 'keyvault_list_keys', description: 'List the key NAMES (and type/notes, NOT values) in a project. Use to discover what is stored before reading a value with keyvault_get_key.', inputSchema: { type: 'object', required: ['project'], properties: { project: { type: 'string', description: 'Project name or id (fuzzy-matched).' } } } },
  { name: 'keyvault_get_key', description: 'Read the plaintext VALUE of one stored key so you can use it (put it in an .env, call an API, etc.). Only call when you actually need to use the secret. NOTE: the value enters this conversation; to deploy a secret without it passing through the chat, use the `keyvault` CLI and pipe it (keyvault get PROJECT NAME | wrangler secret put NAME).', inputSchema: { type: 'object', required: ['project', 'name'], properties: { project: { type: 'string' }, name: { type: 'string', description: 'Exact key name, e.g. STRIPE_API_KEY.' } } } },
  { name: 'keyvault_save_key', description: 'Store (or update) a secret in the vault. Creates the project if it does not exist. Use this after fetching/creating a key from another tool (Stripe, Cloudflare, etc.) so it is saved encrypted on disk. Re-saving an existing name updates its value.', inputSchema: { type: 'object', required: ['project', 'name', 'value'], properties: { project: { type: 'string', description: 'Project name (created if missing).' }, name: { type: 'string', description: 'Key name, e.g. STRIPE_API_KEY.' }, value: { type: 'string', description: 'The secret value.' }, type: { type: 'string', enum: ['api_key', 'secret', 'token', 'oauth', 'webhook', 'other'], description: 'Default api_key.' }, notes: { type: 'string', description: 'Optional note (e.g. scope, env).' } } } },
  { name: 'keyvault_generate', description: 'Generate a cryptographically-strong value (jwt secret, uuid, random hex/base64, api key pattern, password). Optionally save it to a project in one step with save=true + project + name.', inputSchema: { type: 'object', required: ['type'], properties: { type: { type: 'string', enum: ['jwt', 'uuid', 'hex', 'base64', 'apiKey', 'password'] }, bits: { type: 'number', description: 'jwt: bit length (default 256).' }, bytes: { type: 'number', description: 'hex/base64: byte length (default 32).' }, length: { type: 'number', description: 'apiKey body / password length.' }, prefix: { type: 'string', description: 'apiKey prefix (default sk-).' }, save: { type: 'boolean' }, project: { type: 'string' }, name: { type: 'string' }, notes: { type: 'string' } } } },
  { name: 'keyvault_export_env', description: 'Export all keys in a project as a ready-to-paste block: .env (KEY="value"), .envrc (export KEY=...), or settings (Claude Code env JSON). Values are POSIX shell-quoted.', inputSchema: { type: 'object', required: ['project'], properties: { project: { type: 'string' }, format: { type: 'string', enum: ['env', 'envrc', 'settings'], description: 'Default env.' } } } },
  { name: 'keyvault_create_project', description: 'Create an empty project. Usually unnecessary — keyvault_save_key auto-creates projects — but available for organizing ahead of time.', inputSchema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' }, color: { type: 'string' } } } },
  { name: 'keyvault_delete_key', description: 'Permanently delete a key from a project. Irreversible.', inputSchema: { type: 'object', required: ['project', 'name'], properties: { project: { type: 'string' }, name: { type: 'string' } } } },
  { name: 'keyvault_status', description: 'Health check: reports whether the configured KEYVAULT_PASSWORD can open the local vault (the vault path, whether it exists, whether it unlocks, and project/key counts). Returns NO secret values. Call this first if any other tool fails with a password error, and tell the user the result so they can fix their config.', inputSchema: { type: 'object', properties: {} } },
];

async function runTool(name, args) {
  switch (name) {
    case 'keyvault_list_projects': return listProjects();
    case 'keyvault_list_keys':     return listKeys(args.project);
    case 'keyvault_get_key':       return getKey(args.project, args.name);
    case 'keyvault_save_key':      return saveKey(args);
    case 'keyvault_generate':      return generate(args);
    case 'keyvault_export_env':    return exportEnv(args.project, args.format);
    case 'keyvault_create_project':return createProject(args);
    case 'keyvault_delete_key':    return deleteKey(args.project, args.name);
    case 'keyvault_status':        return status();
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

async function callTool(params) {
  try {
    const data = await runTool(params?.name, params?.arguments || {});
    return { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
  } catch (e) {
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
        return;
      case 'ping':            return send({ jsonrpc: '2.0', id, result: {} });
      case 'tools/list':      return send({ jsonrpc: '2.0', id, result: { tools: TOOL_DEFS } });
      case 'tools/call':      return send({ jsonrpc: '2.0', id, result: await callTool(req.params || {}) });
      case 'resources/list':  return send({ jsonrpc: '2.0', id, result: { resources: [] } });
      case 'prompts/list':    return send({ jsonrpc: '2.0', id, result: { prompts: [] } });
      default:
        if (isNotification) return;
        return send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${req.method}` } });
    }
  } catch (e) {
    if (isNotification) return;
    send({ jsonrpc: '2.0', id, error: { code: -32603, message: String(e?.message || e) } });
  }
}

// Serialize requests so mutating ops never race or interleave their writes.
let chain = Promise.resolve();
const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const t = line.trim();
  if (!t) return;
  let req;
  try { req = JSON.parse(t); } catch { return; }
  if (req && req.jsonrpc === '2.0' && typeof req.method === 'string') {
    chain = chain.then(() => handle(req)).catch((e) => process.stderr.write('[handler] ' + String(e?.message || e) + '\n'));
  }
});
process.stderr.write(`keyvault-sidekick-mcp v${SERVER_INFO.version} ready — vault: ${VAULT_PATH}\n`);
