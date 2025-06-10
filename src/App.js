// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './components/HomePage.js';
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion.js';
import VerPeticiones from './components/VerPeticiones.js';
import DetalleReporte from './components/DetalleReporte.js'; // <-- 1. Importa el nuevo componente

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/nuevo-reporte" element={<FormularioPeticion />} />
      <Route path="/ver-reportes" element={<VerPeticiones />} />
      
      {/* --- 2. AÑADE LA NUEVA RUTA DINÁMICA --- */}
      <Route path="/reporte/:reporteId" element={<DetalleReporte />} />

    </Routes>
  );
}