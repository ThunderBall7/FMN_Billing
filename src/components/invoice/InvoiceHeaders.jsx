import { INVOICE_TYPES } from '../utils';

const accentColors = {
  'tax-invoice': '#1e40af',
  'proforma': '#7c3aed',
  'bill-of-supply': '#0f766e',
  'credit-note': '#be123c',
};

export const renderModernHeader = ({
  profile, invoiceType, customTitle, showLogo, showGSTIN, isInterstate,
  clientState, businessState, details, accent
}) => (
  <>
    <div style={{ background: accent, padding: '1.5rem 2rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        {showLogo && profile?.logo && (
          <img src={profile.logo} alt="Logo" style={{ maxHeight: `${profile.logoHeight || 48}px`, maxWidth: '180px', objectFit: 'contain', marginBottom: '0.5rem', display: 'block', filter: 'brightness(0) invert(1)' }} />
        )}
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '0.08em' }}>{customTitle}</h1>
        {invoiceType === 'proforma' && (
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', margin: '0.25rem 0 0' }}>For estimation purposes only</p>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0.25rem', opacity: 0.9 }}>{details.invoiceDate}</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{details.invoiceNumber}</p>
        {showGSTIN && profile?.gstin && (
          <p style={{ fontSize: '0.7rem', margin: '0.5rem 0 0', opacity: 0.8 }}>GSTIN: {profile.gstin}</p>
        )}
      </div>
    </div>
  </>
);

export const renderMinimalHeader = ({
  profile, invoiceType, customTitle, showLogo,
  details
}) => (
  <>
    <div style={{ padding: '2rem 2rem 1rem', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        {showLogo && profile?.logo && (
          <img src={profile.logo} alt="Logo" style={{ maxHeight: `${profile.logoHeight || 48}px`, maxWidth: '180px', objectFit: 'contain', marginBottom: '0.5rem', display: 'block' }} />
        )}
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{customTitle}</h1>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{details.invoiceNumber}</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>{details.invoiceDate}</p>
      </div>
    </div>
    <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
  </>
);

export const renderClassicHeader = ({
  profile, invoiceType, customTitle, showLogo, showGSTIN,
  details
}) => (
  <>
    <table style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse' }}>
      <tbody>
        <tr style={{ borderBottom: '3px solid #000' }}>
          <td style={{ padding: '0.75rem 0', verticalAlign: 'top' }}>
            {showLogo && profile?.logo && (
              <img src={profile.logo} alt="Logo" style={{ maxHeight: `${profile.logoHeight || 48}px`, maxWidth: '180px', objectFit: 'contain', marginRight: '1rem', verticalAlign: 'middle' }} />
            )}
            <h1 style={{ display: 'inline', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{customTitle}</h1>
          </td>
          <td style={{ padding: '0.75rem 0', textAlign: 'right', verticalAlign: 'top' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              <strong>Invoice No:</strong> {details.invoiceNumber}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              <strong>Date:</strong> {details.invoiceDate}
            </p>
            {showGSTIN && profile?.gstin && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                <strong>GSTIN:</strong> {profile.gstin}
              </p>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  </>
);

export const getHeaderRenderer = (style) => {
  if (style === 'modern') return renderModernHeader;
  if (style === 'minimal') return renderMinimalHeader;
  return renderClassicHeader;
};
