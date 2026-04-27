import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app = null;
let auth = null;

export function isFirebaseAppConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export function getFirebaseApp() {
  if (app) return app;
  if (!isFirebaseAppConfigured()) return null;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

function ensureAuth() {
  if (auth) return auth;
  if (!isFirebaseAuthConfigured()) return null;
  auth = getAuth(getFirebaseApp());
  return auth;
}

export function isFirebaseAuthConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export function listenToAuthState(callback) {
  const authInstance = ensureAuth();
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, callback);
}

export async function signInWithEmailPassword(email, password) {
  const authInstance = ensureAuth();
  if (!authInstance) throw new Error('Firebase Auth is not configured in .env');
  return signInWithEmailAndPassword(authInstance, email, password);
}

export async function signOutUser() {
  const authInstance = ensureAuth();
  if (!authInstance) return;
  await signOut(authInstance);
}

export async function getFirebaseIdToken() {
  const authInstance = ensureAuth();
  if (!authInstance?.currentUser) return '';
  return authInstance.currentUser.getIdToken();
}
