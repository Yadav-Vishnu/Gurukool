import { UserModel } from './user.model';
import { User, CreateUserDTO } from '../../types';

/**
 * User Service — Business Logic Layer
 *
 * Contains all user-related business logic.
 * Called by controllers (which handle HTTP) and by other services.
 */
export class UserService {
  /**
   * Find a user by their UUID.
   */
  async findById(id: string): Promise<User | null> {
    return UserModel.findById(id);
  }

  /**
   * Find a user by email.
   */
  async findByEmail(email: string): Promise<User | null> {
    return UserModel.findByEmail(email);
  }

  /**
   * Find a user by phone number.
   */
  async findByPhone(phone: string): Promise<User | null> {
    return UserModel.findByPhone(phone);
  }

  /**
   * Find a user by Google ID.
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return UserModel.findByGoogleId(googleId);
  }

  /**
   * Create a new user.
   */
  async createUser(data: CreateUserDTO): Promise<User> {
    return UserModel.create(data);
  }

  /**
   * Link a Google account to an existing user.
   */
  async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatarUrl: string | null
  ): Promise<User> {
    return UserModel.linkGoogleAccount(userId, googleId, avatarUrl);
  }

  /**
   * Update user profile information.
   */
  async updateProfile(
    userId: string,
    updates: { fullName?: string; avatarUrl?: string; phone?: string }
  ): Promise<User> {
    return UserModel.updateProfile(userId, updates);
  }

  /**
   * Find or create a user from phone number (for OTP flow).
   * If user exists, return them. If not, create a new user.
   */
  async findOrCreateByPhone(phone: string): Promise<User> {
    const existing = await UserModel.findByPhone(phone);
    if (existing) {
      return existing;
    }

    // Create a new user with phone
    return UserModel.create({
      phone,
      fullName: 'Gurukool User', // They can update this later
      authProvider: 'phone',
      isVerified: false,
    });
  }

  /**
   * Deactivate a user account (soft delete).
   */
  async deactivateUser(userId: string): Promise<void> {
    return UserModel.deactivate(userId);
  }
}
