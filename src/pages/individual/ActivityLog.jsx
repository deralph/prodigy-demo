import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Clock, Download, Filter, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { csvRow } from '../../utils/csv';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const TYPE_META = {
  wallet_funding: { label:'Wallet Funding',    color:'var(--green)', bg:'rgba(34,197,94,0.1)',  icon:ArrowDownLeft },
  subscription:   { label:'Subscription',      color:'var(--navy)',  bg:'rgba(13,27,53,0.08)',  icon:ArrowUpRight },
  redemption:     { label:'Redemption',         color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',icon:ArrowDownLeft },
  wallet:         { label:'Wallet',             color:'var(--green)', bg:'rgba(34,197,94,0.1)',  icon:ArrowDownLeft },
  account:        { label:'Account Activity',   color:'#8b5cf6',      bg:'rgba(139,92,246,0.1)', icon:Clock },
};
const STATUS_META = {
  successful: { color:'var(--green)', bg:'rgba(34,197,94,0.1)' },
  pending:    { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)' },
  failed:     { color:'var(--red)',   bg:'rgba(239,68,68,0.1)' },
};

export default function ActivityLog() {
  const { user, transactions, allTransactions, serverActivity } = useAppStore();
  const [typeFilter, setTypeFilter] = useState('all');

  const myInvTxns = allTransactions.filter(t => t.client === user?.name);
  const combined  = [
    ...transactions.map(t => ({ id:t.id, type:'wallet_funding', amount:t.amount, date:t.date, status:t.status?.toLowerCase(), description:t.description, ref:t.ref, product:'Wallet' })),
    ...myInvTxns.map(t => ({ ...t, status:t.status?.toLowerCase(), description:`${t.type==='subscription'?'Subscribed to':'Redemption from'} ${t.product}`, ref:t.ref })),
    // Server-recorded account activity (withdrawal requests, co-signs,
    // password changes, etc.) — broader coverage than just wallet/investment
    // transactions, sourced from the real ActivityLog table.
    ...serverActivity.map(a => ({ id:a.id, type:'account', amount:a.amount||0, date:a.time, status:'successful', description:a.description||a.action, ref:null, product:null })),
  ].sort((a,b) => new Date(b.date) - new Date(a.date));

  const filtered = typeFilter === 'all' ? combined : combined.filter(t => t.type === typeFilter);

  const exportCSV = () => {
    const rows = filtered.map(t => csvRow(t.date, t.type, t.description||'', fmt(t.amount), t.status, t.ref||''));
    const blob = new Blob([`${csvRow('Date','Type','Description','Amount','Status','Reference')}\n${rows.join('\n')}`], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='activity_log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="Full Transaction History · Single Account"
      />

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Total Activity', val:combined.length,                                          color:'var(--navy)' },
          { label:'Successful',     val:combined.filter(t=>t.status==='successful').length,        color:'var(--green)' },
          { label:'Pending',        val:combined.filter(t=>t.status==='pending').length,           color:'var(--gold)' },
          { label:'Failed',         val:combined.filter(t=>t.status==='failed').length,            color:'var(--red)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + export */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center' }} className="animate-in delay-2">
        <div style={{ display:'flex',alignItems:'center',gap:5 }}><Filter size={12} color="var(--gray-400)"/></div>
        {['all','wallet_funding','subscription','redemption','account'].map(f=>(
          <button key={f} onClick={()=>setTypeFilter(f)} style={{ padding:'6px 12px',borderRadius:7,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:typeFilter===f?'var(--navy)':'white',color:typeFilter===f?'white':'var(--gray-400)',border:`1px solid ${typeFilter===f?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s' }}>
            {f==='all'?'All':TYPE_META[f]?.label||f}
          </button>
        ))}
        <button onClick={exportCSV} style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:'white',border:'1px solid var(--gray-200)',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>
          <Download size={12}/> Export CSV
        </button>
      </div>

      {/* Activity list */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        {filtered.length === 0 ? (
          <div style={{ padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No activity found</div>
        ) : filtered.map((t,i) => {
          const ty  = TYPE_META[t.type] || TYPE_META.wallet_funding;
          const st  = STATUS_META[t.status] || STATUS_META.pending;
          const Icon = ty.icon;
          const isIn = t.type === 'wallet_funding' || t.type === 'redemption';
          return (
            <div key={t.id+i} style={{ padding:'14px 22px',borderBottom:i<filtered.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:38,height:38,borderRadius:10,background:ty.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Icon size={16} color={ty.color}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{t.description||ty.label}</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>
                  {t.ref && <span>Ref: {t.ref} · </span>}{t.date}
                  {t.product && t.product!=='Wallet' && <span style={{ color:'var(--navy)',fontWeight:600 }}> · {t.product}</span>}
                </div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:isIn?'var(--green)':'var(--red)',marginBottom:3 }}>
                  {isIn?'+':'-'}{fmt(t.amount)}
                </div>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'2px 7px',borderRadius:4 }}>{t.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
