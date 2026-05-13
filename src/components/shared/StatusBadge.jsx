import React from 'react';

const configs = {
  verified:   { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  approved:   { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  successful: { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  active:     { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  pending:    { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)' },
  flagged:    { color: '#f97316',      bg: 'rgba(249,115,22,0.1)' },
  rejected:   { color: 'var(--red)',   bg: 'rgba(239,68,68,0.1)' },
  failed:     { color: 'var(--red)',   bg: 'rgba(239,68,68,0.1)' },
  suspended:  { color: 'var(--red)',   bg: 'rgba(239,68,68,0.1)' },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status?.toLowerCase()] || { color: 'var(--gray-400)', bg: 'var(--gray-100)' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: cfg.color, background: cfg.bg, padding: '3px 8px', borderRadius: 4,
      whiteSpace: 'nowrap',
    }}>{status}</span>
  );
}
