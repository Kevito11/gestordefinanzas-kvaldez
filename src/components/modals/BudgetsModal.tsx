// src/components/modals/BudgetsModal.tsx
import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import Modal from './Modal';
import BudgetList from '../../features/budgets/BudgetList';
import BudgetForm from '../../features/budgets/BudgetForm';
import styles from './BudgetsModal.module.css';

const BudgetsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  onBudgetChange?: () => void;
}> = ({
  isOpen,
  onClose,
  onBudgetChange
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { openModal } = useModal();

  const handleBudgetCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
    onBudgetChange?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gastos Fijos" size="large">
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h3>Gastos Fijos</h3>
            <div className={styles.statsCard}>
              <span className={styles.statLabel}>Gastos fijos registrados</span>
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
              {showCreateForm ? '❌ Cancelar' : '➕ Nuevo Pago Fijo'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className={styles.createForm}>
            <BudgetForm onCreated={handleBudgetCreated} />
          </div>
        )}

        <BudgetList key={refreshKey} />
      </div>
    </Modal>
  );
};

export default BudgetsModal;