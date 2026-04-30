import { getFinancialYearOptions } from '../../lib/periods';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReportsFilterPanel({
  filterMode, setFilterMode,
  fyFilter, setFyFilter,
  monthFilter, setMonthFilter,
  yearFilter, setYearFilter,
  currencyFilter, setCurrencyFilter,
  allCurrencies
}) {
  const fyOptions = getFinancialYearOptions();
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) yearOptions.push(y);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Filter By</label>
          <select className="form-input" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
            <option value="fy">Fiscal Year</option>
            <option value="month">Month / Year</option>
          </select>
        </div>
        {filterMode === 'fy' ? (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fiscal Year</label>
            <select className="form-input" value={fyFilter} onChange={e => setFyFilter(e.target.value)}>
              {fyOptions.map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
            </select>
          </div>
        ) : (
          <>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Month</label>
              <select className="form-input" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Year</label>
              <select className="form-input" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}
        {allCurrencies.length > 1 && (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Currency</label>
            <select className="form-input" value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)}>
              {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
