import { Settings } from 'lucide-react';
import { INVOICE_TYPES } from '../../utils';
import { ACCENT_PRESETS, CURRENCY_OPTIONS, INVOICE_OPTION_TOGGLES, PDF_STYLES } from './invoiceConfig';

export default function InvoiceTypeSettings({
  invoiceType,
  typeConfig,
  invoiceOptions,
  showOptions,
  onTypeChange,
  onToggleOptions,
  onUpdateOptions,
  onToggleOption,
}) {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="section-title" style={{ margin: 0 }}>Invoice Type</h3>
        <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={onToggleOptions}>
          <Settings size={15} /> {showOptions ? 'Hide Options' : 'Customize'}
        </button>
      </div>
      <div className="type-selector" style={{ marginTop: '0.75rem' }}>
        {Object.entries(INVOICE_TYPES).map(([key, val]) => (
          <button key={key} className={`type-chip ${invoiceType === key ? 'type-chip-active' : ''}`} onClick={() => onTypeChange(key)}>{val.label}</button>
        ))}
      </div>
      <p className="type-desc">{typeConfig?.description}</p>

      {showOptions && (
        <div className="invoice-options">
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Invoice Title</label>
            <input
              type="text"
              className="form-input"
              value={invoiceOptions.customTitle}
              onChange={(event) => onUpdateOptions({ customTitle: event.target.value })}
              placeholder={typeConfig?.title || 'INVOICE'}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Currency</label>
            <select className="form-input" value={invoiceOptions.currency} onChange={(event) => onUpdateOptions({ currency: event.target.value })}>
              {CURRENCY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">PDF Style</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {PDF_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`type-chip ${(invoiceOptions.pdfStyle || 'classic') === style.id ? 'type-chip-active' : ''}`}
                  onClick={() => onUpdateOptions({ pdfStyle: style.id })}
                  title={style.desc}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Accent Color</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                title="Auto (match invoice type)"
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: !invoiceOptions.accentColor ? '2.5px solid #334155' : '2px solid #cbd5e1', background: 'conic-gradient(#1e40af, #7c3aed, #0f766e, #be123c, #1e40af)', cursor: 'pointer', position: 'relative' }}
                onClick={() => onUpdateOptions({ accentColor: '' })}
              >
                {!invoiceOptions.accentColor && <span style={{ position: 'absolute', inset: '3px', borderRadius: '50%', border: '2px solid white' }} />}
              </button>
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  title={preset.label}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: preset.color, border: invoiceOptions.accentColor === preset.color ? '2.5px solid #334155' : '2px solid #cbd5e1', cursor: 'pointer', position: 'relative' }}
                  onClick={() => onUpdateOptions({ accentColor: preset.color })}
                >
                  {invoiceOptions.accentColor === preset.color && <span style={{ position: 'absolute', inset: '3px', borderRadius: '50%', border: '2px solid white' }} />}
                </button>
              ))}
            </div>
          </div>
          <div className="options-grid">
            {INVOICE_OPTION_TOGGLES.map(([key, label]) => (
              <label key={key} className="option-toggle">
                <input type="checkbox" checked={invoiceOptions[key] !== false} onChange={() => onToggleOption(key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
