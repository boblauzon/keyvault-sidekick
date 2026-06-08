import {
  PBKDF2_ITERATIONS, SESSION_TTL_SECONDS,
  bytesToBase64Url, checkOrigin, checkPasswordStrength, errorResponse, getClientIP,
  hashInviteToken, hashPassword, json, nowISO, randomBytes, recordAuditLog,
  sessionCookie, signSession, tryRateLimit, unixSeconds, uuid
} from '../../_lib.js';

export const onRequestPost = async ({ request, env }) => {
  if (!checkOrigin(request)) return errorResponse(403, 'Cross-origin request blocked.');

  // Rate limit by IP to make token brute-force impractical (already infeasible
  // since tokens are 256-bit, but cheap to add).
  const ip = getClientIP(request);
  const rl = await tryRateLimit(env.INVITE_LIMITER, `invite:${ip}`, 'invitation attempts');
  if (rl) return rl;

  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const token = String(body.token || '');
  const password = String(body.password || '');

  if (!token) return errorResponse(400, 'Token is required.');

  const strength = checkPasswordStrength(password);
  if (!strength.ok) return errorResponse(400, strength.reason);

  const tokenHash = await hashInviteToken(token);

  const invite = await env.DB.prepare(
    'SELECT id, email, role, expires_at, accepted_at, revoked_at, invited_by FROM invitations WHERE token_hash = ?'
  ).bind(tokenHash).first();

  if (!invite) return errorResponse(404, 'Invitation not found.');
  if (invite.revoked_at) return errorResponse(410, 'Invitation has been revoked.');
  if (invite.accepted_at) return errorResponse(410, 'Invitation has already been accepted.');
  if (invite.expires_at < nowISO()) return errorResponse(410, 'Invitation has expired.');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(invite.email).first();
  if (existing) return errorResponse(409, 'A user with this email already exists.');

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
    env.DB.prepare(`UPDATE invitations SET accepted_at = ?, accepted_user_id = ? WHERE id = ?`)
      .bind(ts, userId, invite.id)
  ]);

  await recordAuditLog(env, {
    userId, email: invite.email, action: 'invitation_accepted', request,
    details: { invitation_id: invite.id, role: invite.role }
  });

  const exp = unixSeconds() + SESSION_TTL_SECONDS;
  const sessionToken = await signSession({ uid: userId, role: invite.role, exp }, env.SESSION_SECRET);

  return json(
    { ok: true, user: { id: userId, email: invite.email, role: invite.role } },
    { headers: { 'Set-Cookie': sessionCookie(sessionToken, SESSION_TTL_SECONDS) } }
  );
};
