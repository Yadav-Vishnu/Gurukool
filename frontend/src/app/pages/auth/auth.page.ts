import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell auth-layout">
        <section class="login-hero glass-card">
          <span class="section-kicker">Join Serious Aspirants</span>
          <h1>Accelerate Your Exam Preparation.</h1>
          <p class="muted-copy">
            Sign in to access mock tests, formulas, community study sessions, and your personal revision notebooks. Gurukool Premium unlocks unlimited adaptive practice, deep weak-area analysis, and Dynamic AI Mentor Roadmaps.
          </p>

          <div class="trust-grid">
            <article>
              <span>Mock Engine</span>
              <strong>Fixed & Adaptive Tests</strong>
            </article>
            <article>
              <span>Revision Space</span>
              <strong>Auto Notebook from PDFs</strong>
            </article>
            <article>
              <span>Study Rooms</span>
              <strong>WebRTC Peer Audio Calls</strong>
            </article>
          </div>
        </section>

        <section class="auth-column">
          <ion-card class="glass-card auth-card">
            <ion-card-header>
              <span class="section-kicker">Student Login</span>
              <ion-card-title>Choose how you want to continue</ion-card-title>
              <ion-card-subtitle>
                Google OAuth is fastest. Mobile OTP is handy when you are on a shared or new device.
              </ion-card-subtitle>
            </ion-card-header>

            <ion-card-content class="stack">
              <ion-button expand="block" fill="solid" color="secondary" (click)="loginWithGoogle()">
                Continue with Google
              </ion-button>

              <div class="divider">
                <span>or use your mobile number</span>
              </div>

              <form [formGroup]="phoneForm" class="stack" (ngSubmit)="sendOtp()">
                <ion-item lines="none" class="field-shell">
                  <ion-label position="stacked">Indian mobile number</ion-label>
                  <ion-input
                    formControlName="phone"
                    inputmode="tel"
                    maxlength="10"
                    placeholder="9876543210">
                  </ion-input>
                </ion-item>

                <ion-note color="danger" *ngIf="phoneForm.controls.phone.touched && phoneForm.controls.phone.invalid">
                  Enter a valid 10-digit Indian mobile number.
                </ion-note>

                <ion-button type="submit" expand="block" [disabled]="loading()">
                  {{ step() === 'otp' ? 'Resend OTP' : 'Send OTP' }}
                </ion-button>
              </form>

              <div *ngIf="step() === 'otp'" class="otp-panel stack">
                <ion-chip color="tertiary" outline="true">
                  <ion-label>OTP sent to +91 {{ currentPhone() }}</ion-label>
                </ion-chip>

                <form [formGroup]="otpForm" class="stack" (ngSubmit)="verifyOtp()">
                  <ion-item lines="none" class="field-shell">
                    <ion-label position="stacked">6-digit OTP</ion-label>
                    <ion-input
                      formControlName="otp"
                      inputmode="numeric"
                      maxlength="6"
                      placeholder="123456">
                    </ion-input>
                  </ion-item>

                  <ion-note color="medium">
                    During local development, the OTP appears in the backend terminal so you can test
                    the flow end-to-end.
                  </ion-note>

                  <ion-button type="submit" expand="block" color="primary" [disabled]="loading()">
                    Verify and continue
                  </ion-button>
                </form>
              </div>

              <ion-note *ngIf="feedback()" [color]="feedbackTone()">
                {{ feedback() }}
              </ion-note>

              <ion-button fill="clear" routerLink="/welcome">
                Back to overview
              </ion-button>
            </ion-card-content>
          </ion-card>
        </section>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .auth-layout {
      display: grid;
      gap: 18px;
      align-items: start;
      min-height: auto;
      padding-top: clamp(22px, 5vh, 48px);
    }

    .login-hero {
      display: grid;
      gap: 18px;
      margin: 0;
      padding: 32px 24px;
      animation: gk-rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .login-hero h1 {
      margin: 0 0 16px;
      font-size: clamp(2.6rem, 8vw, 4.6rem);
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
      font-weight: 900;
      background: linear-gradient(135deg, var(--ion-color-dark) 0%, var(--ion-color-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-wrap: balance;
    }

    .trust-grid {
      display: grid;
      gap: 10px;
    }

    .trust-grid article {
      border: 1px solid var(--gk-outline);
      border-radius: 18px;
      padding: 16px;
      background: #ffffff;
      box-shadow: var(--gk-shadow-soft);
      transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
    }
    
    .trust-grid article:hover {
      transform: translateY(-2px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--gk-outline-strong);
    }

    .trust-grid span {
      display: block;
      color: var(--gk-muted);
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .trust-grid strong {
      display: block;
      margin-top: 6px;
      color: var(--gk-ink);
      line-height: 1.25;
    }

    .auth-column {
      display: grid;
      align-items: start;
    }

    .auth-card {
      margin: 0;
      animation: gk-rise 800ms cubic-bezier(0.2, 0.8, 0.2, 1) 100ms both;
    }

    .field-shell {
      position: relative;
      border-radius: var(--gk-radius-md);
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      box-shadow: var(--gk-shadow-soft);
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    .field-shell:focus-within {
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.15);
    }

    .divider {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 12px;
      align-items: center;
      color: var(--gk-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .divider::before,
    .divider::after {
      content: "";
      height: 1px;
      background: var(--gk-outline);
    }

    .otp-panel {
      padding: 20px;
      border-radius: 20px;
      background: rgba(var(--ion-color-tertiary-rgb), 0.1);
      border: 1px solid rgba(var(--ion-color-tertiary-rgb), 0.2);
    }

    @media (min-width: 860px) {
      .auth-layout {
        grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.78fr);
        gap: 24px;
        padding-top: clamp(36px, 7vh, 72px);
      }

      .login-hero {
        min-height: 560px;
        align-content: center;
        padding: 38px;
      }

      .trust-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .auth-card {
        position: sticky;
        top: 88px;
      }
    }
  `],
})
export class AuthPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<'phone' | 'otp'>('phone');
  readonly currentPhone = signal('');
  readonly loading = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly feedbackTone = signal<'success' | 'danger'>('success');

  readonly phoneForm = this.formBuilder.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
  });

  readonly otpForm = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  async sendOtp(): Promise<void> {
    if (this.phoneForm.invalid) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.feedback.set(null);

    try {
      const phone = this.phoneForm.getRawValue().phone.trim();
      const message = await this.authService.sendOtp(phone);

      this.currentPhone.set(phone);
      this.step.set('otp');
      this.feedbackTone.set('success');
      this.feedback.set(message);
    } catch (error) {
      this.feedbackTone.set('danger');
      this.feedback.set(
        this.authService.readError(error, 'We could not send the OTP right now.')
      );
    } finally {
      this.loading.set(false);
    }
  }

  async verifyOtp(): Promise<void> {
    if (this.otpForm.invalid || !this.currentPhone()) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.feedback.set(null);

    try {
      await this.authService.verifyOtp(
        this.currentPhone(),
        this.otpForm.getRawValue().otp.trim()
      );

      await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error) {
      this.feedbackTone.set('danger');
      this.feedback.set(
        this.authService.readError(error, 'The OTP could not be verified.')
      );
    } finally {
      this.loading.set(false);
    }
  }

  loginWithGoogle(): void {
    this.authService.startGoogleLogin();
  }
}
