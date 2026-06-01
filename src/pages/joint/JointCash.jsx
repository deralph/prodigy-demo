import React, { useState } from 'react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import HolderBanner from '../../components/ui/HolderBanner';
import WalletHero from '../../components/ui/WalletHero';
import TransactionList from '../../components/ui/TransactionList';
import ModalOverlay from '../../components/ui/ModalOverlay';
import DetailRow from '../../components/ui/DetailRow';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const QUICK_AMTS = [100000, 500000, 1000000, 5000000];

function FundModal({ onClose, account, onFund }) {
  const [amount, setAmount] = useState('');

  const handle = () => {
    if (!amount || isNaN(amount) || Number(amount) < 1000) return;
    onFund(Number(amount));
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={440}
      headerContent={<div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Fund Joint Wallet</div>}
    >
      <div style={{ background:'var(--gray-50)',borderRadius:10,padding:'16px',marginBottom:16,border:'1px solid var(--gray-200)' }}>
        <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:600 }}>Transfer to this joint account</div>
        <DetailRow label="Bank"         value={account.bank} />
        <DetailRow label="Account No"   value={account.acct} />
        <DetailRow label="Account Name" value={account.name} noBorder />
      </div>
      <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6,fontWeight:600 }}>Amount (₦)</div>
      <input type="number" placeholder="e.g. 500000" value={amount} onChange={e=>setAmount(e.target.value)}
        style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'12px 14px',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,outline:'none',marginBottom:10,color:'var(--navy)' }}
        onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
      <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap' }}>
        {QUICK_AMTS.map(q=>(
          <button key={q} onClick={()=>setAmount(String(q))} style={{ padding:'6px 12px',background:'rgba(13,27,53,0.06)',border:'1px solid var(--gray-200)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>{fmt(q)}</button>
        ))}
      </div>
      <button onClick={handle} disabled={!amount||Number(amount)<1000}
        style={{ width:'100%',padding:'13px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,opacity:(!amount||Number(amount)<1000)?0.5:1 }}>
        CONFIRM FUNDING
      </button>
    </ModalOverlay>
  );
}

export default function JointCash() {
  const { user, walletBalance, pendingBalance, transactions, allTransactions, addTransaction, clients } = useAppStore();
  const client   = clients.find(c => c.clientId === user?.clientId);
  const [fundOpen, setFundOpen] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [search,   setSearch]   = useState('');

  const ACCOUNT = {
    bank: 'Prodigy MFB',
    acct: '0234567890',
    name: `${user?.name || ''} & ${client?.secondaryName || 'Joint Holder'}`,
  };

  const myTxns  = allTransactions.filter(t => t.client === user?.name);
  const allTxns = [
    ...transactions.map(t => ({ ...t, _src:'wallet' })),
    ...myTxns.map(t => ({ ...t, _src:'investment' })),
  ].sort((a,b) => new Date(b.date) - new Date(a.date));

  const filtered = search
    ? allTxns.filter(t => `${t.description||''} ${t.ref||''} ${t.type||''}`.toLowerCase().includes(search.toLowerCase()))
    : allTxns;

  const copy = () => {
    navigator.clipboard.writeText(ACCOUNT.acct).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleFund = (amount) => {
    addTransaction({ id:'JWAL-'+Date.now(), date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), amount, description:'Joint Wallet Funding via Transfer', status:'Successful', ref:'JTRF-'+Math.random().toString(36).slice(2,8).toUpperCase() });
  };

  const downloadCSV = () => {
    const rows = allTxns.map(t => `"${t.date||''}","${t.ref||t.id||''}","${t.description||''}",${t.amount||0},"${t.status||''}"`);
    const blob = new Blob([`JOINT CASH LEDGER\nAccount: ${user?.name} & ${client?.secondaryName||'Joint Holder'}\n\nDate,Reference,Description,Amount,Status\n${rows.join('\n')}`], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `joint-cash-ledger-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const holders = [user?.name, client?.secondaryName].filter(Boolean);
  const totalFunded  = transactions.filter(t=>t.status==='Successful').reduce((s,t)=>s+t.amount,0);
  const totalSubbed  = myTxns.filter(t=>t.type==='subscription').reduce((s,t)=>s+t.amount,0);
  const totalPending = transactions.filter(t=>t.status==='Pending').reduce((s,t)=>s+t.amount,0);

  return (
    <div>
      <PageHeader title="Cash Account" subtitle="Joint Wallet · Dual-Holder Account" />

      <HolderBanner
        holders={holders}
        mandate={client?.mandate || 'AND'}
        action={
          <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.12)',padding:'3px 9px',borderRadius:4 }}>
            Joint Wallet
          </span>
        }
      />

      <WalletHero
        balance={walletBalance}
        pendingBalance={pendingBalance}
        label="Available Balance"
        onFund={() => setFundOpen(true)}
        account={ACCOUNT}
        copied={copied}
        onCopy={copy}
      />

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[['Total Funded',fmt(totalFunded),'var(--green)'],['Subscriptions',fmt(totalSubbed),'var(--navy)'],['Pending',fmt(totalPending),'var(--gold)']].map(([l,v,c])=>(
          <div key={l} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:c,marginBottom:4 }}>{v}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      <TransactionList
        transactions={filtered}
        title="Joint Transaction History"
        onExport={downloadCSV}
        showFilters={false}
      />

      {fundOpen && <FundModal onClose={() => setFundOpen(false)} account={ACCOUNT} onFund={handleFund} />}
    </div>
  );
}
