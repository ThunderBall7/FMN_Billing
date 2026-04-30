import { useState, useEffect } from 'react';
import { Plus, Play } from 'lucide-react';
import { getAllRecurring, saveRecurring, deleteRecurring, saveBill, getNextInvoiceNumber } from '../store';
import { INVOICE_TYPES } from '../utils';
import { toast } from'../lib/toast';
import RecurringForm from './recurring/RecurringForm';
import RecurringTable from './recurring/RecurringTable';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function RecurringInvoices() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const recs = await getAllRecurring();
      setTemplates(recs);
    } catch {
      toast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (tpl) => {
    setEditingId(tpl.id);
    setShowForm(true);
  };

  const handleSave = async (templateData) => {
    try {
      await saveRecurring(templateData);
      toast(editingId ? 'Template updated' : 'Recurring invoice created', 'success');
      setShowForm(false);
      setEditingId(null);
      load();
    } catch {
      toast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this recurring invoice template?')) {
      try { await deleteRecurring(id); toast('Deleted', 'success'); load(); }
      catch { toast('Failed to delete', 'error'); }
    }
  };

  const toggleActive = async (tpl) => {
    await saveRecurring({ ...tpl, active: !tpl.active });
    toast(tpl.active ? 'Paused' : 'Activated', 'info');
    load();
  };

  const generateNow = async (tpl) => {
    try {
      const typeConfig = INVOICE_TYPES[tpl.invoiceType || 'tax-invoice'];
      const invoiceNumber = await getNextInvoiceNumber(typeConfig.prefix);
      const today = new Date().toISOString().split('T')[0];

      const items = (tpl.items || []).map(i => ({
        description: i.description,
        hsn: i.hsn || '',
        quantity: parseFloat(i.quantity) || 1,
        rate: parseFloat(i.rate) || 0,
        taxPercent: parseFloat(i.taxPercent) || 0,
        discount: parseFloat(i.discount) || 0,
      }));

      const totalAmount = items.reduce((sum, i) => {
        const base = i.quantity * i.rate - i.discount;
        return sum + base + (base * i.taxPercent / 100);
      }, 0);
      const totalTaxAmount = items.reduce((sum, i) => {
        const base = i.quantity * i.rate - i.discount;
        return sum + (base * i.taxPercent / 100);
      }, 0);

      const bill = {
        id: invoiceNumber,
        invoiceNumber,
        invoiceDate: today,
        invoiceType: tpl.invoiceType || 'tax-invoice',
        clientName: tpl.clientName,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
        status: 'unpaid',
        paidAmount: 0,
        payments: [],
        data: {
          details: { invoiceNumber, invoiceDate: today },
          client: { name: tpl.clientName, state: tpl.clientState, gstin: tpl.clientGstin, address: tpl.clientAddress },
          items,
        },
        generatedFrom: tpl.id,
      };

      await saveBill(bill);

      const next = new Date(tpl.nextDate || today);
      if (tpl.frequency === 'weekly') next.setDate(next.getDate() + 7);
      else if (tpl.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (tpl.frequency === 'quarterly') next.setMonth(next.getMonth() + 3);
      else if (tpl.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);

      await saveRecurring({ ...tpl, nextDate: next.toISOString().split('T')[0], lastGenerated: today });

      toast(`Invoice ${invoiceNumber} generated for ${tpl.clientName}`, 'success');
      load();
    } catch (err) {
      toast('Failed to generate: ' + err.message, 'error');
    }
  };

  const getDueTemplates = () => {
    const today = new Date().toISOString().split('T')[0];
    return templates.filter(t => t.active !== false && t.nextDate && t.nextDate <= today);
  };

  const dueTemplates = getDueTemplates();
  const editingTemplate = editingId ? templates.find(t => t.id === editingId) : null;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recurring Invoices</h1>
          <p className="page-subtitle">Auto-generate invoices for retainer clients</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> New Template</button>
      </div>

      {dueTemplates.length > 0 && (
        <div className="glass-panel p-4 mb-6" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#92400e' }}>{dueTemplates.length} invoice{dueTemplates.length > 1 ? 's' : ''} due for generation</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {dueTemplates.map(tpl => (
              <button key={tpl.id} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                onClick={() => generateNow(tpl)}>
                <Play size={14} /> {tpl.clientName} — {FREQUENCIES.find(f => f.value === tpl.frequency)?.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <RecurringForm
        isOpen={showForm}
        editingId={editingId}
        template={editingTemplate}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingId(null); }}
      />
      <RecurringTable
        templates={templates}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onToggleActive={toggleActive}
        onGenerateNow={generateNow}
      />
    </div>
  );
}
