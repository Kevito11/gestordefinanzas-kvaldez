import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { registerWithApi } from '../features/auth/api/auth';
import styles from './Login.module.css';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const { user, token, expiresAt } = await registerWithApi({ username, password, name });
            if (!user) throw new Error('No se recibió información del usuario');
            login(user, token!, expiresAt);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Error al crear la cuenta. Intente con otro usuario.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Crea tu Cuenta</h1>
                <p className={styles.subtitle}>Comienza a tomar el control de tu dinero</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="name">Nombre Completo</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Kevin Valdez"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="username">Nombre de Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="usuario123"
                            required
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
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={isLoading}>
                        {isLoading ? 'Creando cuenta...' : 'Registrarme'}
                    </button>
                </form>

                <div className={styles.footer}>
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className={styles.link}>
                        Inicia Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
