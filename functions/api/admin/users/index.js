import {
  PBKDF2_ITERATIONS,
  bytesToBase64Url, checkPasswordStrength, errorResponse, hashPassword,
  isValidEmail, json, normalizeEmail, nowISO, randomBytes, recordAuditLog, uuid
} from '../../../_lib.js';

// GET /api/admin/users
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(`
    SELECT u.id, u.email, u.role, u.status, u.created_at, u.last_login, u.created_by,
           la.unlock_at AS locked_until
    FROM users u
    LEFT JOIN locked_accounts la ON la.email = u.email AND la.unlock_at > ?
    ORDER BY u.created_at DESC
  `).bind(nowISO()).all();
  return json({ users: results });
};

// POST /api/admin/users
export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const role = body.role === 'superadmin' ? 'superadmin' : 'user';

  if (!isValidEmail(email)) return errorResponse(400, 'Email address is invalid.');
  const strength = checkPasswordStrength(password);
  if (!strength.ok) return errorResponse(400, strength.reason);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email).first();
  if (existing) return errorResponse(409, 'A user with this email already exists.');

  const salt = randomBytes(16);
  const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS);
  const userId = uuid();
  const ts = nowISO();

  await env.DB.prepare(`
    INSERT INTO users (id, email, password_hash, salt, iterations, role, status, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).bind(
    userId, email,
    bytesToBase64Url(hash), bytesToBase64Url(salt), PBKDF2_ITERATIONS,
    role, ts, data.user.id
  ).run();

  await recordAuditLog(env, {
    userId: data.user.id, email: data.user.email,
    action: 'user_created', request,
    details: { new_user_id: userId, new_user_email: email, role }
  });

  return json({
    user: { id: userId, email, role, status: 'active', created_at: ts }
  }, { status: 201 });
};
