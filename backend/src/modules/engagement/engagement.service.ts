import { randomUUID } from 'crypto';
import { query } from '../../config/database';
import { redis } from '../../config/redis';
import { ApiError } from '../../middleware/error-handler';

type BadgeSlug =
  | 'first-flashcard'
  | 'three-day-streak'
  | 'xp-100'
  | 'challenge-starter'
  | 'mentor-ready'
  | 'referral-spark';

const mapFormula = (row: any) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  formulaText: row.formula_text,
  explanation: row.explanation ?? null,
  difficulty: row.difficulty,
  tags: Array.isArray(row.tags) ? row.tags : [],
  subject: row.subject_code
    ? {
        code: row.subject_code,
        name: row.subject_name,
      }
    : null,
  review: row.last_reviewed_at
    ? {
        confidence: row.confidence,
        reviewCount: row.review_count,
        lastReviewedAt: row.last_reviewed_at,
        nextDueAt: row.next_due_at,
      }
    : null,
});

const mapProfile = (row: any) => ({
  xpPoints: Number(row.xp_points ?? 0),
  currentStreakDays: Number(row.current_streak_days ?? 0),
  longestStreakDays: Number(row.longest_streak_days ?? 0),
  lastActivityDate: row.last_activity_date ?? null,
  referralCode: row.referral_code,
});

const mapBadge = (row: any) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  xpBonus: Number(row.xp_bonus ?? 0),
  awardedAt: row.awarded_at ?? null,
});

const mapChallenge = (row: any) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  challengeType: row.challenge_type,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  xpReward: Number(row.xp_reward ?? 0),
  status: row.status,
  participation: row.participant_id
    ? {
        status: row.participant_status,
        score: Number(row.score ?? 0),
        xpAwarded: Number(row.xp_awarded ?? 0),
        joinedAt: row.joined_at,
        completedAt: row.completed_at ?? null,
      }
    : null,
});

const mapRoadmap = (row: any) => ({
  id: row.id,
  status: row.status,
  focusSummary: row.focus_summary,
  weeklyPlan: Array.isArray(row.weekly_plan) ? row.weekly_plan : [],
  recommendedActions: Array.isArray(row.recommended_actions) ? row.recommended_actions : [],
  generatedFrom: row.generated_from ?? {},
  createdAt: row.created_at,
});

export class EngagementService {
  async getDashboard(userId: string) {
    const profile = await this.ensureProfile(userId);
    const [flashcards, badges, challenges, referral, roadmap] = await Promise.all([
      this.getDailyFlashcards(userId),
      this.listBadges(userId),
      this.listWeeklyChallenges(userId),
      this.getReferralSummary(userId),
      this.getLatestRoadmap(userId),
    ]);

    return {
      profile,
      dailyFlashcards: flashcards,
      badges,
      weeklyChallenges: challenges,
      referral,
      roadmap,
    };
  }

  async getDailyFlashcards(userId: string) {
    await this.ensureProfile(userId);
    const result = await query(
      `SELECT
         formulas.*,
         subjects.code AS subject_code,
         subjects.name AS subject_name,
         reviews.confidence,
         reviews.review_count,
         reviews.last_reviewed_at,
         reviews.next_due_at
       FROM formula_flashcards AS formulas
       LEFT JOIN subjects ON subjects.id = formulas.subject_id
       LEFT JOIN user_formula_reviews AS reviews
         ON reviews.formula_id = formulas.id AND reviews.user_id = $1
       WHERE formulas.is_active = TRUE
         AND (reviews.next_due_at IS NULL OR reviews.next_due_at <= NOW() + INTERVAL '1 day')
       ORDER BY
         reviews.next_due_at ASC NULLS FIRST,
         md5(formulas.slug || CURRENT_DATE::text)
       LIMIT 10`,
      [userId]
    );

    return result.rows.map(mapFormula);
  }

