import { useState } from 'react';
import { db, storage } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './FormPeticion.css';

export default function FormPeticion() {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    localidad: '',
    estructura: 'no', // 'si' o 'no'
    origenReporte: '', // Red social/anuncio
    peticion: '',
    hora: ''
  });
  const [ineFile, setIneFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Opciones para los select
  const localidades = ['Centro', 'Norte', 'Sur', 'Oriente', 'Poniente'];
  const origenes = ['Facebook', 'Twitter', 'WhatsApp', 'Anuncio impreso', 'Recomendación'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Subir INE a Storage
      let ineUrl = '';
      if (ineFile) {
        const ineRef = ref(storage, `ines/${Date.now()}_${ineFile.name}`);
        await uploadBytes(ineRef, ineFile);
        ineUrl = await getDownloadURL(ineRef);
      }

      // 2. Guardar en Firestore
      await addDoc(collection(db, 'peticiones'), {
        ...form,
        ineUrl,
        fecha: serverTimestamp(), // Guarda fecha automática
        estado: 'pendiente'
      });

      setMensaje('¡Petición registrada!');
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
    } catch (error) {
      setMensaje(`Error: ${error.message}`);
    } finally {
      setLoading(false);
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
          <label>INE/Identificación:</label>
          <input
            type="file"
            onChange={(e) => setIneFile(e.target.files[0])}
            accept="image/*,.pdf"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Registrar Petición'}
        </button>

        {mensaje && <p className={`mensaje ${mensaje.includes('Error') ? 'error' : 'exito'}`}>{mensaje}</p>}
      </form>
    </div>
  );
}