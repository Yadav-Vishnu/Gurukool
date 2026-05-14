import { randomUUID } from 'crypto';
import { query } from '../../config/database';
import { redis } from '../../config/redis';
import { ApiError } from '../../middleware/error-handler';
import { ContentModerationService } from '../platform/content-moderation.service';

type PeerAction = 'accept' | 'decline' | 'block';
type CalendarProvider = 'google' | 'outlook';
type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'hangup';

type PeerRequestInput = {
  peerUserId: string;
  message?: string;
};

type EventInput = {
  peerUserId: string;
  title: string;
  agenda?: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
};

type RescheduleInput = {
  startsAt: string;
  endsAt: string;
  timezone: string;
  reason?: string;
};

type AudioCallInput = {
  peerUserId?: string;
  connectionId?: string;
  eventId?: string;
};

type SignalInput = {
  messageType: SignalType;
  payload: Record<string, unknown>;
};

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};

const parseDate = (value: string, fieldName: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(`${fieldName} must be a valid date/time.`, 400);
  }

  return date;
};

const ensureFutureRange = (startsAt: Date, endsAt: Date): void => {
  if (endsAt <= startsAt) {
    throw new ApiError('End time must be after start time.', 400);
  }

  const durationMs = endsAt.getTime() - startsAt.getTime();
  if (durationMs > 6 * 60 * 60 * 1000) {
    throw new ApiError('Collaboration sessions can be at most 6 hours.', 400);
  }
};

const mapUser = (row: any, prefix = '') => ({
  id: row[`${prefix}id`],
  fullName: row[`${prefix}full_name`],
  avatarUrl: row[`${prefix}avatar_url`] ?? null,
});

const mapQuestion = (row: any) => ({
  id: row.id,
  prompt: row.prompt,
  subject: {
    code: row.subject_code,
    name: row.subject_name,
  },
  topic: row.topic_name
    ? {
        name: row.topic_name,
        slug: row.topic_slug,
      }
    : null,
  sourceTag: {
    examCode: row.exam_code ?? 'GATE',
    companyName: row.company_name ?? null,
    paperCode: row.paper_code ?? null,
    examYear: row.exam_year ?? null,
    isPyq: Boolean(row.is_pyq),
  },
  discussionCount: Number(row.discussion_count ?? 0),
});

const mapPost = (row: any) => ({
  id: row.id,
  parentPostId: row.parent_post_id ?? null,
  content: row.content,
  isDeleted: Boolean(row.is_deleted),
  createdAt: row.created_at,
  author: {
    id: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url ?? null,
  },
});

const mapConnection = (row: any, currentUserId: string) => {
  const requester = {
    id: row.requester_user_id,
    fullName: row.requester_full_name,
    avatarUrl: row.requester_avatar_url ?? null,
  };
  const addressee = {
    id: row.addressee_user_id,
    fullName: row.addressee_full_name,
    avatarUrl: row.addressee_avatar_url ?? null,
  };

  return {
    id: row.id,
    status: row.status,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
    requester,
    addressee,
    peer: row.requester_user_id === currentUserId ? addressee : requester,
    direction: row.requester_user_id === currentUserId ? 'outgoing' : 'incoming',
  };
};

const mapEvent = (row: any, currentUserId: string) => ({
  id: row.id,
  title: row.title,
  agenda: row.agenda ?? null,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  timezone: row.timezone,
  status: row.status,
  requesterConfirmed: Boolean(row.requester_confirmed),
  inviteeConfirmed: Boolean(row.invitee_confirmed),
  myRole: row.requester_user_id === currentUserId ? 'requester' : 'invitee',
  peer: row.requester_user_id === currentUserId
    ? {
        id: row.invitee_user_id,
        fullName: row.invitee_full_name,
        avatarUrl: row.invitee_avatar_url ?? null,
      }
    : {
        id: row.requester_user_id,
        fullName: row.requester_full_name,
        avatarUrl: row.requester_avatar_url ?? null,
      },
  pendingReschedule: row.reschedule_id
    ? {
        id: row.reschedule_id,
        requestedByUserId: row.reschedule_requested_by_user_id,
        proposedStartsAt: row.proposed_starts_at,
        proposedEndsAt: row.proposed_ends_at,
        timezone: row.reschedule_timezone,
        reason: row.reschedule_reason,
        status: row.reschedule_status,
      }
    : null,
});

