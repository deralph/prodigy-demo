import React, { useMemo } from 'react';
import { Download, FileText, FileBarChart, FileCheck, CreditCard } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import ReportCard from '../../components/ui/ReportCard';
import PortfolioAttributionChart from '../../components/ui/PortfolioAttributionChart';

const CHART_COLORS = ['#e8b84b','#3b6ef8','#22c55e','#8b5cf6','#f97316','#ec4899','#10b981'];

const REPORT_TYPES = [
  { icon:FileBarChart, title:'Consolidated Portfolio Summary', desc:'Complete portfolio capital deployment records', color:'#3b6ef8' },
  { icon:FileText,     title:'Initial Subscriptions Ledger',   desc:'Complete initial capital deployment records', color:'#22c55e' },
  { icon:FileCheck,    title:'Redemption & Exit Analytics',    desc:'Full exit cycle documentation',              color:'#f97316' },
  { icon:CreditCard,   title:'Tax Compliance & Credit Ledger', desc:'Tax compliance documentation',               color:'#8b5cf6' },
];

export default function CorporateReports() {
  const { clientInvestments } = useAppStore();

  const portfolioData = useMemo(() => {
    const byPlan = {};
    clientInvestments.forEach((inv, i) => {
      const name = inv.plan?.name || inv.planName || `Investment ${i + 1}`;
      byPlan[name] = (byPlan[name] || 0) + (inv.principalAmount || inv.amount || 0);
    });
    return Object.entries(byPlan).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [clientInvestments]);

  const totalAUM = clientInvestments.reduce((s, i) => s + (i.principalAmount || i.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Portfolio Intelligence Vault" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        <PortfolioAttributionChart data={portfolioData} />

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

      {clientInvestments.length > 0 && (
        <div style={{ background:'var(--navy)', borderRadius:12, padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }} className="animate-in delay-3">
          <div>
            <span style={{ background:'var(--gold)', color:'var(--navy)', fontSize:9, fontWeight:800, letterSpacing:'0.1em', padding:'3px 8px', borderRadius:4, display:'inline-block', marginBottom:6 }}>
              ✓ CORPORATE INVESTMENT PORTFOLIO
            </span>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>
              {clientInvestments.length} active investment{clientInvestments.length !== 1 ? 's' : ''} · Total: ₦{totalAUM.toLocaleString('en-NG')}
            </p>
          </div>
          <button className="btn-gold" style={{ fontSize:12 }}><Download size={13}/> Export Report</button>
        </div>
      )}

      <style>{`@media(max-width:900px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
