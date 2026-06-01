import React from 'react';
import { Download, CheckCircle, FileText } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * CertificateGrid — downloadable investment certificate tiles.
 * Used in Audit.jsx (root) and corporate/Audit.jsx.
 *
 * Props:
 *   certificates — array of { name, date }
 *   onDownload   — (cert) => void (optional)
 */
export default function CertificateGrid({ certificates = [], onDownload }) {
  return (
    <div className="card animate-in delay-3">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:'var(--navy)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
          Authenticated Confirmation Certificates
        </h3>
        <CheckCircle size={16} color="var(--green)" />
      </div>
      {certificates.length === 0
        ? <EmptyState icon={FileText} title="No certificates yet" message="Investment confirmation certificates will appear here once you have active investments." />
        : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16 }}>
            {certificates.map(cert => (
              <div key={cert.name} onClick={() => onDownload?.(cert)}
                style={{ border:'1px solid var(--gray-200)', borderRadius:10, padding:'16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--navy)'; e.currentTarget.style.background='var(--gray-50)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.background='transparent'; }}
              >
                <div style={{ width:40, height:40, borderRadius:8, background:'var(--gray-100)', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Download size={16} color="var(--navy)" />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', marginBottom:4, lineHeight:1.3 }}>{cert.name}</div>
                <div style={{ fontSize:10, color:'var(--gray-400)' }}>{cert.date}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
