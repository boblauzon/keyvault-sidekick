// Gate: every /api/admin/* route requires an authenticated superadmin.

import { errorResponse } from '../../_lib.js';

export const onRequest = async ({ data, next }) => {
  if (!data.user) return errorResponse(401, 'Authentication required.');
  if (data.user.role !== 'superadmin') return errorResponse(403, 'Superadmin role required.');
  return next();
};
