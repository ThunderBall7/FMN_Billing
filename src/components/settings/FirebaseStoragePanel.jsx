import { Cloud, Download, Save, Upload } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

export default function FirebaseStoragePanel({ firebaseSettings, firebaseBusy, onChange, onSave, onUpload, onCopyLocal, onDownload }) {
  return (
    <div className="glass-panel p-6 mb-6">
      <h3 className="section-title"><Cloud size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Firebase Storage</h3>
      <p className="page-subtitle mb-4">Cloud Firestore is the live storage for invoices, clients, products, settings, and reports.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Data Path</label>
          <input type="text" name="dataPath" className="form-input" value={firebaseSettings.dataPath} onChange={onChange} placeholder="fmnBilling" />
        </div>
        <div className="form-group full-width">
          <label className="form-label">Firebase App Config</label>
          <p className="field-hint">
            Set your Firebase web app keys in <strong>.env</strong>:
            <br />
            <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_AUTH_DOMAIN</code>, <code>VITE_FIREBASE_PROJECT_ID</code>, <code>VITE_FIREBASE_APP_ID</code>
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn btn-secondary" onClick={onSave} disabled={firebaseBusy}>{firebaseBusy ? <LoadingSpinner size="sm" /> : <Save size={16} />} Save Firebase Settings</button>
        <button type="button" className="btn btn-primary" onClick={onUpload} disabled={firebaseBusy || !firebaseSettings.dataPath.trim()}>{firebaseBusy ? <LoadingSpinner size="sm" /> : <Upload size={16} />} Upload Backup</button>
        <button type="button" className="btn btn-secondary" onClick={onCopyLocal} disabled={firebaseBusy || !firebaseSettings.dataPath.trim()}>{firebaseBusy ? <LoadingSpinner size="sm" /> : <Upload size={16} />} Copy Local Data to Firebase</button>
        <button type="button" className="btn btn-secondary" onClick={onDownload} disabled={firebaseBusy || !firebaseSettings.dataPath.trim()}>{firebaseBusy ? <LoadingSpinner size="sm" /> : <Download size={16} />} Download Backup</button>
      </div>
    </div>
  );
}
