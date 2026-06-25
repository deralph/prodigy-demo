import React, { useState, useCallback } from 'react';
import { Lock, Users, AlertTriangle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { walletApi } from '../../services/api';
import ModalOverlay from '../ui/ModalOverlay';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * WithdrawModal — universal cash withdrawal request modal.
 * Used by individual CashAccount, corporate Wallet, and JointCash.
 *
 * Mandate enforcement (the backend is the source of truth — this UI just
 * sets accurate expectations):
 *   - Single-signatory accounts (individual/corporate) — submitted
 *     immediately, no further action needed.
 *   - Joint / OR mandate — any one holder may authorize independently,
 *     submitted immediately.
 *   - Joint / AND mandate — either holder may *initiate* the request, but
 *     it cannot be disbursed until the OTHER holder separately logs into
 *     their own account and co-signs it. This is a real second signature
 *     (each joint holder has their own login), not a checkbox one party
 *     ticks on the other's behalf.
 *
 * Props:
 *   onClose       — () => void
 *   onDone        — ({ type, amount?, ref?, requiresCoSign? }) => void
 *   maxAmount     — available wallet balance in naira
 *   isJoint       — boolean
 *   mandate       — 'AND' | 'OR' (only meaningful when isJoint)
 *   holderNames   — string[] (used for the AND-mandate explanatory copy)
 */
export default function WithdrawModal({ onClose, onDone, maxAmount = 0, isJoint = false, mandate = 'AND', holderNames = [] }) {
  const { refreshWallet } = useAppStore();
  const [rawAmount, setRawAmount]   = useState('');
  const [bankName, setBankName]     = useState('');
  const [bankAcctNo, setBankAcctNo] = useState('');
  const [bankAcctName, setBankAcctName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const numAmount = parseInt(rawAmount.replace(/[^0-9]/g, ''), 10) || 0;
  const requiresCoSign = isJoint && mandate === 'AND';
  const otherHolderName = holderNames.find(Boolean) && holderNames.length > 1 ? holderNames[1] : 'the other holder';

  const handleInput = val => {
    setRawAmount(val.replace(/[^0-9]/g, ''));
    setError('');
  };

  const canSubmit =
    numAmount > 0 &&
    numAmount <= maxAmount &&
    bankName.trim() && bankAcctNo.trim() && bankAcctName.trim() &&
    !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await walletApi.requestWithdrawal({
        amountKobo: numAmount * 100,
        bankName: bankName.trim(),
        bankAcctNo: bankAcctNo.trim(),
        bankAcctName: bankAcctName.trim(),
      });
      await refreshWallet();
      onClose();
      onDone({ type: 'success', amount: numAmount, ref: result?.txnRef, requiresCoSign: !!result?.requiresCoSign });
    } catch (err) {
      setSubmitting(false);
      setError(err?.message || 'Could not submit withdrawal. Please try again.');
    }
  }, [canSubmit, numAmount, bankName, bankAcctNo, bankAcctName, refreshWallet, onClose, onDone]);

  const inputStyle = {
    width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10,
    padding: '12px 14px', fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
    color: 'var(--navy)', background: 'white', outline: 'none', transition: 'border-color 0.2s',
  };
  const labelStyle = { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8 };

  return (
    <ModalOverlay
      onClose={onClose}
      maxWidth={460}
      headerContent={
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '0.06em' }}>WITHDRAW FUNDS</h2>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginTop: 3 }}>
            {isJoint ? `${mandate} Mandate · Joint Account` : 'Secure · To Your Bank Account'}
          </p>
        </div>
      }
    >
      <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, border: '1px solid var(--gray-200)' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Available Balance</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{fmt(maxAmount)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Amount (₦)</div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: numAmount ? 'var(--navy)' : 'var(--gray-400)', pointerEvents: 'none' }}>₦</span>
          <input
            type="text" inputMode="numeric" placeholder="0"
            value={rawAmount ? Number(rawAmount).toLocaleString() : ''}
            onChange={e => handleInput(e.target.value)}
            style={{ ...inputStyle, padding: '14px 14px 14px 36px', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24 }}
          />
        </div>
        {numAmount > maxAmount && (
          <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>Amount exceeds your available balance.</div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>Destination Bank Name</div>
        <input type="text" placeholder="e.g. GTBank" value={bankName} onChange={e => setBankName(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>Account Number</div>
        <input type="text" inputMode="numeric" placeholder="0123456789" value={bankAcctNo} onChange={e => setBankAcctNo(e.target.value.replace(/[^0-9]/g, ''))} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={labelStyle}>Account Name</div>
        <input type="text" placeholder="As it appears on your bank account" value={bankAcctName} onChange={e => setBankAcctName(e.target.value)} style={inputStyle} />
      </div>

      {requiresCoSign ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.35)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <Users size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.5 }}>
            <strong>AND mandate — co-signature required.</strong> After you submit, {otherHolderName} must log into their own account to co-sign this withdrawal before it can be disbursed. Funds won't move until they do.
          </span>
        </div>
      ) : isJoint ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, color: 'var(--gray-400)', marginBottom: 16 }}>
          <Users size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>OR mandate — either account holder may authorize withdrawals independently.</span>
        </div>
      ) : null}

      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{ width: '100%', background: canSubmit ? 'var(--navy)' : 'var(--gray-100)', color: canSubmit ? 'white' : 'var(--gray-400)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', border: 'none', borderRadius: 10, padding: '15px', cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'filter 0.2s' }}
        onMouseEnter={e => { if (canSubmit) e.currentTarget.style.filter = 'brightness(1.1)'; }}
        onMouseLeave={e => e.currentTarget.style.filter = 'none'}
      >
        <Lock size={15} /> {submitting ? 'SUBMITTING…' : requiresCoSign ? 'REQUEST WITHDRAWAL & NOTIFY HOLDER' : 'REQUEST WITHDRAWAL'}
      </button>

      <p style={{ fontSize: 10, color: 'var(--gray-400)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
        Withdrawals are reviewed before disbursement and may take up to 24 hours{requiresCoSign ? ' after co-signature' : ''}.
      </p>
    </ModalOverlay>
  );
}
