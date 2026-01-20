// src/features/accounts/AccountForm.tsx
import { useState, useEffect } from 'react';
import { AccountsAPI } from './accounts.api';
import type { Account, SalaryType } from '@/types/account';
import styles from './AccountForm.module.css';

export default function AccountForm({ 
  account, 
  onCreated, 
  onUpdated 
}: { 
  account?: Account;
  onCreated?: () => void;
  onUpdated?: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    currency: 'DOP',
    salaryType: 'monthly' as SalaryType,
    salary: 0,
    extras: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la cuenta si estamos editando
  useEffect(() => {
    if (account) {
      setForm({
        name: account.name,
        currency: account.currency,
        salaryType: account.salaryType,
        salary: account.salary,
        extras: account.extras || 0,
      });
    } else {
      // Resetear formulario si no hay cuenta
      setForm({
        name: '',
        currency: 'DOP',
        salaryType: 'monthly' as SalaryType,
        salary: 0,
        extras: 0,
      });
    }
  }, [account]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (account) {
        // Actualizar cuenta existente
        await AccountsAPI.update(account.id, form);
        onUpdated?.();
      } else {
        // Crear nueva cuenta
        await AccountsAPI.create(form);
        onCreated?.();
      }
      // Resetear formulario solo si no estamos editando
      if (!account) {
        setForm({ ...form, name: '', salary: 0, extras: 0 });
      }
    } catch (err) {
      console.error('Error saving account:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar la fuente de ingreso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <h3>{account ? 'Editar Fuente de Ingreso' : 'Nueva Fuente de Ingreso'}</h3>
      {error && <div className={styles.error}>{error}</div>}
      <label className={styles.label}>
        Nombre de la Fuente
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className={styles.input}
          placeholder="Ej: Trabajo Principal, Freelance, etc."
          required
        />
      </label>
      <label className={styles.label}>
        Tipo de Ingreso
        <select
          value={form.salaryType}
          onChange={e => setForm({ ...form, salaryType: e.target.value as SalaryType })}
          className={styles.input}
        >
          <option value="monthly">Mensual</option>
          <option value="biweekly">Quincenal</option>
          <option value="weekly">Semanal</option>
          <option value="daily">Diario</option>
        </select>
      </label>
      <label className={styles.label}>
        Monto del Ingreso
        <input
          type="number"
          value={form.salary}
          onChange={e => setForm({ ...form, salary: Number(e.target.value) })}
          className={styles.input}
          min="0"
          step="0.01"
          required
        />
      </label>
      <label className={styles.label}>
        Ingresos Adicionales
        <input
          type="number"
          value={form.extras}
          onChange={e => setForm({ ...form, extras: Number(e.target.value) })}
          className={styles.input}
          min="0"
          step="0.01"
          placeholder="Bonos, comisiones, etc."
        />
      </label>
      <button type="submit" disabled={saving} className={styles.button}>
        {saving ? 'Guardando...' : account ? 'Actualizar Fuente de Ingreso' : 'Crear Fuente de Ingreso'}
      </button>
    </form>
  );
}