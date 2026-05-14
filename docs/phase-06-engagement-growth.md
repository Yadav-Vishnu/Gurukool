# Phase 6: Engagement & Growth

This phase adds daily formula revision, XP, streaks, badges, weekly challenges, live quizzes, referrals, and AI mentor mode.

## Implementation Plan

1. Extend PostgreSQL with engagement profiles, formula flashcards, reviews, badges, XP events, challenges, live quizzes, referral rewards, and mentor roadmaps.
2. Seed 10 starter formula cards across Mathematics, Mechanical Engineering, and General Aptitude.
3. Seed starter badges, one weekly challenge, and one live quiz.
4. Add backend APIs under `/api/engagement`.
5. Award XP and update streaks after reviews, challenges, quiz answers, referrals, and mentor generation.
6. Use Redis sorted sets for XP, weekly challenge, and live quiz leaderboards.
7. Build an Ionic Engagement page with flashcards, badges, challenges, quizzes, referrals, and mentor roadmap.
8. Add dashboard navigation and PWA caching for read-heavy engagement endpoints.
9. Verify backend build, frontend build, Docker migration, and live DB/Redis smoke checks.

## Folder Structure

```text
gurukool/
|-- backend/
|   |-- migrations/
|   |   `-- 009_add_engagement_growth.sql
|   `-- src/
|       |-- app.ts
|       `-- modules/
|           `-- engagement/
|               |-- engagement.controller.ts
|               |-- engagement.routes.ts
|               |-- engagement.service.ts
|               `-- engagement.validators.ts
|-- docs/
|   `-- phase-06-engagement-growth.md
|-- frontend/
|   |-- ngsw-config.json
|   `-- src/
|       `-- app/
|           |-- app.routes.ts
|           |-- core/
|           |   |-- models/
|           |   |   `-- engagement.models.ts
|           |   `-- services/
|           |       `-- engagement.service.ts
|           `-- pages/
|               |-- dashboard/
|               |   `-- dashboard.page.ts
|               `-- engagement/
|                   `-- engagement.page.ts
`-- ops/
    `-- phase6-migrate.ps1
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

On this Windows workspace, the elevated migration helper is:

```powershell
Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File C:\Users\VISHNU~1\OneDrive\Desktop\gurukool\ops\phase6-migrate.ps1'
```

## Code Snippets

### Angular formula review

```ts
await this.engagementService.reviewFlashcard(card.id, confidence);
this.successMessage.set(confidence >= 4 ? 'Formula mastered. XP added.' : 'Formula queued for revision.');
await this.refreshDashboardOnly();
```

### Node.js XP and streak update

```ts
await this.updateStreak(userId);
await query(
  `INSERT INTO xp_events (user_id, event_type, points, reason, metadata)
   VALUES ($1, $2, $3, $4, $5::jsonb)`,
  [userId, eventType, points, reason, JSON.stringify(metadata)]
);
```

### PostgreSQL flashcard review

```sql
INSERT INTO user_formula_reviews (
  user_id, formula_id, confidence, review_count, last_reviewed_at, next_due_at
)
VALUES ($1, $2, $3, 1, NOW(), NOW() + ($4::int * INTERVAL '1 day'))
ON CONFLICT (user_id, formula_id)
DO UPDATE SET confidence = EXCLUDED.confidence,
              review_count = user_formula_reviews.review_count + 1,
              last_reviewed_at = NOW(),
              next_due_at = NOW() + ($4::int * INTERVAL '1 day');
```

### Redis leaderboard

```ts
await redis.zincrby('engagement:xp:leaderboard', points, userId);
await redis.zincrby(`live:quiz:${quizId}:leaderboard`, pointsAwarded, userId);
```

### AI mentor mode

```ts
const focusSummary =
  weakAreas.length > 0
    ? `Focus on ${primaryFocus}. Your recent attempts show this as the highest-return revision area.`
    : 'Start with formula consistency and one short mock.';
```

## Production-Ready Practices Used

- All personalized engagement APIs require the existing authenticated session.
- Formula reviews use spaced-repetition-style due dates based on confidence.
- XP events are append-only for auditability.
- Streak logic is server-side so clients cannot fake daily activity.
- Badges are awarded idempotently with unique user/badge constraints.
- Redis leaderboards are best-effort mirrors; PostgreSQL remains the source of truth.
- Referral rewards prevent self-referrals and duplicate referral awards.
- Live quiz responses are one answer per question per user.
- AI mentor mode is local rule-based v1, so private study data does not leave the app.
- Mentor roadmaps store generated inputs for transparency and future improvement.

## Verification

Run these after applying Phase 6:

```bash
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix backend run migrate
```

The migration is additive and runs after Phase 1-5 migrations.
