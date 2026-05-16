import React, { useState } from 'react';
import { Download, Search, Layers } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits:0 });
const typeColor = { wallet_funding:'#3b82f6', subscription:'#22c55e', redemption:'#f97316', disbursement:'#8b5cf6' };
const typeLabel = { wallet_funding:'Wallet Funding', subscription:'Subscription', redemption:'Redemption', disbursement:'Disbursement' };

export default function TransactionLedger() {
  const { allTransactions, plans } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'by_product'

  const filtered = allTransactions.filter(t => {
    const ms = search === '' || t.client.toLowerCase().includes(search.toLowerCase()) || t.ref.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'all' || t.type === typeFilter;
    const mp = productFilter === 'all' || t.planId === productFilter;
    return ms && mt && mp;
  });

  const total = filtered.reduce((s,t) => s + (t.status==='successful'?t.amount:0), 0);

  const exportCSV = () => {
    const rows = filtered.map(t => `"${t.date}","${t.id}","${t.client}","${t.clientType}","${typeLabel[t.type]||t.type}","${t.product||''}","${t.amount}","${t.ref}","${t.status}"`).join('\n');
    const blob = new Blob(['Date,ID,Client,Type,Account Type,Product,Amount,Reference,Status\n'+rows],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Group by product
  const productGroups = plans.map(p => ({
    plan: p,
    txns: allTransactions.filter(t => t.planId === p.id),
  })).filter(g => g.txns.length > 0);

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Transaction Ledger</h1>
            <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>All transactions — grouped by product or client</p>
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={()=>setViewMode(viewMode==='all'?'by_product':'all')} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:viewMode==='by_product'?'var(--navy)':'white',color:viewMode==='by_product'?'white':'var(--navy)',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Syne,sans-serif' }}>
              <Layers size={13}/> {viewMode==='by_product'?'All Transactions':'Group by Product'}
            </button>
            <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:'white',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,color:'#3b82f6',fontFamily:'Syne,sans-serif' }}>
              <Download size={13}/> Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Total Volume',    val: fmt(allTransactions.reduce((s,t)=>s+t.amount,0)), color:'var(--navy)' },
          { label:'Successful',      val: allTransactions.filter(t=>t.status==='successful').length, color:'var(--green)' },
          { label:'Pending',         val: allTransactions.filter(t=>t.status==='pending').length,    color:'var(--gold)' },
          { label:'Failed',          val: allTransactions.filter(t=>t.status==='failed').length,     color:'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:s.color,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {viewMode === 'by_product' ? (
        <div style={{ display:'flex',flexDirection:'column',gap:18 }} className="animate-in delay-2">
          {productGroups.map(g=>(
            <div key={g.plan.id} style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              <div style={{ padding:'14px 20px',background:`${g.plan.color}10`,borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:10,height:10,borderRadius:'50%',background:g.plan.color }}/>
                <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'var(--navy)' }}>{g.plan.name}</span>
                <span style={{ fontSize:11,color:'var(--gray-400)' }}>{g.txns.length} transactions</span>
                <span style={{ marginLeft:'auto',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:g.plan.color }}>{fmt(g.txns.reduce((s,t)=>s+(t.status==='successful'?t.amount:0),0))}</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'#f8fafc' }}>
                    {['Date','Client','Type','Amount','Reference','Status'].map(h=>(
                      <th key={h} style={{ padding:'9px 16px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {g.txns.map(t=>(
                      <tr key={t.id} style={{ borderTop:'1px solid var(--gray-100)' }}>
                        <td style={{ padding:'11px 16px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.date}</td>
                        <td style={{ padding:'11px 16px' }}>
                          <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{t.client}</div>
                          <div style={{ fontSize:10,color:'var(--gray-400)',textTransform:'uppercase' }}>{t.clientType}</div>
                        </td>
                        <td style={{ padding:'11px 16px' }}><span style={{ fontSize:9,fontWeight:700,color:typeColor[t.type]||'#64748b',background:`${typeColor[t.type]||'#ccc'}18`,padding:'2px 7px',borderRadius:4,letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{typeLabel[t.type]||t.type}</span></td>
                        <td style={{ padding:'11px 16px',fontSize:12,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(t.amount)}</td>
                        <td style={{ padding:'11px 16px',fontSize:10,fontFamily:'monospace',color:'var(--gray-400)',whiteSpace:'nowrap' }}>{t.ref}</td>
                        <td style={{ padding:'11px 16px' }}><StatusBadge status={t.status}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Controls */}
          <div style={{ display:'flex',gap:12,marginBottom:18,flexWrap:'wrap',alignItems:'center' }} className="animate-in delay-2">
            <div style={{ position:'relative',flex:1,minWidth:200 }}>
              <Search size={14} color="var(--gray-400)" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} />
              <input type="text" placeholder="Search client or reference..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px 10px 36px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'} />
            </div>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',cursor:'pointer' }}>
              <option value="all">All Types</option>
              <option value="wallet_funding">Wallet Funding</option>
              <option value="subscription">Subscription</option>
              <option value="redemption">Redemption</option>
            </select>
            <select value={productFilter} onChange={e=>setProductFilter(e.target.value)} style={{ border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',cursor:'pointer' }}>
              <option value="all">All Products</option>
              {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f4f6fa' }}>
                    {['Date','ID','Client','Product','Type','Amount','Reference','Status'].map(h=>(
                      <th key={h} style={{ padding:'11px 18px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'12px 18px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.date}</td>
                      <td style={{ padding:'12px 18px',fontSize:11,fontFamily:'monospace',fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{t.id}</td>
                      <td style={{ padding:'12px 18px' }}>
                        <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{t.client}</div>
                        <div style={{ fontSize:10,color:'var(--gray-400)',textTransform:'uppercase' }}>{t.clientType}</div>
                      </td>
                      <td style={{ padding:'12px 18px' }}>
                        {t.planId ? (
                          <span style={{ fontSize:10,fontWeight:700,color:plans.find(p=>p.id===t.planId)?.color||'#64748b',background:`${plans.find(p=>p.id===t.planId)?.color||'#ccc'}15`,padding:'3px 8px',borderRadius:4,letterSpacing:'0.04em',whiteSpace:'nowrap' }}>{t.product}</span>
                        ) : <span style={{ fontSize:10,color:'var(--gray-400)' }}>—</span>}
                      </td>
                      <td style={{ padding:'12px 18px' }}><span style={{ fontSize:10,fontWeight:700,color:typeColor[t.type]||'var(--gray-400)',background:`${typeColor[t.type]||'#ccc'}18`,padding:'3px 8px',borderRadius:4,letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{typeLabel[t.type]||t.type}</span></td>
                      <td style={{ padding:'12px 18px',fontSize:13,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(t.amount)}</td>
                      <td style={{ padding:'12px 18px',fontSize:11,fontFamily:'monospace',color:'var(--gray-400)',whiteSpace:'nowrap' }}>{t.ref}</td>
                      <td style={{ padding:'12px 18px' }}><StatusBadge status={t.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'12px 18px',borderTop:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontSize:11,color:'var(--gray-400)' }}>{filtered.length} records</span>
              <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>Filtered Volume: {fmt(total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
