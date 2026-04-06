// src/types/budget.ts
export interface Budget {
  id: string;
  name: string;
  category: string;
  currency: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'biweekly' | 'yearly' | 'daily' | 'one-time';
  startDate: string;
  endDate?: string;
  payDay?: number;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}
