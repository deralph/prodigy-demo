import React, { useState, useMemo } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, RefreshCcw, Layers } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import LedgerRow, { TYPE_META, STATUS_META } from '../../components/ui/LedgerRow';
import LedgerFilterBar from '../../components/ui/LedgerFilterBar';
import SearchFilterBar from '../../components/ui/SearchFilterBar';

const fmt  = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const fmtK = n => { const v = Number(n || 0); if (v >= 1e9) return '₦' + (v / 1e9).toFixed(2) + 'B'; if (v >= 1e6) return '₦' + (v / 1e6).toFixed(2) + 'M'; return fmt(v); };

const KPI_COLS = [
  { label: 'Total Volume',   key: 'vol',  icon: DollarSign,   color: 'var(--navy)' },
  { label: 'Total Inflow',   key: 'in',   icon: TrendingUp,   color: 'var(--green)' },
  { label: 'Total Outflow',  key: 'out',  icon: TrendingDown, color: 'var(--red)' },
  { label: 'Pending',        key: 'pend', icon: RefreshCcw,   color: '#eab308' },
  { label: 'Client Count',   key: 'cls',  icon: Users,        color: '#3b82f6' },
  { label: 'Total Entries',  key: 'cnt',  icon: Layers,       color: '#8b5cf6' },
];

export default function TransactionLedger() {
  const { allTransactions, plans, clients } = useAppStore();

  const [search,        setSearch]        = useState('');
  const [clientSearch,  setClientSearch]  = useState('');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [amtMin,        setAmtMin]        = useState('');
  const [amtMax,        setAmtMax]        = useState('');
  const [dirFilter,     setDirFilter]     = useState('all');

  const clearFilters = () => { setSearch(''); setClientSearch(''); setTypeFilter('all'); setStatusFilter('all'); setProductFilter('all'); setDirFilter('all'); setDateFrom(''); setDateTo(''); setAmtMin(''); setAmtMax(''); };

  const filtered = useMemo(() => allTransactions.filter(t => {
    const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
    const txt  = `${t.ref || ''} ${t.client || ''} ${t.product || ''} ${t.description || ''}`.toLowerCase();
    return (
      (!search        || txt.includes(search.toLowerCase())) &&
      (!clientSearch  || (t.client || '').toLowerCase().includes(clientSearch.toLowerCase())) &&
      (typeFilter    === 'all' || t.type    === typeFilter) &&
      (statusFilter  === 'all' || t.status  === statusFilter) &&
      (productFilter === 'all' || t.planId  === productFilter) &&
      (dirFilter     === 'all' || meta.dir  === dirFilter) &&
      (!dateFrom || new Date(t.date) >= new Date(dateFrom)) &&
      (!dateTo   || new Date(t.date) <= new Date(dateTo)) &&
      (!amtMin   || (t.amount || 0) >= Number(amtMin)) &&
      (!amtMax   || (t.amount || 0) <= Number(amtMax))
    );
  }), [allTransactions, search, clientSearch, typeFilter, statusFilter, productFilter, dirFilter, dateFrom, dateTo, amtMin, amtMax]);

  const totalInflow  = filtered.filter(t => (TYPE_META[t.type] || TYPE_META.wallet_funding).dir === 'credit' && t.status === 'successful').reduce((s, t) => s + (t.amount || 0), 0);
  const totalOutflow = filtered.filter(t => (TYPE_META[t.type] || TYPE_META.wallet_funding).dir === 'debit'  && t.status === 'successful').reduce((s, t) => s + (t.amount || 0), 0);
  const totalPending = filtered.filter(t => t.status === 'pending').reduce((s, t) => s + (t.amount || 0), 0);
  const totalVol     = filtered.reduce((s, t) => s + (t.amount || 0), 0);
  const uniqueClients = new Set(filtered.map(t => t.clientId || t.client)).size;
  const uniquePlans  = [...new Set(allTransactions.filter(t => t.planId).map(t => t.planId))];

  const kpiValues = { vol: fmtK(totalVol), in: fmtK(totalInflow), out: fmtK(totalOutflow), pend: fmtK(totalPending), cls: uniqueClients, cnt: filtered.length };

  const downloadCSV = () => {
    const rows = filtered.map(t => {
      const meta = TYPE_META[t.type] || TYPE_META.wallet_funding;
      return [t.date || '', t.ref || t.id || '', t.client || '', meta.label, meta.dir.toUpperCase(), t.planId || '', t.amount || 0, t.status || ''].join(',');
    });
    const csv  = ['Date,Reference,Client,Type,Direction,Product ID,Amount,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `admin-ledger-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="animate-in">
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: 'var(--navy)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Transaction Ledger</h1>
          <p style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{filtered.length} entries · All clients · All account types</p>
        </div>
        <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#3b82f6', fontFamily: 'Syne,sans-serif', letterSpacing: '0.06em' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 20 }} className="animate-in delay-1">
        {KPI_COLS.map(k => (
          <div key={k.key} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{k.label}</div>
              <k.icon size={13} color={k.color} />
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: k.color }}>{kpiValues[k.key]}</div>
          </div>
        ))}
      </div>

      {/* Extra client search */}
      <div style={{ marginBottom: 10 }} className="animate-in delay-1">
        <SearchFilterBar search={clientSearch} onSearch={setClientSearch} placeholder="Filter by client name..." />
      </div>

      <LedgerFilterBar
        filters={{ search, dirFilter, typeFilter, statusFilter, productFilter, dateFrom, dateTo, amtMin, amtMax }}
        setters={{ setSearch, setDirFilter, setTypeFilter, setStatusFilter, setProductFilter, setDateFrom, setDateTo, setAmtMin, setAmtMax }}
        plans={plans}
        uniquePlans={uniquePlans}
        onClear={clearFilters}
      />

      {/* Ledger table */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-2">
        {/* Column headers — extra "Client" column for admin */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 80px 120px', gap: 8, padding: '10px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
          {['Transaction / Client', 'Client', 'Type', 'Direction', 'Status', 'Amount'].map(h => (
            <div key={h} style={{ fontSize: 9, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0
          ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>No transactions match filters.</div>
          : filtered.map((t, i) => {
              const meta  = TYPE_META[t.type] || TYPE_META.wallet_funding;
              const st    = STATUS_META[t.status] || STATUS_META.pending;
              const plan  = plans.find(p => p.id === t.planId);
              return (
                <div key={t.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 80px 120px', gap: 8, padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--gray-50)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${meta.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <meta.icon size={13} color={meta.color} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || meta.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{t.ref || t.id || '—'} · {t.date || '—'}{plan && <span style={{ marginLeft: 6, color: plan.color, fontWeight: 600 }}>· {plan.name}</span>}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--navy)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.client || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: `${meta.color}12`, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{meta.label}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ fontSize: 10, fontWeight: 700, color: meta.dir === 'credit' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase' }}>{meta.dir === 'credit' ? '↓ CR' : '↑ DR'}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 7px', borderRadius: 4 }}>{st.label}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: meta.dir === 'credit' ? 'var(--green)' : 'var(--red)' }}>{meta.dir === 'credit' ? '+' : '-'}{fmt(t.amount)}</span>
                  </div>
                </div>
              );
            })
        }
        {filtered.length > 0 && (
          <div style={{ padding: '12px 20px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Showing <strong>{filtered.length}</strong> of <strong>{allTransactions.length}</strong> total entries</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>Inflow: {fmt(totalInflow)}</span>
              <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>Outflow: {fmt(totalOutflow)}</span>
              <span style={{ fontSize: 11, color: 'var(--navy)', fontWeight: 700 }}>Total Vol: {fmt(totalVol)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
