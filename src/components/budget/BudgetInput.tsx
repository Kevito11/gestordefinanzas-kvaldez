import React from 'react';
import styles from './BudgetInput.module.css';

export type Periodicity = 'mensual' | 'quincenal' | 'anual' | 'trimestral' | 'semestral' | 'puntual';

interface BudgetInputProps {
    label: string;
    amount: number;
    periodicity: Periodicity;
    itemCurrency: 'USD' | 'DOP';
    payDay?: number;
    isCustom?: boolean;
    onNameChange?: (name: string) => void;
    onAmountChange: (amount: number) => void;
    onPeriodicityChange: (periodicity: Periodicity) => void;
    onItemCurrencyChange: (currency: 'USD' | 'DOP') => void;
    onPayDayChange: (day: number | undefined) => void;
    onDelete?: () => void;
}

const BudgetInput: React.FC<BudgetInputProps> = ({
    label,
    amount,
    periodicity,
    itemCurrency,
    payDay,
    isCustom = false,
    onNameChange,
    onAmountChange,
    onPeriodicityChange,
    onItemCurrencyChange,
    onPayDayChange,
    onDelete,
}) => {
    const today = new Date().getDate();
    
    let dueClass = '';
    if (payDay) {
        if (payDay === today) {
            dueClass = styles.dueToday;
        } else if (payDay > today && payDay <= today + 3) {
            dueClass = styles.dueSoon;
        } else if (today > 25 && payDay <= (today + 3) % 31) {
            // Case for end of month/beginning of next month
            dueClass = styles.dueSoon;
        }
    }

    return (
        <div className={`${styles.wrapper} ${dueClass}`}>
            <div className={styles.container}>
                <div className={styles.labelContainer}>
                    {isCustom && onNameChange ? (
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => onNameChange(e.target.value)}
                            className={styles.nameInput}
                            placeholder="Nombre del concepto"
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className={styles.label}>{label}</label>
                        </div>
                    )}
                </div>
                <div className={styles.inputs}>
                    <input
                        type="number"
                        value={amount === 0 ? '' : amount}
                        onChange={(e) => onAmountChange(Number(e.target.value))}
                        placeholder="0.00"
                        className={styles.amountInput}
                    />
                    <select
                        value={periodicity}
                        onChange={(e) => onPeriodicityChange(e.target.value as Periodicity)}
                        className={styles.selectInput}
                    >
                        <option value="mensual">Mensual</option>
                        <option value="quincenal">Quincenal</option>
                        <option value="anual">Anual</option>
                        <option value="trimestral">Trimestral</option>
                        <option value="semestral">Semestral</option>
                        <option value="puntual">Puntual</option>
                    </select>
                    <select
                        value={itemCurrency}
                        onChange={(e) => onItemCurrencyChange(e.target.value as 'USD' | 'DOP')}
                        className={styles.selectInput}
                        style={{ marginLeft: '4px', width: 'auto', minWidth: '70px' }}
                    >
                        <option value="DOP">DOP</option>
                        <option value="USD">USD</option>
                    </select>
                    <div className={styles.payDayContainer} title="Día de pago / vencimiento">
                        <span className={styles.payDayIcon}>📅</span>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            value={payDay || ''}
                            onChange={(e) => {
                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                onPayDayChange(val);
                            }}
                            placeholder="Día"
                            className={styles.payDayInput}
                        />
                    </div>
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className={styles.deleteButton}
                            title="Eliminar"
                            aria-label="Eliminar"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BudgetInput;
