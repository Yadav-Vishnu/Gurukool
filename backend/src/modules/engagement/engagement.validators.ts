import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendError } from '../../utils/response';

export const reviewFlashcardSchema = z.object({
  confidence: z.number().int().min(1).max(5),
});

export const submitChallengeScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
});

export const submitQuizAnswerSchema = z.object({
  selectedOption: z.string().trim().min(1).max(10),
});

export const applyReferralSchema = z.object({
  referralCode: z.string().trim().min(4).max(20),
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
