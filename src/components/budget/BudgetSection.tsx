import React, { useState, useMemo } from 'react';
import BudgetInput, { type Periodicity } from './BudgetInput';
import styles from './BudgetSection.module.css';
import { nanoid } from 'nanoid';
import { calculateSalaryDeductions } from '../../utils/taxCalculations';

export interface BudgetItem {
    id: string;
    name: string;
    amount: number;
    periodicity: Periodicity;
    isCustom?: boolean;
    showDeductions?: boolean;
}

interface BudgetSectionProps {
    title: string;
    items: BudgetItem[];
    suggestedCategories: string[];
    currency: 'USD' | 'DOP';
    allowDeductions?: boolean; // New prop
    onChange: (items: BudgetItem[]) => void;
}

const BudgetSection: React.FC<BudgetSectionProps> = ({
    title,
    items,
    suggestedCategories,
    currency,
    allowDeductions = false, // Default false
    onChange,
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [newCategorySelection, setNewCategorySelection] = useState('');

    const calculateMonthlyTotal = (item: BudgetItem) => {
        let baseAmount = item.amount;

        // If tax deductions are enabled, use the NET salary for the budget total
        if (item.showDeductions) {
            const { netSalary } = calculateSalaryDeductions(item.amount, item.periodicity);
            baseAmount = netSalary;
        }

        switch (item.periodicity) {
            case 'mensual': return baseAmount;
            case 'quincenal': return baseAmount * 2;
            case 'anual': return baseAmount / 12;
            case 'trimestral': return baseAmount / 3;
            case 'semestral': return baseAmount / 6;
            case 'puntual': return baseAmount / 12;
            default: return baseAmount;
        }
    };

    const sectionTotal = useMemo(() => {
        return items.reduce((acc, curr) => {
            // Pass the whole item now
            return acc + calculateMonthlyTotal(curr);
        }, 0);
    }, [items]);

    const formatCurrency = (amount: number) => {
        const locale = currency === 'USD' ? 'en-US' : 'es-DO';
        return amount.toLocaleString(locale, { style: 'currency', currency: currency });
    };

    const handleItemChange = (id: string, field: keyof BudgetItem, value: any) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        onChange(newItems);
    };

    const handleDelete = (id: string) => {
        onChange(items.filter(item => item.id !== id));
    };

    const handleAddCustom = () => {
        const newItem: BudgetItem = {
            id: nanoid(),
            name: '',
            amount: 0,
            periodicity: 'mensual',
            isCustom: true
        };
        onChange([newItem, ...items]); // Add to top
        setShowAddPanel(false);
    };

    const handleAddFromSelection = () => {
        if (!newCategorySelection) return;

        const isSalary = newCategorySelection.toLowerCase().includes('sueldo') ||
            newCategorySelection.toLowerCase().includes('salario') ||
            newCategorySelection.toLowerCase().includes('nómina');

        const newItem: BudgetItem = {
            id: nanoid(),
            name: newCategorySelection,
            amount: 0,
            periodicity: 'mensual',
            isCustom: false,
            // Only auto-enable if allowed AND it looks like salary
            showDeductions: allowDeductions && isSalary
        };
        onChange([newItem, ...items]); // Add to top
        setNewCategorySelection('');
        setShowAddPanel(false);
    };

    const toggleAddPanel = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent toggling section
        if (!isOpen) setIsOpen(true);
        setShowAddPanel(!showAddPanel);
    };

    return (
        <div className={`${styles.section} ${isOpen ? styles.isOpen : ''}`}>
            <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.titleContainer}>
                    <span className={styles.toggleIcon}>▼</span>
                    <h3 className={styles.title}>{title}</h3>
                </div>

                <div className={styles.headerRight}>
                    <button
                        className={`${styles.addHeaderBtn} ${showAddPanel ? styles.adding : ''}`}
                        onClick={toggleAddPanel}
                        title={showAddPanel ? "Cerrar" : "Agregar nuevo concepto"}
                    >
                        +
                    </button>
                    <div className={styles.total}>
                        {formatCurrency(sectionTotal)}
                    </div>
                </div>
            </div>

            <div className={`${styles.contentWrapper} ${isOpen ? styles.open : ''}`}>
                <div className={styles.contentInner}>
                    <div className={styles.content}>

                        {showAddPanel && (
                            <div className={styles.addPanel} onClick={(e) => e.stopPropagation()}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Agregar nuevo concepto</h4>
                                <div className={styles.addControls}>
                                    <select
                                        className={styles.selectCategory}
                                        value={newCategorySelection}
                                        onChange={(e) => setNewCategorySelection(e.target.value)}
                                    >
                                        <option value="">-- Seleccionar de la lista --</option>
                                        {suggestedCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <button
                                        className={`${styles.actionBtn} ${styles.confirmBtn}`}
                                        onClick={handleAddFromSelection}
                                        disabled={!newCategorySelection}
                                    >
                                        Agregar
                                    </button>
                                    <span style={{ color: '#ccc' }}>|</span>
                                    <button
                                        className={`${styles.actionBtn} ${styles.customBtn}`}
                                        onClick={handleAddCustom}
                                    >
                                        Crear Personalizado
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            {items.map((item) => (
                                <BudgetInput
                                    key={item.id}
                                    label={item.name}
                                    amount={item.amount}
                                    periodicity={item.periodicity}
                                    isCustom={item.isCustom}
                                    currency={currency}
                                    showDeductions={item.showDeductions}
                                    onNameChange={item.isCustom ? (val) => handleItemChange(item.id, 'name', val) : undefined}
                                    onAmountChange={(val) => handleItemChange(item.id, 'amount', val)}
                                    onPeriodicityChange={(val) => handleItemChange(item.id, 'periodicity', val)}
                                    onDelete={() => handleDelete(item.id)}
                                    // Only pass the toggler if allowed
                                    onToggleDeductions={allowDeductions ? () => handleItemChange(item.id, 'showDeductions', !item.showDeductions) : undefined}
                                />
                            ))}
                            {items.length === 0 && !showAddPanel && (
                                <div className={styles.emptyState}>
                                    No hay elementos. Pulsa "+" para agregar.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetSection;
