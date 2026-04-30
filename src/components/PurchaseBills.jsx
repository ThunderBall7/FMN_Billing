import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Download } from 'lucide-react';
import { getAllPurchases, savePurchase, deletePurchase } from '../store';
import { formatCurrency } from '../utils';
import { toast } from'../lib/toast';
import { getFinancialYearOptions } from '../lib/periods';
import PurchaseForm from './purchases/PurchaseForm';
import PurchaseTable from './purchases/PurchaseTable';

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

export default function PurchaseBills() {
  const [purchases, setPurchases] = useState([]);
  // const [search, setSearch] = useState('');
  const search = '';
  const [fyFilter, setFyFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fyOptions = getFinancialYearOptions();

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setPurchases(await getAllPurchases());
    } catch {
      toast('Failed to load purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fyOptions[0]) setFyFilter(fyOptions[0].value);
    loadPurchases();
  }, []);

  const filtered = purchases.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(p.supplierName || '').toLowerCase().includes(q) &&
          !(p.invoiceNumber || '').toLowerCase().includes(q) &&
          !(p.supplierGstin || '').toLowerCase().includes(q)) return false;
    }
    if (fyFilter) {
      const fy = fyOptions.find(f => f.value === fyFilter);
      if (fy && p.date) {
        if (p.date < fy.from || p.date > fy.to) return false;
      }
    }
    return true;
  });

  const totalStats = filtered.reduce((acc, p) => {
    const t = calcPurchaseTotal(p.items);
    return { taxable: acc.taxable + t.taxable, tax: acc.tax + t.tax, total: acc.total + t.total };
  }, { taxable: 0, tax: 0, total: 0 });

  const openAdd = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (purchase) => {
    setEditingId(purchase.id);
    setShowForm(true);
  };

  const handleSave = async (purchaseData) => {
    try {
      await savePurchase(purchaseData);
      toast(editingId ? 'Purchase updated' : 'Purchase added', 'success');
      setShowForm(false);
      setEditingId(null);
      loadPurchases();
    } catch {
      toast('Failed to save purchase', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this purchase bill?')) {
      try {
        await deletePurchase(id);
        toast('Purchase deleted', 'success');
        loadPurchases();
      } catch {
        toast('Failed to delete', 'error');
      }
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) { toast('No purchases to export', 'warning'); return; }
    const headers = ['Date', 'Supplier', 'GSTIN', 'Invoice No', 'Taxable Amount', 'Tax', 'Total', 'Status', 'Note'];
    const escape = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [headers.map(escape).join(',')];
    filtered.forEach(p => {
      const t = calcPurchaseTotal(p.items);
      lines.push([p.date, p.supplierName, p.supplierGstin, p.invoiceNumber, t.taxable.toFixed(2), t.tax.toFixed(2), t.total.toFixed(2), p.paymentStatus, p.note].map(escape).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'purchases.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('Purchases CSV downloaded', 'success');
  };

  const editingPurchase = editingId ? purchases.find(p => p.id === editingId) : null;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Bills</h1>
          <p className="page-subtitle">Track supplier invoices for ITC claims in GSTR-3B</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Purchase</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><ShoppingCart size={22} /></div>
          <div><p className="stat-label">Total Purchases</p><h2 className="stat-value stat-value-purple">{formatCurrency(totalStats.total)}</h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><ShoppingCart size={22} /></div>
          <div><p className="stat-label">GST (ITC Eligible)</p><h2 className="stat-value stat-value-green">{formatCurrency(totalStats.tax)}</h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><ShoppingCart size={22} /></div>
          <div><p className="stat-label">Entries</p><h2 className="stat-value">{filtered.length}</h2></div>
        </div>
      </div>

      {/* Form Modal & Table */}
      <PurchaseForm
        isOpen={showForm}
        editingId={editingId}
        purchase={editingPurchase}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingId(null); }}
      />
      <PurchaseTable
        filtered={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
