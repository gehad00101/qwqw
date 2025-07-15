// /src/lib/firebase.ts
'use client';

import { initializeApp, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// This function determines if the code is running in a browser environment.
const isBrowser = () => typeof window !== 'undefined';

// This function safely parses the Firebase config from a global variable.
const getFirebaseConfig = (): FirebaseOptions | null => {
  try {
    // __firebase_config is a global variable injected by Firebase App Hosting.
    const configStr = (window as any).__firebase_config;
    if (!configStr) {
      console.log('Firebase config global variable not found.');
      return null;
    }
    return JSON.parse(configStr);
  } catch (e) {
    console.error('Failed to parse Firebase config:', e);
    return null;
  }
};

// Initialize Firebase App
const firebaseConfig = isBrowser() ? getFirebaseConfig() : null;
const app = firebaseConfig
  ? initializeApp(firebaseConfig)
  : null;

// Initialize Firestore
const db = app ? getFirestore(app) : null;

// Get App ID, also injected by Firebase App Hosting
const appId = isBrowser() ? (window as any).__app_id || 'default-app-id' : 'default-app-id';

// In a local development environment, connect to emulators.
if (isBrowser() && window.location.hostname === 'localhost' && db) {
  console.log('Connecting to Firebase Emulators...');
  // Point Firestore to the local emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { app, db, appId };
