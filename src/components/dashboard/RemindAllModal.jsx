import { MessageCircle } from 'lucide-react';
import { PrivateAmount, PrivateValue } from '../PrivacyContext';

export default function RemindAllModal({ show, overdueBills, getClientPhone, onClose, onSendReminder }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '550px' }}>
        <h3 className="section-title">Send Payment Reminders</h3>
        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
          Click on a client below to send a WhatsApp payment reminder.
        </p>
        {overdueBills.length === 0 ? (
          <p className="text-muted">No overdue invoices.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {overdueBills.map((bill) => {
              const phone = getClientPhone(bill);
              const currency = bill.currency || bill.data?.invoiceOptions?.currency;
              return (
                <div key={bill.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="font-medium">{bill.clientName}</span>
                    <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.8rem' }}>{bill.invoiceNumber}</span>
                    <span style={{ marginLeft: 8, fontWeight: 600, color: '#dc2626', fontSize: '0.85rem' }}>
                      <PrivateAmount amount={bill.totalAmount - (bill.paidAmount || 0)} currency={currency} />
                    </span>
                    {phone && <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.75rem' }}><PrivateValue value={phone} /></span>}
                  </div>
                  <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }} onClick={() => onSendReminder({ ...bill, clientPhone: phone })}>
                    <MessageCircle size={13} /> Remind
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
