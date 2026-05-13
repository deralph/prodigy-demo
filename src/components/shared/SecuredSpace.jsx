import React from 'react';
import { Lock } from 'lucide-react';
import PageHeader from '../PageHeader';

export default function SecuredSpace({ title, subtitle = 'Infrastructure Access: Premium Tier', spaceName, desc }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div style={{
        background: 'white', borderRadius: 16, padding: '80px 40px',
        border: '1px solid var(--gray-200)', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative watermark */}
        <div style={{
          position: 'absolute', right: -30, top: '50%', transform: 'translateY(-50%)',
          opacity: 0.04, pointerEvents: 'none',
        }}>
          <svg width="220" height="220" viewBox="0 0 100 100">
            <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="var(--navy)" />
          </svg>
        </div>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(232,184,75,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Lock size={28} color="var(--gold)" strokeWidth={1.5} />
        </div>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {spaceName}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--gray-400)', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {desc || 'This module is being provisioned for your architecture. Secure data tunnels are currently being established.'}
        </p>
        <span style={{
          display: 'inline-block', fontSize: 10, fontWeight: 700,
          color: 'var(--gold)', background: 'rgba(232,184,75,0.1)',
          border: '1px solid rgba(232,184,75,0.3)',
          padding: '5px 14px', borderRadius: 20, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Estimated Readiness: 120 Mins
        </span>
      </div>
    </div>
  );
}
