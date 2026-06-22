#!/usr/bin/env node
/**
 * keyvault — CLI for KeyVault Sidekick's local vault.
 *
 * The point of this CLI (vs the MCP server) is SECURE DEPLOYMENT: secret values
 * are written to STDOUT only, so they can be piped straight to their destination
 * WITHOUT ever passing through an AI agent's conversation/transcript:
 *
 *   keyvault get MyProject STRIPE_KEY | wrangler secret put STRIPE_KEY
 *   keyvault export-env MyProject > .dev.vars
 *   keyvault generate jwt --save --project MyProject --name AUTH_SECRET | wrangler secret put AUTH_SECRET
 *
 * Secret VALUES -> stdout. Status/errors/usage -> stderr. So when an agent runs
 * `keyvault get X | wrangler secret put X`, the terminal shows wrangler's
 * "Success", never the key.
 *
 * Shares all crypto + vault logic with the MCP server via ./vault-core.mjs.
 * Config: KEYVAULT_PASSWORD (required), KEYVAULT_VAULT_PATH (optional).
 *
 * Zero dependencies. Node 18+.
 */

import {
  VAULT_PATH,
  listProjects, listKeys, getKey, saveKey, generate, generateValue, exportEnv, createProject, deleteKey,
  status as vaultStatus, changePassword, resolveSecret,
} from './vault-core.mjs';

const VERSION = '0.3.1';

// ── Output discipline ────────────────────────────────────────────────────────
// Secret values: stdout, raw. A trailing newline is added ONLY when stdout is a
// terminal (readable), never when piped (so the piped value is exact).
function outValue(v) { process.stdout.write(String(v) + (process.stdout.isTTY ? '\n' : '')); }
function outBlock(s) { process.stdout.write(s.endsWith('\n') ? s : s + '\n'); }
function status(s) { process.stderr.write(s + '\n'); }
function num(v) { return v == null ? undefined : Number(v); }

function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    } else positionals.push(a);
  }
  return { positionals, flags };
}

async function readStdin() {
  if (process.stdin.isTTY) {
    throw new Error('No value piped on stdin. Usage: echo "$VALUE" | keyvault save PROJECT NAME');
  }
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, ''); // strip one trailing newline (from echo)
}

