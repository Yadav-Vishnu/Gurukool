import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../../utils/response';
import { asyncHandler } from '../../middleware/error-handler';
import { DeviceInfo } from '../../types';
import { env } from '../../config/env';

const authService = new AuthService();

/**
 * Extract device info from request headers.
 * Used to identify which device a session belongs to.
 */
const getDeviceInfo = (req: Request): DeviceInfo => ({
  os: req.headers['sec-ch-ua-platform'] as string || 'Unknown',
  browser: req.headers['sec-ch-ua'] as string || req.headers['user-agent'] || 'Unknown',
  ip: req.ip || req.socket.remoteAddress || 'Unknown',
  userAgent: req.headers['user-agent'] || 'Unknown',
});

// ============================================================
// OTP Endpoints
// ============================================================

/**
 * POST /api/auth/otp/send
 * Send an OTP to a phone number.
 *
 * Body: { phone: "9876543210" }
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const result = await authService.sendOTP(phone);
  sendSuccess(res, result.message);
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP and log in.
 *
 * Body: { phone: "9876543210", otp: "123456" }
 * Returns: { user, tokens: { accessToken, refreshToken } }
 */
export const verifyOTPLogin = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  const deviceInfo = getDeviceInfo(req);

  const result = await authService.verifyOTPAndLogin(phone, otp, deviceInfo);

  // Don't expose sensitive user fields
  const { google_id, github_id, linkedin_id, ...safeUser } = result.user as any;

  sendSuccess(res, 'Login successful', {
    user: safeUser,
    tokens: result.tokens,
  });
});

// ============================================================
// Google OAuth Endpoints
// ============================================================

/**
 * GET /api/auth/google
 * Redirect to Google's OAuth consent screen.
 * This is handled by Passport middleware in the routes file.
 */

/**
 * GET /api/auth/google/callback
 * Google redirects here after the user signs in.
 * Passport processes the callback and populates req.user.
 */
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Google authentication failed');
  }

  const deviceInfo = getDeviceInfo(req);
  const result = await authService.processOAuthAuth(req.user, deviceInfo);

  // Redirect to frontend with tokens in URL hash (not query params for security)
  const redirectUrl = `${env.FRONTEND_URL}/auth/oauth-callback#access_token=${result.tokens.accessToken}&refresh_token=${result.tokens.refreshToken}`;
  res.redirect(redirectUrl);
});

// ============================================================
// GitHub OAuth Endpoints
// ============================================================

/**
 * GET /api/auth/github/callback
 * GitHub redirects here after user authorization.
 */
export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'GitHub authentication failed');
  }

  const deviceInfo = getDeviceInfo(req);
  const result = await authService.processOAuthAuth(req.user, deviceInfo);

  const redirectUrl = `${env.FRONTEND_URL}/auth/oauth-callback#access_token=${result.tokens.accessToken}&refresh_token=${result.tokens.refreshToken}`;
  res.redirect(redirectUrl);
});

// ============================================================
// LinkedIn OAuth Endpoints
// ============================================================

/**
 * GET /api/auth/linkedin/callback
 * LinkedIn redirects here after user authorization.
 */
export const linkedinCallback = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'LinkedIn authentication failed');
  }

  const deviceInfo = getDeviceInfo(req);
  const result = await authService.processOAuthAuth(req.user, deviceInfo);

  const redirectUrl = `${env.FRONTEND_URL}/auth/oauth-callback#access_token=${result.tokens.accessToken}&refresh_token=${result.tokens.refreshToken}`;
  res.redirect(redirectUrl);
});

// ============================================================
// Token Management
// ============================================================

/**
 * POST /api/auth/refresh
 * Get a new access token using a refresh token.
 *
 * Body: { refreshToken: "..." }
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const deviceInfo = getDeviceInfo(req);

  const result = await authService.refreshAccessToken(token, deviceInfo);
  sendSuccess(res, 'Token refreshed successfully', result);
});

/**
 * POST /api/auth/logout
 * Logout the current session.
 *
 * Requires: Authorization header with Bearer token
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'No token provided', 400);
  }

  const token = authHeader.split(' ')[1];
  await authService.logout(token);
  sendSuccess(res, 'Logged out successfully');
});
