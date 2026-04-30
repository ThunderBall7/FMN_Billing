import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export const STATUS_CONFIG = {
  unpaid: { label: 'Unpaid', icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
  partial: { label: 'Partial', icon: Clock, color: '#8b5cf6', bg: '#f5f3ff' },
  paid: { label: 'Paid', icon: CheckCircle, color: '#059669', bg: '#ecfdf5' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
};
