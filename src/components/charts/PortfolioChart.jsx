import React from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import SectionCard from '../ui/SectionCard';

const fmtSmart = v => {
  if (!v && v !== 0) return '₦0';
  const abs = Math.abs(v);
  if (abs >= 1e9) return '₦' + (v / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return '₦' + (v / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return '₦' + (v / 1e3).toFixed(1) + 'K';
  return '₦' + v.toFixed(0);
};

/**
 * PortfolioChart — switchable area/line/bar chart with product filter.
 * Used in AssetPortfolio, JointPortfolio, and Treasury.
 *
 * Props:
 *   title          — card title
 *   subtitle       — card subtitle (optional)
 *   data           — recharts data array (must have 'month' key)
 *   products       — array of { id, name, color }
 *   chartFilter    — currently selected product id (or 'all')
 *   setChartFilter — setter
 *   chartType      — 'area' | 'line' | 'bar'
 *   setChartType   — setter
 *   height         — chart height (default 250)
 */
export default function PortfolioChart({ title, subtitle, data, products, chartFilter, setChartFilter, chartType, setChartType, height = 250 }) {
  const displayed = chartFilter === 'all' ? products : products.filter(p => p.id === chartFilter);

  const sharedProps = {
    data,
    children: null,
  };

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
      <YAxis tickFormatter={fmtSmart} tick={{ fontSize: 10 }} />
      <Tooltip formatter={v => [fmtSmart(v)]} />
      <Legend />
    </>
  );

  const titleAction = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <select
        value={chartFilter}
        onChange={e => setChartFilter(e.target.value)}
        style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: 11, color: 'var(--navy)', fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', outline: 'none' }}
      >
        <option value="all">All Products</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {['area', 'line', 'bar'].map(t => (
        <button
          key={t}
          onClick={() => setChartType(t)}
          style={{ padding: '6px 11px', borderRadius: 7, border: `1.5px solid ${chartType === t ? 'var(--navy)' : '#e2e8f0'}`, background: chartType === t ? 'var(--navy)' : 'white', color: chartType === t ? 'white' : 'var(--navy)', fontSize: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}
        >
          {t}
        </button>
      ))}
    </div>
  );

  const hasData = data.length > 0 && data.some(row => Object.keys(row).some(k => k !== 'month' && row[k] > 0));

  return (
    <SectionCard title={title} titleAction={titleAction} style={{ marginBottom: 22 }}>
      {subtitle && <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 16, marginTop: -8 }}>{subtitle}</p>}
      {hasData ? (
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'bar' ? (
            <BarChart data={data}>
              {axes}
              {displayed.map(p => <Bar key={p.id} dataKey={p.name} fill={p.color} radius={[3, 3, 0, 0]} />)}
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}>
              {axes}
              {displayed.map(p => <Line key={p.id} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={2.5} dot={{ r: 3 }} />)}
            </LineChart>
          ) : (
            <AreaChart data={data}>
              {axes}
              {displayed.map(p => <Area key={p.id} type="monotone" dataKey={p.name} stroke={p.color} fill={p.color + '22'} strokeWidth={2} />)}
            </AreaChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-400)', fontSize: 13 }}>
          No data yet. Invest in a product to see growth projections.
        </div>
      )}
    </SectionCard>
  );
}
