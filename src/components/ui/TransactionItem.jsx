import React from 'react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const INFLOW_TYPES = new Set([
  'wallet_funding', 'redemption', 'pre_termination_payout', 'dividend_payout',
]);

const TYPE_STYLE = {
  wallet_funding:         { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)',   label: 'Funding' },
  subscription:           { color: 'var(--navy)',  bg: 'rgba(13,27,53,0.08)',   label: 'Subscription' },
  redemption:             { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)', label: 'Redemption' },
  wallet_withdrawal:      { color: '#f97316',      bg: 'rgba(249,115,22,0.1)',  label: 'Withdrawal' },
  pre_termination_payout: { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)', label: 'Pre-Term' },
  dividend_payout:        { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)',   label: 'Dividend' },
};

const STATUS_STYLE = {
  successful: { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  pending:    { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)' },
  failed:     { color: '#dc2626',      bg: 'rgba(239,68,68,0.1)' },
};

/**
 * TransactionItem — a single transaction row (list style).
 *
 * Props:
 *   transaction  — transaction object { type, amount, status, description, ref, date }
 *   showIcon     — show the type icon circle (default true)
 *   isLast       — suppress bottom border on last item (optional)
 */
export default function TransactionItem({ transaction: t, showIcon = true, isLast = false }) {
  const ty   = TYPE_STYLE[t.type] || TYPE_STYLE.wallet_funding;
  const st   = STATUS_STYLE[t.status] || STATUS_STYLE.pending;
  const isIn = INFLOW_TYPES.has(t.type);

  return (
    <div
      style={{
        padding: '14px 22px',
        borderBottom: isLast ? 'none' : '1px solid var(--gray-100)',
        display: 'flex', alignItems: 'center', gap: 14,
        flexWrap: 'wrap',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {showIcon && (
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: ty.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>
            {isIn ? '↓' : '↑'}
          </span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>
          {t.description || ty.label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
          {t.ref && `Ref: ${t.ref} · `}{t.date}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14,
          color: isIn ? 'var(--green)' : 'var(--navy)', marginBottom: 3,
        }}>
          {isIn ? '+' : '-'}{fmt(t.amount)}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: st.color, background: st.bg, padding: '2px 7px', borderRadius: 4,
        }}>
          {t.status}
        </span>
      </div>
    </div>
  );
}