  async reviewFlashcard(userId: string, formulaId: string, confidence: number) {
    await this.ensureProfile(userId);
    const formula = await query(
      `SELECT id, title
       FROM formula_flashcards
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1`,
      [formulaId]
    );

    if (!formula.rows[0]) {
      throw new ApiError('Formula flashcard was not found.', 404);
    }

    const dueDaysByConfidence: Record<number, number> = {
      1: 1,
      2: 2,
      3: 4,
      4: 7,
      5: 14,
    };
    const dueDays = dueDaysByConfidence[confidence] ?? 3;

    const review = await query(
      `INSERT INTO user_formula_reviews (
         user_id,
         formula_id,
         confidence,
         review_count,
         last_reviewed_at,
         next_due_at
       )
       VALUES ($1, $2, $3, 1, NOW(), NOW() + ($4::int * INTERVAL '1 day'))
       ON CONFLICT (user_id, formula_id)
       DO UPDATE SET confidence = EXCLUDED.confidence,
                     review_count = user_formula_reviews.review_count + 1,
                     last_reviewed_at = NOW(),
                     next_due_at = NOW() + ($4::int * INTERVAL '1 day'),
                     updated_at = NOW()
       RETURNING *`,
      [userId, formulaId, confidence, dueDays]
    );

    const xp = confidence >= 4 ? 6 : 4;
    await this.awardXp(userId, 'flashcard_review', xp, `Reviewed ${formula.rows[0].title}`, {
      formulaId,
      confidence,
    });

    return {
      review: review.rows[0],
      xpAwarded: xp,
    };
  }

  async listBadges(userId: string) {
    await this.ensureProfile(userId);
    const result = await query(
      `SELECT
         badges.*,
         user_badges.awarded_at
       FROM badges
       LEFT JOIN user_badges
         ON user_badges.badge_id = badges.id AND user_badges.user_id = $1
       ORDER BY user_badges.awarded_at DESC NULLS LAST, badges.title ASC`,
      [userId]
    );

    return result.rows.map(mapBadge);
  }

  async listWeeklyChallenges(userId: string) {
    await this.ensureProfile(userId);
    const result = await query(
      `SELECT
         challenges.*,
         participants.id AS participant_id,
         participants.status AS participant_status,
         participants.score,
         participants.xp_awarded,
         participants.joined_at,
         participants.completed_at
       FROM weekly_challenges AS challenges
       LEFT JOIN weekly_challenge_participants AS participants
         ON participants.challenge_id = challenges.id AND participants.user_id = $1
       WHERE challenges.status IN ('active', 'scheduled')
          OR challenges.ends_at >= NOW() - INTERVAL '14 days'
       ORDER BY challenges.starts_at DESC
       LIMIT 20`,
      [userId]
    );

    return result.rows.map(mapChallenge);
  }

  async joinWeeklyChallenge(userId: string, challengeId: string) {
    await this.ensureProfile(userId);
    const challenge = await this.getChallenge(challengeId);

    const inserted = await query(
      `INSERT INTO weekly_challenge_participants (challenge_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (challenge_id, user_id)
       DO UPDATE SET status = weekly_challenge_participants.status
       RETURNING *`,
      [challenge.id, userId]
    );

    await this.awardXp(userId, 'challenge_joined', 5, `Joined ${challenge.title}`, {
      challengeId,
    });

    return inserted.rows[0];
  }

  async submitChallengeScore(userId: string, challengeId: string, score: number) {
    await this.ensureProfile(userId);
    const challenge = await this.getChallenge(challengeId);
    const participant = await query(
      `SELECT *
       FROM weekly_challenge_participants
       WHERE challenge_id = $1 AND user_id = $2
       LIMIT 1`,
      [challengeId, userId]
    );

    if (!participant.rows[0]) {
      throw new ApiError('Join the challenge before submitting a score.', 400);
    }

    const previousXp = Number(participant.rows[0].xp_awarded ?? 0);
    const xpAwarded = previousXp > 0
      ? previousXp
      : Math.max(5, Math.round((Number(challenge.xp_reward) * score) / 100));

    const updated = await query(
      `UPDATE weekly_challenge_participants
       SET status = 'completed',
           score = GREATEST(score, $1),
           xp_awarded = GREATEST(xp_awarded, $2),
           completed_at = COALESCE(completed_at, NOW())
       WHERE challenge_id = $3 AND user_id = $4
       RETURNING *`,
      [score, xpAwarded, challengeId, userId]
    );

    if (previousXp === 0) {
      await this.awardXp(userId, 'challenge_completed', xpAwarded, `Completed ${challenge.title}`, {
        challengeId,
        score,
      });
    }

    await this.zincr('weekly:challenge:leaderboard', userId, score);
    return updated.rows[0];
  }

