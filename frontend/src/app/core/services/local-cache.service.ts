import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalCacheService {
  getItem<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // If storage quota is full, skip caching and keep app usable.
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  }

  enqueue<T>(key: string, value: T, maxItems = 120): void {
    const queue = this.getItem<T[]>(key) ?? [];
    queue.push(value);

    if (queue.length > maxItems) {
      queue.splice(0, queue.length - maxItems);
    }

    this.setItem(key, queue);
  }

  drain<T>(key: string): T[] {
    const queue = this.getItem<T[]>(key) ?? [];
    this.removeItem(key);
    return queue;
  }
}
