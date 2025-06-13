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
      {/* Ruta pública para el Login. Si no se ha iniciado sesión, esta es la única accesible. */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* El resto de la aplicación está protegida. Si no hay sesión, redirige a /login */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        
        {/* La ruta 'index' es la que se muestra por defecto en '/' si se tiene sesión */}
        <Route index element={<HomePage />} />
        
        {/* El resto de las rutas anidadas que usarán la Navbar */}
        <Route path="nuevo-reporte" element={<FormularioPeticion />} />
        <Route path="ver-reportes" element={<VerPeticiones />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reporte/:reporteId" element={<DetalleReporte />} />
      </Route>
    </Routes>
  );
}