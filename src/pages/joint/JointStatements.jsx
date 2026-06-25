import React, { useState } from 'react';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import useAppStore, { getJointMandate } from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import HolderBanner from '../../components/ui/HolderBanner';
import StatCard from '../../components/ui/StatCard';

const fmt  = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const STATUS_STYLE = {
  active:   { color:'var(--green)', bg:'rgba(34,197,94,0.1)',   label:'Active' },
  matured:  { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)', label:'Matured' },
  pre_term: { color:'#f97316',      bg:'rgba(249,115,22,0.1)',  label:'Pre-Term' },
};

/* ── Stat mini row ── */
function StatRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{value}</div>
    </div>
  );
}

/* ── Single statement accordion ── */
function StatementAccordion({ inv, plan, user, client, mandate, myTxns, isOpen, onToggle, onExport }) {
  const st     = STATUS_STYLE[inv.status] || STATUS_STYLE.active;
  const gross  = (inv.amount * inv.roi) / 100;
  const tax    = (gross * inv.tax) / 100;
  const net    = gross - tax;
  const txns   = myTxns.filter(t => t.planId === inv.planId || t.product === inv.plan);

  return (
    <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
      <div style={{ height:4,background:plan?.color||'var(--navy)' }}/>

      {/* Header row */}
      <div style={{ padding:'16px 22px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',flexWrap:'wrap' }} onClick={onToggle}>
        <div style={{ width:38,height:38,borderRadius:10,background:(plan?.color||'var(--navy)')+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <FileText size={16} color={plan?.color||'var(--navy)'}/>
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:2 }}>
            <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)' }}>{inv.plan}</span>
            <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'2px 7px',borderRadius:4 }}>{st.label}</span>
            <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.1)',padding:'2px 7px',borderRadius:4 }}>Joint</span>
          </div>
          <div style={{ fontSize:11,color:'var(--gray-400)' }}>
            Principal: {fmt(inv.amount)} · ROI: {inv.roi}% · Maturity: {inv.maturityDate || '—'}
          </div>
        </div>
        <div style={{ textAlign:'right',flexShrink:0 }}>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--green)' }}>{fmt(net)}</div>
          <div style={{ fontSize:10,color:'var(--gray-400)' }}>Est. Net Return</div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={e=>{e.stopPropagation();onExport(inv);}} style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',background:'rgba(13,27,53,0.06)',border:'none',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>
            <Download size={11}/> CSV
          </button>
          {isOpen ? <ChevronUp size={16} color="var(--gray-400)"/> : <ChevronDown size={16} color="var(--gray-400)"/>}
        </div>
      </div>

      {/* Expanded */}
      {isOpen && (
        <div style={{ padding:'0 22px 20px',borderTop:'1px solid var(--gray-100)' }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'10px 20px',padding:'16px 0',borderBottom:'1px solid var(--gray-100)',marginBottom:14 }}>
            {[['Investment ID',inv.id],['Principal',fmt(inv.amount)],['ROI Rate',`${inv.roi}%`],['WHT',`${inv.tax}%`],['Gross Return',fmt(gross)],['Net Return',fmt(net)],['Tenor',inv.tenor],['Value Date',inv.valueDate||'—'],['Maturity Date',inv.maturityDate||'—'],['Primary Holder',user?.name||'—'],['Secondary Holder',client?.secondaryName||'—'],['Mandate',`${mandate} Signatory`]].map(([l,v])=>(
              <StatRow key={l} label={l} value={v} />
            ))}
          </div>

          {/* Investment history */}
          {inv.history?.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:700 }}>Investment History</div>
              {inv.history.map((h,i)=>(
                <div key={i} style={{ display:'flex',gap:10,alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--gray-50)' }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:plan?.color||'var(--gold)',flexShrink:0 }}/>
                  <span style={{ fontSize:12,color:'var(--navy)',flex:1 }}>{h.action}</span>
                  <span style={{ fontSize:11,color:'var(--gray-400)' }}>{h.date}</span>
                </div>
              ))}
            </div>
          )}

          {/* Related transactions */}
          {txns.length > 0 && (
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
          {txns.length === 0 && <div style={{ fontSize:12,color:'var(--gray-400)',fontStyle:'italic' }}>No individual transactions recorded for this product.</div>}
        </div>
      )}
    </div>
  );
}

