import React from 'react';
import { Link } from 'react-router-dom'; 
import './newcss/HomePage.css'; 

const HomePage = () => {
  return (
    <div className="home-menu-container">
      <div className="home-menu-content">
        <h1 className="home-menu-title">Sistema de Gestión</h1>
        <p className="home-menu-subtitle">Bienvenido. Selecciona una opción para comenzar.</p>
        
        <Link to="/nuevo-reporte" className="home-menu-button">
          Generar Nuevo Reporte
        </Link>
        <Link to="/ver-reportes" className="home-menu-button admin">
          Ver y Administrar Reportes
        </Link>
        <Link to="/dashboard" className="home-menu-button dashboard">
          Dashboard de Seguimiento
        </Link>
      </div>
    </div>
  );
};

export default HomePage;