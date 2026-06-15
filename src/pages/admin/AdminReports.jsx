import React, { useState, useMemo } from 'react';
import { Download, FileBarChart, FileText, FileCheck, CreditCard, Eye, X, Filter, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import TabBar from '../../components/ui/TabBar';
import ChartCard from '../../components/charts/ChartCard';
import ModalOverlay from '../../components/ui/ModalOverlay';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const STANDARD_REPORTS = [
  { icon:FileBarChart, title:'Consolidated Portfolio', desc:'Full capital deployment records',    color:'#3b82f6' },
  { icon:FileText,     title:'Subscriptions Ledger',   desc:'All initial investments',            color:'#22c55e' },
  { icon:FileCheck,    title:'Redemption Analytics',   desc:'Full exit cycle documentation',      color:'#f97316' },
  { icon:CreditCard,   title:'Tax Compliance Ledger',  desc:'Tax documentation per client',       color:'#8b5cf6' },
  { icon:FileText,     title:'Client Onboarding',      desc:'All clients & KYC status',           color:'#ec4899' },
  { icon:FileBarChart, title:'Risk Assessment',         desc:'Portfolio risk categorization',      color:'#e8b84b' },
];

/* ── Small pie + legend ── */
function PieLegend({ data, height = 150 }) {
  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'center' }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
            {data.map((d,i) => <Cell key={i} fill={d.color}/>)}
          </Pie>
          <Tooltip formatter={v => fmt(v)}/>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {data.map(d => (
          <div key={d.name} style={{ display:'flex',alignItems:'center',gap:7 }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:d.color,flexShrink:0 }}/>
            <span style={{ fontSize:11,color:'var(--gray-600)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{d.name}</span>
            <span style={{ fontSize:11,fontWeight:700,color:'var(--navy)' }}>₦{(d.value/1e6).toFixed(1)}M</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Product report card ── */
function ProductReportCard({ p, onView, onExport }) {
  return (
    <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden',transition:'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px ${p.color}22`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ height:5,background:p.color }}/>
      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)',marginBottom:3 }}>{p.name}</div>
            <div style={{ fontSize:11,color:p.color,fontWeight:700 }}>{p.roi}</div>
          </div>
          <div style={{ fontSize:10,fontWeight:700,color:p.color,background:`${p.color}15`,padding:'4px 9px',borderRadius:6,letterSpacing:'0.06em' }}>{p.lockIn}</div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
          {[['Investors',p.investorCount],['Active',p.activeCount],['Active AUM',fmt(p.totalInvested)],['Tax Rate',`${p.withholdingTaxRate || p.taxRate || 10}%`]].map(([l,v])=>(
            <div key={l} style={{ background:'var(--gray-50)',borderRadius:8,padding:'9px 11px' }}>
              <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:3 }}>{l}</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={()=>onView(p)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'9px',background:`${p.color}12`,border:`1px solid ${p.color}30`,borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,color:p.color,fontFamily:'Syne,sans-serif' }}>
            <Eye size={12}/> VIEW
          </button>
          <button onClick={()=>onExport(p)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'9px',background:'white',border:'1px solid var(--gray-200)',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--gray-600)',fontFamily:'Syne,sans-serif' }}>
            <Download size={12}/> EXPORT
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product detail modal ── */
function ProductDetailModal({ product, onClose, onExport, clients }) {
  if (!product) return null;
  const getClientName = (clientId) => {
    const c = clients.find(c => c.id === clientId || c.clientId === clientId);
    return c?.name || c?.clientRef || clientId?.slice(0, 8) || '—';
  };
  return (
    <ModalOverlay onClose={onClose} maxWidth={720} scrollable
      headerContent={
        <div>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white' }}>{product.name}</div>
          <div style={{ fontSize:11,color:product.color,marginTop:2 }}>{product.roi} · {product.lockIn}</div>
        </div>
      }
    >
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:14 }}>
        <button onClick={()=>onExport(product)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:`${product.color}22`,border:`1px solid ${product.color}44`,borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:product.color }}>
          <Download size={12}/> Export CSV
        </button>
      </div>
      {product.investments.length === 0 ? (
        <p style={{ color:'var(--gray-400)',textAlign:'center',padding:'40px 0' }}>No investment bookings yet for this product</p>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#f4f6fa' }}>
              {['Client','Amount','Tenor','Value Date','Maturity','ROI','Tax','Status'].map(h=>(
                <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {product.investments.map(i=>(
                <tr key={i.id} style={{ borderTop:'1px solid var(--gray-100)' }}>
                  <td style={{ padding:'11px 14px',fontSize:12,fontWeight:600,color:'var(--navy)' }}>{getClientName(i.clientId)}</td>
                  <td style={{ padding:'11px 14px',fontSize:12,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(i.amount)}</td>
                  <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)' }}>{i.tenor}</td>
                  <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{i.valueDate}</td>
                  <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{i.maturityDate}</td>
                  <td style={{ padding:'11px 14px',fontSize:11,color:'var(--green)',fontWeight:600 }}>{i.roi}%</td>
                  <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)' }}>{i.tax}%</td>
                  <td style={{ padding:'11px 14px' }}><StatusBadge status={i.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModalOverlay>
  );
}

const TABS = [
  { key:'products',  label:'By Product' },
  { key:'all',       label:'All Transactions' },
  { key:'standard',  label:'Standard Reports' },
];

export default function AdminReports() {
  const { plans, clientInvestments, allTransactions, clients } = useAppStore();
  const [viewProduct, setViewProduct] = useState(null);
  const [tab,         setTab]         = useState('products');
  const [txFilter,    setTxFilter]    = useState('all');
  const [txSearch,    setTxSearch]    = useState('');

  const allTx = useMemo(() => {
    const getClientName = (clientId) => {
      const c = clients.find(c => c.id === clientId || c.clientId === clientId);
      return c?.name || c?.clientRef || clientId?.slice(0, 8) || '—';
    };
    const inv = clientInvestments.map(i => ({ id:i.id,date:i.valueDate,client:getClientName(i.clientId),type:'investment',description:`${i.plan} booking`,amount:i.amount,status:'successful',product:i.plan,ref:i.id }));
    return [...inv,...allTransactions.map(t=>({...t,client:t.client||'—',type:t.type||'funding',product:t.plan||'Wallet'}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
  }, [clientInvestments, allTransactions, clients]);

  const filteredTx = useMemo(() => allTx.filter(t => {
    return (txFilter==='all'||t.type===txFilter) && (!txSearch||(t.client||'').toLowerCase().includes(txSearch.toLowerCase())||(t.product||'').toLowerCase().includes(txSearch.toLowerCase()));
  }), [allTx, txFilter, txSearch]);

  const inflowByProduct = plans.map(p => ({ name:p.name.replace('Prodigy ',''),value:clientInvestments.filter(i=>i.status==='active' && i.planId===p.id).reduce((s,i)=>s+i.amount,0),color:p.color })).filter(p=>p.value>0);
  const pieData = [
    { name:'Corporate',  value:clients.filter(c=>c.type==='corporate').reduce((s,c)=>s+(c.balance||0),0),  color:'#3b82f6' },
    { name:'Individual', value:clients.filter(c=>c.type==='individual').reduce((s,c)=>s+(c.balance||0),0), color:'#22c55e' },
    { name:'Joint',      value:clients.filter(c=>c.type==='joint').reduce((s,c)=>s+(c.balance||0),0),      color:'#8b5cf6' },
  ].filter(p=>p.value>0);

  const barData = (() => {
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map(month=>({ month, aum:Math.round(clientInvestments.filter(i=>i.status==='active' && new Date(i.valueDate||'').toLocaleString('en-US',{month:'short'})===month).reduce((s,i)=>s+(i.amount||0),0)/1e6) })).filter(m=>m.aum>0);
  })();

  const totalFunding    = allTransactions.filter(t=>t.type==='wallet_funding').reduce((s,t)=>s+t.amount,0);
  const totalInvestment = clientInvestments.filter(i=>i.status==='active').reduce((s,i)=>s+i.amount,0);

  const productStats = plans.map(p => {
    const invs = clientInvestments.filter(i=>i.planId===p.id);
    const activeInvs = invs.filter(i=>i.status==='active');
    return { ...p, investorCount:[...new Set(activeInvs.map(i=>i.clientId))].length, totalInvested:activeInvs.reduce((s,i)=>s+i.amount,0), activeCount:activeInvs.length, investments:invs };
  }).filter(p=>p.totalInvested>0 || p.investments.some(i=>i.status==='active'));

  const exportProduct = (p) => {
    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB') : '—';
    const rows = p.investments.map(i => {
      const isPending = i.status === 'pending_approval';
      const valueDate = isPending ? '— (pending approval)' : fmtDate(i.valueDate);
      const maturityDate = isPending ? '— (not yet active)' : fmtDate(i.maturityDate);
      return `"${i.client}","${i.plan}",${i.amount},"${i.tenor}","${valueDate}","${maturityDate}","${i.roi}%","${i.tax}%","${i.status}"`;
    }).join('\n');
    const blob = new Blob(['Client,Product,Amount,Tenor,Value Date,Maturity Date,ROI,Tax,Status\n'+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${p.name.replace(/\s/g,'_')}_report.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadAllTx = () => {
    const rows=filteredTx.map(t=>[t.date||'',t.ref||t.id,`"${t.client||''}"`,`"${t.description||''}"`,`"${t.type||''}"`,`"${t.product||''}"`,t.amount,t.status||''].join(',')).join('\n');
    const blob=new Blob(['Date,Ref,Client,Description,Type,Product,Amount,Status\n'+rows],{type:'text/csv'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='all-transactions.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Report Center" subtitle="Reports per product — funding, charges, investment & inflow by product" />

      <TabBar tabs={TABS} active={tab} onChange={setTab} variant="pill" style={{ marginBottom:20 }} />

      {/* ALL TRANSACTIONS */}
      {tab === 'all' && (
        <div style={{ display:'flex',flexDirection:'column',gap:20 }} className="animate-in">
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14 }}>
            {[['Total Funding',fmt(totalFunding),'var(--green)'],['Total Investment',fmt(totalInvestment),'var(--navy)'],['Total Records',allTx.length,'#8b5cf6']].map(([l,v,c])=>(
              <div key={l} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:c,marginBottom:4 }}>{v}</div>
                <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
          {inflowByProduct.length > 0 && (
            <ChartCard title="Inflow by Product"><PieLegend data={inflowByProduct} /></ChartCard>
          )}
          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
            <Filter size={13} color="var(--gray-400)"/>
            <div style={{ position:'relative',flex:'1 1 180px' }}>
              <Search size={12} color="var(--gray-400)" style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
              <input placeholder="Search client or product…" value={txSearch} onChange={e=>setTxSearch(e.target.value)}
                style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:7,padding:'7px 10px 7px 28px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',color:'var(--navy)' }}/>
            </div>
            <select value={txFilter} onChange={e=>setTxFilter(e.target.value)} style={{ border:'1px solid var(--gray-200)',borderRadius:7,padding:'7px 10px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',background:'white',color:'var(--navy)',cursor:'pointer' }}>
              <option value="all">All Types</option>
              <option value="investment">Investment</option>
              <option value="wallet_funding">Funding</option>
              <option value="redemption">Redemption</option>
            </select>
            <button onClick={downloadAllTx} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
              <Download size={12}/> Export CSV
            </button>
            <span style={{ fontSize:11,color:'var(--gray-400)',fontWeight:600,marginLeft:'auto' }}>{filteredTx.length} records</span>
          </div>
          <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#f4f6fa' }}>
                  {['Date','Ref','Client','Description','Type','Product','Amount','Status'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:9,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredTx.length === 0 && <tr><td colSpan={8} style={{ padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No transactions found</td></tr>}
                  {filteredTx.slice(0,100).map((t,i)=>{
                    const isIn = t.type==='wallet_funding'||t.type==='redemption';
                    const tc   = t.type==='investment'?'var(--navy)':t.type==='wallet_funding'?'var(--green)':t.type==='redemption'?'#3b82f6':'var(--red)';
                    return (
                      <tr key={t.id||i} style={{ borderTop:'1px solid var(--gray-100)',background:i%2===0?'#fafafa':'white' }}>
                        <td style={{ padding:'10px 14px',fontSize:11,color:'var(--gray-500)',whiteSpace:'nowrap' }}>{t.date||'—'}</td>
                        <td style={{ padding:'10px 14px',fontSize:10,color:'var(--gray-400)',fontFamily:'monospace' }}>{(t.ref||t.id||'').slice(0,14)}</td>
                        <td style={{ padding:'10px 14px',fontSize:12,fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{t.client||'—'}</td>
                        <td style={{ padding:'10px 14px',fontSize:11,color:'var(--gray-600)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.description||'—'}</td>
                        <td style={{ padding:'10px 14px' }}><span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:tc,background:`${tc}15`,padding:'2px 7px',borderRadius:4 }}>{(t.type||'').replace('_',' ')}</span></td>
                        <td style={{ padding:'10px 14px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.product||'—'}</td>
                        <td style={{ padding:'10px 14px',fontSize:12,fontWeight:700,color:isIn?'var(--green)':'var(--navy)',whiteSpace:'nowrap' }}>{isIn?'+':''}{fmt(t.amount)}</td>
                        <td style={{ padding:'10px 14px' }}><StatusBadge status={t.status}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === 'products' && (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:22,marginBottom:22 }}>
            <ChartCard title="AUM by Client Type" className="animate-in delay-1"><PieLegend data={pieData} /></ChartCard>
            <ChartCard title="AUM Growth (₦M)" className="animate-in delay-2">
              {barData.length === 0 ? (
                <div style={{ textAlign:'center',padding:'40px 0',color:'var(--gray-400)',fontSize:13 }}>No active investments yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={barData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis tick={{ fontSize:11 }} tickFormatter={v=>`₦${v}M`}/>
                    <Tooltip formatter={v=>`₦${v}M`}/>
                    <Bar dataKey="aum" fill="var(--navy)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:16 }}>Reports by Investment Product</h3>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16 }} className="animate-in delay-3">
            {productStats.map(p => <ProductReportCard key={p.id} p={p} onView={setViewProduct} onExport={exportProduct} />)}
          </div>
        </div>
      )}

      {/* STANDARD REPORTS */}
      {tab === 'standard' && (
        <div style={{ background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid var(--gray-200)' }} className="animate-in">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:16 }}>Standard Reports</h3>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12 }}>
            {STANDARD_REPORTS.map(r => (
              <div key={r.title} onClick={downloadAllTx} style={{ border:'1px solid var(--gray-200)',borderRadius:10,padding:'14px',cursor:'pointer',transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=r.color;e.currentTarget.style.background=`${r.color}06`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--gray-200)';e.currentTarget.style.background='transparent';}}
              >
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9 }}>
                  <r.icon size={16} color={r.color}/><Download size={12} color="var(--gray-400)"/>
                </div>
                <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)',marginBottom:3,lineHeight:1.4 }}>{r.title}</div>
                <div style={{ fontSize:10,color:'var(--gray-400)',lineHeight:1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProductDetailModal product={viewProduct} onClose={() => setViewProduct(null)} onExport={exportProduct} clients={clients} />
      <style>{`@media(max-width:700px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
