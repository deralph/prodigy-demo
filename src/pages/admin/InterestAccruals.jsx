import React, { useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

export default function InterestAccruals() {
  const { clientInvestments, plans } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState('all');

  const active = clientInvestments.filter(i => i.status === 'active');
  const filtered = selectedPlan === 'all' ? active : active.filter(i => i.planId === selectedPlan);

  const accrualFor = (inv) => {
    const plan = plans.find(p => p.id === inv.planId);
    if (!plan) return 0;
    const dailyRate = parseFloat(plan.roi) / 100 / 365;
    const valueDate = new Date(inv.valueDateRaw || inv.valueDate);
    const today = new Date();
    const days = Math.max(0, Math.floor((today - valueDate) / (1000*60*60*24)));
    return Math.round(inv.amount * dailyRate * days);
  };

  const totalAccrual = filtered.reduce((s,i) => s + accrualFor(i), 0);
  const grossAccrual = active.reduce((s,i) => s + accrualFor(i), 0);

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Interest Accruals</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Daily accrued interest per active investment</p>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Active Investments', val:active.length, color:'var(--navy)' },
          { label:'Total AUM',          val:fmt(active.reduce((s,i)=>s+i.amount,0)), color:'#3b82f6' },
          { label:'Gross Accrual',      val:fmt(grossAccrual), color:'var(--green)' },
          { label:'Filtered Accrual',   val:fmt(totalAccrual), color:'var(--gold)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:s.color,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:'flex',gap:8,marginBottom:18,flexWrap:'wrap' }} className="animate-in delay-2">
        <button onClick={()=>setSelectedPlan('all')} style={{ padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:selectedPlan==='all'?'var(--navy)':'white',color:selectedPlan==='all'?'white':'var(--gray-400)',border:`1px solid ${selectedPlan==='all'?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s' }}>All</button>
        {plans.map(p=>(
          <button key={p.id} onClick={()=>setSelectedPlan(p.id)} style={{ padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:selectedPlan===p.id?p.color:'white',color:selectedPlan===p.id?'white':'var(--gray-400)',border:`1px solid ${selectedPlan===p.id?p.color:'var(--gray-200)'}`,transition:'all 0.2s' }}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f4f6fa' }}>
                {['Client','Product','Principal','Value Date','Days','Daily Rate','Accrued Interest'].map(h=>(
                  <th key={h} style={{ padding:'11px 16px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const plan    = plans.find(p => p.id === inv.planId);
                const dailyR  = plan ? (parseFloat(plan.roi)/100/365) : 0;
                const valueDate = new Date(inv.valueDateRaw || inv.valueDate);
                const days    = Math.max(0, Math.floor((new Date() - valueDate)/(1000*60*60*24)));
                const accrued = Math.round(inv.amount * dailyR * days);
                return (
                  <tr key={inv.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'12px 16px',fontSize:13,fontWeight:600,color:'var(--navy)' }}>{inv.client}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:10,fontWeight:700,color:plan?.color||'#64748b',background:`${plan?.color||'#ccc'}15`,padding:'3px 8px',borderRadius:4 }}>{inv.plan}</span>
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:12,fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(inv.amount)}</td>
                    <td style={{ padding:'12px 16px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{inv.valueDate}</td>
                    <td style={{ padding:'12px 16px',fontSize:12,fontWeight:700,color:'#3b82f6' }}>{days}</td>
                    <td style={{ padding:'12px 16px',fontSize:11,color:'var(--gray-600)' }}>{plan ? `${(dailyR*100).toFixed(4)}%` : '—'}</td>
                    <td style={{ padding:'12px 16px',fontSize:13,fontWeight:700,color:'var(--green)',whiteSpace:'nowrap' }}>{fmt(accrued)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding:'12px 18px',borderTop:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <span style={{ fontSize:11,color:'var(--gray-400)' }}>{filtered.length} investments</span>
            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
              <TrendingUp size={13} color="var(--green)"/>
              <span style={{ fontSize:12,fontWeight:700,color:'var(--green)' }}>Total: {fmt(totalAccrual)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
