import { errorResponse, json, nowISO } from '../../../_lib.js';

// DELETE /api/admin/users/:id → hard delete a user
// (Cannot delete yourself.)
export const onRequestDelete = async ({ params, env, data }) => {
  const id = String(params.id || '');
  if (!id) return errorResponse(400, 'User id required.');
  if (id === data.user.id) return errorResponse(400, 'Cannot delete your own account.');

  // Check the user exists first
  const target = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?').bind(id).first();
  if (!target) return errorResponse(404, 'User not found.');

  // Don't allow deleting the last superadmin
  if (target.role === 'superadmin') {
    const { count } = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin' AND status = 'active'"
    ).first();
    if (count <= 1) return errorResponse(400, 'Cannot delete the last superadmin.');
  }

  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return json({ ok: true, deletedAt: nowISO() });
};

// PATCH /api/admin/users/:id → update role or status
// body: { role?: 'user'|'superadmin', status?: 'active'|'disabled' }
export const onRequestPatch = async ({ request, params, env, data }) => {
  const id = String(params.id || '');
  if (!id) return errorResponse(400, 'User id required.');
  if (id === data.user.id) return errorResponse(400, 'Cannot modify your own account.');

  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const sets = [];
  const binds = [];
  if (body.role === 'user' || body.role === 'superadmin') {
    sets.push('role = ?'); binds.push(body.role);
  }
  if (body.status === 'active' || body.status === 'disabled') {
    sets.push('status = ?'); binds.push(body.status);
  }
  if (!sets.length) return errorResponse(400, 'No valid fields to update.');

  binds.push(id);
  await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
  return json({ ok: true });
};
