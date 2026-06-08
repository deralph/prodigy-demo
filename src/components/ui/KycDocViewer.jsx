import React, { useState } from 'react';
import { FileText, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

/**
 * KycDocViewer — KYC document list with status badges, view links, and optional admin actions.
 * Used in ClientManagement, AdminReports, corporate/KYC, shared/ProfilePage.
 *
 * Props:
 *   docs       — array of { key, label, fileName?, fileUrl?, status, required?, uploadedAt?, rejectionReason? }
 *   kycStatus  — overall KYC status string (for header badge)
 *   submittedAt — ISO date string (optional)
 *   loading    — show loading state
 *   emptyMsg   — message when docs is empty
 *   isAdmin    — show approve/reject buttons per document
 *   onApproveDoc — (clientId, docKey) => void
 *   onRejectDoc  — (clientId, docKey, reason) => void
 *   clientId   — required when isAdmin=true
 *   actingDoc  — { clientId, docKey } | null — which doc is being acted on
 */
export default function KycDocViewer({ docs = [], kycStatus, submittedAt, loading = false, emptyMsg = 'No KYC documents found.', isAdmin = false, onApproveDoc, onRejectDoc, clientId, actingDoc }) {
  const [rejectForm, setRejectForm] = useState({ key: '', reason: '' });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-400)', fontSize: 13 }}>Loading KYC documents…</div>;
  }

  return (
    <div>
      {(kycStatus || submittedAt) && (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          {kycStatus && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>KYC Status</div>
              <StatusBadge status={kycStatus === 'APPROVED' ? 'approved' : kycStatus === 'REJECTED' ? 'rejected' : 'pending'} />
            </div>
          )}
          {submittedAt && (
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
              Submitted {new Date(submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      )}

      {docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px', color: 'var(--gray-400)', fontSize: 13 }}>{emptyMsg}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map(doc => {
            const st      = doc.status === 'VERIFIED' || doc.status === 'verified' ? 'approved' : doc.status === 'REJECTED' ? 'rejected' : 'pending';
            const isOk    = st === 'approved';
            const isRej   = st === 'rejected';
            const canView = doc.fileUrl && !doc.fileUrl.startsWith('pending-cloud-upload://');
            const isActing = actingDoc && actingDoc.clientId === clientId && actingDoc.docKey === doc.key;
            const showRejectForm = rejectForm.key === doc.key;
            return (
              <div key={doc.key} style={{ display: 'flex', flexDirection: 'column', background: isOk ? 'rgba(34,197,94,0.04)' : isRej ? 'rgba(239,68,68,0.04)' : '#f8fafc', border: `1px solid ${isOk ? 'rgba(34,197,94,0.2)' : isRej ? 'rgba(239,68,68,0.2)' : 'var(--gray-200)'}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <FileText size={14} color={isOk ? 'var(--green)' : isRej ? 'var(--red)' : 'var(--gray-400)'} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{doc.label || doc.docKey}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.fileName || (doc.required ? 'Required' : 'Optional')}
                        {doc.uploadedAt && <> · {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}</>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <StatusBadge status={st} />
                    {canView && (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 6, fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>
                        <ExternalLink size={10} /> View
                      </a>
                    )}
                    {/* Admin per-document actions */}
                    {isAdmin && doc.status !== 'VERIFIED' && !showRejectForm && (
                      <>
                        <button onClick={() => onApproveDoc?.(clientId, doc.key)} disabled={isActing}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: isActing ? 'not-allowed' : 'pointer' }}>
                          <CheckCircle size={10} /> {isActing ? '…' : 'Accept'}
                        </button>
                        <button onClick={() => setRejectForm({ key: doc.key, reason: '' })} disabled={isActing}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: isActing ? 'not-allowed' : 'pointer' }}>
                          <XCircle size={10} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Rejection reason display */}
                {isRej && doc.rejectionReason && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(239,68,68,0.06)', borderRadius: 6, fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>
                    Rejected: {doc.rejectionReason}
                  </div>
                )}
                {/* Inline reject form */}
                {showRejectForm && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="text" value={rejectForm.reason} onChange={e => setRejectForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for rejection…"
                      style={{ flex: 1, border: '1.5px solid var(--gray-200)', borderRadius: 7, padding: '8px 10px', fontSize: 12, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--red)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
                    <button onClick={() => { onRejectDoc?.(clientId, doc.key, rejectForm.reason); setRejectForm({ key: '', reason: '' }); }} disabled={!rejectForm.reason.trim() || isActing}
                      style={{ padding: '8px 12px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: !rejectForm.reason.trim() || isActing ? 'not-allowed' : 'pointer', opacity: !rejectForm.reason.trim() || isActing ? 0.5 : 1 }}>
                      Confirm
                    </button>
                    <button onClick={() => setRejectForm({ key: '', reason: '' })}
                      style={{ padding: '8px 12px', background: 'var(--gray-100)', color: 'var(--navy)', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
