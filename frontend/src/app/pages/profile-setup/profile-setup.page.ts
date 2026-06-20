import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="profile-setup-container">
        <section class="setup-card glass-card">
          <div class="setup-header ion-text-center">
            <span class="section-kicker">Welcome to Gurukool</span>
            <h2>Personalize Your Workspace</h2>
            <p class="muted-copy">
              Set up your student profile to access mocks, revision notebooks, and study groups.
            </p>
          </div>

          <form [formGroup]="setupForm" class="stack" (ngSubmit)="completeSetup()">
            <!-- Step 1: Student Name -->
            <div class="setup-section">
              <label class="section-label">Your Full Name <span class="required">*</span></label>
              <ion-item lines="none" class="field-shell" [class.field-invalid]="setupForm.controls.fullName.touched && setupForm.controls.fullName.invalid">
                <ion-input
                  formControlName="fullName"
                  placeholder="e.g. Satyakama Jabala"
                  maxlength="50">
                </ion-input>
              </ion-item>
              <div class="validation-error" *ngIf="setupForm.controls.fullName.touched && setupForm.controls.fullName.invalid">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span>Full name is required (minimum 3 characters).</span>
              </div>
            </div>

            <!-- Step 2: Choose an Avatar Motif -->
            <div class="setup-section">
              <label class="section-label">Select a Motif <span class="required">*</span></label>
              <p class="muted-copy sub-label">Choose a spiritual learning motif or upload a photo below.</p>
              
              <div class="avatars-picker-grid">
                <div 
                  class="avatar-picker-tile" 
                  *ngFor="let av of predefinedAvatars" 
                  [class.selected]="selectedAvatar() === av.id"
                  (click)="selectPredefinedAvatar(av.id)">
                  <div class="picker-svg-holder" [innerHTML]="getSafeSvg(av.svg)"></div>
                  <span class="picker-label">{{ av.name }}</span>
                </div>
              </div>
            </div>

            <!-- Step 3: Custom File Upload option -->
            <div class="setup-section">
              <div class="divider">
                <span>or upload your own photo</span>
              </div>

              <div class="upload-trigger-container ion-text-center">
                <label for="avatar-file-input" class="upload-dropzone">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" class="upload-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{{ uploadedFileName() || 'Drag and drop or browse file' }}</span>
                </label>
                <input
                  type="file"
                  id="avatar-file-input"
                  class="hidden-file-input"
                  accept="image/*"
                  (change)="onFileSelected($event)"
                />
              </div>

              <!-- Upload Preview -->
              <div class="avatar-upload-preview-box ion-text-center animate-fade" *ngIf="uploadedAvatarBase64()">
                <div class="preview-avatar-circle">
                  <img [src]="uploadedAvatarBase64()" alt="Custom avatar preview" />
                </div>
                <span class="preview-label">Ready to upload</span>
              </div>
            </div>

            <!-- Feedback Message -->
            <div class="feedback-toast danger" *ngIf="feedback()">
              <ion-icon name="alert-circle"></ion-icon>
              <span>{{ feedback() }}</span>
            </div>

            <!-- Save Action Button -->
            <ion-button 
              type="submit" 
              expand="block" 
              color="primary" 
              class="save-btn" 
              [disabled]="loading() || setupForm.invalid || (!selectedAvatar() && !uploadedAvatarBase64())">
              <span *ngIf="!loading()">Complete Profile Setup</span>
              <ion-spinner name="crescent" *ngIf="loading()"></ion-spinner>
            </ion-button>
          </form>
        </section>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .profile-setup-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 180px);
      padding: clamp(24px, 6vh, 64px) 16px;
    }

    .setup-card {
      width: 100%;
      max-width: 580px;
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

    .setup-header h2 {
      margin: 8px 0 4px;
      font-size: 1.65rem;
      font-weight: 900;
      color: var(--ion-color-dark);
      letter-spacing: -0.03em;
    }

    .setup-header .muted-copy {
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
    }

    .setup-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--gk-muted);
    }

    .required {
      color: var(--ion-color-danger);
    }

    .sub-label {
      font-size: 0.82rem;
      margin-top: -6px;
      margin-bottom: 4px;
    }

    .field-shell {
      border-radius: var(--gk-radius-sm);
      background: #ffffff;
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

    .validation-error {
      color: var(--ion-color-danger);
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .avatars-picker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 12px;
      margin-top: 4px;
    }

    .avatar-picker-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      background: #ffffff;
      border: 1.5px solid var(--gk-outline);
      border-radius: var(--gk-radius-md);
      cursor: pointer;
      box-shadow: var(--gk-shadow-soft);
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .avatar-picker-tile:hover {
      transform: translateY(-3px);
      border-color: var(--gk-outline-strong);
      box-shadow: var(--gk-shadow-lifted);
    }

    .avatar-picker-tile.selected {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.04);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.15);
    }

    .picker-svg-holder {
      width: 46px;
      height: 46px;
      margin-bottom: 10px;
      transition: transform 0.2s ease;
    }

    .avatar-picker-tile.selected .picker-svg-holder {
      transform: scale(1.15);
    }

    .picker-label {
      font-size: 0.74rem;
      font-weight: 800;
      color: var(--ion-color-dark);
      text-align: center;
    }

    .divider {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 12px;
      align-items: center;
      color: var(--gk-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 16px 0;
    }

    .divider::before,
    .divider::after {
      content: "";
      height: 1px;
      background: var(--gk-outline);
    }

    .upload-trigger-container {
      display: flex;
      justify-content: center;
    }

    .upload-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 24px;
      border: 2px dashed var(--gk-outline);
      border-radius: var(--gk-radius-md);
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .upload-dropzone:hover {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.01);
    }

    .upload-icon {
      width: 32px;
      height: 32px;
      color: var(--gk-muted);
      margin-bottom: 10px;
    }

    .upload-dropzone span {
      font-size: 0.85rem;
      color: var(--gk-muted);
      font-weight: 700;
    }

    .hidden-file-input {
      display: none;
    }

    .avatar-upload-preview-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 18px;
    }

    .preview-avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      border: 3.5px solid var(--ion-color-primary);
      box-shadow: var(--gk-shadow-lifted);
      margin-bottom: 8px;
    }

    .preview-avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .preview-label {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--ion-color-success);
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

    .feedback-toast.danger {
      background-color: rgba(255, 23, 68, 0.08);
      color: var(--ion-color-danger);
      border: 1px solid rgba(255, 23, 68, 0.25);
    }

    .save-btn {
      margin-top: 16px;
      margin-bottom: 0;
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

    .animate-fade {
      animation: gk-rise 400ms ease both;
    }

    @media (max-width: 480px) {
      .setup-card {
        padding: 24px 16px;
      }
    }
  `],
})
export class ProfileSetupPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(false);
  readonly feedback = signal<string | null>(null);

  // Form
  readonly setupForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
  });

  // Selected Options
  readonly selectedAvatar = signal<string | null>(null);
  readonly uploadedFileName = signal<string | null>(null);
  readonly uploadedAvatarBase64 = signal<string | null>(null);

  // Match the exact predefined avatars list from AppHeaderComponent
  readonly predefinedAvatars = [
    {
      id: 'saraswati',
      name: 'Peacock Motif',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="featherGradS" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#006064" />
              <stop offset="50%" stop-color="#00838f" />
              <stop offset="100%" stop-color="#00796b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#featherGradS)" />
          <path d="M50 85 C50 60, 48 30, 50 15 C52 30, 50 60, 50 85" stroke="#ffe082" stroke-width="2" fill="none" />
          <path d="M50 45 C40 35, 30 40, 50 65 C70 40, 60 35, 50 45" fill="#0277bd" opacity="0.85"/>
          <circle cx="50" cy="50" r="10" fill="#e0f7fa" opacity="0.9"/>
          <circle cx="50" cy="50" r="6" fill="#1565c0" />
        </svg>
      `
    },
    {
      id: 'flame',
      name: 'Spiritual Flame',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flameGradS" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#d84315" />
              <stop offset="60%" stop-color="#ff8f00" />
              <stop offset="100%" stop-color="#ffeb3b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="#fff8e1" />
          <path d="M50 85 C35 75, 30 55, 42 38 C45 34, 48 25, 50 15 C52 25, 55 34, 58 38 C70 55, 65 75, 50 85 Z" fill="url(#flameGradS)" />
          <path d="M50 82 C42 75, 38 62, 45 50 C48 46, 50 25, 50 25 C50 25, 52 46, 55 50 C62 62, 58 75, 50 82 Z" fill="#ffeb3b" opacity="0.8" />
        </svg>
      `
    },
    {
      id: 'yogi',
      name: 'Scholar Yogi',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sunGradS" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f05a28" />
              <stop offset="100%" stop-color="#ffb300" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#sunGradS)" />
          <path d="M30 75 C40 70, 60 70, 70 75 C60 82, 40 82, 30 75 Z" fill="#ffffff" opacity="0.3" />
          <circle cx="50" cy="40" r="8" fill="#ffffff" />
          <path d="M50 49 C45 49, 41 55, 41 62 C41 67, 45 72, 50 72 C55 72, 59 67, 59 62 C59 55, 55 49, 50 49 Z" fill="#ffffff" />
          <path d="M36 70 C36 65, 42 63, 50 63 C58 63, 64 65, 64 70" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" />
        </svg>
      `
    },
    {
      id: 'lotus',
      name: 'Lotus Blossom',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" fill="#e0f2f1" />
          <g fill="#00796b" opacity="0.85">
            <path d="M50 25 C45 35, 45 55, 50 75 C55 55, 55 35, 50 25 Z" />
            <path d="M50 30 C35 38, 38 60, 50 75 C62 60, 65 38, 50 30 Z" opacity="0.8"/>
            <path d="M50 38 C25 45, 30 65, 50 75 C70 65, 75 45, 50 38 Z" opacity="0.6"/>
          </g>
          <circle cx="50" cy="74" r="3" fill="#ffb300" />
        </svg>
      `
    },
    {
      id: 'owl',
      name: 'Scholar Owl',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" fill="#37474f" />
          <path d="M30 70 C30 50, 40 35, 50 35 C60 35, 70 50, 70 70 C60 76, 40 76, 30 70 Z" fill="#eceff1" />
          <circle cx="43" cy="52" r="8" fill="#ffffff" />
          <circle cx="43" cy="52" r="4" fill="#37474f" />
          <circle cx="57" cy="52" r="8" fill="#ffffff" />
          <circle cx="57" cy="52" r="4" fill="#37474f" />
          <polygon points="50,56 47,62 53,62" fill="#ffb300" />
          <polygon points="50,22 68,28 50,34 32,28" fill="#ffb300" />
          <rect x="46" y="27" width="8" height="8" fill="#ffb300" />
        </svg>
      `
    },
    {
      id: 'cap',
      name: 'Scholar Cap',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" fill="#1565c0" />
          <polygon points="50,25 80,38 50,51 20,38" fill="#ffffff" />
          <path d="M35 45 L35 58 C35 65, 65 65, 65 58 L65 45" fill="#ffffff" opacity="0.8" />
          <path d="M50 38 L72 48 L72 58" stroke="#ffb300" stroke-width="2" stroke-linecap="round" fill="none" />
          <circle cx="72" cy="60" r="2" fill="#ffb300" />
        </svg>
      `
    },
    {
      id: 'ganesha',
      name: 'Ganesha Motif',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ganeshaGradS" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff4e50" />
              <stop offset="100%" stop-color="#f9d423" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#ganeshaGradS)" />
          <path d="M50 20 L53 30 L47 30 Z" fill="#ffffff" />
          <path d="M44 24 L56 24" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
          <circle cx="50" cy="16" r="2.5" fill="#fadb14" />
          <path d="M50 30 C56 30, 58 36, 54 44 C51 49, 44 49, 44 56 C44 64, 56 68, 56 58 C56 54, 52 53, 52 50 C52 47, 54 46, 55 45 C58 42, 60 38, 59 34 Z" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M44 45 L40 46" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
          <path d="M47 34 C36 34, 34 44, 44 48" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M53 34 C64 34, 66 44, 56 48" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="1 1" opacity="0.8" />
          <path d="M50 33 L50 39" stroke="#d48806" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="50" cy="41" r="1.5" fill="#ff4e50" />
        </svg>
      `
    },
    {
      id: 'infinite',
      name: 'Cosmic Loop',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cosmicGradS" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f2027" />
              <stop offset="50%" stop-color="#203a43" />
              <stop offset="100%" stop-color="#2c5364" />
            </linearGradient>
            <linearGradient id="goldLoopS" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ffe082" />
              <stop offset="50%" stop-color="#ffb300" />
              <stop offset="100%" stop-color="#ffe082" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#cosmicGradS)" />
          <circle cx="50" cy="50" r="40" stroke="rgba(255, 224, 130, 0.15)" stroke-width="1" fill="none" stroke-dasharray="4 4" />
          <circle cx="50" cy="50" r="34" stroke="rgba(255, 224, 130, 0.1)" stroke-width="1" fill="none" />
          <g stroke="url(#goldLoopS)" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9">
            <path d="M50 50 C38 38, 26 50, 38 62 C50 50, 62 38, 74 50 C62 62, 50 50, 50 50 Z" />
            <path d="M50 50 C38 62, 50 74, 62 62 C50 50, 38 38, 50 26 C62 38, 50 50, 50 50 Z" opacity="0.75" />
          </g>
          <circle cx="50" cy="50" r="4" fill="#ffffff" />
          <circle cx="50" cy="50" r="6" stroke="#ffb300" stroke-width="1" fill="none" />
        </svg>
      `
    }
  ];

  ngOnInit(): void {
    const currentUser = this.authService.user();
    if (currentUser) {
      this.setupForm.patchValue({
        fullName: currentUser.full_name || ''
      });

      if (currentUser.avatar_url && currentUser.avatar_url.startsWith('predefined:')) {
        this.selectedAvatar.set(currentUser.avatar_url.replace('predefined:', ''));
      } else if (currentUser.avatar_url && currentUser.avatar_url.startsWith('data:image')) {
        this.uploadedAvatarBase64.set(currentUser.avatar_url);
        this.uploadedFileName.set('Pre-uploaded image');
      } else {
        // Fall back to a default motif if none set
        this.selectedAvatar.set('saraswati');
      }
    } else {
      this.selectedAvatar.set('saraswati');
    }
  }

  getSafeSvg(svgString: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }

  selectPredefinedAvatar(id: string): void {
    this.selectedAvatar.set(id);
    this.uploadedFileName.set(null);
    this.uploadedAvatarBase64.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.uploadedFileName.set(file.name);
    this.selectedAvatar.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedAvatarBase64.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async completeSetup(): Promise<void> {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.feedback.set(null);

    let avatarUrl: string | null = null;
    if (this.selectedAvatar()) {
      avatarUrl = `predefined:${this.selectedAvatar()}`;
    } else if (this.uploadedAvatarBase64()) {
      avatarUrl = this.uploadedAvatarBase64();
    }

    try {
      await this.authService.updateProfile({
        full_name: this.setupForm.getRawValue().fullName.trim(),
        avatar_url: avatarUrl,
        profileCompleted: true
      });

      await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error) {
      this.feedback.set(
        this.authService.readError(error, 'Could not complete profile setup. Please try again.')
      );
    } finally {
      this.loading.set(false);
    }
  }
}
