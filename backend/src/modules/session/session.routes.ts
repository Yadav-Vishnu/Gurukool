import { Router } from 'express';
import { getMySessions, logoutAllDevices } from './session.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getMySessions);
router.delete('/all', logoutAllDevices);

export default router;
