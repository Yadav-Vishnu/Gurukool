import { query } from '../../config/database';
import { setSession, deleteSession, getSession } from '../../config/redis';
import { hashToken } from '../../utils/jwt';
import { DeviceInfo, TokenPair, UserSession } from '../../types';

/**
 * Session Service
 *
 * Manages user sessions with SINGLE ACTIVE SESSION enforcement.
 * When a user logs in on a new device:
 * 1. The old session is invalidated (in both PostgreSQL and Redis)
 * 2. A new session is created
 * 3. The old device gets a 401 error on its next request
 */
export class SessionService {
  /**
   * Create a new session, invalidating any existing active session.
   * This is the core of the "single session" rule.
   */
  async createSession(
    userId: string,
    sessionIdentifier: string,
    tokens: TokenPair,
    deviceInfo: DeviceInfo,
    expiresInDays: number = 7
  ): Promise<UserSession> {
    const tokenHash = hashToken(tokens.accessToken);
    const refreshTokenHash = hashToken(tokens.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Step 1: Find and deactivate any existing active session
    const existingSession = await this.getActiveSession(userId);
    if (existingSession) {
      await this.invalidateSession(existingSession.id, existingSession.token_hash);
      console.log(`🔒 Invalidated previous session for user ${userId}`);
    }

    // Step 2: Create new session in PostgreSQL
    const result = await query(
      `INSERT INTO user_sessions (
         user_id,
         session_identifier,
         token_hash,
         refresh_token_hash,
         device_info,
         is_active,
         expires_at
       )
       VALUES ($1, $2, $3, $4, $5, TRUE, $6)
       RETURNING *`,
      [
        userId,
        sessionIdentifier,
        tokenHash,
        refreshTokenHash,
        JSON.stringify(deviceInfo),
        expiresAt,
      ]
    );

    // Step 3: Cache session in Redis for fast lookups
    const ttlSeconds = expiresInDays * 24 * 60 * 60;
    await setSession(tokenHash, userId, ttlSeconds);

    console.log(`✅ New session created for user ${userId}`);
    return result.rows[0];
  }

  /**
   * Get the currently active session for a user.
   */
  async getActiveSession(userId: string): Promise<UserSession | null> {
    const result = await query(
      `SELECT * FROM user_sessions 
       WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Validate a session token — check both Redis (fast) and PostgreSQL (authoritative).
   */
  async validateAccessSession(
    sessionIdentifier: string,
    accessToken: string
  ): Promise<string | null> {
    const tokenHash = hashToken(accessToken);

    // Check Redis first (fast path)
    const cachedUserId = await getSession(tokenHash);
    if (cachedUserId) {
      // Update last_active timestamp (async, non-blocking)
      this.updateLastActive(tokenHash).catch(() => {});
      return cachedUserId;
    }

    // Redis miss — check PostgreSQL (authoritative)
    const result = await query(
      `SELECT user_id FROM user_sessions
       WHERE session_identifier = $1
         AND token_hash = $2
         AND is_active = TRUE
         AND expires_at > NOW()`,
      [sessionIdentifier, tokenHash]
    );

    if (result.rows[0]) {
      // Re-cache in Redis
      await setSession(tokenHash, result.rows[0].user_id);
      return result.rows[0].user_id;
    }

    return null; // Session not found or expired
  }

  /**
   * Validate a refresh token against the currently active session.
   * This lets us rotate refresh tokens and block old devices instantly.
   */
  async validateRefreshSession(
    sessionIdentifier: string,
    refreshToken: string
  ): Promise<string | null> {
    const refreshTokenHash = hashToken(refreshToken);

    const result = await query(
      `SELECT user_id FROM user_sessions
       WHERE session_identifier = $1
         AND refresh_token_hash = $2
         AND is_active = TRUE
         AND expires_at > NOW()`,
      [sessionIdentifier, refreshTokenHash]
    );

    return result.rows[0]?.user_id || null;
  }

  /**
   * Invalidate a specific session (logout or session replacement).
   */
  async invalidateSession(sessionId: string, tokenHash: string): Promise<void> {
    // Remove from PostgreSQL
    await query(
      'UPDATE user_sessions SET is_active = FALSE WHERE id = $1',
      [sessionId]
    );

    // Remove from Redis
    await deleteSession(tokenHash);
  }

  /**
   * Invalidate ALL sessions for a user (e.g., password reset, security concern).
   */
  async invalidateAllSessions(userId: string): Promise<void> {
    // Get all active sessions to remove from Redis
    const result = await query(
      'SELECT token_hash FROM user_sessions WHERE user_id = $1 AND is_active = TRUE',
      [userId]
    );

    // Remove each from Redis
    for (const row of result.rows) {
      await deleteSession(row.token_hash);
    }

    // Deactivate all in PostgreSQL
    await query(
      'UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Logout: invalidate the current session.
   */
  async logout(accessToken: string): Promise<void> {
    const tokenHash = hashToken(accessToken);
    
    const result = await query(
      'SELECT id FROM user_sessions WHERE token_hash = $1 AND is_active = TRUE',
      [tokenHash]
    );

    if (result.rows[0]) {
      await this.invalidateSession(result.rows[0].id, tokenHash);
    }
  }

  /**
   * Update the last_active_at timestamp for a session.
   */
  private async updateLastActive(tokenHash: string): Promise<void> {
    await query(
      'UPDATE user_sessions SET last_active_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );
  }

  /**
   * Get all sessions for a user (for "active sessions" UI).
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    const result = await query(
      `SELECT id, session_identifier, device_info, is_active, created_at, expires_at, last_active_at
       FROM user_sessions 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );
    return result.rows;
  }
}
