export const DEFAULT_INVOICE_OPTIONS = {
  showGST: true,
  showState: true,
  showGSTIN: true,
  showPlaceOfSupply: true,
  showHSN: true,
  showDiscount: true,
  showBankDetails: true,
  showUPI: true,
  showLogo: true,
  showSignature: true,
  showTerms: true,
  showNotes: true,
  showAmountWords: true,
  showDueDate: true,
  showItemQty: true,
  customTitle: '',
  currency: 'INR',
  accentColor: '',
  pdfStyle: 'classic',
};

export const ACCENT_PRESETS = [
  { color: '#1e40af', label: 'Blue' },
  { color: '#7c3aed', label: 'Purple' },
  { color: '#0f766e', label: 'Teal' },
  { color: '#be123c', label: 'Red' },
  { color: '#c2410c', label: 'Orange' },
  { color: '#15803d', label: 'Green' },
  { color: '#0369a1', label: 'Sky' },
  { color: '#1e293b', label: 'Dark' },
];

export const PDF_STYLES = [
  { id: 'classic', label: 'Classic', desc: 'Clean with top accent bar' },
  { id: 'modern', label: 'Modern', desc: 'Bold header with color block' },
  { id: 'minimal', label: 'Minimal', desc: 'Simple, borderless layout' },
];

export const CURRENCY_OPTIONS = [
  ['INR', 'INR (Indian Rupee)'],
  ['USD', 'USD (US Dollar)'],
  ['EUR', 'EUR (Euro)'],
  ['GBP', 'GBP (British Pound)'],
  ['AUD', 'AUD (Australian Dollar)'],
  ['CAD', 'CAD (Canadian Dollar)'],
  ['SGD', 'SGD (Singapore Dollar)'],
  ['AED', 'AED (UAE Dirham)'],
];

export const INVOICE_OPTION_TOGGLES = [
  ['showLogo', 'Logo'],
  ['showSignature', 'Signature'],
  ['showGST', 'GST'],
  ['showState', 'State'],
  ['showGSTIN', 'GSTIN'],
  ['showPlaceOfSupply', 'Place of Supply'],
  ['showHSN', 'HSN/SAC'],
  ['showDiscount', 'Discount'],
  ['showItemQty', 'Qty Column'],
  ['showDueDate', 'Due Date'],
  ['showAmountWords', 'Amount in Words'],
  ['showBankDetails', 'Bank Details'],
  ['showUPI', 'UPI QR Code'],
  ['showTerms', 'Terms & Conditions'],
  ['showNotes', 'Notes / Remarks'],
];

export function loadInvoiceDraft() {
  try {
    const saved = sessionStorage.getItem('gst_invoiceDraft');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function clearInvoiceDraft() {
  sessionStorage.removeItem('gst_invoiceDraft');
}
