// src/components/HomePage.js

import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-menu-container">
      <div className="home-menu-content">
        <h1 className="home-menu-title">Sistema de Gestión</h1>
        <p className="home-menu-subtitle">Bienvenido. Selecciona una opción para comenzar.</p>
        
        {/* Este Link navegará a la ruta /nuevo-reporte */}
        <Link to="/nuevo-reporte" className="home-menu-button">
          Generar Nuevo Reporte
        </Link>
      </div>
    </div>
  );
};

// CORRECCIÓN: Se añade la línea de exportación por defecto que faltaba.
export default HomePage;
