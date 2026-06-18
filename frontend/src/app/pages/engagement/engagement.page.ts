import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { EngagementService } from '../../core/services/engagement.service';
import {
  EngagementDashboard,
  FormulaFlashcard,
  LiveQuiz,
  MentorRoadmap,
  QuizLeaderboardRow,
  WeeklyChallenge,
} from '../../core/models/engagement.models';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-engagement-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack engagement-shell">
        
        <!-- Hero Header -->
        <section class="glass-card hero-card stack">
          <div class="section-header-hero">
            <div>
              <span class="section-kicker">Phase 6 - Engagement & Gamification</span>
              <h1>GATE/ESE Preparation Gamification HUD</h1>
            </div>
            <ion-button fill="outline" color="primary" size="small" (click)="loadDashboard()" [disabled]="loading()">
              <ion-icon name="sync-outline" slot="start"></ion-icon>
              {{ loading() ? 'Syncing...' : 'Sync Progress' }}
            </ion-button>
          </div>
          <p class="muted-copy">
            Unlock daily engineering formulas, build high-yielding study streaks, compete in real-time quiz challenges, and leverage AI to structure adaptive mentor roadmaps.
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

        <!-- Gamification HUD Stats -->
        <section class="gamification-hud-grid" *ngIf="profile() as profile">
          
          <div class="hud-stat-card total-xp">
            <div class="hud-card-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="hud-card-info">
              <span>Total Points Earned</span>
              <strong>{{ profile.xpPoints }} XP</strong>
              <div class="xp-level-progress">
                <div class="xp-progress-bar" [style.width.%]="(profile.xpPoints % 1000) / 10"></div>
              </div>
              <small>Level Progress: {{ profile.xpPoints % 1000 }}/1000 XP</small>
            </div>
          </div>

          <div class="hud-stat-card active-streak">
            <div class="hud-card-icon streak-fire">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A7.996 7.996 0 0120 13a7.996 7.996 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div class="hud-card-info">
              <span>Current Daily Streak</span>
              <strong>{{ profile.currentStreakDays }} Day(s)</strong>
              <small class="glow-text">Study every day to double your XP multipliers!</small>
            </div>
          </div>

          <div class="hud-stat-card record-streak">
            <div class="hud-card-icon best-medal">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div class="hud-card-info">
              <span>Longest Revision Record</span>
              <strong>{{ profile.longestStreakDays }} Day(s)</strong>
              <small>All-time highest streak count</small>
            </div>
          </div>

        </section>

        <!-- Main HUD Grid Split Layout -->
        <div class="engagement-hud-grid">
          
          <!-- LEFT SIDE: Formulas, Weekly Challenges, Leaderboards -->
          <div class="grid-column-left stack">
            
            <!-- Daily Formula Revision Card -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Micro-Learning Bytes</span>
                  <h2>Daily Formula Flashcard Revision</h2>
                </div>
                <span class="pills-indicator" *ngIf="flashcards().length">
                  {{ activeCardIndex() + 1 }} / {{ flashcards().length }} Cards
                </span>
              </div>

              <div class="formula-card-interactive-wrapper" *ngIf="currentFlashcard() as card; else noFlashcards">
                <div class="flashcard-body stack">
                  <div class="flashcard-meta">
                    <span class="meta-badge subject-code">{{ card.subject?.code || 'GATE' }}</span>
                    <span class="meta-badge difficulty-tag" [class.hard]="card.difficulty === 'hard'">
                      {{ card.difficulty }}
                    </span>
                  </div>
                  <h3>{{ card.title }}</h3>
                  
                  <div class="formula-block-code">
                    <code>{{ card.formulaText }}</code>
                  </div>

                  <p class="formula-explanation">{{ card.explanation }}</p>

                  <div class="formula-actions-group">
                    <ion-button fill="outline" color="secondary" (click)="reviewFormula(card, 2)">
                      <ion-icon name="refresh-outline" slot="start"></ion-icon>
                      Queue Revision
                    </ion-button>
                    <ion-button color="success" (click)="reviewFormula(card, 4)">
                      <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
                      Mastered (+10 XP)
                    </ion-button>
                  </div>
                </div>
              </div>

              <ng-template #noFlashcards>
                <div class="empty-state-card">
                  <p class="empty-text-copy">No revision flashcards are due for today. Keep building your daily streak!</p>
                </div>
              </ng-template>
            </section>

            <!-- Weekly ESE/GATE Coding/Topic Challenges -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Earn Bonus Boosts</span>
                  <h2>Weekly Prep Challenges</h2>
                </div>
              </div>

              <div class="challenges-list stack">
                <div class="challenge-item-row" *ngFor="let challenge of challenges()">
                  <div class="challenge-info stack">
                    <div class="challenge-head">
                      <strong>{{ challenge.title }}</strong>
                      <span class="xp-reward-tag">+{{ challenge.xpReward }} XP</span>
                    </div>
                    <p class="challenge-desc">{{ challenge.description }}</p>
                    <span class="challenge-status-badge">{{ challenge.status }}</span>
                  </div>

                  <div class="challenge-submit-widget">
                    <div class="input-inline-group" *ngIf="!challenge.participation">
                      <ion-button size="small" color="secondary" (click)="joinChallenge(challenge)">
                        Join Challenge
                      </ion-button>
                    </div>
                    <div class="input-inline-group" *ngIf="challenge.participation">
                      <div class="input-wrapper-mini">
                        <label>Self Score (0-100)</label>
                        <ion-input
                          type="number"
                          min="0"
                          max="100"
                          [ngModel]="challengeScores()[challenge.id] || 80"
                          (ngModelChange)="setChallengeScore(challenge.id, $event)">
                        </ion-input>
                      </div>
                      <ion-button size="small" color="success" (click)="submitChallengeScore(challenge)">
                        Submit
                      </ion-button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Live Quizzes & Redis Realtime Leaderboard -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Test Speed & Precision</span>
                  <h2>Competitive Live Quizzes</h2>
                </div>
              </div>

              <div class="quizzes-timeline stack">
                <div class="quiz-item-box stack" *ngFor="let quiz of liveQuizzes()">
                  <div class="quiz-item-header">
                    <div>
                      <strong>{{ quiz.title }}</strong>
                      <span class="quiz-ends-time">Ends: {{ formatDate(quiz.endsAt) }}</span>
                    </div>
                    <ion-button size="small" fill="outline" color="secondary" (click)="loadLeaderboard(quiz)">
                      Show Live Standings
                    </ion-button>
                  </div>

                  <!-- Live Questions within Quiz -->
                  <div class="quiz-questions-block stack">
                    <div class="quiz-question-card stack" *ngFor="let question of quiz.questions">
                      <p class="question-prompt">{{ question.position }}. {{ question.prompt }}</p>
                      
                      <ion-segment
                        [value]="quizAnswers()[question.id] || ''"
                        (ionChange)="setQuizAnswer(question.id, $event.detail.value)"
                        class="quiz-options-segment">
                        <ion-segment-button *ngFor="let option of question.options" [value]="option.id">
                          <ion-label>{{ option.id }}: {{ option.text }}</ion-label>
                        </ion-segment-button>
                      </ion-segment>

                      <ion-button size="small" color="success" expand="block" (click)="submitQuizAnswer(question.id)">
                        Submit Option Answer
                      </ion-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quiz Standings Leaderboard -->
              <div class="leaderboard-wrapper stack" *ngIf="leaderboard().length">
                <div class="discussion-divider"></div>
                <h3>Quiz Standings Leaderboard</h3>
                <div class="leaderboard-grid">
                  <div class="leaderboard-row" *ngFor="let row of leaderboard()" [class.top-tier]="row.rank <= 3">
                    <div class="rank-container">
                      <span class="rank-medal" *ngIf="row.rank === 1">🥇</span>
                      <span class="rank-medal" *ngIf="row.rank === 2">🥈</span>
                      <span class="rank-medal" *ngIf="row.rank === 3">🥉</span>
                      <span class="rank-num" *ngIf="row.rank > 3">#{{ row.rank }}</span>
                    </div>
                    <strong class="leader-name">{{ row.fullName }}</strong>
                    <span class="leader-points">{{ row.points }} Pts</span>
                  </div>
                </div>
              </div>
            </section>

          </div>

          <!-- RIGHT SIDE: AI Mentor Roadmap, Referral Rewards, Badges -->
          <div class="grid-column-right stack">

            <!-- AI Mentor Mode & Roadmap Planner -->
            <section class="glass-card panel-card premium-roadmap-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Dynamic Weak-Area Diagnostic</span>
                  <h2>AI Study Roadmap</h2>
                </div>
                <ion-button size="small" color="secondary" (click)="generateRoadmap()">
                  <ion-icon name="rocket-outline" slot="start"></ion-icon>
                  Generate AI Plan
                </ion-button>
              </div>

              <div class="upsell-cue-mini">
                <svg class="icon-key" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div class="cue-content">
                  <strong>Free Roadmap Limit: 1 plan / week</strong>
                  <p>Upgrade to Pro to dynamically recalibrate daily study tasks based on weak test scores.</p>
                </div>
              </div>

              <!-- Roadmap Display -->
              <div class="roadmap-result-container" *ngIf="roadmap() as roadmapPlan; else noRoadmap">
                <div class="roadmap-summary-box">
                  <strong>Diagnostic Focus:</strong>
                  <p>{{ roadmapPlan.focusSummary }}</p>
                </div>

                <div class="roadmap-timeline">
                  <div class="roadmap-timeline-node" *ngFor="let item of roadmapPlan.weeklyPlan">
                    <div class="node-marker">Day {{ item.day }}</div>
                    <div class="node-content stack">
                      <strong>{{ item.task }}</strong>
                      <p>{{ item.target }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <ng-template #noRoadmap>
                <div class="empty-state-small">
                  <p>No customized plan generated yet. Select the generate button to construct your AI ESE/GATE roadmap.</p>
                </div>
              </ng-template>
            </section>

            <!-- Earned Badges Portfolio -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Unlocked Achievements</span>
                  <h2>Aspirant Badges Portfolio</h2>
                </div>
                <span class="pills-indicator-count">{{ earnedBadges().length }} Earned</span>
              </div>

              <div class="badges-portfolio-grid">
                <div
                  class="badge-portfolio-tile"
                  *ngFor="let badge of dashboard()?.badges"
                  [class.portfolio-tile-earned]="!!badge.awardedAt">
                  <div class="badge-icon-shield">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" *ngIf="badge.awardedAt">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" *ngIf="!badge.awardedAt" class="lock-icon-svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div class="badge-portfolio-info">
                    <strong>{{ badge.title }}</strong>
                    <p>{{ badge.description }}</p>
                    <small *ngIf="badge.awardedAt" class="awarded-date-badge">Earned</small>
                    <small *ngIf="!badge.awardedAt" class="awarded-xp-bonus">+{{ badge.xpBonus }} XP bonus</small>
                  </div>
                </div>
              </div>
            </section>

            <!-- Referral Rewards Card -->
            <section class="glass-card panel-card stack">
              <div class="panel-header">
                <div>
                  <span class="panel-subtitle">Expand the Sanctuary</span>
                  <h2>Referral Boost Program</h2>
                </div>
              </div>

              <div class="referral-code-widget" *ngIf="dashboard()?.referral as referral">
                <span>Your Referral Code</span>
                <strong class="code-text-glow">{{ referral.referralCode }}</strong>
                <p>{{ referral.totalReferrals }} Friends Joined Â· {{ referral.awardedPoints }} XP Bonus Awarded</p>
              </div>

              <div class="referral-application-block stack">
                <div class="custom-input-group">
                  <label class="input-label">Enter Peer's Referral Code</label>
                  <ion-item lines="none" class="custom-field">
                    <ion-input
                      [ngModel]="referralInput()"
                      (ngModelChange)="referralInput.set(toText($event).toUpperCase())"
                      placeholder="e.g. GURU999">
                    </ion-input>
                  </ion-item>
                </div>
                <ion-button expand="block" fill="outline" color="secondary" (click)="applyReferralCode()">
                  Apply Code & Claim XP
                </ion-button>
              </div>
            </section>

          </div>

        </div>

      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styleUrls: ['./engagement.page.scss'],
})
export class EngagementPage implements OnInit {
  private readonly engagementService = inject(EngagementService);
  private readonly authService = inject(AuthService);

