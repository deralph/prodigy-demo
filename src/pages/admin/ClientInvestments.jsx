import React, { useState } from 'react';
import { ArrowLeft, Download, Users } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

/* ── Client list item ── */
function ClientListItem({ client: c, investCount, activeAUM, onClick, isLast }) {
  return (
    <div
      style={{ padding:'14px 20px',borderBottom:isLast?'none':'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',transition:'background 0.15s' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:36,height:36,borderRadius:'50%',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--gold)',flexShrink:0 }}>
          {(c.name||c.companyName||'?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{c.name||c.companyName}</div>
          <div style={{ fontSize:10,color:'var(--gray-400)' }}>{c.clientId} · {c.accountType}</div>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{investCount} investment{investCount!==1?'s':''}</div>
        {activeAUM > 0 && <div style={{ fontSize:11,color:'var(--green)',fontWeight:600 }}>Active: {fmt(activeAUM)}</div>}
      </div>
    </div>
  );
}

/* ── Investment detail table ── */
function InvestmentDetailTable({ invs, plans, planFilter }) {
  const filtered  = invs.filter(i => planFilter==='all' || i.planId===planFilter);
  const STATUS_COLOR = { active:'var(--green)', matured:'#3b82f6', pre_term:'var(--gold)' };
  const STATUS_BG    = { active:'rgba(34,197,94,0.1)', matured:'rgba(59,130,246,0.1)', pre_term:'rgba(232,184,75,0.12)' };

  const columns = [
    { key:'plan',        label:'Product',    render:(v,row) => { const p=plans.find(pl=>pl.id===row.planId); return <span style={{ fontSize:11,fontWeight:700,color:p?.color||'#64748b',background:`${p?.color||'#ccc'}15`,padding:'3px 8px',borderRadius:4 }}>{v}</span>; } },
    { key:'amount',      label:'Amount',     render:v => <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(v)}</span> },
    { key:'tenor',       label:'Tenor',      style:{ fontSize:11,color:'var(--gray-600)' } },
    { key:'valueDate',   label:'Value Date', style:{ fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' } },
    { key:'maturityDate',label:'Maturity',   style:{ fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' } },
    { key:'roi',         label:'ROI',        render:v => <span style={{ fontSize:11,color:'var(--green)',fontWeight:700 }}>{v}%</span> },
    { key:'tax',         label:'Tax',        style:{ fontSize:11,color:'var(--gray-600)' }, render:v => `${v}%` },
    { key:'status',      label:'Status',     render:v => <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'capitalize',color:STATUS_COLOR[v]||'var(--gray-400)',background:STATUS_BG[v]||'var(--gray-100)',padding:'3px 8px',borderRadius:4 }}>{v.replace('_',' ')}</span> },
  ];

  if (filtered.length === 0) {
    return <EmptyState icon={Users} title="No investments yet" message="This client has not made any investments yet." compact />;
  }
  return <DataTable columns={columns} rows={filtered} emptyMsg="No investments match the filter." />;
}

export default function ClientInvestments() {
  const { clients, clientInvestments, plans } = useAppStore();
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [planFilter,  setPlanFilter]  = useState('all');

  const client  = selected ? clients.find(c => c.clientId === selected) : null;
  const invs    = clientInvestments.filter(i => i.clientId === selected);

  const exportCSV = () => {
    const rows = invs.map(i => `"${i.client}","${i.plan}",${i.amount},"${i.tenor}","${i.valueDate}","${i.maturityDate}","${i.roi}%","${i.status}"`).join('\n');
    const blob = new Blob(['Client,Product,Amount,Tenor,Value Date,Maturity,ROI,Status\n'+rows],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`${(client?.name||client?.companyName||'client').replace(/\s/g,'_')}_investments.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredClients = clients.filter(c => {
    const name = (c.name||c.companyName||'').toLowerCase();
    return search==='' || name.includes(search.toLowerCase()) || c.clientId.toLowerCase().includes(search.toLowerCase());
  });

  const kpiStats = selected ? [
    { label:'Total Investments', val:invs.length,                                                                                color:'var(--navy)' },
    { label:'Active AUM',        val:fmt(invs.filter(i=>i.status==='active').reduce((s,i)=>s+i.amount,0)),                      color:'var(--green)' },
    { label:'Matured',           val:invs.filter(i=>i.status==='matured').length,                                               color:'#3b82f6' },
    { label:'Pre-terminated',    val:invs.filter(i=>i.status==='pre_term').length,                                              color:'var(--gold)' },
  ] : [];

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:4 }} className="animate-in">
        {client && (
          <button onClick={() => { setSelected(null); setPlanFilter('all'); }}
            style={{ background:'var(--gray-100)',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'var(--navy)' }}>
            <ArrowLeft size={13}/> Back
          </button>
        )}
        <PageHeader
          title={client ? (client.name||client.companyName) : 'Client Investments'}
          subtitle={client ? `Full investment history · ${invs.length} records` : 'Select a client to view investment history'}
        />
      </div>

      {!client ? (
        <>
          <SearchFilterBar search={search} onSearch={setSearch} placeholder="Search by name or ID…" style={{ marginBottom:18 }} className="animate-in delay-1" />
          {filteredClients.length === 0 ? (
            <EmptyState icon={Users} title={clients.length===0?'No clients yet':'No matching clients'} message={clients.length===0?'Client accounts will appear here once they complete registration.':'Try adjusting your search.'} compact />
          ) : (
            <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
              {filteredClients.map((c,i) => {
                const count    = clientInvestments.filter(inv=>inv.clientId===c.clientId).length;
                const activeAUM = clientInvestments.filter(inv=>inv.clientId===c.clientId&&inv.status==='active').reduce((s,inv)=>s+inv.amount,0);
                return <ClientListItem key={c.clientId} client={c} investCount={count} activeAUM={activeAUM} onClick={()=>setSelected(c.clientId)} isLast={i===filteredClients.length-1} />;
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
            {kpiStats.map(s => (
              <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:s.color,marginBottom:3 }}>{s.val}</div>
                <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter + export row */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10 }}>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {[{id:'all',name:'All',color:'var(--navy)'},...plans].map(p => (
                <button key={p.id} onClick={() => setPlanFilter(p.id)}
                  style={{ padding:'6px 13px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:planFilter===p.id?(p.color||'var(--navy)'):'white',color:planFilter===p.id?'white':'var(--gray-400)',border:`1px solid ${planFilter===p.id?(p.color||'var(--navy)'):'var(--gray-200)'}` }}>
                  {p.name}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'white',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,color:'#3b82f6',fontFamily:'Syne,sans-serif' }}>
              <Download size={13}/> Export CSV
            </button>
          </div>

          <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
            <InvestmentDetailTable invs={invs} plans={plans} planFilter={planFilter} />
          </div>
        </>
      )}
    </div>
  );
}
