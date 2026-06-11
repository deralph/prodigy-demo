import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Award } from 'lucide-react';
import DetailRow from '../ui/DetailRow';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * TerminationFlow — reusable 3-step pre-termination flow (idle → confirm → done).
 * Used in AssetPortfolio, JointPortfolio, and Treasury drawers.
 *
 * Props:
 *   productName    — name of the investment product
 *   principal      — principal amount
 *   netReturn      — estimated net return
 *   onDownloadCert — (reason: string) => void — called when termination certificate is requested
 *   onSubmit       — async (reason: string) => void — called when user confirms pre-termination
 *   mandateNote    — extra string shown under confirm button (for joint mandate info)
 *   bullets        — array of strings shown as warning bullets (optional)
 */
export default function TerminationFlow({ productName, principal, netReturn, penaltyRate = 0.1, onDownloadCert, onSubmit, mandateNote, bullets = [] }) {
  const [step, setStep] = useState('idle'); // idle | confirm | done
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const penaltyPct = Math.round(penaltyRate * 100);
  const penalty    = Math.round(principal * penaltyRate);
  const netAfter   = principal - penalty;

  const defaultBullets = [
    `Early termination incurs a ${penaltyPct}% penalty on principal.`,
    'Requests are reviewed within 1–2 business days.',
    'Principal returned within 5 business days of approval.',
    'Termination Certificate issued upon processing.',
  ];

  const warningBullets = bullets.length ? bullets : defaultBullets;

  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <CheckCircle size={52} color="var(--green)" style={{ marginBottom: 14 }} />
      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--navy)', marginBottom: 8 }}>
        Pre-Termination Submitted
      </div>
      <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20, lineHeight: 1.6 }}>
        {mandateNote || 'Your request has been submitted and is pending review.'}
      </p>
      <button
        onClick={() => onDownloadCert?.(reason)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', background: 'var(--gold)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, margin: '0 auto' }}
      >
        <Award size={14} /> Download Termination Certificate
      </button>
    </div>
  );

  if (step === 'confirm') return (
    <div>
      <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={16} color="var(--red)" />
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--red)' }}>Confirm Pre-Termination</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.7 }}>
          You are requesting early exit of <strong>{productName}</strong>. A {penaltyPct}% penalty on principal ({fmt(penalty)}) applies.
          {mandateNote && <><br /><strong>{mandateNote}</strong></>}
        </p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6, fontWeight: 700 }}>
          Reason for Termination
        </div>
        <textarea
          rows={3}
          placeholder="Explain your reason for early termination…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#1e293b', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'var(--red)'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>
      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => { setStep('idle'); setError(''); }} disabled={loading} style={{ padding: '13px', background: 'var(--gray-100)', color: 'var(--navy)', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, opacity: loading ? 0.6 : 1 }}>
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!reason.trim()) { setError('Please provide a reason for termination.'); return; }
            setLoading(true); setError('');
            try {
              await onSubmit?.(reason);
              setStep('done');
            } catch (e) {
              setError(e?.message || 'Failed to submit request. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          style={{ padding: '13px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {loading ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '16px', marginBottom: 18 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>⚠ Pre-Termination / Early Exit</div>
        <ul style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.9, paddingLeft: 16, margin: 0 }}>
          {warningBullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '14px', marginBottom: 18 }}>
        <DetailRow label="Investment"       value={productName} />
        <DetailRow label="Principal"        value={fmt(principal)} />
        <DetailRow label="Net Return"       value={fmt(netReturn)} />
        <DetailRow label="Penalty (est.)"   value={fmt(penalty)} />
        <DetailRow label="Net After Exit"   value={fmt(netAfter)} noBorder />
      </div>
      <button
        onClick={() => setStep('confirm')}
        style={{ width: '100%', padding: '14px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <AlertTriangle size={15} /> REQUEST PRE-TERMINATION
      </button>
    </div>
  );
}
