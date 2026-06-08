import {
  PBKDF2_ITERATIONS, SESSION_TTL_SECONDS,
  bytesToBase64Url, errorResponse, hashInviteToken, hashPassword, json,
  nowISO, randomBytes, sessionCookie, signSession, unixSeconds, uuid
} from '../../_lib.js';

export const onRequestPost = async ({ request, env }) => {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const token = String(body.token || '');
  const password = String(body.password || '');

  if (!token) return errorResponse(400, 'Token is required.');
  if (password.length < 8) return errorResponse(400, 'Password must be at least 8 characters.');

  const tokenHash = await hashInviteToken(token);

  const invite = await env.DB.prepare(
    'SELECT id, email, role, expires_at, accepted_at, revoked_at, invited_by FROM invitations WHERE token_hash = ?'
  ).bind(tokenHash).first();

  if (!invite) return errorResponse(404, 'Invitation not found.');
  if (invite.revoked_at) return errorResponse(410, 'Invitation has been revoked.');
  if (invite.accepted_at) return errorResponse(410, 'Invitation has already been accepted.');
  if (invite.expires_at < nowISO()) return errorResponse(410, 'Invitation has expired.');

  // Check email isn't already a user (could happen if admin created user + invite).
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(invite.email).first();
  if (existing) return errorResponse(409, 'A user with this email already exists.');

  // Create user.
  const salt = randomBytes(16);
  const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS);
  const userId = uuid();
  const ts = nowISO();

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, salt, iterations, role, status, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      userId, invite.email,
      bytesToBase64Url(hash), bytesToBase64Url(salt), PBKDF2_ITERATIONS,
      invite.role, ts, invite.invited_by
    ),
    env.DB.prepare(`
      UPDATE invitations SET accepted_at = ?, accepted_user_id = ? WHERE id = ?
    `).bind(ts, userId, invite.id)
  ]);

  // Issue a session.
  const exp = unixSeconds() + SESSION_TTL_SECONDS;
  const sessionToken = await signSession({ uid: userId, role: invite.role, exp }, env.SESSION_SECRET);

  return json(
    { ok: true, user: { id: userId, email: invite.email, role: invite.role } },
    { headers: { 'Set-Cookie': sessionCookie(sessionToken, SESSION_TTL_SECONDS) } }
  );
};
