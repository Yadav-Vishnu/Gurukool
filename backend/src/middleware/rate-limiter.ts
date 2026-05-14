import { Request, Response, NextFunction } from 'express';
import { incrementRateLimit } from '../config/redis';
import { sendTooManyRequests } from '../utils/response';

/**
 * Redis-backed Rate Limiter
 *
 * Prevents abuse by limiting how many requests a user/IP can make.
 * Uses Redis to track request counts with automatic expiry.
 */

interface RateLimitOptions {
  windowSeconds: number;  // Time window for counting requests
  maxRequests: number;    // Max requests allowed in the window
  keyPrefix: string;      // Prefix for Redis key (e.g., 'otp', 'api')
  keyExtractor?: (req: Request) => string; // How to identify the requester
}

/**
 * Create a rate limiter middleware with custom settings.
 *
 * @example
 * // Limit OTP requests: 5 per hour per phone number
 * router.post('/send-otp', createRateLimiter({
 *   windowSeconds: 3600,
 *   maxRequests: 5,
 *   keyPrefix: 'otp',
 *   keyExtractor: (req) => req.body.phone,
 * }), sendOTPHandler);
 *
 * // Limit general API: 100 per minute per IP
 * app.use('/api', createRateLimiter({
 *   windowSeconds: 60,
 *   maxRequests: 100,
 *   keyPrefix: 'api',
 * }));
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Determine the key (IP address by default)
      const identifier = options.keyExtractor
        ? options.keyExtractor(req)
        : req.ip || req.socket.remoteAddress || 'unknown';

      const key = `ratelimit:${options.keyPrefix}:${identifier}`;
      const count = await incrementRateLimit(key, options.windowSeconds);

      // Set rate limit headers so the frontend knows the limits
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - count));
      res.setHeader('X-RateLimit-Reset', options.windowSeconds);

      if (count > options.maxRequests) {
        sendTooManyRequests(
          res,
          `Rate limit exceeded. Max ${options.maxRequests} requests per ${options.windowSeconds} seconds.`
        );
        return;
      }

      next();
    } catch (error) {
      // If Redis is down, allow the request (fail-open)
      console.error('⚠️ Rate limiter error (allowing request):', error);
      next();
    }
  };
};

/**
 * Pre-configured rate limiters for common use cases.
 */

// General API: 100 requests per minute per IP
export const apiRateLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 100,
  keyPrefix: 'api',
});

// OTP sending: 5 requests per hour per phone number
export const otpRateLimiter = createRateLimiter({
  windowSeconds: 3600,
  maxRequests: 5,
  keyPrefix: 'otp',
  keyExtractor: (req: Request) => req.body.phone || req.ip || 'unknown',
});

// Login attempts: 10 per 15 minutes per IP
export const loginRateLimiter = createRateLimiter({
  windowSeconds: 900,
  maxRequests: 10,
  keyPrefix: 'login',
});
