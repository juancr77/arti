import React from 'react';
import { Link } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; // Importamos el hook de autenticación
import './newcss/HomePage.css'; 
const HomePage = () => {
  const { currentUser } = useAuth(); // Obtenemos el estado del usuario

  return (
    <div className="home-page-container">
      <div className="home-page-content">
        <h1 className="home-page-title">Sistema de Gestión de Reportes</h1>
        <p className="home-page-subtitle">Plataforma interna para el seguimiento de peticiones.</p>
        
        <div className="home-page-links">
          {currentUser ? (
            // --- ESTO SE MUESTRA SI EL USUARIO HA INICIADO SESIÓN ---
            <>
              <p>Has iniciado sesión. Selecciona una herramienta para continuar.</p>
              <Link to="/nuevo-reporte" className="home-menu-button">
                Generar Nuevo Reporte
              </Link>
              <Link to="/ver-reportes" className="home-menu-button admin">
                Administrar Reportes
              </Link>
              <Link to="/dashboard" className="home-menu-button dashboard">
                Dashboard de Seguimiento
              </Link>
            </>
          ) : (
            // --- ESTO SE MUESTRA SI EL USUARIO NO HA INICIADO SESIÓN ---
            <p className="login-prompt">
              Por favor, <strong>inicia sesión</strong> desde el botón en la barra de navegación superior para acceder a las herramientas de gestión.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;