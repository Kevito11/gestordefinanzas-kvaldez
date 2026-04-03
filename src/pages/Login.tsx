import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { loginWithApi } from '../features/auth/api/auth';
import styles from './Login.module.css';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { user, token, expiresAt } = await loginWithApi({ username, password });
            if (!user) throw new Error('No se recibió información del usuario');
            login(user, token!, expiresAt);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Credenciales inválidas. Por favor intente de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Cuentas Claras</h1>
                <p className={styles.subtitle}>Tu gestor de finanzas personal e inteligente</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="username">Nombre de Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={isLoading}>
                        {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className={styles.footer}>
                    ¿Aún no tienes cuenta?{' '}
                    <Link to="/register" className={styles.link}>
                        Regístrate ahora
                    </Link>
                    
                    <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                        <Link to="/" className={styles.guestLink}>
                           <span>🚀</span> Probar como Invitado (Sin guardar)
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
