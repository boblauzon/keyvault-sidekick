import { errorResponse, json } from '../../_lib.js';

export const onRequestGet = async ({ data }) => {
  if (!data.user) return errorResponse(401, 'Not authenticated.');
  return json({ user: data.user });
};
