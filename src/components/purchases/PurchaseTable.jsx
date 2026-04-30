import { useState } from 'react';
import { ShoppingCart, Edit3, Trash2, Search, X } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { InlineLoadingState } from '../LoadingSpinner';
import { getFinancialYearOptions } from '../../lib/periods';

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

export default function PurchaseTable({ filtered, loading, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [fyFilter, setFyFilter] = useState(getFinancialYearOptions()[0]?.value || '');

  const fyOptions = getFinancialYearOptions();

  const totalStats = filtered.reduce((acc, p) => {
    const t = calcPurchaseTotal(p.items);
    return { taxable: acc.taxable + t.taxable, tax: acc.tax + t.tax, total: acc.total + t.total };
  }, { taxable: 0, tax: 0, total: 0 });

  return (
    <div className="glass-panel">
      <div className="table-header"><h3>Purchase Records</h3></div>

      {/* Filters */}
      {filtered.length > 0 && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ maxWidth: '300px' }}>
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search supplier, invoice..." value={search}
                onChange={e => setSearch(e.target.value)} className="search-input" />
            </div>
            <select className="filter-select" value={fyFilter} onChange={e => setFyFilter(e.target.value)}>
              {fyOptions.map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
            </select>
            {search && (
              <button className="icon-btn icon-btn-red" onClick={() => setSearch('')}><X size={15} /></button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <InlineLoadingState title="Loading purchases" message="Fetching supplier bills..." />
      ) : (
      <>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={48} />
          <p>No purchase bills recorded yet.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>GSTIN</th>
                <th>Invoice No</th>
                <th style={{ textAlign: 'right' }}>Taxable</th>
                <th style={{ textAlign: 'right' }}>Tax</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const t = calcPurchaseTotal(p.items);
                return (
                  <tr key={p.id}>
                    <td className="text-muted">{p.date ? new Date(p.date).toLocaleDateString('en-IN') : ''}</td>
                    <td className="font-medium">{p.supplierName}</td>
                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>{p.supplierGstin || '-'}</td>
                    <td><span className="invoice-badge">{p.invoiceNumber}</span></td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.taxable)}</td>
                    <td style={{ textAlign: 'right' }} className="text-muted">{formatCurrency(t.tax)}</td>
                    <td style={{ textAlign: 'right' }} className="font-bold">{formatCurrency(t.total)}</td>
                    <td>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                        background: p.paymentStatus === 'Paid' ? '#ecfdf5' : p.paymentStatus === 'Partial' ? '#f5f3ff' : '#fffbeb',
                        color: p.paymentStatus === 'Paid' ? '#059669' : p.paymentStatus === 'Partial' ? '#8b5cf6' : '#f59e0b',
                      }}>{p.paymentStatus}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-btn icon-btn-blue" onClick={() => onEdit(p)} title="Edit"><Edit3 size={15} /></button>
                        <button className="icon-btn icon-btn-red" onClick={() => onDelete(p.id)} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                <td colSpan={4}>Total</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(totalStats.taxable)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(totalStats.tax)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(totalStats.total)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
}
