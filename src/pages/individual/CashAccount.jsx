import React, { useState, useRef } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { CreditCard, Building2, X, Check, Copy } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { walletApi } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import WalletHero from '../../components/ui/WalletHero';
import TransactionList from '../../components/ui/TransactionList';
import ModalOverlay from '../../components/ui/ModalOverlay';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const INFLOW_TYPES = new Set(['wallet_funding','redemption','pre_termination_payout','dividend_payout']);

const QUICK_AMTS = [100000, 500000, 1000000, 5000000];

/* ── Fund modal tabs ── */
function FundModal({ onClose, user, onSuccess }) {
  const [tab, setTab]         = useState('card');
  const [amount, setAmount]   = useState('');
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(false);
  const psRef                 = useRef(`WAL-PS-${Date.now()}`);

  const ACCOUNT = {
    bank: user?.virtualAccountBank || 'Prodigy MFB',
    acct: user?.virtualAccountNo   || user?.accountNumber || '—',
    name: user?.name || user?.email || '—',
  };

  const initializePayment = usePaystackPayment({
    reference: psRef.current,
    email:     user?.email || '',
    amount:    Math.round(Number(amount || 0) * 100),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    metadata:  { clientDbId: user?.id },
    channels:  ['card','bank','ussd','bank_transfer','qr'],
  });

  const handlePayWithCard = async () => {
    if (!amount || Number(amount) < 1000) return;
    setLoading(true);
    try { await walletApi.initiatePayment(Math.round(Number(amount) * 100)); } catch {}
    setLoading(false);
    initializePayment(async () => { onSuccess(); onClose(); }, () => {});
  };

  const copy = () => {
    navigator.clipboard.writeText(ACCOUNT.acct).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={440}
      headerContent={<div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Fund Wallet</div>}
    >
      {/* Tab switcher */}
      <div style={{ display:'flex',background:'var(--gray-50)',borderRadius:9,border:'1px solid var(--gray-200)',overflow:'hidden',marginBottom:20 }}>
        {[['card','Pay with Card',CreditCard],['bank','Bank Transfer',Building2]].map(([k,l,Icon])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1,padding:'10px',border:'none',background:tab===k?'var(--navy)':'transparent',color:tab===k?'white':'var(--gray-500)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.04em',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all 0.15s' }}>
            <Icon size={13}/> {l}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6,fontWeight:600 }}>Amount (₦)</div>
      <input type="number" placeholder="e.g. 500,000" value={amount} onChange={e=>setAmount(e.target.value)}
        style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'12px 14px',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,outline:'none',marginBottom:10,color:'var(--navy)' }}
        onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
      <div style={{ display:'flex',gap:8,marginBottom:18,flexWrap:'wrap' }}>
        {QUICK_AMTS.map(q=>(
          <button key={q} onClick={()=>setAmount(String(q))} style={{ padding:'5px 11px',background:'rgba(13,27,53,0.06)',border:'1px solid var(--gray-200)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>{fmt(q)}</button>
        ))}
      </div>

      {tab === 'card' ? (
        <div>
          <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:14,lineHeight:1.5 }}>
            You'll be redirected to Paystack to complete payment via card, bank transfer, USSD, or QR.
          </p>
          <button onClick={handlePayWithCard} disabled={loading || !amount || Number(amount) < 1000}
            style={{ width:'100%',padding:'13px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:loading?'not-allowed':'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:7,opacity:(loading||!amount||Number(amount)<1000)?0.5:1 }}>
            <CreditCard size={14}/> {loading?'LOADING…':`PAY ${amount?fmt(Number(amount)):''} SECURELY`}
          </button>
          <p style={{ fontSize:9,color:'var(--gray-400)',textAlign:'center',marginTop:10,letterSpacing:'0.06em' }}>SECURED BY PAYSTACK · SSL ENCRYPTED</p>
        </div>
      ) : (
        <div>
          <div style={{ background:'var(--gray-50)',borderRadius:10,padding:'16px',marginBottom:14,border:'1px solid var(--gray-200)' }}>
            <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:10,fontWeight:600 }}>Transfer to this account</div>
            {[['Bank',ACCOUNT.bank],['Account No',ACCOUNT.acct],['Account Name',ACCOUNT.name]].map(([l,v])=>(
              <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--gray-200)' }}>
                <span style={{ fontSize:11,color:'var(--gray-400)' }}>{l}</span>
                <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{v}</span>
              </div>
            ))}
            <button onClick={copy} style={{ marginTop:10,display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',fontSize:11,color:'var(--navy)',fontWeight:700 }}>
              {copied?<Check size={12} color="var(--green)"/>:<Copy size={12}/>} {copied?'Copied!':'Copy Account Number'}
            </button>
          </div>
          <p style={{ fontSize:11,color:'var(--gray-400)',lineHeight:1.5 }}>Transfer the exact amount. Your wallet will be credited automatically once the bank confirms receipt.</p>
        </div>
      )}
    </ModalOverlay>
  );
}

export default function CashAccount() {
  const { user, walletBalance, pendingBalance, transactions, refreshWallet } = useAppStore();
  const [fundOpen,    setFundOpen]    = useState(false);
  const [filterType,  setFilterType]  = useState('all');
  const [copied,      setCopied]      = useState(false);

  const ACCOUNT = {
    bank: user?.virtualAccountBank || 'Prodigy MFB',
    acct: user?.virtualAccountNo || user?.accountNumber || '—',
    name: user?.name || user?.email || '—',
  };

  const copy = () => {
    navigator.clipboard.writeText(ACCOUNT.acct).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const filtered = transactions.filter(t => {
    if (filterType === 'all')    return true;
    if (filterType === 'inflow') return INFLOW_TYPES.has(t.type);
    return !INFLOW_TYPES.has(t.type);
  });

  const downloadCSV = () => {
    const headers = ['Date','Reference','Description','Type','Amount','Status'];
    const rows = transactions.map(t => {
      const dir = INFLOW_TYPES.has(t.type) ? 'INFLOW' : 'OUTFLOW';
      return [t.date||'',t.ref||'',t.description||dir,dir,t.amount,t.status||''].join(',');
    });
    const blob = new Blob([[headers.join(','),...rows].join('\n')], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `cash-ledger-${(user?.name||'account').replace(/\s/g,'-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const totalFunded     = transactions.filter(t=>t.type==='wallet_funding'&&t.status==='successful').reduce((s,t)=>s+t.amount,0);
  const totalSubscribed = transactions.filter(t=>t.type==='subscription'&&t.status==='successful').reduce((s,t)=>s+t.amount,0);
  const totalPending    = transactions.filter(t=>t.status==='pending').reduce((s,t)=>s+t.amount,0);

  return (
    <div>
      <PageHeader title="Cash Account" subtitle="Wallet & Transaction History" />

      <WalletHero
        balance={walletBalance}
        pendingBalance={pendingBalance}
        onFund={() => setFundOpen(true)}
        account={ACCOUNT}
        copied={copied}
        onCopy={copy}
      />

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[['Total Funded',fmt(totalFunded),'var(--green)'],['Subscriptions',fmt(totalSubscribed),'var(--navy)'],['Pending',fmt(totalPending),'var(--gold)']].map(([l,v,c])=>(
          <div key={l} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:c,marginBottom:4 }}>{v}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      <TransactionList
        transactions={filtered}
        onExport={downloadCSV}
        filterKey={filterType}
        onFilter={setFilterType}
      />

      {fundOpen && (
        <FundModal
          onClose={() => setFundOpen(false)}
          user={user}
          onSuccess={() => refreshWallet()}
        />
      )}
    </div>
  );
}
