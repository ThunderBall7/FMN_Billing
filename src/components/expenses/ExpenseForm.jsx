import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { toast } from '../../lib/toast';
import { PrivateAmount } from '../PrivacyContext';

const EXPENSE_CATEGORIES = [
  'Office Rent', 'Utilities', 'Internet & Phone', 'Software & Tools',
  'Travel', 'Meals & Entertainment', 'Office Supplies', 'Salary & Wages',
  'Professional Fees', 'Insurance', 'Marketing & Ads', 'Raw Materials',
  'Shipping & Courier', 'Repairs & Maintenance', 'Bank Charges', 'GST Paid',
  'Other',
];

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card', 'Other'];

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  category: 'Other',
  amount: '',
  gstAmount: '',
  gstPercent: '',
  vendorName: '',
  vendorGstin: '',
  invoiceNo: '',
  paymentMode: 'Bank Transfer',
  note: '',
};

export default function ExpenseForm({ isOpen, editingId, expense, onSave, onClose }) {
  const [form, setForm] = useState(expense ? {
    date: expense.date || '',
    description: expense.description || '',
    category: expense.category || 'Other',
    amount: expense.amount || '',
    gstAmount: expense.gstAmount || '',
    gstPercent: expense.gstPercent || '',
    vendorName: expense.vendorName || '',
    vendorGstin: expense.vendorGstin || '',
    invoiceNo: expense.invoiceNo || '',
    paymentMode: expense.paymentMode || 'Bank Transfer',
    note: expense.note || '',
  } : { ...emptyForm });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleGSTCalc = (val) => {
    updateField('gstPercent', val);
    if (val && form.amount) {
      const base = parseFloat(form.amount);
      const gst = (base * parseFloat(val)) / (100 + parseFloat(val));
      updateField('gstAmount', Math.round(gst * 100) / 100);
    }
  };

  const handleSave = async () => {
    if (!form.description.trim()) { toast('Description is required', 'warning'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast('Enter a valid amount', 'warning'); return; }

    const expenseData = {
      ...(editingId ? { id: editingId } : {}),
      date: form.date,
      description: form.description.trim(),
      category: form.category,
      amount: parseFloat(form.amount),
      gstAmount: form.gstAmount ? parseFloat(form.gstAmount) : 0,
      gstPercent: form.gstPercent ? parseFloat(form.gstPercent) : 0,
      vendorName: form.vendorName.trim(),
      vendorGstin: form.vendorGstin.trim(),
      invoiceNo: form.invoiceNo.trim(),
      paymentMode: form.paymentMode,
      note: form.note.trim(),
    };
    await onSave(expenseData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <h3 className="section-title">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => updateField('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => updateField('category', e.target.value)}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Description *</label>
            <input type="text" className="form-input" value={form.description}
              onChange={e => updateField('description', e.target.value)} placeholder="e.g. AWS Hosting - March" />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (incl. GST) *</label>
            <input type="number" className="form-input" value={form.amount}
              onChange={e => { updateField('amount', e.target.value); if (form.gstPercent) handleGSTCalc(form.gstPercent); }}
              placeholder="0.00" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">GST % (for ITC)</label>
            <input type="number" className="form-input" value={form.gstPercent}
              onChange={e => handleGSTCalc(e.target.value)} placeholder="18" min="0" max="28" />
            {form.gstAmount > 0 && <p className="field-hint">GST: <PrivateAmount amount={form.gstAmount} /></p>}
          </div>
          <div className="form-group">
            <label className="form-label">Vendor Name</label>
            <input type="text" className="form-input" value={form.vendorName}
              onChange={e => updateField('vendorName', e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label className="form-label">Vendor GSTIN</label>
            <input type="text" className="form-input" value={form.vendorGstin}
              onChange={e => updateField('vendorGstin', e.target.value)} placeholder="For ITC claim" maxLength={15} />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice / Bill No</label>
            <input type="text" className="form-input" value={form.invoiceNo}
              onChange={e => updateField('invoiceNo', e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select className="form-input" value={form.paymentMode} onChange={e => updateField('paymentMode', e.target.value)}>
              {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Note (optional)</label>
            <input type="text" className="form-input" value={form.note}
              onChange={e => updateField('note', e.target.value)} placeholder="Any additional note..." />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {editingId ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
