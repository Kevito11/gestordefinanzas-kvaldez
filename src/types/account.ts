// src/types/account.ts
export type SalaryType = 'monthly' | 'biweekly' | 'weekly' | 'daily';

export interface Account {
  id: string;
  name: string; // Nombre de la fuente de ingreso
  currency: string; // e.g. "DOP", "USD"
  salaryType: SalaryType; // Tipo de salario/ingreso
  salary: number; // Monto del salario/ingreso principal
  extras?: number; // Ingresos adicionales
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}
