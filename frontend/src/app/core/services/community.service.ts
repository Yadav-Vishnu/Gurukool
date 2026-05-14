import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  AudioCallRoom,
  CallSignal,
  CollaborationEvent,
  CollaborationNotification,
  DiscussionPost,
  DiscussionQuestion,
  PeerConnection,
  PeerSearchResult,
  ProposeEventPayload,
  QuestionDiscussion,
  ReschedulePayload,
} from '../models/community.models';

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  async listDiscussionQuestions(search?: string): Promise<DiscussionQuestion[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await firstValueFrom(
      this.http.get<ApiResponse<DiscussionQuestion[]>>(
        `${this.apiBaseUrl}/community/questions${query}`
      )
    );

    return response.data ?? [];
  }

  async getQuestionDiscussion(questionId: string): Promise<QuestionDiscussion> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<QuestionDiscussion>>(
        `${this.apiBaseUrl}/community/questions/${questionId}/discussion`
      )
    );

    if (!response.data) {
      throw new Error('Question discussion could not be loaded.');
    }

    return response.data;
  }

  async createDiscussionPost(questionId: string, content: string): Promise<DiscussionPost> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<DiscussionPost>>(
        `${this.apiBaseUrl}/community/questions/${questionId}/discussion/posts`,
        { content }
      )
    );

    if (!response.data) {
      throw new Error('Discussion reply could not be posted.');
    }

    return response.data;
  }

  async searchPeers(search?: string): Promise<PeerSearchResult[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await firstValueFrom(
      this.http.get<ApiResponse<PeerSearchResult[]>>(
        `${this.apiBaseUrl}/community/peers/search${query}`
      )
    );

    return response.data ?? [];
  }

  async listPeerConnections(): Promise<PeerConnection[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<PeerConnection[]>>(
        `${this.apiBaseUrl}/community/peers/connections`
      )
    );

    return response.data ?? [];
  }

  async requestPeer(peerUserId: string, message?: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(`${this.apiBaseUrl}/community/peers/requests`, {
        peerUserId,
        message,
      })
    );
  }

  async respondPeer(connectionId: string, action: 'accept' | 'decline' | 'block'): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/peers/connections/${connectionId}/respond`,
        { action }
      )
    );
  }

  async listCalendarEvents(): Promise<CollaborationEvent[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<CollaborationEvent[]>>(
        `${this.apiBaseUrl}/community/calendar/events`
      )
    );

    return response.data ?? [];
  }

  async proposeEvent(payload: ProposeEventPayload): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/calendar/events`,
        payload
      )
    );
  }

  async confirmEvent(eventId: string): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/calendar/events/${eventId}/confirm`,
        {}
      )
    );
  }

  async requestReschedule(eventId: string, payload: ReschedulePayload): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/calendar/events/${eventId}/reschedule`,
        payload
      )
    );
  }

  async respondReschedule(requestId: string, action: 'accept' | 'decline'): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/calendar/reschedules/${requestId}/respond`,
        { action }
      )
    );
  }

  async syncCalendar(eventId: string, provider: 'google' | 'outlook'): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/calendar/events/${eventId}/sync`,
        { provider }
      )
    );
  }

  async listAudioCalls(): Promise<AudioCallRoom[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<AudioCallRoom[]>>(`${this.apiBaseUrl}/community/calls`)
    );

    return response.data ?? [];
  }

  async createAudioCall(payload: {
    peerUserId?: string;
    connectionId?: string;
    eventId?: string;
  }): Promise<AudioCallRoom> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<AudioCallRoom>>(`${this.apiBaseUrl}/community/calls`, payload)
    );

    if (!response.data) {
      throw new Error('Audio call could not be created.');
    }

    return response.data;
  }

  async sendCallSignal(
    callId: string,
    messageType: CallSignal['messageType'],
    payload: Record<string, unknown>
  ): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/calls/${callId}/signals`,
        { messageType, payload }
      )
    );
  }

  async listCallSignals(callId: string, after?: string): Promise<CallSignal[]> {
    const query = after ? `?after=${encodeURIComponent(after)}` : '';
    const response = await firstValueFrom(
      this.http.get<ApiResponse<CallSignal[]>>(
        `${this.apiBaseUrl}/community/calls/${callId}/signals${query}`
      )
    );

    return response.data ?? [];
  }

  async listNotifications(): Promise<CollaborationNotification[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<CollaborationNotification[]>>(
        `${this.apiBaseUrl}/community/notifications`
      )
    );

    return response.data ?? [];
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiResponse<unknown>>(
        `${this.apiBaseUrl}/community/notifications/${notificationId}/read`,
        {}
      )
    );
  }
}
