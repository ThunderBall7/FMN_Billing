import { CheckCircle, Download, Upload } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { getTaxableAmount } from './gstReturnUtils';

function MoneyCell({ value, bold = false }) {
  return <td style={{ textAlign: 'right' }} className={bold ? 'font-bold' : undefined}>{formatCurrency(value)}</td>;
}

export default function GSTR1Tab({
  periodFiling,
  markFiled,
  exports,
  b2bRows,
  b2bTotals,
  creditNotes,
  b2cBills,
  b2cLarge,
  b2cByRate,
  b2cRates,
  b2cTotals,
  hsnRows,
  docSummary,
  grandTotals,
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={exports.gstr1Json} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}><Upload size={13} /> JSON Export</button>
        <button className="btn btn-secondary" onClick={exports.b2b} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}><Download size={13} /> B2B</button>
        <button className="btn btn-secondary" onClick={exports.b2c} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}><Download size={13} /> B2C</button>
        <button className="btn btn-secondary" onClick={exports.hsn} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}><Download size={13} /> HSN</button>
        <button className="btn btn-secondary" onClick={exports.cdnr} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}><Download size={13} /> CDNR</button>
        <button className="btn btn-secondary" onClick={exports.docs} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}><Download size={13} /> Docs</button>
        {!periodFiling.gstr1 && (
          <button className="btn btn-secondary" onClick={() => markFiled('gstr1')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', marginLeft: 'auto', color: '#059669', borderColor: '#bbf7d0' }}>
            <CheckCircle size={13} /> Mark Filed
          </button>
        )}
      </div>

      <div className="glass-panel mb-4">
        <div className="table-header">
          <h3>B2B Sales - Table 4A</h3>
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>{b2bRows.length} invoice{b2bRows.length !== 1 ? 's' : ''}</span>
        </div>
        {b2bRows.length === 0 ? (
          <p style={{ padding: '1rem 1.25rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No B2B invoices for this period.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr>
                <th>GSTIN</th><th>Client</th><th>Invoice No</th><th>Date</th><th>POS</th><th>Type</th>
                <th style={{ textAlign: 'right' }}>Taxable</th><th style={{ textAlign: 'right' }}>CGST</th>
                <th style={{ textAlign: 'right' }}>SGST</th><th style={{ textAlign: 'right' }}>IGST</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr></thead>
              <tbody>
                {b2bRows.map((row, index) => (
                  <tr key={index}>
                    <td><span className="invoice-badge">{row.gstin}</span></td>
                    <td className="font-medium">{row.clientName}</td>
                    <td>{row.invoiceNo}</td>
                    <td className="text-muted">{row.date ? new Date(row.date).toLocaleDateString('en-IN') : ''}</td>
                    <td className="text-muted">{row.pos}</td>
                    <td><span className="type-badge">{row.supplyType}</span></td>
                    <MoneyCell value={row.taxable} />
                    <MoneyCell value={row.cgst} />
                    <MoneyCell value={row.sgst} />
                    <MoneyCell value={row.igst} />
                    <MoneyCell value={row.total} bold />
                  </tr>
                ))}
              </tbody>
              <tfoot><tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                <td colSpan={6}>B2B Total</td>
                <MoneyCell value={b2bTotals.taxable} />
                <MoneyCell value={b2bTotals.cgst} />
                <MoneyCell value={b2bTotals.sgst} />
                <MoneyCell value={b2bTotals.igst} />
                <MoneyCell value={b2bTotals.total} />
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>

      {creditNotes.length > 0 && (
        <div className="glass-panel mb-4">
          <div className="table-header">
            <h3>Credit/Debit Notes - Table 9B</h3>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{creditNotes.length} note{creditNotes.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>GSTIN</th><th>Client</th><th>Note No</th><th>Date</th><th style={{ textAlign: 'right' }}>Taxable</th><th style={{ textAlign: 'right' }}>Tax</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {creditNotes.map((bill, index) => {
                  const { client, totals } = bill.data;
                  return (
                    <tr key={index}>
                      <td><span className="invoice-badge">{client?.gstin || 'Unregistered'}</span></td>
                      <td className="font-medium">{client?.name || bill.clientName}</td>
                      <td>{bill.invoiceNumber}</td>
                      <td className="text-muted">{bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString('en-IN') : ''}</td>
                      <MoneyCell value={getTaxableAmount(totals)} />
                      <MoneyCell value={(totals?.cgst || 0) + (totals?.sgst || 0) + (totals?.igst || 0)} />
                      <MoneyCell value={totals?.total || 0} bold />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-panel mb-4">
        <div className="table-header">
          <h3>B2C Sales - Table 7</h3>
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>
            {b2cBills.length} invoice{b2cBills.length !== 1 ? 's' : ''}
            {b2cLarge.length > 0 && <> ({b2cLarge.length} B2C Large)</>}
          </span>
        </div>
        {b2cRates.length === 0 ? (
          <p style={{ padding: '1rem 1.25rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No B2C invoices for this period.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Rate %</th><th style={{ textAlign: 'right' }}>Taxable</th><th style={{ textAlign: 'right' }}>CGST</th><th style={{ textAlign: 'right' }}>SGST</th><th style={{ textAlign: 'right' }}>IGST</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {b2cRates.map((rate) => {
                  const row = b2cByRate[rate];
                  return (
                    <tr key={rate}>
                      <td><span className="type-badge">{rate}%</span></td>
                      <MoneyCell value={row.taxable} />
                      <MoneyCell value={row.cgst} />
                      <MoneyCell value={row.sgst} />
                      <MoneyCell value={row.igst} />
                      <MoneyCell value={row.total} bold />
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                <td>B2C Total</td>
                <MoneyCell value={b2cTotals.taxable} />
                <MoneyCell value={b2cTotals.cgst} />
                <MoneyCell value={b2cTotals.sgst} />
                <MoneyCell value={b2cTotals.igst} />
                <MoneyCell value={b2cTotals.total} />
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel mb-4">
        <div className="table-header">
          <h3>HSN Summary - Table 12</h3>
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>{hsnRows.length} code{hsnRows.length !== 1 ? 's' : ''}</span>
        </div>
        {hsnRows.length === 0 ? (
          <p style={{ padding: '1rem 1.25rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No items found.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>HSN</th><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Taxable</th><th style={{ textAlign: 'right' }}>CGST</th><th style={{ textAlign: 'right' }}>SGST</th><th style={{ textAlign: 'right' }}>IGST</th><th style={{ textAlign: 'right' }}>Total Tax</th></tr></thead>
              <tbody>
                {hsnRows.map((row, index) => (
                  <tr key={index}>
                    <td><span className="invoice-badge">{row.hsn}</span></td>
                    <td className="font-medium">{row.description}</td>
                    <td style={{ textAlign: 'right' }}>{row.quantity}</td>
                    <MoneyCell value={row.taxable} />
                    <MoneyCell value={row.cgst} />
                    <MoneyCell value={row.sgst} />
                    <MoneyCell value={row.igst} />
                    <MoneyCell value={row.totalTax} bold />
                  </tr>
                ))}
              </tbody>
              <tfoot><tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
                <td colSpan={2}>Total</td>
                <td style={{ textAlign: 'right' }}>{hsnRows.reduce((sum, row) => sum + row.quantity, 0)}</td>
                <MoneyCell value={hsnRows.reduce((sum, row) => sum + row.taxable, 0)} />
                <MoneyCell value={hsnRows.reduce((sum, row) => sum + row.cgst, 0)} />
                <MoneyCell value={hsnRows.reduce((sum, row) => sum + row.sgst, 0)} />
                <MoneyCell value={hsnRows.reduce((sum, row) => sum + row.igst, 0)} />
                <MoneyCell value={hsnRows.reduce((sum, row) => sum + row.totalTax, 0)} />
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel mb-4">
        <div className="table-header"><h3>Document Summary - Table 13</h3></div>
        {Object.keys(docSummary).length === 0 ? (
          <p style={{ padding: '1rem 1.25rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No documents issued.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table" style={{ minWidth: '400px' }}>
              <thead><tr><th>Document Type</th><th>From</th><th>To</th><th style={{ textAlign: 'right' }}>Total Issued</th></tr></thead>
              <tbody>
                {Object.entries(docSummary).map(([prefix, row]) => (
                  <tr key={prefix}>
                    <td className="font-medium">{row.type}</td>
                    <td className="text-muted">{row.from}</td>
                    <td className="text-muted">{row.to}</td>
                    <td style={{ textAlign: 'right' }} className="font-bold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel">
        <div className="table-header"><h3>GSTR-1 Summary Totals</h3></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Category</th><th style={{ textAlign: 'right' }}>Taxable</th><th style={{ textAlign: 'right' }}>CGST</th><th style={{ textAlign: 'right' }}>SGST</th><th style={{ textAlign: 'right' }}>IGST</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              <tr><td className="font-medium">B2B Sales</td><MoneyCell value={b2bTotals.taxable} /><MoneyCell value={b2bTotals.cgst} /><MoneyCell value={b2bTotals.sgst} /><MoneyCell value={b2bTotals.igst} /><MoneyCell value={b2bTotals.total} /></tr>
              <tr><td className="font-medium">B2C Sales</td><MoneyCell value={b2cTotals.taxable} /><MoneyCell value={b2cTotals.cgst} /><MoneyCell value={b2cTotals.sgst} /><MoneyCell value={b2cTotals.igst} /><MoneyCell value={b2cTotals.total} /></tr>
            </tbody>
            <tfoot><tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border)' }}>
              <td>Grand Total</td>
              <MoneyCell value={grandTotals.taxable} />
              <MoneyCell value={grandTotals.cgst} />
              <MoneyCell value={grandTotals.sgst} />
              <MoneyCell value={grandTotals.igst} />
              <MoneyCell value={grandTotals.total} />
            </tr></tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
