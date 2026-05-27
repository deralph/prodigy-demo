import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle, RefreshCw, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { kycApi } from '../../services/api';

const statusColor = s => {
  if (!s || s === 'NOT_UPLOADED') return { color: 'var(--gray-300)', bg: 'rgba(156,163,175,0.1)', label: '—' };
  if (s === 'UPLOADED')           return { color: '#3b82f6',         bg: 'rgba(59,130,246,0.1)',  label: 'Review' };
  if (s === 'VERIFIED')           return { color: 'var(--green)',    bg: 'rgba(34,197,94,0.1)',   label: 'Verified' };
  if (s === 'REJECTED')           return { color: 'var(--red)',      bg: 'rgba(239,68,68,0.1)',   label: 'Rejected' };
  if (s === 'APPROVED')           return { color: 'var(--green)',    bg: 'rgba(34,197,94,0.1)',   label: 'Approved' };
  if (s === 'PENDING')            return { color: 'var(--gold)',     bg: 'rgba(232,184,75,0.1)',  label: 'Pending' };
  return { color: 'var(--gold)', bg: 'rgba(232,184,75,0.1)', label: s };
};

export default function RiskCompliance() {
  const [board, setBoard]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
  const [acting, setActing]     = useState(null);
  const [toast, setToast]       = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const loadBoard = () => {
    setLoading(true);
    kycApi.getComplianceBoard()
      .then(data => setBoard(Array.isArray(data) ? data : []))
      .catch(() => setBoard([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBoard(); }, []);

  const toggleExpand = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleApprove = async (clientId) => {
    setActing(clientId);
    try {
      await kycApi.approveKyc(clientId);
      showToast('success', 'KYC approved successfully.');
      loadBoard();
    } catch (e) {
      showToast('error', e.message || 'Approval failed.');
    } finally { setActing(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal);
    try {
      await kycApi.rejectKyc(rejectModal, rejectReason);
      showToast('success', 'KYC rejected.');
      setRejectModal(null);
      setRejectReason('');
      loadBoard();
    } catch (e) {
      showToast('error', e.message || 'Rejection failed.');
    } finally { setActing(null); }
  };

  const approved = board.filter(c => c.kycRecord?.status === 'APPROVED').length;
  const pending  = board.filter(c => ['PENDING', 'KYC_SUBMITTED'].includes(c.kycRecord?.status) || c.status === 'KYC_SUBMITTED').length;
  const rejected = board.filter(c => c.kycRecord?.status === 'REJECTED').length;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="animate-in">
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: 'var(--navy)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Risk & Compliance</h1>
          <p style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>KYC document review and compliance monitoring</p>
        </div>
        <button onClick={loadBoard} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(13,27,53,0.06)', border: '1px solid var(--gray-200)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {toast && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: toast.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? 'var(--green)' : 'var(--red)', fontSize: 13, fontWeight: 600 }}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }} className="animate-in delay-1">
        {[
          { label: 'Fully Verified',  count: approved,      Icon: CheckCircle,   color: 'var(--green)' },
          { label: 'Pending Review',  count: pending,        Icon: AlertTriangle, color: 'var(--gold)' },
          { label: 'Rejected / AML',  count: rejected,       Icon: XCircle,       color: 'var(--red)' },
          { label: 'Total Clients',   count: board.length,   Icon: ShieldAlert,   color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <s.Icon size={22} color={s.color} strokeWidth={1.8} />
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Board */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-2">
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>KYC Compliance Board</h3>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Loading compliance data…</div>
        ) : board.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No clients yet" message="Clients will appear here once accounts are created." />
        ) : board.map(client => {
          const kyc    = client.kycRecord || {};
          const docs   = client.kycDocuments || [];
          const open   = expanded[client.id];
          const ovSt   = statusColor(kyc.status || 'PENDING');
          const isActing = acting === client.id;
          const hasDocs  = docs.length > 0;
          const canAct   = ['PENDING', 'KYC_SUBMITTED'].includes(kyc.status) || client.status === 'KYC_SUBMITTED';

          return (
            <div key={client.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
              {/* Client row */}
              <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, cursor: hasDocs ? 'pointer' : 'default', transition: 'background 0.15s' }}
                onClick={() => hasDocs && toggleExpand(client.id)}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ color: 'var(--gray-300)', flexShrink: 0 }}>
                  {hasDocs ? (open ? <ChevronDown size={15} /> : <ChevronRight size={15} />) : <span style={{ display: 'inline-block', width: 15 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                    {client.email} · <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{client.type}</span>
                    {kyc.submittedAt && <span> · Submitted {new Date(kyc.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ovSt.color, background: ovSt.bg, padding: '3px 9px', borderRadius: 4 }}>{ovSt.label}</span>
                  {canAct && (
                    <>
                      <button onClick={e => { e.stopPropagation(); handleApprove(client.id); }} disabled={isActing} style={{ padding: '6px 12px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        {isActing ? '…' : '✓ Approve'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setRejectModal(client.id); }} disabled={isActing} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        ✗ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded documents */}
              {open && hasDocs && (
                <div style={{ background: '#f8fafc', borderTop: '1px solid var(--gray-100)', padding: '12px 22px 12px 50px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                    {docs.map(doc => {
                      const ds = statusColor(doc.status);
                      const canView = doc.fileUrl && !doc.fileUrl.startsWith('pending-cloud-upload://');
                      return (
                        <div key={doc.id} style={{ background: 'white', borderRadius: 8, border: '1px solid var(--gray-200)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>{doc.label || doc.docKey}</div>
                            <div style={{ fontSize: 10, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName || 'No file name'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ds.color, background: ds.bg, padding: '2px 7px', borderRadius: 4 }}>{ds.label}</span>
                            {canView && (
                              <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', background: 'rgba(13,27,53,0.06)', color: 'var(--navy)', borderRadius: 6, fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {kyc.reviewNotes && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 7, fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>
                      Rejection note: {kyc.reviewNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,53,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }} onClick={() => setRejectModal(null)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 32px 80px rgba(13,27,53,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'var(--red)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'white', textTransform: 'uppercase' }}>Reject KYC</div>
              <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 14 }}>Provide a reason for rejection. The client will be notified.</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Utility bill is older than 3 months…" style={{ width: '100%', minHeight: 90, padding: '10px 12px', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 13, color: 'var(--navy)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: '11px', background: 'rgba(13,27,53,0.06)', border: '1px solid var(--gray-200)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Cancel</button>
                <button onClick={handleReject} disabled={!rejectReason.trim() || acting === rejectModal} style={{ flex: 1, padding: '11px', background: 'var(--red)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'white', opacity: rejectReason.trim() ? 1 : 0.5 }}>
                  {acting === rejectModal ? 'Rejecting…' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
