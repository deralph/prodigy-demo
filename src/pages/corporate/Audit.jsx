import React, { useState } from 'react';
import { Lock, CheckCircle, Download, Link2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const groupA = [
  { name: 'Chukwuma Adeyemi', signed: true },
  { name: 'Amina Yusuf', signed: false },
];
const groupB = [
  { name: 'Oluwaseun Fatunase', signed: true },
];

const certificates = [
  { name: 'Prodigy Aura', date: 'Oct 13, 2024' },
  { name: 'Prodigy Flex-Tenure Note', date: 'Oct 13, 2024' },
  { name: 'Prodigy Bonds', date: 'Oct 13, 2024' },
  { name: 'Prodigy Liquidity Fund', date: 'Oct 13, 2024' },
  { name: 'Verified Corp Fund', date: 'Oct 13, 2024' },
];

export default function Audit() {
  const [auditEmail, setAuditEmail] = useState('nofatunase@ijaware.net');
  const [linkGenerated, setLinkGenerated] = useState(false);

  return (
    <div>
      <PageHeader title="Security & Mandate Verification" subtitle="Bespoke Asset Management System V2.0" />

      {/* Mandate Control */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 24 }}>
        <div className="card animate-in delay-1">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                Signatory Mandate Control
              </h3>
              <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>Any two from Group A or One A · One B</p>
            </div>
            <Lock size={16} color="var(--red)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Group A */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 14 }}>Group A Signatories</div>
              {groupA.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: s.signed ? 'var(--green)' : 'var(--gray-400)',
                    background: s.signed ? 'rgba(34,197,94,0.1)' : 'var(--gray-100)',
                    padding: '3px 8px', borderRadius: 4,
                  }}>
                    {s.signed ? 'Signature' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            {/* Group B */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 14 }}>Group B Signatories</div>
              {groupB.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 4,
                  }}>Signature</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* External Audit Portal */}
        <div className="card animate-in delay-2">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>External Audit Portal Access</div>
          <input
            type="email"
            value={auditEmail}
            onChange={e => setAuditEmail(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button
            className="btn-navy"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            onClick={() => setLinkGenerated(true)}
          >
            <Link2 size={13} /> Generate Link
          </button>
          {linkGenerated && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
              ✓ Link sent to {auditEmail}
            </div>
          )}
        </div>
      </div>

      {/* Certificates */}
      <div className="card animate-in delay-3">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Authenticated Confirmation Certificates
          </h3>
          <CheckCircle size={16} color="var(--green)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {certificates.map(cert => (
            <div key={cert.name} style={{
              border: '1px solid var(--gray-200)', borderRadius: 10, padding: '16px',
              textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'var(--gray-100)', margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Download size={16} color="var(--navy)" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{cert.name}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{cert.date}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          div[style*="grid-template-columns: 1fr 280px"]{grid-template-columns:1fr!important;}
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
