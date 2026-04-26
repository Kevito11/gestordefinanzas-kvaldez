import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutionsAPI, type ExecutionLog } from '../../features/executions/executions.api';
import { Link } from 'react-router-dom';
import styles from './HistoryOverlay.module.css';

interface HistoryOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const HistoryOverlay: React.FC<HistoryOverlayProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
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
    }, [isOpen]);

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

    const sortedLogs = [...logs].sort((a, b) => new Date(b.executionDate).getTime() - new Date(a.executionDate).getTime()).slice(0, 10);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay} onClick={onClose}>
                    <motion.div 
                        className={styles.modal} 
                        onClick={e => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <div className={styles.header}>
                            <h3>Recientes del Historial</h3>
                            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                        </div>

                        <div className={styles.content}>
                            {loading ? (
                                <div className={styles.loading}>Cargando...</div>
                            ) : sortedLogs.length === 0 ? (
                                <div className={styles.empty}>No hay registros recientes.</div>
                            ) : (
                                <div className={styles.list}>
                                    {sortedLogs.map(log => (
                                        <div key={log.id || log._id} className={styles.listItem}>
                                            <div className={styles.left}>
                                                <span className={styles.date}>
                                                    {new Date(log.executionDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                </span>
                                                <span className={styles.actionText}>
                                                    {log.action === 'created' ? 'Agregado' : log.action === 'deleted' ? 'Eliminado' : 'Efectuado'}
                                                </span>
                                                <span className={styles.name}>{log.itemName}</span>
                                            </div>
                                            <div className={styles.right} style={{ color: getTypeColor(log.itemType) }}>
                                                {log.itemType === 'income' ? '+' : '-'} {log.currency} {log.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.footer}>
                            <Link to="/historial" className={styles.fullHistoryBtn} onClick={onClose}>
                                Ver historial completo ↗
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default HistoryOverlay;
