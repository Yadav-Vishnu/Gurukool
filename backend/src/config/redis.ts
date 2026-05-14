import Redis from 'ioredis';
import { env } from './env';

/**
 * Redis Client
 *
 * Redis is an ultra-fast in-memory database used for:
 * - Session token caching (instant JWT validation)
 * - OTP storage with auto-expiry (5 min TTL)
 * - Rate limiting (track request counts)
 * - Leaderboards (future phases)
 */
export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 5) {
      console.error('❌ Redis: max retries exceeded, giving up');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000); // Exponential backoff
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err: Error) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

/**
 * Test Redis connectivity — used at app startup.
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redis.ping();
    console.log(`✅ Redis ping: ${pong}`);
    return true;
  } catch (error: any) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
};

// ============================================================
// Helper functions for common Redis operations
// ============================================================

/**
 * Store a session token in Redis with automatic expiry.
 * @param tokenHash - SHA-256 hash of the JWT
 * @param userId - User's UUID
 * @param ttlSeconds - Time-to-live in seconds (default: 7 days)
 */
export const setSession = async (
  tokenHash: string,
  userId: string,
  ttlSeconds: number = 7 * 24 * 60 * 60
): Promise<void> => {
  await redis.setex(`session:${tokenHash}`, ttlSeconds, userId);
};

/**
 * Check if a session token exists in Redis.
 * Returns the userId if found, null if expired/invalid.
 */
export const getSession = async (tokenHash: string): Promise<string | null> => {
  return redis.get(`session:${tokenHash}`);
};

/**
 * Remove a session token from Redis (logout / session invalidation).
 */
export const deleteSession = async (tokenHash: string): Promise<void> => {
  await redis.del(`session:${tokenHash}`);
};

/**
 * Store an OTP in Redis with 5-minute expiry.
 * Key format: otp:{phone} → {hashedOTP}
 */
export const setOTP = async (phone: string, otpHash: string): Promise<void> => {
  await redis.setex(`otp:${phone}`, 300, otpHash); // 300 seconds = 5 minutes
};

/**
 * Get stored OTP hash for a phone number.
 */
export const getOTP = async (phone: string): Promise<string | null> => {
  return redis.get(`otp:${phone}`);
};

/**
 * Delete OTP after successful verification.
 */
export const deleteOTP = async (phone: string): Promise<void> => {
  await redis.del(`otp:${phone}`);
};

/**
 * Rate limiter helper: increment a counter with TTL.
 * Returns the current count after increment.
 */
export const incrementRateLimit = async (
  key: string,
  windowSeconds: number
): Promise<number> => {
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, windowSeconds);
  const results = await multi.exec();
  return (results?.[0]?.[1] as number) || 0;
};
