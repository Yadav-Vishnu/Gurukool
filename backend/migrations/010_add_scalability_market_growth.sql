DO $$
BEGIN
    CREATE TYPE deployment_platform AS ENUM ('pwa', 'android', 'ios', 'backend');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE deployment_status AS ENUM ('planned', 'building', 'ready', 'released', 'paused');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE service_scale_status AS ENUM ('planned', 'active', 'paused');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE partner_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE institution_member_role AS ENUM ('owner', 'instructor', 'student');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE institution_membership_status AS ENUM ('invited', 'active', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE hosted_test_status AS ENUM ('draft', 'scheduled', 'live', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE moderation_case_status AS ENUM (
        'open',
        'queued',
        'in_review',
        'actioned',
        'dismissed',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE moderation_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE moderation_action_type AS ENUM (
        'none',
        'hide_content',
        'delete_content',
        'warn_user',
        'suspend_user',
        'restore_content'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS deployment_releases (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform            deployment_platform NOT NULL,
    release_version     VARCHAR(40) NOT NULL,
    status              deployment_status NOT NULL DEFAULT 'planned',
    rollout_percent     INT NOT NULL DEFAULT 0 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
    build_channel       VARCHAR(80) NOT NULL DEFAULT 'production',
    artifact_url        TEXT,
    health_url          TEXT,
    notes               TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform, release_version)
);

CREATE TABLE IF NOT EXISTS service_scale_profiles (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_key                 VARCHAR(80) NOT NULL UNIQUE,
    display_name                VARCHAR(140) NOT NULL,
    service_type                VARCHAR(40) NOT NULL DEFAULT 'api',
    min_replicas                INT NOT NULL DEFAULT 2 CHECK (min_replicas > 0),
    max_replicas                INT NOT NULL DEFAULT 5 CHECK (max_replicas >= min_replicas),
    cpu_request_millicores      INT NOT NULL DEFAULT 250 CHECK (cpu_request_millicores > 0),
    memory_request_mb           INT NOT NULL DEFAULT 256 CHECK (memory_request_mb > 0),
    target_cpu_utilization      INT NOT NULL DEFAULT 70 CHECK (target_cpu_utilization > 0 AND target_cpu_utilization <= 100),
    autoscaling_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    status                      service_scale_status NOT NULL DEFAULT 'active',
    metadata                    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_partners (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(180) NOT NULL,
    slug                    VARCHAR(200) NOT NULL UNIQUE,
    contact_name            VARCHAR(120) NOT NULL,
    contact_email           VARCHAR(255) NOT NULL,
    contact_phone           VARCHAR(30),
    city                    VARCHAR(120),
    country                 VARCHAR(80) NOT NULL DEFAULT 'India',
    status                  partner_status NOT NULL DEFAULT 'pending',
    allowed_email_domains   TEXT[] NOT NULL DEFAULT '{}'::text[],
    seats_purchased         INT NOT NULL DEFAULT 0 CHECK (seats_purchased >= 0),
    seats_used              INT NOT NULL DEFAULT 0 CHECK (seats_used >= 0),
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (seats_used <= seats_purchased OR seats_purchased = 0)
);

CREATE TABLE IF NOT EXISTS institution_memberships (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id      UUID NOT NULL REFERENCES institution_partners(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                institution_member_role NOT NULL DEFAULT 'student',
    status              institution_membership_status NOT NULL DEFAULT 'active',
    invited_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, user_id)
);

CREATE TABLE IF NOT EXISTS institution_test_hosts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id      UUID NOT NULL REFERENCES institution_partners(id) ON DELETE CASCADE,
    test_id             UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    title               VARCHAR(180) NOT NULL,
    starts_at           TIMESTAMPTZ,
    ends_at             TIMESTAMPTZ,
    max_participants    INT NOT NULL DEFAULT 100 CHECK (max_participants > 0),
    enrollment_count    INT NOT NULL DEFAULT 0 CHECK (enrollment_count >= 0),
    status              hosted_test_status NOT NULL DEFAULT 'draft',
    access_code         VARCHAR(32) NOT NULL UNIQUE,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS moderation_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(100) NOT NULL UNIQUE,
    title           VARCHAR(160) NOT NULL,
    pattern         TEXT NOT NULL,
    severity        moderation_severity NOT NULL DEFAULT 'medium',
    action_hint     moderation_action_type NOT NULL DEFAULT 'none',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_moderation_cases (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type            VARCHAR(80) NOT NULL,
    content_id              UUID,
    submitted_by_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_by_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    status                  moderation_case_status NOT NULL DEFAULT 'open',
    severity                moderation_severity NOT NULL DEFAULT 'low',
    risk_score              NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
    classifier_label        VARCHAR(80) NOT NULL DEFAULT 'clean',
    content_excerpt         TEXT NOT NULL,
    reasons                 JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_recommendation       moderation_action_type NOT NULL DEFAULT 'none',
    human_decision          moderation_action_type,
    assigned_to             UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by             UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at             TIMESTAMPTZ,
    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id             UUID NOT NULL REFERENCES content_moderation_cases(id) ON DELETE CASCADE,
    reporter_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason              VARCHAR(160) NOT NULL,
    details             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id             UUID NOT NULL REFERENCES content_moderation_cases(id) ON DELETE CASCADE,
    moderator_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type         moderation_action_type NOT NULL,
    note                TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployment_releases_platform
    ON deployment_releases(platform, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scale_profiles_status
    ON service_scale_profiles(status, service_type);

CREATE INDEX IF NOT EXISTS idx_institution_partners_status
    ON institution_partners(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_institution_memberships_user
    ON institution_memberships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_institution_hosts_institution
    ON institution_test_hosts(institution_id, status, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_institution_hosts_test
    ON institution_test_hosts(test_id, status);

CREATE INDEX IF NOT EXISTS idx_moderation_cases_queue
    ON content_moderation_cases(status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_cases_content
    ON content_moderation_cases(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_case
    ON content_reports(case_id, created_at DESC);

INSERT INTO deployment_releases (
    platform,
    release_version,
    status,
    rollout_percent,
    build_channel,
    artifact_url,
    health_url,
    notes,
    metadata
)
VALUES
    (
        'pwa',
        '1.0.0',
        'released',
        100,
        'production',
        'https://app.gurukool.app',
        'https://api.gurukool.app/health',
        'Installable PWA with offline cache for books, tests, community, engagement, and platform dashboards.',
        '{"pwa": true, "serviceWorker": true}'::jsonb
    ),
    (
        'android',
        '1.0.0',
        'ready',
        10,
        'internal-testing',
        'play-console-internal-track',
        NULL,
        'Capacitor Android package ready for internal testing after signing keys are configured.',
        '{"capacitor": true, "requiresSigningKey": true}'::jsonb
    ),
    (
        'ios',
        '1.0.0',
        'planned',
        0,
        'testflight',
        'app-store-connect-testflight',
        NULL,
        'iOS release path prepared; needs Apple Developer credentials and TestFlight upload.',
        '{"capacitor": true, "requiresAppleDeveloperAccount": true}'::jsonb
    ),
    (
        'backend',
        '1.0.0',
        'released',
        100,
        'production',
        'ghcr.io/gurukool/backend:1.0.0',
        '/health',
        'Express API packaged for Docker and Kubernetes horizontal scaling.',
        '{"docker": true, "kubernetes": true}'::jsonb
    )
ON CONFLICT (platform, release_version)
DO UPDATE SET
    status = EXCLUDED.status,
    rollout_percent = EXCLUDED.rollout_percent,
    build_channel = EXCLUDED.build_channel,
    artifact_url = EXCLUDED.artifact_url,
    health_url = EXCLUDED.health_url,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

INSERT INTO service_scale_profiles (
    service_key,
    display_name,
    service_type,
    min_replicas,
    max_replicas,
    cpu_request_millicores,
    memory_request_mb,
    target_cpu_utilization,
    autoscaling_enabled,
    metadata
)
VALUES
    (
        'api-gateway',
        'API Gateway / Express BFF',
        'api',
        2,
        8,
        300,
        512,
        70,
        TRUE,
        '{"routes": ["/api/auth", "/api/users", "/api/sessions"]}'::jsonb
    ),
    (
        'test-engine',
        'Test Engine Service',
        'domain-service',
        2,
        10,
        350,
        512,
        65,
        TRUE,
        '{"routes": ["/api/tests"], "scalesFor": "mock-test-attempts"}'::jsonb
    ),
    (
        'community-realtime',
        'Community + WebRTC Signaling',
        'domain-service',
        2,
        8,
        250,
        384,
        70,
        TRUE,
        '{"routes": ["/api/community"], "redisQueues": ["webrtc:*", "notifications:queue"]}'::jsonb
    ),
    (
        'engagement-growth',
        'Engagement + Growth Service',
        'domain-service',
        2,
        6,
        250,
        384,
        70,
        TRUE,
        '{"routes": ["/api/engagement"], "redisSortedSets": ["engagement:xp:leaderboard"]}'::jsonb
    ),
    (
        'moderation-worker',
        'AI + Human Moderation Worker',
        'worker',
        1,
        5,
        200,
        256,
        60,
        TRUE,
        '{"queues": ["moderation:queue"], "humanReview": true}'::jsonb
    )
ON CONFLICT (service_key)
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    service_type = EXCLUDED.service_type,
    min_replicas = EXCLUDED.min_replicas,
    max_replicas = EXCLUDED.max_replicas,
    cpu_request_millicores = EXCLUDED.cpu_request_millicores,
    memory_request_mb = EXCLUDED.memory_request_mb,
    target_cpu_utilization = EXCLUDED.target_cpu_utilization,
    autoscaling_enabled = EXCLUDED.autoscaling_enabled,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

INSERT INTO institution_partners (
    name,
    slug,
    contact_name,
    contact_email,
    contact_phone,
    city,
    country,
    status,
    allowed_email_domains,
    seats_purchased,
    metadata
)
VALUES (
    'Gurukool Demo Coaching Center',
    'gurukool-demo-coaching-center',
    'Demo Coordinator',
    'partner@gurukool.app',
    '+91-90000-00000',
    'Bengaluru',
    'India',
    'active',
    ARRAY['gurukool.app'],
    250,
    '{"demo": true, "partnershipTier": "pilot"}'::jsonb
)
ON CONFLICT (slug)
DO UPDATE SET
    status = EXCLUDED.status,
    seats_purchased = EXCLUDED.seats_purchased,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

WITH demo_institution AS (
    SELECT id
    FROM institution_partners
    WHERE slug = 'gurukool-demo-coaching-center'
    LIMIT 1
),
first_test AS (
    SELECT id, title
    FROM tests
    WHERE is_published = TRUE
    ORDER BY created_at ASC
    LIMIT 1
)
INSERT INTO institution_test_hosts (
    institution_id,
    test_id,
    title,
    starts_at,
    ends_at,
    max_participants,
    status,
    access_code,
    metadata
)
SELECT
    demo_institution.id,
    first_test.id,
    'Demo Coaching Hosted Test - ' || first_test.title,
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 3 hours',
    150,
    'scheduled',
    'GK-DEMO-2026',
    '{"seeded": true, "deliveryMode": "institution-hosted"}'::jsonb
FROM demo_institution, first_test
ON CONFLICT (access_code)
DO UPDATE SET
    status = EXCLUDED.status,
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    max_participants = EXCLUDED.max_participants,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

INSERT INTO moderation_rules (
    slug,
    title,
    pattern,
    severity,
    action_hint,
    metadata
)
VALUES
    (
        'abusive-language',
        'Abusive or harassing language',
        'idiot|moron|stupid|shut up|abuse',
        'high',
        'hide_content',
        '{"category": "safety"}'::jsonb
    ),
    (
        'private-contact-sharing',
        'Private contact sharing',
        'whatsapp|telegram|phone number|call me at|gmail.com',
        'medium',
        'warn_user',
        '{"category": "privacy"}'::jsonb
    ),
    (
        'exam-leak-request',
        'Exam leak or answer-key request',
        'leaked paper|paper leak|answer key leak|send paper',
        'critical',
        'hide_content',
        '{"category": "integrity"}'::jsonb
    ),
    (
        'commercial-spam',
        'Commercial spam',
        'buy now|discount code|promo code|earn money|guaranteed rank',
        'medium',
        'hide_content',
        '{"category": "spam"}'::jsonb
    )
ON CONFLICT (slug)
DO UPDATE SET
    title = EXCLUDED.title,
    pattern = EXCLUDED.pattern,
    severity = EXCLUDED.severity,
    action_hint = EXCLUDED.action_hint,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