const mapCall = (row: any, currentUserId: string) => ({
  id: row.id,
  status: row.status,
  roomKey: row.room_key,
  eventId: row.event_id ?? null,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  createdAt: row.created_at,
  peer: row.caller_user_id === currentUserId
    ? {
        id: row.callee_user_id,
        fullName: row.callee_full_name,
        avatarUrl: row.callee_avatar_url ?? null,
      }
    : {
        id: row.caller_user_id,
        fullName: row.caller_full_name,
        avatarUrl: row.caller_avatar_url ?? null,
      },
  myRole: row.caller_user_id === currentUserId ? 'caller' : 'callee',
});

const mapNotification = (row: any) => ({
  id: row.id,
  notificationType: row.notification_type,
  title: row.title,
  body: row.body,
  channel: row.channel,
  entityType: row.entity_type ?? null,
  entityId: row.entity_id ?? null,
  isRead: Boolean(row.is_read),
  deliverAfter: row.deliver_after,
  createdAt: row.created_at,
  actor: row.actor_user_id
    ? {
        id: row.actor_user_id,
        fullName: row.actor_full_name,
        avatarUrl: row.actor_avatar_url ?? null,
      }
    : null,
});

export class CommunityService {
  private readonly moderationService = new ContentModerationService();

  async listDiscussionQuestions(search?: string) {
    const result = await query(
      `SELECT
         questions.id,
         questions.prompt,
         subjects.code AS subject_code,
         subjects.name AS subject_name,
         topics.slug AS topic_slug,
         topics.name AS topic_name,
         COALESCE(source_tag.exam_code::text, 'GATE') AS exam_code,
         source_tag.company_name,
         source_tag.paper_code,
         source_tag.exam_year,
         COALESCE(source_tag.is_pyq, TRUE) AS is_pyq,
         COALESCE(post_count.discussion_count, 0) AS discussion_count
       FROM questions
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       LEFT JOIN LATERAL (
         SELECT exam_code, company_name, paper_code, exam_year, is_pyq
         FROM question_exam_tags
         WHERE question_exam_tags.question_id = questions.id
         ORDER BY exam_year DESC NULLS LAST
         LIMIT 1
       ) AS source_tag ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(posts.id)::int AS discussion_count
         FROM question_discussion_threads AS threads
         LEFT JOIN discussion_posts AS posts ON posts.thread_id = threads.id
         WHERE threads.question_id = questions.id
       ) AS post_count ON TRUE
       WHERE ($1::text IS NULL
          OR questions.prompt ILIKE '%' || $1::text || '%'
          OR subjects.name ILIKE '%' || $1::text || '%'
          OR topics.name ILIKE '%' || $1::text || '%'
          OR source_tag.company_name ILIKE '%' || $1::text || '%'
          OR source_tag.paper_code ILIKE '%' || $1::text || '%')
       ORDER BY post_count.discussion_count DESC, questions.created_at DESC
       LIMIT 40`,
      [search?.trim() || null]
    );

    return result.rows.map(mapQuestion);
  }

  async getQuestionDiscussion(userId: string, questionId: string) {
    const question = await this.getQuestionMetadata(questionId);
    const thread = await this.ensureThread(userId, questionId);
    const postsResult = await query(
      `SELECT posts.*, users.full_name, users.avatar_url
       FROM discussion_posts AS posts
       INNER JOIN users ON users.id = posts.user_id
       WHERE posts.thread_id = $1
       ORDER BY posts.created_at ASC
       LIMIT 300`,
      [thread.id]
    );

    return {
      thread: {
        id: thread.id,
        questionId,
        createdAt: thread.created_at,
      },
      question,
      posts: postsResult.rows.map(mapPost),
    };
  }

