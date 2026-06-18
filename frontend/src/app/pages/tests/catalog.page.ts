import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { TestEngineService } from '../../core/services/test-engine.service';
import {
  AdaptiveStartPayload,
  CatalogFilters,
  ExamCode,
  TestCatalogItem,
  TestType,
} from '../../core/models/test-engine.models';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

type CatalogFilter = 'all' | TestType;

@Component({
  selector: 'app-test-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell stack catalog-shell">
        
        <!-- Hero Section -->
        <header class="glass-card hero-card">
          <div class="hero-text-content">
            <span class="section-kicker">Mock Test Sanctuary</span>
            <h1>AI Adaptive Mocks & Test Catalog</h1>
            <p class="subtitle-copy">
              Leverage AI-driven adaptive diagnostics to identify weaknesses or customize full-length past papers for GATE, ESE, and premier PSUs.
            </p>
          </div>
          <div class="hero-stats-bar">
            <div class="hero-stat-item">
              <span class="stat-num text-gradient">98.4%</span>
              <span class="stat-desc">Target Percentile</span>
            </div>
            <div class="hero-stat-item">
              <span class="stat-num text-gradient">24/7</span>
              <span class="stat-desc">AI Evaluation</span>
            </div>
          </div>
        </header>

        <!-- Premium Pro Hub (Combines Pro Banner and Adaptive Generator) -->
        <div class="premium-pro-hub glass-card">
          <!-- Left: Pro Pass Banner -->
          <div class="pro-pass-banner">
            <div class="banner-badge-icon">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-sparkles" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div class="banner-body">
              <span class="pro-tag" [class.active-tag]="isProActive()">
                {{ isProActive() ? 'GURUKOOL PRO ACTIVE 👑' : 'GURUKOOL PRO PASS' }}
              </span>
              <div class="banner-title-row">
                <h3>{{ isProActive() ? 'Your Premium Pass is Fully Active!' : 'Unlock Lifetime Premium Practice' }}</h3>
                <button class="reset-pass-link" *ngIf="isProActive()" (click)="deactivatePro()">
                  [Reset to Free Tier]
                </button>
              </div>
              <p>
                {{ isProActive() 
                  ? 'Enjoy unlimited adaptively generated mock tests, complete GATE/ESE catalog papers, and advanced diagnostic evaluation.' 
                  : 'Get unlimited custom adaptive mock generators and unlock previous years ESE/GATE paper simulations (₹999/lifetime).' }}
              </p>
            </div>
            <div class="banner-action" *ngIf="!isProActive()">
              <ion-button color="secondary" fill="solid" class="banner-btn" (click)="openCheckout()">
                Upgrade Now (₹999)
              </ion-button>
            </div>
          </div>

          <!-- Divider line -->
          <div class="hub-divider"></div>

          <!-- Right: AI Adaptive Mock Generator Widget -->
          <div class="adaptive-widget-wrapper">
            <div class="widget-overlay" *ngIf="!isProActive()" (click)="openCheckout()">
              <div class="overlay-content">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2a3 3 0 003 3h4a3 3 0 003-3v-2M9 11V9a5 5 0 0110 0v2M8 11h12a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 01-2-2z" />
                </svg>
                <span>Unlock Adaptive Generator with Pro Pass</span>
              </div>
            </div>

            <div class="adaptive-widget" [class.blur-content]="!isProActive()">
              <div class="adaptive-header">
                <div class="adaptive-icon" [class.animate-pulse-glow]="isProActive()">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div class="adaptive-header-text">
                  <h4>AI Adaptive Generator</h4>
                  <p class="section-desc">Weak-area targeted diagnostics</p>
                </div>
              </div>

              <!-- Slider Question Density -->
              <div class="input-container slider-container">
                <div class="slider-header-row">
                  <span class="input-label">Questions</span>
                  <span class="density-badge">{{ adaptiveQuestionCount() }} Qs</span>
                </div>
                <ion-range
                  [min]="5"
                  [max]="30"
                  [pin]="true"
                  [snaps]="true"
                  [step]="1"
                  [disabled]="!isProActive()"
                  [ngModel]="adaptiveQuestionCount()"
                  (ngModelChange)="onAdaptiveCountChange($event)"
                  class="custom-range">
                </ion-range>
              </div>

              <ion-button
                expand="block"
                color="secondary"
                class="gradient-btn"
                [disabled]="adaptiveStarting()"
                (click)="startAdaptiveMock()">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;margin-right:8px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" *ngIf="!adaptiveStarting()">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{{ adaptiveStarting() ? 'Generating Mocks...' : 'Generate Adaptive Mock' }}</span>
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Horizontal Search & Filter Bar -->
        <section class="search-filter-bar glass-card">
          <div class="filter-main-row">
            <!-- Keyword Search Box -->
            <div class="search-field-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" class="search-icon-svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search subjects, topics, or PSUs (e.g. ISRO)..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchQueryChange($event)"
                class="search-input"
              />
              <button class="search-clear-btn" *ngIf="searchQuery()" (click)="clearSearch()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Test Category Selectors -->
            <div class="filter-group">
              <span class="filter-label">Category:</span>
              <div class="chips-group">
                <button class="chip-btn" [class.active]="filter() === 'all'" (click)="setTypeFilter('all'); loadCatalog()">All</button>
                <button class="chip-btn" [class.active]="filter() === 'topic'" (click)="setTypeFilter('topic'); loadCatalog()">Topic-wise</button>
                <button class="chip-btn" [class.active]="filter() === 'subject'" (click)="setTypeFilter('subject'); loadCatalog()">Subject-wise</button>
                <button class="chip-btn" [class.active]="filter() === 'full_length'" (click)="setTypeFilter('full_length'); loadCatalog()">Full-Length</button>
              </div>
            </div>

            <!-- Target Exam Selectors -->
            <div class="filter-group">
              <span class="filter-label">Exam:</span>
              <div class="chips-group">
                <button class="chip-btn" [class.active]="examCodeFilter() === null" (click)="onExamCodeChange(null); loadCatalog()">All</button>
                <button class="chip-btn" [class.active]="examCodeFilter() === 'GATE'" (click)="onExamCodeChange('GATE'); loadCatalog()">GATE</button>
                <button class="chip-btn" [class.active]="examCodeFilter() === 'ESE'" (click)="onExamCodeChange('ESE'); loadCatalog()">ESE</button>
                <button class="chip-btn" [class.active]="examCodeFilter() === 'PSU'" (click)="onExamCodeChange('PSU'); loadCatalog()">PSUs</button>
              </div>
            </div>

            <!-- Advanced Trigger -->
            <button class="more-filters-btn" [class.active]="advancedOpen()" (click)="toggleAdvanced()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" class="filter-icon-svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Filters</span>
              <span class="active-badge" *ngIf="activeFiltersCount() > 0">{{ activeFiltersCount() }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" class="chevron-svg" [class.rotated]="advancedOpen()">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <!-- Advanced Collapsible Drawer -->
          <div class="advanced-drawer-panel" [class.open]="advancedOpen()">
            <div class="drawer-grid">
              
              <!-- Branch selection -->
              <div class="drawer-column">
                <span class="drawer-label">Discipline / Branch</span>
                <div class="chips-group">
                  <button class="chip-btn" [class.active]="paperFilter() === ''" (click)="paperFilter.set(''); loadCatalog()">All Branches</button>
                  <button class="chip-btn" [class.active]="paperFilter() === 'Computer Science'" (click)="paperFilter.set('Computer Science'); loadCatalog()">CS / IT</button>
                  <button class="chip-btn" [class.active]="paperFilter() === 'Mechanical Engineering'" (click)="paperFilter.set('Mechanical Engineering'); loadCatalog()">Mechanical</button>
                  <button class="chip-btn" [class.active]="paperFilter() === 'Electrical Engineering'" (click)="paperFilter.set('Electrical Engineering'); loadCatalog()">Electrical</button>
                  <button class="chip-btn" [class.active]="paperFilter() === 'Electronics Engineering'" (click)="paperFilter.set('Electronics Engineering'); loadCatalog()">Electronics</button>
                  <button class="chip-btn" [class.active]="paperFilter() === 'Civil Engineering'" (click)="paperFilter.set('Civil Engineering'); loadCatalog()">Civil</button>
                </div>
              </div>

              <!-- PSU selection -->
              <div class="drawer-column">
                <span class="drawer-label">Recruiting PSU / Company</span>
                <div class="chips-group">
                  <button class="chip-btn" [class.active]="companyFilter() === ''" (click)="companyFilter.set(''); loadCatalog()">All Companies</button>
                  <button class="chip-btn" [class.active]="companyFilter() === 'ISRO'" (click)="companyFilter.set('ISRO'); loadCatalog()">ISRO</button>
                  <button class="chip-btn" [class.active]="companyFilter() === 'ONGC'" (click)="companyFilter.set('ONGC'); loadCatalog()">ONGC</button>
                  <button class="chip-btn" [class.active]="companyFilter() === 'BARC'" (click)="companyFilter.set('BARC'); loadCatalog()">BARC</button>
                  <button class="chip-btn" [class.active]="companyFilter() === 'BHEL'" (click)="companyFilter.set('BHEL'); loadCatalog()">BHEL</button>
                </div>
              </div>

              <!-- Exam Year selection -->
              <div class="drawer-column">
                <span class="drawer-label">Exam Year</span>
                <div class="chips-group">
                  <button class="chip-btn" [class.active]="examYearInput() === ''" (click)="examYearInput.set(''); loadCatalog()">All Years</button>
                  <button class="chip-btn" [class.active]="examYearInput() === '2024'" (click)="examYearInput.set('2024'); loadCatalog()">2024</button>
                  <button class="chip-btn" [class.active]="examYearInput() === '2023'" (click)="examYearInput.set('2023'); loadCatalog()">2023</button>
                  <button class="chip-btn" [class.active]="examYearInput() === '2022'" (click)="examYearInput.set('2022'); loadCatalog()">2022</button>
                  <button class="chip-btn" [class.active]="examYearInput() === '2021'" (click)="examYearInput.set('2021'); loadCatalog()">2021</button>
                </div>
              </div>

            </div>

            <!-- Drawer actions -->
            <div class="drawer-footer-actions">
              <button class="btn-clear-all" (click)="resetFilters()" *ngIf="activeFiltersCount() > 0">
                Reset All Filters
              </button>
            </div>
          </div>
        </section>

        <!-- Mock Tests Main Grid -->
        <main class="tests-main-container stack">
          <div class="results-header">
            <h2 class="section-title">Available Mock Tests</h2>
            <span class="results-count">{{ tests().length }} mock tests found</span>
          </div>

          <!-- Alert/Notification Banner -->
          <div class="error-msg-banner" *ngIf="errorMessage()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>

          <div class="catalog-grid-layout" *ngIf="tests().length; else emptyState">
            <article class="glass-card test-card-redesign" *ngFor="let test of tests()">
              <div class="card-top">
                <div class="tags-group">
                  <span class="badge-exam">{{ test.examCode || 'GATE' }}</span>
                  <span class="badge-subject" *ngIf="test.paperCode">{{ test.paperCode }}</span>
                  <span class="badge-company" *ngIf="test.companyName">{{ test.companyName }}</span>
                  <span class="badge-year" *ngIf="test.examYear">{{ test.examYear }}</span>
                  <span class="badge-adaptive" *ngIf="test.isAdaptive">Adaptive</span>
                </div>
                <span class="lock-pill" *ngIf="!isProActive() && (test.isAdaptive || test.testType === 'full_length')">🔒 Pro</span>
                <span class="unlocked-pill" *ngIf="isProActive() && (test.isAdaptive || test.testType === 'full_length')">👑 Pro</span>
              </div>

              <div class="card-main">
                <h3>{{ test.title }}</h3>
                <p class="test-category-label">
                  {{ formatType(test.testType) }} • {{ test.subjectName || 'General Engineering' }}
                </p>
                <p class="test-description-copy">{{ test.description }}</p>
              </div>

              <div class="card-footer-stats">
                <div class="stat-col">
                  <span class="stat-lbl">Questions</span>
                  <strong class="stat-val">{{ test.totalQuestions }}</strong>
                </div>
                <div class="stat-col border-left">
                  <span class="stat-lbl">Marks</span>
                  <strong class="stat-val">{{ test.totalMarks }}</strong>
                </div>
                <div class="stat-col border-left">
                  <span class="stat-lbl">Duration</span>
                  <strong class="stat-val">{{ test.durationMinutes }} min</strong>
                </div>
              </div>

              <div class="instructions-accordion" *ngIf="test.instructions?.length">
                <span class="accordion-title">Guidelines:</span>
                <ul class="accordion-list">
                  <li *ngFor="let instruction of test.instructions">{{ instruction }}</li>
                </ul>
              </div>

              <ion-button 
                expand="block" 
                (click)="startTest(test)" 
                [disabled]="startingTestId() === test.id" 
                [color]="(test.isAdaptive || test.testType === 'full_length') ? (isProActive() ? 'primary' : 'secondary') : 'primary'"
                class="action-btn">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;margin-right:8px" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" *ngIf="!isProActive() && (test.isAdaptive || test.testType === 'full_length')">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2a3 3 0 003 3h4a3 3 0 003-3v-2M9 11V9a5 5 0 0110 0v2M8 11h12a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 01-2-2z" />
                </svg>
                <span>
                  {{ (test.isAdaptive || test.testType === 'full_length') 
                    ? (isProActive() ? 'Start Premium Mock' : 'Unlock with Pro 🔒') 
                    : (startingTestId() === test.id ? 'Loading Exam...' : 'Start Mock Test') }}
                </span>
              </ion-button>
            </article>
          </div>
        </main>

        <!-- Empty State -->
        <ng-template #emptyState>
          <div class="glass-card empty-card stack">
            <div class="empty-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3>No mock tests matched</h3>
            <p>Try clearing some filters or searching for another recruiting body, subject, or year.</p>
            <ion-button fill="solid" color="primary" (click)="resetFilters()">Reset All Filters</ion-button>
          </div>
        </ng-template>

        <!-- Simulated Checkout Modal -->
        <div class="modal-backdrop" *ngIf="showCheckoutModal()" (click)="closeCheckout()">
          <div class="checkout-modal glass-card" (click)="$event.stopPropagation()">
            <button class="modal-close-btn" (click)="closeCheckout()">
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
                <button class="payment-method-card" [class.active]="selectedPaymentMethod() === 'upi'" (click)="setPaymentMethod('upi')">
                  <div class="method-icon">📱</div>
                  <span>UPI (GPay / PhonePe)</span>
                </button>
                <button class="payment-method-card" [class.active]="selectedPaymentMethod() === 'card'" (click)="setPaymentMethod('card')">
                  <div class="method-icon">💳</div>
                  <span>Credit / Debit Card</span>
                </button>
                <button class="payment-method-card" [class.active]="selectedPaymentMethod() === 'net'" (click)="setPaymentMethod('net')">
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
                (click)="processCheckout()">
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
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .catalog-shell {
      padding-top: 24px;
      padding-bottom: 40px;
    }

    .hero-card {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(253, 246, 230, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
      padding: 32px;
      margin: 0;
      animation: gk-rise 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      gap: 24px;
    }

    .hero-text-content {
      flex: 1;
    }

    .hero-card h1 {
      margin: 8px 0 12px;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 850;
      line-height: 1.1;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--ion-color-dark) 30%, var(--ion-color-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle-copy {
      color: var(--gk-muted);
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 4px 0 0;
    }

    .hero-stats-bar {
      display: flex;
      gap: 24px;
      flex-shrink: 0;
    }

    .hero-stat-item {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }

    .stat-num {
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.02em;
    }

    .text-gradient {
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-desc {
      font-size: 0.76rem;
      color: var(--gk-muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Premium Pro Hub: Merged Upgrade Pass Banner & Adaptive Mock Generator */
    .premium-pro-hub {
      display: grid;
      grid-template-columns: 1.2fr auto 0.8fr;
      gap: 24px;
      align-items: stretch;
      border: 1.5px solid rgba(var(--ion-color-secondary-rgb), 0.35);
      background: linear-gradient(135deg, rgba(235, 247, 244, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
      box-shadow: var(--gk-shadow-lifted);
      padding: 24px;
      margin: 16px 0 0 0;
      border-radius: var(--gk-radius-md);
      position: relative;
      animation: gk-rise 650ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .pro-pass-banner {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .banner-badge-icon {
      width: 48px;
      height: 48px;
      background: rgba(var(--ion-color-secondary-rgb), 0.1);
      border-radius: 12px;
      display: grid;
      place-items: center;
      color: var(--ion-color-secondary);
      flex-shrink: 0;
    }

    .icon-sparkles {
      width: 26px;
      height: 26px;
    }

    .banner-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .pro-tag {
      font-size: 0.72rem;
      background: var(--ion-color-secondary);
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.08em;
      display: inline-block;
      margin-bottom: 8px;
      box-shadow: 0 2px 5px rgba(0, 180, 150, 0.2);
    }

    .pro-tag.active-tag {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
    }

    .banner-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }

    .banner-body h3 {
      font-size: 1.25rem;
      font-weight: 850;
      color: var(--gk-ink);
      margin: 0;
    }

    .reset-pass-link {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--ion-color-danger);
      background: transparent;
      border: none;
      padding: 2px 4px;
      cursor: pointer;
      opacity: 0.65;
      transition: opacity 0.2s;
    }

    .reset-pass-link:hover {
      opacity: 1;
    }

    .banner-body p {
      margin: 0;
      color: var(--gk-muted);
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .banner-action {
      margin-top: 14px;
      align-self: flex-start;
    }

    .banner-btn {
      margin: 0;
      --box-shadow: 0 6px 20px rgba(var(--ion-color-secondary-rgb), 0.22);
      font-weight: 700;
    }

    .hub-divider {
      width: 1px;
      background: rgba(var(--ion-color-secondary-rgb), 0.15);
      align-self: stretch;
    }

    /* AI Adaptive Widget Styles */
    .adaptive-widget-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 140px;
    }

    .widget-overlay {
      position: absolute;
      inset: -8px;
      background: rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(6px);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: var(--gk-radius-md);
      border: 1.5px dashed rgba(var(--ion-color-secondary-rgb), 0.4);
      transition: all 0.2s ease;
    }

    .widget-overlay:hover {
      background: rgba(255, 255, 255, 0.55);
      border-color: var(--ion-color-secondary);
    }

    .overlay-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--ion-color-secondary-shade);
      font-weight: 850;
      font-size: 0.85rem;
      text-align: center;
      padding: 12px;
    }

    .overlay-content svg {
      width: 28px;
      height: 28px;
      animation: gk-bounce 2s infinite;
    }

    @keyframes gk-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .adaptive-widget {
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.3s ease;
    }

    .blur-content {
      filter: blur(1px);
      opacity: 0.65;
      pointer-events: none;
    }

    .adaptive-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .adaptive-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(var(--ion-color-secondary-rgb), 0.1);
      color: var(--ion-color-secondary);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .adaptive-icon svg {
      width: 18px;
      height: 18px;
    }

    .adaptive-header h4 {
      font-size: 1.1rem;
      font-weight: 850;
      color: var(--gk-ink);
      margin: 0;
    }

    .section-desc {
      font-size: 0.8rem;
      color: var(--gk-muted);
      margin: 0;
      line-height: 1.2;
    }

    .slider-container {
      margin-bottom: 4px;
    }

    .slider-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .density-badge {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--ion-color-secondary);
      background: rgba(var(--ion-color-secondary-rgb), 0.08);
      padding: 1px 6px;
      border-radius: 5px;
    }

    .gradient-btn {
      margin: 0;
      font-weight: 750;
    }

    /* Horizontal Search & Filter Bar */
    .search-filter-bar {
      display: flex;
      flex-direction: column;
      padding: 16px 20px;
      margin-top: 24px;
      border-radius: var(--gk-radius-md);
      border: 1px solid var(--gk-outline);
      background: #ffffff;
      box-shadow: var(--gk-shadow-soft);
      animation: gk-rise 750ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .filter-main-row {
      display: flex;
      align-items: center;
      gap: 20px;
      width: 100%;
      flex-wrap: wrap;
    }

    .search-field-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1.5px solid var(--gk-outline);
      border-radius: 12px;
      padding: 0 12px;
      height: 40px;
      flex: 1 1 280px;
      transition: all 200ms ease;
    }

    .search-field-wrapper:focus-within {
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.12);
      background: #ffffff;
    }

    .search-icon-svg {
      width: 16px;
      height: 16px;
      color: var(--gk-muted);
      margin-right: 8px;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--gk-ink);
      font-size: 0.88rem;
      font-weight: 600;
      width: 100%;
      height: 100%;
    }

    .search-input:focus {
      outline: none;
    }

    .search-clear-btn {
      background: rgba(148, 163, 184, 0.15);
      border: none;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: grid;
      place-items: center;
      cursor: pointer;
      color: #475569;
      flex-shrink: 0;
    }

    .search-clear-btn svg {
      width: 8px;
      height: 8px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-label {
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--gk-muted);
    }

    .chips-group {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }

    .chip-btn {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--gk-muted);
      background: #f1f5f9;
      border: 1.2px solid var(--gk-outline);
      padding: 5px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 180ms ease;
    }

    .chip-btn:hover {
      color: var(--ion-color-primary);
      border-color: var(--ion-color-primary-tint);
      background: rgba(var(--ion-color-primary-rgb), 0.04);
    }

    .chip-btn.active {
      color: #ffffff;
      background: var(--ion-color-primary);
      border-color: var(--ion-color-primary);
      box-shadow: 0 2px 6px rgba(var(--ion-color-primary-rgb), 0.18);
    }

    .more-filters-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.05);
      border: 1.2px solid rgba(var(--ion-color-primary-rgb), 0.15);
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 200ms ease;
      margin-left: auto;
    }

    .more-filters-btn:hover, .more-filters-btn.active {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      border-color: var(--ion-color-primary);
    }

    .filter-icon-svg {
      width: 15px;
      height: 15px;
    }

    .chevron-svg {
      width: 14px;
      height: 14px;
      transition: transform 0.2s ease;
    }

    .chevron-svg.rotated {
      transform: rotate(180deg);
    }

    .active-badge {
      background: var(--ion-color-danger);
      color: #ffffff;
      border-radius: 99px;
      font-size: 0.7rem;
      padding: 1px 5px;
      font-weight: 800;
    }

    /* Collapsible advanced filters drawer panel */
    .advanced-drawer-panel {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease, margin-top 0.25s;
    }

    .advanced-drawer-panel.open {
      max-height: 500px;
      opacity: 1;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--gk-outline);
    }

    .drawer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .drawer-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .drawer-label {
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--gk-muted);
    }

    .drawer-footer-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .btn-clear-all {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--ion-color-danger);
      background: transparent;
      border: 1px solid rgba(var(--ion-color-danger-rgb), 0.2);
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-clear-all:hover {
      background: rgba(var(--ion-color-danger-rgb), 0.05);
    }

    /* Available Mocks Main Layout Container */
    .tests-main-container {
      margin-top: 24px;
      gap: 16px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .results-count {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--gk-muted);
    }

    /* Error and Warning Bar */
    .error-msg-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(var(--ion-color-danger-rgb), 0.1);
      border: 1px solid rgba(var(--ion-color-danger-rgb), 0.2);
      color: var(--ion-color-danger-shade);
      font-size: 0.88rem;
      font-weight: 650;
      animation: gk-shake 0.4s ease;
    }

    .error-msg-banner svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    @keyframes gk-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    /* Redesigned Test Grid */
    .catalog-grid-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 768px) {
      .catalog-grid-layout {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1200px) {
      .catalog-grid-layout {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    .test-card-redesign {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: var(--gk-radius-md);
      padding: 20px;
      box-shadow: var(--gk-shadow-soft);
      transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .test-card-redesign:hover {
      transform: translateY(-4px);
      box-shadow: var(--gk-shadow-lifted);
      border-color: var(--gk-outline-strong);
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 8px;
    }

    .tags-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tags-group span {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-exam { background: rgba(var(--ion-color-primary-rgb), 0.08); color: var(--ion-color-primary-shade); }
    .badge-subject { background: rgba(var(--ion-color-secondary-rgb), 0.08); color: var(--ion-color-secondary-shade); }
    .badge-company { background: rgba(var(--ion-color-tertiary-rgb), 0.08); color: var(--ion-color-tertiary-shade); }
    .badge-year { background: #f1f5f9; color: #475569; }
    .badge-adaptive { background: rgba(var(--ion-color-success-rgb), 0.08); color: var(--ion-color-success-shade); }

    .lock-pill {
      font-size: 0.72rem;
      font-weight: 800;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #ffffff;
      padding: 2.5px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(217, 119, 6, 0.25);
      white-space: nowrap;
    }

    .unlocked-pill {
      font-size: 0.72rem;
      font-weight: 800;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 2.5px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
      white-space: nowrap;
    }

    .card-main h3 {
      font-size: 1.12rem;
      font-weight: 800;
      color: var(--gk-ink);
      line-height: 1.3;
      margin: 0 0 4px 0;
    }

    .test-category-label {
      font-size: 0.8rem;
      color: var(--gk-muted);
      font-weight: 700;
      margin: 0 0 10px 0;
    }

    .test-description-copy {
      font-size: 0.88rem;
      line-height: 1.45;
      color: var(--gk-muted);
      margin: 0 0 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-footer-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      background: #f8fafc;
      border: 1px solid var(--gk-outline);
      border-radius: 10px;
      padding: 8px;
      margin-bottom: 14px;
    }

    .stat-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .border-left {
      border-left: 1px solid var(--gk-outline);
    }

    .stat-lbl {
      font-size: 0.65rem;
      font-weight: 750;
      text-transform: uppercase;
      color: var(--gk-muted);
      letter-spacing: 0.04em;
    }

    .stat-val {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--gk-ink);
    }

    .instructions-accordion {
      border-top: 1px dashed var(--gk-outline);
      padding-top: 10px;
      margin-bottom: 16px;
    }

    .accordion-title {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--gk-ink);
      display: block;
      margin-bottom: 4px;
    }

    .accordion-list {
      margin: 0;
      padding-left: 14px;
      font-size: 0.76rem;
      color: var(--gk-muted);
      line-height: 1.35;
    }

    .accordion-list li {
      margin-bottom: 3px;
    }

    .action-btn {
      margin: 0;
      font-weight: 750;
      font-size: 0.88rem;
    }

    .empty-card {
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      border: 1px dashed var(--gk-outline);
    }

    .empty-icon-box {
      width: 52px;
      height: 52px;
      color: var(--gk-muted);
      margin-bottom: 12px;
    }

    .empty-icon-box svg {
      width: 100%;
      height: 100%;
    }

    .empty-card h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--gk-ink);
      margin: 0 0 4px 0;
    }

    .empty-card p {
      font-size: 0.88rem;
      color: var(--gk-muted);
      margin: 0 0 16px 0;
      max-width: 300px;
    }

    /* Simulated Checkout Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: gk-fade-in 150ms ease-out both;
    }

    .checkout-modal {
      position: relative;
      width: 100%;
      max-width: 450px;
      background: #ffffff;
      border: 1px solid rgba(var(--ion-color-secondary-rgb), 0.25);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      animation: gk-scale-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    .modal-close-btn {
      position: absolute;
      top: 18px;
      right: 18px;
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      cursor: pointer;
      color: #64748b;
      transition: background-color 0.2s;
    }

    .modal-close-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .modal-close-btn svg {
      width: 12px;
      height: 12px;
    }

    .checkout-header {
      margin-bottom: 20px;
    }

    .pro-tag-badge {
      font-size: 0.68rem;
      background: rgba(var(--ion-color-secondary-rgb), 0.1);
      color: var(--ion-color-secondary-shade);
      padding: 3px 8px;
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.08em;
      display: inline-block;
      margin-bottom: 8px;
    }

    .checkout-header h2 {
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--gk-ink);
      margin: 0 0 6px 0;
    }

    .checkout-header p {
      font-size: 0.85rem;
      color: var(--gk-muted);
      line-height: 1.4;
      margin: 0;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid var(--gk-outline);
      margin-bottom: 20px;
    }

    .price-label {
      font-size: 0.88rem;
      font-weight: 750;
      color: var(--gk-ink);
    }

    .price-value {
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--ion-color-primary);
    }

    .price-value small {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--gk-muted);
    }

    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }

    .payment-method-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 8px;
      border-radius: 12px;
      border: 1.5px solid var(--gk-outline);
      background: #ffffff;
      cursor: pointer;
      transition: all 180ms ease;
    }

    .payment-method-card:hover {
      border-color: rgba(var(--ion-color-secondary-rgb), 0.4);
      background: rgba(var(--ion-color-secondary-rgb), 0.02);
    }

    .payment-method-card.active {
      border-color: var(--ion-color-secondary);
      background: rgba(var(--ion-color-secondary-rgb), 0.05);
    }

    .method-icon {
      font-size: 1.35rem;
    }

    .payment-method-card span {
      font-size: 0.72rem;
      font-weight: 750;
      color: var(--gk-ink);
      text-align: center;
    }

    .method-details-panel {
      background: #f8fafc;
      border: 1.5px solid var(--gk-outline);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 24px;
      min-height: 70px;
    }

    .checkout-input {
      background: #ffffff;
      border: 1px solid var(--gk-outline);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.88rem;
      color: var(--gk-ink);
      font-weight: 600;
      width: 100%;
    }

    .checkout-input:disabled {
      color: var(--gk-muted);
    }

    .btn-checkout-confirm {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, var(--ion-color-secondary) 0%, #00bfa5 100%);
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 800;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(var(--ion-color-secondary-rgb), 0.25);
      transition: all 0.2s;
    }

    .btn-checkout-confirm:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(var(--ion-color-secondary-rgb), 0.35);
    }

    .btn-checkout-confirm:disabled {
      opacity: 0.75;
      cursor: not-allowed;
      box-shadow: none;
    }

    .spinner-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .checkout-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: gk-spin 0.6s linear infinite;
    }

    @keyframes gk-spin {
      to { transform: rotate(360deg); }
    }

    .secure-checkout-notice {
      font-size: 0.7rem;
      color: var(--gk-muted);
      text-align: center;
      margin: 8px 0 0 0;
      font-weight: 600;
    }

    @keyframes gk-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes gk-scale-in {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Responsive Overrides */
    @media (max-width: 991px) {
      .premium-pro-hub {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .hub-divider {
        display: none;
      }
      .pro-pass-banner {
        flex-direction: column;
        gap: 12px;
      }
      .banner-action {
        width: 100%;
        margin-top: 4px;
      }
      .banner-btn {
        width: 100%;
      }
      .widget-overlay {
        inset: 0;
      }
      .more-filters-btn {
        margin-left: 0;
        width: 100%;
        justify-content: center;
      }
      .filter-main-row {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .filter-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .chips-group {
        width: 100%;
      }
      .chip-btn {
        flex: 1 1 auto;
        text-align: center;
      }
      .search-field-wrapper {
        width: 100%;
      }
    }

    /* Dark Theme Styles */
    :host-context(body.dark-theme) .premium-pro-hub {
      background: linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%) !important;
      border-color: rgba(0, 191, 165, 0.3) !important;
      box-shadow: 0 10px 25px rgba(0, 191, 165, 0.05) !important;
    }

    :host-context(body.dark-theme) .pro-pass-banner .banner-body h3,
    :host-context(body.dark-theme) .adaptive-header h4,
    :host-context(body.dark-theme) .drawer-label,
    :host-context(body.dark-theme) .checkout-header h2,
    :host-context(body.dark-theme) .price-label,
    :host-context(body.dark-theme) .payment-method-card span {
      color: #f8fafc !important;
    }

    :host-context(body.dark-theme) .widget-overlay {
      background: rgba(17, 24, 39, 0.65) !important;
      border-color: rgba(0, 191, 165, 0.35) !important;
    }

    :host-context(body.dark-theme) .overlay-content {
      color: #00bfa5 !important;
    }

    :host-context(body.dark-theme) .search-filter-bar {
      background: #1f2937 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(body.dark-theme) .search-field-wrapper {
      background: #111827 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(body.dark-theme) .search-input {
      color: #f8fafc !important;
    }

    :host-context(body.dark-theme) .chip-btn {
      background: #111827 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #9ca3af !important;
    }

    :host-context(body.dark-theme) .chip-btn:hover {
      color: var(--ion-color-primary-tint) !important;
      border-color: var(--ion-color-primary-tint) !important;
      background: rgba(var(--ion-color-primary-rgb), 0.1) !important;
    }

    :host-context(body.dark-theme) .chip-btn.active {
      color: #ffffff !important;
      background: var(--ion-color-primary) !important;
      border-color: var(--ion-color-primary) !important;
    }

    :host-context(body.dark-theme) .advanced-drawer-panel {
      border-top-color: rgba(255, 255, 255, 0.08) !important;
    }

    :host-context(body.dark-theme) .test-card-redesign {
      background: #1f2937 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(body.dark-theme) .card-footer-stats {
      background: #111827 !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
    }

    :host-context(body.dark-theme) .stat-val,
    :host-context(body.dark-theme) .accordion-title {
      color: #f8fafc !important;
    }

    :host-context(body.dark-theme) .checkout-modal {
      background: #1f2937 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(body.dark-theme) .price-row {
      background: #111827 !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
    }

    :host-context(body.dark-theme) .payment-method-card {
      background: #111827 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    :host-context(body.dark-theme) .payment-method-card:hover {
      border-color: rgba(var(--ion-color-secondary-rgb), 0.4) !important;
      background: rgba(var(--ion-color-secondary-rgb), 0.02) !important;
    }

    :host-context(body.dark-theme) .payment-method-card.active {
      border-color: var(--ion-color-secondary) !important;
      background: rgba(var(--ion-color-secondary-rgb), 0.1) !important;
    }

    :host-context(body.dark-theme) .method-details-panel {
      background: #111827 !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
    }

    :host-context(body.dark-theme) .checkout-input {
      background: #1f2937 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
    }

    :host-context(body.dark-theme) .modal-close-btn {
      background: #111827 !important;
      color: #9ca3af !important;
    }

    :host-context(body.dark-theme) .modal-close-btn:hover {
      background: #1f2937 !important;
      color: #f8fafc !important;
    }
  `],
})
export class CatalogPage implements OnInit {
  private readonly testEngineService = inject(TestEngineService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly tests = signal<TestCatalogItem[]>([]);
  readonly filter = signal<CatalogFilter>('all');
  readonly examCodeFilter = signal<ExamCode | null>(null);
  readonly companyFilter = signal('');
  readonly paperFilter = signal('');
  readonly examYearInput = signal('');
  readonly adaptiveQuestionCount = signal(12);

  // Redesign additionals
  readonly searchQuery = signal('');
  readonly filtersOpen = signal(false);
  readonly advancedOpen = signal(false);

  // Premium Pro Pass dynamic signals
  readonly isProActive = signal<boolean>(
    typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem('gk_pro_active') === 'true'
      : false
  );
  readonly showCheckoutModal = signal<boolean>(false);
  readonly isProcessingPayment = signal<boolean>(false);
  readonly selectedPaymentMethod = signal<string>('upi');

  readonly errorMessage = signal<string | null>(null);
  readonly startingTestId = signal<string | null>(null);
  readonly adaptiveStarting = signal(false);

  // Computes active filters count
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.filter() !== 'all') count++;
    if (this.examCodeFilter() !== null) count++;
    if (this.companyFilter() !== '') count++;
    if (this.paperFilter() !== '') count++;
    if (this.examYearInput() !== '') count++;
    return count;
  });

  readonly queryFilters = computed<CatalogFilters>(() => {
    const year = Number(this.examYearInput());
    const parsedYear = Number.isFinite(year) && year >= 1990 ? year : undefined;
    const selectedType = this.filter();

    return {
      type: selectedType === 'all' ? undefined : selectedType,
      examCode: this.examCodeFilter() ?? undefined,
      companyName: this.companyFilter() || undefined,
      paperCode: this.paperFilter() || undefined,
      examYear: parsedYear,
    };
  });

  async ngOnInit(): Promise<void> {
    await this.loadCatalog();
  }

  normalizeText(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim();
  }

  onExamCodeChange(value: string | null): void {
    if (value === 'GATE' || value === 'PSU' || value === 'ESE') {
      this.examCodeFilter.set(value);
      return;
    }

    this.examCodeFilter.set(null);
  }

  onAdaptiveCountChange(value: number | { lower: number; upper: number } | null): void {
    if (typeof value === 'number' && Number.isFinite(value)) {
      this.adaptiveQuestionCount.set(Math.round(value));
    }
  }

  // Redesign Custom Search Handler
  onSearchQueryChange(value: string): void {
    const val = this.normalizeText(value);
    this.searchQuery.set(val);

    const normalized = val.toLowerCase();
    if (normalized === '') {
      this.companyFilter.set('');
      this.paperFilter.set('');
    } else if (['isro', 'ongc', 'barc', 'bhel'].includes(normalized)) {
      this.companyFilter.set(val);
      this.paperFilter.set('');
    } else {
      this.paperFilter.set(val);
      this.companyFilter.set('');
    }
    void this.loadCatalog();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.companyFilter.set('');
    this.paperFilter.set('');
    void this.loadCatalog();
  }

  toggleFilters(): void {
    this.filtersOpen.set(!this.filtersOpen());
  }

  toggleAdvanced(): void {
    this.advancedOpen.set(!this.advancedOpen());
  }

  async loadCatalog(): Promise<void> {
    this.errorMessage.set(null);

    try {
      const tests = await this.testEngineService.getCatalog(this.queryFilters());
      this.tests.set(tests);
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'The test catalog could not be loaded right now.')
      );
    }
  }

  resetFilters(): void {
    this.filter.set('all');
    this.examCodeFilter.set(null);
    this.companyFilter.set('');
    this.paperFilter.set('');
    this.examYearInput.set('');
    this.searchQuery.set('');
    void this.loadCatalog();
  }

  setTypeFilter(value: string | number | undefined): void {
    if (value === 'topic' || value === 'subject' || value === 'full_length' || value === 'all') {
      this.filter.set(value);
    }
  }

  formatType(testType: TestType): string {
    if (testType === 'full_length') {
      return 'Full-length';
    }

    return testType === 'subject' ? 'Subject-wise' : 'Topic-wise';
  }

  // Gated premium test attempts
  async startTest(test: TestCatalogItem): Promise<void> {
    if (test.isAdaptive || test.testType === 'full_length') {
      if (!this.isProActive()) {
        this.openCheckout();
        return;
      }
    }

    this.startingTestId.set(test.id);
    this.errorMessage.set(null);

    try {
      const result = await this.testEngineService.startAttempt(test.id);
      await this.router.navigateByUrl(`/tests/attempt/${result.detail.attempt.id}`);
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'The test could not be started.')
      );
    } finally {
      this.startingTestId.set(null);
    }
  }

  // Pro checkout flows
  openCheckout(): void {
    this.showCheckoutModal.set(true);
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
  }

  setPaymentMethod(method: string): void {
    this.selectedPaymentMethod.set(method);
  }

  async processCheckout(): Promise<void> {
    this.isProcessingPayment.set(true);
    // Simulate payment processing latency
    await new Promise((resolve) => setTimeout(resolve, 1500));
    this.isProActive.set(true);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('gk_pro_active', 'true');
    }
    this.isProcessingPayment.set(false);
    this.showCheckoutModal.set(false);
    void this.loadCatalog();
  }

  deactivatePro(): void {
    this.isProActive.set(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('gk_pro_active', 'false');
    }
    void this.loadCatalog();
  }

  // Gated premium generator
  async startAdaptiveMock(): Promise<void> {
    if (!this.isProActive()) {
      this.openCheckout();
      return;
    }

    this.adaptiveStarting.set(true);
    this.errorMessage.set(null);

    try {
      const year = Number(this.examYearInput());
      const currentFilter = this.filter();
      const payload: AdaptiveStartPayload = {
        questionCount: this.adaptiveQuestionCount(),
        examCode: this.examCodeFilter() ?? undefined,
        companyName: this.companyFilter() || undefined,
        paperCode: this.paperFilter() || undefined,
        examYear: Number.isFinite(year) && year >= 1990 ? year : undefined,
        type: currentFilter === 'all' ? undefined : currentFilter
      };

      const result = await this.testEngineService.startAdaptiveAttempt(payload);
      await this.router.navigateByUrl(`/tests/attempt/${result.detail.attempt.id}`);
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'The adaptive mock test could not be generated.')
      );
    } finally {
      this.adaptiveStarting.set(false);
    }
  }
}
