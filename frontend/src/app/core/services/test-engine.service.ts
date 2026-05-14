import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { LocalCacheService } from './local-cache.service';
import {
  AdaptiveStartPayload,
  AttemptAnalytics,
  AttemptDetail,
  AttemptSavePayload,
  AttemptSaveResponse,
  AttemptStartResponse,
  CatalogFilters,
  TestCatalogItem,
} from '../models/test-engine.models';

@Injectable({
  providedIn: 'root',
})
export class TestEngineService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LocalCacheService);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly catalogCachePrefix = 'gk-tests-catalog-v1';
  private readonly attemptCachePrefix = 'gk-test-attempt-v1';
  private readonly analyticsCachePrefix = 'gk-test-analytics-v1';

  async getCatalog(filters: CatalogFilters = {}): Promise<TestCatalogItem[]> {
    const params = new URLSearchParams();

    if (filters.type) {
      params.set('type', filters.type);
    }

    if (filters.subjectCode) {
      params.set('subjectCode', filters.subjectCode);
    }

    if (filters.topicSlug) {
      params.set('topicSlug', filters.topicSlug);
    }

    if (filters.examCode) {
      params.set('examCode', filters.examCode);
    }

    if (filters.companyName) {
      params.set('companyName', filters.companyName);
    }

    if (filters.paperCode) {
      params.set('paperCode', filters.paperCode);
    }

    if (filters.examYear) {
      params.set('examYear', String(filters.examYear));
    }

    if (filters.adaptiveOnly) {
      params.set('adaptiveOnly', 'true');
    }

    const querySuffix = params.toString().length > 0 ? `?${params.toString()}` : '';
    const cacheKey = `${this.catalogCachePrefix}:${querySuffix || 'all'}`;

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<TestCatalogItem[]>>(
          `${this.apiBaseUrl}/tests/catalog${querySuffix}`
        )
      );

      const data = response.data ?? [];
      this.cache.setItem(cacheKey, data);
      return data;
    } catch (error) {
      const cached = this.cache.getItem<TestCatalogItem[]>(cacheKey);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async startAdaptiveAttempt(payload: AdaptiveStartPayload): Promise<AttemptStartResponse> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<AttemptStartResponse>>(
        `${this.apiBaseUrl}/tests/adaptive/start`,
        payload
      )
    );

    if (!response.data) {
      throw new Error('The adaptive mock could not be started.');
    }

    this.cache.setItem(`${this.attemptCachePrefix}:${response.data.detail.attempt.id}`, response.data.detail);
    return response.data;
  }

  async startAttempt(testId: string): Promise<AttemptStartResponse> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<AttemptStartResponse>>(`${this.apiBaseUrl}/tests/${testId}/start`, {})
    );

    if (!response.data) {
      throw new Error('The test attempt could not be started.');
    }

    this.cache.setItem(`${this.attemptCachePrefix}:${response.data.detail.attempt.id}`, response.data.detail);
    return response.data;
  }

  async getAttempt(attemptId: string): Promise<AttemptDetail> {
    const cacheKey = `${this.attemptCachePrefix}:${attemptId}`;

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<AttemptDetail>>(`${this.apiBaseUrl}/tests/attempts/${attemptId}`)
      );

      if (!response.data) {
        throw new Error('The test attempt could not be loaded.');
      }

      this.cache.setItem(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cached = this.cache.getItem<AttemptDetail>(cacheKey);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    payload: AttemptSavePayload
  ): Promise<AttemptSaveResponse> {
    const response = await firstValueFrom(
      this.http.patch<ApiResponse<AttemptSaveResponse>>(
        `${this.apiBaseUrl}/tests/attempts/${attemptId}/questions/${questionId}`,
        payload
      )
    );

    if (!response.data) {
      throw new Error('The answer could not be saved.');
    }

    const cacheKey = `${this.attemptCachePrefix}:${attemptId}`;
    const cachedAttempt = this.cache.getItem<AttemptDetail>(cacheKey);
    if (cachedAttempt) {
      const nextQuestions = cachedAttempt.questions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        return {
          ...question,
          response: {
            selectedOption: response.data!.selectedOption,
            markedForReview: response.data!.markedForReview,
            visited: response.data!.visited,
            note: response.data!.note,
            wrongTag: response.data!.wrongTag,
            timeSpentSeconds: response.data!.timeSpentSeconds,
          },
          paletteStatus: response.data!.paletteStatus,
        };
      });

      this.cache.setItem(cacheKey, {
        ...cachedAttempt,
        questions: nextQuestions,
      });
    }

    return response.data;
  }

  async submitAttempt(attemptId: string): Promise<AttemptAnalytics> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<AttemptAnalytics>>(
        `${this.apiBaseUrl}/tests/attempts/${attemptId}/submit`,
        {}
      )
    );

    if (!response.data) {
      throw new Error('The test could not be submitted.');
    }

    this.cache.setItem(`${this.analyticsCachePrefix}:${attemptId}`, response.data);
    return response.data;
  }

  async getAnalytics(attemptId: string): Promise<AttemptAnalytics> {
    const cacheKey = `${this.analyticsCachePrefix}:${attemptId}`;

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<AttemptAnalytics>>(
          `${this.apiBaseUrl}/tests/attempts/${attemptId}/analytics`
        )
      );

      if (!response.data) {
        throw new Error('The analytics report could not be loaded.');
      }

      this.cache.setItem(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cached = this.cache.getItem<AttemptAnalytics>(cacheKey);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }
}
