import { initializeApp } from 'firebase/app';
import { getFirestore, query, where, getDocs, collection, deleteDoc, doc, addDoc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuración de Firebase para tu aplicación web
const firebaseConfig = {
  apiKey: 'AIzaSyAktCMmICRVzdxY5AZpguktm9F5LglQiZ0',
  authDomain: 'empleado-contagramm.firebaseapp.com',
  projectId: 'empleado-contagramm',
  storageBucket: 'empleado-contagramm.appspot.com',
  messagingSenderId: '254055482990',
  appId: '1:254055482990:web:91bbc22418bee430cec87f',
  measurementId: 'G-SMPPC38DG3',
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  db,
  query,
  where,
  getDocs,
  setDoc,
  collection,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  auth,
  signInWithEmailAndPassword,
};
