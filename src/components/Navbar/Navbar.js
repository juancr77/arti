import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Reportes Arti
        </Link>
        <div className="nav-menu">
          {currentUser && (
            <>
              <NavLink to="/" className="nav-links">Inicio</NavLink>
              <NavLink to="/ver-reportes" className="nav-links">Reportes</NavLink>
              <NavLink to="/dashboard" className="nav-links">Dashboard</NavLink>
            </>
          )}
        </div>
        <div className="nav-button-container">
          {currentUser ? (
            <button onClick={handleLogout} className="nav-button logout">Cerrar Sesión</button>
          ) : (
            <Link to="/login" className="nav-button login">Iniciar Sesión</Link>
          )}
        </div>
      </div>
    </nav>
  );
}