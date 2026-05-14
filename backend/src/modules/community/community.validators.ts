import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendError } from '../../utils/response';

const dateString = z.string().trim().min(10).max(80);

export const createDiscussionPostSchema = z.object({
  content: z.string().trim().min(2).max(2000),
  parentPostId: z.string().uuid().optional(),
});

export const createPeerRequestSchema = z.object({
  peerUserId: z.string().uuid(),
  message: z.string().trim().max(500).optional(),
});

export const respondPeerRequestSchema = z.object({
  action: z.enum(['accept', 'decline', 'block']),
});

export const proposeEventSchema = z.object({
  peerUserId: z.string().uuid(),
  title: z.string().trim().min(3).max(180),
  agenda: z.string().trim().max(2000).optional(),
  startsAt: dateString,
  endsAt: dateString,
  timezone: z.string().trim().min(2).max(80).default('Asia/Kolkata'),
});

export const rescheduleEventSchema = z.object({
  startsAt: dateString,
  endsAt: dateString,
  timezone: z.string().trim().min(2).max(80).default('Asia/Kolkata'),
  reason: z.string().trim().max(1000).optional(),
});

export const respondRescheduleSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

export const syncCalendarSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  externalEventId: z.string().trim().max(255).optional(),
});

export const createAudioCallSchema = z.object({
  peerUserId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
});

export const sendCallSignalSchema = z.object({
  messageType: z.enum(['offer', 'answer', 'ice-candidate', 'hangup']),
  payload: z.record(z.unknown()).default({}),
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
      }));

      sendError(res, 'Validation failed', 400, errors);
      return;
    }

    req.body = result.data;
    next();
  };
};
