import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ModalOverlay — standard modal backdrop + card shell.
 *
 * Props:
 *   onClose       — called when backdrop or X button is clicked
 *   maxWidth      — modal max-width (default 520)
 *   children      — modal body content
 *   noPadding     — suppress default body padding (optional)
 *   headerColor   — background for header section (optional, e.g. 'var(--navy)')
 *   headerContent — JSX rendered inside the header bar (optional)
 *   showClose     — show X button in header (default true)
 *   scrollable    — allow content to scroll vertically (default false)
 */
export default function ModalOverlay({
  onClose,
  maxWidth = 520,
  children,
  noPadding = false,
  headerColor,
  headerContent,
  showClose = true,
  scrollable = false,
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(13,27,53,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          width: '100%',
          maxWidth,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(13,27,53,0.25)',
          animation: 'modalIn 0.25s ease',
          display: scrollable ? 'flex' : 'block',
          flexDirection: scrollable ? 'column' : undefined,
          maxHeight: scrollable ? '90vh' : undefined,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Optional header bar */}
        {headerContent && (
          <div style={{
            background: headerColor || 'var(--navy)',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>{headerContent}</div>
            {showClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', marginLeft: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{
          padding: noPadding ? 0 : '22px 24px',
          flex: scrollable ? 1 : undefined,
          overflowY: scrollable ? 'auto' : undefined,
        }}>
          {children}
        </div>
      </div>

      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
