import { errorResponse, hashInviteToken, json, nowISO } from '../../../_lib.js';

// GET /api/auth/invite/:token → validates the token, returns the recipient email
// so the accept-invite page can pre-fill it.

export const onRequestGet = async ({ params, env }) => {
  const token = String(params.token || '');
  if (!token) return errorResponse(400, 'Token required.');

  const tokenHash = await hashInviteToken(token);

  const row = await env.DB.prepare(
    'SELECT email, expires_at, accepted_at, revoked_at FROM invitations WHERE token_hash = ?'
  ).bind(tokenHash).first();

  if (!row) return errorResponse(404, 'Invitation not found.');
  if (row.revoked_at) return errorResponse(410, 'Invitation has been revoked.');
  if (row.accepted_at) return errorResponse(410, 'Invitation has already been accepted.');
  if (row.expires_at < nowISO()) return errorResponse(410, 'Invitation has expired.');

  return json({ email: row.email });
};
