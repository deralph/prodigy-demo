import React from 'react';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

export const TYPE_META = {
  wallet_funding:          { label: 'Wallet Funding',        color: '#22c55e', dir: 'credit', icon: ArrowDownLeft },
  subscription:            { label: 'Subscription',          color: '#3b82f6', dir: 'debit',  icon: ArrowUpRight },
  redemption:              { label: 'Redemption',            color: '#f97316', dir: 'credit', icon: ArrowDownLeft },
  disbursement:            { label: 'Disbursement',          color: '#8b5cf6', dir: 'credit', icon: ArrowDownLeft },
  withdrawal:              { label: 'Withdrawal',            color: '#ef4444', dir: 'debit',  icon: ArrowUpRight },
  wallet_withdrawal:       { label: 'Withdrawal',            color: '#ef4444', dir: 'debit',  icon: ArrowUpRight },
  interest:                { label: 'Interest Credit',       color: '#eab308', dir: 'credit', icon: TrendingUp },
  pre_termination_payout:  { label: 'Pre-Term Payout',       color: '#f97316', dir: 'credit', icon: ArrowDownLeft },
  dividend_payout:         { label: 'Dividend Payout',       color: '#eab308', dir: 'credit', icon: TrendingUp },
  loan_disbursement:       { label: 'Loan Disbursement',     color: '#8b5cf6', dir: 'credit', icon: ArrowDownLeft },
  loan_repayment:          { label: 'Loan Repayment',        color: '#ef4444', dir: 'debit',  icon: ArrowUpRight },
  fee:                     { label: 'Fee',                   color: '#6b7280', dir: 'debit',  icon: ArrowUpRight },
  early_exit_penalty:      { label: 'Penalty Income',        color: '#d97706', dir: 'credit', icon: TrendingUp },
};

export const STATUS_META = {
  successful: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  label: 'Successful' },
  pending:    { color: '#eab308', bg: 'rgba(234,179,8,0.1)',  label: 'Pending' },
  failed:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'Failed' },
  reversed:   { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Reversed' },
};

/**
 * LedgerRow — a single ledger entry row with running balance.
 *
 * Props:
 *   transaction  — transaction object
 *   runBalance   — running balance at this row (number)
 *   planName     — matched product name (optional)
 *   planColor    — matched product color (optional)
 *   isLast       — suppress bottom border (optional)
 */
export default function LedgerRow({ transaction: t, runBalance, planName, planColor, isLast = false }) {
  const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
  const st   = STATUS_META[t.status] || STATUS_META.pending;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 100px 80px 120px 120px',
        gap: 8, padding: '12px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--gray-50)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${meta.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <meta.icon size={14} color={meta.color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.description || meta.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
            {t.ref || t.id || '—'} · {t.date || '—'}
            {planName && <span style={{ marginLeft: 6, color: planColor, fontWeight: 600 }}>· {planName}</span>}
          </div>
        </div>
      </div>
      {/* Type */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: `${meta.color}12`, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{meta.label}</span>
      </div>
      {/* Direction */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: meta.dir === 'credit' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase' }}>
          {meta.dir === 'credit' ? '↓ CREDIT' : '↑ DEBIT'}
        </span>
      </div>
      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: st.color, background: st.bg, padding: '2px 7px', borderRadius: 4 }}>{st.label}</span>
      </div>
      {/* Amount */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: meta.dir === 'credit' ? 'var(--green)' : 'var(--red)' }}>
          {meta.dir === 'credit' ? '+' : '-'}{fmt(t.amount)}
        </span>
      </div>
      {/* Running balance */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 12, color: 'var(--navy)' }}>{fmt(runBalance || 0)}</span>
      </div>
    </div>
  );
}
