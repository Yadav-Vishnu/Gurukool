export interface DeploymentRelease {
  id: string;
  platform: 'pwa' | 'android' | 'ios' | 'backend';
  releaseVersion: string;
  status: 'planned' | 'building' | 'ready' | 'released' | 'paused';
  rolloutPercent: number;
  buildChannel: string;
  artifactUrl: string | null;
  healthUrl: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface ServiceScaleProfile {
  id: string;
  serviceKey: string;
  displayName: string;
  serviceType: string;
  minReplicas: number;
  maxReplicas: number;
  cpuRequestMillicores: number;
  memoryRequestMb: number;
  targetCpuUtilization: number;
  autoscalingEnabled: boolean;
  status: 'planned' | 'active' | 'paused';
}

export interface InstitutionPartner {
  id: string;
  name: string;
  slug: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  city: string | null;
  country: string;
  status: 'pending' | 'active' | 'suspended';
  allowedEmailDomains: string[];
  seatsPurchased: number;
  seatsUsed: number;
  hostedTestCount: number;
  createdAt: string;
}

export interface HostedTest {
  id: string;
  institutionId: string;
  institutionName: string;
  testId: string;
  testTitle: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  maxParticipants: number;
  enrollmentCount: number;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'archived';
  accessCode: string;
  createdAt: string;
}

export interface ModerationStats {
  openCases: number;
  criticalCases: number;
  casesLast7Days: number;
}

export interface ModerationCase {
  id: string;
  contentType: string;
  contentId: string | null;
  status: 'open' | 'queued' | 'in_review' | 'actioned' | 'dismissed' | 'escalated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  classifierLabel: string;
  contentExcerpt: string;
  reasons: string[];
  aiRecommendation:
    | 'none'
    | 'hide_content'
    | 'delete_content'
    | 'warn_user'
    | 'suspend_user'
    | 'restore_content';
  humanDecision: string | null;
  createdAt: string;
}

export interface PlatformDashboard {
  deployments: DeploymentRelease[];
  scaleProfiles: ServiceScaleProfile[];
  institutions: InstitutionPartner[];
  hostedTests: HostedTest[];
  moderationStats: ModerationStats;
  moderationQueue: ModerationCase[];
  releaseChecklist: string[];
}
