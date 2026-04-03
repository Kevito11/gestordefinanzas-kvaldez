import React, { useState, useRef } from 'react';
import Modal from './Modal';
import styles from './DataExchangeModal.module.css';
import { downloadFileData, parseFileData, type ExportFormat, type DataType } from '../../utils/fileData';
import { TransactionsAPI } from '../../features/transactions/Transactions.api';
import { BudgetsAPI } from '../../features/budgets/budgets.api';
import { AccountsAPI } from '../../features/accounts/accounts.api';

interface DataExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalDataType = DataType | 'all';

export default function DataExchangeModal({ isOpen, onClose }: DataExchangeModalProps) {
    const selectedType: ModalDataType = 'all'; // Fixed to all
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('.xlsx');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportData = async () => {
        try {
            setLoading(true);
            
            // Cargar datos reales de los módulos
            const [accounts, budgets, transactions] = await Promise.all([
                AccountsAPI.list(),
                BudgetsAPI.list(),
                TransactionsAPI.list()
            ]);

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

            // Borrado total previo a la importación
            const [oldAccounts, oldBudgets, oldTransactions] = await Promise.all([
                AccountsAPI.list(),
                BudgetsAPI.list(),
                TransactionsAPI.list()
            ]);

            const deletePromises: Promise<any>[] = [];
            oldAccounts.forEach(a => deletePromises.push(AccountsAPI.delete(a.id)));
            oldBudgets.forEach(b => deletePromises.push(BudgetsAPI.delete(b.id)));
            oldTransactions.forEach(t => deletePromises.push(TransactionsAPI.delete(t.id)));

            await Promise.all(deletePromises);

            
            let importCount = 0;

            if (payload.transactions.length > 0) {
                await Promise.all(payload.transactions.map(item => TransactionsAPI.create(item)));
                importCount += payload.transactions.length;
            }
            if (payload.accounts.length > 0) {
                await Promise.all(payload.accounts.map(item => AccountsAPI.create(item)));
                importCount += payload.accounts.length;
            }
            if (payload.budgets.length > 0) {
                await Promise.all(payload.budgets.map(item => BudgetsAPI.create({
                    ...item,
                    amount: Number(item.amount || 0)
                })));
                importCount += payload.budgets.length;
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
