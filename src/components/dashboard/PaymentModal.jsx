import { formatCurrency } from '../../utils';

export default function PaymentModal({ bill, paymentInput, setPaymentInput, onClose, onRecordPayment }) {
  if (!bill) return null;

  const balance = bill.totalAmount - (bill.paidAmount || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h3 className="section-title">Record Payment</h3>
        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
          Invoice: <strong>{bill.invoiceNumber}</strong> | Total: <strong>{formatCurrency(bill.totalAmount, bill.currency)}</strong>
          {(bill.paidAmount || 0) > 0 && <> | Paid: <strong>{formatCurrency(bill.paidAmount, bill.currency)}</strong></>}
          {' '}| Balance: <strong style={{ color: '#dc2626' }}>{formatCurrency(balance, bill.currency)}</strong>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Amount Received</label>
            <input type="number" className="form-input" value={paymentInput.amount} onChange={(event) => setPaymentInput((prev) => ({ ...prev, amount: event.target.value }))} placeholder={String(balance)} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input type="date" className="form-input" value={paymentInput.date} onChange={(event) => setPaymentInput((prev) => ({ ...prev, date: event.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select className="form-input" value={paymentInput.mode} onChange={(event) => setPaymentInput((prev) => ({ ...prev, mode: event.target.value }))}>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input type="text" className="form-input" value={paymentInput.note} onChange={(event) => setPaymentInput((prev) => ({ ...prev, note: event.target.value }))} placeholder="Transaction ID, ref..." />
          </div>
        </div>
        {bill.payments?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <label className="form-label">Payment History</label>
            <div className="payment-history">
              {bill.payments.map((payment, index) => (
                <div key={index} className="payment-row">
                  <span>{new Date(payment.date).toLocaleDateString('en-IN')}</span>
                  <span className="font-bold">{formatCurrency(payment.amount, bill.currency)}</span>
                  <span className="text-muted">{payment.mode}</span>
                  {payment.note && <span className="text-muted">{payment.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onRecordPayment}>Record Payment</button>
        </div>
      </div>
    </div>
  );
}
