import { useState } from 'react';
import { db, storage } from '../../services/firebase'; // Asegúrate que esta ruta es correcta
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './FormPeticion.css';

export default function FormPeticion() {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    localidad: '',
    estructura: 'no',
    origenReporte: '',
    peticion: '',
    hora: ''
  });
  const [ineFile, setIneFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const localidades = ['Centro', 'Norte', 'Sur', 'Oriente', 'Poniente'];
  const origenes = ['Facebook', 'Twitter', 'WhatsApp', 'Anuncio impreso', 'Recomendación'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(''); // Limpiar mensajes previos

    console.log("Iniciando envío de formulario...");
    console.log("Datos del formulario:", form);
    if (ineFile) {
      console.log("Archivo INE seleccionado:", ineFile.name);
    } else {
      console.log("No se seleccionó archivo INE.");
    }

    try {
      let ineUrl = '';
      if (ineFile) {
        console.log("Subiendo INE a Storage...");
        const ineRef = ref(storage, `ines/${Date.now()}_${ineFile.name}`);
        await uploadBytes(ineRef, ineFile);
        ineUrl = await getDownloadURL(ineRef);
        console.log("INE subido exitosamente. URL:", ineUrl);
      }

      const peticionData = {
        ...form,
        ineUrl, // Será string vacío si no hay archivo
        fecha: serverTimestamp(),
        estado: 'pendiente'
      };

      console.log("Guardando datos en Firestore:", peticionData);
      await addDoc(collection(db, 'peticiones'), peticionData);
      console.log("¡Petición registrada en Firestore!");

      setMensaje('¡Listo!'); // Mensaje de éxito

      // Resetear formulario
      setForm({
        nombre: '',
        telefono: '',
        localidad: '',
        estructura: 'no',
        origenReporte: '',
        peticion: '',
        hora: ''
      });
      setIneFile(null);
      // Para limpiar el input de archivo visualmente
      const ineFileInput = document.getElementById('ine-file-input');
      if (ineFileInput) {
        ineFileInput.value = '';
      }

    } catch (error) {
      console.error("Error durante el envío:", error); // ¡MUY IMPORTANTE! Revisa este error en la consola
      let friendlyErrorMessage = `Error: ${error.message}`;
      if (error.code) {
        friendlyErrorMessage = `Error (${error.code}): ${error.message}`;
        if (error.code === 'permission-denied') {
          friendlyErrorMessage = "Error de permiso: La base de datos denegó la escritura. Revisa tus Reglas de Seguridad en Firebase.";
          console.error("Detalle del error de permiso:", error);
        }
      }
      setMensaje(friendlyErrorMessage);
    } finally {
      setLoading(false);
      console.log("Envío de formulario finalizado.");
    }
  };

  return (
    <div className="form-container">
      <h2>Registro de Petición</h2>
      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <input
          value={form.nombre}
          onChange={(e) => setForm({...form, nombre: e.target.value})}
          placeholder="Nombre completo"
          required
        />

        {/* Teléfono */}
        <input
          type="tel"
          value={form.telefono}
          onChange={(e) => setForm({...form, telefono: e.target.value})}
          placeholder="Teléfono"
          required
        />

        {/* Localidad (Select) */}
        <select
          value={form.localidad}
          onChange={(e) => setForm({...form, localidad: e.target.value})}
          required
        >
          <option value="">Selecciona localidad</option>
          {localidades.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* Estructura (Radio Buttons) */}
        <div className="radio-group">
          <label>¿Es una estructura?</label>
          <label>
            <input
              type="radio"
              name="estructura"
              value="si"
              checked={form.estructura === 'si'}
              onChange={() => setForm({...form, estructura: 'si'})}
            /> Sí
          </label>
          <label>
            <input
              type="radio"
              name="estructura"
              value="no"
              checked={form.estructura === 'no'}
              onChange={() => setForm({...form, estructura: 'no'})}
            /> No
          </label>
        </div>

        {/* Origen del Reporte (Select) */}
        <select
          value={form.origenReporte}
          onChange={(e) => setForm({...form, origenReporte: e.target.value})}
          required
        >
          <option value="">¿Cómo se enteró?</option>
          {origenes.map((origen) => (
            <option key={origen} value={origen}>{origen}</option>
          ))}
        </select>

        {/* Hora */}
        <input
          type="time"
          value={form.hora}
          onChange={(e) => setForm({...form, hora: e.target.value})}
          required
        />

        {/* Petición (Textarea) */}
        <textarea
          value={form.peticion}
          onChange={(e) => setForm({...form, peticion: e.target.value})}
          placeholder="Describa su petición"
          required
        />

        {/* INE (File Input) */}
        <div className="file-input">
          <label htmlFor="ine-file-input">INE/Identificación:</label> {/* Añadido htmlFor */}
          <input
            id="ine-file-input" // Añadido ID para poder resetearlo
            type="file"
            onChange={(e) => setIneFile(e.target.files[0])}
            accept="image/*,.pdf"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Enviando...
            </>
          ) : (
            'Registrar Petición'
          )}
        </button>

        {mensaje && (
          <p className={`mensaje ${mensaje.toLowerCase().includes('error') ? 'error' : 'exito'}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}