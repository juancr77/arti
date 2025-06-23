import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Importaciones de Firebase, incluyendo 'doc' y 'writeBatch'
import { db, storage } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, getDocs, doc, writeBatch } from 'firebase/firestore';
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
  const [populateMessage, setPopulateMessage] = useState('');
  
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
      
      const addNewValueToCollection = async (collectionName, options, value) => {
          const trimmedValue = value.trim();
          if (trimmedValue && !options.some(opt => opt.toLowerCase() === trimmedValue.toLowerCase())) {
              await addDoc(collection(db, collectionName), { nombre: trimmedValue });
          }
      };

      await addNewValueToCollection('localidades', localidadesOptions, formData.localidad);
      await addNewValueToCollection('direcciones', direccionesOptions, formData.direccion);
      await addNewValueToCollection('colonias', coloniasOptions, formData.colonia);
      await addNewValueToCollection('calles', callesOptions, formData.calle);
      await addNewValueToCollection('calles', callesOptions, formData.entreCalle1);
      await addNewValueToCollection('calles', callesOptions, formData.entreCalle2);

      await addDoc(collection(db, 'peticiones'), peticionParaGuardar);
      setMessage({ type: 'success', text: '¡Listo! el reporte se ha registrado exitosamente.' });
      setFormData({
        nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '',
        localidad: '', direccion: '', estructura: 'no', origenReporte: '', peticion: '',
        hora: '', fechaReporte: getTodayDateString(),
        colonia: '', calle: '', entreCalle1: '', entreCalle2: ''
      });
      setIneFile(null); setIneFileName('');
    } catch (error) {
      console.error("Error al registrar el Reporte: ", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al registrar el reporte.' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCIÓN MODIFICADA: Ahora para poblar CALLES ---
  const handlePopulateCalles = async () => {
    setIsLoading(true);
    setPopulateMessage('');

    const callesIniciales = [
      "Hidalgo", "Juárez", "General Cepeda", "Centenario", "Blvd. Jesús Valdez Sánchez",
      "Román Cepeda", "Carretera Antigua a Arteaga", "General Rodríguez Triana", "Olivos",
      "Calle Números", "Calle San Mateo", "Calle N° 110", "Privada Lázaro Cárdenas",
      "Calle Santiago Valdés Galindo", "Blvd. Eulogio Gutiérrez", "Carretera a Los Valdés",
      "Camino a Los Pastores", "Privanza Acacia", "Alameda", "Naranjo",
      "Carretera San Antonio de las Alazanas - Mesa de las Tablas"
    ];

    try {
      const callesCollection = collection(db, 'calles');
      const querySnapshot = await getDocs(callesCollection);
      const callesExistentes = new Set(querySnapshot.docs.map(doc => doc.data().nombre));

      const batch = writeBatch(db);
      let callesAgregadas = 0;

      callesIniciales.forEach(nombre => {
        if (!callesExistentes.has(nombre)) {
          const newDocRef = doc(callesCollection);
          batch.set(newDocRef, { nombre: nombre });
          callesAgregadas++;
        }
      });

      if (callesAgregadas > 0) {
        await batch.commit();
        setPopulateMessage(`¡Éxito! Se agregaron ${callesAgregadas} nuevas calles.`);
        const updatedSnapshot = await getDocs(callesCollection);
        const updatedData = updatedSnapshot.docs.map(doc => doc.data().nombre).sort((a,b) => a.localeCompare(b));
        setCallesOptions(updatedData);
      } else {
        setPopulateMessage('La base de datos de calles ya está actualizada.');
      }
    } catch (error) {
      console.error("Error al poblar las calles: ", error);
      setPopulateMessage('Error al intentar guardar las calles.');
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
          {/* ... (resto del formulario sin cambios hasta el botón temporal) ... */}
          
          <div className="admin-actions">
            <p><strong>Herramienta de Administrador:</strong> Poblar la base de datos de calles.</p>
            <button type="button" onClick={handlePopulateCalles} className="populate-button" disabled={isLoading}>
              {isLoading ? 'Procesando...' : 'Poblar Calles (Solo una vez)'}
            </button>
            {populateMessage && <p className="populate-message">{populateMessage}</p>}
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
