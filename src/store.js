// Firebase-backed storage only (frontend-only app).
import { firebaseDelete, firebaseGet, firebaseIncrement, firebaseMapToArray, firebaseSet } from './services/firebaseSync';
import { isFirebaseAppConfigured } from './services/firebaseAuth';

const ENV_FIREBASE = {
  enabled: true,
  dataPath: import.meta.env.VITE_FIREBASE_DATA_PATH || 'fmnBilling',
};

function withId(data, id) {
  return data?.id ? data : { ...data, id };
}

function sanitizeFirebaseKey(key) {
  return String(key).replace(/\//g, '_');
}

async function getBackendSettings() {
  const settings = await getFirebaseSettings();
  if (isFirebaseAppConfigured()) return { ...settings, enabled: true };
  throw new Error('Firebase is not configured. Add your Firebase app keys in .env.');
}

async function getCollection(collectionName, sortFn = null) {
  const firebase = await getBackendSettings();
  const items = firebaseMapToArray(await firebaseGet(firebase, ['data', collectionName]));
  return sortFn ? items.sort(sortFn) : items;
}

async function saveItem(collectionName, item, idPrefix) {
  const firebase = await getBackendSettings();
  const record = withId(item, item.id || `${idPrefix}_${Date.now()}`);
  await firebaseSet(firebase, ['data', collectionName, record.id], record);
  return record;
}

async function deleteItem(collectionName, id) {
  const firebase = await getBackendSettings();
  await firebaseDelete(firebase, ['data', collectionName, id]);
  return { success: true };
}

const DEFAULT_INV_SETTINGS = {
  format: 'branded',
  brandPrefix: '',
  separator: '/',
  showFinYear: true,
  startNumber: 1,
  padDigits: 4,
};

export const getInvoiceNumberSettings = async () => {
  const firebase = await getBackendSettings();
  const value = await firebaseGet(firebase, ['meta', 'invoiceNumberSettings']);
  return { ...DEFAULT_INV_SETTINGS, ...(value || {}) };
};

export const saveInvoiceNumberSettings = async (settings) => {
  const firebase = await getBackendSettings();
  await firebaseSet(firebase, ['meta', 'invoiceNumberSettings'], settings);
};

export const getInvoiceDisplayOptions = async () => {
  const firebase = await getBackendSettings();
  return firebaseGet(firebase, ['meta', 'invoiceDisplayOptions']);
};

export const saveInvoiceDisplayOptions = async (options) => {
  const firebase = await getBackendSettings();
  await firebaseSet(firebase, ['meta', 'invoiceDisplayOptions'], options);
};

export const getFirebaseSettings = async () => {
  let value = null;
  try {
    value = JSON.parse(localStorage.getItem('fmnBilling_firebaseSettings') || 'null');
  } catch {
    value = null;
  }

  return {
    enabled: true,
    dataPath: 'fmnBilling',
    ...(value || {}),
    ...ENV_FIREBASE,
  };
};

export const saveFirebaseSettings = async (settings) => {
  localStorage.setItem('fmnBilling_firebaseSettings', JSON.stringify({
    enabled: true,
    dataPath: settings.dataPath || 'fmnBilling',
  }));
};

async function writeBackupToFirebaseData(firebase, data) {
  const collections = {
    bills: data.bills,
    clients: data.clients,
    templates: data.termsTemplates,
    products: data.products,
    expenses: data.expenses,
    recurring: data.recurring,
    receipts: data.receipts,
    profiles: data.profiles,
    purchases: data.purchases,
  };

  if (data.profile) {
    await firebaseSet(firebase, ['data', 'profile'], data.profile);
  }

  for (const [collectionName, items] of Object.entries(collections)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (item.id) {
        await firebaseSet(firebase, ['data', collectionName, item.id], item);
      }
    }
  }

  if (data.meta && typeof data.meta === 'object') {
    for (const [key, value] of Object.entries(data.meta)) {
      await firebaseSet(firebase, ['meta', key], value);
    }
  }
}