  async listLiveQuizzes(userId?: string) {
    const quizzes = await query(
      `SELECT *
       FROM live_quizzes
       WHERE status IN ('active', 'scheduled')
          OR ends_at >= NOW() - INTERVAL '7 days'
       ORDER BY starts_at DESC
       LIMIT 10`
    );

    const quizIds = quizzes.rows.map((quiz) => quiz.id);
    if (quizIds.length === 0) {
      return [];
    }

    const questions = await query(
      `SELECT id, quiz_id, prompt, options, points, position
       FROM live_quiz_questions
       WHERE quiz_id = ANY($1::uuid[])
       ORDER BY quiz_id, position`,
      [quizIds]
    );

    let responses: any[] = [];
    if (userId) {
      const respResult = await query(
        `SELECT question_id, selected_option, is_correct, points_awarded
         FROM live_quiz_responses
         WHERE user_id = $1 AND quiz_id = ANY($2::uuid[])`,
        [userId, quizIds]
      );
      responses = respResult.rows;
    }

    return quizzes.rows.map((quiz) => ({
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      startsAt: quiz.starts_at,
      endsAt: quiz.ends_at,
      status: quiz.status,
      questions: questions.rows
        .filter((question) => question.quiz_id === quiz.id)
        .map((question) => {
          const userResponse = responses.find((r) => r.question_id === question.id);
          return {
            id: question.id,
            prompt: question.prompt,
            options: question.options,
            points: Number(question.points ?? 0),
            position: question.position,
            userResponse: userResponse
              ? {
                  selectedOption: userResponse.selected_option,
                  isCorrect: userResponse.is_correct,
                  pointsAwarded: Number(userResponse.points_awarded ?? 0),
                }
              : null,
          };
        }),
    }));
  }

