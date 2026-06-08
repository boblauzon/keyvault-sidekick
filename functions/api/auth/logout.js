import { checkOrigin, clearSessionCookie, errorResponse, json, recordAuditLog } from '../../_lib.js';

export const onRequestPost = async ({ request, env, data }) => {
  if (!checkOrigin(request)) return errorResponse(403, 'Cross-origin request blocked.');
  if (data.user) {
    await recordAuditLog(env, {
      userId: data.user.id, email: data.user.email,
      action: 'logout', request
    });
  }
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
};
