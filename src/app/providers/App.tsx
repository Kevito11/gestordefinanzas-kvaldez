// src/app/App.tsx
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '../routes';
import { AuthProvider } from './AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Cargando...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}
