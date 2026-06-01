import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import AuditItem from '../../components/ui/AuditItem';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import TabBar from '../../components/ui/TabBar';

const CAT_COLORS = { kyc:'#8b5cf6', compliance:'#ef4444', finance:'#22c55e', investment:'#e8b84b', operations:'#3b82f6', audit:'#f97316', system:'#0d1b35' };
const CATEGORIES = ['all','kyc','compliance','finance','investment','operations','audit','system'];

export default function AuditTrail() {
  const { auditLog } = useAppStore();
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = auditLog.filter(a => {
    const ms = search === '' || a.admin.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase()) || a.target.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || a.category === catFilter;
    return ms && mc;
  });

  const exportCSV = () => {
    const rows = filtered.map(a => `"${a.time}","${a.id}","${a.admin}","${a.role}","${a.action}","${a.target}","${a.category}","${a.ip}"`).join('\n');
    const blob = new Blob(['Time,ID,Admin Name,Role,Action,Target,Category,IP\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Complete activity log — all admins, all actions"
        action={{ label: 'Export CSV', icon: Download, onClick: exportCSV }}
      />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search by admin name, action, or target..."
        style={{ marginBottom: 16 }}
        className="animate-in delay-1"
      />

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }} className="animate-in delay-2">
        {CATEGORIES.map(f => (
          <button key={f} onClick={() => setCatFilter(f)} style={{
            padding: '6px 13px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: catFilter === f ? (CAT_COLORS[f] || 'var(--navy)') : 'white',
            color: catFilter === f ? 'white' : 'var(--gray-400)',
            border: `1px solid ${catFilter === f ? (CAT_COLORS[f] || 'var(--navy)') : 'var(--gray-200)'}`,
            transition: 'all 0.2s',
          }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={auditLog.length === 0 ? 'No audit entries yet' : 'No matching entries'}
            message={auditLog.length === 0 ? 'Audit log entries will appear here as admin actions are recorded.' : 'Try adjusting your filters.'}
            compact
          />
        ) : (
          filtered.map((a, i) => <AuditItem key={a.id} entry={a} isLast={i === filtered.length - 1} />)
        )}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 22px', borderTop: '1px solid var(--gray-100)', fontSize: 11, color: 'var(--gray-400)' }}>
            Showing {filtered.length} of {auditLog.length} entries
          </div>
        )}
      </div>
    </div>
  );
}
