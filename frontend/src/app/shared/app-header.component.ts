import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { SessionRecord } from '../core/models/auth.models';
import { CommunityService } from '../core/services/community.service';
import { CollaborationNotification } from '../core/models/community.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <!-- Hamburger menu trigger on mobile (placed slot="start" for left side alignment) -->
          <ion-button fill="clear" class="hamburger-btn" *ngIf="authService.isAuthenticated()" (click)="toggleMobileMenu($event)">
            <ion-icon [src]="mobileMenuOpen() ? 'assets/svg/close-outline.svg' : 'assets/svg/menu-outline.svg'"></ion-icon>
          </ion-button>

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

          <!-- Notifications Bell and Dropdown -->
          <div class="notifications-wrapper" *ngIf="authService.isAuthenticated()">
            <ion-button fill="clear" class="bell-btn" (click)="toggleNotificationsDropdown($event)" title="Notifications">
              <ion-icon slot="icon-only" src="assets/svg/notifications-outline.svg"></ion-icon>
              <span class="bell-badge" *ngIf="unreadNotificationsCount() > 0">
                {{ unreadNotificationsCount() }}
              </span>
            </ion-button>
            
            <!-- Dropdown Panel -->
            <div class="notifications-dropdown glass-card" [class.open]="showNotificationsDropdown()" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <h3>Recent Notifications</h3>
                <span class="unread-count">{{ unreadNotificationsCount() }} unread</span>
              </div>
              <div class="dropdown-body">
                <div class="notif-list" *ngIf="notifications().length > 0; else noNotifs">
                  <div class="notif-item" *ngFor="let notif of notifications()" [class.unread]="!notif.isRead">
                    <div class="notif-item-body">
                      <strong>{{ notif.title }}</strong>
                      <p>{{ notif.body }}</p>
                    </div>
                    <button type="button" class="btn-mark-read" *ngIf="!notif.isRead" (click)="markNotificationRead(notif, $event)" title="Mark as Read">
                      <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </button>
                  </div>
                </div>
                <ng-template #noNotifs>
                  <div class="empty-notifications">
                    <ion-icon src="assets/svg/notifications-off-outline.svg"></ion-icon>
                    <p>Your notifications inbox is clear.</p>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>

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

      <!-- Mobile dropdown inside header -->
      <div class="mobile-nav-panel" [class.open]="mobileMenuOpen()" *ngIf="authService.isAuthenticated()">
        <nav class="mobile-nav-links">
          <a routerLink="/dashboard" (click)="closeMobileMenu()" [class.active]="isActive('/dashboard')" class="mobile-nav-item">Dashboard</a>
          <a routerLink="/tests" (click)="closeMobileMenu()" [class.active]="isActive('/tests')" class="mobile-nav-item">Tests</a>
          <a routerLink="/books" (click)="closeMobileMenu()" [class.active]="isActive('/books')" class="mobile-nav-item">Books</a>
          <a routerLink="/community" (click)="closeMobileMenu()" [class.active]="isActive('/community')" class="mobile-nav-item">Community</a>
          <a routerLink="/engagement" (click)="closeMobileMenu()" [class.active]="isActive('/engagement')" class="mobile-nav-item">Engagement</a>
        </nav>
      </div>
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

            <!-- â•â•â•â•â•â•â• SECTION 1: Profile Card â•â•â•â•â•â•â• -->
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
                  <button type="button" class="plan-upgrade-action" *ngIf="!isPro()" (click)="openCheckout()">
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

            <!-- ── ── ── ── ── ── ── SECTION 2: Edit Name ── ── ── ── ── ── ── -->
            <div class="settings-section">
              <label class="section-label">Student Name</label>
              <ion-item lines="none" class="custom-field">
                <ion-input
                  [(ngModel)]="nameInput"
                  placeholder="Enter your full name">
                </ion-input>
              </ion-item>
            </div>

            <!-- ── ── ── ── ── ── ── SECTION 3: Avatar Motifs ── ── ── ── ── ── ── -->
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

            <!-- ── ── ── ── ── ── ── SECTION 4: Appearance ── ── ── ── ── ── ── -->
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

              </div>
            </div>

            <!-- ── ── ── ── ── ── ── Preferences Section ── ── ── ── ── ── ── -->
            <div class="settings-section-divider"></div>
            <div class="settings-section">
              <label class="section-label">Preferences</label>
              <div class="pref-toggle-row">
                <ion-label>
                  <strong>Push Notifications</strong>
                  <p class="muted-copy" style="margin-top: 2px;">Get notified about test reminders & study requests</p>
                </ion-label>
                <ion-toggle [checked]="notificationsEnabled()" (ionChange)="toggleNotifications($event)"></ion-toggle>
              </div>

              <div class="pref-toggle-row" style="margin-top: 14px;">
                <ion-label>
                  <strong>Collapse Sidebar</strong>
                  <p class="muted-copy" style="margin-top: 2px;">Keep revision tools neat and compact</p>
                </ion-label>
                <ion-toggle [checked]="sidebarCollapsed()" (ionChange)="toggleSidebar($event)"></ion-toggle>
              </div>
            </div>

            <!-- ── ── ── ── ── ── ── SECTION 5: Active Sessions ── ── ── ── ── ── ── -->
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

            <!-- ── ── ── ── ── ── ── SECTION 6: Actions ── ── ── ── ── ── ── -->
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

      <!-- Simulated Checkout Modal -->
      <div class="modal-backdrop" *ngIf="showCheckoutModal()" (click)="closeCheckout(); $event.stopPropagation()">
        <div class="checkout-modal glass-card" (click)="$event.stopPropagation()">
          <button class="modal-close-btn" (click)="closeCheckout(); $event.stopPropagation()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div class="checkout-header">
            <span class="pro-tag-badge">GURUKOOL PRO PASS</span>
            <h2>Unlock Lifetime Access</h2>
            <p>Practice adaptively, analyze your weaknesses, and simulation exam tracks without limits.</p>
          </div>

          <div class="checkout-body">
            <div class="price-row">
              <span class="price-label">Upgrade Fee</span>
              <span class="price-value">₹999 <small>/ lifetime</small></span>
            </div>

            <!-- Payment Methods -->
            <div class="payment-methods-grid">
              <button class="payment-method-card" [class.active]="selectedPaymentMethod() === 'upi'" (click)="setPaymentMethod('upi'); $event.stopPropagation()">
                <div class="method-icon">📱</div>
                <span>UPI (GPay / PhonePe)</span>
              </button>
              <button class="payment-method-card" [class.active]="selectedPaymentMethod() === 'card'" (click)="setPaymentMethod('card'); $event.stopPropagation()">
                <div class="method-icon">💳</div>
                <span>Credit / Debit Card</span>
              </button>
              <button class="payment-method-card" [class.active]="selectedPaymentMethod() === 'net'" (click)="setPaymentMethod('net'); $event.stopPropagation()">
                <div class="method-icon">🏦</div>
                <span>Net Banking</span>
              </button>
            </div>

            <!-- Simulated UPI inputs or details -->
            <div class="method-details-panel">
              <div *ngIf="selectedPaymentMethod() === 'upi'" class="detail-row stack">
                <label class="input-label">Enter UPI ID</label>
                <input type="text" value="student@okhdfcbank" class="checkout-input" disabled />
              </div>
              <div *ngIf="selectedPaymentMethod() === 'card'" class="detail-row stack">
                <label class="input-label">Card Number</label>
                <input type="text" value="•••• •••• •••• 4242" class="checkout-input" disabled />
              </div>
              <div *ngIf="selectedPaymentMethod() === 'net'" class="detail-row stack">
                <label class="input-label">Selected Bank</label>
                <input type="text" value="State Bank of India (SBI)" class="checkout-input" disabled />
              </div>
            </div>
          </div>

          <div class="checkout-footer">
            <button 
              class="btn-checkout-confirm" 
              [disabled]="isProcessingPayment()"
              (click)="processCheckout(); $event.stopPropagation()">
              <span *ngIf="!isProcessingPayment()">Pay ₹999 & Activate Pass</span>
              <span *ngIf="isProcessingPayment()" class="spinner-row">
                <span class="checkout-spinner"></span>
                Processing Secure Payment...
              </span>
            </button>
            <p class="secure-checkout-notice">🔒 256-bit SSL encrypted transaction</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  readonly communityService = inject(CommunityService);

  // Mobile Nav Signal
  readonly mobileMenuOpen = signal(false);

  // Notifications Signals
  readonly showNotificationsDropdown = signal(false);
  readonly notifications = signal<CollaborationNotification[]>([]);
  readonly unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.isRead).length;
  });

  // Settings Panel Signals
  readonly settingsOpen = signal(false);
  readonly activeTab = signal<'profile' | 'theme' | 'security'>('profile');
  readonly savingProfile = signal(false);
  readonly currentTheme = signal<'light' | 'dark' | 'saffron'>('light');
  readonly notificationsEnabled = signal(true);
  readonly sidebarCollapsed = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isPro = signal(false);

  // Checkout Signals
  readonly showCheckoutModal = signal(false);
  readonly selectedPaymentMethod = signal<'upi' | 'card' | 'net'>('upi');
  readonly isProcessingPayment = signal(false);

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
    const currentUser = this.authService.user();
    const ws = currentUser?.workspaceSettings;
    let savedTheme = ws?.theme || (localStorage.getItem('gurukool-theme') as any) || 'light';
    if (savedTheme === 'forest' || savedTheme === 'ocean') {
      savedTheme = 'light';
    }

    this.currentTheme.set(savedTheme);
    this.applyThemeClass(savedTheme);
    this.isPro.set(localStorage.getItem('gk_pro_active') === 'true');

    if (this.authService.isAuthenticated()) {
      this.loadNotifications();
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

      // Load settings from database-persisted workspace settings
      const ws = currentUser.workspaceSettings;
      if (ws) {
        this.currentTheme.set(ws.theme || 'light');
        this.notificationsEnabled.set(ws.notifications_enabled !== false);
        this.sidebarCollapsed.set(ws.sidebar_collapsed === true);
      }
    }
    this.settingsOpen.set(true);
  }

  closeSettings(): void {
    this.settingsOpen.set(false);
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.showNotificationsDropdown.set(false);
  }

  async loadNotifications(): Promise<void> {
    try {
      const notifs = await this.communityService.listNotifications();
      this.notifications.set(notifs);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }

  toggleNotificationsDropdown(event: Event): void {
    event.stopPropagation();
    // Close mobile menu if open
    this.mobileMenuOpen.set(false);
    this.showNotificationsDropdown.set(!this.showNotificationsDropdown());
  }

  async markNotificationRead(notif: CollaborationNotification, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await this.communityService.markNotificationRead(notif.id);
      this.notifications.update(list =>
        list.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  }

  toggleMobileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    // Close notifications dropdown if open
    this.showNotificationsDropdown.set(false);
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openCheckout(): void {
    this.showCheckoutModal.set(true);
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
  }

  setPaymentMethod(method: 'upi' | 'card' | 'net'): void {
    this.selectedPaymentMethod.set(method);
  }

  async processCheckout(): Promise<void> {
    this.isProcessingPayment.set(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    localStorage.setItem('gk_pro_active', 'true');
    this.isPro.set(true);
    this.isProcessingPayment.set(false);
    this.showCheckoutModal.set(false);
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

    // Also persist theme selection locally for fast bootstrap
    localStorage.setItem('gurukool-theme', this.currentTheme());
    this.applyThemeClass(this.currentTheme());

    try {
      await this.authService.updateProfile({
        full_name: this.nameInput().trim(),
        avatar_url: avatarUrl,
        theme: this.currentTheme(),
        notificationsEnabled: this.notificationsEnabled(),
        sidebarCollapsed: this.sidebarCollapsed()
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
  applyTheme(theme: 'light' | 'dark' | 'saffron'): void {
    this.currentTheme.set(theme);
    localStorage.setItem('gurukool-theme', theme);
    this.applyThemeClass(theme);
  }

  applyThemeClass(theme: any): void {
    document.body.classList.remove('dark-theme', 'saffron-theme', 'forest-theme', 'ocean-theme');
    const targetTheme = (theme === 'forest' || theme === 'ocean') ? 'light' : (theme || 'light');
    if (targetTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (targetTheme === 'saffron') {
      document.body.classList.add('saffron-theme');
    }
  }

  toggleNotifications(event: any): void {
    this.notificationsEnabled.set(event.detail.checked);
  }

  toggleSidebar(event: any): void {
    this.sidebarCollapsed.set(event.detail.checked);
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
