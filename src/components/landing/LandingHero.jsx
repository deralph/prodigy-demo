import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * LandingHero — hero section with gradient background and CTAs.
 */
export default function LandingHero() {
  const navigate = useNavigate();
  return (
    <section style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f8fafc 100%)', padding: 'clamp(60px,10vh,120px) 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,184,75,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,27,53,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
        Prodigy Group Services
        <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
      </p>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(36px,6vw,72px)', color: 'var(--navy)', lineHeight: 1.1, marginBottom: 16 }}>
        Your Gateway to<br /><span style={{ color: '#3b6ef8' }}>Financial Excellence</span>
      </h1>
      <p style={{ color: 'var(--gray-600)', fontSize: 'clamp(14px,2vw,17px)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
        Access premium loan and investment products tailored to your financial goals. From flexible loans to bespoke investment portfolios.
      </p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/register')} className="btn-navy" style={{ fontSize: 14, padding: '14px 32px' }}>Get Started <ArrowRight size={16} /></button>
        <button onClick={() => navigate('/login')} className="btn-outline" style={{ fontSize: 14, padding: '14px 32px' }}><Shield size={15} /> Admin Login</button>
      </div>
    </section>
  );
}
