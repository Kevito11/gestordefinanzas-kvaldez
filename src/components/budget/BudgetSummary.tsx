import React from 'react';
import styles from './BudgetSection.module.css'; // Reusing section styles for consistency or create new one

interface BudgetSummaryProps {
    totalIncome: number;
    totalExpenses: number;
    totalDeductions?: number; // New prop
    currency: 'USD' | 'DOP';
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ totalIncome, totalExpenses, totalDeductions = 0, currency }) => {
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    const formatCurrency = (amount: number) => {
        // Use 'en-US' for USD and 'es-DO' for DOP if possible, or just force the currency
        // 'es-DO' works well for DOP.
        const locale = currency === 'USD' ? 'en-US' : 'es-DO';
        return amount.toLocaleString(locale, { style: 'currency', currency: currency });
    };

    return (
        <div className={styles.section} style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
            <div className={styles.header}>
                <h3 className={styles.title}>Resumen del Presupuesto (Mensual)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#27ae60', fontWeight: 'bold' }}>
                        <span>Total Ingresos (Neto):</span>
                        <span>{formatCurrency(totalIncome)}</span>
                    </div>
                    {totalDeductions > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', fontSize: '0.85rem', marginTop: '4px' }}>
                            <span>Descuentos de Ley:</span>
                            <span>- {formatCurrency(totalDeductions)}</span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b', fontWeight: 'bold' }}>
                    <span>Total Gastos:</span>
                    <span>{formatCurrency(totalExpenses)}</span>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '2px solid #ccc',
                    paddingTop: '1rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: balance >= 0 ? '#2c3e50' : '#c0392b'
                }}>
                    <span>Capacidad de Ahorro:</span>
                    <span>{formatCurrency(balance)}</span>
                </div>
                {totalIncome > 0 && (
                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>
                        Tasa de ahorro: {savingsRate.toFixed(1)}%
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetSummary;
