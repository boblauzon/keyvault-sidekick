-- 0003_session_version.sql — Session invalidation on password change.
-- The session cookie embeds the user's session_version at issue time.
-- Bumping the version on password change (or admin disable/role change)
-- forces every other live session to fail middleware validation.

ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;
