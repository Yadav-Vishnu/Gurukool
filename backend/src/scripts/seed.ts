import { pool, testConnection } from '../config/database';

type SubjectSeed = {
  code: string;
  name: string;
  description: string;
  examTrack: string;
};

type TopicSeed = {
  subjectCode: string;
  slug: string;
  name: string;
  description: string;
};

type QuestionExamTagSeed = {
  examCode: 'GATE' | 'PSU' | 'ESE';
  companyName?: string | null;
  paperCode?: string | null;
  examYear?: number | null;
  isPyq?: boolean;
};

type QuestionSeed = {
  key: string;
  subjectCode: string;
  topicSlug: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: Array<{ id: string; text: string }>;
  correctOption: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  estimatedSeconds: number;
  tags: QuestionExamTagSeed[];
};

type TestSeed = {
  slug: string;
  title: string;
  description: string;
  instructions: string[];
  testType: 'topic' | 'subject' | 'full_length';
  subjectCode: string | null;
  topicSlug: string | null;
  durationMinutes: number;
  questionKeys: string[];
  examCode: 'GATE' | 'PSU' | 'ESE';
  companyName?: string | null;
  paperCode?: string | null;
  examYear?: number | null;
  isAdaptive?: boolean;
  metadata?: Record<string, unknown>;
};

const subjects: SubjectSeed[] = [
  {
    code: 'MATH',
    name: 'Engineering Mathematics',
    description: 'Linear algebra and calculus fundamentals for GATE, PSU, and ESE.',
    examTrack: 'MULTI_EXAM',
  },
  {
    code: 'ME',
    name: 'Mechanical Engineering',
    description: 'Core mechanical topics including strength of materials and thermodynamics.',
    examTrack: 'MULTI_EXAM',
  },
  {
    code: 'GA',
    name: 'General Aptitude',
    description: 'Quantitative aptitude and reasoning shared across major exams.',
    examTrack: 'MULTI_EXAM',
  },
];

const topics: TopicSeed[] = [
  {
    subjectCode: 'MATH',
    slug: 'linear-algebra',
    name: 'Linear Algebra',
    description: 'Matrices, determinants, rank, and systems of equations.',
  },
  {
    subjectCode: 'MATH',
    slug: 'calculus',
    name: 'Calculus',
    description: 'Differentiation, extrema, and integration basics.',
  },
  {
    subjectCode: 'ME',
    slug: 'strength-of-materials',
    name: 'Strength of Materials',
    description: 'Stress, strain, bending, and torsion.',
  },
  {
    subjectCode: 'ME',
    slug: 'thermodynamics',
    name: 'Thermodynamics',
    description: 'Energy balances, entropy, and ideal gas behavior.',
  },
  {
    subjectCode: 'GA',
    slug: 'quantitative-aptitude',
    name: 'Quantitative Aptitude',
    description: 'Ratios, percentages, arithmetic, and logical estimation.',
  },
];

