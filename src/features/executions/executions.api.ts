import { ApiClient } from '../../lib/apiClient';
import { storage } from '../../lib/storage';

export interface ExecutionLog {
  id?: string;
  _id?: string;
  userId?: string;
  itemId: string;
  itemName: string;
  itemType: 'income' | 'fixed_expense' | 'variable_expense' | 'saving';
  action?: 'created' | 'deleted' | 'executed';
  amount: number;
  currency: string;
  executionDate: string;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const client = new ApiClient(BASE_URL, () => storage.get<{ token: string }>('auth')?.token ?? null);

export const ExecutionsAPI = {
  list: () => client.get<ExecutionLog[]>('/executions'),
  create: (data: Omit<ExecutionLog, 'id' | '_id'>) => client.post<ExecutionLog>('/executions', data),
  update: (id: string, data: Partial<ExecutionLog>) => client.put<ExecutionLog>(`/executions/${id}`, data),
  delete: (id: string) => client.delete<{ message: string }>(`/executions/${id}`),
};
