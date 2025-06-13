import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Si no hay usuario, redirige a la página de login
    return <Navigate to="/login" />;
  }

  // Si hay usuario, muestra el componente hijo (la página protegida)
  return children;
}