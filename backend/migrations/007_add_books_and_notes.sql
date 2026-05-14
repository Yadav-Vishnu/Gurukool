DO $$
BEGIN
    CREATE TYPE note_source_type AS ENUM ('highlight_auto', 'manual', 'paraphrase');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS study_books (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name                   VARCHAR(260) NOT NULL,
    mime_type                   VARCHAR(120) NOT NULL,
    file_path                   TEXT NOT NULL,
    file_size_bytes             INT NOT NULL CHECK (file_size_bytes > 0),
    content_preview             TEXT,
    detected_subject_id         UUID REFERENCES subjects(id) ON DELETE SET NULL,
    detected_confidence         NUMERIC(5, 2) NOT NULL DEFAULT 0
                                CHECK (detected_confidence >= 0 AND detected_confidence <= 100),
    detection_metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
    confirmed_subject_id        UUID REFERENCES subjects(id) ON DELETE SET NULL,
    status                      VARCHAR(40) NOT NULL DEFAULT 'pending_confirmation'
                                CHECK (status IN ('pending_confirmation', 'confirmed', 'processed')),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notebook_entries (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id                  UUID REFERENCES subjects(id) ON DELETE SET NULL,
    book_id                     UUID REFERENCES study_books(id) ON DELETE SET NULL,
    source_type                 note_source_type NOT NULL,
    title                       VARCHAR(180),
    source_text                 TEXT,
    note_text                   TEXT NOT NULL,
    paraphrased_from_entry_id   UUID REFERENCES notebook_entries(id) ON DELETE SET NULL,
    metadata                    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_highlights (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id                     UUID NOT NULL REFERENCES study_books(id) ON DELETE CASCADE,
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_number                 INT CHECK (page_number IS NULL OR page_number >= 1),
    highlight_text              TEXT NOT NULL,
    normalized_text             TEXT,
    notebook_entry_id           UUID REFERENCES notebook_entries(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_books_user_created
    ON study_books(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_books_confirmed_subject
    ON study_books(confirmed_subject_id);

CREATE INDEX IF NOT EXISTS idx_notebook_entries_user_created
    ON notebook_entries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notebook_entries_subject
    ON notebook_entries(subject_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notebook_entries_book
    ON notebook_entries(book_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_book_highlights_book
    ON book_highlights(book_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_book_highlights_user
    ON book_highlights(user_id, created_at DESC);
