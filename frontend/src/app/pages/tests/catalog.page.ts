import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AuthService } from "../../core/services/auth.service";
import { TestEngineService } from "../../core/services/test-engine.service";
import {
  AdaptiveStartPayload,
  CatalogFilters,
  ExamCode,
  TestCatalogItem,
  TestType,
} from "../../core/models/test-engine.models";
import { AppHeaderComponent } from "../../shared/app-header.component";
import { AppFooterComponent } from "../../shared/app-footer.component";

type CatalogFilter = "all" | TestType;

@Component({
  selector: "app-test-catalog-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AppHeaderComponent,
    AppFooterComponent,
  ],
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
              Leverage AI-driven adaptive diagnostics to identify weaknesses or
              customize full-length past papers for GATE, ESE, and premier PSUs.
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon-sparkles"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <div class="banner-body">
              <span class="pro-tag" [class.active-tag]="isProActive()">
                {{
                  isProActive() ? "GURUKOOL PRO ACTIVE 👑" : "GURUKOOL PRO PASS"
                }}
              </span>
              <div class="banner-title-row">
                <h3>
                  {{
                    isProActive()
                      ? "Your Premium Pass is Fully Active!"
                      : "Unlock Lifetime Premium Practice"
                  }}
                </h3>
                <button
                  class="reset-pass-link"
                  *ngIf="isProActive()"
                  (click)="deactivatePro()"
                >
                  [Reset to Free Tier]
                </button>
              </div>
              <p>
                {{
                  isProActive()
                    ? "Enjoy unlimited adaptively generated mock tests, complete GATE/ESE catalog papers, and advanced diagnostic evaluation."
                    : "Get unlimited custom adaptive mock generators and unlock previous years ESE/GATE paper simulations (₹999/lifetime)."
                }}
              </p>
            </div>
            <div class="banner-action" *ngIf="!isProActive()">
              <ion-button
                color="secondary"
                fill="solid"
                class="banner-btn"
                (click)="openCheckout()"
              >
                Upgrade Now (₹999)
              </ion-button>
            </div>
          </div>

          <!-- Divider line -->
          <div class="hub-divider"></div>

          <!-- Right: AI Adaptive Mock Generator Widget -->
          <div class="adaptive-widget-wrapper">
            <div
              class="widget-overlay"
              *ngIf="!isProActive()"
              (click)="openCheckout()"
            >
              <div class="overlay-content">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 15v2a3 3 0 003 3h4a3 3 0 003-3v-2M9 11V9a5 5 0 0110 0v2M8 11h12a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Unlock Adaptive Generator with Pro Pass</span>
              </div>
            </div>

            <div class="adaptive-widget" [class.blur-content]="!isProActive()">
              <div class="adaptive-header">
                <div
                  class="adaptive-icon"
                  [class.animate-pulse-glow]="isProActive()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
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
                  <span class="density-badge"
                    >{{ adaptiveQuestionCount() }} Qs</span
                  >
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
                  class="custom-range"
                >
                </ion-range>
              </div>

              <ion-button
                expand="block"
                color="secondary"
                class="gradient-btn"
                [disabled]="adaptiveStarting()"
                (click)="startAdaptiveMock()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style="width:16px;height:16px;margin-right:8px"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                  *ngIf="!adaptiveStarting()"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>{{
                  adaptiveStarting()
                    ? "Generating Mocks..."
                    : "Generate Adaptive Mock"
                }}</span>
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Horizontal Search & Filter Bar -->
        <section class="search-filter-bar glass-card">
          <div class="filter-main-row">
            <!-- Keyword Search Box -->
            <div class="search-field-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.2"
                class="search-icon-svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search subjects, topics, or PSUs (e.g. ISRO)..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchQueryChange($event)"
                class="search-input"
              />
              <button
                class="search-clear-btn"
                *ngIf="searchQuery()"
                (click)="clearSearch()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Test Category Selectors -->
            <div class="filter-group">
              <span class="filter-label">Category:</span>
              <div class="chips-group">
                <button
                  class="chip-btn"
                  [class.active]="filter() === 'all'"
                  (click)="setTypeFilter('all'); loadCatalog()"
                >
                  All
                </button>
                <button
                  class="chip-btn"
                  [class.active]="filter() === 'topic'"
                  (click)="setTypeFilter('topic'); loadCatalog()"
                >
                  Topic-wise
                </button>
                <button
                  class="chip-btn"
                  [class.active]="filter() === 'subject'"
                  (click)="setTypeFilter('subject'); loadCatalog()"
                >
                  Subject-wise
                </button>
                <button
                  class="chip-btn"
                  [class.active]="filter() === 'full_length'"
                  (click)="setTypeFilter('full_length'); loadCatalog()"
                >
                  Full-Length
                </button>
              </div>
            </div>

            <!-- Target Exam Selectors -->
            <div class="filter-group">
              <span class="filter-label">Exam:</span>
              <div class="chips-group">
                <button
                  class="chip-btn"
                  [class.active]="examCodeFilter() === null"
                  (click)="onExamCodeChange(null); loadCatalog()"
                >
                  All
                </button>
                <button
                  class="chip-btn"
                  [class.active]="examCodeFilter() === 'GATE'"
                  (click)="onExamCodeChange('GATE'); loadCatalog()"
                >
                  GATE
                </button>
                <button
                  class="chip-btn"
                  [class.active]="examCodeFilter() === 'ESE'"
                  (click)="onExamCodeChange('ESE'); loadCatalog()"
                >
                  ESE
                </button>
                <button
                  class="chip-btn"
                  [class.active]="examCodeFilter() === 'PSU'"
                  (click)="onExamCodeChange('PSU'); loadCatalog()"
                >
                  PSUs
                </button>
              </div>
            </div>

            <!-- Advanced Trigger -->
            <button
              class="more-filters-btn"
              [class.active]="advancedOpen()"
              (click)="toggleAdvanced()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.2"
                class="filter-icon-svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span>Filters</span>
              <span class="active-badge" *ngIf="activeFiltersCount() > 0">{{
                activeFiltersCount()
              }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
                class="chevron-svg"
                [class.rotated]="advancedOpen()"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 9l-7 7-7-7"
                />
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
                  <button
                    class="chip-btn"
                    [class.active]="paperFilter() === ''"
                    (click)="paperFilter.set(''); loadCatalog()"
                  >
                    All Branches
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="paperFilter() === 'Computer Science'"
                    (click)="paperFilter.set('Computer Science'); loadCatalog()"
                  >
                    CS / IT
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="paperFilter() === 'Mechanical Engineering'"
                    (click)="
                      paperFilter.set('Mechanical Engineering'); loadCatalog()
                    "
                  >
                    Mechanical
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="paperFilter() === 'Electrical Engineering'"
                    (click)="
                      paperFilter.set('Electrical Engineering'); loadCatalog()
                    "
                  >
                    Electrical
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="paperFilter() === 'Electronics Engineering'"
                    (click)="
                      paperFilter.set('Electronics Engineering'); loadCatalog()
                    "
                  >
                    Electronics
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="paperFilter() === 'Civil Engineering'"
                    (click)="
                      paperFilter.set('Civil Engineering'); loadCatalog()
                    "
                  >
                    Civil
                  </button>
                </div>
              </div>

              <!-- PSU selection -->
              <div class="drawer-column">
                <span class="drawer-label">Recruiting PSU / Company</span>
                <div class="chips-group">
                  <button
                    class="chip-btn"
                    [class.active]="companyFilter() === ''"
                    (click)="companyFilter.set(''); loadCatalog()"
                  >
                    All Companies
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="companyFilter() === 'ISRO'"
                    (click)="companyFilter.set('ISRO'); loadCatalog()"
                  >
                    ISRO
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="companyFilter() === 'ONGC'"
                    (click)="companyFilter.set('ONGC'); loadCatalog()"
                  >
                    ONGC
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="companyFilter() === 'BARC'"
                    (click)="companyFilter.set('BARC'); loadCatalog()"
                  >
                    BARC
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="companyFilter() === 'BHEL'"
                    (click)="companyFilter.set('BHEL'); loadCatalog()"
                  >
                    BHEL
                  </button>
                </div>
              </div>

              <!-- Exam Year selection -->
              <div class="drawer-column">
                <span class="drawer-label">Exam Year</span>
                <div class="chips-group">
                  <button
                    class="chip-btn"
                    [class.active]="examYearInput() === ''"
                    (click)="examYearInput.set(''); loadCatalog()"
                  >
                    All Years
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="examYearInput() === '2024'"
                    (click)="examYearInput.set('2024'); loadCatalog()"
                  >
                    2024
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="examYearInput() === '2023'"
                    (click)="examYearInput.set('2023'); loadCatalog()"
                  >
                    2023
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="examYearInput() === '2022'"
                    (click)="examYearInput.set('2022'); loadCatalog()"
                  >
                    2022
                  </button>
                  <button
                    class="chip-btn"
                    [class.active]="examYearInput() === '2021'"
                    (click)="examYearInput.set('2021'); loadCatalog()"
                  >
                    2021
                  </button>
                </div>
              </div>
            </div>

            <!-- Drawer actions -->
            <div class="drawer-footer-actions">
              <button
                class="btn-clear-all"
                (click)="resetFilters()"
                *ngIf="activeFiltersCount() > 0"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </section>

        <!-- Mock Tests Main Grid -->
        <main class="tests-main-container stack">
          <div class="results-header">
            <h2 class="section-title">Available Mock Tests</h2>
            <span class="results-count"
              >{{ tests().length }} mock tests found</span
            >
          </div>

          <!-- Alert/Notification Banner -->
          <div class="error-msg-banner" *ngIf="errorMessage()">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>

          <div
            class="catalog-grid-layout"
            *ngIf="tests().length; else emptyState"
          >
            <article
              class="glass-card test-card-redesign"
              *ngFor="let test of tests()"
            >
              <div class="card-top">
                <div class="tags-group">
                  <span class="badge-exam">{{ test.examCode || "GATE" }}</span>
                  <span class="badge-subject" *ngIf="test.paperCode">{{
                    test.paperCode
                  }}</span>
                  <span class="badge-company" *ngIf="test.companyName">{{
                    test.companyName
                  }}</span>
                  <span class="badge-year" *ngIf="test.examYear">{{
                    test.examYear
                  }}</span>
                  <span class="badge-adaptive" *ngIf="test.isAdaptive"
                    >Adaptive</span
                  >
                </div>
                <span
                  class="lock-pill"
                  *ngIf="
                    !isProActive() &&
                    (test.isAdaptive || test.testType === 'full_length')
                  "
                  >🔒 Pro</span
                >
                <span
                  class="unlocked-pill"
                  *ngIf="
                    isProActive() &&
                    (test.isAdaptive || test.testType === 'full_length')
                  "
                  >👑 Pro</span
                >
              </div>

              <div class="card-main">
                <h3>{{ test.title }}</h3>
                <p class="test-category-label">
                  {{ formatType(test.testType) }} •
                  {{ test.subjectName || "General Engineering" }}
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
                  <strong class="stat-val"
                    >{{ test.durationMinutes }} min</strong
                  >
                </div>
              </div>

              <div
                class="instructions-accordion"
                *ngIf="test.instructions.length"
              >
                <span class="accordion-title">Guidelines:</span>
                <ul class="accordion-list">
                  <li *ngFor="let instruction of test.instructions">
                    {{ instruction }}
                  </li>
                </ul>
              </div>

              <ion-button
                expand="block"
                (click)="startTest(test)"
                [disabled]="startingTestId() === test.id"
                [color]="
                  test.isAdaptive || test.testType === 'full_length'
                    ? isProActive()
                      ? 'primary'
                      : 'secondary'
                    : 'primary'
                "
                class="action-btn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style="width:16px;height:16px;margin-right:8px"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                  *ngIf="
                    !isProActive() &&
                    (test.isAdaptive || test.testType === 'full_length')
                  "
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 15v2a3 3 0 003 3h4a3 3 0 003-3v-2M9 11V9a5 5 0 0110 0v2M8 11h12a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 01-2-2z"
                  />
                </svg>
                <span>
                  {{
                    test.isAdaptive || test.testType === "full_length"
                      ? isProActive()
                        ? "Start Premium Mock"
                        : "Unlock with Pro 🔒"
                      : startingTestId() === test.id
                        ? "Loading Exam..."
                        : "Start Mock Test"
                  }}
                </span>
              </ion-button>
            </article>
          </div>
        </main>

        <!-- Empty State -->
        <ng-template #emptyState>
          <div class="glass-card empty-card stack">
            <div class="empty-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3>No mock tests matched</h3>
            <p>
              Try clearing some filters or searching for another recruiting
              body, subject, or year.
            </p>
            <ion-button fill="solid" color="primary" (click)="resetFilters()"
              >Reset All Filters</ion-button
            >
          </div>
        </ng-template>

        <!-- Simulated Checkout Modal -->
        <div
          class="modal-backdrop"
          *ngIf="showCheckoutModal()"
          (click)="closeCheckout()"
        >
          <div
            class="checkout-modal glass-card"
            (click)="$event.stopPropagation()"
          >
            <button class="modal-close-btn" (click)="closeCheckout()">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div class="checkout-header">
              <span class="pro-tag-badge">GURUKOOL PRO PASS</span>
              <h2>Unlock Lifetime Access</h2>
              <p>
                Practice adaptively, analyze your weaknesses, and simulation
                exam tracks without limits.
              </p>
            </div>

            <div class="checkout-body">
              <div class="price-row">
                <span class="price-label">Upgrade Fee</span>
                <span class="price-value">₹999 <small>/ lifetime</small></span>
              </div>

              <!-- Payment Methods -->
              <div class="payment-methods-grid">
                <button
                  class="payment-method-card"
                  [class.active]="selectedPaymentMethod() === 'upi'"
                  (click)="setPaymentMethod('upi')"
                >
                  <div class="method-icon">📱</div>
                  <span>UPI (GPay / PhonePe)</span>
                </button>
                <button
                  class="payment-method-card"
                  [class.active]="selectedPaymentMethod() === 'card'"
                  (click)="setPaymentMethod('card')"
                >
                  <div class="method-icon">💳</div>
                  <span>Credit / Debit Card</span>
                </button>
                <button
                  class="payment-method-card"
                  [class.active]="selectedPaymentMethod() === 'net'"
                  (click)="setPaymentMethod('net')"
                >
                  <div class="method-icon">🏦</div>
                  <span>Net Banking</span>
                </button>
              </div>

              <!-- Simulated UPI inputs or details -->
              <div class="method-details-panel">
                <div
                  *ngIf="selectedPaymentMethod() === 'upi'"
                  class="detail-row stack"
                >
                  <label class="input-label">Enter UPI ID</label>
                  <input
                    type="text"
                    value="student@okhdfcbank"
                    class="checkout-input"
                    disabled
                  />
                </div>
                <div
                  *ngIf="selectedPaymentMethod() === 'card'"
                  class="detail-row stack"
                >
                  <label class="input-label">Card Number</label>
                  <input
                    type="text"
                    value="•••• •••• •••• 4242"
                    class="checkout-input"
                    disabled
                  />
                </div>
                <div
                  *ngIf="selectedPaymentMethod() === 'net'"
                  class="detail-row stack"
                >
                  <label class="input-label">Selected Bank</label>
                  <input
                    type="text"
                    value="State Bank of India (SBI)"
                    class="checkout-input"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div class="checkout-footer">
              <button
                class="btn-checkout-confirm"
                [disabled]="isProcessingPayment()"
                (click)="processCheckout()"
              >
                <span *ngIf="!isProcessingPayment()"
                  >Pay ₹999 & Activate Pass</span
                >
                <span *ngIf="isProcessingPayment()" class="spinner-row">
                  <span class="checkout-spinner"></span>
                  Processing Secure Payment...
                </span>
              </button>
              <p class="secure-checkout-notice">
                🔒 256-bit SSL encrypted transaction
              </p>
            </div>
          </div>
        </div>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styleUrls: ["./catalog.page.scss"],
})
export class CatalogPage implements OnInit {
  private readonly testEngineService = inject(TestEngineService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly tests = signal<TestCatalogItem[]>([]);
  readonly filter = signal<CatalogFilter>("all");
  readonly examCodeFilter = signal<ExamCode | null>(null);
  readonly companyFilter = signal("");
  readonly paperFilter = signal("");
  readonly examYearInput = signal("");
  readonly adaptiveQuestionCount = signal(12);

  // Redesign additionals
  readonly searchQuery = signal("");
  readonly filtersOpen = signal(false);
  readonly advancedOpen = signal(false);

  // Premium Pro Pass dynamic signals
  readonly isProActive = signal<boolean>(
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem("gk_pro_active") === "true"
      : false,
  );
  readonly showCheckoutModal = signal<boolean>(false);
  readonly isProcessingPayment = signal<boolean>(false);
  readonly selectedPaymentMethod = signal<string>("upi");

  readonly errorMessage = signal<string | null>(null);
  readonly startingTestId = signal<string | null>(null);
  readonly adaptiveStarting = signal(false);

  // Computes active filters count
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.filter() !== "all") count++;
    if (this.examCodeFilter() !== null) count++;
    if (this.companyFilter() !== "") count++;
    if (this.paperFilter() !== "") count++;
    if (this.examYearInput() !== "") count++;
    return count;
  });

  readonly queryFilters = computed<CatalogFilters>(() => {
    const year = Number(this.examYearInput());
    const parsedYear = Number.isFinite(year) && year >= 1990 ? year : undefined;
    const selectedType = this.filter();

    return {
      type: selectedType === "all" ? undefined : selectedType,
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
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  onExamCodeChange(value: string | null): void {
    if (value === "GATE" || value === "PSU" || value === "ESE") {
      this.examCodeFilter.set(value);
      return;
    }

    this.examCodeFilter.set(null);
  }

  onAdaptiveCountChange(
    value: number | { lower: number; upper: number } | null,
  ): void {
    if (typeof value === "number" && Number.isFinite(value)) {
      this.adaptiveQuestionCount.set(Math.round(value));
    }
  }

  // Redesign Custom Search Handler
  onSearchQueryChange(value: string): void {
    const val = this.normalizeText(value);
    this.searchQuery.set(val);

    const normalized = val.toLowerCase();
    if (normalized === "") {
      this.companyFilter.set("");
      this.paperFilter.set("");
    } else if (["isro", "ongc", "barc", "bhel"].includes(normalized)) {
      this.companyFilter.set(val);
      this.paperFilter.set("");
    } else {
      this.paperFilter.set(val);
      this.companyFilter.set("");
    }
    void this.loadCatalog();
  }

  clearSearch(): void {
    this.searchQuery.set("");
    this.companyFilter.set("");
    this.paperFilter.set("");
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
      const tests = await this.testEngineService.getCatalog(
        this.queryFilters(),
      );
      this.tests.set(tests);
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(
          error,
          "The test catalog could not be loaded right now.",
        ),
      );
    }
  }

  resetFilters(): void {
    this.filter.set("all");
    this.examCodeFilter.set(null);
    this.companyFilter.set("");
    this.paperFilter.set("");
    this.examYearInput.set("");
    this.searchQuery.set("");
    void this.loadCatalog();
  }

  setTypeFilter(value: string | number | undefined): void {
    if (
      value === "topic" ||
      value === "subject" ||
      value === "full_length" ||
      value === "all"
    ) {
      this.filter.set(value);
    }
  }

  formatType(testType: TestType): string {
    if (testType === "full_length") {
      return "Full-length";
    }

    return testType === "subject" ? "Subject-wise" : "Topic-wise";
  }

  // Gated premium test attempts
  async startTest(test: TestCatalogItem): Promise<void> {
    if (test.isAdaptive || test.testType === "full_length") {
      if (!this.isProActive()) {
        this.openCheckout();
        return;
      }
    }

    this.startingTestId.set(test.id);
    this.errorMessage.set(null);

    try {
      const result = await this.testEngineService.startAttempt(test.id);
      await this.router.navigateByUrl(
        `/tests/attempt/${result.detail.attempt.id}`,
      );
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, "The test could not be started."),
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
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("gk_pro_active", "true");
    }
    this.isProcessingPayment.set(false);
    this.showCheckoutModal.set(false);
    void this.loadCatalog();
  }

  deactivatePro(): void {
    this.isProActive.set(false);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("gk_pro_active", "false");
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
        type: currentFilter === "all" ? undefined : currentFilter,
      };

      const result = await this.testEngineService.startAdaptiveAttempt(payload);
      await this.router.navigateByUrl(
        `/tests/attempt/${result.detail.attempt.id}`,
      );
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(
          error,
          "The adaptive mock test could not be generated.",
        ),
      );
    } finally {
      this.adaptiveStarting.set(false);
    }
  }
}
