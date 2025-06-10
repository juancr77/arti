// src/components/VerPeticiones.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Importa tus servicios de Firebase y las funciones necesarias
import { db } from '../services/firebase'; // Ajusta la ruta si es necesario
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

export default function VerPeticiones() {
  const [peticiones, setPeticiones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para el modal de edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [peticionActual, setPeticionActual] = useState(null);
  const [nuevoEstatus, setNuevoEstatus] = useState('');

  // --- LEER DATOS (FETCH) ---
  useEffect(() => {
    const fetchPeticiones = async () => {
      try {
        // Ordenamos los resultados por fecha, los más nuevos primero
        const q = query(collection(db, "peticiones"), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);
        
        const listaPeticiones = querySnapshot.docs.map(doc => ({
          id: doc.id, // <-- ¡Es crucial guardar el ID del documento!
          ...doc.data()
        }));
        
        setPeticiones(listaPeticiones);
      } catch (error) {
        console.error("Error al obtener las peticiones: ", error);
        alert("No se pudieron cargar los reportes.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeticiones();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

  // --- BORRAR UNA PETICIÓN ---
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este reporte? Esta acción es irreversible.")) {
      try {
        const peticionDocRef = doc(db, 'peticiones', id);
        await deleteDoc(peticionDocRef);
        // Actualizamos el estado local para reflejar el cambio en la UI sin recargar
        setPeticiones(peticiones.filter(p => p.id !== id));
        alert("Reporte eliminado con éxito.");
      } catch (error) {
        console.error("Error al eliminar el reporte: ", error);
        alert("Ocurrió un error al eliminar el reporte.");
      }
    }
  };

  // --- ACTUALIZAR UNA PETICIÓN (Lógica del Modal) ---
  const abrirModalEdicion = (peticion) => {
    setPeticionActual(peticion);
    setNuevoEstatus(peticion.estatus); // Pre-llenar el select con el estatus actual
    setIsModalOpen(true);
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!peticionActual) return;
    
    const peticionDocRef = doc(db, 'peticiones', peticionActual.id);
    try {
      await updateDoc(peticionDocRef, {
        estatus: nuevoEstatus 
      });

      // Actualizar el estado local para que la UI se actualice al instante
      setPeticiones(peticiones.map(p => 
        p.id === peticionActual.id ? { ...p, estatus: nuevoEstatus } : p
      ));

      setIsModalOpen(false); // Cerrar el modal
      setPeticionActual(null); // Limpiar el estado
      alert("Estatus actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar: ", error);
      alert("No se pudo actualizar el estatus.");
    }
  };


  // --- RENDERIZADO ---
  if (isLoading) {
    return <div className="loading-container">Cargando reportes...</div>;
  }

  return (
    <>
      <style>{`
        /* Estilos generales para la página de administración */
        .admin-container { max-width: 1200px; margin: 2rem auto; padding: 2rem; font-family: sans-serif; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
        .admin-title { color: #333; }
        .back-link { text-decoration: none; background-color: #f0f0f0; padding: 0.5rem 1rem; border-radius: 6px; color: #333; font-weight: 500; }
        .peticiones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
        .peticion-card { background-color: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); padding: 1.5rem; display: flex; flex-direction: column; }
        .peticion-card h3 { margin-top: 0; color: #0056b3; }
        .peticion-card .estatus { font-weight: bold; padding: 0.2rem 0.5rem; border-radius: 4px; color: white; display: inline-block; margin-bottom: 1rem; }
        .peticion-card .estatus-pendiente { background-color: #f0ad4e; }
        .peticion-card .estatus-resuelta { background-color: #5cb85c; }
        .peticion-card p { margin: 0.5rem 0; line-height: 1.5; color: #555; }
        .peticion-card strong { color: #333; }
        .peticion-image { width: 100%; height: auto; border-radius: 6px; margin-top: 1rem; border: 1px solid #eee; }
        .card-actions { margin-top: auto; padding-top: 1rem; border-top: 1px solid #eee; display: flex; gap: 0.5rem; justify-content: flex-end; }
        .action-button { border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .edit-button { background-color: #337ab7; color: white; }
        .delete-button { background-color: #d9534f; color: white; }
        /* Estilos del Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; }
        .modal-content h2 { margin-top: 0; }
        .modal-form .form-group { margin-bottom: 1rem; }
        .modal-form label { display: block; margin-bottom: 0.5rem; }
        .modal-form select { width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #ccc; }
        .modal-actions { text-align: right; margin-top: 1.5rem; }
        .loading-container { text-align: center; padding: 4rem; font-size: 1.5rem; }
        .no-reportes { text-align: center; padding: 4rem; color: #777; }
      `}</style>
      
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">Administrar Reportes</h1>
          <Link to="/" className="back-link">Volver al Inicio</Link>
        </div>

        {peticiones.length > 0 ? (
          <div className="peticiones-grid">
            {peticiones.map((p) => (
              <div key={p.id} className="peticion-card">
                <h3>{p.nombres} {p.apellidoPaterno}</h3>
                <span className={`estatus ${p.estatus === 'pendiente' ? 'estatus-pendiente' : 'estatus-resuelta'}`}>
                  {p.estatus.toUpperCase()}
                </span>
                <p><strong>Localidad:</strong> {p.localidad}</p>
                <p><strong>Teléfono:</strong> {p.telefono}</p>
                <p><strong>Petición:</strong> {p.peticion}</p>
                <p><strong>Fecha:</strong> {p.fecha ? new Date(p.fecha.seconds * 1000).toLocaleString() : 'N/A'}</p>
                
                {/* Mostrar la imagen solo si existe la URL */}
                {p.ineURL && (
                  <a href={p.ineURL} target="_blank" rel="noopener noreferrer">
                    <img src={p.ineURL} alt={`Identificación de ${p.nombres}`} className="peticion-image" />
                  </a>
                )}
                
                <div className="card-actions">
                  <button onClick={() => abrirModalEdicion(p)} className="action-button edit-button">Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="action-button delete-button">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reportes">No hay reportes registrados por el momento.</p>
        )}
      </div>

      {/* --- MODAL DE EDICIÓN --- */}
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