import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importaciones de componentes
import LoginPage from './pages/LoginPage';
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion.js';
import VerPeticiones from './components/VerPeticiones.js';
import DetalleReporte from './components/DetalleReporte.js';
import Dashboard from './components/Dashboard/Dashboard.js';
import ProtectedRoute from './components/ProtectedRoute'; // <-- 1. Importamos el guardián

import './App.css'; 

export default function App() {
  return (
    <Routes>
      {/* --- RUTAS PÚBLICAS --- */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* --- RUTAS PROTEGIDAS --- */}
      {/* La ruta raíz ahora te redirigirá al login si no has iniciado sesión */}
      <Route 
        path="/" 
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/nuevo-reporte" 
        element={<ProtectedRoute><FormularioPeticion /></ProtectedRoute>} 
      />
      <Route 
        path="/ver-reportes" 
        element={<ProtectedRoute><VerPeticiones /></ProtectedRoute>} 
      />
      <Route 
        path="/reporte/:reporteId" 
        element={<ProtectedRoute><DetalleReporte /></ProtectedRoute>} 
      />
    </Routes>
  );
}