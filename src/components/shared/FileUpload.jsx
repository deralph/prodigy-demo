import React from 'react';
import { Upload } from 'lucide-react';

export default function FileUpload({ label, file, onChange, hint = 'Click to browse files' }) {
  return (
    <div>
      {label && <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8 }}>{label}</div>}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '24px 20px', border: '1.5px dashed var(--gray-200)', borderRadius: 12,
        cursor: 'pointer', transition: 'all 0.2s', background: 'var(--gray-50)',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--navy)'; e.currentTarget.style.background='white'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.background='var(--gray-50)'; }}
      >
        <input type="file" style={{ display: 'none' }} onChange={onChange} />
        <Upload size={20} color={file ? 'var(--green)' : 'var(--gray-400)'} strokeWidth={1.5} />
        <span style={{ fontSize: 12, color: file ? 'var(--navy)' : 'var(--gray-400)', fontWeight: file ? 600 : 400 }}>
          {file ? file.name : hint}
        </span>
      </label>
    </div>
  );
}
