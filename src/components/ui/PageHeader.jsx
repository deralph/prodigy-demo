import React from 'react';

/**
 * PageHeader — standard page title + subtitle block.
 *
 * Props:
 *   title      — main heading text (required)
 *   subtitle   — smaller subtitle line (optional)
 *   action     — { label, onClick, icon } — optional right-side CTA button (optional)
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="animate-in">
      <div>
        <h1 style={{
          fontFamily: 'Syne,sans-serif', fontWeight: 800,
          fontSize: 'clamp(18px,3vw,24px)', color: 'var(--navy)',
          letterSpacing: '0.02em', textTransform: 'uppercase',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: 11, letterSpacing: '0.1em', color: 'var(--gray-400)',
            textTransform: 'uppercase', marginTop: 4,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', background: 'var(--navy)', color: 'white',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {action.icon && <action.icon size={14} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
