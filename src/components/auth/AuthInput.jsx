import React from 'react';

/**
 * AuthInput — labelled input with icon for auth forms.
 *
 * Props:
 *   label       — field label text
 *   icon        — Lucide icon component (optional)
 *   type        — input type (default 'text')
 *   value       — controlled value
 *   onChange    — change handler
 *   placeholder — placeholder text
 *   error       — error message (shows red border + message)
 *   rightSlot   — JSX rendered on the right of the label row (e.g. forgot button)
 *   disabled    — disables input
 *   style       — extra input styles
 */
export default function AuthInput({ label, icon: Icon, type = 'text', value, onChange, placeholder, error, rightSlot, disabled, style: extraStyle = {} }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label}
          {rightSlot}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={14} color="var(--gray-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: '100%',
            border: `1px solid ${error ? 'var(--red)' : '#d1d5db'}`,
            borderRadius: 8,
            padding: Icon ? '11px 14px 11px 38px' : '11px 14px',
            fontFamily: 'DM Sans,sans-serif',
            fontSize: 14, color: '#1e293b', background: disabled ? 'var(--gray-50)' : 'white', outline: 'none',
            transition: 'border-color 0.2s',
            ...extraStyle,
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = 'var(--navy)'; }}
          onBlur={e  => { e.target.style.borderColor = error ? 'var(--red)' : '#d1d5db'; }}
        />
      </div>
      {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</div>}
    </div>
  );
}
