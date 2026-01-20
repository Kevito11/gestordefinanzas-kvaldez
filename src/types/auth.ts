// src/types/auth.ts
export interface User {
  id: string;
  username: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt?: number;
}
