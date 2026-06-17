import React from 'react';
import { ArrowDownCircle } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * WalletBalanceCard — primary navy balance display card.
 *
 * Props:
 *   balance      — available wallet balance (number)
 *   label        — header label text
 *   onFund       — () => void — triggers fund wallet flow
 *   fundLabel    — button label (default 'Fund Wallet')
 */
export default function WalletBalanceCard({ balance, label = 'Available Wallet Balance', onFund, fundLabel = 'Fund Wallet', onWithdraw, withdrawLabel = 'Withdraw' }) {
  return (
    <div className="card animate-in delay-1" style={{ background: 'var(--navy)', border: 'none', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(232,184,75,0.08)', pointerEvents: 'none' }} />
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div
        key={balance}
        style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(20px,4vw,30px)', color: 'white', marginBottom: 20, letterSpacing: '-0.01em', animation: 'balanceFlash 0.8s ease' }}
      >
        {fmt(balance)}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {onFund && (
          <button className="btn-gold" style={{ fontSize: 12, padding: '10px 20px' }} onClick={onFund}>
            <ArrowDownCircle size={14} /> {fundLabel}
          </button>
        )}
        {onWithdraw && (
          <button className="btn-outline" style={{ fontSize: 12, padding: '10px 20px' }} onClick={onWithdraw}>
            {withdrawLabel}
          </button>
        )}
      </div>
      <style>{`
        @keyframes balanceFlash {
          0%  { color: var(--gold); transform: scale(1.04); }
          60% { color: var(--gold); }
          100%{ color: white; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
