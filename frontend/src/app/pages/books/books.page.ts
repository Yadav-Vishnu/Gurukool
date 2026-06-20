import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BooksNotesService } from '../../core/services/books-notes.service';
import { BookRecord, NotebookEntry, SubjectOption } from '../../core/models/books.models';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { AppFooterComponent } from '../../shared/app-footer.component';

interface CatalogBook {
  id: string;
  title: string;
  author: string;
  edition: string;
  category: string;
  examType: 'GATE' | 'ESE' | 'PSU' | 'Aptitude';
  tags: string[];
  description: string;
  rating: number;
  reviewsCount: number;
  completionPercentage: number;
  downloadUrl: string;
  pages: string[];
}

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, AppFooterComponent],
  template: `
    <app-header></app-header>
    <ion-content [fullscreen]="true">
      <div class="page-shell stack books-shell">
        
        <!-- Hero Header -->
        <header class="glass-card hero-card stack">
          <span class="section-kicker">Gurukool Learning Sanctuary</span>
          <h1>Textbooks & Revision Workspace</h1>
          <p class="subtitle-copy">
            Access premium exam materials, catalog your study files, index dynamic summaries, and structure personalized notebooks.
            Status: <strong [class.online-text]="online()">{{ online() ? 'Online & Syncing' : 'Offline Mode' }}</strong>.
          </p>

          <!-- Clean Premium Segment Tabs Switcher -->
          <div class="premium-tabs-container">
            <button 
              type="button" 
              class="tab-trigger" 
              [class.active]="activeTab() === 'library'"
              (click)="activeTab.set('library')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Library Catalog</span>
            </button>
            <button 
              type="button" 
              class="tab-trigger" 
              [class.active]="activeTab() === 'workspace'"
              (click)="activeTab.set('workspace')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Study Workspace</span>
            </button>
          </div>
        </header>

        <!-- System Warning Messages -->
        <div class="alert-bar success-alert" *ngIf="successMessage()">
          <span class="bullet-dot success-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--ion-color-success); margin-right: 8px; display: inline-block;"></span>
          <span>{{ successMessage() }}</span>
        </div>
        <div class="alert-bar error-alert" *ngIf="errorMessage()">
          <span class="bullet-dot error-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--ion-color-danger); margin-right: 8px; display: inline-block;"></span>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- ==================== TAB 1: LIBRARY CATALOG ==================== -->
        <ng-container *ngIf="activeTab() === 'library'">
          
          <!-- Sticky Search and Filter Header -->
          <section class="glass-card library-filter-header stack">
            <div class="search-row">
              <div class="search-field-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="search-icon-svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search books by title, author, or tags..."
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  class="search-input"
                />
                <button
                  type="button"
                  class="search-clear-btn"
                  *ngIf="searchQuery()"
                  (click)="searchQuery.set('')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Exam Type Filter Dropdown -->
              <div class="exam-filter-wrapper">
                <ion-item lines="none" class="custom-field small-select">
                  <ion-select
                    interface="popover"
                    [ngModel]="selectedExamType()"
                    (ngModelChange)="selectedExamType.set($event)"
                    placeholder="All Exam Types">
                    <ion-select-option value="All">All Exam Types</ion-select-option>
                    <ion-select-option value="GATE">GATE</ion-select-option>
                    <ion-select-option value="ESE">ESE</ion-select-option>
                    <ion-select-option value="PSU">PSU</ion-select-option>
                    <ion-select-option value="Aptitude">Aptitude</ion-select-option>
                  </ion-select>
                </ion-item>
              </div>
            </div>

            <!-- Horizontal Categories Filter Scroll -->
            <div class="category-scroll-container">
              <button 
                type="button" 
                class="chip-btn" 
                [class.active]="selectedCategory() === 'All'"
                (click)="selectedCategory.set('All')">All</button>
              <button 
                type="button" 
                class="chip-btn" 
                [class.active]="selectedCategory() === 'GATE'"
                (click)="selectedCategory.set('GATE')">GATE</button>
              <button 
                type="button" 
                class="chip-btn" 
                [class.active]="selectedCategory() === 'ESE'"
                (click)="selectedCategory.set('ESE')">ESE</button>
              <button 
                type="button" 
                class="chip-btn" 
                [class.active]="selectedCategory() === 'PSU'"
                (click)="selectedCategory.set('PSU')">PSU</button>
              <button 
                type="button" 
                class="chip-btn" 
                [class.active]="selectedCategory() === 'Mechanical'"
                (click)="selectedCategory.set('Mechanical')">Mechanical</button>
              <button 
                type="button" 
                class="chip-btn" 
                [class.active]="selectedCategory() === 'Aptitude'"
                (click)="selectedCategory.set('Aptitude')">Aptitude</button>
            </div>
          </section>

          <!-- AI Curated recommended widget -->
          <div class="ai-recommendation-banner glass-card" *ngIf="aiRecommendation() as recommendation">
            <div class="ai-glow-pulse"></div>
            <div class="recommendation-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="sparkles-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.813zM19.071 4.929l-.707 2.122-2.122.707 2.122.707.707 2.122.707-2.122 2.122-.707-2.122-.707-.707-2.122zM14 2.5l-.354 1.061-1.061.354 1.061.354.354 1.061.354-1.061 1.061-.354-1.061-.354-.354-1.061z" />
              </svg>
              <span>AI Study Recommendation</span>
            </div>
            <div class="recommendation-content">
              <p class="recommendation-reason">{{ recommendation.reason }}</p>
              <div class="recommended-book-row">
                <div class="book-mini-cover">📖</div>
                <div class="book-mini-details">
                  <strong>{{ recommendation.book.title }}</strong>
                  <span>{{ recommendation.book.author }} · {{ recommendation.book.edition }}</span>
                </div>
                <div class="recommended-actions">
                  <button type="button" class="btn-primary-mini" (click)="openPreview(recommendation.book)">Preview</button>
                  <button type="button" class="btn-secondary-mini" (click)="addBookToWorkspace(recommendation.book)">Add</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Recently Viewed Section -->
          <section class="recently-viewed-section stack" *ngIf="recentlyViewedBooks().length > 0">
            <h2 class="section-subtitle-title">Recently Viewed</h2>
            <div class="horizontal-scroll-tray">
              <div class="recent-book-card glass-card" *ngFor="let book of recentlyViewedBooks()" (click)="openPreview(book)">
                <div class="recent-card-cover">📘</div>
                <div class="recent-card-details">
                  <strong>{{ book.title }}</strong>
                  <span>{{ book.author }}</span>
                  <div class="recent-progress-wrapper">
                    <div class="recent-progress-bar" [style.width.%]="book.completionPercentage"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Catalog Main List Grid -->
          <section class="library-grid-section stack">
            <div class="results-meta">
              <h2 class="section-subtitle-title">Available Textbooks</h2>
              <span class="results-count">{{ filteredBooks().length }} book(s) found</span>
            </div>

            <div class="books-catalog-grid" *ngIf="filteredBooks().length > 0; else emptyLibrary">
              <article class="glass-card premium-book-card stack" *ngFor="let book of filteredBooks()">
                <div class="card-top-badges">
                  <span class="badge-exam">{{ book.examType }}</span>
                  <div class="rating-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="star-svg">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    <span>{{ book.rating }} ({{ book.reviewsCount }})</span>
                  </div>
                </div>

                <div class="card-book-details stack">
                  <h3>{{ book.title }}</h3>
                  <span class="book-author-edition">By {{ book.author }} · {{ book.edition }}</span>
                  <p class="book-desc">{{ book.description }}</p>
                  
                  <div class="tags-group">
                    <span class="tag" *ngFor="let tag of book.tags">#{{ tag }}</span>
                  </div>
                </div>

                <!-- Progress Tracker -->
                <div class="card-progress-wrapper stack">
                  <div class="progress-header">
                    <span>Study Progress</span>
                    <strong>{{ book.completionPercentage }}%</strong>
                  </div>
                  <div class="progress-bar-track">
                    <div class="progress-bar-fill" [style.width.%]="book.completionPercentage"></div>
                  </div>
                </div>

                <!-- Actions row -->
                <div class="card-actions-row">
                  <button type="button" class="btn-action preview-btn" (click)="openPreview(book)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Preview</span>
                  </button>
                  <button type="button" class="btn-action add-btn" (click)="addBookToWorkspace(book)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Add</span>
                  </button>
                  <a [href]="book.downloadUrl" class="btn-action buy-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Get</span>
                  </a>
                </div>
              </article>
            </div>
          </section>
        </ng-container>

        <!-- ==================== TAB 2: STUDY WORKSPACE ==================== -->
        <ng-container *ngIf="activeTab() === 'workspace'">
          
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
            <p class="muted-copy">Confirm document tracks to dynamically align with AI roadmap targets.</p>

            <div class="book-list" *ngIf="books().length > 0; else noBooks">
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

            <div class="note-list" *ngIf="visibleNotebookEntries().length > 0; else noNotes">
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
        </ng-container>

      </div>

      <!-- ==================== PREMIUM SIMULATED PDF PREVIEW MODAL ==================== -->
      <div class="modal-backdrop-preview" *ngIf="previewingBook() as book" (click)="closePreview()">
        <div class="preview-modal glass-card stack" (click)="$event.stopPropagation()">
          <header class="preview-modal-header">
            <div class="modal-header-titles">
              <span class="modal-kicker">Gurukool Live Reader</span>
              <h2>{{ book.title }}</h2>
              <p>By {{ book.author }} · {{ book.edition }}</p>
            </div>
            <button type="button" class="btn-close-modal" (click)="closePreview()" title="Close Preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="close-icon-svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <main class="preview-modal-body stack">
            <div class="pdf-viewer-simulation-box stack">
              <div class="pdf-page-header">
                <span>PDF Simulation Mode · Page {{ previewActivePage() + 1 }} of {{ book.pages.length }}</span>
              </div>
              <div class="pdf-page-content">
                <p class="page-text-preview">{{ book.pages[previewActivePage()] }}</p>
              </div>
            </div>
          </main>

          <footer class="preview-modal-footer">
            <div class="footer-navigation">
              <button 
                type="button" 
                class="btn-nav-preview" 
                [disabled]="previewActivePage() === 0" 
                (click)="previewActivePage.set(previewActivePage() - 1)">
                Prev Page
              </button>
              <span>Page {{ previewActivePage() + 1 }}</span>
              <button 
                type="button" 
                class="btn-nav-preview" 
                [disabled]="previewActivePage() === book.pages.length - 1" 
                (click)="previewActivePage.set(previewActivePage() + 1)">
                Next Page
              </button>
            </div>
            <button type="button" class="btn-add-simulated" (click)="addBookToWorkspace(book); closePreview()">
              Add to Study Workspace
            </button>
          </footer>
        </div>
      </div>

      <app-footer></app-footer>
    </ion-content>

    <ng-template #emptyLibrary>
      <div class="empty-list-placeholder">
        <p>No textbooks match your search queries or selected filters. Try broadening your keywords!</p>
      </div>
    </ng-template>

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

  // REDESIGNED LIBRARY PROPERTIES
  readonly activeTab = signal<'library' | 'workspace'>('library');
  readonly searchQuery = signal('');
  readonly selectedCategory = signal<string>('All');
  readonly selectedExamType = signal<string>('All');

  readonly catalogBooks = signal<CatalogBook[]>([
    {
      id: 'book-1',
      title: 'GATE Computer Science & IT (Vol 1)',
      author: 'Gurukool Editorial Board',
      edition: '2026 Edition',
      category: 'GATE',
      examType: 'GATE',
      tags: ['Algorithms', 'Data Structures', 'GATE'],
      description: 'Comprehensive theory and solved questions for algorithms, data structures, and programming concepts.',
      rating: 4.8,
      reviewsCount: 124,
      completionPercentage: 45,
      downloadUrl: '#',
      pages: [
        'Chapter 1: Asymptotic Analysis and Complexity Classes (O, o, Omega, Theta). Find tight boundaries.',
        'Chapter 2: Divide and Conquer Algorithms (Merge Sort, Quick Sort, Binary Search recurrence relations).',
        'Chapter 3: Dynamic Programming (LCS, Matrix Chain Multiplication, 0/1 Knapsack optimization structures).'
      ]
    },
    {
      id: 'book-2',
      title: 'Aptitude & Numerical Ability Primer',
      author: 'R. S. Aggarwal & Gurukool',
      edition: '5th Edition',
      category: 'Aptitude',
      examType: 'Aptitude',
      tags: ['Aptitude', 'Quantitative', 'PSU'],
      description: 'Shortcut techniques and practice drills for general quantitative aptitude and logic puzzles.',
      rating: 4.6,
      reviewsCount: 89,
      completionPercentage: 10,
      downloadUrl: '#',
      pages: [
        'Chapter 1: Ratio and Proportions, Mixture and Alligation shortcuts. Learn balance fractions.',
        'Chapter 2: Time, Speed, and Distance formulas and relative speed tricks for train problems.',
        'Chapter 3: Permutation, Combination, and Probability fundamentals for independent event outcomes.'
      ]
    },
    {
      id: 'book-3',
      title: 'ESE General Studies & Engineering Aptitude',
      author: 'Made Easy Publications',
      edition: '2025 Edition',
      category: 'ESE',
      examType: 'ESE',
      tags: ['ESE', 'General Studies', 'Ethics'],
      description: 'Syllabus alignment for GS paper including design principles, environment, standards, and quality control.',
      rating: 4.7,
      reviewsCount: 72,
      completionPercentage: 60,
      downloadUrl: '#',
      pages: [
        'Chapter 1: Basics of Project Management, scheduling tools (PERT, CPM) and Life Cycle.',
        'Chapter 2: Standards and Quality in Design, Manufacture, and Maintenance practices.',
        'Chapter 3: Environmental Pollution, Ecological Balance, and Global Climate Change issues.'
      ]
    },
    {
      id: 'book-4',
      title: 'Mechanical Engineering Handbook',
      author: 'R. K. Jain',
      edition: '12th Edition',
      category: 'Mechanical',
      examType: 'GATE',
      tags: ['Mechanical', 'Thermodynamics', 'Design'],
      description: 'Essential equations, thermodynamic tables, and mechanical structural engineering reference sheets.',
      rating: 4.5,
      reviewsCount: 54,
      completionPercentage: 0,
      downloadUrl: '#',
      pages: [
        'Chapter 1: Laws of Thermodynamics and Entropy definitions for heat engines.',
        'Chapter 2: Fluid Mechanics: Velocity potential, stream function, and Boundary Layer theory.',
        'Chapter 3: Theory of Machines: Gear trains and analysis of mechanical Governors.'
      ]
    },
    {
      id: 'book-5',
      title: 'GATE Core Engineering Mathematics',
      author: 'B. S. Grewal',
      edition: '44th Edition',
      category: 'GATE',
      examType: 'GATE',
      tags: ['GATE', 'Mathematics', 'Calculus'],
      description: 'Detailed mathematical proofs, linear algebra, probability, and calculus for engineering streams.',
      rating: 4.9,
      reviewsCount: 210,
      completionPercentage: 92,
      downloadUrl: '#',
      pages: [
        'Chapter 1: Linear Algebra - Matrix Eigenvalues, Eigenvectors, and Cayley-Hamilton theorem.',
        'Chapter 2: Differential Equations and Laplace Transforms for engineering systems.',
        'Chapter 3: Probability Distributions - Poisson, normal, and binomial probability densities.'
      ]
    },
    {
      id: 'book-6',
      title: 'PSU Core Power Systems & Electronics',
      author: 'Gurukool Tech',
      edition: '2nd Edition',
      category: 'PSU',
      examType: 'PSU',
      tags: ['PSU', 'Electrical', 'Power Systems'],
      description: 'Essential concepts for power grids, power distribution, and semiconductor electronics in PSU exams.',
      rating: 4.4,
      reviewsCount: 32,
      completionPercentage: 5,
      downloadUrl: '#',
      pages: [
        'Chapter 1: Power Transmission Line parameters and models. Calculate inductance/capacitance.',
        'Chapter 2: Semiconductor diodes and BJT operational analysis in amplifier circuits.',
        'Chapter 3: Fault analysis in electrical power systems. Symmetrical components.'
      ]
    }
  ]);

  readonly filteredBooks = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const exam = this.selectedExamType();

    return this.catalogBooks().filter(book => {
      // Keyword Match
      const matchesQuery = !query || 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.tags.some(tag => tag.toLowerCase().includes(query));

      // Category Match
      const matchesCategory = cat === 'All' || book.category === cat;

      // Exam Type Match
      const matchesExamType = exam === 'All' || book.examType === exam;

      return matchesQuery && matchesCategory && matchesExamType;
    });
  });

  readonly aiRecommendation = computed(() => {
    // Dynamic simulated suggestion referencing weak-area diagnostics
    return {
      reason: 'Based on your recent test attempt (Average Score: 76.4%, Weak area: Formula Recall), the AI recommends studying Core Mathematics:',
      book: this.catalogBooks().find(b => b.id === 'book-5') || this.catalogBooks()[0]
    };
  });

  readonly recentlyViewedIds = signal<string[]>([]);
  readonly recentlyViewedBooks = computed(() => {
    const ids = this.recentlyViewedIds();
    return this.catalogBooks().filter(b => ids.includes(b.id));
  });

  // Preview Modal Signals
  readonly previewingBook = signal<CatalogBook | null>(null);
  readonly previewActivePage = signal(0);

  private readonly updateOnlineStatus = () => {
    this.online.set(typeof navigator === 'undefined' ? true : navigator.onLine);
  };

  async ngOnInit(): Promise<void> {
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
    this.updateOnlineStatus();

    this.loadRecentlyViewed();
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

  // REDESIGNED LIBRARY ACTION HANDLERS
  openPreview(book: CatalogBook): void {
    this.previewingBook.set(book);
    this.previewActivePage.set(0);
    this.trackBookView(book.id);
  }

  closePreview(): void {
    this.previewingBook.set(null);
  }

  async addBookToWorkspace(book: CatalogBook): Promise<void> {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    try {
      const mockFile = new File([''], `${book.title}.pdf`, { type: 'application/pdf' });
      const created = await this.booksService.uploadBook(mockFile, `Preview: ${book.description}`);
      await this.booksService.confirmBookSubject(created.id, book.category);
      this.successMessage.set(`Added "${book.title}" to your Study Workspace.`);
      await this.refreshData();
    } catch (error) {
      this.errorMessage.set(this.authService.readError(error, 'Could not add book to workspace.'));
    }
  }

  loadRecentlyViewed(): void {
    const saved = localStorage.getItem('gk_recently_viewed_books');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.recentlyViewedIds.set(parsed.slice(0, 4));
        }
      } catch (e) {
        console.error('Error loading recently viewed books:', e);
      }
    }
  }

  trackBookView(bookId: string): void {
    let current = this.recentlyViewedIds().filter(id => id !== bookId);
    current.unshift(bookId);
    current = current.slice(0, 4); // Keep last 4
    this.recentlyViewedIds.set(current);
    localStorage.setItem('gk_recently_viewed_books', JSON.stringify(current));
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
