import { BarChart3, BookOpen, FileText } from 'lucide-react';

const TABS = [
  { id: 'gstr1', label: 'GSTR-1', icon: BarChart3 },
  { id: 'gstr3b', label: 'GSTR-3B', icon: FileText },
  { id: 'guide', label: 'Filing Guide', icon: BookOpen },
];

export default function GSTTabNav({ activeTab, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onChange(tab.id)}
          style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
        >
          <tab.icon size={14} /> {tab.label}
        </button>
      ))}
    </div>
  );
}
