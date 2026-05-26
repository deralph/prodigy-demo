import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, X, Copy, Check, Users, Download, Search } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');
const TYPE_STYLE = {
  wallet_funding: { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  label:'Funding',      icon:ArrowDownLeft },
  subscription:   { color:'var(--navy)',  bg:'rgba(13,27,53,0.08)',  label:'Subscription', icon:ArrowUpRight },
  redemption:     { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',label:'Redemption',   icon:ArrowDownLeft },
};
const STATUS_STYLE = {
  successful: { color:'var(--green)', bg:'rgba(34,197,94,0.1)' },
  pending:    { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)' },
  failed:     { color:'var(--red)',   bg:'rgba(239,68,68,0.1)' },
};

export default function JointCash() {
  const { user, walletBalance, pendingBalance, transactions, allTransactions, addTransaction, clients } = useAppStore();
  const client = clients.find(c => c.clientId === user?.clientId);
  const [fundOpen, setFundOpen] = useState(false);
  const [amount, setAmount]     = useState('');
  const [copied, setCopied]     = useState(false);

  const myTxns = allTransactions.filter(t => t.client === user?.name);
  const allTxns = [
    ...transactions.map(t => ({ ...t, _src:'wallet' })),
    ...myTxns.map(t => ({ ...t, _src:'investment' })),
  ].sort((a,b) => new Date(b.date) - new Date(a.date));

  const ACCOUNT = { bank:'Prodigy MFB', acct:'0234567890', name:`${user?.name||''} & ${client?.secondaryName||'Joint Holder'}` };

  const [txSearch, setTxSearch] = useState('');

  const copy = () => { navigator.clipboard.writeText(ACCOUNT.acct).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const filteredTxns = txSearch ? allTxns.filter(t => `${t.description||''} ${t.ref||''} ${t.type||''}`.toLowerCase().includes(txSearch.toLowerCase())) : allTxns;

  const downloadCSV = () => {
    const headers = 'Date,Reference,Description,Type,Amount,Direction,Status';
    const rows = allTxns.map(t => {
      const ty = TYPE_STYLE[t.type] || TYPE_STYLE.wallet_funding;
      const dir = ty.icon === ArrowDownLeft ? 'CREDIT' : 'DEBIT';
      return `"${t.date||''}","${t.ref||t.id||''}","${t.description||ty.label}","${ty.label}",${t.amount||0},${dir},"${t.status||''}"`;
    });
    const blob = new Blob([`JOINT CASH LEDGER\nAccount: ${user?.name} & ${client?.secondaryName||'Joint Holder'}\n\n${headers}\n${rows.join('\n')}`], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `joint-cash-ledger-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFund = () => {
    if (!amount || isNaN(amount) || Number(amount)<1000) return;
    addTransaction({ id:'JWAL-'+Date.now(), date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), amount:Number(amount), description:'Joint Wallet Funding via Transfer', status:'Successful', ref:'JTRF-'+Math.random().toString(36).slice(2,8).toUpperCase() });
    setFundOpen(false); setAmount('');
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Cash Account</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Joint Wallet · Dual-Holder Account</p>
      </div>

      {/* Dual-holder banner */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10 }} className="animate-in">
        <Users size={14} color="var(--gold)"/>
        <span style={{ fontSize:12,color:'var(--navy)',fontWeight:600 }}>
          Primary: <strong>{user?.name}</strong>{client?.secondaryName&&<> &nbsp;•&nbsp; Secondary: <strong>{client.secondaryName}</strong></>}
        </span>
        <span style={{ marginLeft:'auto',fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.12)',padding:'3px 9px',borderRadius:4 }}>Joint Wallet</span>
      </div>

      {/* Balance hero */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'24px 28px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none' }} />
        <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
          <Wallet size={11} color="var(--gold)"/> Available Balance
        </p>
        <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,38px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>{fmt(walletBalance)}</h2>
        {pendingBalance>0 && <p style={{ fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:12 }}>+ {fmt(pendingBalance)} pending clearance</p>}
        <div style={{ display:'flex',gap:10,marginTop:12,flexWrap:'wrap' }}>
          <button onClick={()=>setFundOpen(true)} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--gold)',color:'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,border:'none',borderRadius:8,padding:'10px 18px',cursor:'pointer',letterSpacing:'0.06em' }}>
            <Plus size={13}/> FUND WALLET
          </button>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'8px 14px',cursor:'pointer' }} onClick={copy}>
            <div>
              <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Joint Account No</div>
              <div style={{ fontSize:12,fontWeight:700,color:'white' }}>{ACCOUNT.acct} · {ACCOUNT.bank}</div>
            </div>
            {copied?<Check size={13} color="var(--green)"/>:<Copy size={13} color="rgba(255,255,255,0.4)"/>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[
          { label:'Total Funded', val:fmt(transactions.filter(t=>t.status==='Successful').reduce((s,t)=>s+t.amount,0)), color:'var(--green)' },
          { label:'Subscriptions', val:fmt(myTxns.filter(t=>t.type==='subscription').reduce((s,t)=>s+t.amount,0)), color:'var(--navy)' },
          { label:'Pending', val:fmt(transactions.filter(t=>t.status==='Pending').reduce((s,t)=>s+t.amount,0)), color:'var(--gold)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:s.color,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'14px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',flex:1 }}>Joint Transaction History</h3>
          <div style={{ position:'relative' }}>
            <Search size={12} color="var(--gray-400)" style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
            <input placeholder="Search…" value={txSearch} onChange={e=>setTxSearch(e.target.value)}
              style={{ border:'1px solid #e2e8f0',borderRadius:7,padding:'7px 10px 7px 28px',fontSize:11,color:'var(--navy)',fontFamily:'DM Sans,sans-serif',outline:'none',width:140 }}/>
          </div>
          <button onClick={downloadCSV} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'#3b82f6',whiteSpace:'nowrap' }}>
            <Download size={12}/> Export CSV
          </button>
        </div>
        {filteredTxns.length===0 ? (
          <div style={{ padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No transactions yet</div>
        ) : filteredTxns.map((t,i) => {
          const ty = TYPE_STYLE[t.type]||TYPE_STYLE.wallet_funding;
          const st = STATUS_STYLE[(t.status||'').toLowerCase()]||STATUS_STYLE.pending;
          const Icon = ty.icon;
          return (
            <div key={t.id||i} style={{ padding:'14px 22px',borderBottom:i<filteredTxns.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:38,height:38,borderRadius:10,background:ty.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Icon size={16} color={ty.color}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)',marginBottom:2 }}>{t.description||ty.label}</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>Ref: {t.ref} · {t.date}</div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:ty.icon===ArrowDownLeft?'var(--green)':'var(--navy)',marginBottom:3 }}>
                  {ty.icon===ArrowDownLeft?'+':'-'}{fmt(t.amount)}
                </div>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'2px 7px',borderRadius:4 }}>{(t.status||'').toLowerCase()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fund modal */}
      {fundOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setFundOpen(false)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:440,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Fund Joint Wallet</div>
              <button onClick={()=>setFundOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              <div style={{ background:'var(--gray-50)',borderRadius:10,padding:'16px',marginBottom:16,border:'1px solid var(--gray-200)' }}>
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:600 }}>Transfer to this joint account</div>
                {[['Bank',ACCOUNT.bank],['Account No',ACCOUNT.acct],['Account Name',ACCOUNT.name]].map(([l,v])=>(
                  <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--gray-200)' }}>
                    <span style={{ fontSize:11,color:'var(--gray-400)' }}>{l}</span>
                    <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6,fontWeight:600 }}>Amount (₦)</div>
              <input type="number" placeholder="e.g. 500000" value={amount} onChange={e=>setAmount(e.target.value)}
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'12px 14px',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,outline:'none',marginBottom:14,color:'var(--navy)' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap' }}>
                {[100000,500000,1000000,5000000].map(q=>(
                  <button key={q} onClick={()=>setAmount(String(q))} style={{ padding:'6px 12px',background:'rgba(13,27,53,0.06)',border:'1px solid var(--gray-200)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>{fmt(q)}</button>
                ))}
              </div>
              <button onClick={handleFund} disabled={!amount||Number(amount)<1000} style={{ width:'100%',padding:'13px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,opacity:(!amount||Number(amount)<1000)?0.5:1 }}>
                CONFIRM FUNDING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
