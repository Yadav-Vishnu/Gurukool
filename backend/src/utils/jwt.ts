import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { JWTPayload, TokenPair, UserRole } from '../types';

/**
 * JWT (JSON Web Token) Utility
 *
 * JWTs are like digital ID cards that prove a user is logged in.
 * - Access Token: short-lived (15 min), used for API calls
 * - Refresh Token: long-lived (7 days), used to get new access tokens
 *
 * This two-token system balances security (short access window)
 * with convenience (don't have to re-login every 15 minutes).
 */

const ACCESS_TOKEN_EXPIRY = '15m';   // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';   // 7 days

const parseToken = (
  token: string,
  secret: string,
  expectedType: 'access' | 'refresh'
): JWTPayload => {
  const payload = jwt.verify(token, secret, {
    issuer: 'gurukool',
    audience: 'gurukool-app',
  }) as JWTPayload;

  if (payload.type !== expectedType) {
    throw new Error(`Expected a ${expectedType} token`);
  }

  return payload;
};

/**
 * Generate both access and refresh tokens for a user.
 */
export const generateTokenPair = (
  userId: string,
  email: string | null,
  role: UserRole,
  sessionId: string
): TokenPair => {
  const accessPayload: JWTPayload = {
    userId,
    email,
    role,
    sessionId,
    type: 'access',
  };

  const refreshPayload: JWTPayload = {
    userId,
    email,
    role,
    sessionId,
    type: 'refresh',
  };

  const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'gurukool',
    audience: 'gurukool-app',
  });

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'gurukool',
    audience: 'gurukool-app',
  });

  return { accessToken, refreshToken };
};

/**
 * Verify and decode an access token.
 * Throws an error if the token is expired or invalid.
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  return parseToken(token, env.JWT_ACCESS_SECRET, 'access');
};

/**
 * Verify and decode a refresh token.
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return parseToken(token, env.JWT_REFRESH_SECRET, 'refresh');
};

/**
 * Create a SHA-256 hash of a token.
 * We store this hash in the database instead of the raw token,
 * so even if the database is compromised, tokens can't be stolen.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
