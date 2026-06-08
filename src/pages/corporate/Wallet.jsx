import React, { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import WalletBalanceCard from '../../components/wallet/WalletBalanceCard';
import FundWalletModal from '../../components/wallet/FundWalletModal';
import Toast from '../../components/ui/Toast';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLUMNS = [
  { key: 'date',        label: 'Date',           style: { fontSize: 12, color: 'var(--gray-600)', whiteSpace: 'nowrap' } },
  { key: 'id',          label: 'Transaction ID', style: { fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' } },
  { key: 'description', label: 'Description',    style: { fontSize: 12, color: 'var(--gray-600)' } },
  { key: 'amount',      label: 'Amount',         style: { fontSize: 13, fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }, render: v => fmt(v) },
  { key: 'ref',         label: 'Reference',      style: { fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-400)', whiteSpace: 'nowrap' } },
  { key: 'status',      label: 'Status',         render: v => <StatusBadge status={v} /> },
];

export default function CorporateWallet() {
  const { walletBalance, pendingBalance, transactions } = useAppStore();
  const [showFund, setShowFund] = useState(false);
  const [toast, setToast]       = useState(null);
  const dismissToast             = useCallback(() => setToast(null), []);

  const handleDone = useCallback(({ type, amount, ref, id }) => {
    if (type === 'success') {
      setToast({ type: 'success', title: 'Wallet Funded Successfully!', message: `${fmt(amount)} has been credited to your corporate wallet.`, sub: `Ref: ${ref}  ·  ID: ${id}` });
    } else {
      setToast({ type: 'error', title: 'Payment Cancelled', message: 'You closed the Paystack window. No charge was made.', sub: ref ? `Ref: ${ref}` : undefined });
    }
  }, []);

  const exportCSV = () => {
    const rows = transactions.map(t => `"${t.date}","${t.id}","${t.description}","${t.amount}","${t.ref}","${t.status}"`).join('\n');
    const blob = new Blob(['Date,ID,Description,Amount,Reference,Status\n' + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'corporate-wallet-transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Corporate Fund Management" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <WalletBalanceCard balance={walletBalance} label="Corporate Wallet Balance" onFund={() => setShowFund(true)} fundLabel="Fund Corporate Wallet" />
        <div className="card animate-in delay-2">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Awaiting Confirmation</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(20px,4vw,30px)', color: 'var(--navy)', marginBottom: 8 }}>{fmt(pendingBalance)}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>No pending transactions</div>
        </div>
      </div>

      <div className="card animate-in delay-3" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Transaction Logs</h3>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#3b6ef8', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Download size={13} /> Export CSV
          </button>
        </div>
        <DataTable columns={COLUMNS} rows={transactions} emptyMsg="No transactions yet." />
      </div>

      {showFund && <FundWalletModal onClose={() => setShowFund(false)} onDone={handleDone} />}
      <Toast toast={toast} onDismiss={dismissToast} />

      <style>{`@media(max-width:600px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
