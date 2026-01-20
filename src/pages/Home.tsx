// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { ModalProvider, useModal } from '../contexts/ModalContext';
import AccountsModal from '../components/modals/AccountsModal';
import TransactionsModal from '../components/modals/TransactionsModal';
import BudgetsModal from '../components/modals/BudgetsModal';
import ReportsModal from '../components/modals/ReportsModal';
import { AccountsAPI } from '../features/accounts/accounts.api';
import { TransactionsAPI } from '../features/transactions/Transactions.api';
import { BudgetsAPI } from '../features/budgets/budgets.api';
import type { Account } from '@/types/account';
import type { Transaction } from '@/types/transaction';
import TransactionList from '../features/transactions/TransactionList';
import BudgetList from '../features/budgets/BudgetList';
import styles from './Home.module.css';
import Navbar from '../components/layout/Navbar';

function HomeContent() {
  const { activeModal, openModal, closeModal } = useModal();
  const [stats, setStats] = useState({
    accounts: 0,
    transactions: 0,
    budgets: 0,
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0
  });
  const [budgetsRefreshKey, setBudgetsRefreshKey] = useState(0);

  const refreshBudgets = () => {
    setBudgetsRefreshKey(prev => prev + 1);
  };

  // Cargar estadísticas reales de la API
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [accounts, transactions, budgets] = await Promise.all([
          AccountsAPI.list(),
          TransactionsAPI.list(),
          BudgetsAPI.list()
        ]);

        const totalBalance = accounts.reduce((sum: number, account: Account) => sum + account.salary + (account.extras || 0), 0);
        const totalIncome = transactions
          .filter((t: Transaction) => t.type === 'income')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const totalExpenses = transactions
          .filter((t: Transaction) => t.type === 'expense')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        setStats({
          accounts: accounts.length,
          transactions: transactions.length,
          budgets: budgets.length,
          totalBalance,
          totalIncome,
          totalExpenses
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        // Mantener valores por defecto en caso de error
      }
    };

    loadStats();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);



  return (
    <div className={styles.home}>
      <Navbar />
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Gestiona tus Finanzas de Manera Inteligente
          </h1>
          <p className={styles.heroSubtitle}>
            Controla tus ingresos, gastos y presupuestos con herramientas poderosas y fáciles de usar.
          </p>
          <div className={styles.heroActions}>
            <button
              className={styles.primaryButton}
              onClick={() => openModal('accounts')}
            >
              Comenzar Ahora
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => openModal('transactions')}
            >
              Ver Transacciones
            </button>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.floatingCard}>
            <div className={styles.cardIcon}>📱</div>
            <h3>Acceso Móvil</h3>
            <p>Gestiona desde cualquier lugar</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.accounts}</div>
            <div className={styles.statLabel}>Fuentes de Ingreso</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.transactions}</div>
            <div className={styles.statLabel}>Transacciones</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.budgets}</div>
            <div className={styles.statLabel}>Gastos Fijos</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>${stats.totalBalance.toLocaleString()}</div>
            <div className={styles.statLabel}>Ingreso Total</div>
          </div>
        </div>
      </section>

      {/* Recent Transactions Section */}
      <section className={styles.transactions}>
        <div className={styles.sectionHeader}>
          <h2>Transacciones Recientes</h2>
          <p>Revisa tus movimientos financieros más recientes</p>
        </div>
        <TransactionList />
      </section>

      {/* Fixed Expenses Section */}
      <section className={styles.budgets}>
        <div className={styles.sectionHeader}>
          <h2>Gastos Fijos</h2>
          <p>Tus gastos recurrentes mensuales, quincenales y semanales</p>
        </div>
        <BudgetList key={budgetsRefreshKey} />
      </section>



      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>¿Listo para tomar control de tus finanzas?</h2>
          <p>Únete a miles de usuarios que ya gestionan mejor su dinero</p>
          <button
            className={styles.ctaButton}
            onClick={() => openModal('accounts')}
          >
            Crear Cuenta Gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            Creado por <span className={styles.creatorName}>Kvaldez</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AccountsModal
        isOpen={activeModal === 'accounts'}
        onClose={closeModal}
      />
      <TransactionsModal
        isOpen={activeModal === 'transactions'}
        onClose={closeModal}
      />
      <BudgetsModal
        isOpen={activeModal === 'budgets'}
        onClose={closeModal}
        onBudgetChange={refreshBudgets}
      />
      <ReportsModal
        isOpen={activeModal === 'reports'}
        onClose={closeModal}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ModalProvider>
      <HomeContent />
    </ModalProvider>
  );
}
