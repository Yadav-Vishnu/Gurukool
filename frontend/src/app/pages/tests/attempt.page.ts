import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { TestEngineService } from '../../core/services/test-engine.service';
import {
  AttemptDetail,
  AttemptQuestion,
  AttemptQuestionResponse,
} from '../../core/models/test-engine.models';
import { ScientificCalculatorComponent } from './scientific-calculator.component';

type WrongTag =
  | 'concept-gap'
  | 'careless-mistake'
  | 'formula-recall'
  | 'time-pressure'
  | 'guesswork';

type DraftMap = Record<string, AttemptQuestionResponse>;

@Component({
  selector: 'app-test-attempt-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ScientificCalculatorComponent],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>{{ detail()?.test?.title || 'Test Attempt' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="outline" (click)="toggleCalculator()">
            {{ calculatorOpen() ? 'Hide Calculator' : 'Calculator' }}
          </ion-button>
          <ion-button color="danger" (click)="submitTest()">
            Submit
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack attempt-shell" *ngIf="detail() as currentDetail">
        <section class="status-strip">
          <div class="status-tile glass-card">
            <span>Remaining</span>
            <strong>{{ formatTimer(remainingSeconds()) }}</strong>
          </div>
          <div class="status-tile glass-card">
            <span>Answered</span>
            <strong>{{ answeredCount() }}/{{ currentDetail.questions.length }}</strong>
          </div>
          <div class="status-tile glass-card">
            <span>Marked</span>
            <strong>{{ reviewCount() }}</strong>
          </div>
          <div class="status-tile glass-card">
            <span>Score Weight</span>
            <strong>{{ currentDetail.test.totalMarks }} marks</strong>
          </div>
        </section>

        <ion-note color="success" *ngIf="saveMessage()">{{ saveMessage() }}</ion-note>
        <ion-note color="danger" *ngIf="errorMessage()">{{ errorMessage() }}</ion-note>

        <section class="layout-grid" *ngIf="currentQuestion() as question">
          <div class="stack">
            <ion-card class="glass-card question-card">
              <ion-card-header>
                <div class="meta-line">
                  <ion-chip color="secondary" outline="true">
                    <ion-label>{{ question.subjectName }}</ion-label>
                  </ion-chip>
                  <ion-chip color="tertiary" outline="true" *ngIf="question.topicName">
                    <ion-label>{{ question.topicName }}</ion-label>
                  </ion-chip>
                </div>
                <ion-card-title>
                  Question {{ currentIndex() + 1 }} of {{ currentDetail.questions.length }}
                </ion-card-title>
                <ion-card-subtitle>
                  {{ question.marks }} mark · negative {{ question.negativeMarks }} · target
                  {{ question.estimatedSeconds }} sec
                </ion-card-subtitle>
              </ion-card-header>

              <ion-card-content class="stack">
                <p class="prompt">{{ question.prompt }}</p>

                <div class="option-list">
                  <button
                    type="button"
                    class="option-card"
                    *ngFor="let option of question.options"
                    [class.selected]="currentResponse().selectedOption === option.id"
                    (click)="selectOption(option.id)">
                    <span class="option-badge">{{ option.id }}</span>
                    <span>{{ option.text }}</span>
                  </button>
                </div>

                <div class="tool-row">
                  <ion-button fill="outline" color="medium" (click)="clearResponse()">
                    Clear response
                  </ion-button>
                  <ion-button
                    fill="outline"
                    [color]="currentResponse().markedForReview ? 'warning' : 'medium'"
                    (click)="toggleReview()">
                    {{ currentResponse().markedForReview ? 'Unmark review' : 'Mark for review' }}
                  </ion-button>
                </div>

                <div class="stack notes-panel">
                  <div class="panel-heading">
                    <strong>Wrong-answer tag</strong>
                    <span class="muted-copy">Use this to remember why a question felt tricky.</span>
                  </div>
                  <div class="tag-row">
                    <ion-chip
                      *ngFor="let tag of wrongTags"
                      [color]="currentResponse().wrongTag === tag ? 'primary' : 'medium'"
                      [outline]="currentResponse().wrongTag !== tag"
                      (click)="setWrongTag(tag)">
                      <ion-label>{{ formatWrongTag(tag) }}</ion-label>
                    </ion-chip>
                    <ion-chip
                      color="medium"
                      outline="true"
                      *ngIf="currentResponse().wrongTag"
                      (click)="setWrongTag(null)">
                      <ion-label>Clear tag</ion-label>
                    </ion-chip>
                  </div>

                  <ion-item lines="none" class="note-box">
                    <ion-label position="stacked">Notes for revision</ion-label>
                    <ion-textarea
                      auto-grow="true"
                      [ngModel]="currentResponse().note || ''"
                      (ngModelChange)="updateNote($event)"
                      (ionBlur)="saveCurrentQuestion()"
                      placeholder="Write the formula, shortcut, or mistake you want to revisit.">
                    </ion-textarea>
                  </ion-item>

                  <div class="muted-copy small-copy">
                    Time spent on this question: {{ formatDuration(currentResponse().timeSpentSeconds) }}
                  </div>
                </div>
              </ion-card-content>
            </ion-card>

            <div class="nav-row">
              <ion-button fill="outline" [disabled]="currentIndex() === 0" (click)="goPrevious()">
                Previous
              </ion-button>
              <ion-button fill="outline" color="medium" (click)="saveCurrentQuestion()">
                Save
              </ion-button>
              <ion-button (click)="goNext()">
                {{ currentIndex() === currentDetail.questions.length - 1 ? 'Review last question' : 'Save & next' }}
              </ion-button>
            </div>
          </div>

          <div class="stack side-column">
            <ion-card class="glass-card">
              <ion-card-header>
                <ion-card-title>Question Palette</ion-card-title>
                <ion-card-subtitle>
                  Jump directly to any question and keep track of review flags.
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="palette-grid">
                  <button
                    type="button"
                    class="palette-button"
                    *ngFor="let paletteQuestion of currentDetail.questions; let index = index"
                    [class.active]="index === currentIndex()"
                    [class.answered]="paletteStatus(paletteQuestion.id) === 'answered'"
                    [class.answered-review]="paletteStatus(paletteQuestion.id) === 'answered-review'"
                    [class.review]="paletteStatus(paletteQuestion.id) === 'review'"
                    [class.visited]="paletteStatus(paletteQuestion.id) === 'visited'"
                    (click)="jumpTo(index)">
                    {{ index + 1 }}
                  </button>
                </div>
              </ion-card-content>
            </ion-card>

            <app-scientific-calculator *ngIf="calculatorOpen()"></app-scientific-calculator>
          </div>
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .attempt-shell {
      padding-top: 88px;
    }

    .status-strip {
      display: grid;
      gap: 12px;
    }

    .status-tile {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-tile span {
      color: var(--gk-muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-size: 0.74rem;
    }

    .status-tile strong {
      color: var(--ion-color-dark);
      font-size: 1.2rem;
    }

    .layout-grid {
      display: grid;
      gap: 18px;
    }

    .question-card {
      margin: 0;
    }

    .meta-line {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .prompt {
      margin: 0;
      color: var(--ion-color-dark);
      font-size: 1.02rem;
      line-height: 1.8;
    }

    .option-list {
      display: grid;
      gap: 12px;
    }

    .option-card {
      border: 1px solid var(--gk-outline);
      border-radius: 18px;
      padding: 14px 16px;
      background: rgba(248, 250, 255, 0.88);
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
      color: var(--ion-color-dark);
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }

    .option-card.selected {
      border-color: rgba(30, 136, 229, 0.38);
      box-shadow: 0 16px 34px rgba(30, 136, 229, 0.14);
      transform: translateY(-1px);
      background: rgba(232, 242, 255, 0.95);
    }

    .option-badge {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
      background: rgba(23, 50, 77, 0.08);
      font-weight: 700;
    }

    .tool-row,
    .nav-row {
      display: grid;
      gap: 12px;
    }

    .notes-panel {
      padding: 16px;
      border-radius: 20px;
      border: 1px solid rgba(244, 109, 67, 0.12);
      background: rgba(255, 248, 240, 0.82);
    }

    .panel-heading {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .note-box {
      --background: rgba(255, 255, 255, 0.92);
      --border-radius: 18px;
      --padding-start: 14px;
      border: 1px solid rgba(23, 50, 77, 0.08);
    }

    .small-copy {
      font-size: 0.82rem;
    }

    .side-column ion-card {
      margin: 0;
    }

    .palette-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .palette-button {
      border-radius: 14px;
      border: 1px solid var(--gk-outline);
      background: white;
      min-height: 44px;
      font-weight: 700;
      color: var(--ion-color-dark);
    }

    .palette-button.active {
      outline: 2px solid rgba(30, 136, 229, 0.42);
      outline-offset: 2px;
    }

    .palette-button.answered {
      background: rgba(46, 159, 99, 0.18);
      border-color: rgba(46, 159, 99, 0.28);
    }

    .palette-button.answered-review {
      background: rgba(247, 183, 51, 0.24);
      border-color: rgba(247, 183, 51, 0.3);
    }

    .palette-button.review {
      background: rgba(247, 183, 51, 0.16);
      border-color: rgba(247, 183, 51, 0.26);
    }

    .palette-button.visited {
      background: rgba(23, 50, 77, 0.08);
      border-color: rgba(23, 50, 77, 0.14);
    }

    @media (min-width: 768px) {
      .status-strip {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .tool-row,
      .nav-row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (min-width: 1100px) {
      .layout-grid {
        grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr);
        align-items: start;
      }
    }
  `],
})
export class AttemptPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly testEngineService = inject(TestEngineService);

  readonly detail = signal<AttemptDetail | null>(null);
  readonly currentIndex = signal(0);
  readonly drafts = signal<DraftMap>({});
  readonly remainingSeconds = signal(0);
  readonly calculatorOpen = signal(false);
  readonly saveMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly answeredCount = computed(() =>
    Object.values(this.drafts()).filter((response) => Boolean(response.selectedOption)).length
  );

  readonly reviewCount = computed(() =>
    Object.values(this.drafts()).filter((response) => response.markedForReview).length
  );

  readonly currentQuestion = computed(() => {
    const detail = this.detail();
    if (!detail) {
      return null;
    }

    return detail.questions[this.currentIndex()] ?? null;
  });

  readonly wrongTags: WrongTag[] = [
    'concept-gap',
    'careless-mistake',
    'formula-recall',
    'time-pressure',
    'guesswork',
  ];

  private timerId: ReturnType<typeof window.setInterval> | null = null;
  private saveTimeout: ReturnType<typeof window.setTimeout> | null = null;
  private activeQuestionStartedAt = Date.now();

  async ngOnInit(): Promise<void> {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (!attemptId) {
      await this.router.navigateByUrl('/tests', { replaceUrl: true });
      return;
    }

    await this.loadAttempt(attemptId);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.saveTimeout) {
      window.clearTimeout(this.saveTimeout);
    }
  }

  currentResponse(): AttemptQuestionResponse {
    const question = this.currentQuestion();
    if (!question) {
      return {
        selectedOption: null,
        markedForReview: false,
        visited: false,
        note: null,
        wrongTag: null,
        timeSpentSeconds: 0,
      };
    }

    return this.drafts()[question.id] ?? question.response;
  }

  formatTimer(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (safeSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  formatDuration(totalSeconds: number): string {
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  formatWrongTag(tag: WrongTag): string {
    return tag
      .split('-')
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }

  paletteStatus(questionId: string): string {
    const draft = this.drafts()[questionId];
    if (!draft) {
      return 'not-visited';
    }

    if (draft.selectedOption && draft.markedForReview) {
      return 'answered-review';
    }

    if (draft.selectedOption) {
      return 'answered';
    }

    if (draft.markedForReview) {
      return 'review';
    }

    return draft.visited ? 'visited' : 'not-visited';
  }

  toggleCalculator(): void {
    this.calculatorOpen.update((value) => !value);
  }

  async selectOption(optionId: string): Promise<void> {
    this.patchCurrentResponse({
      selectedOption: optionId,
      visited: true,
    });
    await this.saveCurrentQuestion();
  }

  async clearResponse(): Promise<void> {
    this.patchCurrentResponse({
      selectedOption: null,
      visited: true,
    });
    await this.saveCurrentQuestion();
  }

  async toggleReview(): Promise<void> {
    const current = this.currentResponse();
    this.patchCurrentResponse({
      markedForReview: !current.markedForReview,
      visited: true,
    });
    await this.saveCurrentQuestion();
  }

  updateNote(value: string | number | null): void {
    this.patchCurrentResponse({
      note: typeof value === 'string' ? value : String(value ?? ''),
      visited: true,
    });
  }

  async setWrongTag(tag: WrongTag | null): Promise<void> {
    const current = this.currentResponse();
    this.patchCurrentResponse({
      wrongTag: current.wrongTag === tag ? null : tag,
      visited: true,
    });
    await this.saveCurrentQuestion();
  }

  async goPrevious(): Promise<void> {
    const nextIndex = Math.max(0, this.currentIndex() - 1);
    await this.jumpTo(nextIndex);
  }

  async goNext(): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const nextIndex = Math.min(detail.questions.length - 1, this.currentIndex() + 1);
    await this.jumpTo(nextIndex);
  }

  async jumpTo(index: number): Promise<void> {
    const detail = this.detail();
    if (!detail) {
      return;
    }

    const boundedIndex = Math.min(Math.max(index, 0), detail.questions.length - 1);
    await this.saveCurrentQuestion(boundedIndex);
    this.currentIndex.set(boundedIndex);
    this.activeQuestionStartedAt = Date.now();
  }

  async saveCurrentQuestion(nextIndex = this.currentIndex()): Promise<void> {
    const detail = this.detail();
    const question = this.currentQuestion();
    if (!detail || !question) {
      return;
    }

    this.captureQuestionTime(question.id);

    const draft = this.drafts()[question.id];
    if (!draft) {
      return;
    }

    this.errorMessage.set(null);

    try {
      const saved = await this.testEngineService.saveAnswer(detail.attempt.id, question.id, {
        selectedOption: draft.selectedOption,
        markedForReview: draft.markedForReview,
        note: draft.note || null,
        wrongTag: draft.wrongTag || null,
        visited: true,
        timeSpentSeconds: draft.timeSpentSeconds,
        currentQuestionIndex: nextIndex,
      });

      this.drafts.update((current) => ({
        ...current,
        [question.id]: {
          selectedOption: saved.selectedOption,
          markedForReview: saved.markedForReview,
          visited: saved.visited,
          note: saved.note,
          wrongTag: saved.wrongTag,
          timeSpentSeconds: saved.timeSpentSeconds,
        },
      }));

      this.detail.update((current) =>
        current
          ? {
              ...current,
              attempt: {
                ...current.attempt,
                currentQuestionIndex: nextIndex,
              },
            }
          : current
      );

      this.flashSavedMessage('Progress saved');
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'The current question could not be saved.')
      );
    }
  }

  async submitTest(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.saveCurrentQuestion(this.currentIndex());
      await this.testEngineService.submitAttempt(detail.attempt.id);
      await this.router.navigateByUrl(`/tests/attempt/${detail.attempt.id}/analytics`, {
        replaceUrl: true,
      });
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'The test could not be submitted.')
      );
      this.submitting.set(false);
    }
  }

  private async loadAttempt(attemptId: string): Promise<void> {
    this.errorMessage.set(null);

    try {
      const detail = await this.testEngineService.getAttempt(attemptId);
      this.detail.set(detail);
      this.currentIndex.set(
        Math.min(detail.attempt.currentQuestionIndex, Math.max(detail.questions.length - 1, 0))
      );
      this.remainingSeconds.set(detail.attempt.remainingSeconds);

      const drafts = detail.questions.reduce<DraftMap>((accumulator, question) => {
        accumulator[question.id] = { ...question.response };
        return accumulator;
      }, {});

      this.drafts.set(drafts);
      this.activeQuestionStartedAt = Date.now();
      this.startTimer();

      if (detail.attempt.status === 'submitted') {
        await this.router.navigateByUrl(`/tests/attempt/${attemptId}/analytics`, {
          replaceUrl: true,
        });
      }
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'The attempt could not be loaded.')
      );
    }
  }

  private startTimer(): void {
    this.stopTimer();

    this.timerId = window.setInterval(() => {
      const current = this.remainingSeconds();
      if (current <= 1) {
        this.remainingSeconds.set(0);
        this.stopTimer();
        void this.submitTest();
        return;
      }

      this.remainingSeconds.set(current - 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private patchCurrentResponse(patch: Partial<AttemptQuestionResponse>): void {
    const question = this.currentQuestion();
    if (!question) {
      return;
    }

    this.drafts.update((current) => ({
      ...current,
      [question.id]: {
        ...(current[question.id] ?? question.response),
        ...patch,
      },
    }));
  }

  private captureQuestionTime(questionId: string): void {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - this.activeQuestionStartedAt) / 1000)
    );

    if (elapsedSeconds <= 0) {
      return;
    }

    this.drafts.update((current) => {
      const draft = current[questionId];
      if (!draft) {
        return current;
      }

      return {
        ...current,
        [questionId]: {
          ...draft,
          visited: true,
          timeSpentSeconds: draft.timeSpentSeconds + elapsedSeconds,
        },
      };
    });

    this.activeQuestionStartedAt = Date.now();
  }

  private flashSavedMessage(message: string): void {
    this.saveMessage.set(message);

    if (this.saveTimeout) {
      window.clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = window.setTimeout(() => {
      this.saveMessage.set(null);
    }, 1200);
  }
}