export const copyLocalDataToFirebase = async (settings) => {
  const localData = JSON.parse(await exportAllData());
  await writeBackupToFirebaseData(settings, localData);
  return {
    billCount: Array.isArray(localData.bills) ? localData.bills.length : 0,
    clientCount: Array.isArray(localData.clients) ? localData.clients.length : 0,
    templateCount: Array.isArray(localData.termsTemplates) ? localData.termsTemplates.length : 0,
    productCount: Array.isArray(localData.products) ? localData.products.length : 0,
  };
};

function getFinancialYearStart(dateValue) {
  const sourceDate = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(sourceDate.getTime())) return new Date().getFullYear();
  return sourceDate.getMonth() >= 3 ? sourceDate.getFullYear() : sourceDate.getFullYear() - 1;
}

function formatInvoiceNumberFromCounter(settings, prefix, counterValue, invoiceDate) {
  const nextNumber = Math.max(
    Number(settings.startNumber || 1),
    Number(settings.startNumber || 1) + Number(counterValue || 0) - 1,
  );

  if (settings.format === 'random') {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const pfx = settings.brandPrefix || prefix;
    return `${pfx}${settings.separator}${rand}`;
  }

  const sep = settings.separator || '/';
  const pfx = settings.brandPrefix || prefix;
  const padded = String(nextNumber).padStart(settings.padDigits || 4, '0');

  if (settings.showFinYear) {
    const fyStart = getFinancialYearStart(invoiceDate);
    const nextYear = (fyStart + 1).toString().slice(-2);
    return `${pfx}${sep}${fyStart}-${nextYear}${sep}${padded}`;
  }

  return `${pfx}${sep}${padded}`;
};

export const peekNextInvoiceNumber = async (prefix = 'INV', invoiceDate = '') => {
  const settings = await getInvoiceNumberSettings();
  const key = `counter_${prefix}`;
  const firebase = await getBackendSettings();
  const currentCounter = Number(await firebaseGet(firebase, ['meta', key])) || 0;
  return formatInvoiceNumberFromCounter(settings, prefix, currentCounter + 1, invoiceDate);
};

export const getNextInvoiceNumber = async (prefix = 'INV', invoiceDate = '') => {
  const settings = await getInvoiceNumberSettings();
  const key = `counter_${prefix}`;
  const firebase = await getBackendSettings();
  const nextCounter = await firebaseIncrement(firebase, key, 0);
  return formatInvoiceNumberFromCounter(settings, prefix, nextCounter, invoiceDate);
};

export const saveBill = async (bill) => {
  const firebase = await getBackendSettings();
  const safeKey = sanitizeFirebaseKey(bill.id);
  await firebaseSet(firebase, ['data', 'bills', safeKey], bill);
  return { success: true };
};

export const getAllBills = async () => {
  const raw = await getCollection('bills');
  const normalized = raw.map((bill) => {
    const data = bill?.data || {};
    const details = data.details || {};
    const client = data.client || {};
    const totals = data.totals || {};
    const derivedDate = bill.invoiceDate || details.invoiceDate || '';
    const derivedTotal = bill.totalAmount ?? totals.total ?? 0;
    const derivedTax = bill.totalTaxAmount ?? ((totals.cgst || 0) + (totals.sgst || 0) + (totals.igst || 0));

    return {
      ...bill,
      id: bill.id || details.invoiceNumber || bill.invoiceNumber || `inv_${Date.now()}`,
      invoiceNumber: bill.invoiceNumber || details.invoiceNumber || bill.id || '',
      invoiceDate: derivedDate,
      clientName: bill.clientName || client.name || '',
      clientPhone: bill.clientPhone || client.phone || '',
      invoiceType: bill.invoiceType || data.invoiceType || 'tax-invoice',
      currency: bill.currency || data.invoiceOptions?.currency || 'INR',
      totalAmount: derivedTotal,
      totalTaxAmount: derivedTax,
      status: bill.status || 'unpaid',
      paidAmount: bill.paidAmount || 0,
      payments: Array.isArray(bill.payments) ? bill.payments : [],
    };
  });

  return normalized.sort((a, b) => {
    const da = Date.parse(a.invoiceDate || '') || 0;
    const db = Date.parse(b.invoiceDate || '') || 0;
    return db - da;
  });
};

export const deleteBill = async (id) => {
  const firebase = await getBackendSettings();
  const safeKey = sanitizeFirebaseKey(id);
  await firebaseDelete(firebase, ['data', 'bills', safeKey]);
  if (safeKey !== id) {
    try {
      await firebaseDelete(firebase, ['data', 'bills', id]);
    } catch {
      // Ignore compatibility cleanup errors.
    }
  }
  return { success: true };
};

