import {
  INVITE_TTL_SECONDS,
  errorResponse, generateInviteToken, hashInviteToken, isValidEmail, json,
  normalizeEmail, nowISO, recordAuditLog, uuid
} from '../../../_lib.js';

export const onRequestGet = async ({ env }) => {
  const now = nowISO();
  const { results } = await env.DB.prepare(`
    SELECT id, email, role, invited_by, expires_at, accepted_at, revoked_at, created_at
    FROM invitations ORDER BY created_at DESC
  `).all();
  const annotated = results.map(inv => {
    let state = 'pending';
    if (inv.accepted_at) state = 'accepted';
    else if (inv.revoked_at) state = 'revoked';
    else if (inv.expires_at < now) state = 'expired';
    return { ...inv, state };
  });
  return json({ invitations: annotated });
};

export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const email = normalizeEmail(body.email);
  const role = body.role === 'superadmin' ? 'superadmin' : 'user';

  if (!isValidEmail(email)) return errorResponse(400, 'Email address is invalid.');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email).first();
  if (existing) return errorResponse(409, 'A user with this email already exists.');

  await env.DB.prepare(`
    UPDATE invitations SET revoked_at = ?
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

  await recordAuditLog(env, {
    userId: data.user.id, email: data.user.email,
    action: 'invitation_created', request,
    details: { invitation_id: id, invited_email: email, role, expires_at: expiresAt }
  });

  const url = new URL(request.url);
  const inviteUrl = `${url.origin}/invite.html?token=${encodeURIComponent(token)}`;

  return json({
    invitation: { id, email, role, expires_at: expiresAt, created_at: ts },
    inviteUrl
  }, { status: 201 });
};
