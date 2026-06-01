import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * AuthSubmitButton — full-width navy CTA button for auth forms.
 *
 * Props:
 *   label     — button text (default 'Continue')
 *   loading   — show loading state
 *   loadingLabel — text while loading (default 'Loading...')
 *   disabled  — disabled state
 *   onClick   — click handler (if not inside a form)
 *   type      — button type (default 'submit')
 *   showArrow — show ArrowRight icon (default true)
 */
export default function AuthSubmitButton({ label = 'Continue', loading = false, loadingLabel = 'Loading...', disabled, onClick, type = 'submit', showArrow = true }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: 'var(--navy)', color: 'white',
        fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em',
        border: 'none', borderRadius: 10, padding: '14px', cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: (disabled || loading) ? 0.6 : 1, marginTop: 4, width: '100%',
      }}
    >
      {loading ? loadingLabel : <>{label}{showArrow && <ArrowRight size={15} />}</>}
    </button>
  );
}
