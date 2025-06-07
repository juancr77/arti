// src/components/FormularioPeticion/FormularioPeticion.js
import React, { useState } from 'react';
// AJUSTE DE RUTA:
// Esta ruta asume que FormularioPeticion.js está en: src/components/FormularioPeticion/
// Y tu archivo firebase.js (o firebase.ts) está en: src/services/
// Se añade la extensión .js para ser más explícito con el import.
// Asegúrate de que el archivo se llame 'firebase.js' (o ajusta si es .ts, etc.)
import { db, storage } from '../../services/firebase.js'; 
// Funciones necesarias de Firestore y Storage
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Esta ruta asume que FormularioPeticion.css está en la MISMA carpeta que este archivo JS.
// Asegúrate de que el archivo se llame 'FormularioPeticion.css' y esté en el mismo directorio.
import './FormularioPeticion.css'; 

// --- Icono de Spinner (SVG simple) ---
const SpinnerIcon = () => (
  <svg className="spinner-icon" viewBox="0 0 50 50">
    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
  </svg>
);

// --- Componente Principal del Formulario ---
export default function FormularioPeticion() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    localidad: '',
    estructura: 'no', // Valor por defecto
    origenReporte: '',
    peticion: '',
    hora: '',
  });
  const [ineFile, setIneFile] = useState(null);
  const [ineFileName, setIneFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Opciones para los campos select
  const localidadesOptions = ['Centro', 'Norte', 'Sur', 'Oriente', 'Poniente', 'Otra'];
  const origenesOptions = ['Red Social (Facebook, Twitter, etc.)', 'WhatsApp', 'Anuncio/Publicidad', 'Recomendación', 'Llamada Telefónica', 'Otro'];

  // Manejador para cambios en los inputs de texto y select
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Manejador para el input de archivo (INE)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIneFile(file);
      setIneFileName(file.name);
    } else {
      setIneFile(null);
      setIneFileName('');
    }
  };

  // Manejador para el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' }); // Limpiar mensaje previo

    // Validación básica (puedes expandirla)
    if (!formData.nombre || !formData.telefono || !formData.localidad || !formData.peticion || !formData.hora) {
      setMessage({ type: 'error', text: 'Por favor, completa todos los campos obligatorios.' });
      setIsLoading(false);
      return;
    }

    console.log("Formulario a enviar:", formData);
    console.log("Archivo INE:", ineFile ? ineFile.name : "No seleccionado");

    try {
      let ineURL = ''; // URL del archivo INE en Storage
      if (ineFile) {
        // Crear una referencia única para el archivo en Firebase Storage
        const ineStorageRef = ref(storage, `peticiones_ines/${Date.now()}_${ineFile.name}`);
        console.log("Subiendo archivo INE a:", ineStorageRef.fullPath);
        // Subir el archivo
        await uploadBytes(ineStorageRef, ineFile);
        // Obtener la URL de descarga
        ineURL = await getDownloadURL(ineStorageRef);
        console.log("Archivo INE subido. URL:", ineURL);
      }

      // Preparar los datos para Firestore
      const peticionParaGuardar = {
        ...formData,
        ineURL: ineURL, 
        fecha: serverTimestamp(), 
        estatus: 'pendiente', 
      };

      console.log("Datos a guardar en Firestore:", peticionParaGuardar);
      // Añadir el documento a la colección 'peticiones'
      const docRef = await addDoc(collection(db, 'peticiones'), peticionParaGuardar);
      console.log("Petición registrada con ID: ", docRef.id);

      setMessage({ type: 'success', text: '¡Listo! Petición registrada exitosamente.' });
      // Limpiar el formulario
      setFormData({
        nombre: '',
        telefono: '',
        localidad: '',
        estructura: 'no',
        origenReporte: '',
        peticion: '',
        hora: '',
      });
      setIneFile(null);
      setIneFileName('');
      if (document.getElementById('ineFile')) {
        document.getElementById('ineFile').value = null;
      }

    } catch (error) {
      console.error("Error al registrar la petición: ", error);
      let errorMessage = 'Ocurrió un error al registrar la petición.';
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = 'Error de permisos al subir el archivo. Revisa las reglas de Storage.';
            break;
          case 'permission-denied': // Firestore permission error
            errorMessage = 'Error de permisos al guardar los datos. Revisa las reglas de Firestore.';
            break;
          default:
            errorMessage = `Error: ${error.message} (Código: ${error.code})`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-peticion-container">
      <h2 className="form-title">Registrar Nueva Petición</h2>
      <form onSubmit={handleSubmit} className="peticion-form">
        <div className="form-grid">
          {/* Columna 1 */}
          <div className="form-column">
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo*</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono*</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 844 123 4567"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="localidad">Localidad*</label>
              <select
                id="localidad"
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">-- Selecciona una localidad --</option>
                {localidadesOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>¿Es parte de una estructura existente?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="estructura"
                    value="si"
                    checked={formData.estructura === 'si'}
                    onChange={handleChange}
                  /> Sí
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="estructura"
                    value="no"
                    checked={formData.estructura === 'no'}
                    onChange={handleChange}
                  /> No
                </label>
              </div>
            </div>
          </div>

          {/* Columna 2 */}
          <div className="form-column">
            <div className="form-group">
              <label htmlFor="origenReporte">Origen del Reporte/Petición</label>
              <select
                id="origenReporte"
                name="origenReporte"
                value={formData.origenReporte}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">-- ¿Cómo se enteró? --</option>
                {origenesOptions.map(origen => <option key={origen} value={origen}>{origen}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hora">Hora de la Petición*</label>
              <input
                type="time"
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="peticion">Descripción de la Petición*</label>
              <textarea
                id="peticion"
                name="peticion"
                value={formData.peticion}
                onChange={handleChange}
                placeholder="Detalla aquí la solicitud o reporte..."
                rows="4"
                required
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ineFile">Adjuntar INE/Identificación (Opcional)</label>
              <input
                type="file"
                id="ineFile"
                name="ineFile"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="form-file-input"
              />
              {ineFileName && <p className="file-name-display">Archivo seleccionado: {ineFileName}</p>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? (
              <>
                <SpinnerIcon />
                Enviando...
              </>
            ) : (
              'Registrar Petición'
            )}
          </button>
        </div>

        {message.text && (
          <div className={`message-display ${message.type}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
