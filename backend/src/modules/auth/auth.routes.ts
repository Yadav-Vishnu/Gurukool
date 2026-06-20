import { Router } from 'express';
import passport from 'passport';
import { 
  sendOTP, 
  verifyOTPLogin, 
  googleCallback, 
  githubCallback, 
  linkedinCallback, 
  refreshToken, 
  logout 
} from './auth.controller';
import { validate, sendOTPSchema, verifyOTPSchema, refreshTokenSchema } from './auth.validators';
import { otpRateLimiter, loginRateLimiter } from '../../middleware/rate-limiter';

/**
 * Auth Routes
 *
 * POST /api/auth/otp/send       → Send OTP to phone
 * POST /api/auth/otp/verify     → Verify OTP and login
 * GET  /api/auth/google         → Start Google OAuth flow
 * GET  /api/auth/google/callback → Google OAuth callback
 * GET  /api/auth/github         → Start GitHub OAuth flow
 * GET  /api/auth/github/callback → GitHub OAuth callback
 * GET  /api/auth/linkedin       → Start LinkedIn OAuth flow
 * GET  /api/auth/linkedin/callback → LinkedIn OAuth callback
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

// GitHub OAuth Authentication
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
  })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: '/auth/login?error=github_auth_failed',
  }),
  githubCallback
);

// LinkedIn OAuth Authentication
router.get(
  '/linkedin',
  passport.authenticate('linkedin', {
    session: false,
  })
);

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', {
    session: false,
    failureRedirect: '/auth/login?error=linkedin_auth_failed',
  }),
  linkedinCallback
);

// Token Management
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  refreshToken
);

router.post('/logout', logout);

export default router;
