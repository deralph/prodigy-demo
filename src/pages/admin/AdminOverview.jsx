import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, CheckSquare, CreditCard, ArrowRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import SectionCard from '../../components/ui/SectionCard';
import ApprovalItem from '../../components/ui/ApprovalItem';
import TransactionItem from '../../components/ui/TransactionItem';

export default function AdminOverview() {
  const { clients, approvals, allTransactions, user } = useAppStore();
  const navigate = useNavigate();
  const pending = approvals.filter(a => a.status === 'pending');
  const totalAUM = clients.reduce((s, c) => s + c.balance, 0);
  const recentTxns = [...allTransactions]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Admin Overview"
        subtitle="Prodigy Corporate System · Real-Time Dashboard"
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Clients" value={clients.length} sub={`${clients.filter(c => c.status === 'pending').length} pending verification`} color="#3b82f6" icon={Users} onClick={() => navigate('/admin/clients')} />
        <StatCard label="Total AUM" value={`₦${(totalAUM / 1000000).toFixed(1)}M`} sub="Across all portfolios" color="#22c55e" icon={TrendingUp} />
        <StatCard label="Pending Approvals" value={pending.length} sub="Requires action" color="#ef4444" icon={CheckSquare} onClick={() => navigate('/admin/approvals')} />
        <StatCard label="Total Transactions" value={allTransactions.length} sub={allTransactions.length > 0 ? 'View ledger' : 'None yet'} color="#e8b84b" icon={CreditCard} onClick={() => navigate('/admin/transactions')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Pending approvals */}
        <SectionCard
          className="animate-in delay-2"
          title="Approvals Queue"
          noPadding
          titleAction={
            <button onClick={() => navigate('/admin/approvals')} style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </button>
          }
        >
          {pending.length === 0 ? (
            <EmptyState icon={CheckSquare} compact title="All clear" message="No pending approvals at this time." />
          ) : (
            pending.slice(0, 4).map((a, i) => (
              <ApprovalItem
                key={a.id}
                approval={a}
                onReview={() => navigate('/admin/approvals')}
                isLast={i === Math.min(pending.length, 4) - 1}
              />
            ))
          )}
        </SectionCard>

        {/* Recent transactions */}
        <SectionCard className="animate-in delay-3" title="Recent Transactions" noPadding>
          {recentTxns.length === 0 ? (
            <EmptyState icon={CreditCard} compact title="No transactions yet" message="Transactions will appear here once clients begin activity." />
          ) : (
            recentTxns.map((t, i) => (
              <TransactionItem key={t.id || i} transaction={t} isLast={i === recentTxns.length - 1} />
            ))
          )}
        </SectionCard>
      </div>

      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 340px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
