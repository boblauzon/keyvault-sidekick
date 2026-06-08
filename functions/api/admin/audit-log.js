import { errorResponse, json } from '../../_lib.js';

// GET /api/admin/audit-log?limit=100&action=login_failure&email=foo@bar.com
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500);
  const actionFilter = url.searchParams.get('action');
  const emailFilter = url.searchParams.get('email');
  const ipFilter = url.searchParams.get('ip');

  let sql = `
    SELECT id, user_id, email, action, ip, user_agent, details, created_at
    FROM audit_log WHERE 1=1
  `;
  const binds = [];
  if (actionFilter) { sql += ' AND action = ?'; binds.push(actionFilter); }
  if (emailFilter) { sql += ' AND email = ?'; binds.push(emailFilter.toLowerCase()); }
  if (ipFilter) { sql += ' AND ip = ?'; binds.push(ipFilter); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  binds.push(limit);

  const { results } = await env.DB.prepare(sql).bind(...binds).all();

  // Parse the details JSON for the client.
  const events = results.map(r => {
    let details = null;
    if (r.details) { try { details = JSON.parse(r.details); } catch { details = r.details; } }
    return { ...r, details };
  });

  return json({ events });
};
