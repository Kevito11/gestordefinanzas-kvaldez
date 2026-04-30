import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BudgetSection, { type BudgetItem } from '../components/budget/BudgetSection';
import BudgetSummary from '../components/budget/BudgetSummary';
import HistoryOverlay from '../components/budget/HistoryOverlay';
import DataExchangeModal from '../components/modals/DataExchangeModal';
import { AccountsAPI } from '../features/accounts/accounts.api';
import { BudgetsAPI } from '../features/budgets/budgets.api';
import { TransactionsAPI } from '../features/transactions/Transactions.api';
import { ExecutionsAPI } from '../features/executions/executions.api';
import { useAuth } from '../app/providers/AuthProvider';
import styles from './PlanificadorMaestro.module.css';

const uiToDbPeriod = (p?: string): 'monthly' | 'biweekly' | 'yearly' | 'daily' | 'one-time' | 'weekly' => {
    if (p === 'quincenal') return 'biweekly';
    if (p === 'anual') return 'yearly';
    if (p === 'puntual') return 'one-time';
    return 'monthly';
};

const dbToUiPeriod = (p?: string) => {
    if (p === 'biweekly') return 'quincenal';
    if (p === 'yearly') return 'anual';
    if (p === 'one-time' || p === 'daily') return 'puntual';
    return 'mensual';
};

