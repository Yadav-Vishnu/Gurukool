import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell stack welcome-shell">
        <section class="hero-split-container">
          <div class="hero-content-column">
            <span class="section-kicker">GATE | ESE | PSU Prep Space</span>
            <h1>A Calm Study Sanctuary for Serious Prep</h1>
            <p class="lead">
              Experience distraction-free, structured learning engineered for success. Practice under exam conditions with dynamic question palettes, sync offline-ready revision textbooks, pinpoint weaknesses automatically, and study alongside peers.
            </p>

            <div class="hero-actions">
              <ion-button routerLink="/auth" size="large" color="primary" id="btn-login-welcome">
                Start Free Account
              </ion-button>
              <ion-button routerLink="/auth" fill="outline" size="large" color="dark" id="btn-login-alt-welcome">
                Use OTP or Google
              </ion-button>
            </div>

            <div class="trust-banner">
              <div class="trust-stat">
                <strong>50+ Mocks</strong>
                <span>Fixed & Adaptive</span>
              </div>
              <div class="trust-divider"></div>
              <div class="trust-stat">
                <strong>Offline-Ready</strong>
                <span>Books & Notes</span>
              </div>
              <div class="trust-divider"></div>
              <div class="trust-stat">
                <strong>Ad-Free</strong>
                <span>100% Focused Study</span>
              </div>
            </div>
          </div>

          <div class="hero-visual-column">
            <div class="premium-pass-card glass-card">
              <div class="pass-header">
                <span class="pass-badge">RECOMMENDED</span>
                <h3>Gurukool Premium Pass</h3>
                <p class="price">₹999<span> / lifetime access</span></p>
              </div>
              <ul class="pass-features">
                <li>
                  <ion-icon name="checkmark-circle-outline" color="secondary"></ion-icon>
                  <span>Unlimited Adaptive Mock Tests</span>
                </li>
                <li>
                  <ion-icon name="checkmark-circle-outline" color="secondary"></ion-icon>
                  <span>Advanced Weak Area Analytics</span>
                </li>
                <li>
                  <ion-icon name="checkmark-circle-outline" color="secondary"></ion-icon>
                  <span>Weekly AI Mentor Roadmaps</span>
                </li>
                <li>
                  <ion-icon name="checkmark-circle-outline" color="secondary"></ion-icon>
                  <span>Unlimited PDF Book Summarizer</span>
                </li>
                <li>
                  <ion-icon name="checkmark-circle-outline" color="secondary"></ion-icon>
                  <span>Secure High-Fidelity Study Calls</span>
                </li>
              </ul>
              <ion-button routerLink="/auth" expand="block" color="secondary" class="pass-btn">
                Upgrade Workspace Now
              </ion-button>
              <p class="pass-footer">Secure 256-bit SSL checkout • 7-day moneyback guarantee</p>
            </div>
          </div>
        </section>

        <section class="feature-grid">
          <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 1" id="card-feature-1">
            <ion-card-header>
              <div class="feature-icon-wrapper color-a">
                <span class="feature-number">01</span>
              </div>
              <ion-card-title>Practice Like The Real Exam</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Attempt GATE-style mocks with timers, question palettes, calculators, analytics,
              weak-area tracking, and wrong-answer notes.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 2" id="card-feature-2">
            <ion-card-header>
              <div class="feature-icon-wrapper color-b">
                <span class="feature-number">02</span>
              </div>
              <ion-card-title>Turn Books Into Notes</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Upload PDFs, confirm subjects, save highlights, paraphrase important points, and
              keep an offline-ready revision notebook.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 3" id="card-feature-3">
            <ion-card-header>
              <div class="feature-icon-wrapper color-c">
                <span class="feature-number">03</span>
              </div>
              <ion-card-title>Stay Consistent Daily</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Review formula flashcards, earn XP, protect streaks, join challenges, and generate
              a focused weekly mentor roadmap.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 4" id="card-feature-4">
            <ion-card-header>
              <div class="feature-icon-wrapper color-a">
                <span class="feature-number">04</span>
              </div>
              <ion-card-title>Learn With Peers</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Discuss questions, connect safely, schedule study sessions, and use secure audio
              calls when collaboration helps a concept finally click.
            </ion-card-content>
          </ion-card>
        </section>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .hero-split-container {
      display: grid;
      gap: 32px;
      align-items: center;
      padding: 36px 24px;
      border-radius: var(--gk-radius-lg);
      border: 1px solid rgba(255, 255, 255, 0.8);
      background:
        radial-gradient(
          circle at 12% 12%,
          color-mix(in srgb, var(--page-c) 25%, transparent),
          transparent 35%
        ),
        radial-gradient(
          circle at 90% 10%,
          color-mix(in srgb, var(--page-b) 20%, transparent),
          transparent 35%
        ),
        linear-gradient(
          135deg,
          rgba(255, 252, 244, 0.96),
          rgba(236, 246, 238, 0.82)
        );
      box-shadow: var(--gk-shadow-lifted);
      animation: gk-rise 800ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      position: relative;
    }

    .hero-split-container::before {
      content: "";
      position: absolute;
      inset: 14px 14px auto auto;
      width: 92px;
      height: 92px;
      border: 1px solid rgba(16, 44, 51, 0.08);
      border-radius: 30px;
      background:
        linear-gradient(
          135deg,
          rgba(255, 252, 244, 0.76),
          rgba(255, 255, 255, 0.22)
        ),
        repeating-linear-gradient(
          135deg,
          rgba(16, 44, 51, 0.08) 0 1px,
          transparent 1px 10px
        );
      transform: rotate(10deg);
      opacity: 0.45;
    }

    .hero-content-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
      z-index: 1;
    }

    h1 {
      margin: 8px 0;
      font-size: clamp(2.2rem, 6vw, 3.6rem);
      line-height: 1.1;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
      font-weight: 900;
      background: linear-gradient(135deg, var(--ion-color-dark) 0%, var(--ion-color-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .lead {
      margin: 0;
      color: var(--gk-muted);
      font-size: 1.05rem;
      line-height: 1.7;
      max-width: 38rem;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 8px;
    }

    .hero-actions ion-button {
      margin: 0;
      --padding-start: 24px;
      --padding-end: 24px;
    }

    .trust-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .trust-stat {
      display: flex;
      flex-direction: column;
    }

    .trust-stat strong {
      font-size: 1.05rem;
      color: var(--gk-forest);
      font-weight: 800;
    }

    .trust-stat span {
      font-size: 0.74rem;
      color: var(--gk-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .trust-divider {
      width: 1px;
      height: 24px;
      background: rgba(16, 44, 51, 0.12);
    }

    .hero-visual-column {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .premium-pass-card {
      border: 1px solid rgba(var(--ion-color-secondary-rgb), 0.25);
      border-radius: var(--gk-radius-lg);
      padding: 24px;
      background: linear-gradient(135deg, #ffffff 0%, rgba(224, 242, 238, 0.6) 100%);
      box-shadow: var(--gk-shadow-deep);
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      animation: float 6s ease-in-out infinite;
    }

    .premium-pass-card::before {
      content: "";
      position: absolute;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(var(--ion-color-secondary-rgb), 0.15) 0%, transparent 70%);
      top: -30px;
      right: -30px;
      pointer-events: none;
    }

    .pass-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .pass-badge {
      font-size: 0.7rem;
      background: var(--ion-color-secondary);
      color: #ffffff;
      padding: 4px 8px;
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    .premium-pass-card h3 {
      font-family: var(--font-family-heading);
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--gk-ink);
      margin: 4px 0 0;
    }

    .price {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--ion-color-primary);
      margin: 0;
    }

    .price span {
      font-size: 0.85rem;
      color: var(--gk-muted);
      font-weight: 600;
    }

    .pass-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pass-features li {
      font-size: 0.88rem;
      color: var(--gk-ink);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pass-features li ion-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .pass-btn {
      margin: 8px 0 0 0;
      --box-shadow: 0 8px 24px rgba(var(--ion-color-secondary-rgb), 0.25);
    }

    .pass-footer {
      font-size: 0.72rem;
      color: var(--gk-muted);
      text-align: center;
      margin: 0;
      font-weight: 600;
    }

    .feature-grid {
      display: grid;
      gap: 20px;
      margin-top: 24px;
    }

    .feature-card {
      margin: 0;
      min-height: 220px;
      display: flex;
      flex-direction: column;
    }

    .feature-card ion-card-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 8px;
    }

    .feature-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
    }
    
    .feature-icon-wrapper.color-a {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      color: var(--ion-color-primary);
    }
    .feature-icon-wrapper.color-b {
      background: rgba(var(--ion-color-secondary-rgb), 0.1);
      color: var(--ion-color-secondary);
    }
    .feature-icon-wrapper.color-c {
      background: rgba(var(--ion-color-tertiary-rgb), 0.15);
      color: var(--ion-color-tertiary-shade);
    }

    .feature-number {
      letter-spacing: 0.05em;
    }

    .feature-card ion-card-title {
      font-size: 1.25rem;
      line-height: 1.3;
    }

    .feature-card ion-card-content {
      color: var(--gk-muted);
      line-height: 1.65;
      font-size: 0.95rem;
      flex-grow: 1;
    }

    .animate-feature {
      animation: gk-rise 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      animation-delay: calc(var(--animation-order) * 100ms);
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    @media (min-width: 768px) {
      .hero-split-container {
        grid-template-columns: 1.15fr 0.85fr;
        gap: 40px;
        padding: 56px;
      }
      .hero-actions {
        grid-template-columns: repeat(2, minmax(0, 240px));
      }
      .feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }
    }

    @media (min-width: 1100px) {
      .feature-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `]
})
export class WelcomePage implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('Gurukool - GATE, ESE & PSU Exam Preparation Sanctuary');
    this.meta.updateTag({
      name: 'description',
      content: 'Gurukool is a serene, mobile-first study sanctuary built for GATE, ESE, and PSU aspirants. Access mock tests, adaptive mocks, revision notebooks, and secure peer audio call study rooms.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'GATE preparation, ESE prep, PSU exams preparation, online mock tests, virtual study rooms, formula revision'
    });
  }
}
