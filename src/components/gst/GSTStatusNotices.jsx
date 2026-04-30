import { AlertTriangle } from 'lucide-react';

export default function GSTStatusNotices({ warnings, isNilReturn }) {
  const errors = warnings.filter((warning) => warning.type === 'error');

  return (
    <>
      {errors.length > 0 && (
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', borderRadius: '8px', background: 'var(--danger-light, #fef2f2)', fontSize: '0.8rem', color: '#dc2626' }}>
          <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: '0.35rem' }} />
          {errors.slice(0, 3).map((warning) => warning.msg).join(' | ')}
        </div>
      )}

      {isNilReturn && (
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', borderRadius: '8px', background: '#fffbeb', fontSize: '0.8rem', color: '#92400e' }}>
          No invoices or expenses found - file a NIL return on the GST portal. NIL returns are mandatory.
        </div>
      )}
    </>
  );
}
