import { ExternalLink } from 'lucide-react';
import { MONTHS, QUARTERS } from './gstReturnUtils';

export default function GSTReturnsHeader({
  filterMode,
  setFilterMode,
  fyOptions,
  fyFilter,
  setFyFilter,
  quarterFilter,
  setQuarterFilter,
  yearOptions,
  yearFilter,
  setYearFilter,
  monthFilter,
  setMonthFilter,
  periodFiling,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
      <h1 className="page-title" style={{ margin: 0 }}>GST Returns</h1>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
        <select className="form-input" value={filterMode} onChange={(event) => setFilterMode(event.target.value)} style={{ width: 'auto', minWidth: '120px' }}>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly (QRMP)</option>
          <option value="fy">Full Year</option>
        </select>

        {filterMode === 'fy' ? (
          <select className="form-input" value={fyFilter} onChange={(event) => setFyFilter(event.target.value)} style={{ width: 'auto' }}>
            {fyOptions.map((fy) => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
          </select>
        ) : filterMode === 'quarter' ? (
          <>
            <select className="form-input" value={quarterFilter} onChange={(event) => setQuarterFilter(event.target.value)} style={{ width: 'auto' }}>
              {QUARTERS.map((quarter) => <option key={quarter.id} value={quarter.id}>{quarter.label}</option>)}
            </select>
            <select className="form-input" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} style={{ width: 'auto', minWidth: '80px' }}>
              {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </>
        ) : (
          <>
            <select className="form-input" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} style={{ width: 'auto' }}>
              {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
            <select className="form-input" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} style={{ width: 'auto', minWidth: '80px' }}>
              {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </>
        )}

        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: periodFiling.gstr1 ? '#ecfdf5' : '#fef2f2', color: periodFiling.gstr1 ? '#059669' : '#dc2626', fontWeight: 600 }}>
          R1 {periodFiling.gstr1 ? 'Filed' : 'Pending'}
        </span>
        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: periodFiling.gstr3b ? '#ecfdf5' : '#fef2f2', color: periodFiling.gstr3b ? '#059669' : '#dc2626', fontWeight: 600 }}>
          3B {periodFiling.gstr3b ? 'Filed' : 'Pending'}
        </span>
      </div>

      <a href="https://gst.gov.in" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
        <ExternalLink size={14} /> GST Portal
      </a>
    </div>
  );
}
