import { randomUUID } from 'crypto';
import { query } from '../../config/database';
import { redis } from '../../config/redis';
import { ApiError } from '../../middleware/error-handler';
import { UserRole } from '../../types';
import { ContentModerationService, ModerationAction } from './content-moderation.service';

type InstitutionInput = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city?: string;
  country: string;
  seatsPurchased: number;
  allowedEmailDomains: string[];
};

type HostTestInput = {
  testId?: string;
  title?: string;
  startsAt?: string;
  endsAt?: string;
  maxParticipants: number;
};

type ReportContentInput = {
  contentType: string;
  contentId?: string;
  content: string;
  reason: string;
  details?: string;
};

type ReviewCaseInput = {
  status: 'in_review' | 'actioned' | 'dismissed' | 'escalated';
  action: ModerationAction;
  note?: string;
};

const reviewerRoles = new Set<UserRole>(['admin', 'moderator']);

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);

const toIso = (value: string | Date | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;

const parseOptionalDate = (value: string | undefined, fieldName: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(`${fieldName} must be a valid date/time.`, 400);
  }

  return parsed;
};

const mapDeployment = (row: any) => ({
  id: row.id,
  platform: row.platform,
  releaseVersion: row.release_version,
  status: row.status,
  rolloutPercent: Number(row.rollout_percent ?? 0),
  buildChannel: row.build_channel,
  artifactUrl: row.artifact_url ?? null,
  healthUrl: row.health_url ?? null,
  notes: row.notes ?? null,
  metadata: row.metadata ?? {},
  updatedAt: row.updated_at,
});

const mapScaleProfile = (row: any) => ({
  id: row.id,
  serviceKey: row.service_key,
  displayName: row.display_name,
  serviceType: row.service_type,
  minReplicas: Number(row.min_replicas ?? 0),
  maxReplicas: Number(row.max_replicas ?? 0),
  cpuRequestMillicores: Number(row.cpu_request_millicores ?? 0),
  memoryRequestMb: Number(row.memory_request_mb ?? 0),
  targetCpuUtilization: Number(row.target_cpu_utilization ?? 0),
  autoscalingEnabled: Boolean(row.autoscaling_enabled),
  status: row.status,
  metadata: row.metadata ?? {},
});

const mapInstitution = (row: any) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  contactName: row.contact_name,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone ?? null,
  city: row.city ?? null,
  country: row.country,
  status: row.status,
  allowedEmailDomains: Array.isArray(row.allowed_email_domains) ? row.allowed_email_domains : [],
  seatsPurchased: Number(row.seats_purchased ?? 0),
  seatsUsed: Number(row.seats_used ?? 0),
  hostedTestCount: Number(row.hosted_test_count ?? 0),
  createdAt: row.created_at,
});

const mapHostedTest = (row: any) => ({
  id: row.id,
  institutionId: row.institution_id,
  institutionName: row.institution_name,
  testId: row.test_id,
  testTitle: row.test_title,
  title: row.title,
  startsAt: toIso(row.starts_at),
  endsAt: toIso(row.ends_at),
  maxParticipants: Number(row.max_participants ?? 0),
  enrollmentCount: Number(row.enrollment_count ?? 0),
  status: row.status,
  accessCode: row.access_code,
  createdAt: row.created_at,
});

const mapModerationCase = (row: any) => ({
  id: row.id,
  contentType: row.content_type,
  contentId: row.content_id ?? null,
  submittedByUserId: row.submitted_by_user_id ?? null,
  reportedByUserId: row.reported_by_user_id ?? null,
  status: row.status,
  severity: row.severity,
  riskScore: Number(row.risk_score ?? 0),
  classifierLabel: row.classifier_label,
  contentExcerpt: row.content_excerpt,
  reasons: Array.isArray(row.reasons) ? row.reasons : [],
  aiRecommendation: row.ai_recommendation,
  humanDecision: row.human_decision ?? null,
  reviewedAt: row.reviewed_at ?? null,
  createdAt: row.created_at,
  submittedBy: row.submitted_full_name
    ? {
        id: row.submitted_by_user_id,
        fullName: row.submitted_full_name,
      }
    : null,
  reportedBy: row.reported_full_name
    ? {
        id: row.reported_by_user_id,
        fullName: row.reported_full_name,
      }
    : null,
});

