import React from 'react';
import { TrendingUp, Shield, Users, Zap } from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, title: 'Smart Investments', desc: 'Tailored investment strategies for maximum returns' },
  { icon: Shield,     title: 'Secure Platform',   desc: 'Bank-level security for your financial data' },
  { icon: Users,      title: 'Expert Advisory',   desc: 'Professional guidance from financial experts' },
  { icon: Zap,        title: 'Fast Processing',   desc: 'Quick approval and instant access to services' },
];

/**
 * FeatureCard — single feature tile.
 */
function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div
      style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 16, padding: 32, textAlign: 'center', transition: 'all 0.3s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,27,53,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(59,110,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon size={22} color="#3b6ef8" strokeWidth={1.8} />
      </div>
      <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--navy)' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

/**
 * LandingFeatures — feature grid section.
 */
export default function LandingFeatures() {
  return (
    <section style={{ padding: 'clamp(48px,8vh,80px) 48px', background: 'white' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 600, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>✏️</span> Prodigy Group Services
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
        {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
      </div>
    </section>
  );
}
