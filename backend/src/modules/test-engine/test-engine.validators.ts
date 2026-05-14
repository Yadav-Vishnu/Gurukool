import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

const wrongTags = [
  'concept-gap',
  'careless-mistake',
  'formula-recall',
  'time-pressure',
  'guesswork',
] as const;

const examCodes = ['GATE', 'PSU', 'ESE'] as const;
const currentYear = new Date().getFullYear();

export const updateAttemptAnswerSchema = z.object({
  selectedOption: z.string().trim().max(10).nullable().optional(),
  markedForReview: z.boolean().optional(),
  visited: z.boolean().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  wrongTag: z.enum(wrongTags).nullable().optional(),
  timeSpentSeconds: z.number().int().min(0).max(60 * 60 * 4).optional(),
  currentQuestionIndex: z.number().int().min(0).max(500).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
});

export const startAdaptiveAttemptSchema = z.object({
  type: z.enum(['topic', 'subject', 'full_length']).optional(),
  subjectCode: z.string().trim().max(20).optional(),
  topicSlug: z.string().trim().max(120).optional(),
  examCode: z.enum(examCodes).optional(),
  companyName: z.string().trim().min(2).max(120).optional(),
  paperCode: z.string().trim().min(2).max(120).optional(),
  examYear: z.number().int().min(1990).max(currentYear + 1).optional(),
  questionCount: z.number().int().min(5).max(65).optional(),
  durationMinutes: z.number().int().min(10).max(180).optional(),
}).transform((value) => ({
  ...value,
  companyName: value.companyName || undefined,
  paperCode: value.paperCode || undefined,
}));

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
