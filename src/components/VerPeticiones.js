// src/components/VerPeticiones.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Link es necesario para el nuevo botón
import { db } from '../services/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

export default function VerPeticiones() {
  // --- SIN CAMBIOS EN LOS ESTADOS ---
  const [peticiones, setPeticiones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [peticionesFiltradas, setPeticionesFiltradas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [peticionActual, setPeticionActual] = useState(null);
  const [nuevoEstatus, setNuevoEstatus] = useState('');

  // --- SIN CAMBIOS EN LA LÓGICA ---
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
    fetchPeticiones();
  }, []);

  useEffect(() => {
    let resultado = peticiones;
    if (filtroEstatus !== 'todos') {
      resultado = resultado.filter(p => p.estatus === filtroEstatus);
    }
    if (terminoBusqueda) {
      resultado = resultado.filter(p => {
        const nombreCompleto = `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase();
        return nombreCompleto.includes(terminoBusqueda.toLowerCase());
      });
    }
    setPeticionesFiltradas(resultado);
  }, [peticiones, filtroEstatus, terminoBusqueda]);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este reporte?")) {
      try {
        await deleteDoc(doc(db, 'peticiones', id));
        setPeticiones(peticiones.filter(p => p.id !== id));
        alert("Reporte eliminado.");
      } catch (error) {
        console.error("Error al eliminar: ", error);
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
    }
  };

  if (isLoading) {
    return <div className="loading-container">Cargando reportes...</div>;
  }

  return (
    <>
      <style>{`
        /* ... Estilos anteriores sin cambios ... */
        .admin-container { max-width: 1200px; margin: 2rem auto; padding: 2rem; font-family: sans-serif; }
        .admin-header { display: flex; flex-direction: column; gap: 1.5rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
        .header-top { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .admin-title { color: #333; }
        .back-link { text-decoration: none; background-color: #f0f0f0; padding: 0.5rem 1rem; border-radius: 6px; color: #333; font-weight: 500; }
        .filter-controls { display: flex; gap: 1rem; width: 100%; }
        .filter-controls select, .filter-controls input { padding: 0.6rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
        .filter-controls input { flex-grow: 1; }
        .peticiones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
        .peticion-card { background-color: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); padding: 1.5rem; display: flex; flex-direction: column; }
        .peticion-card h3 { margin-top: 0; color: #0056b3; }
        .peticion-card .estatus { font-weight: bold; padding: 0.2rem 0.5rem; border-radius: 4px; color: white; display: inline-block; margin-bottom: 1rem; text-transform: capitalize; }
        .estatus-pendiente { background-color: #f0ad4e; }
        .estatus-en\.proceso { background-color: #337ab7; }
        .estatus-resuelta { background-color: #5cb85c; }
        .estatus-no\.procede { background-color: #777; }
        .peticion-card p { margin: 0.5rem 0; line-height: 1.5; color: #555; }
        .peticion-card strong { color: #333; }
        .peticion-image { width: 100%; height: auto; border-radius: 6px; margin-top: 1rem; border: 1px solid #eee; }
        .card-actions { margin-top: auto; padding-top: 1rem; border-top: 1px solid #eee; display: flex; gap: 0.5rem; justify-content: flex-end; }
        .action-button { border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .edit-button { background-color: #337ab7; color: white; }
        .delete-button { background-color: #d9534f; color: white; }
        
        /* --- ESTILO PARA EL NUEVO BOTÓN --- */
        .detail-button { 
          background-color: #5bc0de; 
          color: white; 
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; }
        .modal-actions { text-align: right; margin-top: 1.5rem; }
        .loading-container, .no-reportes { text-align: center; padding: 4rem; font-size: 1.5rem; color: #777; }
      `}</style>
      
      <div className="admin-container">
        {/* --- EL HEADER Y LOS FILTROS NO CAMBIAN --- */}
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
                <p><strong>Petición:</strong> {p.peticion}</p>
                <p><strong>Fecha:</strong> {p.fecha ? new Date(p.fecha.seconds * 1000).toLocaleString() : 'N/A'}</p>
                {p.ineURL && <a href={p.ineURL} target="_blank" rel="noopener noreferrer"><img src={p.ineURL} alt="..." className="peticion-image" /></a>}
                
                {/* --- SECCIÓN DE ACCIONES ACTUALIZADA --- */}
                <div className="card-actions">
                  <button onClick={() => abrirModalEdicion(p)} className="action-button edit-button">Editar Estatus</button>
                  <Link to={`/reporte/${p.id}`} className="action-button detail-button">
                    Ver Detalle
                  </Link>
                  {/* <button onClick={() => handleDelete(p.id)} className="action-button delete-button">Eliminar</button> */}
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

      {/* --- EL MODAL NO CAMBIA --- */}
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