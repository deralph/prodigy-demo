import React from 'react';

/**
 * NibssVerifyField — NIN/BVN/CAC input with inline verify button.
 *
 * Props:
 *   label      — field label
 *   value      — current value
 *   onChange   — (val: string) => void (already cleaned of non-digits)
 *   onVerify   — () => void
 *   verified   — boolean
 *   verifying  — boolean
 *   error      — error message string
 *   maxLength  — max digits (default 11)
 *   placeholder
 *   accentColor — color for focus border (optional)
 *   canVerify   — bool — whether verify button should be enabled
 */
export default function NibssVerifyField({ label, value, onChange, onVerify, verified, verifying, error, maxLength = 11, placeholder, accentColor = 'var(--navy)', canVerify }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        {verified && <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 10 }}>✓ VERIFIED</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, maxLength))}
          maxLength={maxLength}
          style={{
            flex: 1, border: `1px solid ${verified ? '#22c55e' : '#d1d5db'}`, borderRadius: 8,
            padding: '10px 13px', fontFamily: 'monospace', fontSize: 14, color: '#1e293b',
            background: 'white', outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e  => e.target.style.borderColor = accentColor}
          onBlur={e   => e.target.style.borderColor = verified ? '#22c55e' : '#d1d5db'}
        />
        <button
          onClick={onVerify}
          disabled={verifying || !canVerify || verified}
          style={{
            padding: '10px 13px',
            background: verified ? 'rgba(34,197,94,0.12)' : accentColor,
            color: verified ? 'var(--green)' : 'white',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            flexShrink: 0, whiteSpace: 'nowrap',
            opacity: (verifying || !canVerify || verified) ? 0.55 : 1,
          }}
        >
          {verifying ? '⏳ Checking…' : verified ? '✓ DONE' : 'VERIFY'}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 5 }}>{error}</div>}
      {verified && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 5 }}>✓ Verified successfully.</div>}
    </div>
  );
}
