CREATE TABLE IF NOT EXISTS engagement_profiles (
    user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp_points               INT NOT NULL DEFAULT 0 CHECK (xp_points >= 0),
    current_streak_days     INT NOT NULL DEFAULT 0 CHECK (current_streak_days >= 0),
    longest_streak_days     INT NOT NULL DEFAULT 0 CHECK (longest_streak_days >= 0),
    last_activity_date      DATE,
    referral_code           VARCHAR(20) NOT NULL UNIQUE,
    referred_by_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formula_flashcards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id      UUID REFERENCES subjects(id) ON DELETE SET NULL,
    slug            VARCHAR(140) NOT NULL UNIQUE,
    title           VARCHAR(160) NOT NULL,
    formula_text    TEXT NOT NULL,
    explanation     TEXT,
    difficulty      VARCHAR(20) NOT NULL DEFAULT 'medium'
                    CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_formula_reviews (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    formula_id          UUID NOT NULL REFERENCES formula_flashcards(id) ON DELETE CASCADE,
    confidence          INT NOT NULL CHECK (confidence >= 1 AND confidence <= 5),
    review_count        INT NOT NULL DEFAULT 1 CHECK (review_count >= 1),
    last_reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_due_at         TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, formula_id)
);

CREATE TABLE IF NOT EXISTS badges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(80) NOT NULL UNIQUE,
    title           VARCHAR(120) NOT NULL,
    description     TEXT NOT NULL,
    xp_bonus        INT NOT NULL DEFAULT 0 CHECK (xp_bonus >= 0),
    criteria        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id        UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS xp_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type      VARCHAR(80) NOT NULL,
    points          INT NOT NULL CHECK (points >= 0),
    reason          VARCHAR(180) NOT NULL,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_challenges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(140) NOT NULL UNIQUE,
    title           VARCHAR(180) NOT NULL,
    description     TEXT NOT NULL,
    challenge_type  VARCHAR(40) NOT NULL DEFAULT 'weekly'
                    CHECK (challenge_type IN ('weekly', 'live_quiz', 'revision')),
    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,
    xp_reward       INT NOT NULL DEFAULT 50 CHECK (xp_reward >= 0),
    status          VARCHAR(24) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft', 'scheduled', 'active', 'closed')),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS weekly_challenge_participants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id    UUID NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(24) NOT NULL DEFAULT 'joined'
                    CHECK (status IN ('joined', 'completed')),
    score           INT NOT NULL DEFAULT 0 CHECK (score >= 0),
    xp_awarded      INT NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS live_quizzes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(140) NOT NULL UNIQUE,
    title           VARCHAR(180) NOT NULL,
    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,
    status          VARCHAR(24) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('scheduled', 'active', 'closed')),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS live_quiz_questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id         UUID NOT NULL REFERENCES live_quizzes(id) ON DELETE CASCADE,
    prompt          TEXT NOT NULL,
    options         JSONB NOT NULL,
    correct_option  VARCHAR(10) NOT NULL,
    explanation     TEXT,
    points          INT NOT NULL DEFAULT 5 CHECK (points > 0),
    position        INT NOT NULL CHECK (position > 0),
    UNIQUE(quiz_id, position)
);

