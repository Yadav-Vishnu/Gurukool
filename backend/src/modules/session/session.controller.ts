import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../middleware/error-handler';

const sessionService = new SessionService();

/**
 * GET /api/sessions
 * Get all sessions for the current user (shows active devices).
 */
export const getMySessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const sessions = await sessionService.getUserSessions(userId);
  sendSuccess(res, 'Sessions retrieved', sessions);
});

/**
 * DELETE /api/sessions/all
 * Logout from all devices.
 */
export const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  await sessionService.invalidateAllSessions(userId);
  sendSuccess(res, 'Logged out from all devices');
});
