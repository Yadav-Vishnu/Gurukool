import { getClient, query } from '../../config/database';
import { ApiError } from '../../middleware/error-handler';

type CatalogFilters = {
  type?: string;
  subjectCode?: string;
  topicSlug?: string;
  examCode?: string;
  companyName?: string;
  paperCode?: string;
  examYear?: number;
  adaptiveOnly?: boolean;
};

type AdaptiveStartInput = {
  type?: 'topic' | 'subject' | 'full_length';
  subjectCode?: string;
  topicSlug?: string;
  examCode?: string;
  companyName?: string;
  paperCode?: string;
  examYear?: number;
  questionCount?: number;
  durationMinutes?: number;
};

type AnswerUpdateInput = {
  selectedOption?: string | null;
  markedForReview?: boolean;
  visited?: boolean;
  note?: string | null;
  wrongTag?: string | null;
  timeSpentSeconds?: number;
  currentQuestionIndex?: number;
};

type AttemptRow = {
  id: string;
  user_id: string;
  test_id: string;
  status: 'in_progress' | 'submitted';
  started_at: Date;
  submitted_at: Date | null;
  duration_minutes: number;
  current_question_index: number;
  score: string | number;
  total_questions: number;
  title: string;
  description: string | null;
  instructions: string[] | unknown;
  test_type: 'topic' | 'subject' | 'full_length';
  total_marks: string | number;
  subject_name: string | null;
  topic_name: string | null;
  subject_code: string | null;
  topic_slug: string | null;
  exam_code: string | null;
  company_name: string | null;
  paper_code: string | null;
  exam_year: number | null;
  is_adaptive: boolean;
};

type QuestionRow = {
  id: string;
  position: number;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  marks: string | number;
  negative_marks: string | number;
  estimated_seconds: number;
  selected_option: string | null;
  marked_for_review: boolean;
  visited: boolean;
  note: string | null;
  wrong_tag: string | null;
  time_spent_seconds: number;
  subject_name: string;
  topic_name: string | null;
  is_correct?: boolean | null;
  correct_option?: string;
  explanation?: string | null;
  exam_code?: string | null;
  company_name?: string | null;
  paper_code?: string | null;
  exam_year?: number | null;
  is_pyq?: boolean;
};

type AdaptiveCandidateRow = {
  id: string;
  topic_id: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: string | number;
};

type DifficultyProfile = 'recovery' | 'balanced' | 'challenge';
type ExamCode = 'GATE' | 'PSU' | 'ESE';

const toNumber = (value: unknown): number => Number(value ?? 0);

const toInstructions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
};

const normalizeExamCode = (value?: string | null): ExamCode | undefined => {
  if (!value) {
    return undefined;
  }

  const upperValue = value.trim().toUpperCase();
  if (upperValue === 'GATE' || upperValue === 'PSU' || upperValue === 'ESE') {
    return upperValue;
  }

  return undefined;
};

const toExamCode = (value?: string | null): ExamCode => normalizeExamCode(value) ?? 'GATE';

const getPaletteStatus = (question: {
  selected_option: string | null;
  marked_for_review: boolean;
  visited: boolean;
}): string => {
  if (question.selected_option && question.marked_for_review) {
    return 'answered-review';
  }

  if (question.selected_option) {
    return 'answered';
  }

  if (question.marked_for_review) {
    return 'review';
  }

  return question.visited ? 'visited' : 'not-visited';
};

const getAccuracy = (correctCount: number, attemptedCount: number): number => {
  if (attemptedCount <= 0) {
    return 0;
  }

  return Number(((correctCount / attemptedCount) * 100).toFixed(2));
};

