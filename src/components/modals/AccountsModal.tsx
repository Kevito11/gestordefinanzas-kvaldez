// src/components/modals/AccountsModal.tsx
import React, { useState } from 'react';
import Modal from './Modal';
import AccountList from '../../features/accounts/AccountList';
import AccountForm from '../../features/accounts/AccountForm';
import type { Account } from '@/types/account';
import styles from './AccountsModal.module.css';

const AccountsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  const handleAccountCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleAccountUpdated = () => {
    setEditingAccount(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowCreateForm(false);
    // Scroll al formulario
    const container = document.querySelector(`.${styles.container}`);
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  const handleAccountsLoaded = (accounts: Account[]) => {
    const total = accounts.reduce((sum, account) => sum + account.salary + (account.extras || 0), 0);
    setTotalBalance(total);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fuentes de Ingreso" size="large">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.summary}>
            <h3>Gestión de Ingresos</h3>
            <div className={styles.totalBalance}>
              <span className={styles.label}>Ingreso Total:</span>
              <span className={styles.amount}>
                {formatCurrency(totalBalance)}
              </span>
            </div>
          </div>
          <button
            className={styles.addButton}
            onClick={() => {
              if (editingAccount) {
                handleCancelEdit();
              } else {
                setShowCreateForm(!showCreateForm);
              }
            }}
          >
            {editingAccount ? '❌ Cancelar Edición' : showCreateForm ? '❌ Cancelar' : '➕ Nueva Cuenta'}
          </button>
        </div>

        {(showCreateForm || editingAccount) && (
          <div className={styles.createForm}>
            <AccountForm
              account={editingAccount || undefined}
              onCreated={handleAccountCreated}
              onUpdated={handleAccountUpdated}
            />
          </div>
        )}

        <AccountList
          refreshKey={refreshKey}
          onAccountsLoaded={handleAccountsLoaded}
          onEditAccount={handleEditAccount}
        />
      </div>
    </Modal>
  );
};

export default AccountsModal;