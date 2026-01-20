// src/lib/storage.ts
const PREFIX = 'finance-app';

export const storage = {
  get<T>(key: string, fallback: T | null = null): T | null {
    try {
      const raw = localStorage.getItem(`${PREFIX}:${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(`${PREFIX}:${key}`);
  },
};
