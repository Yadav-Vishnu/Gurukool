CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    device_info     JSONB,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    last_active_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL: Only ONE active session per user at a time!
-- This unique partial index enforces the single-session rule at the database level.
-- If someone tries to insert a second active session for the same user,
-- PostgreSQL will reject it with a constraint violation.
CREATE UNIQUE INDEX idx_one_active_session
    ON user_sessions(user_id)
    WHERE is_active = TRUE;

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE is_active = TRUE;
