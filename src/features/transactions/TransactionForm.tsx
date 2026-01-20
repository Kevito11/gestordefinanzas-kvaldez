// src/features/transactions/TransactionForm.tsx
import { useState, useEffect } from 'react';
import { TransactionsAPI } from './Transactions.api';
import { AccountsAPI } from '@/features/accounts/accounts.api';
import type { TransactionType } from '@/types/transaction';
import type { Account } from '@/types/account';
import { formatCurrency } from '@/lib/currency';
import styles from './TransactionForm.module.css';

export default function TransactionForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState({
    accountId: '',
    type: 'expense' as TransactionType,
    amount: '',
    currency: 'DOP',
    category: '',
    description: '',
    date: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    AccountsAPI.list().then(setAccounts);
  }, []);

  useEffect(() => {
    if (form.accountId) {
      const account = accounts.find(acc => acc.id === form.accountId);
      if (account) {
        TransactionsAPI.list({ accountId: form.accountId }).then(transactions => {
          const incomeSum = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const expenseSum = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          setBalance(account.salary + incomeSum - expenseSum);
        });
      }
    } else {
      setBalance(0);
    }
  }, [form.accountId, accounts]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await TransactionsAPI.create({ ...form, amount: Number(form.amount) });
      onCreated?.();
      setForm({ ...form, amount: '', description: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <h3>Nueva Transacción</h3>

      <label className={styles.label}>
        Tipo de Transacción
      </label>
      <div className={styles.typeSelector}>
        <button
          type="button"
          className={`${styles.typeButton} ${form.type === 'income' ? `${styles.active} ${styles.income}` : ''}`}
          onClick={() => setForm({ ...form, type: 'income' })}
        >
          💰 Ingreso
        </button>
        <button
          type="button"
          className={`${styles.typeButton} ${form.type === 'expense' ? `${styles.active} ${styles.expense}` : ''}`}
          onClick={() => setForm({ ...form, type: 'expense' })}
        >
          💸 Gasto
        </button>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.label}>
          Cuenta
          <select
            value={form.accountId}
            onChange={e => setForm({ ...form, accountId: e.target.value })}
            className={styles.select}
            required
          >
            <option value="">Seleccionar cuenta</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
          {form.accountId && (
            <div className={styles.balanceInfo}>
              Saldo disponible: {formatCurrency(
                balance,
                accounts.find(acc => acc.id === form.accountId)?.currency || 'DOP'
              )}
            </div>
          )}
        </label>

        <label className={styles.label}>
          Monto
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className={styles.input}
            placeholder="0.00"
            required
          />
        </label>

        <label className={styles.label}>
          Categoría
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className={styles.select}
            required
          >
            <option value="">Seleccionar categoría</option>
            {form.type === 'income' ? (
              <>
                <option value="Salario">Salario</option>
                <option value="Freelance">Freelance</option>
                <option value="Inversiones">Inversiones</option>
                <option value="Regalos">Regalos</option>
                <option value="Otros Ingresos">Otros Ingresos</option>
              </>
            ) : (
              <>
                <option value="Alimentación">Alimentación</option>
                <option value="Transporte">Transporte</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Servicios">Servicios</option>
                <option value="Compras">Compras</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Otros Gastos">Otros Gastos</option>
              </>
            )}
          </select>
        </label>

        <label className={styles.label}>
          Fecha
          <input
            type="datetime-local"
            value={form.date.slice(0, 16)}
            onChange={e => setForm({ ...form, date: new Date(e.target.value).toISOString() })}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.label}>
          Descripción
          <input
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className={styles.input}
            placeholder="Descripción opcional"
          />
        </label>
      </div>

      <button type="submit" disabled={saving} className={styles.button}>
        {saving ? '⏳ Guardando...' : '✅ Crear Transacción'}
      </button>
    </form>
  );
}
