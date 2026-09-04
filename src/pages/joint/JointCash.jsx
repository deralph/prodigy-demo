import React, { useState, useCallback } from 'react';
import useAppStore, { getJointHolders, getJointMandate } from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import HolderBanner from '../../components/ui/HolderBanner';
import WalletHero from '../../components/ui/WalletHero';
import TransactionList from '../../components/ui/TransactionList';
import FundWalletModal from '../../components/wallet/FundWalletModal';
import WithdrawModal from '../../components/wallet/WithdrawModal';
import { csvRow } from '../../utils/csv';
import PendingCosignBanner from '../../components/wallet/PendingCosignBanner';
import Toast from '../../components/ui/Toast';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const INFLOW_TYPES = new Set(['wallet_funding','redemption','pre_termination_payout','dividend_payout']);

export default function JointCash() {
  const { user, walletBalance, pendingBalance, transactions, allTransactions, clientProfile, refreshWallet } = useAppStore();
  const client   = clientProfile || user?.client || {};
  const [fundOpen, setFundOpen]     = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [toast, setToast]       = useState(null);
  const dismissToast            = useCallback(() => setToast(null), []);

  const holderObjs = getJointHolders(client, user);
  const mandate    = getJointMandate(client, user);

  const ACCOUNT = {
    bank: user?.virtualAccountBank || 'Not assigned',
    acct: user?.virtualAccountNo   || user?.accountNumber || '—',
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

  const handleDone = useCallback(({ type, amount, ref }) => {
    if (type === 'success') {
      setToast({ type: 'success', title: 'Joint Wallet Funded!', message: `${fmt(amount)} has been credited.`, sub: `Ref: ${ref}` });
    } else {
      setToast({ type: 'error', title: 'Payment Cancelled', message: 'You closed the payment window. No charge was made.' });
    }
  }, []);

  const downloadCSV = () => {
    const rows = allTxns.map(t => csvRow(t.date||'', t.ref||t.id||'', t.description||'', t.amount||0, t.status||''));
    const blob = new Blob([`JOINT CASH LEDGER\nAccount: ${user?.name} & ${client?.secondaryName||'Joint Holder'}\n\n${csvRow('Date','Reference','Description','Amount','Status')}\n${rows.join('\n')}`], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `joint-cash-ledger-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const holders = [user?.name, client?.secondaryName].filter(Boolean);
  const totalFunded  = transactions.filter(t=>t.status==='successful').reduce((s,t)=>s+t.amount,0);
  const totalSubbed  = myTxns.filter(t=>t.type==='subscription').reduce((s,t)=>s+t.amount,0);
  const totalPending = transactions.filter(t=>t.status==='pending').reduce((s,t)=>s+t.amount,0);

  const handleWithdrawDone = useCallback(({ type, amount, requiresCoSign }) => {
    if (type === 'success') {
      setToast({
        type: 'success',
        title: requiresCoSign ? 'Awaiting Co-Signature' : 'Withdrawal Requested',
        message: requiresCoSign
          ? `${fmt(amount)} withdrawal submitted. The other account holder must log in to co-sign before it can be disbursed.`
          : `${fmt(amount)} withdrawal submitted for processing.`,
      });
    }
  }, []);

  return (
    <div>
      <PageHeader title="Cash Account" subtitle="Joint Wallet · Dual-Holder Account" />

      <HolderBanner
        holders={holders}
        mandate={mandate}
        action={
          <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.12)',padding:'3px 9px',borderRadius:4 }}>
            Joint Wallet
          </span>
        }
      />

      {mandate === 'AND' && <PendingCosignBanner onActed={refreshWallet} />}

      <WalletHero
        balance={walletBalance}
        pendingBalance={pendingBalance}
        label="Available Balance"
        onFund={() => setFundOpen(true)}
        onWithdraw={() => setWithdrawOpen(true)}
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

      {fundOpen && <FundWalletModal onClose={() => setFundOpen(false)} onDone={handleDone} />}
      {withdrawOpen && (
        <WithdrawModal
          onClose={() => setWithdrawOpen(false)}
          onDone={handleWithdrawDone}
          maxAmount={walletBalance}
          isJoint
          mandate={mandate}
          holderNames={holderObjs.map(h => h.name)}
        />
      )}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
