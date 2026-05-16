import React, { useState } from 'react';
import { ArrowLeft, Download, Search } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

export default function ClientInvestments() {
  const { clients, clientInvestments, plans } = useAppStore();
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const client = selected ? clients.find(c => c.clientId === selected) : null;
  const invs   = clientInvestments.filter(i => i.clientId === selected);

  const exportCSV = () => {
    const rows = invs.map(i => `"${i.client}","${i.plan}","${i.amount}","${i.tenor}","${i.valueDate}","${i.maturityDate}","${i.roi}%","${i.status}"`).join('\n');
    const blob = new Blob(['Client,Product,Amount,Tenor,Value Date,Maturity,ROI,Status\n'+rows],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`${(client?.name||client?.companyName||'client').replace(/\s/g,'_')}_investments.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredClients = clients.filter(c => {
    const name = (c.name || c.companyName || '').toLowerCase();
    return search === '' || name.includes(search.toLowerCase()) || c.clientId.toLowerCase().includes(search.toLowerCase());
  });

  const statusColor = s => s==='active'?'var(--green)':s==='matured'?'#3b82f6':s==='pre_term'?'var(--gold)':'var(--gray-400)';
  const statusBg    = s => s==='active'?'rgba(34,197,94,0.1)':s==='matured'?'rgba(59,130,246,0.1)':s==='pre_term'?'rgba(232,184,75,0.12)':'var(--gray-100)';

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:4 }}>
          {client && (
            <button onClick={()=>setSelected(null)} style={{ background:'var(--gray-100)',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'var(--navy)' }}>
              <ArrowLeft size={13}/> Back
            </button>
          )}
          <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>
            {client ? (client.name || client.companyName) : 'Client Investments'}
          </h1>
        </div>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>
          {client ? `Full investment history · ${invs.length} records` : 'Select a client to view investment history'}
        </p>
      </div>

      {!client ? (
        <>
          <div style={{ position:'relative',marginBottom:18 }} className="animate-in delay-1">
            <Search size={14} color="var(--gray-400)" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
            <input placeholder="Search by name or ID…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px 10px 36px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}
              onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
          </div>
          <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
            {filteredClients.map((c,i)=>{
              const count   = clientInvestments.filter(inv=>inv.clientId===c.clientId).length;
              const total   = clientInvestments.filter(inv=>inv.clientId===c.clientId&&inv.status==='active').reduce((s,inv)=>s+inv.amount,0);
              return (
                <div key={c.clientId} style={{ padding:'14px 20px',borderBottom:i<filteredClients.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',transition:'background 0.15s' }}
                  onClick={()=>setSelected(c.clientId)}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
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
                    <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{count} investments</div>
                    {total>0 && <div style={{ fontSize:11,color:'var(--green)' }}>Active: {fmt(total)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
            {[
              { label:'Total Investments', val:invs.length, color:'var(--navy)' },
              { label:'Active AUM', val:fmt(invs.filter(i=>i.status==='active').reduce((s,i)=>s+i.amount,0)), color:'var(--green)' },
              { label:'Matured', val:invs.filter(i=>i.status==='matured').length, color:'#3b82f6' },
              { label:'Pre-terminated', val:invs.filter(i=>i.status==='pre_term').length, color:'var(--gold)' },
            ].map(s=>(
              <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:s.color,marginBottom:3 }}>{s.val}</div>
                <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10 }}>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <button onClick={()=>setPlanFilter('all')} style={{ padding:'6px 13px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:planFilter==='all'?'var(--navy)':'white',color:planFilter==='all'?'white':'var(--gray-400)',border:`1px solid ${planFilter==='all'?'var(--navy)':'var(--gray-200)'}` }}>All</button>
              {plans.map(p=><button key={p.id} onClick={()=>setPlanFilter(p.id)} style={{ padding:'6px 13px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:planFilter===p.id?p.color:'white',color:planFilter===p.id?'white':'var(--gray-400)',border:`1px solid ${planFilter===p.id?p.color:'var(--gray-200)'}` }}>{p.name}</button>)}
            </div>
            <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'white',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,color:'#3b82f6',fontFamily:'Syne,sans-serif' }}>
              <Download size={13}/> Export
            </button>
          </div>

          <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#f4f6fa' }}>
                  {['Product','Amount','Tenor','Value Date','Maturity','ROI','Tax','Status'].map(h=>(
                    <th key={h} style={{ padding:'11px 16px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {invs.filter(i=>planFilter==='all'||i.planId===planFilter).map(i=>(
                    <tr key={i.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:11,fontWeight:700,color:plans.find(p=>p.id===i.planId)?.color||'#64748b',background:`${plans.find(p=>p.id===i.planId)?.color||'#ccc'}15`,padding:'3px 8px',borderRadius:4 }}>{i.plan}</span>
                      </td>
                      <td style={{ padding:'12px 16px',fontSize:12,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(i.amount)}</td>
                      <td style={{ padding:'12px 16px',fontSize:11,color:'var(--gray-600)' }}>{i.tenor}</td>
                      <td style={{ padding:'12px 16px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{i.valueDate}</td>
                      <td style={{ padding:'12px 16px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{i.maturityDate}</td>
                      <td style={{ padding:'12px 16px',fontSize:11,color:'var(--green)',fontWeight:700 }}>{i.roi}%</td>
                      <td style={{ padding:'12px 16px',fontSize:11,color:'var(--gray-600)' }}>{i.tax}%</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'capitalize',color:statusColor(i.status),background:statusBg(i.status),padding:'3px 8px',borderRadius:4 }}>{i.status.replace('_',' ')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
