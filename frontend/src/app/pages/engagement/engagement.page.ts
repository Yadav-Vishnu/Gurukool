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

@Component({
  selector: 'app-engagement-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>Engagement</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="outline" (click)="loadDashboard()" [disabled]="loading()">
            {{ loading() ? 'Refreshing...' : 'Refresh' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack engagement-shell">
        <section class="glass-card hero-card stack">
          <span class="section-kicker">Phase 6 - Engagement & Growth</span>
          <h1>Daily formulas, streaks, challenges, referrals, and mentor roadmaps.</h1>
          <p class="muted-copy">
            Review 8-10 formulas, earn XP, join weekly challenges, and generate a focused study
            plan from your Gurukool activity.
          </p>
        </section>

        <ion-note color="success" *ngIf="successMessage()">{{ successMessage() }}</ion-note>
        <ion-note color="danger" *ngIf="errorMessage()">{{ errorMessage() }}</ion-note>

        <section class="stat-band" *ngIf="profile() as profile">
          <article>
            <span>XP</span>
            <strong>{{ profile.xpPoints }}</strong>
          </article>
          <article>
            <span>Current streak</span>
            <strong>{{ profile.currentStreakDays }} day(s)</strong>
          </article>
          <article>
            <span>Best streak</span>
            <strong>{{ profile.longestStreakDays }} day(s)</strong>
          </article>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Daily Formula Revision</h2>
              <p class="muted-copy">{{ flashcards().length }} cards ready today.</p>
            </div>
            <ion-badge color="secondary">{{ activeCardIndex() + 1 }}/{{ flashcards().length || 1 }}</ion-badge>
          </div>

          <article class="formula-card" *ngIf="currentFlashcard() as card; else noFlashcards">
            <span>{{ card.subject?.code || 'GK' }} - {{ card.difficulty }}</span>
            <h3>{{ card.title }}</h3>
            <code>{{ card.formulaText }}</code>
            <p>{{ card.explanation }}</p>

            <div class="actions-grid">
              <ion-button fill="outline" color="medium" (click)="reviewFormula(card, 2)">
                Revise Again
              </ion-button>
              <ion-button color="secondary" (click)="reviewFormula(card, 4)">
                I Know This
              </ion-button>
            </div>
          </article>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Badges</h2>
              <p class="muted-copy">{{ earnedBadges().length }} earned so far.</p>
            </div>
          </div>

          <div class="badge-grid">
            <article class="badge-row" *ngFor="let badge of dashboard()?.badges" [class.earned]="!!badge.awardedAt">
              <strong>{{ badge.title }}</strong>
              <span>{{ badge.description }}</span>
              <small>{{ badge.awardedAt ? 'Earned' : '+' + badge.xpBonus + ' XP bonus' }}</small>
            </article>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Weekly Challenges</h2>
              <p class="muted-copy">Join, complete, and earn XP rewards.</p>
            </div>
          </div>

          <article class="challenge-row" *ngFor="let challenge of challenges()">
            <div>
              <strong>{{ challenge.title }}</strong>
              <span>{{ challenge.status }} - {{ challenge.xpReward }} XP max</span>
              <p>{{ challenge.description }}</p>
            </div>

            <div class="actions-grid">
              <ion-button size="small" [disabled]="!!challenge.participation" (click)="joinChallenge(challenge)">
                Join
              </ion-button>
              <ion-input
                type="number"
                min="0"
                max="100"
                [ngModel]="challengeScores()[challenge.id] || 80"
                (ngModelChange)="setChallengeScore(challenge.id, $event)">
              </ion-input>
              <ion-button size="small" color="secondary" (click)="submitChallengeScore(challenge)">
                Submit Score
              </ion-button>
            </div>
          </article>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Live Quizzes</h2>
              <p class="muted-copy">Answer active quiz questions and climb the Redis leaderboard.</p>
            </div>
          </div>

          <article class="quiz-row" *ngFor="let quiz of liveQuizzes()">
            <div class="quiz-head">
              <div>
                <strong>{{ quiz.title }}</strong>
                <span>{{ quiz.status }} - ends {{ formatDate(quiz.endsAt) }}</span>
              </div>
              <ion-button size="small" fill="outline" (click)="loadLeaderboard(quiz)">
                Leaderboard
              </ion-button>
            </div>

            <div class="quiz-question" *ngFor="let question of quiz.questions">
              <p>{{ question.position }}. {{ question.prompt }}</p>
              <ion-segment
                [ngModel]="quizAnswers()[question.id] || ''"
                (ngModelChange)="setQuizAnswer(question.id, $event)">
                <ion-segment-button *ngFor="let option of question.options" [value]="option.id">
                  {{ option.id }}
                </ion-segment-button>
              </ion-segment>
              <ion-button size="small" color="secondary" (click)="submitQuizAnswer(question.id)">
                Submit Answer
              </ion-button>
            </div>
          </article>

          <div class="leaderboard" *ngIf="leaderboard().length">
            <h3>Leaderboard</h3>
            <article class="leader-row" *ngFor="let row of leaderboard()">
              <span>#{{ row.rank }}</span>
              <strong>{{ row.fullName }}</strong>
              <span>{{ row.points }} pts</span>
            </article>
          </div>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>Referral Rewards</h2>
              <p class="muted-copy">Invite friends and earn XP when they join.</p>
            </div>
          </div>

          <article class="referral-card" *ngIf="dashboard()?.referral as referral">
            <span>Your code</span>
            <strong>{{ referral.referralCode }}</strong>
            <p>{{ referral.totalReferrals }} referral(s), {{ referral.awardedPoints }} XP awarded.</p>
          </article>

          <ion-item lines="none">
            <ion-label position="stacked">Apply referral code</ion-label>
            <ion-input
              [ngModel]="referralInput()"
              (ngModelChange)="referralInput.set(toText($event).toUpperCase())">
            </ion-input>
          </ion-item>
          <ion-button expand="block" fill="outline" (click)="applyReferralCode()">Apply Code</ion-button>
        </section>

        <section class="glass-card stack">
          <div class="section-header">
            <div>
              <h2>AI Mentor Mode</h2>
              <p class="muted-copy">A local mentor plan built from your attempts, streak, and formula queue.</p>
            </div>
            <ion-button size="small" color="secondary" (click)="generateRoadmap()">
              Generate
            </ion-button>
          </div>

          <article class="roadmap-card" *ngIf="roadmap() as roadmap; else noRoadmap">
            <h3>{{ roadmap.focusSummary }}</h3>
            <div class="roadmap-list">
              <article *ngFor="let item of roadmap.weeklyPlan">
                <span>Day {{ item.day }}</span>
                <strong>{{ item.task }}</strong>
                <p>{{ item.target }}</p>
              </article>
            </div>
          </article>
        </section>
      </div>
    </ion-content>

    <ng-template #noFlashcards>
      <p class="muted-copy">No formula cards are due right now.</p>
    </ng-template>

    <ng-template #noRoadmap>
      <p class="muted-copy">Generate your first mentor roadmap.</p>
    </ng-template>
  `,
  styles: [`
    .engagement-shell {
      padding-top: 88px;
    }

    .hero-card {
      margin: 0;
    }

    h1 {
      margin: 12px 0 8px;
      font-size: clamp(1.9rem, 4.8vw, 3.15rem);
      line-height: 1;
      color: var(--ion-color-dark);
    }

    h2,
    h3 {
      margin: 0;
      color: var(--ion-color-dark);
    }

    h2 {
      font-size: 1.15rem;
    }

    h3 {
      font-size: 1rem;
    }

    .section-header,
    .quiz-head {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      justify-content: space-between;
    }

    .stat-band {
      display: grid;
      gap: 12px;
    }

    .stat-band article,
    .formula-card,
    .badge-row,
    .challenge-row,
    .quiz-row,
    .referral-card,
    .roadmap-card,
    .leader-row {
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
      background: rgba(248, 250, 255, 0.78);
      padding: 14px;
    }

    .stat-band span,
    .formula-card span,
    .badge-row span,
    .challenge-row span,
    .quiz-row span,
    .referral-card span,
    .roadmap-list span {
      display: block;
      color: var(--gk-muted);
      font-size: 0.86rem;
    }

    .stat-band strong {
      display: block;
      margin-top: 4px;
      color: var(--ion-color-dark);
      font-size: 1.3rem;
    }

    .formula-card,
    .challenge-row,
    .quiz-row,
    .roadmap-card {
      display: grid;
      gap: 12px;
    }

    code {
      display: block;
      padding: 14px;
      border-radius: 12px;
      background: rgba(20, 32, 44, 0.92);
      color: #f7fbff;
      white-space: normal;
      line-height: 1.6;
    }

    .formula-card p,
    .challenge-row p,
    .quiz-question p,
    .referral-card p,
    .roadmap-list p {
      margin: 0;
      color: var(--ion-color-dark);
      line-height: 1.55;
    }

    .actions-grid,
    .badge-grid,
    .roadmap-list {
      display: grid;
      gap: 10px;
    }

    .badge-row {
      display: grid;
      gap: 6px;
      opacity: 0.72;
    }

    .badge-row.earned {
      opacity: 1;
      border-color: rgba(30, 136, 229, 0.5);
      background: rgba(230, 242, 255, 0.72);
    }

    .quiz-question {
      display: grid;
      gap: 10px;
      border-top: 1px dashed var(--gk-outline);
      padding-top: 12px;
    }

    .leaderboard {
      display: grid;
      gap: 8px;
    }

    .leader-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
    }

    ion-item {
      --background: rgba(255, 255, 255, 0.72);
      --border-radius: 14px;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
    }

    @media (min-width: 768px) {
      .stat-band,
      .actions-grid,
      .badge-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `],
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
