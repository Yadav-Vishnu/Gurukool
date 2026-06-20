import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

/**
 * Basic HTML escaping to prevent XSS.
 * Replaces critical characters with their safe HTML entities.
 */
const escapeHtml = (val: string): string => {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Schema for validating the update profile request body.
 * Ensures types are correct and sanitizes text inputs.
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .transform((val) => escapeHtml(val))
    .optional(),
  avatarUrl: z
    .string()
    .max(15 * 1024 * 1024, 'Avatar content exceeds 15MB limit') // 15MB base64 safe limit
    .refine((val) => {
      if (!val) return true;
      const isPredefined = val.startsWith('predefined:');
      const isBase64 = val.startsWith('data:image/');
      const isUrl = val.startsWith('http://') || val.startsWith('https://');
      return isPredefined || isBase64 || isUrl;
    }, 'Avatar must be a predefined motif, a valid base64 image data URI, or a HTTP/HTTPS URL')
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional()
    .nullable()
    .or(z.literal(''))
    .or(z.literal(null)),
  profileCompleted: z.boolean().optional(),
  theme: z
    .enum(['light', 'dark', 'saffron'])
    .optional(),
  sidebarCollapsed: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
});

/**
 * Middleware factory to validate requests against a schema.
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      sendError(res, 'Validation failed', 400, errors);
      return;
    }

    // Assign sanitized/parsed data back to req.body
    req.body = result.data;
    next();
  };
};
