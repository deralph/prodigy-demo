import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const directors = [
  { name: 'Chukwuma Adeyemi', role: 'Managing Director (Signatory A)', expiry: '2027-10-12', avatar: 'CA' },
  { name: 'Oluwaseun Fatunase', role: 'Finance Director (Signatory B)', expiry: '2026-05-15', avatar: 'OF' },
  { name: 'Ibrahim Bello', role: 'Non-Exec Director', expiry: '2030-01-01', avatar: 'IB' },
];

const kycItems = [
  { label: 'CAC', status: 'Verified' },
  { label: 'Tax ID', status: 'Verified' },
  { label: 'SCUML', status: 'Verified' },
  { label: 'Utility', status: 'Verified' },
];

export default function KYC() {
  return (
    <div>
      <PageHeader title="Corporate KYC Registry" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        {/* Directors Panel */}
        <div className="card animate-in delay-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>✍️</span>
            <div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Director & Signatory Identity Registry
              </h3>
            </div>
            <span className="badge-verified" style={{ marginLeft: 'auto' }}>Status: Verified</span>
          </div>

          <div style={{ padding: '8px 0' }}>
            {directors.map((d, i) => (
              <div key={d.name} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 24px',
                borderBottom: i < directors.length - 1 ? '1px solid var(--gray-100)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--navy)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, fontFamily: 'Syne, sans-serif',
                  flexShrink: 0,
                }}>
                  {d.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.role}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Expiry Date</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                    <Calendar size={12} color="var(--gray-400)" />
                    {d.expiry}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Entity KYC */}
        <div style={{ background: 'var(--navy)', borderRadius: 12, padding: 24 }} className="animate-in delay-2">
          <h3 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12,
            color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20,
          }}>
            Corporate Entity KYC
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {kycItems.map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14,
              }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--green)',
                  background: 'rgba(34,197,94,0.15)', padding: '3px 8px', borderRadius: 4,
                }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <button style={{
            width: '100%', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', color: 'white',
            borderRadius: 8, padding: '12px', cursor: 'pointer',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <RefreshCw size={13} /> Update Documents
          </button>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          div[style*="grid-template-columns: 1fr 280px"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
