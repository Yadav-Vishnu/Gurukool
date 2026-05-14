import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { TestEngineService } from '../../core/services/test-engine.service';
import { AttemptAnalytics } from '../../core/models/test-engine.models';

@Component({
  selector: 'app-test-analytics-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>Test Analytics</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="outline" routerLink="/tests">Back to catalog</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack analytics-shell" *ngIf="analytics() as report">
        <section class="glass-card hero-card">
          <span class="section-kicker">Submission Complete</span>
          <h1>{{ report.test.title }}</h1>
          <p class="muted-copy">
            Score {{ report.summary.score }} out of {{ report.summary.totalMarks }} with
            {{ report.summary.accuracy }}% accuracy.
          </p>
          <p class="muted-copy small-copy">
            Track: {{ report.test.examCode }}
            <span *ngIf="report.test.companyName"> · {{ report.test.companyName }}</span>
            <span *ngIf="report.test.paperCode"> · {{ report.test.paperCode }}</span>
            <span *ngIf="report.test.examYear"> · {{ report.test.examYear }}</span>
          </p>
        </section>

        <div class="summary-grid">
          <div class="glass-card summary-tile">
            <span>Correct</span>
            <strong>{{ report.summary.correctCount }}</strong>
          </div>
          <div class="glass-card summary-tile">
            <span>Incorrect</span>
            <strong>{{ report.summary.incorrectCount }}</strong>
          </div>
          <div class="glass-card summary-tile">
            <span>Unanswered</span>
            <strong>{{ report.summary.unansweredCount }}</strong>
          </div>
          <div class="glass-card summary-tile">
            <span>Avg time</span>
            <strong>{{ formatDuration(report.summary.averageTimePerQuestion) }}</strong>
          </div>
        </div>

        <ion-note color="danger" *ngIf="errorMessage()">{{ errorMessage() }}</ion-note>

        <section class="layout-grid">
          <ion-card class="glass-card">
            <ion-card-header>
              <ion-card-title>Weak Areas</ion-card-title>
              <ion-card-subtitle>
                Lower accuracy and higher time per question are revision opportunities.
              </ion-card-subtitle>
            </ion-card-header>
            <ion-card-content class="stack">
              <div class="metric-card" *ngFor="let area of report.weakAreas.slice(0, 5)">
                <strong>{{ area.subjectName }} · {{ area.topicName }}</strong>
                <span>{{ area.accuracy }}% accuracy · {{ area.incorrectCount }} wrong</span>
                <span>{{ formatDuration(area.averageTimeSeconds) }} average time</span>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card">
            <ion-card-header>
              <ion-card-title>Exam-wise Performance</ion-card-title>
            </ion-card-header>
            <ion-card-content class="stack">
              <div class="metric-card" *ngFor="let item of report.examWisePerformance">
                <strong>{{ item.examCode }}</strong>
                <span>{{ item.accuracy }}% accuracy · {{ item.correctCount }}/{{ item.attempted }} correct</span>
                <span>{{ formatDuration(item.averageTimeSeconds) }} average time</span>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card">
            <ion-card-header>
              <ion-card-title>Company-wise Performance</ion-card-title>
            </ion-card-header>
            <ion-card-content class="stack">
              <div class="metric-card" *ngFor="let item of report.companyWisePerformance.slice(0, 6)">
                <strong>{{ item.examCode }} · {{ item.companyName }}</strong>
                <span>{{ item.accuracy }}% accuracy · {{ item.incorrectCount }} incorrect</span>
                <span>{{ formatDuration(item.averageTimeSeconds) }} average time</span>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card">
            <ion-card-header>
              <ion-card-title>Paper-wise Performance</ion-card-title>
            </ion-card-header>
            <ion-card-content class="stack">
              <div class="metric-card" *ngFor="let item of report.paperWisePerformance.slice(0, 8)">
                <strong>
                  {{ item.examCode }} · {{ item.paperCode }}
                  <span *ngIf="item.examYear"> ({{ item.examYear }})</span>
                </strong>
                <span>{{ item.companyName }} · {{ item.accuracy }}% accuracy</span>
                <span>{{ item.correctCount }}/{{ item.attempted }} correct</span>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card">
            <ion-card-header>
              <ion-card-title>Wrong Answers & Notes</ion-card-title>
              <ion-card-subtitle>
                Review explanations and your own note before retrying.
              </ion-card-subtitle>
            </ion-card-header>
            <ion-card-content class="stack">
              <div class="review-card" *ngFor="let item of wrongQuestions().slice(0, 10)">
                <strong>
                  Q{{ item.position }} · {{ item.examCode }}
                  <span *ngIf="item.companyName"> · {{ item.companyName }}</span>
                  <span *ngIf="item.paperCode"> · {{ item.paperCode }}</span>
                  <span *ngIf="item.examYear"> · {{ item.examYear }}</span>
                </strong>
                <p>{{ item.prompt }}</p>
                <div class="answer-line">
                  Your answer:
                  <strong>{{ item.selectedOption || 'Unanswered' }}</strong>
                </div>
                <div class="answer-line">
                  Correct answer:
                  <strong>{{ item.correctOption }}</strong>
                </div>
                <div class="answer-line" *ngIf="item.wrongTag">
                  Tag:
                  <strong>{{ item.wrongTag }}</strong>
                </div>
                <div class="answer-line" *ngIf="item.note">
                  Note:
                  <strong>{{ item.note }}</strong>
                </div>
                <p class="muted-copy">{{ item.explanation }}</p>
              </div>
            </ion-card-content>
          </ion-card>
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .analytics-shell {
      padding-top: 88px;
    }

    .hero-card {
      margin: 0;
    }

    h1 {
      margin: 12px 0 8px;
      font-size: clamp(2rem, 5vw, 3.2rem);
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
    }

    .small-copy {
      font-size: 0.86rem;
    }

    .summary-grid,
    .layout-grid {
      display: grid;
      gap: 16px;
    }

    .summary-tile {
      padding: 16px;
    }

    .summary-tile span {
      display: block;
      color: var(--gk-muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-size: 0.78rem;
    }

    .summary-tile strong {
      display: block;
      margin-top: 8px;
      font-size: 1.35rem;
      color: var(--ion-color-dark);
    }

    .metric-card,
    .review-card {
      padding: 14px;
      border-radius: 18px;
      border: 1px solid var(--gk-outline);
      background: rgba(248, 250, 255, 0.84);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .review-card p {
      margin: 0;
      line-height: 1.7;
    }

    .answer-line {
      color: var(--gk-muted);
    }

    @media (min-width: 768px) {
      .summary-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    @media (min-width: 1100px) {
      .layout-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `],
})
export class AnalyticsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly testEngineService = inject(TestEngineService);
  private readonly router = inject(Router);

  readonly analytics = signal<AttemptAnalytics | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly wrongQuestions = () =>
    (this.analytics()?.questionReview ?? []).filter((item) => item.isCorrect !== true);

  async ngOnInit(): Promise<void> {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (!attemptId) {
      await this.router.navigateByUrl('/tests', { replaceUrl: true });
      return;
    }

    await this.loadAnalytics(attemptId);
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  private async loadAnalytics(attemptId: string): Promise<void> {
    this.errorMessage.set(null);

    try {
      const analytics = await this.testEngineService.getAnalytics(attemptId);
      this.analytics.set(analytics);
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'The analytics report could not be loaded.')
      );
    }
  }
}
