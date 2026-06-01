import React from 'react';

/**
 * AuthLeftPanel — dark navy branding panel on the login/onboarding screen.
 *
 * Props:
 *   type — 'corporate' | 'individual'
 */
export default function AuthLeftPanel({ type = 'corporate' }) {
  const isCorp = type === 'corporate';
  return (
    <div style={{
      width: '42%', background: 'var(--navy)', padding: '48px 40px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,184,75,0.06)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(232,184,75,0.04)' }} />

      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--gold)', letterSpacing: '0.12em' }}>PRODIGY</div>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
          {isCorp ? 'CORPORATE SYSTEM' : 'WEALTH MANAGEMENT'}
        </div>
      </div>

      <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(28px,3vw,40px)', color: 'white', lineHeight: 1.1, marginBottom: 20 }}>
        {isCorp
          ? <>BESPOKE<br />ASSET MANAGEMENT<br /><span style={{ color: 'var(--gold)' }}>ELEVATED.</span></>
          : <>PERSONAL<br />WEALTH GENERATION<br /><span style={{ color: 'var(--gold)' }}>REIMAGINED.</span></>
        }
      </h1>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.7 }}>
        {isCorp
          ? 'Secure, institutional-grade liquidity and investment infrastructure for enterprise clients.'
          : 'Premium liquidity, high-yield returns, and investment solutions for individuals and families.'}
      </p>

      <div style={{ marginTop: 36, padding: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 9, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Secure Access</div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
          {isCorp
            ? 'All corporate accounts are provisioned by Prodigy Finance. Contact your relationship manager to request access.'
            : 'Sign in with the credentials provided during account registration, or create a new individual / joint account.'}
        </p>
      </div>
    </div>
  );
}
