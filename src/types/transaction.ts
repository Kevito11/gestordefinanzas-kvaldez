// src/types/transaction.ts
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string; // e.g. "Food", "Rent", "Salary"
  description?: string;
  date: string; // ISO
  counterpartAccountId?: string; // para transferencias
  tags?: string[];
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}
