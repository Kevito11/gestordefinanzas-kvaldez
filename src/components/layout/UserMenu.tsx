import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { exportData } from '../../features/auth/api/auth';
import ChangePasswordModal from '../../features/auth/components/ChangePasswordModal';
import styles from './Navbar.module.css'; // Reusing navbar styles for consistency

export default function UserMenu() {
    const { user, logout, token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsOpen(false);
    };

    const handleExportData = async () => {
        try {
            if (!token) return;
            const data = await exportData(token);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finanzas-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setIsOpen(false);
        } catch (error) {
            console.error('Export failed', error);
            alert('Error al exportar datos');
        }
    };

    if (!user) return null;

    return (
        <>
            <div className={styles.dropdownContainer} ref={dropdownRef}>
                <button
                    className={styles.dropdownButton}
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        border: '2px solid white',
                        transition: 'transform 0.2s ease',
                        cursor: 'pointer'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                </button>

                {isOpen && (
                    <div className={styles.dropdownMenu}>
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                            <p style={{ fontWeight: 600, color: '#111827' }}>{user.name}</p>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>@{user.username}</p>
                        </div>

                        <button className={styles.item} onClick={handleExportData}>
                            <span className={styles.icon}>📥</span>
                            Exportar Datos
                        </button>

                        <button className={styles.item} onClick={() => { setIsPasswordModalOpen(true); setIsOpen(false); }}>
                            <span className={styles.icon}>🔑</span>
                            Cambiar Contraseña
                        </button>

                        <div style={{ borderTop: '1px solid #f3f4f6', margin: '0.25rem 0' }}></div>

                        <button className={styles.item} onClick={handleLogout} style={{ color: '#ef4444' }}>
                            <span className={styles.icon}>🚪</span>
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </>
    );
}
