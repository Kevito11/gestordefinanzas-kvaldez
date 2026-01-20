import React, { useState } from 'react';
import BudgetSection, { type BudgetItem } from '../components/budget/BudgetSection';
import BudgetSummary from '../components/budget/BudgetSummary';
import { calculateSalaryDeductions } from '../utils/taxCalculations';

import { nanoid } from 'nanoid';

// Reference categories
const INCOME_CATEGORIES_LIST = [
    'Sueldo',
    'Pensión',
    'Ingresos financieros',
    'Otros ingresos'
];

const FIXED_EXPENSES_LIST = [
    'Hipoteca / Alquiler',
    'Comunidad',
    'Seguros',
    'Impuestos',
    'Préstamos',
    'Educación'
];

const VARIABLE_EXPENSES_LIST = [
    'Alimentación',
    'Electricidad',
    'Agua',
    'Gas',
    'Teléfono / Internet',
    'Transporte',
    'Salud',
    'Ropa y calzado'
];

const DISCRETIONARY_EXPENSES_LIST = [
    'Ocio',
    'Gimnasio / Deportes',
    'Vacaciones',
    'Regalos',
    'Otros gastos'
];

// Helper to create initial state from a list of strings
const createInitialItems = (categories: string[]): BudgetItem[] => {
    return categories.map(cat => ({
        id: nanoid(),
        name: cat,
        amount: 0,
        periodicity: 'mensual',
        isCustom: false
    }));
};


const BudgetCalculator: React.FC = () => {
    const [incomes, setIncomes] = useState<BudgetItem[]>(createInitialItems(INCOME_CATEGORIES_LIST));
    const [fixedExpenses, setFixedExpenses] = useState<BudgetItem[]>(createInitialItems(FIXED_EXPENSES_LIST));
    const [variableExpenses, setVariableExpenses] = useState<BudgetItem[]>(createInitialItems(VARIABLE_EXPENSES_LIST));
    const [discretionaryExpenses, setDiscretionaryExpenses] = useState<BudgetItem[]>(createInitialItems(DISCRETIONARY_EXPENSES_LIST));
    const [currency, setCurrency] = useState<'USD' | 'DOP'>('DOP');

    const calculateMonthlyTotal = (items: BudgetItem[]) => {
        return items.reduce((acc, curr) => {
            let baseAmount = curr.amount;

            // NEW: Use Net Salary for global calculation if deductions are enabled
            if (curr.showDeductions) {
                const { netSalary } = calculateSalaryDeductions(curr.amount, curr.periodicity);
                baseAmount = netSalary;
            }

            let multiplier = 1;
            switch (curr.periodicity) {
                case 'mensual': multiplier = 1; break;
                case 'anual': multiplier = 1 / 12; break;
                case 'trimestral': multiplier = 1 / 3; break;
                case 'semestral': multiplier = 1 / 6; break;
                case 'puntual': multiplier = 1 / 12; break;
            }
            return acc + (baseAmount * multiplier);
        }, 0);
    };

    const calculateMonthlyDeductions = (items: BudgetItem[]) => {
        return items.reduce((acc, curr) => {
            if (!curr.showDeductions) return acc;

            const { totalDeductions } = calculateSalaryDeductions(curr.amount, curr.periodicity);

            let multiplier = 1;
            switch (curr.periodicity) {
                case 'mensual': multiplier = 1; break;
                case 'anual': multiplier = 1 / 12; break;
                case 'trimestral': multiplier = 1 / 3; break;
                case 'semestral': multiplier = 1 / 6; break;
                case 'puntual': multiplier = 1 / 12; break;
            }
            return acc + (totalDeductions * multiplier);
        }, 0);
    };

    const totalIncome = calculateMonthlyTotal(incomes);
    const totalDeductions = calculateMonthlyDeductions(incomes); // Calculate total deductions
    const totalFixed = calculateMonthlyTotal(fixedExpenses);
    const totalVariable = calculateMonthlyTotal(variableExpenses);
    const totalDiscretionary = calculateMonthlyTotal(discretionaryExpenses);

    const totalExpenses = totalFixed + totalVariable + totalDiscretionary;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{
                marginBottom: '40px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                position: 'relative'
            }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Mi Presupuesto</h1>
                    <p style={{ color: '#7f8c8d', margin: 0 }}>
                        Calcula tu presupuesto mensual. Despliega las secciones para agregar o editar tus ingresos y gastos.
                    </p>
                </div>

                <div style={{
                    background: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    alignSelf: 'flex-start' // On mobile, this might stack naturally
                }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#555' }}>Moneda:</label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'USD' | 'DOP')}
                        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="DOP">RD$ (Peso)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </div>
            </header>

            <div className="budget-grid-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(280px, 1fr)', gap: '30px', alignItems: 'start' }}>
                <div className="budget-forms">
                    <BudgetSection
                        title="Ingresos"
                        items={incomes}
                        suggestedCategories={INCOME_CATEGORIES_LIST}
                        currency={currency}
                        allowDeductions={true} // Only allow deductions for Incomes
                        onChange={setIncomes}
                    />

                    <BudgetSection
                        title="Gastos Fijos Obligatorios"
                        items={fixedExpenses}
                        suggestedCategories={FIXED_EXPENSES_LIST}
                        currency={currency}
                        allowDeductions={false}
                        onChange={setFixedExpenses}
                    />

                    <BudgetSection
                        title="Gastos Variables Necesarios"
                        items={variableExpenses}
                        suggestedCategories={VARIABLE_EXPENSES_LIST}
                        currency={currency}
                        allowDeductions={false}
                        onChange={setVariableExpenses}
                    />

                    <BudgetSection
                        title="Gastos Discrecionales"
                        items={discretionaryExpenses}
                        suggestedCategories={DISCRETIONARY_EXPENSES_LIST}
                        currency={currency}
                        onChange={setDiscretionaryExpenses}
                    />
                </div>

                <div className="budget-summary-container" style={{ position: 'sticky', top: '20px' }}>
                    <BudgetSummary
                        totalIncome={totalIncome}
                        totalExpenses={totalExpenses}
                        totalDeductions={totalDeductions}
                        currency={currency}
                    />

                    <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Desglose de Gastos</h4>
                        <div style={{ fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Fijos:</span>
                                <span>{totalExpenses > 0 ? ((totalFixed / totalExpenses) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Variables:</span>
                                <span>{totalExpenses > 0 ? ((totalVariable / totalExpenses) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Discrecionales:</span>
                                <span>{totalExpenses > 0 ? ((totalDiscretionary / totalExpenses) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Responsive adjustments */}
            <style>{`
        @media (max-width: 850px) {
           .budget-grid-container {
             grid-template-columns: 1fr !important;
           }
           .budget-summary-container {
             position: static !important;
             order: -1; /* Show summary at top on mobile? Or bottom? Let's keep it bottom for now or standard flow */
             order: 2; /* Move to bottom */
           }
           header {
             flex-direction: column-reverse;
             text-align: center;
           }
           header > div {
             width: 100%;
             justify-content: center;
           }
           header > div:first-child {
             margin-top: 15px;
           }
        }
      `}</style>
        </div>
    );
};

export default BudgetCalculator;
