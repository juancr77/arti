import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Importamos más funciones de Firestore
import { db, storage } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './FormularioPeticion.css';

const SpinnerIcon = () => (
  <svg className="spinner-icon" viewBox="0 0 50 50">
    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
  </svg>
);

export default function FormularioPeticion() {

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    localidad: '',
    direccion: '', 
    colonia: '',
    calle: '',
    numeroExterior: '',
    entreCalle1: '',
    entreCalle2: '',
    estructura: 'no',
    origenReporte: '',
    peticion: '',
    hora: '',
    fechaReporte: getTodayDateString(),
  });
  const [ineFile, setIneFile] = useState(null);
  const [ineFileName, setIneFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
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
  
  useEffect(() => {
    const fetchCollectionData = async (collectionName, setData) => {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const data = querySnapshot.docs.map(doc => doc.data().nombre).sort((a, b) => a.localeCompare(b));
            setData(data);
        } catch (error) {
            console.error(`Error cargando ${collectionName}: `, error);
        }
    };

    fetchCollectionData("localidades", setLocalidadesOptions);
    fetchCollectionData("direcciones", setDireccionesOptions);
    fetchCollectionData("calles", setCallesOptions);
    fetchCollectionData("colonias", setColoniasOptions);
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
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setIneFile(file); setIneFileName(file.name); } 
    else { setIneFile(null); setIneFileName(''); }
  };
  
  const handleLocalidadSelect = (selected) => { setFormData(prevData => ({ ...prevData, localidad: selected })); setIsLocalidadListOpen(false); setLocalidadSearchTerm(""); };
  const handleDireccionSelect = (selected) => { setFormData(prevData => ({ ...prevData, direccion: selected })); setIsDireccionListOpen(false); setDireccionSearchTerm(""); };
  const handleColoniaSelect = (selected) => { setFormData(prevData => ({ ...prevData, colonia: selected })); setIsColoniaListOpen(false); setColoniaSearchTerm(""); };
  const handleCalleSelect = (selected) => { setFormData(prevData => ({ ...prevData, calle: selected })); setIsCalleListOpen(false); setCalleSearchTerm(""); };
  const handleEntreCalle1Select = (selected) => { setFormData(prevData => ({ ...prevData, entreCalle1: selected })); setIsEntreCalle1ListOpen(false); setEntreCalle1SearchTerm(""); };
  const handleEntreCalle2Select = (selected) => { setFormData(prevData => ({ ...prevData, entreCalle2: selected })); setIsEntreCalle2ListOpen(false); setEntreCalle2SearchTerm(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.localidad || !formData.direccion || !formData.fechaReporte) {
        setMessage({ type: 'error', text: 'Por favor, completa los campos con asterisco (*).' });
        return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      let ineURL = ''; 
      if (ineFile) {
        const ineStorageRef = ref(storage, `peticiones_ines/${Date.now()}_${ineFile.name}`);
        await uploadBytes(ineStorageRef, ineFile);
        ineURL = await getDownloadURL(ineStorageRef);
      }
      
      const peticionParaGuardar = {
        ...formData,
        ineURL: ineURL,
        fechaCreacion: serverTimestamp(),
        fecha: new Date(`${formData.fechaReporte}T${formData.hora || '00:00:00'}`),
        estatus: 'pendiente', 
      };
      
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
      await addNewValueToCollection('numExt', formData.numeroExterior); // Guardar el número exterior

      await addDoc(collection(db, 'peticiones'), peticionParaGuardar);
      setMessage({ type: 'success', text: '¡Listo! el reporte se ha registrado exitosamente.' });
      setFormData({
        nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '',
        localidad: '', direccion: '', estructura: 'no', origenReporte: '', peticion: '',
        hora: '', fechaReporte: getTodayDateString(),
        colonia: '', calle: '', numeroExterior: '', entreCalle1: '', entreCalle2: ''
      });
      setIneFile(null); setIneFileName('');
    } catch (error) {
      console.error("Error al registrar el Reporte: ", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al registrar el reporte.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocalidades = localidadesOptions.filter(loc => loc.toLowerCase().includes(localidadSearchTerm.toLowerCase()));
  const filteredDirecciones = direccionesOptions.filter(dir => dir.toLowerCase().includes(direccionSearchTerm.toLowerCase()));
  const filteredColonias = coloniasOptions.filter(col => col.toLowerCase().includes(coloniaSearchTerm.toLowerCase()));
  const filteredCalles = callesOptions.filter(c => c.toLowerCase().includes(calleSearchTerm.toLowerCase()));
  const filteredEntreCalles1 = callesOptions.filter(c => c.toLowerCase().includes(entreCalle1SearchTerm.toLowerCase()));
  const filteredEntreCalles2 = callesOptions.filter(c => c.toLowerCase().includes(entreCalle2SearchTerm.toLowerCase()));

  return (
    <>
      <div className="form-peticion-container">
        <div className="form-header">
          <h2 className="form-title">Registrar un Nuevo Reporte</h2>
          <Link to="/" className="back-link">← Volver al Inicio</Link>
        </div>

        <form onSubmit={handleSubmit} className="peticion-form" autoComplete="off">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="nombres">Nombre(s)*</label>
                <input type="text" id="nombres" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Ej: Juan" required className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="apellidoPaterno">Apellido Paterno*</label>
                <input type="text" id="apellidoPaterno" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} placeholder="Ej: Pérez" required className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="apellidoMaterno">Apellido Materno</label>
                <input type="text" id="apellidoMaterno" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} placeholder="Ej: García" className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Teléfono*</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 844 123 4567" required className="form-input" />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="fechaReporte">Fecha del Reporte*</label>
                <input type="date" id="fechaReporte" name="fechaReporte" value={formData.fechaReporte} onChange={handleChange} required className="form-input" />
              </div>
              <div className="form-group searchable-dropdown" ref={direccionDropdownRef}>
                <label>Dirección a la que Pertenece*</label>
                <button type="button" className={`dropdown-toggle ${!formData.direccion ? 'placeholder' : ''}`} onClick={() => setIsDireccionListOpen(!isDireccionListOpen)}>
                  {formData.direccion || "Selecciona una dirección"}
                </button>
                {isDireccionListOpen && (
                  <div className="suggestions-list">
                    <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir dirección..." value={direccionSearchTerm} onChange={(e) => setDireccionSearchTerm(e.target.value)} autoFocus />
                    <div className="suggestion-items-container">
                      {filteredDirecciones.map(dir => ( <div key={dir} className="suggestion-item" onClick={() => handleDireccionSelect(dir)}>{dir}</div> ))}
                      {filteredDirecciones.length === 0 && direccionSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleDireccionSelect(direccionSearchTerm)}>Añadir nueva: "{direccionSearchTerm}"</div> )}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group searchable-dropdown" ref={localidadDropdownRef}>
                <label>Localidad*</label>
                <button type="button" className={`dropdown-toggle ${!formData.localidad ? 'placeholder' : ''}`} onClick={() => setIsLocalidadListOpen(!isLocalidadListOpen)}>
                  {formData.localidad || "Selecciona una localidad"}
                </button>
                {isLocalidadListOpen && (
                  <div className="suggestions-list">
                    <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir localidad..." value={localidadSearchTerm} onChange={(e) => setLocalidadSearchTerm(e.target.value)} autoFocus />
                    <div className="suggestion-items-container">
                      {filteredLocalidades.map(loc => ( <div key={loc} className="suggestion-item" onClick={() => handleLocalidadSelect(loc)}>{loc}</div> ))}
                      {filteredLocalidades.length === 0 && localidadSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleLocalidadSelect(localidadSearchTerm)}>Añadir nueva: "{localidadSearchTerm}"</div> )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-grid-3-col full-width-group">
            <div className="form-group searchable-dropdown" ref={coloniaDropdownRef}>
              <label>Colonia o Fraccionamiento</label>
              <button type="button" className={`dropdown-toggle ${!formData.colonia ? 'placeholder' : ''}`} onClick={() => setIsColoniaListOpen(!isColoniaListOpen)}>
                {formData.colonia || "Selecciona una colonia"}
              </button>
              {isColoniaListOpen && (
                <div className="suggestions-list">
                  <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={coloniaSearchTerm} onChange={(e) => setColoniaSearchTerm(e.target.value)} autoFocus />
                  <div className="suggestion-items-container">
                    {filteredColonias.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleColoniaSelect(c)}>{c}</div> ))}
                    {filteredColonias.length === 0 && coloniaSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleColoniaSelect(coloniaSearchTerm)}>Añadir nueva: "{coloniaSearchTerm}"</div> )}
                  </div>
                </div>
              )}
            </div>
            <div className="form-group searchable-dropdown" ref={calleDropdownRef}>
              <label>Calle</label>
              <button type="button" className={`dropdown-toggle ${!formData.calle ? 'placeholder' : ''}`} onClick={() => setIsCalleListOpen(!isCalleListOpen)}>
                {formData.calle || "Selecciona una calle"}
              </button>
              {isCalleListOpen && (
                <div className="suggestions-list">
                  <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={calleSearchTerm} onChange={(e) => setCalleSearchTerm(e.target.value)} autoFocus />
                  <div className="suggestion-items-container">
                    {filteredCalles.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleCalleSelect(c)}>{c}</div> ))}
                    {filteredCalles.length === 0 && calleSearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleCalleSelect(calleSearchTerm)}>Añadir nueva: "{calleSearchTerm}"</div> )}
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
                    <label htmlFor="entreCalle1">Calle 1</label>
                    <button type="button" className={`dropdown-toggle ${!formData.entreCalle1 ? 'placeholder' : ''}`} onClick={() => setIsEntreCalle1ListOpen(!isEntreCalle1ListOpen)}>
                      {formData.entreCalle1 || "Selecciona una calle"}
                    </button>
                    {isEntreCalle1ListOpen && (
                      <div className="suggestions-list">
                        <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={entreCalle1SearchTerm} onChange={(e) => setEntreCalle1SearchTerm(e.target.value)} autoFocus />
                        <div className="suggestion-items-container">
                          {filteredEntreCalles1.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleEntreCalle1Select(c)}>{c}</div> ))}
                          {filteredEntreCalles1.length === 0 && entreCalle1SearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleEntreCalle1Select(entreCalle1SearchTerm)}>Añadir nueva: "{entreCalle1SearchTerm}"</div> )}
                        </div>
                      </div>
                    )}
                </div>
                <div className="form-group searchable-dropdown" ref={entreCalle2DropdownRef}>
                    <label htmlFor="entreCalle2">Calle 2</label>
                    <button type="button" className={`dropdown-toggle ${!formData.entreCalle2 ? 'placeholder' : ''}`} onClick={() => setIsEntreCalle2ListOpen(!isEntreCalle2ListOpen)}>
                      {formData.entreCalle2 || "Selecciona una calle"}
                    </button>
                    {isEntreCalle2ListOpen && (
                      <div className="suggestions-list">
                        <input type="text" className="suggestion-search-input" placeholder="Buscar o añadir..." value={entreCalle2SearchTerm} onChange={(e) => setEntreCalle2SearchTerm(e.target.value)} autoFocus />
                        <div className="suggestion-items-container">
                          {filteredEntreCalles2.map(c => ( <div key={c} className="suggestion-item" onClick={() => handleEntreCalle2Select(c)}>{c}</div> ))}
                          {filteredEntreCalles2.length === 0 && entreCalle2SearchTerm && ( <div className="suggestion-item add-new" onClick={() => handleEntreCalle2Select(entreCalle2SearchTerm)}>Añadir nueva: "{entreCalle2SearchTerm}"</div> )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
          </div>
          
          <div className="form-group full-width-group">
            <label>¿Es referente a una Estructura?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="estructura" value="si" checked={formData.estructura === 'si'} onChange={handleChange} /> Sí</label>
              <label className="radio-label"><input type="radio" name="estructura" value="no" checked={formData.estructura === 'no'} onChange={handleChange} /> No</label>
            </div>
          </div>

          <div className="form-group full-width-group">
            <label htmlFor="origenReporte">Origen del Reporte/Petición</label>
            <select id="origenReporte" name="origenReporte" value={formData.origenReporte} onChange={handleChange} className="form-select">
              <option value="">-- ¿Por que medio Reporto? --</option>
              {['Red Social', 'WhatsApp', 'Recomendación', 'Otro'].map(origen => <option key={origen} value={origen}>{origen}</option>)}
            </select>
          </div>
          
          <div className="form-group full-width-group">
             <label htmlFor="hora">Hora del Registro*</label>
             <input type="time" id="hora" name="hora" value={formData.hora} onChange={handleChange} required className="form-input" />
          </div>

          <div className="form-group full-width-group">
            <label htmlFor="peticion">Descripción del Reporte*</label>
            <textarea id="peticion" name="peticion" value={formData.peticion} onChange={handleChange} placeholder="Detalla aquí la solicitud o reporte..." rows="4" required className="form-textarea" />
          </div>
          <div className="form-group full-width-group">
            <label htmlFor="ineFile">Adjuntar INE/Identificación (Opcional)</label>
            <input type="file" id="ineFile" name="ineFile" onChange={handleFileChange} accept="image/*,.pdf" className="form-file-input" />
            {ineFileName && <p className="file-name-display">Archivo seleccionado: {ineFileName}</p>}
          </div>
          <div className="form-actions">
            <button type="submit" disabled={isLoading} className="submit-button">
              {isLoading ? (<><SpinnerIcon />Enviando...</>) : ('Registrar Reporte')}
            </button>
          </div>
          {message.text && (<div className={`message-display ${message.type}`}>{message.text}</div>)}
        </form>
      </div>
    </>
  );
}
