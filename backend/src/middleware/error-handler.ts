import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Global Error Handler Middleware
 *
 * This catches ALL errors thrown anywhere in the app and sends
 * a clean JSON response instead of crashing the server.
 * Must be registered LAST in the middleware chain (after all routes).
 */

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details (full stack in development, minimal in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    // In production, only log unexpected errors
    if (statusCode === 500) {
      console.error('❌ Unhandled Error:', err.message, err.stack);
    }
  }

  sendError(
    res,
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Something went wrong. Please try again later.'
      : message,
    statusCode
  );
};

/**
 * Custom error class for API errors.
 * Use this to throw errors with specific HTTP status codes.
 *
 * @example
 * throw new ApiError('User not found', 404);
 * throw new ApiError('Invalid OTP', 400);
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper for async route handlers.
 * Catches promise rejections and forwards them to the error handler.
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await UserService.findAll();
 *   sendSuccess(res, 'Users found', users);
 * }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
