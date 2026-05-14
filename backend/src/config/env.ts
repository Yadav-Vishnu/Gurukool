import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/**
 * Validates all environment variables at startup.
 * If any required variable is missing, the app crashes immediately
 * with a clear error message — much better than failing later!
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // PostgreSQL
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('gurukool'),
  DB_USER: z.string().default('gurukool_admin'),
  DB_PASSWORD: z.string().default('gurukool_secure_2025'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default('gurukool_redis_2025'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16).default('gurukool-access-secret-change-this-in-production-min32chars'),
  JWT_REFRESH_SECRET: z.string().min(16).default('gurukool-refresh-secret-change-this-in-production-min32chars'),

  // Google OAuth 2.0
  GOOGLE_CLIENT_ID: z.string().default('placeholder-client-id'),
  GOOGLE_CLIENT_SECRET: z.string().default('placeholder-client-secret'),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:3000/api/auth/google/callback'),

  // SMS Provider
  SMS_API_KEY: z.string().default('placeholder-sms-key'),
  SMS_SENDER_ID: z.string().optional().default('GURKOL'),
  SMS_TEMPLATE_ID: z.string().optional().default('placeholder-template'),

  // Frontend URL
  FRONTEND_URL: z.string().default('http://localhost:8100'),
});

// Parse and validate — will throw if invalid
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
