import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { sendCreated, sendError, sendSuccess } from '../../utils/response';
import { PlatformService } from './platform.service';

const platformService = new PlatformService();

const requireUser = (req: Request, res: Response) => {
  if (!req.user) {
    sendError(res, 'User not authenticated', 401);
    return null;
  }

  return req.user;
};

const routeParam = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new Error('Required route parameter is missing');
  }

  return Array.isArray(value) ? value[0] : value;
};

export const getPlatformDashboard = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const dashboard = await platformService.getDashboard(user.id, user.role);
  sendSuccess(res, 'Platform growth dashboard loaded successfully', dashboard);
});

export const listDeployments = asyncHandler(async (_req: Request, res: Response) => {
  const deployments = await platformService.listDeployments();
  sendSuccess(res, 'Deployment releases loaded successfully', deployments);
});

export const listScaleProfiles = asyncHandler(async (_req: Request, res: Response) => {
  const profiles = await platformService.listScaleProfiles();
  sendSuccess(res, 'Service scale profiles loaded successfully', profiles);
});

export const listInstitutions = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const institutions = await platformService.listInstitutions(user.id, user.role);
  sendSuccess(res, 'Institution partners loaded successfully', institutions);
});

export const createInstitution = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const institution = await platformService.createInstitution(user.id, req.body);
  sendCreated(res, 'Institution partner request created successfully', institution);
});

export const listHostedTests = asyncHandler(async (req: Request, res: Response) => {
  const institutionId =
    typeof req.query.institutionId === 'string' ? req.query.institutionId : undefined;
  const hostedTests = await platformService.listHostedTests(institutionId);
  sendSuccess(res, 'Institution hosted tests loaded successfully', hostedTests);
});

export const requestHostedTest = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const hostedTest = await platformService.requestHostedTest(
    user.id,
    routeParam(req.params.institutionId),
    req.body
  );
  sendCreated(res, 'Hosted test request created successfully', hostedTest);
});

export const reportContent = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const moderationCase = await platformService.reportContent(user.id, req.body);
  sendCreated(res, 'Content report queued for moderation successfully', moderationCase);
});

export const listModerationQueue = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const queue = await platformService.listModerationQueue(user.role);
  sendSuccess(res, 'Moderation queue loaded successfully', queue);
});

export const reviewModerationCase = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const moderationCase = await platformService.reviewModerationCase(
    user.id,
    user.role,
    routeParam(req.params.caseId),
    req.body
  );
  sendSuccess(res, 'Moderation case reviewed successfully', moderationCase);
});
