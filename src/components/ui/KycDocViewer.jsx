import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

/**
 * KycDocViewer — read-only KYC document list with status badges and view links.
 * Used in ClientManagement, AdminReports, corporate/KYC, shared/ProfilePage.
 *
 * Props:
 *   docs       — array of { key, label, fileName?, fileUrl?, status, required?, uploadedAt? }
 *   kycStatus  — overall KYC status string (for header badge)
 *   submittedAt — ISO date string (optional)
 *   loading    — show loading state
 *   emptyMsg   — message when docs is empty
 */
export default function KycDocViewer({ docs = [], kycStatus, submittedAt, loading = false, emptyMsg = 'No KYC documents found.' }) {
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
            const canView = doc.fileUrl && !doc.fileUrl.startsWith('pending-cloud-upload://');
            return (
              <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isOk ? 'rgba(34,197,94,0.04)' : '#f8fafc', border: `1px solid ${isOk ? 'rgba(34,197,94,0.2)' : 'var(--gray-200)'}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <FileText size={14} color={isOk ? 'var(--green)' : 'var(--gray-400)'} />
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
