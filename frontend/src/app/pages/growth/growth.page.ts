import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { PlatformService } from '../../core/services/platform.service';
import {
  DeploymentRelease,
  InstitutionPartner,
  ModerationCase,
  PlatformDashboard,
} from '../../core/models/platform.models';

type InstitutionForm = {
  name: string;
  contactName: string;
  contactEmail: string;
  city: string;
  seatsPurchased: number;
};

type ReportForm = {
  content: string;
  reason: string;
};

@Component({
  selector: 'app-growth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>Growth</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="outline" (click)="loadDashboard()" [disabled]="loading()">
            {{ loading() ? 'Refreshing...' : 'Refresh' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack growth-shell">
        <section class="hero-panel stack">
          <span class="section-kicker">Phase 7 - Scalability & Market Growth</span>
          <h1>Prepare Gurukool for app stores, Kubernetes, institutions, and safe communities.</h1>
          <p class="muted-copy">
            This page is the launch control room: cross-platform release status, autoscaling
            profiles, coaching-center hosting, and AI-assisted moderation queues.
          </p>
        </section>

        <ion-note color="success" *ngIf="successMessage()">{{ successMessage() }}</ion-note>
        <ion-note color="danger" *ngIf="errorMessage()">{{ errorMessage() }}</ion-note>

        <section class="metric-grid" *ngIf="dashboard() as dash">
          <article>
            <span>Platforms</span>
            <strong>{{ dash.deployments.length }}</strong>
          </article>
          <article>
            <span>Institutions</span>
            <strong>{{ dash.institutions.length }}</strong>
          </article>
          <article>
            <span>Moderation queue</span>
            <strong>{{ dash.moderationStats.openCases }}</strong>
          </article>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Cross-Platform Deployment</h2>
              <p class="muted-copy">PWA, Android, iOS, and backend release readiness.</p>
            </div>
          </div>

          <div class="deployment-grid">
            <article class="deployment-card" *ngFor="let release of deployments()">
              <div class="card-topline">
                <strong>{{ platformLabel(release) }}</strong>
                <ion-badge [color]="deploymentColor(release.status)">
                  {{ release.status }}
                </ion-badge>
              </div>
              <span>Version {{ release.releaseVersion }} - {{ release.buildChannel }}</span>
              <div class="rollout-track">
                <div [style.width.%]="release.rolloutPercent"></div>
              </div>
              <small>{{ release.rolloutPercent }}% rollout</small>
              <p>{{ release.notes }}</p>
            </article>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Microservice Scaling</h2>
              <p class="muted-copy">Kubernetes replica targets and resource requests.</p>
            </div>
          </div>

          <article class="scale-row" *ngFor="let profile of dashboard()?.scaleProfiles">
            <div>
              <strong>{{ profile.displayName }}</strong>
              <span>{{ profile.serviceType }} - {{ profile.status }}</span>
            </div>
            <div class="scale-numbers">
              <span>{{ profile.minReplicas }}-{{ profile.maxReplicas }} pods</span>
              <span>{{ profile.cpuRequestMillicores }}m CPU</span>
              <span>{{ profile.memoryRequestMb }}MB RAM</span>
            </div>
          </article>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Institution Partnerships</h2>
              <p class="muted-copy">Coaching centers can request partner access and host tests.</p>
            </div>
          </div>

          <div class="institution-grid">
            <article class="institution-card" *ngFor="let institution of institutions()">
              <div class="card-topline">
                <strong>{{ institution.name }}</strong>
                <ion-badge [color]="institution.status === 'active' ? 'success' : 'warning'">
                  {{ institution.status }}
                </ion-badge>
              </div>
              <span>{{ institution.city || 'Remote' }}, {{ institution.country }}</span>
              <p>
                {{ institution.hostedTestCount }} hosted test(s),
                {{ institution.seatsUsed }}/{{ institution.seatsPurchased || 'unlimited' }} seats used.
              </p>
              <ion-button size="small" fill="outline" (click)="requestHostedTest(institution)">
                Request Demo Hosted Test
              </ion-button>
            </article>
          </div>

          <div class="partner-form">
            <h3>Request coaching-center onboarding</h3>
            <ion-item lines="none">
              <ion-label position="stacked">Institution name</ion-label>
              <ion-input
                [ngModel]="institutionForm().name"
                (ngModelChange)="patchInstitution('name', $event)">
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Contact name</ion-label>
              <ion-input
                [ngModel]="institutionForm().contactName"
                (ngModelChange)="patchInstitution('contactName', $event)">
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Contact email</ion-label>
              <ion-input
                type="email"
                [ngModel]="institutionForm().contactEmail"
                (ngModelChange)="patchInstitution('contactEmail', $event)">
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">City</ion-label>
              <ion-input
                [ngModel]="institutionForm().city"
                (ngModelChange)="patchInstitution('city', $event)">
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Seats needed</ion-label>
              <ion-input
                type="number"
                min="0"
                [ngModel]="institutionForm().seatsPurchased"
                (ngModelChange)="patchInstitution('seatsPurchased', $event)">
              </ion-input>
            </ion-item>
            <ion-button expand="block" color="secondary" (click)="createInstitution()">
              Submit Partner Request
            </ion-button>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Hosted Tests</h2>
              <p class="muted-copy">Institution-specific test events and access codes.</p>
            </div>
          </div>

          <article class="host-row" *ngFor="let host of dashboard()?.hostedTests">
            <div>
              <strong>{{ host.title }}</strong>
              <span>{{ host.institutionName }} - {{ host.status }}</span>
            </div>
            <ion-badge color="tertiary">{{ host.accessCode }}</ion-badge>
          </article>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Community Moderation</h2>
              <p class="muted-copy">Rule-based AI triage plus human moderator review.</p>
            </div>
          </div>

          <div class="moderation-stats" *ngIf="dashboard()?.moderationStats as stats">
            <article>
              <span>Open</span>
              <strong>{{ stats.openCases }}</strong>
            </article>
            <article>
              <span>Critical</span>
              <strong>{{ stats.criticalCases }}</strong>
            </article>
            <article>
              <span>7 days</span>
              <strong>{{ stats.casesLast7Days }}</strong>
            </article>
          </div>

          <div class="report-form">
            <h3>Try a moderation report</h3>
            <ion-item lines="none">
              <ion-label position="stacked">Content to report</ion-label>
              <ion-textarea
                autoGrow="true"
                [ngModel]="reportForm().content"
                (ngModelChange)="patchReport('content', $event)">
              </ion-textarea>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Reason</ion-label>
              <ion-input
                [ngModel]="reportForm().reason"
                (ngModelChange)="patchReport('reason', $event)">
              </ion-input>
            </ion-item>
            <ion-button expand="block" fill="outline" (click)="reportContent()">
              Queue Report
            </ion-button>
          </div>

          <div class="queue-list" *ngIf="moderationQueue().length; else noQueue">
            <article class="moderation-case" *ngFor="let item of moderationQueue()">
              <div class="card-topline">
                <strong>{{ item.classifierLabel }} - {{ item.severity }}</strong>
                <ion-badge [color]="item.severity === 'critical' ? 'danger' : 'warning'">
                  {{ item.status }}
                </ion-badge>
              </div>
              <p>{{ item.contentExcerpt }}</p>
              <small>AI recommends: {{ item.aiRecommendation }} - risk {{ item.riskScore }}</small>
              <div class="case-actions">
                <ion-button size="small" color="danger" (click)="reviewCase(item, 'hide_content')">
                  Hide
                </ion-button>
                <ion-button size="small" fill="outline" (click)="reviewCase(item, 'dismissed')">
                  Dismiss
                </ion-button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </ion-content>

    <ng-template #noQueue>
      <p class="muted-copy">
        No visible queue items. Student accounts can still submit reports; admin/moderator accounts
        see the review list here.
      </p>
    </ng-template>
  `,
  styles: [`
    .growth-shell {
      padding-top: 88px;
    }

    .hero-panel {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(10, 40, 48, 0.12);
      border-radius: 28px;
      padding: 24px;
      background:
        radial-gradient(circle at 15% 20%, rgba(247, 181, 56, 0.28), transparent 30%),
        radial-gradient(circle at 85% 5%, rgba(29, 92, 99, 0.22), transparent 34%),
        linear-gradient(135deg, rgba(255, 253, 248, 0.98), rgba(224, 242, 238, 0.9));
      box-shadow: 0 22px 70px rgba(10, 40, 48, 0.12);
    }

    h1 {
      margin: 8px 0;
      max-width: 880px;
      font-size: clamp(2rem, 5vw, 3.3rem);
      line-height: 0.98;
      letter-spacing: -0.05em;
      color: #102c33;
    }

    h2,
    h3 {
      margin: 0;
      color: #102c33;
    }

    h2 {
      font-size: 1.18rem;
    }

    h3 {
      font-size: 1rem;
    }

    .section-header,
    .card-topline {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      justify-content: space-between;
    }

    .metric-grid,
    .deployment-grid,
    .institution-grid,
    .moderation-stats,
    .partner-form,
    .report-form,
    .queue-list {
      display: grid;
      gap: 12px;
    }

    .metric-grid article,
    .deployment-card,
    .scale-row,
    .institution-card,
    .host-row,
    .moderation-stats article,
    .moderation-case {
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      background: rgba(248, 250, 255, 0.78);
      padding: 14px;
    }

    .metric-grid span,
    .deployment-card span,
    .scale-row span,
    .institution-card span,
    .host-row span,
    .moderation-stats span {
      display: block;
      color: var(--gk-muted);
      font-size: 0.86rem;
    }

    .metric-grid strong,
    .moderation-stats strong {
      display: block;
      margin-top: 4px;
      color: #102c33;
      font-size: 1.45rem;
    }

    .deployment-card,
    .institution-card,
    .moderation-case {
      display: grid;
      gap: 10px;
    }

    .deployment-card p,
    .institution-card p,
    .moderation-case p {
      margin: 0;
      color: #243f45;
      line-height: 1.55;
    }

    .rollout-track {
      height: 9px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(16, 44, 51, 0.1);
    }

    .rollout-track div {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #1d5c63, #f7b538);
    }

    .scale-row,
    .host-row {
      display: grid;
      gap: 12px;
    }

    .scale-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .scale-numbers span {
      border-radius: 999px;
      background: rgba(29, 92, 99, 0.1);
      padding: 6px 10px;
      color: #1d5c63;
      font-weight: 700;
    }

    ion-item {
      --background: rgba(255, 255, 255, 0.74);
      --border-radius: 14px;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
    }

    .case-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    @media (min-width: 768px) {
      .metric-grid,
      .deployment-grid,
      .institution-grid,
      .moderation-stats {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .partner-form {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .partner-form h3,
      .partner-form ion-button {
        grid-column: 1 / -1;
      }

      .scale-row,
      .host-row {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
      }
    }
  `],
})
export class GrowthPage implements OnInit {
  private readonly platformService = inject(PlatformService);
  private readonly authService = inject(AuthService);

  readonly dashboard = signal<PlatformDashboard | null>(null);
  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly institutionForm = signal<InstitutionForm>({
    name: '',
    contactName: '',
    contactEmail: '',
    city: '',
    seatsPurchased: 100,
  });

  readonly reportForm = signal<ReportForm>({
    content: '',
    reason: 'Community safety',
  });

  readonly deployments = computed(() => this.dashboard()?.deployments ?? []);
  readonly institutions = computed(() => this.dashboard()?.institutions ?? []);
  readonly moderationQueue = computed(() => this.dashboard()?.moderationQueue ?? []);

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.dashboard.set(await this.platformService.getDashboard());
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'Growth dashboard could not be loaded.')
      );
    } finally {
      this.loading.set(false);
    }
  }

  patchInstitution(field: keyof InstitutionForm, value: unknown): void {
    const textValue = this.toText(value);
    this.institutionForm.update((current) => ({
      ...current,
      [field]: field === 'seatsPurchased' ? this.toNumber(value) : textValue,
    }));
  }

  patchReport(field: keyof ReportForm, value: unknown): void {
    this.reportForm.update((current) => ({
      ...current,
      [field]: this.toText(value),
    }));
  }

  async createInstitution(): Promise<void> {
    const form = this.institutionForm();
    if (!form.name || !form.contactName || !form.contactEmail) {
      this.errorMessage.set('Institution name, contact name, and email are required.');
      return;
    }

    try {
      await this.platformService.createInstitution({
        ...form,
        country: 'India',
        allowedEmailDomains: [],
      });
      this.successMessage.set('Partner request created. The institution is queued for onboarding.');
      this.institutionForm.set({
        name: '',
        contactName: '',
        contactEmail: '',
        city: '',
        seatsPurchased: 100,
      });
      await this.loadDashboard();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Partner request failed.'));
    }
  }

  async requestHostedTest(institution: InstitutionPartner): Promise<void> {
    try {
      await this.platformService.requestHostedTest(institution.id);
      this.successMessage.set(`Hosted test request queued for ${institution.name}.`);
      await this.loadDashboard();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Hosted test request failed.'));
    }
  }

  async reportContent(): Promise<void> {
    const form = this.reportForm();
    if (!form.content || !form.reason) {
      this.errorMessage.set('Add the content and reason before reporting.');
      return;
    }

    try {
      await this.platformService.reportContent({
        contentType: 'manual_report',
        content: form.content,
        reason: form.reason,
      });
      this.successMessage.set('Report queued for moderation.');
      this.reportForm.set({
        content: '',
        reason: 'Community safety',
      });
      await this.loadDashboard();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Report could not be queued.'));
    }
  }

  async reviewCase(item: ModerationCase, action: 'hide_content' | 'dismissed'): Promise<void> {
    try {
      await this.platformService.reviewModerationCase(item.id, action);
      this.successMessage.set(action === 'dismissed' ? 'Case dismissed.' : 'Content action applied.');
      await this.loadDashboard();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Moderation review failed.'));
    }
  }

  platformLabel(release: DeploymentRelease): string {
    const labels: Record<DeploymentRelease['platform'], string> = {
      pwa: 'PWA',
      android: 'Android',
      ios: 'iOS',
      backend: 'Backend',
    };

    return labels[release.platform];
  }

  deploymentColor(status: DeploymentRelease['status']): string {
    if (status === 'released') {
      return 'success';
    }

    if (status === 'ready' || status === 'building') {
      return 'warning';
    }

    return 'medium';
  }

  private toText(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private toNumber(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }
}
