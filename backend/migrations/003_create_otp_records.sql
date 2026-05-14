CREATE TABLE otp_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(15) NOT NULL,
    otp_hash        VARCHAR(255) NOT NULL,
    attempts        INT DEFAULT 0,
    max_attempts    INT DEFAULT 3,
    is_used         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_otp_phone ON otp_records(phone);
CREATE INDEX idx_otp_expires ON otp_records(expires_at);

-- Cleanup policy: auto-delete expired OTPs older than 24 hours
-- This can be run via a cron job or pg_cron extension:
-- SELECT cron.schedule('cleanup-otps', '0 * * * *', 
--   $$DELETE FROM otp_records WHERE expires_at < NOW() - INTERVAL '24 hours'$$);
