export type TestType = 'topic' | 'subject' | 'full_length';
export type ExamCode = 'GATE' | 'PSU' | 'ESE';

export interface CatalogFilters {
  type?: TestType;
  subjectCode?: string;
  topicSlug?: string;
  examCode?: ExamCode;
  companyName?: string;
  paperCode?: string;
  examYear?: number;
  adaptiveOnly?: boolean;
}

export interface TestCatalogItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string[];
  testType: TestType;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  subjectCode: string | null;
  subjectName: string | null;
  topicSlug: string | null;
  topicName: string | null;
  examCode: ExamCode | null;
  companyName: string | null;
  paperCode: string | null;
  examYear: number | null;
  isAdaptive: boolean;
}

export interface AdaptiveStartPayload {
  type?: TestType;
  subjectCode?: string;
  topicSlug?: string;
  examCode?: ExamCode;
  companyName?: string;
  paperCode?: string;
  examYear?: number;
  questionCount?: number;
  durationMinutes?: number;
}

export interface AttemptQuestionResponse {
  selectedOption: string | null;
  markedForReview: boolean;
  visited: boolean;
  note: string | null;
  wrongTag: string | null;
  timeSpentSeconds: number;
}

export interface AttemptQuestion {
  id: string;
  position: number;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  marks: number;
  negativeMarks: number;
  estimatedSeconds: number;
  subjectName: string;
  topicName: string | null;
  sourceTag: {
    examCode: ExamCode;
    companyName: string | null;
    paperCode: string | null;
    examYear: number | null;
    isPyq: boolean;
  };
  response: AttemptQuestionResponse;
  paletteStatus: string;
}

export interface AttemptDetail {
  attempt: {
    id: string;
    status: 'in_progress' | 'submitted';
    startedAt: string;
    submittedAt: string | null;
    durationMinutes: number;
    currentQuestionIndex: number;
    totalQuestions: number;
    remainingSeconds: number;
  };
  test: {
    id: string;
    title: string;
    description: string | null;
    testType: TestType;
    instructions: string[];
    totalMarks: number;
    totalQuestions: number;
    subjectName: string | null;
    topicName: string | null;
    subjectCode: string | null;
    topicSlug: string | null;
    examCode: ExamCode;
    companyName: string | null;
    paperCode: string | null;
    examYear: number | null;
    isAdaptive: boolean;
  };
  questions: AttemptQuestion[];
}

export interface AttemptStartResponse {
  resumed: boolean;
  detail: AttemptDetail;
  adaptiveProfile?: {
    difficultyProfile: 'recovery' | 'balanced' | 'challenge';
    weakTopicCount: number;
    selectedQuestionCount: number;
  };
}

export interface AttemptSavePayload {
  selectedOption?: string | null;
  markedForReview?: boolean;
  visited?: boolean;
  note?: string | null;
  wrongTag?: string | null;
  timeSpentSeconds?: number;
  currentQuestionIndex?: number;
}

export interface AttemptSaveResponse {
  questionId: string;
  questionOrder: number;
  selectedOption: string | null;
  markedForReview: boolean;
  visited: boolean;
  note: string | null;
  wrongTag: string | null;
  timeSpentSeconds: number;
  paletteStatus: string;
}

export interface AttemptAnalytics {
  attempt: {
    id: string;
    status: 'in_progress' | 'submitted';
    startedAt: string;
    submittedAt: string | null;
  };
  test: {
    id: string;
    title: string;
    description: string | null;
    testType: TestType;
    totalMarks: number;
    totalQuestions: number;
    durationMinutes: number;
    examCode: ExamCode;
    companyName: string | null;
    paperCode: string | null;
    examYear: number | null;
    isAdaptive: boolean;
  };
  summary: {
    score: number;
    totalMarks: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    accuracy: number;
    averageTimePerQuestion: number;
    completionRate: number;
  };
  weakAreas: Array<{
    subjectName: string;
    topicName: string;
    attempted: number;
    incorrectCount: number;
    accuracy: number;
    averageTimeSeconds: number;
  }>;
  examWisePerformance: Array<{
    examCode: ExamCode;
    attempted: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    averageTimeSeconds: number;
  }>;
  companyWisePerformance: Array<{
    examCode: ExamCode;
    companyName: string;
    attempted: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    averageTimeSeconds: number;
  }>;
  paperWisePerformance: Array<{
    examCode: ExamCode;
    companyName: string;
    paperCode: string;
    examYear: number | null;
    attempted: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    averageTimeSeconds: number;
  }>;
  questionReview: Array<{
    id: string;
    position: number;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    selectedOption: string | null;
    correctOption: string;
    explanation: string | null;
    marks: number;
    negativeMarks: number;
    isCorrect: boolean | null;
    timeSpentSeconds: number;
    subjectName: string;
    topicName: string;
    note: string | null;
    wrongTag: string | null;
    examCode: ExamCode;
    companyName: string | null;
    paperCode: string | null;
    examYear: number | null;
    isPyq: boolean;
  }>;
}
