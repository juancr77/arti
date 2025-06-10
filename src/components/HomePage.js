// src/components/HomePage.js

import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-menu-container">
      <div className="home-menu-content">
        <h1 className="home-menu-title">Sistema de Gestión</h1>
        <p className="home-menu-subtitle">Bienvenido. Selecciona una opción para comenzar.</p>
        
        <Link to="/nuevo-reporte" className="home-menu-button">
          Generar Nuevo Reporte
        </Link>
        {/* Este botón lo añadimos en la sugerencia anterior */}
        <Link to="/ver-reportes" className="home-menu-button admin">
          Ver y Administrar Reportes
        </Link>
      </div>
    </div>
  );
};

// --- LÍNEA AÑADIDA ---
export default HomePage; // <-- ¡Esta es la corrección!