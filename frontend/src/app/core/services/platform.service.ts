import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  HostedTest,
  InstitutionPartner,
  ModerationCase,
  PlatformDashboard,
} from '../models/platform.models';

export type InstitutionRequest = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city?: string;
  country: string;
  seatsPurchased: number;
  allowedEmailDomains: string[];
};

export type ReportContentRequest = {
  contentType: string;
  contentId?: string;
  content: string;
  reason: string;
  details?: string;
};

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  async getDashboard(): Promise<PlatformDashboard> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<PlatformDashboard>>(`${this.apiBaseUrl}/platform/dashboard`)
    );

    if (!response.data) {
      throw new Error('Platform dashboard could not be loaded.');
    }

    return response.data;
  }

  async createInstitution(input: InstitutionRequest): Promise<InstitutionPartner> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<InstitutionPartner>>(
        `${this.apiBaseUrl}/platform/institutions`,
        input
      )
    );

    if (!response.data) {
      throw new Error('Institution partner request could not be created.');
    }

    return response.data;
  }

  async requestHostedTest(institutionId: string): Promise<HostedTest> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<HostedTest>>(
        `${this.apiBaseUrl}/platform/institutions/${institutionId}/hosted-tests`,
        {
          maxParticipants: 100,
        }
      )
    );

    if (!response.data) {
      throw new Error('Hosted test request could not be created.');
    }

    return response.data;
  }

  async reportContent(input: ReportContentRequest): Promise<ModerationCase> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<ModerationCase>>(
        `${this.apiBaseUrl}/platform/moderation/report`,
        input
      )
    );

    if (!response.data) {
      throw new Error('Content report could not be queued.');
    }

    return response.data;
  }

  async reviewModerationCase(
    caseId: string,
    action: 'none' | 'hide_content' | 'dismissed'
  ): Promise<ModerationCase> {
    const status = action === 'dismissed' ? 'dismissed' : 'actioned';
    const reviewAction = action === 'dismissed' ? 'none' : action;
    const response = await firstValueFrom(
      this.http.patch<ApiResponse<ModerationCase>>(
        `${this.apiBaseUrl}/platform/moderation/cases/${caseId}/review`,
        {
          status,
          action: reviewAction,
          note: 'Reviewed from Gurukool Phase 7 Growth dashboard.',
        }
      )
    );

    if (!response.data) {
      throw new Error('Moderation case could not be reviewed.');
    }

    return response.data;
  }
}
