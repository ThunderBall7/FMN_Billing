import { Edit3, Plus, Trash2, Save } from 'lucide-react';
import { QUICK_TERMS_TEMPLATES } from './quickTermsTemplates';

export default function TermsTemplatesPanel({
  termsTemplates,
  editingTemplate,
  setEditingTemplate,
  onAddQuickTemplate,
  onSaveTemplate,
  onDeleteTemplate,
}) {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title" style={{ margin: 0 }}>Terms & Conditions Templates</h3>
        <button type="button" className="btn btn-secondary" onClick={() => setEditingTemplate({ id: '', name: '', content: '' })}>
          <Plus size={16} /> New Template
        </button>
      </div>
      <p className="page-subtitle mb-4">Create reusable templates or pick from ready-made ones below.</p>

      {!editingTemplate && (
        <div className="quick-templates-section">
          <p className="form-label" style={{ marginBottom: '0.5rem' }}>Quick Start - Pick a template for your business:</p>
          <div className="quick-templates-grid">
            {QUICK_TERMS_TEMPLATES.map((template) => (
              <button key={template.name} type="button" className="quick-template-btn" onClick={() => onAddQuickTemplate(template)}>
                <Plus size={14} /> {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {editingTemplate && (
        <div className="template-editor">
          <div className="form-group">
            <label className="form-label">Template Name</label>
            <input type="text" className="form-input" value={editingTemplate.name} onChange={(event) => setEditingTemplate({ ...editingTemplate, name: event.target.value })} placeholder="e.g. Standard Terms, Export Terms" />
          </div>
          <div className="form-group">
            <label className="form-label">Content (paste your terms here)</label>
            <textarea rows="8" className="form-input" value={editingTemplate.content} onChange={(event) => setEditingTemplate({ ...editingTemplate, content: event.target.value })} placeholder="Paste or type your terms & conditions..." />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingTemplate(null)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={onSaveTemplate}><Save size={16} /> Save Template</button>
          </div>
        </div>
      )}

      {termsTemplates.length === 0 && !editingTemplate ? (
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>No templates yet.</p>
      ) : (
        <div className="template-list">
          {termsTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-card-header">
                <strong>{template.name}</strong>
                <div className="flex gap-2">
                  <button className="icon-btn icon-btn-blue" onClick={() => setEditingTemplate({ ...template })} title="Edit"><Edit3 size={14} /></button>
                  <button className="icon-btn icon-btn-red" onClick={() => onDeleteTemplate(template.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="template-card-preview">{template.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
