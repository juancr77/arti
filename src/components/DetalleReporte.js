// src/components/DetalleReporte.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export default function DetalleReporte() {
  // Hooks para obtener el ID de la URL y para navegar
  const { reporteId } = useParams();
  const navigate = useNavigate();

  const [reporte, setReporte] = useState(null);
  const [formData, setFormData] = useState({
    localidad: '',
    peticion: '',
    fecha: '',
    hora: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // Para mostrar/ocultar el formulario

  // --- OBTENER DATOS DEL REPORTE ESPECÍFICO ---
  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const docRef = doc(db, 'peticiones', reporteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setReporte(data);
          // Pre-llenamos el formulario con los datos existentes
          setFormData({
            localidad: data.localidad || '',
            peticion: data.peticion || '',
            // Convertimos el Timestamp de Firebase a un formato que el input[type=date] entienda (YYYY-MM-DD)
            fecha: data.fecha ? new Date(data.fecha.seconds * 1000).toISOString().split('T')[0] : '',
            hora: data.hora || ''
          });
        } else {
          console.log("No se encontró el documento.");
          setReporte(false); // Para mostrar un mensaje de "no encontrado"
        }
      } catch (error) {
        console.error("Error obteniendo el documento:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReporte();
  }, [reporteId]); // Se ejecuta cada vez que el ID en la URL cambia

  // --- MANEJADORES DEL FORMULARIO ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const docRef = doc(db, 'peticiones', reporteId);
    
    try {
      // Preparamos los datos para actualizar, convirtiendo la fecha de vuelta a Timestamp
      const datosActualizados = {
        ...formData,
        fecha: Timestamp.fromDate(new Date(formData.fecha + 'T' + formData.hora))
      };

      await updateDoc(docRef, datosActualizados);
      
      alert("¡Reporte actualizado con éxito!");
      navigate('/ver-reportes'); // Redirige al usuario de vuelta a la lista
    } catch (error) {
      console.error("Error al actualizar el documento: ", error);
      alert("Ocurrió un error al actualizar.");
    }
  };

  // --- RENDERIZADO ---
  if (isLoading) return <div className="loading-container">Cargando detalle del reporte...</div>;
  if (reporte === false) return <div><h1>Reporte no encontrado</h1><Link to="/ver-reportes">Volver a la lista</Link></div>;

  return (
    <>
      <style>{`
        .detalle-container { max-width: 800px; margin: 2rem auto; padding: 2rem; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .detalle-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; }
        .edit-form { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { margin-bottom: 0.5rem; color: #555; font-weight: 500; }
        .form-input, .form-textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
        .form-textarea { resize: vertical; min-height: 120px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
        .submit-button, .cancel-button { padding: 0.7rem 1.5rem; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; }
        .submit-button { background-color: #007bff; color: white; }
        .cancel-button { background-color: #ccc; }
      `}</style>
      <div className="detalle-container">
        <div className="detalle-header">
          <h2>Detalle del Reporte</h2>
          <Link to="/ver-reportes" className="back-link">← Volver</Link>
        </div>
        
        {reporte && (
          <div>
            <h3>{reporte.nombres} {reporte.apellidoPaterno}</h3>
            <p><strong>Estatus:</strong> {reporte.estatus}</p>
            <p><strong>Teléfono:</strong> {reporte.telefono}</p>
            {reporte.ineURL && <img src={reporte.ineURL} alt="Identificación" style={{maxWidth: '100%', borderRadius: '8px'}} />}
          </div>
        )}

        <form onSubmit={handleUpdate} className="edit-form">
          <div className="form-group">
            <label htmlFor="localidad">Localidad</label>
            <input type="text" id="localidad" name="localidad" value={formData.localidad} onChange={handleChange} className="form-input" />
          </div>

          <div className="form-group">
            <label htmlFor="peticion">Descripción de la Petición</label>
            <textarea id="peticion" name="peticion" value={formData.peticion} onChange={handleChange} className="form-textarea" />
          </div>

          <div style={{display: 'flex', gap: '1rem'}}>
            <div className="form-group" style={{flex: 1}}>
              <label htmlFor="fecha">Fecha</label>
              <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group" style={{flex: 1}}>
              <label htmlFor="hora">Hora</label>
              <input type="time" id="hora" name="hora" value={formData.hora} onChange={handleChange} className="form-input" />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="submit-button">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </>
  );
}