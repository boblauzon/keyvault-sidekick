-- 0001_init.sql — KeyVault Sidekick auth schema
-- Created 2026-06-08 for v2.0 multi-tenant build (Phase 7).

CREATE TABLE users (
  id           TEXT PRIMARY KEY,                       -- UUID v4
  email        TEXT NOT NULL UNIQUE,                   -- lowercased
  password_hash TEXT,                                  -- base64(PBKDF2(password, salt, iterations)); NULL until invite accepted
  salt         TEXT,                                   -- base64(16 random bytes)
  iterations   INTEGER,                                -- PBKDF2 iteration count used (forward-compat)
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'disabled')),
  created_at   TEXT NOT NULL,                          -- ISO 8601 UTC
  last_login   TEXT,                                   -- ISO 8601 UTC
  created_by   TEXT                                    -- user.id of admin who created this user (NULL for first superadmin)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE invitations (
  id           TEXT PRIMARY KEY,                       -- UUID v4
  email        TEXT NOT NULL,                          -- lowercased; intended recipient
  token_hash   TEXT NOT NULL UNIQUE,                   -- SHA-256 of the random token (raw token sent to user, never stored)
  invited_by   TEXT NOT NULL,                          -- user.id of admin who created the invite
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
  expires_at   TEXT NOT NULL,                          -- ISO 8601 UTC
  accepted_at  TEXT,                                   -- NULL until accepted
  accepted_user_id TEXT,                               -- user.id after acceptance
  revoked_at   TEXT,                                   -- NULL until revoked
  created_at   TEXT NOT NULL,
  FOREIGN KEY (invited_by) REFERENCES users(id),
  FOREIGN KEY (accepted_user_id) REFERENCES users(id)
);

CREATE INDEX idx_invitations_token ON invitations(token_hash);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_expires ON invitations(expires_at) WHERE accepted_at IS NULL AND revoked_at IS NULL;