  async submitQuizAnswer(userId: string, questionId: string, selectedOption: string) {
    await this.ensureProfile(userId);
    const question = await query(
      `SELECT
         questions.*,
         quizzes.id AS quiz_id,
         quizzes.title AS quiz_title,
         quizzes.status AS quiz_status,
         quizzes.starts_at,
         quizzes.ends_at
       FROM live_quiz_questions AS questions
       INNER JOIN live_quizzes AS quizzes ON quizzes.id = questions.quiz_id
       WHERE questions.id = $1
       LIMIT 1`,
      [questionId]
    );

    const row = question.rows[0];
    if (!row) {
      throw new ApiError('Live quiz question was not found.', 404);
    }

    if (row.quiz_status !== 'active' || new Date(row.ends_at) < new Date()) {
      throw new ApiError('This live quiz is not accepting answers now.', 400);
    }

    const normalizedOption = selectedOption.trim().toUpperCase();
    const isCorrect = normalizedOption === String(row.correct_option).toUpperCase();
    const pointsAwarded = isCorrect ? Number(row.points ?? 0) : 0;

    const existing = await query(
      `SELECT id, is_correct, points_awarded
       FROM live_quiz_responses
       WHERE question_id = $1 AND user_id = $2
       LIMIT 1`,
      [questionId, userId]
    );

    if (existing.rows[0]) {
      return {
        alreadyAnswered: true,
        isCorrect: existing.rows[0].is_correct,
        pointsAwarded: Number(existing.rows[0].points_awarded ?? 0),
        explanation: row.explanation,
      };
    }

    await query(
      `INSERT INTO live_quiz_responses (
         quiz_id,
         question_id,
         user_id,
         selected_option,
         is_correct,
         points_awarded
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [row.quiz_id, questionId, userId, normalizedOption, isCorrect, pointsAwarded]
    );

    if (pointsAwarded > 0) {
      await this.awardXp(userId, 'live_quiz_correct', pointsAwarded, `Correct answer in ${row.quiz_title}`, {
        quizId: row.quiz_id,
        questionId,
      });
      await this.zincr(`live:quiz:${row.quiz_id}:leaderboard`, userId, pointsAwarded);
    }

    return {
      alreadyAnswered: false,
      isCorrect,
      pointsAwarded,
      explanation: row.explanation,
    };
  }

  async getQuizLeaderboard(quizId: string) {
    try {
      const rows = await redis.zrevrange(`live:quiz:${quizId}:leaderboard`, 0, 9, 'WITHSCORES');
      if (rows.length > 0) {
        const userIds = rows.filter((_, index) => index % 2 === 0);
        const users = await query(
          `SELECT id, full_name
           FROM users
           WHERE id = ANY($1::uuid[])`,
          [userIds]
        );

        return userIds.map((userId, index) => {
          const user = users.rows.find((row) => row.id === userId);
          return {
            rank: index + 1,
            userId,
            fullName: user?.full_name ?? 'Student',
            points: Number(rows[index * 2 + 1] ?? 0),
          };
        });
      }
    } catch {
      // Fall back to SQL below.
    }

    const fallback = await query(
      `SELECT users.id AS user_id, users.full_name, SUM(responses.points_awarded)::int AS points
       FROM live_quiz_responses AS responses
       INNER JOIN users ON users.id = responses.user_id
       WHERE responses.quiz_id = $1
       GROUP BY users.id, users.full_name
       ORDER BY points DESC
       LIMIT 10`,
      [quizId]
    );

    return fallback.rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      fullName: row.full_name,
      points: Number(row.points ?? 0),
    }));
  }

  async getReferralSummary(userId: string) {
    const profile = await this.ensureProfile(userId);
    const rewards = await query(
      `SELECT
         COUNT(*)::int AS total_referrals,
         COALESCE(SUM(reward_points) FILTER (WHERE status = 'awarded'), 0)::int AS awarded_points
       FROM referral_rewards
       WHERE referrer_user_id = $1`,
      [userId]
    );

    return {
      referralCode: profile.referralCode,
      totalReferrals: Number(rewards.rows[0]?.total_referrals ?? 0),
      awardedPoints: Number(rewards.rows[0]?.awarded_points ?? 0),
    };
  }

  async applyReferralCode(userId: string, referralCode: string) {
    const profile = await this.ensureProfile(userId);
    if (profile.referredByUserId) {
      throw new ApiError('A referral code has already been applied to this account.', 400);
    }

    const referrer = await query(
      `SELECT user_id
       FROM engagement_profiles
       WHERE referral_code = $1
       LIMIT 1`,
      [referralCode.trim().toUpperCase()]
    );

    const referrerUserId = referrer.rows[0]?.user_id;
    if (!referrerUserId || referrerUserId === userId) {
      throw new ApiError('Referral code is invalid for this account.', 400);
    }

    await query(
      `UPDATE engagement_profiles
       SET referred_by_user_id = $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [referrerUserId, userId]
    );

    await query(
      `INSERT INTO referral_rewards (
         referrer_user_id,
         referred_user_id,
         referral_code,
         reward_points,
         status,
         awarded_at
       )
       VALUES ($1, $2, $3, 50, 'awarded', NOW())
       ON CONFLICT (referred_user_id) DO NOTHING`,
      [referrerUserId, userId, referralCode.trim().toUpperCase()]
    );

    await this.awardXp(referrerUserId, 'referral_reward', 50, 'Referral reward', {
      referredUserId: userId,
    });
    await this.awardXp(userId, 'referral_join_bonus', 25, 'Referral join bonus', {
      referrerUserId,
    });

    return { applied: true };
  }

