// Global middleware — attaches `data.user` to all requests by parsing the
// session cookie. Routes can then check `context.data.user` instead of
// re-parsing.

import { parseSessionCookie, verifySession } from './_lib.js';

export const onRequest = async (context) => {
  const { request, env, next, data } = context;

  // Default: no user attached.
  data.user = null;

  // Health check / static asset paths skip auth entirely.
  // (Static assets are served by Pages assets binding, never hit this code.)
  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const token = parseSessionCookie(cookieHeader);
    if (token) {
      const payload = await verifySession(token, env.SESSION_SECRET);
      if (payload) {
        // Optionally look up user to confirm status is still 'active'.
        const row = await env.DB.prepare(
          'SELECT id, email, role, status FROM users WHERE id = ?'
        ).bind(payload.uid).first();
        if (row && row.status === 'active') {
          data.user = { id: row.id, email: row.email, role: row.role };
        }
      }
    }
  } catch {
    // Auth failure → unauthenticated. Routes that require auth will 401 themselves.
  }

  return next();
};
