import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import RichEditor from './RichEditor';

export default function TermsAndSections({
  termsTemplates,
  selectedTermsId,
  customTerms,
  customNotes,
  internalNote,
  extraSections,
  onTermsSelect,
  onCustomTermsChange,
  onCustomNotesChange,
  onInternalNoteChange,
  onExtraSectionsChange,
}) {
  const updateSection = (sectionId, changes) => {
    onExtraSectionsChange((sections) => sections.map((section) => section.id === sectionId ? { ...section, ...changes } : section));
  };

  const moveSection = (index, direction) => {
    onExtraSectionsChange((sections) => {
      const nextSections = [...sections];
      const nextIndex = index + direction;
      [nextSections[index], nextSections[nextIndex]] = [nextSections[nextIndex], nextSections[index]];
      return nextSections;
    });
  };

  return (
    <>
      <div className="glass-panel p-6 mb-6">
        <h3 className="section-title">Terms & Conditions</h3>
        {termsTemplates.length > 0 && (
          <div className="form-group">
            <label className="form-label">Load from Template</label>
            <select className="form-input" value={selectedTermsId} onChange={(event) => onTermsSelect(event.target.value)}>
              <option value="">-- Custom --</option>
              {termsTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Terms (appears on invoice)</label>
          <textarea rows="5" className="form-input" value={customTerms} onChange={(event) => onCustomTermsChange(event.target.value)} placeholder="Enter or paste your terms & conditions..." />
        </div>
        <div className="form-group">
          <label className="form-label">Notes / Remarks (optional)</label>
          <textarea rows="3" className="form-input" value={customNotes} onChange={(event) => onCustomNotesChange(event.target.value)} placeholder="Project details, special instructions, additional notes..." />
        </div>
        <div className="form-group" style={{ background: '#fefce8', border: '1px dashed #ca8a04', borderRadius: 8, padding: '0.75rem 1rem' }}>
          <label className="form-label" style={{ color: '#92400e', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v4m0 4h.01"/></svg>
            Private Note (not shown on invoice)
          </label>
          <textarea rows="2" className="form-input" value={internalNote} onChange={(event) => onInternalNoteChange(event.target.value)} style={{ background: '#fffef5', fontSize: '0.82rem' }} placeholder="e.g. Client asked for 15-day credit, follow up on 20th, referred by Ravi..." />
        </div>
      </div>

      <div className="glass-panel p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title" style={{ margin: 0 }}>Additional Pages / Sections</h3>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onExtraSectionsChange((sections) => [...sections, { id: Date.now().toString(), title: '', content: '' }])}>
            <Plus size={15} /> Add Section
          </button>
        </div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
          Add extra sections that appear after the invoice footer. You can paste formatted HTML content (bold, lists, tables, etc.).
        </p>
        {extraSections.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>No extra sections. Click "Add Section" to create one.</p>
        ) : (
          extraSections.map((section, index) => (
            <div key={section.id} className="extra-section-editor">
              <div className="flex gap-2 items-center mb-2">
                <input type="text" className="form-input" value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} placeholder="Section title (e.g. Scope of Work, Delivery Timeline)" style={{ flex: 1 }} />
                <button className="icon-btn" onClick={() => moveSection(index, -1)} title="Move up" disabled={index === 0}><ChevronUp size={14} /></button>
                <button className="icon-btn" onClick={() => moveSection(index, 1)} title="Move down" disabled={index === extraSections.length - 1}><ChevronDown size={14} /></button>
                <button className="icon-btn icon-btn-red" onClick={() => onExtraSectionsChange((sections) => sections.filter((item) => item.id !== section.id))} title="Remove"><Trash2 size={14} /></button>
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <RichEditor value={section.content} onChange={(html) => updateSection(section.id, { content: html })} placeholder="Type or paste formatted content here (supports bold, lists, tables from Word/Docs)..." />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
