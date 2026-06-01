import React from 'react';

/**
 * KpiGrid — a responsive grid of KPI stat tiles.
 * Used across Analytics and other dashboard pages.
 *
 * Props:
 *   kpis — array of { label, val, color, icon: LucideComponent }
 *   cols — min column width in px (default 150)
 */
export default function KpiGrid({ kpis = [], cols = 150 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${cols}px,1fr))`, gap: 14, marginBottom: 22 }}>
      {kpis.map(k => (
        <div key={k.label} style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {k.icon && <k.icon size={15} color={k.color} style={{ opacity: 0.7 }} />}
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: k.color }}>{k.val}</div>
          <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k.label}</div>
        </div>
      ))}
    </div>
  );
}
