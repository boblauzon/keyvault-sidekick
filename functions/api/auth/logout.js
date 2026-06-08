import { clearSessionCookie, json } from '../../_lib.js';

export const onRequestPost = async () => {
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
};
