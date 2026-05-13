import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, X, CheckCircle, XCircle, ArrowDownCircle, WalletIcon, Lock } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import PageHeader from '../components/PageHeader';
import useAppStore from '../store/useAppStore';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) =>
  '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const genRef = () =>
  'PSK-' + Date.now().toString(36).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

const genId = () => 'WAL-FT-' + Math.floor(1000 + Math.random() * 9000);

const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const PRESETS = [100000, 250000, 500000, 1000000, 2500000, 5000000];

// ── IMPORTANT: Replace this with your real Paystack public key ──
const PAYSTACK_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

/* ─── Toast ───────────────────────────────────────────────────── */
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 5500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  const ok = toast.type === 'success';

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: 'white',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      borderLeft: `4px solid ${ok ? 'var(--green)' : 'var(--red)'}`,
      borderRadius: 12, padding: '16px 18px 20px',
      maxWidth: 370, width: 'calc(100vw - 40px)',
      boxShadow: '0 8px 32px rgba(13,27,53,0.15)',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ok
          ? <CheckCircle size={17} color="var(--green)" />
          : <XCircle    size={17} color="var(--red)"   />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, color: 'var(--navy)', marginBottom: 3 }}>
          {toast.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.55 }}>{toast.message}</div>
        {toast.sub && (
          <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 5, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {toast.sub}
          </div>
        )}
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 2, flexShrink: 0, marginTop: 2 }}>
        <X size={14} />
      </button>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: ok ? 'var(--green)' : 'var(--red)',
        transformOrigin: 'left',
        animation: 'toastBar 5.5s linear forwards',
        borderRadius: '0 0 12px 12px',
      }} />
      <style>{`
        @keyframes toastIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes toastBar { from{transform:scaleX(1)} to{transform:scaleX(0)} }
      `}</style>
    </div>
  );
}

