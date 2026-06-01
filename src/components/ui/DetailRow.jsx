import React from 'react';

/**
 * DetailRow — a single label/value row for detail panels and modals.
 *
 * Props:
 *   label      — left-side label text
 *   value      — right-side value (string, number, or React node)
 *   noBorder   — suppress bottom border (optional)
 *   valueStyle — extra inline styles for value cell (optional)
 */
export default function DetailRow({ label, value, noBorder = false, valueStyle = {} }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: noBorder ? 'none' : '1px solid var(--gray-100)',
    }}>
      <span style={{
        fontSize: 11, color: 'var(--gray-400)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        flexShrink: 0, marginRight: 12,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 600, color: 'var(--navy)',
        textAlign: 'right', maxWidth: '60%',
        ...valueStyle,
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}
