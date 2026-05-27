import React, { useState, useRef } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, X, Copy, Check, Download, CreditCard, Building2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { walletApi } from '../../services/api';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const TYPE_STYLE = {
  wallet_funding:        { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  label:'Funding',      icon:ArrowDownLeft },
  subscription:          { color:'var(--navy)',  bg:'rgba(13,27,53,0.08)',  label:'Subscription', icon:ArrowUpRight  },
  redemption:            { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',label:'Redemption',   icon:ArrowDownLeft },
  wallet_withdrawal:     { color:'#f97316',      bg:'rgba(249,115,22,0.1)', label:'Withdrawal',   icon:ArrowUpRight  },
  pre_termination_payout:{ color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',label:'Pre-Term',     icon:ArrowDownLeft },
  dividend_payout:       { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  label:'Dividend',     icon:ArrowDownLeft },
};
const STATUS_STYLE = {
  successful: { color:'var(--green)', bg:'rgba(34,197,94,0.1)'      },
  pending:    { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)'     },
  failed:     { color:'#dc2626',      bg:'rgba(239,68,68,0.1)'       },
};
const INFLOW_TYPES = new Set(['wallet_funding','redemption','pre_termination_payout','dividend_payout']);

export default function CashAccount() {
  const { user, walletBalance, pendingBalance, transactions, refreshWallet } = useAppStore();
  const [fundOpen, setFundOpen]       = useState(false);
  const [fundTab, setFundTab]         = useState('card');   // 'card' | 'bank'
  const [amount, setAmount]           = useState('');
  const [copied, setCopied]           = useState(false);
  const [filterType, setFilterType]   = useState('all');
  const [psLoading, setPsLoading]     = useState(false);
  const [fundSuccess, setFundSuccess] = useState(false);
  const psRef = useRef(`WAL-PS-${Date.now()}`);

  const ACCOUNT = {
    bank: user?.virtualAccountBank || 'Prodigy MFB',
    acct: user?.virtualAccountNo  || user?.accountNumber || '—',
    name: user?.name || user?.email || '—',
  };

  /* ── Paystack inline config ───────────────────────────────── */
  const paystackConfig = {
    reference:  psRef.current,
    email:      user?.email || '',
    amount:     Math.round(Number(amount || 0) * 100), // kobo
    publicKey:  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    metadata:   { clientDbId: user?.id },
    channels:   ['card', 'bank', 'ussd', 'bank_transfer', 'qr'],
  };
  const initializePayment = usePaystackPayment(paystackConfig);

  /* ── Handlers ─────────────────────────────────────────────── */
  const openFund = () => {
    psRef.current = `WAL-PS-${Date.now()}`;
    setAmount(''); setFundSuccess(false); setFundOpen(true);
  };

  const handlePayWithCard = async () => {
    if (!amount || Number(amount) < 1000) return;
    setPsLoading(true);
    try {
      // Create PENDING record on backend for immediate admin visibility
      await walletApi.initiatePayment(Math.round(Number(amount) * 100));
    } catch { /* non-blocking — webhook will still credit on success */ }
    setPsLoading(false);

    initializePayment(
      async () => {
        // Paystack success callback — refresh wallet (webhook may have already fired)
        setFundSuccess(true);
        await refreshWallet();
        setTimeout(() => { setFundOpen(false); setFundSuccess(false); setAmount(''); }, 2500);
      },
      () => { /* closed without payment */ },
    );
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Derived transaction list ─────────────────────────────── */
  const filteredTxns = transactions.filter(t => {
    if (filterType === 'all')    return true;
    if (filterType === 'inflow') return INFLOW_TYPES.has(t.type);
    return !INFLOW_TYPES.has(t.type);
  });

  const downloadCSV = () => {
    const headers = ['Date','Reference','Description','Type','Amount','Status'];
    const rows = transactions.map(t => {
      const ty  = TYPE_STYLE[t.type] || TYPE_STYLE.wallet_funding;
      const dir = INFLOW_TYPES.has(t.type) ? 'INFLOW' : 'OUTFLOW';
      return [t.date||'', t.ref||'', (t.description||ty.label).replace(/,/g,' '), dir, t.amount, t.status||''].join(',');
    });
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `cash-ledger-${(user?.name||'account').replace(/\s/g,'-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── Stats ────────────────────────────────────────────────── */
  const totalFunded      = transactions.filter(t=>t.type==='wallet_funding'&&t.status==='successful').reduce((s,t)=>s+t.amount,0);
  const totalSubscribed  = transactions.filter(t=>t.type==='subscription'&&t.status==='successful').reduce((s,t)=>s+t.amount,0);
  const totalPending     = transactions.filter(t=>t.status==='pending').reduce((s,t)=>s+t.amount,0);

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Cash Account</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Wallet & Transaction History</p>
      </div>

      {/* Balance hero */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'24px 28px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none' }}/>
        <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
          <Wallet size={11} color="var(--gold)"/> Available Balance
        </p>
        <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,38px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>{fmt(walletBalance)}</h2>
        {pendingBalance > 0 && <p style={{ fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:12 }}>+ {fmt(pendingBalance)} pending</p>}
        <div style={{ display:'flex',gap:10,marginTop:12,flexWrap:'wrap' }}>
          <button onClick={openFund} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--gold)',color:'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,border:'none',borderRadius:8,padding:'10px 18px',cursor:'pointer',letterSpacing:'0.06em' }}>
            <Plus size={13}/> FUND WALLET
          </button>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'8px 14px',cursor:'pointer' }} onClick={()=>copy(ACCOUNT.acct)}>
            <div>
              <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Virtual Account</div>
              <div style={{ fontSize:12,fontWeight:700,color:'white' }}>{ACCOUNT.acct} · {ACCOUNT.bank}</div>
            </div>
            {copied ? <Check size={13} color="var(--green)"/> : <Copy size={13} color="rgba(255,255,255,0.4)"/>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[
          { label:'Total Funded',   val:fmt(totalFunded),     color:'var(--green)' },
          { label:'Subscriptions',  val:fmt(totalSubscribed), color:'var(--navy)'  },
          { label:'Pending',        val:fmt(totalPending),    color:'var(--gold)'  },
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
          </div>
        </div>
        {filteredTxns.length === 0 ? (
          <div style={{ padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No transactions yet</div>
        ) : filteredTxns.map((t,i) => {
          const ty   = TYPE_STYLE[t.type] || TYPE_STYLE.wallet_funding;
          const st   = STATUS_STYLE[t.status] || STATUS_STYLE.pending;
          const Icon = ty.icon;
          const isIn = INFLOW_TYPES.has(t.type);
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
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:isIn?'var(--green)':'var(--navy)',marginBottom:3 }}>
                  {isIn?'+':'-'}{fmt(t.amount)}
                </div>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'2px 7px',borderRadius:4 }}>{t.status}</span>
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
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Fund Wallet</div>
              <button onClick={()=>setFundOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>

            {fundSuccess ? (
              <div style={{ padding:'36px 24px',textAlign:'center' }}>
                <div style={{ width:56,height:56,borderRadius:'50%',background:'rgba(34,197,94,0.12)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}>
                  <Check size={24} color="var(--green)"/>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:6 }}>Payment Successful!</div>
                <p style={{ fontSize:12,color:'var(--gray-400)' }}>Your wallet is being credited. Balance will update shortly.</p>
              </div>
            ) : (
              <div style={{ padding:'22px 24px' }}>
                {/* Tab switcher */}
                <div style={{ display:'flex',background:'var(--gray-50)',borderRadius:9,border:'1px solid var(--gray-200)',overflow:'hidden',marginBottom:20 }}>
                  {[['card','Pay with Card','CreditCard'],['bank','Bank Transfer','Building2']].map(([k,l,_])=>(
                    <button key={k} onClick={()=>setFundTab(k)} style={{ flex:1,padding:'10px',border:'none',background:fundTab===k?'var(--navy)':'transparent',color:fundTab===k?'white':'var(--gray-500)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.04em',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all 0.15s' }}>
                      {k==='card' ? <CreditCard size={13}/> : <Building2 size={13}/>} {l}
                    </button>
                  ))}
                </div>

                {/* Amount input (shared) */}
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6,fontWeight:600 }}>Amount (₦)</div>
                <input type="number" placeholder="e.g. 500,000" value={amount} onChange={e=>setAmount(e.target.value)}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'12px 14px',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,outline:'none',marginBottom:10,color:'var(--navy)' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                <div style={{ display:'flex',gap:8,marginBottom:18,flexWrap:'wrap' }}>
                  {[100000,500000,1000000,5000000].map(q=>(
                    <button key={q} onClick={()=>setAmount(String(q))} style={{ padding:'5px 11px',background:'rgba(13,27,53,0.06)',border:'1px solid var(--gray-200)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>{fmt(q)}</button>
                  ))}
                </div>

                {fundTab === 'card' ? (
                  /* ── Paystack card payment ── */
                  <div>
                    <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:14,lineHeight:1.5 }}>
                      You will be redirected to Paystack's secure payment page to complete your payment via card, bank transfer, USSD, or QR code.
                    </p>
                    <button onClick={handlePayWithCard} disabled={psLoading||!amount||Number(amount)<1000}
                      style={{ width:'100%',padding:'13px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:psLoading?'not-allowed':'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:7,opacity:(psLoading||!amount||Number(amount)<1000)?0.5:1 }}>
                      <CreditCard size={14}/> {psLoading ? 'LOADING…' : `PAY ${amount ? fmt(Number(amount)) : ''} SECURELY`}
                    </button>
                    <p style={{ fontSize:9,color:'var(--gray-400)',textAlign:'center',marginTop:10,letterSpacing:'0.06em' }}>SECURED BY PAYSTACK · SSL ENCRYPTED</p>
                  </div>
                ) : (
                  /* ── Bank / virtual account transfer ── */
                  <div>
                    <div style={{ background:'var(--gray-50)',borderRadius:10,padding:'16px',marginBottom:14,border:'1px solid var(--gray-200)' }}>
                      <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:10,fontWeight:600 }}>Transfer to this account</div>
                      {[['Bank', ACCOUNT.bank],['Account No', ACCOUNT.acct],['Account Name', ACCOUNT.name]].map(([l,v])=>(
                        <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--gray-200)' }}>
                          <span style={{ fontSize:11,color:'var(--gray-400)' }}>{l}</span>
                          <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{v}</span>
                        </div>
                      ))}
                      <button onClick={()=>copy(ACCOUNT.acct)} style={{ marginTop:10,display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',fontSize:11,color:'var(--navy)',fontWeight:700 }}>
                        {copied ? <Check size={12} color="var(--green)"/> : <Copy size={12}/>} {copied ? 'Copied!' : 'Copy Account Number'}
                      </button>
                    </div>
                    <p style={{ fontSize:11,color:'var(--gray-400)',lineHeight:1.5 }}>
                      Transfer the exact amount above. Your wallet will be credited automatically once the bank confirms receipt (usually within minutes).
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
