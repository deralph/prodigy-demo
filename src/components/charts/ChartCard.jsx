import React from 'react';

/**
 * ChartCard — white card wrapper for a chart with title and optional subtitle.
 *
 * Props:
 *   title     — section heading
 *   subtitle  — smaller description (optional)
 *   children  — the ResponsiveContainer or chart JSX
 *   action    — JSX rendered top-right (filters, buttons, etc.) (optional)
 *   style     — extra container styles (optional)
 */
export default function ChartCard({ title, subtitle, children, action, style: extraStyle = {} }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '22px', border: '1px solid var(--gray-200)', ...extraStyle }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: subtitle ? 4 : 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            {title}
          </h3>
          {subtitle && <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, marginBottom: 0 }}>{subtitle}</p>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}