const USAGE = `keyvault v${VERSION} — local KeyVault Sidekick CLI

Secret values go to STDOUT (pipe them); status/errors go to STDERR.

Commands:
  status                        Check if your password opens the vault (no secrets)
  list                          List all projects (+ key counts)
  list <project>                List key names in a project (no values)
  get <project> <name>          Print ONE key's value to stdout (for piping)
  generate <type> [opts]        Generate jwt|uuid|hex|base64|apiKey|password -> stdout
      --save --project P --name N   also save it to the vault
      --bits N | --bytes N | --length N | --prefix S | --notes "..."
  export-env <project>          Print all keys as a block to stdout
      --format env|envrc|settings   (default env)
  save <project> <name>         Save a secret; VALUE READ FROM STDIN (secure)
      --type api_key|secret|token|oauth|webhook|other | --notes "..."
  change-password               Re-key the vault; NEW password from stdin or
                                KEYVAULT_NEW_PASSWORD (fixes a wrong/typo'd password)
  create-project <name>         Create an empty project  [--description, --color]
  delete <project> <name>       Delete a key (irreversible)
  help | --version

Troubleshooting (wrong password, reinstall, re-key): mcp/TROUBLESHOOTING.md

Secure deploy examples:
  keyvault get Velocity STRIPE_SECRET | wrangler secret put STRIPE_SECRET
  keyvault export-env Velocity > .dev.vars
  keyvault generate jwt --save --project Velocity --name AUTH_SECRET | wrangler secret put AUTH_SECRET
  openssl rand -hex 16 | keyvault save Velocity WEBHOOK_SIGNING_KEY

Config: KEYVAULT_PASSWORD (or KEYVAULT_PASSWORD_FILE — a 0600 file holding it),
        KEYVAULT_VAULT_PATH (default ${VAULT_PATH}).`;

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const cmd = positionals[0];

  if (flags.version || cmd === 'version') { process.stdout.write(VERSION + '\n'); return; }
  if (!cmd || cmd === 'help' || flags.help) { status(USAGE); return; }

  switch (cmd) {
    case 'status': {
      const s = await vaultStatus();
      status(`vault:     ${s.vaultPath}`);
      status(`exists:    ${s.exists ? 'yes' : 'no'}`);
      status(`password:  ${s.passwordSet ? 'set' : 'NOT set'}`);
      if (s.exists && s.passwordSet) status(`unlocked:  ${s.unlocked ? 'YES' : 'NO'}`);
      if (s.unlocked) { status(`projects:  ${s.projects}`); status(`keys:      ${s.keys}`); }
      if (s.note)  status(`\nnote: ${s.note}`);
      if (s.error) {
        status(`\nproblem: ${s.error}`);
        status(`\nHow to fix (see mcp/TROUBLESHOOTING.md for detail):`);
        status(`  • Right vault but you typed the wrong password into the MCP config?`);
        status(`    Reinstall with the correct one:`);
        status(`      claude mcp remove keyvault`);
        status(`      claude mcp add keyvault --env KEYVAULT_PASSWORD=<correct> -- node <path>/mcp/index.mjs`);
        status(`  • Want to change the vault's password (or fix a typo you DO remember)?`);
        status(`      KEYVAULT_PASSWORD=<current> KEYVAULT_NEW_PASSWORD=<new> keyvault change-password`);
      }
      if (s.passwordSet && s.exists && !s.unlocked) process.exitCode = 1;
      return;
    }
    case 'change-password': {
      let newPw = resolveSecret('KEYVAULT_NEW_PASSWORD', 'KEYVAULT_NEW_PASSWORD_FILE');
      if (!newPw) {
        if (process.stdin.isTTY) {
          throw new Error('Provide the NEW password via stdin, KEYVAULT_NEW_PASSWORD, or KEYVAULT_NEW_PASSWORD_FILE, e.g.\n' +
            '  KEYVAULT_NEW_PASSWORD=newpass keyvault change-password\n' +
            '  printf %s "newpass" | keyvault change-password');
        }
        newPw = await readStdin();
      }
      const r = await changePassword(newPw);
      status(`Re-keyed ${r.vaultPath} — ${r.projects} project(s), ${r.keys} key(s) preserved.`);
      status(`IMPORTANT: update KEYVAULT_PASSWORD to the NEW password everywhere you use it`);
      status(`(your MCP config + any shell env), or the next unlock will fail.`);
      return;
    }
    case 'list': {
      if (positionals[1]) {
        const r = await listKeys(positionals[1]);
        status(`${r.project} — ${r.count} key(s):`);
        for (const k of r.keys) outBlock(`  ${k.name}  [${k.type}]${k.notes ? '  # ' + k.notes : ''}`);
      } else {
        const r = await listProjects();
        if (!r.exists) { status(`No vault yet at ${r.vaultPath}.`); return; }
        status(`${r.count} project(s) in ${r.vaultPath}:`);
        for (const p of r.projects) outBlock(`  ${p.name}  (${p.keys} key${p.keys === 1 ? '' : 's'})${p.archived ? '  [archived]' : ''}`);
      }
      return;
    }
    case 'get': {
      const r = await getKey(positionals[1], positionals[2]);
      outValue(r.value);               // ONLY the value -> stdout
      return;
    }
    case 'generate': {
      const type = positionals[1] || flags.type || 'password';
      const opts = { bits: num(flags.bits), bytes: num(flags.bytes), length: num(flags.length), prefix: flags.prefix };
      if (flags.save) {
        const r = await generate({ type, ...opts, save: true, project: flags.project, name: flags.name, keyType: flags['type-tag'], notes: flags.notes });
        status(`Saved ${r.saved.key} to ${r.saved.project} (${r.saved.action}).`);
        outValue(r.value);             // print too, so it can be piped to a deploy target
      } else {
        outValue(generateValue(type, opts));
      }
      return;
    }
    case 'export-env': {
      const r = await exportEnv(positionals[1], flags.format || 'env');
      outBlock(r.content);
      status(`# ${r.keys} key(s) from ${r.project} (${r.format})`);
      return;
    }
    case 'save': {
      const value = await readStdin();
      const r = await saveKey({ project: positionals[1], name: positionals[2], value, type: flags.type, notes: flags.notes });
      status(`Saved ${r.key} to ${r.project} (${r.action}).`);
      return;
    }
    case 'create-project': {
      const r = await createProject({ name: positionals[1], description: flags.description, color: flags.color });
      status(`Created project ${r.project}.`);
      return;
    }
    case 'delete': {
      const r = await deleteKey(positionals[1], positionals[2]);
      status(`Deleted ${r.deleted} from ${r.project}.`);
      return;
    }
    default:
      status(`keyvault: unknown command "${cmd}".\n`);
      status(USAGE);
      process.exitCode = 1;
  }
}

main().catch((e) => {
  process.stderr.write('keyvault: ' + String(e?.message || e) + '\n');
  process.exitCode = 1;
});
