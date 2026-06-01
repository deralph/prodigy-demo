import React from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

const TYPE_COLOR = {
  kyc_approval: '#8b5cf6',
  subscription: '#22c55e',
  redemption:   '#f97316',
  loan:         '#3b82f6',
};

const TYPE_LABEL = {
  kyc_approval: 'KYC',
  subscription: 'Subscription',
  redemption:   'Redemption',
  loan:         'Staff Loan',
};

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * ApprovalItem — a single approval row with actions.
 *
 * Props:
 *   approval     — approval object
 *   onReview     — (approval) => void — opens review modal
 *   onApprove    — (approval) => void — quick approve (optional)
 *   onReject     — (approval) => void — quick reject (optional)
 *   canApprove   — whether current user can take action
 *   isLast       — suppress bottom border
 */
export default function ApprovalItem({ approval: a, onReview, onApprove, onReject, canApprove = false, isLast = false }) {
  const typeColor = TYPE_COLOR[a.type] || '#64748b';
  const typeLabel = TYPE_LABEL[a.type] || a.type;

  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--gray-100)',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Color dot */}
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: typeColor, flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>
            {a.clientName}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: typeColor, background: `${typeColor}15`, padding: '2px 7px', borderRadius: 4,
          }}>
            {typeLabel}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 2 }}>{a.details}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Submitted: {a.date}</span>
          {a.amount && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)' }}>{fmt(a.amount)}</span>
          )}
          {a.reviewedBy && (
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
              By: <strong style={{ color: 'var(--navy)' }}>{a.reviewedBy}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <StatusBadge status={a.status} />
        {onReview && (
          <button
            onClick={() => onReview(a)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '7px 12px', background: 'rgba(13,27,53,0.06)',
              border: 'none', borderRadius: 7, cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: 'var(--navy)',
            }}
          >
            <Eye size={12} /> Review
          </button>
        )}
        {a.status === 'pending' && canApprove && (
          <div style={{ display: 'flex', gap: 6 }}>
            {onApprove && (
              <button
                onClick={() => onApprove(a)}
                style={{
                  background: 'rgba(34,197,94,0.1)', border: 'none',
                  borderRadius: 7, padding: '7px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <CheckCircle size={14} color="var(--green)" />
              </button>
            )}
            {onReject && (
              <button
                onClick={() => onReject(a)}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: 'none',
                  borderRadius: 7, padding: '7px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <XCircle size={14} color="var(--red)" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
