import { UserService } from '../user/user.service';
import { SessionService } from '../session/session.service';
import { generateOTP, hashOTP, verifyOTP, sendOTPViaSMS } from '../../utils/otp';
import { generateTokenPair, verifyRefreshToken, hashToken } from '../../utils/jwt';
import { setOTP, getOTP, deleteOTP } from '../../config/redis';
import { query } from '../../config/database';
import { User, TokenPair, DeviceInfo } from '../../types';
import { ApiError } from '../../middleware/error-handler';
import { v4 as uuidv4 } from 'uuid';

/**
 * Auth Service — Core Authentication Logic
 *
 * Handles:
 * - OTP generation and verification (phone login)
 * - Google OAuth user processing
 * - Token generation and refresh
 * - Logout
 */
export class AuthService {
  private userService: UserService;
  private sessionService: SessionService;

  constructor() {
    this.userService = new UserService();
    this.sessionService = new SessionService();
  }

  // ============================================================
  // OTP Flow
  // ============================================================

  /**
   * Step 1: Send OTP to phone number.
   *
   * 1. Generate a random 6-digit OTP
   * 2. Hash it and store in Redis (5 min TTL)
   * 3. Also store in PostgreSQL (for audit trail)
   * 4. Send OTP via SMS
   */
  async sendOTP(phone: string): Promise<{ message: string }> {
    // Check rate limit (stored OTP records in last hour)
    const recentOTPs = await query(
      `SELECT COUNT(*) FROM otp_records 
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [phone]
    );

    if (parseInt(recentOTPs.rows[0].count) >= 5) {
      throw new ApiError('Too many OTP requests. Please try again after 1 hour.', 429);
    }

    // Generate and hash OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Store in Redis (fast lookup, auto-expires in 5 min)
    await setOTP(phone, otpHash);

    // Store in PostgreSQL (audit trail)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await query(
      `INSERT INTO otp_records (phone, otp_hash, expires_at) VALUES ($1, $2, $3)`,
      [phone, otpHash, expiresAt]
    );

    // Send OTP via SMS
    const sent = await sendOTPViaSMS(phone, otp);
    if (!sent) {
      throw new ApiError('Failed to send OTP. Please try again.', 500);
    }

    return { message: 'OTP sent successfully' };
  }

  /**
   * Step 2: Verify OTP and log in.
   *
   * 1. Get stored OTP hash from Redis
   * 2. Compare with user-entered OTP
   * 3. If valid: find/create user, create session, return tokens
   */
  async verifyOTPAndLogin(
    phone: string,
    otp: string,
    deviceInfo: DeviceInfo
  ): Promise<{ user: User; tokens: TokenPair }> {
    // Get stored OTP hash
    const storedHash = await getOTP(phone);
    if (!storedHash) {
      throw new ApiError('OTP expired. Please request a new one.', 400);
    }

    // Update attempt count in PostgreSQL
    const otpRecord = await query(
      `SELECT id, attempts, max_attempts FROM otp_records 
       WHERE phone = $1 AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    if (otpRecord.rows[0]) {
      const record = otpRecord.rows[0];
      if (record.attempts >= record.max_attempts) {
        await deleteOTP(phone);
        throw new ApiError('Maximum attempts exceeded. Please request a new OTP.', 400);
      }

      // Increment attempt count
      await query(
        'UPDATE otp_records SET attempts = attempts + 1 WHERE id = $1',
        [record.id]
      );
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, storedHash);
    if (!isValid) {
      throw new ApiError('Invalid OTP. Please try again.', 400);
    }

    // OTP is valid — clean up
    await deleteOTP(phone);
    if (otpRecord.rows[0]) {
      await query(
        'UPDATE otp_records SET is_used = TRUE WHERE id = $1',
        [otpRecord.rows[0].id]
      );
    }

    // Find or create user
    const user = await this.userService.findOrCreateByPhone(phone);

    // Mark phone as verified
    if (!user.is_verified) {
      await query(
        'UPDATE users SET is_verified = TRUE WHERE id = $1',
        [user.id]
      );
      user.is_verified = true;
    }

    // Generate tokens and create session
    const tokens = await this.createAuthSession(user, deviceInfo);

    return { user, tokens };
  }

  // ============================================================
  // Google OAuth Flow
  // ============================================================

  /**
   * Process Google OAuth callback.
   * Called by Passport after successful Google authentication.
   * The user object is already created/found by passport.ts strategy.
   */
  async processGoogleAuth(
    user: User,
    deviceInfo: DeviceInfo
  ): Promise<{ user: User; tokens: TokenPair }> {
    const tokens = await this.createAuthSession(user, deviceInfo);
    return { user, tokens };
  }

  // ============================================================
  // Token Management
  // ============================================================

  /**
   * Refresh an expired access token using a valid refresh token.
   */
  async refreshAccessToken(
    refreshToken: string,
    deviceInfo: DeviceInfo
  ): Promise<{ tokens: TokenPair }> {
    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError('Invalid or expired refresh token. Please log in again.', 401);
    }

    // Verify the user still exists and is active
    const user = await this.userService.findById(payload.userId);
    if (!user || !user.is_active) {
      throw new ApiError('User account not found or deactivated.', 401);
    }

    const sessionUserId = await this.sessionService.validateRefreshSession(
      payload.sessionId,
      refreshToken
    );

    if (!sessionUserId || sessionUserId !== payload.userId) {
      throw new ApiError('This session is no longer active. Please log in again.', 401);
    }

    // Generate new token pair and session
    const tokens = await this.createAuthSession(user, deviceInfo);

    return { tokens };
  }

  /**
   * Logout: invalidate the current session.
   */
  async logout(accessToken: string): Promise<void> {
    await this.sessionService.logout(accessToken);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Create auth session: generate tokens + create session record.
   * Also enforces single active session (old session gets killed).
   */
  private async createAuthSession(
    user: User,
    deviceInfo: DeviceInfo
  ): Promise<TokenPair> {
    // Generate JWT token pair
    const sessionId = uuidv4();
    const tokens = generateTokenPair(
      user.id,
      user.email,
      user.role,
      sessionId
    );

    // Create session (this automatically invalidates any existing session)
    await this.sessionService.createSession(
      user.id,
      sessionId,
      tokens,
      deviceInfo
    );

    return tokens;
  }
}
