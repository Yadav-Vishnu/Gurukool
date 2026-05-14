# Phase 2: Test Engine (GATE)

This phase adds the first real learning workflow to Gurukool: students can browse tests, start an attempt, answer questions in a GATE-style runner, and review analytics after submission.

## Implementation Plan

1. Extend PostgreSQL with subjects, topics, tests, questions, attempts, and attempt-answer tables.
2. Create backend APIs for:
   - test catalog
   - starting or resuming an attempt
   - saving answers, notes, and wrong-answer tags
   - submitting a test
   - viewing analytics
3. Seed a demo GATE catalog with topic-wise, subject-wise, and full-length tests.
4. Build the Ionic test catalog screen with filters and test cards.
5. Build the test runner with:
   - countdown timer
   - question palette
   - save/clear/review actions
   - wrong-answer tags and notes
   - quick calculator
6. Build the analytics screen for score, accuracy, time per question, and weak areas.
7. Verify backend and frontend production builds.

## Folder Structure

```text
gurukool/
├── backend/
│   ├── migrations/
│   │   └── 005_create_gate_test_engine.sql
│   └── src/
│       ├── modules/
│       │   └── test-engine/
│       │       ├── test-engine.controller.ts
│       │       ├── test-engine.routes.ts
│       │       ├── test-engine.service.ts
│       │       └── test-engine.validators.ts
│       └── scripts/
│           └── seed.ts
├── docs/
│   └── phase-02-test-engine.md
└── frontend/
    └── src/
        └── app/
            ├── core/
            │   ├── models/
            │   │   └── test-engine.models.ts
            │   └── services/
            │       └── test-engine.service.ts
            └── pages/
                └── tests/
                    ├── analytics.page.ts
                    ├── attempt.page.ts
                    ├── catalog.page.ts
                    └── scientific-calculator.component.ts
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

If the `docker` command is missing on your machine, install or open Docker Desktop first.

## Code Snippets

### Angular attempt start and navigation

```ts
const result = await this.testEngineService.startAttempt(test.id);
await this.router.navigateByUrl(`/tests/attempt/${result.detail.attempt.id}`);
```

### Node.js attempt creation

```ts
const attemptInsert = await client.query(
  `INSERT INTO test_attempts (
     user_id,
     test_id,
     duration_minutes,
     total_questions,
     unanswered_count
   )
   VALUES ($1, $2, $3, $4, $4)
   RETURNING id`,
  [userId, testId, test.duration_minutes, test.total_questions]
);
```

### PostgreSQL single in-progress attempt per user and test

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_test_attempt
    ON test_attempts(user_id, test_id)
    WHERE status = 'in_progress';
```

### Analytics aggregation

```ts
const weakAreas = Array.from(topicBuckets.values())
  .map((bucket) => ({
    subjectName: bucket.subjectName,
    topicName: bucket.topicName,
    attempted: bucket.attempted,
    incorrectCount: bucket.incorrect,
    accuracy: bucket.attempted > 0 ? Number(((bucket.correct / bucket.attempted) * 100).toFixed(2)) : 0,
    averageTimeSeconds: bucket.attempted > 0 ? Math.round(bucket.timeSpentSeconds / bucket.attempted) : 0,
  }))
  .sort((left, right) => left.accuracy - right.accuracy);
```

## Production-Ready Practices Used

- The backend owns scoring, correctness, and analytics so the frontend cannot tamper with results.
- Only one in-progress attempt per student per test stays active at a time.
- Answers, notes, review flags, and wrong tags are persisted instead of staying only in browser memory.
- The test catalog is seeded in a rerunnable way so local demos stay predictable.
- The UI keeps a mobile-first layout but still scales to wider screens with side panels.
- The analytics report highlights weak areas by topic instead of showing only raw marks.
- Question data is separated from attempt data so future phases can add adaptive exams and richer tagging.

## Verification

- `backend`: `npm run build` passed
- `frontend`: `npm run build` passed

I could not run Docker-based migration and seed execution inside this shell because `docker` was not available in the environment.
