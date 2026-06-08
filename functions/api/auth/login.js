import {
  SESSION_TTL_SECONDS,
  base64UrlToBytes, checkOrigin, clearFailedLogins, errorResponse,
  getClientIP, getLockoutStatus, isValidEmail, json, normalizeEmail, recordAuditLog,
  recordFailedLogin, sessionCookie, signSession, tryRateLimit, unixSeconds, verifyPassword
} from '../../_lib.js';

export const onRequestPost = async ({ request, env }) => {
  // CSRF: refuse if Origin header is present but doesn't match request origin.
  if (!checkOrigin(request)) return errorResponse(403, 'Cross-origin request blocked.');

  // Rate limit per IP (5/60s burst protection).
  const ip = getClientIP(request);
  const rl = await tryRateLimit(env.LOGIN_LIMITER, `login:${ip}`, 'login attempts');
  if (rl) return rl;

  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!isValidEmail(email)) return errorResponse(400, 'Email address is invalid.');
  if (!password) return errorResponse(400, 'Password is required.');

  // Account-level lockout check (D1, hourly window).
  const lockedUntil = await getLockoutStatus(env, email);
  if (lockedUntil) {
    await recordAuditLog(env, {
      email, action: 'login_locked', request,
      details: { unlock_at: lockedUntil }
    });
    return errorResponse(429, 'Account is temporarily locked due to too many failed attempts. Try again later.');
  }

  const row = await env.DB.prepare(
    'SELECT id, email, password_hash, salt, iterations, role, status, session_version FROM users WHERE email = ?'
  ).bind(email).first();

  // Generic error to avoid email enumeration.
  const fail = async (reason) => {
    const lockResult = await recordFailedLogin(env, email, ip);
    await recordAuditLog(env, {
      email, action: 'login_failure', request,
      details: { reason, locked: lockResult.locked }
    });
    return errorResponse(401, 'Invalid email or password.');
  };

  if (!row) return fail('no_user');
  if (row.status !== 'active') return fail('user_inactive');
  if (!row.password_hash || !row.salt || !row.iterations) return fail('no_password_set');

  const salt = base64UrlToBytes(row.salt);
  const ok = await verifyPassword(password, salt, row.iterations, row.password_hash);
  if (!ok) return fail('bad_password');

  // Success — clear failed-login tracking + update last_login + audit
  await clearFailedLogins(env, email);
  await env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?')
    .bind(new Date().toISOString(), row.id).run();

  await recordAuditLog(env, {
    userId: row.id, email, action: 'login_success', request
  });

  const exp = unixSeconds() + SESSION_TTL_SECONDS;
  const token = await signSession(
    { uid: row.id, role: row.role, sv: Number(row.session_version || 0), exp },
    env.SESSION_SECRET
  );

  return json(
    { ok: true, user: { id: row.id, email: row.email, role: row.role } },
    { headers: { 'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS) } }
  );
};
