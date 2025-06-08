import React, { useState, useEffect, useRef } from 'react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Icono de Spinner (SVG simple) ---
const SpinnerIcon = () => (
  <svg className="spinner-icon" viewBox="0 0 50 50">
    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
  </svg>
);

// --- Configuración e Inicialización de Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDqRhkctzLU7t-mrQj__i9HfkV9fWKPCmM",
  authDomain: "peticionesa-44953.firebaseapp.com",
  projectId: "peticionesa-44953",
  storageBucket: "peticionesa-44953.firebasestorage.app",
  messagingSenderId: "682047899464",
  appId: "1:682047899464:web:77f06f7d5299762947157d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);


// --- Componente Principal y Unificado ---
export default function App() {
  
  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    localidad: '',
    estructura: 'no',
    origenReporte: '',
    peticion: '',
    hora: '',
  });
  const [ineFile, setIneFile] = useState(null);
  const [ineFileName, setIneFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para la búsqueda de localidades
  const [localidadesOptions, setLocalidadesOptions] = useState([]);
  const [localidadSearchTerm, setLocalidadSearchTerm] = useState("");
  const [isLocalidadListOpen, setIsLocalidadListOpen] = useState(false);
  const dropdownRef = useRef(null);


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

  // Cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLocalidadListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


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
  
  // Cuando se selecciona una localidad de la lista
  const handleLocalidadSelect = (selectedLocalidad) => {
    setFormData(prevData => ({ ...prevData, localidad: selectedLocalidad }));
    setIsLocalidadListOpen(false); // Cerramos la lista
    setLocalidadSearchTerm(""); // Limpiamos el término de búsqueda
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.localidad) {
        setMessage({ type: 'error', text: 'Por favor, selecciona o añade una localidad.' });
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
      
      const peticionParaGuardar = {
        nombres: formData.nombres, apellidoPaterno: formData.apellidoPaterno, apellidoMaterno: formData.apellidoMaterno,
        telefono: formData.telefono, localidad: localidadFinal, estructura: formData.estructura, origenReporte: formData.origenReporte,
        peticion: formData.peticion, hora: formData.hora, ineURL: ineURL, fecha: serverTimestamp(), estatus: 'pendiente', 
      };
      
      if (localidadFinal) {
        const existe = localidadesOptions.some(loc => loc.toLowerCase() === localidadFinal.toLowerCase());
        if (!existe) {
          await addDoc(collection(db, 'localidades'), { nombre: localidadFinal });
        }
      }

      await addDoc(collection(db, 'peticiones'), peticionParaGuardar);
      setMessage({ type: 'success', text: '¡Listo! el reporte se a registrado exitosamente.' });
      setFormData({
        nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '',
        localidad: '', estructura: 'no', origenReporte: '', peticion: '', hora: '',
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

  // Filtrar localidades basadas en el término de búsqueda
  const filteredLocalidades = localidadSearchTerm
    ? localidadesOptions.filter(loc =>
        loc.toLowerCase().includes(localidadSearchTerm.toLowerCase())
      )
    : localidadesOptions;

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <>
      {/* ESTILOS CSS */}
      <style>{`
        .searchable-dropdown { position: relative; }
        .dropdown-toggle {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          text-align: left;
          background-color: white;
          cursor: pointer;
        }
        .dropdown-toggle.placeholder { color: #6c757d; }
        .suggestions-list {
          position: absolute;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          width: 100%;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .suggestion-search-input {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-bottom: 1px solid #ddd;
          border-radius: 6px 6px 0 0;
          font-size: 1rem;
          box-sizing: border-box;
        }
        .suggestion-search-input:focus { outline: none; }
        .suggestion-items-container {
            max-height: 200px;
            overflow-y: auto;
        }
        .suggestion-item { 
          padding: 10px; 
          cursor: pointer;
          color: #333; /* <-- CORRECCIÓN: Se asegura que el texto sea oscuro */
        }
        .suggestion-item:hover { background-color: #f0f0f0; }
        .suggestion-item.add-new { color: #007bff; font-style: italic; }
        /* Estilos generales del formulario */
        .form-peticion-container { max-width: 800px; margin: 2rem auto; padding: 2rem; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
        .form-title { text-align: center; color: #333; margin-bottom: 1.5rem; font-size: 1.8rem; }
        .peticion-form .form-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 768px) { .peticion-form .form-grid { grid-template-columns: repeat(2, 1fr); } }
        .form-column { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { margin-bottom: 0.5rem; color: #555; font-weight: 500; }
        .form-input, .form-select, .form-textarea, .form-file-input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; transition: border-color 0.2s ease-in-out; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); }
        .form-textarea { resize: vertical; min-height: 80px; }
        .radio-group { display: flex; gap: 1rem; align-items: center; margin-top: 0.3rem; }
        .radio-label { display: flex; align-items: center; gap: 0.3rem; font-weight: normal; color: #333; }
        .file-name-display { font-size: 0.85rem; color: #666; margin-top: 0.5rem; }
        .form-actions { margin-top: 2rem; text-align: center; }
        .submit-button { background-color: #007bff; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; display: inline-flex; align-items: center; justify-content: center; }
        .submit-button:hover { background-color: #0056b3; }
        .submit-button:disabled { background-color: #a0cfff; cursor: not-allowed; }
        .submit-button:active { transform: scale(0.98); }
        .spinner-icon { animation: rotate 1s linear infinite; width: 1.2em; height: 1.2em; margin-right: 0.5em; }
        .spinner-icon .path { stroke: currentColor; stroke-linecap: round; animation: dash 1.5s ease-in-out infinite; }
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        @keyframes dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }
        .message-display { padding: 0.8rem 1rem; margin-top: 1.5rem; border-radius: 6px; text-align: center; font-size: 0.95rem; }
        .message-display.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .message-display.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .full-width-group { grid-column: 1 / -1; }
      `}</style>
      
      <div className="form-peticion-container">
        <h2 className="form-title">Registrar un Nuevo Reporte</h2>
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
                <label htmlFor="apellidoMaterno">Apellido Materno*</label>
                <input type="text" id="apellidoMaterno" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} placeholder="Ej: García" className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Teléfono*</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 844 123 4567" required className="form-input" />
              </div>
            </div>

            <div className="form-column">
              {/* --- CAMPO DE LOCALIDAD CON BÚSQUEDA INTERNA --- */}
              <div className="form-group searchable-dropdown" ref={dropdownRef}>
                <label>Localidad*</label>
                <button
                  type="button"
                  className={`dropdown-toggle ${!formData.localidad ? 'placeholder' : ''}`}
                  onClick={() => setIsLocalidadListOpen(!isLocalidadListOpen)}
                >
                  {formData.localidad || "Selecciona una localidad"}
                </button>
                {isLocalidadListOpen && (
                  <div className="suggestions-list">
                    <input
                      type="text"
                      className="suggestion-search-input"
                      placeholder="Buscar o añadir localidad..."
                      value={localidadSearchTerm}
                      onChange={(e) => setLocalidadSearchTerm(e.target.value)}
                      autoFocus
                    />
                    <div className="suggestion-items-container">
                      {filteredLocalidades.length > 0 ? (
                        filteredLocalidades.map(loc => (
                          <div key={loc} className="suggestion-item" onClick={() => handleLocalidadSelect(loc)}>
                            {loc}
                          </div>
                        ))
                      ) : (
                        localidadSearchTerm && (
                          <div className="suggestion-item add-new" onClick={() => handleLocalidadSelect(localidadSearchTerm)}>
                            Añadir nueva: "{localidadSearchTerm}"
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
              
               <div className="form-group">
                <label>¿Es referente a una Estructura?</label>
                <div className="radio-group">
                  <label className="radio-label"><input type="radio" name="estructura" value="si" checked={formData.estructura === 'si'} onChange={handleChange} /> Sí</label>
                  <label className="radio-label"><input type="radio" name="estructura" value="no" checked={formData.estructura === 'no'} onChange={handleChange} /> No</label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="origenReporte">Origen del Reporte/Petición</label>
                <select id="origenReporte" name="origenReporte" value={formData.origenReporte} onChange={handleChange} className="form-select">
                  <option value="">-- ¿Por que medio Reporto? --</option>
                  {['Red Social', 'WhatsApp', 'Recomendación', 'Otro'].map(origen => <option key={origen} value={origen}>{origen}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="hora">Hora de la Registro*</label>
                <input type="time" id="hora" name="hora" value={formData.hora} onChange={handleChange} required className="form-input" />
              </div>
            </div>
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
