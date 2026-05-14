import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { sendCreated, sendError, sendSuccess } from '../../utils/response';
import { TestEngineService } from './test-engine.service';

const testEngineService = new TestEngineService();

const getRouteParam = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new Error('Required route parameter is missing');
  }

  return Array.isArray(value) ? value[0] : value;
};

const getQueryString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getQueryNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getCatalog = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    type: getQueryString(req.query.type),
    subjectCode: getQueryString(req.query.subjectCode),
    topicSlug: getQueryString(req.query.topicSlug),
    examCode: getQueryString(req.query.examCode),
    companyName: getQueryString(req.query.companyName),
    paperCode: getQueryString(req.query.paperCode),
    examYear: getQueryNumber(req.query.examYear),
    adaptiveOnly: getQueryString(req.query.adaptiveOnly) === 'true',
  };

  const catalog = await testEngineService.getCatalog(filters);
  sendSuccess(res, 'Test catalog retrieved successfully', catalog);
});

export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const result = await testEngineService.startAttempt(userId, getRouteParam(req.params.testId));

  if (result.resumed) {
    return sendSuccess(res, 'Active attempt resumed', result);
  }

  return sendCreated(res, 'Test attempt started', result);
});

export const getAttemptDetail = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const detail = await testEngineService.getAttemptDetail(userId, getRouteParam(req.params.attemptId));
  sendSuccess(res, 'Attempt loaded successfully', detail);
});

export const updateAttemptAnswer = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const updated = await testEngineService.updateAttemptAnswer(
    userId,
    getRouteParam(req.params.attemptId),
    getRouteParam(req.params.questionId),
    req.body
  );

  sendSuccess(res, 'Answer saved successfully', updated);
});

export const submitAttempt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const analytics = await testEngineService.submitAttempt(userId, getRouteParam(req.params.attemptId));
  sendSuccess(res, 'Test submitted successfully', analytics);
});

export const getAttemptAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const analytics = await testEngineService.getAttemptAnalytics(userId, getRouteParam(req.params.attemptId));
  sendSuccess(res, 'Analytics retrieved successfully', analytics);
});

export const startAdaptiveAttempt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const result = await testEngineService.startAdaptiveAttempt(userId, req.body);
  sendCreated(res, 'Adaptive mock started', result);
});
