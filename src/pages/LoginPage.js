import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css'; // Importamos la hoja de estilos

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
    }
    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Bienvenido(a) al sistema de reportes Arti</h1>
        
        {/* --- ESTRUCTURA CORRECTA PARA LA IMAGEN --- */}
        <div className="login-image-container">
            <img 
                src="https://i.imgur.com/5mavo8r.png" 
                alt="Logo Arti" 
                className="login-logo"
            />
        </div>

        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button disabled={loading} className="login-button" type="submit">
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}