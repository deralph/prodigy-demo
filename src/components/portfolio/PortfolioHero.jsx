import React from 'react';
import { TrendingUp } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * PortfolioHero — dark navy AUM hero banner.
 * Used in AssetPortfolio, JointPortfolio, Treasury.
 *
 * Props:
 *   label       — eyebrow label (e.g. "Total Portfolio Value")
 *   value       — main formatted value (string)
 *   sub         — green trending sub-line (e.g. "21.5% Avg ROI · 3 Active")
 *   stats       — array of { label, val } shown top-right
 *   actions     — JSX — action buttons (optional)
 *   live        — show pulsing live dot (default false)
 */
export default function PortfolioHero({ label, value, sub, stats = [], actions, live = false }) {
  return (
    <div style={{ background: 'var(--navy)', borderRadius: 16, padding: '26px 30px', marginBottom: 22, position: 'relative', overflow: 'hidden' }} className="animate-in delay-1">
      {/* Decorative circle */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,184,75,0.06)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            {live && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />}
            {label}
          </p>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', color: 'white', letterSpacing: '-0.01em', marginBottom: 8 }}>
            {value}
          </h2>
          {sub && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={12} color="var(--green)" />
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>{sub}</span>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-end' }}>
          {stats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 16, textAlign: 'right' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--gold)', marginTop: 2 }}>{s.val}</div>
                </div>
              ))}
            </div>
          )}
          {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
