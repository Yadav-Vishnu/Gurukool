const { CommunityService } = require('../backend/dist/modules/community/community.service');
const { pool } = require('../backend/dist/config/database');
const { redis } = require('../backend/dist/config/redis');

(async () => {
  const service = new CommunityService();
  const questions = await service.listDiscussionQuestions();
  const tableResult = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'question_discussion_threads',
        'discussion_posts',
        'peer_connections',
        'collaboration_events',
        'event_reschedule_requests',
        'audio_call_rooms',
        'external_calendar_syncs',
        'collaboration_notifications',
        'collaboration_reminders'
      )
  `);
  const pong = await redis.ping();

  console.log(JSON.stringify({
    communityQuestionCount: questions.length,
    communityTableCount: tableResult.rows[0].count,
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
