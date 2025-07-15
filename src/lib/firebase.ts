'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// This function will be defined in a UI component, but we need a placeholder here.
const showMessage = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

// This function will also be in the UI.
const hideLoading = () => {};

let app;
let db;

try {
  const firebaseConfigStr = (window as any).__firebase_config;
  if (!firebaseConfigStr) {
    throw new Error("Firebase config not found.");
  }
  const firebaseConfig: FirebaseOptions = JSON.parse(firebaseConfigStr);

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  db = getFirestore(app);

  // Connect to emulators if running locally
  const isBrowser = () => typeof window !== 'undefined';
  if (isBrowser() && window.location.hostname === 'localhost') {
    console.log('Connecting to Firebase Emulators...');
    connectFirestoreEmulator(db, 'localhost', 8080);
  }

} catch (error) {
  console.error("Firebase initialization error:", error);
  // We can't call showMessage here directly as it's a UI function,
  // but the error will be in the console. The UI can handle showing a message.
}

export { app, db };
