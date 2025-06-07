// Asegúrate de que este archivo esté en la ruta correcta, ej: src/services/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Tu configuración de Firebase, pero con el 'storageBucket' CORRECTO
const firebaseConfig = {
  apiKey: "AIzaSyDqRhkctzLU7t-mrQj__i9HfkV9fWKPCmM", // Este es tu API Key
  authDomain: "peticionesa-44953.firebaseapp.com",
  projectId: "peticionesa-44953",
  //
  // ESTA LÍNEA ES LA CORRECCIÓN MÁS IMPORTANTE
  //
  storageBucket: "peticionesa-44953.firebasestorage.app", 
  //
  messagingSenderId: "682047899464",
  appId: "1:682047899464:web:77f06f7d5299762947157d",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancias de los servicios
const db = getFirestore(app);
const storage = getStorage(app);

// Exportar las instancias para usarlas en otros componentes
export { db, storage, app };