  async createDiscussionPost(
    userId: string,
    questionId: string,
    input: { content: string; parentPostId?: string }
  ) {
    await this.getQuestionMetadata(questionId);
    const thread = await this.ensureThread(userId, questionId);

    if (input.parentPostId) {
      const parent = await query(
        `SELECT id
         FROM discussion_posts
         WHERE id = $1 AND thread_id = $2
         LIMIT 1`,
        [input.parentPostId, thread.id]
      );

      if (!parent.rows[0]) {
        throw new ApiError('Parent discussion post was not found in this thread.', 404);
      }
    }

    const inserted = await query(
      `INSERT INTO discussion_posts (thread_id, user_id, parent_post_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [thread.id, userId, input.parentPostId ?? null, input.content]
    );

    const moderation = await this.moderationService.autoReviewContent({
      submittedByUserId: userId,
      contentType: 'discussion_post',
      contentId: inserted.rows[0].id,
      contentExcerpt: input.content,
      source: 'question_discussion',
    });
    const shouldHide = moderation.recommendedAction === 'hide_content'
      && moderation.riskScore >= 0.75;

    await query(
      `UPDATE discussion_posts
       SET is_deleted = CASE WHEN $1::boolean THEN TRUE ELSE is_deleted END,
           metadata = metadata || $2::jsonb,
           updated_at = NOW()
       WHERE id = $3`,
      [
        shouldHide,
        JSON.stringify({
          moderation: {
            riskScore: moderation.riskScore,
            severity: moderation.severity,
            label: moderation.label,
            recommendedAction: moderation.recommendedAction,
          },
        }),
        inserted.rows[0].id,
      ]
    );
    inserted.rows[0].is_deleted = Boolean(inserted.rows[0].is_deleted || shouldHide);

    const participants = await query(
      `SELECT DISTINCT user_id
       FROM discussion_posts
       WHERE thread_id = $1 AND user_id <> $2
       LIMIT 50`,
      [thread.id, userId]
    );

    await Promise.all(
      participants.rows.map((row) =>
        this.createNotification({
          userId: row.user_id,
          actorUserId: userId,
          notificationType: 'discussion_reply',
          title: 'New discussion reply',
          body: 'A peer replied in a question discussion you joined.',
          entityType: 'question_discussion',
          entityId: thread.id,
        })
      )
    );

    const user = await query(
      `SELECT id AS user_id, full_name, avatar_url
       FROM users
       WHERE id = $1`,
      [userId]
    );

    return mapPost({
      ...inserted.rows[0],
      full_name: user.rows[0]?.full_name,
      avatar_url: user.rows[0]?.avatar_url,
    });
  }

  async searchPeers(userId: string, search?: string) {
    const result = await query(
      `SELECT
         users.id,
         users.full_name,
         users.avatar_url,
         peer_state.id AS connection_id,
         peer_state.status AS connection_status
       FROM users
       LEFT JOIN LATERAL (
         SELECT id, status
         FROM peer_connections
         WHERE (requester_user_id = $1 AND addressee_user_id = users.id)
            OR (requester_user_id = users.id AND addressee_user_id = $1)
         ORDER BY created_at DESC
         LIMIT 1
       ) AS peer_state ON TRUE
       WHERE users.id <> $1
         AND users.is_active = TRUE
         AND ($2::text IS NULL
          OR users.full_name ILIKE '%' || $2::text || '%'
          OR users.email ILIKE '%' || $2::text || '%')
       ORDER BY users.full_name ASC
       LIMIT 30`,
      [userId, search?.trim() || null]
    );

    return result.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url ?? null,
      connectionId: row.connection_id ?? null,
      connectionStatus: row.connection_status ?? null,
    }));
  }

  async listPeerConnections(userId: string) {
    const result = await query(
      `SELECT
         connections.*,
         requester.full_name AS requester_full_name,
         requester.avatar_url AS requester_avatar_url,
         addressee.full_name AS addressee_full_name,
         addressee.avatar_url AS addressee_avatar_url
       FROM peer_connections AS connections
       INNER JOIN users AS requester ON requester.id = connections.requester_user_id
       INNER JOIN users AS addressee ON addressee.id = connections.addressee_user_id
       WHERE connections.requester_user_id = $1 OR connections.addressee_user_id = $1
       ORDER BY
         CASE connections.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END,
         connections.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => mapConnection(row, userId));
  }

