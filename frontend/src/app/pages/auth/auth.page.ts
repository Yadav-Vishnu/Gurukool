import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="page-shell auth-layout">
        <ion-card class="glass-card auth-card">
          <ion-card-header>
            <span class="section-kicker">Secure Access</span>
            <ion-card-title>Login to Gurukool</ion-card-title>
            <ion-card-subtitle>
              Choose Google OAuth or mobile OTP. Only one active session stays live at a time.
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
      </div>
    </ion-content>
  `,
  styles: [`
    .auth-layout {
      display: grid;
      place-items: center;
      min-height: 100%;
    }

    .auth-card {
      width: min(100%, 560px);
      margin: 0;
    }

    .field-shell {
      --background: rgba(246, 248, 255, 0.96);
      --border-radius: 18px;
      --padding-start: 14px;
      border: 1px solid var(--gk-outline);
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
      padding: 16px;
      border-radius: 20px;
      background: rgba(255, 247, 238, 0.72);
      border: 1px solid rgba(244, 109, 67, 0.16);
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
