import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * LandingNav — top navigation bar for the public landing page.
 */
export default function LandingNav() {
  const navigate = useNavigate();
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid var(--gray-100)', position: 'sticky', top: 0, background: 'white', zIndex: 100 }}>
      <div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--navy)', letterSpacing: '0.1em' }}>PRODIGY</div>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--gray-400)', textTransform: 'uppercase' }}>GROUP SERVICES</div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => navigate('/login')} className="btn-outline" style={{ fontSize: 12 }}><Shield size={13} /> Admin Login</button>
        <button onClick={() => navigate('/register')} className="btn-navy" style={{ fontSize: 12 }}>Get Started <ArrowRight size={13} /></button>
      </div>
    </nav>
  );
}