  async requestPeerConnection(userId: string, input: PeerRequestInput) {
    if (userId === input.peerUserId) {
      throw new ApiError('You cannot connect with yourself.', 400);
    }

    const peer = await query(
      `SELECT id, full_name
       FROM users
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1`,
      [input.peerUserId]
    );

    if (!peer.rows[0]) {
      throw new ApiError('Peer user was not found.', 404);
    }

    const existing = await query(
      `SELECT *
       FROM peer_connections
       WHERE (requester_user_id = $1 AND addressee_user_id = $2)
          OR (requester_user_id = $2 AND addressee_user_id = $1)
       LIMIT 1`,
      [userId, input.peerUserId]
    );

    if (existing.rows[0]) {
      const status = existing.rows[0].status;
      if (status === 'pending' || status === 'accepted') {
        return existing.rows[0];
      }

      throw new ApiError(`This peer connection is already ${status}.`, 400);
    }

    const inserted = await query(
      `INSERT INTO peer_connections (
         requester_user_id,
         addressee_user_id,
         metadata
       )
       VALUES ($1, $2, $3::jsonb)
       RETURNING *`,
      [
        userId,
        input.peerUserId,
        JSON.stringify({
          requestMessage: input.message ?? null,
        }),
      ]
    );

    await this.createNotification({
      userId: input.peerUserId,
      actorUserId: userId,
      notificationType: 'peer_request',
      title: 'New peer request',
      body: 'A student wants to connect with you on Gurukool.',
      entityType: 'peer_connection',
      entityId: inserted.rows[0].id,
    });

    return inserted.rows[0];
  }

  async respondPeerConnection(userId: string, connectionId: string, action: PeerAction) {
    const status = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'blocked';
    const updated = await query(
      `UPDATE peer_connections
       SET status = $1::peer_connection_status,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = $2 AND addressee_user_id = $3 AND status = 'pending'
       RETURNING *`,
      [status, connectionId, userId]
    );

    const connection = updated.rows[0];
    if (!connection) {
      throw new ApiError('Pending peer request was not found for this user.', 404);
    }

    if (status === 'accepted') {
      await this.createNotification({
        userId: connection.requester_user_id,
        actorUserId: userId,
        notificationType: 'peer_accepted',
        title: 'Peer request accepted',
        body: 'Your peer request was accepted. You can now schedule study sessions.',
        entityType: 'peer_connection',
        entityId: connection.id,
      });
    }

    return connection;
  }

  async listCalendarEvents(userId: string) {
    const result = await query(
      `SELECT
         events.*,
         requester.full_name AS requester_full_name,
         requester.avatar_url AS requester_avatar_url,
         invitee.full_name AS invitee_full_name,
         invitee.avatar_url AS invitee_avatar_url,
         pending_reschedule.id AS reschedule_id,
         pending_reschedule.requested_by_user_id AS reschedule_requested_by_user_id,
         pending_reschedule.proposed_starts_at,
         pending_reschedule.proposed_ends_at,
         pending_reschedule.timezone AS reschedule_timezone,
         pending_reschedule.reason AS reschedule_reason,
         pending_reschedule.status AS reschedule_status
       FROM collaboration_events AS events
       INNER JOIN users AS requester ON requester.id = events.requester_user_id
       INNER JOIN users AS invitee ON invitee.id = events.invitee_user_id
       LEFT JOIN LATERAL (
         SELECT *
         FROM event_reschedule_requests
         WHERE event_id = events.id AND status = 'pending'
         ORDER BY created_at DESC
         LIMIT 1
       ) AS pending_reschedule ON TRUE
       WHERE events.requester_user_id = $1 OR events.invitee_user_id = $1
       ORDER BY events.starts_at DESC
       LIMIT 120`,
      [userId]
    );

    return result.rows.map((row) => mapEvent(row, userId));
  }

  async proposeEvent(userId: string, input: EventInput) {
    const startsAt = parseDate(input.startsAt, 'startsAt');
    const endsAt = parseDate(input.endsAt, 'endsAt');
    ensureFutureRange(startsAt, endsAt);

    const connection = await this.getAcceptedPeerConnection(userId, input.peerUserId);

    const inserted = await query(
      `INSERT INTO collaboration_events (
         requester_user_id,
         invitee_user_id,
         peer_connection_id,
         title,
         agenda,
         starts_at,
         ends_at,
         timezone,
         last_proposed_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $1)
       RETURNING *`,
      [
        userId,
        input.peerUserId,
        connection.id,
        input.title,
        input.agenda ?? null,
        startsAt,
        endsAt,
        input.timezone,
      ]
    );

    await this.createNotification({
      userId: input.peerUserId,
      actorUserId: userId,
      notificationType: 'calendar_proposal',
      title: 'New study session proposal',
      body: `${input.title} was proposed for ${toIso(startsAt)}.`,
      entityType: 'collaboration_event',
      entityId: inserted.rows[0].id,
    });

    return inserted.rows[0];
  }

