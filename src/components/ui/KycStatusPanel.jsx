import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * KycStatusPanel — navy sidebar showing per-document KYC status.
 * Used in corporate/KYC and shared/ProfilePage.
 *
 * Props:
 *   docs         — array of { key, label }
 *   getStatus    — (key) => string status
 *   extraItems   — array of { label, status } for additional rows (e.g. Signature)
 *   onRefresh    — () => void
 */
export default function KycStatusPanel({ docs = [], getStatus, extraItems = [], onRefresh }) {
  const toStyle = (st) => {
    if (!st || st === 'NOT_UPLOADED') return { color: 'var(--gold)', bg: 'rgba(232,184,75,0.15)', label: 'Pending' };
    if (st === 'VERIFIED')            return { color: 'var(--green)', bg: 'rgba(34,197,94,0.15)',   label: 'Verified' };
    if (st === 'UPLOADED')            return { color: '#3b82f6',      bg: 'rgba(59,130,246,0.15)',  label: 'Under Review' };
    if (st === 'REJECTED')            return { color: 'var(--red)',   bg: 'rgba(239,68,68,0.15)',   label: 'Rejected' };
    return { color: 'var(--gold)', bg: 'rgba(232,184,75,0.15)', label: st };
  };

  const allRows = [
    ...docs.map(d => ({ label: d.label, st: toStyle(getStatus(d.key)) })),
    ...extraItems.map(e => ({ label: e.label, st: toStyle(e.status) })),
  ];

  return (
    <div style={{ background: 'var(--navy)', borderRadius: 12, padding: 24 }}>
      <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
        KYC Document Status
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
        {allRows.map(({ label, st }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: st.color, background: st.bg, padding: '3px 8px', borderRadius: 4 }}>{st.label}</span>
          </div>
        ))}
      </div>
      {onRefresh && (
        <button onClick={onRefresh}
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, padding: '12px', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <RefreshCw size={13} /> Refresh Status
        </button>
      )}
    </div>
  );
}
