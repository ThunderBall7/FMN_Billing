import { Download, Upload } from 'lucide-react';

export default function DataManagementPanel({ fileInputRef, onExport, onImportClick, onImport }) {
  return (
    <div className="glass-panel p-6">
      <h3 className="section-title">Data Management</h3>
      <p className="page-subtitle mb-6">Export all data (invoices, profile, clients, templates) as a backup, or import from one.</p>
      <div className="flex gap-4">
        <button type="button" className="btn btn-secondary" onClick={onExport}><Download size={18} /> Export Backup</button>
        <button type="button" className="btn btn-secondary" onClick={onImportClick}><Upload size={18} /> Import Backup</button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
