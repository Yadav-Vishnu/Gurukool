import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
      <div class="auth-page-container">
        
        <div class="glass-card auth-card-centered">
          
          <div class="auth-card-header ion-text-center">
            <span class="section-kicker">Join Serious Aspirants</span>
            <h2>Sign in to Gurukool</h2>
            <p class="muted-copy">Access Mock tests, textbooks & peer study rooms.</p>
          </div>

          <!-- Icon-only Providers Flex Row -->
          <div class="providers-row">
            
            <button 
              type="button"
              class="provider-btn-icon google" 
              [class.active]="selectedProvider() === 'google'"
              (click)="selectProvider('google')" 
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
              class="provider-btn-icon linkedin" 
              [class.active]="selectedProvider() === 'linkedin'"
              (click)="selectProvider('linkedin')" 
              title="Continue with LinkedIn">
              <svg class="provider-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/>
              </svg>
            </button>

            <button 
              type="button"
              class="provider-btn-icon github" 
              [class.active]="selectedProvider() === 'github'"
              (click)="selectProvider('github')" 
              title="Continue with GitHub">
              <svg class="provider-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="#181717"/>
              </svg>
            </button>

            <button 
              type="button"
              class="provider-btn-icon phone-otp" 
              [class.active]="selectedProvider() === 'phone'"
              (click)="selectProvider('phone')" 
              title="Continue with Mobile OTP">
              <svg class="provider-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </button>

          </div>

          <!-- Phone OTP slide down form -->
          <div class="phone-form-expand-container" *ngIf="selectedProvider() === 'phone' || step() === 'otp'">
            
            <form [formGroup]="phoneForm" class="stack animate-fade-down" (ngSubmit)="sendOtp()" *ngIf="step() === 'phone'">
              <label class="input-label">Indian Mobile Number</label>
              <ion-item lines="none" class="field-shell" [class.field-invalid]="phoneForm.controls.phone.touched && phoneForm.controls.phone.invalid">
                <span class="country-prefix">+91</span>
                <ion-input
                  formControlName="phone"
                  inputmode="tel"
                  maxlength="10"
                  placeholder="9876543210">
                </ion-input>
              </ion-item>
              
              <div class="validation-error" *ngIf="phoneForm.controls.phone.touched && phoneForm.controls.phone.invalid">
                <ion-icon src="assets/svg/alert-circle-outline.svg"></ion-icon>
                <span>Please enter a valid 10-digit Indian mobile number.</span>
              </div>

              <ion-button type="submit" expand="block" [disabled]="loading()" class="btn-submit-phone">
                <span *ngIf="!loading()">Send Verification Code</span>
                <ion-spinner name="crescent" *ngIf="loading()"></ion-spinner>
              </ion-button>
            </form>

            <div *ngIf="step() === 'otp'" class="otp-panel stack animate-fade-down">
              <div class="otp-header-row">
                <span class="phone-tag">Sent to +91 {{ currentPhone() }}</span>
                <button type="button" class="change-phone-btn" (click)="step.set('phone')">Change Number</button>
              </div>

              <form [formGroup]="otpForm" class="stack" (ngSubmit)="verifyOtp()">
                <label class="input-label">6-Digit Verification Code</label>
                <ion-item lines="none" class="field-shell" [class.field-invalid]="otpForm.controls.otp.touched && otpForm.controls.otp.invalid">
                  <ion-input
                    formControlName="otp"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="123456">
                  </ion-input>
                </ion-item>

                <div class="validation-error" *ngIf="otpForm.controls.otp.touched && otpForm.controls.otp.invalid">
                  <ion-icon src="assets/svg/alert-circle-outline.svg"></ion-icon>
                  <span>Verification code must be exactly 6 digits.</span>
                </div>

                <div class="dev-otp-notice">
                  💡 During local development, the OTP is printed in the backend terminal.
                </div>

                <ion-button type="submit" expand="block" color="primary" [disabled]="loading()" class="btn-submit-otp">
                  <span *ngIf="!loading()">Verify and Sign In</span>
                  <ion-spinner name="crescent" *ngIf="loading()"></ion-spinner>
                </ion-button>

                <button type="button" class="btn-resend-otp" [disabled]="loading()" (click)="sendOtp()">
                  Resend Verification Code
                </button>
              </form>
            </div>

          </div>

          <!-- General feedback -->
          <div class="feedback-toast" *ngIf="feedback()" [class.success]="feedbackTone() === 'success'" [class.danger]="feedbackTone() === 'danger'">
            <ion-icon [src]="feedbackTone() === 'success' ? 'assets/svg/checkmark-circle.svg' : 'assets/svg/alert-circle.svg'"></ion-icon>
            <span>{{ feedback() }}</span>
          </div>

          <div class="card-footer ion-text-center">
            <a routerLink="/welcome" class="back-link">
              <ion-icon src="assets/svg/arrow-back-outline.svg"></ion-icon>
              Back to Overview
            </a>
          </div>

        </div>

      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .auth-page-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 180px);
      padding: clamp(24px, 6vh, 64px) 16px;
    }

    .auth-card-centered {
      width: 100%;
      max-width: 440px;
      padding: 40px 32px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: var(--gk-radius-lg);
      box-shadow: var(--gk-shadow-deep);
      animation: gk-rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .auth-card-header h2 {
      margin: 8px 0 4px;
      font-size: 1.65rem;
      font-weight: 900;
      color: var(--ion-color-dark);
      letter-spacing: -0.03em;
    }

    .auth-card-header .muted-copy {
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
    }

    /* Icon-only providers */
    .providers-row {
      display: flex;
      justify-content: center;
      gap: 16px;
    }

    .provider-btn-icon {
      width: 58px;
      height: 58px;
      border-radius: var(--gk-radius-md);
      background: #ffffff;
      border: 1.5px solid var(--gk-outline);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--gk-shadow-soft);
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .provider-btn-icon:hover {
      transform: translateY(-3px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--gk-outline-strong);
    }

    .provider-btn-icon.active {
      border-color: var(--ion-color-primary);
      background-color: rgba(var(--ion-color-primary-rgb), 0.04);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.15);
    }

    .provider-svg {
      width: 24px;
      height: 24px;
      transition: transform 0.2s ease;
    }

    .provider-btn-icon.phone-otp {
      color: var(--gk-muted);
    }

    .provider-btn-icon.phone-otp.active {
      color: var(--ion-color-primary);
    }

    .provider-btn-icon:hover .provider-svg {
      transform: scale(1.1);
    }

    /* Form display */
    .phone-form-expand-container {
      background: rgba(18, 24, 43, 0.02);
      border: 1px solid var(--gk-outline);
      border-radius: var(--gk-radius-md);
      padding: 24px;
      animation: gk-fade-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .input-label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--gk-muted);
      margin-bottom: 8px;
      display: block;
    }

    .field-shell {
      border-radius: var(--gk-radius-sm);
      background: var(--gk-paper);
      --background: var(--gk-paper);
      border: 1.5px solid var(--gk-outline);
      box-shadow: var(--gk-shadow-soft);
      transition: border-color 200ms ease, box-shadow 200ms ease;
      --padding-start: 12px;
      --padding-end: 12px;
    }

    .field-shell:focus-within {
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.15);
    }

    .field-shell.field-invalid {
      border-color: var(--ion-color-danger);
    }

    .country-prefix {
      color: var(--gk-muted);
      font-weight: 700;
      font-size: 0.95rem;
      margin-right: 8px;
    }

    .validation-error {
      color: var(--ion-color-danger);
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }

    .validation-error ion-icon {
      font-size: 1.05rem;
    }

    .btn-submit-phone,
    .btn-submit-otp {
      margin-top: 16px;
      margin-bottom: 0;
    }

    .otp-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .otp-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .phone-tag {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--gk-forest);
      background-color: rgba(0, 121, 107, 0.08);
      padding: 6px 12px;
      border-radius: 99px;
    }

    .change-phone-btn {
      background: none;
      border: none;
      color: var(--ion-color-primary);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }

    .dev-otp-notice {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      color: #b45309;
      font-size: 0.74rem;
      font-weight: 600;
      padding: 10px 14px;
      border-radius: 8px;
      line-height: 1.4;
    }

    .btn-resend-otp {
      background: none;
      border: none;
      color: var(--gk-muted);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      margin-top: 10px;
    }

    .btn-resend-otp:hover {
      color: var(--ion-color-primary);
    }

    .feedback-toast {
      padding: 12px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.86rem;
      font-weight: 600;
      animation: gk-rise 300ms ease both;
    }

    .feedback-toast.success {
      background-color: rgba(0, 191, 165, 0.08);
      color: var(--gk-forest);
      border: 1px solid rgba(0, 191, 165, 0.25);
    }

    .feedback-toast.danger {
      background-color: rgba(255, 23, 68, 0.08);
      color: var(--ion-color-danger);
      border: 1px solid rgba(255, 23, 68, 0.25);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--gk-muted);
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .back-link:hover {
      color: var(--ion-color-primary);
    }

    @keyframes gk-fade-down {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes gk-rise {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 480px) {
      .auth-card-centered {
        padding: 24px 16px;
      }
    }
  `],
})
export class AuthPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<'phone' | 'otp'>('phone');
  readonly currentPhone = signal('');
  readonly loading = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly feedbackTone = signal<'success' | 'danger'>('success');
  readonly selectedProvider = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const provider = params['provider'];
      if (provider) {
        this.selectProvider(provider);
      }
    });
  }

  readonly phoneForm = this.formBuilder.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
  });

  readonly otpForm = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  selectProvider(provider: string): void {
    if (provider === 'phone') {
      if (this.selectedProvider() === 'phone') {
        this.selectedProvider.set(null);
      } else {
        this.selectedProvider.set('phone');
        this.step.set('phone');
        this.feedback.set(null);
      }
    } else {
      this.selectedProvider.set(provider);
      this.feedback.set(null);
      if (provider === 'google') this.loginWithGoogle();
      if (provider === 'github') this.loginWithGithub();
      if (provider === 'linkedin') this.loginWithLinkedin();
    }
  }

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

  loginWithGithub(): void {
    this.authService.startGithubLogin();
  }

  loginWithLinkedin(): void {
    this.authService.startLinkedinLogin();
  }
}
