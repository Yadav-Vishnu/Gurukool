import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { TestEngineService } from '../../core/services/test-engine.service';
import {
  CatalogFilters,
  ExamCode,
  TestCatalogItem,
  TestType,
} from '../../core/models/test-engine.models';

type CatalogFilter = 'all' | TestType;

@Component({
  selector: 'app-test-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>Multi-Exam Test Engine</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack catalog-shell">
        <section class="glass-card hero-card stack">
          <span class="section-kicker">Phase 3 - PSU + ESE Expansion</span>
          <h1>Filter by exam, company, paper, and year.</h1>
          <p class="muted-copy">
            Try requests like ONGC aptitude 2022 or ESE Mechanical PYQs, then launch
            either a fixed mock or an adaptive one.
          </p>
        </section>

        <section class="glass-card filter-card stack">
          <ion-segment [value]="filter()" (ionChange)="setTypeFilter($event.detail.value)">
            <ion-segment-button value="all">
              <ion-label>All</ion-label>
            </ion-segment-button>
            <ion-segment-button value="topic">
              <ion-label>Topic</ion-label>
            </ion-segment-button>
            <ion-segment-button value="subject">
              <ion-label>Subject</ion-label>
            </ion-segment-button>
            <ion-segment-button value="full_length">
              <ion-label>Full</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div class="filter-grid">
            <ion-item lines="none">
              <ion-label position="stacked">Exam track</ion-label>
              <ion-select
                interface="popover"
                [ngModel]="examCodeFilter()"
                (ngModelChange)="onExamCodeChange($event)"
                placeholder="All">
                <ion-select-option [value]="null">All</ion-select-option>
                <ion-select-option value="GATE">GATE</ion-select-option>
                <ion-select-option value="PSU">PSU</ion-select-option>
                <ion-select-option value="ESE">ESE</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">Company</ion-label>
              <ion-input
                placeholder="ONGC / BHEL / UPSC"
                [ngModel]="companyFilter()"
                (ngModelChange)="companyFilter.set(normalizeText($event))">
              </ion-input>
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">Paper</ion-label>
              <ion-input
                placeholder="Aptitude / Mechanical"
                [ngModel]="paperFilter()"
                (ngModelChange)="paperFilter.set(normalizeText($event))">
              </ion-input>
            </ion-item>

            <ion-item lines="none">
              <ion-label position="stacked">Year</ion-label>
              <ion-input
                type="number"
                placeholder="2022"
                [ngModel]="examYearInput()"
                (ngModelChange)="examYearInput.set(normalizeText($event))">
              </ion-input>
            </ion-item>
          </div>

          <div class="action-row">
            <ion-button fill="outline" color="medium" (click)="resetFilters()">
              Reset
            </ion-button>
            <ion-button (click)="loadCatalog()">
              Apply filters
            </ion-button>
          </div>
        </section>

        <section class="glass-card adaptive-card stack">
          <h2>Adaptive Mock</h2>
          <p class="muted-copy">
            Builds a personalized test from your weak areas and selected exam filters.
          </p>
          <ion-item lines="none">
            <ion-label position="stacked">Question count</ion-label>
            <ion-range
              [min]="5"
              [max]="30"
              [pin]="true"
              [snaps]="true"
              [step]="1"
              [ngModel]="adaptiveQuestionCount()"
              (ngModelChange)="onAdaptiveCountChange($event)">
            </ion-range>
          </ion-item>
          <ion-button
            expand="block"
            color="secondary"
            (click)="startAdaptiveMock()"
            [disabled]="adaptiveStarting()">
            {{ adaptiveStarting() ? 'Generating adaptive mock...' : 'Start Adaptive Mock' }}
          </ion-button>
        </section>

        <ion-note color="danger" *ngIf="errorMessage()">
          {{ errorMessage() }}
        </ion-note>

        <div class="catalog-grid" *ngIf="tests().length; else emptyState">
          <ion-card class="glass-card test-card" *ngFor="let test of tests()">
            <ion-card-header>
              <div class="meta-row">
                <ion-chip color="primary" outline="true">
                  <ion-label>{{ test.examCode || 'GATE' }}</ion-label>
                </ion-chip>
                <ion-chip color="tertiary" outline="true" *ngIf="test.companyName">
                  <ion-label>{{ test.companyName }}</ion-label>
                </ion-chip>
                <ion-chip color="secondary" outline="true" *ngIf="test.paperCode">
                  <ion-label>{{ test.paperCode }}</ion-label>
                </ion-chip>
                <ion-chip color="medium" outline="true" *ngIf="test.examYear">
                  <ion-label>{{ test.examYear }}</ion-label>
                </ion-chip>
                <ion-chip color="warning" *ngIf="test.isAdaptive">
                  <ion-label>Adaptive</ion-label>
                </ion-chip>
              </div>
              <ion-card-title>{{ test.title }}</ion-card-title>
              <ion-card-subtitle>
                {{ formatType(test.testType) }} · {{ test.subjectName || 'Mixed' }}
              </ion-card-subtitle>
            </ion-card-header>

            <ion-card-content class="stack">
              <p class="muted-copy">{{ test.description }}</p>

              <div class="stat-grid">
                <div class="stat-pill">
                  <span>Questions</span>
                  <strong>{{ test.totalQuestions }}</strong>
                </div>
                <div class="stat-pill">
                  <span>Marks</span>
                  <strong>{{ test.totalMarks }}</strong>
                </div>
                <div class="stat-pill">
                  <span>Timer</span>
                  <strong>{{ test.durationMinutes }} min</strong>
                </div>
              </div>

              <div class="instruction-list">
                <div class="instruction-item" *ngFor="let instruction of test.instructions">
                  {{ instruction }}
                </div>
              </div>

              <ion-button expand="block" (click)="startTest(test)" [disabled]="startingTestId() === test.id">
                {{ startingTestId() === test.id ? 'Opening...' : 'Start Test' }}
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <ng-template #emptyState>
          <ion-card class="glass-card empty-card">
            <ion-card-content class="ion-text-center">
              No tests matched this filter yet.
            </ion-card-content>
          </ion-card>
        </ng-template>
      </div>
    </ion-content>
  `,
  styles: [`
    .catalog-shell {
      padding-top: 88px;
    }

    .hero-card,
    .filter-card,
    .adaptive-card,
    .test-card,
    .empty-card {
      margin: 0;
    }

    h1 {
      margin: 14px 0 10px;
      font-size: clamp(2rem, 5vw, 3.4rem);
      line-height: 0.98;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
    }

    h2 {
      margin: 0;
      color: var(--ion-color-dark);
      font-size: 1.2rem;
    }

    .filter-grid {
      display: grid;
      gap: 10px;
    }

    .filter-card ion-item,
    .adaptive-card ion-item {
      --background: rgba(255, 255, 255, 0.72);
      --border-radius: 14px;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
    }

    .action-row {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .catalog-grid {
      display: grid;
      gap: 18px;
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .stat-pill {
      padding: 12px;
      border-radius: 16px;
      border: 1px solid var(--gk-outline);
      background: rgba(248, 250, 255, 0.78);
    }

    .stat-pill span {
      display: block;
      font-size: 0.76rem;
      color: var(--gk-muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .stat-pill strong {
      display: block;
      margin-top: 6px;
      color: var(--ion-color-dark);
    }

    .instruction-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .instruction-item {
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(255, 247, 238, 0.76);
      border: 1px solid rgba(244, 109, 67, 0.12);
      color: var(--gk-muted);
    }

    @media (min-width: 900px) {
      .filter-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .catalog-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
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

  readonly errorMessage = signal<string | null>(null);
  readonly startingTestId = signal<string | null>(null);
  readonly adaptiveStarting = signal(false);

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

  async startTest(test: TestCatalogItem): Promise<void> {
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

  async startAdaptiveMock(): Promise<void> {
    this.adaptiveStarting.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.testEngineService.startAdaptiveAttempt({
        ...this.queryFilters(),
        questionCount: this.adaptiveQuestionCount(),
      });

      await this.router.navigateByUrl(`/tests/attempt/${result.detail.attempt.id}`);
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'Adaptive mock generation failed for this filter.')
      );
    } finally {
      this.adaptiveStarting.set(false);
    }
  }
}