export default function JointStatements() {
  const { user, clientInvestments, clientProfile, allTransactions, plans } = useAppStore();
  const client  = clientProfile || user?.client || {};
  const mandate = getJointMandate(client, user);
  const myInvs  = clientInvestments.filter(i => i.clientId === user?.clientId);
  const myTxns  = allTransactions.filter(t => t.client === user?.name);

  const [expanded, setExpanded] = useState(null);

  const totalAUM = myInvs.reduce((s,i)=>s+i.amount,0);

  const exportStatement = (inv) => {
    const txns  = myTxns.filter(t=>t.planId===inv.planId||t.product===inv.plan);
    const gross = (inv.amount*inv.roi)/100;
    const net   = gross-(gross*inv.tax)/100;
    const rows  = [
      `"Product","${inv.plan}"`,`"Primary Holder","${user?.name}"`,`"Secondary Holder","${client?.secondaryName||'—'}"`,
      `"Principal","${fmt(inv.amount)}"`,`"Net Return","${fmt(net)}"`,`"Tenor","${inv.tenor}"`,`"Value Date","${inv.valueDate}"`,`"Maturity","${inv.maturityDate}"`,
      '','"Date","Action"',...(inv.history||[]).map(h=>`"${h.date}","${h.action}"`),
      '','"Date","Type","Amount","Status","Reference"',...txns.map(t=>`"${t.date}","${t.type}","${fmt(t.amount)}","${t.status}","${t.ref||''}"`),
    ];
    const blob = new Blob([rows.join('\n')],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download=`joint_${inv.plan.replace(/\s/g,'_')}_statement.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const rows = ['Product,Principal,ROI%,Tax%,Gross Return,Net Return,Tenor,Value Date,Maturity,Status',
      ...myInvs.map(inv=>{const g=(inv.amount*inv.roi)/100;const n=g-(g*inv.tax)/100;return`"${inv.plan}","${fmt(inv.amount)}","${inv.roi}%","${inv.tax}%","${fmt(g)}","${fmt(n)}","${inv.tenor}","${inv.valueDate}","${inv.maturityDate}","${inv.status}"`;})
    ];
    const blob=new Blob([rows.join('\n')],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='joint_portfolio_statement.csv';a.click();URL.revokeObjectURL(url);
  };

  const holderNames = [user?.name, client?.secondaryName].filter(Boolean);

  return (
    <div>
      <PageHeader title="Joint Statements" subtitle="Per-Product Statements · Dual-Holder Account" />

      <HolderBanner
        holders={holderNames}
        mandate={mandate}
        action={
          <button onClick={exportAll} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
            <Download size={12}/> Export All
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[['Joint AUM',fmt(totalAUM),'var(--navy)'],['Products',myInvs.length,'var(--gold)'],['Active',myInvs.filter(i=>i.status==='active').length,'var(--green)'],['Transactions',myTxns.length,'#8b5cf6']].map(([l,v,c])=>(
          <div key={l} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:c }}>{v}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Statements */}
      <div style={{ display:'flex',flexDirection:'column',gap:12 }} className="animate-in delay-3">
        {myInvs.length === 0 && (
          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>
            No joint investment statements available.
          </div>
        )}
        {myInvs.map(inv => {
          const plan = plans.find(p=>p.id===inv.planId);
          return (
            <StatementAccordion
              key={inv.id}
              inv={inv}
              plan={plan}
              user={user}
              client={client}
              mandate={mandate}
              myTxns={myTxns}
              isOpen={expanded===inv.id}
              onToggle={()=>setExpanded(expanded===inv.id?null:inv.id)}
              onExport={exportStatement}
            />
          );
        })}
      </div>
    </div>
  );
}
