import React, { useState, useMemo } from 'react';
import {
  Download, Search, Filter, ChevronDown, ArrowDownLeft, ArrowUpRight,
  FileText, RefreshCcw, TrendingUp, TrendingDown, DollarSign, Layers,
  Calendar, X, PrinterIcon, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import useAppStore from '../../store/useAppStore';

const fmt  = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 });
const fmtK = n => { const v = Number(n||0); if (v >= 1e9) return '₦'+(v/1e9).toFixed(2)+'B'; if (v>=1e6) return '₦'+(v/1e6).toFixed(2)+'M'; if (v>=1e3) return '₦'+(v/1e3).toFixed(1)+'K'; return fmt(v); };

const TYPE_META = {
  wallet_funding: { label:'Wallet Funding',  color:'#22c55e', dir:'credit', icon:ArrowDownLeft },
  subscription:   { label:'Subscription',    color:'#3b82f6', dir:'debit',  icon:ArrowUpRight },
  redemption:     { label:'Redemption',      color:'#f97316', dir:'credit', icon:ArrowDownLeft },
  disbursement:   { label:'Disbursement',    color:'#8b5cf6', dir:'credit', icon:ArrowDownLeft },
  withdrawal:     { label:'Withdrawal',      color:'#ef4444', dir:'debit',  icon:ArrowUpRight },
  interest:       { label:'Interest Credit', color:'#eab308', dir:'credit', icon:TrendingUp },
};

const STATUS_META = {
  successful: { color:'#22c55e', bg:'rgba(34,197,94,0.1)',  label:'Successful' },
  pending:    { color:'#eab308', bg:'rgba(234,179,8,0.1)',  label:'Pending' },
  failed:     { color:'#ef4444', bg:'rgba(239,68,68,0.1)',  label:'Failed' },
};

