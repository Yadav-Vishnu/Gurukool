const { PlatformService } = require('../backend/dist/modules/platform/platform.service');
const { ContentModerationService } = require('../backend/dist/modules/platform/content-moderation.service');
const { pool } = require('../backend/dist/config/database');
const { redis } = require('../backend/dist/config/redis');

(async () => {
  const platformService = new PlatformService();
  const moderationService = new ContentModerationService();
  const [deployments, scaleProfiles, hostedTests, counts] = await Promise.all([
    platformService.listDeployments(),
    platformService.listScaleProfiles(),
    platformService.listHostedTests(),
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM deployment_releases) AS deployments,
        (SELECT COUNT(*)::int FROM service_scale_profiles) AS scale_profiles,
        (SELECT COUNT(*)::int FROM institution_partners) AS institutions,
        (SELECT COUNT(*)::int FROM institution_test_hosts) AS hosted_tests,
        (SELECT COUNT(*)::int FROM moderation_rules) AS moderation_rules
    `),
  ]);
  const analysis = moderationService.analyzeText('Please do not share leaked paper or answer key leak links.');
  const pong = await redis.ping();

  console.log(JSON.stringify({
    deployments: counts.rows[0].deployments,
    deploymentsFromService: deployments.length,
    scaleProfiles: counts.rows[0].scale_profiles,
    scaleProfilesFromService: scaleProfiles.length,
    institutions: counts.rows[0].institutions,
    hostedTests: counts.rows[0].hosted_tests,
    hostedTestsFromService: hostedTests.length,
    moderationRules: counts.rows[0].moderation_rules,
    sampleModerationSeverity: analysis.severity,
    sampleModerationAction: analysis.recommendedAction,
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
