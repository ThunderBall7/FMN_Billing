import { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

export default function StepList({ steps, title }) {
  const [expanded, setExpanded] = useState({});
  const [checked, setChecked] = useState({});

  return (
    <div className="glass-panel mb-4">
      <div className="table-header"><h3>{title}</h3></div>
      <div style={{ padding: '0.5rem 1rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div
              onClick={() => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 0', cursor: 'pointer' }}
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
                }}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: checked[i] ? '#059669' : 'var(--text-muted)' }}
              >
                <CheckCircle size={18} fill={checked[i] ? 'currentColor' : 'none'} />
              </button>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', textDecoration: checked[i] ? 'line-through' : 'none', color: checked[i] ? 'var(--text-muted)' : 'var(--text)' }}>
                {i + 1}. {step.title}
              </span>
              {expanded[i] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {expanded[i] && (
              <div style={{ padding: '0 0 1rem 2.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {step.details}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
