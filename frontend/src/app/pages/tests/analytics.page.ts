import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { TestEngineService } from '../../core/services/test-engine.service';
import { AttemptAnalytics } from '../../core/models/test-engine.models';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-test-analytics-page',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack analytics-shell" *ngIf="analytics() as report">
        
        <!-- Hero Header -->
        <section class="glass-card hero-card stack">
          <span class="section-kicker">Phase 4 - Advanced Analytics</span>
          <h1>Attempt Report Analysis</h1>
          <p class="muted-copy">
            Test: <strong>{{ report.test.title }}</strong>
          </p>
          <p class="muted-copy small-copy">
            Track: {{ report.test.examCode }}
            <span *ngIf="report.test.companyName"> · {{ report.test.companyName }}</span>
            <span *ngIf="report.test.paperCode"> · {{ report.test.paperCode }}</span>
            <span *ngIf="report.test.examYear"> · {{ report.test.examYear }}</span>
          </p>
        </section>

        <ion-note color="danger" *ngIf="errorMessage()">{{ errorMessage() }}</ion-note>

        <!-- Top Charts Grid -->
        <div class="charts-dashboard-grid">
          
          <!-- Circular Accuracy Card -->
          <div class="glass-card chart-card stack">
            <h3>Test Accuracy Gauge</h3>
            <p class="chart-subtitle">Your overall correctness ratio for this attempt</p>
            <div class="radial-gauge-container">
              <svg class="radial-gauge" viewBox="0 0 120 120">
                <circle class="gauge-bg" cx="60" cy="60" r="50"></circle>
                <circle class="gauge-fill" cx="60" cy="60" r="50"
                  [attr.stroke-dashoffset]="getStrokeDashoffset(report.summary.accuracy)"></circle>
              </svg>
              <div class="gauge-label">
                <strong class="gauge-value">{{ report.summary.accuracy }}%</strong>
                <span class="gauge-text">Accuracy</span>
              </div>
            </div>
          </div>

          <!-- Segmented Breakdown Card -->
          <div class="glass-card chart-card stack">
            <h3>Answer Distribution</h3>
            <p class="chart-subtitle">Proportional breakdown of your total answers</p>
            
            <div class="breakdown-chart-wrapper stack" *ngIf="getBreakdownWidths(report.summary.correctCount, report.summary.incorrectCount, report.summary.unansweredCount) as widths">
              <svg class="segmented-bar-svg" viewBox="0 0 100 8" preserveAspectRatio="none">
                <defs>
                  <clipPath id="bar-clip">
                    <rect x="0" y="0" width="100" height="8" rx="4" ry="4"></rect>
                  </clipPath>
                </defs>
                <g clip-path="url(#bar-clip)">
                  <rect class="bar-correct" x="0" y="0" [attr.width]="widths.correctW" height="8"></rect>
                  <rect class="bar-incorrect" [attr.x]="widths.correctW" y="0" [attr.width]="widths.incorrectW" height="8"></rect>
                  <rect class="bar-unanswered" [attr.x]="widths.correctW + widths.incorrectW" y="0" [attr.width]="widths.unansweredW" height="8"></rect>
                </g>
              </svg>
              
              <div class="breakdown-legend">
                <div class="legend-item text-correct">
                  <span class="legend-dot bg-correct"></span>
                  <span>Correct: {{ report.summary.correctCount }}</span>
                </div>
                <div class="legend-item text-incorrect">
                  <span class="legend-dot bg-incorrect"></span>
                  <span>Incorrect: {{ report.summary.incorrectCount }}</span>
                </div>
                <div class="legend-item text-unanswered">
                  <span class="legend-dot bg-unanswered"></span>
                  <span>Unanswered: {{ report.summary.unansweredCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Speed & Score Metrics Card -->
          <div class="glass-card chart-card stack">
            <h3>Performance Scores</h3>
            <p class="chart-subtitle">Key indicators and time tracking details</p>
            <div class="score-metrics-list">
              <div class="metric-row">
                <span class="label">Total Score</span>
                <span class="value">{{ report.summary.score }} / {{ report.summary.totalMarks }}</span>
              </div>
              <div class="metric-row">
                <span class="label">Avg Time per Q</span>
                <span class="value">{{ formatDuration(report.summary.averageTimePerQuestion) }}</span>
              </div>
              <div class="metric-row">
                <span class="label">Total Questions</span>
                <span class="value">{{ report.summary.correctCount + report.summary.incorrectCount + report.summary.unansweredCount }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Middle Columns Layout -->
        <section class="layout-grid">
          
          <!-- Column 1: Weak Areas & Examwise -->
          <div class="stack">
            <div class="glass-card panel-card stack">
              <div class="panel-header">
                <h2>Weak Areas & Focus Topics</h2>
                <p class="panel-subtitle">Review lower accuracy concepts first</p>
              </div>
              <div class="metric-list stack">
                <div class="metric-card" *ngFor="let area of report.weakAreas.slice(0, 5)">
                  <strong>{{ area.subjectName }} · {{ area.topicName }}</strong>
                  <div class="metric-details">
                    <span class="accuracy-pill danger">{{ area.accuracy }}% accuracy</span>
                    <span>{{ area.incorrectCount }} incorrect</span>
                    <span>{{ formatDuration(area.averageTimeSeconds) }} average time</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="glass-card panel-card stack">
              <div class="panel-header">
                <h2>Exam-wise Performance</h2>
                <p class="panel-subtitle">Performance breakdown by Exam category</p>
              </div>
              <div class="metric-list stack">
                <div class="metric-card" *ngFor="let item of report.examWisePerformance">
                  <strong>{{ item.examCode }}</strong>
                  <div class="metric-details">
                    <span class="accuracy-pill" [class.danger]="item.accuracy < 50" [class.success]="item.accuracy >= 70">{{ item.accuracy }}% accuracy</span>
                    <span>{{ item.correctCount }}/{{ item.attempted }} correct</span>
                    <span>{{ formatDuration(item.averageTimeSeconds) }} avg time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Companywise & Paperwise -->
          <div class="stack">
            <div class="glass-card panel-card stack">
              <div class="panel-header">
                <h2>Company-wise Performance</h2>
                <p class="panel-subtitle">Performance across specific PSU/recruiter papers</p>
              </div>
              <div class="metric-list stack">
                <div class="metric-card" *ngFor="let item of report.companyWisePerformance.slice(0, 6)">
                  <strong>{{ item.examCode }} · {{ item.companyName }}</strong>
                  <div class="metric-details">
                    <span class="accuracy-pill" [class.danger]="item.accuracy < 50" [class.success]="item.accuracy >= 70">{{ item.accuracy }}% accuracy</span>
                    <span>{{ item.incorrectCount }} incorrect</span>
                    <span>{{ formatDuration(item.averageTimeSeconds) }} avg time</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="glass-card panel-card stack">
              <div class="panel-header">
                <h2>Paper-wise Performance</h2>
                <p class="panel-subtitle">Breakdown of specific question paper attempts</p>
              </div>
              <div class="metric-list stack">
                <div class="metric-card" *ngFor="let item of report.paperWisePerformance.slice(0, 8)">
                  <strong>
                    {{ item.examCode }} · {{ item.paperCode }}
                    <span *ngIf="item.examYear"> ({{ item.examYear }})</span>
                  </strong>
                  <div class="metric-details">
                    <span class="accuracy-pill" [class.danger]="item.accuracy < 50" [class.success]="item.accuracy >= 70">{{ item.accuracy }}% accuracy</span>
                    <span>{{ item.correctCount }}/{{ item.attempted }} correct</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        <!-- Bottom: Wrong Answers & Explanations -->
        <section class="review-section">
          <div class="glass-card panel-card stack">
            <div class="panel-header">
              <h2>Wrong Answers & Key Explanations</h2>
              <p class="panel-subtitle">Learn from mistakes and save notes for exam revision</p>
            </div>
            
            <div class="wrong-questions-list stack">
              <div class="review-card" *ngFor="let item of wrongQuestions().slice(0, 10)">
                <div class="review-card-header">
                  <strong>
                    Q{{ item.position }} · {{ item.examCode }}
                    <span *ngIf="item.companyName"> · {{ item.companyName }}</span>
                    <span *ngIf="item.paperCode"> · {{ item.paperCode }}</span>
                    <span *ngIf="item.examYear"> · {{ item.examYear }}</span>
                  </strong>
                  <span class="wrong-badge">Incorrect</span>
                </div>
                <p class="question-prompt">{{ item.prompt }}</p>
                
                <div class="answers-grid">
                  <div class="answer-box user-answer">
                    <span class="title">Your Answer:</span>
                    <strong>{{ item.selectedOption || 'Unanswered' }}</strong>
                  </div>
                  <div class="answer-box correct-answer">
                    <span class="title">Correct Answer:</span>
                    <strong>{{ item.correctOption }}</strong>
                  </div>
                </div>
                
                <div class="note-box" *ngIf="item.note">
                  <span class="title">Personal Revision Note:</span>
                  <p>{{ item.note }}</p>
                </div>
                
                <div class="explanation-box">
                  <span class="title">Detailed Explanation:</span>
                  <p class="explanation-text">{{ item.explanation }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .analytics-shell {
      padding-top: 24px;
      padding-bottom: 40px;
    }

    .hero-card {
      background: linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(255, 255, 255, 0.95) 100%);
      border: 1px solid rgba(59, 130, 246, 0.15);
      padding: 32px;
      margin: 0;
    }

    h1 {
      margin: 0 0 12px 0;
      font-size: clamp(2rem, 5vw, 3.2rem);
      line-height: 1.1;
      letter-spacing: -0.04em;
      color: var(--gk-ink);
      font-weight: 850;
    }

    .small-copy {
      font-size: 0.86rem;
    }

    /* Charts dashboard layout */
    .charts-dashboard-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 768px) {
      .charts-dashboard-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .chart-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(16, 44, 51, 0.02);
    }

    .chart-card h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--gk-ink);
    }

    .chart-card .chart-subtitle {
      margin: 2px 0 16px 0;
      font-size: 0.78rem;
      color: var(--gk-muted);
      font-weight: 600;
    }

    /* Radial Gauge Styles */
    .radial-gauge-container {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 12px auto;
    }

    .radial-gauge {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .gauge-bg {
      fill: none;
      stroke: rgba(16, 44, 51, 0.05);
      stroke-width: 8;
    }

    .gauge-fill {
      fill: none;
      stroke: var(--ion-color-primary, #10b981);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 314.16;
      transition: stroke-dashoffset 1000ms ease-out;
    }

    .gauge-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      display: flex;
      flex-direction: column;
    }

    .gauge-value {
      font-size: 1.8rem;
      font-weight: 900;
      color: var(--gk-ink);
      line-height: 1;
    }

    .gauge-text {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--gk-muted);
      text-transform: uppercase;
      margin-top: 2px;
      letter-spacing: 0.05em;
    }

    /* Segmented Bar breakdown */
    .breakdown-chart-wrapper {
      justify-content: center;
      flex: 1;
    }

    .segmented-bar-svg {
      width: 100%;
      height: 10px;
      border-radius: 5px;
      background: rgba(16, 44, 51, 0.05);
    }

    .bar-correct {
      fill: var(--ion-color-success, #10b981);
    }

    .bar-incorrect {
      fill: var(--ion-color-danger, #ef4444);
    }

    .bar-unanswered {
      fill: #9ca3af;
    }

    .breakdown-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 14px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .bg-correct { background: var(--ion-color-success, #10b981); }
    .bg-incorrect { background: var(--ion-color-danger, #ef4444); }
    .bg-unanswered { background: #9ca3af; }

    .text-correct { color: var(--ion-color-success-shade, #059669); }
    .text-incorrect { color: var(--ion-color-danger-shade, #dc2626); }
    .text-unanswered { color: #6b7280; }

    /* Performance score list */
    .score-metrics-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      justify-content: center;
      flex: 1;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--gk-outline);
    }

    .metric-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .metric-row .label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--gk-muted);
    }

    .metric-row .value {
      font-size: 1rem;
      font-weight: 800;
      color: var(--gk-ink);
    }

    /* Layout column grids */
    .layout-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 1100px) {
      .layout-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .panel-card {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(16, 44, 51, 0.02);
    }

    .panel-card .panel-header {
      margin-bottom: 20px;
    }

    .panel-card .panel-header h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 850;
      color: var(--gk-ink);
    }

    .panel-card .panel-header .panel-subtitle {
      margin: 2px 0 0 0;
      font-size: 0.78rem;
      color: var(--gk-muted);
      font-weight: 600;
    }

    .metric-list {
      gap: 12px;
    }

    .metric-card {
      padding: 14px;
      border-radius: 14px;
      border: 1px solid var(--gk-outline);
      background: rgba(16, 44, 51, 0.01);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .metric-card strong {
      font-size: 0.88rem;
      color: var(--gk-ink);
      font-weight: 800;
    }

    .metric-card .metric-details {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      font-size: 0.78rem;
      color: var(--gk-muted);
      font-weight: 600;
    }

    .accuracy-pill {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      background: rgba(16, 44, 51, 0.05);
      color: var(--gk-muted);
    }

    .accuracy-pill.danger {
      background: rgba(239, 68, 68, 0.1);
      color: var(--ion-color-danger, #ef4444);
    }

    .accuracy-pill.success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--ion-color-success, #10b981);
    }

    /* Review section for wrong answers */
    .review-section {
      width: 100%;
    }

    .wrong-questions-list {
      gap: 16px;
    }

    .review-card {
      padding: 18px;
      border-radius: 16px;
      border: 1px solid var(--gk-outline);
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 10px rgba(16, 44, 51, 0.01);
    }

    .review-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .review-card-header strong {
      font-size: 0.95rem;
      color: var(--gk-ink);
      font-weight: 800;
    }

    .review-card-header .wrong-badge {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 99px;
      background: rgba(239, 68, 68, 0.1);
      color: var(--ion-color-danger, #ef4444);
    }

    .question-prompt {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--gk-ink);
      line-height: 1.5;
    }

    .answers-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    @media (min-width: 600px) {
      .answers-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .answer-box {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--gk-outline);
      font-size: 0.85rem;
    }

    .answer-box .title {
      display: block;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--gk-muted);
      margin-bottom: 2px;
    }

    .answer-box strong {
      font-size: 0.9rem;
      font-weight: 800;
    }

    .answer-box.user-answer {
      background: rgba(239, 68, 68, 0.03);
      border-color: rgba(239, 68, 68, 0.15);
      color: var(--ion-color-danger, #ef4444);
    }

    .answer-box.correct-answer {
      background: rgba(16, 185, 129, 0.03);
      border-color: rgba(16, 185, 129, 0.15);
      color: var(--ion-color-success, #10b981);
    }

    .note-box {
      padding: 10px 14px;
      background: rgba(247, 181, 56, 0.04);
      border: 1px solid rgba(247, 181, 56, 0.2);
      border-radius: 10px;
    }

    .note-box .title {
      display: block;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      color: #b78a10;
      margin-bottom: 2px;
    }

    .note-box p {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--gk-ink);
    }

    .explanation-box {
      border-top: 1px solid var(--gk-outline);
      padding-top: 12px;
    }

    .explanation-box .title {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--gk-muted);
      margin-bottom: 4px;
    }

    .explanation-box p {
      margin: 0;
      font-size: 0.85rem;
      color: var(--gk-muted);
      line-height: 1.5;
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

  getStrokeDashoffset(accuracy: number): string {
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // ~314.16
    const offset = circumference - (accuracy / 100) * circumference;
    return `${offset}`;
  }

  getBreakdownWidths(correct: number, incorrect: number, unanswered: number): { correctW: number; incorrectW: number; unansweredW: number } {
    const total = correct + incorrect + unanswered;
    if (total === 0) return { correctW: 0, incorrectW: 0, unansweredW: 0 };
    return {
      correctW: (correct / total) * 100,
      incorrectW: (incorrect / total) * 100,
      unansweredW: (unanswered / total) * 100,
    };
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
