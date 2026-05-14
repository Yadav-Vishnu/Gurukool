ALTER TABLE user_sessions
    ADD COLUMN IF NOT EXISTS session_identifier UUID,
    ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255);

UPDATE user_sessions
SET session_identifier = uuid_generate_v4()
WHERE session_identifier IS NULL;

ALTER TABLE user_sessions
    ALTER COLUMN session_identifier SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_identifier
    ON user_sessions(session_identifier);

CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash
    ON user_sessions(refresh_token_hash)
    WHERE refresh_token_hash IS NOT NULL AND is_active = TRUE;
