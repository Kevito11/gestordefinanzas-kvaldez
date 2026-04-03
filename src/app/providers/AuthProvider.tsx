// src/app/providers/AuthProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, User } from '../../types/auth';

import { storage } from '../../lib/storage';

interface AuthContextValue extends AuthState {
  login: (user: User, token: string, expiresAt?: number) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = storage.get<AuthState>(STORAGE_KEY);
    if (stored) {
      return stored;
    }
    return { user: null, token: null, expiresAt: undefined };
  });

  useEffect(() => {
    if (auth.user && auth.token) {
      storage.set(STORAGE_KEY, auth);
    } else {
      storage.remove(STORAGE_KEY);
    }
  }, [auth]);

  const login = (user: User, token: string, expiresAt?: number) => {
    setAuth({ user, token, expiresAt: expiresAt || Date.now() + 1000 * 60 * 60 * 24 });
  };

  const logout = () => {
    setAuth({ user: null, token: null, expiresAt: undefined });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
