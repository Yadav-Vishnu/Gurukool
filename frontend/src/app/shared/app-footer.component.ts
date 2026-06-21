import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, IonicModule],
  template: `
    <footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-logo">Gurukool</span>
          <p class="footer-tagline">A calm, mobile-first study space for serious exam preparation.</p>
        </div>

        <nav class="footer-links" *ngIf="authService.isAuthenticated()">
          <span class="footer-heading">Navigate</span>
          <a routerLink="/dashboard">Dashboard</a>
          <a routerLink="/tests">Tests</a>
          <a routerLink="/books">Books</a>
          <a routerLink="/community">Community</a>
          <a routerLink="/engagement">Engagement</a>
        </nav>

        <nav class="footer-links">
          <span class="footer-heading">Support & Info</span>
          <a routerLink="/about-us">About Us</a>
          <a routerLink="/contact-us">Contact Us</a>
          <a routerLink="/feedback">Feedback</a>
        </nav>

        <div class="footer-links">
          <span class="footer-heading">Prepare For</span>
          <span>GATE</span>
          <span>PSU Exams</span>
          <span>ESE / IES</span>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; {{ currentYear }} Gurukool. All rights reserved.</span>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: #102c33;
      color: rgba(255, 255, 255, 0.72);
      padding: 12px 24px;
      font-size: 0.88rem;
      line-height: 1.6;
    }

    .footer-inner {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 40px;
      max-width: 1120px;
      margin: 0 auto;
      padding-top: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-logo {
      font-family: var(--font-family-heading);
      font-size: 1.4rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #ffffff;
    }

    .footer-tagline {
      margin: 8px 0 0;
      max-width: 320px;
      color: rgba(255, 255, 255, 0.55);
    }

    .footer-heading {
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 4px;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .footer-links a {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: color 200ms ease;
    }

    .footer-links a:hover {
      color: #ffffff;
    }

    .footer-bottom {
      max-width: 1120px;
      margin: 0 auto;
      padding: 20px 0;
      text-align: center;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.4);
    }

    @media (max-width: 767px) {
      .footer-inner {
        grid-template-columns: 1fr;
        gap: 28px;
      }
    }
  `],
})
export class AppFooterComponent {
  readonly authService = inject(AuthService);
  readonly currentYear = new Date().getFullYear();
}
