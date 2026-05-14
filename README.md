# Gurukool

Cross-platform educational platform for GATE, PSU, and ESE preparation.

## Phase Status

Phases completed in this repository:

- Phase 1: Angular + Ionic + Capacitor frontend with guarded routes and PWA basics
- Phase 1: Node.js + Express backend with PostgreSQL and Redis integration
- Phase 1: Google OAuth + mobile OTP authentication flows with single active session enforcement
- Phase 2: GATE test catalog, runner, timer, palette, notes, wrong-answer tags, and analytics
- Phase 3: Multi-exam expansion with PSU/ESE tagging, advanced filters, adaptive mocks, and exam-wise analytics
- Phase 4: Books & Notes with PDF upload, subject detection, notebook highlights, paraphrasing, and offline sync
- Phase 5: Community collaboration with question forums, peer requests, WebRTC audio signaling, calendar scheduling, reminders, and notifications
- Phase 6: Engagement and growth with daily formula flashcards, XP, streaks, badges, live quizzes, referrals, and AI mentor roadmaps
- Phase 7: Scalability and market growth with Docker/Kubernetes deployment assets, institution-hosted tests, release readiness, and AI-assisted moderation

Phase notes:

- [Phase 1 Core Setup](/C:/Users/Vishnu's%20PC/OneDrive/Desktop/gurukool/docs/phase-01-core-setup.md)
- [Phase 2 Test Engine](/C:/Users/Vishnu's%20PC/OneDrive/Desktop/gurukool/docs/phase-02-test-engine.md)
- [Phase 3 Multi-Exam Expansion](/C:/Users/Vishnu's%20PC/OneDrive/Desktop/gurukool/docs/phase-03-multi-exam-expansion.md)
- [Phase 4 Books & Notes](/C:/Users/Vishnu's%20PC/OneDrive/Desktop/gurukool/docs/phase-04-books-notes.md)
- [Phase 5 Community & Collaboration](/C:/Users/Vishnu's%20PC/OneDrive/Desktop/gurukool/docs/phase-05-community-collaboration.md)
- [Phase 6 Engagement & Growth](/C:/Users/Vishnu's%20PC/OneDrive/Desktop/gurukool/docs/phase-06-engagement-growth.md)
- [Phase 7 Scalability & Market Growth](/C:/Users/Vishnu's%20PC/OneDrive/Desktop/gurukool/docs/phase-07-scalability-market-growth.md)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular + Ionic + Capacitor |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | Google OAuth 2.0 + Mobile OTP |
| Payments | Razorpay / Stripe |

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Configure backend secrets

```bash
copy backend\.env.example backend\.env
```

Edit `backend/.env` with your Google OAuth and SMS provider credentials.
If the `docker` command is unavailable, install or open Docker Desktop first.

### 3. Install and run backend

```bash
npm --prefix backend install
npm --prefix backend run migrate
npm --prefix backend run seed
npm --prefix backend run dev
```

### 4. Install and run frontend

```bash
npm --prefix frontend install
npm --prefix frontend run ionic:serve
```

## Project Structure

```text
gurukool/
|-- backend/
|-- docs/
|-- frontend/
|-- docker-compose.yml
`-- package.json
```

## License

Private. All rights reserved.
