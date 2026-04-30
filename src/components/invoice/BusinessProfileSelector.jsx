export default function BusinessProfileSelector({ profiles, activeProfile, fallbackProfile, onSelect }) {
  if (profiles.length <= 1) return null;

  return (
    <div className="glass-panel p-6 mb-6">
      <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>Billing From (Business Profile)</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {profiles.map((businessProfile) => {
          const isSelected = (activeProfile?.businessName || fallbackProfile?.businessName) === businessProfile.businessName;
          return (
            <button
              key={businessProfile.id}
              type="button"
              onClick={() => onSelect(businessProfile)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: isSelected ? 'rgba(59,130,246,0.08)' : 'var(--surface)',
                color: isSelected ? 'var(--primary)' : 'var(--text)',
                fontWeight: isSelected ? 700 : 400,
              }}
            >
              {businessProfile.businessName}
              {businessProfile.gstin && <span style={{ fontSize: '0.72rem', marginLeft: 6, opacity: 0.7 }}>{businessProfile.gstin}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
