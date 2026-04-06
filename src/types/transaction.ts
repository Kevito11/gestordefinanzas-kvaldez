// src/types/transaction.ts
export type TransactionType = 'income' | 'expense' | 'transfer' | 'savings';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string; // e.g. "Food", "Rent", "Salary"
  description?: string;
  date: string; // ISO
  payDay?: number;
  periodicity?: 'monthly' | 'biweekly' | 'weekly' | 'daily' | 'yearly' | 'one-time';
  isExecuted?: boolean;
  counterpartAccountId?: string; // para transferencias
  tags?: string[];
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}