  async generateMentorRoadmap(userId: string) {
    const profile = await this.ensureProfile(userId);
    const weakAreas = await this.getWeakAreas(userId);
    const dueCards = await this.getDailyFlashcards(userId);

    const primaryFocus = weakAreas[0]
      ? `${weakAreas[0].subjectName}: ${weakAreas[0].topicName}`
      : dueCards[0]?.subject?.name ?? 'Core revision';
    const focusSummary =
      weakAreas.length > 0
        ? `Focus on ${primaryFocus}. Your recent attempts show this as the highest-return revision area.`
        : 'Start with formula consistency and one short mock. The mentor will sharpen weak-area picks after more attempts.';

    const weeklyPlan = [
      {
        day: 1,
        task: 'Review 8-10 due formula cards and tag anything uncertain.',
        target: 'Build daily recall momentum.',
      },
      {
        day: 2,
        task: `Revise ${primaryFocus} for 35 minutes.`,
        target: 'Close the current weakest concept gap.',
      },
      {
        day: 3,
        task: 'Attempt one topic or adaptive mock and write notes for wrong answers.',
        target: 'Convert practice mistakes into notebook items.',
      },
      {
        day: 4,
        task: 'Repeat formula sprint and solve 10 mixed aptitude/mechanical questions.',
        target: 'Keep both speed and accuracy warm.',
      },
      {
        day: 5,
        task: 'Join the weekly challenge and submit your progress score.',
        target: 'Create public accountability.',
      },
      {
        day: 6,
        task: 'Review analytics and redo the 5 slowest questions.',
        target: 'Reduce time leakage.',
      },
      {
        day: 7,
        task: 'Light revision plus rest planning for the next week.',
        target: 'Protect streak without burnout.',
      },
    ];

    const recommendedActions = [
      {
        type: 'flashcards',
        title: 'Daily formula deck',
        detail: `${Math.min(dueCards.length || 10, 10)} cards are ready for today.`,
      },
      {
        type: 'practice',
        title: 'Weak-area practice',
        detail: weakAreas[0]
          ? `Prioritize ${weakAreas[0].topicName} until accuracy crosses 70%.`
          : 'Submit more tests so the mentor can rank weak areas.',
      },
      {
        type: 'growth',
        title: 'Streak target',
        detail: `Current streak is ${profile.currentStreakDays} day(s). Aim for 3 first.`,
      },
    ];

    await query(
      `UPDATE mentor_roadmaps
       SET status = 'archived'
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const inserted = await query(
      `INSERT INTO mentor_roadmaps (
         user_id,
         focus_summary,
         weekly_plan,
         recommended_actions,
         generated_from
       )
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb)
       RETURNING *`,
      [
        userId,
        focusSummary,
        JSON.stringify(weeklyPlan),
        JSON.stringify(recommendedActions),
        JSON.stringify({
          weakAreas,
          xpPoints: profile.xpPoints,
          generatedBy: 'local-rule-based-mentor-v1',
        }),
      ]
    );

    await this.awardXp(userId, 'mentor_roadmap', 10, 'Generated AI mentor roadmap', {
      roadmapId: inserted.rows[0].id,
    });

    return mapRoadmap(inserted.rows[0]);
  }

  async getLatestRoadmap(userId: string) {
    const result = await query(
      `SELECT *
       FROM mentor_roadmaps
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] ? mapRoadmap(result.rows[0]) : null;
  }

  private async ensureProfile(userId: string) {
    const existing = await query(
      `SELECT *
       FROM engagement_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (existing.rows[0]) {
      return {
        ...mapProfile(existing.rows[0]),
        referredByUserId: existing.rows[0].referred_by_user_id ?? null,
      };
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const referralCode = `GK${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      const inserted = await query(
        `INSERT INTO engagement_profiles (user_id, referral_code)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [userId, referralCode]
      );

      if (inserted.rows[0]) {
        return {
          ...mapProfile(inserted.rows[0]),
          referredByUserId: inserted.rows[0].referred_by_user_id ?? null,
        };
      }
    }

    throw new ApiError('Could not create engagement profile. Please retry.', 500);
  }

  private async awardXp(
    userId: string,
    eventType: string,
    points: number,
    reason: string,
    metadata: Record<string, unknown> = {},
    evaluateBadges = true
  ) {
    if (points <= 0) {
      return;
    }

    await this.ensureProfile(userId);
    await this.updateStreak(userId);
    await query(
      `INSERT INTO xp_events (user_id, event_type, points, reason, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [userId, eventType, points, reason, JSON.stringify(metadata)]
    );
    await query(
      `UPDATE engagement_profiles
       SET xp_points = xp_points + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [points, userId]
    );
    await this.zincr('engagement:xp:leaderboard', userId, points);

    if (evaluateBadges) {
      await this.evaluateBadges(userId);
    }
  }

  private async updateStreak(userId: string) {
    await query(
      `WITH next_streak AS (
         SELECT
           user_id,
           CASE
             WHEN last_activity_date = CURRENT_DATE THEN current_streak_days
             WHEN last_activity_date = CURRENT_DATE - 1 THEN current_streak_days + 1
             ELSE 1
           END AS value
         FROM engagement_profiles
         WHERE user_id = $1
       )
       UPDATE engagement_profiles AS profiles
       SET current_streak_days = next_streak.value,
           longest_streak_days = GREATEST(profiles.longest_streak_days, next_streak.value),
           last_activity_date = CURRENT_DATE,
           updated_at = NOW()
       FROM next_streak
       WHERE profiles.user_id = next_streak.user_id`,
      [userId]
    );
  }

  private async evaluateBadges(userId: string) {
    const profileResult = await query(
      `SELECT *
       FROM engagement_profiles
       WHERE user_id = $1`,
      [userId]
    );
    const profile = profileResult.rows[0];
    if (!profile) {
      return;
    }

    const counts = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM user_formula_reviews WHERE user_id = $1) AS formula_reviews,
         (SELECT COUNT(*)::int FROM weekly_challenge_participants WHERE user_id = $1) AS challenges,
         (SELECT COUNT(*)::int FROM mentor_roadmaps WHERE user_id = $1) AS roadmaps,
         (SELECT COUNT(*)::int FROM referral_rewards WHERE referrer_user_id = $1 AND status = 'awarded') AS referrals`,
      [userId]
    );

    const row = counts.rows[0];
    const badgeChecks: Array<[BadgeSlug, boolean]> = [
      ['first-flashcard', Number(row.formula_reviews ?? 0) >= 1],
      ['three-day-streak', Number(profile.current_streak_days ?? 0) >= 3],
      ['xp-100', Number(profile.xp_points ?? 0) >= 100],
      ['challenge-starter', Number(row.challenges ?? 0) >= 1],
      ['mentor-ready', Number(row.roadmaps ?? 0) >= 1],
      ['referral-spark', Number(row.referrals ?? 0) >= 1],
    ];

    for (const [slug, passed] of badgeChecks) {
      if (passed) {
        await this.awardBadge(userId, slug);
      }
    }
  }

  private async awardBadge(userId: string, slug: BadgeSlug) {
    const badge = await query(
      `SELECT *
       FROM badges
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    if (!badge.rows[0]) {
      return;
    }

    const inserted = await query(
      `INSERT INTO user_badges (user_id, badge_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, badge_id) DO NOTHING
       RETURNING id`,
      [userId, badge.rows[0].id]
    );

    if (inserted.rows[0] && Number(badge.rows[0].xp_bonus ?? 0) > 0) {
      await this.awardXp(
        userId,
        'badge_bonus',
        Number(badge.rows[0].xp_bonus),
        `Badge bonus: ${badge.rows[0].title}`,
        { badgeSlug: slug },
        false
      );
    }
  }

  private async getChallenge(challengeId: string) {
    const challenge = await query(
      `SELECT *
       FROM weekly_challenges
       WHERE id = $1 AND status = 'active'
       LIMIT 1`,
      [challengeId]
    );

    if (!challenge.rows[0]) {
      throw new ApiError('Active weekly challenge was not found.', 404);
    }

    return challenge.rows[0];
  }

  private async getWeakAreas(userId: string) {
    const result = await query(
      `SELECT
         subjects.name AS subject_name,
         COALESCE(topics.name, 'Core Concepts') AS topic_name,
         COUNT(*) FILTER (WHERE answers.selected_option IS NOT NULL)::int AS attempted,
         COUNT(*) FILTER (WHERE answers.is_correct = TRUE)::int AS correct
       FROM test_attempt_answers AS answers
       INNER JOIN test_attempts AS attempts ON attempts.id = answers.attempt_id
       INNER JOIN questions ON questions.id = answers.question_id
       INNER JOIN subjects ON subjects.id = questions.subject_id
       LEFT JOIN topics ON topics.id = questions.topic_id
       WHERE attempts.user_id = $1
         AND attempts.status = 'submitted'
       GROUP BY subjects.name, topics.name
       HAVING COUNT(*) FILTER (WHERE answers.selected_option IS NOT NULL) > 0
       ORDER BY
         (COUNT(*) FILTER (WHERE answers.is_correct = TRUE)::float
          / NULLIF(COUNT(*) FILTER (WHERE answers.selected_option IS NOT NULL), 0)) ASC,
         COUNT(*) FILTER (WHERE answers.selected_option IS NOT NULL) DESC
       LIMIT 3`,
      [userId]
    );

    return result.rows.map((row) => {
      const attempted = Number(row.attempted ?? 0);
      const correct = Number(row.correct ?? 0);
      return {
        subjectName: row.subject_name,
        topicName: row.topic_name,
        attempted,
        accuracy: attempted > 0 ? Number(((correct / attempted) * 100).toFixed(2)) : 0,
      };
    });
  }

  private async zincr(key: string, member: string, points: number) {
    try {
      await redis.zincrby(key, points, member);
    } catch {
      // Redis leaderboard updates are best effort; XP is persisted in PostgreSQL.
    }
  }
}
