import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { PrivateAmount } from '../PrivacyContext';

const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Partial'];
const emptyItem = { name: '', hsn: '', quantity: 1, rate: 0, taxPercent: 18 };

function calcItemTax(item) {
  const amount = (item.quantity || 0) * (item.rate || 0);
  const tax = (amount * (item.taxPercent || 0)) / 100;
  return { amount, tax, total: amount + tax };
}

function calcPurchaseTotal(items) {
  return (items || []).reduce((acc, item) => {
    const { amount, tax, total } = calcItemTax(item);
    return { taxable: acc.taxable + amount, tax: acc.tax + tax, total: acc.total + total };
  }, { taxable: 0, tax: 0, total: 0 });
}

export default function PurchaseForm({ isOpen, editingId, purchase, onSave, onClose }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    supplierGstin: '',
    invoiceNumber: '',
    items: [{ ...emptyItem }],
    paymentStatus: 'Unpaid',
    note: '',
  });

  useEffect(() => {
    if (purchase) {
      setForm({
        date: purchase.date || '',
        supplierName: purchase.supplierName || '',
        supplierGstin: purchase.supplierGstin || '',
        invoiceNumber: purchase.invoiceNumber || '',
        items: purchase.items && purchase.items.length > 0 ? purchase.items.map(i => ({ ...i })) : [{ ...emptyItem }],
        paymentStatus: purchase.paymentStatus || 'Unpaid',
        note: purchase.note || '',
      });
    }
  }, [purchase, isOpen]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const updateItem = (index, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  };

  const removeItem = (index) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    if (!form.supplierName.trim()) return;
    if (!form.invoiceNumber.trim()) return;

    const totals = calcPurchaseTotal(form.items);
    const purchaseData = {
      ...(editingId ? { id: editingId } : {}),
      date: form.date,
      supplierName: form.supplierName.trim(),
      supplierGstin: form.supplierGstin.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      items: form.items.map(i => ({
        name: (i.name || '').trim(),
        hsn: (i.hsn || '').trim(),
        quantity: parseFloat(i.quantity) || 0,
        rate: parseFloat(i.rate) || 0,
        taxPercent: parseFloat(i.taxPercent) || 0,
      })),
      totalAmount: totals.total,
      totalTax: totals.tax,
      taxableAmount: totals.taxable,
      paymentStatus: form.paymentStatus,
      note: form.note.trim(),
    };

    onSave(purchaseData);
  };

  if (!isOpen) return null;

  const formTotals = calcPurchaseTotal(form.items);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <h3 className="section-title">{editingId ? 'Edit Purchase Bill' : 'Add Purchase Bill'}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => updateField('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Status</label>
            <select className="form-input" value={form.paymentStatus} onChange={e => updateField('paymentStatus', e.target.value)}>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Supplier Name *</label>
            <input type="text" className="form-input" value={form.supplierName}
              onChange={e => updateField('supplierName', e.target.value)} placeholder="Vendor / Supplier name" />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier GSTIN</label>
            <input type="text" className="form-input" value={form.supplierGstin}
              onChange={e => updateField('supplierGstin', e.target.value)} placeholder="15-digit GSTIN" maxLength={15} />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Number *</label>
            <input type="text" className="form-input" value={form.invoiceNumber}
              onChange={e => updateField('invoiceNumber', e.target.value)} placeholder="Supplier invoice no." />
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input type="text" className="form-input" value={form.note}
              onChange={e => updateField('note', e.target.value)} placeholder="Any note..." />
          </div>
        </div>

        {/* Items */}
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Items</h4>
        {form.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, margin: 0 }}>
              {idx === 0 && <label className="form-label">Name</label>}
              <input type="text" className="form-input" value={item.name}
                onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Item name" />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              {idx === 0 && <label className="form-label">HSN</label>}
              <input type="text" className="form-input" value={item.hsn}
                onChange={e => updateItem(idx, 'hsn', e.target.value)} placeholder="HSN" />
            </div>
            <div className="form-group" style={{ flex: 0.7, margin: 0 }}>
              {idx === 0 && <label className="form-label">Qty</label>}
              <input type="number" className="form-input" value={item.quantity} min="1"
                onChange={e => updateItem(idx, 'quantity', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              {idx === 0 && <label className="form-label">Rate</label>}
              <input type="number" className="form-input" value={item.rate} min="0"
                onChange={e => updateItem(idx, 'rate', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 0.7, margin: 0 }}>
              {idx === 0 && <label className="form-label">Tax %</label>}
              <select className="form-input" value={item.taxPercent}
                onChange={e => updateItem(idx, 'taxPercent', e.target.value)}>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div style={{ flex: '0 0 auto', marginBottom: idx === 0 ? 0 : 0 }}>
              {form.items.length > 1 && (
                <button className="icon-btn icon-btn-red" onClick={() => removeItem(idx)} title="Remove"><Trash2 size={15} /></button>
              )}
            </div>
          </div>
        ))}
        <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', marginTop: '0.25rem' }}
          onClick={addItem}><Plus size={14} /> Add Item</button>

        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <span>Taxable: <strong><PrivateAmount amount={formTotals.taxable} /></strong></span>
          <span>Tax: <strong><PrivateAmount amount={formTotals.tax} /></strong></span>
          <span>Total: <strong><PrivateAmount amount={formTotals.total} /></strong></span>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {editingId ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
