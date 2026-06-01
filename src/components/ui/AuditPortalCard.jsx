import React from 'react';
import { Link2 } from 'lucide-react';

/**
 * AuditPortalCard — email input + generate link card.
 * Used in both Audit.jsx (root) and corporate/Audit.jsx.
 *
 * Props:
 *   email         — current email value
 *   onEmailChange — (val) => void
 *   onGenerate    — () => void
 *   sent          — bool — whether link was sent
 */
export default function AuditPortalCard({ email, onEmailChange, onGenerate, sent }) {
  return (
    <div className="card animate-in delay-2">
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:14 }}>
        External Audit Portal Access
      </div>
      <input type="email" value={email} onChange={e => onEmailChange(e.target.value)}
        style={{ width:'100%', border:'1px solid var(--gray-200)', borderRadius:8, padding:'10px 12px', fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', marginBottom:10, color:'var(--navy)' }}
        onFocus={e => e.target.style.borderColor='var(--navy)'} onBlur={e => e.target.style.borderColor='var(--gray-200)'}
      />
      <button className="btn-navy" style={{ width:'100%', justifyContent:'center', padding:'12px' }} onClick={onGenerate}>
        <Link2 size={13} /> Generate Link
      </button>
      {sent && (
        <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(34,197,94,0.1)', borderRadius:8, fontSize:12, color:'var(--green)', fontWeight:600 }}>
          ✓ Link sent to {email}
        </div>
      )}
    </div>
  );
}
