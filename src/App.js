// src/App.js

import React, { useState } from 'react';
// CORRECCIÓN DE RUTA: Se ha ajustado la ruta para reflejar la estructura de carpetas.
// Asume que App.js está en /src y el componente está en /src/components/FormularioPeticion/
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion.js';
import './App.css'; // Estilos para el menú y la app en general

// Componente del Menú Principal
const HomePage = ({ onNavigateToForm }) => {
  return (
    <div className="home-menu-container">
      <div className="home-menu-content">
        <h1 className="home-menu-title">Sistema de Gestión</h1>
        <p className="home-menu-subtitle">Bienvenido. Selecciona una opción para comenzar.</p>
        <button onClick={onNavigateToForm} className="home-menu-button">
          Generar Nuevo Reporte
        </button>
      </div>
    </div>
  );
};


// Controlador principal de la aplicación
export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' o 'form'

  const navigateToForm = () => {
    setCurrentPage('form');
  };

  const navigateToHome = () => {
    setCurrentPage('home');
  };

  return (
    <div className="main-app-container">
      {currentPage === 'home' && <HomePage onNavigateToForm={navigateToForm} />}
      {currentPage === 'form' && <FormularioPeticion onNavigateHome={navigateToHome} />}
    </div>
  );
}
