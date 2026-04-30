import { Package } from 'lucide-react';

export default function LowStockAlert({ products }) {
  if (products.length === 0) return null;

  return (
    <div className="glass-panel" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Package size={18} style={{ color: '#d97706' }} />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#d97706' }}>
          Low Stock Alert ({products.length} item{products.length > 1 ? 's' : ''})
        </h3>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {products.map((product) => {
          const outOfStock = (product.stock ?? 0) <= 0;
          return (
            <div
              key={product.id}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                background: outOfStock ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${outOfStock ? '#fecaca' : '#fde68a'}`,
                color: outOfStock ? '#dc2626' : '#d97706',
              }}
            >
              <strong>{product.name}</strong>
              {product.hsn ? <span className="text-muted" style={{ marginLeft: 4, fontSize: '0.72rem' }}>({product.hsn})</span> : null}
              <span style={{ marginLeft: 6, fontWeight: 700 }}>{outOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
