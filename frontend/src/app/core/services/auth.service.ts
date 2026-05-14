import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  AuthSuccessPayload,
  RefreshPayload,
  SessionRecord,
  TokenPair,
  UserProfile,
} from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  readonly user = signal<UserProfile | null>(null);
  readonly tokens = signal<TokenPair | null>(null);
  readonly sessions = signal<SessionRecord[]>([]);
  readonly initialized = signal(false);

  private bootstrapPromise: Promise<void> | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  currentAccessToken(): string | null {
    return this.tokens()?.accessToken ?? null;
  }

  currentRefreshToken(): string | null {
    return this.tokens()?.refreshToken ?? null;
  }

  isAuthenticated(): boolean {
    return Boolean(this.user() && this.tokens());
  }

  async ensureReady(): Promise<void> {
    if (this.initialized()) {
      return;
    }

    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }

    await this.bootstrapPromise;
  }

  async sendOtp(phone: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<undefined>>(`${this.apiBaseUrl}/auth/otp/send`, {
        phone,
      })
    );

    return response.message;
  }

  async verifyOtp(phone: string, otp: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<AuthSuccessPayload>>(`${this.apiBaseUrl}/auth/otp/verify`, {
        phone,
        otp,
      })
    );

    const payload = response.data;
    if (!payload) {
      throw new Error('The server returned an empty login response.');
    }

    await this.persistSession(payload.tokens, payload.user);
    await this.loadSessions();
  }

  startGoogleLogin(): void {
    window.location.href = `${this.apiBaseUrl}/auth/google`;
  }

  async completeGoogleLogin(hashFragment: string): Promise<void> {
    const rawHash = hashFragment.startsWith('#') ? hashFragment.slice(1) : hashFragment;
    const params = new URLSearchParams(rawHash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      throw new Error('Google sign-in finished without the required tokens.');
    }

    await this.persistSession({ accessToken, refreshToken });
    await this.loadSessions();
  }

  async refreshSession(): Promise<boolean> {
    const refreshToken = this.currentRefreshToken();

    if (!refreshToken) {
      await this.clearSession();
      return false;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await firstValueFrom(
          this.http.post<ApiResponse<RefreshPayload>>(`${this.apiBaseUrl}/auth/refresh`, {
            refreshToken,
          })
        );

        const refreshedTokens = response.data?.tokens;
        if (!refreshedTokens) {
          throw new Error('The server did not return a new token pair.');
        }

        this.tokens.set(refreshedTokens);
        await this.tokenStorage.setTokens(refreshedTokens);
        return true;
      } catch {
        await this.clearSession();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async loadProfile(): Promise<UserProfile> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<UserProfile>>(`${this.apiBaseUrl}/users/me`)
    );

    if (!response.data) {
      throw new Error('The profile response did not include user data.');
    }

    this.user.set(response.data);
    return response.data;
  }

  async loadSessions(): Promise<SessionRecord[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<SessionRecord[]>>(`${this.apiBaseUrl}/sessions`)
    );

    const sessions = response.data ?? [];
    this.sessions.set(sessions);
    return sessions;
  }

  async logout(): Promise<void> {
    try {
      if (this.currentAccessToken()) {
        await firstValueFrom(
          this.http.post<ApiResponse<null>>(`${this.apiBaseUrl}/auth/logout`, {})
        );
      }
    } finally {
      await this.clearSession();
      await this.router.navigateByUrl('/welcome', { replaceUrl: true });
    }
  }

  async logoutAll(): Promise<void> {
    try {
      if (this.currentAccessToken()) {
        await firstValueFrom(
          this.http.delete<ApiResponse<null>>(`${this.apiBaseUrl}/sessions/all`)
        );
      }
    } finally {
      await this.clearSession();
      await this.router.navigateByUrl('/welcome', { replaceUrl: true });
    }
  }

  async clearSession(): Promise<void> {
    this.tokens.set(null);
    this.user.set(null);
    this.sessions.set([]);
    await this.tokenStorage.clear();
  }

  readError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || fallback;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  }

  private async bootstrap(): Promise<void> {
    try {
      const storedTokens = await this.tokenStorage.getTokens();

      if (!storedTokens) {
        return;
      }

      this.tokens.set(storedTokens);

      try {
        await this.loadProfile();
      } catch {
        const refreshed = await this.refreshSession();
        if (!refreshed) {
          return;
        }

        await this.loadProfile();
      }

      await this.loadSessions();
    } finally {
      this.initialized.set(true);
      this.bootstrapPromise = null;
    }
  }

  private async persistSession(tokens: TokenPair, user?: UserProfile): Promise<void> {
    this.tokens.set(tokens);
    await this.tokenStorage.setTokens(tokens);

    if (user) {
      this.user.set(user);
    } else {
      await this.loadProfile();
    }
  }
}
