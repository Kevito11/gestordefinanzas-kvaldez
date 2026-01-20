// src/features/accounts/AccountList.tsx
import { useEffect, useState } from 'react';
import { AccountsAPI } from './accounts.api';
import type { Account } from '@/types/account';
import styles from './AccountList.module.css';

export default function AccountList({
  refreshKey,
  onAccountsLoaded,
  onEditAccount
}: {
  refreshKey?: number;
  onAccountsLoaded?: (accounts: Account[]) => void;
  onEditAccount?: (account: Account) => void;
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [refreshKey]);

  const loadAccounts = async () => {
    try {
      const data = await AccountsAPI.list();
      setAccounts(data);
      onAccountsLoaded?.(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: string, accountName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la fuente de ingreso "${accountName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(accountId);
    try {
      await AccountsAPI.delete(accountId);
      await loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error al eliminar la cuenta. Por favor, intenta de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedAccounts.size === 0) return;

    const accountNames = accounts
      .filter(acc => selectedAccounts.has(acc.id))
      .map(acc => acc.name)
      .join(', ');

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedAccounts.size} fuente(s) de ingreso: ${accountNames}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId('multiple');
    try {
      await Promise.all(Array.from(selectedAccounts).map(id => AccountsAPI.delete(id)));
      setSelectedAccounts(new Set());
      setIsSelectionMode(false);
      await loadAccounts();
    } catch (error) {
      console.error('Error deleting accounts:', error);
      alert('Error al eliminar las cuentas. Por favor, intenta de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelection = (accountId: string) => {
    const newSelection = new Set(selectedAccounts);
    if (newSelection.has(accountId)) {
      newSelection.delete(accountId);
    } else {
      newSelection.add(accountId);
    }
    setSelectedAccounts(newSelection);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedAccounts(new Set());
  };

  if (loading) {
    return <div className={styles.loading}>Cargando cuentas...</div>;
  }

  if (accounts.length === 0) {
    return <div className={styles.empty}>No hay fuentes de ingreso registradas.</div>;
  }

  return (
    <div className={styles.list}>
      <div className={styles.listHeader}>
        <h3>Fuentes de Ingreso</h3>
        <div className={styles.actions}>
          <button
            className={styles.selectionButton}
            onClick={toggleSelectionMode}
          >
            {isSelectionMode ? '❌ Cancelar' : '☑️ Seleccionar'}
          </button>
          {isSelectionMode && selectedAccounts.size > 0 && (
            <button
              className={styles.deleteMultipleButton}
              onClick={handleDeleteMultiple}
              disabled={deletingId === 'multiple'}
            >
              {deletingId === 'multiple' ? '⏳ Eliminando...' : `🗑️ Eliminar ${selectedAccounts.size}`}
            </button>
          )}
        </div>
      </div>
      <div className={styles.grid}>
        {accounts.map(account => (
          <div key={account.id} className={`${styles.card} ${selectedAccounts.has(account.id) ? styles.selected : ''}`}>
            {isSelectionMode && (
              <div className={styles.selectionOverlay}>
                <input
                  type="checkbox"
                  checked={selectedAccounts.has(account.id)}
                  onChange={() => toggleSelection(account.id)}
                  className={styles.checkbox}
                />
              </div>
            )}
            <div className={styles.cardHeader}>
              <h4>{account.name}</h4>
              {!isSelectionMode && (
                <div className={styles.cardActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => onEditAccount?.(account)}
                    title="Editar fuente de ingreso"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(account.id, account.name)}
                    disabled={deletingId === account.id}
                    title="Eliminar fuente de ingreso"
                  >
                    {deletingId === account.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              )}
            </div>
            <div className={styles.cardContent}>
              <p><strong>Tipo:</strong> {account.salaryType === 'monthly' ? 'Mensual' : account.salaryType === 'biweekly' ? 'Quincenal' : account.salaryType === 'weekly' ? 'Semanal' : 'Diario'}</p>
              <p><strong>Ingreso Principal:</strong> {account.salary.toLocaleString()} {account.currency}</p>
              {account.extras && account.extras > 0 && <p><strong>Ingresos Adicionales:</strong> {account.extras.toLocaleString()} {account.currency}</p>}
              <p><strong>Creada:</strong> {new Date(account.createdAt).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}