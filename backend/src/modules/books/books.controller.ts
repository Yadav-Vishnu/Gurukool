import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler';
import { sendCreated, sendError, sendSuccess } from '../../utils/response';
import { BooksService } from './books.service';

const booksService = new BooksService();

const getRouteParam = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new Error('Required route parameter is missing');
  }

  return Array.isArray(value) ? value[0] : value;
};

export const getSubjects = asyncHandler(async (_req: Request, res: Response) => {
  const subjects = await booksService.listSubjects();
  sendSuccess(res, 'Subjects loaded successfully', subjects);
});

export const uploadBook = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const created = await booksService.uploadBook(userId, req.body);
  return sendCreated(res, 'Book uploaded successfully', created);
});

export const confirmBookSubject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const updated = await booksService.confirmBookSubject(
    userId,
    getRouteParam(req.params.bookId),
    req.body
  );

  return sendSuccess(res, 'Book subject confirmed successfully', updated);
});

export const getBooks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const books = await booksService.listBooks(userId);
  return sendSuccess(res, 'Books loaded successfully', books);
});

export const addHighlight = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const created = await booksService.addHighlight(
    userId,
    getRouteParam(req.params.bookId),
    req.body
  );

  return sendCreated(res, 'Highlight saved and copied to notebook', created);
});

export const addManualNote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const created = await booksService.createManualNote(userId, req.body);
  return sendCreated(res, 'Manual note saved successfully', created);
});

export const paraphraseNote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const created = await booksService.paraphraseAndSave(userId, req.body);
  return sendCreated(res, 'Paraphrased note saved successfully', created);
});

export const getNotebookEntries = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const subjectCode =
    typeof req.query.subjectCode === 'string' ? req.query.subjectCode : undefined;
  const entries = await booksService.listNotebookEntries(userId, subjectCode);
  return sendSuccess(res, 'Notebook entries loaded successfully', entries);
});
