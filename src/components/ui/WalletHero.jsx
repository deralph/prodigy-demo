import React from 'react';
import { Wallet, Plus, ArrowUpRight, Copy, Check } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * WalletHero — large navy wallet balance hero block.
 * Used in CashAccount (individual) and JointCash.
 *
 * Props:
 *   balance        — number
 *   pendingBalance — number (optional)
 *   label          — eyebrow label (default 'Available Balance')
 *   onFund         — () => void
 *   onWithdraw     — () => void (optional — renders a Withdraw button when provided)
 *   account        — { bank, acct, name } — virtual account info (optional)
 *   copied         — bool
 *   onCopy         — () => void
 *   fundLabel      — button label (default 'FUND WALLET')
 */
export default function WalletHero({ balance, pendingBalance, label = 'Available Balance', onFund, onWithdraw, account, copied, onCopy, fundLabel = 'FUND WALLET' }) {
  return (
    <div style={{ background: 'var(--navy)', borderRadius: 14, padding: '24px 28px', marginBottom: 22, position: 'relative', overflow: 'hidden' }} className="animate-in delay-1">
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(232,184,75,0.05)', pointerEvents: 'none' }} />
      <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Wallet size={11} color="var(--gold)" /> {label}
      </p>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(26px,4vw,38px)', color: 'white', letterSpacing: '-0.01em', marginBottom: 6 }}>
        {fmt(balance)}
      </h2>
      {!!pendingBalance && pendingBalance > 0 && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>+ {fmt(pendingBalance)} pending</p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        {onFund && (
          <button onClick={onFund} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', letterSpacing: '0.06em' }}>
            <Plus size={13} /> {fundLabel}
          </button>
        )}
        {onWithdraw && (
          <button onClick={onWithdraw} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', letterSpacing: '0.06em' }}>
            <ArrowUpRight size={13} /> WITHDRAW
          </button>
        )}
        {account && (() => {
          const assigned = account.acct && account.acct !== '—';
          return (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 14px', cursor: assigned ? 'pointer' : 'default', opacity: assigned ? 1 : 0.6 }}
              onClick={assigned ? onCopy : undefined}
            >
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Virtual Account</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>
                  {assigned ? `${account.acct} · ${account.bank}` : 'Not assigned yet'}
                </div>
              </div>
              {assigned && (copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} color="rgba(255,255,255,0.4)" />)}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
