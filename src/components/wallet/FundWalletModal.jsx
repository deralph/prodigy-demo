import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, X } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import useAppStore from '../../store/useAppStore';
import { walletApi } from '../../services/api';
import ModalOverlay from '../ui/ModalOverlay';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const genRef = () => 'PSK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
const today  = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const PRESETS      = [100000, 250000, 500000, 1000000, 2500000, 5000000];
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_62ba3fa4e30ace38c25feca74eae65646f1cf095';

/** Isolated so usePaystackPayment always gets a stable config */
function PaystackButton({ amountNaira, email, reference, publicKey, paying, onPaying, onSuccess, onClose }) {
  const initPay = usePaystackPayment({
    reference, email: email || 'user@prodigyfinance.ng',
    amount: amountNaira * 100, publicKey, currency: 'NGN',
    metadata: { custom_fields: [{ display_name: 'Platform', variable_name: 'platform', value: 'Prodigy Finance' }] },
  });

  const successRef = useRef(onSuccess);
  const closeRef   = useRef(onClose);
  useEffect(() => { successRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { closeRef.current   = onClose;   }, [onClose]);

  const handleClick = () => {
    if (paying) return;
    onPaying();
    // react-paystack v6 expects a single object with onSuccess/onClose callbacks
    initPay({ onSuccess: r => successRef.current(r), onClose: () => closeRef.current() });
  };

  return (
    <button
      onClick={handleClick}
      disabled={paying}
      style={{ width: '100%', background: paying ? 'var(--gray-300)' : 'var(--gold)', color: 'var(--navy)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', border: 'none', borderRadius: 10, padding: '15px', cursor: paying ? 'not-allowed' : 'pointer', transition: 'filter 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      onMouseEnter={e => { if (!paying) e.currentTarget.style.filter = 'brightness(1.08)'; }}
      onMouseLeave={e => e.currentTarget.style.filter = 'none'}
    >
      <Lock size={15} /> {paying ? 'PROCESSING…' : `PAY ${fmt(amountNaira)} VIA PAYSTACK`}
    </button>
  );
}

/**
 * FundWalletModal — universal wallet funding modal with Paystack.
 * Used in Wallet.jsx (individual) and corporate/Wallet.jsx.
 *
 * Flow (no pre-popup initiate so a cancelled popup never leaves a phantom record):
 *   1. User enters amount, clicks Pay
 *   2. Paystack inline popup opens (client reference + matching public key)
 *   3. On popup success → POST /wallet/fund/verify { reference, amountKobo }
 *      → backend verifies with Paystack and credits atomically (creates the
 *        SUCCESSFUL record if none exists yet)
 *   4. On popup close/cancel → nothing is recorded
 *   5. refreshWallet() reloads balance + transactions from backend
 *
 * Props:
 *   onClose  — () => void
 *   onDone   — ({ type, amount?, ref, id? }) => void
 */
export default function FundWalletModal({ onClose, onDone }) {
  const { user, refreshWallet } = useAppStore();
  const [rawAmount, setRawAmount] = useState('');
  const [reference, setReference] = useState(genRef);
  const [paying, setPaying]       = useState(false);
  const [error, setError]         = useState('');
  const [pubKey, setPubKey]       = useState(PAYSTACK_KEY);

  // Use the public key that matches the backend's secret key so the charge and
  // the verification happen on the same Paystack account.
  useEffect(() => {
    let alive = true;
    walletApi.getConfig()
      .then(cfg => { if (alive && cfg?.publicKey) setPubKey(cfg.publicKey); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const numAmount = parseInt(rawAmount.replace(/[^0-9]/g, ''), 10) || 0;

  const handleInput = val => {
    const digits = val.replace(/[^0-9]/g, '');
    setRawAmount(digits ? Number(digits).toLocaleString() : '');
    setError('');
  };

  const handlePaying = useCallback(() => {
    setPaying(true);
    setError('');
  }, []);

  const handleSuccess = useCallback(async (response) => {
    const ref = response?.reference || reference;
    const amountKobo = numAmount * 100;
    try {
      await walletApi.verifyPayment(ref, amountKobo);
      await refreshWallet();
    } catch (err) {
      console.error('[FundWallet] verify failed:', err);
    }
    setPaying(false);
    onClose();
    onDone({ type: 'success', amount: numAmount, ref, id: ref });
  }, [numAmount, reference, refreshWallet, onClose, onDone]);

  const handleCancelled = useCallback(() => {
    const cancelledRef = reference;
    setReference(genRef());
    setPaying(false);
    onClose();
    onDone({ type: 'cancel', ref: cancelledRef });
  }, [reference, onClose, onDone]);

  return (
    <ModalOverlay
      onClose={onClose}
      maxWidth={460}
      headerContent={
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '0.06em' }}>FUND WALLET</h2>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginTop: 3 }}>Secure · Instant · Paystack</p>
        </div>
      }
    >
      {/* Account strip */}
      <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, border: '1px solid var(--gray-200)' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Funding Account</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{user?.email || '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Currency</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>NGN ₦</div>
        </div>
      </div>

      {/* Amount input */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8 }}>Amount (₦)</div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: numAmount ? 'var(--navy)' : 'var(--gray-400)', pointerEvents: 'none', userSelect: 'none' }}>₦</span>
          <input
            type="text" inputMode="numeric" placeholder="0"
            value={rawAmount} onChange={e => handleInput(e.target.value)}
            style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '14px 14px 14px 36px', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--navy)', background: 'white', outline: 'none', transition: 'border-color 0.2s', letterSpacing: '-0.01em' }}
            onFocus={e => e.target.style.borderColor = 'var(--navy)'}
            onBlur={e  => e.target.style.borderColor = 'var(--gray-200)'}
          />
        </div>
      </div>

      {/* Quick select */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 10 }}>Quick Select</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PRESETS.map(p => {
            const active = numAmount === p;
            return (
              <button key={p} onClick={() => handleInput(String(p))}
                style={{ padding: '10px 4px', border: `1.5px solid ${active ? 'var(--navy)' : 'var(--gray-200)'}`, borderRadius: 8, background: active ? 'var(--navy)' : 'white', color: active ? 'white' : 'var(--navy)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.background = 'var(--gray-50)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'white'; }}}
              >
                {fmt(p).replace('.00', '')}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>
      )}

      {numAmount > 0 ? (
        <PaystackButton key={`${reference}-${pubKey}`} amountNaira={numAmount} email={user?.email} reference={reference} publicKey={pubKey} paying={paying} onPaying={handlePaying} onSuccess={handleSuccess} onClose={handleCancelled} />
      ) : (
        <button disabled style={{ width: '100%', background: 'var(--gray-100)', color: 'var(--gray-400)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', border: 'none', borderRadius: 10, padding: '15px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Lock size={15} /> ENTER AMOUNT TO CONTINUE
        </button>
      )}

      <p style={{ fontSize: 10, color: 'var(--gray-400)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
        🔒 Secured by Paystack · SSL Encrypted · PCI-DSS Compliant
      </p>
    </ModalOverlay>
  );
}
