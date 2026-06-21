export interface EngagementProfile {
  xpPoints: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActivityDate: string | null;
  referralCode: string;
}

export interface FormulaFlashcard {
  id: string;
  slug: string;
  title: string;
  formulaText: string;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  subject: {
    code: string;
    name: string;
  } | null;
  review: {
    confidence: number;
    reviewCount: number;
    lastReviewedAt: string;
    nextDueAt: string;
  } | null;
}

export interface BadgeRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  xpBonus: number;
  awardedAt: string | null;
}

export interface WeeklyChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  challengeType: 'weekly' | 'live_quiz' | 'revision';
  startsAt: string;
  endsAt: string;
  xpReward: number;
  status: 'draft' | 'scheduled' | 'active' | 'closed';
  participation: {
    status: 'joined' | 'completed';
    score: number;
    xpAwarded: number;
    joinedAt: string;
    completedAt: string | null;
  } | null;
}

export interface LiveQuizQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  points: number;
  position: number;
  userResponse: {
    selectedOption: string;
    isCorrect: boolean;
    pointsAwarded: number;
  } | null;
}

export interface LiveQuiz {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: 'scheduled' | 'active' | 'closed';
  questions: LiveQuizQuestion[];
}

export interface QuizAnswerResult {
  alreadyAnswered: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
  explanation: string | null;
}

export interface QuizLeaderboardRow {
  rank: number;
  userId: string;
  fullName: string;
  points: number;
}

export interface ReferralSummary {
  referralCode: string;
  totalReferrals: number;
  awardedPoints: number;
}

export interface MentorRoadmap {
  id: string;
  status: 'active' | 'archived';
  focusSummary: string;
  weeklyPlan: Array<{
    day: number;
    task: string;
    target: string;
  }>;
  recommendedActions: Array<{
    type: string;
    title: string;
    detail: string;
  }>;
  generatedFrom: Record<string, unknown>;
  createdAt: string;
}

export interface EngagementDashboard {
  profile: EngagementProfile;
  dailyFlashcards: FormulaFlashcard[];
  badges: BadgeRecord[];
  weeklyChallenges: WeeklyChallenge[];
  referral: ReferralSummary;
  roadmap: MentorRoadmap | null;
}
