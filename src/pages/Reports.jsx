import React from 'react';
import { Download, FileText, FileBarChart, FileCheck, CreditCard } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const portfolioData = [
  { name: 'Prodigy Aura', value: 403000, color: '#e8b84b' },
  { name: 'Prodigy Flex', value: 212000, color: '#3b6ef8' },
  { name: 'Prodigy Genesis', value: 900000, color: '#22c55e' },
  { name: 'Prodigy Liquidity', value: 125478, color: '#8b5cf6' },
];

const reports = [
  { icon: FileBarChart, title: 'Consolidated Portfolio Summary', desc: 'Complete portfolio capital deployment records', color: '#3b6ef8' },
  { icon: FileText, title: 'Initial Subscriptions Ledger', desc: 'Complete initial capital deployment records', color: '#22c55e' },
  { icon: FileCheck, title: 'Redemption & Exit Analytics', desc: 'Full exit cycle documentation', color: '#f97316' },
  { icon: CreditCard, title: 'Tax Compliance & Credit Ledger', desc: 'Tax compliance documentation', color: '#8b5cf6' },
];

export default function Reports() {
  return (
    <div>
      <PageHeader title="Portfolio Intelligence Vault" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Performance Chart */}
        <div className="card animate-in delay-1">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>⏱</span> Product Performance Attribution
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {portfolioData.map((_, i) => <Cell key={i} fill={portfolioData[i].color} />)}
                </Pie>
                <Tooltip formatter={v => `₦${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {portfolioData.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>₦{p.value.toLocaleString()}</div>
                  </div>
                  <Download size={12} color="var(--gray-400)" style={{ cursor: 'pointer', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Corporate Reports */}
        <div className="card animate-in delay-2">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={13} /> Standard Global Corporate Reports
          </h3>
          <p style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>Certified Administrative Documentation Vault</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {reports.map(r => (
              <div key={r.title} style={{
                border: '1px solid var(--gray-200)', borderRadius: 10, padding: 14,
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = `${r.color}08`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <r.icon size={16} color={r.color} />
                  <Download size={13} color="var(--gray-400)" />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', lineHeight: 1.4 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bespoke Mandate Banner */}
      <div style={{
        background: 'var(--navy)', borderRadius: 12, padding: '20px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }} className="animate-in delay-3">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ background: 'var(--gold)', color: 'var(--navy)', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4 }}>✓ VERIFIED CORP BESPOKE MANDATE</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Negotiated Rate: 18.5% P.A. | Custom Liquidation Cycle</p>
        </div>
        <button className="btn-gold" style={{ fontSize: 12 }}>
          <Download size={13} /> Term Sheet
        </button>
      </div>

      <style>{`
        @media(max-width:900px){
          div[style*="grid-template-columns: 1fr 1fr"]:first-of-type{grid-template-columns:1fr!important;}
        }
        @media(max-width:600px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
