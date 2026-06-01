import React from 'react';

/**
 * TypeBadge — a colored pill badge for account types, categories, etc.
 * Used in ClientManagement, ApprovalHub, AuditTrail, Reports.
 *
 * Props:
 *   label   — text to display
 *   color   — text + border color
 *   bg      — background color (optional, derived from color if omitted)
 *   style   — extra styles (optional)
 */
export default function TypeBadge({ label, color, bg, style: extraStyle = {} }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color,
      background: bg || `${color}18`,
      padding: '3px 8px', borderRadius: 4,
      display: 'inline-flex', alignItems: 'center',
      ...extraStyle,
    }}>
      {label}
    </span>
  );
}
