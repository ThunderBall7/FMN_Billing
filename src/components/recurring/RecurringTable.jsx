import { Play, Pause, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { INVOICE_TYPES } from '../../utils';
import { InlineLoadingState } from '../LoadingSpinner';
import { PrivateAmount } from '../PrivacyContext';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function RecurringTable({ templates, loading, onEdit, onDelete, onToggleActive, onGenerateNow }) {
  return (
    <div className="glass-panel">
      <div className="table-header"><h3>Recurring Templates</h3></div>
      {loading ? (
        <InlineLoadingState title="Loading recurring invoices" />
      ) : (
      <>
      {templates.length === 0 ? (
        <div className="empty-state">
          <RefreshCw size={48} />
          <p>No recurring invoices set up yet.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Frequency</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Next Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(tpl => {
                const total = (tpl.items || []).reduce((s, i) => {
                  const base = (parseFloat(i.quantity) || 1) * (parseFloat(i.rate) || 0) - (parseFloat(i.discount) || 0);
                  return s + base + (base * (parseFloat(i.taxPercent) || 0) / 100);
                }, 0);
                const isDue = tpl.active !== false && tpl.nextDate && tpl.nextDate <= new Date().toISOString().split('T')[0];
                return (
                  <tr key={tpl.id} style={isDue ? { background: '#fffbeb' } : {}}>
                    <td className="font-medium">{tpl.clientName}</td>
                    <td><span className="type-badge">{FREQUENCIES.find(f => f.value === tpl.frequency)?.label}</span></td>
                    <td className="text-muted">{INVOICE_TYPES[tpl.invoiceType || 'tax-invoice']?.label}</td>
                    <td style={{ textAlign: 'right' }} className="font-bold"><PrivateAmount amount={total} /></td>
                    <td className="text-muted">{tpl.nextDate ? new Date(tpl.nextDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                        background: tpl.active !== false ? '#ecfdf5' : '#f5f3ff',
                        color: tpl.active !== false ? '#059669' : '#7c3aed',
                      }}>{tpl.active !== false ? 'Active' : 'Paused'}</span>
                      {isDue && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#f59e0b' }}>📌 DUE</span>}
                    </td>
                    <td>
                      <div className="table-actions">
                        {isDue && (
                          <button className="icon-btn icon-btn-green" onClick={() => onGenerateNow(tpl)} title="Generate Now"><Play size={15} /></button>
                        )}
                        <button className="icon-btn icon-btn-blue" onClick={() => onToggleActive(tpl)} title={tpl.active !== false ? 'Pause' : 'Activate'}>
                          {tpl.active !== false ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                        <button className="icon-btn icon-btn-blue" onClick={() => onEdit(tpl)} title="Edit"><Edit3 size={15} /></button>
                        <button className="icon-btn icon-btn-red" onClick={() => onDelete(tpl.id)} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
}
