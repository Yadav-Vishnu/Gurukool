import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

const currentYear = new Date().getFullYear();

export const uploadBookSchema = z.object({
  fileName: z.string().trim().min(3).max(260),
  mimeType: z.literal('application/pdf'),
  fileBase64: z.string().trim().min(100).max(18_000_000),
  extractedTextPreview: z.string().trim().max(50000).optional(),
});

export const confirmBookSubjectSchema = z.object({
  subjectCode: z.string().trim().min(1).max(20),
});

export const createHighlightSchema = z.object({
  pageNumber: z.number().int().min(1).max(5000).optional(),
  highlightText: z.string().trim().min(3).max(5000),
  title: z.string().trim().max(180).optional(),
});

export const createManualNoteSchema = z.object({
  subjectCode: z.string().trim().max(20).optional(),
  title: z.string().trim().max(180).optional(),
  sourceText: z.string().trim().max(5000).optional(),
  noteText: z.string().trim().min(3).max(7000),
  examYear: z.number().int().min(1990).max(currentYear + 1).optional(),
});

export const paraphraseSchema = z.object({
  sourceText: z.string().trim().min(8).max(7000),
  style: z.enum(['concise', 'exam-ready', 'memory-hook']).default('exam-ready'),
  subjectCode: z.string().trim().max(20).optional(),
  sourceEntryId: z.string().uuid().optional(),
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
