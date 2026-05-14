# Phase 4: Books & Notes

This phase adds the learning workspace around PDFs: upload a book, detect its likely subject, let the student confirm it, save highlighted text into notebooks, paraphrase notes, and keep key read/write flows usable offline.

## Implementation Plan

1. Extend PostgreSQL with book, highlight, and notebook tables.
2. Add backend Books & Notes APIs behind the existing auth middleware.
3. Store uploaded PDFs on the backend filesystem under `backend/storage/books`.
4. Detect the likely subject from extracted PDF preview text using local keyword scoring.
5. Require student subject confirmation before treating a book as fully organized.
6. Save highlighted text as both a `book_highlights` row and an automatic notebook entry.
7. Add manual note and paraphrase endpoints.
8. Build an Ionic Books page for upload, confirmation, highlights, manual notes, paraphrasing, notebook browsing, and offline sync.
9. Add local offline queues for notes/highlights/confirmations and cache read-heavy Books/Test data for PWA use.
10. Verify backend build, frontend build, and Docker-backed migration.

## Folder Structure

```text
gurukool/
|-- backend/
|   |-- migrations/
|   |   `-- 007_add_books_and_notes.sql
|   |-- src/
|   |   |-- app.ts
|   |   `-- modules/
|   |       `-- books/
|   |           |-- books.controller.ts
|   |           |-- books.routes.ts
|   |           |-- books.service.ts
|   |           `-- books.validators.ts
|   `-- storage/
|       `-- books/
|-- docs/
|   `-- phase-04-books-notes.md
|-- frontend/
|   |-- ngsw-config.json
|   `-- src/
|       `-- app/
|           |-- app.routes.ts
|           |-- core/
|           |   |-- models/
|           |   |   `-- books.models.ts
|           |   `-- services/
|           |       |-- books-notes.service.ts
|           |       |-- local-cache.service.ts
|           |       `-- test-engine.service.ts
|           `-- pages/
|               |-- books/
|               |   `-- books.page.ts
|               `-- dashboard/
|                   `-- dashboard.page.ts
`-- ops/
    `-- phase4-migrate.ps1
```

## Setup Commands

```bash
docker compose up -d

npm --prefix backend install
npm --prefix backend run migrate
npm --prefix backend run dev

npm --prefix frontend install
npm --prefix frontend run ionic:serve
```

On this Windows workspace, the elevated Docker migration helper is:

```powershell
Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File C:\Users\VISHNU~1\OneDrive\Desktop\gurukool\ops\phase4-migrate.ps1'
```

## Code Snippets

### Angular PDF upload and detection

```ts
const preview = await this.extractPreviewText(file);
const created = await this.booksService.uploadBook(file, preview);

this.successMessage.set(
  created.detectedSubject
    ? `Book uploaded. Suggested subject: ${created.detectedSubject.code}. Please confirm.`
    : 'Book uploaded. Subject suggestion was weak, please confirm manually.'
);
```

### Angular offline queue replay

```ts
async syncOfflineQueue(): Promise<number> {
  if (!this.isOnline()) {
    return 0;
  }

  const queuedOps = this.cache.drain<OfflineBooksOperation>(OFFLINE_BOOKS_QUEUE_KEY);
  let successCount = 0;

  for (const operation of queuedOps) {
    if (operation.operationType === 'manual-note') {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/books/notebooks/manual`, operation.payload.payload)
      );
      successCount += 1;
    }
  }

  return successCount;
}
```

### Node.js subject detection

```ts
const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'g');
const matches = previewText.match(pattern);
const count = matches?.length ?? 0;

if (count > 0) {
  score += count;
  keywordHits.push({ keyword, count });
}
```

### Node.js highlight to notebook

```ts
const notebookInsert = await client.query(
  `INSERT INTO notebook_entries (
     user_id, subject_id, book_id, source_type, title, source_text, note_text, metadata
   )
   VALUES ($1, $2, $3, 'highlight_auto', $4, $5, $5, $6::jsonb)
   RETURNING id, note_text, created_at`,
  [userId, subjectId, bookRow.id, title, normalizedText, metadata]
);
```

### PostgreSQL schema

```sql
CREATE TABLE IF NOT EXISTS study_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(260) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_path TEXT NOT NULL,
    detected_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    confirmed_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'pending_confirmation'
);

CREATE TABLE IF NOT EXISTS notebook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    book_id UUID REFERENCES study_books(id) ON DELETE SET NULL,
    source_type note_source_type NOT NULL,
    note_text TEXT NOT NULL
);
```

### Redis usage

```ts
// Redis remains responsible for auth sessions and rate-limited API behavior in Phase 4.
// Books offline queues are kept client-side so students can create notes without network.
await redis.ping();
```

## Production-Ready Practices Used

- All Books APIs are protected by the existing JWT auth middleware.
- Uploaded PDFs are validated by MIME type, PDF header, base64 size, and decoded file size.
- File storage is user-scoped and ignored by git through `backend/storage/`.
- PDF body size is capped and the backend JSON limit is tuned for base64 upload overhead.
- Subject detection is local and privacy-preserving for v1; no book text is sent to an external AI service.
- Student confirmation is required so weak or ambiguous subject detection does not silently misfile books.
- Highlight saves use a database transaction so highlight and notebook rows stay consistent.
- Offline write operations are queued locally and replayed only when the browser is online.
- Service-worker data groups cache Books/Test reads for PWA use.

## Verification

Run these after applying Phase 4:

```bash
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix backend run migrate
```

The migration adds only new tables/types and indexes, so it is safe to run against the existing Phase 1-3 database.
