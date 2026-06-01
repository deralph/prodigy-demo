import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * StatCard — KPI metric card with icon, value, label, and optional subtitle.
 *
 * Props:
 *   label     — metric label text
 *   value     — metric value (string or number)
 *   sub       — secondary line below value (optional)
 *   color     — accent color (hex or CSS var)
 *   icon      — Lucide icon component
 *   onClick   — makes card clickable with arrow indicator (optional)
 *   size      — 'sm' | 'md' (default 'md')
 */
export default function StatCard({ label, value, sub, color = '#3b82f6', icon: Icon, onClick, size = 'md' }) {
  const isSmall = size === 'sm';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: isSmall ? 10 : 12,
        padding: isSmall ? '14px 16px' : '20px 22px',
        border: '1px solid var(--gray-200)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,27,53,0.1)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `${color}12`, pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: isSmall ? 10 : 14 }}>
        {Icon && (
          <div style={{
            width: isSmall ? 32 : 38, height: isSmall ? 32 : 38,
            borderRadius: isSmall ? 8 : 10,
            background: `${color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={isSmall ? 15 : 18} color={color} strokeWidth={1.8} />
          </div>
        )}
        {onClick && <ArrowRight size={14} color="var(--gray-400)" />}
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'Syne,sans-serif', fontWeight: 800,
        fontSize: isSmall ? 18 : 26, color: 'var(--navy)', marginBottom: 4,
      }}>
        {value}
      </div>

      {/* Label */}
      <div style={{ fontSize: isSmall ? 9 : 11, fontWeight: 600, color: 'var(--gray-600)' }}>
        {label}
      </div>

      {/* Sub */}
      {sub && (
        <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
