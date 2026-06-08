import React from 'react';
import { Download, Loader } from 'lucide-react';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const TYPE_STYLE = {
  wallet_funding:         { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)',   label: 'Funding',      icon: ArrowDownLeft },
  subscription:           { color: 'var(--navy)',  bg: 'rgba(13,27,53,0.08)',   label: 'Subscription', icon: ArrowUpRight },
  redemption:             { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)', label: 'Redemption',   icon: ArrowDownLeft },
  wallet_withdrawal:      { color: '#f97316',      bg: 'rgba(249,115,22,0.1)',  label: 'Withdrawal',   icon: ArrowUpRight },
  pre_termination_payout: { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)', label: 'Pre-Term',     icon: ArrowDownLeft },
  dividend_payout:        { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)',   label: 'Dividend',     icon: ArrowDownLeft },
};

const STATUS_STYLE = {
  successful: { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  Successful: { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  pending:    { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)' },
  Pending:    { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)' },
  failed:     { color: '#dc2626',      bg: 'rgba(239,68,68,0.1)' },
};

const INFLOW_TYPES = new Set(['wallet_funding', 'redemption', 'pre_termination_payout', 'dividend_payout']);

/**
 * TransactionList — styled transaction history list with filter toggle and CSV export.
 *
 * Props:
 *   transactions — array of transaction objects
 *   title        — header title (default 'Transaction History')
 *   onExport     — () => void — called when Export CSV is clicked
 *   filterKey    — current filter ('all'|'inflow'|'outflow')
 *   onFilter     — (key) => void
 *   showFilters  — whether to show the inflow/outflow toggle (default true)
 *   emptyMsg     — empty state message
 */
export default function TransactionList({ transactions = [], title = 'Transaction History', onExport, filterKey = 'all', onFilter, showFilters = true, emptyMsg = 'No transactions yet.' }) {
  const isLoading = useAppStore(s => s.isLoadingData);
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-3">
      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {showFilters && onFilter && (
            <div style={{ display: 'flex', background: 'var(--gray-50)', borderRadius: 7, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
              {[['all', 'All'], ['inflow', 'Inflow'], ['outflow', 'Outflow']].map(([k, l]) => (
                <button key={k} onClick={() => onFilter(k)} style={{ padding: '6px 12px', border: 'none', background: filterKey === k ? 'var(--navy)' : 'transparent', color: filterKey === k ? 'white' : 'var(--gray-400)', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.04em' }}>{l}</button>
              ))}
            </div>
          )}
          {onExport && (
            <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
              <Download size={12} /> CSV
            </button>
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {isLoading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading transactions…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></> : emptyMsg}
        </div>
      ) : transactions.map((t, i) => {
        const ty   = TYPE_STYLE[t.type] || TYPE_STYLE.wallet_funding;
        const st   = STATUS_STYLE[t.status] || STATUS_STYLE.pending;
        const Icon = ty.icon;
        const isIn = INFLOW_TYPES.has(t.type);

        return (
          <div key={t.id || i}
            style={{ padding: '14px 22px', borderBottom: i < transactions.length - 1 ? '1px solid var(--gray-100)' : 'none', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: ty.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={ty.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>{t.description || ty.label}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.ref && `Ref: ${t.ref} · `}{t.date}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, color: isIn ? 'var(--green)' : 'var(--navy)', marginBottom: 3 }}>
                {isIn ? '+' : '-'}{fmt(t.amount)}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: st.color, background: st.bg, padding: '2px 7px', borderRadius: 4 }}>
                {(t.status || '').toLowerCase()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
