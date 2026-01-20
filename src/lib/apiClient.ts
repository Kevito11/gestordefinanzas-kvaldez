import { storage } from './storage';

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | null;

  constructor(baseUrl: string, getToken?: () => string | null) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> || {}),
    };

    let token = this.getToken?.();
    if (!token) {
      const auth = storage.get<{ token: string | null }>('auth');
      token = auth?.token ?? undefined; // Fix null to undefined
    }

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `API error ${res.status}`;
      try {
        const data = JSON.parse(text);
        if (data && data.error) {
          errorMessage = data.error;
        }
      } catch (e) {
        errorMessage += `: ${text}`;
      }
      throw new Error(errorMessage);
    }
    if (res.status === 204) {
      return null as T;
    }
    return res.json() as Promise<T>;
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }
  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
