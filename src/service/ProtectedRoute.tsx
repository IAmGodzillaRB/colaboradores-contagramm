import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // ⚡ Usa useAuth en lugar de useContext(AuthContext)
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Cargando...</p>; // Indicador de carga
  }

  if (!user) {
    return <Navigate to="/usuarios/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
