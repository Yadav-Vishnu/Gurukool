import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-about-us-page',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack about-shell">
        
        <!-- Hero Header -->
        <header class="glass-card hero-card stack">
          <span class="section-kicker">Gurukool Team Sanctuary</span>
          <h1>About Our Mission & Vision</h1>
          <p class="muted-copy">
            We are dedicated to building a calm, structured, and premium digital classroom for students preparing for competitive exams like GATE, PSU, and ESE.
          </p>
        </header>

        <!-- Mission & Vision Split Layout -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="glass-card info-card stack">
            <div class="card-icon mission-icon">🎯</div>
            <h2>Our Mission</h2>
            <p class="muted-copy">
              To democratize high-fidelity engineering instruction by crafting robust, low-latency, and distraction-free learning environments. We equip students with the tools to master complex calculations, revision indexes, and competitive mock exams.
            </p>
          </div>

          <div class="glass-card info-card stack">
            <div class="card-icon vision-icon">🔮</div>
            <h2>Our Vision</h2>
            <p class="muted-copy">
              To become the global gold standard for exam preparation, transforming stress-driven study methods into mindful daily routines through automated micro-rewards, peer-co collaboration, and personalized AI mentor roadmaps.
            </p>
          </div>
        </section>

        <!-- Our Leadership Team -->
        <section class="glass-card panel-card stack">
          <div class="panel-header">
            <h2>Meet the Educators & Developers</h2>
            <p class="panel-subtitle">The minds molding the Gurukool framework</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="team-member-card glass-card text-center stack p-6 items-center">
              <div class="avatar-ring">
                <span class="avatar-initials">VY</span>
              </div>
              <strong class="member-name">Vishnu Yadav</strong>
              <span class="member-role">Founder & Chief Architect</span>
              <p class="member-bio muted-copy">
                Ex-software researcher committed to creating high-performance WebRTC classrooms and educational micro-services.
              </p>
            </div>

            <div class="team-member-card glass-card text-center stack p-6 items-center">
              <div class="avatar-ring">
                <span class="avatar-initials">SP</span>
              </div>
              <strong class="member-name">Saraswati Prasad</strong>
              <span class="member-role">Academic Advisor & Mentor</span>
              <p class="member-bio muted-copy">
                Professor with 15+ years training ESE/IES candidates in structural calculations and fluid dynamics.
              </p>
            </div>

            <div class="team-member-card glass-card text-center stack p-6 items-center">
              <div class="avatar-ring">
                <span class="avatar-initials">AG</span>
              </div>
              <strong class="member-name">Antigravity AI</strong>
              <span class="member-role">Core Core Engineer</span>
              <p class="member-bio muted-copy">
                Advanced pair-programmer designed by Google DeepMind to refine layouts, optimize assets, and deploy robust web interfaces.
              </p>
            </div>
          </div>
        </section>

        <!-- Contact Section -->
        <section class="glass-card panel-card contact-brief-card stack">
          <h2>Get in Touch</h2>
          <p class="muted-copy">
            Have questions about our syllabus coverage, pricing, or WebRTC channels? Contact us directly.
          </p>
          <div class="contact-details-row">
            <span>📧 support&#64;gurukool.edu</span>
            <span>📍 Sector-62, Noida, UP, India</span>
          </div>
        </section>

      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .about-shell {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .info-card {
      padding: 28px;
      background: #ffffff;
      border: 1.5px solid var(--gk-outline);
      border-radius: 20px;
    }

    body.dark-theme .info-card {
      background: #1f2937;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .card-icon {
      font-size: 2.2rem;
      margin-bottom: 4px;
    }

    .panel-card {
      background: #ffffff;
      border: 1.5px solid var(--gk-outline);
      border-radius: 20px;
      padding: 28px;
    }

    body.dark-theme .panel-card {
      background: #1f2937;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .team-member-card {
      background: rgba(18, 24, 43, 0.02);
      border: 1.5px solid var(--gk-outline);
      border-radius: 16px;
      transition: all 250ms ease;
    }

    body.dark-theme .team-member-card {
      background: #111827;
      border-color: rgba(255, 255, 255, 0.08);
    }

    .team-member-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--ion-color-primary);
    }

    .avatar-ring {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--gk-gold) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.2);
    }

    .avatar-initials {
      font-size: 1.35rem;
      font-weight: 850;
      color: #ffffff;
    }

    .member-name {
      font-size: 1.05rem;
      color: var(--gk-ink);
      font-weight: 850;
      margin-top: 12px;
    }

    .member-role {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--ion-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .member-bio {
      font-size: 0.85rem;
      line-height: 1.45;
    }

    .contact-brief-card {
      background: linear-gradient(135deg, rgba(29, 92, 99, 0.05) 0%, rgba(29, 92, 99, 0.08) 100%);
      border: 1.5px solid rgba(29, 92, 99, 0.15) !important;
    }

    .contact-details-row {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-weight: 700;
      color: var(--gk-ink);
      font-size: 0.95rem;
    }
  `]
})
export class AboutUsPage {}
