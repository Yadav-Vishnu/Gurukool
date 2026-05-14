import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  EngagementDashboard,
  FormulaFlashcard,
  LiveQuiz,
  MentorRoadmap,
  QuizAnswerResult,
  QuizLeaderboardRow,
  ReferralSummary,
  WeeklyChallenge,
} from '../models/engagement.models';

@Injectable({
  providedIn: 'root',
})
export class EngagementService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  async getDashboard(): Promise<EngagementDashboard> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<EngagementDashboard>>(`${this.apiBaseUrl}/engagement/dashboard`)
    );

    if (!response.data) {
      throw new Error('Engagement dashboard could not be loaded.');
    }

    return response.data;
  }

  async getDailyFlashcards(): Promise<FormulaFlashcard[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<FormulaFlashcard[]>>(
        `${this.apiBaseUrl}/engagement/flashcards/daily`
      )
    );

    return response.data ?? [];
  }

  async reviewFlashcard(formulaId: string, confidence: number): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/engagement/flashcards/${formulaId}/review`,
        { confidence }
      )
    );
  }

  async getWeeklyChallenges(): Promise<WeeklyChallenge[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<WeeklyChallenge[]>>(
        `${this.apiBaseUrl}/engagement/challenges/weekly`
      )
    );

    return response.data ?? [];
  }

  async joinChallenge(challengeId: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/engagement/challenges/${challengeId}/join`,
        {}
      )
    );
  }

  async submitChallengeScore(challengeId: string, score: number): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/engagement/challenges/${challengeId}/score`,
        { score }
      )
    );
  }

  async getLiveQuizzes(): Promise<LiveQuiz[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<LiveQuiz[]>>(`${this.apiBaseUrl}/engagement/quizzes/live`)
    );

    return response.data ?? [];
  }

  async submitQuizAnswer(questionId: string, selectedOption: string): Promise<QuizAnswerResult> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<QuizAnswerResult>>(
        `${this.apiBaseUrl}/engagement/quizzes/questions/${questionId}/answer`,
        { selectedOption }
      )
    );

    if (!response.data) {
      throw new Error('Quiz answer could not be submitted.');
    }

    return response.data;
  }

  async getQuizLeaderboard(quizId: string): Promise<QuizLeaderboardRow[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<QuizLeaderboardRow[]>>(
        `${this.apiBaseUrl}/engagement/quizzes/${quizId}/leaderboard`
      )
    );

    return response.data ?? [];
  }

  async getReferralSummary(): Promise<ReferralSummary> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<ReferralSummary>>(`${this.apiBaseUrl}/engagement/referrals`)
    );

    if (!response.data) {
      throw new Error('Referral summary could not be loaded.');
    }

    return response.data;
  }

  async applyReferralCode(referralCode: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(`${this.apiBaseUrl}/engagement/referrals/apply`, {
        referralCode,
      })
    );
  }

  async getMentorRoadmap(): Promise<MentorRoadmap | null> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<MentorRoadmap | null>>(
        `${this.apiBaseUrl}/engagement/mentor/roadmap`
      )
    );

    return response.data ?? null;
  }

  async generateMentorRoadmap(): Promise<MentorRoadmap> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<MentorRoadmap>>(
        `${this.apiBaseUrl}/engagement/mentor/roadmap`,
        {}
      )
    );

    if (!response.data) {
      throw new Error('Mentor roadmap could not be generated.');
    }

    return response.data;
  }
}
