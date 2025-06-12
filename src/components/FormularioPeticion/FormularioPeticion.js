import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Importaciones de Firebase desde tu archivo centralizado
import { db, storage } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './FormularioPeticion.css'; 

// --- Icono de Spinner (SVG simple) ---
const SpinnerIcon = () => (
  <svg className="spinner-icon" viewBox="0 0 50 50">
    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
  </svg>
);

// --- Componente con el nombre correcto ---
export default function FormularioPeticion() {

  // Función para obtener la fecha de hoy en formato yyyy-MM-dd
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
    direccion: '',
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
  
  // Estados para la búsqueda de localidades
  const [localidadesOptions, setLocalidadesOptions] = useState([]);
  const [localidadSearchTerm, setLocalidadSearchTerm] = useState("");
  const [isLocalidadListOpen, setIsLocalidadListOpen] = useState(false);
  const localidadDropdownRef = useRef(null);

  // Estados para la búsqueda de direcciones
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

  // Cargar direcciones al inicio
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

  // Cerrar el dropdown de dirección si se hace clic fuera de él
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

  const handleDireccionSelect = (selectedDireccion) => {
    setFormData(prevData => ({ ...prevData, direccion: selectedDireccion }));
    setIsDireccionListOpen(false);
    setDireccionSearchTerm("");
  };

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
        fecha: new Date(`${formData.fechaReporte}T${formData.hora || '00:00:00'}`),
        fechaCreacion: serverTimestamp(),
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