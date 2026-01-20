import { useState } from 'react';
import { BudgetsAPI } from './budgets.api';
import type { Budget } from '@/types/budget';
import styles from './BudgetForm.module.css';

export default function BudgetForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    currency: 'DOP',
    amount: '',
    period: 'monthly' as Budget['period'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(form.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }
    
    setSaving(true);
    try {
      await BudgetsAPI.create({
        ...form,
        amount: amountValue
      });
      onCreated?.();
      setForm({ ...form, name: '', category: '', amount: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <label className={styles.label}>
        Nombre del Gasto
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className={styles.input}
          placeholder="Ej: Renta, Luz, Internet..."
          required
        />
      </label>
      <label className={styles.label}>
        Categoría
        <input
          type="text"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className={styles.input}
          placeholder="Ej: Vivienda, Servicios, Transporte..."
          required
        />
      </label>
      <label className={styles.label}>
        Monto del Gasto
        <input
          type="text"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
          className={styles.input}
          placeholder="0.00"
          required
        />
      </label>
      <label className={styles.label}>
        Moneda
        <select
          value={form.currency}
          onChange={e => setForm({ ...form, currency: e.target.value })}
          className={styles.select}
          required
        >
          <option value="DOP">DOP</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
      <label className={styles.label}>
        Frecuencia
        <select
          value={form.period}
          onChange={e => setForm({ ...form, period: e.target.value as Budget['period'] })}
          className={styles.select}
          required
        >
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quincenal</option>
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </select>
      </label>
      <label className={styles.label}>
        Fecha de Inicio
        <input
          type="date"
          value={form.startDate}
          onChange={e => setForm({ ...form, startDate: e.target.value })}
          className={styles.input}
          required
        />
      </label>
      <label className={styles.label}>
        Fecha de Fin (opcional)
        <input
          type="date"
          value={form.endDate}
          onChange={e => setForm({ ...form, endDate: e.target.value })}
          className={styles.input}
        />
      </label>
      <button type="submit" disabled={saving} className={styles.button}>
        {saving ? 'Guardando...' : 'Crear Gasto Fijo'}
      </button>
    </form>
  );
}