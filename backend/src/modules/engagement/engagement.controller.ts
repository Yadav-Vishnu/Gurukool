import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { sendCreated, sendError, sendSuccess } from '../../utils/response';
import { EngagementService } from './engagement.service';

const engagementService = new EngagementService();

const requireUserId = (req: Request, res: Response): string | null => {
  const userId = req.user?.id;
  if (!userId) {
    sendError(res, 'User not authenticated', 401);
    return null;
  }

  return userId;
};

const routeParam = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new Error('Required route parameter is missing');
  }

  return Array.isArray(value) ? value[0] : value;
};

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const dashboard = await engagementService.getDashboard(userId);
  sendSuccess(res, 'Engagement dashboard loaded successfully', dashboard);
});

export const getDailyFlashcards = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const flashcards = await engagementService.getDailyFlashcards(userId);
  sendSuccess(res, 'Daily formula flashcards loaded successfully', flashcards);
});

export const reviewFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const review = await engagementService.reviewFlashcard(
    userId,
    routeParam(req.params.formulaId),
    req.body.confidence
  );
  sendCreated(res, 'Formula review saved successfully', review);
});

export const getBadges = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const badges = await engagementService.listBadges(userId);
  sendSuccess(res, 'Badges loaded successfully', badges);
});

export const getWeeklyChallenges = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const challenges = await engagementService.listWeeklyChallenges(userId);
  sendSuccess(res, 'Weekly challenges loaded successfully', challenges);
});

export const joinWeeklyChallenge = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const challenge = await engagementService.joinWeeklyChallenge(
    userId,
    routeParam(req.params.challengeId)
  );
  sendCreated(res, 'Weekly challenge joined successfully', challenge);
});

export const submitChallengeScore = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const challenge = await engagementService.submitChallengeScore(
    userId,
    routeParam(req.params.challengeId),
    req.body.score
  );
  sendSuccess(res, 'Weekly challenge score submitted successfully', challenge);
});

export const getLiveQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const quizzes = await engagementService.listLiveQuizzes(userId);
  sendSuccess(res, 'Live quizzes loaded successfully', quizzes);
});

export const submitQuizAnswer = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const answer = await engagementService.submitQuizAnswer(
    userId,
    routeParam(req.params.questionId),
    req.body.selectedOption
  );
  sendCreated(res, 'Live quiz answer submitted successfully', answer);
});

export const getQuizLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const leaderboard = await engagementService.getQuizLeaderboard(
    routeParam(req.params.quizId)
  );
  sendSuccess(res, 'Live quiz leaderboard loaded successfully', leaderboard);
});

export const getReferralSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const referral = await engagementService.getReferralSummary(userId);
  sendSuccess(res, 'Referral summary loaded successfully', referral);
});

export const applyReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const referral = await engagementService.applyReferralCode(
    userId,
    req.body.referralCode
  );
  sendCreated(res, 'Referral code applied successfully', referral);
});

export const generateMentorRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const roadmap = await engagementService.generateMentorRoadmap(userId);
  sendCreated(res, 'AI mentor roadmap generated successfully', roadmap);
});

export const getMentorRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const roadmap = await engagementService.getLatestRoadmap(userId);
  sendSuccess(res, 'AI mentor roadmap loaded successfully', roadmap);
});
