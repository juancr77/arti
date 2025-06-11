import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Importaciones de Firebase desde tu archivo centralizado
import { db, storage } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Icono de Spinner (SVG simple) ---
const SpinnerIcon = () => (
  <svg className="spinner-icon" viewBox="0 0 50 50">
    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
  </svg>
);

// --- Componente con el nombre correcto ---
export default function FormularioPeticion() {

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Enero es 0
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    localidad: '',
    direccion: '', // NUEVO
    estructura: 'no',
    origenReporte: '',
    peticion: '',
    hora: '',
    fechaReporte: getTodayDateString(), // NUEVO
  });
  const [ineFile, setIneFile] = useState(null);
  const [ineFileName, setIneFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para la búsqueda de localidades
  const [localidadesOptions, setLocalidadesOptions] = useState([]);
  const [localidadSearchTerm, setLocalidadSearchTerm] = useState("");
  const [isLocalidadListOpen, setIsLocalidadListOpen] = useState(false);
  const localidadDropdownRef = useRef(null);

  // NUEVO: Estados para la búsqueda de direcciones
  const [direccionesOptions, setDireccionesOptions] = useState([]);
  const [direccionSearchTerm, setDireccionSearchTerm] = useState("");
  const [isDireccionListOpen, setIsDireccionListOpen] = useState(false);
  const direccionDropdownRef = useRef(null);


  // --- EFECTOS ---
  // Cargar localidades al inicio
  useEffect(() => {
    const fetchLocalidades = async () => {
      try {
        const localidadesCollection = collection(db, "localidades");
        const querySnapshot = await getDocs(localidadesCollection);
        const localidadesData = querySnapshot.docs.map(doc => doc.data().nombre);
        localidadesData.sort((a, b) => a.localeCompare(b));
        setLocalidadesOptions(localidadesData);
      } catch (error) {
        console.error("Error cargando localidades: ", error);
      }
    };
    fetchLocalidades();
  }, []); 

  // NUEVO: Cargar direcciones al inicio
  useEffect(() => {
    const fetchDirecciones = async () => {
      try {
        const direccionesCollection = collection(db, "direcciones");
        const querySnapshot = await getDocs(direccionesCollection);
        const direccionesData = querySnapshot.docs.map(doc => doc.data().nombre);
        direccionesData.sort((a, b) => a.localeCompare(b));
        setDireccionesOptions(direccionesData);
      } catch (error) {
        console.error("Error cargando direcciones: ", error);
      }
    };
    fetchDirecciones();
  }, []);

  // Cerrar el dropdown de localidad si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (localidadDropdownRef.current && !localidadDropdownRef.current.contains(event.target)) {
        setIsLocalidadListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [localidadDropdownRef]);

  // NUEVO: Cerrar el dropdown de dirección si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (direccionDropdownRef.current && !direccionDropdownRef.current.contains(event.target)) {
        setIsDireccionListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [direccionDropdownRef]);


  // --- MANEJADORES DE EVENTOS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setIneFile(file); setIneFileName(file.name); } 
    else { setIneFile(null); setIneFileName(''); }
  };
  
  const handleLocalidadSelect = (selectedLocalidad) => {
    setFormData(prevData => ({ ...prevData, localidad: selectedLocalidad }));
    setIsLocalidadListOpen(false);
    setLocalidadSearchTerm("");
  };

  // NUEVO: Handler para seleccionar dirección
  const handleDireccionSelect = (selectedDireccion) => {
    setFormData(prevData => ({ ...prevData, direccion: selectedDireccion }));
    setIsDireccionListOpen(false);
    setDireccionSearchTerm("");
  };

  // MODIFICADO: handleSubmit para incluir los nuevos campos
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
      
      const localidadFinal = formData.localidad.trim();
      const direccionFinal = formData.direccion.trim();
      
      const peticionParaGuardar = {
        nombres: formData.nombres,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno,
        telefono: formData.telefono,
        localidad: localidadFinal,
        direccion: direccionFinal,
        estructura: formData.estructura,
        origenReporte: formData.origenReporte,
        peticion: formData.peticion,
        hora: formData.hora,
        ineURL: ineURL,
        fecha: new Date(`${formData.fechaReporte}T${formData.hora || '00:00:00'}`), // Combina fecha y hora seleccionadas
        fechaCreacion: serverTimestamp(), // Fecha en que se guarda en la BD
        estatus: 'pendiente', 
      };
      
      if (localidadFinal && !localidadesOptions.some(loc => loc.toLowerCase() === localidadFinal.toLowerCase())) {
        await addDoc(collection(db, 'localidades'), { nombre: localidadFinal });
      }

      if (direccionFinal && !direccionesOptions.some(dir => dir.toLowerCase() === direccionFinal.toLowerCase())) {
        await addDoc(collection(db, 'direcciones'), { nombre: direccionFinal });
      }

      await addDoc(collection(db, 'peticiones'), peticionParaGuardar);
      setMessage({ type: 'success', text: '¡Listo! el reporte se ha registrado exitosamente.' });
      setFormData({
        nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '',
        localidad: '', direccion: '', estructura: 'no', origenReporte: '', peticion: '',
        hora: '', fechaReporte: getTodayDateString(),
      });
      setIneFile(null); setIneFileName('');
      if (document.getElementById('ineFile')) document.getElementById('ineFile').value = null;
    } catch (error) {
      console.error("Error al registrar el Reporte: ", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al registrar el reporte.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocalidades = localidadesOptions.filter(loc => loc.toLowerCase().includes(localidadSearchTerm.toLowerCase()));
  const filteredDirecciones = direccionesOptions.filter(dir => dir.toLowerCase().includes(direccionSearchTerm.toLowerCase()));

  return (
    <>
      <style>{`
        .searchable-dropdown { position: relative; }
        .dropdown-toggle { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; text-align: left; background-color: white; cursor: pointer; }
        .dropdown-toggle.placeholder { color: #6c757d; }
        .suggestions-list { position: absolute; background-color: white; border: 1px solid #ddd; border-radius: 6px; width: 100%; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .suggestion-search-input { width: 100%; padding: 0.75rem; border: none; border-bottom: 1px solid #ddd; border-radius: 6px 6px 0 0; font-size: 1rem; box-sizing: border-box; }
        .suggestion-items-container { max-height: 200px; overflow-y: auto; }
        .suggestion-item { padding: 10px; cursor: pointer; color: #333; }
        .suggestion-item:hover { background-color: #f0f0f0; }
        .suggestion-item.add-new { color: #007bff; font-style: italic; }
        .form-peticion-container { max-width: 800px; margin: 2rem auto; padding: 2rem; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
        .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
        .form-title { text-align: left; margin-bottom: 0; }
        .back-link { text-decoration: none; background-color: #f0f0f0; padding: 0.5rem 1rem; border-radius: 6px; color: #333; font-weight: 500; border: 1px solid #ddd; }
        .back-link:hover { background-color: #e2e6ea; }
        .peticion-form .form-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 768px) { .peticion-form .form-grid { grid-template-columns: repeat(2, 1fr); } }
        .form-column { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { margin-bottom: 0.5rem; color: #555; font-weight: 500; }
        .form-input, .form-select, .form-textarea, .form-file-input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); }
        .form-textarea { resize: vertical; min-height: 80px; }
        .radio-group { display: flex; gap: 1rem; align-items: center; margin-top: 0.3rem; }
        .radio-label { display: flex; align-items: center; gap: 0.3rem; font-weight: normal; }
        .file-name-display { font-size: 0.85rem; color: #666; margin-top: 0.5rem; }
        .form-actions { margin-top: 2rem; text-align: center; }
        .submit-button { background-color: #007bff; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 500; cursor: pointer; }
        .spinner-icon { animation: rotate 1s linear infinite; width: 1.2em; height: 1.2em; margin-right: 0.5em; }
        .message-display { padding: 0.8rem 1rem; margin-top: 1.5rem; border-radius: 6px; text-align: center; }
        .message-display.success { background-color: #d4edda; color: #155724; }
        .message-display.error { background-color: #f8d7da; color: #721c24; }
        .full-width-group { grid-column: 1 / -1; }
      `}</style>
      
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
                      {filteredDirecciones.map(dir => (
                        <div key={dir} className="suggestion-item" onClick={() => handleDireccionSelect(dir)}>
                          {dir}
                        </div>
                      ))}
                      {filteredDirecciones.length === 0 && direccionSearchTerm && (
                        <div className="suggestion-item add-new" onClick={() => handleDireccionSelect(direccionSearchTerm)}>
                          Añadir nueva: "{direccionSearchTerm}"
                        </div>
                      )}
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
                      {filteredLocalidades.map(loc => (
                        <div key={loc} className="suggestion-item" onClick={() => handleLocalidadSelect(loc)}>
                          {loc}
                        </div>
                      ))}
                      {filteredLocalidades.length === 0 && localidadSearchTerm && (
                         <div className="suggestion-item add-new" onClick={() => handleLocalidadSelect(localidadSearchTerm)}>
                            Añadir nueva: "{localidadSearchTerm}"
                          </div>
                      )}
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