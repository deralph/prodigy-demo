import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, X, Copy, Check, Download, Filter, Phone, MessageCircle, Mail } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const TYPE_STYLE = {
  wallet_funding: { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  label:'Funding',     icon:ArrowDownLeft },
  subscription:   { color:'var(--navy)',  bg:'rgba(13,27,53,0.08)',   label:'Subscription',icon:ArrowUpRight },
  redemption:     { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)', label:'Redemption',  icon:ArrowDownLeft },
};
const STATUS_STYLE = {
  successful: { color:'var(--green)', bg:'rgba(34,197,94,0.1)' },
  pending:    { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)' },
  failed:     { color:'var(--red)',   bg:'rgba(239,68,68,0.1)' },
};

export default function CashAccount() {
  const { user, walletBalance, pendingBalance, transactions, allTransactions, addTransaction } = useAppStore();
  const [fundOpen, setFundOpen]     = useState(false);
  const [amount, setAmount]         = useState('');
  const [copied, setCopied]         = useState(false);
  const [fundStep, setFundStep]     = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [contactOpen, setContactOpen] = useState(false);

  const myTxns = allTransactions.filter(t => t.client === user?.name);
  const allTxns = [
    ...transactions.map(t => ({ ...t, _source:'wallet' })),
    ...myTxns.map(t => ({ ...t, _source:'investment' })),
  ].sort((a,b) => new Date(b.date) - new Date(a.date));

  const filteredTxns = filterType === 'all' ? allTxns
    : filterType === 'inflow'  ? allTxns.filter(t => t._source === 'wallet' || t.type === 'redemption')
    : allTxns.filter(t => t.type === 'subscription');

  const downloadCSV = () => {
    const headers = ['Date','Reference','Description','Type','Amount','Status'];
    const rows = allTxns.map(t => {
      const ty = TYPE_STYLE[t.type] || TYPE_STYLE.wallet_funding;
      const dir = ty.icon === ArrowDownLeft ? 'INFLOW' : 'OUTFLOW';
      return [t.date||'', t.ref||'', (t.description||ty.label).replace(/,/g,' '), dir, t.amount, (t.status||'').toLowerCase()].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `cash-ledger-${user?.name?.replace(/\s/g,'-')||'account'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  const handleFund = () => {
    if (!amount || isNaN(amount) || Number(amount) < 1000) return;
    addTransaction({
      id: 'WAL-FT-' + Date.now(),
      date: new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}),
      amount: Number(amount),
      description: 'Wallet Funding via Bank Transfer',
      status: 'Successful',
      ref: 'TRF-' + Math.random().toString(36).slice(2,8).toUpperCase(),
    });
    setFundOpen(false); setAmount(''); setFundStep(1);
  };

  const ACCOUNT = { bank:'Prodigy MFB', acct: user?.accountNumber || '—', name: user?.name || user?.email || '—', sort:'000001' };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Cash Account</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Wallet & Transaction History · Single Account</p>
      </div>

      {/* Balance hero */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'24px 28px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none' }} />
        <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
          <Wallet size={11} color="var(--gold)"/> Available Balance
        </p>
        <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,38px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>{fmt(walletBalance)}</h2>
        {pendingBalance > 0 && <p style={{ fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:12 }}>+ {fmt(pendingBalance)} pending clearance</p>}
        <div style={{ display:'flex',gap:10,marginTop:12 }}>
          <button onClick={()=>setFundOpen(true)} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--gold)',color:'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,border:'none',borderRadius:8,padding:'10px 18px',cursor:'pointer',letterSpacing:'0.06em' }}>
            <Plus size={13}/> FUND WALLET
          </button>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'8px 14px',cursor:'pointer' }} onClick={()=>copy(ACCOUNT.acct)}>
            <div>
              <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Account No</div>
              <div style={{ fontSize:12,fontWeight:700,color:'white' }}>{ACCOUNT.acct} · {ACCOUNT.bank}</div>
            </div>
            {copied ? <Check size={13} color="var(--green)"/> : <Copy size={13} color="rgba(255,255,255,0.4)"/>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[
          { label:'Total Funded',     val:fmt(transactions.filter(t=>t.status==='Successful').reduce((s,t)=>s+t.amount,0)), color:'var(--green)' },
          { label:'Subscriptions',    val:fmt(myTxns.filter(t=>t.type==='subscription'&&t.status==='successful').reduce((s,t)=>s+t.amount,0)), color:'var(--navy)' },
          { label:'Pending',          val:fmt(transactions.filter(t=>t.status==='Pending').reduce((s,t)=>s+t.amount,0)), color:'var(--gold)' },
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
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Transaction History</h3>
          <div style={{ display:'flex',gap:6,marginLeft:'auto',flexWrap:'wrap' }}>
            <div style={{ display:'flex',background:'var(--gray-50)',borderRadius:7,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              {[['all','All'],['inflow','Inflow'],['outflow','Outflow']].map(([k,l])=>(
                <button key={k} onClick={()=>setFilterType(k)} style={{ padding:'6px 12px',border:'none',background:filterType===k?'var(--navy)':'transparent',color:filterType===k?'white':'var(--gray-400)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.04em' }}>{l}</button>
              ))}
            </div>
            <button onClick={downloadCSV} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
              <Download size={12}/> CSV
            </button>
            <button onClick={()=>setContactOpen(true)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(34,197,94,0.1)',color:'var(--green)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
              <Phone size={12}/> Contact Us
            </button>
          </div>
        </div>
        {filteredTxns.length === 0 ? (
          <div style={{ padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No transactions yet</div>
        ) : filteredTxns.map((t,i) => {
          const ty = TYPE_STYLE[t.type] || TYPE_STYLE.wallet_funding;
          const st = STATUS_STYLE[(t.status||'').toLowerCase()] || STATUS_STYLE.pending;
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

      {/* Contact Us Modal */}
      {contactOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setContactOpen(false)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:400,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Contact & Support</div>
              <button onClick={()=>setContactOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'24px',display:'flex',flexDirection:'column',gap:12 }}>
              <p style={{ fontSize:12,color:'var(--gray-400)',marginBottom:8 }}>Reach our team through any of these channels:</p>
              {[
                { icon:Mail,        label:'Email Support',     sub:'support@prodigyfinance.ng',     href:'mailto:support@prodigyfinance.ng',   bg:'rgba(59,130,246,0.08)', color:'#3b82f6' },
                { icon:MessageCircle, label:'WhatsApp Chat',  sub:'+234 800 000 0000',              href:'https://wa.me/2348000000000',        bg:'rgba(34,197,94,0.08)',  color:'var(--green)' },
                { icon:Phone,       label:'Call Us',           sub:'+234 800 000 0001',             href:'tel:+2348000000001',                bg:'rgba(13,27,53,0.06)',   color:'var(--navy)' },
              ].map(c=>(
                <a key={c.label} href={c.href} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:c.bg,border:`1px solid ${c.color}22`,borderRadius:12,textDecoration:'none',transition:'opacity 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  <div style={{ width:40,height:40,borderRadius:10,background:c.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <c.icon size={18} color="white"/>
                  </div>
                  <div>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:2 }}>{c.label}</div>
                    <div style={{ fontSize:11,color:'var(--gray-400)' }}>{c.sub}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fund modal */}
      {fundOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setFundOpen(false)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:440,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Fund Wallet</div>
              <button onClick={()=>setFundOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              <div style={{ background:'var(--gray-50)',borderRadius:10,padding:'16px',marginBottom:16,border:'1px solid var(--gray-200)' }}>
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:600 }}>Transfer to this account</div>
                {[['Bank',ACCOUNT.bank],['Account No',ACCOUNT.acct],['Account Name',ACCOUNT.name]].map(([l,v])=>(
                  <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--gray-200)' }}>
                    <span style={{ fontSize:11,color:'var(--gray-400)' }}>{l}</span>
                    <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{v}</span>
                  </div>
                ))}
                <button onClick={()=>copy(ACCOUNT.acct)} style={{ marginTop:10,display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',fontSize:11,color:'var(--navy)',fontWeight:700 }}>
                  {copied?<Check size={12} color="var(--green)"/>:<Copy size={12}/>} {copied?'Copied!':'Copy Account Number'}
                </button>
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
