import { useState, useRef, useEffect } from 'react';
import { useModal } from '../../contexts/ModalContext';
import UserMenu from './UserMenu';
import styles from './Navbar.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleValidation = (modalType: 'accounts' | 'budgets' | 'transactions' | 'dataExchange') => {
    if (!user) {
      navigate('/plan-maestro');
      setIsOpen(false);
      return;
    }
    openModal(modalType);
    setIsOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h2 className={styles.title}>Cuentas Claras: Control Central</h2>
      </Link>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/historial" target="_blank" rel="noopener noreferrer" className={styles.navLink} style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
           📜 Historial
        </Link>
        <Link to="/plan-maestro" className={styles.navLink} style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
           🚀 Plan Maestro
        </Link>

        {/* Main Actions Menu */}
        <div className={styles.dropdownContainer} ref={dropdownRef}>
          <button
            className={styles.dropdownButton}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {isOpen && (
            <div className={styles.dropdownMenu}>
              <button
                className={styles.item}
                onClick={() => handleValidation('accounts')}
              >
                <span className={styles.icon}>🏦</span>
                Cuentas e Ingresos
              </button>
              <button
                className={styles.item}
                onClick={() => handleValidation('budgets')}
              >
                <span className={styles.icon}>💳</span>
                Gastos Fijos (Plan Maestro)
              </button>
              <button
                className={styles.item}
                onClick={() => handleValidation('transactions')}
              >
                <span className={styles.icon}>💰</span>
                Transacciones
              </button>
              <div style={{ borderTop: '1px solid #f3f4f6', margin: '0.25rem 0' }}></div>
              <button
                className={styles.item}
                onClick={() => handleValidation('dataExchange')}
              >
                <span className={styles.icon}>🗂️</span>
                Importar y exportar datos
              </button>
            </div>
          )}
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </nav>
  );
}