  readonly dashboard = signal<EngagementDashboard | null>(null);
  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly activeCardIndex = signal(0);
  readonly challengeScores = signal<Record<string, number>>({});
  readonly liveQuizzes = signal<LiveQuiz[]>([]);
  readonly quizAnswers = signal<Record<string, string>>({});
  readonly leaderboard = signal<QuizLeaderboardRow[]>([]);
  readonly referralInput = signal('');
  readonly roadmap = signal<MentorRoadmap | null>(null);

  readonly profile = computed(() => this.dashboard()?.profile ?? null);
  readonly flashcards = computed(() => this.dashboard()?.dailyFlashcards ?? []);
  readonly challenges = computed(() => this.dashboard()?.weeklyChallenges ?? []);
  readonly earnedBadges = computed(() =>
    (this.dashboard()?.badges ?? []).filter((badge) => Boolean(badge.awardedAt))
  );
  readonly currentFlashcard = computed<FormulaFlashcard | null>(() => {
    const cards = this.flashcards();
    return cards[this.activeCardIndex()] ?? cards[0] ?? null;
  });

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  toText(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [dashboard, quizzes] = await Promise.all([
        this.engagementService.getDashboard(),
        this.engagementService.getLiveQuizzes(),
      ]);

      this.dashboard.set(dashboard);
      this.liveQuizzes.set(quizzes);
      this.roadmap.set(dashboard.roadmap);
      this.activeCardIndex.set(0);
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'Engagement dashboard could not be loaded.')
      );
    } finally {
      this.loading.set(false);
    }
  }

  async reviewFormula(card: FormulaFlashcard, confidence: number): Promise<void> {
    try {
      await this.engagementService.reviewFlashcard(card.id, confidence);
      this.successMessage.set(confidence >= 4 ? 'Formula mastered. XP added.' : 'Formula queued for revision.');
      const nextIndex = this.activeCardIndex() + 1;
      this.activeCardIndex.set(Math.min(nextIndex, Math.max(this.flashcards().length - 1, 0)));
      await this.refreshDashboardOnly();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Formula review failed.'));
    }
  }

  async joinChallenge(challenge: WeeklyChallenge): Promise<void> {
    try {
      await this.engagementService.joinChallenge(challenge.id);
      this.successMessage.set('Challenge joined. XP added.');
      await this.refreshDashboardOnly();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Challenge join failed.'));
    }
  }

  setChallengeScore(challengeId: string, value: unknown): void {
    const score = Math.max(0, Math.min(100, this.toNumber(value)));
    this.challengeScores.update((current) => ({
      ...current,
      [challengeId]: score,
    }));
  }

  async submitChallengeScore(challenge: WeeklyChallenge): Promise<void> {
    try {
      const score = this.challengeScores()[challenge.id] ?? 80;
      await this.engagementService.submitChallengeScore(challenge.id, score);
      this.successMessage.set('Challenge score submitted. XP updated.');
      await this.refreshDashboardOnly();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Challenge score failed.'));
    }
  }

  setQuizAnswer(questionId: string, value: unknown): void {
    const selectedOption = this.toText(value);
    this.quizAnswers.update((current) => ({
      ...current,
      [questionId]: selectedOption,
    }));
  }

  async submitQuizAnswer(questionId: string): Promise<void> {
    const selectedOption = this.quizAnswers()[questionId];
    if (!selectedOption) {
      this.errorMessage.set('Choose an answer first.');
      return;
    }

    try {
      const result = await this.engagementService.submitQuizAnswer(questionId, selectedOption);
      this.successMessage.set(
        result.isCorrect
          ? `Correct. ${result.pointsAwarded} XP added.`
          : `Not quite. ${result.explanation ?? 'Review and try the next question.'}`
      );
      await this.refreshDashboardOnly();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Quiz answer failed.'));
    }
  }

  async loadLeaderboard(quiz: LiveQuiz): Promise<void> {
    try {
      this.leaderboard.set(await this.engagementService.getQuizLeaderboard(quiz.id));
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Leaderboard could not be loaded.'));
    }
  }

  async applyReferralCode(): Promise<void> {
    const referralCode = this.referralInput().trim();
    if (!referralCode) {
      this.errorMessage.set('Enter a referral code first.');
      return;
    }

    try {
      await this.engagementService.applyReferralCode(referralCode);
      this.referralInput.set('');
      this.successMessage.set('Referral code applied. Bonus XP added.');
      await this.refreshDashboardOnly();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Referral code failed.'));
    }
  }

  async generateRoadmap(): Promise<void> {
    try {
      const roadmap = await this.engagementService.generateMentorRoadmap();
      this.roadmap.set(roadmap);
      this.successMessage.set('Mentor roadmap generated.');
      await this.refreshDashboardOnly();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Mentor roadmap failed.'));
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private async refreshDashboardOnly(): Promise<void> {
    const dashboard = await this.engagementService.getDashboard();
    this.dashboard.set(dashboard);
    this.roadmap.set(dashboard.roadmap ?? this.roadmap());
  }
}
