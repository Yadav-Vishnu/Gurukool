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
              <ion-icon name="sync-outline" slot="start"></ion-icon>
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
                  
                  <p class="release-notes-text">📝 {{ release.notes }}</p>
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
                    <span class="alloc-pill pod-count">📂 {{ profile.minReplicas }} - {{ profile.maxReplicas }} Pods</span>
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
                  <span class="location-label">📍 {{ institution.city || 'Remote' }}, {{ institution.country }}</span>
                  
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
  styles: [`
    .growth-shell {
      padding-top: 24px;
      padding-bottom: 40px;
    }

    .hero-panel {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(10, 40, 48, 0.12);
      border-radius: 28px;
      padding: 32px 24px;
      background:
        radial-gradient(circle at 15% 20%, rgba(247, 181, 56, 0.28), transparent 30%),
        radial-gradient(circle at 85% 5%, rgba(29, 92, 99, 0.22), transparent 34%),
        linear-gradient(135deg, rgba(255, 253, 248, 0.98), rgba(224, 242, 238, 0.9));
      box-shadow: var(--gk-shadow-soft);
      animation: gk-rise 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .section-header-hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    h1 {
      margin: 8px 0 16px;
      max-width: 880px;
      font-size: clamp(2.2rem, 5vw, 3.8rem);
      line-height: 1.05;
      letter-spacing: -0.05em;
      font-weight: 800;
      background: linear-gradient(135deg, #102c33 0%, var(--ion-color-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* System Alert Bars */
    .alert-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 16px;
      font-weight: 600;
      font-size: 0.92rem;
      animation: gk-rise 400ms ease;
    }

    .success-alert {
      background: rgba(47, 159, 111, 0.08);
      border: 1px solid rgba(47, 159, 111, 0.25);
      color: var(--gk-forest);
    }

    .error-alert {
      background: rgba(232, 93, 63, 0.08);
      border: 1px solid rgba(232, 93, 63, 0.25);
      color: var(--gk-saffron);
    }

    .alert-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    /* HUD metrics styling */
    .metric-hud-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 768px) {
      .metric-hud-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .hud-card {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 20px;
      padding: 20px;
      box-shadow: var(--gk-shadow-soft);
      transition: all 200ms ease;
    }

    .hud-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--gk-outline-strong);
    }

    .hud-card span {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--gk-muted);
      display: block;
    }

    .hud-card strong {
      font-size: 1.35rem;
      font-weight: 850;
      color: #102c33;
      display: block;
      margin: 4px 0;
    }

    .hud-card small {
      font-size: 0.76rem;
      color: var(--gk-muted);
    }

    /* Split Dashboard Grid */
    .growth-dashboard-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 1024px) {
      .growth-dashboard-grid {
        grid-template-columns: 1fr 1fr;
        align-items: start;
      }
    }

    /* Panel Card Design */
    .panel-card {
      padding: 24px;
      border: 1px solid var(--gk-outline);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
    }

    .panel-subtitle {
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--gk-muted);
      display: block;
      margin-bottom: 4px;
    }

    .panel-card h2 {
      font-size: 1.35rem;
      font-weight: 850;
      color: #102c33;
      margin: 0;
    }

    .panel-card h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #102c33;
      margin: 0 0 14px 0;
      border-left: 3px solid var(--gk-gold);
      padding-left: 10px;
    }

    /* Form Fields Styling */
    .custom-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--gk-muted);
    }

    .custom-field {
      --background: #ffffff;
      --border-radius: 12px;
      border: 1px solid var(--gk-outline);
      border-radius: 12px;
      transition: all 200ms ease;
    }

    .custom-field:focus-within {
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.12);
    }

    .input-grid-2 {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 600px) {
      .input-grid-2 {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* CI/CD Release Card Items */
    .deployment-grid-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .deployment-card-item {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      padding: 16px;
    }

    .card-topline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .platform-name {
      font-size: 1.05rem;
      font-weight: 800;
      color: #102c33;
    }

    .status-badge {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f0f0f0;
      color: #666;
    }

    .status-badge.released {
      background: rgba(47, 159, 111, 0.1);
      color: var(--gk-forest);
    }

    .status-badge.building {
      background: rgba(247, 181, 56, 0.15);
      color: #b78a10;
    }

    .version-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--gk-muted);
    }

    .rollout-progress-container {
      margin: 8px 0;
    }

    .rollout-track {
      height: 8px;
      background: #e8ecef;
      border-radius: 999px;
      overflow: hidden;
    }

    .rollout-bar {
      height: 100%;
      background: linear-gradient(90deg, #1d5c63 0%, var(--gk-gold) 100%);
      border-radius: inherit;
    }

    .rollout-pct {
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--gk-muted);
      display: block;
      margin-top: 4px;
    }

    .release-notes-text {
      margin: 4px 0 0;
      font-size: 0.88rem;
      color: #243f45;
      line-height: 1.45;
    }

    /* Kubernetes scaling microservice row items */
    .scale-row-item {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 16px;
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      transition: all 200ms ease;
    }

    .scale-row-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--gk-shadow-soft);
      border-color: var(--gk-outline-strong);
    }

    @media (min-width: 600px) {
      .scale-row-item {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .service-meta strong {
      display: block;
      font-size: 0.95rem;
      color: #102c33;
    }

    .service-type-badge {
      font-size: 0.76rem;
      color: var(--gk-muted);
      font-weight: 600;
    }

    .scale-allocations {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .alloc-pill {
      font-size: 0.76rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 99px;
      background: rgba(29, 92, 99, 0.08);
      color: #1d5c63;
    }

    /* Institution partnerships list */
    .institution-list-container {
      max-height: 480px;
      overflow-y: auto;
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      background: rgba(16, 44, 51, 0.01);
      padding: 10px;
    }

    .institution-card-item {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
      padding: 16px;
    }

    .partner-status-tag {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f0f0f0;
      color: #666;
    }

    .partner-status-tag.active {
      background: rgba(47, 159, 111, 0.1);
      color: var(--gk-forest);
    }

    .location-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--gk-muted);
    }

    .seat-allocation-progress {
      margin: 10px 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .seat-bar-track {
      height: 6px;
      background: #e8ecef;
      border-radius: 99px;
      overflow: hidden;
    }

    .seat-bar-fill {
      height: 100%;
      background: #1d5c63;
      border-radius: inherit;
    }

    .seat-stats-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.76rem;
    }

    .seat-stats-labels span {
      color: var(--gk-muted);
    }

    .seat-stats-labels strong {
      color: #102c33;
    }

    .partner-form-wrapper {
      background: rgba(29, 92, 99, 0.02);
      border: 1px solid rgba(29, 92, 99, 0.08);
      border-radius: 16px;
      padding: 20px;
      margin-top: 16px;
    }

    .partner-form-wrapper h3 {
      font-size: 1.05rem;
      font-weight: 800;
      margin: 0 0 14px 0;
      border-left: none;
      padding-left: 0;
    }

    /* Hosted Exam keys list */
    .hosted-tests-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .hosted-test-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
      gap: 12px;
    }

    .hosted-info strong {
      display: block;
      font-size: 0.88rem;
      color: #102c33;
    }

    .hosted-info span {
      display: block;
      font-size: 0.78rem;
      color: var(--gk-muted);
    }

    .access-key-tag {
      font-size: 0.82rem;
      font-weight: 800;
      background: rgba(247, 181, 56, 0.12);
      color: #b78a10;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }

    /* Content Moderation dashboard elements */
    .moderation-metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .mod-pill {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
      padding: 12px 16px;
    }

    .mod-pill span {
      font-size: 0.72rem;
      font-weight: 850;
      text-transform: uppercase;
      color: var(--gk-muted);
      display: block;
    }

    .mod-pill strong {
      font-size: 1.25rem;
      display: block;
      margin-top: 2px;
    }

    .mod-pill.critical {
      border-color: rgba(232, 93, 63, 0.3);
      color: var(--gk-saffron);
    }

    .mod-pill.active-mod {
      border-color: rgba(247, 181, 56, 0.35);
      color: #b78a10;
    }

    .moderation-report-form {
      background: rgba(232, 93, 63, 0.01);
      border: 1px solid rgba(232, 93, 63, 0.08);
      border-radius: 16px;
      padding: 16px;
    }

    .moderation-report-form h3 {
      font-size: 1rem;
      border-left: 3px solid var(--gk-saffron);
      padding-left: 10px;
      margin: 0;
    }

    .moderation-report-form ion-textarea {
      --background: #ffffff;
      --border-radius: 12px;
      border: 1px solid var(--gk-outline);
      border-radius: 12px;
      --padding-start: 12px;
      --padding-top: 10px;
    }

    .moderation-queue-list {
      border-top: 1px dashed var(--gk-outline);
      padding-top: 16px;
    }

    .moderation-cases-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .moderation-case-card {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
      padding: 16px;
    }

    .severity-badge {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(247, 181, 56, 0.1);
      color: #b78a10;
    }

    .severity-badge.critical-sev {
      background: rgba(232, 93, 63, 0.12);
      color: var(--gk-saffron);
    }

    .excerpt-box {
      margin: 8px 0;
      padding: 10px 14px;
      border-radius: 10px;
      background: #f8f9fa;
      border: 1px solid var(--gk-outline);
      font-size: 0.88rem;
      color: #243f45;
      font-style: italic;
    }

    .ai-verdict {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--gk-muted);
      border-bottom: 1px solid var(--gk-outline);
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .moderator-actions-group {
      display: flex;
      gap: 10px;
    }

    .moderator-actions-group ion-button {
      margin: 0;
    }

    .empty-state-text {
      font-size: 0.86rem;
      color: var(--gk-muted);
      text-align: center;
      margin: 0;
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
