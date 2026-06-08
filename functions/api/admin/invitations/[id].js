import { errorResponse, json, nowISO, recordAuditLog } from '../../../_lib.js';

export const onRequestDelete = async ({ params, env, data, request }) => {
  const id = String(params.id || '');
  if (!id) return errorResponse(400, 'Invitation id required.');

  const inv = await env.DB.prepare(
    'SELECT id, email, accepted_at, revoked_at FROM invitations WHERE id = ?'
  ).bind(id).first();
  if (!inv) return errorResponse(404, 'Invitation not found.');
  if (inv.accepted_at) return errorResponse(400, 'Cannot revoke an accepted invitation.');
  if (inv.revoked_at) return errorResponse(400, 'Invitation is already revoked.');

  await env.DB.prepare('UPDATE invitations SET revoked_at = ? WHERE id = ?')
    .bind(nowISO(), id).run();

  await recordAuditLog(env, {
    userId: data.user.id, email: data.user.email,
    action: 'invitation_revoked', request,
    details: { invitation_id: id, revoked_email: inv.email }
  });

  return json({ ok: true });
};
