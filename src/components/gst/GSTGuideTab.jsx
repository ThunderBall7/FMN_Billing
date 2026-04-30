import StepList from './StepList';
import { GSTR1_STEPS, GSTR3B_STEPS, NIL_GSTR1_STEPS, NIL_GSTR3B_STEPS } from './filingGuideData';

const GUIDE_TABS = [
  { id: 'regular', label: 'Regular Filing (With Sales)' },
  { id: 'nil', label: 'NIL Return (No Sales)' },
  { id: 'errors', label: 'Common Errors & Fixes' },
];

const GSTR1_TIPS = [
  'Fastest method: Export GSTR-1 JSON, upload it through the GST offline tool, then verify before filing.',
  'If turnover is below Rs. 5 Cr, QRMP can reduce monthly filing work.',
  'Use Table 9A for amendments to previous-period invoices.',
  'Export invoices are zero-rated and should be reported in Table 6A.',
  'Advances received are reported in Table 11A and adjusted when the invoice is issued.',
];

const GSTR3B_TIPS = [
  'From July 2025, Table 3 is auto-populated from GSTR-1. Verify it carefully.',
  'Check GSTR-2B before claiming ITC.',
  'Follow the mandatory ITC utilization order under Section 49.',
  'Use the Electronic Credit Ledger first, then pay the balance through the Electronic Cash Ledger.',
  'Late-payment interest applies on net tax payable from the day after the due date.',
  'Report reverse-charge liability in 3.1(d), then claim eligible ITC in Table 4(A)(3).',
];

const NIL_REQUIREMENTS = [
  'Zero outward supplies during the period',
  'No input tax credit to claim',
  'No tax liability, including reverse charge',
  'No inward supplies liable to reverse charge',
  'If any value exists, file a regular return instead of NIL',
];

const NIL_TIPS = [
  'NIL GSTR-1 and NIL GSTR-3B are separate returns. File both.',
  'NIL filing usually takes only a few minutes per return.',
  'Late fee for NIL returns is lower, but it still applies.',
  'NIL returns can also be filed by SMS where available.',
  'QRMP users file NIL returns for the whole quarter.',
  'Purchases with GST usually mean a regular return is needed if you want to claim ITC.',
];

const COMMON_ERRORS = [
  { error: '"Invalid GSTIN" when adding B2B invoice', fix: 'Verify the client GSTIN on the GST portal and check the 15-character format.' },
  { error: '"Invoice number already exists for this recipient"', fix: 'Invoice numbers must be unique per GSTIN and period. Use amendment tables when correcting prior data.' },
  { error: '"Place of Supply mismatch" or wrong tax type', fix: 'Inter-state supply uses IGST; intra-state supply uses CGST and SGST. Verify buyer state and POS.' },
  { error: '"Invoice date is not within the return period"', fix: 'The invoice date must fall within the selected return period, or be reported as allowed in the current period.' },
  { error: '"HSN code is invalid" in Table 12', fix: 'Use valid HSN/SAC codes from the official master. Services usually use SAC codes beginning with 99.' },
  { error: '"GSTR-3B cannot be filed - GSTR-1 not filed"', fix: 'File GSTR-1 for the period first, then file GSTR-3B.' },
  { error: '"ITC claimed exceeds GSTR-2B available ITC"', fix: 'Claim only eligible ITC available in GSTR-2B.' },
  { error: '"Previous period return not filed"', fix: 'File pending returns sequentially from the earliest open period.' },
  { error: '"Taxable value and tax amount mismatch"', fix: 'Check that tax equals taxable value multiplied by the GST rate, allowing only small rounding differences.' },
  { error: '"EVC generation failed" or "OTP not received"', fix: 'Retry after a few minutes and verify the registered contact details or DSC setup.' },
  { error: '"Challan amount does not match liability"', fix: 'Create the challan after submitting GSTR-3B so the cash payment matches portal liability.' },
];

const KEY_RULES = [
  'Section 16(4): claim ITC within the statutory time limit.',
  'Section 34: issue credit notes within the allowed time window.',
  'Section 31: issue tax invoices at or before time of supply.',
  'Section 49: follow the mandatory ITC utilization order.',
  'Rule 36(4): match ITC with GSTR-2B eligibility.',
  'Section 50: interest applies on late net tax payment.',
  'Maintain GST records for at least 6 years.',
  'Repeated non-filing can lead to GSTIN cancellation.',
];

function TipPanel({ title, color, background, items }) {
  return (
    <div className="glass-panel p-4 mb-4" style={{ background }}>
      <h4 style={{ color, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{title}</h4>
      <ul style={{ fontSize: '0.82rem', color, lineHeight: 1.8, paddingLeft: '1.25rem' }}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export default function GSTGuideTab({ guideTab, onGuideTabChange }) {
  return (
    <>
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '0.75rem', borderLeft: '3px solid var(--primary)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          <strong>Steps:</strong> Review GSTR-1 & 3B tabs -&gt Export JSON -&gt Upload to gst.gov.in -&gt File GSTR-1 first, then GSTR-3B.
          <span style={{ color: 'var(--text-muted)' }}> | Due: R1 by 11th, 3B by 20th of next month | Late fee: Rs. 50/day</span>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {GUIDE_TABS.map((tab) => (
          <button key={tab.id} className={`btn ${guideTab === tab.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onGuideTabChange(tab.id)} style={{ fontSize: '0.82rem' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {guideTab === 'regular' && (
        <>
          <StepList steps={GSTR1_STEPS} title="GSTR-1 - Sales Return (File This First)" />
          <TipPanel title="GSTR-1 Pro Tips" color="#047857" background="#f0fdf4" items={GSTR1_TIPS} />
          <StepList steps={GSTR3B_STEPS} title="GSTR-3B - Summary Return + Tax Payment (File After GSTR-1)" />
          <TipPanel title="GSTR-3B Pro Tips" color="#1e40af" background="#eff6ff" items={GSTR3B_TIPS} />
        </>
      )}

      {guideTab === 'nil' && (
        <>
          <TipPanel title="When to File NIL Return" color="#92400e" background="#fffbeb" items={NIL_REQUIREMENTS} />
          <StepList steps={NIL_GSTR1_STEPS} title="NIL GSTR-1 - File First (Even with Zero Sales)" />
          <StepList steps={NIL_GSTR3B_STEPS} title="NIL GSTR-3B - File After NIL GSTR-1" />
          <TipPanel title="NIL Return Quick Summary" color="#047857" background="#f0fdf4" items={NIL_TIPS} />
        </>
      )}

      {guideTab === 'errors' && (
        <>
          <div className="glass-panel mb-4">
            <div className="table-header"><h3>Common GST Portal Errors & How to Fix Them</h3></div>
            <div style={{ padding: '1rem 1.25rem' }}>
              {COMMON_ERRORS.map((item, index) => (
                <div key={item.error} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: index < COMMON_ERRORS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem' }}>Error: {item.error}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Fix: {item.fix}</p>
                </div>
              ))}
            </div>
          </div>
          <TipPanel title="Key GST Rules to Remember" color="var(--text-secondary)" background="#f8fafc" items={KEY_RULES} />
        </>
      )}
    </>
  );
}
