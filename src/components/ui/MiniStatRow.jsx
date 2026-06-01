import React from 'react';

/**
 * MiniStatRow — a compact key/value stat display row.
 * Used in summary panels, drawers, and statement views.
 *
 * Props:
 *   label      — left label text
 *   value      — right value text or JSX
 *   color      — override value text color (optional)
 *   noBorder   — suppress bottom border (optional)
 *   bold       — bold value text (default true)
 */
export default function MiniStatRow({ label, value, color, noBorder = false, bold = true }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0',
      borderBottom: noBorder ? 'none' : '1px solid var(--gray-100)',
    }}>
      <span style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: color || 'var(--navy)' }}>{value ?? '—'}</span>
    </div>
  );
}
