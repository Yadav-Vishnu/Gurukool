-- Convert auth_provider to VARCHAR to support any OAuth provider dynamically
ALTER TABLE users ALTER COLUMN auth_provider TYPE VARCHAR(50) USING auth_provider::VARCHAR;

-- Add new OAuth provider IDs
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255) UNIQUE;

-- Add profile setup tracking column
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    avatar          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- Create workspace_settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme           VARCHAR(20) DEFAULT 'light',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_settings_user ON workspace_settings(user_id);

-- Trigger function to automatically initialize profiles and workspace settings on user creation
CREATE OR REPLACE FUNCTION create_user_profile_and_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, name, avatar)
    VALUES (NEW.id, COALESCE(NEW.full_name, 'Gurukool User'), NEW.avatar_url)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO workspace_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up trigger
DROP TRIGGER IF EXISTS trigger_create_user_profile_and_settings ON users;
CREATE TRIGGER trigger_create_user_profile_and_settings
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_and_settings();

-- Backfill profiles and settings for existing users
INSERT INTO profiles (user_id, name, avatar)
SELECT id, COALESCE(full_name, 'Gurukool User'), avatar_url FROM users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO workspace_settings (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- If existing users had a custom name set (not the default 'Gurukool User'), mark their profile as completed
UPDATE users SET profile_completed = TRUE 
WHERE full_name IS NOT NULL AND full_name != 'Gurukool User';
