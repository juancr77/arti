import React from 'react';
import { Link } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import './newcss/HomePage.css';

const HomePage = () => {
  // Obtenemos el usuario para poder mostrar un mensaje de bienvenida personalizado
  const { currentUser } = useAuth(); 

  return (
    <div className="home-page-container">
      <div className="home-page-content">
        <h1 className="home-page-title">Sistema de Gestión de Reportes Arti</h1>
        {/* Mensaje de bienvenida personalizado */}
        <p className="home-page-subtitle">
          Bienvenido(a), <strong>{currentUser?.email}</strong>. Selecciona una herramienta para comenzar.
        </p>
        
        <div className="home-page-links">
          {/* Los enlaces a las herramientas ahora siempre son visibles en esta página */}
          <Link to="/nuevo-reporte" className="home-menu-button">
            Generar Nuevo Reporte
          </Link>
          <Link to="/ver-reportes" className="home-menu-button admin">
            Administrar Reportes
          </Link>
          <Link to="/dashboard" className="home-menu-button dashboard">
            Dashboard de Seguimiento
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;