import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getClient, query } from '../../config/database';
import { ApiError } from '../../middleware/error-handler';

type UploadBookInput = {
  fileName: string;
  mimeType: 'application/pdf';
  fileBase64: string;
  extractedTextPreview?: string;
};

type ConfirmSubjectInput = {
  subjectCode: string;
};

type HighlightInput = {
  pageNumber?: number;
  highlightText: string;
  title?: string;
};

type ManualNoteInput = {
  subjectCode?: string;
  title?: string;
  sourceText?: string;
  noteText: string;
  examYear?: number;
};

type ParaphraseInput = {
  sourceText: string;
  style: 'concise' | 'exam-ready' | 'memory-hook';
  subjectCode?: string;
  sourceEntryId?: string;
};

type SubjectRow = {
  id: string;
  code: string;
  name: string;
};

type TopicRow = {
  subject_id: string;
  name: string;
  slug: string;
};

type DetectionResult = {
  detectedSubjectId: string | null;
  detectedSubjectCode: string | null;
  confidence: number;
  metadata: Record<string, unknown>;
};

const MAX_BOOK_SIZE_BYTES = 12 * 1024 * 1024;

const keywordFallbacks: Record<string, string[]> = {
  MATH: [
    'matrix',
    'determinant',
    'eigenvalue',
    'linear algebra',
    'calculus',
    'integration',
    'differentiation',
    'vector',
    'rank',
  ],
  ME: [
    'stress',
    'strain',
    'bending',
    'torsion',
    'shaft',
    'beam',
    'thermodynamics',
    'entropy',
    'heat transfer',
    'mechanical',
  ],
  GA: [
    'aptitude',
    'percentage',
    'ratio',
    'probability',
    'time and work',
    'logical reasoning',
    'train',
    'quantitative',
  ],
};

const normalizeText = (value: string): string =>
  value
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeFileName = (value: string): string =>
  value
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'book.pdf';

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractPreviewFromBuffer = (buffer: Buffer): string => {
  const previewBytes = buffer.subarray(0, Math.min(buffer.length, 220000));
  const decoded = previewBytes.toString('latin1');
  const printable = decoded.replace(/[^a-zA-Z0-9.,;:!?()_\-/%\s]/g, ' ');
  return normalizeText(printable).slice(0, 30000);
};

const ensurePdfHeader = (buffer: Buffer): void => {
  const signature = buffer.subarray(0, 5).toString('latin1');
  if (signature !== '%PDF-') {
    throw new ApiError('Uploaded file is not a valid PDF document.', 400);
  }
};

const createParaphrase = (
  sourceText: string,
  style: 'concise' | 'exam-ready' | 'memory-hook'
): string => {
  const normalized = normalizeText(sourceText);
  const replacements: Array<[RegExp, string]> = [
    [/\bimportant\b/gi, 'key'],
    [/\bbecause\b/gi, 'since'],
    [/\btherefore\b/gi, 'so'],
    [/\butilize\b/gi, 'use'],
    [/\bapproximately\b/gi, 'about'],
  ];

  let rewritten = normalized;
  for (const [pattern, replacement] of replacements) {
    rewritten = rewritten.replace(pattern, replacement);
  }

  const sentences = rewritten
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return rewritten;
  }

  if (style === 'concise') {
    return sentences.slice(0, 2).join(' ');
  }

  if (style === 'memory-hook') {
    return `Remember this in one line: ${sentences[0]}`;
  }

  const maxLines = Math.min(3, sentences.length);
  const bulletLines = sentences.slice(0, maxLines).map((line) => `- ${line}`);
  return ['Exam-ready summary:', ...bulletLines].join('\n');
};

