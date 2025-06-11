// src/components/DetalleReporte.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp, collection, getDocs, addDoc } from 'firebase/firestore';

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
    direccion: '',
    peticion: '',
    fecha: '',
    hora: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Estados y Refs para los Dropdowns
  const [localidadesOptions, setLocalidadesOptions] = useState([]);
  const [localidadSearchTerm, setLocalidadSearchTerm] = useState("");
  const [isLocalidadListOpen, setIsLocalidadListOpen] = useState(false);
  const localidadDropdownRef = useRef(null);

  const [direccionesOptions, setDireccionesOptions] = useState([]);
  const [direccionSearchTerm, setDireccionSearchTerm] = useState("");
  const [isDireccionListOpen, setIsDireccionListOpen] = useState(false);
  const direccionDropdownRef = useRef(null);


  // --- EFECTOS ---
  // Obtener datos del reporte específico
  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const docRef = doc(db, 'peticiones', reporteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setReporte(data);
          const fechaDelReporte = data.fecha ? data.fecha.toDate() : new Date();
          setFormData({
            nombres: data.nombres || '',
            apellidoPaterno: data.apellidoPaterno || '',
            apellidoMaterno: data.apellidoMaterno || '',
            telefono: data.telefono || '',
            estatus: data.estatus || 'pendiente',
            localidad: data.localidad || '',
            direccion: data.direccion || '',
            peticion: data.peticion || '',
            fecha: fechaDelReporte.toISOString().split('T')[0],
            hora: fechaDelReporte.toTimeString().split(' ')[0].substring(0, 5),
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
  
  // Cargar listas para los dropdowns
  useEffect(() => {
    const fetchDropdownData = async (collectionName, setData) => {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = querySnapshot.docs.map(doc => doc.data().nombre).sort((a,b) => a.localeCompare(b));
        setData(data);
      } catch (error) {
        console.error(`Error cargando ${collectionName}: `, error);
      }
    };
    fetchDropdownData('localidades', setLocalidadesOptions);
    fetchDropdownData('direcciones', setDireccionesOptions);
  }, []);

  // Efectos para cerrar los dropdowns al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (localidadDropdownRef.current && !localidadDropdownRef.current.contains(event.target)) {
        setIsLocalidadListOpen(false);
      }
      if (direccionDropdownRef.current && !direccionDropdownRef.current.contains(event.target)) {
        setIsDireccionListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // --- MANEJADORES DE EVENTOS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleLocalidadSelect = (selected) => {
    setFormData(prevData => ({ ...prevData, localidad: selected }));
    setIsLocalidadListOpen(false);
    setLocalidadSearchTerm("");
  };

  const handleDireccionSelect = (selected) => {
    setFormData(prevData => ({ ...prevData, direccion: selected }));
    setIsDireccionListOpen(false);
    setDireccionSearchTerm("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const docRef = doc(db, 'peticiones', reporteId);
    try {
      const localidadFinal = formData.localidad.trim();
      const direccionFinal = formData.direccion.trim();

      if (localidadFinal && !localidadesOptions.some(loc => loc.toLowerCase() === localidadFinal.toLowerCase())) {
        await addDoc(collection(db, 'localidades'), { nombre: localidadFinal });
      }
      if (direccionFinal && !direccionesOptions.some(dir => dir.toLowerCase() === direccionFinal.toLowerCase())) {
        await addDoc(collection(db, 'direcciones'), { nombre: direccionFinal });
      }

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

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este reporte? Esta acción es irreversible.")) {
      try {
        await deleteDoc(doc(db, 'peticiones', reporteId));
        alert("Reporte eliminado con éxito.");
        navigate('/ver-reportes');
      } catch (error) {
        console.error("Error al eliminar el documento: ", error);
        alert("Ocurrió un error al eliminar el reporte.");
      }
    }
  };

  const filteredLocalidades = localidadesOptions.filter(loc => loc.toLowerCase().includes(localidadSearchTerm.toLowerCase()));
  const filteredDirecciones = direccionesOptions.filter(dir => dir.toLowerCase().includes(direccionSearchTerm.toLowerCase()));

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
        .form-input, .form-textarea, .form-select, .dropdown-toggle { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
        .form-textarea { resize: vertical; min-height: 120px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
        .submit-button, .delete-button { padding: 0.7rem 1.5rem; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; }
        .submit-button { background-color: #007bff; color: white; }
        .delete-button { background-color: #d9534f; color: white; }
        .report-image { max-width: 100%; border-radius: 8px; margin-top: 1rem; border: 1px solid #ddd; }
        .image-section { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1.5rem; }
        .searchable-dropdown { position: relative; }
        .dropdown-toggle { text-align: left; background-color: white; cursor: pointer; }
        .dropdown-toggle.placeholder { color: #6c757d; }
        .suggestions-list { position: absolute; background-color: white; border: 1px solid #ddd; border-radius: 6px; width: 100%; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .suggestion-search-input { width: 100%; padding: 0.75rem; border: none; border-bottom: 1px solid #ddd; border-radius: 6px 6px 0 0; font-size: 1rem; box-sizing: border-box; }
        .suggestion-items-container { max-height: 200px; overflow-y: auto; }
        .suggestion-item { padding: 10px; cursor: pointer; color: #333; }
        .suggestion-item:hover { background-color: #f0f0f0; }
        .suggestion-item.add-new { color: #007bff; font-style: italic; }
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
            
            <div className="form-group searchable-dropdown" ref={localidadDropdownRef}>
              <label>Localidad</label>
              <button type="button" className={`dropdown-toggle ${!formData.localidad ? 'placeholder' : ''}`} onClick={() => setIsLocalidadListOpen(!isLocalidadListOpen)}>
                {formData.localidad || "Selecciona una localidad"}
              </button>
              {isLocalidadListOpen && (
                <div className="suggestions-list">
                  <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={localidadSearchTerm} onChange={(e) => setLocalidadSearchTerm(e.target.value)} autoFocus />
                  <div className="suggestion-items-container">
                    {filteredLocalidades.map(loc => ( <div key={loc} className="suggestion-item" onClick={() => handleLocalidadSelect(loc)}>{loc}</div> ))}
                    {filteredLocalidades.length === 0 && localidadSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleLocalidadSelect(localidadSearchTerm)}>Añadir nueva: "{localidadSearchTerm}"</div> )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-group searchable-dropdown" ref={direccionDropdownRef}>
              <label>Dirección</label>
              <button type="button" className={`dropdown-toggle ${!formData.direccion ? 'placeholder' : ''}`} onClick={() => setIsDireccionListOpen(!isDireccionListOpen)}>
                {formData.direccion || "Selecciona una dirección"}
              </button>
              {isDireccionListOpen && (
                <div className="suggestions-list">
                  <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={direccionSearchTerm} onChange={(e) => setDireccionSearchTerm(e.target.value)} autoFocus />
                  <div className="suggestion-items-container">
                    {filteredDirecciones.map(dir => ( <div key={dir} className="suggestion-item" onClick={() => handleDireccionSelect(dir)}>{dir}</div> ))}
                    {filteredDirecciones.length === 0 && direccionSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleDireccionSelect(direccionSearchTerm)}>Añadir nueva: "{direccionSearchTerm}"</div> )}
                  </div>
                </div>
              )}
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
          
          {reporte?.ineURL && (
            <div className="image-section">
                <h3>Identificación Adjunta</h3>
                <img src={reporte.ineURL} alt="Identificación" className="report-image" />
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={handleDelete} className="delete-button">Eliminar Reporte</button>
            <button type="submit" className="submit-button">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </>
  );
}