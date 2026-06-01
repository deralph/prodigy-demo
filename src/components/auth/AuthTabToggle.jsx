import React from 'react';

/**
 * AuthTabToggle — segmented pill toggle used on auth screens.
 *
 * Props:
 *   tabs    — array of { key, label }
 *   active  — currently active tab key
 *   onChange — (key) => void
 */
export default function AuthTabToggle({ tabs = [], active, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 28 }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em',
            background: active === t.key ? 'white' : 'transparent',
            color: active === t.key ? 'var(--navy)' : 'var(--gray-400)',
            boxShadow: active === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
