DO $$
BEGIN
    CREATE TYPE exam_code AS ENUM ('GATE', 'PSU', 'ESE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tests
    ADD COLUMN IF NOT EXISTS exam_code exam_code,
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS paper_code VARCHAR(120),
    ADD COLUMN IF NOT EXISTS exam_year INT
        CHECK (exam_year IS NULL OR (exam_year >= 1990 AND exam_year <= 2100)),
    ADD COLUMN IF NOT EXISTS is_adaptive BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tests
    ALTER COLUMN exam_code SET DEFAULT 'GATE';

ALTER TABLE tests
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE tests
SET exam_code = 'GATE'
WHERE exam_code IS NULL;

CREATE TABLE IF NOT EXISTS question_exam_tags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    exam_code       exam_code NOT NULL,
    company_name    VARCHAR(120),
    paper_code      VARCHAR(120),
    exam_year       INT CHECK (exam_year IS NULL OR (exam_year >= 1990 AND exam_year <= 2100)),
    is_pyq          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_question_exam_tags_unique
    ON question_exam_tags(
        question_id,
        exam_code,
        COALESCE(company_name, ''),
        COALESCE(paper_code, ''),
        COALESCE(exam_year, 0)
    );

CREATE INDEX IF NOT EXISTS idx_tests_exam_code ON tests(exam_code);
CREATE INDEX IF NOT EXISTS idx_tests_company_name ON tests(company_name);
CREATE INDEX IF NOT EXISTS idx_tests_paper_code ON tests(paper_code);
CREATE INDEX IF NOT EXISTS idx_tests_exam_year ON tests(exam_year);
CREATE INDEX IF NOT EXISTS idx_tests_adaptive ON tests(is_adaptive);
CREATE INDEX IF NOT EXISTS idx_question_exam_tags_exam ON question_exam_tags(exam_code, company_name, exam_year, paper_code);
CREATE INDEX IF NOT EXISTS idx_question_exam_tags_question ON question_exam_tags(question_id);
