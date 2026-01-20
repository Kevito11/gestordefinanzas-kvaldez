// src/features/accounts/accounts.api.ts
import { ApiClient } from '@/lib/apiClient';
import type { Account } from '@/types/account';
import { storage } from '@/lib/storage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const client = new ApiClient(BASE_URL, () => storage.get<{ token: string }>('auth')?.token ?? null);

export const AccountsAPI = {
  list: () => client.get<Account[]>('/accounts'),
  create: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
    client.post<Account>('/accounts', account),
  update: (id: string, account: Partial<Account>) =>
    client.put<Account>(`/accounts/${id}`, account),
  delete: (id: string) => client.delete(`/accounts/${id}`),
};
