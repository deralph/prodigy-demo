import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LandingCTA — bottom call-to-action section with blue background.
 */
export default function LandingCTA() {
  const navigate = useNavigate();
  return (
    <section style={{ background: '#3b6ef8', padding: 'clamp(60px,10vh,100px) 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(28px,4vw,44px)', color: 'white', marginBottom: 16 }}>Ready to Get Started?</h2>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
        Join thousands of satisfied customers and start your financial journey today
      </p>
      <button
        onClick={() => navigate('/register')}
        style={{ background: 'white', color: '#3b6ef8', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 8, padding: '14px 36px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        Create Free Account
      </button>
    </section>
  );
}
