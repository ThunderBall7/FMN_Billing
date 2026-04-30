import { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { getAllClients } from '../../store';
import { INVOICE_TYPES } from '../../utils';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function RecurringForm({ isOpen, editingId, template, onSave, onClose }) {
  const [form, setForm] = useState({
    clientName: '', clientState: '', clientGstin: '', clientAddress: '',
    frequency: 'monthly', invoiceType: 'tax-invoice',
    items: [{ description: '', hsn: '', quantity: 1, rate: '', taxPercent: 18, discount: 0 }],
    notes: '', nextDate: '', active: true,
  });
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (isOpen) {
      getAllClients().then(setClients);
      if (template) {
        setForm({
          clientName: template.clientName || '',
          clientState: template.clientState || '',
          clientGstin: template.clientGstin || '',
          clientAddress: template.clientAddress || '',
          frequency: template.frequency || 'monthly',
          invoiceType: template.invoiceType || 'tax-invoice',
          items: template.items || [{ description: '', hsn: '', quantity: 1, rate: '', taxPercent: 18, discount: 0 }],
          notes: template.notes || '',
          nextDate: template.nextDate || '',
          active: template.active !== false,
        });
      } else {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        setForm(prev => ({ ...prev, nextDate: nextMonth.toISOString().split('T')[0] }));
      }
    }
  }, [template, isOpen]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', hsn: '', quantity: 1, rate: '', taxPercent: 18, discount: 0 }],
    }));
  };

  const removeItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const selectClient = (cli) => {
    setForm(prev => ({
      ...prev,
      clientName: cli.name || '',
      clientState: cli.state || '',
      clientGstin: cli.gstin || '',
      clientAddress: cli.address || '',
    }));
  };

  const handleSave = () => {
    if (!form.clientName.trim()) return;
    if (!form.items.some(i => i.description && i.rate)) return;

    const templateData = {
      ...(editingId ? { id: editingId } : {}),
      ...form,
      items: form.items.filter(i => i.description),
    };

    onSave(templateData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh' }}>
        <h3 className="section-title">{editingId ? 'Edit Template' : 'New Recurring Invoice'}</h3>

        {/* Client picker */}
        {!editingId && clients.length > 0 && !form.clientName && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Quick Select Client</label>
            <div className="client-picker">
              {clients.map(cli => (
                <button key={cli.id} className="client-picker-item" onClick={() => selectClient(cli)}>
                  <strong>{cli.name}</strong>
                  <span>{cli.state}{cli.gstin ? ` | ${cli.gstin}` : ''}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Client Name *</label>
            <input type="text" className="form-input" value={form.clientName} onChange={e => updateField('clientName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Client GSTIN</label>
            <input type="text" className="form-input" value={form.clientGstin} onChange={e => updateField('clientGstin', e.target.value)} maxLength={15} />
          </div>
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select className="form-input" value={form.frequency} onChange={e => updateField('frequency', e.target.value)}>
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Next Due Date</label>
            <input type="date" className="form-input" value={form.nextDate} onChange={e => updateField('nextDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Type</label>
            <select className="form-input" value={form.invoiceType} onChange={e => updateField('invoiceType', e.target.value)}>
              {Object.entries(INVOICE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Line Items</h4>
        {form.items.map((item, idx) => (
          <div key={idx} className="line-item-row" style={{ alignItems: 'flex-end' }}>
            <div className="line-item-field" style={{ flex: 2 }}>
              <label className="form-label">Description</label>
              <input type="text" className="form-input" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
            </div>
            <div className="line-item-field" style={{ width: 80 }}>
              <label className="form-label">Qty</label>
              <input type="number" className="form-input" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} min="1" />
            </div>
            <div className="line-item-field" style={{ width: 100 }}>
              <label className="form-label">Rate</label>
              <input type="number" className="form-input" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} min="0" />
            </div>
            <div className="line-item-field" style={{ width: 70 }}>
              <label className="form-label">GST%</label>
              <input type="number" className="form-input" value={item.taxPercent} onChange={e => updateItem(idx, 'taxPercent', e.target.value)} min="0" />
            </div>
            <div className="line-item-delete">
              {form.items.length > 1 && (
                <button className="icon-btn icon-btn-red" onClick={() => removeItem(idx)}><X size={14} /></button>
              )}
            </div>
          </div>
        ))}
        <button className="btn btn-secondary" onClick={addItem} style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          <Plus size={14} /> Add Item
        </button>

        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {editingId ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
