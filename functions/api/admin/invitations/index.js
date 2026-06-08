import {
  INVITE_TTL_SECONDS,
  errorResponse, generateInviteToken, hashInviteToken, isValidEmail, json,
  normalizeEmail, nowISO, uuid
} from '../../../_lib.js';

// GET /api/admin/invitations → list pending invitations
export const onRequestGet = async ({ env }) => {
  const now = nowISO();
  const { results } = await env.DB.prepare(`
    SELECT id, email, role, invited_by, expires_at, accepted_at, revoked_at, created_at
    FROM invitations
    ORDER BY created_at DESC
  `).all();

  // Annotate each with a derived state.
  const annotated = results.map(inv => {
    let state = 'pending';
    if (inv.accepted_at) state = 'accepted';
    else if (inv.revoked_at) state = 'revoked';
    else if (inv.expires_at < now) state = 'expired';
    return { ...inv, state };
  });

  return json({ invitations: annotated });
};

// POST /api/admin/invitations → create invitation, return one-time URL
// body: { email, role? }
// IMPORTANT: the returned `inviteUrl` contains the raw token. We do NOT store
// the raw token in D1 (only its SHA-256). The admin must copy this URL out of
// the response and send it to the recipient.
export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const email = normalizeEmail(body.email);
  const role = body.role === 'superadmin' ? 'superadmin' : 'user';

  if (!isValidEmail(email)) return errorResponse(400, 'Email address is invalid.');

  // Reject if already a user
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email).first();
  if (existing) return errorResponse(409, 'A user with this email already exists.');

  // Revoke any prior pending invitations for this email
  await env.DB.prepare(`
    UPDATE invitations
    SET revoked_at = ?
    WHERE email = ? AND accepted_at IS NULL AND revoked_at IS NULL
  `).bind(nowISO(), email).run();

  const token = generateInviteToken();
  const tokenHash = await hashInviteToken(token);
  const id = uuid();
  const ts = nowISO();
  const expiresAt = new Date(Date.now() + INVITE_TTL_SECONDS * 1000).toISOString();

  await env.DB.prepare(`
    INSERT INTO invitations (id, email, token_hash, invited_by, role, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, email, tokenHash, data.user.id, role, expiresAt, ts).run();

  // Build the absolute URL the recipient should visit.
  const url = new URL(request.url);
  const inviteUrl = `${url.origin}/invite.html?token=${encodeURIComponent(token)}`;

  return json({
    invitation: { id, email, role, expires_at: expiresAt, created_at: ts },
    inviteUrl
  }, { status: 201 });
};
