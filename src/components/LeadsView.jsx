import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, ExternalLink, Inbox, Mail, Phone, RefreshCw, Search, X } from 'lucide-react';
import { getAllLeads } from '../store';
import { InlineLoadingState } from './LoadingSpinner';
import { toast } from '../lib/toast';
import { downloadBlob } from '../lib/download';

function getEmailDomain(email) {
  const value = String(email || '');
  return value.includes('@') ? value.split('@').pop().toLowerCase() : '';
}

function formatDateTime(value) {
  const parsed = Date.parse(value || '');
  if (!parsed) return '-';
  return new Date(parsed).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeLinkedInUrl(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function LeadsView() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [messageFilter, setMessageFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadLeads = async () => {
    try {
      setLoading(true);
      setLeads(await getAllLeads());
    } catch (err) {
      toast(`Failed to load leads: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const domainOptions = useMemo(() => {
    return [...new Set(leads.map((lead) => getEmailDomain(lead.workEmail)).filter(Boolean))].sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const domain = getEmailDomain(lead.workEmail);
      const createdDate = lead.createdAt ? lead.createdAt.slice(0, 10) : '';
      const hasMessage = Boolean(lead.message?.trim());

      if (q) {
        const haystack = [
          lead.workEmail,
          lead.contactNo,
          lead.linkedInProfile,
          lead.message,
          domain,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (domainFilter !== 'all' && domain !== domainFilter) return false;
      if (messageFilter === 'with-message' && !hasMessage) return false;
      if (messageFilter === 'without-message' && hasMessage) return false;
      if (dateFrom && createdDate && createdDate < dateFrom) return false;
      if (dateTo && createdDate && createdDate > dateTo) return false;

      return true;
    });
  }, [leads, search, domainFilter, messageFilter, dateFrom, dateTo]);

  const hasFilters = search || domainFilter !== 'all' || messageFilter !== 'all' || dateFrom || dateTo;
  const leadsWithMessage = leads.filter((lead) => lead.message?.trim()).length;
  const today = new Date().toISOString().split('T')[0];
  const leadsToday = leads.filter((lead) => lead.createdAt?.slice(0, 10) === today).length;

  const clearFilters = () => {
    setSearch('');
    setDomainFilter('all');
    setMessageFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const downloadWord = () => {
    if (filteredLeads.length === 0) {
      toast('No leads to download', 'warning');
      return;
    }

    const generatedAt = new Date().toLocaleString('en-IN');
    const rows = filteredLeads.map((lead, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(formatDateTime(lead.createdAt))}</td>
        <td>${escapeHtml(lead.workEmail || '-')}</td>
        <td>${escapeHtml(lead.contactNo || '-')}</td>
        <td>${escapeHtml(lead.linkedInProfile || '-')}</td>
        <td>${escapeHtml(lead.message?.trim() || '-')}</td>
      </tr>
    `).join('');

    const documentHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Leads Export</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; }
            h1 { color: #003B6F; margin-bottom: 4px; }
            p { margin-top: 0; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
            th { background: #EAF3FA; color: #003B6F; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Leads Export</h1>
          <p>Generated on ${escapeHtml(generatedAt)}. Showing ${filteredLeads.length} lead${filteredLeads.length === 1 ? '' : 's'}.</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Submitted</th>
                <th>Work Email</th>
                <th>Phone</th>
                <th>LinkedIn</th>
                <th>Suitable Time / Message</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const date = new Date().toISOString().split('T')[0];
    downloadBlob(`leads-${date}.doc`, documentHtml, 'application/msword;charset=utf-8;');
    toast('Leads Word file downloaded', 'success');
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Landing page contact submissions from FMN Website</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={downloadWord} disabled={loading || filteredLeads.length === 0}>
            <Download size={16} /> Leads
          </button>
          <button className="btn btn-secondary" onClick={loadLeads} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid stats-grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><Inbox size={18} /></div>
          <div className="stat-content" style={{ flex: 1 }}>
          <p className="stat-label">Total Leads</p>
          <span className="stat-value">{leads.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><CalendarDays size={18} /></div>
          <div className="stat-content">
            <p className="stat-label">Today</p>
            <span className="stat-value">{leadsToday}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><Mail size={18} /></div>
          <div className="stat-content">
            <p className="stat-label">Domains</p>
            <span className="stat-value">{domainOptions.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}><Phone size={18} /></div>
          <div className="stat-content">
            <p className="stat-label">With Notes</p>
            <span className="stat-value">{leadsWithMessage}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-header"><h3>Contact Leads</h3></div>
        {loading ? (
          <InlineLoadingState title="Loading leads" />
        ) : (
          <>
            <div className="filters-bar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search email, phone, LinkedIn, message..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <select className="filter-select" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
                <option value="all">All Domains</option>
                {domainOptions.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
              <select className="filter-select" value={messageFilter} onChange={(e) => setMessageFilter(e.target.value)}>
                <option value="all">All Notes</option>
                <option value="with-message">With Time Note</option>
                <option value="without-message">No Time Note</option>
              </select>
              <input type="date" className="filter-date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From" />
              <input type="date" className="filter-date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To" />
              {hasFilters && (
                <button className="icon-btn icon-btn-red" onClick={clearFilters} title="Clear">
                  <X size={15} /> Clear
                </button>
              )}
            </div>

            {filteredLeads.length === 0 ? (
              <div className="empty-state">
                <Inbox size={48} />
                <p>{leads.length === 0 ? 'No leads found yet.' : 'No leads match your filters.'}</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table" style={{ minWidth: '920px' }}>
                  <thead>
                    <tr>
                      <th>Submitted</th>
                      <th>Work Email</th>
                      <th>Phone</th>
                      <th>LinkedIn</th>
                      <th>Suitable Time / Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => {
                      const domain = getEmailDomain(lead.workEmail);
                      const linkedInUrl = normalizeLinkedInUrl(lead.linkedInProfile);
                      const phone = String(lead.contactNo || '').replace(/[^\d+]/g, '');

                      return (
                        <tr key={lead.id}>
                          <td className="text-muted">{formatDateTime(lead.createdAt)}</td>
                          <td>
                            <div className="font-medium">{lead.workEmail || '-'}</div>
                            {domain && <span className="type-badge">{domain}</span>}
                          </td>
                          <td className="text-muted">{lead.contactNo || '-'}</td>
                          <td>
                            {linkedInUrl ? (
                              <a href={linkedInUrl} target="_blank" rel="noreferrer" className="font-medium lead-profile-link">
                                View Profile
                              </a>
                            ) : '-'}
                          </td>
                          <td style={{ maxWidth: 320, whiteSpace: 'normal' }}>
                            {lead.message?.trim() || <span className="text-muted">No preferred time shared</span>}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="icon-btn icon-btn-blue"
                                onClick={() => {
                                  window.location.href = `mailto:${lead.workEmail}`;
                                }}
                                title="Email"
                                disabled={!lead.workEmail}
                              >
                                <Mail size={15} />
                              </button>
                              <button
                                className="icon-btn icon-btn-green"
                                onClick={() => {
                                  window.location.href = `tel:${phone}`;
                                }}
                                title="Call"
                                disabled={!phone}
                              >
                                <Phone size={15} />
                              </button>
                              <button
                                className="icon-btn icon-btn-blue"
                                onClick={() => window.open(linkedInUrl, '_blank', 'noopener,noreferrer')}
                                title="Open LinkedIn"
                                disabled={!linkedInUrl}
                              >
                                <ExternalLink size={15} />
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
    </div>
  );
}