function buildMonthlyChart(txns) {
  const months = {};
  txns.forEach(t => {
    const d = new Date(t.date || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'});
    if (!months[key]) months[key] = { key, label, inflow:0, outflow:0 };
    const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
    if (meta.dir === 'credit') months[key].inflow += (t.amount||0);
    else months[key].outflow += (t.amount||0);
  });
  return Object.values(months).sort((a,b)=>a.key.localeCompare(b.key)).slice(-12);
}

function buildProductBreakdown(txns, plans) {
  const map = {};
  txns.forEach(t => {
    if (!t.planId) return;
    const plan = plans.find(p => p.id === t.planId);
    const name = plan?.name || t.product || t.planId;
    if (!map[t.planId]) map[t.planId] = { name, color: plan?.color||'#3b82f6', total:0, count:0 };
    if (t.status === 'successful') map[t.planId].total += (t.amount||0);
    map[t.planId].count++;
  });
  return Object.values(map).sort((a,b)=>b.total-a.total);
}

export default function Ledger() {
  const { user, walletBalance, transactions, allTransactions, plans, clientInvestments } = useAppStore();

  /* Gather all transactions for this user */
  const myTxns = useMemo(() => {
    const wallet = transactions.map(t => ({ ...t, _src:'wallet' }));
    const invest = allTransactions.filter(t =>
      t.client === user?.name || t.clientId === user?.clientId
    ).map(t => ({ ...t, _src:'investment' }));
    return [...wallet, ...invest].sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
  }, [transactions, allTransactions, user]);

  /* Filters */
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter,setProductFilter]= useState('all');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [amtMin,       setAmtMin]       = useState('');
  const [amtMax,       setAmtMax]       = useState('');
  const [dirFilter,    setDirFilter]    = useState('all'); // all/credit/debit
  const [viewMode,     setViewMode]     = useState('list'); // list/chart/product
  const [showFilters,  setShowFilters]  = useState(false);

  const filtered = useMemo(() => myTxns.filter(t => {
    const meta   = TYPE_META[t.type] || TYPE_META.wallet_funding;
    const txt    = `${t.ref||''} ${t.client||''} ${t.product||''} ${t.description||''}`.toLowerCase();
    const ms     = !search || txt.includes(search.toLowerCase());
    const mt     = typeFilter === 'all'    || t.type === typeFilter;
    const mst    = statusFilter === 'all'  || t.status === statusFilter;
    const mprod  = productFilter === 'all' || t.planId === productFilter;
    const mdir   = dirFilter === 'all'     || meta.dir === dirFilter;
    const mFrom  = !dateFrom || new Date(t.date) >= new Date(dateFrom);
    const mTo    = !dateTo   || new Date(t.date) <= new Date(dateTo);
    const mAmin  = !amtMin   || (t.amount||0) >= Number(amtMin);
    const mAmax  = !amtMax   || (t.amount||0) <= Number(amtMax);
    return ms && mt && mst && mprod && mdir && mFrom && mTo && mAmin && mAmax;
  }), [myTxns, search, typeFilter, statusFilter, productFilter, dirFilter, dateFrom, dateTo, amtMin, amtMax]);

  /* Summary stats */
  const totalCredit  = filtered.filter(t => (TYPE_META[t.type]||TYPE_META.wallet_funding).dir==='credit' && t.status==='successful').reduce((s,t)=>s+(t.amount||0),0);
  const totalDebit   = filtered.filter(t => (TYPE_META[t.type]||TYPE_META.wallet_funding).dir==='debit'  && t.status==='successful').reduce((s,t)=>s+(t.amount||0),0);
  const pending      = filtered.filter(t => t.status==='pending').reduce((s,t)=>s+(t.amount||0),0);
  const netFlow      = totalCredit - totalDebit;

  const chartData    = useMemo(()=>buildMonthlyChart(myTxns), [myTxns]);
  const productBreak = useMemo(()=>buildProductBreakdown(myTxns, plans), [myTxns, plans]);
  const uniquePlans  = [...new Set(myTxns.filter(t=>t.planId).map(t=>t.planId))];

  /* Running balance */
  const withBalance = useMemo(() => {
    let bal = walletBalance || 0;
    return [...filtered].reverse().map(t => {
      const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
      if (t.status === 'successful') {
        if (meta.dir === 'credit') bal += (t.amount||0);
        else bal -= (t.amount||0);
      }
      return { ...t, _runBalance: bal };
    }).reverse();
  }, [filtered, walletBalance]);

  /* Download CSV */
  const downloadCSV = () => {
    const headers = ['Date','Reference','Type','Direction','Product','Amount (₦)','Status','Running Balance'];
    const rows = withBalance.map(t => {
      const meta = TYPE_META[t.type]||TYPE_META.wallet_funding;
      return [
        t.date||'', t.ref||t.id||'', meta.label, meta.dir.toUpperCase(),
        t.product||t.planId||'',
        t.amount||0, t.status||'',
        t._runBalance||0
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`ledger-${user?.name?.replace(/\s/g,'-')||'account'}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setProductFilter('all');
    setDirFilter('all'); setDateFrom(''); setDateTo(''); setAmtMin(''); setAmtMax('');
  };

  const activeFilterCount = [typeFilter!=='all',statusFilter!=='all',productFilter!=='all',dirFilter!=='all',dateFrom,dateTo,amtMin,amtMax].filter(Boolean).length;

  const iStyle = { border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#1e293b', background:'white', outline:'none' };
  const selStyle = { ...iStyle, cursor:'pointer' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:22 }} className="animate-in">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(18px,3vw,24px)', color:'var(--navy)', letterSpacing:'0.02em', textTransform:'uppercase' }}>
              Account Ledger
            </h1>
            <p style={{ fontSize:11, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:3 }}>
              {filtered.length} transactions · Full inflow/outflow history
            </p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['list','chart','product'].map(m => (
              <button key={m} onClick={()=>setViewMode(m)} style={{ padding:'8px 14px', borderRadius:8, border:`1.5px solid ${viewMode===m?'var(--navy)':'#e2e8f0'}`, background:viewMode===m?'var(--navy)':'white', color:viewMode===m?'white':'var(--navy)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif', letterSpacing:'0.05em', textTransform:'capitalize' }}>
                {m === 'list' ? '≡ Ledger' : m === 'chart' ? '↗ Charts' : '⊞ Products'}
              </button>
            ))}
            <button onClick={downloadCSV} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, color:'#3b82f6' }}>
              <Download size={13}/> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:20 }} className="animate-in delay-1">
        {[
          { label:'Total Inflow',    val:fmtK(totalCredit), color:'var(--green)',  icon:ArrowDownLeft },
          { label:'Total Outflow',   val:fmtK(totalDebit),  color:'var(--red)',    icon:ArrowUpRight },
          { label:'Net Flow',        val:fmtK(netFlow),     color:netFlow>=0?'var(--green)':'var(--red)', icon:TrendingUp },
          { label:'Pending',         val:fmtK(pending),     color:'#eab308',       icon:RefreshCcw },
          { label:'Wallet Balance',  val:fmtK(walletBalance||0), color:'var(--navy)', icon:DollarSign },
          { label:'Total Entries',   val:filtered.length,   color:'#8b5cf6',       icon:Layers },
        ].map(s => (
          <div key={s.label} style={{ background:'white', borderRadius:12, border:'1px solid var(--gray-200)', padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>{s.label}</div>
              <s.icon size={13} color={s.color}/>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div style={{ background:'white', borderRadius:12, border:'1px solid var(--gray-200)', padding:'14px 18px', marginBottom:16 }} className="animate-in delay-1">
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1', minWidth:200 }}>
            <Search size={13} color="var(--gray-400)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <input placeholder="Search by ref, client, product…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...iStyle, paddingLeft:32, width:'100%' }}/>
          </div>
          <select value={dirFilter} onChange={e=>setDirFilter(e.target.value)} style={selStyle}>
            <option value="all">All Directions</option>
            <option value="credit">Credit (Inflow)</option>
            <option value="debit">Debit (Outflow)</option>
          </select>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={selStyle}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={selStyle}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          {uniquePlans.length > 0 && (
            <select value={productFilter} onChange={e=>setProductFilter(e.target.value)} style={selStyle}>
              <option value="all">All Products</option>
              {uniquePlans.map(pid => {
                const p = plans.find(pl=>pl.id===pid);
                return <option key={pid} value={pid}>{p?.name||pid}</option>;
              })}
            </select>
          )}
          <button onClick={()=>setShowFilters(f=>!f)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 13px', background:showFilters||activeFilterCount>0?'var(--navy)':'white', color:showFilters||activeFilterCount>0?'white':'var(--navy)', border:'1.5px solid var(--navy)', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700 }}>
            <Filter size={12}/> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 11px', background:'rgba(239,68,68,0.1)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700 }}>
              <X size={11}/> Clear
            </button>
          )}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginTop:14, paddingTop:14, borderTop:'1px solid var(--gray-100)' }}>
            <div>
              <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>From Date</div>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={iStyle}/>
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>To Date</div>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={iStyle}/>
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>Min Amount (₦)</div>
              <input type="number" placeholder="0" value={amtMin} onChange={e=>setAmtMin(e.target.value)} style={iStyle}/>
            </div>
            <div>
              <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>Max Amount (₦)</div>
              <input type="number" placeholder="No limit" value={amtMax} onChange={e=>setAmtMax(e.target.value)} style={iStyle}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Charts view ── */}
      {viewMode === 'chart' && (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }} className="animate-in">
          <div style={{ background:'white', borderRadius:14, border:'1px solid var(--gray-200)', padding:'20px 22px' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Monthly Inflow vs Outflow</h3>
            <p style={{ fontSize:11, color:'var(--gray-400)', marginBottom:16 }}>12-month trend of all credits and debits</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis dataKey="label" tick={{ fontSize:11 }}/>
                <YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                <Tooltip formatter={(v,n)=>[fmt(v), n]}/>
                <Legend/>
                <Bar dataKey="inflow"  name="Inflow"  fill="#22c55e" radius={[4,4,0,0]}/>
                <Bar dataKey="outflow" name="Outflow" fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:'white', borderRadius:14, border:'1px solid var(--gray-200)', padding:'20px 22px' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Net Flow Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData.map(d=>({...d, net: d.inflow - d.outflow}))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis dataKey="label" tick={{ fontSize:11 }}/>
                <YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                <Tooltip formatter={(v)=>[fmt(v),'Net Flow']}/>
                <Area type="monotone" dataKey="net" name="Net Flow" stroke="var(--navy)" fill="rgba(13,27,53,0.07)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Product breakdown view ── */}
      {viewMode === 'product' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }} className="animate-in">
          <div style={{ background:'white', borderRadius:14, border:'1px solid var(--gray-200)', padding:'20px 22px' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Volume by Product</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productBreak} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis type="number" tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={120}/>
                <Tooltip formatter={(v)=>[fmt(v),'Volume']}/>
                <Bar dataKey="total" name="Volume" radius={[0,4,4,0]}>
                  {productBreak.map((p,i)=>( <React.Fragment key={i}></ React.Fragment> ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {productBreak.map((p, i) => {
            const ptxns = filtered.filter(t=>t.planId===plans.find(pl=>pl.name===p.name)?.id);
            return (
              <div key={i} style={{ background:'white', borderRadius:12, border:`1px solid ${p.color}25`, overflow:'hidden' }}>
                <div style={{ padding:'12px 18px', background:`${p.color}10`, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${p.color}20` }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:'var(--navy)' }}>{p.name}</div>
                  <div style={{ display:'flex', gap:14 }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Total Volume</div>
                      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:p.color }}>{fmt(p.total)}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Transactions</div>
                      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'var(--navy)' }}>{p.count}</div>
                    </div>
                  </div>
                </div>
                {ptxns.slice(0,5).map((t,j) => {
                  const meta = TYPE_META[t.type]||TYPE_META.wallet_funding;
                  const st   = STATUS_META[t.status]||STATUS_META.pending;
                  return (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:j<ptxns.length-1&&j<4?'1px solid var(--gray-100)':'none' }}>
                      <div style={{ width:28, height:28, borderRadius:7, background:`${meta.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <meta.icon size={13} color={meta.color}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--navy)' }}>{meta.label}</div>
                        <div style={{ fontSize:10, color:'var(--gray-400)' }}>{t.date||'—'} · {t.ref||t.id||'—'}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:meta.dir==='credit'?'var(--green)':'var(--red)' }}>
                          {meta.dir==='credit'?'+':'-'}{fmt(t.amount)}
                        </div>
                        <span style={{ fontSize:9, fontWeight:700, color:st.color, background:st.bg, padding:'1px 6px', borderRadius:3 }}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Ledger list view ── */}
      {viewMode === 'list' && (
        <div style={{ background:'white', borderRadius:14, border:'1px solid var(--gray-200)', overflow:'hidden' }} className="animate-in delay-2">
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 100px 80px 120px 120px', gap:8, padding:'10px 20px', background:'var(--gray-50)', borderBottom:'1px solid var(--gray-100)' }}>
            {['Transaction','Type','Direction','Status','Amount','Running Balance'].map(h=>(
              <div key={h} style={{ fontSize:9, color:'var(--gray-400)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding:'48px', textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>
              No transactions match the current filters.
            </div>
          )}

          {withBalance.map((t, i) => {
            const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
            const st   = STATUS_META[t.status] || STATUS_META.pending;
            const plan = plans.find(p=>p.id===t.planId);
            return (
              <div key={t.id||i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 100px 80px 120px 120px', gap:8, padding:'12px 20px', borderBottom:i<withBalance.length-1?'1px solid var(--gray-50)':'none', transition:'background 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                {/* Transaction info */}
                <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${meta.color}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <meta.icon size={14} color={meta.color}/>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.description || meta.label}
                    </div>
                    <div style={{ fontSize:10, color:'var(--gray-400)' }}>
                      {t.ref||t.id||'—'} · {t.date||'—'}
                      {plan && <span style={{ marginLeft:6, color:plan.color, fontWeight:600 }}>· {plan.name}</span>}
                    </div>
                  </div>
                </div>
                {/* Type */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:10, fontWeight:700, color:meta.color, background:`${meta.color}12`, padding:'2px 8px', borderRadius:4, whiteSpace:'nowrap' }}>
                    {meta.label}
                  </span>
                </div>
                {/* Direction */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:10, fontWeight:700, color:meta.dir==='credit'?'var(--green)':'var(--red)', textTransform:'uppercase' }}>
                    {meta.dir === 'credit' ? '↓ CREDIT' : '↑ DEBIT'}
                  </span>
                </div>
                {/* Status */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:st.color, background:st.bg, padding:'2px 7px', borderRadius:4 }}>
                    {st.label}
                  </span>
                </div>
                {/* Amount */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
                  <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:meta.dir==='credit'?'var(--green)':'var(--red)' }}>
                    {meta.dir==='credit'?'+':'-'}{fmt(t.amount)}
                  </span>
                </div>
                {/* Running balance */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
                  <span style={{ fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:12, color:'var(--navy)' }}>
                    {fmt(t._runBalance||0)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Footer */}
          {filtered.length > 0 && (
            <div style={{ padding:'12px 20px', background:'var(--gray-50)', borderTop:'1px solid var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:11, color:'var(--gray-400)' }}>
                Showing <strong>{filtered.length}</strong> of <strong>{myTxns.length}</strong> entries
              </div>
              <div style={{ display:'flex', gap:16 }}>
                <span style={{ fontSize:11, color:'var(--green)', fontWeight:700 }}>Total Inflow: {fmt(totalCredit)}</span>
                <span style={{ fontSize:11, color:'var(--red)', fontWeight:700 }}>Total Outflow: {fmt(totalDebit)}</span>
                <span style={{ fontSize:11, color:'var(--navy)', fontWeight:700 }}>Net: {fmt(netFlow)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
