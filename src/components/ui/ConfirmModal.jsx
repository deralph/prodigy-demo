import React from 'react';
import ModalOverlay from './ModalOverlay';

/**
 * ConfirmModal — a simple two-button confirmation dialog.
 *
 * Props:
 *   title       — heading text
 *   message     — body description (string or JSX)
 *   icon        — Lucide icon component (optional)
 *   iconColor   — icon/accent color (default 'var(--red)')
 *   confirmLabel — text for confirm button (default 'Confirm')
 *   cancelLabel  — text for cancel button (default 'Cancel')
 *   onConfirm   — called when confirm is clicked
 *   onCancel    — called when cancel is clicked
 *   danger      — uses red confirm button (default true)
 */
export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  icon: Icon,
  iconColor = 'var(--red)',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}) {
  return (
    <ModalOverlay onClose={onCancel} maxWidth={400}>
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        {Icon && (
          <div style={{
            width: 52, height: 52,
            background: `${iconColor === 'var(--red)' ? 'rgba(239,68,68,0.1)' : 'rgba(232,184,75,0.1)'}`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Icon size={22} color={iconColor} />
          </div>
        )}
        <h3 style={{
          fontFamily: 'Syne,sans-serif', fontWeight: 800,
          fontSize: 16, color: 'var(--navy)', marginBottom: 8,
        }}>
          {title}
        </h3>
        {message && (
          <p style={{
            fontSize: 13, color: 'var(--gray-600)',
            lineHeight: 1.6, marginBottom: 20,
          }}>
            {message}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px',
              background: 'var(--gray-100)', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Syne,sans-serif', fontWeight: 700,
              fontSize: 12, color: 'var(--navy)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '12px',
              background: danger ? 'var(--red)' : 'var(--navy)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Syne,sans-serif', fontWeight: 700,
              fontSize: 12, color: 'white',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
