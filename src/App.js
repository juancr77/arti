// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// CORRECCIÓN DE RUTAS:
// Se ajustan las rutas para que apunten correctamente a la carpeta 'components'
// desde el archivo App.js que está en la raíz de 'src'. Se añade la extensión .js
// para ser más explícitos con el sistema de importación.
import HomePage from './components/HomePage.js'; 
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion.js';

// Se asume que App.css está en la misma carpeta que App.js (src)
import './App.css'; 

export default function App() {
  return (
    <Routes>
      {/* Ruta para la página principal (el menú) */}
      <Route path="/" element={<HomePage />} />

      {/* Ruta para el formulario de nuevo reporte */}
      <Route path="/nuevo-reporte" element={<FormularioPeticion />} />
    </Routes>
  );
}
