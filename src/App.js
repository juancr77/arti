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
import MainLayout from './components/MainLayout';

import './App.css'; 

export default function App() {
  return (
    <Routes>
      {/* Ruta pública para el Login, no usa el MainLayout para no tener doble Navbar */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* --- NUEVA ESTRUCTURA --- */}
      {/* Todas las demás páginas usan el MainLayout para tener la Navbar fija */}
      <Route element={<MainLayout />}>
        {/* HomePage es ahora la ruta principal y es PÚBLICA */}
        <Route path="/" element={<HomePage />} />
        
        {/* El resto de las rutas están anidadas y PROTEGIDAS */}
        <Route path="/nuevo-reporte" element={<ProtectedRoute><FormularioPeticion /></ProtectedRoute>} />
        <Route path="/ver-reportes" element={<ProtectedRoute><VerPeticiones /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reporte/:reporteId" element={<ProtectedRoute><DetalleReporte /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}