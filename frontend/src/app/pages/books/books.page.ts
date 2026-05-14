import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BooksNotesService } from '../../core/services/books-notes.service';
import { BookRecord, NotebookEntry, SubjectOption } from '../../core/models/books.models';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>Books & Notes</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="outline" (click)="refreshData()">Refresh</ion-button>
          <ion-button fill="outline" color="secondary" (click)="syncOffline()" [disabled]="syncing()">
            {{ syncing() ? 'Syncing...' : 'Sync Offline' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack books-shell">
        <section class="glass-card hero-card stack">
          <span class="section-kicker">Phase 4 - Books & Notes</span>
          <h1>Upload PDFs, confirm subject, and build revision notebooks.</h1>
          <p class="muted-copy">
            Connection status:
            <strong>{{ online() ? 'Online' : 'Offline' }}</strong>.
            Highlights and manual notes can queue offline and auto-sync later.
          </p>
        </section>

        <ion-note color="success" *ngIf="successMessage()">{{ successMessage() }}</ion-note>
        <ion-note color="danger" *ngIf="errorMessage()">{{ errorMessage() }}</ion-note>

        <section class="glass-card stack">
          <h2>1) Upload PDF + Subject Detection</h2>
          <input
            type="file"
            accept="application/pdf"
            (change)="onFileSelected($event)"
          />
          <p class="muted-copy" *ngIf="selectedFileName()">
            Selected: {{ selectedFileName() }}
          </p>
          <ion-button
            expand="block"
            (click)="uploadBook()"
            [disabled]="!selectedFile() || uploading()">
            {{ uploading() ? 'Uploading...' : 'Upload & Detect Subject' }}
          </ion-button>
        </section>

        <section class="glass-card stack">
          <h2>2) Confirm Subject</h2>
          <div class="book-list" *ngIf="books().length; else noBooks">
            <div class="book-row" *ngFor="let book of books()">
              <div class="book-meta">
                <strong>{{ book.fileName }}</strong>
                <span>Status: {{ book.status }}</span>
                <span *ngIf="book.detectedSubject">
                  Detected: {{ book.detectedSubject.code }} ({{ book.detectedSubject.confidence }}%)
                </span>
                <span *ngIf="book.confirmedSubject">
                  Confirmed: {{ book.confirmedSubject.code }}
                </span>
              </div>

              <div class="book-actions" *ngIf="book.status !== 'confirmed'">
                <ion-select
                  interface="popover"
                  [ngModel]="subjectSelectionMap()[book.id] || book.detectedSubject?.code || null"
                  (ngModelChange)="setSubjectSelection(book.id, $event)"
                  placeholder="Select subject">
                  <ion-select-option *ngFor="let subject of subjects()" [value]="subject.code">
                    {{ subject.code }} - {{ subject.name }}
                  </ion-select-option>
                </ion-select>
                <ion-button
                  size="small"
                  (click)="confirmSubject(book.id)"
                  [disabled]="confirmingBookId() === book.id">
                  {{ confirmingBookId() === book.id ? 'Saving...' : 'Confirm' }}
                </ion-button>
              </div>
            </div>
          </div>
        </section>

        <section class="glass-card stack">
          <h2>3) Highlight -> Auto Notebook</h2>
          <ion-item lines="none">
            <ion-label position="stacked">Book</ion-label>
            <ion-select
              interface="popover"
              [ngModel]="highlightBookId()"
              (ngModelChange)="setHighlightBookId($event)">
              <ion-select-option *ngFor="let book of books()" [value]="book.id">
                {{ book.fileName }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Page number (optional)</ion-label>
            <ion-input
              type="number"
              [ngModel]="highlightPageNumber()"
              (ngModelChange)="highlightPageNumber.set(toNumber($event))">
            </ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Highlight text</ion-label>
            <ion-textarea
              auto-grow="true"
              [ngModel]="highlightText()"
              (ngModelChange)="highlightText.set(toText($event))">
            </ion-textarea>
          </ion-item>
          <ion-button expand="block" (click)="saveHighlight()">
            Save Highlight to Notebook
          </ion-button>
        </section>

        <section class="glass-card stack">
          <h2>4) Manual Notes</h2>
          <ion-item lines="none">
            <ion-label position="stacked">Subject (optional)</ion-label>
            <ion-select
              interface="popover"
              [ngModel]="manualSubjectCode()"
              (ngModelChange)="setManualSubjectCode($event)">
              <ion-select-option [value]="null">No subject</ion-select-option>
              <ion-select-option *ngFor="let subject of subjects()" [value]="subject.code">
                {{ subject.code }} - {{ subject.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Title (optional)</ion-label>
            <ion-input
              [ngModel]="manualTitle()"
              (ngModelChange)="manualTitle.set(toText($event))">
            </ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Note</ion-label>
            <ion-textarea
              auto-grow="true"
              [ngModel]="manualNoteText()"
              (ngModelChange)="manualNoteText.set(toText($event))">
            </ion-textarea>
          </ion-item>
          <ion-button expand="block" (click)="saveManualNote()">
            Save Manual Note
          </ion-button>
        </section>

        <section class="glass-card stack">
          <h2>5) Paraphrase</h2>
          <ion-item lines="none">
            <ion-label position="stacked">Source text</ion-label>
            <ion-textarea
              auto-grow="true"
              [ngModel]="paraphraseSourceText()"
              (ngModelChange)="paraphraseSourceText.set(toText($event))">
            </ion-textarea>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Style</ion-label>
            <ion-select
              interface="popover"
              [ngModel]="paraphraseStyle()"
              (ngModelChange)="setParaphraseStyle($event)">
              <ion-select-option value="exam-ready">Exam-ready</ion-select-option>
              <ion-select-option value="concise">Concise</ion-select-option>
              <ion-select-option value="memory-hook">Memory hook</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-button expand="block" color="secondary" (click)="paraphraseAndSave()">
            Paraphrase + Save
          </ion-button>
          <ion-card *ngIf="latestParaphrase()" class="result-card">
            <ion-card-header>
              <ion-card-title>Latest Paraphrase</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <pre>{{ latestParaphrase() }}</pre>
            </ion-card-content>
          </ion-card>
        </section>

        <section class="glass-card stack">
          <h2>Notebook Entries</h2>
          <ion-item lines="none">
            <ion-label position="stacked">Filter by subject</ion-label>
            <ion-select
              interface="popover"
              [ngModel]="subjectFilter()"
              (ngModelChange)="setSubjectFilter($event)">
              <ion-select-option [value]="null">All</ion-select-option>
              <ion-select-option *ngFor="let subject of subjects()" [value]="subject.code">
                {{ subject.code }} - {{ subject.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <div class="note-list" *ngIf="visibleNotebookEntries().length; else noNotes">
            <div class="note-row" *ngFor="let entry of visibleNotebookEntries()">
              <strong>{{ entry.title || 'Notebook entry' }}</strong>
              <span>
                {{ entry.sourceType }}
                <span *ngIf="entry.subject"> - {{ entry.subject.code }}</span>
                <span *ngIf="entry.sourceBook"> - {{ entry.sourceBook.fileName }}</span>
              </span>
              <p>{{ entry.noteText }}</p>
            </div>
          </div>
        </section>
      </div>
    </ion-content>

    <ng-template #noBooks>
      <p class="muted-copy">No books uploaded yet.</p>
    </ng-template>

    <ng-template #noNotes>
      <p class="muted-copy">No notebook entries yet.</p>
    </ng-template>
  `,
  styles: [`
    .books-shell {
      padding-top: 88px;
    }

    .hero-card {
      margin: 0;
    }

    h1 {
      margin: 12px 0 8px;
      font-size: clamp(1.9rem, 4.8vw, 3.2rem);
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
    }

    h2 {
      margin: 0;
      color: var(--ion-color-dark);
      font-size: 1.15rem;
    }

    .book-list,
    .note-list {
      display: grid;
      gap: 12px;
    }

    .book-row,
    .note-row {
      border: 1px solid var(--gk-outline);
      border-radius: 16px;
      background: rgba(248, 250, 255, 0.78);
      padding: 12px;
      display: grid;
      gap: 8px;
    }

    .book-meta {
      display: grid;
      gap: 4px;
    }

    .book-meta span,
    .note-row span {
      color: var(--gk-muted);
      font-size: 0.86rem;
    }

    .book-actions {
      display: grid;
      gap: 10px;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }

    .note-row p {
      margin: 0;
      color: var(--ion-color-dark);
      line-height: 1.6;
    }

    ion-item {
      --background: rgba(255, 255, 255, 0.7);
      --border-radius: 14px;
      border: 1px solid var(--gk-outline);
      border-radius: 14px;
    }

    .result-card {
      margin: 0;
      border: 1px dashed rgba(30, 136, 229, 0.35);
      background: rgba(230, 242, 255, 0.58);
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: "Poppins", "Segoe UI", sans-serif;
      color: var(--ion-color-dark);
    }
  `],
})
export class BooksPage implements OnInit, OnDestroy {
  private readonly booksService = inject(BooksNotesService);
  private readonly authService = inject(AuthService);

  readonly subjects = signal<SubjectOption[]>([]);
  readonly books = signal<BookRecord[]>([]);
  readonly notebookEntries = signal<NotebookEntry[]>([]);
  readonly subjectSelectionMap = signal<Record<string, string>>({});

  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileName = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly confirmingBookId = signal<string | null>(null);
  readonly syncing = signal(false);
  readonly online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly highlightBookId = signal<string | null>(null);
  readonly highlightPageNumber = signal<number | undefined>(undefined);
  readonly highlightText = signal('');

  readonly manualSubjectCode = signal<string | null>(null);
  readonly manualTitle = signal('');
  readonly manualNoteText = signal('');

  readonly paraphraseSourceText = signal('');
  readonly paraphraseStyle = signal<'concise' | 'exam-ready' | 'memory-hook'>('exam-ready');
  readonly latestParaphrase = signal<string | null>(null);

  readonly subjectFilter = signal<string | null>(null);
  readonly visibleNotebookEntries = computed(() => {
    const filter = this.subjectFilter();
    if (!filter) {
      return this.notebookEntries();
    }

    return this.notebookEntries().filter((entry) => entry.subject?.code === filter);
  });

  private readonly updateOnlineStatus = () => {
    this.online.set(typeof navigator === 'undefined' ? true : navigator.onLine);
  };

  async ngOnInit(): Promise<void> {
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
    this.updateOnlineStatus();

    await this.syncOffline();
    await this.refreshData();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
  }

  toText(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value;
  }

  toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }

  setParaphraseStyle(value: unknown): void {
    if (value === 'concise' || value === 'exam-ready' || value === 'memory-hook') {
      this.paraphraseStyle.set(value);
    }
  }

  setSubjectFilter(value: unknown): void {
    if (typeof value === 'string' && value.trim().length > 0) {
      this.subjectFilter.set(value);
    } else {
      this.subjectFilter.set(null);
    }
  }

  setHighlightBookId(value: unknown): void {
    if (typeof value === 'string' && value.trim().length > 0) {
      this.highlightBookId.set(value);
    } else {
      this.highlightBookId.set(null);
    }
  }

  setManualSubjectCode(value: unknown): void {
    if (typeof value === 'string' && value.trim().length > 0) {
      this.manualSubjectCode.set(value);
    } else {
      this.manualSubjectCode.set(null);
    }
  }

  setSubjectSelection(bookId: string, subjectCode: unknown): void {
    if (typeof subjectCode !== 'string' || subjectCode.trim().length === 0) {
      return;
    }

    this.subjectSelectionMap.update((current) => ({
      ...current,
      [bookId]: subjectCode.trim(),
    }));
  }

  async refreshData(): Promise<void> {
    this.errorMessage.set(null);

    try {
      const [subjects, books, entries] = await Promise.all([
        this.booksService.getSubjects(),
        this.booksService.getBooks(),
        this.booksService.getNotebookEntries(),
      ]);

      this.subjects.set(subjects);
      this.books.set(books);
      this.notebookEntries.set(entries);
      this.subjectSelectionMap.update((current) => {
        const next = { ...current };
        for (const book of books) {
          if (!next[book.id]) {
            next[book.id] = book.confirmedSubject?.code ?? book.detectedSubject?.code ?? '';
          }
        }

        return next;
      });

      if (!this.highlightBookId() && books.length > 0) {
        this.highlightBookId.set(books[0].id);
      }
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'Books and notes data could not be loaded.')
      );
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile.set(null);
      this.selectedFileName.set(null);
      return;
    }

    if (file.type && file.type !== 'application/pdf') {
      this.errorMessage.set('Please choose a PDF file.');
      this.selectedFile.set(null);
      this.selectedFileName.set(null);
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
  }

  async uploadBook(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const preview = await this.extractPreviewText(file);
      const created = await this.booksService.uploadBook(file, preview);
      this.successMessage.set(
        created.detectedSubject
          ? `Book uploaded. Suggested subject: ${created.detectedSubject.code}. Please confirm.`
          : 'Book uploaded. Subject suggestion was weak, please confirm manually.'
      );

      this.selectedFile.set(null);
      this.selectedFileName.set(null);
      await this.refreshData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Book upload failed.'));
    } finally {
      this.uploading.set(false);
    }
  }

  async confirmSubject(bookId: string): Promise<void> {
    const book = this.books().find((item) => item.id === bookId);
    const selectedCode =
      this.subjectSelectionMap()[bookId] ||
      book?.confirmedSubject?.code ||
      book?.detectedSubject?.code;
    if (!selectedCode) {
      this.errorMessage.set('Select a subject code first.');
      return;
    }

    this.confirmingBookId.set(bookId);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.booksService.confirmBookSubject(bookId, selectedCode);
      this.successMessage.set('Subject confirmation saved.');
      await this.refreshData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Subject confirmation failed.'));
    } finally {
      this.confirmingBookId.set(null);
    }
  }

  async saveHighlight(): Promise<void> {
    const bookId = this.highlightBookId();
    const text = this.highlightText().trim();
    if (!bookId || text.length < 3) {
      this.errorMessage.set('Choose a book and enter highlight text.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.booksService.addHighlight(bookId, {
        pageNumber: this.highlightPageNumber(),
        highlightText: text,
      });

      this.highlightText.set('');
      this.highlightPageNumber.set(undefined);
      this.successMessage.set(
        this.online()
          ? 'Highlight copied into notebook.'
          : 'Highlight queued offline and will sync on reconnect.'
      );
      await this.refreshData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Highlight save failed.'));
    }
  }

  async saveManualNote(): Promise<void> {
    const noteText = this.manualNoteText().trim();
    if (noteText.length < 3) {
      this.errorMessage.set('Write at least a short manual note.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.booksService.addManualNote({
        subjectCode: this.manualSubjectCode() ?? undefined,
        title: this.manualTitle().trim() || undefined,
        noteText,
      });

      this.manualTitle.set('');
      this.manualNoteText.set('');
      this.successMessage.set(
        this.online()
          ? 'Manual note saved.'
          : 'Manual note queued offline and will sync on reconnect.'
      );
      await this.refreshData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Manual note save failed.'));
    }
  }

  async paraphraseAndSave(): Promise<void> {
    const sourceText = this.paraphraseSourceText().trim();
    if (sourceText.length < 8) {
      this.errorMessage.set('Please provide more text for paraphrasing.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const result = await this.booksService.paraphraseAndSave({
        sourceText,
        style: this.paraphraseStyle(),
        subjectCode: this.manualSubjectCode() ?? undefined,
      });

      this.latestParaphrase.set(result);
      this.successMessage.set(
        this.online()
          ? 'Paraphrased note saved.'
          : 'Paraphrase queued offline and will sync on reconnect.'
      );
      await this.refreshData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Paraphrasing failed.'));
    }
  }

  async syncOffline(): Promise<void> {
    this.syncing.set(true);
    this.errorMessage.set(null);

    try {
      const synced = await this.booksService.syncOfflineQueue();
      if (synced > 0) {
        this.successMessage.set(`${synced} offline action(s) synced.`);
      }
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Offline sync failed.'));
    } finally {
      this.syncing.set(false);
    }
  }

  private async extractPreviewText(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const previewBytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 180000));
    const decoder = new TextDecoder('windows-1252');
    const raw = decoder.decode(previewBytes);

    return raw
      .replace(/[^a-zA-Z0-9.,;:!?()_\-/%\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 25000);
  }
}
