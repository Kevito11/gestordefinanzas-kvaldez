// src/features/budgets/BudgetList.tsx
import { useEffect, useState } from 'react';
import { BudgetsAPI } from './budgets.api';
import type { Budget } from '@/types/budget';
import styles from './BudgetList.module.css';

export default function BudgetList({ refreshKey }: { refreshKey?: number }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BudgetsAPI.list().then(setBudgets).finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return <div className={styles.loading}>Cargando gastos fijos...</div>;
  }

  if (budgets.length === 0) {
    return <div className={styles.empty}>No hay gastos fijos registrados.</div>;
  }

  return (
    <div className={styles.list}>
      <h3>Gastos Fijos Registrados</h3>
      <div className={styles.grid}>
        {budgets.map(budget => {
          const getPeriodLabel = (period: string) => {
            switch (period) {
              case 'weekly': return 'Semanal';
              case 'biweekly': return 'Quincenal';
              case 'monthly': return 'Mensual';
              case 'yearly': return 'Anual';
              default: return period;
            }
          };

          return (
            <div key={budget.id} className={styles.card}>
              <h4>{budget.name}</h4>
              <p><strong>Categoría:</strong> {budget.category}</p>
              <p><strong>Monto del gasto:</strong> {budget.amount} {budget.currency}</p>
              <p><strong>Frecuencia:</strong> {getPeriodLabel(budget.period)}</p>
              <p><strong>Inicio:</strong> {new Date(budget.startDate).toLocaleDateString()}</p>
              {budget.endDate && (
                <p><strong>Fin:</strong> {new Date(budget.endDate).toLocaleDateString()}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}