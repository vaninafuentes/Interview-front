/**
 * src/lib/firebase.ts
 * -------------------
 * Inicialización del SDK de Firebase para toda la aplicación.
 *
 * Capa: LIB
 * ---------
 * Esqueleto listo para integrar Firebase (Auth, Firestore, etc.)
 *
 * Para activar Firebase:
 *   1. Crear un proyecto en https://console.firebase.google.com
 *   2. Agregar una app web/Android/iOS
 *   3. Copiar la configuración de firebaseConfig desde la consola
 *   4. Descomentar las líneas marcadas con TODO
 */

// TODO: Reemplazar con la configuración real de tu proyecto Firebase
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// TODO: Descomentar cuando tengas la config real
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// export const firebaseApp = initializeApp(firebaseConfig);
// export const firebaseAuth = getAuth(firebaseApp);
// export const firestore = getFirestore(firebaseApp);

export { firebaseConfig };
