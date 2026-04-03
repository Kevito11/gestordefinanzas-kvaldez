import styles from './BudgetSection.module.css'; 
import { useAuth } from '../../app/providers/AuthProvider';
import { Link } from 'react-router-dom';

interface BudgetSummaryProps {
    totalIncome: number;
    totalExpenses: number;
    actualSpentThisMonth: number;
    totalSavings: number; 
    currency: 'USD' | 'DOP';
    exchangeRate?: number;
    timeframe: 'mensual' | 'quincenal' | 'puntual';
    budgetItems?: any[]; 
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ 
    totalIncome, 
    totalExpenses, 
    actualSpentThisMonth,
    totalSavings = 0, 
    currency, 
    exchangeRate = 1,
    timeframe,
    budgetItems = []
}) => {
    const { user } = useAuth();
    const today = new Date().getDate();
    const balance = totalIncome - totalExpenses - totalSavings;

    const upcomingPayments = budgetItems
        .filter(item => item.payDay && item.amount > 0)
        .filter(item => {
            const day = item.payDay;
            // Case for end of month or current/near day
            return (day === today) || 
                   (day > today && day <= today + 5) || 
                   (today > 25 && day <= (today + 5) % 31);
        })
        .sort((a, b) => a.payDay - b.payDay);

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
            {!user && (
                <div style={{
                    margin: '0 12px 16px 12px',
                    padding: '12px',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#991b1b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        ⚠️ MODO INVITADO
                    </div>
                    <p style={{ margin: 0 }}>
                        Tus datos son **temporales** y se borrarán al recargar la página.
                    </p>
                    <Link to="/login" style={{ 
                        color: '#b91c1c', 
                        fontWeight: 'bold', 
                        textDecoration: 'underline' 
                    }}>
                        Regístrate para guardar tus avances →
                    </Link>
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#27ae60', fontWeight: 'bold' }}>
                        <span>Total Ingresos:</span>
                        <span>{formatCurrency(totalIncome)}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b', fontWeight: 'bold' }}>
                    <span>Total Gastos:</span>
                    <span>{formatCurrency(totalExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d35400', fontWeight: 'bold' }}>
                    <span>Ahorros Apartados:</span>
                    <span>{formatCurrency(totalSavings)}</span>
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
                    <span>Presupuesto Restante:</span>
                    <span>{formatCurrency(balance)}</span>
                </div>

                <div style={{
                    marginTop: '1rem',
                    padding: '12px',
                    background: '#fff',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3498db',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Ejecución {timeframe} actual
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                        <span style={{ color: '#7f8c8d' }}>Presupuesto comprometido:</span>
                        <span style={{ fontWeight: '500' }}>{formatCurrency(totalExpenses)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                        <span style={{ color: '#7f8c8d' }}>Gastado real (Transacciones):</span>
                        <span style={{ fontWeight: 'bold', color: actualSpentThisMonth > 0 ? '#e67e22' : '#2c3e50' }}>
                            {formatCurrency(actualSpentThisMonth)}
                        </span>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontWeight: 'bold', 
                        borderTop: '1px dashed #eee',
                        paddingTop: '8px',
                        color: balance >= 0 ? '#27ae60' : '#c0392b', 
                        fontSize: '1.1rem' 
                    }}>
                        <span>Dinero Limpio Restante:</span>
                        <span>{formatCurrency(totalIncome - totalExpenses - totalSavings - (actualSpentThisMonth > 0 ? actualSpentThisMonth : 0))}</span>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#95a5a6', fontStyle: 'italic' }}>
                        * "Gastado real" solo cuenta las transacciones individuales registradas.
                    </p>
                </div>
                
                <div style={{ 
                    textAlign: 'center', 
                    fontSize: '0.85rem', 
                    color: '#2980b9', 
                    marginTop: '10px',
                    padding: '8px',
                    background: '#ebf5fb',
                    borderRadius: '6px',
                    border: '1px solid #d6eaf8'
                }}>
                    Tasa de Cambio Actual: <strong>$1 USD = RD$ {exchangeRate.toFixed(2)}</strong>
                </div>

                {upcomingPayments.length > 0 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '12px',
                        background: '#fff9f0',
                        borderRadius: '8px',
                        borderLeft: '4px solid #f39c12',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: '#8a6d3b', marginBottom: '8px', fontWeight: 'bold' }}>
                            🔔 PRÓXIMOS VENCIMIENTOS
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#8a6d3b' }}>
                            {upcomingPayments.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '4px', fontWeight: item.payDay === today ? 'bold' : 'normal' }}>
                                    {item.name}: <strong>Día {item.payDay}</strong> {item.payDay === today ? '(HOY)' : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetSummary;
