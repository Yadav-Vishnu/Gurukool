# Phase 5: Community & Collaboration

This phase adds question discussions, peer connections, secure audio-call signaling, study-session scheduling, rescheduling, reminders, notifications, and calendar sync queueing.

## Implementation Plan

1. Extend PostgreSQL with collaboration tables:
   - question discussion threads
   - discussion posts
   - peer connection requests
   - collaboration calendar events
   - reschedule requests
   - audio call rooms
   - external calendar sync records
   - notifications and reminders
2. Add protected backend APIs under `/api/community`.
3. Use Redis for ephemeral WebRTC signaling messages, notification jobs, calendar sync jobs, and reminder due queues.
4. Build an Ionic Community page with:
   - question forum per tagged question
   - peer search and request/accept workflow
   - WebRTC audio call controls
   - study calendar proposal and confirmation flow
   - rescheduling workflow
   - Google/Outlook sync queue actions
   - notifications list
5. Wire Community into guarded Angular routing and dashboard navigation.
6. Add PWA caching for read-heavy community endpoints.
7. Verify backend build, frontend build, Docker migration, and live database access.

## Folder Structure

```text
gurukool/
|-- backend/
|   |-- migrations/
|   |   `-- 008_add_community_collaboration.sql
|   `-- src/
|       |-- app.ts
|       `-- modules/
|           `-- community/
|               |-- community.controller.ts
|               |-- community.routes.ts
|               |-- community.service.ts
|               `-- community.validators.ts
|-- docs/
|   `-- phase-05-community-collaboration.md
|-- frontend/
|   |-- ngsw-config.json
|   `-- src/
|       `-- app/
|           |-- app.routes.ts
|           |-- core/
|           |   |-- models/
|           |   |   `-- community.models.ts
|           |   `-- services/
|           |       `-- community.service.ts
|           `-- pages/
|               |-- community/
|               |   `-- community.page.ts
|               `-- dashboard/
|                   `-- dashboard.page.ts
`-- ops/
    `-- phase5-migrate.ps1
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
Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File C:\Users\VISHNU~1\OneDrive\Desktop\gurukool\ops\phase5-migrate.ps1'
```

## Code Snippets

### Angular question discussion

```ts
const discussion = await this.communityService.getQuestionDiscussion(questionId);
this.selectedDiscussion.set(discussion);

await this.communityService.createDiscussionPost(questionId, content);
await this.selectQuestion(questionId);
```

### Angular WebRTC signaling

```ts
const call = await this.communityService.createAudioCall({ peerUserId });
await this.preparePeerConnection(call);

const offer = await this.peerConnection!.createOffer();
await this.peerConnection!.setLocalDescription(offer);

await this.communityService.sendCallSignal(call.id, 'offer', {
  description: {
    type: this.peerConnection!.localDescription?.type,
    sdp: this.peerConnection!.localDescription?.sdp,
  },
});
```

### Node.js authenticated signaling via Redis

```ts
const message = {
  id: randomUUID(),
  callId,
  senderUserId: userId,
  messageType: input.messageType,
  payload: input.payload,
  createdAt: new Date().toISOString(),
};

await redis.rpush(`webrtc:call:${callId}:signals`, JSON.stringify(message));
await redis.expire(`webrtc:call:${callId}:signals`, 60 * 60);
```

### Node.js study-session confirmation

```ts
const requesterConfirmed =
  event.requester_user_id === userId ? true : Boolean(event.requester_confirmed);
const inviteeConfirmed =
  event.invitee_user_id === userId ? true : Boolean(event.invitee_confirmed);
const status = requesterConfirmed && inviteeConfirmed ? 'confirmed' : 'proposed';
```

### PostgreSQL discussion and calendar schema

```sql
CREATE TABLE IF NOT EXISTS question_discussion_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    exam_code exam_code,
    company_name VARCHAR(120),
    paper_code VARCHAR(120),
    exam_year INT,
    UNIQUE(question_id)
);

CREATE TABLE IF NOT EXISTS collaboration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status collaboration_event_status NOT NULL DEFAULT 'proposed',
    CHECK (ends_at > starts_at)
);
```

### Redis reminder queue

```ts
await redis.zadd(
  'calendar:reminders',
  Math.floor(reminderAt.getTime() / 1000),
  JSON.stringify({ reminderId, eventId, userId, remindAt: reminderAt.toISOString() })
);
```

## Production-Ready Practices Used

- All community APIs are protected by existing JWT session validation.
- Discussion threads inherit exam/company/year metadata from question tags.
- Peer-to-peer actions require an accepted connection before scheduling or audio calls.
- WebRTC signaling is stored only temporarily in Redis with a TTL.
- Audio calls use browser WebRTC media capture; Gurukool handles signaling, not audio transport.
- Calendar confirmation requires both students before the event becomes confirmed.
- Reschedule requests preserve an explicit accept/decline workflow.
- Calendar sync actions create auditable provider-specific queue records for Google/Outlook workers.
- Notifications are persisted in PostgreSQL and queued in Redis for future push/email workers.
- Reminders are persisted and mirrored into a Redis sorted set for efficient due-time processing.
- The frontend uses Angular interpolation for discussion text, avoiding unsafe HTML rendering.

## Verification

Run these after applying Phase 5:

```bash
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix backend run migrate
```

The migration is additive and runs after Phase 1-4 migrations.
