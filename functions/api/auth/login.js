import {
  SESSION_TTL_SECONDS,
  errorResponse, isValidEmail, json, normalizeEmail,
  base64UrlToBytes, sessionCookie, signSession, unixSeconds, verifyPassword
} from '../../_lib.js';

export const onRequestPost = async ({ request, env }) => {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!isValidEmail(email)) return errorResponse(400, 'Email address is invalid.');
  if (!password) return errorResponse(400, 'Password is required.');

  const row = await env.DB.prepare(
    'SELECT id, email, password_hash, salt, iterations, role, status FROM users WHERE email = ?'
  ).bind(email).first();

  // Generic error to avoid email enumeration.
  const fail = () => errorResponse(401, 'Invalid email or password.');

  if (!row) return fail();
  if (row.status !== 'active') return fail();
  if (!row.password_hash || !row.salt || !row.iterations) return fail();

  const salt = base64UrlToBytes(row.salt);
  const ok = await verifyPassword(password, salt, row.iterations, row.password_hash);
  if (!ok) return fail();

  // Update last_login (non-blocking would be nice but D1 await is fine here)
  await env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?')
    .bind(new Date().toISOString(), row.id).run();

  const exp = unixSeconds() + SESSION_TTL_SECONDS;
  const token = await signSession({ uid: row.id, role: row.role, exp }, env.SESSION_SECRET);

  return json(
    { ok: true, user: { id: row.id, email: row.email, role: row.role } },
    { headers: { 'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS) } }
  );
};
