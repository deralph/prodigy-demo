import React from 'react';

/**
 * ProgressBar — a styled horizontal progress bar.
 * Used in StaffLoans, AccessControl, Goals.
 *
 * Props:
 *   pct    — percentage (0–100)
 *   color  — fill color (default 'var(--green)')
 *   height — bar height in px (default 6)
 *   label  — optional label shown below (string)
 *   showPct — show percentage text to the right of bar (default false)
 *   style  — extra container styles
 */
export default function ProgressBar({ pct = 0, color = 'var(--green)', height = 6, label, showPct = false, style: extraStyle = {} }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={extraStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height, background: 'var(--gray-100)', borderRadius: height / 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${clamped}%`, background: color, borderRadius: height / 2, transition: 'width 0.5s ease' }} />
        </div>
        {showPct && <span style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{Math.round(clamped)}%</span>}
      </div>
      {label && <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>{label}</div>}
    </div>
  );
}
