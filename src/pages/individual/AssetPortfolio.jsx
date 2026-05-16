import React, { useState } from 'react';
import { TrendingUp, Eye, X, Download, ChevronRight } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt  = n => '₦' + Number(n).toLocaleString('en-NG');
const fmtN = n => Number(n).toLocaleString('en-NG');

const STATUS_STYLE = {
  active:   { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  label:'Active' },
  matured:  { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',label:'Matured' },
  pre_term: { color:'#f97316',      bg:'rgba(249,115,22,0.1)', label:'Pre-Term' },
};

export default function AssetPortfolio() {
  const { user, clientInvestments, plans } = useAppStore();
  const [viewing, setViewing] = useState(null);

  const myInvs = clientInvestments.filter(i => i.clientId === user?.clientId);
  const totalAUM = myInvs.reduce((s, i) => s + i.amount, 0);
  const activeAUM = myInvs.filter(i => i.status === 'active').reduce((s, i) => s + i.amount, 0);
  const activeCount = myInvs.filter(i => i.status === 'active').length;

  const avgRoi = myInvs.length
    ? (myInvs.reduce((s, i) => s + i.roi, 0) / myInvs.length).toFixed(1)
    : 0;

  const exportStatement = (inv) => {
    const rows = (inv.history || []).map(h => `"${h.date}","${h.action}","${fmt(inv.amount)}"`).join('\n');
    const blob = new Blob([`Date,Action,Amount\n${rows}`], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${inv.plan.replace(/\s/g,'_')}_statement.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Asset Portfolio</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Personal Investment Dashboard · Single Account</p>
      </div>

      {/* AUM Hero */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'24px 28px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none' }} />
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s infinite' }} /> Total Portfolio Value
            </p>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,38px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>{fmt(totalAUM)}</h2>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:5 }}>
              <TrendingUp size={12} color="var(--green)" />
              <span style={{ color:'var(--green)',fontWeight:600 }}>{avgRoi}% Average ROI Across {myInvs.length} Position{myInvs.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,textAlign:'right' }}>
            {[
              { label:'Active AUM',   val:fmt(activeAUM) },
              { label:'Positions',    val:`${activeCount} Active` },
            ].map(s=>(
              <div key={s.label}>
                <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase' }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--gold)',marginTop:2 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[
          { label:'Total Invested', val:fmt(totalAUM),       color:'var(--navy)' },
          { label:'Active Positions',val:`${activeCount}`,   color:'var(--green)' },
          { label:'Avg. ROI',       val:`${avgRoi}%`,         color:'var(--gold)' },
          { label:'Products',       val:`${[...new Set(myInvs.map(i=>i.planId))].length}`, color:'#8b5cf6' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Investment cards */}
      <div style={{ display:'flex',flexDirection:'column',gap:14 }} className="animate-in delay-3">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Active Holdings</h3>
        </div>
        {myInvs.length === 0 && (
          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>
            No investments found. Contact your relationship manager to get started.
          </div>
        )}
        {myInvs.map(inv => {
          const plan = plans.find(p => p.id === inv.planId);
          const st   = STATUS_STYLE[inv.status] || STATUS_STYLE.active;
          const grossReturn = (inv.amount * inv.roi) / 100;
          const tax         = (grossReturn * inv.tax) / 100;
          const netReturn   = grossReturn - tax;
          return (
            <div key={inv.id} style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              <div style={{ height:4,background:plan?.color||'var(--navy)' }} />
              <div style={{ padding:'18px 22px',display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap' }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)' }}>{inv.plan}</span>
                    <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'2px 7px',borderRadius:4 }}>{st.label}</span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'8px 20px',marginTop:8 }}>
                    {[
                      ['Principal',     fmt(inv.amount)],
                      ['ROI Rate',      `${inv.roi}%`],
                      ['Tax',           `${inv.tax}%`],
                      ['Tenor',         inv.tenor],
                      ['Value Date',    inv.valueDate],
                      ['Maturity',      inv.maturityDate],
                    ].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{l}</div>
                        <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)',marginTop:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Est. Net Return</div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'var(--green)',marginBottom:2 }}>{fmt(netReturn)}</div>
                  <div style={{ fontSize:11,color:'var(--gray-400)',marginBottom:12 }}>Gross: {fmt(grossReturn)} · Tax: {fmt(tax)}</div>
                  <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
                    <button onClick={()=>exportStatement(inv)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(13,27,53,0.06)',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>
                      <Download size={12}/> Statement
                    </button>
                    <button onClick={()=>setViewing(inv)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                      <Eye size={12}/> Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {viewing && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setViewing(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:500,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:plans.find(p=>p.id===viewing.planId)?.color||'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>{viewing.plan}</div>
              <button onClick={()=>setViewing(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.6)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {[
                ['Investment ID',  viewing.id],
                ['Principal',      fmt(viewing.amount)],
                ['ROI Rate',       `${viewing.roi}%`],
                ['Tax Rate',       `${viewing.tax}%`],
                ['Tenor',          viewing.tenor],
                ['Value Date',     viewing.valueDate],
                ['Maturity Date',  viewing.maturityDate],
                ['Status',         viewing.status],
                ['Gross Return',   fmt((viewing.amount*viewing.roi)/100)],
                ['Tax Deducted',   fmt(((viewing.amount*viewing.roi)/100*viewing.tax)/100)],
                ['Net Return',     fmt((viewing.amount*viewing.roi)/100-((viewing.amount*viewing.roi)/100*viewing.tax)/100)],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)',textTransform:'capitalize' }}>{v}</span>
                </div>
              ))}
              {viewing.history && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Investment History</div>
                  {viewing.history.map((h,i)=>(
                    <div key={i} style={{ display:'flex',gap:10,alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--gray-50)' }}>
                      <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--gold)',flexShrink:0 }} />
                      <span style={{ fontSize:11,color:'var(--navy)',fontWeight:500 }}>{h.action}</span>
                      <span style={{ fontSize:10,color:'var(--gray-400)',marginLeft:'auto' }}>{h.date}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>exportStatement(viewing)} style={{ marginTop:16,width:'100%',padding:'12px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                <Download size={14}/> DOWNLOAD STATEMENT
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
