import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * SlideDrawer — right-side sliding panel overlay.
 *
 * Props:
 *   onClose       — () => void
 *   width         — drawer width (default 'min(520px,100vw)')
 *   children      — drawer content
 *   headerContent — JSX rendered in the colored header bar (optional)
 *   headerColor   — background color of the header (default 'var(--navy)')
 *   headerStats   — array of { label, val } — mini stat tiles in header (optional)
 */
export default function SlideDrawer({ onClose, width = 'min(520px,100vw)', children, headerContent, headerColor = 'var(--navy)', headerStats = [] }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex' }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(13,27,53,0.45)', backdropFilter: 'blur(3px)' }} />

      {/* Panel */}
      <div
        style={{ width, background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'hidden', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', animation: 'slideIn 0.28s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(headerContent || headerStats.length > 0) && (
          <div style={{ background: headerColor, padding: '22px 24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: headerStats.length ? 12 : 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>{headerContent}</div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                <X size={16} />
              </button>
            </div>
            {headerStats.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${headerStats.length}, 1fr)`, gap: 12 }}>
                {headerStats.map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'white' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      <style>{`@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>
    </div>
  );
}
