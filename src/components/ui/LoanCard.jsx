import React from 'react';
import StatusBadge from '../shared/StatusBadge';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const TYPE_STYLES = {
  emergency:  { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: 'Emergency' },
  salary:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Salary Advance' },
  education:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'Education' },
  welfare:    { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  label: 'Welfare' },
  other:      { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: 'Other' },
};

/**
 * LoanCard — displays a single staff loan application.
 * Used in StaffLoans (individual), StaffLoans (corporate), StaffLoansAdmin.
 *
 * Props:
 *   loan       — loan object
 *   onView     — (loan) => void — open review/detail modal (optional)
 *   adminView  — show staff name and admin actions (default false)
 *   onApprove  — (loan) => void (admin only)
 *   onReject   — (loan) => void (admin only)
 */
export default function LoanCard({ loan: l, onView, adminView = false, onApprove, onReject }) {
  const ts = TYPE_STYLES[l.type] || TYPE_STYLES.other;
  const monthly = l.amount && l.term ? Math.round((l.amount / l.term) * 1.015) : null;

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
      <div style={{ height: 4, background: ts.color }} />
      <div style={{ padding: '18px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
          <div>
            {adminView && l.staffName && (
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 3 }}>{l.staffName}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ts.color, background: ts.bg, padding: '3px 9px', borderRadius: 5 }}>
                {ts.label}
              </span>
              <StatusBadge status={l.status} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{l.id} · Applied: {l.date}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--navy)' }}>{fmt(l.amount)}</div>
            {monthly && <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>~{fmt(monthly)}/mo · {l.term}mo</div>}
          </div>
        </div>

        {/* Purpose */}
        {l.purpose && (
          <p style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 14, background: 'var(--gray-50)', padding: '10px 12px', borderRadius: 8 }}>
            {l.purpose}
          </p>
        )}

        {/* Meta grid */}
        {[
          ['Repayment', `${l.term || '—'} months`],
          ['Interest',  l.rate ? `${l.rate}% p.a.` : '1.5% flat'],
          ['Monthly',   monthly ? fmt(monthly) : '—'],
        ].length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              ['Repayment', `${l.term || '—'} months`],
              ['Interest',  l.rate ? `${l.rate}% p.a.` : '1.5% flat'],
              ['Monthly Est.', monthly ? fmt(monthly) : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection reason */}
        {l.status === 'rejected' && l.rejectReason && (
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: 'var(--red)' }}>
            Rejection note: {l.rejectReason}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {onView && (
            <button onClick={() => onView(l)} style={{ flex: 1, padding: '10px', background: 'rgba(13,27,53,0.06)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--navy)' }}>
              VIEW DETAILS
            </button>
          )}
          {adminView && l.status === 'pending' && onApprove && (
            <button onClick={() => onApprove(l)} style={{ flex: 1, padding: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--green)' }}>
              APPROVE
            </button>
          )}
          {adminView && l.status === 'pending' && onReject && (
            <button onClick={() => onReject(l)} style={{ flex: 1, padding: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--red)' }}>
              REJECT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
