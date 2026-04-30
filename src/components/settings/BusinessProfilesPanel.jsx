import { Building2, Plus, Trash2 } from 'lucide-react';

export default function BusinessProfilesPanel({ businessProfiles, profile, onAddNew, onSaveAsProfile, onLoadProfile, onDeleteProfile }) {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title" style={{ margin: 0 }}>Business Profiles</h3>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={onAddNew}><Plus size={16} /> Add New Profile</button>
          <button type="button" className="btn btn-primary" onClick={onSaveAsProfile}><Building2 size={16} /> Save as Profile</button>
        </div>
      </div>
      <p className="page-subtitle mb-4">Save multiple business profiles and switch between them instantly. Switching auto-saves your current profile first.</p>
      {businessProfiles.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>No saved profiles yet. Fill in your business details above and click "Save as Profile".</p>
      ) : (
        <div className="template-list">
          {businessProfiles.map((businessProfile) => {
            const isActive = businessProfile.businessName?.trim().toLowerCase() === profile.businessName?.trim().toLowerCase();
            return (
              <div key={businessProfile.id} className="template-card" style={isActive ? { borderColor: 'var(--primary)', borderWidth: '2px' } : {}}>
                <div className="template-card-header">
                  <div>
                    <strong>{businessProfile.businessName}</strong>
                    {isActive && <span style={{ fontSize: '0.68rem', background: 'var(--primary)', color: '#fff', borderRadius: '4px', padding: '0.1rem 0.4rem', marginLeft: '0.5rem' }}>Active</span>}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      {businessProfile.state}{businessProfile.gstin ? ` | ${businessProfile.gstin}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => onLoadProfile(businessProfile)} disabled={isActive}>
                      {isActive ? 'Current' : 'Switch'}
                    </button>
                    <button className="icon-btn icon-btn-red" onClick={() => onDeleteProfile(businessProfile.id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                {businessProfile.address && <p className="template-card-preview">{businessProfile.address}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
