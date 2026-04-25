import { useState, useEffect } from 'react';
import { useAuth } from '../app/providers/AuthProvider';
import { ExecutionsAPI, type ExecutionLog } from '../features/executions/executions.api';
import styles from './Historial.module.css';

export default function Historial() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchLogs = async () => {
            try {
                const data = await ExecutionsAPI.list();
                setLogs(data);
            } catch (e) {
                console.error("Error loading executions", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user]);

    const handleSaveDate = async (logId: string) => {
        try {
            await ExecutionsAPI.update(logId, { executionDate: new Date(editDate).toISOString() });
            setLogs(logs.map(l => (l.id || l._id) === logId ? { ...l, executionDate: new Date(editDate).toISOString() } : l));
            setEditingLogId(null);
        } catch (e) {
            console.error("Error updating date", e);
            alert("No se pudo actualizar la fecha.");
        }
    };

    const handleDelete = async (logId: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este registro histórico? (Nota: esto no afectará el Planificador Maestro, solo el historial)")) return;
        try {
            await ExecutionsAPI.delete(logId);
            setLogs(logs.filter(l => (l.id || l._id) !== logId));
        } catch (e) {
            console.error("Error deleting log", e);
            alert("No se pudo eliminar el registro.");
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando historial...</div>;

    const sortedLogs = [...logs].sort((a, b) => new Date(b.executionDate).getTime() - new Date(a.executionDate).getTime());

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'income': return '#4caf50';
            case 'saving': return '#2196f3';
            default: return '#f44336';
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'income': return 'Ingreso';
            case 'saving': return 'Ahorro';
            case 'fixed_expense': return 'Gasto Fijo';
            case 'variable_expense': return 'Gasto Variable';
            default: return type;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Historial de Ejecuciones</h1>
                    <p>Registro histórico de los conceptos marcados como "Efectuado", ordenados por más recientes.</p>
                </div>
            </header>

            {sortedLogs.length === 0 ? (
                <div className={styles.emptyState}>
                    No hay ejecuciones registradas. Marca algunos conceptos como efectuados en el Planificador Maestro.
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha Exacta</th>
                                <th>Descripción</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLogs.map(log => {
                                const logId = log.id || log._id || '';
                                const isEditing = editingLogId === logId;

                                return (
                                    <tr key={logId}>
                                        <td>
                                            {isEditing ? (
                                                <div className={styles.editDateGroup}>
                                                    <input 
                                                        type="date" 
                                                        value={editDate}
                                                        onChange={(e) => setEditDate(e.target.value)}
                                                        className={styles.dateInput}
                                                    />
                                                    <button className={styles.saveBtn} onClick={() => handleSaveDate(logId)}>OK</button>
                                                    <button className={styles.cancelBtn} onClick={() => setEditingLogId(null)}>X</button>
                                                </div>
                                            ) : (
                                                <span 
                                                    className={styles.dateText} 
                                                    onClick={() => {
                                                        setEditDate(log.executionDate.split('T')[0]);
                                                        setEditingLogId(logId);
                                                    }}
                                                    title="Clic para cambiar la fecha"
                                                >
                                                    {new Date(log.executionDate).toLocaleDateString('es-ES')}
                                                </span>
                                            )}
                                        </td>
                                        <td><strong>{log.itemName}</strong></td>
                                        <td>
                                            <span className={styles.badge} style={{ backgroundColor: getTypeColor(log.itemType) }}>
                                                {getTypeName(log.itemType)}
                                            </span>
                                        </td>
                                        <td style={{ color: getTypeColor(log.itemType), fontWeight: 'bold' }}>
                                            {log.currency} {log.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <button className={styles.deleteBtn} onClick={() => handleDelete(logId)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