export class PlatformService {
  private readonly moderationService = new ContentModerationService();

  async getDashboard(userId: string, role: UserRole) {
    const [deployments, scaleProfiles, institutions, hostedTests, moderationStats] =
      await Promise.all([
        this.listDeployments(),
        this.listScaleProfiles(),
        this.listInstitutions(userId, role),
        this.listHostedTests(),
        this.getModerationStats(),
      ]);

    const moderationQueue = reviewerRoles.has(role)
      ? await this.listModerationQueue(role)
      : [];

    return {
      deployments,
      scaleProfiles,
      institutions,
      hostedTests,
      moderationStats,
      moderationQueue,
      releaseChecklist: [
        'Build the PWA with service worker enabled.',
        'Sync Capacitor projects for Android and iOS.',
        'Deploy backend/frontend containers to Kubernetes.',
        'Keep moderation queue staffed before opening public communities.',
      ],
    };
  }

  async listDeployments() {
    const result = await query(
      `SELECT DISTINCT ON (platform) *
       FROM deployment_releases
       ORDER BY platform, created_at DESC`
    );

    return result.rows.map(mapDeployment);
  }

  async listScaleProfiles() {
    const result = await query(
      `SELECT *
       FROM service_scale_profiles
       ORDER BY
         CASE service_type WHEN 'api' THEN 0 WHEN 'domain-service' THEN 1 ELSE 2 END,
         display_name ASC`
    );

    return result.rows.map(mapScaleProfile);
  }

  async listInstitutions(userId: string, role: UserRole) {
    const canSeeAll = reviewerRoles.has(role);
    const result = await query(
      `SELECT
         institutions.*,
         COALESCE(host_counts.hosted_test_count, 0) AS hosted_test_count
       FROM institution_partners AS institutions
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS hosted_test_count
         FROM institution_test_hosts
         WHERE institution_test_hosts.institution_id = institutions.id
       ) AS host_counts ON TRUE
       WHERE $1::boolean = TRUE
          OR institutions.status = 'active'
          OR institutions.created_by = $2
       ORDER BY
         CASE institutions.status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
         institutions.created_at DESC`,
      [canSeeAll, userId]
    );

    return result.rows.map(mapInstitution);
  }

