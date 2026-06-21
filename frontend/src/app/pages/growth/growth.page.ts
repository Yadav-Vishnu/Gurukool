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
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

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
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack growth-shell">
        
        <!-- Hero Panel -->
        <section class="hero-panel stack">
          <div class="section-header-hero">
            <div>
              <span class="section-kicker">Enterprise & Scaling Infrastructure</span>
              <h1>Institutional Onboarding & Performance Control Center</h1>
            </div>
            <ion-button fill="outline" color="primary" size="small" (click)="loadDashboard()" [disabled]="loading()">
              <ion-icon src="assets/svg/sync-outline.svg" slot="start"></ion-icon>
              {{ loading() ? 'Refreshing...' : 'Refresh Hub' }}
            </ion-button>
          </div>
          <p class="muted-copy">
            Monitor institutional partnership onboarding, Kubernetes microservice replica targets, active release deployment pipelines, and community content moderation stats in real-time.
          </p>
        </section>

        <!-- System Alerts -->
        <div class="alert-bar success-alert" *ngIf="successMessage()">
          <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ successMessage() }}</span>
        </div>
        <div class="alert-bar error-alert" *ngIf="errorMessage()">
          <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Infrastructure HUD Stats -->
        <section class="metric-hud-grid" *ngIf="dashboard() as dash">
          <div class="hud-card">
            <span>Cluster Platforms</span>
            <strong>{{ dash.deployments.length }} Active Channels</strong>
            <small>iOS, Android, PWA, Backend</small>
          </div>
          <div class="hud-card">
            <span>Onboarded Partners</span>
            <strong>{{ dash.institutions.length }} Coaching Centers</strong>
            <small>Active sync configurations</small>
          </div>
          <div class="hud-card">
            <span>Moderation Backlog</span>
            <strong>{{ dash.moderationStats.openCases }} Cases Open</strong>
            <small>AI Toxicity Queue checks</small>
          </div>
        </section>

        <!-- Main Dashboard Split Layout -->
        <div class="growth-dashboard-grid">
          
          <!-- LEFT SIDE: Deployment & Service Scaling -->
          <div class="grid-column-left stack">
            
            <!-- Cross-Platform Deployment Card -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">CI/CD Release Pipelines</span>
                  <h2>Cross-Platform Rollouts</h2>
                </div>
              </div>

              <div class="deployment-grid-list">
                <div class="deployment-card-item stack" *ngFor="let release of deployments()">
                  <div class="card-topline">
                    <strong class="platform-name">{{ platformLabel(release) }}</strong>
                    <span class="status-badge" [class.released]="release.status === 'released'" [class.building]="release.status === 'building'">
                      {{ release.status }}
                    </span>
                  </div>
                  <span class="version-label">Version {{ release.releaseVersion }} · Channel: {{ release.buildChannel }}</span>
                  
                  <div class="rollout-progress-container">
                    <div class="rollout-track">
                      <div class="rollout-bar" [style.width.%]="release.rolloutPercent"></div>
                    </div>
                    <small class="rollout-pct">{{ release.rolloutPercent }}% rollout completed</small>
                  </div>
                  
                  <p class="release-notes-text">📌 {{ release.notes }}</p>
                </div>
              </div>
            </section>

            <!-- Microservice Kubernetes Scaling -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Cluster Provisioning</span>
                  <h2>Kubernetes Microservice Scaling</h2>
                </div>
              </div>

              <div class="scaling-list stack">
                <div class="scale-row-item" *ngFor="let profile of dashboard()?.scaleProfiles">
                  <div class="service-meta">
                    <strong>{{ profile.displayName }}</strong>
                    <span class="service-type-badge">{{ profile.serviceType }} · {{ profile.status }}</span>
                  </div>
                  <div class="scale-allocations">
                    <span class="alloc-pill pod-count">📁 {{ profile.minReplicas }} - {{ profile.maxReplicas }} Pods</span>
                    <span class="alloc-pill cpu-count">⚡ {{ profile.cpuRequestMillicores }}m CPU</span>
                    <span class="alloc-pill ram-count">💾 {{ profile.memoryRequestMb }}MB RAM</span>
                  </div>
                </div>
              </div>
            </section>

          </div>

          <!-- RIGHT SIDE: Partnerships, Moderation Cases & Hosted Tests -->
          <div class="grid-column-right stack">

            <!-- Partnerships Card -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Institutional Seats</span>
                  <h2>Coaching Partnerships</h2>
                </div>
              </div>

              <!-- Partner Coaching list -->
              <div class="institution-list-container stack">
                <div class="institution-card-item stack" *ngFor="let institution of institutions()">
                  <div class="card-topline">
                    <strong>{{ institution.name }}</strong>
                    <span class="partner-status-tag" [class.active]="institution.status === 'active'">
                      {{ institution.status }}
                    </span>
                  </div>
                  <span class="location-label">📌 {{ institution.city || 'Remote' }}, {{ institution.country }}</span>
                  
                  <!-- Seat Allocation Progress Bar -->
                  <div class="seat-allocation-progress">
                    <div class="seat-bar-track">
                      <div class="seat-bar-fill" [style.width.%]="(institution.seatsUsed / (institution.seatsPurchased || 100)) * 100"></div>
                    </div>
                    <div class="seat-stats-labels">
                      <span>Seats Allocated</span>
                      <strong>{{ institution.seatsUsed }} / {{ institution.seatsPurchased || 'unlimited' }} Seats</strong>
                    </div>
                  </div>

                  <ion-button size="small" fill="outline" color="secondary" (click)="requestHostedTest(institution)">
                    Launch Demo Hosted Exam
                  </ion-button>
                </div>
              </div>

              <!-- Partner Onboarding Form -->
              <div class="partner-form-wrapper stack">
                <h3>Request Coaching Onboarding</h3>
                
                <div class="custom-input-group">
                  <label class="input-label">Institution Name</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-input
                      [ngModel]="institutionForm().name"
                      (ngModelChange)="patchInstitution('name', $event)"
                      placeholder="e.g. Ace GATE Academy">
                    </ion-input>
                  </ion-item>
                </div>

                <div class="custom-input-group">
                  <label class="input-label">Contact Person Name</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-input
                      [ngModel]="institutionForm().contactName"
                      (ngModelChange)="patchInstitution('contactName', $event)"
                      placeholder="e.g. Prof. Anand Rao">
                    </ion-input>
                  </ion-item>
                </div>

                <div class="custom-input-group">
                  <label class="input-label">Contact Email Address</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-input
                      type="email"
                      [ngModel]="institutionForm().contactEmail"
                      (ngModelChange)="patchInstitution('contactEmail', $event)"
                      placeholder="e.g. contact@acegate.org">
                    </ion-input>
                  </ion-item>
                </div>

                <div class="input-grid-2">
                  <div class="custom-input-group">
                    <label class="input-label">City</label>
                    <ion-item lines="none" class="custom-field">
                      <ion-input
                        [ngModel]="institutionForm().city"
                        (ngModelChange)="patchInstitution('city', $event)"
                        placeholder="Hyderabad">
                      </ion-input>
                    </ion-item>
                  </div>
                  <div class="custom-input-group">
                    <label class="input-label">Initial Seats</label>
                    <ion-item lines="none" class="custom-field">
                      <ion-input
                        type="number"
                        min="1"
                        [ngModel]="institutionForm().seatsPurchased"
                        (ngModelChange)="patchInstitution('seatsPurchased', $event)">
                      </ion-input>
                    </ion-item>
                  </div>
                </div>

                <ion-button expand="block" color="secondary" (click)="createInstitution()">
                  Submit Partnership Request
                </ion-button>
              </div>
            </section>

            <!-- Hosted Tests List -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Access Codes</span>
                  <h2>Hosted Exam Keys</h2>
                </div>
              </div>

              <div class="hosted-tests-list stack">
                <div class="hosted-test-row" *ngFor="let host of dashboard()?.hostedTests">
                  <div class="hosted-info">
                    <strong>{{ host.title }}</strong>
                    <span>Partner: {{ host.institutionName }} · Status: {{ host.status }}</span>
                  </div>
                  <span class="access-key-tag">{{ host.accessCode }}</span>
                </div>
              </div>
            </section>

            <!-- Community Content Moderation Dashboard -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Safe Learning Environment</span>
                  <h2>AI Community Moderation</h2>
                </div>
              </div>

              <!-- Moderation metrics -->
              <div class="moderation-metrics-grid" *ngIf="dashboard()?.moderationStats as stats">
                <div class="mod-pill critical">
                  <span>Critical Cases</span>
                  <strong>{{ stats.criticalCases }}</strong>
                </div>
                <div class="mod-pill active-mod">
                  <span>Last 7 Days</span>
                  <strong>{{ stats.casesLast7Days }}</strong>
                </div>
              </div>

              <!-- Try Moderation Form -->
              <div class="moderation-report-form stack">
                <h3>Submit Content Safety Report</h3>
                <div class="custom-input-group">
                  <label class="input-label">reported content excerpt</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-textarea
                      autoGrow="true"
                      rows="2"
                      [ngModel]="reportForm().content"
                      (ngModelChange)="patchReport('content', $event)"
                      placeholder="Paste abusive or non-relevant comment text here...">
                    </ion-textarea>
                  </ion-item>
                </div>
                <div class="custom-input-group">
                  <label class="input-label">Report Reason Category</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-input
                      [ngModel]="reportForm().reason"
                      (ngModelChange)="patchReport('reason', $event)">
                    </ion-input>
                  </ion-item>
                </div>
                <ion-button expand="block" fill="outline" color="secondary" (click)="reportContent()">
                  File Community Report
                </ion-button>
              </div>

              <!-- Moderation Queue -->
              <div class="moderation-queue-list stack">
                <h3>Active Moderation Queue</h3>
                <div class="moderation-cases-wrapper" *ngIf="moderationQueue().length; else noQueue">
                  <div class="moderation-case-card stack" *ngFor="let item of moderationQueue()">
                    <div class="card-topline">
                      <strong>{{ item.classifierLabel }}</strong>
                      <span class="severity-badge" [class.critical-sev]="item.severity === 'critical'">
                        {{ item.severity }}
                      </span>
                    </div>
                    <p class="excerpt-box">"{{ item.contentExcerpt }}"</p>
                    <div class="ai-verdict">
                      <span>AI Recommendation: <strong>{{ item.aiRecommendation }}</strong></span>
                      <span>Risk Score: <strong>{{ item.riskScore }}</strong></span>
                    </div>

                    <div class="moderator-actions-group">
                      <ion-button size="small" color="danger" (click)="reviewCase(item, 'hide_content')">
                        Apply Ban / Hide
                      </ion-button>
                      <ion-button size="small" fill="outline" color="medium" (click)="reviewCase(item, 'dismissed')">
                        Dismiss Case
                      </ion-button>
                    </div>
                  </div>
                </div>
                <ng-template #noQueue>
                  <p class="empty-state-text">No active content blocks in review queue. Community is safe.</p>
                </ng-template>
              </div>
            </section>

          </div>

        </div>

      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styleUrls: ['./growth.page.scss'],
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
