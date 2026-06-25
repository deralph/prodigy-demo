import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { walletApi } from '../../services/api';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

/**
 * PendingCosignBanner — shows pending withdrawal requests on this joint
 * account that THIS holder (not the requester) must co-sign before they
 * can be disbursed. Polls once on mount; call `onActed` after a successful
 * action so the parent can refresh wallet balances.
 */
export default function PendingCosignBanner({ onActed }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});

  const load = useCallback(async () => {
    try {
      const data = await walletApi.getPendingCosign();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    setActing(a => ({ ...a, [id]: action }));
    try {
      if (action === 'approve') await walletApi.cosignWithdrawal(id);
      else await walletApi.declineCosignWithdrawal(id, 'Declined by co-signing holder');
      await load();
      onActed?.();
    } catch (e) {
      // surface inline rather than silently swallowing
      setItems(prev => prev.map(it => it.id === id ? { ...it, _error: e?.message } : it));
    }
    setActing(a => ({ ...a, [id]: null }));
  };

  if (loading || items.length === 0) return null;

  return (
    <div style={{ background: 'rgba(232,184,75,0.08)', border: '1.5px solid rgba(232,184,75,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Clock size={14} color="var(--gold)" />
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.04em' }}>
          {items.length} Withdrawal{items.length > 1 ? 's' : ''} Awaiting Your Co-Signature
        </span>
      </div>
      {items.map(txn => {
        const amt = Number(txn.amountKobo || 0) / 100;
        const isActing = acting[txn.id];
        return (
          <div key={txn.id} style={{ background: 'white', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, border: '1px solid var(--gray-200)' }}>
            <Users size={16} color="var(--navy)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{fmt(amt)}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>To {txn.bankName} · {txn.bankAcctNo} · {txn.bankAcctName}</div>
              {txn._error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{txn._error}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => act(txn.id, 'approve')}
                disabled={!!isActing}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'rgba(34,197,94,0.1)', border: 'none', borderRadius: 7, cursor: isActing ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--green)' }}
              >
                <CheckCircle size={13} /> {isActing === 'approve' ? 'Signing…' : 'Co-Sign'}
              </button>
              <button
                onClick={() => act(txn.id, 'decline')}
                disabled={!!isActing}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 7, cursor: isActing ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--red)' }}
              >
                <XCircle size={13} /> Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
