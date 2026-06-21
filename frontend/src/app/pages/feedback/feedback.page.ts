import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-feedback-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack feedback-shell">
        
        <!-- Hero Header -->
        <header class="glass-card hero-card stack">
          <span class="section-kicker">Gurukool Growth Sanctuary</span>
          <h1>Share Your Feedback</h1>
          <p class="muted-copy">
            We value your experience. Help us fine-tune the digital sanctuary by providing rating benchmarks and commentary.
          </p>
        </header>

        <!-- Main Form Panel -->
        <section class="glass-card panel-card form-panel stack">
          <h2>Your Rating</h2>
          <p class="panel-subtitle">Select stars to grade your Gurukool experience</p>

          <!-- Success Alert -->
          <div class="alert-bar success-alert" *ngIf="successMessage()">
            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ successMessage() }}</span>
          </div>

          <!-- Error Alert -->
          <div class="alert-bar error-alert" *ngIf="errorMessage()">
            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>

          <form (submit)="onSubmit($event)" class="stack" *ngIf="!submitted()">
            <!-- Interactive Stars Bar -->
            <div class="stars-bar-row">
              <button
                type="button"
                class="star-btn"
                *ngFor="let star of [1, 2, 3, 4, 5]"
                (click)="selectRating(star)"
                [class.active]="star <= rating()">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </button>
              <span class="rating-label" *ngIf="rating() > 0">{{ getRatingLabel(rating()) }}</span>
            </div>

            <div class="custom-input-group">
              <label class="input-label">Detailed Comments & Suggestions</label>
              <ion-item lines="none" class="custom-field">
                <ion-textarea
                  placeholder="Share what you liked, what felt slow, or features you want added to Gurukool..."
                  auto-grow="true"
                  rows="4"
                  [ngModel]="comments()"
                  (ngModelChange)="comments.set($event)"
                  name="comments"
                  required>
                </ion-textarea>
              </ion-item>
            </div>

            <ion-button type="submit" expand="block" color="primary">
              Submit Feedback
            </ion-button>
          </form>
        </section>

      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .feedback-shell {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .form-panel {
      background: #ffffff;
      border: 1.5px solid var(--gk-outline);
      border-radius: 20px;
      padding: 28px;
      max-width: 680px;
      margin: 0 auto;
      width: 100%;
    }

    body.dark-theme .form-panel {
      background: #1f2937;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .stars-bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 16px;
      flex-wrap: wrap;
    }

    .star-btn {
      background: transparent;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: rgba(16, 44, 51, 0.12);
      transition: transform 150ms ease, color 150ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    body.dark-theme .star-btn {
      color: rgba(255, 255, 255, 0.15);
    }

    .star-btn:hover {
      transform: scale(1.18);
    }

    .star-btn.active {
      color: var(--gk-gold, #ffb300);
      filter: drop-shadow(0 2px 8px rgba(255, 179, 0, 0.25));
    }

    .star-btn svg {
      width: 36px;
      height: 36px;
    }

    .rating-label {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--ion-color-secondary-shade);
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .custom-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--gk-muted);
    }

    .custom-field {
      --background: #ffffff;
      --border-radius: 12px;
      border: 2px solid var(--gk-outline);
      border-radius: 12px;
      transition: all 200ms ease;
    }

    body.dark-theme .custom-field {
      --background: #111827;
      border-color: rgba(255, 255, 255, 0.15);
    }

    .custom-field:focus-within {
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.12);
    }

    form ion-button {
      margin-top: 12px;
      font-weight: 800;
    }
  `]
})
export class FeedbackPage {
  readonly rating = signal(0);
  readonly comments = signal('');

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  selectRating(stars: number): void {
    this.rating.set(stars);
  }

  getRatingLabel(stars: number): string {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent!';
      default: return '';
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.rating() === 0) {
      this.errorMessage.set('Please select a star rating first.');
      return;
    }

    if (!this.comments().trim()) {
      this.errorMessage.set('Please write comments before submitting.');
      return;
    }

    this.submitted.set(true);
    this.successMessage.set('Feedback submitted successfully! Thank you for helping us improve.');
  }
}
