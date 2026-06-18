import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { SessionRecord } from '../core/models/auth.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <a routerLink="/" class="logo-link">
            <svg class="gk-header-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <!-- Lotus pink gradient -->
                <linearGradient id="lotusGrad" x1="12" y1="58" x2="52" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#ff758c" />
                  <stop offset="100%" stop-color="#ff7eb3" />
                </linearGradient>
                <!-- Veena Gold Gradient -->
                <linearGradient id="veenaGold" x1="10" y1="54" x2="54" y2="10" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#f59e0b" />
                  <stop offset="50%" stop-color="#fbbf24" />
                  <stop offset="100%" stop-color="#f59e0b" />
                </linearGradient>
                <!-- Aura Glow Gradient -->
                <radialGradient id="auraGlow" cx="32" cy="32" r="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#fef08a" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#fef08a" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <!-- Background Aura Glow -->
              <circle cx="32" cy="32" r="28" fill="url(#auraGlow)"/>

              <!-- Lotus Petals (Lord Saraswati's Seat) -->
              <!-- Center Petal -->
              <path d="M32 28 C28 42, 28 54, 32 58 C36 54, 36 42, 32 28 Z" fill="url(#lotusGrad)" opacity="0.95"/>
              <!-- Left Petals -->
              <path d="M32 38 C18 42, 20 54, 32 58 C26 52, 26 42, 32 38 Z" fill="url(#lotusGrad)" opacity="0.85"/>
              <path d="M32 44 C8 44, 14 56, 32 58 C20 54, 24 46, 32 44 Z" fill="url(#lotusGrad)" opacity="0.7"/>
              <!-- Right Petals -->
              <path d="M32 38 C46 42, 44 54, 32 58 C38 52, 38 42, 32 38 Z" fill="url(#lotusGrad)" opacity="0.85"/>
              <path d="M32 44 C56 44, 50 56, 32 58 C44 54, 40 46, 32 44 Z" fill="url(#lotusGrad)" opacity="0.7"/>

              <!-- The Veena (Traditional Musical Instrument of Learning & Arts) -->
              <!-- Bottom Resonator (Gourd) -->
              <circle cx="20" cy="46" r="8" fill="url(#veenaGold)" stroke="#d97706" stroke-width="1.5"/>
              <circle cx="20" cy="46" r="4" fill="#78350f" opacity="0.2"/>
              
              <!-- Upper Resonator (Gourd) -->
              <circle cx="44" cy="22" r="5" fill="url(#veenaGold)" stroke="#d97706" stroke-width="1.5"/>
              
              <!-- Veena Neck / Dandi -->
              <path d="M12 52 L52 12" stroke="url(#veenaGold)" stroke-width="4.5" stroke-linecap="round"/>
              <path d="M11.5 52.5 L52.5 11.5" stroke="#78350f" stroke-width="1"/>
              
              <!-- Strings -->
              <line x1="14" y1="52" x2="48" y2="18" stroke="#ffffff" stroke-width="0.75" opacity="0.9"/>
              <line x1="16" y1="50" x2="50" y2="16" stroke="#ffffff" stroke-width="0.75" opacity="0.9"/>
              
              <!-- Tuners / Pegs -->
              <path d="M49 11 L53 13" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M47 9 L51 11" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
              
              <!-- Veena Head -->
              <path d="M52 12 C54 10, 56 12, 55 15 C54 18, 51 17, 50 16" stroke="url(#veenaGold)" stroke-width="3" stroke-linecap="round" fill="none"/>

              <!-- Small Sacred Tilak/Bindi Dot on the Veena -->
              <circle cx="32" cy="32" r="1.5" fill="#ef4444"/>
            </svg>
            <span class="logo-text">Gurukool</span>
          </a>
        </ion-buttons>

        <nav class="nav-links" *ngIf="authService.isAuthenticated()">
          <a routerLink="/dashboard"
             [class.active]="isActive('/dashboard')"
             class="nav-item">Dashboard</a>
          <a routerLink="/tests"
             [class.active]="isActive('/tests')"
             class="nav-item">Tests</a>
          <a routerLink="/books"
             [class.active]="isActive('/books')"
             class="nav-item">Books</a>
          <a routerLink="/community"
             [class.active]="isActive('/community')"
             class="nav-item">Community</a>
          <a routerLink="/engagement"
             [class.active]="isActive('/engagement')"
             class="nav-item">Engagement</a>
        </nav>

        <ion-buttons slot="end">
          <ion-button *ngIf="!authService.isAuthenticated()" routerLink="/auth" fill="solid" color="primary" size="small">
            Login
          </ion-button>

          <!-- Premium Header Avatar Button -->
          <div class="header-avatar-trigger" *ngIf="authService.isAuthenticated()" (click)="openSettings()">
            <div class="header-avatar-circle">
              <ng-container *ngIf="authService.user()?.avatar_url; else headerInitials">
                <!-- Predefined SVG Avatar -->
                <div class="header-avatar-svg" *ngIf="isPredefinedAvatar(authService.user()?.avatar_url)" [innerHTML]="getPredefinedAvatarSvg(authService.user()?.avatar_url)"></div>
                <!-- Custom image avatar -->
                <img class="header-avatar-img" *ngIf="!isPredefinedAvatar(authService.user()?.avatar_url)" [src]="authService.user()?.avatar_url" alt="Profile" />
              </ng-container>
              <ng-template #headerInitials>
                <span class="header-avatar-initials">{{ userInitials() }}</span>
              </ng-template>
            </div>
            <!-- Online status dot -->
            <span class="header-avatar-status-dot"></span>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Unified Settings Sliding Modal Overlay -->
    <div class="settings-modal-backdrop" [class.open]="settingsOpen()" (click)="closeSettings()">
      <div class="settings-modal-panel" (click)="$event.stopPropagation()">
        
        <header class="settings-header">
          <div class="header-titles">
            <h2>My Workspace</h2>
            <p>Profile, appearance & sessions</p>
          </div>
          <button class="settings-close-btn" (click)="closeSettings()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- Single Scrollable Body (No Tabs) -->
        <main class="settings-main-body">
          <div class="settings-scroll-content">

            <!-- ═══════ SECTION 1: Profile Card ═══════ -->
            <div class="user-profile-glass-card">
              <div class="user-card-banner">
                <div class="banner-circle"></div>
              </div>
              
              <div class="user-card-avatar-wrapper">
                <div class="user-card-avatar-circle" [class.pro-glow]="isPro()">
                  <ng-container *ngIf="authService.user()?.avatar_url; else cardInitials">
                    <div class="card-avatar-svg" *ngIf="isPredefinedAvatar(authService.user()?.avatar_url)" [innerHTML]="getPredefinedAvatarSvg(authService.user()?.avatar_url)"></div>
                    <img class="card-avatar-img" *ngIf="!isPredefinedAvatar(authService.user()?.avatar_url)" [src]="authService.user()?.avatar_url" alt="Profile" />
                  </ng-container>
                  <ng-template #cardInitials>
                    <span class="card-avatar-initials">{{ userInitials() }}</span>
                  </ng-template>
                </div>
                
                <label for="avatar-file-input-header" class="avatar-edit-overlay" title="Upload photo">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="camera-icon">
                    <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                    <path fill-rule="evenodd" d="M9.344 3.071a2.25 2.25 0 00-.422.286L6.516 5.76a.75.75 0 01-.532.22H4.25A2.25 2.25 0 002 8.23v9c0 1.242 1.008 2.25 2.25 2.25h15.5A2.25 2.25 0 0022 17.23v-9a2.25 2.25 0 00-2-2.25h-1.734a.75.75 0 01-.532-.22L15.08 3.357a2.25 2.25 0 00-.422-.286 18.898 18.898 0 00-5.314 0zM8 12.75a4 4 0 118 0 4 4 0 01-8 0z" clip-rule="evenodd" />
                  </svg>
                </label>
                
                <span class="avatar-card-status-dot"></span>
              </div>
              
              <div class="user-card-details">
                <h3 class="user-card-name">{{ nameInput() || authService.user()?.full_name || 'Gurukool Scholar' }}</h3>
                <p class="user-card-email">{{ authService.user()?.email || 'scholar@gurukool.edu' }}</p>
                
                <div class="user-card-plan-box" [class.pro]="isPro()">
                  <div class="plan-badge-container">
                    <span class="plan-icon">{{ isPro() ? '👑' : '🎓' }}</span>
                    <span class="plan-text">{{ isPro() ? 'Gurukool Pro' : 'Basic Plan' }}</span>
                  </div>
                  <button type="button" class="plan-upgrade-action" *ngIf="!isPro()" (click)="activateProNow()">
                    Upgrade to Pro
                  </button>
                  <span class="plan-expiry-text" *ngIf="isPro()">Active ✓</span>
                </div>
              </div>
            </div>

            <!-- Hidden file input for avatar upload -->
            <input
              type="file"
              id="avatar-file-input-header"
              class="hidden-avatar-file-input"
              accept="image/*"
              (change)="onAvatarFileSelected($event)"
            />

            <!-- ═══════ SECTION 2: Edit Name ═══════ -->
            <div class="settings-section">
              <label class="section-label">Student Name</label>
              <ion-item lines="none" class="custom-field">
                <ion-input
                  [(ngModel)]="nameInput"
                  placeholder="Enter your full name">
                </ion-input>
              </ion-item>
            </div>

            <!-- ═══════ SECTION 3: Avatar Motifs ═══════ -->
            <div class="settings-section">
              <label class="section-label">Avatar Motif</label>
              <div class="avatars-picker-grid">
                <div 
                  class="avatar-picker-tile" 
                  *ngFor="let av of predefinedAvatars" 
                  [class.selected]="selectedAvatar() === av.id"
                  (click)="selectPredefinedAvatar(av.id)">
                  <div class="picker-svg-holder" [innerHTML]="getPredefinedAvatarTileSvg(av.svg)"></div>
                  <span class="picker-label">{{ av.name }}</span>
                </div>
              </div>
            </div>

            <!-- Upload Preview (only shows when an image is uploaded) -->
            <div class="avatar-upload-preview-box" *ngIf="uploadedAvatarBase64()">
              <div class="preview-avatar-circle">
                <img [src]="uploadedAvatarBase64()" alt="Uploaded preview" />
              </div>
              <span class="preview-label">{{ uploadedFileName() }}</span>
            </div>

            <!-- ═══════ SECTION 4: Appearance ═══════ -->
            <div class="settings-section-divider"></div>
            <div class="settings-section">
              <label class="section-label">Appearance</label>
              <div class="theme-selection-grid">
                
                <div class="theme-tile-option light-opt" [class.active]="currentTheme() === 'light'" (click)="applyTheme('light')">
                  <div class="theme-visual-box">
                    <div class="visual-dots">
                      <span class="vis-dot orange"></span>
                      <span class="vis-dot green"></span>
                      <span class="vis-dot bg-light-preview"></span>
                    </div>
                  </div>
                  <strong>Light</strong>
                </div>

                <div class="theme-tile-option dark-opt" [class.active]="currentTheme() === 'dark'" (click)="applyTheme('dark')">
                  <div class="theme-visual-box">
                    <div class="visual-dots">
                      <span class="vis-dot white"></span>
                      <span class="vis-dot green"></span>
                      <span class="vis-dot bg-dark-preview"></span>
                    </div>
                  </div>
                  <strong>Dark</strong>
                </div>

                <div class="theme-tile-option saffron-opt" [class.active]="currentTheme() === 'saffron'" (click)="applyTheme('saffron')">
                  <div class="theme-visual-box">
                    <div class="visual-dots">
                      <span class="vis-dot primary"></span>
                      <span class="vis-dot gold"></span>
                      <span class="vis-dot bg-saffron-preview"></span>
                    </div>
                  </div>
                  <strong>Saffron</strong>
                </div>

                <div class="theme-tile-option forest-opt" [class.active]="currentTheme() === 'forest'" (click)="applyTheme('forest')">
                  <div class="theme-visual-box">
                    <div class="visual-dots">
                      <span class="vis-dot forest-primary"></span>
                      <span class="vis-dot forest-secondary"></span>
                      <span class="vis-dot bg-forest-preview"></span>
                    </div>
                  </div>
                  <strong>Forest</strong>
                </div>

                <div class="theme-tile-option ocean-opt" [class.active]="currentTheme() === 'ocean'" (click)="applyTheme('ocean')">
                  <div class="theme-visual-box">
                    <div class="visual-dots">
                      <span class="vis-dot ocean-primary"></span>
                      <span class="vis-dot ocean-secondary"></span>
                      <span class="vis-dot bg-ocean-preview"></span>
                    </div>
                  </div>
                  <strong>Ocean</strong>
                </div>

              </div>
            </div>

            <!-- ═══════ SECTION 5: Active Sessions ═══════ -->
            <div class="settings-section-divider"></div>
            <div class="settings-section">
              <label class="section-label">Active Devices</label>
              
              <ion-list lines="none" class="session-list">
                <ng-container *ngFor="let session of authService.sessions(); trackBy: trackSession">
                  <ion-item *ngIf="session.is_active" class="session-item">
                    <div class="session-device-icon" slot="start">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="icon-device">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <ion-label>
                      <h3 class="device-title">{{ session.device_info.os || 'Windows' }}</h3>
                      <p class="device-browser">{{ session.device_info.browser || 'Chrome' }} · {{ session.device_info.ip }}</p>
                    </ion-label>
                    <ion-badge slot="end" color="success" class="active-badge">Active</ion-badge>
                  </ion-item>
                </ng-container>
              </ion-list>
            </div>

            <!-- ═══════ SECTION 6: Actions ═══════ -->
            <div class="settings-section-divider"></div>
            <div class="session-actions-footer">
              <ion-button fill="outline" color="medium" size="small" (click)="logoutAll()">
                Logout All
              </ion-button>
              <ion-button color="danger" size="small" (click)="logout()">
                Sign Out
              </ion-button>
            </div>

          </div>
        </main>

        <!-- Fixed Footer: Save Button -->
        <footer class="settings-panel-footer">
          <ion-button expand="block" color="primary" class="save-profile-btn" (click)="saveProfileChanges()" [disabled]="savingProfile() || !nameInput().trim()">
            {{ savingProfile() ? 'Saving...' : 'Save Changes' }}
          </ion-button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    ion-toolbar {
      --background: #ffffff;
      --border-width: 0;
      --min-height: 56px;
      --padding-start: 16px;
      --padding-end: 16px;
      border-bottom: 1px solid rgba(16, 44, 51, 0.08);
    }

    .logo-link {
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .gk-header-icon {
      width: 32px;
      height: 32px;
      transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .logo-link:hover .gk-header-icon {
      transform: scale(1.1) rotate(6deg);
    }

    .logo-text {
      font-family: var(--font-family-heading);
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: var(--gk-ink);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 auto;
      padding: 0 16px;
    }

    .nav-item {
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--gk-muted);
      transition: color 200ms ease, background 200ms ease;
      white-space: nowrap;
    }

    .nav-item:hover {
      color: var(--gk-ink);
      background: rgba(16, 44, 51, 0.05);
    }

    .nav-item.active {
      color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      font-weight: 700;
    }

    ion-button {
      --border-radius: 999px;
      font-weight: 700;
      text-transform: none;
      letter-spacing: 0;
    }

    /* ============================== */
    /* Premium Header Avatar Button   */
    /* ============================== */
    .header-avatar-trigger {
      position: relative;
      cursor: pointer;
      margin-left: 8px;
      padding: 3px;
      border-radius: 50%;
      transition: all 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .header-avatar-trigger:hover {
      transform: scale(1.08);
    }

    .header-avatar-trigger:active {
      transform: scale(0.96);
    }

    .header-avatar-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-tertiary) 100%);
      border: 2.5px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 12px rgba(var(--ion-color-primary-rgb), 0.25), 0 0 0 1px rgba(var(--ion-color-primary-rgb), 0.12);
      transition: box-shadow 250ms ease, border-color 250ms ease;
    }

    .header-avatar-trigger:hover .header-avatar-circle {
      box-shadow: 0 4px 18px rgba(var(--ion-color-primary-rgb), 0.35), 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.2);
      border-color: var(--ion-color-primary-tint);
    }

    .header-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-avatar-svg {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-avatar-initials {
      font-size: 0.95rem;
      font-weight: 850;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .header-avatar-status-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--ion-color-success, #00bfa5);
      border: 2px solid #ffffff;
      animation: gk-status-pulse 2.5s infinite;
    }

    @keyframes gk-status-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0, 191, 165, 0.4); }
      50% { box-shadow: 0 0 0 4px rgba(0, 191, 165, 0); }
    }

    /* ============================== */
    /* Settings Modal Panel           */
    /* ============================== */
    /* ============================== */
    /* Settings Modal Panel           */
    /* ============================== */
    .settings-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: rgba(10, 15, 30, 0.45);
      backdrop-filter: blur(12px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 350ms cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      justify-content: flex-end;
    }

    .settings-modal-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .settings-modal-panel {
      width: min(480px, 100vw);
      height: 100%;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(30px);
      border-radius: 0;
      border-left: 1px solid rgba(18, 24, 43, 0.08);
      box-shadow: -15px 0 50px rgba(10, 15, 30, 0.18);
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      margin: 0;
    }

    .settings-modal-backdrop.open .settings-modal-panel {
      transform: translateX(0);
    }

    .settings-header {
      padding: 24px;
      border-bottom: 1px solid var(--gk-outline);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .header-titles h2 {
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: var(--gk-ink);
      margin: 0 0 4px;
    }

    .header-titles p {
      margin: 0;
      font-size: 0.84rem;
      color: var(--gk-muted);
    }

    .settings-close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--gk-outline);
      background: rgba(18, 24, 43, 0.03);
      color: var(--gk-ink);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .settings-close-btn:hover {
      background: rgba(18, 24, 43, 0.08);
      transform: scale(1.08) rotate(90deg);
    }

    .settings-close-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Settings Tabs Navigation - REMOVED (merged into single scroll) */
    .settings-nav-tabs { display: none; }

    /* Tab main content body */
    .settings-main-body {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .settings-scroll-content {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 20px;
      animation: gk-fade 250ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* Section styles */
    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-label {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--gk-muted);
      padding-bottom: 4px;
    }

    .settings-section-divider {
      height: 1px;
      background: var(--gk-outline, rgba(18, 24, 43, 0.08));
      margin: 4px 0;
    }

    @keyframes gk-fade {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }


    /* Redesigned Glassmorphic User Profile Card */
    .user-profile-glass-card {
      position: relative;
      background: linear-gradient(135deg, rgba(240, 90, 40, 0.04) 0%, rgba(255, 179, 0, 0.06) 100%);
      border: 1px solid rgba(240, 90, 40, 0.1);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(18, 24, 43, 0.04);
      margin-bottom: 8px;
    }

    .user-card-banner {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 60px;
      background: linear-gradient(90deg, rgba(240, 90, 40, 0.15), rgba(255, 179, 0, 0.15));
      z-index: 1;
    }

    .banner-circle {
      position: absolute;
      right: -20px;
      top: -20px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--ion-color-tertiary);
      filter: blur(25px);
      opacity: 0.4;
    }

    .user-card-avatar-wrapper {
      position: relative;
      margin-top: 20px;
      z-index: 2;
    }

    .user-card-avatar-circle {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-tertiary) 100%);
      border: 4px solid #ffffff;
      box-shadow: 0 6px 16px rgba(18, 24, 43, 0.12);
      transition: all 300ms ease;
    }

    .user-card-avatar-circle.pro-glow {
      border-color: #ffd700;
      box-shadow: 0 0 20px rgba(255, 179, 0, 0.4), 0 6px 16px rgba(18, 24, 43, 0.15);
    }

    .user-card-avatar-wrapper:hover .user-card-avatar-circle {
      transform: scale(1.03);
    }

    .card-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-avatar-svg {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-avatar-initials {
      font-size: 2.2rem;
      font-weight: 900;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }

    .avatar-edit-overlay {
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 250ms ease;
      z-index: 3;
    }

    .user-card-avatar-wrapper:hover .avatar-edit-overlay {
      opacity: 1;
    }

    .camera-icon {
      width: 24px;
      height: 24px;
      transform: scale(0.8);
      transition: transform 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .user-card-avatar-wrapper:hover .camera-icon {
      transform: scale(1);
    }

    .avatar-card-status-dot {
      position: absolute;
      bottom: 2px;
      right: 4px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--ion-color-success, #00bfa5);
      border: 3px solid #ffffff;
      z-index: 4;
      animation: gk-status-pulse 2s infinite;
    }

    .user-card-details {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;
      z-index: 2;
    }

    .user-card-name {
      font-size: 1.15rem;
      font-weight: 850;
      color: var(--gk-ink);
      margin: 0;
    }

    .user-card-email {
      font-size: 0.82rem;
      color: var(--gk-muted);
      margin: 0 0 10px;
    }

    /* Plan status container */
    .user-card-plan-box {
      width: 100%;
      background: rgba(18, 24, 43, 0.04);
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      transition: all 250ms ease;
    }

    .user-card-plan-box.pro {
      background: linear-gradient(135deg, rgba(255, 179, 0, 0.12) 0%, rgba(240, 90, 40, 0.08) 100%);
      border-color: rgba(255, 179, 0, 0.28);
      box-shadow: 0 4px 12px rgba(255, 179, 0, 0.06);
    }

    .plan-badge-container {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .plan-icon {
      font-size: 1rem;
      display: inline-block;
    }

    .plan-text {
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--gk-ink);
    }

    .user-card-plan-box.pro .plan-text {
      color: #b37d00;
    }

    .plan-upgrade-action {
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-tertiary) 100%);
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 80px;
      font-size: 0.76rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 3px 8px rgba(240, 90, 40, 0.25);
      transition: all 200ms ease;
    }

    .plan-upgrade-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 5px 12px rgba(240, 90, 40, 0.35);
    }

    .plan-upgrade-action:active {
      transform: translateY(1px);
    }

    .plan-expiry-text {
      font-size: 0.72rem;
      font-weight: 700;
      color: #00796b;
      background: rgba(0, 191, 165, 0.12);
      padding: 4px 10px;
      border-radius: 80px;
    }

    /* Inputs styling */
    .input-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--gk-muted);
    }

    .custom-field {
      --background: #ffffff;
      --border-radius: 12px;
      border: 1px solid var(--gk-outline);
      border-radius: 12px;
      transition: all 200ms ease;
    }

    .custom-field:focus-within {
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.15);
    }

    /* Predefined Avatars Gallery */
    .predefined-avatars-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }

    .avatars-picker-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .avatar-picker-tile {
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      padding: 10px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      background: #ffffff;
      transition: all 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .avatar-picker-tile:hover {
      transform: translateY(-2px);
      border-color: var(--gk-outline-strong);
      box-shadow: var(--gk-shadow-soft);
    }

    .avatar-picker-tile.selected {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.03);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.12);
    }

    .picker-svg-holder {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      overflow: hidden;
    }

    .picker-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--gk-muted);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .avatar-picker-tile.selected .picker-label {
      color: var(--ion-color-primary-shade);
    }

    /* Hidden file input */
    .hidden-avatar-file-input {
      display: none;
    }

    .custom-avatar-file-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px dashed var(--gk-outline-strong);
      border-radius: 12px;
      padding: 12px;
      background: rgba(18, 24, 43, 0.02);
      cursor: pointer;
      transition: all 150ms ease;
      color: var(--gk-muted);
      font-size: 0.86rem;
      font-weight: 700;
    }

    .custom-avatar-file-label:hover {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.02);
      color: var(--ion-color-primary-shade);
    }

    .upload-icon-svg {
      width: 18px;
      height: 18px;
    }

    /* Preview avatar image */
    .avatar-upload-preview-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border: 1px solid var(--gk-outline);
      border-radius: 12px;
      background: rgba(18, 24, 43, 0.01);
    }

    .preview-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--gk-muted);
    }

    .preview-avatar-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--ion-color-primary);
    }

    .preview-avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Save profile details btn / footer */
    .settings-panel-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--gk-outline);
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 10;
    }

    .save-profile-btn {
      margin: 0;
      font-weight: 700;
    }

    /* Theme Option Tiles */
    .theme-selection-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .theme-tile-option {
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      padding: 12px;
      cursor: pointer;
      background: #ffffff;
      transition: all 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .theme-tile-option:hover {
      border-color: var(--gk-outline-strong);
      transform: translateY(-2px);
      box-shadow: var(--gk-shadow-soft);
    }

    .theme-tile-option.active {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.02);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.12);
    }

    .theme-visual-box {
      height: 48px;
      border-radius: 10px;
      background: #f7f9fc;
      border: 1px solid var(--gk-outline);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      padding-left: 12px;
      overflow: hidden;
    }

    .dark-opt .theme-visual-box {
      background: #0f172a;
    }

    .saffron-opt .theme-visual-box {
      background: #fffcf4;
      border-color: rgba(240, 90, 40, 0.15);
    }

    .forest-opt .theme-visual-box {
      background: #0b2219;
      border-color: rgba(16, 185, 129, 0.15);
    }

    .ocean-opt .theme-visual-box {
      background: #081124;
      border-color: rgba(20, 184, 166, 0.15);
    }

    .visual-dots {
      display: flex;
      gap: 6px;
      align-items: center;
      width: 100%;
    }

    .vis-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .vis-dot.orange { background: #f05a28; }
    .vis-dot.green { background: #00796b; }
    .vis-dot.white { background: #ffffff; }
    .vis-dot.primary { background: #f05a28; }
    .vis-dot.gold { background: #ffb300; }
    .vis-dot.tertiary { background: #ffb300; }
    
    .vis-dot.forest-primary { background: #10b981; }
    .vis-dot.forest-secondary { background: #86efac; }
    .vis-dot.ocean-primary { background: #14b8a6; }
    .vis-dot.ocean-secondary { background: #38bdf8; }

    .vis-dot.bg-light-preview { background: #f8fafc; border-color: rgba(0,0,0,0.1); }
    .vis-dot.bg-dark-preview { background: #1e293b; }
    .vis-dot.bg-saffron-preview { background: #fffcf4; border-color: rgba(240, 90, 40, 0.15); }
    .vis-dot.bg-forest-preview { background: #143527; }
    .vis-dot.bg-ocean-preview { background: #0c1a36; }

    .theme-tile-option strong {
      font-size: 0.86rem;
      font-weight: 800;
      color: var(--gk-ink);
    }

    .theme-tile-option p {
      margin: 0;
      font-size: 0.72rem;
      line-height: 1.35;
      color: var(--gk-muted);
    }

    /* Security list snapshots */
    .profile-snapshot-innerstack {
      background: rgba(18, 24, 43, 0.02);
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      padding: 16px;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: var(--space-md, 16px);
    }

    .profile-info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 4px;
      border-bottom: 1px solid var(--gk-outline);
    }

    .profile-info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 0.84rem;
      color: var(--gk-muted);
    }

    .info-value {
      font-size: 0.88rem;
      color: var(--gk-ink);
      font-weight: 750;
    }

    /* Sessions in panel */
    .session-list {
      background: transparent;
      padding: 0;
    }

    .session-item {
      --background: #ffffff;
      --border-radius: 16px;
      margin-bottom: 10px;
      border: 1px solid var(--gk-outline);
      box-shadow: var(--gk-shadow-soft);
    }

    .session-device-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(var(--ion-color-dark-rgb), 0.04);
      color: var(--gk-ink);
      display: grid;
      place-items: center;
    }

    .icon-device {
      width: 18px;
      height: 18px;
    }

    .device-title {
      font-size: 0.88rem;
      font-weight: 750;
      margin: 0;
    }

    .device-browser {
      font-size: 0.76rem;
      color: var(--gk-muted);
      margin: 1px 0 0;
    }

    .device-time {
      font-size: 0.72rem;
      color: var(--gk-muted);
      margin: 1px 0 0;
    }

    .active-badge {
      font-weight: 700;
      font-size: 0.7rem;
    }

    .session-actions-footer {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .session-actions-footer ion-button {
      flex: 1;
      margin: 0;
    }

    @media (max-width: 767px) {
      .nav-links {
        display: none;
      }
    }
  `],
})
export class AppHeaderComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  // Settings Panel Signals
  readonly settingsOpen = signal(false);
  readonly activeTab = signal<'profile' | 'theme' | 'security'>('profile');
  readonly savingProfile = signal(false);
  readonly currentTheme = signal<'light' | 'dark' | 'saffron' | 'forest' | 'ocean'>('light');
  readonly errorMessage = signal<string | null>(null);
  readonly isPro = signal(false);

  // Input bindings
  nameInput = signal('');
  customAvatarUrlInput = signal('');
  selectedAvatar = signal<string | null>(null);

  // File Upload Signals
  readonly uploadedFileName = signal<string | null>(null);
  readonly uploadedAvatarBase64 = signal<string | null>(null);

  readonly predefinedAvatars = [
    {
      id: 'saraswati',
      name: 'Peacock Motif',
      svg: `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="featherGradH" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#006064" />
              <stop offset="50%" stop-color="#00838f" />
              <stop offset="100%" stop-color="#00796b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#featherGradH)" />
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
            <linearGradient id="flameGradH" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#d84315" />
              <stop offset="60%" stop-color="#ff8f00" />
              <stop offset="100%" stop-color="#ffeb3b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="#fff8e1" />
          <path d="M50 85 C35 75, 30 55, 42 38 C45 34, 48 25, 50 15 C52 25, 55 34, 58 38 C70 55, 65 75, 50 85 Z" fill="url(#flameGradH)" />
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
            <linearGradient id="sunGradH" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f05a28" />
              <stop offset="100%" stop-color="#ffb300" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#sunGradH)" />
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
            <linearGradient id="ganeshaGradH" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff4e50" />
              <stop offset="100%" stop-color="#f9d423" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#ganeshaGradH)" />
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
            <linearGradient id="cosmicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f2027" />
              <stop offset="50%" stop-color="#203a43" />
              <stop offset="100%" stop-color="#2c5364" />
            </linearGradient>
            <linearGradient id="goldLoop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ffe082" />
              <stop offset="50%" stop-color="#ffb300" />
              <stop offset="100%" stop-color="#ffe082" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#cosmicGrad)" />
          <circle cx="50" cy="50" r="40" stroke="rgba(255, 224, 130, 0.15)" stroke-width="1" fill="none" stroke-dasharray="4 4" />
          <circle cx="50" cy="50" r="34" stroke="rgba(255, 224, 130, 0.1)" stroke-width="1" fill="none" />
          <g stroke="url(#goldLoop)" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9">
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
    const savedTheme = localStorage.getItem('gurukool-theme') as 'light' | 'dark' | 'saffron' | 'forest' | 'ocean';
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
      this.applyThemeClass(savedTheme);
    }
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  async logout(): Promise<void> {
    this.closeSettings();
    await this.authService.logout();
    await this.router.navigate(['/welcome']);
  }

  async logoutAll(): Promise<void> {
    this.closeSettings();
    await this.authService.logoutAll();
  }

  // Avatar Helpers
  isPredefinedAvatar(url: string | null | undefined): boolean {
    return !!url && url.startsWith('predefined:');
  }

  getPredefinedAvatarSvg(url: string | null | undefined): SafeHtml {
    if (!url) return '';
    const id = url.replace('predefined:', '');
    const avatar = this.predefinedAvatars.find(a => a.id === id);
    return avatar ? this.sanitizer.bypassSecurityTrustHtml(avatar.svg) : '';
  }

  getPredefinedAvatarTileSvg(svgString: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }

  userInitials(): string {
    const fullName = this.authService.user()?.full_name?.trim();
    if (!fullName) {
      return 'S';
    }
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  // Settings Panel functions
  openSettings(): void {
    this.isPro.set(localStorage.getItem('gk_pro_active') === 'true');
    const currentUser = this.authService.user();
    if (currentUser) {
      this.nameInput.set(currentUser.full_name);
      this.uploadedFileName.set(null);
      this.uploadedAvatarBase64.set(null);

      if (currentUser.avatar_url && currentUser.avatar_url.startsWith('predefined:')) {
        this.selectedAvatar.set(currentUser.avatar_url.replace('predefined:', ''));
        this.customAvatarUrlInput.set('');
      } else if (currentUser.avatar_url && currentUser.avatar_url.startsWith('data:image')) {
        this.selectedAvatar.set(null);
        this.customAvatarUrlInput.set('');
        this.uploadedAvatarBase64.set(currentUser.avatar_url);
        this.uploadedFileName.set('Uploaded image file');
      } else {
        this.selectedAvatar.set(null);
        this.customAvatarUrlInput.set(currentUser.avatar_url || '');
      }
    }
    this.settingsOpen.set(true);
  }

  closeSettings(): void {
    this.settingsOpen.set(false);
  }

  activateProNow(): void {
    localStorage.setItem('gk_pro_active', 'true');
    this.isPro.set(true);
  }

  selectPredefinedAvatar(id: string): void {
    this.selectedAvatar.set(id);
    this.customAvatarUrlInput.set('');
    this.uploadedFileName.set(null);
    this.uploadedAvatarBase64.set(null);
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.uploadedFileName.set(file.name);
    this.selectedAvatar.set(null);
    this.customAvatarUrlInput.set('');

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedAvatarBase64.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  onUrlInput(): void {
    this.selectedAvatar.set(null);
    this.uploadedFileName.set(null);
    this.uploadedAvatarBase64.set(null);
  }

  async saveProfileChanges(): Promise<void> {
    this.errorMessage.set(null);
    this.savingProfile.set(true);

    let avatarUrl: string | null = null;
    if (this.selectedAvatar()) {
      avatarUrl = `predefined:${this.selectedAvatar()}`;
    } else if (this.uploadedAvatarBase64()) {
      avatarUrl = this.uploadedAvatarBase64();
    } else if (this.customAvatarUrlInput().trim()) {
      avatarUrl = this.customAvatarUrlInput().trim();
    }

    // Also persist theme selection
    localStorage.setItem('gurukool-theme', this.currentTheme());
    this.applyThemeClass(this.currentTheme());

    try {
      await this.authService.updateProfile({
        full_name: this.nameInput().trim(),
        avatar_url: avatarUrl
      });
      this.closeSettings();
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'Could not save profile details.')
      );
    } finally {
      this.savingProfile.set(false);
    }
  }

  // Theming
  applyTheme(theme: 'light' | 'dark' | 'saffron' | 'forest' | 'ocean'): void {
    this.currentTheme.set(theme);
    localStorage.setItem('gurukool-theme', theme);
    this.applyThemeClass(theme);
  }

  applyThemeClass(theme: 'light' | 'dark' | 'saffron' | 'forest' | 'ocean'): void {
    document.body.classList.remove('dark-theme', 'saffron-theme', 'forest-theme', 'ocean-theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (theme === 'saffron') {
      document.body.classList.add('saffron-theme');
    } else if (theme === 'forest') {
      document.body.classList.add('forest-theme');
    } else if (theme === 'ocean') {
      document.body.classList.add('ocean-theme');
    }
  }

  trackSession(_index: number, session: SessionRecord): string {
    return session.id;
  }

  formatDate(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
