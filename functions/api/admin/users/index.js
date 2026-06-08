import {
  PBKDF2_ITERATIONS,
  bytesToBase64Url, errorResponse, hashPassword, isValidEmail, json,
  normalizeEmail, nowISO, randomBytes, uuid
} from '../../../_lib.js';

// GET /api/admin/users → list all users (no password material)
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(`
    SELECT id, email, role, status, created_at, last_login, created_by
    FROM users ORDER BY created_at DESC
  `).all();
  return json({ users: results });
};

// POST /api/admin/users → create user with initial password
// body: { email, password, role? }
export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const role = body.role === 'superadmin' ? 'superadmin' : 'user';

  if (!isValidEmail(email)) return errorResponse(400, 'Email address is invalid.');
  if (password.length < 8) return errorResponse(400, 'Password must be at least 8 characters.');

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

  return json({
    user: { id: userId, email, role, status: 'active', created_at: ts }
  }, { status: 201 });
};
