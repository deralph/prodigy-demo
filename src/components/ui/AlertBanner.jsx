import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

/**
 * AlertBanner — inline success / warning / error alert.
 *
 * Props:
 *   message   — text to display
 *   type      — 'success' | 'error' | 'warning' (default 'success')
 *   style     — optional extra container styles
 */
export default function AlertBanner({ message, type = 'success', style: extraStyle = {} }) {
  const cfg = {
    success: {
      bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)',
      color: 'var(--green)', Icon: CheckCircle,
    },
    error: {
      bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
      color: '#dc2626', Icon: XCircle,
    },
    warning: {
      bg: 'rgba(232,184,75,0.1)', border: 'rgba(232,184,75,0.3)',
      color: 'var(--gold)', Icon: AlertTriangle,
    },
  }[type] || {};

  if (!message) return null;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 8, padding: '10px 14px',
      marginBottom: 16, fontSize: 13, color: cfg.color,
      fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 8,
      lineHeight: 1.4,
      ...extraStyle,
    }}>
      <cfg.Icon size={14} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}