export const saveProfile = async (profile) => {
  const firebase = await getBackendSettings();
  await firebaseSet(firebase, ['data', 'profile'], profile);
  return { success: true };
};

export const getProfile = async () => {
  const firebase = await getBackendSettings();
  return (await firebaseGet(firebase, ['data', 'profile'])) || {};
};

export const saveClient = async (client) => {
  return saveItem('clients', client, 'cli');
};

export const getAllClients = async () => {
  return getCollection('clients', (a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const deleteClient = async (id) => {
  return deleteItem('clients', id);
};

export const getTermsTemplates = async () => {
  return getCollection('templates', (a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const saveTermsTemplate = async (template) => {
  return saveItem('templates', template, 'tpl');
};

export const deleteTermsTemplate = async (id) => {
  return deleteItem('templates', id);
};

export const getAllProducts = async () => {
  return getCollection('products', (a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const saveProduct = async (product) => {
  return saveItem('products', product, 'prod');
};

export const deleteProduct = async (id) => {
  return deleteItem('products', id);
};

export const getAllExpenses = async () => {
  return getCollection('expenses', (a, b) => new Date(b.date) - new Date(a.date));
};

export const saveExpense = async (expense) => {
  return saveItem('expenses', expense, 'exp');
};

export const deleteExpense = async (id) => {
  return deleteItem('expenses', id);
};

export const getAllPurchases = async () => {
  return getCollection('purchases', (a, b) => new Date(b.date) - new Date(a.date));
};

export const savePurchase = async (purchase) => {
  return saveItem('purchases', purchase, 'pur');
};

export const deletePurchase = async (id) => {
  return deleteItem('purchases', id);
};

export const getAllRecurring = async () => {
  return getCollection('recurring', (a, b) => (a.clientName || '').localeCompare(b.clientName || ''));
};

export const saveRecurring = async (item) => {
  return saveItem('recurring', item, 'rec');
};

export const deleteRecurring = async (id) => {
  return deleteItem('recurring', id);
};

export const getAllReceipts = async () => {
  return getCollection('receipts', (a, b) => new Date(b.date) - new Date(a.date));
};

export const saveReceipt = async (receipt) => {
  return saveItem('receipts', receipt, 'rcp');
};

export const deleteReceipt = async (id) => {
  return deleteItem('receipts', id);
};

export const getAllProfiles = async () => {
  return getCollection('profiles', (a, b) => (a.businessName || '').localeCompare(b.businessName || ''));
};

export const saveBusinessProfile = async (profile) => {
  return saveItem('profiles', profile, 'biz');
};

export const deleteBusinessProfile = async (id) => {
  return deleteItem('profiles', id);
};

export const exportAllData = async () => {
  const firebase = await getBackendSettings();
  const meta = await firebaseGet(firebase, ['meta']) || {};
  const data = await firebaseGet(firebase, ['data']) || {};

  return JSON.stringify({
    bills: firebaseMapToArray(data.bills),
    profile: data.profile || {},
    clients: firebaseMapToArray(data.clients),
    termsTemplates: firebaseMapToArray(data.templates),
    products: firebaseMapToArray(data.products),
    expenses: firebaseMapToArray(data.expenses),
    recurring: firebaseMapToArray(data.recurring),
    receipts: firebaseMapToArray(data.receipts),
    profiles: firebaseMapToArray(data.profiles),
    purchases: firebaseMapToArray(data.purchases),
    meta,
    exportedAt: new Date().toISOString(),
  }, null, 2);
};

export const importData = async (jsonString) => {
  const data = JSON.parse(jsonString);
  const firebase = await getBackendSettings();
  await writeBackupToFirebaseData(firebase, data);
  return {
    billCount: Array.isArray(data.bills) ? data.bills.length : 0,
    clientCount: Array.isArray(data.clients) ? data.clients.length : 0,
    templateCount: Array.isArray(data.termsTemplates) ? data.termsTemplates.length : 0,
    productCount: Array.isArray(data.products) ? data.products.length : 0,
    hasProfile: !!data.profile,
  };
};
