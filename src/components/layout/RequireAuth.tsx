import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';

export default function RequireAuth() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
