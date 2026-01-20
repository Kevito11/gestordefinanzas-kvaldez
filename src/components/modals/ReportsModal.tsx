// src/components/modals/ReportsModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { TransactionsAPI } from '../../features/transactions/Transactions.api';
import styles from './ReportsModal.module.css';

interface ReportData {
  period: string;
  income: number;
  expenses: number;
  savings: number;
  categories: { name: string; amount: number; percentage: number }[];
}

const ReportsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      TransactionsAPI.list().then(transactions => {
        // Filter by period
        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0); // end of month
        if (selectedPeriod === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (selectedPeriod === 'quarter') {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        } else { // year
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
        }
        const periodTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= startDate && tDate <= endDate;
        });
        const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const savings = income - expenses;
        // Categories
        const categoryMap = new Map<string, number>();
        periodTransactions.filter(t => t.type === 'expense').forEach(t => {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        });
        const categories = Array.from(categoryMap.entries()).map(([name, amount]) => ({
          name,
          amount,
          percentage: expenses > 0 ? (amount / expenses) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);
        const periodString = selectedPeriod === 'month' ? `${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}` :
          selectedPeriod === 'quarter' ? `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}` :
          `${now.getFullYear()}`;
        setReportData({
          period: periodString,
          income,
          expenses,
          savings,
          categories
        });
        setIsLoading(false);
      }).catch(() => {
        setReportData({
          period: 'Error',
          income: 0,
          expenses: 0,
          savings: 0,
          categories: []
        });
        setIsLoading(false);
      });
    }
  }, [isOpen, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const getCategoryColor = (index: number) => {
    const colors = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#EC4899'];
    return colors[index % colors.length];
  };

  if (isLoading || !reportData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Reportes" size="fullscreen">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Generando reporte...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reportes Financieros" size="fullscreen">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.periodSelector}>
            <label>Período:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
              className={styles.select}
            >
              <option value="month">Este Mes</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Año</option>
            </select>
          </div>
          <button className={styles.exportButton}>
            📊 Exportar Reporte
          </button>
        </div>

        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>💰</div>
            <div className={styles.cardInfo}>
              <h3>Ingresos Totales</h3>
              <p className={styles.amount}>{formatCurrency(reportData.income)}</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>💸</div>
            <div className={styles.cardInfo}>
              <h3>Gastos Totales</h3>
              <p className={styles.amount}>{formatCurrency(reportData.expenses)}</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>💾</div>
            <div className={styles.cardInfo}>
              <h3>Ahorros</h3>
              <p className={styles.amount}>{formatCurrency(reportData.savings)}</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>📈</div>
            <div className={styles.cardInfo}>
              <h3>% de Ahorro</h3>
              <p className={styles.amount}>
                {((reportData.savings / reportData.income) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className={styles.chartsSection}>
          <div className={styles.chart}>
            <h3>Distribución de Gastos por Categoría</h3>
            <div className={styles.pieChart}>
              {reportData.categories.map((category, index) => (
                <div
                  key={category.name}
                  className={styles.pieSlice}
                  style={{
                    backgroundColor: getCategoryColor(index),
                    transform: `rotate(${index * 60}deg)`
                  }}
                  title={`${category.name}: ${category.percentage}%`}
                ></div>
              ))}
            </div>
          </div>

          <div className={styles.chart}>
            <h3>Detalle por Categorías</h3>
            <div className={styles.categoriesList}>
              {reportData.categories.map((category, index) => (
                <div key={category.name} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <div
                      className={styles.categoryColor}
                      style={{ backgroundColor: getCategoryColor(index) }}
                    ></div>
                    <span className={styles.categoryName}>{category.name}</span>
                  </div>
                  <div className={styles.categoryAmount}>
                    <span className={styles.amount}>{formatCurrency(category.amount)}</span>
                    <span className={styles.percentage}>{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.insights}>
          <h3>💡 Insights del Período</h3>
          <div className={styles.insightsList}>
            {reportData.categories.length > 0 && (
              <div className={styles.insight}>
                <span className={styles.insightIcon}>🎯</span>
                <p>Tu mayor gasto este período fue en <strong>{reportData.categories[0].name}</strong> con {formatCurrency(reportData.categories[0].amount)}</p>
              </div>
            )}
            <div className={styles.insight}>
              <span className={styles.insightIcon}>📈</span>
              <p>Has ahorrado un <strong>{reportData.income > 0 ? ((reportData.savings / reportData.income) * 100).toFixed(1) : 0}%</strong> de tus ingresos este período</p>
            </div>
            {reportData.savings < 0 && (
              <div className={styles.insight}>
                <span className={styles.insightIcon}>⚠️</span>
                <p>Considera reducir gastos para aumentar tus ahorros</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReportsModal;