import React from 'react';
import { Upload } from 'lucide-react';

/**
 * FileUploadBox — dashed drop-zone file upload button.
 * Used in StaffLoans pages and KYC upload flows.
 *
 * Props:
 *   label    — label above the box (optional)
 *   file     — currently selected File object (optional)
 *   onChange — (file: File | null) => void
 *   accept   — accept attribute string (default '.pdf,.jpg,.jpeg,.png')
 *   hint     — secondary hint text below the icon (optional)
 */
export default function FileUploadBox({ label, file, onChange, accept = '.pdf,.jpg,.jpeg,.png', hint }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <label
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '24px 20px',
          border: `1.5px dashed ${file ? 'var(--green)' : 'var(--gray-200)'}`,
          borderRadius: 12, cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          background: file ? 'rgba(34,197,94,0.04)' : 'var(--gray-50)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.background = 'white'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = file ? 'var(--green)' : 'var(--gray-200)'; e.currentTarget.style.background = file ? 'rgba(34,197,94,0.04)' : 'var(--gray-50)'; }}
      >
        <input type="file" accept={accept} style={{ display: 'none' }} onChange={e => onChange(e.target.files?.[0] || null)} />
        <Upload size={22} color={file ? 'var(--green)' : 'var(--gray-400)'} strokeWidth={1.5} />
        <span style={{ fontSize: 12, color: file ? 'var(--navy)' : 'var(--gray-400)', fontWeight: file ? 600 : 400, textAlign: 'center' }}>
          {file ? file.name : 'Click to upload file'}
        </span>
        {!file && hint && <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{hint}</span>}
      </label>
    </div>
  );
}