/* ─── PaystackButton ──────────────────────────────────────────────
   Isolated component so usePaystackPayment always gets a stable
   config and the callbacks always read the latest values via refs.
──────────────────────────────────────────────────────────────────── */
function PaystackButton({ amountNaira, email, reference, onSuccess, onClose }) {
  const config = {
    reference,
    email:     email || 'user@prodigyfinance.ng',
    amount:    amountNaira * 100,   // Paystack expects kobo
    publicKey: PAYSTACK_KEY,
    currency:  'NGN',
    metadata: {
      custom_fields: [
        { display_name: 'Platform',    variable_name: 'platform',    value: 'Prodigy Corporate System' },
        { display_name: 'Transaction', variable_name: 'transaction', value: 'Wallet Funding' },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  // Store callbacks in refs so they are always current when Paystack fires them
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef   = useRef(onClose);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onCloseRef.current   = onClose;   }, [onClose]);

  const handleClick = () => {
    initializePayment(
      (response) => onSuccessRef.current(response),
      ()         => onCloseRef.current()
    );
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width: '100%', background: 'var(--gold)', color: 'var(--navy)',
        fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14,
        letterSpacing: '0.06em', border: 'none', borderRadius: 10,
        padding: '15px', cursor: 'pointer', transition: 'filter 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'none'}
    >
      <Lock size={15} />
      PAY {fmt(amountNaira)} VIA PAYSTACK
    </button>
  );
}

/* ─── Fund Wallet Modal ───────────────────────────────────────── */
function FundWalletModal({ onClose, onDone }) {
  const { user, addTransaction } = useAppStore();

  const [rawAmount, setRawAmount] = useState('');
  // Reference is stable for the life of this modal
  const [reference] = useState(() => genRef());

  const numAmount = parseInt(rawAmount.replace(/[^0-9]/g, ''), 10) || 0;

  const handleInput = (val) => {
    const digits = val.replace(/[^0-9]/g, '');
    setRawAmount(digits ? Number(digits).toLocaleString() : '');
  };

  // ── onSuccess: Paystack confirmed the charge ──────────────────
  const handleSuccess = useCallback((response) => {
    // Read numAmount via closure — the PaystackButton re-mounts when
    // numAmount changes, so config.amount and this closure are always in sync
    const amt = parseInt(rawAmount.replace(/[^0-9]/g, ''), 10) || 0;
    const ref  = response?.reference || reference;
    const id   = genId();
    const date = todayLabel();

    // 1. Update store immediately
    addTransaction({
      id, date, amount: amt,
      description: 'Wallet Funding via Paystack',
      status: 'Successful', ref,
    });

    // 2. Close modal
    onClose();

    // 3. Tell parent to show success toast
    onDone({ type: 'success', amount: amt, ref, id });
  }, [rawAmount, reference, addTransaction, onClose, onDone]);

  // ── onClose: user closed Paystack popup without paying ────────
  const handleCancelled = useCallback(() => {
    onClose();
    onDone({ type: 'cancel', ref: reference });
  }, [reference, onClose, onDone]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(13,27,53,0.58)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 300, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 20, width: '100%', maxWidth: 460,
          boxShadow: '0 32px 80px rgba(13,27,53,0.28)',
          animation: 'modalIn 0.28s cubic-bezier(0.34,1.3,0.64,1)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'var(--navy)', padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '0.06em' }}>
              FUND WALLET
            </h2>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginTop: 3 }}>
              Secure · Instant · Paystack
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', borderRadius: 8, padding: 7, display: 'flex', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px 26px' }}>

          {/* Account strip */}
          <div style={{
            background: 'var(--gray-50)', borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 22, border: '1px solid var(--gray-200)',
          }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Funding Account</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{user?.email || 'jraphael441@gmail.com'}</div>
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
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22,
                color: numAmount ? 'var(--navy)' : 'var(--gray-400)',
                pointerEvents: 'none', userSelect: 'none',
              }}>₦</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={rawAmount}
                onChange={e => handleInput(e.target.value)}
                style={{
                  width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10,
                  padding: '14px 14px 14px 36px',
                  fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24,
                  color: 'var(--navy)', background: 'white', outline: 'none',
                  transition: 'border-color 0.2s', letterSpacing: '-0.01em',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
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
                  <button
                    key={p}
                    onClick={() => handleInput(String(p))}
                    style={{
                      padding: '10px 4px',
                      border: `1.5px solid ${active ? 'var(--navy)' : 'var(--gray-200)'}`,
                      borderRadius: 8,
                      background: active ? 'var(--navy)' : 'white',
                      color: active ? 'white' : 'var(--navy)',
                      fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor='var(--navy)'; e.currentTarget.style.background='var(--gray-50)'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.background='white'; }}}
                  >
                    {fmt(p).replace('.00', '')}
                  </button>
                );
              })}
            </div>
          </div>

          {/*
            PaystackButton is keyed by numAmount so it re-mounts whenever the
            amount changes — giving the hook a fresh, correct config every time.
            The callbacks are always current via refs inside PaystackButton.
          */}
          {numAmount >= 100 ? (
            <PaystackButton
              key={numAmount}
              amountNaira={numAmount}
              email={user?.email}
              reference={reference}
              onSuccess={handleSuccess}
              onClose={handleCancelled}
            />
          ) : (
            <button disabled style={{
              width: '100%', background: 'var(--gray-100)', color: 'var(--gray-400)',
              fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13,
              letterSpacing: '0.06em', border: 'none', borderRadius: 10, padding: '15px',
              cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Lock size={15} /> ENTER AMOUNT TO CONTINUE
            </button>
          )}

          <p style={{ fontSize: 10, color: 'var(--gray-400)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            🔒 Secured by Paystack · SSL Encrypted · PCI-DSS Compliant
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:translateY(22px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

/* ─── Wallet Page ─────────────────────────────────────────────── */
export default function Wallet() {
  const { walletBalance, pendingBalance, transactions } = useAppStore();
  const [showFund, setShowFund] = useState(false);
  const [toast, setToast]       = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleDone = useCallback(({ type, amount, ref, id }) => {
    if (type === 'success') {
      setToast({
        type: 'success',
        title: 'Wallet Funded Successfully!',
        message: `${fmt(amount)} has been credited to your corporate wallet.`,
        sub: `Ref: ${ref}  ·  ID: ${id}`,
      });
    } else {
      setToast({
        type: 'error',
        title: 'Payment Cancelled',
        message: 'You closed the Paystack window. No charge was made to your account.',
        sub: ref ? `Ref: ${ref}` : undefined,
      });
    }
  }, []);

  const exportCSV = () => {
    const rows = transactions.map(t =>
      `"${t.date}","${t.id}","${t.description}","${t.amount}","${t.ref}","${t.status}"`
    ).join('\n');
    const blob = new Blob(['Date,ID,Description,Amount,Reference,Status\n' + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'wallet-transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Corporate Fund Management" subtitle="Bespoke Asset Management System V2.0" />

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card animate-in delay-1" style={{ background: 'var(--navy)', border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(232,184,75,0.08)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Available Wallet Balance
          </div>
          {/* key forces re-render + flash animation every time balance changes */}
          <div
            key={walletBalance}
            style={{
              fontFamily: 'Syne,sans-serif', fontWeight: 800,
              fontSize: 'clamp(20px,4vw,30px)', color: 'white',
              marginBottom: 20, letterSpacing: '-0.01em',
              animation: 'balanceFlash 0.8s ease',
            }}
          >
            {fmt(walletBalance)}
          </div>
          <button className="btn-gold" style={{ fontSize: 12, padding: '10px 20px' }} onClick={() => setShowFund(true)}>
            <ArrowDownCircle size={14} /> Fund Wallet
          </button>
        </div>

        <div className="card animate-in delay-2">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Awaiting Confirmation</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(20px,4vw,30px)', color: 'var(--navy)', marginBottom: 8 }}>
            {fmt(pendingBalance)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>No pending transactions</div>
        </div>
      </div>

      {/* Transaction log */}
      <div className="card animate-in delay-3" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Transaction Logs
          </h3>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#3b6ef8', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Download size={13} /> Export CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['Date', 'Transaction ID', 'Description', 'Amount', 'Reference', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr
                  key={t.ref}
                  style={{
                    borderTop: '1px solid var(--gray-100)', transition: 'background 0.15s',
                    animation: i === 0 ? 'rowIn 0.55s ease both' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '15px 20px', fontSize: 12, color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{t.date}</td>
                  <td style={{ padding: '15px 20px', fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{t.id}</td>
                  <td style={{ padding: '15px 20px', fontSize: 12, color: 'var(--gray-600)' }}>{t.description}</td>
                  <td style={{ padding: '15px 20px', fontSize: 13, fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{fmt(t.amount)}</td>
                  <td style={{ padding: '15px 20px', fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{t.ref}</td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color:
                        t.status === 'Successful' ? 'var(--green)' :
                        t.status === 'Pending'    ? 'var(--gold)'  : 'var(--red)',
                      background:
                        t.status === 'Successful' ? 'rgba(34,197,94,0.1)'  :
                        t.status === 'Pending'    ? 'rgba(232,184,75,0.12)': 'rgba(239,68,68,0.1)',
                      padding: '3px 8px', borderRadius: 4,
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showFund && (
        <FundWalletModal
          onClose={() => setShowFund(false)}
          onDone={handleDone}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />

      <style>{`
        @keyframes balanceFlash {
          0%   { color: var(--gold); transform: scale(1.04); }
          60%  { color: var(--gold); }
          100% { color: white;       transform: scale(1); }
        }
        @keyframes rowIn {
          from { opacity:0; transform:translateY(-10px); background:rgba(34,197,94,0.14); }
          to   { opacity:1; transform:translateY(0);     background:transparent; }
        }
        @media(max-width:600px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
