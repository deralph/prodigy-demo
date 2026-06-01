import React from 'react';
import { Download, FileText, FileBarChart, FileCheck, CreditCard } from 'lucide-react';
import PageHeader from './components/ui/PageHeader';
import ReportCard from './components/ui/ReportCard';
import PortfolioAttributionChart from './components/ui/PortfolioAttributionChart';

const PORTFOLIO_DATA = [
  { name:'Prodigy Aura',             value:403000,  color:'#e8b84b' },
  { name:'Prodigy Flex',             value:212000,  color:'#3b6ef8' },
  { name:'Prodigy Genesis',          value:900000,  color:'#22c55e' },
  { name:'Prodigy Liquidity',        value:125478,  color:'#8b5cf6' },
];
const REPORT_TYPES = [
  { icon:FileBarChart, title:'Consolidated Portfolio Summary', desc:'Complete portfolio capital deployment records', color:'#3b6ef8' },
  { icon:FileText,     title:'Initial Subscriptions Ledger',   desc:'Complete initial capital deployment records', color:'#22c55e' },
  { icon:FileCheck,    title:'Redemption & Exit Analytics',    desc:'Full exit cycle documentation',              color:'#f97316' },
  { icon:CreditCard,   title:'Tax Compliance & Credit Ledger', desc:'Tax compliance documentation',               color:'#8b5cf6' },
];

export default function Reports() {
  return (
    <div>
      <PageHeader title="Portfolio Intelligence Vault" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        <PortfolioAttributionChart data={PORTFOLIO_DATA} />

        <div className="card animate-in delay-2">
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
            <FileText size={13}/> Standard Global Corporate Reports
          </h3>
          <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:20 }}>Certified Administrative Documentation Vault</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {REPORT_TYPES.map(r => <ReportCard key={r.title} {...r} />)}
          </div>
        </div>
      </div>

      <div style={{ background:'var(--navy)', borderRadius:12, padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }} className="animate-in delay-3">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ background:'var(--gold)', color:'var(--navy)', fontSize:9, fontWeight:800, letterSpacing:'0.1em', padding:'3px 8px', borderRadius:4 }}>✓ VERIFIED CORP BESPOKE MANDATE</span>
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Negotiated Rate: 18.5% P.A. | Custom Liquidation Cycle</p>
        </div>
        <button className="btn-gold" style={{ fontSize:12 }}><Download size={13}/> Term Sheet</button>
      </div>

      <style>{`@media(max-width:900px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
