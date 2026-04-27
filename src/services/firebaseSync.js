import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseApp, isFirebaseAppConfigured } from './firebaseAuth';

function cleanDataPath(dataPath) {
  return String(dataPath || 'fmnBilling')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^A-Za-z0-9/_-]/g, '_') || 'fmnBilling';
}

function safeDocId(id) {
  return encodeURIComponent(String(id || '').trim());
}

function encodeMetaValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return { __value: value };
}

function decodeMetaValue(value) {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    Object.prototype.hasOwnProperty.call(value, '__value')
  ) {
    return value.__value;
  }
  return value;
}

function getFirestoreInstance() {
  if (!isFirebaseAppConfigured()) {
    throw new Error('Firebase is not configured. Add your Firebase app keys in .env.');
  }
  return getFirestore(getFirebaseApp());
}

function rootDoc(settings) {
  return doc(getFirestoreInstance(), 'appData', cleanDataPath(settings.dataPath));
}

function singletonDoc(settings, name) {
  return doc(rootDoc(settings), 'singletons', name);
}

function metaDoc(settings, key) {
  return doc(rootDoc(settings), 'meta', key);
}

function itemsCollection(settings, name) {
  return collection(rootDoc(settings), 'collections', name, 'items');
}

function itemDoc(settings, collectionName, id) {
  return doc(itemsCollection(settings, collectionName), safeDocId(id));
}

function backupDoc(settings) {
  return doc(rootDoc(settings), 'system', 'backup');
}

async function getCollectionSnapshot(settings, name) {
  const snapshot = await getDocs(itemsCollection(settings, name));
  return snapshot.docs.map((entry) => entry.data()).filter(Boolean);
}

export async function uploadBackupToFirebase(settings, data) {
  await setDoc(backupDoc(settings), {
    ...data,
    firebaseSyncedAt: new Date().toISOString(),
  });
}

export async function downloadBackupFromFirebase(settings) {
  const snapshot = await getDoc(backupDoc(settings));
  if (!snapshot.exists()) {
    throw new Error('No backup found in Firestore for this data path');
  }
  return snapshot.data();
}

export async function firebaseGet(settings, parts = []) {
  if (!Array.isArray(parts) || parts.length === 0) return null;

  if (parts[0] === 'meta') {
    if (parts.length === 1) {
      const snapshot = await getDocs(collection(rootDoc(settings), 'meta'));
      return snapshot.docs.reduce((acc, entry) => {
        acc[entry.id] = decodeMetaValue(entry.data());
        return acc;
      }, {});
    }

    const snapshot = await getDoc(metaDoc(settings, parts[1]));
    return snapshot.exists() ? decodeMetaValue(snapshot.data()) : null;
  }

  if (parts[0] === 'data') {
    if (parts.length === 1) {
      const collectionNames = ['bills', 'clients', 'templates', 'products', 'expenses', 'recurring', 'receipts', 'profiles', 'purchases'];
      const result = {};

      for (const name of collectionNames) {
        result[name] = await getCollectionSnapshot(settings, name);
      }

      const profileSnapshot = await getDoc(singletonDoc(settings, 'profile'));
      if (profileSnapshot.exists()) {
        result.profile = profileSnapshot.data();
      }

      return result;
    }

    if (parts.length === 2) {
      if (parts[1] === 'profile') {
        const snapshot = await getDoc(singletonDoc(settings, 'profile'));
        return snapshot.exists() ? snapshot.data() : null;
      }

      return getCollectionSnapshot(settings, parts[1]);
    }

    if (parts.length === 3) {
      const snapshot = await getDoc(itemDoc(settings, parts[1], parts[2]));
      return snapshot.exists() ? snapshot.data() : null;
    }
  }

  return null;
}

export async function firebaseSet(settings, parts = [], value) {
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('Firestore path is required');
  }

  if (parts[0] === 'meta') {
    if (parts.length !== 2) throw new Error('Meta writes require a key');
    await setDoc(metaDoc(settings, parts[1]), encodeMetaValue(value));
    return value;
  }

  if (parts[0] === 'data') {
    if (parts.length === 2 && parts[1] === 'profile') {
      await setDoc(singletonDoc(settings, 'profile'), value);
      return value;
    }

    if (parts.length === 3) {
      await setDoc(itemDoc(settings, parts[1], parts[2]), value);
      return value;
    }
  }

  throw new Error('Unsupported Firestore write path');
}

export async function firebaseDelete(settings, parts = []) {
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('Firestore path is required');
  }

  if (parts[0] === 'meta' && parts.length === 2) {
    await deleteDoc(metaDoc(settings, parts[1]));
    return true;
  }

  if (parts[0] === 'data') {
    if (parts.length === 2 && parts[1] === 'profile') {
      await deleteDoc(singletonDoc(settings, 'profile'));
      return true;
    }

    if (parts.length === 3) {
      await deleteDoc(itemDoc(settings, parts[1], parts[2]));
      return true;
    }
  }

  throw new Error('Unsupported Firestore delete path');
}

export async function firebaseIncrement(settings, key, initialValue = 0) {
  const db = getFirestoreInstance();
  const counterRef = metaDoc(settings, key);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentValue = snapshot.exists() ? Number(decodeMetaValue(snapshot.data()) || 0) : initialValue;
    const nextValue = currentValue + 1;
    transaction.set(counterRef, encodeMetaValue(nextValue));
    return nextValue;
  });
}

export function firebaseMapToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return Object.values(value).filter(Boolean);
}
