import React, { useMemo } from 'react';
import styles from './BudgetInput.module.css';
import { calculateSalaryDeductions } from '../../utils/taxCalculations';

export type Periodicity = 'mensual' | 'quincenal' | 'anual' | 'trimestral' | 'semestral' | 'puntual';

interface BudgetInputProps {
    label: string;
    amount: number;
    periodicity: Periodicity;
    isCustom?: boolean;
    currency?: 'USD' | 'DOP'; // Optional, helpful for display
    showDeductions?: boolean; // New prop
    onNameChange?: (name: string) => void;
    onAmountChange: (amount: number) => void;
    onPeriodicityChange: (periodicity: Periodicity) => void;
    onDelete?: () => void;
    onToggleDeductions?: () => void; // New prop handler
}

const BudgetInput: React.FC<BudgetInputProps> = ({
    label,
    amount,
    periodicity,
    isCustom = false,
    currency = 'DOP',
    showDeductions = false,
    onNameChange,
    onAmountChange,
    onPeriodicityChange,
    onDelete,
    onToggleDeductions,
}) => {

    const calculations = useMemo(() => {
        if (!showDeductions) return null;
        return calculateSalaryDeductions(amount, periodicity);
    }, [amount, periodicity, showDeductions]);



    // We do NOT change the parent state amount, we just display the breakdown.
    // Wait, if deductions are ON, should the Budget Calculator use the Gross or Net?
    // Usually for a budget you want to know what you HAVE (Net).
    // But updating the 'amount' prop would change the Input field value.
    // We want the Input to stay as Gross, but the "Output" to the calculator to be Net?
    // Complex.
    // Simpler: Just show the deductions. The user can manually change the amount to Net if they want?
    // NO, user said "Quiero que lo calcules... opcional de quitar".
    // This implies the tool handles the math.
    // Visuals: Input shows Gross. "Neto a Recibir: X".
    // The 'BudgetSection' sums 'amount'. If we want the Section Total to be accurate (Net), 
    // we might need to update the item's amount to Net?
    // Or tell the user "This is your breakdown".

    // Let's just show the breakdown for now. 
    // Refinement: If enabled, maybe we show "Neto: 19,xxx" nicely highlighted.

    const format = (val: number) => val.toLocaleString(currency === 'USD' ? 'en-US' : 'es-DO', { style: 'currency', currency });

    return (
        <div className={styles.wrapper}>
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
                            {onToggleDeductions && (
                                <button
                                    onClick={onToggleDeductions}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: showDeductions ? '#2ecc71' : '#3498db',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        textAlign: 'left',
                                        padding: 0,
                                        marginTop: '4px',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {showDeductions ? '✓ Con Descuentos de Ley' : '+ Aplicar Descuentos de Ley'}
                                </button>
                            )}
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

            {showDeductions && calculations && (
                <div className={styles.deductionsStats} style={{
                    background: '#f8fafc',
                    padding: '10px 16px',
                    borderRadius: '0 0 8px 8px',
                    marginTop: '-1px',
                    border: '1px solid #e2e8f0',
                    borderTop: 'none',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', color: '#64748b' }}>
                        <div>
                            <strong>AFP (2.87%):</strong> <br />
                            <span style={{ color: '#e74c3c' }}>- {format(calculations.afp)}</span>
                        </div>
                        <div>
                            <strong>SFS (3.04%):</strong> <br />
                            <span style={{ color: '#e74c3c' }}>- {format(calculations.sfs)}</span>
                        </div>
                        <div>
                            <strong>ISR (Tabla):</strong> <br />
                            <span style={{ color: '#e74c3c' }}>- {format(calculations.isr)}</span>
                        </div>
                        <div style={{ textAlign: 'right', borderLeft: '1px solid #ddd', paddingLeft: '10px' }}>
                            <strong style={{ color: '#2c3e50' }}>NETO A RECIBIR:</strong> <br />
                            <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1rem' }}>{format(calculations.netSalary)}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        *Cálculo estimativo según escala anual DGII 2025 y tasas TSS vigentes (2025).
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetInput;
