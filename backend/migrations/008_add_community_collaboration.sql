DO $$
BEGIN
    CREATE TYPE peer_connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE collaboration_event_status AS ENUM (
        'proposed',
        'confirmed',
        'reschedule_requested',
        'cancelled',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE audio_call_status AS ENUM ('ringing', 'active', 'ended', 'missed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE calendar_provider AS ENUM ('google', 'outlook');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'push');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS question_discussion_threads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    exam_code       exam_code,
    company_name    VARCHAR(120),
    paper_code      VARCHAR(120),
    exam_year       INT CHECK (exam_year IS NULL OR (exam_year >= 1990 AND exam_year <= 2100)),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(question_id)
);

CREATE TABLE IF NOT EXISTS discussion_posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id       UUID NOT NULL REFERENCES question_discussion_threads(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_post_id  UUID REFERENCES discussion_posts(id) ON DELETE SET NULL,
    content         TEXT NOT NULL CHECK (char_length(trim(content)) >= 2),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peer_connections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              peer_connection_status NOT NULL DEFAULT 'pending',
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at        TIMESTAMPTZ,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (requester_user_id <> addressee_user_id),
    UNIQUE(requester_user_id, addressee_user_id)
);

CREATE TABLE IF NOT EXISTS collaboration_events (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    peer_connection_id      UUID REFERENCES peer_connections(id) ON DELETE SET NULL,
    title                   VARCHAR(180) NOT NULL,
    agenda                  TEXT,
    starts_at               TIMESTAMPTZ NOT NULL,
    ends_at                 TIMESTAMPTZ NOT NULL,
    timezone                VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
    status                  collaboration_event_status NOT NULL DEFAULT 'proposed',
    requester_confirmed     BOOLEAN NOT NULL DEFAULT TRUE,
    invitee_confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
    last_proposed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    meeting_call_id         UUID,
    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (requester_user_id <> invitee_user_id),
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS event_reschedule_requests (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                UUID NOT NULL REFERENCES collaboration_events(id) ON DELETE CASCADE,
    requested_by_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proposed_starts_at      TIMESTAMPTZ NOT NULL,
    proposed_ends_at        TIMESTAMPTZ NOT NULL,
    timezone                VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
    reason                  TEXT,
    status                  VARCHAR(24) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    responded_by_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (proposed_ends_at > proposed_starts_at)
);

CREATE TABLE IF NOT EXISTS audio_call_rooms (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    peer_connection_id      UUID REFERENCES peer_connections(id) ON DELETE SET NULL,
    event_id                UUID REFERENCES collaboration_events(id) ON DELETE SET NULL,
    status                  audio_call_status NOT NULL DEFAULT 'ringing',
    room_key                VARCHAR(80) NOT NULL UNIQUE,
    started_at              TIMESTAMPTZ,
    ended_at                TIMESTAMPTZ,
    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (caller_user_id <> callee_user_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_collaboration_events_call'
    ) THEN
        ALTER TABLE collaboration_events
            ADD CONSTRAINT fk_collaboration_events_call
            FOREIGN KEY (meeting_call_id) REFERENCES audio_call_rooms(id) ON DELETE SET NULL
            NOT VALID;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS external_calendar_syncs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id            UUID NOT NULL REFERENCES collaboration_events(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            calendar_provider NOT NULL,
    status              VARCHAR(24) NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued', 'synced', 'failed', 'revoked')),
    external_event_id   VARCHAR(255),
    last_error          TEXT,
    last_synced_at      TIMESTAMPTZ,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id, provider)
);

CREATE TABLE IF NOT EXISTS collaboration_notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    notification_type   VARCHAR(80) NOT NULL,
    title               VARCHAR(180) NOT NULL,
    body                TEXT NOT NULL,
    channel             notification_channel NOT NULL DEFAULT 'in_app',
    entity_type         VARCHAR(80),
    entity_id           UUID,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    deliver_after       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collaboration_reminders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL REFERENCES collaboration_events(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    remind_at       TIMESTAMPTZ NOT NULL,
    channel         notification_channel NOT NULL DEFAULT 'in_app',
    status          VARCHAR(24) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'queued', 'sent', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id, remind_at, channel)
);

CREATE INDEX IF NOT EXISTS idx_discussion_threads_question
    ON question_discussion_threads(question_id);

CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread_created
    ON discussion_posts(thread_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_peer_connections_requester
    ON peer_connections(requester_user_id, status);

CREATE INDEX IF NOT EXISTS idx_peer_connections_addressee
    ON peer_connections(addressee_user_id, status);

CREATE INDEX IF NOT EXISTS idx_collaboration_events_requester
    ON collaboration_events(requester_user_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_collaboration_events_invitee
    ON collaboration_events(invitee_user_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_reschedules_event
    ON event_reschedule_requests(event_id, status);

CREATE INDEX IF NOT EXISTS idx_audio_call_rooms_participants
    ON audio_call_rooms(caller_user_id, callee_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_calendar_syncs_user
    ON external_calendar_syncs(user_id, provider, status);

CREATE INDEX IF NOT EXISTS idx_collaboration_notifications_user
    ON collaboration_notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collaboration_reminders_due
    ON collaboration_reminders(status, remind_at);
