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
      <div class="page-shell stack">
        <section class="hero glass-card">
          <span class="section-kicker">Phase 1 • Core Setup</span>
          <h1>Gurukool</h1>
          <p class="lead">
            A mobile-first study platform for GATE, PSU, and ESE aspirants with secure login,
            single-device sessions, and a backend ready for the next exam features.
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
              <ion-card-title>Frontend Ready</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Angular routing, Ionic mobile UI, Capacitor support, and PWA installability are all
              scaffolded for cross-platform delivery.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card">
            <ion-card-header>
              <ion-card-title>Backend Ready</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Express, PostgreSQL, Redis, OAuth, OTP login, and session enforcement are wired so
              new exam modules can plug in cleanly.
            </ion-card-content>
          </ion-card>

          <ion-card class="glass-card feature-card">
            <ion-card-header>
              <ion-card-title>Production-Minded</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              Helmet, rate limiting, token hashing, session rotation, and strict environment
              configuration are already baked into the Phase 1 foundation.
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
      background: radial-gradient(circle, rgba(30, 136, 229, 0.16), transparent 70%);
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
      max-width: 34rem;
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
    }

    @media (min-width: 768px) {
      .hero {
        padding: 40px;
      }

      .feature-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `],
})
export class WelcomePage {}
