import { PrivateAmount, PrivateValue } from '../PrivacyContext';

export default function GSTSummaryBar({ invoiceCount, grandTotals, totalTax, netPayable }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', marginBottom: '1rem', flexWrap: 'wrap' }}>
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div><p className="stat-label" style={{ margin: 0, fontSize: '0.7rem' }}>Invoices</p><strong style={{ fontSize: '1.25rem' }}><PrivateValue value={invoiceCount} /></strong></div>
        <div style={{ width: '1px', height: '2rem', background: 'var(--border)' }} />
        <div><p className="stat-label" style={{ margin: 0, fontSize: '0.7rem' }}>Taxable</p><strong style={{ fontSize: '1rem' }}><PrivateAmount amount={grandTotals.taxable} /></strong></div>
        <div style={{ width: '1px', height: '2rem', background: 'var(--border)' }} />
        <div><p className="stat-label" style={{ margin: 0, fontSize: '0.7rem' }}>Tax</p><strong style={{ fontSize: '1rem' }}><PrivateAmount amount={totalTax} /></strong></div>
        <div style={{ width: '1px', height: '2rem', background: 'var(--border)' }} />
        <div><p className="stat-label" style={{ margin: 0, fontSize: '0.7rem' }}>Net Payable</p><strong style={{ fontSize: '1rem', color: 'var(--primary)' }}><PrivateAmount amount={netPayable} /></strong></div>
      </div>
    </div>
  );
}