  async confirmEvent(userId: string, eventId: string) {
    const event = await this.getEventForUser(userId, eventId);
    if (event.status === 'cancelled' || event.status === 'completed') {
      throw new ApiError('This calendar event can no longer be confirmed.', 400);
    }

    const requesterConfirmed =
      event.requester_user_id === userId ? true : Boolean(event.requester_confirmed);
    const inviteeConfirmed =
      event.invitee_user_id === userId ? true : Boolean(event.invitee_confirmed);
    const status = requesterConfirmed && inviteeConfirmed ? 'confirmed' : 'proposed';

    const updated = await query(
      `UPDATE collaboration_events
       SET requester_confirmed = $1,
           invitee_confirmed = $2,
           status = $3::collaboration_event_status,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [requesterConfirmed, inviteeConfirmed, status, eventId]
    );

    const otherUserId = event.requester_user_id === userId
      ? event.invitee_user_id
      : event.requester_user_id;

    await this.createNotification({
      userId: otherUserId,
      actorUserId: userId,
      notificationType: 'calendar_confirmed',
      title: status === 'confirmed' ? 'Study session confirmed' : 'Study session updated',
      body:
        status === 'confirmed'
          ? 'Both students confirmed the study session.'
          : 'A student confirmed the proposed study session.',
      entityType: 'collaboration_event',
      entityId: eventId,
    });

    if (status === 'confirmed') {
      await this.scheduleEventReminders(updated.rows[0]);
    }

    return updated.rows[0];
  }

  async requestReschedule(userId: string, eventId: string, input: RescheduleInput) {
    const event = await this.getEventForUser(userId, eventId);
    const startsAt = parseDate(input.startsAt, 'startsAt');
    const endsAt = parseDate(input.endsAt, 'endsAt');
    ensureFutureRange(startsAt, endsAt);

    const inserted = await query(
      `INSERT INTO event_reschedule_requests (
         event_id,
         requested_by_user_id,
         proposed_starts_at,
         proposed_ends_at,
         timezone,
         reason
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [eventId, userId, startsAt, endsAt, input.timezone, input.reason ?? null]
    );

    await query(
      `UPDATE collaboration_events
       SET status = 'reschedule_requested',
           requester_confirmed = $2,
           invitee_confirmed = $3,
           last_proposed_by = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [
        eventId,
        event.requester_user_id === userId,
        event.invitee_user_id === userId,
        userId,
      ]
    );

    const otherUserId = event.requester_user_id === userId
      ? event.invitee_user_id
      : event.requester_user_id;
    await this.createNotification({
      userId: otherUserId,
      actorUserId: userId,
      notificationType: 'calendar_reschedule',
      title: 'Reschedule requested',
      body: 'A peer requested a new time for your study session.',
      entityType: 'event_reschedule',
      entityId: inserted.rows[0].id,
    });

    return inserted.rows[0];
  }

  async respondReschedule(userId: string, requestId: string, action: 'accept' | 'decline') {
    const result = await query(
      `SELECT requests.*, events.requester_user_id, events.invitee_user_id
       FROM event_reschedule_requests AS requests
       INNER JOIN collaboration_events AS events ON events.id = requests.event_id
       WHERE requests.id = $1
         AND requests.status = 'pending'
         AND (events.requester_user_id = $2 OR events.invitee_user_id = $2)
       LIMIT 1`,
      [requestId, userId]
    );

    const request = result.rows[0];
    if (!request) {
      throw new ApiError('Pending reschedule request was not found.', 404);
    }

    if (request.requested_by_user_id === userId) {
      throw new ApiError('The other student must respond to this reschedule request.', 403);
    }

    const status = action === 'accept' ? 'accepted' : 'declined';
    await query(
      `UPDATE event_reschedule_requests
       SET status = $1,
           responded_by_user_id = $2,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [status, userId, requestId]
    );

    if (action === 'accept') {
      const updatedEvent = await query(
        `UPDATE collaboration_events
         SET starts_at = $1,
             ends_at = $2,
             timezone = $3,
             requester_confirmed = TRUE,
             invitee_confirmed = TRUE,
             status = 'confirmed',
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [
          request.proposed_starts_at,
          request.proposed_ends_at,
          request.timezone,
          request.event_id,
        ]
      );

      await this.scheduleEventReminders(updatedEvent.rows[0]);
    } else {
      await query(
        `UPDATE collaboration_events
         SET status = 'proposed',
             updated_at = NOW()
         WHERE id = $1`,
        [request.event_id]
      );
    }

    await this.createNotification({
      userId: request.requested_by_user_id,
      actorUserId: userId,
      notificationType: 'calendar_reschedule_response',
      title: action === 'accept' ? 'Reschedule accepted' : 'Reschedule declined',
      body:
        action === 'accept'
          ? 'Your peer accepted the new study session time.'
          : 'Your peer declined the proposed reschedule time.',
      entityType: 'collaboration_event',
      entityId: request.event_id,
    });

    return { id: requestId, status };
  }

  async syncCalendarEvent(
    userId: string,
    eventId: string,
    provider: CalendarProvider,
    externalEventId?: string
  ) {
    await this.getEventForUser(userId, eventId);

    const upsert = await query(
      `INSERT INTO external_calendar_syncs (
         event_id,
         user_id,
         provider,
         status,
         external_event_id,
         metadata
       )
       VALUES ($1, $2, $3::calendar_provider, 'queued', $4, $5::jsonb)
       ON CONFLICT (event_id, user_id, provider)
       DO UPDATE SET status = 'queued',
                     external_event_id = EXCLUDED.external_event_id,
                     last_error = NULL,
                     updated_at = NOW()
       RETURNING *`,
      [
        eventId,
        userId,
        provider,
        externalEventId ?? null,
        JSON.stringify({
          queuedAt: new Date().toISOString(),
          note: 'Provider OAuth worker can process this queue item.',
        }),
      ]
    );

    await this.pushRedis('calendar:sync:queue', {
      syncId: upsert.rows[0].id,
      eventId,
      userId,
      provider,
      externalEventId: externalEventId ?? null,
      queuedAt: new Date().toISOString(),
    });

    await this.createNotification({
      userId,
      actorUserId: userId,
      notificationType: 'calendar_sync_queued',
      title: 'Calendar sync queued',
      body: `Your ${provider} calendar sync was queued.`,
      entityType: 'collaboration_event',
      entityId: eventId,
    });

    return upsert.rows[0];
  }

  async listAudioCalls(userId: string) {
    const result = await query(
      `SELECT
         calls.*,
         caller.full_name AS caller_full_name,
         caller.avatar_url AS caller_avatar_url,
         callee.full_name AS callee_full_name,
         callee.avatar_url AS callee_avatar_url
       FROM audio_call_rooms AS calls
       INNER JOIN users AS caller ON caller.id = calls.caller_user_id
       INNER JOIN users AS callee ON callee.id = calls.callee_user_id
       WHERE calls.caller_user_id = $1 OR calls.callee_user_id = $1
       ORDER BY calls.created_at DESC
       LIMIT 30`,
      [userId]
    );

    return result.rows.map((row) => mapCall(row, userId));
  }

  async createAudioCall(userId: string, input: AudioCallInput) {
    const target = await this.resolveCallTarget(userId, input);
    const inserted = await query(
      `INSERT INTO audio_call_rooms (
         caller_user_id,
         callee_user_id,
         peer_connection_id,
         event_id,
         room_key,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        userId,
        target.peerUserId,
        target.connectionId,
        input.eventId ?? null,
        randomUUID().replace(/-/g, ''),
        JSON.stringify({
          signaling: 'authenticated-rest-polling',
          createdVia: input.eventId ? 'calendar_event' : 'peer_connection',
        }),
      ]
    );

    await this.createNotification({
      userId: target.peerUserId,
      actorUserId: userId,
      notificationType: 'audio_call',
      title: 'Incoming audio call',
      body: 'A peer started a secure Gurukool audio call.',
      entityType: 'audio_call',
      entityId: inserted.rows[0].id,
    });

    return inserted.rows[0];
  }

  async sendCallSignal(userId: string, callId: string, input: SignalInput) {
    await this.getCallForUser(userId, callId);

    const message = {
      id: randomUUID(),
      callId,
      senderUserId: userId,
      messageType: input.messageType,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };

    if (input.messageType === 'answer') {
      await query(
        `UPDATE audio_call_rooms
         SET status = 'active',
             started_at = COALESCE(started_at, NOW()),
             updated_at = NOW()
         WHERE id = $1`,
        [callId]
      );
    }

    if (input.messageType === 'hangup') {
      await query(
        `UPDATE audio_call_rooms
         SET status = 'ended',
             ended_at = COALESCE(ended_at, NOW()),
             updated_at = NOW()
         WHERE id = $1`,
        [callId]
      );
    }

    await this.pushRedis(`webrtc:call:${callId}:signals`, message, 60 * 60);
    return message;
  }

  async listCallSignals(userId: string, callId: string, after?: string) {
    await this.getCallForUser(userId, callId);
    const key = `webrtc:call:${callId}:signals`;
    let rows: string[] = [];

    try {
      rows = await redis.lrange(key, -100, -1);
    } catch {
      rows = [];
    }

    const afterDate = after ? new Date(after) : null;
    const afterTime = afterDate && !Number.isNaN(afterDate.getTime()) ? afterDate.getTime() : 0;

    return rows
      .map((row) => {
        try {
          return JSON.parse(row) as {
            id: string;
            senderUserId: string;
            messageType: SignalType;
            payload: Record<string, unknown>;
            createdAt: string;
          };
        } catch {
          return null;
        }
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .filter((row) => row.senderUserId !== userId)
      .filter((row) => new Date(row.createdAt).getTime() > afterTime);
  }

  async listNotifications(userId: string) {
    const result = await query(
      `SELECT
         notifications.*,
         actor.full_name AS actor_full_name,
         actor.avatar_url AS actor_avatar_url
       FROM collaboration_notifications AS notifications
       LEFT JOIN users AS actor ON actor.id = notifications.actor_user_id
       WHERE notifications.user_id = $1
       ORDER BY notifications.created_at DESC
       LIMIT 80`,
      [userId]
    );

    return result.rows.map(mapNotification);
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const updated = await query(
      `UPDATE collaboration_notifications
       SET is_read = TRUE,
           delivered_at = COALESCE(delivered_at, NOW())
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );

    if (!updated.rows[0]) {
      throw new ApiError('Notification was not found for this user.', 404);
    }

    return { id: notificationId, isRead: true };
  }

  private async getQuestionMetadata(questionId: string) {
    const result = await query(
      `SELECT
         questions.id,
         questions.prompt,
         subjects.code AS subject_code,
         subjects.name AS subject_name,
         topics.slug AS topic_slug,
         topics.name AS topic_name,
         COALESCE(source_tag.exam_code::text, 'GATE') AS exam_code,
         source_tag.company_name,
         source_tag.paper_code,
         source_tag.exam_year,
         COALESCE(source_tag.is_pyq, TRUE) AS is_pyq,
         0 AS discussion_count
       FROM questions
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       LEFT JOIN LATERAL (
         SELECT exam_code, company_name, paper_code, exam_year, is_pyq
         FROM question_exam_tags
         WHERE question_exam_tags.question_id = questions.id
         ORDER BY exam_year DESC NULLS LAST
         LIMIT 1
       ) AS source_tag ON TRUE
       WHERE questions.id = $1
       LIMIT 1`,
      [questionId]
    );

    if (!result.rows[0]) {
      throw new ApiError('Question was not found.', 404);
    }

    return mapQuestion(result.rows[0]);
  }

  private async ensureThread(userId: string, questionId: string) {
    const question = await query(
      `SELECT
         COALESCE(source_tag.exam_code::text, 'GATE') AS exam_code,
         source_tag.company_name,
         source_tag.paper_code,
         source_tag.exam_year
       FROM questions
       LEFT JOIN LATERAL (
         SELECT exam_code, company_name, paper_code, exam_year
         FROM question_exam_tags
         WHERE question_exam_tags.question_id = questions.id
         ORDER BY exam_year DESC NULLS LAST
         LIMIT 1
       ) AS source_tag ON TRUE
       WHERE questions.id = $1
       LIMIT 1`,
      [questionId]
    );

    if (!question.rows[0]) {
      throw new ApiError('Question was not found.', 404);
    }

    const thread = await query(
      `INSERT INTO question_discussion_threads (
         question_id,
         created_by,
         exam_code,
         company_name,
         paper_code,
         exam_year
       )
       VALUES ($1, $2, $3::exam_code, $4, $5, $6)
       ON CONFLICT (question_id)
       DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [
        questionId,
        userId,
        question.rows[0].exam_code ?? 'GATE',
        question.rows[0].company_name ?? null,
        question.rows[0].paper_code ?? null,
        question.rows[0].exam_year ?? null,
      ]
    );

    return thread.rows[0];
  }

  private async getAcceptedPeerConnection(userId: string, peerUserId: string) {
    const result = await query(
      `SELECT *
       FROM peer_connections
       WHERE status = 'accepted'
         AND ((requester_user_id = $1 AND addressee_user_id = $2)
           OR (requester_user_id = $2 AND addressee_user_id = $1))
       LIMIT 1`,
      [userId, peerUserId]
    );

    if (!result.rows[0]) {
      throw new ApiError('You need an accepted peer connection first.', 403);
    }

    return result.rows[0];
  }

  private async getEventForUser(userId: string, eventId: string) {
    const result = await query(
      `SELECT *
       FROM collaboration_events
       WHERE id = $1 AND (requester_user_id = $2 OR invitee_user_id = $2)
       LIMIT 1`,
      [eventId, userId]
    );

    if (!result.rows[0]) {
      throw new ApiError('Calendar event was not found for this user.', 404);
    }

    return result.rows[0];
  }

  private async resolveCallTarget(userId: string, input: AudioCallInput) {
    if (input.eventId) {
      const event = await this.getEventForUser(userId, input.eventId);
      return {
        peerUserId:
          event.requester_user_id === userId ? event.invitee_user_id : event.requester_user_id,
        connectionId: event.peer_connection_id ?? null,
      };
    }

    if (input.connectionId) {
      const connection = await query(
        `SELECT *
         FROM peer_connections
         WHERE id = $1
           AND status = 'accepted'
           AND (requester_user_id = $2 OR addressee_user_id = $2)
         LIMIT 1`,
        [input.connectionId, userId]
      );

      if (!connection.rows[0]) {
        throw new ApiError('Accepted peer connection was not found.', 404);
      }

      const row = connection.rows[0];
      return {
        peerUserId: row.requester_user_id === userId ? row.addressee_user_id : row.requester_user_id,
        connectionId: row.id,
      };
    }

    if (!input.peerUserId) {
      throw new ApiError('Choose a peer, connection, or calendar event for the call.', 400);
    }

    const connection = await this.getAcceptedPeerConnection(userId, input.peerUserId);
    return {
      peerUserId: input.peerUserId,
      connectionId: connection.id,
    };
  }

  private async getCallForUser(userId: string, callId: string) {
    const result = await query(
      `SELECT *
       FROM audio_call_rooms
       WHERE id = $1 AND (caller_user_id = $2 OR callee_user_id = $2)
       LIMIT 1`,
      [callId, userId]
    );

    if (!result.rows[0]) {
      throw new ApiError('Audio call was not found for this user.', 404);
    }

    return result.rows[0];
  }

  private async scheduleEventReminders(event: any) {
    const startsAt = new Date(event.starts_at);
    const reminderAt = new Date(startsAt.getTime() - 15 * 60 * 1000);
    if (reminderAt <= new Date()) {
      return;
    }

    const userIds = [event.requester_user_id, event.invitee_user_id];
    for (const userId of userIds) {
      const inserted = await query(
        `INSERT INTO collaboration_reminders (event_id, user_id, remind_at, channel)
         VALUES ($1, $2, $3, 'in_app')
         ON CONFLICT (event_id, user_id, remind_at, channel)
         DO NOTHING
         RETURNING id`,
        [event.id, userId, reminderAt]
      );

      if (inserted.rows[0]?.id) {
        try {
          await redis.zadd(
            'calendar:reminders',
            Math.floor(reminderAt.getTime() / 1000),
            JSON.stringify({
              reminderId: inserted.rows[0].id,
              eventId: event.id,
              userId,
              remindAt: reminderAt.toISOString(),
            })
          );
        } catch {
          // Redis queues are best effort; the database remains the source of truth.
        }
      }
    }
  }

  private async createNotification(input: {
    userId: string;
    actorUserId?: string;
    notificationType: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
  }) {
    const inserted = await query(
      `INSERT INTO collaboration_notifications (
         user_id,
         actor_user_id,
         notification_type,
         title,
         body,
         entity_type,
         entity_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.userId,
        input.actorUserId ?? null,
        input.notificationType,
        input.title,
        input.body,
        input.entityType ?? null,
        input.entityId ?? null,
      ]
    );

    await this.pushRedis('notifications:queue', {
      notificationId: inserted.rows[0].id,
      userId: input.userId,
      type: input.notificationType,
      queuedAt: new Date().toISOString(),
    });

    return inserted.rows[0];
  }

  private async pushRedis(key: string, value: unknown, ttlSeconds = 24 * 60 * 60) {
    try {
      await redis.rpush(key, JSON.stringify(value));
      await redis.expire(key, ttlSeconds);
    } catch {
      // Collaboration should keep working even if a transient Redis queue write fails.
    }
  }
}
