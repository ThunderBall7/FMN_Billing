import { ArrowLeft, Download, MessageCircle, Save, Truck } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

export default function InvoiceToolbar({
  invoiceType,
  onBack,
  onSave,
  onDownloadPDF,
  onShareWhatsApp,
  onExportEWayBill,
  saving,
  savingPDF,
}) {
  const canExportEWayBill = invoiceType === 'tax-invoice' || invoiceType === 'delivery-challan';

  return (
    <div className="generator-toolbar">
      <div className="flex gap-2 items-center">
        <button className="btn btn-secondary" onClick={onBack}><ArrowLeft size={18} /> Back</button>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-secondary" onClick={onSave} disabled={saving}>
          {saving ? <LoadingSpinner size="sm" /> : <Save size={18} />} {saving ? 'Saving...' : 'Save Invoice'}
        </button>
        <button className="btn btn-primary" onClick={onDownloadPDF} disabled={savingPDF}>
          {savingPDF ? <LoadingSpinner size="sm" /> : <Download size={18} />} {savingPDF ? 'Downloading...' : 'Download PDF'}
        </button>
        <button className="btn btn-secondary" onClick={onShareWhatsApp} disabled={saving} style={{ background: '#25d366', color: '#fff', borderColor: '#25d366' }}>
          <MessageCircle size={18} /> WhatsApp
        </button>
        {canExportEWayBill && (
          <button className="btn btn-secondary" onClick={onExportEWayBill} title="Download E-Way Bill JSON for NIC portal upload">
            <Truck size={18} /> E-Way Bill
          </button>
        )}
      </div>
    </div>
  );
}
