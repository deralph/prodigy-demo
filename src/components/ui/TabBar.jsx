import React from 'react';

/**
 * TabBar — horizontal tab navigation strip.
 *
 * Props:
 *   tabs      — array of { key, label, icon? (Lucide component) }
 *   active    — currently active tab key
 *   onChange  — (key) => void
 *   variant   — 'underline' | 'pill' (default 'underline')
 */
export default function TabBar({ tabs = [], active, onChange, variant = 'underline' }) {
  if (variant === 'pill') {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              padding: '6px 13px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 10,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: active === t.key ? 'var(--navy)' : 'white',
              color: active === t.key ? 'white' : 'var(--gray-400)',
              border: `1px solid ${active === t.key ? 'var(--navy)' : 'var(--gray-200)'}`,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {t.icon && <t.icon size={11} />}
            {t.label}
            {t.count != null && ` (${t.count})`}
          </button>
        ))}
      </div>
    );
  }

  // underline variant (used inside modals / panels)
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: '#fafbfd', flexShrink: 0 }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: active === t.key ? 700 : 500,
            color: active === t.key ? 'var(--navy)' : 'var(--gray-400)',
            background: 'transparent',
            borderBottom: active === t.key ? '2px solid var(--navy)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.2s',
            fontFamily: 'DM Sans,sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}
        >
          {t.icon && <t.icon size={12} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}
