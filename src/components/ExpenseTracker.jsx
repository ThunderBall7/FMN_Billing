import { useState, useEffect } from 'react';
import { Wallet, Plus, Download, Search, X, Calendar } from 'lucide-react';
import { getAllExpenses, saveExpense, deleteExpense } from '../store';
import { InlineLoadingState } from './LoadingSpinner';
import { toast } from'../lib/toast';
import { getFinancialYearOptions } from '../lib/periods';
import ExpenseForm from './expenses/ExpenseForm';
import ExpenseTable from './expenses/ExpenseTable';
import { PrivateAmount, PrivateValue } from './PrivacyContext';

const EXPENSE_CATEGORIES = [
  'Office Rent', 'Utilities', 'Internet & Phone', 'Software & Tools',
  'Travel', 'Meals & Entertainment', 'Office Supplies', 'Salary & Wages',
  'Professional Fees', 'Insurance', 'Marketing & Ads', 'Raw Materials',
  'Shipping & Courier', 'Repairs & Maintenance', 'Bank Charges', 'GST Paid',
  'Other',
];

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fyFilter, setFyFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fyOptions = getFinancialYearOptions();

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setExpenses(await getAllExpenses());
    } catch {
      toast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fyOptions[0]) setFyFilter(fyOptions[0].value);
    loadExpenses();
  }, []);

  const filtered = expenses.filter(exp => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(exp.description || '').toLowerCase().includes(q) &&
          !(exp.vendorName || '').toLowerCase().includes(q) &&
          !(exp.invoiceNo || '').toLowerCase().includes(q)) return false;
    }
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
    if (fyFilter) {
      const fy = fyOptions.find(f => f.value === fyFilter);
      if (fy && exp.date) {
        if (exp.date < fy.from || exp.date > fy.to) return false;
      }
    }
    return true;
  });

  const totalAmount = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const totalGST = filtered.reduce((s, e) => s + (e.gstAmount || 0), 0);

  const openAdd = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditingId(exp.id);
    setShowForm(true);
  };

  const handleSave = async (expenseData) => {
    try {
      await saveExpense(expenseData);
      toast(editingId ? 'Expense updated' : 'Expense added', 'success');
      setShowForm(false);
      setEditingId(null);
      loadExpenses();
    } catch {
      toast('Failed to save expense', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this expense?')) {
      try {
        await deleteExpense(id);
        toast('Expense deleted', 'success');
        loadExpenses();
      } catch {
        toast('Failed to delete', 'error');
      }
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) { toast('No expenses to export', 'warning'); return; }
    const headers = ['Date', 'Description', 'Category', 'Amount', 'GST Amount', 'GST %', 'Vendor', 'Vendor GSTIN', 'Invoice No', 'Payment Mode', 'Note'];
    const escape = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [headers.map(escape).join(',')];
    filtered.forEach(e => {
      lines.push([e.date, e.description, e.category, e.amount, e.gstAmount || 0, e.gstPercent || 0, e.vendorName, e.vendorGstin, e.invoiceNo, e.paymentMode, e.note].map(escape).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'expenses.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('Expenses CSV downloaded', 'success');
  };

  const editingExpense = editingId ? expenses.find(e => e.id === editingId) : null;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track business expenses for P&L and ITC claims</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Expense</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><Wallet size={22} /></div>
          <div><p className="stat-label">Total Expenses</p><h2 className="stat-value stat-value-purple"><PrivateAmount amount={totalAmount} /></h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><Calendar size={22} /></div>
          <div><p className="stat-label">GST Paid (ITC)</p><h2 className="stat-value stat-value-green"><PrivateAmount amount={totalGST} /></h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><Wallet size={22} /></div>
          <div><p className="stat-label">Entries</p><h2 className="stat-value"><PrivateValue value={filtered.length} /></h2></div>
        </div>
      </div>

      <div className="glass-panel p-4 mb-6">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ maxWidth: '300px' }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search expenses..." value={search}
              onChange={e => setSearch(e.target.value)} className="search-input" />
          </div>
          <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={fyFilter} onChange={e => setFyFilter(e.target.value)}>
            {fyOptions.map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
          </select>
          {(search || categoryFilter !== 'all') && (
            <button className="icon-btn icon-btn-red" onClick={() => { setSearch(''); setCategoryFilter('all'); }}><X size={15} /></button>
          )}
        </div>
      </div>

      <ExpenseForm
        isOpen={showForm}
        editingId={editingId}
        expense={editingExpense}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingId(null); }}
      />
      {loading ? (
        <div className="glass-panel p-6">
          <InlineLoadingState title="Loading expenses" />
        </div>
      ) : (
      <ExpenseTable
        filtered={filtered}
        expenses={expenses}
        search={search}
        categoryFilter={categoryFilter}
        onSearch={setSearch}
        onCategoryChange={setCategoryFilter}
        onEdit={openEdit}
        onDelete={handleDelete}
        EXPENSE_CATEGORIES={EXPENSE_CATEGORIES}
      />)}
    </div>
  );
}
