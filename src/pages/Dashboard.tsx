// src/pages/Dashboard.tsx
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
import styles from './Dashboard.module.css';
import Navbar from '../components/layout/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

        const activeAccounts = accounts.filter((a: Account) => a.isActive !== false);

        const totalBalance = activeAccounts.reduce((sum: number, account: Account) => sum + account.salary + (account.extras || 0), 0);
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
      {!user && (
        <div style={{
          background: '#fee2e2',
          padding: '10px',
          textAlign: 'center',
          color: '#991b1b',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          position: 'sticky',
          top: '70px',
          zIndex: 50,
          borderBottom: '1px solid #fee2e2'
        }}>
           ⚠️ MODO INVITADO: Tus datos son temporales. <Link to="/login" style={{ color: '#b91c1c' }}>Regístrate aquí</Link> para guardar tus finanzas.
        </div>
      )}
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Control Central: Tu Estrategia Financiera
          </h1>
          <p className={styles.heroSubtitle}>
            Bienvenido a tu base de operaciones. Desde aquí supervisas tu progreso, tus transacciones y tu futuro económico.
          </p>
          <div className={styles.heroActions}>
            <Link
              to="/plan-maestro"
              className={styles.primaryButton}
              style={{ textDecoration: 'none' }}
            >
              🚀 Mi Plan Maestro
            </Link>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                if (!user) {
                  navigate('/plan-maestro');
                } else {
                  openModal('transactions');
                }
              }}
            >
              ➕ Registrar Gasto
            </button>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.floatingCard}>
            <div className={styles.cardIcon}>📊</div>
            <h3>Análisis Real</h3>
            <p>Tus números, siempre al día</p>
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
          <p>Tus pagos recurrentes mensuales, quincenales y semanales</p>
        </div>
        <BudgetList key={budgetsRefreshKey} />
      </section>



      {/* Plan Maestro Promo Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>¿Tienes un Plan para tu Dinero?</h2>
          <p>Usa nuestro Planificador Maestro para diseñar tu futuro y asegurarte de que cada peso tenga un propósito.</p>
          <Link
            to="/plan-maestro"
            className={styles.ctaButton}
            style={{ textDecoration: 'none' }}
          >
            Ir al Planificador Maestro 🎯
          </Link>
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

export default function Dashboard() {
  return (
    <ModalProvider>
      <DashboardContent />
    </ModalProvider>
  );
}
