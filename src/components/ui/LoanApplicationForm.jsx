import React, { useState } from 'react';
import { DollarSign, Clock, FileText, AlertTriangle } from 'lucide-react';
import AlertBanner from './AlertBanner';
import ModalOverlay from './ModalOverlay';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const LOAN_TYPES = [
  { key: 'emergency', label: 'Emergency',      color: '#ef4444', maxMonths: 6,  desc: 'Urgent personal or family emergency funding' },
  { key: 'salary',    label: 'Salary Advance', color: '#3b82f6', maxMonths: 3,  desc: 'Early access to upcoming salary payment' },
  { key: 'education', label: 'Education',      color: '#8b5cf6', maxMonths: 12, desc: 'Tuition fees or educational expenses' },
  { key: 'welfare',   label: 'Welfare',        color: '#22c55e', maxMonths: 6,  desc: 'General welfare and personal development' },
  { key: 'other',     label: 'Other',          color: '#6b7280', maxMonths: 12, desc: 'Other approved purposes' },
];

/**
 * LoanApplicationForm — full apply modal used in StaffLoans (individual) and StaffLoans (corporate).
 *
 * Props:
 *   onClose     — () => void
 *   onSubmit    — (loanData) => void
 *   walletBal   — number (for context, optional)
 *   staffName   — string (optional)
 */
export default function LoanApplicationForm({ onClose, onSubmit, walletBal, staffName }) {
  const [form, setForm]     = useState({ type: 'emergency', amount: '', term: '', purpose: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const upd = patch => setForm(f => ({ ...f, ...patch }));

  const loanType  = LOAN_TYPES.find(l => l.key === form.type) || LOAN_TYPES[0];
  const amount    = parseFloat(form.amount.replace(/[^0-9.]/g, '')) || 0;
  const monthly   = amount && form.term ? Math.round((amount / Number(form.term)) * 1.015) : null;
  const canSubmit = amount > 0 && form.term && form.purpose.trim().length > 10;

  const handleSubmit = async () => {
    setError('');
    if (!canSubmit) { setError('Please fill all fields correctly.'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600)); // simulate
      onSubmit({ type: form.type, amount, term: Number(form.term), purpose: form.purpose, staffName, id: 'LN-' + Date.now(), date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'pending' });
      onClose();
    } catch {
      setError('Submission failed. Please try again.');
    }
    setLoading(false);
  };

  const inputStyle = { width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', color: 'var(--navy)' };

  return (
    <ModalOverlay onClose={onClose} maxWidth={500} scrollable headerContent={
      <div>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'white', textTransform: 'uppercase' }}>Apply for Staff Loan</h3>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>1.5% flat interest · Salary deduction repayment</p>
      </div>
    }>
      {error && <AlertBanner message={error} type="error" />}

      {/* Loan type selector */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 10, fontWeight: 700 }}>Loan Category</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {LOAN_TYPES.map(lt => (
            <div key={lt.key} onClick={() => upd({ type: lt.key })} style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${form.type === lt.key ? lt.color : 'var(--gray-200)'}`, cursor: 'pointer', background: form.type === lt.key ? `${lt.color}08` : 'white', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: form.type === lt.key ? lt.color : 'var(--navy)' }}>{lt.label}</div>
              <div style={{ fontSize: 9, color: 'var(--gray-400)', marginTop: 2 }}>{lt.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7, fontWeight: 700 }}>Loan Amount (₦)</div>
        <div style={{ position: 'relative' }}>
          <DollarSign size={14} color="var(--gray-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" placeholder="e.g. 500,000" value={form.amount}
            onChange={e => upd({ amount: e.target.value })}
            style={{ ...inputStyle, paddingLeft: 34 }}
            onFocus={e => e.target.style.borderColor = loanType.color}
            onBlur={e  => e.target.style.borderColor = 'var(--gray-200)'}
          />
        </div>
      </div>

      {/* Repayment term */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7, fontWeight: 700 }}>Repayment Term</div>
        <div style={{ position: 'relative' }}>
          <Clock size={14} color="var(--gray-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select value={form.term} onChange={e => upd({ term: e.target.value })}
            style={{ ...inputStyle, paddingLeft: 34, appearance: 'none', cursor: 'pointer', background: 'white' }}>
            <option value="">Select repayment period</option>
            {Array.from({ length: loanType.maxMonths }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m} {m === 1 ? 'month' : 'months'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Purpose */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7, fontWeight: 700 }}>Purpose / Justification</div>
        <textarea rows={3} placeholder="Provide a brief explanation of why you need this loan…" value={form.purpose} onChange={e => upd({ purpose: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = loanType.color}
          onBlur={e  => e.target.style.borderColor = 'var(--gray-200)'}
        />
      </div>

      {/* Summary */}
      {amount > 0 && form.term && (
        <div style={{ background: `${loanType.color}08`, border: `1px solid ${loanType.color}25`, borderRadius: 10, padding: '14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: loanType.color, fontWeight: 700, marginBottom: 10 }}>Repayment Summary</div>
          {[
            ['Loan Amount',       fmt(amount)],
            ['Interest (1.5%)',   fmt(amount * 0.015)],
            ['Total Repayable',   fmt(amount * 1.015)],
            ['Term',              `${form.term} months`],
            ['Est. Monthly',      monthly ? fmt(monthly) : '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>{l}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <AlertTriangle size={13} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: 'var(--navy)', lineHeight: 1.6, margin: 0 }}>Repayment will be deducted from your salary over the selected term. Approval is subject to HR/Finance review.</p>
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit || loading}
        style={{ width: '100%', padding: '14px', background: canSubmit && !loading ? loanType.color : 'var(--gray-200)', color: canSubmit && !loading ? 'white' : 'var(--gray-400)', border: 'none', borderRadius: 10, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', transition: 'all 0.2s' }}>
        {loading ? 'SUBMITTING…' : 'SUBMIT APPLICATION'}
      </button>
    </ModalOverlay>
  );
}
