import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  BookRecord,
  HighlightPayload,
  ManualNotePayload,
  NotebookEntry,
  OfflineBooksOperation,
  ParaphrasePayload,
  SubjectOption,
  UploadedBookRecord,
} from '../models/books.models';
import { LocalCacheService } from './local-cache.service';

const BOOKS_CACHE_KEY = 'gk-books-cache-v1';
const NOTEBOOK_CACHE_KEY = 'gk-notebook-cache-v1';
const SUBJECTS_CACHE_KEY = 'gk-subjects-cache-v1';
const OFFLINE_BOOKS_QUEUE_KEY = 'gk-books-offline-queue-v1';

@Injectable({
  providedIn: 'root',
})
export class BooksNotesService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LocalCacheService);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  async getSubjects(): Promise<SubjectOption[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<SubjectOption[]>>(`${this.apiBaseUrl}/books/subjects`)
      );
      const data = response.data ?? [];
      this.cache.setItem(SUBJECTS_CACHE_KEY, data);
      return data;
    } catch (error) {
      const cached = this.cache.getItem<SubjectOption[]>(SUBJECTS_CACHE_KEY);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async getBooks(): Promise<BookRecord[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<BookRecord[]>>(`${this.apiBaseUrl}/books/books`)
      );
      const data = response.data ?? [];
      this.cache.setItem(BOOKS_CACHE_KEY, data);
      return data;
    } catch (error) {
      const cached = this.cache.getItem<BookRecord[]>(BOOKS_CACHE_KEY);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async getNotebookEntries(subjectCode?: string): Promise<NotebookEntry[]> {
    const query = subjectCode ? `?subjectCode=${encodeURIComponent(subjectCode)}` : '';

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<NotebookEntry[]>>(`${this.apiBaseUrl}/books/notebooks${query}`)
      );
      const data = response.data ?? [];
      this.cache.setItem(NOTEBOOK_CACHE_KEY, data);
      return data;
    } catch (error) {
      const cached = this.cache.getItem<NotebookEntry[]>(NOTEBOOK_CACHE_KEY);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async uploadBook(file: File, extractedTextPreview: string): Promise<UploadedBookRecord> {
    const fileBase64 = await this.fileToBase64(file);
    const response = await firstValueFrom(
      this.http.post<ApiResponse<UploadedBookRecord>>(`${this.apiBaseUrl}/books/books/upload`, {
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        fileBase64,
        extractedTextPreview,
      })
    );

    if (!response.data) {
      throw new Error('Book upload failed.');
    }

    return response.data;
  }

  async confirmBookSubject(bookId: string, subjectCode: string): Promise<void> {
    if (!this.isOnline()) {
      this.queueOfflineOperation('confirm-subject', { bookId, subjectCode });
      return;
    }

    await firstValueFrom(
      this.http.patch<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/books/books/${bookId}/confirm-subject`,
        { subjectCode }
      )
    );
  }

  async addHighlight(bookId: string, payload: HighlightPayload): Promise<void> {
    if (!this.isOnline()) {
      this.queueOfflineOperation('highlight', { bookId, payload });
      return;
    }

    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(`${this.apiBaseUrl}/books/books/${bookId}/highlights`, payload)
    );
  }

  async addManualNote(payload: ManualNotePayload): Promise<void> {
    if (!this.isOnline()) {
      this.queueOfflineOperation('manual-note', { payload });
      return;
    }

    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(`${this.apiBaseUrl}/books/notebooks/manual`, payload)
    );
  }

  async paraphraseAndSave(payload: ParaphrasePayload): Promise<string> {
    if (!this.isOnline()) {
      this.queueOfflineOperation('paraphrase', { payload });
      return 'Saved to offline queue. It will sync when you reconnect.';
    }

    const response = await firstValueFrom(
      this.http.post<ApiResponse<{ noteText: string }>>(
        `${this.apiBaseUrl}/books/notebooks/paraphrase`,
        payload
      )
    );

    return response.data?.noteText ?? '';
  }

  async syncOfflineQueue(): Promise<number> {
    if (!this.isOnline()) {
      return 0;
    }

    const queuedOps = this.cache.drain<OfflineBooksOperation>(OFFLINE_BOOKS_QUEUE_KEY);
    let successCount = 0;
    const failed: OfflineBooksOperation[] = [];

    for (const operation of queuedOps) {
      const payload = operation.payload;

      try {
        if (operation.operationType === 'manual-note') {
          await firstValueFrom(
            this.http.post<ApiResponse<unknown>>(
              `${this.apiBaseUrl}/books/notebooks/manual`,
              payload['payload']
            )
          );
          successCount += 1;
          continue;
        }

        if (operation.operationType === 'paraphrase') {
          await firstValueFrom(
            this.http.post<ApiResponse<unknown>>(
              `${this.apiBaseUrl}/books/notebooks/paraphrase`,
              payload['payload']
            )
          );
          successCount += 1;
          continue;
        }

        if (operation.operationType === 'confirm-subject') {
          const bookId = String(payload['bookId'] ?? '');
          await firstValueFrom(
            this.http.patch<ApiResponse<unknown>>(
              `${this.apiBaseUrl}/books/books/${bookId}/confirm-subject`,
              { subjectCode: payload['subjectCode'] }
            )
          );
          successCount += 1;
          continue;
        }

        if (operation.operationType === 'highlight') {
          const bookId = String(payload['bookId'] ?? '');
          await firstValueFrom(
            this.http.post<ApiResponse<unknown>>(
              `${this.apiBaseUrl}/books/books/${bookId}/highlights`,
              payload['payload']
            )
          );
          successCount += 1;
          continue;
        }
      } catch {
        failed.push(operation);
      }
    }

    if (failed.length > 0) {
      for (const item of failed) {
        this.cache.enqueue(OFFLINE_BOOKS_QUEUE_KEY, item, 200);
      }
    }

    return successCount;
  }

  private isOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }

  private queueOfflineOperation(
    operationType: OfflineBooksOperation['operationType'],
    payload: Record<string, unknown>
  ): void {
    const entry: OfflineBooksOperation = {
      id: `op-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      operationType,
      payload,
    };

    this.cache.enqueue(OFFLINE_BOOKS_QUEUE_KEY, entry, 200);
  }

  private async fileToBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 0x8000;
    let binary = '';

    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  }
}
