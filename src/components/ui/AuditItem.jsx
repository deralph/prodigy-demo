import React from 'react';
import { Clock } from 'lucide-react';
import { ROLE_COLORS } from '../../store/useAppStore';

const CAT_COLOR = {
  kyc: '#8b5cf6', compliance: '#ef4444', finance: '#22c55e',
  investment: '#e8b84b', operations: '#3b82f6', audit: '#f97316', system: '#0d1b35',
};

/**
 * AuditItem — a single audit log entry row.
 *
 * Props:
 *   entry    — audit log entry object
 *   isLast   — suppress bottom border
 */
export default function AuditItem({ entry: a, isLast = false }) {
  const catColor = CAT_COLOR[a.category] || 'var(--gray-400)';
  const roleColor = ROLE_COLORS?.[a.role] || 'var(--gray-400)';

  return (
    <div
      style={{
        padding: '15px 22px',
        borderBottom: isLast ? 'none' : '1px solid var(--gray-100)',
        display: 'flex', alignItems: 'flex-start', gap: 14,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Category dot */}
      <div style={{
        width: 9, height: 9, borderRadius: '50%',
        background: catColor, flexShrink: 0, marginTop: 5,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>
            {a.action}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: catColor,
            background: `${catColor}18`, padding: '2px 6px',
            borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {a.category}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 3 }}>{a.target}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
            By: <strong style={{ color: 'var(--navy)' }}>{a.admin}</strong>
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: roleColor,
            background: `${roleColor}15`, padding: '2px 7px',
            borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {a.role?.replace('_', ' ')}
          </span>
          {a.ip && (
            <span style={{ fontSize: 10, color: 'var(--gray-400)', fontFamily: 'monospace' }}>
              IP: {a.ip}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div style={{
        fontSize: 11, color: 'var(--gray-400)', flexShrink: 0,
        textAlign: 'right', display: 'flex', alignItems: 'center',
        gap: 4, whiteSpace: 'nowrap',
      }}>
        <Clock size={11} />{a.time}
      </div>
    </div>
  );
}
