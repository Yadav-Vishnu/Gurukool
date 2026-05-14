import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../auth/auth.middleware';
import {
  applyReferralCode,
  generateMentorRoadmap,
  getBadges,
  getDailyFlashcards,
  getDashboard,
  getLiveQuizzes,
  getMentorRoadmap,
  getQuizLeaderboard,
  getReferralSummary,
  getWeeklyChallenges,
  joinWeeklyChallenge,
  reviewFlashcard,
  submitChallengeScore,
  submitQuizAnswer,
} from './engagement.controller';
import {
  applyReferralSchema,
  reviewFlashcardSchema,
  submitChallengeScoreSchema,
  submitQuizAnswerSchema,
  validate,
} from './engagement.validators';

const router = Router();

router.get('/quizzes/live', optionalAuthMiddleware, getLiveQuizzes);
router.get('/quizzes/:quizId/leaderboard', optionalAuthMiddleware, getQuizLeaderboard);

router.use(authMiddleware);

router.get('/dashboard', getDashboard);
router.get('/flashcards/daily', getDailyFlashcards);
router.post('/flashcards/:formulaId/review', validate(reviewFlashcardSchema), reviewFlashcard);
router.get('/badges', getBadges);

router.get('/challenges/weekly', getWeeklyChallenges);
router.post('/challenges/:challengeId/join', joinWeeklyChallenge);
router.post(
  '/challenges/:challengeId/score',
  validate(submitChallengeScoreSchema),
  submitChallengeScore
);

router.post(
  '/quizzes/questions/:questionId/answer',
  validate(submitQuizAnswerSchema),
  submitQuizAnswer
);

router.get('/referrals', getReferralSummary);
router.post('/referrals/apply', validate(applyReferralSchema), applyReferralCode);

router.get('/mentor/roadmap', getMentorRoadmap);
router.post('/mentor/roadmap', generateMentorRoadmap);

export default router;
