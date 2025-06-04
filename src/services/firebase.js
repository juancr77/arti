import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDqRhkctzLU7t-mrQj__i9HfkV9fWKPCmM",
  authDomain: "peticionesa-44953.firebaseapp.com",
  projectId: "peticionesa-44953",
  storageBucket: "peticionesa-44953.firebasestorage.app",
  messagingSenderId: "682047899464",
  appId: "1:682047899464:web:77f06f7d5299762947157d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);