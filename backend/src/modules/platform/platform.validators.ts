import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendError } from '../../utils/response';

const optionalDateString = z.string().trim().min(10).max(80).optional();

export const createInstitutionSchema = z.object({
  name: z.string().trim().min(3).max(180),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(255),
  contactPhone: z.string().trim().max(30).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().min(2).max(80).default('India'),
  seatsPurchased: z.number().int().min(0).max(100000).default(0),
  allowedEmailDomains: z.array(z.string().trim().min(3).max(120)).max(20).default([]),
});

export const hostTestSchema = z.object({
  testId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(180).optional(),
  startsAt: optionalDateString,
  endsAt: optionalDateString,
  maxParticipants: z.number().int().min(1).max(100000).default(100),
});

export const reportContentSchema = z.object({
  contentType: z.string().trim().min(3).max(80),
  contentId: z.string().uuid().optional(),
  content: z.string().trim().min(2).max(5000),
  reason: z.string().trim().min(3).max(160),
  details: z.string().trim().max(2000).optional(),
});

export const reviewModerationCaseSchema = z.object({
  status: z.enum(['in_review', 'actioned', 'dismissed', 'escalated']),
  action: z.enum([
    'none',
    'hide_content',
    'delete_content',
    'warn_user',
    'suspend_user',
    'restore_content',
  ]),
  note: z.string().trim().max(2000).optional(),
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
