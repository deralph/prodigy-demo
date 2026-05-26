import React from 'react';

/**
 * Reusable empty-state component for zero-data scenarios.
 *
 * Props:
 *   icon       — Lucide icon component (optional)
 *   title      — heading text
 *   message    — sub-text description
 *   action     — { label, onClick } — optional CTA button
 *   compact    — reduce vertical padding (for cards / panels)
 */
export default function EmptyState({ icon: Icon, title, message, action, compact = false }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: compact ? '32px 20px' : '64px 24px',
      textAlign: 'center',
      color: 'var(--gray-400, #94a3b8)',
    }}>
      {Icon && (
        <div style={{
          width: compact ? 48 : 64,
          height: compact ? 48 : 64,
          borderRadius: '50%',
          background: 'rgba(14,30,69,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Icon size={compact ? 22 : 28} color="var(--navy, #0e1e45)" strokeWidth={1.5} />
        </div>
      )}
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: compact ? 14 : 16,
        color: 'var(--navy, #0e1e45)',
        marginBottom: 6,
        letterSpacing: '0.02em',
      }}>
        {title || 'No data yet'}
      </div>
      {message && (
        <p style={{
          fontSize: 12,
          color: 'var(--gray-400, #94a3b8)',
          maxWidth: 320,
          lineHeight: 1.6,
          margin: '0 0 20px',
        }}>
          {message}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'var(--navy, #0e1e45)',
            color: 'white',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.08em',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
