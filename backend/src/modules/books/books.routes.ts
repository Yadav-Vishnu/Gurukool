import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import {
  addHighlight,
  addManualNote,
  confirmBookSubject,
  getBooks,
  getNotebookEntries,
  getSubjects,
  paraphraseNote,
  uploadBook,
} from './books.controller';
import {
  confirmBookSubjectSchema,
  createHighlightSchema,
  createManualNoteSchema,
  paraphraseSchema,
  uploadBookSchema,
  validate,
} from './books.validators';

const router = Router();

router.use(authMiddleware);

router.get('/subjects', getSubjects);
router.get('/books', getBooks);
router.post('/books/upload', validate(uploadBookSchema), uploadBook);
router.patch('/books/:bookId/confirm-subject', validate(confirmBookSubjectSchema), confirmBookSubject);
router.post('/books/:bookId/highlights', validate(createHighlightSchema), addHighlight);
router.get('/notebooks', getNotebookEntries);
router.post('/notebooks/manual', validate(createManualNoteSchema), addManualNote);
router.post('/notebooks/paraphrase', validate(paraphraseSchema), paraphraseNote);

export default router;
