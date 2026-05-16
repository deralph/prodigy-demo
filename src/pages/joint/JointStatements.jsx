import React, { useState } from 'react';
import { FileText, Download, ChevronDown, ChevronUp, Users, Filter } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt  = n => '₦' + Number(n).toLocaleString('en-NG');
const fmtD = s => s || '—';

const STATUS_STYLE = {
  active:   { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  label:'Active' },
  matured:  { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',label:'Matured' },
  pre_term: { color:'#f97316',      bg:'rgba(249,115,22,0.1)', label:'Pre-Term' },
};

export default function JointStatements() {
  const { user, clientInvestments, clients, allTransactions, plans } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId);
  const myInvs  = clientInvestments.filter(i => i.clientId === user?.clientId);
  const myTxns  = allTransactions.filter(t => t.client === user?.name);

  const [expanded,   setExpanded]   = useState(null);
  const [holderFilter, setHolderFilter] = useState('all');

  const holders = [
    { id:'all',       label:'All Holders' },
    { id:'primary',   label: user?.name || 'Primary' },
    { id:'secondary', label: client?.secondaryName || 'Secondary' },
  ];

  const totalAUM = myInvs.reduce((s,i)=>s+i.amount,0);

  const exportProductStatement = (inv) => {
    const txns   = myTxns.filter(t => t.planId === inv.planId || t.product === inv.plan);
    const gross  = (inv.amount * inv.roi) / 100;
    const tax    = (gross * inv.tax) / 100;
    const net    = gross - tax;
    const rows   = [
      `"Investment ID","${inv.id}"`,
      `"Product","${inv.plan}"`,
      `"Account Type","Joint Account"`,
      `"Primary Holder","${user?.name}"`,
      `"Secondary Holder","${client?.secondaryName || '—'}"`,
      `"Principal","${fmt(inv.amount)}"`,
      `"ROI Rate","${inv.roi}%"`,
      `"Withholding Tax","${inv.tax}%"`,
      `"Gross Return","${fmt(gross)}"`,
      `"Net Return","${fmt(net)}"`,
      `"Tenor","${inv.tenor}"`,
      `"Value Date","${inv.valueDate}"`,
      `"Maturity Date","${inv.maturityDate}"`,
      `"Status","${inv.status}"`,
      ``,
      `"Date","Action"`,
      ...(inv.history||[]).map(h=>`"${h.date}","${h.action}"`),
      ``,
      `"Transaction Date","Type","Amount","Status","Reference"`,
      ...txns.map(t=>`"${t.date}","${t.type}","${fmt(t.amount)}","${t.status}","${t.ref||''}"`),
    ];
    const blob = new Blob([rows.join('\n')], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download=`joint_${inv.plan.replace(/\s/g,'_')}_statement.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const rows = [
      `"Product","Principal","ROI%","Tax%","Gross Return","Net Return","Tenor","Value Date","Maturity","Status"`,
      ...myInvs.map(inv => {
        const gross = (inv.amount*inv.roi)/100;
        const net   = gross - (gross*inv.tax)/100;
        return `"${inv.plan}","${fmt(inv.amount)}","${inv.roi}%","${inv.tax}%","${fmt(gross)}","${fmt(net)}","${inv.tenor}","${inv.valueDate}","${inv.maturityDate}","${inv.status}"`;
      })
    ];
    const blob = new Blob([rows.join('\n')], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download=`joint_portfolio_statement.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Joint Statements</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Per-Product Statements · Dual-Holder Account</p>
      </div>

      {/* Dual-holder banner */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }} className="animate-in">
        <Users size={14} color="var(--gold)"/>
        <span style={{ fontSize:12,color:'var(--navy)',fontWeight:600 }}>
          Primary: <strong>{user?.name}</strong>
          {client?.secondaryName && <> &nbsp;•&nbsp; Secondary: <strong>{client.secondaryName}</strong></>}
        </span>
        <button onClick={exportAll} style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
          <Download size={12}/> Export All
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Joint AUM',    val:fmt(totalAUM),                                color:'var(--navy)' },
          { label:'Products',     val:myInvs.length,                                color:'var(--gold)' },
          { label:'Active',       val:myInvs.filter(i=>i.status==='active').length,  color:'var(--green)' },
          { label:'Transactions', val:myTxns.length,                                color:'#8b5cf6' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Holder filter */}
      <div style={{ display:'flex',gap:8,marginBottom:16,alignItems:'center' }} className="animate-in delay-2">
        <Filter size={12} color="var(--gray-400)"/>
        {holders.map(h=>(
          <button key={h.id} onClick={()=>setHolderFilter(h.id)}
            style={{ padding:'6px 12px',borderRadius:7,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:holderFilter===h.id?'var(--navy)':'white',color:holderFilter===h.id?'white':'var(--gray-400)',border:`1px solid ${holderFilter===h.id?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s' }}>
            {h.label}
          </button>
        ))}
      </div>

      {/* Per-product accordion statements */}
      <div style={{ display:'flex',flexDirection:'column',gap:12 }} className="animate-in delay-3">
        {myInvs.length===0 && (
          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No joint investment statements available.</div>
        )}
        {myInvs.map((inv) => {
          const plan   = plans.find(p=>p.id===inv.planId);
          const st     = STATUS_STYLE[inv.status]||STATUS_STYLE.active;
          const gross  = (inv.amount*inv.roi)/100;
          const tax    = (gross*inv.tax)/100;
          const net    = gross-tax;
          const isOpen = expanded===inv.id;
          const txns   = myTxns.filter(t => t.planId===inv.planId || t.product===inv.plan);
          return (
            <div key={inv.id} style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              <div style={{ height:4,background:plan?.color||'var(--navy)' }}/>
              {/* Header row */}
              <div style={{ padding:'16px 22px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',flexWrap:'wrap' }} onClick={()=>setExpanded(isOpen?null:inv.id)}>
                <div style={{ width:38,height:38,borderRadius:10,background:(plan?.color||'var(--navy)')+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <FileText size={16} color={plan?.color||'var(--navy)'}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)' }}>{inv.plan}</span>
                    <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'2px 7px',borderRadius:4 }}>{st.label}</span>
                    <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.1)',padding:'2px 7px',borderRadius:4 }}>Joint</span>
                  </div>
                  <div style={{ fontSize:11,color:'var(--gray-400)',marginTop:3 }}>
                    Principal: {fmt(inv.amount)} · ROI: {inv.roi}% · Maturity: {fmtD(inv.maturityDate)}
                  </div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--green)' }}>{fmt(net)}</div>
                  <div style={{ fontSize:10,color:'var(--gray-400)' }}>Est. Net Return</div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <button onClick={e=>{e.stopPropagation();exportProductStatement(inv);}} style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',background:'rgba(13,27,53,0.06)',border:'none',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>
                    <Download size={11}/> CSV
                  </button>
                  {isOpen ? <ChevronUp size={16} color="var(--gray-400)"/> : <ChevronDown size={16} color="var(--gray-400)"/>}
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ padding:'0 22px 20px',borderTop:'1px solid var(--gray-100)' }}>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'10px 20px',padding:'16px 0',borderBottom:'1px solid var(--gray-100)',marginBottom:14 }}>
                    {[['Investment ID',inv.id],['Principal',fmt(inv.amount)],['ROI Rate',`${inv.roi}%`],['Withholding Tax',`${inv.tax}%`],['Gross Return',fmt(gross)],['Net Return',fmt(net)],['Tenor',inv.tenor],['Value Date',fmtD(inv.valueDate)],['Maturity Date',fmtD(inv.maturityDate)],['Primary Holder',user?.name||'—'],['Secondary Holder',client?.secondaryName||'—'],['Mandate','AND Signatory']].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:2 }}>{l}</div>
                        <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Investment history */}
                  {inv.history && inv.history.length>0 && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:700 }}>Investment History</div>
                      {inv.history.map((h,i)=>(
                        <div key={i} style={{ display:'flex',gap:10,alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--gray-50)' }}>
                          <div style={{ width:6,height:6,borderRadius:'50%',background:plan?.color||'var(--gold)',flexShrink:0 }}/>
                          <span style={{ fontSize:12,color:'var(--navy)',fontWeight:500,flex:1 }}>{h.action}</span>
                          <span style={{ fontSize:11,color:'var(--gray-400)' }}>{h.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transactions for this product */}
                  {txns.length>0 && (
                    <div>
                      <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:700 }}>Transactions</div>
                      <div style={{ background:'var(--gray-50)',borderRadius:8,overflow:'hidden' }}>
                        {txns.map((t,i)=>(
                          <div key={i} style={{ padding:'10px 14px',borderBottom:i<txns.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{t.type==='subscription'?'Subscription':'Redemption'}</div>
                              <div style={{ fontSize:10,color:'var(--gray-400)' }}>{t.date} · Ref: {t.ref||'—'}</div>
                            </div>
                            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{fmt(t.amount)}</div>
                            <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--green)',background:'rgba(34,197,94,0.1)',padding:'2px 7px',borderRadius:4 }}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {txns.length===0 && <div style={{ fontSize:12,color:'var(--gray-400)',fontStyle:'italic' }}>No individual transactions recorded for this product.</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
