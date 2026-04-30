import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PLStatement({
  totalRevenue, totalTaxCollected, revenueExTax,
  totalExpenseAmount, totalExpenseGST, expenseExGST,
  netProfit, currencyFilter, monthlyPL, allCurrencies
}) {
  const monthlyKeys = Object.keys(monthlyPL).sort();

  return (
    <>
      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><TrendingUp size={22} /></div>
          <div><p className="stat-label">Revenue (ex. tax)</p><h2 className="stat-value stat-value-green">{formatCurrency(revenueExTax, currencyFilter)}</h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><TrendingDown size={22} /></div>
          <div><p className="stat-label">Expenses (ex. GST)</p><h2 className="stat-value stat-value-purple">{formatCurrency(expenseExGST, currencyFilter)}</h2></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: netProfit >= 0 ? 'var(--success-light)' : 'var(--danger-light)', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            <Wallet size={22} />
          </div>
          <div>
            <p className="stat-label">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</p>
            <h2 className="stat-value" style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(Math.abs(netProfit), currencyFilter)}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><BarChart3 size={22} /></div>
          <div><p className="stat-label">Margin</p><h2 className="stat-value">{revenueExTax > 0 ? Math.round((netProfit / revenueExTax) * 100) : 0}%</h2></div>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="table-header">
          <h3>Profit & Loss Statement</h3>
          {allCurrencies.length > 1 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              Showing {currencyFilter} invoices only
            </span>
          )}
        </div>
        <div style={{ padding: '1.5rem' }}>
          <table style={{ width: '100%', maxWidth: '500px', margin: '0 auto', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.6rem 0', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Revenue</td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalRevenue, currencyFilter)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.6rem 0', fontWeight: 500, color: 'var(--text-secondary)' }}>Less: GST Collected</td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#dc2626' }}>-{formatCurrency(totalTaxCollected, currencyFilter)}</td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <td style={{ padding: '0.6rem 0', fontWeight: 700 }}>Net Revenue</td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(revenueExTax, currencyFilter)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.6rem 0', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Expenses</td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalExpenseAmount, currencyFilter)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.6rem 0', fontWeight: 500, color: 'var(--text-secondary)' }}>Less: GST on Expenses (ITC)</td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#059669' }}>-{formatCurrency(totalExpenseGST, currencyFilter)}</td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <td style={{ padding: '0.6rem 0', fontWeight: 700 }}>Net Expenses</td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(expenseExGST, currencyFilter)}</td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 0', fontWeight: 800, fontSize: '1.1rem' }}>
                  Net {netProfit >= 0 ? 'Profit' : 'Loss'}
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 800, fontSize: '1.25rem', color: netProfit >= 0 ? '#059669' : '#dc2626' }}>
                  {formatCurrency(Math.abs(netProfit), currencyFilter)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {monthlyKeys.length > 0 && (
        <div className="glass-panel">
          <div className="table-header"><h3>Monthly Breakdown</h3></div>
          <div className="table-scroll">
            <table className="data-table" style={{ minWidth: '600px' }}>
              <thead><tr>
                <th>Month</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Expenses</th>
                <th style={{ textAlign: 'right' }}>Profit/Loss</th>
              </tr></thead>
              <tbody>
                {monthlyKeys.map(key => {
                  const m = monthlyPL[key];
                  const rev = m.revenue - m.tax;
                  const exp = m.expense - m.expGst;
                  const pl = rev - exp;
                  const [y, mo] = key.split('-');
                  return (
                    <tr key={key}>
                      <td className="font-medium">{MONTHS[parseInt(mo) - 1]} {y}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(rev, currencyFilter)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(exp, currencyFilter)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: pl >= 0 ? '#059669' : '#dc2626' }}>
                        {formatCurrency(Math.abs(pl), currencyFilter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
