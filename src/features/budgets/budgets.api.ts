// src/features/budgets/budgets.api.ts
import { ApiClient } from '@/lib/apiClient';
import type { Budget } from '@/types/budget';
import { storage } from '@/lib/storage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const client = new ApiClient(BASE_URL, () => storage.get<{ token: string }>('auth')?.token ?? null);

export const BudgetsAPI = {
  list: () => client.get<Budget[]>('/budgets'),
  create: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) =>
    client.post<Budget>('/budgets', budget),
  update: (id: string, budget: Partial<Budget>) =>
    client.put<Budget>(`/budgets/${id}`, budget),
  delete: (id: string) => client.delete(`/budgets/${id}`),
};