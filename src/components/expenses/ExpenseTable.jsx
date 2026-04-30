import { Edit3, Trash2, Search, X, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils';

export default function ExpenseTable({ filtered, expenses, search, categoryFilter, onSearch, onCategoryChange, onEdit, onDelete, EXPENSE_CATEGORIES }) {
  return (
    <div className="glass-panel">
      <div className="table-header"><h3>Expense Records</h3></div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Wallet size={48} />
          <p>{expenses.length === 0 ? 'No expenses recorded yet.' : 'No expenses match your filters.'}</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Vendor</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>GST</th>
                <th>Mode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => (
                <tr key={exp.id}>
                  <td className="text-muted">{exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : ''}</td>
                  <td className="font-medium">{exp.description}</td>
                  <td><span className="type-badge">{exp.category}</span></td>
                  <td className="text-muted">{exp.vendorName || '-'}</td>
                  <td style={{ textAlign: 'right' }} className="font-bold">{formatCurrency(exp.amount)}</td>
                  <td style={{ textAlign: 'right' }} className="text-muted">{exp.gstAmount ? formatCurrency(exp.gstAmount) : '-'}</td>
                  <td className="text-muted">{exp.paymentMode}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn icon-btn-blue" onClick={() => onEdit(exp)} title="Edit"><Edit3 size={15} /></button>
                      <button className="icon-btn icon-btn-red" onClick={() => onDelete(exp.id)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
