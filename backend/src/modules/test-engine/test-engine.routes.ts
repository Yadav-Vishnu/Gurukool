import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import {
  getAttemptAnalytics,
  getAttemptDetail,
  getCatalog,
  startAdaptiveAttempt,
  startAttempt,
  submitAttempt,
  updateAttemptAnswer,
} from './test-engine.controller';
import {
  startAdaptiveAttemptSchema,
  updateAttemptAnswerSchema,
  validate,
} from './test-engine.validators';

const router = Router();

router.use(authMiddleware);

router.get('/catalog', getCatalog);
router.post('/adaptive/start', validate(startAdaptiveAttemptSchema), startAdaptiveAttempt);
router.get('/attempts/:attemptId', getAttemptDetail);
router.patch('/attempts/:attemptId/questions/:questionId', validate(updateAttemptAnswerSchema), updateAttemptAnswer);
router.post('/attempts/:attemptId/submit', submitAttempt);
router.get('/attempts/:attemptId/analytics', getAttemptAnalytics);
router.post('/:testId/start', startAttempt);

export default router;
