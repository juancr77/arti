import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import './newcss/DetalleReporte.css';

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
    colonia: '',
    calle: '',
    numeroExterior: '',
    entreCalle1: '',
    entreCalle2: '',
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
  
  const [coloniasOptions, setColoniasOptions] = useState([]);
  const [coloniaSearchTerm, setColoniaSearchTerm] = useState("");
  const [isColoniaListOpen, setIsColoniaListOpen] = useState(false);
  const coloniaDropdownRef = useRef(null);

  const [callesOptions, setCallesOptions] = useState([]);
  const [calleSearchTerm, setCalleSearchTerm] = useState("");
  const [isCalleListOpen, setIsCalleListOpen] = useState(false);
  const calleDropdownRef = useRef(null);

  const [entreCalle1SearchTerm, setEntreCalle1SearchTerm] = useState("");
  const [isEntreCalle1ListOpen, setIsEntreCalle1ListOpen] = useState(false);
  const entreCalle1DropdownRef = useRef(null);

  const [entreCalle2SearchTerm, setEntreCalle2SearchTerm] = useState("");
  const [isEntreCalle2ListOpen, setIsEntreCalle2ListOpen] = useState(false);
  const entreCalle2DropdownRef = useRef(null);

  // --- EFECTOS ---
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
            colonia: data.colonia || '',
            calle: data.calle || '',
            numeroExterior: data.numeroExterior || '',
            entreCalle1: data.entreCalle1 || '',
            entreCalle2: data.entreCalle2 || '',
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
      } catch (error) { console.error(`Error cargando ${collectionName}: `, error); }
    };
    fetchDropdownData('localidades', setLocalidadesOptions);
    fetchDropdownData('direcciones', setDireccionesOptions);
    fetchDropdownData('colonias', setColoniasOptions);
    fetchDropdownData('calles', setCallesOptions);
    fetchDropdownData('numExt', () => {}); // Placeholder, ya que numExt no es un dropdown
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (localidadDropdownRef.current && !localidadDropdownRef.current.contains(event.target)) setIsLocalidadListOpen(false);
      if (direccionDropdownRef.current && !direccionDropdownRef.current.contains(event.target)) setIsDireccionListOpen(false);
      if (coloniaDropdownRef.current && !coloniaDropdownRef.current.contains(event.target)) setIsColoniaListOpen(false);
      if (calleDropdownRef.current && !calleDropdownRef.current.contains(event.target)) setIsCalleListOpen(false);
      if (entreCalle1DropdownRef.current && !entreCalle1DropdownRef.current.contains(event.target)) setIsEntreCalle1ListOpen(false);
      if (entreCalle2DropdownRef.current && !entreCalle2DropdownRef.current.contains(event.target)) setIsEntreCalle2ListOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MANEJADORES DE EVENTOS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setNewImageFile(file); setNewImageFileName(file.name); }
  };
  const handleLocalidadSelect = (selected) => { setFormData(prevData => ({ ...prevData, localidad: selected })); setIsLocalidadListOpen(false); setLocalidadSearchTerm(""); };
  const handleDireccionSelect = (selected) => { setFormData(prevData => ({ ...prevData, direccion: selected })); setIsDireccionListOpen(false); setDireccionSearchTerm(""); };
  const handleColoniaSelect = (selected) => { setFormData(prevData => ({ ...prevData, colonia: selected })); setIsColoniaListOpen(false); setColoniaSearchTerm(""); };
  const handleCalleSelect = (selected) => { setFormData(prevData => ({ ...prevData, calle: selected })); setIsCalleListOpen(false); setCalleSearchTerm(""); };
  const handleEntreCalle1Select = (selected) => { setFormData(prevData => ({ ...prevData, entreCalle1: selected })); setIsEntreCalle1ListOpen(false); setEntreCalle1SearchTerm(""); };
  const handleEntreCalle2Select = (selected) => { setFormData(prevData => ({ ...prevData, entreCalle2: selected })); setIsEntreCalle2ListOpen(false); setEntreCalle2SearchTerm(""); };

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

      const addNewValueToCollection = async (collectionName, value) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return;
        const q = query(collection(db, collectionName), where("nombre", "==", trimmedValue));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          await addDoc(collection(db, collectionName), { nombre: trimmedValue });
        }
      };

      await addNewValueToCollection('localidades', formData.localidad);
      await addNewValueToCollection('direcciones', formData.direccion);
      await addNewValueToCollection('colonias', formData.colonia);
      await addNewValueToCollection('calles', formData.calle);
      await addNewValueToCollection('calles', formData.entreCalle1);
      await addNewValueToCollection('calles', formData.entreCalle2);
      await addNewValueToCollection('numExt', formData.numeroExterior);

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
      } catch (error) { console.error("Error al eliminar el documento: ", error); }
    }
  };
  
  const filteredLocalidades = localidadesOptions.filter(loc => loc.toLowerCase().includes(localidadSearchTerm.toLowerCase()));
  const filteredDirecciones = direccionesOptions.filter(dir => dir.toLowerCase().includes(direccionSearchTerm.toLowerCase()));
  const filteredColonias = coloniasOptions.filter(col => col.toLowerCase().includes(coloniaSearchTerm.toLowerCase()));
  const filteredCalles = callesOptions.filter(c => c.toLowerCase().includes(calleSearchTerm.toLowerCase()));
  const filteredEntreCalles1 = callesOptions.filter(c => c.toLowerCase().includes(entreCalle1SearchTerm.toLowerCase()));
  const filteredEntreCalles2 = callesOptions.filter(c => c.toLowerCase().includes(entreCalle2SearchTerm.toLowerCase()));

  if (isLoading) return <div className="loading-container">Cargando...</div>;
  if (!reporte) return <div><h1>Reporte no encontrado</h1><Link to="/ver-reportes">Volver a la lista</Link></div>;

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <h2>Editar Reporte</h2>
        <Link to="/ver-reportes" className="back-link">← Volver</Link>
      </div>
      
      <form onSubmit={handleUpdate} className="edit-form">
        {/* --- SECCIÓN RESTAURADA --- */}
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
        </div>

        <div className="form-grid-3-col full-width-group">
          <div className="form-group searchable-dropdown" ref={coloniaDropdownRef}>
            <label>Colonia o Fraccionamiento</label>
            <button type="button" className={`dropdown-toggle ${!formData.colonia ? 'placeholder' : ''}`} onClick={() => setIsColoniaListOpen(!isColoniaListOpen)}>
              {formData.colonia || "Selecciona"}
            </button>
            {isColoniaListOpen && (
              <div className="suggestions-list">
                <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={coloniaSearchTerm} onChange={(e) => setColoniaSearchTerm(e.target.value)} autoFocus />
                <div className="suggestion-items-container">
                  {filteredColonias.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleColoniaSelect(c)}>{c}</div> ))}
                  {filteredColonias.length === 0 && coloniaSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleColoniaSelect(coloniaSearchTerm)}>Añadir: "{coloniaSearchTerm}"</div> )}
                </div>
              </div>
            )}
          </div>
          <div className="form-group searchable-dropdown" ref={calleDropdownRef}>
            <label>Calle</label>
            <button type="button" className={`dropdown-toggle ${!formData.calle ? 'placeholder' : ''}`} onClick={() => setIsCalleListOpen(!isCalleListOpen)}>
              {formData.calle || "Selecciona"}
            </button>
            {isCalleListOpen && (
              <div className="suggestions-list">
                <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={calleSearchTerm} onChange={(e) => setCalleSearchTerm(e.target.value)} autoFocus />
                <div className="suggestion-items-container">
                  {filteredCalles.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleCalleSelect(c)}>{c}</div> ))}
                  {filteredCalles.length === 0 && calleSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleCalleSelect(calleSearchTerm)}>Añadir: "{calleSearchTerm}"</div> )}
                </div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="numeroExterior">Número Ext.</label>
            <input type="text" id="numeroExterior" name="numeroExterior" value={formData.numeroExterior} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <div className="full-width-group">
          <label className="group-label">Ubicación (entre qué calles)</label>
          <div className="form-grid">
            <div className="form-group searchable-dropdown" ref={entreCalle1DropdownRef}>
              <label>Calle 1</label>
              <button type="button" className={`dropdown-toggle ${!formData.entreCalle1 ? 'placeholder' : ''}`} onClick={() => setIsEntreCalle1ListOpen(!isEntreCalle1ListOpen)}>
                {formData.entreCalle1 || "Selecciona"}
              </button>
              {isEntreCalle1ListOpen && (
                <div className="suggestions-list">
                  <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={entreCalle1SearchTerm} onChange={(e) => setEntreCalle1SearchTerm(e.target.value)} autoFocus />
                  <div className="suggestion-items-container">
                    {filteredEntreCalles1.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleEntreCalle1Select(c)}>{c}</div> ))}
                    {filteredEntreCalles1.length === 0 && entreCalle1SearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleEntreCalle1Select(entreCalle1SearchTerm)}>Añadir: "{entreCalle1SearchTerm}"</div> )}
                  </div>
                </div>
              )}
            </div>
            <div className="form-group searchable-dropdown" ref={entreCalle2DropdownRef}>
              <label>Calle 2</label>
              <button type="button" className={`dropdown-toggle ${!formData.entreCalle2 ? 'placeholder' : ''}`} onClick={() => setIsEntreCalle2ListOpen(!isEntreCalle2ListOpen)}>
                {formData.entreCalle2 || "Selecciona"}
              </button>
              {isEntreCalle2ListOpen && (
                <div className="suggestions-list">
                  <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={entreCalle2SearchTerm} onChange={(e) => setEntreCalle2SearchTerm(e.target.value)} autoFocus />
                  <div className="suggestion-items-container">
                    {filteredEntreCalles2.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleEntreCalle2Select(c)}>{c}</div> ))}
                    {filteredEntreCalles2.length === 0 && entreCalle2SearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleEntreCalle2Select(entreCalle2SearchTerm)}>Añadir: "{entreCalle2SearchTerm}"</div> )}
                  </div>
                </div>
              )}
            </div>
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
            ) : ( <p>No hay imagen adjunta.</p> )}
            <div className="form-group" style={{marginTop: '1rem'}}>
                <label htmlFor="ineFile">Reemplazar Identificación (Opcional)</label>
                <input type="file" id="ineFile" name="ineFile" onChange={handleNewImageChange} accept="image/*,.pdf" className="form-input" />
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
