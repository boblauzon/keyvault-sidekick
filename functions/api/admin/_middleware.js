// Gate: every /api/admin/* route requires an authenticated superadmin.
// Also applies CSRF check + per-session rate limit.

import { checkOrigin, errorResponse, tryRateLimit } from '../../_lib.js';

export const onRequest = async ({ request, data, env, next }) => {
  // CSRF for state-changing requests (POST/PATCH/DELETE).
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD' && !checkOrigin(request)) {
    return errorResponse(403, 'Cross-origin request blocked.');
  }

  if (!data.user) return errorResponse(401, 'Authentication required.');
  if (data.user.role !== 'superadmin') return errorResponse(403, 'Superadmin role required.');

  // Per-session rate limit (30 requests / 10s). Prevents accidental loops
  // or a compromised admin session from spamming the API.
  const rl = await tryRateLimit(env.ADMIN_LIMITER, `admin:${data.user.id}`, 'admin requests');
  if (rl) return rl;

  return next();
};
