import { Clock, IndianRupee, Receipt, TrendingUp } from 'lucide-react';
import { PrivateAmount, PrivateValue } from '../PrivacyContext';

function CurrencyValues({ values, field, className = '' }) {
  const entries = Object.entries(values);
  if (entries.length === 0) return <h2 className={`stat-value ${className}`}>-</h2>;

  return entries.map(([currency, value]) => (
    <div key={currency} className={`stat-value ${className}`} style={{ fontSize: entries.length > 1 ? '1.1rem' : undefined }}>
      <PrivateAmount amount={value[field]} currency={currency} />
    </div>
  ));
}

export default function DashboardStats({ stats }) {
  return (
    <div className="stats-grid stats-grid-4">
      <div className="stat-card">
        <div className="stat-icon stat-icon-blue"><IndianRupee size={22} /></div>
        <div style={{ flex: 1 }}>
          <p className="stat-label">Total Invoiced</p>
          <CurrencyValues values={stats.byCurrency} field="total" />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon-green"><TrendingUp size={22} /></div>
        <div style={{ flex: 1 }}>
          <p className="stat-label">Tax Collected</p>
          <CurrencyValues values={stats.byCurrency} field="tax" className="stat-value-green" />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon-amber"><Clock size={22} /></div>
        <div style={{ flex: 1 }}>
          <p className="stat-label">Outstanding</p>
          <CurrencyValues values={stats.byCurrency} field="unpaid" className="stat-value-amber" />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon-purple"><Receipt size={22} /></div>
        <div><p className="stat-label">Invoices</p><h2 className="stat-value stat-value-purple"><PrivateValue value={stats.count} /></h2></div>
      </div>
    </div>
  );
}
