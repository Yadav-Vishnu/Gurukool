import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="page-shell stack welcome-shell">
        <section class="hero glass-card">
          <span class="section-kicker">GATE | PSU | ESE Prep</span>
          <h1>Gurukool</h1>
          <p class="lead">
            A calm, mobile-first study space for serious exam preparation: mock tests, revision
            notebooks, formula streaks, peer learning, and mentor-style guidance in one place.
          </p>

          <div class="hero-actions">
            <ion-button routerLink="/auth" size="large" expand="block">
              Start Secure Login
            </ion-button>
            <ion-button routerLink="/auth" fill="outline" size="large" expand="block">
              Use OTP or Google
            </ion-button>
          </div>
        </section>

        <section class="feature-grid">
          <ion-card class="glass-card feature-card">
            <ion-card-header>
              <span class="feature-number">01</span>
              <ion-card-title>Practice Like The Real Exam</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Attempt GATE-style mocks with timers, question palettes, calculators, analytics,
              weak-area tracking, and wrong-answer notes.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card">
            <ion-card-header>
              <span class="feature-number">02</span>
              <ion-card-title>Turn Books Into Notes</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Upload PDFs, confirm subjects, save highlights, paraphrase important points, and
              keep an offline-ready revision notebook.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card">
            <ion-card-header>
              <span class="feature-number">03</span>
              <ion-card-title>Stay Consistent Daily</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Review formula flashcards, earn XP, protect streaks, join challenges, and generate
              a focused weekly mentor roadmap.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card">
            <ion-card-header>
              <span class="feature-number">04</span>
              <ion-card-title>Learn With Peers</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Discuss questions, connect safely, schedule study sessions, and use secure audio
              calls when collaboration helps a concept finally click.
            </ion-card-content>
          </ion-card>
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .hero {
      padding: 28px 24px;
      position: relative;
      overflow: hidden;
    }

    .hero::after {
      content: "";
      position: absolute;
      inset: auto -10% -20% auto;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(29, 92, 99, 0.18), transparent 70%);
      pointer-events: none;
    }

    h1 {
      margin: 16px 0 12px;
      font-size: clamp(2.4rem, 7vw, 4.4rem);
      line-height: 0.95;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
    }

    .lead {
      margin: 0;
      max-width: 42rem;
      color: var(--gk-muted);
      font-size: 1rem;
      line-height: 1.7;
    }

    .hero-actions {
      display: grid;
      gap: 12px;
      margin-top: 28px;
    }

    .feature-grid {
      display: grid;
      gap: 16px;
    }

    .feature-card {
      margin: 0;
      min-height: 210px;
    }

    .feature-card ion-card-header {
      display: grid;
      gap: 12px;
    }

    .feature-number {
      width: fit-content;
      border: 1px solid color-mix(in srgb, var(--page-b) 24%, transparent);
      border-radius: 999px;
      padding: 6px 10px;
      background: color-mix(in srgb, var(--page-b) 10%, transparent);
      color: var(--gk-forest);
      font-size: 0.76rem;
      font-weight: 900;
      letter-spacing: 0.08em;
    }

    .feature-card ion-card-content {
      color: var(--gk-muted);
      line-height: 1.65;
    }

    @media (min-width: 768px) {
      .hero {
        padding: 40px;
      }

      .feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1100px) {
      .feature-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `],
})
export class WelcomePage {}