const questions: QuestionSeed[] = [
  {
    key: 'lin-1',
    subjectCode: 'MATH',
    topicSlug: 'linear-algebra',
    prompt: 'If det([[2, 1], [4, 3]]) is evaluated, what is the result?',
    difficulty: 'easy',
    options: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
      { id: 'C', text: '3' },
      { id: 'D', text: '4' },
    ],
    correctOption: 'B',
    explanation: 'The determinant is (2 x 3) - (1 x 4) = 2.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 75,
    tags: [
      { examCode: 'GATE', paperCode: 'Engineering Mathematics', examYear: 2024, isPyq: true },
      { examCode: 'PSU', companyName: 'ONGC', paperCode: 'Aptitude', examYear: 2022, isPyq: true },
    ],
  },
  {
    key: 'lin-2',
    subjectCode: 'MATH',
    topicSlug: 'linear-algebra',
    prompt:
      'A homogeneous system of three equations in three unknowns has a unique solution when the coefficient matrix has which property?',
    difficulty: 'medium',
    options: [
      { id: 'A', text: 'Its determinant is zero' },
      { id: 'B', text: 'Its rank is less than 3' },
      { id: 'C', text: 'It is non-singular' },
      { id: 'D', text: 'It has one repeated row' },
    ],
    correctOption: 'C',
    explanation: 'A homogeneous system has a unique trivial solution when the matrix is non-singular.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 95,
    tags: [
      { examCode: 'GATE', paperCode: 'Engineering Mathematics', examYear: 2023, isPyq: true },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'General Studies', examYear: 2021, isPyq: true },
    ],
  },
  {
    key: 'lin-3',
    subjectCode: 'MATH',
    topicSlug: 'linear-algebra',
    prompt: 'If the rank of a 3 x 3 matrix is 2, which statement is always true?',
    difficulty: 'medium',
    options: [
      { id: 'A', text: 'Its determinant is non-zero' },
      { id: 'B', text: 'Its rows are linearly dependent' },
      { id: 'C', text: 'All eigenvalues are zero' },
      { id: 'D', text: 'It is invertible' },
    ],
    correctOption: 'B',
    explanation: 'Rank less than 3 means one row can be written as a linear combination of others.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 90,
    tags: [
      { examCode: 'GATE', paperCode: 'Engineering Mathematics', examYear: 2022, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Aptitude', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'calc-1',
    subjectCode: 'MATH',
    topicSlug: 'calculus',
    prompt: 'For f(x) = x^3 - 3x, the critical points are:',
    difficulty: 'medium',
    options: [
      { id: 'A', text: 'x = -1 and x = 1' },
      { id: 'B', text: 'x = 0 only' },
      { id: 'C', text: 'x = -3 and x = 3' },
      { id: 'D', text: 'x = -sqrt(3) and x = sqrt(3)' },
    ],
    correctOption: 'A',
    explanation: "f'(x) = 3x^2 - 3 = 0 gives x = plus-minus 1.",
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 90,
    tags: [
      { examCode: 'GATE', paperCode: 'Engineering Mathematics', examYear: 2023, isPyq: true },
      { examCode: 'PSU', companyName: 'ONGC', paperCode: 'Aptitude', examYear: 2022, isPyq: true },
    ],
  },
  {
    key: 'som-1',
    subjectCode: 'ME',
    topicSlug: 'strength-of-materials',
    prompt: 'A bar under axial tension experiences normal stress equal to:',
    difficulty: 'easy',
    options: [
      { id: 'A', text: 'Load divided by area' },
      { id: 'B', text: 'Load multiplied by area' },
      { id: 'C', text: 'Area divided by load' },
      { id: 'D', text: 'Load multiplied by length' },
    ],
    correctOption: 'A',
    explanation: 'Normal stress is sigma = P/A.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 60,
    tags: [
      { examCode: 'GATE', paperCode: 'Mechanical', examYear: 2024, isPyq: true },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'Mechanical', examYear: 2021, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Mechanical', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'som-2',
    subjectCode: 'ME',
    topicSlug: 'strength-of-materials',
    prompt:
      'For a simply supported beam with a central point load, the maximum bending moment occurs at:',
    difficulty: 'medium',
    options: [
      { id: 'A', text: 'The left support' },
      { id: 'B', text: 'Quarter span' },
      { id: 'C', text: 'Mid-span' },
      { id: 'D', text: 'Everywhere equally' },
    ],
    correctOption: 'C',
    explanation: 'The bending moment is maximum at the middle for this loading case.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 85,
    tags: [
      { examCode: 'GATE', paperCode: 'Mechanical', examYear: 2022, isPyq: true },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'Mechanical', examYear: 2021, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Mechanical', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'som-3',
    subjectCode: 'ME',
    topicSlug: 'strength-of-materials',
    prompt: "The unit of Young's modulus in SI is:",
    difficulty: 'easy',
    options: [
      { id: 'A', text: 'N' },
      { id: 'B', text: 'Pa' },
      { id: 'C', text: 'm/s' },
      { id: 'D', text: 'J' },
    ],
    correctOption: 'B',
    explanation: "Young's modulus is stress over strain, so the SI unit is Pascal.",
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 55,
    tags: [
      { examCode: 'GATE', paperCode: 'Mechanical', examYear: 2024, isPyq: true },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'Mechanical', examYear: 2020, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Mechanical', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'som-4',
    subjectCode: 'ME',
    topicSlug: 'strength-of-materials',
    prompt: 'If a circular shaft transmits torque, the shear stress distribution across the radius is:',
    difficulty: 'hard',
    options: [
      { id: 'A', text: 'Uniform' },
      { id: 'B', text: 'Zero at the surface and maximum at the center' },
      { id: 'C', text: 'Maximum at the surface and zero at the center' },
      { id: 'D', text: 'Independent of radius' },
    ],
    correctOption: 'C',
    explanation: 'Torsion shear stress varies linearly with radius and is maximum at the outer surface.',
    marks: 2,
    negativeMarks: 0.66,
    estimatedSeconds: 120,
    tags: [
      { examCode: 'GATE', paperCode: 'Mechanical', examYear: 2025, isPyq: false },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'Mechanical', examYear: 2021, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Mechanical', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'thermo-1',
    subjectCode: 'ME',
    topicSlug: 'thermodynamics',
    prompt: 'For an ideal gas in an isothermal process, which quantity remains constant?',
    difficulty: 'easy',
    options: [
      { id: 'A', text: 'Pressure' },
      { id: 'B', text: 'Volume' },
      { id: 'C', text: 'Temperature' },
      { id: 'D', text: 'Entropy' },
    ],
    correctOption: 'C',
    explanation: 'By definition, the temperature remains constant during an isothermal process.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 70,
    tags: [
      { examCode: 'GATE', paperCode: 'Mechanical', examYear: 2024, isPyq: true },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'Mechanical', examYear: 2021, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Mechanical', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'thermo-2',
    subjectCode: 'ME',
    topicSlug: 'thermodynamics',
    prompt: 'The first law for a closed system can be written as:',
    difficulty: 'medium',
    options: [
      { id: 'A', text: 'Delta U = Q - W' },
      { id: 'B', text: 'Delta U = Q + W' },
      { id: 'C', text: 'Delta U = W - Q' },
      { id: 'D', text: 'Delta U = 0 for every process' },
    ],
    correctOption: 'A',
    explanation: 'Heat added minus boundary work equals the change in internal energy.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 100,
    tags: [
      { examCode: 'GATE', paperCode: 'Mechanical', examYear: 2023, isPyq: true },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'Mechanical', examYear: 2021, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Mechanical', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'ga-1',
    subjectCode: 'GA',
    topicSlug: 'quantitative-aptitude',
    prompt: 'A class has 40 students. If 25% are absent, how many students are present?',
    difficulty: 'easy',
    options: [
      { id: 'A', text: '10' },
      { id: 'B', text: '20' },
      { id: 'C', text: '30' },
      { id: 'D', text: '35' },
    ],
    correctOption: 'C',
    explanation: '25% absent means 75% present, so 0.75 x 40 = 30.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 60,
    tags: [
      { examCode: 'GATE', paperCode: 'General Aptitude', examYear: 2024, isPyq: true },
      { examCode: 'PSU', companyName: 'ONGC', paperCode: 'Aptitude', examYear: 2022, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Aptitude', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'ga-2',
    subjectCode: 'GA',
    topicSlug: 'quantitative-aptitude',
    prompt: 'If 12 workers finish a job in 15 days, how many days will 20 workers take?',
    difficulty: 'medium',
    options: [
      { id: 'A', text: '7' },
      { id: 'B', text: '8' },
      { id: 'C', text: '9' },
      { id: 'D', text: '10' },
    ],
    correctOption: 'C',
    explanation: 'Work is constant. 12 x 15 = 180 worker-days. 180 / 20 = 9 days.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 85,
    tags: [
      { examCode: 'GATE', paperCode: 'General Aptitude', examYear: 2023, isPyq: true },
      { examCode: 'PSU', companyName: 'ONGC', paperCode: 'Aptitude', examYear: 2022, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Aptitude', examYear: 2023, isPyq: true },
    ],
  },
  {
    key: 'ga-3',
    subjectCode: 'GA',
    topicSlug: 'quantitative-aptitude',
    prompt: 'The ratio of two numbers is 3:5 and their sum is 64. The larger number is:',
    difficulty: 'easy',
    options: [
      { id: 'A', text: '24' },
      { id: 'B', text: '30' },
      { id: 'C', text: '36' },
      { id: 'D', text: '40' },
    ],
    correctOption: 'D',
    explanation: 'Total ratio parts are 8. Each part is 8. The larger number is 5 x 8 = 40.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 70,
    tags: [
      { examCode: 'PSU', companyName: 'ONGC', paperCode: 'Aptitude', examYear: 2022, isPyq: true },
      { examCode: 'PSU', companyName: 'BHEL', paperCode: 'Aptitude', examYear: 2023, isPyq: true },
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'General Studies', examYear: 2021, isPyq: true },
    ],
  },
  {
    key: 'ga-4',
    subjectCode: 'GA',
    topicSlug: 'quantitative-aptitude',
    prompt: 'A train running at 60 km/h crosses a pole in 18 seconds. The train length is:',
    difficulty: 'medium',
    options: [
      { id: 'A', text: '200 m' },
      { id: 'B', text: '250 m' },
      { id: 'C', text: '300 m' },
      { id: 'D', text: '350 m' },
    ],
    correctOption: 'C',
    explanation: 'Speed is 60 x 1000 / 3600 = 16.67 m/s. Length = speed x time = 300 m.',
    marks: 1,
    negativeMarks: 0.33,
    estimatedSeconds: 90,
    tags: [
      { examCode: 'ESE', companyName: 'UPSC', paperCode: 'General Studies', examYear: 2021, isPyq: true },
      { examCode: 'PSU', companyName: 'ONGC', paperCode: 'Aptitude', examYear: 2022, isPyq: true },
      { examCode: 'GATE', paperCode: 'General Aptitude', examYear: 2024, isPyq: true },
    ],
  },
];

const tests: TestSeed[] = [
  {
    slug: 'gate-linear-algebra-drill',
    title: 'GATE Linear Algebra Drill',
    description: 'Topic-wise practice focused on determinants, rank, and systems of equations.',
    instructions: [
      'Attempt the questions in any order.',
      'Use the palette to mark doubtful questions for review.',
      'Add your own note if you want to revise the concept later.',
    ],
    testType: 'topic',
    subjectCode: 'MATH',
    topicSlug: 'linear-algebra',
    durationMinutes: 18,
    questionKeys: ['lin-1', 'lin-2', 'lin-3', 'calc-1'],
    examCode: 'GATE',
    paperCode: 'Engineering Mathematics',
    examYear: 2025,
  },
  {
    slug: 'gate-strength-of-materials-sprint',
    title: 'GATE Strength of Materials Sprint',
    description: 'Subject-wise set that mixes direct formula recall and conceptual traps.',
    instructions: [
      'Track both accuracy and speed.',
      'Use wrong-answer tags to identify the exact mistake type.',
      'Review explanations after submission.',
    ],
    testType: 'subject',
    subjectCode: 'ME',
    topicSlug: 'strength-of-materials',
    durationMinutes: 25,
    questionKeys: ['som-1', 'som-2', 'som-3', 'som-4'],
    examCode: 'GATE',
    paperCode: 'Mechanical',
    examYear: 2025,
  },
  {
    slug: 'gate-me-mini-mock',
    title: 'GATE Mechanical Mini Mock',
    description: 'A compact full-length mock with aptitude, mathematics, and mechanical questions.',
    instructions: [
      'This mini mock simulates a short GATE paper.',
      'Timer runs continuously while you navigate.',
      'Submit to unlock weak-area analytics and exam-wise breakdowns.',
    ],
    testType: 'full_length',
    subjectCode: 'ME',
    topicSlug: null,
    durationMinutes: 45,
    questionKeys: ['ga-1', 'lin-1', 'calc-1', 'som-1', 'som-2', 'som-4', 'thermo-1', 'thermo-2'],
    examCode: 'GATE',
    paperCode: 'Mechanical',
    examYear: 2025,
  },
  {
    slug: 'psu-ongc-aptitude-2022',
    title: 'ONGC Aptitude 2022 Practice Pack',
    description: 'PSU-focused aptitude and quick mathematics mix inspired by ONGC 2022 patterns.',
    instructions: [
      'Focus on short calculations and elimination speed.',
      'Tag wrong answers by mistake type to improve adaptive picks.',
      'Review company-wise analytics after submission.',
    ],
    testType: 'full_length',
    subjectCode: 'GA',
    topicSlug: 'quantitative-aptitude',
    durationMinutes: 32,
    questionKeys: ['ga-1', 'ga-2', 'ga-3', 'ga-4', 'lin-1', 'calc-1'],
    examCode: 'PSU',
    companyName: 'ONGC',
    paperCode: 'Aptitude',
    examYear: 2022,
    metadata: {
      track: 'company-wise',
      audience: 'PSU',
    },
  },
  {
    slug: 'ese-mechanical-pyq-2021',
    title: 'ESE Mechanical PYQ Set 2021',
    description: 'ESE style mechanical PYQ-style set for paper-wise revision.',
    instructions: [
      'Treat this as an ESE-style paper block.',
      'Use notes to record formulas to revisit before your next attempt.',
      'Use analytics to identify high-time paper segments.',
    ],
    testType: 'full_length',
    subjectCode: 'ME',
    topicSlug: null,
    durationMinutes: 36,
    questionKeys: ['som-1', 'som-2', 'som-4', 'thermo-1', 'thermo-2', 'ga-4'],
    examCode: 'ESE',
    companyName: 'UPSC',
    paperCode: 'Mechanical',
    examYear: 2021,
    metadata: {
      track: 'paper-wise',
      source: 'pyq',
    },
  },
  {
    slug: 'psu-bhel-mechanical-2023',
    title: 'BHEL Mechanical 2023 Challenge',
    description: 'Mixed mechanical and aptitude challenge based on BHEL recruitment style.',
    instructions: [
      'Balance concept accuracy and pace.',
      'Mark review questions to revisit if time remains.',
      'Use company-wise analytics for targeted revision.',
    ],
    testType: 'full_length',
    subjectCode: 'ME',
    topicSlug: null,
    durationMinutes: 34,
    questionKeys: ['ga-2', 'ga-3', 'som-2', 'som-3', 'thermo-1', 'thermo-2'],
    examCode: 'PSU',
    companyName: 'BHEL',
    paperCode: 'Mechanical',
    examYear: 2023,
    metadata: {
      track: 'company-wise',
      audience: 'PSU',
    },
  },
];

async function seed(): Promise<void> {
  console.log('\nSeeding Gurukool development data...\n');

  const connected = await testConnection();
  if (!connected) {
    console.error('Cannot connect to PostgreSQL. Start Docker first with `docker compose up -d`.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
        INSERT INTO users (email, phone, full_name, auth_provider, is_verified, role)
        VALUES
          ($1, $2, $3, 'google', TRUE, 'student'),
          ($4, $5, $6, 'phone', TRUE, 'admin')
        ON CONFLICT (email) DO NOTHING
      `,
      [
        'student@gurukool.dev',
        '9876543210',
        'Demo Student',
        'admin@gurukool.dev',
        '9123456789',
        'Demo Admin',
      ]
    );

    const subjectIds = new Map<string, string>();
    for (const subject of subjects) {
      const subjectResult = await client.query(
        `
          INSERT INTO subjects (code, name, exam_track, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code)
          DO UPDATE SET
            name = EXCLUDED.name,
            exam_track = EXCLUDED.exam_track,
            description = EXCLUDED.description,
            updated_at = NOW()
          RETURNING id
        `,
        [subject.code, subject.name, subject.examTrack, subject.description]
      );

      subjectIds.set(subject.code, subjectResult.rows[0].id);
    }

    const topicIds = new Map<string, string>();
    for (const topic of topics) {
      const subjectId = subjectIds.get(topic.subjectCode);
      if (!subjectId) {
        throw new Error(`Missing subject for topic seed: ${topic.slug}`);
      }

      const topicResult = await client.query(
        `
          INSERT INTO topics (subject_id, slug, name, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (subject_id, slug)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = NOW()
          RETURNING id
        `,
        [subjectId, topic.slug, topic.name, topic.description]
      );

      topicIds.set(`${topic.subjectCode}:${topic.slug}`, topicResult.rows[0].id);
    }

    const questionIds = new Map<string, string>();
    for (const question of questions) {
      const subjectId = subjectIds.get(question.subjectCode);
      const topicId = topicIds.get(`${question.subjectCode}:${question.topicSlug}`);

      if (!subjectId || !topicId) {
        throw new Error(`Missing subject or topic for question seed: ${question.key}`);
      }

      const questionResult = await client.query(
        `
          INSERT INTO questions (
            subject_id,
            topic_id,
            prompt,
            difficulty,
            options,
            correct_option,
            explanation,
            marks,
            negative_marks,
            estimated_seconds
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
          ON CONFLICT (prompt)
          DO UPDATE SET
            subject_id = EXCLUDED.subject_id,
            topic_id = EXCLUDED.topic_id,
            difficulty = EXCLUDED.difficulty,
            options = EXCLUDED.options,
            correct_option = EXCLUDED.correct_option,
            explanation = EXCLUDED.explanation,
            marks = EXCLUDED.marks,
            negative_marks = EXCLUDED.negative_marks,
            estimated_seconds = EXCLUDED.estimated_seconds,
            updated_at = NOW()
          RETURNING id
        `,
        [
          subjectId,
          topicId,
          question.prompt,
          question.difficulty,
          JSON.stringify(question.options),
          question.correctOption,
          question.explanation,
          question.marks,
          question.negativeMarks,
          question.estimatedSeconds,
        ]
      );

      const questionId = questionResult.rows[0].id as string;
      questionIds.set(question.key, questionId);

      await client.query('DELETE FROM question_exam_tags WHERE question_id = $1', [questionId]);

      for (const tag of question.tags) {
        await client.query(
          `
            INSERT INTO question_exam_tags (
              question_id,
              exam_code,
              company_name,
              paper_code,
              exam_year,
              is_pyq
            )
            VALUES ($1, $2::exam_code, $3, $4, $5, $6)
          `,
          [
            questionId,
            tag.examCode,
            tag.companyName ?? null,
            tag.paperCode ?? null,
            tag.examYear ?? null,
            tag.isPyq ?? true,
          ]
        );
      }
    }

    for (const test of tests) {
      const subjectId = test.subjectCode ? subjectIds.get(test.subjectCode) ?? null : null;
      const topicId =
        test.subjectCode && test.topicSlug
          ? topicIds.get(`${test.subjectCode}:${test.topicSlug}`) ?? null
          : null;

      const testResult = await client.query(
        `
          INSERT INTO tests (
            slug,
            title,
            description,
            instructions,
            test_type,
            subject_id,
            topic_id,
            duration_minutes,
            is_published,
            exam_code,
            company_name,
            paper_code,
            exam_year,
            is_adaptive,
            metadata
          )
          VALUES (
            $1, $2, $3, $4::jsonb, $5::test_type, $6, $7, $8, TRUE, $9::exam_code,
            $10, $11, $12, $13, $14::jsonb
          )
          ON CONFLICT (slug)
          DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            instructions = EXCLUDED.instructions,
            test_type = EXCLUDED.test_type,
            subject_id = EXCLUDED.subject_id,
            topic_id = EXCLUDED.topic_id,
            duration_minutes = EXCLUDED.duration_minutes,
            exam_code = EXCLUDED.exam_code,
            company_name = EXCLUDED.company_name,
            paper_code = EXCLUDED.paper_code,
            exam_year = EXCLUDED.exam_year,
            is_adaptive = EXCLUDED.is_adaptive,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
          RETURNING id
        `,
        [
          test.slug,
          test.title,
          test.description,
          JSON.stringify(test.instructions),
          test.testType,
          subjectId,
          topicId,
          test.durationMinutes,
          test.examCode,
          test.companyName ?? null,
          test.paperCode ?? null,
          test.examYear ?? null,
          test.isAdaptive ?? false,
          JSON.stringify(test.metadata ?? {}),
        ]
      );

      const testId = testResult.rows[0].id as string;

      await client.query('DELETE FROM test_questions WHERE test_id = $1', [testId]);

      let position = 1;
      for (const questionKey of test.questionKeys) {
        const questionId = questionIds.get(questionKey);
        if (!questionId) {
          throw new Error(`Missing question for test seed: ${questionKey}`);
        }

        await client.query(
          `
            INSERT INTO test_questions (test_id, question_id, position)
            VALUES ($1, $2, $3)
          `,
          [testId, questionId, position]
        );

        position += 1;
      }

      await client.query(
        `
          UPDATE tests
          SET total_questions = stats.total_questions,
              total_marks = stats.total_marks,
              updated_at = NOW()
          FROM (
            SELECT
              COUNT(*)::int AS total_questions,
              COALESCE(SUM(questions.marks), 0)::numeric(8, 2) AS total_marks
            FROM test_questions
            INNER JOIN questions ON questions.id = test_questions.question_id
            WHERE test_questions.test_id = $1
          ) AS stats
          WHERE tests.id = $1
        `,
        [testId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log('Seed complete. Demo users plus Phase 2 and Phase 3 data are ready.\n');
  await pool.end();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await pool.end();
  process.exit(1);
});
