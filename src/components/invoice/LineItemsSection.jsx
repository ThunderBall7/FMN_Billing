import { Plus, Trash2 } from 'lucide-react';

const TAX_RATES = [0, 5, 12, 18, 28];

export default function LineItemsSection({
  items,
  invoiceOptions,
  showGST,
  taxInclusive,
  onTaxInclusiveChange,
  onItemChange,
  onSelectProduct,
  getProductSuggestions,
  onProductSearchBlur,
  onAddItem,
  onRemoveItem,
}) {
  return (
    <div className="glass-panel p-6 mb-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Line Items</h3>
        {showGST && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={taxInclusive}
              onChange={(event) => onTaxInclusiveChange(event.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 500 }}>Prices include tax</span>
          </label>
        )}
      </div>
      {items.map((item) => (
        <div key={item.id} className="line-item-row">
          <div className="line-item-field" style={{ flex: 2.5, position: 'relative' }}>
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={item.name}
              onChange={(event) => onItemChange(item.id, 'name', event.target.value)}
              onBlur={onProductSearchBlur}
              autoComplete="off"
            />
            {getProductSuggestions(item.id).length > 0 && (
              <div className="product-suggestions">
                {getProductSuggestions(item.id).map((product) => (
                  <div key={product.id} className="product-suggestion-item" onMouseDown={() => onSelectProduct(item.id, product)}>
                    <span className="product-suggestion-name">{product.name}</span>
                    <span className="product-suggestion-meta">
                      {product.hsn && `HSN: ${product.hsn}`}{product.hsn && product.rate ? ' · ' : ''}{product.rate ? `₹${product.rate}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {invoiceOptions.showHSN && (
            <div className="line-item-field" style={{ flex: 1 }}>
              <label className="form-label">HSN/SAC</label>
              <input type="text" className="form-input" value={item.hsn} onChange={(event) => onItemChange(item.id, 'hsn', event.target.value)} />
            </div>
          )}
          <div className="line-item-field" style={{ flex: 0.8 }}>
            <label className="form-label">Qty</label>
            <input type="number" min="1" className="form-input" value={item.quantity} onChange={(event) => onItemChange(item.id, 'quantity', parseFloat(event.target.value) || 0)} />
          </div>
          <div className="line-item-field" style={{ flex: 1.2 }}>
            <label className="form-label">Rate</label>
            <input type="number" min="0" className="form-input" value={item.rate} onChange={(event) => onItemChange(item.id, 'rate', parseFloat(event.target.value) || 0)} />
          </div>
          {invoiceOptions.showDiscount && (
            <div className="line-item-field" style={{ flex: 1 }}>
              <label className="form-label">Discount</label>
              <input type="number" min="0" className="form-input" value={item.discount} onChange={(event) => onItemChange(item.id, 'discount', parseFloat(event.target.value) || 0)} />
            </div>
          )}
          {showGST && (
            <div className="line-item-field" style={{ flex: 0.8 }}>
              <label className="form-label">Tax %</label>
              <select className="form-input" value={item.taxPercent} onChange={(event) => onItemChange(item.id, 'taxPercent', parseFloat(event.target.value) || 0)}>
                {TAX_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>
            </div>
          )}
          <div className="line-item-field line-item-delete">
            <button className="icon-btn icon-btn-red" onClick={() => onRemoveItem(item.id)} title="Remove"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      <button className="btn btn-secondary mt-2" onClick={onAddItem}><Plus size={18} /> Add Item</button>
    </div>
  );
}
