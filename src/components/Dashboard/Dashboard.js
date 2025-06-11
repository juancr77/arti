import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './Dashboard.css'; // Importamos la hoja de estilos

export default function Dashboard() {
  const [pendientes, setPendientes] = useState([]);
  const [enProceso, setEnProceso] = useState([]);
  const [resueltas, setResueltas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPeticiones = async () => {
      const peticionesCollection = collection(db, "peticiones");
      const q = query(peticionesCollection, orderBy("fecha", "desc"));
      
      try {
        const querySnapshot = await getDocs(q);
        
        // Creamos arreglos temporales para cada estado
        const pendientesArr = [];
        const enProcesoArr = [];
        const resueltasArr = [];

        querySnapshot.forEach((doc) => {
          const reporte = { id: doc.id, ...doc.data() };
          
          switch (reporte.estatus) {
            case 'pendiente':
              pendientesArr.push(reporte);
              break;
            case 'en proceso':
              enProcesoArr.push(reporte);
              break;
            case 'resuelta':
              resueltasArr.push(reporte);
              break;
            default:
              // Opcional: manejar otros estados si los hubiera
              break;
          }
        });

        // Actualizamos los estados con los arreglos llenos
        setPendientes(pendientesArr);
        setEnProceso(enProcesoArr);
        setResueltas(resueltasArr);

      } catch (error) {
        console.error("Error al obtener los reportes: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeticiones();
  }, []);

  // Componente interno para renderizar cada tarjeta
  const ReporteCard = ({ reporte }) => (
    <Link to={`/reporte/${reporte.id}`} className="dashboard-card">
      <h4>{reporte.nombres} {reporte.apellidoPaterno}</h4>
      <p>{reporte.peticion.substring(0, 80)}{reporte.peticion.length > 80 ? '...' : ''}</p>
      <div className="card-footer">
        <span>{new Date(reporte.fecha.seconds * 1000).toLocaleString()}</span>
      </div>
    </Link>
  );

  if (isLoading) {
    return <div className="loading-container">Cargando Dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard de Seguimiento</h1>
        <Link to="/" className="back-link">Volver al Inicio</Link>
      </div>
      <div className="dashboard-board">
        {/* Columna Pendientes */}
        <div className="dashboard-column red">
          <h2>En Dirección a la que pertenece</h2>
          <div className="card-list">
            {pendientes.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>

        {/* Columna En Proceso */}
        <div className="dashboard-column amber">
          <h2>Con Notas de seguimiento</h2>
          <div className="card-list">
            {enProceso.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>

        {/* Columna Resueltas */}
        <div className="dashboard-column green">
          <h2>Acciones correctivas finales</h2>
          <div className="card-list">
            {resueltas.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>
      </div>
    </div>
  );
}