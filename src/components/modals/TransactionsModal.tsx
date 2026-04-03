// src/components/modals/TransactionsModal.tsx
import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import Modal from './Modal';
import TransactionList from '../../features/transactions/TransactionList';
import TransactionForm from '../../features/transactions/TransactionForm';
import styles from './TransactionsModal.module.css';

const TransactionsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { openModal } = useModal();

  const handleTransactionCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mis Transacciones" size="large">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.summary}>
            <h3>Historial de Transacciones</h3>
            <div className={styles.stats}>
              <span className={styles.statLabel}>Transacciones registradas</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={styles.addButton}
              style={{ background: '#6366f1', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => { onClose(); openModal('dataExchange'); }}
            >
              <span>🗂️</span> <span className="text-hide-mobile">Importar / Exportar</span>
            </button>
            <button
              className={styles.addButton}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? '❌ Cancelar' : '➕ Nueva Transacción'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className={styles.createForm}>
            <TransactionForm onCreated={handleTransactionCreated} />
          </div>
        )}

        <TransactionList key={refreshKey} />
      </div>
    </Modal>
  );
};

export default TransactionsModal;