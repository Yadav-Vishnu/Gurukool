import { z } from 'zod';

/**
 * Auth Input Validators (Zod Schemas)
 *
 * These validate incoming request data BEFORE it reaches the controller.
 * If the data doesn't match the schema, the request is rejected with
 * a clear error message — preventing invalid/malicious data from
 * reaching the database.
 */

/**
 * Validate phone number for OTP request.
 * Indian phone numbers: 10 digits, starting with 6-9.
 */
export const sendOTPSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
});

/**
 * Validate OTP verification request.
 */
export const verifyOTPSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

/**
 * Validate refresh token request.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Middleware factory: validates request body against a Zod schema.
 */
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

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

    // Replace body with parsed (cleaned) data
    req.body = result.data;
    next();
  };
};
