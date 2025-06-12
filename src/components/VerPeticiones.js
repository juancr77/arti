import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import './newcss/VerPeticiones.css'; 

export default function VerPeticiones() {
  const [peticiones, setPeticiones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [peticionesFiltradas, setPeticionesFiltradas] = useState([]);
  
  // Estados para los filtros
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroDireccion, setFiltroDireccion] = useState('todas');
  const [direccionesOptions, setDireccionesOptions] = useState([]);

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [peticionActual, setPeticionActual] = useState(null);
  const [nuevoEstatus, setNuevoEstatus] = useState('');

  // Carga inicial de datos
  useEffect(() => {
    const fetchPeticiones = async () => {
      try {
        const q = query(collection(db, "peticiones"), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);
        const listaPeticiones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPeticiones(listaPeticiones);
      } catch (error) {
        console.error("Error al obtener las peticiones: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDirecciones = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "direcciones"));
        const data = querySnapshot.docs.map(doc => doc.data().nombre).sort();
        setDireccionesOptions(data);
      } catch (error) {
        console.error("Error cargando direcciones: ", error);
      }
    };

    fetchPeticiones();
    fetchDirecciones();
  }, []);

  // Lógica de filtrado
  useEffect(() => {
    let resultado = peticiones;

    // 1. Filtro por Estatus
    if (filtroEstatus !== 'todos') {
      resultado = resultado.filter(p => p.estatus === filtroEstatus);
    }

    // 2. Filtro por Dirección
    if (filtroDireccion !== 'todas') {
      resultado = resultado.filter(p => p.direccion === filtroDireccion);
    }

    // 3. Búsqueda por Nombre
    if (terminoBusqueda) {
      resultado = resultado.filter(p => {
        const nombreCompleto = `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase();
        return nombreCompleto.includes(terminoBusqueda.toLowerCase());
      });
    }

    setPeticionesFiltradas(resultado);
  }, [peticiones, filtroEstatus, filtroDireccion, terminoBusqueda]);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este reporte?")) {
      try {
        await deleteDoc(doc(db, 'peticiones', id));
        setPeticiones(peticiones.filter(p => p.id !== id));
        alert("Reporte eliminado.");
      } catch (error) {
        console.error("Error al eliminar: ", error);
        alert("Ocurrió un error al eliminar el reporte.");
      }
    }
  };

  const abrirModalEdicion = (peticion) => {
    setPeticionActual(peticion);
    setNuevoEstatus(peticion.estatus);
    setIsModalOpen(true);
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!peticionActual) return;
    const peticionDocRef = doc(db, 'peticiones', peticionActual.id);
    try {
      await updateDoc(peticionDocRef, { estatus: nuevoEstatus });
      setPeticiones(peticiones.map(p => p.id === peticionActual.id ? { ...p, estatus: nuevoEstatus } : p));
      setIsModalOpen(false);
      setPeticionActual(null);
      alert("Estatus actualizado.");
    } catch (error) {
      console.error("Error al actualizar: ", error);
      alert("Ocurrió un error al actualizar el estatus.");
    }
  };


  if (isLoading) {
    return <div className="loading-container">Cargando reportes...</div>;
  }

  return (
    <>
      <div className="admin-container">
        <div className="admin-header">
          <div className="header-top">
            <h1 className="admin-title">Administrar Reportes</h1>
            <Link to="/" className="back-link">Volver al Inicio</Link>
          </div>
          <div className="filter-controls">
            <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}>
              <option value="todos">Todos los Estatus</option>
              <option value="pendiente">Pendiente</option>
              <option value="en proceso">En Proceso</option>
              <option value="resuelta">Resuelta</option>
              <option value="no procede">No Procede</option>
            </select>
            
            <select value={filtroDireccion} onChange={e => setFiltroDireccion(e.target.value)}>
              <option value="todas">Todas las Direcciones</option>
              {direccionesOptions.map(dir => (
                <option key={dir} value={dir}>{dir}</option>
              ))}
            </select>

            <input 
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={terminoBusqueda}
              onChange={e => setTerminoBusqueda(e.target.value)}
            />
          </div>
        </div>

        {peticionesFiltradas.length > 0 ? (
          <div className="peticiones-grid">
            {peticionesFiltradas.map((p) => (
              <div key={p.id} className="peticion-card">
                <h3>{p.nombres} {p.apellidoPaterno}</h3>
                <span className={`estatus estatus-${p.estatus.replace(/\s+/g, '.')}`}>
                  {p.estatus}
                </span>
                <p><strong>Localidad:</strong> {p.localidad}</p>
                {p.direccion && <p><strong>Dirección:</strong> {p.direccion}</p>}
                <p><strong>Petición:</strong> {p.peticion}</p>
                <p><strong>Fecha:</strong> {p.fecha ? new Date(p.fecha.seconds * 1000).toLocaleString() : 'N/A'}</p>
                
                {p.ineURL && (
                  <a href={p.ineURL} target="_blank" rel="noopener noreferrer">
                    <img src={p.ineURL} alt={`Identificación de ${p.nombres}`} className="peticion-image" />
                  </a>
                )}
                
                <div className="card-actions">
                  <button onClick={() => abrirModalEdicion(p)} className="action-button edit-button">Editar Estatus</button>
                  <Link to={`/reporte/${p.id}`} className="action-button detail-button">
                    Ver Detalle
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reportes">
            {peticiones.length > 0 ? "No hay reportes que coincidan con tu búsqueda." : "No hay reportes registrados."}
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Editar Estatus del Reporte</h2>
            <p><strong>Reporte de:</strong> {peticionActual?.nombres} {peticionActual?.apellidoPaterno}</p>
            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-group">
                <label htmlFor="estatus">Estatus</label>
                <select 
                  id="estatus" 
                  value={nuevoEstatus} 
                  onChange={(e) => setNuevoEstatus(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en proceso">En Proceso</option>
                  <option value="resuelta">Resuelta</option>
                  <option value="no procede">No Procede</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="action-button" style={{backgroundColor: '#ccc'}}>Cancelar</button>
                <button type="submit" className="action-button edit-button" style={{marginLeft: '0.5rem'}}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}