import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell stack dashboard-shell">
        
        <!-- Welcome Hero Banner -->
        <header class="dashboard-hero-card glass-card">
          <div class="hero-content">
            <span class="section-kicker">Gurukool Workspace</span>
            <h1>Welcome back, {{ firstName() }}.</h1>
            <p class="subtitle-copy">
              Your exam preparation sanctuary is active. Track your metrics, access your notebooks, and practice mock tests.
            </p>
            <div class="active-badge-chip">
              <span class="pulse-dot"></span>
              <span>GATE & ESE Prep Track active</span>
            </div>
          </div>
          <div class="hero-illustration">
            <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="studying-ambient-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="var(--ion-color-primary)" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="var(--ion-color-primary)" stop-opacity="0" />
                </radialGradient>
                <linearGradient id="lamp-light-cone" x1="55" y1="96" x2="70" y2="148" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#ffb300" stop-opacity="0.6" />
                  <stop offset="100%" stop-color="#ffb300" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="laptop-screen-glow" x1="165" y1="110" x2="165" y2="148" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="var(--ion-color-secondary-tint)" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="var(--ion-color-secondary-tint)" stop-opacity="0" />
                </linearGradient>
              </defs>

              <circle cx="120" cy="100" r="75" fill="url(#studying-ambient-glow)" class="bg-glow" />

              <rect x="94" y="102" width="32" height="42" rx="4" fill="#2d3748" class="chair-back" />
              <line x1="110" y1="144" x2="110" y2="165" stroke="#2d3748" stroke-width="4" class="chair-stem" />

              <path d="M88 150 C88 123 132 123 132 150 Z" fill="#4f46e5" class="student-body" />

              <g class="student-head-group">
                <rect x="107" y="116" width="6" height="8" fill="#fed7aa" />
                <ellipse cx="110" cy="110" rx="11" ry="11" fill="#fed7aa" />
                <circle cx="100" cy="111" r="2" fill="#fed7aa" />
                <path d="M99 106 c0-7 8-10 14-8 c4 1 7 4 7 8 c-3-2-8-2-11 0 c-2 1-6 0-10 0" fill="#1e293b" />
                <circle cx="109" cy="111" r="3.5" fill="none" stroke="#1e293b" stroke-width="1" />
                <line x1="104" y1="109" x2="106" y2="110" stroke="#1e293b" stroke-width="1" />
                <path d="M99 109 A11 11 0 0 1 121 109" fill="none" stroke="#ef4444" stroke-width="2" />
                <rect x="97" y="106" width="3" height="7" rx="1.5" fill="#ef4444" />
                <rect x="120" y="106" width="3" height="7" rx="1.5" fill="#ef4444" />
              </g>

              <ellipse cx="120" cy="154" rx="85" ry="3" fill="#0f172a" opacity="0.08" />
              <rect x="15" y="148" width="210" height="6" rx="3" fill="#cbd5e1" class="desk-surface" />

              <path d="M140 144 L190 144 L194 148 L136 148 Z" fill="#94a3b8" />
              <path d="M148 105 L182 105 L187 144 L143 144 Z" fill="#334155" />
              <path d="M150 107 L180 107 L185 142 L145 142 Z" fill="#0f172a" />
              <polygon points="165,110 135,148 195,148" fill="url(#laptop-screen-glow)" opacity="0.15" style="mix-blend-mode: screen;" />
              <line x1="153" y1="113" x2="168" y2="113" stroke="var(--ion-color-primary)" stroke-width="2.5" stroke-linecap="round" class="code-l1" />
              <line x1="153" y1="120" x2="175" y2="120" stroke="var(--ion-color-secondary)" stroke-width="2.5" stroke-linecap="round" class="code-l2" />
              <line x1="153" y1="127" x2="163" y2="127" stroke="var(--ion-color-tertiary)" stroke-width="2.5" stroke-linecap="round" class="code-l3" />
              <line x1="153" y1="134" x2="172" y2="134" stroke="var(--ion-color-primary-tint)" stroke-width="2.5" stroke-linecap="round" class="code-l4" />

              <polygon points="94,145 122,145 118,148 88,148" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
              <line x1="96" y1="146.5" x2="114" y2="146.5" stroke="#94a3b8" stroke-width="0.6" />

              <path d="M94 136 Q111 138 107 147" fill="none" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" class="arm-write" />
              <line x1="107" y1="147" x2="111" y2="143" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" class="pencil" />

              <path d="M124 135 Q135 137 142 144" fill="none" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" class="arm-type" />

              <path d="M30 148 L46 148 L42 144 L34 144 Z" fill="#475569" />
              <path d="M38 144 Q38 98 55 88" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round" />
              <path d="M50 84 L66 94 L60 102 L44 92 Z" fill="var(--ion-color-primary)" />
              <polygon points="55,96 10,148 130,148" fill="url(#lamp-light-cone)" opacity="0.25" class="lamp-light-beam" style="mix-blend-mode: screen;" />

              <rect x="62" y="140" width="28" height="7" rx="1" fill="var(--ion-color-secondary)" />
              <rect x="86" y="141" width="3" height="5" fill="#ffffff" opacity="0.8" />
              
              <rect x="65" y="133" width="24" height="7" rx="1" fill="var(--ion-color-primary)" />
              <rect x="85" y="134" width="3" height="5" fill="#ffffff" opacity="0.8" />
              
              <g transform="translate(67, 126) rotate(-6)">
                <rect x="0" y="0" width="22" height="7" rx="1" fill="var(--ion-color-tertiary)" />
                <rect x="19" y="1" width="2" height="5" fill="#ffffff" opacity="0.8" />
              </g>

              <path d="M196 136 h10 v9 a4 4 0 0 1 -4 4 h-2 a4 4 0 0 1 -4 -4 z" fill="var(--ion-color-secondary)" />
              <path d="M206 138 c1.5 0 1.5 5 0 5" fill="none" stroke="var(--ion-color-secondary)" stroke-width="1.5" />
              <path d="M199 131 q1 -2 -1 -4 t1 -4" fill="none" stroke="var(--ion-color-secondary)" stroke-width="1" stroke-linecap="round" class="steam-l" />
              <path d="M203 129 q-1 -2 1 -4 t-1 -4" fill="none" stroke="var(--ion-color-secondary)" stroke-width="1" stroke-linecap="round" class="steam-r" />
            </svg>
          </div>
        </header>

        <!-- Student Metrics & Analytics Grid -->
        <section class="metrics-section">
          <h2 class="section-title">Your Study Progress</h2>
          <div class="stat-grid">
            <div class="stat-tile">
              <span class="stat-label">Hours Focused</span>
              <strong class="stat-value">14.5 hr</strong>
              <span class="stat-kicker success-text">↑ 12% this week</span>
            </div>
            <div class="stat-tile">
              <span class="stat-label">Mocks Completed</span>
              <strong class="stat-value">3 / 10</strong>
              <span class="stat-kicker text-muted">Free limit: 3 mocks</span>
            </div>
            <div class="stat-tile">
              <span class="stat-label">Average Score</span>
              <strong class="stat-value">76.4%</strong>
              <span class="stat-kicker gold-text">Top 95th Percentile</span>
            </div>
          </div>
        </section>

        <!-- Dynamic Subscription Upgrade Banner -->
        <div class="premium-banner-wrapper">
          <div class="premium-banner-card glass-card">
            <div class="banner-badge-icon">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-sparkles" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div class="banner-text">
              <span class="banner-kicker">GURUKOOL PRO PASS</span>
              <h2>Unlock Lifetime Premium Access (₹999 Only)</h2>
              <p>Get unlimited adaptive mocks, comprehensive AI weakness analysis, daily flashcard reviews, and unlimited notebook storage with custom roadmaps.</p>
            </div>
            <ion-button color="secondary" class="banner-btn" routerLink="/welcome">
              Upgrade Now 🔒 Pro
            </ion-button>
          </div>
        </div>

        <!-- App Workspace Navigation Grid -->
        <section class="workspace-section">
          <h2 class="section-title">Preparation Workspaces</h2>
          <div class="workspace-grid">
            
            <!-- Mock Test Engine -->
            <article class="workspace-card glass-card" routerLink="/tests">
              <div class="card-icon test-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div class="card-info">
                <h3>Test Sanctuary 🔒 Pro</h3>
                <p>Access adaptively generated chapter tests and full-length simulated GATE mocks.</p>
              </div>
              <div class="card-action-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </article>

            <!-- Books & Notes -->
            <article class="workspace-card glass-card" routerLink="/books">
              <div class="card-icon book-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="card-info">
                <h3>Notebook & E-Books</h3>
                <p>Upload exam PDFs (Max 5MB for Free users) and access instant AI-generated revision summaries.</p>
              </div>
              <div class="card-action-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </article>

            <!-- Community voice -->
            <article class="workspace-card glass-card" routerLink="/community">
              <div class="card-icon community-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div class="card-info">
                <h3>Peer Study Lounge</h3>
                <p>Connect with serious aspirants globally. Active WebRTC study calls (10 mins daily limit on Free tier).</p>
              </div>
              <div class="card-action-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </article>

            <!-- Engagement AI mentor -->
            <article class="workspace-card glass-card" routerLink="/engagement">
              <div class="card-icon mentor-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div class="card-info">
                <h3>AI Mentor Roadmaps</h3>
                <p>Generate optimized syllabus roadmaps (1 roadmap limit per week on Free tier) and complete formula cards.</p>
              </div>
              <div class="card-action-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </article>

          </div>
        </section>

        <!-- System Error Warnings -->
        <ion-note color="danger" class="error-msg-banner" *ngIf="errorMessage()">
          {{ errorMessage() }}
        </ion-note>

      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .dashboard-shell {
      padding-top: 24px;
      padding-bottom: 40px;
    }

    /* Hero Banner Redesign */
    .dashboard-hero-card {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(253, 246, 230, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
      padding: 32px;
      margin: 0 0 12px 0;
      position: relative;
      overflow: hidden;
      animation: gk-rise 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      gap: 32px;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      flex: 1;
    }

    .hero-illustration {
      flex: 0 0 320px;
      width: 320px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .hero-illustration svg {
      width: 100%;
      height: auto;
    }

    /* SVG Animations */
    @keyframes study-steam {
      0% {
        transform: translateY(0) scaleX(1);
        opacity: 0;
      }
      15% {
        opacity: 0.6;
      }
      50% {
        transform: translateY(-4px) scaleX(1.2);
        opacity: 0.3;
      }
      100% {
        transform: translateY(-10px) scaleX(0.8);
        opacity: 0;
      }
    }
    .steam-l {
      animation: study-steam 4s ease-in-out infinite;
      transform-origin: bottom center;
    }
    .steam-r {
      animation: study-steam 4s ease-in-out infinite;
      animation-delay: 2s;
      transform-origin: bottom center;
    }

    @keyframes study-light-pulse {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.28; }
    }
    .lamp-light-beam {
      animation: study-light-pulse 3s ease-in-out infinite;
    }

    @keyframes study-code-blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    .code-l1 { animation: study-code-blink 1.5s ease infinite; }
    .code-l2 { animation: study-code-blink 1.5s ease infinite; animation-delay: 0.3s; }
    .code-l3 { animation: study-code-blink 1.5s ease infinite; animation-delay: 0.6s; }
    .code-l4 { animation: study-code-blink 1.5s ease infinite; animation-delay: 0.9s; }

    @keyframes study-sway {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(2.5deg); }
    }
    .student-head-group {
      animation: study-sway 4s ease-in-out infinite alternate;
      transform-origin: 110px 120px;
    }

    @keyframes study-write {
      0% { transform: translate(0, 0) rotate(0deg); }
      100% { transform: translate(-1px, 0.5px) rotate(-1.5deg); }
    }
    .arm-write, .pencil {
      animation: study-write 0.8s ease-in-out infinite alternate;
      transform-origin: 94px 136px;
    }

    .dashboard-hero-card h1 {
      margin: 8px 0 12px;
      font-size: clamp(2rem, 4.5vw, 3rem);
      font-weight: 850;
      line-height: 1.1;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--ion-color-dark) 30%, var(--ion-color-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle-copy {
      color: var(--gk-muted);
      font-size: 1.02rem;
      line-height: 1.55;
      margin: 0 0 16px;
    }

    .active-badge-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(var(--ion-color-success-rgb), 0.1);
      border: 1px solid rgba(var(--ion-color-success-rgb), 0.2);
      padding: 6px 12px;
      border-radius: 99px;
      font-size: 0.82rem;
      color: var(--ion-color-success-shade);
      font-weight: 600;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--ion-color-success);
      border-radius: 50%;
      animation: gk-pulse 2s infinite;
    }

    /* Premium Callout Upgrade Card */
    .premium-banner-wrapper {
      animation: gk-rise 550ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      margin: 12px 0 24px;
    }

    .premium-banner-card {
      border: 1px solid rgba(var(--ion-color-secondary-rgb), 0.35);
      background: linear-gradient(135deg, rgba(235, 247, 244, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
      box-shadow: var(--gk-shadow-lifted);
      padding: 24px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 20px;
      align-items: center;
      margin: 0;
    }

    .banner-badge-icon {
      width: 48px;
      height: 48px;
      background: rgba(var(--ion-color-secondary-rgb), 0.1);
      border-radius: 12px;
      display: grid;
      place-items: center;
      color: var(--ion-color-secondary);
    }

    .icon-sparkles {
      width: 26px;
      height: 26px;
    }

    .banner-kicker {
      font-size: 0.72rem;
      background: var(--ion-color-secondary);
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.08em;
      display: inline-block;
      margin-bottom: 6px;
    }

    .premium-banner-card h2 {
      font-size: 1.28rem;
      font-weight: 850;
      color: var(--gk-ink);
      margin: 0 0 4px;
    }

    .premium-banner-card p {
      margin: 0;
      color: var(--gk-muted);
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .banner-btn {
      margin: 0;
      --box-shadow: 0 6px 20px rgba(var(--ion-color-secondary-rgb), 0.22);
      font-weight: 700;
    }

    /* Section Typography */
    .section-title {
      font-family: var(--font-family-heading);
      font-size: 1.35rem;
      font-weight: 850;
      color: var(--gk-ink);
      margin: 28px 0 16px;
      letter-spacing: -0.02em;
    }

    /* Stats Dashboard */
    .stat-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .stat-tile {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 20px;
      box-shadow: var(--gk-shadow-soft);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    
    .stat-tile:hover {
      transform: translateY(-4px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--gk-outline-strong);
    }

    .stat-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--gk-muted);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 900;
      color: var(--ion-color-dark);
      letter-spacing: -0.02em;
    }

    .stat-kicker {
      font-size: 0.78rem;
      font-weight: 600;
    }

    .success-text { color: var(--ion-color-success-shade); }
    .gold-text { color: var(--ion-color-tertiary-shade); }

    /* Workspaces Grid */
    .workspace-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
    }

    .workspace-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 20px;
      padding: 24px;
      margin: 0;
      cursor: pointer;
      border: 1px solid var(--gk-outline);
      transition: all 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .workspace-card:hover {
      transform: translateY(-3px) scale(1.008);
      border-color: var(--ion-color-primary-tint);
      box-shadow: var(--gk-shadow-lifted);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .test-icon { background: linear-gradient(135deg, var(--ion-color-primary) 0%, #ff8a47 100%); }
    .book-icon { background: linear-gradient(135deg, var(--ion-color-secondary) 0%, #20dca6 100%); }
    .community-icon { background: linear-gradient(135deg, var(--ion-color-tertiary) 0%, #ffc14d 100%); }
    .mentor-icon { background: linear-gradient(135deg, var(--ion-color-success) 0%, #3cd874 100%); }

    .card-icon svg {
      width: 24px;
      height: 24px;
    }

    .card-info h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--gk-ink);
      margin: 0 0 4px;
    }

    .card-info p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--gk-muted);
      line-height: 1.4;
    }

    .card-action-arrow {
      color: var(--gk-muted);
      width: 20px;
      height: 20px;
      transition: transform 200ms ease;
    }

    .workspace-card:hover .card-action-arrow {
      transform: translateX(4px);
      color: var(--ion-color-primary);
    }

    .error-msg-banner {
      display: block;
      margin-top: 16px;
      padding: 12px;
      border-radius: 12px;
      background: rgba(var(--ion-color-danger-rgb), 0.1);
      border: 1px solid rgba(var(--ion-color-danger-rgb), 0.2);
    }

    /* Responsive adjustments */
    @media (min-width: 768px) {
      .workspace-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .premium-banner-card {
        padding: 32px;
      }
    }

    @media (max-width: 768px) {
      .dashboard-hero-card {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 24px !important;
        padding: 24px !important;
      }
      .hero-content {
        max-width: 100% !important;
      }
      .hero-illustration {
        flex: 0 0 auto !important;
        width: 100% !important;
        max-width: 260px !important;
        align-self: center !important;
      }
      .premium-banner-card {
        grid-template-columns: 1fr;
        text-align: center;
        justify-items: center;
        gap: 16px;
      }
      .banner-btn {
        width: 100%;
      }
    }

    @keyframes gk-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(var(--ion-color-success-rgb), 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(var(--ion-color-success-rgb), 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(var(--ion-color-success-rgb), 0);
      }
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await this.authService.loadProfile();
      await this.authService.loadSessions();
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'We could not refresh the dashboard data.')
      );
    }
  }

  firstName(): string {
    const fullName = this.authService.user()?.full_name?.trim();
    if (!fullName) {
      return 'Student';
    }

    return fullName.split(' ')[0];
  }
}
