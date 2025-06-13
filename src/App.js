import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importaciones de componentes
import LoginPage from './pages/LoginPage';
import HomePage from './components/HomePage.js';
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion.js';
import VerPeticiones from './components/VerPeticiones.js';
import DetalleReporte from './components/DetalleReporte.js';
import Dashboard from './components/Dashboard/Dashboard.js';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout'; // <-- Importamos el Layout

import './App.css'; 

export default function App() {
  return (
    <Routes>
      {/* Ruta pública para el Login */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* --- NUEVA ESTRUCTURA DE RUTAS PROTEGIDAS --- */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        {/* Todas las rutas aquí dentro estarán protegidas y usarán la Navbar */}
        <Route path="/" element={<HomePage />} />
        <Route path="/nuevo-reporte" element={<FormularioPeticion />} />
        <Route path="/ver-reportes" element={<VerPeticiones />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reporte/:reporteId" element={<DetalleReporte />} />
      </Route>
    </Routes>
  );
}