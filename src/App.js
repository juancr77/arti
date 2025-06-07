// src/App.js
import React from 'react';
import FormularioPeticion from './components/FormularioPeticion/FormularioPeticion'; // Asegúrate que esta ruta sea correcta
import './App.css'; // O tus estilos globales si los tienes

function App() {
  return (
    <div className="App">
      <header className="App-header">
      <FormularioPeticion /> {/* Aquí se usa el componente */}
      </header>
      <main>
    
      </main>
    </div>
  );
}

export default App;