import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

/**
 * Toast — bottom-right notification with auto-dismiss and progress bar.
 *
 * Props:
 *   toast      — { type: 'success'|'error', title, message, sub? } | null
 *   onDismiss  — () => void
 *   duration   — ms before auto-dismiss (default 5500)
 */
export default function Toast({ toast, onDismiss, duration = 5500 }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [toast, onDismiss, duration]);

  if (!toast) return null;
  const ok = toast.type === 'success';

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: 'white',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      borderLeft: `4px solid ${ok ? 'var(--green)' : 'var(--red)'}`,
      borderRadius: 12, padding: '16px 18px 20px',
      maxWidth: 370, width: 'calc(100vw - 40px)',
      boxShadow: '0 8px 32px rgba(13,27,53,0.15)',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ok ? <CheckCircle size={17} color="var(--green)" /> : <XCircle size={17} color="var(--red)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, color: 'var(--navy)', marginBottom: 3 }}>
          {toast.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.55 }}>{toast.message}</div>
        {toast.sub && (
          <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 5, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {toast.sub}
          </div>
        )}
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 2, flexShrink: 0, marginTop: 2 }}>
        <X size={14} />
      </button>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: ok ? 'var(--green)' : 'var(--red)',
        transformOrigin: 'left',
        animation: `toastBar ${duration}ms linear forwards`,
        borderRadius: '0 0 12px 12px',
      }} />
      <style>{`
        @keyframes toastIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes toastBar { from{transform:scaleX(1)} to{transform:scaleX(0)} }
      `}</style>
    </div>
  );
}
