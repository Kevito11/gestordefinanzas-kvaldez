// src/features/transactions/transactions.api.ts
import { ApiClient } from '@/lib/apiClient';
import type { Transaction } from '@/types/transaction';
import { storage } from '@/lib/storage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const client = new ApiClient(BASE_URL, () => storage.get<{ token: string }>('auth')?.token ?? null);

export const TransactionsAPI = {
  list: (params?: { accountId?: string; from?: string; to?: string }) =>
    client.get<Transaction[]>(`/transactions${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`),
  create: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
    client.post<Transaction>('/transactions', transaction),
  update: (id: string, transaction: Partial<Transaction>) =>
    client.put<Transaction>(`/transactions/${id}`, transaction),
  delete: (id: string) => client.delete(`/transactions/${id}`),
};
