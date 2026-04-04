import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BudgetSection, { type BudgetItem } from '../components/budget/BudgetSection';
import BudgetSummary from '../components/budget/BudgetSummary';
import DataExchangeModal from '../components/modals/DataExchangeModal';
import { AccountsAPI } from '../features/accounts/accounts.api';
import { BudgetsAPI } from '../features/budgets/budgets.api';
import { TransactionsAPI } from '../features/transactions/Transactions.api';
import { useAuth } from '../app/providers/AuthProvider';
import styles from './PlanificadorMaestro.module.css';

const PlanificadorMaestro: React.FC = () => {
    const [incomes, setIncomes] = useState<BudgetItem[]>([]);
    const [fixedExpenses, setFixedExpenses] = useState<BudgetItem[]>([]);
    const [variableExpenses, setVariableExpenses] = useState<BudgetItem[]>([]);
    const [savings, setSavings] = useState<BudgetItem[]>([]);
    const [currency, setCurrency] = useState<'USD' | 'DOP'>('DOP');
    const [timeframe, setTimeframe] = useState<'mensual' | 'quincenal' | 'puntual' | 'original'>('mensual');
    const [exchangeRate, setExchangeRate] = useState<number>(60.00); 
    const [isDataExchangeOpen, setIsDataExchangeOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actualSpentThisMonth, setActualSpentThisMonth] = useState(0);
    const { user } = useAuth();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Guardar todos los cambios locales en la base de datos
    const handleSavePlan = async () => {
        if (!user) return;
        setSaving(true);
        setActionsOpen(false);

        try {
            // 1. Guardar Ingresos (Actualizar o Crear Cuentas)
            for (const income of incomes) {
                const accountData = { 
                    name: income.name,
                    salary: income.amount,
                    extras: 0, 
                    currency: income.itemCurrency || currency,
                    salaryType: (income.periodicity === 'anual' ? 'monthly' : 'monthly') as any // Opcional: mejorar mapeo
                };

                if (income.id.length > 20) {
                    await AccountsAPI.update(income.id, accountData);
                } else {
                    await AccountsAPI.create(accountData as any);
                }
            }

            // 2. Guardar Gastos Fijos (Crear o Actualizar Budgets)
            for (const expense of fixedExpenses) {
                const budgetData = {
                    name: expense.name,
                    amount: expense.amount,
                    currency: expense.itemCurrency,
                    period: (expense.periodicity === 'anual' ? 'yearly' : 'monthly') as 'yearly' | 'monthly',
                    payDay: expense.payDay
                };

                if (expense.id.length > 20) {
                    // Actualizar existente
                    await BudgetsAPI.update(expense.id, budgetData);
                } else {
                    // Crear nuevo (los de nanoid tienen id.length < 20)
                    await BudgetsAPI.create(budgetData as any);
                }
            }

            alert('✅ Planificación guardada exitosamente en la nube.');
            window.location.reload(); // Recargar para obtener los nuevos IDs reales de DB
        } catch (error) {
            console.error('Error al guardar planificación:', error);
            alert('❌ Error al guardar. Verifica tu conexión.');
        } finally {
            setSaving(false);
        }
    };

    // Cierre automático del menú desplegable al pulsar fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(res => res.json())
            .then(data => {
                if (data?.rates?.DOP) {
                    setExchangeRate(data.rates.DOP);
                }
            })
            .catch(err => console.error("Error cargando tasa de cambio:", err));

        const loadData = async () => {
            if (!user) return; 
            try {
                const [accounts, budgets, transactions] = await Promise.all([
                    AccountsAPI.list(),
                    BudgetsAPI.list(),
                    TransactionsAPI.list()
                ]);

                const mapPeriod = (p?: string) => {
                    if (p === 'yearly') return 'anual';
                    return 'mensual';
                };

                if (accounts.length > 0) {
                    const activeAccounts = accounts.filter((a: any) => a.isActive !== false);
                    setIncomes(activeAccounts.map((a: any) => ({
                        id: a.id,
                        name: a.name,
                        amount: Number(a.salary) + Number(a.extras || 0),
                        periodicity: mapPeriod(a.salaryType) as any,
                        itemCurrency: (a.currency as 'USD' | 'DOP') || 'DOP',
                        isCustom: true
                    })));
                }

                if (budgets.length > 0) {
                    setFixedExpenses(budgets.map(b => ({
                        id: b.id,
                        name: b.name,
                        amount: Number(b.amount),
                        periodicity: mapPeriod(b.period) as any,
                        itemCurrency: (b.currency as 'USD' | 'DOP') || 'DOP',
                        payDay: b.payDay,
                        isCustom: true
                    })));
                }

                if (transactions.length > 0) {
                    const variableT = transactions.filter((t: any) => t.type !== 'savings');
                    const savingsT = transactions.filter((t: any) => t.type === 'savings');

                    setVariableExpenses(variableT.map((t: any) => ({
                        id: t.id,
                        name: t.description || t.category || t.name || 'Gasto',
                        amount: Number(t.amount || 0),
                        periodicity: 'mensual',
                        itemCurrency: (t.currency as 'USD' | 'DOP') || 'DOP',
                        payDay: t.payDay,
                        isCustom: true
                    })));

                    setSavings(savingsT.map((t: any) => ({
                        id: t.id,
                        name: t.description || t.category || t.name || 'Ahorro',
                        amount: Number(t.amount || 0),
                        periodicity: 'mensual',
                        itemCurrency: (t.currency as 'USD' | 'DOP') || 'DOP',
                        isCustom: true
                    })));
                }
            } catch (err) {
                console.error("No se pudo cargar la data guardada", err);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const calculateActuals = async () => {
            if (!user) return; 
            try {
                const transactions = await TransactionsAPI.list();
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const filtered = transactions.filter((t: any) => {
                    const d = new Date(t.date);
                    return t.type === 'expense' && 
                           d.getMonth() === currentMonth && 
                           d.getFullYear() === currentYear;
                });

                const total = filtered.reduce((acc: number, curr: any) => {
                    let amt = Number(curr.amount);
                    const itemCurr = curr.currency || currency;
                    if (itemCurr === 'USD' && currency === 'DOP') {
                        amt = amt * exchangeRate;
                    } else if (itemCurr === 'DOP' && currency === 'USD') {
                        amt = exchangeRate > 0 ? amt / exchangeRate : amt;
                    }
                    return acc + amt;
                }, 0);

                setActualSpentThisMonth(total);
            } catch (err) {
                console.error("Error calculando reales:", err);
            }
        };
        calculateActuals();
    }, [currency, exchangeRate]);

    const handleClearAll = async () => {
        if (!window.confirm('🚨 PRECAUCIÓN: ¿Estás completamente seguro de que deseas ELIMINAR TODOS los registros guardados en tu base de datos? Esta acción NO se puede deshacer.')) {
            return;
        }

        try {
            const [accounts, budgets, transactions] = await Promise.all([
                AccountsAPI.list(),
                BudgetsAPI.list(),
                TransactionsAPI.list()
            ]);

            for (const a of accounts) await AccountsAPI.delete(a.id);
            for (const b of budgets) await BudgetsAPI.delete(b.id);
            for (const t of transactions) await TransactionsAPI.delete(t.id);

            alert('✅ Todos los datos han sido eliminados exitosamente.');
            window.location.reload(); 
        } catch (error) {
            console.error('Error al borrar los datos:', error);
            alert('Hubo un error al intentar eliminar los datos.');
        }
    };

    const calculatePeriodTotal = (items: BudgetItem[]) => {
        return items.reduce((acc, curr) => {
            let baseAmount = curr.amount;

            const itemCurr = curr.itemCurrency || currency;
            if (itemCurr === 'USD' && currency === 'DOP') {
                baseAmount = baseAmount * exchangeRate;
            } else if (itemCurr === 'DOP' && currency === 'USD') {
                baseAmount = exchangeRate > 0 ? baseAmount / exchangeRate : baseAmount;
            }

            if (timeframe === 'puntual') return acc + baseAmount;

            // Si es 'original', ignoramos la periodicidad y sumamos el monto base (ya convertido a la moneda seleccionada)
            if (timeframe === 'original') {
                return acc + baseAmount;
            }

            let multiplier = 1; 
            switch (curr.periodicity) {
                case 'mensual': multiplier = 1; break;
                case 'quincenal': multiplier = 2; break;
                case 'anual': multiplier = 1 / 12; break;
                case 'trimestral': multiplier = 1 / 3; break;
                case 'semestral': multiplier = 1 / 6; break;
                case 'puntual': multiplier = 1 / 12; break;
                default: multiplier = 1; break;
            }

            let monthlyEquiv = baseAmount * multiplier;
            if (timeframe === 'quincenal') monthlyEquiv = monthlyEquiv / 2;

            return acc + monthlyEquiv;
        }, 0);
    };

    const totalIncome = calculatePeriodTotal(incomes);
    const totalFixed = calculatePeriodTotal(fixedExpenses);
    const totalVariable = calculatePeriodTotal(variableExpenses);
    const totalSavings = calculatePeriodTotal(savings);
    const totalExpenses = totalFixed + totalVariable;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Planificador Maestro</h1>
                    <p>Diseña tu estrategia financiera. Define tus ingresos y planea tus gastos con precisión.</p>
                </div>

                <div className={styles.controlsBar}>
                    <div className={styles.controlGroup}>
                        <label>Moneda:</label>
                        <select className={styles.select} value={currency} onChange={(e) => setCurrency(e.target.value as any)}>
                            <option value="DOP">RD$ (Peso)</option>
                            <option value="USD">USD ($)</option>
                        </select>
                    </div>

                    <div className={styles.controlGroup}>
                        <label>Resumen:</label>
                        <select className={styles.select} value={timeframe} onChange={(e) => setTimeframe(e.target.value as any)}>
                            <option value="mensual">Vista Mensual</option>
                            <option value="quincenal">Vista Quincenal</option>
                            <option value="original">Sin Conversión (Original)</option>
                            <option value="puntual">Puntual (Ahora)</option>
                        </select>
                    </div>
                    
                    <div className={styles.actionsArea}>
                        {user ? (
                            <div className={styles.dropdownContainer} ref={dropdownRef}>
                                <button 
                                    className={styles.dropdownToggle}
                                    onClick={() => setActionsOpen(!actionsOpen)}
                                >
                                    <span>⚙️</span> Acciones Rápidas
                                </button>
                                
                                <AnimatePresence>
                                    {actionsOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className={styles.dropdownMenu}
                                            style={{ transformOrigin: 'top right' }}
                                        >
                                            <button 
                                                onClick={handleSavePlan} 
                                                className={`${styles.dropdownItem} ${styles.saveItem}`}
                                                disabled={saving}
                                            >
                                                <span>💾</span> {saving ? 'Guardando...' : 'Guardar Planificación'}
                                            </button>

                                            <div className={styles.divider}></div>

                                            <Link to="/" className={styles.dropdownItem}>
                                                <span>🏠</span> Inicio
                                            </Link>
                                            <Link to="/transactions" className={styles.dropdownItem}>
                                                <span>💸</span> Historial
                                            </Link>
                                            <button onClick={() => {
                                                handleClearAll();
                                                setActionsOpen(false);
                                            }} className={styles.dropdownItem}>
                                                <span>🗑️</span> Borrar todo
                                            </button>
                                            <button onClick={() => {
                                                setIsDataExchangeOpen(true);
                                                setActionsOpen(false);
                                            }} className={styles.dropdownItem}>
                                                <span>🗂️</span> Importar/Exportar
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login" className={`${styles.actionBtn} ${styles.loginBtn}`}>
                                Iniciar Sesión para Guardar
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className={styles.gridContainer}>
                <div className={styles.formsArea}>
                    <BudgetSection title="Ingresos" items={incomes} currency={currency} exchangeRate={exchangeRate} timeframe={timeframe} onChange={setIncomes} />
                    <BudgetSection title="Gastos Fijos" items={fixedExpenses} currency={currency} exchangeRate={exchangeRate} timeframe={timeframe} onChange={setFixedExpenses} />
                    <BudgetSection title="Gastos Variables" items={variableExpenses} currency={currency} exchangeRate={exchangeRate} timeframe={timeframe} onChange={setVariableExpenses} />
                    <BudgetSection title="Apartados ahorro" items={savings} currency={currency} exchangeRate={exchangeRate} timeframe={timeframe} onChange={setSavings} />
                </div>

                <div className={styles.summarySidebar}>
                    <BudgetSummary
                        totalIncome={totalIncome}
                        totalExpenses={totalExpenses}
                        actualSpentThisMonth={actualSpentThisMonth}
                        totalSavings={totalSavings}
                        currency={currency}
                        exchangeRate={exchangeRate}
                        timeframe={timeframe}
                        budgetItems={[...fixedExpenses, ...variableExpenses]}
                    />

                    <div className={styles.breakdownCard}>
                        <h4>Desglose de Gastos</h4>
                        <div className={styles.breakdownRow}>
                            <span className={styles.breakdownLabel}>Gastos Fijos:</span>
                            <span className={styles.breakdownValue}>{totalExpenses > 0 ? ((totalFixed / totalExpenses) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span className={styles.breakdownLabel}>Gastos Variables:</span>
                            <span className={styles.breakdownValue}>{totalExpenses > 0 ? ((totalVariable / totalExpenses) * 100).toFixed(1) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <DataExchangeModal isOpen={isDataExchangeOpen} onClose={() => setIsDataExchangeOpen(false)} />
        </div>
    );
};

export default PlanificadorMaestro;
