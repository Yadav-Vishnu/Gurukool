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
                <p>{{ referral.totalReferrals }} Friends Joined · {{ referral.awardedPoints }} XP Bonus Awarded</p>
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
  styles: [`
    .engagement-shell {
      padding-top: 24px;
      padding-bottom: 40px;
    }

    .hero-card {
      background: linear-gradient(135deg, rgba(253, 246, 230, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.25);
      padding: 32px;
      margin: 0;
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
      margin: 8px 0 12px;
      font-size: clamp(2rem, 4.5vw, 3rem);
      font-weight: 850;
      line-height: 1.1;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--ion-color-dark) 30%, var(--ion-color-primary) 100%);
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

    /* Gamification HUD Panel */
    .gamification-hud-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 768px) {
      .gamification-hud-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .hud-stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 20px;
      padding: 20px;
      box-shadow: var(--gk-shadow-soft);
      transition: all 250ms ease;
    }

    .hud-stat-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--gk-outline-strong);
    }

    .hud-card-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: rgba(var(--ion-color-primary-rgb), 0.15);
      color: var(--ion-color-primary);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .hud-card-icon.streak-fire {
      background: rgba(232, 93, 63, 0.12);
      color: var(--gk-saffron);
    }

    .hud-card-icon.best-medal {
      background: rgba(247, 181, 56, 0.15);
      color: #b78a10;
    }

    .hud-card-icon svg {
      width: 24px;
      height: 24px;
    }

    .hud-card-info {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .hud-card-info span {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--gk-muted);
    }

    .hud-card-info strong {
      font-size: 1.35rem;
      font-weight: 850;
      color: var(--gk-ink);
      line-height: 1.25;
      margin: 2px 0;
    }

    .hud-card-info small {
      font-size: 0.76rem;
      color: var(--gk-muted);
    }

    .xp-level-progress {
      height: 6px;
      border-radius: 999px;
      background: #e8ecef;
      overflow: hidden;
      margin: 6px 0 4px;
    }

    .xp-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--ion-color-primary), var(--gk-gold));
      border-radius: inherit;
    }

    .glow-text {
      color: var(--gk-saffron) !important;
      font-weight: 700;
    }

    /* Split HUD Grid */
    .engagement-hud-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 1024px) {
      .engagement-hud-grid {
        grid-template-columns: 1.15fr 0.85fr;
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
      color: var(--gk-ink);
      margin: 0;
    }

    .panel-card h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--gk-ink);
      margin: 0 0 14px 0;
      border-left: 3px solid var(--ion-color-secondary);
      padding-left: 10px;
    }

    .pills-indicator {
      font-size: 0.76rem;
      font-weight: 800;
      background: rgba(var(--ion-color-secondary-rgb), 0.1);
      color: var(--ion-color-secondary-shade);
      padding: 4px 10px;
      border-radius: 99px;
    }

    /* Formula revision flashcard */
    .formula-card-interactive-wrapper {
      background: linear-gradient(135deg, rgba(255, 252, 244, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.18);
      border-radius: 18px;
      padding: 20px;
      box-shadow: var(--gk-shadow-soft);
    }

    .flashcard-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .meta-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .subject-code {
      background: rgba(29, 92, 99, 0.1);
      color: #1d5c63;
    }

    .difficulty-tag {
      background: rgba(47, 159, 111, 0.1);
      color: var(--gk-forest);
    }

    .difficulty-tag.hard {
      background: rgba(232, 93, 63, 0.1);
      color: var(--gk-saffron);
    }

    .formula-card-interactive-wrapper h3 {
      font-size: 1.2rem;
      color: var(--gk-ink);
      border-left: none;
      padding-left: 0;
      margin-bottom: 14px;
    }

    .formula-block-code {
      margin-bottom: 16px;
    }

    .formula-block-code code {
      display: block;
      padding: 16px;
      border-radius: 12px;
      background: #14202c;
      color: #f7fbff;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 1.05rem;
      line-height: 1.5;
      overflow-x: auto;
    }

    .formula-explanation {
      font-size: 0.92rem;
      color: var(--gk-muted);
      line-height: 1.55;
      margin: 0 0 20px;
    }

    .formula-actions-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .formula-actions-group ion-button {
      margin: 0;
      font-weight: 700;
    }

    /* Weekly prep challenges */
    .challenges-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .challenge-item-row {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      border: 1px solid var(--gk-outline);
      background: #ffffff;
      border-radius: 16px;
    }

    @media (min-width: 600px) {
      .challenge-item-row {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .challenge-info {
      flex-grow: 1;
      gap: 6px;
    }

    .challenge-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .challenge-head strong {
      font-size: 0.95rem;
      color: var(--gk-ink);
    }

    .xp-reward-tag {
      font-size: 0.72rem;
      font-weight: 800;
      background: rgba(47, 159, 111, 0.1);
      color: var(--gk-forest);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .challenge-desc {
      margin: 0;
      font-size: 0.86rem;
      color: var(--gk-muted);
      line-height: 1.45;
    }

    .challenge-status-badge {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--gk-muted);
    }

    .challenge-submit-widget {
      flex-shrink: 0;
    }

    .input-inline-group {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }

    .input-wrapper-mini {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100px;
    }

    .input-wrapper-mini label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--gk-muted);
    }

    .input-wrapper-mini ion-input {
      --background: #ffffff;
      --padding-start: 10px;
      border: 1px solid var(--gk-outline);
      border-radius: 10px;
      height: 38px;
    }

    .input-inline-group ion-button {
      margin: 0;
      height: 38px;
    }

    /* Live Quizzes */
    .quizzes-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .quiz-item-box {
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      padding: 16px;
      background: #ffffff;
    }

    .quiz-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
    }

    .quiz-item-header strong {
      display: block;
      font-size: 0.95rem;
      color: var(--gk-ink);
    }

    .quiz-ends-time {
      font-size: 0.78rem;
      color: var(--gk-muted);
    }

    .quiz-questions-block {
      border-top: 1px dashed var(--gk-outline);
      padding-top: 14px;
    }

    .quiz-question-card {
      background: #fdfdfd;
      border: 1px solid var(--gk-outline);
      border-radius: 12px;
      padding: 14px;
    }

    .question-prompt {
      margin: 0 0 10px 0;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--gk-ink);
      line-height: 1.45;
    }

    .quiz-options-segment {
      --background: #f3f3f3;
      margin-bottom: 12px;
    }

    .quiz-options-segment ion-segment-button {
      --color-checked: #ffffff;
      --indicator-color: var(--ion-color-secondary);
      font-size: 0.8rem;
      font-weight: 700;
    }

    /* Live Leaderboards standings */
    .leaderboard-wrapper {
      border-top: 1px dashed var(--gk-outline);
      padding-top: 16px;
    }

    .leaderboard-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .leaderboard-row {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.88rem;
    }

    .leaderboard-row.top-tier {
      border-color: rgba(247, 181, 56, 0.4);
      background: rgba(247, 181, 56, 0.03);
    }

    .rank-container {
      font-size: 1.1rem;
      display: grid;
      place-items: center;
    }

    .rank-num {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--gk-muted);
    }

    .leader-name {
      color: var(--gk-ink);
    }

    .leader-points {
      font-weight: 800;
      color: var(--ion-color-secondary);
    }

    /* AI Mentor Roadmap visual styling */
    .premium-roadmap-card {
      border: 1px solid rgba(247, 181, 56, 0.35);
      background: linear-gradient(135deg, rgba(255, 252, 244, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
    }

    .upsell-cue-mini {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(247, 181, 56, 0.08);
      border-left: 3px solid var(--gk-gold);
      padding: 10px 14px;
      border-radius: 8px;
    }

    .icon-key {
      width: 20px;
      height: 20px;
      color: #b78a10;
      flex-shrink: 0;
    }

    .cue-content strong {
      font-size: 0.82rem;
      color: #b78a10;
      display: block;
    }

    .cue-content p {
      margin: 0;
      font-size: 0.78rem;
      color: var(--gk-muted);
      line-height: 1.3;
    }

    .roadmap-summary-box {
      background: rgba(29, 92, 99, 0.05);
      border: 1px solid rgba(29, 92, 99, 0.12);
      border-radius: 12px;
      padding: 12px 14px;
      margin: 16px 0;
    }

    .roadmap-summary-box strong {
      font-size: 0.78rem;
      text-transform: uppercase;
      color: #1d5c63;
      display: block;
      margin-bottom: 2px;
    }

    .roadmap-summary-box p {
      margin: 0;
      font-size: 0.88rem;
      color: var(--gk-ink);
      line-height: 1.45;
    }

    .roadmap-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      padding-left: 20px;
    }

    .roadmap-timeline::before {
      content: "";
      position: absolute;
      top: 10px;
      bottom: 10px;
      left: 6px;
      width: 2px;
      background: rgba(29, 92, 99, 0.15);
    }

    .roadmap-timeline-node {
      position: relative;
    }

    .node-marker {
      position: absolute;
      left: -28px;
      top: 4px;
      background: #1d5c63;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      text-transform: uppercase;
      z-index: 2;
    }

    .node-content {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 12px;
      padding: 12px 14px;
    }

    .node-content strong {
      font-size: 0.88rem;
      color: var(--gk-ink);
    }

    .node-content p {
      margin: 4px 0 0 0;
      font-size: 0.82rem;
      color: var(--gk-muted);
      line-height: 1.4;
    }

    /* Badges Grid Portfolio */
    .pills-indicator-count {
      font-size: 0.74rem;
      font-weight: 800;
      background: rgba(47, 159, 111, 0.1);
      color: var(--gk-forest);
      padding: 4px 10px;
      border-radius: 99px;
    }

    .badges-portfolio-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: 1fr;
    }

    .badge-portfolio-tile {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      opacity: 0.65;
      transition: all 200ms ease;
    }

    .badge-portfolio-tile.portfolio-tile-earned {
      opacity: 1;
      border-color: rgba(247, 181, 56, 0.4);
      background: linear-gradient(135deg, #ffffff 0%, rgba(253, 246, 230, 0.4) 100%);
      box-shadow: var(--gk-shadow-soft);
    }

    .badge-portfolio-tile:hover {
      transform: translateY(-2px);
      border-color: var(--gk-outline-strong);
    }

    .badge-icon-shield {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(247, 181, 56, 0.12);
      color: #b78a10;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .lock-icon-svg {
      color: #90a4ae;
    }

    .badge-icon-shield svg {
      width: 22px;
      height: 22px;
    }

    .badge-portfolio-info strong {
      display: block;
      font-size: 0.88rem;
      color: var(--gk-ink);
    }

    .badge-portfolio-info p {
      margin: 2px 0;
      font-size: 0.78rem;
      color: var(--gk-muted);
      line-height: 1.35;
    }

    .awarded-date-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--gk-forest);
      text-transform: uppercase;
    }

    .awarded-xp-bonus {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--gk-saffron);
      text-transform: uppercase;
    }

    /* Referral and copy styles */
    .referral-code-widget {
      background: linear-gradient(135deg, rgba(29, 92, 99, 0.04) 0%, rgba(29, 92, 99, 0.08) 100%);
      border: 1px solid rgba(29, 92, 99, 0.12);
      border-radius: 14px;
      padding: 16px;
      text-align: center;
    }

    .referral-code-widget span {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--gk-muted);
      display: block;
    }

    .code-text-glow {
      font-size: 1.6rem;
      font-weight: 850;
      letter-spacing: 0.05em;
      color: #1d5c63;
      display: block;
      margin: 6px 0;
    }

    .referral-code-widget p {
      margin: 0;
      font-size: 0.82rem;
      color: var(--gk-muted);
      font-weight: 600;
    }

    .discussion-divider {
      height: 1px;
      border-top: 1px dashed var(--gk-outline);
      margin: 14px 0;
    }

    .empty-state-card {
      padding: 30px 20px;
      text-align: center;
      border: 1px dashed var(--gk-outline);
      border-radius: 14px;
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
