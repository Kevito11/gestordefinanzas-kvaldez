// src/components/modals/BudgetsModal.tsx
import React, { useState } from 'react';
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

  const handleBudgetCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
    onBudgetChange?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gastos Fijos" size="large">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.summary}>
            <h3>Gastos Fijos</h3>
            <div className={styles.stats}>
              <span className={styles.statLabel}>Gastos fijos registrados</span>
            </div>
          </div>
          <button
            className={styles.addButton}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '❌ Cancelar' : '➕ Nuevo Gasto Fijo'}
          </button>
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