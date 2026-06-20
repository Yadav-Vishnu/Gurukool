import { query, getClient } from '../../config/database';
import { User, CreateUserDTO } from '../../types';

/**
 * Helper to map flat joined rows to structured User objects.
 */
const mapUserRow = (row: any): User | null => {
  if (!row) return null;
  const user: User = {
    id: row.id,
    email: row.email,
    phone: row.phone,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    auth_provider: row.auth_provider,
    google_id: row.google_id,
    github_id: row.github_id,
    linkedin_id: row.linkedin_id,
    profile_completed: row.profile_completed,
    is_verified: row.is_verified,
    is_active: row.is_active,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (row.profile_id) {
    user.profile = {
      id: row.profile_id,
      user_id: row.id,
      name: row.profile_name,
      avatar: row.profile_avatar,
      created_at: row.profile_created_at,
      updated_at: row.profile_updated_at,
    };
  }

  if (row.ws_id) {
    user.workspaceSettings = {
      id: row.ws_id,
      user_id: row.id,
      theme: (row.ws_theme === 'forest' || row.ws_theme === 'ocean') ? 'light' : (row.ws_theme || 'light'),
      sidebar_collapsed: row.ws_sidebar_collapsed,
      notifications_enabled: row.ws_notifications_enabled,
      created_at: row.ws_created_at,
      updated_at: row.ws_updated_at,
    };
  }

  return user;
};

/**
 * User Model — Data Access Layer
 *
 * This file contains all SQL queries related to users.
 * It is the ONLY place that talks directly to the database for user data.
 * All queries use parameterized inputs ($1, $2) to prevent SQL injection.
 */
export class UserModel {
  /**
   * Find a user by their UUID.
   */
  static async findById(id: string): Promise<User | null> {
    const result = await query(
      `SELECT u.*, 
              p.id as profile_id, p.name as profile_name, p.avatar as profile_avatar, p.created_at as profile_created_at, p.updated_at as profile_updated_at,
              w.id as ws_id, w.theme as ws_theme, w.sidebar_collapsed as ws_sidebar_collapsed, w.notifications_enabled as ws_notifications_enabled, w.created_at as ws_created_at, w.updated_at as ws_updated_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN workspace_settings w ON u.id = w.user_id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [id]
    );
    return mapUserRow(result.rows[0]);
  }

  /**
   * Find a user by email address.
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT u.*, 
              p.id as profile_id, p.name as profile_name, p.avatar as profile_avatar, p.created_at as profile_created_at, p.updated_at as profile_updated_at,
              w.id as ws_id, w.theme as ws_theme, w.sidebar_collapsed as ws_sidebar_collapsed, w.notifications_enabled as ws_notifications_enabled, w.created_at as ws_created_at, w.updated_at as ws_updated_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN workspace_settings w ON u.id = w.user_id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [email]
    );
    return mapUserRow(result.rows[0]);
  }

  /**
   * Find a user by phone number.
   */
  static async findByPhone(phone: string): Promise<User | null> {
    const result = await query(
      `SELECT u.*, 
              p.id as profile_id, p.name as profile_name, p.avatar as profile_avatar, p.created_at as profile_created_at, p.updated_at as profile_updated_at,
              w.id as ws_id, w.theme as ws_theme, w.sidebar_collapsed as ws_sidebar_collapsed, w.notifications_enabled as ws_notifications_enabled, w.created_at as ws_created_at, w.updated_at as ws_updated_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN workspace_settings w ON u.id = w.user_id
       WHERE u.phone = $1 AND u.is_active = TRUE`,
      [phone]
    );
    return mapUserRow(result.rows[0]);
  }

  /**
   * Find a user by their Google ID.
   */
  static async findByGoogleId(googleId: string): Promise<User | null> {
    const result = await query(
      `SELECT u.*, 
              p.id as profile_id, p.name as profile_name, p.avatar as profile_avatar, p.created_at as profile_created_at, p.updated_at as profile_updated_at,
              w.id as ws_id, w.theme as ws_theme, w.sidebar_collapsed as ws_sidebar_collapsed, w.notifications_enabled as ws_notifications_enabled, w.created_at as ws_created_at, w.updated_at as ws_updated_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN workspace_settings w ON u.id = w.user_id
       WHERE u.google_id = $1 AND u.is_active = TRUE`,
      [googleId]
    );
    return mapUserRow(result.rows[0]);
  }

  /**
   * Find a user by their GitHub ID.
   */
  static async findByGithubId(githubId: string): Promise<User | null> {
    const result = await query(
      `SELECT u.*, 
              p.id as profile_id, p.name as profile_name, p.avatar as profile_avatar, p.created_at as profile_created_at, p.updated_at as profile_updated_at,
              w.id as ws_id, w.theme as ws_theme, w.sidebar_collapsed as ws_sidebar_collapsed, w.notifications_enabled as ws_notifications_enabled, w.created_at as ws_created_at, w.updated_at as ws_updated_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN workspace_settings w ON u.id = w.user_id
       WHERE u.github_id = $1 AND u.is_active = TRUE`,
      [githubId]
    );
    return mapUserRow(result.rows[0]);
  }

  /**
   * Find a user by their LinkedIn ID.
   */
  static async findByLinkedinId(linkedinId: string): Promise<User | null> {
    const result = await query(
      `SELECT u.*, 
              p.id as profile_id, p.name as profile_name, p.avatar as profile_avatar, p.created_at as profile_created_at, p.updated_at as profile_updated_at,
              w.id as ws_id, w.theme as ws_theme, w.sidebar_collapsed as ws_sidebar_collapsed, w.notifications_enabled as ws_notifications_enabled, w.created_at as ws_created_at, w.updated_at as ws_updated_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN workspace_settings w ON u.id = w.user_id
       WHERE u.linkedin_id = $1 AND u.is_active = TRUE`,
      [linkedinId]
    );
    return mapUserRow(result.rows[0]);
  }

  /**
   * Create a new user.
   */
  static async create(data: CreateUserDTO): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, phone, full_name, avatar_url, auth_provider, google_id, github_id, linkedin_id, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.email || null,
        data.phone || null,
        data.fullName,
        data.avatarUrl || null,
        data.authProvider,
        data.googleId || null,
        data.githubId || null,
        data.linkedinId || null,
        data.isVerified || false,
      ]
    );
    // Reload complete user object including profile and settings initialized by the triggers
    return (await this.findById(result.rows[0].id))!;
  }

  /**
   * Link a Google account to an existing user.
   */
  static async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatarUrl: string | null
  ): Promise<User> {
    await query(
      `UPDATE users 
       SET google_id = $1, avatar_url = COALESCE($2, avatar_url), updated_at = NOW()
       WHERE id = $3`,
      [googleId, avatarUrl, userId]
    );
    return (await this.findById(userId))!;
  }

  /**
   * Link a GitHub account to an existing user.
   */
  static async linkGithubAccount(
    userId: string,
    githubId: string,
    avatarUrl: string | null
  ): Promise<User> {
    await query(
      `UPDATE users 
       SET github_id = $1, avatar_url = COALESCE($2, avatar_url), updated_at = NOW()
       WHERE id = $3`,
      [githubId, avatarUrl, userId]
    );
    return (await this.findById(userId))!;
  }

  /**
   * Link a LinkedIn account to an existing user.
   */
  static async linkLinkedinAccount(
    userId: string,
    linkedinId: string,
    avatarUrl: string | null
  ): Promise<User> {
    await query(
      `UPDATE users 
       SET linkedin_id = $1, avatar_url = COALESCE($2, avatar_url), updated_at = NOW()
       WHERE id = $3`,
      [linkedinId, avatarUrl, userId]
    );
    return (await this.findById(userId))!;
  }

  /**
   * Update user profile & settings atomically in a transaction.
   */
  static async updateProfile(
    userId: string,
    updates: {
      fullName?: string;
      avatarUrl?: string;
      phone?: string;
      profileCompleted?: boolean;
      theme?: 'light' | 'dark' | 'saffron';
      sidebarCollapsed?: boolean;
      notificationsEnabled?: boolean;
    }
  ): Promise<User> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Update users table
      const userFields: string[] = [];
      const userValues: any[] = [];
      let uIdx = 1;

      if (updates.fullName !== undefined) {
        userFields.push(`full_name = $${uIdx++}`);
        userValues.push(updates.fullName);
      }
      if (updates.avatarUrl !== undefined) {
        userFields.push(`avatar_url = $${uIdx++}`);
        userValues.push(updates.avatarUrl);
      }
      if (updates.phone !== undefined) {
        userFields.push(`phone = $${uIdx++}`);
        userValues.push(updates.phone);
      }
      if (updates.profileCompleted !== undefined) {
        userFields.push(`profile_completed = $${uIdx++}`);
        userValues.push(updates.profileCompleted);
      }

      if (userFields.length > 0) {
        userFields.push('updated_at = NOW()');
        userValues.push(userId);
        await client.query(
          `UPDATE users SET ${userFields.join(', ')} WHERE id = $${uIdx}`,
          userValues
        );
      }

      // 2. Update profiles table
      const profileFields: string[] = [];
      const profileValues: any[] = [];
      let pIdx = 1;

      if (updates.fullName !== undefined) {
        profileFields.push(`name = $${pIdx++}`);
        profileValues.push(updates.fullName);
      }
      if (updates.avatarUrl !== undefined) {
        profileFields.push(`avatar = $${pIdx++}`);
        profileValues.push(updates.avatarUrl);
      }

      if (profileFields.length > 0) {
        profileFields.push('updated_at = NOW()');
        profileValues.push(userId);
        await client.query(
          `UPDATE profiles SET ${profileFields.join(', ')} WHERE user_id = $${pIdx}`,
          profileValues
        );
      }

      // 3. Update workspace_settings table
      const wsFields: string[] = [];
      const wsValues: any[] = [];
      let wIdx = 1;

      if (updates.theme !== undefined) {
        wsFields.push(`theme = $${wIdx++}`);
        wsValues.push(updates.theme);
      }
      if (updates.sidebarCollapsed !== undefined) {
        wsFields.push(`sidebar_collapsed = $${wIdx++}`);
        wsValues.push(updates.sidebarCollapsed);
      }
      if (updates.notificationsEnabled !== undefined) {
        wsFields.push(`notifications_enabled = $${wIdx++}`);
        wsValues.push(updates.notificationsEnabled);
      }

      if (wsFields.length > 0) {
        wsFields.push('updated_at = NOW()');
        wsValues.push(userId);
        await client.query(
          `UPDATE workspace_settings SET ${wsFields.join(', ')} WHERE user_id = $${wIdx}`,
          wsValues
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return (await this.findById(userId))!;
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
   * Soft-delete a user.
   */
  static async deactivate(userId: string): Promise<void> {
    await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }
}
