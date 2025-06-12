import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './Dashboard.css';

export default function Dashboard() {
  const [allPeticiones, setAllPeticiones] = useState([]); // Guarda todos los reportes, sin filtrar
  const [pendientes, setPendientes] = useState([]);
  const [enProceso, setEnProceso] = useState([]);
  const [resueltas, setResueltas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- NUEVO: Estados para el filtro de Dirección ---
  const [filtroDireccion, setFiltroDireccion] = useState('todas');
  const [direccionesOptions, setDireccionesOptions] = useState([]);

  // Carga inicial de datos (TODAS las peticiones y TODAS las direcciones)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar Peticiones
        const peticionesQuery = query(collection(db, "peticiones"), orderBy("fecha", "desc"));
        const peticionesSnapshot = await getDocs(peticionesQuery);
        const listaPeticiones = peticionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllPeticiones(listaPeticiones);

        // Cargar Direcciones para el filtro
        const direccionesSnapshot = await getDocs(collection(db, "direcciones"));
        const listaDirecciones = direccionesSnapshot.docs.map(doc => doc.data().nombre).sort();
        setDireccionesOptions(listaDirecciones);

      } catch (error) {
        console.error("Error al obtener los datos: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Efecto para filtrar y categorizar los reportes cuando cambia el filtro o la lista principal
  useEffect(() => {
    // 1. Filtrar primero por dirección
    const peticionesFiltradas = filtroDireccion === 'todas'
      ? allPeticiones
      : allPeticiones.filter(p => p.direccion === filtroDireccion);
    
    // 2. Categorizar en columnas el resultado filtrado
    const pendientesArr = [];
    const enProcesoArr = [];
    const resueltasArr = [];

    peticionesFiltradas.forEach((reporte) => {
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
          break;
      }
    });

    setPendientes(pendientesArr);
    setEnProceso(enProcesoArr);
    setResueltas(resueltasArr);

  }, [allPeticiones, filtroDireccion]); // Se ejecuta cuando los datos iniciales cargan o cuando cambia el filtro


  // Componente interno para renderizar cada tarjeta (ahora incluye la dirección)
  const ReporteCard = ({ reporte }) => (
    <Link to={`/reporte/${reporte.id}`} className="dashboard-card">
      <h4>{reporte.nombres} {reporte.apellidoPaterno}</h4>
      {/* --- NUEVO: Se muestra la dirección --- */}
      {reporte.direccion && <div className="card-direction">{reporte.direccion}</div>}
      <p>{reporte.peticion.substring(0, 80)}{reporte.peticion.length > 80 ? '...' : ''}</p>
      <div className="card-footer">
        <span>{reporte.fecha ? new Date(reporte.fecha.seconds * 1000).toLocaleString() : 'Sin fecha'}</span>
      </div>
    </Link>
  );

  if (isLoading) {
    return <div className="loading-container">Cargando Dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>Dashboard de Seguimiento</h1>
          <Link to="/" className="back-link">Volver al Inicio</Link>
        </div>
        {/* --- NUEVO: Controles de filtro --- */}
        <div className="filter-controls">
            <label htmlFor="filtroDireccion" style={{alignSelf: 'center'}}>Filtrar por Dirección:</label>
            <select id="filtroDireccion" value={filtroDireccion} onChange={e => setFiltroDireccion(e.target.value)}>
              <option value="todas">Todas las Direcciones</option>
              {direccionesOptions.map(dir => (
                <option key={dir} value={dir}>{dir}</option>
              ))}
            </select>
        </div>
      </div>
      <div className="dashboard-board">
        <div className="dashboard-column red">
          <h2>En Dirección a la que pertenece</h2>
          <div className="card-list">
            {pendientes.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>

        <div className="dashboard-column amber">
          <h2>Con Notas de seguimiento</h2>
          <div className="card-list">
            {enProceso.map(reporte => <ReporteCard key={reporte.id} reporte={reporte} />)}
          </div>
        </div>

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