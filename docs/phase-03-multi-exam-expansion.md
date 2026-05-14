# Phase 3: Multi-Exam Expansion (PSU + ESE)

This phase expands Gurukool from a GATE-only engine into a multi-exam practice platform with company/year/paper tagging and adaptive mocks.

## Implementation Plan

1. Extend PostgreSQL schema with exam metadata on tests and per-question exam/company/year/paper tags.
2. Add backend catalog filters so users can search by exam/company/year/paper combinations.
3. Build adaptive mock generation that prioritizes weak topics from the student's own past attempts.
4. Extend analytics output with exam-wise, company-wise, and paper-wise performance summaries.
5. Seed realistic PSU + ESE datasets:
   - ONGC aptitude 2022
   - ESE Mechanical PYQs
   - BHEL mechanical challenge
6. Upgrade frontend catalog:
   - exam/company/paper/year filters
   - adaptive mock launcher
7. Upgrade frontend analytics to show exam/company/paper performance cards.
8. Verify backend and frontend production builds.

## Folder Structure

```text
gurukool/
|-- backend/
|   |-- migrations/
|   |   `-- 006_add_multi_exam_support.sql
|   `-- src/
|       |-- modules/
|       |   `-- test-engine/
|       |       |-- test-engine.controller.ts
|       |       |-- test-engine.routes.ts
|       |       |-- test-engine.service.ts
|       |       `-- test-engine.validators.ts
|       |-- scripts/
|       |   `-- seed.ts
|       `-- types/
|           `-- index.ts
|-- docs/
|   `-- phase-03-multi-exam-expansion.md
`-- frontend/
    `-- src/
        `-- app/
            |-- core/
            |   |-- models/
            |   |   `-- test-engine.models.ts
            |   `-- services/
            |       `-- test-engine.service.ts
            `-- pages/
                `-- tests/
                    |-- analytics.page.ts
                    `-- catalog.page.ts
```

## Setup Commands

```bash
docker compose up -d

copy backend\.env.example backend\.env

npm --prefix backend install
npm --prefix backend run migrate
npm --prefix backend run seed
npm --prefix backend run dev

npm --prefix frontend install
npm --prefix frontend run ionic:serve
```

## Code Snippets

### Angular adaptive mock start

```ts
const result = await this.testEngineService.startAdaptiveAttempt({
  examCode: 'PSU',
  companyName: 'ONGC',
  paperCode: 'Aptitude',
  examYear: 2022,
  questionCount: 12,
});
await this.router.navigateByUrl(`/tests/attempt/${result.detail.attempt.id}`);
```

### Node.js adaptive candidate selection

```ts
const rankedCandidates = this.rankAdaptiveCandidates(
  candidates,
  weakTopicIds,
  difficultyProfile
);
const selectedCandidates = rankedCandidates.slice(
  0,
  Math.min(questionCount, rankedCandidates.length)
);
```

### PostgreSQL question tagging and test metadata

```sql
ALTER TABLE tests
    ADD COLUMN IF NOT EXISTS exam_code exam_code,
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS paper_code VARCHAR(120),
    ADD COLUMN IF NOT EXISTS exam_year INT,
    ADD COLUMN IF NOT EXISTS is_adaptive BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS question_exam_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    exam_code exam_code NOT NULL,
    company_name VARCHAR(120),
    paper_code VARCHAR(120),
    exam_year INT,
    is_pyq BOOLEAN NOT NULL DEFAULT TRUE
);
```

### Analytics dimension buckets

```ts
const companyBuckets = new Map<string, CompanyBucket>();
for (const row of rows) {
  const key = `${examCode}::${companyName}`;
  const current = companyBuckets.get(key) ?? seedBucket(examCode, companyName);
  current.attempted += attempted;
  current.correctCount += correct;
  current.incorrectCount += incorrect;
  current.timeSpentSeconds += timeSpentSeconds;
  companyBuckets.set(key, current);
}
```

## Production-Ready Practices Used

- Added indexed exam metadata to keep filtering fast as question volume grows.
- Used non-destructive migrations (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) for safer upgrades.
- Built adaptive mocks server-side so scoring logic cannot be manipulated from client code.
- Reused historical attempt data for personalization instead of hardcoded adaptive rules.
- Kept API filters optional and composable for search patterns like ONGC aptitude 2022.
- Kept test generation auditable through stored adaptive metadata on generated tests/attempts.
- Added company-wise and paper-wise analytics to support targeted revision.

## Verification

- `backend`: `npm run build` passed
- `frontend`: `npm run build` passed

If your shell has restricted permissions for Docker, run migration/seed in an elevated shell as done in previous setup steps.
