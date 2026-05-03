import { Edit3, Copy, FileText, IndianRupee, MessageCircle, Mail, Trash2, X } from 'lucide-react';
import { STATUS_CONFIG } from './dashboardConfig';
import { INVOICE_TYPES } from '../../utils';
import { Search } from 'lucide-react';
import { PrivateAmount, PrivateValue } from '../PrivacyContext';

export default function DashboardTable({ filtered, bills, fyFilter, typeFilter, statusFilter, dateFrom, dateTo, search, hasFilters, fyOptions, loading, onSearch, onFyChange, onTypeChange, onStatusChange, onDateFromChange, onDateToChange, onClearFilters, onNew, onView, onDuplicate, onConvert, onPayment, onShareWhatsApp, onShareEmail, onDelete, showNote }) {
  return (
    <div className="glass-panel">
      <div className="table-header"><h3>Invoices</h3></div>
      {!loading && (
        <>
          <div className="filters-bar">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search client or invoice..."
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              className="filter-select"
              value={fyFilter}
              onChange={(e) => onFyChange(e.target.value)}
            >
              <option value="all">All Years</option>
              {fyOptions.map((fy) => (
                <option key={fy.value} value={fy.value}>{fy.label}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <option value="all">All Types</option>
              {Object.entries(INVOICE_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <input
              type="date"
              className="filter-date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              title="From"
            />
            <input
              type="date"
              className="filter-date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              title="To"
            />
            {hasFilters && (
              <button
                className="icon-btn icon-btn-red"
                onClick={onClearFilters}
                title="Clear"
              >
                <X size={15} /> Clear
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>{bills.length === 0 ? 'No invoices yet.' : 'No invoices match your filters.'}</p>
              {bills.length === 0 && (
                <button className="btn btn-primary" onClick={onNew}>
                  Add Invoice
                </button>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice No.</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bill) => {
                    const status = bill.status || 'unpaid';
                    const sc = STATUS_CONFIG[status] || STATUS_CONFIG.unpaid;
                    const isOverdue =
                      status !== 'paid' &&
                      bill.data?.details?.dueDate &&
                      new Date(bill.data.details.dueDate) < new Date();
                    const daysOverdue = isOverdue
                      ? Math.floor((new Date() - new Date(bill.data.details.dueDate)) / 86400000)
                      : 0;
                    const billCurrency = bill.currency || bill.data?.invoiceOptions?.currency || 'INR';
                    const parsedDate = Date.parse(bill.invoiceDate || '');
                    const displayDate = Number.isNaN(parsedDate)
                      ? '-'
                      : new Date(parsedDate).toLocaleDateString('en-IN');

                    return (
                      <tr
                        key={bill.id}
                        className={isOverdue || status === 'overdue' ? 'row-overdue' : ''}
                      >
                        <td className="text-muted">{displayDate}</td>
                        <td>
                          <span className="invoice-badge">{bill.invoiceNumber}</span>
                        </td>
                        <td>
                          <span className="type-badge">
                            {INVOICE_TYPES[bill.invoiceType || 'tax-invoice']?.label}
                          </span>
                        </td>
                        <td className="font-medium td-client" title={bill.clientName}>
                          {bill.clientName}
                          {bill.data?.internalNote && showNote && (
                            <span
                              title={bill.data.internalNote}
                              style={{
                                marginLeft: 4,
                                cursor: 'help',
                                verticalAlign: 'middle',
                              }}
                            >
                              {/* Note icon would go here */}
                            </span>
                          )}
                        </td>
                        <td className="font-bold">
                          <PrivateAmount amount={bill.totalAmount} currency={billCurrency} />
                          {billCurrency !== 'INR' && (
                            <span
                              style={{
                                marginLeft: 5,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: '#3b82f6',
                                background: 'rgba(59,130,246,0.1)',
                                padding: '1px 5px',
                                borderRadius: 4,
                              }}
                            >
                              {billCurrency}
                            </span>
                          )}
                        </td>
                        <td className="text-muted">
                          {(bill.paidAmount || 0) > 0
                            ? <PrivateAmount amount={bill.paidAmount} currency={billCurrency} />
                            : '-'}
                        </td>
                        <td>
                          <select
                            className="status-select"
                            value={isOverdue && status !== 'overdue' ? 'overdue' : status}
                            style={{
                              background: sc.bg,
                              color: sc.color,
                              borderColor: sc.color + '44',
                            }}
                            onChange={(e) => onStatusChange(bill, e.target.value)}
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.label}
                              </option>
                            ))}
                          </select>
                          {daysOverdue > 0 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: '#dc2626',
                                display: 'block',
                                marginTop: 2,
                              }}
                            >
                              <PrivateValue value={daysOverdue} />d overdue
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-btn icon-btn-blue"
                              onClick={() => onView(bill)}
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              className="icon-btn icon-btn-blue"
                              onClick={() => onDuplicate(bill)}
                              title="Duplicate"
                            >
                              <Copy size={15} />
                            </button>
                            {(bill.invoiceType === 'proforma' ||
                              bill.invoiceType === 'delivery-challan') && (
                              <button
                                className="icon-btn icon-btn-green"
                                onClick={() => onConvert(bill)}
                                title="Convert to Tax Invoice"
                              >
                                <FileText size={15} />
                              </button>
                            )}
                            <button
                              className="icon-btn icon-btn-green"
                              onClick={() => onPayment(bill)}
                              title="Payment"
                            >
                              <IndianRupee size={15} />
                            </button>
                            <button
                              className="icon-btn icon-btn-green"
                              onClick={() => onShareWhatsApp(bill)}
                              title="WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => onShareEmail(bill)}
                              title="Email"
                            >
                              <Mail size={15} />
                            </button>
                            <button
                              className="icon-btn icon-btn-red"
                              onClick={() => onDelete(bill)}
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
