import { useState, useEffect, useRef } from 'react';
import { getProfile, saveProfile, exportAllData, importData, getTermsTemplates, saveTermsTemplate, deleteTermsTemplate, getAllProfiles, saveBusinessProfile, deleteBusinessProfile, getInvoiceNumberSettings, saveInvoiceNumberSettings, getFirebaseSettings, saveFirebaseSettings, copyLocalDataToFirebase } from '../store';
import { COUNTRIES, getCountryConfig, getStatesForCountry } from '../utils';
import { Save, Trash2, Image, PenTool, Hash } from 'lucide-react';
import { uploadBackupToFirebase, downloadBackupFromFirebase } from '../services/firebaseSync';
import { LoadingSpinner } from './LoadingSpinner';
import { toast } from'../lib/toast';
import BusinessProfilesPanel from './settings/BusinessProfilesPanel';
import DataManagementPanel from './settings/DataManagementPanel';
import FirebaseStoragePanel from './settings/FirebaseStoragePanel';
import TermsTemplatesPanel from './settings/TermsTemplatesPanel';

export default function SettingsView({ onSaved }) {
  const [profile, setProfile] = useState({
    businessName: '', address: '', state: '', gstin: '', pan: '',
    email: '', phone: '', bankName: '', accountNumber: '', ifsc: '',
    logo: '', logoHeight: 48, signature: '', upiId: '',
  });
  const [saving, setSaving] = useState(false);
  const [termsTemplates, setTermsTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [businessProfiles, setBusinessProfiles] = useState([]);
  const [invNumSettings, setInvNumSettings] = useState({
    format: 'branded', brandPrefix: '', separator: '/', showFinYear: true, startNumber: 1, padDigits: 4,
  });
  const [invNumSaving, setInvNumSaving] = useState(false);
  const [firebaseSettings, setFirebaseSettings] = useState({ enabled: true, dataPath: 'fmnBilling' });
  const [firebaseBusy, setFirebaseBusy] = useState(false);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const sigInputRef = useRef(null);
  const companyFormRef = useRef(null);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    loadTemplates().catch(() => {});
    loadBusinessProfiles().catch(() => {});
    getInvoiceNumberSettings().then(setInvNumSettings).catch(() => {});
    getFirebaseSettings().then(setFirebaseSettings).catch(() => {});
  }, []);

  const loadTemplates = async () => setTermsTemplates(await getTermsTemplates());
  const loadBusinessProfiles = async () => setBusinessProfiles(await getAllProfiles());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast('Image must be under 500KB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setProfile(prev => ({ ...prev, [field]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const removeImage = (field) => setProfile(prev => ({ ...prev, [field]: '' }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveProfile(profile);
      if (onSaved) onSaved(profile);
      toast('Profile saved!', 'success');
    } catch { toast('Failed to save profile', 'error'); }
    finally { setSaving(false); }
  };

  // Invoice Number Settings
  const handleInvNumChange = (field, value) => {
    setInvNumSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveInvNumSettings = async () => {
    setInvNumSaving(true);
    try {
      await saveInvoiceNumberSettings(invNumSettings);
      toast('Invoice number settings saved!', 'success');
    } catch { toast('Failed to save settings', 'error'); }
    finally { setInvNumSaving(false); }
  };

  const getInvNumPreview = () => {
    const s = invNumSettings;
    const pfx = s.brandPrefix || 'INV';
    const sep = s.separator || '/';
    const padded = String(s.startNumber || 1).padStart(s.padDigits || 4, '0');
    if (s.format === 'random') {
      return `${pfx}${sep}A3X9K2`;
    }
    if (s.showFinYear) {
      const yr = new Date().getFullYear();
      const ny = (yr + 1).toString().slice(-2);
      return `${pfx}${sep}${yr}-${ny}${sep}${padded}`;
    }
    return `${pfx}${sep}${padded}`;
  };

  // Export / Import
  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fmnBilling-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported!', 'success');
    } catch { toast('Export failed', 'error'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importData(text);
      const parts = [];
      if (result.billCount) parts.push(`${result.billCount} invoice(s)`);
      if (result.hasProfile) parts.push('profile');
      if (result.templateCount) parts.push(`${result.templateCount} template(s)`);
      if (result.clientCount) parts.push(`${result.clientCount} client(s)`);
      toast(`Imported: ${parts.join(', ')}`, 'success');
      if (result.hasProfile) { const p = await getProfile(); setProfile(p); if (onSaved) onSaved(p); }
      if (result.templateCount) loadTemplates();
    } catch { toast('Invalid backup file.', 'error'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFirebaseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFirebaseSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value, enabled: true }));
  };

  const handleSaveFirebase = async () => {
    await saveFirebaseSettings({ ...firebaseSettings, enabled: true });
    toast('Firebase settings saved', 'success');
  };

  const handleFirebaseUpload = async () => {
    setFirebaseBusy(true);
    try {
      await saveFirebaseSettings({ ...firebaseSettings, enabled: true });
      const exported = JSON.parse(await exportAllData());
      await uploadBackupToFirebase(firebaseSettings, exported);
      toast('Backup uploaded to Firebase', 'success');
    } catch (err) {
      toast(err.message || 'Firebase upload failed', 'error');
    } finally {
      setFirebaseBusy(false);
    }
  };

  const handleFirebaseDownload = async () => {
    if (!confirm('Import backup from Firebase into the live Firebase data path?')) return;
    setFirebaseBusy(true);
    try {
      const data = await downloadBackupFromFirebase(firebaseSettings);
      const result = await importData(JSON.stringify(data));
      const p = await getProfile();
      setProfile(p);
      if (onSaved) onSaved(p);
      loadTemplates();
      loadBusinessProfiles();
      toast(`Imported Firebase backup (${result.billCount || 0} invoice(s))`, 'success');
    } catch (err) {
      toast(err.message || 'Firebase download failed', 'error');
    } finally {
      setFirebaseBusy(false);
    }
  };

  const handleCopyLocalToFirebase = async () => {
    if (!confirm('Copy current local data into Firebase? Existing Firebase records with the same IDs will be overwritten.')) return;
    setFirebaseBusy(true);
    try {
      await saveFirebaseSettings({ ...firebaseSettings, enabled: true });
      const result = await copyLocalDataToFirebase(firebaseSettings);
      toast(`Copied ${result.billCount || 0} invoice(s) and ${result.clientCount || 0} client(s) to Firebase`, 'success');
    } catch (err) {
      toast(err.message || 'Firebase copy failed', 'error');
    } finally {
      setFirebaseBusy(false);
    }
  };

  // Terms templates
  const handleSaveTemplate = async () => {
    if (!editingTemplate.name.trim()) { toast('Name required', 'warning'); return; }
    await saveTermsTemplate({ ...editingTemplate });
    toast('Template saved!', 'success');
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id) => {
    if (confirm('Delete this template?')) { await deleteTermsTemplate(id); toast('Deleted', 'success'); loadTemplates(); }
  };

  const handleAddQuickTemplate = async (template) => {
    await saveTermsTemplate(template);
    toast(`Added: ${template.name}`, 'success');
    loadTemplates();
  };

  // Multi-business profiles
  const handleSaveAsProfile = async () => {
    if (!profile.businessName.trim()) { toast('Business name required', 'warning'); return; }
    // Update existing profile with same name, or create new
    const existing = businessProfiles.find(bp => bp.businessName.trim().toLowerCase() === profile.businessName.trim().toLowerCase());
    await saveBusinessProfile({ ...profile, id: existing?.id || undefined });
    toast(existing ? 'Profile updated!' : 'Profile saved!', 'success');
    loadBusinessProfiles();
  };

  const handleLoadProfile = async (bp) => {
    // Auto-save current profile before switching (so it's not lost)
    if (profile.businessName?.trim()) {
      const existing = businessProfiles.find(p => p.businessName.trim().toLowerCase() === profile.businessName.trim().toLowerCase());
      await saveBusinessProfile({ ...profile, id: existing?.id || undefined });
    }
    const loaded = { ...bp };
    delete loaded.id;
    setProfile(loaded);
    await saveProfile(loaded);
    if (onSaved) onSaved(loaded);
    toast(`Switched to ${bp.businessName}`, 'success');
  };

  const handleDeleteProfile = async (id) => {
    if (confirm('Delete this saved business profile?')) {
      await deleteBusinessProfile(id);
      toast('Profile deleted', 'success');
      loadBusinessProfiles();
    }
  };

  const handleAddNewProfile = () => {
    setProfile({
      businessName: '', address: '', city: '', state: '', pin: '', country: 'India',
      gstin: '', pan: '', email: '', phone: '', bankName: '', accountNumber: '', ifsc: '',
      logo: '', logoHeight: 48, signature: '', upiId: '',
    });
    companyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Business profile, branding, integrations & data</p>
        </div>
      </div>

      {/* ---- Business Profile ---- */}
      <form onSubmit={handleSave} className="glass-panel p-6 mb-6" ref={companyFormRef}>
        <h3 className="section-title">Company Details</h3>
        {(() => {
          const cc = getCountryConfig(profile.country);
          return (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group full-width">
                <label className="form-label">Business Name *</label>
                <input required type="text" name="businessName" className="form-input" value={profile.businessName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select name="country" className="form-input" value={profile.country || 'India'} onChange={handleChange}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Address</label>
                <textarea rows="2" name="address" className="form-input" value={profile.address} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" name="city" className="form-input" value={profile.city || ''} onChange={handleChange} placeholder="e.g. Mumbai" />
              </div>
              <div className="form-group">
                <label className="form-label">{cc.postalLabel}</label>
                <input type="text" name="pin" className="form-input" value={profile.pin || ''} onChange={handleChange} placeholder={cc.postalLabel} />
              </div>
              <div className="form-group">
                <label className="form-label">{cc.stateLabel}</label>
                {(() => {
                  const stateOpts = getStatesForCountry(profile.country || 'India');
                  return stateOpts.length > 0 ? (
                    <select name="state" className="form-input" value={profile.state} onChange={handleChange}>
                      <option value="">Select {cc.stateLabel}</option>
                      {stateOpts.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type="text" name="state" className="form-input" value={profile.state || ''} onChange={handleChange} placeholder={cc.stateLabel} />
                  );
                })()}
              </div>
              <div className="form-group">
                <label className="form-label">{cc.taxIdLabel}</label>
                <input type="text" name="gstin" className="form-input" value={profile.gstin} onChange={handleChange}
                  placeholder={cc.taxIdPlaceholder} maxLength={20} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" value={profile.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" name="phone" className="form-input" value={profile.phone} onChange={handleChange} />
              </div>
            </div>
          );
        })()}

        <h3 className="section-title mt-8">Bank Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Bank Name</label>
            <input type="text" name="bankName" className="form-input" value={profile.bankName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input type="text" name="accountNumber" className="form-input" value={profile.accountNumber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">IFSC Code</label>
            <input type="text" name="ifsc" className="form-input" value={profile.ifsc} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">PAN Number</label>
            <input type="text" name="pan" className="form-input" value={profile.pan} onChange={handleChange} />
          </div>
        </div>

        {/* UPI */}
        <h3 className="section-title mt-8">UPI Payment</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group full-width">
            <label className="form-label">UPI ID</label>
            <input type="text" name="upiId" className="form-input" value={profile.upiId} onChange={handleChange}
              placeholder="e.g. yourbusiness@upi or 9876543210@paytm" />
            <p className="field-hint">If set, a QR code will appear on invoices for instant UPI payment.</p>
          </div>
        </div>

        {/* Invoice Number Format */}
        <h3 className="section-title mt-8"><Hash size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Invoice Number Format</h3>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>Preview:</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', margin: 0 }}>{getInvNumPreview()}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group full-width">
            <label className="form-label">Format Style</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'branded', label: 'Branded Sequential', desc: 'PREFIX/2026-27/0001' },
                { id: 'sequential', label: 'Simple Sequential', desc: 'PREFIX/0001' },
                { id: 'random', label: 'Random', desc: 'PREFIX/A3X9K2' },
              ].map(f => (
                <button key={f.id} type="button"
                  className={`type-chip ${invNumSettings.format === f.id ? 'type-chip-active' : ''}`}
                  onClick={() => {
                    const updates = { format: f.id };
                    if (f.id === 'sequential') updates.showFinYear = false;
                    if (f.id === 'branded') updates.showFinYear = true;
                    setInvNumSettings(prev => ({ ...prev, ...updates }));
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Brand Prefix</label>
            <input type="text" className="form-input" value={invNumSettings.brandPrefix}
              onChange={e => handleInvNumChange('brandPrefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. ACME, BK (leave empty for INV/EST/CN)" maxLength={10} />
            <p className="field-hint">Your brand name or abbreviation. Leave empty to use default type prefix (INV, EST, CN, BOS).</p>
          </div>
          <div className="form-group">
            <label className="form-label">Separator</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['/', '-', '#'].map(sep => (
                <button key={sep} type="button"
                  className={`type-chip ${invNumSettings.separator === sep ? 'type-chip-active' : ''}`}
                  style={{ minWidth: 44, fontFamily: 'monospace', fontWeight: 700 }}
                  onClick={() => handleInvNumChange('separator', sep)}>
                  {sep}
                </button>
              ))}
            </div>
          </div>
          {invNumSettings.format !== 'random' && (
            <>
              <div className="form-group">
                <label className="form-label">Include Financial Year</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  <button type="button"
                    className={`type-chip ${invNumSettings.showFinYear ? 'type-chip-active' : ''}`}
                    onClick={() => handleInvNumChange('showFinYear', true)}>Yes (2026-27)</button>
                  <button type="button"
                    className={`type-chip ${!invNumSettings.showFinYear ? 'type-chip-active' : ''}`}
                    onClick={() => handleInvNumChange('showFinYear', false)}>No</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Number Padding</label>
                <select className="form-input" value={invNumSettings.padDigits}
                  onChange={e => handleInvNumChange('padDigits', Number(e.target.value))}>
                  <option value={3}>3 digits (001)</option>
                  <option value={4}>4 digits (0001)</option>
                  <option value={5}>5 digits (00001)</option>
                  <option value={6}>6 digits (000001)</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn btn-primary" onClick={handleSaveInvNumSettings} disabled={invNumSaving}>
            {invNumSaving ? <LoadingSpinner size="sm" /> : <Save size={16} />} {invNumSaving ? 'Saving...' : 'Save Number Format'}
          </button>
        </div>

        {/* Logo & Signature */}
        <h3 className="section-title mt-8">Branding</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Business Logo</label>
            <div className="upload-area">
              {profile.logo ? (
                <div className="logo-upload-section">
                  <div className="logo-preview-box">
                    <img src={profile.logo} alt="Logo" style={{ height: `${profile.logoHeight || 48}px`, maxWidth: '180px', objectFit: 'contain', display: 'block' }} />
                    <button type="button" className="icon-btn icon-btn-red upload-remove" onClick={() => removeImage('logo')}><Trash2 size={14} /></button>
                  </div>
                  <div className="logo-size-control">
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Logo Size on Invoice</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>S</span>
                      <input type="range" min="24" max="80" value={profile.logoHeight || 48} onChange={(e) => setProfile(prev => ({ ...prev, logoHeight: Number(e.target.value) }))} className="logo-slider" />
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>L</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{profile.logoHeight || 48}px height</span>
                  </div>
                  <button type="button" className="upload-change-btn" onClick={() => logoInputRef.current?.click()}>Change Logo</button>
                </div>
              ) : (
                <button type="button" className="upload-btn" onClick={() => logoInputRef.current?.click()}>
                  <Image size={20} /><span>Upload Logo</span><span className="upload-hint">PNG or JPG, square or wide (max 500KB)</span>
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload('logo', e)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Signature / Stamp</label>
            <div className="upload-area">
              {profile.signature ? (
                <div className="upload-preview">
                  <img src={profile.signature} alt="Signature" className="upload-img" />
                  <button type="button" className="icon-btn icon-btn-red upload-remove" onClick={() => removeImage('signature')}><Trash2 size={14} /></button>
                </div>
              ) : (
                <button type="button" className="upload-btn" onClick={() => sigInputRef.current?.click()}>
                  <PenTool size={20} /><span>Upload Signature</span><span className="upload-hint">PNG, JPG (max 500KB)</span>
                </button>
              )}
              <input ref={sigInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload('signature', e)} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <LoadingSpinner size="sm" /> : <Save size={18} />} {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <TermsTemplatesPanel
        termsTemplates={termsTemplates}
        editingTemplate={editingTemplate}
        setEditingTemplate={setEditingTemplate}
        onAddQuickTemplate={handleAddQuickTemplate}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <BusinessProfilesPanel
        businessProfiles={businessProfiles}
        profile={profile}
        onAddNew={handleAddNewProfile}
        onSaveAsProfile={handleSaveAsProfile}
        onLoadProfile={handleLoadProfile}
        onDeleteProfile={handleDeleteProfile}
      />

      <FirebaseStoragePanel
        firebaseSettings={firebaseSettings}
        firebaseBusy={firebaseBusy}
        onChange={handleFirebaseChange}
        onSave={handleSaveFirebase}
        onUpload={handleFirebaseUpload}
        onCopyLocal={handleCopyLocalToFirebase}
        onDownload={handleFirebaseDownload}
      />

      <DataManagementPanel
        fileInputRef={fileInputRef}
        onExport={handleExport}
        onImportClick={() => fileInputRef.current?.click()}
        onImport={handleImport}
      />
    </div>
  );
}
