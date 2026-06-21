import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell stack welcome-shell">
        
        <!-- Hero Section -->
        <section class="hero-split-container">
          <div class="hero-content-column">
            <span class="section-kicker">
              <span class="pulse-dot"></span>
              GATE | ESE | PSU Study Sanctuary
            </span>
            
            <div class="hero-title-group">
              <h1 class="hero-title">
                A Calm Study Space
              </h1>
              <div class="typewriter-container">
                <span class="typewriter-text">{{ typewriterText() }}</span><span class="cursor">|</span>
              </div>
            </div>
            
            <p class="lead">
              Experience a structured, distraction-free environment. Practice under realistic exam conditions with dynamic question palettes, sync offline-ready notes, automatically analyze weak areas, and collaborate with peers in real-time.
            </p>

            <!-- Icon-only Providers Flex Row on Welcome Page -->
            <div class="welcome-auth-section">
              <span class="auth-row-label">Instant Sign In / Sign Up</span>
              <div class="welcome-providers-row">
                <button 
                  type="button"
                  class="welcome-provider-btn google" 
                  (click)="loginWithGoogle()" 
                  id="btn-login-welcome"
                  title="Continue with Google">
                  <svg class="provider-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </button>

                <button 
                  type="button"
                  class="welcome-provider-btn linkedin" 
                  (click)="loginWithLinkedin()" 
                  title="Continue with LinkedIn">
                  <svg class="provider-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/>
                  </svg>
                </button>

                <button 
                  type="button"
                  class="welcome-provider-btn github" 
                  (click)="loginWithGithub()" 
                  title="Continue with GitHub">
                  <svg class="provider-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="#181717"/>
                  </svg>
                </button>

                <button 
                  type="button"
                  class="welcome-provider-btn phone" 
                  (click)="loginWithPhone()" 
                  id="btn-login-alt-welcome"
                  title="Continue with Mobile OTP">
                  <svg class="provider-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Minimalist trust stats banner -->
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

          <!-- Hero Visual: Premium Pass Card -->
          <div class="hero-visual-column">
            <div class="premium-pass-card glass-card">
              <div class="card-shimmer"></div>
              <div class="pass-header">
                <span class="pass-badge">MOST POPULAR</span>
                <h3>Gurukool Premium Pass</h3>
                <p class="price">₹999<span class="price-duration"> / lifetime access</span></p>
              </div>
              
              <ul class="pass-features">
                <li>
                  <div class="check-icon-wrapper">
                    <ion-icon src="assets/svg/checkmark-sharp.svg" class="check-icon"></ion-icon>
                  </div>
                  <span>Unlimited Adaptive Mock Tests</span>
                </li>
                <li>
                  <div class="check-icon-wrapper">
                    <ion-icon src="assets/svg/checkmark-sharp.svg" class="check-icon"></ion-icon>
                  </div>
                  <span>Advanced Weak Area Analytics</span>
                </li>
                <li>
                  <div class="check-icon-wrapper">
                    <ion-icon src="assets/svg/checkmark-sharp.svg" class="check-icon"></ion-icon>
                  </div>
                  <span>Weekly AI Mentor Roadmaps</span>
                </li>
                <li>
                  <div class="check-icon-wrapper">
                    <ion-icon src="assets/svg/checkmark-sharp.svg" class="check-icon"></ion-icon>
                  </div>
                  <span>Unlimited PDF Book Summarizer</span>
                </li>
                <li>
                  <div class="check-icon-wrapper">
                    <ion-icon src="assets/svg/checkmark-sharp.svg" class="check-icon"></ion-icon>
                  </div>
                  <span>Secure High-Fidelity Study Calls</span>
                </li>
              </ul>
              
              <ion-button routerLink="/auth" expand="block" color="secondary" class="pass-btn">
                Upgrade Workspace Now
                <ion-icon src="assets/svg/arrow-forward-sharp.svg" slot="end"></ion-icon>
              </ion-button>
              <p class="pass-footer">Secure 256-bit SSL checkout • 7-day moneyback guarantee</p>
            </div>
          </div>
        </section>

        <!-- Feature Grid Section -->
        <section class="features-section">
          <div class="section-header ion-text-center">
            <span class="section-kicker">Features</span>
            <h2>Everything you need to crack the exam</h2>
            <p class="section-subtitle">Crafted with attention to detail, designed for distraction-free execution.</p>
          </div>

          <div class="feature-grid">
            <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 1; --feature-glow: rgba(var(--ion-color-primary-rgb), 0.12);" id="card-feature-1">
              <ion-card-header>
                <div class="feature-icon-wrapper color-a">
                  <ion-icon src="assets/svg/clipboard-outline.svg" class="feature-card-icon"></ion-icon>
                </div>
                <ion-card-title>Practice Like The Real Exam</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Attempt GATE-style mocks with precise timers, scientific calculator, dynamic question palettes, instant analytics, and weakness tracking.
              </ion-card-content>
            </ion-card>

            <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 2; --feature-glow: rgba(var(--ion-color-secondary-rgb), 0.12);" id="card-feature-2">
              <ion-card-header>
                <div class="feature-icon-wrapper color-b">
                  <ion-icon src="assets/svg/book-outline.svg" class="feature-card-icon"></ion-icon>
                </div>
                <ion-card-title>Turn Books Into Notes</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Upload revision PDFs, verify subjects, highlight critical code/formulas, paraphrase points, and compile offline-ready personal notebooks.
              </ion-card-content>
            </ion-card>

            <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 3; --feature-glow: rgba(var(--ion-color-tertiary-rgb), 0.16);" id="card-feature-3">
              <ion-card-header>
                <div class="feature-icon-wrapper color-c">
                  <ion-icon src="assets/svg/analytics-outline.svg" class="feature-card-icon"></ion-icon>
                </div>
                <ion-card-title>Stay Consistent Daily</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Protect study streaks, unlock milestones, review personalized flashcards, and coordinate study sessions with interactive mentor roadmaps.
              </ion-card-content>
            </ion-card>

            <ion-card class="glass-card feature-card animate-feature" style="--animation-order: 4; --feature-glow: rgba(var(--ion-color-primary-rgb), 0.12);" id="card-feature-4">
              <ion-card-header>
                <div class="feature-icon-wrapper color-a">
                  <ion-icon src="assets/svg/people-outline.svg" class="feature-card-icon"></ion-icon>
                </div>
                <ion-card-title>Learn With Peers</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Discuss complex concepts in secure channels, schedule group study blocks, and connect via peer-to-peer WebRTC high-fidelity audio calls.
              </ion-card-content>
            </ion-card>
          </div>
        </section>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .welcome-shell {
      padding: clamp(24px, 5vh, 64px) 16px;
      display: flex;
      flex-direction: column;
      gap: 56px;
    }

    .hero-split-container {
      display: grid;
      gap: 40px;
      align-items: center;
      padding: 48px 32px;
      border-radius: var(--gk-radius-lg);
      border: 1px solid rgba(255, 255, 255, 0.7);
      background:
        radial-gradient(
          circle at 10% 20%,
          color-mix(in srgb, var(--page-c) 15%, transparent),
          transparent 40%
        ),
        radial-gradient(
          circle at 90% 80%,
          color-mix(in srgb, var(--page-b) 12%, transparent),
          transparent 40%
        ),
        linear-gradient(
          145deg,
          rgba(255, 255, 255, 0.95) 0%,
          rgba(247, 249, 252, 0.85) 100%
        );
      box-shadow: var(--gk-shadow-deep);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .hero-split-container::before {
      content: "";
      position: absolute;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(var(--ion-color-primary-rgb), 0.05) 0%, transparent 70%);
      top: -100px;
      left: -100px;
      pointer-events: none;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--gk-saffron);
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.9);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
        box-shadow: 0 0 8px var(--gk-saffron);
      }
      100% {
        transform: scale(0.9);
        opacity: 0.8;
      }
    }

    .hero-content-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
      z-index: 2;
    }

    .hero-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .hero-title {
      font-size: clamp(2.4rem, 6vw, 3.8rem);
      line-height: 1.1;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
      font-weight: 900;
      margin: 0;
    }

    .typewriter-container {
      font-family: var(--font-family-heading);
      font-size: clamp(1.4rem, 4vw, 2.2rem);
      font-weight: 800;
      color: var(--gk-forest);
      min-height: 2.6rem;
      display: flex;
      align-items: center;
    }

    .typewriter-text {
      background: linear-gradient(135deg, var(--gk-forest) 0%, var(--gk-saffron) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }

    .cursor {
      animation: blink 0.75s step-end infinite;
      color: var(--gk-saffron);
      font-weight: bold;
      margin-left: 2px;
    }

    @keyframes blink {
      from, to { color: transparent }
      50% { color: var(--gk-saffron) }
    }

    .lead {
      margin: 0;
      color: var(--gk-muted);
      font-size: 1.1rem;
      line-height: 1.75;
      max-width: 42rem;
      font-weight: 500;
    }

    /* Welcome Providers row */
    .welcome-auth-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
      width: 100%;
    }

    .auth-row-label {
      font-size: 0.76rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--gk-muted);
    }

    .welcome-providers-row {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    .welcome-provider-btn {
      width: 56px;
      height: 56px;
      border-radius: var(--gk-radius-md);
      background: var(--gk-paper, #ffffff);
      border: 1.5px solid var(--gk-outline);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--gk-shadow-soft);
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      color: var(--gk-ink);
    }

    .welcome-provider-btn:hover {
      transform: translateY(-3px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--gk-outline-strong);
    }

    .welcome-provider-btn .provider-svg {
      width: 24px;
      height: 24px;
      transition: transform 0.2s ease;
    }

    .welcome-provider-btn:hover .provider-svg {
      transform: scale(1.1);
    }

    .welcome-provider-btn.phone {
      color: var(--gk-muted);
    }
    .welcome-provider-btn.phone:hover {
      color: var(--ion-color-primary);
    }

    .trust-banner {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .trust-stat {
      display: flex;
      flex-direction: column;
    }

    .trust-stat strong {
      font-size: 1.15rem;
      color: var(--gk-forest);
      font-weight: 800;
    }

    .trust-stat span {
      font-size: 0.76rem;
      color: var(--gk-muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .trust-divider {
      width: 1px;
      height: 28px;
      background: rgba(18, 24, 43, 0.08);
    }

    .hero-visual-column {
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2;
    }

    .premium-pass-card {
      border: 1px solid rgba(0, 121, 107, 0.15);
      border-radius: var(--gk-radius-lg);
      padding: 32px;
      background: linear-gradient(145deg, #ffffff 0%, rgba(224, 242, 238, 0.5) 100%);
      box-shadow: var(--gk-shadow-deep);
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: 410px;
      display: flex;
      flex-direction: column;
      gap: 22px;
      transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease;
      animation: float 6s ease-in-out infinite;
    }

    .premium-pass-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 40px 80px rgba(18, 24, 43, 0.25);
    }

    .card-shimmer {
      position: absolute;
      top: 0;
      left: -150%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.4) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: skewX(-25deg);
      animation: shimmer 8s infinite linear;
    }

    @keyframes shimmer {
      0% { left: -150%; }
      30% { left: 150%; }
      100% { left: 150%; }
    }

    .pass-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .pass-badge {
      font-size: 0.72rem;
      background: var(--ion-color-secondary);
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 99px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .premium-pass-card h3 {
      font-size: 1.45rem;
      font-weight: 900;
      color: var(--gk-ink);
      margin: 4px 0 0;
      letter-spacing: -0.02em;
    }

    .price {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--ion-color-primary);
      margin: 4px 0 0;
      letter-spacing: -0.03em;
    }

    .price-duration {
      font-size: 0.9rem;
      color: var(--gk-muted);
      font-weight: 600;
      letter-spacing: 0;
    }

    .pass-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .pass-features li {
      font-size: 0.92rem;
      color: var(--gk-ink);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .check-icon-wrapper {
      width: 22px;
      height: 22px;
      background-color: rgba(var(--ion-color-secondary-rgb), 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .check-icon {
      font-size: 0.85rem;
      color: var(--ion-color-secondary);
      font-weight: bold;
    }

    .pass-btn {
      margin: 10px 0 0 0;
      --box-shadow: 0 10px 24px rgba(var(--ion-color-secondary-rgb), 0.25);
    }

    .pass-footer {
      font-size: 0.72rem;
      color: var(--gk-muted);
      text-align: center;
      margin: 0;
      font-weight: 600;
    }

    /* Features Section */
    .features-section {
      display: flex;
      flex-direction: column;
      gap: 36px;
      margin-top: 24px;
    }

    .section-header {
      max-width: 600px;
      margin: 0 auto;
    }

    .section-header h2 {
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: var(--ion-color-dark);
      margin: 8px 0;
    }

    .section-subtitle {
      color: var(--gk-muted);
      font-size: 1rem;
      font-weight: 500;
      margin: 0;
    }

    .feature-grid {
      display: grid;
      gap: 24px;
    }

    .feature-card {
      margin: 0;
      min-height: 240px;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--gk-outline);
      border-radius: var(--gk-radius-lg);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.35) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: var(--gk-shadow-soft);
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .feature-card:hover {
      transform: translateY(-8px) scale(1.02);
      border-color: var(--feature-glow);
      box-shadow: 0 24px 48px var(--feature-glow), var(--gk-shadow-lifted);
      background-color: var(--gk-paper, #ffffff);
    }

    .feature-card ion-card-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 8px;
    }

    .feature-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease;
    }

    .feature-card:hover .feature-icon-wrapper {
      transform: scale(1.1) rotate(3deg);
    }

    .feature-card-icon {
      font-size: 1.6rem;
    }
    
    .feature-icon-wrapper.color-a {
      background: rgba(var(--ion-color-primary-rgb), 0.08);
      color: var(--ion-color-primary);
    }
    .feature-icon-wrapper.color-b {
      background: rgba(var(--ion-color-secondary-rgb), 0.08);
      color: var(--ion-color-secondary);
    }
    .feature-icon-wrapper.color-c {
      background: rgba(var(--ion-color-tertiary-rgb), 0.12);
      color: var(--ion-color-tertiary-shade);
    }

    .feature-card ion-card-title {
      font-size: 1.25rem;
      line-height: 1.35;
      font-weight: 850;
      letter-spacing: -0.02em;
    }

    .feature-card ion-card-content {
      color: var(--gk-muted);
      line-height: 1.65;
      font-size: 0.95rem;
      flex-grow: 1;
      padding-top: 4px;
      font-weight: 500;
    }

    .animate-feature {
      animation: gk-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--animation-order) * 120ms);
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes gk-rise {
      from {
        opacity: 0;
        transform: translateY(24px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }



    @media (min-width: 768px) {
      .hero-split-container {
        grid-template-columns: 1.15fr 0.85fr;
        gap: 40px;
        padding: 56px;
      }
      .feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 28px;
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly typewriterText = signal('');
  private readonly fullText = 'Space engineered for success';

  loginWithGoogle(): void {
    this.authService.startGoogleLogin();
  }

  loginWithLinkedin(): void {
    this.authService.startLinkedinLogin();
  }

  loginWithGithub(): void {
    this.authService.startGithubLogin();
  }

  loginWithPhone(): void {
    this.router.navigate(['/auth'], { queryParams: { provider: 'phone' } });
  }

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

    this.startTypewriter();
  }

  startTypewriter(): void {
    let index = 0;
    this.typewriterText.set('');
    const interval = setInterval(() => {
      if (index < this.fullText.length) {
        this.typewriterText.update(val => val + this.fullText[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 90);
  }
}
