import React, { useMemo, useState, useCallback } from 'react';
import { Download, FileText, FileBarChart, FileCheck, CreditCard, FileType, Eye } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import ReportCard from '../../components/ui/ReportCard';
import PortfolioAttributionChart from '../../components/ui/PortfolioAttributionChart';
import { csvCell } from '../../utils/csv';

const CHART_COLORS = ['#e8b84b','#3b6ef8','#22c55e','#8b5cf6','#f97316','#ec4899','#10b981'];

const REPORT_TYPES = [
  { key: 'investment_summary', icon: FileBarChart, title: 'Consolidated Portfolio Summary', desc: 'Complete portfolio capital deployment records', color: '#3b6ef8' },
  { key: 'transaction_ledger', icon: FileText, title: 'Transaction Ledger', desc: 'Complete transaction history with filters', color: '#22c55e' },
  { key: 'client_portfolio', icon: FileBarChart, title: 'Client Portfolio', desc: 'Client investment portfolio with current valuations', color: '#f97316' },
  { key: 'dividend_report', icon: FileCheck, title: 'Dividend Report', desc: 'Dividend declarations and payouts', color: '#8b5cf6' },
  { key: 'maturity_schedule', icon: FileBarChart, title: 'Maturity Schedule', desc: 'Upcoming and past investment maturities', color: '#ec4899' },
  { key: 'withholding_tax', icon: CreditCard, title: 'Withholding Tax Report', desc: 'Withholding tax collected on investment income', color: '#e8b84b' },
];

const downloadCSV = (filename, rows, headers) => {
  const lines  = [headers.map(csvCell).join(','), ...rows.map(r => r.map(csvCell).join(','))];
  const blob   = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

export default function CorporateReports() {
  const { clientInvestments, user, api } = useAppStore();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fetchReport = useCallback(async (type, format = 'json') => {
    if (!type) return;
    setLoading(true);
    setReportType(type);
    try {
      const params = new URLSearchParams({ type });
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      const endpoint = format === 'pdf' ? `admin/reports/generate/pdf?${params}` : `admin/reports/generate?${params}`;
      const res = await api.get(endpoint);
      if (format === 'pdf') {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Report generation failed:', err);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [api, dateFrom, dateTo]);

  const handlePreview = (type) => fetchReport(type, 'json');
  const handlePdfDownload = (type) => fetchReport(type, 'pdf');

  const clearReport = () => { setReportData(null); setReportType(''); };

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
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
            <label style={{ fontSize:10,color:'var(--gray-500)',fontWeight:600 }}>From</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              style={{ border:'1px solid var(--gray-200)',borderRadius:7,padding:'7px 10px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',color:'var(--navy)' }}/>
            <label style={{ fontSize:10,color:'var(--gray-500)',fontWeight:600,marginLeft:16 }}>To</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              style={{ border:'1px solid var(--gray-200)',borderRadius:7,padding:'7px 10px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',color:'var(--navy)' }}/>
          </div>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
            <FileText size={13}/> Standard Global Corporate Reports
          </h3>
          <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:20 }}>Certified Administrative Documentation Vault</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {REPORT_TYPES.map(r => <ReportCard key={r.key} {...r} onPreview={handlePreview} onPdfDownload={handlePdfDownload} loading={loading} />)}
          </div>
          {reportData && (
            <div style={{ background:'var(--gray-50)',borderRadius:10,padding:'16px',marginTop:16,border:'1px solid var(--gray-200)' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)' }}>Report Preview: {reportData.title}</div>
                  <div style={{ fontSize:10,color:'var(--gray-400)',marginTop:2 }}>{reportData.description}</div>
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <button onClick={() => handlePdfDownload(reportType)} disabled={loading} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor: loading ? 'not-allowed' : 'pointer',fontSize:10,fontWeight:700,opacity: loading ? 0.7 : 1 }}>
                    <FileType size={11}/> Download PDF
                  </button>
                </div>
              </div>
              <div style={{ background:'white',borderRadius:8,border:'1px solid var(--gray-200)',overflow:'hidden',maxHeight:300,overflowY:'auto' }}>
                <pre style={{ padding:'12px',fontSize:9,fontFamily:'monospace',color:'var(--navy)',overflowX:'auto',whiteSpace:'pre-wrap' }}>
                  {JSON.stringify(reportData.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
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
