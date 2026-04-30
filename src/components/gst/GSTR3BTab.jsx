import { CheckCircle, Download } from 'lucide-react';
import { formatCurrency, getStateCode } from '../../utils';
import { computeItemTaxSplit } from './gstReturnUtils';

function getInterStateB2CRows(b2cBills) {
  const interStateB2C = {};
  b2cBills.forEach((bill) => {
    const { profile, client, items, details } = bill.data;
    const isInterState = profile?.state && client?.state && profile.state.toLowerCase() !== client.state.toLowerCase();
    if (!isInterState) return;

    const pos = getStateCode(details?.placeOfSupply || client?.state || '');
    const posName = client?.state || pos;
    (items || []).forEach((item) => {
      if (!interStateB2C[posName]) interStateB2C[posName] = { pos: posName, taxable: 0, igst: 0 };
      const split = computeItemTaxSplit(item, true);
      interStateB2C[posName].taxable += split.taxable;
      interStateB2C[posName].igst += split.igst;
    });
  });
  return Object.values(interStateB2C);
}

export default function GSTR3BTab({ exports, periodFiling, markFiled, grandTotals, b2cBills, itcFromExpenses, outputTax, netTax, netPayable }) {
  const interStateRows = getInterStateB2CRows(b2cBills);

  return (
    <>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={exports.gstr3b} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}><Download size={13} /> 3B CSV</button>
        {!periodFiling.gstr3b && (
          <button className="btn btn-secondary" onClick={() => markFiled('gstr3b')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', marginLeft: 'auto', color: '#059669', borderColor: '#bbf7d0' }}>
            <CheckCircle size={13} /> Mark Filed
          </button>
        )}
      </div>

      <div className="glass-panel mb-4">
        <div className="table-header"><h3>Table 3.1 - Outward Supplies & Tax</h3></div>
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: '600px' }}>
            <thead><tr><th>Nature of Supplies</th><th style={{ textAlign: 'right' }}>Taxable Value</th><th style={{ textAlign: 'right' }}>IGST</th><th style={{ textAlign: 'right' }}>CGST</th><th style={{ textAlign: 'right' }}>SGST</th></tr></thead>
            <tbody>
              <tr><td className="font-medium">(a) Outward taxable supplies (other than zero-rated, nil-rated and exempted)</td><td style={{ textAlign: 'right' }}>{formatCurrency(grandTotals.taxable)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(grandTotals.igst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(grandTotals.cgst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(grandTotals.sgst)}</td></tr>
              <tr><td className="font-medium">(b) Zero-rated supplies</td><td style={{ textAlign: 'right' }}>{formatCurrency(0)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(0)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(0)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(0)}</td></tr>
              <tr><td className="font-medium">(c) Non-GST supplies</td><td style={{ textAlign: 'right' }}>{formatCurrency(0)}</td><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>N/A</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {interStateRows.length > 0 && (
        <div className="glass-panel mb-4">
          <div className="table-header"><h3>Table 3.2 - Inter-state Supplies to Unregistered Persons</h3></div>
          <div className="table-scroll">
            <table className="data-table" style={{ minWidth: '400px' }}>
              <thead><tr><th>Place of Supply</th><th style={{ textAlign: 'right' }}>Taxable Value</th><th style={{ textAlign: 'right' }}>IGST</th></tr></thead>
              <tbody>
                {interStateRows.map((row, index) => (
                  <tr key={index}><td className="font-medium">{row.pos}</td><td style={{ textAlign: 'right' }}>{formatCurrency(row.taxable)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(row.igst)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                <td>Total</td><td style={{ textAlign: 'right' }}>{formatCurrency(interStateRows.reduce((sum, row) => sum + row.taxable, 0))}</td><td style={{ textAlign: 'right' }}>{formatCurrency(interStateRows.reduce((sum, row) => sum + row.igst, 0))}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="glass-panel mb-4">
        <div className="table-header"><h3>Table 4 - Eligible ITC (from Expenses & Purchases)</h3></div>
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: '500px' }}>
            <thead><tr><th>Details</th><th style={{ textAlign: 'right' }}>IGST</th><th style={{ textAlign: 'right' }}>CGST</th><th style={{ textAlign: 'right' }}>SGST</th></tr></thead>
            <tbody>
              <tr><td className="font-medium">(A) ITC Available - All other ITC</td><td style={{ textAlign: 'right' }}>{formatCurrency(itcFromExpenses.igst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(itcFromExpenses.cgst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(itcFromExpenses.sgst)}</td></tr>
              <tr className="font-bold"><td>Net ITC Available</td><td style={{ textAlign: 'right' }}>{formatCurrency(itcFromExpenses.igst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(itcFromExpenses.cgst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(itcFromExpenses.sgst)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="field-hint" style={{ padding: '0.75rem 1.25rem' }}>
          ITC calculated from Expense Tracker and Purchase Bills entries with GST. Verify against GSTR-2B on the GST portal for actual eligible ITC.
        </p>
      </div>

      <div className="glass-panel mb-4">
        <div className="table-header"><h3>Table 6 - Tax Payment Summary</h3></div>
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: '600px' }}>
            <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>IGST</th><th style={{ textAlign: 'right' }}>CGST</th><th style={{ textAlign: 'right' }}>SGST</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              <tr><td className="font-medium">Output Tax Liability</td><td style={{ textAlign: 'right' }}>{formatCurrency(outputTax.igst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(outputTax.cgst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(outputTax.sgst)}</td><td style={{ textAlign: 'right' }} className="font-bold">{formatCurrency(outputTax.igst + outputTax.cgst + outputTax.sgst)}</td></tr>
              <tr><td className="font-medium" style={{ color: '#059669' }}>Less: ITC Claimed</td><td style={{ textAlign: 'right', color: '#059669' }}>-{formatCurrency(itcFromExpenses.igst)}</td><td style={{ textAlign: 'right', color: '#059669' }}>-{formatCurrency(itcFromExpenses.cgst)}</td><td style={{ textAlign: 'right', color: '#059669' }}>-{formatCurrency(itcFromExpenses.sgst)}</td><td style={{ textAlign: 'right', color: '#059669' }}>-{formatCurrency(itcFromExpenses.igst + itcFromExpenses.cgst + itcFromExpenses.sgst)}</td></tr>
            </tbody>
            <tfoot><tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
              <td>Net Tax Payable</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(netTax.igst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(netTax.cgst)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(netTax.sgst)}</td>
              <td style={{ textAlign: 'right', color: 'var(--primary)', fontSize: '1.1rem' }}>{formatCurrency(netPayable)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>Net GST Payable</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{formatCurrency(netPayable)}</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
          {netPayable === 0 ? 'ITC covers your liability' : 'Pay via Electronic Cash Ledger'}
        </p>
      </div>
    </>
  );
}