export class BooksService {
  async listSubjects() {
    const subjects = await query(
      `SELECT id, code, name
       FROM subjects
       ORDER BY code ASC`
    );

    return subjects.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));
  }

  async uploadBook(userId: string, input: UploadBookInput) {
    let fileBuffer: Buffer;

    try {
      fileBuffer = Buffer.from(input.fileBase64, 'base64');
    } catch {
      throw new ApiError('PDF content could not be decoded from base64.', 400);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new ApiError('Uploaded file was empty.', 400);
    }

    if (fileBuffer.length > MAX_BOOK_SIZE_BYTES) {
      throw new ApiError('PDF is too large. Maximum allowed size is 12 MB.', 400);
    }

    ensurePdfHeader(fileBuffer);

    const normalizedPreview = normalizeText(
      input.extractedTextPreview && input.extractedTextPreview.trim().length > 0
        ? input.extractedTextPreview
        : extractPreviewFromBuffer(fileBuffer)
    ).slice(0, 30000);

    const detection = await this.detectSubject(normalizedPreview);
    const fileExtension = path.extname(input.fileName) || '.pdf';
    const diskFileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeFileName(
      input.fileName.replace(/\.[^.]+$/, '')
    )}${fileExtension}`;

    const absoluteDir = path.join(process.cwd(), 'storage', 'books', userId);
    const absolutePath = path.join(absoluteDir, diskFileName);

    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(absolutePath, fileBuffer);

    const created = await query(
      `INSERT INTO study_books (
         user_id,
         file_name,
         mime_type,
         file_path,
         file_size_bytes,
         content_preview,
         detected_subject_id,
         detected_confidence,
         detection_metadata,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, 'pending_confirmation')
       RETURNING id, file_name, created_at, status`,
      [
        userId,
        input.fileName,
        input.mimeType,
        absolutePath,
        fileBuffer.length,
        normalizedPreview || null,
        detection.detectedSubjectId,
        detection.confidence,
        JSON.stringify(detection.metadata),
      ]
    );

    const subjectOptions = await this.listSubjects();

    return {
      id: created.rows[0].id,
      fileName: created.rows[0].file_name,
      status: created.rows[0].status,
      createdAt: created.rows[0].created_at,
      detectedSubject: detection.detectedSubjectCode
        ? {
            code: detection.detectedSubjectCode,
            confidence: detection.confidence,
          }
        : null,
      subjectOptions,
    };
  }

  async confirmBookSubject(userId: string, bookId: string, input: ConfirmSubjectInput) {
    const subject = await query(
      `SELECT id, code, name
       FROM subjects
       WHERE code = $1
       LIMIT 1`,
      [input.subjectCode]
    );

    const subjectRow = subject.rows[0] as SubjectRow | undefined;
    if (!subjectRow) {
      throw new ApiError('Selected subject does not exist.', 404);
    }

    const updated = await query(
      `UPDATE study_books
       SET confirmed_subject_id = $1,
           status = 'confirmed',
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, file_name, status, confirmed_subject_id, updated_at`,
      [subjectRow.id, bookId, userId]
    );

    const row = updated.rows[0];
    if (!row) {
      throw new ApiError('Book not found for this user.', 404);
    }

    return {
      id: row.id,
      fileName: row.file_name,
      status: row.status,
      confirmedSubject: {
        id: subjectRow.id,
        code: subjectRow.code,
        name: subjectRow.name,
      },
      updatedAt: row.updated_at,
    };
  }

  async listBooks(userId: string) {
    const result = await query(
      `SELECT
         books.id,
         books.file_name,
         books.mime_type,
         books.file_size_bytes,
         books.status,
         books.detected_confidence,
         books.created_at,
         detected.code AS detected_subject_code,
         detected.name AS detected_subject_name,
         confirmed.code AS confirmed_subject_code,
         confirmed.name AS confirmed_subject_name
       FROM study_books AS books
       LEFT JOIN subjects AS detected ON detected.id = books.detected_subject_id
       LEFT JOIN subjects AS confirmed ON confirmed.id = books.confirmed_subject_id
       WHERE books.user_id = $1
       ORDER BY books.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      fileSizeBytes: row.file_size_bytes,
      status: row.status,
      createdAt: row.created_at,
      detectedSubject: row.detected_subject_code
        ? {
            code: row.detected_subject_code,
            name: row.detected_subject_name,
            confidence: Number(row.detected_confidence ?? 0),
          }
        : null,
      confirmedSubject: row.confirmed_subject_code
        ? {
            code: row.confirmed_subject_code,
            name: row.confirmed_subject_name,
          }
        : null,
    }));
  }

  async addHighlight(userId: string, bookId: string, input: HighlightInput) {
    const bookResult = await query(
      `SELECT
         books.id,
         books.file_name,
         books.confirmed_subject_id,
         books.detected_subject_id
       FROM study_books AS books
       WHERE books.id = $1 AND books.user_id = $2
       LIMIT 1`,
      [bookId, userId]
    );

    const bookRow = bookResult.rows[0] as
      | {
          id: string;
          file_name: string;
          confirmed_subject_id: string | null;
          detected_subject_id: string | null;
        }
      | undefined;

    if (!bookRow) {
      throw new ApiError('Book not found for this user.', 404);
    }

    const subjectId = bookRow.confirmed_subject_id ?? bookRow.detected_subject_id;
    if (!subjectId) {
      throw new ApiError(
        'Confirm a subject for this book before adding highlighted notes.',
        400
      );
    }

    const normalizedText = normalizeText(input.highlightText);
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const notebookInsert = await client.query(
        `INSERT INTO notebook_entries (
           user_id,
           subject_id,
           book_id,
           source_type,
           title,
           source_text,
           note_text,
           metadata
         )
         VALUES ($1, $2, $3, 'highlight_auto', $4, $5, $5, $6::jsonb)
         RETURNING id, note_text, created_at`,
        [
          userId,
          subjectId,
          bookRow.id,
          input.title ?? `Highlight from ${bookRow.file_name}`,
          normalizedText,
          JSON.stringify({
            pageNumber: input.pageNumber ?? null,
            autoCopied: true,
          }),
        ]
      );

      const notebookEntryId = notebookInsert.rows[0].id;

      const highlightInsert = await client.query(
        `INSERT INTO book_highlights (
           book_id,
           user_id,
           page_number,
           highlight_text,
           normalized_text,
           notebook_entry_id
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, page_number, highlight_text, created_at`,
        [
          bookRow.id,
          userId,
          input.pageNumber ?? null,
          input.highlightText,
          normalizedText,
          notebookEntryId,
        ]
      );

      await client.query('COMMIT');

      return {
        highlight: {
          id: highlightInsert.rows[0].id,
          pageNumber: highlightInsert.rows[0].page_number,
          text: highlightInsert.rows[0].highlight_text,
          createdAt: highlightInsert.rows[0].created_at,
        },
        notebookEntry: {
          id: notebookEntryId,
          noteText: notebookInsert.rows[0].note_text,
          createdAt: notebookInsert.rows[0].created_at,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createManualNote(userId: string, input: ManualNoteInput) {
    const subjectId = await this.resolveSubjectIdByCode(input.subjectCode);

    const insertResult = await query(
      `INSERT INTO notebook_entries (
         user_id,
         subject_id,
         source_type,
         title,
         source_text,
         note_text,
         metadata
       )
       VALUES ($1, $2, 'manual', $3, $4, $5, $6::jsonb)
       RETURNING id, created_at`,
      [
        userId,
        subjectId,
        input.title ?? null,
        input.sourceText ?? null,
        normalizeText(input.noteText),
        JSON.stringify({
          examYear: input.examYear ?? null,
          createdVia: 'manual_editor',
        }),
      ]
    );

    return {
      id: insertResult.rows[0].id,
      createdAt: insertResult.rows[0].created_at,
    };
  }

  async paraphraseAndSave(userId: string, input: ParaphraseInput) {
    const generated = createParaphrase(input.sourceText, input.style);
    let subjectId = await this.resolveSubjectIdByCode(input.subjectCode);
    let bookId: string | null = null;
    let sourceEntryId: string | null = null;

    if (input.sourceEntryId) {
      const sourceEntryResult = await query(
        `SELECT id, subject_id, book_id
         FROM notebook_entries
         WHERE id = $1 AND user_id = $2
         LIMIT 1`,
        [input.sourceEntryId, userId]
      );

      const sourceEntry = sourceEntryResult.rows[0] as
        | { id: string; subject_id: string | null; book_id: string | null }
        | undefined;

      if (!sourceEntry) {
        throw new ApiError('Source notebook entry not found for this user.', 404);
      }

      sourceEntryId = sourceEntry.id;
      if (!subjectId) {
        subjectId = sourceEntry.subject_id;
      }
      bookId = sourceEntry.book_id;
    }

    const insertResult = await query(
      `INSERT INTO notebook_entries (
         user_id,
         subject_id,
         book_id,
         source_type,
         title,
         source_text,
         note_text,
         paraphrased_from_entry_id,
         metadata
       )
       VALUES ($1, $2, $3, 'paraphrase', $4, $5, $6, $7, $8::jsonb)
       RETURNING id, created_at`,
      [
        userId,
        subjectId,
        bookId,
        `Paraphrased (${input.style})`,
        normalizeText(input.sourceText),
        generated,
        sourceEntryId,
        JSON.stringify({
          style: input.style,
        }),
      ]
    );

    return {
      id: insertResult.rows[0].id,
      noteText: generated,
      createdAt: insertResult.rows[0].created_at,
    };
  }

  async listNotebookEntries(userId: string, subjectCode?: string) {
    let subjectId: string | null = null;
    if (subjectCode) {
      subjectId = await this.resolveSubjectIdByCode(subjectCode);
      if (!subjectId) {
        throw new ApiError('Requested subject filter does not exist.', 404);
      }
    }

    const result = await query(
      `SELECT
         entries.id,
         entries.source_type::text AS source_type,
         entries.title,
         entries.source_text,
         entries.note_text,
         entries.created_at,
         subjects.code AS subject_code,
         subjects.name AS subject_name,
         books.file_name AS book_file_name
       FROM notebook_entries AS entries
       LEFT JOIN subjects ON subjects.id = entries.subject_id
       LEFT JOIN study_books AS books ON books.id = entries.book_id
       WHERE entries.user_id = $1
         AND ($2::uuid IS NULL OR entries.subject_id = $2::uuid)
       ORDER BY entries.created_at DESC
       LIMIT 300`,
      [userId, subjectId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      sourceType: row.source_type,
      title: row.title,
      sourceText: row.source_text,
      noteText: row.note_text,
      createdAt: row.created_at,
      subject: row.subject_code
        ? {
            code: row.subject_code,
            name: row.subject_name,
          }
        : null,
      sourceBook: row.book_file_name
        ? {
            fileName: row.book_file_name,
          }
        : null,
    }));
  }

  private async detectSubject(contentPreview: string): Promise<DetectionResult> {
    const subjectsResult = await query(
      `SELECT id, code, name
       FROM subjects
       ORDER BY code ASC`
    );
    const topicsResult = await query(
      `SELECT subject_id, name, slug
       FROM topics`
    );

    const subjects = subjectsResult.rows as SubjectRow[];
    const topics = topicsResult.rows as TopicRow[];

    const previewText = contentPreview.toLowerCase();
    const scoreRows: Array<{
      subjectId: string;
      subjectCode: string;
      score: number;
      keywordHits: Array<{ keyword: string; count: number }>;
    }> = [];

    for (const subject of subjects) {
      const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id);
      const keywords = new Set<string>();

      for (const token of subject.name.toLowerCase().split(/[^a-z0-9]+/)) {
        if (token.length >= 3) {
          keywords.add(token);
        }
      }

      for (const topic of subjectTopics) {
        for (const token of topic.name.toLowerCase().split(/[^a-z0-9]+/)) {
          if (token.length >= 3) {
            keywords.add(token);
          }
        }

        for (const token of topic.slug.toLowerCase().split(/[^a-z0-9]+/)) {
          if (token.length >= 3) {
            keywords.add(token);
          }
        }
      }

      for (const keyword of keywordFallbacks[subject.code] ?? []) {
        keywords.add(keyword.toLowerCase());
      }

      let score = 0;
      const keywordHits: Array<{ keyword: string; count: number }> = [];
      for (const keyword of keywords) {
        const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'g');
        const matches = previewText.match(pattern);
        const count = matches?.length ?? 0;
        if (count > 0) {
          score += count;
          keywordHits.push({ keyword, count });
        }
      }

      scoreRows.push({
        subjectId: subject.id,
        subjectCode: subject.code,
        score,
        keywordHits: keywordHits.sort((left, right) => right.count - left.count).slice(0, 7),
      });
    }

    const sortedScores = scoreRows.sort((left, right) => right.score - left.score);
    const top = sortedScores[0];
    const totalScore = sortedScores.reduce((sum, row) => sum + row.score, 0);

    if (!top || top.score <= 0 || totalScore <= 0) {
      return {
        detectedSubjectId: null,
        detectedSubjectCode: null,
        confidence: 0,
        metadata: {
          reason: 'No strong subject keywords found in preview.',
          topMatches: [],
          previewLength: previewText.length,
        },
      };
    }

    const confidence = Number(((top.score / totalScore) * 100).toFixed(2));

    return {
      detectedSubjectId: top.subjectId,
      detectedSubjectCode: top.subjectCode,
      confidence,
      metadata: {
        topSubjectCode: top.subjectCode,
        topScore: top.score,
        totalScore,
        topMatches: top.keywordHits,
        scoreBoard: sortedScores.map((row) => ({
          subjectCode: row.subjectCode,
          score: row.score,
        })),
        previewLength: previewText.length,
      },
    };
  }

  private async resolveSubjectIdByCode(subjectCode?: string): Promise<string | null> {
    if (!subjectCode) {
      return null;
    }

    const result = await query(
      `SELECT id
       FROM subjects
       WHERE code = $1
       LIMIT 1`,
      [subjectCode]
    );

    return result.rows[0]?.id ?? null;
  }
}
