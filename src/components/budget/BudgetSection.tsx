import React, { useState, useMemo } from 'react';
import BudgetInput, { type Periodicity } from './BudgetInput';
import styles from './BudgetSection.module.css';
import { nanoid } from 'nanoid';

export interface BudgetItem {
    id: string;
    name: string;
    amount: number;
    periodicity: Periodicity;
    isCustom?: boolean;
    itemCurrency?: 'USD' | 'DOP';
    payDay?: number;
    isExecuted?: boolean;
    executionDate?: string;
}

interface BudgetSectionProps {
    title: string;
    items: BudgetItem[];
    suggestedCategories?: string[];
    currency: 'USD' | 'DOP';
    exchangeRate?: number;
    timeframe?: 'mensual' | 'quincenal' | 'puntual' | 'original';
    onChange: (items: BudgetItem[]) => void;
}

const BudgetSection: React.FC<BudgetSectionProps> = ({
    title,
    items,
    suggestedCategories = [],
    currency,
    exchangeRate = 1,
    timeframe = 'mensual',
    onChange,
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [newCategorySelection, setNewCategorySelection] = useState('');

    const calculateDisplayTotal = (item: BudgetItem) => {
        let baseAmount = item.amount;

        const itemCurr = item.itemCurrency || currency;
        if (itemCurr === 'USD' && currency === 'DOP') {
            baseAmount = baseAmount * exchangeRate;
        } else if (itemCurr === 'DOP' && currency === 'USD') {
            baseAmount = exchangeRate > 0 ? baseAmount / exchangeRate : baseAmount;
        }

        // Si es original o puntual, no aplicamos multiplicadores de periodicidad
        if (timeframe === 'original' || timeframe === 'puntual') return baseAmount;

        switch (item.periodicity) {
            case 'mensual': return baseAmount;
            case 'quincenal': return baseAmount * 2;
            case 'anual': return baseAmount / 12;
            case 'trimestral': return baseAmount / 3;
            case 'semestral': return baseAmount / 6;
            case 'puntual': return baseAmount;
            default: return baseAmount;
        }
    };

    const sectionTotal = useMemo(() => {
        return items.reduce((acc, curr) => {
            return acc + calculateDisplayTotal(curr);
        }, 0);
    }, [items, timeframe, currency, exchangeRate]);

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
            itemCurrency: currency,
            isCustom: true
        };
        onChange([newItem, ...items]); // Add to top
        setShowAddPanel(false);
    };

    const handleAddFromSelection = () => {
        if (!newCategorySelection) return;

        const newItem: BudgetItem = {
            id: nanoid(),
            name: newCategorySelection,
            amount: 0,
            periodicity: 'mensual',
            itemCurrency: currency,
            isCustom: false
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
                                    {suggestedCategories.length > 0 && (
                                        <>
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
                                        </>
                                    )}
                                    <button
                                        className={`${styles.actionBtn} ${styles.customBtn}`}
                                        onClick={handleAddCustom}
                                        style={{ width: suggestedCategories.length === 0 ? '100%' : 'auto' }}
                                    >
                                        Crear Nuevo Concepto
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
                                    itemCurrency={item.itemCurrency || currency}
                                    payDay={item.payDay}
                                    isExecuted={item.isExecuted}
                                    isCustom={item.isCustom}
                                    executionDate={item.executionDate}
                                    onNameChange={item.isCustom ? (val) => handleItemChange(item.id, 'name', val) : undefined}
                                    onAmountChange={(val: number) => handleItemChange(item.id, 'amount', val)}
                                    onPeriodicityChange={(val: Periodicity) => handleItemChange(item.id, 'periodicity', val)}
                                    onItemCurrencyChange={(val: 'USD' | 'DOP') => handleItemChange(item.id, 'itemCurrency', val)}
                                    onPayDayChange={(val: number | undefined) => handleItemChange(item.id, 'payDay', val)}
                                    onIsExecutedChange={(val: boolean) => handleItemChange(item.id, 'isExecuted', val)}
                                    onExecutionDateChange={(val: string) => handleItemChange(item.id, 'executionDate', val)}
                                    onDelete={() => handleDelete(item.id)}
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
