import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-contact-us-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack contact-shell">
        
        <!-- Hero Header -->
        <header class="glass-card hero-card stack">
          <span class="section-kicker">Gurukool Support Channels</span>
          <h1>Contact Our Team</h1>
          <p class="muted-copy">
            Have questions or feedback? Drop us a note, and our academic and technical support desk will respond shortly.
          </p>
        </header>

        <!-- Main Form Panel -->
        <section class="glass-card panel-card form-panel stack">
          <h2>Send a Message</h2>
          <p class="panel-subtitle">Average reply time: under 24 hours</p>

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

          <!-- Form Fields -->
          <form (submit)="onSubmit($event)" class="stack" *ngIf="!submitted()">
            <div class="custom-input-group">
              <label class="input-label">Full Name</label>
              <ion-item lines="none" class="custom-field">
                <ion-input
                  type="text"
                  placeholder="e.g. Vishnu Yadav"
                  [ngModel]="name()"
                  (ngModelChange)="name.set($event)"
                  name="name"
                  required>
                </ion-input>
              </ion-item>
            </div>

            <div class="custom-input-group">
              <label class="input-label">Email Address</label>
              <ion-item lines="none" class="custom-field">
                <ion-input
                  type="email"
                  placeholder="e.g. vishnu&#64;gurukool.edu"
                  [ngModel]="email()"
                  (ngModelChange)="email.set($event)"
                  name="email"
                  required>
                </ion-input>
              </ion-item>
            </div>

            <div class="custom-input-group">
              <label class="input-label">Your Message</label>
              <ion-item lines="none" class="custom-field">
                <ion-textarea
                  placeholder="Describe your query, feedback, or suggestion in detail..."
                  auto-grow="true"
                  rows="4"
                  [ngModel]="message()"
                  (ngModelChange)="message.set($event)"
                  name="message"
                  required>
                </ion-textarea>
              </ion-item>
            </div>

            <ion-button type="submit" expand="block" color="primary">
              Send Message
            </ion-button>
          </form>
        </section>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .contact-shell {
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
export class ContactUsPage {
  readonly name = signal('');
  readonly email = signal('');
  readonly message = signal('');

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  onSubmit(event: Event): void {
    event.preventDefault();
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.name().trim() || !this.email().trim() || !this.message().trim()) {
      this.errorMessage.set('All fields are required.');
      return;
    }

    if (!emailPattern.test(this.email().trim())) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    this.submitted.set(true);
    this.successMessage.set('Thank you for getting in touch! We will get back to you shortly.');
  }
}
