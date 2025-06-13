// src/components/DetalleReporte/DetalleReporte.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp, collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import './newcss/DetalleReporte.css'; // Usando la ruta que me proporcionaste

export default function DetalleReporte() {
  const { reporteId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [reporte, setReporte] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    estatus: '',
    localidad: '',
    direccion: '',
    origenReporte: '',
    peticion: '',
    fecha: '',
    hora: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImageFileName, setNewImageFileName] = useState('');

  // Estados y Refs para los Dropdowns
  const [localidadesOptions, setLocalidadesOptions] = useState([]);
  const [localidadSearchTerm, setLocalidadSearchTerm] = useState("");
  const [isLocalidadListOpen, setIsLocalidadListOpen] = useState(false);
  const localidadDropdownRef = useRef(null);

  const [direccionesOptions, setDireccionesOptions] = useState([]);
  const [direccionSearchTerm, setDireccionSearchTerm] = useState("");
  const [isDireccionListOpen, setIsDireccionListOpen] = useState(false);
  const direccionDropdownRef = useRef(null);

  useEffect(() => {
    const fetchReporte = async () => {
      setIsLoading(true);
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
            origenReporte: data.origenReporte || '',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setNewImageFileName(file.name);
    }
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
    setIsLoading(true);
    const docRef = doc(db, 'peticiones', reporteId);
    
    try {
      let datosActualizados = { ...formData };
      
      if (newImageFile) {
        if (reporte.ineURL) {
          try {
            const oldImageRef = ref(storage, reporte.ineURL);
            await deleteObject(oldImageRef);
          } catch (deleteError) {
            console.warn("No se pudo borrar la imagen antigua:", deleteError);
          }
        }
        
        const newImageStorageRef = ref(storage, `peticiones_ines/${Date.now()}_${newImageFile.name}`);
        await uploadBytes(newImageStorageRef, newImageFile);
        
        const newUrl = await getDownloadURL(newImageStorageRef);
        datosActualizados.ineURL = newUrl;
      }

      const localidadFinal = formData.localidad.trim();
      const direccionFinal = formData.direccion.trim();

      if (localidadFinal && !localidadesOptions.some(loc => loc.toLowerCase() === localidadFinal.toLowerCase())) {
        await addDoc(collection(db, 'localidades'), { nombre: localidadFinal });
      }
      if (direccionFinal && !direccionesOptions.some(dir => dir.toLowerCase() === direccionFinal.toLowerCase())) {
        await addDoc(collection(db, 'direcciones'), { nombre: direccionFinal });
      }

      datosActualizados.fecha = Timestamp.fromDate(new Date(`${formData.fecha}T${formData.hora || '00:00:00'}`));

      await updateDoc(docRef, datosActualizados);
      
      alert("¡Reporte actualizado con éxito!");
      navigate('/ver-reportes');

    } catch (error) {
      console.error("Error al actualizar el documento: ", error);
      alert("Ocurrió un error al actualizar.");
    } finally {
      setIsLoading(false);
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


  if (isLoading) return <div className="loading-container">Cargando...</div>;
  if (reporte === false) return <div><h1>Reporte no encontrado</h1><Link to="/ver-reportes">Volver a la lista</Link></div>;

  return (
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
            <label htmlFor="origenReporte">Origen del Reporte/Petición</label>
            <select id="origenReporte" name="origenReporte" value={formData.origenReporte} onChange={handleChange} className="form-select">
              <option value="">-- Selecciona un origen --</option>
              <option value="Red Social">Red Social</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Recomendación">Recomendación</option>
              <option value="Otro">Otro</option>
            </select>
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
        <div className="image-section">
            <h3>Identificación Adjunta</h3>
            {reporte?.ineURL ? (
              <img src={reporte.ineURL} alt="Identificación" className="report-image" />
            ) : (
              <p>No hay imagen adjunta.</p>
            )}
            <div className="form-group" style={{marginTop: '1rem'}}>
                <label htmlFor="ineFile">Reemplazar Identificación (Opcional)</label>
                <input 
                  type="file" 
                  id="ineFile" 
                  name="ineFile" 
                  onChange={handleNewImageChange} 
                  accept="image/*,.pdf" 
                  className="form-input"
                />
                {newImageFileName && <p className="file-name-display">Nuevo archivo: {newImageFileName}</p>}
            </div>
        </div>
        <div className="form-actions">
          {currentUser && (
            <>
              <button type="button" onClick={handleDelete} className="delete-button">Eliminar Reporte</button>
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}