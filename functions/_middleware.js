// Global middleware — attaches `data.user` to all requests by parsing the
// session cookie. Routes can then check `context.data.user` instead of
// re-parsing.

import { parseSessionCookie, verifySession } from './_lib.js';

export const onRequest = async (context) => {
  const { request, env, next, data } = context;

  // Default: no user attached.
  data.user = null;

  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const token = parseSessionCookie(cookieHeader);
    if (token) {
      const payload = await verifySession(token, env.SESSION_SECRET);
      if (payload) {
        const row = await env.DB.prepare(
          'SELECT id, email, role, status, session_version FROM users WHERE id = ?'
        ).bind(payload.uid).first();
        if (
          row &&
          row.status === 'active' &&
          // Session-version check: rejects tokens issued before a password
          // change / disable / role change. payload.sv defaults to 0 for
          // backwards-compat with tokens issued before this field existed.
          (Number(payload.sv || 0) === Number(row.session_version || 0))
        ) {
          data.user = { id: row.id, email: row.email, role: row.role };
        }
      }
    }
  } catch {
    // Auth failure → unauthenticated. Routes that require auth will 401 themselves.
  }

  return next();
};
