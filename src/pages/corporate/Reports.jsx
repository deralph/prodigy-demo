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

const downloadCSV = (filename, rows, headers) => {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines  = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  const blob   = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

export default function CorporateReports() {
  const { clientInvestments, user } = useAppStore();

  const portfolioData = useMemo(() => {
    const byPlan = {};
    clientInvestments.forEach((inv, i) => {
      const name = inv.plan || `Investment ${i + 1}`;
      byPlan[name] = (byPlan[name] || 0) + (inv.amount || 0);
    });
    return Object.entries(byPlan).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [clientInvestments]);

  const totalAUM = clientInvestments.reduce((s, i) => s + (i.amount || 0), 0);
  const entity    = user?.name || 'Corporate Client';
  const today     = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  const handleDownload = (key) => {
    if (key === 'Consolidated Portfolio Summary') {
      downloadCSV(`Portfolio_Summary_${today}.csv`,
        clientInvestments.map(i => [i.investRef||i.id, i.plan||'—', i.status, '₦'+Number(i.amount||0).toLocaleString('en-NG'), i.roi ? i.roi+'%' : '—', i.valueDate||'—', i.maturityDate||'—']),
        ['Reference','Product','Status','Principal','ROI','Value Date','Maturity Date']);
    } else if (key === 'Initial Subscriptions Ledger') {
      downloadCSV(`Subscriptions_${today}.csv`,
        clientInvestments.map(i => [i.investRef||i.id, i.plan||'—', '₦'+Number(i.amount||0).toLocaleString('en-NG'), i.valueDate||'—', i.status]),
        ['Reference','Product','Principal','Subscription Date','Status']);
    } else if (key === 'Redemption & Exit Analytics') {
      const exited = clientInvestments.filter(i => i.preTermStatus === 'disbursed' || i.status === 'disbursed');
      downloadCSV(`Redemptions_${today}.csv`,
        exited.length ? exited.map(i => [i.investRef||i.id, i.plan||'—', '₦'+Number(i.amount||0).toLocaleString('en-NG'), i.maturityDate||'—', i.preTermStatus||i.status])
          : [['No exits on record','','','','']],
        ['Reference','Product','Principal','Exit Date','Exit Type']);
    } else if (key === 'Tax Compliance & Credit Ledger') {
      downloadCSV(`Tax_Compliance_${today}.csv`,
        clientInvestments.map(i => {
          const gross = (i.amount||0) * ((i.roi||0)/100);
          const wht   = gross * 0.10;
          return [i.investRef||i.id, i.plan||'—', '₦'+Number(i.amount||0).toLocaleString('en-NG'), (i.roi||'—')+'%', '₦'+gross.toFixed(2), '10%', '₦'+wht.toFixed(2), '₦'+(gross-wht).toFixed(2)];
        }),
        ['Reference','Product','Principal','ROI Rate','Gross Return','WHT Rate','WHT Amount','Net Return']);
    }
  };

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
            {REPORT_TYPES.map(r => <ReportCard key={r.title} {...r} onClick={() => handleDownload(r.title)} />)}
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
          <button className="btn-gold" style={{ fontSize:12 }} onClick={() => {
            downloadCSV(`Full_Portfolio_${today}.csv`,
              clientInvestments.map(i => [i.investRef||i.id, i.plan||'—', i.status, '₦'+Number(i.amount||0).toLocaleString('en-NG'), i.roi ? i.roi+'%' : '—', i.valueDate||'—', i.maturityDate||'—']),
              ['Reference','Product','Status','Principal','ROI','Value Date','Maturity Date']);
          }}><Download size={13}/> Export Full Report</button>
        </div>
      )}

      <style>{`@media(max-width:900px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