  async createInstitution(userId: string, input: InstitutionInput) {
    const baseSlug = slugify(input.name) || `institution-${randomUUID().slice(0, 8)}`;
    const emailDomain = input.contactEmail.split('@')[1]?.toLowerCase();
    const domains = Array.from(
      new Set([
        ...input.allowedEmailDomains.map((domain) => domain.toLowerCase()),
        ...(emailDomain ? [emailDomain] : []),
      ])
    );

    let inserted;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 6)}`;
      inserted = await query(
        `INSERT INTO institution_partners (
           name,
           slug,
           contact_name,
           contact_email,
           contact_phone,
           city,
           country,
           allowed_email_domains,
           seats_purchased,
           created_by,
           metadata
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11::jsonb)
         ON CONFLICT (slug) DO NOTHING
         RETURNING *`,
        [
          input.name,
          slug,
          input.contactName,
          input.contactEmail.toLowerCase(),
          input.contactPhone ?? null,
          input.city ?? null,
          input.country,
          domains,
          input.seatsPurchased,
          userId,
          JSON.stringify({
            intakeSource: 'platform-page',
            requestedAt: new Date().toISOString(),
          }),
        ]
      );

      if (inserted.rows[0]) {
        break;
      }
    }

    if (!inserted?.rows[0]) {
      throw new ApiError('Could not create institution partner. Please retry.', 500);
    }

    await query(
      `INSERT INTO institution_memberships (
         institution_id,
         user_id,
         role,
         status,
         joined_at
       )
       VALUES ($1, $2, 'owner', 'active', NOW())
       ON CONFLICT (institution_id, user_id)
       DO UPDATE SET role = 'owner',
                     status = 'active',
                     updated_at = NOW()`,
      [inserted.rows[0].id, userId]
    );

    await this.pushRedis('institutions:onboarding:queue', {
      institutionId: inserted.rows[0].id,
      requestedByUserId: userId,
      queuedAt: new Date().toISOString(),
    });

    return mapInstitution({ ...inserted.rows[0], hosted_test_count: 0 });
  }

  async listHostedTests(institutionId?: string) {
    const result = await query(
      `SELECT
         hosts.*,
         institutions.name AS institution_name,
         tests.title AS test_title
       FROM institution_test_hosts AS hosts
       INNER JOIN institution_partners AS institutions ON institutions.id = hosts.institution_id
       INNER JOIN tests ON tests.id = hosts.test_id
       WHERE $1::uuid IS NULL OR hosts.institution_id = $1
       ORDER BY
         CASE hosts.status WHEN 'live' THEN 0 WHEN 'scheduled' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END,
         hosts.starts_at ASC NULLS LAST,
         hosts.created_at DESC
       LIMIT 80`,
      [institutionId ?? null]
    );

    return result.rows.map(mapHostedTest);
  }

  async requestHostedTest(userId: string, institutionId: string, input: HostTestInput) {
    const institution = await this.getInstitutionForHosting(userId, institutionId);
    const test = input.testId
      ? await this.getPublishedTest(input.testId)
      : await this.getFirstPublishedTest();
    const startsAt = parseOptionalDate(input.startsAt, 'startsAt');
    const endsAt = parseOptionalDate(input.endsAt, 'endsAt');

    if ((startsAt && !endsAt) || (!startsAt && endsAt)) {
      throw new ApiError('Both startsAt and endsAt are required when scheduling a hosted test.', 400);
    }

    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new ApiError('Hosted test end time must be after start time.', 400);
    }

    const status = startsAt ? 'scheduled' : 'draft';
    const accessCode = `GK-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const title = input.title ?? `${institution.name} - ${test.title}`;

    const inserted = await query(
      `INSERT INTO institution_test_hosts (
         institution_id,
         test_id,
         title,
         starts_at,
         ends_at,
         max_participants,
         status,
         access_code,
         created_by,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::hosted_test_status, $8, $9, $10::jsonb)
       RETURNING *`,
      [
        institutionId,
        test.id,
        title,
        startsAt,
        endsAt,
        input.maxParticipants,
        status,
        accessCode,
        userId,
        JSON.stringify({
          requestedVia: 'platform-page',
          queuedAt: new Date().toISOString(),
        }),
      ]
    );

    await this.pushRedis('institutions:hosted-tests:queue', {
      hostedTestId: inserted.rows[0].id,
      institutionId,
      requestedByUserId: userId,
      queuedAt: new Date().toISOString(),
    });

    return mapHostedTest({
      ...inserted.rows[0],
      institution_name: institution.name,
      test_title: test.title,
    });
  }

  async reportContent(userId: string, input: ReportContentInput) {
    const moderationCase = await this.moderationService.reportContent({
      reporterUserId: userId,
      contentType: input.contentType,
      contentId: input.contentId,
      content: input.content,
      reason: input.reason,
      details: input.details,
    });

    return mapModerationCase(moderationCase);
  }

  async listModerationQueue(role: UserRole) {
    this.ensureReviewer(role);
    const result = await query(
      `SELECT
         cases.*,
         submitted.full_name AS submitted_full_name,
         reported.full_name AS reported_full_name
       FROM content_moderation_cases AS cases
       LEFT JOIN users AS submitted ON submitted.id = cases.submitted_by_user_id
       LEFT JOIN users AS reported ON reported.id = cases.reported_by_user_id
       WHERE cases.status IN ('open', 'queued', 'in_review', 'escalated')
       ORDER BY
         CASE cases.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         cases.created_at DESC
       LIMIT 80`
    );

    return result.rows.map(mapModerationCase);
  }

  async reviewModerationCase(
    moderatorUserId: string,
    role: UserRole,
    caseId: string,
    input: ReviewCaseInput
  ) {
    this.ensureReviewer(role);
    const updated = await query(
      `UPDATE content_moderation_cases
       SET status = $1::moderation_case_status,
           human_decision = $2::moderation_action_type,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [input.status, input.action, moderatorUserId, caseId]
    );

    if (!updated.rows[0]) {
      throw new ApiError('Moderation case was not found.', 404);
    }

    await query(
      `INSERT INTO moderation_actions (
         case_id,
         moderator_user_id,
         action_type,
         note,
         metadata
       )
       VALUES ($1, $2, $3::moderation_action_type, $4, $5::jsonb)`,
      [
        caseId,
        moderatorUserId,
        input.action,
        input.note ?? null,
        JSON.stringify({
          status: input.status,
          reviewedAt: new Date().toISOString(),
        }),
      ]
    );

    await this.applyContentAction(updated.rows[0], input.action);
    await this.pushRedis('moderation:actions:queue', {
      caseId,
      action: input.action,
      moderatorUserId,
      queuedAt: new Date().toISOString(),
    });

    return mapModerationCase(updated.rows[0]);
  }

  async getModerationStats() {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('open', 'queued', 'in_review', 'escalated'))::int AS open_cases,
         COUNT(*) FILTER (WHERE severity = 'critical' AND status <> 'dismissed')::int AS critical_cases,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS cases_last_7_days
       FROM content_moderation_cases`
    );

    return {
      openCases: Number(result.rows[0]?.open_cases ?? 0),
      criticalCases: Number(result.rows[0]?.critical_cases ?? 0),
      casesLast7Days: Number(result.rows[0]?.cases_last_7_days ?? 0),
    };
  }

  private async getInstitutionForHosting(userId: string, institutionId: string) {
    const result = await query(
      `SELECT institutions.*
       FROM institution_partners AS institutions
       LEFT JOIN institution_memberships AS memberships
         ON memberships.institution_id = institutions.id
        AND memberships.user_id = $2
        AND memberships.status = 'active'
       WHERE institutions.id = $1
         AND institutions.status IN ('active', 'pending')
         AND (
           institutions.created_by = $2
           OR memberships.role IN ('owner', 'instructor')
           OR institutions.status = 'active'
         )
       LIMIT 1`,
      [institutionId, userId]
    );

    if (!result.rows[0]) {
      throw new ApiError('Institution partner was not found or is not available for hosting.', 404);
    }

    return result.rows[0];
  }

  private async getPublishedTest(testId: string) {
    const result = await query(
      `SELECT id, title
       FROM tests
       WHERE id = $1 AND is_published = TRUE
       LIMIT 1`,
      [testId]
    );

    if (!result.rows[0]) {
      throw new ApiError('Published test was not found.', 404);
    }

    return result.rows[0];
  }

  private async getFirstPublishedTest() {
    const result = await query(
      `SELECT id, title
       FROM tests
       WHERE is_published = TRUE
       ORDER BY created_at ASC
       LIMIT 1`
    );

    if (!result.rows[0]) {
      throw new ApiError('No published test is available to host yet.', 404);
    }

    return result.rows[0];
  }

  private ensureReviewer(role: UserRole) {
    if (!reviewerRoles.has(role)) {
      throw new ApiError('Only admins and moderators can access the moderation queue.', 403);
    }
  }

  private async applyContentAction(row: any, action: ModerationAction) {
    if (row.content_type !== 'discussion_post' || !row.content_id) {
      return;
    }

    if (action === 'hide_content' || action === 'delete_content') {
      await query(
        `UPDATE discussion_posts
         SET is_deleted = TRUE,
             metadata = metadata || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [
          JSON.stringify({
            moderationAction: action,
            moderationCaseId: row.id,
          }),
          row.content_id,
        ]
      );
    }

    if (action === 'restore_content') {
      await query(
        `UPDATE discussion_posts
         SET is_deleted = FALSE,
             metadata = metadata || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [
          JSON.stringify({
            moderationAction: action,
            moderationCaseId: row.id,
          }),
          row.content_id,
        ]
      );
    }
  }

  private async pushRedis(key: string, value: unknown, ttlSeconds = 7 * 24 * 60 * 60) {
    try {
      await redis.rpush(key, JSON.stringify(value));
      await redis.expire(key, ttlSeconds);
    } catch {
      // Redis queues are acceleration layers; PostgreSQL keeps the durable record.
    }
  }
}
