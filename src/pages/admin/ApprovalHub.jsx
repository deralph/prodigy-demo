import React, { useState } from 'react';
import { CheckCircle, XCircle, Filter, X, FileText, User, ExternalLink, Inbox } from 'lucide-react';
import useAppStore, { KYC_REQUIREMENTS } from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ApprovalItem from '../../components/ui/ApprovalItem';
import ModalOverlay from '../../components/ui/ModalOverlay';
import TabBar from '../../components/ui/TabBar';
import DetailRow from '../../components/ui/DetailRow';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const TYPE_COLOR = { kyc_approval:'#8b5cf6', subscription:'#22c55e', redemption:'#f97316', loan:'#3b82f6' };
const TYPE_LABEL = { kyc_approval:'KYC', subscription:'Subscription', redemption:'Redemption', loan:'Staff Loan' };

export default function ApprovalHub() {
  const { approvals, updateApproval, user, addAuditEntry, clients } = useAppStore();
  const [filter, setFilter]       = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewing, setViewing]     = useState(null);
  const [reviewTab, setReviewTab] = useState('details');
  const [rejectNote, setRejectNote] = useState('');

  const canApprove = ['super_admin','operations','compliance','investment'].includes(user?.adminRole);

  const log = (action, target) => addAuditEntry({
    id: 'AUD-' + Date.now(), adminId: user?.clientId, admin: user?.name, role: user?.adminRole,
    action, target, category: target.includes('KYC') ? 'kyc' : 'operations',
    time: new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }), ip: '—',
  });

  const handleApprove = (a) => {
    updateApproval(a.id, { status: 'approved', reviewedBy: user?.name, reviewedAt: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) });
    log(`Approved ${TYPE_LABEL[a.type] || a.type}`, `${a.clientName} — ${a.type}`);
    setViewing(null);
  };

  const handleReject = (a) => {
    updateApproval(a.id, { status: 'rejected', reviewedBy: user?.name, rejectReason: rejectNote, reviewedAt: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) });
    log(`Rejected ${TYPE_LABEL[a.type] || a.type}`, `${a.clientName} — ${rejectNote}`);
    setRejectNote(''); setViewing(null);
  };

  const filtered = approvals.filter(a => {
    const mf = filter === 'all' || a.status === filter;
    const mt = typeFilter === 'all' || a.type === typeFilter;
    return mf && mt;
  });

  const STAT_TABS = [
    { key: 'pending',  label: 'Pending',  count: approvals.filter(a => a.status === 'pending').length,  color: 'var(--gold)' },
    { key: 'approved', label: 'Approved', count: approvals.filter(a => a.status === 'approved').length, color: 'var(--green)' },
    { key: 'rejected', label: 'Rejected', count: approvals.filter(a => a.status === 'rejected').length, color: 'var(--red)' },
    { key: 'all',      label: 'All',      count: approvals.length },
  ];

  const REVIEW_TABS = [
    { key: 'details',   label: 'Details',     icon: Filter },
    { key: 'documents', label: 'Documents',   icon: FileText },
    { key: 'client',    label: 'Client Info', icon: User },
  ];

  return (
    <div>
      <PageHeader title="Approval Hub" subtitle="Maker-checker workflows — KYC, subscriptions, redemptions, loans" />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }} className="animate-in delay-1">
        {STAT_TABS.slice(0, 3).map(t => (
          <div key={t.key} onClick={() => setFilter(t.key)} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--gray-200)', cursor: 'pointer', borderTop: `3px solid ${t.color}` }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: t.color, marginBottom: 4 }}>{t.count}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }} className="animate-in delay-2">
        <div style={{ display: 'flex', gap: 6 }}>
          {STAT_TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{ padding: '6px 13px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', background: filter === t.key ? 'var(--navy)' : 'white', color: filter === t.key ? 'white' : 'var(--gray-400)', border: `1px solid ${filter === t.key ? 'var(--navy)' : 'var(--gray-200)'}`, transition: 'all 0.2s' }}>
              {t.label} {t.count > 0 && `(${t.count})`}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} color="var(--gray-400)" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: '7px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 12, outline: 'none', background: 'white', cursor: 'pointer' }}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Approvals list */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-3">
        {filtered.length === 0 ? (
          <EmptyState icon={Inbox} title={approvals.length === 0 ? 'No approvals yet' : 'No matching approvals'} message={approvals.length === 0 ? 'Approval requests will appear here when clients submit KYC, investments, or staff loans.' : 'Try changing your filter criteria.'} compact />
        ) : (
          filtered.map((a, i) => (
            <ApprovalItem
              key={a.id}
              approval={a}
              onReview={setViewing}
              onApprove={canApprove ? handleApprove : undefined}
              onReject={canApprove ? () => setViewing(a) : undefined}
              canApprove={canApprove}
              isLast={i === filtered.length - 1}
            />
          ))
        )}
      </div>

      {/* Review Modal */}
      {viewing && (() => {
        const cl = clients.find(c => c.clientId === viewing.clientId) || {};
        const kycReqs = KYC_REQUIREMENTS[cl.type || cl.accountType || 'individual'] || KYC_REQUIREMENTS.individual;
        const uploadedDocs = viewing.kycDocs || [];

        return (
          <ModalOverlay
            onClose={() => { setViewing(null); setReviewTab('details'); }}
            maxWidth={640}
            scrollable
            headerContent={
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: 'white', textTransform: 'uppercase' }}>
                  Review {TYPE_LABEL[viewing.type] || viewing.type}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{viewing.id} · {viewing.clientName}</div>
              </div>
            }
          >
            <TabBar tabs={REVIEW_TABS} active={reviewTab} onChange={setReviewTab} />
            <div style={{ padding: '20px 0' }}>

              {/* Details tab */}
              {reviewTab === 'details' && (
                <div>
                  {[
                    ['Client', viewing.clientName],
                    ['Type', TYPE_LABEL[viewing.type] || viewing.type],
                    ['Details', viewing.details],
                    ['Date', viewing.date],
                    viewing.amount && ['Amount', fmt(viewing.amount)],
                    ['Status', viewing.status],
                    viewing.reviewedBy && ['Reviewed By', viewing.reviewedBy],
                    viewing.rejectReason && ['Rejection Note', viewing.rejectReason],
                  ].filter(Boolean).map(([l, v]) => <DetailRow key={l} label={l} value={v} />)}
                </div>
              )}

              {/* Documents tab */}
              {reviewTab === 'documents' && (
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12, fontWeight: 700 }}>
                    KYC Documents — {cl.type?.toUpperCase() || 'INDIVIDUAL'} Account
                  </div>
                  {uploadedDocs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {uploadedDocs.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: d.status === 'uploaded' ? 'rgba(34,197,94,0.04)' : '#fff8f0', border: `1px solid ${d.status === 'uploaded' ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}`, borderRadius: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={15} color={d.status === 'uploaded' ? 'var(--green)' : '#f97316'} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{d.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 1 }}>{d.status === 'uploaded' ? 'Document uploaded' : 'Awaiting upload'}</div>
                            </div>
                          </div>
                          <StatusBadge status={d.status === 'uploaded' ? 'approved' : 'pending'} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {kycReqs.map(doc => (
                        <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={14} color="var(--gray-400)" />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{doc.label}</div>
                              <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{doc.required ? 'Required' : 'Optional'}</div>
                            </div>
                          </div>
                          <StatusBadge status="pending" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Client Info tab */}
              {reviewTab === 'client' && (
                <div>
                  {cl.id ? (
                    [
                      ['Client Name', cl.name], ['Client ID', cl.clientId], ['Email', cl.email],
                      ['Phone', cl.phone || '—'], ['Account Type', (cl.type || '').toUpperCase()],
                      ['KYC Status', cl.kyc], ['Account Status', cl.status],
                      ['Wallet Balance', fmt(cl.balance || 0)], ['Joined', cl.joined],
                    ].map(([l, v]) => <DetailRow key={l} label={l} value={v} />)
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-400)', fontSize: 13 }}>
                      Client info not found for ID: {viewing.clientId}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons for pending */}
              {viewing.status === 'pending' && canApprove && (
                <>
                  <div style={{ marginTop: 18, borderTop: '1px solid var(--gray-200)', paddingTop: 16 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Rejection Reason (optional)</div>
                    <input placeholder="State reason if rejecting…" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                      style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button onClick={() => handleReject(viewing)} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <XCircle size={14} /> REJECT
                    </button>
                    <button onClick={() => handleApprove(viewing)} style={{ flex: 1, padding: '12px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> APPROVE
                    </button>
                  </div>
                </>
              )}
            </div>
          </ModalOverlay>
        );
      })()}
    </div>
  );
}
