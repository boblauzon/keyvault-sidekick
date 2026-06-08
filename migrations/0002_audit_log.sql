-- 0002_audit_log.sql — Audit log + failed_logins tables for abuse protection.
-- Phase 7.5 abuse protection (2026-06-08)

CREATE TABLE audit_log (
  id           TEXT PRIMARY KEY,                       -- UUID v4
  user_id      TEXT,                                   -- nullable: failed logins have no user yet
  email        TEXT,                                   -- denormalized for failed-login audit
  action       TEXT NOT NULL,                          -- 'login_success', 'login_failure', 'login_locked',
                                                       -- 'user_created', 'user_deleted', 'user_modified',
                                                       -- 'invitation_created', 'invitation_revoked',
                                                       -- 'invitation_accepted', 'logout', 'session_invalid'
  ip           TEXT NOT NULL,                          -- CF-Connecting-IP or 'unknown'
  user_agent   TEXT,                                   -- truncated to 256 chars
  details      TEXT,                                   -- JSON blob with action-specific context
  created_at   TEXT NOT NULL,                          -- ISO 8601 UTC
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_email ON audit_log(email, created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action, created_at DESC);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_ip ON audit_log(ip, created_at DESC);

CREATE TABLE failed_logins (
  id         TEXT PRIMARY KEY,                         -- UUID v4
  email      TEXT NOT NULL,                            -- attempted email (lowercased)
  ip         TEXT NOT NULL,
  failed_at  TEXT NOT NULL                             -- ISO 8601 UTC
);

CREATE INDEX idx_failed_email ON failed_logins(email, failed_at DESC);
CREATE INDEX idx_failed_at ON failed_logins(failed_at);

-- locked_users: when a user is locked due to too many failed attempts,
-- their email + unlock time goes here. unlock_at expires automatically.
CREATE TABLE locked_accounts (
  email      TEXT PRIMARY KEY,
  locked_at  TEXT NOT NULL,
  unlock_at  TEXT NOT NULL,
  reason     TEXT NOT NULL                              -- 'too_many_failed_logins'
);

CREATE INDEX idx_locked_unlock ON locked_accounts(unlock_at);
