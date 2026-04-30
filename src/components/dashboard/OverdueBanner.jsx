import { AlertTriangle, Send } from 'lucide-react';
import { PrivateValue } from '../PrivacyContext';

export default function OverdueBanner({ overdueCount, overdueText, onView, onRemindAll }) {
  if (overdueCount === 0) return null;

  return (
    <div
      className="overdue-banner"
      onClick={onView}
      style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.85rem 1.25rem', marginBottom: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
    >
      <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 700, color: '#dc2626' }}>
          <PrivateValue value={overdueCount} /> overdue invoice{overdueCount > 1 ? 's' : ''}
        </span>
        <span style={{ color: '#991b1b', marginLeft: 8, fontSize: '0.85rem' }}>
          - <PrivateValue value={overdueText} /> outstanding
        </span>
      </div>
      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', whiteSpace: 'nowrap' }} onClick={onRemindAll}>
        <Send size={13} /> Remind All
      </button>
      <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 500 }}>View all &rarr;</span>
    </div>
  );
}
