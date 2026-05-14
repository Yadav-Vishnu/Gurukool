import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import {
  confirmCalendarEvent,
  createAudioCall,
  createDiscussionPost,
  createPeerRequest,
  getQuestionDiscussion,
  listAudioCalls,
  listCalendarEvents,
  listCallSignals,
  listDiscussionQuestions,
  listNotifications,
  listPeerConnections,
  markNotificationRead,
  proposeCalendarEvent,
  requestEventReschedule,
  respondEventReschedule,
  respondPeerRequest,
  searchPeers,
  sendCallSignal,
  syncCalendarEvent,
} from './community.controller';
import {
  createAudioCallSchema,
  createDiscussionPostSchema,
  createPeerRequestSchema,
  proposeEventSchema,
  rescheduleEventSchema,
  respondPeerRequestSchema,
  respondRescheduleSchema,
  sendCallSignalSchema,
  syncCalendarSchema,
  validate,
} from './community.validators';

const router = Router();

router.use(authMiddleware);

router.get('/questions', listDiscussionQuestions);
router.get('/questions/:questionId/discussion', getQuestionDiscussion);
router.post(
  '/questions/:questionId/discussion/posts',
  validate(createDiscussionPostSchema),
  createDiscussionPost
);

router.get('/peers/search', searchPeers);
router.get('/peers/connections', listPeerConnections);
router.post('/peers/requests', validate(createPeerRequestSchema), createPeerRequest);
router.patch(
  '/peers/connections/:connectionId/respond',
  validate(respondPeerRequestSchema),
  respondPeerRequest
);

router.get('/calendar/events', listCalendarEvents);
router.post('/calendar/events', validate(proposeEventSchema), proposeCalendarEvent);
router.patch('/calendar/events/:eventId/confirm', confirmCalendarEvent);
router.post(
  '/calendar/events/:eventId/reschedule',
  validate(rescheduleEventSchema),
  requestEventReschedule
);
router.patch(
  '/calendar/reschedules/:requestId/respond',
  validate(respondRescheduleSchema),
  respondEventReschedule
);
router.post(
  '/calendar/events/:eventId/sync',
  validate(syncCalendarSchema),
  syncCalendarEvent
);

router.get('/calls', listAudioCalls);
router.post('/calls', validate(createAudioCallSchema), createAudioCall);
router.get('/calls/:callId/signals', listCallSignals);
router.post('/calls/:callId/signals', validate(sendCallSignalSchema), sendCallSignal);

router.get('/notifications', listNotifications);
router.patch('/notifications/:notificationId/read', markNotificationRead);

export default router;
