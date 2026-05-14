import { Router } from 'express';
import { getMyProfile, updateMyProfile, deactivateMyAccount } from './user.controller';
import { authMiddleware } from '../auth/auth.middleware';

/**
 * User Routes
 * All routes require authentication (authMiddleware).
 */
const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.delete('/me', deactivateMyAccount);

export default router;
