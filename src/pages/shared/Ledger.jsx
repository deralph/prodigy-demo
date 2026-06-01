import React, { useState, useMemo } from 'react';
import { Download, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, DollarSign, Layers, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import LedgerRow, { TYPE_META, STATUS_META } from '../../components/ui/LedgerRow';
import LedgerFilterBar from '../../components/ui/LedgerFilterBar';
import ChartCard from '../../components/charts/ChartCard';
import SectionCard from '../../components/ui/SectionCard';

const fmt  = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const fmtK = n => { const v = Number(n || 0); if (v >= 1e9) return '₦' + (v / 1e9).toFixed(2) + 'B'; if (v >= 1e6) return '₦' + (v / 1e6).toFixed(2) + 'M'; if (v >= 1e3) return '₦' + (v / 1e3).toFixed(1) + 'K'; return fmt(v); };

function buildMonthlyChart(txns) {
  const months = {};
  txns.forEach(t => {
    const d   = new Date(t.date || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const lbl = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!months[key]) months[key] = { key, label: lbl, inflow: 0, outflow: 0 };
    const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
    if (meta.dir === 'credit') months[key].inflow  += (t.amount || 0);
    else                       months[key].outflow += (t.amount || 0);
  });
  return Object.values(months).sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
}

function buildProductBreakdown(txns, plans) {
  const map = {};
  txns.forEach(t => {
    if (!t.planId) return;
    const plan = plans.find(p => p.id === t.planId);
    const name = plan?.name || t.product || t.planId;
    if (!map[t.planId]) map[t.planId] = { name, color: plan?.color || '#3b82f6', total: 0, count: 0 };
    if (t.status === 'successful') map[t.planId].total += (t.amount || 0);
    map[t.planId].count++;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

const VIEW_MODES = [
  { key: 'list',    label: '≡ Ledger' },
  { key: 'chart',   label: '↗ Charts' },
  { key: 'product', label: '⊞ Products' },
];

export default function Ledger() {
  const { user, walletBalance, transactions, allTransactions, plans } = useAppStore();

  const myTxns = useMemo(() => {
    const wallet = transactions.map(t => ({ ...t, _src: 'wallet' }));
    const invest = allTransactions.filter(t => t.client === user?.name || t.clientId === user?.clientId).map(t => ({ ...t, _src: 'investment' }));
    return [...wallet, ...invest].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [transactions, allTransactions, user]);

  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [amtMin,        setAmtMin]        = useState('');
  const [amtMax,        setAmtMax]        = useState('');
  const [dirFilter,     setDirFilter]     = useState('all');
  const [viewMode,      setViewMode]      = useState('list');

  const filtered = useMemo(() => myTxns.filter(t => {
    const meta  = TYPE_META[t.type] || TYPE_META.wallet_funding;
    const txt   = `${t.ref || ''} ${t.client || ''} ${t.product || ''} ${t.description || ''}`.toLowerCase();
    return (
      (!search        || txt.includes(search.toLowerCase())) &&
      (typeFilter    === 'all' || t.type    === typeFilter) &&
      (statusFilter  === 'all' || t.status  === statusFilter) &&
      (productFilter === 'all' || t.planId  === productFilter) &&
      (dirFilter     === 'all' || meta.dir  === dirFilter) &&
      (!dateFrom || new Date(t.date) >= new Date(dateFrom)) &&
      (!dateTo   || new Date(t.date) <= new Date(dateTo)) &&
      (!amtMin   || (t.amount || 0) >= Number(amtMin)) &&
      (!amtMax   || (t.amount || 0) <= Number(amtMax))
    );
  }), [myTxns, search, typeFilter, statusFilter, productFilter, dirFilter, dateFrom, dateTo, amtMin, amtMax]);

  const totalCredit = filtered.filter(t => (TYPE_META[t.type] || TYPE_META.wallet_funding).dir === 'credit' && t.status === 'successful').reduce((s, t) => s + (t.amount || 0), 0);
  const totalDebit  = filtered.filter(t => (TYPE_META[t.type] || TYPE_META.wallet_funding).dir === 'debit'  && t.status === 'successful').reduce((s, t) => s + (t.amount || 0), 0);
  const pending     = filtered.filter(t => t.status === 'pending').reduce((s, t) => s + (t.amount || 0), 0);
  const netFlow     = totalCredit - totalDebit;

  const chartData    = useMemo(() => buildMonthlyChart(myTxns), [myTxns]);
  const productBreak = useMemo(() => buildProductBreakdown(myTxns, plans), [myTxns, plans]);
  const uniquePlans  = [...new Set(myTxns.filter(t => t.planId).map(t => t.planId))];

  const withBalance = useMemo(() => {
    let bal = walletBalance || 0;
    return [...filtered].reverse().map(t => {
      const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
      if (t.status === 'successful') {
        if (meta.dir === 'credit') bal += (t.amount || 0);
        else                       bal -= (t.amount || 0);
      }
      return { ...t, _runBalance: bal };
    }).reverse();
  }, [filtered, walletBalance]);

  const downloadCSV = () => {
    const rows = withBalance.map(t => {
      const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
      return [t.date || '', t.ref || t.id || '', meta.label, meta.dir.toUpperCase(), t.product || t.planId || '', t.amount || 0, t.status || '', t._runBalance || 0].join(',');
    });
    const csv  = ['Date,Reference,Type,Direction,Product,Amount,Status,Running Balance', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ledger-${user?.name?.replace(/\s/g, '-') || 'account'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setProductFilter('all'); setDirFilter('all'); setDateFrom(''); setDateTo(''); setAmtMin(''); setAmtMax(''); };

  const kpiStats = [
    { label: 'Total Inflow',   val: fmtK(totalCredit), color: 'var(--green)', icon: ArrowDownLeft },
    { label: 'Total Outflow',  val: fmtK(totalDebit),  color: 'var(--red)',   icon: ArrowUpRight },
    { label: 'Net Flow',       val: fmtK(netFlow),     color: netFlow >= 0 ? 'var(--green)' : 'var(--red)', icon: TrendingUp },
    { label: 'Pending',        val: fmtK(pending),     color: '#eab308',      icon: RefreshCcw },
    { label: 'Wallet Balance', val: fmtK(walletBalance || 0), color: 'var(--navy)', icon: DollarSign },
    { label: 'Total Entries',  val: filtered.length,   color: '#8b5cf6',      icon: Layers },
  ];

  return (
    <div>
      {/* Header with view toggle */}
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="animate-in">
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: 'var(--navy)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Account Ledger</h1>
          <p style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{filtered.length} transactions · Full inflow/outflow history</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VIEW_MODES.map(m => (
            <button key={m.key} onClick={() => setViewMode(m.key)} style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${viewMode === m.key ? 'var(--navy)' : '#e2e8f0'}`, background: viewMode === m.key ? 'var(--navy)' : 'white', color: viewMode === m.key ? 'white' : 'var(--navy)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>{m.label}</button>
          ))}
          <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 20 }} className="animate-in delay-1">
        {kpiStats.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
              <s.icon size={13} color={s.color} />
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <LedgerFilterBar
        filters={{ search, dirFilter, typeFilter, statusFilter, productFilter, dateFrom, dateTo, amtMin, amtMax }}
        setters={{ setSearch, setDirFilter, setTypeFilter, setStatusFilter, setProductFilter, setDateFrom, setDateTo, setAmtMin, setAmtMax }}
        plans={plans}
        uniquePlans={uniquePlans}
        onClear={clearFilters}
      />

      {/* Chart view */}
      {viewMode === 'chart' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-in">
          <ChartCard title="Monthly Inflow vs Outflow" subtitle="12-month trend of all credits and debits">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [fmt(v), n]} /><Legend />
                <Bar dataKey="inflow"  name="Inflow"  fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Outflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Net Flow Trend">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData.map(d => ({ ...d, net: d.inflow - d.outflow }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [fmt(v), 'Net Flow']} />
                <Area type="monotone" dataKey="net" name="Net Flow" stroke="var(--navy)" fill="rgba(13,27,53,0.07)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Product view */}
      {viewMode === 'product' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-in">
          <ChartCard title="Volume by Product">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productBreak} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                <XAxis type="number" tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={v => [fmt(v), 'Volume']} />
                <Bar dataKey="total" name="Volume" fill="var(--navy)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          {productBreak.map((p, i) => {
            const ptxns = filtered.filter(t => t.planId === plans.find(pl => pl.name === p.name)?.id);
            return (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: `1px solid ${p.color}25`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: `${p.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${p.color}20` }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {[['Total Volume', fmt(p.total)], ['Transactions', p.count]].map(([l, v]) => (
                      <div key={l} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
                        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, color: l === 'Total Volume' ? p.color : 'var(--navy)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {ptxns.slice(0, 5).map((t, j) => {
                  const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
                  const st   = STATUS_META[t.status] || STATUS_META.pending;
                  return (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: j < ptxns.length - 1 && j < 4 ? '1px solid var(--gray-100)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <meta.icon size={13} color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{meta.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{t.date || '—'} · {t.ref || t.id || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: meta.dir === 'credit' ? 'var(--green)' : 'var(--red)' }}>{meta.dir === 'credit' ? '+' : '-'}{fmt(t.amount)}</div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, padding: '1px 6px', borderRadius: 3 }}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-2">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 100px 80px 120px 120px', gap: 8, padding: '10px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
            {['Transaction', 'Type', 'Direction', 'Status', 'Amount', 'Running Balance'].map(h => (
              <div key={h} style={{ fontSize: 9, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {filtered.length === 0
            ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>No transactions match the current filters.</div>
            : withBalance.map((t, i) => {
                const plan = plans.find(p => p.id === t.planId);
                return <LedgerRow key={t.id || i} transaction={t} runBalance={t._runBalance} planName={plan?.name} planColor={plan?.color} isLast={i === withBalance.length - 1} />;
              })
          }
          {filtered.length > 0 && (
            <div style={{ padding: '12px 20px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Showing <strong>{filtered.length}</strong> of <strong>{myTxns.length}</strong> entries</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>Total Inflow: {fmt(totalCredit)}</span>
                <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>Total Outflow: {fmt(totalDebit)}</span>
                <span style={{ fontSize: 11, color: 'var(--navy)', fontWeight: 700 }}>Net: {fmt(netFlow)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
