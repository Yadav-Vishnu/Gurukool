import { query, getClient } from '../../config/database';
import { User, CreateUserDTO } from '../../types';

/**
 * User Model — Data Access Layer
 *
 * This file contains all SQL queries related to users.
 * It's the ONLY place that talks directly to the database for user data.
 * All queries use parameterized inputs ($1, $2) to prevent SQL injection.
 */
export class UserModel {
  /**
   * Find a user by their UUID.
   */
  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find a user by email address.
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Find a user by phone number.
   */
  static async findByPhone(phone: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE phone = $1 AND is_active = TRUE',
      [phone]
    );
    return result.rows[0] || null;
  }

  /**
   * Find a user by their Google ID.
   */
  static async findByGoogleId(googleId: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE google_id = $1 AND is_active = TRUE',
      [googleId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new user.
   */
  static async create(data: CreateUserDTO): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, phone, full_name, avatar_url, auth_provider, google_id, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.email || null,
        data.phone || null,
        data.fullName,
        data.avatarUrl || null,
        data.authProvider,
        data.googleId || null,
        data.isVerified || false,
      ]
    );
    return result.rows[0];
  }

  /**
   * Link a Google account to an existing user.
   */
  static async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatarUrl: string | null
  ): Promise<User> {
    const result = await query(
      `UPDATE users 
       SET google_id = $1, avatar_url = COALESCE($2, avatar_url), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [googleId, avatarUrl, userId]
    );
    return result.rows[0];
  }

  /**
   * Update user profile.
   */
  static async updateProfile(
    userId: string,
    updates: { fullName?: string; avatarUrl?: string; phone?: string }
  ): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.fullName) {
      fields.push(`full_name = $${paramIndex++}`);
      values.push(updates.fullName);
    }
    if (updates.avatarUrl) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(updates.avatarUrl);
    }
    if (updates.phone) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }

    fields.push('updated_at = NOW()');
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  /**
   * Mark phone as verified.
   */
  static async verifyPhone(userId: string): Promise<void> {
    await query(
      'UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Soft-delete a user (set is_active = false, don't actually delete).
   */
  static async deactivate(userId: string): Promise<void> {
    await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }
}