export class TestEngineService {
  async getCatalog(filters: CatalogFilters) {
    const examCode = normalizeExamCode(filters.examCode);
    const result = await query(
      `SELECT
         tests.id,
         tests.slug,
         tests.title,
         tests.description,
         tests.instructions,
         tests.test_type,
         tests.duration_minutes,
         tests.total_marks,
         tests.total_questions,
         subjects.code AS subject_code,
         subjects.name AS subject_name,
         topics.slug AS topic_slug,
         topics.name AS topic_name,
         tests.exam_code::text AS exam_code,
         tests.company_name,
         tests.paper_code,
         tests.exam_year,
         tests.is_adaptive
       FROM tests
       LEFT JOIN subjects ON subjects.id = tests.subject_id
       LEFT JOIN topics ON topics.id = tests.topic_id
       WHERE tests.is_published = TRUE
         AND ($1::text IS NULL OR tests.test_type::text = $1::text)
         AND ($2::text IS NULL OR subjects.code = $2::text)
         AND ($3::text IS NULL OR topics.slug = $3::text)
         AND ($4::text IS NULL OR tests.exam_code::text = $4::text)
         AND ($5::text IS NULL OR tests.company_name ILIKE '%' || $5::text || '%')
         AND ($6::text IS NULL OR tests.paper_code ILIKE '%' || $6::text || '%')
         AND ($7::int IS NULL OR tests.exam_year = $7::int)
         AND ($8::boolean = FALSE OR tests.is_adaptive = TRUE)
       ORDER BY
         tests.is_adaptive DESC,
         CASE tests.test_type
           WHEN 'full_length' THEN 1
           WHEN 'subject' THEN 2
           ELSE 3
         END,
         tests.title ASC`,
      [
        filters.type ?? null,
        filters.subjectCode ?? null,
        filters.topicSlug ?? null,
        examCode ?? null,
        filters.companyName ?? null,
        filters.paperCode ?? null,
        filters.examYear ?? null,
        Boolean(filters.adaptiveOnly),
      ]
    );

    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      instructions: toInstructions(row.instructions),
      testType: row.test_type,
      durationMinutes: row.duration_minutes,
      totalMarks: toNumber(row.total_marks),
      totalQuestions: row.total_questions,
      subjectCode: row.subject_code,
      subjectName: row.subject_name,
      topicSlug: row.topic_slug,
      topicName: row.topic_name,
      examCode: normalizeExamCode(row.exam_code) ?? null,
      companyName: row.company_name,
      paperCode: row.paper_code,
      examYear: row.exam_year,
      isAdaptive: row.is_adaptive,
    }));
  }

  async startAdaptiveAttempt(userId: string, input: AdaptiveStartInput) {
    const examCode = normalizeExamCode(input.examCode);
    const questionCount = input.questionCount ?? 12;
    const type = input.type ?? 'full_length';

    const { subjectId, topicId } = await this.resolveSubjectAndTopic(
      input.subjectCode,
      input.topicSlug
    );

    const candidateResult = await query(
      `SELECT DISTINCT
         questions.id,
         questions.topic_id,
         questions.difficulty,
         questions.marks
       FROM questions
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       WHERE ($1::text IS NULL OR subjects.code = $1::text)
         AND ($2::text IS NULL OR topics.slug = $2::text)
         AND ($3::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.exam_code::text = $3::text
         ))
         AND ($4::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.company_name ILIKE '%' || $4::text || '%'
         ))
         AND ($5::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.paper_code ILIKE '%' || $5::text || '%'
         ))
         AND ($6::int IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.exam_year = $6::int
         ))`,
      [
        input.subjectCode ?? null,
        input.topicSlug ?? null,
        examCode ?? null,
        input.companyName ?? null,
        input.paperCode ?? null,
        input.examYear ?? null,
      ]
    );

    const candidates = candidateResult.rows as AdaptiveCandidateRow[];
    if (candidates.length < 5) {
      throw new ApiError(
        'Not enough tagged questions were found for this adaptive filter. Try broader filters.',
        404
      );
    }

    const weakTopicIds = await this.getWeakTopicIds(userId, {
      subjectCode: input.subjectCode,
      topicSlug: input.topicSlug,
      examCode,
      companyName: input.companyName,
      paperCode: input.paperCode,
      examYear: input.examYear,
    });
    const userAccuracy = await this.getUserAccuracy(userId, {
      subjectCode: input.subjectCode,
      topicSlug: input.topicSlug,
      examCode,
      companyName: input.companyName,
      paperCode: input.paperCode,
      examYear: input.examYear,
    });
    const difficultyProfile = this.determineDifficultyProfile(userAccuracy);

    const rankedCandidates = this.rankAdaptiveCandidates(
      candidates,
      weakTopicIds,
      difficultyProfile
    );
    const selectedCandidates = rankedCandidates.slice(
      0,
      Math.min(questionCount, rankedCandidates.length)
    );
    const durationMinutes =
      input.durationMinutes ?? Math.max(15, Math.ceil(selectedCandidates.length * 1.8));

    const totalMarks = Number(
      selectedCandidates
        .reduce((sum, candidate) => sum + toNumber(candidate.marks), 0)
        .toFixed(2)
    );

    const timestamp = Date.now();
    const slug = `adaptive-${userId.slice(0, 8)}-${timestamp}`;
    const adaptiveExamCode = examCode ?? 'GATE';
    const titleParts = ['Adaptive Mock', adaptiveExamCode];
    if (input.companyName) {
      titleParts.push(input.companyName.toUpperCase());
    }
    if (input.paperCode) {
      titleParts.push(input.paperCode);
    }

    const descriptionParts = [
      'Generated from your previous performance to prioritize weak areas.',
      input.examYear ? `Target exam year: ${input.examYear}.` : null,
    ].filter((part): part is string => Boolean(part));

    const instructions = [
      'Questions are prioritized from your weak areas and selected by adaptive difficulty.',
      'Use wrong-answer tags and notes to improve future adaptive picks.',
      'Submit this mock to refresh your exam-wise analytics.',
    ];

    const metadata = {
      mode: 'adaptive',
      generatedAt: new Date(timestamp).toISOString(),
      filters: {
        subjectCode: input.subjectCode ?? null,
        topicSlug: input.topicSlug ?? null,
        examCode: adaptiveExamCode,
        companyName: input.companyName ?? null,
        paperCode: input.paperCode ?? null,
        examYear: input.examYear ?? null,
      },
      strategy: {
        difficultyProfile,
        weakTopicCount: weakTopicIds.size,
      },
    };

    const client = await getClient();
    let testId = '';

    try {
      await client.query('BEGIN');

      const insertedTest = await client.query(
        `INSERT INTO tests (
           slug,
           title,
           description,
           instructions,
           test_type,
           subject_id,
           topic_id,
           duration_minutes,
           total_marks,
           total_questions,
           is_published,
           exam_code,
           company_name,
           paper_code,
           exam_year,
           is_adaptive,
           metadata
         )
         VALUES (
           $1, $2, $3, $4::jsonb, $5::test_type, $6, $7, $8, $9, $10, TRUE,
           $11::exam_code, $12, $13, $14, TRUE, $15::jsonb
         )
         RETURNING id`,
        [
          slug,
          titleParts.join(' - '),
          descriptionParts.join(' '),
          JSON.stringify(instructions),
          type,
          subjectId,
          topicId,
          durationMinutes,
          totalMarks,
          selectedCandidates.length,
          adaptiveExamCode,
          input.companyName ?? null,
          input.paperCode ?? null,
          input.examYear ?? null,
          JSON.stringify(metadata),
        ]
      );

      testId = insertedTest.rows[0].id;

      let position = 1;
      for (const candidate of selectedCandidates) {
        await client.query(
          `INSERT INTO test_questions (test_id, question_id, position)
           VALUES ($1, $2, $3)`,
          [testId, candidate.id, position]
        );
        position += 1;
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const started = await this.startAttempt(userId, testId);

    await query(
      `UPDATE test_attempts
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
       WHERE id = $1`,
      [
        started.detail.attempt.id,
        JSON.stringify({
          adaptive: {
            difficultyProfile,
            weakTopicCount: weakTopicIds.size,
            selectedQuestionCount: selectedCandidates.length,
          },
        }),
      ]
    );

    return {
      ...started,
      adaptiveProfile: {
        difficultyProfile,
        weakTopicCount: weakTopicIds.size,
        selectedQuestionCount: selectedCandidates.length,
      },
    };
  }

  async startAttempt(userId: string, testId: string) {
    const existingAttempt = await query(
      `SELECT id
       FROM test_attempts
       WHERE user_id = $1 AND test_id = $2 AND status = 'in_progress'
       ORDER BY started_at DESC
       LIMIT 1`,
      [userId, testId]
    );

    if (existingAttempt.rows[0]?.id) {
      const detail = await this.getAttemptDetail(userId, existingAttempt.rows[0].id);
      return { resumed: true, detail };
    }

    const testResult = await query(
      `SELECT id, duration_minutes, total_questions
       FROM tests
       WHERE id = $1 AND is_published = TRUE`,
      [testId]
    );

    const test = testResult.rows[0];
    if (!test) {
      throw new ApiError('Requested test was not found.', 404);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      const attemptInsert = await client.query(
        `INSERT INTO test_attempts (
           user_id,
           test_id,
           duration_minutes,
           total_questions,
           unanswered_count
         )
         VALUES ($1, $2, $3, $4, $4)
         RETURNING id`,
        [userId, testId, test.duration_minutes, test.total_questions]
      );

      const attemptId = attemptInsert.rows[0].id;

      await client.query(
        `INSERT INTO test_attempt_answers (attempt_id, question_id, question_order)
         SELECT $1, question_id, position
         FROM test_questions
         WHERE test_id = $2
         ORDER BY position`,
        [attemptId, testId]
      );

      await client.query('COMMIT');

      const detail = await this.getAttemptDetail(userId, attemptId);
      return { resumed: false, detail };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAttemptDetail(userId: string, attemptId: string) {
    const attempt = await this.getAttemptRecord(userId, attemptId);

    const questionResult = await query(
      `SELECT
         answers.question_id AS id,
         answers.question_order AS position,
         questions.prompt,
         questions.options,
         questions.marks,
         questions.negative_marks,
         questions.estimated_seconds,
         answers.selected_option,
         answers.marked_for_review,
         answers.visited,
         answers.note,
         answers.wrong_tag,
         answers.time_spent_seconds,
         subjects.name AS subject_name,
         topics.name AS topic_name,
         COALESCE(source_tag.exam_code::text, tests.exam_code::text, 'GATE') AS exam_code,
         COALESCE(source_tag.company_name, tests.company_name) AS company_name,
         COALESCE(source_tag.paper_code, tests.paper_code) AS paper_code,
         COALESCE(source_tag.exam_year, tests.exam_year) AS exam_year,
         COALESCE(source_tag.is_pyq, TRUE) AS is_pyq
       FROM test_attempt_answers AS answers
       INNER JOIN test_attempts ON test_attempts.id = answers.attempt_id
       INNER JOIN tests ON tests.id = test_attempts.test_id
       INNER JOIN questions ON questions.id = answers.question_id
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       LEFT JOIN LATERAL (
         SELECT
           tags.exam_code,
           tags.company_name,
           tags.paper_code,
           tags.exam_year,
           tags.is_pyq
         FROM question_exam_tags AS tags
         WHERE tags.question_id = questions.id
         ORDER BY
           CASE WHEN tests.exam_code IS NOT NULL AND tags.exam_code = tests.exam_code THEN 0 ELSE 1 END,
           CASE WHEN tests.company_name IS NOT NULL AND tags.company_name = tests.company_name THEN 0 ELSE 1 END,
           CASE WHEN tests.paper_code IS NOT NULL AND tags.paper_code = tests.paper_code THEN 0 ELSE 1 END,
           CASE WHEN tests.exam_year IS NOT NULL AND tags.exam_year = tests.exam_year THEN 0 ELSE 1 END,
           tags.exam_year DESC NULLS LAST
         LIMIT 1
       ) AS source_tag ON TRUE
       WHERE answers.attempt_id = $1
       ORDER BY answers.question_order`,
      [attemptId]
    );

    const questions = questionResult.rows.map((row: QuestionRow) => ({
      id: row.id,
      position: row.position,
      prompt: row.prompt,
      options: row.options,
      marks: toNumber(row.marks),
      negativeMarks: toNumber(row.negative_marks),
      estimatedSeconds: row.estimated_seconds,
      subjectName: row.subject_name,
      topicName: row.topic_name,
      sourceTag: {
        examCode: toExamCode(row.exam_code),
        companyName: row.company_name ?? null,
        paperCode: row.paper_code ?? null,
        examYear: row.exam_year ?? null,
        isPyq: Boolean(row.is_pyq),
      },
      response: {
        selectedOption: row.selected_option,
        markedForReview: row.marked_for_review,
        visited: row.visited,
        note: row.note,
        wrongTag: row.wrong_tag,
        timeSpentSeconds: row.time_spent_seconds,
      },
      paletteStatus: getPaletteStatus(row),
    }));

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000)
    );
    const remainingSeconds = Math.max(0, attempt.duration_minutes * 60 - elapsedSeconds);

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        durationMinutes: attempt.duration_minutes,
        currentQuestionIndex: attempt.current_question_index,
        totalQuestions: attempt.total_questions,
        remainingSeconds,
      },
      test: {
        id: attempt.test_id,
        title: attempt.title,
        description: attempt.description,
        testType: attempt.test_type,
        instructions: toInstructions(attempt.instructions),
        totalMarks: toNumber(attempt.total_marks),
        totalQuestions: attempt.total_questions,
        subjectName: attempt.subject_name,
        topicName: attempt.topic_name,
        subjectCode: attempt.subject_code,
        topicSlug: attempt.topic_slug,
        examCode: toExamCode(attempt.exam_code),
        companyName: attempt.company_name,
        paperCode: attempt.paper_code,
        examYear: attempt.exam_year,
        isAdaptive: attempt.is_adaptive,
      },
      questions,
    };
  }

  async updateAttemptAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    input: AnswerUpdateInput
  ) {
    const attempt = await this.getAttemptRecord(userId, attemptId);
    if (attempt.status === 'submitted') {
      throw new ApiError('This attempt has already been submitted.', 400);
    }

    const fields: string[] = [];
    const values: Array<string | number | boolean | null> = [];
    let index = 1;

    const shouldMarkVisited = input.visited ?? true;
    fields.push(`visited = $${index++}`);
    values.push(shouldMarkVisited);

    if (input.selectedOption !== undefined) {
      fields.push(`selected_option = $${index++}`);
      values.push(input.selectedOption);
      fields.push(input.selectedOption ? 'answered_at = NOW()' : 'answered_at = NULL');
    }

    if (input.markedForReview !== undefined) {
      fields.push(`marked_for_review = $${index++}`);
      values.push(input.markedForReview);
    }

    if (input.note !== undefined) {
      fields.push(`note = $${index++}`);
      values.push(input.note);
    }

    if (input.wrongTag !== undefined) {
      fields.push(`wrong_tag = $${index++}`);
      values.push(input.wrongTag);
    }

    if (input.timeSpentSeconds !== undefined) {
      fields.push(`time_spent_seconds = $${index++}`);
      values.push(input.timeSpentSeconds);
    }

    fields.push('updated_at = NOW()');

    values.push(attemptId, questionId);

    const updateResult = await query(
      `UPDATE test_attempt_answers
       SET ${fields.join(', ')}
       WHERE attempt_id = $${index++} AND question_id = $${index++}
       RETURNING question_id, question_order, selected_option, marked_for_review, visited, note, wrong_tag, time_spent_seconds`,
      values
    );

    const updatedRow = updateResult.rows[0];
    if (!updatedRow) {
      throw new ApiError('Question response could not be found for this attempt.', 404);
    }

    if (input.currentQuestionIndex !== undefined) {
      await query(
        `UPDATE test_attempts
         SET current_question_index = $1
         WHERE id = $2`,
        [input.currentQuestionIndex, attemptId]
      );
    }

    return {
      questionId: updatedRow.question_id,
      questionOrder: updatedRow.question_order,
      selectedOption: updatedRow.selected_option,
      markedForReview: updatedRow.marked_for_review,
      visited: updatedRow.visited,
      note: updatedRow.note,
      wrongTag: updatedRow.wrong_tag,
      timeSpentSeconds: updatedRow.time_spent_seconds,
      paletteStatus: getPaletteStatus(updatedRow),
    };
  }

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.getAttemptRecord(userId, attemptId);
    if (attempt.status === 'submitted') {
      return this.getAttemptAnalytics(userId, attemptId);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE test_attempt_answers AS answers
         SET is_correct = CASE
             WHEN answers.selected_option IS NULL THEN NULL
             WHEN answers.selected_option = questions.correct_option THEN TRUE
             ELSE FALSE
           END,
           updated_at = NOW()
         FROM questions
         WHERE answers.question_id = questions.id
           AND answers.attempt_id = $1`,
        [attemptId]
      );

      const joinedResult = await client.query(
        `SELECT
           answers.selected_option,
           answers.time_spent_seconds,
           questions.correct_option,
           questions.marks,
           questions.negative_marks
         FROM test_attempt_answers AS answers
         INNER JOIN questions ON questions.id = answers.question_id
         WHERE answers.attempt_id = $1`,
        [attemptId]
      );

      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;
      let totalTimeSpentSeconds = 0;

      for (const row of joinedResult.rows) {
        const marks = toNumber(row.marks);
        const negativeMarks = toNumber(row.negative_marks);
        totalTimeSpentSeconds += row.time_spent_seconds ?? 0;

        if (!row.selected_option) {
          unansweredCount += 1;
          continue;
        }

        if (row.selected_option === row.correct_option) {
          correctCount += 1;
          score += marks;
        } else {
          incorrectCount += 1;
          score -= negativeMarks;
        }
      }

      await client.query(
        `UPDATE test_attempts
         SET status = 'submitted',
             submitted_at = NOW(),
             score = $1,
             correct_count = $2,
             incorrect_count = $3,
             unanswered_count = $4,
             total_time_spent_seconds = $5
         WHERE id = $6`,
        [
          Number(score.toFixed(2)),
          correctCount,
          incorrectCount,
          unansweredCount,
          totalTimeSpentSeconds,
          attemptId,
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.getAttemptAnalytics(userId, attemptId);
  }

  async getAttemptAnalytics(userId: string, attemptId: string) {
    const attempt = await this.getAttemptRecord(userId, attemptId);

    const analyticsResult = await query(
      `SELECT
         answers.question_id AS id,
         answers.question_order AS position,
         questions.prompt,
         questions.options,
         questions.correct_option,
         questions.explanation,
         questions.marks,
         questions.negative_marks,
         answers.selected_option,
         answers.note,
         answers.wrong_tag,
         answers.time_spent_seconds,
         answers.is_correct,
         subjects.name AS subject_name,
         topics.name AS topic_name,
         COALESCE(source_tag.exam_code::text, tests.exam_code::text, 'GATE') AS exam_code,
         COALESCE(source_tag.company_name, tests.company_name) AS company_name,
         COALESCE(source_tag.paper_code, tests.paper_code) AS paper_code,
         COALESCE(source_tag.exam_year, tests.exam_year) AS exam_year,
         COALESCE(source_tag.is_pyq, TRUE) AS is_pyq
       FROM test_attempt_answers AS answers
       INNER JOIN test_attempts ON test_attempts.id = answers.attempt_id
       INNER JOIN tests ON tests.id = test_attempts.test_id
       INNER JOIN questions ON questions.id = answers.question_id
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       LEFT JOIN LATERAL (
         SELECT
           tags.exam_code,
           tags.company_name,
           tags.paper_code,
           tags.exam_year,
           tags.is_pyq
         FROM question_exam_tags AS tags
         WHERE tags.question_id = questions.id
         ORDER BY
           CASE WHEN tests.exam_code IS NOT NULL AND tags.exam_code = tests.exam_code THEN 0 ELSE 1 END,
           CASE WHEN tests.company_name IS NOT NULL AND tags.company_name = tests.company_name THEN 0 ELSE 1 END,
           CASE WHEN tests.paper_code IS NOT NULL AND tags.paper_code = tests.paper_code THEN 0 ELSE 1 END,
           CASE WHEN tests.exam_year IS NOT NULL AND tags.exam_year = tests.exam_year THEN 0 ELSE 1 END,
           tags.exam_year DESC NULLS LAST
         LIMIT 1
       ) AS source_tag ON TRUE
       WHERE answers.attempt_id = $1
       ORDER BY answers.question_order`,
      [attemptId]
    );

    const rows = analyticsResult.rows as QuestionRow[];
    const totalQuestions = rows.length;
    const correctCount = rows.filter((row) => row.is_correct === true).length;
    const incorrectCount = rows.filter(
      (row) => row.selected_option && row.is_correct === false
    ).length;
    const unansweredCount = rows.filter((row) => !row.selected_option).length;
    const totalMarks = toNumber(attempt.total_marks);
    const score = toNumber(attempt.score);
    const totalTimeSpentSeconds = rows.reduce(
      (sum, row) => sum + (row.time_spent_seconds ?? 0),
      0
    );

    const topicBuckets = new Map<
      string,
      {
        subjectName: string;
        topicName: string;
        attempted: number;
        correct: number;
        incorrect: number;
        timeSpentSeconds: number;
      }
    >();

    const examBuckets = new Map<
      string,
      {
        examCode: ExamCode;
        attempted: number;
        correctCount: number;
        incorrectCount: number;
        timeSpentSeconds: number;
      }
    >();

    const companyBuckets = new Map<
      string,
      {
        examCode: ExamCode;
        companyName: string;
        attempted: number;
        correctCount: number;
        incorrectCount: number;
        timeSpentSeconds: number;
      }
    >();

    const paperBuckets = new Map<
      string,
      {
        examCode: ExamCode;
        companyName: string;
        paperCode: string;
        examYear: number | null;
        attempted: number;
        correctCount: number;
        incorrectCount: number;
        timeSpentSeconds: number;
      }
    >();

    for (const row of rows) {
      const attempted = row.selected_option ? 1 : 0;
      const correct = row.is_correct === true ? 1 : 0;
      const incorrect = row.selected_option && row.is_correct === false ? 1 : 0;
      const timeSpentSeconds = row.time_spent_seconds ?? 0;

      const topicKey = `${row.subject_name}::${row.topic_name ?? 'Core Concepts'}`;
      const topicCurrent = topicBuckets.get(topicKey) ?? {
        subjectName: row.subject_name,
        topicName: row.topic_name ?? 'Core Concepts',
        attempted: 0,
        correct: 0,
        incorrect: 0,
        timeSpentSeconds: 0,
      };

      topicCurrent.attempted += attempted;
      topicCurrent.correct += correct;
      topicCurrent.incorrect += incorrect;
      topicCurrent.timeSpentSeconds += timeSpentSeconds;
      topicBuckets.set(topicKey, topicCurrent);

      const examCode = toExamCode(row.exam_code);
      const companyName = row.company_name ?? 'General';
      const paperCode = row.paper_code ?? 'General';
      const examYear = row.exam_year ?? null;

      const examKey = examCode;
      const examCurrent = examBuckets.get(examKey) ?? {
        examCode,
        attempted: 0,
        correctCount: 0,
        incorrectCount: 0,
        timeSpentSeconds: 0,
      };
      examCurrent.attempted += attempted;
      examCurrent.correctCount += correct;
      examCurrent.incorrectCount += incorrect;
      examCurrent.timeSpentSeconds += timeSpentSeconds;
      examBuckets.set(examKey, examCurrent);

      const companyKey = `${examCode}::${companyName}`;
      const companyCurrent = companyBuckets.get(companyKey) ?? {
        examCode,
        companyName,
        attempted: 0,
        correctCount: 0,
        incorrectCount: 0,
        timeSpentSeconds: 0,
      };
      companyCurrent.attempted += attempted;
      companyCurrent.correctCount += correct;
      companyCurrent.incorrectCount += incorrect;
      companyCurrent.timeSpentSeconds += timeSpentSeconds;
      companyBuckets.set(companyKey, companyCurrent);

      const paperKey = `${examCode}::${companyName}::${paperCode}::${examYear ?? 'NA'}`;
      const paperCurrent = paperBuckets.get(paperKey) ?? {
        examCode,
        companyName,
        paperCode,
        examYear,
        attempted: 0,
        correctCount: 0,
        incorrectCount: 0,
        timeSpentSeconds: 0,
      };
      paperCurrent.attempted += attempted;
      paperCurrent.correctCount += correct;
      paperCurrent.incorrectCount += incorrect;
      paperCurrent.timeSpentSeconds += timeSpentSeconds;
      paperBuckets.set(paperKey, paperCurrent);
    }

    const weakAreas = Array.from(topicBuckets.values())
      .map((bucket) => ({
        subjectName: bucket.subjectName,
        topicName: bucket.topicName,
        attempted: bucket.attempted,
        incorrectCount: bucket.incorrect,
        accuracy: getAccuracy(bucket.correct, bucket.attempted),
        averageTimeSeconds:
          bucket.attempted > 0
            ? Math.round(bucket.timeSpentSeconds / bucket.attempted)
            : 0,
      }))
      .sort((left, right) => {
        if (left.accuracy !== right.accuracy) {
          return left.accuracy - right.accuracy;
        }

        return right.averageTimeSeconds - left.averageTimeSeconds;
      });

    const examWisePerformance = Array.from(examBuckets.values())
      .map((bucket) => ({
        examCode: bucket.examCode,
        attempted: bucket.attempted,
        correctCount: bucket.correctCount,
        incorrectCount: bucket.incorrectCount,
        accuracy: getAccuracy(bucket.correctCount, bucket.attempted),
        averageTimeSeconds:
          bucket.attempted > 0
            ? Math.round(bucket.timeSpentSeconds / bucket.attempted)
            : 0,
      }))
      .sort((left, right) => {
        if (left.accuracy !== right.accuracy) {
          return left.accuracy - right.accuracy;
        }

        return right.attempted - left.attempted;
      });

    const companyWisePerformance = Array.from(companyBuckets.values())
      .map((bucket) => ({
        examCode: bucket.examCode,
        companyName: bucket.companyName,
        attempted: bucket.attempted,
        correctCount: bucket.correctCount,
        incorrectCount: bucket.incorrectCount,
        accuracy: getAccuracy(bucket.correctCount, bucket.attempted),
        averageTimeSeconds:
          bucket.attempted > 0
            ? Math.round(bucket.timeSpentSeconds / bucket.attempted)
            : 0,
      }))
      .sort((left, right) => {
        if (left.incorrectCount !== right.incorrectCount) {
          return right.incorrectCount - left.incorrectCount;
        }

        return left.accuracy - right.accuracy;
      });

    const paperWisePerformance = Array.from(paperBuckets.values())
      .map((bucket) => ({
        examCode: bucket.examCode,
        companyName: bucket.companyName,
        paperCode: bucket.paperCode,
        examYear: bucket.examYear,
        attempted: bucket.attempted,
        correctCount: bucket.correctCount,
        incorrectCount: bucket.incorrectCount,
        accuracy: getAccuracy(bucket.correctCount, bucket.attempted),
        averageTimeSeconds:
          bucket.attempted > 0
            ? Math.round(bucket.timeSpentSeconds / bucket.attempted)
            : 0,
      }))
      .sort((left, right) => {
        if (left.incorrectCount !== right.incorrectCount) {
          return right.incorrectCount - left.incorrectCount;
        }

        return (right.examYear ?? 0) - (left.examYear ?? 0);
      });

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
      },
      test: {
        id: attempt.test_id,
        title: attempt.title,
        description: attempt.description,
        testType: attempt.test_type,
        totalMarks,
        totalQuestions,
        durationMinutes: attempt.duration_minutes,
        examCode: toExamCode(attempt.exam_code),
        companyName: attempt.company_name,
        paperCode: attempt.paper_code,
        examYear: attempt.exam_year,
        isAdaptive: attempt.is_adaptive,
      },
      summary: {
        score,
        totalMarks,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracy:
          totalQuestions > 0
            ? Number(((correctCount / totalQuestions) * 100).toFixed(2))
            : 0,
        averageTimePerQuestion:
          totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 0,
        completionRate:
          totalQuestions > 0
            ? Number(
                (((totalQuestions - unansweredCount) / totalQuestions) * 100).toFixed(2)
              )
            : 0,
      },
      weakAreas,
      examWisePerformance,
      companyWisePerformance,
      paperWisePerformance,
      questionReview: rows.map((row) => ({
        id: row.id,
        position: row.position,
        prompt: row.prompt,
        options: row.options,
        selectedOption: row.selected_option,
        correctOption: row.correct_option,
        explanation: row.explanation,
        marks: toNumber(row.marks),
        negativeMarks: toNumber(row.negative_marks),
        isCorrect: row.is_correct,
        timeSpentSeconds: row.time_spent_seconds,
        subjectName: row.subject_name,
        topicName: row.topic_name ?? 'Core Concepts',
        note: row.note,
        wrongTag: row.wrong_tag,
        examCode: toExamCode(row.exam_code),
        companyName: row.company_name ?? null,
        paperCode: row.paper_code ?? null,
        examYear: row.exam_year ?? null,
        isPyq: Boolean(row.is_pyq),
      })),
    };
  }

  private async getAttemptRecord(userId: string, attemptId: string): Promise<AttemptRow> {
    const result = await query(
      `SELECT
         attempts.*,
         tests.title,
         tests.description,
         tests.instructions,
         tests.test_type,
         tests.total_marks,
         tests.exam_code::text AS exam_code,
         tests.company_name,
         tests.paper_code,
         tests.exam_year,
         tests.is_adaptive,
         subjects.name AS subject_name,
         subjects.code AS subject_code,
         topics.name AS topic_name,
         topics.slug AS topic_slug
       FROM test_attempts AS attempts
       INNER JOIN tests ON tests.id = attempts.test_id
       LEFT JOIN subjects ON subjects.id = tests.subject_id
       LEFT JOIN topics ON topics.id = tests.topic_id
       WHERE attempts.id = $1 AND attempts.user_id = $2`,
      [attemptId, userId]
    );

    const attempt = result.rows[0] as AttemptRow | undefined;
    if (!attempt) {
      throw new ApiError('Test attempt not found for this user.', 404);
    }

    return attempt;
  }

  private async resolveSubjectAndTopic(
    subjectCode?: string,
    topicSlug?: string
  ): Promise<{ subjectId: string | null; topicId: string | null }> {
    if (!subjectCode) {
      if (topicSlug) {
        throw new ApiError(
          'A topic filter requires a subject code for adaptive mock generation.',
          400
        );
      }

      return { subjectId: null, topicId: null };
    }

    const subjectResult = await query(
      `SELECT id
       FROM subjects
       WHERE code = $1
       LIMIT 1`,
      [subjectCode]
    );

    const subjectId = subjectResult.rows[0]?.id;
    if (!subjectId) {
      throw new ApiError('Requested subject code is not available.', 404);
    }

    if (!topicSlug) {
      return { subjectId, topicId: null };
    }

    const topicResult = await query(
      `SELECT id
       FROM topics
       WHERE subject_id = $1 AND slug = $2
       LIMIT 1`,
      [subjectId, topicSlug]
    );

    const topicId = topicResult.rows[0]?.id;
    if (!topicId) {
      throw new ApiError(
        'Requested topic was not found under the selected subject.',
        404
      );
    }

    return { subjectId, topicId };
  }

  private async getWeakTopicIds(
    userId: string,
    filters: {
      subjectCode?: string;
      topicSlug?: string;
      examCode?: ExamCode;
      companyName?: string;
      paperCode?: string;
      examYear?: number;
    }
  ): Promise<Set<string>> {
    const result = await query(
      `SELECT
         questions.topic_id,
         COUNT(*) FILTER (WHERE answers.selected_option IS NOT NULL) AS attempted_count,
         COUNT(*) FILTER (WHERE answers.is_correct = FALSE) AS incorrect_count
       FROM test_attempt_answers AS answers
       INNER JOIN test_attempts AS attempts ON attempts.id = answers.attempt_id
       INNER JOIN questions ON questions.id = answers.question_id
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       WHERE attempts.user_id = $1
         AND attempts.status = 'submitted'
         AND answers.selected_option IS NOT NULL
         AND ($2::text IS NULL OR subjects.code = $2::text)
         AND ($3::text IS NULL OR topics.slug = $3::text)
         AND ($4::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.exam_code::text = $4::text
         ))
         AND ($5::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.company_name ILIKE '%' || $5::text || '%'
         ))
         AND ($6::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.paper_code ILIKE '%' || $6::text || '%'
         ))
         AND ($7::int IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.exam_year = $7::int
         ))
       GROUP BY questions.topic_id
       HAVING questions.topic_id IS NOT NULL
       ORDER BY
         (COUNT(*) FILTER (WHERE answers.is_correct = FALSE)::float
          / NULLIF(COUNT(*) FILTER (WHERE answers.selected_option IS NOT NULL), 0)) DESC,
         COUNT(*) FILTER (WHERE answers.is_correct = FALSE) DESC
       LIMIT 6`,
      [
        userId,
        filters.subjectCode ?? null,
        filters.topicSlug ?? null,
        filters.examCode ?? null,
        filters.companyName ?? null,
        filters.paperCode ?? null,
        filters.examYear ?? null,
      ]
    );

    return new Set(
      result.rows
        .map((row) => row.topic_id as string | null)
        .filter((topicId): topicId is string => Boolean(topicId))
    );
  }

  private async getUserAccuracy(
    userId: string,
    filters: {
      subjectCode?: string;
      topicSlug?: string;
      examCode?: ExamCode;
      companyName?: string;
      paperCode?: string;
      examYear?: number;
    }
  ): Promise<number | null> {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE answers.selected_option IS NOT NULL) AS attempted_count,
         COUNT(*) FILTER (WHERE answers.is_correct = TRUE) AS correct_count
       FROM test_attempt_answers AS answers
       INNER JOIN test_attempts AS attempts ON attempts.id = answers.attempt_id
       INNER JOIN questions ON questions.id = answers.question_id
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       WHERE attempts.user_id = $1
         AND attempts.status = 'submitted'
         AND ($2::text IS NULL OR subjects.code = $2::text)
         AND ($3::text IS NULL OR topics.slug = $3::text)
         AND ($4::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.exam_code::text = $4::text
         ))
         AND ($5::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.company_name ILIKE '%' || $5::text || '%'
         ))
         AND ($6::text IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.paper_code ILIKE '%' || $6::text || '%'
         ))
         AND ($7::int IS NULL OR EXISTS (
               SELECT 1
               FROM question_exam_tags AS tags
               WHERE tags.question_id = questions.id
                 AND tags.exam_year = $7::int
         ))`,
      [
        userId,
        filters.subjectCode ?? null,
        filters.topicSlug ?? null,
        filters.examCode ?? null,
        filters.companyName ?? null,
        filters.paperCode ?? null,
        filters.examYear ?? null,
      ]
    );

    const attemptedCount = toNumber(result.rows[0]?.attempted_count);
    const correctCount = toNumber(result.rows[0]?.correct_count);

    if (attemptedCount <= 0) {
      return null;
    }

    return Number(((correctCount / attemptedCount) * 100).toFixed(2));
  }

  private determineDifficultyProfile(accuracy: number | null): DifficultyProfile {
    if (accuracy === null || accuracy < 45) {
      return 'recovery';
    }

    if (accuracy > 75) {
      return 'challenge';
    }

    return 'balanced';
  }

  private rankAdaptiveCandidates(
    candidates: AdaptiveCandidateRow[],
    weakTopicIds: Set<string>,
    profile: DifficultyProfile
  ): AdaptiveCandidateRow[] {
    const profileWeights: Record<
      DifficultyProfile,
      Record<'easy' | 'medium' | 'hard', number>
    > = {
      recovery: { easy: 6, medium: 3, hard: 1 },
      balanced: { easy: 2, medium: 6, hard: 2 },
      challenge: { easy: 1, medium: 3, hard: 6 },
    };

    return [...candidates]
      .map((candidate) => {
        const difficultyScore = profileWeights[profile][candidate.difficulty] ?? 0;
        const weakTopicBonus =
          candidate.topic_id && weakTopicIds.has(candidate.topic_id) ? 8 : 0;
        const randomBonus = Math.random() * 2;

        return {
          candidate,
          score: difficultyScore + weakTopicBonus + randomBonus,
        };
      })
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.candidate);
  }
}
