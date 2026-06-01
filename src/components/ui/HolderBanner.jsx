import React from 'react';
import { Users } from 'lucide-react';

/**
 * HolderBanner — joint account holder info strip.
 * Used in JointCash, JointPortfolio, JointStatements, AccessControl.
 *
 * Props:
 *   holders  — array of strings (holder names) OR holder objects { name }
 *   mandate  — 'AND' | 'OR' (optional)
 *   action   — JSX rendered on the right side (optional)
 */
export default function HolderBanner({ holders = [], mandate, action }) {
  const names = holders.map(h => (typeof h === 'string' ? h : h.name)).filter(Boolean);

  return (
    <div style={{
      background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.25)',
      borderRadius: 10, padding: '12px 18px', marginBottom: 18,
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }} className="animate-in">
      <Users size={14} color="var(--gold)" />
      <span style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 600, flex: 1, minWidth: 0 }}>
        {names.map((name, i) => (
          <span key={i}>
            {i > 0 && ' · '}
            <strong>{name}</strong>
          </span>
        ))}
      </span>
      {mandate && (
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold)', background: 'rgba(232,184,75,0.12)', padding: '3px 9px', borderRadius: 4, flexShrink: 0 }}>
          {mandate} Mandate
        </span>
      )}
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
