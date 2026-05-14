import { query } from '../../config/database';
import { redis } from '../../config/redis';

export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ModerationAction =
  | 'none'
  | 'hide_content'
  | 'delete_content'
  | 'warn_user'
  | 'suspend_user'
  | 'restore_content';

type RuleMatch = {
  label: string;
  severity: ModerationSeverity;
  action: ModerationAction;
  reason: string;
};

export type ModerationAnalysis = {
  riskScore: number;
  severity: ModerationSeverity;
  label: string;
  reasons: string[];
  recommendedAction: ModerationAction;
};

type CreateCaseInput = {
  contentType: string;
  contentId?: string | null;
  submittedByUserId?: string | null;
  reportedByUserId?: string | null;
  contentExcerpt: string;
  analysis: ModerationAnalysis;
  source: 'auto_scan' | 'user_report';
};

const RULES: RuleMatch[] = [
  {
    label: 'exam_integrity',
    severity: 'critical',
    action: 'hide_content',
    reason: 'Possible request for leaked paper or answer key.',
  },
  {
    label: 'harassment',
    severity: 'high',
    action: 'hide_content',
    reason: 'Possible abusive or harassing language.',
  },
  {
    label: 'privacy',
    severity: 'medium',
    action: 'warn_user',
    reason: 'Possible private contact sharing.',
  },
  {
    label: 'spam',
    severity: 'medium',
    action: 'hide_content',
    reason: 'Possible commercial spam or promotional content.',
  },
];

const severityWeight: Record<ModerationSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const severityScore: Record<ModerationSeverity, number> = {
  low: 0.05,
  medium: 0.58,
  high: 0.78,
  critical: 0.94,
};

const patterns: Record<string, RegExp> = {
  exam_integrity: /leaked paper|paper leak|answer key leak|send paper/i,
  harassment: /idiot|moron|stupid|shut up|abuse/i,
  privacy: /whatsapp|telegram|phone number|call me at|gmail\.com/i,
  spam: /buy now|discount code|promo code|earn money|guaranteed rank/i,
};

const clip = (value: string, maxLength = 1000): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
};

export class ContentModerationService {
  analyzeText(content: string): ModerationAnalysis {
    const text = content.trim();
    if (!text) {
      return {
        riskScore: 0,
        severity: 'low',
        label: 'empty',
        reasons: ['Empty content.'],
        recommendedAction: 'none',
      };
    }

    const matches = RULES.filter((rule) => patterns[rule.label]?.test(text));
    if (matches.length === 0) {
      return {
        riskScore: 0.05,
        severity: 'low',
        label: 'clean',
        reasons: ['No moderation rule matched.'],
        recommendedAction: 'none',
      };
    }

    const strongest = matches.reduce((highest, current) =>
      severityWeight[current.severity] > severityWeight[highest.severity] ? current : highest
    );
    const riskScore = Math.min(
      0.98,
      severityScore[strongest.severity] + Math.max(0, matches.length - 1) * 0.06
    );

    return {
      riskScore: Number(riskScore.toFixed(2)),
      severity: strongest.severity,
      label: strongest.label,
      reasons: matches.map((match) => match.reason),
      recommendedAction: strongest.action,
    };
  }

  async autoReviewContent(input: {
    submittedByUserId: string;
    contentType: string;
    contentId: string;
    contentExcerpt: string;
    source: string;
  }): Promise<ModerationAnalysis> {
    const analysis = this.analyzeText(input.contentExcerpt);
    if (analysis.riskScore < 0.55) {
      return analysis;
    }

    try {
      await this.createCase({
        contentType: input.contentType,
        contentId: input.contentId,
        submittedByUserId: input.submittedByUserId,
        contentExcerpt: input.contentExcerpt,
        analysis,
        source: 'auto_scan',
      });
    } catch {
      // Moderation should not block the learning flow if the review queue is temporarily unavailable.
    }

    return analysis;
  }

  async reportContent(input: {
    reporterUserId: string;
    contentType: string;
    contentId?: string;
    content: string;
    reason: string;
    details?: string;
  }) {
    const analysis = this.analyzeText(input.content);
    const adjustedAnalysis: ModerationAnalysis = {
      ...analysis,
      riskScore: Math.max(analysis.riskScore, 0.62),
      severity: analysis.severity === 'low' ? 'medium' : analysis.severity,
      reasons: [...analysis.reasons, `User report: ${input.reason}`],
      recommendedAction:
        analysis.recommendedAction === 'none' ? 'warn_user' : analysis.recommendedAction,
    };

    const moderationCase = await this.createCase({
      contentType: input.contentType,
      contentId: input.contentId ?? null,
      reportedByUserId: input.reporterUserId,
      contentExcerpt: input.content,
      analysis: adjustedAnalysis,
      source: 'user_report',
    });

    await query(
      `INSERT INTO content_reports (
         case_id,
         reporter_user_id,
         reason,
         details
       )
       VALUES ($1, $2, $3, $4)`,
      [moderationCase.id, input.reporterUserId, input.reason, input.details ?? null]
    );

    return moderationCase;
  }

  private async createCase(input: CreateCaseInput) {
    const status = input.analysis.severity === 'critical' ? 'escalated' : 'queued';
    const inserted = await query(
      `INSERT INTO content_moderation_cases (
         content_type,
         content_id,
         submitted_by_user_id,
         reported_by_user_id,
         status,
         severity,
         risk_score,
         classifier_label,
         content_excerpt,
         reasons,
         ai_recommendation,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5::moderation_case_status, $6::moderation_severity,
               $7, $8, $9, $10::jsonb, $11::moderation_action_type, $12::jsonb)
       RETURNING *`,
      [
        input.contentType,
        input.contentId ?? null,
        input.submittedByUserId ?? null,
        input.reportedByUserId ?? null,
        status,
        input.analysis.severity,
        input.analysis.riskScore,
        input.analysis.label,
        clip(input.contentExcerpt),
        JSON.stringify(input.analysis.reasons),
        input.analysis.recommendedAction,
        JSON.stringify({
          source: input.source,
          queuedAt: new Date().toISOString(),
        }),
      ]
    );

    await this.pushModerationQueue(inserted.rows[0]);
    return inserted.rows[0];
  }

  private async pushModerationQueue(row: any) {
    try {
      await redis.rpush(
        'moderation:queue',
        JSON.stringify({
          caseId: row.id,
          contentType: row.content_type,
          severity: row.severity,
          riskScore: Number(row.risk_score ?? 0),
          queuedAt: new Date().toISOString(),
        })
      );
      await redis.expire('moderation:queue', 7 * 24 * 60 * 60);
    } catch {
      // PostgreSQL remains the source of truth if Redis is briefly unavailable.
    }
  }
}
