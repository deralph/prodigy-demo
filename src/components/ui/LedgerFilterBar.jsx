import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { TYPE_META, STATUS_META } from './LedgerRow';

/**
 * LedgerFilterBar — the full search + filter bar used in Ledger and TransactionLedger.
 *
 * Props:
 *   filters     — { search, dirFilter, typeFilter, statusFilter, productFilter, dateFrom, dateTo, amtMin, amtMax }
 *   setters     — { setSearch, setDirFilter, setTypeFilter, setStatusFilter, setProductFilter, setDateFrom, setDateTo, setAmtMin, setAmtMax }
 *   plans       — array of plan objects
 *   uniquePlans — array of planId strings present in data
 *   onClear     — () => void
 */
export default function LedgerFilterBar({ filters, setters, plans = [], uniquePlans = [], onClear }) {
  const [showFilters, setShowFilters] = useState(false);

  const activeCount = [
    filters.dirFilter !== 'all',
    filters.typeFilter !== 'all',
    filters.statusFilter !== 'all',
    filters.productFilter !== 'all',
    !!filters.dateFrom,
    !!filters.dateTo,
    !!filters.amtMin,
    !!filters.amtMax,
  ].filter(Boolean).length;

  const iStyle = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#1e293b', background: 'white', outline: 'none' };

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '14px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} color="var(--gray-400)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input placeholder="Search by ref, client, product…" value={filters.search} onChange={e => setters.setSearch(e.target.value)}
            style={{ ...iStyle, paddingLeft: 32, width: '100%' }} />
        </div>

        {[
          { value: filters.dirFilter,    set: setters.setDirFilter,    opts: [['all', 'All Directions'], ['credit', 'Credit (Inflow)'], ['debit', 'Debit (Outflow)']] },
          { value: filters.typeFilter,   set: setters.setTypeFilter,   opts: [['all', 'All Types'], ...Object.entries(TYPE_META).map(([k, v]) => [k, v.label])] },
          { value: filters.statusFilter, set: setters.setStatusFilter, opts: [['all', 'All Statuses'], ...Object.entries(STATUS_META).map(([k, v]) => [k, v.label])] },
        ].map((f, i) => (
          <select key={i} value={f.value} onChange={e => f.set(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
            {f.opts.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
          </select>
        ))}

        {uniquePlans.length > 0 && (
          <select value={filters.productFilter} onChange={e => setters.setProductFilter(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
            <option value="all">All Products</option>
            {uniquePlans.map(pid => {
              const p = plans.find(pl => pl.id === pid);
              return <option key={pid} value={pid}>{p?.name || pid}</option>;
            })}
          </select>
        )}

        <button
          onClick={() => setShowFilters(f => !f)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 13px', background: showFilters || activeCount > 0 ? 'var(--navy)' : 'white', color: showFilters || activeCount > 0 ? 'white' : 'var(--navy)', border: '1.5px solid var(--navy)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
        >
          <Filter size={12} /> Filters {activeCount > 0 && `(${activeCount})`}
        </button>

        {activeCount > 0 && (
          <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 11px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--gray-100)' }}>
          {[
            { label: 'From Date',      key: 'dateFrom', type: 'date',   val: filters.dateFrom, set: setters.setDateFrom },
            { label: 'To Date',        key: 'dateTo',   type: 'date',   val: filters.dateTo,   set: setters.setDateTo },
            { label: 'Min Amount (₦)', key: 'amtMin',   type: 'number', val: filters.amtMin,   set: setters.setAmtMin, ph: '0' },
            { label: 'Max Amount (₦)', key: 'amtMax',   type: 'number', val: filters.amtMax,   set: setters.setAmtMax, ph: 'No limit' },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5, fontWeight: 700 }}>{f.label}</div>
              <input type={f.type} value={f.val} placeholder={f.ph} onChange={e => f.set(e.target.value)} style={iStyle} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
