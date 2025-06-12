// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importaciones de todos tus componentes de página
import HomePage from './components/HomePage.js'; 
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion.js';
import VerPeticiones from './components/VerPeticiones.js';
import DetalleReporte from './components/DetalleReporte.js';
import Dashboard from './components/Dashboard/Dashboard.js';

// Estilos globales si los tienes
// import './App.css'; 

export default function App() {
  return (
    <Routes>
      {/* Ruta para la página principal (el menú) */}
      <Route path="/" element={<HomePage />} />

      {/* Ruta para el formulario de nuevo reporte */}
      <Route path="/nuevo-reporte" element={<FormularioPeticion />} />

      {/* Ruta para ver la lista de todos los reportes */}
      <Route path="/ver-reportes" element={<VerPeticiones />} />

      {/* Ruta dinámica para ver el detalle de un reporte específico */}
      <Route path="/reporte/:reporteId" element={<DetalleReporte />} />

      {/* Ruta para el nuevo dashboard de seguimiento */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}