import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { sendCreated, sendError, sendSuccess } from '../../utils/response';
import { CommunityService } from './community.service';

const communityService = new CommunityService();

const requireUserId = (req: Request, res: Response): string | null => {
  const userId = req.user?.id;
  if (!userId) {
    sendError(res, 'User not authenticated', 401);
    return null;
  }

  return userId;
};

const routeParam = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new Error('Required route parameter is missing');
  }

  return Array.isArray(value) ? value[0] : value;
};

export const listDiscussionQuestions = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const questions = await communityService.listDiscussionQuestions(search);
  sendSuccess(res, 'Discussion questions loaded successfully', questions);
});

export const getQuestionDiscussion = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const discussion = await communityService.getQuestionDiscussion(
    userId,
    routeParam(req.params.questionId)
  );
  sendSuccess(res, 'Question discussion loaded successfully', discussion);
});

export const createDiscussionPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const post = await communityService.createDiscussionPost(
    userId,
    routeParam(req.params.questionId),
    req.body
  );
  sendCreated(res, 'Discussion reply posted successfully', post);
});

export const searchPeers = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const peers = await communityService.searchPeers(userId, search);
  sendSuccess(res, 'Peers loaded successfully', peers);
});

export const listPeerConnections = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const peers = await communityService.listPeerConnections(userId);
  sendSuccess(res, 'Peer connections loaded successfully', peers);
});

export const createPeerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const request = await communityService.requestPeerConnection(userId, req.body);
  sendCreated(res, 'Peer request sent successfully', request);
});

export const respondPeerRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const request = await communityService.respondPeerConnection(
    userId,
    routeParam(req.params.connectionId),
    req.body.action
  );
  sendSuccess(res, 'Peer request updated successfully', request);
});

export const listCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const events = await communityService.listCalendarEvents(userId);
  sendSuccess(res, 'Calendar events loaded successfully', events);
});

export const proposeCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const event = await communityService.proposeEvent(userId, req.body);
  sendCreated(res, 'Study session proposed successfully', event);
});

export const confirmCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const event = await communityService.confirmEvent(userId, routeParam(req.params.eventId));
  sendSuccess(res, 'Calendar event confirmed successfully', event);
});

export const requestEventReschedule = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const request = await communityService.requestReschedule(
    userId,
    routeParam(req.params.eventId),
    req.body
  );
  sendCreated(res, 'Reschedule request sent successfully', request);
});

export const respondEventReschedule = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const response = await communityService.respondReschedule(
    userId,
    routeParam(req.params.requestId),
    req.body.action
  );
  sendSuccess(res, 'Reschedule request updated successfully', response);
});

export const syncCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const sync = await communityService.syncCalendarEvent(
    userId,
    routeParam(req.params.eventId),
    req.body.provider,
    req.body.externalEventId
  );
  sendCreated(res, 'Calendar sync queued successfully', sync);
});

export const listAudioCalls = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const calls = await communityService.listAudioCalls(userId);
  sendSuccess(res, 'Audio calls loaded successfully', calls);
});

export const createAudioCall = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const call = await communityService.createAudioCall(userId, req.body);
  sendCreated(res, 'Audio call room created successfully', call);
});

export const sendCallSignal = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const signal = await communityService.sendCallSignal(
    userId,
    routeParam(req.params.callId),
    req.body
  );
  sendCreated(res, 'Call signal stored successfully', signal);
});

export const listCallSignals = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const after = typeof req.query.after === 'string' ? req.query.after : undefined;
  const signals = await communityService.listCallSignals(
    userId,
    routeParam(req.params.callId),
    after
  );
  sendSuccess(res, 'Call signals loaded successfully', signals);
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const notifications = await communityService.listNotifications(userId);
  sendSuccess(res, 'Notifications loaded successfully', notifications);
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const notification = await communityService.markNotificationRead(
    userId,
    routeParam(req.params.notificationId)
  );
  sendSuccess(res, 'Notification marked as read', notification);
});
