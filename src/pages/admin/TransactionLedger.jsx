import React, { useState, useMemo } from 'react';
import { Download, Search, Layers, Filter, X, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import useAppStore from '../../store/useAppStore';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n||0).toLocaleString('en-NG', { minimumFractionDigits:0 });
const typeColor = { wallet_funding:'#3b82f6', subscription:'#22c55e', redemption:'#f97316', disbursement:'#8b5cf6' };
const typeLabel = { wallet_funding:'Wallet Funding', subscription:'Subscription', redemption:'Redemption', disbursement:'Disbursement' };
const CREDIT_TYPES  = ['wallet_funding','redemption'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TransactionLedger() {
  const { allTransactions, plans } = useAppStore();

  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [clientType,    setClientType]    = useState('all');
  const [direction,     setDirection]     = useState('all');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [amtMin,        setAmtMin]        = useState('');
  const [amtMax,        setAmtMax]        = useState('');
  const [viewMode,      setViewMode]      = useState('all');
  const [showCharts,    setShowCharts]    = useState(true);
  const [showFilters,   setShowFilters]   = useState(false);

  const filtered = useMemo(() => allTransactions.filter(t => {
    if (search && !(`${t.client} ${t.ref} ${t.id}`).toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (productFilter !== 'all' && t.planId !== productFilter) return false;
    if (statusFilter !== 'all' && (t.status||'').toLowerCase() !== statusFilter) return false;
    if (clientType !== 'all' && (t.clientType||'').toLowerCase() !== clientType) return false;
    if (direction !== 'all') {
      const isCr = CREDIT_TYPES.includes(t.type);
      if (direction === 'credit' && !isCr) return false;
      if (direction === 'debit'  &&  isCr) return false;
    }
    if (amtMin && t.amount < Number(amtMin)) return false;
    if (amtMax && t.amount > Number(amtMax)) return false;
    return true;
  }), [allTransactions, search, typeFilter, productFilter, statusFilter, clientType, direction, amtMin, amtMax]);

  const totalInflow  = filtered.filter(t => CREDIT_TYPES.includes(t.type) && (t.status||'').toLowerCase()==='successful').reduce((s,t)=>s+t.amount,0);
  const totalOutflow = filtered.filter(t => !CREDIT_TYPES.includes(t.type) && (t.status||'').toLowerCase()==='successful').reduce((s,t)=>s+t.amount,0);
  const netFlow      = totalInflow - totalOutflow;
  const totalVol     = filtered.reduce((s,t)=>s+t.amount,0);

  const clearFilters = () => { setSearch('');setTypeFilter('all');setProductFilter('all');setStatusFilter('all');setClientType('all');setDirection('all');setDateFrom('');setDateTo('');setAmtMin('');setAmtMax(''); };
  const activeFilterCount = [search,typeFilter!=='all',productFilter!=='all',statusFilter!=='all',clientType!=='all',direction!=='all',dateFrom,dateTo,amtMin,amtMax].filter(Boolean).length;

  const exportCSV = () => {
    const rows = filtered.map((t,i) => {
      const isCr = CREDIT_TYPES.includes(t.type);
      const running = filtered.slice(0,i+1).reduce((s,x) => s + (CREDIT_TYPES.includes(x.type)?x.amount:-x.amount), 0);
      return `"${t.date}","${t.id}","${t.client}","${t.clientType||''}","${typeLabel[t.type]||t.type}","${t.product||''}",${isCr?t.amount:0},${isCr?0:t.amount},${t.amount},"${t.ref}","${t.status}",${running}`;
    }).join('\n');
    const blob = new Blob([`PRODIGY ADMIN — TRANSACTION LEDGER\nExported: ${new Date().toLocaleString()}\n\nDate,ID,Client,Account Type,Transaction Type,Product,Credit,Debit,Amount,Reference,Status,Running Balance\n${rows}`],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`ledger-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const monthlyData = useMemo(() => MONTHS.map(month => {
    const mo = allTransactions.filter(t => (t.date||'').includes(month));
    return {
      month,
      inflow:  mo.filter(t=>CREDIT_TYPES.includes(t.type)&&(t.status||'').toLowerCase()==='successful').reduce((s,t)=>s+t.amount,0),
      outflow: mo.filter(t=>!CREDIT_TYPES.includes(t.type)&&(t.status||'').toLowerCase()==='successful').reduce((s,t)=>s+t.amount,0),
    };
  }), [allTransactions]);

  const productGroups = useMemo(() => plans.map(p => ({
    plan:p, txns:allTransactions.filter(t=>t.planId===p.id),
  })).filter(g=>g.txns.length>0), [plans,allTransactions]);

  const clientTypeGroups = useMemo(() => {
    const types = [...new Set(allTransactions.map(t=>t.clientType||'unknown'))];
    return types.map(ct => ({ type:ct, txns:allTransactions.filter(t=>(t.clientType||'unknown')===ct) }));
  }, [allTransactions]);

  const pieData = clientTypeGroups.map((g,i) => ({
    name: g.type.charAt(0).toUpperCase()+g.type.slice(1),
    value: g.txns.reduce((s,t)=>s+t.amount,0),
    color: ['#3b82f6','#22c55e','#8b5cf6','#f97316'][i]||'#ccc',
  }));

  const COLS = { individual:'#3b82f6', corporate:'#22c55e', joint:'#8b5cf6' };

  let running = 0;
  const rowsWithBalance = filtered.map(t => {
    running += CREDIT_TYPES.includes(t.type) ? t.amount : -t.amount;
    return { ...t, _running:running };
  });

  const SL = { border:'1px solid var(--gray-200)',borderRadius:9,padding:'9px 12px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',background:'white',cursor:'pointer' };

  return (
    <div>
      <div style={{ marginBottom:22 }} className="animate-in">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Transaction Ledger</h1>
            <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Full audit trail across all accounts &amp; products</p>
          </div>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
            <button onClick={()=>setShowCharts(s=>!s)} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:showCharts?'var(--navy)':'white',color:showCharts?'white':'var(--navy)',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:11,fontWeight:700 }}>
              <BarChart2 size={13}/> {showCharts?'Hide Charts':'Charts'}
            </button>
            <button onClick={()=>setViewMode(v=>v==='all'?'by_product':'all')} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:viewMode!=='all'?'var(--navy)':'white',color:viewMode!=='all'?'white':'var(--navy)',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:11,fontWeight:700 }}>
              <Layers size={13}/> {viewMode==='by_product'?'Flat View':'By Product'}
            </button>
            <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:'white',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:11,fontWeight:700,color:'#3b82f6' }}>
              <Download size={13}/> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Total Volume',   val:fmt(totalVol),    color:'var(--navy)',  sub:`${filtered.length} txns` },
          { label:'Total Inflow',   val:fmt(totalInflow), color:'var(--green)', sub:'Credits' },
          { label:'Total Outflow',  val:fmt(totalOutflow),color:'var(--red)',   sub:'Debits' },
          { label:'Net Flow',       val:fmt(netFlow),     color:netFlow>=0?'var(--green)':'var(--red)', sub:netFlow>=0?'Net Credit':'Net Debit' },
          { label:'Pending',        val:allTransactions.filter(t=>(t.status||'').toLowerCase()==='pending').length, color:'var(--gold)', sub:'awaiting' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:12,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:2 }}>{s.label}</div>
            <div style={{ fontSize:10,color:s.color,marginTop:2,fontWeight:600 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {showCharts && (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:22 }} className="animate-in delay-2">
          <div style={{ background:'white',borderRadius:14,padding:'18px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>Monthly Inflow vs Outflow</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis dataKey="month" tick={{ fontSize:10 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:9 }}/>
                <Tooltip formatter={v=>[fmt(v)]}/><Legend wrapperStyle={{ fontSize:10 }}/>
                <Bar dataKey="inflow"  name="Inflow"  fill="#22c55e" radius={[3,3,0,0]}/>
                <Bar dataKey="outflow" name="Outflow" fill="#ef4444" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:'white',borderRadius:14,padding:'18px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>Net Flow Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData.map(m=>({ ...m, net:m.inflow-m.outflow }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis dataKey="month" tick={{ fontSize:10 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:9 }}/>
                <Tooltip formatter={v=>[fmt(v),'Net']}/>
                <Line type="monotone" dataKey="net" name="Net Flow" stroke="var(--navy)" strokeWidth={2.5} dot={{ r:3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:'white',borderRadius:14,padding:'18px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>Volume by Account Type</h3>
            <div style={{ display:'flex',alignItems:'center',gap:16 }}>
              <PieChart width={150} height={150}>
                <Pie data={pieData} cx={75} cy={75} innerRadius={38} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {pieData.map((p,i)=><Cell key={i} fill={p.color}/>)}
                </Pie><Tooltip formatter={v=>[fmt(v)]}/>
              </PieChart>
              <div style={{ flex:1 }}>
                {pieData.map((p,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7 }}>
                    <span style={{ width:9,height:9,borderRadius:2,background:p.color,flexShrink:0 }}/>
                    <span style={{ fontSize:11,flex:1,color:'var(--navy)',fontWeight:600 }}>{p.name}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:p.color }}>{fmt(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background:'white',borderRadius:14,padding:'18px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>Volume by Product</h3>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {productGroups.slice(0,6).map(g=>{
                const vol = g.txns.reduce((s,t)=>s+t.amount,0);
                const max = productGroups.reduce((s,x)=>Math.max(s,x.txns.reduce((a,t)=>a+t.amount,0)),0);
                return (
                  <div key={g.plan.id}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                      <span style={{ fontSize:11,fontWeight:600,color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'60%' }}>{g.plan.name}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:g.plan.color }}>{fmt(vol)}</span>
                    </div>
                    <div style={{ height:5,background:'var(--gray-100)',borderRadius:3 }}>
                      <div style={{ height:'100%',width:`${max?((vol/max)*100).toFixed(1):0}%`,background:g.plan.color,borderRadius:3 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'14px 18px',marginBottom:18 }} className="animate-in delay-2">
        <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:showFilters?14:0 }}>
          <div style={{ position:'relative',flex:'1 1 200px' }}>
            <Search size={13} color="var(--gray-400)" style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
            <input placeholder="Search client, ref, ID…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...SL, paddingLeft:30, width:'100%', border:`1px solid ${search?'var(--navy)':'var(--gray-200)'}` }}/>
          </div>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={SL}>
            <option value="all">All Types</option>
            <option value="wallet_funding">Wallet Funding</option>
            <option value="subscription">Subscription</option>
            <option value="redemption">Redemption</option>
            <option value="disbursement">Disbursement</option>
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={SL}>
            <option value="all">All Statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={()=>setShowFilters(s=>!s)} style={{ ...SL, display:'flex',alignItems:'center',gap:5,fontWeight:700,color:showFilters?'var(--navy)':'var(--gray-400)',position:'relative' }}>
            <Filter size={12}/> More Filters
            {activeFilterCount>0&&<span style={{ background:'var(--red)',color:'white',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:10,position:'absolute',top:-6,right:-6 }}>{activeFilterCount}</span>}
          </button>
          {activeFilterCount>0 && <button onClick={clearFilters} style={{ display:'flex',alignItems:'center',gap:4,padding:'9px 12px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:9,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--red)' }}><X size={11}/> Clear</button>}
        </div>
        {showFilters && (
          <div style={{ display:'flex',gap:10,flexWrap:'wrap',paddingTop:14,borderTop:'1px solid var(--gray-100)' }}>
            <select value={productFilter} onChange={e=>setProductFilter(e.target.value)} style={SL}>
              <option value="all">All Products</option>
              {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={clientType} onChange={e=>setClientType(e.target.value)} style={SL}>
              <option value="all">All Account Types</option>
              <option value="individual">Individual</option>
              <option value="corporate">Corporate</option>
              <option value="joint">Joint</option>
            </select>
            <select value={direction} onChange={e=>setDirection(e.target.value)} style={SL}>
              <option value="all">All Directions</option>
              <option value="credit">Credit (Inflow)</option>
              <option value="debit">Debit (Outflow)</option>
            </select>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ ...SL, color:dateFrom?'var(--navy)':'var(--gray-400)' }} title="From date"/>
            <input type="date" value={dateTo}   onChange={e=>setDateTo(e.target.value)}   style={{ ...SL, color:dateTo?'var(--navy)':'var(--gray-400)' }} title="To date"/>
            <input type="number" placeholder="Min ₦" value={amtMin} onChange={e=>setAmtMin(e.target.value)} style={{ ...SL, width:110 }}/>
            <input type="number" placeholder="Max ₦" value={amtMax} onChange={e=>setAmtMax(e.target.value)} style={{ ...SL, width:110 }}/>
          </div>
        )}
      </div>

      {/* Ledger table / grouped view */}
      {viewMode === 'by_product' ? (
        <div style={{ display:'flex',flexDirection:'column',gap:18 }} className="animate-in delay-3">
          {productGroups.map(g=>(
            <div key={g.plan.id} style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              <div style={{ padding:'14px 20px',background:`${g.plan.color}10`,borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                <span style={{ width:10,height:10,borderRadius:'50%',background:g.plan.color,flexShrink:0 }}/>
                <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'var(--navy)' }}>{g.plan.name}</span>
                <span style={{ fontSize:11,color:'var(--gray-400)' }}>{g.txns.length} txns</span>
                <span style={{ marginLeft:'auto',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:g.plan.color }}>{fmt(g.txns.reduce((s,t)=>s+(t.status==='successful'?t.amount:0),0))}</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'#f8fafc' }}>
                    {['Date','Client','Account Type','Type','Amount','Dir','Ref','Status'].map(h=>(
                      <th key={h} style={{ padding:'9px 16px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {g.txns.map(t=>{
                      const isCr = CREDIT_TYPES.includes(t.type);
                      return (
                        <tr key={t.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'10px 16px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.date}</td>
                          <td style={{ padding:'10px 16px' }}><div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{t.client}</div></td>
                          <td style={{ padding:'10px 16px' }}><span style={{ fontSize:9,fontWeight:700,color:COLS[t.clientType]||'#64748b',background:`${COLS[t.clientType]||'#ccc'}18`,padding:'2px 7px',borderRadius:4,textTransform:'uppercase' }}>{t.clientType}</span></td>
                          <td style={{ padding:'10px 16px' }}><span style={{ fontSize:9,fontWeight:700,color:typeColor[t.type]||'#64748b',background:`${typeColor[t.type]||'#ccc'}18`,padding:'2px 7px',borderRadius:4,textTransform:'uppercase',whiteSpace:'nowrap' }}>{typeLabel[t.type]||t.type}</span></td>
                          <td style={{ padding:'10px 16px',fontSize:12,fontWeight:700,color:isCr?'var(--green)':'var(--red)',whiteSpace:'nowrap' }}>{isCr?'+':'-'}{fmt(t.amount)}</td>
                          <td style={{ padding:'10px 16px' }}>{isCr ? <TrendingUp size={13} color="var(--green)"/> : <TrendingDown size={13} color="var(--red)"/>}</td>
                          <td style={{ padding:'10px 16px',fontSize:10,fontFamily:'monospace',color:'var(--gray-400)',whiteSpace:'nowrap' }}>{t.ref}</td>
                          <td style={{ padding:'10px 16px' }}><StatusBadge status={t.status}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f4f6fa' }}>
                  {['Date','ID','Client','Acct Type','Product','Type','Credit','Debit','Ref','Status','Running Bal'].map(h=>(
                    <th key={h} style={{ padding:'11px 14px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsWithBalance.map(t => {
                  const isCr = CREDIT_TYPES.includes(t.type);
                  return (
                    <tr key={t.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.date}</td>
                      <td style={{ padding:'11px 14px',fontSize:10,fontFamily:'monospace',color:'var(--navy)',whiteSpace:'nowrap' }}>{t.id}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{t.client}</div>
                      </td>
                      <td style={{ padding:'11px 14px' }}><span style={{ fontSize:9,fontWeight:700,color:COLS[t.clientType]||'#64748b',background:`${COLS[t.clientType]||'#ccc'}18`,padding:'2px 7px',borderRadius:4,textTransform:'uppercase',whiteSpace:'nowrap' }}>{t.clientType||'—'}</span></td>
                      <td style={{ padding:'11px 14px' }}>
                        {t.planId ? <span style={{ fontSize:10,fontWeight:700,color:plans.find(p=>p.id===t.planId)?.color||'#64748b',background:`${plans.find(p=>p.id===t.planId)?.color||'#ccc'}15`,padding:'3px 7px',borderRadius:4,whiteSpace:'nowrap' }}>{t.product}</span>
                        : <span style={{ fontSize:10,color:'var(--gray-400)' }}>—</span>}
                      </td>
                      <td style={{ padding:'11px 14px' }}><span style={{ fontSize:9,fontWeight:700,color:typeColor[t.type]||'#64748b',background:`${typeColor[t.type]||'#ccc'}18`,padding:'3px 7px',borderRadius:4,textTransform:'uppercase',whiteSpace:'nowrap' }}>{typeLabel[t.type]||t.type}</span></td>
                      <td style={{ padding:'11px 14px',fontSize:12,fontWeight:700,color:'var(--green)',whiteSpace:'nowrap' }}>{isCr ? fmt(t.amount) : '—'}</td>
                      <td style={{ padding:'11px 14px',fontSize:12,fontWeight:700,color:'var(--red)',whiteSpace:'nowrap'   }}>{!isCr ? fmt(t.amount) : '—'}</td>
                      <td style={{ padding:'11px 14px',fontSize:10,fontFamily:'monospace',color:'var(--gray-400)',whiteSpace:'nowrap' }}>{t.ref}</td>
                      <td style={{ padding:'11px 14px' }}><StatusBadge status={t.status}/></td>
                      <td style={{ padding:'11px 14px',fontSize:12,fontWeight:700,color:t._running>=0?'var(--navy)':'var(--red)',whiteSpace:'nowrap',fontFamily:'Syne,sans-serif' }}>{fmt(t._running)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'12px 18px',borderTop:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
            <span style={{ fontSize:11,color:'var(--gray-400)' }}>{filtered.length} records · Inflow: <strong style={{ color:'var(--green)' }}>{fmt(totalInflow)}</strong> · Outflow: <strong style={{ color:'var(--red)' }}>{fmt(totalOutflow)}</strong></span>
            <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>Net Flow: {fmt(netFlow)}</span>
          </div>
        </div>
      )}
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
