// src/App.js

import React from 'react';
// --- LÍNEA IMPORTANTE ---
// Asegúrate de que esta línea exista y esté correcta.
// Importa Routes y Route desde react-router-dom.
import { Routes, Route } from 'react-router-dom';

import HomePage from './components/HomePage.js';
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion.js';
import VerPeticiones from './components/VerPeticiones.js';

export default function App() {
  return (
    <Routes>  {/* <-- Ahora React sabe qué es <Routes> */}
      <Route path="/" element={<HomePage />} />
      <Route path="/nuevo-reporte" element={<FormularioPeticion />} />
      <Route path="/ver-reportes" element={<VerPeticiones />} />
    </Routes>
  );
}