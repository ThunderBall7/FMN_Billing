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
  if (!authInstance) throw new Error('Auth is not configured');

  try {
    return await signInWithEmailAndPassword(authInstance, email, password);
  } catch (error) {
    const code = error.code;

    let message = 'Login failed. Please try again.';

    switch (code) {
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Try again later';
        break;
    }

    throw new Error(message);
  }
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
