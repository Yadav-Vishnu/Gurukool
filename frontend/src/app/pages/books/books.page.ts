import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BooksNotesService } from '../../core/services/books-notes.service';
import { BookRecord, NotebookEntry, SubjectOption } from '../../core/models/books.models';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell stack books-shell">
        
        <!-- Hero Header -->
        <section class="glass-card hero-card stack">
          <span class="section-kicker">AI Notebook Workspace</span>
          <h1>Books & Revision Notebooks</h1>
          <p class="subtitle-copy">
            Upload textbook PDFs to run automated subject classification. Take notes, copy highlights, and trigger AI paraphrasing to build your revision sheets.
            Connection status: <strong [class.online-text]="online()">{{ online() ? 'Online & Syncing' : 'Offline Mode' }}</strong>.
          </p>
        </section>

        <!-- System Warning Messages -->
        <div class="msg-box success-msg" *ngIf="successMessage()">
          <span class="bullet-dot success-dot"></span>
          <span>{{ successMessage() }}</span>
        </div>
        <div class="msg-box error-msg" *ngIf="errorMessage()">
          <span class="bullet-dot error-dot"></span>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- 1) Upload PDF Section -->
        <section class="glass-card stack">
          <h2 class="section-subtitle-title">1) PDF Textbook Upload</h2>
          <p class="muted-copy">Select a reference book PDF to extract core concepts automatically.</p>
          
          <div class="file-uploader-box">
            <input
              type="file"
              id="pdf-file-input"
              class="hidden-file-input"
              accept="application/pdf"
              (change)="onFileSelected($event)"
            />
            <label for="pdf-file-input" class="custom-file-label">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="upload-svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{{ selectedFileName() || 'Click to select exam PDF file' }}</span>
            </label>
          </div>

          <div class="highlight-pro-text">
            <span>💡 <strong>Free tier limit: 5MB per upload.</strong> Gurukool Pro supports up to <strong>100MB textbooks</strong> for full syllabus indexing.</span>
          </div>

          <ion-button
            expand="block"
            color="primary"
            (click)="uploadBook()"
            [disabled]="!selectedFile() || uploading()">
            {{ uploading() ? 'Uploading and indexing...' : 'Upload & Detect Subject' }}
          </ion-button>
        </section>

        <!-- 2) Confirm Subject Section -->
        <section class="glass-card stack">
          <h2 class="section-subtitle-title">2) Confirm Document Classification</h2>
          <p class="muted-copy">Assign a specific syllabus category to index notes correctly.</p>

          <div class="book-list" *ngIf="books().length; else noBooks">
            <article class="book-row" *ngFor="let book of books()">
              <div class="book-meta">
                <div class="book-title-line">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="book-svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <strong>{{ book.fileName }}</strong>
                </div>
                <div class="book-status-badge">
                  <span class="status-indicator" [class.confirmed-status]="book.status === 'confirmed'"></span>
                  <span>Status: {{ book.status | titlecase }}</span>
                </div>
                <div class="detected-box" *ngIf="book.detectedSubject">
                  <span>Detected subject: <strong>{{ book.detectedSubject.code }}</strong> (Confidence: {{ book.detectedSubject.confidence }}%)</span>
                </div>
                <div class="confirmed-box" *ngIf="book.confirmedSubject">
                  <span>Confirmed track: <strong>{{ book.confirmedSubject.code }}</strong></span>
                </div>
              </div>

              <div class="book-actions" *ngIf="book.status !== 'confirmed'">
                <ion-item lines="none" class="custom-field small-select">
                  <ion-select
                    interface="popover"
                    [ngModel]="subjectSelectionMap()[book.id] || book.detectedSubject?.code || null"
                    (ngModelChange)="setSubjectSelection(book.id, $event)"
                    placeholder="Select subject">
                    <ion-select-option *ngFor="let subject of subjects()" [value]="subject.code">
                      {{ subject.code }} - {{ subject.name }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-button
                  size="small"
                  color="secondary"
                  (click)="confirmSubject(book.id)"
                  [disabled]="confirmingBookId() === book.id">
                  {{ confirmingBookId() === book.id ? 'Saving...' : 'Confirm' }}
                </ion-button>
              </div>
            </article>
          </div>
        </section>

        <!-- 3) Highlight -> Auto Notebook Section -->
        <section class="glass-card stack">
          <h2 class="section-subtitle-title">3) Copy Highlights to Notebook</h2>
          <p class="muted-copy">Reference specific textbook pages to build study entries.</p>
          
          <div class="input-container">
            <label class="input-label">Select Source Book</label>
            <ion-item lines="none" class="custom-field">
              <ion-select
                interface="popover"
                [ngModel]="highlightBookId()"
                (ngModelChange)="setHighlightBookId($event)">
                <ion-select-option *ngFor="let book of books()" [value]="book.id">
                  {{ book.fileName }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <div class="input-container">
            <label class="input-label">Page Number</label>
            <ion-item lines="none" class="custom-field">
              <ion-input
                type="number"
                placeholder="e.g., 42"
                [ngModel]="highlightPageNumber()"
                (ngModelChange)="highlightPageNumber.set(toNumber($event))">
              </ion-input>
            </ion-item>
          </div>

          <div class="input-container">
            <label class="input-label">Highlight Text Content</label>
            <ion-item lines="none" class="custom-field">
              <ion-textarea
                placeholder="Paste formula derivations or core definitions here..."
                auto-grow="true"
                [ngModel]="highlightText()"
                (ngModelChange)="highlightText.set(toText($event))">
              </ion-textarea>
            </ion-item>
          </div>

          <ion-button expand="block" color="primary" (click)="saveHighlight()">
            Save Highlight to Notebook
          </ion-button>
        </section>

        <!-- 4) Manual Notes Section -->
        <section class="glass-card stack">
          <h2 class="section-subtitle-title">4) Quick Notebook Entry</h2>
          <p class="muted-copy">Write custom study notes or formulas manually.</p>

          <div class="input-container">
            <label class="input-label">Subject Category</label>
            <ion-item lines="none" class="custom-field">
              <ion-select
                interface="popover"
                [ngModel]="manualSubjectCode()"
                (ngModelChange)="setManualSubjectCode($event)">
                <ion-select-option [value]="null">No Subject (General Note)</ion-select-option>
                <ion-select-option *ngFor="let subject of subjects()" [value]="subject.code">
                  {{ subject.code }} - {{ subject.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <div class="input-container">
            <label class="input-label">Note Title</label>
            <ion-item lines="none" class="custom-field">
              <ion-input
                placeholder="e.g., Dijkstra algorithm complexity proofs"
                [ngModel]="manualTitle()"
                (ngModelChange)="manualTitle.set(toText($event))">
              </ion-input>
            </ion-item>
          </div>

          <div class="input-container">
            <label class="input-label">Note Text</label>
            <ion-item lines="none" class="custom-field">
              <ion-textarea
                placeholder="Write your study notes, definitions, or equations here..."
                auto-grow="true"
                [ngModel]="manualNoteText()"
                (ngModelChange)="manualNoteText.set(toText($event))">
              </ion-textarea>
            </ion-item>
          </div>

          <ion-button expand="block" color="primary" (click)="saveManualNote()">
            Save Manual Note
          </ion-button>
        </section>

        <!-- 5) AI Paraphrase Section -->
        <section class="glass-card stack">
          <div class="ai-header-row">
            <h2 class="section-subtitle-title">5) AI Paraphraser & Memory Hook 🔒 Pro</h2>
          </div>
          <p class="muted-copy">Converts long paragraphs into short exam summaries or catchy memory hooks.</p>

          <div class="highlight-pro-text secondary-highlight">
            <span>💡 <strong>AI paraphrasing requires Gurukool Pro.</strong> Transform complex theories into bite-sized exam cards instantly.</span>
          </div>

          <div class="input-container">
            <label class="input-label">Source Text to Paraphrase</label>
            <ion-item lines="none" class="custom-field">
              <ion-textarea
                placeholder="Paste theoretical paragraphs to summarize..."
                auto-grow="true"
                [ngModel]="paraphraseSourceText()"
                (ngModelChange)="paraphraseSourceText.set(toText($event))">
              </ion-textarea>
            </ion-item>
          </div>

          <div class="input-container">
            <label class="input-label">AI Summary Style</label>
            <ion-item lines="none" class="custom-field">
              <ion-select
                interface="popover"
                [ngModel]="paraphraseStyle()"
                (ngModelChange)="setParaphraseStyle($event)">
                <ion-select-option value="exam-ready">Exam-Ready (Formula focus)</ion-select-option>
                <ion-select-option value="concise">Concise Bulletpoints</ion-select-option>
                <ion-select-option value="memory-hook">Memory Hook (Acronyms & Mnemonics)</ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <ion-button expand="block" color="secondary" (click)="paraphraseAndSave()">
            Paraphrase & Save to Notebook
          </ion-button>

          <ion-card *ngIf="latestParaphrase()" class="result-card glass-card">
            <ion-card-header>
              <ion-card-title>AI Result Output</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <pre>{{ latestParaphrase() }}</pre>
            </ion-card-content>
          </ion-card>
        </section>

        <!-- Notebook Entries Section -->
        <section class="glass-card stack">
          <div class="notebook-section-header">
            <h2 class="section-subtitle-title">Your Revision Notebook</h2>
            <div class="filter-item-wrapper">
              <ion-item lines="none" class="custom-field small-select-filter">
                <ion-select
                  interface="popover"
                  [ngModel]="subjectFilter()"
                  (ngModelChange)="setSubjectFilter($event)"
                  placeholder="All subjects">
                  <ion-select-option [value]="null">All subjects</ion-select-option>
                  <ion-select-option *ngFor="let subject of subjects()" [value]="subject.code">
                    {{ subject.code }} - {{ subject.name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
            </div>
          </div>

          <div class="note-list" *ngIf="visibleNotebookEntries().length; else noNotes">
            <article class="note-row" *ngFor="let entry of visibleNotebookEntries()">
              <header class="note-header">
                <strong>{{ entry.title || 'Notebook entry' }}</strong>
                <div class="note-tags">
                  <span class="note-source-badge">{{ entry.sourceType | uppercase }}</span>
                  <span class="note-subject-badge" *ngIf="entry.subject">{{ entry.subject.code }}</span>
                </div>
              </header>
              <p class="note-text-body">{{ entry.noteText }}</p>
              <footer class="note-footer-meta" *ngIf="entry.sourceBook">
                <span>Book source: {{ entry.sourceBook.fileName }}</span>
              </footer>
            </article>
          </div>
        </section>

      </div>
      <app-footer></app-footer>
    </ion-content>

    <ng-template #noBooks>
      <div class="empty-list-placeholder">
        <p>No books uploaded yet. Select a PDF file above to get started.</p>
      </div>
    </ng-template>

    <ng-template #noNotes>
      <div class="empty-list-placeholder">
        <p>No notebook entries created yet. Type manual notes or save highlights to fill your revision sheet.</p>
      </div>
    </ng-template>
  `,
  styleUrls: ['./books.page.scss'],
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

    // Free tier size limit: 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Free tier limit is 5MB per PDF. Upgrade to Pro for 100MB uploads.');
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