CREATE TABLE IF NOT EXISTS live_quiz_responses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id             UUID NOT NULL REFERENCES live_quizzes(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES live_quiz_questions(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    selected_option     VARCHAR(10) NOT NULL,
    is_correct          BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded      INT NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
    answered_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code       VARCHAR(20) NOT NULL,
    reward_points       INT NOT NULL DEFAULT 50 CHECK (reward_points >= 0),
    status              VARCHAR(24) NOT NULL DEFAULT 'awarded'
                        CHECK (status IN ('pending', 'awarded', 'revoked')),
    awarded_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (referrer_user_id <> referred_user_id),
    UNIQUE(referred_user_id)
);

CREATE TABLE IF NOT EXISTS mentor_roadmaps (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status                  VARCHAR(24) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'archived')),
    focus_summary           TEXT NOT NULL,
    weekly_plan             JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_actions     JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_from          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formula_flashcards_subject
    ON formula_flashcards(subject_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_formula_reviews_due
    ON user_formula_reviews(user_id, next_due_at);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
    ON user_badges(user_id, awarded_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_created
    ON xp_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active
    ON weekly_challenges(status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_live_quizzes_active
    ON live_quizzes(status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer
    ON referral_rewards(referrer_user_id, status);

CREATE INDEX IF NOT EXISTS idx_mentor_roadmaps_user
    ON mentor_roadmaps(user_id, status, created_at DESC);

INSERT INTO badges (slug, title, description, xp_bonus, criteria)
VALUES
  ('first-flashcard', 'First Formula', 'Reviewed your first formula flashcard.', 10, '{"type":"formula_reviews","count":1}'::jsonb),
  ('three-day-streak', 'Three Day Streak', 'Studied for three days in a row.', 25, '{"type":"streak","days":3}'::jsonb),
  ('xp-100', 'Century Club', 'Earned 100 XP.', 20, '{"type":"xp","points":100}'::jsonb),
  ('challenge-starter', 'Challenge Starter', 'Joined a weekly challenge.', 15, '{"type":"challenge_joined","count":1}'::jsonb),
  ('mentor-ready', 'Mentor Ready', 'Generated a personalized study roadmap.', 20, '{"type":"mentor_roadmap","count":1}'::jsonb),
  ('referral-spark', 'Referral Spark', 'Helped another student join Gurukool.', 30, '{"type":"referral_awarded","count":1}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'math-eigenvalue-characteristic', 'Eigenvalue Characteristic Equation',
       'det(A - lambda I) = 0',
       'Eigenvalues of a square matrix are roots of the characteristic equation.',
       'medium', '["linear algebra","matrices"]'::jsonb
FROM subjects WHERE code = 'MATH'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'math-laplace-derivative', 'Laplace Transform of Derivative',
       'L{f''(t)} = sF(s) - f(0+)',
       'Used to convert differential equations into algebraic equations.',
       'medium', '["laplace","signals"]'::jsonb
FROM subjects WHERE code = 'MATH'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'math-bayes-theorem', 'Bayes Theorem',
       'P(A|B) = P(B|A)P(A) / P(B)',
       'Updates probability of an event when new evidence is known.',
       'easy', '["probability","aptitude"]'::jsonb
FROM subjects WHERE code = 'MATH'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'me-bending-stress', 'Bending Stress',
       'sigma = M y / I',
       'Stress at a distance y from the neutral axis under bending moment M.',
       'medium', '["strength of materials","beam"]'::jsonb
FROM subjects WHERE code = 'ME'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'me-torsion-shaft', 'Torsion Equation',
       'T / J = tau / r = G theta / L',
       'Relates torque, shear stress, rigidity, twist, and shaft geometry.',
       'medium', '["som","shaft"]'::jsonb
FROM subjects WHERE code = 'ME'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'me-heat-conduction', 'Fourier Law of Conduction',
       'Q = -k A dT/dx',
       'Heat flow is proportional to area and temperature gradient.',
       'easy', '["heat transfer","conduction"]'::jsonb
FROM subjects WHERE code = 'ME'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'me-first-law-closed-system', 'First Law for Closed System',
       'Q - W = Delta U',
       'Net heat minus work equals change in internal energy.',
       'easy', '["thermodynamics","energy"]'::jsonb
FROM subjects WHERE code = 'ME'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'ga-percentage-change', 'Percentage Change',
       'Percentage change = ((new - old) / old) x 100',
       'Use for growth, reduction, profit, loss, and comparison questions.',
       'easy', '["aptitude","percentage"]'::jsonb
FROM subjects WHERE code = 'GA'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'ga-time-work', 'Time and Work',
       'Combined rate = rate1 + rate2 + ...',
       'If A finishes in x days, A works at 1/x job per day.',
       'easy', '["aptitude","time and work"]'::jsonb
FROM subjects WHERE code = 'GA'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO formula_flashcards (subject_id, slug, title, formula_text, explanation, difficulty, tags)
SELECT id, 'ga-simple-interest', 'Simple Interest',
       'SI = P R T / 100',
       'P is principal, R is annual rate, and T is time in years.',
       'easy', '["aptitude","interest"]'::jsonb
FROM subjects WHERE code = 'GA'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO weekly_challenges (slug, title, description, challenge_type, starts_at, ends_at, xp_reward, status, metadata)
VALUES (
  'weekly-formula-sprint',
  'Weekly Formula Sprint',
  'Review at least 25 formula cards and submit your completion score.',
  'weekly',
  DATE_TRUNC('week', NOW()),
  DATE_TRUNC('week', NOW()) + INTERVAL '7 days',
  80,
  'active',
  '{"targetFormulaReviews":25}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    status = 'active',
    updated_at = NOW();

INSERT INTO live_quizzes (slug, title, starts_at, ends_at, status, metadata)
VALUES (
  'live-quiz-gate-warmup',
  'GATE Warmup Live Quiz',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '30 days',
  'active',
  '{"mode":"practice-live"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    status = 'active',
    updated_at = NOW();

INSERT INTO live_quiz_questions (quiz_id, prompt, options, correct_option, explanation, points, position)
SELECT id,
       'If a student reviews 8 formulas daily, how many formulas are reviewed in 7 days?',
       '[{"id":"A","text":"48"},{"id":"B","text":"56"},{"id":"C","text":"64"},{"id":"D","text":"72"}]'::jsonb,
       'B',
       '8 formulas per day for 7 days gives 8 x 7 = 56.',
       5,
       1
FROM live_quizzes WHERE slug = 'live-quiz-gate-warmup'
ON CONFLICT (quiz_id, position) DO NOTHING;

INSERT INTO live_quiz_questions (quiz_id, prompt, options, correct_option, explanation, points, position)
SELECT id,
       'For simple interest, which variable represents principal in SI = PRT/100?',
       '[{"id":"A","text":"P"},{"id":"B","text":"R"},{"id":"C","text":"T"},{"id":"D","text":"100"}]'::jsonb,
       'A',
       'P represents the principal amount.',
       5,
       2
FROM live_quizzes WHERE slug = 'live-quiz-gate-warmup'
ON CONFLICT (quiz_id, position) DO NOTHING;
