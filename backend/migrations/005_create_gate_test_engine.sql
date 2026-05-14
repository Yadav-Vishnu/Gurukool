DO $$
BEGIN
    CREATE TYPE test_type AS ENUM ('topic', 'subject', 'full_length');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE question_type AS ENUM ('single_choice');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS subjects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(120) NOT NULL,
    exam_track      VARCHAR(40) NOT NULL DEFAULT 'GATE',
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id      UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    slug            VARCHAR(120) NOT NULL,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(subject_id, slug)
);

CREATE TABLE IF NOT EXISTS tests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                VARCHAR(140) NOT NULL UNIQUE,
    title               VARCHAR(160) NOT NULL,
    description         TEXT,
    instructions        JSONB NOT NULL DEFAULT '[]'::jsonb,
    test_type           test_type NOT NULL,
    subject_id          UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id            UUID REFERENCES topics(id) ON DELETE SET NULL,
    duration_minutes    INT NOT NULL CHECK (duration_minutes > 0),
    total_marks         NUMERIC(8, 2) NOT NULL DEFAULT 0,
    total_questions     INT NOT NULL DEFAULT 0,
    is_published        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id          UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id            UUID REFERENCES topics(id) ON DELETE SET NULL,
    prompt              TEXT NOT NULL UNIQUE,
    question_type       question_type NOT NULL DEFAULT 'single_choice',
    difficulty          VARCHAR(20) NOT NULL DEFAULT 'medium'
                        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    options             JSONB NOT NULL,
    correct_option      VARCHAR(10) NOT NULL,
    explanation         TEXT,
    marks               NUMERIC(6, 2) NOT NULL DEFAULT 1,
    negative_marks      NUMERIC(6, 2) NOT NULL DEFAULT 0.33,
    estimated_seconds   INT NOT NULL DEFAULT 120 CHECK (estimated_seconds > 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id         UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    position        INT NOT NULL CHECK (position > 0),
    section_title   VARCHAR(120),
    UNIQUE(test_id, position),
    UNIQUE(test_id, question_id)
);

CREATE TABLE IF NOT EXISTS test_attempts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id                     UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status                      attempt_status NOT NULL DEFAULT 'in_progress',
    started_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at                TIMESTAMPTZ,
    duration_minutes            INT NOT NULL CHECK (duration_minutes > 0),
    current_question_index      INT NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),
    score                       NUMERIC(8, 2) NOT NULL DEFAULT 0,
    correct_count               INT NOT NULL DEFAULT 0,
    incorrect_count             INT NOT NULL DEFAULT 0,
    unanswered_count            INT NOT NULL DEFAULT 0,
    total_questions             INT NOT NULL DEFAULT 0,
    total_time_spent_seconds    INT NOT NULL DEFAULT 0,
    metadata                    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS test_attempt_answers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id          UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order      INT NOT NULL CHECK (question_order > 0),
    selected_option     VARCHAR(10),
    marked_for_review   BOOLEAN NOT NULL DEFAULT FALSE,
    visited             BOOLEAN NOT NULL DEFAULT FALSE,
    note                TEXT,
    wrong_tag           VARCHAR(120),
    time_spent_seconds  INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
    is_correct          BOOLEAN,
    answered_at         TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_test_attempt
    ON test_attempts(user_id, test_id)
    WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_topics_subject_slug ON topics(subject_id, slug);
CREATE INDEX IF NOT EXISTS idx_tests_type ON tests(test_type);
CREATE INDEX IF NOT EXISTS idx_tests_subject ON tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_tests_topic ON tests(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON test_attempts(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON test_attempt_answers(attempt_id, question_order);
