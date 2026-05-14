const { EngagementService } = require('../backend/dist/modules/engagement/engagement.service');
const { pool } = require('../backend/dist/config/database');
const { redis } = require('../backend/dist/config/redis');

(async () => {
  const service = new EngagementService();
  const quizzes = await service.listLiveQuizzes();
  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM formula_flashcards) AS formulas,
      (SELECT COUNT(*)::int FROM badges) AS badges,
      (SELECT COUNT(*)::int FROM weekly_challenges) AS challenges,
      (SELECT COUNT(*)::int FROM live_quizzes) AS quizzes,
      (SELECT COUNT(*)::int FROM live_quiz_questions) AS quiz_questions
  `);
  const pong = await redis.ping();

  console.log(JSON.stringify({
    formulas: counts.rows[0].formulas,
    badges: counts.rows[0].badges,
    challenges: counts.rows[0].challenges,
    liveQuizzesFromService: quizzes.length,
    quizQuestions: counts.rows[0].quiz_questions,
    redis: pong,
  }));

  await redis.quit();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await redis.quit();
  } catch {
    // Ignore.
  }
  await pool.end();
  process.exit(1);
});
