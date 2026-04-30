import { Wallet, Search, X } from 'lucide-react';
import { formatCurrency } from '../../utils';


export default function AgingAnalysis({
  agingByCurrency, agingCurrencies,
  agingSearch, setAgingSearch,
  agingSorted
}) {
  return (
    <>
      {/* Aging Summary Cards — per currency */}
      {agingCurrencies.map(cur => (
        <div key={cur} style={{ marginBottom: '1rem' }}>
          {agingCurrencies.length > 1 && (
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{cur}</p>
          )}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue"><Wallet size={22} /></div>
              <div><p className="stat-label">Total Outstanding</p><h2 className="stat-value">{formatCurrency(agingByCurrency[cur].total, cur)}</h2></div>
            </div>
            <div className="stat-card">
              <div><p className="stat-label">Current (0-30d)</p><h2 className="stat-value stat-value-green">{formatCurrency(agingByCurrency[cur].current, cur)}</h2></div>
            </div>
            <div className="stat-card">
              <div><p className="stat-label">31-60 days</p><h2 className="stat-value stat-value-amber">{formatCurrency(agingByCurrency[cur]['31to60'], cur)}</h2></div>
            </div>
            <div className="stat-card">
              <div><p className="stat-label">61-90 days</p><h2 className="stat-value stat-value-purple">{formatCurrency(agingByCurrency[cur]['61to90'], cur)}</h2></div>
            </div>
            <div className="stat-card">
              <div><p className="stat-label">90+ days</p><h2 className="stat-value" style={{ color: '#dc2626' }}>{formatCurrency(agingByCurrency[cur]['90plus'], cur)}</h2></div>
            </div>
          </div>
        </div>
      ))}
      {agingCurrencies.length === 0 && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '1.5rem' }}>
          {['Total Outstanding', 'Current (0-30d)', '31-60 days', '61-90 days', '90+ days'].map(label => (
            <div key={label} className="stat-card">
              <div><p className="stat-label">{label}</p><h2 className="stat-value">{formatCurrency(0)}</h2></div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="glass-panel p-4 mb-6" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <div className="search-box" style={{ maxWidth: '350px' }}>
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Filter by client name..." value={agingSearch}
            onChange={e => setAgingSearch(e.target.value)} className="search-input" />
          {agingSearch && <button className="icon-btn" onClick={() => setAgingSearch('')}><X size={14} /></button>}
        </div>
      </div>

      {/* Aging Table */}
      <div className="glass-panel">
        <div className="table-header"><h3>Outstanding Receivables</h3></div>
        {agingSorted.length === 0 ? (
          <div className="empty-state">
            <Wallet size={48} />
            <p>No outstanding receivables found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table" style={{ minWidth: '850px' }}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Paid</th>
                  <th style={{ textAlign: 'right' }}>Outstanding</th>
                  <th style={{ textAlign: 'right' }}>Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {agingSorted.map((r, i) => (
                  <tr key={i} className={r.daysOverdue > 90 ? 'row-overdue' : r.daysOverdue > 30 ? 'row-warning' : ''}>
                    <td className="font-medium">{r.clientName}</td>
                    <td><span className="invoice-badge">{r.invoiceNumber}</span></td>
                    <td className="text-muted">{r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="text-muted">{r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(r.totalAmount, r.currency)}</td>
                    <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>{formatCurrency(r.paidAmount, r.currency)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: r.daysOverdue > 90 ? '#dc2626' : r.daysOverdue > 30 ? '#f59e0b' : 'var(--text-secondary)' }}>
                      {formatCurrency(r.outstanding, r.currency)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: r.daysOverdue > 90 ? '#dc2626' : r.daysOverdue > 30 ? '#f59e0b' : '#059669' }}>
                      {r.daysOverdue > 0 ? `${r.daysOverdue}d` : 'Current'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
