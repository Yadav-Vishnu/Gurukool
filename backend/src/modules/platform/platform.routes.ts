import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import {
  createInstitution,
  getPlatformDashboard,
  listDeployments,
  listHostedTests,
  listInstitutions,
  listModerationQueue,
  listScaleProfiles,
  reportContent,
  requestHostedTest,
  reviewModerationCase,
} from './platform.controller';
import {
  createInstitutionSchema,
  hostTestSchema,
  reportContentSchema,
  reviewModerationCaseSchema,
  validate,
} from './platform.validators';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getPlatformDashboard);
router.get('/deployments', listDeployments);
router.get('/scale-profiles', listScaleProfiles);

router.get('/institutions', listInstitutions);
router.post('/institutions', validate(createInstitutionSchema), createInstitution);
router.get('/institutions/hosted-tests', listHostedTests);
router.post(
  '/institutions/:institutionId/hosted-tests',
  validate(hostTestSchema),
  requestHostedTest
);

router.post('/moderation/report', validate(reportContentSchema), reportContent);
router.get('/moderation/queue', listModerationQueue);
router.patch(
  '/moderation/cases/:caseId/review',
  validate(reviewModerationCaseSchema),
  reviewModerationCase
);

export default router;
