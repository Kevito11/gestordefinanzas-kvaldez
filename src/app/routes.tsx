import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import PlanificadorMaestro from '../pages/PlanificadorMaestro';
import Historial from '../pages/Historial';
import ProtectedRoute from './providers/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import AnimatedLayout from '../components/layout/AnimatedLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AnimatedLayout><Dashboard /></AnimatedLayout>,
  },
  {
    path: '/plan-maestro',
    element: <AnimatedLayout><PlanificadorMaestro /></AnimatedLayout>,
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <AnimatedLayout><Dashboard /></AnimatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/historial',
    element: (
      <ProtectedRoute>
        <AnimatedLayout><Historial /></AnimatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <AnimatedLayout><Login /></AnimatedLayout>,
  },
  {
    path: '/register',
    element: <AnimatedLayout><Register /></AnimatedLayout>,
  },
]);
