import { errorResponse, json, nowISO, recordAuditLog } from '../../../_lib.js';

export const onRequestDelete = async ({ params, env, data, request }) => {
  const id = String(params.id || '');
  if (!id) return errorResponse(400, 'User id required.');
  if (id === data.user.id) return errorResponse(400, 'Cannot delete your own account.');

  const target = await env.DB.prepare('SELECT id, email, role FROM users WHERE id = ?').bind(id).first();
  if (!target) return errorResponse(404, 'User not found.');

  if (target.role === 'superadmin') {
    const { count } = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin' AND status = 'active'"
    ).first();
    if (count <= 1) return errorResponse(400, 'Cannot delete the last superadmin.');
  }

  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

  await recordAuditLog(env, {
    userId: data.user.id, email: data.user.email,
    action: 'user_deleted', request,
    details: { deleted_user_id: id, deleted_email: target.email, deleted_role: target.role }
  });

  return json({ ok: true, deletedAt: nowISO() });
};

export const onRequestPatch = async ({ request, params, env, data }) => {
  const id = String(params.id || '');
  if (!id) return errorResponse(400, 'User id required.');
  if (id === data.user.id) return errorResponse(400, 'Cannot modify your own account.');

  let body;
  try { body = await request.json(); }
  catch { return errorResponse(400, 'Invalid JSON.'); }

  const sets = [];
  const binds = [];
  const changes = {};
  if (body.role === 'user' || body.role === 'superadmin') {
    sets.push('role = ?'); binds.push(body.role); changes.role = body.role;
  }
  if (body.status === 'active' || body.status === 'disabled') {
    sets.push('status = ?'); binds.push(body.status); changes.status = body.status;
  }
  if (!sets.length) return errorResponse(400, 'No valid fields to update.');

  const target = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(id).first();
  if (!target) return errorResponse(404, 'User not found.');

  binds.push(id);
  await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();

  await recordAuditLog(env, {
    userId: data.user.id, email: data.user.email,
    action: 'user_modified', request,
    details: { modified_user_id: id, modified_email: target.email, changes }
  });

  return json({ ok: true });
};