const PlanificadorMaestro: React.FC = () => {
    const [incomes, setIncomes] = useState<BudgetItem[]>([]);
    const [fixedExpenses, setFixedExpenses] = useState<BudgetItem[]>([]);
    const [variableExpenses, setVariableExpenses] = useState<BudgetItem[]>([]);
    const [savings, setSavings] = useState<BudgetItem[]>([]);
    const [currency, setCurrency] = useState<'USD' | 'DOP'>('DOP');
    const [timeframe, setTimeframe] = useState<'mensual' | 'quincenal' | 'puntual' | 'original'>('mensual');
    const [exchangeRate, setExchangeRate] = useState<number>(59.2362); 
    const [isDataExchangeOpen, setIsDataExchangeOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const originalExecutionsRef = useRef<Record<string, any>>({});
    const [actualSpentThisMonth, setActualSpentThisMonth] = useState(0);
    const { user } = useAuth();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Guardar todos los cambios locales en la base de datos (Sincronización total)
    const handleSavePlan = async () => {
        if (!user) return;
        setSaving(true);
        setActionsOpen(false);

        const logActivity = async (item: any, itemType: string, action: 'created' | 'deleted' | 'executed', defaultName: string) => {
            try {
                await ExecutionsAPI.create({
                    itemId: item.id || item._id || '000000000000000000000000',
                    itemName: item.name || item.description || defaultName,
                    itemType: itemType as any,
                    action,
                    amount: Number(item.amount || item.salary || 0),
                    currency: item.itemCurrency || item.currency || currency,
                    executionDate: new Date().toISOString()
                });
            } catch (e) {
                console.error(`Error logging ${action}`, e);
            }
        };

        const syncExecution = async (item: any, itemType: string, defaultName: string) => {
            if (item.isExecuted) {
                const existingExec = originalExecutionsRef.current[item.id];
                const newDate = item.executionDate || new Date().toISOString();
                
                if (!existingExec) {
                    await ExecutionsAPI.create({ 
                        itemId: item.id, 
                        itemName: item.name || defaultName,
                        itemType: itemType as any,
                        action: 'executed',
                        amount: Number(item.amount || 0),
                        currency: item.itemCurrency || currency,
                        executionDate: newDate
                    }).catch(e => console.error(e));
                } else if (existingExec.executionDate !== newDate) {
                    const execId = existingExec.id || existingExec._id;
                    if (execId) {
                        await ExecutionsAPI.update(execId, { executionDate: newDate }).catch(e => console.error(e));
                    }
                }
            }
        };

        try {
            // 0. Obtener estado actual de la DB para detectar borrados
            const [dbAccounts, dbBudgets, dbTrxs] = await Promise.all([
                AccountsAPI.list(),
                BudgetsAPI.list(),
                TransactionsAPI.list()
            ]);

            // 1. Sincronizar Ingresos (Cuentas)
            const incomeIdsInUI = new Set(incomes.filter(i => i && i.id).map(i => i.id));
            for (const dbAcc of dbAccounts) {
                if (!dbAcc) continue;
                const dbId = dbAcc.id || (dbAcc as any)._id;
                if (dbId && typeof dbId === 'string' && !incomeIdsInUI.has(dbId)) {
                    await AccountsAPI.delete(dbId);
                    await logActivity(dbAcc, 'income', 'deleted', 'Ingreso S/N');
                }
            }

            for (const income of incomes) {
                if (!income) continue;
                const accountData = { 
                    name: (income.name || 'Ingreso S/N').trim(),
                    salary: Number(income.amount || 0),
                    extras: 0, 
                    currency: income.itemCurrency || currency,
                    salaryType: uiToDbPeriod(income.periodicity),
                    payDay: income.payDay,
                    isExecuted: income.isExecuted
                };

                if (income.id && typeof income.id === 'string' && income.id.length === 24) {
                    await AccountsAPI.update(income.id, accountData);
                    await syncExecution(income, 'income', 'Ingreso S/N');
                } else {
                    const res = await AccountsAPI.create(accountData as any);
                    await logActivity(res, 'income', 'created', 'Ingreso S/N');
                }
            }

            // 2. Sincronizar Gastos Fijos (Presupuestos)
            const expenseIdsInUI = new Set(fixedExpenses.filter(e => e && e.id).map(e => e.id));
            for (const dbBud of dbBudgets) {
                if (!dbBud) continue;
                const dbId = dbBud.id || (dbBud as any)._id;
                if (dbId && typeof dbId === 'string' && !expenseIdsInUI.has(dbId)) {
                    await BudgetsAPI.delete(dbId);
                    await logActivity(dbBud, 'fixed_expense', 'deleted', 'Gasto S/N');
                }
            }

            for (const expense of fixedExpenses) {
                if (!expense) continue;
                const budgetData = {
                    name: (expense.name || 'Gasto S/N').trim(),
                    amount: Number(expense.amount || 0),
                    currency: expense.itemCurrency || currency,
                    period: uiToDbPeriod(expense.periodicity),
                    payDay: expense.payDay,
                    isExecuted: expense.isExecuted,
                    category: 'Plan Maestro',
                    startDate: expense.originalDate || new Date().toISOString()
                };

                if (expense.id && typeof expense.id === 'string' && expense.id.length === 24) {
                    await BudgetsAPI.update(expense.id, budgetData);
                    await syncExecution(expense, 'fixed_expense', 'Gasto S/N');
                } else {
                    const res = await BudgetsAPI.create(budgetData as any);
                    await logActivity(res, 'fixed_expense', 'created', 'Gasto S/N');
                }
            }

            // 3. Sincronizar Gastos Variables y Ahorros (Transactions)
            const allTrxsInUI = [...variableExpenses, ...savings];
            const trxIdsInUI = new Set(allTrxsInUI.filter(t => t && t.id).map(t => t.id));
            
            for (const dbTrx of dbTrxs) {
                if (!dbTrx) continue;
                // Evitar borrar transacciones que no sean de los tipos manejados en el Planificador (ej. ingresos o transferencias)
                if (dbTrx.type !== 'expense' && dbTrx.type !== 'savings') continue;
                
                const dbId = dbTrx.id || (dbTrx as any)._id;
                if (dbId && typeof dbId === 'string' && !trxIdsInUI.has(dbId)) {
                    await TransactionsAPI.delete(dbId);
                    await logActivity(dbTrx, dbTrx.type === 'savings' ? 'saving' : 'variable_expense', 'deleted', 'Transacción S/N');
                }
            }

            // Necesitamos una cuenta por defecto para las transacciones
            const currentAccounts = await AccountsAPI.list();
            const defaultAccountId = currentAccounts.length > 0 
                ? (currentAccounts[0].id || (currentAccounts[0] as any)._id) 
                : undefined;

            if (!defaultAccountId) {
                throw new Error("No hay una cuenta activa para guardar gastos.");
            }

            // Guardar Gastos Variables
            for (const item of variableExpenses) {
                if (!item) continue;
                const trxData = {
                    description: item.name || 'Gasto Variable',
                    amount: Number(item.amount || 0),
                    currency: item.itemCurrency || currency,
                    type: 'expense' as const,
                    category: 'Variable',
                    accountId: defaultAccountId,
                    date: item.originalDate || new Date().toISOString(),
                    payDay: item.payDay,
                    periodicity: uiToDbPeriod(item.periodicity),
                    isExecuted: item.isExecuted
                };

                if (item.id && typeof item.id === 'string' && item.id.length === 24) {
                    await TransactionsAPI.update(item.id, trxData);
                    await syncExecution(item, 'variable_expense', 'Gasto Variable');
                } else {
                    const res = await TransactionsAPI.create(trxData);
                    await logActivity(res, 'variable_expense', 'created', 'Gasto Variable');
                }
            }

            // Guardar Ahorros
            for (const item of savings) {
                if (!item) continue;
                const trxData = {
                    description: item.name || 'Ahorro',
                    amount: Number(item.amount || 0),
                    currency: item.itemCurrency || currency,
                    type: 'savings' as const,
                    category: 'Ahorro',
                    accountId: defaultAccountId,
                    date: item.originalDate || new Date().toISOString(),
                    payDay: item.payDay,
                    periodicity: uiToDbPeriod(item.periodicity),
                    isExecuted: item.isExecuted
                };

                if (item.id && typeof item.id === 'string' && item.id.length === 24) {
                    await TransactionsAPI.update(item.id, trxData);
                    await syncExecution(item, 'saving', 'Ahorro');
                } else {
                    const res = await TransactionsAPI.create(trxData);
                    await logActivity(res, 'saving', 'created', 'Ahorro');
                }
            }

            alert('✅ Planificación sincronizada exitosamente en la nube.');
            window.location.reload(); 
        } catch (error) {
            console.error('Error al sincronizar planificación:', error);
            alert(`❌ Error al sincronizar: ${error instanceof Error ? error.message : 'Verifica tu conexión.'}`);
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
        const loadData = async () => {
            if (!user) return; 
            try {
                const [accounts, budgets, transactions, executions] = await Promise.all([
                    AccountsAPI.list(),
                    BudgetsAPI.list(),
                    TransactionsAPI.list(),
                    ExecutionsAPI.list().catch(() => []) // Catch in case of error
                ]);

                // Crear mapa de executions para rapido acceso
                const execsMap = new Map<string, any>();
                if (Array.isArray(executions)) {
                    executions.forEach((e: any) => {
                        if (e && e.itemId) {
                            execsMap.set(e.itemId, e);
                            originalExecutionsRef.current[e.itemId] = e;
                        }
                    });
                }

                if (Array.isArray(accounts)) {
                    const activeAccounts = accounts.filter((a: any) => a && a.isActive !== false);
                    setIncomes(activeAccounts.map((a: any) => ({
                        id: a.id || a._id,
                        name: a.name || 'Ingreso',
                        amount: Number(a.salary || 0) + Number(a.extras || 0),
                        periodicity: dbToUiPeriod(a.salaryType) as any,
                        itemCurrency: (a.currency as 'USD' | 'DOP') || 'DOP',
                        payDay: a.payDay,
                        isExecuted: a.isExecuted,
                        executionDate: execsMap.get(a.id || a._id)?.executionDate,
                        isCustom: true
                    })));
                }

                if (Array.isArray(budgets)) {
                    setFixedExpenses(budgets.filter((b: any) => b).map((b: any) => ({
                        id: b.id || b._id,
                        name: b.name || 'Gasto',
                        amount: Number(b.amount || 0),
                        periodicity: dbToUiPeriod(b.period) as any,
                        itemCurrency: (b.currency as 'USD' | 'DOP') || 'DOP',
                        payDay: b.payDay,
                        isExecuted: b.isExecuted,
                        executionDate: execsMap.get(b.id || b._id)?.executionDate,
                        originalDate: b.startDate,
                        isCustom: true
                    })));
                }

                if (transactions.length > 0) {
                    setVariableExpenses(transactions.filter((t: any) => t && t.type === 'expense').map((t: any) => ({
                        id: t.id || t._id,
                        name: t.description || 'Gasto Variable',
                        amount: Number(t.amount || 0),
                        periodicity: dbToUiPeriod(t.periodicity) as any,
                        itemCurrency: (t.currency as 'USD' | 'DOP') || 'DOP',
                        payDay: t.payDay,
                        isExecuted: t.isExecuted,
                        executionDate: execsMap.get(t.id || t._id)?.executionDate,
                        originalDate: t.date,
                        isCustom: true
                    })));

                    setSavings(transactions.filter((t: any) => t && t.type === 'savings').map((t: any) => ({
                        id: t.id || t._id,
                        name: t.description || 'Ahorro',
                        amount: Number(t.amount || 0),
                        periodicity: dbToUiPeriod(t.periodicity) as any,
                        itemCurrency: (t.currency as 'USD' | 'DOP') || 'DOP',
                        payDay: t.payDay,
                        isExecuted: t.isExecuted,
                        executionDate: execsMap.get(t.id || t._id)?.executionDate,
                        originalDate: t.date,
                        isCustom: true
                    })));
                }

                // Guardar estado inicial de ejecuciones
                const origExecs: Record<string, boolean> = {};
                
                if (Array.isArray(accounts)) accounts.forEach((a: any) => origExecs[a.id || a._id] = !!a.isExecuted);
                if (Array.isArray(budgets)) budgets.forEach((b: any) => origExecs[b.id || b._id] = !!b.isExecuted);
                if (transactions.length > 0) transactions.forEach((t: any) => origExecs[t.id || t._id] = !!t.isExecuted);
                
                originalExecutionsRef.current = origExecs;

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

            for (const a of accounts) {
                const dbId = a.id || (a as any)._id;
                if (dbId && typeof dbId === 'string' && dbId.length > 0) {
                    try { await AccountsAPI.delete(dbId); } catch (e) { console.warn('Error deleting account:', dbId, e); }
                }
            }
            for (const b of budgets) {
                const dbId = b.id || (b as any)._id;
                if (dbId && typeof dbId === 'string' && dbId.length > 0) {
                    try { await BudgetsAPI.delete(dbId); } catch (e) { console.warn('Error deleting budget:', dbId, e); }
                }
            }
            for (const t of transactions) {
                const dbId = t.id || (t as any)._id;
                if (dbId && typeof dbId === 'string' && dbId.length > 0) {
                    try { await TransactionsAPI.delete(dbId); } catch (e) { console.warn('Error deleting transaction:', dbId, e); }
                }
            }

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
                case 'puntual': multiplier = 1; break;
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
                    <div className={styles.titleWithAction}>
                        <h1>Planificador Maestro</h1>
                        <Link to="/" className={styles.backHomeBtn}>
                             🏠 Volver al Inicio
                        </Link>
                    </div>
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

                    <div className={styles.controlGroup}>
                        <button 
                            className={styles.historyBtn}
                            onClick={() => setIsHistoryOpen(true)}
                        >
                            📜 Historial
                        </button>
                    </div>

                    <div className={styles.controlGroup}>
                        <button 
                            className={styles.saveIconButton}
                            onClick={handleSavePlan}
                            disabled={saving}
                            title={saving ? 'Guardando...' : 'Guardar Planificación'}
                        >
                            {saving ? '⏳' : '💾'}
                        </button>
                    </div>
                    
                    <div className={styles.actionsArea}>
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
                                        {/* SAVING IS NOW HANDLED BY THE ICON BUTTON IN THE MAIN BAR */}

                                        <div className={styles.divider}></div>

                                        <Link to="/" className={styles.dropdownItem}>
                                            <span>🏠</span> Inicio
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
                    </div>
                </div>
            </header>

            <section className={styles.legendSection}>
                <div className={styles.legendTitle}>
                    <span>ℹ️</span> Guía de Parámetros
                </div>
                <div className={styles.legendGrid}>
                    <div className={styles.legendItem}>
                        <div className={styles.legendHeader}>
                            <div className={`${styles.icon} ${styles.iconCheck}`}>✓</div>
                            Efectuado (Check)
                        </div>
                        <div className={styles.legendDesc}>
                            Márcalo para atenuar y tachar un registro cuando el pago se haya realizado. Útil para llevar control del mes.
                        </div>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendHeader}>
                            <div className={`${styles.icon} ${styles.iconPeriod}`}>⏱️</div>
                            Periodicidad
                        </div>
                        <div className={styles.legendDesc}>
                            Afecta el cálculo: <strong>Mensual</strong> toma el valor exacto, <strong>Quincenal</strong> lo multiplica ×2, <strong>Anual</strong> lo divide ÷12.
                        </div>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendHeader}>
                            <div className={`${styles.icon} ${styles.iconDay}`}>📅</div>
                            Día (Cobro/Pago)
                        </div>
                        <div className={styles.legendDesc}>
                            Establece el día del mes que esperas recibir el ingreso o realizar el gasto. Sirve como recordatorio para tu flujo de caja.
                        </div>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendHeader}>
                            <div className={`${styles.icon} ${styles.iconCurrency}`}>💱</div>
                            Moneda (USD/DOP)
                        </div>
                        <div className={styles.legendDesc}>
                            Si registras un item en USD y tu resumen es en DOP (RD$), el monto se convertirá automáticamente a DOP en el resumen.
                        </div>
                    </div>
                </div>
            </section>

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
                        setExchangeRate={setExchangeRate}
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

            <HistoryOverlay 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
            />
            <DataExchangeModal 
                isOpen={isDataExchangeOpen} 
                onClose={() => setIsDataExchangeOpen(false)} 
                currentData={{ incomes, fixedExpenses, variableExpenses, savings }}
            />
        </div>
    );
};

export default PlanificadorMaestro;
