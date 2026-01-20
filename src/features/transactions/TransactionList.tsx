// src/features/transactions/TransactionList.tsx
import { useEffect, useState } from 'react';
import { TransactionsAPI } from './Transactions.api';
import { AccountsAPI } from '../accounts/accounts.api';
import type { Transaction } from '@/types/transaction';
import type { Account } from '@/types/account';
import { formatCurrency } from '@/lib/currency';
import styles from './TransactionList.module.css';

export default function TransactionList({ refreshKey }: { refreshKey?: number }) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [transactions, accountsData] = await Promise.all([
        TransactionsAPI.list(),
        AccountsAPI.list()
      ]);
      setItems(transactions);
      setAccounts(accountsData);
    };
    loadData().finally(() => setLoading(false));
  }, [refreshKey]);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Cuenta desconocida';
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      try {
        await TransactionsAPI.delete(id);
        setItems(items.filter(tx => tx.id !== id));
      } catch (error) {
        alert('Error al eliminar la transacción');
        console.error(error);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>💰</div>
        <h3>No hay transacciones registradas</h3>
        <p>Registra tu primera transacción para comenzar a controlar tus finanzas</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <h3>Transacciones Recientes</h3>
      <div className={styles.grid}>
        {items
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20) // Mostrar solo las últimas 20
          .map(tx => (
            <div key={tx.id} className={`${styles.card} ${styles[tx.type]}`}>
              <div className={styles.cardHeader}>
                <div className={styles.typeIcon}>
                  {tx.type === 'income' ? '💰' : '💸'}
                </div>
                <div className={styles.cardInfo}>
                  <h4 className={styles.description}>{tx.description || 'Sin descripción'}</h4>
                  <span className={styles.category}>{tx.category}</span>
                  <span className={styles.account}>Cuenta: {getAccountName(tx.accountId)}</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.amount}>
                  {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                </div>
                <div className={styles.date}>
                  {new Date(tx.date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(tx.id)}
                  title="Eliminar transacción"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
