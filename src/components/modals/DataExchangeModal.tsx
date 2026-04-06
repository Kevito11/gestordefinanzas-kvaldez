import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { type BudgetItem } from '../budget/BudgetSection';
import styles from './DataExchangeModal.module.css';
import { downloadFileData, parseFileData, type ExportFormat, type DataType } from '../../utils/fileData';
import { TransactionsAPI } from '../../features/transactions/Transactions.api';
import { BudgetsAPI } from '../../features/budgets/budgets.api';
import { AccountsAPI } from '../../features/accounts/accounts.api';

interface DataExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentData?: {
        incomes: BudgetItem[];
        fixedExpenses: BudgetItem[];
        variableExpenses: BudgetItem[];
        savings: BudgetItem[];
    };
}

type ModalDataType = DataType | 'all';

export default function DataExchangeModal({ isOpen, onClose, currentData }: DataExchangeModalProps) {
    const selectedType: ModalDataType = 'all'; // Fixed to all
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('.xlsx');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportData = async () => {
        try {
            setLoading(true);
            
            let accounts, budgets, transactions;
            
            if (currentData) {
                // Usar datos en pantalla (lo que el usuario introdujo actualmente)
                accounts = currentData.incomes.map(i => ({
                    name: i.name || 'Ingreso',
                    currency: i.itemCurrency || 'DOP',
                    salaryType: i.periodicity === 'anual' ? 'yearly' : 'monthly',
                    salary: Number(i.amount || 0),
                    extras: 0
                }));

                budgets = currentData.fixedExpenses.map(e => ({
                    name: e.name || 'Gasto',
                    amount: Number(e.amount || 0),
                    currency: e.itemCurrency || 'DOP',
                    period: e.periodicity === 'anual' ? 'yearly' : 'monthly',
                    payDay: e.payDay
                }));

                transactions = [
                    ...currentData.variableExpenses.map(v => ({
                        description: v.name || 'Gasto Variable',
                        amount: Number(v.amount || 0),
                        currency: v.itemCurrency || 'DOP',
                        type: 'expense',
                        date: new Date().toISOString().split('T')[0],
                        payDay: v.payDay
                    })),
                    ...currentData.savings.map(s => ({
                        description: s.name || 'Ahorro',
                        amount: Number(s.amount || 0),
                        currency: s.itemCurrency || 'DOP',
                        type: 'savings',
                        date: new Date().toISOString().split('T')[0],
                        payDay: s.payDay
                    }))
                ];
            } else {
                // Caída si no hay datos en pantalla: Cargar datos reales de los módulos
                const [dbAccounts, dbBudgets, dbTransactions] = await Promise.all([
                    AccountsAPI.list(),
                    BudgetsAPI.list(),
                    TransactionsAPI.list()
                ]);
                accounts = dbAccounts;
                budgets = dbBudgets;
                transactions = dbTransactions;
            }

            const payload = {
                accounts,
                budgets,
                transactions
            };

            downloadFileData(selectedType, payload, selectedFormat);
            alert('Datos exportados exitosamente como respaldo.');
        } catch (error) {
            console.error('Error al exportar datos:', error);
            alert('Error al exportar los datos. Revisa la consola para más detalles.');
        } finally {
            setLoading(false);
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm(`🚨 ADVERTENCIA: ¿Estás seguro de que deseas subir el archivo "${file.name}"?\n\nEsta acción ELIMINARÁ todos los datos actuales y los REEMPLAZARÁ unicamente con la información de este archivo.`)) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setLoading(true);
            const payload = await parseFileData(file);

            // Borrado total previo a la importación (Secuencialmente para evitar 403)
            const [oldAccounts, oldBudgets, oldTransactions] = await Promise.all([
                AccountsAPI.list(),
                BudgetsAPI.list(),
                TransactionsAPI.list()
            ]);

            for (const a of oldAccounts) {
                const dbId = a.id || (a as any)._id;
                if (dbId && typeof dbId === 'string' && dbId.length > 0) {
                    try { await AccountsAPI.delete(dbId); } catch (e) { console.warn('Error deleting account:', dbId, e); }
                }
            }
            for (const b of oldBudgets) {
                const dbId = b.id || (b as any)._id;
                if (dbId && typeof dbId === 'string' && dbId.length > 0) {
                    try { await BudgetsAPI.delete(dbId); } catch (e) { console.warn('Error deleting budget:', dbId, e); }
                }
            }
            for (const t of oldTransactions) {
                const dbId = t.id || (t as any)._id;
                if (dbId && typeof dbId === 'string' && dbId.length > 0) {
                    try { await TransactionsAPI.delete(dbId); } catch (e) { console.warn('Error deleting transaction:', dbId, e); }
                }
            }
            
            let importCount = 0;

            if (payload.accounts.length > 0) {
                for (const item of payload.accounts) {
                    await AccountsAPI.create({
                        ...item,
                        currency: item.currency || 'DOP',
                        salaryType: item.salaryType || 'monthly',
                        salary: Number(item.salary || 0)
                    });
                    importCount++;
                }
            }

            // Aseguro que exista al menos una cuenta para vincular gastos
            let currentAccounts = await AccountsAPI.list();
            if (currentAccounts.length === 0) {
                await AccountsAPI.create({
                    name: 'Cuenta Principal',
                    currency: 'DOP',
                    salary: 0,
                    salaryType: 'monthly'
                });
                currentAccounts = await AccountsAPI.list();
            }

            const defaultAccountId = currentAccounts.length > 0 
                ? (currentAccounts[0].id || (currentAccounts[0] as any)._id) 
                : undefined;

            if (payload.transactions.length > 0) {
                for (const item of payload.transactions) {
                    // SI tiene periodicidad o payDay, es un presupuesto mal etiquetado
                    if (item.period || item.periodicity || item.payDay) {
                        await BudgetsAPI.create({
                            name: item.name || item.description || 'Gasto Fijo Importado',
                            amount: Number(item.amount || 0),
                            currency: item.currency || item.itemCurrency || 'DOP',
                            category: item.category || 'Fijo',
                            period: item.period || item.periodicity || 'monthly',
                            startDate: item.startDate || new Date().toISOString().split('T')[0]
                        });
                    } else {
                        await TransactionsAPI.create({
                            ...item,
                            accountId: item.accountId || defaultAccountId,
                            type: item.type || 'expense',
                            amount: Number(item.amount || 0),
                            currency: item.currency || 'DOP',
                            category: item.category || 'General',
                            date: item.date || new Date().toISOString()
                        });
                    }
                    importCount++;
                }
            }
            if (payload.budgets.length > 0) {
                for (const item of payload.budgets) {
                    await BudgetsAPI.create({
                        ...item,
                        category: item.category || 'Imported',
                        startDate: item.startDate || new Date().toISOString(),
                        amount: Number(item.amount || 0)
                    });
                    importCount++;
                }
            }

            if (importCount === 0) {
                alert('El archivo está vacío o las columnas no coinciden con ningún módulo.');
                return;
            }

            alert(`Se importaron ${importCount} registros de manera exitosa.`);
            onClose(); // cerramos el modal al acabar
            window.location.reload(); // recargamos para reflejar cambios

        } catch (error: any) {
            console.error('Error durante la importación:', error);
            alert(`Hubo un error al procesar o guardar los datos: ${error?.message || 'Revisa tu conexión o el formato del archivo.'}`);
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar / Exportar Datos">
            <div className={styles.container}>
                <div className={styles.selectorSection} style={{ marginTop: '10px' }}>
                    <label>Formato de Plantilla Maestra</label>
                    <select 
                        value={selectedFormat} 
                        onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                        className={styles.select}
                        disabled={loading}
                    >
                        <option value=".xlsx">Excel (.xlsx)</option>
                        <option value=".txt">Texto (.txt)</option>
                        <option value=".csv">CSV (.csv)</option>
                    </select>
                    <p className={styles.description}>La plantilla generada tendrá una estructura maestra. Si subes archivo de vuelta, el sistema detecta de dónde vino.</p>
                </div>

                <div className={styles.actionsGrid}>
                    <button 
                        className={styles.btnExport} 
                        onClick={handleExportData}
                        disabled={loading}
                    >
                        <span className={styles.icon}>📥</span>
                        <span>{loading ? 'Procesando...' : 'Descargar Backup'}</span>
                    </button>

                    <button 
                        className={styles.btnImport}
                        onClick={handleImportClick}
                        disabled={loading}
                    >
                        <span className={styles.icon}>📤</span>
                        <span>{loading ? 'Procesando...' : 'Subir Datos'}</span>
                    </button>
                    <input 
                        type="file" 
                        accept=".csv,.txt,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
                        ref={fileInputRef} 
                        className={styles.fileInput} 
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        </Modal>
    );
}
