import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { SessionService } from '../session/session.service';
import { UserService } from '../user/user.service';
import { sendUnauthorized } from '../../utils/response';

const sessionService = new SessionService();
const userService = new UserService();

/**
 * Auth Middleware
 *
 * Protects routes by verifying the JWT access token.
 * Flow:
 * 1. Extract token from Authorization header ("Bearer <token>")
 * 2. Verify the JWT signature and expiry
 * 3. Check that the session is still active (not logged out elsewhere)
 * 4. Attach the user object to req.user for downstream handlers
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No authentication token provided');
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendUnauthorized(res, 'Invalid authorization header format');
      return;
    }

    // Step 2: Verify JWT
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        sendUnauthorized(res, 'Token expired. Please refresh your session.');
        return;
      }
      sendUnauthorized(res, 'Invalid authentication token');
      return;
    }

    // Step 3: Verify session is still active
    const sessionUserId = await sessionService.validateAccessSession(
      payload.sessionId,
      token
    );
    if (!sessionUserId) {
      sendUnauthorized(
        res,
        'Session invalidated. You may have logged in on another device.'
      );
      return;
    }

    // Step 4: Load user data
    const user = await userService.findById(payload.userId);
    if (!user || !user.is_active) {
      sendUnauthorized(res, 'User account not found or deactivated');
      return;
    }

    // Attach user to request for downstream handlers
    req.user = user;
    req.sessionId = payload.sessionId;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Optional auth middleware — doesn't block if no token is present,
 * but attaches user if a valid token is found.
 * Useful for endpoints that work for both guests and logged-in users.
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await userService.findById(payload.userId);
    if (user) {
      req.user = user;
      req.sessionId = payload.sessionId;
    }
  } catch {
    // Token invalid — just continue without user
  }

  next();
};
