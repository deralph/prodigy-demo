import React from 'react';
import { Upload, CheckCircle, Info } from 'lucide-react';

/**
 * KycDocUpload — KYC document upload list.
 * Shared between corporate onboarding KYC and individual/joint KYC steps.
 *
 * Props:
 *   docs       — array of { key, label, required? }
 *   uploads    — { [key]: File } — current upload state
 *   onUpload   — (key, file) => void
 *   title      — section heading (optional)
 *   subtitle   — section sub-heading (optional)
 *   infoNote   — JSX or string for blue info box (optional)
 *   skipNote   — string shown as a skip hint (optional)
 */
export default function KycDocUpload({ docs = [], uploads = {}, onUpload, title, subtitle, infoNote, skipNote }) {
  return (
    <div>
      {title && <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>{title}</h2>}
      {subtitle && <p style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{subtitle}</p>}

      {infoNote && (
        <div style={{ fontSize: 12, color: '#1d4ed8', background: 'rgba(59,130,246,0.07)', padding: '10px 12px', borderRadius: 8, marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{infoNote}</span>
        </div>
      )}

      {skipNote && (
        <div style={{ fontSize: 11, color: 'var(--gray-400)', background: 'rgba(232,184,75,0.07)', padding: '8px 12px', borderRadius: 8, marginBottom: 14, border: '1px solid rgba(232,184,75,0.2)' }}>
          ⚡ {skipNote}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs.map(doc => {
          const file = uploads[doc.key];
          return (
            <div key={doc.key} style={{ background: file ? 'rgba(34,197,94,0.06)' : '#f8fafc', border: `1px solid ${file ? 'rgba(34,197,94,0.3)' : '#e2e8f0'}`, borderRadius: 10, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>
                  {doc.label}{' '}
                  <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 600 }}>{doc.required ? 'REQUIRED' : 'OPTIONAL'}</span>
                </div>
                {file
                  ? <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {file.name}</div>
                  : <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>PDF, JPG, or PNG — Max 5MB</div>
                }
              </div>
              <label style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: file ? 'rgba(34,197,94,0.12)' : 'rgba(13,27,53,0.08)', color: file ? 'var(--green)' : 'var(--navy)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: '1px solid rgba(13,27,53,0.12)' }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => onUpload(doc.key, e.target.files?.[0] || null)} />
                {file ? <><CheckCircle size={12} /> Uploaded</> : <><Upload size={12} /> Upload</>}
              </label>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>
          {Object.keys(uploads).filter(k => uploads[k]).length}/{docs.length} documents uploaded
        </div>
      </div>
    </div>
  );
}
