import { Request, Response } from 'express';
import { UserService } from './user.service';
import { sendSuccess, sendNotFound, sendError } from '../../utils/response';
import { asyncHandler } from '../../middleware/error-handler';

/**
 * User Controller — HTTP Request Handlers
 *
 * Handles incoming HTTP requests, extracts data from the request,
 * calls the appropriate service method, and sends the response.
 */
const userService = new UserService();

/**
 * GET /api/users/me
 * Get the currently logged-in user's profile.
 */
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const user = await userService.findById(userId);
  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  // Don't send sensitive fields
  const { google_id, ...safeUser } = user;
  sendSuccess(res, 'Profile retrieved successfully', safeUser);
});

/**
 * PUT /api/users/me
 * Update the currently logged-in user's profile.
 */
export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const { fullName, avatarUrl, phone } = req.body;
  const updatedUser = await userService.updateProfile(userId, {
    fullName,
    avatarUrl,
    phone,
  });

  const { google_id, ...safeUser } = updatedUser;
  sendSuccess(res, 'Profile updated successfully', safeUser);
});

/**
 * DELETE /api/users/me
 * Deactivate the currently logged-in user's account.
 */
export const deactivateMyAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  await userService.deactivateUser(userId);
  sendSuccess(res, 'Account deactivated successfully');
});
