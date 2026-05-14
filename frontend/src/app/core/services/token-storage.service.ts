import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TokenPair } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly storageKey = 'gurukool.auth.tokens';

  async getTokens(): Promise<TokenPair | null> {
    const stored = await this.read(this.storageKey);

    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as TokenPair;

      if (!parsed.accessToken || !parsed.refreshToken) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  async setTokens(tokens: TokenPair): Promise<void> {
    const value = JSON.stringify(tokens);
    await this.write(this.storageKey, value);
  }

  async clear(): Promise<void> {
    await this.remove(this.storageKey);
  }

  private async read(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (value) {
        return value;
      }
    } catch {
      // The Capacitor web bridge may not be available during some local setups.
    }

    return localStorage.getItem(key);
  }

  private async write(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch {
      // Fall through to localStorage.
    }

    localStorage.setItem(key, value);
  }

  private async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch {
      // Fall through to localStorage.
    }

    localStorage.removeItem(key);
  }
}
