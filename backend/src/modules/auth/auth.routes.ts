import { Router } from 'express';
import passport from 'passport';
import { sendOTP, verifyOTPLogin, googleCallback, refreshToken, logout } from './auth.controller';
import { validate, sendOTPSchema, verifyOTPSchema, refreshTokenSchema } from './auth.validators';
import { otpRateLimiter, loginRateLimiter } from '../../middleware/rate-limiter';

/**
 * Auth Routes
 *
 * POST /api/auth/otp/send       → Send OTP to phone
 * POST /api/auth/otp/verify     → Verify OTP and login
 * GET  /api/auth/google         → Start Google OAuth flow
 * GET  /api/auth/google/callback → Google OAuth callback
 * POST /api/auth/refresh        → Refresh access token
 * POST /api/auth/logout         → Logout current session
 */
const router = Router();

// OTP Authentication
router.post(
  '/otp/send',
  otpRateLimiter,
  validate(sendOTPSchema),
  sendOTP
);

router.post(
  '/otp/verify',
  loginRateLimiter,
  validate(verifyOTPSchema),
  verifyOTPLogin
);

// Google OAuth Authentication
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/login?error=google_auth_failed',
  }),
  googleCallback
);

// Token Management
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  refreshToken
);

router.post('/logout', logout);

export default router;
