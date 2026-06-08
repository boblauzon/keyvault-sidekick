import {
  PBKDF2_ITERATIONS, SESSION_TTL_SECONDS,
  base64UrlToBytes, bytesToBase64Url, checkOrigin, checkPasswordStrength,
  errorResponse, getClientIP, hashPassword, json, randomBytes, recordAuditLog,
  sessionCookie, signSession, tryRateLimit, unixSeconds, verifyPassword
} from '../../_lib.js';

// POST /api/auth/change-password
// body: { currentPassword, newPassword }
// On success: re-encrypts auth credential, bumps session_version (invalidates
// every other live session for this user), re-issues this caller a fresh
// cookie with the new sv so they stay logged in.
export const onRequestPost = async ({ request, env, data }) => {
  if (!checkOrigin(request)) return errorResponse(403, 'Cross-origin request blocked.');
  if (!data.user) return errorResponse(401, 'Authentication required.');

  // Rate limit using the login limiter (per IP) — change-pw is a sensitive
  // operation and should not be hammerable. Burst protection only.
  const ip = getClientIP(request);
  const rl = await tryRateLimit(env.LOGIN_LIMITER, `chpw:${ip}`, 'password change attempts');
  if (rl) return rl;

  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!currentPassword) return errorResponse(400, 'Current password is required.');

  const strength = checkPasswordStrength(newPassword);
  if (!strength.ok) return errorResponse(400, strength.reason);

  if (currentPassword === newPassword) {
    return errorResponse(400, 'New password must be different from the current one.');
  }

  // Look up the user's current credential.
  const row = await env.DB.prepare(
    'SELECT id, email, password_hash, salt, iterations, role, status, session_version FROM users WHERE id = ?'
  ).bind(data.user.id).first();
  if (!row || row.status !== 'active') return errorResponse(401, 'User not found or inactive.');

  const salt = base64UrlToBytes(row.salt);
  const ok = await verifyPassword(currentPassword, salt, row.iterations, row.password_hash);
  if (!ok) {
    await recordAuditLog(env, {
      userId: row.id, email: row.email, action: 'password_change_failed',
      request, details: { reason: 'bad_current_password' }
    });
    return errorResponse(401, 'Current password is incorrect.');
  }

  // Re-encrypt with fresh salt + bump session version
  const newSalt = randomBytes(16);
  const newHash = await hashPassword(newPassword, newSalt, PBKDF2_ITERATIONS);
  const newSessionVersion = Number(row.session_version || 0) + 1;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE users
    SET password_hash = ?, salt = ?, iterations = ?, session_version = ?, last_login = ?
    WHERE id = ?
  `).bind(
    bytesToBase64Url(newHash),
    bytesToBase64Url(newSalt),
    PBKDF2_ITERATIONS,
    newSessionVersion,
    now,
    row.id
  ).run();

  // Re-issue the caller a fresh session cookie with the new sv so this tab
  // stays logged in. Other sessions (other browsers / mobile / curl) will
  // start failing the middleware check on their next request.
  const exp = unixSeconds() + SESSION_TTL_SECONDS;
  const newToken = await signSession(
    { uid: row.id, role: row.role, sv: newSessionVersion, exp },
    env.SESSION_SECRET
  );

  await recordAuditLog(env, {
    userId: row.id, email: row.email, action: 'password_changed', request,
    details: { session_version: newSessionVersion }
  });

  return json(
    { ok: true, message: 'Password changed. Other devices have been signed out.' },
    { headers: { 'Set-Cookie': sessionCookie(newToken, SESSION_TTL_SECONDS) } }
  );
};
