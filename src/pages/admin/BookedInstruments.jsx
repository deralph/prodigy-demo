import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Search, TrendingUp, Calendar, DollarSign, Eye, X, FileText } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

export default function BookedInstruments() {
  const { clientInvestments, plans } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = clientInvestments.filter(inv => {
    const matchSearch = (inv.client||'').toLowerCase().includes(search.toLowerCase()) || (inv.id||'').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchPlan = planFilter === 'all' || inv.planId === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const totalPrincipal = filtered.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const activeCount = filtered.filter(i => i.status === 'active').length;
  const maturedCount = filtered.filter(i => i.status === 'matured').length;

  return (
    <div>
      <PageHeader
        title="Booked Instruments"
        subtitle="All investment instruments booked for clients"
      />

      {/* Summary Cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Total Instruments', value:filtered.length, icon:TrendingUp, color:'#3b82f6' },
          { label:'Active', value:activeCount, icon:Calendar, color:'var(--green)' },
          { label:'Matured', value:maturedCount, icon:Calendar, color:'var(--gold)' },
          { label:'Total Principal', value:fmt(totalPrincipal), icon:DollarSign, color:'var(--navy)' },
        ].map(card => (
          <div key={card.label} style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'16px 20px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:`${card.color}12`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <card.icon size={14} color={card.color}/>
              </div>
              <span style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)' }}>{card.label}</span>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'var(--navy)' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }} className="animate-in delay-1">
        <div style={{ position:'relative',flex:1,minWidth:220 }}>
          <Search size={14} color="var(--gray-400)" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
          <input type="text" placeholder="Search by client or ref..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px 10px 36px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}
            onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
        </div>
        <div style={{ position:'relative' }}>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{ border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 32px 10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',appearance:'none',cursor:'pointer' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="matured">Matured</option>
            <option value="pending">Pending</option>
          </select>
          <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--gray-400)',fontSize:11 }}>▾</span>
        </div>
        <div style={{ position:'relative' }}>
          <select value={planFilter} onChange={e=>setPlanFilter(e.target.value)}
            style={{ border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 32px 10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',appearance:'none',cursor:'pointer' }}>
            <option value="all">All Products</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--gray-400)',fontSize:11 }}>▾</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f4f6fa' }}>
                {['Ref','Client','Product','Principal','ROI','Tenor','Value Date','Maturity','Status',''].map(h => (
                  <th key={h} style={{ padding:'11px 14px',textAlign:'left',fontSize:9,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 14px',fontSize:12,fontWeight:600,color:'var(--navy)',fontFamily:'monospace' }}>{inv.id}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ fontWeight:600,fontSize:12,color:'var(--navy)' }}>{inv.client}</div>
                    <div style={{ fontSize:10,color:'var(--gray-400)' }}>{inv.clientId}</div>
                  </td>
                  <td style={{ padding:'12px 14px',fontSize:12,color:'var(--gray-600)' }}>{inv.plan}</td>
                  <td style={{ padding:'12px 14px',fontSize:12,fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(inv.amount)}</td>
                  <td style={{ padding:'12px 14px',fontSize:12,color:'var(--green)',fontWeight:600 }}>{inv.roi}%</td>
                  <td style={{ padding:'12px 14px',fontSize:12,color:'var(--gray-600)' }}>{inv.tenor}</td>
                  <td style={{ padding:'12px 14px',fontSize:11,color:'var(--gray-400)' }}>{inv.valueDate}</td>
                  <td style={{ padding:'12px 14px',fontSize:11,color:'var(--gray-400)' }}>{inv.maturityDate}</td>
                  <td style={{ padding:'12px 14px' }}><StatusBadge status={inv.status}/></td>
                  <td style={{ padding:'12px 14px' }}>
                    <button onClick={()=>setSelected(inv)} style={{ background:'rgba(59,130,246,0.1)',border:'none',borderRadius:6,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center' }}>
                      <Eye size={13} color="#3b82f6"/>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10}>
                  <EmptyState
                    icon={FileText}
                    title={clientInvestments.length === 0 ? "No booked instruments" : "No matching instruments"}
                    message={clientInvestments.length === 0 ? "Investment instruments will appear here once clients subscribe to products." : "Try adjusting your search or filters."}
                    compact
                  />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setSelected(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:520,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white' }}>{selected.plan}</h3>
                <p style={{ fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2 }}>{selected.id} · {selected.client}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {[
                ['Client', selected.client],
                ['Client ID', selected.clientId],
                ['Product', selected.plan],
                ['Principal', fmt(selected.amount)],
                ['ROI Rate', `${selected.roi}% p.a.`],
                ['Withholding Tax', `${selected.tax}%`],
                ['Tenor', selected.tenor],
                ['Value Date', selected.valueDate],
                ['Maturity Date', selected.maturityDate],
                ['Auto Rollover', selected.rollover ? 'Yes' : 'No'],
                ['Status', selected.status?.toUpperCase()],
                ['Booked By', selected.bookedBy || '—'],
                ['Notes', selected.notes || '—'],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)',textAlign:'right',maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
              {selected.history && selected.history.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:700 }}>History</div>
                  {selected.history.map((h,i) => (
                    <div key={i} style={{ display:'flex',gap:10,marginBottom:6,fontSize:12 }}>
                      <span style={{ color:'var(--gray-400)',minWidth:90 }}>{h.date}</span>
                      <span style={{ color:'var(--navy)',fontWeight:500 }}>{h.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
