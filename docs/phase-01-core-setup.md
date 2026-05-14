# Phase 1: Core Setup

This phase establishes the foundation for Gurukool so every later feature has a stable base.

## Implementation Plan

1. Prepare local infrastructure with PostgreSQL and Redis using Docker.
2. Start the Express backend with environment validation, CORS, Helmet, request logging, and Redis-backed rate limiting.
3. Apply PostgreSQL migrations for users, OTP audit records, and single-session enforcement.
4. Support both Google OAuth and mobile OTP login flows.
5. Rotate refresh tokens and invalidate previous sessions when the same user signs in elsewhere.
6. Scaffold the Angular + Ionic + Capacitor frontend with guarded routes and secure token storage.
7. Add a beginner-friendly dashboard that proves protected API access works.
8. Document commands, folder structure, and security decisions before moving to the test engine.

## Folder Structure

```text
gurukool/
├── backend/
│   ├── migrations/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       │   ├── auth/
│       │   ├── session/
│       │   └── user/
│       ├── scripts/
│       ├── types/
│       └── utils/
├── docs/
│   └── phase-01-core-setup.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   └── pages/
│   │   ├── assets/
│   │   ├── environments/
│   │   └── theme/
│   ├── angular.json
│   ├── capacitor.config.ts
│   └── package.json
├── docker-compose.yml
├── package.json
└── README.md
```

## Setup Commands

```bash
docker-compose up -d

copy backend\.env.example backend\.env

npm --prefix backend install
npm --prefix backend run migrate
npm --prefix backend run seed
npm --prefix backend run dev

npm --prefix frontend install
npm --prefix frontend run ionic:serve
```

## Code Snippets

### Angular + Ionic route protection

```ts
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureReady();

  return authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/welcome']);
};
```

### Node.js single active session rotation

```ts
const existingSession = await this.getActiveSession(userId);
if (existingSession) {
  await this.invalidateSession(existingSession.id, existingSession.token_hash);
}

await query(
  `INSERT INTO user_sessions (
     user_id,
     session_identifier,
     token_hash,
     refresh_token_hash,
     device_info,
     is_active,
     expires_at
   )
   VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
  [userId, sessionIdentifier, tokenHash, refreshTokenHash, JSON.stringify(deviceInfo), expiresAt]
);
```

### PostgreSQL session hardening

```sql
ALTER TABLE user_sessions
    ADD COLUMN IF NOT EXISTS session_identifier UUID,
    ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_identifier
    ON user_sessions(session_identifier);
```

### Redis OTP cache

```ts
export const setOTP = async (phone: string, otpHash: string): Promise<void> => {
  await redis.setex(`otp:${phone}`, 300, otpHash);
};
```

## Production-Ready Practices Used

- Hash JWTs before storing them in PostgreSQL or Redis.
- Rotate refresh tokens and bind them to an active session record.
- Keep only one active session per student at a time.
- Validate all incoming auth payloads with Zod.
- Enforce rate limits for OTP and login attempts.
- Use Helmet and strict CORS rules on the backend.
- Keep secrets in `.env` files instead of source code.
- Store frontend tokens with a Capacitor-friendly storage abstraction so web and mobile stay aligned.

## Approval Gate

Phase 1 should stop here for review. After approval, Phase 2 can build the GATE test engine on top of this foundation.
