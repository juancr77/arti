// src/components/DetalleReporte.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function DetalleReporte() {
  const { reporteId } = useParams();
  const navigate = useNavigate();

  const [reporte, setReporte] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    estatus: '',
    localidad: '',
    peticion: '',
    fecha: '',
    hora: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const docRef = doc(db, 'peticiones', reporteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setReporte(data);
          setFormData({
            nombres: data.nombres || '',
            apellidoPaterno: data.apellidoPaterno || '',
            apellidoMaterno: data.apellidoMaterno || '',
            telefono: data.telefono || '',
            estatus: data.estatus || 'pendiente',
            localidad: data.localidad || '',
            peticion: data.peticion || '',
            fecha: data.fecha ? new Date(data.fecha.seconds * 1000).toISOString().split('T')[0] : '',
            hora: data.hora || ''
          });
        } else {
          setReporte(false);
        }
      } catch (error) {
        console.error("Error obteniendo el documento:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReporte();
  }, [reporteId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const docRef = doc(db, 'peticiones', reporteId);
    try {
      const datosActualizados = {
        ...formData,
        fecha: Timestamp.fromDate(new Date(`${formData.fecha}T${formData.hora || '00:00:00'}`))
      };
      await updateDoc(docRef, datosActualizados);
      alert("¡Reporte actualizado con éxito!");
      navigate('/ver-reportes');
    } catch (error) {
      console.error("Error al actualizar el documento: ", error);
      alert("Ocurrió un error al actualizar.");
    }
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR ---
  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este reporte? Esta acción es irreversible.")) {
      try {
        const docRef = doc(db, 'peticiones', reporteId);
        await deleteDoc(docRef);
        alert("Reporte eliminado con éxito.");
        navigate('/ver-reportes'); // Redirige a la lista después de borrar
      } catch (error) {
        console.error("Error al eliminar el documento: ", error);
        alert("Ocurrió un error al eliminar el reporte.");
      }
    }
  };

  if (isLoading) return <div className="loading-container">Cargando detalle del reporte...</div>;
  if (reporte === false) return <div><h1>Reporte no encontrado</h1><Link to="/ver-reportes">Volver a la lista</Link></div>;

  return (
    <>
      <style>{`
        .detalle-container { max-width: 800px; margin: 2rem auto; padding: 2rem; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .detalle-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
        .edit-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; }
        .full-width { grid-column: 1 / -1; }
        .form-group label { margin-bottom: 0.5rem; color: #555; font-weight: 500; }
        .form-input, .form-textarea, .form-select { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
        .form-textarea { resize: vertical; min-height: 120px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
        .submit-button, .delete-button { padding: 0.7rem 1.5rem; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; }
        .submit-button { background-color: #007bff; color: white; }
        .delete-button { background-color: #d9534f; color: white; } /* Estilo para el botón de eliminar */
        .report-image { max-width: 100%; border-radius: 8px; margin-top: 2rem; border: 1px solid #ddd; }
      `}</style>
      <div className="detalle-container">
        <div className="detalle-header">
          <h2>Editar Reporte</h2>
          <Link to="/ver-reportes" className="back-link">← Volver</Link>
        </div>
        
        <form onSubmit={handleUpdate} className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombres">Nombre(s)</label>
              <input type="text" id="nombres" name="nombres" value={formData.nombres} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="apellidoPaterno">Apellido Paterno</label>
              <input type="text" id="apellidoPaterno" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="apellidoMaterno">Apellido Materno</label>
              <input type="text" id="apellidoMaterno" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="localidad">Localidad</label>
              <input type="text" id="localidad" name="localidad" value={formData.localidad} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="estatus">Estatus</label>
              <select id="estatus" name="estatus" value={formData.estatus} onChange={handleChange} className="form-select">
                <option value="pendiente">Pendiente</option>
                <option value="en proceso">En Proceso</option>
                <option value="resuelta">Resuelta</option>
                <option value="no procede">No Procede</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="fecha">Fecha</label>
              <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="hora">Hora</label>
              <input type="time" id="hora" name="hora" value={formData.hora} onChange={handleChange} className="form-input" />
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="peticion">Descripción de la Petición</label>
            <textarea id="peticion" name="peticion" value={formData.peticion} onChange={handleChange} className="form-textarea" />
          </div>
          
          <div className="form-actions">
            {/* --- BOTÓN DE ELIMINAR AÑADIDO --- */}
            <button type="button" onClick={handleDelete} className="delete-button">Eliminar Reporte</button>
            <button type="submit" className="submit-button">Guardar Cambios</button>
          </div>
        </form>

        {/* --- IMAGEN MOVIDA AQUÍ, AL FINAL --- */}
        {reporte?.ineURL && (
            <div>
                <h3 style={{marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem'}}>Identificación Adjunta</h3>
                <img src={reporte.ineURL} alt="Identificación" className="report-image" />
            </div>
        )}
      </div>
    </>
  );
}